import { useState } from "react";
import { Lock, Eye, EyeOff, X, AlertCircle, Check } from "lucide-react";

const VaultPassModal = ({ onClose, onSave, isDark = true }) => {
  const [pass, setPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [error, setError] = useState("");

  const handleSkip = () => {
    setError("");
    onSave(false, null);
  };

  const handleSave = () => {
    setError("");
    
    if (!pass.trim() && !confirmPass.trim()) {
      onSave(false, null);
      return;
    }
    
    // Validate password
    if (!pass.trim()) {
      setError("Please enter a vault PIN");
      return;
    }
    
    if (pass.length < 6) {
      setError("PIN must be at least 6 characters");
      return;
    }

    if (pass !== confirmPass) {
      setError("PINs do not match");
      return;
    }
    
    onSave(true, pass);
  };

  return (
    <div className={`fixed inset-0 ${isDark ? 'bg-black/60' : 'bg-gray-900/40'} backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6 transition-colors duration-500`}>
      <div className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} rounded-2xl p-6 sm:p-8 max-w-md w-full border shadow-2xl ${isDark ? 'shadow-cyan-500/10' : 'shadow-cyan-500/20'} relative transition-colors duration-500`}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 ${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-gray-900'} transition-colors`}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full mb-4 shadow-lg shadow-cyan-500/30">
            <Lock className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
          </div>
          <h2 className={`text-xl sm:text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2 transition-colors duration-500`}>
            Add Master Vault PIN
          </h2>
          <p className={`${isDark ? 'text-slate-400' : 'text-gray-600'} text-sm transition-colors duration-500`}>
            Optional: Add an extra layer of security to your vault
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className={`mb-4 p-3 ${isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'} border rounded-xl flex items-center gap-2 transition-colors duration-500`}>
            <AlertCircle className={`w-5 h-5 ${isDark ? 'text-red-400' : 'text-red-500'} flex-shrink-0`} />
            <p className={`text-sm ${isDark ? 'text-red-300' : 'text-red-700'}`}>{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {/* PIN Input */}
          <div>
            <label className={`block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'} mb-2 transition-colors duration-500`}>
              Vault PIN (Optional)
            </label>
            <div className="relative">
              <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-slate-400' : 'text-gray-400'} transition-colors duration-500`} />
              <input
                type={showPass ? "text" : "password"}
                value={pass}
                onChange={(e) => {
                  setPass(e.target.value);
                  setError("");
                }}
                placeholder="Enter vault PIN"
                className={`w-full pl-12 pr-12 py-3 ${isDark ? 'bg-slate-700/50 border-slate-600/50 text-white placeholder-slate-400' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'} border rounded-xl focus:outline-none focus:ring-2 ${isDark ? 'focus:ring-blue-500' : 'focus:ring-cyan-500'} transition-all duration-300`}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className={`absolute right-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-gray-900'} transition-colors`}
              >
                {showPass ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm PIN Input */}
          <div>
            <label className={`block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'} mb-2 transition-colors duration-500`}>
              Confirm PIN
            </label>
            <div className="relative">
              <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-slate-400' : 'text-gray-400'} transition-colors duration-500`} />
              <input
                type={showConfirmPass ? "text" : "password"}
                value={confirmPass}
                onChange={(e) => {
                  setConfirmPass(e.target.value);
                  setError("");
                }}
                placeholder="Confirm vault PIN"
                className={`w-full pl-12 pr-12 py-3 ${isDark ? 'bg-slate-700/50 border-slate-600/50 text-white placeholder-slate-400' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'} border rounded-xl focus:outline-none focus:ring-2 ${isDark ? 'focus:ring-blue-500' : 'focus:ring-cyan-500'} transition-all duration-300`}
                onKeyPress={(e) => e.key === 'Enter' && handleSave()}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPass(!showConfirmPass)}
                className={`absolute right-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-gray-900'} transition-colors`}
              >
                {showConfirmPass ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Info Box */}
          <div className={`${isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'} border rounded-xl p-4 transition-colors duration-500`}>
            <div className="flex items-start gap-3">
              <div className="text-xl">💡</div>
              <div>
                <p className={`text-sm font-semibold ${isDark ? 'text-blue-300' : 'text-blue-700'} mb-1 transition-colors duration-500`}>Tip:</p>
                <p className={`text-xs ${isDark ? 'text-blue-400/80' : 'text-blue-600'} transition-colors duration-500`}>
                  This PIN adds an extra security layer. You'll need it every time you
                  access this vault.
                </p>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSkip}
              className={`flex-1 ${isDark ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-200 hover:bg-gray-300'} ${isDark ? 'text-white' : 'text-gray-900'} py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2`}
            >
              <X className="w-5 h-5" />
              Skip
            </button>
            <button
              onClick={handleSave}
              className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-600 text-white py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-cyan-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/30"
            >
              <Check className="w-5 h-5" />
              {pass.trim() ? "Set PIN" : "Continue"}
            </button>
          </div>

          <button
            onClick={onClose}
            className={`w-full text-sm ${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition-colors`}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default VaultPassModal;