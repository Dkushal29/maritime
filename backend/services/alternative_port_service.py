"""
Port Rerouting and Alternative-Port Economics Engine.
Evaluates alternative Indian East Coast discharge terminals (Paradip, Visakhapatnam, Chennai,
Kamarajar, Haldia, Dhamra) when preferred berths are occupied, restricted, or congested.
Calculates sailing differentials, fuel penalties, port tariffs, demurrage risks, and inland rake freight.
"""
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from schemas.route_planning import (
    AlternativePortOption,
    AlternativePortResponse,
)

# Port economic parameters & hinterland connectivity
PORT_ECONOMICS = {
    "VISAKHAPATNAM": {
        "id": "P001",
        "name": "Visakhapatnam",
        "port_dues_per_ton": 3.80,
        "avg_waiting_days": 1.5,
        "inland_rail_usd_per_ton": 8.50,  # Proximity to South/Central India steel belt
        "draft_m": 18.5,
        "max_dwt": 200000,
    },
    "PARADIP": {
        "id": "P002",
        "name": "Paradip",
        "port_dues_per_ton": 3.40,
        "avg_waiting_days": 2.8,
        "inland_rail_usd_per_ton": 6.20,  # Direct rail to Kalinganagar / Odisha mineral plants
        "draft_m": 17.1,
        "max_dwt": 125000,
    },
    "CHENNAI": {
        "id": "P003",
        "name": "Chennai",
        "port_dues_per_ton": 4.10,
        "avg_waiting_days": 1.2,
        "inland_rail_usd_per_ton": 11.50,
        "draft_m": 16.5,
        "max_dwt": 85000,
    },
    "KAMARAJAR": {
        "id": "P004",
        "name": "Kamarajar (Ennore)",
        "port_dues_per_ton": 3.60,
        "avg_waiting_days": 1.4,
        "inland_rail_usd_per_ton": 9.80,
        "draft_m": 18.0,
        "max_dwt": 150000,
    },
    "HALDIA": {
        "id": "P005",
        "name": "Haldia",
        "port_dues_per_ton": 4.60,
        "avg_waiting_days": 4.5,
        "inland_rail_usd_per_ton": 5.40,  # Serving West Bengal / Durgapur belt
        "draft_m": 12.5,
        "max_dwt": 45000,
    },
    "DHAMRA": {
        "id": "P006",
        "name": "Dhamra",
        "port_dues_per_ton": 3.50,
        "avg_waiting_days": 1.1,
        "inland_rail_usd_per_ton": 7.00,
        "draft_m": 18.0,
        "max_dwt": 180000,
    },
}

# Approximate inter-port coastal sailing distances (Nautical Miles)
INTER_PORT_DISTANCES = {
    ("VISAKHAPATNAM", "PARADIP"): 220,
    ("PARADIP", "VISAKHAPATNAM"): 220,
    ("VISAKHAPATNAM", "CHENNAI"): 350,
    ("CHENNAI", "VISAKHAPATNAM"): 350,
    ("VISAKHAPATNAM", "KAMARAJAR"): 340,
    ("KAMARAJAR", "VISAKHAPATNAM"): 340,
    ("PARADIP", "DHAMRA"): 75,
    ("DHAMRA", "PARADIP"): 75,
    ("PARADIP", "HALDIA"): 180,
    ("HALDIA", "PARADIP"): 180,
    ("VISAKHAPATNAM", "DHAMRA"): 285,
    ("DHAMRA", "VISAKHAPATNAM"): 285,
}


def evaluate_alternative_ports(
    original_port: str,
    cargo_quantity: float = 75000.0,
    cargo_type: str = "Coal",
    vessel_draft: float = 14.2,
    vessel_dwt: float = 82000.0,
) -> AlternativePortResponse:
    """
    Evaluates alternative discharge ports against the preferred port,
    calculating total landed cost variances, demurrage risks, and operational feasibility.
    """
    orig_clean = original_port.upper().strip()
    orig_key = None
    for k in PORT_ECONOMICS:
        if k in orig_clean:
            orig_key = k
            break
    if not orig_key:
        orig_key = "VISAKHAPATNAM"

    orig_econ = PORT_ECONOMICS[orig_key]
    orig_port_charges = cargo_quantity * orig_econ["port_dues_per_ton"]
    orig_inland_freight = cargo_quantity * orig_econ["inland_rail_usd_per_ton"]
    orig_demurrage_risk = orig_econ["avg_waiting_days"] * 28000.0  # $28k daily demurrage
    orig_baseline_cost = orig_port_charges + orig_inland_freight + orig_demurrage_risk

    options: List[AlternativePortOption] = []
    fuel_price = 620.0
    daily_fuel_ton = 24.0

    for alt_key, alt_econ in PORT_ECONOMICS.items():
        if alt_key == orig_key:
            continue

        # Inter-port distance
        pair = (orig_key, alt_key)
        rev_pair = (alt_key, orig_key)
        dist_diff = INTER_PORT_DISTANCES.get(pair, INTER_PORT_DISTANCES.get(rev_pair, 300))
        sailing_time_days = round(dist_diff / (13.5 * 24), 2)

        add_fuel = round(sailing_time_days * daily_fuel_ton * fuel_price, 2)
        port_charges = round(cargo_quantity * alt_econ["port_dues_per_ton"], 2)
        inland_freight = round(cargo_quantity * alt_econ["inland_rail_usd_per_ton"], 2)
        handling = round(cargo_quantity * 1.80, 2)
        demurrage = round(alt_econ["avg_waiting_days"] * 28000.0, 2)

        total_landed = add_fuel + port_charges + inland_freight + handling + demurrage
        cost_diff = round(total_landed - orig_baseline_cost, 2)

        # Check vessel compatibility with alternative port
        vessel_compatible = True
        incompat_reason = None

        if vessel_draft > alt_econ["draft_m"]:
            vessel_compatible = False
            incompat_reason = f"Vessel draft ({vessel_draft}m) exceeds {alt_econ['name']} draft limit ({alt_econ['draft_m']}m)."
        elif vessel_dwt > alt_econ["max_dwt"]:
            vessel_compatible = False
            incompat_reason = f"Vessel DWT ({vessel_dwt:,.0f} MT) exceeds {alt_econ['name']} displacement limit ({alt_econ['max_dwt']:,.0f} MT)."

        # Feasibility score (0-100)
        if not vessel_compatible:
            feasibility = 10.0
            berth_status = "Restricted"
            rec = f"Not feasible: {incompat_reason}"
        else:
            berth_status = "Available" if alt_econ["avg_waiting_days"] < 2.0 else "Partially available"
            # Lower cost difference + lower waiting days yields higher feasibility
            score_delta = max(0, 100 - int(abs(cost_diff) / 10000) - int(alt_econ["avg_waiting_days"] * 8))
            feasibility = float(max(20, min(95, score_delta)))

            if cost_diff < 0:
                rec = f"Cost advantage: Saves ${abs(cost_diff):,.0f} overall due to lower inland rail freight and reduced waiting time."
            else:
                rec = f"Viable backup: Premium of +${cost_diff:,.0f} (+${cost_diff / cargo_quantity:.2f}/MT) justified if primary berth wait exceeds {round(cost_diff / 28000, 1)} days."

        options.append(
            AlternativePortOption(
                port_id=alt_econ["id"],
                port_name=alt_econ["name"],
                distance_difference_nm=dist_diff,
                sailing_time_difference_days=sailing_time_days,
                additional_fuel_cost_usd=add_fuel,
                port_charges_usd=port_charges,
                inland_freight_cost_usd=inland_freight,
                handling_cost_usd=handling,
                demurrage_risk_usd=demurrage,
                total_landed_cost_usd=total_landed,
                cost_difference_usd=cost_diff,
                berth_availability_status=berth_status,
                vessel_compatible=vessel_compatible,
                incompatibility_reason=incompat_reason,
                feasibility_score=feasibility,
                recommendation=rec,
            )
        )

    # Sort options by feasibility score descending
    options.sort(key=lambda x: x.feasibility_score, reverse=True)
    best_opt = options[0] if options and options[0].vessel_compatible else None

    if best_opt and best_opt.cost_difference_usd < 0:
        strategic_rec = (
            f"Use alternative port {best_opt.port_name}: Lower total landed cost (-${abs(best_opt.cost_difference_usd):,.0f}) "
            f"and ready berth availability offer superior operational turnaround."
        )
    elif best_opt:
        strategic_rec = (
            f"Keep the original port {orig_econ['name']}: Total landed cost is lower by ${best_opt.cost_difference_usd:,.0f}. "
            f"Reroute to {best_opt.port_name} only if primary port berth queue exceeds 3 days."
        )
    else:
        strategic_rec = f"Keep the original port {orig_econ['name']}: No compatible alternative ports satisfy vessel draft requirements."

    return AlternativePortResponse(
        original_port=orig_econ["name"],
        cargo_quantity=cargo_quantity,
        cargo_type=cargo_type,
        options=options,
        best_alternative_port=best_opt.port_name if best_opt else None,
        strategic_recommendation=strategic_rec,
        data_status="estimated",
        generated_at=datetime.now(timezone.utc).isoformat(),
    )
