from typing import Dict, Any, List
from datetime import datetime
from app.services.projects.project_service import get_project_details
from app.services.ai.gemini_service import gemini_service

def analyze_project_risks(project_id: str) -> Dict[str, Any]:
    project = get_project_details(project_id)
    if not project:
        return {"error": "Project not found"}
        
    total_budget = float(project.get("total_budget") or 0)
    spent_amount = float(project.get("spent_amount") or 0)
    remaining_budget = max(0.0, total_budget - spent_amount)
    progress_pct = float(project.get("progress_pct") or 0)
    
    # Dates analysis
    start_date_str = project.get("start_date") or datetime.now().strftime("%Y-%m-%d")
    target_date_str = project.get("target_completion_date") or (datetime.now()).strftime("%Y-%m-%d")
    
    today = datetime.now().date()
    try:
        start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
    except Exception:
        start_date = today
    try:
        target_date = datetime.strptime(target_date_str, "%Y-%m-%d").date()
    except Exception:
        target_date = today
        
    total_days = max((target_date - start_date).days, 1)
    days_elapsed = max((today - start_date).days, 0)
    days_remaining = (target_date - today).days
    
    timeline_pct = min(100.0, round((days_elapsed / total_days) * 100.0, 1))
    spend_pct = min(100.0, round((spent_amount / total_budget * 100.0), 1)) if total_budget > 0 else 0.0
    
    # Financial & Schedule Variances
    spend_variance = round(spend_pct - progress_pct, 1) # Positive means spending faster than physical progress
    schedule_variance = round(timeline_pct - progress_pct, 1) # Positive means timeline passing faster than progress
    
    milestones = project.get("milestones") or []
    milestone_risks = []
    
    for m in milestones:
        m_target = m.get("target_date")
        m_pct = float(m.get("progress_pct") or 0)
        m_status = m.get("status")
        
        if m_target:
            try:
                m_dt = datetime.strptime(m_target, "%Y-%m-%d").date()
                days_left = (m_dt - today).days
                if days_left < 0 and m_pct < 100:
                    milestone_risks.append({
                        "milestone": m.get("title"),
                        "risk": f"OVERDUE by {abs(days_left)} days ({m_pct}% complete)",
                        "severity": "high"
                    })
                elif days_left <= 7 and m_pct < 50:
                    milestone_risks.append({
                        "milestone": m.get("title"),
                        "risk": f"Due in {days_left} days with only {m_pct}% completion",
                        "severity": "medium"
                    })
            except Exception:
                pass

    # Determine risk rating
    risk_score = 15 # Base baseline
    alerts = []
    
    if schedule_variance > 15:
        risk_score += 35
        alerts.append(f"Schedule Delay Detected: Project timeline is {timeline_pct}% elapsed, but completed progress is only {progress_pct}%.")
    elif schedule_variance > 5:
        risk_score += 15
        alerts.append(f"Minor Timeline Lag: Project is running ~{schedule_variance}% behind schedule.")
        
    if spend_variance > 15:
        risk_score += 35
        alerts.append(f"Overbudget Warning: Spent {spend_pct}% of budget (₹{spent_amount:,.0f}), but completed work is only {progress_pct}%.")
    elif spend_variance > 5:
        risk_score += 15
        alerts.append(f"Spend Velocity Alert: Spending is outpacing physical work by {spend_variance}%.")
        
    if len(milestone_risks) > 0:
        risk_score += len(milestone_risks) * 10
        
    risk_score = min(98, max(5, risk_score))
    
    if risk_score >= 60:
        overall_status = "High Delay & Budget Risk"
        badge_color = "red"
    elif risk_score >= 35:
        overall_status = "Moderate Attention Needed"
        badge_color = "amber"
    else:
        overall_status = "On Track & Healthy"
        badge_color = "emerald"
        
    if not alerts:
        alerts.append("All milestones, timeline deadlines, and expense records are operating within healthy parameters.")

    # Call Gemini for plain-language buyer summary
    ai_explanation = generate_gemini_project_insight(
        title=project.get("title", ""),
        progress_pct=progress_pct,
        total_budget=total_budget,
        spent_amount=spent_amount,
        remaining_budget=remaining_budget,
        timeline_pct=timeline_pct,
        days_remaining=days_remaining,
        spend_variance=spend_variance,
        schedule_variance=schedule_variance,
        alerts=alerts,
        milestone_risks=milestone_risks,
        overall_status=overall_status
    )
    
    return {
        "project_id": project_id,
        "title": project.get("title"),
        "risk_score": risk_score,
        "overall_status": overall_status,
        "badge_color": badge_color,
        "metrics": {
            "progress_pct": progress_pct,
            "timeline_pct": timeline_pct,
            "spend_pct": spend_pct,
            "total_budget": total_budget,
            "spent_amount": spent_amount,
            "remaining_budget": remaining_budget,
            "days_remaining": days_remaining,
            "spend_variance": spend_variance,
            "schedule_variance": schedule_variance
        },
        "alerts": alerts,
        "milestone_risks": milestone_risks,
        "ai_explanation": ai_explanation
    }

def generate_gemini_project_insight(
    title: str,
    progress_pct: float,
    total_budget: float,
    spent_amount: float,
    remaining_budget: float,
    timeline_pct: float,
    days_remaining: int,
    spend_variance: float,
    schedule_variance: float,
    alerts: List[str],
    milestone_risks: List[Dict[str, Any]],
    overall_status: str
) -> str:
    try:
        res = gemini_service.generate(prompt)
        if res:
            return res.strip()
    except Exception as e:
        print("Gemini project insight error:", e)
        
    # Fallback deterministic text if Gemini API limit or quota reached
    return f"GEB Project AI Summary for '{title}':\n\n1. Project Status: {overall_status}. The project is currently at {progress_pct}% completion with {days_remaining} days remaining until target deadline.\n2. Financial Analysis: ₹{spent_amount:,.0f} has been spent out of ₹{total_budget:,.0f} total budget. Remaining capital stands at ₹{remaining_budget:,.0f}.\n3. Recommendations: Discuss milestone updates and invoice records with your assigned dealer."
