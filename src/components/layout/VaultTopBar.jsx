import { useState, useEffect, useRef } from "react";
import { Shield, Bell, Sun, Moon, Upload, Download, LogIn, Share2, Trash2, RefreshCw, UserCheck, Zap, Activity, AlertTriangle, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { useVault } from "../../context/VaultContext";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token")}`,
});

const ACTION_CONFIG = {
  "File Uploaded":      { Icon: Upload,        dot: "bg-cyan-400"    },
  "File Accessed":      { Icon: LogIn,         dot: "bg-blue-400"    },
  "Link Shared":        { Icon: Share2,        dot: "bg-indigo-400"  },
  "File Downloaded":    { Icon: Download,      dot: "bg-violet-400"  },
  "Vault Synced":       { Icon: RefreshCw,     dot: "bg-emerald-400" },
  "Access Granted":     { Icon: UserCheck,     dot: "bg-teal-400"    },
  "Access Revoked":     { Icon: Shield,        dot: "bg-orange-400"  },
  "File Encrypted":     { Icon: Zap,           dot: "bg-amber-400"   },
  "File Deleted":       { Icon: Trash2,        dot: "bg-red-400"     },
  "Vault Accessed":     { Icon: LogIn,         dot: "bg-green-400"   },
  "Security Updated":   { Icon: Shield,        dot: "bg-purple-400"  },
  "Unauthorized Access":{ Icon: AlertTriangle, dot: "bg-red-400"     },
};
const defaultCfg = { Icon: Activity, dot: "bg-gray-400" };

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60)    return "Just now";
  if (seconds < 3600)  return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

const VaultTopBar = () => {
  const { isDark, toggleTheme } = useTheme();
  const { activeVault } = useVault();
  const navigate = useNavigate();
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(false);
  const bellRef = useRef(null);
  const dropdownRef = useRef(null);

  const vaultId = activeVault?.id || activeVault?._id;

  // ── Fetch latest 3 audit logs for this vault ────────────────────────────
  useEffect(() => {
    if (!vaultId || !showNotifs) return;

    const fetchLogs = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${API}/vaults/${vaultId}/access-log?page=1&limit=3`,
          { headers: authHeaders(), credentials: "include" }
        );
        if (!res.ok) return;
        const data = await res.json();
        setNotifs(data.logs || []);
      } catch (e) {
        console.warn("Could not fetch vault audit logs:", e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [vaultId, showNotifs]);

  // ── Click-outside to close ──────────────────────────────────────────────
  useEffect(() => {
    if (!showNotifs) return;

    const handleClickOutside = (e) => {
      // If click is outside both the bell button AND the dropdown, close
      if (
        bellRef.current && !bellRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) {
        setShowNotifs(false);
      }
    };

    // Use mousedown so it fires before any click handlers
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotifs]);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-2xl transition-colors duration-500 ${
      isDark
        ? "bg-slate-900/95 border-slate-700/50 shadow-lg shadow-black/10"
        : "bg-white/95 border-gray-200 shadow-lg shadow-gray-200/50"
    }`}>
      <div className="px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">

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
              ref={bellRef}
              onClick={() => setShowNotifs(v => !v)}
              className={`relative p-2 sm:p-2.5 rounded-xl transition-all duration-300 group ${
                isDark ? "hover:bg-slate-800" : "hover:bg-gray-100"
              }`}
            >
              <Bell className={`w-4 h-4 sm:w-5 sm:h-5 ${isDark ? "text-gray-300 group-hover:text-white" : "text-gray-600 group-hover:text-gray-900"}`} />
              {vaultId && (
                <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
              )}
            </button>

            <AnimatePresence>
              {showNotifs && (
                <motion.div
                  ref={dropdownRef}
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className={`absolute right-0 top-12 w-72 sm:w-80 rounded-2xl border shadow-2xl z-[56] overflow-hidden ${
                    isDark ? "bg-slate-900 border-slate-700/60" : "bg-white border-gray-200"
                  }`}
                >
                  <div className="h-[2px] bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600" />

                  {/* Header */}
                  <div className={`px-4 py-3 border-b flex items-center justify-between ${isDark ? "border-slate-700/50" : "border-gray-100"}`}>
                    <span className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Recent Activity</span>
                    {vaultId && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        isDark ? "bg-cyan-500/15 text-cyan-400" : "bg-cyan-50 text-cyan-600"
                      }`}>
                        {activeVault?.name ?? "Vault"}
                      </span>
                    )}
                  </div>

                  {/* Body */}
                  <div className="py-1 min-h-[80px]">
                    {!vaultId ? (
                      <div className="px-4 py-6 text-center">
                        <Shield className={`w-8 h-8 mx-auto mb-2 opacity-20 ${isDark ? "text-gray-400" : "text-gray-500"}`} />
                        <p className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>Select a vault to see activity</p>
                      </div>
                    ) : loading ? (
                      <div className="px-4 py-6 flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
                        <p className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>Loading…</p>
                      </div>
                    ) : notifs.length === 0 ? (
                      <div className="px-4 py-6 text-center">
                        <Activity className={`w-8 h-8 mx-auto mb-2 opacity-20 ${isDark ? "text-gray-400" : "text-gray-500"}`} />
                        <p className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>No recent activity</p>
                      </div>
                    ) : (
                      notifs.map((n, i) => {
                        const cfg = ACTION_CONFIG[n.action] || defaultCfg;
                        const { Icon } = cfg;
                        return (
                          <div
                            key={n.id || i}
                            className={`px-4 py-3 flex gap-3 items-start transition-colors cursor-default ${
                              isDark ? "hover:bg-slate-800" : "hover:bg-gray-50"
                            }`}
                          >
                            <div className="flex-shrink-0 mt-0.5 relative">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                                isDark ? "bg-slate-800 border border-slate-700/50" : "bg-gray-100"
                              }`}>
                                <Icon className={`w-3.5 h-3.5 ${isDark ? "text-gray-300" : "text-gray-600"}`} />
                              </div>
                              <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-slate-900 ${cfg.dot}`} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className={`text-xs font-semibold leading-tight ${isDark ? "text-white" : "text-gray-900"}`}>
                                {n.action}
                              </p>
                              <p className={`text-[11px] truncate mt-0.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                                {n.file && n.file !== n.action ? n.file : (n.user || "—")}
                              </p>
                              <p className={`text-[10px] mt-0.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                                {timeAgo(n.time)}
                              </p>
                            </div>
                            {/* Status dot */}
                            <span className={`flex-shrink-0 mt-1 w-1.5 h-1.5 rounded-full ${
                              n.status === "success" ? "bg-emerald-400" :
                              n.status === "blocked" ? "bg-red-400" : "bg-amber-400"
                            }`} />
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Footer — View all → Access Log */}
                  {vaultId && (
                    <div className={`px-4 py-2.5 border-t ${isDark ? "border-slate-700/50" : "border-gray-100"}`}>
                      <button
                        onClick={() => {
                          setShowNotifs(false);
                          navigate("/accesslog");
                        }}
                        className={`w-full flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors py-1 rounded-lg ${
                          isDark
                            ? "text-cyan-400 hover:text-cyan-300 hover:bg-slate-800"
                            : "text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50"
                        }`}
                      >
                        View all in Access Log
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </motion.div>
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
              ? <Sun  className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 group-hover:rotate-90 transition-transform duration-500" />
              : <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 group-hover:-rotate-12 transition-transform duration-500" />
            }
          </button>
        </div>

      </div>
    </header>
  );
};

export default VaultTopBar;