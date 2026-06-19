import asyncio
import contextlib
import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import BackgroundTasks, Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .ai import process_lead_with_ai
from .auth import create_token, require_admin, verify_password
from .config import get_settings
from .database import (
    ai_assistant_enabled,
    create_lead,
    get_lead,
    init_db,
    list_leads,
    serialize_lead,
    set_setting,
    update_lead_status,
)
from .schemas import LeadCreate, LoginRequest, SettingsUpdate, StatusUpdate
from .telegram_service import TelegramService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_SITE = BASE_DIR / "static" / "site"
MINIAPP_DIR = BASE_DIR / "static" / "miniapp"
telegram = TelegramService()
_polling_task: asyncio.Task | None = None


async def _start_telegram(settings) -> None:
    global _polling_task
    if not telegram.enabled:
        logger.warning("TELEGRAM_BOT_TOKEN не задан — бот отключён")
        return

    use_polling = settings.telegram_mode.strip().lower() == "polling"

    if use_polling:
        await telegram.delete_webhook()
        _polling_task = asyncio.create_task(telegram.polling_loop())
        logger.info("Telegram mode: polling")
        return

    if settings.webapp_url:
        webhook_url = f"{settings.webapp_url.rstrip('/')}/telegram/webhook"
        try:
            await telegram.set_webhook(webhook_url)
            logger.info("Telegram webhook set: %s", webhook_url)
            return
        except Exception as exc:
            logger.exception("Webhook failed, fallback to polling: %s", exc)

    logger.warning("WEBAPP_URL не задан — запускаем polling")
    await telegram.delete_webhook()
    _polling_task = asyncio.create_task(telegram.polling_loop())


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _polling_task
    init_db()
    settings = get_settings()

    if settings.proxy_enabled:
        os.environ["HTTP_PROXY"] = settings.proxy_url
        os.environ["HTTPS_PROXY"] = settings.proxy_url
        logger.info("Proxy configured for outbound requests")
    elif telegram.enabled:
        logger.error("PROXY_URL не задан — Telegram-бот не сможет подключиться к API")

    await _start_telegram(settings)
    yield

    if _polling_task:
        _polling_task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await _polling_task


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
    return {"ok": True, "service": "novye-tehnologii"}


@app.get("/api/health/bot")
async def health_bot():
    return await telegram.status()


@app.post("/api/admin/bot/setup")
async def admin_bot_setup(_: None = Depends(require_admin)):
    settings = get_settings()
    if not telegram.enabled:
        raise HTTPException(status_code=400, detail="Бот не настроен")
    if settings.telegram_mode.strip().lower() == "polling":
        raise HTTPException(status_code=400, detail="Режим polling — webhook не нужен")
    if not settings.webapp_url:
        raise HTTPException(status_code=400, detail="Задайте WEBAPP_URL в переменных Amvera")
    webhook_url = f"{settings.webapp_url.rstrip('/')}/telegram/webhook"
    await telegram.set_webhook(webhook_url)
    return {"ok": True, "webhook_url": webhook_url}


@app.post("/api/leads")
async def submit_lead(payload: LeadCreate, background_tasks: BackgroundTasks):
    lead = create_lead(payload.name, payload.phone, payload.message)
    serialized = serialize_lead(lead)
    background_tasks.add_task(process_lead_with_ai, lead)
    background_tasks.add_task(telegram.notify_new_lead, serialized)
    return {"ok": True, "lead": serialized}


@app.post("/api/admin/login")
async def admin_login(payload: LoginRequest):
    if not verify_password(payload.password):
        raise HTTPException(status_code=401, detail="Неверный пароль")
    return {"token": create_token()}


@app.get("/api/admin/leads")
async def admin_leads(_: None = Depends(require_admin)):
    return {"items": [serialize_lead(row) for row in list_leads()]}


@app.get("/api/admin/leads/{lead_id}")
async def admin_lead(lead_id: int, _: None = Depends(require_admin)):
    lead = get_lead(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    return serialize_lead(lead)


@app.patch("/api/admin/leads/{lead_id}/status")
async def admin_lead_status(lead_id: int, payload: StatusUpdate, _: None = Depends(require_admin)):
    lead = update_lead_status(lead_id, payload.status)
    if not lead:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    return serialize_lead(lead)


@app.post("/api/admin/leads/{lead_id}/reanalyze")
async def admin_reanalyze(lead_id: int, background_tasks: BackgroundTasks, _: None = Depends(require_admin)):
    lead = get_lead(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Заявка не найдена")
    if not ai_assistant_enabled():
        raise HTTPException(status_code=400, detail="AI-ассистент отключён в настройках")
    background_tasks.add_task(process_lead_with_ai, lead)
    return {"ok": True}


@app.get("/api/admin/settings")
async def admin_settings(_: None = Depends(require_admin)):
    return {"ai_assistant_enabled": ai_assistant_enabled()}


@app.patch("/api/admin/settings")
async def admin_settings_update(payload: SettingsUpdate, _: None = Depends(require_admin)):
    set_setting("ai_assistant_enabled", "true" if payload.ai_assistant_enabled else "false")
    return {"ai_assistant_enabled": payload.ai_assistant_enabled}


@app.post("/telegram/webhook")
async def telegram_webhook(request: Request, background_tasks: BackgroundTasks):
    if not telegram.enabled:
        return {"ok": True}
    update = await request.json()
    background_tasks.add_task(telegram.handle_update, update)
    return {"ok": True}


if MINIAPP_DIR.exists():
    app.mount("/miniapp", StaticFiles(directory=str(MINIAPP_DIR), html=True), name="miniapp")

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
        if full_path.startswith(("api/", "telegram/", "miniapp/")):
            raise HTTPException(status_code=404)
        candidate = STATIC_SITE / full_path
        if candidate.is_file():
            return FileResponse(candidate)
        index = STATIC_SITE / "index.html"
        if index.exists():
            return FileResponse(index)
        raise HTTPException(status_code=404)
