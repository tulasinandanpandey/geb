import psycopg2

host = "db.ljqkrzikddhaltdxlpfj.supabase.co"
user = "postgres"
password = "RIshi@919876"
database = "postgres"
port = 5432

try:
    conn = psycopg2.connect(
        host=host,
        user=user,
        password=password,
        dbname=database,
        port=port
    )
    cur = conn.cursor()
    cur.execute("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'properties' AND table_schema = 'public';
    """)
    rows = cur.fetchall()
    print("Properties Table Columns:")
    for row in rows:
        print(f"  {row[0]}: {row[1]}")
    cur.close()
    conn.close()
except Exception as e:
    print("Error:", e)
