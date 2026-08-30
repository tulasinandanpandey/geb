import socket
import psycopg2
import os

host = os.getenv("SUPABASE_DB_HOST", "db.ljqkrzikddhaltdxlpfj.supabase.co")
user = os.getenv("SUPABASE_DB_USER", "postgres")
password = os.getenv("SUPABASE_DB_PASSWORD")
database = os.getenv("SUPABASE_DB_NAME", "postgres")
port = int(os.getenv("SUPABASE_DB_PORT", "5432"))

if not password:
    raise RuntimeError("SUPABASE_DB_PASSWORD is required")

try:
    print(f"Resolving {host}...")
    infos = socket.getaddrinfo(host, port, socket.AF_INET)
    ipv4_addresses = [info[4][0] for info in infos]
    print("IPv4 addresses found:", ipv4_addresses)
    
    if not ipv4_addresses:
        print("No IPv4 address found.")
    else:
        ip = ipv4_addresses[0]
        print(f"Connecting to {ip} on port {port}...")
        conn = psycopg2.connect(
            host=ip,
            user=user,
            password=password,
            dbname=database,
            port=port,
            connect_timeout=10
        )
        print("SUCCESS! Connected to PostgreSQL database over IPv4.")
        cur = conn.cursor()
        cur.execute("SELECT version();")
        print("Postgres version:", cur.fetchone())
        cur.close()
        conn.close()
except Exception as e:
    print("Error:", e)
