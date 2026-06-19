from .bot_handlers import TelegramBot
from .telegram_client import TelegramClient

_client = TelegramClient()
_bot = TelegramBot(_client)


class TelegramService:
    """Фасад: обычный Telegram-бот без Mini App."""

    def __init__(self) -> None:
        self._client = _client
        self._bot = _bot

    @property
    def enabled(self) -> bool:
        return self._client.enabled

    async def set_webhook(self, webhook_url: str) -> None:
        await self._client.set_webhook(webhook_url)

    async def setup(self) -> None:
        await self._client.set_commands()

    async def notify_new_lead(self, lead: dict) -> None:
        await self._bot.notify_new_lead(lead)

    async def handle_update(self, update: dict) -> None:
        await self._bot.handle_update(update)
