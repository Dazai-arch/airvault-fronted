import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock, Eye, Share2, QrCode, Trash2, Search, Grid3X3, List,
  AlertTriangle, CheckCircle, Clock, AlertCircle, Activity, Plus,
  Copy, X, Shield, FileText, Database, TrendingUp, FileImage,
  FileJson, FileSpreadsheet, Archive, Download, Upload, LogIn,
  UserCheck, RefreshCw, Zap, Video, Music, Code, File, ChevronDown,
} from "lucide-react";
import { useVault } from "../context/VaultContext";
import { useTheme } from "../context/ThemeContext";
import HamburgerMenu from "../components/layout/HamburgerMenu";
import VaultTopBar from "../components/layout/VaultTopBar";

/* ─── DonutChart ─── */
const DonutChart = ({ segments, size = 120, stroke = 18, isDark }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const cx = size / 2, cy = size / 2;
  const [tooltip, setTooltip] = useState(null);
  let offset = 0;
  const arcs = segments.map((s, i) => {
    const dash = (s.pct / 100) * circ;
    const gap  = circ - dash;
    const startOffset = offset;
    offset += dash;
    return { ...s, dash, gap, startOffset, i };
  });
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={cx} cy={cy} r={r} fill="none"
          stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}
          strokeWidth={stroke} />
        {arcs.map(({ dash, gap, startOffset, color, label, pct, count, i }) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={color} strokeWidth={stroke + 2}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-startOffset}
            strokeLinecap="round"
            className="cursor-pointer"
            style={{ transition: "stroke-dasharray 1s ease, stroke-width 0.2s" }}
            onMouseEnter={() => setTooltip({ label, pct, count, color })}
            onMouseLeave={() => setTooltip(null)}
          />
        ))}
      </svg>
      <AnimatePresence>
        {tooltip && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }} transition={{ duration: 0.15 }}
            className={`absolute left-1/2 -translate-x-1/2 -top-12 z-50 px-3 py-1.5 rounded-xl border shadow-2xl text-xs font-semibold whitespace-nowrap pointer-events-none ${isDark ? "bg-slate-900 border-slate-700/60 text-white" : "bg-white border-gray-200 text-gray-900"}`}
          >
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: tooltip.color }} />
              <span>{tooltip.label}</span>
              <span className={`font-normal ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                · {tooltip.count} files · {tooltip.pct.toFixed(0)}%
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─── SparkBar ─── */
const SparkBar = ({ data, color }) => {
  const max  = Math.max(...data);
  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const [tooltip, setTooltip] = useState(null);
  return (
    <div className="relative">
      <div className="flex items-end gap-0.5 h-8">
        {data.map((v, i) => (
          <motion.div key={i}
            initial={{ height: 0 }} animate={{ height: `${(v / max) * 100}%` }}
            transition={{ delay: i * 0.05, duration: 0.5, ease: "easeOut" }}
            className="flex-1 rounded-sm cursor-pointer"
            style={{ background: color, opacity: tooltip?.i === i ? 1 : 0.5 + (i / data.length) * 0.5 }}
            onMouseEnter={() => setTooltip({ i, v, day: days[i] })}
            onMouseLeave={() => setTooltip(null)}
          />
        ))}
      </div>
      <AnimatePresence>
        {tooltip && (
          <motion.div
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
            className="absolute -top-8 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700/60 text-white text-[10px] font-semibold whitespace-nowrap pointer-events-none z-50 shadow-xl"
            style={{ left: `${(tooltip.i / data.length) * 100}%` }}
          >
            {tooltip.day}: {tooltip.v} uploads
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─── StorageBar ─── */
const StorageBar = ({ type, size, total, color, isDark }) => {
  const [hovered, setHovered] = useState(false);
  const pct = (size / total) * 100;
  return (
    <div className="relative" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
            className={`absolute -top-8 left-0 z-50 px-2.5 py-1 rounded-lg border shadow-xl text-[10px] font-semibold whitespace-nowrap pointer-events-none ${isDark ? "bg-slate-900 border-slate-700/60 text-white" : "bg-white border-gray-200 text-gray-900"}`}
          >
            {type}: {size.toFixed(2)} MB ({pct.toFixed(1)}%)
          </motion.div>
        )}
      </AnimatePresence>
      <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? "bg-slate-700" : "bg-gray-100"}`}>
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${Math.min(pct * 4, 100)}%` }}
          transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
          className="h-full rounded-full" style={{ background: color }}
        />
      </div>
    </div>
  );
};

/* ─── CustomSelect ─── */
const CustomSelect = ({ value, onChange, options, isDark }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 ${isDark
          ? `bg-slate-800/60 border-slate-700/50 text-white hover:border-cyan-500/40 ${open ? "border-cyan-500/50 ring-2 ring-cyan-500/20" : ""}`
          : `bg-gray-50 border-gray-200 text-gray-900 hover:border-cyan-400 ${open ? "border-cyan-400 ring-2 ring-cyan-500/20" : ""}`
        }`}>
        <span>{value}</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 flex-shrink-0 ${isDark ? "text-gray-400" : "text-gray-500"} ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }} transition={{ duration: 0.15 }}
            className={`absolute z-50 w-full mt-1.5 rounded-xl border shadow-2xl overflow-hidden ${isDark ? "bg-slate-900 border-slate-700/60" : "bg-white border-gray-200"}`}
          >
            <div className="h-[2px] bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600" />
            {options.map(opt => (
              <button key={opt} type="button" onClick={() => { onChange(opt); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors duration-150 flex items-center justify-between ${
                  opt === value
                    ? isDark ? "bg-cyan-500/15 text-cyan-400 font-semibold" : "bg-cyan-50 text-cyan-600 font-semibold"
                    : isDark ? "text-gray-300 hover:bg-slate-800" : "text-gray-700 hover:bg-gray-50"
                }`}>
                {opt}
                {opt === value && <CheckCircle className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─── File type config ─── */
const getFileTypeConfig = (type) => {
  const MAP = {
    PDF:          { Icon: FileText,        gradient: "from-red-500 to-rose-600",        bg: "bg-red-500/10",      border: "border-red-500/20",      text: "text-red-400",     color: "#f87171" },
    Image:        { Icon: FileImage,       gradient: "from-violet-500 to-purple-600",   bg: "bg-violet-500/10",   border: "border-violet-500/20",   text: "text-violet-400",  color: "#a78bfa" },
    JSON:         { Icon: FileJson,        gradient: "from-amber-500 to-orange-600",    bg: "bg-amber-500/10",    border: "border-amber-500/20",    text: "text-amber-400",   color: "#fbbf24" },
    Excel:        { Icon: FileSpreadsheet, gradient: "from-emerald-500 to-teal-600",    bg: "bg-emerald-500/10",  border: "border-emerald-500/20",  text: "text-emerald-400", color: "#34d399" },
    Archive:      { Icon: Archive,         gradient: "from-cyan-500 to-blue-600",       bg: "bg-cyan-500/10",     border: "border-cyan-500/20",     text: "text-cyan-400",    color: "#22d3ee" },
    Video:        { Icon: Video,           gradient: "from-pink-500 to-rose-600",       bg: "bg-pink-500/10",     border: "border-pink-500/20",     text: "text-pink-400",    color: "#f472b6" },
    Audio:        { Icon: Music,           gradient: "from-lime-500 to-green-600",      bg: "bg-lime-500/10",     border: "border-lime-500/20",     text: "text-lime-400",    color: "#a3e635" },
    Code:         { Icon: Code,            gradient: "from-sky-500 to-cyan-600",        bg: "bg-sky-500/10",      border: "border-sky-500/20",      text: "text-sky-400",     color: "#38bdf8" },
    Word:         { Icon: FileText,        gradient: "from-blue-500 to-indigo-600",     bg: "bg-blue-500/10",     border: "border-blue-500/20",     text: "text-blue-400",    color: "#60a5fa" },
    Spreadsheet:  { Icon: FileSpreadsheet, gradient: "from-green-500 to-emerald-600",   bg: "bg-green-500/10",    border: "border-green-500/20",    text: "text-green-400",   color: "#4ade80" },
    Presentation: { Icon: FileText,        gradient: "from-orange-500 to-amber-600",    bg: "bg-orange-500/10",   border: "border-orange-500/20",   text: "text-orange-400",  color: "#fb923c" },
    Text:         { Icon: FileText,        gradient: "from-gray-500 to-slate-600",      bg: "bg-gray-500/10",     border: "border-gray-500/20",     text: "text-gray-400",    color: "#94a3b8" },
  };
  return MAP[type] || { Icon: File, gradient: "from-slate-500 to-gray-600", bg: "bg-slate-500/10", border: "border-slate-500/20", text: "text-slate-400", color: "#94a3b8" };
};

/* ══════════════════════════════════════════════════════ MAIN ══ */
const VaultDashboard = () => {
  const { activeVault } = useVault();
  const { isDark }      = useTheme();

  const [viewMode,       setViewMode]       = useState("grid");
  const [searchQuery,    setSearchQuery]    = useState("");
  const [selectedFile,   setSelectedFile]   = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink,      setShareLink]      = useState("");
  const [shareExpiry,    setShareExpiry]    = useState("24 hours");
  const [permissions,    setPermissions]    = useState({ view: true, download: false });
  const [hoveredFileId,  setHoveredFileId]  = useState(null);
  const [copied,         setCopied]         = useState(false);
  const [mousePosition,  setMousePosition]  = useState({ x: 0, y: 0 });

  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const SIDEBAR_COLLAPSED = 60;
  const SIDEBAR_EXPANDED  = 220;
  const sidebarW = sidebarExpanded ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED;

  useEffect(() => {
    const h = e => setMousePosition({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", h);
    return () => window.removeEventListener("mousemove", h);
  }, []);

  useEffect(() => {
    const h = e => setSidebarExpanded(e.detail.expanded);
    window.addEventListener("sidebarToggle", h);
    return () => window.removeEventListener("sidebarToggle", h);
  }, []);

  const [files, setFiles] = useState([
    { id:  1, name: "Project_Proposal.pdf",      size: "2.4 MB",  type: "PDF",          uploadDate: "2026-02-15", encrypted: true,  views:  45, downloads: 12, shared: true,  sv:  2.4   },
    { id:  2, name: "Architecture_Diagram.png",  size: "5.1 MB",  type: "Image",        uploadDate: "2026-02-14", encrypted: true,  views:  78, downloads: 23, shared: true,  sv:  5.1   },
    { id:  3, name: "Database_Config.json",      size: "156 KB",  type: "JSON",         uploadDate: "2026-02-13", encrypted: true,  views:  12, downloads:  3, shared: false, sv:  0.156 },
    { id:  4, name: "Financial_Report_Q1.xlsx",  size: "3.7 MB",  type: "Excel",        uploadDate: "2026-02-12", encrypted: true,  views:  34, downloads:  8, shared: true,  sv:  3.7   },
    { id:  5, name: "Marketing_Assets.zip",      size: "12.4 MB", type: "Archive",      uploadDate: "2026-02-10", encrypted: true,  views: 156, downloads: 45, shared: true,  sv: 12.4   },
    { id:  6, name: "Product_Demo.mp4",          size: "48.2 MB", type: "Video",        uploadDate: "2026-02-09", encrypted: true,  views:  22, downloads:  5, shared: false, sv: 48.2   },
    { id:  7, name: "Brand_Soundtrack.mp3",      size: "8.1 MB",  type: "Audio",        uploadDate: "2026-02-08", encrypted: false, views:   9, downloads:  2, shared: false, sv:  8.1   },
    { id:  8, name: "api_handler.py",            size: "34 KB",   type: "Code",         uploadDate: "2026-02-07", encrypted: true,  views:   6, downloads:  1, shared: false, sv:  0.034 },
    { id:  9, name: "Meeting_Notes.docx",        size: "220 KB",  type: "Word",         uploadDate: "2026-02-06", encrypted: true,  views:  17, downloads:  4, shared: true,  sv:  0.22  },
    { id: 10, name: "Q1_Forecast.numbers",       size: "1.8 MB",  type: "Spreadsheet",  uploadDate: "2026-02-05", encrypted: true,  views:  11, downloads:  3, shared: false, sv:  1.8   },
    { id: 11, name: "Product_Roadmap.pptx",      size: "6.3 MB",  type: "Presentation", uploadDate: "2026-02-04", encrypted: true,  views:  41, downloads: 10, shared: true,  sv:  6.3   },
    { id: 12, name: "README.md",                 size: "18 KB",   type: "Text",         uploadDate: "2026-02-03", encrypted: false, views:   3, downloads:  1, shared: false, sv:  0.018 },
  ]);

  const [alerts, setAlerts] = useState([
    { id: 1, type: "suspicious", message: "Multiple failed login attempts from unknown location", time: "2 min ago"  },
    { id: 2, type: "normal",     message: "File accessed successfully",                           time: "15 min ago" },
    { id: 3, type: "suspicious", message: "Unauthorized access attempt blocked",                  time: "1 hr ago"   },
    { id: 4, type: "normal",     message: "Vault backup completed successfully",                  time: "3 hrs ago"  },
  ]);

  const activityFeed = [
    { id: 1, action: "File uploaded",   file: "Project_Proposal.pdf",     user: "You",      time: "2 min ago",  Icon: Upload,    color: "text-cyan-400",    bg: "bg-cyan-500/10"    },
    { id: 2, action: "File accessed",   file: "Architecture_Diagram.png", user: "John D.",  time: "18 min ago", Icon: LogIn,     color: "text-blue-400",    bg: "bg-blue-500/10"    },
    { id: 3, action: "Link shared",     file: "Financial_Report_Q1.xlsx", user: "You",      time: "1 hr ago",   Icon: Share2,    color: "text-indigo-400",  bg: "bg-indigo-500/10"  },
    { id: 4, action: "File downloaded", file: "Marketing_Assets.zip",     user: "Sarah K.", time: "3 hrs ago",  Icon: Download,  color: "text-violet-400",  bg: "bg-violet-500/10"  },
    { id: 5, action: "Vault synced",    file: "All files",                user: "System",   time: "5 hrs ago",  Icon: RefreshCw, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { id: 6, action: "Access granted",  file: "Database_Config.json",     user: "You",      time: "Yesterday",  Icon: UserCheck, color: "text-teal-400",    bg: "bg-teal-500/10"    },
    { id: 7, action: "File encrypted",  file: "Project_Proposal.pdf",     user: "System",   time: "Yesterday",  Icon: Zap,       color: "text-amber-400",   bg: "bg-amber-500/10"   },
  ];

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = (file) => {
    setSelectedFile(file);
    setShowShareModal(true);
    setShareLink(`https://airvault.io/shares/${Math.random().toString(36).substr(2, 9)}`);
  };

  const filteredFiles  = files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const totalSize      = files.reduce((s, f) => s + f.sv, 0).toFixed(1);
  const STORAGE_LIMIT  = 200;

  const typeCounts = Object.entries(files.reduce((acc, f) => { acc[f.type] = (acc[f.type] || 0) + 1; return acc; }, {}));
  const donutSegments = typeCounts.map(([type, count]) => ({
    pct: (count / files.length) * 100, color: getFileTypeConfig(type).color, label: type, count,
  }));
  const storageByType = Object.entries(
    files.reduce((acc, f) => { acc[f.type] = (acc[f.type] || 0) + f.sv; return acc; }, {})
  ).sort((a, b) => b[1] - a[1]);

  const weeklyUploads = [2, 5, 3, 8, 4, 7, 5];

  const stats = [
    { label: "Total Files",  value: files.length,                           Icon: FileText, color: "from-cyan-500 to-blue-600",     bar: (files.length / 20) * 100 },
    { label: "Storage Used", value: `${totalSize} MB`,                      Icon: Database, color: "from-blue-600 to-indigo-600",   bar: (parseFloat(totalSize) / STORAGE_LIMIT) * 100 },
    { label: "Shared Files", value: files.filter(f => f.shared).length,     Icon: Share2,   color: "from-indigo-500 to-violet-600", bar: (files.filter(f => f.shared).length / files.length) * 100 },
    { label: "Security",     value: "98%",                                   Icon: Shield,   color: "from-emerald-500 to-teal-600",  bar: 98 },
    { label: "Total Views",  value: files.reduce((s, f) => s + f.views, 0), Icon: Eye,      color: "from-violet-500 to-purple-600", bar: 55 },
  ];

  if (!activeVault) return (
    <div className={`min-h-screen w-full flex items-center justify-center ${isDark ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" : "bg-gradient-to-br from-gray-50 via-white to-gray-100"}`}>
      <div className="text-center px-4">
        <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-cyan-500/30">
          <Shield className="w-10 h-10 text-white" />
        </div>
        <p className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>No vault selected</p>
        <p className={`text-sm mt-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>Select or create a vault to continue</p>
      </div>
    </div>
  );

  const card        = `rounded-2xl border backdrop-blur-xl shadow-xl transition-all duration-300 ${isDark ? "bg-slate-800/50 border-slate-700/50" : "bg-white/80 border-gray-200"}`;
  const sectionIcon = (gradient, Icon) => (
    <div className={`w-9 h-9 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}>
      <Icon className="w-4 h-4 text-white" />
    </div>
  );

  return (
    <div className={`h-screen w-full overflow-hidden transition-colors duration-500 ${isDark ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" : "bg-gradient-to-br from-gray-50 via-white to-gray-100"}`}>

      {/* Ambient blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-1/4 -left-1/4 w-96 h-96 ${isDark ? "bg-cyan-500/5" : "bg-cyan-500/3"} rounded-full blur-3xl animate-pulse`} />
        <div className={`absolute bottom-1/4 -right-1/4 w-96 h-96 ${isDark ? "bg-blue-600/5" : "bg-blue-600/3"} rounded-full blur-3xl animate-pulse`} style={{ animationDelay: "1s" }} />
        <div className={`absolute top-1/2 left-1/2 w-96 h-96 ${isDark ? "bg-indigo-500/3" : "bg-indigo-500/2"} rounded-full blur-3xl animate-pulse`} style={{ animationDelay: "0.5s" }} />
      </div>

      {/* Cursor glow */}
      <div className="hidden lg:block fixed w-80 h-80 rounded-full pointer-events-none z-0 mix-blend-screen"
        style={{
          background: isDark ? "radial-gradient(circle, rgba(56,189,248,0.07) 0%, transparent 70%)" : "radial-gradient(circle, rgba(56,189,248,0.05) 0%, transparent 70%)",
          left: mousePosition.x - 160, top: mousePosition.y - 160, transition: "all 0.4s ease-out",
        }} />

      <VaultTopBar />
      <HamburgerMenu />

      {/* ══ MAIN ══ */}
      <motion.main
        initial={false}
        animate={{ marginLeft: sidebarW }}
        transition={{ type: "spring", damping: 24, stiffness: 280 }}
        className="relative z-10 flex h-[calc(100vh-4rem)] mt-16"
      >
        {/* ✅ vault-scrollbar — identical class to FileUpload */}
        <div className="flex-1 overflow-y-auto vault-scrollbar">
          <div className="max-w-[1600px] mx-auto px-3 sm:px-5 lg:px-6 py-5 sm:py-8 space-y-5 sm:space-y-6">

            {/* Page heading */}
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/30 hover:rotate-6 hover:scale-110 transition-all duration-500 cursor-default flex-shrink-0">
                    <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>
                      {activeVault?.name} <span className="hidden sm:inline">Dashboard</span>
                    </h1>
                    <p className={`text-xs sm:text-sm mt-0.5 ${isDark ? "text-gray-400" : "text-gray-600"}`}>Manage your encrypted files securely</p>
                  </div>
                </div>
                <div className={`sm:hidden self-start flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${isDark ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-300" : "bg-cyan-500/10 border-cyan-500/30 text-cyan-700"}`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {activeVault?.name}
                </div>
              </div>
            </motion.div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {stats.map(({ label, value, Icon, color, bar }, i) => (
                <motion.div key={label}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.4 }} whileHover={{ y: -4 }}
                  className={`group relative rounded-2xl p-4 sm:p-5 border backdrop-blur-sm overflow-hidden cursor-default transition-all duration-300 ${isDark ? "bg-slate-800/50 border-slate-700/50 hover:border-cyan-500/40 hover:shadow-xl hover:shadow-cyan-500/10" : "bg-white/80 border-gray-200 hover:border-cyan-500/40 hover:shadow-xl hover:shadow-cyan-500/10"}`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                  <div className="relative">
                    <div className="flex items-start justify-between mb-2 sm:mb-3">
                      <div className={`inline-flex bg-gradient-to-br ${color} w-9 h-9 sm:w-11 sm:h-11 rounded-xl items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <TrendingUp className={`w-3 h-3 sm:w-4 sm:h-4 opacity-30 ${isDark ? "text-gray-400" : "text-gray-500"}`} />
                    </div>
                    <p className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mb-0.5 sm:mb-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>{label}</p>
                    <p className={`text-lg sm:text-2xl font-bold bg-gradient-to-r ${color} bg-clip-text text-transparent`}>{value}</p>
                    <div className={`mt-2 sm:mt-3 h-1 rounded-full overflow-hidden ${isDark ? "bg-slate-700" : "bg-gray-200"}`}>
                      <motion.div
                        initial={{ width: 0 }} animate={{ width: `${Math.min(bar, 100)}%` }}
                        transition={{ duration: 1.2, delay: i * 0.1, ease: "easeOut" }}
                        className={`h-full rounded-full bg-gradient-to-r ${color}`}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* ROW A */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 items-start">

              {/* Storage column */}
              <div className="flex flex-col gap-4 sm:gap-5">

                {/* Storage Usage — fixed height, scrollable list inside */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
                  className={`${card} p-5 flex flex-col`} style={{ height: "340px" }}>
                  <div className="flex items-center justify-between mb-4 flex-shrink-0">
                    <h2 className={`text-sm sm:text-base font-bold flex items-center gap-2.5 ${isDark ? "text-white" : "text-gray-900"}`}>
                      {sectionIcon("from-blue-600 to-indigo-600", Database)} Storage Usage
                    </h2>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${isDark ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
                      {totalSize} / {STORAGE_LIMIT} MB
                    </span>
                  </div>
                  <div className="mb-4 flex-shrink-0">
                    <div className="flex justify-between mb-1.5">
                      <span className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>Used</span>
                      <span className={`text-xs font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                        {((parseFloat(totalSize) / STORAGE_LIMIT) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className={`h-3 rounded-full overflow-hidden ${isDark ? "bg-slate-700" : "bg-gray-200"}`}>
                      <motion.div
                        initial={{ width: 0 }} animate={{ width: `${(parseFloat(totalSize) / STORAGE_LIMIT) * 100}%` }}
                        transition={{ duration: 1.4, ease: "easeOut" }}
                        className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                      </motion.div>
                    </div>
                  </div>
                  {/* ✅ vault-scrollbar on the inner scrollable list */}
                  <div className="flex-1 overflow-y-auto vault-scrollbar pr-1 min-h-0">
                    <div className="space-y-3">
                      {storageByType.map(([type, size]) => {
                        const ft = getFileTypeConfig(type);
                        return (
                          <div key={type}>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ft.color }} />
                                <span className={`text-xs font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>{type}</span>
                              </div>
                              <span className={`text-[11px] ${isDark ? "text-gray-400" : "text-gray-500"}`}>{size.toFixed(2)} MB</span>
                            </div>
                            <StorageBar type={type} size={size} total={STORAGE_LIMIT} color={ft.color} isDark={isDark} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>

                {/* Weekly Uploads */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
                  className={`${card} p-5 flex-shrink-0`}>
                  <div className="flex items-center gap-2.5 mb-4">
                    {sectionIcon("from-cyan-500 to-teal-600", Activity)}
                    <span className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Weekly Uploads</span>
                  </div>
                  <SparkBar data={weeklyUploads} color="#22d3ee" />
                  <div className="flex justify-between mt-2">
                    {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => (
                      <span key={d} className={`text-[9px] ${isDark ? "text-gray-600" : "text-gray-400"}`}>{d}</span>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* File Breakdown Donut */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}
                className={`${card} p-5`}>
                <div className="flex items-center justify-between mb-5">
                  <h2 className={`text-sm sm:text-base font-bold flex items-center gap-2.5 ${isDark ? "text-white" : "text-gray-900"}`}>
                    {sectionIcon("from-violet-500 to-purple-600", FileText)} File Breakdown
                  </h2>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${isDark ? "bg-violet-500/10 text-violet-400" : "bg-violet-50 text-violet-600"}`}>
                    {files.length} total
                  </span>
                </div>
                <div className="flex flex-col items-center gap-5">
                  <div className="relative flex-shrink-0">
                    <DonutChart segments={donutSegments} size={140} stroke={22} isDark={isDark} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{files.length}</span>
                      <span className={`text-[10px] ${isDark ? "text-gray-400" : "text-gray-500"}`}>Files</span>
                    </div>
                  </div>
                  {/* ✅ vault-scrollbar */}
                  <div className="w-full grid grid-cols-2 gap-2 max-h-48 overflow-y-auto vault-scrollbar">
                    {donutSegments.map((s, i) => {
                      const ft = getFileTypeConfig(s.label);
                      const FIcon = ft.Icon;
                      return (
                        <div key={i} className={`flex items-center gap-2.5 p-2.5 rounded-xl border ${isDark ? "bg-slate-700/30 border-slate-700/50" : "bg-gray-50 border-gray-100"}`}>
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: s.color + "22" }}>
                            <FIcon className="w-3.5 h-3.5" style={{ color: s.color }} />
                          </div>
                          <div className="min-w-0">
                            <p className={`text-[11px] font-semibold truncate ${isDark ? "text-white" : "text-gray-900"}`}>{s.label}</p>
                            <p className={`text-[10px] ${isDark ? "text-gray-400" : "text-gray-500"}`}>{s.count} · {s.pct.toFixed(0)}%</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>

              {/* Activity Feed */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className={`${card} p-5 md:col-span-2 xl:col-span-1`}>
                <div className="flex items-center justify-between mb-5">
                  <h2 className={`text-sm sm:text-base font-bold flex items-center gap-2.5 ${isDark ? "text-white" : "text-gray-900"}`}>
                    {sectionIcon("from-cyan-500 to-teal-600", Activity)} Recent Activity
                  </h2>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className={`text-[10px] font-semibold ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>Live</span>
                  </div>
                </div>
                {/* ✅ vault-scrollbar */}
                <div className="space-y-1 max-h-[340px] overflow-y-auto vault-scrollbar pr-1">
                  {activityFeed.map((item, i) => (
                    <motion.div key={item.id}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.06 }}
                      className={`flex items-start gap-3 p-3 rounded-xl transition-all duration-200 ${isDark ? "hover:bg-slate-700/40" : "hover:bg-gray-50"}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${item.bg}`}>
                        <item.Icon className={`w-3.5 h-3.5 ${item.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>{item.action}</p>
                        <p className={`text-[11px] truncate ${isDark ? "text-gray-400" : "text-gray-500"}`}>{item.file}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[10px] ${isDark ? "text-gray-500" : "text-gray-400"}`}>{item.user}</span>
                          <span className={`text-[10px] ${isDark ? "text-gray-600" : "text-gray-300"}`}>·</span>
                          <span className={`text-[10px] ${isDark ? "text-gray-500" : "text-gray-400"}`}>{item.time}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* ROW B */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-5">
              <div className="xl:col-span-8 space-y-4 sm:space-y-5">

                {/* Search + view toggle */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}
                  className="flex gap-2 sm:gap-3">
                  <div className="flex-1 relative">
                    <Search className={`absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-gray-400" : "text-gray-500"}`} />
                    <input type="text" placeholder="Search files…" value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className={`w-full pl-9 sm:pl-11 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-all ${isDark ? "bg-slate-800/50 border-slate-700/50 text-white placeholder-gray-500 hover:border-cyan-500/30" : "bg-white/80 border-gray-200 text-gray-900 placeholder-gray-400 hover:border-cyan-500/40"}`}
                    />
                  </div>
                  {[{ mode: "grid", Icon: Grid3X3 }, { mode: "list", Icon: List }].map(({ mode, Icon }) => (
                    <button key={mode} onClick={() => setViewMode(mode)}
                      className={`p-2.5 rounded-xl border transition-all duration-200 ${
                        viewMode === mode
                          ? "bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border-cyan-500/50 text-cyan-400 shadow-lg shadow-cyan-500/10"
                          : isDark ? "bg-slate-800/50 border-slate-700/50 text-gray-400 hover:border-cyan-500/30" : "bg-white/80 border-gray-200 text-gray-500 hover:border-cyan-500/40"
                      }`}>
                      <Icon className="w-4 h-4" />
                    </button>
                  ))}
                </motion.div>

                {/* File panel */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}
                  className={`${card} p-4 sm:p-6`}>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className={`text-sm sm:text-base font-bold flex items-center gap-2.5 ${isDark ? "text-white" : "text-gray-900"}`}>
                      {sectionIcon("from-cyan-500 to-blue-600", FileText)} File Management
                    </h2>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${isDark ? "bg-cyan-500/10 text-cyan-400" : "bg-cyan-500/10 text-cyan-700"}`}>
                      {filteredFiles.length} files
                    </span>
                  </div>

                  {/* Grid view */}
                  {viewMode === "grid" && (
                    /* ✅ vault-scrollbar */
                    <div className="max-h-[520px] overflow-y-auto pr-1 vault-scrollbar">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        {filteredFiles.length > 0 ? filteredFiles.map((file, idx) => {
                          const ft = getFileTypeConfig(file.type);
                          const FIcon = ft.Icon;
                          return (
                            <motion.div key={file.id}
                              initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: idx * 0.04 }}
                              onMouseEnter={() => setHoveredFileId(file.id)}
                              onMouseLeave={() => setHoveredFileId(null)}
                              className={`group relative rounded-xl p-4 border transition-all duration-500 hover:-translate-y-1.5 overflow-hidden ${isDark ? "bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 hover:border-cyan-500/40 hover:shadow-xl hover:shadow-cyan-500/10" : "bg-gradient-to-br from-gray-50 to-white border-gray-200 hover:border-cyan-500/50 hover:shadow-xl hover:shadow-cyan-500/10"}`}>
                              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-blue-600/0 group-hover:from-cyan-500/5 group-hover:to-blue-600/5 rounded-xl transition-all duration-500 pointer-events-none" />
                              <div className="relative">
                                <div className="flex items-start justify-between mb-3">
                                  <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center bg-gradient-to-br ${ft.gradient} shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                                    <FIcon className="w-5 h-5 text-white" />
                                  </div>
                                  {file.encrypted && (
                                    <span className={`flex items-center gap-1 px-2 py-1 rounded-full border text-[10px] font-semibold ${isDark ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-600"}`}>
                                      <Lock className="w-2.5 h-2.5" /> Enc
                                    </span>
                                  )}
                                </div>
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide mb-1.5 border ${ft.bg} ${ft.border} ${ft.text}`}>
                                  {file.type}
                                </span>
                                <p className={`font-semibold text-sm mb-1 truncate ${isDark ? "text-white" : "text-gray-900"}`}>{file.name}</p>
                                <p className={`text-xs mb-3 ${isDark ? "text-gray-400" : "text-gray-500"}`}>{file.size} · {file.uploadDate}</p>
                                <AnimatePresence>
                                  {hoveredFileId === file.id && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                                      className={`overflow-hidden mb-3 text-xs px-2 py-1.5 rounded-lg flex items-center gap-3 ${isDark ? "bg-slate-700/60 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
                                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {file.views}</span>
                                      <span className="flex items-center gap-1"><Download className="w-3 h-3" /> {file.downloads}</span>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                                <div className="flex gap-1.5">
                                  {[
                                    { label: "Copy",   Icon: Copy,   fn: () => copyToClipboard(file.name),                      cls: isDark ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20" : "bg-cyan-50 border-cyan-200 text-cyan-600 hover:bg-cyan-100"  },
                                    { label: "Share",  Icon: Share2, fn: () => handleShare(file),                               cls: isDark ? "bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20" : "bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100"  },
                                    { label: "Delete", Icon: Trash2, fn: () => setFiles(files.filter(f => f.id !== file.id)),   cls: isDark ? "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"   : "bg-red-50 border-red-100 text-red-500 hover:bg-red-100"        },
                                  ].map(({ label, Icon, fn, cls }) => (
                                    <button key={label} onClick={fn}
                                      className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 border ${cls}`}>
                                      <Icon className="w-3 h-3" /><span className="hidden sm:inline">{label}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          );
                        }) : (
                          <div className="col-span-full text-center py-12">
                            <p className={isDark ? "text-gray-400" : "text-gray-500"}>No files found</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* List view */}
                  {viewMode === "list" && (
                    /* ✅ vault-scrollbar */
                    <div className="max-h-[520px] overflow-y-auto pr-1 vault-scrollbar space-y-2">
                      {filteredFiles.length > 0 ? filteredFiles.map((file, idx) => {
                        const ft = getFileTypeConfig(file.type);
                        const FIcon = ft.Icon;
                        return (
                          <motion.div key={file.id}
                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.04 }}
                            className={`group flex items-center justify-between p-3 sm:p-4 border rounded-xl transition-all duration-300 ${isDark ? "bg-slate-800/30 border-slate-700/50 hover:border-cyan-500/40 hover:bg-slate-800/50 hover:shadow-lg hover:shadow-cyan-500/10" : "bg-gray-50 border-gray-200 hover:border-cyan-500/40 hover:bg-white hover:shadow-lg"}`}>
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${ft.gradient} shadow-md group-hover:scale-110 transition-all duration-300 flex-shrink-0`}>
                                <FIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className={`font-semibold text-sm truncate ${isDark ? "text-white" : "text-gray-900"}`}>{file.name}</p>
                                  <span className={`hidden sm:inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border flex-shrink-0 ${ft.bg} ${ft.border} ${ft.text}`}>{file.type}</span>
                                </div>
                                <p className={`text-xs flex flex-wrap items-center gap-2 mt-0.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                                  <span>{file.size} · {file.uploadDate}</span>
                                  <span className="hidden sm:flex items-center gap-1"><Eye className="w-3 h-3" />{file.views}</span>
                                  <span className="hidden sm:flex items-center gap-1"><Download className="w-3 h-3" />{file.downloads}</span>
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                              {file.encrypted && (
                                <span className={`hidden md:flex items-center gap-1 px-2 py-1 rounded-full border text-[10px] font-semibold ${isDark ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-600"}`}>
                                  <Lock className="w-2.5 h-2.5" /> Encrypted
                                </span>
                              )}
                              <button onClick={() => copyToClipboard(file.name)} className={`p-1.5 sm:p-2 rounded-lg transition-all ${isDark ? "hover:bg-cyan-500/20 text-cyan-400" : "hover:bg-cyan-100 text-cyan-600"}`}><Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></button>
                              <button onClick={() => handleShare(file)} className={`p-1.5 sm:p-2 rounded-lg transition-all ${isDark ? "hover:bg-blue-500/20 text-blue-400" : "hover:bg-blue-100 text-blue-600"}`}><Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></button>
                              <button onClick={() => setFiles(files.filter(f => f.id !== file.id))} className={`p-1.5 sm:p-2 rounded-lg transition-all ${isDark ? "hover:bg-red-500/20 text-red-400" : "hover:bg-red-100 text-red-500"}`}><Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></button>
                            </div>
                          </motion.div>
                        );
                      }) : (
                        <div className="text-center py-12">
                          <p className={isDark ? "text-gray-400" : "text-gray-500"}>No files found</p>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>

                {/* Smart Sharing */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.44 }}
                  className={`${card} p-4 sm:p-6`}>
                  <h2 className={`text-sm sm:text-base font-bold mb-5 flex items-center gap-2.5 ${isDark ? "text-white" : "text-gray-900"}`}>
                    {sectionIcon("from-indigo-500 to-violet-600", Share2)} Smart Sharing
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    {[
                      { Icon: Clock,  title: "Time-Limited Links", desc: "Links that expire automatically", gradient: "from-cyan-500 to-blue-600",    label: "Generate Link" },
                      { Icon: QrCode, title: "QR Codes",           desc: "Share via scannable QR",         gradient: "from-blue-600 to-indigo-600",  label: "Create QR"     },
                      { Icon: Eye,    title: "Permissions",        desc: "Control view & download",        gradient: "from-indigo-500 to-violet-600", label: "Manage"        },
                    ].map(({ Icon, title, desc, gradient, label }, i) => (
                      <motion.div key={i} whileHover={{ y: -3 }}
                        className={`group relative rounded-xl p-4 border transition-all duration-500 overflow-hidden ${isDark ? "bg-slate-900/50 border-slate-700/50 hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/10" : "bg-gray-50 border-gray-200 hover:border-cyan-500/40 hover:shadow-lg"}`}>
                        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                        <div className="relative">
                          <div className={`inline-flex bg-gradient-to-br ${gradient} w-9 h-9 sm:w-10 sm:h-10 rounded-xl items-center justify-center mb-3 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                            <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          </div>
                          <h3 className={`font-semibold text-sm mb-1 ${isDark ? "text-white" : "text-gray-900"}`}>{title}</h3>
                          <p className={`text-xs mb-3 ${isDark ? "text-gray-400" : "text-gray-500"}`}>{desc}</p>
                          <button className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r ${gradient} text-white shadow-md hover:scale-105 transition-all duration-300`}>
                            <Plus className="w-3 h-3" />{label}
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Security Monitor */}
              <div className="xl:col-span-4">
                <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.36 }}
                  className={`${card} overflow-hidden xl:sticky xl:top-24`}>
                  <div className="h-[2px] bg-gradient-to-r from-red-500 via-orange-500 to-amber-500" />
                  <div className={`p-4 sm:p-5 border-b ${isDark ? "border-slate-700/50" : "border-gray-200"}`}>
                    <h3 className={`text-sm sm:text-base font-bold flex items-center gap-2.5 ${isDark ? "text-white" : "text-gray-900"}`}>
                      {sectionIcon("from-red-500 to-orange-600", AlertCircle)} Security Monitor
                    </h3>
                    <div className="flex items-center gap-2 mt-2 ml-11">
                      <div className="relative flex">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping absolute" />
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      </div>
                      <span className={`text-xs font-semibold ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>Live</span>
                      <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-semibold ${isDark ? "bg-red-500/15 text-red-400" : "bg-red-50 text-red-500"}`}>
                        {alerts.filter(a => a.type === "suspicious").length} threats
                      </span>
                    </div>
                  </div>
                  {/* ✅ vault-scrollbar */}
                  <div className="p-3 sm:p-4 space-y-2 max-h-72 sm:max-h-80 overflow-y-auto vault-scrollbar">
                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${isDark ? "text-gray-500" : "text-gray-400"}`}>Active Alerts</p>
                    {alerts.map((alert, idx) => (
                      <motion.div key={alert.id}
                        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}
                        className={`p-3 rounded-xl border group transition-all duration-300 hover:-translate-y-0.5 ${
                          alert.type === "suspicious"
                            ? isDark ? "bg-red-500/10 border-red-500/30 hover:border-red-400/50" : "bg-red-50 border-red-200"
                            : isDark ? "bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/40" : "bg-emerald-50 border-emerald-200"
                        }`}>
                        <div className="flex gap-2.5">
                          <div className="flex-shrink-0 mt-0.5">
                            {alert.type === "suspicious"
                              ? <AlertTriangle className={`w-3.5 h-3.5 animate-pulse ${isDark ? "text-red-400" : "text-red-500"}`} />
                              : <CheckCircle className={`w-3.5 h-3.5 ${isDark ? "text-emerald-400" : "text-emerald-600"}`} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-medium leading-snug ${alert.type === "suspicious" ? (isDark ? "text-red-300" : "text-red-700") : isDark ? "text-emerald-300" : "text-emerald-700"}`}>
                              {alert.message}
                            </p>
                            <p className={`text-[10px] mt-1 ${isDark ? "text-gray-500" : "text-gray-400"}`}>{alert.time}</p>
                          </div>
                          <button onClick={() => setAlerts(alerts.filter(a => a.id !== alert.id))}
                            className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <X className={`w-3 h-3 ${isDark ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"}`} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                    {alerts.length === 0 && (
                      <div className="text-center py-6">
                        <CheckCircle className={`w-7 h-7 mx-auto mb-2 ${isDark ? "text-emerald-400" : "text-emerald-500"}`} />
                        <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>All clear</p>
                      </div>
                    )}
                  </div>
                  <div className={`p-4 border-t ${isDark ? "border-slate-700/50" : "border-gray-200"}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-xs font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}>Security Score</span>
                      <span className={`text-xs font-bold ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>98%</span>
                    </div>
                    <div className={`h-2 rounded-full overflow-hidden ${isDark ? "bg-slate-700" : "bg-gray-200"}`}>
                      <motion.div initial={{ width: 0 }} animate={{ width: "98%" }}
                        transition={{ duration: 1.5, ease: "easeOut", delay: 0.6 }}
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" />
                    </div>
                    <p className={`text-[10px] mt-1.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}>Excellent — all encryption active</p>
                  </div>
                </motion.div>
              </div>
            </div>

          </div>
        </div>
      </motion.main>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && selectedFile && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[90] p-4"
            onClick={() => setShowShareModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className={`rounded-2xl w-full max-w-lg shadow-2xl border overflow-hidden ${isDark ? "bg-slate-900/98 border-cyan-500/20" : "bg-white/98 border-cyan-500/30"}`}>
              <div className="h-[2px] bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600" />
              <div className="p-5 sm:p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
                      <Share2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className={`text-base sm:text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Share File</h2>
                      <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"} truncate max-w-[180px] sm:max-w-none`}>{selectedFile.name}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowShareModal(false)} className={`p-2 rounded-xl ${isDark ? "hover:bg-slate-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}>
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-4 sm:space-y-5">
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>Secure Share Link</label>
                    <div className="flex gap-2">
                      <input type="text" value={shareLink} readOnly
                        className={`flex-1 rounded-xl px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-mono border focus:outline-none ${isDark ? "bg-slate-800/60 border-slate-700/50 text-white" : "bg-gray-50 border-gray-200 text-gray-900"}`} />
                      <button onClick={() => copyToClipboard(shareLink)}
                        className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30 hover:scale-105 transition-transform flex-shrink-0">
                        {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>Permissions</label>
                    <div className="space-y-2">
                      {[
                        { key: "view",     label: "View Only",      desc: "Recipients can view the file"     },
                        { key: "download", label: "Allow Download", desc: "Recipients can download the file" },
                      ].map(p => (
                        <label key={p.key} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all ${isDark ? "bg-slate-800/50 border-slate-700/40 hover:border-cyan-500/30" : "bg-gray-50 border-gray-200 hover:border-cyan-500/30"}`}>
                          <input type="checkbox" checked={permissions[p.key]}
                            onChange={e => setPermissions({ ...permissions, [p.key]: e.target.checked })}
                            className="w-4 h-4 accent-cyan-500" />
                          <div>
                            <p className={`font-semibold text-sm ${isDark ? "text-white" : "text-gray-900"}`}>{p.label}</p>
                            <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>{p.desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>Link Expires In</label>
                    <CustomSelect value={shareExpiry} onChange={setShareExpiry}
                      options={["24 hours", "7 days", "30 days", "Never"]} isDark={isDark} />
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setShowShareModal(false)}
                    className={`flex-1 py-2.5 rounded-xl border font-medium text-sm transition-all ${isDark ? "bg-slate-800 border-slate-700 text-white hover:bg-slate-700" : "bg-gray-100 border-gray-200 text-gray-900 hover:bg-gray-200"}`}>
                    Cancel
                  </button>
                  <button className="flex-1 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-[1.02] transition-all duration-300">
                    Generate Link
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/*
        ✅ EXACT copy of FileUpload.jsx <style> block.
           No global overrides. No ::-webkit-scrollbar-button rule.
           4px width alone suppresses arrow buttons natively in webkit.
      */}
      <style>{`
        @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }
        .animate-shimmer { animation: shimmer 2.5s infinite; }
        .vault-scrollbar::-webkit-scrollbar { width: 4px; }
        .vault-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .vault-scrollbar::-webkit-scrollbar-thumb { background: rgba(6,182,212,0.4); border-radius: 2px; }
        .vault-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(6,182,212,0.65); }
      `}</style>
    </div>
  );
};

export default VaultDashboard;