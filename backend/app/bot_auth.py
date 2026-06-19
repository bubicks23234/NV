import secrets

from .config import get_settings
from .database import (
    authorize_user,
    deauthorize_user,
    is_authorized,
    is_awaiting_password,
    list_authorized_chat_ids,
    set_awaiting_password,
)


def verify_bot_password(password: str) -> bool:
    settings = get_settings()
    expected = settings.admin_password
    return secrets.compare_digest(password.strip(), expected)


def can_access_bot(chat_id: int) -> bool:
    return is_authorized(chat_id)


def begin_auth(chat_id: int, username: str | None = None) -> None:
    set_awaiting_password(chat_id, username, True)


def complete_auth(chat_id: int, username: str | None = None) -> None:
    authorize_user(chat_id, username)
    set_awaiting_password(chat_id, username, False)


def logout(chat_id: int) -> None:
    deauthorize_user(chat_id)


def notification_chat_ids() -> list[int]:
    settings = get_settings()
    ids = list_authorized_chat_ids()
    if ids:
        return ids
    return settings.admin_chat_ids
