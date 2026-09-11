"""
Pydantic schemas for Simulated Bulk Cargo Procurement Orders.
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class ProcurementOrderCreateRequest(BaseModel):
    commodity: str = Field(default="Coal", description="Commodity type, e.g. Coal, Iron Ore, Grain")
    quantity_tons: float = Field(default=50.0, ge=0.1, description="Required bulk volume in metric tons")
    grade: Optional[str] = Field(default="Thermal Coal", description="Quality/grade specification (e.g. Thermal Coal, Coking Coal, PCI)")
    origin: str = Field(default="Local Regional Depot (Visakhapatnam)", description="Source origin location or port")
    destination: str = Field(default="Visakhapatnam Steel Complex", description="Final discharge terminal or plant site")
    required_delivery_date: str = Field(default="2026-09-25", description="Target delivery date (YYYY-MM-DD)")
    budget_usd: Optional[float] = Field(default=10000.0, ge=0.0, description="Available procurement budget in USD")
    current_inventory_tons: float = Field(default=20.0, ge=0.0, description="Current on-hand stockpile inventory in tons")
    safety_stock_tons: float = Field(default=30.0, ge=0.0, description="Required safety buffer stockpile in tons")
    forecast_demand_tons: Optional[float] = Field(default=40.0, ge=0.0, description="Forecasted operational consumption in tons")
    supplier_name: Optional[str] = Field(default="East Coast Regional Coal Depot", description="Preferred or nominated supplier")
    notes: Optional[str] = Field(default=None, description="Special handling or laycan instructions")


class ProcurementEstimateResponse(BaseModel):
    commodity: str
    grade: str
    quantity_tons: float
    calculated_procurement_quantity: float
    unit_cargo_price_usd: float
    estimated_cargo_cost_usd: float
    unit_freight_price_usd: float
    estimated_freight_cost_usd: float
    unit_handling_price_usd: float
    estimated_handling_cost_usd: float
    estimated_total_cost_usd: float
    recommended_transport_mode: str
    estimated_delivery_days: int
    risk_level: str
    explanation: str
    is_simulated: bool = True
    disclaimer: str = "Simulated Procurement Order — Decision Support & Demonstration Estimate Only"


class ProcurementOrderResponse(BaseModel):
    order_id: str
    order_status: str
    commodity: str
    grade: str
    quantity_tons: float
    calculated_procurement_quantity: float
    origin: str
    destination: str
    required_delivery_date: str
    budget_usd: Optional[float]
    supplier_name: Optional[str]
    estimated_cargo_cost_usd: float
    estimated_freight_cost_usd: float
    estimated_handling_cost_usd: float
    estimated_total_cost_usd: float
    recommended_transport_mode: str
    estimated_delivery_days: int
    risk_level: str
    explanation: str
    notes: Optional[str]
    created_timestamp: str
    is_simulated: bool = True
    disclaimer: str = "Simulated Procurement Order — Decision Support & Demonstration Estimate Only"


class ProcurementOrderStatusUpdateRequest(BaseModel):
    order_status: str = Field(..., description="Draft, Submitted, Supplier Confirmation Pending, Approved, Dispatched, Delivered, Cancelled")
