import psycopg2

host = "aws-0-ap-northeast-1.pooler.supabase.com"
user = "postgres.ljqkrzikddhaltdxlpfj"
password = "RIshi@919876"
database = "postgres"
port = 6543

commands = [
    # Drop existing tables
    "DROP TABLE IF EXISTS public.leads CASCADE;",
    "DROP TABLE IF EXISTS public.meetings CASCADE;",
    "DROP TABLE IF EXISTS public.follow_ups CASCADE;",
    
    # 1. Create leads table
    """
    CREATE TABLE public.leads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
        seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
        property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
        conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'meeting_requested', 'meeting_confirmed', 'negotiation', 'closed', 'lost')),
        intent TEXT,
        source TEXT DEFAULT 'geb_seller_ai',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT unique_buyer_property_lead UNIQUE (buyer_id, property_id)
    );
    """,
    # Enable RLS on leads
    "ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;",
    # Create leads RLS policy
    """
    CREATE POLICY leads_access_policy ON public.leads
        FOR ALL
        TO authenticated
        USING (
            buyer_id = auth.uid() OR seller_id = auth.uid()
        );
    """,
    
    # 2. Create follow_ups table
    """
    CREATE TABLE public.follow_ups (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
        seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
        property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
        conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
        question TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'answered', 'resolved')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        answered_at TIMESTAMPTZ
    );
    """,
    # Enable RLS on follow_ups
    "ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;",
    # Create follow_ups RLS policy
    """
    CREATE POLICY follow_ups_access_policy ON public.follow_ups
        FOR ALL
        TO authenticated
        USING (
            buyer_id = auth.uid() OR seller_id = auth.uid()
        );
    """,
    
    # 3. Create meetings table
    """
    CREATE TABLE public.meetings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
        seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
        property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
        conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
        requested_date TEXT NOT NULL,
        requested_time TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected', 'rescheduled', 'cancelled', 'completed')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    """,
    # Enable RLS on meetings
    "ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;",
    # Create meetings RLS policy
    """
    CREATE POLICY meetings_access_policy ON public.meetings
        FOR ALL
        TO authenticated
        USING (
            buyer_id = auth.uid() OR seller_id = auth.uid()
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
    print("SUCCESS! Phase 5 CRM tables and policies created successfully.")
    cur.close()
    conn.close()
except Exception as e:
    print("Error creating CRM tables:", e)
