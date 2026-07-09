import re

with open(r'C:\Users\is511\Downloads\zenith-os-main\zenith-os-main\artifacts\zenith-os\src\pages\supaspire.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Let's target the Overview tab block.
# Starts at {activeTab === "Overview" && (
# Ends at the closing )} before {/* ───────────────── SUB-TAB: DATABASE ───────────────── */}

overview_start_idx = content.find('{activeTab === "Overview" &&')
database_comment_idx = content.find('{/* ───────────────── SUB-TAB: DATABASE ───────────────── */}')
if database_comment_idx == -1:
    database_comment_idx = content.find('{activeTab === "Database" &&')

# Go to the line start of the Overview tab
line_start = content.rfind('\n', 0, overview_start_idx) + 1
# Go to the line start of Database
line_end = content.rfind('\n', 0, database_comment_idx) + 1

print(f"Replacing from {line_start} to {line_end}")

new_overview_content = '''          {/* SUB-TAB: OVERVIEW */}
          {activeTab === "Overview" && (
            <div className="space-y-6">
              
              {/* TOP SECTION: API Credentials + Service Status */}
              <div className="grid grid-cols-3 gap-6">

                {/* LEFT COLUMN — 2/3 width */}
                <div className="col-span-2 space-y-5">

                  {/* API Credentials Card */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-sm font-semibold text-slate-900">API Credentials</h2>
                      <button className="text-slate-400 hover:text-slate-600 transition-colors">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-4">

                      {/* Project URL */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Project URL</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            readOnly
                            value={project.apiUrl}
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-600 focus:outline-none cursor-text select-all"
                          />
                          <button
                            onClick={() => handleCopy(project.apiUrl, "apiUrl")}
                            className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors shrink-0"
                          >
                            {copiedField === "apiUrl" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedField === "apiUrl" ? "Copied" : "Copy"}</span>
                          </button>
                        </div>
                      </div>

                      {/* Anon Public Key */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Anon Public Key</label>
                        <div className="flex gap-2">
                          <input
                            type={showSecrets["apiKey"] ? "text" : "password"}
                            readOnly
                            value={project.apiKey}
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-600 focus:outline-none cursor-text select-all"
                          />
                          <button
                            onClick={() => toggleSecret("apiKey")}
                            className="h-8 w-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:bg-slate-50 shrink-0"
                          >
                            {showSecrets["apiKey"] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleCopy(project.apiKey, "apiKey")}
                            className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors shrink-0"
                          >
                            {copiedField === "apiKey" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedField === "apiKey" ? "Copied" : "Copy"}</span>
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">This key is safe to use in a browser if you have Row Level Security enabled.</p>
                      </div>

                      {/* Service Role Key */}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <label className="text-xs font-semibold text-slate-500">Service Role Key</label>
                          <span className="inline-flex items-center px-1 py-0.2 rounded text-[9px] font-bold bg-red-50 text-red-600 border border-red-100">Secret</span>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type={showSecrets["dbUrl"] ? "text" : "password"}
                            readOnly
                            value={project.dbUrl}
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-600 focus:outline-none cursor-text select-all"
                          />
                          <button
                            onClick={() => toggleSecret("dbUrl")}
                            className="h-8 w-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:bg-slate-50 shrink-0"
                          >
                            {showSecrets["dbUrl"] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleCopy(project.dbUrl, "dbUrl")}
                            className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors shrink-0"
                          >
                            {copiedField === "dbUrl" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedField === "dbUrl" ? "Copied" : "Copy"}</span>
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">This key has the ability to bypass Row Level Security. Never share it publicly.</p>
                      </div>

                    </div>
                  </div>

                  {/* Quick Connect Card */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-sm font-semibold text-slate-900">Quick Connect</h2>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">JavaScript</span>
                    </div>
                    <p className="text-xs text-slate-500 mb-3">Get started by installing the SDK and initializing your client.</p>

                    <div className="relative bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-3 font-mono text-[11px] text-slate-700 leading-relaxed overflow-x-auto">
                      <button
                        onClick={() => handleCopy(`import { createClient } from '@supaspire/js'\\n\\nconst provider = createClient('${project.apiUrl}', 'YOUR_ANON_KEY')`, "quickconnect")}
                        className="absolute top-2.5 right-2.5 h-6 w-6 rounded border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50"
                      >
                        {copiedField === "quickconnect" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      </button>
                      <pre className="whitespace-pre">{`import { createClient } from '@supaspire/js'

const provider = createClient(
  '${project.apiUrl}',
  'YOUR_ANON_KEY'
)`}</pre>
                    </div>

                    <div className="mt-3 flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 cursor-pointer w-fit font-medium">
                      <ExternalLink className="w-3 h-3" />
                      <span>View full documentation</span>
                    </div>
                  </div>

                </div>

                {/* RIGHT COLUMN — 1/3 width */}
                <div className="col-span-1 space-y-5">

                  {/* Service Status Card */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                    <h2 className="text-sm font-semibold text-slate-900 mb-3.5">Service Status</h2>
                    <div className="space-y-2.5">
                      {[
                        { label: "Database", icon: Database },
                        { label: "Authentication", icon: Lock },
                        { label: "Storage", icon: Package },
                        { label: "Real-time", icon: Activity },
                        { label: "Functions", icon: Terminal },
                      ].map((s) => (
                        <div key={s.label} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6.5 h-6.5 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-center p-1">
                              <s.icon className="w-3.5 h-3.5 text-slate-500" />
                            </div>
                            <span className="text-xs text-slate-700 font-medium">{s.label}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Active</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Usage This Month Card */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-sm font-semibold text-slate-900">Usage This Month</h2>
                      <button className="text-[11px] text-blue-500 hover:text-blue-700 font-semibold">View all</button>
                    </div>
                    <div className="space-y-3">
                      {[
                        { label: "Database", used: 234, total: 500, unit: "MB" },
                        { label: "Storage", used: 1.2, total: 5, unit: "GB" },
                        { label: "API Requests", used: 12.4, total: 50, unit: "K" },
                      ].map((item) => (
                        <div key={item.label}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-slate-700 font-medium">{item.label}</span>
                            <span className="text-[10px] text-slate-500">{item.used} {item.unit} / {item.total} {item.unit}</span>
                          </div>
                          <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${Math.min((item.used / item.total) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3.5 pt-3.5 border-t border-slate-100 flex items-start gap-1.5">
                      <div className="w-3.5 h-3.5 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[8px] text-blue-500 font-bold">i</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-normal">Usage resets on the 1st of each month.</p>
                    </div>
                  </div>

                </div>
              </div>

              {/* BOTTOM SECTION: Graph Box (Requests) */}
              <div className="border-t border-slate-200 pt-5 mt-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-slate-800">
                    {/* Grip Dot icon */}
                    <div className="grid grid-cols-2 gap-[2px] w-2.5 h-2.5 text-slate-300">
                      <span className="w-[3px] h-[3px] rounded-full bg-slate-400" />
                      <span className="w-[3px] h-[3px] rounded-full bg-slate-400" />
                      <span className="w-[3px] h-[3px] rounded-full bg-slate-400" />
                      <span className="w-[3px] h-[3px] rounded-full bg-slate-400" />
                    </div>
                    <span className="text-sm font-semibold text-slate-700">28 Total Requests</span>
                  </div>
                  <div className="relative">
                    <select className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-600 focus:outline-none appearance-none pr-7 cursor-pointer hover:bg-slate-50 font-medium">
                      <option>Last 60 minutes</option>
                      <option>Last 24 hours</option>
                      <option>Last 7 days</option>
                    </select>
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <ChevronDown className="w-3 h-3" />
                    </div>
                  </div>
                </div>

                {/* 4 Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  
                  {/* Database Requests */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Database Requests</span>
                    <span className="text-xl font-bold text-slate-900 mt-1 block">14</span>
                    
                    {/* Chart */}
                    <div className="h-16 flex items-end justify-between gap-[3px] mt-4">
                      {[100, 100, 0, 60, 35, 35, 35, 35, 35, 35, 35, 35, 35].map((val, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-emerald-400 hover:bg-emerald-500 rounded-[1px] transition-colors"
                          style={{ height: `${val}%` }}
                        />
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-[8.5px] text-slate-400 mt-2 font-medium">
                      <span>Jun 16, 6:46pm</span>
                      <span>Jun 16, 7:15pm</span>
                    </div>
                  </div>

                  {/* Auth Requests */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Auth Requests</span>
                    <span className="text-xl font-bold text-slate-900 mt-1 block">14</span>
                    
                    {/* Chart */}
                    <div className="h-16 flex items-end justify-between gap-[3px] mt-4">
                      {[100, 100, 0, 60, 35, 35, 35, 35, 35, 35, 35, 35, 35].map((val, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-emerald-400 hover:bg-emerald-500 rounded-[1px] transition-colors"
                          style={{ height: `${val}%` }}
                        />
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-[8.5px] text-slate-400 mt-2 font-medium">
                      <span>Jun 16, 6:46pm</span>
                      <span>Jun 16, 7:15pm</span>
                    </div>
                  </div>

                  {/* Storage Requests */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Storage Requests</span>
                    <span className="text-xl font-bold text-slate-900 mt-1 block">0</span>
                    
                    {/* Chart */}
                    <div className="h-16 flex items-end justify-between gap-[3px] mt-4">
                      {Array.from({ length: 13 }).map((_, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-slate-100 rounded-[1px] transition-colors"
                          style={{ height: '3%' }}
                        />
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-[8.5px] text-slate-400 mt-2 font-medium">
                      <span>Jun 16, 6:46pm</span>
                      <span>Jun 16, 7:15pm</span>
                    </div>
                  </div>

                  {/* Realtime Requests */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Realtime Requests</span>
                    <span className="text-xl font-bold text-slate-900 mt-1 block">0</span>
                    
                    {/* Chart */}
                    <div className="h-16 flex items-end justify-between gap-[3px] mt-4">
                      {Array.from({ length: 13 }).map((_, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-slate-100 rounded-[1px] transition-colors"
                          style={{ height: '3%' }}
                        />
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-[8.5px] text-slate-400 mt-2 font-medium">
                      <span>Jun 16, 6:46pm</span>
                      <span>Jun 16, 7:15pm</span>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          )}
'''

content = content[:line_start] + new_overview_content + content[line_end:]

with open(r'C:\Users\is511\Downloads\zenith-os-main\zenith-os-main\artifacts\zenith-os\src\pages\supaspire.tsx', 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)

print("Overview replaced successfully!")
