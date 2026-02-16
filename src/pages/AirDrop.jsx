import { useState, useEffect, useRef } from 'react';
import {
  Wifi,
  WifiOff,
  Upload,
  Download,
  X,
  Check,
  Loader,
  File,
  Image as ImageIcon,
  FileText,
  Music,
  Video,
  Smartphone,
  Laptop,
  Tablet,
  Monitor,
  Globe
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const AirDrop = () => {
  const { isDark } = useTheme();
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showDropModal, setShowDropModal] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [transferStatus, setTransferStatus] = useState(null); // 'sending', 'success', 'error'
  const [transferProgress, setTransferProgress] = useState(0);
  const canvasRef = useRef(null);
  const radarAngleRef = useRef(0);
  const animationFrameRef = useRef(null);

  // Simulated nearby devices
  const mockDevices = [
    { id: 1, name: 'John\'s iPhone', type: 'phone', angle: 45, distance: 0.7, status: 'online' },
    { id: 2, name: 'Sarah\'s MacBook', type: 'laptop', angle: 135, distance: 0.5, status: 'online' },
    { id: 3, name: 'Office iPad', type: 'tablet', angle: 225, distance: 0.8, status: 'online' },
    { id: 4, name: 'Mike\'s Desktop', type: 'desktop', angle: 315, distance: 0.6, status: 'online' },
    { id: 5, name: 'Guest Phone', type: 'phone', angle: 90, distance: 0.9, status: 'online' },
    { id: 6, name: 'Conference Room', type: 'desktop', angle: 180, distance: 0.4, status: 'online' },
  ];

  // Device icon mapping
  const getDeviceIcon = (type) => {
    switch (type) {
      case 'phone': return Smartphone;
      case 'laptop': return Laptop;
      case 'tablet': return Tablet;
      case 'desktop': return Monitor;
      default: return Globe;
    }
  };

  // File type icon mapping
  const getFileIcon = (file) => {
    const type = file.type.split('/')[0];
    if (type === 'image') return ImageIcon;
    if (type === 'video') return Video;
    if (type === 'audio') return Music;
    if (file.type.includes('pdf') || file.type.includes('document')) return FileText;
    return File;
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Start scanning for devices
  const startScanning = () => {
    setIsScanning(true);
    // Simulate device discovery with delay
    setTimeout(() => {
      setDevices(mockDevices);
      setIsScanning(false);
    }, 2000);
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

  // Handle device click
  const handleDeviceClick = (device) => {
    setSelectedDevice(device);
    setShowDropModal(true);
  };

  // Handle file drop/send
  const handleSendFiles = async () => {
    if (!selectedFiles.length) return;

    setTransferStatus('sending');
    setTransferProgress(0);

    // Simulate file transfer
    const interval = setInterval(() => {
      setTransferProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTransferStatus('success');
          setTimeout(() => {
            setShowDropModal(false);
            setSelectedFiles([]);
            setTransferStatus(null);
            setTransferProgress(0);
          }, 2000);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  // Draw radar
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.min(centerX, centerY) - 20;

    const drawRadar = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw concentric circles
      const circles = 4;
      for (let i = 1; i <= circles; i++) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, (maxRadius / circles) * i, 0, Math.PI * 2);
        ctx.strokeStyle = isDark ? 'rgba(6, 182, 212, 0.2)' : 'rgba(6, 182, 212, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Draw cross lines
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - maxRadius);
      ctx.lineTo(centerX, centerY + maxRadius);
      ctx.moveTo(centerX - maxRadius, centerY);
      ctx.lineTo(centerX + maxRadius, centerY);
      ctx.strokeStyle = isDark ? 'rgba(6, 182, 212, 0.2)' : 'rgba(6, 182, 212, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw scanning sweep
      if (isScanning) {
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius);
        gradient.addColorStop(0, 'rgba(6, 182, 212, 0.4)');
        gradient.addColorStop(0.5, 'rgba(6, 182, 212, 0.2)');
        gradient.addColorStop(1, 'rgba(6, 182, 212, 0)');

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(radarAngleRef.current);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, maxRadius, 0, Math.PI / 3);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.restore();

        radarAngleRef.current += 0.05;
      }

      // Draw devices
      devices.forEach(device => {
        const angle = (device.angle * Math.PI) / 180;
        const distance = device.distance * maxRadius;
        const x = centerX + distance * Math.cos(angle);
        const y = centerY + distance * Math.sin(angle);

        // Draw device dot with pulse
        const pulseRadius = 8 + Math.sin(Date.now() / 500) * 2;
        
        // Outer glow
        ctx.beginPath();
        ctx.arc(x, y, pulseRadius + 5, 0, Math.PI * 2);
        const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, pulseRadius + 5);
        glowGradient.addColorStop(0, 'rgba(6, 182, 212, 0.4)');
        glowGradient.addColorStop(1, 'rgba(6, 182, 212, 0)');
        ctx.fillStyle = glowGradient;
        ctx.fill();

        // Main dot
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#06b6d4';
        ctx.fill();
        ctx.strokeStyle = isDark ? '#0f172a' : '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // Center device (you)
      ctx.beginPath();
      ctx.arc(centerX, centerY, 10, 0, Math.PI * 2);
      const centerGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 10);
      centerGradient.addColorStop(0, '#3b82f6');
      centerGradient.addColorStop(1, '#1e40af');
      ctx.fillStyle = centerGradient;
      ctx.fill();
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 3;
      ctx.stroke();

      animationFrameRef.current = requestAnimationFrame(drawRadar);
    };

    drawRadar();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [devices, isScanning, isDark]);

  // Auto-start scanning on mount
  useEffect(() => {
    startScanning();
  }, []);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'} transition-colors duration-500 p-4 sm:p-8`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className={`text-4xl sm:text-5xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-3 flex items-center justify-center gap-3`}>
            <div className={`p-3 rounded-2xl ${isDark ? 'bg-gradient-to-br from-cyan-500/20 to-blue-600/20' : 'bg-gradient-to-br from-cyan-500/10 to-blue-600/10'}`}>
              <Wifi className={`w-8 h-8 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
            </div>
            AirDrop
          </h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-lg`}>
            Share files wirelessly with nearby devices
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Radar Display */}
          <div className="lg:col-span-2">
            <div className={`${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/80 border-gray-200'} backdrop-blur-xl border rounded-3xl p-8 shadow-2xl transition-colors duration-300 relative overflow-hidden`}>
              {/* Background glow effect */}
              <div className={`absolute inset-0 ${isDark ? 'bg-gradient-to-br from-cyan-500/5 to-blue-600/5' : 'bg-gradient-to-br from-cyan-500/3 to-blue-600/3'} pointer-events-none`}></div>
              
              <div className="relative">
                {/* Radar Canvas */}
                <div className="relative flex items-center justify-center">
                  <canvas
                    ref={canvasRef}
                    width={600}
                    height={600}
                    className="w-full max-w-[600px] h-auto"
                  />
                  
                  {/* Device labels overlay */}
                  <div className="absolute inset-0 pointer-events-none">
                    {devices.map(device => {
                      const angle = (device.angle * Math.PI) / 180;
                      const distance = device.distance;
                      const x = 50 + distance * 50 * Math.cos(angle);
                      const y = 50 + distance * 50 * Math.sin(angle);
                      
                      return (
                        <div
                          key={device.id}
                          className="absolute pointer-events-auto"
                          style={{
                            left: `${x}%`,
                            top: `${y}%`,
                            transform: 'translate(-50%, -50%)',
                          }}
                        >
                          <button
                            onClick={() => handleDeviceClick(device)}
                            className={`group relative ${isDark ? 'bg-slate-900/80 hover:bg-slate-800' : 'bg-white/80 hover:bg-white'} backdrop-blur-sm border ${isDark ? 'border-cyan-500/30 hover:border-cyan-500/60' : 'border-cyan-500/40 hover:border-cyan-500/80'} rounded-xl p-3 shadow-lg transition-all duration-300 hover:scale-110`}
                          >
                            {/* Connection line */}
                            <div className="absolute bottom-full left-1/2 w-px h-8 bg-gradient-to-t from-cyan-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            
                            <div className="flex flex-col items-center gap-1">
                              {(() => {
                                const DeviceIcon = getDeviceIcon(device.type);
                                return <DeviceIcon className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />;
                              })()}
                              <span className={`text-xs font-medium whitespace-nowrap ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {device.name}
                              </span>
                            </div>
                            
                            {/* Status indicator */}
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900 animate-pulse"></div>
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Center "You" label */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-16">
                    <div className={`${isDark ? 'bg-blue-500/20 border-blue-500/30' : 'bg-blue-500/10 border-blue-500/40'} backdrop-blur-sm border rounded-lg px-3 py-1`}>
                      <span className={`text-sm font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                        You
                      </span>
                    </div>
                  </div>
                </div>

                {/* Scanning indicator */}
                {isScanning && (
                  <div className="mt-6 flex items-center justify-center gap-3">
                    <Loader className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-cyan-600'} animate-spin`} />
                    <span className={`${isDark ? 'text-gray-300' : 'text-gray-700'} font-medium`}>
                      Scanning for nearby devices...
                    </span>
                  </div>
                )}

                {/* Scan button */}
                <div className="mt-8 flex justify-center">
                  <button
                    onClick={startScanning}
                    disabled={isScanning}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                      isScanning
                        ? 'bg-gray-400 cursor-not-allowed'
                        : isDark
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50'
                          : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50'
                    } hover:scale-105`}
                  >
                    <Wifi className="w-5 h-5" />
                    {isScanning ? 'Scanning...' : 'Scan Again'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Device List */}
          <div className="lg:col-span-1">
            <div className={`${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/80 border-gray-200'} backdrop-blur-xl border rounded-3xl p-6 shadow-2xl transition-colors duration-300 h-full`}>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-4 flex items-center gap-2`}>
                <Globe className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                Nearby Devices
              </h2>

              <div className="space-y-3">
                {devices.length === 0 ? (
                  <div className="text-center py-12">
                    <WifiOff className={`w-12 h-12 ${isDark ? 'text-gray-600' : 'text-gray-400'} mx-auto mb-3`} />
                    <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
                      No devices found
                    </p>
                    <p className={`${isDark ? 'text-gray-500' : 'text-gray-500'} text-xs mt-1`}>
                      Start scanning to discover nearby devices
                    </p>
                  </div>
                ) : (
                  devices.map(device => {
                    const DeviceIcon = getDeviceIcon(device.type);
                    return (
                      <button
                        key={device.id}
                        onClick={() => handleDeviceClick(device)}
                        className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all duration-300 group ${
                          isDark
                            ? 'bg-slate-900/50 hover:bg-slate-900/80 border border-slate-700/50 hover:border-cyan-500/50'
                            : 'bg-gray-50 hover:bg-white border border-gray-200 hover:border-cyan-500/50'
                        } hover:scale-[1.02] hover:shadow-lg`}
                      >
                        <div className={`p-3 rounded-lg ${isDark ? 'bg-cyan-500/20 group-hover:bg-cyan-500/30' : 'bg-cyan-500/10 group-hover:bg-cyan-500/20'} transition-colors`}>
                          <DeviceIcon className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                        </div>
                        <div className="flex-1 text-left">
                          <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {device.name}
                          </p>
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {device.type.charAt(0).toUpperCase() + device.type.slice(1)}
                          </p>
                        </div>
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Quick stats */}
              <div className={`mt-6 p-4 rounded-xl ${isDark ? 'bg-slate-900/50' : 'bg-gray-50'} transition-colors`}>
                <div className="flex items-center justify-between text-sm">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Devices Online</span>
                  <span className={`font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                    {devices.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* File Drop Modal */}
        {showDropModal && selectedDevice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} border rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden transform transition-all duration-300 scale-100`}>
              {/* Modal Header */}
              <div className={`p-6 ${isDark ? 'border-slate-700' : 'border-gray-200'} border-b`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const DeviceIcon = getDeviceIcon(selectedDevice.type);
                      return (
                        <div className={`p-3 rounded-xl ${isDark ? 'bg-cyan-500/20' : 'bg-cyan-500/10'}`}>
                          <DeviceIcon className={`w-6 h-6 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                        </div>
                      );
                    })()}
                    <div>
                      <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Send to {selectedDevice.name}
                      </h3>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Select files to transfer
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowDropModal(false);
                      setSelectedFiles([]);
                      setTransferStatus(null);
                    }}
                    className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-100'} transition-colors`}
                  >
                    <X className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                {transferStatus === null && (
                  <>
                    {/* File Upload Area */}
                    <label
                      htmlFor="file-upload"
                      className={`block w-full p-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 ${
                        isDark
                          ? 'border-slate-600 hover:border-cyan-500 bg-slate-900/50 hover:bg-slate-900/80'
                          : 'border-gray-300 hover:border-cyan-500 bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <input
                        id="file-upload"
                        type="file"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <div className="flex flex-col items-center gap-3">
                        <div className={`p-4 rounded-full ${isDark ? 'bg-cyan-500/20' : 'bg-cyan-500/10'}`}>
                          <Upload className={`w-8 h-8 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                        </div>
                        <div className="text-center">
                          <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Click to select files
                          </p>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                            or drag and drop here
                          </p>
                        </div>
                      </div>
                    </label>

                    {/* Selected Files List */}
                    {selectedFiles.length > 0 && (
                      <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                        {selectedFiles.map((file, index) => {
                          const FileIcon = getFileIcon(file);
                          return (
                            <div
                              key={index}
                              className={`flex items-center gap-3 p-3 rounded-xl ${
                                isDark ? 'bg-slate-900/50' : 'bg-gray-50'
                              }`}
                            >
                              <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-500/20' : 'bg-blue-500/10'}`}>
                                <FileIcon className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                  {file.name}
                                </p>
                                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {formatFileSize(file.size)}
                                </p>
                              </div>
                              <button
                                onClick={() => {
                                  setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
                                }}
                                className={`p-1 rounded-lg ${isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-200'} transition-colors`}
                              >
                                <X className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Send Button */}
                    <button
                      onClick={handleSendFiles}
                      disabled={selectedFiles.length === 0}
                      className={`w-full mt-6 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                        selectedFiles.length === 0
                          ? 'bg-gray-400 cursor-not-allowed'
                          : isDark
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/30'
                            : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/30'
                      } hover:scale-[1.02]`}
                    >
                      <Upload className="w-5 h-5" />
                      Send {selectedFiles.length > 0 && `${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''}`}
                    </button>
                  </>
                )}

                {/* Transfer Progress */}
                {transferStatus === 'sending' && (
                  <div className="text-center py-8">
                    <div className={`inline-flex p-6 rounded-full ${isDark ? 'bg-cyan-500/20' : 'bg-cyan-500/10'} mb-4`}>
                      <Loader className={`w-12 h-12 ${isDark ? 'text-cyan-400' : 'text-cyan-600'} animate-spin`} />
                    </div>
                    <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
                      Sending files...
                    </p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
                      {transferProgress}% complete
                    </p>
                    <div className={`w-full ${isDark ? 'bg-slate-900' : 'bg-gray-200'} rounded-full h-2 overflow-hidden`}>
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-300"
                        style={{ width: `${transferProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Transfer Success */}
                {transferStatus === 'success' && (
                  <div className="text-center py-8">
                    <div className={`inline-flex p-6 rounded-full ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-500/10'} mb-4`}>
                      <Check className={`w-12 h-12 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                    </div>
                    <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
                      Transfer Complete!
                    </p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Files sent successfully to {selectedDevice.name}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AirDrop;