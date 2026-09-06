import uuid
import json
import os
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from app.database.supabase import get_supabase
from app.services.dealers.dealer_service import get_dealer_by_id, get_dealer_by_user_id

PROJECTS_CACHE_FILE = os.path.join(os.path.dirname(__file__), "..", "..", "data", "user_projects_cache.json")

def _load_projects_cache() -> Dict[str, Dict[str, Any]]:
    try:
        os.makedirs(os.path.dirname(PROJECTS_CACHE_FILE), exist_ok=True)
        if os.path.exists(PROJECTS_CACHE_FILE):
            with open(PROJECTS_CACHE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception as e:
        print(f"Notice loading projects cache file: {e}")
    return {}

def _save_projects_cache(cache: Dict[str, Dict[str, Any]]):
    try:
        os.makedirs(os.path.dirname(PROJECTS_CACHE_FILE), exist_ok=True)
        with open(PROJECTS_CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(cache, f, indent=2)
    except Exception as e:
        print(f"Notice saving projects cache file: {e}")

USER_PROJECTS_CACHE: Dict[str, Dict[str, Any]] = _load_projects_cache()

def create_project(
    buyer_id: str,
    dealer_id: str,
    title: str,
    total_budget: float,
    target_completion_date: str,
    description: Optional[str] = "",
    project_type: Optional[str] = "construction",
    property_id: Optional[str] = None,
    city: Optional[str] = "Lucknow",
    locality: Optional[str] = "",
    preferred_meeting_date: Optional[str] = None,
    preferred_meeting_time: Optional[str] = None,
    initial_message: Optional[str] = None
) -> Dict[str, Any]:
    supabase = get_supabase()
    
    project_id = str(uuid.uuid4())
    project_payload = {
        "id": project_id,
        "buyer_id": buyer_id,
        "dealer_id": dealer_id,
        "title": title,
        "description": description or "",
        "project_type": project_type or "construction",
        "total_budget": total_budget,
        "spent_amount": 0,
        "progress_pct": 0,
        "status": "active",
        "start_date": datetime.now().strftime("%Y-%m-%d"),
        "target_completion_date": target_completion_date,
        "property_id": property_id,
        "city": city or "Lucknow",
        "locality": locality or ""
    }
    
    try:
        res = supabase.table("projects").insert(project_payload).execute()
        if res.data and len(res.data) > 0:
            project_payload = res.data[0]
            project_id = project_payload["id"]
    except Exception as e:
        print(f"Supabase project insert notice (using memory fallback): {e}")

    USER_PROJECTS_CACHE[project_id] = project_payload
    _save_projects_cache(USER_PROJECTS_CACHE)
    
    # Auto-generate standard construction/renovation milestones
    start_dt = datetime.now()
    try:
        target_dt = datetime.strptime(target_completion_date, "%Y-%m-%d")
    except Exception:
        target_dt = start_dt + timedelta(days=90)
        
    total_days = max((target_dt - start_dt).days, 30)
    
    m1_date = (start_dt + timedelta(days=int(total_days * 0.25))).strftime("%Y-%m-%d")
    m2_date = (start_dt + timedelta(days=int(total_days * 0.55))).strftime("%Y-%m-%d")
    m3_date = (start_dt + timedelta(days=int(total_days * 0.80))).strftime("%Y-%m-%d")
    m4_date = target_dt.strftime("%Y-%m-%d")
    
    default_milestones = [
        {
            "id": f"m1_{project_id[:8]}",
            "project_id": project_id,
            "title": "Phase 1: Site Prep, Excavation & Foundation",
            "description": "Soil testing, site clearing, footings, and plinth beam casting.",
            "target_date": m1_date,
            "budget_allocated": total_budget * 0.25,
            "spent": 0,
            "progress_pct": 0,
            "status": "in_progress"
        },
        {
            "id": f"m2_{project_id[:8]}",
            "project_id": project_id,
            "title": "Phase 2: Structural RCC Frame & Brickwork",
            "description": "Column casting, slab casting, exterior and interior masonry walls.",
            "target_date": m2_date,
            "budget_allocated": total_budget * 0.35,
            "spent": 0,
            "progress_pct": 0,
            "status": "pending"
        },
        {
            "id": f"m3_{project_id[:8]}",
            "project_id": project_id,
            "title": "Phase 3: MEP (Mechanical, Electrical, Plumbing) & Plastering",
            "description": "Conduit piping, water line layout, wall plastering, and door frames.",
            "target_date": m3_date,
            "budget_allocated": total_budget * 0.25,
            "spent": 0,
            "progress_pct": 0,
            "status": "pending"
        },
        {
            "id": f"m4_{project_id[:8]}",
            "project_id": project_id,
            "title": "Phase 4: Flooring, Paint, Fixtures & Handover",
            "description": "Tiling, painting, sanitaryware installation, final inspection & handover.",
            "target_date": m4_date,
            "budget_allocated": total_budget * 0.15,
            "spent": 0,
            "progress_pct": 0,
            "status": "pending"
        }
    ]
    
    try:
        supabase.table("project_milestones").insert(default_milestones).execute()
    except Exception as e:
        print(f"Notice inserting project milestones: {e}")
        
    project_payload["milestones"] = default_milestones

    # Fetch dealer profile details for CRM Bot auto-reply
    dealer_info = get_dealer_by_id(dealer_id) or {}
    dealer_name = dealer_info.get("full_name", "Dealer Engineer")
    dealer_user_id = dealer_info.get("user_id")
    
    # 1. Send Buyer's initial hire & project request message if provided
    buyer_msg_text = initial_message or f"Hello, I would like to hire your engineering team for project '{title}' with a budget of ₹{total_budget:,.2f}. Target date: {target_completion_date}."
    buyer_msg = {
        "id": f"msg1_{project_id[:8]}",
        "project_id": project_id,
        "sender_name": "Buyer Client",
        "sender_role": "buyer",
        "message": buyer_msg_text,
        "created_at": datetime.now().isoformat()
    }
    try:
        supabase.table("project_messages").insert({"project_id": project_id, "sender_name": "Buyer Client", "sender_role": "buyer", "message": buyer_msg_text}).execute()
    except Exception as e:
        print(f"Notice inserting buyer message: {e}")
    
    # 2. Dealer CRM Bot Automated Reply & Consultation Meeting Confirmation
    meeting_date_str = preferred_meeting_date or (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d")
    meeting_time_str = preferred_meeting_time or "10:30 AM"
    
    crm_bot_msg = (
        f"👋 Hello! Thank you for choosing {dealer_name} for your project '{title}'. "
        f"I am {dealer_name}'s automated GEB CRM Assistant.\n\n"
        f"✅ Your project request and budget allocation of ₹{total_budget:,.2f} have been received. "
        f"I have scheduled your initial project consultation & site meeting for **{meeting_date_str} at {meeting_time_str}**.\n\n"
        f"Our senior engineering team will review your specifications ({city or 'Site Location'}). "
        f"You can monitor all milestone updates, site logs, and invoices in your GEB Dashboard!"
    )
    
    bot_reply = {
        "id": f"msg2_{project_id[:8]}",
        "project_id": project_id,
        "sender_name": f"{dealer_name}'s CRM Bot",
        "sender_role": "ai",
        "message": crm_bot_msg,
        "created_at": datetime.now().isoformat()
    }
    try:
        supabase.table("project_messages").insert({"project_id": project_id, "sender_name": f"{dealer_name}'s CRM Bot", "sender_role": "ai", "message": crm_bot_msg}).execute()
    except Exception as e:
        print(f"Notice inserting bot message: {e}")

    project_payload["messages"] = [buyer_msg, bot_reply]
    project_payload["updates"] = []
    project_payload["expenses"] = []
    
    # 3. Create Meeting record in Supabase meetings table (if dealer_user_id available)
    if dealer_user_id:
        try:
            meeting_payload = {
                "buyer_id": buyer_id,
                "seller_id": dealer_user_id,
                "requested_date": meeting_date_str,
                "requested_time": meeting_time_str,
                "status": "confirmed",
            }
            if property_id:
                meeting_payload["property_id"] = property_id
            supabase.table("meetings").insert(meeting_payload).execute()
        except Exception as e:
            print(f"Note: Could not insert into meetings table directly: {e}")
            
    project_payload["scheduled_meeting"] = {
        "date": meeting_date_str,
        "time": meeting_time_str,
        "status": "confirmed",
        "bot_response": crm_bot_msg
    }

    USER_PROJECTS_CACHE[project_id] = project_payload
    _save_projects_cache(USER_PROJECTS_CACHE)
    
    return project_payload

def get_user_projects(user_id: str) -> List[Dict[str, Any]]:
    supabase = get_supabase()
    db_projects = []
    try:
        buyer_res = supabase.table("projects").select("*, dealer:dealer_profiles(*)").eq("buyer_id", user_id).order("created_at", desc=True).execute()
        db_projects.extend(buyer_res.data or [])
    except Exception as e:
        print(f"Notice fetching buyer projects from DB: {e}")

    dealer_prof = get_dealer_by_user_id(user_id)
    if dealer_prof and dealer_prof.get("id"):
        dealer_id = dealer_prof["id"]
        try:
            dealer_projects_res = supabase.table("projects").select("*, dealer:dealer_profiles(*)").eq("dealer_id", dealer_id).order("created_at", desc=True).execute()
            db_projects.extend(dealer_projects_res.data or [])
        except Exception as e:
            print(f"Notice fetching dealer projects from DB: {e}")
            
    combined = list(USER_PROJECTS_CACHE.values()) + db_projects
    seen = set()
    unique_projects = []
    for p in combined:
        if p.get("id") and p["id"] not in seen:
            seen.add(p["id"])
            unique_projects.append(p)
            
    return unique_projects

def get_project_details(project_id: str) -> Optional[Dict[str, Any]]:
    if project_id in USER_PROJECTS_CACHE:
        return USER_PROJECTS_CACHE[project_id]

    supabase = get_supabase()
    try:
        proj_res = supabase.table("projects").select("*, dealer:dealer_profiles(*)").eq("id", project_id).execute()
        if proj_res.data and len(proj_res.data) > 0:
            project = proj_res.data[0]
            
            m_res = supabase.table("project_milestones").select("*").eq("project_id", project_id).order("target_date", desc=False).execute()
            project["milestones"] = m_res.data or []
            
            u_res = supabase.table("project_updates").select("*").eq("project_id", project_id).order("created_at", desc=True).execute()
            project["updates"] = u_res.data or []
            
            e_res = supabase.table("project_expenses").select("*").eq("project_id", project_id).order("created_at", desc=True).execute()
            project["expenses"] = e_res.data or []
            
            msg_res = supabase.table("project_messages").select("*").eq("project_id", project_id).order("created_at", desc=False).execute()
            project["messages"] = msg_res.data or []
            
            USER_PROJECTS_CACHE[project_id] = project
            _save_projects_cache(USER_PROJECTS_CACHE)
            return project
    except Exception as e:
        print(f"Error fetching project details from DB: {e}")

    return None
    project["expenses"] = e_res.data or []
    
    # Get project messages
    msg_res = supabase.table("project_messages").select("*").eq("project_id", project_id).order("created_at", desc=False).execute()
    project["messages"] = msg_res.data or []
    
    return project

def add_project_update(
    project_id: str,
    author_id: Optional[str],
    author_name: str,
    author_role: str,
    title: str,
    notes: str,
    progress_delta: float = 0
) -> Dict[str, Any]:
    supabase = get_supabase()
    
    update_data = {
        "project_id": project_id,
        "author_id": author_id,
        "author_name": author_name,
        "author_role": author_role,
        "title": title,
        "notes": notes,
        "progress_delta": progress_delta,
        "log_date": datetime.now().strftime("%Y-%m-%d")
    }
    
    res = supabase.table("project_updates").insert(update_data).execute()
    new_update = res.data[0] if res.data else update_data
    
    # Update overall project progress % if progress_delta provided
    if progress_delta > 0:
        proj = supabase.table("projects").select("progress_pct").eq("id", project_id).execute()
        if proj.data:
            current_pct = float(proj.data[0].get("progress_pct") or 0)
            new_pct = min(100.0, current_pct + float(progress_delta))
            supabase.table("projects").update({"progress_pct": new_pct, "updated_at": datetime.now().isoformat()}).eq("id", project_id).execute()
            
    return new_update

def add_project_expense(
    project_id: str,
    uploaded_by: Optional[str],
    title: str,
    category: str,
    amount: float,
    vendor: Optional[str] = "",
    file_url: Optional[str] = "",
    notes: Optional[str] = ""
) -> Dict[str, Any]:
    supabase = get_supabase()
    
    expense_data = {
        "project_id": project_id,
        "uploaded_by": uploaded_by,
        "title": title,
        "category": category,
        "amount": amount,
        "vendor": vendor or "",
        "file_url": file_url or "",
        "notes": notes or "",
        "expense_date": datetime.now().strftime("%Y-%m-%d")
    }
    
    res = supabase.table("project_expenses").insert(expense_data).execute()
    new_exp = res.data[0] if res.data else expense_data
    
    # Recalculate total spent_amount for project
    if amount > 0:
        exp_list = supabase.table("project_expenses").select("amount").eq("project_id", project_id).execute()
        total_spent = sum(float(x.get("amount") or 0) for x in (exp_list.data or []))
        supabase.table("projects").update({"spent_amount": total_spent, "updated_at": datetime.now().isoformat()}).eq("id", project_id).execute()
        
    return new_exp

def update_milestone_progress(
    milestone_id: str,
    progress_pct: float,
    status: Optional[str] = None
) -> Dict[str, Any]:
    supabase = get_supabase()
    
    update_fields: Dict[str, Any] = {"progress_pct": progress_pct}
    if status:
        update_fields["status"] = status
    elif progress_pct >= 100:
        update_fields["status"] = "completed"
        update_fields["completed_date"] = datetime.now().strftime("%Y-%m-%d")
    elif progress_pct > 0:
        update_fields["status"] = "in_progress"
        
    res = supabase.table("project_milestones").update(update_fields).eq("id", milestone_id).execute()
    
    # Recalculate project total progress % from all milestones
    if res.data and len(res.data) > 0:
        m_item = res.data[0]
        project_id = m_item["project_id"]
        all_m = supabase.table("project_milestones").select("progress_pct").eq("project_id", project_id).execute()
        if all_m.data and len(all_m.data) > 0:
            avg_pct = sum(float(x.get("progress_pct") or 0) for x in all_m.data) / len(all_m.data)
            supabase.table("projects").update({"progress_pct": round(avg_pct, 2), "updated_at": datetime.now().isoformat()}).eq("id", project_id).execute()
            
    return res.data[0] if res.data else {}

def add_project_message(
    project_id: str,
    sender_id: Optional[str],
    sender_name: str,
    sender_role: str,
    message: str
) -> Dict[str, Any]:
    supabase = get_supabase()
    msg_data = {
        "project_id": project_id,
        "sender_id": sender_id,
        "sender_name": sender_name,
        "sender_role": sender_role,
        "message": message
    }
    res = supabase.table("project_messages").insert(msg_data).execute()
    return res.data[0] if res.data else msg_data
