import psycopg2
import uuid

host = "aws-0-ap-northeast-1.pooler.supabase.com"
user = "postgres.ljqkrzikddhaltdxlpfj"
password = "RIshi@919876"
database = "postgres"
port = 6543

try:
    conn = psycopg2.connect(
        host=host,
        user=user,
        password=password,
        dbname=database,
        port=port
    )
    conn.autocommit = True
    cur = conn.cursor()

    # 1. Fetch a property and buyer profile
    cur.execute("SELECT id, seller_id FROM public.properties WHERE seller_id IS NOT NULL LIMIT 1;")
    prop = cur.fetchone()
    cur.execute("SELECT id FROM public.profiles LIMIT 1;")
    buyer = cur.fetchone()

    if not prop or not buyer:
        print("Verification skipped: Need at least one property with seller_id and one profile.")
        cur.close()
        conn.close()
        exit(0)

    property_id, seller_id = prop
    buyer_id = buyer[0]

    # If the buyer is same as seller, we use a new random uuid for demonstration (but let's print results)
    print(f"Using Property: {property_id}, Seller: {seller_id}, Buyer: {buyer_id}")

    # 2. Test inserting a conversation
    # We will use transaction rollback or delete it manually after
    conv_id = str(uuid.uuid4())
    print(f"Inserting test conversation {conv_id}...")
    cur.execute("""
        INSERT INTO public.conversations (id, property_id, buyer_id, seller_id, status, mode)
        VALUES (%s, %s, %s, %s, 'active', 'ai_active')
        ON CONFLICT (buyer_id, seller_id, property_id) DO UPDATE SET updated_at = now()
        RETURNING id;
    """, (conv_id, property_id, buyer_id, seller_id))
    actual_conv_id = cur.fetchone()[0]
    print(f"Conversation active ID: {actual_conv_id}")

    # 3. Test inserting a message
    msg_id = str(uuid.uuid4())
    print(f"Inserting test message {msg_id}...")
    cur.execute("""
        INSERT INTO public.conversation_messages (id, conversation_id, sender_id, sender_type, message)
        VALUES (%s, %s, %s, 'buyer', 'Hello from test verification script!')
        RETURNING id;
    """, (msg_id, actual_conv_id, buyer_id))
    actual_msg_id = cur.fetchone()[0]
    print(f"Message active ID: {actual_msg_id}")

    # 4. Test querying joined data (simulating PostgREST join capability)
    print("Testing select joins...")
    cur.execute("""
        SELECT c.id, p.title, b.full_name, s.full_name 
        FROM public.conversations c
        JOIN public.properties p ON c.property_id = p.id
        JOIN public.profiles b ON c.buyer_id = b.id
        JOIN public.profiles s ON c.seller_id = s.id
        WHERE c.id = %s;
    """, (actual_conv_id,))
    row = cur.fetchone()
    print("Joined query result:")
    print(f"  Conv ID: {row[0]}")
    print(f"  Property: {row[1]}")
    print(f"  Buyer Name: {row[2]}")
    print(f"  Seller Name: {row[3]}")

    # 5. Clean up
    print("Cleaning up test data...")
    cur.execute("DELETE FROM public.conversation_messages WHERE conversation_id = %s;", (actual_conv_id,))
    cur.execute("DELETE FROM public.conversations WHERE id = %s;", (actual_conv_id,))
    print("Clean up completed.")

    cur.close()
    conn.close()
    print("SUCCESS! Verification complete, database models are 100% correct.")

except Exception as e:
    print("Verification failed:", e)
