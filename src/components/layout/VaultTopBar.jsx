import { useState } from "react";
import { Shield, Bell, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";
import { useVault } from "../../context/VaultContext";

const notifs = [
  { id: 1, title: "Upload complete", desc: "document.pdf was encrypted and saved.", dot: "bg-emerald-400", time: "2 min ago" },
  { id: 2, title: "Vault accessed", desc: "New login from Chrome on Windows.", dot: "bg-cyan-400", time: "1 hr ago" },
  { id: 3, title: "Storage warning", desc: "You've used 80% of your vault storage.", dot: "bg-amber-400", time: "3 hr ago" },
];

// Z-INDEX GUIDE for this app:
// z-30        → sidebar backdrop
// z-[48]      → sidebar panel
// z-[49]      → (unused, reserved)
// z-50        → top bar header
// z-[51]      → hamburger toggle button (must be above header)
// z-[60]+     → modals / dialogs (must be above hamburger)

const VaultTopBar = () => {
  const { isDark, toggleTheme } = useTheme();
  const { activeVault } = useVault();
  const [showNotifs, setShowNotifs] = useState(false);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-2xl transition-colors duration-500 ${
      isDark
        ? "bg-slate-900/95 border-slate-700/50 shadow-lg shadow-black/10"
        : "bg-white/95 border-gray-200 shadow-lg shadow-gray-200/50"
    }`}>
      {/* 
        On mobile we add pl-14 so content doesn't sit under the hamburger button
        (fixed at left-3, ~44px wide). On desktop the sidebar handles its own space.
      */}
      <div className="px-3 sm:px-6 pl-14 sm:pl-6 h-16 flex items-center justify-between gap-2 sm:gap-4">

        {/* Logo */}
        <div className="flex items-center gap-2 sm:gap-3 group cursor-pointer flex-shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30 group-hover:rotate-6 group-hover:scale-110 transition-all duration-500">
            <Shield className="text-white w-4 h-4 sm:w-[18px] sm:h-[18px]" />
          </div>
          <div className="hidden sm:block">
            <div className={`text-sm sm:text-base font-bold leading-tight ${isDark ? "text-white" : "text-gray-900"}`}>AirVault</div>
            <div className="text-[10px] text-cyan-500 leading-tight">Secure Storage</div>
          </div>
        </div>

        {/* Active vault pill — center */}
        <div className={`hidden sm:flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full border text-xs sm:text-sm font-medium ${
          isDark
            ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-300"
            : "bg-cyan-500/10 border-cyan-500/30 text-cyan-700"
        }`}>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="truncate max-w-[120px] sm:max-w-none">{activeVault?.name ?? "No vault selected"}</span>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifs(v => !v)}
              className={`relative p-2 sm:p-2.5 rounded-xl transition-all duration-300 group ${
                isDark ? "hover:bg-slate-800" : "hover:bg-gray-100"
              }`}
            >
              <Bell className={`w-4 h-4 sm:w-5 sm:h-5 ${isDark ? "text-gray-300 group-hover:text-white" : "text-gray-600 group-hover:text-gray-900"}`} />
              <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
            </button>

            <AnimatePresence>
              {showNotifs && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setShowNotifs(false)}
                    className="fixed inset-0 z-[55]"
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className={`absolute right-0 top-12 w-64 sm:w-72 rounded-2xl border shadow-2xl z-[56] overflow-hidden ${
                      isDark ? "bg-slate-900 border-slate-700/60" : "bg-white border-gray-200"
                    }`}
                  >
                    <div className="h-[2px] bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600" />
                    <div className={`px-4 py-3 border-b flex items-center justify-between ${isDark ? "border-slate-700/50" : "border-gray-100"}`}>
                      <span className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Notifications</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 font-semibold">{notifs.length} new</span>
                    </div>
                    <div className="py-1">
                      {notifs.map(n => (
                        <div key={n.id} className={`px-4 py-3 flex gap-3 items-start transition-colors cursor-pointer ${isDark ? "hover:bg-slate-800" : "hover:bg-gray-50"}`}>
                          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.dot}`} />
                          <div className="min-w-0">
                            <p className={`text-xs font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>{n.title}</p>
                            <p className={`text-[11px] ${isDark ? "text-gray-400" : "text-gray-500"}`}>{n.desc}</p>
                            <p className={`text-[10px] mt-0.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}>{n.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className={`px-4 py-2.5 border-t text-center ${isDark ? "border-slate-700/50" : "border-gray-100"}`}>
                      <button className={`text-xs font-semibold ${isDark ? "text-cyan-400 hover:text-cyan-300" : "text-cyan-600 hover:text-cyan-700"}`}>
                        View all
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className={`p-2 sm:p-2.5 rounded-xl border transition-all duration-300 group ${
              isDark
                ? "bg-slate-800 hover:bg-slate-700 border-slate-700"
                : "bg-white hover:bg-gray-100 border-gray-200"
            }`}
          >
            {isDark
              ? <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 group-hover:rotate-90 transition-transform duration-500" />
              : <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 group-hover:-rotate-12 transition-transform duration-500" />
            }
          </button>
        </div>

      </div>
    </header>
  );
};

export default VaultTopBar;