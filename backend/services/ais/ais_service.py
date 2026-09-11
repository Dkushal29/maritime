"""
AIS Service coordinating provider selection, telemetry normalization, validation,
caching, and data-status assignment. Supports AISStream.io (WebSocket),
Pelyr (HTTP), AIS Friends (HTTP), Datalastic, VesselFinder, and AISHub.
"""
import os
import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timezone

from .base_provider import BaseAISProvider
from .datalastic_provider import DatalasticAISProvider
from .vesselfinder_provider import VesselFinderAISProvider
from .aishub_provider import AISHubProvider
from .pelyr_provider import PelyrAISProvider
from .ais_friends_provider import AISFriendsProvider
from .aisstream_provider import AISStreamManager, validate_coordinates as validate_coords_stream
from db.database import cache_get, cache_set, log_sync

logger = logging.getLogger("maritime_ai.ais.service")


def validate_coordinates(lat: Any, lon: Any) -> Optional[Tuple[float, float]]:
    """Validates latitude (-90 to 90) and longitude (-180 to 180). Returns None if invalid."""
    return validate_coords_stream(lat, lon)


def get_configured_ais_provider() -> Tuple[Any, str, bool]:
    """
    Resolves the active AIS provider from environment variables.
    Returns (provider_instance_or_manager, provider_code, has_api_key).
    """
    provider_name = os.getenv("AIS_PROVIDER", "aisstream").lower().strip()

    if provider_name == "aisstream":
        key = os.getenv("AISSTREAM_API_KEY", "").strip()
        manager = AISStreamManager.get_instance()
        return manager, "aisstream", bool(key)
    elif provider_name == "pelyr":
        key = os.getenv("PELYR_API_KEY", "").strip()
        return PelyrAISProvider(api_key=key), "pelyr", bool(key)
    elif provider_name == "aisfriends":
        key = os.getenv("AISFRIENDS_API_TOKEN", "").strip()
        return AISFriendsProvider(api_key=key), "aisfriends", bool(key)
    elif provider_name == "datalastic":
        key = (os.getenv("DATALASTIC_API_KEY") or os.getenv("AIS_API_KEY") or "").strip()
        return DatalasticAISProvider(api_key=key), "datalastic", bool(key)
    elif provider_name == "vesselfinder":
        key = (os.getenv("VESSELFINDER_API_KEY") or os.getenv("AIS_API_KEY") or "").strip()
        return VesselFinderAISProvider(api_key=key), "vesselfinder", bool(key)
    elif provider_name == "aishub":
        key = (os.getenv("AISHUB_USERNAME") or os.getenv("AIS_API_KEY") or "").strip()
        return AISHubProvider(api_key=key), "aishub", bool(key)
    else:
        # Default fallback to AISStream
        key = os.getenv("AISSTREAM_API_KEY", "").strip()
        return AISStreamManager.get_instance(), "aisstream", bool(key)


def normalize_raw_vessel(raw: Dict[str, Any], provider_name: str, index: int) -> Dict[str, Any]:
    """Transforms vendor-specific AIS payload into standardized MARITIME AI schema."""
    mmsi = raw.get("mmsi") or raw.get("MMSI")
    mmsi_str = str(mmsi).strip() if mmsi is not None else None

    imo = raw.get("imo") or raw.get("IMO") or raw.get("imoNumber")
    imo_str = str(imo).replace("IMO ", "").strip() if imo and str(imo) != "0" else None

    vessel_name = (
        raw.get("name") or raw.get("vessel_name") or raw.get("NAME") or (f"VESSEL-{mmsi_str}" if mmsi_str else f"Vessel-{index + 1}")
    ).strip()

    vessel_id = raw.get("vessel_id") or raw.get("id") or (f"VES-{imo_str}" if imo_str else f"MMSI-{mmsi_str}" if mmsi_str else f"VES-{str(index + 1).zfill(3)}")

    raw_lat = raw.get("lat") if raw.get("lat") is not None else raw.get("latitude") if raw.get("latitude") is not None else raw.get("LATITUDE")
    raw_lon = raw.get("lon") if raw.get("lon") is not None else raw.get("lng") if raw.get("lng") is not None else raw.get("longitude") if raw.get("longitude") is not None else raw.get("LONGITUDE")
    coords = validate_coordinates(raw_lat, raw_lon)

    speed = raw.get("speed") if raw.get("speed") is not None else raw.get("speed_knots") if raw.get("speed_knots") is not None else raw.get("sog")
    speed_knots = None
    if speed is not None:
        try:
            val = float(speed)
            if val >= 0.0:
                speed_knots = round(val, 1)
        except (ValueError, TypeError):
            pass

    course = raw.get("course") if raw.get("course") is not None else raw.get("course_degrees") if raw.get("course_degrees") is not None else raw.get("cog")
    course_deg = None
    if course is not None:
        try:
            val = float(course)
            if 0.0 <= val <= 360.0:
                course_deg = round(val, 1)
        except (ValueError, TypeError):
            pass

    heading = raw.get("heading") if raw.get("heading") is not None else raw.get("heading_degrees") if raw.get("heading_degrees") is not None else raw.get("true_heading")
    heading_deg = None
    if heading is not None:
        try:
            val = float(heading)
            if 0.0 <= val <= 360.0:
                heading_deg = round(val, 1)
        except (ValueError, TypeError):
            pass

    draught = raw.get("draught") if raw.get("draught") is not None else raw.get("draught_meters") if raw.get("draught_meters") is not None else raw.get("draft")
    draught_m = None
    if draught is not None:
        try:
            val = float(draught)
            if val > 0:
                draught_m = round(val, 1)
        except (ValueError, TypeError):
            pass

    dest = raw.get("destination") or raw.get("dest")
    eta = raw.get("eta")
    status = raw.get("status") or raw.get("nav_status") or raw.get("navigation_status") or ("Underway" if speed_knots and speed_knots > 0.5 else "Anchored")

    timestamp = raw.get("timestamp") or raw.get("last_updated") or datetime.now(timezone.utc).isoformat()

    return {
        "vessel_id": str(vessel_id),
        "id": str(vessel_id),
        "imo": imo_str,
        "mmsi": mmsi_str,
        "name": vessel_name,
        "vessel_name": vessel_name,
        "vessel_type": raw.get("type") or raw.get("vessel_type") or "Bulk Carrier",
        "type": raw.get("type") or raw.get("vessel_type") or "Bulk Carrier",
        "latitude": coords[0] if coords else None,
        "longitude": coords[1] if coords else None,
        "lat": coords[0] if coords else None,
        "lng": coords[1] if coords else None,
        "position_available": coords is not None,
        "speed": speed_knots,
        "speed_knots": speed_knots,
        "course": course_deg,
        "course_degrees": course_deg,
        "heading": heading_deg,
        "heading_degrees": heading_deg,
        "draught": draught_m,
        "draught_meters": draught_m,
        "length": raw.get("length"),
        "beam": raw.get("beam"),
        "destination": str(dest).strip() if dest else None,
        "eta": str(eta) if eta else None,
        "nav_status": raw.get("nav_status", 0),
        "navigation_status": str(status).strip(),
        "timestamp": str(timestamp),
        "last_updated": str(timestamp),
        "source": provider_name.lower().replace(" ", "_"),
        "data_source": provider_name,
        "data_status": "LIVE"
    }


def deduplicate_vessels(vessels: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Deduplicates vessels preferentially by MMSI, then by IMO, then by vessel_id."""
    seen_mmsi = set()
    seen_imo = set()
    seen_id = set()
    unique: List[Dict[str, Any]] = []

    for v in vessels:
        mmsi = v.get("mmsi")
        imo = v.get("imo")
        vid = v.get("vessel_id") or v.get("id")

        if mmsi and mmsi in seen_mmsi:
            continue
        if imo and imo in seen_imo:
            continue
        if vid and vid in seen_id:
            continue

        if mmsi:
            seen_mmsi.add(mmsi)
        if imo:
            seen_imo.add(imo)
        if vid:
            seen_id.add(vid)

        unique.append(v)

    return unique


async def get_live_vessels(
    limit: int = 50,
    bbox: Optional[List[float]] = None
) -> List[Dict[str, Any]]:
    """
    Fetches real AIS vessel telemetry with caching.
    Supports AISStream (WebSocket background cache), Pelyr, AIS Friends, and HTTP fallbacks.
    Respects DATA_MODE and ENABLE_MOCK_FALLBACK.
    """
    cache_key = f"ais_vessels_{limit}_{str(bbox)}"
    cached = cache_get(cache_key)
    if cached is not None:
        val, status, source = cached
        return val

    provider, provider_code, has_key = get_configured_ais_provider()
    data_mode = os.getenv("DATA_MODE", "LIVE").upper()
    enable_mock_fallback = os.getenv("ENABLE_MOCK_FALLBACK", "false").lower() in ("true", "1", "yes")

    # 1. AISStream Provider Branch
    if provider_code == "aisstream":
        manager: AISStreamManager = provider
        tracked = manager.get_vessels(limit=limit)
        if tracked:
            deduped = deduplicate_vessels(tracked)
            cache_set(cache_key, deduped, ttl_seconds=60, data_status="LIVE", data_source="AISStream.io WebSocket")
            log_sync("AIS Fleet", "AISStream.io", "SUCCESS", records=len(deduped))
            return deduped

    # 2. HTTP Providers Branch (Pelyr, AIS Friends, Datalastic, etc.)
    elif data_mode == "LIVE" and has_key and isinstance(provider, BaseAISProvider):
        try:
            raw_list = await provider.fetch_vessels(bbox=bbox, limit=limit)
            if raw_list:
                normalized = [
                    normalize_raw_vessel(raw, provider.get_provider_name(), i)
                    for i, raw in enumerate(raw_list)
                ]
                deduped = deduplicate_vessels(normalized)
                cache_set(cache_key, deduped, ttl_seconds=300, data_status="LIVE", data_source=provider.get_provider_name())
                log_sync("AIS Fleet", provider.get_provider_name(), "SUCCESS", records=len(deduped))
                return deduped
        except Exception as e:
            logger.error(f"Failed to fetch live AIS from {provider.get_provider_name()}: {e}")
            log_sync("AIS Fleet", provider.get_provider_name(), "FAILURE", error=str(e))

    # 3. If mock fallback is not permitted, return empty list - never fabricate fake coordinates!
    if not enable_mock_fallback and data_mode == "LIVE":
        logger.warning(f"Mock fallback disabled and no live AIS data available from {provider_code}. Returning empty list.")
        return []

    # 4. Calibrated baseline data loaded from raw vessels repository when fallback enabled
    import pandas as pd
    vessels_csv = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "raw", "vessels.csv")
    results = []
    if os.path.exists(vessels_csv):
        df = pd.read_csv(vessels_csv)
        for i, row in df.iterrows():
            coords = validate_coordinates(row.get("lat"), row.get("lng"))
            results.append({
                "vessel_id": str(row["id"]),
                "id": str(row["id"]),
                "imo": str(row.get("imo", "")).replace("IMO ", ""),
                "mmsi": None,
                "name": str(row["name"]),
                "vessel_name": str(row["name"]),
                "vessel_type": str(row.get("type", "Bulk Carrier")),
                "type": str(row.get("type", "Bulk Carrier")),
                "latitude": coords[0] if coords else None,
                "longitude": coords[1] if coords else None,
                "lat": coords[0] if coords else None,
                "lng": coords[1] if coords else None,
                "position_available": coords is not None,
                "speed": 12.5,
                "speed_knots": 12.5,
                "course": 135.0,
                "course_degrees": 135.0,
                "heading": 135.0,
                "heading_degrees": 135.0,
                "draught": 14.2,
                "draught_meters": 14.2,
                "destination": str(row.get("route", "")).split("→")[-1].strip() if "→" in str(row.get("route", "")) else "Visakhapatnam",
                "eta": str(row.get("eta", "2026-09-20")),
                "nav_status": 0,
                "navigation_status": "Underway" if row.get("availability") == "In Transit" else "Available",
                "last_updated": datetime.now(timezone.utc).isoformat(),
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "source": "calibrated_baseline",
                "data_source": "Calibrated Maritime AIS Baseline",
                "data_status": "CACHED" if data_mode == "LIVE" else "SIMULATED"
            })

    cache_set(cache_key, results, ttl_seconds=300, data_status="SIMULATED", data_source="Calibrated Maritime AIS Baseline")
    return results
