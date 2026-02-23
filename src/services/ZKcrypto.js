// ============================================================
// zkCrypto.js  —  Zero-Knowledge Client-Side Crypto Utilities
// AES-GCM 256-bit · PBKDF2 key derivation · Web Crypto API
// ============================================================

const ALGO       = "AES-GCM";
const KEY_LENGTH = 256;
const ITERATIONS = 310_000;   // OWASP 2024 recommendation for PBKDF2-SHA-256
const SALT_LEN   = 32;
const IV_LEN     = 12;
const TAG_LEN    = 128;       // bits (GCM authentication tag)

// ── helpers ──────────────────────────────────────────────────

const buf2b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const b642buf = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)).buffer;
const concatBufs = (...bufs) => {
  const total = bufs.reduce((n, b) => n + b.byteLength, 0);
  const out   = new Uint8Array(total);
  let offset  = 0;
  for (const b of bufs) { out.set(new Uint8Array(b), offset); offset += b.byteLength; }
  return out.buffer;
};

// ── key derivation ────────────────────────────────────────────

/**
 * Derive an AES-GCM key from a passphrase + salt using PBKDF2-SHA-256.
 * @param {string}     passphrase
 * @param {Uint8Array} salt
 * @returns {Promise<CryptoKey>}
 */
export async function deriveKey(passphrase, salt) {
  const enc      = new TextEncoder();
  const keyMat   = await crypto.subtle.importKey(
    "raw", enc.encode(passphrase), "PBKDF2", false, ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
    keyMat,
    { name: ALGO, length: KEY_LENGTH },
    false,        // key is NOT extractable — never leaves memory
    ["encrypt", "decrypt"]
  );
}

/**
 * Generate a random 256-bit AES-GCM key (used when vault has no password).
 * The exported raw key is stored encrypted by a session-derived wrapper,
 * but for simplicity here we return it as a hex string stored in sessionStorage.
 * @returns {Promise<{ key: CryptoKey, rawHex: string }>}
 */
export async function generateRandomKey() {
  const key    = await crypto.subtle.generateKey(
    { name: ALGO, length: KEY_LENGTH }, true, ["encrypt", "decrypt"]
  );
  const raw    = await crypto.subtle.exportKey("raw", key);
  const rawHex = [...new Uint8Array(raw)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return { key, rawHex };
}

/**
 * Import a key from its hex representation (for no-password vaults).
 * @param {string} hex
 * @returns {Promise<CryptoKey>}
 */
export async function importKeyFromHex(hex) {
  const raw = new Uint8Array(hex.match(/../g).map((h) => parseInt(h, 16)));
  return crypto.subtle.importKey("raw", raw, { name: ALGO, length: KEY_LENGTH }, false, ["encrypt", "decrypt"]);
}

// ── encryption ────────────────────────────────────────────────

/**
 * Encrypt an ArrayBuffer.
 * Wire format: [ salt (32 B) | iv (12 B) | ciphertext+tag ]
 *
 * @param {ArrayBuffer} plaintext
 * @param {CryptoKey}   key
 * @returns {Promise<ArrayBuffer>}  — the full encrypted blob
 */
export async function encryptBuffer(plaintext, key) {
  const salt  = crypto.getRandomValues(new Uint8Array(SALT_LEN));
  const iv    = crypto.getRandomValues(new Uint8Array(IV_LEN));
  const cipher = await crypto.subtle.encrypt(
    { name: ALGO, iv, tagLength: TAG_LEN }, key, plaintext
  );
  // Prepend salt + iv so we can decrypt without side-channel metadata
  return concatBufs(salt.buffer, iv.buffer, cipher);
}

/**
 * Decrypt a blob produced by encryptBuffer.
 * @param {ArrayBuffer} blob
 * @param {CryptoKey}   key
 * @returns {Promise<ArrayBuffer>}
 */
export async function decryptBuffer(blob, key) {
  const bytes   = new Uint8Array(blob);
  const iv      = bytes.slice(SALT_LEN, SALT_LEN + IV_LEN);
  const cipher  = bytes.slice(SALT_LEN + IV_LEN);
  return crypto.subtle.decrypt({ name: ALGO, iv, tagLength: TAG_LEN }, key, cipher);
}

// ── file-level helpers ────────────────────────────────────────

/**
 * Read a File/Blob into an ArrayBuffer.
 */
export function fileToBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("FileReader error"));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Encrypt a File object.
 * Returns a new Blob (application/octet-stream) plus metadata needed for download.
 *
 * @param {File}       file
 * @param {CryptoKey}  key
 * @returns {Promise<{ encryptedBlob: Blob, originalName: string, mimeType: string }>}
 */
export async function encryptFile(file, key) {
  const plainBuf      = await fileToBuffer(file);
  const encryptedBuf  = await encryptBuffer(plainBuf, key);
  const encryptedBlob = new Blob([encryptedBuf], { type: "application/octet-stream" });
  return {
    encryptedBlob,
    originalName: file.name,
    mimeType:     file.type || "application/octet-stream",
  };
}

/**
 * Decrypt an ArrayBuffer back to a downloadable Blob.
 *
 * @param {ArrayBuffer} encryptedBuf
 * @param {CryptoKey}   key
 * @param {string}      mimeType  — original MIME type stored server-side
 * @returns {Promise<Blob>}
 */
export async function decryptToBlob(encryptedBuf, key, mimeType) {
  const plainBuf = await decryptBuffer(encryptedBuf, key);
  return new Blob([plainBuf], { type: mimeType });
}

// ── vault key management (sessionStorage, never persisted to server) ──

const SESSION_KEY_PREFIX = "zk_vault_key_";

/**
 * Store a vault's CryptoKey hex in sessionStorage (tab-scoped, volatile).
 * Only used for passwordless vaults; password-derived keys are re-derived on demand.
 */
export function storeVaultKeyHex(vaultId, hex) {
  sessionStorage.setItem(`${SESSION_KEY_PREFIX}${vaultId}`, hex);
}

export function getVaultKeyHex(vaultId) {
  return sessionStorage.getItem(`${SESSION_KEY_PREFIX}${vaultId}`) || null;
}

export function clearVaultKey(vaultId) {
  sessionStorage.removeItem(`${SESSION_KEY_PREFIX}${vaultId}`);
}

/**
 * High-level: get-or-create a CryptoKey for a vault.
 *
 * @param {string}      vaultId
 * @param {boolean}     hasPassword   — does the vault have a user-set password?
 * @param {string|null} passphrase    — supplied by user at unlock time (null for passwordless)
 * @param {string|null} saltB64       — base64 salt stored server-side (null = first use)
 * @returns {Promise<{ key: CryptoKey, saltB64: string|null }>}
 *          saltB64 is non-null only on first creation for password vaults
 */
export async function resolveVaultKey(vaultId, hasPassword, passphrase = null, saltB64 = null) {
  if (hasPassword) {
    if (!passphrase) throw new Error("Passphrase required for this vault.");
    let salt;
    let newSaltB64 = null;
    if (saltB64) {
      salt = new Uint8Array(b642buf(saltB64));
    } else {
      // First encryption — generate salt; caller must persist saltB64 to server
      salt       = crypto.getRandomValues(new Uint8Array(SALT_LEN));
      newSaltB64 = buf2b64(salt.buffer);
    }
    const key = await deriveKey(passphrase, salt);
    return { key, saltB64: newSaltB64 };
  } else {
    // Passwordless — use a random key persisted in sessionStorage
    let hex = getVaultKeyHex(vaultId);
    if (!hex) {
      const { key, rawHex } = await generateRandomKey();
      storeVaultKeyHex(vaultId, rawHex);
      return { key, saltB64: null };
    }
    const key = await importKeyFromHex(hex);
    return { key, saltB64: null };
  }
}