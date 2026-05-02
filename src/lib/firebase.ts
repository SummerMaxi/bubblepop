import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Mock config for development/demonstration since we don't have real keys
const firebaseConfig = {
  apiKey: "AIzaSyMockKeyForDemonstrationPurposeOnly",
  authDomain: "bubble-collaboration-demo.firebaseapp.com",
  projectId: "bubble-collaboration-demo",
  storageBucket: "bubble-collaboration-demo.firebasestorage.app",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};

// Initialize Firebase only if it hasn't been initialized already
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
