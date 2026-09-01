import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "GEB API"
    assert data["status"] == "running"

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

def test_list_properties():
    response = client.get("/api/properties/")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "properties" in data
    assert isinstance(data["properties"], list)

def test_land_analysis_zones():
    response = client.get("/api/land-analysis/zones")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "zones" in data
    assert len(data["zones"]) > 0

def test_land_analysis_soil():
    payload = {"latitude": 26.8467, "longitude": 80.9462}
    response = client.post("/api/land-analysis/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "analysis" in data
    assert "soil_type" in data["analysis"]

def test_land_analysis_growth():
    payload = {"latitude": 26.8467, "longitude": 80.9462}
    response = client.post("/api/land-analysis/growth/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "analysis" in data
    assert "growth_stage" in data["analysis"]

def test_land_analysis_air():
    payload = {"latitude": 26.8467, "longitude": 80.9462}
    response = client.post("/api/land-analysis/air/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "analysis" in data
    assert "aqi" in data["analysis"]

def test_land_analysis_comprehensive():
    payload = {"latitude": 26.8467, "longitude": 80.9462}
    response = client.post("/api/land-analysis/comprehensive", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "soil_analysis" in data
    assert "growth_analysis" in data
    assert "air_analysis" in data
    assert "combiner_analysis" in data
    assert "builder_analysis" in data

def test_land_analysis_builder():
    payload = {
        "plot_area_sqft": 2000.0,
        "bearing_capacity_kpa": 180.0,
        "water_table_depth_m": 12.0,
        "road_width_m": 9.0,
        "proposed_usage": "Residential"
    }
    response = client.post("/api/land-analysis/builder/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "analysis" in data
    assert "potential_builtup_sqft" in data["analysis"]

def test_ai_chat_endpoint():
    payload = {
        "message": "Find plots in Lucknow under 50 lakh",
        "conversation": []
    }
    response = client.post("/api/ai/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "answer" in data
    assert "properties" in data
