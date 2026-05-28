# ООО «Новые технологии» — сайт-визитка

Минималистичный одностраничный сайт на **Solid.js** + **Tailwind CSS** с анимациями при прокрутке и адаптацией под мобильные устройства.

## Запуск локально

```bash
npm install
npm run dev
```

Откройте адрес из терминала (обычно http://localhost:5173).

## Сборка и деплой на GitHub Pages

```bash
npm run build
npm run deploy
```

Сайт публикуется в репозитории **NV** (ветка `gh-pages`).

## SEO

Домен и метаданные задаются в `src/data/seo.js`. При сборке генерируются `robots.txt`, `sitemap.xml` и Schema.org-разметка.

## Структура

- `src/App.jsx` — главная страница
- `src/data/seo.js` — SEO-константы (домен, контакты)
- `public/images/` — фото проектов и логотип
- `vite.config.js` — `base: '/NV/'` для production (GitHub Pages)
