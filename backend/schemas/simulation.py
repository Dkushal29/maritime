"""
Pydantic schemas for What-If Simulation endpoints.
"""
from pydantic import BaseModel, Field
from typing import Optional


class SimulationRequest(BaseModel):
    bunker_price: float = Field(default=620.0, description="VLSFO Bunker price in USD/MT")
    port_congestion: str = Field(default="Medium", description="Port congestion level (Low, Medium, High)")
    cargo_demand: int = Field(default=230000, description="Cargo volume in MT")
    vessel_availability: str = Field(default="Medium", description="Regional vessel availability (Low, Medium, High)")
    commodity_price: float = Field(default=120.0, description="Commodity price in USD/MT")
    delivery_deadline: Optional[str] = Field(default="2026-10-15")


class SimulationResponse(BaseModel):
    current_freight_rate: float
    current_total_cost: int
    current_risk: str
    simulated_freight_rate: float
    simulated_total_cost: int
    simulated_risk: str
    freight_change: float
    cost_change: int
    risk_change: str
    potential_cost_avoided: int
    ai_recommendation: str
    data_mode: str = "DEMO"
