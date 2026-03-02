import { useEffect, useRef, useMemo, useState, useCallback } from "react";
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
  QrCode,
  Clock,
  UserPlus,
  Loader2,
  RefreshCw,
  Key,
  Settings,
  ExternalLink,
  X,
  AlertCircle,
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

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/* ─── CustomSelect ─────────────────────────────────────────────────────────── */
const CustomSelect = ({ value, onChange, options, placeholder = "Select…", isDark, icon: IconLeft }) => {
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({});
  const triggerRef = useRef(null);

  useLayoutEffect(() => {
    if (open && triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      const ITEM_HEIGHT = 42;
      const MAX_VISIBLE = 5;
      const PADDING = 12;
      const LIST_HEADER = 2;
      const spaceBelow = window.innerHeight - r.bottom - PADDING;
      const spaceAbove = r.top - PADDING;
      const naturalHeight = LIST_HEADER + options.length * ITEM_HEIGHT;
      const maxHeight = Math.min(naturalHeight, MAX_VISIBLE * ITEM_HEIGHT + LIST_HEADER);
      const openUpward = spaceBelow < maxHeight && spaceAbove > spaceBelow;
      setDropdownPos({
        position: "fixed", left: r.left, width: r.width, zIndex: 99999,
        maxHeight, overflowY: naturalHeight > maxHeight ? "auto" : "hidden",
        ...(openUpward ? { bottom: window.innerHeight - r.top + 6 } : { top: r.bottom + 6 }),
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
    return () => { window.removeEventListener("scroll", close, true); window.removeEventListener("resize", close); };
  }, [open]);

  const selectedOption = options.find((o) => o.value === value);
  const display = selectedOption ? selectedOption.label : placeholder;
  const hasValue = Boolean(selectedOption);

  return (
    <>
      <button ref={triggerRef} type="button" onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 ${isDark
          ? `bg-slate-800/60 border-slate-700/50 hover:border-cyan-500/40 ${open ? "border-cyan-500/50 ring-2 ring-cyan-500/20" : ""} ${hasValue ? "text-white" : "text-gray-500"}`
          : `bg-gray-50 border-gray-200 hover:border-cyan-400 ${open ? "border-cyan-400 ring-2 ring-cyan-500/20" : ""} ${hasValue ? "text-gray-900" : "text-gray-400"}`}`}>
        {IconLeft && <IconLeft className={`w-4 h-4 flex-shrink-0 ${isDark ? "text-gray-400" : "text-gray-500"}`} />}
        <span className="flex-1 text-left truncate">{display}</span>
        <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${isDark ? "text-gray-400" : "text-gray-500"} ${open ? "rotate-180" : ""}`} />
      </button>
      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div id="__custom-select-portal__" style={dropdownPos}
              initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }} transition={{ duration: 0.15 }}
              className={`rounded-xl border shadow-2xl ${isDark ? "bg-slate-900 border-slate-700/60" : "bg-white border-gray-200"}`}>
              <div className="h-[2px] bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 flex-shrink-0 rounded-t-xl" />
              {options.map(({ value: v, label }) => {
                const isActive = v === value;
                return (
                  <button key={v} type="button" onClick={() => { onChange(v); setOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors duration-150 flex items-center justify-between ${
                      isActive ? isDark ? "bg-cyan-500/15 text-cyan-400 font-semibold" : "bg-cyan-50 text-cyan-600 font-semibold"
                               : isDark ? "text-gray-300 hover:bg-slate-800" : "text-gray-700 hover:bg-gray-50"}`}>
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
  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onToggle}
    className={`relative w-11 h-6 rounded-full transition-all duration-300 flex-shrink-0 ${state ? "bg-gradient-to-r from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30" : isDark ? "bg-slate-700" : "bg-gray-300"}`}>
    <motion.div animate={{ x: state ? 22 : 3 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="absolute top-[3px] bg-white rounded-full shadow-sm" style={{ width: 18, height: 18 }} />
  </motion.button>
);

/* ─── Role badge colours ──────────────────────────────────────────────────── */
const roleBadge = (role, isDark) =>
  role === "editor"  ? isDark ? "bg-cyan-500/10 text-cyan-400"    : "bg-cyan-50 text-cyan-600"    :
  role === "owner"   ? isDark ? "bg-violet-500/10 text-violet-400" : "bg-violet-50 text-violet-600" :
                       isDark ? "bg-amber-500/10 text-amber-400"   : "bg-amber-50 text-amber-600";

const statusBadge = (status, isDark) =>
  status === "active"  ? isDark ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-emerald-50 text-emerald-600 border-emerald-200" :
  status === "pending" ? isDark ? "bg-amber-500/10 text-amber-400 border-amber-500/20"       : "bg-amber-50 text-amberbed-600 border-amber-200"     :
                         isDark ? "bg-red-500/10 text-red-400 border-red-500/20"              : "bg-red-50 text-red-500 border-red-200";

/* ══════════════════════════════════════════════════════════════════════════ */
const VaultSharing = () => {
  const navigate      = useNavigate();
  const { isDark }    = useTheme();
  const { activeVault } = useVault();
  const { toast, showSuccess, showError, hideToast } = useToast();

  const [mousePosition,   setMousePosition]   = useState({ x: 0, y: 0 });
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const SIDEBAR_COLLAPSED = 60;
  const SIDEBAR_EXPANDED  = 220;
  const sidebarW = sidebarExpanded ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED;

  /* ── Data state ── */
  const [members,      setMembers]      = useState([]);
  const [security,     setSecurity]     = useState({ blockAllDownloads: false, deviceRestricted: false, isLocked: false });
  const [inviteLink,   setInviteLink]   = useState("");
  const [loadingMembers,  setLoadingMembers]  = useState(true);
  const [loadingSecurity, setLoadingSecurity] = useState(false);
  const [savingSecurity,  setSavingSecurity]  = useState(false);
  const [sendingInvite,   setSendingInvite]   = useState(false);
  const [copyLinkState,   setCopyLinkState]   = useState(false);

  /* ── Invite form state ── */
  const [inviteEmail,   setInviteEmail]   = useState("");
  const [inviteRole,    setInviteRole]    = useState("viewer");
  const [inviteMessage, setInviteMessage] = useState("");

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

  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  const authHeaders = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  /* ── Fetch members ── */
  const fetchMembers = useCallback(async () => {
    if (!activeVault?.id) return;
    setLoadingMembers(true);
    try {
      const res  = await fetch(`${API_BASE_URL}/vaults/${activeVault.id}/members`, { headers: authHeaders, credentials: "include" });
      const data = await res.json();
      if (res.ok) {
        setMembers(data.members || []);
        if (data.security) setSecurity(data.security);
      }
    } catch (e) { console.error("Fetch members error:", e); }
    finally { setLoadingMembers(false); }
  }, [activeVault?.id]);

  /* ── Fetch invite link ── */
  const fetchInviteLink = useCallback(async () => {
    if (!activeVault?.id) return;
    try {
      const res  = await fetch(`${API_BASE_URL}/vaults/${activeVault.id}/invite-link`, { headers: authHeaders, credentials: "include" });
      const data = await res.json();
      if (res.ok) setInviteLink(data.link || `${window.location.origin}/vault/join/${activeVault.id}`);
    } catch { setInviteLink(`${window.location.origin}/vault/join/${activeVault.id}`); }
  }, [activeVault?.id]);

  useEffect(() => {
    if (activeVault?.id) { fetchMembers(); fetchInviteLink(); }
  }, [activeVault?.id]);

  /* ── Send invite ── */
  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) { showError("Enter a recipient email."); return; }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(inviteEmail)) { showError("Enter a valid email address."); return; }
    setSendingInvite(true);
    try {
      const res  = await fetch(`${API_BASE_URL}/vaults/${activeVault.id}/members`, {
        method: "POST", headers: authHeaders, credentials: "include",
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole, message: inviteMessage || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { showError(data.message || "Failed to send invite."); return; }
      showSuccess(`Invitation sent to ${inviteEmail}.`);
      setInviteEmail(""); setInviteMessage("");
      fetchMembers();
    } catch { showError("Network error. Please try again."); }
    finally { setSendingInvite(false); }
  };

  /* ── Update member role ── */
  const handleUpdateRole = async (memberId, newRole) => {
    try {
      const res  = await fetch(`${API_BASE_URL}/vaults/${activeVault.id}/members/${memberId}`, {
        method: "PATCH", headers: authHeaders, credentials: "include",
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) { showError(data.message || "Failed to update role."); return; }
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m));
      showSuccess("Member role updated.");
    } catch { showError("Network error."); }
  };

  /* ── Revoke member ── */
  const handleRevokeMember = async (memberId, memberEmail) => {
    if (memberEmail === "owner") return;
    try {
      const res  = await fetch(`${API_BASE_URL}/vaults/${activeVault.id}/members/${memberId}`, {
        method: "DELETE", headers: authHeaders, credentials: "include",
      });
      if (!res.ok) { const d = await res.json(); showError(d.message || "Failed to revoke access."); return; }
      setMembers(prev => prev.filter(m => m.id !== memberId));
      showSuccess("Member access revoked.");
    } catch { showError("Network error."); }
  };

  /* ── Save security settings ── */
  const handleSaveSecurity = async (patch) => {
    setSavingSecurity(true);
    const next = { ...security, ...patch };
    try {
      const res  = await fetch(`${API_BASE_URL}/vaults/${activeVault.id}/security`, {
        method: "PATCH", headers: authHeaders, credentials: "include",
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) { showError(data.message || "Failed to update security settings."); return; }
      setSecurity(data.security || next);
      showSuccess("Security settings updated.");
    } catch { showError("Network error."); }
    finally { setSavingSecurity(false); }
  };

  /* ── Copy invite link ── */
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink || `${window.location.origin}/vault/join/${activeVault?.id}`);
      setCopyLinkState(true);
      showSuccess("Invite link copied.");
      setTimeout(() => setCopyLinkState(false), 2000);
    } catch { showError("Unable to copy link."); }
  };

  /* ── Shared style helpers ── */
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

  const nonOwnerMembers = members.filter(m => !m.isOwner);

  /* ════════════════════════════════════════════════════════ RENDER ══ */
  return (
    <div className={`h-screen w-full overflow-hidden transition-colors duration-500 ${isDark ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" : "bg-gradient-to-br from-gray-50 via-white to-gray-100"}`}>

      {/* Ambient blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-1/4 -left-1/4 w-96 h-96 ${isDark ? "bg-cyan-500/5" : "bg-cyan-500/3"} rounded-full blur-3xl animate-pulse`} />
        <div className={`absolute bottom-1/4 -right-1/4 w-96 h-96 ${isDark ? "bg-blue-600/5" : "bg-blue-600/3"} rounded-full blur-3xl animate-pulse`} style={{ animationDelay: "1s" }} />
        <div className={`absolute top-1/2 left-1/2 w-96 h-96 ${isDark ? "bg-indigo-500/3" : "bg-indigo-500/2"} rounded-full blur-3xl animate-pulse`} style={{ animationDelay: "0.5s" }} />
      </div>

      <div className="hidden lg:block fixed w-80 h-80 rounded-full pointer-events-none z-0 mix-blend-screen"
        style={{
          background: isDark ? "radial-gradient(circle, rgba(56,189,248,0.07) 0%, transparent 70%)" : "radial-gradient(circle, rgba(56,189,248,0.05) 0%, transparent 70%)",
          left: mousePosition.x - 160, top: mousePosition.y - 160, transition: "all 0.4s ease-out",
        }} />

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
                <button onClick={() => navigate(`/vault/${activeVault.id}`)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all duration-200 self-start ${isDark ? "bg-slate-800/50 border-slate-700/50 text-gray-300 hover:text-white hover:border-cyan-500/40" : "bg-white/80 border-gray-200 text-gray-600 hover:border-cyan-400"}`}>
                  <ArrowLeft className="w-4 h-4" />
                  Back to Dashboard
                </button>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-semibold self-start sm:self-auto ${isDark ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-600"}`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Access logging enabled
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/30 hover:rotate-6 hover:scale-110 transition-all duration-500 cursor-default flex-shrink-0">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className={`text-3xl lg:text-4xl font-bold tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>Vault Sharing</h1>
                  <p className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                    Manage who can access <span className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>{activeVault.name}</span>
                  </p>
                </div>
              </div>
            </motion.div>

            {/* ══ GRID ══ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">

              {/* ═══ LEFT — main controls ═══ */}
              <div className="lg:col-span-2 space-y-5 sm:space-y-6">

                {/* ── Invite section ── */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className={card}>
                  <div className="h-[2px] bg-gradient-to-r from-violet-500 via-purple-600 to-indigo-600 overflow-hidden rounded-t-2xl" />
                  <div className="p-5 sm:p-6">
                    <h2 className={`text-sm sm:text-base font-bold mb-5 flex items-center gap-2.5 ${isDark ? "text-white" : "text-gray-900"}`}>
                      <SectionIcon gradient="from-violet-500 to-purple-600" Icon={UserPlus} />
                      Invite Someone
                    </h2>

                    <div className="space-y-4">
                      {/* Email */}
                      <div>
                        <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                          Recipient Email
                        </label>
                        <div className="relative">
                          <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                          <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder="colleague@company.com"
                            className={`${inputCls} pl-10`}
                          />
                        </div>
                      </div>

                      {/* Role */}
                      <div>
                        <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                          Role
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { id: "viewer", label: "Viewer", Icon: Eye, desc: "Can view files only" },
                            { id: "editor", label: "Editor", Icon: Edit, desc: "Can upload & edit files" },
                          ].map(({ id, label, Icon, desc }) => (
                            <button key={id} onClick={() => setInviteRole(id)}
                              className={`flex flex-col items-center gap-1.5 px-3 py-3.5 rounded-xl border text-xs font-semibold transition-all duration-200 ${
                                inviteRole === id
                                  ? "bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border-cyan-500/50 text-cyan-400 shadow-lg shadow-cyan-500/10"
                                  : isDark ? "bg-slate-900/50 border-slate-700/50 text-gray-400 hover:border-slate-600" : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300"
                              }`}>
                              <Icon className="w-4 h-4" />
                              <span>{label}</span>
                              <span className={`text-[10px] font-normal ${isDark ? "text-gray-500" : "text-gray-400"}`}>{desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Optional message */}
                      <div>
                        <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                          Personal Message <span className={`normal-case font-normal ${isDark ? "text-gray-600" : "text-gray-400"}`}>(optional)</span>
                        </label>
                        <textarea value={inviteMessage} onChange={(e) => setInviteMessage(e.target.value)}
                          placeholder="Add a note to the invite email…"
                          rows={2}
                          className={`${inputCls} resize-none`}
                        />
                      </div>

                      {/* ZK notice for password vaults */}
                      {activeVault.hasPassword && (
                        <div className={`flex items-start gap-3 p-3.5 rounded-xl border ${isDark ? "bg-amber-500/10 border-amber-500/30" : "bg-amber-50 border-amber-200"}`}>
                          <Key className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isDark ? "text-amber-400" : "text-amber-600"}`} />
                          <div>
                            <p className={`text-xs font-semibold ${isDark ? "text-amber-300" : "text-amber-700"}`}>Zero-Knowledge Vault</p>
                            <p className={`text-xs mt-0.5 ${isDark ? "text-amber-300/80" : "text-amber-600"}`}>
                              This vault is password-protected. The invited user will need the vault password to decrypt files. Share it securely out-of-band.
                            </p>
                          </div>
                        </div>
                      )}

                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={handleSendInvite} disabled={sendingInvite || !inviteEmail.trim()}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                        {sendingInvite ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                        {sendingInvite ? "Sending…" : "Send Invitation"}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>

                {/* ── Share Link ── */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }} className={card}>
                  <div className="h-[2px] bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 overflow-hidden rounded-t-2xl" />
                  <div className="p-5 sm:p-6">
                    <h2 className={`text-sm sm:text-base font-bold mb-5 flex items-center gap-2.5 ${isDark ? "text-white" : "text-gray-900"}`}>
                      <SectionIcon gradient="from-cyan-500 to-blue-600" Icon={Link2} />
                      Share Link
                    </h2>

                    <div className={`${innerRow} mb-4`}>
                      <p className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Join link</p>
                      <p className={`text-xs font-mono break-all mb-3 ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                        {inviteLink || `${window.location.origin}/vault/join/${activeVault.id}`}
                      </p>
                      <p className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                        Anyone with this link can request access. They'll be added as a viewer instantly after signing in.
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        onClick={handleCopyLink}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all duration-300">
                        {copyLinkState ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copyLinkState ? "Copied!" : "Copy Link"}
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        onClick={fetchInviteLink}
                        className={`px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${isDark ? "bg-slate-800 border-slate-700 text-gray-300 hover:border-cyan-500/40" : "bg-gray-100 border-gray-200 text-gray-700 hover:border-cyan-400"}`}>
                        <RefreshCw className="w-4 h-4" />
                        Regenerate
                      </motion.button>
                    </div>
                  </div>
                </motion.div>

                {/* ── Vault Security Settings ── */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className={card}>
                  <div className="h-[2px] bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 overflow-hidden rounded-t-2xl" />
                  <div className="p-5 sm:p-6">
                    <div className="mb-5">
                      <h2 className={`text-sm sm:text-base font-bold flex items-center gap-2.5 ${isDark ? "text-white" : "text-gray-900"}`}>
                        <SectionIcon gradient="from-red-500 to-orange-600" Icon={Shield} />
                        Vault Security
                      </h2>
                      <p className={`text-xs mt-2 ml-11 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                        Vault-wide restrictions applied to all members.
                      </p>
                    </div>
                    <div className="space-y-3">
                      {[
                        {
                          Icon: Download, gradient: "from-violet-500 to-purple-600",
                          title: "Block All Downloads",
                          desc: "Prevent any member from downloading files",
                          key: "blockAllDownloads",
                        },
                        {
                          Icon: Globe, gradient: "from-cyan-500 to-teal-600",
                          title: "Device Restrictions",
                          desc: "Restrict vault access to registered devices only",
                          key: "deviceRestricted",
                        },
                        {
                          Icon: Lock, gradient: "from-red-500 to-rose-600",
                          title: "Lock Vault",
                          desc: activeVault.hasPassword ? "Lock vault — members must re-authenticate" : "Set a vault password to enable locking",
                          key: "isLocked",
                          disabled: !activeVault.hasPassword,
                        },
                      ].map(({ Icon, gradient, title, desc, key, disabled }) => (
                        <div key={key} className={`flex items-center justify-between gap-4 p-4 rounded-xl border transition-all duration-300 ${
                          disabled ? isDark ? "bg-slate-900/30 border-slate-700/30 opacity-50" : "bg-gray-50/50 border-gray-100 opacity-50"
                          : security[key]
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
                                {security[key] && !disabled && (
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${isDark ? "bg-amber-500/20 text-amber-400" : "bg-amber-100 text-amber-700"}`}>Active</span>
                                )}
                              </div>
                              <p className={`text-xs truncate ${isDark ? "text-gray-400" : "text-gray-500"}`}>{desc}</p>
                            </div>
                          </div>
                          <Toggle
                            state={security[key] || false}
                            onToggle={() => !disabled && handleSaveSecurity({ [key]: !security[key] })}
                            isDark={isDark}
                          />
                        </div>
                      ))}
                    </div>
                    {savingSecurity && (
                      <div className="flex items-center gap-2 mt-3 text-xs text-cyan-400">
                        <Loader2 className="w-3 h-3 animate-spin" /> Saving…
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* ── Action: View Access Log ── */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.23 }}>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={() => navigate(`/vault/${activeVault.id}/access-log`)}
                    className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl border font-semibold text-sm transition-all duration-300 ${isDark ? "bg-slate-800/50 border-slate-700/50 text-white hover:border-cyan-500/40 hover:bg-slate-800/70" : "bg-white/80 border-gray-200 text-gray-900 hover:border-cyan-500/40 hover:bg-white"}`}>
                    <div className="flex items-center gap-3">
                      <SectionIcon gradient="from-emerald-500 to-teal-600" Icon={Wifi} />
                      <div className="text-left">
                        <p>View Access Log</p>
                        <p className={`text-xs font-normal ${isDark ? "text-gray-400" : "text-gray-500"}`}>See who accessed this vault and when</p>
                      </div>
                    </div>
                    <ExternalLink className={`w-4 h-4 ${isDark ? "text-gray-400" : "text-gray-500"}`} />
                  </motion.button>
                </motion.div>
              </div>

              {/* ═══ RIGHT sidebar ═══ */}
              <div className="space-y-5 sm:space-y-6">

                {/* ── Members list ── */}
                <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className={card}>
                  <div className="h-[2px] bg-gradient-to-r from-blue-600 to-indigo-600 overflow-hidden rounded-t-2xl" />
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className={`text-sm font-bold flex items-center gap-2.5 ${isDark ? "text-white" : "text-gray-900"}`}>
                        <SectionIcon gradient="from-blue-600 to-indigo-600" Icon={Users} />
                        Members
                      </h3>
                      {loadingMembers && <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />}
                      {!loadingMembers && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${isDark ? "bg-slate-700 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
                          {members.length} total
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 max-h-80 overflow-y-auto vault-scrollbar pr-1">
                      {loadingMembers ? (
                        <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 text-cyan-400 animate-spin" /></div>
                      ) : members.length === 0 ? (
                        <p className={`text-xs text-center py-6 ${isDark ? "text-gray-500" : "text-gray-400"}`}>No members yet</p>
                      ) : members.map((member, idx) => (
                        <motion.div key={member.id || member.email}
                          initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className={`group flex items-center justify-between gap-3 p-3 rounded-xl border transition-all duration-300 ${isDark ? "bg-slate-900/50 border-slate-700/50 hover:border-cyan-500/30" : "bg-gray-50 border-gray-200 hover:border-cyan-300"}`}>
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {(member.name || member.email || "?").substring(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className={`text-xs font-semibold truncate ${isDark ? "text-white" : "text-gray-900"}`}>
                                {member.isOwner ? `${member.name} (You)` : (member.name || member.email.split("@")[0])}
                              </p>
                              <p className={`text-[10px] truncate ${isDark ? "text-gray-400" : "text-gray-500"}`}>{member.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize ${roleBadge(member.role, isDark)}`}>
                              {member.role}
                            </span>
                            <span className={`hidden sm:inline-flex text-[10px] px-1.5 py-0.5 rounded-full font-semibold border capitalize ${statusBadge(member.status || "active", isDark)}`}>
                              {member.status || "active"}
                            </span>
                            {!member.isOwner && (
                              <button onClick={() => handleRevokeMember(member.id, member.email)}
                                className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 ${isDark ? "text-red-400 hover:bg-red-500/20" : "text-red-500 hover:bg-red-50"}`}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {nonOwnerMembers.length > 0 && (
                      <button onClick={() => navigate(`/vault/${activeVault.id}/members`)}
                        className={`mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-xl border text-xs font-semibold transition-all duration-200 ${isDark ? "bg-slate-900/50 border-slate-700/50 text-gray-300 hover:border-cyan-500/30 hover:text-cyan-400" : "bg-gray-50 border-gray-200 text-gray-600 hover:border-cyan-400 hover:text-cyan-600"}`}>
                        <Settings className="w-3.5 h-3.5" />
                        Manage Permissions
                      </button>
                    )}
                  </div>
                </motion.div>

                {/* ── Vault info card ── */}
                <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className={card}>
                  <div className="h-[2px] bg-gradient-to-r from-emerald-500 to-teal-600 overflow-hidden rounded-t-2xl" />
                  <div className="p-5">
                    <div className="flex items-center gap-2.5 mb-4">
                      <SectionIcon gradient="from-emerald-500 to-teal-600" Icon={Shield} />
                      <p className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Vault Info</p>
                    </div>
                    <div className="space-y-2.5">
                      {[
                        { label: "Vault Name", value: activeVault.name },
                        { label: "Protection", value: activeVault.hasPassword ? "Password Protected" : "No Password" },
                        { label: "Encryption", value: "AES-256-GCM" },
                        { label: "Members", value: `${members.length} user${members.length !== 1 ? "s" : ""}` },
                      ].map(({ label, value }) => (
                        <div key={label} className={`flex items-center justify-between text-xs py-2 border-b ${isDark ? "border-slate-700/40" : "border-gray-100"}`}>
                          <span className={isDark ? "text-gray-400" : "text-gray-500"}>{label}</span>
                          <span className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* ── ZK notice ── */}
                <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}
                  className={`rounded-2xl border backdrop-blur-xl shadow-xl ${isDark ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-50 border-amber-200"}`}>
                  <div className="h-[2px] bg-gradient-to-r from-amber-500 to-orange-500 overflow-hidden rounded-t-2xl" />
                  <div className="p-5">
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                        <Key className="w-4 h-4 text-white" />
                      </div>
                      <p className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Zero-Knowledge Notice</p>
                    </div>
                    <p className={`text-xs leading-relaxed ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      {activeVault.hasPassword
                        ? "Invited users must know the vault password to decrypt files. The server never stores encryption keys — share the password securely."
                        : "This vault uses a device-stored key. Invited viewers can see file names and metadata but cannot decrypt file contents without the encryption key."
                      }
                    </p>
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

export default VaultSharing;