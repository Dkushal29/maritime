"""
Total Landed Cost Calculation Service for SIH Problem Statement 26006.
Computes transparent 8-component Total Landed Cost:
  Total Landed Cost =
      Cargo Purchase Cost
    + Ocean Freight
    + Port Charges
    + Loading Cost
    + Unloading Cost
    + Fuel-Related Cost
    + Expected Demurrage
    + Other Logistics Costs
Exposes all assumptions, data statuses, and missing data warnings.
"""
import os
import logging
from typing import Dict, Any, List, Optional

from schemas.planning import LandedCostBreakdown, LandedCostResponse
from services.port_service import get_port_by_id, get_port_congestion
from services.suitability_service import get_estimated_voyage_days, VESSEL_CLASS_SPECS
from db.database import get_db_connection

logger = logging.getLogger("maritime_ai.landed_cost")

# Benchmark commodity prices per metric tonne if not provided by user or external feed
DEFAULT_COMMODITY_PRICES = {
    "Coal": 115.0,
    "Iron Ore": 120.0,
    "Limestone": 35.0,
    "Grain": 220.0,
    "Fertilizer": 310.0,
}

# Standard terminal loading and unloading handling rates per tonne ($/t)
STANDARD_TERMINAL_COSTS = {
    "loading_cost_per_tonne": 2.50,
    "unloading_cost_per_tonne": 3.20,
    "port_charges_per_tonne": 1.85,
    "agency_and_inspection_per_tonne": 0.70,
}

# Standard demurrage daily rates by vessel class
DAILY_DEMURRAGE_RATES = {
    "Handysize": 14000.0,
    "Supramax": 18500.0,
    "Panamax": 24000.0,
    "Capesize": 42000.0,
}


def get_benchmark_commodity_price(commodity: str) -> Optional[float]:
    """Synchronously queries SQLite cached commodity benchmarks."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "SELECT price FROM commodity_prices WHERE LOWER(commodity) = ? ORDER BY id DESC LIMIT 1",
            (commodity.lower(),)
        )
        row = cursor.fetchone()
        conn.close()
        if row:
            return float(row["price"])
    except Exception:
        pass
    return None


def get_benchmark_vlsfo_price() -> float:
    """Synchronously queries SQLite cached bunker fuel benchmarks."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT price FROM fuel_prices WHERE fuel_type LIKE '%VLSFO%' ORDER BY id DESC LIMIT 1")
        row = cursor.fetchone()
        conn.close()
        if row:
            return float(row["price"])
    except Exception:
        pass
    return 620.0


def calculate_total_landed_cost(
    cargo_type: str,
    cargo_quantity: float,
    origin: str,
    destination_port: str,
    supplier_price_per_tonne: Optional[float] = None,
    freight_rate_per_tonne: Optional[float] = None,
    vessel_class: Optional[str] = "Panamax",
    port_waiting_days: Optional[float] = None,
) -> LandedCostResponse:
    """
    Computes all 8 components of the Total Landed Cost formula with transparent assumptions.
    """
    clean_cargo = cargo_type.strip().title()
    if clean_cargo.lower() == "iron ore":
        clean_cargo = "Iron Ore"
    clean_vessel = (vessel_class or "Panamax").strip().title()
    if clean_vessel == "Any":
        clean_vessel = "Panamax"

    assumptions: List[str] = []
    missing_data_warnings: List[str] = []
    data_status = "historical"

    # 1. Cargo Purchase Cost
    if supplier_price_per_tonne is not None and supplier_price_per_tonne > 0:
        unit_purchase = supplier_price_per_tonne
        assumptions.append(f"Supplier invoice benchmark applied: ${unit_purchase:.2f}/MT.")
    else:
        # Check commodity spot prices from database cache
        found_price = get_benchmark_commodity_price(clean_cargo)
        if found_price:
            unit_purchase = found_price
            assumptions.append(f"Live/Cached commodity benchmark applied: ${unit_purchase:.2f}/MT.")
        else:
            unit_purchase = DEFAULT_COMMODITY_PRICES.get(clean_cargo, 115.0)
            assumptions.append(f"Standard FOB export price benchmark for {clean_cargo} applied: ${unit_purchase:.2f}/MT.")
            missing_data_warnings.append(f"No custom supplier price provided. Utilizing market FOB baseline (${unit_purchase:.2f}/MT).")

    cargo_purchase_cost = round(cargo_quantity * unit_purchase, 2)

    # 2. Ocean Freight
    if freight_rate_per_tonne is not None and freight_rate_per_tonne > 0:
        unit_freight = freight_rate_per_tonne
        assumptions.append(f"Ocean freight rate calculated at ${unit_freight:.2f}/MT.")
    else:
        unit_freight = 32.50
        assumptions.append(f"Standard ocean freight benchmark applied: ${unit_freight:.2f}/MT.")
        missing_data_warnings.append(f"Freight rate not specified; utilizing benchmark rate of ${unit_freight:.2f}/MT.")

    ocean_freight = round(cargo_quantity * unit_freight, 2)

    # 3. Port Charges
    port_charges_rate = STANDARD_TERMINAL_COSTS["port_charges_per_tonne"]
    port_charges = round(cargo_quantity * port_charges_rate, 2)
    assumptions.append(f"Port charges (port dues, pilotage, berth hire at {destination_port}): ${port_charges_rate:.2f}/MT.")

    # 4. Loading Cost
    loading_rate = STANDARD_TERMINAL_COSTS["loading_cost_per_tonne"]
    loading_cost = round(cargo_quantity * loading_rate, 2)
    assumptions.append(f"Export load terminal handling charges at {origin}: ${loading_rate:.2f}/MT.")

    # 5. Unloading Cost
    unloading_rate = STANDARD_TERMINAL_COSTS["unloading_cost_per_tonne"]
    unloading_cost = round(cargo_quantity * unloading_rate, 2)
    assumptions.append(f"Discharge terminal mechanized handling at {destination_port}: ${unloading_rate:.2f}/MT.")

    # 6. Fuel-Related Cost (Bunker allocation)
    voyage_days = get_estimated_voyage_days(origin, destination_port)
    vlsfo_price = get_benchmark_vlsfo_price()

    # Daily fuel burn by class: Handysize ~15t, Supramax ~20t, Panamax ~24t, Capesize ~42t
    fuel_burn_map = {"Handysize": 15.0, "Supramax": 20.0, "Panamax": 24.0, "Capesize": 42.0}
    daily_burn = fuel_burn_map.get(clean_vessel, 24.0)
    total_fuel_cost = round(voyage_days * daily_burn * vlsfo_price, 2)
    assumptions.append(f"Bunker fuel cost calculated on {voyage_days:.1f} transit days @ {daily_burn:.1f} MT/day ({clean_vessel}) and ${vlsfo_price:.1f}/MT VLSFO.")

    # 7. Expected Demurrage
    port_obj = get_port_by_id(destination_port)
    if port_waiting_days is not None:
        waiting_days = float(port_waiting_days)
    elif port_obj:
        waiting_days = float(port_obj.get("avg_waiting_days", 3.2))
    else:
        waiting_days = 3.2

    daily_demurrage = DAILY_DEMURRAGE_RATES.get(clean_vessel, 24000.0)
    expected_demurrage = round(waiting_days * daily_demurrage, 2)
    assumptions.append(f"Demurrage calculated on {waiting_days:.1f} expected berth waiting days at ${daily_demurrage:,.0f}/day.")

    # 8. Other Logistics Costs (Marine cargo insurance @ 0.35% cargo value, surveying & agency fees @ $0.70/t)
    insurance_cost = round(cargo_purchase_cost * 0.0035, 2)
    agency_inspection_cost = round(cargo_quantity * STANDARD_TERMINAL_COSTS["agency_and_inspection_per_tonne"], 2)
    other_logistics_costs = round(insurance_cost + agency_inspection_cost, 2)
    assumptions.append(f"Other logistics include marine cargo insurance (0.35% value: ${insurance_cost:,.2f}) + draft surveying & clearance (${agency_inspection_cost:,.2f}).")

    # Sum of all 8 components
    total_cost = round(
        cargo_purchase_cost
        + ocean_freight
        + port_charges
        + loading_cost
        + unloading_cost
        + total_fuel_cost
        + expected_demurrage
        + other_logistics_costs,
        2
    )

    cost_per_tonne = round(total_cost / max(1.0, cargo_quantity), 2)

    breakdown = LandedCostBreakdown(
        cargo_purchase_cost=cargo_purchase_cost,
        ocean_freight=ocean_freight,
        port_charges=port_charges,
        loading_cost=loading_cost,
        unloading_cost=unloading_cost,
        fuel_related_cost=total_fuel_cost,
        expected_demurrage=expected_demurrage,
        other_logistics_costs=other_logistics_costs,
    )

    return LandedCostResponse(
        cost_per_tonne=cost_per_tonne,
        total_cost=total_cost,
        breakdown=breakdown,
        assumptions=assumptions,
        data_status=data_status,
        missing_data_warnings=missing_data_warnings,
    )
