import { useState, useEffect } from "react";
import { useVault } from "../context/VaultContext";
import { useNavigate } from "react-router-dom";
import {
  Shield, Lock, LockOpen, Plus, ArrowLeft, Trash2, X, AlertTriangle,
  Eye, EyeOff, Moon, Sun, Users, Hash, CheckCircle, Loader2, AlertCircle, LogIn,
} from "lucide-react";
import Toast from "../components/layout/Toast";
import { useTheme } from "../context/ThemeContext";

const API_URL = import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:5000/api" : "/api");

// ─── Join Vault Modal ────────────────────────────────────────────────────────
const JoinVaultModal = ({ isDark, onClose, onJoined }) => {
  const [step, setStep] = useState("input");
  const [vaultId, setVaultId] = useState("");
  const [vaultInfo, setVaultInfo] = useState(null);
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token") || sessionStorage.getItem("token");

  const handleLookup = async () => {
    const id = vaultId.trim();
    if (!id) { setError("Please enter a Vault ID"); return; }
    setLoading(true); setError("");
    try {
      const res  = await fetch(`${API_URL}/vaults/join/${id}`);
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Vault not found"); setLoading(false); return; }
      setVaultInfo(data.vault);
      setStep("preview");
    } catch { setError("Could not reach server. Please try again."); }
    finally { setLoading(false); }
  };

  const handleJoin = async () => {
    setLoading(true); setError("");

    if (vaultInfo.hasPassword && step === "preview") {
      setStep("password"); setLoading(false); return;
    }

    if (step === "password") {
      if (!password) { setError("Please enter the vault password"); setLoading(false); return; }
      try {
        const res  = await fetch(`${API_URL}/vaults/${vaultInfo.id}/verify-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          credentials: "include",
          body: JSON.stringify({ password }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.message || "Incorrect vault password"); setLoading(false); return; }
      } catch { setError("Could not reach server. Please try again."); setLoading(false); return; }
    }

    try {
      const res  = await fetch(`${API_URL}/vaults/join/${vaultInfo.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok && !data.alreadyOwner && !data.alreadyMember) {
        setError(data.message || "Failed to join vault"); setLoading(false); return;
      }
      setStep("success");
      setTimeout(() => { onJoined(); onClose(); }, 1800);
    } catch { setError("Could not reach server. Please try again."); }
    finally { setLoading(false); }
  };

  const inputClass = `w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all ${
    isDark ? "bg-slate-700/50 border-slate-600/50 text-white placeholder-slate-400"
           : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400"
  }`;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"} rounded-2xl w-full max-w-md border shadow-2xl relative overflow-hidden`}
        onClick={e => e.stopPropagation()}>
        <div className="h-[3px] bg-gradient-to-r from-indigo-500 via-cyan-500 to-blue-500" />
        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className={`text-base font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
                  {step === "success" ? "Joined!" : "Join Shared Vault"}
                </h2>
                <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  {step === "input"    && "Enter a Vault ID to get access"}
                  {step === "preview"  && "Review vault before joining"}
                  {step === "password" && "Enter vault password"}
                  {step === "success"  && "You now have access"}
                </p>
              </div>
            </div>
            <button onClick={onClose} className={`p-2 rounded-xl transition-colors ${isDark ? "text-slate-400 hover:text-white hover:bg-slate-700" : "text-gray-400 hover:text-gray-900 hover:bg-gray-100"}`}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {step === "input" && (
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-gray-700"}`}>Vault ID</label>
                <div className="relative">
                  <Hash className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-slate-400" : "text-gray-400"}`} />
                  <input type="text" value={vaultId} onChange={e => { setVaultId(e.target.value); setError(""); }}
                    onKeyDown={e => e.key === "Enter" && handleLookup()} placeholder="Paste Vault ID here…" autoFocus className={`${inputClass} pl-11 font-mono`} />
                </div>
                <p className={`text-xs mt-1.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}>Ask the vault owner to share their Vault ID with you.</p>
              </div>
              {error && <div className={`flex items-center gap-2 p-3 rounded-xl border text-xs ${isDark ? "bg-red-500/10 border-red-500/20 text-red-300" : "bg-red-50 border-red-200 text-red-600"}`}><AlertCircle className="w-4 h-4 flex-shrink-0" />{error}</div>}
              <div className="flex gap-3 pt-1">
                <button onClick={onClose} className={`flex-1 py-3 rounded-xl border font-semibold text-sm transition-all ${isDark ? "bg-slate-700 border-slate-600 text-white hover:bg-slate-600" : "bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200"}`}>Cancel</button>
                <button onClick={handleLookup} disabled={loading || !vaultId.trim()}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-500 via-cyan-500 to-blue-500 text-white font-semibold text-sm hover:opacity-90 transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                  {loading ? "Looking up…" : "Look Up"}
                </button>
              </div>
            </div>
          )}

          {step === "preview" && vaultInfo && (
            <div className="space-y-4">
              <div className={`rounded-2xl border p-4 ${isDark ? "bg-slate-900/60 border-slate-700/60" : "bg-gray-50 border-gray-200"}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className={`font-bold text-base truncate ${isDark ? "text-white" : "text-gray-900"}`}>{vaultInfo.name}</p>
                    {vaultInfo.description && <p className={`text-xs truncate ${isDark ? "text-gray-400" : "text-gray-500"}`}>{vaultInfo.description}</p>}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${isDark ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-300" : "bg-indigo-50 border-indigo-200 text-indigo-700"}`}>
                    <Eye className="w-3 h-3" /> Viewer Access
                  </span>
                  {vaultInfo.hasPassword && (
                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${isDark ? "bg-amber-500/10 border-amber-500/20 text-amber-300" : "bg-amber-50 border-amber-200 text-amber-700"}`}>
                      <Lock className="w-3 h-3" /> Password Protected
                    </span>
                  )}
                </div>
                {vaultInfo.passwordHint && <p className={`text-xs mt-2 ${isDark ? "text-gray-500" : "text-gray-400"}`}>Hint: <span className="italic">{vaultInfo.passwordHint}</span></p>}
              </div>
              <div className={`text-xs p-3 rounded-xl border ${isDark ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-300" : "bg-cyan-50 border-cyan-200 text-cyan-700"}`}>
                You'll join as a <strong>viewer</strong>. The vault owner can adjust your permissions later.
              </div>
              {error && <div className={`flex items-center gap-2 p-3 rounded-xl border text-xs ${isDark ? "bg-red-500/10 border-red-500/20 text-red-300" : "bg-red-50 border-red-200 text-red-600"}`}><AlertCircle className="w-4 h-4 flex-shrink-0" />{error}</div>}
              <div className="flex gap-3 pt-1">
                <button onClick={() => { setStep("input"); setError(""); }} className={`flex-1 py-3 rounded-xl border font-semibold text-sm transition-all ${isDark ? "bg-slate-700 border-slate-600 text-white hover:bg-slate-600" : "bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200"}`}>Back</button>
                <button onClick={handleJoin} disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-500 via-cyan-500 to-blue-500 text-white font-semibold text-sm hover:opacity-90 transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                  {loading ? "Joining…" : (vaultInfo.hasPassword ? "Continue" : "Join Vault")}
                </button>
              </div>
            </div>
          )}

          {step === "password" && (
            <div className="space-y-4">
              <div className={`rounded-xl border p-3 flex items-center gap-3 ${isDark ? "bg-slate-700/40 border-slate-600/40" : "bg-gray-50 border-gray-200"}`}>
                <Shield className={`w-4 h-4 flex-shrink-0 ${isDark ? "text-indigo-400" : "text-indigo-600"}`} />
                <p className={`text-sm font-semibold truncate ${isDark ? "text-white" : "text-gray-900"}`}>{vaultInfo?.name}</p>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? "text-slate-300" : "text-gray-700"}`}>Vault Password</label>
                <div className="relative">
                  <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-slate-400" : "text-gray-400"}`} />
                  <input type={showPw ? "text" : "password"} value={password} onChange={e => { setPassword(e.target.value); setError(""); }}
                    onKeyDown={e => e.key === "Enter" && handleJoin()} placeholder="Enter vault password" autoFocus className={`${inputClass} pl-11 pr-11`} />
                  <button type="button" onClick={() => setShowPw(v => !v)} className={`absolute right-4 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-400 hover:text-white" : "text-gray-400 hover:text-gray-700"} transition-colors`}>
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {vaultInfo?.passwordHint && <p className={`text-xs mt-1.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}>Hint: <span className="italic">{vaultInfo.passwordHint}</span></p>}
              </div>
              {error && <div className={`flex items-center gap-2 p-3 rounded-xl border text-xs ${isDark ? "bg-red-500/10 border-red-500/20 text-red-300" : "bg-red-50 border-red-200 text-red-600"}`}><AlertCircle className="w-4 h-4 flex-shrink-0" />{error}</div>}
              <div className="flex gap-3 pt-1">
                <button onClick={() => { setStep("preview"); setError(""); setPassword(""); }} className={`flex-1 py-3 rounded-xl border font-semibold text-sm transition-all ${isDark ? "bg-slate-700 border-slate-600 text-white hover:bg-slate-600" : "bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200"}`}>Back</button>
                <button onClick={handleJoin} disabled={loading || !password}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-500 via-cyan-500 to-blue-500 text-white font-semibold text-sm hover:opacity-90 transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LockOpen className="w-4 h-4" />}
                  {loading ? "Verifying…" : "Join Vault"}
                </button>
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className={`text-lg font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>You've joined!</h3>
              <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}><strong>{vaultInfo?.name}</strong> now appears in your vault list.</p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <Loader2 className={`w-4 h-4 animate-spin ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                <span className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>Refreshing vaults…</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main VaultSelector ──────────────────────────────────────────────────────
const VaultSelector = () => {
  const { setActiveVault, vaults, sharedVaults, fetchVaults } = useVault();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState(null);
  const [unlockModal, setUnlockModal] = useState(null);
  const [deleteInput, setDeleteInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [unlockPassword, setUnlockPassword] = useState("");
  const [showUnlockPassword, setShowUnlockPassword] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => setToast({ message, type });

  // Use the context's vaults — just track loading separately
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchVaults();
      setLoading(false);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openVault = async (vault) => {
    if (vault.hasPassword) {
      setUnlockModal({ vault }); setUnlockPassword(""); setShowUnlockPassword(false); return;
    }
    setActiveVault(vault);
    navigate("/vault/dashboard");
  };

  const handleUnlockSubmit = async () => {
    if (!unlockPassword) { showToast("Please enter your vault password", "error"); return; }
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const response = await fetch(`${API_URL}/vaults/${unlockModal.vault.id}/verify-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        credentials: "include",
        body: JSON.stringify({ password: unlockPassword }),
      });
      const data = await response.json();
      if (!response.ok) { showToast(data.message || "Incorrect password", "error"); setUnlockPassword(""); return; }
      setActiveVault(unlockModal.vault);
      setUnlockModal(null); setUnlockPassword(""); setShowUnlockPassword(false);
      navigate("/vault/dashboard");
    } catch { showToast("Error verifying password", "error"); }
  };

  const handleDeleteClick = (e, vault) => {
    e.stopPropagation();
    setDeleteModal({ vault, step: "confirm" });
    setDeleteInput(""); setPasswordInput("");
  };

  const handleDeleteConfirm = () => {
    if (deleteInput.toLowerCase() !== "delete") { showToast('Please type "delete" to confirm', "error"); return; }
    if (deleteModal.vault.hasPassword) setDeleteModal({ ...deleteModal, step: "password" });
    else executeDelete();
  };

  const handlePasswordConfirm = async () => {
    if (!passwordInput) { showToast("Please enter your vault password", "error"); return; }
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const response = await fetch(`${API_URL}/vaults/${deleteModal.vault.id}/verify-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        credentials: "include",
        body: JSON.stringify({ password: passwordInput }),
      });
      const data = await response.json();
      if (!response.ok) { showToast(data.message || "Incorrect password", "error"); return; }
      executeDelete();
    } catch { showToast("Error verifying password", "error"); }
  };

  const executeDelete = async () => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const response = await fetch(`${API_URL}/vaults/${deleteModal.vault.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      const data = await response.json();
      if (response.ok) {
        showToast(`Vault "${deleteModal.vault.name}" deleted successfully`, "success");
        setDeleteModal(null);
        fetchVaults();
      } else showToast(data.message || "Failed to delete vault", "error");
    } catch { showToast("Error deleting vault", "error"); }
  };

  const closeDeleteModal = () => { setDeleteModal(null); setDeleteInput(""); setPasswordInput(""); };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" : "bg-gradient-to-br from-gray-50 via-white to-gray-100"} flex items-center justify-center`}>
        <div className={isDark ? "text-white text-xl" : "text-gray-900 text-xl"}>Loading vaults…</div>
      </div>
    );
  }

  const hasOwned  = vaults.length > 0;
  const hasShared = sharedVaults.length > 0;

  return (
    <div className={`h-screen overflow-hidden ${isDark ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" : "bg-gradient-to-br from-gray-50 via-white to-gray-100"} relative transition-colors duration-500`}>

      <style>{`
        .vs-scroll::-webkit-scrollbar        { width: 4px; }
        .vs-scroll::-webkit-scrollbar-track  { background: transparent; }
        .vs-scroll::-webkit-scrollbar-thumb  { background: rgba(6,182,212,0.4); border-radius: 2px; }
        .vs-scroll::-webkit-scrollbar-thumb:hover { background: rgba(6,182,212,0.65); }
      `}</style>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <button onClick={toggleTheme}
        className={`fixed top-6 right-6 p-3 rounded-xl ${isDark ? "bg-slate-800 hover:bg-slate-700 border-slate-700" : "bg-white hover:bg-gray-100 border-gray-200"} border transition-all duration-300 shadow-lg z-50 group`}>
        {isDark
          ? <Sun  className="w-5 h-5 text-yellow-400 group-hover:rotate-90 transition-transform duration-500" />
          : <Moon className="w-5 h-5 text-indigo-600 group-hover:-rotate-12 transition-transform duration-500" />}
      </button>

      {/* Ambient blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className={`absolute top-1/4 -left-1/4 w-96 h-96 ${isDark ? "bg-cyan-500/10" : "bg-cyan-500/5"} rounded-full blur-3xl animate-pulse`} />
        <div className={`absolute bottom-1/4 -right-1/4 w-96 h-96 ${isDark ? "bg-blue-600/10" : "bg-blue-600/5"} rounded-full blur-3xl animate-pulse`} style={{ animationDelay: "1s" }} />
        <div className={`absolute top-1/2 left-1/2 w-96 h-96 ${isDark ? "bg-indigo-500/5" : "bg-indigo-500/3"} rounded-full blur-3xl animate-pulse`} style={{ animationDelay: "0.5s" }} />
      </div>

      <div className="vs-scroll relative z-10 h-full overflow-y-auto overflow-x-hidden">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

          {/* Header */}
          <div className="mb-8 sm:mb-10">
            <button onClick={() => navigate("/createvaults")}
              className={`inline-flex items-center gap-2 ${isDark ? "text-slate-400 hover:text-white" : "text-gray-600 hover:text-gray-900"} transition-colors duration-200 mb-6 group`}>
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
              <span className="text-sm">Back</span>
            </button>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className={`text-3xl sm:text-4xl font-bold ${isDark ? "text-white" : "text-gray-900"} mb-2 flex items-center gap-3`}>
                  <div className={`p-2 sm:p-3 rounded-xl ${isDark ? "bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border-cyan-500/30" : "bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border-cyan-500/40"} border`}>
                    <Shield className={`w-6 h-6 sm:w-8 sm:h-8 ${isDark ? "text-cyan-400" : "text-cyan-600"}`} />
                  </div>
                  Your Vaults
                </h1>
                <p className={`${isDark ? "text-slate-400" : "text-gray-600"} text-sm sm:text-base`}>Select a vault to access your encrypted files</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <button onClick={() => navigate("/maindashboard")}
                  className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl ${isDark ? "bg-slate-700 hover:bg-slate-600 border-slate-600" : "bg-white hover:bg-gray-50 border-gray-200"} border font-semibold ${isDark ? "text-white" : "text-gray-900"} shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-sm`}>
                  <Shield className="w-4 h-4" /><span>Dashboard</span>
                </button>
                <button onClick={() => setShowJoinModal(true)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-cyan-500 to-blue-500 hover:opacity-90 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:shadow-xl transition-all duration-300 hover:scale-105 text-sm">
                  <Users className="w-4 h-4" /><span>Join Vault</span>
                </button>
                <button onClick={() => navigate("/createvaults")}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-cyan-500/25 hover:shadow-xl transition-all duration-300 hover:scale-105 text-sm">
                  <Plus className="w-4 h-4" /><span>New Vault</span>
                </button>
              </div>
            </div>
          </div>

          {/* Empty state */}
          {!hasOwned && !hasShared ? (
            <div className="text-center py-16 sm:py-20">
              <div className={`inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full ${isDark ? "bg-slate-800/50 border-slate-700/50" : "bg-gray-100 border-gray-200"} border mb-6`}>
                <Shield className={`w-8 h-8 sm:w-10 sm:h-10 ${isDark ? "text-slate-400" : "text-gray-400"}`} />
              </div>
              <h3 className={`text-xl sm:text-2xl font-semibold ${isDark ? "text-white" : "text-gray-900"} mb-2`}>No vaults yet</h3>
              <p className={`${isDark ? "text-slate-400" : "text-gray-600"} mb-8 text-sm sm:text-base`}>Create your first vault or join a shared one</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button onClick={() => navigate("/createvaults")}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:scale-105">
                  <Plus className="w-5 h-5" />Create Vault
                </button>
                <button onClick={() => setShowJoinModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 via-cyan-500 to-blue-500 hover:opacity-90 text-white font-semibold shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:scale-105">
                  <Users className="w-5 h-5" />Join Shared Vault
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-10">

              {/* ── My Vaults ── */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className={`text-base font-bold ${isDark ? "text-white" : "text-gray-900"}`}>My Vaults</h2>
                  {hasOwned && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${isDark ? "bg-slate-700 text-gray-300" : "bg-gray-100 text-gray-600"}`}>{vaults.length}</span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {/* Join card */}
                  <div onClick={() => setShowJoinModal(true)}
                    className={`group relative ${isDark ? "bg-slate-800/30 border-slate-700/40 hover:border-indigo-500/50" : "bg-white/60 border-gray-200 hover:border-indigo-400/50"} backdrop-blur-xl border-2 border-dashed rounded-2xl p-5 sm:p-6 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-indigo-500/20 flex flex-col items-center justify-center min-h-[168px] gap-3`}>
                    <div className={`p-3 rounded-xl ${isDark ? "bg-indigo-500/10 border-indigo-500/20" : "bg-indigo-50 border-indigo-200"} border group-hover:scale-110 transition-transform duration-300`}>
                      <Users className={`w-6 h-6 ${isDark ? "text-indigo-400" : "text-indigo-600"}`} />
                    </div>
                    <div className="text-center">
                      <p className={`font-semibold text-sm ${isDark ? "text-indigo-300" : "text-indigo-700"}`}>Join Shared Vault</p>
                      <p className={`text-xs mt-0.5 ${isDark ? "text-slate-500" : "text-gray-400"}`}>Paste a Vault ID</p>
                    </div>
                  </div>

                  {/* New vault card */}
                  <div onClick={() => navigate("/createvaults")}
                    className={`group relative ${isDark ? "bg-slate-800/30 border-slate-700/40 hover:border-cyan-500/50" : "bg-white/60 border-gray-200 hover:border-cyan-400/50"} backdrop-blur-xl border-2 border-dashed rounded-2xl p-5 sm:p-6 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/20 flex flex-col items-center justify-center min-h-[168px] gap-3`}>
                    <div className={`p-3 rounded-xl ${isDark ? "bg-cyan-500/10 border-cyan-500/20" : "bg-cyan-50 border-cyan-200"} border group-hover:scale-110 transition-transform duration-300`}>
                      <Plus className={`w-6 h-6 ${isDark ? "text-cyan-400" : "text-cyan-600"}`} />
                    </div>
                    <div className="text-center">
                      <p className={`font-semibold text-sm ${isDark ? "text-cyan-300" : "text-cyan-700"}`}>New Vault</p>
                      <p className={`text-xs mt-0.5 ${isDark ? "text-slate-500" : "text-gray-400"}`}>Create encrypted vault</p>
                    </div>
                  </div>

                  {vaults.map((vault) => (
                    <OwnedVaultCard
                      key={vault.id}
                      vault={vault}
                      isDark={isDark}
                      onOpen={() => openVault(vault)}
                      onDelete={(e) => handleDeleteClick(e, vault)}
                    />
                  ))}
                </div>
              </div>

              {/* ── Shared With Me ── */}
              {hasShared && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className={`text-base font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Shared With Me</h2>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${isDark ? "bg-indigo-500/20 text-indigo-300" : "bg-indigo-50 text-indigo-600"}`}>{sharedVaults.length}</span>
                    <span className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>— vaults others have given you access to</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    {sharedVaults.map((vault) => (
                      <SharedVaultCard
                        key={vault.id}
                        vault={vault}
                        isDark={isDark}
                        onOpen={() => openVault(vault)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showJoinModal && (
        <JoinVaultModal isDark={isDark} onClose={() => setShowJoinModal(false)}
          onJoined={() => { fetchVaults(); showToast("Vault joined successfully!", "success"); }} />
      )}

      {unlockModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6">
          <div className={`${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"} rounded-2xl p-6 sm:p-8 max-w-md w-full border shadow-2xl relative`}>
            <button onClick={() => { setUnlockModal(null); setUnlockPassword(""); setShowUnlockPassword(false); }}
              className={`absolute top-4 right-4 ${isDark ? "text-slate-400 hover:text-white" : "text-gray-400 hover:text-gray-900"}`}>
              <X className="w-5 h-5" />
            </button>
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full mb-4">
                <Lock className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>
              <h2 className={`text-xl sm:text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"} mb-2`}>Unlock Vault</h2>
              <p className={`${isDark ? "text-slate-400" : "text-gray-600"} text-sm`}>
                Enter password for <span className={`${isDark ? "text-white" : "text-gray-900"} font-semibold`}>{unlockModal.vault.name}</span>
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${isDark ? "text-slate-300" : "text-gray-700"} mb-2`}>Vault Password</label>
                <div className="relative">
                  <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? "text-slate-400" : "text-gray-400"}`} />
                  <input type={showUnlockPassword ? "text" : "password"} value={unlockPassword}
                    onChange={(e) => setUnlockPassword(e.target.value)} placeholder="Enter vault password"
                    className={`w-full pl-12 pr-12 py-3 ${isDark ? "bg-slate-700/50 border-slate-600/50 text-white placeholder-slate-400" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400"} border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                    autoFocus onKeyDown={(e) => e.key === "Enter" && handleUnlockSubmit()} />
                  <button type="button" onClick={() => setShowUnlockPassword(!showUnlockPassword)}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-400 hover:text-white" : "text-gray-400 hover:text-gray-900"}`}>
                    {showUnlockPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setUnlockModal(null); setUnlockPassword(""); setShowUnlockPassword(false); }}
                  className={`flex-1 px-4 py-3 rounded-xl ${isDark ? "bg-slate-700 text-white hover:bg-slate-600" : "bg-gray-100 text-gray-900 hover:bg-gray-200"} font-semibold transition-all`}>Cancel</button>
                <button onClick={handleUnlockSubmit}
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white font-semibold hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 transition-all flex items-center justify-center gap-2">
                  <LockOpen className="w-5 h-5" /> Unlock
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6">
          <div className={`${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"} rounded-2xl p-6 sm:p-8 max-w-md w-full border shadow-2xl relative`}>
            <button onClick={closeDeleteModal} className={`absolute top-4 right-4 ${isDark ? "text-slate-400 hover:text-white" : "text-gray-400 hover:text-gray-900"}`}>
              <X className="w-5 h-5" />
            </button>
            <div className="text-center mb-6">
              <div className={`inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 ${isDark ? "bg-red-500/10 border-red-500/20" : "bg-red-50 border-red-200"} border rounded-full mb-4`}>
                <AlertTriangle className="w-7 h-7 sm:w-8 sm:h-8 text-red-400" />
              </div>
              <h2 className={`text-xl sm:text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"} mb-2`}>
                {deleteModal.step === "confirm" ? "Delete Vault?" : "Verify Password"}
              </h2>
              <p className={`${isDark ? "text-slate-400" : "text-gray-600"} text-sm`}>
                {deleteModal.step === "confirm"
                  ? `Are you sure you want to delete "${deleteModal.vault.name}"? This action cannot be undone.`
                  : "Enter your vault password to confirm deletion"}
              </p>
            </div>
            <div className="space-y-4">
              {deleteModal.step === "confirm" ? (
                <>
                  <div>
                    <label className={`block text-sm font-medium ${isDark ? "text-slate-300" : "text-gray-700"} mb-2`}>Type "delete" to confirm</label>
                    <input type="text" value={deleteInput} onChange={(e) => setDeleteInput(e.target.value)} placeholder="delete"
                      className={`w-full px-4 py-3 ${isDark ? "bg-slate-700/50 border-slate-600/50 text-white placeholder-slate-400" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400"} border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500`}
                      autoFocus />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={closeDeleteModal} className={`flex-1 px-4 py-3 rounded-xl ${isDark ? "bg-slate-700 text-white hover:bg-slate-600" : "bg-gray-100 text-gray-900 hover:bg-gray-200"} font-semibold`}>Cancel</button>
                    <button onClick={handleDeleteConfirm} disabled={deleteInput.toLowerCase() !== "delete"}
                      className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed">Delete</button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className={`block text-sm font-medium ${isDark ? "text-slate-300" : "text-gray-700"} mb-2`}>Vault Password</label>
                    <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} placeholder="Enter vault password"
                      className={`w-full px-4 py-3 ${isDark ? "bg-slate-700/50 border-slate-600/50 text-white placeholder-slate-400" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400"} border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500`}
                      autoFocus onKeyDown={(e) => e.key === "Enter" && handlePasswordConfirm()} />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setDeleteModal({ ...deleteModal, step: "confirm" })} className={`flex-1 px-4 py-3 rounded-xl ${isDark ? "bg-slate-700 text-white hover:bg-slate-600" : "bg-gray-100 text-gray-900 hover:bg-gray-200"} font-semibold`}>Back</button>
                    <button onClick={handlePasswordConfirm}
                      className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold hover:from-red-600 hover:to-red-700 transition-all">Confirm Delete</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Owned vault card ────────────────────────────────────────────────────────
const OwnedVaultCard = ({ vault, isDark, onOpen, onDelete }) => (
  <div
    className={`group relative ${isDark ? "bg-slate-800/50 border-slate-700/50 hover:border-cyan-500/50" : "bg-white/80 border-gray-200 hover:border-cyan-500/50"} backdrop-blur-xl border rounded-2xl p-5 sm:p-6 cursor-pointer transition-all duration-300 hover:scale-105 ${isDark ? "hover:shadow-2xl hover:shadow-cyan-500/20" : "hover:shadow-2xl hover:shadow-cyan-500/30"} overflow-hidden`}
    onClick={onOpen}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 via-transparent to-blue-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="relative">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${isDark ? "bg-slate-700/50 border-slate-600/50" : "bg-gray-100 border-gray-200"} border group-hover:scale-110 transition-transform duration-300`}>
          {vault.hasPassword
            ? <Lock     className={`w-5 h-5 sm:w-6 sm:h-6 ${isDark ? "text-cyan-400" : "text-cyan-600"}`} />
            : <LockOpen className={`w-5 h-5 sm:w-6 sm:h-6 ${isDark ? "text-slate-400" : "text-gray-400"}`} />}
        </div>
        <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ${vault.hasPassword ? isDark ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "bg-cyan-50 text-cyan-700 border border-cyan-200" : isDark ? "bg-slate-500/10 text-slate-400 border border-slate-500/20" : "bg-gray-100 text-gray-600 border border-gray-200"}`}>
          {vault.hasPassword ? "Protected" : "No Password"}
        </div>
      </div>
      <h3 className={`text-lg sm:text-xl font-semibold ${isDark ? "text-white" : "text-gray-900"} mb-2 truncate pr-8`}>{vault.name}</h3>
      <div className={`flex items-center justify-between text-xs sm:text-sm ${isDark ? "text-slate-400" : "text-gray-600"}`}>
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          {vault.fileCount || 0} files
        </span>
        <span className={`text-xs ${isDark ? "text-slate-500" : "text-gray-400"}`}>{new Date(vault.createdAt).toLocaleDateString()}</span>
      </div>
    </div>
    <button
      onClick={onDelete}
      className={`absolute top-4 right-4 p-2 rounded-lg ${isDark ? "bg-red-500/10 border-red-500/20 hover:bg-red-500/20" : "bg-red-50 border-red-200 hover:bg-red-100"} border text-red-400 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10`}>
      <Trash2 className="w-4 h-4" />
    </button>
  </div>
);

// ─── Shared vault card ───────────────────────────────────────────────────────
const SharedVaultCard = ({ vault, isDark, onOpen }) => (
  <div
    onClick={onOpen}
    className={`group relative ${isDark ? "bg-slate-800/50 border-indigo-500/20 hover:border-indigo-400/50" : "bg-white/80 border-indigo-200 hover:border-indigo-400/50"} backdrop-blur-xl border rounded-2xl p-5 sm:p-6 cursor-pointer transition-all duration-300 hover:scale-105 ${isDark ? "hover:shadow-2xl hover:shadow-indigo-500/20" : "hover:shadow-2xl hover:shadow-indigo-500/20"} overflow-hidden`}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-transparent to-purple-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    <div className="relative">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${isDark ? "bg-indigo-500/10 border-indigo-500/20" : "bg-indigo-50 border-indigo-200"} border group-hover:scale-110 transition-transform duration-300`}>
          {vault.hasPassword
            ? <Lock  className={`w-5 h-5 sm:w-6 sm:h-6 ${isDark ? "text-indigo-400" : "text-indigo-600"}`} />
            : <Users className={`w-5 h-5 sm:w-6 sm:h-6 ${isDark ? "text-indigo-400" : "text-indigo-600"}`} />}
        </div>
        {/* Role badge */}
        <div className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
          vault.role === "editor"
            ? isDark ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" : "bg-cyan-50 text-cyan-700 border border-cyan-200"
            : isDark ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20" : "bg-indigo-50 text-indigo-700 border border-indigo-200"
        }`}>
          {vault.role || "viewer"}
        </div>
      </div>

      <h3 className={`text-lg sm:text-xl font-semibold ${isDark ? "text-white" : "text-gray-900"} mb-1 truncate`}>{vault.name}</h3>

      {vault.description && (
        <p className={`text-xs truncate mb-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}>{vault.description}</p>
      )}

      <div className={`flex items-center justify-between text-xs ${isDark ? "text-slate-400" : "text-gray-500"}`}>
        <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${isDark ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-300" : "bg-indigo-50 border-indigo-200 text-indigo-600"}`}>
          <Users className="w-3 h-3" /> Shared
        </span>
        {vault.joinedAt && (
          <span className={`text-[10px] ${isDark ? "text-slate-500" : "text-gray-400"}`}>
            Joined {new Date(vault.joinedAt).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  </div>
);

export default VaultSelector;