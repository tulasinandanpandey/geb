from typing import Optional

from pydantic import BaseModel, Field


class PropertyCreate(BaseModel):

    title: str = Field(
        min_length=3,
        max_length=200,
    )

    property_type: str

    price: float = Field(
        gt=0
    )

    area: Optional[float] = Field(
        default=None,
        gt=0,
    )

    area_unit: str = "sqft"

    city: str

    locality: Optional[str] = None

    latitude: float

    longitude: float

    image: Optional[str] = None

    images: list[str] = Field(
        default_factory=list
    )

    description: Optional[str] = None


class PropertyResponse(PropertyCreate):

    id: str

    source: str

    source_name: Optional[str] = None

    source_url: Optional[str] = None

    investment_score: Optional[float] = None

    featured: bool

    status: str

    seller_id: Optional[str] = None

    created_at: Optional[str] = None

    updated_at: Optional[str] = None
