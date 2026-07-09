with open(r"C:\Users\is511\Downloads\zenith-os-main\zenith-os-main\artifacts\zenith-os\src\components\AppShell.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

# Let's check lines 400 to 700 where the sidebar is rendered
for idx in range(400, min(700, len(lines))):
    print(f"{idx+1}: {lines[idx]}", end="")
