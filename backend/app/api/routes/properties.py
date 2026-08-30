from fastapi import APIRouter, Depends, HTTPException

from app.schemas.property import PropertyCreate

from app.services.properties.property_service import (
    get_all_properties,
    get_property_by_id,
    create_property,
)

from app.core.auth import get_current_user


router = APIRouter(
    prefix="/api/properties",
    tags=["Properties"],
)


@router.get("/")
def list_properties():

    try:

        properties = get_all_properties()

        return {
            "success": True,
            "count": len(properties),
            "properties": properties,
        }

    except Exception as error:

        print(
            "PROPERTY API ERROR:",
            repr(error),
        )

        raise HTTPException(
            status_code=500,
            detail=str(error),
        )


@router.post("/")
def create_new_property(
    property_data: PropertyCreate,
    current_user=Depends(get_current_user),
):

    try:

        property_payload = property_data.model_dump(
            exclude_none=True
        )

        property_payload["seller_id"] = current_user.id

        created_property = create_property(
            property_payload
        )

        return {
            "success": True,
            "message": "Property listed successfully",
            "property": created_property,
        }

    except Exception as error:

        print(
            "PROPERTY CREATE ERROR:",
            repr(error),
        )

        raise HTTPException(
            status_code=500,
            detail=str(error),
        )



@router.get("/mine")
def my_properties(
    current_user=Depends(get_current_user),
):

    try:

        from app.database.supabase import get_supabase

        supabase = get_supabase()

        response = (
            supabase
            .table("properties")
            .select("*")
            .eq("seller_id", current_user.id)
            .order("created_at", desc=True)
            .execute()
        )

        return {
            "success": True,
            "count": len(response.data),
            "properties": response.data,
        }

    except Exception as error:

        print(
            "MY PROPERTIES ERROR:",
            repr(error),
        )

        raise HTTPException(
            status_code=500,
            detail=str(error),
        )
@router.get("/{property_id}")
def property_details(
    property_id: str,
):

    try:

        property_data = get_property_by_id(
            property_id
        )

        return {
            "success": True,
            "property": property_data,
        }

    except Exception as error:

        print(
            "PROPERTY DETAIL ERROR:",
            repr(error),
        )

        raise HTTPException(
            status_code=404,
            detail=str(error),
        )

