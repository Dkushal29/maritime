"""
Preprocessing pipelines for Freight and Cargo Demand data.
Builds ColumnTransformer pipelines with StandardScaler and OneHotEncoder.
"""
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.pipeline import Pipeline

FREIGHT_NUMERICAL_FEATURES = [
    "bdi",
    "panamax_index",
    "capesize_index",
    "bunker_price",
    "crude_oil_price",
    "port_congestion",
    "vessel_availability",
    "commodity_price",
    "usd_inr",
    "cargo_volume",
    "month",
    "quarter",
]

FREIGHT_CATEGORICAL_FEATURES = [
    "origin",
    "destination",
    "cargo_type",
    "vessel_type",
]

DEMAND_NUMERICAL_FEATURES = [
    "historical_demand",
    "inventory",
    "import_volume",
    "commodity_price",
    "production_index",
    "seasonality",
    "port_traffic",
    "month",
    "quarter",
]

DEMAND_CATEGORICAL_FEATURES = [
    "port",
    "cargo_type",
]


def create_freight_preprocessor() -> ColumnTransformer:
    """Builds a scikit-learn ColumnTransformer for freight forecasting features."""
    numeric_transformer = Pipeline(steps=[
        ("scaler", StandardScaler())
    ])
    categorical_transformer = Pipeline(steps=[
        ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
    ])
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numeric_transformer, FREIGHT_NUMERICAL_FEATURES),
            ("cat", categorical_transformer, FREIGHT_CATEGORICAL_FEATURES),
        ],
        remainder="drop"
    )
    return preprocessor


def create_demand_preprocessor() -> ColumnTransformer:
    """Builds a scikit-learn ColumnTransformer for cargo demand forecasting features."""
    numeric_transformer = Pipeline(steps=[
        ("scaler", StandardScaler())
    ])
    categorical_transformer = Pipeline(steps=[
        ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
    ])
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numeric_transformer, DEMAND_NUMERICAL_FEATURES),
            ("cat", categorical_transformer, DEMAND_CATEGORICAL_FEATURES),
        ],
        remainder="drop"
    )
    return preprocessor
