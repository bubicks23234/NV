# NV

Сайт ООО «НОВЫЕ ТЕХНОЛОГИИ» — проектирование и инжиниринг в Донецке.

## Структура

| Папка | Назначение |
|-------|------------|
| `web/` | Фронтенд (Solid.js + Vite) |
| `backend/` | API, Telegram-бот, Mini App панель заявок |
| `Dockerfile` | Сборка сайта + бэкенда для Amvera |

## Локальная разработка

```bash
cd web && npm install && npm run dev
```

## Деплой на Amvera

См. [DEPLOY_AMVERA.md](DEPLOY_AMVERA.md) — webhook GitHub, переменные окружения, настройка @novtechnologybot.

