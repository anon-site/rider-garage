export type FirebaseClientConfig = {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

/** Env var names — set in `.env.local` or your hosting provider. */
export const FIREBASE_ENV_KEYS = {
  apiKey: "NEXT_PUBLIC_FIREBASE_API_KEY",
  authDomain: "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  databaseURL: "NEXT_PUBLIC_FIREBASE_DATABASE_URL",
  projectId: "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  storageBucket: "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  appId: "NEXT_PUBLIC_FIREBASE_APP_ID",
} as const satisfies Record<keyof FirebaseClientConfig, string>;

/**
 * Default Firebase Web client config for the rider-garage project.
 * These are public client keys (safe in the browser). Env vars override them.
 */
const DEFAULT_FIREBASE_CONFIG: FirebaseClientConfig = {
  apiKey: "AIzaSyB9LgXRw_YCKtOtJ8xvm6EAWvf5z2b0xHA",
  authDomain: "rider-garage.firebaseapp.com",
  databaseURL: "https://rider-garage-default-rtdb.firebaseio.com",
  projectId: "rider-garage",
  storageBucket: "rider-garage.firebasestorage.app",
  messagingSenderId: "1301708487",
  appId: "1:1301708487:web:f642546c923851f53a88e2",
};

function readEnvValue(key: keyof FirebaseClientConfig): string {
  return (process.env[FIREBASE_ENV_KEYS[key]] ?? "").trim();
}

function resolveConfigValue(
  key: keyof FirebaseClientConfig,
  envValue: string
): string {
  return envValue || DEFAULT_FIREBASE_CONFIG[key];
}

function getMissingKeys(config: FirebaseClientConfig): (keyof FirebaseClientConfig)[] {
  return (Object.keys(FIREBASE_ENV_KEYS) as (keyof FirebaseClientConfig)[]).filter(
    (key) => !config[key]
  );
}

export function isFirebaseConfigured(config: FirebaseClientConfig): boolean {
  return getMissingKeys(config).length === 0;
}

let cachedConfig: FirebaseClientConfig | null = null;

/** Returns Firebase client config (env overrides defaults). Cached after first call. */
export function getFirebaseConfig(): FirebaseClientConfig {
  if (cachedConfig) return cachedConfig;

  const config: FirebaseClientConfig = {
    apiKey: resolveConfigValue("apiKey", readEnvValue("apiKey")),
    authDomain: resolveConfigValue("authDomain", readEnvValue("authDomain")),
    databaseURL: resolveConfigValue("databaseURL", readEnvValue("databaseURL")),
    projectId: resolveConfigValue("projectId", readEnvValue("projectId")),
    storageBucket: resolveConfigValue("storageBucket", readEnvValue("storageBucket")),
    messagingSenderId: resolveConfigValue(
      "messagingSenderId",
      readEnvValue("messagingSenderId")
    ),
    appId: resolveConfigValue("appId", readEnvValue("appId")),
  };

  const missing = getMissingKeys(config);
  if (missing.length > 0) {
    const vars = missing.map((key) => FIREBASE_ENV_KEYS[key]).join(", ");
    throw new Error(
      `Firebase configuration is incomplete. Set these environment variables in .env.local: ${vars}`
    );
  }

  cachedConfig = config;
  return config;
}
