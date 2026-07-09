import re

with open(r'C:\Users\is511\Downloads\zenith-os-main\zenith-os-main\artifacts\zenith-os\src\pages\supaspire.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find and replace the entire modal block
# From {modalOpen && ( ... )} at the end
modal_start_marker = '      {modalOpen && ('
modal_end_marker = '      )}\n\n    </AppShell>'

start_idx = content.find(modal_start_marker)
end_idx = content.find(modal_end_marker, start_idx)

print(f"start: {start_idx}, end: {end_idx}")
print("Before replacement length:", len(content))

new_modal = '''      {/* CREATE PROJECT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">

            {/* Header */}
            <div className="px-7 pt-7 pb-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-slate-900">Create a new project</h3>
                  <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">Your project will have its own dedicated instance and full postgres database.</p>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors mt-0.5 ml-4 shrink-0"
                >
                  <Plus className="w-4 h-4 rotate-45" />
                </button>
              </div>
            </div>

            <div className="border-t border-slate-100" />

            {/* Body */}
            <div className="px-7 py-6 space-y-5 max-h-[65vh] overflow-y-auto">

              {/* Organization */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Organization</label>
                <input
                  type="text"
                  readOnly
                  value="Personal Account"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed"
                />
              </div>

              {/* Project Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Project name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="My Awesome Project"
                  value={projName}
                  onChange={(e) => setProjName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
                />
                {projName && (
                  <p className="text-xs text-slate-400 mt-1.5">This will be used to identify your project in the dashboard.</p>
                )}
              </div>

              {/* Database Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Database Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Type a password"
                    value={dbPassword}
                    onChange={(e) => setDbPassword(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg pl-4 pr-11 py-2.5 text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Region */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Region</label>
                <div className="relative">
                  <select className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 appearance-none pr-10">
                    <option>AP South (Mumbai)</option>
                    <option>AP Southeast (Singapore)</option>
                    <option>US East (N. Virginia)</option>
                    <option>EU West (Frankfurt)</option>
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-1.5">Select a region closest to your users for best performance.</p>
              </div>

              {/* Pricing Plan */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">Pricing Plan</label>
                <div className="grid grid-cols-2 gap-3">

                  {/* Free */}
                  <label className="cursor-pointer">
                    <input type="radio" name="plan" value="free" defaultChecked className="sr-only peer" />
                    <div className="border-2 border-slate-200 peer-checked:border-black rounded-xl p-4 transition-colors h-full">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-slate-900">Free</span>
                      </div>
                      <p className="text-xs text-slate-500 mb-3">Perfect for hobby projects</p>
                      <p className="text-xl font-bold text-slate-900 mb-3">$0<span className="text-sm font-normal text-slate-500">/month</span></p>
                      <ul className="space-y-1.5">
                        <li className="text-xs text-slate-600 flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-slate-500 shrink-0" /> Up to 500MB database
                        </li>
                        <li className="text-xs text-slate-600 flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-slate-500 shrink-0" /> 1GB file storage
                        </li>
                      </ul>
                    </div>
                  </label>

                  {/* Pro */}
                  <label className="cursor-pointer">
                    <input type="radio" name="plan" value="pro" className="sr-only peer" />
                    <div className="border-2 border-slate-200 peer-checked:border-black rounded-xl p-4 transition-colors h-full relative">
                      <div className="absolute top-3 right-3 bg-black text-white text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full">Popular</div>
                      <div className="mb-1">
                        <span className="text-sm font-semibold text-slate-900">Pro</span>
                      </div>
                      <p className="text-xs text-slate-500 mb-3">For production applications</p>
                      <p className="text-xl font-bold text-slate-900 mb-3">$25<span className="text-sm font-normal text-slate-500">/month</span></p>
                      <ul className="space-y-1.5">
                        <li className="text-xs text-slate-600 flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-slate-500 shrink-0" /> 8GB database
                        </li>
                        <li className="text-xs text-slate-600 flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-slate-500 shrink-0" /> 100GB file storage
                        </li>
                      </ul>
                    </div>
                  </label>

                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 px-7 py-4 flex items-center justify-end gap-3">
              <button
                onClick={() => setModalOpen(false)}
                className="h-9 px-5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!projName.trim()) return;
                  setModalOpen(false);
                  startCreationAnimation(projName, dbPassword);
                }}
                disabled={!projName.trim()}
                className="h-9 px-5 rounded-lg bg-black text-white text-sm font-medium hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Create project
              </button>
            </div>

          </div>
        </div>
      )}'''

# Replace the old modal with new one
old_modal = content[start_idx:end_idx + len('      )}\n\n    </AppShell>') - len('\n\n    </AppShell>')]

# Actually just replace from start to right before the closing AppShell
before = content[:start_idx]
after = content[end_idx:]  # This includes "      )}\n\n    </AppShell>..."

# The after part starts with "      )}" - we need to skip the old modal's closing ")}"
# Find the end of the modal block
after_clean = '\n\n    </AppShell>' + content[end_idx + len('      )}\n\n    </AppShell>'):]

new_content = before + new_modal + after_clean
print("After replacement length:", len(new_content))

with open(r'C:\Users\is511\Downloads\zenith-os-main\zenith-os-main\artifacts\zenith-os\src\pages\supaspire.tsx', 'w', encoding='utf-8', newline='\n') as f:
    f.write(new_content)

print("Done!")
