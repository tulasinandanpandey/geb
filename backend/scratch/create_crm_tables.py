import psycopg2

host = "aws-0-ap-northeast-1.pooler.supabase.com"
user = "postgres.ljqkrzikddhaltdxlpfj"
password = "RIshi@919876"
database = "postgres"
port = 6543

commands = [
    # 1. Create leads table
    """
    CREATE TABLE IF NOT EXISTS public.leads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
        buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
        property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'closed')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    """,
    # 2. Enable RLS on leads
    "ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;",
    # 3. Create leads RLS policy
    """
    DROP POLICY IF EXISTS leads_access_policy ON public.leads;
    """,
    """
    CREATE POLICY leads_access_policy ON public.leads
        FOR ALL
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM public.conversations c
                WHERE c.id = leads.conversation_id
                AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
            )
        );
    """,
    
    # 4. Create meetings table
    """
    CREATE TABLE IF NOT EXISTS public.meetings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
        buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
        property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
        proposed_time TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'declined', 'cancelled')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    """,
    # 5. Enable RLS on meetings
    "ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;",
    # 6. Create meetings RLS policy
    """
    DROP POLICY IF EXISTS meetings_access_policy ON public.meetings;
    """,
    """
    CREATE POLICY meetings_access_policy ON public.meetings
        FOR ALL
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM public.conversations c
                WHERE c.id = meetings.conversation_id
                AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
            )
        );
    """,
    
    # 7. Create follow_ups table
    """
    CREATE TABLE IF NOT EXISTS public.follow_ups (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
        property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
        query TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    """,
    # 8. Enable RLS on follow_ups
    "ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;",
    # 9. Create follow_ups RLS policy
    """
    DROP POLICY IF EXISTS follow_ups_access_policy ON public.follow_ups;
    """,
    """
    CREATE POLICY follow_ups_access_policy ON public.follow_ups
        FOR ALL
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM public.conversations c
                WHERE c.id = follow_ups.conversation_id
                AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
            )
        );
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
        print(f"Executing step {idx+1}...")
        cur.execute(cmd)
        
    print("SUCCESS! CRM tables and policies created successfully.")
    cur.close()
    conn.close()
except Exception as e:
    print("Error creating CRM tables:", e)
