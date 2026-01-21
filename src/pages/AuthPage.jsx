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
} from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:5000/api" : "/api");

const AuthPage = () => {
  const navigate = useNavigate();
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
    // User is already logged in, redirect to createvaults
    navigate('/createvaults', { replace: true });
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

  // Login Handler
  const handleLogin = async () => {
  setError('');
  setSuccess('');
  
  // Validate inputs before making request
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
      
      // Clear OTP fields before navigating
      setOtp(["", "", "", "", "", ""]);
      
      // Navigate to OTP page
      setPage("otp");
    } else if (response.status === 429) {
      console.log('❌ Rate limit exceeded');
      setError(data.message || 'Too many login attempts. Please try again later.');
    } else {
      console.log('❌ Login failed:', data.message);
      setError(data.message || 'Login failed. Please try again.');
    }
  } catch (err) {
    console.error('❌ Network error during login:', err);
    setError('Network error. Please check your connection and try again.');
  } finally {
    setLoading(false);
  }
};

  // Signup Handler
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
      setOtpType("signup"); // Set the type
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

  // Verify OTP Handler
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
      
      // Clear any existing tokens first
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");
      localStorage.removeItem("user");
      
      // Store token based on Remember Me
      if (otpType === "login") {
        if (rememberMe) {
          localStorage.setItem("token", data.token);
        } else {
          sessionStorage.setItem("token", data.token);
        }
      } else {
        // For signup, always use localStorage
        localStorage.setItem("token", data.token);
      }
      
      // Always store user in localStorage
      localStorage.setItem("user", JSON.stringify(data.user));
      
      // Verify storage
      const verifyToken = localStorage.getItem("token") || sessionStorage.getItem("token");
      const verifyUser = localStorage.getItem("user");
      
      
      if (!verifyToken || !verifyUser) {
        console.error("❌ Storage verification failed!");
        setError("Failed to save login data. Please try again.");
        return;
      }
      
      setSuccess(data.message);
      
      // Small delay to ensure state updates and storage is complete
      setTimeout(() => {
        navigate(data.redirectTo || "/createvaults", { replace: true });
      }, 100);
      
    } else {
      console.error("❌ OTP verification failed:", data.message);
      setError(data.message);
    }
  } catch (err) {
    console.error("❌ Network error:", err);
    setError("Network error. Please try again.");
  } finally {
    setLoading(false);
  }
};

  // Verify Forgot Password OTP
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

  // Forgot Password Handler
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

  // Reset Password Handler
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

  // Resend OTP Handler
  const handleResendOtp = async () => {
  setError("");
  setSuccess("");
  setLoading(true);
  try {
    const type = page === "forgotOtp" ? "forgot-password" : otpType; // Use otpType instead
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
      <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div
        className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "1s" }}
      ></div>
      <div
        className="absolute top-1/2 left-1/2 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "0.5s" }}
      ></div>
    </div>
  );

  const Logo = () => (
    <div className="text-center mb-8">
      <div className="inline-flex items-center gap-3 mb-4">
        <div className="bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 p-3 rounded-2xl shadow-lg shadow-blue-500/20">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <div className="text-left">
          <h1 className="text-3xl font-bold text-white">AirVault</h1>
          <p className="text-sm text-slate-400">Secure Storage</p>
        </div>
      </div>
    </div>
  );

  const AlertMessage = () => {
    if (!error && !success) return null;
    return (
      <div
        className={`flex items-center gap-2 p-4 rounded-xl mb-6 ${error ? "bg-red-500/10 border border-red-500/20" : "bg-emerald-500/10 border border-emerald-500/20"}`}
      >
        <AlertCircle
          className={`w-5 h-5 flex-shrink-0 ${error ? "text-red-400" : "text-emerald-400"}`}
        />
        <p className={`text-sm ${error ? "text-red-300" : "text-emerald-300"}`}>
          {error || success}
        </p>
      </div>
    );
  };

  if (page === "login") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
        <BgAnimation />
        <div className="w-full max-w-md relative z-10">
          <Logo />
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
            <p className="text-slate-400">
              Sign in to access your secure vault
            </p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50 shadow-2xl">
            <AlertMessage />
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="max@example.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type={showPass ? "text" : "password"}
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    className="w-full pl-12 pr-12 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter password"
                  />
                  <button
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
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
                    className="w-4 h-4 rounded border-slate-600 bg-slate-700"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="text-sm text-slate-400">Remember me</span>
                </label>
                <button
                  onClick={() => setPage("forgot")}
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  Forgot Password?
                </button>
              </div>
              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 text-white py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-cyan-700 transition-all transform hover:scale-105 shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>
              <p className="text-center text-slate-400 text-sm">
                Don't have an account?
                <button
                  onClick={() => setPage("signup")}
                  className="text-blue-400 hover:text-blue-300 font-semibold ml-1"
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
        <BgAnimation />
        <div className="w-full max-w-md relative z-10">
          <button
            onClick={() => setPage("login")}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Login</span>
          </button>
          <Logo />
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">
              Create Account
            </h2>
            <p className="text-slate-400">Join us to secure your files</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50 shadow-2xl">
            <AlertMessage />
            <div className="space-y-5">
              <div className="flex flex-col items-center mb-4">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center overflow-hidden border-4 border-slate-700">
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
                    className="absolute bottom-0 right-0 bg-gradient-to-r from-blue-500 to-cyan-600 p-2 rounded-full shadow-lg hover:scale-110 transition-transform"
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
                <p className="text-sm text-slate-400 mt-2">
                  Upload Profile Picture
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(e) =>
                      setForm({ ...form, fullName: e.target.value })
                    }
                    className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Max Muster"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="max@example.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type={showPass ? "text" : "password"}
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    className="w-full pl-12 pr-12 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Strong password"
                  />
                  <button
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
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
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={(e) =>
                      setForm({ ...form, confirmPassword: e.target.value })
                    }
                    className="w-full pl-12 pr-12 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Re-enter password"
                  />
                  <button
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
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
                  className="w-4 h-4 mt-1 rounded border-slate-600 bg-slate-700"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                />
                <span className="text-sm text-slate-400">
                  I agree to{" "}
                  <a href="#" className="text-blue-400">
                    Terms & Conditions
                  </a>{" "}
                  and{" "}
                  <a href="#" className="text-blue-400">
                    Privacy Policy
                  </a>
                </span>
              </label>
              <button
                onClick={handleSignup}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 text-white py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-cyan-700 transition-all transform hover:scale-105 shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>
              <p className="text-center text-slate-400 text-sm">
                Already have an account?
                <button
                  onClick={() => setPage("login")}
                  className="text-blue-400 hover:text-blue-300 font-semibold ml-1"
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
        <BgAnimation />
        <div className="w-full max-w-md relative z-10">
          <button
            onClick={() => setPage("login")}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50 shadow-2xl">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full mb-4">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Verify Your Email
              </h2>
              <p className="text-slate-400">
                We've sent a 6-digit code to
                <br />
                <span className="text-white font-medium">
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
                    className="w-12 h-14 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white text-center text-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ))}
              </div>
              <div className="text-center">
                <p className="text-sm text-slate-400 mb-2">
                  Didn't receive the code?
                </p>
                <button
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="text-sm text-blue-400 hover:text-blue-300 font-semibold disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Resend Code"}
                </button>
              </div>
              <button
                onClick={handleVerifyOtp}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 text-white py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-cyan-700 transition-all transform hover:scale-105 shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
        <BgAnimation />
        <div className="w-full max-w-md relative z-10">
          <button
            onClick={() => setPage("login")}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Login</span>
          </button>
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50 shadow-2xl">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full mb-4">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Forgot Password?
              </h2>
              <p className="text-slate-400">
                Enter your email and we'll send you an OTP
              </p>
            </div>
            <AlertMessage />
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="max@example.com"
                  />
                </div>
              </div>
              <button
                onClick={handleForgotPassword}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 text-white py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-cyan-700 transition-all transform hover:scale-105 shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
        <BgAnimation />
        <div className="w-full max-w-md relative z-10">
          <button
            onClick={() => setPage("forgot")}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50 shadow-2xl">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full mb-4">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Verify OTP</h2>
              <p className="text-slate-400">
                We've sent a 6-digit code to
                <br />
                <span className="text-white font-medium">
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
                    className="w-12 h-14 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white text-center text-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ))}
              </div>
              <div className="text-center">
                <p className="text-sm text-slate-400 mb-2">
                  Didn't receive the code?
                </p>
                <button
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="text-sm text-blue-400 hover:text-blue-300 font-semibold disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Resend Code"}
                </button>
              </div>
              <button
                onClick={handleVerifyForgotOtp}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 text-white py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-cyan-700 transition-all transform hover:scale-105 shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
        <BgAnimation />
        <div className="w-full max-w-md relative z-10">
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50 shadow-2xl">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full mb-4">
                <Check className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Reset Password
              </h2>
              <p className="text-slate-400">Enter your new password below</p>
            </div>
            <AlertMessage />
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type={showPass ? "text" : "password"}
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    className="w-full pl-12 pr-12 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="New password"
                  />
                  <button
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
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
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={(e) =>
                      setForm({ ...form, confirmPassword: e.target.value })
                    }
                    className="w-full pl-12 pr-12 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Confirm password"
                  />
                  <button
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
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
