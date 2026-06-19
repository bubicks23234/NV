# NV — ООО «НОВЫЕ ТЕХНОЛОГИИ»

Сайт и Telegram-бот для заявок с сайта (проектирование и инжиниринг, Донецк).

## Структура

| Папка | Назначение |
|-------|------------|
| `web/` | Фронтенд (Solid.js + Vite + Tailwind) |
| `backend/` | FastAPI: API, SQLite, DeepSeek AI, Telegram-бот |
| `Dockerfile` | Один образ: сайт + API + webhook бота |
| `amvera.yml` | Порт 8000, хранилище `/data`, тариф Amvera |

## Локально

```bash
# Сайт
cd web && npm install && npm run dev

# API (без бота)
cd backend && python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8010

# Бот через polling (только для теста, не вместе с webhook)
export PROXY_URL=... TELEGRAM_BOT_TOKEN=... ADMIN_PASSWORD=...
python run_polling.py
```

## Деплой на Amvera

Сайт и бот работают в **одном контейнере**. Подробно: [DEPLOY_AMVERA.md](DEPLOY_AMVERA.md).

```bash
git push amvera main    # прямой push в Amvera
git push origin main    # GitHub (если настроен webhook)
```

После деплоя задайте переменные в панели Amvera и откройте @novtechnologybot → `/start`.
