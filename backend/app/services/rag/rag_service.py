from typing import Optional

from app.services.ai.gemini_service import gemini_service
from app.services.rag.retriever import retrieve_properties
from app.services.rag.context_builder import build_property_context
from app.services.rag.investment_scorer import rank_properties


SYSTEM_INSTRUCTIONS = """
You are GEB AI, an intelligent real-estate assistant for
Global Estate Bridge.

Your answers must be grounded in the property information
provided in the context.

Rules:

1. Never invent properties.
2. Never invent prices, locations, areas, investment scores,
   market data, appreciation rates, rental yields, or returns.
3. Recommend properties only from the provided context.
4. Explain why a property matches the user's requirements.
5. Distinguish database facts from your analysis.
6. When multiple properties are available, compare them.
7. For investment queries, rank the available properties
   according to the user's stated objective.
8. Use investment_score when it exists, but do not treat it
   as a guaranteed future return.
9. Consider budget, location, property type, area, investment
   score, and description when evaluating a property.
10. If important information is missing, say that it is missing.
11. Never guarantee profit or future appreciation.
12. Investment analysis is informational and not financial advice.
13. Keep answers clear, practical, and concise.
14. When a GEB Match Score is provided, use it as the primary
    ranking signal for matching properties.
15. Explain the GEB Match Score using its available breakdown.
16. Never claim that the GEB Match Score predicts profit or
    future appreciation.
"""


PURPOSE_INSTRUCTIONS = {
    "long_term_investment": """
The user is interested in LONG-TERM INVESTMENT.

Prioritize:
- potential suitability for holding over several years
- investment score
- location and locality information available in the data
- property type
- land/area
- price relative to the user's budget
- positive development or location signals explicitly present
  in the property description

Do not invent future appreciation percentages.
""",

    "rental_income": """
The user is interested in RENTAL INCOME.

Prioritize:
- property type suitability for rental use
- location/locality
- price relative to budget
- area
- any rental-relevant information explicitly present
  in the property data

Do not invent rental yields or monthly rent.
""",

    "short_term_investment": """
The user is interested in SHORT-TERM INVESTMENT.

Prioritize:
- investment score
- price/value relative to the user's budget
- location
- property type
- explicitly available market or development signals

Do not promise a short-term profit or invent appreciation rates.
""",

    "future_home": """
The user is looking for a property to use as a FUTURE HOME.

Prioritize:
- property type
- location/locality
- area
- price relative to budget
- description and suitability for residential use
""",

    "purchase": """
The user is primarily looking to PURCHASE a property.

Prioritize:
- fit with budget
- location
- property type
- area
- overall suitability
""",
}


def answer_property_query(
    message: str,
    city: Optional[str] = None,
    locality: Optional[str] = None,
    property_type: Optional[str] = None,
    listing_type: Optional[str] = None,
    bhk: Optional[int] = None,
    furnishing_status: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    purpose: Optional[str] = None,
    priority: Optional[str] = None,
    risk_preference: Optional[str] = None,
    time_horizon_years: Optional[float] = None,
):

    properties = retrieve_properties(
        city=city,
        locality=locality,
        property_type=property_type,
        listing_type=listing_type,
        bhk=bhk,
        furnishing_status=furnishing_status,
        min_price=min_price,
        max_price=max_price,
        limit=10,
    )

    properties = rank_properties(
        properties,
        max_price=max_price,
        property_type=property_type,
        purpose=purpose,
        priority=priority,
        risk_preference=risk_preference,
        time_horizon_years=time_horizon_years,
    )

    purpose_key = (
        purpose.strip().lower()
        if purpose
        else ""
    )
    priority_key = (
        priority.strip().lower()
        if priority
        else ""
    )

    msg_lower = message.lower()
    is_investment_query = (
        purpose_key in {"long_term_investment", "short_term_investment", "rental_income"}
        or priority_key in {"appreciation", "rental_income"}
        or any(word in msg_lower for word in ["invest", "investment", "appreciation", "rental income", "yield", "return", "worth in", "value in", "better", "best", "compare"])
    )

    if not properties:
        criteria = []
        if property_type:
            criteria.append(f"{property_type}s")
        else:
            criteria.append("properties")
        if city:
            criteria.append(f"in {city}")
        if locality:
            criteria.append(f"in {locality}")
        if max_price:
            if max_price >= 10000000:
                price_str = f"under ₹{max_price/10000000:.2f} Cr"
            else:
                price_str = f"under ₹{max_price/100000:.1f} L"
            criteria.append(price_str)

        criteria_str = " ".join(criteria)
        answer = f"I could not find any active {criteria_str} in the GEB property database."
        if is_investment_query:
            answer += "\n\n### Disclaimer\n" \
                      "GEB Match Score reflects suitability based on available property data. It does not predict or guarantee future returns or appreciation. This analysis is informational and not financial advice."
        return {
            "answer": answer,
            "properties": [],
            "count": 0,
        }

    context = build_property_context(
        properties
    )

    purpose_context = PURPOSE_INSTRUCTIONS.get(
        purpose_key,
        """
The user's purpose was not explicitly specified.

Infer the user's goal only from their question.
If the purpose is unclear, focus on matching the
explicit requirements and explain the trade-offs.
""",
    )

    if is_investment_query:
        format_instructions = """
Format your response as a professional investment analysis. You MUST use the following headers and structure exactly:

### Direct Recommendation
Provide a clear recommendation of the top property from the retrieved list. Specify its details in this format:
**[Property Title]**
* GEB Match Score: [Score]/100
* Price: [Price in lakhs/crores, e.g. ₹35 Lakh or ₹1.2 Crore]
* Area: [Area and unit, e.g. 1,500 sqft]
* Location: [Locality, City]
* Investment Score: [Score]/10 (if available, otherwise say "Investment Score is not available for this listing")

### Why It Matches
Explain the suitability of this property based on the user's criteria. Compare the score components (Budget fit, Property type fit, Priority fit, Risk fit, Horizon fit) to their requirements. Keep it concrete.

### Alternative Options
Provide details for the next best matching property (alternatives) from the retrieved list in this format:
**[Property Title]** (GEB Match Score: [Score]/100)
Explain why it is an alternative and why the user might select it instead (e.g. larger size, different locality). If no other properties exist, state: "No other matching properties were found in the database."

### Trade-offs
Explain the trade-offs between the top recommendation and the alternatives (e.g. paying more for Gomti Nagar vs. lower price in Sushant Golf City).

### Missing Information
State clearly what critical information is missing from the database and cannot be verified (e.g., legal status, future appreciation, rental yield, road width, etc.). Use this exact text:
"GEB currently does not have sufficient verified data to determine:
- legal title status
- future appreciation
- guaranteed return
- future infrastructure impact"

### Next Step
Provide actionable next steps (e.g. "I can compare these two in more detail or help you contact the seller to schedule a viewing.")

### Disclaimer
Include this exact disclaimer at the end of the response:
"GEB Match Score reflects suitability based on available property data. It does not predict or guarantee future returns or appreciation. This analysis is informational and not financial advice."
"""
    else:
        format_instructions = """
Format your response as a concise search results summary. Use the following structure:

- State how many matching properties were found.
- Highlight the top match using the header "### Top match" followed by its title, GEB Match Score (e.g., **GEB Match Score: XX.X/100**), price, area, location, and a brief "Why" explaining why it matches.
- List other matches under the header "### Other matches" with their names, GEB Match Scores, and price/size.
- Offer a useful next step.
- Ensure the tone is direct and concise.
"""

    prompt = f"""
{SYSTEM_INSTRUCTIONS}

USER QUESTION:
{message}

USER PURPOSE:
{purpose or "Not explicitly specified"}

PURPOSE-SPECIFIC ANALYSIS:
{purpose_context}

PROPERTY DATABASE CONTEXT:
{context}

RESPONSE FORMAT GUIDE:
{format_instructions}

TASK:
Answer the user's question using the property database context and the format guide above.
Do not mention "RAG", "retriever", "database context", or internal technical details.
End investment-related recommendations with the required disclaimer.
"""

    answer = gemini_service.generate(
        prompt
    )

    return {
        "answer": answer,
        "properties": properties,
        "count": len(properties),
    }



