import json
import re
from datetime import datetime
from app.database.supabase import get_supabase
from app.services.ai.gemini_service import gemini_service


def run_seller_ai_agent(conversation_id: str):
    try:
        supabase = get_supabase()

        # 1. Fetch conversation details with joins
        conv_res = (
            supabase
            .table("conversations")
            .select("*, property:properties(*), buyer:profiles!conversations_buyer_id_fkey(*), seller:profiles!conversations_seller_id_fkey(*)")
            .eq("id", conversation_id)
            .single()
            .execute()
        )

        if not conv_res.data:
            print(f"Error: Conversation {conversation_id} not found.")
            return

        conv = conv_res.data
        if conv.get("mode") != "ai_active":
            print(f"Agent skipped: Conversation mode is {conv.get('mode')}")
            return

        history_res = (
            supabase
            .table("conversation_messages")
            .select("*, sender:profiles(full_name)")
            .eq("conversation_id", conversation_id)
            .order("created_at", desc=True)
            .limit(10)
            .execute()
        )
        history = list(reversed(history_res.data or []))

        # Deduplicate: Skip if the last message in the conversation is not from the buyer
        if not history:
            print(f"Agent skipped: No message history found for conversation {conversation_id}.")
            return
        
        last_msg = history[-1]
        if last_msg.get("sender_type") != "buyer":
            print(f"Agent skipped: Last message was sent by '{last_msg.get('sender_type')}', not 'buyer'.")
            return

        # Formulate history text and find latest buyer message
        history_lines = []
        latest_buyer_message = ""
        for msg in history:
            role = (
                "Buyer"
                if msg["sender_type"] == "buyer"
                else "Seller"
                if msg["sender_type"] == "seller"
                else "AI"
            )
            sender_name = (
                msg["sender"]["full_name"]
                if msg.get("sender") and isinstance(msg["sender"], dict) and msg["sender"].get("full_name")
                else role
            )
            history_lines.append(f"{sender_name} ({role}): {msg['message']}")
            if msg["sender_type"] == "buyer":
                latest_buyer_message = msg["message"]

        history_text = "\n".join(history_lines)

        # Get property & seller details
        prop = conv.get("property") or {}
        seller = conv.get("seller") or {}
        seller_name = (
            seller.get("full_name") or seller.get("email") or "Seller"
        )

        # 3. Create the prompt with explicit prioritization rules
        prompt = f"""You are the autonomous "GEB Seller AI" assistant representing the seller of the following property.

Property Details:
- Title: {prop.get('title')}
- Type: {prop.get('property_type')}
- Price: INR {prop.get('price')}
- Area: {prop.get('area')} {prop.get('area_unit')}
- Locality: {prop.get('locality')}
- City: {prop.get('city')}
- Description: {prop.get('description')}
- Seller Name: {seller_name}

Your goal is to converse with the buyer, capture leads, schedule visits, escalate missing information, and respond to the buyer.

Latest Buyer Message:
"{latest_buyer_message}"

Allowed Actions (Choose EXACTLY ONE based on buyer's latest intent):
1. HANDOFF_TO_HUMAN: If the buyer explicitly asks for a human, a real person, a call back, asks to talk to the seller/agent directly, or expresses frustration, choose this.
2. CREATE_MEETING_REQUEST: If the buyer proposes a specific date, time, or day for a visit or meeting (e.g. "Saturday at 11", "can I see it tomorrow?"), choose this.
3. REQUEST_MEETING_DETAILS: If the buyer wants to visit or schedule a call but HAS NOT specified a day/time, choose this.
4. CREATE_LEAD: If the buyer expresses serious intent to purchase the property (e.g. "I want to buy this", "I'm interested in buying this"), choose this.
5. CREATE_FOLLOW_UP: If the buyer asks about legal status, title status, ownership, future appreciation/value, rental yield, road width, amenities, distances, or documents, choose this. YOU DO NOT HAVE THIS INFORMATION. DO NOT HALLUCINATE OR INVENT IT. Tell the buyer you are escalating to the seller.
6. ANSWER_PROPERTY_QUESTION: Use this to answer standard property specifications (price, area, location, type, seller) if the facts are in the Property Details above.
7. ESCALATE_TO_SELLER: Use this if they ask for negotiation/custom pricing or another manual request.

Rules:
1. ALWAYS identify yourself clearly as "GEB Seller AI". Do not pretend to be a human seller.
2. DO NOT make up/hallucinate property details (legal, title status, future value, amenities, documents). If the information is not in the Property Details above, choose CREATE_FOLLOW_UP and tell the buyer you will escalate it to the seller.
3. Respond ONLY in the following valid JSON format:
{{
  "action": "ONE_OF_THE_ALLOWED_ACTIONS",
  "intent": "buyer_intent_description",
  "answer": "Your reply message to the buyer (must be signed off as 'GEB Seller AI')",
  "requested_date": "The proposed date (string, e.g., 'Saturday' or 'tomorrow') if action is CREATE_MEETING_REQUEST, else null",
  "requested_time": "The proposed time (string, e.g., '11 AM') if action is CREATE_MEETING_REQUEST, else null",
  "follow_up_question": "The question to escalate (string) if action is CREATE_FOLLOW_UP, else null"
}}

Conversation History:
{history_text}
"""

        # Call Gemini
        raw_response = gemini_service.generate(prompt)
        print("Gemini raw response:", raw_response)

        # Parse JSON
        agent_data = {}
        match = re.search(r"\{.*\}", raw_response, re.DOTALL)
        if match:
            try:
                agent_data = json.loads(match.group(0))
            except Exception as parse_err:
                print("Failed to parse regex match JSON:", parse_err)

        if not agent_data:
            try:
                agent_data = json.loads(raw_response)
            except Exception as parse_err:
                print("Failed to parse raw response JSON:", parse_err)
                agent_data = {
                    "action": "ANSWER_PROPERTY_QUESTION",
                    "intent": "property_inquiry",
                    "answer": "Hello! I am GEB Seller AI. I am here to help you. How can I assist you today?",
                    "requested_date": None,
                    "requested_time": None,
                    "follow_up_question": None,
                }

        # Hybrid intent override for human handoff
        lowercase_msg = latest_buyer_message.lower()
        if any(phrase in lowercase_msg for phrase in ["human", "real person", "speak to a person", "talk to a person", "speak to the seller", "talk to the seller", "hand over", "handoff", "transfer", "connect me to the owner"]):
            agent_data = {
                "action": "HANDOFF_TO_HUMAN",
                "intent": "Handoff to human requested",
                "answer": f"I am handing over this conversation to the seller. {seller_name} will get in touch with you directly here. - GEB Seller AI",
                "requested_date": None,
                "requested_time": None,
                "follow_up_question": None
            }
            print("Deterministic handoff override triggered.")

        # Validate action
        allowed_actions = [
            "ANSWER_PROPERTY_QUESTION",
            "CREATE_LEAD",
            "CREATE_FOLLOW_UP",
            "REQUEST_MEETING_DETAILS",
            "CREATE_MEETING_REQUEST",
            "ESCALATE_TO_SELLER",
            "HANDOFF_TO_HUMAN",
        ]
        action = agent_data.get("action", "ANSWER_PROPERTY_QUESTION")
        if action not in allowed_actions:
            action = "ANSWER_PROPERTY_QUESTION"

        answer = agent_data.get("answer", "")
        if not answer:
            answer = "I am here to assist you with the property."

        # Ensure answer mentions "GEB Seller AI"
        if "GEB Seller AI" not in answer:
            answer = f"I am GEB Seller AI. {answer}"

        # 4. Perform CRM actions
        buyer_id = conv.get("buyer_id")
        seller_id = conv.get("seller_id")
        property_id = conv.get("property_id")
        intent_desc = agent_data.get("intent") or "buyer_inquiry"

        if action == "CREATE_LEAD":
            # Check if lead already exists (UPSERT lookup)
            existing_lead = (
                supabase
                .table("leads")
                .select("id")
                .eq("buyer_id", buyer_id)
                .eq("property_id", property_id)
                .execute()
            )
            if existing_lead.data:
                lead_id = existing_lead.data[0]["id"]
                supabase.table("leads").update({
                    "intent": intent_desc,
                    "last_message_at": datetime.now().isoformat(),
                    "updated_at": datetime.now().isoformat(),
                }).eq("id", lead_id).execute()
                print(f"Lead updated successfully for lead ID {lead_id}.")
            else:
                supabase.table("leads").insert({
                    "buyer_id": buyer_id,
                    "seller_id": seller_id,
                    "property_id": property_id,
                    "conversation_id": conversation_id,
                    "status": "new",
                    "intent": intent_desc,
                    "source": "geb_seller_ai",
                    "last_message_at": datetime.now().isoformat(),
                }).execute()
                print(f"New lead logged successfully for conv {conversation_id}.")

        elif action == "CREATE_MEETING_REQUEST":
            requested_date = agent_data.get("requested_date") or "TBD"
            requested_time = agent_data.get("requested_time") or "TBD"

            # Check if pending meeting already exists (Deduplicate)
            existing_meet = (
                supabase
                .table("meetings")
                .select("id")
                .eq("conversation_id", conversation_id)
                .eq("status", "pending")
                .execute()
            )
            if existing_meet.data:
                meet_id = existing_meet.data[0]["id"]
                supabase.table("meetings").update({
                    "requested_date": requested_date,
                    "requested_time": requested_time,
                    "updated_at": datetime.now().isoformat(),
                }).eq("id", meet_id).execute()
                print(f"Meeting request updated to {requested_date} at {requested_time} for ID {meet_id}.")
            else:
                supabase.table("meetings").insert({
                    "buyer_id": buyer_id,
                    "seller_id": seller_id,
                    "property_id": property_id,
                    "conversation_id": conversation_id,
                    "requested_date": requested_date,
                    "requested_time": requested_time,
                    "status": "pending",
                }).execute()
                print(f"New meeting request logged: {requested_date} at {requested_time}.")

        elif action in ["CREATE_FOLLOW_UP", "ESCALATE_TO_SELLER"]:
            follow_up_question = (
                agent_data.get("follow_up_question")
                or agent_data.get("follow_up_query")
                or latest_buyer_message
            )

            # Check if open follow up already exists (Deduplicate)
            existing_fu = (
                supabase
                .table("follow_ups")
                .select("id")
                .eq("conversation_id", conversation_id)
                .eq("question", follow_up_question)
                .eq("status", "open")
                .execute()
            )
            if existing_fu.data:
                fu_id = existing_fu.data[0]["id"]
                supabase.table("follow_ups").update({
                    "updated_at": datetime.now().isoformat(),
                }).eq("id", fu_id).execute()
                print(f"Follow up updated for ID {fu_id}.")
            else:
                supabase.table("follow_ups").insert({
                    "buyer_id": buyer_id,
                    "seller_id": seller_id,
                    "property_id": property_id,
                    "conversation_id": conversation_id,
                    "question": follow_up_question,
                    "status": "open",
                }).execute()
                print(f"New follow-up logged: {follow_up_question}")

        elif action == "HANDOFF_TO_HUMAN":
            supabase.table("conversations").update({
                "mode": "human_active"
            }).eq("id", conversation_id).execute()
            print(
                f"Conversation {conversation_id} mode switched to human_active."
            )

        # 5. Persist AI message in conversation_messages
        supabase.table("conversation_messages").insert({
            "conversation_id": conversation_id,
            "sender_id": None,
            "sender_type": "ai_agent",
            "message": answer,
        }).execute()

        # Touch updated_at for conversation
        supabase.table("conversations").update({
            "updated_at": datetime.now().isoformat()
        }).eq("id", conversation_id).execute()
        print("Seller AI agent response sent and conversation touched.")

    except Exception as error:
        print("Error in run_seller_ai_agent pipeline:", repr(error))
