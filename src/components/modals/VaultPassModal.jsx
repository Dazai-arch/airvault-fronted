import { useState } from "react";
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
  Zap
} from "lucide-react";
import { useVault } from "../../context/VaultContext";
import { useNavigate } from "react-router-dom";
import { useTheme } from '../../context/ThemeContext';

const MAX_STORAGE = 1000;           // per-vault
const TOTAL_STORAGE_LIMIT = 5000;   // account-level

const MainDashboard = () => {
  const { vaults = [] } = useVault(); // Default to empty array
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const [selectedVault, setSelectedVault] = useState(null);
  const [search, setSearch] = useState("");

  /* ===============================
     CUMULATIVE ACCOUNT ANALYTICS
  =============================== */
  const totalVaults = vaults?.length || 0;

  const totalFiles = vaults?.reduce(
    (sum, vault) => sum + (vault?.files?.length || 0),
    0
  ) || 0;

  const totalStorage = vaults?.reduce(
    (sum, vault) => sum + (vault?.storageUsed || 0),
    0
  ) || 0;

  const fileTypeCounts = vaults?.reduce(
    (acc, vault) => {
      (vault?.files || []).forEach((file) => {
        const ext = file?.name?.split(".").pop()?.toLowerCase();
        if (["pdf", "doc", "docx", "txt"].includes(ext)) acc.documents++;
        else if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) acc.images++;
        else acc.others++;
      });
      return acc;
    },
    { documents: 0, images: 0, others: 0 }
  ) || { documents: 0, images: 0, others: 0 };

  const filteredVaults = vaults?.filter((vault) =>
    vault?.name?.toLowerCase().includes(search.toLowerCase())
  ) || [];

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
        <div className="mb-8">
          <h1 className={`text-3xl sm:text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2 flex items-center gap-3`}>
            <div className={`p-3 rounded-xl ${isDark ? 'bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border-cyan-500/30' : 'bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border-cyan-500/40'} border`}>
              <Activity className={`w-6 h-6 sm:w-8 sm:h-8 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
            </div>
            Main Dashboard
          </h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm sm:text-base`}>
            View, analyze, and manage all your secure vaults from one place
          </p>
        </div>

        {/* ================= MAIN DASHBOARD ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
          {/* LEFT: Vault List */}
          <div className="lg:col-span-4">
            <div className={`${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/80 border-gray-200'} backdrop-blur-xl border rounded-2xl h-[70vh] flex flex-col shadow-xl transition-colors duration-300`}>
              {/* Header + Search */}
              <div className={`p-4 ${isDark ? 'border-slate-700/50' : 'border-gray-200'} border-b space-y-3`}>
                <p className={`${isDark ? 'text-white' : 'text-gray-900'} font-semibold flex items-center justify-between`}>
                  <span>Your Vaults</span>
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
                    <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} text-sm mb-2`}>
                      {search ? 'No matching vaults found' : 'No vaults created yet'}
                    </p>
                    {!search && (
                      <button
                        onClick={() => navigate("/vaults")}
                        className={`mt-4 text-xs ${isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-600 hover:text-cyan-700'} transition-colors`}
                      >
                        Create your first vault →
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredVaults.map((vault) => (
                      <div
                        key={vault?.id}
                        onClick={() => setSelectedVault(vault)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-300 group ${
                          selectedVault?.id === vault?.id
                            ? isDark
                              ? "bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/50 shadow-lg shadow-cyan-500/20"
                              : "bg-gradient-to-r from-cyan-500/5 to-blue-600/5 border border-cyan-500/50 shadow-lg shadow-cyan-500/10"
                            : isDark
                              ? "hover:bg-slate-700/50 border border-transparent"
                              : "hover:bg-gray-50 border border-transparent"
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${selectedVault?.id === vault?.id ? 'bg-cyan-500/20' : isDark ? 'bg-slate-700' : 'bg-gray-100'} transition-colors duration-300`}>
                          <Shield className={`w-5 h-5 ${selectedVault?.id === vault?.id ? 'text-cyan-400' : isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`${isDark ? 'text-white' : 'text-gray-900'} font-medium truncate`}>
                            {vault?.name || 'Unnamed Vault'}
                          </p>
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {vault?.files?.length || 0} files • {vault?.storageUsed || 0} MB
                          </p>
                        </div>

                        {selectedVault?.id === vault?.id && (
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
            <div className={`${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/80 border-gray-200'} backdrop-blur-xl border rounded-2xl h-[70vh] p-6 shadow-xl transition-colors duration-300`}>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-6 flex items-center gap-2`}>
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
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className={`${isDark ? 'bg-gradient-to-br from-cyan-500/5 to-blue-600/5 border-cyan-500/20' : 'bg-gradient-to-br from-cyan-500/5 to-blue-600/5 border-cyan-500/30'} border rounded-xl p-6 group hover:scale-105 transition-transform duration-300`}>
                      <div className="flex items-center justify-between mb-2">
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Files Stored</p>
                        <FileText className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                      </div>
                      <p className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {selectedVault?.files?.length || 0}
                      </p>
                      <p className={`text-xs ${isDark ? 'text-cyan-400/60' : 'text-cyan-600/60'} mt-1`}>
                        Total files in vault
                      </p>
                    </div>

                    <div className={`${isDark ? 'bg-gradient-to-br from-indigo-500/5 to-purple-600/5 border-indigo-500/20' : 'bg-gradient-to-br from-indigo-500/5 to-purple-600/5 border-indigo-500/30'} border rounded-xl p-6 group hover:scale-105 transition-transform duration-300`}>
                      <div className="flex items-center justify-between mb-2">
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Storage Used</p>
                        <Database className={`w-5 h-5 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
                      </div>
                      <p className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {selectedVault?.storageUsed || 0}
                        <span className="text-xl ml-1">MB</span>
                      </p>
                      <p className={`text-xs ${isDark ? 'text-indigo-400/60' : 'text-indigo-600/60'} mt-1`}>
                        of {MAX_STORAGE} MB limit
                      </p>
                    </div>
                  </div>

                  {/* Storage Progress */}
                  <div className={`${isDark ? 'bg-slate-900/50' : 'bg-gray-50'} rounded-xl p-6 transition-colors duration-300`}>
                    <div className="flex items-center justify-between mb-3">
                      <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Storage Utilization
                      </p>
                      <p className={`text-sm font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                        {Math.round(((selectedVault?.storageUsed || 0) / MAX_STORAGE) * 100)}%
                      </p>
                    </div>
                    <div className={`w-full ${isDark ? 'bg-slate-800' : 'bg-gray-200'} rounded-full h-3 overflow-hidden`}>
                      <div
                        className="h-3 rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 transition-all duration-1000 ease-out relative overflow-hidden"
                        style={{
                          width: `${Math.min(((selectedVault?.storageUsed || 0) / MAX_STORAGE) * 100, 100)}%`
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                      </div>
                    </div>
                    <div className="flex justify-between mt-2 text-xs">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>0 MB</span>
                      <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>{MAX_STORAGE} MB</span>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className={`${isDark ? 'bg-slate-900/50' : 'bg-gray-50'} rounded-xl p-4 text-center transition-colors duration-300`}>
                      <Zap className={`w-6 h-6 ${isDark ? 'text-yellow-400' : 'text-yellow-600'} mx-auto mb-2`} />
                      <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {selectedVault?.hasPassword ? 'Yes' : 'No'}
                      </p>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Protected</p>
                    </div>
                    <div className={`${isDark ? 'bg-slate-900/50' : 'bg-gray-50'} rounded-xl p-4 text-center transition-colors duration-300`}>
                      <TrendingUp className={`w-6 h-6 ${isDark ? 'text-emerald-400' : 'text-emerald-600'} mx-auto mb-2`} />
                      <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {selectedVault?.fileCount || selectedVault?.files?.length || 0}
                      </p>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Files</p>
                    </div>
                    <div className={`${isDark ? 'bg-slate-900/50' : 'bg-gray-50'} rounded-xl p-4 text-center transition-colors duration-300`}>
                      <Activity className={`w-6 h-6 ${isDark ? 'text-cyan-400' : 'text-cyan-600'} mx-auto mb-2`} />
                      <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Active
                      </p>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Status</p>
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
            <h2 className={`text-2xl sm:text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
              Account Analytics
            </h2>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
              Cumulative storage and file insights across all vaults
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
            </div>

            <div className={`${isDark ? 'bg-gradient-to-br from-emerald-500/5 to-teal-600/5 border-emerald-500/20' : 'bg-gradient-to-br from-emerald-500/5 to-teal-600/5 border-emerald-500/30'} backdrop-blur-xl border rounded-2xl p-6 group hover:scale-105 transition-all duration-300 shadow-lg`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-500/10'}`}>
                  <Database className={`w-6 h-6 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                </div>
                <TrendingUp className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
              </div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>Total Storage Used</p>
              <p className={`text-4xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {totalStorage}
                <span className="text-xl ml-1">MB</span>
              </p>
            </div>
          </div>

          {/* Storage Progress */}
          <div className={`${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/80 border-gray-200'} backdrop-blur-xl border rounded-2xl p-6 sm:p-8 mb-8 shadow-xl transition-colors duration-300`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Cumulative Storage Utilization
                </p>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Account-wide storage usage
                </p>
              </div>
              <div className="text-right">
                <p className={`text-3xl font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                  {Math.round((totalStorage / TOTAL_STORAGE_LIMIT) * 100)}%
                </p>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {totalStorage} / {TOTAL_STORAGE_LIMIT} MB
                </p>
              </div>
            </div>

            <div className={`w-full ${isDark ? 'bg-slate-900' : 'bg-gray-200'} rounded-full h-4 overflow-hidden`}>
              <div
                className="h-4 rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 transition-all duration-1000 ease-out relative overflow-hidden"
                style={{
                  width: `${Math.min((totalStorage / TOTAL_STORAGE_LIMIT) * 100, 100)}%`
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
              </div>
            </div>
          </div>

          {/* File Type Distribution */}
          <div className={`${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/80 border-gray-200'} backdrop-blur-xl border rounded-2xl p-6 sm:p-8 shadow-xl transition-colors duration-300`}>
            <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-6`}>
              File Type Distribution
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className={`${isDark ? 'bg-slate-900/50' : 'bg-gray-50'} rounded-xl p-6 text-center group hover:scale-105 transition-all duration-300`}>
                <div className={`inline-flex p-3 rounded-xl ${isDark ? 'bg-blue-500/20' : 'bg-blue-500/10'} mb-3`}>
                  <FileText className={`w-8 h-8 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2`}>Documents</p>
                <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {fileTypeCounts.documents}
                </p>
                <p className={`text-xs ${isDark ? 'text-blue-400/60' : 'text-blue-600/60'} mt-1`}>
                  PDF, DOC, TXT
                </p>
              </div>

              <div className={`${isDark ? 'bg-slate-900/50' : 'bg-gray-50'} rounded-xl p-6 text-center group hover:scale-105 transition-all duration-300`}>
                <div className={`inline-flex p-3 rounded-xl ${isDark ? 'bg-purple-500/20' : 'bg-purple-500/10'} mb-3`}>
                  <Image className={`w-8 h-8 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                </div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2`}>Images</p>
                <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {fileTypeCounts.images}
                </p>
                <p className={`text-xs ${isDark ? 'text-purple-400/60' : 'text-purple-600/60'} mt-1`}>
                  JPG, PNG, GIF
                </p>
              </div>

              <div className={`${isDark ? 'bg-slate-900/50' : 'bg-gray-50'} rounded-xl p-6 text-center group hover:scale-105 transition-all duration-300`}>
                <div className={`inline-flex p-3 rounded-xl ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-500/10'} mb-3`}>
                  <File className={`w-8 h-8 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                </div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2`}>Others</p>
                <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {fileTypeCounts.others}
                </p>
                <p className={`text-xs ${isDark ? 'text-emerald-400/60' : 'text-emerald-600/60'} mt-1`}>
                  Various types
                </p>
              </div>
            </div>
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
      `}</style>
    </div>
  );
};

export default MainDashboard;