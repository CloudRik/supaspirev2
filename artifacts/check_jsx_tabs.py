with open(r"C:\Users\is511\Downloads\zenith-os-main\zenith-os-main\artifacts\zenith-os\src\pages\supaspire.tsx", "r", encoding="utf-8") as f:
    content = f.read()

import re
matches = list(re.finditer(r'\{activeTab\s*===\s*\"([^\"]+)\"\s*&&', content))
print(f"Found {len(matches)} JSX rendering checks for activeTab:")
for m in matches:
    print(f"  {m.group(0)} at position {m.start()}")
    # print next 200 chars
    print(content[m.start():m.start()+200] + "\n")
