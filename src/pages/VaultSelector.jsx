import { useState, useEffect } from "react";
import { useVault } from "../context/VaultContext";
import { useNavigate } from "react-router-dom";
import { Shield, Lock, LockOpen, Plus, ArrowLeft, Trash2, X, AlertTriangle, Eye, EyeOff } from "lucide-react";
import Toast from "../components/layout/Toast";

const API_URL = import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:5000/api" : "/api");

const VaultSelector = () => {
  const { setActiveVault } = useVault();
  const navigate = useNavigate();
  const [vaults, setVaults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState(null); // { vault, step: 'confirm' | 'password' }
  const [unlockModal, setUnlockModal] = useState(null); // { vault }
  const [deleteInput, setDeleteInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [unlockPassword, setUnlockPassword] = useState("");
  const [showUnlockPassword, setShowUnlockPassword] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Fetch vaults from backend
  useEffect(() => {
    fetchVaults();
  }, []);

  const fetchVaults = async () => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const response = await fetch(`${API_URL}/vaults`, {
        headers: {
          "Authorization": `Bearer ${token}`
        },
        credentials: "include"
      });

      const data = await response.json();
      if (response.ok) {
        setVaults(data.vaults || []);
      } else {
        showToast("Failed to load vaults", "error");
      }
    } catch (error) {
      console.error("Error fetching vaults:", error);
      showToast("Error loading vaults", "error");
    } finally {
      setLoading(false);
    }
  };

  const openVault = async (vault) => {
    if (vault.hasPassword) {
      setUnlockModal({ vault });
      setUnlockPassword("");
      setShowUnlockPassword(false);
      return;
    }

    setActiveVault(vault);
    navigate("/vault/dashboard");
  };

  const handleUnlockSubmit = async () => {
    if (!unlockPassword) {
      showToast("Please enter your vault password", "error");
      return;
    }

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const response = await fetch(`${API_URL}/vaults/${unlockModal.vault.id}/verify-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        credentials: "include",
        body: JSON.stringify({ password: unlockPassword })
      });

      const data = await response.json();
      if (!response.ok) {
        showToast(data.message || "Incorrect password", "error");
        setUnlockPassword("");
        return;
      }

      // Password correct, open vault
      setActiveVault(unlockModal.vault);
      setUnlockModal(null);
      setUnlockPassword("");
      setShowUnlockPassword(false);
      navigate("/vault/dashboard");
    } catch (error) {
      showToast("Error verifying password", "error");
    }
  };

  const handleDeleteClick = (e, vault) => {
    e.stopPropagation();
    setDeleteModal({ vault, step: 'confirm' });
    setDeleteInput("");
    setPasswordInput("");
  };

  const handleDeleteConfirm = () => {
    if (deleteInput.toLowerCase() !== "delete") {
      showToast('Please type "delete" to confirm', "error");
      return;
    }

    if (deleteModal.vault.hasPassword) {
      setDeleteModal({ ...deleteModal, step: 'password' });
    } else {
      executeDelete();
    }
  };

  const handlePasswordConfirm = async () => {
    if (!passwordInput) {
      showToast("Please enter your vault password", "error");
      return;
    }

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const response = await fetch(`${API_URL}/vaults/${deleteModal.vault.id}/verify-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        credentials: "include",
        body: JSON.stringify({ password: passwordInput })
      });

      const data = await response.json();
      if (!response.ok) {
        showToast(data.message || "Incorrect password", "error");
        return;
      }

      executeDelete();
    } catch (error) {
      showToast("Error verifying password", "error");
    }
  };

  const executeDelete = async () => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const response = await fetch(`${API_URL}/vaults/${deleteModal.vault.id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        credentials: "include"
      });

      const data = await response.json();
      if (response.ok) {
        showToast(`Vault "${deleteModal.vault.name}" deleted successfully`, "success");
        setDeleteModal(null);
        fetchVaults(); // Refresh vault list
      } else {
        showToast(data.message || "Failed to delete vault", "error");
      }
    } catch (error) {
      showToast("Error deleting vault", "error");
    }
  };

  const closeDeleteModal = () => {
    setDeleteModal(null);
    setDeleteInput("");
    setPasswordInput("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading vaults...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '0.5s'}}></div>
      </div>

      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8 sm:mb-10">
          <button
            onClick={() => navigate("/createvaults")}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors duration-200 mb-6 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
            <span className="text-sm">Back</span>
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
                  <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
                </div>
                Your Vaults
              </h1>
              <p className="text-slate-400 text-sm sm:text-base">Select a vault to access your encrypted files</p>
            </div>

            <button
              onClick={() => navigate("/createvaults")}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              <span>New Vault</span>
            </button>
          </div>
        </div>

        {/* Vaults Grid */}
        {vaults.length === 0 ? (
          <div className="text-center py-16 sm:py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-800/50 border border-slate-700/50 mb-6">
              <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" />
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold text-white mb-2">No vaults yet</h3>
            <p className="text-slate-400 mb-6 text-sm sm:text-base">Create your first vault to get started</p>
            <button
              onClick={() => navigate("/createvaults")}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-semibold shadow-lg shadow-blue-500/25 transition-all duration-300"
            >
              <Plus className="w-5 h-5" />
              Create Vault
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {vaults.map((vault) => (
              <div
                key={vault.id}
                className="group relative bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5 sm:p-6 cursor-pointer hover:border-blue-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-transparent to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative" onClick={() => openVault(vault)}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-xl bg-slate-700/50 border border-slate-600/50 group-hover:scale-110 transition-transform duration-300">
                      {vault.hasPassword ? (
                        <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                      ) : (
                        <LockOpen className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400" />
                      )}
                    </div>
                    
                    <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      vault.hasPassword
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                        : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                    }`}>
                      {vault.hasPassword ? "Protected" : "No Password"}
                    </div>
                  </div>

                  <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 truncate pr-8">
                    {vault.name}
                  </h3>
                  
                  <div className="flex items-center justify-between text-xs sm:text-sm text-slate-400">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      {vault.fileCount || 0} files
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(vault.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Delete Button */}
                <button
                  onClick={(e) => handleDeleteClick(e, vault)}
                  className="absolute top-4 right-4 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 transition-all duration-200 z-10"
                  title="Delete vault"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Unlock Vault Modal */}
      {unlockModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6">
          <div className="bg-slate-800 rounded-2xl p-6 sm:p-8 max-w-md w-full border border-slate-700 shadow-2xl relative">
            <button
              onClick={() => {
                setUnlockModal(null);
                setUnlockPassword("");
                setShowUnlockPassword(false);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full mb-4">
                <Lock className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                Unlock Vault
              </h2>
              <p className="text-slate-400 text-sm">
                Enter password for <span className="text-white font-semibold">{unlockModal.vault.name}</span>
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Vault Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type={showUnlockPassword ? "text" : "password"}
                    value={unlockPassword}
                    onChange={(e) => setUnlockPassword(e.target.value)}
                    placeholder="Enter vault password"
                    className="w-full pl-12 pr-12 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                    onKeyPress={(e) => e.key === 'Enter' && handleUnlockSubmit()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowUnlockPassword(!showUnlockPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    {showUnlockPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setUnlockModal(null);
                    setUnlockPassword("");
                    setShowUnlockPassword(false);
                  }}
                  className="flex-1 px-4 py-3 rounded-xl bg-slate-700 text-white font-semibold hover:bg-slate-600 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUnlockSubmit}
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-semibold hover:from-blue-600 hover:to-cyan-700 transition-all flex items-center justify-center gap-2"
                >
                  <LockOpen className="w-5 h-5" />
                  Unlock
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6">
          <div className="bg-slate-800 rounded-2xl p-6 sm:p-8 max-w-md w-full border border-slate-700 shadow-2xl relative">
            <button
              onClick={closeDeleteModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-red-500/10 border border-red-500/20 rounded-full mb-4">
                <AlertTriangle className="w-7 h-7 sm:w-8 sm:h-8 text-red-400" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                {deleteModal.step === 'confirm' ? 'Delete Vault?' : 'Verify Password'}
              </h2>
              <p className="text-slate-400 text-sm">
                {deleteModal.step === 'confirm' 
                  ? `Are you sure you want to delete "${deleteModal.vault.name}"? This action cannot be undone.`
                  : 'Enter your vault password to confirm deletion'
                }
              </p>
            </div>

            <div className="space-y-4">
              {deleteModal.step === 'confirm' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Type "delete" to confirm
                    </label>
                    <input
                      type="text"
                      value={deleteInput}
                      onChange={(e) => setDeleteInput(e.target.value)}
                      placeholder="delete"
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                      autoFocus
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={closeDeleteModal}
                      className="flex-1 px-4 py-3 rounded-xl bg-slate-700 text-white font-semibold hover:bg-slate-600 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteConfirm}
                      disabled={deleteInput.toLowerCase() !== 'delete'}
                      className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Delete
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Vault Password
                    </label>
                    <input
                      type="password"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="Enter vault password"
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                      autoFocus
                      onKeyPress={(e) => e.key === 'Enter' && handlePasswordConfirm()}
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setDeleteModal({ ...deleteModal, step: 'confirm' })}
                      className="flex-1 px-4 py-3 rounded-xl bg-slate-700 text-white font-semibold hover:bg-slate-600 transition-all"
                    >
                      Back
                    </button>
                    <button
                      onClick={handlePasswordConfirm}
                      className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold hover:from-red-600 hover:to-red-700 transition-all"
                    >
                      Confirm Delete
                    </button>
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

export default VaultSelector;