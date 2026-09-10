"""
Risk evaluation engine for freight market and vessel chartering operations.
Computes deterministic risk score (0-100) and category (LOW, MEDIUM, HIGH)
based on measurable market indicators.
"""
from typing import Dict, List, Any


def evaluate_market_risk(
    freight_rate_change_pct: float,
    vessel_availability: float,
    port_congestion_days: float,
    inventory_coverage_days: int = 25,
    days_to_deadline: int = 30
) -> Dict[str, Any]:
    """
    Computes deterministic risk score:
      - Freight Volatility factor (0-30 pts)
      - Port Congestion factor (0-25 pts)
      - Vessel Scarcity factor (0-25 pts)
      - Buffer & Inventory factor (0-20 pts)
    """
    factors = []
    score = 0.0

    # 1. Freight Rate Volatility
    if freight_rate_change_pct > 15.0:
        score += 30.0
        factors.append(f"Severe freight escalation expected (+{freight_rate_change_pct:.1f}%)")
    elif freight_rate_change_pct > 8.0:
        score += 20.0
        factors.append(f"Moderate freight increase forecast (+{freight_rate_change_pct:.1f}%)")
    elif freight_rate_change_pct > 2.0:
        score += 10.0
        factors.append(f"Mild freight upward trend (+{freight_rate_change_pct:.1f}%)")
    else:
        score += 4.0
        factors.append("Freight rates relatively stable or soft")

    # 2. Port Congestion
    if port_congestion_days > 4.5:
        score += 25.0
        factors.append(f"High discharge port congestion ({port_congestion_days:.1f} days waiting)")
    elif port_congestion_days > 3.0:
        score += 16.0
        factors.append(f"Moderate port delay risk ({port_congestion_days:.1f} days average waiting)")
    else:
        score += 5.0
        factors.append(f"Normal port turn-around ({port_congestion_days:.1f} days waiting)")

    # 3. Vessel Availability
    if vessel_availability < 0.40:
        score += 25.0
        factors.append("Critically tight regional open vessel tonnage")
    elif vessel_availability < 0.60:
        score += 15.0
        factors.append("Restricted prompt vessel availability in Bay of Bengal")
    else:
        score += 5.0
        factors.append("Adequate vessel fleet availability")

    # 4. Inventory Coverage & Buffer
    if inventory_coverage_days < 14:
        score += 20.0
        factors.append(f"Critical stock depletion risk ({inventory_coverage_days} days coverage remaining)")
    elif inventory_coverage_days < 21:
        score += 12.0
        factors.append(f"Low inventory buffer ({inventory_coverage_days} days coverage)")
    else:
        score += 4.0
        factors.append("Healthy inventory safety stock buffer")

    # Categorization
    if score >= 65.0:
        level = "HIGH"
    elif score >= 35.0:
        level = "MEDIUM"
    else:
        level = "LOW"

    return {
        "risk_level": level,
        "risk_score": int(round(score)),
        "risk_factors": factors
    }
