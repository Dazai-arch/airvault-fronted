import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Download, ZoomIn, ZoomOut, RotateCw, Maximize2,
  Minimize2, Lock, Loader2, AlertCircle, Music, File, ShieldOff,
  FileText, Table, Presentation,
} from "lucide-react";
import { decryptToBlob } from "../../services/ZKcrypto";

// ─── helpers ──────────────────────────────────────────────────────────────────
const getExt = (name = "") =>
  name.replace(/\.enc$/i, "").split(".").pop()?.toLowerCase() || "";

const resolvePreviewType = (mimeType = "", name = "") => {
  const cleanName = (name || "").replace(/\.enc$/i, "");
  const ext  = getExt(cleanName);
  const mime = mimeType.toLowerCase();

  if (mime.startsWith("image/") || ["png","jpg","jpeg","gif","webp","svg","bmp","ico","avif","tiff"].includes(ext))
    return "image";
  if (mime.startsWith("video/") || ["mp4","webm","mov","mkv","m4v","ogv","avi","flv","wmv"].includes(ext))
    return "video";
  if (mime.startsWith("audio/") || ["mp3","wav","ogg","flac","aac","m4a","wma","opus"].includes(ext))
    return "audio";
  if (mime === "application/pdf" || ext === "pdf")
    return "pdf";
  // Office formats — rendered via mammoth (docx) or Google Docs Viewer iframe
  if (mime.includes("wordprocessingml") || mime.includes("msword") || ["doc","docx"].includes(ext))
    return "docx";
  if (mime.includes("spreadsheetml") || mime.includes("excel") || ["xls","xlsx","csv"].includes(ext))
    return "spreadsheet";
  if (mime.includes("presentationml") || mime.includes("powerpoint") || ["ppt","pptx"].includes(ext))
    return "presentation";
  // Plain text / code
  if (["txt","md","log","yaml","yml","xml","json","html","htm","css","js","ts","jsx","tsx",
       "py","java","cpp","c","cs","go","rs","php","rb","sh","bash","sql","ini","env",
       "toml","cfg","gitignore","dockerfile","makefile",
       // JVM / mobile
       "kt","kts","gradle","scala","groovy","clj","cljs",
       // systems
       "zig","v","nim","d","asm","s",
       // web / config
       "vue","svelte","astro","mdx","graphql","gql","proto",
       // data / infra
       "tf","hcl","bicep","jsonc","json5","lock","prisma",
       // misc
       "r","m","lua","ex","exs","erl","hrl","hs","ml","mli","fs","fsx",
       "dart","coffee","elm","purs","reason","re","resi"].includes(ext)
      || mime.startsWith("text/"))
    return "text";

  return "unsupported";
};

// ─── Print / context-menu blockers ───────────────────────────────────────────
const usePrintBlock = (blocked) => {
  useEffect(() => {
    if (!blocked) return;
    const style = document.createElement("style");
    style.id = "airvault-print-block";
    style.textContent = `@media print{body *{visibility:hidden!important;display:none!important}body::after{content:"Printing disabled.";visibility:visible!important;display:block!important;font-size:22px;text-align:center;margin-top:40vh;color:#dc2626}}`;
    document.head.appendChild(style);
    const blockKey = (e) => { if ((e.ctrlKey||e.metaKey) && e.key==="p") { e.preventDefault(); e.stopPropagation(); } };
    window.addEventListener("keydown", blockKey, true);
    const origPrint = window.print;
    window.print = () => {};
    const blockBefore = (e) => e.preventDefault();
    window.addEventListener("beforeprint", blockBefore);
    return () => {
      document.getElementById("airvault-print-block")?.remove();
      window.removeEventListener("keydown", blockKey, true);
      window.removeEventListener("beforeprint", blockBefore);
      window.print = origPrint;
    };
  }, [blocked]);
};

const useContextMenuBlock = (blocked) => {
  useEffect(() => {
    if (!blocked) return;
    const h = (e) => e.preventDefault();
    window.addEventListener("contextmenu", h);
    return () => window.removeEventListener("contextmenu", h);
  }, [blocked]);
};

// ─── Mini components ──────────────────────────────────────────────────────────
const CtrlBtn = ({ onClick, disabled, children }) => (
  <button onClick={onClick} disabled={disabled}
    className="flex items-center justify-center px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all min-w-[32px] disabled:opacity-40">
    {children}
  </button>
);
const CenteredLoader = ({ label = "Decrypting & loading…" }) => (
  <div className="h-full flex flex-col items-center justify-center gap-3">
    <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
    <p className="text-xs text-gray-400">{label}</p>
  </div>
);
const ErrorMsg = ({ msg }) => (
  <div className="h-full flex flex-col items-center justify-center gap-3 text-center p-8">
    <AlertCircle className="w-10 h-10 text-red-400" />
    <p className="text-sm text-red-400 font-medium max-w-sm">{msg}</p>
  </div>
);

// ─── Text / Code viewer ───────────────────────────────────────────────────────
// Reads the Blob directly — no fetch, no timeout, no network round-trip
const TextPreview = ({ blob, name, isDark, canDownload }) => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const ext = getExt(name);

  useEffect(() => {
    if (!blob) { setError("No file data available."); setLoading(false); return; }
    blob.text()
      .then(t => { setContent(t); setLoading(false); })
      .catch(e => { setError("Could not read file: " + e.message); setLoading(false); });
  }, [blob]);

  if (loading) return <CenteredLoader />;
  if (error)   return <ErrorMsg msg={error} />;

  // Syntax hint via simple coloring for code files
  const isCode = ["js","ts","jsx","tsx","py","java","cpp","c","cs","go","rs","php","rb",
                   "sh","sql","json","xml","yaml","yml","html","htm","css","toml"].includes(ext);
  return (
    <div className={`h-full flex flex-col ${isDark ? "bg-slate-950" : "bg-gray-50"}`}>
      {isCode && (
        <div className={`flex items-center gap-2 px-4 py-2 border-b text-xs font-mono flex-shrink-0 ${isDark ? "border-slate-700/50 text-gray-500 bg-slate-900" : "border-gray-200 text-gray-400 bg-white"}`}>
          <span className={`px-2 py-0.5 rounded font-bold ${isDark ? "bg-slate-700 text-cyan-400" : "bg-gray-200 text-gray-600"}`}>.{ext}</span>
          {name.replace(/\.enc$/i, "")}
        </div>
      )}
      <pre
        className={`flex-1 overflow-auto p-5 text-xs font-mono leading-relaxed whitespace-pre-wrap break-words vault-scrollbar
          ${isDark ? "text-gray-300" : "text-gray-800"}
          ${!canDownload ? "select-none" : ""}`}
        onCopy={!canDownload ? e => e.preventDefault() : undefined}>
        {content}
      </pre>
    </div>
  );
};

// ─── Image viewer ─────────────────────────────────────────────────────────────
const ImagePreview = ({ url, name, canDownload }) => {
  const [zoom,  setZoom]  = useState(1);
  const [rot,   setRot]   = useState(0);
  const [pos,   setPos]   = useState({ x:0, y:0 });
  const [drag,  setDrag]  = useState(false);
  const [start, setStart] = useState({ x:0, y:0 });

  const onWheel = e => { e.preventDefault(); setZoom(z => Math.min(Math.max(z - e.deltaY*0.001, 0.1), 10)); };
  const onDown  = e => { setDrag(true); setStart({ x: e.clientX-pos.x, y: e.clientY-pos.y }); };
  const onMove  = e => { if(drag) setPos({ x: e.clientX-start.x, y: e.clientY-start.y }); };
  const onUp    = () => setDrag(false);
  const reset   = () => { setZoom(1); setRot(0); setPos({ x:0, y:0 }); };

  return (
    <div className="relative h-full flex flex-col select-none">
      <div
        className="flex-1 overflow-hidden flex items-center justify-center bg-[repeating-conic-gradient(#80808015_0%_25%,transparent_0%_50%)] bg-[length:20px_20px] cursor-grab active:cursor-grabbing"
        onWheel={onWheel} onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}>
        <img
          src={url} alt={name} draggable={false}
          style={{ transform:`translate(${pos.x}px,${pos.y}px) scale(${zoom}) rotate(${rot}deg)`, transition:drag?"none":"transform 0.15s ease" }}
          className={`max-w-none select-none ${!canDownload ? "pointer-events-none" : ""}`}
          onContextMenu={!canDownload ? e => e.preventDefault() : undefined}
        />
      </div>
      <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-black/60 backdrop-blur-sm flex-shrink-0">
        <CtrlBtn onClick={() => setZoom(z => Math.max(z-0.25,0.1))}><ZoomOut className="w-3.5 h-3.5"/></CtrlBtn>
        <span className="text-white/70 text-xs font-mono w-12 text-center">{Math.round(zoom*100)}%</span>
        <CtrlBtn onClick={() => setZoom(z => Math.min(z+0.25,10))}><ZoomIn className="w-3.5 h-3.5"/></CtrlBtn>
        <div className="w-px h-4 bg-white/20 mx-1"/>
        <CtrlBtn onClick={() => setRot(r => r+90)}><RotateCw className="w-3.5 h-3.5"/></CtrlBtn>
        <CtrlBtn onClick={reset}><span className="text-xs">Reset</span></CtrlBtn>
      </div>
    </div>
  );
};

// ─── Video player ─────────────────────────────────────────────────────────────
const VideoPreview = ({ url, mimeType, canDownload }) => (
  <div className="h-full flex items-center justify-center bg-black">
    <video controls autoPlay={false}
      controlsList={!canDownload ? "nodownload nofullscreen" : "nodownload"}
      disablePictureInPicture={!canDownload}
      onContextMenu={!canDownload ? e => e.preventDefault() : undefined}
      className="max-h-full max-w-full">
      <source src={url} type={mimeType || "video/mp4"}/>
      Your browser does not support video playback.
    </video>
  </div>
);

// ─── Audio player ─────────────────────────────────────────────────────────────
const AudioPreview = ({ url, name, isDark, canDownload }) => (
  <div className="h-full flex flex-col items-center justify-center gap-6 p-8">
    <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-lime-500 to-green-600 flex items-center justify-center shadow-2xl shadow-green-500/30 animate-pulse">
      <Music className="w-16 h-16 text-white"/>
    </div>
    <p className={`text-sm font-semibold text-center max-w-xs truncate ${isDark ? "text-white" : "text-gray-900"}`}>
      {name?.replace(/\.enc$/i,"")}
    </p>
    <audio controls autoPlay={false}
      controlsList={!canDownload ? "nodownload" : undefined}
      onContextMenu={!canDownload ? e => e.preventDefault() : undefined}
      className="w-full max-w-sm" style={{ colorScheme: isDark ? "dark" : "light" }}>
      <source src={url}/>
      Your browser does not support audio playback.
    </audio>
  </div>
);

// ─── PDF viewer (PDF.js canvas) ───────────────────────────────────────────────
const PDFPreview = ({ url, isDark, canDownload }) => {
  const [pdf,      setPdf]     = useState(null);
  const [pageNum,  setPageNum] = useState(1);
  const [numPages, setNum]     = useState(0);
  const [scale,    setScale]   = useState(1.2);
  const [loading,  setLoad]    = useState(true);
  const [error,    setErr]     = useState(null);
  const canvasRef  = useRef(null);
  const renderRef  = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const mod = await import("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.min.mjs");
        window.pdfjsLib = mod;
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs";
        const doc = await window.pdfjsLib.getDocument(url).promise;
        setPdf(doc); setNum(doc.numPages); setPageNum(1);
      } catch(e) { setErr("Could not render PDF: " + e.message); }
      finally { setLoad(false); }
    };
    load();
  }, [url]);

  useEffect(() => {
    if (!pdf || !canvasRef.current) return;
    const render = async () => {
      try {
        if (renderRef.current) renderRef.current.cancel();
        const page     = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale });
        const canvas   = canvasRef.current;
        if (!canvas) return;
        canvas.width  = viewport.width;
        canvas.height = viewport.height;
        const task = page.render({ canvasContext: canvas.getContext("2d"), viewport });
        renderRef.current = task;
        await task.promise;
      } catch(e) { if (e?.name !== "RenderingCancelledException") setErr("Render error: " + e.message); }
    };
    render();
  }, [pdf, pageNum, scale]);

  if (loading) return <CenteredLoader label="Loading PDF…"/>;
  if (error)   return <ErrorMsg msg={error}/>;

  return (
    <div className={`h-full flex flex-col ${isDark ? "bg-slate-950" : "bg-gray-100"}`}>
      <div className={`flex items-center justify-center gap-2 px-4 py-2 border-b flex-shrink-0 ${isDark ? "bg-slate-900 border-slate-700/50" : "bg-white border-gray-200"}`}>
        <button onClick={() => setPageNum(p => Math.max(p-1,1))} disabled={pageNum<=1}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all disabled:opacity-40 ${isDark ? "bg-slate-800 border-slate-700 text-gray-300" : "bg-gray-50 border-gray-200 text-gray-600"}`}>‹ Prev</button>
        <span className={`text-xs font-mono px-3 ${isDark ? "text-gray-400" : "text-gray-600"}`}>{pageNum} / {numPages}</span>
        <button onClick={() => setPageNum(p => Math.min(p+1,numPages))} disabled={pageNum>=numPages}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all disabled:opacity-40 ${isDark ? "bg-slate-800 border-slate-700 text-gray-300" : "bg-gray-50 border-gray-200 text-gray-600"}`}>Next ›</button>
        <div className={`w-px h-4 mx-1 ${isDark ? "bg-slate-700" : "bg-gray-300"}`}/>
        <button onClick={() => setScale(s => Math.max(s-0.2,0.4))}
          className={`p-1.5 rounded-lg border transition-all ${isDark ? "bg-slate-800 border-slate-700 text-gray-400" : "bg-gray-50 border-gray-200 text-gray-500"}`}><ZoomOut className="w-3.5 h-3.5"/></button>
        <span className={`text-xs font-mono w-10 text-center ${isDark ? "text-gray-400" : "text-gray-600"}`}>{Math.round(scale*100)}%</span>
        <button onClick={() => setScale(s => Math.min(s+0.2,3))}
          className={`p-1.5 rounded-lg border transition-all ${isDark ? "bg-slate-800 border-slate-700 text-gray-400" : "bg-gray-50 border-gray-200 text-gray-500"}`}><ZoomIn className="w-3.5 h-3.5"/></button>
      </div>
      <div className="flex-1 overflow-auto vault-scrollbar flex justify-center p-4">
        <canvas ref={canvasRef} className="shadow-2xl"
          style={{ maxWidth:"100%", userSelect: canDownload ? "auto" : "none" }}
          onContextMenu={!canDownload ? e => e.preventDefault() : undefined}/>
      </div>
    </div>
  );
};

// ─── Mammoth loader (loads once via script tag, not dynamic import) ───────────
let mammothLoadPromise = null;
function loadMammoth() {
  if (window.mammoth) return Promise.resolve(window.mammoth);
  if (mammothLoadPromise) return mammothLoadPromise;
  mammothLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js";
    script.onload = () => {
      if (window.mammoth) resolve(window.mammoth);
      else reject(new Error("mammoth loaded but window.mammoth not found"));
    };
    script.onerror = () => reject(new Error("Failed to load mammoth.js from CDN"));
    document.head.appendChild(script);
  });
  return mammothLoadPromise;
}

// ─── DOCX Viewer (mammoth → HTML) ────────────────────────────────────────────
const DocxPreview = ({ blob, isDark, canDownload }) => {
  const [html,    setHtml]    = useState("");
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!blob) return;
    const convert = async () => {
      try {
        const mammoth = await loadMammoth();
        const arrayBuf = await blob.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuf });
        setHtml(result.value);
      } catch(e) {
        setError("Could not render document: " + e.message);
      } finally {
        setLoading(false);
      }
    };
    convert();
  }, [blob]);

  if (loading) return <CenteredLoader label="Converting document…"/>;
  if (error)   return <ErrorMsg msg={error}/>;

  return (
    <div className={`h-full overflow-auto vault-scrollbar ${isDark ? "bg-slate-50" : "bg-white"}`}>
      <div className="max-w-4xl mx-auto px-8 py-10 bg-white min-h-full shadow-lg"
        style={{ userSelect: canDownload ? "auto" : "none" }}
        onCopy={!canDownload ? e => e.preventDefault() : undefined}
        onContextMenu={!canDownload ? e => e.preventDefault() : undefined}>
        <div
          className="prose prose-sm max-w-none docx-preview"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
      <style>{`
        .docx-preview table { border-collapse: collapse; width: 100%; margin: 1em 0; }
        .docx-preview td, .docx-preview th { border: 1px solid #d1d5db; padding: 6px 10px; }
        .docx-preview img { max-width: 100%; height: auto; }
        .docx-preview p { margin: 0.5em 0; line-height: 1.6; }
        .docx-preview h1,.docx-preview h2,.docx-preview h3 { font-weight: 700; margin: 1em 0 0.5em; }
        .docx-preview h1 { font-size: 1.5em; } .docx-preview h2 { font-size: 1.25em; }
      `}</style>
    </div>
  );
};

// ─── SheetJS loader ───────────────────────────────────────────────────────────
let xlsxLoadPromise = null;
function loadXLSX() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  if (xlsxLoadPromise) return xlsxLoadPromise;
  xlsxLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    script.onload = () => {
      if (window.XLSX) resolve(window.XLSX);
      else reject(new Error("XLSX loaded but window.XLSX not found"));
    };
    script.onerror = () => reject(new Error("Failed to load SheetJS from CDN"));
    document.head.appendChild(script);
  });
  return xlsxLoadPromise;
}

// ─── Spreadsheet / CSV viewer ─────────────────────────────────────────────────
const SpreadsheetPreview = ({ blob, name, isDark, canDownload }) => {
  const [rows,    setRows]    = useState([]);
  const [headers, setHeaders] = useState([]);
  const [sheets,  setSheets]  = useState([]);
  const [sheet,   setSheet]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const ext = getExt(name);

  useEffect(() => {
    if (!blob) return;
    const parse = async () => {
      try {
        if (ext === "csv") {
          // CSV: parse manually
          const text = await blob.text();
          const lines = text.split(/\r?\n/).filter(Boolean);
          if (lines.length === 0) { setRows([]); setHeaders([]); return; }
          const parseCSVLine = (line) => {
            const result = []; let cur = "", inQ = false;
            for (let i = 0; i < line.length; i++) {
              const ch = line[i];
              if (ch === '"' && (i===0 || line[i-1]===',')) { inQ = true; continue; }
              if (ch === '"' && inQ && line[i+1] === '"') { cur += '"'; i++; continue; }
              if (ch === '"' && inQ) { inQ = false; continue; }
              if (ch === ',' && !inQ) { result.push(cur); cur = ""; continue; }
              cur += ch;
            }
            result.push(cur);
            return result;
          };
          setHeaders(parseCSVLine(lines[0]));
          setRows(lines.slice(1).map(parseCSVLine));
        } else {
          // XLSX: use SheetJS
          const XLSX = await loadXLSX();
          const ab = await blob.arrayBuffer();
          const wb = XLSX.read(ab, { type: "array" });
          setSheets(wb.SheetNames);
          const ws = wb.Sheets[wb.SheetNames[sheet]];
          const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
          setHeaders((data[0] || []).map(String));
          setRows(data.slice(1));
        }
      } catch(e) {
        setError("Could not parse spreadsheet: " + e.message);
      } finally {
        setLoading(false);
      }
    };
    parse();
  }, [blob, sheet, ext]);

  if (loading) return <CenteredLoader label="Parsing spreadsheet…"/>;
  if (error)   return <ErrorMsg msg={error}/>;

  return (
    <div className={`h-full flex flex-col ${isDark ? "bg-slate-950" : "bg-gray-50"}`}>
      {sheets.length > 1 && (
        <div className={`flex gap-1 px-4 py-2 border-b overflow-x-auto flex-shrink-0 vault-scrollbar ${isDark ? "border-slate-700/50 bg-slate-900" : "border-gray-200 bg-white"}`}>
          {sheets.map((s,i) => (
            <button key={s} onClick={() => { setSheet(i); setLoading(true); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                i === sheet
                  ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
                  : isDark ? "text-gray-400 hover:bg-slate-700" : "text-gray-600 hover:bg-gray-100"
              }`}>{s}</button>
          ))}
        </div>
      )}
      <div className="flex-1 overflow-auto vault-scrollbar">
        <table className="border-collapse text-xs min-w-full"
          style={{ userSelect: canDownload ? "auto" : "none" }}
          onContextMenu={!canDownload ? e => e.preventDefault() : undefined}>
          <thead>
            <tr>
              <th className={`px-3 py-2 text-center font-mono border sticky left-0 z-10 w-10 ${isDark ? "bg-slate-800 border-slate-700 text-gray-500" : "bg-gray-100 border-gray-200 text-gray-400"}`}>#</th>
              {headers.map((h,i) => (
                <th key={i} className={`px-4 py-2 font-bold text-left border whitespace-nowrap sticky top-0 ${isDark ? "bg-slate-800 border-slate-700 text-emerald-400" : "bg-gray-100 border-gray-200 text-emerald-700"}`}>
                  {h || <span className="text-gray-400">Col {i+1}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 1000).map((row, ri) => (
              <tr key={ri} className={ri % 2 === 0 ? (isDark ? "bg-slate-900/40" : "bg-white") : (isDark ? "bg-slate-800/20" : "bg-gray-50/50")}>
                <td className={`px-3 py-1.5 text-center font-mono border ${isDark ? "border-slate-700/50 text-gray-600" : "border-gray-100 text-gray-400"}`}>{ri+1}</td>
                {headers.map((_,ci) => (
                  <td key={ci} className={`px-4 py-1.5 border whitespace-nowrap max-w-[300px] overflow-hidden text-ellipsis ${isDark ? "border-slate-700/40 text-gray-300" : "border-gray-100 text-gray-700"}`}>
                    {String(row[ci] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length > 1000 && (
          <div className={`text-center py-3 text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>
            Showing first 1,000 of {rows.length} rows. Download to view all.
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Presentation viewer (PPTX → slide thumbnails via PptxGenJS parse) ───────
const PresentationPreview = ({ blob, name, onDownload, isDark, canDownload }) => {
  const [objectUrl, setObjectUrl] = useState(null);

  useEffect(() => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [blob]);

  return (
    <div className="h-full flex flex-col items-center justify-center gap-6 p-8 text-center">
      <div
        className={`w-24 h-24 rounded-3xl flex items-center justify-center shadow-xl ${
          isDark
            ? "bg-orange-500/20 border border-orange-500/30"
            : "bg-orange-50 border border-orange-200"
        }`}
      >
        <FileText className="w-12 h-12 text-orange-400" />
      </div>

      <div>
        <p
          className={`text-lg font-bold mb-2 ${
            isDark ? "text-white" : "text-gray-900"
          }`}
        >
          {name?.replace(/\.enc$/i, "")}
        </p>
        <p
          className={`text-sm mb-1 ${
            isDark ? "text-gray-400" : "text-gray-500"
          }`}
        >
          PowerPoint presentations cannot be previewed in the browser.
        </p>
        <p className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>
          Download to open in PowerPoint, LibreOffice Impress, or Google Slides.
        </p>
      </div>

      {canDownload ? (
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={onDownload}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/25 hover:scale-[1.02] transition-all"
          >
            <Download className="w-4 h-4" />
            Download Presentation
          </button>

          {objectUrl && (
            <button
              onClick={() => {
                const a = document.createElement("a");
                a.href = objectUrl;
                a.download = name?.replace(/\.enc$/i, "") || "presentation.pptx";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
              }}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold border transition-all hover:scale-[1.02] ${
                isDark
                  ? "border-orange-500/40 text-orange-400 hover:bg-orange-500/10"
                  : "border-orange-300 text-orange-500 hover:bg-orange-50"
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              Save File Directly
            </button>
          )}
        </div>
      ) : (
        <p
          className={`text-xs px-4 py-2.5 rounded-xl border ${
            isDark
              ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
              : "bg-amber-50 border-amber-200 text-amber-600"
          }`}
        >
          You don&apos;t have permission to download this file.
        </p>
      )}
    </div>
  );
};

// ─── Unsupported ──────────────────────────────────────────────────────────────
const UnsupportedPreview = ({ name, ext, onDownload, isDark, canDownload }) => (
  <div className="h-full flex flex-col items-center justify-center gap-4 p-8 text-center">
    <div className={`w-20 h-20 rounded-3xl flex items-center justify-center ${isDark ? "bg-slate-700" : "bg-gray-100"}`}>
      <File className={`w-10 h-10 ${isDark ? "text-gray-400" : "text-gray-500"}`}/>
    </div>
    <div>
      <p className={`text-base font-bold mb-1 ${isDark ? "text-white" : "text-gray-900"}`}>Preview not available</p>
      <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
        <strong>.{ext || "Unknown"}</strong> files cannot be previewed in the browser.
      </p>
    </div>
    {canDownload ? (
      <button onClick={onDownload}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:scale-[1.02] transition-all">
        <Download className="w-4 h-4"/> Download to view
      </button>
    ) : (
      <p className={`text-xs px-4 py-2.5 rounded-xl border ${isDark ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-amber-50 border-amber-200 text-amber-600"}`}>
        You don&apos;t have permission to download this file.
      </p>
    )}
  </div>
);

// ─── MAIN MODAL ───────────────────────────────────────────────────────────────
export default function FilePreviewModal({
  file,
  onClose,
  onDownload,
  isDark,
  vaultId,
  apiBaseUrl,
  canDownload = true,
  vaultKey,
  blobUrl: externalBlobUrl,
}) {
  const [blobUrl,     setBlobUrl]  = useState(externalBlobUrl || null);
  const [blob,        setBlob]     = useState(null); // raw Blob for Office parsers
  const [loading,     setLoading]  = useState(!externalBlobUrl);
  const [error,       setError]    = useState(null);
  const [fullscreen,  setFull]     = useState(false);
  const [downloading, setDl]       = useState(false);

  const mimeType    = file?.mimeType || "application/octet-stream";
  const cleanName   = file?.name?.replace(/\.enc$/i,"") || "";
  const previewType = resolvePreviewType(mimeType, cleanName);
  const ext         = getExt(cleanName);

  usePrintBlock(!canDownload);
  useContextMenuBlock(!canDownload && ["image","text"].includes(previewType));

  // ── Fetch + (optionally) decrypt ──────────────────────────────────────────
  useEffect(() => {
    if (externalBlobUrl || !file || !vaultId) return;
    if (previewType === "unsupported") { setLoading(false); return; }

    let revoked = false;
    const go = async () => {
  setLoading(true); setError(null);
  try {
    console.log("=== PREVIEW START ===");
    console.log("file:", file);
    console.log("vaultId:", vaultId);
    console.log("vaultKey:", vaultKey);
    console.log("previewType:", previewType);

    const token = localStorage.getItem("token") || sessionStorage.getItem("token");

    // 1. Get download URL
    const dlRes = await fetch(
      `${apiBaseUrl}/vaults/${vaultId}/files/${file.id}/download`,
      { headers: { Authorization: `Bearer ${token}` }, credentials: "include" }
    );
    console.log("dlRes status:", dlRes.status);
    const dlData = await dlRes.json();
    console.log("dlData:", dlData);

    if (!dlRes.ok) throw new Error("Could not get download URL");
    const { downloadUrl, localPath } = dlData;

    // 2. Fetch raw bytes
    const fileRes = await fetch(downloadUrl || localPath);
    console.log("fileRes status:", fileRes.status);
    console.log("fileRes ok:", fileRes.ok);
    
    const buf = await fileRes.arrayBuffer();
    console.log("buf byteLength:", buf.byteLength);

    // 3. Decrypt if needed
    let finalBlob;
    if (file.isEncrypted) {
      console.log("vaultKey present:", !!vaultKey);
      if (!vaultKey) throw new Error("Vault is locked.");
      finalBlob = await decryptToBlob(buf, vaultKey, mimeType);
      console.log("decrypted blob size:", finalBlob.size);
    } else {
      finalBlob = new Blob([buf], { type: mimeType });
      console.log("plain blob size:", finalBlob.size);
    }

    if (!revoked) {
      setBlob(finalBlob);
      setBlobUrl(URL.createObjectURL(finalBlob));
      console.log("=== PREVIEW SUCCESS ===");
    }
  } catch(e) {
    console.error("=== PREVIEW ERROR ===", e);
    if (!revoked) setError(e.message || "Failed to load file");
  } finally {
    if (!revoked) setLoading(false);
  }
};
    go();
    return () => {
      revoked = true;
      if (blobUrl && !externalBlobUrl) URL.revokeObjectURL(blobUrl);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file?.id, vaultKey, previewType]);

  useEffect(() => {
    return () => { if (blobUrl && !externalBlobUrl) URL.revokeObjectURL(blobUrl); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const h = e => e.key === "Escape" && (fullscreen ? setFull(false) : onClose());
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [fullscreen, onClose]);

  const handleDownload = useCallback(async () => {
    if (!canDownload) return;
    setDl(true);
    try { await onDownload(file); } finally { setDl(false); }
  }, [file, onDownload, canDownload]);

  // ── Render content by type ─────────────────────────────────────────────────
  const renderContent = () => {
    if (loading) return <CenteredLoader/>;
    if (error)   return <ErrorMsg msg={error}/>;

    // Office types need the raw blob, not a blobUrl
    if (previewType === "docx" && blob)
      return <DocxPreview blob={blob} isDark={isDark} canDownload={canDownload}/>;
    if (previewType === "spreadsheet" && blob)
      return <SpreadsheetPreview blob={blob} name={cleanName} isDark={isDark} canDownload={canDownload}/>;
    if (previewType === "presentation" && blob)
      return <PresentationPreview blob={blob} name={cleanName} onDownload={handleDownload} isDark={isDark} canDownload={canDownload}/>;

    // Types that use blobUrl
    if (blobUrl) {
      switch (previewType) {
        case "image":   return <ImagePreview url={blobUrl} name={cleanName} canDownload={canDownload}/>;
        case "video":   return <VideoPreview url={blobUrl} mimeType={mimeType} canDownload={canDownload}/>;
        case "audio":   return <AudioPreview url={blobUrl} name={cleanName} isDark={isDark} canDownload={canDownload}/>;
        case "pdf":     return <PDFPreview   url={blobUrl} isDark={isDark} canDownload={canDownload}/>;
        case "text":    return <TextPreview  blob={blob} name={cleanName} isDark={isDark} canDownload={canDownload}/>;
        default: break;
      }
    }

    return <UnsupportedPreview name={cleanName} ext={ext} onDownload={handleDownload} isDark={isDark} canDownload={canDownload}/>;
  };

  // ── Panel sizing ───────────────────────────────────────────────────────────
  const wrapCls  = fullscreen ? "fixed inset-0 z-[60]" : "fixed inset-0 z-50 flex items-center justify-center p-4";
  const panelCls = fullscreen
    ? `w-full h-full flex flex-col ${isDark ? "bg-slate-900" : "bg-white"}`
    : `w-full max-w-5xl h-[88vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl border ${isDark ? "bg-slate-900 border-slate-700/60" : "bg-white border-gray-200"}`;

  // Type badge colours
  const TYPE_COLORS = {
    image:"from-violet-500 to-purple-600", video:"from-pink-500 to-rose-600",
    audio:"from-lime-500 to-green-600", pdf:"from-red-500 to-rose-600",
    docx:"from-blue-500 to-indigo-600", spreadsheet:"from-emerald-500 to-teal-600",
    presentation:"from-orange-500 to-amber-600", text:"from-gray-500 to-slate-600",
    unsupported:"from-slate-500 to-gray-600",
  };
  const typeGradient = TYPE_COLORS[previewType] || TYPE_COLORS.unsupported;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        onClick={!fullscreen ? onClose : undefined}
        className={wrapCls}
        style={!fullscreen ? { background: isDark ? "rgba(0,0,0,0.85)" : "rgba(0,0,0,0.6)", backdropFilter:"blur(8px)" } : {}}>

        <motion.div
          initial={fullscreen ? {} : { opacity:0, scale:0.96, y:20 }}
          animate={fullscreen ? {} : { opacity:1, scale:1, y:0 }}
          exit={fullscreen ? {} : { opacity:0, scale:0.96, y:20 }}
          transition={{ type:"spring", damping:28, stiffness:300 }}
          onClick={e => e.stopPropagation()}
          className={`${panelCls} relative`}>

          {/* Top accent bar */}
          <div className={`h-[3px] bg-gradient-to-r ${typeGradient} flex-shrink-0`}/>

          {/* Header */}
          <div className={`flex items-center gap-3 px-4 py-3 border-b flex-shrink-0 ${isDark ? "border-slate-700/50" : "border-gray-200"}`}>
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-bold truncate ${isDark ? "text-white" : "text-gray-900"}`}>{cleanName}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${isDark ? "bg-slate-700 text-gray-400" : "bg-gray-100 text-gray-500"}`}>{ext || "FILE"}</span>
                {file?.isEncrypted && (
                  <span className={`flex items-center gap-1 text-[10px] font-semibold ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>
                    <Lock className="w-2.5 h-2.5"/> ZK Encrypted
                  </span>
                )}
                {!canDownload && (
                  <span className={`flex items-center gap-1 text-[10px] font-semibold ${isDark ? "text-amber-400" : "text-amber-600"}`}>
                    <ShieldOff className="w-2.5 h-2.5"/> View only
                  </span>
                )}
                <span className={`text-[10px] capitalize px-1.5 py-0.5 rounded-full ${isDark ? "bg-gradient-to-r " + typeGradient + " text-white/80" : "bg-gray-100 text-gray-500"}`} style={{ backgroundClip: isDark ? "unset" : undefined }}>
                  {previewType}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              {canDownload && (
                <button onClick={handleDownload} disabled={downloading}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all disabled:opacity-60 ${isDark ? "bg-slate-800 border-slate-700 text-gray-300 hover:border-cyan-500/50 hover:text-cyan-400" : "bg-gray-50 border-gray-200 text-gray-600 hover:border-cyan-400 hover:text-cyan-600"}`}>
                  {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Download className="w-3.5 h-3.5"/>}
                  {downloading ? "Decrypting…" : "Download"}
                </button>
              )}
              <button onClick={() => setFull(f => !f)}
                className={`p-2 rounded-xl border transition-all ${isDark ? "bg-slate-800 border-slate-700 text-gray-400 hover:text-white" : "bg-gray-50 border-gray-200 text-gray-500 hover:text-gray-900"}`}>
                {fullscreen ? <Minimize2 className="w-4 h-4"/> : <Maximize2 className="w-4 h-4"/>}
              </button>
              <button onClick={onClose}
                className={`p-2 rounded-xl border transition-all ${isDark ? "bg-slate-800 border-slate-700 text-gray-400 hover:text-white hover:border-red-500/40" : "bg-gray-50 border-gray-200 text-gray-500 hover:text-red-600"}`}>
                <X className="w-4 h-4"/>
              </button>
            </div>
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-hidden relative">
            {renderContent()}
          </div>

          {/* View-only watermark */}
          {!canDownload && (
            <div className="absolute inset-0 pointer-events-none select-none overflow-hidden flex items-center justify-center z-10">
              <p className={`rotate-[-30deg] text-6xl font-black tracking-widest opacity-[0.035] whitespace-nowrap ${isDark ? "text-white" : "text-black"}`}>VIEW ONLY</p>
            </div>
          )}
        </motion.div>
      </motion.div>

      <style>{`
        .vault-scrollbar::-webkit-scrollbar{width:4px;height:4px}
        .vault-scrollbar::-webkit-scrollbar-track{background:transparent}
        .vault-scrollbar::-webkit-scrollbar-thumb{background:rgba(6,182,212,.4);border-radius:2px}
        .vault-scrollbar::-webkit-scrollbar-thumb:hover{background:rgba(6,182,212,.65)}
      `}</style>
    </AnimatePresence>
  );
}