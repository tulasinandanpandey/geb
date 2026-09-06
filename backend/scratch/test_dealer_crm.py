import urllib.request
import json

base_url = "http://127.0.0.1:8000"

print("1. Testing GET /api/health...")
try:
    req = urllib.request.urlopen(f"{base_url}/api/health")
    res = json.loads(req.read().decode('utf-8'))
    print("Health check response:", res)
except Exception as e:
    print("Health check failed:", e)

print("\n2. Testing GET /api/dealers...")
try:
    req = urllib.request.urlopen(f"{base_url}/api/dealers")
    res = json.loads(req.read().decode('utf-8'))
    dealers = res.get("dealers", [])
    print(f"Success! Found {len(dealers)} dealers in marketplace:")
    for d in dealers[:3]:
        print(f" - {d.get('full_name')} | {d.get('specialization')} | ₹{d.get('hourly_rate')}/hr | {d.get('city')}")
except Exception as e:
    print("Get dealers failed:", e)
