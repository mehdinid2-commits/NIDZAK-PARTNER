import { db, auth } from '../firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  QueryConstraint,
  serverTimestamp
} from 'firebase/firestore';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('[FIREBASE-EXCEPTION] Firestore operational Exception occurred:', error);
  console.error('[FIREBASE-EXCEPTION-DETAILS] Raw metadata details:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Generate a safe unique Firestore key
 */
export function generateId(): string {
  try {
    return doc(collection(db, '_temp')).id;
  } catch (e) {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}

/**
 * Create a test document after login
 */
export async function createTestDocumentAfterLogin(uid: string) {
  const path = `users/${uid}`;
  try {
    const docRef = doc(db, 'users', uid);
    await setDoc(docRef, {
      uid: uid,
      createdAt: serverTimestamp()
    }, { merge: true });
    console.log('[FIREBASE] Firestore write success (test document) for path:', path);
  } catch (error) {
    console.error('[FIREBASE] Firestore write failure (test document) for path:', path, error);
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Write any document with full validation & operation track
 */
export async function saveToFirestore<T extends object>(
  path: string,
  docId: string,
  data: T,
  isUpdate: boolean = false
) {
  const fullPath = `${path}/${docId}`;
  try {
    const docRef = doc(db, path, docId);
    if (isUpdate) {
      await updateDoc(docRef, {
        ...data,
        updated_at: new Date().toISOString()
      });
    } else {
      await setDoc(docRef, {
        ...data,
        id: isNaN(Number(docId)) ? docId : Number(docId),
        created_at: data['created_at' as keyof T] || new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    console.log('[FIREBASE] Firestore write success for path:', fullPath);
  } catch (error) {
    console.error('[FIREBASE] Firestore write failure for path:', fullPath, error);
    handleFirestoreError(error, isUpdate ? OperationType.UPDATE : OperationType.WRITE, fullPath);
  }
}

/**
 * Delete helper
 */
export async function deleteFromFirestore(path: string, docId: string) {
  const fullPath = `${path}/${docId}`;
  try {
    const docRef = doc(db, path, docId);
    await deleteDoc(docRef);
    console.log('[FIREBASE] Firestore write success (delete) for path:', fullPath);
  } catch (error) {
    console.error('[FIREBASE] Firestore delete failure for path:', fullPath, error);
    handleFirestoreError(error, OperationType.DELETE, fullPath);
  }
}

/**
 * Subscribes to any user subdirectory and updates custom state hooks
 */
export function subscribeToCollection<T>(
  uid: string,
  subPath: string,
  onUpdate: (data: T[]) => void,
  sortField?: string
) {
  const path = `users/${uid}/${subPath}`;
  try {
    const colRef = collection(db, path);
    return onSnapshot(colRef, (snapshot) => {
      const items: any[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        items.push({
          ...d,
          id: d.id !== undefined ? d.id : docSnap.id
        });
      });
      if (sortField) {
        items.sort((a, b) => {
          const valA = String(a[sortField] || '');
          const valB = String(b[sortField] || '');
          return valA.localeCompare(valB);
        });
      }
      console.log('[FIREBASE] Firestore read success for path:', path, '- found', items.length, 'records');
      onUpdate(items as T[]);
    }, (error) => {
      console.error('[FIREBASE] Firestore read failure for path:', path, error);
      handleFirestoreError(error, OperationType.LIST, path);
    });
  } catch (err) {
    console.error('[FIREBASE] Subscription exception setup failed for path:', path, err);
    return () => {};
  }
}

/**
 * Migrate legacy SQL back-end multi-tenant database to Firestore on first launch
 */
export async function migrateLocalDataToFirestoreIfEmpty(
  uid: string,
  businessId: number,
  token: string,
  currentProfileName: string
) {
  const profileDocPath = `users/${uid}`;
  const checkRef = doc(db, profileDocPath, 'profile');
  try {
    const snap = await getDoc(checkRef);
    if (snap.exists()) {
      console.log('[FIREBASE-MIGRATION] Firestore profile exists, skipping automatic seed migration.');
      return;
    }

    console.log('[FIREBASE-MIGRATION] No profile found in Firestore. Commencing legacy SQL migration...');
    const headers = { 'Authorization': `Bearer ${token}` };

    // Fetch existing data points
    const [resStats, resAppts, resServices, resStaff, resClients, resBilling, resGiftCards, resProducts, resPromotions] = await Promise.all([
      fetch(`/api/business/${businessId}/stats`, { headers }).catch(() => null),
      fetch(`/api/business/${businessId}/appointments`, { headers }).catch(() => null),
      fetch(`/api/business/${businessId}/services`, { headers }).catch(() => null),
      fetch(`/api/business/${businessId}/staff`, { headers }).catch(() => null),
      fetch(`/api/business/${businessId}/clients`, { headers }).catch(() => null),
      fetch(`/api/business/${businessId}/branches`, { headers }).catch(() => null),
      fetch(`/api/business/${businessId}/billing`, { headers }).catch(() => null),
      fetch(`/api/business/${businessId}/gift-cards`, { headers }).catch(() => null),
      fetch(`/api/business/${businessId}/products`, { headers }).catch(() => null),
      fetch(`/api/business/${businessId}/promotions`, { headers }).catch(() => null),
    ]);

    let profileData: any = {
      uid,
      businessId,
      name: currentProfileName,
      migrated_at: new Date().toISOString()
    };

    if (resStats && resStats.ok) {
      const stats = await resStats.json();
      profileData = {
        ...profileData,
        business: stats.business || null,
        sub: stats.sub || null,
        plan: stats.plan || null,
        statsSummary: {
          totalAppointments: stats.totalAppointments || 0,
          revenue: stats.revenue || 0,
          clientsCount: stats.clientsCount || 0,
          staffCount: stats.staffCount || 0,
          servicesCount: stats.servicesCount || 0
        }
      };
    }

    // Save initial central Profile Document
    await setDoc(checkRef, profileData);

    // Save default app settings document
    const settingsRef = doc(db, `users/${uid}/settings`, 'app');
    await setDoc(settingsRef, {
      currency: 'MAD',
      timezone: 'Africa/Casablanca',
      language: 'fr',
      ownerName: currentProfileName
    });

    // Migrate Appointments
    if (resAppts && resAppts.ok) {
      const appts = await resAppts.json();
      for (const a of appts) {
        await setDoc(doc(db, `users/${uid}/appointments`, String(a.id)), a);
      }
    }

    // Migrate Customers
    if (resClients && resClients.ok) {
      const cls = await resClients.json();
      for (const c of cls) {
        await setDoc(doc(db, `users/${uid}/customers`, String(c.id)), c);
      }
    }

    // Migrate Services
    if (resServices && resServices.ok) {
      const srvs = await resServices.json();
      for (const s of srvs) {
        await setDoc(doc(db, `users/${uid}/services`, String(s.id)), s);
      }
    }

    // Migrate Staff Employees
    if (resStaff && resStaff.ok) {
      const stf = await resStaff.json();
      for (const s of stf) {
        await setDoc(doc(db, `users/${uid}/employees`, String(s.id)), s);
      }
    }

    // Migrate Billing Invoices and Payments
    if (resBilling && resBilling.ok) {
      const billing = await resBilling.json();
      if (billing.invoices) {
        for (const i of billing.invoices) {
          await setDoc(doc(db, `users/${uid}/invoices`, String(i.id)), i);
        }
      }
      if (billing.payments) {
        for (const p of billing.payments) {
          await setDoc(doc(db, `users/${uid}/payments`, String(p.id)), p);
        }
      }
    }

    // Migrate Products
    if (resProducts && resProducts.ok) {
      const prods = await resProducts.json();
      for (const p of prods) {
        await setDoc(doc(db, `users/${uid}/products`, String(p.id)), p);
      }
    }

    // Migrate Promotions
    if (resPromotions && resPromotions.ok) {
      const promos = await resPromotions.json();
      for (const p of promos) {
        await setDoc(doc(db, `users/${uid}/promotions`, String(p.id)), p);
      }
    }

    // Migrate Gift Cards
    if (resGiftCards && resGiftCards.ok) {
      const cards = await resGiftCards.json();
      for (const c of cards) {
        await setDoc(doc(db, `users/${uid}/giftcards`, String(c.id)), c);
      }
    }

    console.log('[FIREBASE-MIGRATION] Firestore initial database migration succeeded and loaded successfully.');

  } catch (err) {
    console.error('[FIREBASE-MIGRATION] Error migrating database records to Firestore:', err);
  }
}
