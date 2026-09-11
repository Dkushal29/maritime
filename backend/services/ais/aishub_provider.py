"""
AISHub Provider implementation.
Docs: https://www.aishub.net/api
"""
import logging
from typing import List, Dict, Any, Optional
import httpx
from .base_provider import BaseAISProvider

logger = logging.getLogger("maritime_ai.ais.aishub")

AISHUB_BASE_URL = "https://data.aishub.net/ws.php"


class AISHubProvider(BaseAISProvider):
    def get_provider_name(self) -> str:
        return "AISHub Community Network"

    async def fetch_vessels(
        self,
        vessel_types: Optional[List[str]] = None,
        bbox: Optional[List[float]] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        if not self.api_key:
            logger.warning("AISHub username/key not configured.")
            return []

        min_lat, min_lon, max_lat, max_lon = bbox if bbox and len(bbox) == 4 else [-25.0, 60.0, 25.0, 125.0]

        params = {
            "username": self.api_key,
            "format": "1",
            "output": "json",
            "compress": "0",
            "latmin": min_lat,
            "latmax": max_lat,
            "lonmin": min_lon,
            "lonmax": max_lon
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(AISHUB_BASE_URL, params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    # AISHub format returns [[header], [records...]]
                    if isinstance(data, list) and len(data) > 1:
                        return data[1][:limit]
                    return []
                else:
                    logger.error(f"AISHub API returned HTTP {resp.status_code}: {resp.text[:150]}")
                    return []
        except Exception as e:
            logger.error(f"AISHub request exception: {e}")
            return []
