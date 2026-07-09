with open(r"C:\Users\is511\Downloads\zenith-os-main\zenith-os-main\artifacts\zenith-os\src\components\AppShell.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

for idx in range(143, min(300, len(lines))):
    print(f"{idx+1}: {lines[idx]}", end="")
