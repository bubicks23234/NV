import asyncio
import logging
from datetime import datetime
from typing import Any

from .ai import process_lead_with_ai
from .bot_auth import (
    begin_auth,
    can_access_bot,
    complete_auth,
    logout,
    notification_chat_ids,
    verify_bot_password,
)
from .database import (
    ai_assistant_enabled,
    get_lead,
    list_leads,
    serialize_lead,
    set_setting,
    update_lead_status,
)
from .telegram_client import TelegramClient

logger = logging.getLogger(__name__)

STATUS_LABELS = {
    "new": "🆕 Новая",
    "in_progress": "🔄 В работе",
    "done": "✅ Закрыта",
    "archived": "📦 В архиве",
}

STATUS_ICONS = {
    "new": "🆕",
    "in_progress": "🔄",
    "done": "✅",
    "archived": "📦",
}

LEADS_PAGE_SIZE = 6


def _escape(text: str) -> str:
    return (
        str(text)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


COPY_TEXT_LIMIT = 256


def _copy_text_button(text: str, *, label: str = "📋 Скопировать") -> dict[str, Any]:
    return {"text": label, "copy_text": {"text": text[:COPY_TEXT_LIMIT]}}


def _ai_reply_markup(text: str, lead_id: int) -> dict[str, Any]:
    hint = "📋 Скопировать"
    if len(text) > COPY_TEXT_LIMIT:
        hint = "📋 Скопировать (начало)"
    return {
        "inline_keyboard": [
            [_copy_text_button(text, label=hint)],
            [{"text": "◀️ К заявке", "callback_data": f"lead:{lead_id}"}],
        ]
    }


def _format_date(iso: str) -> str:
    try:
        dt = datetime.fromisoformat(iso.replace("Z", "+00:00"))
        return dt.strftime("%d.%m.%Y %H:%M")
    except ValueError:
        return iso[:16].replace("T", " ")


class TelegramBot:
    def __init__(self, client: TelegramClient) -> None:
        self.client = client

    async def notify_new_lead(self, lead: dict[str, Any]) -> None:
        if not self.client.enabled:
            return

        data = serialize_lead(lead) if "ai_suggestions" not in lead else lead
        text = (
            "🔔 <b>Новая заявка с сайта!</b>\n"
            "━━━━━━━━━━━━━━━\n\n"
            f"👤 <b>{_escape(data['name'])}</b>\n"
            f"📞 <code>{_escape(data['phone'])}</code>\n"
            f"💬 {_escape(data.get('message') or 'Без комментария')}\n\n"
            f"🕐 {_format_date(data.get('created_at', ''))}"
        )
        markup = {
            "inline_keyboard": [
                [{"text": "👀 Посмотреть заявку", "callback_data": f"lead:{data['id']}"}],
                [{"text": "📋 Все заявки", "callback_data": "leads:0"}],
            ]
        }

        for chat_id in notification_chat_ids():
            try:
                await self.client.send_message(chat_id, text, markup)
            except Exception as exc:
                logger.exception("Failed to notify chat %s: %s", chat_id, exc)

    async def handle_update(self, update: dict[str, Any]) -> None:
        if "callback_query" in update:
            await self._handle_callback(update["callback_query"])
            return
        if "message" in update:
            await self._handle_message(update["message"])

    async def _handle_message(self, message: dict[str, Any]) -> None:
        chat = message.get("chat") or {}
        chat_id = chat.get("id")
        if not chat_id:
            return

        username = (chat.get("username") or "") or None
        text = (message.get("text") or "").strip()

        if text.startswith("/logout"):
            if can_access_bot(chat_id):
                logout(chat_id)
                await self.client.send_message(
                    chat_id,
                    "👋 Вы вышли из панели.\n\nЧтобы снова войти — отправьте /start",
                )
            else:
                await self.client.send_message(chat_id, "Вы не авторизованы.")
            return

        if text.startswith("/start"):
            if can_access_bot(chat_id):
                await self._send_main_menu(chat_id)
            else:
                await self._prompt_login(chat_id, username)
            return

        if not can_access_bot(chat_id):
            if is_password_attempt(text):
                if verify_bot_password(text):
                    complete_auth(chat_id, username)
                    await self.client.send_message(
                        chat_id,
                        "✅ <b>Добро пожаловать!</b>\n\nТеперь вы можете просматривать заявки с сайта.",
                    )
                    await self._send_main_menu(chat_id)
                else:
                    await self.client.send_message(
                        chat_id,
                        "😔 Пароль неверный.\n\nПопробуйте ещё раз или нажмите /start",
                    )
            else:
                await self._prompt_login(chat_id, username)
            return

        if text.startswith("/leads") or text.startswith("/menu"):
            await self._send_leads(chat_id, 0)
            return

        if text.startswith("/settings"):
            await self._send_settings(chat_id)
            return

        await self._send_main_menu(chat_id)

    async def _handle_callback(self, callback: dict[str, Any]) -> None:
        chat = callback.get("message", {}).get("chat", {})
        chat_id = chat.get("id")
        message_id = callback.get("message", {}).get("message_id")
        data = callback.get("data") or ""
        callback_id = callback.get("id")

        if not chat_id:
            return

        if not can_access_bot(chat_id):
            await self.client.answer_callback(callback_id, "Сначала войдите — /start")
            return

        toast: str | None = None

        if data.startswith("reanalyze:"):
            lead_id = int(data.split(":")[1])
            lead = get_lead(lead_id)
            if not lead or not ai_assistant_enabled():
                await self.client.answer_callback(callback_id, "AI-ассистент выключен")
                return
            toast = "Готовлю подсказки…"
        elif data.startswith("status:"):
            _, _, status = data.split(":", 2)
            toast = f"Статус: {STATUS_LABELS.get(status, status)}"
        elif data.startswith("aireply:"):
            toast = "Текст ниже 👇"
        elif data == "settings:toggle_ai":
            enabled = not ai_assistant_enabled()
            set_setting("ai_assistant_enabled", "true" if enabled else "false")
            toast = f"AI {'включён ✅' if enabled else 'выключен'}"

        await self.client.answer_callback(callback_id, toast)

        try:
            if data == "menu":
                await self._edit_main_menu(chat_id, message_id)
            elif data.startswith("leads:"):
                page = int(data.split(":")[1])
                await self._edit_leads(chat_id, message_id, page)
            elif data.startswith("lead:"):
                lead_id = int(data.split(":")[1])
                await self._edit_lead(chat_id, message_id, lead_id)
            elif data.startswith("leadai:"):
                lead_id = int(data.split(":")[1])
                await self._edit_lead_ai(chat_id, message_id, lead_id)
            elif data.startswith("aireply:"):
                _, lead_id_s, idx = data.split(":", 2)
                lead_id = int(lead_id_s)
                lead = serialize_lead(get_lead(lead_id) or {})
                suggestions = lead.get("ai_suggestions") or []
                idx_int = int(idx)
                if idx_int < len(suggestions):
                    reply = suggestions[idx_int]
                    note = (
                        "<i>Кнопка ниже — в буфер обмена. "
                        "Длинный текст — удержите серый блок выше.</i>"
                        if len(reply) > COPY_TEXT_LIMIT
                        else "<i>Нажмите кнопку ниже, чтобы скопировать.</i>"
                    )
                    await self.client.send_message(
                        chat_id,
                        (
                            f"💬 <b>Готовый ответ для заявки #{lead_id}</b>\n"
                            "━━━━━━━━━━━━━━━\n\n"
                            f"<pre>{_escape(reply)}</pre>\n\n"
                            f"{note}"
                        ),
                        _ai_reply_markup(reply, lead_id),
                    )
                else:
                    await self.client.send_message(chat_id, "Подсказка не найдена.")
            elif data.startswith("status:"):
                _, lead_id_s, status = data.split(":", 2)
                update_lead_status(int(lead_id_s), status)
                await self._edit_lead(chat_id, message_id, int(lead_id_s))
            elif data.startswith("reanalyze:"):
                lead_id = int(data.split(":")[1])
                await self._edit_lead_ai(chat_id, message_id, lead_id, loading=True)
                asyncio.create_task(self._run_reanalyze(chat_id, message_id, lead_id))
            elif data == "settings":
                await self._edit_settings(chat_id, message_id)
            elif data == "settings:toggle_ai":
                await self._edit_settings(chat_id, message_id)
        except Exception as exc:
            logger.exception("Callback error: %s", exc)

    async def _run_reanalyze(self, chat_id: int, message_id: int, lead_id: int) -> None:
        lead = get_lead(lead_id)
        if not lead:
            return
        try:
            await process_lead_with_ai(lead, use_web=False)
            await self._edit_lead_ai(chat_id, message_id, lead_id)
        except Exception:
            logger.exception("Reanalyze failed for lead %s", lead_id)
            await self.client.edit_message(
                chat_id,
                message_id,
                "😔 Не удалось получить подсказки. Попробуйте позже.",
                self._lead_ai_markup(lead_id, ready=False),
            )

    async def _prompt_login(self, chat_id: int, username: str | None) -> None:
        begin_auth(chat_id, username)
        await self.client.send_message(
            chat_id,
            (
                "👋 <b>Здравствуйте!</b>\n\n"
                "Это панель заявок <b>«Новые Технологии»</b>.\n"
                "Введите пароль, чтобы посмотреть обращения с сайта."
            ),
        )

    def _main_menu_text(self) -> str:
        items = list_leads(50)
        new_count = sum(1 for x in items if x["status"] == "new")
        return (
            "🏠 <b>Главное меню</b>\n"
            "━━━━━━━━━━━━━━━\n\n"
            f"📬 Новых заявок: <b>{new_count}</b>\n\n"
            "Выберите действие:"
        )

    def _main_menu(self) -> dict[str, Any]:
        return {
            "inline_keyboard": [
                [{"text": "📋 Заявки с сайта", "callback_data": "leads:0"}],
                [{"text": "⚙️ Настройки", "callback_data": "settings"}],
            ]
        }

    async def _send_main_menu(self, chat_id: int) -> None:
        await self.client.send_message(chat_id, self._main_menu_text(), self._main_menu())

    async def _edit_main_menu(self, chat_id: int, message_id: int) -> None:
        await self.client.edit_message(chat_id, message_id, self._main_menu_text(), self._main_menu())

    async def _send_leads(self, chat_id: int, page: int) -> None:
        await self.client.send_message(chat_id, self._leads_text(page), self._leads_markup(page))

    async def _edit_leads(self, chat_id: int, message_id: int, page: int) -> None:
        await self.client.edit_message(chat_id, message_id, self._leads_text(page), self._leads_markup(page))

    def _leads_text(self, page: int) -> str:
        items = list_leads(100)
        if not items:
            return (
                "📋 <b>Заявки</b>\n"
                "━━━━━━━━━━━━━━━\n\n"
                "Пока заявок нет — как только кто-то оставит форму на сайте, вы получите уведомление."
            )
        total = len(items)
        return (
            "📋 <b>Заявки с сайта</b>\n"
            "━━━━━━━━━━━━━━━\n\n"
            f"Всего: <b>{total}</b> · страница <b>{page + 1}</b>\n"
            "Нажмите на заявку, чтобы открыть:"
        )

    def _leads_markup(self, page: int) -> dict[str, Any]:
        items = list_leads(100)
        start = page * LEADS_PAGE_SIZE
        chunk = items[start : start + LEADS_PAGE_SIZE]
        rows = []
        for lead in chunk:
            data = serialize_lead(lead)
            icon = STATUS_ICONS.get(data["status"], "•")
            name = data["name"][:22] + ("…" if len(data["name"]) > 22 else "")
            rows.append(
                [{"text": f"{icon} #{data['id']} · {name}", "callback_data": f"lead:{data['id']}"}]
            )

        nav = []
        if page > 0:
            nav.append({"text": "◀️ Назад", "callback_data": f"leads:{page - 1}"})
        if start + LEADS_PAGE_SIZE < len(items):
            nav.append({"text": "Вперёд ▶️", "callback_data": f"leads:{page + 1}"})
        if nav:
            rows.append(nav)
        rows.append([{"text": "🏠 Главное меню", "callback_data": "menu"}])
        return {"inline_keyboard": rows}

    def _lead_text(self, data: dict[str, Any]) -> str:
        return (
            f"📋 <b>Заявка #{data['id']}</b>\n"
            "━━━━━━━━━━━━━━━\n\n"
            f"Статус: {STATUS_LABELS.get(data['status'], data['status'])}\n"
            f"🕐 {_format_date(data.get('created_at', ''))}\n\n"
            f"👤 <b>{_escape(data['name'])}</b>\n"
            f"📞 <code>{_escape(data['phone'])}</code>\n\n"
            f"💬 <b>Сообщение:</b>\n{_escape(data.get('message') or '—')}"
        )

    def _lead_markup(self, lead_id: int, data: dict[str, Any]) -> dict[str, Any]:
        has_ai = bool(data.get("ai_summary") or data.get("ai_suggestions"))
        ai_label = "💡 Подсказки AI" if has_ai else "⏳ Подсказки AI (готовятся)"
        return {
            "inline_keyboard": [
                [{"text": ai_label, "callback_data": f"leadai:{lead_id}"}],
                [
                    {"text": "🆕 Новая", "callback_data": f"status:{lead_id}:new"},
                    {"text": "🔄 В работе", "callback_data": f"status:{lead_id}:in_progress"},
                ],
                [
                    {"text": "✅ Закрыта", "callback_data": f"status:{lead_id}:done"},
                    {"text": "📦 Архив", "callback_data": f"status:{lead_id}:archived"},
                ],
                [
                    {"text": "◀️ К списку", "callback_data": "leads:0"},
                    {"text": "🏠 Меню", "callback_data": "menu"},
                ],
            ]
        }

    async def _edit_lead(self, chat_id: int, message_id: int, lead_id: int) -> None:
        lead = get_lead(lead_id)
        if not lead:
            await self.client.edit_message(chat_id, message_id, "Заявка не найдена.", self._main_menu())
            return
        data = serialize_lead(lead)
        await self.client.edit_message(
            chat_id, message_id, self._lead_text(data), self._lead_markup(lead_id, data)
        )

    def _lead_ai_text(self, data: dict[str, Any], *, loading: bool = False) -> str:
        if loading:
            return (
                f"💡 <b>Подсказки AI · заявка #{data['id']}</b>\n"
                "━━━━━━━━━━━━━━━\n\n"
                "⏳ Готовлю варианты ответа…\n"
                "Обычно это занимает несколько секунд."
            )
        summary = data.get("ai_summary")
        if not summary and not data.get("ai_suggestions"):
            return (
                f"💡 <b>Подсказки AI · заявка #{data['id']}</b>\n"
                "━━━━━━━━━━━━━━━\n\n"
                "Подсказки ещё не готовы.\n"
                "Нажмите «Обновить» — AI подготовит варианты ответа."
            )
        return (
            f"💡 <b>Подсказки AI · заявка #{data['id']}</b>\n"
            "━━━━━━━━━━━━━━━\n\n"
            f"📝 <b>Краткий разбор:</b>\n{_escape(summary or '—')}\n\n"
            "💬 — полный текст · 📋 — сразу в буфер:"
        )

    def _lead_ai_markup(self, lead_id: int, *, ready: bool = True) -> dict[str, Any]:
        rows = []
        if ready:
            lead = serialize_lead(get_lead(lead_id) or {})
            for idx, suggestion in enumerate(lead.get("ai_suggestions") or []):
                preview = suggestion[:32] + ("…" if len(suggestion) > 32 else "")
                rows.append(
                    [
                        {
                            "text": f"💬 {idx + 1}: {preview}",
                            "callback_data": f"aireply:{lead_id}:{idx}",
                        },
                        _copy_text_button(suggestion, label="📋"),
                    ]
                )
        rows.append([{"text": "🔄 Обновить подсказки", "callback_data": f"reanalyze:{lead_id}"}])
        rows.append(
            [
                {"text": "◀️ К заявке", "callback_data": f"lead:{lead_id}"},
                {"text": "📋 Список", "callback_data": "leads:0"},
            ]
        )
        return {"inline_keyboard": rows}

    async def _edit_lead_ai(self, chat_id: int, message_id: int, lead_id: int, *, loading: bool = False) -> None:
        lead = get_lead(lead_id)
        if not lead:
            await self.client.edit_message(chat_id, message_id, "Заявка не найдена.", self._main_menu())
            return
        data = serialize_lead(lead)
        ready = not loading and bool(data.get("ai_summary") or data.get("ai_suggestions"))
        await self.client.edit_message(
            chat_id,
            message_id,
            self._lead_ai_text(data, loading=loading),
            self._lead_ai_markup(lead_id, ready=ready and not loading),
        )

    async def _send_settings(self, chat_id: int) -> None:
        await self.client.send_message(chat_id, self._settings_text(), self._settings_markup())

    async def _edit_settings(self, chat_id: int, message_id: int) -> None:
        await self.client.edit_message(chat_id, message_id, self._settings_text(), self._settings_markup())

    def _settings_text(self) -> str:
        ai = "включён ✅" if ai_assistant_enabled() else "выключен ⛔"
        return (
            "⚙️ <b>Настройки</b>\n"
            "━━━━━━━━━━━━━━━\n\n"
            f"🤖 AI-ассистент: <b>{ai}</b>\n\n"
            "Когда включён — бот автоматически готовит варианты ответов для новых заявок."
        )

    def _settings_markup(self) -> dict[str, Any]:
        toggle = "🔴 Выключить AI" if ai_assistant_enabled() else "🟢 Включить AI"
        return {
            "inline_keyboard": [
                [{"text": toggle, "callback_data": "settings:toggle_ai"}],
                [{"text": "🏠 Главное меню", "callback_data": "menu"}],
            ]
        }


def is_password_attempt(text: str) -> bool:
    return bool(text) and not text.startswith("/")
