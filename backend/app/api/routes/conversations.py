from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from app.database.supabase import get_supabase
from app.core.auth import get_current_user
from app.services.ai.seller_agent import run_seller_ai_agent

router = APIRouter(
    prefix="/api/conversations",
    tags=["Conversations"],
)


class ConversationCreate(BaseModel):
    property_id: str


class MessageCreate(BaseModel):
    message: str


class ConversationUpdate(BaseModel):
    mode: Optional[str] = None
    status: Optional[str] = None


@router.post("/")
def get_or_create_conversation(
    payload: ConversationCreate,
    current_user=Depends(get_current_user),
):
    try:
        supabase = get_supabase()

        # 1. Fetch property to get seller_id
        prop_res = (
            supabase
            .table("properties")
            .select("id, seller_id")
            .eq("id", payload.property_id)
            .execute()
        )

        if not prop_res.data:
            raise HTTPException(
                status_code=404,
                detail="Property not found."
            )

        property_data = prop_res.data[0]
        seller_id = property_data.get("seller_id")

        if not seller_id:
            raise HTTPException(
                status_code=400,
                detail="Property does not have an assigned seller."
            )

        # 2. Check if buyer is trying to contact themselves
        if str(current_user.id) == str(seller_id):
            raise HTTPException(
                status_code=400,
                detail="You cannot start a conversation with yourself."
            )

        # 3. Find existing conversation
        existing = (
            supabase
            .table("conversations")
            .select("*, property:properties(id, title, price, city, locality, image, seller_id), buyer:profiles!conversations_buyer_id_fkey(id, full_name, email), seller:profiles!conversations_seller_id_fkey(id, full_name, email)")
            .eq("property_id", payload.property_id)
            .eq("buyer_id", current_user.id)
            .eq("seller_id", seller_id)
            .execute()
        )

        if existing.data:
            return {
                "success": True,
                "conversation": existing.data[0],
                "is_new": False
            }

        # 4. Create new conversation
        new_conv = {
            "property_id": payload.property_id,
            "buyer_id": current_user.id,
            "seller_id": seller_id,
            "status": "active",
            "mode": "ai_active"
        }

        insert_res = (
            supabase
            .table("conversations")
            .insert(new_conv)
            .execute()
        )

        if not insert_res.data:
            raise HTTPException(
                status_code=500,
                detail="Failed to create conversation."
            )

        new_conv_id = insert_res.data[0]["id"]

        # Fetch the complete object with joins
        complete_conv = (
            supabase
            .table("conversations")
            .select("*, property:properties(id, title, price, city, locality, image, seller_id), buyer:profiles!conversations_buyer_id_fkey(id, full_name, email), seller:profiles!conversations_seller_id_fkey(id, full_name, email)")
            .eq("id", new_conv_id)
            .single()
            .execute()
        )

        return {
            "success": True,
            "conversation": complete_conv.data,
            "is_new": True
        }

    except HTTPException:
        raise
    except Exception as error:
        print("CONVERSATION CREATE ERROR:", repr(error))
        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


@router.get("/")
def list_conversations(
    current_user=Depends(get_current_user),
):
    try:
        supabase = get_supabase()

        response = (
            supabase
            .table("conversations")
            .select("*, property:properties(id, title, price, city, locality, image, seller_id), buyer:profiles!conversations_buyer_id_fkey(id, full_name, email), seller:profiles!conversations_seller_id_fkey(id, full_name, email)")
            .or_(f"buyer_id.eq.{current_user.id},seller_id.eq.{current_user.id}")
            .order("updated_at", desc=True)
            .execute()
        )

        return {
            "success": True,
            "conversations": response.data
        }

    except Exception as error:
        print("LIST CONVERSATIONS ERROR:", repr(error))
        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


@router.get("/{conversation_id}/messages")
def get_messages(
    conversation_id: str,
    current_user=Depends(get_current_user),
):
    try:
        supabase = get_supabase()

        # Verify participant
        conv_res = (
            supabase
            .table("conversations")
            .select("id, buyer_id, seller_id")
            .eq("id", conversation_id)
            .execute()
        )

        if not conv_res.data:
            raise HTTPException(
                status_code=404,
                detail="Conversation not found."
            )

        conv = conv_res.data[0]
        if str(current_user.id) not in [str(conv["buyer_id"]), str(conv["seller_id"])]:
            raise HTTPException(
                status_code=403,
                detail="Access denied."
            )

        # Fetch messages
        messages_res = (
            supabase
            .table("conversation_messages")
            .select("*, sender:profiles(id, full_name, email, avatar_url)")
            .eq("conversation_id", conversation_id)
            .order("created_at", desc=False)
            .execute()
        )

        return {
            "success": True,
            "messages": messages_res.data
        }

    except HTTPException:
        raise
    except Exception as error:
        print("GET MESSAGES ERROR:", repr(error))
        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


@router.post("/{conversation_id}/messages")
def send_message(
    conversation_id: str,
    payload: MessageCreate,
    background_tasks: BackgroundTasks,
    current_user=Depends(get_current_user),
):
    try:
        supabase = get_supabase()

        # Verify participant and determine sender type
        conv_res = (
            supabase
            .table("conversations")
            .select("id, buyer_id, seller_id, mode")
            .eq("id", conversation_id)
            .execute()
        )

        if not conv_res.data:
            raise HTTPException(
                status_code=404,
                detail="Conversation not found."
            )

        conv = conv_res.data[0]
        sender_type = None

        if str(current_user.id) == str(conv["buyer_id"]):
            sender_type = "buyer"
        elif str(current_user.id) == str(conv["seller_id"]):
            sender_type = "seller"
        else:
            raise HTTPException(
                status_code=403,
                detail="Access denied."
            )

        # Insert message
        msg_payload = {
            "conversation_id": conversation_id,
            "sender_id": current_user.id,
            "sender_type": sender_type,
            "message": payload.message
        }

        insert_res = (
            supabase
            .table("conversation_messages")
            .insert(msg_payload)
            .execute()
        )

        if not insert_res.data:
            raise HTTPException(
                status_code=500,
                detail="Failed to send message."
            )

        # Update conversations updated_at to bring it to top
        supabase.table("conversations").update({"updated_at": datetime.now().isoformat()}).eq("id", conversation_id).execute()

        # Handle Auto Mode switch for Seller response
        if sender_type == "seller" and conv.get("mode") == "ai_active":
            supabase.table("conversations").update({"mode": "human_active"}).eq("id", conversation_id).execute()
            print(f"Conversation {conversation_id} mode set to human_active due to seller reply.")

        # Fetch complete sent message with sender profile
        msg_id = insert_res.data[0]["id"]
        complete_msg = (
            supabase
            .table("conversation_messages")
            .select("*, sender:profiles(id, full_name, email, avatar_url)")
            .eq("id", msg_id)
            .single()
            .execute()
        )

        # Trigger Autonomous Seller AI Agent if mode is ai_active and sender is buyer
        current_mode = conv.get("mode")
        if sender_type == "buyer" and current_mode == "ai_active":
            background_tasks.add_task(run_seller_ai_agent, conversation_id)
            print(f"Background task queued for Seller AI agent on conversation {conversation_id}")

        return {
            "success": True,
            "message": complete_msg.data
        }

    except HTTPException:
        raise
    except Exception as error:
        print("SEND MESSAGE ERROR:", repr(error))
        raise HTTPException(
            status_code=500,
            detail=str(error)
        )


@router.patch("/{conversation_id}")
def update_conversation(
    conversation_id: str,
    payload: ConversationUpdate,
    current_user=Depends(get_current_user),
):
    try:
        supabase = get_supabase()

        # Verify participant
        conv_res = (
            supabase
            .table("conversations")
            .select("id, buyer_id, seller_id")
            .eq("id", conversation_id)
            .execute()
        )

        if not conv_res.data:
            raise HTTPException(
                status_code=404,
                detail="Conversation not found."
            )

        conv = conv_res.data[0]
        if str(current_user.id) not in [str(conv["buyer_id"]), str(conv["seller_id"])]:
            raise HTTPException(
                status_code=403,
                detail="Access denied."
            )

        update_data = {}
        if payload.mode is not None:
            if payload.mode not in ["ai_active", "human_active", "closed"]:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid conversation mode."
                )
            update_data["mode"] = payload.mode
        if payload.status is not None:
            update_data["status"] = payload.status

        if not update_data:
            raise HTTPException(
                status_code=400,
                detail="No fields to update."
            )

        # Perform update
        update_res = (
            supabase
            .table("conversations")
            .update(update_data)
            .eq("id", conversation_id)
            .execute()
        )

        return {
            "success": True,
            "conversation": update_res.data[0]
        }
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(error)}"
        )
