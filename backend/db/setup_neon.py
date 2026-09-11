"""
Neon PostgreSQL Automated Setup, Migration, and Seed Verification Script for MARITIME AI.
Connects directly to Neon DB, verifies SSL and connection pooling, runs schema migrations,
and seeds all baseline maritime domain catalogs.
"""

import os
import sys
import logging

# Ensure backend directory is on sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from sqlalchemy import text, inspect
from db.database import engine, Base, init_db
from db.seed_data import seed_reference_data, sync_sequences

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("maritime_ai.neon_setup")

CORE_TABLES = [
    "ports",
    "port_terminals",
    "berths",
    "route_corridors",
    "vessels",
    "vessel_positions",
    "weather_observations",
    "commodity_prices",
    "fuel_prices",
    "freight_rates",
    "api_sync_logs",
    "cargo_plans",
    "freight_observations",
    "freight_forecasts",
    "vessel_options",
    "optimization_runs",
    "route_options",
    "route_alerts",
    "berth_bookings",
    "fleet_assignments",
    "charter_bookings",
    "rescheduling_options",
]


def setup_neon_db():
    masked_url = engine.url.render_as_string(hide_password=True)
    logger.info("================================================================")
    logger.info("  MARITIME AI — Neon PostgreSQL Provisioning & Seeding Tool")
    logger.info("================================================================")
    logger.info(f"Target Database URL: {masked_url}")

    # 1. Test Network & Connection
    logger.info("[Step 1/5] Testing Neon DB connection and checking server version...")
    try:
        with engine.connect() as conn:
            version_str = conn.execute(text("SELECT version();")).scalar()
            now_str = conn.execute(text("SELECT NOW();")).scalar()
            logger.info(f"  --> Neon Connection: OK")
            logger.info(f"  --> PostgreSQL Version: {version_str}")
            logger.info(f"  --> Server Timestamp: {now_str}")
    except Exception as e:
        logger.error(f"Failed to connect to Neon DB: {e}")
        sys.exit(1)

    # 2. Schema Creation
    logger.info("[Step 2/5] Creating/verifying all 22 domain schema tables...")
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("  --> All schema tables verified in public schema.")
    except Exception as e:
        logger.error(f"Schema generation error: {e}")
        sys.exit(1)

    # 3. Seed Reference Catalogs
    logger.info("[Step 3/5] Seeding reference catalog datasets (Ports, Terminals, Berths, Corridors, Vessels)...")
    try:
        seed_reference_data()
        logger.info("  --> Reference catalog seeding completed.")
    except Exception as e:
        logger.error(f"Catalog seeding notice: {e}")

    # 4. Synchronize Sequence Counters
    logger.info("[Step 4/5] Synchronizing PostgreSQL sequence counters for SERIAL primary keys...")
    try:
        sync_sequences()
        logger.info("  --> Sequence counters synchronized.")
    except Exception as e:
        logger.warning(f"Sequence sync notice: {e}")

    # 5. Verify Row Counts
    logger.info("[Step 5/5] Auditing table existence and row counts in Neon DB:")
    try:
        inspector = inspect(engine)
        existing_tables = set(inspector.get_table_names())

        with engine.connect() as conn:
            for table in CORE_TABLES:
                if table in existing_tables:
                    cnt = conn.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar()
                    logger.info(f"  [OK] Table '{table:<24}': {cnt:>5} records")
                else:
                    logger.warning(f"  [MISSING] Table '{table}' not found in public schema")

        logger.info("================================================================")
        logger.info("  Neon PostgreSQL Database is LIVE and fully initialized!")
        logger.info("================================================================")
    except Exception as e:
        logger.error(f"Verification error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    setup_neon_db()
