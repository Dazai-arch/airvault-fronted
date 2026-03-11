import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";

const r = (a, b) => Math.random() * (b - a) + a;
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&";
const scramble = (target, frame, total) => {
  const p = frame / total;
  return target.split("").map((ch, i) =>
    ch === " " ? " " : i / target.length < p ? ch : CHARS[Math.floor(Math.random() * CHARS.length)]
  ).join("");
};

const ScrambleText = ({ text, run, duration = 1000 }) => {
  const [display, setDisplay] = useState(text);
  useEffect(() => {
    if (!run) return;
    const frames = duration / 30; let f = 0;
    const iv = setInterval(() => {
      f++; setDisplay(scramble(text, f, frames));
      if (f >= frames) { clearInterval(iv); setDisplay(text); }
    }, 30);
    return () => clearInterval(iv);
  }, [run, text, duration]);
  return <span>{display}</span>;
};

export default function LoadingScreen({ onLoadingComplete }) {
  const { isDark } = useTheme();

  const [pct, setPct]     = useState(0);
  const [phase, setPhase] = useState(0);
  const [done, setDone]   = useState(false);
  const [tilt, setTilt]   = useState({ x: 0, y: 0 });
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });
  const targetTilt        = useRef({ x: 0, y: 0 });
  const rafRef            = useRef(null);

  const [stars]  = useState(() => [...Array(14)].map((_, i) => ({ id: i, top: `${r(0,80)}%`, left: `${r(-5,50)}%`, len: `${r(90,210)}px`, del: `${r(0,10)}s`, dur: `${r(2.5,5)}s` })));
  const [sparks] = useState(() => [...Array(50)].map((_, i) => ({ id: i, cx: r(5,95), cy: r(5,95), size: r(1.5,4.5), dur: r(4,10), del: r(0,7), dx: r(-60,60), dy: r(-80,-10) })));
  const [floats] = useState(() => [...Array(8)].map((_, i) => ({ id: i, x: r(5,90), y: r(10,85), size: r(18,55), dur: r(6,14), del: r(0,8), depth: r(0.2,1) })));

  useEffect(() => {
    const lerp = (a, b, t) => a + (b - a) * t;
    const tick = () => {
      setTilt(prev => {
        const nx = lerp(prev.x, targetTilt.current.x, 0.06);
        const ny = lerp(prev.y, targetTilt.current.y, 0.06);
        if (Math.abs(nx - prev.x) < 0.001 && Math.abs(ny - prev.y) < 0.001) return prev;
        return { x: nx, y: ny };
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const onMouseMove = useCallback((e) => {
    const nx = e.clientX / window.innerWidth;
    const ny = e.clientY / window.innerHeight;
    setMouse({ x: nx, y: ny });
    targetTilt.current = { x: (ny - 0.5) * -18, y: (nx - 0.5) * 18 };
  }, []);
  const onMouseLeave = useCallback(() => {
    targetTilt.current = { x: 0, y: 0 };
    setMouse({ x: 0.5, y: 0.5 });
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseleave", onMouseLeave);
    return () => { window.removeEventListener("mousemove", onMouseMove); window.removeEventListener("mouseleave", onMouseLeave); };
  }, [onMouseMove, onMouseLeave]);

  useEffect(() => {
    const ts = [
      setTimeout(() => setPhase(1),  500),
      setTimeout(() => setPhase(2), 1600),
      setTimeout(() => setPhase(3), 2700),
      setTimeout(() => setPhase(4), 3700),
      setTimeout(() => setDone(true), 4100),
      setTimeout(() => onLoadingComplete?.(), 4900),
    ];
    const iv = setInterval(() =>
      setPct(p => { if (p >= 100) { clearInterval(iv); return 100; } return p + 1; }), 42
    );
    return () => { ts.forEach(clearTimeout); clearInterval(iv); };
  }, [onLoadingComplete]);

  const PHASES = ["BOOT", "SCAN", "CIPHER", "VERIFY", "SECURED"];
  const ROWS = [
    { label: "End-to-End Encryption",      tag: "AES-256-GCM", t: 23 },
    { label: "Zero-Knowledge Architecture",tag: "ZK-STARK",    t: 47 },
    { label: "Secure Data Transfer",       tag: "TLS 1.3",     t: 70 },
    { label: "Military-Grade Security",    tag: "ACTIVE",      t: 91 },
  ];

  const mpx = (depth) => `${(mouse.x - 0.5) * depth * -28}px`;
  const mpy = (depth) => `${(mouse.y - 0.5) * depth * -28}px`;

  const D = {
    rootBg:          "#020408",
    meshBg:          `radial-gradient(ellipse 100% 60% at 50% -5%,rgba(61,123,255,.28) 0%,transparent 65%),
                      radial-gradient(ellipse 70% 50% at 85% 90%,rgba(176,111,255,.2) 0%,transparent 60%),
                      radial-gradient(ellipse 55% 45% at 0% 65%,rgba(0,245,196,.15) 0%,transparent 55%),
                      radial-gradient(ellipse 40% 35% at 50% 110%,rgba(255,78,205,.1) 0%,transparent 60%)`,
    floorLine:       "rgba(0,245,196,.12)", gridLine: "rgba(255,255,255,.022)",
    a1:"#00f5c4", a2:"#3d7bff", a3:"#b06fff", a4:"#ff4ecd",
    nameBg:          "linear-gradient(130deg,#fff 0%,#00f5c4 35%,#3d7bff 65%,#b06fff 100%)",
    nameShadow:      "drop-shadow(0 2px 0 rgba(0,245,196,.18)) drop-shadow(0 8px 20px rgba(0,245,196,.15))",
    subColor:        "rgba(255,255,255,.3)",
    phaseColor:      "rgba(255,255,255,.35)",
    labelDim:        "rgba(255,255,255,.25)",
    labelDone:       "rgba(255,255,255,.72)",
    labelActive:     "rgba(255,255,255,.52)",
    statusDim:       "rgba(255,255,255,.13)",
    btTagColor:      "rgba(255,255,255,.18)",
    trackBg:         "rgba(255,255,255,.05)",
    trackBorder:     "rgba(255,255,255,.05)",
    trackShadow:     "inset 0 1px 3px rgba(0,0,0,.5),0 1px 0 rgba(255,255,255,.04)",
    fillBar:         "linear-gradient(90deg,#00f5c4,#3d7bff,#b06fff)",
    fillDone:        "linear-gradient(90deg,#00f5c4,#0df2a0)",
    shimAlpha:       ".45",
    rowBg:           "rgba(255,255,255,.012)", rowBorder: "rgba(255,255,255,.04)",
    rowDoneBg:       "rgba(0,245,196,.04)",    rowDoneBorder: "rgba(0,245,196,.15)",
    rowActiveBg:     "rgba(61,123,255,.06)",   rowActiveBorder: "rgba(61,123,255,.22)",
    rowScanColor:    "rgba(0,245,196,.04)",
    rowBoxShadow:    "0 2px 0 rgba(0,0,0,.3),0 1px 0 rgba(255,255,255,.03) inset",
    tagBg:           "rgba(255,255,255,.03)",  tagBorder: "rgba(255,255,255,.07)", tagColor: "rgba(255,255,255,.22)",
    tagDoneBg:       "rgba(0,245,196,.08)",    tagDoneBorder: "rgba(0,245,196,.3)",
    tagActiveBg:     "rgba(61,123,255,.08)",   tagActiveBorder: "rgba(61,123,255,.3)",
    pipDim:          "rgba(255,255,255,.09)",
    scanlines:       "rgba(0,0,0,.022)",
    noiseOpacity:    ".5",
    cornerPulseFrom: ".18", cornerPulseTo: ".52",
    cornerStroke:    "rgba(0,245,196,.75)",
    shootTrail:      "rgba(255,255,255,.9) 50%,rgba(0,245,196,.7)",
    sparkColor:      "#00f5c4",  sparkOpacity: ".7",
    glare:           "rgba(255,255,255,.1)",
    lineOpacity:     ".3",
    floorOpacity:    "1",
    glowBg:          "radial-gradient(circle,rgba(0,245,196,.38),rgba(61,123,255,.18) 55%,transparent 70%)",
    ring1Color:      "rgba(0,245,196,.12)", ring2Color: "rgba(176,111,255,.1)", ring3Color: "rgba(61,123,255,.14)",
    blob0:           "rgba(0,245,196,.08)", blob1: "rgba(61,123,255,.07)", blob2: "rgba(176,111,255,.07)",
    hexGradA:        "rgba(0,245,196,.6)", hexGradB: "rgba(61,123,255,.5)",
    hexStroke:       "rgba(0,245,196,.7)", hexInner: "rgba(255,255,255,.12)",
    hexExtrude:      "rgba(0,245,196,.25)",
    hexSvgShadow:    "drop-shadow(0 0 16px rgba(0,245,196,.45))",
    ringTop:         "rgba(0,245,196,.2)", ringBottom: "rgba(176,111,255,.22)", ringBorder3: "rgba(61,123,255,.3)",
    orbit:           ["#00f5c4","#3d7bff","#b06fff","#ff4ecd"],
    aurora: [
      "radial-gradient(circle,rgba(0,245,196,.25),transparent 65%)",
      "radial-gradient(circle,rgba(61,123,255,.22),transparent 65%)",
      "radial-gradient(circle,rgba(176,111,255,.2),transparent 65%)",
      "radial-gradient(circle,rgba(255,78,205,.15),transparent 65%)",
      "radial-gradient(circle,rgba(0,245,196,.13),transparent 65%)",
    ],
    abPositions: [
      {top:"-20%",left:"5%"},{top:"15%",right:"-12%"},{bottom:"-15%",left:"25%"},{top:"55%",left:"-8%"},{bottom:"5%",right:"0%"},
    ],
  };
  const L = {
    rootBg:          "#f0f4ff",
    meshBg:          `radial-gradient(ellipse 100% 60% at 50% -5%,rgba(37,99,235,.2) 0%,transparent 65%),
                      radial-gradient(ellipse 70% 50% at 85% 90%,rgba(124,58,237,.15) 0%,transparent 60%),
                      radial-gradient(ellipse 55% 45% at 0% 65%,rgba(0,150,110,.12) 0%,transparent 55%),
                      radial-gradient(ellipse 40% 35% at 50% 110%,rgba(219,39,119,.08) 0%,transparent 60%)`,
    floorLine:       "rgba(0,140,100,.14)", gridLine: "rgba(15,23,42,.04)",
    a1:"#00a87a", a2:"#2563eb", a3:"#7c3aed", a4:"#db2777",
    nameBg:          "linear-gradient(130deg,#0f172a 0%,#00a87a 35%,#2563eb 65%,#7c3aed 100%)",
    nameShadow:      "drop-shadow(0 2px 0 rgba(0,168,122,.15)) drop-shadow(0 8px 20px rgba(0,168,122,.12))",
    subColor:        "rgba(15,23,42,.45)",
    phaseColor:      "rgba(15,23,42,.4)",
    labelDim:        "rgba(15,23,42,.4)",
    labelDone:       "rgba(15,23,42,.82)",
    labelActive:     "rgba(15,23,42,.62)",
    statusDim:       "rgba(15,23,42,.22)",
    btTagColor:      "rgba(15,23,42,.35)",
    trackBg:         "rgba(15,23,42,.07)",
    trackBorder:     "rgba(15,23,42,.06)",
    trackShadow:     "inset 0 1px 3px rgba(0,0,0,.08),0 1px 0 rgba(255,255,255,.6)",
    fillBar:         "linear-gradient(90deg,#00a87a,#2563eb,#7c3aed)",
    fillDone:        "linear-gradient(90deg,#00a87a,#06c47a)",
    shimAlpha:       ".55",
    rowBg:           "rgba(255,255,255,.6)",   rowBorder: "rgba(15,23,42,.07)",
    rowDoneBg:       "rgba(0,168,122,.07)",    rowDoneBorder: "rgba(0,168,122,.22)",
    rowActiveBg:     "rgba(37,99,235,.05)",    rowActiveBorder: "rgba(37,99,235,.22)",
    rowScanColor:    "rgba(0,168,122,.04)",
    rowBoxShadow:    "0 2px 0 rgba(0,0,0,.06),0 1px 0 rgba(255,255,255,.8) inset",
    tagBg:           "rgba(15,23,42,.04)",     tagBorder: "rgba(15,23,42,.09)", tagColor: "rgba(15,23,42,.35)",
    tagDoneBg:       "rgba(0,168,122,.1)",     tagDoneBorder: "rgba(0,168,122,.3)",
    tagActiveBg:     "rgba(37,99,235,.07)",    tagActiveBorder: "rgba(37,99,235,.28)",
    pipDim:          "rgba(15,23,42,.1)",
    scanlines:       "rgba(180,190,220,.012)",
    noiseOpacity:    ".22",
    cornerPulseFrom: ".12", cornerPulseTo: ".4",
    cornerStroke:    "rgba(0,168,122,.6)",
    shootTrail:      "rgba(15,23,42,.45) 50%,rgba(0,168,122,.55)",
    sparkColor:      "#00a87a",  sparkOpacity: ".45",
    glare:           "rgba(255,255,255,.55)",
    lineOpacity:     ".22",
    floorOpacity:    ".55",
    glowBg:          "radial-gradient(circle,rgba(0,168,122,.28),rgba(37,99,235,.14) 55%,transparent 70%)",
    ring1Color:      "rgba(0,168,122,.15)", ring2Color: "rgba(124,58,237,.12)", ring3Color: "rgba(37,99,235,.14)",
    blob0:           "rgba(0,168,122,.07)", blob1: "rgba(37,99,235,.06)", blob2: "rgba(124,58,237,.06)",
    hexGradA:        "rgba(0,168,122,.72)", hexGradB: "rgba(37,99,235,.62)",
    hexStroke:       "rgba(0,168,122,.78)", hexInner: "rgba(15,23,42,.08)",
    hexExtrude:      "rgba(0,168,122,.2)",
    hexSvgShadow:    "drop-shadow(0 0 16px rgba(0,168,122,.35))",
    ringTop:         "rgba(0,168,122,.18)", ringBottom: "rgba(124,58,237,.2)", ringBorder3: "rgba(37,99,235,.22)",
    orbit:           ["#00a87a","#2563eb","#7c3aed","#db2777"],
    aurora: [
      "radial-gradient(circle,rgba(0,168,122,.16),transparent 65%)",
      "radial-gradient(circle,rgba(37,99,235,.14),transparent 65%)",
      "radial-gradient(circle,rgba(124,58,237,.12),transparent 65%)",
      "radial-gradient(circle,rgba(219,39,119,.09),transparent 65%)",
      "radial-gradient(circle,rgba(0,168,122,.1),transparent 65%)",
    ],
    abPositions: [
      {top:"-20%",left:"5%"},{top:"15%",right:"-12%"},{bottom:"-15%",left:"25%"},{top:"55%",left:"-8%"},{bottom:"5%",right:"0%"},
    ],
  };
  const tk = isDark ? D : L;

  return (
    <div className={`ls-root${done ? " ls-root--done" : ""}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@200;300;400;600;700;900&family=Space+Mono:wght@400;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

        .ls-root{
          position:fixed;inset:0;background:${tk.rootBg};
          display:flex;flex-direction:column;align-items:center;justify-content:center;
          overflow:hidden;font-family:'Outfit','Helvetica Neue',sans-serif;z-index:9999;
          perspective:1000px;transition:background .4s ease;
        }
        .ls-root--done{animation:lsRootOut .7s .3s cubic-bezier(.7,0,1,1) both}
        @keyframes lsRootOut{to{opacity:0;transform:scale(1.04) translateZ(40px);filter:blur(14px)}}

        .ls-mesh{position:absolute;inset:0;pointer-events:none;background:${tk.meshBg};transition:background .4s}
        .ls-floor{
          position:absolute;bottom:0;left:0;right:0;height:55%;pointer-events:none;
          background-image:linear-gradient(${tk.floorLine} 1px,transparent 1px),linear-gradient(90deg,${tk.floorLine} 1px,transparent 1px);
          background-size:clamp(30px,5vw,60px) clamp(30px,5vw,60px);
          transform:perspective(600px) rotateX(70deg) translateY(30%);transform-origin:bottom center;
          mask-image:linear-gradient(to top,rgba(0,0,0,.7) 0%,transparent 70%);
          animation:lsFloorDrift 18s linear infinite;opacity:${tk.floorOpacity};
        }
        @keyframes lsFloorDrift{to{background-position:0 clamp(30px,5vw,60px)}}
        .ls-grid{
          position:absolute;inset:0;pointer-events:none;
          background-image:linear-gradient(${tk.gridLine} 1px,transparent 1px),linear-gradient(90deg,${tk.gridLine} 1px,transparent 1px);
          background-size:clamp(22px,4vw,48px) clamp(22px,4vw,48px);
          mask-image:radial-gradient(ellipse 85% 75% at 50% 50%,black 10%,transparent 70%);
          animation:lsGridSlide 22s linear infinite;
        }
        @keyframes lsGridSlide{to{background-position:0 clamp(22px,4vw,48px)}}
        .ls-aurora{position:absolute;inset:0;overflow:hidden;pointer-events:none}
        .ls-ab{
          position:absolute;border-radius:50%;
          width:clamp(240px,52vw,820px);height:clamp(240px,52vh,620px);
          filter:blur(clamp(55px,9vw,115px));opacity:0;
          animation:lsAbLife calc(7s + var(--lsi,0)*2.2s) ease-in-out calc(var(--lsi,0)*1.1s) infinite;
        }
        @keyframes lsAbLife{
          0%  {opacity:0;transform:scale(.8) translate(20px,30px)}
          30% {opacity:1;transform:scale(1.1) translate(-10px,-15px)}
          70% {opacity:.6;transform:scale(.95) translate(5px,10px)}
          100%{opacity:0;transform:scale(.82) translate(15px,20px)}
        }
        .ls-noise{position:absolute;inset:0;pointer-events:none;z-index:1;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.05'/%3E%3C/svg%3E");
          background-size:180px;opacity:${tk.noiseOpacity};
        }
        .ls-shoot{position:absolute;height:1px;width:var(--len,120px);
          background:linear-gradient(90deg,transparent,${tk.shootTrail});
          border-radius:99px;transform:rotate(-32deg);opacity:0;
          animation:lsShoot var(--dur,3s) linear var(--del,0s) infinite;
        }
        @keyframes lsShoot{
          0%  {opacity:0;transform:rotate(-32deg) translateX(-80px)}
          6%  {opacity:1}55%{opacity:0}
          100%{opacity:0;transform:rotate(-32deg) translateX(clamp(200px,55vw,750px))}
        }
        .ls-sparks{position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:2}
        .ls-spark{position:absolute;border-radius:50%;
          background:radial-gradient(circle,${tk.sparkColor},transparent 70%);
          opacity:0;animation:lsSparkF var(--dur) ease-in-out var(--del) infinite;
        }
        @keyframes lsSparkF{
          0%  {opacity:0;transform:translate(0,0) scale(1)}
          20% {opacity:${tk.sparkOpacity}}80%{opacity:.2}
          100%{opacity:0;transform:translate(calc(var(--dx)*1px),calc(var(--dy)*1px)) scale(.1)}
        }
        .ls-scanlines{position:absolute;inset:0;pointer-events:none;z-index:20;
          background:repeating-linear-gradient(0deg,transparent,transparent 2px,${tk.scanlines} 2px,${tk.scanlines} 4px);
        }
        .ls-corner{position:absolute;z-index:8;pointer-events:none;
          width:clamp(16px,3.5vw,26px);height:clamp(16px,3.5vw,26px);
          opacity:.38;animation:lsCornerPulse 3.5s ease-in-out infinite alternate;
        }
        @keyframes lsCornerPulse{from{opacity:${tk.cornerPulseFrom}}to{opacity:${tk.cornerPulseTo}}}
        .ls-c-tl{top:clamp(10px,2.5vw,22px);left:clamp(10px,2.5vw,22px)}
        .ls-c-tr{top:clamp(10px,2.5vw,22px);right:clamp(10px,2.5vw,22px);transform:rotate(90deg)}
        .ls-c-bl{bottom:clamp(10px,2.5vw,22px);left:clamp(10px,2.5vw,22px);transform:rotate(-90deg)}
        .ls-c-br{bottom:clamp(10px,2.5vw,22px);right:clamp(10px,2.5vw,22px);transform:rotate(180deg)}
        .ls-corner svg{width:100%;height:100%}

        .ls-tilt-wrap{position:relative;z-index:10;transform-style:preserve-3d;will-change:transform}
        .ls-glare{position:absolute;inset:-4px;border-radius:1.6rem;pointer-events:none;z-index:30;transition:background .08s}
        .ls-center{display:flex;flex-direction:column;align-items:center;width:min(92vw,500px);gap:clamp(.65rem,2vh,1.4rem);transform-style:preserve-3d}

        .ls-logo-scene{
          position:relative;width:clamp(68px,15vw,104px);height:clamp(68px,15vw,104px);
          transform-style:preserve-3d;
          animation:lsLogoIn .8s cubic-bezier(.22,1,.36,1) both, lsHexWobble 6s ease-in-out 1s infinite;
        }
        @keyframes lsLogoIn{from{opacity:0;transform:scale(.55) translateZ(-60px) rotate(-20deg)}}
        @keyframes lsHexWobble{
          0%,100%{transform:rotateX(0deg) rotateY(0deg)}
          25%    {transform:rotateX(8deg) rotateY(-10deg)}
          50%    {transform:rotateX(-6deg) rotateY(12deg)}
          75%    {transform:rotateX(5deg) rotateY(-8deg)}
        }
        .ls-lglow{position:absolute;inset:-30%;border-radius:50%;background:${tk.glowBg};animation:lsGlowPulse 2.5s ease-in-out infinite alternate}
        @keyframes lsGlowPulse{from{opacity:.4;transform:scale(.86)}to{opacity:1;transform:scale(1.14)}}
        .ls-lring{position:absolute;inset:-26%;border-radius:50%;border:1.5px solid transparent;border-top-color:${tk.a1};border-right-color:${tk.ringTop};animation:lsSpinCW 3s linear infinite}
        .ls-lring2{position:absolute;inset:-40%;border-radius:50%;border:1px solid transparent;border-bottom-color:${tk.a3};border-left-color:${tk.ringBottom};animation:lsSpinCCW 5.5s linear infinite}
        .ls-lring3{position:absolute;inset:-34%;border-radius:50%;border:1px solid ${tk.ringBorder3};transform:rotateX(65deg);animation:lsSpinCW 4s linear infinite}
        @keyframes lsSpinCW {to{transform:rotate(360deg)}}
        @keyframes lsSpinCCW{to{transform:rotate(-360deg)}}
        .ls-orbit-ring{
          position:absolute;width:clamp(120px,24vw,180px);height:clamp(120px,24vw,180px);
          top:50%;left:50%;
          margin-top:calc(clamp(120px,24vw,180px)/-2);margin-left:calc(clamp(120px,24vw,180px)/-2);
          animation:lsSpinCW 7s linear infinite;transform:rotateX(55deg);transform-style:preserve-3d;
        }
        .ls-odot{position:absolute;width:clamp(5px,1.2vw,8px);height:clamp(5px,1.2vw,8px);border-radius:50%;top:0;left:50%;transform:translate(-50%,-50%);animation:lsOdPulse 1.4s ease-in-out infinite}
        .ls-odot:nth-child(2){top:50%;left:100%;animation-delay:.35s}
        .ls-odot:nth-child(3){top:100%;left:50%;animation-delay:.7s}
        .ls-odot:nth-child(4){top:50%;left:0;animation-delay:1.05s}
        @keyframes lsOdPulse{0%,100%{transform:translate(-50%,-50%) scale(1)}50%{transform:translate(-50%,-50%) scale(1.8)}}
        .ls-hex-svg{width:100%;height:100%;position:relative;z-index:2;filter:${tk.hexSvgShadow}}
        .ls-hex-front{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;backface-visibility:hidden}
        .ls-hex-extrude{position:absolute;inset:0;pointer-events:none;transform:translateZ(-8px);filter:blur(6px);opacity:.5}
        .ls-logo-icon{position:absolute;inset:0;z-index:3;display:flex;align-items:center;justify-content:center}
        .ls-logo-icon svg{width:38%;height:38%;stroke:white;stroke-width:2;fill:none;stroke-linecap:round;stroke-linejoin:round;filter:drop-shadow(0 0 6px rgba(255,255,255,.55))}
        .ls-check-icon svg{stroke:${tk.a1};filter:drop-shadow(0 0 12px ${tk.a1});animation:lsCheckIn .65s cubic-bezier(.34,1.56,.64,1) both}
        @keyframes lsCheckIn{from{opacity:0;transform:scale(0) rotate(-90deg)}}

        .ls-wmark{display:flex;flex-direction:column;align-items:center;animation:lsWIn .9s .25s cubic-bezier(.22,1,.36,1) both;transform:translateZ(20px)}
        @keyframes lsWIn{from{opacity:0;transform:translateY(18px)}}
        .ls-wname{
          font-size:clamp(2.2rem,8vw,4rem);font-weight:900;letter-spacing:-.045em;line-height:1;
          background:${tk.nameBg};background-size:300% 300%;
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
          animation:lsNameGrad 4s ease infinite;filter:${tk.nameShadow};
        }
        @keyframes lsNameGrad{0%,100%{background-position:0 50%}50%{background-position:100% 50%}}
        .ls-cursor{display:inline-block;width:clamp(2px,.5vw,3px);height:.75em;background:${tk.a1};border-radius:2px;margin-left:.12em;vertical-align:middle;animation:lsBlink .9s step-end infinite}
        @keyframes lsBlink{0%,49%{opacity:1}50%,100%{opacity:0}}
        .ls-wsub{font-family:'Space Mono',monospace;font-size:clamp(.48rem,1.3vw,.62rem);letter-spacing:.3em;text-transform:uppercase;color:${tk.subColor};margin-top:.5em}
        .ls-line{width:clamp(140px,45%,260px);height:1px;background:linear-gradient(90deg,transparent,${tk.a1},transparent);opacity:${tk.lineOpacity};animation:lsLineIn .8s .55s ease both;transform:translateZ(8px)}
        @keyframes lsLineIn{from{width:0;opacity:0}}

        .ls-prog{width:100%;display:flex;flex-direction:column;gap:.5rem;animation:lsFadeUp .7s .45s ease both;transform:translateZ(12px)}
        @keyframes lsFadeUp{from{opacity:0;transform:translateY(10px)}}
        .ls-pmeta{display:flex;align-items:center;justify-content:space-between}
        .ls-pphase{font-family:'Space Mono',monospace;font-size:clamp(.5rem,1.3vw,.63rem);letter-spacing:.18em;text-transform:uppercase;color:${tk.phaseColor};display:flex;align-items:center;gap:.45rem}
        .ls-ptag{color:${tk.a1};text-shadow:0 0 8px ${tk.a1};font-weight:700}
        .ls-ppct{font-family:'Space Mono',monospace;font-weight:700;font-size:clamp(.7rem,2vw,.95rem);color:${tk.a1};text-shadow:0 0 12px ${tk.a1}}
        .ls-ptrack{width:100%;height:clamp(2px,.6vw,4px);background:${tk.trackBg};border-radius:99px;overflow:hidden;border:1px solid ${tk.trackBorder};box-shadow:${tk.trackShadow}}
        .ls-pfill{height:100%;border-radius:99px;background:${tk.fillBar};background-size:200%;transition:width .38s ease;position:relative;overflow:hidden;animation:lsFillG 2s linear infinite;box-shadow:0 0 10px ${tk.a1}80,0 0 20px ${tk.a1}40}
        .ls-pfill--done{background:${tk.fillDone}!important;box-shadow:0 0 16px ${tk.a1}}
        @keyframes lsFillG{to{background-position:-200% 0}}
        .ls-pfill::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,${tk.shimAlpha}),transparent);animation:lsShim 1.6s linear infinite}
        @keyframes lsShim{from{transform:translateX(-200%)}to{transform:translateX(200%)}}

        .ls-slist{width:100%;display:flex;flex-direction:column;gap:.3rem;animation:lsFadeUp .7s .65s ease both;transform:translateZ(6px)}
        .ls-srow{
          display:flex;align-items:center;gap:.6rem;
          padding:clamp(.4rem,1.4vw,.65rem) clamp(.55rem,1.8vw,.85rem);
          border-radius:.55rem;border:1px solid ${tk.rowBorder};background:${tk.rowBg};
          transition:all .4s ease;position:relative;overflow:hidden;box-shadow:${tk.rowBoxShadow};
        }
        .ls-srow::before{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,${tk.rowScanColor},transparent);transform:translateX(-100%)}
        .ls-srow[data-done="true"]{background:${tk.rowDoneBg};border-color:${tk.rowDoneBorder}}
        .ls-srow[data-done="true"]::before{transform:translateX(200%);transition:transform 1.4s ease}
        .ls-srow[data-active="true"]{background:${tk.rowActiveBg};border-color:${tk.rowActiveBorder}}
        .ls-srow[data-active="true"]::before{animation:lsScanPass 1.1s linear infinite}
        @keyframes lsScanPass{from{transform:translateX(-100%)}to{transform:translateX(200%)}}
        .ls-stag{
          font-family:'Space Mono',monospace;font-size:clamp(.4rem,1vw,.53rem);letter-spacing:.1em;text-transform:uppercase;
          padding:.18em .45em;border-radius:.28rem;border:1px solid ${tk.tagBorder};
          color:${tk.tagColor};background:${tk.tagBg};
          flex-shrink:0;min-width:clamp(50px,8.5vw,70px);text-align:center;transition:all .4s;
        }
        .ls-srow[data-done="true"]   .ls-stag{color:${tk.a1};border-color:${tk.tagDoneBorder};background:${tk.tagDoneBg};text-shadow:0 0 5px ${tk.a1}}
        .ls-srow[data-active="true"] .ls-stag{color:${tk.a2};border-color:${tk.tagActiveBorder};background:${tk.tagActiveBg}}
        .ls-slabel{flex:1;font-size:clamp(.56rem,1.4vw,.73rem);font-weight:300;color:${tk.labelDim};letter-spacing:.01em;transition:color .4s}
        .ls-srow[data-done="true"]   .ls-slabel{color:${tk.labelDone}}
        .ls-srow[data-active="true"] .ls-slabel{color:${tk.labelActive}}
        .ls-sstatus{font-family:'Space Mono',monospace;font-size:clamp(.48rem,1.1vw,.6rem);letter-spacing:.14em;color:${tk.statusDim};transition:all .4s;flex-shrink:0}
        .ls-srow[data-done="true"]   .ls-sstatus{color:${tk.a1};text-shadow:0 0 5px ${tk.a1}}
        .ls-srow[data-active="true"] .ls-sstatus{color:${tk.a2}}
        .ls-spip{width:5px;height:5px;border-radius:50%;flex-shrink:0;background:${tk.pipDim};transition:all .4s}
        .ls-srow[data-done="true"]   .ls-spip{background:${tk.a1};box-shadow:0 0 6px ${tk.a1}}
        .ls-srow[data-active="true"] .ls-spip{background:${tk.a2};box-shadow:0 0 6px ${tk.a2};animation:lsPipP .8s ease-in-out infinite}
        @keyframes lsPipP{0%,100%{transform:scale(1)}50%{transform:scale(2)}}

        .ls-bottom{display:flex;align-items:center;justify-content:space-between;width:100%;animation:lsFadeUp .7s .85s ease both;transform:translateZ(4px)}
        .ls-btag{font-family:'Space Mono',monospace;font-size:clamp(.45rem,1.1vw,.58rem);letter-spacing:.12em;color:${tk.btTagColor};text-transform:uppercase;display:flex;align-items:center;gap:.38rem}
        .ls-bdot{width:5px;height:5px;border-radius:50%;background:${tk.a3};box-shadow:0 0 5px ${tk.a3}}
        .ls-done-label{color:${tk.a1};text-shadow:0 0 10px ${tk.a1};font-weight:700;letter-spacing:.14em;animation:lsFadeUp .4s ease both}
        .ls-loader-dots{display:flex;gap:.38rem;align-items:center}
        .ls-ld{width:clamp(4px,.9vw,6px);height:clamp(4px,.9vw,6px);border-radius:50%;animation:lsLdB .85s ease-in-out infinite}
        .ls-ld:nth-child(1){background:${tk.a1};box-shadow:0 0 5px ${tk.a1}}
        .ls-ld:nth-child(2){background:${tk.a2};box-shadow:0 0 5px ${tk.a2};animation-delay:.15s}
        .ls-ld:nth-child(3){background:${tk.a3};box-shadow:0 0 5px ${tk.a3};animation-delay:.3s}
        @keyframes lsLdB{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}

        .ls-ring3d-wrap{position:absolute;inset:0;pointer-events:none;overflow:hidden}
        .ls-ring3d{position:absolute;border-radius:50%;border:1px solid;opacity:var(--op,.15)}
        .ls-depth-blob{position:absolute;border-radius:50%;pointer-events:none;filter:blur(clamp(20px,4vw,45px));animation:lsBlobDrift var(--bd,8s) ease-in-out var(--bde,0s) infinite alternate;will-change:transform}
        @keyframes lsBlobDrift{from{transform:translate(0,0) scale(1)}to{transform:translate(var(--tx,12px),var(--ty,-18px)) scale(1.08)}}

        @media(max-height:580px){.ls-center{gap:.45rem}.ls-slist{gap:.18rem}.ls-prog{gap:.28rem}}
      `}</style>

      <div className="ls-mesh"/>
      <div className="ls-floor" style={{transform:`perspective(600px) rotateX(70deg) translateY(30%) translateX(${(mouse.x-0.5)*-18}px)`}}/>
      <div className="ls-grid"/>
      <div className="ls-noise"/>
      <div className="ls-aurora">
        {tk.aurora.map((bg, i) => (
          <div key={i} className="ls-ab" style={{background:bg,"--lsi":i,...tk.abPositions[i]}}/>
        ))}
      </div>
      <div className="ls-scanlines"/>

      <div className="ls-ring3d-wrap">
        <div className="ls-ring3d" style={{width:"clamp(180px,40vw,480px)",height:"clamp(180px,40vw,480px)",top:"10%",left:"5%",borderColor:tk.ring1Color,transform:`rotateX(60deg) rotateZ(15deg) translateX(${mpx(0.4)}) translateY(${mpy(0.4)})`,"--op":".13"}}/>
        <div className="ls-ring3d" style={{width:"clamp(140px,30vw,360px)",height:"clamp(140px,30vw,360px)",bottom:"8%",right:"4%",borderColor:tk.ring2Color,transform:`rotateX(50deg) rotateZ(-20deg) translateX(${mpx(0.6)}) translateY(${mpy(0.6)})`,"--op":".1"}}/>
        <div className="ls-ring3d" style={{width:"clamp(80px,18vw,220px)",height:"clamp(80px,18vw,220px)",top:"40%",right:"12%",borderColor:tk.ring3Color,transform:`rotateX(70deg) rotateY(20deg) translateX(${mpx(0.8)}) translateY(${mpy(0.8)})`,"--op":".12"}}/>
      </div>

      {floats.map(f => (
        <div key={f.id} className="ls-depth-blob" style={{
          left:`${f.x}%`,top:`${f.y}%`,width:`${f.size}px`,height:`${f.size}px`,
          background:[tk.blob0,tk.blob1,tk.blob2][f.id%3],
          "--bd":`${f.dur}s`,"--bde":`${f.del}s`,
          "--tx":`${r(-20,20)}px`,"--ty":`${r(-25,5)}px`,
          transform:`translateX(${mpx(f.depth)}) translateY(${mpy(f.depth)})`,
          transition:"transform .1s linear",
        }}/>
      ))}

      {stars.map(s => <div key={s.id} className="ls-shoot" style={{top:s.top,left:s.left,"--len":s.len,"--del":s.del,"--dur":s.dur}}/>)}

      <div className="ls-sparks">
        {sparks.map(s => <div key={s.id} className="ls-spark" style={{left:`${s.cx}%`,top:`${s.cy}%`,width:`${s.size}px`,height:`${s.size}px`,"--dur":`${s.dur}s`,"--del":`${s.del}s`,"--dx":s.dx.toFixed(1),"--dy":s.dy.toFixed(1)}}/>)}
      </div>

      {["ls-c-tl","ls-c-tr","ls-c-bl","ls-c-br"].map(cls => (
        <div key={cls} className={`ls-corner ${cls}`}>
          <svg viewBox="0 0 24 24" fill="none"><path d="M0 10 L0 0 L10 0" stroke={tk.cornerStroke} strokeWidth="1.5" strokeLinecap="round"/></svg>
        </div>
      ))}

      <div className="ls-tilt-wrap" style={{transform:`rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,transition:"transform .05s linear"}}>
        <div className="ls-glare" style={{background:`radial-gradient(circle at ${mouse.x*100}% ${mouse.y*100}%, ${tk.glare} 0%, transparent 60%)`}}/>

        <div className="ls-center">

          <div className="ls-logo-scene" style={{transform:`rotateX(${tilt.x*0.6}deg) rotateY(${tilt.y*0.6}deg)`,transition:"transform .05s linear"}}>
            <div className="ls-lglow"/>
            <div className="ls-lring"/>
            <div className="ls-lring2"/>
            <div className="ls-lring3" style={{transform:`rotateX(65deg) rotate(${tilt.y}deg)`}}/>
            {!done && (
              <div className="ls-orbit-ring">
                {tk.orbit.map((col,i) => (
                  <div key={i} className="ls-odot" style={{
                    background:col, boxShadow:`0 0 8px ${col}`,
                    top:  ["0%","50%","100%","50%"][i],
                    left: ["50%","100%","50%","0%"][i],
                  }}/>
                ))}
              </div>
            )}
            <div className="ls-hex-front">
              <svg className="ls-hex-svg" viewBox="0 0 100 100" fill="none">
                <defs>
                  <linearGradient id="lsHg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%"   stopColor={tk.hexGradA}/>
                    <stop offset="100%" stopColor={tk.hexGradB}/>
                  </linearGradient>
                  <filter id="lsGlow">
                    <feGaussianBlur stdDeviation="3" result="b"/>
                    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                </defs>
                <polygon points="50,3 97,27 97,73 50,97 3,73 3,27" fill="url(#lsHg)" stroke={tk.hexStroke} strokeWidth="1.2" filter="url(#lsGlow)"/>
                <polygon points="50,10 90,30 90,70 50,90 10,70 10,30" fill="none" stroke={tk.hexInner} strokeWidth=".8"/>
              </svg>
            </div>
            <div className="ls-hex-extrude">
              <svg viewBox="0 0 100 100" style={{width:"100%",height:"100%"}}>
                <polygon points="50,3 97,27 97,73 50,97 3,73 3,27" fill={tk.hexExtrude}/>
              </svg>
            </div>
            <div className={done ? "ls-logo-icon ls-check-icon" : "ls-logo-icon"}>
              {done
                ? <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                : <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              }
            </div>
          </div>

          <div className="ls-wmark">
            <div className="ls-wname">
              <ScrambleText text="AirVault" run={phase>=1} duration={900}/>
              {!done && <span className="ls-cursor"/>}
            </div>
            <div className="ls-wsub">Ultra · Secure · Cloud · Storage</div>
          </div>

          <div className="ls-line"/>

          <div className="ls-prog">
            <div className="ls-pmeta">
              <div className="ls-pphase">STATUS /&nbsp;<span className="ls-ptag"><ScrambleText text={PHASES[phase]} run={true} duration={380}/></span></div>
              <div className="ls-ppct">{pct}<span style={{fontSize:".58em",opacity:.45}}>%</span></div>
            </div>
            <div className="ls-ptrack">
              <div className={`ls-pfill${done?" ls-pfill--done":""}`} style={{width:`${pct}%`}}/>
            </div>
          </div>

          <div className="ls-slist">
            {ROWS.map((row, i) => {
              const isDone2  = pct > row.t + 4;
              const isActive = pct >= row.t - 4 && pct <= row.t + 4;
              return (
                <div key={row.label} className="ls-srow" data-done={isDone2} data-active={isActive} style={{animationDelay:`${i*75}ms`}}>
                  <div className="ls-stag">{row.tag}</div>
                  <div className="ls-slabel">{row.label}</div>
                  <div className="ls-sstatus">{isDone2 ? "OK" : isActive ? "···" : "--"}</div>
                  <div className="ls-spip"/>
                </div>
              );
            })}
          </div>

          <div className="ls-bottom">
            <div className="ls-btag">
              <div className="ls-bdot"/>
              <ScrambleText text="256-bit encrypted" run={phase>=2} duration={650}/>
            </div>
            {done
              ? <div className="ls-btag ls-done-label">● ALL SYSTEMS GO</div>
              : <div className="ls-loader-dots"><div className="ls-ld"/><div className="ls-ld"/><div className="ls-ld"/></div>
            }
          </div>

        </div>
      </div>
    </div>
  );
}