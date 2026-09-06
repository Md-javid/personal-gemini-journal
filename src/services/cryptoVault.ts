/**
 * MindVault: Client-Side Zero-Knowledge Field-Level Encryption
 * Uses native WebCrypto API (AES-GCM-256 with PBKDF2 key derivation).
 * Plaintext never leaves the browser in an unencrypted state.
 */

// In-memory ephemeral session key cache (cleared upon lock/logout)
let activeSessionKey: CryptoKey | null = null;

// Convert string to Uint8Array buffer
function str2buf(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

// Convert ArrayBuffer to string
function buf2str(buf: ArrayBuffer): string {
  return new TextDecoder().decode(buf);
}

// Convert ArrayBuffer to Base64
function buf2base64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Convert Base64 to ArrayBuffer
function base642buf(base64: string): ArrayBuffer {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export const CryptoVault = {
  /**
   * Generates a cryptographically random 16-byte salt for PBKDF2
   */
  generateSalt(): string {
    const saltBytes = new Uint8Array(16);
    window.crypto.getRandomValues(saltBytes);
    return buf2base64(saltBytes.buffer);
  },

  /**
   * Derives an AES-GCM-256 key from a user passphrase and salt via PBKDF2
   */
  async deriveKey(passphrase: string, saltBase64: string): Promise<CryptoKey> {
    const salt = base642buf(saltBase64);
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      str2buf(passphrase) as any,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    const derivedKey = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt as any,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    activeSessionKey = derivedKey;
    return derivedKey;
  },

  /**
   * Encrypts plaintext using AES-GCM-256 with a unique 12-byte IV
   */
  async encrypt(plaintext: string, passphrase?: string, saltBase64?: string): Promise<{ ciphertext: string; iv: string }> {
    let key = activeSessionKey;
    if (!key && passphrase && saltBase64) {
      key = await this.deriveKey(passphrase, saltBase64);
    }

    if (!key) {
      throw new Error('MINDVAULT_LOCKED: No active encryption key unlocked.');
    }

    // Generate fresh 12-byte initialization vector (IV)
    const iv = new Uint8Array(12);
    window.crypto.getRandomValues(iv);

    const encodedPlaintext = str2buf(plaintext);
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv as any
      },
      key,
      encodedPlaintext as any
    );

    return {
      ciphertext: buf2base64(encryptedBuffer),
      iv: buf2base64(iv.buffer)
    };
  },

  /**
   * Decrypts AES-GCM-256 ciphertext using stored IV and passphrase/key
   */
  async decrypt(ciphertextBase64: string, ivBase64: string, passphrase?: string, saltBase64?: string): Promise<string> {
    let key = activeSessionKey;
    if (!key && passphrase && saltBase64) {
      key = await this.deriveKey(passphrase, saltBase64);
    }

    if (!key) {
      throw new Error('MINDVAULT_LOCKED: Enter passphrase to unlock entry.');
    }

    const ciphertext = base642buf(ciphertextBase64);
    const iv = base642buf(ivBase64);

    try {
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv as any
        },
        key,
        ciphertext as any
      );

      return buf2str(decryptedBuffer);
    } catch {
      throw new Error('MINDVAULT_DECRYPTION_FAILED: Invalid passphrase or corrupted ciphertext.');
    }
  },

  /**
   * Checks if vault is unlocked in current session memory
   */
  isUnlocked(): boolean {
    return activeSessionKey !== null;
  },

  /**
   * Zero-retention memory purge: instantly purges cryptographic keys from memory
   */
  lockVault(): void {
    activeSessionKey = null;
    console.log('[AEGIS-MINDVAULT] Cryptographic key purged from memory.');
  }
};
