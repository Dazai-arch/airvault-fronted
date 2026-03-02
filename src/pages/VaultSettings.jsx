import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Shield, Lock, Unlock, Eye, EyeOff,
  Check, X, AlertCircle, Loader2, KeyRound, Trash2,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useVault } from "../context/VaultContext";
import VaultTopBar from "../components/layout/VaultTopBar";
import HamburgerMenu from "../components/layout/HamburgerMenu";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token")}`,
});

const Toast = ({ message, type, onClose }) => {
  setTimeout(onClose, 3500);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
      className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium ${
        type === "error" ? "bg-red-950/95 border-red-500/30 text-red-300" : "bg-slate-900/95 border-cyan-500/30 text-white"
      }`}
    >
      {type === "error" ? <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" /> : <Check className="w-4 h-4 text-cyan-400 flex-shrink-0" />}
      {message}
    </motion.div>
  );
};

const PasswordField = ({ label, value, onChange, placeholder, isDark, show, onToggle, error }) => (
  <div>
    <label className={`block text-xs font-bold uppercase tracking-widest mb-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}>{label}</label>
    <div className="relative">
      <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-slate-400" : "text-gray-400"}`} />
      <input
        type={show ? "text" : "password"} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className={`w-full pl-11 pr-11 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${
          error ? "border-red-500/50 focus:ring-red-500/20 bg-red-500/5" :
          isDark ? "bg-slate-800/60 border-slate-700/50 text-white placeholder:text-gray-500 focus:border-cyan-500/50 focus:ring-cyan-500/20" :
          "bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-cyan-400 focus:ring-cyan-500/20"
        }`}
      />
      <button type="button" onClick={onToggle} className={`absolute right-4 top-1/2 -translate-y-1/2 ${isDark ? "text-slate-400 hover:text-white" : "text-gray-400 hover:text-gray-700"} transition-colors`}>
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
    {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
  </div>
);

export default function VaultSettings() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { activeVault, setActiveVault } = useVault();

  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => setToast({ message, type });

  const vaultId = activeVault?.id || activeVault?._id;
  const hasPassword = activeVault?.hasPassword;

  // Set password form
  const [setPass, setSetPass] = useState("");
  const [setConfirm, setSetConfirm] = useState("");
  const [showSetPass, setShowSetPass] = useState(false);
  const [showSetConf, setShowSetConf] = useState(false);
  const [setLoading, setSetLoading] = useState(false);
  const [setErrors, setSetErrors] = useState({});

  // Change password form
  const [currPass, setCurrPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newConfirm, setNewConfirm] = useState("");
  const [showCurr, setShowCurr] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showNewConf, setShowNewConf] = useState(false);
  const [changeLoading, setChangeLoading] = useState(false);
  const [changeErrors, setChangeErrors] = useState({});

  // Remove password
  const [removePass, setRemovePass] = useState("");
  const [showRemove, setShowRemove] = useState(false);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  if (!activeVault) {
    return (
      <div className={`h-screen w-full flex items-center justify-center ${isDark ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" : "bg-gradient-to-br from-gray-50 via-white to-gray-100"}`}>
        <div className="text-center px-6">
          <Shield className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
          <p className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>No vault selected</p>
          <button onClick={() => navigate("/vaults")} className="mt-4 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-sm">Go to Vaults</button>
        </div>
      </div>
    );
  }

  const patchPassword = async (body) => {
    const res = await fetch(`${API}/vaults/${vaultId}/password`, {
      method: "PATCH", headers: authHeaders(), credentials: "include",
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    return data;
  };

  const handleSetPassword = async () => {
    const errs = {};
    if (!setPass) errs.pass = "Password is required";
    else if (setPass.length < 6) errs.pass = "At least 6 characters";
    if (setPass !== setConfirm) errs.confirm = "Passwords do not match";
    if (Object.keys(errs).length) { setSetErrors(errs); return; }
    setSetLoading(true);
    try {
      await patchPassword({ action: "set", newPassword: setPass });
      setActiveVault(v => ({ ...v, hasPassword: true }));
      setSetPass(""); setSetConfirm(""); setSetErrors({});
      showToast("Vault password set successfully!");
    } catch (e) { showToast(e.message, "error"); }
    finally { setSetLoading(false); }
  };

  const handleChangePassword = async () => {
    const errs = {};
    if (!currPass) errs.curr = "Current password required";
    if (!newPass) errs.new = "New password required";
    else if (newPass.length < 6) errs.new = "At least 6 characters";
    if (newPass !== newConfirm) errs.confirm = "Passwords do not match";
    if (Object.keys(errs).length) { setChangeErrors(errs); return; }
    setChangeLoading(true);
    try {
      await patchPassword({ action: "change", currentPassword: currPass, newPassword: newPass });
      setCurrPass(""); setNewPass(""); setNewConfirm(""); setChangeErrors({});
      showToast("Password changed successfully!");
    } catch (e) {
      if (e.message.toLowerCase().includes("incorrect")) setChangeErrors({ curr: "Incorrect password" });
      else showToast(e.message, "error");
    }
    finally { setChangeLoading(false); }
  };

  const handleRemovePassword = async () => {
    if (!removePass) { showToast("Enter your current password to confirm", "error"); return; }
    setRemoveLoading(true);
    try {
      await patchPassword({ action: "remove", currentPassword: removePass });
      setActiveVault(v => ({ ...v, hasPassword: false }));
      setRemovePass(""); setShowRemoveConfirm(false);
      showToast("Vault password removed.");
    } catch (e) { showToast(e.message, "error"); }
    finally { setRemoveLoading(false); }
  };

  const card = `rounded-2xl border backdrop-blur-xl shadow-xl overflow-hidden ${isDark ? "bg-slate-800/50 border-slate-700/50" : "bg-white/80 border-gray-200"}`;
  const infoBox = (color) => `flex items-start gap-3 p-3.5 rounded-xl border ${isDark ? `bg-${color}-500/10 border-${color}-500/20` : `bg-${color}-50 border-${color}-200`}`;

  return (
    <div className={`h-screen w-full overflow-hidden transition-colors duration-500 ${isDark ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" : "bg-gradient-to-br from-gray-50 via-white to-gray-100"}`}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-1/4 -left-1/4 w-96 h-96 ${isDark ? "bg-cyan-500/5" : "bg-cyan-500/3"} rounded-full blur-3xl animate-pulse`} />
        <div className={`absolute bottom-1/4 -right-1/4 w-96 h-96 ${isDark ? "bg-blue-600/5" : "bg-blue-600/3"} rounded-full blur-3xl animate-pulse`} style={{ animationDelay: "1s" }} />
      </div>

      <VaultTopBar />
      <HamburgerMenu />

      <div className="relative z-10 h-[calc(100vh-4rem)] mt-16 overflow-y-auto vault-scrollbar">
        <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-8">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <button onClick={() => navigate("/vault/permissions")}
              className={`flex items-center gap-2 mb-5 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${isDark ? "bg-slate-800/50 border-slate-700/50 text-gray-300 hover:text-white hover:border-cyan-500/40" : "bg-white/80 border-gray-200 text-gray-600 hover:border-cyan-400"}`}>
              <ArrowLeft className="w-4 h-4" /> Back to Permissions
            </button>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/30 flex-shrink-0">
                <KeyRound className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className={`text-3xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Vault Settings</h1>
                <p className={`text-sm mt-0.5 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                  Manage password for <span className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>{activeVault?.name}</span>
                </p>
              </div>
            </div>
          </motion.div>

          {/* Status badge */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className={`flex items-center gap-3 p-4 rounded-xl border mb-6 ${hasPassword ? isDark ? "bg-cyan-500/10 border-cyan-500/20" : "bg-cyan-50 border-cyan-200" : isDark ? "bg-slate-800/60 border-slate-700/50" : "bg-gray-50 border-gray-200"}`}>
            {hasPassword ? <Lock className={`w-5 h-5 flex-shrink-0 ${isDark ? "text-cyan-400" : "text-cyan-600"}`} /> : <Unlock className={`w-5 h-5 flex-shrink-0 ${isDark ? "text-gray-400" : "text-gray-500"}`} />}
            <div>
              <p className={`font-semibold text-sm ${isDark ? "text-white" : "text-gray-900"}`}>{hasPassword ? "Password Protected" : "No Password Set"}</p>
              <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                {hasPassword ? "Members need the password to decrypt files." : "Add a password to enable vault locking and ZK encryption."}
              </p>
            </div>
          </motion.div>

          <div className="space-y-5">

            {/* SET password */}
            {!hasPassword && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className={card}>
                <div className="h-[2px] bg-gradient-to-r from-cyan-500 to-blue-600" />
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-9 h-9 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg"><Lock className="w-4 h-4 text-white" /></div>
                    <div>
                      <h2 className={`font-bold text-base ${isDark ? "text-white" : "text-gray-900"}`}>Set Vault Password</h2>
                      <p className={`text-xs mt-0.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Enable vault locking and ZK encryption</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <PasswordField label="New Password" value={setPass} onChange={v => { setSetPass(v); setSetErrors(e => ({ ...e, pass: "" })); }} placeholder="Min 6 characters" isDark={isDark} show={showSetPass} onToggle={() => setShowSetPass(v => !v)} error={setErrors.pass} />
                    <PasswordField label="Confirm Password" value={setConfirm} onChange={v => { setSetConfirm(v); setSetErrors(e => ({ ...e, confirm: "" })); }} placeholder="Repeat the password" isDark={isDark} show={showSetConf} onToggle={() => setShowSetConf(v => !v)} error={setErrors.confirm} />
                    <div className={`flex items-start gap-3 p-3.5 rounded-xl border ${isDark ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-50 border-amber-200"}`}>
                      <AlertCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isDark ? "text-amber-400" : "text-amber-600"}`} />
                      <p className={`text-xs ${isDark ? "text-amber-300" : "text-amber-700"}`}><span className="font-semibold">Zero-Knowledge:</span> The password derives an encryption key on your device. The server never stores your key. Existing files won't be automatically re-encrypted.</p>
                    </div>
                    <button onClick={handleSetPassword} disabled={setLoading}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white font-semibold shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100">
                      {setLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                      {setLoading ? "Setting password…" : "Set Password"}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* CHANGE password */}
            {hasPassword && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className={card}>
                <div className="h-[2px] bg-gradient-to-r from-blue-500 to-indigo-600" />
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg"><KeyRound className="w-4 h-4 text-white" /></div>
                    <div>
                      <h2 className={`font-bold text-base ${isDark ? "text-white" : "text-gray-900"}`}>Change Password</h2>
                      <p className={`text-xs mt-0.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Update your existing vault password</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <PasswordField label="Current Password" value={currPass} onChange={v => { setCurrPass(v); setChangeErrors(e => ({ ...e, curr: "" })); }} placeholder="Your current password" isDark={isDark} show={showCurr} onToggle={() => setShowCurr(v => !v)} error={changeErrors.curr} />
                    <PasswordField label="New Password" value={newPass} onChange={v => { setNewPass(v); setChangeErrors(e => ({ ...e, new: "" })); }} placeholder="Min 6 characters" isDark={isDark} show={showNew} onToggle={() => setShowNew(v => !v)} error={changeErrors.new} />
                    <PasswordField label="Confirm New Password" value={newConfirm} onChange={v => { setNewConfirm(v); setChangeErrors(e => ({ ...e, confirm: "" })); }} placeholder="Repeat new password" isDark={isDark} show={showNewConf} onToggle={() => setShowNewConf(v => !v)} error={changeErrors.confirm} />
                    <div className={`flex items-start gap-3 p-3.5 rounded-xl border ${isDark ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-50 border-amber-200"}`}>
                      <AlertCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isDark ? "text-amber-400" : "text-amber-600"}`} />
                      <p className={`text-xs ${isDark ? "text-amber-300" : "text-amber-700"}`}><span className="font-semibold">Important:</span> Changing your password updates the key derivation. Files encrypted with the old password will need to be re-uploaded to be decryptable with the new one.</p>
                    </div>
                    <button onClick={handleChangePassword} disabled={changeLoading}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-blue-500 via-indigo-600 to-violet-600 text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100">
                      {changeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                      {changeLoading ? "Changing…" : "Change Password"}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* REMOVE password */}
            {hasPassword && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={card}>
                <div className="h-[2px] bg-gradient-to-r from-red-500 to-rose-600" />
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg"><Unlock className="w-4 h-4 text-white" /></div>
                    <div>
                      <h2 className={`font-bold text-base ${isDark ? "text-white" : "text-gray-900"}`}>Remove Password</h2>
                      <p className={`text-xs mt-0.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Make this vault passwordless</p>
                    </div>
                  </div>
                  <AnimatePresence mode="wait">
                    {!showRemoveConfirm ? (
                      <motion.div key="trigger" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div className={`flex items-start gap-3 p-3.5 rounded-xl border mb-4 ${isDark ? "bg-red-500/10 border-red-500/20" : "bg-red-50 border-red-200"}`}>
                          <AlertCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isDark ? "text-red-400" : "text-red-500"}`} />
                          <p className={`text-xs ${isDark ? "text-red-300" : "text-red-700"}`}>Removing the password disables vault locking. <span className="font-semibold">Existing encrypted files will become inaccessible unless re-uploaded.</span></p>
                        </div>
                        <button onClick={() => setShowRemoveConfirm(true)}
                          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-semibold transition-all ${isDark ? "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20" : "bg-red-50 border-red-200 text-red-500 hover:bg-red-100"}`}>
                          <Trash2 className="w-4 h-4" /> Remove Password
                        </button>
                      </motion.div>
                    ) : (
                      <motion.div key="confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                        <PasswordField label="Confirm with Current Password" value={removePass} onChange={setRemovePass} placeholder="Enter current password to confirm" isDark={isDark} show={showRemove} onToggle={() => setShowRemove(v => !v)} />
                        <div className="flex gap-3">
                          <button onClick={() => { setShowRemoveConfirm(false); setRemovePass(""); }}
                            className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all ${isDark ? "bg-slate-700 border-slate-600 text-white hover:bg-slate-600" : "bg-gray-100 border-gray-200 text-gray-900 hover:bg-gray-200"}`}>
                            Cancel
                          </button>
                          <button onClick={handleRemovePassword} disabled={removeLoading}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-semibold text-sm hover:from-red-600 hover:to-rose-700 transition-all disabled:opacity-50">
                            {removeLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            {removeLoading ? "Removing…" : "Confirm Remove"}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

          </div>
        </div>
      </div>

      <AnimatePresence>
        {toast && <Toast key={toast.message} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>

      <style>{`
        .vault-scrollbar::-webkit-scrollbar { width: 4px; }
        .vault-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .vault-scrollbar::-webkit-scrollbar-thumb { background: rgba(6,182,212,0.4); border-radius: 2px; }
        .vault-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(6,182,212,0.65); }
      `}</style>
    </div>
  );
}