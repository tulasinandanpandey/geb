# GEB Architecture

## High-Level Architecture

Browser
    |
    v
Next.js Frontend
    |
    v
FastAPI Backend
    |
    +------------------+
    |                  |
    v                  v
Supabase            Gemini
    |                  |
    +--------+---------+
             |
             v
          GEB RAG
             |
             +--> Query Analyzer
             |
             +--> Retriever
             |
             +--> Investment Scorer
             |
             +--> Context Builder
             |
             +--> Gemini Answer Generator

## Frontend

Location:

frontend/

Main application:
src/app/

Important components:

src/components/ai/GEBAIChat.tsx
src/components/properties/PropertyCard.tsx
src/components/map/PropertyMap.tsx
src/components/location/LocationPicker.tsx
src/components/upload/PropertyImageUploader.tsx
src/components/auth/AuthProvider

## Backend

Location:

backend/

Application:

backend/app/

Main entry:

app/main.py

API:

app/api/routes/

Services:

app/services/

## Backend Service Architecture

app/services/

ai/
    Gemini service

rag/
    Query analyzer
    Retriever
    Context builder
    Investment scorer
    RAG orchestration

properties/
    Property service

storage/
    Storage service

brokers/
    Future broker intelligence

ingestion/
    Future data ingestion

## Request Flow

### Normal property search

Frontend
    ↓
GET /api/properties/
    ↓
FastAPI
    ↓
Property service
    ↓
Supabase
    ↓
Frontend

### AI property search

Frontend
    ↓
POST /api/ai/chat
    ↓
Query Analyzer
    ↓
Structured requirements
    ↓
Retriever
    ↓
Supabase
    ↓
Candidate properties
    ↓
GEB Investment Scoring
    ↓
Ranked properties
    ↓
Context Builder
    ↓
Gemini
    ↓
AI explanation
    ↓
Frontend

## Architectural Rules

- Frontend does not directly access protected backend functionality.
- Backend owns business logic.
- Supabase owns persistent data.
- Gemini generates language and reasoning explanations.
- Deterministic scoring remains in Python.
- Gemini must not invent properties.
- Retrieval must happen before grounded AI recommendation.
- AI should not independently fabricate market data.

## Current Architecture Status

Stable MVP architecture.

Do not replace FastAPI, Supabase, Next.js, or Gemini without explicit approval.
