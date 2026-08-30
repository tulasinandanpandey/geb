# GEB Product Specification

## Product Name

Global Estate Bridge (GEB)

## Product Vision

GEB is an AI-powered real-estate marketplace and intelligence platform designed to simplify property discovery, comparison, investment analysis, and eventually cross-border real-estate transactions.

The product combines:

- Property marketplace
- Maps
- Seller listings
- AI search
- Retrieval-Augmented Generation
- Personalized property ranking
- Investment suitability analysis
- Future broker intelligence
- Future cross-border property discovery

## Core User Problem

Traditional property platforms primarily provide listings and filters.

GEB aims to answer a more important question:

"What property is actually suitable for me?"

The user should be able to describe their requirements naturally instead of manually configuring dozens of filters.

Example:

"I have 50 lakh, want a plot in Lucknow, moderate risk, and can hold it for 10 years."

GEB should understand the requirements, retrieve suitable properties, rank them, and explain the recommendation.

## User Types

### Buyer

Can:
- Search properties
- View maps
- View property details
- Use GEB AI
- Compare properties
- Receive personalized recommendations

### Seller

Can:
- Authenticate
- List properties
- Upload images
- View owned listings

### Broker

Future role:
- Manage listings
- Manage clients
- Receive buyer leads
- Provide local expertise

### Investor

Uses:
- Investment-focused AI
- Risk preferences
- Time horizons
- Appreciation/rental priorities
- Property ranking

### Cross-Border Buyer

Future capability:
- Discover property in another country
- Currency conversion
- Local market information
- Broker connection
- Document/legal workflows

### Admin

Future capability:
- Moderate listings
- Verify sellers
- Review reports
- Manage platform data

## Marketplace Features

Current:
- Property listing
- Property retrieval
- Property details
- Property images
- Property cards
- Map visualization
- Location search
- Authentication
- Seller-owned property listing

Future:
- Favorites
- Saved searches
- Property comparison
- Seller verification
- Broker profiles
- Property verification
- Notifications
- Leads

## AI Features

Current:
- Natural-language property queries
- Query analysis
- RAG retrieval
- Gemini response generation
- Investment suitability scoring
- GEB Match Score
- Personalized ranking
- Clickable AI property cards

Future:
- Conversation memory
- Preference profiles
- Better investment intelligence
- Property comparison
- Market intelligence
- Document intelligence
- Broker intelligence
- Cross-border intelligence

## Investment Intelligence

GEB must distinguish:

Database facts:
- Price
- Area
- Location
- Property type
- Investment score
- Description

GEB analysis:
- Budget fit
- Property-type fit
- Risk fit
- Time-horizon fit
- Priority fit
- Overall GEB Match Score

GEB must never represent a heuristic score as guaranteed financial performance.

## Cross-Border Vision

GEB should eventually support:

India ↔ USA

Example:

A US user can discover Indian properties.

An Indian user can discover US properties.

Future requirements include:
- Currency conversion
- Country-specific property rules
- Location intelligence
- Local broker discovery
- Documentation
- Verification
- Tax/legal guidance disclaimers
- Cross-border transaction workflow

## Product Principle

GEB should not simply answer:

"Here are properties."

It should answer:

"Based on what you told me, these properties appear to fit you best, and here is why."

## UX Principle

Every AI-recommended property should be actionable.

Clicking a property card should open the property's details.

The user should never be trapped inside the chatbot.
