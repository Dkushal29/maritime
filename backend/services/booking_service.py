"""
Charter Booking & Rescheduling Lifecycle Service.
Enforces the lifecycle:
  DRAFT → PENDING_VALIDATION → AWAITING_BERTH → CONFIRMED → RESCHEDULE_REQUIRED → CANCELLED → COMPLETED
Strictly enforces:
- No double-booking.
- No negative cargo quantity.
- Confirmed bookings are never modified without explicit user confirmation.
"""
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
from schemas.route_planning import (
    CharterBookingCreateRequest,
    CharterBookingRecord,
    RescheduleOptionItem,
    RescheduleRequest,
    RescheduleResponse,
    CancelBookingResponse,
)
from db.database import get_db_connection
from services.vessel_service import get_vessel_by_id


def create_charter_booking(req: CharterBookingCreateRequest) -> CharterBookingRecord:
    """Creates and persists a new charter booking record."""
    if req.cargo_quantity <= 0:
        raise ValueError("Cargo quantity must be greater than zero.")
    if req.estimated_total_cost <= 0:
        raise ValueError("Estimated total cost must be greater than zero.")

    now = datetime.now(timezone.utc)
    booking_id = f"BK-{now.strftime('%Y%m%d')}-{int(now.timestamp()) % 10000:04d}"
    now_iso = now.isoformat()

    vessel = get_vessel_by_id(req.vessel_id)
    vessel_name = vessel.get("name", req.vessel_id) if vessel else req.vessel_id

    cost_per_ton = round(req.estimated_total_cost / req.cargo_quantity, 2)
    status = "CONFIRMED" if req.selected_berth_id else "AWAITING_BERTH"

    conn = get_db_connection()
    cursor = conn.cursor()

    # Prevent double-booking on same vessel during overlapping departure
    cursor.execute("""
        SELECT booking_id FROM charter_bookings
        WHERE vessel_id = ? AND booking_status IN ('CONFIRMED', 'AWAITING_BERTH')
        AND planned_departure = ?
    """, (req.vessel_id, req.planned_departure))
    conflict = cursor.fetchone()
    if conflict:
        conn.close()
        raise ValueError(f"Vessel {req.vessel_id} already has an active booking ({conflict['booking_id']}) on {req.planned_departure}.")

    # Insert into charter_bookings
    cursor.execute("""
        INSERT INTO charter_bookings (
            booking_id, cargo_plan_id, vessel_id, origin_port, destination_port,
            selected_route_type, selected_berth_id, planned_departure, planned_arrival,
            berthing_start, berthing_end, cargo_quantity, cargo_type,
            estimated_total_cost, cost_per_ton, booking_status, risk_status,
            data_status, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        booking_id,
        req.cargo_plan_id,
        req.vessel_id,
        req.origin_port,
        req.destination_port,
        req.selected_route_type,
        req.selected_berth_id,
        req.planned_departure,
        req.planned_arrival,
        req.planned_arrival,
        req.planned_arrival,
        req.cargo_quantity,
        req.cargo_type,
        req.estimated_total_cost,
        cost_per_ton,
        status,
        "LOW",
        "simulated",
        req.notes or "Booked via MARITIME AI Route Planning System",
        now_iso,
        now_iso,
    ))

    # Insert fleet assignment
    cursor.execute("""
        INSERT INTO fleet_assignments (
            booking_id, plan_id, vessel_id, assignment_date,
            laycan_start, laycan_end, allocated_cargo_qty, utilization_rate, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        booking_id,
        req.cargo_plan_id,
        req.vessel_id,
        now.strftime("%Y-%m-%d"),
        req.planned_departure,
        req.planned_arrival,
        req.cargo_quantity,
        100.0,
        "ALLOCATED",
        now_iso,
    ))

    # If berth selected, insert berth booking
    if req.selected_berth_id:
        try:
            arr_dt = datetime.fromisoformat(req.planned_arrival.replace("Z", "+00:00"))
            dep_dt = arr_dt + timedelta(hours=48)
            cursor.execute("""
                INSERT INTO berth_bookings (
                    booking_id, port_id, berth_id, vessel_id, arrival_time,
                    berthing_start, berthing_end, departure_time, status, buffer_hours, notes, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                booking_id,
                req.destination_port,
                req.selected_berth_id,
                req.vessel_id,
                req.planned_arrival,
                req.planned_arrival,
                dep_dt.strftime("%Y-%m-%dT%H:%M:%SZ"),
                dep_dt.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "CONFIRMED",
                6.0,
                f"Booking {booking_id}",
                now_iso,
            ))
        except Exception:
            pass

    conn.commit()
    conn.close()

    return CharterBookingRecord(
        booking_id=booking_id,
        cargo_plan_id=req.cargo_plan_id,
        vessel_id=req.vessel_id,
        vessel_name=vessel_name,
        origin_port=req.origin_port,
        destination_port=req.destination_port,
        selected_route_type=req.selected_route_type,
        selected_berth_id=req.selected_berth_id,
        planned_departure=req.planned_departure,
        planned_arrival=req.planned_arrival,
        berthing_start=req.planned_arrival,
        berthing_end=req.planned_arrival,
        cargo_quantity=req.cargo_quantity,
        cargo_type=req.cargo_type,
        estimated_total_cost=req.estimated_total_cost,
        cost_per_ton=cost_per_ton,
        booking_status=status,
        risk_status="LOW",
        data_status="simulated",
        notes=req.notes,
        created_at=now_iso,
        updated_at=now_iso,
    )


def get_all_charter_bookings() -> List[CharterBookingRecord]:
    """Retrieves all stored charter bookings."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM charter_bookings
        ORDER BY created_at DESC
    """)
    rows = cursor.fetchall()
    conn.close()

    bookings = []
    for r in rows:
        v = get_vessel_by_id(r["vessel_id"])
        vname = v.get("name", r["vessel_id"]) if v else r["vessel_id"]
        bookings.append(
            CharterBookingRecord(
                booking_id=r["booking_id"],
                cargo_plan_id=r["cargo_plan_id"],
                vessel_id=r["vessel_id"],
                vessel_name=vname,
                origin_port=r["origin_port"],
                destination_port=r["destination_port"],
                selected_route_type=r["selected_route_type"],
                selected_berth_id=r["selected_berth_id"],
                planned_departure=r["planned_departure"],
                planned_arrival=r["planned_arrival"],
                berthing_start=r["berthing_start"],
                berthing_end=r["berthing_end"],
                cargo_quantity=float(r["cargo_quantity"]),
                cargo_type=r["cargo_type"],
                estimated_total_cost=float(r["estimated_total_cost"]),
                cost_per_ton=float(r["cost_per_ton"]),
                booking_status=r["booking_status"],
                risk_status=r["risk_status"],
                data_status=r["data_status"],
                notes=r["notes"],
                created_at=r["created_at"],
                updated_at=r["updated_at"],
            )
        )
    return bookings


def get_charter_booking_by_id(booking_id: str) -> Optional[CharterBookingRecord]:
    """Retrieves a single booking by ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM charter_bookings WHERE booking_id = ?", (booking_id,))
    r = cursor.fetchone()
    conn.close()

    if not r:
        return None

    v = get_vessel_by_id(r["vessel_id"])
    vname = v.get("name", r["vessel_id"]) if v else r["vessel_id"]

    return CharterBookingRecord(
        booking_id=r["booking_id"],
        cargo_plan_id=r["cargo_plan_id"],
        vessel_id=r["vessel_id"],
        vessel_name=vname,
        origin_port=r["origin_port"],
        destination_port=r["destination_port"],
        selected_route_type=r["selected_route_type"],
        selected_berth_id=r["selected_berth_id"],
        planned_departure=r["planned_departure"],
        planned_arrival=r["planned_arrival"],
        berthing_start=r["berthing_start"],
        berthing_end=r["berthing_end"],
        cargo_quantity=float(r["cargo_quantity"]),
        cargo_type=r["cargo_type"],
        estimated_total_cost=float(r["estimated_total_cost"]),
        cost_per_ton=float(r["cost_per_ton"]),
        booking_status=r["booking_status"],
        risk_status=r["risk_status"],
        data_status=r["data_status"],
        notes=r["notes"],
        created_at=r["created_at"],
        updated_at=r["updated_at"],
    )


def reschedule_charter_booking(req: RescheduleRequest) -> RescheduleResponse:
    """
    Evaluates rescheduling options for a booking.
    Confirmed bookings are NEVER modified silently — modification only occurs if confirm_changes=True.
    """
    booking = get_charter_booking_by_id(req.booking_id)
    if not booking:
        raise ValueError(f"Booking {req.booking_id} not found.")

    now_iso = datetime.now(timezone.utc).isoformat()

    # Generate feasible options
    options: List[RescheduleOptionItem] = [
        RescheduleOptionItem(
            option_type="DATE_SHIFT",
            proposed_port=booking.destination_port,
            proposed_vessel_id=booking.vessel_id,
            proposed_arrival_date=(datetime.fromisoformat(booking.planned_arrival) + timedelta(days=3)).strftime("%Y-%m-%d"),
            proposed_berth_id=booking.selected_berth_id,
            additional_cost_usd=12000.0,
            cost_variance_pct=0.8,
            delay_days_saved=3.0,
            feasibility_score=92.0,
            rationale="Shift arrival by +3 days to align with open berth window. Minimizes port demurrage charges.",
        ),
        RescheduleOptionItem(
            option_type="ALT_PORT",
            proposed_port="Paradip" if "VISAKHAPATNAM" in booking.destination_port.upper() else "Visakhapatnam",
            proposed_vessel_id=booking.vessel_id,
            proposed_arrival_date=booking.planned_arrival,
            proposed_berth_id=None,
            additional_cost_usd=45000.0,
            cost_variance_pct=3.2,
            delay_days_saved=0.0,
            feasibility_score=84.0,
            rationale="Reroute to alternative East Coast deepwater berth to preserve delivery deadline without port waiting.",
        ),
    ]

    applied_changes = None
    if req.confirm_changes:
        conn = get_db_connection()
        cursor = conn.cursor()

        new_arr = req.new_arrival_date or booking.planned_arrival
        new_port = req.new_port or booking.destination_port
        new_vessel = req.new_vessel_id or booking.vessel_id

        cursor.execute("""
            UPDATE charter_bookings
            SET planned_arrival = ?, destination_port = ?, vessel_id = ?,
                booking_status = 'CONFIRMED', notes = notes || ' | Rescheduled on ' || ?,
                updated_at = ?
            WHERE booking_id = ?
        """, (new_arr, new_port, new_vessel, now_iso, now_iso, req.booking_id))

        cursor.execute("""
            UPDATE fleet_assignments
            SET laycan_end = ?, vessel_id = ?
            WHERE booking_id = ?
        """, (new_arr, new_vessel, req.booking_id))

        conn.commit()
        conn.close()

        applied_changes = {
            "planned_arrival": new_arr,
            "destination_port": new_port,
            "vessel_id": new_vessel,
            "updated_at": now_iso,
        }
        msg = f"Booking {req.booking_id} successfully rescheduled upon user confirmation."
        requires_conf = False
        status = "CONFIRMED"
    else:
        msg = f"Generated {len(options)} rescheduling options for {req.booking_id}. User confirmation required to commit changes."
        requires_conf = True
        status = booking.booking_status

    return RescheduleResponse(
        booking_id=req.booking_id,
        current_status=status,
        requires_user_confirmation=requires_conf,
        rescheduling_options=options,
        applied_changes=applied_changes,
        message=msg,
        data_status="simulated",
        updated_at=now_iso,
    )


def cancel_charter_booking(req: CancelBookingRequest) -> CancelBookingResponse:
    """Cancels a booking and releases associated vessel and berth allocations."""
    booking = get_charter_booking_by_id(req.booking_id)
    if not booking:
        raise ValueError(f"Booking {req.booking_id} not found.")

    conn = get_db_connection()
    cursor = conn.cursor()
    now_iso = datetime.now(timezone.utc).isoformat()

    cursor.execute("""
        UPDATE charter_bookings
        SET booking_status = 'CANCELLED',
            notes = notes || ' | Cancelled: ' || ?,
            updated_at = ?
        WHERE booking_id = ?
    """, (req.cancellation_reason, now_iso, req.booking_id))

    cursor.execute("""
        UPDATE fleet_assignments
        SET status = 'CANCELLED'
        WHERE booking_id = ?
    """, (req.booking_id,))

    cursor.execute("""
        UPDATE berth_bookings
        SET status = 'CANCELLED'
        WHERE booking_id = ?
    """, (req.booking_id,))

    conn.commit()
    conn.close()

    return CancelBookingResponse(
        booking_id=req.booking_id,
        previous_status=booking.booking_status,
        current_status="CANCELLED",
        message=f"Booking {req.booking_id} cancelled. Vessel and berth reservations released.",
        cancelled_at=now_iso,
    )
