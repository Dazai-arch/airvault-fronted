import { useEffect, useRef, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Shield,
  Link2,
  Users,
  Mail,
  Copy,
  AlertTriangle,
  Lock,
  Eye,
  Download,
  Edit,
  Calendar,
  Globe,
  Ban,
  Wifi,
  CheckCircle,
  ChevronDown,
  Trash2,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useVault } from "../context/VaultContext";
import VaultTopBar from "../components/layout/VaultTopBar";
import HamburgerMenu from "../components/layout/HamburgerMenu";
import Toast from "../components/layout/Toast";
import { useToast } from "../hooks/useToast";
import { useLayoutEffect } from "react";
import { createPortal } from "react-dom";

/* ─── Mock data ─────────────────────────────────────────────────────────── */
const mockSharedUsers = [
  { id: 1, name: "Ava Reed",    email: "ava@airvault.com",    permission: "view",     status: "active" },
  { id: 2, name: "Marcus Hill", email: "marcus@airvault.com", permission: "download", status: "active" },
  { id: 3, name: "Nadia Park",  email: "nadia@airvault.com",  permission: "edit",     status: "paused" },
];


/* ─── CustomSelect — exact port from FileUpload / Permissions ────────────── */
/*
 * Props:
 *   value        — the currently selected option key (string), or "" for none
 *   onChange     — called with the selected option key
 *   options      — [{ value, label }]
 *   placeholder  — shown when value is "" (default "Select…")
 *   isDark
 *   icon         — optional lucide icon shown on the left of the trigger
 */
const CustomSelect = ({ value, onChange, options, placeholder = "Select…", isDark, icon: IconLeft }) => {
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({});
  const triggerRef = useRef(null);

  useLayoutEffect(() => {
    if (open && triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      const ITEM_HEIGHT = 42;       // px per option row
      const MAX_VISIBLE = 5;        // max rows before scroll kicks in
      const PADDING = 12;           // breathing room from viewport edge
      const LIST_HEADER = 2;        // the coloured top bar

      const spaceBelow = window.innerHeight - r.bottom - PADDING;
      const spaceAbove = r.top - PADDING;

      const naturalHeight = LIST_HEADER + options.length * ITEM_HEIGHT;
      const maxHeight = Math.min(naturalHeight, MAX_VISIBLE * ITEM_HEIGHT + LIST_HEADER);

      // Flip upward if not enough room below but more room above
      const openUpward = spaceBelow < maxHeight && spaceAbove > spaceBelow;

      setDropdownPos({
        position: "fixed",
        left: r.left,
        width: r.width,
        zIndex: 99999,
        maxHeight,
        overflowY: naturalHeight > maxHeight ? "auto" : "hidden",
        ...(openUpward
          ? { bottom: window.innerHeight - r.top + 6 }
          : { top: r.bottom + 6 }),
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
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  const selectedOption = options.find((o) => o.value === value);
  const display = selectedOption ? selectedOption.label : placeholder;
  const hasValue = Boolean(selectedOption);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 ${isDark ? `bg-slate-800/60 border-slate-700/50 hover:border-cyan-500/40 ${open ? "border-cyan-500/50 ring-2 ring-cyan-500/20" : ""} ${hasValue ? "text-white" : "text-gray-500"}` : `bg-gray-50 border-gray-200 hover:border-cyan-400 ${open ? "border-cyan-400 ring-2 ring-cyan-500/20" : ""} ${hasValue ? "text-gray-900" : "text-gray-400"}`}`}
      >
        {IconLeft && <IconLeft className={`w-4 h-4 flex-shrink-0 ${isDark ? "text-gray-400" : "text-gray-500"}`} />}
        <span className="flex-1 text-left truncate">{display}</span>
        <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${isDark ? "text-gray-400" : "text-gray-500"} ${open ? "rotate-180" : ""}`} />
      </button>

      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              id="__custom-select-portal__"
              style={dropdownPos}
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className={`rounded-xl border shadow-2xl ${isDark ? "bg-slate-900 border-slate-700/60 scrollbar-dropdown-dark" : "bg-white border-gray-200 scrollbar-dropdown-light"}`}
            >
              <div className="h-[2px] bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 flex-shrink-0 rounded-t-xl" />
              {options.map(({ value: v, label }) => {
                const isActive = v === value;
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => { onChange(v); setOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors duration-150 flex items-center justify-between ${
                      isActive
                        ? isDark ? "bg-cyan-500/15 text-cyan-400 font-semibold" : "bg-cyan-50 text-cyan-600 font-semibold"
                        : isDark ? "text-gray-300 hover:bg-slate-800" : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span>{label}</span>
                    {isActive && <CheckCircle className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      <style>{`
        .scrollbar-dropdown-dark { scrollbar-width: thin; scrollbar-color: rgba(6,182,212,0.4) transparent; }
        .scrollbar-dropdown-dark::-webkit-scrollbar { width: 4px; }
        .scrollbar-dropdown-dark::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-dropdown-dark::-webkit-scrollbar-thumb { background: rgba(6,182,212,0.4); border-radius: 2px; }
        .scrollbar-dropdown-light { scrollbar-width: thin; scrollbar-color: rgba(6,182,212,0.3) transparent; }
        .scrollbar-dropdown-light::-webkit-scrollbar { width: 4px; }
        .scrollbar-dropdown-light::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-dropdown-light::-webkit-scrollbar-thumb { background: rgba(6,182,212,0.3); border-radius: 2px; }
      `}</style>
    </>
  );
};
/* ─── SectionIcon ─────────────────────────────────────────────────────────── */
const SectionIcon = ({ gradient, Icon }) => (
  <div className={`w-9 h-9 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}>
    <Icon className="w-4 h-4 text-white" />
  </div>
);

/* ─── Toggle ──────────────────────────────────────────────────────────────── */
const Toggle = ({ state, onToggle, isDark }) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onToggle}
    className={`relative w-11 h-6 rounded-full transition-all duration-300 flex-shrink-0 ${
      state ? "bg-gradient-to-r from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30" : isDark ? "bg-slate-700" : "bg-gray-300"
    }`}
  >
    <motion.div
      animate={{ x: state ? 22 : 3 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="absolute top-[3px] bg-white rounded-full shadow-sm"
      style={{ width: 18, height: 18 }}
    />
  </motion.button>
);

/* ─── Permission badge colours ────────────────────────────────────────────── */
const permBadge = (p, isDark) =>
  p === "edit"     ? isDark ? "bg-cyan-500/10 text-cyan-400"    : "bg-cyan-50 text-cyan-600"    :
  p === "download" ? isDark ? "bg-violet-500/10 text-violet-400" : "bg-violet-50 text-violet-600" :
                     isDark ? "bg-amber-500/10 text-amber-400"   : "bg-amber-50 text-amber-600";

/* ══════════════════════════════════════════════════════════════════════════ */
const FileSharing = () => {
  const navigate   = useNavigate();
  const { fileId } = useParams();
  const { isDark } = useTheme();
  const { activeVault } = useVault();
  const { toast, showSuccess, showError, hideToast } = useToast();

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const [sidebarExpanded, setSidebarExpanded] = useState(false);
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

  const [shareMode,       setShareMode]       = useState("link");
  const [emailInput,      setEmailInput]      = useState("");
  const [selectedUser,    setSelectedUser]    = useState("");
  const [permission,      setPermission]      = useState("view");
  const [expiration,      setExpiration]      = useState("7 days");
  const [usageLimit,      setUsageLimit]      = useState("50");
  const [passwordEnabled, setPasswordEnabled] = useState(true);
  const [password,        setPassword]        = useState("Vault-2026");
  const [restrictDevice,  setRestrictDevice]  = useState(true);
  const [restrictIp,      setRestrictIp]      = useState(false);
  const [sharedUsers,     setSharedUsers]     = useState(mockSharedUsers);

  const shareLink = `https://airvault.io/share/${fileId || "file-001"}`;

  const permissionConflict = useMemo(
    () => permission === "download" && shareMode === "email" && !emailInput,
    [permission, shareMode, emailInput]
  );

  const handleCopyLink = async () => {
    try { await navigator.clipboard.writeText(shareLink); showSuccess("Share link copied."); }
    catch { showError("Unable to copy link."); }
  };

  const handleShare = () => {
    if (shareMode === "email" && !emailInput.trim()) { showError("Enter a recipient email."); return; }
    if (shareMode === "user" && !selectedUser.trim()) { showError("Select a user to share with."); return; }
    showSuccess("Share settings applied and logged.");
  };

  const removeAccess = (id) => {
    setSharedUsers((prev) => prev.filter((u) => u.id !== id));
    showSuccess("Access removed.");
  };

  /* Shared style helpers — identical to FileUpload / Permissions */
  const card = `rounded-2xl border backdrop-blur-xl shadow-xl transition-all duration-300 ${
    isDark ? "bg-slate-800/50 border-slate-700/50" : "bg-white/80 border-gray-200"
  }`;
  const inputCls = `w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${
    isDark
      ? "bg-slate-800/60 border-slate-700/50 text-white placeholder:text-gray-500 focus:border-cyan-500/50 focus:ring-cyan-500/20"
      : "bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-cyan-400 focus:ring-cyan-500/20"
  }`;
  const innerRow = `p-4 rounded-xl border ${isDark ? "bg-slate-900/50 border-slate-700/50" : "bg-gray-50 border-gray-200"}`;

  /* ── No-vault guard ── */
  if (!activeVault) {
    return (
      <div className={`h-screen w-full flex items-center justify-center ${isDark ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" : "bg-gradient-to-br from-gray-50 via-white to-gray-100"}`}>
        <div className="text-center px-6">
          <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-cyan-500/30">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <p className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>No vault selected</p>
          <p className={`text-sm mt-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>Select a vault to manage sharing.</p>
          <button onClick={() => navigate("/vaults")} className="mt-6 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white font-semibold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.03] transition-all duration-300">
            Go to Vaults
          </button>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════ RENDER ══ */
  return (
    <div className={`h-screen w-full overflow-hidden transition-colors duration-500 ${isDark ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" : "bg-gradient-to-br from-gray-50 via-white to-gray-100"}`}>

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
                <button
                  onClick={() => navigate("/vault/files")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all duration-200 self-start ${isDark ? "bg-slate-800/50 border-slate-700/50 text-gray-300 hover:text-white hover:border-cyan-500/40" : "bg-white/80 border-gray-200 text-gray-600 hover:border-cyan-400"}`}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Files
                </button>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-semibold self-start sm:self-auto ${isDark ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-600"}`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Access logging enabled
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30 hover:rotate-6 hover:scale-110 transition-all duration-500 cursor-default flex-shrink-0">
                  <Link2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className={`text-3xl lg:text-4xl font-bold tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>File Sharing</h1>
                  <p className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>Manage secure access to this file</p>
                </div>
              </div>
            </motion.div>

            {/* ══ GRID ══ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">

              {/* ═══ LEFT — main controls ═══ */}
              <div className="lg:col-span-2 space-y-5 sm:space-y-6">

                {/* ── Share Mode + Link/Email/User ── */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className={`${card}`}>
                  <div className="h-[2px] bg-gradient-to-r from-violet-500 via-purple-600 to-indigo-600 overflow-hidden rounded-t-2xl" />
                  <div className="p-5 sm:p-6">
                    <h2 className={`text-sm sm:text-base font-bold mb-5 flex items-center gap-2.5 ${isDark ? "text-white" : "text-gray-900"}`}>
                      <SectionIcon gradient="from-violet-500 to-purple-600" Icon={Link2} />
                      Share Settings
                    </h2>

                    {/* Mode tabs */}
                    <div className={`inline-flex p-1 rounded-2xl border mb-5 ${isDark ? "bg-slate-800/60 border-slate-700/50" : "bg-gray-100/80 border-gray-200"}`}>
                      {[
                        { id: "link",  label: "Share Link", Icon: Link2 },
                        { id: "email", label: "Email",      Icon: Mail  },
                        { id: "user",  label: "User",       Icon: Users },
                      ].map(({ id, label, Icon }) => (
                        <button
                          key={id}
                          onClick={() => setShareMode(id)}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 ${
                            shareMode === id
                              ? "bg-gradient-to-r from-violet-500 via-purple-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25"
                              : isDark ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-800"
                          }`}
                        >
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          <span className="hidden sm:inline">{label}</span>
                          <span className="sm:hidden">{label.split(" ")[0]}</span>
                        </button>
                      ))}
                    </div>

                    {/* Mode content */}
                    <AnimatePresence mode="wait">
                      {shareMode === "link" && (
                        <motion.div key="link" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.2 }}
                          className={innerRow}>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Shareable link</p>
                              <p className={`text-sm font-medium break-all ${isDark ? "text-white" : "text-gray-900"}`}>{shareLink}</p>
                            </div>
                            <motion.button
                              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                              onClick={handleCopyLink}
                              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all duration-300 flex-shrink-0"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              Copy Link
                            </motion.button>
                          </div>
                        </motion.div>
                      )}

                      {shareMode === "email" && (
                        <motion.div key="email" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.2 }}
                          className={innerRow}>
                          <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Recipient Email</label>
                          <div className="relative">
                            <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                            <input
                              value={emailInput}
                              onChange={(e) => setEmailInput(e.target.value)}
                              placeholder="name@company.com"
                              className={`${inputCls} pl-10`}
                            />
                          </div>
                        </motion.div>
                      )}

                      {shareMode === "user" && (
                        <motion.div key="user" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.2 }}
                          className={innerRow}>
                          <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Select User</label>
                          <CustomSelect
                            value={selectedUser}
                            onChange={setSelectedUser}
                            placeholder="Choose a user…"
                            options={[
                              { value: "ava",    label: "Ava Reed"    },
                              { value: "marcus", label: "Marcus Hill" },
                              { value: "nadia",  label: "Nadia Park"  },
                            ]}
                            isDark={isDark}
                            icon={Users}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Permission conflict warning */}
                    <AnimatePresence>
                      {permissionConflict && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                          className={`mt-4 flex items-start gap-3 p-3.5 rounded-xl border ${isDark ? "bg-amber-500/10 border-amber-500/30" : "bg-amber-50 border-amber-200"}`}>
                          <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isDark ? "text-amber-400" : "text-amber-600"}`} />
                          <div>
                            <p className={`text-xs font-semibold ${isDark ? "text-amber-300" : "text-amber-700"}`}>Permission conflict detected</p>
                            <p className={`text-xs mt-0.5 ${isDark ? "text-amber-300/80" : "text-amber-600"}`}>Add a recipient email to apply download permissions.</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>

                {/* ── Permissions + Expiration ── */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }} className={`${card}`}>
                  <div className="h-[2px] bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 overflow-hidden rounded-t-2xl" />
                  <div className="p-5 sm:p-6">
                    <h2 className={`text-sm sm:text-base font-bold mb-5 flex items-center gap-2.5 ${isDark ? "text-white" : "text-gray-900"}`}>
                      <SectionIcon gradient="from-cyan-500 to-blue-600" Icon={Eye} />
                      Access Permissions
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                      {/* Permission picker */}
                      <div>
                        <label className={`block text-[10px] font-bold uppercase tracking-widest mb-3 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Permission Level</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: "view",     label: "View",     Icon: Eye      },
                            { id: "download", label: "Download", Icon: Download },
                            { id: "edit",     label: "Edit",     Icon: Edit     },
                          ].map(({ id, label, Icon }) => (
                            <button
                              key={id}
                              onClick={() => setPermission(id)}
                              className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border text-xs font-semibold transition-all duration-200 ${
                                permission === id
                                  ? "bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border-cyan-500/50 text-cyan-400 shadow-lg shadow-cyan-500/10"
                                  : isDark ? "bg-slate-900/50 border-slate-700/50 text-gray-400 hover:border-slate-600" : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300"
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Expiration */}
                      <div>
                        <label className={`block text-[10px] font-bold uppercase tracking-widest mb-3 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Link Expiration</label>
                        <CustomSelect
                          value={expiration}
                          onChange={setExpiration}
                          options={[
                            { value: "1 day",         label: "1 day"         },
                            { value: "7 days",        label: "7 days"        },
                            { value: "30 days",       label: "30 days"       },
                            { value: "No expiration", label: "No expiration" },
                          ]}
                          isDark={isDark}
                          icon={Calendar}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* ── Usage limit + Password ── */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className={`${card}`}>
                  <div className="h-[2px] bg-gradient-to-r from-emerald-500 to-teal-600 overflow-hidden rounded-t-2xl" />
                  <div className="p-5 sm:p-6">
                    <h2 className={`text-sm sm:text-base font-bold mb-5 flex items-center gap-2.5 ${isDark ? "text-white" : "text-gray-900"}`}>
                      <SectionIcon gradient="from-emerald-500 to-teal-600" Icon={Lock} />
                      Link Controls
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                      {/* Usage limit */}
                      <div>
                        <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Usage Limit</label>
                        <div className="relative">
                          <Globe className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                          <input
                            value={usageLimit}
                            onChange={(e) => setUsageLimit(e.target.value)}
                            className={`${inputCls} pl-10`}
                          />
                        </div>
                        <p className={`text-[11px] mt-1.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}>Max number of accesses</p>
                      </div>

                      {/* Password */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? "text-gray-400" : "text-gray-500"}`}>Password Protection</label>
                          <Toggle state={passwordEnabled} onToggle={() => setPasswordEnabled((v) => !v)} isDark={isDark} />
                        </div>
                        <input
                          type="text"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={!passwordEnabled}
                          placeholder="Set a password"
                          className={`${inputCls} disabled:opacity-40`}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* ── Security toggles ── */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.23 }} className={`${card}`}>
                  <div className="h-[2px] bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 overflow-hidden rounded-t-2xl" />
                  <div className="p-5 sm:p-6">
                    <div className="mb-5">
                      <h2 className={`text-sm sm:text-base font-bold flex items-center gap-2.5 ${isDark ? "text-white" : "text-gray-900"}`}>
                        <SectionIcon gradient="from-red-500 to-orange-600" Icon={Shield} />
                        Security Restrictions
                      </h2>
                      <p className={`text-xs mt-2 ml-11 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                        Restrict where this link can be used.
                      </p>
                    </div>
                    <div className="space-y-3">
                      {[
                        {
                          Icon: Globe, gradient: "from-violet-500 to-purple-600",
                          title: "Device Lock",
                          desc: "Only allow access from the original device",
                          state: restrictDevice, toggle: () => setRestrictDevice((v) => !v),
                        },
                        {
                          Icon: Wifi, gradient: "from-cyan-500 to-teal-600",
                          title: "IP Lock",
                          desc: "Restrict access to specific IP addresses",
                          state: restrictIp, toggle: () => setRestrictIp((v) => !v),
                        },
                      ].map(({ Icon, gradient, title, desc, state, toggle }) => (
                        <div key={title} className={`flex items-center justify-between gap-4 p-4 rounded-xl border transition-all duration-300 ${
                          state
                            ? isDark ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-50 border-amber-200"
                            : isDark ? "bg-slate-900/50 border-slate-700/50" : "bg-gray-50 border-gray-200"
                        }`}>
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-9 h-9 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}>
                              <Icon className="w-4 h-4 text-white" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className={`font-semibold text-sm ${isDark ? "text-white" : "text-gray-900"}`}>{title}</p>
                                {state && <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${isDark ? "bg-amber-500/20 text-amber-400" : "bg-amber-100 text-amber-700"}`}>Active</span>}
                              </div>
                              <p className={`text-xs truncate ${isDark ? "text-gray-400" : "text-gray-500"}`}>{desc}</p>
                            </div>
                          </div>
                          <Toggle state={state} onToggle={toggle} isDark={isDark} />
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* ── Action buttons ── */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }} className="flex flex-wrap gap-3">
                  <motion.button
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={handleShare}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all duration-300"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Apply Settings
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={() => showSuccess("Share link revoked.")}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-300 ${
                      isDark
                        ? "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/40"
                        : "bg-red-50 border-red-100 text-red-500 hover:bg-red-100 hover:border-red-200"
                    }`}
                  >
                    <Ban className="w-4 h-4" />
                    Revoke Link
                  </motion.button>
                </motion.div>
              </div>

              {/* ═══ RIGHT sidebar ═══ */}
              <div className="space-y-5 sm:space-y-6">

                {/* Shared users */}
                <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className={`${card}`}>
                  <div className="h-[2px] bg-gradient-to-r from-blue-600 to-indigo-600 overflow-hidden rounded-t-2xl" />
                  <div className="p-5">
                    <h3 className={`text-sm font-bold mb-4 flex items-center gap-2.5 ${isDark ? "text-white" : "text-gray-900"}`}>
                      <SectionIcon gradient="from-blue-600 to-indigo-600" Icon={Users} />
                      Shared Users
                    </h3>
                    <div className="space-y-2">
                      {sharedUsers.map((user, idx) => (
                        <motion.div
                          key={user.id}
                          initial={{ opacity: 0, x: 8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -8 }}
                          transition={{ delay: idx * 0.06 }}
                          className={`group flex items-center justify-between gap-3 p-3 rounded-xl border transition-all duration-300 ${isDark ? "bg-slate-900/50 border-slate-700/50 hover:border-cyan-500/30" : "bg-gray-50 border-gray-200 hover:border-cyan-300"}`}
                        >
                          <div className="min-w-0">
                            <p className={`text-xs font-semibold truncate ${isDark ? "text-white" : "text-gray-900"}`}>{user.name}</p>
                            <p className={`text-[10px] truncate ${isDark ? "text-gray-400" : "text-gray-500"}`}>{user.email}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className={`text-[10px] px-2 py-1 rounded-full font-semibold capitalize ${permBadge(user.permission, isDark)}`}>
                              {user.permission}
                            </span>
                            <button
                              onClick={() => removeAccess(user.id)}
                              className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 ${isDark ? "text-red-400 hover:bg-red-500/20" : "text-red-500 hover:bg-red-50"}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                      {sharedUsers.length === 0 && (
                        <p className={`text-xs text-center py-4 ${isDark ? "text-gray-500" : "text-gray-400"}`}>No users with access</p>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* Suspicious access alert */}
                <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className={`rounded-2xl border backdrop-blur-xl shadow-xl ${isDark ? "bg-red-500/10 border-red-500/20" : "bg-red-50 border-red-200"}`}>
                  <div className="h-[2px] bg-gradient-to-r from-red-500 to-orange-500 overflow-hidden rounded-t-2xl" />
                  <div className="p-5">
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                        <AlertTriangle className="w-4 h-4 text-white" />
                      </div>
                      <p className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Suspicious Access</p>
                    </div>
                    <p className={`text-xs leading-relaxed ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      <span className={`font-semibold ${isDark ? "text-red-400" : "text-red-600"}`}>2 attempts blocked</span> in the last 24 hours. Review logs for device anomalies.
                    </p>
                  </div>
                </motion.div>

                {/* Access tracking */}
                <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }} className={`${card}`}>
                  <div className="h-[2px] bg-gradient-to-r from-emerald-500 to-teal-600 overflow-hidden rounded-t-2xl" />
                  <div className="p-5">
                    <div className="flex items-center gap-2.5 mb-3">
                      <SectionIcon gradient="from-emerald-500 to-teal-600" Icon={Wifi} />
                      <p className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Access Tracking</p>
                    </div>
                    <p className={`text-xs leading-relaxed ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                      IP, device, and geolocation checks are active for this share link.
                    </p>
                    <div className="mt-3 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className={`text-[10px] font-semibold ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>Live monitoring</span>
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

export default FileSharing;