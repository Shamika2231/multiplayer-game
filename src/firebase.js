// src/firebase.js

// 1️⃣ Import Firebase modules
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// 2️⃣ Firebase configuration
// 🔹 REPLACE ALL VALUES BELOW with your actual Firebase Web App config
const firebaseConfig = {
  apiKey: "AIzaSyAkTDKJ7ZFdHGVCkEcRrXDDmhivnYEG72s",
  authDomain: "cloudgames-hub.firebaseapp.com",
  projectId: "cloudgames-hub",
  storageBucket:  "cloudgames-hub.firebasestorage.app",
  messagingSenderId: "1051762970364",
  appId: "1:1051762970364:web:f8c6adbf85bfd519191179"
};

// 3️⃣ Initialize Firebase
const app = initializeApp(firebaseConfig);

// 4️⃣ Export Auth, Provider & Firestore
export const auth = getAuth(app);                  // Firebase Authentication
export const provider = new GoogleAuthProvider();  // Google login provider
export const db = getFirestore(app);               // Firestore database