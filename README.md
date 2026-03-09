# AirVault

A zero-knowledge encrypted file vault with granular per-member permissions, AES-GCM client-side encryption, and Cloudflare R2 storage.

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [Cryptography](#cryptography)
5. [Authentication & Sessions](#authentication--sessions)
6. [Permissions Model](#permissions-model)
7. [API Reference](#api-reference)
8. [Data Models](#data-models)
9. [Environment Variables](#environment-variables)
10. [Local Development](#local-development)
11. [Security Notes](#security-notes)

---

## Overview

AirVault is a full-stack encrypted file storage application. Files are encrypted in the browser before upload using AES-GCM 256-bit encryption — the server never receives plaintext file data. Vaults can be password-protected (key derived from passphrase via PBKDF2) or passwordless (random key stored server-side). Vault owners can invite members with role-based and per-permission access controls.

**Key capabilities:**
- Client-side AES-GCM 256-bit encryption before upload
- Password vaults (PBKDF2 key derivation, server never sees passphrase)
- Passwordless vaults (random key, server-stored hex, fetched per session)
- Per-member granular permissions (view, upload, edit, delete, share, download)
- Vault-wide security overrides (block all downloads, device restrictions, lock)
- Folder hierarchy with breadcrumb navigation
- File previews for owners/editors; metadata-only view for restricted members
- Access log with geo, device, browser tracking per vault event
- Public share links (file-level, no auth required for viewer)
- OTP-based email verification for signup and login
- QR code invite links for vault joining

---

## Tech Stack

### Frontend

| Package | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| React Router DOM | 7 | Client-side routing |
| Framer Motion | 12 | Animations |
| Lucide React | 0.562 | Icons |
| Tailwind CSS | 3.4 | Styling |
| Vite | 5.1 | Build tool |

### Backend

| Package | Version | Purpose |
|---|---|---|
| Express | 5.2 | HTTP server |
| Mongoose | 9.1 | MongoDB ODM |
| jsonwebtoken | 9.0 | JWT auth (HS256) |
| bcryptjs | 3.0 | Password hashing |
| multer | 2.0 | File upload handling |
| @aws-sdk/client-s3 | 3.995 | Cloudflare R2 (S3-compatible) |
| @aws-sdk/s3-request-presigner | 3.995 | Presigned R2 URLs |
| nodemailer / resend | 7.0 / 6.8 | Transactional email |
| express-rate-limit | 8.2 | Rate limiting |
| helmet | 8.1 | HTTP security headers |
| geoip-lite | 1.4 | IP geolocation for access logs |
| qrcode | 1.5 | Invite QR code generation |
| connect-mongo | 6.0 | MongoDB session store |

### Infrastructure

| Service | Purpose |
|---|---|
| MongoDB Atlas | Primary database |
| Cloudflare R2 | Encrypted file storage (zero egress fees) |
| Render | Backend hosting |
| Vercel | Frontend hosting |

---

## Architecture

```
Browser
  │
  ├── ZKcrypto.js          ← All encryption/decryption (Web Crypto API)
  ├── vaultApi.js          ← All API calls, key management, XHR upload
  └── React components     ← UI (FileView, FilePreviewModal, Permissions, etc.)
        │
        │  HTTPS
        ▼
Express server (server.js)
  │
  ├── MongoDB              ← Users, Vaults, Files, Shares, Audit logs
  └── Cloudflare R2        ← Encrypted file blobs (raw ciphertext)
```

**File upload flow:**
1. Browser reads file → `encryptBuffer()` → `[salt(32) | iv(12) | ciphertext+tag]` blob
2. Blob sent via XHR to `POST /api/vaults/:vaultId/files/upload`
3. Server writes blob to R2 with a UUID key; stores metadata in MongoDB
4. Server never sees the plaintext — only the encrypted bytes

**File download flow:**
1. `GET /api/vaults/:vaultId/files/:fileId/download`
2. Server streams raw encrypted bytes from R2 (production) or returns a local path (dev)
3. Browser calls `decryptBuffer()` → plaintext → triggers browser download

---

## Cryptography

All cryptographic operations use the browser's native **Web Crypto API** (`crypto.subtle`). No third-party crypto libraries.

### Algorithms

| Operation | Algorithm | Parameters |
|---|---|---|
| File encryption | AES-GCM | 256-bit key, 96-bit IV, 128-bit auth tag |
| Password key derivation | PBKDF2-SHA-256 | 310,000 iterations (OWASP 2024), 32-byte salt |
| Passwordless vault key | Random AES-GCM key | 256-bit, exported as hex, stored in `ZKSalt` |

### Wire Format

Every encrypted file blob has the following layout:

```
[ salt (32 bytes) | IV (12 bytes) | ciphertext + GCM auth tag ]
```

- **Salt** — random per-file, used for PBKDF2 key derivation (password vaults) or ignored on import (passwordless)
- **IV** — random 96-bit nonce, required for AES-GCM; never reused
- **Auth tag** — 128-bit GCM tag appended to ciphertext; decryption fails if ciphertext is tampered

### Key Types

**Password vault:**
```
passphrase  +  salt (from blob header)
      │
   PBKDF2-SHA-256 (310,000 iterations)
      │
   AES-GCM-256 key  ──►  encrypt / decrypt
```

**Passwordless vault:**
```
Random 256-bit key  ──►  stored as hex in ZKSalt collection
      │
  fetched via GET /api/vaults/:vaultId/zk-key  (auth required)
      │
   imported as CryptoKey  ──►  encrypt / decrypt
```

---

## Authentication & Sessions

- **Signup**: email → OTP sent → verify OTP → account created
- **Login**: email + password → OTP sent → verify OTP → JWT issued
- **JWT algorithm**: HS256 (single-secret, server issues and verifies)
- **Token lifetime**: 24 hours
- **Token storage**: `localStorage` (key: `airvault_token`)
- **Session**: `express-session` backed by MongoDB via `connect-mongo` (parallel to JWT for server-side state)
- **OTP TTL**: 10 minutes (MongoDB TTL index on `createdAt`)
- **TempSignup TTL**: 10 minutes (unverified signup data auto-deleted)

### Token Validation

Every protected endpoint uses the `authenticateToken` middleware:

```
Authorization: Bearer <jwt>
```

401 → token missing or expired (client clears token, redirects to login)  
403 → token valid but insufficient permissions (client shows error, no redirect)

---

## Permissions Model

### Roles

| Role | Description |
|---|---|
| owner | Vault creator. Full access to everything. Cannot be removed. |
| editor | Default upload/edit/download. No delete or share unless toggled. |
| viewer | Read-only. No download by default. |

### Default Permission Flags by Role

| Permission | Owner | Editor | Viewer |
|---|---|---|---|
| view | ✅ | ✅ | ✅ |
| upload | ✅ | ✅ | ❌ |
| edit | ✅ | ✅ | ❌ |
| delete | ✅ | ❌ | ❌ |
| share | ✅ | ❌ | ❌ |
| canDownload | ✅ | ✅ | ❌ |

All flags are individually toggleable by the owner from the Permissions page. The vault-wide `blockAllDownloads` flag in `VaultSecurity` overrides `canDownload` for all members except the owner.

### Vault Key Access

| User | Can fetch vault key | Condition |
|---|---|---|
| Owner | ✅ | Always |
| Editor / Viewer with `canDownload: true` | ✅ | Active share record exists |
| Editor / Viewer with `canDownload: false` | ❌ | 403 from `/zk-key` |

---

## API Reference

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | None | Health check |
| GET | `/api/auth/validate-token` | JWT | Validate current token |
| POST | `/api/auth/signup` | None | Initiate signup, send OTP |
| POST | `/api/auth/verify-signup-otp` | None | Verify OTP, create account |
| POST | `/api/auth/login` | None | Initiate login, send OTP |
| POST | `/api/auth/verify-login-otp` | None | Verify OTP, issue JWT |
| POST | `/api/auth/forgot-password` | None | Send password reset OTP |
| POST | `/api/auth/reset-password` | None | Reset password with OTP |
| POST | `/api/auth/resend-otp` | None | Resend OTP |
| POST | `/api/auth/logout` | JWT | Logout, destroy session |
| GET | `/api/auth/check-session` | JWT | Check session validity |

### User

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/user/profile` | JWT | Get own profile |
| PUT | `/api/user/profile` | JWT | Update profile |
| DELETE | `/api/user/account` | JWT | Delete account |
| GET | `/api/user/audit-logs` | JWT | Get own global audit log |

### Vaults

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/vaults/create` | JWT | Create a new vault |
| GET | `/api/vaults` | JWT | List all vaults (owned + shared) |
| POST | `/api/vaults/accept-invite` | JWT | Accept invite token |
| GET | `/api/vaults/join/:vaultId` | JWT | Get join info for a vault |
| POST | `/api/vaults/join/:vaultId` | JWT | Join vault via link/QR |
| GET | `/api/vaults/:vaultId` | JWT | Get vault metadata |
| POST | `/api/vaults/:vaultId/verify-password` | JWT | Verify vault password |
| PUT | `/api/vaults/:vaultId` | JWT (owner) | Update vault |
| DELETE | `/api/vaults/:vaultId` | JWT (owner) | Soft-delete vault |
| DELETE | `/api/vaults/:vaultId/permanent` | JWT (owner) | Permanently delete vault + files |
| PATCH | `/api/vaults/:vaultId/stats` | JWT | Update file count / total size |
| PATCH | `/api/vaults/:vaultId/password` | JWT (owner) | Change vault password |
| GET | `/api/vaults/:vaultId/details` | JWT | Get extended vault details |
| PUT | `/api/vaults/:vaultId/details` | JWT (owner) | Update vault details |
| GET | `/api/vaults/:vaultId/activity` | JWT | Recent activity |
| GET | `/api/vaults/:vaultId/export-info` | JWT | Export vault info |
| GET | `/api/dashboard/stats` | JWT | Cross-vault dashboard stats |

### Files

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/vaults/:vaultId/files` | JWT | List files (optionally by folder) |
| POST | `/api/vaults/:vaultId/files/upload` | JWT | Upload encrypted file |
| GET | `/api/vaults/:vaultId/files/:fileId/download` | JWT | Download encrypted file |
| GET | `/api/vaults/:vaultId/files/:fileId/stream` | JWT | Stream file |
| DELETE | `/api/vaults/:vaultId/files/:fileId` | JWT | Delete file |
| PATCH | `/api/vaults/:vaultId/files/:fileId/view` | JWT | Increment view count |
| PATCH | `/api/vaults/:vaultId/files/:fileId/move` | JWT | Move file to folder |
| PATCH | `/api/vaults/:vaultId/files/:fileId/mark-shared` | JWT | Mark file as shared |
| GET | `/api/vaults/:vaultId/storage` | JWT | Storage usage stats |

### Public Sharing

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/share/:fileId` | None | Get shared file metadata |
| GET | `/api/share/:fileId/stream` | None | Stream shared file |
| GET | `/api/share/:fileId/key-info` | None | Get encryption key info for shared file |

### Folders

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/vaults/:vaultId/folders` | JWT | List folders |
| GET | `/api/vaults/:vaultId/folders/:folderId` | JWT | Get folder |
| POST | `/api/vaults/:vaultId/folders` | JWT | Create folder |
| PUT | `/api/vaults/:vaultId/folders/:folderId` | JWT | Update folder |
| DELETE | `/api/vaults/:vaultId/folders/:folderId` | JWT | Delete folder |
| PATCH | `/api/vaults/:vaultId/folders/:folderId/move` | JWT | Move folder |
| GET | `/api/vaults/:vaultId/folders/:folderId/breadcrumb` | JWT | Get folder breadcrumb path |

### Members & Permissions

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/vaults/:vaultId/members` | JWT (owner) | Invite member |
| GET | `/api/vaults/:vaultId/members` | JWT (owner) | List members |
| PATCH | `/api/vaults/:vaultId/members/:memberId` | JWT (owner) | Update member permissions |
| DELETE | `/api/vaults/:vaultId/members/:memberId` | JWT (owner) | Remove member |
| GET | `/api/vaults/:vaultId/invite-link` | JWT (owner) | Get/generate invite link + QR |

### Security & Audit

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/vaults/:vaultId/security` | JWT (owner) | Get security settings |
| PATCH | `/api/vaults/:vaultId/security` | JWT (owner) | Update security settings |
| GET | `/api/vaults/:vaultId/access-log` | JWT (owner) | Get access log |
| POST | `/api/vaults/:vaultId/access-log` | JWT | Log an access event |
| GET | `/api/vaults/:vaultId/access-log/export` | JWT (owner) | Export access log as CSV |

### ZK Key Management

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/vaults/:vaultId/zk-salt` | JWT (owner) | Store PBKDF2 salt for password vault |
| GET | `/api/vaults/:vaultId/zk-salt` | JWT | Get PBKDF2 salt |
| GET | `/api/vaults/:vaultId/zk-salt/shared` | JWT | Get salt (shared member path) |
| POST | `/api/vaults/:vaultId/zk-key` | JWT (owner) | Store raw key hex (passwordless vault) |
| GET | `/api/vaults/:vaultId/zk-key` | JWT | Fetch raw key hex (owner or authorised member) |

---

## Data Models

### User
```
fullName, email (unique), password (bcrypt), profilePicture,
dob, isVerified, vaultCreated, createdAt, lastLogin
```

### Vault
```
userId (owner ref), name, description, hasPassword, passwordHash,
passwordHint, createdAt, lastAccessed, tags[], fileCount,
totalSize (bytes), isActive
```

### VaultFile
```
vaultId, userId, originalName, storedKey (R2 object key),
mimeType, size, folderId, category, tags[], description,
label, uploadedAt, isDeleted, isEncrypted, shared,
views, downloads
```

### Folder
```
vaultId, userId, name, parentId, createdAt
```

### VaultShare
```
vaultId, ownerId, userId (nullable until accepted), email, role (viewer|editor),
permissions { view, upload, edit, delete, share },
canDownload, status (pending|active|revoked),
inviteToken, inviteExpires, joinedAt, createdAt
```

### ZKSalt
```
vaultId (unique), userId, saltB64 (PBKDF2 salt OR raw key hex for passwordless vaults),
createdAt, updatedAt
```

### VaultSecurity
```
vaultId (unique), blockAllDownloads, deviceRestricted, isLocked, updatedAt
```

### VaultAuditLog
```
vaultId, userId, email, action, fileId, fileName,
ipAddress, userAgent, device, browser, os, location,
status (success|blocked|failed), timestamp
```

### AuditLog (global)
```
userId, vaultId, email, action, ipAddress, userAgent, device, browser
```

### OTP
```
email, otp, type (signup|login|forgot-password),
createdAt (TTL: 10 minutes)
```

---

## Environment Variables

### Backend (`.env` in project root)

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | ✅ | MongoDB Atlas connection string |
| `JWT_SECRET` | ✅ **CRITICAL** | Secret for signing JWTs. Must be a long random string in production. Defaults to `"your-secret-key"` — **never ship the default** |
| `SESSION_SECRET` | ✅ | Secret for `express-session`. Defaults to `"airvault-secret-key-change-in-production"` |
| `R2_BUCKET_NAME` | ✅ | Cloudflare R2 bucket name |
| `R2_ACCESS_KEY_ID` | ✅ | R2 access key |
| `R2_SECRET_ACCESS_KEY` | ✅ | R2 secret key |
| `R2_ENDPOINT` | ✅ | R2 S3-compatible endpoint URL |
| `RESEND_API_KEY` | ✅ | Resend API key for transactional email |
| `FRONTEND_URL` | ✅ | Frontend origin for CORS (e.g. `https://airvault.vercel.app`) |
| `BACKEND_URL` | ✅ | Backend origin for local file URLs (dev only) |
| `PORT` | Optional | Server port (default: `5000`) |
| `NODE_ENV` | Optional | `production` enables R2 file storage and CORS lockdown |

### Frontend (`.env` in project root)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | Optional | Backend API base URL (default: `http://localhost:5000/api`) |

---

## Local Development

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Cloudflare R2 bucket

### Setup

```bash
# Install dependencies
npm install

# Create .env with all required variables (see above)

# Run backend + frontend concurrently
npm run dev
```

This runs:
- `nodemon server.js` on port 5000 (or `$PORT`)
- `vite` on port 5173

### Dev vs Production File Storage

In development (`NODE_ENV !== "production"`), the download endpoint returns a JSON response with a local file path instead of streaming from R2. The frontend (`vaultApi.js`) detects the response `Content-Type`:

- `application/json` → parse JSON, fetch bytes from `localPath`
- anything else → treat response body directly as encrypted bytes (R2 production path)

### Build

```bash
npm run build    # Vite production build → dist/
npm start        # Run Express server (serves API only; frontend served by Vercel)
```

---

## Security Notes

### JWT_SECRET
The `JWT_SECRET` defaults to `"your-secret-key"` in 6 places across `server.js`. This is a critical misconfiguration in production — anyone can forge tokens. Always set a strong secret (32+ random characters) in your deployment environment.

### Vault Key Storage
For passwordless vaults, the 256-bit vault key is stored in plaintext hex in the `ZKSalt` MongoDB collection. This means Anthropic/MongoDB/Render staff with database access can read the key. True zero-knowledge for passwordless vaults would require per-member asymmetric key wrapping (not currently implemented).

For password vaults, the key is never stored — it is derived client-side from the user's passphrase using PBKDF2. The server only stores the PBKDF2 salt.

### Rate Limiting
`express-rate-limit` is configured on auth routes. Review limits before production deployment under expected load.

### CORS
In production, CORS is locked to `FRONTEND_URL`. In development, all origins are allowed. Ensure `FRONTEND_URL` is set correctly in your deployment.

### File Validation
Multer handles upload size limits. Ensure appropriate `limits.fileSize` values are set for your use case.

### Session Secret
`SESSION_SECRET` defaults to a hardcoded string. Set a strong random value in production.