"""
Charter optimization service executing Google OR-Tools MILP solver.
"""
from typing import Dict, Any, Optional
from .vessel_service import get_all_vessels
from .freight_service import predict_freight
from src.optimizer import CharterOptimizer

_optimizer_instance = CharterOptimizer()


def run_charter_optimization(
    origin: str = "Australia",
    destination: str = "Visakhapatnam",
    cargo_type: str = "Coal",
    required_cargo: int = 230000,
    delivery_deadline: str = "2026-10-15",
    preferred_vessel_type: str = "Panamax",
    maximum_budget: float = 10000000.0
) -> Dict[str, Any]:
    # 1. Fetch live vessels
    vessels = get_all_vessels(vtype=preferred_vessel_type if preferred_vessel_type != "ALL" else None)
    if not vessels:
        vessels = get_all_vessels()

    # 2. Get current freight benchmark
    freight_info = predict_freight(
        origin=origin,
        destination=destination,
        cargo_type=cargo_type,
        vessel_type=preferred_vessel_type if preferred_vessel_type != "ALL" else "Panamax",
        cargo_volume=required_cargo
    )
    current_rate = freight_info["current_rate"]

    # 3. Solve MILP across timing scenarios
    res = _optimizer_instance.evaluate_timing_scenarios(
        candidate_vessels=vessels,
        required_cargo=required_cargo,
        delivery_deadline_days=35,
        origin=origin,
        destination=destination,
        maximum_budget=maximum_budget,
        current_freight_rate=current_rate,
        freight_forecast_series=freight_info["forecast"],
        preferred_vessel_type=preferred_vessel_type
    )

    res["data_mode"] = "DEMO"
    return res
