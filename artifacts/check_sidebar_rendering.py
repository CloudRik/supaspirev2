with open(r"C:\Users\is511\Downloads\zenith-os-main\zenith-os-main\artifacts\zenith-os\src\components\AppShell.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Let's search for rendering of the main sidebar items.
# They are probably drawn in a loop over main items.
# Let's search for "Services" or the rendering of Icon / label.
import re
match = re.search(r'\{\/\* Main Navigation Items \*\/.*?\}', content, re.DOTALL)
if match:
    print("Main Navigation Items render block:")
    print(match.group(0))
else:
    # Print lines containing "Services" or "Management" or rendering logic
    lines = content.splitlines()
    for idx, line in enumerate(lines):
        if "item.label" in line or "item.icon" in line or "activeNav ===" in line:
            print(f"Line {idx+1}: {line.strip()}")
            # print surrounding lines
            for offset in range(-5, 6):
                if 0 <= idx + offset < len(lines):
                    print(f"  {idx+offset+1}: {lines[idx+offset].strip()}")
            print("-" * 30)
