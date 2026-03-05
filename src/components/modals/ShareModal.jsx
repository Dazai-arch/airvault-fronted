import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Share2, Mail, Send, AlertTriangle, CheckCircle,
  Lock, FileText, Shield, Loader2, Copy, ExternalLink,
  Info, ChevronRight
} from "lucide-react";

// ─── File types that CANNOT be shared via email ───────────────────────────────
const NON_SHAREABLE_EMAIL_TYPES = new Set([
  "js", "ts", "jsx", "tsx", "py", "java", "cpp", "c", "cs", "go",
  "rs", "php", "rb", "swift", "kt", "sh", "bash", "bat", "cmd",
  "ps1", "exe", "dll", "so", "dylib", "bin", "dmg", "apk", "ipa",
  "sql", "db", "sqlite", "env", "key", "pem", "cer", "crt", "p12",
  "pfx", "der", "keystore", "jks",
]);

const NON_SHAREABLE_MIMES = [
  "application/javascript",
  "application/x-python",
  "application/x-executable",
  "application/x-msdownload",
  "application/x-sh",
  "application/x-shellscript",
  "text/x-python",
  "text/x-java",
  "text/x-c",
  "text/x-c++",
  "text/x-script",
];

const checkShareable = (fileName = "", mimeType = "") => {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  const mime = mimeType.toLowerCase();
  if (NON_SHAREABLE_EMAIL_TYPES.has(ext)) return { ok: false, ext, reason: "code" };
  if (NON_SHAREABLE_MIMES.some(m => mime.includes(m.split("/")[1] || m))) return { ok: false, ext, reason: "executable" };
  return { ok: true };
};

const REASON_MESSAGES = {
  code: {
    title: "Code files can't be shared via email",
    body: "Sharing executable code or scripts via email is blocked for security reasons. Most email providers reject these attachments, and they pose potential security risks to recipients.",
    tip: "Instead, use a code hosting platform like GitHub, GitLab, or Pastebin to share code safely.",
  },
  executable: {
    title: "Executable files can't be shared via email",
    body: "Binary and executable files are blocked from email sharing to protect recipients from potential malware. Most email providers automatically reject such attachments.",
    tip: "Use a secure file transfer service or cloud storage to share executable files.",
  },
};

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// ─── Main ShareModal ─────────────────────────────────────────────────────────
export default function ShareModal({ file, onClose, isDark, vaultId, apiBaseUrl }) {
  const [emails, setEmails]         = useState([]);
  const [inputVal, setInputVal]     = useState("");
  const [inputError, setInputError] = useState("");
  const [message, setMessage]       = useState("");
  const [sending, setSending]       = useState(false);
  const [sent, setSent]             = useState(false);
  const [copied, setCopied]         = useState(false);
  const [apiError, setApiError]     = useState("");
  const inputRef = useRef(null);

  const shareCheck = checkShareable(file?.name, file?.mimeType);
  const shareLink = `${import.meta.env.VITE_APP_URL || "http://localhost:5173"}/share/${file?.id}`;

  useEffect(() => {
  
  if (!file?.id || !vaultId) {
    //console.log("Skipping - missing fileId or vaultId");
    return;
  }
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  //console.log("Token exists:", !!token);
  const url = `${apiBaseUrl}/vaults/${vaultId}/files/${file.id}/mark-shared`;
  //console.log("Fetching:", url);
  fetch(url, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    credentials: "include",
  })
  .then(r => { console.log("mark-shared status:", r.status); return r.json(); })
  .then(d => console.log("mark-shared response:", d))
  .catch(e => console.error("mark-shared error:", e));
}, [file?.id, vaultId]);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, []);

  // Close on Escape
  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const addEmail = () => {
    const val = inputVal.trim();
    if (!val) return;
    if (!validateEmail(val)) { setInputError("Enter a valid email address"); return; }
    if (emails.includes(val)) { setInputError("Already added"); return; }
    if (emails.length >= 10) { setInputError("Maximum 10 recipients"); return; }
    setEmails(prev => [...prev, val]);
    setInputVal("");
    setInputError("");
  };

  const removeEmail = (em) => setEmails(prev => prev.filter(e => e !== em));

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === "," || e.key === " ") { e.preventDefault(); addEmail(); }
    if (e.key === "Backspace" && !inputVal && emails.length) removeEmail(emails[emails.length - 1]);
  };

  const handleCopyLink = async () => {
  navigator.clipboard.writeText(shareLink);
  setCopied(true);
  setTimeout(() => setCopied(false), 2000);

  try {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    await fetch(`${apiBaseUrl}/vaults/${vaultId}/files/${file.id}/mark-shared`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    });
  } catch (e) {
    console.error("Failed to mark file as shared:", e);
  }
};

  const handleSend = async () => {
  if (!emails.length) { setInputError("Add at least one recipient"); return; }
  setSending(true);
  setApiError("");
  try {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");

    // 1. Mark file as shared so the public link works
    await fetch(
      `${apiBaseUrl || "http://localhost:5000/api"}/vaults/${vaultId}/files/${file.id}/mark-shared`,
      {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      }
    );

    // 2. Send email with share link (not the encrypted blob attachment)
    const res = await fetch(
      `${apiBaseUrl || "http://localhost:5000/api"}/vaults/${vaultId}/files/${file.id}/share`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        credentials: "include",
        body: JSON.stringify({
          recipients: emails,
          message,
          fileName: file.name,
          shareLink,  // ← pass the link so backend includes it in the email
        }),
      }
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Failed to share file");
    setSent(true);
  } catch (e) {
    setApiError(e.message);
  } finally {
    setSending(false);
  }
};

  // ── styles
  const bg      = isDark ? "bg-slate-900"       : "bg-white";
  const border  = isDark ? "border-slate-700/60" : "border-gray-200";
  const textPri = isDark ? "text-white"          : "text-gray-900";
  const textSec = isDark ? "text-gray-400"       : "text-gray-500";
  const inputBg = isDark ? "bg-slate-800 border-slate-700/60 text-white placeholder-gray-500 focus:border-cyan-500/50" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-cyan-400";
  const chipBg  = isDark ? "bg-slate-700 text-cyan-300 border-slate-600" : "bg-cyan-50 text-cyan-700 border-cyan-200";

  return (
    <AnimatePresence>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: isDark ? "rgba(0,0,0,0.75)" : "rgba(0,0,0,0.4)", backdropFilter: "blur(6px)" }}>

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 24 }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
          onClick={e => e.stopPropagation()}
          className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden ${bg} ${border}`}>

          {/* Gradient top bar */}
          <div className="h-[3px] bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600" />

          {/* ── Header ── */}
          <div className={`flex items-center justify-between px-5 py-4 border-b ${border}`}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <Share2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className={`text-sm font-bold ${textPri}`}>Share File</p>
                <p className={`text-[11px] truncate max-w-[220px] ${textSec}`}>{file?.name}</p>
              </div>
            </div>
            <button onClick={onClose}
              className={`p-1.5 rounded-xl transition-all ${isDark ? "hover:bg-slate-700 text-gray-400 hover:text-white" : "hover:bg-gray-100 text-gray-500"}`}>
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* ── Body ── */}
          <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">

            {/* ── SUCCESS STATE ── */}
            {sent ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="py-8 flex flex-col items-center gap-3 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-xl shadow-emerald-500/25">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <p className={`text-base font-bold ${textPri}`}>Shared Successfully!</p>
                <p className={`text-xs ${textSec}`}>
                  An email with a secure download link has been sent to {emails.length} recipient{emails.length !== 1 ? "s" : ""}.
                </p>
                <button onClick={onClose}
                  className="mt-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:scale-[1.02] transition-all">
                  Done
                </button>
              </motion.div>
            ) : !shareCheck.ok ? (

              /* ── NON-SHAREABLE WARNING ── */
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="space-y-4">
                <div className={`rounded-2xl border overflow-hidden ${isDark ? "bg-amber-500/5 border-amber-500/20" : "bg-amber-50 border-amber-200"}`}>
                  <div className="h-[2px] bg-gradient-to-r from-amber-400 to-orange-500" />
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                        <AlertTriangle className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className={`text-sm font-bold mb-1 ${isDark ? "text-amber-300" : "text-amber-800"}`}>
                          {REASON_MESSAGES[shareCheck.reason]?.title}
                        </p>
                        <p className={`text-xs leading-relaxed ${isDark ? "text-amber-400/80" : "text-amber-700"}`}>
                          {REASON_MESSAGES[shareCheck.reason]?.body}
                        </p>
                      </div>
                    </div>
                    <div className={`mt-3 pt-3 border-t flex items-start gap-2 ${isDark ? "border-amber-500/20" : "border-amber-200"}`}>
                      <Info className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${isDark ? "text-amber-400" : "text-amber-600"}`} />
                      <p className={`text-[11px] ${isDark ? "text-amber-400/70" : "text-amber-600/80"}`}>
                        <strong>Tip:</strong> {REASON_MESSAGES[shareCheck.reason]?.tip}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Share link only (no email) */}
                <div>
                  <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${textSec}`}>Copy Share Link Instead</p>
                  <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${isDark ? "bg-slate-800 border-slate-700" : "bg-gray-50 border-gray-200"}`}>
                    <p className={`text-[11px] font-mono flex-1 truncate ${textSec}`}>{shareLink}</p>
                    <button onClick={handleCopyLink}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all flex-shrink-0 ${
                        copied
                          ? isDark ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-600"
                          : isDark ? "bg-slate-700 border-slate-600 text-gray-300 hover:text-white" : "bg-white border-gray-200 text-gray-600 hover:text-gray-900"
                      }`}>
                      {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>

                <button onClick={onClose}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold border transition-all ${isDark ? "border-slate-700 text-gray-400 hover:bg-slate-800" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                  Close
                </button>
              </motion.div>

            ) : (

              /* ── SHARE FORM ── */
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">

                {/* Encryption notice */}
                {file?.isEncrypted && (
                  <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-xs ${isDark ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-700"}`}>
                    <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                    Recipients will receive a secure, time-limited download link. The file remains encrypted.
                  </div>
                )}

                {/* Email chips input */}
                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${textSec}`}>
                    Recipients <span className={isDark ? "text-gray-600" : "text-gray-300"}>({emails.length}/10)</span>
                  </label>
                  <div className={`flex flex-wrap gap-1.5 p-2.5 rounded-xl border transition-all min-h-[44px] ${isDark ? "bg-slate-800 border-slate-700/60 focus-within:border-cyan-500/50" : "bg-gray-50 border-gray-200 focus-within:border-cyan-400"}`}>
                    {emails.map(em => (
                      <span key={em} className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg border ${chipBg}`}>
                        {em}
                        <button onClick={() => removeEmail(em)} className="opacity-60 hover:opacity-100 transition-opacity">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    <input
                      ref={inputRef}
                      value={inputVal}
                      onChange={e => { setInputVal(e.target.value); setInputError(""); }}
                      onKeyDown={handleKeyDown}
                      onBlur={addEmail}
                      placeholder={emails.length === 0 ? "Type email and press Enter…" : "Add another…"}
                      className={`flex-1 min-w-[160px] bg-transparent outline-none text-xs ${textPri}`}
                    />
                  </div>
                  {inputError && (
                    <p className={`text-[11px] mt-1.5 flex items-center gap-1 ${isDark ? "text-red-400" : "text-red-500"}`}>
                      <AlertTriangle className="w-3 h-3" /> {inputError}
                    </p>
                  )}
                  <p className={`text-[10px] mt-1 ${textSec}`}>Separate multiple emails with Enter, comma, or space.</p>
                </div>

                {/* Optional message */}
                <div>
                  <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${textSec}`}>
                    Message <span className={isDark ? "text-gray-600" : "text-gray-300"}>(optional)</span>
                  </label>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Add a personal message for recipients…"
                    rows={3}
                    maxLength={500}
                    className={`w-full px-3 py-2.5 rounded-xl border text-xs resize-none outline-none transition-all ${inputBg}`}
                  />
                  <p className={`text-[10px] text-right mt-0.5 ${textSec}`}>{message.length}/500</p>
                </div>

                {/* Share link */}
                <div>
                  <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${textSec}`}>Or copy direct link</p>
                  <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${isDark ? "bg-slate-800 border-slate-700" : "bg-gray-50 border-gray-200"}`}>
                    <p className={`text-[11px] font-mono flex-1 truncate ${textSec}`}>{shareLink}</p>
                    <button onClick={handleCopyLink}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all flex-shrink-0 ${
                        copied
                          ? isDark ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-600"
                          : isDark ? "bg-slate-700 border-slate-600 text-gray-300 hover:text-white" : "bg-white border-gray-200 text-gray-600"
                      }`}>
                      {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>

                {apiError && (
                  <p className={`text-xs flex items-center gap-1.5 ${isDark ? "text-red-400" : "text-red-500"}`}>
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" /> {apiError}
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <button onClick={onClose}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${isDark ? "border-slate-700 text-gray-400 hover:bg-slate-800" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                    Cancel
                  </button>
                  <button onClick={handleSend} disabled={sending || !emails.length}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100">
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {sending ? "Sending…" : `Send to ${emails.length || ""} ${emails.length === 1 ? "recipient" : emails.length > 1 ? "recipients" : "recipient"}`}
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}