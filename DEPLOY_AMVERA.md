# Деплой на Amvera (сайт + Telegram-бот)

Один Docker-контейнер отдаёт сайт, API и webhook бота.

```
https://ваш-домен.amvera.app/
├── /                    → лендинг
├── /api/leads           → форма заявок
├── /api/health          → проверка
└── /telegram/webhook    → Telegram Bot API
```

## 1. Push кода

```bash
git push amvera main
# или GitHub → webhook Amvera:
git push origin main
```

Файлы: `Dockerfile`, `amvera.yml` (порт **8000**, диск **/data**).

## 2. Проект в Amvera

1. [console.amvera.ru](https://console.amvera.ru) → проект `novyetehnologii`
2. **Репозиторий** — ветка `main`
3. **Хранилище** — постоянный диск, путь `/data`
4. **Конфигурация** — Docker, `containerPort: 8000`

## 3. Переменные окружения

| Переменная | Описание |
|------------|----------|
| `WEBAPP_URL` | `https://ваш-проект.amvera.app` (без `/` в конце) |
| `ADMIN_PASSWORD` | пароль входа в бота |
| `TELEGRAM_BOT_TOKEN` | токен @novtechnologybot |
| `ADMIN_TELEGRAM_IDS` | Telegram ID админа (через @userinfobot) |
| `PROXY_URL` | `http://user:pass@host:port` — обязателен для Telegram из РФ |
| `DEEPSEEK_API_KEY` | ключ DeepSeek |
| `DATA_DIR` | `/data` |
| `AI_WEB_SEARCH` | `false` |
| `CORS_ORIGINS` | `*` |

После добавления переменных — **перезапустите** контейнер.

`WEBAPP_URL` нужен для webhook: при старте бот вызовет  
`https://ваш-домен/telegram/webhook`.

## 4. GitHub webhook (опционально)

| Поле | Значение |
|------|----------|
| Payload URL | URL из вкладки «Репозиторий» Amvera |
| Content type | `application/json` |
| Secret | секрет из Amvera |
| Events | Push |

## 5. Проверка

1. `https://ваш-домен/api/health` → `{"ok": true, "bot": true}`
2. Сайт открывается, форма отправляет заявку
3. @novtechnologybot → `/start` → пароль → меню заявок

В логах: `Telegram webhook set: https://...`

## 6. Важно

- **Не запускайте** `run_polling.py` на сервере и локально одновременно с webhook — будет конфликт 409.
- Заявки хранятся в SQLite на диске `/data` — без монтирования тома данные пропадут при пересборке.
- Свой домен: Amvera → «Домены» → обновите `WEBAPP_URL` → перезапуск.

## Бот

Нативный Telegram Bot API (без Mini App):
- `/start` — вход по паролю в чате
- `/leads` — заявки
- `/settings` — AI вкл/выкл
- `/logout` — выход
- inline-кнопки: статусы, AI-подсказки, копирование ответов
