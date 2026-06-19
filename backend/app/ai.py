import json
import logging
import re
from typing import Any

import httpx

from .config import get_settings
from .database import ai_assistant_enabled, update_lead_ai
from .http_client import httpx_client_kwargs

logger = logging.getLogger(__name__)

_client: httpx.AsyncClient | None = None


async def get_http_client() -> httpx.AsyncClient:
    global _client
    if _client is None:
        _client = httpx.AsyncClient(**httpx_client_kwargs(45.0))
    return _client


def search_web(query: str, max_results: int = 3) -> str:
    if not get_settings().ai_web_search:
        return ""
    try:
        from duckduckgo_search import DDGS

        from .http_client import get_proxy_url

        proxy = get_proxy_url()
        with DDGS(proxy=proxy, timeout=8) as ddgs:
            results = list(ddgs.text(query, max_results=max_results))
        if not results:
            return ""
        lines = []
        for item in results:
            title = item.get("title", "")
            body = (item.get("body") or "")[:120]
            lines.append(f"• {title}: {body}")
        return "\n".join(lines)
    except Exception as exc:
        logger.warning("DuckDuckGo search skipped: %s", exc)
        return ""


async def call_deepseek(messages: list[dict[str, str]]) -> str:
    settings = get_settings()
    if not settings.deepseek_api_key:
        return ""

    client = await get_http_client()
    response = await client.post(
        f"{settings.deepseek_base_url.rstrip('/')}/chat/completions",
        headers={
            "Authorization": f"Bearer {settings.deepseek_api_key}",
            "Content-Type": "application/json",
        },
        json={
            "model": settings.deepseek_model,
            "messages": messages,
            "temperature": 0.35,
            "max_tokens": 700,
        },
        timeout=45.0,
    )
    response.raise_for_status()
    data = response.json()
    return data["choices"][0]["message"]["content"]


async def process_lead_with_ai(lead: dict[str, Any], *, use_web: bool | None = None) -> None:
    if not ai_assistant_enabled():
        return

    settings = get_settings()
    if not settings.deepseek_api_key:
        return

    import asyncio

    search_notes = ""
    if use_web if use_web is not None else settings.ai_web_search:
        query = f"проектирование Донецк {(lead.get('message') or '')[:80]}".strip()
        search_notes = await asyncio.to_thread(search_web, query)

    web_block = f"\n\nКонтекст из поиска:\n{search_notes}" if search_notes else ""

    system_prompt = (
        "Ты — дружелюбный AI-помощник менеджера компании ООО «НОВЫЕ ТЕХНОЛОГИИ» "
        "(проектирование и инжиниринг в Донецке). "
        "Кратко разбери заявку и предложи 3 вежливых варианта ответа клиенту на русском. "
        "Отвечай строго JSON: "
        '{"summary":"2-3 предложения","suggestions":["полный текст ответа 1","полный текст 2","полный текст 3"]}'
    )

    user_prompt = (
        f"Заявка #{lead['id']}\n"
        f"Имя: {lead['name']}\n"
        f"Телефон: {lead['phone']}\n"
        f"Сообщение: {lead['message'] or 'не указано'}"
        f"{web_block}"
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
                "Здравствуйте! Спасибо за обращение в «Новые Технологии». Мы получили вашу заявку и скоро свяжемся с вами для уточнения деталей.",
                "Добрый день! Благодарим за интерес к нашим услугам. Подскажите, пожалуйста, удобное время для звонка?",
            ]
        update_lead_ai(lead["id"], summary, suggestions[:3], search_notes)
    except Exception as exc:
        logger.exception("AI processing failed for lead %s: %s", lead.get("id"), exc)
        update_lead_ai(
            lead["id"],
            "Пока не удалось получить подсказки автоматически. Ответьте клиенту вручную — контакты выше.",
            [
                "Здравствуйте! Спасибо за заявку — специалист «Новые Технологии» свяжется с вами в ближайшее время.",
            ],
            search_notes,
        )
