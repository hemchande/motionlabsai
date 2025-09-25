import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyBHYMPC7jL1mHzBzylCWi3dugH34dppMqw",
  authDomain: "motionlabsai-c2a0b.firebaseapp.com",
  projectId: "motionlabsai-c2a0b",
  storageBucket: "motionlabsai-c2a0b.firebasestorage.app",
  messagingSenderId: "630016859450",
  appId: "1:630016859450:web:df509d6f4412e1c7f00403",
  measurementId: "G-NJJXQ6PEJT",
  databaseURL: "https://motionlabsai-c2a0b-default-rtdb.firebaseio.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Firebase Analytics (only in browser environment)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;
