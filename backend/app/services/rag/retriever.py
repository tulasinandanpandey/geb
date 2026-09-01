from typing import Optional
from app.database.supabase import get_supabase


def retrieve_properties(
    city: Optional[str] = None,
    locality: Optional[str] = None,
    property_type: Optional[str] = None,
    listing_type: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    bhk: Optional[int] = None,
    furnishing_status: Optional[str] = None,
    limit: int = 20,
):
    supabase = get_supabase()

    query = (
        supabase
        .table("properties")
        .select("*")
        .eq("status", "active")
    )

    if city:
        query = query.ilike("city", f"%{city}%")

    if locality:
        query = query.ilike("locality", f"%{locality}%")

    if property_type and property_type.lower() != "all":
        query = query.eq("property_type", property_type.lower())

    if min_price is not None:
        query = query.gte("price", min_price)

    if max_price is not None:
        query = query.lte("price", max_price)

    query = query.order("created_at", desc=True).limit(limit)

    response = query.execute()
    data = response.data or []

    # In-Memory Resilient Post-Filtering for Rental & Property Attributes
    filtered = []
    for prop in data:
        prop_listing_type = (prop.get("listing_type") or "sale").lower()
        if listing_type and listing_type.lower() != "all":
            if prop_listing_type != listing_type.lower():
                # Allow fallback matching if user explicitly asks for rent/sale
                # Check description/title for keywords if column is default
                desc_title = (prop.get("title", "") + " " + prop.get("description", "")).lower()
                if listing_type.lower() == "rent" and "rent" not in desc_title and prop_listing_type != "rent":
                    continue
                elif listing_type.lower() == "sale" and prop_listing_type == "rent":
                    continue

        if bhk is not None:
            prop_bhk = prop.get("bhk")
            if prop_bhk is not None and prop_bhk != bhk:
                continue

        if furnishing_status:
            prop_furnish = (prop.get("furnishing_status") or "").lower()
            if prop_furnish and prop_furnish != furnishing_status.lower():
                continue

        filtered.append(prop)

    return filtered[:limit]
