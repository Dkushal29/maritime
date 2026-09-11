"""
SQLite persistence and thread-safe in-memory TTL caching layer for MARITIME AI.
Supports storing vessels, positions, ports, weather observations, market benchmarks, and sync logs.
"""
import os
import time
import sqlite3
import logging
from typing import Dict, Any, Optional, Tuple
from datetime import datetime, timezone

logger = logging.getLogger("maritime_ai.db")

DB_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(DB_DIR, "maritime_live.db")

# Thread-safe in-memory cache dictionary: key -> (cached_data, expire_at, data_status, data_source)
_MEMORY_CACHE: Dict[str, Tuple[Any, float, str, str]] = {}


def get_db_connection() -> sqlite3.Connection:
    """Creates a connection to the SQLite database with WAL journal mode for concurrent reads."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    return conn


def init_db():
    """Initializes schema tables if not already existing."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.executescript("""
    CREATE TABLE IF NOT EXISTS vessels (
        vessel_id TEXT PRIMARY KEY,
        imo TEXT,
        mmsi TEXT,
        vessel_name TEXT NOT NULL,
        vessel_type TEXT,
        dwt REAL,
        built_year INTEGER,
        charter_rate_per_day REAL,
        fuel_consumption REAL,
        availability TEXT,
        current_route TEXT,
        port_compatibility TEXT,
        last_updated TEXT
    );

    CREATE TABLE IF NOT EXISTS vessel_positions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vessel_id TEXT NOT NULL,
        latitude REAL,
        longitude REAL,
        speed_knots REAL,
        course_degrees REAL,
        heading_degrees REAL,
        draught_meters REAL,
        destination TEXT,
        eta TEXT,
        navigation_status TEXT,
        data_source TEXT,
        data_status TEXT,
        timestamp TEXT,
        FOREIGN KEY (vessel_id) REFERENCES vessels (vessel_id)
    );

    CREATE TABLE IF NOT EXISTS ports (
        port_id TEXT PRIMARY KEY,
        port_name TEXT NOT NULL,
        country TEXT DEFAULT 'India',
        latitude REAL,
        longitude REAL,
        draft_meters REAL,
        max_dwt REAL,
        avg_waiting_days REAL,
        congestion_index REAL,
        operational_status TEXT,
        last_updated TEXT
    );

    CREATE TABLE IF NOT EXISTS weather_observations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        latitude REAL,
        longitude REAL,
        wave_height_meters REAL,
        wind_speed_knots REAL,
        ocean_current_knots REAL,
        weather_condition TEXT,
        weather_risk TEXT,
        data_source TEXT,
        data_status TEXT,
        timestamp TEXT
    );

    CREATE TABLE IF NOT EXISTS commodity_prices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        commodity TEXT NOT NULL,
        market TEXT,
        price REAL,
        unit TEXT,
        currency TEXT,
        price_date TEXT,
        data_source TEXT,
        data_status TEXT,
        created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS fuel_prices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fuel_type TEXT NOT NULL,
        location TEXT,
        price REAL,
        unit TEXT,
        currency TEXT,
        price_date TEXT,
        data_source TEXT,
        data_status TEXT,
        created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS freight_rates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        origin TEXT,
        destination TEXT,
        vessel_class TEXT,
        rate_usd_per_ton REAL,
        rate_date TEXT,
        data_source TEXT,
        data_status TEXT,
        created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS api_sync_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        feed_name TEXT NOT NULL,
        provider TEXT NOT NULL,
        status TEXT NOT NULL,
        records_synced INTEGER DEFAULT 0,
        latency_ms REAL,
        error_message TEXT,
        timestamp TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cargo_plans (
        plan_id TEXT PRIMARY KEY,
        cargo_type TEXT NOT NULL,
        cargo_quantity REAL NOT NULL,
        origin TEXT NOT NULL,
        destination_port TEXT NOT NULL,
        required_arrival_date TEXT NOT NULL,
        max_budget REAL NOT NULL,
        preferred_vessel_class TEXT,
        supplier_price_per_tonne REAL,
        status TEXT DEFAULT 'PLANNED',
        created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS freight_observations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        origin TEXT NOT NULL,
        destination TEXT NOT NULL,
        cargo_type TEXT NOT NULL,
        vessel_class TEXT NOT NULL,
        freight_rate REAL NOT NULL,
        bdi REAL,
        bunker_price REAL,
        port_congestion REAL,
        vessel_availability REAL,
        data_source TEXT,
        data_status TEXT,
        created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS freight_forecasts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plan_id TEXT,
        origin TEXT NOT NULL,
        destination TEXT NOT NULL,
        cargo_type TEXT NOT NULL,
        vessel_class TEXT,
        predicted_rate REAL NOT NULL,
        forecast_direction TEXT NOT NULL,
        confidence TEXT NOT NULL,
        mae REAL,
        rmse REAL,
        mape REAL,
        data_status TEXT NOT NULL,
        limitations TEXT,
        created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS vessel_options (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plan_id TEXT,
        vessel_id TEXT NOT NULL,
        vessel_name TEXT NOT NULL,
        vessel_class TEXT NOT NULL,
        capacity_dwt REAL NOT NULL,
        draft_meters REAL,
        suitability_status TEXT NOT NULL,
        suitability_score REAL,
        explanation TEXT NOT NULL,
        estimated_voyage_days REAL,
        estimated_freight_cost REAL,
        created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS optimization_runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        plan_id TEXT,
        recommended_plan TEXT NOT NULL,
        estimated_total_cost REAL NOT NULL,
        estimated_cost_per_tonne REAL NOT NULL,
        decision TEXT NOT NULL,
        reasons TEXT NOT NULL,
        warnings TEXT,
        alternatives TEXT,
        data_status TEXT NOT NULL,
        created_at TEXT NOT NULL
    );
    """)

    conn.commit()
    conn.close()
    logger.info("MARITIME AI SQLite database tables verified.")


# In-Memory Cache Helper
def cache_get(key: str) -> Optional[Tuple[Any, str, str]]:
    """Retrieves cached item if present and unexpired: returns (data, data_status, data_source)."""
    now = time.time()
    if key in _MEMORY_CACHE:
        val, expire_at, data_status, data_source = _MEMORY_CACHE[key]
        if now < expire_at:
            return val, data_status, data_source
        else:
            del _MEMORY_CACHE[key]
    return None


def cache_set(key: str, data: Any, ttl_seconds: int = 300, data_status: str = "LIVE", data_source: str = "External API"):
    """Stores item in cache with TTL."""
    expire_at = time.time() + ttl_seconds
    _MEMORY_CACHE[key] = (data, expire_at, data_status, data_source)


def log_sync(feed_name: str, provider: str, status: str, records: int = 0, latency_ms: float = 0.0, error: Optional[str] = None):
    """Appends an execution record to api_sync_logs."""
    try:
        conn = get_db_connection()
        conn.execute("""
            INSERT INTO api_sync_logs (feed_name, provider, status, records_synced, latency_ms, error_message, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            feed_name,
            provider,
            status,
            records,
            latency_ms,
            error,
            datetime.now(timezone.utc).isoformat()
        ))
        conn.commit()
        conn.close()
    except Exception as e:
        logger.error(f"Failed to log sync: {e}")
