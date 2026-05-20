import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAkZmtX5KmwBEKzrK7s3FCRl3GlmfQOwoo",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "asli-masti-bazaar.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://asli-masti-bazaar-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "asli-masti-bazaar",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "asli-masti-bazaar.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1078068267081",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1078068267081:web:d2466345c521bd8a2e9798",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-MEH2XGPMD9"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export const googleProvider = new GoogleAuthProvider();
export default app;
