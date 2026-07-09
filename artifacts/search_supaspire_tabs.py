import re

file_path = r"C:\Users\is511\Downloads\zenith-os-main\zenith-os-main\artifacts\zenith-os\src\pages\supaspire.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Find all blocks like activeTab === "..."
matches = re.findall(r'activeTab\s*===\s*\"([^\"]+)\"', content)
print("activeTab checks in supaspire.tsx:")
print(list(set(matches)))

# Find all blocks like activeSubTab === "..." or subTab === "..."
sub_matches = re.findall(r'(activeSubTab|subTab|activeDbSubTab)\s*===\s*\"([^\"]+)\"', content)
print("Subtab checks in supaspire.tsx:")
print(list(set([m[1] for m in sub_matches])))
