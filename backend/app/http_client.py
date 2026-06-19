from .config import get_settings


def get_proxy_url() -> str | None:
    value = get_settings().proxy_url.strip()
    return value or None


def httpx_client_kwargs(timeout: float = 30.0) -> dict:
    kwargs: dict = {"timeout": timeout}
    proxy = get_proxy_url()
    if proxy:
        kwargs["proxy"] = proxy
    return kwargs
