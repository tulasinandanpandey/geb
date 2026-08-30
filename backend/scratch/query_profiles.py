import psycopg2

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
    cur = conn.cursor()
    cur.execute("SELECT id, email, full_name, role FROM public.profiles;")
    rows = cur.fetchall()
    print("Profiles:")
    for row in rows:
        print(f"  ID: {row[0]}, Email: {row[1]}, Name: {row[2]}, Role: {row[3]}")
    cur.close()
    conn.close()
except Exception as e:
    print("Error:", e)
