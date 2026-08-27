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


async def _fill_if_present(page: Any, selector: str, value: str) -> None:
    locator = page.locator(selector)
    if await locator.count():
        await locator.first.fill(value)


async def start_shared_browser_session(
    incident_id: str,
    authority_id: str,
    portal_url: Optional[str] = None,
) -> BrowserSessionModel:
    incident = db.get_incident(incident_id)
    if not incident:
        raise ValueError(f"Incident {incident_id} not found.")

    authority = db.get_authority(authority_id)
    target_url = portal_url or (authority.portal_url if authority else "https://sampark.rajasthan.gov.in")
    session_id = f"BRW-{uuid.uuid4().hex[:8].upper()}"

    try:
        from playwright.async_api import async_playwright
    except ImportError as exc:
        raise ValueError("Playwright is not installed. Run 'pip install -r requirements.txt' and 'playwright install chromium'.") from exc

    # Keep the browser process alive between the start and resume API calls.
    playwright = await async_playwright().start()
    browser = await playwright.chromium.launch(headless=settings.BROWSER_HEADLESS)
    page = await browser.new_page()
    await page.goto(target_url, wait_until="domcontentloaded", timeout=settings.BROWSER_NAVIGATION_TIMEOUT_MS)

    description = incident.summary or f"{incident.category} reported at ({incident.centerLocation.latitude}, {incident.centerLocation.longitude})"
    department = "Municipal Solid Waste / Animal Carcass Removal"
    evidence = f"{description}. Location: latitude {incident.centerLocation.latitude}, longitude {incident.centerLocation.longitude}. Reports: {incident.reportCount}."
    await page.locator(settings.BROWSER_DEPARTMENT_SELECTOR).select_option(label=department)
    await _fill_if_present(page, settings.BROWSER_DESCRIPTION_SELECTOR, description)
    await _fill_if_present(page, settings.BROWSER_LATITUDE_SELECTOR, str(incident.centerLocation.latitude))
    await _fill_if_present(page, settings.BROWSER_LONGITUDE_SELECTOR, str(incident.centerLocation.longitude))
    await _fill_if_present(page, settings.BROWSER_EVIDENCE_SELECTOR, evidence)

    filled = {
        "department": department,
        "description": description,
        "latitude": str(incident.centerLocation.latitude),
        "longitude": str(incident.centerLocation.longitude),
        "evidence": evidence,
    }

    _browser_pages[session_id] = (playwright, browser, page)
    captcha_visible = await page.locator("iframe[src*='captcha'], [class*='captcha' i], [id*='captcha' i]").count() > 0
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
        raise ValueError(f"Browser session {session_id} not found.")

    browser_state = _browser_pages.get(session_id)
    if not browser_state:
        raise ValueError("Browser worker is no longer running; start a new browser session.")
    _, _, page = browser_state

    if human_input_key and human_input_value:
        session.filledFields[human_input_key] = human_input_value

    # Transition from CAPTCHA/OTP to final submission approval or completed
    if session.state in [BrowserHumanStateEnum.CAPTCHA_REQUIRED, BrowserHumanStateEnum.OTP_REQUIRED]:
        session.state = BrowserHumanStateEnum.USER_APPROVAL_REQUIRED
        session.message = "Human verification complete. Review pre-filled grievance details and approve final submission."
    elif session.state == BrowserHumanStateEnum.USER_APPROVAL_REQUIRED:
        await page.locator(settings.BROWSER_SUBMIT_SELECTOR).click()
        await page.wait_for_load_state("domcontentloaded", timeout=settings.BROWSER_NAVIGATION_TIMEOUT_MS)
        body_text = await page.locator("body").inner_text()
        receipt_match = re.search(settings.BROWSER_RECEIPT_PATTERN, body_text, re.IGNORECASE)
        if not receipt_match:
            raise ValueError("Portal submission completed without a recognizable government acknowledgment/reference number.")
        session.state = BrowserHumanStateEnum.SUBMITTED
        session.referenceNumber = receipt_match.group(1)
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
            lastResponse="Form submission confirmed by official portal session.",
        )
        db.save_external_case(ext_case)
        playwright, browser, _ = browser_state
        await browser.close()
        await playwright.stop()
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
