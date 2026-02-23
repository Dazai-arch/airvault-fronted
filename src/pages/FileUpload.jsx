import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, Shield, X, CheckCircle, AlertTriangle, FileText, Image,
  File, Archive, Tag, Hash, Lock, Server, ArrowLeft, RefreshCw,
  StopCircle, Activity, FolderPlus, ChevronRight, Home, Edit3,
  Trash2, FolderOpen, Zap, ChevronDown, Video, Music, Code, Table,
  KeyRound, Eye, EyeOff, ShieldCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useVault } from "../context/VaultContext";
import VaultTopBar from "../components/layout/VaultTopBar";
import HamburgerMenu from "../components/layout/HamburgerMenu";
import Toast from "../components/layout/Toast";
import { useToast } from "../hooks/useToast";
import vaultApi, { unlockVaultKey, getVaultKey } from "../services/vaultApi";

// ── constants ────────────────────────────────────────────────
const MAX_FILE_SIZE   = 100 * 1024 * 1024;
const MAX_FILES       = 20;
const SIDEBAR_COLLAPSED = 60;
const SIDEBAR_EXPANDED  = 220;
const categoryOptions   = ["General", "Personal", "Work", "Legal", "Finance", "Media"];

// ── utils ────────────────────────────────────────────────────
const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes) || bytes === 0) return "0 B";
  const k = 1024, sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const v = bytes / Math.pow(k, i);
  return `${v.toFixed(v >= 10 ? 0 : 1)} ${sizes[i]}`;
};

const formatSpeed = (bps) =>
  !Number.isFinite(bps) || bps <= 0 ? "--" : `${formatBytes(bps)}/s`;

const getFileIcon = (file) => {
  const t   = file.type || "";
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  if (t.startsWith("image/"))  return Image;
  if (t.startsWith("video/")  || ["mp4","mov","avi","mkv","webm","flv","wmv","m4v"].includes(ext)) return Video;
  if (t.startsWith("audio/")  || ["mp3","wav","aac","flac","ogg","m4a","wma"].includes(ext))        return Music;
  if (t.includes("pdf")       || ext === "pdf")                                                      return FileText;
  if (t.includes("zip")       || ["zip","rar","7z","tar","gz","bz2"].includes(ext))                 return Archive;
  if (t.includes("spreadsheet") || ["xls","xlsx","csv","numbers"].includes(ext))                    return Table;
  if (["js","ts","jsx","tsx","py","java","cpp","c","cs","go","rs","php","rb","swift","kt",
       "html","css","scss","json","yaml","yml","xml","sh","bash","sql"].includes(ext))               return Code;
  return File;
};

const buildUploadPayload = (m) => ({
  category: m.category, tags: m.tags, description: m.description, label: m.label,
});

// ── sub-components ───────────────────────────────────────────
const SectionIcon = ({ gradient, Icon }) => (
  <div className={`w-9 h-9 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}>
    <Icon className="w-4 h-4 text-white" />
  </div>
);

const CustomSelect = ({ value, onChange, options, disabled, isDark }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} className="relative">
      <button type="button" disabled={disabled} onClick={() => !disabled && setOpen((v) => !v)}
        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 disabled:opacity-50 ${
          isDark
            ? `bg-slate-800/60 border-slate-700/50 text-white hover:border-cyan-500/40 ${open ? "border-cyan-500/50 ring-2 ring-cyan-500/20" : ""}`
            : `bg-gray-50 border-gray-200 text-gray-900 hover:border-cyan-400 ${open ? "border-cyan-400 ring-2 ring-cyan-500/20" : ""}`
        }`}>
        <span>{value}</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 flex-shrink-0 ${isDark ? "text-gray-400" : "text-gray-500"} ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }} transition={{ duration: 0.15 }}
            className={`absolute z-50 w-full mt-1.5 rounded-xl border shadow-2xl overflow-hidden ${isDark ? "bg-slate-900 border-slate-700/60" : "bg-white border-gray-200"}`}>
            <div className="h-[2px] bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600" />
            {options.map((opt) => (
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

// ── ZK Unlock Modal ──────────────────────────────────────────
const ZKUnlockModal = ({ vault, isDark, onUnlock, onCancel, loading }) => {
  const [pass, setPass]   = useState("");
  const [show, setShow]   = useState(false);
  const [err,  setErr]    = useState("");

  const submit = async () => {
    setErr("");
    try { await onUnlock(pass); }
    catch (e) { setErr(e.message || "Incorrect password"); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
        className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden ${isDark ? "bg-slate-900 border-slate-700/60" : "bg-white border-gray-200"}`}>
        <div className="h-[3px] bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600" />
        <div className="p-7">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <KeyRound className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Unlock Vault</h2>
              <p className={`text-xs mt-0.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                {vault?.hasPassword
                  ? "Enter your vault password to enable zero-knowledge encryption"
                  : "Initialising encryption keys…"}
              </p>
            </div>
          </div>

          <div className={`flex items-start gap-3 p-4 rounded-xl border mb-6 ${isDark ? "bg-emerald-500/10 border-emerald-500/20" : "bg-emerald-50 border-emerald-200"}`}>
            <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
            <p className={`text-xs leading-relaxed ${isDark ? "text-emerald-300" : "text-emerald-700"}`}>
              Your files are encrypted <strong>in your browser</strong> using AES-GCM 256-bit before upload.
              The server never sees your file content or your password — true zero-knowledge.
            </p>
          </div>

          {vault?.hasPassword && (
            <div className="mb-5">
              <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                Vault Password
              </label>
              <div className="relative">
                <input
                  type={show ? "text" : "password"} value={pass}
                  onChange={(e) => { setPass(e.target.value); setErr(""); }}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  placeholder="Enter vault password"
                  autoFocus
                  className={`w-full pr-12 pl-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${
                    isDark
                      ? "bg-slate-800/60 border-slate-700/50 text-white placeholder:text-gray-500 focus:border-cyan-500/50 focus:ring-cyan-500/20"
                      : "bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-cyan-400 focus:ring-cyan-500/20"
                  }`} />
                <button type="button" onClick={() => setShow((v) => !v)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg ${isDark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900"}`}>
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {err && <p className="text-xs mt-2 text-red-400">{err}</p>}
              {vault?.passwordHint && (
                <p className={`text-xs mt-2 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                  Hint: {vault.passwordHint}
                </p>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={onCancel}
              className={`flex-1 py-2.5 rounded-xl border font-semibold text-sm transition-all ${isDark ? "bg-slate-800/50 border-slate-700/50 text-gray-300 hover:border-slate-600" : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"}`}>
              Cancel
            </button>
            <button onClick={submit} disabled={loading || (vault?.hasPassword && !pass)}
              className="flex-1 py-2.5 rounded-xl text-white font-semibold text-sm bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? "Unlocking…" : "Unlock & Enable Encryption"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// ── UploadQueuePanel (must be outside FileUpload to prevent remount on every render) ──
const UploadQueuePanel = ({
  isDark, card, uploadMode, currentFolder, vaultUnlocked,
  currentFolderUploads, onCancel, onRetry, onRemove,
}) => (
  <div className={`${card} overflow-hidden`}>
    <div className="h-[2px] bg-gradient-to-r from-emerald-500 to-teal-600" />
    <div className="p-5 sm:p-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className={`text-sm sm:text-base font-bold flex items-center gap-2.5 ${isDark ? "text-white" : "text-gray-900"}`}>
          <SectionIcon gradient="from-emerald-500 to-teal-600" Icon={Activity} />
          Upload Queue
        </h3>
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${vaultUnlocked ? "bg-emerald-400 animate-pulse" : "bg-gray-500"}`} />
          <span className={`text-xs font-semibold ${vaultUnlocked ? (isDark ? "text-emerald-400" : "text-emerald-600") : (isDark ? "text-gray-500" : "text-gray-400")}`}>
            {vaultUnlocked ? `${currentFolderUploads.length} file${currentFolderUploads.length !== 1 ? "s" : ""}` : "Locked"}
          </span>
        </div>
      </div>
      <p className={`text-xs mb-5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
        {uploadMode === "quick"
          ? "Files are encrypted in-browser, then uploaded to vault root"
          : <span>Encrypted uploads to <span className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>{currentFolder.name}</span></span>}
      </p>

      {currentFolderUploads.length === 0 ? (
        <div className="space-y-3">
          <div className={`rounded-xl border p-5 ${isDark ? "bg-slate-900/50 border-slate-700/50" : "bg-gray-50 border-gray-200"}`}>
            <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              {vaultUnlocked ? "No files queued yet. Drop files above to begin." : "Unlock the vault to start uploading."}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[0, 1].map((i) => (
              <div key={i} className={`h-20 rounded-xl border animate-pulse ${isDark ? "bg-slate-800/30 border-slate-700/50" : "bg-gray-100 border-gray-200"}`} />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {currentFolderUploads.map((entry) => {
              const Icon   = getFileIcon(entry.file);
              const done   = entry.status === "completed";
              const fail   = entry.status === "failed";
              const cancel = entry.status === "canceled";
              const active = entry.status === "uploading";
              const statusColor = done ? "text-emerald-400" : fail ? "text-red-400" : cancel ? "text-amber-400" : "text-cyan-400";
              const barColor    = done ? "bg-emerald-500" : fail ? "bg-red-500" : cancel ? "bg-amber-500" : null;
              return (
                <motion.div key={entry.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
                  className={`rounded-xl border p-4 sm:p-5 transition-all duration-300 ${isDark ? "bg-slate-900/50 border-slate-700/50 hover:border-cyan-500/30" : "bg-gray-50 border-gray-200 hover:border-cyan-300"}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0 ${isDark ? "bg-slate-800/60 border-slate-700/50" : "bg-white border-gray-200"}`}>
                        <Icon className={`w-5 h-5 ${statusColor}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className={`text-sm font-semibold truncate ${isDark ? "text-white" : "text-gray-900"}`}>{entry.file.name}</p>
                          {done && <Lock className="w-3 h-3 text-emerald-400 flex-shrink-0" title="Encrypted & uploaded" />}
                        </div>
                        <p className={`text-xs mt-0.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                          {formatBytes(entry.file.size)} · {entry.file.type || entry.file.name.split(".").pop()?.toUpperCase() || "File"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {active && (
                        <button onClick={() => onCancel(entry.id)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${isDark ? "bg-slate-800/50 border-slate-700/50 text-gray-300 hover:border-slate-600" : "bg-white border-gray-200 text-gray-600"}`}>
                          <StopCircle className="w-3 h-3" /> Cancel
                        </button>
                      )}
                      {(fail || cancel) && (
                        <button onClick={() => onRetry(entry)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20 hover:scale-[1.03] transition-all duration-300">
                          <RefreshCw className="w-3 h-3" /> Retry
                        </button>
                      )}
                      <button onClick={() => onRemove(entry.id)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${isDark ? "bg-slate-800/50 border-slate-700/50 text-gray-300 hover:border-red-500/40 hover:text-red-400" : "bg-white border-gray-200 text-gray-600 hover:text-red-500"}`}>
                        <X className="w-3 h-3" /> Remove
                      </button>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className={`font-semibold ${statusColor} flex items-center gap-1`}>
                        {active && <span className="animate-pulse">🔐 Encrypting & uploading</span>}
                        {done   && "✅ Uploaded (encrypted)"}
                        {cancel && "Canceled"}
                        {fail   && "Failed"}
                        {entry.status === "queued" && "⏳ Queued"}
                      </span>
                      <span className={isDark ? "text-gray-400" : "text-gray-500"}>
                        {active ? `${entry.progress}% · ${formatSpeed(entry.speed)}` : done ? "100%" : fail ? "0%" : "Ready"}
                      </span>
                    </div>
                    <div className={`h-2 rounded-full overflow-hidden ${isDark ? "bg-slate-700" : "bg-gray-200"}`}>
                      <motion.div animate={{ width: `${entry.progress}%` }} transition={{ duration: 0.3 }}
                        className={`h-full rounded-full relative overflow-hidden ${barColor ?? "bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500"}`}>
                        {active && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />}
                      </motion.div>
                    </div>
                    {entry.error && <p className="text-xs mt-2 text-red-400">{entry.error}</p>}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  </div>
);

// ── main component ───────────────────────────────────────────
const FileUpload = () => {
  const navigate   = useNavigate();
  const { isDark } = useTheme();
  const { activeVault } = useVault();
  const { toast, showSuccess, showError, hideToast } = useToast();

  const vaultId  = activeVault?.id || activeVault?._id || activeVault?.vaultId || null;
  const FAPI     = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  const getTok   = () => localStorage.getItem("token") || sessionStorage.getItem("token") || "";
  const authF    = (url, opts = {}) => fetch(url, {
    ...opts,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getTok()}`, ...(opts.headers||{}) },
    credentials: "include",
  });

  // sidebar
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const sidebarW = sidebarExpanded ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED;

  // ZK state
  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [unlockLoading,  setUnlockLoading]  = useState(false);

  // upload state
  const [uploadMode, setUploadMode]   = useState("quick");
  const [uploads, setUploads]         = useState([]);
  const [isDragging, setIsDragging]   = useState(false);
  const [category, setCategory]       = useState(categoryOptions[0]);
  const [tags, setTags]               = useState("");
  const [description, setDescription] = useState("");
  const [label, setLabel]             = useState("");
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // folder state
  const [folders, setFolders] = useState([]);
  const [currentFolderId,   setCurrentFolderId]   = useState("root");
  const [showCreateFolder,  setShowCreateFolder]  = useState(false);
  const [newFolderName,     setNewFolderName]      = useState("");
  const [folderNameError,   setFolderNameError]    = useState("");
  const [editingFolderId,   setEditingFolderId]    = useState(null);
  const [editFolderName,    setEditFolderName]     = useState("");

  const fileInputRef      = useRef(null);
  const controllersRef    = useRef(new Map());
  const isUploading       = uploads.some((u) => u.status === "uploading");
  const activeFolderId    = uploadMode === "quick" ? "root" : currentFolderId;

  // ── effects ─────────────────────────────────────────────────
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

  useEffect(() => {
  if (!vaultId) return;
  authF(`${FAPI}/vaults/${vaultId}/folders`)
    .then(r => r.json())
    .then(data => {
      setFolders((data.folders || []).map(f => ({ ...f, parent: f.parentId })));
    })
    .catch(e => console.warn("Could not load folders:", e.message));
}, [vaultId]);

  // Auto-show unlock modal when vault is selected
  useEffect(() => {
    if (activeVault && !vaultUnlocked) {
      // For passwordless vaults unlock automatically
      if (!activeVault.hasPassword) handleUnlock("");
      else setShowUnlockModal(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeVault?.id]);

  useEffect(() => {
    const c = controllersRef.current;
    return () => { c.forEach((ctrl) => ctrl.abort()); c.clear(); };
  }, []);

  // ── ZK unlock ───────────────────────────────────────────────
  const handleUnlock = async (passphrase) => {
    if (!activeVault) return;
    setUnlockLoading(true);
    try {

      // Fetch existing salt from server (if any) for password vaults
      let saltB64 = null;
      if (activeVault.hasPassword) {
        try {
          const saltRes = await fetch(
            `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/vaults/${vaultId}/zk-salt`,
            { headers: { Authorization: `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token")}` }, credentials: "include" }
          );
          if (saltRes.ok) { const d = await saltRes.json(); saltB64 = d.saltB64; }
        } catch { /* first time — no salt yet */ }
      }

      await unlockVaultKey(vaultId, activeVault.hasPassword, passphrase || null, saltB64);
      setVaultUnlocked(true);
      setShowUnlockModal(false);
      showSuccess("🔓 Vault unlocked — end-to-end encryption active");
    } catch (err) {
      throw err; // re-thrown to modal for inline error display
    } finally {
      setUnlockLoading(false);
    }
  };

  // ── folder helpers ───────────────────────────────────────────
  const currentFolder = useMemo(
    () => folders.find((f) => f.id === currentFolderId) || folders[0],
    [folders, currentFolderId]
  );

  const breadcrumbPath = useMemo(() => {
    const path = []; let cur = currentFolder;
    while (cur) { path.unshift(cur); cur = folders.find((f) => f.id === cur.parent); }
    return path;
  }, [currentFolder, folders]);

  const childFolders = useMemo(
    () => folders.filter((f) => f.parent === currentFolderId),
    [folders, currentFolderId]
  );

  const currentFolderUploads = useMemo(
    () => uploads.filter((u) => u.folderId === activeFolderId),
    [uploads, activeFolderId]
  );

  const STORAGE_LIMIT = 500 * 1024 * 1024; // 500 MB
  const [storageInfo, setStorageInfo] = useState({ total: STORAGE_LIMIT, used: 0 });
  const usagePercent = Math.min(100, (storageInfo.used / storageInfo.total) * 100);

  // Use a ref so refreshStorage never captures a stale vaultId
  const activeVaultIdRef = useRef(null);
  activeVaultIdRef.current = vaultId;

  const refreshStorage = useCallback(async () => {
    const id = activeVaultIdRef.current;
    if (!id) return;
    try {
      const data = await vaultApi.getVaultStorage(id);
      if (data) {
        setStorageInfo({
          total: data.storageLimit ?? STORAGE_LIMIT,
          used:  data.storageUsed  ?? 0,
        });
      }
    } catch (e) {
      console.warn("Storage refresh failed:", e?.message);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // [] is intentional — reads vaultId via ref, so never stale

  // Fetch real storage on mount and whenever active vault changes
  useEffect(() => {
    refreshStorage();
  }, [refreshStorage, vaultId]); // vaultId changes → re-fetch

  const createFolder = useCallback(async () => {
  if (!newFolderName.trim()) { setFolderNameError("Folder name cannot be empty."); return; }
  if (newFolderName.length > 50) { setFolderNameError("Max 50 characters."); return; }
  if (childFolders.some(f => f.name.toLowerCase() === newFolderName.toLowerCase())) {
    setFolderNameError("A folder with this name already exists."); return;
  }
  if (!vaultId) { showError("No vault selected."); return; }

  try {
    const res = await authF(`${FAPI}/vaults/${vaultId}/folders`, {
      method: "POST",
      body: JSON.stringify({ name: newFolderName.trim(), parentId: currentFolderId }),
    });
    const data = await res.json();
    if (!res.ok) { setFolderNameError(data.message || "Failed to create folder"); return; }

    // Normalise shape: backend uses parentId, local state uses parent
    const newFolder = { ...data.folder, parent: data.folder.parentId, fileCount: 0, size: 0 };
    setFolders(prev => [...prev, newFolder]);
    showSuccess(`Folder "${newFolderName}" created.`);
    setNewFolderName(""); setFolderNameError(""); setShowCreateFolder(false);
  } catch (e) {
    setFolderNameError("Network error. Try again.");
  }
}, [newFolderName, childFolders, currentFolderId, vaultId, showSuccess]);

  const deleteFolder = useCallback(async (id) => {
  if (!vaultId) return;
  if (folders.some(f => f.parent === id) || uploads.some(u => u.folderId === id)) {
    showError("Cannot delete folder with files or subfolders."); return;
  }
  try {
    const res = await authF(`${FAPI}/vaults/${vaultId}/folders/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) { showError(data.message || "Delete failed."); return; }
    setFolders(prev => prev.filter(f => f.id !== id));
    showSuccess("Folder deleted.");
  } catch (e) {
    showError("Network error. Try again.");
  }
}, [folders, uploads, vaultId, showError, showSuccess]);

const renameFolder = useCallback(async (id, name) => {
  if (!name.trim()) { setFolderNameError("Folder name cannot be empty."); return; }
  if (childFolders.some(f => f.id !== id && f.name.toLowerCase() === name.toLowerCase())) {
    setFolderNameError("A folder with this name already exists."); return;
  }
  if (!vaultId) return;
  try {
    const res = await authF(`${FAPI}/vaults/${vaultId}/folders/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name: name.trim() }),
    });
    const data = await res.json();
    if (!res.ok) { showError(data.message || "Rename failed."); return; }
    setFolders(prev => prev.map(f => f.id === id ? { ...f, name: name.trim() } : f));
    setEditingFolderId(null); setEditFolderName(""); showSuccess("Folder renamed.");
  } catch (e) {
    showError("Network error. Try again.");
  }
}, [childFolders, vaultId, showError, showSuccess]);

  // ── upload ───────────────────────────────────────────────────
  const updateUpload = useCallback((id, updates) =>
    setUploads((prev) => prev.map((u) => u.id === id ? { ...u, ...updates } : u)), []);

  const startUpload = useCallback((entry) => {
    if (!activeVault) return;
    if (!vaultUnlocked) { showError("Unlock the vault first."); return; }

    updateUpload(entry.id, { status: "uploading", error: "" });
    const tracker = { lastLoaded: 0, lastTime: performance.now() };

    const { promise, abort } = vaultApi.uploadVaultFile({
      vaultId:  activeVault.id || activeVault._id || activeVault.vaultId,
      file:     entry.file,
      metadata: buildUploadPayload(entry.metadata),
      folderId: entry.folderId,
      onProgress: ({ loaded, total, speed }) => {
        updateUpload(entry.id, {
          progress: total > 0 ? Math.round((loaded / total) * 100) : 0,
          loaded, speed: speed || 0,
        });
      },
    });

    controllersRef.current.set(entry.id, { abort });
    promise
      .then(() => {
        controllersRef.current.delete(entry.id);
        updateUpload(entry.id, { status: "completed", progress: 100, speed: 0 });
        showSuccess(`🔒 ${entry.file.name} encrypted & uploaded.`);
        refreshStorage(); // ← refresh live storage after each completed upload
      })
      .catch((err) => {
        controllersRef.current.delete(entry.id);
        const msg = err?.message || "Upload failed.";
        updateUpload(entry.id, { status: msg === "Upload canceled" ? "canceled" : "failed", error: msg, speed: 0 });
        if (msg !== "Upload canceled") showError(msg);
      });
  }, [activeVault, vaultUnlocked, showError, showSuccess, updateUpload, refreshStorage]);

  const handleFiles = useCallback((fileList) => {
    if (!activeVault) { showError("Select a vault first."); return; }
    if (!vaultUnlocked) { setShowUnlockModal(true); return; }
    const files = Array.from(fileList);
    if (files.length + uploads.length > MAX_FILES) { showError(`Max ${MAX_FILES} files.`); return; }
    const metadata = {
      category, tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      description: description.trim(), label: label.trim(),
    };
    const entries = [];
    files.forEach((file) => {
      if (file.size > MAX_FILE_SIZE) { showError(`${file.name} exceeds ${formatBytes(MAX_FILE_SIZE)}.`); return; }
      entries.push({
        id: crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        file, folderId: activeFolderId,
        status: "queued", progress: 0, speed: 0, loaded: 0, error: "", metadata,
      });
    });
    if (!entries.length) return;
    setUploads((prev) => [...entries, ...prev]);
    entries.forEach(startUpload);
  }, [activeVault, vaultUnlocked, uploads.length, category, tags, description, label, activeFolderId, showError, startUpload]);

  const handleRetry  = useCallback((e) => { updateUpload(e.id, { progress: 0, loaded: 0, error: "" }); startUpload(e); }, [startUpload, updateUpload]);
  const handleCancel = useCallback((id) => controllersRef.current.get(id)?.abort(), []);
  const handleRemove = useCallback((id) => {
    controllersRef.current.get(id)?.abort(); controllersRef.current.delete(id);
    setUploads((p) => p.filter((u) => u.id !== id));
  }, []);

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
    if (!isUploading && e.dataTransfer?.files?.length) handleFiles(e.dataTransfer.files);
  };
  const dragHandlers = {
    onDragEnter: (e) => { e.preventDefault(); e.stopPropagation(); if (!isUploading) setIsDragging(true); },
    onDragOver:  (e) => { e.preventDefault(); e.stopPropagation(); if (!isUploading) setIsDragging(true); },
    onDragLeave: (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); },
  };

  // ── style helpers ────────────────────────────────────────────
  const card = `rounded-2xl border backdrop-blur-xl shadow-xl transition-all duration-300 ${
    isDark ? "bg-slate-800/50 border-slate-700/50" : "bg-white/80 border-gray-200"
  }`;
  const inputCls = isDark
    ? "bg-slate-800/60 border-slate-700/50 text-white placeholder:text-gray-500 focus:border-cyan-500/50 focus:ring-cyan-500/20"
    : "bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-cyan-400 focus:ring-cyan-500/20";

  // ── sub-panels ───────────────────────────────────────────────
  const DropZone = ({ destinationLabel }) => (
    <div
      className={`relative border-2 border-dashed rounded-2xl p-10 sm:p-14 text-center transition-all duration-300 overflow-hidden ${
        !vaultUnlocked
          ? isDark ? "border-slate-700/40 opacity-60 cursor-not-allowed" : "border-gray-200 opacity-60 cursor-not-allowed"
          : isDragging
            ? isDark ? "border-cyan-400 bg-cyan-500/10" : "border-cyan-500 bg-cyan-50"
            : isDark ? "border-slate-700/60 hover:border-cyan-500/50 hover:bg-slate-700/20" : "border-gray-300 hover:border-cyan-400 hover:bg-gray-50"
      } ${isUploading ? "opacity-60 cursor-not-allowed" : vaultUnlocked ? "cursor-pointer" : ""}`}
      onClick={() => {
        if (!vaultUnlocked) { setShowUnlockModal(true); return; }
        if (!isUploading) fileInputRef.current?.click();
      }}>
      {isDragging && <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-blue-500/10 pointer-events-none" />}
      <div className={`relative inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg flex-shrink-0 ${
        vaultUnlocked ? "bg-gradient-to-br from-cyan-500 to-blue-600 shadow-cyan-500/30" : isDark ? "bg-slate-700 shadow-none" : "bg-gray-200 shadow-none"
      }`}>
        {vaultUnlocked ? <Upload className="w-8 h-8 text-white" /> : <Lock className="w-8 h-8 text-gray-400" />}
      </div>
      {!vaultUnlocked ? (
        <p className={`text-base font-semibold ${isDark ? "text-gray-400" : "text-gray-500"}`}>
          Click to unlock vault before uploading
        </p>
      ) : (
        <>
          <p className={`text-base font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>Drop files here or click to browse</p>
          {destinationLabel && <p className={`text-xs mt-1 font-medium ${isDark ? "text-cyan-400" : "text-cyan-600"}`}>{destinationLabel}</p>}
          <p className={`text-xs mt-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}>All file types · Max {formatBytes(MAX_FILE_SIZE)} · Up to {MAX_FILES} files · AES-GCM 256-bit encrypted before upload</p>
        </>
      )}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        {[{ Icon: FileText, l: "Documents" }, { Icon: Image, l: "Images" }, { Icon: Video, l: "Videos" }, { Icon: Music, l: "Audio" }, { Icon: Archive, l: "Archives" }, { Icon: Code, l: "Code" }].map(({ Icon, l }) => (
          <div key={l} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs ${isDark ? "bg-slate-700/40 border-slate-700/60 text-gray-400" : "bg-gray-100 border-gray-200 text-gray-500"}`}>
            <Icon className="w-3.5 h-3.5" />{l}
          </div>
        ))}
      </div>
    </div>
  );

  // ── no vault selected ────────────────────────────────────────
  if (!activeVault) {
    return (
      <div className={`h-screen w-full flex items-center justify-center ${isDark ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" : "bg-gradient-to-br from-gray-50 via-white to-gray-100"}`}>
        <div className="text-center px-6">
          <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-cyan-500/30">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <p className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>No vault selected</p>
          <p className={`text-sm mt-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>Select a vault to start uploading encrypted files.</p>
          <button onClick={() => navigate("/vaults")}
            className="mt-6 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white font-semibold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.03] transition-all duration-300">
            Go to Vaults
          </button>
        </div>
      </div>
    );
  }

  // ── render ───────────────────────────────────────────────────
  return (
    <div className={`h-screen w-full overflow-hidden transition-colors duration-500 ${
      isDark ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" : "bg-gradient-to-br from-gray-50 via-white to-gray-100"
    }`}>
      {/* Ambient blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-1/4 -left-1/4 w-96 h-96 ${isDark ? "bg-cyan-500/5" : "bg-cyan-500/3"} rounded-full blur-3xl animate-pulse`} />
        <div className={`absolute bottom-1/4 -right-1/4 w-96 h-96 ${isDark ? "bg-blue-600/5" : "bg-blue-600/3"} rounded-full blur-3xl animate-pulse`} style={{ animationDelay: "1s" }} />
      </div>
      {/* Cursor glow */}
      <div className="hidden lg:block fixed w-80 h-80 rounded-full pointer-events-none z-0 mix-blend-screen"
        style={{
          background: isDark ? "radial-gradient(circle, rgba(56,189,248,0.07) 0%, transparent 70%)" : "radial-gradient(circle, rgba(56,189,248,0.05) 0%, transparent 70%)",
          left: mousePosition.x - 160, top: mousePosition.y - 160, transition: "all 0.4s ease-out",
        }} />

      <VaultTopBar />
      <HamburgerMenu />
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} duration={toast.duration} />}

      {/* ZK unlock modal */}
      {showUnlockModal && (
        <ZKUnlockModal
          vault={activeVault} isDark={isDark}
          onUnlock={handleUnlock}
          onCancel={() => { setShowUnlockModal(false); navigate("/vault/dashboard"); }}
          loading={unlockLoading}
        />
      )}

      <motion.main
        initial={false}
        animate={{ marginLeft: sidebarW }}
        transition={{ type: "spring", damping: 24, stiffness: 280 }}
        className="relative z-10 flex h-[calc(100vh-4rem)] mt-16">
        <div className="flex-1 overflow-y-auto vault-scrollbar">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

            {/* Page heading */}
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
              <button onClick={() => navigate("/vault/dashboard")}
                className={`flex items-center gap-2 mb-5 px-4 py-2 rounded-xl border text-sm font-medium transition-all duration-200 ${
                  isDark ? "bg-slate-800/50 border-slate-700/50 text-gray-300 hover:text-white hover:border-cyan-500/40" : "bg-white/80 border-gray-200 text-gray-600 hover:border-cyan-400"
                }`}>
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
              </button>

              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/30 hover:rotate-6 hover:scale-110 transition-all duration-500 cursor-default flex-shrink-0">
                    <Upload className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className={`text-3xl lg:text-4xl font-bold tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>Upload Files</h1>
                    <div className="flex items-center gap-2 mt-1">
                      <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>Secure uploads to {activeVault?.name || "your vault"}</p>
                      {vaultUnlocked
                        ? <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${isDark ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-50 text-emerald-600"}`}><ShieldCheck className="w-3 h-3" /> ZK Active</span>
                        : <button onClick={() => setShowUnlockModal(true)} className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border ${isDark ? "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20" : "bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100"}`}><Lock className="w-3 h-3" /> Unlock</button>}
                    </div>
                  </div>
                </div>

                {/* Storage bar */}
                <div className={`${card} flex flex-col sm:flex-row gap-3 sm:items-center px-5 py-4 min-w-[280px]`}>
                  <div className="flex items-center gap-2.5">
                    <SectionIcon gradient="from-emerald-500 to-teal-600" Icon={Server} />
                    <span className={`text-xs font-bold uppercase tracking-widest ${isDark ? "text-gray-400" : "text-gray-500"}`}>Storage</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1.5">
                      <span className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>{formatBytes(storageInfo.used)} of {formatBytes(storageInfo.total)}</span>
                      <span className={`text-xs font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>{usagePercent.toFixed(1)}%</span>
                    </div>
                    <div className={`h-2 rounded-full overflow-hidden ${isDark ? "bg-slate-700" : "bg-gray-200"}`}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${usagePercent}%` }} transition={{ duration: 1.4, ease: "easeOut" }}
                        className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                      </motion.div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Upload mode toggle */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-6">
              <div className={`inline-flex p-1 rounded-2xl border ${isDark ? "bg-slate-800/60 border-slate-700/50" : "bg-gray-100/80 border-gray-200"}`}>
                {[
                  { key: "quick",  Icon: Zap,        label: "Quick Upload",     sub: "Direct to vault root"  },
                  { key: "folder", Icon: FolderOpen, label: "Upload to Folder", sub: "Organise with folders" },
                ].map(({ key, Icon, label, sub }) => (
                  <button key={key} onClick={() => setUploadMode(key)}
                    className={`relative flex items-center gap-3 px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                      uploadMode === key
                        ? "bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-lg shadow-cyan-500/25"
                        : isDark ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-800"
                    }`}>
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="hidden sm:block text-left">
                      <span className="block leading-tight">{label}</span>
                      <span className={`block text-[10px] font-normal leading-none mt-0.5 ${uploadMode === key ? "text-cyan-100/80" : isDark ? "text-gray-500" : "text-gray-400"}`}>{sub}</span>
                    </span>
                    <span className="sm:hidden">{label}</span>
                  </button>
                ))}
              </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Left column */}
              <div className="lg:col-span-2 space-y-5">
                <AnimatePresence mode="wait">
                  {uploadMode === "quick" && (
                    <motion.div key="quick"
                      initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.25 }}
                      className={`${card} overflow-hidden`} {...dragHandlers} onDrop={handleDrop}>
                      <div className="h-[2px] bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600" />
                      <div className="p-5 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                          <h2 className={`text-sm sm:text-base font-bold flex items-center gap-2.5 ${isDark ? "text-white" : "text-gray-900"}`}>
                            <SectionIcon gradient="from-cyan-500 to-blue-600" Icon={Zap} />
                            Quick Upload
                          </h2>
                          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${isDark ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-600"}`}>
                            <Lock className="w-3.5 h-3.5" /> AES-GCM 256-bit · Zero-knowledge
                          </div>
                        </div>
                        <DropZone destinationLabel="Files are encrypted in-browser → vault root" />
                        <input ref={fileInputRef} type="file" multiple accept="*/*" className="hidden"
                          onChange={(e) => { if (e.target.files?.length) handleFiles(e.target.files); e.target.value = ""; }} />
                      </div>
                    </motion.div>
                  )}

                  {uploadMode === "folder" && (
                    <motion.div key="folder"
                      initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }}
                      className="space-y-5">

                      {/* Folder navigation */}
                      <div className={`${card} overflow-hidden`}>
                        <div className="h-[2px] bg-gradient-to-r from-indigo-500 to-violet-600" />
                        <div className="p-5 sm:p-6">
                          <h2 className={`text-sm sm:text-base font-bold mb-5 flex items-center gap-2.5 ${isDark ? "text-white" : "text-gray-900"}`}>
                            <SectionIcon gradient="from-indigo-500 to-violet-600" Icon={FolderOpen} />
                            Folder Navigation
                          </h2>
                          <div className="flex items-center gap-1.5 mb-5 overflow-x-auto pb-1 vault-scrollbar">
                            <button onClick={() => setCurrentFolderId("root")}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 border ${
                                currentFolderId === "root"
                                  ? "bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border-cyan-500/50 text-cyan-400"
                                  : isDark ? "text-gray-400 hover:bg-slate-700/50 border-transparent" : "text-gray-600 hover:bg-gray-100 border-transparent"
                              }`}>
                              <Home className="w-3.5 h-3.5" /> Root
                            </button>
                            {breadcrumbPath.length > 1 && breadcrumbPath.slice(1).map((f) => (
                              <div key={f.id} className="flex items-center gap-1.5">
                                <ChevronRight className={`w-3 h-3 ${isDark ? "text-gray-600" : "text-gray-400"}`} />
                                <button onClick={() => setCurrentFolderId(f.id)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 border ${
                                    f.id === currentFolderId
                                      ? "bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border-cyan-500/50 text-cyan-400"
                                      : isDark ? "text-gray-400 hover:bg-slate-700/50 border-transparent" : "text-gray-600 hover:bg-gray-100 border-transparent"
                                  }`}>
                                  {f.name}
                                </button>
                              </div>
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button onClick={() => setShowCreateFolder((v) => !v)}
                              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-semibold text-sm bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.03] transition-all duration-300">
                              <FolderPlus className="w-4 h-4" /> New Folder
                            </button>
                            {currentFolderId !== "root" && (
                              <button onClick={() => setCurrentFolderId(currentFolder.parent)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-semibold text-sm transition-all duration-200 ${isDark ? "bg-slate-800/50 border-slate-700/50 text-gray-300 hover:border-cyan-500/40" : "bg-white/80 border-gray-200 text-gray-600 hover:border-cyan-400"}`}>
                                <ArrowLeft className="w-4 h-4" /> Back
                              </button>
                            )}
                          </div>
                          <AnimatePresence>
                            {showCreateFolder && (
                              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
                                className={`mt-5 pt-5 border-t ${isDark ? "border-slate-700/50" : "border-gray-200"}`}>
                                <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Folder name</label>
                                <div className="flex gap-2">
                                  <input type="text" value={newFolderName}
                                    onChange={(e) => { setNewFolderName(e.target.value); setFolderNameError(""); }}
                                    placeholder="Enter folder name"
                                    onKeyDown={(e) => { if (e.key === "Enter") createFolder(); if (e.key === "Escape") setShowCreateFolder(false); }}
                                    className={`flex-1 px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${inputCls}`} autoFocus />
                                  <button onClick={createFolder} className="px-4 py-2.5 rounded-xl text-white font-semibold text-sm bg-gradient-to-r from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/25 hover:scale-[1.03] transition-all duration-300">Create</button>
                                  <button onClick={() => { setShowCreateFolder(false); setNewFolderName(""); setFolderNameError(""); }}
                                    className={`px-4 py-2.5 rounded-xl border font-semibold text-sm transition-all duration-200 ${isDark ? "bg-slate-800/50 border-slate-700/50 text-gray-300 hover:border-slate-600" : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"}`}>Cancel</button>
                                </div>
                                {folderNameError && <p className="text-xs mt-2 text-red-400">{folderNameError}</p>}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      {childFolders.length > 0 && (
                        <div className={`${card} overflow-hidden`}>
                          <div className="h-[2px] bg-gradient-to-r from-violet-500 to-purple-600" />
                          <div className="p-5 sm:p-6">
                            <div className="flex items-center justify-between mb-5">
                              <h3 className={`text-sm font-bold flex items-center gap-2.5 ${isDark ? "text-white" : "text-gray-900"}`}>
                                <SectionIcon gradient="from-violet-500 to-purple-600" Icon={FolderOpen} />
                                Subfolders
                              </h3>
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${isDark ? "bg-cyan-500/10 text-cyan-400" : "bg-cyan-500/10 text-cyan-700"}`}>{childFolders.length}</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <AnimatePresence>
                                {childFolders.map((folder, idx) => (
                                  <motion.div key={folder.id} layout
                                    initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }} transition={{ delay: idx * 0.05 }}
                                    className={`group relative rounded-xl border p-4 cursor-pointer transition-all duration-300 hover:-translate-y-1 ${isDark ? "bg-slate-900/50 border-slate-700/50 hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/10" : "bg-gray-50 border-gray-200 hover:border-cyan-400 hover:shadow-lg"}`}>
                                    <div onClick={() => setCurrentFolderId(folder.id)} className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex-shrink-0">
                                          <FolderOpen className="w-4 h-4 text-violet-400" />
                                        </div>
                                        {editingFolderId === folder.id ? (
                                          <input type="text" value={editFolderName}
                                            onChange={(e) => setEditFolderName(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === "Enter") renameFolder(folder.id, editFolderName); if (e.key === "Escape") setEditingFolderId(null); }}
                                            onClick={(e) => e.stopPropagation()}
                                            className={`flex-1 px-2 py-1 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500/40 border ${inputCls}`} autoFocus />
                                        ) : (
                                          <span className={`text-sm font-semibold truncate ${isDark ? "text-white" : "text-gray-900"}`}>{folder.name}</span>
                                        )}
                                      </div>
                                      <div className={`flex items-center gap-1 transition-opacity ${editingFolderId === folder.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                                        {editingFolderId === folder.id ? (
                                          <>
                                            <button onClick={(e) => { e.stopPropagation(); renameFolder(folder.id, editFolderName); }} className={`p-1 rounded ${isDark ? "hover:bg-white/10" : "hover:bg-gray-200"}`}><CheckCircle className="w-4 h-4 text-emerald-400" /></button>
                                            <button onClick={(e) => { e.stopPropagation(); setEditingFolderId(null); }} className={`p-1 rounded ${isDark ? "hover:bg-white/10" : "hover:bg-gray-200"}`}><X className="w-4 h-4 text-red-400" /></button>
                                          </>
                                        ) : (
                                          <button onClick={(e) => { e.stopPropagation(); setEditingFolderId(folder.id); setEditFolderName(folder.name); }} className={`p-1 rounded ${isDark ? "text-gray-400 hover:bg-white/10" : "text-gray-500 hover:bg-gray-100"}`}>
                                            <Edit3 className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                    <div className={`flex items-center justify-between text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                                      <span>{folder.fileCount || 0} files</span>
                                      <span>{formatBytes(folder.size || 0)}</span>
                                    </div>
                                    {editingFolderId !== folder.id && (
                                      <button onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id); }}
                                        className={`absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 transition-all duration-200 ${isDark ? "text-red-400 hover:bg-red-500/20" : "text-red-500 hover:bg-red-50"}`}>
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </motion.div>
                                ))}
                              </AnimatePresence>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Drop zone in folder mode */}
                      <div className={`${card} overflow-hidden`} {...dragHandlers} onDrop={handleDrop}>
                        <div className="h-[2px] bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600" />
                        <div className="p-5 sm:p-6">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                            <h2 className={`text-sm sm:text-base font-bold flex items-center gap-2.5 ${isDark ? "text-white" : "text-gray-900"}`}>
                              <SectionIcon gradient="from-blue-600 to-indigo-600" Icon={Upload} />
                              Upload to&nbsp;<span className="text-cyan-400">{currentFolder.name}</span>
                            </h2>
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${isDark ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-600"}`}>
                              <Lock className="w-3.5 h-3.5" /> AES-GCM 256-bit · Zero-knowledge
                            </div>
                          </div>
                          <DropZone destinationLabel={`Encrypted in-browser → "${currentFolder.name}"`} />
                          <input ref={fileInputRef} type="file" multiple accept="*/*" className="hidden"
                            onChange={(e) => { if (e.target.files?.length) handleFiles(e.target.files); e.target.value = ""; }} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <UploadQueuePanel
                  isDark={isDark}
                  card={card}
                  uploadMode={uploadMode}
                  currentFolder={currentFolder}
                  vaultUnlocked={vaultUnlocked}
                  currentFolderUploads={currentFolderUploads}
                  onCancel={handleCancel}
                  onRetry={handleRetry}
                  onRemove={handleRemove}
                />
              </div>

              {/* Right column */}
              <div className="space-y-5">
                {/* Upload target info */}
                <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className={`${card} overflow-hidden`}>
                  <div className={`h-[2px] bg-gradient-to-r ${uploadMode === "quick" ? "from-cyan-500 to-blue-600" : "from-indigo-500 to-violet-600"}`} />
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${uploadMode === "quick" ? "bg-cyan-500/20 border-cyan-500/30" : "bg-indigo-500/20 border-indigo-500/30"}`}>
                        {uploadMode === "quick" ? <Zap className="w-5 h-5 text-cyan-400" /> : <FolderOpen className="w-5 h-5 text-indigo-400" />}
                      </div>
                      <div>
                        <p className={`text-xs font-bold uppercase tracking-widest ${isDark ? "text-gray-400" : "text-gray-500"}`}>{uploadMode === "quick" ? "Upload Target" : "Current Folder"}</p>
                        <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>{uploadMode === "quick" ? "Vault Root" : currentFolder.name}</p>
                      </div>
                    </div>
                    <div className={`space-y-2.5 text-xs pt-4 border-t ${isDark ? "border-slate-700/50" : "border-gray-200"}`}>
                      {[
                        { label: "Files queued",    value: currentFolderUploads.length },
                        { label: "Total size",      value: formatBytes(currentFolderUploads.reduce((s, u) => s + u.file.size, 0)) },
                        { label: "Total completed", value: `${uploads.filter((u) => u.status === "completed").length} uploaded` },
                        { label: "Encryption",      value: vaultUnlocked ? "AES-GCM 256-bit" : "Locked" },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex items-center justify-between">
                          <span className={isDark ? "text-gray-400" : "text-gray-500"}>{label}</span>
                          <span className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Metadata */}
                <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }} className={`${card} overflow-hidden`}>
                  <div className="h-[2px] bg-gradient-to-r from-violet-500 to-purple-600" />
                  <div className="p-5">
                    <h3 className={`text-sm font-bold mb-5 flex items-center gap-2.5 ${isDark ? "text-white" : "text-gray-900"}`}>
                      <SectionIcon gradient="from-violet-500 to-purple-600" Icon={Tag} />
                      File Metadata
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Category</label>
                        <CustomSelect value={category} onChange={setCategory} options={categoryOptions} disabled={isUploading} isDark={isDark} />
                      </div>
                      <div>
                        <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Tags</label>
                        <div className="relative">
                          <Hash className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                          <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} disabled={isUploading} placeholder="contracts, 2026, legal"
                            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all disabled:opacity-50 ${inputCls}`} />
                        </div>
                        <p className={`text-[11px] mt-1.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}>Separate tags with commas.</p>
                      </div>
                      <div>
                        <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Label</label>
                        <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} disabled={isUploading} placeholder="Confidential"
                          className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all disabled:opacity-50 ${inputCls}`} />
                      </div>
                      <div>
                        <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Description</label>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} disabled={isUploading} rows={3} placeholder="Optional notes for this upload batch."
                          className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 resize-none transition-all disabled:opacity-50 ${inputCls}`} />
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* ZK security card */}
                <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className={`${card} overflow-hidden`}>
                  <div className="h-[2px] bg-gradient-to-r from-emerald-500 to-teal-600" />
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                        <Shield className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>Zero-Knowledge Encryption</p>
                        <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>Files never leave your device unencrypted</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {[
                        { icon: CheckCircle, text: "AES-GCM 256-bit encryption" },
                        { icon: CheckCircle, text: "PBKDF2-SHA-256 key derivation (310k iters)" },
                        { icon: CheckCircle, text: "Keys never sent to server" },
                        { icon: CheckCircle, text: "Encrypted in-browser before upload" },
                        { icon: CheckCircle, text: "Decrypted in-browser after download" },
                      ].map(({ icon: Icon, text }) => (
                        <div key={text} className={`flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-xl border ${isDark ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-600"}`}>
                          <Icon className="w-3.5 h-3.5 flex-shrink-0" /> {text}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </motion.main>

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

export default FileUpload;