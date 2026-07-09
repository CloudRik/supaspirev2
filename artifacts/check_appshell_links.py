with open(r"C:\Users\is511\Downloads\zenith-os-main\zenith-os-main\artifacts\zenith-os\src\components\AppShell.tsx", "r", encoding="utf-8") as f:
    content = f.read()

keywords = ["team", "billing", "tokens", "webhooks", "supaspire", "Link", "setLocation"]
for kw in keywords:
    idx = 0
    matches = []
    while True:
        idx = content.lower().find(kw.lower(), idx)
        if idx == -1:
            break
        matches.append(idx)
        idx += len(kw)
    print(f"Keyword '{kw}' found {len(matches)} times")
    for m in matches[:5]:
        start = max(0, m - 50)
        end = min(len(content), m + 100)
        snippet = content[start:end].replace('\n', ' ')
        print(f"  pos {m}: ...{snippet}...")
