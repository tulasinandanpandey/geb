import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import traceback
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root_endpoint():
    print("Testing Root Endpoint (GET /)...", end=" ")
    response = client.get("/")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    assert data["name"] == "GEB API"
    assert data["status"] == "running"
    print("PASSED")

def test_health_endpoint():
    print("Testing Health Endpoint (GET /api/health)...", end=" ")
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    print("PASSED")

def test_list_properties():
    print("Testing List Properties (GET /api/properties/)...", end=" ")
    response = client.get("/api/properties/")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "properties" in data
    assert isinstance(data["properties"], list)
    print(f"PASSED ({data['count']} properties fetched)")

def test_land_analysis_zones():
    print("Testing Land Analysis Zones (GET /api/land-analysis/zones)...", end=" ")
    response = client.get("/api/land-analysis/zones")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "zones" in data
    assert len(data["zones"]) > 0
    print(f"PASSED ({data['count']} zones fetched)")

def test_land_analysis_soil():
    print("Testing Soil Agent (POST /api/land-analysis/analyze)...", end=" ")
    payload = {"latitude": 26.8467, "longitude": 80.9462}
    response = client.post("/api/land-analysis/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "analysis" in data
    assert "soil_type" in data["analysis"]
    print(f"PASSED (Soil type: {data['analysis']['soil_type']})")

def test_land_analysis_growth():
    print("Testing Growth Agent (POST /api/land-analysis/growth/analyze)...", end=" ")
    payload = {"latitude": 26.8467, "longitude": 80.9462}
    response = client.post("/api/land-analysis/growth/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "analysis" in data
    assert "growth_stage" in data["analysis"]
    print(f"PASSED (Growth stage: {data['analysis']['growth_stage']})")

def test_land_analysis_air():
    print("Testing Air Agent (POST /api/land-analysis/air/analyze)...", end=" ")
    payload = {"latitude": 26.8467, "longitude": 80.9462}
    response = client.post("/api/land-analysis/air/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "analysis" in data
    assert "aqi" in data["analysis"]
    print(f"PASSED (AQI: {data['analysis']['aqi']})")

def test_land_analysis_comprehensive():
    print("Testing Comprehensive Multi-Agent Analysis (POST /api/land-analysis/comprehensive)...", end=" ")
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
    print("PASSED")

def test_land_analysis_builder():
    print("Testing Builder Feasibility Agent (POST /api/land-analysis/builder/analyze)...", end=" ")
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
    print(f"PASSED (Potential Builtup: {data['analysis']['potential_builtup_sqft']} sqft)")

def test_ai_chat_endpoint():
    print("Testing AI Chat RAG Endpoint (POST /api/ai/chat)...", end=" ")
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
    print(f"PASSED ({len(data['properties'])} matching properties)")

def run_all_tests():
    print("=" * 60)
    print("RUNNING GEB BACKEND API FUNCTIONALITY TESTS")
    print("=" * 60)
    
    tests = [
        test_root_endpoint,
        test_health_endpoint,
        test_list_properties,
        test_land_analysis_zones,
        test_land_analysis_soil,
        test_land_analysis_growth,
        test_land_analysis_air,
        test_land_analysis_comprehensive,
        test_land_analysis_builder,
        test_ai_chat_endpoint,
    ]
    
    passed = 0
    failed = 0
    
    for test in tests:
        try:
            test()
            passed += 1
        except Exception as e:
            failed += 1
            print(f"FAILED: {e}")
            traceback.print_exc()
            
    print("=" * 60)
    print(f"TEST SUMMARY: {passed} PASSED, {failed} FAILED")
    print("=" * 60)
    
    if failed > 0:
        sys.exit(1)

if __name__ == "__main__":
    run_all_tests()
