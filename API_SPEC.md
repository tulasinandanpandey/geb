# GEB API Specification

Base backend:

FastAPI

Current local backend:

http://127.0.0.1:8000

## Health

GET /api/health

Response:

{
  "status": "healthy",
  "service": "geb-backend"
}

## Root

GET /

Returns GEB API status.

## Properties

GET /api/properties/

Returns active properties.

POST /api/properties/

Creates a property for the authenticated seller.

GET /api/properties/{property_id}

Returns a property by ID.

GET /api/properties/mine

Returns properties owned by the authenticated user.

## Uploads

Uploads are handled through:

app/api/routes/uploads.py

Images are stored in Supabase Storage.

## AI

POST /api/ai/chat

Request currently supports:

message
conversation
city
locality
property_type
min_price
max_price
purpose

Conversation items:

role
content

The backend additionally derives:

priority
risk_preference
time_horizon_years

using the query analyzer.

## AI Response

Expected response:

{
  "success": true,
  "answer": "...",
  "count": 0,
  "properties": []
}

Returned properties may contain:

geb_match_score
geb_score_breakdown

## Error Handling

Invalid requests:
400

Authentication problems:
401

Unexpected backend errors:
500

Property not found:
404

Do not expose sensitive backend exceptions to production users.

## API Design Rules

- Preserve existing routes.
- Avoid breaking response shapes.
- Add optional fields rather than removing existing fields.
- Keep frontend compatibility.
- Update this document whenever API contracts materially change.
