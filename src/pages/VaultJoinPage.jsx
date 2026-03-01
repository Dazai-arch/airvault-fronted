// VaultJoinPage.jsx
// Route: /vault/join/:vaultId
// Users are added INSTANTLY — no owner approval required.

import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Shield, Lock, AlertCircle, CheckCircle,
  Loader2, LogIn, UserPlus, ArrowRight, Eye,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function VaultJoinPage() {
  const { vaultId } = useParams();
  const navigate    = useNavigate();
  const { isDark }  = useTheme();

  const [vault,   setVault]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error,   setError]   = useState(null);
  // "already-member" | "owner" | "joined"
  const [status,  setStatus]  = useState(null);

  const token      = localStorage.getItem("token") || sessionStorage.getItem("token");
  const isLoggedIn = !!token;

  // ── Fetch vault public info ──────────────────────────────────────────────────
  useEffect(() => {
    const fetchVault = async () => {
      try {
        const res  = await fetch(`${API_BASE_URL}/vaults/join/${vaultId}`);
        const data = await res.json();
        if (!res.ok) { setError(data.message || "Vault not found"); return; }
        setVault(data.vault);

        // If already logged in, attempt join silently on page load
        if (isLoggedIn) attemptJoin(true);

      } catch {
        setError("Could not load vault information. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchVault();
  }, [vaultId]);

  // ── Join logic ───────────────────────────────────────────────────────────────
  const attemptJoin = async (silent = false) => {
    if (!isLoggedIn) {
      sessionStorage.setItem("pendingVaultJoin", vaultId);
      navigate(`/auth?redirect=/vault/join/${vaultId}`);
      return;
    }

    if (!silent) setJoining(true);
    setError(null);

    try {
      const res  = await fetch(`${API_BASE_URL}/vaults/join/${vaultId}`, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        credentials: "include",
      });
      const data = await res.json();

      if (!res.ok) { setError(data.message || "Could not join vault"); return; }

      if (data.alreadyOwner)  { setStatus("owner");          return; }
      if (data.alreadyMember) { setStatus("already-member"); return; }

      // Instant join success — redirect to dashboard after 2s
      setStatus("joined");
      setTimeout(() => navigate("/maindashboard"), 2000);

    } catch {
      if (!silent) setError("Network error. Please try again.");
    } finally {
      if (!silent) setJoining(false);
    }
  };

  // ── Shared styles ────────────────────────────────────────────────────────────
  const bg = isDark
    ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
    : "bg-gradient-to-br from-gray-50 via-white to-gray-100";

  const card = `rounded-2xl border backdrop-blur-xl shadow-2xl ${
    isDark ? "bg-slate-800/70 border-slate-700/50" : "bg-white/90 border-gray-200"
  }`;

  const btnPrimary   = "w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white font-semibold hover:scale-[1.02] transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2";
  const btnSecondary = `w-full py-3 rounded-xl border font-semibold text-sm transition-all hover:scale-[1.02] flex items-center justify-center gap-2 ${
    isDark ? "border-slate-600 text-white hover:bg-slate-700" : "border-gray-300 text-gray-700 hover:bg-gray-50"
  }`;

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className={`min-h-screen ${bg} flex items-center justify-center`}>
      <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
    </div>
  );

  // ── Vault not found ──────────────────────────────────────────────────────────
  if (error && !vault) return (
    <div className={`min-h-screen ${bg} flex items-center justify-center p-4`}>
      <div className={`${card} p-8 max-w-md w-full text-center`}>
        <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/20">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <h1 className={`text-xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>Vault Not Found</h1>
        <p className={`text-sm mb-6 ${isDark ? "text-gray-400" : "text-gray-500"}`}>{error}</p>
        <button onClick={() => navigate("/maindashboard")} className={btnPrimary}>
          Go to Dashboard <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${bg} flex items-center justify-center p-4 relative overflow-hidden`}>
      {/* Ambient blobs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl animate-pulse pointer-events-none" style={{ animationDelay: "1s" }} />

      <div className={`${card} p-8 max-w-md w-full relative overflow-hidden`}>
        {/* Top accent bar */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600" />

        {/* Brand */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-9 h-9 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className={`text-base font-extrabold tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>AirVault</span>
        </div>

        {/* ── STATUS: Joined successfully ── */}
        {status === "joined" && (
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className={`text-xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>You're in!</h2>
            <p className={`text-sm mb-6 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              You've joined <strong>{vault?.name}</strong>. Redirecting to your dashboard…
            </p>
            <button onClick={() => navigate("/maindashboard")} className={btnPrimary}>
              Open Dashboard <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── STATUS: Already a member ── */}
        {status === "already-member" && (
          <div className="text-center">
            <div className="w-16 h-16 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-cyan-400" />
            </div>
            <h2 className={`text-xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>Already a member!</h2>
            <p className={`text-sm mb-6 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              You already have access to <strong>{vault?.name}</strong>.
            </p>
            <button onClick={() => navigate("/maindashboard")} className={btnPrimary}>
              Open Dashboard <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── STATUS: Owner ── */}
        {status === "owner" && (
          <div className="text-center">
            <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-indigo-400" />
            </div>
            <h2 className={`text-xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>This is your vault!</h2>
            <p className={`text-sm mb-6 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              You own <strong>{vault?.name}</strong>.
            </p>
            <button onClick={() => navigate("/maindashboard")} className={btnPrimary}>
              Go to Dashboard <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── DEFAULT: Invite landing (not yet joined) ── */}
        {!status && (
          <>
            <h1 className={`text-2xl font-bold mb-1 ${isDark ? "text-white" : "text-gray-900"}`}>
              You've been invited
            </h1>
            <p className={`text-sm mb-6 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              Someone shared a secure vault with you.
            </p>

            {/* Vault info card */}
            <div className={`rounded-2xl border p-5 mb-6 ${isDark ? "bg-slate-900/60 border-slate-700/60" : "bg-gray-50 border-gray-200"}`}>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/25 flex-shrink-0">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div className="min-w-0">
                  <p className={`text-lg font-bold truncate ${isDark ? "text-white" : "text-gray-900"}`}>{vault?.name}</p>
                  {vault?.description && (
                    <p className={`text-xs truncate ${isDark ? "text-gray-400" : "text-gray-500"}`}>{vault.description}</p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium ${isDark ? "bg-slate-800/50 border-slate-700/40 text-gray-300" : "bg-white border-gray-200 text-gray-600"}`}>
                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                  Viewer Access
                </div>
                {vault?.hasPassword && (
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium ${isDark ? "bg-amber-500/10 border-amber-500/20 text-amber-300" : "bg-amber-50 border-amber-200 text-amber-700"}`}>
                    <Lock className="w-3.5 h-3.5" />
                    Password Protected
                  </div>
                )}
              </div>
              {vault?.passwordHint && (
                <p className={`text-xs mt-2 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                  Hint: <span className="italic">{vault.passwordHint}</span>
                </p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className={`flex items-center gap-2.5 p-3 rounded-xl border mb-4 text-xs ${isDark ? "bg-red-500/10 border-red-500/20 text-red-300" : "bg-red-50 border-red-200 text-red-600"}`}>
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* CTA */}
            {isLoggedIn ? (
              <button onClick={() => attemptJoin(false)} disabled={joining} className={btnPrimary}>
                {joining
                  ? <><Loader2 className="w-5 h-5 animate-spin" /> Joining…</>
                  : <><CheckCircle className="w-5 h-5" /> Join Vault</>
                }
              </button>
            ) : (
              <div className="space-y-3">
                <p className={`text-xs text-center mb-3 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  Sign in or create an account to join this vault instantly.
                </p>
                {/* Both buttons go to /auth — your AuthPage handles both login & signup */}
                <Link
                  to={`/auth?redirect=/vault/join/${vaultId}`}
                  onClick={() => sessionStorage.setItem("pendingVaultJoin", vaultId)}
                  className={btnPrimary}
                >
                  <LogIn className="w-5 h-5" />
                  Sign In to Join
                </Link>
                <Link
                  to={`/auth?redirect=/vault/join/${vaultId}`}
                  onClick={() => sessionStorage.setItem("pendingVaultJoin", vaultId)}
                  className={btnSecondary}
                >
                  <UserPlus className="w-4 h-4" />
                  Create Account
                </Link>
              </div>
            )}

            <p className={`text-center text-[10px] mt-4 ${isDark ? "text-gray-600" : "text-gray-400"}`}>
              AirVault · Zero-Knowledge Encrypted Storage
            </p>
          </>
        )}
      </div>
    </div>
  );
}