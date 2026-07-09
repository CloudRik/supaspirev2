with open(r'C:\Users\is511\Downloads\zenith-os-main\zenith-os-main\artifacts\zenith-os\src\components\AppShell.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Let's find:
# {/* BODY */}
#       <div className="flex flex-1 overflow-hidden">
#         {/* SIDEBAR */}
#         <aside className="w-[270px] shrink-0 bg-[#fafafa] border-r border-slate-200 flex flex-col overflow-hidden z-20">

body_start = content.find('{/* BODY */}')
main_content_idx = content.find('{/* MAIN CONTENT */}')
# Find the next </div> after main_content_idx
div_close_idx = content.find('</div>', main_content_idx)
# Go to next line after that div_close
end_idx = content.find('\n', div_close_idx) + 1

print(f"body_start: {body_start}, end_idx: {end_idx}")
print("Found block context:")
print(repr(content[body_start:body_start+150]))
print(repr(content[end_idx-100:end_idx]))

new_sidebar_block = '''{/* BODY */}
      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR WRAPPER */}
        <div className={`relative shrink-0 transition-all duration-300 ease-in-out z-20 ${activeSubMenu ? "w-[64px]" : "w-[270px]"}`}>
          <aside className={`bg-[#fafafa] border-r border-slate-200 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${
            activeSubMenu
              ? "absolute top-0 left-0 bottom-0 w-[64px] hover:w-[270px] group/sidebar shadow-sm hover:shadow-xl"
              : "w-full h-full"
          }`}>
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
                      className="w-full flex items-center gap-0 group-hover/sidebar:gap-2 px-3 py-[7px] mb-2 rounded-lg text-[14px] font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all group shrink-0"
                    >
                      <ChevronLeft className="w-[16px] h-[16px] shrink-0 group-hover:text-slate-900 text-slate-500" />
                      <span className="flex-1 text-left leading-none transition-all duration-300 opacity-0 group-hover/sidebar:opacity-100 w-0 group-hover/sidebar:w-auto overflow-hidden whitespace-nowrap">{activeSubMenu}</span>
                    </button>
                    
                    <div className="space-y-0.5 mt-1">
                      {activeSubMenu === "Hacker-shield" && HACKER_SHIELD_SUB_ITEMS.map((item) => {
                        const { icon: Icon, label } = item;
                        const isActive = label === activeSubItem;
                        return (
                          <button
                            key={label}
                            onClick={() => setActiveSubItem(label)}
                            className={`w-full flex items-center gap-0 group-hover/sidebar:gap-2.5 px-3 py-[7px] rounded-lg text-[14px] font-medium transition-all group/sub ${isActive
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
                            <span className="flex-1 text-left leading-none transition-all duration-300 opacity-0 group-hover/sidebar:opacity-100 w-0 group-hover/sidebar:w-auto overflow-hidden whitespace-nowrap">{label}</span>
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
                            className={`w-full flex items-center gap-0 group-hover/sidebar:gap-2.5 px-3 py-[7px] rounded-lg text-[14px] font-medium transition-all group/sub ${isActive
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
                            <span className="flex-1 text-left leading-none transition-all duration-300 opacity-0 group-hover/sidebar:opacity-100 w-0 group-hover/sidebar:w-auto overflow-hidden whitespace-nowrap">{label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="border-t border-slate-100 p-3 bg-[#fafafa] shrink-0">
              <div onClick={handleSignOut} className="flex items-center gap-0 group-hover/sidebar:gap-2.5 px-2 py-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-all group">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-violet-500 flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden">
                  {user?.avatar_url || user?.avatarUrl ? <img src={user.avatar_url || user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : user?.name?.[0]?.toUpperCase() || "U"}
                </div>
                <div className="flex-1 min-w-0 transition-all duration-300 opacity-0 group-hover/sidebar:opacity-100 w-0 group-hover/sidebar:w-auto overflow-hidden">
                  <p className="text-xs font-semibold text-slate-800 truncate">{user?.name || "User"}</p>
                  <p className="text-[10px] text-slate-400 truncate">Pro Plan</p>
                </div>
                <LogOut className="w-3.5 h-3.5 text-slate-300 group-hover:text-red-400 transition-all shrink-0 transition-all duration-300 opacity-0 group-hover/sidebar:opacity-100 w-0 group-hover/sidebar:w-auto overflow-hidden" />
              </div>
            </div>
          </aside>
        </div>

        {/* MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto bg-[#fafafa]">{children}</main>
      </div>'''

content = content[:body_start] + new_sidebar_block + content[end_idx:]

with open(r'C:\Users\is511\Downloads\zenith-os-main\zenith-os-main\artifacts\zenith-os\src\components\AppShell.tsx', 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)

print("Replacement complete successfully!")
