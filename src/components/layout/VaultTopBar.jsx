import { Shield, Bell, LogOut } from "lucide-react";

const VaultTopBar = ({ username = "User" }) => {
  return (
    <nav className="w-full sticky top-0 z-50 bg-black/40 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/5">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
        <div className="flex items-center gap-3 group">
          <div className="relative">
            <div className="absolute inset-0 bg-linear-to-br from-purple-500 to-pink-500 rounded-xl blur-sm opacity-75 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative bg-linear-to-br from-purple-500 to-pink-500 p-2.5 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Shield className="w-5 h-5 text-white" />
            </div>
          </div>
          <span className="text-xl font-bold bg-linear-to-r from-white via-purple-100 to-pink-100 bg-clip-text text-transparent">
            AirVault
          </span>
          <div className="hidden sm:flex items-center gap-1.5 ml-2 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            <span className="text-purple-300 text-xs font-medium">Secure</span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <button className="relative p-2 rounded-xl hover:bg-white/5 transition-all duration-200 group/bell">
            <Bell className="w-5 h-5 text-gray-400 group-hover/bell:text-white transition-colors duration-200" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-900 animate-pulse" />
          </button>
          
          <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-200 cursor-pointer group/user">
            <div className="w-8 h-8 rounded-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-semibold ring-2 ring-white/20 group-hover/user:ring-white/40 transition-all duration-200">
              {username.charAt(0).toUpperCase()}
            </div>
            <span className="text-white text-sm font-medium">{username}</span>
          </div>
          
          <button className="p-2 rounded-xl hover:bg-red-500/10 transition-all duration-200 group/logout">
            <LogOut className="w-5 h-5 text-gray-400 group-hover/logout:text-red-400 transition-colors duration-200" />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default VaultTopBar;