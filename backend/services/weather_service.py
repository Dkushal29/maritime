"""
Marine Weather Service connecting to Open-Meteo APIs (Forecast and Marine).
Provides real-time sea state, wave height, ocean currents, wind speed, temperature,
and calculates transit risk and bunker penalties.
"""
import os
import asyncio
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import httpx
from db.database import cache_get, cache_set, log_sync

logger = logging.getLogger("maritime_ai.weather")

DEFAULT_WEATHER_URL = "https://api.open-meteo.com/v1/forecast"
DEFAULT_MARINE_URL = "https://marine-api.open-meteo.com/v1/marine"


def validate_weather_coords(lat: Any, lon: Any) -> Optional[tuple[float, float]]:
    """Validates latitude (-90 to 90) and longitude (-180 to 180)."""
    try:
        if lat is None or lon is None:
            return None
        f_lat = float(lat)
        f_lon = float(lon)
        if -90.0 <= f_lat <= 90.0 and -180.0 <= f_lon <= 180.0:
            return round(f_lat, 4), round(f_lon, 4)
    except (ValueError, TypeError):
        pass
    return None


def calculate_weather_impact(wave_height: Optional[float], wind_speed: Optional[float]) -> Dict[str, Any]:
    """
    Computes deterministic weather risk, vessel speed reduction, and bunker penalty.
    Labeled explicitly as decision-support calculations.
    """
    w_height = wave_height if wave_height is not None else 1.0
    w_speed = wind_speed if wind_speed is not None else 10.0

    if w_height > 4.0 or w_speed > 35.0:
        risk = "HIGH"
        condition = "Severe Swell / Heavy Seas"
        speed_reduction = 2.4
        delay_hours = 18.0
        fuel_penalty_pct = 12.5
    elif w_height > 2.5 or w_speed > 22.0:
        risk = "MEDIUM"
        condition = "Moderate Swell / Choppy"
        speed_reduction = 1.2
        delay_hours = 8.0
        fuel_penalty_pct = 6.2
    else:
        risk = "LOW"
        condition = "Calm to Moderate Waters"
        speed_reduction = 0.2
        delay_hours = 1.5
        fuel_penalty_pct = 1.8

    return {
        "weather_risk": risk,
        "weather_condition": condition,
        "speed_reduction_knots": round(speed_reduction, 1),
        "estimated_delay_hours": round(delay_hours, 1),
        "fuel_consumption_penalty_pct": round(fuel_penalty_pct, 1)
    }


async def _fetch_marine_weather(client: httpx.AsyncClient, marine_url: str, lat: float, lon: float) -> Optional[Dict[str, Any]]:
    """Fetches marine conditions (waves, period, ocean currents) from Open-Meteo Marine API."""
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "wave_height,wave_direction,wave_period,ocean_current_velocity,ocean_current_direction",
        "timezone": "UTC"
    }
    try:
        resp = await client.get(marine_url, params=params)
        if resp.status_code == 200:
            return resp.json()
        elif resp.status_code == 429:
            logger.warning(f"Open-Meteo Marine API rate limited (HTTP 429) for ({lat}, {lon})")
        else:
            logger.warning(f"Open-Meteo Marine API returned HTTP {resp.status_code} for ({lat}, {lon})")
    except httpx.TimeoutException:
        logger.warning(f"Open-Meteo Marine API timed out for ({lat}, {lon})")
    except Exception as e:
        logger.debug(f"Open-Meteo Marine API error: {e}")
    return None


async def _fetch_surface_forecast(client: httpx.AsyncClient, forecast_url: str, lat: float, lon: float) -> Optional[Dict[str, Any]]:
    """Fetches surface atmospheric conditions (wind, temp, precipitation) from Open-Meteo Forecast API."""
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "temperature_2m,precipitation,wind_speed_10m,wind_direction_10m",
        "wind_speed_unit": "kn",
        "timezone": "UTC"
    }
    try:
        resp = await client.get(forecast_url, params=params)
        if resp.status_code == 200:
            return resp.json()
        elif resp.status_code == 429:
            logger.warning(f"Open-Meteo Forecast API rate limited (HTTP 429) for ({lat}, {lon})")
        else:
            logger.warning(f"Open-Meteo Forecast API returned HTTP {resp.status_code} for ({lat}, {lon})")
    except httpx.TimeoutException:
        logger.warning(f"Open-Meteo Forecast API timed out for ({lat}, {lon})")
    except Exception as e:
        logger.debug(f"Open-Meteo Forecast API error: {e}")
    return None


async def get_point_weather(latitude: float, longitude: float) -> Dict[str, Any]:
    """Fetches real-time marine weather for specific geographic coordinate using Open-Meteo."""
    valid_coords = validate_weather_coords(latitude, longitude)
    enable_mock_fallback = os.getenv("ENABLE_MOCK_FALLBACK", "false").lower() in ("true", "1", "yes")

    if not valid_coords:
        logger.warning(f"Invalid weather coordinates supplied: lat={latitude}, lon={longitude}")
        return {
            "latitude": latitude,
            "longitude": longitude,
            "time": datetime.now(timezone.utc).isoformat(),
            "wave_height_meters": None,
            "wave_direction_degrees": None,
            "wave_period_seconds": None,
            "wind_speed_knots": None,
            "wind_direction_degrees": None,
            "ocean_current_velocity_knots": None,
            "ocean_current_direction_degrees": None,
            "sea_surface_temp_celsius": None,
            "temperature_celsius": None,
            "precipitation_mm": None,
            "weather_condition": "Invalid Coordinates",
            "weather_risk": "LOW",
            "speed_reduction_knots": 0.0,
            "estimated_delay_hours": 0.0,
            "fuel_consumption_penalty_pct": 0.0,
            "data_source": "Open-Meteo API",
            "data_status": "UNAVAILABLE",
            "disclaimer": "Invalid geographic coordinates supplied."
        }

    lat, lon = valid_coords
    cache_key = f"weather_point_{lat}_{lon}"
    cached = cache_get(cache_key)
    if cached is not None:
        val, status, source = cached
        return val

    marine_url = os.getenv("OPEN_METEO_MARINE_API_URL", DEFAULT_MARINE_URL)
    forecast_url = os.getenv("OPEN_METEO_API_URL", DEFAULT_WEATHER_URL)

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            marine_data, forecast_data = await asyncio.gather(
                _fetch_marine_weather(client, marine_url, lat, lon),
                _fetch_surface_forecast(client, forecast_url, lat, lon),
                return_exceptions=True
            )

        marine_curr = marine_data.get("current", {}) if isinstance(marine_data, dict) else {}
        forecast_curr = forecast_data.get("current", {}) if isinstance(forecast_data, dict) else {}

        if marine_curr or forecast_curr:
            wave_h = marine_curr.get("wave_height")
            wave_dir = marine_curr.get("wave_direction")
            wave_period = marine_curr.get("wave_period")
            ocean_curr = marine_curr.get("ocean_current_velocity")
            ocean_dir = marine_curr.get("ocean_current_direction")

            wind_spd = forecast_curr.get("wind_speed_10m")
            wind_dir = forecast_curr.get("wind_direction_10m")
            temp = forecast_curr.get("temperature_2m")
            precip = forecast_curr.get("precipitation")
            time_str = marine_curr.get("time") or forecast_curr.get("time") or datetime.now(timezone.utc).isoformat()

            impact = calculate_weather_impact(wave_h, wind_spd)

            res = {
                "latitude": lat,
                "longitude": lon,
                "time": time_str,
                "wave_height_meters": round(float(wave_h), 2) if wave_h is not None else None,
                "wave_direction_degrees": round(float(wave_dir), 1) if wave_dir is not None else None,
                "wave_period_seconds": round(float(wave_period), 1) if wave_period is not None else None,
                "wind_speed_knots": round(float(wind_spd), 1) if wind_spd is not None else None,
                "wind_direction_degrees": round(float(wind_dir), 1) if wind_dir is not None else None,
                "ocean_current_velocity_knots": round(float(ocean_curr), 2) if ocean_curr is not None else None,
                "ocean_current_direction_degrees": round(float(ocean_dir), 1) if ocean_dir is not None else None,
                "sea_surface_temp_celsius": round(float(temp), 1) if temp is not None else None,
                "temperature_celsius": round(float(temp), 1) if temp is not None else None,
                "precipitation_mm": round(float(precip), 2) if precip is not None else None,
                "weather_condition": impact["weather_condition"],
                "weather_risk": impact["weather_risk"],
                "speed_reduction_knots": impact["speed_reduction_knots"],
                "estimated_delay_hours": impact["estimated_delay_hours"],
                "fuel_consumption_penalty_pct": impact["fuel_consumption_penalty_pct"],
                "data_source": "Open-Meteo Marine & Forecast API",
                "data_status": "LIVE",
                "disclaimer": "Calculated marine condition estimate for simulation only. Not for navigation safety."
            }
            cache_set(cache_key, res, ttl_seconds=1800, data_status="LIVE", data_source="Open-Meteo Marine & Forecast API")
            log_sync("Marine Weather", "Open-Meteo", "SUCCESS", records=1)
            return res

    except Exception as e:
        logger.error(f"Open-Meteo weather fetch failed: {e}")
        log_sync("Marine Weather", "Open-Meteo", "FAILURE", error=str(e))

    # If mock fallback is disabled, never fabricate fake numbers
    if not enable_mock_fallback:
        logger.warning(f"Mock fallback disabled and Open-Meteo unavailable for ({lat}, {lon}).")
        return {
            "latitude": lat,
            "longitude": lon,
            "time": datetime.now(timezone.utc).isoformat(),
            "wave_height_meters": None,
            "wave_direction_degrees": None,
            "wave_period_seconds": None,
            "wind_speed_knots": None,
            "wind_direction_degrees": None,
            "ocean_current_velocity_knots": None,
            "ocean_current_direction_degrees": None,
            "sea_surface_temp_celsius": None,
            "temperature_celsius": None,
            "precipitation_mm": None,
            "weather_condition": "Live Feed Unavailable",
            "weather_risk": "LOW",
            "speed_reduction_knots": 0.0,
            "estimated_delay_hours": 0.0,
            "fuel_consumption_penalty_pct": 0.0,
            "data_source": "Open-Meteo Marine API",
            "data_status": "UNAVAILABLE",
            "disclaimer": "Live weather telemetry temporarily unavailable."
        }

    # Calibrated baseline fallback only if ENABLE_MOCK_FALLBACK=true
    impact = calculate_weather_impact(1.8, 14.0)
    res = {
        "latitude": lat,
        "longitude": lon,
        "time": datetime.now(timezone.utc).isoformat(),
        "wave_height_meters": 1.8,
        "wave_direction_degrees": 140.0,
        "wave_period_seconds": 6.5,
        "wind_speed_knots": 14.0,
        "wind_direction_degrees": 135.0,
        "ocean_current_velocity_knots": 0.7,
        "ocean_current_direction_degrees": 90.0,
        "sea_surface_temp_celsius": 28.0,
        "temperature_celsius": 28.0,
        "precipitation_mm": 0.0,
        "weather_condition": impact["weather_condition"],
        "weather_risk": impact["weather_risk"],
        "speed_reduction_knots": impact["speed_reduction_knots"],
        "estimated_delay_hours": impact["estimated_delay_hours"],
        "fuel_consumption_penalty_pct": impact["fuel_consumption_penalty_pct"],
        "data_source": "Historical Sea-State Baseline",
        "data_status": "CACHED",
        "disclaimer": "Calculated marine condition estimate for simulation only. Not for navigation safety."
    }
    return res


CORRIDOR_WAYPOINTS = {
    "R001": [  # Australia -> Visakhapatnam
        {"name": "Port Hedland / Dampier Departure", "lat": -20.3, "lon": 118.6},
        {"name": "Timor Sea Passage", "lat": -10.5, "lon": 120.2},
        {"name": "Lombok Strait", "lat": -8.7, "lon": 115.7},
        {"name": "Sunda Strait / Java Sea", "lat": -5.9, "lon": 105.7},
        {"name": "Nicobar Islands Transit", "lat": 6.8, "lon": 93.8},
        {"name": "Bay of Bengal Deepwater", "lat": 13.5, "lon": 86.4},
        {"name": "Visakhapatnam Roads Outer Anchorage", "lat": 17.68, "lon": 83.21}
    ],
    "R002": [  # Australia -> Paradip
        {"name": "Port Hedland Departure", "lat": -20.3, "lon": 118.6},
        {"name": "Sunda Strait", "lat": -5.9, "lon": 105.7},
        {"name": "Central Bay of Bengal", "lat": 15.2, "lon": 88.0},
        {"name": "Paradip Outer Fairway", "lat": 20.31, "lon": 86.61}
    ],
    "R003": [  # Australia -> Chennai
        {"name": "Port Hedland Departure", "lat": -20.3, "lon": 118.6},
        {"name": "Malacca Strait Southern Entrance", "lat": 1.2, "lon": 103.5},
        {"name": "Sri Lanka East Coast", "lat": 7.5, "lon": 82.0},
        {"name": "Chennai Port Approach", "lat": 13.08, "lon": 80.27}
    ],
    "R004": [  # Indonesia -> Visakhapatnam
        {"name": "Taboneo Anchorage, Kalimantan", "lat": -3.6, "lon": 114.5},
        {"name": "Singapore Strait", "lat": 1.3, "lon": 103.8},
        {"name": "Strait of Malacca", "lat": 3.5, "lon": 100.2},
        {"name": "Andaman Sea Transit", "lat": 10.2, "lon": 92.5},
        {"name": "Visakhapatnam Port", "lat": 17.68, "lon": 83.21}
    ]
}


async def get_route_weather(route_id: str = "R001") -> Dict[str, Any]:
    """Samples marine weather across waypoints along designated route."""
    waypoints = CORRIDOR_WAYPOINTS.get(route_id, CORRIDOR_WAYPOINTS["R001"])
    wp_results = []

    for wp in waypoints:
        w = await get_point_weather(wp["lat"], wp["lon"])
        w["waypoint_name"] = wp["name"]
        wp_results.append(w)

    max_risk = "LOW"
    speeds = []
    delays = []
    fuel_pens = []

    for w in wp_results:
        speeds.append(w["speed_reduction_knots"])
        delays.append(w["estimated_delay_hours"])
        fuel_pens.append(w["fuel_consumption_penalty_pct"])
        if w["weather_risk"] == "HIGH":
            max_risk = "HIGH"
        elif w["weather_risk"] == "MEDIUM" and max_risk != "HIGH":
            max_risk = "MEDIUM"

    avg_speed = round(sum(speeds) / len(speeds), 1) if speeds else 0.5
    total_delay = round(sum(delays) / 2.0, 1) if delays else 6.0
    avg_fuel = round(sum(fuel_pens) / len(fuel_pens), 1) if fuel_pens else 4.0

    return {
        "route_id": route_id,
        "origin": "Australia" if route_id.startswith("R001") or route_id.startswith("R002") or route_id.startswith("R003") else "Indonesia",
        "destination": "Visakhapatnam" if route_id in ("R001", "R004") else "Paradip" if route_id == "R002" else "Chennai",
        "distance_nm": 4820 if route_id == "R001" else 5040 if route_id == "R002" else 2150,
        "waypoints_weather": wp_results,
        "overall_route_risk": max_risk,
        "avg_speed_reduction_knots": avg_speed,
        "total_estimated_delay_hours": total_delay,
        "bunker_penalty_pct": avg_fuel,
        "data_status": wp_results[0]["data_status"] if wp_results else "LIVE"
    }
