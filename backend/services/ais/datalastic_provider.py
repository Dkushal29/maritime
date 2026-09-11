"""
Datalastic AIS Provider implementation.
Docs: https://datalastic.com/api-maritime-documentation/
"""
import logging
from typing import List, Dict, Any, Optional
import httpx
from .base_provider import BaseAISProvider

logger = logging.getLogger("maritime_ai.ais.datalastic")

DATALASTIC_BASE_URL = "https://api.datalastic.com/api/v0"


class DatalasticAISProvider(BaseAISProvider):
    def get_provider_name(self) -> str:
        return "Datalastic AIS"

    async def fetch_vessels(
        self,
        vessel_types: Optional[List[str]] = None,
        bbox: Optional[List[float]] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        if not self.api_key:
            logger.warning("Datalastic API key not configured.")
            return []

        # Default to Indo-Pacific shipping corridor bbox if none provided
        # [min_lat, min_lon, max_lat, max_lon] -> -25 to 25 lat, 60 to 125 lon
        min_lat, min_lon, max_lat, max_lon = bbox if bbox and len(bbox) == 4 else [-25.0, 60.0, 25.0, 125.0]

        params = {
            "api-key": self.api_key,
            "min_lat": min_lat,
            "min_lon": min_lon,
            "max_lat": max_lat,
            "max_lon": max_lon,
            "limit": limit
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(f"{DATALASTIC_BASE_URL}/vessel_in_radius", params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    vessels = data.get("data", {}).get("vessels", [])
                    return vessels if isinstance(vessels, list) else []
                else:
                    logger.error(f"Datalastic API returned HTTP {resp.status_code}: {resp.text[:150]}")
                    return []
        except Exception as e:
            logger.error(f"Datalastic AIS request exception: {e}")
            return []
