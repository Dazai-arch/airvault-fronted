import { useNavigate } from "react-router-dom";
import { useCallback } from "react";

export function usePostAuthRedirect() {
  const navigate = useNavigate();

  const handleRedirect = useCallback((defaultPath = "/maindashboard") => {
    // 1. Check URL query param first (?redirect=...)
    const searchParams = new URLSearchParams(window.location.search);
    const redirectParam = searchParams.get("redirect");
    if (redirectParam) {
      navigate(redirectParam);
      return;
    }

    // 2. Check sessionStorage for pending vault join
    const pendingJoin = sessionStorage.getItem("pendingVaultJoin");
    if (pendingJoin) {
      sessionStorage.removeItem("pendingVaultJoin");
      navigate(`/vault/join/${pendingJoin}`);
      return;
    }

    // 3. Default redirect
    navigate(defaultPath);
  }, [navigate]);

  return handleRedirect;
}