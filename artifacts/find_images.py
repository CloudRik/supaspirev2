import os
import glob

search_paths = [
    r"C:\Users\is511\Downloads\zenith-os-main\zenith-os-main\**",
    r"C:\Users\is511\.gemini\antigravity\**"
]

images = []
for path in search_paths:
    for ext in ["*.png", "*.jpg", "*.jpeg", "*.webp"]:
        for file in glob.glob(os.path.join(path, ext), recursive=True):
            # Exclude node_modules
            if "node_modules" not in file:
                images.append(file)

print(f"Found {len(images)} images:")
for img in sorted(images):
    print(f"  {img} (size: {os.path.getsize(img)} bytes)")
