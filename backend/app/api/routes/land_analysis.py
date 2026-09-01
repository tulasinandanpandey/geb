from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.ai.soil_agent import soil_agent, REGIONAL_SOIL_ZONES
from app.services.ai.land_growth_agent import land_growth_agent
from app.services.ai.air_intelligence_agent import air_intelligence_agent
from app.services.ai.combiner_agent import combiner_agent
from app.services.ai.builder_agent import builder_agent
from app.services.properties.property_service import get_property_by_id


router = APIRouter(
    prefix="/api/land-analysis",
    tags=["Land Analysis"],
)


class AnalyzeLandRequest(BaseModel):
    property_id: Optional[str] = None
    latitude: Optional[float] = Field(default=None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(default=None, ge=-180.0, le=180.0)


class BuilderAnalyzeRequest(BaseModel):
    plot_area_sqft: float = Field(gt=0)
    bearing_capacity_kpa: Optional[float] = 180.0
    water_table_depth_m: Optional[float] = 12.0
    road_width_m: Optional[float] = 9.0
    proposed_usage: Optional[str] = "Residential"
    property_id: Optional[str] = None
    property_title: Optional[str] = None


class AgentQueryRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    analysis: Dict[str, Any]
    conversation_history: Optional[List[Dict[str, str]]] = Field(default_factory=list)


@router.post("/analyze")
def analyze_land(request: AnalyzeLandRequest):
    prop_title = None
    area_sqft = None
    lat = request.latitude
    lng = request.longitude

    if request.property_id:
        try:
            prop = get_property_by_id(request.property_id)
            if prop:
                prop_title = prop.get("title")
                area_sqft = prop.get("area")
                lat = prop.get("latitude")
                lng = prop.get("longitude")
        except Exception as err:
            print(f"Property lookup error: {err}")

    if lat is None or lng is None:
        lat, lng = 26.8467, 80.9462

    analysis = soil_agent.analyze_land_coordinates(
        latitude=float(lat), longitude=float(lng), property_id=request.property_id, property_title=prop_title, area_sqft=area_sqft
    )
    return {"success": True, "analysis": analysis}


@router.post("/growth/analyze")
def analyze_land_growth_endpoint(request: AnalyzeLandRequest):
    prop_title = None
    area_sqft = None
    lat = request.latitude
    lng = request.longitude

    if request.property_id:
        try:
            prop = get_property_by_id(request.property_id)
            if prop:
                prop_title = prop.get("title")
                area_sqft = prop.get("area")
                lat = prop.get("latitude")
                lng = prop.get("longitude")
        except Exception as err:
            print(f"Property lookup error: {err}")

    if lat is None or lng is None:
        lat, lng = 26.8467, 80.9462

    growth_analysis = land_growth_agent.analyze_land_growth(
        latitude=float(lat), longitude=float(lng), property_id=request.property_id, property_title=prop_title, area_sqft=area_sqft
    )
    return {"success": True, "analysis": growth_analysis}


@router.post("/air/analyze")
def analyze_air_intelligence_endpoint(request: AnalyzeLandRequest):
    prop_title = None
    lat = request.latitude
    lng = request.longitude

    if request.property_id:
        try:
            prop = get_property_by_id(request.property_id)
            if prop:
                prop_title = prop.get("title")
                lat = prop.get("latitude")
                lng = prop.get("longitude")
        except Exception as err:
            print(f"Property lookup error: {err}")

    if lat is None or lng is None:
        lat, lng = 26.8467, 80.9462

    air_analysis = air_intelligence_agent.analyze_air_intelligence(
        latitude=float(lat), longitude=float(lng), property_id=request.property_id, property_title=prop_title
    )
    return {"success": True, "analysis": air_analysis}


@router.post("/comprehensive")
def analyze_comprehensive_land(request: AnalyzeLandRequest):
    prop_title = None
    area_sqft = None
    lat = request.latitude
    lng = request.longitude

    if request.property_id:
        try:
            prop = get_property_by_id(request.property_id)
            if prop:
                prop_title = prop.get("title")
                area_sqft = prop.get("area")
                lat = prop.get("latitude")
                lng = prop.get("longitude")
        except Exception as err:
            print(f"Property lookup error: {err}")

    if lat is None or lng is None:
        lat, lng = 26.8467, 80.9462

    lat_f = float(lat)
    lng_f = float(lng)

    soil_res = soil_agent.analyze_land_coordinates(
        latitude=lat_f, longitude=lng_f, property_id=request.property_id, property_title=prop_title, area_sqft=area_sqft
    )
    growth_res = land_growth_agent.analyze_land_growth(
        latitude=lat_f, longitude=lng_f, property_id=request.property_id, property_title=prop_title, area_sqft=area_sqft
    )
    air_res = air_intelligence_agent.analyze_air_intelligence(
        latitude=lat_f, longitude=lng_f, property_id=request.property_id, property_title=prop_title
    )
    combiner_res = combiner_agent.analyze_land_combination(soil_res, growth_res, air_res)
    builder_res = builder_agent.analyze_builder_feasibility(
        plot_area_sqft=area_sqft or 2000.0,
        bearing_capacity_kpa=soil_res["bearing_capacity_kpa"],
        water_table_depth_m=soil_res["water_table_depth_m"],
        property_id=request.property_id,
        property_title=prop_title
    )

    return {
        "success": True,
        "soil_analysis": soil_res,
        "growth_analysis": growth_res,
        "air_analysis": air_res,
        "combiner_analysis": combiner_res,
        "builder_analysis": builder_res
    }


@router.post("/builder/analyze")
def analyze_builder_endpoint(request: BuilderAnalyzeRequest):
    feasibility = builder_agent.analyze_builder_feasibility(
        plot_area_sqft=request.plot_area_sqft,
        bearing_capacity_kpa=request.bearing_capacity_kpa or 180.0,
        water_table_depth_m=request.water_table_depth_m or 12.0,
        road_width_m=request.road_width_m or 9.0,
        proposed_usage=request.proposed_usage or "Residential",
        property_id=request.property_id,
        property_title=request.property_title
    )
    return {"success": True, "analysis": feasibility}


@router.get("/property/{property_id}")
def get_property_soil_analysis(property_id: str):
    prop = get_property_by_id(property_id)
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found.")

    lat = prop.get("latitude", 26.8467)
    lng = prop.get("longitude", 80.9462)

    analysis = soil_agent.analyze_land_coordinates(
        latitude=float(lat), longitude=float(lng), property_id=property_id, property_title=prop.get("title"), area_sqft=prop.get("area")
    )
    return {"success": True, "analysis": analysis}


@router.get("/zones")
def get_soil_zones():
    return {"success": True, "count": len(REGIONAL_SOIL_ZONES), "zones": REGIONAL_SOIL_ZONES}


@router.post("/query")
def query_soil_agent_api(request: AgentQueryRequest):
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")
    answer = soil_agent.query_soil_agent(user_message=request.message, land_analysis=request.analysis, chat_history=request.conversation_history)
    return {"success": True, "answer": answer}


@router.post("/growth/query")
def query_growth_agent_api(request: AgentQueryRequest):
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")
    answer = land_growth_agent.query_growth_agent(user_message=request.message, growth_analysis=request.analysis, chat_history=request.conversation_history)
    return {"success": True, "answer": answer}


@router.post("/air/query")
def query_air_agent_api(request: AgentQueryRequest):
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")
    answer = air_intelligence_agent.query_air_agent(user_message=request.message, air_analysis=request.analysis, chat_history=request.conversation_history)
    return {"success": True, "answer": answer}


@router.post("/combiner/query")
def query_combiner_agent_api(request: AgentQueryRequest):
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")
    answer = combiner_agent.query_combiner_agent(user_message=request.message, combiner_analysis=request.analysis, chat_history=request.conversation_history)
    return {"success": True, "answer": answer}


@router.post("/builder/query")
def query_builder_agent_api(request: AgentQueryRequest):
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")
    answer = builder_agent.query_builder_agent(user_message=request.message, feasibility_analysis=request.analysis, chat_history=request.conversation_history)
    return {"success": True, "answer": answer}
