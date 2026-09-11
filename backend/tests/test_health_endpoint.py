import os
import sys
import time
import subprocess
import httpx
from fastapi.testclient import TestClient

backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from main import app

# 1. Test via TestClient
print("Testing /health via FastAPI TestClient...")
client = TestClient(app)
res = client.get("/health")
print("TestClient /health status:", res.status_code)
print("TestClient /health JSON:", res.json())
assert res.status_code == 200
assert res.json()["database"] == "connected"
assert res.json()["database_dialect"] == "postgresql"

print("\nAll health endpoint checks passed successfully!")
