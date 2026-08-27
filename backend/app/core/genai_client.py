import logging
from typing import Optional
from google import genai
from app.core.config import settings

logger = logging.getLogger("jansahayak.core.genai")


def get_genai_client() -> Optional[genai.Client]:
    """
    Returns configured Google GenAI client.
    Uses Google Cloud Vertex AI if GOOGLE_GENAI_USE_VERTEXAI=true,
    otherwise uses AI Studio GEMINI_API_KEY.
    """
    try:
        if settings.GOOGLE_GENAI_USE_VERTEXAI:
            logger.info(f"Initializing Google GenAI client with Vertex AI [Project: {settings.GCP_PROJECT_ID}, Location: {settings.GCP_LOCATION}]")
            return genai.Client(
                vertexai=True,
                project=settings.GCP_PROJECT_ID,
                location=settings.GCP_LOCATION,
            )
        elif settings.GEMINI_API_KEY:
            return genai.Client(api_key=settings.GEMINI_API_KEY)
    except Exception as e:
        logger.warning(f"Could not initialize GenAI client: {e}")
    return None
