import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Share2,
  Download,
  Trash2,
  Edit,
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
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useVault } from "../context/VaultContext";
import VaultTopBar from "../components/layout/VaultTopBar";
import HamburgerMenu from "../components/layout/HamburgerMenu";
import Toast from "../components/layout/Toast";
import { useToast } from "../hooks/useToast";

/* ─── SectionIcon — matches FileSharing ─────────────────────────────────── */
const SectionIcon = ({ gradient, Icon }) => (
  <div className={`w-9 h-9 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}>
    <Icon className="w-4 h-4 text-white" />
  </div>
);

/* ─── DetailItem ─────────────────────────────────────────────────────────── */
const DetailItem = ({ icon: Icon, label, value, isDark }) => (
  <div className={`p-4 rounded-xl border transition-all duration-300 ${
    isDark ? "bg-slate-900/50 border-slate-700/50 hover:border-cyan-500/30" : "bg-gray-50 border-gray-200 hover:border-cyan-300"
  }`}>
    <div className={`flex items-center gap-2 mb-1.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
      <Icon className="w-4 h-4" />
      <p className="text-[10px] font-bold uppercase tracking-widest">{label}</p>
    </div>
    <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>{value}</p>
  </div>
);

/* ─── StatusBadge ────────────────────────────────────────────────────────── */
const StatusBadge = ({ label, value, status, isDark }) => {
  const colors = {
    secure:   isDark ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-emerald-50 text-emerald-600 border-emerald-200",
    locked:   isDark ? "bg-amber-500/10  text-amber-400  border-amber-500/20"  : "bg-amber-50  text-amber-600  border-amber-200",
    unlocked: isDark ? "bg-cyan-500/10   text-cyan-400   border-cyan-500/20"   : "bg-cyan-50   text-cyan-600   border-cyan-200",
    info:     isDark ? "bg-violet-500/10 text-violet-400 border-violet-500/20" : "bg-violet-50 text-violet-600 border-violet-200",
  };
  return (
    <div className={`flex items-center justify-between p-3 rounded-xl border ${
      isDark ? "bg-slate-900/50 border-slate-700/50" : "bg-gray-50 border-gray-200"
    }`}>
      <p className={`text-xs font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}>{label}</p>
      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${colors[status]}`}>{value}</span>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════ */
const Details = ({ item = null, onBack = null }) => {
  const { isDark } = useTheme();
  const { activeVault } = useVault();
  const { toast, showSuccess, showError, hideToast } = useToast();

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const [selectedItem] = useState(
    item || {
      id: "vault_001",
      name: "Confidential Documents",
      type: "vault",
      size: "500 MB",
      created: "2024-01-15",
      modified: "2025-02-20",
      owner: "John Doe",
      access: "Private",
      description: "Contains important business and personal documents",
      files: 147,
      encryption: "AES-256",
      isLocked: true,
      permissions: ["Owner"],
      tags: ["Important", "Confidential"],
      lastAccessed: "2025-02-20 14:32 UTC",
    }
  );

  const [isEditing,        setIsEditing]        = useState(false);
  const [copied,           setCopied]            = useState(false);
  const [showDeleteModal,  setShowDeleteModal]   = useState(false);
  const [sidebarExpanded,  setSidebarExpanded]   = useState(false);

  const SIDEBAR_COLLAPSED = 60;
  const SIDEBAR_EXPANDED  = 220;
  const sidebarW = sidebarExpanded ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED;

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

  const handleCopyId = () => {
    navigator.clipboard.writeText(selectedItem.id);
    setCopied(true);
    showSuccess("ID copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = () => {
    showSuccess("Item deleted successfully");
    setShowDeleteModal(false);
    setTimeout(() => onBack?.(), 1000);
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: selectedItem.name, text: `Check out: ${selectedItem.name}` });
      } else {
        showSuccess("Share details copied");
      }
    } catch { /* cancelled */ }
  };

  /* Shared card style — matches FileSharing */
  const card = `rounded-2xl border backdrop-blur-xl shadow-xl transition-all duration-300 ${
    isDark ? "bg-slate-800/50 border-slate-700/50" : "bg-white/80 border-gray-200"
  }`;

  /* ── No-vault guard ── */
  if (!activeVault) {
    return (
      <div className={`h-screen w-full flex items-center justify-center ${isDark ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" : "bg-gradient-to-br from-gray-50 via-white to-gray-100"}`}>
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

  /* ════════════════════════════════════════════════════════ RENDER ══ */
  return (
    <div className={`h-screen w-full overflow-hidden transition-colors duration-500 ${
      isDark ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" : "bg-gradient-to-br from-gray-50 via-white to-gray-100"
    }`}>

      {/* Ambient blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-1/4 -left-1/4 w-96 h-96 ${isDark ? "bg-cyan-500/5" : "bg-cyan-500/3"} rounded-full blur-3xl animate-pulse`} />
        <div className={`absolute bottom-1/4 -right-1/4 w-96 h-96 ${isDark ? "bg-blue-600/5" : "bg-blue-600/3"} rounded-full blur-3xl animate-pulse`} style={{ animationDelay: "1s" }} />
        <div className={`absolute top-1/2 left-1/2 w-96 h-96 ${isDark ? "bg-indigo-500/3" : "bg-indigo-500/2"} rounded-full blur-3xl animate-pulse`} style={{ animationDelay: "0.5s" }} />
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
                {/* Back button */}
                <button
                  onClick={onBack || (() => window.history.back())}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all duration-200 self-start ${
                    isDark ? "bg-slate-800/50 border-slate-700/50 text-gray-300 hover:text-white hover:border-cyan-500/40" : "bg-white/80 border-gray-200 text-gray-600 hover:border-cyan-400"
                  }`}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              </div>

              {/* Title row */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30 hover:rotate-6 hover:scale-110 transition-all duration-500 cursor-default flex-shrink-0">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className={`text-3xl lg:text-4xl font-bold tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>
                    {selectedItem.name}
                  </h1>
                  <p className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>{selectedItem.description}</p>
                </div>
              </div>
            </motion.div>

            {/* ══ GRID ══ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">

              {/* ═══ LEFT ═══ */}
              <div className="lg:col-span-2 space-y-5 sm:space-y-6">

                {/* Details & Attributes */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className={card}>
                  <div className="h-[2px] bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 rounded-t-2xl" />
                  <div className="p-5 sm:p-6">
                    <h2 className={`text-sm sm:text-base font-bold mb-5 flex items-center gap-2.5 ${isDark ? "text-white" : "text-gray-900"}`}>
                      <SectionIcon gradient="from-cyan-500 to-blue-600" Icon={Shield} />
                      Details & Attributes
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <DetailItem icon={HardDrive} label="Size"          value={selectedItem.size}          isDark={isDark} />
                      <DetailItem icon={Calendar}  label="Created"       value={selectedItem.created}       isDark={isDark} />
                      <DetailItem icon={Clock}     label="Modified"      value={selectedItem.modified}      isDark={isDark} />
                      <DetailItem icon={Eye}       label="Last Accessed" value={selectedItem.lastAccessed}  isDark={isDark} />
                      <DetailItem icon={User}      label="Owner"         value={selectedItem.owner}         isDark={isDark} />
                      <DetailItem icon={Lock}      label="Encryption"    value={selectedItem.encryption}    isDark={isDark} />
                      {selectedItem.files && (
                        <DetailItem icon={FileText} label="Files"        value={selectedItem.files}         isDark={isDark} />
                      )}
                      <DetailItem icon={Shield}    label="Access Level"  value={selectedItem.access}        isDark={isDark} />
                    </div>
                  </div>
                </motion.div>

                {/* Item ID */}
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
                        {copied ? <><CheckCircle className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                      </motion.button>
                    </div>
                    <p className={`font-mono text-sm p-3 rounded-xl border break-all ${
                      isDark ? "bg-slate-900/50 border-slate-700/50 text-gray-400" : "bg-gray-50 border-gray-200 text-gray-600"
                    }`}>
                      {selectedItem.id}
                    </p>
                  </div>
                </motion.div>

                {/* Action buttons */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="flex flex-wrap gap-3">
                  <motion.button
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all duration-300"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={() => setShowDeleteModal(true)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-300 ${
                      isDark ? "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/40" : "bg-red-50 border-red-100 text-red-500 hover:bg-red-100 hover:border-red-200"
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
                    <div className="space-y-2">
                      <StatusBadge label="Encryption"   value="AES-256"                                        status="secure"   isDark={isDark} />
                      <StatusBadge label="Lock Status"  value={selectedItem.isLocked ? "Locked" : "Unlocked"}  status={selectedItem.isLocked ? "locked" : "unlocked"} isDark={isDark} />
                      <StatusBadge label="Access"       value={selectedItem.access}                             status="info"     isDark={isDark} />
                    </div>
                  </div>
                </motion.div>

                {/* Permissions */}
                <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.17 }} className={card}>
                  <div className="h-[2px] bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-2xl" />
                  <div className="p-5">
                    <h3 className={`text-sm font-bold mb-4 flex items-center gap-2.5 ${isDark ? "text-white" : "text-gray-900"}`}>
                      <SectionIcon gradient="from-blue-600 to-indigo-600" Icon={Shield} />
                      Permissions
                    </h3>
                    <div className="space-y-2">
                      {selectedItem.permissions?.map((perm, idx) => (
                        <div key={idx} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${
                          isDark ? "bg-slate-900/50 border-slate-700/50" : "bg-gray-50 border-gray-200"
                        }`}>
                          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          <span className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>{perm}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Tags */}
                {selectedItem.tags?.length > 0 && (
                  <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.22 }} className={card}>
                    <div className="h-[2px] bg-gradient-to-r from-violet-500 to-purple-600 rounded-t-2xl" />
                    <div className="p-5">
                      <h3 className={`text-sm font-bold mb-4 flex items-center gap-2.5 ${isDark ? "text-white" : "text-gray-900"}`}>
                        <SectionIcon gradient="from-violet-500 to-purple-600" Icon={Tag} />
                        Tags
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedItem.tags.map((tag, idx) => (
                          <span key={idx} className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                            isDark ? "bg-violet-500/10 border-violet-500/20 text-violet-400 hover:bg-violet-500/20" : "bg-violet-50 border-violet-200 text-violet-600 hover:bg-violet-100"
                          }`}>
                            #{tag}
                          </span>
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`relative rounded-2xl border shadow-2xl p-6 max-w-md w-full ${
                isDark ? "bg-slate-800/90 border-slate-700/50" : "bg-white border-gray-200"
              }`}
            >
              <div className="h-[2px] bg-gradient-to-r from-red-500 to-orange-500 rounded-t-xl -mt-6 -mx-6 mb-6 rounded-tl-2xl rounded-tr-2xl" />
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <h3 className={`text-base font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Delete Item?</h3>
              </div>
              <p className={`text-sm mb-6 leading-relaxed ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                This action cannot be undone. <span className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>"{selectedItem.name}"</span> will be permanently deleted.
              </p>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => setShowDeleteModal(false)}
                  className={`flex-1 py-2.5 px-4 rounded-xl border text-sm font-semibold transition-all duration-200 ${
                    isDark ? "bg-slate-700/50 border-slate-600/50 text-gray-300 hover:text-white" : "bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleDelete}
                  className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold bg-gradient-to-r from-red-500 to-orange-600 text-white shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all duration-300"
                >
                  Delete
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