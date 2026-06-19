# Деплой на Amvera

## 1. Webhook GitHub → Amvera

В настройках репозитория GitHub (`bubicks23234/NV`) → **Webhooks** → **Add webhook**:

| Поле | Значение |
|------|----------|
| Payload URL | `https://webhook.git.msk0.amvera.ru/github/159190` |
| Content type | `application/json` |
| Secret | секрет из панели Amvera |
| Events | Just the push event |

В панели Amvera на вкладке **Репозиторий** подключите GitHub и укажите ветку `main`.

## 2. Переменные окружения в Amvera

Задайте в разделе **Переменные** (см. `.env.example`):

- `WEBAPP_URL` — URL вашего приложения на Amvera
- `ADMIN_PASSWORD` — пароль для Mini App
- `JWT_SECRET` — случайная строка
- `TELEGRAM_BOT_TOKEN` — токен бота
- `ADMIN_TELEGRAM_IDS` — Telegram ID заказчика
- `PROXY_URL` — **обязательный** HTTP-прокси для Telegram API (`http://user:pass@host:port`)
- `DEEPSEEK_API_KEY` — ключ DeepSeek

**Не храните секреты в репозитории.**

## 3. Telegram Bot + Mini App

1. Откройте [@BotFather](https://t.me/BotFather) → `/mybots` → @novtechnologybot
2. **Bot Settings → Menu Button** или команда `/setmenubutton`:
   - URL: `https://ВАШ-ДОМЕН.amvera.ru/miniapp/`
3. Отправьте боту `/start` — появится кнопка «Заявки»
4. Узнайте свой Telegram ID через [@userinfobot](https://t.me/userinfobot) и добавьте в `ADMIN_TELEGRAM_IDS`

## 4. Архитектура

```
Сайт (Solid) ──POST /api/leads──► FastAPI
                                      ├── SQLite (/data)
                                      ├── DeepSeek + DuckDuckGo (AI)
                                      └── Telegram уведомления

Mini App (/miniapp/) ──JWT + пароль──► /api/admin/*
```

## 5. Локальный запуск

```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp ../.env.example ../.env   # заполните значения
export $(grep -v '^#' ../.env | xargs)
uvicorn app.main:app --reload --port 8000

# Frontend (отдельно)
cd web
VITE_API_BASE=http://127.0.0.1:8000 npm run dev
```

## 6. Сборка Docker (как на Amvera)

```bash
docker build -t nv-site .
docker run -p 8000:8000 --env-file .env -v nv-data:/data nv-site
```

Сайт: `http://localhost:8000`  
Mini App: `http://localhost:8000/miniapp/`
