import psycopg2

host = "aws-0-ap-northeast-1.pooler.supabase.com"
user = "postgres.ljqkrzikddhaltdxlpfj"
password = "RIshi@919876"
database = "postgres"
port = 6543

commands = [
    # Drop existing foreign key constraints referencing auth.users(id)
    "ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_buyer_id_fkey;",
    "ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_seller_id_fkey;",
    
    # Add new foreign key constraints referencing public.profiles(id)
    "ALTER TABLE public.conversations ADD CONSTRAINT conversations_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;",
    "ALTER TABLE public.conversations ADD CONSTRAINT conversations_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.profiles(id) ON DELETE CASCADE;",
    
    # Do the same for conversation_messages sender_id
    "ALTER TABLE public.conversation_messages DROP CONSTRAINT IF EXISTS conversation_messages_sender_id_fkey;",
    "ALTER TABLE public.conversation_messages ADD CONSTRAINT conversation_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE SET NULL;"
]

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
    for idx, cmd in enumerate(commands):
        print(f"Executing constraint update step {idx+1}...")
        cur.execute(cmd)
    print("SUCCESS! Constraints updated.")
    cur.close()
    conn.close()
except Exception as e:
    print("Error updating constraints:", e)
