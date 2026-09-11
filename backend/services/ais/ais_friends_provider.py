"""
AIS Friends Provider implementation.
Base URL: https://www.aisfriends.com/api/public/v1
Authentication: Bearer token
"""
import os
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import httpx
from .base_provider import BaseAISProvider
from .aisstream_provider import validate_coordinates

logger = logging.getLogger("maritime_ai.ais.ais_friends")

DEFAULT_AISFRIENDS_URL = "https://www.aisfriends.com/api/public/v1"


class AISFriendsProvider(BaseAISProvider):
    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None):
        super().__init__(api_key=api_key)
        self.base_url = (base_url or os.getenv("AISFRIENDS_API_URL") or DEFAULT_AISFRIENDS_URL).rstrip("/")

    def get_provider_name(self) -> str:
        return "AIS Friends"

    async def fetch_vessels(
        self,
        vessel_types: Optional[List[str]] = None,
        bbox: Optional[List[float]] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        if not self.api_key:
            logger.warning("AIS Friends API token not configured.")
            return []

        # bbox: [min_lat, min_lon, max_lat, max_lon]
        min_lat, min_lon, max_lat, max_lon = bbox if bbox and len(bbox) == 4 else [8.0, 60.0, 25.0, 78.0]

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Accept": "application/json"
        }
        params = {
            "lat_min": min_lat,
            "lon_min": min_lon,
            "lat_max": max_lat,
            "lon_max": max_lon,
            "limit": limit
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(f"{self.base_url}/vessels", headers=headers, params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    raw_list = data if isinstance(data, list) else data.get("data", [])
                    return self._normalize_vessels(raw_list)
                elif resp.status_code in (401, 403):
                    logger.error(f"AIS Friends auth failure: HTTP {resp.status_code}")
                    return []
                else:
                    logger.error(f"AIS Friends error: HTTP {resp.status_code}")
                    return []
        except httpx.TimeoutException:
            logger.warning("AIS Friends request timed out.")
            return []
        except Exception as e:
            logger.error(f"AIS Friends exception: {e}")
            return []

    def _normalize_vessels(self, raw_list: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        normalized = []
        for v in raw_list:
            mmsi = str(v.get("mmsi") or "").strip()
            name = str(v.get("name") or v.get("vessel_name") or f"VESSEL-{mmsi}").strip()
            coords = validate_coordinates(v.get("lat") or v.get("latitude"), v.get("lon") or v.get("longitude"))

            speed = float(v.get("speed", 0)) if v.get("speed") is not None else None
            course = float(v.get("course", 0)) if v.get("course") is not None else None

            normalized.append({
                "mmsi": mmsi if mmsi else None,
                "vessel_id": f"AISF-{mmsi if mmsi else len(normalized)+1}",
                "name": name,
                "vessel_name": name,
                "imo": str(v.get("imo")) if v.get("imo") else None,
                "latitude": coords[0] if coords else None,
                "longitude": coords[1] if coords else None,
                "position_available": coords is not None,
                "speed": speed,
                "speed_knots": speed,
                "course": course,
                "course_degrees": course,
                "heading": v.get("heading"),
                "heading_degrees": v.get("heading"),
                "nav_status": v.get("nav_status", 0),
                "navigation_status": "Underway" if speed and speed > 0.5 else "Anchored",
                "destination": v.get("destination"),
                "vessel_type": v.get("type", "Bulk Carrier"),
                "timestamp": v.get("timestamp") or datetime.now(timezone.utc).isoformat(),
                "last_updated": v.get("timestamp") or datetime.now(timezone.utc).isoformat(),
                "source": "aisfriends",
                "data_source": "AIS Friends",
                "data_status": "LIVE"
            })
        return normalized
