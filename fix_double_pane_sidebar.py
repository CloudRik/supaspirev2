import os

with open(r'C:\Users\is511\Downloads\zenith-os-main\zenith-os-main\artifacts\zenith-os\src\components\AppShell.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update the signature of AppShell to include activeSubTab and onSubTabChange props
sig_find = '''export function AppShell({
  activeNav = "Projects",
  activeSubItem: propActiveSubItem,
  onSubItemChange,
  hasProject = true,
  children,'''

sig_replace = '''export function AppShell({
  activeNav = "Projects",
  activeSubItem: propActiveSubItem,
  onSubItemChange,
  hasProject = true,
  children,
  activeSubTab,
  onSubTabChange,'''

content = content.replace(sig_find, sig_replace)

prop_type_find = '''onSubItemChange?: (item: string) => void;
  hasProject?: boolean;
  children: ReactNode;
}) {'''

prop_type_replace = '''onSubItemChange?: (item: string) => void;
  hasProject?: boolean;
  children: ReactNode;
  activeSubTab?: string;
  onSubTabChange?: (tab: string) => void;
}) {'''

content = content.replace(prop_type_find, prop_type_replace)

# 2. Let's replace the whole {/* BODY */} block inside AppShell.tsx
# The body block starts at {/* BODY */} and goes to the end of AppShell
body_start = content.find('{/* BODY */}')
main_content_idx = content.find('{/* MAIN CONTENT */}')
div_close_idx = content.find('</div>', main_content_idx)
end_idx = content.find('\n', div_close_idx) + 1

new_body_block = '''{/* BODY */}
      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR WRAPPER */}
        {activeSubMenu === "Supaspire" ? (
          <div className="flex shrink-0 z-20 bg-[#fafafa] border-r border-slate-200">
            {/* Left Pane (Main Module Icons) */}
            <div className="w-[60px] border-r border-slate-200/60 flex flex-col items-center py-4 justify-between h-full bg-[#fafafa]">
              <div className="w-full flex flex-col items-center gap-3">
                {/* Back button to main cloudrik menu */}
                <button
                  onClick={() => setActiveSubMenu(null)}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors mb-2"
                  title="Back to CloudRik Menu"
                >
                  <ChevronLeft className="w-4.5 h-4.5" />
                </button>
                
                {/* Icons of main sub-items */}
                {SUPASPIRE_SUB_ITEMS.filter(item => hasProject || item.label === "Overview").map((item) => {
                  const { icon: Icon, label } = item;
                  const isActive = label === activeSubItem;
                  return (
                    <button
                      key={label}
                      onClick={() => setActiveSubItem(label)}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                        isActive
                          ? "bg-slate-200/60 text-slate-900 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                          : "text-slate-500 hover:bg-slate-100/70 hover:text-slate-900"
                      }`}
                      title={label}
                    >
                      <Icon className="w-[18px] h-[18px] stroke-[1.8px]" />
                    </button>
                  );
                })}
              </div>

              {/* Profile Avatar */}
              <div 
                onClick={handleSignOut}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-violet-500 flex items-center justify-center text-white text-[11px] font-bold overflow-hidden cursor-pointer"
                title="Sign out"
              >
                {user?.avatar_url || user?.avatarUrl ? <img src={user.avatar_url || user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : user?.name?.[0]?.toUpperCase() || "U"}
              </div>
            </div>

            {/* Right Pane (Subtabs list with icons) */}
            {activeSubItem !== "Overview" && (
              <div className="w-[210px] flex flex-col h-full bg-[#fafafa]">
                <div className="p-3 border-b border-slate-100 bg-[#fafafa]">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">{activeSubItem}</span>
                </div>
                <div className="flex-1 overflow-y-auto thin-scrollbar p-3 space-y-4">
                  
                  {/* Database Subtabs */}
                  {activeSubItem === "Database" && (
                    <div className="space-y-4">
                      {[
                        {
                          section: "Database Management",
                          items: [
                            { id: "Schema Visualizer", label: "Schema Visualizer", icon: Layers },
                            { id: "Tables", label: "Tables", icon: Database },
                            { id: "Functions", label: "Functions", icon: Terminal },
                            { id: "Triggers", label: "Triggers", icon: Zap },
                            { id: "Extensions", label: "Extensions", icon: Settings },
                            { id: "Indexes", label: "Indexes", icon: Key },
                          ]
                        },
                        {
                          section: "Configuration",
                          items: [
                            { id: "Roles", label: "Roles", icon: Users },
                            { id: "Policies", label: "Policies", icon: Shield },
                            { id: "Settings", label: "Settings", icon: Settings },
                          ]
                        },
                        {
                          section: "Platform",
                          items: [
                            { id: "Backups", label: "Backups", icon: History },
                            { id: "Database Webhooks", label: "Database Webhooks", icon: Webhook },
                          ]
                        }
                      ].map((sec) => (
                        <div key={sec.section}>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block px-2 mb-1.5 select-none">{sec.section}</span>
                          <div className="space-y-0.5">
                            {sec.items.map((sub) => {
                              const isSubActive = sub.id === activeSubTab;
                              return (
                                <button
                                  key={sub.id}
                                  onClick={() => onSubTabChange && onSubTabChange(sub.id)}
                                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors ${
                                    isSubActive
                                      ? "bg-slate-200/60 text-slate-900 font-bold"
                                      : "text-slate-600 hover:bg-slate-100/70"
                                  }`}
                                >
                                  <sub.icon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                  <span className="truncate">{sub.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Authentication Subtabs */}
                  {activeSubItem === "Authentication" && (
                    <div className="space-y-4">
                      {[
                        {
                          section: "Users",
                          items: [
                            { id: "Users", label: "Users", icon: Users },
                          ]
                        },
                        {
                          section: "Configuration",
                          items: [
                            { id: "Providers", label: "Providers", icon: Key },
                            { id: "Templates", label: "Templates", icon: Lock },
                            { id: "Settings", label: "Settings", icon: Settings },
                          ]
                        }
                      ].map((sec) => (
                        <div key={sec.section}>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block px-2 mb-1.5 select-none">{sec.section}</span>
                          <div className="space-y-0.5">
                            {sec.items.map((sub) => {
                              const isSubActive = sub.id === activeSubTab;
                              return (
                                <button
                                  key={sub.id}
                                  onClick={() => onSubTabChange && onSubTabChange(sub.id)}
                                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors ${
                                    isSubActive
                                      ? "bg-slate-200/60 text-slate-900 font-bold"
                                      : "text-slate-600 hover:bg-slate-100/70"
                                  }`}
                                >
                                  <sub.icon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                  <span className="truncate">{sub.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Storage Subtabs */}
                  {activeSubItem === "Storage" && (
                    <div className="space-y-4">
                      {[
                        {
                          section: "File Storage",
                          items: [
                            { id: "Buckets", label: "Buckets", icon: Package },
                            { id: "Usage", label: "Usage", icon: Activity },
                            { id: "Settings", label: "Settings", icon: Settings },
                          ]
                        }
                      ].map((sec) => (
                        <div key={sec.section}>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block px-2 mb-1.5 select-none">{sec.section}</span>
                          <div className="space-y-0.5">
                            {sec.items.map((sub) => {
                              const isSubActive = sub.id === activeSubTab;
                              return (
                                <button
                                  key={sub.id}
                                  onClick={() => onSubTabChange && onSubTabChange(sub.id)}
                                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors ${
                                    isSubActive
                                      ? "bg-slate-200/60 text-slate-900 font-bold"
                                      : "text-slate-600 hover:bg-slate-100/70"
                                  }`}
                                >
                                  <sub.icon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                  <span className="truncate">{sub.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Real-time Subtabs */}
                  {activeSubItem === "Real-time" && (
                    <div className="space-y-4">
                      {[
                        {
                          section: "Live Channels",
                          items: [
                            { id: "Inspector", label: "Inspector", icon: Activity },
                            { id: "Settings", label: "Settings", icon: Settings },
                          ]
                        }
                      ].map((sec) => (
                        <div key={sec.section}>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block px-2 mb-1.5 select-none">{sec.section}</span>
                          <div className="space-y-0.5">
                            {sec.items.map((sub) => {
                              const isSubActive = sub.id === activeSubTab;
                              return (
                                <button
                                  key={sub.id}
                                  onClick={() => onSubTabChange && onSubTabChange(sub.id)}
                                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors ${
                                    isSubActive
                                      ? "bg-slate-200/60 text-slate-900 font-bold"
                                      : "text-slate-600 hover:bg-slate-100/70"
                                  }`}
                                >
                                  <sub.icon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                  <span className="truncate">{sub.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Functions Subtabs */}
                  {activeSubItem === "Functions" && (
                    <div className="space-y-4">
                      {[
                        {
                          section: "Edge Functions",
                          items: [
                            { id: "Functions", label: "Functions", icon: Terminal },
                            { id: "Secrets", label: "Secrets", icon: Key },
                          ]
                        }
                      ].map((sec) => (
                        <div key={sec.section}>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block px-2 mb-1.5 select-none">{sec.section}</span>
                          <div className="space-y-0.5">
                            {sec.items.map((sub) => {
                              const isSubActive = sub.id === activeSubTab;
                              return (
                                <button
                                  key={sub.id}
                                  onClick={() => onSubTabChange && onSubTabChange(sub.id)}
                                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-left transition-colors ${
                                    isSubActive
                                      ? "bg-slate-200/60 text-slate-900 font-bold"
                                      : "text-slate-600 hover:bg-slate-100/70"
                                  }`}
                                >
                                  <sub.icon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                  <span className="truncate">{sub.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              </div>
            )}
          </div>
        ) : (
          /* Normal Workspace Sidebar */
          <aside className="w-[270px] shrink-0 bg-[#fafafa] border-r border-slate-200 flex flex-col overflow-hidden z-20">
            <div className="flex-1 overflow-y-auto thin-scrollbar p-3 overflow-x-hidden relative">
              <AnimatePresence initial={false} mode="wait">
                {!activeSubMenu ? (
                  <motion.div
                    key="main-menu"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-6"
                  >
                    {["Deployment", "Services", "Management"].map((sectionName) => {
                      const sectionItems = NAV_ITEMS.filter((item) => item.section === sectionName);
                      return (
                        <div key={sectionName} className="space-y-1.5">
                          <div className="text-[10px] font-bold text-slate-400 tracking-wider px-3 mb-1 uppercase select-none">
                            {sectionName}
                          </div>
                          <ul className="space-y-1">
                            {sectionItems.map((item) => {
                              const { icon: Icon, label } = item;
                              const href = "href" in item ? item.href : undefined;
                              const hasSubMenu = "hasSubMenu" in item ? item.hasSubMenu : false;
                              const isActive = label === activeNav && !hasSubMenu;

                              const inner = (
                                <>
                                  <Icon
                                    className={`w-[18px] h-[18px] shrink-0 transition-colors ${isActive
                                      ? "text-slate-900 stroke-[2.2px]"
                                      : "text-slate-500 group-hover/item:text-slate-900 stroke-[1.8px]"
                                      }`}
                                  />
                                  <span className="flex-1 text-left leading-none">{label}</span>
                                  {hasSubMenu && (
                                    <ChevronRight className="w-[15px] h-[15px] shrink-0 text-slate-400 group-hover/item:text-slate-900 transition-colors" />
                                  )}
                                </>
                              );

                              const itemClass = `w-full flex items-center gap-2.5 px-3 py-[8.5px] rounded-lg text-[14px] font-medium transition-all group/item ${isActive
                                ? "bg-slate-200/60 text-slate-900 font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                }`;

                              return (
                                <li key={label}>
                                  {hasSubMenu ? (
                                    <button 
                                      onClick={() => {
                                        setActiveSubMenu(label);
                                        if (label === "Hacker-shield") {
                                          setActiveSubItem("Overview");
                                        } else if (label === "Supaspire") {
                                          setActiveSubItem("Overview");
                                          navigate("/supaspire");
                                        }
                                      }} 
                                      className={itemClass}
                                    >
                                      {inner}
                                    </button>
                                  ) : href ? (
                                    <Link href={href} className={itemClass}>
                                      {inner}
                                    </Link>
                                  ) : (
                                    <button className={itemClass}>
                                      {inner}
                                    </button>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      );
                    })}
                  </motion.div>
                ) : (
                  <motion.div
                    key="sub-menu"
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 20, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-0.5"
                  >
                    <button
                      onClick={() => setActiveSubMenu(null)}
                      className="w-full flex items-center gap-2 px-3 py-[7px] mb-2 rounded-lg text-[14px] font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all group shrink-0"
                    >
                      <ChevronLeft className="w-[16px] h-[16px] shrink-0 group-hover:text-slate-900 text-slate-500" />
                      <span className="flex-1 text-left leading-none">{activeSubMenu}</span>
                    </button>
                    
                    <div className="space-y-0.5 mt-1">
                      {activeSubMenu === "Hacker-shield" && HACKER_SHIELD_SUB_ITEMS.map((item) => {
                        const { icon: Icon, label } = item;
                        const isActive = label === activeSubItem;
                        return (
                          <button
                            key={label}
                            onClick={() => setActiveSubItem(label)}
                            className={`w-full flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-[14px] font-medium transition-all group/sub ${isActive
                              ? "bg-slate-200/60 text-slate-900 font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            }`}
                          >
                            <Icon
                              className={`w-[18px] h-[18px] shrink-0 transition-colors ${isActive
                                ? "text-slate-900 stroke-[2.2px]"
                                : "text-slate-500 group-hover/sub:text-slate-800 stroke-[1.8px]"
                              }`}
                            />
                            <span className="flex-1 text-left leading-none">{label}</span>
                          </button>
                        );
                      })}

                      {activeSubMenu === "Supaspire" && SUPASPIRE_SUB_ITEMS.filter(item => hasProject || item.label === "Overview").map((item) => {
                        const { icon: Icon, label } = item;
                        const isActive = label === activeSubItem;
                        return (
                          <button
                            key={label}
                            onClick={() => setActiveSubItem(label)}
                            className={`w-full flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-[14px] font-medium transition-all group/sub ${isActive
                              ? "bg-slate-200/60 text-slate-900 font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            }`}
                          >
                            <Icon
                              className={`w-[18px] h-[18px] shrink-0 transition-colors ${isActive
                                ? "text-slate-900 stroke-[2.2px]"
                                : "text-slate-500 group-hover/sub:text-slate-800 stroke-[1.8px]"
                              }`}
                            />
                            <span className="flex-1 text-left leading-none">{label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="border-t border-slate-100 p-3 bg-[#fafafa] shrink-0">
              <div onClick={handleSignOut} className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-violet-500 flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden">
                  {user?.avatar_url || user?.avatarUrl ? <img src={user.avatar_url || user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : user?.name?.[0]?.toUpperCase() || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">{user?.name || "User"}</p>
                  <p className="text-[10px] text-slate-400 truncate">Pro Plan</p>
                </div>
                <LogOut className="w-3.5 h-3.5 text-slate-300 group-hover:text-red-400 transition-colors shrink-0" />
              </div>
            </div>
          </aside>
        )}
      </div>'''

content = content[:body_start] + new_body_block + content[end_idx:]

with open(r'C:\Users\is511\Downloads\zenith-os-main\zenith-os-main\artifacts\zenith-os\src\components\AppShell.tsx', 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)

print("AppShell updated successfully!")
