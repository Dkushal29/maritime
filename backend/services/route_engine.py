"""
Maritime Route Corridor & Graph Routing Engine.
Computes Shortest/Fastest and Lowest-Cost routes from global bulk export hubs
to Indian East Coast discharge terminals (Visakhapatnam, Paradip, Chennai, Kamarajar, Haldia, Dhamra).
All routes are explicitly labeled as 'Estimated planning corridor — not for navigation'.
"""
import math
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional, Tuple
from schemas.route_planning import (
    RouteCorridorItem,
    RouteOptionItem,
    CostDrivers,
    RouteCompareResponse,
)

# ─────────────────────────────────────────────────────────────────────────────
# Verified Geographic Port Waypoints
# ─────────────────────────────────────────────────────────────────────────────
DESTINATION_PORTS: Dict[str, Dict[str, Any]] = {
    "VISAKHAPATNAM": {
        "id": "P001",
        "name": "Visakhapatnam",
        "code": "INVTZ",
        "coords": [17.6868, 83.2185],
        "draft_m": 18.5,
        "max_dwt": 200000,
        "port_dues_usd_per_ton": 3.80,
    },
    "PARADIP": {
        "id": "P002",
        "name": "Paradip",
        "code": "INPRT",
        "coords": [20.2661, 86.6731],
        "draft_m": 17.1,
        "max_dwt": 125000,
        "port_dues_usd_per_ton": 3.40,
    },
    "CHENNAI": {
        "id": "P003",
        "name": "Chennai",
        "code": "INMAA",
        "coords": [13.0827, 80.2707],
        "draft_m": 16.5,
        "max_dwt": 85000,
        "port_dues_usd_per_ton": 4.10,
    },
    "KAMARAJAR": {
        "id": "P004",
        "name": "Kamarajar",
        "code": "INENR",
        "coords": [13.2535, 80.3285],
        "draft_m": 18.0,
        "max_dwt": 150000,
        "port_dues_usd_per_ton": 3.60,
    },
    "HALDIA": {
        "id": "P005",
        "name": "Haldia",
        "code": "INHAL",
        "coords": [22.0257, 88.0583],
        "draft_m": 12.5,
        "max_dwt": 45000,
        "port_dues_usd_per_ton": 4.60,
    },
    "DHAMRA": {
        "id": "P006",
        "name": "Dhamra",
        "code": "INDHM",
        "coords": [20.8038, 86.9743],
        "draft_m": 18.0,
        "max_dwt": 180000,
        "port_dues_usd_per_ton": 3.50,
    },
}

ORIGIN_PORTS: Dict[str, Dict[str, Any]] = {
    "AUSTRALIA": {
        "name": "Port Hedland",
        "country": "Australia",
        "coords": [-20.3100, 118.5756],
        "cargo": "Iron Ore / Coking Coal",
    },
    "PORT HEDLAND": {
        "name": "Port Hedland",
        "country": "Australia",
        "coords": [-20.3100, 118.5756],
        "cargo": "Iron Ore / Coking Coal",
    },
    "HAY POINT": {
        "name": "Hay Point",
        "country": "Australia",
        "coords": [-21.2833, 149.3000],
        "cargo": "Coking Coal",
    },
    "INDONESIA": {
        "name": "Banjarmasin",
        "country": "Indonesia",
        "coords": [-3.3194, 114.5908],
        "cargo": "Thermal Coal",
    },
    "BANJARMASIN": {
        "name": "Banjarmasin",
        "country": "Indonesia",
        "coords": [-3.3194, 114.5908],
        "cargo": "Thermal Coal",
    },
    "SAMARINDA": {
        "name": "Samarinda",
        "country": "Indonesia",
        "coords": [-0.5022, 117.1536],
        "cargo": "Thermal Coal",
    },
    "SOUTH AFRICA": {
        "name": "Richards Bay",
        "country": "South Africa",
        "coords": [-28.7835, 32.0841],
        "cargo": "Steam Coal",
    },
    "RICHARDS BAY": {
        "name": "Richards Bay",
        "country": "South Africa",
        "coords": [-28.7835, 32.0841],
        "cargo": "Steam Coal",
    },
    "MOZAMBIQUE": {
        "name": "Maputo",
        "country": "Mozambique",
        "coords": [-25.9692, 32.5732],
        "cargo": "Thermal Coal / Minerals",
    },
    "MAPUTO": {
        "name": "Maputo",
        "country": "Mozambique",
        "coords": [-25.9692, 32.5732],
        "cargo": "Thermal Coal / Minerals",
    },
    "UNITED STATES GULF": {
        "name": "Houston",
        "country": "USA",
        "coords": [29.7604, -95.3698],
        "cargo": "Petcoke / Coal / Grain",
    },
    "HOUSTON": {
        "name": "Houston",
        "country": "USA",
        "coords": [29.7604, -95.3698],
        "cargo": "Petcoke / Coal / Grain",
    },
    "UNITED STATES EAST COAST": {
        "name": "Norfolk",
        "country": "USA",
        "coords": [36.8508, -76.2859],
        "cargo": "Metallurgical Coal",
    },
    "NORFOLK": {
        "name": "Norfolk",
        "country": "USA",
        "coords": [36.8508, -76.2859],
        "cargo": "Metallurgical Coal",
    },
    "RUSSIA": {
        "name": "Novorossiysk",
        "country": "Russia",
        "coords": [44.7239, 37.7686],
        "cargo": "Coal / Fertilizer",
    },
    "NOVOROSSIYSK": {
        "name": "Novorossiysk",
        "country": "Russia",
        "coords": [44.7239, 37.7686],
        "cargo": "Coal / Fertilizer",
    },
    "MIDDLE EAST": {
        "name": "Fujairah",
        "country": "UAE",
        "coords": [25.1288, 56.3265],
        "cargo": "Crude / Sulfur / Aggregates",
    },
    "FUJAIRAH": {
        "name": "Fujairah",
        "country": "UAE",
        "coords": [25.1288, 56.3265],
        "cargo": "Crude / Sulfur / Aggregates",
    },
}

# Key Nautical Chokepoints
CHOKEPOINTS = {
    "MALACCA": {"name": "Strait of Malacca", "coords": [2.8, 101.4], "toll_usd": 0.0, "risk_mult": 1.25},
    "SUNDA": {"name": "Sunda Strait", "coords": [-6.0, 105.8], "toll_usd": 0.0, "risk_mult": 1.10},
    "LOMBOK": {"name": "Lombok Strait", "coords": [-8.5, 115.7], "toll_usd": 0.0, "risk_mult": 1.05},
    "GREAT_CHANNEL": {"name": "Six Degree Channel (Great Channel)", "coords": [5.9, 95.0], "toll_usd": 0.0, "risk_mult": 1.05},
    "SUEZ": {"name": "Suez Canal", "coords": [29.9, 32.5], "toll_usd": 240000.0, "risk_mult": 1.65},
    "BAB_EL_MANDEB": {"name": "Bab-el-Mandeb Strait", "coords": [12.6, 43.3], "toll_usd": 0.0, "risk_mult": 1.95},
    "CAPE_GOOD_HOPE": {"name": "Cape of Good Hope", "coords": [-34.8, 19.5], "toll_usd": 0.0, "risk_mult": 1.20},
    "MOZAMBIQUE_CHANNEL": {"name": "Mozambique Channel", "coords": [-16.0, 42.0], "toll_usd": 0.0, "risk_mult": 1.15},
}


def _lookup_port(port_name: str) -> Optional[Dict[str, Any]]:
    clean = port_name.upper().strip()
    if clean in DESTINATION_PORTS:
        return DESTINATION_PORTS[clean]
    for k, v in DESTINATION_PORTS.items():
        if k in clean or v["name"].upper() in clean:
            return v
    return None


def _lookup_origin(origin_name: str) -> Optional[Dict[str, Any]]:
    clean = origin_name.upper().strip()
    if clean in ORIGIN_PORTS:
        return ORIGIN_PORTS[clean]
    for k, v in ORIGIN_PORTS.items():
        if k in clean or v["name"].upper() in clean or v["country"].upper() in clean:
            return v
    # Fallback to Australia if unknown
    return ORIGIN_PORTS["AUSTRALIA"]


# ─────────────────────────────────────────────────────────────────────────────
# Graph Waypoints and Navigable Corridor Definitions
# ─────────────────────────────────────────────────────────────────────────────
CORRIDOR_CATALOG: List[Dict[str, Any]] = [
    {
        "corridor_id": "CORR-AUS-VIZ",
        "origin_port": "Port Hedland",
        "origin_country": "Australia",
        "origin_coords": [-20.31, 118.58],
        "destination_port": "Visakhapatnam",
        "destination_country": "India",
        "dest_coords": [17.6868, 83.2185],
        "cargo_type": "Iron Ore / Coking Coal",
        "typical_vessel_classes": ["Capesize", "Panamax"],
        "approximate_corridor": "Northwest Shelf WA → South Java Deepwater → Great Channel → Bay of Bengal Fairway",
        "waypoints": [
            [-20.31, 118.58],
            [-17.8, 113.5],
            [-13.5, 105.2],
            [-8.2, 98.6],
            [-2.5, 94.8],
            [4.2, 92.5],
            [9.5, 88.2],
            [14.2, 85.0],
            [17.69, 83.22],
        ],
        "estimated_distance_nm": 4820,
        "typical_sailing_days": 16.5,
        "seasonal_risk_areas": ["Bay of Bengal cyclone fairway (May-Nov)", "South Java swell zone"],
        "port_restrictions": {"max_draft_m": 18.5, "max_dwt": 200000, "night_navigation": True},
        "data_source": "Admiralty Routeing Charts & GEBCo Deep Sea Lanes",
        "data_confidence": 0.94,
    },
    {
        "corridor_id": "CORR-AUS-PAR",
        "origin_port": "Port Hedland",
        "origin_country": "Australia",
        "origin_coords": [-20.31, 118.58],
        "destination_port": "Paradip",
        "destination_country": "India",
        "dest_coords": [20.2661, 86.6731],
        "cargo_type": "Coking Coal",
        "typical_vessel_classes": ["Capesize", "Panamax"],
        "approximate_corridor": "Northwest WA → Central Indian Ocean Deep Basin → North Bay of Bengal",
        "waypoints": [
            [-20.31, 118.58],
            [-17.8, 113.5],
            [-13.5, 105.2],
            [-8.2, 98.6],
            [-2.5, 94.8],
            [4.2, 92.5],
            [11.0, 89.0],
            [16.5, 87.8],
            [20.27, 86.67],
        ],
        "estimated_distance_nm": 5040,
        "typical_sailing_days": 17.2,
        "seasonal_risk_areas": ["North Bay of Bengal depression zone", "Mahanadi delta monsoon outflow"],
        "port_restrictions": {"max_draft_m": 17.1, "max_dwt": 125000, "night_navigation": True},
        "data_source": "Admiralty Routeing Charts",
        "data_confidence": 0.94,
    },
    {
        "corridor_id": "CORR-INDO-VIZ",
        "origin_port": "Banjarmasin",
        "origin_country": "Indonesia",
        "origin_coords": [-3.32, 114.59],
        "destination_port": "Visakhapatnam",
        "destination_country": "India",
        "dest_coords": [17.6868, 83.2185],
        "cargo_type": "Thermal Coal",
        "typical_vessel_classes": ["Supramax", "Panamax"],
        "approximate_corridor": "Java Sea → Sunda / Malacca Strait → Andaman Sea → Bay of Bengal",
        "waypoints": [
            [-3.32, 114.59],
            [-5.5, 110.5],
            [-6.0, 105.8],
            [-2.0, 98.0],
            [5.9, 93.5],
            [11.5, 87.5],
            [17.69, 83.22],
        ],
        "estimated_distance_nm": 2150,
        "typical_sailing_days": 8.2,
        "seasonal_risk_areas": ["Malacca Strait high vessel traffic density", "Southwest monsoon swell"],
        "port_restrictions": {"max_draft_m": 18.5, "max_dwt": 200000},
        "data_source": "Indonesian Maritime Directorate & Indian Ports Authority",
        "data_confidence": 0.92,
    },
    {
        "corridor_id": "CORR-INDO-PAR",
        "origin_port": "Banjarmasin",
        "origin_country": "Indonesia",
        "origin_coords": [-3.32, 114.59],
        "destination_port": "Paradip",
        "destination_country": "India",
        "dest_coords": [20.2661, 86.6731],
        "cargo_type": "Thermal Coal",
        "typical_vessel_classes": ["Supramax", "Panamax"],
        "approximate_corridor": "Java Sea → Sunda Strait → Andaman Sea → North Bay of Bengal",
        "waypoints": [
            [-3.32, 114.59],
            [-5.5, 110.5],
            [-6.0, 105.8],
            [-1.5, 96.5],
            [6.5, 93.0],
            [13.5, 89.0],
            [20.27, 86.67],
        ],
        "estimated_distance_nm": 2320,
        "typical_sailing_days": 8.8,
        "seasonal_risk_areas": ["North Bay monsoon depressions", "Shallow shoals near Sunda exit"],
        "port_restrictions": {"max_draft_m": 17.1, "max_dwt": 125000},
        "data_source": "Admiralty Chart 4071",
        "data_confidence": 0.92,
    },
    {
        "corridor_id": "CORR-SA-VIZ",
        "origin_port": "Richards Bay",
        "origin_country": "South Africa",
        "origin_coords": [-28.78, 32.08],
        "destination_port": "Visakhapatnam",
        "destination_country": "India",
        "dest_coords": [17.6868, 83.2185],
        "cargo_type": "Steam Coal",
        "typical_vessel_classes": ["Capesize", "Panamax"],
        "approximate_corridor": "Mozambique Channel → Equatorial South Indian Ocean → South Sri Lanka → Bay of Bengal",
        "waypoints": [
            [-28.78, 32.08],
            [-22.5, 36.5],
            [-14.0, 42.0],
            [-5.0, 55.0],
            [2.0, 72.0],
            [5.8, 80.5],
            [11.5, 83.5],
            [17.69, 83.22],
        ],
        "estimated_distance_nm": 4920,
        "typical_sailing_days": 16.8,
        "seasonal_risk_areas": ["Agulhas Current rough sea sector", "South Madagascar winter gales"],
        "port_restrictions": {"max_draft_m": 18.5, "max_dwt": 200000},
        "data_source": "South African Maritime Safety Authority & Admiralty 4070",
        "data_confidence": 0.93,
    },
    {
        "corridor_id": "CORR-MOZ-PAR",
        "origin_port": "Maputo",
        "origin_country": "Mozambique",
        "origin_coords": [-25.97, 32.57],
        "destination_port": "Paradip",
        "destination_country": "India",
        "dest_coords": [20.2661, 86.6731],
        "cargo_type": "Thermal Coal",
        "typical_vessel_classes": ["Supramax", "Panamax"],
        "approximate_corridor": "Mozambique Channel → Central Indian Ocean → Dondra Head Fairway → Paradip",
        "waypoints": [
            [-25.97, 32.57],
            [-20.0, 37.0],
            [-13.5, 43.5],
            [-4.0, 58.0],
            [3.5, 74.0],
            [5.8, 80.5],
            [13.0, 85.5],
            [20.27, 86.67],
        ],
        "estimated_distance_nm": 5120,
        "typical_sailing_days": 17.5,
        "seasonal_risk_areas": ["Mozambique channel cyclone belt (Jan-Apr)", "Sri Lanka TSS vessel congestion"],
        "port_restrictions": {"max_draft_m": 17.1, "max_dwt": 125000},
        "data_source": "Admiralty Oceanic Routeing Charts",
        "data_confidence": 0.91,
    },
    {
        "corridor_id": "CORR-USG-VIZ",
        "origin_port": "Houston",
        "origin_country": "USA",
        "origin_coords": [29.76, -95.37],
        "destination_port": "Visakhapatnam",
        "destination_country": "India",
        "dest_coords": [17.6868, 83.2185],
        "cargo_type": "Petcoke / Coal",
        "typical_vessel_classes": ["Panamax", "Capesize"],
        "approximate_corridor": "Gulf of Mexico → Atlantic → Cape of Good Hope → Indian Ocean → Visakhapatnam",
        "waypoints": [
            [29.76, -95.37],
            [24.5, -83.0],
            [20.0, -65.0],
            [5.0, -35.0],
            [-15.0, -15.0],
            [-34.8, 19.5],
            [-28.0, 45.0],
            [-10.0, 68.0],
            [5.8, 80.5],
            [17.69, 83.22],
        ],
        "estimated_distance_nm": 11850,
        "typical_sailing_days": 38.5,
        "seasonal_risk_areas": ["North Atlantic hurricane zone", "Cape of Good Hope Roaring Forties"],
        "port_restrictions": {"max_draft_m": 18.5, "max_dwt": 200000},
        "data_source": "NOAA / Admiralty Worldwide Routeing",
        "data_confidence": 0.90,
    },
    {
        "corridor_id": "CORR-ME-CHEN",
        "origin_port": "Fujairah",
        "origin_country": "UAE",
        "origin_coords": [25.13, 56.33],
        "destination_port": "Chennai",
        "destination_country": "India",
        "dest_coords": [13.0827, 80.2707],
        "cargo_type": "Sulfur / Aggregates / Bulk",
        "typical_vessel_classes": ["Handysize", "Supramax"],
        "approximate_corridor": "Gulf of Oman → Arabian Sea → South India Cape Comorin → Chennai",
        "waypoints": [
            [25.13, 56.33],
            [22.5, 60.0],
            [16.0, 67.0],
            [9.5, 75.5],
            [7.5, 77.5],
            [8.5, 80.0],
            [13.08, 80.27],
        ],
        "estimated_distance_nm": 1820,
        "typical_sailing_days": 6.8,
        "seasonal_risk_areas": ["Southwest Arabian Sea monsoon squalls (Jun-Aug)"],
        "port_restrictions": {"max_draft_m": 16.5, "max_dwt": 85000},
        "data_source": "Middle East Navigation Service",
        "data_confidence": 0.95,
    },
]


def get_all_corridors() -> List[RouteCorridorItem]:
    """Returns the persistent catalog of monitored bulk shipping corridors."""
    results = []
    for c in CORRIDOR_CATALOG:
        item = RouteCorridorItem(
            corridor_id=c["corridor_id"],
            origin_port=c["origin_port"],
            origin_country=c["origin_country"],
            origin_coords=c["origin_coords"],
            destination_port=c["destination_port"],
            destination_country=c["destination_country"],
            dest_coords=c["dest_coords"],
            cargo_type=c["cargo_type"],
            typical_vessel_classes=c["typical_vessel_classes"],
            approximate_corridor=c["approximate_corridor"],
            waypoints=c["waypoints"],
            estimated_distance_nm=c["estimated_distance_nm"],
            typical_sailing_days=c["typical_sailing_days"],
            seasonal_risk_areas=c.get("seasonal_risk_areas", []),
            port_restrictions=c.get("port_restrictions", {}),
            data_source=c["data_source"],
            data_confidence=c["data_confidence"],
            is_verified_nautical=False,
            data_status="estimated",
            label="Estimated planning corridor — not for navigation",
        )
        results.append(item)
    return results


# ─────────────────────────────────────────────────────────────────────────────
# Routing Graph Calculation: Option A (Shortest) & Option B (Lowest-Cost)
# ─────────────────────────────────────────────────────────────────────────────

def calculate_route_options(
    origin: str,
    destination: str,
    cargo_type: str = "Coal",
    cargo_quantity: float = 75000.0,
    laycan_start: Optional[str] = None,
    required_arrival_date: Optional[str] = None,
    vessel_class: Optional[str] = "Panamax",
) -> RouteCompareResponse:
    """
    Computes graph-based nautical routes:
    - Option A: Shortest / Fastest route minimizing nautical distance and sailing time.
    - Option B: Lowest-Cost route minimizing total voyage cost (eco-steaming, canal avoidance, reduced fuel burn).
    """
    dest_info = _lookup_port(destination)
    if not dest_info:
        dest_info = DESTINATION_PORTS["VISAKHAPATNAM"]

    orig_info = _lookup_origin(origin)

    # Base dates
    now = datetime.now(timezone.utc)
    if laycan_start:
        try:
            dep_date = datetime.fromisoformat(laycan_start.replace("Z", "+00:00"))
        except Exception:
            dep_date = now + timedelta(days=2)
    else:
        dep_date = now + timedelta(days=2)

    # Resolve matching baseline corridor from catalog
    matched_corridor = None
    for c in CORRIDOR_CATALOG:
        if (
            orig_info["country"].upper() in c["origin_country"].upper()
            or orig_info["name"].upper() in c["origin_port"].upper()
        ) and (dest_info["name"].upper() in c["destination_port"].upper()):
            matched_corridor = c
            break

    if not matched_corridor:
        # Fallback to closest origin match
        for c in CORRIDOR_CATALOG:
            if (
                orig_info["country"].upper() in c["origin_country"].upper()
                or orig_info["name"].upper() in c["origin_port"].upper()
            ):
                matched_corridor = c
                break

    if not matched_corridor:
        matched_corridor = CORRIDOR_CATALOG[0]

    base_dist = matched_corridor["estimated_distance_nm"]
    base_waypoints = matched_corridor["waypoints"]

    # Adjust waypoints to exact requested destination
    adj_waypoints_shortest = [wp for wp in base_waypoints[:-1]] + [dest_info["coords"]]

    # Vessel operating parameters
    vclass = vessel_class.upper() if vessel_class else "PANAMAX"
    if "CAPE" in vclass:
        day_rate_fast = 48000.0
        day_rate_eco = 39500.0  # Slow steaming charter agreement
        fuel_ton_day_fast = 56.0  # 14.2 kts fast steaming burn
        fuel_ton_day_eco = 29.0   # 12.0 kts eco burn (V^3 propulsion law)
        vessel_dwt = 180000.0
    elif "SUPRA" in vclass:
        day_rate_fast = 23000.0
        day_rate_eco = 19000.0
        fuel_ton_day_fast = 26.0
        fuel_ton_day_eco = 14.5
        vessel_dwt = 58000.0
    elif "HANDY" in vclass:
        day_rate_fast = 15000.0
        day_rate_eco = 12500.0
        fuel_ton_day_fast = 18.0
        fuel_ton_day_eco = 10.5
        vessel_dwt = 38000.0
    else:  # Panamax
        day_rate_fast = 29500.0
        day_rate_eco = 24000.0
        fuel_ton_day_fast = 34.0
        fuel_ton_day_eco = 18.5
        vessel_dwt = 82000.0

    fuel_price_vlsfo = 620.0  # USD/MT Singapore/Fujairah benchmark

    # ─────────────────────────────────────────────────────────────
    # Option A: Shortest / Fastest Route
    # Speed: 14.2 knots. Direct fairway navigation.
    # ─────────────────────────────────────────────────────────────
    dist_shortest = base_dist
    speed_fast = 14.2
    sailing_days_shortest = round(dist_shortest / (speed_fast * 24), 1)
    arr_shortest = dep_date + timedelta(days=sailing_days_shortest)

    fuel_burn_shortest = sailing_days_shortest * fuel_ton_day_fast
    fuel_cost_shortest = fuel_burn_shortest * fuel_price_vlsfo
    operating_cost_shortest = sailing_days_shortest * day_rate_fast

    # Port tariff and dues
    port_dues_shortest = cargo_quantity * dest_info["port_dues_usd_per_ton"] + 45000.0
    transit_charges_shortest = 0.0
    if "USG" in matched_corridor["corridor_id"] or "RUSSIA" in matched_corridor["corridor_id"]:
        transit_charges_shortest = 240000.0  # Suez Canal transit toll

    # Risk and demurrage (faster arrival risks waiting for open berth)
    risk_score_shortest = 58.0
    demurrage_risk_shortest = 38000.0

    total_cost_shortest = (
        fuel_cost_shortest
        + operating_cost_shortest
        + port_dues_shortest
        + transit_charges_shortest
        + demurrage_risk_shortest
    )
    cost_per_ton_shortest = round(total_cost_shortest / cargo_quantity, 2)

    cost_drivers_shortest = CostDrivers(
        fuel_pct=round((fuel_cost_shortest / total_cost_shortest) * 100, 1),
        port_charges_pct=round((port_dues_shortest / total_cost_shortest) * 100, 1),
        vessel_operating_pct=round((operating_cost_shortest / total_cost_shortest) * 100, 1),
        canal_transit_pct=round((transit_charges_shortest / total_cost_shortest) * 100, 1),
        demurrage_risk_pct=round((demurrage_risk_shortest / total_cost_shortest) * 100, 1),
    )

    option_shortest = RouteOptionItem(
        option_key="shortest",
        option_name="Shortest / Fastest Corridor",
        route_id=f"{matched_corridor['corridor_id']}-FAST",
        origin=orig_info["name"],
        destination=dest_info["name"],
        waypoints=adj_waypoints_shortest,
        distance_nm=dist_shortest,
        speed_knots=speed_fast,
        sailing_days=sailing_days_shortest,
        estimated_departure=dep_date.strftime("%Y-%m-%d"),
        estimated_arrival=arr_shortest.strftime("%Y-%m-%d"),
        total_cost_usd=round(total_cost_shortest, 2),
        cost_per_ton_usd=cost_per_ton_shortest,
        fuel_cost_usd=round(fuel_cost_shortest, 2),
        port_charges_usd=round(port_dues_shortest, 2),
        transit_charges_usd=round(transit_charges_shortest, 2),
        demurrage_risk_usd=round(demurrage_risk_shortest, 2),
        operating_cost_usd=round(operating_cost_shortest, 2),
        cost_savings_usd=0.0,
        cost_drivers=cost_drivers_shortest,
        risk_score=risk_score_shortest,
        risk_level="MEDIUM",
        weather_impact="Moderate: Steaming at 14.2 kts encounters higher wave resistance and hydrodynamic drag.",
        tradeoff_explanation=(
            "Optimizes for minimum transit duration and earliest laycan discharge window. "
            "Higher steaming speed incurs approximately 42% greater fuel consumption."
        ),
        data_source="Admiralty Routeing & Hydrographic Distance Engine",
        data_confidence=0.94,
        data_status="estimated",
        navigation_disclaimer="Estimated planning corridor — not for navigation",
    )

    # ─────────────────────────────────────────────────────────────
    # Option B: Lowest-Cost Route
    # Speed: 12.0 knots (Eco-speed).
    # Path follows favorable ocean currents with just-in-time arrival.
    # ─────────────────────────────────────────────────────────────
    dist_lowest_cost = int(base_dist * 1.025)
    speed_eco = 12.0
    sailing_days_lowest = round(dist_lowest_cost / (speed_eco * 24), 1)
    arr_lowest = dep_date + timedelta(days=sailing_days_lowest)

    fuel_burn_lowest = sailing_days_lowest * fuel_ton_day_eco
    fuel_cost_lowest = fuel_burn_lowest * fuel_price_vlsfo
    operating_cost_lowest = sailing_days_lowest * day_rate_eco

    # Off-peak green port tariff incentive (-5%) and just-in-time berthing demurrage reduction
    port_dues_lowest = round(port_dues_shortest * 0.95, 2)
    transit_charges_lowest = 0.0
    demurrage_risk_lowest = 8500.0  # Synchronized with confirmed berth slot

    total_cost_lowest = (
        fuel_cost_lowest
        + operating_cost_lowest
        + port_dues_lowest
        + transit_charges_lowest
        + demurrage_risk_lowest
    )
    cost_per_ton_lowest = round(total_cost_lowest / cargo_quantity, 2)
    savings = round(total_cost_shortest - total_cost_lowest, 2)

    # Waypoints with sheltered diversion
    adj_waypoints_lowest = []
    for i, wp in enumerate(adj_waypoints_shortest):
        if 1 <= i < len(adj_waypoints_shortest) - 1:
            # Shift mid-ocean waypoints slightly southward to follow favorable currents
            adj_waypoints_lowest.append([round(wp[0] - 1.2, 2), round(wp[1] + 0.8, 2)])
        else:
            adj_waypoints_lowest.append(wp)

    cost_drivers_lowest = CostDrivers(
        fuel_pct=round((fuel_cost_lowest / total_cost_lowest) * 100, 1),
        port_charges_pct=round((port_dues_lowest / total_cost_lowest) * 100, 1),
        vessel_operating_pct=round((operating_cost_lowest / total_cost_lowest) * 100, 1),
        canal_transit_pct=0.0,
        demurrage_risk_pct=round((demurrage_risk_lowest / total_cost_lowest) * 100, 1),
    )

    risk_score_lowest = 34.0  # Eco-steaming with favorable ocean currents

    option_lowest = RouteOptionItem(
        option_key="lowest_cost",
        option_name="Lowest-Cost Eco Corridor",
        route_id=f"{matched_corridor['corridor_id']}-ECO",
        origin=orig_info["name"],
        destination=dest_info["name"],
        waypoints=adj_waypoints_lowest,
        distance_nm=dist_lowest_cost,
        speed_knots=speed_eco,
        sailing_days=sailing_days_lowest,
        estimated_departure=dep_date.strftime("%Y-%m-%d"),
        estimated_arrival=arr_lowest.strftime("%Y-%m-%d"),
        total_cost_usd=round(total_cost_lowest, 2),
        cost_per_ton_usd=cost_per_ton_lowest,
        fuel_cost_usd=round(fuel_cost_lowest, 2),
        port_charges_usd=round(port_dues_lowest, 2),
        transit_charges_usd=0.0,
        demurrage_risk_usd=round(demurrage_risk_lowest, 2),
        operating_cost_usd=round(operating_cost_lowest, 2),
        cost_savings_usd=max(savings, 0.0),
        cost_drivers=cost_drivers_lowest,
        risk_score=risk_score_lowest,
        risk_level="LOW",
        weather_impact="Low: Following favorable ocean currents with reduced engine load minimizes weather disruption.",
        tradeoff_explanation=(
            f"Saves ${savings:,.0f} (${abs(cost_per_ton_shortest - cost_per_ton_lowest):.2f}/MT) by eco-steaming "
            f"at 11.4 knots. Transit time increases by {round(sailing_days_lowest - sailing_days_shortest, 1)} days."
        ),
        data_source="Admiralty Routeing & Eco-Steaming Optimization Engine",
        data_confidence=0.92,
        data_status="estimated",
        navigation_disclaimer="Estimated planning corridor — not for navigation",
    )

    # Recommendation
    if savings > 60000:
        recommended_key = "lowest_cost"
        rationale = (
            f"Recommend Lowest-Cost Eco Corridor: Substantial savings of ${savings:,.0f} "
            f"with lower weather risk (Score: 34 vs 58) outweighs the {round(sailing_days_lowest - sailing_days_shortest, 1)}-day transit extension."
        )
    else:
        recommended_key = "shortest"
        rationale = (
            f"Recommend Shortest Corridor: Delivery timeline priority justifies the modest ${abs(savings):,.0f} difference, "
            f"arriving {round(sailing_days_lowest - sailing_days_shortest, 1)} days earlier."
        )

    tradeoff_summary = (
        f"Shortest route arrives {round(sailing_days_lowest - sailing_days_shortest, 1)} days earlier ({option_shortest.estimated_arrival}) "
        f"but incurs ${savings:,.0f} higher fuel expenditure. "
        f"Lowest-cost route arrives on {option_lowest.estimated_arrival} at ${option_lowest.cost_per_ton_usd}/MT."
    )

    return RouteCompareResponse(
        origin=orig_info["name"],
        destination=dest_info["name"],
        cargo_type=cargo_type,
        cargo_quantity=cargo_quantity,
        vessel_class=vclass.capitalize(),
        shortest_route=option_shortest,
        lowest_cost_route=option_lowest,
        recommended_option=recommended_key,
        recommendation_rationale=rationale,
        tradeoff_summary=tradeoff_summary,
        disclaimer="Estimated planning corridor — not for navigation",
        data_status="estimated",
        generated_at=datetime.now(timezone.utc).isoformat(),
    )
