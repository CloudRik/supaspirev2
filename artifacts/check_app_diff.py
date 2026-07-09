with open("artifacts/git_diff_full.txt", "r", encoding="utf-8", errors="ignore") as f:
    diff_content = f.read()

# Find the diff section for App.tsx
import re
match = re.search(r'diff --git a/artifacts/zenith-os/src/App.tsx.*?(?=diff --git|$)', diff_content, re.DOTALL)
if match:
    print("App.tsx Diff:")
    print(match.group(0))
else:
    print("No diff found for App.tsx")
