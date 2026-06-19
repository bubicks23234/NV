# Безопасность

## Секреты

**Никогда не коммитьте в git:**

- `TELEGRAM_BOT_TOKEN`
- `DEEPSEEK_API_KEY`
- `PROXY_URL` (логин/пароль прокси)
- `ADMIN_PASSWORD`, `JWT_SECRET`
- Webhook secret Amvera
- GitHub Personal Access Token

Все секреты — только в **переменных окружения Amvera** или локальном `.env` (файл в `.gitignore`).

Шаблон переменных: [.env.example](.env.example)

## Если секрет попал в репозиторий

1. Немедленно **смените** скомпрометированный ключ/пароль
2. Удалите секрет из кода и обновите историю git
3. Проверьте историю: `git log -p -S "фрагмент_секрета"`

## Публичный репозиторий

Репозиторий [bubicks23234/NV](https://github.com/bubicks23234/NV) публичный — в нём только код без ключей.
