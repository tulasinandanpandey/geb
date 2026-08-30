# GEB Frontend Specification

## Framework

Next.js + TypeScript.

## Main Page

src/app/page.tsx

The homepage currently includes:
- property discovery
- property filters
- property map
- property cards
- location search
- AI entry point
- AI chatbot
- property details interaction

## Important Components

### GEBAIChat

src/components/ai/GEBAIChat.tsx

Responsibilities:
- open/close AI interface
- accept natural-language questions
- call FastAPI
- display AI answers
- display property recommendations
- display GEB Match Score
- display score breakdown
- allow property selection

### PropertyCard

src/components/properties/PropertyCard.tsx

Responsibilities:
- property image
- price
- type
- area
- title
- location
- investment score

Property cards should remain clickable when used in search results.

### PropertyMap

src/components/map/PropertyMap.tsx

Responsibilities:
- property markers
- selected property
- map-based property selection
- location search

### AuthProvider

src/components/auth/AuthProvider

Responsibilities:
- authentication state
- user
- roles
- sign out

## Property Type

Current frontend Property type contains:

id
title
propertyType
price
area
areaUnit
city
locality
latitude
longitude
image
images
source
sourceName
sourceUrl
investmentScore
featured
status
description
sellerId
createdAt
updatedAt

## AI Property

Backend AI properties use snake_case fields.

The frontend AI component should preserve compatibility with:

property_type
area_unit
investment_score
geb_match_score
geb_score_breakdown

## AI UX

Recommended flow:

User opens GEB AI
    ↓
User enters natural language
    ↓
AI analyzes
    ↓
AI response
    ↓
Matching property cards
    ↓
User clicks property
    ↓
Property details open

## Conversation UI

Current foundation:
- ChatMessage interface
- chatHistory state
- user messages
- assistant messages
- properties attached to assistant messages

The next goal is complete conversation rendering and contextual follow-up understanding.

## UX Requirements

AI must not feel like a generic chatbot.

It should communicate:
- what it understood
- what properties match
- why a property ranks highly
- important missing information
- relevant caveats

## Property Click Behavior

AI property cards MUST remain clickable.

Clicking a recommended property should call:

onPropertySelect(property)

and connect to the existing property details experience.

## Build Requirement

After frontend changes:

npm run build

must pass before considering the change complete.
