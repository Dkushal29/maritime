"""
Vessel data service with deterministic suitability scoring.
"""
import os
import pandas as pd
from typing import List, Dict, Any, Optional
from datetime import datetime

DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "raw", "vessels.csv")


def load_vessels_df() -> pd.DataFrame:
    if os.path.exists(DATA_PATH):
        return pd.read_csv(DATA_PATH)
    return pd.DataFrame()


def calculate_suitability_score(
    vessel: Dict[str, Any],
    target_dwt: int = 80000,
    target_route: str = "Australia → Visakhapatnam",
    deadline_date: str = "2026-10-15"
) -> Dict[str, Any]:
    """
    Computes deterministic vessel suitability score (0-100):
      - Capacity fit: 30%
      - Route fit: 20%
      - Cost efficiency: 20%
      - Availability: 15%
      - ETA compatibility: 15%
    """
    dwt = float(vessel.get("dwt", 75000))
    # Capacity fit: how close DWT is to target DWT
    dwt_ratio = min(dwt, target_dwt) / max(dwt, target_dwt)
    capacity_fit = int(round(dwt_ratio * 100))

    # Route fit: if current route matches or destination in port compatibility
    route = str(vessel.get("route", ""))
    ports = [p.strip() for p in str(vessel.get("port_compatibility", "")).split(",")]
    if target_route in route:
        route_fit = 95
    elif any(p in target_route for p in ports):
        route_fit = 88
    else:
        route_fit = 70

    # Cost efficiency: charter rate per day normalized (20k - 30k range)
    daily_rate = float(vessel.get("charter_rate_per_day", 28000))
    if daily_rate <= 22000:
        cost_eff = 96
    elif daily_rate <= 26000:
        cost_eff = 92
    elif daily_rate <= 29000:
        cost_eff = 89
    else:
        cost_eff = 78

    # Availability score
    avail = str(vessel.get("availability", "Available"))
    if avail == "Available":
        avail_score = 100
    elif avail == "In Transit":
        avail_score = 65
    elif avail == "Reserved":
        avail_score = 40
    else:
        avail_score = 10

    # ETA compatibility: check if ETA <= deadline
    eta_str = str(vessel.get("eta", "2026-09-20"))
    try:
        eta_dt = datetime.strptime(eta_str, "%Y-%m-%d")
        deadline_dt = datetime.strptime(deadline_date, "%Y-%m-%d")
        days_margin = (deadline_dt - eta_dt).days
        if days_margin >= 15:
            eta_score = 98
        elif days_margin >= 7:
            eta_score = 92
        elif days_margin >= 0:
            eta_score = 80
        else:
            eta_score = 25
    except Exception:
        eta_score = 85

    total_score = int(round(
        0.30 * capacity_fit +
        0.20 * route_fit +
        0.20 * cost_eff +
        0.15 * avail_score +
        0.15 * eta_score
    ))

    status = "Recommended" if total_score >= 88 else "Standard" if total_score >= 75 else "High Cost" if cost_eff < 80 else "Busy"

    return {
        "score": total_score,
        "status": status,
        "breakdown": {
            "capacity_fit": capacity_fit,
            "route_fit": route_fit,
            "cost_efficiency": cost_eff,
            "availability": avail_score,
            "eta_compatibility": eta_score
        }
    }


def get_all_vessels(
    vtype: Optional[str] = None,
    route: Optional[str] = None,
    availability: Optional[str] = None,
    min_dwt: Optional[int] = None,
    max_dwt: Optional[int] = None
) -> List[Dict[str, Any]]:
    df = load_vessels_df()
    if df.empty:
        return []

    if vtype and vtype.upper() != "ALL":
        df = df[df["type"].str.upper() == vtype.upper()]
    if availability and availability.upper() != "ALL":
        df = df[df["availability"].str.upper() == availability.upper()]
    if min_dwt is not None:
        df = df[df["dwt"] >= min_dwt]
    if max_dwt is not None:
        df = df[df["dwt"] <= max_dwt]
    if route:
        df = df[df["route"].str.contains(route, case=False, na=False)]

    results = []
    for _, row in df.iterrows():
        v_dict = row.to_dict()
        ports = [p.strip() for p in str(v_dict.get("port_compatibility", "")).split(",") if p.strip()]
        suitability = calculate_suitability_score(v_dict)
        
        v_dict["port_compatibility"] = ports
        v_dict["score"] = suitability["score"]
        v_dict["status"] = suitability["status"]
        v_dict["breakdown"] = suitability["breakdown"]
        results.append(v_dict)

    # Sort by suitability score descending
    results.sort(key=lambda x: x["score"], reverse=True)
    return results


def get_vessel_by_id(vessel_id: str) -> Optional[Dict[str, Any]]:
    vessels = get_all_vessels()
    for v in vessels:
        if v["id"].upper() == vessel_id.upper():
            return v
    return None
