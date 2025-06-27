
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCVBkWe3A7AwJdk_J6yx7sBhOgu4nWg9Ik",
  authDomain: "scrbrd-beta-2.firebaseapp.com",
  projectId: "scrbrd-beta-2",
  storageBucket: "scrbrd-beta-2.appspot.com",
  messagingSenderId: "489561247753",
  appId: "1:489561247753:web:a09285d3776fde63f028d8",
  measurementId: "G-28ETF9TDYZ"
};

// Initialize Firebase for SSR
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { app, db };
