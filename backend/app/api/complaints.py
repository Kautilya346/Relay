import uuid
from fastapi import APIRouter, HTTPException, BackgroundTasks
from app.models.domain import ComplaintModel, ComplaintStatus, current_iso_timestamp
from app.schemas.api_schemas import ComplaintCreateRequest, ComplaintResponse
from app.repositories.db_repository import db
from app.services.complaint_processor import process_new_complaint

from fastapi import APIRouter, HTTPException, UploadFile, File
from app.services.storage_service import storage_service

router = APIRouter(prefix="/api/v1/complaints", tags=["Complaints"])


@router.post("/upload-evidence")
async def upload_evidence_file(file: UploadFile = File(...)):
    """Uploads evidence photo directly to Google Cloud Storage bucket."""
    file_bytes = await file.read()
    content_type = file.content_type or "image/jpeg"
    gcs_url = storage_service.upload_evidence(file_bytes, content_type=content_type)
    return {
        "success": True,
        "filename": file.filename,
        "gcsUrl": gcs_url,
        "message": "Evidence uploaded to Google Cloud Storage.",
    }


@router.post("", response_model=ComplaintResponse)
async def create_complaint(request: ComplaintCreateRequest):
    complaint_id = f"cmp_{uuid.uuid4().hex[:10]}"

    complaint = ComplaintModel(
        id=complaint_id,
        userId=request.userId,
        description=request.description,
        category=request.category or "Unclassified",
        latitude=request.latitude,
        longitude=request.longitude,
        imageUrls=request.imageUrls,
        status=ComplaintStatus.SUBMITTED
    )

    # Process complaint through taskmaster pipeline synchronously or asynchronously
    updated_complaint, matched_incident = await process_new_complaint(complaint)

    return ComplaintResponse(
        success=True,
        complaint=updated_complaint,
        message=f"Complaint created and attached to incident {matched_incident.id}"
    )


@router.get("/{complaint_id}", response_model=ComplaintResponse)
async def get_complaint(complaint_id: str):
    complaint = db.get_complaint(complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return ComplaintResponse(success=True, complaint=complaint)

