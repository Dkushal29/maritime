"""
Live AIS Vessel Stream Service via aisstream.io.
Maintains persistent WebSocket connection and in-memory cache of real-time vessel positions.
"""
import os
import json
import asyncio
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
import websockets

logger = logging.getLogger("maritime_ai.ais")

AIS_WS_URL = "wss://stream.aisstream.io/v0/stream"
# Indo-Pacific corridors and South Africa / East Coast India routing boxes
BOUNDING_BOXES = [
    [[-30, 45], [30, 130]],   # Indian Ocean, Bay of Bengal, SE Asia, Australia corridors
    [[-35, 15], [-25, 45]],   # Cape of Good Hope corridor
]
FILTER_MESSAGE_TYPES = ["PositionReport", "ShipStaticData"]

# In-memory storage of live vessels keyed by MMSI
_LIVE_VESSELS: Dict[int, Dict[str, Any]] = {}
_LAST_MESSAGE_AT: Optional[str] = None
_CONNECT_ERROR: Optional[str] = None
_IS_CONNECTED = False
_LISTENER_TASK: Optional[asyncio.Task] = None
_SHUTDOWN_EVENT: Optional[asyncio.Event] = None


def get_api_key() -> Optional[str]:
    key = os.getenv("AISSTREAM_API_KEY", "").strip()
    return key if key else None


def _format_vessel(mmsi: int, data: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "mmsi": mmsi,
        "name": data.get("name") or f"MMSI {mmsi}",
        "latitude": data.get("latitude"),
        "longitude": data.get("longitude"),
        "speed_knots": data.get("speed_knots"),
        "heading_degrees": data.get("heading_degrees"),
        "ship_type": data.get("ship_type") or "Bulk/Cargo",
        "destination": data.get("destination") or "Unknown",
        "eta": data.get("eta"),
        "last_seen": data.get("last_seen"),
    }


async def _process_ais_message(raw_msg: str):
    global _LAST_MESSAGE_AT
    try:
        msg = json.loads(raw_msg)
        msg_type = msg.get("MessageType")
        meta = msg.get("MetaData", {})
        mmsi = meta.get("MMSI")

        if not mmsi:
            return

        now_iso = datetime.now(timezone.utc).isoformat()
        _LAST_MESSAGE_AT = now_iso

        vessel = _LIVE_VESSELS.get(mmsi, {
            "mmsi": mmsi,
            "name": meta.get("ShipName", "").strip(),
            "latitude": meta.get("latitude"),
            "longitude": meta.get("longitude"),
            "last_seen": now_iso,
        })

        if meta.get("ShipName"):
            vessel["name"] = meta.get("ShipName", "").strip()

        if msg_type == "PositionReport":
            pos = msg.get("Message", {}).get("PositionReport", {})
            vessel["latitude"] = pos.get("Latitude", meta.get("latitude"))
            vessel["longitude"] = pos.get("Longitude", meta.get("longitude"))
            vessel["speed_knots"] = pos.get("Sog")
            vessel["heading_degrees"] = pos.get("TrueHeading")
            vessel["last_seen"] = now_iso

        elif msg_type == "ShipStaticData":
            static_data = msg.get("Message", {}).get("ShipStaticData", {})
            vessel["ship_type"] = static_data.get("Type")
            vessel["destination"] = static_data.get("Destination", "").strip()
            vessel["eta"] = static_data.get("Eta")
            vessel["last_seen"] = now_iso

        _LIVE_VESSELS[mmsi] = vessel

        # Limit cache size to 1000 latest vessels to prevent unbounded memory growth
        if len(_LIVE_VESSELS) > 1000:
            oldest_key = min(_LIVE_VESSELS.keys(), key=lambda k: _LIVE_VESSELS[k].get("last_seen", ""))
            _LIVE_VESSELS.pop(oldest_key, None)

    except Exception as e:
        logger.debug(f"Error parsing AIS message: {e}")


async def _ais_websocket_loop():
    global _IS_CONNECTED, _CONNECT_ERROR

    api_key = get_api_key()
    if not api_key:
        logger.warning("AISSTREAM_API_KEY is not set or empty. Live AIS vessel tracking is disabled.")
        return

    subscribe_msg = json.dumps({
        "APIKey": api_key,
        "BoundingBoxes": BOUNDING_BOXES,
        "FilterMessageTypes": FILTER_MESSAGE_TYPES,
    })

    backoff = 2
    max_backoff = 60

    while _SHUTDOWN_EVENT and not _SHUTDOWN_EVENT.is_set():
        try:
            logger.info("Connecting to aisstream.io live AIS feed...")
            async with websockets.connect(AIS_WS_URL, ping_interval=20, ping_timeout=20) as ws:
                await ws.send(subscribe_msg)
                _IS_CONNECTED = True
                _CONNECT_ERROR = None
                backoff = 2
                logger.info("Connected to aisstream.io live AIS feed.")

                while _SHUTDOWN_EVENT and not _SHUTDOWN_EVENT.is_set():
                    try:
                        msg = await asyncio.wait_for(ws.recv(), timeout=30)
                        await _process_ais_message(msg)
                    except asyncio.TimeoutError:
                        # Send ping or wait
                        continue
                    except asyncio.CancelledError:
                        break

        except asyncio.CancelledError:
            break
        except Exception as e:
            _IS_CONNECTED = False
            _CONNECT_ERROR = str(e)
            logger.warning(f"AIS WebSocket connection error: {e}. Retrying in {backoff}s...")
            try:
                await asyncio.sleep(backoff)
            except asyncio.CancelledError:
                break
            backoff = min(backoff * 2, max_backoff)

    _IS_CONNECTED = False
    logger.info("AIS WebSocket listener stopped.")


def start_ais_listener() -> Optional[asyncio.Task]:
    global _LISTENER_TASK, _SHUTDOWN_EVENT
    api_key = get_api_key()
    if not api_key:
        logger.warning("AISSTREAM_API_KEY is unset. Skipping AIS live listener startup.")
        return None

    if _LISTENER_TASK is None or _LISTENER_TASK.done():
        _SHUTDOWN_EVENT = asyncio.Event()
        _LISTENER_TASK = asyncio.create_task(_ais_websocket_loop())
        logger.info("AIS background listener task spawned.")
    return _LISTENER_TASK


async def stop_ais_listener():
    global _LISTENER_TASK, _SHUTDOWN_EVENT, _IS_CONNECTED
    if _SHUTDOWN_EVENT:
        _SHUTDOWN_EVENT.set()
    if _LISTENER_TASK and not _LISTENER_TASK.done():
        _LISTENER_TASK.cancel()
        try:
            await _LISTENER_TASK
        except asyncio.CancelledError:
            pass
    _IS_CONNECTED = False
    _LISTENER_TASK = None
    _SHUTDOWN_EVENT = None


def get_live_traffic() -> Dict[str, Any]:
    """Returns current live traffic status and monitored vessels."""
    api_key = get_api_key()
    enabled = bool(api_key)
    vessels_list = [_format_vessel(mmsi, v) for mmsi, v in _LIVE_VESSELS.items()]

    return {
        "enabled": enabled,
        "connected": _IS_CONNECTED,
        "vessel_count": len(vessels_list),
        "vessels": vessels_list,
        "last_message_at": _LAST_MESSAGE_AT,
        "connect_error": _CONNECT_ERROR,
        "source": "aisstream.io" if enabled else "none",
    }
