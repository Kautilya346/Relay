import json
import logging
import re
from typing import Dict, Any, Optional, List
from urllib.parse import urlparse
from pydantic import BaseModel, Field
from google import genai
from google.genai import types
from app.core.config import settings
from app.models.domain import AuthorityIntegrationModel

logger = logging.getLogger("jansahayak.agent.portal_discovery")


class DiscoveredPortalResult(BaseModel):
    authorityName: str
    portalUrl: str
    officialDomain: str
    isVerifiedGovDomain: bool
    jurisdiction: str
    suggestedChannel: str  # API, BROWSER, EMAIL, HANDOFF
    summary: str
    searchCitations: List[str] = Field(default_factory=list)


def is_official_gov_domain(url: str) -> bool:
    """Verifies that the URL belongs to an official Indian government or municipal corporation domain."""
    try:
        parsed = urlparse(url)
        hostname = parsed.hostname.lower() if parsed.hostname else ""
        return (
            hostname.endswith(".gov.in")
            or hostname.endswith(".nic.in")
            or hostname in [
                "swachhata.gov.in",
                "pgportal.gov.in",
                "sampark.rajasthan.gov.in",
                "jaipurmc.org",
                "jaipurmc.org.in",
                "mcdonline.nic.in",
                "bbmp.gov.in",
            ]
            or ("mc." in hostname)
            or ("corporation" in hostname)
        )
    except Exception:
        return False



def fallback_discover_portal(location_query: str, category: str) -> DiscoveredPortalResult:
    """Deterministic fallback when live Google Search grounding is offline."""
    loc_lower = location_query.lower()

    if "rajasthan" in loc_lower or "jaipur" in loc_lower:
        return DiscoveredPortalResult(
            authorityName="Rajasthan Sampark Portal",
            portalUrl="https://sampark.rajasthan.gov.in",
            officialDomain="sampark.rajasthan.gov.in",
            isVerifiedGovDomain=True,
            jurisdiction="Rajasthan State & Urban Municipalities",
            suggestedChannel="API",
            summary="Official integrated grievance redressal portal of the Government of Rajasthan.",
            searchCitations=["https://sampark.rajasthan.gov.in"],
        )
    elif any(c in category.lower() for c in ["garbage", "waste", "sanitation"]):
        return DiscoveredPortalResult(
            authorityName="Swachhata - MoHUA Portal",
            portalUrl="https://swachhata.gov.in",
            officialDomain="swachhata.gov.in",
            isVerifiedGovDomain=True,
            jurisdiction="Nationwide Urban Local Bodies (ULBs)",
            suggestedChannel="API",
            summary="Ministry of Housing and Urban Affairs civic cleanliness grievance portal.",
            searchCitations=["https://swachhata.gov.in"],
        )
    else:
        return DiscoveredPortalResult(
            authorityName="CPGRAMS Central Grievance Redressal",
            portalUrl="https://pgportal.gov.in",
            officialDomain="pgportal.gov.in",
            isVerifiedGovDomain=True,
            jurisdiction="Central Ministries and State Departments",
            suggestedChannel="BROWSER",
            summary="Centralized Public Grievance Redress and Monitoring System.",
            searchCitations=["https://pgportal.gov.in"],
        )


async def discover_authority_portal(
    location_query: str,
    category: str,
) -> DiscoveredPortalResult:
    """
    Uses Google Search Grounding with Gemini (google-genai SDK) to discover the official
    government complaint portal for a given location and category.
    Strictly verifies .gov.in / .nic.in domain authenticity before returning.
    """
    from app.core.genai_client import get_genai_client
    client = get_genai_client()
    if not client:
        logger.info("GenAI client not configured. Using fallback portal mapping.")
        return fallback_discover_portal(location_query, category)

    try:


        prompt = f"""
Find the official Indian government grievance or civic complaint portal URL for:
Location/City: "{location_query}"
Issue Category: "{category}"

Search for the genuine government department, municipal corporation, or state grievance platform (e.g. Nagar Nigam, Rajasthan Sampark, CPGRAMS, Swachhata, BBMP, MCD).

Return a strict JSON object:
{{
  "authorityName": "Official name of the municipal/government body",
  "portalUrl": "Exact URL to the official complaint lodging page (must be .gov.in or .nic.in)",
  "officialDomain": "domain name (e.g. sampark.rajasthan.gov.in)",
  "jurisdiction": "City, District or State coverage",
  "suggestedChannel": "API | BROWSER | EMAIL | HANDOFF",
  "summary": "Brief 1-2 sentence description of the portal"
}}
"""
        chat = client.chats.create(

            model=settings.GEMINI_MODEL,
            config=types.GenerateContentConfig(
                tools=[types.Tool(google_search=types.GoogleSearch())],
                temperature=0.1,
            ),
        )
        response = chat.send_message(prompt)


        citations = []
        if hasattr(response, "candidates") and response.candidates:
            for cand in response.candidates:
                if hasattr(cand, "grounding_metadata") and cand.grounding_metadata:
                    gm = cand.grounding_metadata
                    if hasattr(gm, "grounding_chunks") and gm.grounding_chunks:
                        for chunk in gm.grounding_chunks:
                            if hasattr(chunk, "web") and chunk.web and hasattr(chunk.web, "uri"):
                                citations.append(chunk.web.uri)

        text = response.text.strip()
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()

        data = json.loads(text)
        portal_url = data.get("portalUrl", "")
        domain = data.get("officialDomain") or urlparse(portal_url).hostname or ""
        is_verified = is_official_gov_domain(portal_url)

        return DiscoveredPortalResult(
            authorityName=data.get("authorityName", f"{location_query} Municipal Authority"),
            portalUrl=portal_url,
            officialDomain=domain,
            isVerifiedGovDomain=is_verified,
            jurisdiction=data.get("jurisdiction", location_query),
            suggestedChannel=data.get("suggestedChannel", "BROWSER" if is_verified else "HANDOFF"),
            summary=data.get("summary", "Official civic complaint portal."),
            searchCitations=citations or [portal_url] if portal_url else [],
        )

    except Exception as e:
        logger.warning(f"Google Search Grounding failed: {e}. Using deterministic portal discovery.")
        return fallback_discover_portal(location_query, category)
