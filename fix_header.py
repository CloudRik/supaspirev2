import re

with open(r'C:\Users\is511\Downloads\zenith-os-main\zenith-os-main\artifacts\zenith-os\src\pages\supaspire.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_header = '''          {/* Header */}
          <div className="flex items-start justify-between pb-6 border-b border-slate-200 mb-8">
            <div>
              <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-400 uppercase tracking-wider">
                <Server className="w-3.5 h-3.5" />
                <span>Supaspire Project</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mt-1">{project.name}</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Region: OCI Mumbai (Self-Hosted)</p>
            </div>
            
            <button
              onClick={handleDeleteProject}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Project</span>
            </button>
          </div>'''

new_header = '''          {/* Header */}
          <div className="flex items-start justify-between pb-6 border-b border-slate-200 mb-8">
            <div>
              <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-400 uppercase tracking-wider">
                <Server className="w-3.5 h-3.5" />
                <span>Supaspire Project</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mt-1">{project.name}</h1>
            </div>

            {/* Location Box */}
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-600 font-medium">
              <HardDrive className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>OCI Mumbai</span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-400">Self-Hosted</span>
            </div>
          </div>'''

if old_header in content:
    content = content.replace(old_header, new_header, 1)
    print("Replaced successfully!")
else:
    print("NOT FOUND — trying normalized search...")
    # Try with \r\n
    old_norm = old_header.replace('\n', '\r\n')
    if old_norm in content:
        content = content.replace(old_norm, new_header, 1)
        print("Replaced with CRLF!")
    else:
        print("STILL NOT FOUND")
        # Print what's around line 278
        idx = content.find('flex items-start justify-between pb-6 border-b')
        print(f"Found at {idx}")
        print(repr(content[idx-200:idx+600]))

with open(r'C:\Users\is511\Downloads\zenith-os-main\zenith-os-main\artifacts\zenith-os\src\pages\supaspire.tsx', 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)
print("File written.")
