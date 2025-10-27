// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCVBkWe3A7AwJdk_J6yx7sBhOgu4nWg9Ik",
  authDomain: "scrbrd-beta-2.firebaseapp.com",
  projectId: "scrbrd-beta-2",
  storageBucket: "scrbrd-beta-2.appspot.com",
  messagingSenderId: "489561247753",
  appId: "1:489561247753:web:a09285d3776fde63f028d8",
  measurementId: "G-28ETF9TDYZ"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export { app, db, auth };