import { useState } from "react";
import VaultPassModal from "../components/modals/VaultPassModal";
import { useNavigate } from "react-router-dom";
import { Shield, Lock, Moon, Sun } from "lucide-react";
import Toast from "../components/layout/Toast";
import { useTheme } from "../context/ThemeContext";

const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:5000/api" : "/api");

const CreateVault = () => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const [vaultName, setVaultName] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
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
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");

      const response = await fetch(`${API_URL}/vaults/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({
          name: vaultName,
          hasPassword: hasPass,
          password: hasPass ? pass : null,
        }),
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
      setShowModal(false);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen ${isDark ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" : "bg-gradient-to-br from-gray-50 via-white to-gray-100"} flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-500`}
    >
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className={`fixed top-6 right-6 p-3 rounded-xl ${isDark ? "bg-slate-800 hover:bg-slate-700" : "bg-white hover:bg-gray-100"} ${isDark ? "border-slate-700" : "border-gray-200"} border transition-all duration-300 shadow-lg z-50 group`}
        aria-label="Toggle theme"
      >
        {isDark ? (
          <Sun className="w-5 h-5 text-yellow-400 group-hover:rotate-90 transition-transform duration-500" />
        ) : (
          <Moon className="w-5 h-5 text-indigo-600 group-hover:-rotate-12 transition-transform duration-500" />
        )}
      </button>

      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className={`absolute top-1/4 -left-1/4 w-96 h-96 ${isDark ? "bg-cyan-500/10" : "bg-cyan-500/5"} rounded-full blur-3xl animate-pulse`}
        ></div>
        <div
          className={`absolute bottom-1/4 -right-1/4 w-96 h-96 ${isDark ? "bg-blue-600/10" : "bg-blue-600/5"} rounded-full blur-3xl animate-pulse`}
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className={`absolute top-1/2 left-1/2 w-96 h-96 ${isDark ? "bg-indigo-500/5" : "bg-indigo-500/3"} rounded-full blur-3xl animate-pulse`}
          style={{ animationDelay: "0.5s" }}
        ></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-3 rounded-2xl shadow-lg shadow-cyan-500/20">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div className="text-left">
              <h1
                className={`text-3xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
              >
                AirVault
              </h1>
              <p className="text-sm text-cyan-500">Secure Storage</p>
            </div>
          </div>
          <h2
            className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"} mb-2`}
          >
            Create Your Vault
          </h2>
          <p className={isDark ? "text-slate-400" : "text-gray-600"}>
            Your files will be encrypted end-to-end
          </p>
        </div>

        {/* Card */}
        <div
          className={`${isDark ? "bg-slate-800/50 border-slate-700/50" : "bg-white/80 border-gray-200"} backdrop-blur-xl rounded-2xl p-8 border shadow-2xl transition-colors duration-500`}
        >
          <div className="space-y-6">
            {/* Vault Name Input */}
            <div>
              <label
                className={`block text-sm font-medium ${isDark ? "text-slate-300" : "text-gray-700"} mb-2`}
              >
                Vault Name
              </label>
              <div className="relative">
                <Shield
                  className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? "text-slate-400" : "text-gray-400"}`}
                />
                <input
                  type="text"
                  value={vaultName}
                  onChange={(e) => {
                    setVaultName(e.target.value);
                    setError("");
                  }}
                  placeholder="e.g., Personal Documents"
                  className={`w-full pl-12 pr-4 py-3 ${isDark ? "bg-slate-700/50 border-slate-600/50 text-white placeholder-slate-400" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400"} border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300`}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Security Info */}
            <div
              className={`${isDark ? "bg-emerald-500/10 border-emerald-500/20" : "bg-emerald-50 border-emerald-200"} border rounded-xl p-4 transition-colors duration-300`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`${isDark ? "bg-emerald-500/20" : "bg-emerald-100"} p-2 rounded-lg transition-colors duration-300`}
                >
                  <Lock
                    className={`w-4 h-4 ${isDark ? "text-emerald-400" : "text-emerald-600"}`}
                  />
                </div>
                <div>
                  <p
                    className={`text-sm font-semibold ${isDark ? "text-emerald-300" : "text-emerald-700"} mb-1`}
                  >
                    🔒 Military-Grade Encryption
                  </p>
                  <p
                    className={`text-xs ${isDark ? "text-emerald-400/80" : "text-emerald-600"}`}
                  >
                    All files are encrypted locally before upload. Only you have
                    the keys.
                  </p>
                </div>
              </div>
            </div>

            {/* Create Button */}
            <button
              onClick={handleCreate}
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 transition-all transform hover:scale-105 shadow-lg shadow-cyan-500/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <Lock className="w-5 h-5" />
              {loading ? "Creating..." : "Create Vault"}
            </button>

            {/* View Vaults Link */}
            <button
              onClick={() => navigate("/vaults")}
              disabled={loading}
              className={`w-full py-3 rounded-xl ${isDark ? "text-slate-400 hover:text-white hover:bg-slate-700/30" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"} transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              View Existing Vaults
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 space-y-2">
          <p
            className={`${isDark ? "text-slate-500" : "text-gray-500"} text-xs`}
          >
            🔐 All data is encrypted locally before storage
          </p>
          <p
            className={`${isDark ? "text-slate-600" : "text-gray-400"} text-xs`}
          >
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
          isDark={isDark} // Add this line
        />
      )}
    </div>
  );
};

export default CreateVault;
