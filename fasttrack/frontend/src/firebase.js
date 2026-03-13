import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyCZ8QlNtGeoGtim2Qy-37MlOMTSRybFRF8",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "swasthai-6e223.firebaseapp.com",
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL || "https://swasthai-6e223-default-rtdb.firebaseio.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "swasthai-6e223",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "swasthai-6e223.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "941282531864",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:941282531864:web:ce7886722a8c572f2e416d",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-WJRPSWX72T"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
