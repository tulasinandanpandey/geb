# GEB (Global Estate Bridge) - Project Summary

## Overview
**GEB (Global Estate Bridge)** is a next-generation real estate, land analysis, and civil engineering project execution platform. It empowers buyers, property sellers, real estate brokers, plot dealers, and civil engineers with AI-driven land analysis, interactive maps, dealer CRM & project monitoring, and seamless property listings.

---

## Key System Components

### 1. Capabilities & Account Roles
Users on GEB can select one or multiple roles based on their requirements:
* **Buyer**: Discover, compare, and analyze properties using AI deep-land analysis and interactive maps.
* **Seller**: List and manage properties (for sale or for rent).
* **Broker**: Connect buyers and sellers, manage property leads and land deals.
* **Dealer Services**: Verified land dealers managing plot inventory and land acquisitions.
* **Civil Engineer Services**: Structural engineering, site inspections, architectural CAD designs, soil testing, and construction supervision.

### 2. Dealer & Civil Engineer Marketplace & Onboarding
* **Onboarding Page (`/dealers/onboarding`)**:
  * Professional identity & qualification (Degree, Firm, Experience).
  * Profile photo / avatar upload via `ProfileImageUploader` component.
  * Specialization & Work capabilities selection (RCC Design, Soil Testing, Turnkey Construction, etc.).
  * Operating city, locality, hourly rate (₹), bio, phone, email.
* **Marketplace (`/dealers`)**:
  * Browse, filter, and search verified civil engineers and dealers by city, specialization, and experience.
  * Hire professionals with automated meeting scheduling via Dealer CRM Bot.
  * Trigger AI milestone & budget safety alerts.

### 3. Property Listing & Media Uploads
* **Property Listing (`/list-property`)**:
  * List properties for **Sale** or **Rent**.
  * Interactive map location picker powered by Leaflet & Nominatim geocoding.
  * Photo uploader supporting JPEG, PNG, WEBP files up to 5 MB each.
  * Property type selection (Plot, House, Apartment, Villa, Commercial).

---

## Backend Services & API Endpoints

The backend is built with **FastAPI** running on `http://127.0.0.1:8000`.

### Key Routers & Endpoints:
* `GET /api/health`: Health check endpoint.
* `GET /api/dealers`: List and filter dealers & civil engineers.
* `GET /api/dealers/me`: Fetch authenticated user's dealer profile.
* `POST /api/dealers/profile`: Create/update dealer & engineer profiles.
* `POST /api/uploads/profile-image`: Upload profile avatar with automatic fallback.
* `POST /api/uploads/property-image`: Upload property listing photos.
* `POST /api/projects`: Create project monitoring contracts and schedule initial consultations.
* `POST /api/land-analysis`: AI deep land analysis & satellite environmental check.
* `POST /api/ai/chat`: AI real estate assistant conversation endpoint.

---

## Development & Server Status

Both servers are active and configured for local development:
* **Backend Server**: FastAPI / Uvicorn running at `http://127.0.0.1:8000`
* **Frontend Server**: Next.js App Router running at `http://localhost:3000`
