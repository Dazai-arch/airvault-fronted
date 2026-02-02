import { useState, useEffect } from "react";
import {
  Shield,
  FolderOpen,
  BarChart3,
  Plus,
  Search,
  CheckCircle,
  FileText,
  Image,
  File,
  TrendingUp,
  Database,
  Moon,
  Sun,
  Activity,
  Zap,
  PieChart,
  Clock,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from '../context/ThemeContext';
import { vaultApi } from '../services/vaultApi';

const MAX_STORAGE = 1000;           // per-vault (in MB)
const TOTAL_STORAGE_LIMIT = 5000;   // account-level (in MB)

const MainDashboard = () => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const [vaults, setVaults] = useState([]);
  const [selectedVault, setSelectedVault] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch vaults on component mount
  useEffect(() => {
    fetchVaults();
  }, []);

  const fetchVaults = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await vaultApi.getAllVaults();
      
      // Transform backend data to match frontend format
      const transformedVaults = response.vaults.map(vault => ({
        id: vault.id,
        name: vault.name,
        description: vault.description,
        hasPassword: vault.hasPassword,
        passwordHint: vault.passwordHint,
        createdAt: vault.createdAt,
        lastAccessed: vault.lastAccessed,
        fileCount: vault.fileCount,
        files: [], // Files will be populated separately if needed
        storageUsed: Math.round(vault.totalSize / (1024 * 1024)), // Convert bytes to MB
      }));
      
      setVaults(transformedVaults);
    } catch (err) {
      console.error('Error fetching vaults:', err);
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

  /* ===============================
     CUMULATIVE ACCOUNT ANALYTICS
  =============================== */
  const totalVaults = vaults.length;

  const totalFiles = vaults.reduce(
    (sum, vault) => sum + (vault.fileCount || 0),
    0
  );

  const totalStorage = vaults.reduce(
    (sum, vault) => sum + (vault.storageUsed || 0),
    0
  );

  // Calculate file type counts (placeholder until files are loaded)
  const fileTypeCounts = {
    documents: 0,
    images: 0,
    others: 0
  };

  const filteredVaults = vaults.filter((vault) =>
    vault.name.toLowerCase().includes(search.toLowerCase())
  );

  // Calculate percentages for pie chart
  const totalFileTypes = fileTypeCounts.documents + fileTypeCounts.images + fileTypeCounts.others;
  const docsPercent = totalFileTypes > 0 ? (fileTypeCounts.documents / totalFileTypes) * 100 : 0;
  const imagesPercent = totalFileTypes > 0 ? (fileTypeCounts.images / totalFileTypes) * 100 : 0;
  const othersPercent = totalFileTypes > 0 ? (fileTypeCounts.others / totalFileTypes) * 100 : 0;

  // Speedometer calculation
  const storagePercent = Math.min((totalStorage / TOTAL_STORAGE_LIMIT) * 100, 100);
  const vaultStoragePercent = selectedVault ? Math.min((selectedVault.storageUsed / MAX_STORAGE) * 100, 100) : 0;

  // Format date helper
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  // Speedometer component
  const Speedometer = ({ percentage, size = 200, isDark }) => {
    const radius = size / 2 - 20;
    const circumference = Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;
    
    // Determine color based on percentage
    let color = '#10b981'; // green
    if (percentage > 75) color = '#ef4444'; // red
    else if (percentage > 50) color = '#f59e0b'; // yellow

    return (
      <div className="relative" style={{ width: size, height: size / 2 + 40 }}>
        <svg width={size} height={size / 2 + 40} className="transform -rotate-0">
          {/* Background arc */}
          <path
            d={`M 20 ${size / 2 + 20} A ${radius} ${radius} 0 0 1 ${size - 20} ${size / 2 + 20}`}
            fill="none"
            stroke={isDark ? '#1e293b' : '#e5e7eb'}
            strokeWidth="20"
            strokeLinecap="round"
          />
          {/* Progress arc */}
          <path
            d={`M 20 ${size / 2 + 20} A ${radius} ${radius} 0 0 1 ${size - 20} ${size / 2 + 20}`}
            fill="none"
            stroke={color}
            strokeWidth="20"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
            style={{
              filter: `drop-shadow(0 0 8px ${color})`
            }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ top: '20%' }}>
          <div className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {Math.round(percentage)}%
          </div>
          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
            Storage Used
          </div>
        </div>
        {/* Tick marks */}
        <div className="absolute bottom-2 left-0 right-0 flex justify-between px-4 text-xs" style={{ color: isDark ? '#64748b' : '#9ca3af' }}>
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>
    );
  };

  // Bar Chart Component
  const BarChart = ({ data, isDark }) => {
    const maxValue = Math.max(...data.map(d => d.value), 1);
    
    return (
      <div className="space-y-4">
        {data.map((item, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                {item.label}
              </span>
              <span className={`text-sm font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                {item.value}
              </span>
            </div>
            <div className={`w-full ${isDark ? 'bg-slate-800' : 'bg-gray-200'} rounded-full h-3 overflow-hidden`}>
              <div
                className="h-3 rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                style={{
                  width: `${(item.value / maxValue) * 100}%`,
                  backgroundColor: item.color
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Pie Chart Component (CSS-based)
  const PieChartVisual = ({ documents, images, others, isDark }) => {
    const total = documents + images + others;
    if (total === 0) return (
      <div className={`w-48 h-48 rounded-full ${isDark ? 'bg-slate-800' : 'bg-gray-200'} flex items-center justify-center`}>
        <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>No data</span>
      </div>
    );

    return (
      <div className="relative w-48 h-48">
        <svg viewBox="0 0 100 100" className="transform -rotate-90">
          {/* Documents slice */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="80"
            strokeDasharray={`${(documents / total) * 251.2} 251.2`}
            className="transition-all duration-1000"
          />
          {/* Images slice */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#a855f7"
            strokeWidth="80"
            strokeDasharray={`${(images / total) * 251.2} 251.2`}
            strokeDashoffset={`-${(documents / total) * 251.2}`}
            className="transition-all duration-1000"
          />
          {/* Others slice */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#10b981"
            strokeWidth="80"
            strokeDasharray={`${(others / total) * 251.2} 251.2`}
            strokeDashoffset={`-${((documents + images) / total) * 251.2}`}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <div className="text-2xl font-bold">{total}</div>
            <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Files</div>
          </div>
        </div>
      </div>
    );
  };

  // Loading State
  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'} flex items-center justify-center`}>
        <div className="text-center">
          <RefreshCw className={`w-12 h-12 ${isDark ? 'text-cyan-400' : 'text-cyan-600'} animate-spin mx-auto mb-4`} />
          <p className={`text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>Loading your vaults...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'} flex items-center justify-center`}>
        <div className="text-center">
          <AlertCircle className={`w-12 h-12 ${isDark ? 'text-red-400' : 'text-red-600'} mx-auto mb-4`} />
          <p className={`text-lg ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>Failed to load vaults</p>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-4`}>{error}</p>
          <button
            onClick={fetchVaults}
            className={`px-4 py-2 rounded-lg ${isDark ? 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30' : 'bg-cyan-500/10 text-cyan-600 hover:bg-cyan-500/20'} transition-colors`}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'} transition-colors duration-500 relative overflow-hidden`}>
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-1/4 -left-1/4 w-96 h-96 ${isDark ? 'bg-cyan-500/5' : 'bg-cyan-500/3'} rounded-full blur-3xl animate-pulse`}></div>
        <div className={`absolute bottom-1/4 -right-1/4 w-96 h-96 ${isDark ? 'bg-blue-600/5' : 'bg-blue-600/3'} rounded-full blur-3xl animate-pulse`} style={{animationDelay: '1s'}}></div>
        <div className={`absolute top-1/2 left-1/2 w-96 h-96 ${isDark ? 'bg-indigo-500/3' : 'bg-indigo-500/2'} rounded-full blur-3xl animate-pulse`} style={{animationDelay: '0.5s'}}></div>
      </div>

      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className={`fixed top-6 right-6 p-3 rounded-xl ${isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white hover:bg-gray-100'} ${isDark ? 'border-slate-700' : 'border-gray-200'} border transition-all duration-300 shadow-lg z-50 group`}
        aria-label="Toggle theme"
      >
        {isDark ? (
          <Sun className="w-5 h-5 text-yellow-400 group-hover:rotate-90 transition-transform duration-500" />
        ) : (
          <Moon className="w-5 h-5 text-indigo-600 group-hover:-rotate-12 transition-transform duration-500" />
        )}
      </button>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 relative z-10">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className={`text-3xl sm:text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2 flex items-center gap-3`}>
              <div className={`p-3 rounded-xl ${isDark ? 'bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border-cyan-500/30' : 'bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border-cyan-500/40'} border`}>
                <Activity className={`w-6 h-6 sm:w-8 sm:h-8 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
              </div>
              Analytics Dashboard
            </h1>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm sm:text-base`}>
              Comprehensive insights and real-time monitoring of your vault ecosystem
            </p>
          </div>
          
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`p-3 rounded-xl ${isDark ? 'bg-slate-800 hover:bg-slate-700' : 'bg-white hover:bg-gray-100'} ${isDark ? 'border-slate-700' : 'border-gray-200'} border transition-all duration-300 shadow-lg group`}
            aria-label="Refresh data"
          >
            <RefreshCw className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-cyan-600'} ${refreshing ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-500`} />
          </button>
        </div>

        {/* ================= MAIN DASHBOARD ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
          {/* LEFT: Vault List */}
          <div className="lg:col-span-4">
            <div className={`${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/80 border-gray-200'} backdrop-blur-xl border rounded-2xl h-[70vh] flex flex-col shadow-xl transition-colors duration-300`}>
              {/* Header + Search */}
              <div className={`p-4 ${isDark ? 'border-slate-700/50' : 'border-gray-200'} border-b space-y-3`}>
                <p className={`${isDark ? 'text-white' : 'text-gray-900'} font-semibold flex items-center justify-between`}>
                  <span className="flex items-center gap-2">
                    <Shield className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                    Your Vaults
                  </span>
                  <span className={`text-sm ${isDark ? 'text-cyan-400' : 'text-cyan-600'} bg-cyan-500/10 px-2.5 py-0.5 rounded-full`}>
                    {filteredVaults.length}
                  </span>
                </p>

                <div className="relative">
                  <Search className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'} absolute left-3 top-1/2 -translate-y-1/2`} />
                  <input
                    type="text"
                    placeholder="Search vaults..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={`w-full pl-9 pr-3 py-2 rounded-lg ${isDark ? 'bg-slate-700/50 border-slate-600/50 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'} border text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors duration-300`}
                  />
                </div>
              </div>

              {/* Vault List */}
              <div className="flex-1 overflow-y-auto px-3 py-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-cyan-500/40">
                {filteredVaults.length === 0 ? (
                  <div className="text-center mt-10">
                    <FolderOpen className={`w-12 h-12 ${isDark ? 'text-gray-400' : 'text-gray-300'} mx-auto mb-3`} />
                    <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} text-sm`}>
                      {search ? 'No matching vaults found' : 'No vaults created yet'}
                    </p>
                    {!search && (
                      <button
                        onClick={() => navigate("/vaults")}
                        className={`mt-4 px-4 py-2 rounded-lg ${isDark ? 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30' : 'bg-cyan-500/10 text-cyan-600 hover:bg-cyan-500/20'} transition-colors`}
                      >
                        Create Your First Vault
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredVaults.map((vault) => (
                      <div
                        key={vault.id}
                        onClick={() => setSelectedVault(vault)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-300 group ${
                          selectedVault?.id === vault.id
                            ? isDark
                              ? "bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/50 shadow-lg shadow-cyan-500/20"
                              : "bg-gradient-to-r from-cyan-500/5 to-blue-600/5 border border-cyan-500/50 shadow-lg shadow-cyan-500/10"
                            : isDark
                              ? "hover:bg-slate-700/50 border border-transparent"
                              : "hover:bg-gray-50 border border-transparent"
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${selectedVault?.id === vault.id ? 'bg-cyan-500/20' : isDark ? 'bg-slate-700' : 'bg-gray-100'} transition-colors duration-300`}>
                          <Shield className={`w-5 h-5 ${selectedVault?.id === vault.id ? 'text-cyan-400' : isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`${isDark ? 'text-white' : 'text-gray-900'} font-medium truncate`}>
                            {vault.name}
                          </p>
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {vault.fileCount || 0} files • {vault.storageUsed || 0} MB
                          </p>
                        </div>

                        {selectedVault?.id === vault.id && (
                          <CheckCircle className="w-4 h-4 text-emerald-400 animate-pulse" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Open Vault Selector */}
              <div className={`p-4 ${isDark ? 'border-slate-700/50' : 'border-gray-200'} border-t`}>
                <button
                  onClick={() => navigate("/vaults")}
                  className={`w-full flex items-center justify-center gap-2 ${isDark ? 'bg-gradient-to-r from-cyan-500/10 to-blue-600/10 hover:from-cyan-500/20 hover:to-blue-600/20 border-cyan-500/30' : 'bg-gradient-to-r from-cyan-500/10 to-blue-600/10 hover:from-cyan-500/20 hover:to-blue-600/20 border-cyan-500/40'} border text-cyan-400 py-2.5 rounded-xl font-semibold transition-all duration-300 hover:scale-105`}
                >
                  <Plus className="w-5 h-5" />
                  Open Vault Selector
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: Selected Vault Analytics */}
          <div className="lg:col-span-8">
            <div className={`${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/80 border-gray-200'} backdrop-blur-xl border rounded-2xl h-[70vh] p-6 shadow-xl transition-colors duration-300 ${selectedVault ? 'overflow-y-auto' : 'overflow-hidden'}`}>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-6 flex items-center gap-2 ${selectedVault ? 'sticky top-0' : ''} ${isDark ? 'bg-slate-800/90' : 'bg-white/90'} backdrop-blur-sm pb-2 z-10`}>
                <div className={`p-2 rounded-lg ${isDark ? 'bg-cyan-500/20' : 'bg-cyan-500/10'}`}>
                  <BarChart3 className={`w-6 h-6 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                </div>
                Vault Analytics
              </h2>

              {!selectedVault ? (
                <div className={`h-full flex flex-col items-center justify-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <Database className={`w-16 h-16 mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                  <p className="text-lg font-medium">No vault selected</p>
                  <p className="text-sm">Select a vault from the left panel to view analytics</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Speedometer for Vault Storage */}
                  <div className={`${isDark ? 'bg-slate-900/50' : 'bg-gray-50'} rounded-xl p-6 transition-colors duration-300`}>
                    <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-6 text-center`}>
                      Storage Utilization
                    </p>
                    <div className="flex justify-center">
                      <Speedometer percentage={vaultStoragePercent} size={280} isDark={isDark} />
                    </div>
                    <div className="mt-4 text-center">
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {selectedVault.storageUsed || 0} MB of {MAX_STORAGE} MB used
                      </p>
                    </div>
                  </div>

                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className={`${isDark ? 'bg-gradient-to-br from-cyan-500/5 to-blue-600/5 border-cyan-500/20' : 'bg-gradient-to-br from-cyan-500/5 to-blue-600/5 border-cyan-500/30'} border rounded-xl p-6 group hover:scale-105 transition-transform duration-300`}>
                      <div className="flex items-center justify-between mb-2">
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Files</p>
                        <FileText className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                      </div>
                      <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {selectedVault.fileCount || 0}
                      </p>
                    </div>

                    <div className={`${isDark ? 'bg-gradient-to-br from-yellow-500/5 to-orange-600/5 border-yellow-500/20' : 'bg-gradient-to-br from-yellow-500/5 to-orange-600/5 border-yellow-500/30'} border rounded-xl p-6 group hover:scale-105 transition-transform duration-300`}>
                      <div className="flex items-center justify-between mb-2">
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Protected</p>
                        <Zap className={`w-5 h-5 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
                      </div>
                      <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {selectedVault.hasPassword ? 'Yes' : 'No'}
                      </p>
                    </div>

                    <div className={`${isDark ? 'bg-gradient-to-br from-emerald-500/5 to-teal-600/5 border-emerald-500/20' : 'bg-gradient-to-br from-emerald-500/5 to-teal-600/5 border-emerald-500/30'} border rounded-xl p-6 group hover:scale-105 transition-transform duration-300`}>
                      <div className="flex items-center justify-between mb-2">
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Status</p>
                        <Activity className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                      </div>
                      <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Active
                      </p>
                    </div>
                  </div>

                  {/* Vault Details */}
                  <div className={`${isDark ? 'bg-slate-900/50' : 'bg-gray-50'} rounded-xl p-6 transition-colors duration-300`}>
                    <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-4`}>
                      Vault Details
                    </p>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Created</span>
                        <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {new Date(selectedVault.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Last Accessed</span>
                        <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {formatDate(selectedVault.lastAccessed)}
                        </span>
                      </div>
                      {selectedVault.description && (
                        <div>
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Description</span>
                          <p className={`text-sm mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {selectedVault.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================= ACCOUNT ANALYTICS ================= */}
        <div>
          <div className="mb-8">
            <h2 className={`text-2xl sm:text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2 flex items-center gap-3`}>
              <div className={`p-2 rounded-xl ${isDark ? 'bg-gradient-to-br from-indigo-500/20 to-purple-600/20' : 'bg-gradient-to-br from-indigo-500/10 to-purple-600/10'}`}>
                <TrendingUp className={`w-6 h-6 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
              </div>
              Account Overview
            </h2>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
              Cumulative analytics across your entire vault ecosystem
            </p>
          </div>

          {/* Top Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className={`${isDark ? 'bg-gradient-to-br from-cyan-500/5 to-blue-600/5 border-cyan-500/20' : 'bg-gradient-to-br from-cyan-500/5 to-blue-600/5 border-cyan-500/30'} backdrop-blur-xl border rounded-2xl p-6 group hover:scale-105 transition-all duration-300 shadow-lg`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${isDark ? 'bg-cyan-500/20' : 'bg-cyan-500/10'}`}>
                  <Shield className={`w-6 h-6 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                </div>
                <TrendingUp className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
              </div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Total Vaults</p>
              <p className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{totalVaults}</p>
              <p className={`text-xs ${isDark ? 'text-cyan-400/60' : 'text-cyan-600/60'} mt-2`}>Across all categories</p>
            </div>

            <div className={`${isDark ? 'bg-gradient-to-br from-indigo-500/5 to-purple-600/5 border-indigo-500/20' : 'bg-gradient-to-br from-indigo-500/5 to-purple-600/5 border-indigo-500/30'} backdrop-blur-xl border rounded-2xl p-6 group hover:scale-105 transition-all duration-300 shadow-lg`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${isDark ? 'bg-indigo-500/20' : 'bg-indigo-500/10'}`}>
                  <FileText className={`w-6 h-6 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
                </div>
                <TrendingUp className={`w-5 h-5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
              </div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Total Files</p>
              <p className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{totalFiles}</p>
              <p className={`text-xs ${isDark ? 'text-indigo-400/60' : 'text-indigo-600/60'} mt-2`}>Securely stored</p>
            </div>

            <div className={`${isDark ? 'bg-gradient-to-br from-emerald-500/5 to-teal-600/5 border-emerald-500/20' : 'bg-gradient-to-br from-emerald-500/5 to-teal-600/5 border-emerald-500/30'} backdrop-blur-xl border rounded-2xl p-6 group hover:scale-105 transition-all duration-300 shadow-lg`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-500/10'}`}>
                  <Database className={`w-6 h-6 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                </div>
                <TrendingUp className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
              </div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Storage Used</p>
              <p className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {totalStorage}
                <span className="text-xl ml-1">MB</span>
              </p>
              <p className={`text-xs ${isDark ? 'text-emerald-400/60' : 'text-emerald-600/60'} mt-2`}>of {TOTAL_STORAGE_LIMIT} MB</p>
            </div>
          </div>

          {/* Main Analytics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Account Storage Speedometer */}
            <div className={`${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/80 border-gray-200'} backdrop-blur-xl border rounded-2xl p-6 sm:p-8 shadow-xl transition-colors duration-300`}>
              <div className="flex items-center gap-2 mb-6">
                <Database className={`w-6 h-6 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Total Storage Capacity
                </p>
              </div>
              
              <div className="flex justify-center py-4">
                <Speedometer percentage={storagePercent} size={300} isDark={isDark} />
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className={`${isDark ? 'bg-slate-900/50' : 'bg-gray-50'} rounded-lg p-4 text-center`}>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Used</p>
                  <p className={`text-2xl font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                    {totalStorage} MB
                  </p>
                </div>
                <div className={`${isDark ? 'bg-slate-900/50' : 'bg-gray-50'} rounded-lg p-4 text-center`}>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Available</p>
                  <p className={`text-2xl font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    {TOTAL_STORAGE_LIMIT - totalStorage} MB
                  </p>
                </div>
              </div>
            </div>

            {/* File Type Distribution Pie Chart */}
            <div className={`${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/80 border-gray-200'} backdrop-blur-xl border rounded-2xl p-6 sm:p-8 shadow-xl transition-colors duration-300`}>
              <div className="flex items-center gap-2 mb-6">
                <PieChart className={`w-6 h-6 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  File Type Distribution
                </p>
              </div>

              <div className="flex flex-col items-center">
                <PieChartVisual 
                  documents={fileTypeCounts.documents}
                  images={fileTypeCounts.images}
                  others={fileTypeCounts.others}
                  isDark={isDark}
                />

                <div className="mt-8 w-full space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                      <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Documents</span>
                    </div>
                    <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {fileTypeCounts.documents} ({Math.round(docsPercent)}%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-purple-500"></div>
                      <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Images</span>
                    </div>
                    <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {fileTypeCounts.images} ({Math.round(imagesPercent)}%)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-emerald-500"></div>
                      <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Others</span>
                    </div>
                    <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {fileTypeCounts.others} ({Math.round(othersPercent)}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className={`${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/80 border-gray-200'} backdrop-blur-xl border rounded-2xl p-6 sm:p-8 shadow-xl transition-colors duration-300`}>
            <div className="flex items-center gap-2 mb-6">
              <Clock className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Recent Activity
              </p>
            </div>

            {vaults.length === 0 ? (
              <div className="text-center py-8">
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
                  No activity yet. Create your first vault to get started!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {vaults.slice(0, 5).map((vault, index) => (
                  <div key={vault.id} className={`flex items-center gap-4 p-4 rounded-xl ${isDark ? 'bg-slate-900/50 hover:bg-slate-900/70' : 'bg-gray-50 hover:bg-gray-100'} transition-colors duration-300 cursor-pointer`}
                    onClick={() => setSelectedVault(vault)}
                  >
                    <div className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-emerald-400' : isDark ? 'bg-gray-600' : 'bg-gray-400'}`}></div>
                    <Shield className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                    <div className="flex-1">
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{vault.name}</p>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {vault.fileCount || 0} files • {vault.storageUsed || 0} MB
                      </p>
                    </div>
                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      {formatDate(vault.lastAccessed)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .animate-shimmer {
          animation: shimmer 2s infinite;
        }

        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }

        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(6, 182, 212, 0.4);
          border-radius: 3px;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.6);
        }
      `}</style>
    </div>
  );
};

export default MainDashboard;