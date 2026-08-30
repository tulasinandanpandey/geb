import sys
import os
import uuid

# Adjust Python path to load app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.supabase import get_supabase
from app.services.properties.property_service import create_property

def run_moderation_tests():
    print("Running Property Moderation Verification Tests...")
    
    # Get a seller profile to use for testing
    supabase = get_supabase()
    profiles_res = supabase.table("profiles").select("id").limit(1).execute()
    if not profiles_res.data:
        print("Error: No profiles found in DB to run tests.")
        return
    seller_id = profiles_res.data[0]["id"]
    
    # 1. Test spam check
    print("\n--- Test Case 1: Spam word in title ---")
    spam_payload = {
        "title": "Earn money online with this free cash property",
        "property_type": "plot",
        "price": 500000,
        "area": 1000,
        "area_unit": "sqft",
        "city": "Lucknow",
        "locality": "Gomti Nagar",
        "latitude": 26.8467,
        "longitude": 80.9462,
        "description": "This is a wonderful plot for your dreams.",
        "seller_id": seller_id
    }
    
    try:
        res1 = create_property(spam_payload)
        print(f"Status: {res1.get('status')}, Rejection Reason: {res1.get('rejection_reason')}")
        assert res1.get("status") == "rejected"
        assert "spam" in res1.get("rejection_reason").lower()
        print("PASS: Spam check rejected successfully.")
    except Exception as e:
        print("FAIL:", e)

    # 2. Test placeholder/test check
    print("\n--- Test Case 2: Placeholder keyword in description ---")
    placeholder_payload = {
        "title": "Beautiful plot for sale",
        "property_type": "plot",
        "price": 500000,
        "area": 1000,
        "area_unit": "sqft",
        "city": "Lucknow",
        "locality": "Gomti Nagar",
        "latitude": 26.8467,
        "longitude": 80.9462,
        "description": "This is a dummy test listing description.",
        "seller_id": seller_id
    }
    
    try:
        res2 = create_property(placeholder_payload)
        print(f"Status: {res2.get('status')}, Rejection Reason: {res2.get('rejection_reason')}")
        assert res2.get("status") == "rejected"
        assert "test/placeholder" in res2.get("rejection_reason").lower()
        print("PASS: Placeholder check rejected successfully.")
    except Exception as e:
        print("FAIL:", e)

    # 3. Test excessive uppercase check
    print("\n--- Test Case 3: Excessive uppercase in title ---")
    caps_payload = {
        "title": "BEAUTIFUL PLOT FOR SALE NOW IN LUCKNOW",
        "property_type": "plot",
        "price": 500000,
        "area": 1000,
        "area_unit": "sqft",
        "city": "Lucknow",
        "locality": "Gomti Nagar",
        "latitude": 26.8467,
        "longitude": 80.9462,
        "description": "This is a wonderful plot for your dreams.",
        "seller_id": seller_id
    }
    
    try:
        res3 = create_property(caps_payload)
        print(f"Status: {res3.get('status')}, Rejection Reason: {res3.get('rejection_reason')}")
        assert res3.get("status") == "pending_review"
        assert "uppercase" in res3.get("rejection_reason").lower()
        print("PASS: Excessive uppercase review flagged successfully.")
    except Exception as e:
        print("FAIL:", e)

    # 4. Test duplicate listing check
    print("\n--- Test Case 4: Duplicate listing detection ---")
    unique_title = f"Unique Property {uuid.uuid4().hex[:6]}"
    valid_payload = {
        "title": unique_title,
        "property_type": "plot",
        "price": 750000,
        "area": 1200,
        "area_unit": "sqft",
        "city": "Lucknow",
        "locality": "Gomti Nagar",
        "latitude": 26.8467,
        "longitude": 80.9462,
        "description": "This is a wonderful valid description for property listing.",
        "seller_id": seller_id
    }
    
    try:
        # First creation
        res4_1 = create_property(valid_payload)
        print(f"First Status: {res4_1.get('status')}")
        assert res4_1.get("status") == "active"
        
        # Duplicate creation
        res4_2 = create_property(valid_payload)
        print(f"Duplicate Status: {res4_2.get('status')}, Rejection Reason: {res4_2.get('rejection_reason')}")
        assert res4_2.get("status") == "rejected"
        assert "duplicate" in res4_2.get("rejection_reason").lower()
        print("PASS: Duplicate listing rejected successfully.")
    except Exception as e:
        print("FAIL:", e)

    # Clean up test listings
    print("\nCleaning up verification listings...")
    supabase.table("properties").delete().eq("seller_id", seller_id).eq("city", "Lucknow").execute()
    print("Clean up finished.")

if __name__ == "__main__":
    run_moderation_tests()
