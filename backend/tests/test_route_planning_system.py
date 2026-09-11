"""
Comprehensive Test Suite for Dynamic Maritime Route Planning, Risk-Aware Routing,
Berth Availability, Fleet Allotment, and Booking System.
"""
import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient

from main import app
from services.route_engine import get_all_corridors, calculate_route_options
from services.route_risk_service import evaluate_route_risk
from services.vessel_routing_service import evaluate_vessel_candidates
from services.berth_service import get_port_berths, check_berth_availability, book_berth
from services.alternative_port_service import evaluate_alternative_ports
from services.fleet_allotment_service import allocate_fleet_to_cargo
from services.booking_service import (
    create_charter_booking,
    get_all_charter_bookings,
    get_charter_booking_by_id,
    reschedule_charter_booking,
    cancel_charter_booking,
)
from schemas.route_planning import (
    CharterBookingCreateRequest,
    RescheduleRequest,
    CancelBookingRequest,
)

client = TestClient(app)


# ─────────────────────────────────────────────────────────────────────────────
# 1. Route Corridor & Graph Routing Tests
# ─────────────────────────────────────────────────────────────────────────────

def test_route_corridors_catalog():
    """Verify that all major overseas origins and East Coast destinations are represented."""
    corridors = get_all_corridors()
    assert len(corridors) >= 6
    origin_countries = {c.origin_country for c in corridors}
    dest_ports = {c.destination_port for c in corridors}

    assert "Australia" in origin_countries
    assert "Indonesia" in origin_countries
    assert "South Africa" in origin_countries
    assert "Visakhapatnam" in dest_ports
    assert "Paradip" in dest_ports

    for c in corridors:
        assert c.data_status == "estimated"
        assert "not for navigation" in c.label.lower()
        assert len(c.waypoints) >= 4
        assert c.estimated_distance_nm > 1000


def test_shortest_vs_lowest_cost_calculation():
    """Verify Option A (Shortest/Fastest) vs Option B (Lowest-Cost) tradeoff."""
    res = calculate_route_options(
        origin="Australia",
        destination="Visakhapatnam",
        cargo_type="Coal",
        cargo_quantity=75000.0,
        vessel_class="Panamax",
    )
    assert res.shortest_route is not None
    assert res.lowest_cost_route is not None

    # Shortest has less or equal distance than lowest-cost detour
    assert res.shortest_route.distance_nm <= res.lowest_cost_route.distance_nm

    # Shortest has faster speed & shorter transit time
    assert res.shortest_route.speed_knots > res.lowest_cost_route.speed_knots
    assert res.shortest_route.sailing_days < res.lowest_cost_route.sailing_days

    # Lowest-cost has lower total cost due to eco-steaming fuel savings
    assert res.lowest_cost_route.total_cost_usd < res.shortest_route.total_cost_usd
    assert res.lowest_cost_route.cost_savings_usd > 0
    assert res.lowest_cost_route.cost_per_ton_usd < res.shortest_route.cost_per_ton_usd

    # Both explicitly include navigation disclaimer
    assert "not for navigation" in res.shortest_route.navigation_disclaimer.lower()
    assert "not for navigation" in res.lowest_cost_route.navigation_disclaimer.lower()
    assert res.tradeoff_summary != ""


def test_routes_compare_api_endpoint():
    """Test POST /api/v1/routes/compare API endpoint."""
    payload = {
        "origin": "Indonesia",
        "destination": "Paradip",
        "cargo_type": "Thermal Coal",
        "cargo_quantity": 60000,
        "vessel_class": "Supramax",
    }
    response = client.post("/api/v1/routes/compare", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["origin"] == "Banjarmasin"
    assert data["destination"] == "Paradip"
    assert data["shortest_route"]["distance_nm"] > 0
    assert data["lowest_cost_route"]["total_cost_usd"] > 0
    assert data["data_status"] == "estimated"


# ─────────────────────────────────────────────────────────────────────────────
# 2. Risk Scoring & Weather Disruption Tests
# ─────────────────────────────────────────────────────────────────────────────

def test_route_risk_assessment():
    """Verify route risk scoring and alert generation."""
    risk_res = evaluate_route_risk("Australia", "Visakhapatnam")
    assert 0 <= risk_res.overall_risk_score <= 100
    assert risk_res.overall_risk_level in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    assert risk_res.data_status in ["live", "estimated", "historical"]


def test_haldia_draft_restriction_alert():
    """Verify that Haldia route receives critical draft restriction alert."""
    risk_res = evaluate_route_risk("Australia", "Haldia")
    haldia_alerts = [a for a in risk_res.active_alerts if "HALDIA" in a.alert_id]
    assert len(haldia_alerts) >= 1
    assert haldia_alerts[0].severity == "CRITICAL"
    assert "12.5m" in haldia_alerts[0].description


# ─────────────────────────────────────────────────────────────────────────────
# 3. Vessel Capacity & Suitability Tests
# ─────────────────────────────────────────────────────────────────────────────

def test_vessel_capacity_and_draft_rejection():
    """Verify vessel capacity checks and explicit rejection reasons."""
    # Request Capesize cargo (180,000 MT) at Haldia (draft limit 12.5m, max DWT 45,000 MT)
    candidates = evaluate_vessel_candidates(
        cargo_quantity=180000.0,
        destination_port="Haldia",
        cargo_type="Coal",
    )
    assert len(candidates) > 0

    # Capesize vessels must be rejected for draft and displacement at Haldia
    for v in candidates:
        if v.dwt > 45000:
            assert v.is_suitable is False
            assert "Rejected" in v.rejection_reason
            assert ("draft" in v.rejection_reason.lower() or "capacity" in v.rejection_reason.lower() or "deadweight" in v.rejection_reason.lower())


def test_vessel_suitability_at_visakhapatnam():
    """Verify that deepwater port Visakhapatnam accepts Capesize tonnage."""
    candidates = evaluate_vessel_candidates(
        cargo_quantity=75000.0,
        destination_port="Visakhapatnam",
        cargo_type="Coal",
    )
    suitable = [v for v in candidates if v.is_suitable]
    assert len(suitable) >= 1


# ─────────────────────────────────────────────────────────────────────────────
# 4. Berth Availability & Conflict Engine Tests
# ─────────────────────────────────────────────────────────────────────────────

def test_berth_listing():
    """Verify berth catalog retrieval for major East Coast ports."""
    berths_vizag = get_port_berths("P001")
    assert len(berths_vizag) >= 2
    assert any("OST" in b.berth_id or "VGCB" in b.berth_id for b in berths_vizag)

    berths_paradip = get_port_berths("P002")
    assert len(berths_paradip) >= 2


def test_berth_conflict_detection():
    """Verify that overlapping berthing windows trigger conflict detection."""
    from db.database import get_db_connection
    conn = get_db_connection()
    conn.execute("DELETE FROM berth_bookings WHERE vessel_id LIKE 'MV % Test'")
    conn.commit()
    conn.close()

    port_id = "P001"
    berths = get_port_berths(port_id)
    target_berth = berths[0].berth_id

    base_time = datetime.now(timezone.utc) + timedelta(days=70)
    arr_time = base_time.strftime("%Y-%m-%dT08:00:00Z")
    dep_time = (base_time + timedelta(days=2)).strftime("%Y-%m-%dT08:00:00Z")

    # Book first vessel
    res1 = book_berth(
        port_id=port_id,
        berth_id=target_berth,
        vessel_id="MV Pioneer Test",
        arrival_time=arr_time,
        departure_time=dep_time,
    )
    assert res1.success is True

    # Attempt overlapping second booking within window + buffer (12 hours later)
    overlapping_arr = (base_time + timedelta(days=1)).strftime("%Y-%m-%dT12:00:00Z")
    overlapping_dep = (base_time + timedelta(days=3)).strftime("%Y-%m-%dT12:00:00Z")

    res2 = book_berth(
        port_id=port_id,
        berth_id=target_berth,
        vessel_id="MV Conflicted Test",
        arrival_time=overlapping_arr,
        departure_time=overlapping_dep,
    )
    # Must detect conflict and block
    assert res2.success is False
    assert res2.conflict_detected is True
    assert "already reserved" in res2.message or "CONFLICT" in res2.status


def test_berth_availability_endpoint():
    """Test POST /api/v1/ports/{port_id}/berth-availability API endpoint."""
    payload = {
        "requested_arrival": "2026-10-20T10:00:00Z",
        "estimated_stay_hours": 48.0,
        "vessel_dwt": 78000.0,
        "vessel_draft": 14.2,
    }
    response = client.post("/api/v1/ports/P001/berth-availability", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "berths" in data
    assert len(data["berths"]) > 0
    assert "buffer_hours" in data
    assert data["buffer_hours"] == 6.0


# ─────────────────────────────────────────────────────────────────────────────
# 5. Alternative Port Economics Tests
# ─────────────────────────────────────────────────────────────────────────────

def test_alternative_port_evaluation():
    """Verify alternative port landed cost calculations and trade-offs."""
    alt_res = evaluate_alternative_ports(
        original_port="Visakhapatnam",
        cargo_quantity=75000.0,
        cargo_type="Coal",
        vessel_draft=14.2,
        vessel_dwt=82000.0,
    )
    assert alt_res.original_port == "Visakhapatnam"
    assert len(alt_res.options) >= 3

    for opt in alt_res.options:
        assert opt.port_name != "Visakhapatnam"
        assert opt.distance_difference_nm > 0
        assert opt.additional_fuel_cost_usd >= 0
        assert opt.total_landed_cost_usd > 0
        assert opt.feasibility_score >= 0


# ─────────────────────────────────────────────────────────────────────────────
# 6. Fleet Allotment & Multi-Vessel Optimization Tests
# ─────────────────────────────────────────────────────────────────────────────

def test_fleet_allotment_scenarios():
    """Verify dynamic fleet allotment across single vs multi-vessel and delay scenarios."""
    fleet_res = allocate_fleet_to_cargo(
        cargo_quantity=150000.0,
        cargo_type="Coal",
        origin="Australia",
        destination="Visakhapatnam",
        maximum_budget=20000000.0,
        preferred_vessel_class="Capesize",
    )
    assert fleet_res.candidate_vessels_evaluated > 0
    assert len(fleet_res.scenarios) >= 2
    assert fleet_res.recommended_scenario_id != "NONE"

    # Verify coverage
    for scn in fleet_res.scenarios:
        assert scn.total_dwt_allocated >= 50000
        assert scn.total_cost_usd > 0
        assert scn.is_budget_compliant is True


def test_fleet_allocation_endpoint():
    """Test POST /api/v1/fleet/allocate API endpoint."""
    payload = {
        "cargo_quantity": 80000,
        "cargo_type": "Coking Coal",
        "origin": "Australia",
        "destination": "Visakhapatnam",
        "delivery_deadline": "2026-11-15",
        "maximum_budget": 12000000,
        "preferred_vessel_class": "Panamax",
    }
    response = client.post("/api/v1/fleet/allocate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data["scenarios"]) >= 1
    assert "recommended_scenario_id" in data


# ─────────────────────────────────────────────────────────────────────────────
# 7. Charter Booking & Rescheduling Workflow Tests
# ─────────────────────────────────────────────────────────────────────────────

def test_booking_lifecycle_and_confirmation_preservation():
    """Verify booking creation, rescheduling without silent modification, and cancellation."""
    create_req = CharterBookingCreateRequest(
        vessel_id="V001",
        origin_port="Port Hedland",
        destination_port="Visakhapatnam",
        selected_route_type="shortest",
        selected_berth_id="VIZ-OST-01",
        planned_departure="2026-10-01",
        planned_arrival="2026-10-17",
        cargo_quantity=80000.0,
        cargo_type="Iron Ore",
        estimated_total_cost=2450000.0,
        notes="Lifecycle test booking",
    )

    booking = create_charter_booking(create_req)
    assert booking.booking_id.startswith("BK-")
    assert booking.booking_status == "CONFIRMED"

    # Step 2: Request rescheduling without user confirmation
    resched_req = RescheduleRequest(
        booking_id=booking.booking_id,
        reason="Berth delay detected",
        confirm_changes=False,
    )
    resched_res = reschedule_charter_booking(resched_req)
    # Booking MUST NOT be modified silently
    assert resched_res.requires_user_confirmation is True
    assert resched_res.applied_changes is None
    assert len(resched_res.rescheduling_options) >= 1

    # Verify booking status in database is still unchanged
    retrieved = get_charter_booking_by_id(booking.booking_id)
    assert retrieved.booking_status == "CONFIRMED"
    assert retrieved.planned_arrival == "2026-10-17"

    # Step 3: Reschedule WITH user confirmation
    resched_req_confirmed = RescheduleRequest(
        booking_id=booking.booking_id,
        reason="User accepted +3 days date shift",
        new_arrival_date="2026-10-20",
        confirm_changes=True,
    )
    resched_res_conf = reschedule_charter_booking(resched_req_confirmed)
    assert resched_res_conf.requires_user_confirmation is False
    assert resched_res_conf.applied_changes["planned_arrival"] == "2026-10-20"

    # Verify updated in database
    retrieved_updated = get_charter_booking_by_id(booking.booking_id)
    assert retrieved_updated.planned_arrival == "2026-10-20"

    # Step 4: Cancel booking
    cancel_req = CancelBookingRequest(
        booking_id=booking.booking_id,
        cancellation_reason="Commercial cargo rescheduled by shipper",
    )
    cancel_res = cancel_charter_booking(cancel_req)
    assert cancel_res.current_status == "CANCELLED"

    retrieved_cancelled = get_charter_booking_by_id(booking.booking_id)
    assert retrieved_cancelled.booking_status == "CANCELLED"


def test_booking_validation_negative_cargo():
    """Verify that negative cargo quantities are rejected."""
    with pytest.raises((ValueError, Exception)):
        create_charter_booking(
            CharterBookingCreateRequest(
                vessel_id="V002",
                origin_port="Port Hedland",
                destination_port="Visakhapatnam",
                selected_route_type="shortest",
                planned_departure="2026-10-05",
                planned_arrival="2026-10-21",
                cargo_quantity=-5000.0,
                estimated_total_cost=1000000.0,
            )
        )
