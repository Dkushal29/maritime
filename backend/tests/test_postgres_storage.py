"""
Verification script for PostgreSQL data persistence:
Validates store and retrieve operations for:
1. cargo plans
2. freight observations
3. forecasts
4. route corridors
5. ports
6. berths
7. vessel options
8. fleet allocations
9. charter bookings
10. rescheduling records
"""
import uuid
from datetime import datetime, timezone
from db.database import get_db_connection


def test_postgres_persistence():
    conn = get_db_connection()
    cur = conn.cursor()
    test_suffix = uuid.uuid4().hex[:8]
    now_iso = datetime.now(timezone.utc).isoformat()

    results = {}

    # 1. Ports
    port_id = f"TEST_PORT_{test_suffix}"
    cur.execute("""
        INSERT INTO ports (port_id, port_name, country, latitude, longitude, draft_meters, max_dwt, operational_status, last_updated)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (port_id, f"Test Port {test_suffix}", "India", 17.5, 83.2, 18.0, 150000.0, "Operational", now_iso))
    conn.commit()

    cur.execute("SELECT * FROM ports WHERE port_id = ?", (port_id,))
    port_row = cur.fetchone()
    assert port_row is not None and port_row["port_id"] == port_id
    results["ports"] = f"OK (Retrieved port_id: {port_row['port_id']}, name: {port_row['port_name']})"

    # 2. Berths
    berth_id = f"TEST_BERTH_{test_suffix}"
    cur.execute("""
        INSERT INTO berths (berth_id, port_id, berth_name, length_meters, draft_meters, max_dwt, operating_hours, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (berth_id, port_id, f"Test Berth {test_suffix}", 300.0, 18.0, 150000.0, "24/7", 1))
    conn.commit()

    cur.execute("SELECT * FROM berths WHERE berth_id = ?", (berth_id,))
    berth_row = cur.fetchone()
    assert berth_row is not None and berth_row["berth_id"] == berth_id
    results["berths"] = f"OK (Retrieved berth_id: {berth_row['berth_id']}, draft: {berth_row['draft_meters']})"

    # 3. Route Corridors
    corridor_id = f"TEST_CORRIDOR_{test_suffix}"
    cur.execute("""
        INSERT INTO route_corridors (
            corridor_id, origin_port, origin_country, origin_lat, origin_lng,
            destination_port, destination_country, destination_lat, destination_lng,
            cargo_type, typical_vessel_classes, approximate_corridor, waypoints,
            estimated_distance_nm, typical_sailing_days, data_source, data_confidence,
            is_verified_nautical, last_updated
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        corridor_id, "Newcastle", "Australia", -32.9, 151.7,
        port_id, "India", 17.5, 83.2,
        "Coal", "[\"Panamax\"]", "Direct Malacca", "[[0,0]]",
        5400, 16.5, "Admiralty Chart", 0.95,
        1, now_iso
    ))
    conn.commit()

    cur.execute("SELECT * FROM route_corridors WHERE corridor_id = ?", (corridor_id,))
    corridor_row = cur.fetchone()
    assert corridor_row is not None and corridor_row["corridor_id"] == corridor_id
    results["route corridors"] = f"OK (Retrieved corridor_id: {corridor_row['corridor_id']}, distance: {corridor_row['estimated_distance_nm']}nm)"

    # 4. Cargo Plans
    plan_id = f"TEST_PLAN_{test_suffix}"
    cur.execute("""
        INSERT INTO cargo_plans (
            plan_id, cargo_type, cargo_quantity, origin, destination_port,
            required_arrival_date, max_budget, preferred_vessel_class,
            supplier_price_per_tonne, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        plan_id, "Coal", 75000.0, "Australia", port_id,
        "2026-11-01", 3500000.0, "Panamax",
        110.0, "PLANNED", now_iso
    ))
    conn.commit()

    cur.execute("SELECT * FROM cargo_plans WHERE plan_id = ?", (plan_id,))
    plan_row = cur.fetchone()
    assert plan_row is not None and plan_row["plan_id"] == plan_id
    results["cargo plans"] = f"OK (Retrieved plan_id: {plan_row['plan_id']}, qty: {plan_row['cargo_quantity']}T)"

    # 5. Freight Forecasts
    cur.execute("""
        INSERT INTO freight_forecasts (
            plan_id, origin, destination, cargo_type, vessel_class,
            predicted_rate, forecast_direction, confidence,
            mae, rmse, mape, data_status, limitations, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        plan_id, "Australia", "Visakhapatnam", "Coal", "Panamax",
        14.85, "STABLE", "HIGH",
        0.82, 1.15, 6.2, "LIVE", "None", now_iso
    ))
    conn.commit()

    cur.execute("SELECT * FROM freight_forecasts WHERE plan_id = ?", (plan_id,))
    forecast_row = cur.fetchone()
    assert forecast_row is not None and forecast_row["plan_id"] == plan_id
    results["forecasts"] = f"OK (Retrieved forecast rate: ${forecast_row['predicted_rate']}/T, dir: {forecast_row['forecast_direction']})"

    # 6. Vessel Options
    vessel_id = f"VSL_TEST_{test_suffix}"
    # Ensure vessel exists in vessels table
    cur.execute("""
        INSERT INTO vessels (vessel_id, vessel_name, vessel_type, dwt, built_year, charter_rate_per_day, fuel_consumption, availability, last_updated)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (vessel_id) DO NOTHING
    """, (vessel_id, f"MV Ocean {test_suffix}", "Panamax", 82000.0, 2019, 24000.0, 31.0, "Available", now_iso))
    conn.commit()

    cur.execute("""
        INSERT INTO vessel_options (
            plan_id, vessel_id, vessel_name, vessel_class, capacity_dwt,
            draft_meters, suitability_status, suitability_score, explanation,
            estimated_voyage_days, estimated_freight_cost, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        plan_id, vessel_id, f"MV Ocean {test_suffix}", "Panamax", 82000.0,
        14.5, "SUITABLE", 94.5, "Optimal draft and capacity fit",
        16.2, 388800.0, now_iso
    ))
    conn.commit()

    cur.execute("SELECT * FROM vessel_options WHERE plan_id = ?", (plan_id,))
    vessel_opt_row = cur.fetchone()
    assert vessel_opt_row is not None and vessel_opt_row["vessel_id"] == vessel_id
    results["vessel options"] = f"OK (Retrieved vessel_id: {vessel_opt_row['vessel_id']}, score: {vessel_opt_row['suitability_score']})"

    # 7. Freight Observations
    cur.execute("""
        INSERT INTO freight_observations (
            date, origin, destination, cargo_type, vessel_class,
            freight_rate, bdi, bunker_price, port_congestion,
            vessel_availability, data_source, data_status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        "2026-09-12", "Australia", "Visakhapatnam", "Coal", "Panamax",
        14.50, 1850.0, 620.0, 3.2,
        8.0, "Baltic Exchange", "HISTORICAL", now_iso
    ))
    conn.commit()

    cur.execute("SELECT * FROM freight_observations WHERE origin = 'Australia' ORDER BY id DESC LIMIT 1")
    obs_row = cur.fetchone()
    assert obs_row is not None
    results["freight observations"] = f"OK (Retrieved rate: ${obs_row['freight_rate']}, BDI: {obs_row['bdi']})"

    # 8. Charter Bookings
    booking_id = f"BK_TEST_{test_suffix}"
    cur.execute("""
        INSERT INTO charter_bookings (
            booking_id, cargo_plan_id, vessel_id, origin_port, destination_port,
            selected_route_type, selected_berth_id, planned_departure, planned_arrival,
            berthing_start, berthing_end, cargo_quantity, cargo_type,
            estimated_total_cost, cost_per_ton, booking_status, risk_status,
            data_status, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        booking_id, plan_id, vessel_id, "Australia", port_id,
        "SHORTEST", berth_id, "2026-10-01", "2026-10-18",
        "2026-10-18", "2026-10-20", 75000.0, "Coal",
        1125000.0, 15.0, "CONFIRMED", "LOW",
        "simulated", "Integration verification booking", now_iso, now_iso
    ))
    conn.commit()

    cur.execute("SELECT * FROM charter_bookings WHERE booking_id = ?", (booking_id,))
    booking_row = cur.fetchone()
    assert booking_row is not None and booking_row["booking_id"] == booking_id
    results["charter bookings"] = f"OK (Retrieved booking_id: {booking_row['booking_id']}, status: {booking_row['booking_status']})"

    # 9. Fleet Allocations
    cur.execute("""
        INSERT INTO fleet_assignments (
            booking_id, plan_id, vessel_id, assignment_date,
            laycan_start, laycan_end, allocated_cargo_qty, utilization_rate, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        booking_id, plan_id, vessel_id, "2026-09-12",
        "2026-10-01", "2026-10-18", 75000.0, 91.5, "ALLOCATED", now_iso
    ))
    conn.commit()

    cur.execute("SELECT * FROM fleet_assignments WHERE booking_id = ?", (booking_id,))
    fleet_row = cur.fetchone()
    assert fleet_row is not None and fleet_row["booking_id"] == booking_id
    results["fleet allocations"] = f"OK (Retrieved assignment for {fleet_row['vessel_id']}, qty: {fleet_row['allocated_cargo_qty']}T)"

    # 10. Rescheduling Records
    cur.execute("""
        INSERT INTO rescheduling_options (
            booking_id, option_type, proposed_port, proposed_vessel_id,
            proposed_arrival_date, proposed_berth_id, additional_cost_usd,
            cost_variance_pct, delay_days_saved, feasibility_score, rationale, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        booking_id, "DATE_SHIFT", port_id, vessel_id,
        "2026-10-21", berth_id, 12000.0,
        1.1, 3.0, 92.0, "Shifted by 3 days for open berth window", now_iso
    ))
    conn.commit()

    cur.execute("SELECT * FROM rescheduling_options WHERE booking_id = ?", (booking_id,))
    resched_row = cur.fetchone()
    assert resched_row is not None and resched_row["booking_id"] == booking_id
    results["rescheduling records"] = f"OK (Retrieved option: {resched_row['option_type']}, feasibility: {resched_row['feasibility_score']})"

    # Clean up test rows
    cur.execute("DELETE FROM rescheduling_options WHERE booking_id = ?", (booking_id,))
    cur.execute("DELETE FROM fleet_assignments WHERE booking_id = ?", (booking_id,))
    cur.execute("DELETE FROM charter_bookings WHERE booking_id = ?", (booking_id,))
    cur.execute("DELETE FROM vessel_options WHERE plan_id = ?", (plan_id,))
    cur.execute("DELETE FROM freight_forecasts WHERE plan_id = ?", (plan_id,))
    cur.execute("DELETE FROM cargo_plans WHERE plan_id = ?", (plan_id,))
    cur.execute("DELETE FROM route_corridors WHERE corridor_id = ?", (corridor_id,))
    cur.execute("DELETE FROM berths WHERE berth_id = ?", (berth_id,))
    cur.execute("DELETE FROM ports WHERE port_id = ?", (port_id,))
    cur.execute("DELETE FROM vessels WHERE vessel_id = ?", (vessel_id,))
    cur.execute("DELETE FROM freight_observations WHERE origin = 'Australia' AND date = '2026-09-12'")
    conn.commit()
    conn.close()

    print("\n--- PostgreSQL Persistence Verification for 10 Required Data Types ---")
    for entity, res in results.items():
        print(f"[PASSED] {entity:<22}: {res}")
    print("------------------------------------------------------------------------\n")


if __name__ == "__main__":
    test_postgres_persistence()
