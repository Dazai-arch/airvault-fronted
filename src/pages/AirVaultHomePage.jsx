import React, { useState, useEffect } from 'react';
import { Shield, Lock, Upload, Key, Wifi, QrCode, Link2, FolderOpen, Tag, Search, Eye, Download, Share2, Trash2, AlertCircle, CheckCircle, ArrowRight, Zap, Globe, Smartphone, Database, Award, Clock, Users, Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import AuthPage from './AuthPage';
import { useNavigate } from "react-router-dom";

const AirVaultHomepage = () => {
  const [scrollY, setScrollY] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Navigate to auth page
  const navigate = useNavigate();

  const navigateToAuth = () => {
    navigate("/auth");
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'} ${isDark ? 'text-white' : 'text-gray-900'} overflow-x-hidden transition-colors duration-500`}>
      {/* Animated Background Grid */}
      <div className="fixed inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(${isDark ? 'rgba(56, 189, 248, 0.1)' : 'rgba(56, 189, 248, 0.2)'} 1px, transparent 1px), linear-gradient(90deg, ${isDark ? 'rgba(56, 189, 248, 0.1)' : 'rgba(56, 189, 248, 0.2)'} 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
          animation: 'gridMove 20s linear infinite'
        }}></div>
      </div>

      {/* Cursor Glow Effect */}
      <div 
        className="fixed w-96 h-96 rounded-full pointer-events-none z-40 mix-blend-screen"
        style={{
          background: isDark 
            ? 'radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(56, 189, 248, 0.08) 0%, transparent 70%)',
          left: mousePosition.x - 192,
          top: mousePosition.y - 192,
          transition: 'all 0.3s ease-out'
        }}
      ></div>

      {/* Floating Particles */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(25)].map((_, i) => {
          const colors = isDark 
            ? ['bg-cyan-400', 'bg-blue-500', 'bg-emerald-400', 'bg-violet-500', 'bg-indigo-500']
            : ['bg-cyan-600', 'bg-blue-600', 'bg-emerald-600', 'bg-violet-600', 'bg-indigo-600'];
          const randomColor = colors[Math.floor(Math.random() * colors.length)];
          return (
            <div
              key={i}
              className={`absolute ${randomColor} rounded-full ${isDark ? 'opacity-20' : 'opacity-10'}`}
              style={{
                width: Math.random() * 4 + 2,
                height: Math.random() * 4 + 2,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `particleFloat ${Math.random() * 20 + 15}s infinite ease-in-out`,
                animationDelay: `${Math.random() * 5}s`
              }}
            />
          );
        })}
      </div>

      {/* Navigation - Fixed with proper z-index */}
      <header className="fixed top-0 left-0 right-0 lg:right-4 z-50">
      <nav className={`relative ${isDark ? 'bg-slate-900/95 border-cyan-500/20' : 'bg-white/95 border-cyan-500/30'} backdrop-blur-2xl border-b shadow-lg ${isDark ? 'shadow-cyan-500/5' : 'shadow-cyan-500/10'} transition-colors duration-500`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/30 group-hover:shadow-cyan-500/50 transition-all duration-500 group-hover:rotate-6 group-hover:scale-110">
              <Shield className="text-white w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <div className={`text-lg sm:text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>AirVault</div>
              <div className="text-xs text-cyan-500">Secure Storage</div>
            </div>
          </div>
          <div className="hidden md:flex gap-6 lg:gap-8 items-center">
            <a href="#features" className={`relative ${isDark ? 'text-gray-300 hover:text-cyan-400' : 'text-gray-600 hover:text-cyan-600'} transition-all duration-300 group`}>
              Features
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-blue-500 group-hover:w-full transition-all duration-300"></span>
            </a>
            <a href="#security" className={`relative ${isDark ? 'text-gray-300 hover:text-cyan-400' : 'text-gray-600 hover:text-cyan-600'} transition-all duration-300 group`}>
              Security
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-blue-500 group-hover:w-full transition-all duration-300"></span>
            </a>
            <a href="#vaults" className={`relative ${isDark ? 'text-gray-300 hover:text-cyan-400' : 'text-gray-600 hover:text-cyan-600'} transition-all duration-300 group`}>
              Vaults
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-blue-500 group-hover:w-full transition-all duration-300"></span>
            </a>
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-xl ${isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-100 hover:bg-gray-200'} transition-all duration-300 group`}
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-yellow-400 group-hover:rotate-90 transition-transform duration-500" />
              ) : (
                <Moon className="w-5 h-5 text-indigo-600 group-hover:-rotate-12 transition-transform duration-500" />
              )}
            </button>
          </div>
          <button 
            onClick={navigateToAuth}
            className="relative bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-semibold text-sm sm:text-base transition-all duration-300 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:scale-105 overflow-hidden group text-white"
          >
            <span className="relative z-10">Get Started</span>
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </button>
        </div>
      </nav>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Animated Gradient Orbs */}
        <div className="absolute inset-0">
          <div className={`absolute top-20 left-10 w-96 h-96 ${isDark ? 'bg-cyan-500' : 'bg-cyan-400'} rounded-full blur-3xl ${isDark ? 'opacity-15' : 'opacity-10'} animate-pulse`}></div>
          <div className={`absolute top-40 right-20 w-96 h-96 ${isDark ? 'bg-blue-600' : 'bg-blue-500'} rounded-full blur-3xl ${isDark ? 'opacity-15' : 'opacity-10'} animate-pulse`} style={{ animationDelay: '1s' }}></div>
          <div className={`absolute bottom-20 left-1/2 w-96 h-96 ${isDark ? 'bg-indigo-600' : 'bg-indigo-500'} rounded-full blur-3xl ${isDark ? 'opacity-10' : 'opacity-8'} animate-pulse`} style={{ animationDelay: '2s' }}></div>
        </div>

        {/* Rotating Rings */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] ${isDark ? 'opacity-5' : 'opacity-8'}`}>
          <div className="absolute inset-0 border-2 border-cyan-500 rounded-full animate-spin-slow"></div>
          <div className="absolute inset-12 border-2 border-blue-500 rounded-full animate-spin-reverse"></div>
          <div className="absolute inset-24 border-2 border-indigo-500 rounded-full animate-spin-slow"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-12">
            <div className={`inline-flex items-center gap-2 ${isDark ? 'bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border-cyan-400/30' : 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border-cyan-500/40'} border rounded-full px-5 py-2.5 mb-8 backdrop-blur-xl hover:scale-105 transition-all duration-300 shadow-lg ${isDark ? 'shadow-cyan-500/20' : 'shadow-cyan-500/30'} animate-float`}>
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-ping"></div>
              <div className="w-2 h-2 bg-cyan-400 rounded-full absolute"></div>
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
              Create unlimited isolated vaults with military-grade encryption. Organize your documents, credentials, and sensitive files with enterprise security and instant sharing capabilities.
            </p>
            
            <div className="flex gap-4 justify-center animate-fade-in" style={{ animationDelay: '0.6s' }}>
              <button 
                onClick={navigateToAuth}
                className="group relative bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 px-10 py-4 rounded-xl font-semibold text-lg flex items-center gap-3 transition-all duration-500 shadow-2xl shadow-cyan-500/40 hover:shadow-cyan-500/60 hover:scale-110 overflow-hidden text-white"
              >
                <span className="relative z-10">Create Your Vault</span>
                <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-2 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-gradient-x bg-300%"></div>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute inset-0 bg-white/10 animate-shimmer"></div>
                </div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
            {[
              { value: '256-bit', label: 'AES Encryption', icon: Lock, color: 'from-cyan-500 to-blue-600' },
              { value: 'Unlimited', label: 'Vaults', icon: Database, color: 'from-blue-600 to-indigo-600' },
              { value: '24/7', label: 'Monitoring', icon: Shield, color: 'from-indigo-600 to-violet-600' }
            ].map((stat, idx) => (
              <div 
                key={idx} 
                className={`group relative ${isDark ? 'bg-slate-800/60 border-cyan-500/20' : 'bg-white/80 border-cyan-500/30'} backdrop-blur-2xl border rounded-2xl p-8 text-center ${isDark ? 'hover:bg-slate-800/80 hover:border-cyan-400/50' : 'hover:bg-white hover:border-cyan-500/50'} transition-all duration-500 hover:shadow-2xl ${isDark ? 'hover:shadow-cyan-500/20' : 'hover:shadow-cyan-500/30'} hover:-translate-y-4 overflow-hidden animate-slide-up`}
                style={{ animationDelay: `${idx * 0.2}s` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-all duration-500`}></div>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className={`absolute inset-0 bg-gradient-to-t ${isDark ? 'from-cyan-500/10' : 'from-cyan-500/5'} to-transparent animate-shimmer-slow`}></div>
                </div>
                
                <div className="relative z-10">
                  <div className={`inline-flex bg-gradient-to-br ${stat.color} w-16 h-16 rounded-2xl items-center justify-center mb-4 shadow-lg group-hover:scale-125 group-hover:rotate-12 transition-all duration-500`}>
                    <stat.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className={`text-4xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300`}>{stat.value}</div>
                  <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'} font-medium`}>{stat.label}</div>
                </div>

                {/* Particle effect on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className={`absolute w-1 h-1 bg-cyan-400 rounded-full`}
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animation: `sparkle ${Math.random() * 2 + 1}s ease-out infinite`,
                        animationDelay: `${Math.random() * 0.5}s`
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className={`${isDark ? 'bg-slate-800/60 border-cyan-500/20' : 'bg-white/80 border-cyan-500/30'} backdrop-blur-2xl border rounded-3xl p-8 max-w-4xl mx-auto ${isDark ? 'hover:bg-slate-800/80 hover:border-cyan-400/40' : 'hover:bg-white hover:border-cyan-500/50'} transition-all duration-500 shadow-xl ${isDark ? 'shadow-cyan-500/10' : 'shadow-cyan-500/20'} animate-fade-in`}>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: Lock, title: 'End-to-End Encryption', desc: 'Military-grade security', color: 'from-cyan-500 to-blue-600' },
                { icon: Key, title: '2FA Protection', desc: 'Multi-layer auth', color: 'from-blue-600 to-indigo-600' },
                { icon: Shield, title: 'PIN Lock', desc: 'Extra security', color: 'from-indigo-600 to-violet-600' }
              ].map((item, idx) => (
                <div key={idx} className={`group flex items-start gap-4 p-4 rounded-2xl ${isDark ? 'hover:bg-slate-700/40' : 'hover:bg-gray-50'} transition-all duration-300`}>
                  <div className={`bg-gradient-to-br ${item.color} p-3.5 rounded-xl shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300`}>
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className={`font-semibold mb-1 ${isDark ? 'text-white group-hover:text-cyan-400' : 'text-gray-900 group-hover:text-cyan-600'} transition-colors`}>{item.title}</div>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{item.desc}</div>
                    {idx === 0 && (
                      <div className="mt-2 flex items-center gap-2 text-xs">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></div>
                        <div className="w-2 h-2 bg-emerald-400 rounded-full absolute"></div>
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

      {/* Security Architecture */}
      <section id="security" className={`py-20 px-6 ${isDark ? 'bg-slate-900/30' : 'bg-gray-50/50'} relative transition-colors duration-500`}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent animate-slide-right"></div>
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
            <div className={`group ${isDark ? 'bg-slate-800/60 border-gray-700/50 hover:bg-slate-800/80 hover:border-cyan-500/40' : 'bg-white/80 border-gray-200 hover:bg-white hover:border-cyan-500/50'} backdrop-blur-xl border rounded-2xl p-8 transition-all duration-500 hover:shadow-2xl ${isDark ? 'hover:shadow-cyan-500/10' : 'hover:shadow-cyan-500/20'} hover:-translate-y-2`}>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Key, title: 'JWT Authentication', desc: 'Industry-standard tokens', color: 'from-orange-500 to-red-600' },
                  { icon: Smartphone, title: 'Two-Factor Auth', desc: 'OTP or email verification', color: 'from-blue-500 to-indigo-600' },
                  { icon: Lock, title: 'PIN Protection', desc: 'Extra security layer', color: 'from-emerald-500 to-teal-600' }
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

            <div className={`group ${isDark ? 'bg-gradient-to-br from-cyan-900/20 to-slate-800/60 border-gray-700/50 hover:border-cyan-500/40' : 'bg-gradient-to-br from-cyan-50/50 to-white/80 border-gray-200 hover:border-cyan-500/50'} backdrop-blur-xl border rounded-2xl p-8 transition-all duration-500 hover:shadow-2xl ${isDark ? 'hover:shadow-cyan-500/10' : 'hover:shadow-cyan-500/20'} hover:-translate-y-2`}>
              <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">Defense in Depth</h3>
              <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
                Your vault includes a secondary PIN lock layer, providing defense-in-depth security even if primary credentials are compromised.
              </p>
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                Recovery mechanisms include security questions and backup email verification, ensuring you never lose access to critical documents while maintaining strict security protocols. All authentication events are logged and monitored for suspicious activity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* End-to-End Encryption */}
      <section className={`py-20 px-6 ${isDark ? 'bg-slate-900/50' : 'bg-white/50'} relative overflow-hidden transition-colors duration-500`}>
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle, rgba(56, 189, 248, 0.3) 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }}></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <h2 className="text-5xl font-bold text-center mb-16 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 bg-clip-text text-transparent">End-to-End Encryption</h2>
          
          <div className="relative mb-12">
            <div className="flex items-center justify-between mb-8 gap-4">
              {[
                { icon: Upload, title: 'User Upload', desc: 'File selected from device', color: 'from-cyan-500 to-blue-600' },
                { icon: Lock, title: 'Backend Encryption', desc: 'AES-256 encryption applied', color: 'from-blue-600 to-indigo-600' },
                { icon: Database, title: 'Secure Storage', desc: 'Encrypted data stored', color: 'from-indigo-600 to-violet-600' },
                { icon: Eye, title: 'Decryption on View', desc: 'Only when user accesses', color: 'from-violet-600 to-purple-600' }
              ].map((step, idx) => (
                <div key={idx} className="flex-1 relative group">
                  <div className={`${isDark ? 'bg-slate-800/60 border-gray-700/50 hover:bg-slate-800/80 hover:border-cyan-500/40' : 'bg-white/80 border-gray-200 hover:bg-white hover:border-cyan-500/50'} backdrop-blur-xl border rounded-xl p-6 text-center transition-all duration-500 hover:shadow-2xl ${isDark ? 'hover:shadow-cyan-500/20' : 'hover:shadow-cyan-500/30'} hover:-translate-y-3`}>
                    <div className={`bg-gradient-to-br ${step.color} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-cyan-500/30 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500`}>
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
          </div>

          <div className={`${isDark ? 'bg-slate-800/60 border-gray-700/50 hover:bg-slate-800/80 hover:border-cyan-500/40' : 'bg-white/80 border-gray-200 hover:bg-white hover:border-cyan-500/50'} backdrop-blur-xl border rounded-2xl p-8 max-w-4xl mx-auto transition-all duration-500 shadow-xl`}>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-lg`}>
              Files are encrypted immediately upon upload, ensuring that even system administrators cannot access your sensitive documents. The system supports certificates, documents, images, PDFs, and personal files. Advanced implementations can leverage client-side encryption for additional security, giving users complete control over their encryption keys.
            </p>
          </div>
        </div>
      </section>

      {/* Intelligent Organization */}
      <section id="features" className={`py-20 px-6 ${isDark ? 'bg-slate-900/30' : 'bg-gray-50/50'} relative transition-colors duration-500`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className={`inline-block ${isDark ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-600/20 border-emerald-400/30' : 'bg-gradient-to-r from-emerald-500/30 to-cyan-600/30 border-emerald-500/50'} border rounded-full px-4 py-2 mb-4 backdrop-blur-xl animate-float`}>
              📁 ORGANIZATION
            </div>
            <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-emerald-400 to-cyan-600 bg-clip-text text-transparent">Intelligent Organization</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className={`${isDark ? 'bg-slate-800/60 border-gray-700/50 hover:bg-slate-800/80 hover:border-emerald-500/40' : 'bg-white/80 border-gray-200 hover:bg-white hover:border-emerald-500/50'} backdrop-blur-xl border rounded-2xl p-8 transition-all duration-500 hover:shadow-2xl ${isDark ? 'hover:shadow-emerald-500/10' : 'hover:shadow-emerald-500/20'} hover:-translate-y-2`}>
              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  { name: 'Documents', color: 'from-blue-500 to-indigo-600' },
                  { name: 'Photos', color: 'from-violet-500 to-purple-600' },
                  { name: 'Medical', color: 'from-red-500 to-orange-600' },
                  { name: 'Finance', color: 'from-emerald-500 to-teal-600' },
                  { name: 'Certificates', color: 'from-amber-500 to-orange-600' },
                  { name: 'Personal', color: 'from-cyan-500 to-blue-600' }
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
              <div className={`${isDark ? 'bg-gradient-to-br from-emerald-900/20 to-slate-800/60 border-gray-700/50 hover:border-emerald-500/40' : 'bg-gradient-to-br from-emerald-50/50 to-white/80 border-gray-200 hover:border-emerald-500/50'} backdrop-blur-xl border rounded-2xl p-8 transition-all duration-500 hover:shadow-2xl ${isDark ? 'hover:shadow-emerald-500/10' : 'hover:shadow-emerald-500/20'} hover:-translate-y-2`}>
                <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-emerald-400 to-cyan-600 bg-clip-text text-transparent">Folders & Tags</h3>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
                  Create custom folder hierarchies to group related files logically. Apply multiple tags to individual files for cross-referencing and quick retrieval. Tag examples include "College", "Bank", "ID Proof", "Medical", or custom categories.
                </p>
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                  This dual organization system makes your vault easy to navigate even with thousands of stored documents. Search by folder structure or filter by tags to find exactly what you need instantly.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {[
                  { icon: FolderOpen, title: 'Custom Folders', desc: 'Hierarchical structure', color: 'from-violet-500 to-purple-600' },
                  { icon: Tag, title: 'Smart Tagging', desc: 'Multiple tags per file', color: 'from-blue-500 to-cyan-600' },
                  { icon: Search, title: 'Search & Filter', desc: 'Full-text search', color: 'from-emerald-500 to-teal-600' }
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

      {/* Multiple Vaults */}
      <section id="vaults" className={`py-20 px-6 ${isDark ? 'bg-slate-900/50' : 'bg-white/50'} relative overflow-hidden transition-colors duration-500`}>
        <div className={`absolute inset-0 ${isDark ? 'opacity-10' : 'opacity-5'}`}>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] border-2 border-cyan-500 rounded-full animate-ping-slow"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <div className={`inline-block ${isDark ? 'bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border-cyan-400/30' : 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border-cyan-500/50'} border rounded-full px-5 py-2.5 mb-6 backdrop-blur-xl animate-float`}>
              <span className={`text-sm font-medium ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>🗂️ MULTIPLE VAULTS</span>
            </div>
            <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 bg-clip-text text-transparent">Create Unlimited Vaults</h2>
            <p className={`text-xl ${isDark ? 'text-gray-400' : 'text-gray-600'} max-w-3xl mx-auto`}>
              Organize your digital life with isolated vaults. Each vault is completely separate with its own encryption keys and access controls.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {[
              {
                icon: Database,
                title: 'Personal Vault',
                desc: 'Store personal documents, IDs, and certificates',
                files: '23 Files',
                color: 'from-cyan-500 to-blue-600',
                bgColor: isDark ? 'bg-gradient-to-br from-cyan-500/5 to-blue-600/5' : 'bg-gradient-to-br from-cyan-500/10 to-blue-600/10'
              },
              {
                icon: FolderOpen,
                title: 'Work Vault',
                desc: 'Keep professional documents and credentials separate',
                files: '47 Files',
                color: 'from-indigo-500 to-violet-600',
                bgColor: isDark ? 'bg-gradient-to-br from-indigo-500/5 to-violet-600/5' : 'bg-gradient-to-br from-indigo-500/10 to-violet-600/10'
              },
              {
                icon: Shield,
                title: 'Finance Vault',
                desc: 'Secure financial records and sensitive data',
                files: '15 Files',
                color: 'from-emerald-500 to-teal-600',
                bgColor: isDark ? 'bg-gradient-to-br from-emerald-500/5 to-teal-600/5' : 'bg-gradient-to-br from-emerald-500/10 to-teal-600/10'
              }
            ].map((vault, idx) => (
              <div 
                key={idx} 
                className={`group relative ${isDark ? 'bg-slate-800/40 border-gray-700/50 hover:bg-slate-800/70 hover:border-cyan-500/50' : 'bg-white/60 border-gray-200 hover:bg-white hover:border-cyan-500/50'} backdrop-blur-2xl border rounded-3xl p-8 transition-all duration-500 hover:shadow-2xl ${isDark ? 'hover:shadow-cyan-500/20' : 'hover:shadow-cyan-500/30'} hover:-translate-y-4 overflow-hidden cursor-pointer animate-slide-up`}
                style={{ animationDelay: `${idx * 0.15}s` }}
              >
                <div className={`absolute inset-0 ${vault.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className={`absolute inset-0 bg-gradient-to-br ${vault.color} opacity-5 animate-pulse-slow`}></div>
                </div>
                
                <div className="relative z-10">
                  <div className={`inline-flex bg-gradient-to-br ${vault.color} w-16 h-16 rounded-2xl items-center justify-center mb-6 shadow-2xl group-hover:scale-125 group-hover:rotate-12 transition-all duration-500`}>
                    <vault.icon className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className={`text-2xl font-bold mb-3 ${isDark ? 'text-white group-hover:text-cyan-400' : 'text-gray-900 group-hover:text-cyan-600'} transition-colors`}>{vault.title}</h3>
                  <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-6 leading-relaxed`}>{vault.desc}</p>
                  
                  <div className={`flex items-center justify-between pt-4 border-t ${isDark ? 'border-gray-700/50' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${vault.color} animate-pulse shadow-lg`}></div>
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{vault.files}</span>
                    </div>
                    <ArrowRight className={`w-5 h-5 ${isDark ? 'text-gray-500 group-hover:text-cyan-400' : 'text-gray-400 group-hover:text-cyan-600'} group-hover:translate-x-2 transition-all duration-300`} />
                  </div>
                </div>

                <div className={`absolute -bottom-12 -right-12 w-32 h-32 bg-gradient-to-br ${vault.color} opacity-10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700`}></div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <button 
              onClick={navigateToAuth}
              className={`group ${isDark ? 'bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border-cyan-400/30 hover:border-cyan-400/60' : 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border-cyan-500/50 hover:border-cyan-600/70'} border px-8 py-4 rounded-xl font-semibold text-lg flex items-center gap-3 mx-auto transition-all duration-500 hover:shadow-2xl ${isDark ? 'hover:shadow-cyan-500/30' : 'hover:shadow-cyan-500/40'} hover:scale-110`}
            >
              <Database className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
              Create New Vault
              <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`py-20 px-6 ${isDark ? 'bg-gradient-to-br from-cyan-900/10 via-blue-900/10 to-slate-900/30' : 'bg-gradient-to-br from-cyan-50/50 via-blue-50/50 to-gray-100/50'} relative overflow-hidden transition-colors duration-500`}>
        <div className="absolute inset-0">
          <div className={`absolute top-0 left-0 w-96 h-96 bg-cyan-500 rounded-full blur-3xl ${isDark ? 'opacity-10' : 'opacity-5'} animate-pulse`}></div>
          <div className={`absolute bottom-0 right-0 w-96 h-96 bg-blue-600 rounded-full blur-3xl ${isDark ? 'opacity-10' : 'opacity-5'} animate-pulse`} style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 bg-clip-text text-transparent">Ready to Secure Your Files?</h2>
          <p className={`text-xl ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-10`}>
            Join thousands of users protecting their sensitive documents with AirVault
          </p>
          <button 
            onClick={navigateToAuth}
            className="group relative bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 px-12 py-5 rounded-xl font-semibold text-lg flex items-center gap-3 mx-auto transition-all duration-500 shadow-2xl shadow-cyan-500/40 hover:shadow-cyan-500/60 hover:scale-110 overflow-hidden text-white"
          >
            <span className="relative z-10">Start Securing Your Files</span>
            <ArrowRight className="w-6 h-6 relative z-10 group-hover:translate-x-2 transition-transform duration-300" />
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-gradient-x bg-300%"></div>
          </button>
        </div>
      </section>

      {/* Footer */}
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

      <style jsx>{`

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        @keyframes gridMove {
          0% { transform: translateY(0); }
          100% { transform: translateY(50px); }
        }

        @keyframes particleFloat {
          0%, 100% { 
            transform: translate(0, 0) scale(1);
            opacity: 0.2;
          }
          25% { 
            transform: translate(100px, -100px) scale(1.2);
            opacity: 0.4;
          }
          50% { 
            transform: translate(200px, 0) scale(0.8);
            opacity: 0.3;
          }
          75% { 
            transform: translate(100px, 100px) scale(1.1);
            opacity: 0.35;
          }
        }

        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        @keyframes shimmer-slow {
          0% { transform: translateY(100%); }
          100% { transform: translateY(-100%); }
        }

        @keyframes sparkle {
          0%, 100% { 
            opacity: 0;
            transform: scale(0);
          }
          50% { 
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-right {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        @keyframes ping-slow {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          75%, 100% {
            transform: translate(-50%, -50%) scale(2);
            opacity: 0;
          }
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-gradient-x {
          animation: gradient-x 3s ease infinite;
        }

        .bg-300\\% {
          background-size: 300% 300%;
        }

        .animate-shimmer {
          animation: shimmer 2s infinite;
        }

        .animate-shimmer-slow {
          animation: shimmer-slow 3s infinite;
        }

        .animate-slide-up {
          animation: slide-up 0.8s ease-out forwards;
        }

        .animate-fade-in {
          animation: fade-in 1s ease-out forwards;
        }

        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }

        .animate-spin-reverse {
          animation: spin-reverse 15s linear infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }

        .animate-ping-slow {
          animation: ping-slow 3s cubic-bezier(0, 0, 0.2, 1) infinite;
        }

        .animate-slide-right {
          animation: slide-right 3s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default AirVaultHomepage;