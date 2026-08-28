import os
from pathlib import Path
from dotenv import load_dotenv

# Load backend/.env file automatically
env_path = Path(__file__).resolve().parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# Ensure empty emulator variables are not passed to Google Cloud SDKs
if os.environ.get("FIRESTORE_EMULATOR_HOST") == "":
    del os.environ["FIRESTORE_EMULATOR_HOST"]
if os.environ.get("GOOGLE_APPLICATION_CREDENTIALS") == "":
    del os.environ["GOOGLE_APPLICATION_CREDENTIALS"]
elif os.environ.get("GOOGLE_APPLICATION_CREDENTIALS"):
    cred_val = os.environ["GOOGLE_APPLICATION_CREDENTIALS"].strip('"').strip("'")
    if not os.path.isabs(cred_val):
        curr_dir = Path(__file__).resolve().parent
        possible_paths = [
            curr_dir.parent.parent / cred_val,
            curr_dir.parent.parent / "backend" / cred_val,
            Path.cwd() / cred_val,
            Path.cwd() / "backend" / cred_val,
        ]
        for p in possible_paths:
            if p.exists():
                os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = str(p.resolve())
                break
    else:
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = cred_val




class Settings:
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.7-flash")
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", 8000))
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    CORS_ORIGINS: list = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS", "http://localhost:3000,http://localhost:5173"
        ).split(",")
        if origin.strip()
    ]
    GOOGLE_GENAI_USE_VERTEXAI: bool = os.getenv("GOOGLE_GENAI_USE_VERTEXAI", "false").lower() in ("true", "1", "yes")
    GCP_LOCATION: str = os.getenv("GCP_LOCATION", "us-central1")
    USE_LIVE_GCP: bool = os.getenv("USE_LIVE_GCP", "false").lower() in ("true", "1", "yes")
    GCP_PROJECT_ID: str = os.getenv("GCP_PROJECT_ID", "jansahayak-dev")
    GOOGLE_APPLICATION_CREDENTIALS: str = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "")
    STORAGE_BUCKET_NAME: str = os.getenv(
        "STORAGE_BUCKET_NAME", "jansahayak-evidence-storage"
    )
    FIRESTORE_DATABASE_ID: str = os.getenv("FIRESTORE_DATABASE_ID", "(default)")
    FIRESTORE_EMULATOR_HOST: str = os.getenv("FIRESTORE_EMULATOR_HOST", "")
    PUBSUB_TOPIC_PREFIX: str = os.getenv("PUBSUB_TOPIC_PREFIX", "jansahayak")
    SMTP_HOST: str = os.getenv("SMTP_HOST", "")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASS: str = os.getenv("SMTP_PASS", "")
    OFFICIAL_DISPATCH_SENDER_EMAIL: str = os.getenv("OFFICIAL_DISPATCH_SENDER_EMAIL", "")
    TARGET_GRIEVANCE_EMAIL: str = os.getenv("TARGET_GRIEVANCE_EMAIL", "")
    SWACHHATA_API_URL: str = os.getenv("SWACHHATA_API_URL", "")


    SWACHHATA_API_KEY: str = os.getenv("SWACHHATA_API_KEY", "")
    AUTHORITY_HTTP_TIMEOUT_SECONDS: float = float(os.getenv("AUTHORITY_HTTP_TIMEOUT_SECONDS", "20"))
    BROWSER_HEADLESS: bool = os.getenv("BROWSER_HEADLESS", "false").lower() in ("true", "1", "yes")
    BROWSER_NAVIGATION_TIMEOUT_MS: int = int(os.getenv("BROWSER_NAVIGATION_TIMEOUT_MS", "30000"))
    BROWSER_DEPARTMENT_SELECTOR: str = os.getenv("BROWSER_DEPARTMENT_SELECTOR", "select[name='department']")
    BROWSER_DESCRIPTION_SELECTOR: str = os.getenv("BROWSER_DESCRIPTION_SELECTOR", "textarea[name='description']")
    BROWSER_LATITUDE_SELECTOR: str = os.getenv("BROWSER_LATITUDE_SELECTOR", "input[name='latitude']")
    BROWSER_LONGITUDE_SELECTOR: str = os.getenv("BROWSER_LONGITUDE_SELECTOR", "input[name='longitude']")
    BROWSER_EVIDENCE_SELECTOR: str = os.getenv("BROWSER_EVIDENCE_SELECTOR", "textarea[name='evidence']")
    BROWSER_SUBMIT_SELECTOR: str = os.getenv("BROWSER_SUBMIT_SELECTOR", "button[type='submit']")
    BROWSER_RECEIPT_PATTERN: str = os.getenv("BROWSER_RECEIPT_PATTERN", r"(?:registration|reference|acknowledg(?:e)?ment)[^A-Z0-9]*([A-Z0-9][A-Z0-9/-]{4,})")



settings = Settings()

