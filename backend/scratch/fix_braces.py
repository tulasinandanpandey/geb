with open("frontend/src/app/page.tsx", "r", encoding="utf-8") as f:
    code = f.read()

# Append a closing brace
new_code = code.strip() + "\n}\n"

with open("frontend/src/app/page.tsx", "w", encoding="utf-8") as f:
    f.write(new_code)

print("Appended closing brace.")
