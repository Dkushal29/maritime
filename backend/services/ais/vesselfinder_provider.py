"""
VesselFinder AIS Provider implementation.
"""
import logging
from typing import List, Dict, Any, Optional
import httpx
from .base_provider import BaseAISProvider

logger = logging.getLogger("maritime_ai.ais.vesselfinder")

VESSELFINDER_BASE_URL = "https://api.vesselfinder.com"


class VesselFinderAISProvider(BaseAISProvider):
    def get_provider_name(self) -> str:
        return "VesselFinder AIS"

    async def fetch_vessels(
        self,
        vessel_types: Optional[List[str]] = None,
        bbox: Optional[List[float]] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        if not self.api_key:
            logger.warning("VesselFinder API key not configured.")
            return []

        # [min_lat, min_lon, max_lat, max_lon]
        min_lat, min_lon, max_lat, max_lon = bbox if bbox and len(bbox) == 4 else [-25.0, 60.0, 25.0, 125.0]

        params = {
            "userkey": self.api_key,
            "format": "json",
            "bbox": f"{min_lat},{min_lon},{max_lat},{max_lon}",
            "limit": limit
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(f"{VESSELFINDER_BASE_URL}/vesselslist", params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    return data if isinstance(data, list) else data.get("vessels", [])
                else:
                    logger.error(f"VesselFinder API returned HTTP {resp.status_code}: {resp.text[:150]}")
                    return []
        except Exception as e:
            logger.error(f"VesselFinder AIS request exception: {e}")
            return []
