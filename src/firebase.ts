import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence, doc, getDocFromServer } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAQXgAUXErYTRR_BSj1NmLTZvyBX1X5IbY",
  authDomain: "nidzak-partner.firebaseapp.com",
  projectId: "nidzak-partner",
  storageBucket: "nidzak-partner.firebasestorage.app",
  messagingSenderId: "1070302310289",
  appId: "1:1070302310289:web:b9c22679338aafb1faf430"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  console.warn('[FIREBASE] Offline persistence initialization message / warning:', err.message);
});

// Test Firestore database connection on client boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();
