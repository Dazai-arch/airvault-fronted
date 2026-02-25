// ====================================
// VAULT API SERVICE  —  Zero-Knowledge Edition
// Files are encrypted client-side (AES-GCM 256) before any network call.
// The server NEVER receives plaintext file content.
// ====================================

import { encryptFile, decryptToBlob, resolveVaultKey } from "./ZKcrypto";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ── auth helpers ─────────────────────────────────────────────

const getAuthToken = () => {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  if (!token) {
    console.warn("⚠️ No authentication token found");
    window.location.href = "/login";
    return null;
  }
  return token;
};

const handleAuthError = (msg = "Session expired. Please login again.") => {
  console.error("🔒 Auth Error:", msg);
  localStorage.removeItem("token");
  sessionStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/login";
};

const handleResponse = async (response) => {
  if (response.status === 401 || response.status === 403) {
    const data = await response.json().catch(() => ({ message: "Authentication failed" }));
    handleAuthError(data.message);
    throw new Error(data.message || "Session expired");
  }
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Something went wrong");
  return data;
};

const authHeaders = (token) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

// ── zero-knowledge key cache (per session) ───────────────────
// Maps vaultId → CryptoKey (kept in memory only, cleared on page unload)
const _keyCache = new Map();

/**
 * Unlock a vault's ZK key and cache it for this session.
 * Must be called before upload/download.
 *
 * @param {string}      vaultId
 * @param {boolean}     hasPassword
 * @param {string|null} passphrase    — user-typed vault password (or null)
 * @param {string|null} saltB64       — salt stored on the server for this vault
 * @returns {Promise<CryptoKey>}
 */
export async function unlockVaultKey(vaultId, hasPassword, passphrase = null, saltB64 = null) {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  if (!token) throw new Error("Not authenticated");

  const { key, saltB64: newSalt, keyHex } = await resolveVaultKey(
    vaultId, hasPassword, passphrase, saltB64
  );
  _keyCache.set(vaultId, key);

  // Password vault — save PBKDF2 salt to DB on first use only
  if (newSalt) {
    const saltRes = await fetch(`${API_BASE_URL}/vaults/${vaultId}/zk-salt`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ saltB64: newSalt }),
    });
    if (!saltRes.ok) {
      const err = await saltRes.json().catch(() => ({}));
      throw new Error(`Failed to save ZK salt: ${err.message || saltRes.status}`);
    }
  }

  // Passwordless vault — ALWAYS upsert key to DB on every unlock
  if (!hasPassword && keyHex) {
    fetch(`${API_BASE_URL}/vaults/${vaultId}/zk-key`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ keyHex }),
    }).catch(e => console.warn("Could not persist vault key:", e));
  }

  return key;
}

export async function restoreVaultKey(vaultId, hasPassword, passphrase = null, saltB64 = null) {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  if (!token) throw new Error("Not authenticated");

  if (!hasPassword) {
    try {
      const res = await fetch(`${API_BASE_URL}/vaults/${vaultId}/zk-key`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (res.ok) {
        const { keyHex } = await res.json();
        localStorage.setItem(`zk_vault_key_${vaultId}`, keyHex);
      }
    } catch (e) {
      console.warn("Could not fetch key from backend:", e);
    }
  }

  return unlockVaultKey(vaultId, hasPassword, passphrase, saltB64);
}

/**
 * Retrieve a cached vault key (must have called unlockVaultKey first).
 */
export function getVaultKey(vaultId) {
  const k = _keyCache.get(vaultId);
  if (!k) throw new Error("Vault is locked. Unlock it before accessing files.");
  return k;
}

export function lockVault(vaultId) {
  _keyCache.delete(vaultId);
}

// ── vault CRUD ───────────────────────────────────────────────

export const vaultApi = {
  // ── vaults ──────────────────────────────────────────────────

  getAllVaults: async () => {
    const token = getAuthToken(); if (!token) return;
    return handleResponse(await fetch(`${API_BASE_URL}/vaults`, {
      headers: authHeaders(token), credentials: "include",
    }));
  },

  getVaultById: async (vaultId) => {
    const token = getAuthToken(); if (!token) return;
    return handleResponse(await fetch(`${API_BASE_URL}/vaults/${vaultId}`, {
      headers: authHeaders(token), credentials: "include",
    }));
  },

  createVault: async (vaultData) => {
    const token = getAuthToken(); if (!token) return;
    return handleResponse(await fetch(`${API_BASE_URL}/vaults/create`, {
      method: "POST", headers: authHeaders(token), credentials: "include",
      body: JSON.stringify(vaultData),
    }));
  },

  verifyVaultPassword: async (vaultId, password) => {
    const token = getAuthToken(); if (!token) return;
    return handleResponse(await fetch(`${API_BASE_URL}/vaults/${vaultId}/verify-password`, {
      method: "POST", headers: authHeaders(token), credentials: "include",
      body: JSON.stringify({ password }),
    }));
  },

  updateVault: async (vaultId, updateData) => {
    const token = getAuthToken(); if (!token) return;
    return handleResponse(await fetch(`${API_BASE_URL}/vaults/${vaultId}`, {
      method: "PUT", headers: authHeaders(token), credentials: "include",
      body: JSON.stringify(updateData),
    }));
  },

  deleteVault: async (vaultId) => {
    const token = getAuthToken(); if (!token) return;
    return handleResponse(await fetch(`${API_BASE_URL}/vaults/${vaultId}`, {
      method: "DELETE", headers: authHeaders(token), credentials: "include",
    }));
  },

  updateVaultStats: async (vaultId, stats) => {
    const token = getAuthToken(); if (!token) return;
    return handleResponse(await fetch(`${API_BASE_URL}/vaults/${vaultId}/stats`, {
      method: "PATCH", headers: authHeaders(token), credentials: "include",
      body: JSON.stringify(stats),
    }));
  },

  // ── user ─────────────────────────────────────────────────────

  getUserProfile: async () => {
    const token = getAuthToken(); if (!token) return;
    return handleResponse(await fetch(`${API_BASE_URL}/user/profile`, {
      headers: authHeaders(token), credentials: "include",
    }));
  },

  getAuditLogs: async () => {
    const token = getAuthToken(); if (!token) return;
    return handleResponse(await fetch(`${API_BASE_URL}/user/audit-logs`, {
      headers: authHeaders(token), credentials: "include",
    }));
  },

  validateToken: async () => {
    try {
      const token = getAuthToken(); if (!token) return null;
      const response = await fetch(`${API_BASE_URL}/auth/validate-token`, {
        headers: authHeaders(token), credentials: "include",
      });
      if (!response.ok) { handleAuthError("Token validation failed"); return null; }
      return response.json();
    } catch { return null; }
  },

  // ── ZK file upload (with XHR for progress) ───────────────────

  /**
   * Encrypt a file client-side, then upload the ciphertext.
   * The server stores only an opaque encrypted blob.
   *
   * @param {object} opts
   * @param {string}   opts.vaultId
   * @param {File}     opts.file
   * @param {object}   opts.metadata   { category, tags, description, label }
   * @param {string}   opts.folderId
   * @param {function} opts.onProgress ({ loaded, total }) => void
   * @returns {{ promise: Promise, abort: () => void }}
   */
  uploadVaultFile: ({ vaultId, file, metadata, folderId, onProgress }) => {
    const token = getAuthToken();
    if (!token) return { promise: Promise.reject(new Error("No token")), abort: () => {} };

    // We need the key synchronously for XHR, so wrap in a controller pattern.
    let xhr;
    const abort = () => xhr?.abort();

    const promise = (async () => {
      // 1. Get the cached CryptoKey for this vault.
      const key = getVaultKey(vaultId); // throws if vault is locked

      // 2. Encrypt the file in the browser.
      const { encryptedBlob, originalName, mimeType } = await encryptFile(file, key);

      // 3. Build FormData with the encrypted blob.
      const formData = new FormData();
      // Give the encrypted blob an .enc extension so the server knows it's ciphertext.
      formData.append("file", encryptedBlob, `${originalName}.enc`);
      // Original metadata stored in plaintext (filenames, categories, etc. are metadata,
      // not file content — adjust this if you want fully opaque metadata too).
      formData.append("originalName", originalName);
      formData.append("originalMimeType", mimeType);
      formData.append("zeroKnowledge", "true");
      formData.append("category",    metadata.category    || "General");
      formData.append("tags",        JSON.stringify(metadata.tags || []));
      formData.append("description", metadata.description || "");
      formData.append("label",       metadata.label       || "");
      formData.append("folderId",    folderId             || "root");

      // 4. XHR upload so we can report progress.
      return new Promise((resolve, reject) => {
        xhr = new XMLHttpRequest();
        const tracker = { lastLoaded: 0, lastTime: performance.now() };

        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable && onProgress) {
            const now = performance.now(), delta = now - tracker.lastTime;
            const speed = delta > 0 ? ((e.loaded - tracker.lastLoaded) / delta) * 1000 : 0;
            tracker.lastLoaded = e.loaded; tracker.lastTime = now;
            onProgress({ loaded: e.loaded, total: e.total, speed });
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else if (xhr.status === 401 || xhr.status === 403) {
            handleAuthError("Session expired");
            reject(new Error("Session expired"));
          } else {
            try { reject(new Error(JSON.parse(xhr.responseText).message || "Upload failed")); }
            catch { reject(new Error("Upload failed")); }
          }
        });

        xhr.addEventListener("error", () => reject(new Error("Upload failed")));
        xhr.addEventListener("abort", () => reject(new Error("Upload canceled")));

        xhr.open("POST", `${API_BASE_URL}/vaults/${vaultId}/files/upload`);
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.withCredentials = true;
        xhr.send(formData);
      });
    })();

    return { promise, abort };
  },

  // ── ZK file download (decrypt in-browser) ───────────────────

  /**
   * Download an encrypted file, decrypt it client-side, and trigger a browser download.
   *
   * @param {string} vaultId
   * @param {string} fileId
   * @param {string} originalName  — from file record (stored in plaintext on server)
   * @param {string} mimeType      — original MIME type
   */
  downloadVaultFile: async (vaultId, fileId, originalName, mimeType) => {
    const token = getAuthToken(); if (!token) return;

    // 1. Get presigned / download URL from server.
    const response = await fetch(
      `${API_BASE_URL}/vaults/${vaultId}/files/${fileId}/download`,
      { headers: { Authorization: `Bearer ${token}` }, credentials: "include" }
    );
    if (!response.ok) throw new Error("Could not get download URL");

    const { downloadUrl, localPath } = await response.json();
    const url = downloadUrl || localPath;

    // 2. Fetch the encrypted blob.
    const encResponse = await fetch(url);
    if (!encResponse.ok) throw new Error("Could not fetch encrypted file");
    const encryptedBuf = await encResponse.arrayBuffer();

    // 3. Decrypt client-side.
    const key        = getVaultKey(vaultId);
    const plainBlob  = await decryptToBlob(encryptedBuf, key, mimeType || "application/octet-stream");

    // 4. Trigger browser download.
    const blobUrl = URL.createObjectURL(plainBlob);
    const a       = document.createElement("a");
    a.href        = blobUrl;
    a.download    = originalName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10_000);
  },

  // ── file listing / deletion ──────────────────────────────────

  getVaultFiles: async (vaultId, folderId) => {
    const token = getAuthToken(); if (!token) return;
    const url = folderId
      ? `${API_BASE_URL}/vaults/${vaultId}/files?folderId=${encodeURIComponent(folderId)}`
      : `${API_BASE_URL}/vaults/${vaultId}/files`;
    return handleResponse(await fetch(url, {
      headers: authHeaders(token), credentials: "include",
    }));
  },

  deleteVaultFile: async (vaultId, fileId) => {
    const token = getAuthToken(); if (!token) return;
    return handleResponse(await fetch(`${API_BASE_URL}/vaults/${vaultId}/files/${fileId}`, {
      method: "DELETE", headers: authHeaders(token), credentials: "include",
    }));
  },

  getVaultStorage: async (vaultId) => {
    const token = getAuthToken(); if (!token) return;
    return handleResponse(await fetch(`${API_BASE_URL}/vaults/${vaultId}/storage`, {
      headers: authHeaders(token), credentials: "include",
    }));
  },

  // ── folders ──────────────────────────────────────────────────

  createFolder: async (vaultId, { name, parentId, folderId }) => {
    const token = getAuthToken(); if (!token) return;
    return handleResponse(await fetch(`${API_BASE_URL}/vaults/${vaultId}/folders`, {
      method: "POST", headers: authHeaders(token), credentials: "include",
      body: JSON.stringify({ name, parentId, folderId }),
    }));
  },

  getFolders: async (vaultId) => {
    const token = getAuthToken(); if (!token) return;
    return handleResponse(await fetch(`${API_BASE_URL}/vaults/${vaultId}/folders`, {
      headers: authHeaders(token), credentials: "include",
    }));
  },

  updateUserProfile: async (payload) => {
  const token = getAuthToken();
  if (!token) return;

  // payload can be FormData (if image uploaded) or plain object
  const isFormData = payload instanceof FormData;

  const headers = { Authorization: `Bearer ${token}` };
  if (!isFormData) headers["Content-Type"] = "application/json";

  return handleResponse(
    await fetch(`${API_BASE_URL}/user/profile`, {
      method: "PUT",
      headers,
      credentials: "include",
      body: isFormData ? payload : JSON.stringify(payload),
    })
  );
},

deleteAccount: async () => {
  const token = getAuthToken();
  if (!token) return;
  return handleResponse(
    await fetch(`${API_BASE_URL}/user/account`, {
      method: "DELETE",
      headers: authHeaders(token),
      credentials: "include",
    })
  );
},

  logout: () => handleAuthError("Logging out..."),
};

export default vaultApi;