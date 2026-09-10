"""
Pydantic schemas for Route analytics endpoints.
"""
from pydantic import BaseModel
from typing import List


class RouteItem(BaseModel):
    id: str
    origin: str
    destination: str
    distance_nm: int
    transit_days: float
    average_freight: float
    port_congestion: str
    risk: str
    landed_cost: float
    origin_coords: List[float]
    dest_coords: List[float]
    is_recommended: bool
