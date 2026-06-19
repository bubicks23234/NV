# Деплой: сайт и бот раздельно

Сайт и бэкенд живут в одном репозитории, но деплоятся на разные платформы.

```
Сайт (Amvera, РФ)  ──POST /api/leads──►  Backend (Render)
                                              ├── SQLite
                                              ├── DeepSeek AI
                                              └── Telegram webhook → @novtechnologybot
```

## 1. Backend на Render

1. [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint** → подключите репозиторий `NV`.
2. Render прочитает `render.yaml` и создаст сервис **nv-api**.
3. Задайте секреты в Environment:

| Переменная | Описание |
|------------|----------|
| `ADMIN_PASSWORD` | Пароль для входа в бота (`/start`) |
| `TELEGRAM_BOT_TOKEN` | Токен @novtechnologybot |
| `ADMIN_TELEGRAM_IDS` | Ваш Telegram ID |
| `DEEPSEEK_API_KEY` | Ключ DeepSeek |

`WEBAPP_URL` подставится автоматически — по нему настроится webhook `https://…/telegram/webhook`.

`PROXY_URL` **не нужен** на Render (сервер за рубежом, Telegram API доступен напрямую).

4. После деплоя откройте `https://ваш-сервис.onrender.com/api/health` — должно быть `{"ok": true}`.
5. В боте: `/start` → пароль → меню заявок.

> На бесплатном Render данные SQLite сбрасываются при редеплое. Для продакшена подключите Persistent Disk или Postgres.

## 2. Сайт на Amvera

1. Создайте проект на Amvera, подключите GitHub-репозиторий, ветка **`main`**.
2. Amvera читает `amvera.yml` из корня и запускает `npm run build` (сборка идёт из папки `web/` через корневой `package.json`).
3. **До первого деплоя** задайте переменную окружения:

```
VITE_API_BASE=https://ваш-сервис.onrender.com
```

Без неё форма на сайте не сможет отправить заявку.

4. После деплоя проверьте форму «Связаться с нами» — заявка должна появиться в боте.

5. В Render добавьте домен Amvera в `CORS_ORIGINS`, например:

```
CORS_ORIGINS=https://novye-tehnologii.ru,https://ваш-проект.amvera.app
```

## 3. Локальная разработка

**Сайт:**

```bash
cd web && npm install && npm run dev
```

Форма проксирует `/api` на `http://localhost:8010` (см. `vite.config.js`).

**Бэкенд:**

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export TELEGRAM_BOT_TOKEN=... ADMIN_PASSWORD=... DATA_DIR=/tmp/nv-data
uvicorn app.main:app --reload --port 8010
```

Локальный тест бота без webhook:

```bash
python run_polling.py
```

## 4. Структура репозитория

| Путь | Назначение | Деплой |
|------|------------|--------|
| `web/` | Статический сайт | Amvera (`amvera.yml`) |
| `backend/` | API + Telegram-бот | Render (`render.yaml`) |
