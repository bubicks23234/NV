# NV — ООО «НОВЫЕ ТЕХНОЛОГИИ»

Сайт проектирования и инжиниринга в Донецке + Telegram-бот для заявок.

## Структура

| Папка | Назначение | Деплой |
|-------|------------|--------|
| `web/` | Статический сайт (Solid.js + Vite) | **Amvera** (`amvera.yml`) |
| `backend/` | API заявок + Telegram-бот | **Render** (`render.yaml`) |

Заявки с формы на сайте уходят на `POST /api/leads` бэкенда → сохраняются в SQLite → уведомление в @novtechnologybot.

## Быстрый старт

```bash
# Сайт
cd web && npm install && npm run dev

# Бэкенд (в другом терминале)
cd backend && source .venv/bin/activate
uvicorn app.main:app --reload --port 8010
```

## Деплой

Подробная инструкция: **[DEPLOY.md](DEPLOY.md)**

Кратко:
1. **Render** — поднять `backend/` (Docker), задать токены и пароль.
2. **Amvera** — поднять сайт из `web/`, задать `VITE_API_BASE=https://ваш-бэкенд.onrender.com`.
