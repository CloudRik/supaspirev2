with open("artifacts/git_diff_full.txt", "r", encoding="utf-8", errors="ignore") as f:
    diff_content = f.read()

# Find the diff section for dashboard.tsx
import re
match = re.search(r'diff --git a/artifacts/zenith-os/src/pages/dashboard.tsx.*?(?=diff --git|$)', diff_content, re.DOTALL)
if match:
    print("dashboard.tsx Diff:")
    print(match.group(0)[:1500] + "\n...")
else:
    print("No diff found for dashboard.tsx")
