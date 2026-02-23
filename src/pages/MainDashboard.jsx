import { useState, useEffect, useCallback } from "react";
import {
  Shield, FolderOpen, BarChart3, Plus, Search, CheckCircle,
  FileText, TrendingUp, Database, Moon, Sun, Activity, Zap,
  PieChart, Clock, RefreshCw, AlertCircle, Download, Eye,
  Share2, Lock, Archive, Film, Music, Code2, FileSpreadsheet,
  FileImage, Presentation, File
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from '../context/ThemeContext';
import { vaultApi } from '../services/vaultApi';

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ── Per-vault storage cap ─────────────────────────────────────
const PER_VAULT_MB = 500;

// ── File type → icon + color config ──────────────────────────
const FILE_TYPE_CONFIG = {
  PDF:          { color: "#f87171", label: "PDF",          Icon: FileText       },
  Image:        { color: "#a78bfa", label: "Images",       Icon: FileImage      },
  Video:        { color: "#f472b6", label: "Video",        Icon: Film           },
  Audio:        { color: "#a3e635", label: "Audio",        Icon: Music          },
  Archive:      { color: "#22d3ee", label: "Archives",     Icon: Archive        },
  Word:         { color: "#60a5fa", label: "Word",         Icon: FileText       },
  Excel:        { color: "#34d399", label: "Excel",        Icon: FileSpreadsheet},
  Presentation: { color: "#fb923c", label: "Slides",       Icon: Presentation   },
  Code:         { color: "#38bdf8", label: "Code",         Icon: Code2          },
  Text:         { color: "#94a3b8", label: "Text",         Icon: FileText       },
  Other:        { color: "#6366f1", label: "Other",        Icon: File           },
};

const getTypeConfig = (type) =>
  FILE_TYPE_CONFIG[type] || FILE_TYPE_CONFIG.Other;

// ── Helpers ───────────────────────────────────────────────────
const formatMB  = (mb)    => mb >= 1000 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(1)} MB`;
const formatAgo = (ds) => {
  if (!ds) return "—";
  const d = new Date(ds), now = new Date();
  const h = Math.floor((now - d) / 3_600_000);
  if (h < 1)  return "Just now";
  if (h < 24) return `${h}h ago`;
  if (h < 48) return "Yesterday";
  return d.toLocaleDateString();
};

// ── API helper ────────────────────────────────────────────────
const fetchDashboardStats = async () => {
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  if (!token) throw new Error("No auth token");
  const res = await fetch(`${API_BASE_URL}/dashboard/stats`, {
    headers: { Authorization: `Bearer ${token}` },
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
};

/* ══════════════════════════════════════════════════════════════
   SUB-COMPONENTS
══════════════════════════════════════════════════════════════ */

/* Speedometer gauge */
const Speedometer = ({ percentage, isDark }) => {
  const size = 280, r = size / 2 - 22;
  const circ = Math.PI * r;
  const offset = circ - (percentage / 100) * circ;
  const color =
    percentage > 80 ? "#ef4444" : percentage > 55 ? "#f59e0b" : "#10b981";
  return (
    <div className="w-full flex flex-col items-center">
      <svg
        viewBox={`0 0 ${size} ${size / 2 + 50}`}
        className="w-full max-w-xs"
        style={{ height: "auto" }}
      >
        {/* track */}
        <path
          d={`M 22 ${size / 2 + 20} A ${r} ${r} 0 0 1 ${size - 22} ${size / 2 + 20}`}
          fill="none"
          stroke={isDark ? "#1e293b" : "#e5e7eb"}
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* progress */}
        <path
          d={`M 22 ${size / 2 + 20} A ${r} ${r} 0 0 1 ${size - 22} ${size / 2 + 20}`}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)",
            filter: `drop-shadow(0 0 6px ${color})`,
          }}
        />
        {/* centre text */}
        <text
          x={size / 2}
          y={size / 2 - 10}
          textAnchor="middle"
          fontSize="42"
          fontWeight="bold"
          fill={isDark ? "#f8fafc" : "#111827"}
        >
          {Math.round(percentage)}%
        </text>
        <text
          x={size / 2}
          y={size / 2 + 16}
          textAnchor="middle"
          fontSize="16"
          fill={isDark ? "#94a3b8" : "#6b7280"}
        >
          Storage Used
        </text>
        {/* tick labels */}
        <text x={14}        y={size / 2 + 44} fontSize="13" fill={isDark ? "#475569" : "#9ca3af"}>0%</text>
        <text x={size/2-14} y={size / 2 + 44} fontSize="13" fill={isDark ? "#475569" : "#9ca3af"}>50%</text>
        <text x={size-42}   y={size / 2 + 44} fontSize="13" fill={isDark ? "#475569" : "#9ca3af"}>100%</text>
      </svg>
    </div>
  );
};

/* ── Interactive Pie Chart ───────────────────────────────── */
const InteractivePieChart = ({ breakdown, totalFiles, isDark }) => {
  const [hovered, setHovered] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const CX = 130, CY = 130, R = 108, INNER_R = 64;
  const total = totalFiles || 1;

  const slices = [];
  let cumAngle = -Math.PI / 2;
  breakdown.forEach(({ type, count, sizeBytes }) => {
    const cfg   = getTypeConfig(type);
    const angle = (count / total) * 2 * Math.PI;
    slices.push({ type, count, sizeBytes, cfg, startAngle: cumAngle, endAngle: cumAngle + angle, angle });
    cumAngle += angle;
  });

  const polarToXY = (angle, r) => ({
    x: CX + r * Math.cos(angle),
    y: CY + r * Math.sin(angle),
  });

  const makeArc = (slice, expand = false) => {
    const offset = expand ? 8 : 0;
    const midAngle = (slice.startAngle + slice.endAngle) / 2;
    const ox = offset * Math.cos(midAngle);
    const oy = offset * Math.sin(midAngle);
    const start  = polarToXY(slice.startAngle, R);
    const end    = polarToXY(slice.endAngle,   R);
    const iStart = polarToXY(slice.startAngle, INNER_R);
    const iEnd   = polarToXY(slice.endAngle,   INNER_R);
    const large  = slice.angle > Math.PI ? 1 : 0;
    return `M ${start.x + ox} ${start.y + oy}
            A ${R} ${R} 0 ${large} 1 ${end.x + ox} ${end.y + oy}
            L ${iEnd.x + ox} ${iEnd.y + oy}
            A ${INNER_R} ${INNER_R} 0 ${large} 0 ${iStart.x + ox} ${iStart.y + oy}
            Z`;
  };

  const hoveredSlice = slices.find(s => s.type === hovered);

  return (
    <div className="flex flex-row items-center gap-4 w-full">
      {/* SVG chart */}
      <div className="relative flex-shrink-0" style={{ width: 260, height: 260 }}>
        <svg
          width={260} height={260}
          viewBox="0 0 260 260"
          style={{ overflow: "visible" }}
        >
          <defs>
            {slices.map(s => (
              <filter key={s.type} id={`glow-${s.type}`} x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            ))}
          </defs>

          {slices.map((slice) => {
            const isHov = hovered === slice.type;
            return (
              <path
                key={slice.type}
                d={makeArc(slice, isHov)}
                fill={slice.cfg.color}
                opacity={hovered && !isHov ? 0.3 : 1}
                filter={isHov ? `url(#glow-${slice.type})` : undefined}
                stroke={isDark ? "#0f172a" : "#ffffff"}
                strokeWidth="2.5"
                style={{
                  transition: "opacity 0.2s ease",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  setHovered(slice.type);
                  const rect = e.currentTarget.closest("svg").getBoundingClientRect();
                  setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                }}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.closest("svg").getBoundingClientRect();
                  setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                }}
                onMouseLeave={() => setHovered(null)}
              />
            );
          })}

          {/* Centre */}
          {hoveredSlice ? (
            <>
              <text x={CX} y={CY - 14} textAnchor="middle" fontSize="26" fontWeight="700"
                fill={hoveredSlice.cfg.color}>{hoveredSlice.count}</text>
              <text x={CX} y={CY + 8} textAnchor="middle" fontSize="13"
                fill={isDark ? "#94a3b8" : "#6b7280"}>{hoveredSlice.cfg.label}</text>
              <text x={CX} y={CY + 26} textAnchor="middle" fontSize="14" fontWeight="600"
                fill={isDark ? "#cbd5e1" : "#475569"}>
                {((hoveredSlice.count / total) * 100).toFixed(1)}%
              </text>
            </>
          ) : (
            <>
              <text x={CX} y={CY - 8} textAnchor="middle" fontSize="32" fontWeight="700"
                fill={isDark ? "#f8fafc" : "#111827"}>{totalFiles}</text>
              <text x={CX} y={CY + 16} textAnchor="middle" fontSize="13"
                fill={isDark ? "#64748b" : "#9ca3af"}>files</text>
            </>
          )}
        </svg>

        {/* Tooltip */}
        {hoveredSlice && (
          <div
            className="pointer-events-none absolute z-50 px-3 py-2.5 rounded-xl border shadow-2xl text-xs whitespace-nowrap"
            style={{
              left: tooltipPos.x + 16,
              top:  tooltipPos.y - 44,
              background: isDark ? "rgba(15,23,42,0.97)" : "rgba(255,255,255,0.97)",
              borderColor: hoveredSlice.cfg.color + "55",
              boxShadow: `0 4px 24px ${hoveredSlice.cfg.color}33`,
            }}
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: hoveredSlice.cfg.color }} />
              <span className={`font-bold text-sm ${isDark ? "text-white" : "text-gray-900"}`}>{hoveredSlice.cfg.label}</span>
            </div>
            <div className={`space-y-0.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              <div>{hoveredSlice.count} file{hoveredSlice.count !== 1 ? "s" : ""}</div>
              <div>{formatMB(hoveredSlice.sizeBytes / (1024 * 1024))}</div>
              <div className="font-semibold" style={{ color: hoveredSlice.cfg.color }}>
                {((hoveredSlice.count / total) * 100).toFixed(1)}% of total
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex-1 w-full grid grid-cols-2 gap-x-2 px-2 gap-y-1 max-h-[260px] overflow-y-auto dash-scrollbar">
        {slices.map((slice) => {
          const pct  = ((slice.count / total) * 100).toFixed(1);
          const isHov = hovered === slice.type;
          return (
            <div
              key={slice.type}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl cursor-default transition-all duration-200 ${
                isHov
                  ? isDark ? "bg-slate-700/70 scale-[1.02]" : "bg-gray-100 scale-[1.02]"
                  : isDark ? "hover:bg-slate-700/40" : "hover:bg-gray-50"
              }`}
              onMouseEnter={() => setHovered(slice.type)}
              onMouseLeave={() => setHovered(null)}
            >
              <div
                className="w-3 h-3 rounded-full flex-shrink-0 transition-all duration-200"
                style={{
                  background: slice.cfg.color,
                  boxShadow: isHov ? `0 0 8px ${slice.cfg.color}` : "none",
                  transform: isHov ? "scale(1.5)" : "scale(1)",
                }}
              />
              <div className="min-w-0">
                <p className={`text-xs font-semibold truncate leading-tight ${isDark ? "text-gray-200" : "text-gray-700"}`}>
                  {slice.cfg.label}
                </p>
                <p className={`text-[11px] leading-tight ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                  {slice.count} file{slice.count !== 1 ? "s" : ""} · {pct}%
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* Vault-level storage bar */
const VaultStorageBar = ({ usedMB, limitMB, isDark }) => {
  const pct = Math.min((usedMB / limitMB) * 100, 100);
  const color =
    pct > 80 ? "#ef4444" : pct > 55 ? "#f59e0b" : "#10b981";
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1">
        <span className={isDark ? "text-gray-400" : "text-gray-500"}>
          {formatMB(usedMB)} / {formatMB(limitMB)}
        </span>
        <span style={{ color }}>{pct.toFixed(1)}%</span>
      </div>
      <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? "bg-slate-700" : "bg-gray-200"}`}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════ */
const MainDashboard = () => {
  const navigate  = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const [stats,         setStats]         = useState(null);
  const [selectedVault, setSelectedVault] = useState(null);
  const [search,        setSearch]        = useState("");
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [refreshing,    setRefreshing]    = useState(false);

  const loadStats = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchDashboardStats();
      setStats(data);
      // auto-select first vault if none chosen
      if (!selectedVault && data.vaults?.length > 0) {
        setSelectedVault(data.vaults[0]);
      }
    } catch (err) {
      if (
        !err.message?.includes("Session expired") &&
        !err.message?.includes("Authentication")
      ) {
        setError(err.message || "Failed to load dashboard");
      }
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line

  useEffect(() => {
    const validate = async () => {
      const result = await vaultApi.validateToken();
      if (!result?.valid) navigate("/login");
    };
    validate();
    loadStats();
  }, [navigate, loadStats]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  // ── Derived values ───────────────────────────────────────
  const storage     = stats?.storage  || {};
  const totals      = stats?.totals   || {};
  const vaults      = stats?.vaults   || [];
  const breakdown   = stats?.fileTypeBreakdown || [];
  const activity    = stats?.recentActivity    || [];

  const filteredVaults = vaults.filter((v) =>
    v.name.toLowerCase().includes(search.toLowerCase())
  );

  // Vault-level storage speedometer data
  const selectedStoragePct = selectedVault?.storagePercent ?? 0;

  /* ── Loading ── */
  if (loading)
    return (
      <div className={`h-screen flex items-center justify-center ${isDark ? "bg-slate-900" : "bg-gray-50"}`}>
        <div className="text-center">
          <RefreshCw className={`w-12 h-12 ${isDark ? "text-cyan-400" : "text-cyan-600"} animate-spin mx-auto mb-4`} />
          <p className={`text-lg ${isDark ? "text-white" : "text-gray-900"}`}>
            Loading your dashboard…
          </p>
        </div>
      </div>
    );

  /* ── Error ── */
  if (error)
    return (
      <div className={`h-screen flex items-center justify-center ${isDark ? "bg-slate-900" : "bg-gray-50"}`}>
        <div className="text-center">
          <AlertCircle className={`w-12 h-12 ${isDark ? "text-red-400" : "text-red-600"} mx-auto mb-4`} />
          <p className={`text-lg ${isDark ? "text-white" : "text-gray-900"} mb-2`}>
            Failed to load dashboard
          </p>
          <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"} mb-4`}>{error}</p>
          <button
            onClick={loadStats}
            className={`px-4 py-2 rounded-lg ${isDark ? "bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30" : "bg-cyan-500/10 text-cyan-600 hover:bg-cyan-500/20"} transition-colors`}
          >
            Try Again
          </button>
        </div>
      </div>
    );

  /* ══════════════════════════════════════
     MAIN RENDER
  ══════════════════════════════════════ */
  return (
    <div
      className={`h-screen overflow-hidden transition-colors duration-500 ${
        isDark
          ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
          : "bg-gradient-to-br from-gray-50 via-white to-gray-100"
      }`}
    >
      {/* Ambient blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className={`absolute top-1/4 -left-1/4 w-96 h-96 ${isDark ? "bg-cyan-500/5" : "bg-cyan-500/3"} rounded-full blur-3xl animate-pulse`} />
        <div className={`absolute bottom-1/4 -right-1/4 w-96 h-96 ${isDark ? "bg-blue-600/5" : "bg-blue-600/3"} rounded-full blur-3xl animate-pulse`} style={{ animationDelay: "1s" }} />
        <div className={`absolute top-1/2 left-1/2 w-96 h-96 ${isDark ? "bg-indigo-500/3" : "bg-indigo-500/2"} rounded-full blur-3xl animate-pulse`} style={{ animationDelay: "0.5s" }} />
      </div>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        aria-label="Toggle theme"
        className={`fixed top-4 right-4 sm:top-6 sm:right-6 z-50 p-2.5 sm:p-3 rounded-xl border shadow-lg transition-all duration-300 group ${
          isDark
            ? "bg-slate-800 hover:bg-slate-700 border-slate-700"
            : "bg-white hover:bg-gray-100 border-gray-200"
        }`}
      >
        {isDark ? (
          <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 group-hover:rotate-90 transition-transform duration-500" />
        ) : (
          <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 group-hover:-rotate-12 transition-transform duration-500" />
        )}
      </button>

      {/* ── Single scroll container ── */}
      <div className="h-full overflow-y-auto overflow-x-hidden dash-scrollbar relative z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8">

          {/* Page header */}
          <div className="mb-6 sm:mb-8 flex items-start sm:items-center justify-between gap-3 pr-12 sm:pr-16">
            <div>
              <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-bold ${isDark ? "text-white" : "text-gray-900"} mb-1 flex items-center gap-2 sm:gap-3 flex-wrap`}>
                <div className={`p-2 sm:p-3 rounded-xl border flex-shrink-0 ${
                  isDark
                    ? "bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border-cyan-500/30"
                    : "bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border-cyan-500/40"
                }`}>
                  <Activity className={`w-5 h-5 sm:w-7 sm:h-7 ${isDark ? "text-cyan-400" : "text-cyan-600"}`} />
                </div>
                Main Dashboard
              </h1>
              <p className={`text-xs sm:text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                Live vault analytics · {totals.vaults ?? 0} vault{totals.vaults !== 1 ? "s" : ""} · {formatMB(storage.totalStorageMB ?? 0)} total capacity
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              aria-label="Refresh"
              className={`flex-shrink-0 p-2.5 sm:p-3 rounded-xl border shadow-lg transition-all duration-300 group ${
                isDark
                  ? "bg-slate-800 hover:bg-slate-700 border-slate-700"
                  : "bg-white hover:bg-gray-100 border-gray-200"
              }`}
            >
              <RefreshCw
                className={`w-4 h-4 sm:w-5 sm:h-5 ${isDark ? "text-cyan-400" : "text-cyan-600"} ${
                  refreshing ? "animate-spin" : "group-hover:rotate-180"
                } transition-transform duration-500`}
              />
            </button>
          </div>

          {/* ── Summary stat cards ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            {[
              {
                label: "Total Vaults",
                value: totals.vaults ?? 0,
                sub:   "Active",
                Icon:  Shield,
                gradient: "from-cyan-500 to-blue-600",
              },
              {
                label: "Total Files",
                value: totals.files ?? 0,
                sub:   `${totals.encrypted ?? 0} encrypted`,
                Icon:  FileText,
                gradient: "from-blue-500 to-indigo-600",
              },
              {
                label: "Storage Used",
                value: formatMB(storage.usedMB ?? 0),
                sub:   `${storage.percentUsed ?? 0}% of ${formatMB(storage.totalStorageMB ?? 0)}`,
                Icon:  Database,
                gradient: "from-indigo-500 to-violet-600",
              },
              {
                label: "Shared Files",
                value: totals.shared ?? 0,
                sub:   `${totals.views ?? 0} total views`,
                Icon:  Share2,
                gradient: "from-emerald-500 to-teal-600",
              },
            ].map(({ label, value, sub, Icon, gradient }, i) => (
              <div
                key={i}
                className={`group rounded-2xl border p-4 sm:p-5 hover:scale-[1.02] transition-all duration-300 shadow-lg relative overflow-hidden ${
                  isDark
                    ? "bg-slate-800/50 border-slate-700/50"
                    : "bg-white/80 border-gray-200"
                }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                <div className="relative flex items-start justify-between mb-2 sm:mb-3">
                  <div className={`p-2 sm:p-2.5 rounded-xl bg-gradient-to-br ${gradient} shadow-md group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <TrendingUp className={`w-3.5 h-3.5 ${isDark ? "text-gray-600" : "text-gray-300"}`} />
                </div>
                <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"} mb-0.5`}>{label}</p>
                <p className={`text-xl sm:text-3xl font-bold ${isDark ? "text-white" : "text-gray-900"} truncate`}>{value}</p>
                <p className={`text-[10px] sm:text-xs mt-1 ${isDark ? "text-gray-500" : "text-gray-400"}`}>{sub}</p>
              </div>
            ))}
          </div>

          {/* ── Vault list + vault analytics ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 mb-8 sm:mb-12">

            {/* LEFT — vault list */}
            <div className="lg:col-span-4">
              <div
                className={`flex flex-col rounded-2xl border shadow-xl transition-colors duration-300 ${
                  isDark ? "bg-slate-800/50 border-slate-700/50" : "bg-white/80 border-gray-200"
                }`}
                style={{ height: "clamp(320px,60vh,560px)" }}
              >
                {/* search header */}
                <div className={`flex-shrink-0 px-3 sm:px-4 pt-3 sm:pt-4 pb-3 border-b ${isDark ? "border-slate-700/50" : "border-gray-200"}`}>
                  <p className={`font-semibold mb-3 flex items-center justify-between ${isDark ? "text-white" : "text-gray-900"}`}>
                    <span className="flex items-center gap-2">
                      <Shield className={`w-4 h-4 sm:w-5 sm:h-5 ${isDark ? "text-cyan-400" : "text-cyan-600"}`} />
                      Your Vaults
                    </span>
                    <span className={`text-xs sm:text-sm px-2.5 py-0.5 rounded-full bg-cyan-500/10 ${isDark ? "text-cyan-400" : "text-cyan-600"}`}>
                      {filteredVaults.length}
                    </span>
                  </p>
                  <div className="relative">
                    <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? "text-gray-400" : "text-gray-500"}`} />
                    <input
                      type="text"
                      placeholder="Search vaults…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className={`w-full pl-9 pr-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors ${
                        isDark
                          ? "bg-slate-700/50 border-slate-600/50 text-white placeholder-gray-400"
                          : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500"
                      }`}
                    />
                  </div>
                </div>

                {/* vault list */}
                <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden dash-scrollbar px-2 sm:px-3 py-2 sm:py-3">
                  {filteredVaults.length === 0 ? (
                    <div className="text-center mt-8 px-4">
                      <FolderOpen className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 ${isDark ? "text-gray-400" : "text-gray-300"}`} />
                      <p className={`text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                        {search ? "No matching vaults" : "No vaults created yet"}
                      </p>
                      {!search && (
                        <button
                          onClick={() => navigate("/vaults")}
                          className={`mt-4 px-4 py-2 rounded-lg text-sm transition-colors ${
                            isDark ? "bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30" : "bg-cyan-500/10 text-cyan-600 hover:bg-cyan-500/20"
                          }`}
                        >
                          Create Your First Vault
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1.5 sm:space-y-2">
                      {filteredVaults.map((vault) => {
                        const isSelected = selectedVault?.id === vault.id;
                        return (
                          <div
                            key={vault.id}
                            onClick={() => setSelectedVault(vault)}
                            className={`flex flex-col gap-1.5 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl cursor-pointer border transition-all duration-300 ${
                              isSelected
                                ? isDark
                                  ? "bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border-cyan-500/50 shadow-lg shadow-cyan-500/20"
                                  : "bg-gradient-to-r from-cyan-500/5 to-blue-600/5 border-cyan-500/50 shadow-lg shadow-cyan-500/10"
                                : isDark
                                ? "border-transparent hover:bg-slate-700/50"
                                : "border-transparent hover:bg-gray-50"
                            }`}
                          >
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 transition-colors duration-300 ${isSelected ? "bg-cyan-500/20" : isDark ? "bg-slate-700" : "bg-gray-100"}`}>
                                <Shield className={`w-4 h-4 sm:w-5 sm:h-5 ${isSelected ? "text-cyan-400" : isDark ? "text-cyan-400" : "text-cyan-600"}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`font-medium text-sm truncate ${isDark ? "text-white" : "text-gray-900"}`}>{vault.name}</p>
                                <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                                  {vault.fileCount} file{vault.fileCount !== 1 ? "s" : ""} · {formatMB(vault.storageUsedMB)}
                                  {vault.hasPassword && (
                                    <span className="ml-1.5 inline-flex items-center gap-0.5 text-amber-400">
                                      <Lock className="w-2.5 h-2.5" />
                                    </span>
                                  )}
                                </p>
                              </div>
                              {isSelected && <CheckCircle className="w-4 h-4 text-emerald-400 animate-pulse flex-shrink-0" />}
                            </div>
                            {/* per-vault mini storage bar */}
                            <VaultStorageBar
                              usedMB={vault.storageUsedMB}
                              limitMB={vault.storageLimitMB}
                              isDark={isDark}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* footer CTA */}
                <div className={`flex-shrink-0 p-3 sm:p-4 border-t ${isDark ? "border-slate-700/50" : "border-gray-200"}`}>
                  <button
                    onClick={() => navigate("/vaults")}
                    className={`w-full flex items-center justify-center gap-2 py-2 sm:py-2.5 rounded-xl border font-semibold text-sm text-cyan-400 transition-all duration-300 hover:scale-105 ${
                      isDark
                        ? "bg-gradient-to-r from-cyan-500/10 to-blue-600/10 hover:from-cyan-500/20 hover:to-blue-600/20 border-cyan-500/30"
                        : "bg-gradient-to-r from-cyan-500/10 to-blue-600/10 hover:from-cyan-500/20 hover:to-blue-600/20 border-cyan-500/40"
                    }`}
                  >
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5" /> Open Vault Selector
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT — vault analytics */}
            <div className="lg:col-span-8">
              <div
                className={`flex flex-col rounded-2xl border shadow-xl transition-colors duration-300 ${
                  isDark ? "bg-slate-800/50 border-slate-700/50" : "bg-white/80 border-gray-200"
                }`}
                style={{ height: "clamp(320px,60vh,560px)" }}
              >
                <div className={`flex-shrink-0 px-4 sm:px-6 pt-4 sm:pt-5 pb-3 border-b rounded-t-2xl backdrop-blur-sm ${isDark ? "bg-slate-800/95 border-slate-700/50" : "bg-white/95 border-gray-100"}`}>
                  <h2 className={`text-lg sm:text-xl font-bold flex items-center gap-2 ${isDark ? "text-white" : "text-gray-900"}`}>
                    <div className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 ${isDark ? "bg-cyan-500/20" : "bg-cyan-500/10"}`}>
                      <BarChart3 className={`w-5 h-5 sm:w-6 sm:h-6 ${isDark ? "text-cyan-400" : "text-cyan-600"}`} />
                    </div>
                    Vault Analytics
                    {selectedVault && (
                      <span className={`ml-1 text-xs sm:text-sm font-normal truncate max-w-[110px] sm:max-w-xs ${isDark ? "text-cyan-400" : "text-cyan-600"}`}>
                        — {selectedVault.name}
                      </span>
                    )}
                  </h2>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden dash-scrollbar px-4 sm:px-6 py-4 sm:py-5">
                  {!selectedVault ? (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                      <Database className={`w-12 h-12 sm:w-16 sm:h-16 mb-4 ${isDark ? "text-gray-600" : "text-gray-300"}`} />
                      <p className={`text-base sm:text-lg font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                        No vault selected
                      </p>
                      <p className={`text-xs sm:text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                        Select a vault from the left panel to view analytics
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4 sm:space-y-6">
                      {/* Speedometer */}
                      <div className={`rounded-xl p-4 sm:p-6 ${isDark ? "bg-slate-900/50" : "bg-gray-50"}`}>
                        <p className={`text-base sm:text-lg font-semibold text-center mb-3 ${isDark ? "text-white" : "text-gray-900"}`}>
                          Storage Utilization
                        </p>
                        <Speedometer percentage={selectedStoragePct} isDark={isDark} />
                        <p className={`text-center text-xs sm:text-sm mt-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                          {formatMB(selectedVault.storageUsedMB)} of {formatMB(selectedVault.storageLimitMB)} used
                        </p>
                      </div>

                      {/* Stat cards */}
                      <div className="grid grid-cols-3 gap-2 sm:gap-4">
                        {[
                          { label: "Files",     value: selectedVault.fileCount,          Icon: FileText, border: "border-cyan-500/20",    text: isDark ? "text-cyan-400"    : "text-cyan-600"    },
                          { label: "Protected", value: selectedVault.hasPassword ? "Yes" : "No", Icon: Zap, border: "border-yellow-500/20", text: isDark ? "text-yellow-400"  : "text-yellow-600"  },
                          { label: "Status",    value: "Active",                          Icon: Activity, border: "border-emerald-500/20", text: isDark ? "text-emerald-400" : "text-emerald-600" },
                        ].map(({ label, value, Icon, border, text }) => (
                          <div
                            key={label}
                            className={`${isDark ? "bg-slate-900/50" : "bg-gray-50"} border ${border} rounded-xl p-3 sm:p-5 hover:scale-105 transition-transform duration-300`}
                          >
                            <div className="flex items-center justify-between mb-1 sm:mb-2">
                              <p className={`text-[10px] sm:text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>{label}</p>
                              <Icon className={`w-3.5 h-3.5 sm:w-5 sm:h-5 ${text}`} />
                            </div>
                            <p className={`text-base sm:text-2xl font-bold truncate ${isDark ? "text-white" : "text-gray-900"}`}>{value}</p>
                          </div>
                        ))}
                      </div>

                      {/* Vault details */}
                      <div className={`rounded-xl p-4 sm:p-6 ${isDark ? "bg-slate-900/50" : "bg-gray-50"}`}>
                        <p className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
                          Vault Details
                        </p>
                        <div className="space-y-2 sm:space-y-3">
                          <div className="flex justify-between gap-4">
                            <span className={`text-xs sm:text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>Created</span>
                            <span className={`text-xs sm:text-sm font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                              {new Date(selectedVault.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className={`text-xs sm:text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>Last Accessed</span>
                            <span className={`text-xs sm:text-sm font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                              {formatAgo(selectedVault.lastAccessed)}
                            </span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className={`text-xs sm:text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>Capacity</span>
                            <span className={`text-xs sm:text-sm font-medium ${isDark ? "text-white" : "text-gray-900"}`}>
                              {formatMB(selectedVault.storageLimitMB)}
                            </span>
                          </div>
                          {selectedVault.description && (
                            <div>
                              <span className={`text-xs sm:text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>Description</span>
                              <p className={`text-xs sm:text-sm mt-1 ${isDark ? "text-white" : "text-gray-900"}`}>{selectedVault.description}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Account overview heading ── */}
          <div className="mb-5 sm:mb-8">
            <h2 className={`text-xl sm:text-2xl lg:text-3xl font-bold mb-1 flex items-center gap-2 sm:gap-3 ${isDark ? "text-white" : "text-gray-900"}`}>
              <div className={`p-2 rounded-xl flex-shrink-0 ${isDark ? "bg-gradient-to-br from-indigo-500/20 to-purple-600/20" : "bg-gradient-to-br from-indigo-500/10 to-purple-600/10"}`}>
                <TrendingUp className={`w-5 h-5 sm:w-6 sm:h-6 ${isDark ? "text-indigo-400" : "text-indigo-600"}`} />
              </div>
              Account Overview
            </h2>
            <p className={`text-xs sm:text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
              Cumulative analytics across your entire vault ecosystem
            </p>
          </div>

          {/* ── Storage + file type side-by-side ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">

            {/* Account storage speedometer */}
            <div className={`rounded-2xl border p-4 sm:p-8 shadow-xl transition-colors duration-300 ${isDark ? "bg-slate-800/50 border-slate-700/50" : "bg-white/80 border-gray-200"}`}>
              <div className="flex items-center gap-2 mb-4 sm:mb-6">
                <Database className={`w-5 h-5 sm:w-6 sm:h-6 ${isDark ? "text-cyan-400" : "text-cyan-600"}`} />
                <p className={`text-base sm:text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>Total Storage Capacity</p>
              </div>
              <p className={`text-xs sm:text-sm text-center mb-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                {totals.vaults ?? 0} vault{totals.vaults !== 1 ? "s" : ""} × {PER_VAULT_MB} MB = <strong>{formatMB(storage.totalStorageMB ?? 0)}</strong> total
              </p>
              <div className="py-2 sm:py-4">
                <Speedometer percentage={storage.percentUsed ?? 0} isDark={isDark} />
              </div>

              {/* thin progress bar */}
              <div className="px-2 mb-4 sm:mb-6">
                <div className={`h-[3px] rounded-full overflow-hidden ${isDark ? "bg-slate-700" : "bg-gray-200"}`}>
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 transition-all duration-700"
                    style={{ width: `${Math.min(storage.percentUsed ?? 0, 100)}%` }}
                  />
                </div>
              </div>

              <div className="mt-0 grid grid-cols-3 gap-3 sm:gap-4">
                {[
                  { label: "Used",      value: formatMB(storage.usedMB ?? 0),      color: isDark ? "text-cyan-400"    : "text-cyan-600"    },
                  { label: "Free",      value: formatMB(storage.remainingMB ?? 0), color: isDark ? "text-emerald-400" : "text-emerald-600" },
                  { label: "Capacity",  value: formatMB(storage.totalStorageMB ?? 0), color: isDark ? "text-indigo-400" : "text-indigo-600" },
                ].map(({ label, value, color }) => (
                  <div key={label} className={`rounded-lg p-3 sm:p-4 text-center ${isDark ? "bg-slate-900/50" : "bg-gray-50"}`}>
                    <p className={`text-xs sm:text-sm mb-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>{label}</p>
                    <p className={`text-sm sm:text-xl font-bold ${color}`}>{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* File type breakdown — interactive pie chart */}
            <div className={`rounded-2xl border p-4 sm:p-5 shadow-xl transition-colors duration-300 ${isDark ? "bg-slate-800/50 border-slate-700/50" : "bg-white/80 border-gray-200"}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <PieChart className={`w-5 h-5 ${isDark ? "text-purple-400" : "text-purple-600"}`} />
                  <p className={`text-base font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>File Types</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${isDark ? "bg-slate-700 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
                  {totals.files ?? 0} total
                </span>
              </div>

              {breakdown.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48">
                  <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>No files yet</p>
                </div>
              ) : (
                <InteractivePieChart
                  breakdown={breakdown}
                  totalFiles={totals.files ?? 0}
                  isDark={isDark}
                />
              )}
            </div>
          </div>

          {/* ── Recent activity ── */}
          <div className={`rounded-2xl border p-4 sm:p-8 shadow-xl transition-colors duration-300 mb-6 ${isDark ? "bg-slate-800/50 border-slate-700/50" : "bg-white/80 border-gray-200"}`}>
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <Clock className={`w-5 h-5 sm:w-6 sm:h-6 ${isDark ? "text-blue-400" : "text-blue-600"}`} />
              <p className={`text-base sm:text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>Recent Activity</p>
            </div>

            {activity.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                  No activity yet. Upload files to get started!
                </p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {activity.map((item, i) => {
                  const cfg      = getTypeConfig(item.fileType);
                  const TypeIcon = cfg.Icon;
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl transition-colors duration-300 ${isDark ? "bg-slate-900/50 hover:bg-slate-900/70" : "bg-gray-50 hover:bg-gray-100"}`}
                    >
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: cfg.color + "22" }}>
                        <TypeIcon className="w-4 h-4" style={{ color: cfg.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-sm truncate ${isDark ? "text-white" : "text-gray-900"}`}>{item.label}</p>
                        <p className={`text-[10px] sm:text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                          {item.vaultName} · {formatMB((item.sizeBytes || 0) / (1024 * 1024))}
                          {item.isEncrypted && (
                            <span className="ml-1.5 inline-flex items-center gap-0.5 text-emerald-400">
                              <Lock className="w-2.5 h-2.5" />
                              Encrypted
                            </span>
                          )}
                        </p>
                      </div>
                      <span className={`text-[10px] sm:text-xs flex-shrink-0 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                        {formatAgo(item.timestamp)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>

      <style>{`
        .dash-scrollbar::-webkit-scrollbar       { width: 4px; }
        .dash-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .dash-scrollbar::-webkit-scrollbar-thumb { background: rgba(6,182,212,0.4); border-radius: 2px; }
        .dash-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(6,182,212,0.65); }
      `}</style>
    </div>
  );
};

export default MainDashboard;