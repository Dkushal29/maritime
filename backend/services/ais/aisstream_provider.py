"""
AISStream.io WebSocket Provider and Background Consumer.
Continuous live AIS tracking connecting to wss://stream.aisstream.io/v0/stream.
Implements bounded geospatial subscription, dynamic/static report merging by MMSI,
exponential backoff reconnection, and clean lifecycle management.
"""
import os
import json
import asyncio
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import websockets
from dotenv import load_dotenv
from .base_provider import BaseAISProvider
from db.database import log_sync

logger = logging.getLogger("maritime_ai.ais.aisstream")

DEFAULT_WS_URL = "wss://stream.aisstream.io/v0/stream"


def parse_bbox_config(bbox_str: Optional[str]) -> List[List[List[float]]]:
    """
    Parses AIS_BBOX configuration string (e.g. '8,25,60,78') into AISStream format:
    [[[min_lat, min_lon], [max_lat, max_lon]]].
    Defaults to Indo-Pacific corridor bounding box if unset or invalid.
    """
    default_box = [[[8.0, 60.0], [25.0, 78.0]]]
    if not bbox_str:
        return default_box

    try:
        parts = [float(p.strip()) for p in bbox_str.split(",") if p.strip()]
        if len(parts) == 4:
            # Format: min_lat, max_lat, min_lon, max_lon (e.g. 8,25,60,78)
            p1, p2, p3, p4 = parts
            min_lat = min(p1, p2)
            max_lat = max(p1, p2)
            min_lon = min(p3, p4)
            max_lon = max(p3, p4)
            return [[[min_lat, min_lon], [max_lat, max_lon]]]
    except Exception as e:
        logger.warning(f"Error parsing AIS_BBOX '{bbox_str}': {e}. Using default bounding box.")

    return default_box


def validate_coordinates(lat: Any, lon: Any) -> Optional[tuple[float, float]]:
    """Validates latitude (-90 to 90) and longitude (-180 to 180)."""
    try:
        if lat is None or lon is None:
            return None
        f_lat = float(lat)
        f_lon = float(lon)
        if -90.0 <= f_lat <= 90.0 and -180.0 <= f_lon <= 180.0:
            # Reject default zero-zero out-of-range or invalid fixes
            if abs(f_lat) < 0.0001 and abs(f_lon) < 0.0001:
                return None
            return round(f_lat, 5), round(f_lon, 5)
    except (ValueError, TypeError):
        pass
    return None


def parse_ais_message(raw_msg: Dict[str, Any], live_store: Dict[str, Dict[str, Any]]):
    """
    Parses dynamic PositionReport and static ShipStaticData messages from AISStream,
    merging fields into live_store by MMSI.
    """
    msg_type = raw_msg.get("MessageType")
    meta = raw_msg.get("MetaData", {})
    payload = raw_msg.get("Message", {})

    mmsi = meta.get("MMSI") or meta.get("mmsi")
    if not mmsi:
        return

    mmsi_str = str(mmsi).strip()
    existing = live_store.get(mmsi_str, {})

    # Extract common metadata
    ship_name = meta.get("ShipName") or existing.get("name") or f"VESSEL-{mmsi_str}"
    time_utc = meta.get("time_utc") or datetime.now(timezone.utc).isoformat()

    if msg_type == "PositionReport":
        pos_data = payload.get("PositionReport", {})
        raw_lat = meta.get("latitude") if meta.get("latitude") is not None else pos_data.get("Latitude")
        raw_lon = meta.get("longitude") if meta.get("longitude") is not None else pos_data.get("Longitude")
        coords = validate_coordinates(raw_lat, raw_lon)

        sog = pos_data.get("Sog")
        cog = pos_data.get("Cog")
        heading = pos_data.get("TrueHeading")
        nav_status = pos_data.get("NavigationalStatus")

        speed = float(sog) if sog is not None and float(sog) >= 0 else existing.get("speed")
        course = float(cog) if cog is not None and 0.0 <= float(cog) <= 360.0 else existing.get("course")
        true_heading = float(heading) if heading is not None and 0.0 <= float(heading) <= 360.0 else existing.get("heading")

        existing.update({
            "mmsi": mmsi_str,
            "vessel_id": existing.get("vessel_id", f"MMSI-{mmsi_str}"),
            "name": str(ship_name).strip(),
            "vessel_name": str(ship_name).strip(),
            "latitude": coords[0] if coords else existing.get("latitude"),
            "longitude": coords[1] if coords else existing.get("longitude"),
            "position_available": coords is not None or existing.get("position_available", False),
            "speed": speed,
            "speed_knots": speed,
            "course": course,
            "course_degrees": course,
            "heading": true_heading,
            "heading_degrees": true_heading,
            "nav_status": nav_status if nav_status is not None else existing.get("nav_status", 0),
            "navigation_status": "Underway" if speed and speed > 0.5 else "Anchored",
            "timestamp": time_utc,
            "last_updated": time_utc,
            "source": "aisstream",
            "data_source": "AISStream.io WebSocket",
            "data_status": "LIVE"
        })

    elif msg_type in ("ShipStaticData", "StaticDataReport"):
        static_data = payload.get("ShipStaticData") or payload.get("StaticDataReport", {})
        imo = static_data.get("ImoNumber") or meta.get("ImoNumber")
        dest = static_data.get("Destination")
        vessel_type = static_data.get("Type") or static_data.get("ShipType")
        dimension = static_data.get("Dimension", {})
        draught = static_data.get("MaximumStaticDraught")

        existing.update({
            "mmsi": mmsi_str,
            "vessel_id": existing.get("vessel_id", f"MMSI-{mmsi_str}"),
            "name": str(static_data.get("Name") or ship_name).strip(),
            "vessel_name": str(static_data.get("Name") or ship_name).strip(),
            "imo": str(imo) if imo and str(imo) != "0" else existing.get("imo"),
            "imoNumber": str(imo) if imo and str(imo) != "0" else existing.get("imoNumber"),
            "destination": str(dest).strip() if dest else existing.get("destination"),
            "vessel_type": str(vessel_type) if vessel_type else existing.get("vessel_type", "Bulk Carrier"),
            "type": "Bulk Carrier" if "BULK" in str(ship_name).upper() else existing.get("type", "Cargo Vessel"),
            "draught": float(draught) if draught else existing.get("draught"),
            "length": dimension.get("A", 0) + dimension.get("B", 0) if isinstance(dimension, dict) else None,
            "beam": dimension.get("C", 0) + dimension.get("D", 0) if isinstance(dimension, dict) else None,
            "timestamp": time_utc,
            "last_updated": time_utc,
            "source": "aisstream",
            "data_source": "AISStream.io WebSocket",
            "data_status": "LIVE"
        })

    live_store[mmsi_str] = existing


class AISStreamManager:
    """Singleton background manager for persistent WebSocket connection to AISStream.io."""
    _instance: Optional["AISStreamManager"] = None

    def __init__(self):
        self.ws_url = os.getenv("AISSTREAM_WS_URL", DEFAULT_WS_URL)
        self.api_key = os.getenv("AISSTREAM_API_KEY", "").strip()
        self.bbox_str = os.getenv("AIS_BBOX", "8,25,60,78")
        self.is_running = False
        self.task: Optional[asyncio.Task] = None
        self.live_vessels: Dict[str, Dict[str, Any]] = {}
        self.connection_status = "DISCONNECTED"
        self.last_sync_time: Optional[str] = None
        self.last_error: Optional[str] = None
        self.messages_received: int = 0
        self.first_message_type: Optional[str] = None
        self.last_close_code: Optional[int] = None
        self.last_close_reason: Optional[str] = None

    @classmethod
    def get_instance(cls) -> "AISStreamManager":
        if cls._instance is None:
            cls._instance = AISStreamManager()
        return cls._instance

    def get_subscription_message(self) -> str:
        load_dotenv(override=True)
        self.api_key = os.getenv("AISSTREAM_API_KEY", self.api_key).strip()
        boxes = parse_bbox_config(self.bbox_str)
        # Official AISStream.io spec: PositionReport and ShipStaticData
        sub = {
            "APIKey": self.api_key,
            "BoundingBoxes": boxes,
            "FilterMessageTypes": ["PositionReport", "ShipStaticData"]
        }
        masked = {**sub, "APIKey": "***MASKED***"}
        logger.info(f"Generated AISStream subscription payload: {json.dumps(masked)}")
        return json.dumps(sub)

    async def _run_consumer(self):
        """Persistent connection consumer loop with exponential backoff."""
        backoff = 1.0
        max_backoff = 60.0

        while self.is_running:
            # Re-read API key dynamically in case updated in environment
            load_dotenv(override=True)
            self.api_key = os.getenv("AISSTREAM_API_KEY", self.api_key).strip()
            if not self.api_key:
                self.connection_status = "DISCONNECTED"
                self.last_error = "AISSTREAM_API_KEY not configured in backend/.env"
                await asyncio.sleep(5.0)
                continue

            try:
                self.connection_status = "CONNECTING"
                logger.info(f"Connecting to AISStream WebSocket ({self.ws_url})...")

                async with websockets.connect(
                    self.ws_url,
                    ping_interval=None,
                    close_timeout=10
                ) as ws:
                    self.connection_status = "CONNECTED"
                    self.last_error = None
                    self.last_close_code = None
                    self.last_close_reason = None
                    backoff = 1.0
                    logger.info("Connected to AISStream. Sending subscription payload...")

                    sub_payload = self.get_subscription_message()
                    await ws.send(sub_payload)
                    logger.info("AISStream subscription payload sent successfully. Entering receive loop...")

                    while self.is_running:
                        msg_str = await ws.recv()
                        self.messages_received += 1
                        try:
                            if isinstance(msg_str, bytes):
                                msg_str = msg_str.decode("utf-8", errors="ignore")
                            msg_json = json.loads(msg_str)
                            msg_type = msg_json.get("MessageType")

                            if not self.first_message_type and msg_type != "SubscriptionConfirmation":
                                self.first_message_type = msg_type
                                logger.info(f"First AIS telemetry message received: Type={msg_type}")

                            if msg_type == "SubscriptionConfirmation":
                                logger.info("AISStream subscription confirmed by server.")
                                continue

                            parse_ais_message(msg_json, self.live_vessels)
                            self.last_sync_time = datetime.now(timezone.utc).isoformat()

                            if self.messages_received % 50 == 0:
                                logger.info(f"AISStream telemetry stream active: {self.messages_received} msgs received, {len(self.live_vessels)} vessels tracked.")
                        except Exception as parse_err:
                            logger.debug(f"Error parsing AISStream frame: {parse_err}")

            except asyncio.CancelledError:
                logger.info("AISStream consumer task cancelled.")
                self.connection_status = "DISCONNECTED"
                break
            except websockets.exceptions.ConnectionClosed as e:
                self.connection_status = "ERROR"
                self.last_close_code = getattr(e, "code", None)
                self.last_close_reason = getattr(e, "reason", "")
                self.last_error = f"WebSocket closed (code={self.last_close_code}, reason='{self.last_close_reason}')"
                logger.warning(f"AISStream connection closed [{type(e).__name__}]: code={self.last_close_code}, reason='{self.last_close_reason}'. Retrying in {backoff:.1f}s...")
                await asyncio.sleep(backoff)
                backoff = min(backoff * 2.0, max_backoff)
            except Exception as e:
                self.connection_status = "ERROR"
                self.last_error = f"{type(e).__name__}: {str(e)}"
                logger.warning(f"AISStream connection dropped [{type(e).__name__}]: {e}. Retrying in {backoff:.1f}s...")
                await asyncio.sleep(backoff)
                backoff = min(backoff * 2.0, max_backoff)

    def start(self):
        """Starts background task if not already running."""
        if self.task is None or self.task.done():
            self.is_running = True
            try:
                loop = asyncio.get_running_loop()
                self.task = loop.create_task(self._run_consumer())
                logger.info("AISStream background manager started.")
            except RuntimeError:
                logger.warning("No active event loop found to start AISStream manager.")

    async def stop(self):
        """Gracefully shuts down the background task."""
        self.is_running = False
        if self.task and not self.task.done():
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass
            logger.info("AISStream background manager stopped.")

    def get_vessels(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Returns normalized vessels list sorted by recency."""
        vessels = list(self.live_vessels.values())
        return vessels[:limit]

    def get_status(self) -> Dict[str, Any]:
        return {
            "provider": "AISStream.io",
            "connection_status": self.connection_status,
            "tracked_vessels": len(self.live_vessels),
            "messages_received": self.messages_received,
            "first_message_type": self.first_message_type,
            "last_close_code": self.last_close_code,
            "last_close_reason": self.last_close_reason,
            "last_sync": self.last_sync_time,
            "last_error": self.last_error,
            "is_configured": bool(self.api_key)
        }
