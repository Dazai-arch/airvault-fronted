import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import {
  FileText, Shield, Download, Upload, LogIn, Share2, Trash2,
  RefreshCw, UserCheck, Zap, Eye, AlertTriangle, CheckCircle,
  X, ChevronDown, Activity, Globe, Smartphone, Monitor, Filter,
  Search,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useVault } from "../context/VaultContext";
import HamburgerMenu from "../components/layout/HamburgerMenu";
import VaultTopBar from "../components/layout/VaultTopBar";

const SIDEBAR_COLLAPSED = 60;
const SIDEBAR_EXPANDED  = 220;

const ACTION_CONFIG = {
  "File Uploaded":   { Icon: Upload,        color: "text-cyan-400",    bg: "bg-cyan-500/10",    border: "border-cyan-500/20"    },
  "File Accessed":   { Icon: LogIn,         color: "text-blue-400",    bg: "bg-blue-500/10",    border: "border-blue-500/20"    },
  "Link Shared":     { Icon: Share2,        color: "text-indigo-400",  bg: "bg-indigo-500/10",  border: "border-indigo-500/20"  },
  "File Downloaded": { Icon: Download,      color: "text-violet-400",  bg: "bg-violet-500/10",  border: "border-violet-500/20"  },
  "Vault Synced":    { Icon: RefreshCw,     color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  "Access Granted":  { Icon: UserCheck,     color: "text-teal-400",    bg: "bg-teal-500/10",    border: "border-teal-500/20"    },
  "File Encrypted":  { Icon: Zap,           color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/20"   },
  "File Deleted":    { Icon: Trash2,        color: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/20"     },
  "Login":           { Icon: LogIn,         color: "text-green-400",   bg: "bg-green-500/10",   border: "border-green-500/20"   },
  "Suspicious":      { Icon: AlertTriangle, color: "text-red-400",     bg: "bg-red-500/10",     border: "border-red-500/20"     },
};

const DEVICE_ICONS = { Desktop: Monitor, Mobile: Smartphone, Browser: Globe };

const LOGS = [
  { id:  1, action: "File Uploaded",   file: "Project_Proposal.pdf",     user: "You",      ip: "192.168.1.1",   device: "Desktop", location: "Mumbai, IN",    time: "2026-02-18 10:42", status: "success" },
  { id:  2, action: "File Accessed",   file: "Architecture_Diagram.png", user: "John D.",  ip: "203.0.113.5",   device: "Mobile",  location: "Delhi, IN",     time: "2026-02-18 09:21", status: "success" },
  { id:  3, action: "Suspicious",      file: "Database_Config.json",     user: "Unknown",  ip: "45.33.32.156",  device: "Browser", location: "Moscow, RU",    time: "2026-02-18 08:05", status: "blocked" },
  { id:  4, action: "Link Shared",     file: "Financial_Report_Q1.xlsx", user: "You",      ip: "192.168.1.1",   device: "Desktop", location: "Mumbai, IN",    time: "2026-02-17 18:33", status: "success" },
  { id:  5, action: "File Downloaded", file: "Marketing_Assets.zip",     user: "Sarah K.", ip: "198.51.100.3",  device: "Desktop", location: "Bangalore, IN", time: "2026-02-17 16:14", status: "success" },
  { id:  6, action: "Vault Synced",    file: "All files",                user: "System",   ip: "10.0.0.1",      device: "Desktop", location: "Local",         time: "2026-02-17 14:00", status: "success" },
  { id:  7, action: "File Encrypted",  file: "Project_Proposal.pdf",     user: "System",   ip: "10.0.0.1",      device: "Desktop", location: "Local",         time: "2026-02-17 13:58", status: "success" },
  { id:  8, action: "Access Granted",  file: "Database_Config.json",     user: "You",      ip: "192.168.1.1",   device: "Desktop", location: "Mumbai, IN",    time: "2026-02-17 11:22", status: "success" },
  { id:  9, action: "Suspicious",      file: "Financial_Report_Q1.xlsx", user: "Unknown",  ip: "185.220.101.1", device: "Browser", location: "Berlin, DE",    time: "2026-02-17 09:47", status: "blocked" },
  { id: 10, action: "Login",           file: "—",                        user: "You",      ip: "192.168.1.1",   device: "Desktop", location: "Mumbai, IN",    time: "2026-02-17 09:30", status: "success" },
  { id: 11, action: "File Uploaded",   file: "Architecture_Diagram.png", user: "You",      ip: "192.168.1.1",   device: "Mobile",  location: "Mumbai, IN",    time: "2026-02-16 20:11", status: "success" },
  { id: 12, action: "File Downloaded", file: "Project_Proposal.pdf",     user: "Raj M.",   ip: "103.21.244.0",  device: "Mobile",  location: "Chennai, IN",   time: "2026-02-16 17:05", status: "success" },
  { id: 13, action: "File Deleted",    file: "old_backup.zip",           user: "You",      ip: "192.168.1.1",   device: "Desktop", location: "Mumbai, IN",    time: "2026-02-16 15:30", status: "success" },
  { id: 14, action: "Link Shared",     file: "Architecture_Diagram.png", user: "You",      ip: "192.168.1.1",   device: "Desktop", location: "Mumbai, IN",    time: "2026-02-16 12:00", status: "success" },
  { id: 15, action: "Suspicious",      file: "Marketing_Assets.zip",     user: "Unknown",  ip: "91.108.4.0",    device: "Browser", location: "Kiev, UA",      time: "2026-02-15 23:14", status: "blocked" },
];

const FILTERS = ["All", "File Uploaded", "File Accessed", "Link Shared", "File Downloaded", "Suspicious", "Login", "File Deleted"];

/* ─── Portal-based CustomSelect (same as rest of the app) ────────────────── */
const CustomSelect = ({ value, onChange, options, isDark, icon: IconLeft }) => {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState(null);
  const triggerRef = useRef(null);

  useLayoutEffect(() => {
    if (open && triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      const ITEM_HEIGHT = 42;
      const MAX_VISIBLE = 5;
      const PADDING = 12;
      const LIST_HEADER = 2;
      const spaceBelow = window.innerHeight - r.bottom - PADDING;
      const spaceAbove = r.top - PADDING;
      const naturalHeight = LIST_HEADER + options.length * ITEM_HEIGHT;
      const maxHeight = Math.min(naturalHeight, MAX_VISIBLE * ITEM_HEIGHT + LIST_HEADER);
      const openUpward = spaceBelow < maxHeight && spaceAbove > spaceBelow;
      setRect({
        left: r.left, width: r.width,
        maxHeight, overflowY: naturalHeight > maxHeight ? "auto" : "hidden",
        ...(openUpward ? { bottom: window.innerHeight - r.top + 6 } : { top: r.bottom + 6 }),
      });
    }
  }, [open, options.length]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      const portal = document.getElementById("__custom-select-portal__");
      if (portal?.contains(e.target) || triggerRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler, true);
    return () => document.removeEventListener("mousedown", handler, true);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => { window.removeEventListener("scroll", close, true); window.removeEventListener("resize", close); };
  }, [open]);

  const selectedOption = options.find((o) => o === value);
  const hasValue = Boolean(selectedOption) && value !== "All";

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs sm:text-sm font-medium transition-all duration-200 ${
          isDark
            ? `bg-slate-700/50 border-slate-600/50 hover:border-cyan-500/40 ${open ? "border-cyan-500/50 ring-2 ring-cyan-500/20" : ""} ${hasValue ? "text-white" : "text-gray-300"}`
            : `bg-gray-50 border-gray-200 hover:border-cyan-400 ${open ? "border-cyan-400 ring-2 ring-cyan-500/20" : ""} ${hasValue ? "text-gray-900" : "text-gray-700"}`
        }`}
      >
        {IconLeft && <IconLeft className={`w-3.5 h-3.5 flex-shrink-0 ${isDark ? "text-gray-400" : "text-gray-500"}`} />}
        <span className="hidden sm:inline whitespace-nowrap">{hasValue ? value : "Filter"}</span>
        <ChevronDown className={`w-3 h-3 flex-shrink-0 transition-transform duration-200 ${isDark ? "text-gray-400" : "text-gray-500"} ${open ? "rotate-180" : ""}`} />
      </button>

      {createPortal(
        <AnimatePresence>
          {open && rect && (
            <motion.div
              id="__custom-select-portal__"
              style={{ position: "fixed", left: rect.left, width: rect.width, zIndex: 99999, maxHeight: rect.maxHeight, overflowY: rect.overflowY, ...(rect.top ? { top: rect.top } : { bottom: rect.bottom }) }}
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className={`rounded-xl border shadow-2xl scrollbar-dropdown-dark ${isDark ? "bg-slate-900 border-slate-700/60" : "bg-white border-gray-200"}`}
            >
              <div className="h-[2px] bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 flex-shrink-0 rounded-t-xl" />
              {options.map((opt) => {
                const isActive = opt === value;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => { onChange(opt); setOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors duration-150 flex items-center justify-between ${
                      isActive
                        ? isDark ? "bg-cyan-500/15 text-cyan-400 font-semibold" : "bg-cyan-50 text-cyan-600 font-semibold"
                        : isDark ? "text-gray-300 hover:bg-slate-800" : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span>{opt}</span>
                    {isActive && <CheckCircle className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

/* ══════════════════════════════════════════════════════════════════════════ */
const AccessLog = () => {
  const { isDark } = useTheme();
  const { activeVault } = useVault();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedLog, setSelectedLog] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const h = (e) => setMousePosition({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", h);
    return () => window.removeEventListener("mousemove", h);
  }, []);

  useEffect(() => {
    const h = (e) => setSidebarExpanded(e.detail.expanded);
    window.addEventListener("sidebarToggle", h);
    return () => window.removeEventListener("sidebarToggle", h);
  }, []);

  const sidebarW = sidebarExpanded ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED;

  const filtered = LOGS.filter((l) => {
    const matchFilter = activeFilter === "All" || l.action === activeFilter;
    const matchSearch =
      search === "" ||
      l.file.toLowerCase().includes(search.toLowerCase()) ||
      l.user.toLowerCase().includes(search.toLowerCase()) ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.location.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const stats = [
    { label: "Total Events",    value: LOGS.length,                                           color: "from-cyan-500 to-blue-600",    Icon: Activity      },
    { label: "Threats Blocked", value: LOGS.filter((l) => l.status === "blocked").length,     color: "from-red-500 to-rose-600",     Icon: AlertTriangle },
    { label: "File Actions",    value: LOGS.filter((l) => l.action.startsWith("File")).length,color: "from-indigo-500 to-violet-600",Icon: FileText      },
    { label: "Unique Users",    value: [...new Set(LOGS.map((l) => l.user))].length,          color: "from-emerald-500 to-teal-600", Icon: UserCheck     },
  ];

  const card = `rounded-2xl border backdrop-blur-xl shadow-xl transition-all duration-300 ${
    isDark ? "bg-slate-800/50 border-slate-700/50" : "bg-white/80 border-gray-200"
  }`;

  return (
    <div className={`h-screen w-full overflow-hidden transition-colors duration-500 ${
      isDark ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" : "bg-gradient-to-br from-gray-50 via-white to-gray-100"
    }`}>

      {/* Ambient blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-1/4 -left-1/4 w-96 h-96 ${isDark ? "bg-cyan-500/5" : "bg-cyan-500/3"} rounded-full blur-3xl animate-pulse`} />
        <div className={`absolute bottom-1/4 -right-1/4 w-96 h-96 ${isDark ? "bg-red-500/5" : "bg-red-500/3"} rounded-full blur-3xl animate-pulse`} style={{ animationDelay: "1s" }} />
      </div>

      {/* Cursor glow */}
      <div className="hidden lg:block fixed w-80 h-80 rounded-full pointer-events-none z-0 mix-blend-screen"
        style={{
          background: isDark ? "radial-gradient(circle, rgba(56,189,248,0.06) 0%, transparent 70%)" : "radial-gradient(circle, rgba(56,189,248,0.04) 0%, transparent 70%)",
          left: mousePosition.x - 160, top: mousePosition.y - 160, transition: "all 0.4s ease-out",
        }}
      />

      <VaultTopBar />
      <HamburgerMenu />

      <motion.main
        initial={false}
        animate={{ marginLeft: sidebarW }}
        transition={{ type: "spring", damping: 24, stiffness: 280 }}
        className="relative z-10 flex h-[calc(100vh-4rem)] mt-16"
      >
        {/* ── Single vault-scrollbar scroll container — matches all other pages ── */}
        <div className="flex-1 overflow-y-auto vault-scrollbar">
          <div className="max-w-[1600px] mx-auto px-3 sm:px-5 lg:px-6 py-5 sm:py-8 space-y-5 sm:space-y-6">

            {/* Heading */}
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 hover:rotate-6 hover:scale-110 transition-all duration-500 cursor-default flex-shrink-0">
                    <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>
                      Access Log
                    </h1>
                    <p className={`text-xs sm:text-sm mt-0.5 ${isDark ? "text-gray-400" : "text-gray-600"}`}>Full audit trail of vault activity</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className="self-start sm:self-auto flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all duration-300"
                >
                  <Download className="w-4 h-4" /> Export CSV
                </motion.button>
              </div>
            </motion.div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {stats.map(({ label, value, color, Icon }, i) => (
                <motion.div key={label}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07, duration: 0.4 }} whileHover={{ y: -4 }}
                  className={`group relative ${card} p-4 sm:p-5 overflow-hidden cursor-default`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                  <div className="relative flex items-start justify-between mb-3">
                    <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                  </div>
                  <p className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mb-0.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>{label}</p>
                  <p className={`text-xl sm:text-3xl font-bold bg-gradient-to-r ${color} bg-clip-text text-transparent`}>{value}</p>
                </motion.div>
              ))}
            </div>

            {/* Log table card */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className={`${card} overflow-hidden`}>

              <div className="h-[2px] bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600" />

              {/* Card header: title + search + filter */}
              <div className={`px-4 sm:px-6 py-4 border-b flex flex-col sm:flex-row sm:items-center gap-3 ${isDark ? "border-slate-700/50" : "border-gray-200"}`}>
                <div className="flex items-center gap-2.5 flex-1">
                  <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30 flex-shrink-0">
                    <Activity className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className={`text-sm sm:text-base font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Event Log</h2>
                    <p className={`text-[11px] ${isDark ? "text-gray-400" : "text-gray-500"}`}>{filtered.length} of {LOGS.length} events</p>
                  </div>
                </div>

                <div className="flex gap-2 flex-1 sm:max-w-md">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isDark ? "text-gray-400" : "text-gray-500"}`} />
                    <input
                      type="text" placeholder="Search events…" value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className={`w-full pl-9 pr-3 py-2 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-all ${
                        isDark
                          ? "bg-slate-700/50 border-slate-600/50 text-white placeholder-gray-500 hover:border-cyan-500/30"
                          : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 hover:border-cyan-500/40"
                      }`}
                    />
                  </div>

                  {/* Filter — portal CustomSelect, same as all other pages */}
                  <CustomSelect
                    value={activeFilter}
                    onChange={setActiveFilter}
                    options={FILTERS}
                    isDark={isDark}
                    icon={Filter}
                  />
                </div>
              </div>

              {/* Desktop table — no internal scroll; outer vault-scrollbar handles it */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`text-[10px] font-bold uppercase tracking-widest border-b ${isDark ? "border-slate-700/50 text-gray-500" : "border-gray-100 text-gray-400"}`}>
                      {["Action", "File / Target", "User", "IP Address", "Device", "Location", "Time", "Status"].map((h) => (
                        <th key={h} className="px-4 sm:px-6 py-3 text-left font-bold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length > 0 ? filtered.map((log, i) => {
                      const cfg = ACTION_CONFIG[log.action] || ACTION_CONFIG["Login"];
                      const ActionIcon = cfg.Icon;
                      const DevIcon = DEVICE_ICONS[log.device] || Monitor;
                      return (
                        <motion.tr key={log.id}
                          initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                          onClick={() => setSelectedLog(log)}
                          className={`group cursor-pointer transition-all duration-200 border-b ${
                            isDark ? "border-slate-700/20 hover:bg-slate-700/30" : "border-gray-50 hover:bg-gray-50"
                          }`}
                        >
                          <td className="px-4 sm:px-6 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                                <ActionIcon className={`w-3.5 h-3.5 ${cfg.color}`} />
                              </div>
                              <span className={`text-xs font-semibold whitespace-nowrap ${isDark ? "text-white" : "text-gray-900"}`}>{log.action}</span>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-3.5">
                            <span className={`text-xs truncate max-w-[160px] block ${isDark ? "text-gray-300" : "text-gray-700"}`}>{log.file}</span>
                          </td>
                          <td className="px-4 sm:px-6 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold text-white bg-gradient-to-br from-cyan-500 to-blue-600 flex-shrink-0">
                                {log.user === "System" ? "S" : log.user === "Unknown" ? "?" : log.user.charAt(0)}
                              </div>
                              <span className={`text-xs whitespace-nowrap ${isDark ? "text-gray-300" : "text-gray-700"}`}>{log.user}</span>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-3.5">
                            <span className={`text-xs font-mono ${isDark ? "text-gray-400" : "text-gray-500"}`}>{log.ip}</span>
                          </td>
                          <td className="px-4 sm:px-6 py-3.5">
                            <div className="flex items-center gap-1.5">
                              <DevIcon className={`w-3.5 h-3.5 ${isDark ? "text-gray-400" : "text-gray-500"}`} />
                              <span className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>{log.device}</span>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-3.5">
                            <span className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>{log.location}</span>
                          </td>
                          <td className="px-4 sm:px-6 py-3.5">
                            <span className={`text-xs whitespace-nowrap font-mono ${isDark ? "text-gray-400" : "text-gray-500"}`}>{log.time}</span>
                          </td>
                          <td className="px-4 sm:px-6 py-3.5">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              log.status === "success"
                                ? isDark ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-600"
                                : isDark ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-red-50 border-red-200 text-red-500"
                            }`}>
                              {log.status === "success" ? <CheckCircle className="w-2.5 h-2.5" /> : <AlertTriangle className="w-2.5 h-2.5" />}
                              {log.status === "success" ? "Success" : "Blocked"}
                            </span>
                          </td>
                        </motion.tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan={8} className="py-16 text-center">
                          <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>No events match your search</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y" style={{ borderColor: isDark ? "rgba(51,65,85,0.3)" : "rgba(229,231,235,0.8)" }}>
                {filtered.length > 0 ? filtered.map((log, i) => {
                  const cfg = ACTION_CONFIG[log.action] || ACTION_CONFIG["Login"];
                  const ActionIcon = cfg.Icon;
                  return (
                    <motion.div key={log.id}
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                      onClick={() => setSelectedLog(log)}
                      className={`p-4 cursor-pointer transition-colors ${isDark ? "hover:bg-slate-700/30" : "hover:bg-gray-50"}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.bg}`}>
                          <ActionIcon className={`w-4 h-4 ${cfg.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-xs font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>{log.action}</span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border flex-shrink-0 ${
                              log.status === "success"
                                ? isDark ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-600"
                                : isDark ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-red-50 border-red-200 text-red-500"
                            }`}>
                              {log.status === "success" ? <CheckCircle className="w-2.5 h-2.5" /> : <AlertTriangle className="w-2.5 h-2.5" />}
                              {log.status === "success" ? "OK" : "Blocked"}
                            </span>
                          </div>
                          <p className={`text-[11px] truncate mt-0.5 ${isDark ? "text-gray-300" : "text-gray-700"}`}>{log.file}</p>
                          <div className={`flex items-center gap-3 mt-1 text-[10px] ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                            <span>{log.user}</span><span>·</span>
                            <span>{log.location}</span><span>·</span>
                            <span className="font-mono">{log.time.split(" ")[1]}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                }) : (
                  <div className="py-16 text-center">
                    <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>No events match your search</p>
                  </div>
                )}
              </div>
            </motion.div>

          </div>
        </div>
      </motion.main>

      {/* Log Detail Modal */}
      <AnimatePresence>
        {selectedLog && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelectedLog(null)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[90] p-4"
          >
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`rounded-2xl w-full max-w-md shadow-2xl border overflow-hidden ${isDark ? "bg-slate-900/98 border-cyan-500/20" : "bg-white/98 border-cyan-500/30"}`}
            >
              <div className="h-[2px] bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600" />
              <div className="p-5 sm:p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const cfg = ACTION_CONFIG[selectedLog.action] || ACTION_CONFIG["Login"];
                      const ActionIcon = cfg.Icon;
                      return (
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cfg.bg}`}>
                          <ActionIcon className={`w-5 h-5 ${cfg.color}`} />
                        </div>
                      );
                    })()}
                    <div>
                      <h2 className={`text-base font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{selectedLog.action}</h2>
                      <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>Event Detail</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedLog(null)}
                    className={`p-2 rounded-xl ${isDark ? "hover:bg-slate-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className={`space-y-3 rounded-xl p-4 border ${isDark ? "bg-slate-800/50 border-slate-700/50" : "bg-gray-50 border-gray-200"}`}>
                  {[
                    { label: "File / Target", value: selectedLog.file },
                    { label: "User",          value: selectedLog.user },
                    { label: "IP Address",    value: selectedLog.ip,       mono: true },
                    { label: "Device",        value: selectedLog.device },
                    { label: "Location",      value: selectedLog.location },
                    { label: "Timestamp",     value: selectedLog.time,     mono: true },
                    { label: "Status",        value: selectedLog.status === "success" ? "✓ Success" : "✗ Blocked" },
                  ].map(({ label, value, mono }) => (
                    <div key={label} className="flex items-start justify-between gap-4">
                      <span className={`text-xs font-semibold flex-shrink-0 ${isDark ? "text-gray-400" : "text-gray-500"}`}>{label}</span>
                      <span className={`text-xs text-right ${mono ? "font-mono" : "font-medium"} ${isDark ? "text-white" : "text-gray-900"}`}>{value}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => setSelectedLog(null)}
                  className={`w-full mt-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    isDark ? "bg-slate-800 border-slate-700 text-white hover:bg-slate-700" : "bg-gray-100 border-gray-200 text-gray-900 hover:bg-gray-200"
                  }`}>
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }
        .animate-shimmer { animation: shimmer 2.5s infinite; }
        .vault-scrollbar::-webkit-scrollbar { width: 4px; }
        .vault-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .vault-scrollbar::-webkit-scrollbar-thumb { background: rgba(6,182,212,0.4); border-radius: 2px; }
        .vault-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(6,182,212,0.65); }
        .scrollbar-dropdown-dark::-webkit-scrollbar { width: 4px; }
        .scrollbar-dropdown-dark::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-dropdown-dark::-webkit-scrollbar-thumb { background: rgba(6,182,212,0.4); border-radius: 2px; }
        .scrollbar-dropdown-dark::-webkit-scrollbar-thumb:hover { background: rgba(6,182,212,0.65); }
      `}</style>
    </div>
  );
};

export default AccessLog;