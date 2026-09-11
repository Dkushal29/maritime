"""
Abstract Base Provider for AIS (Automatic Identification System) Fleet Telemetry.
"""
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional


class BaseAISProvider(ABC):
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key

    @abstractmethod
    async def fetch_vessels(
        self,
        vessel_types: Optional[List[str]] = None,
        bbox: Optional[List[float]] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Fetches raw vessel positions from the upstream AIS API.
        bbox format: [min_lat, min_lon, max_lat, max_lon]
        Returns list of raw provider dictionaries.
        """
        pass

    @abstractmethod
    def get_provider_name(self) -> str:
        """Returns provider identifier name."""
        pass
