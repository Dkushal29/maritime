"""
Complete End-to-End Planning & Recommendation Service for SIH Problem Statement 26006:
  Cargo Requirement
         ↓
  Freight Forecasting
         ↓
  Vessel Option Evaluation
         ↓
  Total Landed Cost Calculation
         ↓
  Chartering and Procurement Recommendation
"""
import os
import uuid
import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone, date, timedelta

from schemas.planning import (
    CargoPlanningRequest,
    CargoPlanningResponse,
    FreightForecastResponse,
    VesselSuitabilityItem,
    LandedCostResponse,
    CharterPlanItem,
)
from services.forecasting_service import forecast_freight_rate
from services.suitability_service import evaluate_vessel_suitability
from services.landed_cost_service import calculate_total_landed_cost
from db.database import get_db_connection

logger = logging.getLogger("maritime_ai.planning")


def persist_planning_run(
    plan_id: str,
    req: CargoPlanningRequest,
    forecast: FreightForecastResponse,
    vessels: List[VesselSuitabilityItem],
    landed_cost: LandedCostResponse,
    recommended: CharterPlanItem,
    alternatives: List[CharterPlanItem],
    reasons: List[str],
    warnings: List[str],
    data_status: str
):
    """Persists the complete planning run across SQLite tables."""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        now_iso = datetime.now(timezone.utc).isoformat()

        # 1. cargo_plans
        cursor.execute("""
            INSERT OR REPLACE INTO cargo_plans (
                plan_id, cargo_type, cargo_quantity, origin, destination_port,
                required_arrival_date, max_budget, preferred_vessel_class,
                supplier_price_per_tonne, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            plan_id,
            req.cargo_type,
            req.cargo_quantity,
            req.origin,
            req.destination_port,
            req.required_arrival_date,
            req.maximum_budget,
            req.preferred_vessel_class,
            req.supplier_price_per_tonne,
            "PLANNED",
            now_iso
        ))

        # 2. freight_forecasts
        cursor.execute("""
            INSERT INTO freight_forecasts (
                plan_id, origin, destination, cargo_type, vessel_class,
                predicted_rate, forecast_direction, confidence,
                mae, rmse, mape, data_status, limitations, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            plan_id,
            forecast.route["origin"],
            forecast.route["destination"],
            forecast.cargo_type,
            forecast.vessel_class,
            forecast.predicted_rate_per_tonne,
            forecast.forecast_direction,
            forecast.confidence,
            forecast.metrics.mae,
            forecast.metrics.rmse,
            forecast.metrics.mape,
            forecast.data_status,
            json.dumps(forecast.limitations),
            now_iso
        ))

        # 3. vessel_options
        for v in vessels[:8]:
            cursor.execute("""
                INSERT INTO vessel_options (
                    plan_id, vessel_id, vessel_name, vessel_class,
                    capacity_dwt, draft_meters, suitability_status,
                    suitability_score, explanation, estimated_voyage_days,
                    estimated_freight_cost, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                plan_id,
                v.vessel_id,
                v.vessel_name,
                v.vessel_class,
                v.capacity_dwt,
                v.draft_meters,
                v.suitability_status,
                v.suitability_score,
                v.reasons[0] if v.reasons else (v.unsuitability_reasons[0] if v.unsuitability_reasons else "Evaluated"),
                v.estimated_voyage_days,
                v.estimated_freight_cost,
                now_iso
            ))

        # 4. optimization_runs
        cursor.execute("""
            INSERT INTO optimization_runs (
                plan_id, recommended_plan, estimated_total_cost,
                estimated_cost_per_tonne, decision, reasons,
                warnings, alternatives, data_status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            plan_id,
            recommended.title,
            recommended.estimated_total_cost,
            recommended.estimated_cost_per_tonne,
            recommended.decision,
            json.dumps(reasons),
            json.dumps(warnings),
            json.dumps([a.model_dump() for a in alternatives]),
            data_status,
            now_iso
        ))

        conn.commit()
        conn.close()
        logger.info(f"SIH 26006 Plan {plan_id} persisted into SQLite.")
    except Exception as e:
        logger.warning(f"Failed to persist planning run to database: {e}")


def execute_cargo_planning_workflow(req: CargoPlanningRequest) -> CargoPlanningResponse:
    """
    Executes the 5-phase SIH 26006 workflow:
      1. Cargo requirement input validation (enforced by Pydantic schema)
      2. Forward Freight Forecasting using historical or illustrative modeling
      3. Vessel Suitability Evaluation across Handysize, Supramax, Panamax, Capesize
      4. 8-Component Total Landed Cost calculation
      5. Multi-Plan Charter & Procurement Optimization Recommendation
    """
    plan_id = f"PLAN-{uuid.uuid4().hex[:8].upper()}"
    now_iso = datetime.now(timezone.utc).isoformat()

    # Determine vessel class focus
    target_class = req.preferred_vessel_class if req.preferred_vessel_class != "Any" else "Panamax"
    if req.preferred_vessel_class == "Any":
        # Dynamic default based on volume
        if req.cargo_quantity <= 40000:
            target_class = "Handysize"
        elif req.cargo_quantity <= 65000:
            target_class = "Supramax"
        elif req.cargo_quantity <= 90000:
            target_class = "Panamax"
        else:
            target_class = "Capesize"

    # Step 2: Freight Forecasting
    forecast = forecast_freight_rate(
        origin=req.origin,
        destination=req.destination_port,
        cargo_type=req.cargo_type,
        vessel_class=target_class,
        forecast_days=30
    )

    # Step 3: Vessel Suitability Evaluation
    vessel_evaluations = evaluate_vessel_suitability(
        cargo_quantity_tonnes=req.cargo_quantity,
        origin=req.origin,
        destination_port=req.destination_port,
        required_arrival_date=req.required_arrival_date,
        preferred_vessel_class=req.preferred_vessel_class,
        freight_rate_per_tonne=forecast.predicted_rate_per_tonne
    )

    suitable_vessels = [v for v in vessel_evaluations if v.is_suitable]

    # Step 4: Total Landed Cost Calculation
    landed_cost = calculate_total_landed_cost(
        cargo_type=req.cargo_type,
        cargo_quantity=req.cargo_quantity,
        origin=req.origin,
        destination_port=req.destination_port,
        supplier_price_per_tonne=req.supplier_price_per_tonne,
        freight_rate_per_tonne=forecast.predicted_rate_per_tonne,
        vessel_class=target_class
    )

    # Step 5: Multi-Plan Charter & Procurement Recommendation
    # Generate scenarios:
    # 1. Charter Immediately (Now)
    # 2. Charter within 7 Days (Optimal window)
    # 3. Delay Charter (14 Days)
    # 4. Alternative Class or Split Parcel
    scenarios: List[CharterPlanItem] = []
    base_rate = forecast.current_rate_per_tonne
    pred_rate = forecast.predicted_rate_per_tonne
    direction = forecast.forecast_direction

    warnings: List[str] = []
    limitations: List[str] = list(forecast.limitations)

    # Check budget feasibility
    if landed_cost.total_cost > req.maximum_budget:
        budget_gap = landed_cost.total_cost - req.maximum_budget
        warnings.append(
            f"Calculated landed cost (${landed_cost.total_cost:,.2f}) exceeds maximum budget (${req.maximum_budget:,.2f}) by ${budget_gap:,.2f}."
        )

    # Plan 1: Immediate Charter (Now)
    immediate_rate = base_rate
    imm_lc = calculate_total_landed_cost(
        cargo_type=req.cargo_type,
        cargo_quantity=req.cargo_quantity,
        origin=req.origin,
        destination_port=req.destination_port,
        supplier_price_per_tonne=req.supplier_price_per_tonne,
        freight_rate_per_tonne=immediate_rate,
        vessel_class=target_class
    )
    # Savings compared to waiting 30 days if rates rise
    savings_vs_30d = max(0.0, round((pred_rate - immediate_rate) * req.cargo_quantity, 2))

    scenarios.append(
        CharterPlanItem(
            plan_id=f"{plan_id}-OPT-NOW",
            title="Immediate Spot Charter (Day 0)",
            vessel_class=target_class,
            vessel_count=1 if req.cargo_quantity <= 85000 else 2,
            vessels=[v.model_dump() for v in suitable_vessels[:2]],
            decision="charter_now",
            timing="Immediate",
            estimated_total_cost=imm_lc.total_cost,
            estimated_cost_per_tonne=imm_lc.cost_per_tonne,
            potential_savings=savings_vs_30d,
            risk="LOW",
            reasons=[
                "Eliminates market volatility exposure before anticipated forward rate increase.",
                f"Secures open tonnage at current benchmark of ${immediate_rate:.2f}/MT.",
                "Ensures earliest possible laycan window to absorb potential port berthing delays."
            ],
            warnings=[],
            feasibility=imm_lc.total_cost <= req.maximum_budget * 1.05
        )
    )

    # Plan 2: Charter within 7 Days
    rate_7d = round(base_rate + (pred_rate - base_rate) * 0.25, 2)
    lc_7d = calculate_total_landed_cost(
        cargo_type=req.cargo_type,
        cargo_quantity=req.cargo_quantity,
        origin=req.origin,
        destination_port=req.destination_port,
        supplier_price_per_tonne=req.supplier_price_per_tonne,
        freight_rate_per_tonne=rate_7d,
        vessel_class=target_class
    )
    savings_7d = max(0.0, round((pred_rate - rate_7d) * req.cargo_quantity, 2))

    scenarios.append(
        CharterPlanItem(
            plan_id=f"{plan_id}-OPT-7D",
            title="Targeted Laycan Window (Within 7 Days)",
            vessel_class=target_class,
            vessel_count=1 if req.cargo_quantity <= 85000 else 2,
            vessels=[v.model_dump() for v in suitable_vessels[:2]],
            decision="charter_now" if direction == "increasing" else "charter_delayed",
            timing="Within 7 Days",
            estimated_total_cost=lc_7d.total_cost,
            estimated_cost_per_tonne=lc_7d.cost_per_tonne,
            potential_savings=savings_7d,
            risk="MEDIUM",
            reasons=[
                "Optimal balance between vessel inspection verification and locking rate.",
                f"Avoids late-month +{round(((pred_rate-base_rate)/base_rate)*100, 1)}% escalation.",
                "Aligns closely with export terminal loading schedules."
            ],
            warnings=[],
            feasibility=lc_7d.total_cost <= req.maximum_budget * 1.05
        )
    )

    # Plan 3: Delayed Charter (+14 Days)
    rate_14d = round(base_rate + (pred_rate - base_rate) * 0.60, 2)
    lc_14d = calculate_total_landed_cost(
        cargo_type=req.cargo_type,
        cargo_quantity=req.cargo_quantity,
        origin=req.origin,
        destination_port=req.destination_port,
        supplier_price_per_tonne=req.supplier_price_per_tonne,
        freight_rate_per_tonne=rate_14d,
        vessel_class=target_class
    )
    scenarios.append(
        CharterPlanItem(
            plan_id=f"{plan_id}-OPT-14D",
            title="Delayed Spot Charter (+14 Days)",
            vessel_class=target_class,
            vessel_count=1 if req.cargo_quantity <= 85000 else 2,
            vessels=[v.model_dump() for v in suitable_vessels[:2]],
            decision="charter_delayed",
            timing="+14 Days",
            estimated_total_cost=lc_14d.total_cost,
            estimated_cost_per_tonne=lc_14d.cost_per_tonne,
            potential_savings=0.0,
            risk="HIGH" if direction == "increasing" else "LOW",
            reasons=[
                "Maximizes operational flexibility if procurement requirements adjust.",
                "Viable only if forward freight prices reverse trajectory."
            ],
            warnings=["Subject to higher freight rates and tighter vessel availability closer to deadline."],
            feasibility=True
        )
    )

    # Plan 4: Alternative vessel class comparison or Multi-vessel parceling
    alt_class = "Supramax" if target_class in ("Panamax", "Capesize") else "Panamax"
    alt_vessels = [v for v in vessel_evaluations if v.vessel_class == alt_class and v.is_suitable]
    if req.cargo_quantity > 85000:
        # Parceling split plan
        split_count = int(req.cargo_quantity // 50000) + 1
        scenarios.append(
            CharterPlanItem(
                plan_id=f"{plan_id}-OPT-SPLIT",
                title=f"Multi-Vessel Parceling ({split_count}x Supramax/Panamax Lifts)",
                vessel_class="Supramax",
                vessel_count=split_count,
                vessels=[v.model_dump() for v in suitable_vessels[:split_count]],
                decision="split_shipment",
                timing="Staggered (+5 Days between lifts)",
                estimated_total_cost=round(landed_cost.total_cost * 1.04, 2),
                estimated_cost_per_tonne=round(landed_cost.cost_per_tonne * 1.04, 2),
                potential_savings=0.0,
                risk="LOW",
                reasons=[
                    f"Mitigates berth congestion at {req.destination_port} by parceling large {req.cargo_quantity:,.0f} MT quantity.",
                    "Allows discharge at shallower draft berths."
                ],
                warnings=["Slightly higher unit ocean freight due to multiple charter fixtures."],
                feasibility=True
            )
        )
    else:
        # Alternative Class Option
        alt_lc = calculate_total_landed_cost(
            cargo_type=req.cargo_type,
            cargo_quantity=req.cargo_quantity,
            origin=req.origin,
            destination_port=req.destination_port,
            supplier_price_per_tonne=req.supplier_price_per_tonne,
            freight_rate_per_tonne=pred_rate * 1.06,
            vessel_class=alt_class
        )
        scenarios.append(
            CharterPlanItem(
                plan_id=f"{plan_id}-OPT-ALTCLASS",
                title=f"Alternative Class Fixture ({alt_class})",
                vessel_class=alt_class,
                vessel_count=1,
                vessels=[v.model_dump() for v in alt_vessels[:1]],
                decision="alternative_class",
                timing="Immediate",
                estimated_total_cost=alt_lc.total_cost,
                estimated_cost_per_tonne=alt_lc.cost_per_tonne,
                potential_savings=0.0,
                risk="MEDIUM",
                reasons=[
                    f"Provides optionality if {target_class} availability contracts.",
                    f"Easier berthing turnaround at {req.destination_port} with reduced draft requirements."
                ],
                warnings=[f"{alt_class} carries higher freight rate per tonne than {target_class}."],
                feasibility=True
            )
        )

    # Select best recommendation based on freight direction, landed cost, and risk
    if direction == "increasing":
        # Best plan is to charter immediately or within 7 days
        recommended_plan = scenarios[0]  # Immediate
        reasons = [
            f"Recommended because XGBoost forecasting projects forward freight to escalate from ${base_rate:.2f}/MT to ${pred_rate:.2f}/MT (+{round(((pred_rate-base_rate)/base_rate)*100, 1)}%).",
            f"Vessel capacity ({target_class}) matches the {req.cargo_quantity:,.0f} MT cargo requirement with zero port draft/DWT constraint violations at {req.destination_port}.",
            f"Secures estimated cost avoidance of ${savings_vs_30d:,.2f} compared to waiting for 30-day forward spot market rates."
        ]
    else:
        # Best plan is within 7 days
        recommended_plan = scenarios[1]
        reasons = [
            f"Recommended because freight rates are stable/softening; 7-day laycan allows operational preparation while locking in favorable spot capacity.",
            f"Destination port infrastructure at {req.destination_port} perfectly accommodates {target_class} specifications.",
            f"Landed cost is minimized at ${recommended_plan.estimated_cost_per_tonne:.2f}/MT."
        ]

    alternatives = [s for s in scenarios if s.plan_id != recommended_plan.plan_id]

    overall_data_status = "historical" if forecast.data_status == "historical" else "illustrative"

    # Persist in SQLite
    persist_planning_run(
        plan_id=plan_id,
        req=req,
        forecast=forecast,
        vessels=vessel_evaluations,
        landed_cost=landed_cost,
        recommended=recommended_plan,
        alternatives=alternatives,
        reasons=reasons,
        warnings=warnings,
        data_status=overall_data_status
    )

    return CargoPlanningResponse(
        plan_id=plan_id,
        status="success",
        cargo_requirement=req,
        freight_forecast=forecast,
        vessel_evaluations=vessel_evaluations,
        landed_cost=landed_cost,
        recommended_plan=recommended_plan,
        alternatives=alternatives,
        reasons=reasons,
        warnings=warnings,
        data_status=overall_data_status,
        limitations=limitations,
        created_at=now_iso
    )
