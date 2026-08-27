from datetime import datetime, timedelta, timezone
from app.models.domain import SLAModel, current_iso_timestamp


def calculate_initial_sla(severity: float, safety_risk: float) -> SLAModel:
    """Calculates SLA deadlines based on severity and safety risk."""
    now = datetime.now(timezone.utc)

    # High safety risk gets accelerated SLA (2h response, 12h resolution)
    if safety_risk >= 4.0:
        resp_hours = 2
        res_hours = 12
    elif severity >= 4.0:
        resp_hours = 4
        res_hours = 24
    else:
        resp_hours = 12
        res_hours = 48

    resp_deadline = (now + timedelta(hours=resp_hours)).isoformat()
    res_deadline = (now + timedelta(hours=res_hours)).isoformat()

    return SLAModel(
        responseDeadline=resp_deadline,
        resolutionDeadline=res_deadline,
        status="ON_TIME"
    )


def evaluate_sla_status(sla: SLAModel) -> str:
    """Checks current time against SLA deadlines."""
    now = datetime.now(timezone.utc)
    try:
        res_dt = datetime.fromisoformat(sla.resolutionDeadline)
        if res_dt.tzinfo is None:
            res_dt = res_dt.replace(tzinfo=timezone.utc)

        if now > res_dt:
            return "BREACHED"

        # Check if approaching (within 2 hours of deadline)
        time_left = (res_dt - now).total_seconds() / 3600.0
        if time_left <= 2.0:
            return "APPROACHING"

        return "ON_TIME"
    except Exception:
        return "ON_TIME"
