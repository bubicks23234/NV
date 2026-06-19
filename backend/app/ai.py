import json
import logging
import re
from typing import Any

import httpx
from duckduckgo_search import DDGS

from .config import get_settings
from .database import ai_assistant_enabled, update_lead_ai
from .http_client import get_proxy_url, httpx_client_kwargs

logger = logging.getLogger(__name__)


def search_web(query: str, max_results: int = 4) -> str:
    try:
        proxy = get_proxy_url()
        with DDGS(proxy=proxy) as ddgs:
            results = list(ddgs.text(query, max_results=max_results))
        if not results:
            return "Поиск не дал результатов."
        lines = []
        for item in results:
            title = item.get("title", "")
            body = item.get("body", "")
            href = item.get("href", "")
            lines.append(f"- {title}: {body} ({href})")
        return "\n".join(lines)
    except Exception as exc:
        logger.warning("DuckDuckGo search failed: %s", exc)
        return "Поиск временно недоступен."


async def call_deepseek(messages: list[dict[str, str]]) -> str:
    settings = get_settings()
    if not settings.deepseek_api_key:
        return ""

    async with httpx.AsyncClient(**httpx_client_kwargs(60.0)) as client:
        response = await client.post(
            f"{settings.deepseek_base_url.rstrip('/')}/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.deepseek_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": settings.deepseek_model,
                "messages": messages,
                "temperature": 0.4,
            },
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]


async def process_lead_with_ai(lead: dict[str, Any]) -> None:
    if not ai_assistant_enabled():
        return

    settings = get_settings()
    if not settings.deepseek_api_key:
        return

    search_query = (
        f"проектирование строительство Донецк {lead.get('message', '')[:120]}".strip()
    )
    search_notes = search_web(search_query)

    system_prompt = (
        "Ты — AI-ассистент компании ООО «НОВЫЕ ТЕХНОЛОГИИ» (проектирование и инжиниринг в Донецке). "
        "Анализируй заявки клиентов и предлагай краткие варианты ответа менеджеру. "
        "Отвечай строго JSON без markdown: "
        '{"summary":"краткий разбор заявки","suggestions":["ответ 1","ответ 2","ответ 3"]}'
    )

    user_prompt = (
        f"Заявка #{lead['id']}\n"
        f"Имя: {lead['name']}\n"
        f"Телефон: {lead['phone']}\n"
        f"Сообщение: {lead['message'] or 'не указано'}\n\n"
        f"Контекст из интернета (DuckDuckGo):\n{search_notes}"
    )

    try:
        raw = await call_deepseek(
            [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ]
        )
        raw = raw.strip()
        if raw.startswith("```"):
            raw = re.sub(r"^```(?:json)?\s*", "", raw)
            raw = re.sub(r"\s*```$", "", raw)
        parsed = json.loads(raw)
        summary = str(parsed.get("summary", "")).strip()
        suggestions = [str(x).strip() for x in parsed.get("suggestions", []) if str(x).strip()]
        if not suggestions:
            suggestions = [
                "Здравствуйте! Спасибо за обращение. Уточним детали проекта и перезвоним в ближайшее время.",
                "Добрый день! Получили вашу заявку. Подскажите, пожалуйста, тип объекта и сроки.",
            ]
        update_lead_ai(lead["id"], summary, suggestions[:5], search_notes)
    except Exception as exc:
        logger.exception("AI processing failed for lead %s: %s", lead.get("id"), exc)
        update_lead_ai(
            lead["id"],
            "Автоанализ временно недоступен. Проверьте заявку вручную.",
            [
                "Здравствуйте! Спасибо за заявку — менеджер свяжется с вами в ближайшее время.",
                "Добрый день! Мы получили ваше обращение и уже передали его специалисту.",
            ],
            search_notes,
        )
