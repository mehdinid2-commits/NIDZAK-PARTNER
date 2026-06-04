import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAQXgAUXErYTRR_BSj1NmLTZvyBX1X5IbY",
  authDomain: "nidzak-partner.firebaseapp.com",
  projectId: "nidzak-partner",
  storageBucket: "nidzak-partner.firebasestorage.app",
  messagingSenderId: "1070302310289",
  appId: "1:1070302310289:web:b9c22679338aafb1faf430"
};

async function testSync() {
  console.log("--- START SYSTEM SYNC TEST ---");
  try {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    const email = 'system-database-sync@nidzak.com';
    const password = 'system_sync_secure_pass_2026';

    console.log("1. Authenticating as", email);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log("Success! UID:", user.uid);

    console.log("2. Writing test document in test_collection/test_sync...");
    const docRef = doc(db, 'test_collection', 'test_sync');
    await setDoc(docRef, { test: true, time: new Date().toISOString() });
    console.log("WRITE SUCCESS!");

    console.log("3. Reading test document...");
    const snap = await getDoc(docRef);
    console.log("READ SUCCESS! Data:", snap.data());

  } catch (err: any) {
    console.error("FAILED ERROR:", err.message);
    console.error("CODE:", err.code);
  } finally {
    console.log("--- END SYSTEM SYNC TEST ---");
    process.exit(0);
  }
}

testSync();
