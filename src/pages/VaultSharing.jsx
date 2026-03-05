import { useEffect, useRef, useState, useCallback, useLayoutEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import QRCodeLib from "qrcode";
import {
  ArrowLeft, Shield, Link2, Users, Mail, Copy, Lock, Eye,
  Download, Edit, Globe, Wifi, CheckCircle, ChevronDown,
  Trash2, Clock, UserPlus, Loader2, RefreshCw, Settings,
  ExternalLink, X, QrCode, Share2, Plus, AlertCircle, Key,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useVault } from "../context/VaultContext";
import VaultTopBar from "../components/layout/VaultTopBar";
import HamburgerMenu from "../components/layout/HamburgerMenu";
import Toast from "../components/layout/Toast";
import { useToast } from "../hooks/useToast";
import { createPortal } from "react-dom";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/* ─── CustomSelect ──────────────────────────────────────────────────────────*/
const CustomSelect = ({ value, onChange, options, placeholder = "Select…", isDark, icon: IconLeft }) => {
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({});
  const triggerRef = useRef(null);

  useLayoutEffect(() => {
    if (open && triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      const ITEM_HEIGHT = 42, MAX_VISIBLE = 5, PADDING = 12, LIST_HEADER = 2;
      const spaceBelow = window.innerHeight - r.bottom - PADDING;
      const spaceAbove = r.top - PADDING;
      const naturalHeight = LIST_HEADER + options.length * ITEM_HEIGHT;
      const maxHeight = Math.min(naturalHeight, MAX_VISIBLE * ITEM_HEIGHT + LIST_HEADER);
      const openUpward = spaceBelow < maxHeight && spaceAbove > spaceBelow;
      setDropdownPos({
        position: "fixed", left: r.left, width: r.width, zIndex: 99999,
        maxHeight, overflowY: naturalHeight > maxHeight ? "auto" : "hidden",
        ...(openUpward ? { bottom: window.innerHeight - r.top + 6 } : { top: r.bottom + 6 }),
      });
    }
  }, [open, options.length]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      const portal = document.getElementById("__custom-select-portal__");
      if (portal?.contains(e.target) || triggerRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler, true);
    return () => document.removeEventListener("mousedown", handler, true);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => { window.removeEventListener("scroll", close, true); window.removeEventListener("resize", close); };
  }, [open]);

  const selectedOption = options.find((o) => o.value === value);
  const display = selectedOption ? selectedOption.label : placeholder;
  const hasValue = Boolean(selectedOption);

  return (
    <>
      <button ref={triggerRef} type="button" onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 ${isDark
          ? `bg-slate-800/60 border-slate-700/50 hover:border-cyan-500/40 ${open ? "border-cyan-500/50 ring-2 ring-cyan-500/20" : ""} ${hasValue ? "text-white" : "text-gray-500"}`
          : `bg-gray-50 border-gray-200 hover:border-cyan-400 ${open ? "border-cyan-400 ring-2 ring-cyan-500/20" : ""} ${hasValue ? "text-gray-900" : "text-gray-400"}`}`}>
        {IconLeft && <IconLeft className={`w-4 h-4 flex-shrink-0 ${isDark ? "text-gray-400" : "text-gray-500"}`} />}
        <span className="flex-1 text-left truncate">{display}</span>
        <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${isDark ? "text-gray-400" : "text-gray-500"} ${open ? "rotate-180" : ""}`} />
      </button>
      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div id="__custom-select-portal__" style={dropdownPos}
              initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }} transition={{ duration: 0.15 }}
              className={`rounded-xl border shadow-2xl ${isDark ? "bg-slate-900 border-slate-700/60" : "bg-white border-gray-200"}`}>
              <div className="h-[2px] bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 flex-shrink-0 rounded-t-xl" />
              {options.map(({ value: v, label }) => {
                const isActive = v === value;
                return (
                  <button key={v} type="button" onClick={() => { onChange(v); setOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors duration-150 flex items-center justify-between ${
                      isActive ? isDark ? "bg-cyan-500/15 text-cyan-400 font-semibold" : "bg-cyan-50 text-cyan-600 font-semibold"
                               : isDark ? "text-gray-300 hover:bg-slate-800" : "text-gray-700 hover:bg-gray-50"}`}>
                    <span>{label}</span>
                    {isActive && <CheckCircle className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

/* ─── SectionIcon ───────────────────────────────────────────────────────────*/
const SectionIcon = ({ gradient, Icon }) => (
  <div className={`w-9 h-9 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}>
    <Icon className="w-4 h-4 text-white" />
  </div>
);

/* ─── Toggle ────────────────────────────────────────────────────────────────*/
const Toggle = ({ state, onToggle, disabled }) => (
  <motion.button
    whileHover={disabled ? {} : { scale: 1.05 }} whileTap={disabled ? {} : { scale: 0.95 }}
    onClick={!disabled ? onToggle : undefined}
    className={`relative w-11 h-6 rounded-full transition-all duration-300 flex-shrink-0 ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"} ${state ? "bg-gradient-to-r from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30" : "bg-slate-700"}`}>
    <motion.div animate={{ x: state ? 22 : 3 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="absolute top-[3px] bg-white rounded-full shadow-sm" style={{ width: 18, height: 18 }} />
  </motion.button>
);

/* ─── RealQRCode ────────────────────────────────────────────────────────────*/
const RealQRCode = ({ text, size = 200, isDark, canvasRef: externalRef }) => {
  const internalRef = useRef(null);
  const canvasRef   = externalRef || internalRef;
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!text) return;
    setReady(false); setError(false);
    let cancelled = false;
    const render = async () => {
      await new Promise(r => setTimeout(r, 50));
      if (cancelled || !canvasRef.current) return;
      const canvas = canvasRef.current;
      canvas.width = size; canvas.height = size;
      canvas.style.width = `${size}px`; canvas.style.height = `${size}px`;
      try {
        await QRCodeLib.toCanvas(canvas, text, {
          width: size, margin: 1, errorCorrectionLevel: "M",
          color: { dark: isDark ? "#22d3ee" : "#0e7490", light: isDark ? "#0f172a" : "#ffffff" },
        });
        if (!cancelled) setReady(true);
      } catch { if (!cancelled) setError(true); }
    };
    render();
    return () => { cancelled = true; };
  }, [text, size, isDark]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <canvas ref={canvasRef} style={{
        width: size, height: size, borderRadius: 14, display: "block",
        background: isDark ? "#0f172a" : "#ffffff",
        boxShadow: isDark ? "0 0 0 2px rgba(34,211,238,0.35),0 8px 32px rgba(34,211,238,0.18)" : "0 0 0 2px rgba(14,116,144,0.25),0 8px 32px rgba(0,0,0,0.10)",
      }} />
      {!ready && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl gap-2" style={{ background: isDark ? "#0f172a" : "#f8fafc", zIndex: 2 }}>
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className={`text-[10px] font-medium ${isDark ? "text-gray-500" : "text-gray-400"}`}>Generating QR…</p>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl gap-2" style={{ background: isDark ? "#0f172a" : "#f8fafc", zIndex: 2 }}>
          <AlertCircle className="w-8 h-8 text-red-400" />
          <p className={`text-[10px] font-medium ${isDark ? "text-gray-500" : "text-gray-400"}`}>QR failed</p>
        </div>
      )}
    </div>
  );
};

/* ─── Time-Limited Link Modal ───────────────────────────────────────────────*/
const TimeLimitedLinkModal = ({ vaultId, isDark, onClose }) => {
  const [expiry,     setExpiry]     = useState("24 hours");
  const [link,       setLink]       = useState("");
  const [generating, setGenerating] = useState(false);
  const [copied,     setCopied]     = useState(false);

  const generateLink = async (exp = expiry) => {
    setGenerating(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res   = await fetch(`${API_BASE_URL}/vaults/${vaultId}/invite-link`, { headers: { Authorization: `Bearer ${token}` }, credentials: "include" });
      const data  = await res.json();
      const base  = data.link || `${window.location.origin}/vault/join/${vaultId}`;
      const map   = { "1 hour": "1h", "24 hours": "24h", "7 days": "7d", "30 days": "30d" };
      setLink(`${base}?expiry=${map[exp]}`);
    } catch { setLink(`${window.location.origin}/vault/join/${vaultId}?expiry=24h`); }
    finally { setGenerating(false); }
  };

  useEffect(() => { generateLink(); }, []);

  const handleExpiryChange = (v) => { setExpiry(v); generateLink(v); };
  const copyLink = () => { navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className={`rounded-2xl w-full max-w-md shadow-2xl border overflow-hidden ${isDark ? "bg-slate-900 border-cyan-500/20" : "bg-white border-cyan-500/30"}`}>
        <div className="h-[3px] bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600" />
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30"><Clock className="w-5 h-5 text-white" /></div>
              <div>
                <h2 className={`text-base font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Time-Limited Link</h2>
                <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>Share with an expiry date</p>
              </div>
            </div>
            <button onClick={onClose} className={`p-2 rounded-xl ${isDark ? "hover:bg-slate-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}><X className="w-4 h-4" /></button>
          </div>
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>Link Expires In</label>
              <CustomSelect value={expiry} onChange={handleExpiryChange}
                options={[{ value:"1 hour",label:"1 hour" },{ value:"24 hours",label:"24 hours" },{ value:"7 days",label:"7 days" },{ value:"30 days",label:"30 days" }]}
                isDark={isDark} />
            </div>
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>Shareable Link</label>
              <div className="flex gap-2">
                <div className={`flex-1 px-3 py-2.5 rounded-xl border text-xs font-mono truncate ${isDark ? "bg-slate-800/60 border-slate-700/50 text-gray-300" : "bg-gray-50 border-gray-200 text-gray-600"}`}>
                  {generating ? "Generating…" : (link || "—")}
                </div>
                <button onClick={copyLink} disabled={!link} className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg hover:scale-105 transition-transform disabled:opacity-50 flex-shrink-0">
                  {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={onClose} className={`flex-1 py-2.5 rounded-xl border font-medium text-sm transition-all ${isDark ? "bg-slate-800 border-slate-700 text-white hover:bg-slate-700" : "bg-gray-100 border-gray-200 text-gray-900 hover:bg-gray-200"}`}>Close</button>
            <button onClick={() => generateLink()} disabled={generating} className="flex-1 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-70">
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Regenerate
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ─── QR Code Modal ─────────────────────────────────────────────────────────*/
const QRCodeModal = ({ vaultId, vaultName, isDark, onClose }) => {
  const [link,       setLink]       = useState("");
  const [fetching,   setFetching]   = useState(true);
  const [copied,     setCopied]     = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const qrCanvasRef = useRef(null);

  useEffect(() => {
    const fetchLink = async () => {
      try {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        const res   = await fetch(`${API_BASE_URL}/vaults/${vaultId}/invite-link`, { headers: { Authorization: `Bearer ${token}` }, credentials: "include" });
        const data  = await res.json();
        setLink(data.link || `${window.location.origin}/vault/join/${vaultId}`);
      } catch { setLink(`${window.location.origin}/vault/join/${vaultId}`); }
      finally  { setFetching(false); }
    };
    fetchLink();
  }, [vaultId]);

  const copyLink   = () => { navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const downloadQR = () => {
    const canvas = qrCanvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `airvault-${(vaultName || "vault").replace(/\s+/g, "-")}-qr.png`;
    a.click();
    setDownloaded(true); setTimeout(() => setDownloaded(false), 2000);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className={`rounded-2xl w-full max-w-sm shadow-2xl border ${isDark ? "bg-slate-900 border-violet-500/20" : "bg-white border-violet-500/30"}`}>
        <div className="h-[3px] bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-600 rounded-t-2xl" />
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30"><QrCode className="w-5 h-5 text-white" /></div>
              <div>
                <h2 className={`text-base font-bold ${isDark ? "text-white" : "text-gray-900"}`}>QR Code</h2>
                <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>Scan to join this vault</p>
              </div>
            </div>
            <button onClick={onClose} className={`p-2 rounded-xl ${isDark ? "hover:bg-slate-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}><X className="w-4 h-4" /></button>
          </div>
          <div className={`flex flex-col items-center gap-4 p-5 rounded-2xl border mb-4 relative ${isDark ? "bg-slate-800/60 border-slate-700/50" : "bg-gray-50 border-gray-200"}`}>
            {fetching
              ? <div className="w-[220px] h-[220px] flex items-center justify-center"><Loader2 className="w-8 h-8 text-violet-400 animate-spin" /></div>
              : <RealQRCode text={link} size={220} isDark={isDark} canvasRef={qrCanvasRef} />}
            <div className="text-center">
              <p className={`text-xs font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{vaultName}</p>
              <p className={`text-[10px] mt-0.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}>Point camera or QR scanner to join</p>
            </div>
          </div>
          <div className={`flex items-center gap-2 p-2.5 rounded-xl border mb-4 ${isDark ? "bg-slate-800/60 border-slate-700/50" : "bg-gray-50 border-gray-200"}`}>
            <p className={`text-[10px] font-mono flex-1 truncate ${isDark ? "text-gray-400" : "text-gray-500"}`}>{link || "Generating…"}</p>
            <button onClick={copyLink} className={`p-1.5 rounded-lg transition-all flex-shrink-0 ${isDark ? "hover:bg-slate-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}>
              {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={copyLink} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border font-semibold text-sm transition-all ${isDark ? "bg-slate-800 border-slate-700 text-white hover:bg-slate-700" : "bg-gray-100 border-gray-200 text-gray-900 hover:bg-gray-200"}`}>
              <Copy className="w-3.5 h-3.5" />{copied ? "Copied!" : "Copy Link"}
            </button>
            <button onClick={downloadQR} disabled={fetching} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25 hover:scale-[1.02] transition-all disabled:opacity-50">
              <Download className="w-3.5 h-3.5" />{downloaded ? "Saved!" : "Save QR"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ─── Share Vault ID Modal ──────────────────────────────────────────────────*/
const VaultIDShareModal = ({ vaultId, vaultName, isDark, onClose }) => {
  const [copiedId,   setCopiedId]   = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const shareLink = `${window.location.origin}/vault/join/${vaultId}`;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className={`rounded-2xl w-full max-w-md shadow-2xl border overflow-hidden ${isDark ? "bg-slate-900 border-indigo-500/20" : "bg-white border-indigo-500/30"}`}>
        <div className="h-[3px] bg-gradient-to-r from-indigo-500 via-blue-600 to-cyan-500" />
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30"><Share2 className="w-5 h-5 text-white" /></div>
              <div>
                <h2 className={`text-base font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Share Vault Access</h2>
                <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>Share vault ID or direct link</p>
              </div>
            </div>
            <button onClick={onClose} className={`p-2 rounded-xl ${isDark ? "hover:bg-slate-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}><X className="w-4 h-4" /></button>
          </div>
          <div className={`p-4 rounded-xl border mb-4 ${isDark ? "bg-indigo-500/10 border-indigo-500/20" : "bg-indigo-50 border-indigo-200"}`}>
            <p className={`text-xs font-semibold mb-2 ${isDark ? "text-indigo-300" : "text-indigo-700"}`}>How it works</p>
            <ul className={`text-xs space-y-1 ${isDark ? "text-indigo-300/80" : "text-indigo-600"}`}>
              <li>• Share the Vault ID or link with anyone</li>
              <li>• After signing in, they get instant viewer access</li>
              <li>• Adjust their role in the Members section anytime</li>
            </ul>
          </div>
          <div className="mb-4">
            <label className={`block text-sm font-semibold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>Vault ID</label>
            <div className="flex gap-2">
              <div className={`flex-1 px-3 py-2.5 rounded-xl border font-mono text-xs truncate ${isDark ? "bg-slate-800/60 border-slate-700/50 text-gray-300" : "bg-gray-50 border-gray-200 text-gray-600"}`}>{vaultId}</div>
              <button onClick={() => { navigator.clipboard.writeText(vaultId); setCopiedId(true); setTimeout(() => setCopiedId(false), 2000); }}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-lg hover:scale-105 transition-transform flex-shrink-0">
                {copiedId ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="mb-5">
            <label className={`block text-sm font-semibold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>Direct Join Link</label>
            <div className="flex gap-2">
              <div className={`flex-1 px-3 py-2.5 rounded-xl border font-mono text-[10px] truncate ${isDark ? "bg-slate-800/60 border-slate-700/50 text-gray-300" : "bg-gray-50 border-gray-200 text-gray-600"}`}>{shareLink}</div>
              <button onClick={() => { navigator.clipboard.writeText(shareLink); setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000); }}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg hover:scale-105 transition-transform flex-shrink-0">
                {copiedLink ? <CheckCircle className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <button onClick={onClose} className={`w-full py-2.5 rounded-xl border font-medium text-sm transition-all ${isDark ? "bg-slate-800 border-slate-700 text-white hover:bg-slate-700" : "bg-gray-100 border-gray-200 text-gray-900 hover:bg-gray-200"}`}>Done</button>
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ─── Inline Role Selector ──────────────────────────────────────────────────
   A small pill-style dropdown that lets the owner change viewer ↔ editor.
   Calls PATCH /vaults/:vaultId/members/:memberId on selection.
*/
const RoleSelector = ({ vaultId, member, isDark, onChanged }) => {
  const [open,    setOpen]    = useState(false);
  const [saving,  setSaving]  = useState(false);
  const triggerRef = useRef(null);
  const dropRef    = useRef(null);

  const ROLES = [
    { value: "viewer", label: "Viewer", desc: "Can view files only",    color: isDark ? "text-amber-400" : "text-amber-600" },
    { value: "editor", label: "Editor", desc: "Can upload & edit files", color: isDark ? "text-cyan-400"  : "text-cyan-600"  },
  ];

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (!triggerRef.current?.contains(e.target) && !dropRef.current?.contains(e.target))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler, true);
    return () => document.removeEventListener("mousedown", handler, true);
  }, [open]);

  const handleSelect = async (newRole) => {
    if (newRole === member.role) { setOpen(false); return; }
    setSaving(true);
    setOpen(false);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/vaults/${vaultId}/members/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        credentials: "include",
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) { onChanged(null, data.message || "Failed to update role"); return; }
      onChanged(newRole);
    } catch { onChanged(null, "Network error"); }
    finally { setSaving(false); }
  };

  const current = ROLES.find(r => r.value === member.role) || ROLES[0];

  return (
    <div className="relative flex-shrink-0">
      <button ref={triggerRef} onClick={() => !saving && setOpen(v => !v)} disabled={saving}
        className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold capitalize transition-all duration-200 ${
          member.role === "editor"
            ? isDark ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:border-cyan-400" : "bg-cyan-50 border-cyan-300 text-cyan-600 hover:border-cyan-400"
            : isDark ? "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:border-amber-400" : "bg-amber-50 border-amber-300 text-amber-600 hover:border-amber-400"
        } disabled:opacity-60 disabled:cursor-not-allowed`}>
        {saving
          ? <Loader2 className="w-2.5 h-2.5 animate-spin" />
          : <>{current.label}<ChevronDown className={`w-2.5 h-2.5 transition-transform ${open ? "rotate-180" : ""}`} /></>}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div ref={dropRef}
            initial={{ opacity: 0, y: -4, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }} transition={{ duration: 0.12 }}
            className={`absolute right-0 top-full mt-1.5 w-40 rounded-xl border shadow-xl z-50 overflow-hidden ${isDark ? "bg-slate-900 border-slate-700/60" : "bg-white border-gray-200"}`}>
            <div className="h-[2px] bg-gradient-to-r from-cyan-500 to-indigo-600" />
            {ROLES.map(role => (
              <button key={role.value} onClick={() => handleSelect(role.value)}
                className={`w-full text-left px-3 py-2.5 transition-colors duration-150 flex items-start gap-2 ${
                  role.value === member.role
                    ? isDark ? "bg-slate-800/80" : "bg-gray-50"
                    : isDark ? "hover:bg-slate-800" : "hover:bg-gray-50"
                }`}>
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-semibold flex items-center gap-1.5 ${role.color}`}>
                    {role.label}
                    {role.value === member.role && <CheckCircle className="w-3 h-3" />}
                  </div>
                  <div className={`text-[10px] ${isDark ? "text-gray-500" : "text-gray-400"}`}>{role.desc}</div>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════ */
const VaultSharing = () => {
  const navigate        = useNavigate();
  const { isDark }      = useTheme();
  const { activeVault, updateMemberRole } = useVault();
  const { toast, showSuccess, showError, hideToast } = useToast();

  const [mousePosition,   setMousePosition]   = useState({ x: 0, y: 0 });
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const SIDEBAR_COLLAPSED = 60, SIDEBAR_EXPANDED = 220;
  const sidebarW = sidebarExpanded ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED;

  const [members,        setMembers]        = useState([]);
  const [security,       setSecurity]       = useState({ blockAllDownloads: false, deviceRestricted: false, isLocked: false });
  const [inviteLink,     setInviteLink]     = useState("");
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [savingSecurity, setSavingSecurity] = useState(false);
  const [sendingInvite,  setSendingInvite]  = useState(false);
  const [copyLinkState,  setCopyLinkState]  = useState(false);
  const [revokingId,     setRevokingId]     = useState(null);

  const [inviteEmail,   setInviteEmail]   = useState("");
  const [inviteRole,    setInviteRole]    = useState("viewer");
  const [inviteMessage, setInviteMessage] = useState("");

  const [showTimedModal,   setShowTimedModal]   = useState(false);
  const [showQRModal,      setShowQRModal]      = useState(false);
  const [showVaultIDModal, setShowVaultIDModal] = useState(false);

  useEffect(() => {
    const h = (e) => setSidebarExpanded(e.detail.expanded);
    window.addEventListener("sidebarToggle", h);
    return () => window.removeEventListener("sidebarToggle", h);
  }, []);

  useEffect(() => {
    const h = (e) => setMousePosition({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", h);
    return () => window.removeEventListener("mousemove", h);
  }, []);

  const token       = localStorage.getItem("token") || sessionStorage.getItem("token");
  const authHeaders = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const fetchMembers = useCallback(async () => {
    if (!activeVault?.id) return;
    setLoadingMembers(true);
    try {
      const res  = await fetch(`${API_BASE_URL}/vaults/${activeVault.id}/members`, { headers: authHeaders, credentials: "include" });
      const data = await res.json();
      if (res.ok) { setMembers(data.members || []); if (data.security) setSecurity(data.security); }
    } catch (e) { console.error("Fetch members:", e); }
    finally { setLoadingMembers(false); }
  }, [activeVault?.id]);

  const fetchInviteLink = useCallback(async () => {
    if (!activeVault?.id) return;
    try {
      const res  = await fetch(`${API_BASE_URL}/vaults/${activeVault.id}/invite-link`, { headers: authHeaders, credentials: "include" });
      const data = await res.json();
      if (res.ok) setInviteLink(data.link || `${window.location.origin}/vault/join/${activeVault.id}`);
    } catch { setInviteLink(`${window.location.origin}/vault/join/${activeVault.id}`); }
  }, [activeVault?.id]);

  // ── Owner guard — show message then redirect viewers ─────────────────────
  const [accessChecked, setAccessChecked] = useState(false);
  const [accessDenied,  setAccessDenied]  = useState(false);

  useEffect(() => {
    if (!activeVault?.id) return;
    const tok = localStorage.getItem("token") || sessionStorage.getItem("token");
    fetch(`${API_BASE_URL}/vaults/${activeVault.id}`, {
      headers: { Authorization: `Bearer ${tok}` }, credentials: "include",
    })
      .then(r => r.json())
      .then(data => {
        if (!data?.vault?.isOwner) {
          setAccessDenied(true);
          setTimeout(() => navigate("/maindashboard", { replace: true }), 3000);
        } else {
          setAccessChecked(true);
        }
      })
      .catch(() => {
        setAccessDenied(true);
        setTimeout(() => navigate("/maindashboard", { replace: true }), 3000);
      });
  }, [activeVault?.id, navigate]);

  useEffect(() => { if (accessChecked) { fetchMembers(); fetchInviteLink(); } }, [accessChecked, fetchMembers, fetchInviteLink]);

  // ── Role change handler ──────────────────────────────────────────────────
  const handleRoleChange = (memberId, newRole, errorMsg) => {
    if (errorMsg) { showError(errorMsg); return; }
    // Update local members list immediately
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m));
    // Also update shared vault context so the card badge stays in sync
    updateMemberRole(activeVault.id, memberId, newRole);
    showSuccess(`Role updated to ${newRole}.`);
  };

  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) { showError("Enter a recipient email."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)) { showError("Enter a valid email address."); return; }
    setSendingInvite(true);
    try {
      const res  = await fetch(`${API_BASE_URL}/vaults/${activeVault.id}/members`, {
        method: "POST", headers: authHeaders, credentials: "include",
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole, message: inviteMessage || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { showError(data.message || "Failed to send invite."); return; }
      showSuccess(`Invitation sent to ${inviteEmail}.`);
      setInviteEmail(""); setInviteMessage("");
      fetchMembers();
    } catch { showError("Network error. Please try again."); }
    finally { setSendingInvite(false); }
  };

  const handleRevokeMember = async (memberId) => {
    setRevokingId(memberId);
    try {
      const res  = await fetch(`${API_BASE_URL}/vaults/${activeVault.id}/members/${memberId}`, { method: "DELETE", headers: authHeaders, credentials: "include" });
      if (!res.ok) { const d = await res.json(); showError(d.message || "Failed to revoke access."); return; }
      setMembers(prev => prev.filter(m => m.id !== memberId));
      showSuccess("Member access revoked.");
    } catch { showError("Network error."); }
    finally { setRevokingId(null); }
  };

  const handleSaveSecurity = async (patch) => {
    setSavingSecurity(true);
    try {
      const res  = await fetch(`${API_BASE_URL}/vaults/${activeVault.id}/security`, {
        method: "PATCH", headers: authHeaders, credentials: "include",
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) { showError(data.message || "Failed to update security settings."); return; }
      setSecurity(data.security || { ...security, ...patch });
      showSuccess("Security settings updated.");
    } catch { showError("Network error."); }
    finally { setSavingSecurity(false); }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink || `${window.location.origin}/vault/join/${activeVault?.id}`);
      setCopyLinkState(true); showSuccess("Invite link copied.");
      setTimeout(() => setCopyLinkState(false), 2000);
    } catch { showError("Unable to copy link."); }
  };

  const card     = `rounded-2xl border backdrop-blur-xl shadow-xl transition-all duration-300 ${isDark ? "bg-slate-800/50 border-slate-700/50" : "bg-white/80 border-gray-200"}`;
  const inputCls = `w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${isDark ? "bg-slate-800/60 border-slate-700/50 text-white placeholder:text-gray-500 focus:border-cyan-500/50 focus:ring-cyan-500/20" : "bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-cyan-400 focus:ring-cyan-500/20"}`;
  const innerRow = `p-4 rounded-xl border ${isDark ? "bg-slate-900/50 border-slate-700/50" : "bg-gray-50 border-gray-200"}`;

  // Show access-denied message before redirecting
  if (accessDenied) {
    return (
      <div className={`min-h-screen w-full flex items-center justify-center ${isDark ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" : "bg-gradient-to-br from-gray-50 via-white to-gray-100"}`}>
        <div className={`max-w-sm w-full mx-4 rounded-2xl border shadow-2xl overflow-hidden ${isDark ? "bg-slate-800/80 border-slate-700/60" : "bg-white border-gray-200"}`}>
          <div className="h-[3px] bg-gradient-to-r from-red-500 via-rose-500 to-pink-500" />
          <div className="p-8 text-center">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 ${isDark ? "bg-red-500/10 border border-red-500/20" : "bg-red-50 border border-red-100"}`}>
              <Shield className="w-8 h-8 text-red-400" />
            </div>
            <h2 className={`text-lg font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>
              Access Restricted
            </h2>
            <p className={`text-sm mb-4 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              The <span className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>Sharing</span> page is only accessible to the vault owner.
            </p>
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs ${isDark ? "bg-amber-500/10 border-amber-500/20 text-amber-300" : "bg-amber-50 border-amber-200 text-amber-700"}`}>
              <Lock className="w-3.5 h-3.5 flex-shrink-0" />
              Redirecting you to dashboard…
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Still verifying ownership — render nothing to prevent flash of content
  if (!accessChecked && activeVault) return null;

  if (!activeVault) return (
    <div className={`h-screen w-full flex items-center justify-center ${isDark ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" : "bg-gradient-to-br from-gray-50 via-white to-gray-100"}`}>
      <div className="text-center px-6">
        <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-cyan-500/30"><Shield className="w-10 h-10 text-white" /></div>
        <p className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>No vault selected</p>
        <p className={`text-sm mt-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>Select a vault to manage sharing.</p>
        <button onClick={() => navigate("/vaults")} className="mt-6 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white font-semibold shadow-lg hover:scale-[1.03] transition-all duration-300">Go to Vaults</button>
      </div>
    </div>
  );

  return (
    <div className={`h-screen w-full overflow-hidden transition-colors duration-500 ${isDark ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" : "bg-gradient-to-br from-gray-50 via-white to-gray-100"}`}>

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-1/4 -left-1/4 w-96 h-96 ${isDark ? "bg-cyan-500/5" : "bg-cyan-500/3"} rounded-full blur-3xl animate-pulse`} />
        <div className={`absolute bottom-1/4 -right-1/4 w-96 h-96 ${isDark ? "bg-blue-600/5" : "bg-blue-600/3"} rounded-full blur-3xl animate-pulse`} style={{ animationDelay: "1s" }} />
        <div className={`absolute top-1/2 left-1/2 w-96 h-96 ${isDark ? "bg-indigo-500/3" : "bg-indigo-500/2"} rounded-full blur-3xl animate-pulse`} style={{ animationDelay: "0.5s" }} />
      </div>

      <div className="hidden lg:block fixed w-80 h-80 rounded-full pointer-events-none z-0 mix-blend-screen"
        style={{
          background: isDark ? "radial-gradient(circle, rgba(56,189,248,0.07) 0%, transparent 70%)" : "radial-gradient(circle, rgba(56,189,248,0.05) 0%, transparent 70%)",
          left: mousePosition.x - 160, top: mousePosition.y - 160, transition: "all 0.4s ease-out",
        }} />

      <VaultTopBar />
      <HamburgerMenu />
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} duration={toast.duration} />}

      <motion.main initial={false} animate={{ marginLeft: sidebarW }} transition={{ type: "spring", damping: 24, stiffness: 280 }}
        className="relative z-10 flex h-[calc(100vh-4rem)] mt-16">
        <div className="flex-1 overflow-y-auto vault-scrollbar">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

            {/* Page heading */}
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <button onClick={() => navigate(`/vault/${activeVault.id}`)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all duration-200 self-start ${isDark ? "bg-slate-800/50 border-slate-700/50 text-gray-300 hover:text-white hover:border-cyan-500/40" : "bg-white/80 border-gray-200 text-gray-600 hover:border-cyan-400"}`}>
                  <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </button>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-semibold self-start sm:self-auto ${isDark ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-600"}`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Access logging enabled
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/30 hover:rotate-6 hover:scale-110 transition-all duration-500 cursor-default flex-shrink-0">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className={`text-3xl lg:text-4xl font-bold tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>Vault Sharing</h1>
                  <p className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                    Manage who can access <span className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>{activeVault.name}</span>
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">

              {/* ─── LEFT col ─── */}
              <div className="lg:col-span-2 space-y-5 sm:space-y-6">

                {/* Smart Sharing */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className={card}>
                  <div className="h-[2px] bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 overflow-hidden rounded-t-2xl" />
                  <div className="p-5 sm:p-6">
                    <h2 className={`text-sm sm:text-base font-bold mb-5 flex items-center gap-2.5 ${isDark ? "text-white" : "text-gray-900"}`}>
                      <SectionIcon gradient="from-cyan-500 to-blue-600" Icon={Share2} /> Smart Sharing
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                      {[
                        { Icon: Clock,  title: "Time-Limited Links", desc: "Links that expire automatically",   gradient: "from-cyan-500 to-blue-600",    label: "Generate Link", onClick: () => setShowTimedModal(true)   },
                        { Icon: QrCode, title: "QR Codes",           desc: "Share via scannable QR",           gradient: "from-violet-500 to-purple-600", label: "Create QR",     onClick: () => setShowQRModal(true)      },
                        { Icon: Share2, title: "Share Vault ID",     desc: "Share vault ID for direct access", gradient: "from-indigo-500 to-blue-600",   label: "Share ID",      onClick: () => setShowVaultIDModal(true) },
                      ].map(({ Icon, title, desc, gradient, label, onClick }, i) => (
                        <motion.div key={i} whileHover={{ y: -3 }}
                          className={`group relative rounded-xl p-4 border transition-all duration-500 overflow-hidden cursor-pointer ${isDark ? "bg-slate-900/50 border-slate-700/50 hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/10" : "bg-gray-50 border-gray-200 hover:border-cyan-500/40 hover:shadow-lg"}`}
                          onClick={onClick}>
                          <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                          <div className="relative">
                            <div className={`inline-flex bg-gradient-to-br ${gradient} w-10 h-10 rounded-xl items-center justify-center mb-3 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            <h3 className={`font-semibold text-sm mb-1 ${isDark ? "text-white" : "text-gray-900"}`}>{title}</h3>
                            <p className={`text-xs mb-3 ${isDark ? "text-gray-400" : "text-gray-500"}`}>{desc}</p>
                            <button className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r ${gradient} text-white shadow-md hover:scale-105 transition-all duration-300`}>
                              <Plus className="w-3 h-3" />{label}
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Invite by Email */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={card}>
                  <div className="h-[2px] bg-gradient-to-r from-violet-500 via-purple-600 to-indigo-600 overflow-hidden rounded-t-2xl" />
                  <div className="p-5 sm:p-6">
                    <h2 className={`text-sm sm:text-base font-bold mb-5 flex items-center gap-2.5 ${isDark ? "text-white" : "text-gray-900"}`}>
                      <SectionIcon gradient="from-violet-500 to-purple-600" Icon={UserPlus} /> Invite by Email
                    </h2>
                    <div className="space-y-4">
                      <div>
                        <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Recipient Email</label>
                        <div className="relative">
                          <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                          <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSendInvite()}
                            placeholder="colleague@company.com" className={`${inputCls} pl-10`} />
                        </div>
                      </div>
                      <div>
                        <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Role</label>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { id: "viewer", label: "Viewer", Icon: Eye,  desc: "Can view files only" },
                            { id: "editor", label: "Editor", Icon: Edit, desc: "Can upload & edit"   },
                          ].map(({ id, label, Icon, desc }) => (
                            <button key={id} onClick={() => setInviteRole(id)}
                              className={`flex flex-col items-center gap-1.5 px-3 py-3.5 rounded-xl border text-xs font-semibold transition-all duration-200 ${
                                inviteRole === id
                                  ? "bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border-cyan-500/50 text-cyan-400 shadow-lg shadow-cyan-500/10"
                                  : isDark ? "bg-slate-900/50 border-slate-700/50 text-gray-400 hover:border-slate-600" : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300"
                              }`}>
                              <Icon className="w-4 h-4" />
                              <span>{label}</span>
                              <span className={`text-[10px] font-normal ${isDark ? "text-gray-500" : "text-gray-400"}`}>{desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                          Personal Message <span className={`normal-case font-normal ${isDark ? "text-gray-600" : "text-gray-400"}`}>(optional)</span>
                        </label>
                        <textarea value={inviteMessage} onChange={(e) => setInviteMessage(e.target.value)}
                          placeholder="Add a note to the invite email…" rows={2} className={`${inputCls} resize-none`} />
                      </div>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={handleSendInvite} disabled={sendingInvite || !inviteEmail.trim()}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                        {sendingInvite ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                        {sendingInvite ? "Sending…" : "Send Invitation"}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>

                {/* Share Link */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className={card}>
                  <div className="h-[2px] bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 overflow-hidden rounded-t-2xl" />
                  <div className="p-5 sm:p-6">
                    <h2 className={`text-sm sm:text-base font-bold mb-5 flex items-center gap-2.5 ${isDark ? "text-white" : "text-gray-900"}`}>
                      <SectionIcon gradient="from-cyan-500 to-blue-600" Icon={Link2} /> Share Link
                    </h2>
                    <div className={`${innerRow} mb-4`}>
                      <p className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Join link</p>
                      <p className={`text-xs font-mono break-all mb-3 ${isDark ? "text-gray-300" : "text-gray-600"}`}>{inviteLink || `${window.location.origin}/vault/join/${activeVault.id}`}</p>
                      <p className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>Anyone with this link gets instant viewer access after signing in.</p>
                    </div>
                    <div className="flex gap-3">
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleCopyLink}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all duration-300">
                        {copyLinkState ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copyLinkState ? "Copied!" : "Copy Link"}
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={fetchInviteLink}
                        className={`px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${isDark ? "bg-slate-800 border-slate-700 text-gray-300 hover:border-cyan-500/40" : "bg-gray-100 border-gray-200 text-gray-700 hover:border-cyan-400"}`}>
                        <RefreshCw className="w-4 h-4" /> Regenerate
                      </motion.button>
                    </div>
                  </div>
                </motion.div>

                {/* Vault Security */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={card}>
                  <div className="h-[2px] bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 overflow-hidden rounded-t-2xl" />
                  <div className="p-5 sm:p-6">
                    <div className="mb-5">
                      <h2 className={`text-sm sm:text-base font-bold flex items-center gap-2.5 ${isDark ? "text-white" : "text-gray-900"}`}>
                        <SectionIcon gradient="from-red-500 to-orange-600" Icon={Shield} /> Vault Security
                      </h2>
                      <p className={`text-xs mt-2 ml-11 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Vault-wide restrictions applied to all members.</p>
                    </div>
                    <div className="space-y-3">
                      {[
                        { Icon: Download, gradient: "from-violet-500 to-purple-600", title: "Block All Downloads",  desc: "Prevent any member from downloading files",                                              key: "blockAllDownloads", disabled: false },
                        { Icon: Globe,    gradient: "from-cyan-500 to-teal-600",     title: "Device Restrictions",  desc: "Restrict vault access to registered devices only",                                      key: "deviceRestricted",  disabled: false },
                        { Icon: Lock,     gradient: "from-red-500 to-rose-600",      title: "Lock Vault",           desc: activeVault.hasPassword ? "Lock — members must re-authenticate" : "Set a password first to enable locking", key: "isLocked", disabled: !activeVault.hasPassword },
                      ].map(({ Icon, gradient, title, desc, key, disabled }) => (
                        <div key={key} className={`flex items-center justify-between gap-4 p-4 rounded-xl border transition-all duration-300 ${
                          disabled ? isDark ? "bg-slate-900/30 border-slate-700/30 opacity-50" : "bg-gray-50/50 border-gray-100 opacity-50"
                          : security[key] ? isDark ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-50 border-amber-200"
                          : isDark ? "bg-slate-900/50 border-slate-700/50" : "bg-gray-50 border-gray-200"
                        }`}>
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-9 h-9 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}>
                              <Icon className="w-4 h-4 text-white" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className={`font-semibold text-sm ${isDark ? "text-white" : "text-gray-900"}`}>{title}</p>
                                {security[key] && !disabled && (
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${isDark ? "bg-amber-500/20 text-amber-400" : "bg-amber-100 text-amber-700"}`}>Active</span>
                                )}
                              </div>
                              <p className={`text-xs truncate ${isDark ? "text-gray-400" : "text-gray-500"}`}>{desc}</p>
                            </div>
                          </div>
                          <Toggle state={security[key] || false} onToggle={() => !disabled && handleSaveSecurity({ [key]: !security[key] })} disabled={disabled} />
                        </div>
                      ))}
                    </div>
                    {savingSecurity && (
                      <div className="flex items-center gap-2 mt-3 text-xs text-cyan-400">
                        <Loader2 className="w-3 h-3 animate-spin" /> Saving…
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Access Log link */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={() => navigate(`/vault/${activeVault.id}/access-log`)}
                    className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl border font-semibold text-sm transition-all duration-300 ${isDark ? "bg-slate-800/50 border-slate-700/50 text-white hover:border-cyan-500/40 hover:bg-slate-800/70" : "bg-white/80 border-gray-200 text-gray-900 hover:border-cyan-500/40 hover:bg-white"}`}>
                    <div className="flex items-center gap-3">
                      <SectionIcon gradient="from-emerald-500 to-teal-600" Icon={Wifi} />
                      <div className="text-left">
                        <p>View Access Log</p>
                        <p className={`text-xs font-normal ${isDark ? "text-gray-400" : "text-gray-500"}`}>See who accessed this vault and when</p>
                      </div>
                    </div>
                    <ExternalLink className={`w-4 h-4 ${isDark ? "text-gray-400" : "text-gray-500"}`} />
                  </motion.button>
                </motion.div>
              </div>

              {/* ─── RIGHT sidebar ─── */}
              <div className="space-y-5 sm:space-y-6">

                {/* Members list — with inline role selector */}
                <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className={card}>
                  <div className="h-[2px] bg-gradient-to-r from-blue-600 to-indigo-600 overflow-hidden rounded-t-2xl" />
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className={`text-sm font-bold flex items-center gap-2.5 ${isDark ? "text-white" : "text-gray-900"}`}>
                        <SectionIcon gradient="from-blue-600 to-indigo-600" Icon={Users} /> Members
                      </h3>
                      <div className="flex items-center gap-2">
                        {loadingMembers && <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />}
                        {!loadingMembers && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${isDark ? "bg-slate-700 text-gray-300" : "bg-gray-100 text-gray-600"}`}>{members.length}</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 max-h-96 overflow-y-auto vault-scrollbar pr-1">
                      {loadingMembers ? (
                        <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 text-cyan-400 animate-spin" /></div>
                      ) : members.length === 0 ? (
                        <p className={`text-xs text-center py-6 ${isDark ? "text-gray-500" : "text-gray-400"}`}>No members yet</p>
                      ) : members.map((member, idx) => (
                        <motion.div key={member.id || member.email}
                          initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                          className={`group flex items-center justify-between gap-2 p-3 rounded-xl border transition-all duration-300 ${isDark ? "bg-slate-900/50 border-slate-700/50 hover:border-cyan-500/30" : "bg-gray-50 border-gray-200 hover:border-cyan-300"}`}>

                          {/* Avatar + name */}
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {(member.name || member.email || "?").substring(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className={`text-xs font-semibold truncate ${isDark ? "text-white" : "text-gray-900"}`}>
                                {member.isOwner ? `${member.name} (You)` : (member.name || member.email?.split("@")[0])}
                              </p>
                              <p className={`text-[10px] truncate ${isDark ? "text-gray-400" : "text-gray-500"}`}>{member.email}</p>
                            </div>
                          </div>

                          {/* Right side: role pill (clickable for non-owners) + pending badge + delete */}
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {member.status === "pending" && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold border ${isDark ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-amber-50 text-amber-600 border-amber-200"}`}>Pending</span>
                            )}

                            {/* Owner badge — not changeable */}
                            {member.isOwner ? (
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${isDark ? "bg-violet-500/10 text-violet-400" : "bg-violet-50 text-violet-600"}`}>Owner</span>
                            ) : (
                              /* Inline role selector for non-owner members */
                              <RoleSelector
                                vaultId={activeVault.id}
                                member={member}
                                isDark={isDark}
                                onChanged={(newRole, err) => handleRoleChange(member.id, newRole, err)}
                              />
                            )}

                            {/* Delete (non-owners only) */}
                            {!member.isOwner && (
                              <button onClick={() => handleRevokeMember(member.id)} disabled={revokingId === member.id}
                                className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 disabled:opacity-50 ${isDark ? "text-red-400 hover:bg-red-500/20" : "text-red-500 hover:bg-red-50"}`}>
                                {revokingId === member.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {members.filter(m => !m.isOwner).length > 0 && (
                      <button onClick={() => navigate(`/vault/${activeVault.id}/members`)}
                        className={`mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-xl border text-xs font-semibold transition-all duration-200 ${isDark ? "bg-slate-900/50 border-slate-700/50 text-gray-300 hover:border-cyan-500/30 hover:text-cyan-400" : "bg-gray-50 border-gray-200 text-gray-600 hover:border-cyan-400 hover:text-cyan-600"}`}>
                        <Settings className="w-3.5 h-3.5" /> Manage Permissions
                      </button>
                    )}
                  </div>
                </motion.div>

                {/* Vault info */}
                <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className={card}>
                  <div className="h-[2px] bg-gradient-to-r from-emerald-500 to-teal-600 overflow-hidden rounded-t-2xl" />
                  <div className="p-5">
                    <div className="flex items-center gap-2.5 mb-4">
                      <SectionIcon gradient="from-emerald-500 to-teal-600" Icon={Shield} />
                      <p className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Vault Info</p>
                    </div>
                    <div className="space-y-2.5">
                      {[
                        { label: "Vault Name", value: activeVault.name },
                        { label: "Protection", value: activeVault.hasPassword ? "Password Protected" : "No Password" },
                        { label: "Encryption", value: "AES-256-GCM" },
                        { label: "Members",    value: `${members.length} user${members.length !== 1 ? "s" : ""}` },
                      ].map(({ label, value }) => (
                        <div key={label} className={`flex items-center justify-between text-xs py-2 border-b last:border-0 ${isDark ? "border-slate-700/40" : "border-gray-100"}`}>
                          <span className={isDark ? "text-gray-400" : "text-gray-500"}>{label}</span>
                          <span className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* ZK notice */}
                <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}
                  className={`rounded-2xl border backdrop-blur-xl shadow-xl ${isDark ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-50 border-amber-200"}`}>
                  <div className="h-[2px] bg-gradient-to-r from-amber-500 to-orange-500 overflow-hidden rounded-t-2xl" />
                  <div className="p-5">
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                        <Key className="w-4 h-4 text-white" />
                      </div>
                      <p className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Zero-Knowledge Notice</p>
                    </div>
                    <p className={`text-xs leading-relaxed ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      {activeVault.hasPassword
                        ? "Invited users must know the vault password to decrypt files. The server never stores encryption keys — share the password securely."
                        : "This vault uses a device-stored key. Invited viewers can see file names but cannot decrypt contents without the encryption key."
                      }
                    </p>
                  </div>
                </motion.div>
              </div>

            </div>
          </div>
        </div>
      </motion.main>

      <AnimatePresence>
        {showTimedModal   && <TimeLimitedLinkModal vaultId={activeVault?.id} isDark={isDark} onClose={() => setShowTimedModal(false)} />}
        {showQRModal      && <QRCodeModal vaultId={activeVault?.id} vaultName={activeVault?.name} isDark={isDark} onClose={() => setShowQRModal(false)} />}
        {showVaultIDModal && <VaultIDShareModal vaultId={activeVault?.id} vaultName={activeVault?.name} isDark={isDark} onClose={() => setShowVaultIDModal(false)} />}
      </AnimatePresence>

      <style>{`
        .vault-scrollbar::-webkit-scrollbar { width: 4px; }
        .vault-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .vault-scrollbar::-webkit-scrollbar-thumb { background: rgba(6,182,212,0.4); border-radius: 2px; }
        .vault-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(6,182,212,0.65); }
      `}</style>
    </div>
  );
};

export default VaultSharing;