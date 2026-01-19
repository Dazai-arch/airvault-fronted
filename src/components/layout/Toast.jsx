// src/components/layout/Toast.jsx
import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose, duration = 3000 }) => {
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-400" />,
    error: <XCircle className="w-5 h-5 text-red-400" />,
    warning: <AlertCircle className="w-5 h-5 text-yellow-400" />,
    info: <AlertCircle className="w-5 h-5 text-blue-400" />
  };

  const styles = {
    success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
    error: 'bg-red-500/10 border-red-500/20 text-red-300',
    warning: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300',
    info: 'bg-blue-500/10 border-blue-500/20 text-blue-300'
  };

  return (
    <div className="fixed top-6 right-6 z-[9999] animate-slide-in"> {/* Changed z-50 to z-[9999] */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-2xl min-w-[300px] max-w-md ${styles[type]}`}>
        <div className="flex-shrink-0">
          {icons[type]}
        </div>
        <p className="text-sm font-medium flex-1">
          {message}
        </p>
        <button
          onClick={onClose}
          className="flex-shrink-0 hover:opacity-70 transition-opacity"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;