import sys
from pathlib import Path

# Ensure backend root directory is in sys.path when run directly
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import complaints, incidents, authority, admin, sandbox, intent, browser

app = FastAPI(
    title="JanSahayak API",
    description="Autonomous Event-Driven Civic Incident Detection, Aggregation and Escalation Platform",
    version="1.0.0"
)

# Enable CORS for configured origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Router Modules
app.include_router(complaints.router)
app.include_router(incidents.router)
app.include_router(authority.router)
app.include_router(admin.router)
app.include_router(sandbox.router)
app.include_router(intent.router)
app.include_router(browser.router)


@app.get("/")
async def root():
    return {
        "name": "JanSahayak Backend API",
        "status": "online",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
