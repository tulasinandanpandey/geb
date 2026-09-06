import psycopg2
import uuid

host = "aws-0-ap-northeast-1.pooler.supabase.com"
user = "postgres.ljqkrzikddhaltdxlpfj"
password = "RIshi@919876"
database = "postgres"
port = 6543

commands = [
    # 1. Create dealer_profiles table
    """
    CREATE TABLE IF NOT EXISTS public.dealer_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        full_name TEXT NOT NULL,
        company_name TEXT,
        specialization TEXT NOT NULL,
        experience_years INT NOT NULL DEFAULT 1,
        rating NUMERIC(3,2) NOT NULL DEFAULT 4.8,
        completed_projects INT NOT NULL DEFAULT 0,
        city TEXT NOT NULL,
        locality TEXT,
        hourly_rate NUMERIC(10,2) DEFAULT 1500,
        bio TEXT,
        phone TEXT,
        email TEXT,
        avatar_url TEXT,
        skills TEXT[],
        is_verified BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    """,
    "ALTER TABLE public.dealer_profiles ENABLE ROW LEVEL SECURITY;",
    "DROP POLICY IF EXISTS dealer_profiles_public_read ON public.dealer_profiles;",
    "CREATE POLICY dealer_profiles_public_read ON public.dealer_profiles FOR SELECT USING (true);",
    "DROP POLICY IF EXISTS dealer_profiles_owner_write ON public.dealer_profiles;",
    "CREATE POLICY dealer_profiles_owner_write ON public.dealer_profiles FOR ALL TO authenticated USING (auth.uid() = user_id OR user_id IS NULL) WITH CHECK (auth.uid() = user_id OR user_id IS NULL);",

    # 2. Create projects table
    """
    CREATE TABLE IF NOT EXISTS public.projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        description TEXT,
        buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
        dealer_id UUID NOT NULL REFERENCES public.dealer_profiles(id) ON DELETE CASCADE,
        property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
        project_type TEXT NOT NULL DEFAULT 'construction' CHECK (project_type IN ('construction', 'renovation', 'interior', 'structural')),
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
        total_budget NUMERIC(12,2) NOT NULL DEFAULT 0,
        spent_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
        progress_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
        start_date DATE NOT NULL DEFAULT CURRENT_DATE,
        target_completion_date DATE NOT NULL,
        city TEXT,
        locality TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    """,
    "ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;",
    "DROP POLICY IF EXISTS projects_access_policy ON public.projects;",
    """
    CREATE POLICY projects_access_policy ON public.projects
        FOR ALL TO authenticated
        USING (
            buyer_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.dealer_profiles dp
                WHERE dp.id = projects.dealer_id AND dp.user_id = auth.uid()
            )
        );
    """,

    # 3. Create project_milestones table
    """
    CREATE TABLE IF NOT EXISTS public.project_milestones (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        target_date DATE NOT NULL,
        completed_date DATE,
        budget_allocated NUMERIC(12,2) DEFAULT 0,
        spent NUMERIC(12,2) DEFAULT 0,
        progress_pct NUMERIC(5,2) DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'delayed')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    """,
    "ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;",
    "DROP POLICY IF EXISTS milestones_access_policy ON public.project_milestones;",
    """
    CREATE POLICY milestones_access_policy ON public.project_milestones
        FOR ALL TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM public.projects p
                LEFT JOIN public.dealer_profiles dp ON dp.id = p.dealer_id
                WHERE p.id = project_milestones.project_id
                AND (p.buyer_id = auth.uid() OR dp.user_id = auth.uid())
            )
        );
    """,

    # 4. Create project_updates table
    """
    CREATE TABLE IF NOT EXISTS public.project_updates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
        author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
        author_name TEXT NOT NULL,
        author_role TEXT NOT NULL DEFAULT 'dealer',
        title TEXT NOT NULL,
        notes TEXT NOT NULL,
        progress_delta NUMERIC(5,2) DEFAULT 0,
        log_date DATE NOT NULL DEFAULT CURRENT_DATE,
        attachments TEXT[],
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    """,
    "ALTER TABLE public.project_updates ENABLE ROW LEVEL SECURITY;",
    "DROP POLICY IF EXISTS updates_access_policy ON public.project_updates;",
    """
    CREATE POLICY updates_access_policy ON public.project_updates
        FOR ALL TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM public.projects p
                LEFT JOIN public.dealer_profiles dp ON dp.id = p.dealer_id
                WHERE p.id = project_updates.project_id
                AND (p.buyer_id = auth.uid() OR dp.user_id = auth.uid())
            )
        );
    """,

    # 5. Create project_expenses table
    """
    CREATE TABLE IF NOT EXISTS public.project_expenses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
        uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
        title TEXT NOT NULL,
        category TEXT NOT NULL CHECK (category IN ('invoice', 'receipt', 'photo', 'video', 'permit', 'material')),
        amount NUMERIC(12,2) DEFAULT 0,
        vendor TEXT,
        file_url TEXT,
        notes TEXT,
        expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    """,
    "ALTER TABLE public.project_expenses ENABLE ROW LEVEL SECURITY;",
    "DROP POLICY IF EXISTS expenses_access_policy ON public.project_expenses;",
    """
    CREATE POLICY expenses_access_policy ON public.project_expenses
        FOR ALL TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM public.projects p
                LEFT JOIN public.dealer_profiles dp ON dp.id = p.dealer_id
                WHERE p.id = project_expenses.project_id
                AND (p.buyer_id = auth.uid() OR dp.user_id = auth.uid())
            )
        );
    """,

    # 6. Create project_messages table (for direct Buyer ↔ Dealer project chat)
    """
    CREATE TABLE IF NOT EXISTS public.project_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
        sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
        sender_name TEXT NOT NULL,
        sender_role TEXT NOT NULL CHECK (sender_role IN ('buyer', 'dealer', 'system', 'ai')),
        message TEXT NOT NULL,
        attachments TEXT[],
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    """,
    "ALTER TABLE public.project_messages ENABLE ROW LEVEL SECURITY;",
    "DROP POLICY IF EXISTS project_messages_access_policy ON public.project_messages;",
    """
    CREATE POLICY project_messages_access_policy ON public.project_messages
        FOR ALL TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM public.projects p
                LEFT JOIN public.dealer_profiles dp ON dp.id = p.dealer_id
                WHERE p.id = project_messages.project_id
                AND (p.buyer_id = auth.uid() OR dp.user_id = auth.uid())
            )
        );
    """
]

# Seed Dealers Sample Data
seed_dealers = [
    {
        "full_name": "Vikramaditya Verma",
        "company_name": "Apex Structural & Civil BuildTech",
        "specialization": "Civil Engineering & Structural Construction",
        "experience_years": 14,
        "rating": 4.9,
        "completed_projects": 38,
        "city": "Lucknow",
        "locality": "Gomti Nagar",
        "hourly_rate": 2200,
        "bio": "Specialized in RCC frame structures, heavy plot foundations, and luxury residential villas in Uttar Pradesh.",
        "phone": "+91 98765 43210",
        "email": "vikram.verma@apexbuild.in",
        "avatar_url": "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80",
        "skills": ["Structural RCC", "Foundation Engineering", "Soil Stabilization", "AutoCAD Architecture", "Vastu Compliant"]
    },
    {
        "full_name": "Er. Priya Sharma",
        "company_name": "Urban Space Renovation Studio",
        "specialization": "Turnkey Residential Renovation & Interior Structural Works",
        "experience_years": 9,
        "rating": 4.8,
        "completed_projects": 26,
        "city": "Lucknow",
        "locality": "Hazratganj",
        "hourly_rate": 1800,
        "bio": "Award-winning civil engineer specializing in complete home transformations, structural alterations, and high-end interiors.",
        "phone": "+91 98123 45678",
        "email": "priya@urbanspace.co.in",
        "avatar_url": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
        "skills": ["Interior Renovation", "Electrical & Plumbing", "3D Elevation", "Material Quality Control"]
    },
    {
        "full_name": "Rajesh Kumar Soni",
        "company_name": "Soni Builders & Infrastructure",
        "specialization": "Plot Land Development & Boundary Foundation",
        "experience_years": 18,
        "rating": 4.7,
        "completed_projects": 62,
        "city": "Delhi NCR",
        "locality": "Noida Sector 62",
        "hourly_rate": 2500,
        "bio": "Expert contractor in boundary walls, land leveling, drainage networks, and commercial structure erection.",
        "phone": "+91 99887 76655",
        "email": "rajesh@sonibuilders.com",
        "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
        "skills": ["Land Leveling", "Retaining Walls", "Drainage Infra", "Heavy Machinery Management"]
    },
    {
        "full_name": "Ananya Roy",
        "company_name": "GreenTerra Sustainable Engineering",
        "specialization": "Eco-Friendly Construction & Solar Modular Homes",
        "experience_years": 7,
        "rating": 4.95,
        "completed_projects": 19,
        "city": "Bangalore",
        "locality": "Indiranagar",
        "hourly_rate": 2100,
        "bio": "Specialized in sustainable building materials, rainwater harvesting integration, and smart green energy homes.",
        "phone": "+91 97766 55443",
        "email": "ananya@greenterra.in",
        "avatar_url": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80",
        "skills": ["Green Building", "Solar Power Grid Setup", "Thermal Insulation", "Prefabricated Structures"]
    }
]

try:
    print("Connecting to Supabase PostgreSQL database...")
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
        print(f"Executing DDL step {idx + 1}...")
        cur.execute(cmd)

    print("DDL Migration complete. Inserting seed dealer profiles...")
    for dealer in seed_dealers:
        cur.execute("SELECT id FROM public.dealer_profiles WHERE full_name = %s;", (dealer["full_name"],))
        res = cur.fetchone()
        if not res:
            cur.execute("""
                INSERT INTO public.dealer_profiles (
                    full_name, company_name, specialization, experience_years, rating,
                    completed_projects, city, locality, hourly_rate, bio, phone, email, avatar_url, skills
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
            """, (
                dealer["full_name"], dealer["company_name"], dealer["specialization"],
                dealer["experience_years"], dealer["rating"], dealer["completed_projects"],
                dealer["city"], dealer["locality"], dealer["hourly_rate"], dealer["bio"],
                dealer["phone"], dealer["email"], dealer["avatar_url"], dealer["skills"]
            ))
            print(f"  Inserted dealer: {dealer['full_name']}")
        else:
            print(f"  Dealer already exists: {dealer['full_name']}")

    print("\nSUCCESS! GEB V3 Dealer and Project Monitoring database schema & seed data ready.")
    cur.close()
    conn.close()
except Exception as e:
    print("ERROR executing migration script:", e)
