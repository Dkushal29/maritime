"""
Comprehensive unit and integration test suite for live AIS and Weather integrations:
1. AISStream message parsing (PositionReport and ShipStaticData merging)
2. Pelyr response parsing
3. AIS Friends response parsing
4. Open-Meteo response parsing
5. Missing provider fields
6. Invalid coordinates
7. Vessel deduplication
8. Timestamp normalization
9. Provider authentication failure
10. Provider timeout
11. Provider rate limiting
12. Missing API keys
13. Cache fallback
14. No mock data in live mode
15. Bounding-box handling
16. Source-status reporting

Uses mocked provider responses; makes no live external network calls during tests.
"""
import os
import json
import asyncio
import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from fastapi.testclient import TestClient
import httpx

from main import app
from services.ais.ais_service import (
    validate_coordinates,
    normalize_raw_vessel,
    deduplicate_vessels,
    get_live_vessels,
    get_configured_ais_provider
)
from services.ais.aisstream_provider import (
    parse_bbox_config,
    parse_ais_message,
    AISStreamManager
)
from services.ais.pelyr_provider import PelyrAISProvider
from services.ais.ais_friends_provider import AISFriendsProvider
from services.weather_service import (
    calculate_weather_impact,
    get_point_weather,
    get_route_weather,
    validate_weather_coords
)
from db.database import cache_set, cache_get, init_db

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_test_env():
    """Ensures test database is initialized."""
    init_db()


# 1. AISStream message parsing (PositionReport and ShipStaticData merging)
def test_aisstream_message_parsing_and_merging():
    store = {}

    # Simulate incoming PositionReport frame
    pos_frame = {
        "MessageType": "PositionReport",
        "MetaData": {
            "MMSI": 244660123,
            "ShipName": "OCEAN VOYAGER",
            "time_utc": "2026-09-11T06:30:00Z"
        },
        "Message": {
            "PositionReport": {
                "Latitude": 17.682,
                "Longitude": 83.214,
                "Sog": 12.4,
                "Cog": 95.5,
                "TrueHeading": 96,
                "NavigationalStatus": 0
            }
        }
    }
    parse_ais_message(pos_frame, store)
    assert "244660123" in store
    v = store["244660123"]
    assert v["mmsi"] == "244660123"
    assert v["vessel_name"] == "OCEAN VOYAGER"
    assert v["latitude"] == 17.682
    assert v["longitude"] == 83.214
    assert v["speed_knots"] == 12.4
    assert v["position_available"] is True

    # Simulate subsequent ShipStaticData frame for the same vessel
    static_frame = {
        "MessageType": "ShipStaticData",
        "MetaData": {
            "MMSI": 244660123,
            "time_utc": "2026-09-11T06:31:00Z"
        },
        "Message": {
            "ShipStaticData": {
                "ImoNumber": 9543756,
                "Name": "MV OCEAN VOYAGER",
                "Type": 70,
                "Destination": "VISAKHAPATNAM",
                "MaximumStaticDraught": 14.5,
                "Dimension": {"A": 180, "B": 45, "C": 16, "D": 16}
            }
        }
    }
    parse_ais_message(static_frame, store)
    # Merged data must preserve position and append static info
    merged = store["244660123"]
    assert merged["imo"] == "9543756"
    assert merged["vessel_name"] == "MV OCEAN VOYAGER"
    assert merged["destination"] == "VISAKHAPATNAM"
    assert merged["latitude"] == 17.682  # Preserved from position report
    assert merged["longitude"] == 83.214
    assert merged["draught"] == 14.5
    assert merged["length"] == 225
    assert merged["beam"] == 32


# 2. Pelyr response parsing
def test_pelyr_response_parsing():
    async def run_test():
        provider = PelyrAISProvider(api_key="test_pelyr_key")
        mock_payload = [
            {
                "mmsi": "413123456",
                "imo": "9123456",
                "name": "PELYR BULKER",
                "lat": 16.5,
                "lon": 82.8,
                "sog": 11.2,
                "cog": 140.0,
                "type": "Bulk Carrier",
                "dest": "Paradip"
            }
        ]

        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = mock_payload

        with patch("httpx.AsyncClient.get", AsyncMock(return_value=mock_resp)):
            vessels = await provider.fetch_vessels(limit=10)
            assert len(vessels) == 1
            v = vessels[0]
            assert v["mmsi"] == "413123456"
            assert v["imo"] == "9123456"
            assert v["name"] == "PELYR BULKER"
            assert v["latitude"] == 16.5
            assert v["longitude"] == 82.8
            assert v["speed"] == 11.2
            assert v["position_available"] is True

    asyncio.run(run_test())


# 3. AIS Friends response parsing
def test_ais_friends_response_parsing():
    async def run_test():
        provider = AISFriendsProvider(api_key="test_friends_token")
        mock_payload = {
            "data": [
                {
                    "mmsi": 538007890,
                    "imo": 9876543,
                    "vessel_name": "FRIENDS CARRIER",
                    "latitude": 18.2,
                    "longitude": 84.1,
                    "speed": 13.5,
                    "heading": 210,
                    "destination": "Visakhapatnam"
                }
            ]
        }

        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = mock_payload

        with patch("httpx.AsyncClient.get", AsyncMock(return_value=mock_resp)):
            vessels = await provider.fetch_vessels(limit=5)
            assert len(vessels) == 1
            v = vessels[0]
            assert v["mmsi"] == "538007890"
            assert v["imo"] == "9876543"
            assert v["name"] == "FRIENDS CARRIER"
            assert v["latitude"] == 18.2
            assert v["longitude"] == 84.1
            assert v["speed"] == 13.5

    asyncio.run(run_test())


# 4. Open-Meteo response parsing (Marine + Weather)
def test_open_meteo_response_parsing():
    async def run_test():
        mock_marine_resp = MagicMock()
        mock_marine_resp.status_code = 200
        mock_marine_resp.json.return_value = {
            "current": {
                "time": "2026-09-11T07:00",
                "wave_height": 2.1,
                "wave_direction": 145,
                "wave_period": 7.2,
                "ocean_current_velocity": 0.65,
                "ocean_current_direction": 88
            }
        }

        mock_forecast_resp = MagicMock()
        mock_forecast_resp.status_code = 200
        mock_forecast_resp.json.return_value = {
            "current": {
                "time": "2026-09-11T07:00",
                "temperature_2m": 29.5,
                "precipitation": 0.0,
                "wind_speed_10m": 15.2,
                "wind_direction_10m": 130
            }
        }

        async def mocked_get(url, *args, **kwargs):
            if "marine" in str(url):
                return mock_marine_resp
            return mock_forecast_resp

        with patch("httpx.AsyncClient.get", side_effect=mocked_get):
            res = await get_point_weather(17.68, 83.21)
            assert res["wave_height_meters"] == 2.1
            assert res["wave_direction_degrees"] == 145.0
            assert res["wave_period_seconds"] == 7.2
            assert res["wind_speed_knots"] == 15.2
            assert res["wind_direction_degrees"] == 130.0
            assert res["ocean_current_velocity_knots"] == 0.65
            assert res["data_status"] == "LIVE"
            assert res["weather_risk"] in ("LOW", "MEDIUM", "HIGH")

    asyncio.run(run_test())


# 5. Missing provider fields
def test_missing_provider_fields_normalization():
    raw = {
        "mmsi": 211000111,
    }
    norm = normalize_raw_vessel(raw, "AISStream", 0)
    assert norm["mmsi"] == "211000111"
    assert norm["imo"] is None
    assert norm["latitude"] is None
    assert norm["longitude"] is None
    assert norm["position_available"] is False
    assert norm["speed_knots"] is None
    assert norm["heading_degrees"] is None
    assert norm["destination"] is None


# 6. Invalid coordinates
def test_invalid_coordinates_rejection():
    assert validate_coordinates(17.68, 83.21) == (17.68, 83.21)
    assert validate_coordinates(-20.3, 118.6) == (-20.3, 118.6)
    assert validate_coordinates(95.0, 83.21) is None
    assert validate_coordinates(-90.1, 83.21) is None
    assert validate_coordinates(17.68, 185.0) is None
    assert validate_coordinates(17.68, -181.0) is None
    assert validate_coordinates(None, 83.21) is None
    assert validate_coordinates("invalid", "coords") is None
    assert validate_coordinates(0.0, 0.0) is None


# 7. Vessel deduplication
def test_vessel_deduplication():
    vessels = [
        {"mmsi": "244660123", "imo": "9543756", "vessel_id": "V1", "name": "Vessel A"},
        {"mmsi": "244660123", "imo": "9543756", "vessel_id": "V1_dup", "name": "Vessel A Duplicate"},
        {"mmsi": "999888777", "imo": "9543756", "vessel_id": "V2", "name": "Vessel B same IMO"},
        {"mmsi": "111222333", "imo": "8888888", "vessel_id": "V3", "name": "Vessel C Unique"},
    ]
    deduped = deduplicate_vessels(vessels)
    assert len(deduped) == 2
    assert deduped[0]["mmsi"] == "244660123"
    assert deduped[1]["mmsi"] == "111222333"


# 8. Timestamp normalization
def test_timestamp_normalization():
    raw = {
        "mmsi": "123456789",
        "timestamp": "2026-09-11T12:00:00Z"
    }
    norm = normalize_raw_vessel(raw, "TestProvider", 0)
    assert "2026-09-11" in norm["timestamp"]
    assert "2026-09-11" in norm["last_updated"]


# 9. Provider authentication failure (HTTP 401/403)
def test_provider_auth_failure_handling():
    async def run_test():
        provider = PelyrAISProvider(api_key="invalid_pelyr_key")
        mock_resp = MagicMock()
        mock_resp.status_code = 401

        with patch("httpx.AsyncClient.get", AsyncMock(return_value=mock_resp)):
            vessels = await provider.fetch_vessels()
            assert vessels == []

    asyncio.run(run_test())


# 10. Provider timeout
def test_provider_timeout_handling():
    async def run_test():
        provider = AISFriendsProvider(api_key="token_timeout")
        with patch("httpx.AsyncClient.get", AsyncMock(side_effect=httpx.TimeoutException("Timeout"))):
            vessels = await provider.fetch_vessels()
            assert vessels == []

    asyncio.run(run_test())


# 11. Provider rate limiting (HTTP 429)
def test_provider_rate_limit_handling():
    async def run_test():
        provider = PelyrAISProvider(api_key="rate_limited_key")
        mock_resp = MagicMock()
        mock_resp.status_code = 429

        with patch("httpx.AsyncClient.get", AsyncMock(return_value=mock_resp)):
            vessels = await provider.fetch_vessels()
            assert vessels == []

    asyncio.run(run_test())


# 12. Missing API keys
def test_missing_api_keys_safe_behavior():
    async def run_test():
        pelyr_no_key = PelyrAISProvider(api_key=None)
        assert await pelyr_no_key.fetch_vessels() == []

        friends_no_key = AISFriendsProvider(api_key="")
        assert await friends_no_key.fetch_vessels() == []

    asyncio.run(run_test())


# 13. Cache fallback
def test_cache_fallback():
    key = "test_ais_cache_key"
    cached_data = [{"mmsi": "123456789", "name": "Cached Vessel"}]
    cache_set(key, cached_data, ttl_seconds=60, data_status="CACHED", data_source="Unit Test")

    res = cache_get(key)
    assert res is not None
    val, status, source = res
    assert val[0]["mmsi"] == "123456789"
    assert status == "CACHED"


# 14. No mock data in live mode when ENABLE_MOCK_FALLBACK=false
def test_no_mock_data_when_fallback_disabled(monkeypatch):
    async def run_test():
        monkeypatch.setenv("DATA_MODE", "LIVE")
        monkeypatch.setenv("ENABLE_MOCK_FALLBACK", "false")
        monkeypatch.setenv("AIS_PROVIDER", "pelyr")
        monkeypatch.setenv("PELYR_API_KEY", "")

        # In live mode with unconfigured key and mock fallback disabled, get_live_vessels must return empty
        vessels = await get_live_vessels(limit=10)
        assert vessels == []

    asyncio.run(run_test())


# 15. Bounding-box handling
def test_bounding_box_parsing():
    boxes = parse_bbox_config("8,25,60,78")
    assert len(boxes) == 1
    assert boxes[0] == [[8.0, 60.0], [25.0, 78.0]]

    boxes_rev = parse_bbox_config("25,8,78,60")
    assert boxes_rev[0] == [[8.0, 60.0], [25.0, 78.0]]

    boxes_default = parse_bbox_config("")
    assert len(boxes_default) == 1
    assert boxes_default[0] == [[8.0, 60.0], [25.0, 78.0]]


# 16. Source-status reporting
def test_source_status_endpoint():
    res = client.get("/api/v1/sources/status")
    assert res.status_code == 200
    data = res.json()
    assert "sources" in data
    assert len(data["sources"]) >= 4

    raw_text = res.text
    assert "aisstream_key" not in raw_text.lower()
    assert "Bearer" not in raw_text

    names = [s["name"] for s in data["sources"]]
    assert any("Weather" in n for n in names)
    assert any("AIS" in n for n in names)
