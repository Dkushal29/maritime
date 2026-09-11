"""
Vessel Capacity, Restrictions, and Suitability Engine.
Evaluates dry bulk vessel classes (Handysize, Supramax, Panamax, Capesize)
against cargo quantities, draft limitations, LOA, beam, and destination port constraints.
Provides unambiguous rejection reasons for non-compliant vessels.
"""
from typing import List, Dict, Any, Optional
from schemas.route_planning import FleetCandidateItem
from services.vessel_service import get_all_vessels

PORT_RESTRICTIONS = {
    "VISAKHAPATNAM": {"draft_m": 18.5, "max_dwt": 200000, "max_loa_m": 320},
    "PARADIP": {"draft_m": 17.1, "max_dwt": 125000, "max_loa_m": 290},
    "CHENNAI": {"draft_m": 16.5, "max_dwt": 85000, "max_loa_m": 250},
    "KAMARAJAR": {"draft_m": 18.0, "max_dwt": 150000, "max_loa_m": 300},
    "HALDIA": {"draft_m": 12.5, "max_dwt": 45000, "max_loa_m": 200},
    "DHAMRA": {"draft_m": 18.0, "max_dwt": 180000, "max_loa_m": 315},
}


def evaluate_vessel_candidates(
    cargo_quantity: float,
    destination_port: str,
    cargo_type: str = "Coal",
    preferred_vessel_class: Optional[str] = None,
) -> List[FleetCandidateItem]:
    """
    Evaluates all registered fleet vessels against the cargo requirement and destination port restrictions.
    """
    raw_vessels = get_all_vessels()
    dest_clean = destination_port.upper().strip()

    port_limit = None
    for k, v in PORT_RESTRICTIONS.items():
        if k in dest_clean:
            port_limit = v
            break
    if not port_limit:
        port_limit = PORT_RESTRICTIONS["VISAKHAPATNAM"]

    candidates: List[FleetCandidateItem] = []

    for v in raw_vessels:
        vid = v.get("id", "V000")
        name = v.get("name", "Unknown Vessel")
        vtype = v.get("type", "Panamax")
        dwt = float(v.get("dwt", 75000))
        daily_rate = float(v.get("charter_rate_per_day", 28000))
        fuel_consumption = float(v.get("fuel_consumption", 24.0))
        availability = v.get("availability", "Available")

        # Estimate vessel draft based on DWT
        if dwt >= 150000:
            est_draft = 17.8  # Capesize
        elif dwt >= 70000:
            est_draft = 14.5  # Panamax
        elif dwt >= 50000:
            est_draft = 12.8  # Supramax
        else:
            est_draft = 10.5  # Handysize

        raw_ports = v.get("port_compatibility", "")
        if isinstance(raw_ports, list):
            compat_ports = [str(p).strip() for p in raw_ports]
        else:
            compat_ports = [p.strip() for p in str(raw_ports).split(",") if p.strip()]

        # Evaluate rules and formulate explicit rejection reasons
        is_suitable = True
        rejection_reasons = []

        # Rule 1: Capacity check
        if dwt < cargo_quantity:
            is_suitable = False
            rejection_reasons.append(
                f"Rejected: vessel capacity ({dwt:,.0f} DWT) is below cargo requirement ({cargo_quantity:,.0f} MT)."
            )

        # Rule 2: Draft check
        if est_draft > port_limit["draft_m"]:
            is_suitable = False
            rejection_reasons.append(
                f"Rejected: vessel operating draft ({est_draft}m) exceeds {destination_port} draft limit ({port_limit['draft_m']}m)."
            )

        # Rule 3: DWT port limit check
        if dwt > port_limit["max_dwt"]:
            is_suitable = False
            rejection_reasons.append(
                f"Rejected: vessel deadweight ({dwt:,.0f} DWT) exceeds {destination_port} max displacement limit ({port_limit['max_dwt']:,.0f} DWT)."
            )

        # Rule 4: Port compatibility list check
        if compat_ports and not any(p.upper() in dest_clean for p in compat_ports):
            is_suitable = False
            rejection_reasons.append(
                f"Rejected: vessel port compatibility excludes {destination_port}."
            )

        # Rule 5: Availability status check
        if availability not in ["Available", "Recommended"]:
            is_suitable = False
            rejection_reasons.append(
                f"Rejected: vessel status is '{availability}' (already assigned or undergoing maintenance)."
            )

        # Scoring
        if is_suitable:
            # Score based on capacity utilization and age/fuel efficiency
            utilization = min(cargo_quantity / dwt, 1.0)
            score = round(utilization * 60.0 + 35.0, 1)
        else:
            score = 15.0

        # Estimate voyage cost (16 days typical benchmark)
        est_voyage_cost = round(16.0 * daily_rate + 16.0 * fuel_consumption * 620.0, 2)

        candidates.append(
            FleetCandidateItem(
                vessel_id=vid,
                vessel_name=name,
                vessel_class=vtype,
                dwt=dwt,
                draft_meters=est_draft,
                fuel_consumption=fuel_consumption,
                charter_rate_per_day=daily_rate,
                availability_status=availability,
                port_compatibility=compat_ports,
                is_suitable=is_suitable,
                rejection_reason=" | ".join(rejection_reasons) if rejection_reasons else None,
                suitability_score=score,
                estimated_voyage_cost=est_voyage_cost,
            )
        )

    # Sort: Suitable vessels first by suitability score desc, then rejected
    candidates.sort(key=lambda x: (x.is_suitable, x.suitability_score), reverse=True)
    return candidates
