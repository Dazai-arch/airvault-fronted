import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, FileImage, Archive, Video, Music, Code, File,
  Folder, FolderOpen, Search, Grid3X3, List, Upload, Lock,
  Eye, Download, Share2, Trash2, ChevronRight, X,
  Shield, Database, HardDrive, Filter, CheckCircle,
  AlertCircle, Clock, Activity, Fingerprint, CameraOff,
  Key, User, Copy,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useVault } from "../context/VaultContext";
import VaultTopBar from "../components/layout/VaultTopBar";
import HamburgerMenu from "../components/layout/HamburgerMenu";

const SIDEBAR_COLLAPSED = 60;
const SIDEBAR_EXPANDED  = 220;

/* ─── helpers ─── */
const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const k = 1024, sizes = ["B","KB","MB","GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / k ** i).toFixed(bytes / k ** i >= 10 ? 0 : 1)} ${sizes[i]}`;
};

const FILE_TYPE_CONFIG = {
  PDF:          { Icon: FileText,  gradient: "from-red-500 to-rose-600",      color: "#f87171", bg: "bg-red-500/10",     border: "border-red-500/20",     text: "text-red-400"     },
  Image:        { Icon: FileImage, gradient: "from-violet-500 to-purple-600", color: "#a78bfa", bg: "bg-violet-500/10",  border: "border-violet-500/20",  text: "text-violet-400"  },
  Video:        { Icon: Video,     gradient: "from-pink-500 to-rose-600",     color: "#f472b6", bg: "bg-pink-500/10",    border: "border-pink-500/20",    text: "text-pink-400"    },
  Audio:        { Icon: Music,     gradient: "from-lime-500 to-green-600",    color: "#a3e635", bg: "bg-lime-500/10",    border: "border-lime-500/20",    text: "text-lime-400"    },
  Archive:      { Icon: Archive,   gradient: "from-cyan-500 to-blue-600",     color: "#22d3ee", bg: "bg-cyan-500/10",    border: "border-cyan-500/20",    text: "text-cyan-400"    },
  Code:         { Icon: Code,      gradient: "from-sky-500 to-cyan-600",      color: "#38bdf8", bg: "bg-sky-500/10",     border: "border-sky-500/20",     text: "text-sky-400"     },
  Word:         { Icon: FileText,  gradient: "from-blue-500 to-indigo-600",   color: "#60a5fa", bg: "bg-blue-500/10",    border: "border-blue-500/20",    text: "text-blue-400"    },
  Excel:        { Icon: FileText,  gradient: "from-emerald-500 to-teal-600",  color: "#34d399", bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400" },
  Presentation: { Icon: FileText,  gradient: "from-orange-500 to-amber-600",  color: "#fb923c", bg: "bg-orange-500/10",  border: "border-orange-500/20",  text: "text-orange-400"  },
  Text:         { Icon: FileText,  gradient: "from-gray-500 to-slate-600",    color: "#94a3b8", bg: "bg-gray-500/10",    border: "border-gray-500/20",    text: "text-gray-400"    },
};
const getFC = (type) => FILE_TYPE_CONFIG[type] || {
  Icon: File, gradient: "from-slate-500 to-gray-600", color: "#94a3b8",
  bg: "bg-slate-500/10", border: "border-slate-500/20", text: "text-slate-400",
};

/* ─── seed data ─── */
const FOLDERS_DATA = [
  { id: "root",  name: "Vault Root",       parent: null,   permission: "edit", restricted: false },
  { id: "f1",    name: "Contracts",        parent: "root", permission: "edit", restricted: false },
  { id: "f1-1",  name: "2025 Contracts",   parent: "f1",   permission: "edit", restricted: false },
  { id: "f1-2",  name: "Legal Documents",  parent: "f1",   permission: "read", restricted: true  },
  { id: "f2",    name: "Media",            parent: "root", permission: "edit", restricted: false },
  { id: "f2-1",  name: "Press Kits",       parent: "f2",   permission: "edit", restricted: false },
  { id: "f3",    name: "Finance",          parent: "root", permission: "read", restricted: false },
];

const INIT_FILES = [
  { id: "fi-1",  folderId: "root", name: "Project_Proposal.pdf",     type: "PDF",     sizeBytes: 2.4*1024*1024,  uploadDate: "2026-02-15", encrypted: true,  views: 45,  downloads: 12, shared: true  },
  { id: "fi-2",  folderId: "root", name: "Architecture_Diagram.png", type: "Image",   sizeBytes: 5.1*1024*1024,  uploadDate: "2026-02-14", encrypted: true,  views: 78,  downloads: 23, shared: true  },
  { id: "fi-3",  folderId: "f1",   name: "NDA_Agreement_2025.pdf",   type: "PDF",     sizeBytes: 1.2*1024*1024,  uploadDate: "2026-02-13", encrypted: true,  views: 12,  downloads: 3,  shared: false },
  { id: "fi-4",  folderId: "f1",   name: "Service_Terms.docx",       type: "Word",    sizeBytes: 0.9*1024*1024,  uploadDate: "2026-02-12", encrypted: true,  views: 8,   downloads: 2,  shared: false },
  { id: "fi-5",  folderId: "f1",   name: "Contract_Summary.xlsx",    type: "Excel",   sizeBytes: 0.89*1024*1024, uploadDate: "2026-02-11", encrypted: true,  views: 5,   downloads: 1,  shared: false },
  { id: "fi-6",  folderId: "f1-1", name: "Master_MSA_2025.pdf",      type: "PDF",     sizeBytes: 3.7*1024*1024,  uploadDate: "2026-02-10", encrypted: true,  views: 34,  downloads: 8,  shared: true  },
  { id: "fi-7",  folderId: "f2",   name: "Brand_Assets.zip",         type: "Archive", sizeBytes: 12.4*1024*1024, uploadDate: "2026-02-09", encrypted: true,  views: 156, downloads: 45, shared: true  },
  { id: "fi-8",  folderId: "f2",   name: "Product_Demo.mp4",         type: "Video",   sizeBytes: 48.2*1024*1024, uploadDate: "2026-02-08", encrypted: true,  views: 22,  downloads: 5,  shared: false },
  { id: "fi-9",  folderId: "f2-1", name: "Launch_Photoshoot.png",    type: "Image",   sizeBytes: 5.1*1024*1024,  uploadDate: "2026-02-07", encrypted: true,  views: 9,   downloads: 2,  shared: false },
  { id: "fi-10", folderId: "f3",   name: "Financial_Report_Q1.xlsx", type: "Excel",   sizeBytes: 3.7*1024*1024,  uploadDate: "2026-02-06", encrypted: true,  views: 11,  downloads: 3,  shared: true  },
  { id: "fi-11", folderId: "root", name: "api_handler.py",           type: "Code",    sizeBytes: 34*1024,        uploadDate: "2026-02-05", encrypted: true,  views: 6,   downloads: 1,  shared: false },
  { id: "fi-12", folderId: "root", name: "README.md",                type: "Text",    sizeBytes: 18*1024,        uploadDate: "2026-02-04", encrypted: false, views: 3,   downloads: 1,  shared: false },
];

const MY_PERMS = { view: true, upload: true, edit: true, delete: true, share: true, canDownload: true };

/* ══════════════════════════════════════════════════════════
   FileViewer — defined OUTSIDE FileView so it is never
   re-created on every render (fixes the "bulb" flicker)
══════════════════════════════════════════════════════════ */
const FileViewer = ({ file, onClose, onDelete, copied, onCopy, isDark }) => {
  const ft    = getFC(file.type);
  const FIcon = ft.Icon;

  const card = `rounded-2xl border backdrop-blur-xl shadow-xl transition-all duration-300 ${isDark ? "bg-slate-800/50 border-slate-700/50" : "bg-white/80 border-gray-200"}`;

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
            <p className={`text-[10px] ${isDark ? "text-gray-400" : "text-gray-500"}`}>{formatBytes(file.sizeBytes)} · {file.uploadDate}</p>
          </div>
        </div>
        <button onClick={onClose}
          className={`p-1.5 rounded-xl flex-shrink-0 transition-all ${isDark ? "hover:bg-slate-700 text-gray-400 hover:text-white" : "hover:bg-gray-100 text-gray-500"}`}>
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto vault-scrollbar">

        {/* Preview box */}
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
                {MY_PERMS.edit ? "Full access enabled" : "View only — edit requires permission"}
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

        {/* Action buttons */}
        <div className="flex gap-2 px-4 pb-4">
          <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:scale-[1.02] transition-all duration-300">
            <Eye className="w-3.5 h-3.5" /> Open Full
          </button>
          {MY_PERMS.canDownload && (
            <button className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border transition-all ${isDark ? "bg-slate-700/50 border-slate-600/50 text-gray-300 hover:border-cyan-500/40 hover:text-white" : "bg-gray-100 border-gray-200 text-gray-700 hover:border-cyan-400"}`}>
              <Download className="w-3.5 h-3.5" /> Download
            </button>
          )}
          {MY_PERMS.share && (
            <button className={`flex items-center justify-center p-2 rounded-xl border transition-all ${isDark ? "bg-slate-700/50 border-slate-600/50 text-gray-400 hover:border-blue-500/40 hover:text-blue-400" : "bg-gray-100 border-gray-200 text-gray-500 hover:border-blue-400 hover:text-blue-600"}`}>
              <Share2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className={`mx-4 mb-4 h-px ${isDark ? "bg-slate-700/50" : "bg-gray-200"}`} />

        {/* File details */}
        <div className="px-4 pb-2 space-y-2">
          <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${isDark ? "text-gray-500" : "text-gray-400"}`}>File Details</p>
          {[
            { Icon: User,      label: "Owner",    value: "You"                                         },
            { Icon: Clock,     label: "Uploaded", value: file.uploadDate                               },
            { Icon: HardDrive, label: "Size",     value: formatBytes(file.sizeBytes)                   },
            { Icon: Eye,       label: "Activity", value: `${file.views} views · ${file.downloads} dl`  },
          ].map(({ Icon, label, value }) => (
            <div key={label} className={`flex items-center gap-3 px-3 py-2 rounded-xl border ${isDark ? "bg-slate-900/40 border-slate-700/40" : "bg-gray-50 border-gray-100"}`}>
              <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
              <div className="min-w-0 flex-1">
                <p className={`text-[9px] font-bold uppercase tracking-widest ${isDark ? "text-gray-600" : "text-gray-400"}`}>{label}</p>
                <p className={`text-xs font-semibold truncate ${isDark ? "text-white" : "text-gray-900"}`}>{value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className={`mx-4 my-3 h-px ${isDark ? "bg-slate-700/50" : "bg-gray-200"}`} />

        {/* Security */}
        <div className="px-4 pb-2 space-y-2">
          <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${isDark ? "text-gray-500" : "text-gray-400"}`}>Security</p>
          {[
            { Icon: Key,         label: "Encryption",       value: file.encrypted ? "AES-256" : "None",         vColor: file.encrypted ? (isDark ? "text-emerald-400" : "text-emerald-600") : (isDark ? "text-red-400" : "text-red-500") },
            { Icon: Lock,        label: "Permission",       value: MY_PERMS.edit ? "Edit access" : "Read-only", vColor: MY_PERMS.edit ? (isDark ? "text-cyan-400" : "text-cyan-600") : (isDark ? "text-amber-400" : "text-amber-600") },
            { Icon: CameraOff,   label: "Screen guard",     value: "Active",                                     vColor: isDark ? "text-emerald-400" : "text-emerald-600" },
            { Icon: Fingerprint, label: "Tamper detection", value: "Verified",                                   vColor: isDark ? "text-emerald-400" : "text-emerald-600" },
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

        {/* Share + delete */}
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
            {file.encrypted && (
              <span className={`flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full font-semibold border ${isDark ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-600"}`}>
                <Lock className="w-2.5 h-2.5" /> Encrypted
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
            <button onClick={() => onDelete(file.id)}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-semibold transition-all ${isDark ? "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/40" : "bg-red-50 border-red-100 text-red-500 hover:bg-red-100"}`}>
              <Trash2 className="w-3.5 h-3.5" /> Delete File
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   FolderNode — also defined OUTSIDE to prevent re-creation
══════════════════════════════════════════════════════════ */
const FolderNode = ({ folder, depth, files, expandedFolders, activeFolderId, isDark, onSelect, onToggle }) => {
  const children    = FOLDERS_DATA.filter(f => f.parent === folder.id);
  const hasChildren = children.length > 0;
  const isExpanded  = expandedFolders.has(folder.id);
  const isActive    = activeFolderId === folder.id;
  const fileCount   = files.filter(f => f.folderId === folder.id).length;

  return (
    <div>
      <div
        onClick={() => { onSelect(folder.id); if (hasChildren) onToggle(folder.id); }}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
        className={`flex items-center gap-2 py-2 pr-3 rounded-xl cursor-pointer transition-all duration-200 group mb-0.5 ${
          isActive
            ? isDark ? "bg-indigo-500/20 text-indigo-300" : "bg-indigo-50 text-indigo-700"
            : isDark ? "text-gray-400 hover:bg-slate-700/50 hover:text-gray-200" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        }`}
      >
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
              files={files}
              expandedFolders={expandedFolders}
              activeFolderId={activeFolderId}
              isDark={isDark}
              onSelect={onSelect}
              onToggle={onToggle}
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

  const [files,           setFiles]           = useState(INIT_FILES);
  const [viewMode,        setViewMode]        = useState("grid");
  const [search,          setSearch]          = useState("");
  const [activeFolderId,  setActiveFolderId]  = useState("all");
  const [typeFilter,      setTypeFilter]      = useState("All");
  const [sortBy,          setSortBy]          = useState("date");
  const [sortAsc,         setSortAsc]         = useState(false);
  const [showFilter,      setShowFilter]      = useState(false);
  const [hoveredId,       setHoveredId]       = useState(null);
  const [expandedFolders, setExpandedFolders] = useState(new Set(["root","f1","f2"]));
  const [selectedFile,    setSelectedFile]    = useState(null);
  const [copied,          setCopied]          = useState(false);
  const [mousePosition,   setMousePosition]   = useState({ x: 0, y: 0 });

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

  const toggleFolder = (id) => setExpandedFolders(prev => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  const handleFolderSelect = (folderId) => {
    setActiveFolderId(folderId);
    setSelectedFile(null);
  };

  const getFolderById = (id) => FOLDERS_DATA.find(f => f.id === id);

  const getFolderPath = (folderId) => {
    const path = [];
    let cur = getFolderById(folderId);
    while (cur) { path.unshift(cur); cur = getFolderById(cur.parent); }
    return path;
  };

  const currentFolder    = activeFolderId === "all" ? null : getFolderById(activeFolderId);
  const folderRestricted = currentFolder?.restricted;
  const breadcrumb       = activeFolderId === "all" ? [] : getFolderPath(activeFolderId);

  const allTypes = ["All", ...Array.from(new Set(files.map(f => f.type))).sort()];

  const visibleFiles = useMemo(() => {
    let list = [...files];
    if (activeFolderId !== "all") list = list.filter(f => f.folderId === activeFolderId);
    if (typeFilter !== "All")     list = list.filter(f => f.type === typeFilter);
    if (search)                   list = list.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));
    list.sort((a, b) => {
      let cmp = 0;
      if (sortBy === "name") cmp = a.name.localeCompare(b.name);
      if (sortBy === "size") cmp = a.sizeBytes - b.sizeBytes;
      if (sortBy === "date") cmp = new Date(b.uploadDate) - new Date(a.uploadDate);
      return sortAsc ? -cmp : cmp;
    });
    return list;
  }, [files, activeFolderId, typeFilter, search, sortBy, sortAsc]);

  const totalSize   = files.reduce((s, f) => s + f.sizeBytes, 0);
  const sharedCount = files.filter(f => f.shared).length;
  const encCount    = files.filter(f => f.encrypted).length;

  const handleDelete = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    if (selectedFile?.id === fileId) setSelectedFile(null);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
          left: mousePosition.x - 160,
          top: mousePosition.y - 160,
          transition: "all 0.4s ease-out",
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
        <div className="flex-1 overflow-y-auto vault-scrollbar">
          <div className="max-w-[1700px] mx-auto px-3 sm:px-5 lg:px-6 py-5 sm:py-7 space-y-5">

            {/* Page heading */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/30 hover:rotate-6 hover:scale-110 transition-all duration-500 cursor-default flex-shrink-0">
                  <Database className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>
                    {activeVault?.name} Files
                  </h1>
                  <p className={`text-xs sm:text-sm mt-0.5 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                    {files.length} files · {formatBytes(totalSize)} total
                  </p>
                </div>
              </div>
              {MY_PERMS.upload && (
                <button
                  onClick={() => navigate("/vault/fileupload")}
                  className="self-start sm:self-auto flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-[1.02] transition-all duration-300">
                  <Upload className="w-4 h-4" /> Upload Files
                </button>
              )}
            </motion.div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Total Files",  value: files.length,                 Icon: FileText,  color: "from-cyan-500 to-blue-600",     bar: (files.length / 20) * 100 },
                { label: "Storage Used", value: formatBytes(totalSize),        Icon: HardDrive, color: "from-blue-600 to-indigo-600",   bar: (totalSize / (500*1024*1024)) * 100 },
                { label: "Shared",       value: sharedCount,                   Icon: Share2,    color: "from-indigo-500 to-violet-600", bar: (sharedCount / files.length) * 100 },
                { label: "Encrypted",    value: `${encCount}/${files.length}`, Icon: Shield,    color: "from-emerald-500 to-teal-600",  bar: (encCount / files.length) * 100 },
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

            {/* Three-panel layout — NO layout prop on wrapper to avoid thrash */}
            <div className={`grid gap-4 sm:gap-5 transition-[grid-template-columns] duration-300 ${selectedFile ? "lg:grid-cols-12" : "lg:grid-cols-4"}`}>

              {/* Folder tree */}
              <motion.div
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.45, delay: 0.35, ease: "easeOut" }}
                className={`${selectedFile ? "lg:col-span-2" : "lg:col-span-1"} ${card} overflow-hidden self-start`}
              >
                <div className="h-[2px] bg-gradient-to-r from-indigo-500 via-violet-600 to-purple-600" />
                <div className={`px-3 py-3 border-b flex items-center gap-2 ${isDark ? "border-slate-700/50" : "border-gray-200"}`}>
                  {sectionIcon("from-indigo-500 to-violet-600", Folder)}
                  <span className={`text-xs font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Folders</span>
                </div>
                <div className="p-2 vault-scrollbar overflow-y-auto" style={{ maxHeight: 360 }}>
                  {/* All files shortcut */}
                  <div
                    onClick={() => handleFolderSelect("all")}
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
                  {FOLDERS_DATA.filter(f => f.parent === null).map(folder => (
                    <FolderNode
                      key={folder.id}
                      folder={folder}
                      depth={0}
                      files={files}
                      expandedFolders={expandedFolders}
                      activeFolderId={activeFolderId}
                      isDark={isDark}
                      onSelect={handleFolderSelect}
                      onToggle={toggleFolder}
                    />
                  ))}
                </div>
              </motion.div>

              {/* File browser */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.45, ease: "easeOut" }}
                className={`${selectedFile ? "lg:col-span-6" : "lg:col-span-3"} flex flex-col gap-4`}
              >

                {/* Search + controls */}
                <div className={`${card} overflow-hidden`}>
                  <div className="h-[2px] bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600" />
                  <div className="px-4 py-3 space-y-3">

                    {/* Breadcrumb */}
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

                    {/* Restricted banner */}
                    {folderRestricted && (
                      <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs ${isDark ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-red-50 border-red-200 text-red-600"}`}>
                        <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                        You don't have permission to view this folder's contents.
                      </div>
                    )}

                    {/* Controls row */}
                    <div className="flex gap-2 flex-wrap">
                      <div className="flex-1 min-w-[160px] relative">
                        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isDark ? "text-gray-400" : "text-gray-500"}`} />
                        <input type="text" placeholder="Search files…" value={search} onChange={e => setSearch(e.target.value)}
                          className={`w-full pl-9 pr-4 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-all ${isDark ? "bg-slate-700/50 border-slate-600/50 text-white placeholder-gray-500 hover:border-cyan-500/30" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 hover:border-cyan-400"}`}
                        />
                        {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2"><X className={`w-3 h-3 ${isDark ? "text-gray-500" : "text-gray-400"}`} /></button>}
                      </div>

                      <div className="relative">
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
                              className={`absolute right-0 top-full mt-1.5 z-30 rounded-xl border shadow-2xl overflow-hidden min-w-[120px] ${isDark ? "bg-slate-900 border-slate-700/60" : "bg-white border-gray-200"}`}>
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

                {/* Grid view */}
                {!folderRestricted && viewMode === "grid" && (
                  <div className={`grid gap-3 ${selectedFile ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"}`}>
                    {visibleFiles.length > 0 ? visibleFiles.map((file) => {
                      const ft    = getFC(file.type);
                      const FIcon = ft.Icon;
                      const isSel = selectedFile?.id === file.id;
                      return (
                        <div key={file.id}
                          onMouseEnter={() => setHoveredId(file.id)} onMouseLeave={() => setHoveredId(null)}
                          onClick={() => setSelectedFile(isSel ? null : file)}
                          className={`group relative rounded-2xl border backdrop-blur-xl cursor-pointer p-4 overflow-hidden transition-all duration-300 hover:-translate-y-1 shadow-xl ${
                            isSel
                              ? isDark ? "bg-cyan-500/10 border-cyan-500/40 shadow-cyan-500/10" : "bg-cyan-50 border-cyan-400 shadow-cyan-500/10"
                              : isDark ? "bg-slate-800/50 border-slate-700/50 hover:border-cyan-500/40 hover:shadow-cyan-500/10" : "bg-white/80 border-gray-200 hover:border-cyan-500/50"
                          }`}>

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
                                {file.encrypted && <Lock className={`w-3 h-3 ${isDark ? "text-emerald-400" : "text-emerald-500"}`} />}
                                {file.shared    && <Share2 className={`w-3 h-3 ${isDark ? "text-blue-400" : "text-blue-500"}`} />}
                              </div>
                            </div>
                            <span className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase mb-1.5 border ${ft.bg} ${ft.border} ${ft.text}`}>{file.type}</span>
                            <p className={`font-semibold text-sm mb-1 truncate ${isDark ? "text-white" : "text-gray-900"}`}>{file.name}</p>
                            <p className={`text-[10px] mb-3 ${isDark ? "text-gray-400" : "text-gray-500"}`}>{formatBytes(file.sizeBytes)} · {file.uploadDate}</p>
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
                              {MY_PERMS.share && (
                                <button className={`flex items-center justify-center p-1.5 rounded-lg border transition-all ${isDark ? "bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20" : "bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100"}`}>
                                  <Share2 className="w-3 h-3" />
                                </button>
                              )}
                              {MY_PERMS.delete && (
                                <button onClick={() => handleDelete(file.id)}
                                  className={`flex items-center justify-center p-1.5 rounded-lg border transition-all ${isDark ? "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20" : "bg-red-50 border-red-100 text-red-500 hover:bg-red-100"}`}>
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }) : (
                      <div className={`col-span-full py-16 flex flex-col items-center justify-center text-center ${card}`}>
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${isDark ? "bg-slate-700/50" : "bg-gray-100"}`}>
                          <AlertCircle className={`w-7 h-7 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                        </div>
                        <p className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>No files found</p>
                        <p className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Try adjusting your search or filters</p>
                      </div>
                    )}
                  </div>
                )}

                {/* List view */}
                {!folderRestricted && viewMode === "list" && (
                  <div className={`${card} overflow-hidden`}>
                    <div className={`grid grid-cols-12 gap-2 px-4 py-2.5 border-b text-[10px] font-bold uppercase tracking-widest ${isDark ? "border-slate-700/50 text-gray-500" : "border-gray-200 text-gray-400"}`}>
                      <span className="col-span-5">File</span>
                      <span className="col-span-2 hidden sm:block">Type</span>
                      <span className="col-span-2 hidden md:block">Size</span>
                      <span className="col-span-2 hidden lg:block">Date</span>
                      <span className="col-span-1 text-right">Act.</span>
                    </div>
                    {visibleFiles.length > 0 ? visibleFiles.map((file) => {
                      const ft    = getFC(file.type);
                      const FIcon = ft.Icon;
                      const isSel = selectedFile?.id === file.id;
                      return (
                        <div key={file.id}
                          onClick={() => setSelectedFile(isSel ? null : file)}
                          className={`grid grid-cols-12 gap-2 items-center px-4 py-3 border-b cursor-pointer transition-all duration-200 group ${
                            isSel
                              ? isDark ? "bg-cyan-500/10 border-cyan-500/20" : "bg-cyan-50"
                              : isDark ? "border-slate-700/30 hover:bg-slate-700/30" : "border-gray-100 hover:bg-gray-50"
                          }`}
                        >
                          <div className="col-span-5 flex items-center gap-3 min-w-0">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br ${ft.gradient} shadow-md flex-shrink-0 group-hover:scale-110 transition-all duration-300`}>
                              <FIcon className="w-4 h-4 text-white" />
                            </div>
                            <div className="min-w-0">
                              <p className={`text-xs font-semibold truncate ${isDark ? "text-white" : "text-gray-900"}`}>{file.name}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {file.encrypted && <Lock className={`w-2.5 h-2.5 ${isDark ? "text-emerald-400" : "text-emerald-500"}`} />}
                                {file.shared    && <Share2 className={`w-2.5 h-2.5 ${isDark ? "text-blue-400" : "text-blue-500"}`} />}
                                {isSel          && <CheckCircle className="w-2.5 h-2.5 text-cyan-400" />}
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
                            <span className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>{file.uploadDate}</span>
                          </div>
                          <div className="col-span-1 flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                            {MY_PERMS.share && (
                              <button className={`p-1.5 rounded-lg transition-all ${isDark ? "hover:bg-blue-500/20 text-blue-400" : "hover:bg-blue-100 text-blue-600"}`}><Share2 className="w-3.5 h-3.5" /></button>
                            )}
                            {MY_PERMS.delete && (
                              <button onClick={() => handleDelete(file.id)} className={`p-1.5 rounded-lg transition-all ${isDark ? "hover:bg-red-500/20 text-red-400" : "hover:bg-red-100 text-red-500"}`}><Trash2 className="w-3.5 h-3.5" /></button>
                            )}
                          </div>
                        </div>
                      );
                    }) : (
                      <div className="py-14 text-center">
                        <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>No files found</p>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>

              {/* Inline viewer */}
              <AnimatePresence>
                {selectedFile && (
                  <motion.div
                    key={selectedFile.id}
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 40 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="lg:col-span-4"
                  >
                    <FileViewer
                      file={selectedFile}
                      onClose={() => setSelectedFile(null)}
                      onDelete={handleDelete}
                      copied={copied}
                      onCopy={handleCopy}
                      isDark={isDark}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </div>
        </div>
      </motion.main>

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