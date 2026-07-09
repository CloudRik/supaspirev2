with open(r"C:\Users\is511\Downloads\zenith-os-main\zenith-os-main\artifacts\zenith-os\src\pages\supaspire.tsx", "r", encoding="utf-8") as f:
    content = f.read()

start_idx = content.find('{activeTab === "Authentication" &&')
end_idx = content.find('{activeTab === "Storage" &&')
if start_idx != -1 and end_idx != -1:
    auth_block = content[start_idx:end_idx]
    print("Authentication tab block length:", len(auth_block))
    # Find any subTab or activeSubTab checks inside it
    import re
    checks = re.findall(r'(\w+SubTab|subTab|\w+Tab)\s*===\s*\"([^\"]+)\"', auth_block)
    print("Checks inside Auth block:", list(set(checks)))
    
    # Print lines that look like checks or section headers
    for line in auth_block.splitlines():
        if "subTab ===" in line or "activeSubTab ===" in line or "&& (" in line or "h3" in line or "h2" in line:
            print("  ", line.strip())
else:
    print("Could not find start/end indexes for Authentication tab block")
