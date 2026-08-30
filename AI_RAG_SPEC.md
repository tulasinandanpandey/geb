# GEB AI and RAG Specification

## Objective

GEB AI converts natural-language real-estate requirements into structured search criteria, retrieves matching properties, ranks them, and generates grounded explanations.

## AI Stack

Gemini:
- Query understanding
- Natural-language generation

Python:
- Deterministic ranking
- Business rules
- Retrieval orchestration

Supabase:
- Property database

## Query Analyzer

File:

backend/app/services/rag/query_analyzer.py

The analyzer extracts:

- city
- locality
- property_type
- min_price
- max_price
- purpose
- time_horizon_years
- priority
- risk_preference

Allowed purposes:

- purchase
- long_term_investment
- rental_income
- short_term_investment
- future_home

Allowed property types:

- plot
- house
- apartment
- villa
- commercial

Allowed risk:

- conservative
- moderate
- aggressive

Allowed priorities:

- appreciation
- rental_income
- affordability
- location
- property_size
- balanced

## Retriever

File:

backend/app/services/rag/retriever.py

Current retrieval:
- active properties only
- optional city
- optional locality
- optional property type
- optional minimum price
- optional maximum price
- maximum 10 candidates
- ordered using investment score

## Investment Scoring

File:

backend/app/services/rag/investment_scorer.py

Current factors:

Budget Fit:
20%

Investment Fit:
20%

Location Fit:
10%

Property Type Fit:
15%

Area Fit:
10%

Priority Fit:
10%

Risk Fit:
10%

Time Horizon Fit:
5%

Total:
100%

## GEB Match Score

Range:

0-100

Interpretation:

It represents suitability against the user's supplied requirements.

It does NOT represent:
- guaranteed return
- expected appreciation
- guaranteed profit
- financial advice

## Long-Term Investment

Current logic prioritizes:
- plot suitability
- investment score
- budget
- locality
- area
- risk
- holding horizon

## Rental Income

Current logic prioritizes:
- apartment/house/villa/commercial suitability
- location
- budget
- area
- rental-relevant description information

Do not invent rental yields.

## Risk

Conservative:
- stronger preference toward higher recorded investment scores

Moderate:
- balanced suitability

Aggressive:
- allows more flexibility around the recorded score

These are heuristic rules.

## Time Horizon

Long-term:
10+ years receives strongest horizon fit.

5+ years:
strong fit.

Short-term:
short holding periods receive higher fit.

Do not convert horizon fit into predicted returns.

## Context Builder

File:

backend/app/services/rag/context_builder.py

The context must contain only retrieved property information and GEB-generated deterministic scores.

## Gemini Instructions

Gemini must:

1. Never invent properties.
2. Never invent prices.
3. Never invent locations.
4. Never invent areas.
5. Never invent investment scores.
6. Never invent rental yields.
7. Never invent appreciation percentages.
8. Never guarantee returns.
9. Explain recommendations using available context.
10. Distinguish facts from analysis.
11. Mention missing information.
12. Use GEB Match Score as a ranking signal.
13. Explain the score where useful.
14. Include financial-analysis disclaimer for investment recommendations.

## Current Limitation

The system currently performs separate Gemini calls for:
- query analysis
- answer generation

This can consume free-tier Gemini quota quickly.

Future optimization:
- deterministic follow-up interpretation where possible
- minimize unnecessary Gemini calls
- use structured Gemini responses where appropriate
- preserve grounding

## Conversation Memory

Current frontend foundation:
- chatHistory exists
- user messages can persist
- assistant messages can persist
- property results can remain attached to assistant messages

Current unfinished requirement:

Contextual follow-ups.

Examples:

"Find plots in Lucknow under 50 lakh."

then:

"Show me something cheaper."

or:

"Which one is safer?"

The system should retain relevant context.

Preferred first implementation:
- send recent conversation context from frontend
- contextual query analyzer interprets current message
- preserve previous requirements when current message omits them
- update only requirements explicitly changed by the user

Do not immediately introduce a database conversation system unless persistent conversations are required.
