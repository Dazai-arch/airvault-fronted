import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, FileImage, Archive, Video, Music, Code, File,
  Folder, FolderOpen, Search, Grid3X3, List, Upload, Lock,
  Eye, Download, Share2, Trash2, ChevronRight, X,
  Shield, Database, HardDrive, Filter, CheckCircle,
  AlertCircle, Clock, Activity, Fingerprint, CameraOff,
  Key, User, Copy, RefreshCw, Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useVault } from "../context/VaultContext";
import VaultTopBar from "../components/layout/VaultTopBar";
import HamburgerMenu from "../components/layout/HamburgerMenu";
import vaultApi, { unlockVaultKey, getVaultKey } from "../services/vaultApi";
import ShareModal from "../components/modals/ShareModal";
import FilePreviewModal from "../components/modals/FilePreviewModal";

const SIDEBAR_COLLAPSED = 60;
const SIDEBAR_EXPANDED  = 220;

/* ─── helpers ─── */
const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const k = 1024, sizes = ["B","KB","MB","GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / k ** i).toFixed(bytes / k ** i >= 10 ? 0 : 1)} ${sizes[i]}`;
};

const getFileType = (mimeType = "", name = "") => {
  const ext  = name.split(".").pop()?.toLowerCase() || "";
  const mime = mimeType.toLowerCase();
  if (mime.includes("pdf") || ext === "pdf")                                                                  return "PDF";
  if (mime.startsWith("image/") || ["png","jpg","jpeg","gif","webp","svg","bmp"].includes(ext))               return "Image";
  if (mime.startsWith("video/") || ["mp4","mov","avi","mkv","webm","flv","wmv","m4v"].includes(ext))          return "Video";
  if (mime.startsWith("audio/") || ["mp3","wav","aac","flac","ogg","m4a","wma"].includes(ext))                return "Audio";
  if (mime.includes("zip") || mime.includes("archive") || ["zip","rar","7z","tar","gz","bz2"].includes(ext))  return "Archive";
  if (["js","ts","jsx","tsx","py","java","cpp","c","cs","go","rs","php","rb","swift","kt",
       "html","css","scss","json","yaml","yml","xml","sh","bash","sql"].includes(ext))                        return "Code";
  if (mime.includes("word") || ["doc","docx","odt"].includes(ext))                                           return "Word";
  if (mime.includes("spreadsheet") || mime.includes("excel") || ["xls","xlsx","csv","numbers"].includes(ext)) return "Excel";
  if (mime.includes("presentation") || ["ppt","pptx","key","odp"].includes(ext))                             return "Presentation";
  if (mime.startsWith("text/") || ["txt","md","rtf","log"].includes(ext))                                    return "Text";
  return "File";
};

const FILE_TYPE_CONFIG = {
  PDF:          { Icon: FileText,  gradient: "from-red-500 to-rose-600",      bg: "bg-red-500/10",     border: "border-red-500/20",     text: "text-red-400"     },
  Image:        { Icon: FileImage, gradient: "from-violet-500 to-purple-600", bg: "bg-violet-500/10",  border: "border-violet-500/20",  text: "text-violet-400"  },
  Video:        { Icon: Video,     gradient: "from-pink-500 to-rose-600",     bg: "bg-pink-500/10",    border: "border-pink-500/20",    text: "text-pink-400"    },
  Audio:        { Icon: Music,     gradient: "from-lime-500 to-green-600",    bg: "bg-lime-500/10",    border: "border-lime-500/20",    text: "text-lime-400"    },
  Archive:      { Icon: Archive,   gradient: "from-cyan-500 to-blue-600",     bg: "bg-cyan-500/10",    border: "border-cyan-500/20",    text: "text-cyan-400"    },
  Code:         { Icon: Code,      gradient: "from-sky-500 to-cyan-600",      bg: "bg-sky-500/10",     border: "border-sky-500/20",     text: "text-sky-400"     },
  Word:         { Icon: FileText,  gradient: "from-blue-500 to-indigo-600",   bg: "bg-blue-500/10",    border: "border-blue-500/20",    text: "text-blue-400"    },
  Excel:        { Icon: FileText,  gradient: "from-emerald-500 to-teal-600",  bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400" },
  Presentation: { Icon: FileText,  gradient: "from-orange-500 to-amber-600",  bg: "bg-orange-500/10",  border: "border-orange-500/20",  text: "text-orange-400"  },
  Text:         { Icon: FileText,  gradient: "from-gray-500 to-slate-600",    bg: "bg-gray-500/10",    border: "border-gray-500/20",    text: "text-gray-400"    },
};
const getFC = (type) => FILE_TYPE_CONFIG[type] || {
  Icon: File, gradient: "from-slate-500 to-gray-600",
  bg: "bg-slate-500/10", border: "border-slate-500/20", text: "text-slate-400",
};

const MY_PERMS = { view: true, upload: true, edit: true, delete: true, share: true, canDownload: true };

/* ══════════════════════════════════════════════════════════
   FileViewer — OUTSIDE FileView so React never remounts it
   Props: file, onClose, onDelete, onDownload, onShare,
          onPreview, copied, onCopy, isDark, downloading,
          deletingId
══════════════════════════════════════════════════════════ */
const FileViewer = ({
  file, onClose, onDelete, onDownload, onShare, onPreview,
  copied, onCopy, isDark, downloading, deletingId,
}) => {
  const ft    = getFC(file.type);
  const FIcon = ft.Icon;
  const isDel = deletingId === file.id;
  const card  = `rounded-2xl border backdrop-blur-xl shadow-xl transition-all duration-300 ${isDark ? "bg-slate-800/50 border-slate-700/50" : "bg-white/80 border-gray-200"}`;

  return (
    <div className={`${card} overflow-hidden flex flex-col`}>
      <div className={`h-[2px] bg-gradient-to-r ${ft.gradient}`} />

      {/* Header */}
      <div className={`flex items-center justify-between gap-3 px-4 py-3 border-b flex-shrink-0 ${isDark ? "border-slate-700/50" : "border-gray-200"}`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br ${ft.gradient} shadow-lg flex-shrink-0`}>
            <FIcon className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className={`text-sm font-bold truncate ${isDark ? "text-white" : "text-gray-900"}`}>{file.name}</p>
            <p className={`text-[10px] ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              {formatBytes(file.sizeBytes)} · {new Date(file.uploadedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <button onClick={onClose}
          className={`p-1.5 rounded-xl flex-shrink-0 transition-all ${isDark ? "hover:bg-slate-700 text-gray-400 hover:text-white" : "hover:bg-gray-100 text-gray-500"}`}>
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto vault-scrollbar">

        {/* Preview thumbnail */}
        <div className={`m-4 rounded-2xl border overflow-hidden relative ${isDark ? "bg-slate-900/60 border-slate-700/50" : "bg-gray-50 border-gray-200"}`}>
          <div className="h-48 flex flex-col items-center justify-center gap-3 text-center px-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${ft.gradient} shadow-xl`}>
              <FIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                {file.type === "Image"   ? "Image Preview" :
                 file.type === "Video"   ? "Video — Protected Playback" :
                 file.type === "PDF"     ? "PDF Secure Viewer" :
                 file.type === "Audio"   ? "Audio Player" :
                 file.type === "Code"    ? "Code Viewer" : "Document Preview"}
              </p>
              <p className={`text-[11px] mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                {file.isEncrypted ? "🔒 Zero-knowledge encrypted" : (MY_PERMS.edit ? "Full access enabled" : "View only")}
              </p>
            </div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
            <p className={`rotate-[-25deg] text-2xl font-black tracking-widest ${isDark ? "text-white/[0.04]" : "text-black/[0.05]"}`}>AIRVAULT</p>
          </div>
          <div className="absolute top-2.5 right-2.5">
            <span className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-full font-semibold border ${isDark ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400" : "bg-cyan-50 border-cyan-200 text-cyan-600"}`}>
              <Activity className="w-2.5 h-2.5" /> Live audit
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 px-4 pb-4">
          {/* Open Full — launches FilePreviewModal */}
          <button
            onClick={() => onPreview(file)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:scale-[1.02] transition-all duration-300">
            <Eye className="w-3.5 h-3.5" /> Open Full
          </button>

          {MY_PERMS.canDownload && (
            <button onClick={() => onDownload(file)} disabled={downloading}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border transition-all disabled:opacity-60 disabled:cursor-wait ${isDark ? "bg-slate-700/50 border-slate-600/50 text-gray-300 hover:border-cyan-500/40 hover:text-white" : "bg-gray-100 border-gray-200 text-gray-700 hover:border-cyan-400"}`}>
              {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              {downloading ? "Decrypting…" : "Download"}
            </button>
          )}

          {/* Share — launches ShareModal */}
          {MY_PERMS.share && (
            <button
              onClick={() => onShare(file)}
              className={`flex items-center justify-center p-2 rounded-xl border transition-all ${isDark ? "bg-slate-700/50 border-slate-600/50 text-gray-400 hover:border-blue-500/40 hover:text-blue-400" : "bg-gray-100 border-gray-200 text-gray-500 hover:border-blue-400 hover:text-blue-600"}`}>
              <Share2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className={`mx-4 mb-4 h-px ${isDark ? "bg-slate-700/50" : "bg-gray-200"}`} />

        {/* File details */}
        <div className="px-4 pb-2 space-y-2">
          <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${isDark ? "text-gray-500" : "text-gray-400"}`}>File Details</p>
          {[
            { Icon: User,      label: "Owner",    value: "You"                                                          },
            { Icon: Clock,     label: "Uploaded", value: new Date(file.uploadedAt).toLocaleDateString()                 },
            { Icon: HardDrive, label: "Size",     value: formatBytes(file.sizeBytes)                                    },
            { Icon: Database,  label: "Category", value: file.category || "General"                                     },
            { Icon: Eye,       label: "Activity", value: `${file.views ?? 0} views · ${file.downloads ?? 0} downloads`  },
          ].map(({ Icon, label, value }) => (
            <div key={label} className={`flex items-center gap-3 px-3 py-2 rounded-xl border ${isDark ? "bg-slate-900/40 border-slate-700/40" : "bg-gray-50 border-gray-100"}`}>
              <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
              <div className="min-w-0 flex-1">
                <p className={`text-[9px] font-bold uppercase tracking-widest ${isDark ? "text-gray-600" : "text-gray-400"}`}>{label}</p>
                <p className={`text-xs font-semibold truncate ${isDark ? "text-white" : "text-gray-900"}`}>{value}</p>
              </div>
            </div>
          ))}
          {file.tags?.length > 0 && (
            <div className={`flex flex-wrap gap-1.5 px-3 py-2 rounded-xl border ${isDark ? "bg-slate-900/40 border-slate-700/40" : "bg-gray-50 border-gray-100"}`}>
              {file.tags.map(tag => (
                <span key={tag} className={`text-[10px] px-2 py-0.5 rounded-lg font-semibold border ${isDark ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" : "bg-indigo-50 border-indigo-200 text-indigo-600"}`}>#{tag}</span>
              ))}
            </div>
          )}
          {file.description && (
            <div className={`px-3 py-2 rounded-xl border ${isDark ? "bg-slate-900/40 border-slate-700/40" : "bg-gray-50 border-gray-100"}`}>
              <p className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${isDark ? "text-gray-600" : "text-gray-400"}`}>Description</p>
              <p className={`text-xs ${isDark ? "text-gray-300" : "text-gray-700"}`}>{file.description}</p>
            </div>
          )}
        </div>

        <div className={`mx-4 my-3 h-px ${isDark ? "bg-slate-700/50" : "bg-gray-200"}`} />

        {/* Security */}
        <div className="px-4 pb-2 space-y-2">
          <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${isDark ? "text-gray-500" : "text-gray-400"}`}>Security</p>
          {[
            { Icon: Key,         label: "Encryption",       value: file.isEncrypted ? "AES-GCM 256" : "None",        vColor: file.isEncrypted ? (isDark ? "text-emerald-400" : "text-emerald-600") : (isDark ? "text-red-400" : "text-red-500") },
            { Icon: Lock,        label: "Permission",       value: MY_PERMS.edit ? "Edit access" : "Read-only",      vColor: MY_PERMS.edit ? (isDark ? "text-cyan-400" : "text-cyan-600") : (isDark ? "text-amber-400" : "text-amber-600") },
            { Icon: CameraOff,   label: "Screen guard",     value: "Active",                                          vColor: isDark ? "text-emerald-400" : "text-emerald-600" },
            { Icon: Fingerprint, label: "Tamper detection", value: "Verified",                                        vColor: isDark ? "text-emerald-400" : "text-emerald-600" },
          ].map(({ Icon, label, value, vColor }) => (
            <div key={label} className={`flex items-center justify-between px-3 py-2 rounded-xl border ${isDark ? "bg-slate-900/40 border-slate-700/40" : "bg-gray-50 border-gray-100"}`}>
              <div className="flex items-center gap-2">
                <Icon className={`w-3.5 h-3.5 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                <span className={`text-xs ${isDark ? "text-gray-300" : "text-gray-700"}`}>{label}</span>
              </div>
              <span className={`text-xs font-bold ${vColor}`}>{value}</span>
            </div>
          ))}
        </div>

        <div className={`mx-4 my-3 h-px ${isDark ? "bg-slate-700/50" : "bg-gray-200"}`} />

        {/* Share link + badges + delete */}
        <div className="px-4 pb-4 space-y-2">
          <div className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border ${isDark ? "bg-slate-900/40 border-slate-700/40" : "bg-gray-50 border-gray-100"}`}>
            <div className="min-w-0 flex-1">
              <p className={`text-[9px] font-bold uppercase tracking-widest mb-0.5 ${isDark ? "text-gray-600" : "text-gray-400"}`}>Share Link</p>
              <p className={`text-[10px] font-mono truncate ${isDark ? "text-gray-400" : "text-gray-500"}`}>airvault.io/s/{file.id}</p>
            </div>
            <button onClick={() => onCopy(`https://airvault.io/s/${file.id}`)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border transition-all flex-shrink-0 ${
                copied
                  ? isDark ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-600"
                  : isDark ? "bg-slate-700/50 border-slate-600/50 text-gray-400 hover:text-white" : "bg-gray-100 border-gray-200 text-gray-600 hover:text-gray-900"
              }`}>
              {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <div className="flex gap-2 flex-wrap">
            {file.isEncrypted && (
              <span className={`flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full font-semibold border ${isDark ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-600"}`}>
                <Lock className="w-2.5 h-2.5" /> ZK Encrypted
              </span>
            )}
            {file.shared && (
              <span className={`flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full font-semibold border ${isDark ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-blue-50 border-blue-200 text-blue-600"}`}>
                <Share2 className="w-2.5 h-2.5" /> Shared
              </span>
            )}
            <span className={`flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full font-semibold border ${isDark ? "bg-slate-700/50 border-slate-600 text-gray-400" : "bg-gray-100 border-gray-200 text-gray-500"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${getFC(file.type).text.replace("text-","bg-").replace("/40","")}`} />
              {file.type}
            </span>
          </div>

          {MY_PERMS.delete && (
            <button onClick={() => onDelete(file.id)} disabled={isDel}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-semibold transition-all disabled:opacity-60 disabled:cursor-wait ${isDark ? "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/40" : "bg-red-50 border-red-100 text-red-500 hover:bg-red-100"}`}>
              {isDel ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              {isDel ? "Deleting…" : "Delete File"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   FolderNode — OUTSIDE FileView to prevent remount flicker
══════════════════════════════════════════════════════════ */
const FolderNode = ({ folder, depth, fileCounts, expandedFolders, activeFolderId, isDark, onSelect, onToggle, allFolders }) => {
  const children    = allFolders.filter(f => f.parent === folder.id);
  const hasChildren = children.length > 0;
  const isExpanded  = expandedFolders.has(folder.id);
  const isActive    = activeFolderId === folder.id;
  const fileCount   = fileCounts[folder.id] || 0;

  return (
    <div>
      <div
        onClick={() => { onSelect(folder.id); if (hasChildren) onToggle(folder.id); }}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
        className={`flex items-center gap-2 py-2 pr-3 rounded-xl cursor-pointer transition-all duration-200 group mb-0.5 ${
          isActive
            ? isDark ? "bg-indigo-500/20 text-indigo-300" : "bg-indigo-50 text-indigo-700"
            : isDark ? "text-gray-400 hover:bg-slate-700/50 hover:text-gray-200" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        }`}>
        {hasChildren
          ? <ChevronRight className={`w-3 h-3 flex-shrink-0 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`} />
          : <span className="w-3 flex-shrink-0" />}
        {isActive
          ? <FolderOpen className="w-3.5 h-3.5 flex-shrink-0 text-indigo-400" />
          : <Folder className={`w-3.5 h-3.5 flex-shrink-0 ${folder.restricted ? "text-amber-400" : isDark ? "text-gray-500" : "text-gray-400"}`} />}
        <span className="text-xs font-medium truncate flex-1">{folder.name}</span>
        {folder.restricted && <Lock className="w-2.5 h-2.5 text-amber-400 flex-shrink-0" />}
        <span className={`text-[10px] px-1.5 py-0.5 rounded-md flex-shrink-0 ${isDark ? "bg-slate-700 text-gray-500" : "bg-gray-200 text-gray-500"}`}>{fileCount}</span>
      </div>
      {isExpanded && hasChildren && (
        <div>
          {children.map(child => (
            <FolderNode
              key={child.id}
              folder={child}
              depth={depth + 1}
              fileCounts={fileCounts}
              expandedFolders={expandedFolders}
              activeFolderId={activeFolderId}
              isDark={isDark}
              onSelect={onSelect}
              onToggle={onToggle}
              allFolders={allFolders}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════════════════ */
const FileView = () => {
  const navigate        = useNavigate();
  const { isDark }      = useTheme();
  const { activeVault } = useVault();

  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const sidebarW = sidebarExpanded ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED;

  // ── data ───────────────────────────────────────────────────
  const [files,       setFiles]       = useState([]);
  const [folders,     setFolders]     = useState([]);
  const [storage,     setStorage]     = useState({ storageUsed: 0, storageLimit: 500 * 1024 * 1024 });
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [deletingId,  setDeletingId]  = useState(null);

  // ── UI ─────────────────────────────────────────────────────
  const [viewMode,        setViewMode]        = useState("grid");
  const [search,          setSearch]          = useState("");
  const [activeFolderId,  setActiveFolderId]  = useState("all");
  const [typeFilter,      setTypeFilter]      = useState("All");
  const [sortBy,          setSortBy]          = useState("date");
  const [sortAsc,         setSortAsc]         = useState(false);
  const [showFilter,      setShowFilter]      = useState(false);
  const [hoveredId,       setHoveredId]       = useState(null);
  const [expandedFolders, setExpandedFolders] = useState(new Set(["root"]));
  const [selectedFile,    setSelectedFile]    = useState(null);
  const [copied,          setCopied]          = useState(false);
  const [mousePosition,   setMousePosition]   = useState({ x: 0, y: 0 });

  // ── modal state ────────────────────────────────────────────
  const [shareFile,   setShareFile]   = useState(null);
  const [previewFile, setPreviewFile] = useState(null);

  // ── vault unlock state ─────────────────────────────────────
  const [vaultUnlocked,   setVaultUnlocked]   = useState(false);
  const [vaultCryptoKey,  setVaultCryptoKey]  = useState(null); // actual CryptoKey to pass to modal

  // Stable vault ID via ref — avoids stale closures
  const vaultIdRef = useRef(null);
  const filterRef  = useRef(null);
  const vaultId    = activeVault?.id || activeVault?._id || activeVault?.vaultId || null;
  vaultIdRef.current = vaultId;

  // ── auto-unlock vault ──────────────────────────────────────
  useEffect(() => {
    if (!activeVault) return;
    const id = activeVault?.id || activeVault?._id || activeVault?.vaultId;
    if (!id) return;

    const tryUnlock = async () => {
      // 1. Check if key is already cached (user visited FileUpload first)
      //    getVaultKey throws if not cached, so we wrap it safely
      try {
        const existing = getVaultKey(id);
        if (existing) {
          setVaultCryptoKey(existing);
          setVaultUnlocked(true);
          return;
        }
      } catch { /* not cached yet — continue */ }

      // 2. Passwordless vault → auto-derive key silently
      if (!activeVault.hasPassword) {
        try {
          let saltB64 = null;
          try {
            const token = localStorage.getItem("token") || sessionStorage.getItem("token");
            const r = await fetch(
              `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/vaults/${id}/zk-salt`,
              { headers: { Authorization: `Bearer ${token}` }, credentials: "include" }
            );
            if (r.ok) { const d = await r.json(); saltB64 = d.saltB64 || null; }
          } catch { /* no salt yet */ }

          const key = await unlockVaultKey(id, false, null, saltB64);
          setVaultCryptoKey(key);
          setVaultUnlocked(true);
        } catch (e) {
          console.warn("FileView: auto-unlock failed:", e.message);
        }
      }
      // Password vault with no cached key → leave locked.
      // User must visit Upload Files page to unlock first.
    };

    tryUnlock();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeVault?.id]);

  // Close type-filter dropdown when clicking outside
  useEffect(() => {
    if (!showFilter) return;
    const h = (e) => { if (filterRef.current && !filterRef.current.contains(e.target)) setShowFilter(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [showFilter]);

  useEffect(() => {
    const h = (e) => setMousePosition({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", h);
    return () => window.removeEventListener("mousemove", h);
  }, []);

  // ── data fetching ──────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    const id = vaultIdRef.current;
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [filesRes, foldersRes, storageRes] = await Promise.all([
        vaultApi.getVaultFiles(id),
        vaultApi.getFolders(id),
        vaultApi.getVaultStorage(id),
      ]);

      const normalizedFiles = (filesRes?.files || []).map(f => ({
        id:          f.id || f._id,
        folderId:    f.folderId || "root",
        name:        f.name || f.originalName,
        type:        getFileType(f.mimeType, f.name || f.originalName),
        mimeType:    f.mimeType,
        sizeBytes:   f.size,
        uploadedAt:  f.uploadedAt,
        isEncrypted: f.isEncrypted ?? true,
        category:    f.category || "General",
        tags:        Array.isArray(f.tags) ? f.tags : [],
        description: f.description || "",
        label:       f.label || "",
        shared:      f.shared ?? false,
        views:       f.views ?? 0,
        downloads:   f.downloads ?? 0,
      }));

      const normalizedFolders = (foldersRes?.folders || []).map(f => ({
        id:         f.id || f.folderId || f._id,
        name:       f.name,
        parent:     f.parentId ?? f.parent ?? null,
        restricted: f.restricted ?? false,
      }));
      if (!normalizedFolders.some(f => f.id === "root")) {
        normalizedFolders.unshift({ id: "root", name: "Vault Root", parent: null, restricted: false });
      }

      setFiles(normalizedFiles);
      setFolders(normalizedFolders);
      setStorage(storageRes || { storageUsed: 0, storageLimit: 500 * 1024 * 1024 });
      setExpandedFolders(prev => new Set([...prev, "root"]));
    } catch (e) {
      setError(e.message || "Failed to load files");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (vaultId) fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vaultId]);

  // ── folder helpers ─────────────────────────────────────────
  const toggleFolder = useCallback((id) => setExpandedFolders(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
  }), []);

  const handleFolderSelect = useCallback((folderId) => {
    setActiveFolderId(folderId); setSelectedFile(null);
  }, []);

  const getFolderById = useCallback((id) => folders.find(f => f.id === id), [folders]);
  const getFolderPath = useCallback((folderId) => {
    const path = []; let cur = getFolderById(folderId);
    while (cur) { path.unshift(cur); cur = getFolderById(cur.parent); }
    return path;
  }, [getFolderById]);

  const currentFolder    = activeFolderId === "all" ? null : getFolderById(activeFolderId);
  const folderRestricted = currentFolder?.restricted;
  const breadcrumb       = activeFolderId === "all" ? [] : getFolderPath(activeFolderId);

  const fileCounts = useMemo(() => {
    const counts = {};
    files.forEach(f => { counts[f.folderId] = (counts[f.folderId] || 0) + 1; });
    return counts;
  }, [files]);

  // ── file actions ───────────────────────────────────────────
  const handleDelete = useCallback(async (fileId) => {
    const id = vaultIdRef.current;
    if (!id) return;
    setDeletingId(fileId);
    try {
      await vaultApi.deleteVaultFile(id, fileId);
      setFiles(prev => prev.filter(f => f.id !== fileId));
      setSelectedFile(prev => (prev?.id === fileId ? null : prev));
      setPreviewFile(prev => (prev?.id === fileId ? null : prev));
    } catch (e) {
      console.error("Delete failed:", e.message);
    } finally {
      setDeletingId(null);
    }
  }, []);

  const handleDownload = useCallback(async (file) => {
    const id = vaultIdRef.current;
    if (!id) return;
    setDownloading(true);
    try {
      await vaultApi.downloadVaultFile(id, file.id, file.name, file.mimeType);
      setFiles(prev => prev.map(f => f.id === file.id ? { ...f, downloads: (f.downloads || 0) + 1 } : f));
      setSelectedFile(prev => prev?.id === file.id ? { ...prev, downloads: (prev.downloads || 0) + 1 } : prev);
    } catch (e) {
      console.error("Download failed:", e.message);
    } finally {
      setDownloading(false);
    }
  }, []);

  const handleCopy = useCallback((text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  // ── after share success: mark file as shared in local state ──
  const handleShareSuccess = useCallback((fileId) => {
    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, shared: true } : f));
    setSelectedFile(prev => prev?.id === fileId ? { ...prev, shared: true } : prev);
  }, []);

  // ── derived ────────────────────────────────────────────────
  const allTypes = useMemo(() => ["All", ...Array.from(new Set(files.map(f => f.type))).sort()], [files]);

  const visibleFiles = useMemo(() => {
    let list = [...files];
    if (activeFolderId !== "all") list = list.filter(f => f.folderId === activeFolderId);
    if (typeFilter !== "All")     list = list.filter(f => f.type === typeFilter);
    if (search)                   list = list.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));
    list.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "name") cmp = a.name.localeCompare(b.name);
      if (sortBy === "size") cmp = a.sizeBytes - b.sizeBytes;
      if (sortBy === "date") cmp = new Date(b.uploadedAt) - new Date(a.uploadedAt);
      return sortAsc ? -cmp : cmp;
    });
    return list;
  }, [files, activeFolderId, typeFilter, search, sortBy, sortAsc]);

  const totalSize   = useMemo(() => files.reduce((s, f) => s + (f.sizeBytes || 0), 0), [files]);
  const sharedCount = useMemo(() => files.filter(f => f.shared).length, [files]);
  const encCount    = useMemo(() => files.filter(f => f.isEncrypted).length, [files]);

  // ── styles ─────────────────────────────────────────────────
  const card = `rounded-2xl border backdrop-blur-xl shadow-xl transition-all duration-300 ${isDark ? "bg-slate-800/50 border-slate-700/50" : "bg-white/80 border-gray-200"}`;
  const sectionIcon = (gradient, Icon) => (
    <div className={`w-8 h-8 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}>
      <Icon className="w-4 h-4 text-white" />
    </div>
  );

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

  return (
    <div className={`h-screen w-full overflow-hidden transition-colors duration-500 ${isDark ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" : "bg-gradient-to-br from-gray-50 via-white to-gray-100"}`}>

      {/* Ambient blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-1/4 -left-1/4 w-96 h-96 ${isDark ? "bg-cyan-500/5" : "bg-cyan-500/3"} rounded-full blur-3xl animate-pulse`} />
        <div className={`absolute bottom-1/4 -right-1/4 w-96 h-96 ${isDark ? "bg-indigo-500/5" : "bg-indigo-500/3"} rounded-full blur-3xl animate-pulse`} style={{ animationDelay: "1s" }} />
      </div>

      {/* Cursor glow */}
      <div className="hidden lg:block fixed w-80 h-80 rounded-full pointer-events-none z-0 mix-blend-screen"
        style={{
          background: isDark
            ? "radial-gradient(circle, rgba(56,189,248,0.07) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(56,189,248,0.05) 0%, transparent 70%)",
          left: mousePosition.x - 160, top: mousePosition.y - 160,
          transition: "all 0.4s ease-out",
        }} />

      <VaultTopBar />
      <HamburgerMenu />

      <motion.main
        initial={false}
        animate={{ marginLeft: sidebarW }}
        transition={{ type: "spring", damping: 24, stiffness: 280 }}
        className="relative z-10 flex h-[calc(100vh-4rem)] mt-16">
        <div className="flex-1 overflow-y-auto vault-scrollbar">
          <div className="max-w-[1700px] mx-auto px-3 sm:px-5 lg:px-6 py-5 sm:py-7 space-y-5">

            {/* Heading */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/30 hover:rotate-6 hover:scale-110 transition-all duration-500 cursor-default flex-shrink-0">
                  <Database className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>
                    {activeVault?.name} Files
                  </h1>
                  <p className={`text-xs sm:text-sm mt-0.5 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                    {loading ? "Loading…" : `${files.length} files · ${formatBytes(totalSize)} total`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button onClick={fetchAll} disabled={loading} title="Refresh"
                  className={`p-2.5 rounded-xl border transition-all ${isDark ? "bg-slate-800/50 border-slate-700/50 text-gray-400 hover:text-white hover:border-cyan-500/40" : "bg-white/80 border-gray-200 text-gray-500 hover:border-cyan-400"}`}>
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                </button>
                {MY_PERMS.upload && (
                  <button onClick={() => navigate("/vault/fileupload")}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-[1.02] transition-all duration-300">
                    <Upload className="w-4 h-4" /> Upload Files
                  </button>
                )}
              </div>
            </motion.div>

            {/* Error */}
            {error && (
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${isDark ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-red-50 border-red-200 text-red-600"}`}>
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                <button onClick={fetchAll} className="ml-auto text-xs font-semibold underline">Retry</button>
              </div>
            )}

            {/* Skeleton */}
            {loading && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[0,1,2,3].map(i => (
                  <div key={i} className={`h-28 rounded-2xl border animate-pulse ${isDark ? "bg-slate-800/50 border-slate-700/50" : "bg-white/80 border-gray-200"}`} />
                ))}
              </div>
            )}

            {/* Stat cards */}
            {!loading && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Total Files",  value: files.length,                    Icon: FileText,  color: "from-cyan-500 to-blue-600",     bar: Math.min((files.length / 20) * 100, 100) },
                  { label: "Storage Used", value: formatBytes(storage.storageUsed), Icon: HardDrive, color: "from-blue-600 to-indigo-600",   bar: Math.min((storage.storageUsed / storage.storageLimit) * 100, 100) },
                  { label: "Shared",       value: sharedCount,                      Icon: Share2,    color: "from-indigo-500 to-violet-600", bar: files.length ? (sharedCount / files.length) * 100 : 0 },
                  { label: "Encrypted",    value: `${encCount}/${files.length}`,    Icon: Shield,    color: "from-emerald-500 to-teal-600",  bar: files.length ? (encCount / files.length) * 100 : 0 },
                ].map(({ label, value, Icon, color, bar }, i) => (
                  <motion.div key={label}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }} whileHover={{ y: -3 }}
                    className={`group relative ${card} p-4 overflow-hidden cursor-default`}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                    <div className="relative">
                      <div className={`inline-flex bg-gradient-to-br ${color} w-9 h-9 rounded-xl items-center justify-center shadow-lg mb-2 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <p className={`text-[9px] font-bold uppercase tracking-widest mb-0.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>{label}</p>
                      <p className={`text-lg font-bold bg-gradient-to-r ${color} bg-clip-text text-transparent`}>{value}</p>
                      <div className={`mt-2 h-1 rounded-full overflow-hidden ${isDark ? "bg-slate-700" : "bg-gray-200"}`}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(bar, 100)}%` }}
                          transition={{ duration: 1.2, delay: i * 0.1, ease: "easeOut" }}
                          className={`h-full rounded-full bg-gradient-to-r ${color}`} />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Three-panel layout */}
            {!loading && (
              <div className={`grid gap-4 sm:gap-5 transition-[grid-template-columns] duration-300 ${selectedFile ? "lg:grid-cols-12" : "lg:grid-cols-4"}`}>

                {/* ── Folder tree ── */}
                <motion.div
                  initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.45, delay: 0.35, ease: "easeOut" }}
                  className={`${selectedFile ? "lg:col-span-2" : "lg:col-span-1"} ${card} overflow-hidden self-start`}>
                  <div className="h-[2px] bg-gradient-to-r from-indigo-500 via-violet-600 to-purple-600" />
                  <div className={`px-3 py-3 border-b flex items-center gap-2 ${isDark ? "border-slate-700/50" : "border-gray-200"}`}>
                    {sectionIcon("from-indigo-500 to-violet-600", Folder)}
                    <span className={`text-xs font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Folders</span>
                  </div>
                  <div className="p-2 vault-scrollbar overflow-y-auto" style={{ maxHeight: 360 }}>
                    <div onClick={() => handleFolderSelect("all")}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer transition-all mb-1 ${
                        activeFolderId === "all"
                          ? isDark ? "bg-cyan-500/20 text-cyan-300" : "bg-cyan-50 text-cyan-700"
                          : isDark ? "text-gray-400 hover:bg-slate-700/50 hover:text-gray-200" : "text-gray-600 hover:bg-gray-100"
                      }`}>
                      <Database className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="text-xs font-semibold flex-1">All Files</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${isDark ? "bg-slate-700 text-gray-500" : "bg-gray-200 text-gray-500"}`}>{files.length}</span>
                    </div>
                    <div className={`my-1.5 h-px ${isDark ? "bg-slate-700/50" : "bg-gray-200"}`} />
                    {folders.filter(f => f.parent === null).map(folder => (
                      <FolderNode
                        key={folder.id}
                        folder={folder}
                        depth={0}
                        fileCounts={fileCounts}
                        expandedFolders={expandedFolders}
                        activeFolderId={activeFolderId}
                        isDark={isDark}
                        onSelect={handleFolderSelect}
                        onToggle={toggleFolder}
                        allFolders={folders}
                      />
                    ))}
                  </div>
                </motion.div>

                {/* ── File browser ── */}
                <motion.div
                  initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.45, ease: "easeOut" }}
                  className={`${selectedFile ? "lg:col-span-6" : "lg:col-span-3"} flex flex-col gap-4`}>

                  {/* Search + controls — NOTE: no overflow-hidden so the type dropdown can escape */}
                  <div className={`${card}`}>
                    <div className="h-[2px] bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 rounded-t-2xl" />
                    <div className="px-4 py-3 space-y-3">

                      {breadcrumb.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap">
                          <button onClick={() => handleFolderSelect("all")}
                            className={`text-[10px] font-semibold px-2 py-1 rounded-lg transition-all ${isDark ? "text-gray-500 hover:text-gray-300 hover:bg-slate-700/50" : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"}`}>
                            All Files
                          </button>
                          {breadcrumb.map((f, i) => (
                            <div key={f.id} className="flex items-center gap-1">
                              <ChevronRight className={`w-3 h-3 ${isDark ? "text-gray-600" : "text-gray-400"}`} />
                              <button onClick={() => handleFolderSelect(f.id)}
                                className={`text-[10px] font-semibold px-2 py-1 rounded-lg transition-all ${
                                  i === breadcrumb.length - 1
                                    ? isDark ? "bg-indigo-500/15 text-indigo-400" : "bg-indigo-50 text-indigo-600"
                                    : isDark ? "text-gray-500 hover:text-gray-300 hover:bg-slate-700/50" : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                                }`}>{f.name}</button>
                            </div>
                          ))}
                        </div>
                      )}

                      {folderRestricted && (
                        <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs ${isDark ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-red-50 border-red-200 text-red-600"}`}>
                          <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                          You don't have permission to view this folder's contents.
                        </div>
                      )}

                      <div className="flex gap-2 flex-wrap">
                        <div className="flex-1 min-w-[160px] relative">
                          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isDark ? "text-gray-400" : "text-gray-500"}`} />
                          <input type="text" placeholder="Search files…" value={search} onChange={e => setSearch(e.target.value)}
                            className={`w-full pl-9 pr-4 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-all ${isDark ? "bg-slate-700/50 border-slate-600/50 text-white placeholder-gray-500 hover:border-cyan-500/30" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 hover:border-cyan-400"}`} />
                          {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2"><X className={`w-3 h-3 ${isDark ? "text-gray-500" : "text-gray-400"}`} /></button>}
                        </div>

                        <div className="relative" ref={filterRef}>
                          <button onClick={() => setShowFilter(v => !v)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${showFilter || typeFilter !== "All"
                              ? isDark ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-400" : "bg-indigo-50 border-indigo-300 text-indigo-600"
                              : isDark ? "bg-slate-700/50 border-slate-600/50 text-gray-400" : "bg-gray-50 border-gray-200 text-gray-600"}`}>
                            <Filter className="w-3.5 h-3.5" />
                            {typeFilter !== "All" ? typeFilter : "Type"}
                          </button>
                          <AnimatePresence>
                            {showFilter && (
                              <motion.div initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.97 }} transition={{ duration: 0.15 }}
                                className={`absolute right-0 top-full mt-1.5 z-50 rounded-xl border shadow-2xl overflow-hidden min-w-[120px] ${isDark ? "bg-slate-900 border-slate-700/60" : "bg-white border-gray-200"}`}>
                                <div className="h-[2px] bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600" />
                                {allTypes.map(t => (
                                  <button key={t} onClick={() => { setTypeFilter(t); setShowFilter(false); }}
                                    className={`w-full text-left px-3 py-2 text-xs transition-all flex items-center justify-between gap-2 ${t === typeFilter ? isDark ? "bg-cyan-500/15 text-cyan-400 font-semibold" : "bg-cyan-50 text-cyan-600 font-semibold" : isDark ? "text-gray-300 hover:bg-slate-800" : "text-gray-700 hover:bg-gray-50"}`}>
                                    {t}{t === typeFilter && <CheckCircle className="w-3 h-3 text-cyan-400" />}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {["date","name","size"].map(key => (
                          <button key={key} onClick={() => { if (sortBy === key) setSortAsc(v => !v); else { setSortBy(key); setSortAsc(false); } }}
                            className={`px-2.5 py-2 rounded-xl border text-[10px] font-semibold capitalize transition-all ${sortBy === key
                              ? isDark ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-400" : "bg-cyan-50 border-cyan-300 text-cyan-600"
                              : isDark ? "bg-slate-700/50 border-slate-600/50 text-gray-500 hover:text-gray-300" : "bg-gray-50 border-gray-200 text-gray-400 hover:text-gray-700"}`}>
                            {key}{sortBy === key && (sortAsc ? " ↑" : " ↓")}
                          </button>
                        ))}

                        <div className={`flex items-center gap-0.5 rounded-xl border p-1 ${isDark ? "bg-slate-700/50 border-slate-600/50" : "bg-gray-100 border-gray-200"}`}>
                          {[{ v: "grid", Icon: Grid3X3 }, { v: "list", Icon: List }].map(({ v, Icon }) => (
                            <button key={v} onClick={() => setViewMode(v)}
                              className={`p-1.5 rounded-lg transition-all ${viewMode === v ? isDark ? "bg-indigo-500/20 text-indigo-400" : "bg-indigo-100 text-indigo-600" : isDark ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-700"}`}>
                              <Icon className="w-4 h-4" />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <p className={`text-[10px] ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                          {visibleFiles.length} file{visibleFiles.length !== 1 ? "s" : ""}
                          {currentFolder && <span className={`ml-1 ${isDark ? "text-indigo-400" : "text-indigo-600"}`}>in {currentFolder.name}</span>}
                          {selectedFile && <span className={`ml-2 px-1.5 py-0.5 rounded ${isDark ? "bg-cyan-500/10 text-cyan-400" : "bg-cyan-50 text-cyan-600"}`}>· 1 selected</span>}
                        </p>
                        {(search || typeFilter !== "All") && (
                          <button onClick={() => { setSearch(""); setTypeFilter("All"); }}
                            className={`text-[10px] font-semibold ${isDark ? "text-gray-500 hover:text-cyan-400" : "text-gray-400 hover:text-cyan-600"}`}>Clear</button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Empty state */}
                  {!folderRestricted && visibleFiles.length === 0 && (
                    <div className={`py-16 flex flex-col items-center justify-center text-center ${card}`}>
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${isDark ? "bg-slate-700/50" : "bg-gray-100"}`}>
                        <AlertCircle className={`w-7 h-7 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                      </div>
                      <p className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                        {files.length === 0 ? "No files yet" : "No files found"}
                      </p>
                      <p className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                        {files.length === 0 ? "Upload files to this vault to get started" : "Try adjusting your search or filters"}
                      </p>
                      {files.length === 0 && (
                        <button onClick={() => navigate("/vault/fileupload")}
                          className="mt-4 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:scale-[1.03] transition-all duration-300">
                          Upload Files
                        </button>
                      )}
                    </div>
                  )}

                  {/* Grid */}
                  {!folderRestricted && viewMode === "grid" && visibleFiles.length > 0 && (
                    <div className={`grid gap-3 ${selectedFile ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"}`}>
                      {visibleFiles.map((file) => {
                        const ft    = getFC(file.type);
                        const FIcon = ft.Icon;
                        const isSel = selectedFile?.id === file.id;
                        const isDel = deletingId === file.id;
                        return (
                          <div key={file.id}
                            onMouseEnter={() => setHoveredId(file.id)}
                            onMouseLeave={() => setHoveredId(null)}
                            onClick={() => !isDel && setSelectedFile(isSel ? null : file)}
                            className={`group relative rounded-2xl border backdrop-blur-xl cursor-pointer p-4 overflow-hidden transition-all duration-300 hover:-translate-y-1 shadow-xl ${
                              isSel
                                ? isDark ? "bg-cyan-500/10 border-cyan-500/40 shadow-cyan-500/10" : "bg-cyan-50 border-cyan-400 shadow-cyan-500/10"
                                : isDark ? "bg-slate-800/50 border-slate-700/50 hover:border-cyan-500/40 hover:shadow-cyan-500/10" : "bg-white/80 border-gray-200 hover:border-cyan-500/50"
                            } ${isDel ? "opacity-50 pointer-events-none" : ""}`}>
                            {isSel && (
                              <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg z-10">
                                <CheckCircle className="w-3 h-3 text-white" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-blue-600/0 group-hover:from-cyan-500/5 group-hover:to-blue-600/5 rounded-2xl transition-all duration-500 pointer-events-none" />
                            <div className="relative">
                              <div className="flex items-start justify-between mb-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${ft.gradient} shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                                  <FIcon className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex items-center gap-1 flex-wrap justify-end">
                                  {file.isEncrypted && <Lock className={`w-3 h-3 ${isDark ? "text-emerald-400" : "text-emerald-500"}`} />}
                                  {file.shared      && <Share2 className={`w-3 h-3 ${isDark ? "text-blue-400" : "text-blue-500"}`} />}
                                </div>
                              </div>
                              <span className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase mb-1.5 border ${ft.bg} ${ft.border} ${ft.text}`}>{file.type}</span>
                              <p className={`font-semibold text-sm mb-1 truncate ${isDark ? "text-white" : "text-gray-900"}`}>{file.name}</p>
                              <p className={`text-[10px] mb-3 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                                {formatBytes(file.sizeBytes)} · {new Date(file.uploadedAt).toLocaleDateString()}
                              </p>
                              <AnimatePresence>
                                {hoveredId === file.id && !isSel && (
                                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                                    className={`overflow-hidden mb-3 text-[10px] px-2 py-1.5 rounded-lg flex items-center gap-3 ${isDark ? "bg-slate-700/60 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
                                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{file.views}</span>
                                    <span className="flex items-center gap-1"><Download className="w-3 h-3" />{file.downloads}</span>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                              <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
                                <button onClick={() => setSelectedFile(isSel ? null : file)}
                                  className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-semibold border transition-all ${isSel
                                    ? isDark ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300" : "bg-cyan-100 border-cyan-300 text-cyan-700"
                                    : isDark ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20" : "bg-cyan-50 border-cyan-200 text-cyan-600 hover:bg-cyan-100"}`}>
                                  <Eye className="w-3 h-3" /> {isSel ? "Close" : "View"}
                                </button>
                                {MY_PERMS.canDownload && (
                                  <button onClick={() => handleDownload(file)} disabled={downloading}
                                    className={`flex items-center justify-center p-1.5 rounded-lg border transition-all disabled:opacity-50 ${isDark ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20" : "bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100"}`}>
                                    {downloading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                                  </button>
                                )}
                                {/* Share button — grid card */}
                                {MY_PERMS.share && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setShareFile(file); }}
                                    className={`flex items-center justify-center p-1.5 rounded-lg border transition-all ${isDark ? "bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20" : "bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100"}`}>
                                    <Share2 className="w-3 h-3" />
                                  </button>
                                )}
                                {MY_PERMS.delete && (
                                  <button onClick={() => handleDelete(file.id)} disabled={isDel}
                                    className={`flex items-center justify-center p-1.5 rounded-lg border transition-all disabled:opacity-50 ${isDark ? "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20" : "bg-red-50 border-red-100 text-red-500 hover:bg-red-100"}`}>
                                    {isDel ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* List */}
                  {!folderRestricted && viewMode === "list" && visibleFiles.length > 0 && (
                    <div className={`${card} overflow-hidden`}>
                      <div className={`grid grid-cols-12 gap-2 px-4 py-2.5 border-b text-[10px] font-bold uppercase tracking-widest ${isDark ? "border-slate-700/50 text-gray-500" : "border-gray-200 text-gray-400"}`}>
                        <span className="col-span-5">File</span>
                        <span className="col-span-2 hidden sm:block">Type</span>
                        <span className="col-span-2 hidden md:block">Size</span>
                        <span className="col-span-2 hidden lg:block">Date</span>
                        <span className="col-span-1 text-right">Act.</span>
                      </div>
                      {visibleFiles.map((file) => {
                        const ft    = getFC(file.type);
                        const FIcon = ft.Icon;
                        const isSel = selectedFile?.id === file.id;
                        const isDel = deletingId === file.id;
                        return (
                          <div key={file.id}
                            onClick={() => !isDel && setSelectedFile(isSel ? null : file)}
                            className={`grid grid-cols-12 gap-2 items-center px-4 py-3 border-b cursor-pointer transition-all duration-200 group ${
                              isSel
                                ? isDark ? "bg-cyan-500/10 border-cyan-500/20" : "bg-cyan-50"
                                : isDark ? "border-slate-700/30 hover:bg-slate-700/30" : "border-gray-100 hover:bg-gray-50"
                            } ${isDel ? "opacity-50 pointer-events-none" : ""}`}>
                            <div className="col-span-5 flex items-center gap-3 min-w-0">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${ft.gradient} shadow-md flex-shrink-0 group-hover:scale-110 transition-all duration-300`}>
                                <FIcon className="w-4 h-4 text-white" />
                              </div>
                              <div className="min-w-0">
                                <p className={`text-xs font-semibold truncate ${isDark ? "text-white" : "text-gray-900"}`}>{file.name}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  {file.isEncrypted && <Lock className={`w-2.5 h-2.5 ${isDark ? "text-emerald-400" : "text-emerald-500"}`} />}
                                  {file.shared      && <Share2 className={`w-2.5 h-2.5 ${isDark ? "text-blue-400" : "text-blue-500"}`} />}
                                  {isSel            && <CheckCircle className="w-2.5 h-2.5 text-cyan-400" />}
                                </div>
                              </div>
                            </div>
                            <div className="col-span-2 hidden sm:block">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${ft.bg} ${ft.border} ${ft.text}`}>{file.type}</span>
                            </div>
                            <div className="col-span-2 hidden md:block">
                              <span className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>{formatBytes(file.sizeBytes)}</span>
                            </div>
                            <div className="col-span-2 hidden lg:block">
                              <span className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                            </div>
                            <div className="col-span-1 flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                              {MY_PERMS.canDownload && (
                                <button onClick={() => handleDownload(file)} disabled={downloading}
                                  className={`p-1.5 rounded-lg transition-all disabled:opacity-50 ${isDark ? "hover:bg-emerald-500/20 text-emerald-400" : "hover:bg-emerald-100 text-emerald-600"}`}>
                                  {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                                </button>
                              )}
                              {/* Share button — list row */}
                              {MY_PERMS.share && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setShareFile(file); }}
                                  className={`p-1.5 rounded-lg transition-all ${isDark ? "hover:bg-blue-500/20 text-blue-400" : "hover:bg-blue-100 text-blue-600"}`}>
                                  <Share2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {MY_PERMS.delete && (
                                <button onClick={() => handleDelete(file.id)} disabled={isDel}
                                  className={`p-1.5 rounded-lg transition-all disabled:opacity-50 ${isDark ? "hover:bg-red-500/20 text-red-400" : "hover:bg-red-100 text-red-500"}`}>
                                  {isDel ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>

                {/* ── Inline viewer ── */}
                <AnimatePresence>
                  {selectedFile && (
                    <motion.div key={selectedFile.id}
                      initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }} className="lg:col-span-4">
                      <FileViewer
                        file={selectedFile}
                        onClose={() => setSelectedFile(null)}
                        onDelete={handleDelete}
                        onDownload={handleDownload}
                        onShare={(f) => setShareFile(f)}
                        onPreview={(f) => setPreviewFile(f)}
                        copied={copied}
                        onCopy={handleCopy}
                        isDark={isDark}
                        downloading={downloading}
                        deletingId={deletingId}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            )}
          </div>
        </div>
      </motion.main>

      {/* ── Share Modal ── */}
      <AnimatePresence>
        {shareFile && (
          <ShareModal
            key={shareFile.id}
            file={shareFile}
            onClose={() => setShareFile(null)}
            onShareSuccess={() => handleShareSuccess(shareFile.id)}
            isDark={isDark}
            vaultId={vaultId}
            apiBaseUrl={import.meta.env.VITE_API_URL || "http://localhost:5000/api"}
          />
        )}
      </AnimatePresence>

      {/* ── File Preview Modal ── */}
      <AnimatePresence>
        {previewFile && (
          <FilePreviewModal
            key={previewFile.id}
            file={previewFile}
            onClose={() => setPreviewFile(null)}
            onDownload={handleDownload}
            isDark={isDark}
            vaultId={vaultId}
            apiBaseUrl={import.meta.env.VITE_API_URL || "http://localhost:5000/api"}
            canDownload={MY_PERMS.canDownload}
            vaultKey={vaultCryptoKey}
          />
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

export default FileView;