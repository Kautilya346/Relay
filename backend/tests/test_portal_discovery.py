import pytest
from app.agents.portal_discovery import (
    discover_authority_portal,
    fallback_discover_portal,
    is_official_gov_domain,
)


def test_is_official_gov_domain():
    assert is_official_gov_domain("https://sampark.rajasthan.gov.in/lodge.aspx") is True
    assert is_official_gov_domain("https://swachhata.gov.in/complaint") is True
    assert is_official_gov_domain("https://pgportal.gov.in/Registration") is True
    assert is_official_gov_domain("https://jaipurmc.org.gov.in/portal") is True
    assert is_official_gov_domain("https://random-scam-site.com/lodge") is False
    assert is_official_gov_domain("https://phishing-portal.net") is False


def test_fallback_discover_rajasthan_portal():
    result = fallback_discover_portal("Jaipur, Rajasthan", "Road & Potholes")
    assert result.isVerifiedGovDomain is True
    assert "sampark.rajasthan.gov.in" in result.portalUrl
    assert result.authorityName == "Rajasthan Sampark Portal"


def test_fallback_discover_sanitation_portal():
    result = fallback_discover_portal("New Delhi", "Sanitation & Garbage")
    assert result.isVerifiedGovDomain is True
    assert "swachhata.gov.in" in result.portalUrl


@pytest.mark.asyncio
async def test_discover_authority_portal_async():
    result = await discover_authority_portal("Jaipur", "Road & Potholes")
    assert result.authorityName is not None
    assert result.portalUrl.startswith("http")
    assert result.isVerifiedGovDomain is True
