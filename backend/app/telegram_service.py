import asyncio
import logging
from typing import Any

import httpx

from .config import get_settings
from .http_client import httpx_client_kwargs

logger = logging.getLogger(__name__)


class TelegramService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.base = f"https://api.telegram.org/bot{self.settings.telegram_bot_token}"
        self._polling = False
        if self.enabled and not self.settings.proxy_enabled:
            logger.warning("PROXY_URL не задан — Telegram API может быть недоступен")

    @property
    def enabled(self) -> bool:
        return bool(self.settings.telegram_bot_token)

    async def _post(self, method: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
        async with httpx.AsyncClient(**httpx_client_kwargs(60.0)) as client:
            response = await client.post(f"{self.base}/{method}", json=payload or {})
            response.raise_for_status()
            data = response.json()
            if not data.get("ok"):
                raise RuntimeError(data.get("description", "Telegram API error"))
            return data

    async def get_me(self) -> dict[str, Any]:
        data = await self._post("getMe")
        return data.get("result", {})

    async def get_webhook_info(self) -> dict[str, Any]:
        data = await self._post("getWebhookInfo")
        return data.get("result", {})

    async def delete_webhook(self) -> None:
        if not self.enabled:
            return
        await self._post("deleteWebhook", {"drop_pending_updates": False})

    async def set_webhook(self, webhook_url: str) -> None:
        if not self.enabled:
            return
        await self._post(
            "setWebhook",
            {
                "url": webhook_url,
                "allowed_updates": ["message", "callback_query"],
                "drop_pending_updates": True,
            },
        )

    async def get_updates(self, offset: int = 0, timeout: int = 25) -> list[dict[str, Any]]:
        data = await self._post(
            "getUpdates",
            {
                "offset": offset,
                "timeout": timeout,
                "allowed_updates": ["message", "callback_query"],
            },
        )
        return data.get("result", [])

    async def status(self) -> dict[str, Any]:
        settings = self.settings
        info: dict[str, Any] = {
            "enabled": self.enabled,
            "proxy": settings.proxy_enabled,
            "webapp_url": bool(settings.webapp_url),
            "admin_ids": len(settings.admin_chat_ids),
            "polling": self._polling,
            "miniapp_url": settings.miniapp_url if settings.webapp_url else None,
        }
        if not self.enabled:
            info["error"] = "TELEGRAM_BOT_TOKEN не задан"
            return info
        if not settings.proxy_enabled:
            info["warning"] = "PROXY_URL не задан"
        try:
            me = await self.get_me()
            info["bot_username"] = me.get("username")
            info["bot_ok"] = True
        except Exception as exc:
            info["bot_ok"] = False
            info["bot_error"] = str(exc)
            return info
        try:
            webhook = await self.get_webhook_info()
            info["webhook_url"] = webhook.get("url") or None
            info["webhook_pending"] = webhook.get("pending_update_count", 0)
            if webhook.get("last_error_message"):
                info["webhook_error"] = webhook.get("last_error_message")
        except Exception as exc:
            info["webhook_error"] = str(exc)
        return info

    async def send_message(self, chat_id: int, text: str, reply_markup: dict | None = None) -> None:
        if not self.enabled:
            return
        payload: dict[str, Any] = {"chat_id": chat_id, "text": text, "parse_mode": "HTML"}
        if reply_markup:
            payload["reply_markup"] = reply_markup
        await self._post("sendMessage", payload)

    async def notify_new_lead(self, lead: dict[str, Any]) -> None:
        if not self.enabled:
            return

        text = (
            "<b>Новая заявка с сайта</b>\n"
            f"#{lead['id']} · {lead['name']}\n"
            f"📞 {lead['phone']}\n"
            f"💬 {lead.get('message') or '—'}"
        )
        markup = {
            "inline_keyboard": [
                [{"text": "Открыть панель заявок", "web_app": {"url": self.settings.miniapp_url}}]
            ]
        }

        chat_ids = self.settings.admin_chat_ids
        if not chat_ids:
            logger.warning("ADMIN_TELEGRAM_IDS not set — notifications skipped")
            return

        for chat_id in chat_ids:
            try:
                await self.send_message(chat_id, text, markup)
            except Exception as exc:
                logger.exception("Failed to notify chat %s: %s", chat_id, exc)

    async def handle_update(self, update: dict[str, Any]) -> None:
        message = update.get("message") or {}
        text = (message.get("text") or "").strip()
        chat = message.get("chat") or {}
        chat_id = chat.get("id")
        if not chat_id:
            return

        if text.startswith("/start"):
            await self.send_message(
                chat_id,
                (
                    "👋 <b>Новые Технологии</b>\n\n"
                    "Панель заявок с сайта и AI-подсказками для ответов клиентам."
                ),
                {
                    "inline_keyboard": [
                        [{"text": "📋 Заявки", "web_app": {"url": self.settings.miniapp_url}}]
                    ]
                },
            )

    async def polling_loop(self) -> None:
        self._polling = True
        offset = 0
        logger.info("Telegram long polling started")
        while True:
            try:
                updates = await self.get_updates(offset=offset, timeout=25)
                for update in updates:
                    await self.handle_update(update)
                    offset = update.get("update_id", offset) + 1
            except asyncio.CancelledError:
                raise
            except Exception as exc:
                logger.exception("Telegram polling error: %s", exc)
                await asyncio.sleep(5)
