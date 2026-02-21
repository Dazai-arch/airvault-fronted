import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Shield,
  Users,
  Lock,
  Unlock,
  Eye,
  Upload,
  Edit3,
  Trash2,
  Share2,
  Copy,
  Plus,
  X,
  CheckCircle,
  AlertCircle,
  Activity,
  Download,
  Smartphone,
  ChevronDown,
  Globe,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useVault } from "../context/VaultContext";
import VaultTopBar from "../components/layout/VaultTopBar";
import HamburgerMenu from "../components/layout/HamburgerMenu";

/* ─── Roles ─────────────────────────────────────────────────────────────── */
const ASSIGNABLE_ROLES = ["viewer", "editor"];
const ROLE_LABELS = {
  viewer: "Viewer — Read only",
  editor: "Editor — Can upload & edit",
};

/* ─── CustomSelect — exact port from FileUpload.jsx ─────────────────────── */
const CustomSelect = ({ value, onChange, options, disabled, isDark, labelMap }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const display = labelMap ? (labelMap[value] ?? value) : value;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 disabled:opacity-50 ${
          isDark
            ? `bg-slate-800/60 border-slate-700/50 text-white hover:border-cyan-500/40 ${open ? "border-cyan-500/50 ring-2 ring-cyan-500/20" : ""}`
            : `bg-gray-50 border-gray-200 text-gray-900 hover:border-cyan-400 ${open ? "border-cyan-400 ring-2 ring-cyan-500/20" : ""}`
        }`}
      >
        <span className="truncate">{display}</span>
        <ChevronDown className={`w-4 h-4 ml-2 flex-shrink-0 transition-transform duration-200 ${isDark ? "text-gray-400" : "text-gray-500"} ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-50 w-full mt-1.5 rounded-xl border shadow-2xl overflow-hidden ${isDark ? "bg-slate-900 border-slate-700/60" : "bg-white border-gray-200"}`}
          >
            <div className="h-[2px] bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600" />
            {options.map((opt) => {
              const label = labelMap ? (labelMap[opt] ?? opt) : opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => { onChange(opt); setOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors duration-150 flex items-center justify-between ${
                    opt === value
                      ? isDark ? "bg-cyan-500/15 text-cyan-400 font-semibold" : "bg-cyan-50 text-cyan-600 font-semibold"
                      : isDark ? "text-gray-300 hover:bg-slate-800" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span>{label}</span>
                  {opt === value && <CheckCircle className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─── SectionIcon ────────────────────────────────────────────────────────── */
const SectionIcon = ({ gradient, Icon }) => (
  <div className={`w-9 h-9 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}>
    <Icon className="w-4 h-4 text-white" />
  </div>
);

/* ─── Toggle switch ──────────────────────────────────────────────────────── */
const Toggle = ({ state, onToggle, isDark }) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onToggle}
    className={`relative w-11 h-6 rounded-full transition-all duration-300 flex-shrink-0 ${
      state
        ? "bg-gradient-to-r from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30"
        : isDark ? "bg-slate-700" : "bg-gray-300"
    }`}
  >
    <motion.div
      animate={{ x: state ? 22 : 3 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="w-4.5 h-4.5 bg-white rounded-full absolute top-[3px] shadow-sm"
      style={{ width: 18, height: 18 }}
    />
  </motion.button>
);

/* ══════════════════════════════════════════════════════════════════════════ */
const Permissions = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { activeVault } = useVault();

  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const SIDEBAR_COLLAPSED = 60;
  const SIDEBAR_EXPANDED  = 220;
  const sidebarW = sidebarExpanded ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED;

  useEffect(() => {
    const h = (e) => setSidebarExpanded(e.detail.expanded);
    window.addEventListener("sidebarToggle", h);
    return () => window.removeEventListener("sidebarToggle", h);
  }, []);

  const [vaultLocked,        setVaultLocked]        = useState(false);
  const [showAddUserModal,   setShowAddUserModal]   = useState(false);
  const [newUserEmail,       setNewUserEmail]       = useState("");
  const [newUserRole,        setNewUserRole]        = useState("viewer");
  const [selectedUser,       setSelectedUser]       = useState(null);
  /* Vault-wide security toggles */
  const [downloadRestricted, setDownloadRestricted] = useState(false);
  const [deviceRestricted,   setDeviceRestricted]   = useState(false);
  const [copied,             setCopied]             = useState(false);

  /* Users — owner / editor / viewer with per-user canDownload flag */
  const [users, setUsers] = useState([
    {
      id: 1,
      name: "You",
      email: "user@example.com",
      role: "owner",
      avatar: "U",
      joinDate: "2025-12-01",
      permissions: { view: true, upload: true, edit: true, delete: true, share: true },
      canDownload: true,   // per-user download flag
      status: "active",
      lastActivity: "2 minutes ago",
    },
    {
      id: 2,
      name: "Sarah Wilson",
      email: "sarah@example.com",
      role: "editor",
      avatar: "SW",
      joinDate: "2026-01-15",
      permissions: { view: true, upload: true, edit: true, delete: false, share: false },
      canDownload: true,
      status: "active",
      lastActivity: "1 hour ago",
    },
    {
      id: 3,
      name: "Michael Brown",
      email: "michael@example.com",
      role: "viewer",
      avatar: "MB",
      joinDate: "2026-02-01",
      permissions: { view: true, upload: false, edit: false, delete: false, share: false },
      canDownload: false,  // restricted by default for viewer
      status: "inactive",
      lastActivity: "3 days ago",
    },
  ]);

  const defaultPermissions = (role) => ({
    view:   true,
    upload: role !== "viewer",
    edit:   role === "editor" || role === "owner",
    delete: role === "owner",
    share:  role === "owner",
  });

  const handleAddUser = () => {
    if (!newUserEmail.trim()) return;
    const newUser = {
      id: Date.now(),
      name: newUserEmail.split("@")[0],
      email: newUserEmail,
      role: newUserRole,
      avatar: newUserEmail.substring(0, 2).toUpperCase(),
      joinDate: new Date().toISOString().split("T")[0],
      permissions: defaultPermissions(newUserRole),
      canDownload: newUserRole !== "viewer", // viewers default to restricted
      status: "pending",
      lastActivity: "Pending acceptance",
    };
    setUsers([...users, newUser]);
    setNewUserEmail("");
    setNewUserRole("viewer");
    setShowAddUserModal(false);
  };

  const handleRemoveUser = (userId) => {
    setUsers(users.filter((u) => u.id !== userId));
    setSelectedUser(null);
  };

  const handlePermissionToggle = (userId, permission) => {
    setUsers(users.map((user) =>
      user.id === userId && user.role !== "owner"
        ? { ...user, permissions: { ...user.permissions, [permission]: !user.permissions[permission] } }
        : user
    ));
  };

  const handleDownloadToggle = (userId) => {
    setUsers(users.map((user) =>
      user.id === userId && user.role !== "owner"
        ? { ...user, canDownload: !user.canDownload }
        : user
    ));
  };

  const handleRoleChange = (userId, newRole) => {
    setUsers(users.map((user) =>
      user.id === userId && user.role !== "owner"
        ? { ...user, role: newRole, permissions: defaultPermissions(newRole), canDownload: newRole !== "viewer" }
        : user
    ));
  };

  const copyVaultLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/vault/join/123abc`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* Shared style helpers */
  const card = `rounded-2xl border backdrop-blur-xl shadow-xl transition-all duration-300 ${
    isDark ? "bg-slate-800/50 border-slate-700/50" : "bg-white/80 border-gray-200"
  }`;
  const inputCls = isDark
    ? "bg-slate-800/60 border-slate-700/50 text-white placeholder:text-gray-500 focus:border-cyan-500/50 focus:ring-cyan-500/20"
    : "bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-cyan-400 focus:ring-cyan-500/20";

  const roleBadgeCls = (role) =>
    role === "owner"  ? isDark ? "bg-rose-500/10 text-rose-400"    : "bg-rose-50 text-rose-600"   :
    role === "editor" ? isDark ? "bg-cyan-500/10 text-cyan-400"    : "bg-cyan-50 text-cyan-600"   :
                        isDark ? "bg-indigo-500/10 text-indigo-400" : "bg-indigo-50 text-indigo-600";

  const avatarGrad = (role) =>
    role === "owner"  ? "from-rose-500 to-pink-600 shadow-rose-500/30"     :
    role === "editor" ? "from-cyan-500 to-blue-600 shadow-cyan-500/30"     :
                        "from-indigo-500 to-violet-600 shadow-indigo-500/30";

  /* ── No-vault guard ── */
  if (!activeVault) {
    return (
      <div className={`h-screen w-full flex items-center justify-center ${isDark ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" : "bg-gradient-to-br from-gray-50 via-white to-gray-100"}`}>
        <div className="text-center px-6">
          <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-cyan-500/30">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <p className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>No vault selected</p>
          <p className={`text-sm mt-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>Select a vault to manage permissions.</p>
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

      <VaultTopBar />
      <HamburgerMenu />

      <motion.main
        initial={false}
        animate={{ marginLeft: sidebarW }}
        transition={{ type: "spring", damping: 24, stiffness: 280 }}
        className="relative z-10 flex h-[calc(100vh-4rem)] mt-16"
      >
        <div className="flex-1 overflow-y-auto vault-scrollbar">
          <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

            {/* Page heading */}
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
              <button
                onClick={() => navigate("/vault/dashboard")}
                className={`flex items-center gap-2 mb-5 px-4 py-2 rounded-xl border text-sm font-medium transition-all duration-200 ${isDark ? "bg-slate-800/50 border-slate-700/50 text-gray-300 hover:text-white hover:border-cyan-500/40" : "bg-white/80 border-gray-200 text-gray-600 hover:border-cyan-400"}`}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </button>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/30 hover:rotate-6 hover:scale-110 transition-all duration-500 cursor-default flex-shrink-0">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className={`text-3xl lg:text-4xl font-bold tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>Vault Permissions</h1>
                  <p className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>Manage access control and security settings</p>
                </div>
              </div>
            </motion.div>

            <div className="space-y-5 sm:space-y-6">

              {/* ── 1. Vault Information ── */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className={`${card} overflow-hidden`}>
                <div className="h-[2px] bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600" />
                <div className="p-5 sm:p-6">
                  <h2 className={`text-sm sm:text-base font-bold mb-5 flex items-center gap-2.5 ${isDark ? "text-white" : "text-gray-900"}`}>
                    <SectionIcon gradient="from-cyan-500 to-blue-600" Icon={Shield} />
                    Vault Information
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {[
                      { label: "Vault Name",    value: activeVault?.name || "My Vault" },
                      { label: "Vault Owner",   value: "You" },
                      { label: "Creation Date", value: "Dec 1, 2025" },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>{label}</p>
                        <p className={`text-sm sm:text-base font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>{value}</p>
                      </div>
                    ))}
                    <div>
                      <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Vault Type</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`text-sm sm:text-base font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>Shared</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-600"}`}>
                          {users.length} members
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* ── 2. Security Status ── */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }} className={`${card} overflow-hidden`}>
                <div className="h-[2px] bg-gradient-to-r from-indigo-500 to-violet-600" />
                <div className="p-5 sm:p-6">
                  <h2 className={`text-sm sm:text-base font-bold mb-5 flex items-center gap-2.5 ${isDark ? "text-white" : "text-gray-900"}`}>
                    <SectionIcon gradient="from-indigo-500 to-violet-600" Icon={Activity} />
                    Security Status
                  </h2>
                  <div className="space-y-3">
                    {/* Lock */}
                    <div className={`flex items-center justify-between gap-3 p-4 rounded-xl border ${isDark ? "bg-slate-900/50 border-slate-700/50" : "bg-gray-50 border-gray-200"}`}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${vaultLocked ? (isDark ? "bg-amber-500/10" : "bg-amber-50") : (isDark ? "bg-emerald-500/10" : "bg-emerald-50")}`}>
                          {vaultLocked
                            ? <Lock className={`w-4 h-4 ${isDark ? "text-amber-400" : "text-amber-600"}`} />
                            : <Unlock className={`w-4 h-4 ${isDark ? "text-emerald-400" : "text-emerald-600"}`} />}
                        </div>
                        <div className="min-w-0">
                          <p className={`font-semibold text-sm ${isDark ? "text-white" : "text-gray-900"}`}>Vault Lock Status</p>
                          <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                            {vaultLocked ? "Vault is locked — access restricted" : "Vault is unlocked — access open"}
                          </p>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setVaultLocked(!vaultLocked)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 border flex-shrink-0 ${
                          vaultLocked
                            ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-transparent shadow-lg shadow-cyan-500/30"
                            : isDark ? "bg-slate-800/60 border-slate-700/50 text-amber-400 hover:border-amber-500/40" : "bg-white border-gray-200 text-amber-600 hover:border-amber-400"
                        }`}
                      >
                        {vaultLocked ? "Unlock" : "Lock"}
                      </motion.button>
                    </div>
                    {/* Activity */}
                    <div className={`flex items-center justify-between gap-3 p-4 rounded-xl border ${isDark ? "bg-slate-900/50 border-slate-700/50" : "bg-gray-50 border-gray-200"}`}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? "bg-emerald-500/10" : "bg-emerald-50"}`}>
                          <CheckCircle className={`w-4 h-4 ${isDark ? "text-emerald-400" : "text-emerald-600"}`} />
                        </div>
                        <div>
                          <p className={`font-semibold text-sm ${isDark ? "text-white" : "text-gray-900"}`}>Activity Tracking</p>
                          <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>Real-time access monitoring enabled</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className={`text-[10px] font-semibold ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>Live</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* ── 3. User Access Control ── */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className={`${card} overflow-hidden`}>
                <div className="h-[2px] bg-gradient-to-r from-blue-600 to-indigo-600" />
                <div className="p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-3 mb-5">
                    <h2 className={`text-sm sm:text-base font-bold flex items-center gap-2.5 ${isDark ? "text-white" : "text-gray-900"}`}>
                      <SectionIcon gradient="from-blue-600 to-indigo-600" Icon={Users} />
                      User Access Control
                    </h2>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowAddUserModal(true)}
                      className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-[1.02] transition-all duration-300 flex-shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Add User</span>
                      <span className="sm:hidden">Add</span>
                    </motion.button>
                  </div>

                  <div className="space-y-3">
                    {users.map((user, idx) => (
                      <motion.div
                        key={user.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.06 }}
                        className={`rounded-xl border transition-all duration-300 overflow-hidden ${isDark ? "bg-slate-900/50 border-slate-700/50 hover:border-cyan-500/30" : "bg-gray-50 border-gray-200 hover:border-cyan-500/40"}`}
                      >
                        {/* User row */}
                        <div
                          className="flex items-center justify-between gap-3 p-4 cursor-pointer select-none"
                          onClick={() => setSelectedUser(selectedUser?.id === user.id ? null : user)}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm flex-shrink-0 shadow-lg bg-gradient-to-br ${avatarGrad(user.role)}`}>
                              {user.avatar}
                            </div>
                            <div className="min-w-0">
                              <p className={`font-semibold text-sm truncate ${isDark ? "text-white" : "text-gray-900"}`}>{user.name}</p>
                              <p className={`text-xs truncate ${isDark ? "text-gray-400" : "text-gray-500"}`}>{user.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {/* Download restriction badge */}
                            {!user.canDownload && (
                              <span className={`hidden sm:inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full font-semibold ${isDark ? "bg-red-500/10 text-red-400" : "bg-red-50 text-red-500"}`}>
                                <Download className="w-2.5 h-2.5" /> Restricted
                              </span>
                            )}
                            <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold capitalize ${roleBadgeCls(user.role)}`}>
                              {user.role}
                            </span>
                            {user.status === "active" && (
                              <span className={`hidden md:inline-flex text-[10px] px-2.5 py-1 rounded-full font-semibold ${isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-600"}`}>
                                Active
                              </span>
                            )}
                            {user.role !== "owner" && (
                              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${selectedUser?.id === user.id ? "rotate-180" : ""} ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                            )}
                          </div>
                        </div>

                        {/* Last-activity strip */}
                        {selectedUser?.id !== user.id && (
                          <div className="flex items-center gap-2 px-4 pb-3">
                            <div className={`w-1 h-1 rounded-full flex-shrink-0 ${user.status === "active" ? "bg-emerald-400" : isDark ? "bg-gray-600" : "bg-gray-300"}`} />
                            <p className={`text-[10px] truncate ${isDark ? "text-gray-500" : "text-gray-400"}`}>{user.lastActivity}</p>
                          </div>
                        )}

                        {/* ── Expanded panel ── */}
                        <AnimatePresence>
                          {selectedUser?.id === user.id && user.role !== "owner" && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className={`border-t ${isDark ? "border-slate-700/50" : "border-gray-200"}`}
                            >
                              <div className="p-4 sm:p-5 space-y-5">

                                {/* Role */}
                                <div>
                                  <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Role</label>
                                  <CustomSelect
                                    value={user.role}
                                    onChange={(val) => handleRoleChange(user.id, val)}
                                    options={ASSIGNABLE_ROLES}
                                    labelMap={ROLE_LABELS}
                                    isDark={isDark}
                                  />
                                </div>

                                {/* File permissions */}
                                <div>
                                  <label className={`block text-[10px] font-bold uppercase tracking-widest mb-3 ${isDark ? "text-gray-400" : "text-gray-500"}`}>File Permissions</label>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {[
                                      { key: "view",   label: "View Files",   Icon: Eye },
                                      { key: "upload", label: "Upload Files", Icon: Upload },
                                      { key: "edit",   label: "Edit Files",   Icon: Edit3 },
                                      { key: "delete", label: "Delete Files", Icon: Trash2 },
                                      { key: "share",  label: "Share Files",  Icon: Share2 },
                                    ].map(({ key, label, Icon }) => (
                                      <label
                                        key={key}
                                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                                          user.permissions[key]
                                            ? isDark ? "bg-cyan-500/10 border-cyan-500/30" : "bg-cyan-50 border-cyan-200"
                                            : isDark ? "bg-slate-800/40 border-slate-700/40 hover:border-slate-600" : "bg-white border-gray-200 hover:border-gray-300"
                                        }`}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={user.permissions[key] || false}
                                          onChange={() => handlePermissionToggle(user.id, key)}
                                          className="w-4 h-4 accent-cyan-500 flex-shrink-0"
                                        />
                                        <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${user.permissions[key] ? (isDark ? "text-cyan-400" : "text-cyan-600") : (isDark ? "text-gray-500" : "text-gray-400")}`} />
                                        <span className={`text-xs font-medium ${user.permissions[key] ? (isDark ? "text-cyan-300" : "text-cyan-700") : (isDark ? "text-gray-400" : "text-gray-600")}`}>
                                          {label}
                                        </span>
                                      </label>
                                    ))}
                                  </div>
                                </div>

                                {/* ── Per-user download restriction ── */}
                                <div>
                                  <label className={`block text-[10px] font-bold uppercase tracking-widest mb-3 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Download Access</label>
                                  <div className={`flex items-center justify-between gap-4 p-4 rounded-xl border transition-all duration-300 ${
                                    !user.canDownload
                                      ? isDark ? "bg-red-500/10 border-red-500/20" : "bg-red-50 border-red-200"
                                      : isDark ? "bg-emerald-500/10 border-emerald-500/20" : "bg-emerald-50 border-emerald-200"
                                  }`}>
                                    <div className="flex items-center gap-3 min-w-0">
                                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                        !user.canDownload
                                          ? isDark ? "bg-red-500/20" : "bg-red-100"
                                          : isDark ? "bg-emerald-500/20" : "bg-emerald-100"
                                      }`}>
                                        <Download className={`w-4 h-4 ${!user.canDownload ? (isDark ? "text-red-400" : "text-red-500") : (isDark ? "text-emerald-400" : "text-emerald-600")}`} />
                                      </div>
                                      <div className="min-w-0">
                                        <p className={`font-semibold text-sm ${isDark ? "text-white" : "text-gray-900"}`}>
                                          {user.canDownload ? "Downloads allowed" : "Downloads restricted"}
                                        </p>
                                        <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                                          {user.canDownload
                                            ? `${user.name.split(" ")[0]} can download files`
                                            : `${user.name.split(" ")[0]} cannot download files`}
                                        </p>
                                      </div>
                                    </div>
                                    <Toggle state={user.canDownload} onToggle={() => handleDownloadToggle(user.id)} isDark={isDark} />
                                  </div>
                                </div>

                                {/* Remove */}
                                <button
                                  onClick={() => handleRemoveUser(user.id)}
                                  className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all duration-200 ${
                                    isDark
                                      ? "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/40"
                                      : "bg-red-50 border-red-100 text-red-500 hover:bg-red-100 hover:border-red-200"
                                  }`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  Remove User
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* ── 4. Sharing & Collaboration ── */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.23 }} className={`${card} overflow-hidden`}>
                <div className="h-[2px] bg-gradient-to-r from-violet-500 to-purple-600" />
                <div className="p-5 sm:p-6">
                  <h2 className={`text-sm sm:text-base font-bold mb-5 flex items-center gap-2.5 ${isDark ? "text-white" : "text-gray-900"}`}>
                    <SectionIcon gradient="from-indigo-500 to-violet-600" Icon={Share2} />
                    Sharing & Collaboration
                  </h2>
                  <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl border ${isDark ? "bg-slate-900/50 border-slate-700/50" : "bg-gray-50 border-gray-200"}`}>
                    <div>
                      <p className={`font-semibold text-sm ${isDark ? "text-white" : "text-gray-900"}`}>Shared Invite Link</p>
                      <p className={`text-xs mt-0.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Share this link to invite users to your vault</p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={copyVaultLink}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300 flex-shrink-0 ${
                        copied
                          ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30"
                          : "bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50"
                      }`}
                    >
                      {copied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? "Copied!" : "Copy Link"}
                    </motion.button>
                  </div>
                </div>
              </motion.div>

              {/* ── 5. Vault-Wide Security Settings ── */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }} className={`${card} overflow-hidden`}>
                <div className="h-[2px] bg-gradient-to-r from-red-500 via-orange-500 to-amber-500" />
                <div className="p-5 sm:p-6">
                  <div className="mb-5">
                    <h2 className={`text-sm sm:text-base font-bold flex items-center gap-2.5 ${isDark ? "text-white" : "text-gray-900"}`}>
                      <SectionIcon gradient="from-red-500 to-orange-600" Icon={Globe} />
                      Vault-Wide Security
                    </h2>
                    {/* Clear label that these are vault-global, not per-user */}
                    <p className={`text-xs mt-2 ml-11 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                      These settings apply to <span className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>all users</span> and override individual permissions.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {[
                      {
                        Icon: Download,
                        gradient: "from-violet-500 to-purple-600",
                        title: "Block All Downloads",
                        desc: "Prevent every user from downloading — overrides per-user settings",
                        state: downloadRestricted,
                        toggle: () => setDownloadRestricted((v) => !v),
                      },
                      {
                        Icon: Smartphone,
                        gradient: "from-cyan-500 to-teal-600",
                        title: "Device Restrictions",
                        desc: "Limit vault access to registered devices only",
                        state: deviceRestricted,
                        toggle: () => setDeviceRestricted((v) => !v),
                      },
                    ].map(({ Icon, gradient, title, desc, state, toggle }) => (
                      <div
                        key={title}
                        className={`flex items-center justify-between gap-4 p-4 rounded-xl border transition-all duration-300 ${
                          state
                            ? isDark ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-50 border-amber-200"
                            : isDark ? "bg-slate-900/50 border-slate-700/50" : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}>
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className={`font-semibold text-sm ${isDark ? "text-white" : "text-gray-900"}`}>{title}</p>
                              {state && (
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${isDark ? "bg-amber-500/20 text-amber-400" : "bg-amber-100 text-amber-700"}`}>
                                  Active
                                </span>
                              )}
                            </div>
                            <p className={`text-xs truncate ${isDark ? "text-gray-400" : "text-gray-500"}`}>{desc}</p>
                          </div>
                        </div>
                        <Toggle state={state} onToggle={toggle} isDark={isDark} />
                      </div>
                    ))}
                  </div>

                  {/* Warning banner when vault-wide download block is active */}
                  <AnimatePresence>
                    {downloadRestricted && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`mt-3 flex items-start gap-3 p-3.5 rounded-xl border ${isDark ? "bg-amber-500/10 border-amber-500/30" : "bg-amber-50 border-amber-200"}`}
                      >
                        <AlertCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isDark ? "text-amber-400" : "text-amber-600"}`} />
                        <p className={`text-xs ${isDark ? "text-amber-300" : "text-amber-700"}`}>
                          <span className="font-semibold">Vault-wide block active.</span> Downloads are disabled for all users regardless of their individual download settings.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

            </div>
          </div>
        </div>
      </motion.main>

      {/* ══ Add User Modal ══ */}
      <AnimatePresence>
        {showAddUserModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowAddUserModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className={`w-full max-w-md rounded-2xl shadow-2xl border overflow-hidden ${isDark ? "bg-slate-900/98 border-cyan-500/20" : "bg-white/98 border-cyan-500/30"}`}
            >
              <div className="h-[2px] bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600" />
              <div className="p-5 sm:p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className={`text-base font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Add User to Vault</h3>
                      <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>Invite a collaborator</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAddUserModal(false)}
                    className={`p-2 rounded-xl transition-all duration-200 ${isDark ? "text-gray-400 hover:bg-slate-700 hover:text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"}`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Email Address</label>
                    <input
                      type="email"
                      placeholder="user@example.com"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      autoFocus
                      onKeyDown={(e) => e.key === "Enter" && handleAddUser()}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${inputCls}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Role</label>
                    <CustomSelect
                      value={newUserRole}
                      onChange={setNewUserRole}
                      options={ASSIGNABLE_ROLES}
                      labelMap={ROLE_LABELS}
                      isDark={isDark}
                    />
                  </div>
                  {/* Download default note */}
                  <div className={`flex items-start gap-2.5 p-3 rounded-xl border ${isDark ? "bg-slate-800/60 border-slate-700/50" : "bg-gray-50 border-gray-200"}`}>
                    <Download className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${isDark ? "text-gray-400" : "text-gray-500"}`} />
                    <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                      {newUserRole === "viewer"
                        ? <><span className="font-semibold">Downloads will be restricted</span> by default for viewers. You can change this after adding the user.</>
                        : <><span className="font-semibold">Downloads will be allowed</span> by default for editors. You can restrict this after adding the user.</>}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowAddUserModal(false)}
                    className={`flex-1 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-200 ${isDark ? "bg-slate-800 border-slate-700 text-white hover:bg-slate-700" : "bg-gray-100 border-gray-200 text-gray-900 hover:bg-gray-200"}`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddUser}
                    disabled={!newUserEmail.trim()}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    Add User
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

export default Permissions;