export type FirebaseClientConfig = {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

const firebaseConfig: FirebaseClientConfig = {
  apiKey: "AIzaSyB9LgXRw_YCKtOtJ8xvm6EAWvf5z2b0xHA",
  authDomain: "rider-garage.firebaseapp.com",
  databaseURL: "https://rider-garage-default-rtdb.firebaseio.com",
  projectId: "rider-garage",
  storageBucket: "rider-garage.firebasestorage.app",
  messagingSenderId: "1301708487",
  appId: "1:1301708487:web:f642546c923851f53a88e2",
};

const firebaseVapidKey = "gV8M2nA0qC0--xdtcqtHK31MvXr2T6d80rc8O7KyYKE";

export function getFirebaseConfig(): FirebaseClientConfig {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim() || firebaseConfig.apiKey,
    authDomain:
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim() || firebaseConfig.authDomain,
    databaseURL:
      process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL?.trim() || firebaseConfig.databaseURL,
    projectId:
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() || firebaseConfig.projectId,
    storageBucket:
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim() || firebaseConfig.storageBucket,
    messagingSenderId:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim() ||
      firebaseConfig.messagingSenderId,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim() || firebaseConfig.appId,
  };
}

export function getFirebaseVapidKey(): string {
  return process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.trim() || firebaseVapidKey;
}
