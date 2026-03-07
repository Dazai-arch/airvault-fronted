// ====================================
// VAULT API SERVICE  —  Zero-Knowledge Edition
// ====================================

import { encryptFile, decryptToBlob, resolveVaultKey, generateRandomKey, importKeyFromHex, storeVaultKeyHex, getVaultKeyHex } from "./ZKcrypto";

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
const _keyCache = new Map();

// ── Helper: persist a passwordless vault key to the server ───
// Only persists if no key exists yet — never overwrites existing key
async function _persistPasswordlessKey(vaultId, keyHex, token) {
  try {
    // Check if key already exists on server
    const existing = await fetch(`${API_BASE_URL}/vaults/${vaultId}/zk-key`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    });

    if (existing.ok) {
      const data = await existing.json();
      if (data.keyHex) {
        // Key already exists — do NOT overwrite
        console.log("Key already exists on server, skipping persist");
        return;
      }
    }

    // No key on server yet — safe to persist
    await fetch(`${API_BASE_URL}/vaults/${vaultId}/zk-key`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ keyHex }),
    });
  } catch (e) {
    console.warn("Could not persist vault key to server:", e.message);
  }
}

// ── Unlock vault key ─────────────────────────────────────────
export async function unlockVaultKey(vaultId, hasPassword, passphrase = null, saltB64 = null) {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  if (!token) throw new Error("Not authenticated");

  if (!hasPassword) {
    const lsKey = `zk_vault_key_${vaultId}`;

    // Always fetch from server first — server is source of truth
    const res = await fetch(`${API_BASE_URL}/vaults/${vaultId}/zk-key`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    });

    if (res.ok) {
      const { keyHex } = await res.json();
      if (keyHex) {
        localStorage.setItem(lsKey, keyHex);
        storeVaultKeyHex(vaultId, keyHex);
        const key = await importKeyFromHex(keyHex);
        _keyCache.set(vaultId, key);
        return key;
      }
    }

    // Server returned an error — check if this is a shared member (403 = no permission, not owner)
    // Shared members must get the key from the server; they must NOT generate a new one.
    if (res.status === 403) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || "You don't have permission to access this vault's key");
    }

    // For the owner: server returned 404 (key not yet stored) — check localStorage or generate
    let hex = localStorage.getItem(lsKey) || getVaultKeyHex(vaultId);

    if (!hex) {
      // Truly new vault owned by this user — generate fresh key
      const { key, rawHex } = await generateRandomKey();
      hex = rawHex;
      localStorage.setItem(lsKey, hex);
      storeVaultKeyHex(vaultId, hex);
      _keyCache.set(vaultId, key);
      await _persistPasswordlessKey(vaultId, hex, token);
      return key;
    }

    // Key found locally but not on server — persist it
    storeVaultKeyHex(vaultId, hex);
    const key = await importKeyFromHex(hex);
    _keyCache.set(vaultId, key);
    await _persistPasswordlessKey(vaultId, hex, token);
    return key;
  }

  // Password vault
  const { key, saltB64: newSalt } = await resolveVaultKey(
    vaultId, hasPassword, passphrase, saltB64
  );
  _keyCache.set(vaultId, key);

  if (hasPassword && newSalt) {
    const saltRes = await fetch(`${API_BASE_URL}/vaults/${vaultId}/zk-salt`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ saltB64: newSalt }),
    });
    if (!saltRes.ok) {
      const err = await saltRes.json().catch(() => ({}));
      throw new Error(`Failed to save ZK salt: ${err.message || saltRes.status}`);
    }
  }

  return key;
}

// ── Restore vault key on page load ───────────────────────────
export async function restoreVaultKey(vaultId, hasPassword, passphrase = null, saltB64 = null) {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  if (!token) throw new Error("Not authenticated");

  if (!hasPassword) {
    const lsKey = `zk_vault_key_${vaultId}`;

    // Always fetch from server first
    try {
      const res = await fetch(`${API_BASE_URL}/vaults/${vaultId}/zk-key`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      if (res.ok) {
        const { keyHex } = await res.json();
        if (keyHex) {
          localStorage.setItem(lsKey, keyHex);
          storeVaultKeyHex(vaultId, keyHex);
          const key = await importKeyFromHex(keyHex);
          _keyCache.set(vaultId, key);
          return key;
        }
      }
    } catch (e) {
      console.warn("Could not fetch key from server:", e.message);
    }

    // Fallback to local storage
    const hex = localStorage.getItem(lsKey) || getVaultKeyHex(vaultId);
    if (hex) {
      storeVaultKeyHex(vaultId, hex);
      const key = await importKeyFromHex(hex);
      _keyCache.set(vaultId, key);
      return key;
    }

    throw new Error("Vault key not found. Please re-upload your files.");
  }

  // Password vault
  return unlockVaultKey(vaultId, hasPassword, passphrase, saltB64);
}

// ── Get cached vault key ──────────────────────────────────────
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

  uploadVaultFile: ({ vaultId, file, metadata, folderId, onProgress }) => {
    const token = getAuthToken();
    if (!token) return { promise: Promise.reject(new Error("No token")), abort: () => {} };

    let xhr;
    const abort = () => xhr?.abort();

    const promise = (async () => {
      const key = getVaultKey(vaultId);
      const { encryptedBlob, originalName, mimeType } = await encryptFile(file, key);

      const formData = new FormData();
      formData.append("file", encryptedBlob, `${originalName}.enc`);
      formData.append("originalName", originalName);
      formData.append("originalMimeType", mimeType);
      formData.append("zeroKnowledge", "true");
      formData.append("category",    metadata.category    || "General");
      formData.append("tags",        JSON.stringify(metadata.tags || []));
      formData.append("description", metadata.description || "");
      formData.append("label",       metadata.label       || "");
      formData.append("folderId",    folderId             || "root");

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

  downloadVaultFile: async (vaultId, fileId, originalName, mimeType) => {
    const token = getAuthToken(); if (!token) return;

    const response = await fetch(
      `${API_BASE_URL}/vaults/${vaultId}/files/${fileId}/download`,
      { headers: { Authorization: `Bearer ${token}` }, credentials: "include" }
    );
    if (!response.ok) throw new Error("Could not get download URL");

    const contentType = response.headers.get("content-type") || "";
    let encryptedBuf;

    if (contentType.includes("application/json")) {
      // Local dev: server returns JSON { localPath, originalName, mimeType, isEncrypted }
      // then we fetch the actual file bytes from that URL
      const { downloadUrl, localPath } = await response.json();
      const url = downloadUrl || localPath;
      const encResponse = await fetch(url);
      if (!encResponse.ok) throw new Error("Could not fetch encrypted file");
      encryptedBuf = await encResponse.arrayBuffer();
    } else {
      // Production (R2): server streams raw encrypted bytes directly
      encryptedBuf = await response.arrayBuffer();
    }

    const key       = getVaultKey(vaultId);
    const plainBlob = await decryptToBlob(encryptedBuf, key, mimeType || "application/octet-stream");

    const blobUrl = URL.createObjectURL(plainBlob);
    const a       = document.createElement("a");
    a.href        = blobUrl;
    a.download    = originalName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10_000);
  },

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