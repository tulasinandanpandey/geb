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
    cur.execute("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'properties' AND table_schema = 'public';
    """)
    rows = cur.fetchall()
    print("Properties columns:")
    for row in rows:
        print(f"  {row[0]} ({row[1]})")
        
    cur.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public';
    """)
    print("\nAll public tables:")
    for row in cur.fetchall():
        print(f"  {row[0]}")
        
    cur.close()
    conn.close()
except Exception as e:
    print("Error:", e)
