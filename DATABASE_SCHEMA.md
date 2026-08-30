# GEB Database Specification

## Database

Supabase PostgreSQL.

## Main Table

properties

Known fields:

id
title
seller_id
status
property_type
price
area
area_unit
city
locality
latitude
longitude
image
images
investment_score
featured
description
created_at
updated_at

## Property Types

plot
house
apartment
villa
commercial

## Property Status

active

Other statuses may be introduced later.

## Seller Relationship

seller_id references the authenticated user where applicable.

Seller-owned properties should use the authenticated user's ID.

## Current Data Examples

Known test/demo properties include:
- Investment Residential Plot
- Premium Residential Plot
- GEB Premium Land Opportunity
- GEB Test Plot
- Premium Residential Plot listings

Actual database contents must always be queried rather than assumed.

## Storage

Supabase Storage bucket:

property-images

Used for property image uploads.

## Authentication

Supabase Auth is used.

Backend authentication validates the bearer token using Supabase Auth.

## Security

Never expose:
- service role keys
- private Supabase credentials
- Gemini API keys

Frontend should only use intentionally public environment variables.

## RLS

Property access policies must preserve:
- public/appropriate reading of active listings
- seller ownership for seller-specific operations

Do not weaken RLS merely to make a feature work.

## Future Tables

Potential future tables:

profiles
favorites
saved_searches
conversations
conversation_messages
property_views
property_comparisons
brokers
broker_properties
property_documents
property_verifications
market_data
cross_border_transactions

Do not create these tables until the corresponding feature is actually implemented.
