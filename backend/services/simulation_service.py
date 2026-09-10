"""
What-If Decision Simulator service using consistent underlying freight and risk models.
"""
from typing import Dict, Any
from .freight_service import get_freight_model
from src.risk_engine import evaluate_market_risk


def run_what_if_simulation(
    bunker_price: float = 620.0,
    port_congestion: str = "Medium",
    cargo_demand: int = 230000,
    vessel_availability: str = "Medium",
    commodity_price: float = 120.0,
    delivery_deadline: str = "2026-10-15"
) -> Dict[str, Any]:
    # Baseline market parameters
    baseline_bunker = 620.0
    baseline_congestion_days = 3.8
    baseline_avail_val = 0.65
    baseline_commodity = 120.0
    baseline_demand = 230000

    # Convert qualitative inputs to model scale
    cong_map = {"Low": 2.1, "Medium": 3.8, "High": 5.8}
    avail_map = {"Low": 0.35, "Medium": 0.65, "High": 0.85}

    sim_cong_days = cong_map.get(port_congestion, 3.8)
    sim_avail_val = avail_map.get(vessel_availability, 0.65)

    model = get_freight_model()
    
    # Calculate baseline rate
    if model.model is not None:
        base_feat = {
            "origin": "Australia",
            "destination": "Visakhapatnam",
            "cargo_type": "Coal",
            "vessel_type": "Panamax",
            "cargo_volume": baseline_demand,
            "bunker_price": baseline_bunker,
            "port_congestion": baseline_congestion_days,
            "vessel_availability": baseline_avail_val,
            "commodity_price": baseline_commodity,
        }
        current_freight_rate = round(model.predict_point(base_feat), 1)

        sim_feat = {
            "origin": "Australia",
            "destination": "Visakhapatnam",
            "cargo_type": "Coal",
            "vessel_type": "Panamax",
            "cargo_volume": cargo_demand,
            "bunker_price": bunker_price,
            "port_congestion": sim_cong_days,
            "vessel_availability": sim_avail_val,
            "commodity_price": commodity_price,
        }
        simulated_freight_rate = round(model.predict_point(sim_feat), 1)
    else:
        # Grounded formula fallback
        current_freight_rate = 31.8
        bunker_delta = (bunker_price - 620.0) * 0.035
        cong_delta = (sim_cong_days - 3.8) * 0.85
        avail_delta = (0.65 - sim_avail_val) * 12.0
        demand_delta = (cargo_demand - 230000) * 0.000015
        commodity_delta = (commodity_price - 120.0) * 0.015

        simulated_freight_rate = round(max(22.0, current_freight_rate + bunker_delta + cong_delta + avail_delta + demand_delta + commodity_delta), 1)

    # Cost calculations
    current_total_cost = int(round(cargo_demand * 32.0))
    simulated_total_cost = int(round(cargo_demand * simulated_freight_rate))
    cost_change = simulated_total_cost - current_total_cost
    freight_change = round(simulated_freight_rate - current_freight_rate, 1)

    # Risk evaluation
    current_risk_eval = evaluate_market_risk(
        freight_rate_change_pct=11.3,
        vessel_availability=baseline_avail_val,
        port_congestion_days=baseline_congestion_days
    )
    sim_risk_eval = evaluate_market_risk(
        freight_rate_change_pct=max(0, ((simulated_freight_rate - current_freight_rate) / current_freight_rate) * 100),
        vessel_availability=sim_avail_val,
        port_congestion_days=sim_cong_days
    )

    potential_cost_avoided = max(0, cost_change)

    # Contextual recommendation
    if simulated_freight_rate >= 36.5:
        recommendation = "Charter immediately! Severe freight cost explosion under simulated market tightening."
    elif simulated_freight_rate <= 29.5:
        recommendation = "Delay chartering 10-14 days. Market softening provides favorable lower spot rates ahead."
    else:
        recommendation = "Charter within 7 days to maintain current favorable base freight rate of $32.4/MT."

    return {
        "current_freight_rate": current_freight_rate,
        "current_total_cost": current_total_cost,
        "current_risk": current_risk_eval["risk_level"],
        "simulated_freight_rate": simulated_freight_rate,
        "simulated_total_cost": simulated_total_cost,
        "simulated_risk": sim_risk_eval["risk_level"],
        "freight_change": freight_change,
        "cost_change": cost_change,
        "risk_change": f"{current_risk_eval['risk_level']} -> {sim_risk_eval['risk_level']}",
        "potential_cost_avoided": potential_cost_avoided,
        "ai_recommendation": recommendation,
        "data_mode": "DEMO"
    }
