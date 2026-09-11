"""
Dynamic Berth & Docking Availability Service.
Manages port terminals, berths, maintenance windows, and berth reservations.
Enforces non-overlapping conflict rule:
  requested_arrival < existing_departure + buffer AND requested_departure + buffer > existing_arrival
Truthfully labels berth status and simulation data.
"""
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
from schemas.route_planning import (
    BerthItem,
    BerthBookingSlot,
    BerthAvailabilityWindow,
    BerthAvailabilityResponse,
    BerthBookingResponse,
)
from db.database import get_db_connection

# ─────────────────────────────────────────────────────────────────────────────
# Monitored East Coast Port Berth Specifications
# ─────────────────────────────────────────────────────────────────────────────
PORT_BERTH_DATA: Dict[str, List[Dict[str, Any]]] = {
    "P001": [  # Visakhapatnam
        {
            "berth_id": "VIZ-OST-01",
            "terminal_id": "VIZ-TERM-OUTER",
            "port_id": "P001",
            "berth_name": "Outer Harbour Capesize Terminal",
            "length_m": 350.0,
            "draft_m": 18.5,
            "max_dwt": 200000.0,
            "equipment": ["High-capacity Gantry Unloader (4500 TPH)", "Conveyor Belt Direct to Stackyard"],
            "operating_hours": "24/7",
            "status": "AVAILABLE",
        },
        {
            "berth_id": "VIZ-VGCB-01",
            "terminal_id": "VIZ-TERM-VGCB",
            "port_id": "P001",
            "berth_name": "Vizag General Cargo Berth (VGCB Coal)",
            "length_m": 320.0,
            "draft_m": 18.1,
            "max_dwt": 180000.0,
            "equipment": ["Twin Continuous Ship Unloaders", "Enclosed High-Speed Belt"],
            "operating_hours": "24/7",
            "status": "AVAILABLE",
        },
        {
            "berth_id": "VIZ-EQ-01",
            "terminal_id": "VIZ-TERM-INNER",
            "port_id": "P001",
            "berth_name": "East Quay 1 (Panamax Coal/Ore)",
            "length_m": 255.0,
            "draft_m": 16.5,
            "max_dwt": 100000.0,
            "equipment": ["Harbour Mobile Cranes (100T)", "Shore Hopper System"],
            "operating_hours": "24/7",
            "status": "OCCUPIED",
        },
    ],
    "P002": [  # Paradip
        {
            "berth_id": "PAR-MCB-01",
            "terminal_id": "PAR-TERM-COAL",
            "port_id": "P002",
            "berth_name": "Mechanized Coal Terminal Berth 1",
            "length_m": 300.0,
            "draft_m": 17.1,
            "max_dwt": 125000.0,
            "equipment": ["Twin Rotary Car Dumpers", "Continuous Ship Unloader (3000 TPH)"],
            "operating_hours": "24/7",
            "status": "AVAILABLE",
        },
        {
            "berth_id": "PAR-CQ-01",
            "terminal_id": "PAR-TERM-CQ",
            "port_id": "P002",
            "berth_name": "Central Quay 1 (Clean Bulk)",
            "length_m": 260.0,
            "draft_m": 16.5,
            "max_dwt": 90000.0,
            "equipment": ["Mobile Cranes", "Pneumatic Discharge"],
            "operating_hours": "24/7",
            "status": "MAINTENANCE",
        },
    ],
    "P003": [  # Chennai
        {
            "berth_id": "CHN-JD-01",
            "terminal_id": "CHN-TERM-JD",
            "port_id": "P003",
            "berth_name": "Jawahar Dock 1 (Dry Bulk)",
            "length_m": 240.0,
            "draft_m": 16.5,
            "max_dwt": 85000.0,
            "equipment": ["Grab Cranes", "Conveyor Stackers"],
            "operating_hours": "24/7",
            "status": "AVAILABLE",
        },
    ],
    "P004": [  # Kamarajar (Ennore)
        {
            "berth_id": "ENR-CB-01",
            "terminal_id": "ENR-TERM-TANGEDCO",
            "port_id": "P004",
            "berth_name": "Coal Berth 1 (Dedicated Utility)",
            "length_m": 325.0,
            "draft_m": 18.0,
            "max_dwt": 150000.0,
            "equipment": ["High-Speed Shore Gantry Unloader (4000 TPH)"],
            "operating_hours": "24/7",
            "status": "OCCUPIED",
        },
        {
            "berth_id": "ENR-CB-02",
            "terminal_id": "ENR-TERM-COMMERCIAL",
            "port_id": "P004",
            "berth_name": "Coal Berth 2 (Commercial Terminal)",
            "length_m": 325.0,
            "draft_m": 18.0,
            "max_dwt": 150000.0,
            "equipment": ["Continuous Bucket Unloaders", "Direct Rail Loading Rapid System"],
            "operating_hours": "24/7",
            "status": "AVAILABLE",
        },
    ],
    "P005": [  # Haldia
        {
            "berth_id": "HAL-B04",
            "terminal_id": "HAL-TERM-DOCK",
            "port_id": "P005",
            "berth_name": "Haldia Dock Berth 4 (Handysize Coal)",
            "length_m": 190.0,
            "draft_m": 12.5,
            "max_dwt": 45000.0,
            "equipment": ["Shore Hopper", "Grab Cranes"],
            "operating_hours": "Tidal Navigable",
            "status": "RESTRICTED",
        },
    ],
    "P006": [  # Dhamra
        {
            "berth_id": "DHM-B01",
            "terminal_id": "DHM-TERM-DEEPWATER",
            "port_id": "P006",
            "berth_name": "Dhamra Deepwater Bulk Berth 1",
            "length_m": 350.0,
            "draft_m": 18.0,
            "max_dwt": 180000.0,
            "equipment": ["Twin Ship Unloaders (5000 TPH)", "Direct Rake Loading Silos"],
            "operating_hours": "24/7",
            "status": "AVAILABLE",
        },
    ],
}


def _resolve_port_id(port_str: str) -> str:
    clean = port_str.upper().strip()
    if clean.startswith("P00"):
        return clean
    if "VISAKHAPATNAM" in clean or "VIZ" in clean:
        return "P001"
    if "PARADIP" in clean:
        return "P002"
    if "CHENNAI" in clean:
        return "P003"
    if "KAMARAJAR" in clean or "ENNORE" in clean:
        return "P004"
    if "HALDIA" in clean:
        return "P005"
    if "DHAMRA" in clean:
        return "P006"
    return "P001"


def get_port_berths(port_id: str) -> List[BerthItem]:
    """Returns catalog of berths for the requested port."""
    pid = _resolve_port_id(port_id)
    berths = PORT_BERTH_DATA.get(pid, PORT_BERTH_DATA["P001"])
    return [
        BerthItem(
            berth_id=b["berth_id"],
            terminal_id=b.get("terminal_id"),
            port_id=pid,
            berth_name=b["berth_name"],
            length_meters=b["length_m"],
            draft_meters=b["draft_m"],
            max_dwt=b["max_dwt"],
            equipment=b.get("equipment", []),
            operating_hours=b.get("operating_hours", "24/7"),
            status=b.get("status", "AVAILABLE"),
        )
        for b in berths
    ]


def check_berth_availability(
    port_id: str,
    requested_arrival: str,
    estimated_stay_hours: float = 48.0,
    vessel_dwt: float = 75000.0,
    vessel_draft: float = 14.2,
    vessel_id: Optional[str] = None,
) -> BerthAvailabilityResponse:
    """
    Checks berthing conflicts across all berths for the requested arrival window.
    Conflict rule:
      requested_arrival < existing_departure + buffer AND requested_departure + buffer > existing_arrival
    """
    pid = _resolve_port_id(port_id)
    port_name = "Visakhapatnam" if pid == "P001" else "Paradip" if pid == "P002" else "Chennai" if pid == "P003" else "Kamarajar" if pid == "P004" else "Haldia" if pid == "P005" else "Dhamra"

    try:
        req_arr_dt = datetime.fromisoformat(requested_arrival.replace("Z", "+00:00"))
    except Exception:
        req_arr_dt = datetime.now(timezone.utc) + timedelta(days=14)

    req_dep_dt = req_arr_dt + timedelta(hours=estimated_stay_hours)
    buffer_hours = 6.0
    buffer_delta = timedelta(hours=buffer_hours)

    # Query existing database bookings
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT booking_id, port_id, berth_id, vessel_id, arrival_time, departure_time, status, notes
        FROM berth_bookings
        WHERE port_id = ?
    """, (pid,))
    existing_records = cursor.fetchall()
    conn.close()

    berth_configs = PORT_BERTH_DATA.get(pid, PORT_BERTH_DATA["P001"])
    berth_windows: List[BerthAvailabilityWindow] = []

    preferred_berth_found = None

    for b in berth_configs:
        bid = b["berth_id"]
        # Check draft and DWT suitability
        is_draft_ok = b["draft_m"] >= vessel_draft
        is_dwt_ok = b["max_dwt"] >= vessel_dwt

        # Check existing bookings for this berth
        assignments: List[BerthBookingSlot] = []
        is_conflicted = False
        conflict_msg = None

        for rec in existing_records:
            if rec["berth_id"] == bid:
                try:
                    ex_arr = datetime.fromisoformat(rec["arrival_time"].replace("Z", "+00:00"))
                    ex_dep = datetime.fromisoformat(rec["departure_time"].replace("Z", "+00:00"))
                    assignments.append(
                        BerthBookingSlot(
                            booking_id=rec["booking_id"],
                            vessel_id=rec["vessel_id"],
                            arrival_time=rec["arrival_time"],
                            departure_time=rec["departure_time"],
                            status=rec["status"],
                        )
                    )
                    # Non-overlapping window with buffer check
                    if (req_arr_dt < ex_dep + buffer_delta) and (req_dep_dt + buffer_delta > ex_arr):
                        is_conflicted = True
                        conflict_msg = (
                            f"Occupied by {rec['vessel_id']} ({ex_arr.strftime('%b %d %H:%M')} to {ex_dep.strftime('%b %d %H:%M')}). "
                            f"Buffer period ({buffer_hours}h) overlaps requested laycan."
                        )
                except Exception:
                    continue

        # In-memory mock busy state if database is empty for realism
        if not assignments and b.get("status") == "OCCUPIED":
            mock_ex_arr = req_arr_dt - timedelta(hours=18)
            mock_ex_dep = req_arr_dt + timedelta(hours=30)
            assignments.append(
                BerthBookingSlot(
                    booking_id="BB-EXISTING-01",
                    vessel_id="MV Bharat Jyoti (IMO 9874512)",
                    arrival_time=mock_ex_arr.strftime("%Y-%m-%dT%H:%M:%SZ"),
                    departure_time=mock_ex_dep.strftime("%Y-%m-%dT%H:%M:%SZ"),
                    status="OCCUPIED",
                    cargo_type="Coking Coal",
                    cargo_quantity=148000,
                )
            )
            is_conflicted = True
            conflict_msg = f"Berth occupied by discharge operation until {mock_ex_dep.strftime('%b %d %H:%M')} + {buffer_hours}h buffer."

        # Assign window status
        if not is_draft_ok:
            status = "Restricted"
            conflict_msg = f"Vessel draft ({vessel_draft}m) exceeds berth draft limit ({b['draft_m']}m)."
        elif not is_dwt_ok:
            status = "Restricted"
            conflict_msg = f"Vessel DWT ({vessel_dwt:,.0f} MT) exceeds berth DWT limit ({b['max_dwt']:,.0f} MT)."
        elif b.get("status") == "MAINTENANCE":
            status = "Maintenance"
            conflict_msg = "Scheduled dredging and conveyor overhaul in progress."
        elif is_conflicted:
            status = "Occupied"
        else:
            status = "Available"
            if not preferred_berth_found:
                preferred_berth_found = bid

        berth_windows.append(
            BerthAvailabilityWindow(
                berth_id=bid,
                berth_name=b["berth_name"],
                draft_meters=b["draft_m"],
                max_dwt=b["max_dwt"],
                status=status,
                conflict_reason=conflict_msg,
                existing_assignments=assignments,
                available_start=req_arr_dt.strftime("%Y-%m-%dT%H:%M:%SZ") if status == "Available" else None,
                available_end=(req_dep_dt + timedelta(days=5)).strftime("%Y-%m-%dT%H:%M:%SZ") if status == "Available" else None,
                suggested_arrival_date=(req_arr_dt + timedelta(days=2)).strftime("%Y-%m-%d") if status == "Occupied" else None,
            )
        )

    is_preferred_avail = preferred_berth_found is not None

    if is_preferred_avail:
        recommendation = (
            f"Berth {preferred_berth_found} is available for requested arrival on {req_arr_dt.strftime('%Y-%m-%d')}. "
            f"Draft ({vessel_draft}m) and DWT ({vessel_dwt:,.0f} MT) satisfy all terminal limits."
        )
    else:
        recommendation = (
            f"All suitable berths at {port_name} are currently occupied or draft-restricted for the requested window. "
            f"Recommend shifting arrival by +48h or evaluating alternative deepwater discharge terminals."
        )

    alt_dates = [
        (req_arr_dt + timedelta(days=2)).strftime("%Y-%m-%d"),
        (req_arr_dt + timedelta(days=4)).strftime("%Y-%m-%d"),
    ]

    alt_ports = [p for p in ["Paradip", "Visakhapatnam", "Kamarajar", "Dhamra"] if p != port_name]

    return BerthAvailabilityResponse(
        port_id=pid,
        port_name=port_name,
        requested_arrival=req_arr_dt.strftime("%Y-%m-%dT%H:%M:%SZ"),
        requested_departure=req_dep_dt.strftime("%Y-%m-%dT%H:%M:%SZ"),
        buffer_hours=buffer_hours,
        is_preferred_berth_available=is_preferred_avail,
        preferred_berth_id=preferred_berth_found,
        berths=berth_windows,
        recommendation=recommendation,
        alternative_dates=alt_dates,
        alternative_ports=alt_ports,
        data_status="simulated",
        evaluated_at=datetime.now(timezone.utc).isoformat(),
    )


def book_berth(
    port_id: str,
    berth_id: str,
    vessel_id: str,
    arrival_time: str,
    departure_time: str,
    cargo_plan_id: Optional[str] = None,
    notes: Optional[str] = None,
) -> BerthBookingResponse:
    """
    Creates a persistent berth booking record if no conflicting window exists.
    """
    pid = _resolve_port_id(port_id)
    booking_id = f"BB-{int(datetime.now().timestamp())}-{berth_id[-3:]}"
    now_iso = datetime.now(timezone.utc).isoformat()

    conn = get_db_connection()
    cursor = conn.cursor()

    # Conflict check
    cursor.execute("""
        SELECT booking_id, arrival_time, departure_time, vessel_id
        FROM berth_bookings
        WHERE port_id = ? AND berth_id = ? AND status != 'CANCELLED'
    """, (pid, berth_id))
    existing = cursor.fetchall()

    req_arr = datetime.fromisoformat(arrival_time.replace("Z", "+00:00"))
    req_dep = datetime.fromisoformat(departure_time.replace("Z", "+00:00"))
    buffer_delta = timedelta(hours=6.0)

    for rec in existing:
        try:
            ex_arr = datetime.fromisoformat(rec["arrival_time"].replace("Z", "+00:00"))
            ex_dep = datetime.fromisoformat(rec["departure_time"].replace("Z", "+00:00"))
            if (req_arr < ex_dep + buffer_delta) and (req_dep + buffer_delta > ex_arr):
                conn.close()
                return BerthBookingResponse(
                    success=False,
                    booking_id="",
                    port_id=pid,
                    berth_id=berth_id,
                    vessel_id=vessel_id,
                    arrival_time=arrival_time,
                    departure_time=departure_time,
                    status="CONFLICT_BLOCKED",
                    conflict_detected=True,
                    message=f"Berth {berth_id} is already reserved by {rec['vessel_id']} for overlapping laycan. Booking rejected.",
                    data_status="simulated",
                    created_at=now_iso,
                )
        except Exception:
            continue

    # Insert verified booking
    cursor.execute("""
        INSERT INTO berth_bookings (
            booking_id, port_id, berth_id, vessel_id, arrival_time,
            berthing_start, berthing_end, departure_time, status, buffer_hours, notes, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        booking_id,
        pid,
        berth_id,
        vessel_id,
        arrival_time,
        arrival_time,
        departure_time,
        departure_time,
        "CONFIRMED",
        6.0,
        notes or "Reserved via MARITIME AI Route & Berth System",
        now_iso,
    ))
    conn.commit()
    conn.close()

    return BerthBookingResponse(
        success=True,
        booking_id=booking_id,
        port_id=pid,
        berth_id=berth_id,
        vessel_id=vessel_id,
        arrival_time=arrival_time,
        departure_time=departure_time,
        status="CONFIRMED",
        conflict_detected=False,
        message=f"Berth {berth_id} confirmed for {vessel_id}. 6-hour pilotage buffer registered.",
        data_status="simulated",
        created_at=now_iso,
    )
