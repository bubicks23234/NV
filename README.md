# NV

Сайт ООО «НОВЫЕ ТЕХНОЛОГИИ» — проектирование и инжиниринг в Донецке.

Исходники: папка [`web/`](web/).

```bash
cd web
npm install
npm run dev
```

## Заявки с сайта (NV-BOT)

Форма на странице контактов отправляет заявки в [NV-BOT](https://github.com/bubicks23234/NV-BOT) (`POST /api/applications/public`).

Перед сборкой задайте переменные (локально — `web/.env`, на Render — в настройках сервиса):

```bash
VITE_NV_BOT_API_URL=https://nvbot.artixxx.site   # URL бота на Railway
VITE_NV_BOT_API_KEY=<WEBSITE_API_KEY из NV-BOT>
```

На стороне NV-BOT в `ALLOWED_ORIGINS` укажите `https://nt-donetsk.ru` (и другие домены сайта через запятую).
