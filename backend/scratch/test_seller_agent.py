import sys
import os
import uuid
import psycopg2
import time
from datetime import datetime

# Adjust Python path to load app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.supabase import get_supabase
from app.services.ai.seller_agent import run_seller_ai_agent
from app.services.ai.gemini_service import gemini_service

# Mock Gemini model responses deterministically to prevent rate limits during test execution
def mock_gemini_generate(prompt: str) -> str:
    import json
    import re
    match = re.search(r'Latest Buyer Message:\s*"(.*?)"', prompt)
    latest_msg = match.group(1).lower() if match else prompt.lower()
    
    if "price" in latest_msg:
        return json.dumps({
            "action": "ANSWER_PROPERTY_QUESTION",
            "intent": "inquiring_about_price",
            "answer": "The price of this plot is INR 25,000. - GEB Seller AI",
            "requested_date": None,
            "requested_time": None,
            "follow_up_question": None
        })
    elif "location" in latest_msg or "located" in latest_msg:
        return json.dumps({
            "action": "ANSWER_PROPERTY_QUESTION",
            "intent": "inquiring_about_location",
            "answer": "This plot is located in Chowk, Prayagraj. - GEB Seller AI",
            "requested_date": None,
            "requested_time": None,
            "follow_up_question": None
        })
    elif "title" in latest_msg:
        return json.dumps({
            "action": "CREATE_FOLLOW_UP",
            "intent": "inquiring_about_title",
            "answer": "I do not have legal title documents. Escalating to seller. - GEB Seller AI",
            "requested_date": None,
            "requested_time": None,
            "follow_up_question": "Is the title of this property completely clear of legal disputes?"
        })
    elif "interested in buying" in latest_msg or "buy" in latest_msg:
        return json.dumps({
            "action": "CREATE_LEAD",
            "intent": "buyer_purchase_intent",
            "answer": "Thank you for interest! Created a lead for you. - GEB Seller AI",
            "requested_date": None,
            "requested_time": None,
            "follow_up_question": None
        })
    elif "saturday" in latest_msg or "visit" in latest_msg:
        return json.dumps({
            "action": "CREATE_MEETING_REQUEST",
            "intent": "meeting_schedule_request",
            "answer": "I have logged your request for visit this Saturday at 11 AM. - GEB Seller AI",
            "requested_date": "Saturday",
            "requested_time": "11 AM",
            "follow_up_question": None
        })
    elif "human" in latest_msg or "handoff" in latest_msg:
        return json.dumps({
            "action": "HANDOFF_TO_HUMAN",
            "intent": "handoff_request",
            "answer": "Handing over to seller. - GEB Seller AI",
            "requested_date": None,
            "requested_time": None,
            "follow_up_question": None
        })
    return json.dumps({
        "action": "ANSWER_PROPERTY_QUESTION",
        "intent": "default",
        "answer": "Hello from GEB Seller AI!",
        "requested_date": None,
        "requested_time": None,
        "follow_up_question": None
    })

gemini_service.generate = mock_gemini_generate

host = "aws-0-ap-northeast-1.pooler.supabase.com"
user = "postgres.ljqkrzikddhaltdxlpfj"
password = "RIshi@919876"
database = "postgres"
port = 6543

def run_tests():
    print("Initializing test suite...")
    supabase = get_supabase()
    
    # 1. Fetch a property and user profile for test context
    prop_res = supabase.table("properties").select("id, title, seller_id").not_.is_("seller_id", "null").eq("status", "active").limit(1).execute()
    buyer_res = supabase.table("profiles").select("id").limit(1).execute()
    
    if not prop_res.data or not buyer_res.data:
        print("Error: Missing properties or profiles in database to run tests.")
        return
        
    property_id = prop_res.data[0]["id"]
    seller_id = prop_res.data[0]["seller_id"]
    buyer_id = buyer_res.data[0]["id"]
    prop_title = prop_res.data[0]["title"]
    
    print(f"Test context: Property = {prop_title} ({property_id}), Seller = {seller_id}, Buyer = {buyer_id}")
    
    # 2. Create temporary conversation
    conv_id = str(uuid.uuid4())
    supabase.table("conversations").insert({
        "id": conv_id,
        "property_id": property_id,
        "buyer_id": buyer_id,
        "seller_id": seller_id,
        "status": "active",
        "mode": "ai_active"
    }).execute()
    print(f"Created temporary conversation {conv_id}")
    
    try:
        def test_query(message_input: str, expected_description: str):
            print(f"\n--- Testing: '{message_input}' ({expected_description}) ---")
            
            # Insert buyer message
            supabase.table("conversation_messages").insert({
                "conversation_id": conv_id,
                "sender_id": buyer_id,
                "sender_type": "buyer",
                "message": message_input
            }).execute()
            

            
            # Run Seller AI Agent
            run_seller_ai_agent(conv_id)
            
            # Fetch latest message
            latest_msg = (
                supabase
                .table("conversation_messages")
                .select("*")
                .eq("conversation_id", conv_id)
                .order("created_at", desc=True)
                .limit(1)
                .execute()
            )
            
            if latest_msg.data:
                msg = latest_msg.data[0]
                print(f"AI response: [{msg.get('sender_type')}] -> '{msg.get('message')}'")
            else:
                print("No AI response found!")

        # Test 1: Property Q&A (Price)
        test_query("What is the price of this property?", "Property Q&A - Price")
        
        # Test 2: Property Q&A (Location)
        test_query("Where is this property located?", "Property Q&A - Location")
        
        # Test 3: No Hallucination / Follow-up Escalation
        test_query("Is the title of this property completely clear of legal disputes?", "Follow-up Escalation")
        
        # Check if follow-up record was created in db
        followups = supabase.table("follow_ups").select("*").eq("conversation_id", conv_id).execute()
        print("CRM Follow-ups logged in database:", followups.data)
        
        # Test 4: Lead Detection
        test_query("I am interested in buying this property, please connect me.", "Lead Capture")
        leads = supabase.table("leads").select("*").eq("conversation_id", conv_id).execute()
        print("CRM Leads logged in database:", leads.data)
        
        # Test 5: Meeting schedule request
        test_query("Can I visit the property this Saturday at 11 AM?", "Meeting Request")
        meetings = supabase.table("meetings").select("*").eq("conversation_id", conv_id).execute()
        print("CRM Meetings logged in database:", meetings.data)
        
        # Test 6: Handoff to human
        test_query("Can you please hand me over to a human agent? I want to speak to a real person.", "Handoff to Human")
        conv_check = supabase.table("conversations").select("mode").eq("id", conv_id).single().execute()
        print(f"Conversation mode after handoff: {conv_check.data.get('mode')}")
        
        # Test 7: Verify AI does not respond in human_active mode
        print("\n--- Testing: 'What is the area?' (When mode is human_active) ---")
        supabase.table("conversation_messages").insert({
            "conversation_id": conv_id,
            "sender_id": buyer_id,
            "sender_type": "buyer",
            "message": "What is the area?"
        }).execute()
        
        # Capture number of messages before running agent
        msgs_before = len(supabase.table("conversation_messages").select("id").eq("conversation_id", conv_id).execute().data)
        run_seller_ai_agent(conv_id)
        msgs_after = len(supabase.table("conversation_messages").select("id").eq("conversation_id", conv_id).execute().data)
        
        if msgs_before == msgs_after:
            print("SUCCESS: AI did not respond in human_active mode!")
        else:
            print("FAILURE: AI responded even though mode is human_active!")

    finally:
        # 3. Clean up test data
        print("\nCleaning up test data from database...")
        conn = psycopg2.connect(
            host=host,
            user=user,
            password=password,
            dbname=database,
            port=port
        )
        conn.autocommit = True
        cur = conn.cursor()
        
        cur.execute("DELETE FROM public.leads WHERE conversation_id = %s;", (conv_id,))
        cur.execute("DELETE FROM public.meetings WHERE conversation_id = %s;", (conv_id,))
        cur.execute("DELETE FROM public.follow_ups WHERE conversation_id = %s;", (conv_id,))
        cur.execute("DELETE FROM public.conversation_messages WHERE conversation_id = %s;", (conv_id,))
        cur.execute("DELETE FROM public.conversations WHERE id = %s;", (conv_id,))
        
        cur.close()
        conn.close()
        print("Clean up finished.")

if __name__ == "__main__":
    run_tests()
