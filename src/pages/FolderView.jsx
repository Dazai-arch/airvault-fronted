import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Folder, FolderPlus, FileText, Image, Archive,
  ChevronRight, Search, Upload, Lock, X, Grid3X3, List,
  AlertCircle, Shield, Database, HardDrive, Loader2,
  MoreVertical, Pencil, Trash2, Move, RefreshCw, FolderOpen,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useVault } from "../context/VaultContext";
import VaultTopBar from "../components/layout/VaultTopBar";
import HamburgerMenu from "../components/layout/HamburgerMenu";

const SIDEBAR_COLLAPSED = 60;
const SIDEBAR_EXPANDED  = 220;
const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ── helpers ──────────────────────────────────────────────────────────────────
const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const k = 1024, sizes = ["B","KB","MB","GB","TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(bytes / Math.pow(k, i) >= 10 ? 0 : 1)} ${sizes[i]}`;
};

const timeAgo = (dateStr) => {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30)  return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

const getToken = () =>
  localStorage.getItem("token") || sessionStorage.getItem("token") || "";

const authFetch = (url, opts = {}) =>
  fetch(url, {
    ...opts,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}`, ...(opts.headers || {}) },
    credentials: "include",
  });

const FILE_ICON = (mimeType = "", name = "", cls = "w-5 h-5") => {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (mimeType.startsWith("image/") || ["png","jpg","jpeg","gif","webp","svg","avif"].includes(ext))
    return <Image className={`${cls} text-cyan-400`} />;
  if (["zip","rar","7z","tar","gz"].includes(ext))
    return <Archive className={`${cls} text-amber-400`} />;
  return <FileText className={`${cls} text-violet-400`} />;
};

const TYPE_BADGE_MAP = {
  "application/pdf": { label: "PDF", cls: "text-red-400 bg-red-500/10 border-red-500/20" },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { label: "Word", cls: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": { label: "Excel", cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
};
const getTypeBadge = (mimeType = "", name = "", isDark) => {
  const meta = TYPE_BADGE_MAP[mimeType];
  const ext = name.split(".").pop()?.toUpperCase() || "FILE";
  const label = meta?.label || ext;
  const cls = meta?.cls || (isDark ? "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" : "text-cyan-600 bg-cyan-50 border-cyan-200");
  return <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${cls}`}>{label}</span>;
};

// ── Context menu component ────────────────────────────────────────────────────
const CtxMenu = ({ items, onClose, isDark }) => {
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);
  return (
    <motion.div ref={ref} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
      className={`absolute right-0 top-8 z-50 w-44 rounded-xl border shadow-xl overflow-hidden ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"}`}
      onClick={e => e.stopPropagation()}>
      {items.map(({ label, icon: Icon, onClick: cb, danger }) => (
        <button key={label} onClick={() => { cb(); onClose(); }}
          className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium transition-colors ${
            danger
              ? isDark ? "text-red-400 hover:bg-red-500/10" : "text-red-600 hover:bg-red-50"
              : isDark ? "text-gray-300 hover:bg-slate-700" : "text-gray-700 hover:bg-gray-50"
          }`}>
          <Icon className="w-3.5 h-3.5 flex-shrink-0" />
          {label}
        </button>
      ))}
    </motion.div>
  );
};

// ── Rename modal ──────────────────────────────────────────────────────────────
const RenameModal = ({ current, onConfirm, onClose, isDark }) => {
  const [value, setValue] = useState(current || "");
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        className={`rounded-2xl border shadow-2xl w-full max-w-sm overflow-hidden ${isDark ? "bg-slate-800 border-slate-700/50" : "bg-white border-gray-200"}`}>
        <div className="h-[2px] bg-gradient-to-r from-indigo-500 to-violet-600" />
        <div className="p-5">
          <h3 className={`text-sm font-bold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>Rename Folder</h3>
          <input autoFocus value={value} onChange={e => setValue(e.target.value)}
            onKeyDown={e => e.key === "Enter" && value.trim() && onConfirm(value.trim())}
            className={`w-full px-4 py-2.5 rounded-xl border text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${isDark ? "bg-slate-900 border-slate-700 text-white" : "bg-gray-50 border-gray-200 text-gray-900"}`} />
          <div className="flex gap-3">
            <button onClick={onClose} className={`flex-1 py-2 rounded-xl border text-sm font-semibold ${isDark ? "border-slate-600 text-gray-400" : "border-gray-200 text-gray-600"}`}>Cancel</button>
            <button onClick={() => value.trim() && onConfirm(value.trim())} disabled={!value.trim()}
              className="flex-1 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-500 to-violet-600 text-white disabled:opacity-40">Rename</button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════ */
const FolderView = () => {
  const navigate        = useNavigate();
  const { folderId: paramFolderId } = useParams();
  const folderId        = paramFolderId || "root";
  const { isDark }      = useTheme();
  const { activeVault } = useVault();
  // Resolve vault ID safely — context may expose it as _id, id, or vaultId
  const vaultId = activeVault?._id?.toString() || activeVault?.id || activeVault?.vaultId || null;

  const [mousePosition,          setMousePosition]          = useState({ x: 0, y: 0 });
  const [sidebarExpanded,        setSidebarExpanded]        = useState(false);
  const [layout,                 setLayout]                 = useState("grid");
  const [search,                 setSearch]                 = useState("");

  // data
  const [folder,                 setFolder]                 = useState(null);
  const [childFolders,           setChildFolders]           = useState([]);
  const [files,                  setFiles]                  = useState([]);
  const [stats,                  setStats]                  = useState({ fileCount: 0, folderCount: 0, folderSizeBytes: 0 });
  const [loading,                setLoading]                = useState(true);
  const [error,                  setError]                  = useState(null);

  // modals / menus
  const [showCreateModal,        setShowCreateModal]        = useState(false);
  const [createName,             setCreateName]             = useState("");
  const [creating,               setCreating]               = useState(false);
  const [createError,            setCreateError]            = useState(null);

  const [renaming,               setRenaming]               = useState(null);  // folder object
  const [deleting,               setDeleting]               = useState(null);  // folder id
  const [ctxMenu,                setCtxMenu]                = useState(null);  // { id }

  // ── sidebar listener ──────────────────────────────────────────────────────
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

  // ── fetch folder data ─────────────────────────────────────────────────────
  const fetchFolder = useCallback(async () => {
    if (!activeVault || !vaultId) return;
    setLoading(true); setError(null);
    try {
      const res = await authFetch(`${API}/vaults/${vaultId}/folders/${folderId}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to load folder");
      }
      const data = await res.json();
      setFolder(data.folder);
      setChildFolders(data.childFolders || []);
      setFiles(data.files || []);
      setStats(data.stats || { fileCount: 0, folderCount: 0, folderSizeBytes: 0 });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [activeVault, folderId]);

  useEffect(() => { fetchFolder(); setSearch(""); }, [fetchFolder]);

  // ── create folder ─────────────────────────────────────────────────────────
  const handleCreateFolder = async () => {
    const name = createName.trim();
    if (!name || !activeVault || !vaultId) return;
    setCreating(true); setCreateError(null);
    try {
      const res = await authFetch(`${API}/vaults/${vaultId}/folders`, {
        method: "POST",
        body: JSON.stringify({ name, parentId: folderId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create folder");
      setChildFolders(prev => [...prev, data.folder]);
      setCreateName(""); setShowCreateModal(false);
    } catch (e) {
      setCreateError(e.message);
    } finally {
      setCreating(false);
    }
  };

  // ── rename folder ─────────────────────────────────────────────────────────
  const handleRename = async (newName) => {
    if (!renaming || !activeVault || !vaultId) return;
    try {
      const res = await authFetch(`${API}/vaults/${vaultId}/folders/${renaming.id}`, {
        method: "PUT",
        body: JSON.stringify({ name: newName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Rename failed");
      setChildFolders(prev => prev.map(f => f.id === renaming.id ? { ...f, name: newName } : f));
      if (folder?.id === renaming.id) setFolder(f => ({ ...f, name: newName }));
      setRenaming(null);
    } catch (e) {
      alert(e.message);
    }
  };

  // ── delete folder ─────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!activeVault || !vaultId) return;
    setDeleting(id);
    try {
      const res = await authFetch(`${API}/vaults/${vaultId}/folders/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Delete failed");
      setChildFolders(prev => prev.filter(f => f.id !== id));
    } catch (e) {
      alert(e.message);
    } finally {
      setDeleting(null);
    }
  };

  // ── derived ───────────────────────────────────────────────────────────────
  const sidebarW       = sidebarExpanded ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED;
  const isRestricted   = folder?.restricted;
  const canManage      = folder?.permission === "edit" && !isRestricted;
  const filteredFolders = useMemo(() => childFolders.filter(f => f.name.toLowerCase().includes(search.toLowerCase())), [childFolders, search]);
  const filteredFiles   = useMemo(() => files.filter(f => f.name.toLowerCase().includes(search.toLowerCase())), [files, search]);
  const isEmpty         = filteredFolders.length === 0 && filteredFiles.length === 0;

  const card = `rounded-2xl border backdrop-blur-xl transition-all duration-300 ${
    isDark ? "bg-slate-800/50 border-slate-700/50" : "bg-white/80 border-gray-200"
  }`;

  // ── no vault ──────────────────────────────────────────────────────────────
  if (!activeVault) {
    return (
      <div className={`min-h-screen w-full flex items-center justify-center ${isDark ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" : "bg-gradient-to-br from-gray-50 via-white to-gray-100"}`}>
        <div className="text-center px-6">
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl border mb-6 ${isDark ? "bg-slate-800/50 border-slate-700/50" : "bg-white border-gray-200"}`}>
            <Folder className="w-10 h-10 text-gray-400" />
          </div>
          <p className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>No vault selected</p>
          <p className={`text-sm mt-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>Select a vault to view folders.</p>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/vaults")}
            className="mt-6 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white font-semibold shadow-lg shadow-cyan-500/25">
            Go to Vaults
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen w-full overflow-hidden transition-colors duration-500 ${isDark ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" : "bg-gradient-to-br from-gray-50 via-white to-gray-100"}`}>

      {/* Ambient blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-1/4 -left-1/4 w-96 h-96 ${isDark ? "bg-cyan-500/5" : "bg-cyan-500/3"} rounded-full blur-3xl animate-pulse`} />
        <div className={`absolute bottom-1/4 -right-1/4 w-96 h-96 ${isDark ? "bg-indigo-500/5" : "bg-indigo-500/3"} rounded-full blur-3xl animate-pulse`} style={{ animationDelay: "1s" }} />
      </div>

      {/* Mouse glow */}
      <div className="hidden lg:block fixed w-80 h-80 rounded-full pointer-events-none z-0 mix-blend-screen"
        style={{
          background: isDark ? "radial-gradient(circle, rgba(56,189,248,0.07) 0%, transparent 70%)" : "radial-gradient(circle, rgba(56,189,248,0.05) 0%, transparent 70%)",
          left: mousePosition.x - 160, top: mousePosition.y - 160, transition: "all 0.4s ease-out",
        }} />

      <VaultTopBar />
      <HamburgerMenu />

      <motion.main initial={false} animate={{ marginLeft: sidebarW }} transition={{ type: "spring", damping: 24, stiffness: 280 }}
        className="relative z-10 flex h-[calc(100vh-4rem)] mt-16">
        <div className="flex-1 overflow-y-auto vault-scrollbar">
          <div className="max-w-[1600px] mx-auto px-3 sm:px-5 lg:px-6 py-5 sm:py-8 space-y-5 sm:space-y-6">

            {/* ── Page heading ── */}
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 hover:rotate-6 hover:scale-110 transition-all duration-500 cursor-default flex-shrink-0">
                    {loading ? <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 text-white animate-spin" /> : <Folder className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
                  </div>
                  <div>
                    <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>
                      {loading ? "Loading…" : (folder?.name || "Folder")}
                    </h1>
                    <p className={`text-xs sm:text-sm mt-0.5 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                      {loading ? "" : `${stats.folderCount} folders · ${stats.fileCount} files`}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 self-start sm:self-auto">
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={() => fetchFolder()}
                    className={`p-2.5 rounded-xl border text-xs font-semibold transition-all ${isDark ? "bg-slate-700/50 border-slate-600/50 text-gray-400 hover:text-white" : "bg-gray-100 border-gray-200 text-gray-500 hover:text-gray-900"}`}>
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={() => { setCreateError(null); setCreateName(""); setShowCreateModal(true); }}
                    disabled={!canManage || loading}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs sm:text-sm font-semibold transition-all duration-300 ${
                      canManage && !loading
                        ? isDark ? "bg-slate-700/50 border-slate-600/50 text-gray-300 hover:border-indigo-500/40 hover:text-white" : "bg-gray-100 border-gray-200 text-gray-700 hover:border-indigo-400"
                        : "opacity-40 cursor-not-allowed bg-transparent border-transparent text-gray-500"
                    }`}>
                    <FolderPlus className="w-4 h-4" /> New Folder
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={() => navigate("/vault/fileupload")}
                    disabled={!canManage || loading}
                    className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 ${
                      canManage && !loading
                        ? "bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50"
                        : "opacity-40 cursor-not-allowed bg-slate-700 text-gray-500"
                    }`}>
                    <Upload className="w-4 h-4" /> Upload
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {/* ── Breadcrumb ── */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="flex flex-col sm:flex-row sm:items-center gap-3">
              <button
                onClick={() => {
                  if (!folder?.parentId) navigate("/vault/folder");
                  else navigate(`/vault/folder/${folder.parentId}`);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${isDark ? "bg-slate-800/50 border-slate-700/50 text-gray-400 hover:text-white hover:border-slate-600" : "bg-white border-gray-200 text-gray-500 hover:text-gray-900"}`}>
                <ArrowLeft className="w-3.5 h-3.5" />
                {folder?.parentId ? "Back" : "Vaults"}
              </button>

              {/* Breadcrumb built from folder.parentId chain — simple version; for full chain use /breadcrumb endpoint */}
              {folder && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button onClick={() => navigate("/vault/folder")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${folderId === "root" ? isDark ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20" : "bg-indigo-50 text-indigo-600 border border-indigo-200" : isDark ? "text-gray-500 hover:text-gray-300 hover:bg-slate-700/50" : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"}`}>
                    Vault
                  </button>
                  {folderId !== "root" && (
                    <>
                      <ChevronRight className={`w-3 h-3 ${isDark ? "text-gray-600" : "text-gray-400"}`} />
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${isDark ? "bg-indigo-500/15 text-indigo-400 border-indigo-500/20" : "bg-indigo-50 text-indigo-600 border-indigo-200"}`}>
                        {folder.name}
                      </span>
                    </>
                  )}
                </div>
              )}
            </motion.div>

            {/* ── Error ── */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className={`flex items-center gap-3 p-4 rounded-2xl border ${isDark ? "bg-red-500/10 border-red-500/20" : "bg-red-50 border-red-200"}`}>
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <p className={`text-sm ${isDark ? "text-red-300" : "text-red-700"}`}>{error}</p>
                  <button onClick={fetchFolder} className="ml-auto text-xs underline text-red-400">Retry</button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Skeleton loader ── */}
            {loading && (
              <div className="space-y-4">
                <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3`}>
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className={`rounded-2xl border p-5 h-24 animate-pulse ${isDark ? "bg-slate-800/50 border-slate-700/50" : "bg-gray-100 border-gray-200"}`} />
                  ))}
                </div>
                <div className={`rounded-2xl border p-5 h-40 animate-pulse ${isDark ? "bg-slate-800/50 border-slate-700/50" : "bg-gray-100 border-gray-200"}`} />
              </div>
            )}

            {!loading && (
              <>
                {/* ── Stat cards ── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  {[
                    { label: "Folder",       value: folder?.name || "Vault",                              color: "from-indigo-500 to-violet-600",                                                   Icon: Folder    },
                    { label: "Total Items",  value: `${stats.folderCount + stats.fileCount}`,              color: "from-cyan-500 to-blue-600",                                                       Icon: Database  },
                    { label: "Storage Used", value: formatBytes(stats.folderSizeBytes),                    color: "from-emerald-500 to-teal-600",                                                    Icon: HardDrive },
                    { label: "Access",       value: isRestricted ? "Restricted" : folder?.permission === "read" ? "Read-only" : "Editable",
                                                                                                            color: isRestricted ? "from-red-500 to-rose-600" : "from-blue-600 to-indigo-600",        Icon: Shield },
                  ].map(({ label, value, color, Icon }, i) => (
                    <motion.div key={label}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }} whileHover={{ y: -4 }}
                      className={`group relative ${card} p-4 sm:p-5 overflow-hidden cursor-default shadow-xl`}>
                      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                      <div className="relative">
                        <div className="flex items-start justify-between mb-2 sm:mb-3">
                          <div className={`inline-flex bg-gradient-to-br ${color} w-9 h-9 sm:w-11 sm:h-11 rounded-xl items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                            <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                          </div>
                        </div>
                        <p className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mb-0.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>{label}</p>
                        <p className={`text-sm sm:text-base font-bold truncate bg-gradient-to-r ${color} bg-clip-text text-transparent`}>{value}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* ── Restricted banner ── */}
                <AnimatePresence>
                  {isRestricted && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className={`flex items-start gap-3 p-4 rounded-2xl border ${isDark ? "bg-red-500/10 border-red-500/20" : "bg-red-50 border-red-200"}`}>
                      <AlertCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isDark ? "text-red-400" : "text-red-600"}`} />
                      <div>
                        <p className={`text-sm font-semibold ${isDark ? "text-red-300" : "text-red-700"}`}>Access denied</p>
                        <p className={`text-xs mt-0.5 ${isDark ? "text-red-300/70" : "text-red-600"}`}>You do not have permission to view the contents of this folder.</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Search + layout ── */}
                {!isRestricted && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
                    className={`${card} shadow-xl overflow-hidden`}>
                    <div className="h-[2px] bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600" />
                    <div className="px-4 sm:px-5 py-3 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                      <div className="flex-1 relative">
                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isDark ? "text-gray-400" : "text-gray-500"}`} />
                        <input type="text" placeholder="Search files and folders…" value={search}
                          onChange={e => setSearch(e.target.value)}
                          className={`w-full pl-9 pr-4 py-2 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-all ${isDark ? "bg-slate-700/50 border-slate-600/50 text-white placeholder-gray-500 hover:border-cyan-500/30" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 hover:border-cyan-400"}`} />
                      </div>
                      <div className={`flex items-center gap-1 rounded-xl border p-1 ${isDark ? "bg-slate-700/50 border-slate-600/50" : "bg-gray-100 border-gray-200"}`}>
                        {[{ v: "grid", Icon: Grid3X3 }, { v: "list", Icon: List }].map(({ v, Icon }) => (
                          <button key={v} onClick={() => setLayout(v)}
                            className={`p-2 rounded-lg transition-all duration-200 ${layout === v ? isDark ? "bg-indigo-500/20 text-indigo-400" : "bg-indigo-100 text-indigo-600" : isDark ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-700"}`}>
                            <Icon className="w-4 h-4" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── Empty state ── */}
                {!isRestricted && isEmpty && (
                  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    className={`${card} shadow-xl py-16 flex flex-col items-center justify-center text-center`}>
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${isDark ? "bg-slate-700/50" : "bg-gray-100"}`}>
                      <FolderOpen className={`w-8 h-8 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                    </div>
                    <p className={`text-base font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                      {search ? "No items found" : "This folder is empty"}
                    </p>
                    <p className={`text-xs mt-2 max-w-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                      {search ? "Try a different search term" : "Upload files or create subfolders to get started."}
                    </p>
                    {!search && canManage && (
                      <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        onClick={() => navigate("/vault/fileupload")}
                        className="mt-5 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white text-sm font-semibold shadow-lg shadow-cyan-500/25">
                        Upload Files
                      </motion.button>
                    )}
                  </motion.div>
                )}

                {/* ── Subfolders ── */}
                {!isRestricted && filteredFolders.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <div className={`${card} shadow-xl overflow-hidden`}>
                      <div className="h-[2px] bg-gradient-to-r from-indigo-500 via-violet-600 to-purple-600" />
                      <div className={`px-4 sm:px-5 py-3 border-b flex items-center gap-2.5 ${isDark ? "border-slate-700/50" : "border-gray-200"}`}>
                        <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Folder className="w-3.5 h-3.5 text-white" />
                        </div>
                        <h2 className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                          Subfolders <span className={`font-normal text-xs ml-1 ${isDark ? "text-gray-500" : "text-gray-400"}`}>({filteredFolders.length})</span>
                        </h2>
                      </div>
                      <div className={`p-4 sm:p-5 grid grid-cols-1 ${layout === "grid" ? "sm:grid-cols-2 lg:grid-cols-3" : ""} gap-3`}>
                        {filteredFolders.map((f, i) => (
                          <motion.div key={f.id}
                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }} whileHover={{ y: f.restricted ? 0 : -3 }}
                            className={`relative flex items-center gap-3 p-4 rounded-xl border transition-all duration-300 group ${
                              f.restricted ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                            } ${isDark ? "bg-slate-900/50 border-slate-700/50 hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/10" : "bg-gray-50 border-gray-200 hover:border-indigo-400 hover:shadow-lg"}`}
                            onClick={() => !f.restricted && navigate(`/vault/folder/${f.id}`)}>
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-indigo-500/20 to-violet-600/20 group-hover:from-indigo-500/30 group-hover:to-violet-600/30 transition-all duration-300">
                              <Folder className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-semibold truncate ${isDark ? "text-white" : "text-gray-900"}`}>{f.name}</p>
                              <p className={`text-[10px] mt-0.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                                {f.fileCount > 0 ? `${f.fileCount} file${f.fileCount !== 1 ? "s" : ""}` : "Empty"} · {f.restricted ? "Restricted" : f.permission === "read" ? "Read-only" : "Editable"}
                              </p>
                            </div>
                            {(f.locked || f.restricted) && <Lock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                            {!f.restricted && <ChevronRight className="w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400" />}

                            {/* Context menu trigger */}
                            {canManage && !f.restricted && (
                              <button
                                onClick={e => { e.stopPropagation(); setCtxMenu(ctxMenu === f.id ? null : f.id); }}
                                className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? "hover:bg-slate-700 text-gray-400" : "hover:bg-gray-200 text-gray-500"}`}>
                                <MoreVertical className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <AnimatePresence>
                              {ctxMenu === f.id && (
                                <CtxMenu isDark={isDark} onClose={() => setCtxMenu(null)} items={[
                                  { label: "Rename",    icon: Pencil,  onClick: () => setRenaming(f) },
                                  { label: "Delete",    icon: Trash2,  onClick: () => handleDelete(f.id), danger: true },
                                ]} />
                              )}
                            </AnimatePresence>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── Files ── */}
                {!isRestricted && filteredFiles.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                    <div className={`${card} shadow-xl overflow-hidden`}>
                      <div className="h-[2px] bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600" />
                      <div className={`px-4 sm:px-5 py-3 border-b flex items-center gap-2.5 ${isDark ? "border-slate-700/50" : "border-gray-200"}`}>
                        <div className="w-7 h-7 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText className="w-3.5 h-3.5 text-white" />
                        </div>
                        <h2 className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                          Files <span className={`font-normal text-xs ml-1 ${isDark ? "text-gray-500" : "text-gray-400"}`}>({filteredFiles.length})</span>
                        </h2>
                      </div>

                      {/* Grid */}
                      {layout === "grid" && (
                        <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {filteredFiles.map((file, i) => (
                            <motion.div key={file.id}
                              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.04 }} whileHover={{ y: -3 }}
                              onClick={() => navigate(`/vault/file/${file.id}`)}
                              className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 group ${isDark ? "bg-slate-900/50 border-slate-700/50 hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/10" : "bg-gray-50 border-gray-200 hover:border-cyan-400 hover:shadow-lg"}`}>
                              <div className="flex items-start justify-between mb-3">
                                {FILE_ICON(file.mimeType, file.name, "w-6 h-6")}
                                <div className="flex items-center gap-1.5">
                                  {file.isEncrypted && <Lock className="w-3 h-3 text-emerald-400" />}
                                  {getTypeBadge(file.mimeType, file.name, isDark)}
                                </div>
                              </div>
                              <p className={`text-sm font-semibold truncate ${isDark ? "text-white" : "text-gray-900"}`}>{file.name}</p>
                              <div className="flex items-center justify-between mt-2">
                                <p className={`text-[10px] ${isDark ? "text-gray-500" : "text-gray-400"}`}>{formatBytes(file.size)}</p>
                                <p className={`text-[10px] ${isDark ? "text-gray-500" : "text-gray-400"}`}>{timeAgo(file.uploadedAt)}</p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}

                      {/* List */}
                      {layout === "list" && (
                        <div className={`divide-y ${isDark ? "divide-slate-700/40" : "divide-gray-100"}`}>
                          {filteredFiles.map((file, i) => (
                            <motion.div key={file.id}
                              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.03 }}
                              onClick={() => navigate(`/vault/file/${file.id}`)}
                              className={`flex items-center justify-between px-5 py-3.5 cursor-pointer transition-all duration-200 group ${isDark ? "hover:bg-slate-700/30" : "hover:bg-gray-50"}`}>
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                {FILE_ICON(file.mimeType, file.name, "w-5 h-5 flex-shrink-0")}
                                <div className="min-w-0">
                                  <p className={`text-sm font-semibold truncate ${isDark ? "text-white" : "text-gray-900"}`}>{file.name}</p>
                                  <p className={`text-[10px] mt-0.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                                    {formatBytes(file.size)} · {timeAgo(file.uploadedAt)}
                                    {file.views ? ` · ${file.views} views` : ""}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {file.isEncrypted && <Lock className="w-3 h-3 text-emerald-400" />}
                                {getTypeBadge(file.mimeType, file.name, isDark)}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </>
            )}

          </div>
        </div>
      </motion.main>

      {/* ── Create Folder Modal ── */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowCreateModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className={`rounded-2xl border shadow-2xl w-full max-w-md overflow-hidden ${isDark ? "bg-slate-800/90 border-slate-700/50" : "bg-white border-gray-200"}`}>
              <div className="h-[2px] bg-gradient-to-r from-indigo-500 via-violet-600 to-purple-600" />
              <div className="p-5 sm:p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
                      <FolderPlus className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Create New Folder</h3>
                      <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>Inside {folder?.name}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowCreateModal(false)}
                    className={`p-2 rounded-xl ${isDark ? "hover:bg-slate-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}>
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {createError && (
                  <div className={`flex items-center gap-2 p-3 rounded-xl mb-4 text-xs ${isDark ? "bg-red-500/10 text-red-400" : "bg-red-50 text-red-600"}`}>
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {createError}
                  </div>
                )}

                <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Folder name</label>
                <input type="text" placeholder="e.g. Project Files" value={createName} autoFocus
                  onChange={e => { setCreateName(e.target.value); setCreateError(null); }}
                  onKeyDown={e => e.key === "Enter" && handleCreateFolder()}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm mb-5 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all ${isDark ? "bg-slate-900/50 border-slate-700/50 text-white placeholder:text-gray-500 hover:border-indigo-500/30" : "bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 hover:border-indigo-400"}`} />

                <div className="flex gap-3">
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => setShowCreateModal(false)}
                    className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all ${isDark ? "bg-slate-700/50 border-slate-600/50 text-gray-300 hover:text-white" : "bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200"}`}>
                    Cancel
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={handleCreateFolder}
                    disabled={!createName.trim() || creating}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-500 via-violet-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    {creating ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Creating…</> : "Create Folder"}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Rename Modal ── */}
      <AnimatePresence>
        {renaming && (
          <RenameModal
            isDark={isDark}
            current={renaming.name}
            onClose={() => setRenaming(null)}
            onConfirm={handleRename}
          />
        )}
      </AnimatePresence>

      {/* ── Deleting spinner overlay ── */}
      <AnimatePresence>
        {deleting && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <div className={`px-6 py-4 rounded-2xl border flex items-center gap-3 ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"}`}>
              <Loader2 className="w-5 h-5 animate-spin text-red-400" />
              <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>Deleting folder…</p>
            </div>
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

export default FolderView;