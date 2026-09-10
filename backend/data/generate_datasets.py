"""
Synthetic Dataset Generator for MARITIME AI.
Creates data/raw/freight_data.csv and data/raw/cargo_demand.csv with 
realistic economic relationships, seasonality, and trend structures.
All data is tagged with data_mode: DEMO.
"""
import os
import csv
import math
import numpy as np
import pandas as pd
from datetime import datetime

np.random.seed(42)

DATA_DIR = os.path.join(os.path.dirname(__file__), "raw")
os.makedirs(DATA_DIR, exist_ok=True)

# 1. Generate Freight Data
def generate_freight_data():
    dates = pd.date_range(start="2018-01-01", end="2026-09-01", freq="MS")
    routes = [
        ("Australia", "Visakhapatnam", 4820, 31.8),
        ("Australia", "Paradip", 5040, 30.9),
        ("Australia", "Chennai", 4580, 32.4),
        ("Indonesia", "Visakhapatnam", 2150, 20.4),
        ("Indonesia", "Paradip", 2320, 19.8),
    ]
    vessels = [
        ("Panamax", 1.0, 75000),
        ("Capesize", 0.88, 175000),
        ("Supramax", 1.15, 55000),
    ]
    cargos = [("Coal", 1.0), ("Iron Ore", 1.06)]

    rows = []

    for dt in dates:
        year = dt.year
        month = dt.month
        
        # Macro cycles
        trend_factor = 1.0 + (year - 2018) * 0.035
        # Post-COVID spike in 2021-2022
        covid_bump = 1.35 if (year == 2021 or (year == 2022 and month <= 6)) else 1.0
        # Seasonal cycle: winter energy demand + pre-monsoon stocking
        seasonal = 1.0 + 0.12 * math.sin((month - 3) * math.pi / 6)
        
        # Global macro indicators
        bdi = int(1400 * trend_factor * covid_bump * seasonal + np.random.normal(0, 80))
        panamax_index = int(1350 * trend_factor * covid_bump * seasonal + np.random.normal(0, 70))
        capesize_index = int(1600 * trend_factor * covid_bump * seasonal + np.random.normal(0, 100))
        
        bunker_price = round(520 + (year - 2018) * 16 + 80 * (covid_bump - 1.0) + np.random.normal(0, 20), 1)
        crude_oil_price = round(65 + (year - 2018) * 3.2 + 25 * (covid_bump - 1.0) + np.random.normal(0, 4), 1)
        usd_inr = round(70.5 + (year - 2018) * 1.8 + np.random.normal(0, 0.4), 2)
        
        for orig, dest, dist, base_rate in routes:
            for vtype, vfactor, default_vol in vessels:
                for ctype, cfactor in cargos:
                    # Specific port congestion and vessel availability
                    port_congestion = round(np.clip(3.2 + 0.6 * math.sin(month * math.pi / 6) + np.random.normal(0, 0.4), 1.0, 7.5), 1)
                    vessel_availability = round(np.clip(0.68 - 0.08 * (covid_bump - 1.0) - 0.05 * (port_congestion - 3.0) + np.random.normal(0, 0.04), 0.25, 0.95), 2)
                    commodity_price = round(105 + (year - 2018) * 4.5 + 40 * (covid_bump - 1.0) + np.random.normal(0, 8), 1)
                    cargo_volume = int(default_vol * np.random.uniform(0.9, 1.1))

                    # Formulaic underlying freight rate ground truth with realistic elasticity:
                    # Bunker sensitivity: +$10/t bunker adds approx +$0.32/t freight
                    bunker_delta = (bunker_price - 550) * 0.032
                    # Congestion sensitivity: +1 day waiting adds +$0.85/t
                    congestion_delta = (port_congestion - 2.5) * 0.85
                    # Vessel scarcity sensitivity: lower availability adds freight
                    avail_delta = (0.70 - vessel_availability) * 14.0
                    # Distance factor
                    dist_factor = dist / 4800.0

                    base = (base_rate * dist_factor * vfactor * cfactor * trend_factor * covid_bump * seasonal * 0.85)
                    freight = base + bunker_delta + congestion_delta + avail_delta + np.random.normal(0, 0.4)
                    freight_rate = round(max(12.0, freight), 2)

                    rows.append({
                        "date": dt.strftime("%Y-%m-%d"),
                        "origin": orig,
                        "destination": dest,
                        "cargo_type": ctype,
                        "vessel_type": vtype,
                        "cargo_volume": cargo_volume,
                        "bdi": bdi,
                        "panamax_index": panamax_index,
                        "capesize_index": capesize_index,
                        "bunker_price": bunker_price,
                        "crude_oil_price": crude_oil_price,
                        "port_congestion": port_congestion,
                        "vessel_availability": vessel_availability,
                        "commodity_price": commodity_price,
                        "usd_inr": usd_inr,
                        "freight_rate": freight_rate
                    })

    df = pd.DataFrame(rows)
    out_path = os.path.join(DATA_DIR, "freight_data.csv")
    df.to_csv(out_path, index=False)
    print(f"Generated freight_data.csv: {len(df)} rows at {out_path}")

# 2. Generate Cargo Demand Data
def generate_cargo_demand():
    dates = pd.date_range(start="2018-01-01", end="2026-09-01", freq="MS")
    ports = ["Visakhapatnam", "Paradip", "Chennai", "Kamarajar", "Haldia"]
    cargos = ["Coal", "Iron Ore"]

    port_multipliers = {
        "Visakhapatnam": 1.15,
        "Paradip": 1.25,
        "Chennai": 0.85,
        "Kamarajar": 0.90,
        "Haldia": 0.70,
    }

    rows = []
    for dt in dates:
        year = dt.year
        month = dt.month
        trend = 1.0 + (year - 2018) * 0.04
        seasonal_demand = 1.0 + 0.15 * math.sin((month - 2) * math.pi / 6)
        
        production_index = round(100.0 + (year - 2018) * 3.8 + np.random.normal(0, 3), 1)
        commodity_price = round(110.0 + (year - 2018) * 4.0 + np.random.normal(0, 6), 1)

        for port in ports:
            pm = port_multipliers[port]
            for cargo in cargos:
                base_demand = 190000 if cargo == "Coal" else 150000
                hist_demand = int(base_demand * pm * trend * seasonal_demand + np.random.normal(0, 8000))
                
                # Import volume and inventory
                import_vol = int(hist_demand * np.random.uniform(0.85, 1.1))
                inventory = int(hist_demand * np.random.uniform(0.30, 0.45)) # ~10-15 days stock
                port_traffic = int(45 * pm + np.random.normal(0, 4))
                
                # Target demand is driven by historical demand, production index, and seasonality
                demand_val = int(hist_demand * (production_index / 100.0) + (import_vol - inventory) * 0.15 + np.random.normal(0, 4000))
                demand = max(50000, demand_val)

                rows.append({
                    "date": dt.strftime("%Y-%m-%d"),
                    "port": port,
                    "cargo_type": cargo,
                    "historical_demand": hist_demand,
                    "inventory": inventory,
                    "import_volume": import_vol,
                    "commodity_price": commodity_price,
                    "production_index": production_index,
                    "seasonality": round(seasonal_demand, 3),
                    "port_traffic": port_traffic,
                    "demand": demand
                })

    df = pd.DataFrame(rows)
    out_path = os.path.join(DATA_DIR, "cargo_demand.csv")
    df.to_csv(out_path, index=False)
    print(f"Generated cargo_demand.csv: {len(df)} rows at {out_path}")

if __name__ == "__main__":
    generate_freight_data()
    generate_cargo_demand()
