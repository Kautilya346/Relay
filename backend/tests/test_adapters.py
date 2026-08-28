import pytest
from app.adapters import registry, AuthoritySandboxAdapter, RajasthanSamparkAdapter, SwachhataMohuaAdapter, CPGRAMSAdapter, VerifiedInstitutionalEmailAdapter


def test_authority_registry_registered():
    sandbox = registry.get("SANDBOX_SIMULATOR")
    assert sandbox is not None
    assert sandbox.authority_id == "SANDBOX_SIMULATOR"

    sampark = registry.get("RAJ_SAMPARK")
    assert sampark is not None

    swachhata = registry.get("SWACHHATA_MOHUA")
    assert swachhata is not None


def test_sandbox_adapter_lifecycle():
    adapter = AuthoritySandboxAdapter()
    
    # 1. Submit
    payload = {"category": "ROAD_DAMAGE", "description": "Large road crater on JLN Marg"}
    res = adapter.submit(payload)
    assert res.success is True
    assert res.external_case_id.startswith("EXT-")
    assert res.status == "ACKNOWLEDGED"

    ext_id = res.external_case_id

    # 2. Get Status
    status_res = adapter.get_status(ext_id)
    assert status_res.success is True
    assert status_res.status == "ACKNOWLEDGED"

    # 3. Send Follow-up
    followup_res = adapter.send_followup(ext_id, "Citizen requesting immediate action")
    assert followup_res.success is True
    assert followup_res.status == "IN_PROGRESS"

    # 4. Simulate Resolution
    resolve_res = adapter.simulate_resolution(ext_id, "https://example.com/repair.jpg")
    assert resolve_res.success is True
    assert resolve_res.status == "CLOSED"


def test_sampark_adapter_handoff():
    adapter = RajasthanSamparkAdapter(api_key=None)
    payload = {"category": "ROAD_DAMAGE", "description": "Damaged pavement", "latitude": 26.9, "longitude": 75.8}
    res = adapter.submit(payload)
    assert res.success is True
    assert res.handoff_required is True
    assert "sampark.rajasthan.gov.in" in res.handoff_url


def test_email_adapter_domain_allowlist(monkeypatch):
    from app.core.config import settings
    monkeypatch.setattr(settings, "TARGET_GRIEVANCE_EMAIL", "")
    monkeypatch.delenv("TARGET_GRIEVANCE_EMAIL", raising=False)
    adapter = VerifiedInstitutionalEmailAdapter()
    
    # Non-gov domain should be rejected
    invalid_payload = {"incidentId": "INC-1001", "description": "test", "recipient_email": "officer@randomgmail.com"}
    res = adapter.submit(invalid_payload)

    assert res.success is False
    assert "allowlist" in res.message

    # Verified gov domain should succeed
    valid_payload = {"incidentId": "INC-1001", "description": "test", "recipient_email": "ward.officer@jaipurmc.gov.in"}
    res_valid = adapter.submit(valid_payload)
    assert res_valid.success is True
    assert res_valid.external_case_id.startswith("MSG-EML-")
