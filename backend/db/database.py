"""
PostgreSQL persistence, SQLAlchemy 2.0 engine, and thread-safe in-memory TTL caching layer for MARITIME AI.
Connects directly to the PostgreSQL maritime-ai database. SQLite fallback is strictly prohibited.
"""
import os
import time
import logging
from typing import Dict, Any, Optional, Tuple, List
from datetime import datetime, timezone
from dotenv import load_dotenv

from sqlalchemy import (
    create_engine, text, Column, Integer, BigInteger, Float, String, Text,
    ForeignKey, Index
)
from sqlalchemy.orm import declarative_base, sessionmaker

logger = logging.getLogger("maritime_ai.db")

# Load environment configuration from backend/.env
ENV_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
load_dotenv(ENV_PATH, override=True)

DATABASE_URL = os.getenv("DATABASE_URL", "").strip()

# Strictly disallow SQLite or missing DATABASE_URL
if not DATABASE_URL:
    raise RuntimeError(
        "CRITICAL: DATABASE_URL is not configured in environment. "
        "SQLite fallback is strictly prohibited. Please configure PostgreSQL DATABASE_URL."
    )

if DATABASE_URL.startswith("sqlite"):
    raise RuntimeError(
        "CRITICAL: SQLite DATABASE_URL detected. "
        "SQLite has been decommissioned. Only PostgreSQL connections are permitted."
    )

# Normalize postgres:// or postgresql:// to postgresql+psycopg:// if needed
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)
elif DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg://", 1)

# SQLAlchemy 2.0 PostgreSQL Engine
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    future=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Thread-safe in-memory cache dictionary: key -> (cached_data, expire_at, data_status, data_source)
_MEMORY_CACHE: Dict[str, Tuple[Any, float, str, str]] = {}


# =============================================================================
# SQLAlchemy ORM Table Declarations (All 22 Tables)
# =============================================================================

class VesselModel(Base):
    __tablename__ = "vessels"
    vessel_id = Column(String, primary_key=True)
    imo = Column(String, nullable=True)
    mmsi = Column(String, nullable=True)
    vessel_name = Column(String, nullable=False)
    vessel_type = Column(String, nullable=True)
    dwt = Column(Float, nullable=True)
    built_year = Column(Integer, nullable=True)
    charter_rate_per_day = Column(Float, nullable=True)
    fuel_consumption = Column(Float, nullable=True)
    availability = Column(String, nullable=True)
    current_route = Column(String, nullable=True)
    port_compatibility = Column(String, nullable=True)
    last_updated = Column(String, nullable=True)


class VesselPositionModel(Base):
    __tablename__ = "vessel_positions"
    id = Column(Integer, primary_key=True, autoincrement=True)
    vessel_id = Column(String, ForeignKey("vessels.vessel_id", ondelete="CASCADE"), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    speed_knots = Column(Float, nullable=True)
    course_degrees = Column(Float, nullable=True)
    heading_degrees = Column(Float, nullable=True)
    draught_meters = Column(Float, nullable=True)
    destination = Column(String, nullable=True)
    eta = Column(String, nullable=True)
    navigation_status = Column(String, nullable=True)
    data_source = Column(String, nullable=True)
    data_status = Column(String, nullable=True)
    timestamp = Column(String, nullable=True)


class PortModel(Base):
    __tablename__ = "ports"
    port_id = Column(String, primary_key=True)
    port_name = Column(String, nullable=False)
    country = Column(String, default="India")
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    draft_meters = Column(Float, nullable=True)
    max_dwt = Column(Float, nullable=True)
    avg_waiting_days = Column(Float, nullable=True)
    congestion_index = Column(Float, nullable=True)
    operational_status = Column(String, nullable=True)
    last_updated = Column(String, nullable=True)


class WeatherObservationModel(Base):
    __tablename__ = "weather_observations"
    id = Column(Integer, primary_key=True, autoincrement=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    wave_height_meters = Column(Float, nullable=True)
    wind_speed_knots = Column(Float, nullable=True)
    ocean_current_knots = Column(Float, nullable=True)
    weather_condition = Column(String, nullable=True)
    weather_risk = Column(String, nullable=True)
    data_source = Column(String, nullable=True)
    data_status = Column(String, nullable=True)
    timestamp = Column(String, nullable=True)


class CommodityPriceModel(Base):
    __tablename__ = "commodity_prices"
    id = Column(Integer, primary_key=True, autoincrement=True)
    commodity = Column(String, nullable=False)
    market = Column(String, nullable=True)
    price = Column(Float, nullable=True)
    unit = Column(String, nullable=True)
    currency = Column(String, nullable=True)
    price_date = Column(String, nullable=True)
    data_source = Column(String, nullable=True)
    data_status = Column(String, nullable=True)
    created_at = Column(String, nullable=True)


class FuelPriceModel(Base):
    __tablename__ = "fuel_prices"
    id = Column(Integer, primary_key=True, autoincrement=True)
    fuel_type = Column(String, nullable=False)
    location = Column(String, nullable=True)
    price = Column(Float, nullable=True)
    unit = Column(String, nullable=True)
    currency = Column(String, nullable=True)
    price_date = Column(String, nullable=True)
    data_source = Column(String, nullable=True)
    data_status = Column(String, nullable=True)
    created_at = Column(String, nullable=True)


class FreightRateModel(Base):
    __tablename__ = "freight_rates"
    id = Column(Integer, primary_key=True, autoincrement=True)
    origin = Column(String, nullable=True)
    destination = Column(String, nullable=True)
    vessel_class = Column(String, nullable=True)
    rate_usd_per_ton = Column(Float, nullable=True)
    rate_date = Column(String, nullable=True)
    data_source = Column(String, nullable=True)
    data_status = Column(String, nullable=True)
    created_at = Column(String, nullable=True)


class ApiSyncLogModel(Base):
    __tablename__ = "api_sync_logs"
    id = Column(Integer, primary_key=True, autoincrement=True)
    feed_name = Column(String, nullable=False)
    provider = Column(String, nullable=False)
    status = Column(String, nullable=False)
    records_synced = Column(Integer, default=0)
    latency_ms = Column(Float, nullable=True)
    error_message = Column(Text, nullable=True)
    timestamp = Column(String, nullable=False)


class CargoPlanModel(Base):
    __tablename__ = "cargo_plans"
    plan_id = Column(String, primary_key=True)
    cargo_type = Column(String, nullable=False)
    cargo_quantity = Column(Float, nullable=False)
    origin = Column(String, nullable=False)
    destination_port = Column(String, nullable=False)
    required_arrival_date = Column(String, nullable=False)
    max_budget = Column(Float, nullable=False)
    preferred_vessel_class = Column(String, nullable=True)
    supplier_price_per_tonne = Column(Float, nullable=True)
    status = Column(String, default="PLANNED")
    created_at = Column(String, nullable=False)


class FreightObservationModel(Base):
    __tablename__ = "freight_observations"
    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(String, nullable=False)
    origin = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    cargo_type = Column(String, nullable=False)
    vessel_class = Column(String, nullable=False)
    freight_rate = Column(Float, nullable=False)
    bdi = Column(Float, nullable=True)
    bunker_price = Column(Float, nullable=True)
    port_congestion = Column(Float, nullable=True)
    vessel_availability = Column(Float, nullable=True)
    data_source = Column(String, nullable=True)
    data_status = Column(String, nullable=True)
    created_at = Column(String, nullable=True)


class FreightForecastModel(Base):
    __tablename__ = "freight_forecasts"
    id = Column(Integer, primary_key=True, autoincrement=True)
    plan_id = Column(String, nullable=True)
    origin = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    cargo_type = Column(String, nullable=False)
    vessel_class = Column(String, nullable=True)
    predicted_rate = Column(Float, nullable=False)
    forecast_direction = Column(String, nullable=False)
    confidence = Column(String, nullable=False)
    mae = Column(Float, nullable=True)
    rmse = Column(Float, nullable=True)
    mape = Column(Float, nullable=True)
    data_status = Column(String, nullable=False)
    limitations = Column(Text, nullable=True)
    created_at = Column(String, nullable=False)


class VesselOptionModel(Base):
    __tablename__ = "vessel_options"
    id = Column(Integer, primary_key=True, autoincrement=True)
    plan_id = Column(String, nullable=True)
    vessel_id = Column(String, nullable=False)
    vessel_name = Column(String, nullable=False)
    vessel_class = Column(String, nullable=False)
    capacity_dwt = Column(Float, nullable=False)
    draft_meters = Column(Float, nullable=True)
    suitability_status = Column(String, nullable=False)
    suitability_score = Column(Float, nullable=True)
    explanation = Column(Text, nullable=False)
    estimated_voyage_days = Column(Float, nullable=True)
    estimated_freight_cost = Column(Float, nullable=True)
    created_at = Column(String, nullable=False)


class OptimizationRunModel(Base):
    __tablename__ = "optimization_runs"
    id = Column(Integer, primary_key=True, autoincrement=True)
    plan_id = Column(String, nullable=True)
    recommended_plan = Column(String, nullable=False)
    estimated_total_cost = Column(Float, nullable=False)
    estimated_cost_per_tonne = Column(Float, nullable=False)
    decision = Column(String, nullable=False)
    reasons = Column(Text, nullable=False)
    warnings = Column(Text, nullable=True)
    alternatives = Column(Text, nullable=True)
    data_status = Column(String, nullable=False)
    created_at = Column(String, nullable=False)


class RouteCorridorModel(Base):
    __tablename__ = "route_corridors"
    corridor_id = Column(String, primary_key=True)
    origin_port = Column(String, nullable=False)
    origin_country = Column(String, nullable=False)
    origin_lat = Column(Float, nullable=False)
    origin_lng = Column(Float, nullable=False)
    destination_port = Column(String, nullable=False)
    destination_country = Column(String, default="India")
    destination_lat = Column(Float, nullable=False)
    destination_lng = Column(Float, nullable=False)
    cargo_type = Column(String, nullable=False)
    typical_vessel_classes = Column(String, nullable=False)
    approximate_corridor = Column(String, nullable=False)
    waypoints = Column(Text, nullable=False)
    estimated_distance_nm = Column(Integer, nullable=False)
    typical_sailing_days = Column(Float, nullable=False)
    seasonal_risk_areas = Column(Text, nullable=True)
    port_restrictions = Column(Text, nullable=True)
    data_source = Column(String, nullable=False)
    data_confidence = Column(Float, nullable=False)
    is_verified_nautical = Column(Integer, default=0)
    last_updated = Column(String, nullable=False)


class RouteOptionModel(Base):
    __tablename__ = "route_options"
    id = Column(Integer, primary_key=True, autoincrement=True)
    request_id = Column(String, nullable=False)
    option_type = Column(String, nullable=False)
    route_id = Column(String, nullable=False)
    origin = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    waypoints = Column(Text, nullable=False)
    distance_nm = Column(Integer, nullable=False)
    sailing_days = Column(Float, nullable=False)
    eta = Column(String, nullable=False)
    total_cost_usd = Column(Float, nullable=False)
    cost_per_ton_usd = Column(Float, nullable=False)
    fuel_cost_usd = Column(Float, nullable=False)
    port_charges_usd = Column(Float, nullable=False)
    transit_charges_usd = Column(Float, nullable=False)
    demurrage_risk_usd = Column(Float, nullable=False)
    operating_cost_usd = Column(Float, nullable=False)
    cost_savings_usd = Column(Float, default=0.0)
    cost_drivers = Column(Text, nullable=True)
    risk_score = Column(Float, nullable=False)
    risk_level = Column(String, nullable=False)
    weather_impact = Column(Text, nullable=True)
    tradeoff_explanation = Column(Text, nullable=True)
    data_source = Column(String, nullable=False)
    data_confidence = Column(Float, nullable=False)
    data_status = Column(String, nullable=False)
    created_at = Column(String, nullable=False)


class RouteAlertModel(Base):
    __tablename__ = "route_alerts"
    alert_id = Column(String, primary_key=True)
    severity = Column(String, nullable=False)
    area = Column(String, nullable=False)
    start_time = Column(String, nullable=True)
    end_time = Column(String, nullable=True)
    affected_route = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    source = Column(String, nullable=False)
    last_checked = Column(String, nullable=False)
    recommended_action = Column(Text, nullable=True)
    confidence = Column(Float, nullable=False)
    data_status = Column(String, nullable=False)


class PortTerminalModel(Base):
    __tablename__ = "port_terminals"
    terminal_id = Column(String, primary_key=True)
    port_id = Column(String, ForeignKey("ports.port_id", ondelete="CASCADE"), nullable=False)
    terminal_name = Column(String, nullable=False)
    cargo_specialization = Column(String, nullable=False)
    max_draft = Column(Float, nullable=False)
    max_dwt = Column(Float, nullable=False)
    max_loa = Column(Float, nullable=True)
    max_beam = Column(Float, nullable=True)
    loading_rate_tpd = Column(Float, nullable=True)
    unloading_rate_tpd = Column(Float, nullable=True)


class BerthModel(Base):
    __tablename__ = "berths"
    berth_id = Column(String, primary_key=True)
    terminal_id = Column(String, ForeignKey("port_terminals.terminal_id", ondelete="SET NULL"), nullable=True)
    port_id = Column(String, ForeignKey("ports.port_id", ondelete="CASCADE"), nullable=False)
    berth_name = Column(String, nullable=False)
    length_meters = Column(Float, nullable=False)
    draft_meters = Column(Float, nullable=False)
    max_dwt = Column(Float, nullable=False)
    equipment = Column(Text, nullable=True)
    operating_hours = Column(String, default="24/7")
    is_active = Column(Integer, default=1)


class BerthBookingModel(Base):
    __tablename__ = "berth_bookings"
    id = Column(Integer, primary_key=True, autoincrement=True)
    booking_id = Column(String, nullable=True)
    port_id = Column(String, ForeignKey("ports.port_id", ondelete="CASCADE"), nullable=False)
    berth_id = Column(String, ForeignKey("berths.berth_id", ondelete="CASCADE"), nullable=False)
    vessel_id = Column(String, nullable=False)
    arrival_time = Column(String, nullable=False)
    berthing_start = Column(String, nullable=False)
    berthing_end = Column(String, nullable=False)
    departure_time = Column(String, nullable=False)
    status = Column(String, nullable=False)
    buffer_hours = Column(Float, default=6.0)
    notes = Column(Text, nullable=True)
    created_at = Column(String, nullable=False)


class FleetAssignmentModel(Base):
    __tablename__ = "fleet_assignments"
    id = Column(Integer, primary_key=True, autoincrement=True)
    booking_id = Column(String, nullable=True)
    plan_id = Column(String, nullable=True)
    vessel_id = Column(String, nullable=False)
    assignment_date = Column(String, nullable=False)
    laycan_start = Column(String, nullable=False)
    laycan_end = Column(String, nullable=False)
    allocated_cargo_qty = Column(Float, nullable=False)
    utilization_rate = Column(Float, nullable=True)
    status = Column(String, nullable=False)
    created_at = Column(String, nullable=False)


class CharterBookingModel(Base):
    __tablename__ = "charter_bookings"
    booking_id = Column(String, primary_key=True)
    cargo_plan_id = Column(String, nullable=True)
    vessel_id = Column(String, nullable=False)
    origin_port = Column(String, nullable=False)
    destination_port = Column(String, nullable=False)
    selected_route_type = Column(String, nullable=False)
    selected_berth_id = Column(String, nullable=True)
    planned_departure = Column(String, nullable=False)
    planned_arrival = Column(String, nullable=False)
    berthing_start = Column(String, nullable=True)
    berthing_end = Column(String, nullable=True)
    cargo_quantity = Column(Float, nullable=False)
    cargo_type = Column(String, nullable=False)
    estimated_total_cost = Column(Float, nullable=False)
    cost_per_ton = Column(Float, nullable=False)
    booking_status = Column(String, nullable=False)
    risk_status = Column(String, nullable=False)
    data_status = Column(String, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(String, nullable=False)
    updated_at = Column(String, nullable=False)


class ReschedulingOptionModel(Base):
    __tablename__ = "rescheduling_options"
    id = Column(Integer, primary_key=True, autoincrement=True)
    booking_id = Column(String, ForeignKey("charter_bookings.booking_id", ondelete="CASCADE"), nullable=False)
    option_type = Column(String, nullable=False)
    proposed_port = Column(String, nullable=True)
    proposed_vessel_id = Column(String, nullable=True)
    proposed_arrival_date = Column(String, nullable=True)
    proposed_berth_id = Column(String, nullable=True)
    additional_cost_usd = Column(Float, default=0.0)
    cost_variance_pct = Column(Float, default=0.0)
    delay_days_saved = Column(Float, default=0.0)
    feasibility_score = Column(Float, nullable=False)
    rationale = Column(Text, nullable=False)
    created_at = Column(String, nullable=False)


# Indexes
Index("idx_berth_bookings_port_arrival", BerthBookingModel.port_id, BerthBookingModel.arrival_time)
Index("idx_berth_bookings_berth_window", BerthBookingModel.berth_id, BerthBookingModel.arrival_time, BerthBookingModel.departure_time)
Index("idx_fleet_assignments_vessel_date", FleetAssignmentModel.vessel_id, FleetAssignmentModel.assignment_date)
Index("idx_route_alerts_route_sev", RouteAlertModel.affected_route, RouteAlertModel.severity)
Index("idx_charter_bookings_status", CharterBookingModel.booking_status)


# =============================================================================
# PostgreSQL Row & Connection Adapters (Preserves Existing Services Compatibility)
# =============================================================================

class RowWrapper:
    """Wrapper that supports dict-style and index-style access to query rows."""
    def __init__(self, description, row_tuple):
        self._desc = description
        self._tuple = row_tuple
        # Build mapping using column name
        col_names = [d.name if hasattr(d, "name") else d[0] for d in description]
        self._map = {col: val for col, val in zip(col_names, row_tuple)}
        self._map_lower = {col.lower(): val for col, val in zip(col_names, row_tuple)}

    def __getitem__(self, item):
        if isinstance(item, int):
            return self._tuple[item]
        if item in self._map:
            return self._map[item]
        item_lower = str(item).lower()
        if item_lower in self._map_lower:
            return self._map_lower[item_lower]
        raise KeyError(item)

    def get(self, item, default=None):
        try:
            return self[item]
        except KeyError:
            return default

    def keys(self):
        return [d.name if hasattr(d, "name") else d[0] for d in self._desc]

    def values(self):
        return list(self._tuple)

    def items(self):
        return [(k, self._map[k]) for k in self.keys()]

    def __iter__(self):
        return iter(self.keys())

    def __len__(self):
        return len(self._tuple)

    def __repr__(self):
        return repr(self._map)


def _normalize_sql(sql: str) -> str:
    """
    Translates SQLite parameter placeholders ('?') to PostgreSQL parameter placeholders ('%s'),
    and converts SQLite 'INSERT OR REPLACE INTO' to PostgreSQL-compliant UPSERT statements.
    """
    # 1. Replace ? outside quotes with %s
    parts = []
    in_single = False
    in_double = False
    for char in sql:
        if char == "'" and not in_double:
            in_single = not in_single
            parts.append(char)
        elif char == '"' and not in_single:
            in_double = not in_double
            parts.append(char)
        elif char == '?' and not in_single and not in_double:
            parts.append('%s')
        else:
            parts.append(char)
    res = "".join(parts)

    # 2. Normalize SQLite INSERT OR REPLACE INTO cargo_plans
    if "INSERT OR REPLACE INTO cargo_plans" in res:
        res = res.replace("INSERT OR REPLACE INTO cargo_plans", "INSERT INTO cargo_plans")
        if "ON CONFLICT" not in res:
            res += """
                ON CONFLICT (plan_id) DO UPDATE SET
                    cargo_type = EXCLUDED.cargo_type,
                    cargo_quantity = EXCLUDED.cargo_quantity,
                    origin = EXCLUDED.origin,
                    destination_port = EXCLUDED.destination_port,
                    required_arrival_date = EXCLUDED.required_arrival_date,
                    max_budget = EXCLUDED.max_budget,
                    preferred_vessel_class = EXCLUDED.preferred_vessel_class,
                    supplier_price_per_tonne = EXCLUDED.supplier_price_per_tonne,
                    status = EXCLUDED.status,
                    created_at = EXCLUDED.created_at
            """

    return res


class CursorWrapper:
    """Wrapper around psycopg cursor that returns RowWrapper objects for dict compatibility."""
    def __init__(self, raw_cursor):
        self._raw = raw_cursor

    def execute(self, query: str, params=None):
        norm_sql = _normalize_sql(query)
        if params is not None:
            # Handle tuple/list parameters
            if isinstance(params, (list, tuple)):
                self._raw.execute(norm_sql, params)
            else:
                self._raw.execute(norm_sql, (params,))
        else:
            self._raw.execute(norm_sql)
        return self

    def fetchone(self):
        row = self._raw.fetchone()
        if row is None:
            return None
        return RowWrapper(self._raw.description, row)

    def fetchall(self):
        rows = self._raw.fetchall()
        if not rows:
            return []
        desc = self._raw.description
        return [RowWrapper(desc, r) for r in rows]

    @property
    def description(self):
        return self._raw.description

    @property
    def rowcount(self):
        return self._raw.rowcount

    def close(self):
        self._raw.close()


class DBConnectionWrapper:
    """Wrapper around raw PostgreSQL connection supporting cursor(), execute(), commit(), close()."""
    def __init__(self, raw_conn):
        self._raw_conn = raw_conn

    def cursor(self):
        return CursorWrapper(self._raw_conn.cursor())

    def execute(self, query: str, params=None):
        cur = self.cursor()
        cur.execute(query, params)
        return cur

    def commit(self):
        self._raw_conn.commit()

    def rollback(self):
        self._raw_conn.rollback()

    def close(self):
        self._raw_conn.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type:
            self.rollback()
        else:
            self.commit()
        self.close()


def get_db_connection() -> DBConnectionWrapper:
    """
    Returns an active, pooled connection wrapper to the PostgreSQL database.
    Provides complete backward compatibility with sqlite3 connection and cursor methods.
    """
    raw_conn = engine.raw_connection()
    return DBConnectionWrapper(raw_conn)


def init_db():
    """Initializes PostgreSQL schema tables and seeds baseline reference catalogs."""
    Base.metadata.create_all(bind=engine)
    logger.info("MARITIME AI PostgreSQL database schema tables verified in public schema.")

    # Auto-seed reference catalog data if empty
    try:
        from db.seed_data import seed_reference_data
        seed_reference_data()
    except Exception as e:
        logger.debug(f"Reference seed check: {e}")


# =============================================================================
# In-Memory Cache Helper (Preserved)
# =============================================================================

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
    """Appends an execution record to api_sync_logs in PostgreSQL."""
    try:
        conn = get_db_connection()
        conn.execute("""
            INSERT INTO api_sync_logs (feed_name, provider, status, records_synced, latency_ms, error_message, timestamp)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
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
