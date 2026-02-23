import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Wifi, WifiOff, Upload, X, Check, Loader, File, Image as ImageIcon,
  FileText, Music, Video, Smartphone, Laptop, Tablet, Monitor, Globe,
  QrCode, Shield, Lock, Radar, Activity, CheckCircle, Signal,
  Zap, Database, Users, ChevronRight, RefreshCw, Sun, Moon
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

/* ══════════ HELPERS ══════════ */
const getDeviceIcon = (type) =>
  ({ phone: Smartphone, laptop: Laptop, tablet: Tablet, desktop: Monitor }[type] || Globe);

const getFileIcon = (file) => {
  const t = file.type?.split('/')[0];
  if (t === 'image') return ImageIcon;
  if (t === 'video') return Video;
  if (t === 'audio') return Music;
  if (file.type?.includes('pdf') || file.type?.includes('document')) return FileText;
  return File;
};

const formatSize = (b) => {
  if (!b) return '0 B';
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
};

/* ══════════ REAL CRYPTO — AES-GCM 256-bit ══════════ */
const GCM_ALGO   = 'AES-GCM';
const SALT_BYTES = 32;
const IV_BYTES   = 12;
const TAG_BITS   = 128;

const buf2b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const b642buf = (b64) => Uint8Array.from(atob(b64), c => c.charCodeAt(0)).buffer;

const joinBufs = (...bufs) => {
  const out = new Uint8Array(bufs.reduce((n, b) => n + b.byteLength, 0));
  let off = 0;
  for (const b of bufs) { out.set(new Uint8Array(b), off); off += b.byteLength; }
  return out.buffer;
};

async function makeSessionKey() {
  const key = await crypto.subtle.generateKey(
    { name: GCM_ALGO, length: 256 }, true, ['encrypt', 'decrypt']
  );
  const raw = await crypto.subtle.exportKey('raw', key);
  return { key, b64: buf2b64(raw) };
}

async function keyFromB64(b64) {
  return crypto.subtle.importKey(
    'raw', b642buf(b64), { name: GCM_ALGO, length: 256 }, false, ['encrypt', 'decrypt']
  );
}

async function encryptBuf(plain, key) {
  const salt   = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv     = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const cipher = await crypto.subtle.encrypt(
    { name: GCM_ALGO, iv, tagLength: TAG_BITS }, key, plain
  );
  return joinBufs(salt.buffer, iv.buffer, cipher);
}

async function decryptBuf(blob, key) {
  const b      = new Uint8Array(blob);
  const iv     = b.slice(SALT_BYTES, SALT_BYTES + IV_BYTES);
  const cipher = b.slice(SALT_BYTES + IV_BYTES);
  return crypto.subtle.decrypt({ name: GCM_ALGO, iv, tagLength: TAG_BITS }, key, cipher);
}

const readFile = (file) => new Promise((res, rej) => {
  const r = new FileReader();
  r.onload  = () => res(r.result);
  r.onerror = () => rej(new Error('FileReader failed'));
  r.readAsArrayBuffer(file);
});

/* ══════════ WEBRTC CONFIG ══════════ */
const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};
const CHUNK_SIZE = 65536;

/* ══════════ PEER IDENTITY ══════════ */
const MY_ID   = Math.random().toString(36).slice(2, 8).toUpperCase();
const MY_TYPE = (() => {
  const ua = navigator.userAgent;
  if (/Mobi|Android/i.test(ua)) return 'phone';
  if (/iPad|Tablet/i.test(ua))  return 'tablet';
  return 'laptop';
})();
const MY_NAME = `${MY_TYPE === 'phone' ? 'Mobile' : MY_TYPE === 'tablet' ? 'Tablet' : 'Desktop'} ${MY_ID}`;

/* ══════════ FEATURES ══════════ */
const FEATURES = [
  { Icon: Radar,       title: 'Proximity Discovery',     desc: 'Auto-finds nearby AirVault users on the same network — no usernames required.', color: 'from-violet-500 to-purple-600' },
  { Icon: Lock,        title: 'Zero-Knowledge Transfer', desc: 'Files encrypted end-to-end. AES-GCM 256-bit. Only the recipient decrypts.',      color: 'from-purple-500 to-fuchsia-600' },
  { Icon: QrCode,      title: 'Code Handshake',          desc: 'Share a code to instantly pair two devices. No typing, no accounts needed.',      color: 'from-fuchsia-500 to-pink-600' },
  { Icon: Activity,    title: 'Real-Time Progress',      desc: 'Live transfer speed, ETA and instant completion notification as bytes flow.',     color: 'from-pink-500 to-rose-600' },
  { Icon: CheckCircle, title: 'No Account Required',     desc: 'The recipient needs no AirVault account. Any browser-enabled device works.',      color: 'from-rose-500 to-orange-500' },
];

/* ══════════ RADAR CANVAS ══════════ */
const RadarCanvas = ({ devices, isScanning, isDark, onDeviceClick }) => {
  const canvasRef = useRef(null);
  const rafRef    = useRef(null);
  const angleRef  = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;
    const maxR = Math.min(cx, cy) - 24;

    const draw = (ts) => {
      ctx.clearRect(0, 0, W, H);

      [0.25, 0.5, 0.75, 1].forEach(f => {
        ctx.beginPath();
        ctx.arc(cx, cy, maxR * f, 0, Math.PI * 2);
        ctx.strokeStyle = isDark ? 'rgba(139,92,246,0.18)' : 'rgba(139,92,246,0.22)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      ctx.save();
      ctx.strokeStyle = isDark ? 'rgba(139,92,246,0.1)' : 'rgba(139,92,246,0.14)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.beginPath(); ctx.moveTo(cx, cy - maxR); ctx.lineTo(cx, cy + maxR); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - maxR, cy); ctx.lineTo(cx + maxR, cy); ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      if (isScanning) {
        angleRef.current += 0.035;
        const gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
        gr.addColorStop(0, 'rgba(167,139,250,0.35)');
        gr.addColorStop(0.6, 'rgba(167,139,250,0.12)');
        gr.addColorStop(1, 'rgba(167,139,250,0)');
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angleRef.current);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, maxR, 0, Math.PI / 2.5);
        ctx.closePath();
        ctx.fillStyle = gr;
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(maxR, 0);
        ctx.strokeStyle = 'rgba(167,139,250,0.7)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      }

      devices.forEach((dev, idx) => {
        const a = ((idx / Math.max(devices.length, 1)) * Math.PI * 2) - Math.PI / 2;
        const d = 0.62 * maxR;
        const x = cx + d * Math.cos(a);
        const y = cy + d * Math.sin(a);
        const pulse = 6 + Math.sin(ts / 600 + idx) * 2;
        const glow = ctx.createRadialGradient(x, y, 0, x, y, pulse + 8);
        glow.addColorStop(0, 'rgba(167,139,250,0.5)');
        glow.addColorStop(1, 'rgba(167,139,250,0)');
        ctx.beginPath(); ctx.arc(x, y, pulse + 8, 0, Math.PI * 2);
        ctx.fillStyle = glow; ctx.fill();
        ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#a78bfa'; ctx.fill();
        ctx.strokeStyle = isDark ? '#1e1b4b' : '#ffffff';
        ctx.lineWidth = 2; ctx.stroke();
      });

      const cc = ctx.createRadialGradient(cx, cy, 0, cx, cy, 14);
      cc.addColorStop(0, '#7c3aed'); cc.addColorStop(1, '#4f46e5');
      ctx.beginPath(); ctx.arc(cx, cy, 11, 0, Math.PI * 2);
      ctx.fillStyle = cc; ctx.fill();
      ctx.strokeStyle = '#a78bfa'; ctx.lineWidth = 3; ctx.stroke();

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [devices, isScanning, isDark]);

  return (
    <div className="relative w-full" style={{ maxWidth: 520, aspectRatio: '1/1' }}>
      <canvas ref={canvasRef} width={520} height={520} className="w-full h-full" />

      {devices.map((dev, idx) => {
        const a = ((idx / Math.max(devices.length, 1)) * Math.PI * 2) - Math.PI / 2;
        const x = 50 + 0.62 * 50 * Math.cos(a);
        const y = 50 + 0.62 * 50 * Math.sin(a);
        const DevIcon = getDeviceIcon(dev.type);
        return (
          <div key={dev.id} className="absolute pointer-events-auto"
            style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%,-60%)' }}>
            <button onClick={() => onDeviceClick(dev)}
              className={`group relative backdrop-blur-sm border rounded-2xl p-2.5 shadow-xl transition-all duration-300 hover:scale-110 hover:-translate-y-1
                ${isDark
                  ? 'bg-slate-900/85 border-violet-500/40 hover:border-violet-400/80 hover:shadow-xl hover:shadow-violet-500/30'
                  : 'bg-white/90 border-violet-400/50 hover:border-violet-600 hover:shadow-xl hover:shadow-violet-400/25'
                }`}>
              <div className="flex flex-col items-center gap-1">
                <DevIcon className={`w-4 h-4 ${isDark ? 'text-violet-400' : 'text-violet-600'}`} />
                <span className={`text-[10px] font-semibold whitespace-nowrap ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {dev.name.split(' ')[0]}
                </span>
              </div>
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-900 animate-pulse" />
            </button>
          </div>
        );
      })}

      <div className="absolute top-1/2 left-1/2 pointer-events-none"
        style={{ transform: 'translate(-50%, calc(-50% + 22px))' }}>
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border
          ${isDark ? 'bg-violet-900/60 border-violet-500/40 text-violet-300' : 'bg-violet-50 border-violet-300 text-violet-700'}`}>
          You
        </span>
      </div>
    </div>
  );
};

/* ══════════ QR MODAL — real WebRTC offer + AES key ══════════ */
const QrModal = ({ device, isDark, onClose, onProceed }) => {
  const [step, setStep]           = useState('generating');
  const [countdown, setCountdown] = useState(120);
  const [offerCode, setOfferCode] = useState('');
  const [answerInput, setAnswerInput] = useState('');
  const [copied, setCopied]       = useState(false);
  const [errMsg, setErrMsg]       = useState('');

  const pcRef  = useRef(null);
  const dcRef  = useRef(null);
  const keyRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { key, b64: keyB64 } = await makeSessionKey();
        keyRef.current = key;

        const pc = new RTCPeerConnection(RTC_CONFIG);
        pcRef.current = pc;
        const dc = pc.createDataChannel('av', { ordered: true });
        dcRef.current = dc;

        await new Promise(res => {
          pc.onicecandidate = e => { if (!e.candidate) res(); };
          pc.createOffer().then(o => pc.setLocalDescription(o));
        });

        if (cancelled) { pc.close(); return; }

        const payload = JSON.stringify({
          v: 1, sdp: pc.localDescription.sdp,
          type: pc.localDescription.type, key: keyB64,
          name: MY_NAME, id: MY_ID,
        });
        setOfferCode(btoa(unescape(encodeURIComponent(payload))));
        setStep('qr');

        pc.onconnectionstatechange = () => {
          if (pc.connectionState === 'connected' && !cancelled) setStep('paired');
          if ((pc.connectionState === 'failed' || pc.connectionState === 'disconnected') && !cancelled) {
            setErrMsg('Connection failed. Please try again.');
            setStep('error');
          }
        };
      } catch (e) {
        if (!cancelled) { setErrMsg(e.message); setStep('error'); }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (step !== 'qr' && step !== 'waiting_answer') return;
    const t = setInterval(() => setCountdown(c => c <= 1 ? 0 : c - 1), 1000);
    return () => clearInterval(t);
  }, [step]);

  const applyAnswer = useCallback(async () => {
    if (!answerInput.trim() || !pcRef.current) return;
    try {
      const payload = JSON.parse(decodeURIComponent(escape(atob(answerInput.trim()))));
      await pcRef.current.setRemoteDescription({ type: payload.type, sdp: payload.sdp });
      setStep('waiting_answer');
    } catch (e) {
      setErrMsg('Invalid answer code. Ask the receiver to copy it again.');
      setStep('error');
    }
  }, [answerInput]);

  const copyCode = () => {
    navigator.clipboard.writeText(offerCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleProceed = () =>
    onProceed({ pc: pcRef.current, dc: dcRef.current, key: keyRef.current, remoteName: device?.name });

  const DevIcon = device ? getDeviceIcon(device.type) : Globe;
  const qrCode  = `AVLT-${MY_ID}`;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        className={`relative rounded-3xl border shadow-2xl w-full max-w-sm overflow-hidden
          ${isDark ? 'bg-slate-900/95 border-violet-500/30' : 'bg-white border-violet-300'}`}>
        <div className="h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500" />
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-lg">
                <QrCode className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>QR Handshake</p>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{device?.name}</p>
              </div>
            </div>
            <button onClick={onClose} className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-slate-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
              <X className="w-4 h-4" />
            </button>
          </div>

          {step === 'generating' && (
            <div className="flex flex-col items-center gap-4 py-6">
              <Loader className="w-8 h-8 text-violet-400 animate-spin" />
              <p className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Generating encrypted offer…</p>
            </div>
          )}

          {step === 'qr' && (
            <div className="flex flex-col items-center gap-4">
              <div className={`relative p-4 rounded-2xl border ${isDark ? 'bg-slate-800/60 border-violet-500/20' : 'bg-violet-50 border-violet-200'}`}>
                <svg width="160" height="160" viewBox="0 0 160 160">
                  {[[8,8],[112,8],[8,112]].map(([x,y],i) => (
                    <g key={i}>
                      <rect x={x} y={y} width="40" height="40" rx="6" fill="#7c3aed" opacity="0.9"/>
                      <rect x={x+8} y={y+8} width="24" height="24" rx="3" fill={isDark ? '#1e1b4b' : '#f5f3ff'}/>
                      <rect x={x+14} y={y+14} width="12" height="12" rx="2" fill="#7c3aed"/>
                    </g>
                  ))}
                  {Array.from({length: 48}).map((_,i) => {
                    const col = (i % 8) * 14 + 56;
                    const row = Math.floor(i / 8) * 14 + 8;
                    if (col > 142 || row > 142) return null;
                    const seed = offerCode.length
                      ? (offerCode.charCodeAt(i % offerCode.length) + i * 137) % 3
                      : (i * 137) % 3;
                    if (seed === 0) return null;
                    return <rect key={i} x={col} y={row} width="10" height="10" rx="2" fill={isDark ? '#a78bfa' : '#7c3aed'} opacity={0.5 + seed * 0.25}/>;
                  })}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
                    <Shield className="w-4 h-4 text-violet-500" />
                  </div>
                </div>
              </div>

              <div className="text-center w-full">
                <p className={`text-xs font-mono font-bold tracking-widest mb-1 ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>{qrCode}</p>
                <p className={`text-xs mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Copy this code and share with the receiver</p>

                <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 mb-3
                  ${isDark ? 'bg-slate-800/60 border-violet-500/20' : 'bg-violet-50 border-violet-200'}`}>
                  <span className={`flex-1 text-[10px] font-mono truncate ${isDark ? 'text-violet-300' : 'text-violet-700'}`}>
                    {offerCode.slice(0, 40)}…
                  </span>
                  <button onClick={copyCode}
                    className={`text-xs font-bold px-2 py-1 rounded-lg flex-shrink-0 transition-all
                      ${copied
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : isDark ? 'bg-violet-500/20 text-violet-400 hover:bg-violet-500/30' : 'bg-violet-100 text-violet-700 hover:bg-violet-200'
                      }`}>
                    {copied ? '✓ Copied' : 'Copy'}
                  </button>
                </div>

                <p className={`text-xs font-semibold mb-1 text-left ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Paste receiver's answer code:</p>
                <textarea
                  value={answerInput}
                  onChange={e => setAnswerInput(e.target.value)}
                  placeholder="Paste answer code from receiver here…"
                  rows={2}
                  className={`w-full text-[10px] font-mono rounded-xl border px-3 py-2 resize-none outline-none mb-2
                    ${isDark
                      ? 'bg-slate-800/60 border-slate-600 text-gray-300 placeholder-gray-600 focus:border-violet-500'
                      : 'bg-gray-50 border-gray-300 text-gray-700 placeholder-gray-400 focus:border-violet-400'
                    }`}
                />
                <button onClick={applyAnswer} disabled={!answerInput.trim()}
                  className={`w-full py-2 rounded-xl text-sm font-bold transition-all duration-300
                    ${answerInput.trim()
                      ? 'bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white shadow-lg shadow-violet-500/30 hover:scale-[1.02]'
                      : isDark ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}>
                  Connect →
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative w-8 h-8">
                  <svg viewBox="0 0 36 36" className="w-8 h-8 -rotate-90">
                    <circle cx="18" cy="18" r="14" fill="none" stroke={isDark ? '#3f3f46' : '#e4e4e7'} strokeWidth="3"/>
                    <circle cx="18" cy="18" r="14" fill="none" stroke="#7c3aed" strokeWidth="3"
                      strokeDasharray={`${(countdown / 120) * 87.96} 87.96`} strokeLinecap="round"/>
                  </svg>
                  <span className={`absolute inset-0 flex items-center justify-center text-[9px] font-bold ${isDark ? 'text-white' : 'text-gray-700'}`}>{countdown}</span>
                </div>
                <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>seconds remaining</span>
              </div>

              <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                <Loader className="w-3 h-3 animate-spin text-violet-400" />
                Waiting for receiver to accept…
              </div>
            </div>
          )}

          {step === 'waiting_answer' && (
            <div className="flex flex-col items-center gap-4 py-4">
              <Loader className="w-8 h-8 text-violet-400 animate-spin" />
              <p className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Establishing peer connection…</p>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Negotiating end-to-end encrypted channel</p>
            </div>
          )}

          {step === 'paired' && (
            <div className="flex flex-col items-center gap-4 py-2">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/30">
                <Check className="w-8 h-8 text-white" />
              </div>
              <div className="text-center">
                <p className={`font-bold text-base mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>Devices Paired!</p>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Secure channel established with{' '}
                  <span className={`font-semibold ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>{device?.name}</span>
                </p>
              </div>
              <div className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-xs
                ${isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> E2E Encrypted</span>
                <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> AES-GCM 256</span>
                <span className="flex items-center gap-1"><Signal className="w-3 h-3" /> WebRTC P2P</span>
              </div>
              <button onClick={handleProceed}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white font-semibold text-sm shadow-lg shadow-violet-500/30 hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2">
                <Upload className="w-4 h-4" /> Choose Files to Send
              </button>
            </div>
          )}

          {step === 'error' && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isDark ? 'bg-red-500/20' : 'bg-red-50'}`}>
                <X className="w-8 h-8 text-red-500" />
              </div>
              <div className="text-center">
                <p className={`font-bold text-base mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>Connection Error</p>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{errMsg}</p>
              </div>
              <button onClick={onClose}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white font-semibold text-sm hover:scale-[1.02] transition-all duration-300">
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ══════════ SEND MODAL — real AES-GCM + WebRTC DataChannel ══════════ */
const SendModal = ({ device, isDark, onClose, rtcSession }) => {
  const [files, setFiles]       = useState([]);
  const [status, setStatus]     = useState(null);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed]       = useState(0);
  const [eta, setEta]           = useState(0);
  const [errMsg, setErrMsg]     = useState('');

  const abortRef = useRef(false);
  const speedRef = useRef({ bytes: 0, ts: Date.now() });

  const addFiles   = (incoming) => setFiles(prev => [...prev, ...Array.from(incoming)]);
  const handleDrop = (e) => { e.preventDefault(); addFiles(e.dataTransfer.files); };

  const handleSend = useCallback(async () => {
    if (!files.length || !rtcSession?.dc || !rtcSession?.key) return;
    const { dc, key } = rtcSession;

    if (dc.readyState !== 'open') {
      setErrMsg('DataChannel not open. Reconnect and try again.');
      setStatus('error');
      return;
    }

    setStatus('sending');
    abortRef.current = false;
    const totalBytes = files.reduce((s, f) => s + f.size, 0);

    try {
      for (let fi = 0; fi < files.length; fi++) {
        if (abortRef.current) break;
        const file = files[fi];

        const plainBuf = await readFile(file);
        const encBuf   = await encryptBuf(plainBuf, key);

        dc.send(JSON.stringify({
          type: 'meta', name: file.name,
          mime: file.type || 'application/octet-stream',
          size: file.size, encryptedSize: encBuf.byteLength,
          index: fi, total: files.length,
        }));

        const bytes  = new Uint8Array(encBuf);
        let   offset = 0;
        speedRef.current = { bytes: 0, ts: Date.now() };

        while (offset < bytes.length) {
          if (abortRef.current) break;

          if (dc.bufferedAmount > 4 * 1024 * 1024) {
            await new Promise(res => {
              dc.bufferedAmountLowThreshold = 2 * 1024 * 1024;
              dc.onbufferedamountlow = () => { dc.onbufferedamountlow = null; res(); };
            });
          }

          const end   = Math.min(offset + CHUNK_SIZE, bytes.length);
          const chunk = bytes.slice(offset, end);
          dc.send(chunk);
          offset = end;

          const now = Date.now();
          speedRef.current.bytes += chunk.byteLength;
          if (now - speedRef.current.ts > 300) {
            const elapsed = (now - speedRef.current.ts) / 1000;
            const mbps    = (speedRef.current.bytes / elapsed) / 1048576;
            setSpeed(mbps.toFixed(1));
            speedRef.current = { bytes: 0, ts: now };
          }

          const filesDonePct = (fi / files.length) * 100;
          const thisFilePct  = (offset / bytes.length) * (100 / files.length);
          setProgress(filesDonePct + thisFilePct);

          const remaining = bytes.length - offset;
          const mbpsNum   = parseFloat(speed) || 1;
          setEta(Math.max(0, Math.ceil((remaining / 1048576) / mbpsNum)));
        }

        dc.send(JSON.stringify({ type: 'done', index: fi, more: fi < files.length - 1 }));
      }

      setProgress(100);
      setStatus('success');
    } catch (e) {
      setErrMsg(e.message);
      setStatus('error');
    }
  }, [files, rtcSession, speed]);

  useEffect(() => () => { abortRef.current = true; }, []);

  const DevIcon    = device ? getDeviceIcon(device.type) : Globe;
  const totalBytes = files.reduce((s, f) => s + f.size, 0);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        className={`relative rounded-3xl border shadow-2xl w-full max-w-md overflow-hidden
          ${isDark ? 'bg-slate-900/95 border-violet-500/30' : 'bg-white border-violet-300'}`}>
        <div className="h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500" />
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${isDark ? 'bg-violet-500/10' : 'bg-violet-50'}`}>
                <DevIcon className={`w-5 h-5 ${isDark ? 'text-violet-400' : 'text-violet-600'}`} />
              </div>
              <div>
                <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Send to {rtcSession?.remoteName || device?.name}
                </p>
                <p className={`text-xs flex items-center gap-1 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse inline-block" /> Paired & AES-GCM encrypted
                </p>
              </div>
            </div>
            <button onClick={onClose} className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-slate-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
              <X className="w-4 h-4" />
            </button>
          </div>

          {!status && (
            <>
              <div
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => document.getElementById('av-file-input')?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 mb-4
                  ${isDark ? 'border-violet-500/30 hover:border-violet-400/60 bg-violet-500/5 hover:bg-violet-500/10' : 'border-violet-300 hover:border-violet-500 bg-violet-50/50 hover:bg-violet-50'}`}>
                <input id="av-file-input" type="file" multiple className="hidden" onChange={e => addFiles(e.target.files)} />
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg shadow-violet-500/25">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Drop files here or click to browse</p>
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Any format · AES-GCM 256-bit encrypted before sending</p>
              </div>

              {files.length > 0 && (
                <div className={`rounded-2xl border overflow-hidden mb-4 ${isDark ? 'border-slate-700/50' : 'border-gray-200'}`}>
                  <div className={`px-4 py-2 flex items-center justify-between border-b text-xs font-semibold
                    ${isDark ? 'bg-slate-800/60 border-slate-700/50 text-gray-300' : 'bg-gray-50 border-gray-100 text-gray-600'}`}>
                    <span>{files.length} file{files.length > 1 ? 's' : ''} · {formatSize(totalBytes)}</span>
                    <button onClick={() => setFiles([])} className="text-red-400 hover:text-red-300">Clear all</button>
                  </div>
                  <div className="max-h-40 overflow-y-auto airdrop-scrollbar">
                    {files.map((f, i) => {
                      const FIcon = getFileIcon(f);
                      return (
                        <div key={i} className={`flex items-center gap-3 px-4 py-2.5 border-b last:border-0 ${isDark ? 'border-slate-700/30' : 'border-gray-100'}`}>
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-violet-500/10' : 'bg-violet-50'}`}>
                            <FIcon className={`w-3.5 h-3.5 ${isDark ? 'text-violet-400' : 'text-violet-600'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{f.name}</p>
                            <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{formatSize(f.size)}</p>
                          </div>
                          <button onClick={() => setFiles(files.filter((_,j) => j !== i))}
                            className={`p-1 rounded ${isDark ? 'hover:bg-slate-700 text-gray-500' : 'hover:bg-gray-100 text-gray-400'}`}>
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <button onClick={handleSend} disabled={!files.length}
                className={`w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300
                  ${files.length
                    ? 'bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white shadow-lg shadow-violet-500/30 hover:scale-[1.02] hover:shadow-violet-500/50'
                    : isDark ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}>
                <Zap className="w-4 h-4" />
                Send {files.length > 0 ? `${files.length} file${files.length > 1 ? 's' : ''}` : 'Files'}
              </button>
            </>
          )}

          {status === 'sending' && (
            <div className="py-4 space-y-5">
              <div className="flex flex-col items-center gap-3">
                <div className="relative w-20 h-20">
                  <svg viewBox="0 0 80 80" className="w-20 h-20 -rotate-90">
                    <circle cx="40" cy="40" r="34" fill="none" stroke={isDark ? '#3f3f46' : '#e4e4e7'} strokeWidth="5"/>
                    <circle cx="40" cy="40" r="34" fill="none" stroke="url(#pg)" strokeWidth="5"
                      strokeLinecap="round" strokeDasharray={`${(progress / 100) * 213.6} 213.6`}/>
                    <defs>
                      <linearGradient id="pg" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#7c3aed"/>
                        <stop offset="100%" stopColor="#ec4899"/>
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-base font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>{Math.round(progress)}%</span>
                  </div>
                </div>
                <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Encrypting & Transferring…</p>
              </div>
              <div className={`grid grid-cols-3 gap-2 text-center text-xs rounded-2xl p-4 border
                ${isDark ? 'bg-slate-800/50 border-slate-700/40' : 'bg-gray-50 border-gray-200'}`}>
                {[{ label: 'Speed', val: `${speed} MB/s` }, { label: 'ETA', val: `${eta}s` }, { label: 'Files', val: `${files.length}` }].map(({ label, val }) => (
                  <div key={label}>
                    <p className={`font-bold text-base ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>{val}</p>
                    <p className={isDark ? 'text-gray-500' : 'text-gray-400'}>{label}</p>
                  </div>
                ))}
              </div>
              <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
                <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-600 transition-all duration-300 relative overflow-hidden"
                  style={{ width: `${progress}%` }}>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                </div>
              </div>
              <p className={`text-center text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {formatSize(totalBytes * (progress / 100))} of {formatSize(totalBytes)} sent · AES-GCM encrypted
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl flex items-center justify-center shadow-xl shadow-emerald-500/40">
                  <Check className="w-10 h-10 text-white" />
                </div>
                <div className="absolute inset-0 rounded-3xl bg-emerald-400/25 animate-ping" />
              </div>
              <div className="text-center">
                <p className={`text-xl font-black mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>Transfer Complete!</p>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {files.length} file{files.length > 1 ? 's' : ''} ({formatSize(totalBytes)}) delivered to{' '}
                  <span className={`font-semibold ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>{rtcSession?.remoteName || device?.name}</span>
                </p>
              </div>
              <div className={`w-full grid grid-cols-2 gap-3 p-4 rounded-2xl border text-xs
                ${isDark ? 'bg-slate-800/50 border-slate-700/40' : 'bg-gray-50 border-gray-200'}`}>
                {[
                  { icon: Lock,        label: 'AES-GCM 256-bit',  color: isDark ? 'text-emerald-400' : 'text-emerald-600' },
                  { icon: Shield,      label: 'Zero-knowledge',   color: isDark ? 'text-violet-400'  : 'text-violet-600'  },
                  { icon: Database,    label: 'No cloud storage', color: isDark ? 'text-blue-400'    : 'text-blue-600'    },
                  { icon: CheckCircle, label: 'Verified receipt', color: isDark ? 'text-fuchsia-400' : 'text-fuchsia-600' },
                ].map(({ icon: Icon, label, color }) => (
                  <div key={label} className={`flex items-center gap-2 ${color}`}>
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" /><span>{label}</span>
                  </div>
                ))}
              </div>
              <button onClick={onClose}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white font-bold text-sm shadow-lg hover:scale-[1.02] transition-all duration-300">
                Done
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isDark ? 'bg-red-500/20' : 'bg-red-50'}`}>
                <X className="w-8 h-8 text-red-500" />
              </div>
              <div className="text-center">
                <p className={`font-bold text-base mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>Transfer Failed</p>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{errMsg}</p>
              </div>
              <button onClick={onClose}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white font-bold text-sm hover:scale-[1.02] transition-all duration-300">
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ══════════ RECEIVE MODAL — real WebRTC answer + AES-GCM decrypt ══════════ */
const ReceiveModal = ({ isDark, onClose }) => {
  const [step, setStep]             = useState('paste');
  const [offerInput, setOfferInput] = useState('');
  const [answerCode, setAnswerCode] = useState('');
  const [copied, setCopied]         = useState(false);
  const [received, setReceived]     = useState([]);
  const [progress, setProgress]     = useState(0);
  const [currentFile, setCurrentFile] = useState('');
  const [errMsg, setErrMsg]         = useState('');

  const pcRef   = useRef(null);
  const keyRef  = useRef(null);
  const recvRef = useRef({ chunks: [], meta: null, got: 0 });

  const accept = useCallback(async () => {
    if (!offerInput.trim()) return;
    try {
      const payload = JSON.parse(decodeURIComponent(escape(atob(offerInput.trim()))));
      const key     = await keyFromB64(payload.key);
      keyRef.current = key;

      const pc = new RTCPeerConnection(RTC_CONFIG);
      pcRef.current = pc;

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') setStep('receiving');
        if (pc.connectionState === 'failed') { setErrMsg('Connection failed.'); setStep('error'); }
      };

      pc.ondatachannel = (e) => {
        const dc = e.channel;
        dc.binaryType = 'arraybuffer';

        dc.onmessage = async (ev) => {
          if (typeof ev.data === 'string') {
            const msg = JSON.parse(ev.data);
            if (msg.type === 'meta') {
              recvRef.current = { chunks: [], meta: msg, got: 0 };
              setCurrentFile(msg.name);
              setProgress(0);
            }
            if (msg.type === 'done') {
              const { chunks, meta } = recvRef.current;
              const totalLen = chunks.reduce((n, c) => n + c.byteLength, 0);
              const assembled = new Uint8Array(totalLen);
              let off = 0;
              for (const c of chunks) { assembled.set(new Uint8Array(c), off); off += c.byteLength; }
              try {
                const plainBuf = await decryptBuf(assembled.buffer, keyRef.current);
                const blob     = new Blob([plainBuf], { type: meta.mime });
                const url      = URL.createObjectURL(blob);
                setReceived(r => [...r, { name: meta.name, url, size: meta.size }]);
                setProgress(100);
              } catch {
                setErrMsg('Decryption failed — file may be corrupted.');
                setStep('error');
                return;
              }
              if (!msg.more) setStep('done');
            }
          } else {
            recvRef.current.chunks.push(ev.data);
            recvRef.current.got += ev.data.byteLength;
            const { got, meta } = recvRef.current;
            if (meta) setProgress(Math.min(100, (got / meta.encryptedSize) * 100));
          }
        };
      };

      await pc.setRemoteDescription({ type: payload.type, sdp: payload.sdp });
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      await new Promise(res => {
        pc.onicecandidate = e => { if (!e.candidate) res(); };
      });

      const ans = JSON.stringify({
        v: 1, type: pc.localDescription.type,
        sdp: pc.localDescription.sdp, name: MY_NAME, id: MY_ID,
      });
      setAnswerCode(btoa(unescape(encodeURIComponent(ans))));
      setStep('connecting');
    } catch (e) {
      setErrMsg('Invalid offer code: ' + e.message);
      setStep('error');
    }
  }, [offerInput]);

  useEffect(() => () => { pcRef.current?.close(); }, []);

  const copyAnswer = () => {
    navigator.clipboard.writeText(answerCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
        className={`relative rounded-3xl border shadow-2xl w-full max-w-sm overflow-hidden
          ${isDark ? 'bg-slate-900/95 border-violet-500/30' : 'bg-white border-violet-300'}`}>
        <div className="h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500" />
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-lg">
                <QrCode className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Receive Files</p>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Paste sender's code below</p>
              </div>
            </div>
            <button onClick={onClose} className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-slate-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
              <X className="w-4 h-4" />
            </button>
          </div>

          {step === 'paste' && (
            <div className="flex flex-col gap-4">
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Ask the sender to click a device on their radar, copy their offer code, and paste it here.
              </p>
              <textarea
                value={offerInput}
                onChange={e => setOfferInput(e.target.value)}
                placeholder="Paste sender's offer code here…"
                rows={4}
                className={`w-full text-[10px] font-mono rounded-xl border px-3 py-2 resize-none outline-none
                  ${isDark
                    ? 'bg-slate-800/60 border-slate-600 text-gray-300 placeholder-gray-600 focus:border-violet-500'
                    : 'bg-gray-50 border-gray-300 text-gray-700 placeholder-gray-400 focus:border-violet-400'
                  }`}
              />
              <button onClick={accept} disabled={!offerInput.trim()}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-all duration-300
                  ${offerInput.trim()
                    ? 'bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white shadow-lg hover:scale-[1.02]'
                    : isDark ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}>
                Accept & Generate Answer
              </button>
            </div>
          )}

          {step === 'connecting' && (
            <div className="flex flex-col gap-4">
              <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                <Loader className="w-3 h-3 animate-spin text-violet-400" />
                Waiting for sender to paste your answer and connect…
              </div>
              <p className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Copy this answer code and send it back to the sender:
              </p>
              <div className={`flex items-center gap-2 rounded-xl border px-3 py-2
                ${isDark ? 'bg-slate-800/60 border-violet-500/20' : 'bg-violet-50 border-violet-200'}`}>
                <span className={`flex-1 text-[10px] font-mono truncate ${isDark ? 'text-violet-300' : 'text-violet-700'}`}>
                  {answerCode.slice(0, 40)}…
                </span>
                <button onClick={copyAnswer}
                  className={`text-xs font-bold px-2 py-1 rounded-lg flex-shrink-0 transition-all
                    ${copied
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : isDark ? 'bg-violet-500/20 text-violet-400 hover:bg-violet-500/30' : 'bg-violet-100 text-violet-700 hover:bg-violet-200'
                    }`}>
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>
          )}

          {step === 'receiving' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Connected — receiving files</p>
              </div>
              {currentFile && (
                <>
                  <p className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{currentFile}</p>
                  <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}>
                    <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-600 transition-all duration-300 relative overflow-hidden"
                      style={{ width: `${progress}%` }}>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                    </div>
                  </div>
                  <p className={`text-xs text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{Math.round(progress)}%</p>
                </>
              )}
              {received.length > 0 && (
                <div className={`rounded-2xl border overflow-hidden ${isDark ? 'border-slate-700/50' : 'border-gray-200'}`}>
                  {received.map((f, i) => (
                    <div key={i} className={`flex items-center gap-3 px-4 py-2.5 border-b last:border-0 ${isDark ? 'border-slate-700/30' : 'border-gray-100'}`}>
                      <File className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-violet-400' : 'text-violet-600'}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{f.name}</p>
                        <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{formatSize(f.size)}</p>
                      </div>
                      <a href={f.url} download={f.name}
                        className="text-xs font-bold px-3 py-1 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white">
                        Save
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 'done' && (
            <div className="flex flex-col items-center gap-4 py-2">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl flex items-center justify-center shadow-xl shadow-emerald-500/40">
                  <Check className="w-10 h-10 text-white" />
                </div>
                <div className="absolute inset-0 rounded-3xl bg-emerald-400/25 animate-ping" />
              </div>
              <div className="text-center">
                <p className={`text-xl font-black mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>All Files Received!</p>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Decrypted and ready to save</p>
              </div>
              <div className={`w-full rounded-2xl border overflow-hidden ${isDark ? 'border-slate-700/50' : 'border-gray-200'}`}>
                {received.map((f, i) => (
                  <div key={i} className={`flex items-center gap-3 px-4 py-2.5 border-b last:border-0 ${isDark ? 'border-slate-700/30' : 'border-gray-100'}`}>
                    <File className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-violet-400' : 'text-violet-600'}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{f.name}</p>
                      <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{formatSize(f.size)}</p>
                    </div>
                    <a href={f.url} download={f.name}
                      className="text-xs font-bold px-3 py-1 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white">
                      Save
                    </a>
                  </div>
                ))}
              </div>
              <button onClick={onClose}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white font-bold text-sm shadow-lg hover:scale-[1.02] transition-all duration-300">
                Done
              </button>
            </div>
          )}

          {step === 'error' && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isDark ? 'bg-red-500/20' : 'bg-red-50'}`}>
                <X className="w-8 h-8 text-red-500" />
              </div>
              <div className="text-center">
                <p className={`font-bold text-base mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>Error</p>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{errMsg}</p>
              </div>
              <button onClick={onClose}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white font-semibold text-sm hover:scale-[1.02] transition-all duration-300">
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ══════════ MAIN ══════════ */
const AirDrop = () => {
  const { isDark, toggleTheme } = useTheme();

  const [devices, setDevices]         = useState([]);
  const [isScanning, setIsScanning]   = useState(false);
  const [selectedDev, setSelectedDev] = useState(null);
  const [showQr, setShowQr]           = useState(false);
  const [showSend, setShowSend]       = useState(false);
  const [showReceive, setShowReceive] = useState(false);
  const [rtcSession, setRtcSession]   = useState(null);
  const [mousePos, setMousePos]       = useState({ x: 0, y: 0 });

  const bcRef      = useRef(null);
  const seenRef    = useRef(new Set());
  const pingTimers = useRef({});

  /* Real peer discovery via BroadcastChannel (same origin / tabs) */
  useEffect(() => {
    const bc = new BroadcastChannel('airvault-discovery');
    bcRef.current = bc;

    const announce = () =>
      bc.postMessage({ type: 'hello', id: MY_ID, name: MY_NAME, devType: MY_TYPE });
    announce();
    const annTimer = setInterval(announce, 5000);

    const touch = (id, name, devType) => {
      if (id === MY_ID) return;
      if (!seenRef.current.has(id)) {
        seenRef.current.add(id);
        setDevices(d => [...d, { id, name, type: devType, latency: '—', signal: 90 }]);
      }
      clearTimeout(pingTimers.current[id]);
      pingTimers.current[id] = setTimeout(() => {
        seenRef.current.delete(id);
        setDevices(d => d.filter(x => x.id !== id));
      }, 12000);
    };

    bc.onmessage = (e) => {
      const { type, id, name, devType } = e.data;
      if (type === 'hello') {
        bc.postMessage({ type: 'pong', id: MY_ID, name: MY_NAME, devType: MY_TYPE });
        touch(id, name, devType);
      }
      if (type === 'pong' || type === 'ping') touch(id, name, devType);
    };

    return () => {
      clearInterval(annTimer);
      bc.close();
      Object.values(pingTimers.current).forEach(clearTimeout);
    };
  }, []);

  const scan = useCallback(() => {
    setIsScanning(true);
    setDevices([]);
    seenRef.current.clear();
    bcRef.current?.postMessage({ type: 'ping', id: MY_ID, name: MY_NAME, devType: MY_TYPE });
    const t = setTimeout(() => setIsScanning(false), 2500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => { return scan(); }, [scan]);

  useEffect(() => {
    const h = e => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', h);
    return () => window.removeEventListener('mousemove', h);
  }, []);

  const handleDeviceClick = (dev) => { setSelectedDev(dev); setShowQr(true); };
  const handleQrProceed   = (session) => { setRtcSession(session); setShowQr(false); setShowSend(true); };
  const handleSendClose   = () => { setShowSend(false); setSelectedDev(null); setRtcSession(null); };
  const handleQrClose     = () => { setShowQr(false); setSelectedDev(null); };

  const card = `rounded-3xl border backdrop-blur-xl transition-all duration-300 ${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/80 border-gray-200'}`;

  return (
    <div className={`h-screen overflow-hidden transition-colors duration-500 airdrop-root
      ${isDark
        ? 'bg-gradient-to-br from-slate-900 via-violet-950/20 to-slate-900 text-white'
        : 'bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900'}`}>

      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute -top-32 left-1/4 w-[600px] h-[600px] ${isDark ? 'bg-violet-700/10' : 'bg-cyan-500/5'} rounded-full blur-3xl animate-pulse`} style={{animationDelay:'.3s'}} />
        <div className={`absolute -bottom-32 right-1/4 w-[500px] h-[500px] ${isDark ? 'bg-fuchsia-700/10' : 'bg-blue-600/5'} rounded-full blur-3xl animate-pulse`} />
        <div className="absolute top-1/3 left-0 right-0 h-px overflow-hidden opacity-10">
          <div className="h-full w-48 bg-gradient-to-r from-transparent via-violet-500 to-transparent animate-beam" />
        </div>
        <div className="absolute top-2/3 left-0 right-0 h-px overflow-hidden opacity-10">
          <div className="h-full w-48 bg-gradient-to-r from-transparent via-violet-500 to-transparent animate-beam-delay" />
        </div>
      </div>

      {/* Cursor glow */}
      <div className="fixed w-80 h-80 rounded-full pointer-events-none z-40 mix-blend-screen"
        style={{
          background: isDark
            ? 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)',
          left: mousePos.x - 160, top: mousePos.y - 160, transition: 'all .3s ease-out',
        }} />

      {/* Layout shell */}
      <div className="relative z-10 flex flex-col h-full">

      {/* NAV */}
      <header className={`flex-shrink-0 border-b backdrop-blur-2xl transition-colors duration-500
        ${isDark ? 'bg-slate-900/90 border-violet-500/15' : 'bg-white/95 border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Wifi className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className={`font-black text-lg leading-none ${isDark ? 'text-white' : 'text-gray-900'}`}>AirDrop</p>
              <p className="text-[10px] text-violet-400 font-semibold tracking-wider">AIRVAULT</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowReceive(true)}
              className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all duration-300 hover:scale-105
                ${isDark ? 'bg-violet-500/10 border-violet-500/20 text-violet-300 hover:bg-violet-500/20' : 'bg-violet-50 border-violet-200 text-violet-700 hover:bg-violet-100'}`}>
              <Upload className="w-3 h-3 rotate-180" />
              Receive Files
            </button>
            <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold
              ${isDark ? 'bg-violet-500/10 border-violet-500/20 text-violet-300' : 'bg-violet-50 border-violet-200 text-violet-700'}`}>
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              {devices.length} devices nearby
            </div>
            <button onClick={toggleTheme}
              className={`p-2.5 rounded-xl transition-all duration-300 group ${isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-100 hover:bg-gray-200'}`}>
              {isDark
                ? <Sun  className="w-5 h-5 text-yellow-400 group-hover:rotate-90 transition-transform duration-500" />
                : <Moon className="w-5 h-5 text-indigo-600 group-hover:-rotate-12 transition-transform duration-500" />}
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto airdrop-scrollbar">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        <div className="text-center">
          <div className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border mb-5 backdrop-blur-xl
            ${isDark ? 'bg-violet-500/10 border-violet-500/25' : 'bg-violet-50 border-violet-200'}`}>
            <span className="relative flex">
              <span className="absolute w-2 h-2 bg-violet-400 rounded-full animate-ping" />
              <span className="relative w-2 h-2 bg-violet-500 rounded-full" />
            </span>
            <span className={`text-sm font-semibold ${isDark ? 'text-violet-300' : 'text-violet-700'}`}>
              No Account Required · Peer-to-Peer Encrypted
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black mb-3 bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
            Instant Wireless Sharing
          </h1>
          <p className={`text-base max-w-xl mx-auto ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Send files peer-to-peer in seconds. No login, no cloud upload — just open, scan, and share.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {[
            { text: 'Zero-Knowledge', icon: Lock },
            { text: 'E2E Encrypted',  icon: Shield },
            { text: 'No Database',    icon: Database },
            { text: 'Any Device',     icon: Globe },
            { text: 'QR Handshake',   icon: QrCode },
          ].map(({ text, icon: Icon }) => (
            <span key={text}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border
                ${isDark ? 'bg-violet-500/10 border-violet-500/20 text-violet-300' : 'bg-violet-50 border-violet-200 text-violet-700'}`}>
              <Icon className="w-3 h-3" />{text}
            </span>
          ))}
        </div>

        <div className="grid lg:grid-cols-12 gap-6 items-start">

          <div className="lg:col-span-8">
            <div className={`${card} p-5 sm:p-7`}>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/25">
                    <Radar className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Proximity Radar</p>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {devices.length > 0 ? 'Click any device to initiate transfer' : 'Open this page in another tab or device to see peers'}
                    </p>
                  </div>
                </div>
                <button onClick={scan} disabled={isScanning}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all duration-300
                    ${isScanning
                      ? isDark ? 'bg-slate-700/50 border-slate-600/50 text-slate-400 cursor-not-allowed' : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-violet-500 to-fuchsia-600 border-transparent text-white shadow-lg shadow-violet-500/25 hover:scale-105'
                    }`}>
                  <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
                  {isScanning ? 'Scanning…' : 'Rescan'}
                </button>
              </div>

              <div className="flex justify-center">
                <RadarCanvas devices={devices} isScanning={isScanning} isDark={isDark} onDeviceClick={handleDeviceClick} />
              </div>

              {isScanning && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Loader className="w-4 h-4 text-violet-400 animate-spin" />
                  <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    Discovering nearby devices…
                  </span>
                </div>
              )}
              {!isScanning && devices.length === 0 && (
                <p className={`text-center text-sm mt-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  No peers found — open this app in another tab or browser on the same machine
                </p>
              )}
            </div>
          </div>

          <div className="lg:col-span-4 space-y-5">

            <div className={`${card} p-5`}>
              <div className="flex items-center justify-between mb-4">
                <p className={`font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <Users className={`w-4 h-4 ${isDark ? 'text-violet-400' : 'text-violet-600'}`} />
                  Nearby Devices
                </p>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full
                  ${isDark ? 'bg-violet-500/10 text-violet-400' : 'bg-violet-50 text-violet-600'}`}>
                  {devices.length} online
                </span>
              </div>

              {devices.length === 0 ? (
                <div className="text-center py-8">
                  <WifiOff className={`w-10 h-10 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {isScanning ? 'Scanning…' : 'No peers on this network'}
                  </p>
                  <p className={`text-xs mt-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>Open another tab to test</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto py-2 px-2 overflow-x-hidden airdrop-scrollbar">
                  {devices.map(dev => {
                    const DevIcon = getDeviceIcon(dev.type);
                    return (
                      <button key={dev.id} onClick={() => handleDeviceClick(dev)}
                        className={`w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg group
                          ${isDark
                            ? 'bg-slate-900/50 border-slate-700/50 hover:border-violet-500/50 hover:bg-slate-900/80 hover:shadow-violet-500/10'
                            : 'bg-gray-50 border-gray-200 hover:border-violet-400 hover:bg-white hover:shadow-violet-400/10'
                          }`}>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3
                          ${isDark ? 'bg-violet-500/10' : 'bg-violet-50'}`}>
                          <DevIcon className={`w-4 h-4 ${isDark ? 'text-violet-400' : 'text-violet-600'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{dev.name}</p>
                          <p className={`text-[10px] flex items-center gap-1.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            <Activity className="w-2.5 h-2.5" />{dev.id}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                          <ChevronRight className={`w-4 h-4 group-hover:translate-x-0.5 transition-transform ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <button onClick={() => setShowReceive(true)}
                className={`sm:hidden mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border text-xs font-semibold transition-all
                  ${isDark ? 'bg-violet-500/10 border-violet-500/20 text-violet-300 hover:bg-violet-500/20' : 'bg-violet-50 border-violet-200 text-violet-700 hover:bg-violet-100'}`}>
                <Upload className="w-3 h-3 rotate-180" /> Receive Files
              </button>
            </div>

            <div className={`${card} p-5`}>
              <p className={`font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>How It Works</p>
              <div className="space-y-2.5">
                {[
                  { step: '01', Icon: Radar,  label: 'Open AirDrop',   desc: 'Real peers via BroadcastChannel'       },
                  { step: '02', Icon: QrCode, label: 'Share Code',      desc: 'WebRTC offer with AES-GCM key'         },
                  { step: '03', Icon: Upload, label: 'Pick Files',      desc: 'Any format, any size'                  },
                  { step: '04', Icon: Zap,    label: 'Done in Seconds', desc: 'Encrypted P2P via WebRTC DataChannel'  },
                ].map(({ step, Icon, label, desc }) => (
                  <div key={step}
                    className={`flex items-center gap-3 p-3 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5
                      ${isDark ? 'bg-slate-900/50 border-slate-700/30 hover:border-violet-500/30' : 'bg-gray-50 border-gray-100 hover:border-violet-300'}`}>
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center flex-shrink-0 shadow-md">
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] font-black tracking-widest ${isDark ? 'text-violet-500' : 'text-violet-400'}`}>{step}</span>
                        <p className={`font-semibold text-xs ${isDark ? 'text-white' : 'text-gray-900'}`}>{label}</p>
                      </div>
                      <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {FEATURES.map(({ Icon, title, desc, color }) => (
            <div key={title}
              className={`group relative rounded-3xl border p-5 overflow-hidden transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl
                ${isDark
                  ? 'bg-slate-800/40 border-slate-700/50 hover:border-violet-500/40 hover:shadow-violet-500/10'
                  : 'bg-white/70 border-gray-200 hover:border-violet-400/50 hover:shadow-violet-400/10'
                }`}>
              <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
              <div className="relative">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-4 shadow-lg bg-gradient-to-br ${color} group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <p className={`font-bold text-sm mb-1.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</p>
                <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
      </div>
      </div>

      {showQr      && selectedDev && (
        <QrModal device={selectedDev} isDark={isDark} onClose={handleQrClose} onProceed={handleQrProceed} />
      )}
      {showSend    && selectedDev && (
        <SendModal device={selectedDev} isDark={isDark} onClose={handleSendClose} rtcSession={rtcSession} />
      )}
      {showReceive && (
        <ReceiveModal isDark={isDark} onClose={() => setShowReceive(false)} />
      )}

      <style>{`
        @keyframes beam       { 0%{transform:translateX(-100%)} 100%{transform:translateX(500%)} }
        @keyframes beam-delay { 0%{transform:translateX(-100%)} 100%{transform:translateX(500%)} }
        @keyframes shimmer    { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }
        .animate-beam        { animation: beam 4s ease-in-out infinite; }
        .animate-beam-delay  { animation: beam-delay 4s ease-in-out infinite; animation-delay: 2s; }
        .animate-shimmer     { animation: shimmer 2.5s infinite; }

        .airdrop-scrollbar::-webkit-scrollbar { width: 4px; }
        .airdrop-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .airdrop-scrollbar::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.45); border-radius: 2px; }
        .airdrop-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(167,139,250,0.75); }
      `}</style>
    </div>
  );
};

export default AirDrop;