import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Lock, Mail, User, Calendar, Camera, Edit3, X,
  AlertTriangle, Trash2, CheckCircle, TrendingUp, Database,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useVault } from "../context/VaultContext";
import { vaultApi } from "../services/vaultApi";
import VaultTopBar from "../components/layout/VaultTopBar";
import HamburgerMenu from "../components/layout/HamburgerMenu";
import Toast from "../components/layout/Toast";
import { useToast } from "../hooks/useToast";

const emptyProfile = { fullName: "", email: "", dob: "", vaultId: "", profileImage: "" };

const normalizeUser = (rawUser, activeVault) => ({
  fullName:     rawUser?.fullName || rawUser?.name || "",
  email:        rawUser?.email || "",
  dob:          rawUser?.dob || rawUser?.dateOfBirth || "",
  vaultId:      rawUser?.vaultId || rawUser?.vault?.id || activeVault?.id || "",
  profileImage: rawUser?.profileImage || rawUser?.profilePicture || "",
});

/* ─── SectionIcon — matches every other page ────────────────────────────── */
const SectionIcon = ({ gradient, Icon }) => (
  <div className={`w-9 h-9 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}>
    <Icon className="w-4 h-4 text-white" />
  </div>
);

/* ══════════════════════════════════════════════════════════════════════════ */
const UserProfile = () => {
  const { isDark } = useTheme();
  const { activeVault } = useVault();
  const { toast, showSuccess, showError, hideToast } = useToast();
  const fileRef = useRef(null);

  const [profile,         setProfile]         = useState(emptyProfile);
  const [form,            setForm]             = useState(emptyProfile);
  const [isEditing,       setIsEditing]        = useState(false);
  const [isSaving,        setIsSaving]         = useState(false);
  const [errors,          setErrors]           = useState({});
  const [imagePreview,    setImagePreview]     = useState("");
  const [imageFile,       setImageFile]        = useState(null);
  const [showDeleteModal, setShowDeleteModal]  = useState(false);
  const [deleteInput,     setDeleteInput]      = useState("");
  const [sidebarExpanded, setSidebarExpanded]  = useState(false);
  const [mousePosition,   setMousePosition]    = useState({ x: 0, y: 0 });

  const SIDEBAR_COLLAPSED = 60;
  const SIDEBAR_EXPANDED  = 220;
  const sidebarW = sidebarExpanded ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED;

  useEffect(() => {
    const h = (e) => setSidebarExpanded(e.detail.expanded);
    window.addEventListener("sidebarToggle", h);
    return () => window.removeEventListener("sidebarToggle", h);
  }, []);

  useEffect(() => {
    const h = (e) => setMousePosition({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", h);
    return () => window.removeEventListener("mousemove", h);
  }, []);

  const userInitial = useMemo(() => (profile.fullName?.trim()?.charAt(0) || "U").toUpperCase(), [profile.fullName]);

  useEffect(() => {
    const localUser = JSON.parse(localStorage.getItem("user") || "{}") || {};
    const normalized = normalizeUser(localUser, activeVault);
    setProfile(normalized);
    setForm(normalized);
  }, [activeVault]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await vaultApi.getUserProfile();
        if (!data) return;
        const apiUser = data.user || data.profile || data;
        const normalized = normalizeUser(apiUser, activeVault);
        setProfile(normalized);
        setForm(normalized);
        localStorage.setItem("user", JSON.stringify({ ...apiUser, ...normalized, name: normalized.fullName, fullName: normalized.fullName }));
      } catch (error) {
        showError(error.message || "Failed to load profile");
      }
    };
    fetchProfile();
  }, [activeVault, showError]);

  const API_BASE = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";
  const rawImage = imagePreview || profile.profileImage;
  const displayedImage = rawImage
    ? (rawImage.startsWith("http") || rawImage.startsWith("blob") ? rawImage : `${API_BASE}${rawImage}`)
    : null;

  const handleEditToggle  = () => { setIsEditing(true); setForm(profile); setErrors({}); };
  const handleCancel      = () => { setIsEditing(false); setForm(profile); setErrors({}); setImagePreview(""); setImageFile(null); };
  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateForm = () => {
    const nextErrors = {};
    if (!form.fullName.trim()) nextErrors.fullName = "Full name is required";
    if (form.dob && new Date(form.dob) > new Date()) nextErrors.dob = "DOB cannot be in the future";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) { showError("Please fix the highlighted fields"); return; }
    setIsSaving(true);
    const updatedLocal = { ...profile, fullName: form.fullName.trim(), dob: form.dob, profileImage: imagePreview || profile.profileImage };
    try {
      let apiUser = null;
      if (typeof vaultApi.updateUserProfile === "function") {
        let payload = { fullName: updatedLocal.fullName, dob: updatedLocal.dob };
        if (imageFile) {
          const formData = new FormData();
          formData.append("fullName", updatedLocal.fullName);
          if (updatedLocal.dob) formData.append("dob", updatedLocal.dob);
          formData.append("profilePicture", imageFile);
          payload = formData;
        }
        const response = await vaultApi.updateUserProfile(payload);
        apiUser = response?.user || response?.profile || response?.data?.user || null;
      }
      const mergedProfile = apiUser ? normalizeUser(apiUser, activeVault) : updatedLocal;
      setProfile(mergedProfile);
      setForm(mergedProfile);
      const existing = JSON.parse(localStorage.getItem("user") || "{}") || {};
      localStorage.setItem("user", JSON.stringify({
        ...existing,
        ...mergedProfile,
        name: mergedProfile.fullName,
        fullName: mergedProfile.fullName,
        profileImage: mergedProfile.profileImage,
        profilePicture: mergedProfile.profileImage,
      }));
      window.dispatchEvent(new Event("userProfileUpdated"));
      setIsEditing(false); setImagePreview(""); setImageFile(null);
      showSuccess("Profile updated successfully");
      showError(error.message || "Profile update failed");
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleDeleteAccount = async () => {
    try {
      if (typeof vaultApi.deleteAccount === "function") await vaultApi.deleteAccount();
      localStorage.removeItem("token"); sessionStorage.removeItem("token"); localStorage.removeItem("user");
      window.location.href = "/auth";
    } catch (error) {
      showError(error.message || "Account deletion failed");
    }
  };

  const card = `rounded-2xl border backdrop-blur-xl shadow-xl transition-all duration-300 ${
    isDark ? "bg-slate-800/50 border-slate-700/50" : "bg-white/80 border-gray-200"
  }`;

  const inputCls = `w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${
    isDark
      ? "bg-slate-800/60 border-slate-700/50 text-white placeholder:text-gray-500 focus:border-cyan-500/50 focus:ring-cyan-500/20"
      : "bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-cyan-400 focus:ring-cyan-500/20"
  }`;

  const stats = [
    { label: "Vault ID",     value: profile.vaultId || "—", Icon: Database,    color: "from-cyan-500 to-blue-600"     },
    { label: "Member Since", value: profile.dob      || "—", Icon: Calendar,    color: "from-violet-500 to-purple-600" },
    { label: "Encryption",   value: "AES-256",               Icon: Shield,      color: "from-emerald-500 to-teal-600"  },
    { label: "Status",       value: "Verified",              Icon: CheckCircle, color: "from-blue-600 to-indigo-600"   },
  ];

  const securityItems = [
    {
      title:  "Password Protection",
      detail: "Your vault credentials are encrypted and cannot be changed here. Contact your vault admin.",
      Icon:   Lock,
      color:  "from-blue-600 to-indigo-600",
    },
    {
      title:  "Multi-factor Authentication",
      detail: "MFA is enforced at the vault level by your administrator. Status: Active.",
      Icon:   Shield,
      color:  "from-violet-500 to-purple-600",
    },
    {
      title:  "Session Policy",
      detail: "Session limits and timeout rules are defined by your vault configuration and cannot be modified.",
      Icon:   AlertTriangle,
      color:  "from-amber-500 to-orange-500",
    },
    {
      title:  "Vault Security Status",
      detail: "All systems secure. Encryption, access control, and audit logging are active and managed by your vault.",
      Icon:   CheckCircle,
      color:  "from-emerald-500 to-teal-600",
    },
  ];

  return (
    <div className={`h-screen w-full overflow-hidden transition-colors duration-500 ${
      isDark ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" : "bg-gradient-to-br from-gray-50 via-white to-gray-100"
    }`}>

      {/* Ambient blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-1/4 -left-1/4 w-96 h-96 ${isDark ? "bg-cyan-500/5" : "bg-cyan-500/3"} rounded-full blur-3xl animate-pulse`} />
        <div className={`absolute bottom-1/4 -right-1/4 w-96 h-96 ${isDark ? "bg-blue-600/5" : "bg-blue-600/3"} rounded-full blur-3xl animate-pulse`} style={{ animationDelay: "1s" }} />
        <div className={`absolute top-1/2 left-1/2 w-96 h-96 ${isDark ? "bg-indigo-500/3" : "bg-indigo-500/2"} rounded-full blur-3xl animate-pulse`} style={{ animationDelay: "0.5s" }} />
      </div>

      {/* Cursor glow */}
      <div
        className="hidden lg:block fixed w-80 h-80 rounded-full pointer-events-none z-0 mix-blend-screen"
        style={{
          background: isDark
            ? "radial-gradient(circle, rgba(56,189,248,0.07) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(56,189,248,0.05) 0%, transparent 70%)",
          left: mousePosition.x - 160,
          top:  mousePosition.y - 160,
          transition: "all 0.4s ease-out",
        }}
      />

      <VaultTopBar />
      <HamburgerMenu />
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} duration={toast.duration} />}

      <motion.main
        initial={false}
        animate={{ marginLeft: sidebarW }}
        transition={{ type: "spring", damping: 24, stiffness: 280 }}
        className="relative z-10 flex h-[calc(100vh-4rem)] mt-16"
      >
        <div className="flex-1 overflow-y-auto vault-scrollbar">
          <div className="max-w-[1600px] mx-auto px-3 sm:px-5 lg:px-6 py-5 sm:py-8 space-y-5 sm:space-y-6">

            {/* ── Page heading ── */}
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/30 hover:rotate-6 hover:scale-110 transition-all duration-500 cursor-default flex-shrink-0">
                  <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>
                    User Profile
                  </h1>
                  <p className={`text-xs sm:text-sm mt-0.5 ${isDark ? "text-gray-400" : "text-gray-600"}`}>Manage your vault identity and security</p>
                </div>
              </div>
            </motion.div>

            {/* ── Stat cards ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {stats.map(({ label, value, Icon, color }, i) => (
                <motion.div key={label}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.4 }} whileHover={{ y: -4 }}
                  className={`group relative ${card} p-4 sm:p-5 overflow-hidden cursor-default`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                  <div className="relative">
                    <div className="flex items-start justify-between mb-2 sm:mb-3">
                      <div className={`inline-flex bg-gradient-to-br ${color} w-9 h-9 sm:w-11 sm:h-11 rounded-xl items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <TrendingUp className={`w-3 h-3 sm:w-4 sm:h-4 opacity-30 ${isDark ? "text-gray-400" : "text-gray-500"}`} />
                    </div>
                    <p className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mb-0.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>{label}</p>
                    <p className={`text-sm sm:text-base font-bold truncate bg-gradient-to-r ${color} bg-clip-text text-transparent`}>{value}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* ══ GRID ══ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">

              {/* ═══ LEFT — profile form ═══ */}
              <div className="lg:col-span-2 space-y-4 sm:space-y-5">

                {/* Profile details card */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={card}>
                  <div className="h-[2px] bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 rounded-t-2xl" />
                  <div className="p-5 sm:p-6">
                    <div className="flex items-center justify-between mb-5">
                      <h2 className={`text-sm sm:text-base font-bold flex items-center gap-2.5 ${isDark ? "text-white" : "text-gray-900"}`}>
                        <SectionIcon gradient="from-cyan-500 to-blue-600" Icon={User} />
                        Profile Details
                      </h2>
                      {!isEditing ? (
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          onClick={handleEditToggle}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-semibold transition-all duration-200 ${
                            isDark ? "bg-slate-700/50 border-slate-600/50 text-gray-300 hover:border-cyan-500/40 hover:text-white" : "bg-gray-100 border-gray-200 text-gray-600 hover:border-cyan-400"
                          }`}>
                          <Edit3 className="w-3.5 h-3.5" /> Edit Profile
                        </motion.button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={handleCancel} disabled={isSaving}
                            className={`px-4 py-2 rounded-xl border text-xs font-semibold transition-all ${
                              isDark ? "bg-slate-700/50 border-slate-600/50 text-gray-300 hover:text-white" : "bg-gray-100 border-gray-200 text-gray-600"
                            }`}>
                            Cancel
                          </motion.button>
                          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={handleSave} disabled={isSaving}
                            className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all duration-300 disabled:opacity-60">
                            <CheckCircle className="w-3.5 h-3.5" />
                            {isSaving ? "Saving…" : "Save Changes"}
                          </motion.button>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Full Name */}
                      <div>
                        <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Full Name</label>
                        <div className="relative">
                          <User className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                          <input type="text" value={form.fullName}
                            onChange={(e) => handleFieldChange("fullName", e.target.value)}
                            disabled={!isEditing}
                            placeholder="Enter full name"
                            className={`${inputCls} pl-10 ${!isEditing ? "opacity-60 cursor-not-allowed" : ""}`}
                          />
                        </div>
                        {errors.fullName && <p className="text-xs text-red-400 mt-1.5">{errors.fullName}</p>}
                      </div>

                      {/* Email */}
                      <div>
                        <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Email ID</label>
                        <div className="relative">
                          <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                          <Lock className={`absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isDark ? "text-gray-600" : "text-gray-400"}`} />
                          <input type="email" value={form.email} readOnly
                            className={`${inputCls} pl-10 pr-9 opacity-60 cursor-not-allowed`}
                          />
                        </div>
                      </div>

                      {/* DOB */}
                      <div>
                        <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Date of Birth</label>
                        <div className="relative">
                          <Calendar className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                          <input type="date" value={form.dob || ""}
                            onChange={(e) => handleFieldChange("dob", e.target.value)}
                            disabled={!isEditing}
                            className={`${inputCls} pl-10 ${!isEditing ? "opacity-60 cursor-not-allowed" : ""}`}
                          />
                        </div>
                        {errors.dob && <p className="text-xs text-red-400 mt-1.5">{errors.dob}</p>}
                      </div>

                      {/* Vault ID */}
                      <div>
                        <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Vault ID</label>
                        <div className="relative">
                          <Shield className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                          <Lock className={`absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${isDark ? "text-gray-600" : "text-gray-400"}`} />
                          <input type="text" value={form.vaultId || "Not assigned"} readOnly
                            className={`${inputCls} pl-10 pr-9 opacity-60 cursor-not-allowed font-mono`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Save confirmation hint */}
                    <AnimatePresence>
                      {isEditing && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                          className={`mt-4 flex items-center gap-3 p-3.5 rounded-xl border ${
                            isDark ? "bg-emerald-500/10 border-emerald-500/20" : "bg-emerald-50 border-emerald-200"
                          }`}>
                          <CheckCircle className={`w-4 h-4 flex-shrink-0 ${isDark ? "text-emerald-400" : "text-emerald-600"}`} />
                          <div>
                            <p className={`text-xs font-semibold ${isDark ? "text-emerald-300" : "text-emerald-700"}`}>Secure profile update</p>
                            <p className={`text-xs mt-0.5 ${isDark ? "text-emerald-300/80" : "text-emerald-600"}`}>Changes are encrypted and synced with your vault identity.</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>

                {/* Security controls */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className={card}>
                  <div className="h-[2px] bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 rounded-t-2xl" />
                  <div className="p-5 sm:p-6">
                    <div className="flex items-start justify-between mb-2">
                      <h2 className={`text-sm sm:text-base font-bold flex items-center gap-2.5 ${isDark ? "text-white" : "text-gray-900"}`}>
                        <SectionIcon gradient="from-red-500 to-orange-600" Icon={Shield} />
                        Security Controls
                      </h2>
                    </div>

                    {/* Locked notice */}
                    <div className={`mb-4 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border text-xs ${
                      isDark ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-amber-50 border-amber-200 text-amber-700"
                    }`}>
                      <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                      These settings are managed at the vault level and cannot be changed from your profile.
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {securityItems.map((item) => (
                        <div key={item.title} className={`group relative flex items-start gap-3 p-4 rounded-xl border transition-all duration-300 hover:-translate-y-1 overflow-hidden ${
                          isDark
                            ? "bg-slate-900/50 border-slate-700/50 hover:border-slate-500/50 hover:shadow-lg hover:shadow-black/20"
                            : "bg-gray-50 border-gray-200 hover:border-gray-300 hover:shadow-lg"
                        }`}>
                          {/* Subtle gradient shimmer on hover */}
                          <div className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-500 pointer-events-none`} />
                          <div className={`w-9 h-9 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 mt-0.5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                            <item.Icon className="w-4 h-4 text-white" />
                          </div>
                          <div className="min-w-0 relative">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>{item.title}</p>
                              <Lock className={`w-3 h-3 flex-shrink-0 ${isDark ? "text-gray-600" : "text-gray-400"}`} />
                            </div>
                            <p className={`text-xs leading-relaxed ${isDark ? "text-gray-400" : "text-gray-500"}`}>{item.detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Delete account */}
                    <div className={`mt-3 flex items-start gap-3 p-4 rounded-xl border ${
                      isDark ? "bg-red-500/10 border-red-500/20" : "bg-red-50 border-red-200"
                    }`}>
                      <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 mt-0.5">
                        <AlertTriangle className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-semibold ${isDark ? "text-red-300" : "text-red-700"}`}>Delete Account</p>
                        <p className={`text-xs mt-0.5 ${isDark ? "text-red-300/70" : "text-red-600"}`}>Permanently remove access to all vaults and assets.</p>
                        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                          onClick={() => setShowDeleteModal(true)}
                          className="mt-3 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all duration-300 bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50">
                          <Trash2 className="w-3.5 h-3.5" /> Delete Account
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* ═══ RIGHT — avatar card ═══ */}
              <div className="space-y-4 sm:space-y-5">
                <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12 }} className={card}>
                  <div className="h-[2px] bg-gradient-to-r from-violet-500 via-purple-600 to-indigo-600 rounded-t-2xl" />
                  <div className="p-5 flex flex-col items-center text-center">
                    <h3 className={`text-sm font-bold mb-5 flex items-center gap-2.5 self-start ${isDark ? "text-white" : "text-gray-900"}`}>
                      <SectionIcon gradient="from-violet-500 to-purple-600" Icon={Camera} />
                      Vault Identity
                    </h3>

                    <motion.div whileHover={{ scale: 1.03 }} transition={{ duration: 0.2 }} className="relative mb-4">
                      <div className={`absolute -inset-3 rounded-3xl blur-2xl opacity-30 ${isDark ? "bg-cyan-500/40" : "bg-cyan-300/40"}`} />
                      <div className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl p-1.5 border ${
                        isDark ? "bg-slate-700/50 border-slate-600/50" : "bg-white border-gray-200"
                      }`}>
                        <div className={`w-full h-full rounded-xl flex items-center justify-center overflow-hidden ring-2 ${
                          isDark ? "bg-gradient-to-br from-cyan-500/70 to-blue-600/70 ring-cyan-500/20" : "bg-gradient-to-br from-cyan-400 to-blue-500 ring-cyan-300/60"
                        }`}>
                          {displayedImage ? (
                            <img src={displayedImage} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-3xl font-bold text-white">{userInitial}</span>
                          )}
                        </div>
                        {isEditing && (
                          <button onClick={() => fileRef.current?.click()}
                            className={`absolute -bottom-2 -right-2 w-9 h-9 rounded-full border flex items-center justify-center shadow-lg transition-all ${
                              isDark ? "bg-slate-800 border-slate-600 text-gray-300 hover:border-cyan-500/50 hover:text-white" : "bg-white border-gray-200 text-gray-600 hover:border-cyan-400"
                            }`}>
                            <Camera className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </motion.div>

                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />

                    <p className={`text-base font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{profile.fullName || "Secure User"}</p>
                    <p className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>{profile.email || "user@airvault.com"}</p>

                    {/* Verified badge */}
                    <div className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${
                      isDark ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-600"
                    }`}>
                      <Shield className="w-3 h-3" /> Verified Vault User
                    </div>
                  </div>
                </motion.div>

                {/* Quick security status */}
                <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.17 }} className={card}>
                  <div className="h-[2px] bg-gradient-to-r from-emerald-500 to-teal-600 rounded-t-2xl" />
                  <div className="p-5">
                    <h3 className={`text-sm font-bold mb-4 flex items-center gap-2.5 ${isDark ? "text-white" : "text-gray-900"}`}>
                      <SectionIcon gradient="from-emerald-500 to-teal-600" Icon={Shield} />
                      Security Score
                    </h3>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs font-semibold ${isDark ? "text-gray-300" : "text-gray-700"}`}>Overall Rating</span>
                      <span className={`text-xs font-bold ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>98%</span>
                    </div>
                    <div className={`h-2 rounded-full overflow-hidden ${isDark ? "bg-slate-700" : "bg-gray-200"}`}>
                      <motion.div initial={{ width: 0 }} animate={{ width: "98%" }}
                        transition={{ duration: 1.5, ease: "easeOut", delay: 0.6 }}
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" />
                    </div>
                    <p className={`text-[10px] mt-2 ${isDark ? "text-gray-500" : "text-gray-400"}`}>Excellent — all encryption active</p>

                    <div className="mt-3 space-y-2">
                      {[
                        { label: "Encryption", value: "AES-256",  status: "secure" },
                        { label: "2FA",         value: "Enabled",  status: "secure" },
                        { label: "Sessions",    value: "1 active", status: "info"   },
                      ].map(({ label, value, status }) => (
                        <div key={label} className={`flex items-center justify-between p-2.5 rounded-xl border ${
                          isDark ? "bg-slate-900/50 border-slate-700/50" : "bg-gray-50 border-gray-200"
                        }`}>
                          <p className={`text-xs font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}>{label}</p>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            status === "secure"
                              ? isDark ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-emerald-50 text-emerald-600 border-emerald-200"
                              : isDark ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" : "bg-cyan-50 text-cyan-600 border-cyan-200"
                          }`}>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </motion.main>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={`rounded-2xl border shadow-2xl w-full max-w-md overflow-hidden ${
                isDark ? "bg-slate-800/90 border-slate-700/50" : "bg-white border-gray-200"
              }`}
            >
              <div className="h-[2px] bg-gradient-to-r from-red-500 to-orange-500" />
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className={`text-base font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Delete Account?</h2>
                    <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>This action cannot be undone</p>
                  </div>
                  <button onClick={() => setShowDeleteModal(false)} className={`ml-auto p-2 rounded-xl ${isDark ? "hover:bg-slate-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}>
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className={`text-sm mb-5 leading-relaxed ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                  Permanently removes access to all vaults and assets. Type <span className={`font-semibold font-mono ${isDark ? "text-white" : "text-gray-900"}`}>"delete"</span> to confirm.
                </p>

                <div className="mb-4">
                  <label className={`block text-[10px] font-bold uppercase tracking-widest mb-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}>Confirm deletion</label>
                  <input type="text" value={deleteInput} onChange={(e) => setDeleteInput(e.target.value)} placeholder="delete"
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40 transition-all ${
                      isDark ? "bg-slate-900/50 border-slate-700/50 text-white placeholder:text-gray-500" : "bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400"
                    }`}
                  />
                </div>

                <div className="flex gap-3">
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => setShowDeleteModal(false)}
                    className={`flex-1 py-2.5 px-4 rounded-xl border text-sm font-semibold transition-all ${
                      isDark ? "bg-slate-700/50 border-slate-600/50 text-gray-300 hover:text-white" : "bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200"
                    }`}>
                    Cancel
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={handleDeleteAccount}
                    disabled={deleteInput.trim().toLowerCase() !== "delete"}
                    className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold bg-gradient-to-r from-red-500 to-orange-600 text-white shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed">
                    Confirm Deletion
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }
        .animate-shimmer { animation: shimmer 2.5s infinite; }
        .vault-scrollbar::-webkit-scrollbar { width: 4px; }
        .vault-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .vault-scrollbar::-webkit-scrollbar-thumb { background: rgba(6,182,212,0.4); border-radius: 2px; }
        .vault-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(6,182,212,0.65); }
      `}</style>
    </div>
  );
};

export default UserProfile;