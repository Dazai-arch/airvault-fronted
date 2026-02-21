import React, { useState, useEffect } from 'react';
import {
  Shield, Lock, Upload, Key, Wifi, QrCode, Link2, FolderOpen,
  Tag, Search, Eye, Download, Share2, Trash2, AlertCircle,
  CheckCircle, ArrowRight, Zap, Globe, Smartphone, Database,
  Award, Clock, Users, Moon, Sun, Radar, Activity, CheckCircle2,
  Layers, Signal,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from "react-router-dom";

const AirVaultHomepage = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { isDark, toggleTheme }         = useTheme();
  const navigate                        = useNavigate();

  useEffect(() => {
    const handleMouseMove = (e) => setMousePosition({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const navigateToAuth    = () => navigate("/auth");
  const navigateToAirdrop = () => navigate("/airdrop");

  return (
    <div className={`h-screen overflow-hidden ${isDark ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'} ${isDark ? 'text-white' : 'text-gray-900'} transition-colors duration-500 airvault-root`}>

      {/* ─── Global styles ─── */}
      <style jsx>{`
        /* ── Scrollbar — 4px, no arrows, matches vault pages exactly ── */
        .airvault-scrollbar::-webkit-scrollbar { width: 5px; }
        .airvault-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .airvault-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #06b6d4 0%, #3b82f6 45%, #a855f7 100%);
          border-radius: 999px;
        }
        .airvault-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #22d3ee 0%, #60a5fa 45%, #c084fc 100%);
        }

        /* ── AirDrop pulse rings ── */
        @keyframes airdrop-ring {
          0%   { transform: scale(1);   opacity: 0.6; }
          100% { transform: scale(2.8); opacity: 0;   }
        }
        .ring-1 { animation: airdrop-ring 2.8s cubic-bezier(.4,0,.6,1) infinite; }
        .ring-2 { animation: airdrop-ring 2.8s cubic-bezier(.4,0,.6,1) infinite; animation-delay: .9s; }
        .ring-3 { animation: airdrop-ring 2.8s cubic-bezier(.4,0,.6,1) infinite; animation-delay: 1.8s; }

        /* ── Beam travel ── */
        @keyframes beam-travel {
          0%   { transform: translateX(-100%) scaleX(.4); opacity: 0;   }
          15%  { opacity: 1; }
          85%  { opacity: 1; }
          100% { transform: translateX(100%) scaleX(.4);  opacity: 0;   }
        }
        .beam { animation: beam-travel 3.5s ease-in-out infinite; }
        .beam-delayed { animation: beam-travel 3.5s ease-in-out infinite; animation-delay: 1.75s; }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-20px); }
        }
        @keyframes gridMove {
          0%   { transform: translateY(0);    }
          100% { transform: translateY(50px); }
        }
        @keyframes particleFloat {
          0%,100% { transform: translate(0,0) scale(1);           opacity: .2; }
          25%      { transform: translate(100px,-100px) scale(1.2); opacity: .4; }
          50%      { transform: translate(200px,0) scale(.8);       opacity: .3; }
          75%      { transform: translate(100px,100px) scale(1.1);  opacity: .35; }
        }
        @keyframes gradient-x {
          0%,100% { background-position: 0%   50%; }
          50%      { background-position: 100% 50%; }
        }
        @keyframes shimmer      { 0%   { transform: translateX(-100%); } 100% { transform: translateX(100%);  } }
        @keyframes shimmer-slow { 0%   { transform: translateY(100%);  } 100% { transform: translateY(-100%); } }
        @keyframes sparkle {
          0%,100% { opacity: 0; transform: scale(0); }
          50%      { opacity: 1; transform: scale(1); }
        }
        @keyframes slide-up    { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slide-right { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        @keyframes fade-in     { from { opacity: 0; } to { opacity: 1; } }
        @keyframes spin-slow    { from { transform: rotate(0deg);   } to { transform: rotate(360deg);  } }
        @keyframes spin-reverse { from { transform: rotate(360deg); } to { transform: rotate(0deg);    } }
        @keyframes pulse-slow   { 0%,100% { opacity:1; } 50% { opacity:.6; } }
        @keyframes ping-slow {
          0%       { transform: translate(-50%,-50%) scale(1); opacity:1; }
          75%,100% { transform: translate(-50%,-50%) scale(2); opacity:0; }
        }

        .animate-float        { animation: float 3s ease-in-out infinite; }
        .animate-gradient-x   { animation: gradient-x 3s ease infinite; }
        .bg-300\\%             { background-size: 300% 300%; }
        .animate-shimmer      { animation: shimmer 2s infinite; }
        .animate-shimmer-slow { animation: shimmer-slow 3s infinite; }
        .animate-slide-up     { animation: slide-up .8s ease-out forwards; }
        .animate-fade-in      { animation: fade-in 1s ease-out forwards; }
        .animate-spin-slow    { animation: spin-slow 20s linear infinite; }
        .animate-spin-reverse { animation: spin-reverse 15s linear infinite; }
        .animate-pulse-slow   { animation: pulse-slow 3s ease-in-out infinite; }
        .animate-ping-slow    { animation: ping-slow 3s cubic-bezier(0,0,.2,1) infinite; }
        .animate-slide-right  { animation: slide-right 3s linear infinite; }
      `}</style>

      {/* Fixed background layers (pointer-events-none, stay behind scroll) */}
      <div className="fixed inset-0 opacity-10 pointer-events-none z-0">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(${isDark ? 'rgba(56,189,248,.1)' : 'rgba(56,189,248,.2)'} 1px, transparent 1px), linear-gradient(90deg, ${isDark ? 'rgba(56,189,248,.1)' : 'rgba(56,189,248,.2)'} 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
          animation: 'gridMove 20s linear infinite',
        }} />
      </div>

      {/* Cursor Glow */}
      <div className="fixed w-96 h-96 rounded-full pointer-events-none z-40 mix-blend-screen" style={{
        background: isDark
          ? 'radial-gradient(circle, rgba(56,189,248,.12) 0%, transparent 70%)'
          : 'radial-gradient(circle, rgba(56,189,248,.08) 0%, transparent 70%)',
        left: mousePosition.x - 192,
        top:  mousePosition.y - 192,
        transition: 'all .3s ease-out',
      }} />

      {/* Floating Particles */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {[...Array(25)].map((_, i) => {
          const colors = isDark
            ? ['bg-cyan-400','bg-blue-500','bg-emerald-400','bg-violet-500','bg-indigo-500']
            : ['bg-cyan-600','bg-blue-600','bg-emerald-600','bg-violet-600','bg-indigo-600'];
          return (
            <div key={i}
              className={`absolute ${colors[i % colors.length]} rounded-full ${isDark ? 'opacity-20' : 'opacity-10'}`}
              style={{
                width:  Math.random() * 4 + 2,
                height: Math.random() * 4 + 2,
                left:  `${Math.random() * 100}%`,
                top:   `${Math.random() * 100}%`,
                animation: `particleFloat ${Math.random() * 20 + 15}s infinite ease-in-out`,
                animationDelay: `${Math.random() * 5}s`,
              }}
            />
          );
        })}
      </div>

      {/* ══ LAYOUT SHELL: fixed nav + scrollable content ══ */}
      <div className="relative z-10 flex flex-col h-full">

        {/* ══════════ NAVIGATION (fixed height, never scrolls) ══════════ */}
        <header className="flex-shrink-0">
          <nav className={`relative ${isDark ? 'bg-slate-900/95 border-cyan-500/20' : 'bg-white/95 border-cyan-500/30'} backdrop-blur-2xl border-b shadow-lg transition-colors duration-500`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">

              <div className="flex items-center gap-3 group cursor-pointer flex-shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/30 group-hover:shadow-cyan-500/50 transition-all duration-500 group-hover:rotate-6 group-hover:scale-110">
                  <Shield className="text-white w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <div>
                  <div className={`text-lg sm:text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>AirVault</div>
                  <div className="text-xs text-cyan-500">Secure Storage</div>
                </div>
              </div>

              <div className="hidden md:flex gap-6 lg:gap-8 items-center">
                {[['#features','Features'],['#security','Security'],['#vaults','Vaults'],['#airdrop','AirDrop']].map(([href, label]) => (
                  <a key={label} href={href}
                    className={`relative ${isDark ? 'text-gray-300 hover:text-cyan-400' : 'text-gray-600 hover:text-cyan-600'} transition-all duration-300 group text-sm font-medium`}>
                    {label}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-blue-500 group-hover:w-full transition-all duration-300" />
                  </a>
                ))}
                <button onClick={toggleTheme}
                  className={`p-2.5 rounded-xl ${isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-100 hover:bg-gray-200'} transition-all duration-300 group`}>
                  {isDark
                    ? <Sun  className="w-5 h-5 text-yellow-400 group-hover:rotate-90 transition-transform duration-500" />
                    : <Moon className="w-5 h-5 text-indigo-600 group-hover:-rotate-12 transition-transform duration-500" />}
                </button>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <button onClick={navigateToAirdrop}
                  className={`group relative flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl font-semibold text-sm border overflow-hidden transition-all duration-300 ${
                    isDark
                      ? 'bg-violet-500/10 border-violet-500/40 text-violet-300 hover:bg-violet-500/20 hover:border-violet-400/70 hover:text-violet-200 hover:shadow-lg hover:shadow-violet-500/20'
                      : 'bg-violet-50 border-violet-300 text-violet-700 hover:bg-violet-100 hover:border-violet-500 hover:shadow-lg hover:shadow-violet-500/15'
                  }`}>
                  <Wifi className="w-4 h-4 flex-shrink-0 group-hover:animate-pulse" />
                  <span className="hidden sm:inline">AirDrop</span>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-violet-400/20 to-transparent animate-shimmer" />
                  </div>
                </button>

                <button onClick={navigateToAuth}
                  className="relative bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-semibold text-sm sm:text-base transition-all duration-300 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-105 overflow-hidden group text-white">
                  <span className="relative z-10">Get Started</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </button>
              </div>
            </div>
          </nav>
        </header>

        {/* ══ SCROLLABLE CONTENT (only this div scrolls) ══ */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden airvault-scrollbar">

          {/* ══════════ HERO ══════════ */}
          <section className="relative pt-20 pb-20 px-6 overflow-hidden">
            <div className="absolute inset-0">
              <div className={`absolute top-20 left-10 w-96 h-96 ${isDark ? 'bg-cyan-500' : 'bg-cyan-400'} rounded-full blur-3xl ${isDark ? 'opacity-15' : 'opacity-10'} animate-pulse`} />
              <div className={`absolute top-40 right-20 w-96 h-96 ${isDark ? 'bg-blue-600' : 'bg-blue-500'} rounded-full blur-3xl ${isDark ? 'opacity-15' : 'opacity-10'} animate-pulse`} style={{ animationDelay: '1s' }} />
              <div className={`absolute bottom-20 left-1/2 w-96 h-96 ${isDark ? 'bg-indigo-600' : 'bg-indigo-500'} rounded-full blur-3xl ${isDark ? 'opacity-10' : 'opacity-8'} animate-pulse`} style={{ animationDelay: '2s' }} />
            </div>
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] ${isDark ? 'opacity-5' : 'opacity-8'}`}>
              <div className="absolute inset-0 border-2 border-cyan-500 rounded-full animate-spin-slow" />
              <div className="absolute inset-12 border-2 border-blue-500 rounded-full animate-spin-reverse" />
              <div className="absolute inset-24 border-2 border-indigo-500 rounded-full animate-spin-slow" />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
              <div className="text-center mb-12">
                <div className={`inline-flex items-center gap-2 ${isDark ? 'bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border-cyan-400/30' : 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border-cyan-500/40'} border rounded-full px-5 py-2.5 mb-8 backdrop-blur-xl hover:scale-105 transition-all duration-300 shadow-lg animate-float`}>
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
                  <div className="w-2 h-2 bg-cyan-400 rounded-full absolute" />
                  <span className={`text-sm font-medium ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>Enterprise-Grade Security</span>
                </div>

                <h1 className="text-6xl md:text-8xl font-bold mb-6 leading-tight">
                  <span className="inline-block bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 bg-clip-text text-transparent animate-gradient-x bg-300%">
                    Secure File Vault
                  </span>
                  <br />
                  <span className={`inline-block ${isDark ? 'text-white' : 'text-gray-900'} animate-slide-up`} style={{ animationDelay: '0.2s' }}>with Multiple Vaults</span>
                </h1>

                <p className={`text-xl ${isDark ? 'text-gray-400' : 'text-gray-600'} max-w-3xl mx-auto mb-10 leading-relaxed animate-fade-in`} style={{ animationDelay: '0.4s' }}>
                  Create unlimited isolated vaults with military-grade encryption. Organize your documents and sensitive files with enterprise security and instant sharing capabilities.
                </p>

                <div className="flex gap-4 justify-center flex-wrap animate-fade-in" style={{ animationDelay: '0.6s' }}>
                  <button onClick={navigateToAuth}
                    className="group relative bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 px-10 py-4 rounded-xl font-semibold text-lg flex items-center gap-3 transition-all duration-500 shadow-2xl shadow-cyan-500/40 hover:shadow-cyan-500/60 hover:scale-110 overflow-hidden text-white">
                    <span className="relative z-10">Create Your Vault</span>
                    <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-2 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute inset-0 bg-white/10 animate-shimmer" />
                    </div>
                  </button>

                  <button onClick={navigateToAirdrop}
                    className={`group flex items-center gap-3 px-8 py-4 rounded-xl font-semibold text-lg border transition-all duration-500 hover:scale-110 ${
                      isDark
                        ? 'border-violet-500/50 text-violet-300 hover:bg-violet-500/10 hover:border-violet-400 hover:shadow-2xl hover:shadow-violet-500/25'
                        : 'border-violet-400 text-violet-700 hover:bg-violet-50 hover:border-violet-500 hover:shadow-2xl hover:shadow-violet-400/20'
                    }`}>
                    <Wifi className="w-5 h-5 group-hover:animate-pulse" />
                    Try AirDrop
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
                {[
                  { value: '256-bit',   label: 'AES Encryption', icon: Lock,     color: 'from-cyan-500 to-blue-600'    },
                  { value: 'Unlimited', label: 'Vaults',          icon: Database, color: 'from-blue-600 to-indigo-600'  },
                  { value: '24/7',      label: 'Monitoring',      icon: Shield,   color: 'from-indigo-600 to-violet-600' },
                ].map((stat, idx) => (
                  <div key={idx}
                    className={`group relative ${isDark ? 'bg-slate-800/60 border-cyan-500/20 hover:bg-slate-800/80 hover:border-cyan-400/50' : 'bg-white/80 border-cyan-500/30 hover:bg-white hover:border-cyan-500/50'} backdrop-blur-2xl border rounded-2xl p-8 text-center transition-all duration-500 hover:shadow-2xl hover:-translate-y-4 overflow-hidden animate-slide-up`}
                    style={{ animationDelay: `${idx * 0.2}s` }}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-all duration-500`} />
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className={`absolute inset-0 bg-gradient-to-t ${isDark ? 'from-cyan-500/10' : 'from-cyan-500/5'} to-transparent animate-shimmer-slow`} />
                    </div>
                    <div className="relative z-10">
                      <div className={`inline-flex bg-gradient-to-br ${stat.color} w-16 h-16 rounded-2xl items-center justify-center mb-4 shadow-lg group-hover:scale-125 group-hover:rotate-12 transition-all duration-500`}>
                        <stat.icon className="w-8 h-8 text-white" />
                      </div>
                      <div className={`text-4xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-2`}>{stat.value}</div>
                      <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'} font-medium`}>{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className={`${isDark ? 'bg-slate-800/60 border-cyan-500/20 hover:bg-slate-800/80 hover:border-cyan-400/40' : 'bg-white/80 border-cyan-500/30 hover:bg-white hover:border-cyan-500/50'} backdrop-blur-2xl border rounded-3xl p-8 max-w-4xl mx-auto transition-all duration-500 shadow-xl animate-fade-in`}>
                <div className="grid md:grid-cols-3 gap-6">
                  {[
                    { icon: Lock,   title: 'End-to-End Encryption', desc: 'Military-grade security', color: 'from-cyan-500 to-blue-600',    active: true  },
                    { icon: Key,    title: '2FA Protection',          desc: 'Multi-layer auth',        color: 'from-blue-600 to-indigo-600',  active: false },
                    { icon: Shield, title: 'PIN Lock',                desc: 'Extra security',          color: 'from-indigo-600 to-violet-600', active: false },
                  ].map((item, idx) => (
                    <div key={idx} className={`group flex items-start gap-4 p-4 rounded-2xl ${isDark ? 'hover:bg-slate-700/40' : 'hover:bg-gray-50'} transition-all duration-300`}>
                      <div className={`bg-gradient-to-br ${item.color} p-3.5 rounded-xl shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300`}>
                        <item.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className={`font-semibold mb-1 ${isDark ? 'text-white group-hover:text-cyan-400' : 'text-gray-900 group-hover:text-cyan-600'} transition-colors`}>{item.title}</div>
                        <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{item.desc}</div>
                        {item.active && (
                          <div className="mt-2 flex items-center gap-2 text-xs">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
                            <span className="text-emerald-500 font-medium">Active</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ══════════ SECURITY ══════════ */}
          <section id="security" className={`py-20 px-6 ${isDark ? 'bg-slate-900/30' : 'bg-gray-50/50'} relative transition-colors duration-500`}>
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent animate-slide-right" />
            </div>
            <div className="max-w-7xl mx-auto relative z-10">
              <div className="text-center mb-16">
                <div className={`inline-block ${isDark ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border-cyan-400/30' : 'bg-gradient-to-r from-cyan-500/30 to-blue-600/30 border-cyan-500/50'} border rounded-full px-4 py-2 mb-4 backdrop-blur-xl animate-float`}>
                  🛡️ SECURITY FIRST
                </div>
                <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">Private Vault Architecture</h2>
                <p className={`text-xl ${isDark ? 'text-gray-400' : 'text-gray-600'} max-w-3xl mx-auto`}>
                  Every user receives a completely isolated private vault secured with industry-standard JWT authentication and optional two-factor verification.
                </p>
              </div>
              <div className="grid md:grid-cols-2 gap-8 mb-12">
                <div className={`group ${isDark ? 'bg-slate-800/60 border-gray-700/50 hover:bg-slate-800/80 hover:border-cyan-500/40' : 'bg-white/80 border-gray-200 hover:bg-white hover:border-cyan-500/50'} backdrop-blur-xl border rounded-2xl p-8 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2`}>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { icon: Key,        title: 'JWT Authentication', desc: 'Industry-standard tokens',  color: 'from-orange-500 to-red-600'    },
                      { icon: Smartphone, title: 'Two-Factor Auth',     desc: 'OTP or email verification', color: 'from-blue-500 to-indigo-600'   },
                      { icon: Lock,       title: 'PIN Protection',      desc: 'Extra security layer',      color: 'from-emerald-500 to-teal-600'  },
                    ].map((item, idx) => (
                      <div key={idx} className={`${isDark ? 'bg-slate-900/50 hover:bg-slate-700/50' : 'bg-gray-50 hover:bg-gray-100'} rounded-xl p-4 transition-all duration-300 hover:scale-105`}>
                        <div className={`inline-flex bg-gradient-to-br ${item.color} w-12 h-12 rounded-xl items-center justify-center mb-3 shadow-lg`}>
                          <item.icon className="w-6 h-6 text-white" />
                        </div>
                        <div className={`font-semibold mb-1 text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.title}</div>
                        <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{item.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className={`group ${isDark ? 'bg-gradient-to-br from-cyan-900/20 to-slate-800/60 border-gray-700/50 hover:border-cyan-500/40' : 'bg-gradient-to-br from-cyan-50/50 to-white/80 border-gray-200 hover:border-cyan-500/50'} backdrop-blur-xl border rounded-2xl p-8 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2`}>
                  <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">Defense in Depth</h3>
                  <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-6`}>Your vault includes a secondary PIN lock layer, providing defense-in-depth security even if primary credentials are compromised.</p>
                  <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Recovery mechanisms include security questions and backup email verification, ensuring you never lose access to critical documents while maintaining strict security protocols.</p>
                </div>
              </div>
            </div>
          </section>

          {/* ══════════ ENCRYPTION ══════════ */}
          <section className={`py-20 px-6 ${isDark ? 'bg-slate-900/50' : 'bg-white/50'} relative overflow-hidden transition-colors duration-500`}>
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(56,189,248,.3) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
            </div>
            <div className="max-w-7xl mx-auto relative z-10">
              <h2 className="text-5xl font-bold text-center mb-16 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 bg-clip-text text-transparent">End-to-End Encryption</h2>
              <div className="flex items-center justify-between mb-8 gap-4">
                {[
                  { icon: Upload,   title: 'User Upload',        desc: 'File selected from device',  color: 'from-cyan-500 to-blue-600'    },
                  { icon: Lock,     title: 'Backend Encryption', desc: 'AES-256 encryption applied', color: 'from-blue-600 to-indigo-600'  },
                  { icon: Database, title: 'Secure Storage',     desc: 'Encrypted data stored',      color: 'from-indigo-600 to-violet-600' },
                  { icon: Eye,      title: 'Decryption on View', desc: 'Only when user accesses',    color: 'from-violet-600 to-purple-600' },
                ].map((step, idx) => (
                  <div key={idx} className="flex-1 relative group">
                    <div className={`${isDark ? 'bg-slate-800/60 border-gray-700/50 hover:bg-slate-800/80 hover:border-cyan-500/40' : 'bg-white/80 border-gray-200 hover:bg-white hover:border-cyan-500/50'} backdrop-blur-xl border rounded-xl p-6 text-center transition-all duration-500 hover:shadow-2xl hover:-translate-y-3`}>
                      <div className={`bg-gradient-to-br ${step.color} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-12 transition-all duration-500`}>
                        <step.icon className="w-8 h-8 text-white" />
                      </div>
                      <div className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{step.title}</div>
                      <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{step.desc}</div>
                    </div>
                    {idx < 3 && (
                      <div className="hidden lg:block absolute top-1/2 -right-5 -translate-y-1/2 z-10">
                        <ArrowRight className="text-cyan-400 w-6 h-6" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className={`${isDark ? 'bg-slate-800/60 border-gray-700/50' : 'bg-white/80 border-gray-200'} backdrop-blur-xl border rounded-2xl p-8 max-w-4xl mx-auto shadow-xl`}>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-lg`}>Files are encrypted immediately upon upload, ensuring that even system administrators cannot access your sensitive documents.</p>
              </div>
            </div>
          </section>

          {/* ══════════ FEATURES ══════════ */}
          <section id="features" className={`py-20 px-6 ${isDark ? 'bg-slate-900/30' : 'bg-gray-50/50'} relative transition-colors duration-500`}>
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16">
                <div className={`inline-block ${isDark ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-600/20 border-emerald-400/30' : 'bg-gradient-to-r from-emerald-500/30 to-cyan-600/30 border-emerald-500/50'} border rounded-full px-4 py-2 mb-4 backdrop-blur-xl animate-float`}>
                  📁 ORGANIZATION
                </div>
                <h2 className="text-5xl py-2 font-bold mb-4 bg-gradient-to-r from-emerald-400 to-cyan-600 bg-clip-text text-transparent">Intelligent Organization</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-8 mb-12">
                <div className={`${isDark ? 'bg-slate-800/60 border-gray-700/50 hover:bg-slate-800/80 hover:border-emerald-500/40' : 'bg-white/80 border-gray-200 hover:bg-white hover:border-emerald-500/50'} backdrop-blur-xl border rounded-2xl p-8 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2`}>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {[
                      { name: 'Documents', color: 'from-blue-500 to-indigo-600'   },
                      { name: 'Photos',    color: 'from-violet-500 to-purple-600' },
                      { name: 'Medical',   color: 'from-red-500 to-orange-600'    },
                      { name: 'Finance',   color: 'from-emerald-500 to-teal-600'  },
                      { name: 'Certs',     color: 'from-amber-500 to-orange-600'  },
                      { name: 'Personal',  color: 'from-cyan-500 to-blue-600'     },
                    ].map((folder, idx) => (
                      <div key={idx} className={`group ${isDark ? 'bg-slate-900/50' : 'bg-gray-50'} rounded-lg p-4 flex items-center gap-3 hover:bg-gradient-to-r hover:from-emerald-500/10 hover:to-cyan-600/10 transition-all duration-300 cursor-pointer border border-transparent hover:border-emerald-500/30 hover:scale-105`}>
                        <div className={`bg-gradient-to-br ${folder.color} w-10 h-10 rounded-lg flex items-center justify-center shadow-lg`}>
                          <FolderOpen className="w-5 h-5 text-white group-hover:rotate-12 transition-transform duration-300" />
                        </div>
                        <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'} text-sm`}>{folder.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-6">
                  <div className={`${isDark ? 'bg-gradient-to-br from-emerald-900/20 to-slate-800/60 border-gray-700/50 hover:border-emerald-500/40' : 'bg-gradient-to-br from-emerald-50/50 to-white/80 border-gray-200 hover:border-emerald-500/50'} backdrop-blur-xl border rounded-2xl p-8 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2`}>
                    <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-emerald-400 to-cyan-600 bg-clip-text text-transparent">Folders & Tags</h3>
                    <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-4`}>Create custom folder hierarchies to group related files logically. Apply multiple tags to individual files for cross-referencing and quick retrieval.</p>
                    <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>This dual organization system makes your vault easy to navigate even with thousands of stored documents.</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { icon: FolderOpen, title: 'Custom Folders', desc: 'Hierarchical structure', color: 'from-violet-500 to-purple-600' },
                      { icon: Tag,        title: 'Smart Tagging',  desc: 'Multiple tags per file', color: 'from-blue-500 to-cyan-600'    },
                      { icon: Search,     title: 'Search & Filter', desc: 'Full-text search',       color: 'from-emerald-500 to-teal-600' },
                    ].map((item, idx) => (
                      <div key={idx} className={`group ${isDark ? 'bg-slate-800/60 border-gray-700/50 hover:bg-slate-800/80 hover:border-emerald-500/40' : 'bg-white/80 border-gray-200 hover:bg-white hover:border-emerald-500/50'} backdrop-blur-xl border rounded-xl p-4 text-center transition-all duration-300 hover:scale-105`}>
                        <div className={`inline-flex bg-gradient-to-br ${item.color} w-12 h-12 rounded-xl items-center justify-center mx-auto mb-2 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                          <item.icon className="w-6 h-6 text-white" />
                        </div>
                        <div className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'} mb-1`}>{item.title}</div>
                        <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{item.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ══════════ VAULTS ══════════ */}
          <section id="vaults" className={`py-20 px-6 ${isDark ? 'bg-slate-900/50' : 'bg-white/50'} relative overflow-hidden transition-colors duration-500`}>
            <div className={`absolute inset-0 ${isDark ? 'opacity-10' : 'opacity-5'}`}>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] border-2 border-cyan-500 rounded-full animate-ping-slow" />
            </div>
            <div className="max-w-7xl mx-auto relative z-10">
              <div className="text-center mb-16">
                <div className={`inline-block ${isDark ? 'bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border-cyan-400/30' : 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border-cyan-500/50'} border rounded-full px-5 py-2.5 mb-6 backdrop-blur-xl animate-float`}>
                  <span className={`text-sm font-medium ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>🗂️ MULTIPLE VAULTS</span>
                </div>
                <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 bg-clip-text text-transparent">Create Unlimited Vaults</h2>
                <p className={`text-xl ${isDark ? 'text-gray-400' : 'text-gray-600'} max-w-3xl mx-auto`}>Organize your digital life with isolated vaults. Each vault is completely separate with its own encryption keys and access controls.</p>
              </div>
              <div className="grid md:grid-cols-3 gap-8 mb-16">
                {[
                  { icon: Database,   title: 'Personal Vault', desc: 'Store personal documents, IDs, and certificates',      files: '23 Files', color: 'from-cyan-500 to-blue-600',     bgColor: isDark ? 'bg-gradient-to-br from-cyan-500/5 to-blue-600/5'     : 'bg-gradient-to-br from-cyan-500/10 to-blue-600/10'     },
                  { icon: FolderOpen, title: 'Work Vault',     desc: 'Keep professional documents and credentials separate',  files: '47 Files', color: 'from-indigo-500 to-violet-600', bgColor: isDark ? 'bg-gradient-to-br from-indigo-500/5 to-violet-600/5' : 'bg-gradient-to-br from-indigo-500/10 to-violet-600/10' },
                  { icon: Shield,     title: 'Finance Vault',  desc: 'Secure financial records and sensitive data',          files: '15 Files', color: 'from-emerald-500 to-teal-600',  bgColor: isDark ? 'bg-gradient-to-br from-emerald-500/5 to-teal-600/5'  : 'bg-gradient-to-br from-emerald-500/10 to-teal-600/10'  },
                ].map((vault, idx) => (
                  <div key={idx}
                    className={`group relative ${isDark ? 'bg-slate-800/40 border-gray-700/50 hover:bg-slate-800/70 hover:border-cyan-500/50' : 'bg-white/60 border-gray-200 hover:bg-white hover:border-cyan-500/50'} backdrop-blur-2xl border rounded-3xl p-8 transition-all duration-500 hover:shadow-2xl hover:-translate-y-4 overflow-hidden cursor-pointer animate-slide-up`}
                    style={{ animationDelay: `${idx * 0.15}s` }}>
                    <div className={`absolute inset-0 ${vault.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                    <div className="relative z-10">
                      <div className={`inline-flex bg-gradient-to-br ${vault.color} w-16 h-16 rounded-2xl items-center justify-center mb-6 shadow-2xl group-hover:scale-125 group-hover:rotate-12 transition-all duration-500`}>
                        <vault.icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className={`text-2xl font-bold mb-3 ${isDark ? 'text-white group-hover:text-cyan-400' : 'text-gray-900 group-hover:text-cyan-600'} transition-colors`}>{vault.title}</h3>
                      <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-6 leading-relaxed`}>{vault.desc}</p>
                      <div className={`flex items-center justify-between pt-4 border-t ${isDark ? 'border-gray-700/50' : 'border-gray-200'}`}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${vault.color} animate-pulse shadow-lg`} />
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{vault.files}</span>
                        </div>
                        <ArrowRight className={`w-5 h-5 ${isDark ? 'text-gray-500 group-hover:text-cyan-400' : 'text-gray-400 group-hover:text-cyan-600'} group-hover:translate-x-2 transition-all duration-300`} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center">
                <button onClick={navigateToAuth}
                  className={`group ${isDark ? 'bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border-cyan-400/30 hover:border-cyan-400/60' : 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border-cyan-500/50 hover:border-cyan-600/70'} border px-8 py-4 rounded-xl font-semibold text-lg flex items-center gap-3 mx-auto transition-all duration-500 hover:shadow-2xl hover:scale-110`}>
                  <Database className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                  Create New Vault
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
                </button>
              </div>
            </div>
          </section>

          {/* ══════════ AIRDROP ══════════ */}
          <section id="airdrop" className={`py-24 px-6 relative overflow-hidden transition-colors duration-500 ${isDark ? 'bg-gradient-to-br from-slate-900 via-violet-950/30 to-slate-900' : 'bg-gradient-to-br from-gray-50 via-violet-50/60 to-gray-50'}`}>
            <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/60 to-transparent`} />
            <div className={`absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/60 to-transparent`} />
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className={`absolute -top-40 left-1/4 w-[500px] h-[500px] ${isDark ? 'bg-violet-700/15' : 'bg-violet-400/12'} rounded-full blur-3xl animate-pulse`} style={{ animationDelay: '.5s' }} />
              <div className={`absolute -bottom-40 right-1/4 w-[500px] h-[500px] ${isDark ? 'bg-purple-700/12' : 'bg-purple-400/10'} rounded-full blur-3xl animate-pulse`} />
              <div className={`absolute top-1/3 left-0 right-0 h-px overflow-hidden`}>
                <div className="h-full w-48 bg-gradient-to-r from-transparent via-violet-500/70 to-transparent beam" />
              </div>
              <div className={`absolute top-2/3 left-0 right-0 h-px overflow-hidden`}>
                <div className="h-full w-48 bg-gradient-to-r from-transparent via-violet-500/70 to-transparent beam-delayed" />
              </div>
            </div>
            <div className="max-w-7xl mx-auto relative z-10">
              <div className="text-center mb-16">
                <div className={`inline-flex items-center gap-2.5 ${isDark ? 'bg-violet-500/10 border-violet-500/30' : 'bg-violet-50 border-violet-300'} border rounded-full px-5 py-2.5 mb-6 backdrop-blur-xl animate-float`}>
                  <span className="relative flex">
                    <span className="absolute inline-flex w-2 h-2 rounded-full bg-violet-400 animate-ping" />
                    <span className="relative inline-flex w-2 h-2 rounded-full bg-violet-500" />
                  </span>
                  <span className={`text-sm font-semibold ${isDark ? 'text-violet-300' : 'text-violet-700'}`}>✦ AIRDROP — No Account Needed</span>
                </div>
                <h2 className="text-5xl py-2 md:text-6xl font-bold mb-5 bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">Instant Wireless Sharing</h2>
                <p className={`text-xl max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Send files peer-to-peer in seconds. No login, no cloud upload, no database — just open, scan, and share.</p>
              </div>
              <div className="grid lg:grid-cols-2 gap-14 items-center mb-16">
                <div className="flex justify-center">
                  <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">
                    <div className={`absolute w-full h-full rounded-full border-2 ${isDark ? 'border-violet-500/25' : 'border-violet-400/30'} ring-1`} />
                    <div className={`absolute w-full h-full rounded-full border-2 ${isDark ? 'border-violet-500/20' : 'border-violet-400/25'} ring-2`} />
                    <div className={`absolute w-full h-full rounded-full border-2 ${isDark ? 'border-violet-500/15' : 'border-violet-400/20'} ring-3`} />
                    <div className={`absolute inset-8 rounded-full border ${isDark ? 'border-violet-500/15' : 'border-violet-400/20'}`} />
                    <div className={`absolute inset-16 rounded-full border ${isDark ? 'border-violet-500/25' : 'border-violet-400/30'}`} />
                    <div className={`absolute inset-24 rounded-full border ${isDark ? 'border-violet-500/35' : 'border-violet-400/40'}`} />
                    {[
                      { deg: 0,   Icon: Smartphone, col: 'text-violet-400' },
                      { deg: 72,  Icon: Layers,      col: 'text-purple-400' },
                      { deg: 144, Icon: Database,    col: 'text-fuchsia-400' },
                      { deg: 216, Icon: Shield,      col: 'text-violet-400' },
                      { deg: 288, Icon: Signal,       col: 'text-purple-400' },
                    ].map(({ deg, Icon, col }, i) => (
                      <div key={i}
                        className={`absolute w-9 h-9 rounded-xl flex items-center justify-center shadow-lg border backdrop-blur-sm ${isDark ? 'bg-slate-800/90 border-violet-500/40' : 'bg-white border-violet-300'}`}
                        style={{ transform: `rotate(${deg}deg) translate(116px) rotate(-${deg}deg)` }}>
                        <Icon className={`w-4 h-4 ${col}`} />
                      </div>
                    ))}
                    <div className="relative z-10 w-24 h-24 rounded-3xl flex items-center justify-center bg-gradient-to-br from-violet-500 to-purple-600 shadow-2xl shadow-violet-500/40">
                      <Wifi className="w-12 h-12 text-white" />
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { Icon: Radar,        title: 'Proximity Discovery',     desc: 'Automatically finds nearby AirVault users on the same network.',               color: 'from-violet-500 to-purple-600'  },
                    { Icon: Lock,         title: 'Zero-Knowledge Transfer', desc: 'Files are encrypted end-to-end. Only the recipient can decrypt.',              color: 'from-purple-500 to-fuchsia-600' },
                    { Icon: QrCode,       title: 'QR Code Handshake',       desc: 'Scan a QR code to instantly pair two devices. No accounts needed.',           color: 'from-fuchsia-500 to-pink-600'   },
                    { Icon: Activity,     title: 'Real-Time Progress',      desc: 'Live transfer speed, ETA, and completion notification.',                       color: 'from-pink-500 to-rose-600'      },
                    { Icon: CheckCircle2, title: 'No Account Required',     desc: "The recipient doesn't need an AirVault account. Any browser-enabled device works.", color: 'from-rose-500 to-orange-500'  },
                  ].map(({ Icon, title, desc, color }, i) => (
                    <div key={i} className={`group flex items-start gap-4 p-4 rounded-2xl border transition-all duration-300 hover:-translate-y-0.5 ${isDark ? 'bg-slate-800/40 border-slate-700/50 hover:border-violet-500/50 hover:bg-slate-800/70 hover:shadow-xl hover:shadow-violet-500/10' : 'bg-white/70 border-gray-200 hover:border-violet-400/60 hover:bg-white hover:shadow-xl hover:shadow-violet-400/10'}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${color} shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className={`font-semibold text-sm mb-0.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>{title}</p>
                        <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className={`rounded-3xl border p-8 sm:p-10 mb-12 relative overflow-hidden ${isDark ? 'bg-slate-800/40 border-violet-500/20' : 'bg-white/70 border-violet-300/50'} backdrop-blur-xl`}>
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-500 via-purple-400 to-fuchsia-500 rounded-t-3xl" />
                <h3 className={`text-2xl font-bold text-center mb-10 ${isDark ? 'text-white' : 'text-gray-900'}`}>How AirDrop Works — 4 Steps</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 relative">
                  <div className={`hidden sm:block absolute top-8 left-[12.5%] right-[12.5%] h-px ${isDark ? 'bg-gradient-to-r from-violet-500/20 via-purple-400/30 to-fuchsia-500/20' : 'bg-gradient-to-r from-violet-300/40 via-purple-300/50 to-fuchsia-300/40'}`} />
                  {[
                    { step: '01', Icon: Smartphone, label: 'Open AirDrop',  desc: 'No login needed'        },
                    { step: '02', Icon: QrCode,     label: 'Scan QR',        desc: 'Instant device pairing' },
                    { step: '03', Icon: Upload,     label: 'Pick Files',      desc: 'Any format, any size'   },
                    { step: '04', Icon: Zap,        label: 'Done in Seconds', desc: 'Encrypted & delivered'  },
                  ].map(({ step, Icon, label, desc }, i) => (
                    <div key={i} className="flex flex-col items-center text-center relative z-10">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-xl bg-gradient-to-br from-violet-500 to-purple-600 hover:scale-110 hover:-translate-y-1 transition-all duration-300 cursor-default">
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <span className={`text-[10px] font-black tracking-widest mb-1 ${isDark ? 'text-violet-400' : 'text-violet-600'}`}>{step}</span>
                      <p className={`font-bold text-sm mb-0.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>{label}</p>
                      <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{desc}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-3 mb-10">
                {[
                  { text: 'No Account Required',    dot: 'bg-violet-400' },
                  { text: 'No Database Used',        dot: 'bg-purple-400' },
                  { text: 'End-to-End Encrypted',   dot: 'bg-fuchsia-400' },
                  { text: 'Any Device, Any Browser', dot: 'bg-pink-400'   },
                ].map(({ text, dot }) => (
                  <span key={text} className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border ${isDark ? 'bg-violet-500/10 border-violet-500/25 text-violet-300' : 'bg-violet-50 border-violet-200 text-violet-700'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                    {text}
                  </span>
                ))}
              </div>
              <div className="text-center">
                <button onClick={navigateToAirdrop}
                  className="group relative inline-flex items-center gap-3 px-12 py-4 rounded-xl font-semibold text-lg bg-gradient-to-r from-violet-500 via-purple-600 to-fuchsia-600 text-white shadow-2xl shadow-violet-500/40 hover:shadow-violet-500/60 hover:scale-110 transition-all duration-500 overflow-hidden">
                  <Wifi className="w-5 h-5 group-hover:animate-pulse relative z-10" />
                  <span className="relative z-10">Launch AirDrop</span>
                  <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-2 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-600 via-purple-600 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </button>
                <p className={`mt-4 text-sm ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>Free · No signup · Works instantly on any device</p>
              </div>
            </div>
          </section>

          {/* ══════════ CTA ══════════ */}
          <section className={`py-20 px-6 ${isDark ? 'bg-gradient-to-br from-cyan-900/10 via-blue-900/10 to-slate-900/30' : 'bg-gradient-to-br from-cyan-50/50 via-blue-50/50 to-gray-100/50'} relative overflow-hidden transition-colors duration-500`}>
            <div className="absolute inset-0">
              <div className={`absolute top-0 left-0 w-96 h-96 bg-cyan-500 rounded-full blur-3xl ${isDark ? 'opacity-10' : 'opacity-5'} animate-pulse`} />
              <div className={`absolute bottom-0 right-0 w-96 h-96 bg-blue-600 rounded-full blur-3xl ${isDark ? 'opacity-10' : 'opacity-5'} animate-pulse`} style={{ animationDelay: '1s' }} />
            </div>
            <div className="max-w-4xl mx-auto text-center relative z-10">
              <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 bg-clip-text text-transparent">Ready to Secure Your Files?</h2>
              <p className={`text-xl ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-10`}>Join thousands of users protecting their sensitive documents with AirVault.</p>
              <button onClick={navigateToAuth}
                className="group relative bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 px-12 py-5 rounded-xl font-semibold text-lg flex items-center gap-3 mx-auto transition-all duration-500 shadow-2xl shadow-cyan-500/40 hover:shadow-cyan-500/60 hover:scale-110 overflow-hidden text-white">
                <span className="relative z-10">Start Securing Your Files</span>
                <ArrowRight className="w-6 h-6 relative z-10 group-hover:translate-x-2 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </button>
            </div>
          </section>

          {/* ══════════ FOOTER ══════════ */}
          <footer className={`py-12 px-6 border-t ${isDark ? 'border-gray-700/50 bg-slate-900/80' : 'border-gray-200 bg-white/80'} transition-colors duration-500`}>
            <div className={`max-w-7xl mx-auto text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <div className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>AirVault</div>
                  <div className="text-xs text-cyan-500">Secure Storage</div>
                </div>
              </div>
              <p>© 2026 AirVault. All rights reserved. Your files, your privacy.</p>
            </div>
          </footer>

        </div>{/* end scrollable */}
      </div>{/* end layout shell */}
    </div>
  );
};

export default AirVaultHomepage;