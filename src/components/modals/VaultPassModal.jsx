import { useState } from "react";
import { Lock, Eye, EyeOff, X, AlertCircle, Check } from "lucide-react";

const VaultPassModal = ({ onClose, onSave }) => {
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6">
      <div className="bg-slate-800 rounded-2xl p-6 sm:p-8 max-w-md w-full border border-slate-700 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full mb-4">
            <Lock className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
            Add Master Vault PIN
          </h2>
          <p className="text-slate-400 text-sm">
            Optional: Add an extra layer of security to your vault
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          {/* PIN Input */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Vault PIN (Optional)
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type={showPass ? "text" : "password"}
                value={pass}
                onChange={(e) => {
                  setPass(e.target.value);
                  setError("");
                }}
                placeholder="Enter vault PIN"
                className="w-full pl-12 pr-12 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
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
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Confirm PIN
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type={showConfirmPass ? "text" : "password"}
                value={confirmPass}
                onChange={(e) => {
                  setConfirmPass(e.target.value);
                  setError("");
                }}
                placeholder="Confirm vault PIN"
                className="w-full pl-12 pr-12 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleSave()}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPass(!showConfirmPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
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
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="text-xl">💡</div>
              <div>
                <p className="text-sm font-semibold text-blue-300 mb-1">Tip:</p>
                <p className="text-xs text-blue-400/80">
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
              className="flex-1 bg-slate-700 text-white py-3 rounded-xl font-semibold hover:bg-slate-600 transition-all flex items-center justify-center gap-2"
            >
              <X className="w-5 h-5" />
              Skip
            </button>
            <button
              onClick={handleSave}
              className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-600 text-white py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-cyan-700 transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              {pass.trim() ? "Set PIN" : "Continue"}
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full text-sm text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default VaultPassModal;