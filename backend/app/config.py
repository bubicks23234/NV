from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Новые Технологии"
    public_site_url: str = "https://novye-tehnologii.ru"
    webapp_url: str = ""

    admin_password: str = "change-me"
    jwt_secret: str = "change-me-jwt-secret"
    jwt_ttl_hours: int = 72

    telegram_bot_token: str = ""
    telegram_bot_username: str = "novtechnologybot"
    admin_telegram_ids: str = ""

    deepseek_api_key: str = ""
    deepseek_base_url: str = "https://api.deepseek.com"
    deepseek_model: str = "deepseek-chat"

    data_dir: str = "/data"
    database_path: str = ""

    cors_origins: str = "*"

    # HTTP(S) прокси для Telegram API и внешних запросов (обязателен для бота)
    # Формат: http://user:pass@host:port
    proxy_url: str = ""

    @property
    def proxy_enabled(self) -> bool:
        return bool(self.proxy_url.strip())

    @property
    def db_path(self) -> str:
        if self.database_path:
            return self.database_path
        return f"{self.data_dir.rstrip('/')}/leads.db"

    @property
    def admin_chat_ids(self) -> list[int]:
        if not self.admin_telegram_ids.strip():
            return []
        return [int(x.strip()) for x in self.admin_telegram_ids.split(",") if x.strip()]

    @property
    def miniapp_url(self) -> str:
        base = self.webapp_url.rstrip("/") if self.webapp_url else self.public_site_url.rstrip("/")
        return f"{base}/miniapp/"


@lru_cache
def get_settings() -> Settings:
    return Settings()
