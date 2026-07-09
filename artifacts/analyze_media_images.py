import os
import glob
from datetime import datetime

brain_dir = r"C:\Users\is511\.gemini\antigravity\brain\6b240949-575a-41ab-ad40-a55f7f4f845e"
media_files = glob.glob(os.path.join(brain_dir, "media__*"))

print("Media files:")
for f in sorted(media_files):
    mtime = os.path.getmtime(f)
    dt = datetime.fromtimestamp(mtime)
    # Check if file has some prefix or is recent
    print(f"  {os.path.basename(f)}: size {os.path.getsize(f)} bytes, modified: {dt}")
