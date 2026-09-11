"""
Database seed and migration utility for MARITIME AI PostgreSQL database.
Populates reference ports, berths, terminals, route corridors, vessels,
and migrates historical records from SQLite maritime_live.db into PostgreSQL.
"""
import os
import json
import sqlite3
import logging
from datetime import datetime, timezone

from sqlalchemy import text
from db.database import engine

logger = logging.getLogger("maritime_ai.seed")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SQLITE_DB_PATH = os.path.join(BASE_DIR, "maritime_live.db")
RAW_DATA_DIR = os.path.join(BASE_DIR, "data", "raw")


PORT_NAME_TO_ID = {
    "VISAKHAPATNAM": "P001",
    "PARADIP": "P002",
    "CHENNAI": "P003",
    "KAMARAJAR": "P004",
    "HALDIA": "P005",
    "DHAMRA": "P006",
}


def seed_reference_data():
    """Seeds reference ports, terminals, berths, route corridors, and vessels."""
    with engine.connect() as conn:
        # 1. Ports (both ID and Name as primary keys/aliases to prevent FK errors)
        ports = [
            ("P001", "Visakhapatnam", "India", 17.6868, 83.2185, 18.5, 200000.0, 3.8, 0.72, "Operating"),
            ("P002", "Paradip", "India", 20.3167, 86.6167, 17.1, 125000.0, 2.1, 0.45, "Operating"),
            ("P003", "Chennai", "India", 13.0827, 80.2707, 16.5, 85000.0, 2.4, 0.48, "Operating"),
            ("P004", "Kamarajar", "India", 13.2500, 80.3333, 18.0, 150000.0, 1.9, 0.38, "Operating"),
            ("P005", "Haldia", "India", 22.0667, 88.0667, 12.5, 45000.0, 4.2, 0.85, "Congested"),
            ("P006", "Dhamra", "India", 20.8000, 86.9667, 18.0, 180000.0, 2.0, 0.40, "Operating"),
            # Port name aliases as valid IDs
            ("Visakhapatnam", "Visakhapatnam", "India", 17.6868, 83.2185, 18.5, 200000.0, 3.8, 0.72, "Operating"),
            ("Paradip", "Paradip", "India", 20.3167, 86.6167, 17.1, 125000.0, 2.1, 0.45, "Operating"),
            ("Chennai", "Chennai", "India", 13.0827, 80.2707, 16.5, 85000.0, 2.4, 0.48, "Operating"),
            ("Kamarajar", "Kamarajar", "India", 13.2500, 80.3333, 18.0, 150000.0, 1.9, 0.38, "Operating"),
            ("Haldia", "Haldia", "India", 22.0667, 88.0667, 12.5, 45000.0, 4.2, 0.85, "Congested"),
            ("Dhamra", "Dhamra", "India", 20.8000, 86.9667, 18.0, 180000.0, 2.0, 0.40, "Operating"),
        ]
        for p in ports:
            conn.execute(text("""
                INSERT INTO ports (port_id, port_name, country, latitude, longitude, draft_meters, max_dwt, avg_waiting_days, congestion_index, operational_status, last_updated)
                VALUES (:pid, :name, :country, :lat, :lng, :draft, :dwt, :wait, :cong, :status, :upd)
                ON CONFLICT (port_id) DO NOTHING
            """), {
                "pid": p[0], "name": p[1], "country": p[2], "lat": p[3], "lng": p[4],
                "draft": p[5], "dwt": p[6], "wait": p[7], "cong": p[8], "status": p[9],
                "upd": datetime.now(timezone.utc).isoformat()
            })
        conn.commit()
        logger.info("Ensured reference ports and name aliases are present in PostgreSQL.")

        # 2. Port Terminals & Berths
        berth_count = conn.execute(text("SELECT count(*) FROM berths")).scalar()
        if berth_count == 0:
            from services.berth_service import PORT_BERTH_DATA
            for pid, berths in PORT_BERTH_DATA.items():
                for b in berths:
                    tid = b.get("terminal_id", f"{pid}-TERM")
                    conn.execute(text("""
                        INSERT INTO port_terminals (terminal_id, port_id, terminal_name, cargo_specialization, max_draft, max_dwt, max_loa, max_beam, loading_rate_tpd, unloading_rate_tpd)
                        VALUES (:tid, :pid, :tname, 'Dry Bulk Coal/Ore', :draft, :dwt, 350.0, 50.0, 45000.0, 50000.0)
                        ON CONFLICT (terminal_id) DO NOTHING
                    """), {
                        "tid": tid, "pid": pid, "tname": f"{b['berth_name']} Terminal",
                        "draft": b["draft_m"], "dwt": b["max_dwt"]
                    })
                    conn.execute(text("""
                        INSERT INTO berths (berth_id, terminal_id, port_id, berth_name, length_meters, draft_meters, max_dwt, equipment, operating_hours, is_active)
                        VALUES (:bid, :tid, :pid, :name, :len, :draft, :dwt, :eq, :hrs, 1)
                        ON CONFLICT (berth_id) DO NOTHING
                    """), {
                        "bid": b["berth_id"], "tid": tid, "pid": pid, "name": b["berth_name"],
                        "len": b["length_m"], "draft": b["draft_m"], "dwt": b["max_dwt"],
                        "eq": json.dumps(b.get("equipment", [])), "hrs": b.get("operating_hours", "24/7")
                    })
            conn.commit()
            logger.info("Seeded reference port terminals and berths into PostgreSQL.")

        # 3. Route Corridors
        corridor_count = conn.execute(text("SELECT count(*) FROM route_corridors")).scalar()
        if corridor_count == 0:
            try:
                from services.route_engine import get_all_corridors
                corridors = get_all_corridors()
                for c in corridors:
                    olat = c.origin_coords[0] if hasattr(c, "origin_coords") and len(c.origin_coords) >= 2 else 0.0
                    olng = c.origin_coords[1] if hasattr(c, "origin_coords") and len(c.origin_coords) >= 2 else 0.0
                    dlat = c.dest_coords[0] if hasattr(c, "dest_coords") and len(c.dest_coords) >= 2 else 0.0
                    dlng = c.dest_coords[1] if hasattr(c, "dest_coords") and len(c.dest_coords) >= 2 else 0.0
                    conn.execute(text("""
                        INSERT INTO route_corridors (
                            corridor_id, origin_port, origin_country, origin_lat, origin_lng,
                            destination_port, destination_country, destination_lat, destination_lng,
                            cargo_type, typical_vessel_classes, approximate_corridor, waypoints,
                            estimated_distance_nm, typical_sailing_days, seasonal_risk_areas,
                            port_restrictions, data_source, data_confidence, is_verified_nautical, last_updated
                        ) VALUES (
                            :cid, :oport, :ocountry, :olat, :olng,
                            :dport, :dcountry, :dlat, :dlng,
                            :cargo, :vclasses, :approx, :wp,
                            :dist, :days, :risk,
                            :restr, :source, :conf, :is_ver, :upd
                        ) ON CONFLICT (corridor_id) DO NOTHING
                    """), {
                        "cid": c.corridor_id, "oport": c.origin_port, "ocountry": c.origin_country,
                        "olat": olat, "olng": olng, "dport": c.destination_port,
                        "dcountry": c.destination_country, "dlat": dlat, "dlng": dlng,
                        "cargo": c.cargo_type, "vclasses": json.dumps(c.typical_vessel_classes),
                        "approx": c.approximate_corridor, "wp": json.dumps(c.waypoints),
                        "dist": c.estimated_distance_nm, "days": c.typical_sailing_days,
                        "risk": json.dumps(c.seasonal_risk_areas), "restr": json.dumps(c.port_restrictions),
                        "source": c.data_source, "conf": c.data_confidence, "is_ver": 1 if c.is_verified_nautical else 0,
                        "upd": datetime.now(timezone.utc).isoformat()
                    })
                conn.commit()
                logger.info(f"Seeded {len(corridors)} route corridors into PostgreSQL.")
            except Exception as e:
                logger.warning(f"Could not seed route corridors: {e}")

        # 4. Vessels Catalog
        vessel_count = conn.execute(text("SELECT count(*) FROM vessels")).scalar()
        if vessel_count == 0:
            vessels_csv = os.path.join(RAW_DATA_DIR, "vessels.csv")
            if os.path.exists(vessels_csv):
                import pandas as pd
                df = pd.read_csv(vessels_csv)
                for _, r in df.iterrows():
                    vid = str(r.get("vessel_id", f"VSL-{_}"))
                    conn.execute(text("""
                        INSERT INTO vessels (
                            vessel_id, imo, mmsi, vessel_name, vessel_type, dwt,
                            built_year, charter_rate_per_day, fuel_consumption,
                            availability, current_route, port_compatibility, last_updated
                        ) VALUES (
                            :vid, :imo, :mmsi, :name, :vtype, :dwt,
                            :year, :rate, :fuel,
                            :avail, :route, :compat, :upd
                        ) ON CONFLICT (vessel_id) DO NOTHING
                    """), {
                        "vid": vid, "imo": str(r.get("imo", "")), "mmsi": str(r.get("mmsi", "")),
                        "name": str(r.get("name", r.get("vessel_name", vid))),
                        "vtype": str(r.get("vessel_type", r.get("type", "Capesize"))),
                        "dwt": float(r.get("dwt", 80000)),
                        "year": int(r.get("year", 2018)),
                        "rate": float(r.get("charter_rate", r.get("charter_rate_per_day", 25000.0))),
                        "fuel": float(r.get("fuel_consumption", 32.0)),
                        "avail": str(r.get("availability", "Available")),
                        "route": str(r.get("current_route", "Global")),
                        "compat": str(r.get("port_compatibility", "Visakhapatnam, Paradip, Chennai")),
                        "upd": datetime.now(timezone.utc).isoformat()
                    })
                conn.commit()
                logger.info(f"Seeded {len(df)} vessels into PostgreSQL.")


def migrate_from_sqlite():
    """Transfers historical data from maritime_live.db (SQLite) into PostgreSQL."""
    if not os.path.exists(SQLITE_DB_PATH):
        logger.info("No SQLite maritime_live.db found to migrate.")
        return

    sqlite_conn = sqlite3.connect(SQLITE_DB_PATH)
    sqlite_conn.row_factory = sqlite3.Row
    s_cur = sqlite_conn.cursor()

    tables = [
        "cargo_plans",
        "freight_forecasts",
        "vessel_options",
        "optimization_runs",
        "charter_bookings",
        "fleet_assignments",
        "berth_bookings",
        "api_sync_logs",
        "freight_observations",
    ]

    for t in tables:
        try:
            with engine.connect() as pg_conn:
                s_cur.execute(f"SELECT * FROM {t}")
                rows = s_cur.fetchall()
                if not rows:
                    continue

                col_names = [d[0] for d in s_cur.description]
                cols_str = ", ".join(col_names)
                placeholders = ", ".join([f":{col}" for col in col_names])

                insert_sql = text(f"""
                    INSERT INTO {t} ({cols_str})
                    VALUES ({placeholders})
                    ON CONFLICT DO NOTHING
                """)

                if rows:
                    payload = [dict(r) for r in rows]
                    pg_conn.execute(insert_sql, payload)
                    pg_conn.commit()
                    logger.info(f"Migrated {len(rows)} rows for table '{t}' from SQLite to PostgreSQL.")
                else:
                    logger.info(f"Table '{t}' has 0 rows in SQLite.")
        except Exception as e:
            logger.warning(f"Table '{t}' migration notice: {e}")

    sqlite_conn.close()
    sync_sequences()


def sync_sequences():
    """Resets all serial primary key sequences to max(id) + 1 to prevent unique constraint collisions."""
    serial_tables = [
        "vessel_positions",
        "weather_observations",
        "commodity_prices",
        "fuel_prices",
        "freight_rates",
        "api_sync_logs",
        "freight_observations",
        "freight_forecasts",
        "vessel_options",
        "optimization_runs",
        "route_options",
        "berth_bookings",
        "fleet_assignments",
        "rescheduling_options",
    ]
    with engine.connect() as conn:
        for t in serial_tables:
            try:
                conn.execute(text(f"""
                    SELECT setval(
                        pg_get_serial_sequence('{t}', 'id'),
                        COALESCE((SELECT MAX(id) FROM {t}), 0) + 1,
                        false
                    );
                """))
            except Exception as e:
                logger.debug(f"Sequence sync for {t}: {e}")
        conn.commit()
        logger.info("Synchronized PostgreSQL auto-increment sequences for all serial tables.")


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    seed_reference_data()
    migrate_from_sqlite()
    sync_sequences()
    print("PostgreSQL seed, SQLite data migration, and sequence synchronization completed successfully.")
