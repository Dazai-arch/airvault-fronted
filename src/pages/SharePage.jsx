import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Lock, Loader2, AlertCircle, Download, Shield } from "lucide-react";
import { decryptToBlob } from "../services/ZKcrypto";
import FilePreviewModal from "../components/modals/FilePreviewModal";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function SharePage() {
  const { fileId } = useParams();
  const [meta,        setMeta]       = useState(null);
  const [keyInfo,     setKeyInfo]    = useState(null); // { requiresPassword, keyHex?, saltB64? }
  const [error,       setError]      = useState(null);
  const [loading,     setLoading]    = useState(true);
  const [password,    setPassword]   = useState("");
  const [pwError,     setPwError]    = useState("");
  const [decrypting,  setDecrypting] = useState(false);
  const [blobUrl,     setBlobUrl]    = useState(null);
  const [blob,        setBlob]       = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        // 1. Fetch file metadata
        const metaRes = await fetch(`${API}/share/${fileId}`);
        const metaData = await metaRes.json();
        if (!metaRes.ok) throw new Error(metaData.message);
        setMeta(metaData);

        // 2. If not encrypted at all — stream and preview immediately, no key needed
        if (!metaData.isEncrypted) {
          await streamAndPreview(metaData, null);
          return;
        }

        // 3. Fetch key info to know if password is needed
        const keyRes = await fetch(`${API}/share/${fileId}/key-info`);
        const keyData = await keyRes.json();
        if (!keyRes.ok) throw new Error(keyData.message);
        setKeyInfo(keyData);

        // 4. Passwordless vault — derive key from keyHex and preview immediately
        if (!keyData.requiresPassword && keyData.keyHex) {
          const vaultKey = await importKeyHex(keyData.keyHex);
          await streamAndPreview(metaData, vaultKey);
          return;
        }

        // 5. Password vault — show password gate
        setLoading(false);

      } catch (e) {
        setError(e.message);
        setLoading(false);
      }
    };
    init();
  }, [fileId]);

  // Convert stored hex key back to CryptoKey
  const importKeyHex = async (keyHex) => {
    const keyBytes = Uint8Array.from(
      keyHex.match(/.{1,2}/g).map(b => parseInt(b, 16))
    );
    return crypto.subtle.importKey(
      "raw", keyBytes, { name: "AES-GCM" }, false, ["decrypt"]
    );
  };

  // Derive key from password + salt (same PBKDF2 params your ZKcrypto uses)
  const deriveKeyFromPassword = async (password, saltB64) => {
    const enc = new TextEncoder();
    const salt = Uint8Array.from(atob(saltB64), c => c.charCodeAt(0));
    const keyMaterial = await crypto.subtle.importKey(
      "raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]
    );
    return crypto.subtle.deriveKey(
      { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );
  };

  const streamAndPreview = async (fileMeta, vaultKey) => {
    setDecrypting(true);
    setPwError("");
    try {
      const res = await fetch(`${API}/share/${fileId}/stream`);
      if (!res.ok) throw new Error("Could not fetch file");
      const buf = await res.arrayBuffer();

      let finalBlob;
      if (fileMeta.isEncrypted && vaultKey) {
        finalBlob = await decryptToBlob(buf, vaultKey, fileMeta.mimeType);
      } else {
        finalBlob = new Blob([buf], { type: fileMeta.mimeType });
      }

      setBlob(finalBlob);
      setBlobUrl(URL.createObjectURL(finalBlob));
      setShowPreview(true);
      setLoading(false);
    } catch (e) {
      if (fileMeta.isEncrypted) {
        setPwError("Wrong password — decryption failed");
      } else {
        setError(e.message);
      }
      setLoading(false);
    } finally {
      setDecrypting(false);
    }
  };

  const handleUnlock = async (e) => {
    e.preventDefault();
    if (!password.trim()) { setPwError("Enter the vault password"); return; }
    if (!keyInfo?.saltB64) { setPwError("Could not retrieve vault salt"); return; }
    try {
      const vaultKey = await deriveKeyFromPassword(password, keyInfo.saltB64);
      await streamAndPreview(meta, vaultKey);
    } catch {
      setPwError("Wrong password — decryption failed");
    }
  };

  const handleDownload = () => {
    if (!blob) return;
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = meta?.name || "file";
    a.click();
  };

  // ── Loading / spinner ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        <p className="text-gray-400 text-sm">
          {decrypting ? "Decrypting file…" : "Loading…"}
        </p>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-slate-900 rounded-2xl border border-slate-700 p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-white font-bold text-lg mb-2">File Not Available</p>
          <p className="text-gray-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // ── Password gate (password vaults only) ──────────────────────────────────
  if (meta?.isEncrypted && !showPreview) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-slate-900 rounded-2xl border border-slate-700/60 overflow-hidden shadow-2xl">
          <div className="h-[3px] bg-gradient-to-r from-cyan-500 to-blue-600" />
          <div className="p-8">
            <div className="flex items-center gap-2 mb-8">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-bold text-sm">AirVault</span>
            </div>

            <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-4 mb-6">
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mb-1">Shared File</p>
              <p className="text-white font-semibold text-sm truncate">{meta.name}</p>
              <p className="text-gray-500 text-xs mt-1">{meta.mimeType}</p>
            </div>

            <div className="flex flex-col items-center gap-3 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <Lock className="w-7 h-7 text-cyan-400" />
              </div>
              <p className="text-white font-bold">Enter Vault Password</p>
              <p className="text-gray-400 text-xs text-center">
                This file is end-to-end encrypted. Enter the vault password to decrypt and view it.
              </p>
            </div>

            <form onSubmit={handleUnlock} className="space-y-3">
              <input
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setPwError(""); }}
                placeholder="Vault password"
                autoFocus
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-gray-500 text-sm outline-none focus:border-cyan-500/50 transition-all"
              />
              {pwError && (
                <p className="text-red-400 text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> {pwError}
                </p>
              )}
              <button
                type="submit"
                disabled={decrypting}
                className="w-full py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white disabled:opacity-60 hover:scale-[1.01] transition-all"
              >
                {decrypting
                  ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Decrypting…</span>
                  : "Unlock & Preview"
                }
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── Preview ────────────────────────────────────────────────────────────────
  if (showPreview && meta) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-700/50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-white font-bold text-sm">AirVault</span>
            <span className="text-gray-600 text-xs ml-2 truncate max-w-[200px]">{meta.name}</span>
          </div>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
          >
            <Download className="w-3.5 h-3.5" /> Download
          </button>
        </div>

        <div className="flex-1 relative">
          <FilePreviewModal
            file={{ ...meta, id: fileId }}
            onClose={() => {}}
            onDownload={handleDownload}
            isDark={true}
            vaultId={null}
            apiBaseUrl={API}
            canDownload={true}
            vaultKey={null}
            blobUrl={blobUrl}
          />
        </div>
      </div>
    );
  }

  return null;
}
