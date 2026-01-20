// ====================================
// AIRVAULT BACKEND SERVER - COMPLETE
// ====================================

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const cors = require('cors');
const session = require('express-session');
const { MongoStore } = require('connect-mongo');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');
const fs = require('fs');


// ====================================
// APP INITIALIZATION
// ====================================
const app = express();
const PORT = process.env.PORT || 5000;
app.set("trust proxy", 1);
// ====================================
// MIDDLEWARE
// ====================================
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// IMPORTANT: CORS must come BEFORE other middleware
app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    'http://localhost:5173', // For local development
    'http://localhost:3000'  // Alternative local port
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['set-cookie']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));
app.use("/assets", express.static(path.join(__dirname, "src/assets")));

// ====================================
// DATABASE CONNECTION
// ====================================
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  });

// Session Configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'airvault-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({
    mongoUrl: process.env.MONGODB_URI,
    touchAfter: 24 * 3600
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { message: 'Too many login attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      message: 'Too many login attempts from this IP, please try again after 15 minutes',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// ====================================
// FILE UPLOAD CONFIGURATION
// ====================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/profiles';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
});

// ====================================
// DATABASE MODELS
// ====================================

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  profilePicture: { type: String, default: null },
  isVerified: { type: Boolean, default: false },
  vaultCreated: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date }
});

const User = mongoose.model('User', userSchema);

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  type: { type: String, enum: ['signup', 'login', 'forgot-password'], required: true },
  createdAt: { type: Date, default: Date.now, expires: 600 }
});

const OTP = mongoose.model('OTP', otpSchema);

const auditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  email: { type: String, required: true },
  action: { type: String, required: true },
  ipAddress: String,
  userAgent: String,
  device: String,
  browser: String,
  os: String,
  location: String,
  success: { type: Boolean, default: true },
  timestamp: { type: Date, default: Date.now }
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

// ====================================
// EMAIL CONFIGURATION
// ====================================
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'smtp.gmail.com',
  port: Number(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

const sendOTPEmail = async (email, otp, userName) => {
  const mailOptions = {
    from: `"AirVault Security" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your AirVault Verification Code',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', sans-serif; background-color: #0f172a; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3); }
          .header { background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); padding: 40px 30px; text-align: center; }
          .logo { width: 60px; height: 60px; background: white; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 15px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2); }
          .logo img { width: 36px; height: 36px; }
          .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 700; }
          .content { padding: 40px 30px; color: #cbd5e1; }
          .greeting { font-size: 18px; margin-bottom: 20px; color: #e2e8f0; }
          .message { font-size: 15px; line-height: 1.6; margin-bottom: 30px; color: #94a3b8; }
          .otp-box { background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); border: 2px solid #3b82f6; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0; }
          .otp-label { font-size: 14px; color: #93c5fd; margin-bottom: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
          .otp-code { font-size: 48px; font-weight: 700; color: white; letter-spacing: 8px; margin: 10px 0; font-family: 'Courier New', monospace; }
          .expiry { font-size: 13px; color: #cbd5e1; margin-top: 15px; }
          .warning { background: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; padding: 15px; margin: 25px 0; border-radius: 8px; font-size: 14px; color: #fca5a5; }
          .footer { background: #0f172a; padding: 30px; text-align: center; border-top: 1px solid #1e293b; }
          .footer p { color: #64748b; font-size: 13px; margin: 5px 0; }
          .footer-link { color: #3b82f6; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">
              <img src="${process.env.BACKEND_URL}/assets/shield.png" alt="AirVault Shield" />
            </div>
            <h1>AirVault</h1>
          </div>
          <div class="content">
            <div class="greeting">Hi ${userName || 'there'},</div>
            <div class="message">You recently tried to log in from a new device, browser, or location. In order to complete your login, please use the verification code below.</div>
            <div class="otp-box">
              <div class="otp-label">Your Verification Code</div>
              <div class="otp-code">${otp}</div>
              <div class="expiry">â± This code expires in 10 minutes</div>
            </div>
            <div class="message">Enter this code in the verification screen to continue accessing your secure vault.</div>
            <div class="warning"><strong>âš ï¸ Security Notice:</strong> If this wasn't you, your account may be compromised. Please secure your account immediately.</div>
          </div>
          <div class="footer">
            <p>This is an automated message from AirVault Security System.</p>
            <p>Â© ${new Date().getFullYear()} AirVault. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
  await transporter.sendMail(mailOptions);
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

  if (password.length < minLength) return { valid: false, message: 'Password must be at least 8 characters long' };
  if (!hasUpperCase) return { valid: false, message: 'Password must contain at least one uppercase letter' };
  if (!hasLowerCase) return { valid: false, message: 'Password must contain at least one lowercase letter' };
  if (!hasNumber) return { valid: false, message: 'Password must contain at least one number' };
  if (!hasSpecialChar) return { valid: false, message: 'Password must contain at least one special character' };

  return { valid: true };
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const getDeviceInfo = (req) => {
  const userAgent = req.headers['user-agent'] || '';
  let device = 'Unknown', browser = 'Unknown', os = 'Unknown';

  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac')) os = 'MacOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iOS')) os = 'iOS';

  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Edge')) browser = 'Edge';

  if (userAgent.includes('Mobile')) device = 'Mobile';
  else if (userAgent.includes('Tablet')) device = 'Tablet';
  else device = 'Desktop';

  return { device, browser, os };
};

const createAuditLog = async (userId, email, action, req, success = true) => {
  const { device, browser, os } = getDeviceInfo(req);
  const ipAddress = req.ip || req.connection.remoteAddress;
  await AuditLog.create({ userId, email, action, ipAddress, userAgent: req.headers['user-agent'], device, browser, os, success, timestamp: new Date() });
};

// ====================================
// AUTHENTICATION MIDDLEWARE
// ====================================
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access token required' });

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// ====================================
// API ROUTES
// ====================================

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'AirVault API is running', timestamp: new Date().toISOString() });
});

// SIGNUP
app.post('/api/auth/signup', authLimiter, upload.single('profilePicture'), async (req, res) => {
  try {
    const { fullName, email, password, confirmPassword } = req.body;

    if (!fullName || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ message: passwordValidation.message });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const otp = generateOTP();

    // Save OTP first
    await OTP.create({ email, otp, type: 'signup' });
    
    // Try to send email
    try {
      await sendOTPEmail(email, otp, fullName);
      console.log('✅ Signup OTP email sent successfully to:', email);
    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError.message);
      // Delete the OTP since email failed
      await OTP.deleteMany({ email, type: 'signup' });
      
      return res.status(503).json({ 
        message: 'Unable to send verification email. Please check your email configuration or try again later.',
        error: 'EMAIL_SERVICE_UNAVAILABLE'
      });
    }

    req.session.tempUserData = {
      fullName,
      email,
      password: hashedPassword,
      profilePicture: req.file ? `/uploads/profiles/${req.file.filename}` : null
    };

    res.status(200).json({ 
      message: 'OTP sent to your email', 
      email, 
      requiresOTP: true 
    });
  } catch (error) {
    console.error('❌ Signup Error:', error);
    res.status(500).json({ 
      message: 'Server error during signup',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
// VERIFY SIGNUP OTP
app.post('/api/auth/verify-signup-otp', authLimiter, async (req, res) => {
  try {
    const { email, otp } = req.body;
    const otpRecord = await OTP.findOne({ email, otp, type: 'signup' });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const tempUserData = req.session.tempUserData;
    if (!tempUserData || tempUserData.email !== email) {
      return res.status(400).json({ message: 'Session expired. Please signup again' });
    }

    const newUser = await User.create({
      fullName: tempUserData.fullName,
      email: tempUserData.email,
      password: tempUserData.password,
      profilePicture: tempUserData.profilePicture,
      isVerified: true,
      lastLogin: new Date()
    });

    await OTP.deleteOne({ _id: otpRecord._id });
    delete req.session.tempUserData;
    await createAuditLog(newUser._id, email, 'SIGNUP_SUCCESS', req);

    const token = jwt.sign({ userId: newUser._id, email: newUser.email }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });

    req.session.userId = newUser._id;
    req.session.email = newUser.email;

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: { id: newUser._id, fullName: newUser.fullName, email: newUser.email, profilePicture: newUser.profilePicture, vaultCreated: newUser.vaultCreated },
      redirectTo: '/createvaults'
    });
  } catch (error) {
    console.error('OTP Verification Error:', error);
    res.status(500).json({ message: 'Server error during verification' });
  }
});

// LOGIN
app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      await createAuditLog(null, email, 'LOGIN_FAILED', req, false);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      await createAuditLog(user._id, email, 'LOGIN_FAILED', req, false);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const otp = generateOTP();
    
    // Save OTP first
    await OTP.create({ email, otp, type: 'login' });
    
    // Try to send email
    try {
      await sendOTPEmail(email, otp, user.fullName);
      console.log('✅ OTP email sent successfully to:', email);
    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError.message);
      // Delete the OTP since email failed
      await OTP.deleteMany({ email, type: 'login' });
      
      return res.status(503).json({ 
        message: 'Unable to send verification email. Please check your email configuration or try again later.',
        error: 'EMAIL_SERVICE_UNAVAILABLE'
      });
    }

    req.session.tempLoginUserId = user._id.toString();

    res.status(200).json({ 
      message: 'OTP sent to your email', 
      email, 
      requiresOTP: true 
    });
  } catch (error) {
    console.error('❌ Login Error:', error);
    res.status(500).json({ 
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// VERIFY LOGIN OTP
app.post('/api/auth/verify-login-otp', authLimiter, async (req, res) => {
  try {
    const { email, otp } = req.body;
    const otpRecord = await OTP.findOne({ email, otp, type: 'login' });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.lastLogin = new Date();
    await user.save();

    await OTP.deleteOne({ _id: otpRecord._id });
    delete req.session.tempLoginUserId;
    await createAuditLog(user._id, email, 'LOGIN_SUCCESS', req);

    const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '7d' });

    req.session.userId = user._id;
    req.session.email = user.email;

    const redirectTo = user.vaultCreated ? '/dashboard' : '/createvaults';

    res.status(200).json({
      message: 'Login successful',
      token,
      user: { id: user._id, fullName: user.fullName, email: user.email, profilePicture: user.profilePicture, vaultCreated: user.vaultCreated },
      redirectTo
    });
  } catch (error) {
    console.error('OTP Verification Error:', error);
    res.status(500).json({ message: 'Server error during verification' });
  }
});

// FORGOT PASSWORD
app.post('/api/auth/forgot-password', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({ message: 'If the email exists, an OTP has been sent' });
    }

    const otp = generateOTP();
    
    // Save OTP first
    await OTP.create({ email, otp, type: 'forgot-password' });
    
    // Try to send email
    try {
      await sendOTPEmail(email, otp, user.fullName);
      console.log('✅ Forgot password OTP email sent successfully to:', email);
    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError.message);
      // Delete the OTP since email failed
      await OTP.deleteMany({ email, type: 'forgot-password' });
      
      return res.status(503).json({ 
        message: 'Unable to send verification email. Please check your email configuration or try again later.',
        error: 'EMAIL_SERVICE_UNAVAILABLE'
      });
    }

    res.status(200).json({ 
      message: 'OTP sent to your email', 
      email, 
      requiresOTP: true 
    });
  } catch (error) {
    console.error('❌ Forgot Password Error:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
// VERIFY FORGOT PASSWORD OTP
app.post('/api/auth/verify-forgot-password-otp', authLimiter, async (req, res) => {
  try {
    const { email, otp } = req.body;
    const otpRecord = await OTP.findOne({ email, otp, type: 'forgot-password' });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const resetToken = jwt.sign({ email }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '15m' });
    await OTP.deleteOne({ _id: otpRecord._id });

    res.status(200).json({ message: 'OTP verified successfully', resetToken, canResetPassword: true });
  } catch (error) {
    console.error('OTP Verification Error:', error);
    res.status(500).json({ message: 'Server error during verification' });
  }
});

// RESET PASSWORD
app.post('/api/auth/reset-password', authLimiter, async (req, res) => {
  try {
    const { resetToken, newPassword, confirmPassword } = req.body;

    if (!resetToken || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({ message: passwordValidation.message });
    }

    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET || 'your-secret-key');
    } catch (err) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const user = await User.findOne({ email: decoded.email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    await user.save();

    await createAuditLog(user._id, user.email, 'PASSWORD_RESET', req);

    res.status(200).json({ message: 'Password reset successfully', redirectTo: '/login' });
  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({ message: 'Server error during password reset' });
  }
});

// RESEND OTP
app.post('/api/auth/resend-otp', authLimiter, async (req, res) => {
  try {
    const { email, type } = req.body;

    if (!email || !type) {
      return res.status(400).json({ message: 'Email and type are required' });
    }

    const user = await User.findOne({ email });
    if (!user && type !== 'signup') {
      return res.status(404).json({ message: 'User not found' });
    }

    await OTP.deleteMany({ email, type });

    const otp = generateOTP();
    await OTP.create({ email, otp, type });
    await sendOTPEmail(email, otp, user?.fullName || 'User');

    res.status(200).json({ message: 'New OTP sent to your email' });
  } catch (error) {
    console.error('Resend OTP Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET USER PROFILE
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ user });
  } catch (error) {
    console.error('Get Profile Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET AUDIT LOGS
app.get('/api/user/audit-logs', authenticateToken, async (req, res) => {
  try {
    const logs = await AuditLog.find({ userId: req.user.userId }).sort({ timestamp: -1 }).limit(50);
    res.status(200).json({ logs });
  } catch (error) {
    console.error('Get Audit Logs Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ====================================
// VAULT MODELS
// ====================================

// Add these schemas after your existing schemas (after AuditLog)

const vaultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  hasPassword: { type: Boolean, default: false },
  passwordHash: { type: String, default: null }, // Hashed master password
  passwordHint: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  lastAccessed: { type: Date, default: Date.now },
  fileCount: { type: Number, default: 0 },
  totalSize: { type: Number, default: 0 }, // in bytes
  isActive: { type: Boolean, default: true }
});

const Vault = mongoose.model('Vault', vaultSchema);

// ====================================
// VAULT ROUTES
// ====================================

// CREATE VAULT
app.post('/api/vaults/create', authenticateToken, async (req, res) => {
  try {
    const { name, description, hasPassword, password, passwordHint } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Vault name is required' });
    }

    // Check if vault name already exists for this user
    const existingVault = await Vault.findOne({ 
      userId: req.user.userId, 
      name: name.trim(),
      isActive: true 
    });

    if (existingVault) {
      return res.status(400).json({ message: 'A vault with this name already exists' });
    }

    // If password is provided, validate and hash it
    let passwordHash = null;
    if (hasPassword && password) {
      if (password.length < 6) {
        return res.status(400).json({ message: 'Vault password must be at least 6 characters long' });
      }
      passwordHash = await bcrypt.hash(password, 12);
    }

    // Create the vault
    const newVault = await Vault.create({
      userId: req.user.userId,
      name: name.trim(),
      description: description || '',
      hasPassword: hasPassword || false,
      passwordHash,
      passwordHint: passwordHint || null
    });

    // Update user's vaultCreated status
    await User.findByIdAndUpdate(req.user.userId, { vaultCreated: true });

    // Create audit log
    await createAuditLog(req.user.userId, req.user.email, 'VAULT_CREATED', req);

    res.status(201).json({
      message: 'Vault created successfully',
      vault: {
        id: newVault._id,
        name: newVault.name,
        description: newVault.description,
        hasPassword: newVault.hasPassword,
        passwordHint: newVault.passwordHint,
        createdAt: newVault.createdAt,
        fileCount: newVault.fileCount,
        totalSize: newVault.totalSize
      }
    });
  } catch (error) {
    console.error('Create Vault Error:', error);
    res.status(500).json({ message: 'Server error during vault creation' });
  }
});

// GET ALL VAULTS FOR USER
app.get('/api/vaults', authenticateToken, async (req, res) => {
  try {
    const vaults = await Vault.find({ 
      userId: req.user.userId,
      isActive: true 
    }).sort({ lastAccessed: -1 });

    const vaultsData = vaults.map(vault => ({
      id: vault._id,
      name: vault.name,
      description: vault.description,
      hasPassword: vault.hasPassword,
      passwordHint: vault.passwordHint,
      createdAt: vault.createdAt,
      lastAccessed: vault.lastAccessed,
      fileCount: vault.fileCount,
      totalSize: vault.totalSize
    }));

    res.status(200).json({ vaults: vaultsData });
  } catch (error) {
    console.error('Get Vaults Error:', error);
    res.status(500).json({ message: 'Server error fetching vaults' });
  }
});

// GET SINGLE VAULT
app.get('/api/vaults/:vaultId', authenticateToken, async (req, res) => {
  try {
    const { vaultId } = req.params;

    const vault = await Vault.findOne({ 
      _id: vaultId,
      userId: req.user.userId,
      isActive: true 
    });

    if (!vault) {
      return res.status(404).json({ message: 'Vault not found' });
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
        totalSize: vault.totalSize
      }
    });
  } catch (error) {
    console.error('Get Vault Error:', error);
    res.status(500).json({ message: 'Server error fetching vault' });
  }
});

// VERIFY VAULT PASSWORD
app.post('/api/vaults/:vaultId/verify-password', authenticateToken, async (req, res) => {
  try {
    const { vaultId } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    const vault = await Vault.findOne({ 
      _id: vaultId,
      userId: req.user.userId,
      isActive: true 
    });

    if (!vault) {
      return res.status(404).json({ message: 'Vault not found' });
    }

    if (!vault.hasPassword) {
      return res.status(400).json({ message: 'This vault does not have a password' });
    }

    const isPasswordValid = await bcrypt.compare(password, vault.passwordHash);

    if (!isPasswordValid) {
      await createAuditLog(req.user.userId, req.user.email, 'VAULT_ACCESS_DENIED', req, false);
      return res.status(401).json({ message: 'Incorrect vault password' });
    }

    // Update last accessed time
    vault.lastAccessed = new Date();
    await vault.save();

    await createAuditLog(req.user.userId, req.user.email, 'VAULT_ACCESSED', req);

    res.status(200).json({ 
      message: 'Password verified successfully',
      verified: true 
    });
  } catch (error) {
    console.error('Verify Vault Password Error:', error);
    res.status(500).json({ message: 'Server error during password verification' });
  }
});

// UPDATE VAULT
app.put('/api/vaults/:vaultId', authenticateToken, async (req, res) => {
  try {
    const { vaultId } = req.params;
    const { name, description } = req.body;

    const vault = await Vault.findOne({ 
      _id: vaultId,
      userId: req.user.userId,
      isActive: true 
    });

    if (!vault) {
      return res.status(404).json({ message: 'Vault not found' });
    }

    if (name) vault.name = name.trim();
    if (description !== undefined) vault.description = description;

    await vault.save();

    await createAuditLog(req.user.userId, req.user.email, 'VAULT_UPDATED', req);

    res.status(200).json({
      message: 'Vault updated successfully',
      vault: {
        id: vault._id,
        name: vault.name,
        description: vault.description,
        hasPassword: vault.hasPassword
      }
    });
  } catch (error) {
    console.error('Update Vault Error:', error);
    res.status(500).json({ message: 'Server error during vault update' });
  }
});

// DELETE VAULT (Soft Delete)
app.delete('/api/vaults/:vaultId', authenticateToken, async (req, res) => {
  try {
    const { vaultId } = req.params;

    const vault = await Vault.findOne({ 
      _id: vaultId,
      userId: req.user.userId,
      isActive: true 
    });

    if (!vault) {
      return res.status(404).json({ message: 'Vault not found' });
    }

    // Soft delete
    vault.isActive = false;
    await vault.save();

    await createAuditLog(req.user.userId, req.user.email, 'VAULT_DELETED', req);

    res.status(200).json({ message: 'Vault deleted successfully' });
  } catch (error) {
    console.error('Delete Vault Error:', error);
    res.status(500).json({ message: 'Server error during vault deletion' });
  }
});

// UPDATE VAULT STATS (Called when files are added/removed)
app.patch('/api/vaults/:vaultId/stats', authenticateToken, async (req, res) => {
  try {
    const { vaultId } = req.params;
    const { fileCount, totalSize } = req.body;

    const vault = await Vault.findOne({ 
      _id: vaultId,
      userId: req.user.userId,
      isActive: true 
    });

    if (!vault) {
      return res.status(404).json({ message: 'Vault not found' });
    }

    if (fileCount !== undefined) vault.fileCount = fileCount;
    if (totalSize !== undefined) vault.totalSize = totalSize;
    vault.lastAccessed = new Date();

    await vault.save();

    res.status(200).json({ message: 'Vault stats updated successfully' });
  } catch (error) {
    console.error('Update Vault Stats Error:', error);
    res.status(500).json({ message: 'Server error updating vault stats' });
  }
});


// LOGOUT
app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  try {
    await createAuditLog(req.user.userId, req.user.email, 'LOGOUT', req);
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Error logging out' });
      }
      res.status(200).json({ message: 'Logged out successfully' });
    });
  } catch (error) {
    console.error('Logout Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// CHECK SESSION
app.get('/api/auth/check-session', (req, res) => {
  if (req.session.userId) {
    res.status(200).json({ isAuthenticated: true, userId: req.session.userId, email: req.session.email });
  } else {
    res.status(401).json({ isAuthenticated: false });
  }
});


// ERROR HANDLER
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// 404 HANDLER
app.use((req, res) => {
  res.status(404).json({ message: 'API route not found' });
});
// START SERVER
app.listen(PORT, () => {
  console.log(`AirVault Server Running on Port ${PORT}`);
});
