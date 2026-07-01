export type FirebaseClientConfig = {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

export type FirebaseConfigState = {
  config: FirebaseClientConfig;
  missing: string[];
  isConfigured: boolean;
  errorMessage: string | null;
};

const ENV_KEYS = {
  apiKey: "NEXT_PUBLIC_FIREBASE_API_KEY",
  authDomain: "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  databaseURL: "NEXT_PUBLIC_FIREBASE_DATABASE_URL",
  projectId: "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  storageBucket: "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  appId: "NEXT_PUBLIC_FIREBASE_APP_ID",
} as const;

const FALLBACK_CONFIG: FirebaseClientConfig = {
  apiKey: "build-placeholder-api-key",
  authDomain: "build-placeholder.firebaseapp.com",
  databaseURL: "https://build-placeholder-default-rtdb.firebaseio.com",
  projectId: "build-placeholder",
  storageBucket: "build-placeholder.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:buildplaceholder",
};

export function getFirebaseConfigState(): FirebaseConfigState {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ?? "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  };

  const missing = (Object.keys(ENV_KEYS) as (keyof typeof ENV_KEYS)[]).filter(
    (key) => !config[key]
  );

  if (missing.length === 0) {
    return {
      config,
      missing: [],
      isConfigured: true,
      errorMessage: null,
    };
  }

  const vars = missing.map((key) => ENV_KEYS[key]);
  const errorMessage = `Firebase configuration is incomplete. Set these environment variables: ${vars.join(", ")}`;

  if (missing.length > 0) {
    return {
      config: FALLBACK_CONFIG,
      missing: vars,
      isConfigured: false,
      errorMessage,
    };
  }

  return {
    config,
    missing: [],
    isConfigured: true,
    errorMessage: null,
  };
}

export function getFirebaseConfig(): FirebaseClientConfig {
  return getFirebaseConfigState().config;
}
