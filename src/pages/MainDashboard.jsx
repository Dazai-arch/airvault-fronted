import { useState, useEffect } from "react";
import {
  Shield, FolderOpen, BarChart3, Plus, Search, CheckCircle,
  FileText, TrendingUp, Database, Moon, Sun, Activity, Zap,
  PieChart, Clock, RefreshCw, AlertCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from '../context/ThemeContext';
import { vaultApi } from '../services/vaultApi';

const MAX_STORAGE = 500;           // per-vault cap (MB)
const TOTAL_STORAGE_LIMIT = 5000;  // account-level cap (MB)

const MainDashboard = () => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const [vaults, setVaults]           = useState([]);
  const [selectedVault, setSelectedVault] = useState(null);
  const [search, setSearch]           = useState("");
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [refreshing, setRefreshing]   = useState(false);

  useEffect(() => { fetchVaults(); }, []);

  useEffect(() => {
    const validateAuth = async () => {
      const result = await vaultApi.validateToken();
      if (!result || !result.valid) navigate('/login');
    };
    validateAuth();
  }, [navigate]);

  const fetchVaults = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await vaultApi.getAllVaults();
      if (!response) return;
      const transformedVaults = response.vaults.map(vault => ({
        id: vault.id,
        name: vault.name,
        description: vault.description,
        hasPassword: vault.hasPassword,
        passwordHint: vault.passwordHint,
        createdAt: vault.createdAt,
        lastAccessed: vault.lastAccessed,
        fileCount: vault.fileCount,
        files: [],
        storageUsed: Math.round(vault.totalSize / (1024 * 1024)),
      }));
      setVaults(transformedVaults);
    } catch (err) {
      if (!err.message.includes('Session expired') && !err.message.includes('Authentication'))
        setError(err.message || 'Failed to load vaults');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchVaults();
    setRefreshing(false);
  };

  const totalVaults  = vaults.length;
  const totalFiles   = vaults.reduce((s, v) => s + (v.fileCount   || 0), 0);
  const totalStorage = vaults.reduce((s, v) => s + (v.storageUsed || 0), 0);

  const fileTypeCounts = { documents: 0, images: 0, others: 0 };
  const filteredVaults = vaults.filter(v =>
    v.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalFileTypes = fileTypeCounts.documents + fileTypeCounts.images + fileTypeCounts.others;
  const docsPercent    = totalFileTypes > 0 ? (fileTypeCounts.documents / totalFileTypes) * 100 : 0;
  const imagesPercent  = totalFileTypes > 0 ? (fileTypeCounts.images    / totalFileTypes) * 100 : 0;
  const othersPercent  = totalFileTypes > 0 ? (fileTypeCounts.others    / totalFileTypes) * 100 : 0;

  // Storage calculations — vault capped at MAX_STORAGE (500 MB)
  const storagePercent      = Math.min((totalStorage / TOTAL_STORAGE_LIMIT) * 100, 100);
  const vaultStoragePercent = selectedVault
    ? Math.min((selectedVault.storageUsed / MAX_STORAGE) * 100, 100)
    : 0;

  const formatDate = (ds) => {
    const d = new Date(ds), now = new Date();
    const h = Math.floor((now - d) / 3_600_000);
    if (h < 1)  return 'Just now';
    if (h < 24) return `${h}h ago`;
    if (h < 48) return 'Yesterday';
    return d.toLocaleDateString();
  };

  /* ── Speedometer (SVG, fully responsive via viewBox) ── */
  const Speedometer = ({ percentage, isDark }) => {
    const size = 280, r = size / 2 - 20;
    const circ = Math.PI * r;
    const offset = circ - (percentage / 100) * circ;
    const color = percentage > 75 ? '#ef4444' : percentage > 50 ? '#f59e0b' : '#10b981';
    return (
      <div className="w-full flex flex-col items-center">
        <svg viewBox={`0 0 ${size} ${size / 2 + 50}`} className="w-full max-w-xs" style={{height:'auto'}}>
          {/* track */}
          <path d={`M 20 ${size/2+20} A ${r} ${r} 0 0 1 ${size-20} ${size/2+20}`}
            fill="none" stroke={isDark ? '#1e293b' : '#e5e7eb'} strokeWidth="20" strokeLinecap="round"/>
          {/* progress */}
          <path d={`M 20 ${size/2+20} A ${r} ${r} 0 0 1 ${size-20} ${size/2+20}`}
            fill="none" stroke={color} strokeWidth="20" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset}
            style={{transition:'stroke-dashoffset 1s ease', filter:`drop-shadow(0 0 8px ${color})`}}/>
          {/* centre label */}
          <text x={size/2} y={size/2 - 10} textAnchor="middle"
            fontSize="42" fontWeight="bold" fill={isDark ? '#f8fafc' : '#111827'}>
            {Math.round(percentage)}%
          </text>
          <text x={size/2} y={size/2 + 16} textAnchor="middle"
            fontSize="16" fill={isDark ? '#94a3b8' : '#6b7280'}>
            Storage Used
          </text>
          {/* tick labels */}
          <text x={14}        y={size/2+44} fontSize="13" fill={isDark ? '#475569' : '#9ca3af'}>0%</text>
          <text x={size/2-14} y={size/2+44} fontSize="13" fill={isDark ? '#475569' : '#9ca3af'}>50%</text>
          <text x={size-42}   y={size/2+44} fontSize="13" fill={isDark ? '#475569' : '#9ca3af'}>100%</text>
        </svg>
      </div>
    );
  };

  /* ── Pie Chart ── */
  const PieChartVisual = ({ documents, images, others }) => {
    const total = documents + images + others;
    if (total === 0) return (
      <div className={`w-36 h-36 sm:w-44 sm:h-44 rounded-full ${isDark ? 'bg-slate-800' : 'bg-gray-200'} flex items-center justify-center`}>
        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No data</span>
      </div>
    );
    return (
      <div className="relative w-36 h-36 sm:w-44 sm:h-44">
        <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#3b82f6" strokeWidth="80"
            strokeDasharray={`${(documents/total)*251.2} 251.2`}/>
          <circle cx="50" cy="50" r="40" fill="none" stroke="#a855f7" strokeWidth="80"
            strokeDasharray={`${(images/total)*251.2} 251.2`}
            strokeDashoffset={`-${(documents/total)*251.2}`}/>
          <circle cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="80"
            strokeDasharray={`${(others/total)*251.2} 251.2`}
            strokeDashoffset={`-${((documents+images)/total)*251.2}`}/>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <div className="text-xl sm:text-2xl font-bold">{total}</div>
            <div className={`text-[10px] sm:text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Files</div>
          </div>
        </div>
      </div>
    );
  };

  /* ── Loading ── */
  if (loading) return (
    <div className={`h-screen flex items-center justify-center ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
      <div className="text-center">
        <RefreshCw className={`w-12 h-12 ${isDark ? 'text-cyan-400' : 'text-cyan-600'} animate-spin mx-auto mb-4`}/>
        <p className={`text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>Loading your vaults…</p>
      </div>
    </div>
  );

  /* ── Error ── */
  if (error) return (
    <div className={`h-screen flex items-center justify-center ${isDark ? 'bg-slate-900' : 'bg-gray-50'}`}>
      <div className="text-center">
        <AlertCircle className={`w-12 h-12 ${isDark ? 'text-red-400' : 'text-red-600'} mx-auto mb-4`}/>
        <p className={`text-lg ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>Failed to load vaults</p>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-4`}>{error}</p>
        <button onClick={fetchVaults}
          className={`px-4 py-2 rounded-lg ${isDark ? 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30' : 'bg-cyan-500/10 text-cyan-600 hover:bg-cyan-500/20'} transition-colors`}>
          Try Again
        </button>
      </div>
    </div>
  );

  /* ══════════════════════════════════════
     MAIN RENDER
  ══════════════════════════════════════ */
  return (
    <div className={`h-screen overflow-hidden ${isDark ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'} transition-colors duration-500`}>

      {/* ambient blobs (fixed, behind everything) */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className={`absolute top-1/4 -left-1/4 w-96 h-96 ${isDark ? 'bg-cyan-500/5' : 'bg-cyan-500/3'} rounded-full blur-3xl animate-pulse`}/>
        <div className={`absolute bottom-1/4 -right-1/4 w-96 h-96 ${isDark ? 'bg-blue-600/5' : 'bg-blue-600/3'} rounded-full blur-3xl animate-pulse`} style={{animationDelay:'1s'}}/>
        <div className={`absolute top-1/2 left-1/2 w-96 h-96 ${isDark ? 'bg-indigo-500/3' : 'bg-indigo-500/2'} rounded-full blur-3xl animate-pulse`} style={{animationDelay:'0.5s'}}/>
      </div>

      {/* theme toggle */}
      <button onClick={toggleTheme} aria-label="Toggle theme"
        className={`fixed top-4 right-4 sm:top-6 sm:right-6 z-50 p-2.5 sm:p-3 rounded-xl border shadow-lg transition-all duration-300 group
          ${isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700' : 'bg-white hover:bg-gray-100 border-gray-200'}`}>
        {isDark
          ? <Sun  className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 group-hover:rotate-90 transition-transform duration-500"/>
          : <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 group-hover:-rotate-12 transition-transform duration-500"/>}
      </button>

      {/* ════════════════════════════════
          SINGLE SCROLL CONTAINER
          (the ONLY element that scrolls)
      ════════════════════════════════ */}
      <div className="h-full overflow-y-auto overflow-x-hidden dash-scrollbar relative z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8">

          {/* ── Page header ── */}
          <div className="mb-6 sm:mb-8 flex items-start sm:items-center justify-between gap-3 pr-12 sm:pr-16">
            <div>
              <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-1 flex items-center gap-2 sm:gap-3 flex-wrap`}>
                <div className={`p-2 sm:p-3 rounded-xl border flex-shrink-0
                  ${isDark ? 'bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border-cyan-500/30' : 'bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border-cyan-500/40'}`}>
                  <Activity className={`w-5 h-5 sm:w-7 sm:h-7 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}/>
                </div>
                Main Dashboard
              </h1>
              <p className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Comprehensive insights and real-time monitoring of your vault ecosystem
              </p>
            </div>
            <button onClick={handleRefresh} disabled={refreshing} aria-label="Refresh"
              className={`flex-shrink-0 p-2.5 sm:p-3 rounded-xl border shadow-lg transition-all duration-300 group
                ${isDark ? 'bg-slate-800 hover:bg-slate-700 border-slate-700' : 'bg-white hover:bg-gray-100 border-gray-200'}`}>
              <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}
                ${refreshing ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-500`}/>
            </button>
          </div>

          {/* ════════════════════════
              VAULT LIST + ANALYTICS
          ════════════════════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 mb-8 sm:mb-12">

            {/* LEFT — Vault list */}
            <div className="lg:col-span-4">
              <div className={`flex flex-col rounded-2xl border shadow-xl transition-colors duration-300
                ${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/80 border-gray-200'}`}
                style={{height:'clamp(320px,60vh,540px)'}}>

                {/* search header — never scrolls */}
                <div className={`flex-shrink-0 px-3 sm:px-4 pt-3 sm:pt-4 pb-3 border-b
                  ${isDark ? 'border-slate-700/50' : 'border-gray-200'}`}>
                  <p className={`font-semibold mb-3 flex items-center justify-between
                    ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    <span className="flex items-center gap-2">
                      <Shield className={`w-4 h-4 sm:w-5 sm:h-5 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}/>
                      Your Vaults
                    </span>
                    <span className={`text-xs sm:text-sm px-2.5 py-0.5 rounded-full bg-cyan-500/10
                      ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>{filteredVaults.length}</span>
                  </p>
                  <div className="relative">
                    <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2
                      ${isDark ? 'text-gray-400' : 'text-gray-500'}`}/>
                    <input type="text" placeholder="Search vaults…" value={search}
                      onChange={e => setSearch(e.target.value)}
                      className={`w-full pl-9 pr-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors
                        ${isDark ? 'bg-slate-700/50 border-slate-600/50 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'}`}/>
                  </div>
                </div>

                {/* vault list — scrolls independently */}
                <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden dash-scrollbar px-2 sm:px-3 py-2 sm:py-3">
                  {filteredVaults.length === 0 ? (
                    <div className="text-center mt-8 px-4">
                      <FolderOpen className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 ${isDark ? 'text-gray-400' : 'text-gray-300'}`}/>
                      <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {search ? 'No matching vaults found' : 'No vaults created yet'}
                      </p>
                      {!search && (
                        <button onClick={() => navigate("/vaults")}
                          className={`mt-4 px-4 py-2 rounded-lg text-sm transition-colors
                            ${isDark ? 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30' : 'bg-cyan-500/10 text-cyan-600 hover:bg-cyan-500/20'}`}>
                          Create Your First Vault
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1.5 sm:space-y-2">
                      {filteredVaults.map(vault => (
                        <div key={vault.id} onClick={() => setSelectedVault(vault)}
                          className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl cursor-pointer border transition-all duration-300 group
                            ${selectedVault?.id === vault.id
                              ? isDark
                                ? 'bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border-cyan-500/50 shadow-lg shadow-cyan-500/20'
                                : 'bg-gradient-to-r from-cyan-500/5 to-blue-600/5 border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                              : isDark ? 'border-transparent hover:bg-slate-700/50' : 'border-transparent hover:bg-gray-50'}`}>
                          <div className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 transition-colors duration-300
                            ${selectedVault?.id === vault.id ? 'bg-cyan-500/20' : isDark ? 'bg-slate-700' : 'bg-gray-100'}`}>
                            <Shield className={`w-4 h-4 sm:w-5 sm:h-5
                              ${selectedVault?.id === vault.id ? 'text-cyan-400' : isDark ? 'text-cyan-400' : 'text-cyan-600'}`}/>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{vault.name}</p>
                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {vault.fileCount || 0} files · {vault.storageUsed || 0} / {MAX_STORAGE} MB
                            </p>
                          </div>
                          {selectedVault?.id === vault.id && (
                            <CheckCircle className="w-4 h-4 text-emerald-400 animate-pulse flex-shrink-0"/>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* footer CTA — never scrolls */}
                <div className={`flex-shrink-0 p-3 sm:p-4 border-t
                  ${isDark ? 'border-slate-700/50' : 'border-gray-200'}`}>
                  <button onClick={() => navigate("/vaults")}
                    className={`w-full flex items-center justify-center gap-2 py-2 sm:py-2.5 rounded-xl border font-semibold text-sm text-cyan-400 transition-all duration-300 hover:scale-105
                      ${isDark ? 'bg-gradient-to-r from-cyan-500/10 to-blue-600/10 hover:from-cyan-500/20 hover:to-blue-600/20 border-cyan-500/30'
                               : 'bg-gradient-to-r from-cyan-500/10 to-blue-600/10 hover:from-cyan-500/20 hover:to-blue-600/20 border-cyan-500/40'}`}>
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5"/> Open Vault Selector
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT — Vault analytics */}
            <div className="lg:col-span-8">
              <div className={`flex flex-col rounded-2xl border shadow-xl transition-colors duration-300
                ${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/80 border-gray-200'}`}
                style={{height:'clamp(320px,60vh,540px)'}}>

                {/* ── Sticky heading — separated from scroll container ── */}
                <div className={`flex-shrink-0 px-4 sm:px-6 pt-4 sm:pt-5 pb-3 border-b rounded-t-2xl backdrop-blur-sm
                  ${isDark ? 'bg-slate-800/95 border-slate-700/50' : 'bg-white/95 border-gray-100'}`}>
                  <h2 className={`text-lg sm:text-xl font-bold flex items-center gap-2
                    ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    <div className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0
                      ${isDark ? 'bg-cyan-500/20' : 'bg-cyan-500/10'}`}>
                      <BarChart3 className={`w-5 h-5 sm:w-6 sm:h-6 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}/>
                    </div>
                    Vault Analytics
                    {selectedVault && (
                      <span className={`ml-1 text-xs sm:text-sm font-normal truncate max-w-[110px] sm:max-w-none
                        ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                        — {selectedVault.name}
                      </span>
                    )}
                  </h2>
                </div>

                {/* scrollable analytics body */}
                <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden dash-scrollbar px-4 sm:px-6 py-4 sm:py-5">
                  {!selectedVault ? (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                      <Database className={`w-12 h-12 sm:w-16 sm:h-16 mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`}/>
                      <p className={`text-base sm:text-lg font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No vault selected</p>
                      <p className={`text-xs sm:text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Select a vault from the left panel to view analytics</p>
                    </div>
                  ) : (
                    <div className="space-y-4 sm:space-y-6">
                      {/* Speedometer */}
                      <div className={`rounded-xl p-4 sm:p-6 ${isDark ? 'bg-slate-900/50' : 'bg-gray-50'}`}>
                        <p className={`text-base sm:text-lg font-semibold text-center mb-3
                          ${isDark ? 'text-white' : 'text-gray-900'}`}>Storage Utilization</p>
                        <Speedometer percentage={vaultStoragePercent} isDark={isDark}/>
                        <p className={`text-center text-xs sm:text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {selectedVault.storageUsed || 0} MB of {MAX_STORAGE} MB used
                        </p>
                      </div>

                      {/* Stat cards */}
                      <div className="grid grid-cols-3 gap-2 sm:gap-4">
                        {[
                          { label:'Files',    value: selectedVault.fileCount || 0,        Icon: FileText,  border:'border-cyan-500/20',    text: isDark ? 'text-cyan-400'    : 'text-cyan-600'    },
                          { label:'Protected',value: selectedVault.hasPassword?'Yes':'No', Icon: Zap,       border:'border-yellow-500/20',  text: isDark ? 'text-yellow-400'  : 'text-yellow-600'  },
                          { label:'Status',   value:'Active',                              Icon: Activity,  border:'border-emerald-500/20', text: isDark ? 'text-emerald-400' : 'text-emerald-600' },
                        ].map(({ label, value, Icon, border, text }) => (
                          <div key={label}
                            className={`${isDark ? 'bg-slate-900/50' : 'bg-gray-50'} border ${border} rounded-xl p-3 sm:p-5 hover:scale-105 transition-transform duration-300`}>
                            <div className="flex items-center justify-between mb-1 sm:mb-2">
                              <p className={`text-[10px] sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{label}</p>
                              <Icon className={`w-3.5 h-3.5 sm:w-5 sm:h-5 ${text}`}/>
                            </div>
                            <p className={`text-base sm:text-2xl font-bold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</p>
                          </div>
                        ))}
                      </div>

                      {/* Vault details */}
                      <div className={`rounded-xl p-4 sm:p-6 ${isDark ? 'bg-slate-900/50' : 'bg-gray-50'}`}>
                        <p className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Vault Details</p>
                        <div className="space-y-2 sm:space-y-3">
                          <div className="flex justify-between gap-4">
                            <span className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Created</span>
                            <span className={`text-xs sm:text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {new Date(selectedVault.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Last Accessed</span>
                            <span className={`text-xs sm:text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {formatDate(selectedVault.lastAccessed)}
                            </span>
                          </div>
                          {selectedVault.description && (
                            <div>
                              <span className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Description</span>
                              <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedVault.description}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ══════════════════════
              ACCOUNT ANALYTICS
          ══════════════════════ */}
          <div className="mb-5 sm:mb-8">
            <h2 className={`text-xl sm:text-2xl lg:text-3xl font-bold mb-1 flex items-center gap-2 sm:gap-3
              ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <div className={`p-2 rounded-xl flex-shrink-0
                ${isDark ? 'bg-gradient-to-br from-indigo-500/20 to-purple-600/20' : 'bg-gradient-to-br from-indigo-500/10 to-purple-600/10'}`}>
                <TrendingUp className={`w-5 h-5 sm:w-6 sm:h-6 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}/>
              </div>
              Account Overview
            </h2>
            <p className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Cumulative analytics across your entire vault ecosystem
            </p>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {[
              { label:'Total Vaults',  value: totalVaults,            sub:'Across all categories', Icon: Shield,   border:'border-cyan-500/20',    iconC: isDark?'text-cyan-400'   :'text-cyan-600',    valC: isDark?'text-white':'text-gray-900', subC: isDark?'text-cyan-400/60'   :'text-cyan-600/60'    },
              { label:'Total Files',   value: totalFiles,             sub:'Securely stored',       Icon: FileText, border:'border-indigo-500/20',  iconC: isDark?'text-indigo-400' :'text-indigo-600',  valC: isDark?'text-white':'text-gray-900', subC: isDark?'text-indigo-400/60' :'text-indigo-600/60'  },
              { label:'Storage Used',  value:`${totalStorage} MB`,    sub:`of ${TOTAL_STORAGE_LIMIT} MB`, Icon: Database, border:'border-emerald-500/20', iconC: isDark?'text-emerald-400':'text-emerald-600', valC: isDark?'text-white':'text-gray-900', subC: isDark?'text-emerald-400/60':'text-emerald-600/60' },
            ].map(({ label, value, sub, Icon, border, iconC, valC, subC }) => (
              <div key={label}
                className={`${isDark ? 'bg-slate-800/50' : 'bg-white/80'} backdrop-blur-xl border ${border} rounded-2xl p-4 sm:p-6 hover:scale-105 transition-all duration-300 shadow-lg`}>
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className={`p-2 sm:p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                    <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${iconC}`}/>
                  </div>
                  <TrendingUp className={`w-4 h-4 sm:w-5 sm:h-5 ${iconC}`}/>
                </div>
                <p className={`text-xs sm:text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{label}</p>
                <p className={`text-2xl sm:text-4xl font-bold ${valC}`}>{value}</p>
                <p className={`text-[10px] sm:text-xs mt-2 ${subC}`}>{sub}</p>
              </div>
            ))}
          </div>

          {/* Speedometer + Pie */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">

            {/* Account storage speedometer */}
            <div className={`rounded-2xl border p-4 sm:p-8 shadow-xl transition-colors duration-300
              ${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/80 border-gray-200'}`}>
              <div className="flex items-center gap-2 mb-4 sm:mb-6">
                <Database className={`w-5 h-5 sm:w-6 sm:h-6 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}/>
                <p className={`text-base sm:text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Total Storage Capacity</p>
              </div>
              <div className="py-2 sm:py-4">
                <Speedometer percentage={storagePercent} isDark={isDark}/>
              </div>
              <div className="mt-4 sm:mt-6 grid grid-cols-2 gap-3 sm:gap-4">
                <div className={`rounded-lg p-3 sm:p-4 text-center ${isDark ? 'bg-slate-900/50' : 'bg-gray-50'}`}>
                  <p className={`text-xs sm:text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Used</p>
                  <p className={`text-lg sm:text-2xl font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>{totalStorage} MB</p>
                </div>
                <div className={`rounded-lg p-3 sm:p-4 text-center ${isDark ? 'bg-slate-900/50' : 'bg-gray-50'}`}>
                  <p className={`text-xs sm:text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Available</p>
                  <p className={`text-lg sm:text-2xl font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{TOTAL_STORAGE_LIMIT - totalStorage} MB</p>
                </div>
              </div>
            </div>

            {/* Pie chart */}
            <div className={`rounded-2xl border p-4 sm:p-8 shadow-xl transition-colors duration-300
              ${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/80 border-gray-200'}`}>
              <div className="flex items-center gap-2 mb-4 sm:mb-6">
                <PieChart className={`w-5 h-5 sm:w-6 sm:h-6 ${isDark ? 'text-purple-400' : 'text-purple-600'}`}/>
                <p className={`text-base sm:text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>File Type Distribution</p>
              </div>
              <div className="flex flex-col items-center">
                <PieChartVisual documents={fileTypeCounts.documents} images={fileTypeCounts.images} others={fileTypeCounts.others}/>
                <div className="mt-5 sm:mt-8 w-full space-y-2 sm:space-y-3">
                  {[
                    { label:'Documents', count: fileTypeCounts.documents, pct: docsPercent,   color:'bg-blue-500'    },
                    { label:'Images',    count: fileTypeCounts.images,    pct: imagesPercent, color:'bg-purple-500'  },
                    { label:'Others',    count: fileTypeCounts.others,    pct: othersPercent, color:'bg-emerald-500' },
                  ].map(({ label, count, pct, color }) => (
                    <div key={label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${color}`}/>
                        <span className={`text-xs sm:text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{label}</span>
                      </div>
                      <span className={`text-xs sm:text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {count} ({Math.round(pct)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Activity timeline */}
          <div className={`rounded-2xl border p-4 sm:p-8 shadow-xl transition-colors duration-300 mb-6
            ${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/80 border-gray-200'}`}>
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <Clock className={`w-5 h-5 sm:w-6 sm:h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}/>
              <p className={`text-base sm:text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Recent Activity</p>
            </div>
            {vaults.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>No activity yet. Create your first vault to get started!</p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-4">
                {vaults.slice(0, 5).map((vault, i) => (
                  <div key={vault.id} onClick={() => setSelectedVault(vault)}
                    className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl cursor-pointer transition-colors duration-300
                      ${isDark ? 'bg-slate-900/50 hover:bg-slate-900/70' : 'bg-gray-50 hover:bg-gray-100'}`}>
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${i===0 ? 'bg-emerald-400' : isDark ? 'bg-gray-600' : 'bg-gray-400'}`}/>
                    <Shield className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}/>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{vault.name}</p>
                      <p className={`text-[10px] sm:text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {vault.fileCount || 0} files · {vault.storageUsed || 0} / {MAX_STORAGE} MB
                      </p>
                    </div>
                    <span className={`text-[10px] sm:text-xs flex-shrink-0 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      {formatDate(vault.lastAccessed)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      <style>{`
        @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
        .animate-shimmer { animation: shimmer 2s infinite; }

        /* 4-px cyan scrollbar — no arrows, no width shift */
        .dash-scrollbar::-webkit-scrollbar       { width: 4px; }
        .dash-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .dash-scrollbar::-webkit-scrollbar-thumb { background: rgba(6,182,212,0.4); border-radius: 2px; }
        .dash-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(6,182,212,0.65); }
      `}</style>
    </div>
  );
};

export default MainDashboard;