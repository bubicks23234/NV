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
        if self.enabled and not self.settings.proxy_enabled:
            logger.warning("PROXY_URL не задан — Telegram API может быть недоступен")

    @property
    def enabled(self) -> bool:
        return bool(self.settings.telegram_bot_token)

    async def _post(self, method: str, payload: dict[str, Any]) -> dict[str, Any]:
        async with httpx.AsyncClient(**httpx_client_kwargs(30.0)) as client:
            response = await client.post(f"{self.base}/{method}", json=payload)
            response.raise_for_status()
            data = response.json()
            if not data.get("ok"):
                raise RuntimeError(data.get("description", "Telegram API error"))
            return data

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
