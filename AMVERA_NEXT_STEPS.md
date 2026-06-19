# Следующие шаги после подключения GitHub к Amvera

## Шаг 1. Дождитесь сборки

1. Откройте [панель Amvera](https://cloud.amvera.ru/) → ваш проект
2. Вкладка **Сборка** — статус должен быть «Успешно»
3. Если ошибка — откройте лог и пришлите текст

## Шаг 2. Задайте переменные окружения

Вкладка **Переменные** → добавьте все строки:

| Переменная | Пример | Зачем |
|------------|--------|-------|
| `WEBAPP_URL` | `https://nv-xxxx.amvera.app` | URL приложения из Amvera (без `/` в конце) |
| `TELEGRAM_BOT_TOKEN` | токен от BotFather | Бот @novtechnologybot |
| `PROXY_URL` | `http://user:pass@84.32.152.169:5383` | **Обязательно** для Telegram из РФ |
| `ADMIN_TELEGRAM_IDS` | `123456789` | Ваш ID из @userinfobot |
| `ADMIN_PASSWORD` | надёжный пароль | Вход в Mini App |
| `JWT_SECRET` | случайная строка 32+ символов | Сессии |
| `DEEPSEEK_API_KEY` | `sk-...` | AI-ассистент |
| `DATA_DIR` | `/data` | База заявок |

После сохранения переменных нажмите **Перезапустить** / **Rebuild**.

## Шаг 3. Проверьте бота

Откройте в браузере (подставьте свой домен Amvera):

```
https://ВАШ-ДОМЕН.amvera.app/api/health/bot
```

Должно быть примерно так:

```json
{
  "enabled": true,
  "proxy": true,
  "webapp_url": true,
  "bot_ok": true,
  "bot_username": "novtechnologybot",
  "webhook_url": "https://.../telegram/webhook"
}
```

Если `bot_ok: false` — проверьте `PROXY_URL` и `TELEGRAM_BOT_TOKEN`.

## Шаг 4. Telegram

1. Напишите боту @novtechnologybot команду `/start`
2. В BotFather: `/setmenubutton` → URL: `https://ВАШ-ДОМЕН.amvera.app/miniapp/`

## Шаг 5. Проверьте сайт и форму

- Сайт: `https://ВАШ-ДОМЕН.amvera.app/`
- Mini App: `https://ВАШ-ДОМЕН.amvera.app/miniapp/`
- Отправьте тестовую заявку в форме — должно прийти уведомление в Telegram

## Если бот всё ещё молчит

1. Убедитесь, что `ADMIN_TELEGRAM_IDS` — **ваш** числовой ID
2. В переменных добавьте `TELEGRAM_MODE=polling` и перезапустите (обход webhook)
3. Логи Amvera → ищите `Telegram` / `Proxy` / `webhook`

## Render

Старый деплой на Render можно отключить — основной хостинг теперь Amvera.
