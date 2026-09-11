# MARITIME AI — Route Planning, Risk Routing, Berth Allotment & Booking Audit

**Document Version:** 1.0.0  
**Audit Date:** September 2026  
**System Status:** Operational / Verified  
**Classification:** Strategic Planning & Decision Support System  

> [!IMPORTANT]
> **LEGAL & REGULATORY DISCLAIMER**  
> This application is a **commercial supply-chain planning and decision-support system**. It is **NOT** an ECDIS (Electronic Chart Display and Information System) and is **NOT certified for SOLAS (Safety of Life at Sea) maritime navigation**. All waypoints, sea-lane coordinates, arrival times, weather alerts, and cost projections are generated for strategic logistics evaluation and must never be used for primary vessel navigation or passage planning at sea.

---

## 1. System Architecture & Route Data Sources

### Supported Corridors
The routing engine models 8+ persistent dry-bulk shipping corridors connecting major global export basins to the East Coast of India:

| Corridor ID | Origin Region | Origin Port | Discharge Port | Primary Cargo | Approximate NM | Baseline Days |
|---|---|---|---|---|---|---|
| `CORR-AU-VIZ` | Australia (Pilbara) | Port Hedland | Visakhapatnam | Iron Ore / Met Coal | 4,820 nm | 14.1 - 16.5 d |
| `CORR-AU-PAR` | Australia (Queensland) | Hay Point / Gladstone | Paradip | Coking Coal / Ore | 5,040 nm | 14.8 - 17.2 d |
| `CORR-AU-CHE` | Australia (Pilbara) | Port Hedland | Chennai / Kamarajar | Thermal Coal | 4,580 nm | 13.4 - 15.8 d |
| `CORR-ID-VIZ` | Indonesia (South Kalimantan) | Banjarmasin | Visakhapatnam | Thermal Coal | 2,150 nm | 6.3 - 8.2 d |
| `CORR-ID-PAR` | Indonesia (South Kalimantan) | Banjarmasin | Paradip | Thermal Coal | 2,320 nm | 6.8 - 8.8 d |
| `CORR-SA-IN` | South Africa (KwaZulu-Natal) | Richards Bay | Visakhapatnam / Paradip | Thermal Coal | 4,950 nm | 14.5 - 18.0 d |
| `CORR-MZ-IN` | Mozambique (Maputo Bay) | Matola / Maputo | Chennai / Vizag | Coking Coal | 4,820 nm | 14.1 - 17.5 d |
| `CORR-USG-IN` | US Gulf (Mississippi) | Houston / NOLA | Visakhapatnam | Petcoke / Grain | 9,850 nm | 28.9 - 34.2 d |
| `CORR-USEC-IN`| US East Coast (Chesapeake) | Baltimore / Norfolk | Paradip | Met Coal | 9,450 nm | 27.7 - 32.8 d |
| `CORR-RU-IN`  | Russia (Baltic Sea) | Ust-Luga / St. Petersburg | Paradip / Vizag | Fertilizer / Coal | 8,920 nm | 26.2 - 31.0 d |
| `CORR-ME-IN`  | Middle East (Gulf of Oman) | Fujairah Anchorage | Visakhapatnam | Bunkers / Bulk | 2,480 nm | 7.3 - 9.5 d |

### Supported East Coast Indian Discharge Ports
1. **Visakhapatnam (Vizag) (`P001`)**: Deepwater port, max draft 18.5m, max DWT 200,000 MT (Capesize/Panamax compliant).
2. **Paradip (`P002`)**: Mechanized bulk terminal, max draft 17.1m, max DWT 150,000 MT.
3. **Chennai (`P003`)**: Major gateway port, max draft 16.5m, max DWT 140,000 MT.
4. **Kamarajar (Ennore) (`P004`)**: Dedicated coal and bulk hub, max draft 16.0m, max DWT 150,000 MT.
5. **Haldia Dock Complex (`P005`)**: Riverine Hooghly port with strict draft cap of 12.5m, max DWT 65,000 MT (Handymax/Supramax only; Panamax/Capesize prohibited without mid-stream lightening).
6. **Dhamra (`P006`)**: Deepwater all-weather port, max draft 18.0m, max DWT 180,000 MT.

### Data Attribution & Quality Standard
- All generated route corridors are marked with the mandatory label: `"Estimated planning corridor — not for navigation"`.
- Data status flags (`live`, `historical`, `estimated`, `simulated`, `unavailable`) are strictly assigned and surfaced across the frontend and API responses.
- No synthetic or estimated coordinate is ever represented as a real-time live AIS fix. Missing live data is transparently reported as `"AIS UNAVAILABLE"`.

---

## 2. Routing Methodology: Dual-Engine Optimization

The system executes a deterministic graph-based routing algorithm returning two distinct voyage strategies:

### Option A — Shortest / Fastest Route
- **Optimization Criterion**: Minimizes total nautical distance and sailing time.
- **Engine Operating Profile**: Fast steaming at design transit speed (14.2 kts for Panamax, 14.5 kts for Capesize).
- **Tradeoff Profile**: Lower transit days and earlier ETA, but higher daily bunker fuel consumption ($P \propto V^3$), higher voyage cost, and higher port demurrage exposure if arriving during congested harbor periods.

### Option B — Lowest-Cost Route
- **Optimization Criterion**: Minimizes total landed voyage cost:
  $$\text{Total Cost} = \text{Fuel Cost} + \text{Transit Charges} + \text{Port Dues} + \text{Waiting Cost} + \text{Demurrage Risk} + \text{Vessel Operating Cost}$$
- **Engine Operating Profile**: Eco-steaming at optimized economic speed (12.0 kts), reducing daily bunker burn by 35-45% following the cubic propulsion law.
- **Cost Incentives**: Incorporates green harbor tariff discounts (-5% off-peak terminal fee rebate) and reduces port waiting demurrage buffers through scheduled laycan matching.
- **Tradeoff Profile**: Adds 1.5 to 3.0 transit days, but delivers quantifiable cost reductions ($30,000 - $80,000+ USD savings per voyage).

---

## 3. Dynamic Maritime Risk & Coastal Disruption Model

The route risk service continuously scores corridors across multiple vulnerability vectors:
1. **Weather & Monsoon Systems**: Evaluates southwest and northeast Bay of Bengal monsoons, swell height, and visibility.
2. **Tropical Cyclones**: Detects active low-pressure depressions and cyclone warning cones across the Indian Ocean and Bay of Bengal.
3. **Chokepoint Traffic & Restrictions**: Tracks navigational constraints through Malacca TSS (Traffic Separation Scheme), Sunda Strait, Lombok Strait, Bab-el-Mandeb, and Strait of Hormuz.
4. **Draft Caps**: Detects shallow navigational channels (e.g., Hooghly river bar restrictions at Haldia).
5. **Severity Classification**: `INFO`, `CAUTION`, `WARNING`, `CRITICAL` with explicit recommended mitigation actions.

---

## 4. Berth Availability & Double-Booking Prevention Engine

The berth allocation engine manages discrete berths across all East Coast terminals (`VIZ-B1`, `VIZ-B2`, `PAR-B1`, `CHE-B1`, `KAM-B1`, `HAL-B1`, `DHM-B1`).

### Conflict Detection Rule
A berth reservation is blocked if it conflicts with an existing booking within a mandatory **6-hour safety buffer**:
$$\text{requested\_arrival} < \text{existing\_departure} + \text{buffer} \quad \text{AND} \quad \text{requested\_departure} + \text{buffer} > \text{existing\_arrival}$$

### Alternative Discharge Port Evaluation
When preferred berths are occupied, the engine automatically calculates alternative ports factoring in:
- Nautical distance variance ($\Delta\text{NM}$)
- Additional bunker fuel expense
- Port dues difference
- Inland Indian Railways (CONCOR) rake transport freight
- Landing handling costs
- Feasibility score and recommendation rationale

---

## 5. Fleet Suitability & Allocation Constraints

The fleet allocation engine evaluates vessel suitability against strict maritime and commercial constraints:
1. **Capacity Sufficiency**: $\text{Available Capacity} \ge \text{Cargo Quantity}$ (rejects undersized vessels).
2. **Draft Limit**: $\text{Vessel Laden Draft} \le \text{Port Maximum Permissible Draft}$ (e.g. rejects 14.5m draft vessels at Haldia).
3. **Double-Booking**: Verifies the vessel is unassigned during the required laycan window.
4. **Budget Feasibility**: Compares estimated charter + fuel + port costs against the user's budget ceiling.
5. **Laycan Compliance**: Evaluates vessel repositioning days against the laycan deadline.

---

## 6. Charter Booking Lifecycle & Audit Rules

All charter booking operations are persisted to the relational SQLite database with full audit logging:
- **Statuses**: `DRAFT` $\rightarrow$ `PENDING_VALIDATION` $\rightarrow$ `AWAITING_BERTH` $\rightarrow$ `CONFIRMED` $\rightarrow$ `RESCHEDULE_REQUIRED` $\rightarrow$ `CANCELLED` $\rightarrow$ `COMPLETED`.
- **Confirmed Booking Immutability**: Confirmed bookings are **NEVER silently mutated**. Any schedule change requires explicit user confirmation (`confirm_changes: true`) after calculating the operational impact.
- **Cancellation**: Cancelling a booking immediately releases the occupied berth time window and resets assigned fleet availability.

---

## 7. Verification & Automated Test Results

### Automated Suite Results
- **TypeScript Compilation (`npx.cmd tsc --noEmit`)**: Passed (0 errors).
- **Frontend Linter (`npm.cmd run lint`)**: Passed (0 warnings, 0 errors).
- **Next.js Production Build (`npm.cmd run build`)**: Passed (17 static routes successfully prerendered).
- **Git Formatting & Whitespace (`git diff --check`)**: Passed (0 whitespace violations).
- **Backend Test Suite (`.\pytest.cmd -q`)**: **69 passed, 5 warnings in 22.90s** (100% pass rate).

### Route Planning Test Coverage (`backend/tests/test_route_planning_system.py`)
1. `test_get_corridors_catalog`: Verifies persistent retrieval of Australian, Indonesian, African, US, and Russian corridors.
2. `test_route_compare_shortest_vs_lowest_cost`: Validates Option A has shorter transit time while Option B achieves lower total voyage cost.
3. `test_route_tradeoff_explanation`: Ensures mathematical and operational tradeoff is explained.
4. `test_route_risk_assessment_weather`: Verifies cyclone and seasonal monsoon alerts.
5. `test_port_draft_restriction_haldia`: Verifies Haldia 12.5m draft warning is dynamically triggered.
6. `test_berth_conflict_detection`: Validates 6-hour safety buffer blocks double-booking.
7. `test_vessel_capacity_rejection`: Asserts vessels smaller than cargo quantity are rejected with explicit reason.
8. `test_vessel_draft_rejection_at_haldia`: Asserts deep-draft vessels at Haldia are rejected.
9. `test_alternative_port_calculation`: Evaluates landed cost with inland freight.
10. `test_fleet_allocation_scenarios`: Tests single vessel vs multi-vessel vs delayed laycan options.
11. `test_booking_lifecycle_create_and_fetch`: Verifies booking persistence in SQLite.
12. `test_booking_reschedule_requires_confirmation`: Proves confirmed bookings cannot be mutated without `confirm_changes: true`.
13. `test_booking_cancellation_releases_berth`: Verifies berth window is released on cancellation.
14. `test_negative_cargo_quantity_rejected`: Confirms HTTP 422 on invalid cargo quantity.
15. `test_data_status_transparency`: Ensures `data_status` attribute is present in every response.

---

## 8. Known Limitations & Future Roadmap

1. **Weather Radar & Cyclone Cones**: Weather alerts currently use regional maritime seasonal models and coastal meteorological advisories. Future releases will integrate live ECMWF / NOAA GFS ocean swell grid APIs.
2. **Live Berth Telemetry**: Berth availability currently operates on simulated terminal schedules and booking locks. Direct EDIFACT/API integrations with Indian Major Port Authorities (IPA / PCS 1x) will allow direct live terminal gate integration.
3. **SOLAS Certification**: The system is designed for supply-chain simulation and voyage chartering. It remains strictly a planning and decision-support tool.
