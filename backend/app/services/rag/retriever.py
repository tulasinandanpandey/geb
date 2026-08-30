from typing import Optional

from app.database.supabase import get_supabase


def retrieve_properties(
    city: Optional[str] = None,
    locality: Optional[str] = None,
    property_type: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    limit: int = 10,
):
    supabase = get_supabase()

    query = (
        supabase
        .table("properties")
        .select(
            "id,title,property_type,price,area,area_unit,"
            "city,locality,latitude,longitude,image,images,"
            "source,source_name,source_url,investment_score,"
            "featured,status,description,seller_id,created_at,updated_at"
        )
        .eq("status", "active")
    )

    if city:
        query = query.ilike(
            "city",
            f"%{city}%"
        )

    if locality:
        query = query.ilike(
            "locality",
            f"%{locality}%"
        )

    if property_type:
        query = query.eq(
            "property_type",
            property_type
        )

    if min_price is not None:
        query = query.gte(
            "price",
            min_price
        )

    if max_price is not None:
        query = query.lte(
            "price",
            max_price
        )

    query = (
        query
        .order(
            "investment_score",
            desc=True,
            nullsfirst=False,
        )
        .limit(limit)
    )

    response = query.execute()

    return response.data
