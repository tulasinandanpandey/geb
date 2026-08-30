import psycopg2
import os

host = os.getenv("SUPABASE_DB_HOST", "db.ljqkrzikddhaltdxlpfj.supabase.co")
user = os.getenv("SUPABASE_DB_USER", "postgres")
database = os.getenv("SUPABASE_DB_NAME", "postgres")
port = int(os.getenv("SUPABASE_DB_PORT", "5432"))

passwords = [
    value
    for value in [
        os.getenv("SUPABASE_DB_PASSWORD"),
        os.getenv("SUPABASE_SERVICE_ROLE_KEY"),
        os.getenv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
    ]
    if value
]

for pwd in passwords:
    try:
        print(f"Trying password: {pwd[:15]}...")
        conn = psycopg2.connect(
            host=host,
            user=user,
            password=pwd,
            dbname=database,
            port=port,
            connect_timeout=3
        )
        print("SUCCESS! Connected with configured password.")
        conn.close()
        break
    except Exception as e:
        print("Failed:", str(e).strip())
