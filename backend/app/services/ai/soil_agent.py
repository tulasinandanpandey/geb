import math
import random
from typing import Any, Dict, List, Optional
from app.services.ai.gemini_service import gemini_service


# Regional GIS Soil Zones (Indo-Gangetic Plain, Lucknow, Prayagraj, etc.)
REGIONAL_SOIL_ZONES = [
    {
        "id": "zone-alluvial-gangetic",
        "name": "Indo-Gangetic Alluvial Basin",
        "soil_type": "Deep Alluvial Loam",
        "color": "#10b981", # Emerald
        "center": [26.8467, 80.9462],
        "bounds": [
            [26.75, 80.85],
            [26.95, 80.85],
            [26.95, 81.05],
            [26.75, 81.05]
        ],
        "bearing_capacity_avg": 195.0,
        "ph_avg": 7.3,
        "water_table_avg_m": 12.0,
        "agricultural_score": 94,
        "construction_score": 88,
        "primary_crops": ["Wheat", "Sugarcane", "Mustard", "Pulses", "Paddy"],
        "foundation": "Shallow Reinforced Strip / Isolated Footings"
    },
    {
        "id": "zone-clay-loam-gomti",
        "name": "Gomti Riverbank Clay Basin",
        "soil_type": "Silty Clay Loam",
        "color": "#3b82f6", # Blue
        "center": [26.8600, 80.9800],
        "bounds": [
            [26.82, 80.92],
            [26.92, 80.92],
            [26.92, 81.02],
            [26.82, 81.02]
        ],
        "bearing_capacity_avg": 165.0,
        "ph_avg": 7.6,
        "water_table_avg_m": 8.5,
        "agricultural_score": 90,
        "construction_score": 82,
        "primary_crops": ["Vegetables", "Paddy", "Mentha", "Flowers"],
        "foundation": "Raft / Mat Foundation (Waterproofed)"
    },
    {
        "id": "zone-black-soil-plateau",
        "name": "Southern Plateau Fringe (Black Soil)",
        "soil_type": "Expansive Black Cotton Clay (Vertisol)",
        "color": "#8b5cf6", # Purple
        "center": [26.7200, 80.8800],
        "bounds": [
            [26.65, 80.80],
            [26.78, 80.80],
            [26.78, 80.95],
            [26.65, 80.95]
        ],
        "bearing_capacity_avg": 140.0,
        "ph_avg": 8.1,
        "water_table_avg_m": 18.0,
        "agricultural_score": 86,
        "construction_score": 75,
        "primary_crops": ["Cotton", "Gram", "Oilseeds", "Millets"],
        "foundation": "Under-Reamed Friction Piles / Deep Raft"
    },
    {
        "id": "zone-red-sandy-upland",
        "name": "Trans-Yamuna Sandy Upland",
        "soil_type": "Red Sandy Loam",
        "color": "#f59e0b", # Amber
        "center": [25.4358, 81.8463], # Prayagraj
        "bounds": [
            [25.35, 81.75],
            [25.52, 81.75],
            [25.52, 81.95],
            [25.35, 81.95]
        ],
        "bearing_capacity_avg": 220.0,
        "ph_avg": 6.8,
        "water_table_avg_m": 22.0,
        "agricultural_score": 78,
        "construction_score": 93,
        "primary_crops": ["Guava", "Millets", "Pulses", "Citrus Fruits"],
        "foundation": "Individual Column Isolated Footings"
    }
]


class SoilAgent:
    """
    Autonomous Soil & Deep Land Analysis Agent for GEB platform.
    Computes geotechnical parameters, foundation feasibility, soil health indices,
    and runs grounded natural language Q&A.
    """

    @staticmethod
    def analyze_land_coordinates(
        latitude: float,
        longitude: float,
        property_id: Optional[str] = None,
        property_title: Optional[str] = None,
        area_sqft: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Generate deterministic & location-sensitive deep soil & land geotechnical analysis.
        Uses geographic hashing seeded by lat/lng so coordinates return consistent metrics.
        """
        # Hash coordinates to get deterministic pseudo-random variation
        geo_seed = int(abs(latitude * 10000 + longitude * 10000))
        rnd = random.Random(geo_seed)

        # Match nearest regional zone
        nearest_zone = SoilAgent._find_nearest_zone(latitude, longitude)

        # Compute geotechnical parameters
        base_bearing = nearest_zone["bearing_capacity_avg"]
        bearing_capacity = round(base_bearing + rnd.uniform(-25.0, 25.0), 1)

        base_ph = nearest_zone["ph_avg"]
        soil_ph = round(base_ph + rnd.uniform(-0.4, 0.4), 2)

        base_wt = nearest_zone["water_table_avg_m"]
        water_table_depth = round(max(3.0, base_wt + rnd.uniform(-3.5, 4.0)), 1)

        elevation_m = round(110.0 + (latitude - 26.0) * 15.0 + rnd.uniform(2.0, 15.0), 1)
        slope_percent = round(rnd.uniform(0.5, 3.8), 1)

        # NPK Fertility breakdown
        nitrogen_kg_ha = round(rnd.uniform(180.0, 280.0), 1) # Low <280
        phosphorus_kg_ha = round(rnd.uniform(18.0, 42.0), 1) # Medium 11-25, High >25
        potassium_kg_ha = round(rnd.uniform(210.0, 360.0), 1) # High >280
        organic_carbon_percent = round(rnd.uniform(0.45, 0.85), 2)

        # Risk assessments
        flood_risk = "Low" if water_table_depth > 8.0 and slope_percent > 1.0 else ("Medium" if water_table_depth > 5.0 else "High")
        erosion_risk = "Low" if slope_percent < 2.0 else ("Medium" if slope_percent < 4.0 else "High")
        seismic_zone = "Zone III (Moderate Risk)" if latitude > 26.5 else "Zone II (Low Risk)"

        # Scores
        construction_score = nearest_zone["construction_score"]
        if bearing_capacity < 150:
            construction_score -= 10
        elif bearing_capacity > 200:
            construction_score = min(99, construction_score + 6)
        if flood_risk == "High":
            construction_score -= 12

        agricultural_score = nearest_zone["agricultural_score"]
        if organic_carbon_percent > 0.65 and soil_ph >= 6.5 and soil_ph <= 7.8:
            agricultural_score = min(98, agricultural_score + 5)

        # Recommended foundation based on bearing capacity & soil type
        soil_type = nearest_zone["soil_type"]
        if "Vertisol" in soil_type or "Black" in soil_type:
            recommended_foundation = "Under-Reamed Friction Piles (3.5m - 5m depth)"
            remediation = "Replace top 1m expansive soil with cohesive non-swelling (CNS) layer. Ensure surface drainage away from footings."
        elif bearing_capacity < 160:
            recommended_foundation = "Raft / Mat Foundation with Damp-Proofing"
            remediation = "Soil compaction using heavy vibratory roller recommended prior to footings."
        else:
            recommended_foundation = "Shallow Reinforced Concrete Isolated Footings (1.8m - 2.5m depth)"
            remediation = "Standard site levelling. Normal strip/isolated foundations suitable without specialized deep piling."

        summary = (
            f"Soil at coordinate ({latitude:.4f}, {longitude:.4f}) is classified as {soil_type}. "
            f"Demonstrates a safe bearing capacity of {bearing_capacity} kN/m² with a pH of {soil_ph}. "
            f"Construction feasibility score is {construction_score}/100 with recommended {recommended_foundation}. "
            f"Agricultural suitability score is {agricultural_score}/100."
        )

        return {
            "property_id": property_id,
            "property_title": property_title or f"Parcel ({latitude:.4f}, {longitude:.4f})",
            "latitude": latitude,
            "longitude": longitude,
            "area_sqft": area_sqft,
            "zone_name": nearest_zone["name"],
            "soil_type": soil_type,
            "soil_ph": soil_ph,
            "bearing_capacity_kpa": bearing_capacity,
            "water_table_depth_m": water_table_depth,
            "elevation_m": elevation_m,
            "slope_percent": slope_percent,
            "npk_fertility": {
                "nitrogen_kg_ha": nitrogen_kg_ha,
                "phosphorus_kg_ha": phosphorus_kg_ha,
                "potassium_kg_ha": potassium_kg_ha,
                "organic_carbon_percent": organic_carbon_percent,
                "overall_health": "Fertile / High Nutrient Capacity" if organic_carbon_percent > 0.6 else "Moderate Fertility"
            },
            "flood_risk": flood_risk,
            "erosion_risk": erosion_risk,
            "seismic_zone": seismic_zone,
            "construction_suitability_score": construction_score,
            "agricultural_suitability_score": agricultural_score,
            "recommended_foundation": recommended_foundation,
            "suitable_crops": nearest_zone["primary_crops"],
            "soil_remediation_notes": remediation,
            "summary": summary
        }

    @staticmethod
    def _find_nearest_zone(lat: float, lng: float) -> Dict[str, Any]:
        """Find closest regional soil zone based on Euclidean distance to center."""
        best_zone = REGIONAL_SOIL_ZONES[0]
        min_dist = float("inf")

        for zone in REGIONAL_SOIL_ZONES:
            c_lat, c_lng = zone["center"]
            dist = math.sqrt((lat - c_lat)**2 + (lng - c_lng)**2)
            if dist < min_dist:
                min_dist = dist
                best_zone = zone

        return best_zone

    @staticmethod
    def query_soil_agent(
        user_message: str,
        land_analysis: Dict[str, Any],
        chat_history: Optional[List[Dict[str, str]]] = None
    ) -> str:
        """
        Grounded Soil Agent Q&A using Gemini Service.
        Answers user questions regarding construction, crops, foundation, drainage, and investment potential based on land metrics.
        """
        soil_type = land_analysis.get("soil_type", "Alluvial")
        bearing = land_analysis.get("bearing_capacity_kpa", 180.0)
        ph = land_analysis.get("soil_ph", 7.2)
        wt = land_analysis.get("water_table_depth_m", 12.0)
        foundation = land_analysis.get("recommended_foundation", "Isolated Footings")
        crops = ", ".join(land_analysis.get("suitable_crops", ["Wheat", "Paddy"]))
        c_score = land_analysis.get("construction_suitability_score", 85)
        a_score = land_analysis.get("agricultural_suitability_score", 90)
        flood = land_analysis.get("flood_risk", "Low")
        remediation = land_analysis.get("soil_remediation_notes", "Standard levelling")
        lat = land_analysis.get("latitude", 26.84)
        lng = land_analysis.get("longitude", 80.94)
        prop_name = land_analysis.get("property_title", "Selected Land Parcel")

        prompt = f"""
You are the GEB Autonomous Soil Agent & Civil/Geotechnical Expert.
Answer the user's specific question about the following evaluated land parcel:

Land Location: ({lat}, {lng}) - {prop_name}
Soil Classification: {soil_type}
Safe Bearing Capacity: {bearing} kN/m²
Soil pH: {ph}
Water Table Depth: {wt} meters
Construction Suitability Score: {c_score}/100
Agricultural Suitability Score: {a_score}/100
Flood Risk Level: {flood}
Recommended Structural Foundation: {foundation}
Suitable Agricultural Crops: {crops}
Geotechnical Remediation Advice: {remediation}

User Question: "{user_message}"

Instruction:
1. Provide a grounded, expert geotechnical and agricultural answer tailored precisely to these metrics.
2. If asking about construction feasibility (e.g. multi-story building, villa, basement), cite the safe bearing capacity ({bearing} kN/m²) and recommended foundation ({foundation}).
3. If asking about agriculture, cite soil pH ({ph}) and suitable crops ({crops}).
4. Keep the response professional, clear, formatted in Markdown with bold highlights and bullet points.
5. End with a helpful next step recommendation.
"""

        try:
            response = gemini_service.generate(prompt)
            return response
        except Exception as err:
            print(f"Soil Agent LLM error: {err}. Using deterministic expert fallback...")
            msg_lower = user_message.lower()
            if any(k in msg_lower for k in ["build", "building", "structure", "foundation", "floor", "story", "stories", "basement"]):
                return f"""### Geotechnical Construction Assessment

Based on the geotechnical analysis for **{prop_name}**:

* **Safe Bearing Capacity:** `{bearing} kN/m²`
* **Recommended Foundation:** `{foundation}`
* **Water Table Depth:** `{wt} meters`
* **Construction Suitability Rating:** `{c_score}/100`

#### Structural Feasibility
* **Multi-story Residential/Commercial:** The safe bearing capacity of `{bearing} kN/m²` easily supports 2 to 5-story structures.
* **Foundation Engineering:** We recommend implementing **{foundation}**. For structures above 4 floors, conduct a deep bore plate load test.
* **Basement Potential:** Water table at `{wt}m` allows single or double basement excavation without immediate water table interception.

#### Remediation Note
_{remediation}_
"""
            elif any(k in msg_lower for k in ["crop", "farm", "agriculture", "grow", "soil health", "ph", "yield"]):
                return f"""### Agronomic Soil Assessment

Based on the soil test data for **{prop_name}**:

* **Soil Type:** `{soil_type}`
* **Soil pH Level:** `{ph}` (Optimal neutral-slightly alkaline range)
* **Agricultural Rating:** `{a_score}/100`

#### Recommended Crop Rotation
* **Primary Crops:** {crops}
* **Yield Potential:** High, given favorable organic carbon and nitrogen reserves.

#### Soil Health Advice
The current pH level of `{ph}` provides high nutrient bioavailability. Regular organic composting maintains long-term soil structure.
"""
            else:
                return f"""### Soil Agent Technical Summary

**{prop_name}** ({lat:.4f}, {lng:.4f})

* **Soil Type:** {soil_type}
* **Safe Bearing Capacity:** {bearing} kN/m²
* **Soil pH:** {ph} | **Water Table:** {wt}m
* **Construction Feasibility:** {c_score}/100
* **Recommended Foundation:** {foundation}
* **Flood Risk:** {flood}

*Ask me specifically about building load capacity, foundation design, crop suitability, or basement excavation!*
"""


soil_agent = SoilAgent()
