/**
 * NIDZAK Partner / Booking SaaS
 * Relational Database Emulator & Persistence Controller
 * This emulates a full real-world relational database schema with ACID-like transactional operations
 * and isolates tenant data securely between business owners.
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  Role,
  User,
  Business,
  BusinessSetting,
  Branch,
  ServiceCategory,
  Service,
  Staff,
  StaffService,
  Client,
  AppointmentStatus,
  Appointment,
  SubscriptionPlan,
  Subscription,
  Payment,
  Invoice,
  Notification,
  Review,
  SupportTicket,
  ActivityLog,
  WorkingHour,
  Holiday,
  UserRoleName,
  GiftCard,
  Product,
  Promotion
} from '../types';

interface DatabaseState {
  roles: Role[];
  users: User[];
  businesses: Business[];
  business_settings: BusinessSetting[];
  branches: Branch[];
  service_categories: ServiceCategory[];
  services: Service[];
  staff: Staff[];
  staff_services: StaffService[];
  clients: Client[];
  appointment_status: AppointmentStatus[];
  appointments: Appointment[];
  subscription_plans: SubscriptionPlan[];
  subscriptions: Subscription[];
  payments: Payment[];
  invoices: Invoice[];
  notifications: Notification[];
  reviews: Review[];
  support_tickets: SupportTicket[];
  activity_logs: ActivityLog[];
  working_hours: WorkingHour[];
  holidays: Holiday[];
  gift_cards: GiftCard[];
  products: Product[];
  promotions: Promotion[];
  system_settings: { [key: string]: string };
}

// In-Memory fallback if fs fails or when in browser environment
let dbState: DatabaseState;

const DB_FILE_PATH = path.join(process.cwd(), 'database', 'db_store.json');

// Firebase sync engine integration
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, setLogLevel } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAQXgAUXErYTRR_BSj1NmLTZvyBX1X5IbY",
  authDomain: "nidzak-partner.firebaseapp.com",
  projectId: "nidzak-partner",
  storageBucket: "nidzak-partner.firebasestorage.app",
  messagingSenderId: "1070302310289",
  appId: "1:1070302310289:web:b9c22679338aafb1faf430"
};

let syncEnabled = false;
let fDb: any = null;

export async function initializeFirebaseSync() {
  console.log('[FIREBASE-SYNC] Initializing Firebase sync...');
  try {
    // Set Firestore log level to silent/error to suppress benign idle connection warnings
    setLogLevel('error');

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    fDb = getFirestore(app);

    const email = 'system-database-sync@nidzak.com';
    const password = 'system_sync_secure_pass_2026';

    console.log('[FIREBASE-SYNC] Authenticating database sync engine...');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log('[FIREBASE-SYNC] Authenticated successfully as', email);
    } catch (signinErr: any) {
      if (
        signinErr.code === 'auth/user-not-found' || 
        signinErr.code === 'auth/invalid-credential' || 
        String(signinErr.message || '').includes('user-not-found') ||
        String(signinErr.message || '').includes('invalid-credential')
      ) {
        console.log('[FIREBASE-SYNC] Sync user not found, self-registering system-database-sync...');
        try {
          await createUserWithEmailAndPassword(auth, email, password);
          console.log('[FIREBASE-SYNC] Successfully self-registered sync account!');
        } catch (signupErr) {
          console.error('[FIREBASE-SYNC] Failed self-registration:', signupErr);
          throw signupErr;
        }
      } else {
        throw signinErr;
      }
    }

    syncEnabled = true;

    // Load state from Firestore
    console.log('[FIREBASE-SYNC] Downloading database snapshot from Firestore...');
    const docRef = doc(fDb, 'system_tables', 'nidzak_database_state');
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const remoteData = docSnap.data();
      if (remoteData && remoteData.state) {
        console.log('[FIREBASE-SYNC] Snapshot found. Overwriting local state with Firestore state.');
        dbState = remoteData.state;
        // Verify key integrity
        if (!dbState.products) dbState.products = [];
        if (!dbState.promotions) dbState.promotions = [];
        if (!dbState.gift_cards) dbState.gift_cards = [];
        // Save local backup file
        try {
          fs.writeFileSync(DB_FILE_PATH, JSON.stringify(dbState, null, 2), 'utf-8');
        } catch (e) {}
      }
    } else {
      console.log('[FIREBASE-SYNC] No remote snapshot found. Uploading seeds as primary master...');
      // Initialize local state
      loadDatabase();
      // Write seeds to Firestore
      await setDoc(docRef, { state: dbState, updatedAt: new Date().toISOString() });
      console.log('[FIREBASE-SYNC] Initial seeds successfully pushed to Firestore!');
    }
  } catch (err) {
    console.error('[FIREBASE-SYNC] FAILED to setup sync. Falling back to local offline mode:', err);
    // Ensure we still load local database on failure
    loadDatabase();
  }
}

// Ensure database directory exists
try {
  const dir = path.dirname(DB_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
} catch (e) {
  // Silent fallback for non-node environments
}

export function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(dbState, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving database to file, using memory only:', err);
  }

  if (syncEnabled && fDb) {
    try {
      const docRef = doc(fDb, 'system_tables', 'nidzak_database_state');
      setDoc(docRef, { state: dbState, updatedAt: new Date().toISOString() })
        .then(() => {
          console.log('[FIREBASE-SYNC] Remote Firestore synchronized successfully.');
        })
        .catch((e) => {
          console.error('[FIREBASE-SYNC] Failed to synchronize to Firestore:', e);
        });
    } catch (firebaseErr) {
      console.error('[FIREBASE-SYNC] Error initiating Firestore sync:', firebaseErr);
    }
  }
}

export function loadDatabase(): DatabaseState {
  if (dbState) return dbState;

  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const content = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      dbState = JSON.parse(content);
      if (!dbState.products) dbState.products = [];
      if (!dbState.promotions) dbState.promotions = [];
      if (!dbState.gift_cards) dbState.gift_cards = [];
      return dbState;
    }
  } catch (e) {
    console.warn('Could not read db_store.json, creating initial system seeds');
  }

  // Define comprehensive Initial Seeds directly inline to guarantee out-of-the-box system setup!
  dbState = {
    roles: [
      { id: 1, name: UserRoleName.SUPER_ADMIN, description: 'SaaS Platform General Administrator' },
      { id: 2, name: UserRoleName.BUSINESS_OWNER, description: 'Business owner who has a tenant subscription' },
      { id: 3, name: UserRoleName.STAFF, description: 'Staff/Employee of a business tenant' },
      { id: 4, name: UserRoleName.CLIENT, description: 'Customers who register or book services' },
    ],
    system_settings: {
      platform_name: 'NIDZAK Partner',
      currency_default: 'MAD',
      support_email: 'support@nidzak.com',
      allow_registration: 'true',
      maintenance_mode: 'false',
    },
    subscription_plans: [
      { id: 1, name: 'Free Trial', price: 0, billing_cycle: 'monthly', staff_limit: 2, appointment_limit: 50, branch_limit: 1, reports_access: false, marketing_access: false },
      { id: 2, name: 'Basic', price: 290, billing_cycle: 'monthly', staff_limit: 3, appointment_limit: 200, branch_limit: 1, reports_access: true, marketing_access: false },
      { id: 3, name: 'Pro', price: 590, billing_cycle: 'monthly', staff_limit: 10, appointment_limit: 1000, branch_limit: 2, reports_access: true, marketing_access: true },
      { id: 4, name: 'Premium', price: 1190, billing_cycle: 'monthly', staff_limit: 100, appointment_limit: 999999, branch_limit: 10, reports_access: true, marketing_access: true },
    ],
    appointment_status: [
      { id: 1, name: 'pending', label_fr: 'En attente', color: 'yellow' },
      { id: 2, name: 'confirmed', label_fr: 'Confirmé', color: 'blue' },
      { id: 3, name: 'completed', label_fr: 'Terminé', color: 'green' },
      { id: 4, name: 'cancelled', label_fr: 'Annulé', color: 'red' },
      { id: 5, name: 'no_show', label_fr: 'Absence', color: 'gray' },
    ],
    service_categories: [
      { id: 1, name: 'Salons de coiffure', description: 'Coiffure homme, femme, coloration et brushings', icon: 'Scissors', is_system: true },
      { id: 2, name: 'Spas & Massages', description: 'Hammam traditionnel marocain et massages relaxants', icon: 'Flower', is_system: true },
      { id: 3, name: 'Esthétique & Beauté', description: 'Soins du visage, manucure et maquillage de luxe', icon: 'Sparkles', is_system: true },
      { id: 4, name: 'Barbershops', description: 'Taille de barbe et soins masculins chevronnés', icon: 'User', is_system: true },
      { id: 5, name: 'Cliniques & Bien-être', description: 'Kiné, ostéopathie et nutrition sportive', icon: 'Heart', is_system: true },
      { id: 6, name: 'Fitness & Yoga', description: 'Séances de yoga privée et coaching personnalisé', icon: 'Activity', is_system: true },
    ],
    businesses: [
      {
        id: 1,
        name: "L'Atelier de Beauté Casablanca",
        slug: "latelier-beaute-casa",
        logo: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=150",
        cover_image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800",
        description: "Salon de beauté de luxe au cœur de Gauthier, Casablanca. Coiffure professionnelle, soins capillaires, et onglerie.",
        email: "contact@latelier-beaute.ma",
        phone: "+212 522 11 22 33",
        address: "14 Rue Gauthier, Quartier Gauthier, Casablanca",
        category_id: 3,
        status: "active",
        created_at: "2026-06-01T10:00:00Z",
        updated_at: "2026-06-01T10:00:00Z"
      },
      {
        id: 2,
        name: "Atlas Spa Marrakech",
        slug: "atlas-spa-kech",
        logo: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=150",
        cover_image: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=800",
        description: "Hammam marocain traditionnel de prestige et massages relaxants à l'huile d'argan bio.",
        email: "spa@atlasmarrakech.com",
        phone: "+212 524 44 55 66",
        address: "Avenue Mohamed VI, Marrakech",
        category_id: 2,
        status: "active",
        created_at: "2026-06-02T09:30:00Z",
        updated_at: "2026-06-02T09:30:00Z"
      }
    ],
    business_settings: [
      { id: 1, business_id: 1, currency: "MAD", timezone: "Africa/Casablanca", language: "fr" },
      { id: 2, business_id: 2, currency: "MAD", timezone: "Africa/Casablanca", language: "fr" }
    ],
    users: [
      {
        id: 1,
        role_id: 1,
        business_id: null,
        name: "Mehdi Nidzak",
        email: "mehdinid2@gmail.com",
        phone: "+212 612 34 56 78",
        photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
        created_at: "2026-06-01T08:00:00Z",
        updated_at: "2026-06-01T08:00:00Z"
        // Password hash model is "password123"
      },
      {
        id: 2,
        role_id: 2,
        business_id: 1,
        name: "Sarah Bennani",
        email: "sarah@nidzak.com",
        phone: "+212 680 10 20 30",
        photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150",
        created_at: "2026-06-01T10:00:00Z",
        updated_at: "2026-06-01T10:00:00Z"
      },
      {
        id: 3,
        role_id: 2,
        business_id: 2,
        name: "Yassine El Fassi",
        email: "yassine@atlas.com",
        phone: "+212 661 44 33 22",
        photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
        created_at: "2026-06-02T09:30:00Z",
        updated_at: "2026-06-02T09:30:00Z"
      }
    ],
    branches: [
      { id: 1, business_id: 1, name: "L'Atelier de Beauté - Gauthier", address: "14 Rue Gauthier, Gauthier, Casablanca", phone: "+212 522 11 22 33", email: "gauthier@latelier-beaute.ma", is_main: true, created_at: "2026-06-01T10:00:00Z", updated_at: "2026-06-01T10:00:00Z" },
      { id: 2, business_id: 2, name: "Atlas Spa - Hivernage", address: "Avenue Mohamed VI, Hivernage, Marrakech", phone: "+212 524 44 55 66", email: "hivernage@atlasmarrakech.com", is_main: true, created_at: "2026-06-02T09:30:00Z", updated_at: "2026-06-02T09:30:00Z" }
    ],
    staff: [
      { id: 1, business_id: 1, branch_id: 1, user_id: null, name: "Yasmina Alami", email: "yasmina@latelier.ma", phone: "+212 620 30 40 50", photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150", bio: "Spécialiste de la manucure, onglerie et soins du visage certifiée.", created_at: "2026-06-01T11:00:00Z", updated_at: "2026-06-01T11:00:00Z" },
      { id: 2, business_id: 1, branch_id: 1, user_id: null, name: "Karim Radi", email: "karim@latelier.ma", phone: "+212 630 40 50 60", photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150", bio: "Expert coloriste et visagiste formé à Paris. Créateur de styles modernes.", created_at: "2026-06-01T11:15:00Z", updated_at: "2026-06-01T11:15:00Z" },
      { id: 3, business_id: 2, branch_id: 2, user_id: null, name: "Laila Rouissi", email: "laila@atlas.com", phone: "+212 677 88 99 00", photo: "https://images.unsplash.com/photo-1554151228-14d9def656e4?w=150", bio: "Masseuse professionnelle spécialisée en hammam rituel et gommages.", created_at: "2026-06-02T10:00:00Z", updated_at: "2026-06-02T10:00:00Z" }
    ],
    services: [
      { id: 1, business_id: 1, name: "Coupe & Brushing Signature", description: "Lavage relaxant, coupe stylisée, brushing complet professionnel et rituel soin.", price: 250.00, duration: 45, category_id: 1, created_at: "2026-06-01T12:00:00Z", updated_at: "2026-06-01T12:00:00Z" },
      { id: 2, business_id: 1, name: "Coloration Organique & Soin", description: "Coloration végétale sans ammoniac respectant l'éclat de vos cheveux.", price: 400.00, duration: 90, category_id: 1, created_at: "2026-06-01T12:10:00Z", updated_at: "2026-06-01T12:10:00Z" },
      { id: 3, business_id: 1, name: "Manucure & Pose Gel", description: "Soin complet cuticules, limage et pose de vernis semi-permanent longue durée.", price: 180.00, duration: 60, category_id: 3, created_at: "2026-06-01T12:20:00Z", updated_at: "2026-06-01T12:20:00Z" },
      { id: 4, business_id: 1, name: "Soin Visage Hydrafacial", description: "Nettoyage en profondeur par hydro-vac, hydratation et gommage rajeunissant.", price: 600.00, duration: 60, category_id: 3, created_at: "2026-06-01T12:30:00Z", updated_at: "2026-06-01T12:30:00Z" },
      { id: 5, business_id: 2, name: "Hammam Royal Beldi & Gommage", description: "Hammam chaud traditionnel marocain avec savon noir naturel et gommage rigoureux au gant de kessa.", price: 350.00, duration: 75, category_id: 2, created_at: "2026-06-02T11:00:00Z", updated_at: "2026-06-02T11:00:00Z" },
      { id: 6, business_id: 2, name: "Massage Relaxant Argan Bio", description: "Massage profond du corps entier aux huiles tièdes d'argan bio parfumées à la verveine.", price: 450.00, duration: 60, category_id: 2, created_at: "2026-06-02T11:15:00Z", updated_at: "2026-06-02T11:15:00Z" }
    ],
    staff_services: [
      { staff_id: 1, service_id: 3 },
      { staff_id: 1, service_id: 4 },
      { staff_id: 2, service_id: 1 },
      { staff_id: 2, service_id: 2 },
      { staff_id: 3, service_id: 5 },
      { staff_id: 3, service_id: 6 }
    ],
    clients: [
      { id: 1, business_id: 1, name: "Sofia Drissi", email: "sofia.drissi@gmail.com", phone: "+212 650 50 60 70", notes: "Sensible aux colorations fortes. Préfère l'eau pétillante.", created_at: "2026-06-01T15:00:00Z", updated_at: "2026-06-01T15:00:00Z" },
      { id: 2, business_id: 1, name: "Nabil El Fassi", email: "nabil.fassi@hotmail.com", phone: "+212 670 70 80 90", notes: "Prend des rendez-vous fréquents pour sa compagne.", created_at: "2026-06-02T12:00:00Z", updated_at: "2026-06-02T12:00:00Z" },
      { id: 3, business_id: 2, name: "Ghita Alami", email: "ghita.alami@yahoo.fr", phone: "+212 611 22 33 44", notes: "Adore le gommage intense.", created_at: "2026-06-03T09:00:00Z", updated_at: "2026-06-03T09:00:00Z" }
    ],
    appointments: [
      {
        id: 1,
        business_id: 1,
        branch_id: 1,
        client_id: 1,
        staff_id: 2,
        service_id: 1,
        date: "2026-06-03",
        start_time: "11:00",
        end_time: "11:45",
        total_price: 250.00,
        status_id: 2, // Confirmed
        notes: "Sofia - Coupe de routine avant voyage",
        created_at: "2026-06-02T16:00:00Z",
        updated_at: "2026-06-02T16:00:00Z"
      },
      {
        id: 2,
        business_id: 1,
        branch_id: 1,
        client_id: 2,
        staff_id: 1,
        service_id: 3,
        date: "2026-06-03",
        start_time: "14:30",
        end_time: "15:30",
        total_price: 180.00,
        status_id: 1, // Pending
        notes: "Pose de gel Express",
        created_at: "2026-06-03T08:30:00Z",
        updated_at: "2026-06-03T08:30:00Z"
      },
      {
        id: 3,
        business_id: 2,
        branch_id: 2,
        client_id: 3,
        staff_id: 3,
        service_id: 5,
        date: "2026-06-03",
        start_time: "16:00",
        end_time: "17:15",
        total_price: 350.00,
        status_id: 2, // Confirmed
        notes: "Ghita - Relax complet",
        created_at: "2026-06-02T10:00:00Z",
        updated_at: "2026-06-02T10:00:00Z"
      }
    ],
    subscriptions: [
      { id: 1, business_id: 1, plan_id: 3, status: 'active', start_date: '2026-06-01', end_date: '2026-07-01', trial_ends_at: null, created_at: '2026-06-01T10:00:00Z', updated_at: '2026-06-01T10:00:00Z' },
      { id: 2, business_id: 2, plan_id: 1, status: 'trialing', start_date: '2026-06-02', end_date: '2026-07-02', trial_ends_at: '2026-06-16', created_at: '2026-06-02T09:30:00Z', updated_at: '2026-06-02T09:30:00Z' }
    ],
    payments: [
      { id: 1, business_id: 1, appointment_id: null, subscription_id: 1, amount: 590.00, status: 'completed', gateway: 'stripe', transaction_id: 'ch_3M49s8DsdhsY6372', created_at: '2026-06-01T10:05:00Z' },
      { id: 2, business_id: 1, appointment_id: 1, subscription_id: null, amount: 250.00, status: 'completed', gateway: 'cash', transaction_id: 'cash_030611', created_at: '2026-06-03T11:45:00Z' }
    ],
    invoices: [
      { id: 1, business_id: 1, subscription_id: 1, invoice_number: 'INV-2026-0001', amount: 590.00, status: 'paid', pdf_url: '/invoices/INV-2026-0001.pdf', issue_date: '2026-06-01', due_date: '2026-06-05', created_at: '2026-06-01T10:05:00Z' }
    ],
    notifications: [
      { id: 1, user_id: 1, title: 'Nouveau business', message: 'Atlas Spa Marrakech vient de s\'inscrire sur le plan Trial.', is_read: false, created_at: '2026-06-02T09:30:00Z' },
      { id: 2, user_id: 2, title: 'Nouvelle réservation', message: 'Sofia Drissi a réservé Coupe & Brushing Signature le 2026-06-03 à 11:00.', is_read: false, created_at: '2026-06-02T16:00:00Z' }
    ],
    reviews: [
      { id: 1, business_id: 1, client_id: 1, appointment_id: 1, rating: 5, comment: 'Brushing parfait, salon très propre et chaleureux!', reply: 'Merci Sofia! C\'est toujours un plaisir de vous recevoir.', created_at: '2026-06-03T12:00:00Z' }
    ],
    support_tickets: [
      { id: 1, user_id: 2, business_id: 1, subject: 'Question intégration Stripe', message: 'Comment lier mon compte CMI ou Stripe Maroc pour recevoir le paiement direct ?', status: 'open', priority: 'medium', created_at: '2026-06-02T14:00:00Z', updated_at: '2026-06-02T14:00:00Z' }
    ],
    activity_logs: [
      { id: 1, user_id: 2, action: 'user_login', entity_name: 'users', entity_id: 2, ip_address: '196.200.14.77', created_at: '2026-06-03T08:00:00Z' },
      { id: 2, user_id: 1, action: 'view_dashboard', entity_name: 'reports', entity_id: null, ip_address: '196.200.14.1', created_at: '2026-06-03T09:30:00Z' }
    ],
    working_hours: [
      // Business 1 Hours
      { id: 1, business_id: 1, staff_id: null, day_of_week: 1, start_time: '09:00', end_time: '19:30', is_closed: false },
      { id: 2, business_id: 1, staff_id: null, day_of_week: 2, start_time: '09:00', end_time: '19:30', is_closed: false },
      { id: 3, business_id: 1, staff_id: null, day_of_week: 3, start_time: '09:00', end_time: '19:30', is_closed: false },
      { id: 4, business_id: 1, staff_id: null, day_of_week: 4, start_time: '09:00', end_time: '19:30', is_closed: false },
      { id: 5, business_id: 1, staff_id: null, day_of_week: 5, start_time: '09:00', end_time: '19:30', is_closed: false },
      { id: 6, business_id: 1, staff_id: null, day_of_week: 6, start_time: '09:00', end_time: '19:30', is_closed: false },
      { id: 7, business_id: 1, staff_id: null, day_of_week: 0, start_time: '00:00', end_time: '00:00', is_closed: true },
      // Staff 1 Hours
      { id: 8, business_id: 1, staff_id: 1, day_of_week: 1, start_time: '10:00', end_time: '18:00', is_closed: false },
      { id: 9, business_id: 1, staff_id: 1, day_of_week: 2, start_time: '10:00', end_time: '18:00', is_closed: false },
      { id: 10, business_id: 1, staff_id: 1, day_of_week: 3, start_time: '10:00', end_time: '18:00', is_closed: false },
      { id: 11, business_id: 1, staff_id: 1, day_of_week: 4, start_time: '10:00', end_time: '18:00', is_closed: false },
      { id: 12, business_id: 1, staff_id: 1, day_of_week: 5, start_time: '10:00', end_time: '18:00', is_closed: false },
      { id: 13, business_id: 1, staff_id: 1, day_of_week: 6, start_time: '10:00', end_time: '15:00', is_closed: false },
      { id: 14, business_id: 1, staff_id: 1, day_of_week: 0, start_time: '00:00', end_time: '00:00', is_closed: true },
      // Staff 2 Hours
      { id: 15, business_id: 1, staff_id: 2, day_of_week: 1, start_time: '09:00', end_time: '19:00', is_closed: false },
      { id: 16, business_id: 1, staff_id: 2, day_of_week: 2, start_time: '09:00', end_time: '19:00', is_closed: false },
      { id: 17, business_id: 1, staff_id: 2, day_of_week: 3, start_time: '09:00', end_time: '19:00', is_closed: false },
      { id: 18, business_id: 1, staff_id: 2, day_of_week: 4, start_time: '09:00', end_time: '19:00', is_closed: false },
      { id: 19, business_id: 1, staff_id: 2, day_of_week: 5, start_time: '09:00', end_time: '19:00', is_closed: false },
      { id: 20, business_id: 1, staff_id: 2, day_of_week: 6, start_time: '09:00', end_time: '19:00', is_closed: false },
      { id: 21, business_id: 1, staff_id: 2, day_of_week: 0, start_time: '00:00', end_time: '00:00', is_closed: true }
    ],
    holidays: [
      { id: 1, business_id: 1, staff_id: null, holiday_date: '2026-07-30', name: 'Fête du Trône' }
    ],
    gift_cards: [
      { id: 1, business_id: 1, code: "BON-500", initial_amount: 500, remaining_amount: 500, client_name: "Sofia Drissi", status: "active", created_at: "2026-06-01T12:00:00Z" },
      { id: 2, business_id: 1, code: "BON-100", initial_amount: 100, remaining_amount: 30, client_name: "Nabil El Fassi", status: "active", created_at: "2026-06-02T15:00:00Z" }
    ],
    products: [
      { id: 1, business_id: 1, name: "Huile d'Argan Premium bio", sku: "ARGAN-100", price: 150, cost_price: 60, stock: 24, category: "Soins cheveux" },
      { id: 2, business_id: 1, name: "Shampooing Purifiant à l'argile", sku: "SHAMP-ARG", price: 90, cost_price: 35, stock: 15, category: "Gamme bain" },
      { id: 3, business_id: 1, name: "Sérum Anti-âge Hydratation Extrême", sku: "SERUM-HYDR", price: 290, cost_price: 110, stock: 8, category: "Soins Visage" }
    ],
    promotions: [
      { id: 1, business_id: 1, name: "Remise d'Été", code: "SUMMER15", discount_type: "percent", discount_value: 15, status: "active", start_date: "2026-06-01" },
      { id: 2, business_id: 1, name: "Chèque d'accueil nouveau client", code: "WELCOME50", discount_type: "fixed", discount_value: 50, status: "active", start_date: "2026-06-01" }
    ]
  };

  saveDatabase();
  return dbState;
}

// Ensure the db starts initialized
loadDatabase();
