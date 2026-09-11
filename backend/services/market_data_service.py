"""
Live Market Data Service.
Fetches real USD/INR foreign exchange rates and WTI crude oil prices.
Implements TTL caching and strict data honesty: unconfigured or failed feeds
return null with explicit explanations, never fabricated numbers.
"""
import os
import time
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
import httpx

logger = logging.getLogger("maritime_ai.market_data")

FRANKFURTER_URL = "https://api.frankfurter.app/latest?from=USD&to=INR"
EIA_BASE_URL = "https://api.eia.gov/v2/petroleum/pri/spt/data/"

# In-memory cache
_CACHE_DATA: Optional[Dict[str, Any]] = None
_CACHE_TIMESTAMP: float = 0


def _get_cache_ttl() -> int:
    try:
        return int(os.getenv("MARKET_DATA_CACHE_TTL", "900"))
    except ValueError:
        return 900


async def fetch_usd_inr(client: httpx.AsyncClient) -> tuple[Optional[float], Optional[str], Optional[str]]:
    """Fetches real-time USD to INR spot rate from Frankfurter (ECB reference rate)."""
    try:
        resp = await client.get(FRANKFURTER_URL, timeout=10.0)
        if resp.status_code == 200:
            data = resp.json()
            rate = data.get("rates", {}).get("INR")
            if rate is not None:
                return float(rate), "api.frankfurter.app (ECB reference)", None
        return None, None, f"Frankfurter returned status {resp.status_code}"
    except Exception as e:
        logger.warning(f"Failed to fetch USD/INR rate: {e}")
        return None, None, f"USD/INR fetch error: {str(e)}"


async def fetch_wti_crude(client: httpx.AsyncClient) -> tuple[Optional[float], Optional[str], Optional[str]]:
    """Fetches latest Cushing OK WTI spot crude oil price from EIA API v2."""
    api_key = os.getenv("EIA_API_KEY", "").strip()
    if not api_key:
        return None, None, "EIA_API_KEY is not configured in environment"

    params = {
        "api_key": api_key,
        "frequency": "daily",
        "data[0]": "value",
        "facets[series][]": "RWTC",
        "sort[0][column]": "period",
        "sort[0][direction]": "desc",
        "offset": "0",
        "length": "1",
    }

    try:
        resp = await client.get(EIA_BASE_URL, params=params, timeout=10.0)
        if resp.status_code == 200:
            data = resp.json()
            rows = data.get("response", {}).get("data", [])
            if rows and "value" in rows[0] and rows[0]["value"] is not None:
                val = float(rows[0]["value"])
                period = rows[0].get("period", "")
                source_label = f"U.S. EIA API v2 (RWTC spot, {period})"
                return val, source_label, None
            return None, None, "EIA response contained no valid price rows"
        return None, None, f"EIA API returned status {resp.status_code}: {resp.text[:100]}"
    except Exception as e:
        logger.warning(f"Failed to fetch WTI crude price: {e}")
        return None, None, f"WTI crude fetch error: {str(e)}"


async def get_market_data(force_refresh: bool = False) -> Dict[str, Any]:
    """
    Returns live market data with TTL caching.
    Guarantees null values for non-public commercial data (BDI, bunker fuel)
    and unconfigured feeds, adhering strictly to the data honesty rule.
    """
    global _CACHE_DATA, _CACHE_TIMESTAMP

    now = time.time()
    ttl = _get_cache_ttl()

    if not force_refresh and _CACHE_DATA is not None and (now - _CACHE_TIMESTAMP) < ttl:
        result = dict(_CACHE_DATA)
        result["cache_hit"] = True
        return result

    errors: List[str] = []

    async with httpx.AsyncClient() as client:
        usd_inr, usd_inr_src, fx_err = await fetch_usd_inr(client)
        if fx_err:
            errors.append(fx_err)

        wti_price, wti_src, wti_err = await fetch_wti_crude(client)
        if wti_err:
            errors.append(wti_err)

    market_result = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "usd_inr": usd_inr,
        "usd_inr_source": usd_inr_src,
        "wti_crude_oil": wti_price,
        "wti_crude_oil_unit": "USD/barrel",
        "wti_crude_oil_source": wti_src,
        "baltic_dry_index": None,
        "baltic_dry_index_note": "No free public API exists; requires commercial Baltic Exchange license",
        "bunker_price_vlsfo": None,
        "bunker_price_vlsfo_note": "No free public API exists; requires commercial S&P Global Platts subscription",
        "cache_hit": False,
        "cache_ttl_seconds": ttl,
        "errors": errors if errors else None,
    }

    _CACHE_DATA = market_result
    _CACHE_TIMESTAMP = now

    return market_result
