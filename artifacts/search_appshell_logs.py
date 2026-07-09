import re

log_path = r"C:\Users\is511\.gemini\antigravity\brain\6b240949-575a-41ab-ad40-a55f7f4f845e\.system_generated\logs\overview.txt"
with open(log_path, "r", encoding="utf-8", errors="ignore") as f:
    text = f.read()

# Let's search for "AppShell.tsx"
matches = []
for m in re.finditer(r'AppShell\.tsx', text):
    # Find step index around this position
    prev_text = text[max(0, m.start() - 2000):m.start()]
    step_match = list(re.finditer(r'\"step_index\"\s*:\s*(\d+)', prev_text))
    step_idx = int(step_match[-1].group(1)) if step_match else 0
    
    if step_idx < 7716:
        start = max(0, m.start() - 200)
        end = min(len(text), m.end() + 200)
        matches.append((step_idx, m.start(), text[start:end]))

print(f"Total AppShell.tsx occurrences before step 7716: {len(matches)}")
for idx, (step_idx, pos, ctx) in enumerate(matches):
    ctx_clean = ctx.replace("\n", " ")
    print(f"Match {idx}: Step {step_idx} (pos {pos}): ...{ctx_clean[:250]}...")
