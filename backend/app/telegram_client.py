import logging
from typing import Any

import httpx

from .config import get_settings
from .http_client import httpx_client_kwargs

logger = logging.getLogger(__name__)


class TelegramClient:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.base = f"https://api.telegram.org/bot{self.settings.telegram_bot_token}"
        self._http: httpx.AsyncClient | None = None

    @property
    def enabled(self) -> bool:
        return bool(self.settings.telegram_bot_token)

    async def _http_client(self) -> httpx.AsyncClient:
        if self._http is None:
            self._http = httpx.AsyncClient(**httpx_client_kwargs(30.0))
        return self._http

    async def close(self) -> None:
        if self._http is not None:
            await self._http.aclose()
            self._http = None

    async def _post(self, method: str, payload: dict[str, Any]) -> dict[str, Any]:
        client = await self._http_client()
        response = await client.post(f"{self.base}/{method}", json=payload)
        if response.status_code == 400:
            data = response.json()
            description = data.get("description", "")
            if method == "editMessageText" and "message is not modified" in description:
                return data
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

    async def delete_webhook(self) -> None:
        if not self.enabled:
            return
        await self._post("deleteWebhook", {"drop_pending_updates": False})

    async def get_webhook_info(self) -> dict:
        if not self.enabled:
            return {}
        data = await self._post("getWebhookInfo", {})
        return data.get("result", {})

    async def get_updates(self, offset: int | None = None, timeout: int = 25) -> list[dict]:
        if not self.enabled:
            return []
        payload: dict[str, Any] = {
            "timeout": timeout,
            "allowed_updates": ["message", "callback_query"],
        }
        if offset is not None:
            payload["offset"] = offset
        data = await self._post("getUpdates", payload)
        return data.get("result", [])

    async def set_commands(self) -> None:
        if not self.enabled:
            return
        await self._post(
            "setMyCommands",
            {
                "commands": [
                    {"command": "start", "description": "Войти в панель"},
                    {"command": "leads", "description": "Список заявок"},
                    {"command": "settings", "description": "Настройки"},
                    {"command": "logout", "description": "Выйти"},
                ]
            },
        )

    async def send_message(
        self,
        chat_id: int,
        text: str,
        reply_markup: dict | None = None,
        parse_mode: str = "HTML",
    ) -> int | None:
        if not self.enabled:
            return None
        payload: dict[str, Any] = {"chat_id": chat_id, "text": text, "parse_mode": parse_mode}
        if reply_markup:
            payload["reply_markup"] = reply_markup
        data = await self._post("sendMessage", payload)
        return data.get("result", {}).get("message_id")

    async def edit_message(
        self,
        chat_id: int,
        message_id: int,
        text: str,
        reply_markup: dict | None = None,
        parse_mode: str = "HTML",
    ) -> None:
        payload: dict[str, Any] = {
            "chat_id": chat_id,
            "message_id": message_id,
            "text": text,
            "parse_mode": parse_mode,
        }
        if reply_markup:
            payload["reply_markup"] = reply_markup
        await self._post("editMessageText", payload)

    async def answer_callback(self, callback_id: str, text: str | None = None, *, alert: bool = False) -> None:
        if not callback_id:
            return
        payload: dict[str, Any] = {"callback_query_id": callback_id}
        if text:
            payload["text"] = text[:200]
            payload["show_alert"] = alert
        try:
            await self._post("answerCallbackQuery", payload)
        except httpx.HTTPStatusError as exc:
            description = ""
            try:
                description = exc.response.json().get("description", "")
            except Exception:
                pass
            if "query is too old" in description or "QUERY_ID_INVALID" in description:
                return
            raise
