with open(r'C:\Users\is511\Downloads\zenith-os-main\zenith-os-main\artifacts\zenith-os\src\pages\supaspire.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the Overview tab start and end
overview_start = content.find("          {/* ─────────────────── SUB-TAB: OVERVIEW ─────────────────── */}")
if overview_start == -1:
    overview_start = content.find('{activeTab === "Overview" &&')
    # go back to find the comment
    temp = content.rfind('\n', 0, overview_start)
    overview_start = content.rfind('\n', 0, temp) + 1

database_tab_start = content.find('{activeTab === "Database" &&')
# go back to find the comment line
database_comment = content.rfind('\n', 0, database_tab_start)
database_comment = content.rfind('\n', 0, database_comment) + 1

print(f"overview_start: {overview_start}")
print(f"database_tab_start: {database_comment}")
print("Before:", repr(content[overview_start:overview_start+80]))
print("After boundary:", repr(content[database_comment:database_comment+80]))

new_overview = '''          {/* SUB-TAB: OVERVIEW */}
          {activeTab === "Overview" && (
            <div className="grid grid-cols-3 gap-6">

              {/* LEFT COLUMN — 2/3 width */}
              <div className="col-span-2 space-y-5">

                {/* API Credentials Card */}
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-base font-semibold text-slate-900">API Credentials</h2>
                    <button className="text-slate-400 hover:text-slate-600 transition-colors">
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-5">

                    {/* Project URL */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Project URL</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          readOnly
                          value={project.apiUrl}
                          className="flex-1 bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm font-mono text-slate-700 focus:outline-none"
                        />
                        <button
                          onClick={() => handleCopy(project.apiUrl, "apiUrl")}
                          className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-600 hover:bg-slate-50 transition-colors shrink-0"
                        >
                          {copiedField === "apiUrl" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedField === "apiUrl" ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                    </div>

                    {/* Anon Public Key */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Anon Public Key</label>
                      <div className="flex gap-2">
                        <input
                          type={showSecrets["apiKey"] ? "text" : "password"}
                          readOnly
                          value={project.apiKey}
                          className="flex-1 bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm font-mono text-slate-700 focus:outline-none"
                        />
                        <button
                          onClick={() => toggleSecret("apiKey")}
                          className="h-10 w-10 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 shrink-0"
                        >
                          {showSecrets["apiKey"] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleCopy(project.apiKey, "apiKey")}
                          className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-600 hover:bg-slate-50 transition-colors shrink-0"
                        >
                          {copiedField === "apiKey" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedField === "apiKey" ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                      <p className="text-xs text-slate-400 mt-1.5">This key is safe to use in a browser if you have Row Level Security enabled.</p>
                    </div>

                    {/* Service Role Key */}
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <label className="text-sm font-medium text-slate-700">Service Role Key</label>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-600 border border-red-100">Secret</span>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type={showSecrets["dbUrl"] ? "text" : "password"}
                          readOnly
                          value={project.dbUrl}
                          className="flex-1 bg-white border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm font-mono text-slate-700 focus:outline-none"
                        />
                        <button
                          onClick={() => toggleSecret("dbUrl")}
                          className="h-10 w-10 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 shrink-0"
                        >
                          {showSecrets["dbUrl"] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleCopy(project.dbUrl, "dbUrl")}
                          className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-600 hover:bg-slate-50 transition-colors shrink-0"
                        >
                          {copiedField === "dbUrl" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedField === "dbUrl" ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                      <p className="text-xs text-slate-400 mt-1.5">This key has the ability to bypass Row Level Security. Never share it publicly.</p>
                    </div>

                  </div>
                </div>

                {/* Quick Connect Card */}
                <div className="bg-white border border-slate-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-base font-semibold text-slate-900">Quick Connect</h2>
                    <span className="text-xs text-slate-500 font-medium">JavaScript</span>
                  </div>
                  <p className="text-sm text-slate-500 mb-4">Get started by installing the SDK and initializing your client.</p>

                  {/* Light code block */}
                  <div className="relative bg-slate-50 border border-slate-200 rounded-lg px-4 py-4 font-mono text-[13px] text-slate-700 leading-relaxed overflow-x-auto">
                    <button
                      onClick={() => handleCopy(`import { createClient } from '@supaspire/js'\n\nconst provider = createClient('${project.apiUrl}', 'YOUR_ANON_KEY')`, "quickconnect")}
                      className="absolute top-3 right-3 h-7 w-7 rounded border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50"
                    >
                      {copiedField === "quickconnect" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <pre className="whitespace-pre-wrap break-all pr-8">{`import { createClient } from '@supaspire/js'

const provider = createClient(
  '${project.apiUrl}',
  'YOUR_ANON_KEY'
)`}</pre>
                  </div>

                  <div className="mt-4 flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 cursor-pointer w-fit">
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>View full documentation</span>
                  </div>
                </div>

              </div>

              {/* RIGHT COLUMN — 1/3 width */}
              <div className="col-span-1 space-y-5">

                {/* Service Status Card */}
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                  <h2 className="text-base font-semibold text-slate-900 mb-4">Service Status</h2>
                  <div className="space-y-3">
                    {[
                      { label: "Database", icon: Database },
                      { label: "Authentication", icon: Lock },
                      { label: "Storage", icon: Package },
                      { label: "Real-time", icon: Activity },
                      { label: "Functions", icon: Terminal },
                    ].map((s) => (
                      <div key={s.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-center">
                            <s.icon className="w-3.5 h-3.5 text-slate-500" />
                          </div>
                          <span className="text-sm text-slate-700 font-medium">{s.label}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Active</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Usage This Month Card */}
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold text-slate-900">Usage This Month</h2>
                    <button className="text-xs text-blue-500 hover:text-blue-700 font-medium">View all</button>
                  </div>
                  <div className="space-y-4">
                    {[
                      { label: "Database", used: 234, total: 500, unit: "MB" },
                      { label: "Storage", used: 1.2, total: 5, unit: "GB" },
                      { label: "API Requests", used: 12.4, total: 50, unit: "K" },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm text-slate-700 font-medium">{item.label}</span>
                          <span className="text-xs text-slate-500">{item.used} {item.unit} / {item.total} {item.unit}</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${Math.min((item.used / item.total) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-start gap-2">
                    <div className="w-4 h-4 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[9px] text-blue-500 font-bold">i</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">Usage resets on the 1st of each month. Upgrade your plan for higher limits.</p>
                  </div>
                </div>

              </div>
            </div>
          )}

'''

# Replace the old overview block
old_start = content.find('{activeTab === "Overview" &&')
# find the beginning of that line
line_start = content.rfind('\n', 0, old_start) + 1

# Find where database tab starts
old_end = content.find('{activeTab === "Database" &&')
# find the comment before it
line_before_db = content.rfind('\n', 0, old_end)
line_before_db = content.rfind('\n', 0, line_before_db) + 1

print(f"Replacing from {line_start} to {line_before_db}")

content = content[:line_start] + new_overview + content[line_before_db:]

with open(r'C:\Users\is511\Downloads\zenith-os-main\zenith-os-main\artifacts\zenith-os\src\pages\supaspire.tsx', 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)

print("Done!")
