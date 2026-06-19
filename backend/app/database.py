import json
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .config import get_settings


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def init_db() -> None:
    settings = get_settings()
    Path(settings.db_path).parent.mkdir(parents=True, exist_ok=True)
    with connect() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS leads (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                phone TEXT NOT NULL,
                message TEXT NOT NULL DEFAULT '',
                status TEXT NOT NULL DEFAULT 'new',
                source TEXT NOT NULL DEFAULT 'site',
                ai_summary TEXT,
                ai_suggestions TEXT,
                ai_search_notes TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS bot_users (
                chat_id INTEGER PRIMARY KEY,
                username TEXT,
                authorized INTEGER NOT NULL DEFAULT 0,
                awaiting_password INTEGER NOT NULL DEFAULT 0,
                authorized_at TEXT
            );
            """
        )
        row = conn.execute("SELECT value FROM settings WHERE key = 'ai_assistant_enabled'").fetchone()
        if row is None:
            conn.execute(
                "INSERT INTO settings (key, value) VALUES ('ai_assistant_enabled', 'true')"
            )


@contextmanager
def connect():
    conn = sqlite3.connect(get_settings().db_path)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def get_setting(key: str, default: str = "") -> str:
    with connect() as conn:
        row = conn.execute("SELECT value FROM settings WHERE key = ?", (key,)).fetchone()
        return row["value"] if row else default


def set_setting(key: str, value: str) -> None:
    with connect() as conn:
        conn.execute(
            "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
            (key, value),
        )


def ai_assistant_enabled() -> bool:
    return get_setting("ai_assistant_enabled", "true").lower() == "true"


def create_lead(name: str, phone: str, message: str, source: str = "site") -> dict[str, Any]:
    now = utc_now()
    with connect() as conn:
        cur = conn.execute(
            """
            INSERT INTO leads (name, phone, message, status, source, created_at, updated_at)
            VALUES (?, ?, ?, 'new', ?, ?, ?)
            """,
            (name.strip(), phone.strip(), message.strip(), source, now, now),
        )
        lead_id = cur.lastrowid
        row = conn.execute("SELECT * FROM leads WHERE id = ?", (lead_id,)).fetchone()
    return dict(row)


def update_lead_ai(lead_id: int, summary: str, suggestions: list[str], search_notes: str) -> None:
    with connect() as conn:
        conn.execute(
            """
            UPDATE leads
            SET ai_summary = ?, ai_suggestions = ?, ai_search_notes = ?, updated_at = ?
            WHERE id = ?
            """,
            (summary, json.dumps(suggestions, ensure_ascii=False), search_notes, utc_now(), lead_id),
        )


def get_lead(lead_id: int) -> dict[str, Any] | None:
    with connect() as conn:
        row = conn.execute("SELECT * FROM leads WHERE id = ?", (lead_id,)).fetchone()
    return dict(row) if row else None


def list_leads(limit: int = 100) -> list[dict[str, Any]]:
    with connect() as conn:
        rows = conn.execute(
            "SELECT * FROM leads ORDER BY datetime(created_at) DESC LIMIT ?",
            (limit,),
        ).fetchall()
    return [dict(r) for r in rows]


def update_lead_status(lead_id: int, status: str) -> dict[str, Any] | None:
    with connect() as conn:
        conn.execute(
            "UPDATE leads SET status = ?, updated_at = ? WHERE id = ?",
            (status, utc_now(), lead_id),
        )
        row = conn.execute("SELECT * FROM leads WHERE id = ?", (lead_id,)).fetchone()
    return dict(row) if row else None


def _ensure_bot_user(conn, chat_id: int, username: str | None = None) -> None:
    conn.execute(
        """
        INSERT INTO bot_users (chat_id, username, authorized, awaiting_password)
        VALUES (?, ?, 0, 0)
        ON CONFLICT(chat_id) DO UPDATE SET username = COALESCE(excluded.username, bot_users.username)
        """,
        (chat_id, username),
    )


def is_authorized(chat_id: int) -> bool:
    with connect() as conn:
        row = conn.execute(
            "SELECT authorized FROM bot_users WHERE chat_id = ?",
            (chat_id,),
        ).fetchone()
    return bool(row and row["authorized"])


def is_awaiting_password(chat_id: int) -> bool:
    with connect() as conn:
        row = conn.execute(
            "SELECT awaiting_password FROM bot_users WHERE chat_id = ?",
            (chat_id,),
        ).fetchone()
    return bool(row and row["awaiting_password"])


def set_awaiting_password(chat_id: int, username: str | None, awaiting: bool) -> None:
    with connect() as conn:
        _ensure_bot_user(conn, chat_id, username)
        conn.execute(
            "UPDATE bot_users SET awaiting_password = ?, username = COALESCE(?, username) WHERE chat_id = ?",
            (1 if awaiting else 0, username, chat_id),
        )


def authorize_user(chat_id: int, username: str | None = None) -> None:
    with connect() as conn:
        _ensure_bot_user(conn, chat_id, username)
        conn.execute(
            """
            UPDATE bot_users
            SET authorized = 1, awaiting_password = 0, authorized_at = ?, username = COALESCE(?, username)
            WHERE chat_id = ?
            """,
            (utc_now(), username, chat_id),
        )


def deauthorize_user(chat_id: int) -> None:
    with connect() as conn:
        conn.execute(
            "UPDATE bot_users SET authorized = 0, awaiting_password = 0 WHERE chat_id = ?",
            (chat_id,),
        )


def list_authorized_chat_ids() -> list[int]:
    with connect() as conn:
        rows = conn.execute(
            "SELECT chat_id FROM bot_users WHERE authorized = 1 ORDER BY chat_id",
        ).fetchall()
    return [int(row["chat_id"]) for row in rows]


def serialize_lead(row: dict[str, Any]) -> dict[str, Any]:
    suggestions = []
    if row.get("ai_suggestions"):
        try:
            suggestions = json.loads(row["ai_suggestions"])
        except json.JSONDecodeError:
            suggestions = []
    return {
        "id": row["id"],
        "name": row["name"],
        "phone": row["phone"],
        "message": row["message"],
        "status": row["status"],
        "source": row["source"],
        "ai_summary": row.get("ai_summary"),
        "ai_suggestions": suggestions,
        "ai_search_notes": row.get("ai_search_notes"),
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }
