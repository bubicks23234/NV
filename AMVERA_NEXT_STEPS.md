# Amvera — почему не работает и что сделать

## Проблема 1: Неправильный URL

`https://run-bvb.herh335.amvera.io` — это **внутренний** адрес сервиса, не публичный сайт.

### Как получить правильный URL

1. Amvera → ваш проект → **Настройки** → **Доменные имена**
2. **Добавить доменное имя** → **Бесплатный домен Amvera** → HTTPS
3. Появится адрес вида: `https://novyetehnologii.herh335.amvera.io`

### Обновите переменную

```
WEBAPP_URL=https://novyetehnologii.herh335.amvera.io
```

(без `/` в конце, подставьте свой домен из панели)

---

## Проблема 2: Порт

Amvera по умолчанию ждёт приложение на **порту 80**.  
Приложение слушало 8000 — сайт не открывался.

Исправлено в коде: теперь порт **80**.

---

## Переменные (этап «Запуск»)

| Переменная | Значение |
|------------|----------|
| `WEBAPP_URL` | `https://ВАШ-ДОМЕН.herh335.amvera.io` |
| `TELEGRAM_BOT_TOKEN` | токен бота |
| `PROXY_URL` | `http://user389942:c7tvh4@84.32.152.169:5383` |
| `TELEGRAM_MODE` | `polling` |
| `ADMIN_TELEGRAM_IDS` | ваш ID из @userinfobot |
| `ADMIN_PASSWORD` | пароль Mini App |
| `JWT_SECRET` | случайная строка |
| `DATA_DIR` | `/data` |

**После изменения переменных — обязательно «Перезапустить».**

---

## Проверка

1. Логи: `Config: PORT=80 TOKEN=yes PROXY=yes WEBAPP_URL=https://...`
2. Браузер: `https://ВАШ-ДОМЕН/api/health` → `{"ok":true}`
3. Бот: @novtechnologybot → `/start`
4. BotFather: `/setmenubutton` → `https://ВАШ-ДОМЕН/miniapp/`
