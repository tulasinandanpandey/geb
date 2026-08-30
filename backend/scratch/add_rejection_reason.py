import psycopg2

host = "aws-0-ap-northeast-1.pooler.supabase.com"
user = "postgres.ljqkrzikddhaltdxlpfj"
password = "RIshi@919876"
database = "postgres"
port = 6543

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
    
    print("Adding rejection_reason column to properties table...")
    cur.execute("ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS rejection_reason TEXT;")
    print("SUCCESS! Column added successfully.")
    
    cur.close()
    conn.close()
except Exception as e:
    print("Error:", e)
