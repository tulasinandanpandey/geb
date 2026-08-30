from typing import Optional


def _clamp(
    value: float,
    minimum: float = 0.0,
    maximum: float = 100.0,
) -> float:
    return max(
        minimum,
        min(value, maximum),
    )


def calculate_budget_fit(
    price: float,
    max_price: Optional[float],
) -> float:

    if max_price is None or max_price <= 0:
        return 70.0

    ratio = price / max_price

    if ratio <= 0.70:
        return 100.0

    if ratio <= 0.85:
        return 90.0

    if ratio <= 1.00:
        return 80.0

    return 40.0


def calculate_property_type_fit(
    property_type: Optional[str],
    purpose: Optional[str],
) -> float:

    if not property_type:
        return 70.0

    property_type = property_type.lower()

    if purpose == "long_term_investment":

        if property_type == "plot":
            return 100.0

        if property_type in {
            "commercial",
            "villa",
        }:
            return 80.0

        return 65.0

    if purpose == "rental_income":

        if property_type in {
            "apartment",
            "house",
            "villa",
            "commercial",
        }:
            return 100.0

        return 60.0

    if purpose == "future_home":

        if property_type in {
            "house",
            "apartment",
            "villa",
        }:
            return 100.0

        return 55.0

    return 80.0


def calculate_priority_fit(
    investment_score: Optional[float],
    priority: Optional[str],
) -> float:

    if priority == "affordability":
        return 90.0

    if priority == "property_size":
        return 80.0

    if priority == "location":
        return 80.0

    if priority == "rental_income":
        return 75.0

    if priority in {
        "appreciation",
        "balanced",
    }:

        if investment_score is None:
            return 50.0

        return _clamp(
            float(investment_score) * 10
        )

    if investment_score is None:
        return 50.0

    return _clamp(
        float(investment_score) * 10
    )


def calculate_risk_fit(
    investment_score: Optional[float],
    risk_preference: Optional[str],
) -> float:

    if not risk_preference:
        return 70.0

    if investment_score is None:
        return 50.0

    score = float(investment_score)

    if risk_preference == "conservative":

        if score >= 8.5:
            return 100.0

        if score >= 7.5:
            return 85.0

        if score >= 6.5:
            return 70.0

        return 50.0

    if risk_preference == "moderate":

        if score >= 8.0:
            return 100.0

        if score >= 7.0:
            return 90.0

        if score >= 6.0:
            return 75.0

        return 60.0

    if risk_preference == "aggressive":

        if score >= 8.0:
            return 85.0

        if score >= 7.0:
            return 90.0

        if score >= 6.0:
            return 95.0

        return 75.0

    return 70.0


def calculate_horizon_fit(
    purpose: Optional[str],
    time_horizon_years: Optional[float],
    property_type: Optional[str],
) -> float:

    if not time_horizon_years:
        return 70.0

    years = float(
        time_horizon_years
    )

    if purpose == "long_term_investment":

        if years >= 10:
            if property_type == "plot":
                return 100.0

            return 90.0

        if years >= 5:
            return 85.0

        return 65.0

    if purpose == "short_term_investment":

        if years <= 3:
            return 90.0

        if years <= 5:
            return 80.0

        return 60.0

    return 70.0


def calculate_investment_match(
    property_data: dict,
    *,
    max_price: Optional[float] = None,
    property_type: Optional[str] = None,
    purpose: Optional[str] = None,
    priority: Optional[str] = None,
    risk_preference: Optional[str] = None,
    time_horizon_years: Optional[float] = None,
) -> dict:

    price = float(
        property_data.get(
            "price",
            0,
        ) or 0
    )

    investment_score = property_data.get(
        "investment_score"
    )

    budget_fit = calculate_budget_fit(
        price,
        max_price,
    )

    investment_fit = (
        _clamp(
            float(investment_score) * 10
        )
        if investment_score is not None
        else 50.0
    )

    property_type_fit = calculate_property_type_fit(
        property_data.get("property_type"),
        purpose,
    )

    priority_fit = calculate_priority_fit(
        investment_score,
        priority,
    )

    risk_fit = calculate_risk_fit(
        investment_score,
        risk_preference,
    )

    horizon_fit = calculate_horizon_fit(
        purpose,
        time_horizon_years,
        property_data.get("property_type"),
    )

    locality_fit = (
        100.0
        if property_data.get("locality")
        else 60.0
    )

    area_fit = (
        100.0
        if property_data.get("area")
        and float(property_data.get("area") or 0) > 0
        else 50.0
    )

    match_score = (
        budget_fit * 0.20
        + investment_fit * 0.20
        + locality_fit * 0.10
        + property_type_fit * 0.15
        + area_fit * 0.10
        + priority_fit * 0.10
        + risk_fit * 0.10
        + horizon_fit * 0.05
    )

    return {
        "geb_match_score": round(
            _clamp(match_score),
            1,
        ),
        "budget_fit": round(
            budget_fit,
            1,
        ),
        "investment_fit": round(
            investment_fit,
            1,
        ),
        "location_fit": round(
            locality_fit,
            1,
        ),
        "property_type_fit": round(
            property_type_fit,
            1,
        ),
        "area_fit": round(
            area_fit,
            1,
        ),
        "priority_fit": round(
            priority_fit,
            1,
        ),
        "risk_fit": round(
            risk_fit,
            1,
        ),
        "horizon_fit": round(
            horizon_fit,
            1,
        ),
    }


def rank_properties(
    properties: list[dict],
    *,
    max_price: Optional[float] = None,
    property_type: Optional[str] = None,
    purpose: Optional[str] = None,
    priority: Optional[str] = None,
    risk_preference: Optional[str] = None,
    time_horizon_years: Optional[float] = None,
) -> list[dict]:

    ranked = []

    for property_data in properties:

        scoring = calculate_investment_match(
            property_data,
            max_price=max_price,
            property_type=property_type,
            purpose=purpose,
            priority=priority,
            risk_preference=risk_preference,
            time_horizon_years=time_horizon_years,
        )

        enriched_property = {
            **property_data,
            "geb_match_score": scoring[
                "geb_match_score"
            ],
            "geb_score_breakdown": scoring,
        }

        ranked.append(
            enriched_property
        )

    ranked.sort(
        key=lambda item: item[
            "geb_match_score"
        ],
        reverse=True,
    )

    return ranked
