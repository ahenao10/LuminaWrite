import asyncio
import json
import os
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Dict, Optional

from fastapi import HTTPException


def _get_supabase_config() -> tuple[str, str]:
    url = os.getenv("SUPABASE_URL", "").rstrip("/")
    anon_key = os.getenv("SUPABASE_ANON_KEY", "")
    if not url or not anon_key:
        raise HTTPException(
            status_code=500,
            detail="SUPABASE_URL and SUPABASE_ANON_KEY must be configured in backend/.env",
        )
    return url, anon_key


def _sync_request(
    method: str,
    full_url: str,
    headers: Dict[str, str],
    body: Optional[Any] = None,
) -> Any:
    data = None
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        headers.setdefault("Content-Type", "application/json")

    req = urllib.request.Request(full_url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            raw = resp.read().decode("utf-8")
            if not raw:
                return None
            return json.loads(raw)
    except urllib.error.HTTPError as exc:
        raw_err = exc.read().decode("utf-8", errors="replace")
        try:
            err_json = json.loads(raw_err)
            msg = (
                err_json.get("error_description")
                or err_json.get("msg")
                or err_json.get("message")
                or err_json.get("error")
                or raw_err
            )
        except Exception:
            msg = raw_err or str(exc)
        raise HTTPException(status_code=exc.code, detail=msg) from exc
    except urllib.error.URLError as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Unable to reach Supabase: {exc.reason}",
        ) from exc


async def supabase_auth_request(
    method: str,
    path: str,
    body: Optional[Dict[str, Any]] = None,
    access_token: Optional[str] = None,
) -> Any:
    url, anon_key = _get_supabase_config()
    headers = {
        "apikey": anon_key,
        "Accept": "application/json",
    }
    if access_token:
        headers["Authorization"] = f"Bearer {access_token}"
    full_url = f"{url}/auth/v1{path}"
    return await asyncio.to_thread(_sync_request, method, full_url, headers, body)


async def supabase_rest_request(
    method: str,
    table_and_query: str,
    access_token: str,
    body: Optional[Any] = None,
    prefer: Optional[str] = None,
) -> Any:
    url, anon_key = _get_supabase_config()
    headers = {
        "apikey": anon_key,
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/json",
    }
    if prefer:
        headers["Prefer"] = prefer
    full_url = f"{url}/rest/v1/{table_and_query.lstrip('/')}"
    return await asyncio.to_thread(_sync_request, method, full_url, headers, body)

