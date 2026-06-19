#!/usr/bin/env python3
"""Локальный тест бота через long polling (без webhook)."""

import asyncio
import logging
import os
import sys

# backend/ в PYTHONPATH
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.bot_handlers import TelegramBot
from app.config import get_settings
from app.database import init_db
from app.telegram_client import TelegramClient

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
logger = logging.getLogger("polling")


async def main() -> None:
    settings = get_settings()
    if not settings.telegram_bot_token:
        logger.error("Задайте TELEGRAM_BOT_TOKEN в .env или переменных окружения")
        sys.exit(1)
    if not settings.proxy_url:
        logger.error("Задайте PROXY_URL — без прокси Telegram API недоступен")
        sys.exit(1)

    os.environ["HTTP_PROXY"] = settings.proxy_url
    os.environ["HTTPS_PROXY"] = settings.proxy_url

    init_db()
    client = TelegramClient()
    bot = TelegramBot(client)

    me = await client._post("getMe", {})
    logger.info("Бот: @%s", me["result"]["username"])

    await client.delete_webhook()
    info = await client.get_webhook_info()
    logger.info("Webhook снят. URL: %r", info.get("url"))

    await client.set_commands()
    logger.info("Polling запущен. Напишите боту /start в Telegram. Ctrl+C — остановка.")

    async def process_update(update: dict) -> None:
        try:
            await bot.handle_update(update)
        except Exception as exc:
            logger.exception("Ошибка обработки update: %s", exc)

    offset = None
    while True:
        try:
            updates = await client.get_updates(offset=offset, timeout=25)
            for update in updates:
                offset = update["update_id"] + 1
                asyncio.create_task(process_update(update))
        except Exception as exc:
            logger.exception("Ошибка polling: %s", exc)
            await asyncio.sleep(3)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nОстановлено")
