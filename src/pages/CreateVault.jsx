import { useState } from "react";
import VaultPassModal from "../components/modals/VaultPassModal";
import { useNavigate } from "react-router-dom";
import { Shield, Lock } from "lucide-react";
import Toast from "../components/layout/Toast";

const API_URL = import.meta.env.REACT_APP_API_URL || "http://localhost:5000/api";

const CreateVault = () => {
  const navigate = useNavigate();
  const [vaultName, setVaultName] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleCreate = () => {
    if (!vaultName.trim()) {
      showToast("Please enter a vault name", "error");
      return;
    }
    setError("");
    setShowModal(true);
  };

  const handleComplete = async (hasPass, pass) => {
  setLoading(true);
  setError("");
  
  try {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    
    const response = await fetch(`${API_URL}/vaults/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      credentials: "include",
      body: JSON.stringify({
        name: vaultName,
        hasPassword: hasPass,
        password: hasPass ? pass : null
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Vault creation failed:", data.message);
      showToast(data.message || "Failed to create vault", "error");
      
      // Close modal if it's a duplicate name error (user needs to change vault name, not PIN)
      if (data.message && data.message.includes("already exists")) {
        setShowModal(false);
      }
      
      setError(data.message || "Failed to create vault");
      setLoading(false);
      return;
    }
    
    const userString = localStorage.getItem("user");
    if (userString) {
      const user = JSON.parse(userString);
      user.vaultCreated = true;
      localStorage.setItem("user", JSON.stringify(user));
    }

    showToast(`Vault "${vaultName}" created successfully!`, "success");
    setShowModal(false);
    setVaultName("");
    
    setTimeout(() => {
      navigate("/vaults");
    }, 1500);

  } catch (err) {
    console.error("❌ Create vault error:", err);
    showToast("Network error. Please try again.", "error");
    setShowModal(false); // Close modal on network error
    setError("Network error. Please try again.");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '0.5s'}}></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 p-3 rounded-2xl shadow-lg shadow-blue-500/20">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-3xl font-bold text-white">AirVault</h1>
              <p className="text-sm text-slate-400">Secure Storage</p>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Create Your Vault</h2>
          <p className="text-slate-400">Your files will be encrypted end-to-end</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50 shadow-2xl">
          <div className="space-y-6">
            {/* Vault Name Input */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Vault Name
              </label>
              <div className="relative">
                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={vaultName}
                  onChange={(e) => {
                    setVaultName(e.target.value);
                    setError("");
                  }}
                  placeholder="e.g., Personal Documents"
                  className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Security Info */}
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="bg-emerald-500/20 p-2 rounded-lg">
                  <Lock className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-300 mb-1">
                    🔒 Military-Grade Encryption
                  </p>
                  <p className="text-xs text-emerald-400/80">
                    All files are encrypted locally before upload. Only you have the keys.
                  </p>
                </div>
              </div>
            </div>

            {/* Create Button */}
            <button
              onClick={handleCreate}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 text-white py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-cyan-700 transition-all transform hover:scale-105 shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <Lock className="w-5 h-5" />
              {loading ? "Creating..." : "Create Vault"}
            </button>

            {/* View Vaults Link */}
            <button
              onClick={() => navigate("/vaults")}
              disabled={loading}
              className="w-full py-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/30 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              View Existing Vaults
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 space-y-2">
          <p className="text-slate-500 text-xs">
            🔐 All data is encrypted locally before storage
          </p>
          <p className="text-slate-600 text-xs">
            © {new Date().getFullYear()} AirVault. All rights reserved.
          </p>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <VaultPassModal
          onClose={() => {
            setShowModal(false);
          }}
          onSave={handleComplete}
        />
      )}
    </div>
  );
};

export default CreateVault;