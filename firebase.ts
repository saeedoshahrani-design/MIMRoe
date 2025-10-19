import { initializeApp, FirebaseApp } from "firebase/app";
import { 
  getFirestore, 
  initializeFirestore, 
  Firestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  setLogLevel
} from "firebase/firestore";
import { 
  getAuth, 
  Auth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

let app: FirebaseApp;
export let db: Firestore;
export let auth: Auth;

export async function initFirebase({ enableDebug = false } = {}) {
  if (app) {
    return { app, db, auth };
  }
  
  if (!firebaseConfig.apiKey) {
    throw new Error("Firebase configuration is missing. The environment variables might not be set correctly.");
  }

  app = initializeApp(firebaseConfig);

  db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    experimentalAutoDetectLongPolling: true,
    useFetchStreams: false,
  });

  if (enableDebug) {
    setLogLevel("debug");
    console.info("[Firebase] Firestore debug logs enabled.");
  }

  auth = getAuth(app);
  
  return { app, db, auth };
}

export { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut
};
export type { User };