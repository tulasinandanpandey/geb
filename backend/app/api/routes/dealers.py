from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Optional, List, Dict, Any
from app.services.dealers.dealer_service import (
    get_dealers,
    get_dealer_by_id,
    get_dealer_by_user_id,
    upsert_dealer_profile,
)
from app.core.auth import get_current_user

router = APIRouter(prefix="/api/dealers", tags=["Dealers"])

def _get_user_id(user: Any) -> str:
    if isinstance(user, dict):
        return str(user.get("id") or user.get("sub") or "")
    return str(getattr(user, "id", getattr(user, "sub", "")) or "")

@router.get("")
def list_dealers(
    city: Optional[str] = Query(None),
    specialization: Optional[str] = Query(None),
    min_experience: Optional[int] = Query(None),
    min_rating: Optional[float] = Query(None),
    search: Optional[str] = Query(None),
):
    """
    Search and filter dealers/civil engineers for project monitoring and hiring.
    """
    dealers = get_dealers(
        city=city,
        specialization=specialization,
        min_experience=min_experience,
        min_rating=min_rating,
        search_query=search,
    )
    return {"dealers": dealers, "count": len(dealers)}

@router.get("/me")
def get_my_dealer_profile(current_user: Any = Depends(get_current_user)):
    user_id = _get_user_id(current_user)
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    dealer = get_dealer_by_user_id(user_id)
    return {"dealer": dealer}

@router.get("/{dealer_id}")
def get_dealer(dealer_id: str):
    dealer = get_dealer_by_id(dealer_id)
    if not dealer:
        raise HTTPException(status_code=404, detail="Dealer profile not found")
    return dealer

@router.post("/profile")
def save_dealer_profile(
    data: Dict[str, Any],
    current_user: Any = Depends(get_current_user),
):
    user_id = _get_user_id(current_user)
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    result = upsert_dealer_profile(user_id, data)
    return {"message": "Dealer profile saved", "dealer": result}

