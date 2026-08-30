import psycopg2

host = "aws-0-ap-northeast-1.pooler.supabase.com"
user = "postgres.ljqkrzikddhaltdxlpfj"
password = "RIshi@919876"
database = "postgres"
port = 6543

commands = [
    # 1. Create conversations table
    """
    CREATE TABLE IF NOT EXISTS public.conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
        buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'active',
        mode TEXT NOT NULL DEFAULT 'ai_active' CHECK (mode IN ('ai_active', 'human_active', 'closed')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT unique_buyer_seller_property UNIQUE (buyer_id, seller_id, property_id)
    );
    """,
    # 2. Enable RLS on conversations
    "ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;",
    # 3. Create RLS policies for conversations
    """
    DROP POLICY IF EXISTS conversations_access_policy ON public.conversations;
    """,
    """
    CREATE POLICY conversations_access_policy ON public.conversations
        FOR ALL
        TO authenticated
        USING (auth.uid() = buyer_id OR auth.uid() = seller_id)
        WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);
    """,
    # 4. Create conversation_messages table
    """
    CREATE TABLE IF NOT EXISTS public.conversation_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
        sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
        sender_type TEXT NOT NULL CHECK (sender_type IN ('buyer', 'seller', 'ai_agent', 'system')),
        message TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    """,
    # 5. Enable RLS on conversation_messages
    "ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;",
    # 6. Create RLS policies for conversation_messages
    """
    DROP POLICY IF EXISTS messages_access_policy ON public.conversation_messages;
    """,
    """
    CREATE POLICY messages_access_policy ON public.conversation_messages
        FOR ALL
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM public.conversations c
                WHERE c.id = conversation_messages.conversation_id
                AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
            )
        )
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.conversations c
                WHERE c.id = conversation_messages.conversation_id
                AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
            )
        );
    """,
    # 7. Helper triggers for conversations updated_at
    """
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = now();
        RETURN NEW;
    END;
    $$ language 'plpgsql';
    """,
    """
    DROP TRIGGER IF EXISTS update_conversations_updated_at ON public.conversations;
    """,
    """
    CREATE TRIGGER update_conversations_updated_at
        BEFORE UPDATE ON public.conversations
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    """
]

try:
    print("Connecting to database...")
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
        print(f"Executing step {idx + 1}...")
        cur.execute(cmd)
        
    print("SUCCESS! Tables and policies created successfully.")
    cur.close()
    conn.close()
except Exception as e:
    print("Error during migrations:", e)
