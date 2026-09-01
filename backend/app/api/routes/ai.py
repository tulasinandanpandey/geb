from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.rag.query_analyzer import analyze_query_with_context
from app.services.rag.rag_service import answer_property_query


ALLOWED_PROPERTY_TYPES = {
    "plot",
    "house",
    "apartment",
    "villa",
    "commercial",
}


router = APIRouter(
    prefix="/api/ai",
    tags=["AI"],
)


class AIChatMessage(BaseModel):
    role: str
    content: str = Field(
        min_length=1,
        max_length=4000,
    )


class AIChatRequest(BaseModel):
    message: str = Field(
        min_length=1,
        max_length=2000,
    )

    conversation: list[AIChatMessage] = Field(
        default_factory=list
    )

    city: Optional[str] = None
    locality: Optional[str] = None
    property_type: Optional[str] = None
    listing_type: Optional[str] = None
    bhk: Optional[int] = None
    furnishing_status: Optional[str] = None

    min_price: Optional[float] = None
    max_price: Optional[float] = None

    purpose: Optional[str] = None


def _normalize_property_type(value: Optional[str]) -> Optional[str]:
    if not value:
        return None

    normalized = value.strip().lower()

    if normalized in ALLOWED_PROPERTY_TYPES:
        return normalized

    return None


@router.post("/chat")
def ai_chat(request: AIChatRequest):
    if not request.message.strip():
        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty.",
        )

    try:
        conversation = [
            item.model_dump()
            for item in request.conversation[-8:]
            if item.role in {"user", "assistant"}
            and item.content.strip()
        ]

        analyzed = analyze_query_with_context(
            request.message,
            conversation,
        )

        city = request.city or analyzed.get("city")
        locality = request.locality or analyzed.get("locality")
        property_type = (
            _normalize_property_type(request.property_type)
            or analyzed.get("property_type")
        )
        listing_type = request.listing_type or analyzed.get("listing_type")
        bhk = request.bhk or analyzed.get("bhk")
        furnishing_status = request.furnishing_status or analyzed.get("furnishing_status")

        min_price = (
            request.min_price
            if request.min_price is not None
            else analyzed.get("min_price")
        )

        max_price = (
            request.max_price
            if request.max_price is not None
            else analyzed.get("max_price")
        )

        purpose = request.purpose or analyzed.get("purpose")
        priority = analyzed.get("priority")
        risk_preference = analyzed.get("risk_preference")
        time_horizon_years = analyzed.get("time_horizon_years")

        if (
            min_price is not None
            and max_price is not None
            and min_price > max_price
        ):
            min_price, max_price = max_price, min_price

        result = answer_property_query(
            message=request.message,
            city=city,
            locality=locality,
            property_type=property_type,
            listing_type=listing_type,
            bhk=bhk,
            furnishing_status=furnishing_status,
            min_price=min_price,
            max_price=max_price,
            purpose=purpose,
            priority=priority,
            risk_preference=risk_preference,
            time_horizon_years=time_horizon_years,
        )

        interpreted_requirements = {
            "city": city,
            "locality": locality,
            "property_type": property_type,
            "listing_type": listing_type,
            "bhk": bhk,
            "furnishing_status": furnishing_status,
            "min_price": min_price,
            "max_price": max_price,
            "purpose": purpose,
            "priority": priority,
            "risk_preference": risk_preference,
            "time_horizon_years": time_horizon_years,
        }

        return {
            "success": True,
            "answer": result["answer"],
            "count": result["count"],
            "properties": result["properties"],
            "interpreted_requirements": interpreted_requirements,
        }

    except Exception as error:
        print(
            "AI CHAT ERROR:",
            repr(error),
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to process your AI request.",
        )
