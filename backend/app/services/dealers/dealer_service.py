import uuid
from typing import List, Optional, Dict, Any
from app.database.supabase import get_supabase

SAMPLE_DEALERS = [
    {
        "id": "dlr_1",
        "full_name": "Er. Vikramaditya Verma",
        "company_name": "Apex Structural & Civil BuildTech",
        "degree": "M.Tech Structural Engineering",
        "specialization": "Civil Engineering & Structural Construction",
        "experience_years": 14,
        "rating": 4.9,
        "completed_projects": 38,
        "city": "Lucknow",
        "locality": "Gomti Nagar",
        "hourly_rate": 2200,
        "bio": "Specialized in RCC frame structures, heavy plot foundations, and luxury residential villas in Uttar Pradesh.",
        "phone": "+91 98765 43210",
        "email": "vikram@apexbuild.in",
        "avatar_url": "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80",
        "skills": ["Structural RCC", "Foundation Engineering", "Soil Stabilization", "AutoCAD Architecture"],
        "work_capabilities": ["Structural RCC", "Foundation Engineering", "Soil Stabilization", "AutoCAD Architecture"],
        "is_verified": True
    },
    {
        "id": "dlr_2",
        "full_name": "Er. Priya Sharma",
        "company_name": "Urban Space Renovation Studio",
        "degree": "B.Tech Civil Engineering",
        "specialization": "Turnkey Residential Renovation & Interior Works",
        "experience_years": 9,
        "rating": 4.8,
        "completed_projects": 26,
        "city": "Lucknow",
        "locality": "Hazratganj",
        "hourly_rate": 1800,
        "bio": "Award-winning civil engineer specializing in complete home transformations, structural alterations, and high-end interiors.",
        "phone": "+91 98123 45678",
        "email": "priya@urbanspace.in",
        "avatar_url": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
        "skills": ["Interior Renovation", "Electrical & Plumbing", "3D Elevation", "Material Quality Control"],
        "work_capabilities": ["Interior Renovation", "Electrical & Plumbing", "3D Elevation", "Material Quality Control"],
        "is_verified": True
    },
    {
        "id": "dlr_3",
        "full_name": "Rajesh Kumar Soni",
        "company_name": "Soni Builders & Infrastructure",
        "degree": "Diploma in Civil & Surveying",
        "specialization": "Plot Land Development & Boundary Infrastructure",
        "experience_years": 18,
        "rating": 4.7,
        "completed_projects": 62,
        "city": "Delhi NCR",
        "locality": "Noida Sector 62",
        "hourly_rate": 2500,
        "bio": "Expert contractor in boundary walls, land leveling, drainage networks, and commercial structure erection.",
        "phone": "+91 99887 76655",
        "email": "rajesh@sonibuilders.com",
        "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
        "skills": ["Land Leveling", "Retaining Walls", "Drainage Infra", "Heavy Machinery Management"],
        "work_capabilities": ["Land Leveling", "Retaining Walls", "Drainage Infra", "Heavy Machinery Management"],
        "is_verified": True
    },
    {
        "id": "dlr_4",
        "full_name": "Ananya Roy",
        "company_name": "GreenTerra Sustainable Engineering",
        "degree": "B.Arch & M.Tech Environmental Civil",
        "specialization": "Eco-Friendly Construction & Solar Modular Homes",
        "experience_years": 7,
        "rating": 5.0,
        "completed_projects": 19,
        "city": "Bangalore",
        "locality": "Indiranagar",
        "hourly_rate": 2100,
        "bio": "Specialized in sustainable building materials, rainwater harvesting integration, and smart green energy homes.",
        "phone": "+91 97766 55443",
        "email": "ananya@greenterra.io",
        "avatar_url": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80",
        "skills": ["Green Building", "Solar Power Grid Setup", "Thermal Insulation", "Prefabricated Structures"],
        "work_capabilities": ["Green Building", "Solar Power Grid Setup", "Thermal Insulation", "Prefabricated Structures"],
        "is_verified": True
    }
]

# In-memory user profiles cache for instant persistence & fallbacks
import json
import os

CACHE_FILE_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "user_dealers_cache.json")

def _load_cache_from_file() -> Dict[str, Dict[str, Any]]:
    try:
        os.makedirs(os.path.dirname(CACHE_FILE_PATH), exist_ok=True)
        if os.path.exists(CACHE_FILE_PATH):
            with open(CACHE_FILE_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception as e:
        print(f"Error loading dealer cache file: {e}")
    return {}

def _save_cache_to_file(cache: Dict[str, Dict[str, Any]]):
    try:
        os.makedirs(os.path.dirname(CACHE_FILE_PATH), exist_ok=True)
        with open(CACHE_FILE_PATH, "w", encoding="utf-8") as f:
            json.dump(cache, f, indent=2)
    except Exception as e:
        print(f"Error saving dealer cache file: {e}")

USER_DEALERS_CACHE: Dict[str, Dict[str, Any]] = _load_cache_from_file()

def get_dealers(
    city: Optional[str] = None,
    specialization: Optional[str] = None,
    min_experience: Optional[int] = None,
    min_rating: Optional[float] = None,
    search_query: Optional[str] = None
) -> List[Dict[str, Any]]:
    db_dealers = []
    try:
        supabase = get_supabase()
        query = supabase.table("dealer_profiles").select("*")

        if city and city.lower() != "all":
            query = query.ilike("city", f"%{city}%")
        if specialization and specialization.lower() != "all":
            # Extract key words for ilike query
            spec_keyword = specialization.split("&")[0].split()[0] if specialization else ""
            if spec_keyword:
                query = query.ilike("specialization", f"%{spec_keyword}%")
        if min_experience:
            query = query.gte("experience_years", min_experience)
        if min_rating:
            query = query.gte("rating", min_rating)
        if search_query:
            query = query.or_(f"full_name.ilike.%{search_query}%,company_name.ilike.%{search_query}%,bio.ilike.%{search_query}%")

        res = query.order("rating", desc=True).execute()
        if res.data:
            db_dealers = res.data
    except Exception as e:
        print(f"Supabase dealer query notice: {e}")

    # Combine: User Created Dealers FIRST, then DB Dealers, then Sample Dealers
    merged_map: Dict[str, Dict[str, Any]] = {}

    # 1. User Created Dealers first
    for u_id, d in USER_DEALERS_CACHE.items():
        d_id = str(d.get("id") or f"dlr_cached_{u_id[:8]}")
        merged_map[d_id] = d

    # 2. DB Dealers
    for d in db_dealers:
        d_id = str(d.get("id") or "")
        if d_id and d_id not in merged_map:
            merged_map[d_id] = d

    # 3. Sample Dealers
    for d in SAMPLE_DEALERS:
        if d["id"] not in merged_map:
            merged_map[d["id"]] = d

    results = list(merged_map.values())

    # Apply python filters for precise matching
    if city and city.lower() != "all":
        results = [d for d in results if city.lower() in str(d.get("city", "")).lower()]
    if specialization and specialization.lower() != "all":
        # Flexibly match specialization key phrases (e.g., civil, soil, cad, turnkey, plot, eco)
        spec_lower = specialization.lower()
        key_terms = [t for t in ["civil", "soil", "cad", "turnkey", "plot", "eco", "arch"] if t in spec_lower]
        if key_terms:
            results = [
                d for d in results
                if any(kt in str(d.get("specialization", "")).lower() for kt in key_terms)
            ]
        else:
            results = [d for d in results if spec_lower in str(d.get("specialization", "")).lower()]
    if min_experience:
        results = [d for d in results if int(d.get("experience_years", 0) or 0) >= min_experience]
    if search_query:
        q = search_query.lower()
        results = [
            d for d in results
            if q in str(d.get("full_name", "")).lower()
            or q in str(d.get("company_name", "")).lower()
            or q in str(d.get("specialization", "")).lower()
            or q in str(d.get("bio", "")).lower()
            or any(q in str(s).lower() for s in (d.get("skills") or []))
        ]

    return results

def get_dealer_by_id(dealer_id: str) -> Optional[Dict[str, Any]]:
    # Check cache first
    for d in USER_DEALERS_CACHE.values():
        if str(d.get("id")) == dealer_id:
            return d

    try:
        supabase = get_supabase()
        res = supabase.table("dealer_profiles").select("*").eq("id", dealer_id).execute()
        if res.data and len(res.data) > 0:
            return res.data[0]
    except Exception as e:
        print(f"Error fetching dealer by id: {e}")

    for d in SAMPLE_DEALERS:
        if str(d["id"]) == dealer_id:
            return d

    return SAMPLE_DEALERS[0] if SAMPLE_DEALERS else None

def get_dealer_by_user_id(user_id: str) -> Optional[Dict[str, Any]]:
    if not user_id:
        return None

    # 1. Check in-memory/file cache first for immediate return
    if user_id in USER_DEALERS_CACHE:
        return USER_DEALERS_CACHE[user_id]

    # Check fallback guest ID mapping
    for uid, prof in USER_DEALERS_CACHE.items():
        if prof.get("user_id") == user_id or uid == user_id:
            return prof

    # 2. Check Supabase table
    try:
        supabase = get_supabase()
        res = supabase.table("dealer_profiles").select("*").eq("user_id", user_id).execute()
        if res.data and len(res.data) > 0:
            USER_DEALERS_CACHE[user_id] = res.data[0]
            _save_cache_to_file(USER_DEALERS_CACHE)
            return res.data[0]
    except Exception as e:
        print(f"Error fetching dealer by user id: {e}")

    return None

def upsert_dealer_profile(user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    supabase = get_supabase()
    existing = get_dealer_by_user_id(user_id)
    
    dealer_id = existing.get("id") if existing else str(uuid.uuid4())
    skills = data.get("skills") or data.get("work_capabilities") or ["Structural RCC", "Site Inspection"]
    if isinstance(skills, str):
        skills = [s.strip() for s in skills.split(",") if s.strip()]

    # Full frontend representation (includes degree & work_capabilities)
    full_profile = {
        "id": dealer_id,
        "user_id": user_id,
        "full_name": data.get("full_name", "Er. Civil Engineer"),
        "company_name": data.get("company_name", ""),
        "degree": data.get("degree", "B.Tech Civil Engineering"),
        "specialization": data.get("specialization", "Civil Engineering & Structural Construction"),
        "experience_years": int(data.get("experience_years", 5) or 5),
        "rating": 5.0,
        "completed_projects": int(data.get("completed_projects", 1) or 1),
        "city": data.get("city", "Lucknow"),
        "locality": data.get("locality", "Gomti Nagar"),
        "hourly_rate": float(data.get("hourly_rate", 1800) or 1800),
        "bio": data.get("bio", ""),
        "phone": data.get("phone", ""),
        "email": data.get("email", ""),
        "avatar_url": data.get("avatar_url", "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80"),
        "skills": skills,
        "work_capabilities": skills,
        "is_verified": True
    }

    # Store in memory & file cache immediately so user is listed instantly
    USER_DEALERS_CACHE[user_id] = full_profile
    _save_cache_to_file(USER_DEALERS_CACHE)

    # Database clean payload matching only valid columns of dealer_profiles table in Supabase
    db_payload = {
        "full_name": full_profile["full_name"],
        "company_name": full_profile["company_name"],
        "specialization": full_profile["specialization"],
        "experience_years": full_profile["experience_years"],
        "rating": full_profile["rating"],
        "completed_projects": full_profile["completed_projects"],
        "city": full_profile["city"],
        "locality": full_profile["locality"],
        "hourly_rate": full_profile["hourly_rate"],
        "bio": full_profile["bio"],
        "phone": full_profile["phone"],
        "email": full_profile["email"],
        "avatar_url": full_profile["avatar_url"],
        "skills": full_profile["skills"],
        "is_verified": True
    }

    # Sync roles in user_roles table if user_id is valid
    if user_id and len(user_id) > 10:
        try:
            supabase.table("user_roles").upsert(
                [{"user_id": user_id, "role": "dealer"}, {"user_id": user_id, "role": "engineer"}],
                on_conflict="user_id,role"
            ).execute()
        except Exception as role_err:
            try:
                supabase.table("user_roles").insert([
                    {"user_id": user_id, "role": "dealer"},
                    {"user_id": user_id, "role": "engineer"}
                ]).execute()
            except Exception:
                pass

    # Try updating or inserting into Supabase dealer_profiles table
    try:
        if existing and existing.get("id"):
            db_payload["user_id"] = user_id
            res = supabase.table("dealer_profiles").update(db_payload).eq("id", existing["id"]).execute()
            if res.data:
                full_profile.update(res.data[0])
                USER_DEALERS_CACHE[user_id] = full_profile
                _save_cache_to_file(USER_DEALERS_CACHE)
        else:
            db_payload["id"] = dealer_id
            db_payload["user_id"] = user_id
            res = supabase.table("dealer_profiles").insert(db_payload).execute()
            if res.data:
                full_profile.update(res.data[0])
                USER_DEALERS_CACHE[user_id] = full_profile
                _save_cache_to_file(USER_DEALERS_CACHE)
    except Exception as e:
        print(f"Supabase save notice (falling back to memory cache): {e}")
        try:
            db_payload_no_fk = {k: v for k, v in db_payload.items() if k != "user_id"}
            db_payload_no_fk["id"] = dealer_id
            res_no_fk = supabase.table("dealer_profiles").insert(db_payload_no_fk).execute()
            if res_no_fk.data:
                full_profile.update(res_no_fk.data[0])
                USER_DEALERS_CACHE[user_id] = full_profile
                _save_cache_to_file(USER_DEALERS_CACHE)
        except Exception as err2:
            print(f"DB insert notice: {err2}")

    return USER_DEALERS_CACHE[user_id]

