import psycopg2

host = "db.ljqkrzikddhaltdxlpfj.supabase.co"
user = "postgres"
database = "postgres"
port = 5432

passwords = [
    "geb_password",
    "geb_secret",
    "geb_database",
    "global_estate_bridge",
    "GlobalEstateBridge",
    "geb123",
    "supabase_password",
    "supabase123",
    "Supabase123",
    "postgres123",
    "Postgres123",
]

for pwd in passwords:
    try:
        print(f"Trying password: {pwd}...")
        conn = psycopg2.connect(
            host=host,
            user=user,
            password=pwd,
            dbname=database,
            port=port,
            connect_timeout=3
        )
        print("SUCCESS! Connected with password:", pwd)
        conn.close()
        break
    except Exception as e:
        print("Failed:", str(e).strip())
