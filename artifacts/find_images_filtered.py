import os
import glob

search_paths = [
    r"C:\Users\is511\Downloads\zenith-os-main\zenith-os-main\artifacts\*",
    r"C:\Users\is511\Downloads\zenith-os-main\zenith-os-main\artifacts\**\*",
    r"C:\Users\is511\.gemini\antigravity\*"
]

images = []
for p in search_paths:
    for ext in ["*.png", "*.jpg", "*.jpeg", "*.webp"]:
        for file in glob.glob(p + ext, recursive=True):
            if "browser_recordings" not in file and "node_modules" not in file:
                images.append(file)

print(f"Filtered images ({len(images)}):")
for img in sorted(list(set(images))):
    print(f"  {img} (size: {os.path.getsize(img)} bytes)")
