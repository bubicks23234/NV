import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import BackgroundTasks, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .ai import process_lead_with_ai
from .config import get_settings
from .database import ai_assistant_enabled, create_lead, init_db, serialize_lead
from .schemas import LeadCreate
from .telegram_service import TelegramService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_SITE = BASE_DIR / "static" / "site"
telegram = TelegramService()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    settings = get_settings()

    if settings.proxy_enabled:
        os.environ["HTTP_PROXY"] = settings.proxy_url
        os.environ["HTTPS_PROXY"] = settings.proxy_url
        logger.info("Proxy configured for outbound requests")
    elif telegram.enabled:
        logger.info("PROXY_URL не задан — прямое подключение к Telegram API (OK для Render)")

    if telegram.enabled:
        try:
            await telegram.setup()
        except Exception as exc:
            logger.exception("Failed to set bot commands: %s", exc)

        if settings.webapp_url:
            webhook_url = f"{settings.webapp_url.rstrip('/')}/telegram/webhook"
            try:
                await telegram.set_webhook(webhook_url)
                logger.info("Telegram webhook set: %s", webhook_url)
            except Exception as exc:
                logger.exception("Failed to set Telegram webhook: %s", exc)
    yield


app = FastAPI(title=get_settings().app_name, lifespan=lifespan)

settings = get_settings()
origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health():
    return {"ok": True, "service": "novye-tehnologii", "bot": telegram.enabled}


@app.post("/api/leads")
async def submit_lead(payload: LeadCreate, background_tasks: BackgroundTasks):
    lead = create_lead(payload.name, payload.phone, payload.message)
    serialized = serialize_lead(lead)
    background_tasks.add_task(process_lead_with_ai, lead)
    background_tasks.add_task(telegram.notify_new_lead, serialized)
    return {"ok": True, "lead": serialized}


@app.post("/telegram/webhook")
async def telegram_webhook(request: Request, background_tasks: BackgroundTasks):
    if not telegram.enabled:
        return {"ok": True}
    update = await request.json()
    background_tasks.add_task(telegram.handle_update, update)
    return {"ok": True}


if STATIC_SITE.exists():
    app.mount("/assets", StaticFiles(directory=str(STATIC_SITE / "assets")), name="assets")

    @app.get("/")
    async def site_index():
        index = STATIC_SITE / "index.html"
        if index.exists():
            return FileResponse(index)
        raise HTTPException(status_code=404)

    @app.get("/{full_path:path}")
    async def site_fallback(full_path: str):
        if full_path.startswith(("api/", "telegram/")):
            raise HTTPException(status_code=404)
        candidate = STATIC_SITE / full_path
        if candidate.is_file():
            return FileResponse(candidate)
        index = STATIC_SITE / "index.html"
        if index.exists():
            return FileResponse(index)
        raise HTTPException(status_code=404)
