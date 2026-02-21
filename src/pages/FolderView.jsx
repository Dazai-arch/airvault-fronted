import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Folder, FolderPlus, FileText, Image, Archive,
  ChevronRight, Search, Upload, Lock, X, Grid3X3, List,
  AlertCircle, Shield, Database, HardDrive,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useVault } from "../context/VaultContext";
import VaultTopBar from "../components/layout/VaultTopBar";
import HamburgerMenu from "../components/layout/HamburgerMenu";

const SIDEBAR_COLLAPSED = 60;
const SIDEBAR_EXPANDED  = 220;

/* ─── tiny helpers ───────────────────────────────────────────────────── */
const formatBytes = (bytes) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(bytes / Math.pow(k, i) >= 10 ? 0 : 1)} ${sizes[i]}`;
};

const FILE_ICON = (type, cls) => {
  if (type === "Image")   return <Image   className={`${cls} text-cyan-400`} />;
  if (type === "Archive") return <Archive className={`${cls} text-amber-400`} />;
  return                         <FileText className={`${cls} text-violet-400`} />;
};

const FILE_TYPE_BADGE = (type, isDark) => (
  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
    isDark ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" : "bg-cyan-50 text-cyan-600 border-cyan-200"
  }`}>{type}</span>
);

/* ══════════════════════════════════════════════════════════════════════ */
const FolderView = () => {
  const navigate = useNavigate();
  const { folderId } = useParams();
  const { isDark }      = useTheme();
  const { activeVault } = useVault();

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const [layout,                setLayout]                = useState("grid");
  const [search,                setSearch]                = useState("");
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [createFolderName,      setCreateFolderName]      = useState("");
  const [sidebarExpanded,       setSidebarExpanded]       = useState(false);

  const [folders, setFolders] = useState(() => ([
    { id: "root",  name: "Vault",            parent: null,   locked: false, restricted: false, permission: "edit" },
    { id: "f1",    name: "Contracts",        parent: "root", locked: false, restricted: false, permission: "edit" },
    { id: "f1-1",  name: "2025 Contracts",   parent: "f1",   locked: false, restricted: false, permission: "edit" },
    { id: "f1-2",  name: "Legal Documents",  parent: "f1",   locked: true,  restricted: true,  permission: "read" },
    { id: "f1-3",  name: "Vendor Agreements",parent: "f1",   locked: false, restricted: false, permission: "edit" },
    { id: "f2",    name: "Media",            parent: "root", locked: false, restricted: false, permission: "edit" },
    { id: "f2-1",  name: "Press Kits",       parent: "f2",   locked: false, restricted: false, permission: "edit" },
    { id: "f3",    name: "Finance",          parent: "root", locked: true,  restricted: false, permission: "read" },
  ]));

  const [files] = useState(() => ([
    { id: "file-1", folderId: "f1",   name: "NDA_Agreement_2025.pdf",      type: "PDF",     sizeBytes: 2.4*1024*1024, uploadDate: "2026-02-15", encrypted: true, restricted: false },
    { id: "file-2", folderId: "f1",   name: "Service_Terms.docx",          type: "Word",    sizeBytes: 1.8*1024*1024, uploadDate: "2026-02-14", encrypted: true, restricted: false },
    { id: "file-3", folderId: "f1",   name: "Contract_Summary.xlsx",       type: "Excel",   sizeBytes: 890*1024,      uploadDate: "2026-02-13", encrypted: true, restricted: false },
    { id: "file-4", folderId: "f1-1", name: "Master_Service_Agreement.pdf",type: "PDF",     sizeBytes: 1.2*1024*1024, uploadDate: "2026-02-12", encrypted: true, restricted: false },
    { id: "file-5", folderId: "f2",   name: "Brand_Assets.zip",            type: "Archive", sizeBytes: 12.4*1024*1024,uploadDate: "2026-02-11", encrypted: true, restricted: false },
    { id: "file-6", folderId: "f2-1", name: "Launch_Photoshoot.png",       type: "Image",   sizeBytes: 5.1*1024*1024, uploadDate: "2026-02-10", encrypted: true, restricted: false },
    { id: "file-7", folderId: "f3",   name: "Quarterly_Report.xlsx",       type: "Excel",   sizeBytes: 3.7*1024*1024, uploadDate: "2026-02-09", encrypted: true, restricted: true  },
  ]));

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

  useEffect(() => { setSearch(""); }, [folderId]);

  const sidebarW = sidebarExpanded ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED;

  const currentFolder = useMemo(() => {
    if (!folderId) return folders.find(f => f.id === "root");
    return folders.find(f => f.id === folderId) || folders.find(f => f.id === "root");
  }, [folderId, folders]);

  const folderHierarchy = useMemo(() => {
    const path = [];
    let cursor = currentFolder;
    while (cursor) {
      path.unshift({ id: cursor.id, name: cursor.name });
      cursor = folders.find(f => f.id === cursor.parent);
    }
    return path.length > 0 ? path : [{ id: "root", name: "Vault" }];
  }, [currentFolder, folders]);

  const childFolders = useMemo(() => folders.filter(f => f.parent === currentFolder?.id), [folders, currentFolder]);
  const childFiles   = useMemo(() => files.filter(f => f.folderId === currentFolder?.id),  [files, currentFolder]);
  const folderUsageBytes = useMemo(() => childFiles.reduce((s, f) => s + (f.sizeBytes || 0), 0), [childFiles]);
  const parentFolder     = useMemo(() => folders.find(f => f.id === currentFolder?.parent), [folders, currentFolder]);

  const isRestricted = currentFolder?.restricted;
  const canManage    = currentFolder?.permission === "edit" && !isRestricted;

  const filteredFiles   = useMemo(() => childFiles.filter(f => f.name.toLowerCase().includes(search.toLowerCase())),   [search, childFiles]);
  const filteredFolders = useMemo(() => childFolders.filter(f => f.name.toLowerCase().includes(search.toLowerCase())), [search, childFolders]);
  const isEmpty = filteredFiles.length === 0 && filteredFolders.length === 0;

  const handleCreateFolder = () => {
    const name = createFolderName.trim();
    if (!name || !currentFolder || !canManage) return;
    setFolders(prev => [...prev, { id: `f-${Date.now()}`, name, parent: currentFolder.id, locked: false, restricted: false, permission: "edit" }]);
    setCreateFolderName("");
    setShowCreateFolderModal(false);
  };

  const handleFolderClick = (folder) => { if (!folder.restricted) navigate(`/vault/folder/${folder.id}`); };
  const handleFileClick   = (file)   => { if (!isRestricted && !file.restricted) navigate(`/vault/file/${file.id}`); };

  const card = `rounded-2xl border backdrop-blur-xl transition-all duration-300 ${
    isDark ? "bg-slate-800/50 border-slate-700/50" : "bg-white/80 border-gray-200"
  }`;

  /* ── No vault selected ── */
  if (!activeVault) {
    return (
      <div className={`min-h-screen w-full flex items-center justify-center ${
        isDark ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" : "bg-gradient-to-br from-gray-50 via-white to-gray-100"
      }`}>
        <div className="text-center px-6">
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl border mb-6 ${
            isDark ? "bg-slate-800/50 border-slate-700/50" : "bg-white border-gray-200"
          }`}>
            <Folder className="w-10 h-10 text-gray-400" />
          </div>
          <p className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>No vault selected</p>
          <p className={`text-sm mt-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>Select a vault to view folders.</p>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/vaults")}
            className="mt-6 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white font-semibold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-300">
            Go to Vaults
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen w-full overflow-hidden transition-colors duration-500 ${
      isDark ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" : "bg-gradient-to-br from-gray-50 via-white to-gray-100"
    }`}>

      {/* Ambient blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-1/4 -left-1/4 w-96 h-96 ${isDark ? "bg-cyan-500/5" : "bg-cyan-500/3"} rounded-full blur-3xl animate-pulse`} />
        <div className={`absolute bottom-1/4 -right-1/4 w-96 h-96 ${isDark ? "bg-indigo-500/5" : "bg-indigo-500/3"} rounded-full blur-3xl animate-pulse`} style={{ animationDelay: "1s" }} />
      </div>




      <div
  className="hidden lg:block fixed w-80 h-80 rounded-full pointer-events-none z-0 mix-blend-screen"
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
          <div className="max-w-[1600px] mx-auto px-3 sm:px-5 lg:px-6 py-5 sm:py-8 space-y-5 sm:space-y-6">

            {/* ── Page heading ── */}
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 hover:rotate-6 hover:scale-110 transition-all duration-500 cursor-default flex-shrink-0">
                    <Folder className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>
                      {currentFolder?.name || "Folder"}
                    </h1>
                    <p className={`text-xs sm:text-sm mt-0.5 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                      {childFolders.length + childFiles.length} items
                    </p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 self-start sm:self-auto">
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={() => setShowCreateFolderModal(true)}
                    disabled={!canManage}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs sm:text-sm font-semibold transition-all duration-300 ${
                      canManage
                        ? isDark
                          ? "bg-slate-700/50 border-slate-600/50 text-gray-300 hover:border-indigo-500/40 hover:text-white"
                          : "bg-gray-100 border-gray-200 text-gray-700 hover:border-indigo-400"
                        : "opacity-40 cursor-not-allowed bg-transparent border-transparent text-gray-500"
                    }`}>
                    <FolderPlus className="w-4 h-4" /> New Folder
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={() => navigate("/vault/fileupload")}
                    disabled={!canManage}
                    className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 ${
                      canManage
                        ? "bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50"
                        : "opacity-40 cursor-not-allowed bg-slate-700 text-gray-500"
                    }`}>
                    <Upload className="w-4 h-4" /> Upload
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {/* ── Back button + Breadcrumb ── */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
              className="flex flex-col sm:flex-row sm:items-center gap-3">
              <button
                onClick={() => parentFolder ? navigate(`/vault/folder/${parentFolder.id}`) : navigate("/vault/folder")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                  isDark ? "bg-slate-800/50 border-slate-700/50 text-gray-400 hover:text-white hover:border-slate-600" : "bg-white border-gray-200 text-gray-500 hover:text-gray-900"
                }`}>
                <ArrowLeft className="w-3.5 h-3.5" />
                {parentFolder ? `Back to ${parentFolder.name}` : "Back"}
              </button>

              {/* Breadcrumb */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {folderHierarchy.map((folder, index) => (
                  <div key={folder.id} className="flex items-center gap-1.5">
                    <button
                      onClick={() => folder.id === "root" ? navigate("/vault/folder") : navigate(`/vault/folder/${folder.id}`)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        index === folderHierarchy.length - 1
                          ? isDark ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20" : "bg-indigo-50 text-indigo-600 border border-indigo-200"
                          : isDark ? "text-gray-500 hover:text-gray-300 hover:bg-slate-700/50" : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                      }`}>
                      {folder.name}
                    </button>
                    {index < folderHierarchy.length - 1 && (
                      <ChevronRight className={`w-3 h-3 ${isDark ? "text-gray-600" : "text-gray-400"}`} />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* ── Stat cards ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {[
                { label: "Folder",       value: currentFolder?.name || "Vault",                   color: "from-indigo-500 to-violet-600",  Icon: Folder    },
                { label: "Total Items",  value: `${childFolders.length + childFiles.length}`,      color: "from-cyan-500 to-blue-600",      Icon: Database  },
                { label: "Storage Used", value: formatBytes(folderUsageBytes),                     color: "from-emerald-500 to-teal-600",   Icon: HardDrive },
                { label: "Access",       value: isRestricted ? "Restricted" : currentFolder?.permission === "read" ? "Read-only" : "Editable",
                                                                                                    color: isRestricted ? "from-red-500 to-rose-600" : "from-blue-600 to-indigo-600", Icon: Shield },
              ].map(({ label, value, color, Icon }, i) => (
                <motion.div key={label}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.4 }} whileHover={{ y: -4 }}
                  className={`group relative ${card} p-4 sm:p-5 overflow-hidden cursor-default shadow-xl`}
                >
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
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                  className={`flex items-start gap-3 p-4 rounded-2xl border ${
                    isDark ? "bg-red-500/10 border-red-500/20" : "bg-red-50 border-red-200"
                  }`}>
                  <AlertCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isDark ? "text-red-400" : "text-red-600"}`} />
                  <div>
                    <p className={`text-sm font-semibold ${isDark ? "text-red-300" : "text-red-700"}`}>Access denied</p>
                    <p className={`text-xs mt-0.5 ${isDark ? "text-red-300/70" : "text-red-600"}`}>You do not have permission to view the contents of this folder.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Search + Layout toggle ── */}
            {!isRestricted && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
                className={`${card} shadow-xl overflow-hidden`}>
                <div className="h-[2px] bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600" />
                <div className="px-4 sm:px-5 py-3 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                  <div className="flex-1 relative">
                    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isDark ? "text-gray-400" : "text-gray-500"}`} />
                    <input type="text" placeholder="Search files and folders…" value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className={`w-full pl-9 pr-4 py-2 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-all ${
                        isDark
                          ? "bg-slate-700/50 border-slate-600/50 text-white placeholder-gray-500 hover:border-cyan-500/30"
                          : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 hover:border-cyan-400"
                      }`}
                    />
                  </div>
                  <div className={`flex items-center gap-1 rounded-xl border p-1 ${isDark ? "bg-slate-700/50 border-slate-600/50" : "bg-gray-100 border-gray-200"}`}>
                    {[{ v: "grid", Icon: Grid3X3 }, { v: "list", Icon: List }].map(({ v, Icon }) => (
                      <button key={v} onClick={() => setLayout(v)}
                        className={`p-2 rounded-lg transition-all duration-200 ${
                          layout === v
                            ? isDark ? "bg-indigo-500/20 text-indigo-400" : "bg-indigo-100 text-indigo-600"
                            : isDark ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-700"
                        }`}>
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
                  <AlertCircle className={`w-8 h-8 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                </div>
                <p className={`text-base font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                  {search ? "No items found" : "This folder is empty"}
                </p>
                <p className={`text-xs mt-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  {search ? "Try adjusting your search" : "Upload files or create subfolders to get started."}
                </p>
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
                    {filteredFolders.map((folder, i) => (
                      <motion.div key={folder.id}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }} whileHover={{ y: folder.restricted ? 0 : -3 }}
                        onClick={() => handleFolderClick(folder)}
                        className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-300 group ${
                          folder.restricted ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                        } ${
                          isDark
                            ? "bg-slate-900/50 border-slate-700/50 hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/10"
                            : "bg-gray-50 border-gray-200 hover:border-indigo-400 hover:shadow-lg"
                        }`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 bg-gradient-to-br from-indigo-500/20 to-violet-600/20 group-hover:from-indigo-500/30 group-hover:to-violet-600/30`}>
                          <Folder className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold truncate ${isDark ? "text-white" : "text-gray-900"}`}>{folder.name}</p>
                          <p className={`text-[10px] mt-0.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                            {folder.restricted ? "Restricted" : "Open"} · {folder.permission === "read" ? "Read-only" : "Editable"}
                          </p>
                        </div>
                        {(folder.locked || folder.restricted) && <Lock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                        {!folder.restricted && <ChevronRight className={`w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? "text-gray-400" : "text-gray-500"}`} />}
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

                  {/* Grid view */}
                  {layout === "grid" && (
                    <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {filteredFiles.map((file, i) => {
                        const restricted = file.restricted || isRestricted;
                        return (
                          <motion.div key={file.id}
                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }} whileHover={{ y: restricted ? 0 : -3 }}
                            onClick={() => handleFileClick(file)}
                            className={`p-4 rounded-xl border transition-all duration-300 group ${
                              restricted ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                            } ${
                              isDark
                                ? "bg-slate-900/50 border-slate-700/50 hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/10"
                                : "bg-gray-50 border-gray-200 hover:border-cyan-400 hover:shadow-lg"
                            }`}>
                            <div className="flex items-start justify-between mb-3">
                              {FILE_ICON(file.type, "w-6 h-6")}
                              <div className="flex items-center gap-1.5">
                                {restricted && <Lock className="w-3.5 h-3.5 text-amber-400" />}
                                {FILE_TYPE_BADGE(file.type, isDark)}
                              </div>
                            </div>
                            <p className={`text-sm font-semibold truncate ${isDark ? "text-white" : "text-gray-900"}`}>{file.name}</p>
                            <div className="flex items-center justify-between mt-2">
                              <p className={`text-[10px] ${isDark ? "text-gray-500" : "text-gray-400"}`}>{formatBytes(file.sizeBytes)}</p>
                              <p className={`text-[10px] font-mono ${isDark ? "text-gray-500" : "text-gray-400"}`}>{file.uploadDate}</p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}

                  {/* List view */}
                  {layout === "list" && (
                    <div className={`divide-y ${isDark ? "divide-slate-700/40" : "divide-gray-100"}`}>
                      {filteredFiles.map((file, i) => {
                        const restricted = file.restricted || isRestricted;
                        return (
                          <motion.div key={file.id}
                            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03 }}
                            onClick={() => handleFileClick(file)}
                            className={`flex items-center justify-between px-5 py-3.5 transition-all duration-200 group ${
                              restricted ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                            } ${isDark ? "hover:bg-slate-700/30" : "hover:bg-gray-50"}`}>
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {FILE_ICON(file.type, "w-5 h-5 flex-shrink-0")}
                              <div className="min-w-0">
                                <p className={`text-sm font-semibold truncate ${isDark ? "text-white" : "text-gray-900"}`}>{file.name}</p>
                                <p className={`text-[10px] font-mono mt-0.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                                  {formatBytes(file.sizeBytes)} · {file.uploadDate}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {restricted && <Lock className="w-3.5 h-3.5 text-amber-400" />}
                              {FILE_TYPE_BADGE(file.type, isDark)}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

          </div>
        </div>
      </motion.main>

      {/* ── Create Folder Modal ── */}
      <AnimatePresence>
        {showCreateFolderModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowCreateFolderModal(false)}
          >
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`rounded-2xl border shadow-2xl w-full max-w-md overflow-hidden ${
                isDark ? "bg-slate-800/90 border-slate-700/50" : "bg-white border-gray-200"
              }`}
            >
              <div className="h-[2px] bg-gradient-to-r from-indigo-500 via-violet-600 to-purple-600" />
              <div className="p-5 sm:p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
                      <FolderPlus className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Create New Folder</h3>
                      <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>Inside {currentFolder?.name}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowCreateFolderModal(false)}
                    className={`p-2 rounded-xl ${isDark ? "hover:bg-slate-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}>
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Folder name</label>
                <input type="text" placeholder="e.g. Project Files" value={createFolderName} autoFocus
                  onChange={(e) => setCreateFolderName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm mb-5 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all ${
                    isDark
                      ? "bg-slate-900/50 border-slate-700/50 text-white placeholder:text-gray-500 hover:border-indigo-500/30"
                      : "bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 hover:border-indigo-400"
                  }`}
                />

                <div className="flex gap-3">
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => setShowCreateFolderModal(false)}
                    className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                      isDark ? "bg-slate-700/50 border-slate-600/50 text-gray-300 hover:text-white" : "bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200"
                    }`}>
                    Cancel
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={handleCreateFolder}
                    disabled={!createFolderName.trim()}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-500 via-violet-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed">
                    Create Folder
                  </motion.button>
                </div>
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

export default FolderView;