import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, FileText, Upload, FolderPlus, FileSearch, Share2,
  Settings, LogOut, ChevronRight, Plus, X, Shield, Menu,
  ShieldCheck, Folder,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { useVault } from "../../context/VaultContext";

const HamburgerMenu = () => {
  const [isExpanded,      setIsExpanded]      = useState(false);
  const [expandedSubmenu, setExpandedSubmenu] = useState(null);
  const [isMobile,        setIsMobile]        = useState(false);
  const navigate = useNavigate();
  const { isDark }      = useTheme();
  const { activeVault } = useVault();

  // ── Fix 2: detect mobile ──────────────────────────────────────────────────
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    setIsMobile(mq.matches);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Close sidebar when clicking outside on mobile
  const sidebarRef = useRef(null);
  useEffect(() => {
    if (!isMobile) return;
    const handleOutside = (e) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        collapse();
      }
    };
    if (isExpanded) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [isMobile, isExpanded]);

  // ── Fix 1: use fullName (matches your server's User schema) ───────────────
  const userData    = JSON.parse(localStorage.getItem("user") || "{}");
  const displayName = userData.fullName || userData.name || "User";
  const userInitial = displayName.charAt(0).toUpperCase();

  /* ── sidebar open / close ── */
  const expand = () => {
    setIsExpanded(true);
    window.dispatchEvent(new CustomEvent("sidebarToggle", { detail: { expanded: true } }));
  };
  const collapse = () => {
    setIsExpanded(false);
    setExpandedSubmenu(null);
    window.dispatchEvent(new CustomEvent("sidebarToggle", { detail: { expanded: false } }));
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const menuItems = [
    {
      id: "dashboard", label: "Dashboard",
      icon: <Home className="w-[18px] h-[18px]" />, iconColor: "text-cyan-400",
      action: () => { navigate("/vault/dashboard"); if (isMobile) collapse(); },
    },
    {
      id: "accesslog", label: "Access Log",
      icon: <FileText className="w-[18px] h-[18px]" />, iconColor: "text-blue-400",
      action: () => { navigate("/vault/accesslog"); if (isMobile) collapse(); },
    },
    {
      id: "upload", label: "Upload",
      icon: <Upload className="w-[18px] h-[18px]" />, iconColor: "text-emerald-400",
      hasSubmenu: true,
      submenu: [
        { label: "Without Folder", icon: <Upload className="w-3 h-3" />,     action: () => { navigate("/vault/fileupload"); if (isMobile) collapse(); } },
        { label: "With Folder",    icon: <FolderPlus className="w-3 h-3" />, action: () => { navigate("/vault/fileupload"); if (isMobile) collapse(); } },
      ],
    },
    {
      id: "fileaccess", label: "File Access",
      icon: <FileSearch className="w-[18px] h-[18px]" />, iconColor: "text-indigo-400",
      hasSubmenu: true,
      submenu: [
        { label: "File View",   icon: <FileSearch className="w-3 h-3" />, action: () => { navigate("/vault/file");   if (isMobile) collapse(); } },
        { label: "Folder View", icon: <Folder className="w-3 h-3" />,     action: () => { navigate("/vault/folder"); if (isMobile) collapse(); } },
      ],
    },
    {
      id: "permissions", label: "Permissions",
      icon: <ShieldCheck className="w-[18px] h-[18px]" />, iconColor: "text-violet-400",
      action: () => { navigate("/vault/permissions"); if (isMobile) collapse(); },
    },
    {
      id: "sharing", label: "Sharing",
      icon: <Share2 className="w-[18px] h-[18px]" />, iconColor: "text-teal-400",
      action: () => { navigate("/vault/filesharing"); if (isMobile) collapse(); },
    },
    {
      id: "details", label: "Details",
      icon: <Settings className="w-[18px] h-[18px]" />, iconColor: "text-slate-400",
      action: () => { navigate("/vault/details"); if (isMobile) collapse(); },
    },
    {
      id: "createvault", label: "Create Vault",
      icon: <Plus className="w-[18px] h-[18px]" />, iconColor: "text-cyan-400",
      action: () => { navigate("/createvaults"); if (isMobile) collapse(); },
    },
  ];

  return (
    <>
      {/* ── Mobile overlay backdrop ── */}
      <AnimatePresence>
        {isMobile && isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={collapse}
            className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* ── Mobile hamburger toggle button (shown in top bar area) ── */}
      {isMobile && (
        <button
          onClick={isExpanded ? collapse : expand}
          className={`fixed top-4 left-4 z-[60] p-2 rounded-xl border transition-all duration-300 ${
            isDark
              ? "bg-slate-800 border-slate-700 text-gray-300 hover:text-white"
              : "bg-white border-gray-200 text-gray-600 hover:text-gray-900"
          }`}
        >
          <AnimatePresence mode="wait" initial={false}>
            {isExpanded ? (
              <motion.span
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0,   opacity: 1 }}
                exit={{   rotate:  90,  opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <X className="w-5 h-5" />
              </motion.span>
            ) : (
              <motion.span
                key="open"
                initial={{ rotate: 90,  opacity: 0 }}
                animate={{ rotate: 0,   opacity: 1 }}
                exit={{   rotate: -90,  opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Menu className="w-5 h-5" />
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      )}

      <motion.aside
        ref={sidebarRef}
        initial={false}
        animate={{
          width: isExpanded ? 220 : (isMobile ? 0 : 60),
          x: isMobile && !isExpanded ? -220 : 0,
        }}
        transition={{ type: "spring", damping: 24, stiffness: 280 }}
        // Desktop: hover to expand | Mobile: controlled by toggle button only
        onMouseEnter={!isMobile ? expand   : undefined}
        onMouseLeave={!isMobile ? collapse : undefined}
        className={`fixed left-0 top-16 bottom-0 z-40 flex flex-col border-r overflow-hidden transition-colors duration-300 ${
          isDark ? "bg-slate-900/95 border-slate-700/50" : "bg-white/95 border-gray-200"
        }`}
        style={{ backdropFilter: "blur(20px)" }}
      >
        {/* Top accent line */}
        <div className="h-[2px] bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 flex-shrink-0" />

        {/* Header */}
        <div className={`flex items-center px-3 py-3 border-b flex-shrink-0 ${isDark ? "border-slate-700/50" : "border-gray-200"}`}>
          <div className={`flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl ${isDark ? "text-cyan-400" : "text-cyan-600"}`}>
            <Menu className="w-[18px] h-[18px]" />
          </div>
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }} transition={{ duration: 0.18 }}
                className="ml-3 flex items-center gap-2 min-w-0 overflow-hidden"
              >
                {activeVault ? (
                  <>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                    <p className={`text-sm font-bold truncate ${isDark ? "text-white" : "text-gray-900"}`}>{activeVault.name}</p>
                  </>
                ) : (
                  <p className={`text-xs font-bold uppercase tracking-widest truncate ${isDark ? "text-gray-500" : "text-gray-400"}`}>No Vault</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden sidebar-scrollbar py-3 px-2 space-y-0.5">
          {menuItems.map((item) => (
            <div key={item.id}>
              <motion.button
                whileTap={{ scale: 0.97 }}
                title={!isExpanded ? item.label : undefined}
                onClick={() => {
                  if (item.hasSubmenu) {
                    setExpandedSubmenu(expandedSubmenu === item.id ? null : item.id);
                  } else {
                    item.action();
                  }
                }}
                className={`w-full flex items-center rounded-xl transition-all duration-200 group relative ${
                  isExpanded ? "gap-3 px-3 py-2.5" : "justify-center py-2.5"
                }`}
              >
                {/* Hover bg */}
                <span className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
                  isDark ? "bg-slate-800/80" : "bg-gray-100"
                }`} />

                {/* Left accent bar */}
                {isExpanded && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-0 bg-gradient-to-b from-cyan-500 to-blue-600 rounded-full group-hover:h-3/4 transition-all duration-300" />
                )}

                <span className={`relative flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${item.iconColor}`}>
                  {item.icon}
                </span>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.span
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className={`relative text-sm font-medium flex-1 text-left truncate transition-colors duration-200 ${
                        isDark ? "text-gray-300 group-hover:text-white" : "text-gray-600 group-hover:text-gray-900"
                      }`}
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {item.hasSubmenu && isExpanded && (
                  <ChevronRight className={`relative w-3.5 h-3.5 flex-shrink-0 transition-transform duration-300 ${
                    expandedSubmenu === item.id ? "rotate-90" : ""
                  } ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                )}
              </motion.button>

              {/* Submenu */}
              <AnimatePresence>
                {item.hasSubmenu && expandedSubmenu === item.id && isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden ml-8 mt-0.5 space-y-0.5"
                  >
                    {item.submenu.map((sub, si) => (
                      <motion.button
                        key={si}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: si * 0.05 }}
                        onClick={sub.action}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all duration-200 group relative ${
                          isDark ? "text-gray-400 hover:text-cyan-400" : "text-gray-500 hover:text-cyan-700"
                        }`}
                      >
                        <span className={`absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? "bg-slate-800" : "bg-gray-100"}`} />
                        <span className={`relative flex-shrink-0 ${isDark ? "text-cyan-400" : "text-cyan-600"}`}>{sub.icon}</span>
                        <span className="relative font-medium">{sub.label}</span>
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </nav>

        {/* Bottom: user + logout */}
        <div className={`px-2 pb-3 pt-2 border-t flex-shrink-0 space-y-0.5 ${isDark ? "border-slate-700/50" : "border-gray-200"}`}>

          {/* User profile button */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            title={!isExpanded ? displayName : undefined}
            onClick={() => { navigate("/vault/userprofile"); if (isMobile) collapse(); }}
            className={`w-full flex items-center rounded-xl transition-all duration-200 group relative ${
              isExpanded ? "gap-3 px-3 py-2.5" : "justify-center py-2.5"
            }`}
          >
            <span className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${isDark ? "bg-slate-800" : "bg-gray-100"}`} />

            {/* Avatar */}
            <div className="relative w-[18px] h-[18px] rounded-md bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-[9px] font-bold shadow-sm flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
              {userInitial}
            </div>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="relative flex-1 text-left min-w-0 flex items-center gap-2"
                >
                  <div className="min-w-0 flex-1">
                    {/* Fix 1: use fullName → displayName */}
                    <p className={`text-xs font-semibold truncate ${isDark ? "text-white" : "text-gray-900"}`}>{displayName}</p>
                    <p className={`text-[10px] truncate ${isDark ? "text-gray-400" : "text-gray-500"}`}>{userData.email || ""}</p>
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Logout */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            title={!isExpanded ? "Log Out" : undefined}
            onClick={handleLogout}
            className={`w-full flex items-center rounded-xl transition-all duration-200 group relative ${
              isExpanded ? "gap-3 px-3 py-2.5" : "justify-center py-2.5"
            }`}
          >
            <span className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${isDark ? "bg-red-500/10" : "bg-red-50"}`} />
            <LogOut className={`relative w-[18px] h-[18px] flex-shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 ${isDark ? "text-red-400" : "text-red-500"}`} />
            <AnimatePresence>
              {isExpanded && (
                <motion.span
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className={`relative text-sm font-medium ${isDark ? "text-red-400" : "text-red-500"}`}
                >
                  Log Out
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.aside>

      <style>{`
        .sidebar-scrollbar::-webkit-scrollbar { width: 3px; }
        .sidebar-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .sidebar-scrollbar::-webkit-scrollbar-thumb { background: rgba(6,182,212,0.3); border-radius: 2px; }
        .sidebar-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(6,182,212,0.6); }
      `}</style>
    </>
  );
};

export default HamburgerMenu;