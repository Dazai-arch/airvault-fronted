import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  Mail,
  Lock,
  User,
  ArrowLeft,
  Eye,
  EyeOff,
  Camera,
  Check,
  AlertCircle,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from '../context/ThemeContext';

const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:5000/api" : "/api");

const AuthPage = () => {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const [page, setPage] = useState("login");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [profileImg, setProfileImg] = useState(null);
  const [profileFile, setProfileFile] = useState(null);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [otpType, setOtpType] = useState("login");
  const fileRef = useRef(null);
  const otpRef = useRef([]);

  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token && page === 'login') {
      navigate('/maindashboard', { replace: true });
    }
  }, [page, navigate]);

  const handleOtp = (idx, val) => {
    if (val.length <= 1 && /^\d*$/.test(val)) {
      const newOtp = [...otp];
      newOtp[idx] = val;
      setOtp(newOtp);
      if (val && idx < 5) otpRef.current[idx + 1]?.focus();
    }
  };

  const handleOtpKey = (idx, e) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0)
      otpRef.current[idx - 1]?.focus();
  };

  const handleImg = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setProfileImg(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleLogin = async () => {
    setError('');
    setSuccess('');
    
    if (!form.email || !form.password) {
      setError('Please enter both email and password');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          email: form.email.trim(), 
          password: form.password 
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccess(data.message || 'OTP sent successfully');
        setOtpType("login");
        setOtp(["", "", "", "", "", ""]);
        setPage("otp");
      } else if (response.status === 429) {
        setError(data.message || 'Too many login attempts. Please try again later.');
      } else {
        setError(data.message || 'Login failed. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    setError('');
    setSuccess('');

    if (!agreeTerms) {
      setError('You must agree to the Terms & Conditions and Privacy Policy.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("fullName", form.fullName);
      formData.append("email", form.email);
      formData.append("password", form.password);
      formData.append("confirmPassword", form.confirmPassword);
      if (profileFile) formData.append("profilePicture", profileFile);

      const response = await fetch(`${API_URL}/auth/signup`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess(data.message);
        setOtpType("signup");
        setPage("otp");
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError("");
    setSuccess("");
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }
    setLoading(true);
    try {
      const endpoint = otpType === "signup" 
        ? "/auth/verify-signup-otp" 
        : "/auth/verify-login-otp";
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: form.email, otp: otpCode }),
      });
      const data = await response.json();
      
      if (response.ok) {
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");
        localStorage.removeItem("user");
        
        if (otpType === "login") {
          if (rememberMe) {
            localStorage.setItem("token", data.token);
          } else {
            sessionStorage.setItem("token", data.token);
          }
        } else {
          localStorage.setItem("token", data.token);
        }
        
        localStorage.setItem("user", JSON.stringify(data.user));
        
        const verifyToken = localStorage.getItem("token") || sessionStorage.getItem("token");
        const verifyUser = localStorage.getItem("user");
        
        if (!verifyToken || !verifyUser) {
          setError("Failed to save login data. Please try again.");
          return;
        }
        
        setSuccess(data.message);
        
        setTimeout(() => {
          navigate(data.redirectTo || "/vaults", { replace: true });
        }, 100);
        
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyForgotOtp = async () => {
    setError("");
    setSuccess("");
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/auth/verify-forgot-password-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email, otp: otpCode }),
        },
      );
      const data = await response.json();
      if (response.ok) {
        setSuccess(data.message);
        setResetToken(data.resetToken);
        setPage("reset");
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess(data.message);
        setPage("forgotOtp");
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError("");
    setSuccess("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resetToken,
          newPassword: form.password,
          confirmPassword: form.confirmPassword,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess(data.message);
        setTimeout(() => setPage("login"), 2000);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const type = page === "forgotOtp" ? "forgot-password" : otpType;
      const response = await fetch(`${API_URL}/auth/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, type }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess(data.message);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const BgAnimation = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className={`absolute top-1/4 -left-1/4 w-96 h-96 ${isDark ? 'bg-cyan-500/10' : 'bg-cyan-500/5'} rounded-full blur-3xl animate-pulse`}></div>
      <div
        className={`absolute bottom-1/4 -right-1/4 w-96 h-96 ${isDark ? 'bg-blue-600/10' : 'bg-blue-600/5'} rounded-full blur-3xl animate-pulse`}
        style={{ animationDelay: "1s" }}
      ></div>
      <div
        className={`absolute top-1/2 left-1/2 w-96 h-96 ${isDark ? 'bg-indigo-500/5' : 'bg-indigo-500/3'} rounded-full blur-3xl animate-pulse`}
        style={{ animationDelay: "0.5s" }}
      ></div>
    </div>
  );

  const Logo = () => (
    <div className="text-center mb-8">
      <div className="inline-flex items-center gap-3 mb-4">
        <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-3 rounded-2xl shadow-lg shadow-cyan-500/20">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <div className="text-left">
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>AirVault</h1>
          <p className="text-sm text-cyan-500">Secure Storage</p>
        </div>
      </div>
    </div>
  );

  const ThemeToggle = () => (
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
  );

  const AlertMessage = () => {
    if (!error && !success) return null;
    return (
      <div
        className={`flex items-center gap-2 p-4 rounded-xl mb-6 ${
          error 
            ? isDark 
              ? "bg-red-500/10 border border-red-500/20" 
              : "bg-red-50 border border-red-200"
            : isDark 
              ? "bg-emerald-500/10 border border-emerald-500/20" 
              : "bg-emerald-50 border border-emerald-200"
        }`}
      >
        <AlertCircle
          className={`w-5 h-5 flex-shrink-0 ${
            error 
              ? isDark ? "text-red-400" : "text-red-600" 
              : isDark ? "text-emerald-400" : "text-emerald-600"
          }`}
        />
        <p className={`text-sm ${
          error 
            ? isDark ? "text-red-300" : "text-red-700" 
            : isDark ? "text-emerald-300" : "text-emerald-700"
        }`}>
          {error || success}
        </p>
      </div>
    );
  };

  if (page === "login") {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'} flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-500`}>
        <BgAnimation />
        <ThemeToggle />
        <div className="w-full max-w-md relative z-10">
          <Logo />
          <div className="text-center mb-8">
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>Welcome Back</h2>
            <p className={isDark ? 'text-slate-400' : 'text-gray-600'}>
              Sign in to access your secure vault
            </p>
          </div>
          <div className={`${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/80 border-gray-200'} backdrop-blur-xl rounded-2xl p-8 border shadow-2xl transition-colors duration-500`}>
            <AlertMessage />
            <div className="space-y-6">
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'} mb-2`}>
                  Email Address
                </label>
                <div className="relative">
                  <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    className={`w-full pl-12 pr-4 py-3 ${isDark ? 'bg-slate-700/50 border-slate-600/50 text-white placeholder-slate-400' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors duration-300`}
                    placeholder="max@example.com"
                  />
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'} mb-2`}>
                  Password
                </label>
                <div className="relative">
                  <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
                  <input
                    type={showPass ? "text" : "password"}
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    className={`w-full pl-12 pr-12 py-3 ${isDark ? 'bg-slate-700/50 border-slate-600/50 text-white placeholder-slate-400' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors duration-300`}
                    placeholder="Enter password"
                  />
                  <button
                    onClick={() => setShowPass(!showPass)}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-gray-900'}`}
                  >
                    {showPass ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className={`w-4 h-4 rounded ${isDark ? 'border-slate-600 bg-slate-700' : 'border-gray-300 bg-gray-50'}`}
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Remember me</span>
                </label>
                <button
                  onClick={() => setPage("forgot")}
                  className={`text-sm ${isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-600 hover:text-cyan-700'}`}
                >
                  Forgot Password?
                </button>
              </div>
              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 transition-all transform hover:scale-105 shadow-lg shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>
              <p className={`text-center ${isDark ? 'text-slate-400' : 'text-gray-600'} text-sm`}>
                Don't have an account?
                <button
                  onClick={() => setPage("signup")}
                  className={`${isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-600 hover:text-cyan-700'} font-semibold ml-1`}
                >
                  Sign Up
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (page === "signup") {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'} flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-500`}>
        <BgAnimation />
        <ThemeToggle />
        <div className="w-full max-w-md relative z-10">
          <button
            onClick={() => setPage("login")}
            className={`flex items-center gap-2 ${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} mb-6`}
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Login</span>
          </button>
          <Logo />
          <div className="text-center mb-8">
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
              Create Account
            </h2>
            <p className={isDark ? 'text-slate-400' : 'text-gray-600'}>Join us to secure your files</p>
          </div>
          <div className={`${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/80 border-gray-200'} backdrop-blur-xl rounded-2xl p-8 border shadow-2xl transition-colors duration-500`}>
            <AlertMessage />
            <div className="space-y-5">
              <div className="flex flex-col items-center mb-4">
                <div className="relative">
                  <div className={`w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center overflow-hidden border-4 ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
                    {profileImg ? (
                      <img
                        src={profileImg}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-12 h-12 text-white" />
                    )}
                  </div>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-gradient-to-r from-cyan-500 to-blue-600 p-2 rounded-full shadow-lg hover:scale-110 transition-transform"
                  >
                    <Camera className="w-4 h-4 text-white" />
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImg}
                    className="hidden"
                  />
                </div>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'} mt-2`}>
                  Upload Profile Picture
                </p>
              </div>
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'} mb-2`}>
                  Full Name
                </label>
                <div className="relative">
                  <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(e) =>
                      setForm({ ...form, fullName: e.target.value })
                    }
                    className={`w-full pl-12 pr-4 py-3 ${isDark ? 'bg-slate-700/50 border-slate-600/50 text-white placeholder-slate-400' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors duration-300`}
                    placeholder="Max Muster"
                  />
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'} mb-2`}>
                  Email
                </label>
                <div className="relative">
                  <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    className={`w-full pl-12 pr-4 py-3 ${isDark ? 'bg-slate-700/50 border-slate-600/50 text-white placeholder-slate-400' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors duration-300`}
                    placeholder="max@example.com"
                  />
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'} mb-2`}>
                  Password
                </label>
                <div className="relative">
                  <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
                  <input
                    type={showPass ? "text" : "password"}
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    className={`w-full pl-12 pr-12 py-3 ${isDark ? 'bg-slate-700/50 border-slate-600/50 text-white placeholder-slate-400' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors duration-300`}
                    placeholder="Strong password"
                  />
                  <button
                    onClick={() => setShowPass(!showPass)}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-gray-900'}`}
                  >
                    {showPass ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'} mb-2`}>
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={(e) =>
                      setForm({ ...form, confirmPassword: e.target.value })
                    }
                    className={`w-full pl-12 pr-12 py-3 ${isDark ? 'bg-slate-700/50 border-slate-600/50 text-white placeholder-slate-400' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors duration-300`}
                    placeholder="Re-enter password"
                  />
                  <button
                    onClick={() => setShowConfirm(!showConfirm)}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-gray-900'}`}
                  >
                    {showConfirm ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  className={`w-4 h-4 mt-1 rounded ${isDark ? 'border-slate-600 bg-slate-700' : 'border-gray-300 bg-gray-50'}`}
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                />
                <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                  I agree to{" "}
                  <a href="#" className={isDark ? 'text-cyan-400' : 'text-cyan-600'}>
                    Terms & Conditions
                  </a>{" "}
                  and{" "}
                  <a href="#" className={isDark ? 'text-cyan-400' : 'text-cyan-600'}>
                    Privacy Policy
                  </a>
                </span>
              </label>
              <button
                onClick={handleSignup}
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 transition-all transform hover:scale-105 shadow-lg shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>
              <p className={`text-center ${isDark ? 'text-slate-400' : 'text-gray-600'} text-sm`}>
                Already have an account?
                <button
                  onClick={() => setPage("login")}
                  className={`${isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-600 hover:text-cyan-700'} font-semibold ml-1`}
                >
                  Sign In
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (page === "otp") {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'} flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-500`}>
        <BgAnimation />
        <ThemeToggle />
        <div className="w-full max-w-md relative z-10">
          <button
            onClick={() => setPage("login")}
            className={`flex items-center gap-2 ${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} mb-6`}
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <div className={`${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/80 border-gray-200'} backdrop-blur-xl rounded-2xl p-8 border shadow-2xl transition-colors duration-500`}>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full mb-4">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
                Verify Your Email
              </h2>
              <p className={isDark ? 'text-slate-400' : 'text-gray-600'}>
                We've sent a 6-digit code to
                <br />
                <span className={`${isDark ? 'text-white' : 'text-gray-900'} font-medium`}>
                  {form.email || "your email"}
                </span>
              </p>
            </div>
            <AlertMessage />
            <div className="space-y-6">
              <div className="flex justify-center gap-3">
                {otp.map((val, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpRef.current[idx] = el)}
                    type="text"
                    maxLength="1"
                    value={val}
                    onChange={(e) => handleOtp(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKey(idx, e)}
                    className={`w-12 h-14 ${isDark ? 'bg-slate-700/50 border-slate-600/50 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} border rounded-xl text-center text-xl font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors duration-300`}
                  />
                ))}
              </div>
              <div className="text-center">
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'} mb-2`}>
                  Didn't receive the code?
                </p>
                <button
                  onClick={handleResendOtp}
                  disabled={loading}
                  className={`text-sm ${isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-600 hover:text-cyan-700'} font-semibold disabled:opacity-50`}
                >
                  {loading ? "Sending..." : "Resend Code"}
                </button>
              </div>
              <button
                onClick={handleVerifyOtp}
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 transition-all transform hover:scale-105 shadow-lg shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? "Verifying..." : "Verify & Continue"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (page === "forgot") {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'} flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-500`}>
        <BgAnimation />
        <ThemeToggle />
        <div className="w-full max-w-md relative z-10">
          <button
            onClick={() => setPage("login")}
            className={`flex items-center gap-2 ${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} mb-6`}
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Login</span>
          </button>
          <div className={`${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/80 border-gray-200'} backdrop-blur-xl rounded-2xl p-8 border shadow-2xl transition-colors duration-500`}>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full mb-4">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
                Forgot Password?
              </h2>
              <p className={isDark ? 'text-slate-400' : 'text-gray-600'}>
                Enter your email and we'll send you an OTP
              </p>
            </div>
            <AlertMessage />
            <div className="space-y-6">
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'} mb-2`}>
                  Email Address
                </label>
                <div className="relative">
                  <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    className={`w-full pl-12 pr-4 py-3 ${isDark ? 'bg-slate-700/50 border-slate-600/50 text-white placeholder-slate-400' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors duration-300`}
                    placeholder="max@example.com"
                  />
                </div>
              </div>
              <button
                onClick={handleForgotPassword}
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 transition-all transform hover:scale-105 shadow-lg shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? "Sending OTP..." : "Send OTP"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (page === "forgotOtp") {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'} flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-500`}>
        <BgAnimation />
        <ThemeToggle />
        <div className="w-full max-w-md relative z-10">
          <button
            onClick={() => setPage("forgot")}
            className={`flex items-center gap-2 ${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} mb-6`}
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <div className={`${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/80 border-gray-200'} backdrop-blur-xl rounded-2xl p-8 border shadow-2xl transition-colors duration-500`}>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full mb-4">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>Verify OTP</h2>
              <p className={isDark ? 'text-slate-400' : 'text-gray-600'}>
                We've sent a 6-digit code to
                <br />
                <span className={`${isDark ? 'text-white' : 'text-gray-900'} font-medium`}>
                  {form.email || "your email"}
                </span>
              </p>
            </div>
            <AlertMessage />
            <div className="space-y-6">
              <div className="flex justify-center gap-3">
                {otp.map((val, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpRef.current[idx] = el)}
                    type="text"
                    maxLength="1"
                    value={val}
                    onChange={(e) => handleOtp(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKey(idx, e)}
                    className={`w-12 h-14 ${isDark ? 'bg-slate-700/50 border-slate-600/50 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} border rounded-xl text-center text-xl font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors duration-300`}
                  />
                ))}
              </div>
              <div className="text-center">
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'} mb-2`}>
                  Didn't receive the code?
                </p>
                <button
                  onClick={handleResendOtp}
                  disabled={loading}
                  className={`text-sm ${isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-600 hover:text-cyan-700'} font-semibold disabled:opacity-50`}
                >
                  {loading ? "Sending..." : "Resend Code"}
                </button>
              </div>
              <button
                onClick={handleVerifyForgotOtp}
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 transition-all transform hover:scale-105 shadow-lg shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? "Verifying..." : "Verify & Continue"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (page === "reset") {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'} flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-500`}>
        <BgAnimation />
        <ThemeToggle />
        <div className="w-full max-w-md relative z-10">
          <div className={`${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white/80 border-gray-200'} backdrop-blur-xl rounded-2xl p-8 border shadow-2xl transition-colors duration-500`}>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full mb-4">
                <Check className="w-8 h-8 text-white" />
              </div>
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
                Reset Password
              </h2>
              <p className={isDark ? 'text-slate-400' : 'text-gray-600'}>Enter your new password below</p>
            </div>
            <AlertMessage />
            <div className="space-y-6">
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'} mb-2`}>
                  New Password
                </label>
                <div className="relative">
                  <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
                  <input
                    type={showPass ? "text" : "password"}
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    className={`w-full pl-12 pr-12 py-3 ${isDark ? 'bg-slate-700/50 border-slate-600/50 text-white placeholder-slate-400' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors duration-300`}
                    placeholder="New password"
                  />
                  <button
                    onClick={() => setShowPass(!showPass)}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-gray-900'}`}
                  >
                    {showPass ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'} mb-2`}>
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={(e) =>
                      setForm({ ...form, confirmPassword: e.target.value })
                    }
                    className={`w-full pl-12 pr-12 py-3 ${isDark ? 'bg-slate-700/50 border-slate-600/50 text-white placeholder-slate-400' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'} border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors duration-300`}
                    placeholder="Confirm password"
                  />
                  <button
                    onClick={() => setShowConfirm(!showConfirm)}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-gray-900'}`}
                  >
                    {showConfirm ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
              <button
                onClick={handleResetPassword}
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all transform hover:scale-105 shadow-lg shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? "Resetting Password..." : "Reset Password"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
};

export default AuthPage;