import {
  Upload, Share2, QrCode, AlertTriangle, CheckCircle,
  File, Image, FileText, Download, Wifi
} from "lucide-react";

const AirVaultDashboard = () => {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[
          { label: "Total Files", value: "24", icon: File, color: "from-blue-500/20 to-cyan-500/20", iconColor: "text-cyan-400", border: "border-cyan-500/30" },
          { label: "Storage Used", value: "5.2 GB", icon: Upload, color: "from-purple-500/20 to-pink-500/20", iconColor: "text-pink-400", border: "border-pink-500/30" },
          { label: "Shared Files", value: "7", icon: Share2, color: "from-violet-500/20 to-purple-500/20", iconColor: "text-violet-400", border: "border-violet-500/30" },
          { label: "Security Score", value: "98%", icon: CheckCircle, color: "from-emerald-500/20 to-green-500/20", iconColor: "text-emerald-400", border: "border-emerald-500/30" }
        ].map((item, i) => (
          <div 
            key={i} 
            className={`group relative bg-linear-to-br ${item.color} backdrop-blur-xl border ${item.border} rounded-2xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer overflow-hidden`}
          >
            <div className="absolute inset-0 bg-linear-to-br from-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">{item.label}</p>
                <p className="text-3xl font-bold text-white tracking-tight">{item.value}</p>
              </div>
              <div className={`p-3 rounded-xl bg-white/5 border border-white/10 group-hover:scale-110 transition-transform duration-300`}>
                <item.icon className={`w-6 h-6 ${item.iconColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upload */}
      <div className="relative group bg-linear-to-br from-white/5 to-white/2 backdrop-blur-xl border border-white/10 rounded-3xl p-8 mb-8 overflow-hidden transition-all duration-300 hover:border-purple-500/50 hover:shadow-2xl">
        <div className="absolute inset-0 bg-linear-to-br from-purple-500/0 via-transparent to-pink-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold text-white tracking-tight">Upload Files</h2>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 text-xs font-semibold">End-to-End Encrypted</span>
            </div>
          </div>
          
          <div className="relative border-2 border-dashed border-white/20 rounded-2xl p-12 sm:p-16 text-center transition-all duration-300 hover:border-purple-400 hover:bg-white/2 group/upload cursor-pointer">
            <div className="absolute inset-0 bg-linear-to-br from-purple-500/0 via-transparent to-pink-500/0 opacity-0 group-hover/upload:opacity-100 transition-opacity duration-500 rounded-2xl" />
            <div className="relative">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-linear-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 mb-6 group-hover/upload:scale-110 transition-transform duration-300">
                <Upload className="w-10 h-10 text-purple-400" />
              </div>
              <p className="text-white font-semibold text-lg mb-2">Drop files here or click to upload</p>
              <p className="text-gray-400 text-sm">Files are encrypted locally before upload • Maximum 100MB per file</p>
              
              <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
                <div className="flex items-center gap-2 text-gray-500 text-xs">
                  <File className="w-4 h-4" />
                  <span>Documents</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500 text-xs">
                  <Image className="w-4 h-4" />
                  <span>Images</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500 text-xs">
                  <FileText className="w-4 h-4" />
                  <span>PDFs</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Files UI can be plugged later */}
    </div>
  );
};

export default AirVaultDashboard;