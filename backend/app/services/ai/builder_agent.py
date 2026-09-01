import math
from typing import Any, Dict, List, Optional
from app.services.ai.gemini_service import gemini_service


class BuilderAgent:
    """
    Autonomous Builder Development Advisor for GEB.
    Calculates preliminary developable-area, FAR potential, max ground coverage,
    and structural feasibility. Strictly avoids inventing official municipal building regulations.
    """

    @staticmethod
    def analyze_builder_feasibility(
        plot_area_sqft: float,
        bearing_capacity_kpa: float = 180.0,
        water_table_depth_m: float = 12.0,
        road_width_m: float = 9.0,
        proposed_usage: str = "Residential",
        property_id: Optional[str] = None,
        property_title: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Computes preliminary developable area and FAR feasibility.
        """
        area = max(500.0, plot_area_sqft)

        # Preliminary Coverage %
        coverage_pct = 60.0 if proposed_usage.lower() == "residential" else 55.0
        max_ground_coverage_sqft = round(area * (coverage_pct / 100.0), 1)

        # Estimated FAR Multiplier (Indicator based on road width)
        if road_width_m >= 18.0:
            far_multiplier = 2.5
            max_floors = "G + 6 Floors"
        elif road_width_m >= 12.0:
            far_multiplier = 2.0
            max_floors = "G + 4 Floors"
        else:
            far_multiplier = 1.75
            max_floors = "G + 3 Floors"

        potential_builtup_sqft = round(area * far_multiplier, 1)

        # Basement Feasibility
        if water_table_depth_m > 8.0:
            basement_status = "Feasible (Water table below 8m depth)"
        else:
            basement_status = "Requires Waterproofing Tanking (Water table at " + str(water_table_depth_m) + "m)"

        # Foundation Feasibility
        if bearing_capacity_kpa >= 170.0:
            foundation_type = "Shallow Isolated RCC Footings (1.8m - 2.5m depth)"
        else:
            foundation_type = "Mat / Raft Foundation"

        regulatory_disclaimer = (
            "Preliminary engineering estimates only. Official FAR, setbacks, and height limits "
            "are governed strictly by local Municipal Masterplan sanctions (e.g., LDA/ADA/RERA). "
            "Never treat preliminary estimates as legal building approvals."
        )

        summary = (
            f"For a plot area of {area:.0f} sqft, preliminary calculations indicate a maximum ground coverage of "
            f"{max_ground_coverage_sqft:.0f} sqft ({coverage_pct}%) and an estimated FAR multiplier of {far_multiplier}x, "
            f"yielding potential total built-up area of {potential_builtup_sqft:.0f} sqft ({max_floors})."
        )

        return {
            "property_id": property_id,
            "property_title": property_title or "Evaluated Builder Parcel",
            "plot_area_sqft": area,
            "road_width_m": road_width_m,
            "proposed_usage": proposed_usage,
            "estimated_coverage_pct": coverage_pct,
            "max_ground_coverage_sqft": max_ground_coverage_sqft,
            "estimated_far_multiplier": far_multiplier,
            "potential_builtup_sqft": potential_builtup_sqft,
            "estimated_max_floors": max_floors,
            "recommended_foundation": foundation_type,
            "basement_feasibility": basement_status,
            "bearing_capacity_kpa": bearing_capacity_kpa,
            "regulatory_disclaimer": regulatory_disclaimer,
            "summary": summary
        }

    @staticmethod
    def query_builder_agent(
        user_message: str,
        feasibility_analysis: Dict[str, Any],
        chat_history: Optional[List[Dict[str, str]]] = None
    ) -> str:
        """
        Grounded Builder Advisor Q&A using Gemini Service.
        """
        area = feasibility_analysis.get("plot_area_sqft", 2000)
        coverage = feasibility_analysis.get("max_ground_coverage_sqft", 1200)
        far = feasibility_analysis.get("estimated_far_multiplier", 1.75)
        builtup = feasibility_analysis.get("potential_builtup_sqft", 3500)
        floors = feasibility_analysis.get("estimated_max_floors", "G + 3 Floors")
        foundation = feasibility_analysis.get("recommended_foundation", "Isolated Footings")
        prop_name = feasibility_analysis.get("property_title", "Selected Land Parcel")

        prompt = f"""
You are the GEB Autonomous Builder Development Advisor.
Answer the user's architectural and structural development question about this plot:

Property: {prop_name}
Plot Area: {area} sqft
Max Ground Coverage: {coverage} sqft
Estimated FAR Multiplier: {far}x
Potential Built-up Area: {builtup} sqft
Estimated Height: {floors}
Recommended Foundation: {foundation}

User Question: "{user_message}"

Instruction:
1. Provide a grounded architectural feasibility answer citing plot area, FAR built-up potential, and foundation engineering.
2. ALWAYS include a clear regulatory reminder that official FAR/setbacks require local municipal (LDA/ADA/RERA) sanction.
3. Format in Markdown with bold metrics.
"""

        try:
            return gemini_service.generate(prompt)
        except Exception as err:
            print(f"Builder Agent LLM error: {err}. Using fallback responder...")
            return f"""### Builder Development Feasibility

Calculations for **{prop_name}** ({area} sqft):

* **Max Ground Coverage:** `{coverage} sqft` (60%)
* **Estimated FAR:** `{far}x`
* **Potential Built-up Area:** `{builtup} sqft`
* **Max Stories:** `{floors}`
* **Recommended Foundation:** `{foundation}`

#### Regulatory Notice
_Preliminary estimates only. Official building plan approval and FAR sanctions must be obtained from local municipal authorities prior to construction._
"""


builder_agent = BuilderAgent()
