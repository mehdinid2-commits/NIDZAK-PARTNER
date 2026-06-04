import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAQXgAUXErYTRR_BSj1NmLTZvyBX1X5IbY",
  authDomain: "nidzak-partner.firebaseapp.com",
  projectId: "nidzak-partner",
  storageBucket: "nidzak-partner.firebasestorage.app",
  messagingSenderId: "1070302310289",
  appId: "1:1070302310289:web:b9c22679338aafb1faf430"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
