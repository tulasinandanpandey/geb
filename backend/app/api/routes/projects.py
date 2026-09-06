from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional, List, Dict, Any
from app.services.projects.project_service import (
    create_project,
    get_user_projects,
    get_project_details,
    add_project_update,
    add_project_expense,
    update_milestone_progress,
    add_project_message,
)
from app.services.ai.project_ai import analyze_project_risks
from app.core.auth import get_current_user

router = APIRouter(prefix="/api/projects", tags=["Projects"])

def _extract_user_info(user: Any) -> tuple[str, str]:
    if isinstance(user, dict):
        uid = str(user.get("id") or user.get("sub") or "")
        email = str(user.get("email") or "")
    else:
        uid = str(getattr(user, "id", getattr(user, "sub", "")) or "")
        email = str(getattr(user, "email", "") or "")
    return uid, email

@router.post("")
def create_new_project(
    data: Dict[str, Any],
    current_user: Any = Depends(get_current_user),
):
    buyer_id, _ = _extract_user_info(current_user)
    if not buyer_id:
        raise HTTPException(status_code=401, detail="Authentication required")
        
    dealer_id = data.get("dealer_id")
    title = data.get("title")
    total_budget = float(data.get("total_budget") or 0)
    target_completion_date = data.get("target_completion_date")
    
    if not dealer_id or not title or not target_completion_date or total_budget <= 0:
        raise HTTPException(status_code=400, detail="Missing required fields: dealer_id, title, total_budget, target_completion_date")
        
    project = create_project(
        buyer_id=buyer_id,
        dealer_id=dealer_id,
        title=title,
        total_budget=total_budget,
        target_completion_date=target_completion_date,
        description=data.get("description"),
        project_type=data.get("project_type", "construction"),
        property_id=data.get("property_id"),
        city=data.get("city", "Lucknow"),
        locality=data.get("locality", ""),
        preferred_meeting_date=data.get("preferred_meeting_date"),
        preferred_meeting_time=data.get("preferred_meeting_time"),
        initial_message=data.get("initial_message")
    )
    
    return {"message": "Project created successfully", "project": project}

@router.get("")
def list_projects(current_user: Any = Depends(get_current_user)):
    user_id, _ = _extract_user_info(current_user)
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
        
    projects = get_user_projects(user_id)
    return {"projects": projects, "count": len(projects)}

@router.get("/{project_id}")
def get_project(project_id: str):
    project = get_project_details(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.post("/{project_id}/updates")
def post_update(
    project_id: str,
    data: Dict[str, Any],
    current_user: Any = Depends(get_current_user),
):
    author_id, author_email = _extract_user_info(current_user)
    author_name = data.get("author_name") or author_email.split("@")[0] if author_email else "User"
    author_role = data.get("author_role", "dealer")
    title = data.get("title", "Daily Site Update")
    notes = data.get("notes", "")
    progress_delta = float(data.get("progress_delta") or 0)
    
    if not notes:
        raise HTTPException(status_code=400, detail="Update notes cannot be empty")
        
    update_item = add_project_update(
        project_id=project_id,
        author_id=author_id,
        author_name=author_name,
        author_role=author_role,
        title=title,
        notes=notes,
        progress_delta=progress_delta
    )
    return {"message": "Update posted successfully", "update": update_item}

@router.post("/{project_id}/expenses")
def post_expense(
    project_id: str,
    data: Dict[str, Any],
    current_user: Any = Depends(get_current_user),
):
    uploaded_by, _ = _extract_user_info(current_user)
    title = data.get("title")
    category = data.get("category", "invoice")
    amount = float(data.get("amount") or 0)
    
    if not title:
        raise HTTPException(status_code=400, detail="Expense title is required")
        
    expense_item = add_project_expense(
        project_id=project_id,
        uploaded_by=uploaded_by,
        title=title,
        category=category,
        amount=amount,
        vendor=data.get("vendor", ""),
        file_url=data.get("file_url", ""),
        notes=data.get("notes", "")
    )
    return {"message": "Expense logged successfully", "expense": expense_item}

@router.patch("/{project_id}/milestones/{milestone_id}")
def update_milestone(
    project_id: str,
    milestone_id: str,
    data: Dict[str, Any],
):
    progress_pct = float(data.get("progress_pct") or 0)
    status = data.get("status")
    
    res = update_milestone_progress(milestone_id, progress_pct, status)
    return {"message": "Milestone updated", "milestone": res}

@router.get("/{project_id}/messages")
def get_messages(project_id: str):
    project = get_project_details(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"messages": project.get("messages", [])}

@router.post("/{project_id}/messages")
def send_message(
    project_id: str,
    data: Dict[str, Any],
    current_user: Any = Depends(get_current_user),
):
    sender_id, sender_email = _extract_user_info(current_user)
    sender_name = data.get("sender_name") or (sender_email.split("@")[0] if sender_email else "User")
    sender_role = data.get("sender_role", "buyer")
    message = data.get("message")
    
    if not message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")
        
    msg = add_project_message(
        project_id=project_id,
        sender_id=sender_id,
        sender_name=sender_name,
        sender_role=sender_role,
        message=message
    )
    return {"message": "Message sent", "data": msg}

@router.get("/{project_id}/ai-analysis")
def get_project_ai_analysis(project_id: str):
    analysis = analyze_project_risks(project_id)
    if "error" in analysis:
        raise HTTPException(status_code=404, detail=analysis["error"])
    return analysis

