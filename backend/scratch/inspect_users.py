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
    
    for table in ['profiles', 'user_roles']:
        cur.execute(f"""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = '{table}' AND table_schema = 'public';
        """)
        print(f"\n{table} columns:")
        for row in cur.fetchall():
            print(f"  {row[0]} ({row[1]})")
            
    cur.close()
    conn.close()
except Exception as e:
    print("Error:", e)
