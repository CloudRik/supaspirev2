import os
import re

brain_dir = r"C:\Users\is511\.gemini\antigravity\brain"
matches = []

for root, dirs, files in os.walk(brain_dir):
    for file in files:
        if file == "overview.txt":
            path = os.path.join(root, file)
            try:
                with open(path, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                
                # Search for view_file on AppShell.tsx
                for m in re.finditer(r'view_file.*AppShell\.tsx', content, re.IGNORECASE):
                    start = max(0, m.start() - 500)
                    end = min(len(content), m.end() + 5000)
                    matches.append((path, m.start(), content[start:end]))
            except Exception as e:
                print(f"Error reading {path}: {e}")

print(f"Found {len(matches)} views across all conversations.")
for idx, (path, pos, ctx) in enumerate(matches):
    # Get the parent directory name (which is the conversation ID)
    parts = path.split(os.sep)
    # The conversation ID is usually 2 levels up from overview.txt
    conv_id = parts[-4] if len(parts) >= 4 else "unknown"
    print(f"\n=== MATCH {idx} in CONV: {conv_id} (pos {pos}) ===")
    ctx_clean = ctx.replace("\n", " ")
    print(ctx_clean[:400] + "\n...")
