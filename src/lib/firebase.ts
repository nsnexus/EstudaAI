import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "estudaai-nsnexus",
  appId: "1:564243371720:web:a21d1db404b5005691b7fd",
  storageBucket: "estudaai-nsnexus.firebasestorage.app",
  apiKey: "AIzaSyC2nhMT3eG8HjWoVPZntZ-Fjc65OQCatUA",
  authDomain: "estudaai-nsnexus.firebaseapp.com",
  messagingSenderId: "564243371720",
};

// Initialize Firebase only once
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };