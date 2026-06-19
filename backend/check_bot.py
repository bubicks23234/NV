#!/usr/bin/env python3
"""Быстрая диагностика подключения к Telegram API."""

import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config import get_settings
from app.http_client import httpx_client_kwargs
import httpx


async def main() -> None:
    s = get_settings()
    print("=== Диагностика бота ===\n")
    print(f"TELEGRAM_BOT_TOKEN: {'задан' if s.telegram_bot_token else 'НЕ ЗАДАН'}")
    print(f"PROXY_URL: {s.proxy_url or 'НЕ ЗАДАН'}")
    print(f"ADMIN_PASSWORD: {'задан' if s.admin_password != 'change-me' else 'дефолтный (change-me)'}")
    print(f"WEBAPP_URL: {s.webapp_url or 'не задан (webhook не настроится)'}")
    print(f"ADMIN_TELEGRAM_IDS: {s.admin_telegram_ids or 'не задан'}")

    if not s.telegram_bot_token:
        print("\n❌ Укажите TELEGRAM_BOT_TOKEN")
        return

    if s.proxy_url:
        os.environ["HTTP_PROXY"] = s.proxy_url
        os.environ["HTTPS_PROXY"] = s.proxy_url

    base = f"https://api.telegram.org/bot{s.telegram_bot_token}"
    async with httpx.AsyncClient(**httpx_client_kwargs(30)) as client:
        r = await client.get(f"{base}/getMe")
        print(f"\ngetMe: {r.status_code}", r.json())

        r = await client.get(f"{base}/getWebhookInfo")
        wh = r.json().get("result", {})
        print(f"\nWebhook URL: {wh.get('url') or '(пусто — бот не получает сообщения без polling)'}")
        print(f"Pending updates: {wh.get('pending_update_count')}")

    print("\n--- Как тестировать ---")
    print("1. Создайте .env из .env.example в корне проекта")
    print("2. Запустите: cd backend && python run_polling.py")
    print("3. Напишите @novtechnologybot → /start → введите пароль")


if __name__ == "__main__":
    asyncio.run(main())
