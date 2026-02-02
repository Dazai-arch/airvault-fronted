import { useState, useEffect } from 'react';
import { Shield, Lock, Check, Eye, Wifi, Database, Key } from 'lucide-react';

const LoadingScreen = ({ onLoadingComplete }) => {
  const [stage, setStage] = useState('initial'); // initial, scanning, encrypting, securing, complete
  const [progress, setProgress] = useState(0);
  const [scanLine, setScanLine] = useState(0);
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    // Generate random particles
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 2
    }));
    setParticles(newParticles);

    // Stage progression
    const timer1 = setTimeout(() => setStage('scanning'), 500);
    const timer2 = setTimeout(() => setStage('encrypting'), 1500);
    const timer3 = setTimeout(() => setStage('securing'), 2500);
    const timer4 = setTimeout(() => setStage('complete'), 3500);
    const timer5 = setTimeout(() => onLoadingComplete(), 4500);

    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 1;
      });
    }, 40);

    // Scan line animation
    const scanInterval = setInterval(() => {
      setScanLine(prev => (prev >= 100 ? 0 : prev + 2));
    }, 20);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
      clearInterval(progressInterval);
      clearInterval(scanInterval);
    };
  }, [onLoadingComplete]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center z-[9999] overflow-hidden">
      {/* Animated Grid Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          animation: 'gridMove 20s linear infinite'
        }}></div>
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="absolute rounded-full bg-cyan-400/30"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              animation: `float ${particle.duration}s ease-in-out infinite`,
              animationDelay: `${particle.delay}s`
            }}
          />
        ))}
      </div>

      {/* Radial Glow Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" style={{animationDelay: '0.5s'}}></div>
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-2xl px-8">
        {/* Main Logo Container */}
        <div className="relative mb-12">
          {/* Outer Rotating Rings */}
          <div className={`absolute inset-0 transition-all duration-1000 ${
            stage === 'initial' ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
          }`}>
            {/* Ring 1 */}
            <div 
              className="absolute rounded-full border-2 border-transparent border-t-cyan-400 border-r-cyan-500"
              style={{ 
                width: '180px', 
                height: '180px', 
                top: '-40px', 
                left: '-40px',
                animation: stage !== 'complete' ? 'spin 3s linear infinite' : 'none',
                transform: stage === 'complete' ? 'rotate(0deg)' : undefined
              }}
            ></div>
            
            {/* Ring 2 - Opposite direction */}
            <div 
              className="absolute rounded-full border-2 border-transparent border-b-blue-400 border-l-blue-500"
              style={{ 
                width: '200px', 
                height: '200px', 
                top: '-50px', 
                left: '-50px',
                animation: stage !== 'complete' ? 'spinReverse 4s linear infinite' : 'none',
                transform: stage === 'complete' ? 'rotate(0deg)' : undefined
              }}
            ></div>

            {/* Ring 3 - Data flow dots */}
            <div 
              className="absolute rounded-full"
              style={{ 
                width: '160px', 
                height: '160px', 
                top: '-30px', 
                left: '-30px',
              }}
            >
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-cyan-400 rounded-full"
                  style={{
                    top: '50%',
                    left: '50%',
                    transform: `rotate(${i * 45}deg) translateY(-80px)`,
                    animation: `pulse 1s ease-in-out infinite`,
                    animationDelay: `${i * 0.125}s`,
                    opacity: stage === 'complete' ? 0 : 1,
                    transition: 'opacity 0.5s'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Center Logo with Hexagon */}
          <div className={`relative transition-all duration-1000 ${
            stage === 'initial' ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
          }`}>
            {/* Hexagon Background */}
            <div className={`relative w-24 h-24 transition-all duration-700 ${
              stage === 'complete' ? 'scale-110' : ''
            }`}>
              <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
                <defs>
                  <linearGradient id="hexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#2563eb" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <polygon
                  points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5"
                  fill="url(#hexGradient)"
                  stroke="url(#hexGradient)"
                  strokeWidth="2"
                  filter="url(#glow)"
                  className={stage !== 'complete' ? 'animate-pulse' : ''}
                />
              </svg>

              {/* Shield Icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Shield className="w-12 h-12 text-white drop-shadow-lg" strokeWidth={2.5} />
              </div>

              {/* Scan Line Effect */}
              {stage === 'scanning' && (
                <div 
                  className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/50 to-transparent"
                  style={{
                    top: `${scanLine}%`,
                    height: '4px',
                    transition: 'top 0.02s linear'
                  }}
                />
              )}

              {/* Lock overlay during encryption */}
              {stage === 'encrypting' && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm rounded-lg">
                  <Lock className="w-10 h-10 text-cyan-400 animate-bounce drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
                </div>
              )}

              {/* Key overlay during securing */}
              {stage === 'securing' && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm rounded-lg">
                  <Key className="w-10 h-10 text-blue-400 animate-spin drop-shadow-[0_0_10px_rgba(37,99,235,0.5)]" />
                </div>
              )}

              {/* Success checkmark */}
              {stage === 'complete' && (
                <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/20 backdrop-blur-sm rounded-lg animate-fadeIn">
                  <Check className="w-14 h-14 text-emerald-400 animate-scaleIn drop-shadow-[0_0_15px_rgba(52,211,153,0.8)]" strokeWidth={3} />
                </div>
              )}
            </div>

            {/* Orbiting Icons */}
            <div className="absolute inset-0" style={{ width: '200px', height: '200px', top: '-50px', left: '-50px' }}>
              {[
                { Icon: Shield, angle: 0 },
                { Icon: Eye, angle: 90 },
                { Icon: Wifi, angle: 180 },
                { Icon: Database, angle: 270 }
              ].map(({ Icon, angle }, i) => (
                <div
                  key={i}
                  className={`absolute w-8 h-8 flex items-center justify-center rounded-full bg-slate-800/80 backdrop-blur-sm border border-cyan-500/30 transition-all duration-700 ${
                    stage === 'complete' ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
                  }`}
                  style={{
                    top: '50%',
                    left: '50%',
                    transform: `rotate(${angle + (stage !== 'complete' ? progress * 3.6 : 0)}deg) translateY(-100px)`,
                    transition: 'transform 0.3s ease-out'
                  }}
                >
                  <Icon className="w-4 h-4 text-cyan-400" strokeWidth={2} />
                </div>
              ))}
            </div>
          </div>

          {/* Pulsing Glow */}
          <div className={`absolute inset-0 -z-10 transition-all duration-700 ${
            stage === 'complete' ? 'animate-ping scale-150' : 'animate-pulse'
          }`}>
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/30 to-blue-600/30 rounded-full blur-2xl" style={{ width: '150px', height: '150px', top: '-25px', left: '-25px' }}></div>
          </div>
        </div>

        {/* Brand Name with Typing Effect */}
        <div className={`text-center mb-8 transition-all duration-1000 delay-300 ${
          stage === 'initial' ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
        }`}>
          <h1 className="text-5xl font-bold mb-3 tracking-wide relative">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 bg-clip-text text-transparent animate-gradient">
              AirVault
            </span>
            {stage !== 'complete' && (
              <span className="inline-block w-1 h-10 bg-cyan-400 ml-1 animate-blink"></span>
            )}
          </h1>
          <p className="text-cyan-400 text-sm font-semibold tracking-[0.3em] uppercase">
            Ultra-Secure Cloud Storage
          </p>
        </div>

        {/* Advanced Status Display */}
        <div className={`w-full max-w-md mb-8 transition-all duration-500 ${
          stage === 'initial' ? 'opacity-0' : 'opacity-100'
        }`}>
          <div className="bg-slate-900/50 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-6 shadow-2xl">
            {/* Status Header */}
            <div className="text-center mb-4">
              <p className="text-slate-300 text-sm font-medium mb-2 flex items-center justify-center gap-2">
                {stage === 'initial' && (
                  <>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                    Initializing System...
                  </>
                )}
                {stage === 'scanning' && (
                  <>
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                    <Shield className="w-4 h-4 animate-pulse" />
                    System Initialization
                  </>
                )}
                {stage === 'encrypting' && (
                  <>
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <Lock className="w-4 h-4 animate-pulse" />
                    Encrypting Data Stream
                  </>
                )}
                {stage === 'securing' && (
                  <>
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
                    <Key className="w-4 h-4 animate-pulse" />
                    Establishing Secure Channel
                  </>
                )}
                {stage === 'complete' && (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400 font-semibold">Connection Secured</span>
                  </>
                )}
              </p>
            </div>

            {/* Progress Bar with Percentage */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs text-slate-400 font-mono">
                <span>PROGRESS</span>
                <span className="text-cyan-400 font-bold">{progress}%</span>
              </div>
              
              <div className="relative h-3 bg-slate-950 rounded-full overflow-hidden border border-cyan-500/20 shadow-inner">
                <div 
                  className={`absolute top-0 left-0 h-full rounded-full transition-all duration-300 ${
                    stage === 'complete' 
                      ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600' 
                      : 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600'
                  }`}
                  style={{ width: `${progress}%` }}
                >
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
                  
                  {/* Progress glow */}
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/50 to-blue-500/50 blur-sm"></div>
                </div>

                {/* Grid overlay */}
                <div className="absolute inset-0 opacity-20" style={{
                  backgroundImage: 'repeating-linear-gradient(90deg, rgba(6, 182, 212, 0.2) 0px, transparent 1px, transparent 4px)',
                }}></div>
              </div>
            </div>

            {/* Security Metrics */}
            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="text-xs text-slate-400 mb-1">Encryption</div>
                <div className={`text-sm font-bold ${progress > 30 ? 'text-cyan-400' : 'text-slate-600'}`}>
                  AES-256
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-400 mb-1">Protocol</div>
                <div className={`text-sm font-bold ${progress > 60 ? 'text-blue-400' : 'text-slate-600'}`}>
                  TLS 1.3
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-400 mb-1">Status</div>
                <div className={`text-sm font-bold ${progress > 90 ? 'text-emerald-400' : 'text-slate-600'}`}>
                  {progress > 90 ? 'ACTIVE' : 'STANDBY'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Features Checklist */}
        <div className={`w-full max-w-md transition-all duration-700 delay-700 ${
          stage === 'initial' ? 'opacity-0' : 'opacity-100'
        }`}>
          <div className="space-y-2">
            <SecurityFeature 
              text="End-to-End Encryption" 
              completed={progress > 25}
              active={progress >= 15 && progress <= 35}
              icon={Lock}
            />
            <SecurityFeature 
              text="Zero-Knowledge Architecture" 
              completed={progress > 50}
              active={progress >= 40 && progress <= 60}
              icon={Eye}
            />
            <SecurityFeature 
              text="Secure Data Transfer" 
              completed={progress > 75}
              active={progress >= 65 && progress <= 85}
              icon={Database}
            />
            <SecurityFeature 
              text="Military-Grade Security" 
              completed={progress > 95}
              active={progress >= 90 && progress <= 100}
              icon={Shield}
            />
          </div>
        </div>

        {/* Loading Dots */}
        {stage !== 'complete' && (
          <div className="flex gap-2 mt-8">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              ></div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes spinReverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes scaleIn {
          0% { transform: scale(0) rotate(0deg); }
          50% { transform: scale(1.3) rotate(180deg); }
          100% { transform: scale(1) rotate(360deg); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
          50% { transform: translateY(-20px) translateX(10px); opacity: 0.8; }
        }

        @keyframes gridMove {
          0% { transform: translateY(0); }
          100% { transform: translateY(50px); }
        }

        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }

        .animate-shimmer {
          animation: shimmer 2s infinite;
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.8s ease-out;
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }

        .animate-blink {
          animation: blink 1s step-end infinite;
        }
      `}</style>
    </div>
  );
};

const SecurityFeature = ({ text, completed, active, icon: Icon }) => {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
      active 
        ? 'bg-cyan-500/10 border border-cyan-500/30' 
        : completed 
          ? 'bg-emerald-500/10 border border-emerald-500/20' 
          : 'bg-slate-900/30 border border-slate-800'
    }`}>
      {/* Icon + Status Indicator */}
      <div className="relative">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
          completed 
            ? 'bg-emerald-500/20 border border-emerald-500/40' 
            : active 
              ? 'bg-cyan-500/20 border border-cyan-500/40 animate-pulse' 
              : 'bg-slate-800 border border-slate-700'
        }`}>
          {completed ? (
            <Check className="w-4 h-4 text-emerald-400" strokeWidth={3} />
          ) : active ? (
            <Icon className="w-4 h-4 text-cyan-400 animate-pulse" strokeWidth={2} />
          ) : (
            <Icon className="w-4 h-4 text-slate-600" strokeWidth={2} />
          )}
        </div>
        
        {/* Corner dots for active state */}
        {active && (
          <>
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full animate-ping"></div>
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full"></div>
          </>
        )}
      </div>

      {/* Text */}
      <div className="flex-1">
        <span className={`text-sm font-medium transition-colors duration-300 ${
          active 
            ? 'text-cyan-300' 
            : completed 
              ? 'text-emerald-300' 
              : 'text-slate-500'
        }`}>
          {text}
        </span>
      </div>

      {/* Status Indicator */}
      <div className={`text-xs font-mono transition-colors duration-300 ${
        completed 
          ? 'text-emerald-400' 
          : active 
            ? 'text-cyan-400' 
            : 'text-slate-600'
      }`}>
        {completed ? 'OK' : active ? '...' : '--'}
      </div>
    </div>
  );
};

export default LoadingScreen;