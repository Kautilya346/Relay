import sys
from pathlib import Path

# Ensure backend root is in sys.path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import uvicorn
from app.core.config import settings

if __name__ == "__main__":
    # loop="asyncio" forces SelectorEventLoop on Windows — required for Playwright subprocess support
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True, loop="asyncio")
