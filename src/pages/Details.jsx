import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Download,
  Trash2,
  Lock,
  Clock,
  User,
  FileText,
  Eye,
  Copy,
  CheckCircle,
  AlertCircle,
  Shield,
  Calendar,
  HardDrive,
  Activity,
  Tag,
  Folder,
  TrendingUp,
  Upload,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useVault } from "../context/VaultContext";
import VaultTopBar from "../components/layout/VaultTopBar";
import HamburgerMenu from "../components/layout/HamburgerMenu";
import Toast from "../components/layout/Toast";
import { useToast } from "../hooks/useToast";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const getAuthToken = () =>
  localStorage.getItem("token") || sessionStorage.getItem("token");

// ─── SectionIcon ──────────────────────────────────────────────────────────────
const SectionIcon = ({ gradient, Icon }) => (
  <div className={`w-9 h-9 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}>
    <Icon className="w-4 h-4 text-white" />
  </div>
);

// ─── DetailItem ───────────────────────────────────────────────────────────────
const DetailItem = ({ icon: Icon, label, value, isDark }) => (
  <div className={`p-4 rounded-xl border transition-all duration-300 ${
    isDark
      ? "bg-slate-900/50 border-slate-700/50 hover:border-cyan-500/30"
      : "bg-gray-50 border-gray-200 hover:border-cyan-300"
  }`}>
    <div className={`flex items-center gap-2 mb-1.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
      <Icon className="w-4 h-4" />
      <p className="text-[10px] font-bold uppercase tracking-widest">{label}</p>
    </div>
    <p className={`text-sm font-semibold truncate ${isDark ? "text-white" : "text-gray-900"}`}>
      {value || "—"}
    </p>
  </div>
);

// ─── StatusBadge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ label, value, status, isDark }) => {
  const colors = {
    secure:   isDark ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-emerald-50 text-emerald-600 border-emerald-200",
    locked:   isDark ? "bg-amber-500/10  text-amber-400  border-amber-500/20"     : "bg-amber-50  text-amber-600  border-amber-200",
    unlocked: isDark ? "bg-cyan-500/10   text-cyan-400   border-cyan-500/20"      : "bg-cyan-50   text-cyan-600   border-cyan-200",
    info:     isDark ? "bg-violet-500/10 text-violet-400 border-violet-500/20"    : "bg-violet-50 text-violet-600 border-violet-200",
  };
  return (
    <div className={`flex items-center justify-between p-3 rounded-xl border ${
      isDark ? "bg-slate-900/50 border-slate-700/50" : "bg-gray-50 border-gray-200"
    }`}>
      <p className={`text-xs font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}>{label}</p>
      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${colors[status] || colors.info}`}>
        {value}
      </span>
    </div>
  );
};

// ─── StatCard ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, gradient, isDark }) => (
  <motion.div
    whileHover={{ y: -3 }}
    className={`p-4 rounded-xl border transition-all duration-300 ${
      isDark ? "bg-slate-900/50 border-slate-700/50" : "bg-gray-50 border-gray-200"
    }`}
  >
    <div className={`w-9 h-9 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-md mb-3`}>
      <Icon className="w-4 h-4 text-white" />
    </div>
    <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
      {label}
    </p>
    <p className={`text-lg font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
      {value ?? "—"}
    </p>
  </motion.div>
);

// ─── Skeleton loader ──────────────────────────────────────────────────────────
const Skeleton = ({ isDark, className = "" }) => (
  <div className={`animate-pulse rounded-xl ${isDark ? "bg-slate-700/50" : "bg-gray-200"} ${className}`} />
);

/* ══════════════════════════════════════════════════════════════════════════ */
const Details = ({ item = null, onBack = null }) => {
  const { isDark } = useTheme();
  const { activeVault } = useVault();
  const { toast, showSuccess, showError, hideToast } = useToast();

  const [vaultDetails,    setVaultDetails]    = useState(null);
  const [activity,        setActivity]        = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  const [error,           setError]           = useState(null);
  const [copied,          setCopied]          = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading,   setDeleteLoading]   = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [mousePosition,   setMousePosition]   = useState({ x: 0, y: 0 });

  const SIDEBAR_COLLAPSED = 60;
  const SIDEBAR_EXPANDED  = 220;
  const sidebarW = sidebarExpanded ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED;

  const vaultId = item?.id || activeVault?.id;

  useEffect(() => {
    const h = (e) => setSidebarExpanded(e.detail.expanded);
    window.addEventListener("sidebarToggle", h);
    return () => window.removeEventListener("sidebarToggle", h);
  }, []);

  useEffect(() => {
    const h = (e) => setMousePosition({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", h);
    return () => window.removeEventListener("mousemove", h);
  }, []);

  // ── Fetch vault details ────────────────────────────────────────────────────
  const fetchDetails = useCallback(async () => {
    if (!vaultId) return;
    setLoading(true);
    setError(null);
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE_URL}/vaults/${vaultId}/details`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to load vault details");
      }
      const data = await res.json();
      setVaultDetails(data);
    } catch (e) {
      setError(e.message);
      showError(e.message);
    } finally {
      setLoading(false);
    }
  }, [vaultId]);

  // ── Fetch activity ─────────────────────────────────────────────────────────
  const fetchActivity = useCallback(async () => {
    if (!vaultId) return;
    setActivityLoading(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE_URL}/vaults/${vaultId}/activity`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load activity");
      const data = await res.json();
      setActivity(data.activity || []);
    } catch (e) {
      console.warn("Activity fetch failed:", e.message);
    } finally {
      setActivityLoading(false);
    }
  }, [vaultId]);

  useEffect(() => {
    fetchDetails();
    fetchActivity();
  }, [fetchDetails, fetchActivity]);

  // ── Copy vault ID ──────────────────────────────────────────────────────────
  const handleCopyId = () => {
    navigator.clipboard.writeText(String(vaultId));
    setCopied(true);
    showSuccess("Vault ID copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Export vault info ──────────────────────────────────────────────────────
  const handleExport = async () => {
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE_URL}/vaults/${vaultId}/export-info`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `airvault-${vaultDetails?.vault?.name || "vault"}-export.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showSuccess("Vault info exported successfully");
    } catch (e) {
      showError(e.message || "Export failed");
    }
  };

  // ── Delete vault ───────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE_URL}/vaults/${vaultId}/permanent`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Delete failed");
      }
      showSuccess("Vault permanently deleted");
      setShowDeleteModal(false);
      setTimeout(() => onBack?.(), 1200);
    } catch (e) {
      showError(e.message || "Failed to delete vault");
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Card style ─────────────────────────────────────────────────────────────
  const card = `rounded-2xl border backdrop-blur-xl shadow-xl transition-all duration-300 ${
    isDark ? "bg-slate-800/50 border-slate-700/50" : "bg-white/80 border-gray-200"
  }`;

  // ── No vault guard ─────────────────────────────────────────────────────────
  if (!activeVault && !item) {
    return (
      <div className={`h-screen w-full flex items-center justify-center ${
        isDark
          ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
          : "bg-gradient-to-br from-gray-50 via-white to-gray-100"
      }`}>
        <div className="text-center px-6">
          <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-cyan-500/30">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <p className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>No vault selected</p>
          <p className={`text-sm mt-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>Select a vault to view details.</p>
        </div>
      </div>
    );
  }

  const vault = vaultDetails?.vault;
  const stats = vaultDetails?.stats;
  const owner = vaultDetails?.owner;
  const categories = vaultDetails?.categoryBreakdown || [];

  /* ═══════════════════════════════════════════════ RENDER ══ */
  return (
    <div className={`h-screen w-full overflow-hidden transition-colors duration-500 ${
      isDark
        ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
        : "bg-gradient-to-br from-gray-50 via-white to-gray-100"
    }`}>

      {/* Ambient blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-1/4 -left-1/4 w-96 h-96 ${isDark ? "bg-cyan-500/5" : "bg-cyan-500/3"} rounded-full blur-3xl animate-pulse`} />
        <div className={`absolute bottom-1/4 -right-1/4 w-96 h-96 ${isDark ? "bg-blue-600/5" : "bg-blue-600/3"} rounded-full blur-3xl animate-pulse`} style={{ animationDelay: "1s" }} />
        <div className={`absolute top-1/2 left-1/2 w-96 h-96 ${isDark ? "bg-indigo-500/3" : "bg-indigo-500/2"} rounded-full blur-3xl animate-pulse`} style={{ animationDelay: "0.5s" }} />
      </div>

      {/* Cursor glow */}
      <div
        className="hidden lg:block fixed w-80 h-80 rounded-full pointer-events-none z-0 mix-blend-screen"
        style={{
          background: isDark
            ? "radial-gradient(circle, rgba(56,189,248,0.07) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(56,189,248,0.05) 0%, transparent 70%)",
          left: mousePosition.x - 160,
          top:  mousePosition.y - 160,
          transition: "all 0.4s ease-out",
        }}
      />

      <VaultTopBar />
      <HamburgerMenu />
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} duration={toast.duration} />}

      <motion.main
        initial={false}
        animate={{ marginLeft: sidebarW }}
        transition={{ type: "spring", damping: 24, stiffness: 280 }}
        className="relative z-10 flex h-[calc(100vh-4rem)] mt-16"
      >
        <div className="flex-1 overflow-y-auto vault-scrollbar">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

            {/* ── Page heading ── */}
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <button
                  onClick={onBack || (() => window.history.back())}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all duration-200 self-start ${
                    isDark
                      ? "bg-slate-800/50 border-slate-700/50 text-gray-300 hover:text-white hover:border-cyan-500/40"
                      : "bg-white/80 border-gray-200 text-gray-600 hover:border-cyan-400"
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>

                {/* Refresh button */}
                <button
                  onClick={() => { fetchDetails(); fetchActivity(); }}
                  disabled={loading}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all self-start sm:self-auto ${
                    isDark
                      ? "bg-slate-800/50 border-slate-700/50 text-gray-400 hover:text-white"
                      : "bg-white/80 border-gray-200 text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </button>
              </div>

              {/* Title row */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30 hover:rotate-6 hover:scale-110 transition-all duration-500 cursor-default flex-shrink-0">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div className="min-w-0">
                  {loading ? (
                    <>
                      <Skeleton isDark={isDark} className="h-8 w-64 mb-2" />
                      <Skeleton isDark={isDark} className="h-4 w-48" />
                    </>
                  ) : (
                    <>
                      <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight truncate ${isDark ? "text-white" : "text-gray-900"}`}>
                        {vault?.name || "Vault Details"}
                      </h1>
                      <p className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                        {vault?.description || "No description provided"}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </motion.div>

            {/* ── Quick stats row ── */}
            {!loading && stats && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6"
              >
                <StatCard icon={FileText}   label="Total Files"   value={stats.fileCount}       gradient="from-cyan-500 to-blue-600"     isDark={isDark} />
                <StatCard icon={Folder}     label="Folders"       value={stats.folderCount}     gradient="from-violet-500 to-purple-600" isDark={isDark} />
                <StatCard icon={HardDrive}  label="Storage Used"  value={stats.totalSizeLabel}  gradient="from-emerald-500 to-teal-600"  isDark={isDark} />
                <StatCard icon={TrendingUp} label="Encrypted"     value={stats.encryptedCount}  gradient="from-amber-500 to-orange-600"  isDark={isDark} />
              </motion.div>
            )}

            {/* ── Storage bar ── */}
            {!loading && stats && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                className={`${card} p-4 sm:p-5 mb-6`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <SectionIcon gradient="from-cyan-500 to-blue-600" Icon={HardDrive} />
                    <span className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Storage Usage</span>
                  </div>
                  <span className={`text-xs font-semibold ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    {stats.totalSizeLabel} / {stats.storageLimitLabel}
                  </span>
                </div>
                <div className={`h-2.5 rounded-full overflow-hidden ${isDark ? "bg-slate-700" : "bg-gray-200"}`}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.percentUsed}%` }}
                    transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                    className={`h-full rounded-full ${
                      stats.percentUsed > 80
                        ? "bg-gradient-to-r from-red-500 to-orange-500"
                        : stats.percentUsed > 60
                        ? "bg-gradient-to-r from-amber-500 to-yellow-500"
                        : "bg-gradient-to-r from-cyan-500 to-blue-600"
                    }`}
                  />
                </div>
                <p className={`text-xs mt-1.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                  {stats.percentUsed}% used · {stats.storageLimitLabel} total
                </p>
              </motion.div>
            )}

            {/* ══ MAIN GRID ══ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">

              {/* ═══ LEFT ═══ */}
              <div className="lg:col-span-2 space-y-5 sm:space-y-6">

                {/* Details & Attributes */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={card}>
                  <div className="h-[2px] bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 rounded-t-2xl" />
                  <div className="p-5 sm:p-6">
                    <h2 className={`text-sm sm:text-base font-bold mb-5 flex items-center gap-2.5 ${isDark ? "text-white" : "text-gray-900"}`}>
                      <SectionIcon gradient="from-cyan-500 to-blue-600" Icon={Shield} />
                      Details & Attributes
                    </h2>

                    {loading ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {Array.from({ length: 8 }).map((_, i) => (
                          <Skeleton key={i} isDark={isDark} className="h-20" />
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <DetailItem icon={HardDrive} label="Storage Used"   value={stats?.totalSizeLabel}    isDark={isDark} />
                        <DetailItem icon={Calendar}  label="Created"        value={vault?.created}           isDark={isDark} />
                        <DetailItem icon={Clock}     label="Last Modified"  value={vault?.modified}          isDark={isDark} />
                        <DetailItem icon={Eye}       label="Last Accessed"  value={vault?.lastAccessed}      isDark={isDark} />
                        <DetailItem icon={User}      label="Owner"          value={owner?.name}              isDark={isDark} />
                        <DetailItem icon={Lock}      label="Encryption"     value={vault?.encryption}        isDark={isDark} />
                        <DetailItem icon={FileText}  label="Total Files"    value={stats?.fileCount}         isDark={isDark} />
                        <DetailItem icon={Upload}    label="Total Uploads"  value={stats?.totalDownloads}    isDark={isDark} />
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Vault ID */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }} className={card}>
                  <div className="h-[2px] bg-gradient-to-r from-violet-500 via-purple-600 to-indigo-600 rounded-t-2xl" />
                  <div className="p-5 sm:p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className={`text-sm sm:text-base font-bold flex items-center gap-2.5 ${isDark ? "text-white" : "text-gray-900"}`}>
                        <SectionIcon gradient="from-violet-500 to-purple-600" Icon={FileText} />
                        Vault ID
                      </h2>
                      <motion.button
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={handleCopyId}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all duration-300 ${
                          copied
                            ? isDark ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-600"
                            : isDark ? "bg-slate-700/50 border-slate-600/50 text-gray-300 hover:border-cyan-500/40 hover:text-white" : "bg-gray-100 border-gray-200 text-gray-600 hover:border-cyan-400"
                        }`}
                      >
                        {copied
                          ? <><CheckCircle className="w-3.5 h-3.5" /> Copied</>
                          : <><Copy className="w-3.5 h-3.5" /> Copy</>
                        }
                      </motion.button>
                    </div>
                    <p className={`font-mono text-sm p-3 rounded-xl border break-all ${
                      isDark ? "bg-slate-900/50 border-slate-700/50 text-gray-400" : "bg-gray-50 border-gray-200 text-gray-600"
                    }`}>
                      {loading ? "Loading…" : String(vaultId)}
                    </p>
                  </div>
                </motion.div>

                {/* Category breakdown */}
                {!loading && categories.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className={card}>
                    <div className="h-[2px] bg-gradient-to-r from-emerald-500 to-teal-600 rounded-t-2xl" />
                    <div className="p-5 sm:p-6">
                      <h2 className={`text-sm sm:text-base font-bold mb-4 flex items-center gap-2.5 ${isDark ? "text-white" : "text-gray-900"}`}>
                        <SectionIcon gradient="from-emerald-500 to-teal-600" Icon={Activity} />
                        File Categories
                      </h2>
                      <div className="space-y-2.5">
                        {categories.map((cat, i) => {
                          const pct = stats?.fileCount > 0
                            ? Math.round((cat.count / stats.fileCount) * 100)
                            : 0;
                          return (
                            <div key={i}>
                              <div className="flex items-center justify-between mb-1">
                                <span className={`text-xs font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                                  {cat.category}
                                </span>
                                <span className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                                  {cat.count} files · {cat.sizeLabel}
                                </span>
                              </div>
                              <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? "bg-slate-700" : "bg-gray-200"}`}>
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pct}%` }}
                                  transition={{ duration: 0.8, delay: i * 0.1 }}
                                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Recent activity */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.19 }} className={card}>
                  <div className="h-[2px] bg-gradient-to-r from-amber-500 to-orange-600 rounded-t-2xl" />
                  <div className="p-5 sm:p-6">
                    <h2 className={`text-sm sm:text-base font-bold mb-4 flex items-center gap-2.5 ${isDark ? "text-white" : "text-gray-900"}`}>
                      <SectionIcon gradient="from-amber-500 to-orange-600" Icon={Activity} />
                      Recent Activity
                    </h2>

                    {activityLoading ? (
                      <div className="space-y-2">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <Skeleton key={i} isDark={isDark} className="h-14" />
                        ))}
                      </div>
                    ) : activity.length === 0 ? (
                      <p className={`text-sm text-center py-6 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                        No activity yet
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {activity.map((act, i) => (
                          <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${
                            isDark ? "bg-slate-900/50 border-slate-700/50" : "bg-gray-50 border-gray-200"
                          }`}>
                            <div className="w-7 h-7 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Upload className="w-3.5 h-3.5 text-white" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className={`text-xs font-semibold truncate ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                                {act.label}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <span className={`text-[10px] ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                                  {act.timestamp}
                                </span>
                                {act.meta?.size && (
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                                    isDark ? "bg-slate-800 border-slate-700 text-gray-500" : "bg-white border-gray-200 text-gray-400"
                                  }`}>
                                    {act.meta.size}
                                  </span>
                                )}
                                {act.meta?.isEncrypted && (
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                                    isDark ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-600"
                                  }`}>
                                    🔒 Encrypted
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Action buttons */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }} className="flex flex-wrap gap-3">
                  <motion.button
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={handleExport}
                    disabled={loading}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all duration-300 disabled:opacity-60"
                  >
                    <Download className="w-4 h-4" />
                    Export Info
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={() => setShowDeleteModal(true)}
                    disabled={loading}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-300 disabled:opacity-60 ${
                      isDark
                        ? "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/40"
                        : "bg-red-50 border-red-100 text-red-500 hover:bg-red-100 hover:border-red-200"
                    }`}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Vault
                  </motion.button>
                </motion.div>
              </div>

              {/* ═══ RIGHT sidebar ═══ */}
              <div className="space-y-5 sm:space-y-6">

                {/* Status */}
                <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12 }} className={card}>
                  <div className="h-[2px] bg-gradient-to-r from-emerald-500 to-teal-600 rounded-t-2xl" />
                  <div className="p-5">
                    <h3 className={`text-sm font-bold mb-4 flex items-center gap-2.5 ${isDark ? "text-white" : "text-gray-900"}`}>
                      <SectionIcon gradient="from-emerald-500 to-teal-600" Icon={Activity} />
                      Status
                    </h3>
                    {loading ? (
                      <div className="space-y-2">
                        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} isDark={isDark} className="h-11" />)}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <StatusBadge label="Encryption"  value="AES-256"                                         status="secure"                              isDark={isDark} />
                        <StatusBadge label="Lock Status" value={vault?.isLocked ? "Password Protected" : "Open"} status={vault?.isLocked ? "locked" : "unlocked"} isDark={isDark} />
                        <StatusBadge label="Access"      value={vault?.access || "Private"}                      status="info"                                isDark={isDark} />
                        <StatusBadge label="Shared Files" value={`${stats?.sharedCount || 0} file(s)`}          status="info"                                isDark={isDark} />
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Owner info */}
                <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className={card}>
                  <div className="h-[2px] bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-2xl" />
                  <div className="p-5">
                    <h3 className={`text-sm font-bold mb-4 flex items-center gap-2.5 ${isDark ? "text-white" : "text-gray-900"}`}>
                      <SectionIcon gradient="from-blue-600 to-indigo-600" Icon={User} />
                      Owner
                    </h3>
                    {loading ? (
                      <div className="space-y-2">
                        <Skeleton isDark={isDark} className="h-11" />
                        <Skeleton isDark={isDark} className="h-11" />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className={`flex items-center gap-3 p-3 rounded-xl border ${
                          isDark ? "bg-slate-900/50 border-slate-700/50" : "bg-gray-50 border-gray-200"
                        }`}>
                          <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs font-bold">
                              {owner?.name?.charAt(0)?.toUpperCase() || "U"}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className={`text-sm font-semibold truncate ${isDark ? "text-white" : "text-gray-900"}`}>
                              {owner?.name || "—"}
                            </p>
                            <p className={`text-xs truncate ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                              {owner?.email || "—"}
                            </p>
                          </div>
                        </div>
                        <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${
                          isDark ? "bg-slate-900/50 border-slate-700/50" : "bg-gray-50 border-gray-200"
                        }`}>
                          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          <span className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>Owner</span>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Tags */}
                <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className={card}>
                  <div className="h-[2px] bg-gradient-to-r from-violet-500 to-purple-600 rounded-t-2xl" />
                  <div className="p-5">
                    <h3 className={`text-sm font-bold mb-4 flex items-center gap-2.5 ${isDark ? "text-white" : "text-gray-900"}`}>
                      <SectionIcon gradient="from-violet-500 to-purple-600" Icon={Tag} />
                      Tags
                    </h3>
                    {loading ? (
                      <div className="flex gap-2 flex-wrap">
                        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} isDark={isDark} className="h-7 w-20 rounded-full" />)}
                      </div>
                    ) : vault?.tags?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {vault.tags.map((tag, idx) => (
                          <span key={idx} className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                            isDark
                              ? "bg-violet-500/10 border-violet-500/20 text-violet-400 hover:bg-violet-500/20"
                              : "bg-violet-50 border-violet-200 text-violet-600 hover:bg-violet-100"
                          }`}>
                            #{tag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>No tags added</p>
                    )}
                  </div>
                </motion.div>

                {/* Vault health */}
                {!loading && stats && (
                  <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }} className={card}>
                    <div className="h-[2px] bg-gradient-to-r from-cyan-500 to-blue-600 rounded-t-2xl" />
                    <div className="p-5">
                      <h3 className={`text-sm font-bold mb-4 flex items-center gap-2.5 ${isDark ? "text-white" : "text-gray-900"}`}>
                        <SectionIcon gradient="from-cyan-500 to-blue-600" Icon={Shield} />
                        Vault Health
                      </h3>
                      <div className="space-y-2">
                        {[
                          { label: "Files",       value: stats.fileCount },
                          { label: "Folders",     value: stats.folderCount },
                          { label: "Views",       value: stats.totalViews },
                          { label: "Downloads",   value: stats.totalDownloads },
                          { label: "Shared",      value: stats.sharedCount },
                          { label: "Encrypted",   value: stats.encryptedCount },
                        ].map(({ label, value }) => (
                          <div key={label} className={`flex items-center justify-between p-2.5 rounded-xl border ${
                            isDark ? "bg-slate-900/50 border-slate-700/50" : "bg-gray-50 border-gray-200"
                          }`}>
                            <p className={`text-xs font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}>{label}</p>
                            <span className={`text-xs font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{value ?? 0}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.main>

      {/* ── Delete confirmation modal ── */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => !deleteLoading && setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`relative rounded-2xl border shadow-2xl p-6 max-w-md w-full ${
                isDark ? "bg-slate-800/90 border-slate-700/50" : "bg-white border-gray-200"
              }`}
            >
              <div className="h-[2px] bg-gradient-to-r from-red-500 to-orange-500 -mt-6 -mx-6 mb-6 rounded-tl-2xl rounded-tr-2xl" />
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className={`text-base font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                    Delete Vault?
                  </h3>
                  <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    This cannot be undone
                  </p>
                </div>
              </div>
              <p className={`text-sm mb-2 leading-relaxed ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                Permanently deletes{" "}
                <span className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                  "{vault?.name}"
                </span>{" "}
                and all its contents.
              </p>
              {stats?.fileCount > 0 && (
                <div className={`mb-4 flex items-center gap-2 px-3 py-2 rounded-xl border text-xs ${
                  isDark ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-red-50 border-red-200 text-red-600"
                }`}>
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  {stats.fileCount} file(s) · {stats.totalSizeLabel} will be permanently erased
                </div>
              )}
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleteLoading}
                  className={`flex-1 py-2.5 px-4 rounded-xl border text-sm font-semibold transition-all disabled:opacity-50 ${
                    isDark
                      ? "bg-slate-700/50 border-slate-600/50 text-gray-300 hover:text-white"
                      : "bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold bg-gradient-to-r from-red-500 to-orange-600 text-white shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all duration-300 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {deleteLoading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Deleting…</>
                    : <><Trash2 className="w-4 h-4" /> Delete Forever</>
                  }
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .vault-scrollbar::-webkit-scrollbar { width: 4px; }
        .vault-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .vault-scrollbar::-webkit-scrollbar-thumb { background: rgba(6,182,212,0.4); border-radius: 2px; }
        .vault-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(6,182,212,0.65); }
      `}</style>
    </div>
  );
};

export default Details;