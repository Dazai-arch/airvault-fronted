require("dotenv").config();
process.env.OPENSSL_CONF = '/dev/null';
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const cors = require("cors");
const session = require("express-session");
const { MongoStore } = require("connect-mongo");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);
const isProduction = process.env.NODE_ENV === "production";
const { r2Client, connectR2 } = require("./config/r2");
const { isLocal } = require("./config/r2");

// ====================================
// APP INITIALIZATION
// ====================================
const app = express();
const PORT = process.env.PORT || 5000;
app.set("trust proxy", 1);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (process.env.NODE_ENV !== 'production') {
        if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
          return callback(null, true);
        }
      }

      const allowedOrigins = [
        process.env.FRONTEND_URL,
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:5174", 
        "http://localhost:5175",
        "http://localhost:3001",
      ].filter(Boolean); 

      const isAllowed = allowedOrigins.indexOf(origin) !== -1 || 
                        (origin && origin.endsWith('.vercel.app'));

      if (isAllowed) {
        callback(null, true);
      } else {
        console.log('CORS blocked origin:', origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["set-cookie"],
    optionsSuccessStatus: 200,
  }),
);

app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    console.log('Preflight request - responding with 204');
    return res.status(204).end();
  }
  
  next();
});

// ====================================
// MIDDLEWARE
// ====================================
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));
app.use("/assets", express.static(path.join(__dirname, "src/assets")));
app.use("/uploads/r2mock", express.static(path.join(__dirname, "uploads/r2mock")));

// ====================================
// DATABASE CONNECTION
// ====================================
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB Connected");
    return connectR2();
  })
  .catch((err) => {
    console.error("MongoDB Connection Error:", err);
    process.exit(1);
  });

// Session Configuration
app.use(
  session({
    secret:
      process.env.SESSION_SECRET || "airvault-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({
      mongoUrl: process.env.MONGODB_URI,
      touchAfter: 0,
      ttl: 10 * 60, 
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/",
    },
  }),
);

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: {
    message: "Too many login attempts, please try again after 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      message:
        "Too many login attempts from this IP, please try again after 15 minutes",
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
    });
  },
});

// ====================================
// FILE UPLOAD CONFIGURATION
// ====================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/profiles";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase(),
    );
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Only image files are allowed"));
  },
});

// ====================================
// DATABASE MODELS
// ====================================

const userSchema = new mongoose.Schema({
  fullName:       { type: String, required: true, trim: true },
  email:          { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:       { type: String, required: true },
  profilePicture: { type: String, default: null },
  dob:            { type: String, default: null },   // ← ADD THIS
  isVerified:     { type: Boolean, default: false },
  vaultCreated:   { type: Boolean, default: false },
  createdAt:      { type: Date, default: Date.now },
  lastLogin:      { type: Date },
});

const User = mongoose.model("User", userSchema);

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  type: {
    type: String,
    enum: ["signup", "login", "forgot-password"],
    required: true,
  },
  createdAt: { type: Date, default: Date.now, expires: 600 },
});

const OTP = mongoose.model("OTP", otpSchema);

const tempSignupSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  password: { type: String, required: true },
  profilePicture: { type: String, default: null },
  createdAt: { type: Date, default: Date.now, expires: 600 }, // Auto-delete after 10 minutes
});

const TempSignup = mongoose.model("TempSignup", tempSignupSchema);


const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  email: { type: String, required: true },
  action: { type: String, required: true },
  ipAddress: String,
  userAgent: String,
  device: String,
  browser: String,
  os: String,
  location: String,
  success: { type: Boolean, default: true },
  timestamp: { type: Date, default: Date.now },
});

const AuditLog = mongoose.model("AuditLog", auditLogSchema);


// ====================================
// EMAIL CONFIGURATION
// ====================================
const sendOTPEmail = async (email, otp, userName) => {
  try {
    const { data, error } = await resend.emails.send({
      from: "AirVault Security <noreply@airvault.me>",
      to: email,
      subject: "Your AirVault Verification Code",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: 'Segoe UI', sans-serif; background-color: #0f172a; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 40px auto; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3); }
              .header { background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); padding: 40px 30px; text-align: center; }
              .logo { width: 80px; height: 80px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 15px; }
              .logo-emoji { font-size: 56px; }
              .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
              .content { padding: 40px 30px; color: #cbd5e1; }
              .greeting { font-size: 18px; margin-bottom: 20px; color: #e2e8f0; }
              .message { font-size: 15px; line-height: 1.6; margin-bottom: 30px; color: #94a3b8; }
              .otp-box { background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); border: 2px solid #3b82f6; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0; }
              .otp-label { font-size: 14px; color: #93c5fd; margin-bottom: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
              .otp-code { font-size: 48px; font-weight: 700; color: white; letter-spacing: 8px; margin: 10px 0; font-family: 'Courier New', monospace; }
              .expiry { font-size: 13px; color: #cbd5e1; margin-top: 15px; }
              .warning { background: rgba(59, 130, 246, 0.1); border-left: 4px solid #3b82f6; padding: 15px; margin: 25px 0; border-radius: 8px; font-size: 14px; color: #93c5fd; }
              .footer { background: #0f172a; padding: 30px; text-align: center; border-top: 1px solid #1e293b; }
              .footer p { color: #64748b; font-size: 13px; margin: 5px 0; }
              .footer-link { color: #3b82f6; text-decoration: none; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">
                  <div class="logo-emoji">🔒</div>
                </div>
                <h1>AirVault</h1>
              </div>
              <div class="content">
                <div class="greeting">Hi there,</div>
                <div class="message">You recently tried to log in from a new device, browser, or location. In order to complete your login, please use the verification code below.</div>
                <div class="otp-box">
                  <div class="otp-label">Your Verification Code</div>
                  <div class="otp-code">${otp}</div>
                  <div class="expiry">⏱ This code expires in 10 minutes</div>
                </div>
                <div class="message">Enter this code in the verification screen to continue accessing your secure vault.</div>
                <div class="warning"><strong>⚠️ Security Notice:</strong> If this wasn't you, your account may be compromised. Please secure your account immediately.</div>
              </div>
              <div class="footer">
                <p>This is an automated message from AirVault Security System.</p>
                <p>© 2026 AirVault. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("❌ Resend API Error:", error);
      throw new Error(error.message || "Failed to send email");
    }
    return data;
  } catch (error) {
    console.error("Email sending failed:", error);
    throw error;
  }
};

// ====================================
// UTILITY FUNCTIONS
// ====================================

const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (password.length < minLength)
    return {
      valid: false,
      message: "Password must be at least 8 characters long",
    };
  if (!hasUpperCase)
    return {
      valid: false,
      message: "Password must contain at least one uppercase letter",
    };
  if (!hasLowerCase)
    return {
      valid: false,
      message: "Password must contain at least one lowercase letter",
    };
  if (!hasNumber)
    return {
      valid: false,
      message: "Password must contain at least one number",
    };
  if (!hasSpecialChar)
    return {
      valid: false,
      message: "Password must contain at least one special character",
    };

  return { valid: true };
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const getDeviceInfo = (req) => {
  const userAgent = req.headers["user-agent"] || "";
  let device = "Unknown",
    browser = "Unknown",
    os = "Unknown";

  if (userAgent.includes("Windows")) os = "Windows";
  else if (userAgent.includes("Mac")) os = "MacOS";
  else if (userAgent.includes("Linux")) os = "Linux";
  else if (userAgent.includes("Android")) os = "Android";
  else if (userAgent.includes("iOS")) os = "iOS";

  if (userAgent.includes("Chrome")) browser = "Chrome";
  else if (userAgent.includes("Firefox")) browser = "Firefox";
  else if (userAgent.includes("Safari")) browser = "Safari";
  else if (userAgent.includes("Edge")) browser = "Edge";

  if (userAgent.includes("Mobile")) device = "Mobile";
  else if (userAgent.includes("Tablet")) device = "Tablet";
  else device = "Desktop";

  return { device, browser, os };
};

const createAuditLog = async (userId, email, action, req, success = true) => {
  const { device, browser, os } = getDeviceInfo(req);
  const ipAddress = req.ip || req.connection.remoteAddress;
  await AuditLog.create({
    userId,
    email,
    action,
    ipAddress,
    userAgent: req.headers["user-agent"],
    device,
    browser,
    os,
    success,
    timestamp: new Date(),
  });
};

// ====================================
// AUTHENTICATION MIDDLEWARE
// ====================================
const authenticateToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access token required" });

  jwt.verify(
    token,
    process.env.JWT_SECRET || "your-secret-key",
    (err, user) => {
      if (err)
        return res.status(403).json({ message: "Invalid or expired token" });
      req.user = user;
      next();
    },
  );
};


// ====================================
// API ROUTES
// ====================================

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "AirVault API is running",
    timestamp: new Date().toISOString(),
  });
});


app.get('/api/auth/validate-token', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ valid: false, message: 'User not found' });
    }
    
    res.json({ 
      valid: true, 
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        profilePicture: user.profilePicture,
        vaultCreated: user.vaultCreated
      }
    });
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json({ 
      valid: false, 
      message: 'Server error during token validation' 
    });
  }
});
// SIGNUP
app.post(
  "/api/auth/signup",
  authLimiter,
  upload.single("profilePicture"),
  async (req, res) => {
    try {
      const { fullName, email, password, confirmPassword } = req.body;

      if (!fullName || !email || !password || !confirmPassword) {
        return res.status(400).json({ message: "All fields are required" });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        return res.status(400).json({ message: passwordValidation.message });
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res
          .status(400)
          .json({ message: "User already exists with this email" });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const otp = generateOTP();

      // Delete any existing temp signup data and OTP for this email
      await TempSignup.deleteMany({ email });
      await OTP.deleteMany({ email, type: "signup" });

      // Save OTP first
      await OTP.create({ email, otp, type: "signup" });

      // Try to send email
      try {
        await sendOTPEmail(email, otp, fullName);
      } catch (emailError) {
        console.error("❌ Email sending failed:", emailError.message);
        // Delete the OTP since email failed
        await OTP.deleteMany({ email, type: "signup" });

        return res.status(503).json({
          message:
            "Unable to send verification email. Please check your email configuration or try again later.",
          error: "EMAIL_SERVICE_UNAVAILABLE",
        });
      }

      // Store temp signup data in database instead of session
      await TempSignup.create({
        fullName,
        email,
        password: hashedPassword,
        profilePicture: req.file
          ? `/uploads/profiles/${req.file.filename}`
          : null,
      });

      res.status(200).json({
        message: "OTP sent to your email",
        email,
        requiresOTP: true,
      });
    } catch (error) {
      console.error("❌ Signup Error:", error);
      res.status(500).json({
        message: "Server error during signup",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  },
);
// VERIFY SIGNUP OTP
// VERIFY SIGNUP OTP
app.post("/api/auth/verify-signup-otp", authLimiter, async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    // Verify OTP
    const otpRecord = await OTP.findOne({ email, otp, type: "signup" });

    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Get temp signup data from database
    const tempUserData = await TempSignup.findOne({ email });
    
    if (!tempUserData) {
      return res.status(400).json({ 
        message: "Signup session expired. Please signup again" 
      });
    }

    // Create the user
    const newUser = await User.create({
      fullName: tempUserData.fullName,
      email: tempUserData.email,
      password: tempUserData.password,
      profilePicture: tempUserData.profilePicture,
      isVerified: true,
      lastLogin: new Date(),
    });

    // Clean up temp data and OTP
    await OTP.deleteOne({ _id: otpRecord._id });
    await TempSignup.deleteOne({ _id: tempUserData._id });

    // Create audit log
    await createAuditLog(newUser._id, email, "SIGNUP_SUCCESS", req);

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" },
    );

    // Set session data
    req.session.userId = newUser._id;
    req.session.email = newUser.email;

    res.status(201).json({
      message: "Account created successfully",
      token,
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        profilePicture: newUser.profilePicture,
        vaultCreated: newUser.vaultCreated,
      },
      redirectTo: "/maindashboard",
    });
  } catch (error) {
    console.error("OTP Verification Error:", error);
    res.status(500).json({ 
      message: "Server error during verification",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// LOGIN
app.post("/api/auth/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      await createAuditLog(null, email, "LOGIN_FAILED", req, false);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      await createAuditLog(user._id, email, "LOGIN_FAILED", req, false);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const otp = generateOTP();

    // Save OTP first
    await OTP.create({ email, otp, type: "login" });

    // Try to send email
    try {
      await sendOTPEmail(email, otp, user.fullName);
    } catch (emailError) {
      console.error("❌ Email sending failed:", emailError.message);
      // Delete the OTP since email failed
      await OTP.deleteMany({ email, type: "login" });

      return res.status(503).json({
        message:
          "Unable to send verification email. Please check your email configuration or try again later.",
        error: "EMAIL_SERVICE_UNAVAILABLE",
      });
    }

    req.session.tempLoginUserId = user._id.toString();

    res.status(200).json({
      message: "OTP sent to your email",
      email,
      requiresOTP: true,
    });
  } catch (error) {
    console.error("❌ Login Error:", error);
    res.status(500).json({
      message: "Server error during login",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// VERIFY LOGIN OTP
app.post("/api/auth/verify-login-otp", authLimiter, async (req, res) => {
  try {
    const { email, otp } = req.body;
    const otpRecord = await OTP.findOne({ email, otp, type: "login" });

    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.lastLogin = new Date();
    await user.save();

    await OTP.deleteOne({ _id: otpRecord._id });
    delete req.session.tempLoginUserId;
    await createAuditLog(user._id, email, "LOGIN_SUCCESS", req);

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" },
    );

    req.session.userId = user._id;
    req.session.email = user.email;

    const redirectTo = "/maindashboard";

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        profilePicture: user.profilePicture,
        vaultCreated: user.vaultCreated,
      },
      redirectTo,
    });
  } catch (error) {
    console.error("OTP Verification Error:", error);
    res.status(500).json({ message: "Server error during verification" });
  }
});

// FORGOT PASSWORD
app.post("/api/auth/forgot-password", authLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(200)
        .json({ message: "If the email exists, an OTP has been sent" });
    }

    const otp = generateOTP();

    // Save OTP first
    await OTP.create({ email, otp, type: "forgot-password" });

    // Try to send email
    try {
      await sendOTPEmail(email, otp, user.fullName);
    } catch (emailError) {
      console.error("❌ Email sending failed:", emailError.message);
      // Delete the OTP since email failed
      await OTP.deleteMany({ email, type: "forgot-password" });

      return res.status(503).json({
        message:
          "Unable to send verification email. Please check your email configuration or try again later.",
        error: "EMAIL_SERVICE_UNAVAILABLE",
      });
    }

    res.status(200).json({
      message: "OTP sent to your email",
      email,
      requiresOTP: true,
    });
  } catch (error) {
    console.error("❌ Forgot Password Error:", error);
    res.status(500).json({
      message: "Server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});
// VERIFY FORGOT PASSWORD OTP
app.post(
  "/api/auth/verify-forgot-password-otp",
  authLimiter,
  async (req, res) => {
    try {
      const { email, otp } = req.body;
      const otpRecord = await OTP.findOne({
        email,
        otp,
        type: "forgot-password",
      });

      if (!otpRecord) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }

      const resetToken = jwt.sign(
        { email },
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: "15m" },
      );
      await OTP.deleteOne({ _id: otpRecord._id });

      res
        .status(200)
        .json({
          message: "OTP verified successfully",
          resetToken,
          canResetPassword: true,
        });
    } catch (error) {
      console.error("OTP Verification Error:", error);
      res.status(500).json({ message: "Server error during verification" });
    }
  },
);

// RESET PASSWORD
app.post("/api/auth/reset-password", authLimiter, async (req, res) => {
  try {
    const { resetToken, newPassword, confirmPassword } = req.body;

    if (!resetToken || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({ message: passwordValidation.message });
    }

    let decoded;
    try {
      decoded = jwt.verify(
        resetToken,
        process.env.JWT_SECRET || "your-secret-key",
      );
    } catch (err) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    const user = await User.findOne({ email: decoded.email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    await user.save();

    await createAuditLog(user._id, user.email, "PASSWORD_RESET", req);

    res
      .status(200)
      .json({ message: "Password reset successfully", redirectTo: "/login" });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: "Server error during password reset" });
  }
});

// RESEND OTP
// RESEND OTP
app.post("/api/auth/resend-otp", authLimiter, async (req, res) => {
  try {
    const { email, type } = req.body;

    if (!email || !type) {
      return res.status(400).json({ message: "Email and type are required" });
    }

    // For signup, check if temp data exists
    if (type === "signup") {
      const tempData = await TempSignup.findOne({ email });
      if (!tempData) {
        return res.status(400).json({ 
          message: "Signup session expired. Please signup again" 
        });
      }
    } else {
      // For login/forgot-password, check if user exists
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
    }

    // Delete old OTP and create new one
    await OTP.deleteMany({ email, type });

    const otp = generateOTP();
    await OTP.create({ email, otp, type });

    // Get user name for email
    let userName = "User";
    if (type === "signup") {
      const tempData = await TempSignup.findOne({ email });
      userName = tempData?.fullName || "User";
    } else {
      const user = await User.findOne({ email });
      userName = user?.fullName || "User";
    }

    await sendOTPEmail(email, otp, userName);

    res.status(200).json({ message: "New OTP sent to your email" });
  } catch (error) {
    console.error("Resend OTP Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET USER PROFILE
app.get("/api/user/profile", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    // Get the user's most recently accessed vault
    const vault = await Vault.findOne({
      userId: req.user.userId,
      isActive: true,
    }).sort({ lastAccessed: -1 });

    res.status(200).json({
      user: {
        id:             user._id,
        fullName:       user.fullName,
        email:          user.email,
        dob:            user.dob || null,
        profileImage:   user.profilePicture || null,
        profilePicture: user.profilePicture || null,
        vaultId:        vault?._id || null,
        vaultName:      vault?.name || null,
        vaultCreated:   user.vaultCreated,
        isVerified:     user.isVerified,
        createdAt:      user.createdAt,
        lastLogin:      user.lastLogin,
      },
    });
  } catch (error) {
    console.error("Get Profile Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.put(
  "/api/user/profile",
  authenticateToken,
  upload.single("profilePicture"),
  async (req, res) => {
    try {
      const { fullName, dob } = req.body;

      const user = await User.findById(req.user.userId);
      if (!user) return res.status(404).json({ message: "User not found" });

      if (fullName?.trim()) user.fullName = fullName.trim();
      if (dob !== undefined) user.dob = dob || null;

      if (req.file) {
        // Remove old profile picture if exists
        if (user.profilePicture) {
          const oldPath = path.join(__dirname, user.profilePicture);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
        user.profilePicture = `/uploads/profiles/${req.file.filename}`;
      }

      await user.save();

      // Get vault info for response
      const vault = await Vault.findOne({
        userId: req.user.userId,
        isActive: true,
      }).sort({ lastAccessed: -1 });

      await createAuditLog(req.user.userId, user.email, "PROFILE_UPDATED", req);

      res.status(200).json({
        message: "Profile updated successfully",
        user: {
          id:             user._id,
          fullName:       user.fullName,
          email:          user.email,
          dob:            user.dob || null,
          profileImage:   user.profilePicture || null,
          profilePicture: user.profilePicture || null,
          vaultId:        vault?._id || null,
          vaultName:      vault?.name || null,
          vaultCreated:   user.vaultCreated,
        },
      });
    } catch (error) {
      console.error("Update Profile Error:", error);
      res.status(500).json({ message: "Server error during profile update" });
    }
  }
);

app.delete("/api/user/account", authenticateToken, async (req, res) => {
  try {
    // Soft delete all vaults
    await Vault.updateMany(
      { userId: req.user.userId },
      { isActive: false }
    );

    // Delete the user
    await User.findByIdAndDelete(req.user.userId);

    await createAuditLog(req.user.userId, req.user.email, "ACCOUNT_DELETED", req);

    res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Delete Account Error:", error);
    res.status(500).json({ message: "Server error during account deletion" });
  }
});

// GET AUDIT LOGS
app.get("/api/user/audit-logs", authenticateToken, async (req, res) => {
  try {
    const logs = await AuditLog.find({ userId: req.user.userId })
      .sort({ timestamp: -1 })
      .limit(50);
    res.status(200).json({ logs });
  } catch (error) {
    console.error("Get Audit Logs Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ====================================
// VAULT MODELS
// ====================================

// Add these schemas after your existing schemas (after AuditLog)

const vaultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  hasPassword: { type: Boolean, default: false },
  passwordHash: { type: String, default: null }, // Hashed master password
  passwordHint: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  lastAccessed: { type: Date, default: Date.now },
  tags: [{ type: String }],
  fileCount: { type: Number, default: 0 },
  totalSize: { type: Number, default: 0 }, // in bytes
  isActive: { type: Boolean, default: true },
});

const Vault = mongoose.model("Vault", vaultSchema);

const zkSaltSchema = new mongoose.Schema({
  vaultId: { type: mongoose.Schema.Types.ObjectId, ref: "Vault", required: true, unique: true },
  userId:  { type: mongoose.Schema.Types.ObjectId, ref: "User",  required: true },
  // Base64-encoded PBKDF2 salt — NOT the encryption key, just the salt.
  // Knowing the salt alone is useless without the user's passphrase.
  saltB64: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
const ZKSalt = mongoose.model("ZKSalt", zkSaltSchema);

// ====================================
// VAULT ROUTES
// ====================================

// CREATE VAULT
app.post("/api/vaults/create", authenticateToken, async (req, res) => {
  try {
    const { name, description, hasPassword, password, passwordHint } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Vault name is required" });
    }

    // Check if vault name already exists for this user
    const existingVault = await Vault.findOne({
      userId: req.user.userId,
      name: name.trim(),
      isActive: true,
    });

    if (existingVault) {
      return res
        .status(400)
        .json({ message: "A vault with this name already exists" });
    }

    // If password is provided, validate and hash it
    let passwordHash = null;
    if (hasPassword && password) {
      if (password.length < 6) {
        return res
          .status(400)
          .json({
            message: "Vault password must be at least 6 characters long",
          });
      }
      passwordHash = await bcrypt.hash(password, 12);
    }

    // Create the vault
    const newVault = await Vault.create({
      userId: req.user.userId,
      name: name.trim(),
      description: description || "",
      hasPassword: hasPassword || false,
      passwordHash,
      passwordHint: passwordHint || null,
    });

    // Update user's vaultCreated status
    await User.findByIdAndUpdate(req.user.userId, { vaultCreated: true });

    // Create audit log
    await createAuditLog(req.user.userId, req.user.email, "VAULT_CREATED", req);

    res.status(201).json({
      message: "Vault created successfully",
      vault: {
        id: newVault._id,
        name: newVault.name,
        description: newVault.description,
        hasPassword: newVault.hasPassword,
        passwordHint: newVault.passwordHint,
        createdAt: newVault.createdAt,
        fileCount: newVault.fileCount,
        totalSize: newVault.totalSize,
      },
    });
  } catch (error) {
    console.error("Create Vault Error:", error);
    res.status(500).json({ message: "Server error during vault creation" });
  }
});

// GET ALL VAULTS FOR USER
app.get("/api/vaults", authenticateToken, async (req, res) => {
  try {
    const vaults = await Vault.find({
      userId: req.user.userId,
      isActive: true,
    }).sort({ lastAccessed: -1 });

    const vaultsData = vaults.map((vault) => ({
      id: vault._id,
      name: vault.name,
      description: vault.description,
      hasPassword: vault.hasPassword,
      passwordHint: vault.passwordHint,
      createdAt: vault.createdAt,
      lastAccessed: vault.lastAccessed,
      fileCount: vault.fileCount,
      totalSize: vault.totalSize,
    }));

    res.status(200).json({ vaults: vaultsData });
  } catch (error) {
    console.error("Get Vaults Error:", error);
    res.status(500).json({ message: "Server error fetching vaults" });
  }
});

// GET SINGLE VAULT
app.get("/api/vaults/:vaultId", authenticateToken, async (req, res) => {
  try {
    const { vaultId } = req.params;

    const vault = await Vault.findOne({
      _id: vaultId,
      userId: req.user.userId,
      isActive: true,
    });

    if (!vault) {
      return res.status(404).json({ message: "Vault not found" });
    }

    res.status(200).json({
      vault: {
        id: vault._id,
        name: vault.name,
        description: vault.description,
        hasPassword: vault.hasPassword,
        passwordHint: vault.passwordHint,
        createdAt: vault.createdAt,
        lastAccessed: vault.lastAccessed,
        fileCount: vault.fileCount,
        totalSize: vault.totalSize,
      },
    });
  } catch (error) {
    console.error("Get Vault Error:", error);
    res.status(500).json({ message: "Server error fetching vault" });
  }
});

// VERIFY VAULT PASSWORD
app.post(
  "/api/vaults/:vaultId/verify-password",
  authenticateToken,
  async (req, res) => {
    try {
      const { vaultId } = req.params;
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({ message: "Password is required" });
      }

      const vault = await Vault.findOne({
        _id: vaultId,
        userId: req.user.userId,
        isActive: true,
      });

      if (!vault) {
        return res.status(404).json({ message: "Vault not found" });
      }

      if (!vault.hasPassword) {
        return res
          .status(400)
          .json({ message: "This vault does not have a password" });
      }

      const isPasswordValid = await bcrypt.compare(
        password,
        vault.passwordHash,
      );

      if (!isPasswordValid) {
        await createAuditLog(
          req.user.userId,
          req.user.email,
          "VAULT_ACCESS_DENIED",
          req,
          false,
        );
        return res.status(401).json({ message: "Incorrect vault password" });
      }

      // Update last accessed time
      vault.lastAccessed = new Date();
      await vault.save();

      await createAuditLog(
        req.user.userId,
        req.user.email,
        "VAULT_ACCESSED",
        req,
      );

      res.status(200).json({
        message: "Password verified successfully",
        verified: true,
      });
    } catch (error) {
      console.error("Verify Vault Password Error:", error);
      res
        .status(500)
        .json({ message: "Server error during password verification" });
    }
  },
);

// UPDATE VAULT
app.put("/api/vaults/:vaultId", authenticateToken, async (req, res) => {
  try {
    const { vaultId } = req.params;
    const { name, description } = req.body;

    const vault = await Vault.findOne({
      _id: vaultId,
      userId: req.user.userId,
      isActive: true,
    });

    if (!vault) {
      return res.status(404).json({ message: "Vault not found" });
    }

    if (name) vault.name = name.trim();
    if (description !== undefined) vault.description = description;

    await vault.save();

    await createAuditLog(req.user.userId, req.user.email, "VAULT_UPDATED", req);

    res.status(200).json({
      message: "Vault updated successfully",
      vault: {
        id: vault._id,
        name: vault.name,
        description: vault.description,
        hasPassword: vault.hasPassword,
      },
    });
  } catch (error) {
    console.error("Update Vault Error:", error);
    res.status(500).json({ message: "Server error during vault update" });
  }
});

app.delete("/api/vaults/:vaultId", authenticateToken, async (req, res) => {
  try {
    const { vaultId } = req.params;

    const vault = await Vault.findOne({
      _id: vaultId,
      userId: req.user.userId,
      isActive: true,
    });

    if (!vault) {
      return res.status(404).json({ message: "Vault not found" });
    }

    vault.isActive = false;
    await vault.save();

    await createAuditLog(req.user.userId, req.user.email, "VAULT_DELETED", req);

    res.status(200).json({ message: "Vault deleted successfully" });
  } catch (error) {
    console.error("Delete Vault Error:", error);
    res.status(500).json({ message: "Server error during vault deletion" });
  }
});

// UPDATE VAULT STATS 
app.patch("/api/vaults/:vaultId/stats", authenticateToken, async (req, res) => {
  try {
    const { vaultId } = req.params;
    const { fileCount, totalSize } = req.body;

    const vault = await Vault.findOne({
      _id: vaultId,
      userId: req.user.userId,
      isActive: true,
    });

    if (!vault) {
      return res.status(404).json({ message: "Vault not found" });
    }

    if (fileCount !== undefined) vault.fileCount = fileCount;
    if (totalSize !== undefined) vault.totalSize = totalSize;
    vault.lastAccessed = new Date();

    await vault.save();

    res.status(200).json({ message: "Vault stats updated successfully" });
  } catch (error) {
    console.error("Update Vault Stats Error:", error);
    res.status(500).json({ message: "Server error updating vault stats" });
  }
});

// ====================================
// FILE & FOLDER MODELS
// ====================================

const fileSchemaZK = new mongoose.Schema({
  vaultId:      { type: mongoose.Schema.Types.ObjectId, ref: "Vault", required: true },
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: "User",  required: true },
  originalName: { type: String, required: true },
  storedKey:    { type: String, required: true },
  mimeType:     { type: String, required: true },
  size:         { type: Number, required: true },
  folderId:     { type: String, default: "root" },
  category:     { type: String, default: "General" },
  tags:         [{ type: String }],
  description:  { type: String, default: "" },
  label:        { type: String, default: "" },
  uploadedAt:   { type: Date, default: Date.now },
  isDeleted:    { type: Boolean, default: false },
  isEncrypted:  { type: Boolean, default: false },
});

const VaultFile = mongoose.model("VaultFile", fileSchemaZK);

const folderSchema = new mongoose.Schema({
  vaultId:    { type: mongoose.Schema.Types.ObjectId, ref: "Vault", required: true },
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: "User",  required: true },
  folderId:   { type: String, required: true },          // ← remove unique:true (causes issues across vaults)
  name:       { type: String, required: true, trim: true, maxlength: 100 },
  parentId:   { type: String, default: null },
  locked:     { type: Boolean, default: false },          // ← was missing
  restricted: { type: Boolean, default: false },          // ← was missing
  permission: { type: String, enum: ["read","edit"], default: "edit" }, // ← was missing
  createdAt:  { type: Date, default: Date.now },
  isDeleted:  { type: Boolean, default: false },
});
folderSchema.index({ vaultId: 1, folderId: 1 }, { unique: true });
const VaultFolder = mongoose.model("VaultFolder", folderSchema);

// ====================================
// FILE UPLOAD CONFIG (for vault files)
// ====================================

const vaultFileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = isLocal
      ? `uploads/r2mock/vaults/${req.user.userId}/${req.params.vaultId}`
      : "uploads/temp";
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname)}`;
    cb(null, unique);
  },
});

const vaultUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(__dirname, "uploads/r2mock/vaults",
        req.user.userId, req.params.vaultId);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
  }),
  limits: { fileSize: 110 * 1024 * 1024 }, // 110 MB max (encrypted files are slightly larger)
});

// ====================================
// VAULT STORAGE LIMIT
// ====================================

const VAULT_STORAGE_LIMIT = 500 * 1024 * 1024; // 500MB

async function getVaultStorageUsed(vaultId) {
  const result = await VaultFile.aggregate([
    { $match: { vaultId: new mongoose.Types.ObjectId(vaultId), isDeleted: false } },
    { $group: { _id: null, total: { $sum: "$size" } } },
  ]);
  return result[0]?.total || 0;
}

// ====================================
// FILE ROUTES
// ====================================

app.post("/api/vaults/:vaultId/zk-salt", authenticateToken, async (req, res) => {
  try {
    const { vaultId } = req.params;
    const { saltB64 }  = req.body;

    if (!saltB64) return res.status(400).json({ message: "saltB64 is required" });

    // Ensure the vault belongs to this user
    const vault = await Vault.findOne({ _id: vaultId, userId: req.user.userId, isActive: true });
    if (!vault) return res.status(404).json({ message: "Vault not found" });

    // Upsert — idempotent; same salt for the lifetime of the vault password
    await ZKSalt.findOneAndUpdate(
      { vaultId },
      { vaultId, userId: req.user.userId, saltB64, updatedAt: new Date() },
      { upsert: true, new: true }
    );

    res.status(200).json({ message: "ZK salt stored" });
  } catch (err) {
    console.error("ZK Salt Store Error:", err);
    res.status(500).json({ message: "Server error storing ZK salt" });
  }
});

// GET ZK SALT  (client needs this to re-derive the key on subsequent unlocks)
app.get("/api/vaults/:vaultId/zk-salt", authenticateToken, async (req, res) => {
  try {
    const { vaultId } = req.params;

    const vault = await Vault.findOne({ _id: vaultId, userId: req.user.userId, isActive: true });
    if (!vault) return res.status(404).json({ message: "Vault not found" });

    const record = await ZKSalt.findOne({ vaultId });
    if (!record) return res.status(404).json({ message: "No ZK salt found for this vault" });

    res.status(200).json({ saltB64: record.saltB64 });
  } catch (err) {
    console.error("ZK Salt Fetch Error:", err);
    res.status(500).json({ message: "Server error fetching ZK salt" });
  }
});

// GET ALL FILES IN VAULT
app.get("/api/vaults/:vaultId/files", authenticateToken, async (req, res) => {
  try {
    const { vaultId } = req.params;
    const { folderId } = req.query;

    const vault = await Vault.findOne({ _id: vaultId, userId: req.user.userId, isActive: true });
    if (!vault) return res.status(404).json({ message: "Vault not found" });

    const query = { vaultId, userId: req.user.userId, isDeleted: false };
    if (folderId) query.folderId = folderId;

    const files = await VaultFile.find(query).sort({ uploadedAt: -1 });

    res.status(200).json({
      files: files.map((f) => ({
        id: f._id,
        name: f.originalName,
        size: f.size,
        mimeType: f.mimeType,
        folderId: f.folderId,
        category: f.category,
        tags: f.tags,
        description: f.description,
        label: f.label,
        uploadedAt: f.uploadedAt,
        storedKey: f.storedKey,
      })),
    });
  } catch (error) {
    console.error("Get Files Error:", error);
    res.status(500).json({ message: "Server error fetching files" });
  }
});

// DELETE FILE
app.delete("/api/vaults/:vaultId/files/:fileId", authenticateToken, async (req, res) => {
  try {
    const { vaultId, fileId } = req.params;

    const file = await VaultFile.findOne({
      _id: fileId, vaultId, userId: req.user.userId, isDeleted: false,
    });
    if (!file) return res.status(404).json({ message: "File not found" });

    // Delete from storage
    if (isLocal) {
      const filePath = path.join(__dirname, "uploads/r2mock", file.storedKey);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } else {
      const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
      await r2Client.send(new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: file.storedKey,
      })).catch(e => console.warn("R2 delete warning:", e.message));
    }

    // Hard delete the DB record — actually removes it from MongoDB
    await VaultFile.findByIdAndDelete(fileId);

    // Update vault counters
    await Vault.findByIdAndUpdate(vaultId, {
      $inc: { fileCount: -1, totalSize: -file.size },
    });

        // After file is deleted:
await createVaultAuditLog(
  vaultId,
  req.user.userId,
  req.user.email,
  "File Deleted",
  req,
  { id: fileId, name: file.originalName },
  "success"
);

    res.status(200).json({ message: "File deleted successfully" });

  } catch (error) {
    console.error("Delete File Error:", error);
    res.status(500).json({ message: "Server error deleting file" });
  }
});

// GET VAULT STORAGE INFO
app.get("/api/vaults/:vaultId/storage", authenticateToken, async (req, res) => {
  try {
    const { vaultId } = req.params;

    const vault = await Vault.findOne({ _id: vaultId, userId: req.user.userId, isActive: true });
    if (!vault) return res.status(404).json({ message: "Vault not found" });

    const storageUsed = await getVaultStorageUsed(vaultId);

    res.status(200).json({
      storageUsed,
      storageLimit: VAULT_STORAGE_LIMIT,
      storageRemaining: VAULT_STORAGE_LIMIT - storageUsed,
      percentUsed: ((storageUsed / VAULT_STORAGE_LIMIT) * 100).toFixed(1),
    });
  } catch (error) {
    console.error("Get Storage Error:", error);
    res.status(500).json({ message: "Server error fetching storage info" });
  }
});



// ── Schemas ─────────────────────────────────────────────────

// Add isEncrypted + views + downloads + shared to your existing fileSchema:
const fileSchema = new mongoose.Schema({
  vaultId:      { type: mongoose.Schema.Types.ObjectId, ref: "Vault", required: true },
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: "User",  required: true },
  originalName: { type: String, required: true },
  storedKey:    { type: String, required: true },
  mimeType:     { type: String, required: true },
  size:         { type: Number, required: true },
  folderId:     { type: String, default: "root" },
  category:     { type: String, default: "General" },
  tags:         [{ type: String }],
  description:  { type: String, default: "" },
  label:        { type: String, default: "" },
  uploadedAt:   { type: Date,   default: Date.now },
  isDeleted:    { type: Boolean, default: false },
  // ▼ ZK + analytics fields
  isEncrypted:  { type: Boolean, default: false },
  shared:       { type: Boolean, default: false },
  views:        { type: Number,  default: 0 },
  downloads:    { type: Number,  default: 0 },
});
// const VaultFile = mongoose.model("VaultFile", fileSchema);  // already declared in your server.js


// ZKSalt schema (already in server_zk_additions.js, shown here for reference):
// const ZKSalt = mongoose.model("ZKSalt", zkSaltSchema);


// ════════════════════════════════════════════════════════════
// 1. GET /api/vaults/:vaultId/files
//    Returns all non-deleted files in a vault.
//    Optional ?folderId=xxx to filter by folder.
// ════════════════════════════════════════════════════════════
app.get("/api/vaults/:vaultId/files", authenticateToken, async (req, res) => {
  try {
    const { vaultId } = req.params;
    const { folderId } = req.query;

    const vault = await Vault.findOne({ _id: vaultId, userId: req.user.userId, isActive: true });
    if (!vault) return res.status(404).json({ message: "Vault not found" });

    const query = { vaultId, userId: req.user.userId, isDeleted: false };
    if (folderId) query.folderId = folderId;

    const files = await VaultFile.find(query).sort({ uploadedAt: -1 });

    res.status(200).json({
      files: files.map(f => ({
        id:          f._id,
        folderId:    f.folderId,
        name:        f.originalName,
        mimeType:    f.mimeType,
        size:        f.size,
        uploadedAt:  f.uploadedAt,
        isEncrypted: f.isEncrypted,
        category:    f.category,
        tags:        f.tags,
        description: f.description,
        label:       f.label,
        shared:      f.shared,
        views:       f.views,
        downloads:   f.downloads,
      })),
      total: files.length,
    });
  } catch (error) {
    console.error("Get Files Error:", error);
    res.status(500).json({ message: "Server error fetching files" });
  }
});


// ════════════════════════════════════════════════════════════
// 2. GET /api/vaults/:vaultId/storage
//    Returns real-time storage usage for the vault.
// ════════════════════════════════════════════════════════════
app.get("/api/vaults/:vaultId/storage", authenticateToken, async (req, res) => {
  try {
    const { vaultId } = req.params;

    const vault = await Vault.findOne({ _id: vaultId, userId: req.user.userId, isActive: true });
    if (!vault) return res.status(404).json({ message: "Vault not found" });

    const storageUsed = await getVaultStorageUsed(vaultId);
    const storageLimit = vault.storageLimitBytes || VAULT_STORAGE_LIMIT;

    res.status(200).json({
      storageUsed,
      storageLimit,
      storageRemaining: Math.max(0, storageLimit - storageUsed),
      percentUsed: Math.min(100, Math.round((storageUsed / storageLimit) * 100)),
    });
  } catch (error) {
    console.error("Storage Error:", error);
    res.status(500).json({ message: "Server error fetching storage info" });
  }
});


// ════════════════════════════════════════════════════════════
// 3. POST /api/vaults/:vaultId/files/upload   (ZK-aware)
//    Accepts encrypted or plain file + metadata.
// ════════════════════════════════════════════════════════════
app.post(
  "/api/vaults/:vaultId/files/upload",
  authenticateToken,
  vaultUpload.single("file"),
  async (req, res) => {
    try {
      const { vaultId } = req.params;
      const { category, tags, description, label, folderId,
              originalName, originalMimeType, zeroKnowledge } = req.body;

      if (!req.file) return res.status(400).json({ message: "No file provided" });

      const vault = await Vault.findOne({ _id: vaultId, userId: req.user.userId, isActive: true });
      if (!vault) return res.status(404).json({ message: "Vault not found" });

      const storageUsed = await getVaultStorageUsed(vaultId);
      if (storageUsed + req.file.size > (vault.storageLimitBytes || VAULT_STORAGE_LIMIT)) {
        fs.unlinkSync(req.file.path);
        const remaining = (vault.storageLimitBytes || VAULT_STORAGE_LIMIT) - storageUsed;
        return res.status(400).json({
          message: `Storage limit exceeded. ${(remaining / 1024 / 1024).toFixed(1)} MB remaining.`,
        });
      }

      const isZK = zeroKnowledge === "true" || zeroKnowledge === true;
      let storedKey;

      if (isLocal) {
        storedKey = `vaults/${req.user.userId}/${vaultId}/${req.file.filename}`;
      } else {
        const { PutObjectCommand } = require("@aws-sdk/client-s3");
        storedKey = `vaults/${req.user.userId}/${vaultId}/${req.file.filename}`;
        const fileBuffer = fs.readFileSync(req.file.path);
        await r2Client.send(new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: storedKey,
          Body: fileBuffer,
          ContentType: "application/octet-stream",
        }));
        fs.unlinkSync(req.file.path);
      }

      const fileRecord = await VaultFile.create({
        vaultId,
        userId:       req.user.userId,
        originalName: isZK ? (originalName || req.file.originalname.replace(/\.enc$/, "")) : req.file.originalname,
        storedKey,
        mimeType:     isZK ? (originalMimeType || "application/octet-stream") : req.file.mimetype,
        size:         req.file.size,
        folderId:     folderId || "root",
        category:     category || "General",
        tags:         tags ? JSON.parse(tags) : [],
        description:  description || "",
        label:        label || "",
        isEncrypted:  isZK,
      });

      // At the end of your upload route, after fileRecord is created:
await createVaultAuditLog(
  vaultId,
  req.user.userId,
  req.user.email,
  "File Uploaded",
  req,
  { id: fileRecord._id, name: fileRecord.originalName },
  "success"
);

      await Vault.findByIdAndUpdate(vaultId, {
        $inc: { fileCount: 1, totalSize: req.file.size },
        lastAccessed: new Date(),
      });

      res.status(201).json({
        message: isZK ? "File encrypted & uploaded" : "File uploaded",
        file: {
          id:          fileRecord._id,
          name:        fileRecord.originalName,
          size:        fileRecord.size,
          mimeType:    fileRecord.mimeType,
          folderId:    fileRecord.folderId,
          isEncrypted: fileRecord.isEncrypted,
          uploadedAt:  fileRecord.uploadedAt,
        },
      });
    } catch (error) {
      console.error("Upload Error:", error);
      if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      res.status(500).json({ message: "Server error during upload" });
    }
  }
);


// ════════════════════════════════════════════════════════════
// 4. GET /api/vaults/:vaultId/files/:fileId/download  (ZK-aware)
//    For encrypted files: returns URL so client can fetch + decrypt.
//    For plain files: streams or returns presigned URL.
// ════════════════════════════════════════════════════════════
app.get(
  "/api/vaults/:vaultId/files/:fileId/download",
  authenticateToken,
  async (req, res) => {
    try {
      const { vaultId, fileId } = req.params;

      const file = await VaultFile.findOne({
        _id: fileId, vaultId, userId: req.user.userId, isDeleted: false,
      });
      if (!file) return res.status(404).json({ message: "File not found" });

      // Increment download counter
      await VaultFile.findByIdAndUpdate(fileId, { $inc: { downloads: 1 } });
      await Vault.findByIdAndUpdate(vaultId, { lastAccessed: new Date() });

      // After file is found in download route:
await createVaultAuditLog(
  vaultId,
  req.user.userId,
  req.user.email,
  "File Downloaded",
  req,
  { id: file._id, name: file.originalName },
  "success"
);

      if (isLocal) {
        const filePath = path.join(__dirname, "uploads/r2mock", file.storedKey);
        if (!fs.existsSync(filePath)) return res.status(404).json({ message: "File not found on disk" });

        if (file.isEncrypted) {
          const localUrl = `${process.env.BACKEND_URL || "http://localhost:5000"}/uploads/r2mock/${file.storedKey}`;
          return res.status(200).json({
            localPath:    localUrl,
            originalName: file.originalName,
            mimeType:     file.mimeType,
            isEncrypted:  true,
          });
        }

        // Non-encrypted local stream
        res.setHeader("Content-Disposition", `attachment; filename="${file.originalName}"`);
        res.setHeader("Content-Type", file.mimeType);
        return res.sendFile(path.resolve(filePath));

      } else {
  // Production — presigned R2 URL (browser fetches directly, no proxy/CORS issues)
  const { GetObjectCommand } = require("@aws-sdk/client-s3");
  const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

  const cmd = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: file.storedKey,
  });

  const presignedUrl = await getSignedUrl(r2Client, cmd, { expiresIn: 300 });

  return res.status(200).json({
    downloadUrl:  presignedUrl,
    originalName: file.originalName,
    mimeType:     file.mimeType,
    isEncrypted:  file.isEncrypted || false,
  });
      }

    } catch (error) {
      console.error("Download File Error:", error);
      res.status(500).json({ message: "Server error during download" });
    }
  }
);

app.get("/api/vaults/:vaultId/files/:fileId/stream", async (req, res) => {
  try {
    // Accept token from query param (since browser fetch from blob URL won't have auth header)
    const token = req.query.token || req.headers["authorization"]?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    } catch {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    const { vaultId, fileId } = req.params;

    const file = await VaultFile.findOne({
      _id: fileId, vaultId, userId: decoded.userId, isDeleted: false,
    });
    if (!file) return res.status(404).json({ message: "File not found" });

    const { GetObjectCommand } = require("@aws-sdk/client-s3");
    const s3Response = await r2Client.send(new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key:    file.storedKey,
    }));

    res.setHeader("Content-Type", "application/octet-stream");
    if (file.size) res.setHeader("Content-Length", file.size);
    res.setHeader("Access-Control-Allow-Origin", process.env.FRONTEND_URL || "*");
    res.setHeader("Access-Control-Allow-Credentials", "true");

    s3Response.Body.pipe(res);

  } catch (error) {
    console.error("Stream File Error:", error);
    res.status(500).json({ message: "Server error during file stream" });
  }
});

// ════════════════════════════════════════════════════════════
// 9. PATCH /api/vaults/:vaultId/files/:fileId/view
//    Increments the view counter (call when file panel opens).
// ════════════════════════════════════════════════════════════
app.patch("/api/vaults/:vaultId/files/:fileId/view", authenticateToken, async (req, res) => {
  try {
    const { vaultId, fileId } = req.params;
    await VaultFile.findOneAndUpdate(
      { _id: fileId, vaultId, userId: req.user.userId, isDeleted: false },
      { $inc: { views: 1 } }
    );
    res.status(200).json({ ok: true });
  } catch (error) {
    console.error("View counter error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

const escHtml = (str = "") =>
  String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const fileTypeEmoji = (type = "") =>
  ({ PDF:"📄", Image:"🖼️", Video:"🎬", Audio:"🎵",
     Archive:"📦", Code:"💻", Word:"📝", Excel:"📊",
     Presentation:"📈", Text:"🗒️" }[type] || "📁");

const formatBytes = (bytes) => {
  if (!bytes || bytes <= 0) return "0 B";
  const k = 1024, s = ["B","KB","MB","GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / k ** i).toFixed(i ? 1 : 0)} ${s[i]}`;
};

const getMimeLabel = (mimeType = "", name = "") => {
  const ext  = name.split(".").pop()?.toLowerCase() || "";
  const mime = mimeType.toLowerCase();
  if (mime.includes("pdf") || ext === "pdf")                              return "PDF";
  if (mime.startsWith("image/"))                                          return "Image";
  if (mime.startsWith("video/"))                                          return "Video";
  if (mime.startsWith("audio/"))                                          return "Audio";
  if (mime.includes("zip") || mime.includes("archive"))                   return "Archive";
  if (mime.includes("word") || ["doc","docx"].includes(ext))             return "Word";
  if (mime.includes("spreadsheet") || ["xls","xlsx","csv"].includes(ext)) return "Excel";
  if (mime.includes("presentation") || ["ppt","pptx"].includes(ext))     return "Presentation";
  if (mime.startsWith("text/") || ["txt","md","log"].includes(ext))      return "Text";
  return "File";
};

const NON_SHAREABLE_SERVER = new Set([
  "js","ts","jsx","tsx","py","java","cpp","c","cs","go",
  "rs","php","rb","swift","kt","sh","bash","bat","cmd",
  "ps1","exe","dll","so","dylib","bin","dmg","apk","ipa",
  "sql","db","sqlite","env","key","pem","cer","crt","p12",
  "pfx","der","keystore","jks",
]);
const isShareableFile = (fileName = "") =>
  !NON_SHAREABLE_SERVER.has(fileName.split(".").pop()?.toLowerCase() || "");

// ─── Email template ───────────────────────────────────────────────────────────
// Clean, table-based layout that works in all email clients (Gmail, Outlook, Apple Mail).
const buildShareEmail = ({ senderName, senderEmail, fileName, fileType, fileSizeLabel, message, isEncrypted }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Shared File</title>
</head>
<body style="margin:0;padding:0;background-color:#0a0f1e;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0a0f1e;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;">

          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,#0d1f3c 0%,#0a1628 100%);border-radius:20px 20px 0 0;border:1px solid #1a3a6b;border-bottom:none;padding:0;overflow:hidden;">
              <!-- Gradient top bar -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="height:4px;background:linear-gradient(90deg,#06b6d4,#3b82f6,#8b5cf6);font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:40px 40px 32px;">
                <tr>
                  <td align="center">
                    <!-- Logo -->
                    <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
                      <tr>
                        <td style="background:linear-gradient(135deg,#06b6d4,#3b82f6);border-radius:14px;width:48px;height:48px;text-align:center;vertical-align:middle;font-size:22px;">
                          🔒
                        </td>
                        <td style="padding-left:12px;font-size:24px;font-weight:800;color:#06b6d4;vertical-align:middle;letter-spacing:-0.5px;">
                          AirVault
                        </td>
                      </tr>
                    </table>
                    <!-- Avatar -->
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td align="center">
                          <div style="width:68px;height:68px;border-radius:50%;background:linear-gradient(135deg,#0ea5e9,#6366f1);display:inline-block;text-align:center;line-height:68px;font-size:28px;font-weight:700;color:#ffffff;border:3px solid rgba(6,182,212,0.4);">
                            ${(senderName || "?")[0].toUpperCase()}
                          </div>
                          <p style="margin:12px 0 4px;font-size:20px;font-weight:700;color:#f1f5f9;">${escHtml(senderName)}</p>
                          <p style="margin:0 0 6px;font-size:13px;color:#64748b;">${escHtml(senderEmail)}</p>
                          <p style="margin:0;font-size:15px;color:#94a3b8;">shared a file with you</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="background:#0d1626;border:1px solid #1a3a6b;border-top:none;border-bottom:none;padding:32px 40px;">

              <!-- File card -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:linear-gradient(135deg,#0f2340,#0d1a2e);border:1px solid #1e3a6b;border-radius:16px;overflow:hidden;margin-bottom:24px;">
                <tr>
                  <td style="height:3px;background:linear-gradient(90deg,#06b6d4,#3b82f6);font-size:0;line-height:0;">&nbsp;</td>
                </tr>
                <tr>
                  <td style="padding:24px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td width="60" valign="middle" style="padding-right:16px;">
                          <table cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="width:56px;height:56px;background:linear-gradient(135deg,#0ea5e9,#6366f1);border-radius:14px;text-align:center;vertical-align:middle;font-size:26px;">
                                ${fileTypeEmoji(fileType)}
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td valign="middle">
                          <p style="margin:0 0 10px;font-size:16px;font-weight:700;color:#f1f5f9;word-break:break-all;">${escHtml(fileName)}</p>
                          <table cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="padding-right:8px;">
                                <span style="display:inline-block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#06b6d4;background:rgba(6,182,212,0.15);border:1px solid rgba(6,182,212,0.3);border-radius:6px;padding:4px 10px;">${escHtml(fileType || "File")}</span>
                              </td>
                              <td style="padding-right:8px;">
                                <span style="display:inline-block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#a78bfa;background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.3);border-radius:6px;padding:4px 10px;">${escHtml(fileSizeLabel)}</span>
                              </td>
                              ${isEncrypted ? `<td><span style="display:inline-block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#34d399;background:rgba(52,211,153,0.15);border:1px solid rgba(52,211,153,0.3);border-radius:6px;padding:4px 10px;">🔒 Encrypted</span></td>` : ""}
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Attachment notice -->
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.25);border-radius:14px;margin-bottom:${message ? "24px" : "0"};">
  <tr>
    <td style="padding:18px 22px;">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="font-size:22px;padding-right:14px;vertical-align:middle;">
            ${isEncrypted ? "🔐" : "📎"}
          </td>
          <td valign="middle">
            <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:${isEncrypted ? "#f59e0b" : "#06b6d4"};">
              ${isEncrypted ? "Encrypted file — requires AirVault to open" : "File attached to this email"}
            </p>
            <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">
              ${isEncrypted 
                ? "This file is end-to-end encrypted. To open it, the sender must share access with you through AirVault directly. The attachment cannot be opened without the encryption key."
                : "The file is attached below. Open or save it directly from your email client."
              }
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

              <!-- Personal message -->
              ${message ? `
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:rgba(15,35,64,0.6);border:1px solid #1a3a6b;border-left:3px solid #06b6d4;border-radius:12px;">
                <tr>
                  <td style="padding:18px 22px;">
                    <p style="margin:0 0 8px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#334155;">Personal Message</p>
                    <p style="margin:0;font-size:14px;color:#94a3b8;line-height:1.7;font-style:italic;">"${escHtml(message)}"</p>
                  </td>
                </tr>
              </table>
              ` : ""}

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#070d1a;border:1px solid #1a3a6b;border-top:1px solid #0f2040;border-radius:0 0 20px 20px;padding:28px 40px;text-align:center;">
              <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 16px;">
                <tr>
                  <td style="background:linear-gradient(135deg,#06b6d4,#3b82f6);border-radius:10px;width:32px;height:32px;text-align:center;vertical-align:middle;font-size:16px;">🔒</td>
                  <td style="padding-left:8px;font-size:16px;font-weight:800;color:#1e3a5f;vertical-align:middle;">AirVault</td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td style="height:1px;background:#0f2040;font-size:0;line-height:0;">&nbsp;</td></tr>
              </table>
              <p style="margin:16px 0 4px;font-size:12px;color:#1e3a5f;line-height:1.7;">
                Sent via AirVault · Zero-knowledge encrypted file storage
              </p>
              <p style="margin:0 0 8px;font-size:12px;color:#1e3a5f;">
                <a href="https://airvault.me" style="color:#0ea5e9;text-decoration:none;">airvault.me</a>
                &nbsp;·&nbsp;
                <a href="https://airvault.me/privacy" style="color:#0ea5e9;text-decoration:none;">Privacy Policy</a>
              </p>
              <p style="margin:0;font-size:11px;color:#0f1e36;">© 2026 AirVault. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;


// ============================================================
// POST /api/vaults/:vaultId/files/:fileId/share
// Body: { recipients: string[], message?: string }
// Sends the actual file as an email attachment via Resend.
// ============================================================
app.post(
  "/api/vaults/:vaultId/files/:fileId/share",
  authenticateToken,
  async (req, res) => {
    try {
      const { vaultId, fileId }     = req.params;
      const { recipients, message } = req.body;

      // ── Validate recipients ──────────────────────────────────────────────────
      if (!Array.isArray(recipients) || recipients.length === 0)
        return res.status(400).json({ message: "At least one recipient is required" });
      if (recipients.length > 10)
        return res.status(400).json({ message: "Maximum 10 recipients per share" });
      const emailRe   = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const badEmails = recipients.filter(e => !emailRe.test(e));
      if (badEmails.length)
        return res.status(400).json({ message: `Invalid email(s): ${badEmails.join(", ")}` });

      // ── Verify vault + file ownership ────────────────────────────────────────
      const vault = await Vault.findOne({ _id: vaultId, userId: req.user.userId, isActive: true });
      if (!vault) return res.status(404).json({ message: "Vault not found" });

      const file = await VaultFile.findOne({ _id: fileId, vaultId, userId: req.user.userId, isDeleted: false });
      if (!file) return res.status(404).json({ message: "File not found" });

      // ── Shareability check ───────────────────────────────────────────────────
      if (!isShareableFile(file.originalName)) {
        return res.status(400).json({
          message: `Files with extension .${file.originalName.split(".").pop()} cannot be shared via email for security reasons.`,
          code: "NOT_SHAREABLE",
        });
      }

      // ── Size guard: Resend's attachment limit is 40 MB ───────────────────────
      const MAX_ATTACH_BYTES = 40 * 1024 * 1024;
      if (file.size > MAX_ATTACH_BYTES) {
        return res.status(400).json({
          message: "File is too large to send as an attachment (max 40 MB). Consider sharing via a different method.",
          code: "FILE_TOO_LARGE",
        });
      }

      // ── Sender info ──────────────────────────────────────────────────────────
      const sender      = await User.findById(req.user.userId).select("fullName email");
      const senderName  = sender?.fullName || "An AirVault user";
      const senderEmail = sender?.email    || req.user.email;

      // ── Read the file bytes from disk / R2 ──────────────────────────────────
      let fileBuffer;
      const isLocal = process.env.NODE_ENV !== "production";

      if (isLocal) {
        // Resolve whichever field your VaultFile schema uses for the on-disk path.
        // Common names: storagePath, filePath, path, localPath, storageKey, filename, savedName
        if (!file.storedKey) {
          return res.status(500).json({ message: "Cannot locate file on disk: storedKey is missing." });
        }
        const diskPath = path.join(__dirname, "uploads", "r2mock", file.storedKey);

        fileBuffer = await fs.promises.readFile(diskPath);
      } else {
        // Production: fetch from R2 presigned URL
        const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const cmd = new GetObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: file.storedKey });
const url = await getSignedUrl(r2Client, cmd, { expiresIn: 60 });
const resp = await fetch(url);
if (!resp.ok) throw new Error("Could not fetch file from R2");
fileBuffer = Buffer.from(await resp.arrayBuffer());
      }

      // ── Build email ──────────────────────────────────────────────────────────
      const fileType      = getMimeLabel(file.mimeType, file.originalName);
      const fileSizeLabel = formatBytes(file.size);
      const htmlBody      = buildShareEmail({
        senderName, senderEmail,
        fileName:    file.originalName,
        fileType,
        fileSizeLabel,
        message:     message || "",
        isEncrypted: file.isEncrypted ?? false,
      });

      // ── Send to each recipient ───────────────────────────────────────────────
      const sendResults = [];
      for (const recipient of recipients) {
        try {
          const { data, error } = await resend.emails.send({
            from:    "AirVault <noreply@airvault.me>",
            to:      recipient,
            subject: `${senderName} shared "${file.originalName}" with you`,
            html:    htmlBody,
            attachments: [
              {
                filename: file.originalName,
                content:  fileBuffer,           // Buffer — Resend accepts Buffer directly
              },
            ],
          });
          if (error) sendResults.push({ email: recipient, ok: false, error: error.message });
          else       sendResults.push({ email: recipient, ok: true });
        } catch (e) {
          sendResults.push({ email: recipient, ok: false, error: e.message });
        }
      }

      // ── Persist shared flag ──────────────────────────────────────────────────
      const anyOk    = sendResults.some(r => r.ok);
      const allOk    = sendResults.every(r => r.ok);
      const failList = sendResults.filter(r => !r.ok).map(r => r.email);
      if (anyOk) await VaultFile.findByIdAndUpdate(fileId, { shared: true });

      await createAuditLog(req.user.userId, senderEmail, "FILE_SHARED", req, anyOk);

      if (!anyOk)
        return res.status(502).json({ message: "Failed to send emails. Please try again.", results: sendResults });

      return res.status(200).json({
        message: allOk
          ? `File sent successfully to ${recipients.length} recipient(s).`
          : `Sent to some recipients. Failed for: ${failList.join(", ")}`,
        results: sendResults,
      });

    } catch (error) {
      console.error("Share File Error:", error);
      res.status(500).json({ message: "Server error during file sharing" });
    }
  }
);

const folderToJSON = (f) => ({
  id:         f.folderId,
  _id:        f._id,
  name:       f.name,
  parentId:   f.parentId,
  locked:     f.locked     || false,
  restricted: f.restricted || false,
  permission: f.permission || "edit",
  createdAt:  f.createdAt,
});

const fileToJSON = (f) => ({
  id:          f._id,
  folderId:    f.folderId || "root",
  name:        f.originalName,
  mimeType:    f.mimeType,
  size:        f.size,
  uploadedAt:  f.uploadedAt,
  isEncrypted: f.isEncrypted || false,
  category:    f.category   || null,
  tags:        f.tags        || [],
  description: f.description || null,
  label:       f.label       || null,
  shared:      f.shared      || false,
  views:       f.views       || 0,
  downloads:   f.downloads   || 0,
});

async function ensureRoot(vaultId, userId, vaultName) {
  let root = await VaultFolder.findOne({ vaultId, userId, folderId: "root", isDeleted: false });
  if (!root) {
    root = await VaultFolder.create({
      vaultId,
      userId,
      folderId:   "root",
      name:       vaultName || "Vault Root",
      parentId:   null,
      locked:     false,
      restricted: false,
      permission: "edit",
    });
  }
  return root;
}

// ── FOLDER ROUTES (keep only these, remove all other folder route blocks) ────

// GET all folders flat
app.get("/api/vaults/:vaultId/folders", authenticateToken, async (req, res) => {
  try {
    const { vaultId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(vaultId))
      return res.status(400).json({ message: "Invalid vault ID" });

    const vault = await Vault.findOne({ _id: vaultId, userId: req.user.userId, isActive: true });
    if (!vault) return res.status(404).json({ message: "Vault not found" });

    await ensureRoot(vaultId, req.user.userId, vault.name);

    const folders = await VaultFolder.find({
      vaultId, userId: req.user.userId, isDeleted: false,
    }).sort({ name: 1 });

    res.json({ folders: folders.map(folderToJSON) });
  } catch (err) {
    console.error("GET folders:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET single folder + children + files
app.get("/api/vaults/:vaultId/folders/:folderId", authenticateToken, async (req, res) => {
  try {
    const { vaultId, folderId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(vaultId))
      return res.status(400).json({ message: "Invalid vault ID" });

    const vault = await Vault.findOne({ _id: vaultId, userId: req.user.userId, isActive: true });
    if (!vault) return res.status(404).json({ message: "Vault not found" });

    if (folderId === "root") await ensureRoot(vaultId, req.user.userId, vault.name);

    const folder = await VaultFolder.findOne({
      vaultId, userId: req.user.userId, folderId, isDeleted: false,
    });
    if (!folder) return res.status(404).json({ message: "Folder not found" });

    const [childFolders, files] = await Promise.all([
      VaultFolder.find({ vaultId, userId: req.user.userId, parentId: folderId, isDeleted: false }).sort({ name: 1 }),
      VaultFile.find({ vaultId, userId: req.user.userId, folderId, isDeleted: false }).sort({ uploadedAt: -1 }),
    ]);

    // File counts per child folder
    const childIds = childFolders.map(f => f.folderId);
    const countAgg = childIds.length
      ? await VaultFile.aggregate([
          { $match: {
              vaultId:   new mongoose.Types.ObjectId(vaultId),
              userId:    new mongoose.Types.ObjectId(req.user.userId),
              folderId:  { $in: childIds },
              isDeleted: false,
          }},
          { $group: { _id: "$folderId", count: { $sum: 1 }, sizeBytes: { $sum: "$size" } } },
        ])
      : [];
    const countMap = Object.fromEntries(countAgg.map(r => [r._id, r]));

    res.json({
      folder: folderToJSON(folder),
      childFolders: childFolders.map(f => ({
        ...folderToJSON(f),
        fileCount:       countMap[f.folderId]?.count     || 0,
        folderSizeBytes: countMap[f.folderId]?.sizeBytes || 0,
      })),
      files: files.map(fileToJSON),
      stats: {
        fileCount:       files.length,
        folderCount:     childFolders.length,
        folderSizeBytes: files.reduce((s, f) => s + (f.size || 0), 0),
      },
    });
  } catch (err) {
    console.error("GET folder detail:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST create folder
app.post("/api/vaults/:vaultId/folders", authenticateToken, async (req, res) => {
  try {
    const { vaultId } = req.params;
    const { name, parentId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(vaultId))
      return res.status(400).json({ message: "Invalid vault ID" });
    if (!name?.trim())
      return res.status(400).json({ message: "Folder name is required" });
    if (name.trim().length > 100)
      return res.status(400).json({ message: "Name too long (max 100 chars)" });

    const vault = await Vault.findOne({ _id: vaultId, userId: req.user.userId, isActive: true });
    if (!vault) return res.status(404).json({ message: "Vault not found" });

    const resolvedParent = parentId || "root";

    // Ensure root exists (needed when parentId is "root")
    await ensureRoot(vaultId, req.user.userId, vault.name);

    // Verify parent exists
    const parent = await VaultFolder.findOne({ vaultId, folderId: resolvedParent, isDeleted: false });
    if (!parent) return res.status(404).json({ message: "Parent folder not found" });
    if (parent.restricted) return res.status(403).json({ message: "Cannot create folder inside a restricted folder" });

    // Duplicate name guard
    const exists = await VaultFolder.findOne({
      vaultId, userId: req.user.userId,
      parentId: resolvedParent, name: name.trim(), isDeleted: false,
    });
    if (exists) return res.status(400).json({ message: "A folder with this name already exists here" });

    const folderId = `folder-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const folder = await VaultFolder.create({
      vaultId,
      userId:     req.user.userId,
      folderId,
      name:       name.trim(),
      parentId:   resolvedParent,
      locked:     false,
      restricted: false,
      permission: "edit",
    });

    await createAuditLog(req.user.userId, req.user.email, "FOLDER_CREATED", req);
    res.status(201).json({ folder: folderToJSON(folder) });
  } catch (err) {
    console.error("POST folder:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT rename folder
app.put("/api/vaults/:vaultId/folders/:folderId", authenticateToken, async (req, res) => {
  try {
    const { vaultId, folderId } = req.params;
    const { name } = req.body;

    if (folderId === "root") return res.status(400).json({ message: "Cannot rename root folder" });
    if (!name?.trim())       return res.status(400).json({ message: "Folder name is required" });

    const folder = await VaultFolder.findOne({ vaultId, userId: req.user.userId, folderId, isDeleted: false });
    if (!folder) return res.status(404).json({ message: "Folder not found" });

    const dup = await VaultFolder.findOne({
      vaultId, userId: req.user.userId,
      parentId: folder.parentId, name: name.trim(), isDeleted: false,
      folderId: { $ne: folderId },
    });
    if (dup) return res.status(400).json({ message: "A folder with this name already exists here" });

    folder.name = name.trim();
    await folder.save();
    res.json({ folder: folderToJSON(folder) });
  } catch (err) {
    console.error("PUT folder:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE folder (only if empty)
app.delete("/api/vaults/:vaultId/folders/:folderId", authenticateToken, async (req, res) => {
  try {
    const { vaultId, folderId } = req.params;
    if (folderId === "root") return res.status(400).json({ message: "Cannot delete root folder" });

    const folder = await VaultFolder.findOne({ vaultId, userId: req.user.userId, folderId, isDeleted: false });
    if (!folder) return res.status(404).json({ message: "Folder not found" });

    const [hasFiles, hasSubs] = await Promise.all([
      VaultFile.exists({ vaultId, folderId, isDeleted: false }),
      VaultFolder.exists({ vaultId, parentId: folderId, isDeleted: false }),
    ]);
    if (hasFiles) return res.status(400).json({ message: "Delete all files inside before deleting the folder" });
    if (hasSubs)  return res.status(400).json({ message: "Delete all subfolders first" });

    folder.isDeleted = true;
    await folder.save();

    await createAuditLog(req.user.userId, req.user.email, "FOLDER_DELETED", req);
    res.json({ message: "Folder deleted" });
  } catch (err) {
    console.error("DELETE folder:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH move folder
app.patch("/api/vaults/:vaultId/folders/:folderId/move", authenticateToken, async (req, res) => {
  try {
    const { vaultId, folderId } = req.params;
    const { newParentId } = req.body;
    if (folderId === "root")      return res.status(400).json({ message: "Cannot move root folder" });
    if (folderId === newParentId) return res.status(400).json({ message: "Cannot move folder into itself" });

    const folder = await VaultFolder.findOne({ vaultId, userId: req.user.userId, folderId, isDeleted: false });
    if (!folder) return res.status(404).json({ message: "Folder not found" });
    folder.parentId = newParentId || "root";
    await folder.save();
    res.json({ message: "Folder moved" });
  } catch (err) {
    console.error("PATCH folder/move:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH move file to different folder
app.patch("/api/vaults/:vaultId/files/:fileId/move", authenticateToken, async (req, res) => {
  try {
    const { vaultId, fileId } = req.params;
    const { newFolderId } = req.body;

    const file = await VaultFile.findOne({ _id: fileId, vaultId, userId: req.user.userId, isDeleted: false });
    if (!file) return res.status(404).json({ message: "File not found" });

    const target = await VaultFolder.findOne({ vaultId, folderId: newFolderId || "root", isDeleted: false });
    if (!target) return res.status(404).json({ message: "Target folder not found" });
    if (target.restricted) return res.status(403).json({ message: "Cannot move file into restricted folder" });

    file.folderId = newFolderId || "root";
    await file.save();
    res.json({ message: "File moved", file: fileToJSON(file) });
  } catch (err) {
    console.error("PATCH file/move:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET breadcrumb
app.get("/api/vaults/:vaultId/folders/:folderId/breadcrumb", authenticateToken, async (req, res) => {
  try {
    const { vaultId, folderId } = req.params;
    const allFolders = await VaultFolder.find({ vaultId, userId: req.user.userId, isDeleted: false }).lean();
    const folderMap  = Object.fromEntries(allFolders.map(f => [f.folderId, f]));
    const chain = [];
    let cursor = folderMap[folderId], guard = 0;
    while (cursor && guard++ < 20) {
      chain.unshift({ id: cursor.folderId, name: cursor.name });
      cursor = cursor.parentId ? folderMap[cursor.parentId] : null;
    }
    res.json({ breadcrumb: chain });
  } catch (err) {
    console.error("GET breadcrumb:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH increment view counter
app.patch("/api/vaults/:vaultId/files/:fileId/view", authenticateToken, async (req, res) => {
  try {
    const { vaultId, fileId } = req.params;
    await VaultFile.findOneAndUpdate(
      { _id: fileId, vaultId, userId: req.user.userId, isDeleted: false },
      { $inc: { views: 1 } }
    );
    res.json({ ok: true });
  } catch (err) {
    console.error("View counter:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ── Helper: format bytes ──────────────────────────────────────────────────────
const formatBytesServer = (bytes) => {
  if (!bytes || bytes <= 0) return "0 B";
  const k = 1024, s = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(i ? 1 : 0)} ${s[i]}`;
};

// ── Helper: format date ───────────────────────────────────────────────────────
const formatDate = (date) => {
  if (!date) return "—";
  return new Date(date).toISOString().split("T")[0]; // "YYYY-MM-DD"
};

const formatDateTime = (date) => {
  if (!date) return "—";
  const d = new Date(date);
  return d.toISOString().replace("T", " ").slice(0, 16) + " UTC";
};


// ============================================================
// 1. GET /api/vaults/:vaultId/details
//    Full vault details for the Details page.
//    Returns: vault info + file stats + folder count + owner info
// ============================================================
app.get("/api/vaults/:vaultId/details", authenticateToken, async (req, res) => {
  try {
    const { vaultId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(vaultId)) {
      return res.status(400).json({ message: "Invalid vault ID" });
    }

    // Fetch vault
    const vault = await Vault.findOne({
      _id: vaultId,
      userId: req.user.userId,
      isActive: true,
    });
    if (!vault) return res.status(404).json({ message: "Vault not found" });

    // Fetch owner info
    const owner = await User.findById(req.user.userId).select("fullName email");

    // Aggregate file stats
    const fileStats = await VaultFile.aggregate([
      {
        $match: {
          vaultId: new mongoose.Types.ObjectId(vaultId),
          userId:  new mongoose.Types.ObjectId(req.user.userId),
          isDeleted: false,
        },
      },
      {
        $group: {
          _id:           null,
          totalSize:     { $sum: "$size" },
          fileCount:     { $sum: 1 },
          encryptedCount:{ $sum: { $cond: ["$isEncrypted", 1, 0] } },
          sharedCount:   { $sum: { $cond: ["$shared", 1, 0] } },
          totalViews:    { $sum: "$views" },
          totalDownloads:{ $sum: "$downloads" },
          lastUpload:    { $max: "$uploadedAt" },
        },
      },
    ]);

    const stats = fileStats[0] || {
      totalSize: 0, fileCount: 0, encryptedCount: 0,
      sharedCount: 0, totalViews: 0, totalDownloads: 0, lastUpload: null,
    };

    // Folder count
    const folderCount = await VaultFolder.countDocuments({
      vaultId,
      userId: req.user.userId,
      isDeleted: false,
      folderId: { $ne: "root" },
    });

    // Category breakdown
    const categoryStats = await VaultFile.aggregate([
      {
        $match: {
          vaultId:   new mongoose.Types.ObjectId(vaultId),
          userId:    new mongoose.Types.ObjectId(req.user.userId),
          isDeleted: false,
        },
      },
      {
        $group: {
          _id:   "$category",
          count: { $sum: 1 },
          size:  { $sum: "$size" },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    // Update lastAccessed
    await Vault.findByIdAndUpdate(vaultId, { lastAccessed: new Date() });

    res.status(200).json({
      vault: {
        id:           vault._id,
        name:         vault.name,
        description:  vault.description || "",
        hasPassword:  vault.hasPassword,
        passwordHint: vault.passwordHint || null,
        isLocked:     vault.hasPassword,
        access:       vault.hasPassword ? "Password Protected" : "Private",
        permissions:  ["Owner"],
        encryption:   "AES-256",
        tags:         vault.tags || [],
        created:      formatDate(vault.createdAt),
        modified:     formatDate(stats.lastUpload || vault.createdAt),
        lastAccessed: formatDateTime(vault.lastAccessed),
        createdAt:    vault.createdAt,
        lastAccessedRaw: vault.lastAccessed,
      },
      owner: {
        name:  owner?.fullName || "Unknown",
        email: owner?.email    || "",
      },
      stats: {
        fileCount:      stats.fileCount,
        folderCount,
        totalSize:      stats.totalSize,
        totalSizeLabel: formatBytesServer(stats.totalSize),
        encryptedCount: stats.encryptedCount,
        sharedCount:    stats.sharedCount,
        totalViews:     stats.totalViews,
        totalDownloads: stats.totalDownloads,
        storageLimit:   500 * 1024 * 1024, // 500 MB
        storageLimitLabel: "500 MB",
        percentUsed:    Math.min(
          100,
          Math.round((stats.totalSize / (500 * 1024 * 1024)) * 100)
        ),
      },
      categoryBreakdown: categoryStats.map((c) => ({
        category:  c._id || "General",
        count:     c.count,
        size:      c.size,
        sizeLabel: formatBytesServer(c.size),
      })),
    });
  } catch (error) {
    console.error("Get Vault Details Error:", error);
    res.status(500).json({ message: "Server error fetching vault details" });
  }
});


// ============================================================
// 2. GET /api/vaults/:vaultId/activity
//    Recent activity log for the vault (last 20 events).
// ============================================================
app.get("/api/vaults/:vaultId/activity", authenticateToken, async (req, res) => {
  try {
    const { vaultId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(vaultId)) {
      return res.status(400).json({ message: "Invalid vault ID" });
    }

    const vault = await Vault.findOne({
      _id: vaultId,
      userId: req.user.userId,
      isActive: true,
    });
    if (!vault) return res.status(404).json({ message: "Vault not found" });

    // Get recent files uploaded/modified as activity
    const recentFiles = await VaultFile.find({
      vaultId,
      userId: req.user.userId,
      isDeleted: false,
    })
      .sort({ uploadedAt: -1 })
      .limit(10)
      .select("originalName mimeType size uploadedAt isEncrypted category");

    const activity = recentFiles.map((f) => ({
      type:      "upload",
      label:     `Uploaded "${f.originalName}"`,
      timestamp: formatDateTime(f.uploadedAt),
      timestampRaw: f.uploadedAt,
      meta: {
        size:        formatBytesServer(f.size),
        category:    f.category,
        isEncrypted: f.isEncrypted,
      },
    }));

    res.status(200).json({ activity });
  } catch (error) {
    console.error("Get Vault Activity Error:", error);
    res.status(500).json({ message: "Server error fetching activity" });
  }
});


// ============================================================
// 3. PUT /api/vaults/:vaultId/details
//    Update vault name, description, and tags from Details page.
// ============================================================
app.put("/api/vaults/:vaultId/details", authenticateToken, async (req, res) => {
  try {
    const { vaultId } = req.params;
    const { name, description, tags } = req.body;

    if (!mongoose.Types.ObjectId.isValid(vaultId)) {
      return res.status(400).json({ message: "Invalid vault ID" });
    }

    const vault = await Vault.findOne({
      _id: vaultId,
      userId: req.user.userId,
      isActive: true,
    });
    if (!vault) return res.status(404).json({ message: "Vault not found" });

    if (name?.trim()) {
      // Check duplicate name
      const dup = await Vault.findOne({
        userId: req.user.userId,
        name: name.trim(),
        isActive: true,
        _id: { $ne: vaultId },
      });
      if (dup) {
        return res.status(400).json({ message: "A vault with this name already exists" });
      }
      vault.name = name.trim();
    }

    if (description !== undefined) vault.description = description;
    if (Array.isArray(tags))        vault.tags        = tags.slice(0, 10); // max 10 tags

    await vault.save();
    await createAuditLog(req.user.userId, req.user.email, "VAULT_DETAILS_UPDATED", req);

    res.status(200).json({
      message: "Vault updated successfully",
      vault: {
        id:          vault._id,
        name:        vault.name,
        description: vault.description,
        tags:        vault.tags || [],
      },
    });
  } catch (error) {
    console.error("Update Vault Details Error:", error);
    res.status(500).json({ message: "Server error updating vault details" });
  }
});


// ============================================================
// 4. DELETE /api/vaults/:vaultId/permanent
//    Hard delete vault + all its files from disk/R2 + DB records.
//    Called from the Details page "Delete Vault" button.
// ============================================================
app.delete("/api/vaults/:vaultId/permanent", authenticateToken, async (req, res) => {
  try {
    const { vaultId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(vaultId)) {
      return res.status(400).json({ message: "Invalid vault ID" });
    }

    const vault = await Vault.findOne({
      _id: vaultId,
      userId: req.user.userId,
      isActive: true,
    });
    if (!vault) return res.status(404).json({ message: "Vault not found" });

    // Get all files for this vault
    const files = await VaultFile.find({
      vaultId,
      userId: req.user.userId,
      isDeleted: false,
    });

    // Delete each file from storage
    for (const file of files) {
      try {
        if (isLocal) {
          const filePath = path.join(__dirname, "uploads/r2mock", file.storedKey);
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        } else {
          const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
          await r2Client
            .send(
              new DeleteObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: file.storedKey,
              })
            )
            .catch((e) => console.warn("R2 delete warning:", e.message));
        }
      } catch (e) {
        console.warn(`Could not delete file ${file.storedKey}:`, e.message);
      }
    }

    // Delete all file records
    await VaultFile.deleteMany({ vaultId });

    // Delete all folder records
    await VaultFolder.deleteMany({ vaultId });

    // Delete ZK salt
    await ZKSalt.deleteOne({ vaultId });

    // Hard delete vault
    await Vault.findByIdAndDelete(vaultId);

    // Check if user has any remaining vaults
    const remainingVaults = await Vault.countDocuments({
      userId: req.user.userId,
      isActive: true,
    });
    if (remainingVaults === 0) {
      await User.findByIdAndUpdate(req.user.userId, { vaultCreated: false });
    }

    await createAuditLog(req.user.userId, req.user.email, "VAULT_PERMANENTLY_DELETED", req);

    res.status(200).json({
      message: "Vault and all its contents permanently deleted",
      filesDeleted: files.length,
    });
  } catch (error) {
    console.error("Permanent Delete Vault Error:", error);
    res.status(500).json({ message: "Server error during vault deletion" });
  }
});


// ============================================================
// 5. GET /api/vaults/:vaultId/export-info
//    Returns a summary JSON the user can download as a record
//    of their vault metadata (not file contents).
// ============================================================
app.get("/api/vaults/:vaultId/export-info", authenticateToken, async (req, res) => {
  try {
    const { vaultId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(vaultId)) {
      return res.status(400).json({ message: "Invalid vault ID" });
    }

    const vault = await Vault.findOne({
      _id: vaultId,
      userId: req.user.userId,
      isActive: true,
    });
    if (!vault) return res.status(404).json({ message: "Vault not found" });

    const owner = await User.findById(req.user.userId).select("fullName email");

    const files = await VaultFile.find({
      vaultId,
      userId:    req.user.userId,
      isDeleted: false,
    }).select("originalName mimeType size category tags uploadedAt isEncrypted folderId");

    const folders = await VaultFolder.find({
      vaultId,
      userId:    req.user.userId,
      isDeleted: false,
    }).select("name folderId parentId createdAt");

    const exportData = {
      exportedAt:   new Date().toISOString(),
      vault: {
        id:          vault._id,
        name:        vault.name,
        description: vault.description,
        createdAt:   vault.createdAt,
        hasPassword: vault.hasPassword,
        encryption:  "AES-256-GCM",
      },
      owner: {
        name:  owner?.fullName,
        email: owner?.email,
      },
      summary: {
        totalFiles:   files.length,
        totalFolders: folders.length,
        totalSize:    formatBytesServer(files.reduce((s, f) => s + (f.size || 0), 0)),
        encryptedFiles: files.filter((f) => f.isEncrypted).length,
      },
      files: files.map((f) => ({
        name:        f.originalName,
        mimeType:    f.mimeType,
        size:        formatBytesServer(f.size),
        category:    f.category,
        tags:        f.tags,
        uploadedAt:  f.uploadedAt,
        isEncrypted: f.isEncrypted,
        folderId:    f.folderId,
      })),
      folders: folders.map((f) => ({
        name:      f.name,
        folderId:  f.folderId,
        parentId:  f.parentId,
        createdAt: f.createdAt,
      })),
    };

    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="airvault-${vault.name.replace(/\s+/g, "-")}-export.json"`
    );
    res.status(200).json(exportData);
  } catch (error) {
    console.error("Export Vault Info Error:", error);
    res.status(500).json({ message: "Server error during export" });
  }
});

const categorizeMime = (mimeType = "", fileName = "") => {
  const ext  = (fileName.split(".").pop() || "").toLowerCase();
  const mime = mimeType.toLowerCase();

  if (mime.includes("pdf") || ext === "pdf")                                         return "PDF";
  if (mime.startsWith("image/"))                                                      return "Image";
  if (mime.startsWith("video/"))                                                      return "Video";
  if (mime.startsWith("audio/"))                                                      return "Audio";
  if (mime.includes("zip") || mime.includes("tar") || mime.includes("gz") ||
      mime.includes("rar") || mime.includes("7z") || mime.includes("archive") ||
      ["zip","tar","gz","rar","7z","bz2","xz"].includes(ext))                        return "Archive";
  if (mime.includes("word") || ["doc","docx"].includes(ext))                         return "Word";
  if (mime.includes("spreadsheet") || mime.includes("excel") ||
      ["xls","xlsx","numbers"].includes(ext))                                         return "Excel";
  if (mime.includes("presentation") || mime.includes("powerpoint") ||
      ["ppt","pptx","key"].includes(ext))                                             return "Presentation";
  if (["js","ts","jsx","tsx","py","java","cpp","c","cs","go","rs","php",
       "rb","swift","kt","sh","bash","html","css","json","xml","yaml",
       "yml","toml","ini","env","sql"].includes(ext) ||
      mime.includes("javascript") || mime.includes("typescript") ||
      mime.includes("x-python") || mime.includes("x-java"))                          return "Code";
  if (mime.startsWith("text/") || ["txt","md","log","csv","rtf"].includes(ext))      return "Text";
  return "Other";
};

// ════════════════════════════════════════════════════════════
// GET /api/dashboard/stats
// Returns all data the main dashboard needs in ONE request.
// ════════════════════════════════════════════════════════════
app.get("/api/dashboard/stats", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // ── 1. All active vaults for this user ───────────────────
    const vaults = await Vault.find({ userId, isActive: true }).sort({ lastAccessed: -1 }).lean();
    const vaultIds = vaults.map(v => v._id);

    // Dynamic storage limit: 500 MB per vault
    const PER_VAULT_MB    = 500;
    const totalStorageMB  = vaults.length * PER_VAULT_MB;
    const totalStorageBytes = totalStorageMB * 1024 * 1024;

    // ── 2. Aggregate file stats across ALL vaults ────────────
    const globalAgg = await VaultFile.aggregate([
      {
        $match: {
          userId:    new mongoose.Types.ObjectId(userId),
          isDeleted: false,
        },
      },
      {
        $group: {
          _id:            null,
          totalFiles:     { $sum: 1 },
          totalSizeBytes: { $sum: "$size" },
          encryptedCount: { $sum: { $cond: ["$isEncrypted", 1, 0] } },
          sharedCount:    { $sum: { $cond: ["$shared",      1, 0] } },
          totalViews:     { $sum: { $ifNull: ["$views",     0] } },
          totalDownloads: { $sum: { $ifNull: ["$downloads", 0] } },
          lastUpload:     { $max: "$uploadedAt" },
        },
      },
    ]);

    const global = globalAgg[0] || {
      totalFiles: 0, totalSizeBytes: 0, encryptedCount: 0,
      sharedCount: 0, totalViews: 0, totalDownloads: 0, lastUpload: null,
    };

    // ── 3. File type breakdown (ALL types) ───────────────────
    const allFiles = await VaultFile.find(
      { userId: new mongoose.Types.ObjectId(userId), isDeleted: false },
      { mimeType: 1, originalName: 1, size: 1 }
    ).lean();

    const typeBuckets = {};
    for (const f of allFiles) {
      const cat = categorizeMime(f.mimeType, f.originalName);
      if (!typeBuckets[cat]) typeBuckets[cat] = { count: 0, sizeBytes: 0 };
      typeBuckets[cat].count++;
      typeBuckets[cat].sizeBytes += f.size || 0;
    }

    const fileTypeBreakdown = Object.entries(typeBuckets)
      .map(([type, { count, sizeBytes }]) => ({ type, count, sizeBytes }))
      .sort((a, b) => b.count - a.count);

    // ── 4. Per-vault summaries ────────────────────────────────
    // Real storage per vault from DB (more accurate than vault.totalSize counter)
    const vaultStorageAgg = await VaultFile.aggregate([
      {
        $match: {
          userId:    new mongoose.Types.ObjectId(userId),
          isDeleted: false,
        },
      },
      {
        $group: {
          _id:       "$vaultId",
          fileCount: { $sum: 1 },
          sizeBytes: { $sum: "$size" },
        },
      },
    ]);
    const vaultStorageMap = Object.fromEntries(
      vaultStorageAgg.map(r => [r._id.toString(), { fileCount: r.fileCount, sizeBytes: r.sizeBytes }])
    );

    const vaultSummaries = vaults.map(v => {
      const storage = vaultStorageMap[v._id.toString()] || { fileCount: 0, sizeBytes: 0 };
      return {
        id:           v._id,
        name:         v.name,
        description:  v.description || "",
        hasPassword:  v.hasPassword,
        passwordHint: v.passwordHint || null,
        createdAt:    v.createdAt,
        lastAccessed: v.lastAccessed,
        fileCount:    storage.fileCount,
        storageUsedBytes: storage.sizeBytes,
        storageUsedMB:    parseFloat((storage.sizeBytes / (1024 * 1024)).toFixed(2)),
        storageLimitMB:   PER_VAULT_MB,
        storagePercent:   Math.min(
          100,
          parseFloat(((storage.sizeBytes / (PER_VAULT_MB * 1024 * 1024)) * 100).toFixed(1))
        ),
      };
    });

    // ── 5. Recent activity (last 10 file uploads across vaults) ─
    const recentFiles = await VaultFile.find(
      { userId: new mongoose.Types.ObjectId(userId), isDeleted: false },
      { originalName: 1, mimeType: 1, size: 1, uploadedAt: 1, isEncrypted: 1, vaultId: 1 }
    )
      .sort({ uploadedAt: -1 })
      .limit(10)
      .lean();

    // build a quick vault name map
    const vaultNameMap = Object.fromEntries(vaults.map(v => [v._id.toString(), v.name]));

    const recentActivity = recentFiles.map(f => ({
      type:        "upload",
      label:       `Uploaded "${f.originalName}"`,
      vaultName:   vaultNameMap[f.vaultId?.toString()] || "Unknown Vault",
      fileType:    categorizeMime(f.mimeType, f.originalName),
      sizeBytes:   f.size,
      isEncrypted: f.isEncrypted,
      timestamp:   f.uploadedAt,
    }));

    // ── 6. Respond ───────────────────────────────────────────
    res.status(200).json({
      storage: {
        totalStorageMB,
        totalStorageBytes,
        usedBytes:   global.totalSizeBytes,
        usedMB:      parseFloat((global.totalSizeBytes / (1024 * 1024)).toFixed(2)),
        remainingMB: parseFloat(((totalStorageBytes - global.totalSizeBytes) / (1024 * 1024)).toFixed(2)),
        percentUsed: totalStorageBytes > 0
          ? Math.min(100, parseFloat(((global.totalSizeBytes / totalStorageBytes) * 100).toFixed(1)))
          : 0,
        perVaultMB:  PER_VAULT_MB,
      },
      totals: {
        vaults:     vaults.length,
        files:      global.totalFiles,
        encrypted:  global.encryptedCount,
        shared:     global.sharedCount,
        views:      global.totalViews,
        downloads:  global.totalDownloads,
        lastUpload: global.lastUpload,
      },
      fileTypeBreakdown,   // [{ type, count, sizeBytes }]
      vaults: vaultSummaries,
      recentActivity,
    });
  } catch (err) {
    console.error("Dashboard Stats Error:", err);
    res.status(500).json({ message: "Server error fetching dashboard stats" });
  }
});

const vaultShareSchema = new mongoose.Schema({
  vaultId:    { type: mongoose.Schema.Types.ObjectId, ref: "Vault",  required: true },
  ownerId:    { type: mongoose.Schema.Types.ObjectId, ref: "User",   required: true },
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: "User",   default: null },
  email:      { type: String, required: true, lowercase: true, trim: true },

  // Role: viewer | editor (owner is never stored here — owner = vault.userId)
  role: {
    type: String,
    enum: ["viewer", "editor"],
    default: "viewer",
  },

  // Granular permission flags
  permissions: {
    view:   { type: Boolean, default: true  },
    upload: { type: Boolean, default: false },
    edit:   { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
    share:  { type: Boolean, default: false },
  },

  // Per-member download toggle (viewers default to false)
  canDownload: { type: Boolean, default: false },

  // Invitation state
  status: {
    type: String,
    enum: ["pending", "active", "revoked"],
    default: "pending",
  },

  // JWT invite token (single-use, expires in 7 days)
  inviteToken:   { type: String,  default: null },
  inviteExpires: { type: Date,    default: null },

  // ZK note: the server NEVER stores the vault encryption key.
  // For password vaults: the invited user must know the vault password to derive the key.
  // For passwordless vaults: owner must share the raw key hex out-of-band (future: E2E key wrap).

  joinedAt:  { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

vaultShareSchema.index({ vaultId: 1, email: 1 }, { unique: true });
const VaultShare = mongoose.model("VaultShare", vaultShareSchema);


// Vault-wide security settings (block all downloads, device restrictions, etc.)
const vaultSecuritySchema = new mongoose.Schema({
  vaultId:           { type: mongoose.Schema.Types.ObjectId, ref: "Vault", required: true, unique: true },
  blockAllDownloads: { type: Boolean, default: false },
  deviceRestricted:  { type: Boolean, default: false },
  isLocked:          { type: Boolean, default: false },
  updatedAt:         { type: Date,    default: Date.now },
});
const VaultSecurity = mongoose.model("VaultSecurity", vaultSecuritySchema);


// Vault-scoped audit log (richer than the global AuditLog)
const vaultAuditSchema = new mongoose.Schema({
  vaultId:    { type: mongoose.Schema.Types.ObjectId, ref: "Vault", required: true },
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: "User",  default: null },
  email:      { type: String, default: "system" },
  action:     { type: String, required: true },  // "File Uploaded", "File Downloaded", etc.
  fileId:     { type: mongoose.Schema.Types.ObjectId, ref: "VaultFile", default: null },
  fileName:   { type: String, default: null },
  ipAddress:  { type: String, default: null },
  userAgent:  { type: String, default: null },
  device:     { type: String, default: "Unknown" },
  browser:    { type: String, default: "Unknown" },
  os:         { type: String, default: "Unknown" },
  location:   { type: String, default: "Unknown" },
  status:     { type: String, enum: ["success", "blocked", "failed"], default: "success" },
  timestamp:  { type: Date, default: Date.now },
});
vaultAuditSchema.index({ vaultId: 1, timestamp: -1 });
const VaultAuditLog = mongoose.model("VaultAuditLog", vaultAuditSchema);


// ════════════════════════════════════════════════════════════
// MIDDLEWARE — vault access check (RBAC)
// Usage: checkVaultAccess("viewer") or checkVaultAccess("editor") or checkVaultAccess("owner")
// ════════════════════════════════════════════════════════════

const checkVaultAccess = (requiredRole = "viewer") => async (req, res, next) => {
  try {
    const { vaultId } = req.params;
    const userId = req.user.userId;

    const vault = await Vault.findOne({ _id: vaultId, isActive: true });
    if (!vault) return res.status(404).json({ message: "Vault not found" });

    // ── isLocked enforcement ───────────────────────────────────────────────
    // Only meaningful for password vaults. Passwordless vaults have no
    // passphrase to re-authenticate against, so isLocked is never set on them.
    // The owner is always let through so they can unlock the vault again.
    if (vault.hasPassword && vault.userId.toString() !== userId) {
      const sec = await VaultSecurity.findOne({ vaultId });
      if (sec?.isLocked) {
        await createVaultAuditLog(vaultId, userId, req.user?.email, "Unauthorized Access", req, null, "blocked");
        return res.status(423).json({
          message: "This vault is locked. Contact the vault owner to unlock it.",
          code: "VAULT_LOCKED",
        });
      }
    }

    // Owner always has full access
    if (vault.userId.toString() === userId) {
      req.vaultRole = "owner";
      req.vault = vault;
      req.isOwner = true;
      return next();
    }

    // Check shared access
    const share = await VaultShare.findOne({
      vaultId,
      userId,
      status: "active",
    });

    if (!share) {
      await createVaultAuditLog(vaultId, userId, req.user.email, "Unauthorized Access", req, null, "blocked");
      return res.status(403).json({ message: "Access denied" });
    }

    const rolePriority = { owner: 3, editor: 2, viewer: 1 };
    if ((rolePriority[share.role] || 0) < (rolePriority[requiredRole] || 1)) {
      return res.status(403).json({ message: `Requires ${requiredRole} access or higher` });
    }

    req.vaultRole  = share.role;
    req.vaultShare = share;
    req.vault      = vault;
    req.isOwner    = false;
    next();
  } catch (err) {
    console.error("checkVaultAccess:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Check a specific permission flag (e.g. "upload", "delete", "share")
const checkPermission = (perm) => (req, res, next) => {
  if (req.isOwner) return next(); // owner bypasses all
  if (!req.vaultShare?.permissions?.[perm]) {
    return res.status(403).json({ message: `You don't have ${perm} permission for this vault` });
  }
  next();
};

// Check download permission (respects vault-wide block too)
const checkDownloadPermission = async (req, res, next) => {
  try {
    if (req.isOwner) return next();

    // Vault-wide security check
    const security = await VaultSecurity.findOne({ vaultId: req.params.vaultId });
    if (security?.blockAllDownloads) {
      return res.status(403).json({ message: "Downloads are disabled for this vault" });
    }

    if (!req.vaultShare?.canDownload) {
      return res.status(403).json({ message: "You don't have download permission for this vault" });
    }
    next();
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};


// ════════════════════════════════════════════════════════════
// HELPER — vault-scoped audit log creator
// ════════════════════════════════════════════════════════════

const geoip = require("geoip-lite");

function getLocationFromIP(ip) {
  if (!ip) return "Unknown";
  const cleanIp = ip.replace(/^::ffff:/, "");
  if (cleanIp === "::1" || cleanIp === "127.0.0.1") return "Local";
  const geo = geoip.lookup(cleanIp);
  if (!geo) return "Unknown";
  return [geo.city, geo.region, geo.country].filter(Boolean).join(", ") || "Unknown";
}

const createVaultAuditLog = async (vaultId, userId, email, action, req, fileInfo = null, status = "success") => {
  try {
    const { device, browser, os } = getDeviceInfo(req);

    const rawIp = req.headers["x-forwarded-for"]?.split(",")[0]?.trim()
               || req.headers["x-real-ip"]
               || req.ip
               || req.connection?.remoteAddress
               || "Unknown";

    await VaultAuditLog.create({
      vaultId,
      userId:    userId  || null,
      email:     email   || "system",
      action,
      fileId:    fileInfo?.id   || null,
      fileName:  fileInfo?.name || null,
      ipAddress: rawIp,
      userAgent: req.headers["user-agent"],
      device, browser, os,
      location:  getLocationFromIP(rawIp),
      status,
    });
  } catch (e) {
    console.warn("VaultAuditLog write failed:", e.message);
  }
};


// ════════════════════════════════════════════════════════════
// EMAIL HELPER — vault share invitation
// ════════════════════════════════════════════════════════════

const sendVaultInviteEmail = async ({ to, senderName, vaultName, role, inviteLink, message }) => {
  const roleLabel = role === "editor" ? "Editor (can upload & edit)" : "Viewer (read only)";
  const { data, error } = await resend.emails.send({
    from: "AirVault <noreply@airvault.me>",
    to,
    subject: `${senderName} invited you to a vault on AirVault`,
    html: `
<!DOCTYPE html>
<html>
<head><style>
  body{font-family:'Segoe UI',sans-serif;background:#0f172a;margin:0;padding:0}
  .wrap{max-width:560px;margin:40px auto;background:linear-gradient(135deg,#1e293b,#0f172a);border-radius:16px;overflow:hidden;border:1px solid #1e3a5f}
  .header{background:linear-gradient(135deg,#3b82f6,#06b6d4);padding:36px 32px;text-align:center}
  .header h1{color:#fff;margin:0;font-size:26px;font-weight:800}
  .body{padding:32px}
  .card{background:rgba(30,58,95,0.4);border:1px solid #1e3a5f;border-radius:12px;padding:20px;margin:20px 0}
  .badge{display:inline-block;padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700;background:rgba(6,182,212,0.15);color:#06b6d4;border:1px solid rgba(6,182,212,0.3)}
  .btn{display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#3b82f6,#06b6d4);color:#fff;text-decoration:none;border-radius:12px;font-weight:700;font-size:15px;margin:20px 0}
  p{color:#94a3b8;line-height:1.7;font-size:14px}
  .footer{background:#060d1a;padding:24px;text-align:center;border-top:1px solid #1e293b}
  .footer p{color:#334155;font-size:12px;margin:4px 0}
</style></head>
<body>
<div class="wrap">
  <div class="header"><h1>🔒 AirVault</h1></div>
  <div class="body">
    <p style="color:#e2e8f0;font-size:18px;font-weight:700">You've been invited!</p>
    <p><strong style="color:#e2e8f0">${senderName}</strong> has invited you to collaborate on a vault.</p>
    <div class="card">
      <p style="margin:0 0 8px;color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px">Vault</p>
      <p style="margin:0 0 12px;color:#f1f5f9;font-size:16px;font-weight:700">${vaultName}</p>
      <p style="margin:0 0 8px;color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px">Your Role</p>
      <span class="badge">${roleLabel}</span>
    </div>
    ${message ? `<div class="card"><p style="color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px">Personal Message</p><p style="margin:0;font-style:italic">"${message}"</p></div>` : ""}
    <p>⚠️ <strong style="color:#f59e0b">Zero-Knowledge Notice:</strong> This vault uses end-to-end encryption. You will need the vault password to access its contents — the server never stores encryption keys.</p>
    <div style="text-align:center"><a href="${inviteLink}" class="btn">Accept Invitation →</a></div>
    <p style="font-size:12px;color:#475569;text-align:center">This link expires in 7 days.</p>
  </div>
  <div class="footer"><p>© 2026 AirVault. Zero-knowledge encrypted storage.</p></div>
</div>
</body>
</html>`,
  });
  if (error) throw new Error(error.message);
  return data;
};


// ════════════════════════════════════════════════════════════
// ROUTES
// ════════════════════════════════════════════════════════════

// ── 1. INVITE USER TO VAULT ──────────────────────────────────────────────────
// POST /api/vaults/:vaultId/members
// Body: { email, role, permissions?, message? }
// Only vault owner can invite.

app.post("/api/vaults/:vaultId/members", authenticateToken, async (req, res) => {
  try {
    const { vaultId } = req.params;
    const { email, role = "viewer", permissions, message } = req.body;

    if (!email?.trim()) return res.status(400).json({ message: "Email is required" });
    if (!["viewer", "editor"].includes(role)) return res.status(400).json({ message: "Invalid role" });

    // Only owner can invite
    const vault = await Vault.findOne({ _id: vaultId, userId: req.user.userId, isActive: true });
    if (!vault) return res.status(404).json({ message: "Vault not found or you are not the owner" });

    // Prevent self-invite
    const sender = await User.findById(req.user.userId);
    if (sender.email === email.toLowerCase().trim()) {
      return res.status(400).json({ message: "You cannot invite yourself" });
    }

    // Check if already a member
    const existing = await VaultShare.findOne({ vaultId, email: email.toLowerCase().trim() });
    if (existing && existing.status !== "revoked") {
      return res.status(400).json({ message: "This user is already a member or has a pending invite" });
    }

    // Default permissions by role
    const defaultPerms = {
      view:   true,
      upload: role === "editor",
      edit:   role === "editor",
      delete: false,
      share:  false,
    };

    const finalPerms = { ...defaultPerms, ...(permissions || {}) };

    // Generate invite token
    const inviteToken = jwt.sign(
      { vaultId, email: email.toLowerCase().trim(), role },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );
    const inviteExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Upsert (allow re-invite if revoked)
    const share = await VaultShare.findOneAndUpdate(
      { vaultId, email: email.toLowerCase().trim() },
      {
        vaultId,
        ownerId:    req.user.userId,
        email:      email.toLowerCase().trim(),
        role,
        permissions: finalPerms,
        canDownload: role === "editor",
        status:      "pending",
        inviteToken,
        inviteExpires,
        updatedAt:   new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Try to link to existing user account
    const invitedUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (invitedUser) {
      share.userId = invitedUser._id;
      await share.save();
    }

    const inviteLink = `${process.env.FRONTEND_URL || "http://localhost:5173"}/vault/accept-invite/${inviteToken}`;

    // Send invite email
    try {
      await sendVaultInviteEmail({
        to:         email,
        senderName: sender.fullName,
        vaultName:  vault.name,
        role,
        inviteLink,
        message,
      });
    } catch (emailErr) {
      console.error("Invite email failed:", emailErr.message);
      // Don't fail the request — share record is already created
    }

    await createVaultAuditLog(vaultId, req.user.userId, req.user.email, "Access Granted", req);
    await createAuditLog(req.user.userId, req.user.email, "VAULT_INVITE_SENT", req);

    res.status(201).json({
      message:    `Invitation sent to ${email}`,
      member: {
        id:          share._id,
        email:       share.email,
        role:        share.role,
        permissions: share.permissions,
        canDownload: share.canDownload,
        status:      share.status,
        createdAt:   share.createdAt,
      },
      inviteLink, // return link in case email fails
    });
  } catch (err) {
    console.error("Invite member error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ── 2. LIST VAULT MEMBERS ────────────────────────────────────────────────────
// GET /api/vaults/:vaultId/members
// Owner + members can view the member list.

app.get("/api/vaults/:vaultId/members", authenticateToken, checkVaultAccess("viewer"), async (req, res) => {
  try {
    const { vaultId } = req.params;

    const shares = await VaultShare.find({
      vaultId,
      status: { $ne: "revoked" },
    }).sort({ createdAt: 1 });

    // Fetch owner info
    const owner = await User.findById(req.vault.userId).select("fullName email profilePicture lastLogin");

    const members = [
      // Owner always first
      {
        id:          owner._id,
        name:        owner.fullName,
        email:       owner.email,
        avatar:      owner.fullName.substring(0, 2).toUpperCase(),
        profilePicture: owner.profilePicture,
        role:        "owner",
        permissions: { view: true, upload: true, edit: true, delete: true, share: true },
        canDownload: true,
        status:      "active",
        lastActivity: owner.lastLogin ? timeAgo(owner.lastLogin) : "Unknown",
        joinDate:    req.vault.createdAt,
        isOwner:     true,
      },
      // Shared members
      ...shares.map((s) => ({
        id:          s._id,
        userId:      s.userId,
        name:        s.email.split("@")[0],
        email:       s.email,
        avatar:      s.email.substring(0, 2).toUpperCase(),
        role:        s.role,
        permissions: s.permissions,
        canDownload: s.canDownload,
        status:      s.status,
        lastActivity: s.joinedAt ? timeAgo(s.joinedAt) : "Pending acceptance",
        joinDate:    s.createdAt,
        isOwner:     false,
      })),
    ];

    // Security settings
    const security = await VaultSecurity.findOne({ vaultId }) || {};

    res.status(200).json({
      members,
      security: {
        blockAllDownloads: security.blockAllDownloads || false,
        deviceRestricted:  security.deviceRestricted  || false,
        isLocked:          security.isLocked          || false,
      },
      vaultInfo: {
        id:          req.vault._id,
        name:        req.vault.name,
        hasPassword: req.vault.hasPassword,
        createdAt:   req.vault.createdAt,
      },
    });
  } catch (err) {
    console.error("List members error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ── 3. UPDATE MEMBER ROLE / PERMISSIONS ────────────────────────────────────
// PATCH /api/vaults/:vaultId/members/:memberId
// Body: { role?, permissions?, canDownload? }
// Only owner can update.

app.patch("/api/vaults/:vaultId/members/:memberId", authenticateToken, async (req, res) => {
  try {
    const { vaultId, memberId } = req.params;
    const { role, permissions, canDownload } = req.body;

    // Only owner can modify members
    const vault = await Vault.findOne({ _id: vaultId, userId: req.user.userId, isActive: true });
    if (!vault) return res.status(403).json({ message: "Only the vault owner can modify members" });

    const share = await VaultShare.findOne({ _id: memberId, vaultId, status: { $ne: "revoked" } });
    if (!share) return res.status(404).json({ message: "Member not found" });

    if (role && ["viewer", "editor"].includes(role)) {
      share.role = role;
      // Reset to role defaults when role changes, then overlay custom perms
      share.permissions = {
        view:   true,
        upload: role === "editor",
        edit:   role === "editor",
        delete: false,
        share:  false,
      };
      share.canDownload = role === "editor";
    }

    if (permissions && typeof permissions === "object") {
      share.permissions = { ...share.permissions, ...permissions };
    }

    if (canDownload !== undefined) {
      share.canDownload = Boolean(canDownload);
    }

    share.updatedAt = new Date();
    await share.save();

    await createVaultAuditLog(vaultId, req.user.userId, req.user.email, "Access Granted", req);

    res.status(200).json({
      message: "Member updated",
      member: {
        id:          share._id,
        email:       share.email,
        role:        share.role,
        permissions: share.permissions,
        canDownload: share.canDownload,
        status:      share.status,
      },
    });
  } catch (err) {
    console.error("Update member error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ── 4. REMOVE / REVOKE MEMBER ────────────────────────────────────────────────
// DELETE /api/vaults/:vaultId/members/:memberId
// Only owner can remove members.

app.delete("/api/vaults/:vaultId/members/:memberId", authenticateToken, async (req, res) => {
  try {
    const { vaultId, memberId } = req.params;

    const vault = await Vault.findOne({ _id: vaultId, userId: req.user.userId, isActive: true });
    if (!vault) return res.status(403).json({ message: "Only the vault owner can remove members" });

    const share = await VaultShare.findOne({ _id: memberId, vaultId });
    if (!share) return res.status(404).json({ message: "Member not found" });

    share.status    = "revoked";
    share.updatedAt = new Date();
    await share.save();

    await createVaultAuditLog(vaultId, req.user.userId, req.user.email, "Access Revoked", req);

    res.status(200).json({ message: "Member access revoked" });
  } catch (err) {
    console.error("Remove member error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ── 5. ACCEPT VAULT INVITATION ───────────────────────────────────────────────
// POST /api/vaults/accept-invite
// Body: { token }
// Called when invited user clicks the link in their email.

app.post("/api/vaults/accept-invite", authenticateToken, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: "Invite token is required" });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
    } catch {
      return res.status(400).json({ message: "Invalid or expired invite link" });
    }

    const { vaultId, email } = decoded;

    // Must be the invited email
    const user = await User.findById(req.user.userId);
    if (user.email !== email) {
      return res.status(403).json({ message: "This invite was sent to a different email address" });
    }

    const share = await VaultShare.findOne({ vaultId, email, status: "pending" });
    if (!share) return res.status(404).json({ message: "Invite not found or already accepted" });

    if (share.inviteExpires && share.inviteExpires < new Date()) {
      return res.status(400).json({ message: "Invite link has expired" });
    }

    share.status      = "active";
    share.userId      = req.user.userId;
    share.joinedAt    = new Date();
    share.inviteToken = null; // consume token
    share.updatedAt   = new Date();
    await share.save();

    // Fetch vault info to return to client
    const vault = await Vault.findById(vaultId).select("name hasPassword passwordHint");

    await createVaultAuditLog(vaultId, req.user.userId, req.user.email, "Vault Accessed", req);

    res.status(200).json({
      message:    "Invitation accepted! You now have access to the vault.",
      vault: {
        id:          vault._id,
        name:        vault.name,
        hasPassword: vault.hasPassword,
        passwordHint: vault.passwordHint,
      },
      role:        share.role,
      permissions: share.permissions,
      canDownload: share.canDownload,
      // ZK note: if vault has a password, user must unlock it with the vault password
      // (same flow as owner). The server does NOT provide the key.
      zkNote: vault.hasPassword
        ? "This vault is password-protected. Ask the vault owner for the vault password to decrypt files."
        : "This vault uses a device-stored key. Contact the vault owner to get access to files.",
    });
  } catch (err) {
    console.error("Accept invite error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ── 6. GET VAULTS SHARED WITH ME ────────────────────────────────────────────
// GET /api/vaults/shared
// Returns all vaults the authenticated user has been invited to.

app.get("/api/vaults/shared", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("email");

    const shares = await VaultShare.find({
      email:  user.email,
      status: "active",
    });

    const vaultIds = shares.map((s) => s.vaultId);
    const vaults   = await Vault.find({ _id: { $in: vaultIds }, isActive: true });

    const result = shares.map((share) => {
      const vault = vaults.find((v) => v._id.toString() === share.vaultId.toString());
      if (!vault) return null;
      return {
        id:          vault._id,
        name:        vault.name,
        description: vault.description,
        hasPassword: vault.hasPassword,
        role:        share.role,
        permissions: share.permissions,
        canDownload: share.canDownload,
        joinedAt:    share.joinedAt,
      };
    }).filter(Boolean);

    res.status(200).json({ vaults: result });
  } catch (err) {
    console.error("Shared vaults error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ── 7. UPDATE VAULT-WIDE SECURITY SETTINGS ──────────────────────────────────
// PATCH /api/vaults/:vaultId/security
// Body: { blockAllDownloads?, deviceRestricted?, isLocked? }
// Only owner.

app.patch("/api/vaults/:vaultId/security", authenticateToken, async (req, res) => {
  try {
    const { vaultId } = req.params;
    const { blockAllDownloads, deviceRestricted, isLocked } = req.body;

    const vault = await Vault.findOne({ _id: vaultId, userId: req.user.userId, isActive: true });
    if (!vault) return res.status(403).json({ message: "Only the vault owner can change security settings" });

    const update = { updatedAt: new Date() };
    if (blockAllDownloads !== undefined) update.blockAllDownloads = Boolean(blockAllDownloads);
    if (deviceRestricted  !== undefined) update.deviceRestricted  = Boolean(deviceRestricted);
    if (isLocked !== undefined) {
      // isLocked only makes sense for password-protected vaults.
      // Passwordless vaults have no passphrase to re-authenticate against,
      // so locking them is purely cosmetic and we refuse it.
      if (isLocked && !vault.hasPassword) {
        return res.status(400).json({
          message: "Cannot lock a passwordless vault. Set a vault password first to enable locking.",
          code: "NO_PASSWORD_SET",
        });
      }
      update.isLocked = Boolean(isLocked);
    }

    const security = await VaultSecurity.findOneAndUpdate(
      { vaultId },
      { $set: { vaultId, ...update } },
      { upsert: true, new: true }
    );

    await createVaultAuditLog(vaultId, req.user.userId, req.user.email, "Security Updated", req);

    res.status(200).json({
      message:  "Security settings updated",
      security: {
        blockAllDownloads: security.blockAllDownloads,
        deviceRestricted:  security.deviceRestricted,
        isLocked:          security.isLocked,
      },
    });
  } catch (err) {
    console.error("Security update error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ── 8. GET VAULT SECURITY SETTINGS ──────────────────────────────────────────
// GET /api/vaults/:vaultId/security

app.get("/api/vaults/:vaultId/security", authenticateToken, checkVaultAccess("viewer"), async (req, res) => {
  try {
    const { vaultId } = req.params;
    const security = await VaultSecurity.findOne({ vaultId });
    res.status(200).json({
      security: {
        blockAllDownloads: security?.blockAllDownloads || false,
        deviceRestricted:  security?.deviceRestricted  || false,
        isLocked:          security?.isLocked          || false,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});


// ── 9. ZK SALT — SHARED ACCESS ──────────────────────────────────────────────
// Shared members also need the ZK salt to re-derive the key.
// The existing GET /api/vaults/:vaultId/zk-salt now needs to allow shared members too.
// Replace the existing zk-salt GET route with this version:

app.get("/api/vaults/:vaultId/zk-salt/shared", authenticateToken, async (req, res) => {
  try {
    const { vaultId } = req.params;

    // Allow owner OR active member
    const vault = await Vault.findOne({ _id: vaultId, isActive: true });
    if (!vault) return res.status(404).json({ message: "Vault not found" });

    const isOwner = vault.userId.toString() === req.user.userId;
    if (!isOwner) {
      const user  = await User.findById(req.user.userId).select("email");
      const share = await VaultShare.findOne({ vaultId, email: user.email, status: "active" });
      if (!share) return res.status(403).json({ message: "Access denied" });
    }

    const record = await ZKSalt.findOne({ vaultId });
    if (!record) return res.status(404).json({ message: "No ZK salt found for this vault" });

    // The salt is safe to share — without the passphrase it's useless
    res.status(200).json({ saltB64: record.saltB64 });
  } catch (err) {
    console.error("ZK Salt shared fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ════════════════════════════════════════════════════════════
// ACCESS LOG ROUTES
// ════════════════════════════════════════════════════════════

// ── 10. GET VAULT ACCESS LOG ─────────────────────────────────────────────────
// GET /api/vaults/:vaultId/access-log
// Query params: ?page=1&limit=50&action=&status=
// Owner and editors can view.

app.get("/api/vaults/:vaultId/access-log", authenticateToken, checkVaultAccess("viewer"), async (req, res) => {
  try {
    const { vaultId } = req.params;
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(100, parseInt(req.query.limit) || 50);
    const skip   = (page - 1) * limit;
    const action = req.query.action  || null;
    const status = req.query.status  || null;
    const search = req.query.search  || null;

    const query = { vaultId: new mongoose.Types.ObjectId(vaultId) };
    if (action && action !== "All") query.action = action;
    if (status && status !== "All") query.status = status;
    if (search) {
      const re = new RegExp(search, "i");
      query.$or = [{ action: re }, { email: re }, { fileName: re }, { location: re }];
    }

    const [logs, total] = await Promise.all([
      VaultAuditLog.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      VaultAuditLog.countDocuments(query),
    ]);

    // Stats for the cards at the top
    const [statsAgg] = await VaultAuditLog.aggregate([
      { $match: { vaultId: new mongoose.Types.ObjectId(vaultId) } },
      {
        $group: {
          _id:          null,
          totalEvents:  { $sum: 1 },
          blocked:      { $sum: { $cond: [{ $eq: ["$status", "blocked"] }, 1, 0] } },
          fileActions:  { $sum: { $cond: [{ $in: ["$action", ["File Uploaded", "File Downloaded", "File Accessed", "File Deleted"]] }, 1, 0] } },
          uniqueUsers:  { $addToSet: "$email" },
        },
      },
    ]);

    const stats = statsAgg
      ? {
          totalEvents:  statsAgg.totalEvents,
          threatsBlocked: statsAgg.blocked,
          fileActions:  statsAgg.fileActions,
          uniqueUsers:  statsAgg.uniqueUsers.length,
        }
      : { totalEvents: 0, threatsBlocked: 0, fileActions: 0, uniqueUsers: 0 };

    res.status(200).json({
      logs: logs.map((l) => ({
        id:        l._id,
        action:    l.action,
        file:      l.fileName || "—",
        user:      l.email === req.user.email ? "You" : (l.email || "System"),
        ip:        l.ipAddress  || "—",
        device:    l.device     || "Unknown",
        location:  l.location   || "Unknown",
        time:      l.timestamp,
        status:    l.status,
        browser:   l.browser,
        os:        l.os,
      })),
      stats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Access log error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ── 11. LOG A VAULT EVENT (internal helper exposed as endpoint) ───────────────
// POST /api/vaults/:vaultId/access-log
// Body: { action, fileName?, status? }
// Clients call this to log events like "File Accessed" that happen client-side.

app.post("/api/vaults/:vaultId/access-log", authenticateToken, checkVaultAccess("viewer"), async (req, res) => {
  try {
    const { vaultId } = req.params;
    const { action, fileName, fileId, status = "success" } = req.body;

    if (!action) return res.status(400).json({ message: "action is required" });

    await createVaultAuditLog(
      vaultId,
      req.user.userId,
      req.user.email,
      action,
      req,
      { id: fileId, name: fileName },
      status
    );

    res.status(201).json({ ok: true });
  } catch (err) {
    console.error("Log event error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ── 12. EXPORT ACCESS LOG CSV ────────────────────────────────────────────────
// GET /api/vaults/:vaultId/access-log/export

app.get("/api/vaults/:vaultId/access-log/export", authenticateToken, checkVaultAccess("viewer"), async (req, res) => {
  try {
    const { vaultId } = req.params;

    // In export route:
    const logs = await VaultAuditLog.find({ vaultId: new mongoose.Types.ObjectId(vaultId) })
      .sort({ timestamp: -1 })
      .limit(5000)
      .lean();

    const header = "Action,File,User,IP Address,Device,Location,Time,Status\n";
    const rows = logs.map((l) =>
      [
        `"${l.action}"`,
        `"${l.fileName || "—"}"`,
        `"${l.email || "system"}"`,
        `"${l.ipAddress || "—"}"`,
        `"${l.device || "Unknown"}"`,
        `"${l.location || "Unknown"}"`,
        `"${new Date(l.timestamp).toISOString()}"`,
        `"${l.status}"`,
      ].join(",")
    ).join("\n");

    const csv = header + rows;
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="access-log-${vaultId}.csv"`);
    res.status(200).send(csv);
  } catch (err) {
    console.error("Export log error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ── 14. COPY-LINK / INVITE LINK STATUS ──────────────────────────────────────
// GET /api/vaults/:vaultId/invite-link
// Returns the current invite link. Owner only.

app.get("/api/vaults/:vaultId/invite-link", authenticateToken, async (req, res) => {
  try {
    const vault = await Vault.findOne({ _id: req.params.vaultId, userId: req.user.userId, isActive: true });
    if (!vault) return res.status(403).json({ message: "Access denied" });

    // Generate a generic signed link (not tied to a specific email — anyone with it can request access)
    const linkToken = jwt.sign(
      { vaultId: req.params.vaultId, type: "vault-link" },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" }
    );
    const link = `${process.env.FRONTEND_URL || "http://localhost:5173"}/vault/join/${linkToken}`;
    res.status(200).json({ link });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});


// ════════════════════════════════════════════════════════════
// UTILITY — add to top of server with your other helpers
// ════════════════════════════════════════════════════════════

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60)    return "Just now";
  if (seconds < 3600)  return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}

// Store raw key for passwordless vaults
app.post("/api/vaults/:vaultId/zk-key", authenticateToken, async (req, res) => {
  try {
    const { vaultId } = req.params;
    const { keyHex } = req.body;
    if (!keyHex) return res.status(400).json({ message: "keyHex is required" });

    // Ownership check
    const vault = await Vault.findOne({ _id: vaultId, userId: req.user.userId, isActive: true });
    if (!vault) return res.status(404).json({ message: "Vault not found" });

    // Upsert — always update so the key is always fresh
    await ZKSalt.findOneAndUpdate(
      { vaultId },
      { vaultId, userId: req.user.userId, saltB64: keyHex, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    res.status(200).json({ message: "Key stored" });
  } catch (err) {
    console.error("ZK Key Store Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get raw key for passwordless vaults
// ✅ FIX: query by vaultId only (not userId) — ZKSalt has one record per vault
app.get("/api/vaults/:vaultId/zk-key", authenticateToken, async (req, res) => {
  try {
    const { vaultId } = req.params;

    // Still enforce ownership before returning the key
    const vault = await Vault.findOne({ _id: vaultId, userId: req.user.userId, isActive: true });
    if (!vault) return res.status(404).json({ message: "Vault not found" });

    // Query by vaultId only — don't filter by userId on ZKSalt
    const record = await ZKSalt.findOne({ vaultId });
    if (!record) return res.status(404).json({ message: "No key found" });

    res.status(200).json({ keyHex: record.saltB64 });
  } catch (err) {
    console.error("ZK Key Fetch Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/debug/file/:fileId", authenticateToken, async (req, res) => {
  const file = await VaultFile.findById(req.params.fileId);
  if (!file) return res.status(404).json({ message: "not found" });
  res.json({
    storedKey:    file.storedKey,
    isEncrypted:  file.isEncrypted,
    size:         file.size,
    mimeType:     file.mimeType,
    originalName: file.originalName,
  });
});

app.get("/api/vaults/join/:vaultId", async (req, res) => {
  try {
    const { vaultId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(vaultId)) {
      return res.status(400).json({ message: "Invalid vault ID" });
    }

    const vault = await Vault.findOne({ _id: vaultId, isActive: true });
    if (!vault) {
      return res.status(404).json({ message: "Vault not found or no longer available" });
    }

    // Return only public info — never expose passwordHash, userId, etc.
    res.status(200).json({
      vault: {
        id:           vault._id,
        name:         vault.name,
        description:  vault.description || "",
        hasPassword:  vault.hasPassword,
        passwordHint: vault.passwordHint || null,
        createdAt:    vault.createdAt,
      },
    });
  } catch (error) {
    console.error("Vault Join Info Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});


// ── POST /api/vaults/join/:vaultId  ──────────────────────────────────────────
// AUTHENTICATED — instantly adds the user as an active vault member.
// No pending state, no approval needed.

app.post("/api/vaults/join/:vaultId", authenticateToken, async (req, res) => {
  try {
    const { vaultId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(vaultId)) {
      return res.status(400).json({ message: "Invalid vault ID" });
    }

    const vault = await Vault.findOne({ _id: vaultId, isActive: true });
    if (!vault) {
      return res.status(404).json({ message: "Vault not found" });
    }

    const user = await User.findById(req.user.userId).select("fullName email");
    if (!user) return res.status(404).json({ message: "User not found" });

    // Owner can't join their own vault
    if (vault.userId.toString() === req.user.userId) {
      return res.status(400).json({
        message:      "This is your own vault.",
        alreadyOwner: true,
        vault:        { id: vault._id, name: vault.name },
      });
    }

    // Check for existing active share
    const existing = await VaultShare.findOne({ vaultId, email: user.email });

    if (existing) {
      if (existing.status === "active") {
        return res.status(200).json({
          message:       "You already have access to this vault.",
          alreadyMember: true,
          vault:         { id: vault._id, name: vault.name },
        });
      }

      // If there's a stale pending/revoked share, reactivate it instantly
      existing.status   = "active";
      existing.joinedAt = new Date();
      await existing.save();

      return res.status(200).json({
        message: "Welcome back! You've rejoined the vault.",
        vault:   { id: vault._id, name: vault.name },
      });
    }

    // Create a new active share instantly
    await VaultShare.create({
      vaultId,
      ownerId:     vault.userId,
      userId:      req.user.userId,
      email:       user.email,
      role:        "viewer",
      permissions: { view: true, upload: false, edit: false, delete: false, share: false },
      canDownload: false,
      status:      "active",   // ← instant, no approval needed
      joinedAt:    new Date(),
    });

    // Optional: notify vault owner that someone joined
    try {
      const owner = await User.findById(vault.userId).select("email fullName");
      if (owner) {
        await resend.emails.send({
          from:    "AirVault <noreply@airvault.me>",
          to:      owner.email,
          subject: `${user.fullName} joined your vault "${vault.name}"`,
          html: `
<!DOCTYPE html>
<html>
<head><style>
  body{font-family:'Segoe UI',sans-serif;background:#0f172a;margin:0;padding:0}
  .wrap{max-width:520px;margin:40px auto;background:linear-gradient(135deg,#1e293b,#0f172a);border-radius:16px;overflow:hidden;border:1px solid #1e3a5f}
  .hdr{background:linear-gradient(135deg,#3b82f6,#06b6d4);padding:32px;text-align:center}
  .hdr h1{color:#fff;margin:0;font-size:22px;font-weight:800}
  .body{padding:28px}
  p{color:#94a3b8;line-height:1.7;font-size:14px;margin:0 0 16px}
  .card{background:rgba(30,58,95,0.4);border:1px solid #1e3a5f;border-radius:12px;padding:18px;margin:16px 0}
  .btn{display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#3b82f6,#06b6d4);color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px}
  .footer{background:#060d1a;padding:20px;text-align:center;border-top:1px solid #1e293b}
  .footer p{color:#334155;font-size:11px;margin:4px 0}
</style></head>
<body>
<div class="wrap">
  <div class="hdr"><h1>🔒 AirVault — New Member</h1></div>
  <div class="body">
    <p style="color:#e2e8f0;font-size:16px;font-weight:600">Someone joined your vault</p>
    <div class="card">
      <p style="margin:0 0 4px;color:#f1f5f9;font-size:15px;font-weight:700">${user.fullName}</p>
      <p style="margin:0;color:#64748b;font-size:13px">${user.email}</p>
    </div>
    <p>They now have viewer access to <strong style="color:#f1f5f9">${vault.name}</strong>. You can manage their permissions from the Members page.</p>
    <div style="text-align:center;margin:24px 0">
      <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/vault/${vaultId}/members" class="btn">Manage Members →</a>
    </div>
  </div>
  <div class="footer"><p>© 2026 AirVault. Zero-knowledge encrypted storage.</p></div>
</div>
</body>
</html>`,
        });
      }
    } catch (emailErr) {
      console.warn("Join notification email failed:", emailErr.message);
      // Don't fail the request if email fails
    }

    // "Access Granted" matches ACTION_CONFIG in AccessLog.jsx
    await createVaultAuditLog(vaultId, req.user.userId, user.email, "Access Granted", req);

    res.status(201).json({
      message: `You've successfully joined "${vault.name}"!`,
      vault:   { id: vault._id, name: vault.name },
    });

  } catch (error) {
    console.error("Vault Join Error:", error);
    res.status(500).json({ message: "Server error during vault join" });
  }
});

app.patch("/api/vaults/:vaultId/password", authenticateToken, async (req, res) => {
  try {
    const { vaultId } = req.params;
    const { action, newPassword, currentPassword, saltB64 } = req.body;

    if (!["set", "change", "remove"].includes(action)) {
      return res.status(400).json({ message: "Invalid action" });
    }

    const vault = await Vault.findOne({ _id: vaultId, userId: req.user.userId, isActive: true });
    if (!vault) return res.status(404).json({ message: "Vault not found or access denied" });

    if (action === "set") {
      if (vault.hasPassword) return res.status(400).json({ message: "Vault already has a password. Use 'change'." });
      if (!newPassword || newPassword.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });

      vault.hasPassword  = true;
      vault.passwordHash = await bcrypt.hash(newPassword, 12);
      await vault.save();

      if (saltB64) {
        await ZKSalt.findOneAndUpdate(
          { vaultId },
          { vaultId, userId: req.user.userId, saltB64, updatedAt: new Date() },
          { upsert: true, new: true }
        );
      }

      await createAuditLog(req.user.userId, req.user.email, "VAULT_PASSWORD_SET", req);
      await createVaultAuditLog(vaultId, req.user.userId, req.user.email, "Security Updated", req);
      return res.status(200).json({ message: "Vault password set successfully", hasPassword: true });
    }

    if (action === "change") {
      if (!vault.hasPassword) return res.status(400).json({ message: "No password set. Use 'set'." });
      if (!currentPassword) return res.status(400).json({ message: "Current password required" });
      if (!newPassword || newPassword.length < 6) return res.status(400).json({ message: "New password must be at least 6 characters" });

      const isValid = await bcrypt.compare(currentPassword, vault.passwordHash);
      if (!isValid) return res.status(401).json({ message: "Current password is incorrect" });

      vault.passwordHash = await bcrypt.hash(newPassword, 12);
      await vault.save();

      if (saltB64) {
        await ZKSalt.findOneAndUpdate(
          { vaultId },
          { vaultId, userId: req.user.userId, saltB64, updatedAt: new Date() },
          { upsert: true, new: true }
        );
      }

      await createAuditLog(req.user.userId, req.user.email, "VAULT_PASSWORD_CHANGED", req);
      await createVaultAuditLog(vaultId, req.user.userId, req.user.email, "Security Updated", req);
      return res.status(200).json({ message: "Password changed successfully", hasPassword: true });
    }

    if (action === "remove") {
      if (!vault.hasPassword) return res.status(400).json({ message: "No password to remove" });
      if (!currentPassword) return res.status(400).json({ message: "Current password required to remove it" });

      const isValid = await bcrypt.compare(currentPassword, vault.passwordHash);
      if (!isValid) return res.status(401).json({ message: "Current password is incorrect" });

      vault.hasPassword  = false;
      vault.passwordHash = null;
      vault.passwordHint = null;
      await vault.save();

      // Auto-unlock if was locked
      await VaultSecurity.findOneAndUpdate({ vaultId }, { $set: { isLocked: false } });
      // Remove ZK salt
      await ZKSalt.deleteOne({ vaultId });

      await createAuditLog(req.user.userId, req.user.email, "VAULT_PASSWORD_REMOVED", req);
      await createVaultAuditLog(vaultId, req.user.userId, req.user.email, "Security Updated", req);
      return res.status(200).json({ message: "Password removed successfully", hasPassword: false });
    }

  } catch (error) {
    console.error("Vault Password Update Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// LOGOUT
app.post("/api/auth/logout", authenticateToken, async (req, res) => {
  try {
    await createAuditLog(req.user.userId, req.user.email, "LOGOUT", req);
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Error logging out" });
      }
      res.status(200).json({ message: "Logged out successfully" });
    });
  } catch (error) {
    console.error("Logout Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// CHECK SESSION
app.get("/api/auth/check-session", (req, res) => {
  if (req.session.userId) {
    res
      .status(200)
      .json({
        isAuthenticated: true,
        userId: req.session.userId,
        email: req.session.email,
      });
  } else {
    res.status(401).json({ isAuthenticated: false });
  }
});

// ERROR HANDLER
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
    error: process.env.NODE_ENV === "development" ? err : {},
  });
});

// 404 HANDLER
app.use((req, res) => {
  res.status(404).json({ message: "API route not found" });
});

// START SERVER
app.listen(PORT, () => {
  console.log(`AirVault Server Running on Port ${PORT}`);
});
