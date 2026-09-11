import sqlite3
import json

db_path = r'C:\Users\KUSHAL\.gemini\antigravity-ide\conversations\5999f2a9-36d0-4f78-a596-a5426d8ba939.db'
conn = sqlite3.connect(f'file:{db_path}?mode=ro', uri=True)
cur = conn.cursor()

cur.execute("SELECT idx, step_payload FROM steps WHERE step_payload LIKE '%planning/page.tsx%'")
rows = cur.fetchall()
print(f"Found {len(rows)} matching steps")

for idx, payload in reversed(rows):
    if isinstance(payload, bytes):
        payload_str = payload.decode('utf-8', errors='ignore')
    else:
        payload_str = str(payload)
        
    if "CodeContent" in payload_str:
        try:
            data = json.loads(payload_str)
            calls = []
            if isinstance(data, dict):
                calls = data.get("tool_calls", []) or data.get("planner_response", {}).get("tool_calls", [])
            elif isinstance(data, list):
                for item in data:
                    if isinstance(item, dict):
                        calls.extend(item.get("tool_calls", []))
            
            for call in calls:
                args = call.get("args") or call.get("function", {}).get("arguments") or {}
                if isinstance(args, str):
                    try:
                        args = json.loads(args)
                    except:
                        pass
                if isinstance(args, dict) and "planning/page.tsx" in args.get("TargetFile", ""):
                    code = args.get("CodeContent")
                    if code and len(code) > 1000:
                        print(f"Found CodeContent with {len(code)} bytes in step idx {idx}!")
                        with open(r"C:\Maritime\app\planning\page.tsx", "w", encoding="utf-8") as f:
                            f.write(code)
                        print("RESTORED app/planning/page.tsx SUCCESSFULLY!")
                        exit(0)
        except Exception as e:
            print(f"Idx {idx} parse error: {e}")

print("Checking finished.")
