import { useState, useCallback } from 'react';

export const useToast = () => {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success', duration = 3000) => {
    setToast({ message, type, duration });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  return {
    toast,
    showToast,
    hideToast,
    showSuccess: useCallback((message, duration) => showToast(message, 'success', duration), [showToast]),
    showError: useCallback((message, duration) => showToast(message, 'error', duration), [showToast]),
    showWarning: useCallback((message, duration) => showToast(message, 'warning', duration), [showToast]),
    showInfo: useCallback((message, duration) => showToast(message, 'info', duration), [showToast])
  };
};