import socket
import psycopg2

regions = [
    "us-east-2",
    "ap-southeast-2",
    "ap-northeast-1",
    "ap-northeast-2",
    "ca-central-1",
    "eu-west-3",
    "eu-north-1",
    "sa-east-1"
]

project_ref = "ljqkrzikddhaltdxlpfj"
user = f"postgres.{project_ref}"
password = "RIshi@919876"
database = "postgres"
port = 6543

for region in regions:
    host = f"aws-0-{region}.pooler.supabase.com"
    try:
        print(f"Resolving {host}...")
        infos = socket.getaddrinfo(host, port, socket.AF_INET)
        ipv4_addresses = [info[4][0] for info in infos]
        if ipv4_addresses:
            print(f"Resolved {region} to {ipv4_addresses[0]}. Connecting...")
            conn = psycopg2.connect(
                host=host,
                user=user,
                password=password,
                dbname=database,
                port=port,
                connect_timeout=5
            )
            print(f"SUCCESS! Connected to pooler {host} in region {region}.")
            cur = conn.cursor()
            cur.execute("SELECT version();")
            print("Postgres version:", cur.fetchone())
            cur.close()
            conn.close()
            break
        else:
            print("No IPv4 address.")
    except Exception as e:
        print(f"Failed for {region}:", str(e).strip())
