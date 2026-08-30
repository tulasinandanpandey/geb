from typing import Optional

from app.database.supabase import get_supabase


def get_all_properties():
    supabase = get_supabase()

    response = (
        supabase
        .table("properties")
        .select("*")
        .eq("status", "active")
        .order("created_at", desc=True)
        .execute()
    )

    return response.data


def moderate_property(property_data: dict, existing_properties: list) -> tuple[str, Optional[str]]:
    title = property_data.get("title", "").strip()
    description = property_data.get("description", "").strip()
    price = property_data.get("price", 0)
    area = property_data.get("area", 0)
    city = property_data.get("city", "").strip()
    locality = property_data.get("locality", "").strip()
    seller_id = property_data.get("seller_id")

    # 1. Invalid/incomplete check
    if not title or len(title) < 5:
        return "rejected", "Title must be at least 5 characters long."
    if not description or len(description) < 10:
        return "rejected", "Description must be at least 10 characters long."
    if not city:
        return "rejected", "City is required."

    # 2. Invalid price/area check
    try:
        price_num = float(price)
        if price_num <= 0:
            return "rejected", "Price must be greater than 0."
        if price_num < 1000:
            return "rejected", "Price is unreasonably low (minimum ₹1,000)."
    except (ValueError, TypeError):
        return "rejected", "Invalid price value."

    try:
        area_num = float(area) if area is not None else 0
        if area_num <= 0:
            return "rejected", "Area must be greater than 0."
        if area_num < 5:
            return "rejected", "Area is unreasonably small (minimum 5 sqft/sqm)."
    except (ValueError, TypeError):
        return "rejected", "Invalid area value."

    # 3. Test/placeholder listings check
    placeholder_keywords = ["test", "demo", "placeholder", "asdf", "qwerty", "lorem ipsum", "dummy"]
    title_lower = title.lower()
    desc_lower = description.lower()
    for kw in placeholder_keywords:
        if kw in title_lower or kw in desc_lower:
            return "rejected", f"Listing appears to be a test/placeholder (found '{kw}')."

    # 4. Spam check
    spam_keywords = ["viagra", "casino", "lottery", "free money", "win cash", "earn money online", "invest $", "bitcoin profit"]
    for kw in spam_keywords:
        if kw in title_lower or kw in desc_lower:
            return "rejected", "Listing flagged as spam."

    # 5. Nonsensical description / gibberish check
    words = description.split()
    for word in words:
        if len(word) > 30:
            return "rejected", "Description contains abnormally long text without spaces."

    # 6. Excessive uppercase review check (suspicious)
    if len(title) >= 10:
        caps_count = sum(1 for c in title if c.isupper())
        alphabetic_count = sum(1 for c in title if c.isalpha())
        if alphabetic_count > 0 and (caps_count / alphabetic_count) > 0.6:
            return "pending_review", "Excessive uppercase letters in title."

    # 7. Duplicate listings check
    for ep in existing_properties:
        if (str(ep.get("seller_id")) == str(seller_id) and
            ep.get("title", "").strip().lower() == title.lower() and
            float(ep.get("price", 0)) == float(price) and
            ep.get("city", "").strip().lower() == city.lower() and
            ep.get("locality", "").strip().lower() == locality.lower()):
            return "rejected", "Duplicate listing detected: you have already listed this property."

    return "active", None


def get_property_by_id(property_id: str):
    supabase = get_supabase()

    response = (
        supabase
        .table("properties")
        .select("*, seller:profiles(id, full_name, email, phone, avatar_url)")
        .eq("id", property_id)
        .eq("status", "active")
        .single()
        .execute()
    )

    return response.data


def create_property(property_data: dict):
    supabase = get_supabase()

    # Get seller's properties for duplicate check
    existing_response = (
        supabase
        .table("properties")
        .select("*")
        .eq("seller_id", property_data.get("seller_id"))
        .execute()
    )
    existing_properties = existing_response.data or []

    status, reason = moderate_property(property_data, existing_properties)

    property_data["source"] = "geb"
    property_data["source_name"] = "GEB"
    property_data["status"] = status
    property_data["rejection_reason"] = reason
    property_data["featured"] = False

    response = (
        supabase
        .table("properties")
        .insert(property_data)
        .execute()
    )

    return response.data[0]
