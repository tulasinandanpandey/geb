def build_property_context(
    properties: list[dict],
) -> str:

    if not properties:
        return (
            "No matching properties were found in the GEB "
            "property database."
        )

    context_blocks = []

    for index, property_data in enumerate(
        properties,
        start=1,
    ):

        block = f"""
PROPERTY {index}

Title: {property_data.get("title", "N/A")}
Property type: {property_data.get("property_type", "N/A")}
Price: ₹{property_data.get("price", "N/A")}
Area: {property_data.get("area", "N/A")} {property_data.get("area_unit", "")}
City: {property_data.get("city", "N/A")}
Locality: {property_data.get("locality", "N/A")}
Investment score: {property_data.get("investment_score", "N/A")}
GEB Match Score: {property_data.get("geb_match_score", "N/A")}
GEB Score Breakdown: {property_data.get("geb_score_breakdown", "N/A")}
Featured: {property_data.get("featured", False)}
Description: {property_data.get("description", "N/A")}
Latitude: {property_data.get("latitude", "N/A")}
Longitude: {property_data.get("longitude", "N/A")}
"""

        context_blocks.append(
            block.strip()
        )

    return "\n\n".join(
        context_blocks
    )

