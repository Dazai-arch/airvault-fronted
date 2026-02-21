import { useState, useEffect } from 'react';
import { Shield, Lock, Check, Eye, Wifi, Database, Key } from 'lucide-react';

const LoadingScreen = ({ onLoadingComplete }) => {
  const [stage, setStage] = useState('initial');
  const [progress, setProgress] = useState(0);
  const [scanLine, setScanLine] = useState(0);
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 2,
    }));
    setParticles(newParticles);

    const timer1 = setTimeout(() => setStage('scanning'),   500);
    const timer2 = setTimeout(() => setStage('encrypting'), 1500);
    const timer3 = setTimeout(() => setStage('securing'),   2500);
    const timer4 = setTimeout(() => setStage('complete'),   3500);
    const timer5 = setTimeout(() => onLoadingComplete(),    4500);

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) { clearInterval(progressInterval); return 100; }
        return prev + 1;
      });
    }, 40);

    const scanInterval = setInterval(() => {
      setScanLine(prev => (prev >= 100 ? 0 : prev + 2));
    }, 20);

    return () => {
      clearTimeout(timer1); clearTimeout(timer2); clearTimeout(timer3);
      clearTimeout(timer4); clearTimeout(timer5);
      clearInterval(progressInterval); clearInterval(scanInterval);
    };
  }, [onLoadingComplete]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center z-[9999] overflow-hidden">

      {/* Animated Grid Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(rgba(6,182,212,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
          animation: 'gridMove 20s linear infinite',
        }} />
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map(p => (
          <div key={p.id} className="absolute rounded-full bg-cyan-400/30"
            style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${p.size}px`, height: `${p.size}px`, animation: `float ${p.duration}s ease-in-out infinite`, animationDelay: `${p.delay}s` }}
          />
        ))}
      </div>

      {/* Radial Glow Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-48 h-48 sm:w-72 md:w-96 sm:h-72 md:h-96 bg-cyan-500/20 rounded-full blur-[80px] sm:blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 sm:w-72 md:w-96 sm:h-72 md:h-96 bg-blue-600/20 rounded-full blur-[80px] sm:blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 sm:w-96 md:w-[600px] sm:h-96 md:h-[600px] bg-indigo-500/10 rounded-full blur-[100px] sm:blur-[120px] animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>

      {/* ── Main content ── */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl px-4 sm:px-6 md:px-8">

        {/* Logo Container */}
        <div className="relative mb-6 sm:mb-8 md:mb-12">

          {/* Rotating Rings */}
          <div className={`absolute inset-0 transition-all duration-1000 ${stage === 'initial' ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}>
            {/* Ring 1 */}
            <div className="absolute rounded-full border-2 border-transparent border-t-cyan-400 border-r-cyan-500"
              style={{
                width: 'clamp(120px, 22vw, 180px)', height: 'clamp(120px, 22vw, 180px)',
                top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                animation: stage !== 'complete' ? 'spin 3s linear infinite' : 'none',
              }}
            />
            {/* Ring 2 */}
            <div className="absolute rounded-full border-2 border-transparent border-b-blue-400 border-l-blue-500"
              style={{
                width: 'clamp(140px, 26vw, 200px)', height: 'clamp(140px, 26vw, 200px)',
                top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                animation: stage !== 'complete' ? 'spinReverse 4s linear infinite' : 'none',
              }}
            />
            {/* Orbiting dots */}
            <div className="absolute" style={{
              width: 'clamp(110px, 20vw, 160px)', height: 'clamp(110px, 20vw, 160px)',
              top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            }}>
              {[0,1,2,3,4,5,6,7].map(i => (
                <div key={i} className="absolute w-1.5 h-1.5 sm:w-2 sm:h-2 bg-cyan-400 rounded-full"
                  style={{
                    top: '50%', left: '50%',
                    transform: `rotate(${i * 45}deg) translateY(clamp(-55px, -9vw, -80px))`,
                    animation: 'pulse 1s ease-in-out infinite',
                    animationDelay: `${i * 0.125}s`,
                    opacity: stage === 'complete' ? 0 : 1,
                    transition: 'opacity 0.5s',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Center Hexagon Logo */}
          <div className={`relative transition-all duration-1000 ${stage === 'initial' ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}>
            <div className={`relative transition-all duration-700 ${stage === 'complete' ? 'scale-110' : ''}`}
              style={{ width: 'clamp(72px, 14vw, 96px)', height: 'clamp(72px, 14vw, 96px)' }}>
              <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
                <defs>
                  <linearGradient id="hexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#2563eb" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                    <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
                  </filter>
                </defs>
                <polygon points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5"
                  fill="url(#hexGradient)" stroke="url(#hexGradient)" strokeWidth="2"
                  filter="url(#glow)" className={stage !== 'complete' ? 'animate-pulse' : ''} />
              </svg>

              <div className="absolute inset-0 flex items-center justify-center">
                <Shield className="w-7 h-7 sm:w-9 sm:h-9 md:w-12 md:h-12 text-white drop-shadow-lg" strokeWidth={2.5} />
              </div>

              {stage === 'scanning' && (
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/50 to-transparent"
                  style={{ top: `${scanLine}%`, height: '4px', transition: 'top 0.02s linear' }} />
              )}
              {stage === 'encrypting' && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm rounded-lg">
                  <Lock className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-cyan-400 animate-bounce drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
                </div>
              )}
              {stage === 'securing' && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm rounded-lg">
                  <Key className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-blue-400 animate-spin drop-shadow-[0_0_10px_rgba(37,99,235,0.5)]" />
                </div>
              )}
              {stage === 'complete' && (
                <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/20 backdrop-blur-sm rounded-lg animate-fadeIn">
                  <Check className="w-8 h-8 sm:w-10 sm:h-10 md:w-14 md:h-14 text-emerald-400 animate-scaleIn drop-shadow-[0_0_15px_rgba(52,211,153,0.8)]" strokeWidth={3} />
                </div>
              )}
            </div>

            {/* Orbiting Icons */}
            <div className="absolute" style={{
              width: 'clamp(140px, 26vw, 200px)', height: 'clamp(140px, 26vw, 200px)',
              top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            }}>
              {[
                { Icon: Shield, angle: 0 },
                { Icon: Eye,    angle: 90 },
                { Icon: Wifi,   angle: 180 },
                { Icon: Database, angle: 270 },
              ].map(({ Icon, angle }, i) => (
                <div key={i}
                  className={`absolute w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 flex items-center justify-center rounded-full bg-slate-800/80 backdrop-blur-sm border border-cyan-500/30 transition-all duration-700 ${
                    stage === 'complete' ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
                  }`}
                  style={{
                    top: '50%', left: '50%',
                    transform: `rotate(${angle + (stage !== 'complete' ? progress * 3.6 : 0)}deg) translateY(clamp(-65px, -12vw, -100px))`,
                    transition: 'transform 0.3s ease-out',
                  }}
                >
                  <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-cyan-400" strokeWidth={2} />
                </div>
              ))}
            </div>
          </div>

          {/* Pulsing Glow */}
          <div className={`absolute inset-0 -z-10 transition-all duration-700 ${stage === 'complete' ? 'animate-ping scale-150' : 'animate-pulse'}`}>
            <div className="absolute bg-gradient-to-br from-cyan-500/30 to-blue-600/30 rounded-full blur-2xl"
              style={{
                width: 'clamp(100px, 18vw, 150px)', height: 'clamp(100px, 18vw, 150px)',
                top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              }}
            />
          </div>
        </div>

        {/* Brand Name */}
        <div className={`text-center mb-5 sm:mb-6 md:mb-8 transition-all duration-1000 delay-300 ${
          stage === 'initial' ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
        }`}>
          <h1 className="font-bold mb-2 tracking-wide relative" style={{ fontSize: 'clamp(2rem, 6vw, 3.5rem)' }}>
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 bg-clip-text text-transparent animate-gradient">
              AirVault
            </span>
            {stage !== 'complete' && (
              <span className="inline-block w-0.5 sm:w-1 bg-cyan-400 ml-1 animate-blink align-middle"
                style={{ height: 'clamp(1.5rem, 4vw, 2.5rem)' }} />
            )}
          </h1>
          <p className="text-cyan-400 font-semibold tracking-[0.2em] sm:tracking-[0.3em] uppercase"
            style={{ fontSize: 'clamp(0.6rem, 1.5vw, 0.875rem)' }}>
            Ultra-Secure Cloud Storage
          </p>
        </div>

        {/* Status Card */}
        <div className={`w-full mb-4 sm:mb-6 md:mb-8 transition-all duration-500 ${stage === 'initial' ? 'opacity-0' : 'opacity-100'}`}>
          <div className="bg-slate-900/50 backdrop-blur-xl border border-cyan-500/20 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-2xl">

            {/* Status Header */}
            <div className="text-center mb-3 sm:mb-4">
              <p className="text-slate-300 font-medium flex items-center justify-center gap-2"
                style={{ fontSize: 'clamp(0.7rem, 1.8vw, 0.875rem)' }}>
                {stage === 'initial'    && <><div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse" />Initializing System...</>}
                {stage === 'scanning'   && <><div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" /><Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-pulse" />System Initialization</>}
                {stage === 'encrypting' && <><div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" /><Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-pulse" />Encrypting Data Stream</>}
                {stage === 'securing'   && <><div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" /><Key className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-pulse" />Establishing Secure Channel</>}
                {stage === 'complete'   && <><Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" /><span className="text-emerald-400 font-semibold">Connection Secured</span></>}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2 sm:space-y-3">
              <div className="flex justify-between items-center text-slate-400 font-mono"
                style={{ fontSize: 'clamp(0.6rem, 1.4vw, 0.75rem)' }}>
                <span>PROGRESS</span>
                <span className="text-cyan-400 font-bold">{progress}%</span>
              </div>
              <div className="relative h-2 sm:h-3 bg-slate-950 rounded-full overflow-hidden border border-cyan-500/20 shadow-inner">
                <div className={`absolute top-0 left-0 h-full rounded-full transition-all duration-300 ${
                  stage === 'complete'
                    ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600'
                    : 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600'
                }`} style={{ width: `${progress}%` }}>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/50 to-blue-500/50 blur-sm" />
                </div>
                <div className="absolute inset-0 opacity-20" style={{
                  backgroundImage: 'repeating-linear-gradient(90deg, rgba(6,182,212,0.2) 0px, transparent 1px, transparent 4px)',
                }} />
              </div>
            </div>

            {/* Security Metrics */}
            <div className="mt-4 sm:mt-6 grid grid-cols-3 gap-2 sm:gap-3">
              {[
                { label: 'Encryption', value: 'AES-256',  threshold: 30,  activeColor: 'text-cyan-400'    },
                { label: 'Protocol',   value: 'TLS 1.3',  threshold: 60,  activeColor: 'text-blue-400'    },
                { label: 'Status',     value: progress > 90 ? 'ACTIVE' : 'STANDBY', threshold: 90, activeColor: 'text-emerald-400' },
              ].map(({ label, value, threshold, activeColor }) => (
                <div key={label} className="text-center">
                  <div className="text-slate-400 mb-1" style={{ fontSize: 'clamp(0.55rem, 1.3vw, 0.75rem)' }}>{label}</div>
                  <div className={`font-bold transition-colors duration-500 ${progress > threshold ? activeColor : 'text-slate-600'}`}
                    style={{ fontSize: 'clamp(0.65rem, 1.5vw, 0.875rem)' }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Security Checklist */}
        <div className={`w-full transition-all duration-700 delay-700 ${stage === 'initial' ? 'opacity-0' : 'opacity-100'}`}>
          <div className="space-y-1.5 sm:space-y-2">
            <SecurityFeature text="End-to-End Encryption"      completed={progress > 25} active={progress >= 15 && progress <= 35} icon={Lock}     />
            <SecurityFeature text="Zero-Knowledge Architecture" completed={progress > 50} active={progress >= 40 && progress <= 60} icon={Eye}      />
            <SecurityFeature text="Secure Data Transfer"        completed={progress > 75} active={progress >= 65 && progress <= 85} icon={Database} />
            <SecurityFeature text="Military-Grade Security"     completed={progress > 95} active={progress >= 90 && progress <= 100} icon={Shield}  />
          </div>
        </div>

        {/* Loading Dots */}
        {stage !== 'complete' && (
          <div className="flex gap-1.5 sm:gap-2 mt-5 sm:mt-6 md:mt-8">
            {[0,1,2].map(i => (
              <div key={i} className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-cyan-400 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin        { from { transform: translate(-50%,-50%) rotate(0deg);   } to { transform: translate(-50%,-50%) rotate(360deg);  } }
        @keyframes spinReverse { from { transform: translate(-50%,-50%) rotate(360deg); } to { transform: translate(-50%,-50%) rotate(0deg);    } }
        @keyframes shimmer     { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        @keyframes fadeIn      { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn     { 0% { transform: scale(0) rotate(0deg); } 50% { transform: scale(1.3) rotate(180deg); } 100% { transform: scale(1) rotate(360deg); } }
        @keyframes float       { 0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; } 50% { transform: translateY(-20px) translateX(10px); opacity: 0.8; } }
        @keyframes gridMove    { 0% { transform: translateY(0); } 100% { transform: translateY(50px); } }
        @keyframes gradient    { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes blink       { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }

        .animate-shimmer  { animation: shimmer 2s infinite; }
        .animate-fadeIn   { animation: fadeIn 0.5s ease-out; }
        .animate-scaleIn  { animation: scaleIn 0.8s ease-out; }
        .animate-gradient { background-size: 200% 200%; animation: gradient 3s ease infinite; }
        .animate-blink    { animation: blink 1s step-end infinite; }
      `}</style>
    </div>
  );
};

const SecurityFeature = ({ text, completed, active, icon: Icon }) => (
  <div className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-300 ${
    active     ? 'bg-cyan-500/10 border border-cyan-500/30'
    : completed ? 'bg-emerald-500/10 border border-emerald-500/20'
    :             'bg-slate-900/30 border border-slate-800'
  }`}>
    <div className="relative flex-shrink-0">
      <div className={`flex items-center justify-center rounded-lg transition-all duration-300 ${
        completed  ? 'bg-emerald-500/20 border border-emerald-500/40'
        : active   ? 'bg-cyan-500/20 border border-cyan-500/40 animate-pulse'
        :            'bg-slate-800 border border-slate-700'
      }`} style={{ width: 'clamp(28px, 5vw, 32px)', height: 'clamp(28px, 5vw, 32px)' }}>
        {completed ? <Check className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400" strokeWidth={3} />
         : active  ? <Icon  className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-400 animate-pulse" strokeWidth={2} />
         :           <Icon  className="w-3 h-3 sm:w-4 sm:h-4 text-slate-600" strokeWidth={2} />}
      </div>
      {active && (
        <>
          <div className="absolute -top-1 -right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-cyan-400 rounded-full animate-ping" />
          <div className="absolute -top-1 -right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-cyan-400 rounded-full" />
        </>
      )}
    </div>

    <span className={`flex-1 font-medium transition-colors duration-300 ${
      active     ? 'text-cyan-300'
      : completed ? 'text-emerald-300'
      :             'text-slate-500'
    }`} style={{ fontSize: 'clamp(0.65rem, 1.6vw, 0.875rem)' }}>
      {text}
    </span>

    <span className={`font-mono flex-shrink-0 transition-colors duration-300 ${
      completed  ? 'text-emerald-400'
      : active   ? 'text-cyan-400'
      :            'text-slate-600'
    }`} style={{ fontSize: 'clamp(0.6rem, 1.4vw, 0.75rem)' }}>
      {completed ? 'OK' : active ? '...' : '--'}
    </span>
  </div>
);

export default LoadingScreen;