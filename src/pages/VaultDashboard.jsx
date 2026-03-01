import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock, Eye, Share2, QrCode, Trash2, Search, Grid3X3, List,
  AlertTriangle, CheckCircle, Clock, AlertCircle, Activity, Plus,
  Copy, X, Shield, FileText, Database, TrendingUp, FileImage,
  FileJson, FileSpreadsheet, Archive, Download, Upload, LogIn,
  UserCheck, RefreshCw, Zap, Video, Music, Code, File, ChevronDown,
  ExternalLink, Folder, Settings, Users, Link2, Loader2, FolderOpen,
} from "lucide-react";
import { useVault } from "../context/VaultContext";
import { useTheme } from "../context/ThemeContext";
import HamburgerMenu from "../components/layout/HamburgerMenu";
import VaultTopBar from "../components/layout/VaultTopBar";
import { vaultApi } from "../services/vaultApi";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/* ─── DonutChart ─── */
const DonutChart = ({ segments, size = 120, stroke = 18, isDark }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const cx = size / 2, cy = size / 2;
  const [tooltip, setTooltip] = useState(null);
  let offset = 0;
  const arcs = segments.map((s, i) => {
    const dash = (s.pct / 100) * circ;
    const gap  = circ - dash;
    const startOffset = offset;
    offset += dash;
    return { ...s, dash, gap, startOffset, i };
  });
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={cx} cy={cy} r={r} fill="none"
          stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}
          strokeWidth={stroke} />
        {arcs.map(({ dash, gap, startOffset, color, label, pct, count, i }) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={color} strokeWidth={stroke + 2}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-startOffset}
            strokeLinecap="round"
            className="cursor-pointer"
            style={{ transition: "stroke-dasharray 1s ease, stroke-width 0.2s" }}
            onMouseEnter={() => setTooltip({ label, pct, count, color })}
            onMouseLeave={() => setTooltip(null)}
          />
        ))}
      </svg>
      <AnimatePresence>
        {tooltip && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }} transition={{ duration: 0.15 }}
            className={`absolute left-1/2 -translate-x-1/2 -top-12 z-50 px-3 py-1.5 rounded-xl border shadow-2xl text-xs font-semibold whitespace-nowrap pointer-events-none ${isDark ? "bg-slate-900 border-slate-700/60 text-white" : "bg-white border-gray-200 text-gray-900"}`}
          >
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: tooltip.color }} />
              <span>{tooltip.label}</span>
              <span className={`font-normal ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                · {tooltip.count} files · {tooltip.pct.toFixed(0)}%
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─── SparkBar ─── */
const SparkBar = ({ data, color }) => {
  const max  = Math.max(...data, 1);
  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const [tooltip, setTooltip] = useState(null);
  return (
    <div className="relative">
      <div className="flex items-end gap-0.5 h-8">
        {data.map((v, i) => (
          <motion.div key={i}
            initial={{ height: 0 }} animate={{ height: `${(v / max) * 100}%` }}
            transition={{ delay: i * 0.05, duration: 0.5, ease: "easeOut" }}
            className="flex-1 rounded-sm cursor-pointer"
            style={{ background: color, opacity: tooltip?.i === i ? 1 : 0.5 + (i / data.length) * 0.5 }}
            onMouseEnter={() => setTooltip({ i, v, day: days[i] })}
            onMouseLeave={() => setTooltip(null)}
          />
        ))}
      </div>
      <AnimatePresence>
        {tooltip && (
          <motion.div
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
            className="absolute -top-8 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700/60 text-white text-[10px] font-semibold whitespace-nowrap pointer-events-none z-50 shadow-xl"
            style={{ left: `${(tooltip.i / data.length) * 100}%` }}
          >
            {tooltip.day}: {tooltip.v} uploads
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─── StorageBar ─── */
const StorageBar = ({ type, size, total, color, isDark }) => {
  const [hovered, setHovered] = useState(false);
  const pct = (size / total) * 100;
  return (
    <div className="relative" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
            className={`absolute -top-8 left-0 z-50 px-2.5 py-1 rounded-lg border shadow-xl text-[10px] font-semibold whitespace-nowrap pointer-events-none ${isDark ? "bg-slate-900 border-slate-700/60 text-white" : "bg-white border-gray-200 text-gray-900"}`}
          >
            {type}: {(size / 1024 / 1024).toFixed(2)} MB ({pct.toFixed(1)}%)
          </motion.div>
        )}
      </AnimatePresence>
      <div className={`h-1.5 rounded-full overflow-hidden ${isDark ? "bg-slate-700" : "bg-gray-100"}`}>
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${Math.min(pct * 4, 100)}%` }}
          transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
          className="h-full rounded-full" style={{ background: color }}
        />
      </div>
    </div>
  );
};

/* ─── CustomSelect ─── */
const CustomSelect = ({ value, onChange, options, isDark }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 ${isDark
          ? `bg-slate-800/60 border-slate-700/50 text-white hover:border-cyan-500/40 ${open ? "border-cyan-500/50 ring-2 ring-cyan-500/20" : ""}`
          : `bg-gray-50 border-gray-200 text-gray-900 hover:border-cyan-400 ${open ? "border-cyan-400 ring-2 ring-cyan-500/20" : ""}`
        }`}>
        <span>{value}</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 flex-shrink-0 ${isDark ? "text-gray-400" : "text-gray-500"} ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }} transition={{ duration: 0.15 }}
            className={`absolute z-50 w-full mt-1.5 rounded-xl border shadow-2xl overflow-hidden ${isDark ? "bg-slate-900 border-slate-700/60" : "bg-white border-gray-200"}`}
          >
            <div className="h-[2px] bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600" />
            {options.map(opt => (
              <button key={opt} type="button" onClick={() => { onChange(opt); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors duration-150 flex items-center justify-between ${
                  opt === value
                    ? isDark ? "bg-cyan-500/15 text-cyan-400 font-semibold" : "bg-cyan-50 text-cyan-600 font-semibold"
                    : isDark ? "text-gray-300 hover:bg-slate-800" : "text-gray-700 hover:bg-gray-50"
                }`}>
                {opt}
                {opt === value && <CheckCircle className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─── File type config ─── */
const getFileTypeConfig = (type) => {
  const MAP = {
    PDF:          { Icon: FileText,        gradient: "from-red-500 to-rose-600",        bg: "bg-red-500/10",      border: "border-red-500/20",      text: "text-red-400",     color: "#f87171" },
    Image:        { Icon: FileImage,       gradient: "from-violet-500 to-purple-600",   bg: "bg-violet-500/10",   border: "border-violet-500/20",   text: "text-violet-400",  color: "#a78bfa" },
    JSON:         { Icon: FileJson,        gradient: "from-amber-500 to-orange-600",    bg: "bg-amber-500/10",    border: "border-amber-500/20",    text: "text-amber-400",   color: "#fbbf24" },
    Excel:        { Icon: FileSpreadsheet, gradient: "from-emerald-500 to-teal-600",    bg: "bg-emerald-500/10",  border: "border-emerald-500/20",  text: "text-emerald-400", color: "#34d399" },
    Archive:      { Icon: Archive,         gradient: "from-cyan-500 to-blue-600",       bg: "bg-cyan-500/10",     border: "border-cyan-500/20",     text: "text-cyan-400",    color: "#22d3ee" },
    Video:        { Icon: Video,           gradient: "from-pink-500 to-rose-600",       bg: "bg-pink-500/10",     border: "border-pink-500/20",     text: "text-pink-400",    color: "#f472b6" },
    Audio:        { Icon: Music,           gradient: "from-lime-500 to-green-600",      bg: "bg-lime-500/10",     border: "border-lime-500/20",     text: "text-lime-400",    color: "#a3e635" },
    Code:         { Icon: Code,            gradient: "from-sky-500 to-cyan-600",        bg: "bg-sky-500/10",      border: "border-sky-500/20",      text: "text-sky-400",     color: "#38bdf8" },
    Word:         { Icon: FileText,        gradient: "from-blue-500 to-indigo-600",     bg: "bg-blue-500/10",     border: "border-blue-500/20",     text: "text-blue-400",    color: "#60a5fa" },
    Spreadsheet:  { Icon: FileSpreadsheet, gradient: "from-green-500 to-emerald-600",   bg: "bg-green-500/10",    border: "border-green-500/20",    text: "text-green-400",   color: "#4ade80" },
    Presentation: { Icon: FileText,        gradient: "from-orange-500 to-amber-600",    bg: "bg-orange-500/10",   border: "border-orange-500/20",   text: "text-orange-400",  color: "#fb923c" },
    Text:         { Icon: FileText,        gradient: "from-gray-500 to-slate-600",      bg: "bg-gray-500/10",     border: "border-gray-500/20",     text: "text-gray-400",    color: "#94a3b8" },
  };
  return MAP[type] || { Icon: File, gradient: "from-slate-500 to-gray-600", bg: "bg-slate-500/10", border: "border-slate-500/20", text: "text-slate-400", color: "#94a3b8" };
};

const getMimeLabel = (mimeType = "", name = "") => {
  const ext  = (name.split(".").pop() || "").toLowerCase();
  const mime = mimeType.toLowerCase();
  if (mime.includes("pdf") || ext === "pdf") return "PDF";
  if (mime.startsWith("image/")) return "Image";
  if (mime.startsWith("video/")) return "Video";
  if (mime.startsWith("audio/")) return "Audio";
  if (mime.includes("zip") || mime.includes("archive") || ["zip","tar","gz","rar","7z"].includes(ext)) return "Archive";
  if (mime.includes("word") || ["doc","docx"].includes(ext)) return "Word";
  if (mime.includes("spreadsheet") || mime.includes("excel") || ["xls","xlsx","csv","numbers"].includes(ext)) return "Excel";
  if (mime.includes("presentation") || mime.includes("powerpoint") || ["ppt","pptx","key"].includes(ext)) return "Presentation";
  if (mime.startsWith("text/") || ["txt","md","log"].includes(ext)) return "Text";
  if (["js","ts","jsx","tsx","py","java","cpp","c","cs","go","rs","php","rb","sh","sql","json"].includes(ext)) return "Code";
  return "File";
};

const formatBytes = (bytes) => {
  if (!bytes || bytes <= 0) return "0 B";
  const k = 1024, s = ["B","KB","MB","GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(i ? 1 : 0)} ${s[i]}`;
};

/* ─── Real QR Code via qrcode npm CDN ─── */
const loadQRLib = () =>
  new Promise((resolve) => {
    if (window.__qrcodeLib) { resolve(window.__qrcodeLib); return; }
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js";
    s.onload = () => { window.__qrcodeLib = window.QRCode; resolve(window.__qrcodeLib); };
    s.onerror = () => resolve(null);
    document.head.appendChild(s);
  });

const RealQRCode = ({ text, size = 200, isDark, canvasRef: externalRef }) => {
  const internalRef = useRef(null);
  const canvasRef   = externalRef || internalRef;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!text) return;
    setReady(false);
    let cancelled = false;
    loadQRLib().then((QRCode) => {
      if (cancelled || !QRCode || !canvasRef.current) return;
      const canvas = canvasRef.current;
      canvas.width  = size * 2;
      canvas.height = size * 2;
      canvas.style.width  = `${size}px`;
      canvas.style.height = `${size}px`;
      QRCode.toCanvas(canvas, text, {
        width: size * 2,
        margin: 2,
        color: {
          dark:  isDark ? "#22d3ee" : "#0e7490",
          light: isDark ? "#0f172a" : "#ffffff",
        },
        errorCorrectionLevel: "M",
      }).then(() => { if (!cancelled) setReady(true); });
    });
    return () => { cancelled = true; };
  }, [text, size, isDark]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          background: isDark
            ? "radial-gradient(ellipse at center, rgba(34,211,238,0.15) 0%, transparent 70%)"
            : "radial-gradient(ellipse at center, rgba(14,116,144,0.08) 0%, transparent 70%)",
          zIndex: 0,
        }}
      />
      <canvas
        ref={canvasRef}
        id="qr-canvas-el"
        style={{
          width: size, height: size,
          borderRadius: 14,
          position: "relative", zIndex: 1,
          boxShadow: isDark
            ? "0 0 0 2px rgba(34,211,238,0.3), 0 8px 32px rgba(34,211,238,0.15)"
            : "0 0 0 2px rgba(14,116,144,0.2), 0 8px 32px rgba(0,0,0,0.08)",
          display: "block",
        }}
      />
      {!ready && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl gap-2"
          style={{ background: isDark ? "#0f172a" : "#f8fafc", zIndex: 2 }}
        >
          <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
          <p className={`text-[10px] font-medium ${isDark ? "text-gray-500" : "text-gray-400"}`}>Generating QR…</p>
        </div>
      )}
    </div>
  );
};

/* ─── Time-Limited Link Modal ─── */
const TimeLimitedLinkModal = ({ vaultId, isDark, onClose }) => {
  const [expiry, setExpiry] = useState("24 hours");
  const [permissions, setPermissions] = useState({ view: true, download: false });
  const [link, setLink] = useState("");
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateLink = async () => {
    setGenerating(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/vaults/${vaultId}/invite-link`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      const data = await res.json();
      const baseLink = data.link || `${window.location.origin}/vault/join/${vaultId}`;
      const expiryMap = { "1 hour": "1h", "24 hours": "24h", "7 days": "7d", "30 days": "30d" };
      setLink(`${baseLink}?expiry=${expiryMap[expiry]}&view=${permissions.view}&dl=${permissions.download}`);
    } catch {
      setLink(`${window.location.origin}/vault/join/${vaultId}?expiry=24h`);
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => { generateLink(); }, []);

  const copyLink = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className={`rounded-2xl w-full max-w-md shadow-2xl border overflow-hidden ${isDark ? "bg-slate-900 border-cyan-500/20" : "bg-white border-cyan-500/30"}`}>
        <div className="h-[3px] bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600" />
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className={`text-base font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Time-Limited Link</h2>
                <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>Share with an expiry date</p>
              </div>
            </div>
            <button onClick={onClose} className={`p-2 rounded-xl ${isDark ? "hover:bg-slate-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}>
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>Link Expires In</label>
              <CustomSelect value={expiry} onChange={setExpiry}
                options={["1 hour", "24 hours", "7 days", "30 days"]} isDark={isDark} />
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>Permissions</label>
              <div className="space-y-2">
                {[
                  { key: "view", label: "View Files", desc: "Recipient can browse vault files" },
                  { key: "download", label: "Allow Download", desc: "Recipient can download files" },
                ].map(p => (
                  <label key={p.key} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all ${isDark ? "bg-slate-800/50 border-slate-700/40 hover:border-cyan-500/30" : "bg-gray-50 border-gray-200 hover:border-cyan-500/30"}`}>
                    <input type="checkbox" checked={permissions[p.key]}
                      onChange={e => setPermissions({ ...permissions, [p.key]: e.target.checked })}
                      className="w-4 h-4 accent-cyan-500" />
                    <div>
                      <p className={`font-semibold text-sm ${isDark ? "text-white" : "text-gray-900"}`}>{p.label}</p>
                      <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>{p.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>Shareable Link</label>
              <div className="flex gap-2">
                <div className={`flex-1 px-3 py-2.5 rounded-xl border text-xs font-mono truncate ${isDark ? "bg-slate-800/60 border-slate-700/50 text-gray-300" : "bg-gray-50 border-gray-200 text-gray-600"}`}>
                  {generating ? "Generating..." : (link || "—")}
                </div>
                <button onClick={copyLink} disabled={!link}
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg hover:scale-105 transition-transform disabled:opacity-50 flex-shrink-0">
                  {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button onClick={onClose} className={`flex-1 py-2.5 rounded-xl border font-medium text-sm transition-all ${isDark ? "bg-slate-800 border-slate-700 text-white hover:bg-slate-700" : "bg-gray-100 border-gray-200 text-gray-900 hover:bg-gray-200"}`}>
              Close
            </button>
            <button onClick={generateLink} disabled={generating}
              className="flex-1 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-lg hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-70">
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Regenerate
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ─── QR Code Modal ─── */
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
        const res = await fetch(`${API_BASE_URL}/vaults/${vaultId}/invite-link`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        });
        const data = await res.json();
        setLink(data.link || `${window.location.origin}/vault/join/${vaultId}`);
      } catch {
        setLink(`${window.location.origin}/vault/join/${vaultId}`);
      } finally {
        setFetching(false);
      }
    };
    fetchLink();
  }, [vaultId]);

  const copyLink = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQR = () => {
    // qrCanvasRef points directly to the <canvas id="qr-canvas-el">
    const canvas = qrCanvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.href     = canvas.toDataURL("image/png");
    a.download = `airvault-${(vaultName || "vault").replace(/\s+/g, "-")}-qr.png`;
    a.click();
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className={`rounded-2xl w-full max-w-sm shadow-2xl border overflow-hidden ${isDark ? "bg-slate-900 border-violet-500/20" : "bg-white border-violet-500/30"}`}>
        <div className="h-[3px] bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-600" />
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30">
                <QrCode className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className={`text-base font-bold ${isDark ? "text-white" : "text-gray-900"}`}>QR Code</h2>
                <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>Scan to join this vault</p>
              </div>
            </div>
            <button onClick={onClose} className={`p-2 rounded-xl ${isDark ? "hover:bg-slate-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}>
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* QR display area */}
          <div className={`flex flex-col items-center gap-4 p-6 rounded-2xl border mb-4 relative overflow-hidden ${isDark ? "bg-slate-800/60 border-slate-700/50" : "bg-gray-50 border-gray-200"}`}>
            {/* Corner accents */}
            {["top-0 left-0", "top-0 right-0", "bottom-0 left-0", "bottom-0 right-0"].map((pos, i) => (
              <div key={i} className={`absolute ${pos} w-5 h-5`}>
                <div className={`w-full h-full ${
                  pos.includes("right") && pos.includes("bottom") ? "border-b-2 border-r-2 rounded-br-lg" :
                  pos.includes("right") ? "border-t-2 border-r-2 rounded-tr-lg" :
                  pos.includes("bottom") ? "border-b-2 border-l-2 rounded-bl-lg" :
                  "border-t-2 border-l-2 rounded-tl-lg"
                } border-violet-500/50`} />
              </div>
            ))}

            {fetching ? (
              <div className="w-[200px] h-[200px] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
              </div>
            ) : (
              <RealQRCode text={link} size={200} isDark={isDark} canvasRef={qrCanvasRef} />
            )}

            <div className="text-center">
              <p className={`text-xs font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{vaultName}</p>
              <p className={`text-[10px] mt-0.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}>Point camera or QR scanner to join</p>
            </div>
          </div>

          {/* Link row */}
          <div className={`flex items-center gap-2 p-2.5 rounded-xl border mb-4 ${isDark ? "bg-slate-800/60 border-slate-700/50" : "bg-gray-50 border-gray-200"}`}>
            <p className={`text-[10px] font-mono flex-1 truncate ${isDark ? "text-gray-400" : "text-gray-500"}`}>{link || "Generating..."}</p>
            <button onClick={copyLink} className={`p-1.5 rounded-lg transition-all flex-shrink-0 ${isDark ? "hover:bg-slate-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}>
              {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <button onClick={copyLink}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border font-semibold text-sm transition-all ${isDark ? "bg-slate-800 border-slate-700 text-white hover:bg-slate-700" : "bg-gray-100 border-gray-200 text-gray-900 hover:bg-gray-200"}`}>
              <Copy className="w-3.5 h-3.5" />
              {copied ? "Copied!" : "Copy Link"}
            </button>
            <button onClick={downloadQR} disabled={fetching}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25 hover:scale-[1.02] hover:shadow-violet-500/40 transition-all disabled:opacity-50">
              <Download className="w-3.5 h-3.5" />
              {downloaded ? "Saved!" : "Save QR"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ─── Vault ID Share Modal ─── */
const VaultIDShareModal = ({ vaultId, vaultName, isDark, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [copyLink, setCopyLink] = useState(false);
  const shareLink = `${window.location.origin}/vault/join/${vaultId}`;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className={`rounded-2xl w-full max-w-md shadow-2xl border overflow-hidden ${isDark ? "bg-slate-900 border-indigo-500/20" : "bg-white border-indigo-500/30"}`}>
        <div className="h-[3px] bg-gradient-to-r from-indigo-500 via-blue-600 to-cyan-500" />
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Share2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className={`text-base font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Share Vault Access</h2>
                <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>Share vault ID or link</p>
              </div>
            </div>
            <button onClick={onClose} className={`p-2 rounded-xl ${isDark ? "hover:bg-slate-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}>
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* How it works */}
          <div className={`p-4 rounded-xl border mb-4 ${isDark ? "bg-indigo-500/10 border-indigo-500/20" : "bg-indigo-50 border-indigo-200"}`}>
            <p className={`text-xs font-semibold mb-2 ${isDark ? "text-indigo-300" : "text-indigo-700"}`}>How it works</p>
            <ul className={`text-xs space-y-1 ${isDark ? "text-indigo-300/80" : "text-indigo-600"}`}>
              <li>• Share the Vault ID or link below with anyone</li>
              <li>• If they're not registered, they'll be prompted to sign up first</li>
              <li>• After signup/login, the shared vault appears in their vault selector</li>
              <li>• They'll have viewer access by default (you can change this in Permissions)</li>
            </ul>
          </div>

          {/* Vault ID */}
          <div className="mb-4">
            <label className={`block text-sm font-semibold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>Vault ID</label>
            <div className="flex gap-2">
              <div className={`flex-1 px-3 py-2.5 rounded-xl border font-mono text-xs truncate ${isDark ? "bg-slate-800/60 border-slate-700/50 text-gray-300" : "bg-gray-50 border-gray-200 text-gray-600"}`}>
                {vaultId}
              </div>
              <button onClick={() => { navigator.clipboard.writeText(vaultId); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-lg hover:scale-105 transition-transform flex-shrink-0">
                {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Full link */}
          <div className="mb-6">
            <label className={`block text-sm font-semibold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}>Direct Join Link</label>
            <div className="flex gap-2">
              <div className={`flex-1 px-3 py-2.5 rounded-xl border font-mono text-[10px] truncate ${isDark ? "bg-slate-800/60 border-slate-700/50 text-gray-300" : "bg-gray-50 border-gray-200 text-gray-600"}`}>
                {shareLink}
              </div>
              <button onClick={() => { navigator.clipboard.writeText(shareLink); setCopyLink(true); setTimeout(() => setCopyLink(false), 2000); }}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg hover:scale-105 transition-transform flex-shrink-0">
                {copyLink ? <CheckCircle className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className={`flex items-center gap-3 p-3 rounded-xl border text-xs mb-4 ${isDark ? "bg-amber-500/10 border-amber-500/20 text-amber-300" : "bg-amber-50 border-amber-200 text-amber-700"}`}>
            <Shield className="w-4 h-4 flex-shrink-0" />
            <span>The vault is password-protected. Recipients will need the vault password to access encrypted files.</span>
          </div>

          <button onClick={onClose} className={`w-full py-2.5 rounded-xl border font-medium text-sm transition-all ${isDark ? "bg-slate-800 border-slate-700 text-white hover:bg-slate-700" : "bg-gray-100 border-gray-200 text-gray-900 hover:bg-gray-200"}`}>
            Done
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ══════════════════════════════════════════════════════ MAIN ══ */
const VaultDashboard = () => {
  const { activeVault } = useVault();
  const { isDark }      = useTheme();
  const navigate        = useNavigate();

  const [viewMode,       setViewMode]       = useState("grid");
  const [searchQuery,    setSearchQuery]    = useState("");
  const [hoveredFileId,  setHoveredFileId]  = useState(null);
  const [mousePosition,  setMousePosition]  = useState({ x: 0, y: 0 });
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  // Backend data
  const [files,         setFiles]         = useState([]);
  const [alerts,        setAlerts]        = useState([]);
  const [stats,         setStats]         = useState(null);
  const [loadingFiles,  setLoadingFiles]  = useState(true);
  const [loadingStats,  setLoadingStats]  = useState(true);
  const [deletingId,    setDeletingId]    = useState(null);

  // Sharing modals
  const [showTimedModal,   setShowTimedModal]   = useState(false);
  const [showQRModal,      setShowQRModal]       = useState(false);
  const [showVaultIDModal, setShowVaultIDModal]  = useState(false);

  const SIDEBAR_COLLAPSED = 60;
  const SIDEBAR_EXPANDED  = 220;
  const sidebarW = sidebarExpanded ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED;

  useEffect(() => {
    const h = e => setMousePosition({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", h);
    return () => window.removeEventListener("mousemove", h);
  }, []);

  useEffect(() => {
    const h = e => setSidebarExpanded(e.detail.expanded);
    window.addEventListener("sidebarToggle", h);
    return () => window.removeEventListener("sidebarToggle", h);
  }, []);

  // ── Fetch files from backend ──────────────────────────────────
  const fetchFiles = useCallback(async () => {
    if (!activeVault?.id) return;
    setLoadingFiles(true);
    try {
      const data = await vaultApi.getVaultFiles(activeVault.id);
      const enriched = (data?.files || []).map(f => ({
        ...f,
        type: getMimeLabel(f.mimeType, f.name),
        sv: f.size / 1024 / 1024,
        uploadDate: f.uploadedAt ? new Date(f.uploadedAt).toISOString().split("T")[0] : "—",
        encrypted: f.isEncrypted || false,
        size: formatBytes(f.size),
        rawSize: f.size,
      }));
      setFiles(enriched);
    } catch (err) {
      console.error("Failed to fetch files:", err);
    } finally {
      setLoadingFiles(false);
    }
  }, [activeVault?.id]);

  // ── Fetch dashboard stats ──────────────────────────────────────
  const fetchStats = useCallback(async () => {
    if (!activeVault?.id) return;
    setLoadingStats(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    } finally {
      setLoadingStats(false);
    }
  }, [activeVault?.id]);

  // ── Fetch access log for alerts ────────────────────────────────
  const fetchAlerts = useCallback(async () => {
    if (!activeVault?.id) return;
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/vaults/${activeVault.id}/access-log?limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        const mappedAlerts = (data.logs || []).slice(0, 6).map((l, i) => ({
          id: i + 1,
          type: l.status === "blocked" ? "suspicious" : "normal",
          message: l.action + (l.file && l.file !== "—" ? ` — ${l.file}` : ""),
          time: formatTimeAgo(l.time),
        }));
        setAlerts(mappedAlerts.length > 0 ? mappedAlerts : getDefaultAlerts());
      }
    } catch {
      setAlerts(getDefaultAlerts());
    }
  }, [activeVault?.id]);

  useEffect(() => {
    if (activeVault?.id) {
      fetchFiles();
      fetchStats();
      fetchAlerts();
    }
  }, [activeVault?.id, fetchFiles, fetchStats, fetchAlerts]);

  const getDefaultAlerts = () => [
    { id: 1, type: "normal", message: "Vault accessed successfully", time: "Just now" },
    { id: 2, type: "normal", message: "Vault backup completed", time: "1 hr ago" },
  ];

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return "—";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hr ago`;
    return `${Math.floor(hrs / 24)} days ago`;
  };

  // ── Delete file ───────────────────────────────────────────────
  const handleDeleteFile = async (fileId) => {
    if (!activeVault?.id) return;
    setDeletingId(fileId);
    try {
      await vaultApi.deleteVaultFile(activeVault.id, fileId);
      setFiles(prev => prev.filter(f => f.id !== fileId));
      fetchStats();
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeletingId(null);
    }
  };

  // ── Computed values ───────────────────────────────────────────
  const filteredFiles = files.filter(f => f.name?.toLowerCase().includes(searchQuery.toLowerCase()));

  const vaultStats = stats?.vaults?.find(v => v.id === activeVault?.id);
  const totalSizeMB = vaultStats?.storageUsedMB || files.reduce((s, f) => s + (f.sv || 0), 0);
  const STORAGE_LIMIT_MB = 500;

  const typeCounts = Object.entries(files.reduce((acc, f) => { acc[f.type] = (acc[f.type] || 0) + 1; return acc; }, {}));
  const donutSegments = typeCounts.map(([type, count]) => ({
    pct: (count / Math.max(files.length, 1)) * 100, color: getFileTypeConfig(type).color, label: type, count,
  }));
  const storageByType = Object.entries(
    files.reduce((acc, f) => { acc[f.type] = (acc[f.type] || 0) + (f.rawSize || 0); return acc; }, {})
  ).sort((a, b) => b[1] - a[1]);

  // Weekly uploads from recent activity
  const weeklyUploads = (() => {
    if (!stats?.recentActivity) return [2, 5, 3, 8, 4, 7, 5];
    const days = new Array(7).fill(0);
    const now = Date.now();
    stats.recentActivity.forEach(a => {
      const diff = Math.floor((now - new Date(a.timestamp).getTime()) / (1000 * 60 * 60 * 24));
      if (diff >= 0 && diff < 7) days[6 - diff]++;
    });
    return days;
  })();

  const statCards = [
    { label: "Total Files",  value: loadingStats ? "…" : (vaultStats?.fileCount ?? files.length),                              Icon: FileText, color: "from-cyan-500 to-blue-600",     bar: Math.min(((vaultStats?.fileCount ?? files.length) / 20) * 100, 100) },
    { label: "Storage Used", value: loadingStats ? "…" : `${totalSizeMB.toFixed(1)} MB`,                                      Icon: Database, color: "from-blue-600 to-indigo-600",   bar: (totalSizeMB / STORAGE_LIMIT_MB) * 100 },
    { label: "Shared Files", value: loadingStats ? "…" : (stats?.totals?.shared ?? files.filter(f => f.shared).length),        Icon: Share2,   color: "from-indigo-500 to-violet-600", bar: ((stats?.totals?.shared ?? files.filter(f => f.shared).length) / Math.max(files.length, 1)) * 100 },
    { label: "Security",     value: "98%",                                                                                     Icon: Shield,   color: "from-emerald-500 to-teal-600",  bar: 98 },
    { label: "Total Views",  value: loadingStats ? "…" : (stats?.totals?.views ?? files.reduce((s, f) => s + (f.views || 0), 0)), Icon: Eye,  color: "from-violet-500 to-purple-600", bar: 55 },
  ];

  const activityFeed = (stats?.recentActivity || []).slice(0, 7).map((a, i) => ({
    id: i + 1,
    action: a.type === "upload" ? "File uploaded" : a.label,
    file: a.label?.replace("Uploaded \"", "").replace("\"", "") || "—",
    user: "You",
    time: formatTimeAgo(a.timestamp),
    Icon: a.type === "upload" ? Upload : Activity,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
  }));

  if (!activeVault) return (
    <div className={`min-h-screen w-full flex items-center justify-center ${isDark ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" : "bg-gradient-to-br from-gray-50 via-white to-gray-100"}`}>
      <div className="text-center px-4">
        <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-cyan-500/30">
          <Shield className="w-10 h-10 text-white" />
        </div>
        <p className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>No vault selected</p>
        <p className={`text-sm mt-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>Select or create a vault to continue</p>
      </div>
    </div>
  );

  const card = `rounded-2xl border backdrop-blur-xl shadow-xl transition-all duration-300 ${isDark ? "bg-slate-800/50 border-slate-700/50" : "bg-white/80 border-gray-200"}`;
  const sectionIcon = (gradient, Icon) => (
    <div className={`w-9 h-9 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}>
      <Icon className="w-4 h-4 text-white" />
    </div>
  );

  return (
    <div className={`h-screen w-full overflow-hidden transition-colors duration-500 ${isDark ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" : "bg-gradient-to-br from-gray-50 via-white to-gray-100"}`}>

      {/* Ambient blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-1/4 -left-1/4 w-96 h-96 ${isDark ? "bg-cyan-500/5" : "bg-cyan-500/3"} rounded-full blur-3xl animate-pulse`} />
        <div className={`absolute bottom-1/4 -right-1/4 w-96 h-96 ${isDark ? "bg-blue-600/5" : "bg-blue-600/3"} rounded-full blur-3xl animate-pulse`} style={{ animationDelay: "1s" }} />
        <div className={`absolute top-1/2 left-1/2 w-96 h-96 ${isDark ? "bg-indigo-500/3" : "bg-indigo-500/2"} rounded-full blur-3xl animate-pulse`} style={{ animationDelay: "0.5s" }} />
      </div>

      {/* Cursor glow */}
      <div className="hidden lg:block fixed w-80 h-80 rounded-full pointer-events-none z-0 mix-blend-screen"
        style={{
          background: isDark ? "radial-gradient(circle, rgba(56,189,248,0.07) 0%, transparent 70%)" : "radial-gradient(circle, rgba(56,189,248,0.05) 0%, transparent 70%)",
          left: mousePosition.x - 160, top: mousePosition.y - 160, transition: "all 0.4s ease-out",
        }} />

      <VaultTopBar />
      <HamburgerMenu />

      {/* ══ MAIN ══ */}
      <motion.main
        initial={false}
        animate={{ marginLeft: sidebarW }}
        transition={{ type: "spring", damping: 24, stiffness: 280 }}
        className="relative z-10 flex h-[calc(100vh-4rem)] mt-16"
      >
        <div className="flex-1 overflow-y-auto vault-scrollbar">
          <div className="max-w-[1600px] mx-auto px-3 sm:px-5 lg:px-6 py-5 sm:py-8 space-y-5 sm:space-y-6">

            {/* Page heading */}
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/30 hover:rotate-6 hover:scale-110 transition-all duration-500 cursor-default flex-shrink-0">
                    <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>
                      {activeVault?.name} <span className="hidden sm:inline">Dashboard</span>
                    </h1>
                    <p className={`text-xs sm:text-sm mt-0.5 ${isDark ? "text-gray-400" : "text-gray-600"}`}>Manage your encrypted files securely</p>
                  </div>
                </div>
                <div className={`sm:hidden self-start flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${isDark ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-300" : "bg-cyan-500/10 border-cyan-500/30 text-cyan-700"}`}>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {activeVault?.name}
                </div>
              </div>
            </motion.div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {statCards.map(({ label, value, Icon, color, bar }, i) => (
                <motion.div key={label}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.4 }} whileHover={{ y: -4 }}
                  className={`group relative rounded-2xl p-4 sm:p-5 border backdrop-blur-sm overflow-hidden cursor-default transition-all duration-300 ${isDark ? "bg-slate-800/50 border-slate-700/50 hover:border-cyan-500/40 hover:shadow-xl hover:shadow-cyan-500/10" : "bg-white/80 border-gray-200 hover:border-cyan-500/40 hover:shadow-xl hover:shadow-cyan-500/10"}`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                  <div className="relative">
                    <div className="flex items-start justify-between mb-2 sm:mb-3">
                      <div className={`inline-flex bg-gradient-to-br ${color} w-9 h-9 sm:w-11 sm:h-11 rounded-xl items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <TrendingUp className={`w-3 h-3 sm:w-4 sm:h-4 opacity-30 ${isDark ? "text-gray-400" : "text-gray-500"}`} />
                    </div>
                    <p className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mb-0.5 sm:mb-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>{label}</p>
                    <p className={`text-lg sm:text-2xl font-bold bg-gradient-to-r ${color} bg-clip-text text-transparent`}>{value}</p>
                    <div className={`mt-2 sm:mt-3 h-1 rounded-full overflow-hidden ${isDark ? "bg-slate-700" : "bg-gray-200"}`}>
                      <motion.div
                        initial={{ width: 0 }} animate={{ width: `${Math.min(bar || 0, 100)}%` }}
                        transition={{ duration: 1.2, delay: i * 0.1, ease: "easeOut" }}
                        className={`h-full rounded-full bg-gradient-to-r ${color}`}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* ROW A */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 items-start">

              {/* Storage column */}
              <div className="flex flex-col gap-4 sm:gap-5">

                {/* Storage Usage */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
                  className={`${card} p-5 flex flex-col`} style={{ height: "340px" }}>
                  <div className="flex items-center justify-between mb-4 flex-shrink-0">
                    <h2 className={`text-sm sm:text-base font-bold flex items-center gap-2.5 ${isDark ? "text-white" : "text-gray-900"}`}>
                      {sectionIcon("from-blue-600 to-indigo-600", Database)} Storage Usage
                    </h2>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${isDark ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
                      {totalSizeMB.toFixed(1)} / {STORAGE_LIMIT_MB} MB
                    </span>
                  </div>
                  <div className="mb-4 flex-shrink-0">
                    <div className="flex justify-between mb-1.5">
                      <span className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>Used</span>
                      <span className={`text-xs font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                        {((totalSizeMB / STORAGE_LIMIT_MB) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className={`h-3 rounded-full overflow-hidden ${isDark ? "bg-slate-700" : "bg-gray-200"}`}>
                      <motion.div
                        initial={{ width: 0 }} animate={{ width: `${Math.min((totalSizeMB / STORAGE_LIMIT_MB) * 100, 100)}%` }}
                        transition={{ duration: 1.4, ease: "easeOut" }}
                        className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 relative overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                      </motion.div>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto vault-scrollbar pr-1 min-h-0">
                    <div className="space-y-3">
                      {storageByType.map(([type, size]) => {
                        const ft = getFileTypeConfig(type);
                        return (
                          <div key={type}>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ft.color }} />
                                <span className={`text-xs font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>{type}</span>
                              </div>
                              <span className={`text-[11px] ${isDark ? "text-gray-400" : "text-gray-500"}`}>{formatBytes(size)}</span>
                            </div>
                            <StorageBar type={type} size={size} total={STORAGE_LIMIT_MB * 1024 * 1024} color={ft.color} isDark={isDark} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>

                {/* Weekly Uploads */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
                  className={`${card} p-5 flex-shrink-0`}>
                  <div className="flex items-center gap-2.5 mb-4">
                    {sectionIcon("from-cyan-500 to-teal-600", Activity)}
                    <span className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Weekly Uploads</span>
                  </div>
                  <SparkBar data={weeklyUploads} color="#22d3ee" />
                  <div className="flex justify-between mt-2">
                    {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => (
                      <span key={d} className={`text-[9px] ${isDark ? "text-gray-600" : "text-gray-400"}`}>{d}</span>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* File Breakdown Donut */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}
                className={`${card} p-5`}>
                <div className="flex items-center justify-between mb-5">
                  <h2 className={`text-sm sm:text-base font-bold flex items-center gap-2.5 ${isDark ? "text-white" : "text-gray-900"}`}>
                    {sectionIcon("from-violet-500 to-purple-600", FileText)} File Breakdown
                  </h2>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${isDark ? "bg-violet-500/10 text-violet-400" : "bg-violet-50 text-violet-600"}`}>
                    {files.length} total
                  </span>
                </div>
                <div className="flex flex-col items-center gap-5">
                  <div className="relative flex-shrink-0">
                    {files.length === 0 ? (
                      <div className={`w-[140px] h-[140px] rounded-full border-4 flex items-center justify-center ${isDark ? "border-slate-700" : "border-gray-200"}`}>
                        <p className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>No files</p>
                      </div>
                    ) : (
                      <>
                        <DonutChart segments={donutSegments} size={140} stroke={22} isDark={isDark} />
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{files.length}</span>
                          <span className={`text-[10px] ${isDark ? "text-gray-400" : "text-gray-500"}`}>Files</span>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="w-full grid grid-cols-2 gap-2 max-h-48 overflow-y-auto vault-scrollbar">
                    {donutSegments.map((s, i) => {
                      const ft = getFileTypeConfig(s.label);
                      const FIcon = ft.Icon;
                      return (
                        <div key={i} className={`flex items-center gap-2.5 p-2.5 rounded-xl border ${isDark ? "bg-slate-700/30 border-slate-700/50" : "bg-gray-50 border-gray-100"}`}>
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: s.color + "22" }}>
                            <FIcon className="w-3.5 h-3.5" style={{ color: s.color }} />
                          </div>
                          <div className="min-w-0">
                            <p className={`text-[11px] font-semibold truncate ${isDark ? "text-white" : "text-gray-900"}`}>{s.label}</p>
                            <p className={`text-[10px] ${isDark ? "text-gray-400" : "text-gray-500"}`}>{s.count} · {s.pct.toFixed(0)}%</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>

              {/* Activity Feed */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className={`${card} p-5 md:col-span-2 xl:col-span-1`}>
                <div className="flex items-center justify-between mb-5">
                  <h2 className={`text-sm sm:text-base font-bold flex items-center gap-2.5 ${isDark ? "text-white" : "text-gray-900"}`}>
                    {sectionIcon("from-cyan-500 to-teal-600", Activity)} Recent Activity
                  </h2>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className={`text-[10px] font-semibold ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>Live</span>
                  </div>
                </div>
                <div className="space-y-1 max-h-[340px] overflow-y-auto vault-scrollbar pr-1">
                  {activityFeed.length > 0 ? activityFeed.map((item, i) => (
                    <motion.div key={item.id}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.06 }}
                      className={`flex items-start gap-3 p-3 rounded-xl transition-all duration-200 ${isDark ? "hover:bg-slate-700/40" : "hover:bg-gray-50"}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${item.bg}`}>
                        <item.Icon className={`w-3.5 h-3.5 ${item.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>{item.action}</p>
                        <p className={`text-[11px] truncate ${isDark ? "text-gray-400" : "text-gray-500"}`}>{item.file}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[10px] ${isDark ? "text-gray-500" : "text-gray-400"}`}>{item.user}</span>
                          <span className={`text-[10px] ${isDark ? "text-gray-600" : "text-gray-300"}`}>·</span>
                          <span className={`text-[10px] ${isDark ? "text-gray-500" : "text-gray-400"}`}>{item.time}</span>
                        </div>
                      </div>
                    </motion.div>
                  )) : (
                    <div className="text-center py-10">
                      <Activity className={`w-8 h-8 mx-auto mb-2 opacity-30 ${isDark ? "text-gray-400" : "text-gray-500"}`} />
                      <p className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>No recent activity</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* ROW B */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-5">
              <div className="xl:col-span-8 space-y-4 sm:space-y-5">

                {/* Search + view toggle */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}
                  className="flex gap-2 sm:gap-3">
                  <div className="flex-1 relative">
                    <Search className={`absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-gray-400" : "text-gray-500"}`} />
                    <input type="text" placeholder="Search files…" value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className={`w-full pl-9 sm:pl-11 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-all ${isDark ? "bg-slate-800/50 border-slate-700/50 text-white placeholder-gray-500 hover:border-cyan-500/30" : "bg-white/80 border-gray-200 text-gray-900 placeholder-gray-400 hover:border-cyan-500/40"}`}
                    />
                  </div>
                  {[{ mode: "grid", Icon: Grid3X3 }, { mode: "list", Icon: List }].map(({ mode, Icon }) => (
                    <button key={mode} onClick={() => setViewMode(mode)}
                      className={`p-2.5 rounded-xl border transition-all duration-200 ${
                        viewMode === mode
                          ? "bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border-cyan-500/50 text-cyan-400 shadow-lg shadow-cyan-500/10"
                          : isDark ? "bg-slate-800/50 border-slate-700/50 text-gray-400 hover:border-cyan-500/30" : "bg-white/80 border-gray-200 text-gray-500 hover:border-cyan-500/40"
                      }`}>
                      <Icon className="w-4 h-4" />
                    </button>
                  ))}
                </motion.div>

                {/* File panel */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}
                  className={`${card} p-4 sm:p-6`}>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className={`text-sm sm:text-base font-bold flex items-center gap-2.5 ${isDark ? "text-white" : "text-gray-900"}`}>
                      {sectionIcon("from-cyan-500 to-blue-600", FileText)} File Management
                    </h2>
                    <div className="flex items-center gap-2">
                      {loadingFiles && <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />}
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${isDark ? "bg-cyan-500/10 text-cyan-400" : "bg-cyan-500/10 text-cyan-700"}`}>
                        {filteredFiles.length} files
                      </span>
                    </div>
                  </div>

                  {/* Grid view */}
                  {viewMode === "grid" && (
                    <div className="max-h-[520px] overflow-y-auto pr-1 vault-scrollbar">
                      {loadingFiles ? (
                        <div className="flex items-center justify-center py-16">
                          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          {filteredFiles.length > 0 ? filteredFiles.map((file, idx) => {
                            const ft = getFileTypeConfig(file.type);
                            const FIcon = ft.Icon;
                            return (
                              <motion.div key={file.id}
                                initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.04 }}
                                onMouseEnter={() => setHoveredFileId(file.id)}
                                onMouseLeave={() => setHoveredFileId(null)}
                                className={`group relative rounded-xl p-4 border transition-all duration-500 hover:-translate-y-1.5 overflow-hidden ${isDark ? "bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 hover:border-cyan-500/40 hover:shadow-xl hover:shadow-cyan-500/10" : "bg-gradient-to-br from-gray-50 to-white border-gray-200 hover:border-cyan-500/50 hover:shadow-xl hover:shadow-cyan-500/10"}`}>
                                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 to-blue-600/0 group-hover:from-cyan-500/5 group-hover:to-blue-600/5 rounded-xl transition-all duration-500 pointer-events-none" />
                                <div className="relative">
                                  <div className="flex items-start justify-between mb-3">
                                    <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center bg-gradient-to-br ${ft.gradient} shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                                      <FIcon className="w-5 h-5 text-white" />
                                    </div>
                                    {file.encrypted && (
                                      <span className={`flex items-center gap-1 px-2 py-1 rounded-full border text-[10px] font-semibold ${isDark ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-600"}`}>
                                        <Lock className="w-2.5 h-2.5" /> Enc
                                      </span>
                                    )}
                                  </div>
                                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide mb-1.5 border ${ft.bg} ${ft.border} ${ft.text}`}>
                                    {file.type}
                                  </span>
                                  <p className={`font-semibold text-sm mb-1 truncate ${isDark ? "text-white" : "text-gray-900"}`}>{file.name}</p>
                                  <p className={`text-xs mb-3 ${isDark ? "text-gray-400" : "text-gray-500"}`}>{file.size} · {file.uploadDate}</p>
                                  <AnimatePresence>
                                    {hoveredFileId === file.id && (
                                      <motion.div
                                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                                        className={`overflow-hidden mb-3 text-xs px-2 py-1.5 rounded-lg flex items-center gap-3 ${isDark ? "bg-slate-700/60 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
                                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {file.views || 0}</span>
                                        <span className="flex items-center gap-1"><Download className="w-3 h-3" /> {file.downloads || 0}</span>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                  {/* Only Open and Delete buttons */}
                                  <div className="flex gap-1.5">
                                    <button
                                      onClick={() => navigate(`/vault/${activeVault.id}/files`)}
                                      className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 border ${isDark ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20" : "bg-cyan-50 border-cyan-200 text-cyan-600 hover:bg-cyan-100"}`}>
                                      <FolderOpen className="w-3 h-3" /><span className="hidden sm:inline">Open</span>
                                    </button>
                                    <button
                                      onClick={() => handleDeleteFile(file.id)}
                                      disabled={deletingId === file.id}
                                      className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 border disabled:opacity-50 ${isDark ? "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20" : "bg-red-50 border-red-100 text-red-500 hover:bg-red-100"}`}>
                                      {deletingId === file.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                      <span className="hidden sm:inline">Delete</span>
                                    </button>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          }) : (
                            <div className="col-span-full text-center py-12">
                              <FileText className={`w-10 h-10 mx-auto mb-3 opacity-20 ${isDark ? "text-gray-400" : "text-gray-500"}`} />
                              <p className={isDark ? "text-gray-400" : "text-gray-500"}>
                                {searchQuery ? "No files match your search" : "No files in this vault yet"}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* List view */}
                  {viewMode === "list" && (
                    <div className="max-h-[520px] overflow-y-auto pr-1 vault-scrollbar space-y-2">
                      {loadingFiles ? (
                        <div className="flex items-center justify-center py-16">
                          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                        </div>
                      ) : filteredFiles.length > 0 ? filteredFiles.map((file, idx) => {
                        const ft = getFileTypeConfig(file.type);
                        const FIcon = ft.Icon;
                        return (
                          <motion.div key={file.id}
                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.04 }}
                            className={`group flex items-center justify-between p-3 sm:p-4 border rounded-xl transition-all duration-300 ${isDark ? "bg-slate-800/30 border-slate-700/50 hover:border-cyan-500/40 hover:bg-slate-800/50 hover:shadow-lg hover:shadow-cyan-500/10" : "bg-gray-50 border-gray-200 hover:border-cyan-500/40 hover:bg-white hover:shadow-lg"}`}>
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${ft.gradient} shadow-md group-hover:scale-110 transition-all duration-300 flex-shrink-0`}>
                                <FIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className={`font-semibold text-sm truncate ${isDark ? "text-white" : "text-gray-900"}`}>{file.name}</p>
                                  <span className={`hidden sm:inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border flex-shrink-0 ${ft.bg} ${ft.border} ${ft.text}`}>{file.type}</span>
                                </div>
                                <p className={`text-xs flex flex-wrap items-center gap-2 mt-0.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                                  <span>{file.size} · {file.uploadDate}</span>
                                  <span className="hidden sm:flex items-center gap-1"><Eye className="w-3 h-3" />{file.views || 0}</span>
                                  <span className="hidden sm:flex items-center gap-1"><Download className="w-3 h-3" />{file.downloads || 0}</span>
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                              {file.encrypted && (
                                <span className={`hidden md:flex items-center gap-1 px-2 py-1 rounded-full border text-[10px] font-semibold ${isDark ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-600"}`}>
                                  <Lock className="w-2.5 h-2.5" /> Encrypted
                                </span>
                              )}
                              {/* Only Open and Delete */}
                              <button onClick={() => navigate(`/vault/${activeVault.id}/files`)}
                                className={`p-1.5 sm:p-2 rounded-lg transition-all ${isDark ? "hover:bg-cyan-500/20 text-cyan-400" : "hover:bg-cyan-100 text-cyan-600"}`}>
                                <FolderOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </button>
                              <button onClick={() => handleDeleteFile(file.id)} disabled={deletingId === file.id}
                                className={`p-1.5 sm:p-2 rounded-lg transition-all disabled:opacity-50 ${isDark ? "hover:bg-red-500/20 text-red-400" : "hover:bg-red-100 text-red-500"}`}>
                                {deletingId === file.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                              </button>
                            </div>
                          </motion.div>
                        );
                      }) : (
                        <div className="text-center py-12">
                          <p className={isDark ? "text-gray-400" : "text-gray-500"}>
                            {searchQuery ? "No files match your search" : "No files in this vault yet"}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>

                {/* Smart Sharing */}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.44 }}
                  className={`${card} p-4 sm:p-6`}>
                  <h2 className={`text-sm sm:text-base font-bold mb-5 flex items-center gap-2.5 ${isDark ? "text-white" : "text-gray-900"}`}>
                    {sectionIcon("from-indigo-500 to-violet-600", Share2)} Smart Sharing
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {[
                      {
                        Icon: Clock,
                        title: "Time-Limited Links",
                        desc: "Links that expire automatically",
                        gradient: "from-cyan-500 to-blue-600",
                        label: "Generate Link",
                        onClick: () => setShowTimedModal(true),
                      },
                      {
                        Icon: QrCode,
                        title: "QR Codes",
                        desc: "Share via scannable QR",
                        gradient: "from-violet-500 to-purple-600",
                        label: "Create QR",
                        onClick: () => setShowQRModal(true),
                      },
                      {
                        Icon: Share2,
                        title: "Share Vault ID",
                        desc: "Share vault ID for direct access",
                        gradient: "from-indigo-500 to-blue-600",
                        label: "Share ID",
                        onClick: () => setShowVaultIDModal(true),
                      },
                      {
                        Icon: Users,
                        title: "Permissions",
                        desc: "Control member access & roles",
                        gradient: "from-emerald-500 to-teal-600",
                        label: "Manage",
                        onClick: () => navigate(`/vault/permissions`),
                      },
                    ].map(({ Icon, title, desc, gradient, label, onClick }, i) => (
                      <motion.div key={i} whileHover={{ y: -3 }}
                        className={`group relative rounded-xl p-4 border transition-all duration-500 overflow-hidden cursor-pointer ${isDark ? "bg-slate-900/50 border-slate-700/50 hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/10" : "bg-gray-50 border-gray-200 hover:border-cyan-500/40 hover:shadow-lg"}`}
                        onClick={onClick}>
                        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                        <div className="relative">
                          <div className={`inline-flex bg-gradient-to-br ${gradient} w-9 h-9 sm:w-10 sm:h-10 rounded-xl items-center justify-center mb-3 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                            <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
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
                </motion.div>
              </div>

              {/* Security Monitor */}
              <div className="xl:col-span-4">
                <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.36 }}
                  className={`${card} overflow-hidden xl:sticky xl:top-24`}>
                  <div className="h-[2px] bg-gradient-to-r from-red-500 via-orange-500 to-amber-500" />
                  <div className={`p-4 sm:p-5 border-b ${isDark ? "border-slate-700/50" : "border-gray-200"}`}>
                    <h3 className={`text-sm sm:text-base font-bold flex items-center gap-2.5 ${isDark ? "text-white" : "text-gray-900"}`}>
                      {sectionIcon("from-red-500 to-orange-600", AlertCircle)} Security Monitor
                    </h3>
                    <div className="flex items-center gap-2 mt-2 ml-11">
                      <div className="relative flex">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping absolute" />
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      </div>
                      <span className={`text-xs font-semibold ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>Live</span>
                      <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-semibold ${isDark ? "bg-red-500/15 text-red-400" : "bg-red-50 text-red-500"}`}>
                        {alerts.filter(a => a.type === "suspicious").length} threats
                      </span>
                    </div>
                  </div>
                  <div className="p-3 sm:p-4 space-y-2 max-h-72 sm:max-h-80 overflow-y-auto vault-scrollbar">
                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${isDark ? "text-gray-500" : "text-gray-400"}`}>Active Alerts</p>
                    {alerts.map((alert, idx) => (
                      <motion.div key={alert.id}
                        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}
                        className={`p-3 rounded-xl border group transition-all duration-300 hover:-translate-y-0.5 ${
                          alert.type === "suspicious"
                            ? isDark ? "bg-red-500/10 border-red-500/30 hover:border-red-400/50" : "bg-red-50 border-red-200"
                            : isDark ? "bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/40" : "bg-emerald-50 border-emerald-200"
                        }`}>
                        <div className="flex gap-2.5">
                          <div className="flex-shrink-0 mt-0.5">
                            {alert.type === "suspicious"
                              ? <AlertTriangle className={`w-3.5 h-3.5 animate-pulse ${isDark ? "text-red-400" : "text-red-500"}`} />
                              : <CheckCircle className={`w-3.5 h-3.5 ${isDark ? "text-emerald-400" : "text-emerald-600"}`} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-medium leading-snug ${alert.type === "suspicious" ? (isDark ? "text-red-300" : "text-red-700") : isDark ? "text-emerald-300" : "text-emerald-700"}`}>
                              {alert.message}
                            </p>
                            <p className={`text-[10px] mt-1 ${isDark ? "text-gray-500" : "text-gray-400"}`}>{alert.time}</p>
                          </div>
                          <button onClick={() => setAlerts(alerts.filter(a => a.id !== alert.id))}
                            className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <X className={`w-3 h-3 ${isDark ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"}`} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                    {alerts.length === 0 && (
                      <div className="text-center py-6">
                        <CheckCircle className={`w-7 h-7 mx-auto mb-2 ${isDark ? "text-emerald-400" : "text-emerald-500"}`} />
                        <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>All clear</p>
                      </div>
                    )}
                  </div>
                  <div className={`p-4 border-t ${isDark ? "border-slate-700/50" : "border-gray-200"}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-xs font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}>Security Score</span>
                      <span className={`text-xs font-bold ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>98%</span>
                    </div>
                    <div className={`h-2 rounded-full overflow-hidden ${isDark ? "bg-slate-700" : "bg-gray-200"}`}>
                      <motion.div initial={{ width: 0 }} animate={{ width: "98%" }}
                        transition={{ duration: 1.5, ease: "easeOut", delay: 0.6 }}
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" />
                    </div>
                    <p className={`text-[10px] mt-1.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}>Excellent — all encryption active</p>
                  </div>
                </motion.div>
              </div>
            </div>

          </div>
        </div>
      </motion.main>

      {/* ── Sharing Modals ── */}
      <AnimatePresence>
        {showTimedModal && (
          <TimeLimitedLinkModal
            vaultId={activeVault?.id}
            isDark={isDark}
            onClose={() => setShowTimedModal(false)}
          />
        )}
        {showQRModal && (
          <QRCodeModal
            vaultId={activeVault?.id}
            vaultName={activeVault?.name}
            isDark={isDark}
            onClose={() => setShowQRModal(false)}
          />
        )}
        {showVaultIDModal && (
          <VaultIDShareModal
            vaultId={activeVault?.id}
            vaultName={activeVault?.name}
            isDark={isDark}
            onClose={() => setShowVaultIDModal(false)}
          />
        )}
      </AnimatePresence>

      <style>{`
        @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }
        .animate-shimmer { animation: shimmer 2.5s infinite; }
        .vault-scrollbar::-webkit-scrollbar { width: 4px; }
        .vault-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .vault-scrollbar::-webkit-scrollbar-thumb { background: rgba(6,182,212,0.4); border-radius: 2px; }
        .vault-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(6,182,212,0.65); }
      `}</style>
    </div>
  );
};

export default VaultDashboard;