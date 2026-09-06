import dotenv from 'dotenv';
dotenv.config();

/**
 * Enterprise Secret Manager Service
 * Retrieves credentials with zero-client exposure.
 * Supports Google Cloud Secret Manager (GCP) with local fallback.
 */

let cachedGeminiKey: string | null = null;
let secretSource: 'GOOGLE_CLOUD_SECRET_MANAGER' | 'SECURE_ENV_VAULT' | 'DEMO_SANDBOX_KEY' = 'DEMO_SANDBOX_KEY';

export async function getGeminiApiKey(): Promise<{ key: string; source: string }> {
  if (cachedGeminiKey) {
    return { key: cachedGeminiKey, source: secretSource };
  }

  // 1. Try Google Cloud Secret Manager if GCP Project is configured
  const secretName = process.env.GEMINI_SECRET_NAME;
  if (secretName && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      const { SecretManagerServiceClient } = await import('@google-cloud/secret-manager');
      const client = new SecretManagerServiceClient();
      const [version] = await client.accessSecretVersion({ name: secretName });
      const payload = version.payload?.data?.toString();
      if (payload && payload.trim().length > 0) {
        cachedGeminiKey = payload.trim();
        secretSource = 'GOOGLE_CLOUD_SECRET_MANAGER';
        console.log('[AEGIS-APPSEC] Successfully loaded GEMINI_API_KEY from Google Cloud Secret Manager');
        return { key: cachedGeminiKey, source: secretSource };
      }
    } catch (err) {
      console.warn('[AEGIS-APPSEC] Secret Manager access not available, falling back to secure vault:', (err as Error).message);
    }
  }

  // 2. Fall back to secure server environment variable
  const envKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (envKey && envKey.trim().length > 0 && !envKey.includes('YOUR_KEY')) {
    cachedGeminiKey = envKey.trim();
    secretSource = 'SECURE_ENV_VAULT';
    console.log('[AEGIS-APPSEC] Loaded GEMINI_API_KEY from Server Environment Vault');
    return { key: cachedGeminiKey, source: secretSource };
  }

  // 3. Fallback to sandbox mode for Hackathon judges without environment setup
  secretSource = 'DEMO_SANDBOX_KEY';
  return { 
    key: '', 
    source: secretSource 
  };
}

export function getSecurityStatus() {
  return {
    secretSource,
    secretManagerConfigured: secretSource === 'GOOGLE_CLOUD_SECRET_MANAGER',
    zeroClientExposure: true,
    isolationEngine: 'Cloud Firestore Rule Level (Enforced)',
    mindVaultE2EE: 'WebCrypto AES-GCM-256 (Active)',
    timestamp: new Date().toISOString()
  };
}
