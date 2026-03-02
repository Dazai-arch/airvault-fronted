import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Shield, Users, Lock, Unlock, Eye, Upload, Edit3,
  Trash2, Share2, Copy, Plus, X, CheckCircle, AlertCircle,
  Activity, Download, Smartphone, ChevronDown, Globe, RefreshCw,
  Loader2, AlertTriangle, Mail,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useVault } from "../context/VaultContext";
import VaultTopBar from "../components/layout/VaultTopBar";
import HamburgerMenu from "../components/layout/HamburgerMenu";

// ─── API base ─────────────────────────────────────────────────────────────────
const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token")}`,
});

async function apiFetch(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { ...authHeaders(), ...(opts.headers || {}) },
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

// ─── Roles ────────────────────────────────────────────────────────────────────
const ASSIGNABLE_ROLES = ["viewer", "editor"];
const ROLE_LABELS = {
  viewer: "Viewer — Read only",
  editor: "Editor — Can upload & edit",
};

// ─── CustomSelect ─────────────────────────────────────────────────────────────
const CustomSelect = ({ value, onChange, options, disabled, isDark, labelMap }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
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

const SectionIcon = ({ gradient, Icon }) => (
  <div className={`w-9 h-9 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}>
    <Icon className="w-4 h-4 text-white" />
  </div>
);

const Toggle = ({ state, onToggle, isDark, disabled }) => (
  <motion.button
    whileHover={disabled ? {} : { scale: 1.05 }}
    whileTap={disabled ? {} : { scale: 0.95 }}
    onClick={disabled ? undefined : onToggle}
    disabled={disabled}
    className={`relative w-11 h-6 rounded-full transition-all duration-300 flex-shrink-0 disabled:opacity-40 ${
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

// ─── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({ toasts }) => (
  <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 pointer-events-none">
    <AnimatePresence>
      {toasts.map((t) => (
        <motion.div
          key={t.id}
          initial={{ opacity: 0, y: 16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.95 }}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium pointer-events-auto ${
            t.type === "error"
              ? "bg-red-950/95 border-red-500/30 text-red-300"
              : "bg-slate-900/95 border-cyan-500/30 text-white"
          }`}
        >
          {t.type === "error" ? <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" /> : <CheckCircle className="w-4 h-4 text-cyan-400 flex-shrink-0" />}
          {t.message}
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
);

// ══════════════════════════════════════════════════════════════════════════════
export default function Permissions() {
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

  // ── State ──────────────────────────────────────────────────────────────────
  const [loading,          setLoading]          = useState(true);
  const [saving,           setSaving]           = useState(null); // memberId | "security" | "invite"
  const [members,          setMembers]          = useState([]);
  const [security,         setSecurity]         = useState({ blockAllDownloads: false, deviceRestricted: false, isLocked: false });
  const [vaultInfo,        setVaultInfo]        = useState(null);
  const [toasts,           setToasts]           = useState([]);

  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserEmail,     setNewUserEmail]     = useState("");
  const [newUserRole,      setNewUserRole]      = useState("viewer");
  const [inviteMessage,    setInviteMessage]    = useState("");

  const [selectedUser,     setSelectedUser]     = useState(null);
  const [copied,           setCopied]           = useState(false);

  const vaultId = activeVault?.id || activeVault?._id;

  // ── Toast helpers ──────────────────────────────────────────────────────────
  const toast = useCallback((message, type = "success") => {
    const id = Date.now();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  // ── Load members + security ────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!vaultId) return;
    setLoading(true);
    try {
      const data = await apiFetch(`/vaults/${vaultId}/members`);
      setMembers(data.members || []);
      setSecurity(data.security || { blockAllDownloads: false, deviceRestricted: false, isLocked: false });
      setVaultInfo(data.vaultInfo || null);
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [vaultId, toast]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Invite user ────────────────────────────────────────────────────────────
  const handleAddUser = async () => {
    if (!newUserEmail.trim()) return;
    setSaving("invite");
    try {
      await apiFetch(`/vaults/${vaultId}/members`, {
        method: "POST",
        body: JSON.stringify({ email: newUserEmail.trim(), role: newUserRole, message: inviteMessage }),
      });
      toast(`Invitation sent to ${newUserEmail}`);
      setNewUserEmail("");
      setNewUserRole("viewer");
      setInviteMessage("");
      setShowAddUserModal(false);
      await loadData();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setSaving(null);
    }
  };

  // ── Remove member ──────────────────────────────────────────────────────────
  const handleRemoveUser = async (memberId, email) => {
    setSaving(memberId);
    try {
      await apiFetch(`/vaults/${vaultId}/members/${memberId}`, { method: "DELETE" });
      toast(`Access revoked for ${email}`);
      setSelectedUser(null);
      await loadData();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setSaving(null);
    }
  };

  // ── Update permission toggle ───────────────────────────────────────────────
  const handlePermissionToggle = async (member, permKey) => {
    if (member.isOwner) return;
    const updated = {
      permissions: { ...member.permissions, [permKey]: !member.permissions[permKey] },
    };
    setMembers((ms) => ms.map((m) => m.id === member.id ? { ...m, ...updated } : m));
    try {
      await apiFetch(`/vaults/${vaultId}/members/${member.id}`, {
        method: "PATCH",
        body: JSON.stringify(updated),
      });
    } catch (err) {
      toast(err.message, "error");
      await loadData();
    }
  };

  // ── Toggle canDownload ─────────────────────────────────────────────────────
  const handleDownloadToggle = async (member) => {
    if (member.isOwner) return;
    const canDownload = !member.canDownload;
    setMembers((ms) => ms.map((m) => m.id === member.id ? { ...m, canDownload } : m));
    try {
      await apiFetch(`/vaults/${vaultId}/members/${member.id}`, {
        method: "PATCH",
        body: JSON.stringify({ canDownload }),
      });
    } catch (err) {
      toast(err.message, "error");
      await loadData();
    }
  };

  // ── Role change ────────────────────────────────────────────────────────────
  const handleRoleChange = async (member, newRole) => {
    if (member.isOwner) return;
    setMembers((ms) => ms.map((m) => m.id === member.id ? { ...m, role: newRole } : m));
    try {
      await apiFetch(`/vaults/${vaultId}/members/${member.id}`, {
        method: "PATCH",
        body: JSON.stringify({ role: newRole }),
      });
      toast("Role updated");
    } catch (err) {
      toast(err.message, "error");
      await loadData();
    }
  };

  // ── Vault-wide security ────────────────────────────────────────────────────
  const handleSecurityToggle = async (key) => {
    const updated = { ...security, [key]: !security[key] };
    setSecurity(updated);
    setSaving("security");
    try {
      await apiFetch(`/vaults/${vaultId}/security`, {
        method: "PATCH",
        body: JSON.stringify({ [key]: updated[key] }),
      });
    } catch (err) {
      toast(err.message, "error");
      setSecurity(security);
    } finally {
      setSaving(null);
    }
  };

  // ── Copy invite link ───────────────────────────────────────────────────────
  const copyVaultLink = async () => {
    try {
      const data = await apiFetch(`/vaults/${vaultId}/invite-link`);
      await navigator.clipboard.writeText(data.link);
      setCopied(true);
      toast("Invite link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      navigator.clipboard.writeText(`${window.location.origin}/vault/join/${vaultId}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ── Style helpers ──────────────────────────────────────────────────────────
  const card = `rounded-2xl border backdrop-blur-xl shadow-xl transition-all duration-300 ${isDark ? "bg-slate-800/50 border-slate-700/50" : "bg-white/80 border-gray-200"}`;
  const inputCls = isDark
    ? "bg-slate-800/60 border-slate-700/50 text-white placeholder:text-gray-500 focus:border-cyan-500/50 focus:ring-cyan-500/20"
    : "bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-cyan-400 focus:ring-cyan-500/20";

  const roleBadgeCls = (role) =>
    role === "owner"  ? isDark ? "bg-rose-500/10 text-rose-400"    : "bg-rose-50 text-rose-600"   :
    role === "editor" ? isDark ? "bg-cyan-500/10 text-cyan-400"    : "bg-cyan-50 text-cyan-600"   :
                        isDark ? "bg-indigo-500/10 text-indigo-400" : "bg-indigo-50 text-indigo-600";

  const avatarGrad = (role) =>
    role === "owner"  ? "from-rose-500 to-pink-600 shadow-rose-500/30"    :
    role === "editor" ? "from-cyan-500 to-blue-600 shadow-cyan-500/30"    :
                        "from-indigo-500 to-violet-600 shadow-indigo-500/30";

  const statusBadge = (status) =>
    status === "active"  ? isDark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-600" :
    status === "pending" ? isDark ? "bg-amber-500/10 text-amber-400"     : "bg-amber-50 text-amber-600"     :
                           isDark ? "bg-gray-500/10 text-gray-400"        : "bg-gray-100 text-gray-500";

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

  return (
    <div className={`h-screen w-full overflow-hidden transition-colors duration-500 ${isDark ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" : "bg-gradient-to-br from-gray-50 via-white to-gray-100"}`}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-1/4 -left-1/4 w-96 h-96 ${isDark ? "bg-cyan-500/5" : "bg-cyan-500/3"} rounded-full blur-3xl animate-pulse`} />
        <div className={`absolute bottom-1/4 -right-1/4 w-96 h-96 ${isDark ? "bg-blue-600/5" : "bg-blue-600/3"} rounded-full blur-3xl animate-pulse`} style={{ animationDelay: "1s" }} />
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

            {/* Heading */}
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
              <button
                onClick={() => navigate("/vault/dashboard")}
                className={`flex items-center gap-2 mb-5 px-4 py-2 rounded-xl border text-sm font-medium transition-all duration-200 ${isDark ? "bg-slate-800/50 border-slate-700/50 text-gray-300 hover:text-white hover:border-cyan-500/40" : "bg-white/80 border-gray-200 text-gray-600 hover:border-cyan-400"}`}
              >
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
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

            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
                <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>Loading permissions…</p>
              </div>
            ) : (
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
                        { label: "Vault Name",    value: vaultInfo?.name || activeVault?.name || "My Vault" },
                        { label: "Vault Owner",   value: members.find(m => m.isOwner)?.name || "You" },
                        { label: "Creation Date", value: vaultInfo?.createdAt ? new Date(vaultInfo.createdAt).toLocaleDateString() : "—" },
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
                            {members.length} member{members.length !== 1 ? "s" : ""}
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

                      {vaultInfo?.hasPassword ? (
                        <div className={`flex items-center justify-between gap-3 p-4 rounded-xl border ${isDark ? "bg-slate-900/50 border-slate-700/50" : "bg-gray-50 border-gray-200"}`}>
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${security.isLocked ? (isDark ? "bg-amber-500/10" : "bg-amber-50") : (isDark ? "bg-emerald-500/10" : "bg-emerald-50")}`}>
                              {security.isLocked
                                ? <Lock className={`w-4 h-4 ${isDark ? "text-amber-400" : "text-amber-600"}`} />
                                : <Unlock className={`w-4 h-4 ${isDark ? "text-emerald-400" : "text-emerald-600"}`} />}
                            </div>
                            <div className="min-w-0">
                              <p className={`font-semibold text-sm ${isDark ? "text-white" : "text-gray-900"}`}>Vault Lock Status</p>
                              <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                                {security.isLocked
                                  ? "Locked — all users must re-enter the vault password"
                                  : "Unlocked — members can access with their cached key"}
                              </p>
                            </div>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleSecurityToggle("isLocked")}
                            disabled={saving === "security"}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 border flex-shrink-0 ${
                              security.isLocked
                                ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-transparent shadow-lg shadow-cyan-500/30"
                                : isDark ? "bg-slate-800/60 border-slate-700/50 text-amber-400 hover:border-amber-500/40" : "bg-white border-gray-200 text-amber-600 hover:border-amber-400"
                            }`}
                          >
                            {saving === "security" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : security.isLocked ? "Unlock" : "Lock"}
                          </motion.button>
                        </div>
                      ) : (
                        <div className={`flex items-start gap-3 p-4 rounded-xl border ${isDark ? "bg-slate-800/40 border-slate-700/40" : "bg-gray-50 border-gray-200"}`}>
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${isDark ? "bg-slate-700/60" : "bg-gray-100"}`}>
                            <Unlock className={`w-4 h-4 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-semibold text-sm ${isDark ? "text-white" : "text-gray-900"}`}>Vault Lock Status</p>
                            <p className={`text-xs mt-0.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                              This vault has no password. Locking requires a vault password — without one there's nothing to authenticate against and the device key can't be revoked.
                            </p>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => navigate(`/vault/settings`)}
                              className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all duration-200 ${
                                isDark
                                  ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20"
                                  : "bg-cyan-50 border-cyan-200 text-cyan-700 hover:bg-cyan-100"
                              }`}
                            >
                              <Lock className="w-3 h-3" />
                              Set a vault password to enable locking
                            </motion.button>
                          </div>
                        </div>
                      )}

                      {/* Encryption row */}
                      <div className={`flex items-center justify-between gap-3 p-4 rounded-xl border ${isDark ? "bg-slate-900/50 border-slate-700/50" : "bg-gray-50 border-gray-200"}`}>
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? "bg-emerald-500/10" : "bg-emerald-50"}`}>
                            <Shield className={`w-4 h-4 ${isDark ? "text-emerald-400" : "text-emerald-600"}`} />
                          </div>
                          <div className="min-w-0">
                            <p className={`font-semibold text-sm ${isDark ? "text-white" : "text-gray-900"}`}>Zero-Knowledge Encryption</p>
                            <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                              {vaultInfo?.hasPassword
                                ? "AES-256-GCM · key derived from your vault password · server never sees plaintext"
                                : "AES-256-GCM · random key stored on this device only · server never sees plaintext"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span className={`text-[10px] font-semibold ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>Active</span>
                        </div>
                      </div>

                      {/* Activity Tracking row */}
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
                      <div className="flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={loadData}
                          className={`p-2 rounded-xl border transition-all duration-200 ${isDark ? "bg-slate-800/50 border-slate-700/50 text-gray-400 hover:text-white hover:border-cyan-500/40" : "bg-white border-gray-200 text-gray-500 hover:border-cyan-400"}`}
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setShowAddUserModal(true)}
                          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all duration-300 flex-shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Add User</span>
                          <span className="sm:hidden">Add</span>
                        </motion.button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {members.map((user, idx) => (
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
                              {!user.canDownload && !user.isOwner && (
                                <span className={`hidden sm:inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full font-semibold ${isDark ? "bg-red-500/10 text-red-400" : "bg-red-50 text-red-500"}`}>
                                  <Download className="w-2.5 h-2.5" /> Restricted
                                </span>
                              )}
                              <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold capitalize ${roleBadgeCls(user.role)}`}>{user.role}</span>
                              {user.status && !user.isOwner && (
                                <span className={`hidden md:inline-flex text-[10px] px-2.5 py-1 rounded-full font-semibold ${statusBadge(user.status)}`}>
                                  {user.status === "pending" ? "Pending" : "Active"}
                                </span>
                              )}
                              {!user.isOwner && (
                                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${selectedUser?.id === user.id ? "rotate-180" : ""} ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                              )}
                            </div>
                          </div>

                          {/* Last activity strip */}
                          {selectedUser?.id !== user.id && (
                            <div className="flex items-center gap-2 px-4 pb-3">
                              <div className={`w-1 h-1 rounded-full flex-shrink-0 ${user.status === "active" ? "bg-emerald-400" : isDark ? "bg-gray-600" : "bg-gray-300"}`} />
                              <p className={`text-[10px] truncate ${isDark ? "text-gray-500" : "text-gray-400"}`}>{user.lastActivity || "—"}</p>
                            </div>
                          )}

                          {/* Expanded panel */}
                          <AnimatePresence>
                            {selectedUser?.id === user.id && !user.isOwner && (
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
                                      onChange={(val) => handleRoleChange(user, val)}
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
                                            user.permissions?.[key]
                                              ? isDark ? "bg-cyan-500/10 border-cyan-500/30" : "bg-cyan-50 border-cyan-200"
                                              : isDark ? "bg-slate-800/40 border-slate-700/40 hover:border-slate-600" : "bg-white border-gray-200 hover:border-gray-300"
                                          }`}
                                        >
                                          <input
                                            type="checkbox"
                                            checked={user.permissions?.[key] || false}
                                            onChange={() => handlePermissionToggle(user, key)}
                                            className="w-4 h-4 accent-cyan-500 flex-shrink-0"
                                          />
                                          <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${user.permissions?.[key] ? (isDark ? "text-cyan-400" : "text-cyan-600") : (isDark ? "text-gray-500" : "text-gray-400")}`} />
                                          <span className={`text-xs font-medium ${user.permissions?.[key] ? (isDark ? "text-cyan-300" : "text-cyan-700") : (isDark ? "text-gray-400" : "text-gray-600")}`}>{label}</span>
                                        </label>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Per-user download */}
                                  <div>
                                    <label className={`block text-[10px] font-bold uppercase tracking-widest mb-3 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Download Access</label>
                                    <div className={`flex items-center justify-between gap-4 p-4 rounded-xl border transition-all duration-300 ${
                                      !user.canDownload
                                        ? isDark ? "bg-red-500/10 border-red-500/20" : "bg-red-50 border-red-200"
                                        : isDark ? "bg-emerald-500/10 border-emerald-500/20" : "bg-emerald-50 border-emerald-200"
                                    }`}>
                                      <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${!user.canDownload ? isDark ? "bg-red-500/20" : "bg-red-100" : isDark ? "bg-emerald-500/20" : "bg-emerald-100"}`}>
                                          <Download className={`w-4 h-4 ${!user.canDownload ? (isDark ? "text-red-400" : "text-red-500") : (isDark ? "text-emerald-400" : "text-emerald-600")}`} />
                                        </div>
                                        <div className="min-w-0">
                                          <p className={`font-semibold text-sm ${isDark ? "text-white" : "text-gray-900"}`}>
                                            {user.canDownload ? "Downloads allowed" : "Downloads restricted"}
                                          </p>
                                          <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                                            {user.canDownload ? `${user.name.split(" ")[0]} can download files` : `${user.name.split(" ")[0]} cannot download files`}
                                          </p>
                                        </div>
                                      </div>
                                      <Toggle state={user.canDownload} onToggle={() => handleDownloadToggle(user)} isDark={isDark} />
                                    </div>
                                  </div>

                                  {/* Resend invite if pending */}
                                  {user.status === "pending" && (
                                    <div className={`flex items-center gap-3 p-3 rounded-xl border ${isDark ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-50 border-amber-200"}`}>
                                      <Mail className={`w-4 h-4 flex-shrink-0 ${isDark ? "text-amber-400" : "text-amber-600"}`} />
                                      <p className={`text-xs flex-1 ${isDark ? "text-amber-300" : "text-amber-700"}`}>Invite pending — user hasn't accepted yet.</p>
                                    </div>
                                  )}

                                  {/* Remove */}
                                  <button
                                    onClick={() => handleRemoveUser(user.id, user.email)}
                                    disabled={saving === user.id}
                                    className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all duration-200 disabled:opacity-50 ${isDark ? "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20" : "bg-red-50 border-red-100 text-red-500 hover:bg-red-100"}`}
                                  >
                                    {saving === user.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                    Remove User
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      ))}

                      {members.length === 0 && (
                        <div className={`text-center py-10 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                          <p className="text-sm">No members yet. Invite someone to collaborate.</p>
                        </div>
                      )}
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

                {/* ── 5. Vault-Wide Security ── */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }} className={`${card} overflow-hidden`}>
                  <div className="h-[2px] bg-gradient-to-r from-red-500 via-orange-500 to-amber-500" />
                  <div className="p-5 sm:p-6">
                    <div className="mb-5">
                      <h2 className={`text-sm sm:text-base font-bold flex items-center gap-2.5 ${isDark ? "text-white" : "text-gray-900"}`}>
                        <SectionIcon gradient="from-red-500 to-orange-600" Icon={Globe} />
                        Vault-Wide Security
                      </h2>
                      <p className={`text-xs mt-2 ml-11 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                        These settings apply to <span className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>all users</span> and override individual permissions.
                      </p>
                    </div>
                    <div className="space-y-3">
                      {[
                        { key: "blockAllDownloads", Icon: Download,    gradient: "from-violet-500 to-purple-600", title: "Block All Downloads", desc: "Prevent every user from downloading — overrides per-user settings" },
                        { key: "deviceRestricted",  Icon: Smartphone,  gradient: "from-cyan-500 to-teal-600",     title: "Device Restrictions",  desc: "Limit vault access to registered devices only" },
                      ].map(({ key, Icon, gradient, title, desc }) => (
                        <div
                          key={key}
                          className={`flex items-center justify-between gap-4 p-4 rounded-xl border transition-all duration-300 ${
                            security[key]
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
                                {security[key] && (
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${isDark ? "bg-amber-500/20 text-amber-400" : "bg-amber-100 text-amber-700"}`}>Active</span>
                                )}
                              </div>
                              <p className={`text-xs truncate ${isDark ? "text-gray-400" : "text-gray-500"}`}>{desc}</p>
                            </div>
                          </div>
                          <Toggle state={security[key]} onToggle={() => handleSecurityToggle(key)} isDark={isDark} disabled={saving === "security"} />
                        </div>
                      ))}
                    </div>
                    <AnimatePresence>
                      {security.blockAllDownloads && (
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
            )}
          </div>
        </div>
      </motion.main>

      {/* ── Add User Modal ── */}
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
                  <button onClick={() => setShowAddUserModal(false)} className={`p-2 rounded-xl transition-all duration-200 ${isDark ? "text-gray-400 hover:bg-slate-700 hover:text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"}`}>
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
                    <CustomSelect value={newUserRole} onChange={setNewUserRole} options={ASSIGNABLE_ROLES} labelMap={ROLE_LABELS} isDark={isDark} />
                  </div>
                  <div>
                    <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Personal Message (optional)</label>
                    <textarea
                      placeholder="Add a note to the invite email…"
                      value={inviteMessage}
                      onChange={(e) => setInviteMessage(e.target.value)}
                      rows={2}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all resize-none ${inputCls}`}
                    />
                  </div>
                  {/* ZK notice — only about encryption, not downloads */}
                  <div className={`flex items-start gap-2.5 p-3 rounded-xl border ${isDark ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-50 border-amber-200"}`}>
                    <AlertTriangle className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${isDark ? "text-amber-400" : "text-amber-600"}`} />
                    <p className={`text-xs ${isDark ? "text-amber-300" : "text-amber-700"}`}>
                      <span className="font-semibold">Zero-Knowledge:</span> The invited user must know the vault password to decrypt files. Share it securely outside AirVault.
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
                    disabled={!newUserEmail.trim() || saving === "invite"}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {saving === "invite" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                    {saving === "invite" ? "Sending…" : "Send Invite"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Toast toasts={toasts} />

      <style>{`
        .vault-scrollbar::-webkit-scrollbar { width: 4px; }
        .vault-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .vault-scrollbar::-webkit-scrollbar-thumb { background: rgba(6,182,212,0.4); border-radius: 2px; }
        .vault-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(6,182,212,0.65); }
      `}</style>
    </div>
  );
}