with open(r'C:\Users\is511\Downloads\zenith-os-main\zenith-os-main\artifacts\zenith-os\src\pages\supaspire.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add other subtabs states right after activeDbSubTab state
db_subtab_hook = 'const [activeDbSubTab, setActiveDbSubTab] = useState<string>("Schema Visualizer");'
db_subtab_idx = content.find(db_subtab_hook)
if db_subtab_idx != -1:
    insert_pos = db_subtab_idx + len(db_subtab_hook)
    new_states = '\\n  const [activeAuthSubTab, setActiveAuthSubTab] = useState<string>("Users");\\n  const [activeStorageSubTab, setActiveStorageSubTab] = useState<string>("Buckets");\\n  const [activeRealtimeSubTab, setActiveRealtimeSubTab] = useState<string>("Inspector");\\n  const [activeFunctionsSubTab, setActiveFunctionsSubTab] = useState<string>("Functions");'
    new_states = new_states.replace('\\n', '\n')
    content = content[:insert_pos] + new_states + content[insert_pos:]
    print("Added other subtab states successfully!")

# 2. Add the subTab mapping logic before the return statement of SupaspirePage
# Find return (
return_idx = content.rfind('return (\n    <AppShell')
if return_idx == -1:
    return_idx = content.rfind('return (')

mapping_logic = '''  let subTab = "";
  let setSubTab = (tab: string) => {};
  if (activeTab === "Database") {
    subTab = activeDbSubTab;
    setSubTab = setActiveDbSubTab;
  } else if (activeTab === "Authentication") {
    subTab = activeAuthSubTab;
    setSubTab = setActiveAuthSubTab;
  } else if (activeTab === "Storage") {
    subTab = activeStorageSubTab;
    setSubTab = setActiveStorageSubTab;
  } else if (activeTab === "Real-time") {
    subTab = activeRealtimeSubTab;
    setSubTab = setActiveRealtimeSubTab;
  } else if (activeTab === "Functions") {
    subTab = activeFunctionsSubTab;
    setSubTab = setActiveFunctionsSubTab;
  }

  '''

content = content[:return_idx] + mapping_logic + content[return_idx:]
print("Added subTab mapping logic successfully!")

# 3. Update the AppShell invocation
appshell_find = '''    <AppShell 
      activeNav="Supaspire" 
      activeSubItem={activeTab} 
      onSubItemChange={setActiveTab}
      hasProject={!!project}
    >'''

appshell_replace = '''    <AppShell 
      activeNav="Supaspire" 
      activeSubItem={activeTab} 
      onSubItemChange={setActiveTab}
      hasProject={!!project}
      activeSubTab={subTab}
      onSubTabChange={setSubTab}
    >'''

content = content.replace(appshell_find, appshell_replace)

# 4. Modify the activeTab === "Database" content block.
# Let's replace the whole {activeTab === "Database" && ( ... )} section.
# Let's search for the start: {activeTab === "Database" && (
# and find the ending index before: {/* ───────────────── SUB-TAB: AUTHENTICATION ───────────────── */} or {activeTab === "Authentication" && (
db_tab_start_idx = content.find('{activeTab === "Database" && (')
auth_tab_idx = content.find('{/* ───────────────── SUB-TAB: AUTHENTICATION ───────────────── */}')
if auth_tab_idx == -1:
    auth_tab_idx = content.find('{activeTab === "Authentication" && (')

db_tab_end_line_idx = content.rfind('\n', 0, auth_tab_idx) + 1

new_db_block = '''{activeTab === "Database" && (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[520px] bg-white">
              
              {/* SUBTAB 1: Schema Visualizer */}
              {activeDbSubTab === "Schema Visualizer" && (
                <div className="flex-1 flex flex-col justify-between select-none">
                  {/* Visualizer Header toolbar */}
                  <div className="px-6 py-3 border-b border-slate-100 bg-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Schema public Selector */}
                      <div className="relative">
                        <select className="bg-white border border-slate-200 rounded-lg pl-3 pr-8 py-1.5 text-xs text-slate-600 font-semibold focus:outline-none appearance-none cursor-pointer hover:bg-slate-50">
                          <option>schema public</option>
                          <option>schema auth</option>
                          <option>schema storage</option>
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                      {/* Search Table */}
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Find table..."
                          className="bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-600 focus:outline-none w-44"
                        />
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                        <Copy className="w-3 h-3" />
                        <span>Copy as SQL</span>
                      </button>
                      <button className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                        <span>Auto layout</span>
                      </button>
                    </div>
                  </div>

                  {/* Canvas/Diagram Area */}
                  <div className="flex-1 bg-slate-50 relative overflow-hidden bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] min-h-[400px] p-6">
                    
                    {/* Diagram connection lines */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                      {/* Profiles to Posts */}
                      <path d="M 230 145 C 270 145, 290 120, 330 120" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3,3" />
                      {/* Profiles to Comments */}
                      <path d="M 230 170 C 350 170, 520 220, 630 220" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
                      {/* Posts to Comments */}
                      <path d="M 530 120 C 580 120, 580 195, 630 195" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
                    </svg>

                    <div className="flex flex-wrap gap-8 items-start justify-center relative z-10 pt-8">
                      
                      {/* Table 1: profiles */}
                      <div className="w-48 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                        <div className="bg-slate-100/80 px-3.5 py-2 border-b border-slate-200 flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800">profiles</span>
                          <span className="text-[9px] bg-slate-200 text-slate-500 font-mono px-1 rounded">4 rows</span>
                        </div>
                        <div className="p-2 space-y-1 font-mono text-[10px] text-slate-600">
                          <div className="flex items-center justify-between py-0.5">
                            <span className="font-semibold text-slate-800">🔑 id</span>
                            <span className="text-slate-400">uuid</span>
                          </div>
                          <div className="flex items-center justify-between py-0.5">
                            <span>username</span>
                            <span className="text-slate-400">text</span>
                          </div>
                          <div className="flex items-center justify-between py-0.5">
                            <span>avatar_url</span>
                            <span className="text-slate-400">text</span>
                          </div>
                          <div className="flex items-center justify-between py-0.5">
                            <span>updated_at</span>
                            <span className="text-slate-400">timestamp</span>
                          </div>
                        </div>
                      </div>

                      {/* Table 2: posts */}
                      <div className="w-48 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                        <div className="bg-slate-100/80 px-3.5 py-2 border-b border-slate-200 flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800">posts</span>
                          <span className="text-[9px] bg-slate-200 text-slate-500 font-mono px-1 rounded">12 rows</span>
                        </div>
                        <div className="p-2 space-y-1 font-mono text-[10px] text-slate-600">
                          <div className="flex items-center justify-between py-0.5">
                            <span className="font-semibold text-slate-800">🔑 id</span>
                            <span className="text-slate-400">uuid</span>
                          </div>
                          <div className="flex items-center justify-between py-0.5">
                            <span>title</span>
                            <span className="text-slate-400">text</span>
                          </div>
                          <div className="flex items-center justify-between py-0.5">
                            <span>content</span>
                            <span className="text-slate-400">text</span>
                          </div>
                          <div className="flex items-center justify-between py-0.5">
                            <span>🔗 author_id</span>
                            <span className="text-slate-400 font-semibold text-slate-500">uuid</span>
                          </div>
                          <div className="flex items-center justify-between py-0.5">
                            <span>created_at</span>
                            <span className="text-slate-400">timestamp</span>
                          </div>
                        </div>
                      </div>

                      {/* Table 3: comments */}
                      <div className="w-48 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                        <div className="bg-slate-100/80 px-3.5 py-2 border-b border-slate-200 flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800">comments</span>
                          <span className="text-[9px] bg-slate-200 text-slate-500 font-mono px-1 rounded">37 rows</span>
                        </div>
                        <div className="p-2 space-y-1 font-mono text-[10px] text-slate-600">
                          <div className="flex items-center justify-between py-0.5">
                            <span className="font-semibold text-slate-800">🔑 id</span>
                            <span className="text-slate-400">uuid</span>
                          </div>
                          <div className="flex items-center justify-between py-0.5">
                            <span>🔗 post_id</span>
                            <span className="text-slate-400">uuid</span>
                          </div>
                          <div className="flex items-center justify-between py-0.5">
                            <span>body</span>
                            <span className="text-slate-400">text</span>
                          </div>
                          <div className="flex items-center justify-between py-0.5">
                            <span>🔗 user_id</span>
                            <span className="text-slate-400">uuid</span>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Footer indicators */}
                  <div className="px-6 py-2.5 border-t border-slate-100 bg-white flex items-center justify-start gap-5 text-[10px] text-slate-400 font-semibold select-none">
                    <span className="flex items-center gap-1">🔑 Primary key</span>
                    <span className="flex items-center gap-1">♯ Identity</span>
                    <span className="flex items-center gap-1">🛡️ Unique</span>
                    <span className="flex items-center gap-1">◇ Nullable</span>
                    <span className="flex items-center gap-1">● Non-Nullable</span>
                  </div>
                </div>
              )}

              {/* SUBTAB 2: Tables List and Spreadsheet */}
              {activeDbSubTab === "Tables" && (
                <div className="flex-1 grid grid-cols-4 min-h-[500px]">
                  {/* Inner tables sidebar */}
                  <div className="col-span-1 border-r border-slate-200 bg-slate-50/20 p-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tables</span>
                      <button className="h-6 w-6 rounded-md bg-white border border-slate-200 hover:bg-slate-50 flex items-center justify-center shadow-[0_1px_1px_rgba(0,0,0,0.02)]">
                        <Plus className="w-3 h-3 text-slate-600" />
                      </button>
                    </div>
                    <div className="space-y-1">
                      {tables.map((t) => (
                        <button
                          key={t.name}
                          onClick={() => setSelectedTable(t.name)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between ${
                            selectedTable === t.name 
                              ? "bg-slate-200/60 text-slate-900 font-bold" 
                              : "text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          <span className="truncate">{t.name}</span>
                          <span className="text-[10px] bg-slate-200/50 px-1.5 py-0.5 rounded text-slate-500 font-mono">{t.rows}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Inner data viewer */}
                  <div className="col-span-3 flex flex-col justify-between">
                    {/* Table Header */}
                    <div className="px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between">
                      <div>
                        <h2 className="text-sm font-bold text-slate-900">{selectedTable}</h2>
                        <p className="text-[11px] text-slate-400 mt-0.5">Rows and schemas parsed dynamically from PostgREST metadata</p>
                      </div>
                      <div className="flex gap-2">
                        <button className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                          <Plus className="w-3 h-3" />
                          <span>Add Row</span>
                        </button>
                      </div>
                    </div>

                    {/* Spreadsheet */}
                    <div className="flex-1 overflow-auto max-h-[380px]">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">
                            <th className="px-6 py-3 font-semibold border-r border-slate-100">#</th>
                            {tables.find(t => t.name === selectedTable)?.columns.map((c) => (
                              <th key={c} className="px-6 py-3 font-semibold border-r border-slate-100">{c}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="text-xs font-mono text-slate-700">
                          {Array.from({ length: tables.find(t => t.name === selectedTable)?.rows || 0 }).map((_, rIdx) => (
                            <tr key={rIdx} className="border-b border-slate-100 hover:bg-slate-50/50">
                              <td className="px-6 py-3.5 border-r border-slate-100 text-slate-400">{rIdx + 1}</td>
                              {tables.find(t => t.name === selectedTable)?.columns.map((c) => (
                                <td key={c} className="px-6 py-3.5 border-r border-slate-100 truncate max-w-[200px]">
                                  {c === "id" && `fdf_row_${rIdx + 1}`}
                                  {c === "username" && ["arjun_r", "neha_s", "rahul_v", "admin_user"][rIdx % 4]}
                                  {c === "avatar_url" && `/uploads/avatar_${rIdx + 1}.png`}
                                  {c === "updated_at" && "2026-06-16T11:42:01.039Z"}
                                  {c === "created_at" && "2026-06-14T09:12:00.000Z"}
                                  {c === "title" && `Post title reference header #${rIdx + 1}`}
                                  {c === "content" && `Mock post contents inside table records block.`}
                                  {c === "author_id" && `usr_9883_id`}
                                  {c === "post_id" && `${rIdx + 1}`}
                                  {c === "body" && `This is comment index #${rIdx + 1}`}
                                  {c === "user_id" && `usr_random_ref`}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Table Footer */}
                    <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-400 font-semibold">
                      <span>Showing {tables.find(t => t.name === selectedTable)?.rows} rows</span>
                      <div className="flex gap-1">
                        <button className="h-7 px-2.5 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50" disabled>Prev</button>
                        <button className="h-7 px-2.5 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50" disabled>Next</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SUBTAB 3: Extensions */}
              {activeDbSubTab === "Extensions" && (
                <div className="p-6 space-y-4">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Database Extensions</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Toggle and install pre-packaged Postgres extensions directly onto your database instance.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { name: "uuid-ossp", desc: "Generate universally unique identifiers (UUIDs)", installed: true },
                      { name: "pgcrypto", desc: "Cryptographic functions, hash algorithms, and ciphers", installed: true },
                      { name: "pgjwt", desc: "JSON Web Token generation and verification inside SQL queries", installed: true },
                      { name: "postgis", desc: "Support for geographic and spatial objects and queries", installed: false },
                      { name: "pg_trgm", desc: "Fuzzy text matching and trigram index support", installed: false },
                      { name: "plv8", desc: "Write javascript backend stored procedures directly inside Postgres", installed: false },
                    ].map((ext) => (
                      <div key={ext.name} className="border border-slate-200 rounded-xl p-4 bg-white flex items-start justify-between shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                        <div className="space-y-1 pr-4">
                          <span className="font-mono text-xs font-bold text-slate-800">{ext.name}</span>
                          <p className="text-[11px] text-slate-400 leading-normal">{ext.desc}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            className={`h-7 px-3 rounded-lg text-xs font-bold transition-all border ${
                              ext.installed
                                ? "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200/50"
                                : "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-sm"
                            }`}
                          >
                            {ext.installed ? "Disable" : "Enable"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SUBTAB 4: Roles */}
              {activeDbSubTab === "Roles" && (
                <div className="p-6 space-y-4">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Database Roles</h2>
                    <p className="text-xs text-slate-500 mt-0.5">View and manage database connection roles and security access permissions.</p>
                  </div>
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.02)] bg-white">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">
                          <th className="px-6 py-3 font-semibold">Role Name</th>
                          <th className="px-6 py-3 font-semibold">Attributes</th>
                          <th className="px-6 py-3 font-semibold">Connections limit</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs text-slate-700">
                        <tr className="border-b border-slate-100">
                          <td className="px-6 py-3.5 font-bold text-slate-800">postgres</td>
                          <td className="px-6 py-3.5 text-slate-500 font-mono">Superuser, Create role, Create DB, Bypass RLS</td>
                          <td className="px-6 py-3.5 text-slate-500">Unlimited</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="px-6 py-3.5 font-bold text-slate-800">anon</td>
                          <td className="px-6 py-3.5 text-slate-500 font-mono">Cannot login, inherits privileges</td>
                          <td className="px-6 py-3.5 text-slate-500">100</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="px-6 py-3.5 font-bold text-slate-800">service_role</td>
                          <td className="px-6 py-3.5 text-slate-500 font-mono">Bypass RLS, inherits privileges</td>
                          <td className="px-6 py-3.5 text-slate-500">Unlimited</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SUBTAB 5: Policies */}
              {activeDbSubTab === "Policies" && (
                <div className="p-6 space-y-4">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Row Level Security (RLS) Policies</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Define granular access control policy constraints for authenticated and anonymous queries.</p>
                  </div>
                  <div className="space-y-4">
                    {[
                      { table: "profiles", rls: true, count: 2, desc: "RLS active. Restricts updates to row owner only." },
                      { table: "posts", rls: true, count: 1, desc: "RLS active. Public read-only, write restricted to author." },
                      { table: "comments", rls: false, count: 0, desc: "Warning: RLS is disabled! Anyone can write or delete comment records." },
                    ].map((item) => (
                      <div key={item.table} className="border border-slate-200 rounded-xl p-4 bg-white flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-800 font-mono">{item.table}</span>
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                              item.rls
                                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                : "bg-red-50 text-red-600 border-red-100"
                            }`}>
                              {item.rls ? "RLS Enabled" : "RLS Disabled"}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-normal">{item.desc}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            className={`h-7 px-3 rounded-lg text-xs font-bold transition-all border ${
                              item.rls
                                ? "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200/50"
                                : "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-sm"
                            }`}
                          >
                            {item.rls ? "Manage Policies" : "Enable RLS"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SUBTAB 6: Settings */}
              {activeDbSubTab === "Settings" && (
                <div className="p-6 space-y-5">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Database Connection Settings</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Parameters and pooling parameters for connecting client libraries directly to Postgres.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Session Pool Connection</span>
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="text-slate-400 block mb-0.5 font-medium">Host</span>
                          <span className="font-mono text-slate-700 font-semibold">{project.apiUrl.replace("https://api.", "db.")}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block mb-0.5 font-medium">Port</span>
                          <span className="font-mono text-slate-700 font-semibold">5432</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block mb-0.5 font-medium">User</span>
                          <span className="font-mono text-slate-700 font-semibold">postgres</span>
                        </div>
                      </div>
                    </div>

                    <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Transaction Pool Connection</span>
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="text-slate-400 block mb-0.5 font-medium">Host</span>
                          <span className="font-mono text-slate-700 font-semibold">{project.apiUrl.replace("https://api.", "db-pool.")}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block mb-0.5 font-medium">Port</span>
                          <span className="font-mono text-slate-700 font-semibold">6543</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block mb-0.5 font-medium">Database Name</span>
                          <span className="font-mono text-slate-700 font-semibold">postgres</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SUBTAB 7: Backups */}
              {activeDbSubTab === "Backups" && (
                <div className="p-6 space-y-5">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900">Database Backups</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Daily automated snapshots and instant pg_dump recovery points for your database.</p>
                  </div>

                  <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-slate-800">Daily Automated Backups</span>
                        <p className="text-[11px] text-slate-400">Backups are automatically taken every night at 3:00 AM UTC.</p>
                      </div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                        Active
                      </span>
                    </div>
                    
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2 text-xs">
                      <div className="space-y-0.5">
                        <span className="text-slate-500 font-medium">Last backup generated</span>
                        <p className="font-mono text-slate-700 font-semibold">backup_17798_20260616.zip (2.4 MB)</p>
                      </div>
                      <div className="flex gap-2">
                        <button className="h-8 px-3 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                          Download Dump
                        </button>
                        <button className="h-8 px-3 rounded-lg bg-blue-600 text-white border border-blue-600 hover:bg-blue-700 text-xs font-bold shadow-sm">
                          Create Backup Now
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SUBTAB 8: Database Webhooks */}
              {activeDbSubTab === "Database Webhooks" && (
                <div className="p-6 space-y-5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">Database Webhooks</h2>
                      <p className="text-xs text-slate-500 mt-0.5">Send custom HTTP POST payloads on specific table row modification events.</p>
                    </div>
                    <button className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                      <Plus className="w-3 h-3" />
                      <span>Create Webhook</span>
                    </button>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.02)] bg-white">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">
                          <th className="px-6 py-3 font-semibold">Webhook Name</th>
                          <th className="px-6 py-3 font-semibold">Table</th>
                          <th className="px-6 py-3 font-semibold">Events</th>
                          <th className="px-6 py-3 font-semibold">Target URL</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs text-slate-700 font-mono">
                        <tr className="border-b border-slate-100">
                          <td className="px-6 py-3.5 font-bold text-slate-800 font-sans">Slack notifications</td>
                          <td className="px-6 py-3.5 text-slate-600">comments</td>
                          <td className="px-6 py-3.5 text-slate-500">INSERT</td>
                          <td className="px-6 py-3.5 text-slate-400 truncate max-w-[220px]">https://hooks.slack.com/services/...</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="px-6 py-3.5 font-bold text-slate-800 font-sans">User verification email</td>
                          <td className="px-6 py-3.5 text-slate-600">profiles</td>
                          <td className="px-6 py-3.5 text-slate-500">INSERT</td>
                          <td className="px-6 py-3.5 text-slate-400 truncate max-w-[220px]">https://api.zenith-os.com/auth/verify...</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          )}'''

content = content[:db_tab_start_idx] + new_db_block + content[db_tab_end_line_idx:]

with open(r'C:\Users\is511\Downloads\zenith-os-main\zenith-os-main\artifacts\zenith-os\src\pages\supaspire.tsx', 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)

print("Database page updated successfully!")
