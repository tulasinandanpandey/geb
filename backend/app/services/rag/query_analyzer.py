import json
import re
from typing import Optional

from app.services.ai.gemini_service import gemini_service


ALLOWED_PURPOSES = {
    "purchase",
    "long_term_investment",
    "rental_income",
    "short_term_investment",
    "future_home",
}

ALLOWED_PROPERTY_TYPES = {
    "plot",
    "house",
    "apartment",
    "villa",
    "commercial",
}

ALLOWED_RISK_PREFERENCES = {
    "conservative",
    "moderate",
    "aggressive",
}

ALLOWED_PRIORITIES = {
    "appreciation",
    "rental_income",
    "affordability",
    "location",
    "property_size",
    "balanced",
}

EMPTY_ANALYSIS = {
    "city": None,
    "locality": None,
    "property_type": None,
    "min_price": None,
    "max_price": None,
    "purpose": None,
    "time_horizon_years": None,
    "priority": None,
    "risk_preference": None,
}


QUERY_ANALYZER_PROMPT = """
You are the GEB AI query analyzer.

Your job is to extract structured real-estate search requirements
from the user's natural-language message.

Return ONLY valid JSON.

Allowed values:

purpose:
- purchase
- long_term_investment
- rental_income
- short_term_investment
- future_home
- null

property_type:
- plot
- house
- apartment
- villa
- commercial
- null

risk_preference:
- conservative
- moderate
- aggressive
- null

priority:
- appreciation
- rental_income
- affordability
- location
- property_size
- balanced
- null

Extract:

city
locality
property_type
min_price
max_price
purpose
time_horizon_years
priority
risk_preference

Rules:

1. Do not invent information.
2. If the user does not provide a value, return null.
3. Prices must be numbers in INR.
4. Convert lakh/crore into INR.
5. "50 lakh" = 5000000.
6. "1 crore" = 10000000.
7. "long term", "hold for years", or similar language may indicate
   long_term_investment.
8. A specific duration such as "10 years" should become
   time_horizon_years: 10.
9. If the user says they want rental income, use rental_income.
10. If the user says they want a property to live in, use future_home
    or purchase depending on the wording.
11. Do not guess city or locality from context.
12. Return exactly the requested JSON fields.

Required JSON format:

{
  "city": null,
  "locality": null,
  "property_type": null,
  "min_price": null,
  "max_price": null,
  "purpose": null,
  "time_horizon_years": null,
  "priority": null,
  "risk_preference": null
}
"""


def _empty_analysis() -> dict:
    return {**EMPTY_ANALYSIS}


def _normalize_text(value: str) -> str:
    return value.strip().lower()


def _parse_amount_to_inr(
    amount: str,
    unit: str | None,
) -> float:
    value = float(amount.replace(",", ""))
    normalized_unit = (unit or "").lower()

    if normalized_unit in {"l", "lac", "lakh", "lakhs"}:
        return value * 100000

    if normalized_unit in {"cr", "crore", "crores"}:
        return value * 10000000

    return value


def _extract_price_bounds(
    text: str,
    result: dict,
) -> None:
    amount_pattern = (
        r"(\d+(?:,\d+)*(?:\.\d+)?)\s*"
        r"(lakh|lakhs|lac|l|crore|crores|cr)?"
    )

    between_match = re.search(
        rf"(?:between|from)\s+{amount_pattern}\s+"
        rf"(?:and|to|-)\s+{amount_pattern}",
        text,
    )

    if between_match:
        first_unit = between_match.group(2)
        second_unit = between_match.group(4)

        if not first_unit and second_unit:
            first_unit = second_unit

        result["min_price"] = _parse_amount_to_inr(
            between_match.group(1),
            first_unit,
        )
        result["max_price"] = _parse_amount_to_inr(
            between_match.group(3),
            second_unit,
        )
        return

    under_match = re.search(
        rf"(?:under|below|less than|up to|upto|max|maximum)\s+{amount_pattern}",
        text,
    )

    if under_match:
        result["max_price"] = _parse_amount_to_inr(
            under_match.group(1),
            under_match.group(2),
        )

    over_match = re.search(
        rf"(?:over|above|more than|min|minimum|at least)\s+{amount_pattern}",
        text,
    )

    if over_match:
        result["min_price"] = _parse_amount_to_inr(
            over_match.group(1),
            over_match.group(2),
        )


def _deterministic_analyze(message: str) -> dict:
    result = _empty_analysis()
    text = _normalize_text(message)

    city_match = re.search(
        r"\bin\s+([a-z][a-z\s]+?)(?:\s+(?:under|below|between|from|for|with|as|near|around)|[.!?]|$)",
        text,
    )

    if city_match:
        result["city"] = city_match.group(1).strip().title()

    if re.search(r"\bplots?\b", text):
        result["property_type"] = "plot"
    elif re.search(r"\bhouses?\b", text):
        result["property_type"] = "house"
    elif re.search(r"\bapartments?|flats?\b", text):
        result["property_type"] = "apartment"
    elif re.search(r"\bvillas?\b", text):
        result["property_type"] = "villa"
    elif re.search(r"\bcommercial\b", text):
        result["property_type"] = "commercial"

    _extract_price_bounds(text, result)

    if re.search(r"\b(long[-\s]?term|hold|investment|investor)\b", text):
        result["purpose"] = "long_term_investment"
        result["priority"] = "appreciation"

    if re.search(r"\brental income|rent income|rentals?|rental\b", text):
        result["purpose"] = "rental_income"
        result["priority"] = "rental_income"

    if re.search(r"\bfuture home|live in|living|own home|residence\b", text):
        result["purpose"] = "future_home"

    if re.search(r"\bbuy|purchase\b", text) and not result["purpose"]:
        result["purpose"] = "purchase"

    if re.search(r"\bmoderate[-\s]?risk|moderate risk\b", text):
        result["risk_preference"] = "moderate"
    elif re.search(r"\bconservative|low[-\s]?risk|safe|safer\b", text):
        result["risk_preference"] = "conservative"
    elif re.search(r"\baggressive|high[-\s]?risk\b", text):
        result["risk_preference"] = "aggressive"

    if re.search(r"\bcheaper|affordable|affordability\b", text):
        result["priority"] = "affordability"

    if re.search(r"\bbigger|larger|size|area\b", text):
        result["priority"] = "property_size"

    horizon_match = re.search(
        r"(\d+(?:\.\d+)?)\s*(?:year|years|yr|yrs)\b",
        text,
    )

    if horizon_match:
        result["time_horizon_years"] = float(horizon_match.group(1))

    return result


def _merge_analysis(
    primary: dict,
    fallback: dict,
) -> dict:
    merged = _empty_analysis()

    for key in merged:
        merged[key] = (
            primary.get(key)
            if primary.get(key) is not None
            else fallback.get(key)
        )

    return merged


def _has_signal(result: dict) -> bool:
    return any(
        result.get(key) is not None
        for key in EMPTY_ANALYSIS
    )


def _sanitize_choice(
    value: object,
    allowed: set[str],
) -> Optional[str]:
    if not isinstance(value, str):
        return None

    normalized = value.strip().lower()

    if normalized in allowed:
        return normalized

    return None


def _sanitize_number(value: object) -> Optional[float]:
    if value is None:
        return None

    try:
        number = float(value)
    except (TypeError, ValueError):
        return None

    if number < 0:
        return None

    return number


def _sanitize_analysis(result: dict) -> dict:
    min_price = _sanitize_number(result.get("min_price"))
    max_price = _sanitize_number(result.get("max_price"))

    if (
        min_price is not None
        and max_price is not None
        and min_price > max_price
    ):
        min_price, max_price = max_price, min_price

    city = result.get("city")
    locality = result.get("locality")

    return {
        "city": city.strip() if isinstance(city, str) and city.strip() else None,
        "locality": locality.strip() if isinstance(locality, str) and locality.strip() else None,
        "property_type": _sanitize_choice(
            result.get("property_type"),
            ALLOWED_PROPERTY_TYPES,
        ),
        "min_price": min_price,
        "max_price": max_price,
        "purpose": _sanitize_choice(
            result.get("purpose"),
            ALLOWED_PURPOSES,
        ),
        "time_horizon_years": _sanitize_number(
            result.get("time_horizon_years")
        ),
        "priority": _sanitize_choice(
            result.get("priority"),
            ALLOWED_PRIORITIES,
        ),
        "risk_preference": _sanitize_choice(
            result.get("risk_preference"),
            ALLOWED_RISK_PREFERENCES,
        ),
    }


def _parse_json_response(
    response: str,
    error_label: str,
) -> dict:
    try:
        cleaned = response.strip()

        if cleaned.startswith("```"):
            cleaned = cleaned.replace(
                "```json",
                "",
                1,
            ).replace(
                "```",
                "",
            ).strip()

        return json.loads(cleaned)

    except json.JSONDecodeError as error:
        raise RuntimeError(f"{error_label}: {error}")


def analyze_query(message: str) -> dict:
    deterministic = _deterministic_analyze(message)

    if _has_signal(deterministic):
        return _sanitize_analysis(deterministic)

    prompt = f"""
{QUERY_ANALYZER_PROMPT}

USER MESSAGE:
{message}
"""

    response = gemini_service.generate(prompt)

    result = _parse_json_response(
        response,
        "GEB query analyzer returned invalid JSON",
    )

    return _sanitize_analysis(
        _merge_analysis(
            result,
            deterministic,
        )
    )


COMPARISON_FOLLOWUP_PATTERN = re.compile(
    r"\b(better|best|safer|safe|compare|comparison|top|second|first|third|why|explain|which|one|them|safer|cheaper|bigger|larger)\b",
    re.IGNORECASE
)


def accumulate_conversation_requirements(conversation: list[dict]) -> dict:
    accumulated = _empty_analysis()

    for item in conversation:
        if item.get("role") == "user":
            content = item.get("content", "")
            if not content.strip():
                continue

            msg_req = _deterministic_analyze(content)
            follow_up_text = _normalize_text(content)
            is_follow = bool(
                re.search(
                    r"\b(cheaper|safer|bigger|larger|something|one|what about|show me|more|less|under|above|budget)\b",
                    follow_up_text,
                )
            )

            if is_follow:
                if (
                    "cheaper" in follow_up_text
                    and accumulated.get("max_price") is not None
                ):
                    accumulated["max_price"] = round(
                        float(accumulated["max_price"]) * 0.85,
                        2,
                    )

                for key in accumulated:
                    if msg_req.get(key) is not None:
                        accumulated[key] = msg_req[key]
            else:
                if msg_req.get("city") is not None and msg_req.get("city") != accumulated.get("city"):
                    accumulated["locality"] = None

                for key in accumulated:
                    if msg_req.get(key) is not None:
                        accumulated[key] = msg_req[key]

    return accumulated


def analyze_query_with_context(
    message: str,
    conversation: list[dict] | None = None,
) -> dict:
    conversation = conversation or []

    accumulated = accumulate_conversation_requirements(conversation)
    current_req = _deterministic_analyze(message)
    follow_up_text = _normalize_text(message)

    is_follow = bool(
        conversation
        and (
            re.search(
                r"\b(cheaper|safer|bigger|larger|something|one|what about|show me|more|less|under|above|budget)\b",
                follow_up_text,
            )
            or COMPARISON_FOLLOWUP_PATTERN.search(follow_up_text)
        )
    )

    if is_follow:
        if (
            "cheaper" in follow_up_text
            and accumulated.get("max_price") is not None
        ):
            if current_req.get("max_price") is None:
                current_req["max_price"] = round(
                    float(accumulated["max_price"]) * 0.85,
                    2,
                )

        result = _merge_analysis(current_req, accumulated)

        if current_req.get("city") is not None and current_req.get("city") != accumulated.get("city"):
            result["locality"] = None

        return _sanitize_analysis(result)

    if _has_signal(current_req):
        return _sanitize_analysis(current_req)

    if conversation and _has_signal(accumulated):
        if COMPARISON_FOLLOWUP_PATTERN.search(follow_up_text):
            return _sanitize_analysis(accumulated)

    history = ""
    for item in conversation[-6:]:
        role = item.get("role", "user")
        content = item.get("content", "")
        history += f"\n{role.upper()}: {content}\n"

    prompt = f"""
{QUERY_ANALYZER_PROMPT}

PREVIOUS CONVERSATION:
{history or "No previous conversation."}

CURRENT USER MESSAGE:
{message}

IMPORTANT:

Interpret the CURRENT USER MESSAGE using the previous
conversation when necessary.

Preserve prior requirements when current message does not specify them.
Change only the dimensions explicitly modified by the user.

Return ONLY the required JSON.
"""

    try:
        response = gemini_service.generate(prompt)
        result = _parse_json_response(
            response,
            "GEB contextual query analyzer returned invalid JSON",
        )
        merged = _merge_analysis(result, current_req)
        merged = _merge_analysis(merged, accumulated)
        return _sanitize_analysis(merged)
    except Exception as error:
        print("QUERY ANALYZER GEMINI FALLBACK ERROR:", repr(error))
        return _sanitize_analysis(_merge_analysis(current_req, accumulated))
