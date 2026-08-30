import os
import uuid
import logging
from typing import Optional
from datetime import datetime, timezone, timedelta
from google.cloud import storage
from app.core.config import settings

logger = logging.getLogger("jansahayak.service.storage")


class CloudStorageService:
    """Production Google Cloud Storage evidence service."""

    def __init__(self, bucket_name: Optional[str] = None):
        self.bucket_name = bucket_name or settings.STORAGE_BUCKET_NAME
        self.client = None
        self.bucket = None
        try:
            self.client = storage.Client(project=settings.GCP_PROJECT_ID)
            self.bucket = self.client.bucket(self.bucket_name)
            logger.info(f"Connected to Google Cloud Storage [Bucket: {self.bucket_name}]")
        except Exception as e:
            logger.warning(f"Could not connect to live Cloud Storage ({e}). Using direct URL mode.")

    def upload_evidence(
        self,
        file_bytes: bytes,
        content_type: str = "image/jpeg",
        filename_prefix: str = "evidence",
    ) -> str:
        """Uploads binary image/file to GCS and returns a signed URL (7-day) or base64 data URL fallback."""
        if self.client and self.bucket:
            try:
                blob_name = f"{filename_prefix}/{datetime.now(timezone.utc).strftime('%Y/%m/%d')}/{uuid.uuid4().hex}.jpg"
                blob = self.bucket.blob(blob_name)
                blob.upload_from_string(file_bytes, content_type=content_type)

                # Try signed URL first (works even with uniform bucket-level access)
                try:
                    signed_url = blob.generate_signed_url(
                        expiration=timedelta(days=7),
                        method="GET",
                        version="v4",
                    )
                    if signed_url:
                        logger.info(f"GCS signed URL generated for {blob_name}")
                        return signed_url
                except Exception as sign_err:
                    logger.warning(f"Signed URL generation failed ({sign_err}), trying public URL...")

                # Fallback: try making public (requires bucket IAM allUsers storage.objectViewer)
                try:
                    blob.make_public()
                    if blob.public_url:
                        return blob.public_url
                except Exception:
                    pass

            except Exception as e:
                logger.warning(f"GCS upload failed ({e}). Falling back to base64 data URL.")

        import base64
        encoded = base64.b64encode(file_bytes).decode("utf-8")
        return f"data:{content_type};base64,{encoded}"





# Singleton instance
storage_service = CloudStorageService()
