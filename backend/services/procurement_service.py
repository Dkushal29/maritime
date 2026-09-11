"""
Procurement Order and Logistics Estimation Service.
Provides deterministic cost, logistics mode, and simulated order management for bulk commodities.
"""
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import uuid
from schemas.procurement import (
    ProcurementOrderCreateRequest,
    ProcurementOrderResponse,
    ProcurementEstimateResponse,
)

# Commodity base pricing benchmarks in USD per Metric Ton
COMMODITY_PRICING: Dict[str, Dict[str, float]] = {
    "Coal": {
        "Thermal Coal": 115.0,
        "Coking Coal": 215.0,
        "PCI Coal": 155.0,
        "Anthracite": 180.0,
        "default": 125.0,
    },
    "Iron Ore": {
        "62% Fe Fines": 108.0,
        "65% Fe Pellets": 135.0,
        "Lump Ore": 122.0,
        "default": 110.0,
    },
    "Grain": {
        "Milling Wheat": 240.0,
        "Feed Barley": 210.0,
        "Corn": 195.0,
        "default": 220.0,
    },
    "Bauxite": {
        "Refractory Grade": 65.0,
        "Metallurgical Grade": 52.0,
        "default": 58.0,
    },
}


def calculate_procurement_quantity(
    forecast_demand: float,
    safety_stock: float,
    current_inventory: float,
) -> float:
    """
    Calculates required procurement buffer:
    Procurement Quantity = Forecast Demand + Safety Stock - Current Inventory.
    Guaranteed non-negative.
    """
    qty = forecast_demand + safety_stock - current_inventory
    return max(0.0, round(qty, 2))


def evaluate_procurement_estimate(
    commodity: str,
    grade: Optional[str],
    quantity_tons: float,
    forecast_demand: float = 0.0,
    safety_stock: float = 0.0,
    current_inventory: float = 0.0,
    origin: str = "Local Regional Depot",
    destination: str = "Visakhapatnam Steel Complex",
) -> Dict[str, Any]:
    """
    Determines optimal transport mode, freight rates, handling charges, and risk level.
    Distinguishes micro/small-lot shipments (e.g. 50 tons) from full ocean charters.
    """
    calc_qty = calculate_procurement_quantity(forecast_demand, safety_stock, current_inventory)
    effective_qty = quantity_tons if quantity_tons > 0 else (calc_qty if calc_qty > 0 else 50.0)

    # Resolve commodity unit price
    comm_family = COMMODITY_PRICING.get(commodity, COMMODITY_PRICING["Coal"])
    selected_grade = grade or "Thermal Coal"
    unit_cargo_price = comm_family.get(selected_grade, comm_family.get("default", 125.0))

    # Transport mode resolution based on bulk quantity
    if effective_qty <= 100.0:
        transport_mode = "Truck transportation (Multi-Axle Bulk Tipper)"
        unit_freight = 22.50
        unit_handling = 7.50
        est_days = 2
        risk_level = "LOW"
        explanation = (
            f"For micro-lot bulk requirement of {effective_qty:.0f} tons, ocean bulk carriers are economically unfeasible "
            "(minimum ocean bulker fixture is 10,000+ DWT). Recommended transport mode is Local Truck Transportation "
            "via regional stockyard dispatch with 24-48 hour delivery to plant gates."
        )
    elif effective_qty < 500.0:
        transport_mode = "Warehouse dispatch (Consolidated Heavy Tipper Fleet)"
        unit_freight = 24.00
        unit_handling = 8.00
        est_days = 3
        risk_level = "LOW"
        explanation = (
            f"For small batch procurement of {effective_qty:.0f} tons, road transport via consolidated multi-truck "
            "dispatch from regional terminal buffer minimizes demurrage and delivers within 72 hours."
        )
    elif effective_qty < 10000.0:
        transport_mode = "Consolidated shipment (Dedicated Rail Rake / Coastal Barge Parcel)"
        unit_freight = 26.50
        unit_handling = 9.00
        est_days = 6
        risk_level = "MEDIUM"
        explanation = (
            f"For intermediate parcel size of {effective_qty:,.0f} tons, a dedicated Indian Railways BOXN freight rake "
            "or coastal barge parcel achieves superior landed cost efficiency over long-haul road carriage."
        )
    elif effective_qty < 60000.0:
        transport_mode = "Ocean Bulk Carrier (Supramax / Ultramax Bulker)"
        unit_freight = 30.50
        unit_handling = 8.50
        est_days = 14
        risk_level = "MEDIUM"
        explanation = (
            f"Commercial ocean parcel of {effective_qty:,.0f} tons. Supramax gear-and-grab vessel fixture recommended "
            "with self-discharge capability across East Coast Indian anchorages."
        )
    else:
        transport_mode = "Ocean Bulk Carrier (Panamax / Capesize Bulker)"
        unit_freight = 31.80
        unit_handling = 8.50
        est_days = 16
        risk_level = "MEDIUM"
        explanation = (
            f"Heavy industrial import laycan of {effective_qty:,.0f} tons. Suitable for deepwater gearless Panamax fixture "
            "from Australia or Indonesia with mechanized berth discharge at Visakhapatnam or Paradip."
        )

    cargo_cost = round(effective_qty * unit_cargo_price, 2)
    freight_cost = round(effective_qty * unit_freight, 2)
    handling_cost = round(effective_qty * unit_handling, 2)
    total_cost = round(cargo_cost + freight_cost + handling_cost, 2)

    return {
        "commodity": commodity,
        "grade": selected_grade,
        "quantity_tons": effective_qty,
        "calculated_procurement_quantity": calc_qty,
        "unit_cargo_price_usd": unit_cargo_price,
        "estimated_cargo_cost_usd": cargo_cost,
        "unit_freight_price_usd": unit_freight,
        "estimated_freight_cost_usd": freight_cost,
        "unit_handling_price_usd": unit_handling,
        "estimated_handling_cost_usd": handling_cost,
        "estimated_total_cost_usd": total_cost,
        "recommended_transport_mode": transport_mode,
        "estimated_delivery_days": est_days,
        "risk_level": risk_level,
        "explanation": explanation,
        "is_simulated": True,
        "disclaimer": "Simulated Procurement Order — Decision Support & Demonstration Estimate Only",
    }


# In-Memory Store for Demonstration Procurement Orders
_ORDERS_STORE: Dict[str, Dict[str, Any]] = {}
_ORDER_COUNTER = 100


def _seed_initial_orders():
    """Seeds initial demonstration orders for immediate dashboard display."""
    global _ORDER_COUNTER
    if _ORDERS_STORE:
        return

    sample_orders = [
        {
            "commodity": "Coal",
            "grade": "Thermal Coal",
            "quantity_tons": 50.0,
            "origin": "Local Regional Depot (Visakhapatnam)",
            "destination": "Visakhapatnam Power Plant Unit #3",
            "required_delivery_date": "2026-09-18",
            "budget_usd": 8500.0,
            "current_inventory_tons": 25.0,
            "safety_stock_tons": 35.0,
            "forecast_demand_tons": 40.0,
            "supplier_name": "Adani Regional Coal Stockyard",
            "notes": "Urgent top-up dispatch to avoid boiler derating.",
            "order_status": "Submitted",
            "created_timestamp": "2026-09-11 08:30:00 UTC",
        },
        {
            "commodity": "Coal",
            "grade": "Coking Coal",
            "quantity_tons": 2800.0,
            "origin": "Paradip Mechanized Stockpile",
            "destination": "Rourkela Steel Secondary Hopper",
            "required_delivery_date": "2026-09-28",
            "budget_usd": 680000.0,
            "current_inventory_tons": 1200.0,
            "safety_stock_tons": 2000.0,
            "forecast_demand_tons": 2000.0,
            "supplier_name": "Tata International Raw Materials",
            "notes": "Dedicated 58-wagon BOXN rail rake booking.",
            "order_status": "Approved",
            "created_timestamp": "2026-09-10 14:15:00 UTC",
        },
        {
            "commodity": "Coal",
            "grade": "Coking Coal",
            "quantity_tons": 75000.0,
            "origin": "Hay Point, Australia",
            "destination": "Visakhapatnam Port",
            "required_delivery_date": "2026-10-15",
            "budget_usd": 19500000.0,
            "current_inventory_tons": 45000.0,
            "safety_stock_tons": 60000.0,
            "forecast_demand_tons": 60000.0,
            "supplier_name": "BHP Mitsubishi Alliance (BMA)",
            "notes": "Standard Panamax laycan charter optimization link.",
            "order_status": "Supplier Confirmation Pending",
            "created_timestamp": "2026-09-09 11:00:00 UTC",
        },
    ]

    for item in sample_orders:
        _ORDER_COUNTER += 1
        oid = f"ORD-2026-{_ORDER_COUNTER:03d}"
        est = evaluate_procurement_estimate(
            commodity=item["commodity"],
            grade=item["grade"],
            quantity_tons=item["quantity_tons"],
            forecast_demand=item["forecast_demand_tons"],
            safety_stock=item["safety_stock_tons"],
            current_inventory=item["current_inventory_tons"],
            origin=item["origin"],
            destination=item["destination"],
        )
        _ORDERS_STORE[oid] = {
            "order_id": oid,
            "order_status": item["order_status"],
            "commodity": item["commodity"],
            "grade": item["grade"],
            "quantity_tons": item["quantity_tons"],
            "calculated_procurement_quantity": est["calculated_procurement_quantity"],
            "origin": item["origin"],
            "destination": item["destination"],
            "required_delivery_date": item["required_delivery_date"],
            "budget_usd": item["budget_usd"],
            "supplier_name": item["supplier_name"],
            "estimated_cargo_cost_usd": est["estimated_cargo_cost_usd"],
            "estimated_freight_cost_usd": est["estimated_freight_cost_usd"],
            "estimated_handling_cost_usd": est["estimated_handling_cost_usd"],
            "estimated_total_cost_usd": est["estimated_total_cost_usd"],
            "recommended_transport_mode": est["recommended_transport_mode"],
            "estimated_delivery_days": est["estimated_delivery_days"],
            "risk_level": est["risk_level"],
            "explanation": est["explanation"],
            "notes": item["notes"],
            "created_timestamp": item["created_timestamp"],
            "is_simulated": True,
            "disclaimer": "Simulated Procurement Order — Decision Support & Demonstration Estimate Only",
        }


def create_procurement_order(payload: ProcurementOrderCreateRequest) -> Dict[str, Any]:
    """Creates a new simulated procurement order with deterministic pricing and logistics."""
    global _ORDER_COUNTER
    _seed_initial_orders()

    _ORDER_COUNTER += 1
    order_id = f"ORD-2026-{_ORDER_COUNTER:03d}"

    est = evaluate_procurement_estimate(
        commodity=payload.commodity,
        grade=payload.grade,
        quantity_tons=payload.quantity_tons,
        forecast_demand=payload.forecast_demand_tons or payload.quantity_tons,
        safety_stock=payload.safety_stock_tons,
        current_inventory=payload.current_inventory_tons,
        origin=payload.origin,
        destination=payload.destination,
    )

    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    order_record = {
        "order_id": order_id,
        "order_status": "Draft",
        "commodity": payload.commodity,
        "grade": est["grade"],
        "quantity_tons": payload.quantity_tons,
        "calculated_procurement_quantity": est["calculated_procurement_quantity"],
        "origin": payload.origin,
        "destination": payload.destination,
        "required_delivery_date": payload.required_delivery_date,
        "budget_usd": payload.budget_usd,
        "supplier_name": payload.supplier_name,
        "estimated_cargo_cost_usd": est["estimated_cargo_cost_usd"],
        "estimated_freight_cost_usd": est["estimated_freight_cost_usd"],
        "estimated_handling_cost_usd": est["estimated_handling_cost_usd"],
        "estimated_total_cost_usd": est["estimated_total_cost_usd"],
        "recommended_transport_mode": est["recommended_transport_mode"],
        "estimated_delivery_days": est["estimated_delivery_days"],
        "risk_level": est["risk_level"],
        "explanation": est["explanation"],
        "notes": payload.notes,
        "created_timestamp": now_str,
        "is_simulated": True,
        "disclaimer": "Simulated Procurement Order — Decision Support & Demonstration Estimate Only",
    }

    _ORDERS_STORE[order_id] = order_record
    return order_record


def get_all_procurement_orders() -> List[Dict[str, Any]]:
    """Returns all simulated procurement orders, newest first."""
    _seed_initial_orders()
    # Sort by order_id descending
    return sorted(_ORDERS_STORE.values(), key=lambda x: x["order_id"], reverse=True)


def get_procurement_order_by_id(order_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves a single order by ID."""
    _seed_initial_orders()
    return _ORDERS_STORE.get(order_id)


def update_procurement_order_status(order_id: str, new_status: str) -> Optional[Dict[str, Any]]:
    """Updates the status of an existing order."""
    _seed_initial_orders()
    order = _ORDERS_STORE.get(order_id)
    if not order:
        return None
    order["order_status"] = new_status
    return order
