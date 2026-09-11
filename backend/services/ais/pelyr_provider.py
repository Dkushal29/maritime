"""
Pelyr OPEN-AIS HTTP Provider implementation.
Base URL: https://api.pelyr.com
Endpoint: /v1/vessels
Authentication: Bearer token
"""
import os
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import httpx
from .base_provider import BaseAISProvider
from .aisstream_provider import validate_coordinates

logger = logging.getLogger("maritime_ai.ais.pelyr")

DEFAULT_PELYR_URL = "https://api.pelyr.com"


class PelyrAISProvider(BaseAISProvider):
    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None):
        super().__init__(api_key=api_key)
        self.base_url = (base_url or os.getenv("PELYR_API_URL") or DEFAULT_PELYR_URL).rstrip("/")

    def get_provider_name(self) -> str:
        return "Pelyr OPEN-AIS"

    async def fetch_vessels(
        self,
        vessel_types: Optional[List[str]] = None,
        bbox: Optional[List[float]] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        if not self.api_key:
            logger.warning("Pelyr API key not configured.")
            return []

        # Convert bbox [min_lat, min_lon, max_lat, max_lon] or default to Indo-Pacific
        min_lat, min_lon, max_lat, max_lon = bbox if bbox and len(bbox) == 4 else [8.0, 60.0, 25.0, 78.0]
        vbox_param = f"{min_lon},{min_lat},{max_lon},{max_lat}"

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Accept": "application/json"
        }
        params = {
            "vbox": vbox_param,
            "max": min(limit, 100)
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(f"{self.base_url}/v1/vessels", headers=headers, params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    raw_vessels = data if isinstance(data, list) else data.get("vessels", [])
                    return self._normalize_pelyr_vessels(raw_vessels)
                elif resp.status_code in (401, 403):
                    logger.error(f"Pelyr authentication failed: HTTP {resp.status_code}")
                    return []
                elif resp.status_code == 429:
                    logger.warning("Pelyr rate limit encountered.")
                    return []
                else:
                    logger.error(f"Pelyr API error: HTTP {resp.status_code}")
                    return []
        except httpx.TimeoutException:
            logger.warning("Pelyr API request timed out.")
            return []
        except Exception as e:
            logger.error(f"Pelyr request exception: {e}")
            return []

    def _normalize_pelyr_vessels(self, raw_list: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        normalized = []
        for v in raw_list:
            mmsi = str(v.get("mmsi") or v.get("MMSI") or "").strip()
            name = str(v.get("name") or v.get("ship_name") or f"VESSEL-{mmsi}").strip()
            imo = str(v.get("imo") or v.get("IMO") or "")
            coords = validate_coordinates(v.get("latitude") or v.get("lat"), v.get("longitude") or v.get("lon"))

            sog = v.get("speed") or v.get("sog")
            speed = float(sog) if sog is not None and float(sog) >= 0 else None
            cog = v.get("course") or v.get("cog")
            course = float(cog) if cog is not None and 0.0 <= float(cog) <= 360.0 else None

            normalized.append({
                "mmsi": mmsi if mmsi else None,
                "vessel_id": f"PELYR-{mmsi if mmsi else len(normalized)+1}",
                "name": name,
                "vessel_name": name,
                "imo": imo if imo and imo != "0" else None,
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
                "draught": v.get("draught"),
                "timestamp": v.get("timestamp") or datetime.now(timezone.utc).isoformat(),
                "last_updated": v.get("timestamp") or datetime.now(timezone.utc).isoformat(),
                "source": "pelyr",
                "data_source": "Pelyr OPEN-AIS",
                "data_status": "LIVE"
            })
        return normalized
