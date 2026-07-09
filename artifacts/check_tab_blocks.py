import re

file_path = r"C:\Users\is511\Downloads\zenith-os-main\zenith-os-main\artifacts\zenith-os\src\pages\supaspire.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

tabs = ["Overview", "Database", "Authentication", "Storage", "Real-time", "Functions"]
for tab in tabs:
    idx = content.find(f'activeTab === "{tab}"')
    if idx != -1:
        print(f"Tab '{tab}' found at position {idx}, snippet:")
        print(content[idx:idx+300] + "\n...\n")
    else:
        print(f"Tab '{tab}' NOT found!")
