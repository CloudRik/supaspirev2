with open(r"C:\Users\is511\Downloads\zenith-os-main\zenith-os-main\artifacts\zenith-os\src\pages\supaspire.tsx", "r", encoding="utf-8") as f:
    content = f.read()

start_idx = content.find('{activeTab === "Storage" &&')
end_idx = content.find('{activeTab === "Real-time" &&')
if start_idx != -1 and end_idx != -1:
    storage_block = content[start_idx:end_idx]
    print("Storage tab block length:", len(storage_block))
    # Find any subTab or activeSubTab checks inside it
    import re
    checks = re.findall(r'(\w+SubTab|subTab|\w+Tab)\s*===\s*\"([^\"]+)\"', storage_block)
    print("Checks inside Storage block:", list(set(checks)))
    
    # Print lines that look like checks or section headers
    for line in storage_block.splitlines():
        if "subTab ===" in line or "activeSubTab ===" in line or "&& (" in line or "h3" in line or "h2" in line:
            print("  ", line.strip())
else:
    print("Could not find start/end indexes for Storage tab block")
