import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import BusinessDashboard from './components/BusinessDashboard';
import PublicBookingPage from './components/PublicBookingPage';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Mail, Scissors } from 'lucide-react';
import { createTestDocumentAfterLogin } from './lib/firestoreService';

// Safe localStorage wrappers to prevent iframe state crashes under strict sandboxing
const storage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn('localStorage is blocked in sandboxed iframe:', e);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn('localStorage is blocked in sandboxed iframe:', e);
    }
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn('localStorage is blocked in sandboxed iframe:', e);
    }
  }
};

export default function App() {
  // Navigation states
  const [view, setView] = useState<string>('home'); // home | login | register | super_admin | business_owner | booking
  const [selectedSlug, setSelectedSlug] = useState<string>('');

  // Email verification and registration state
  const [isSigningUp, setIsSigningUp] = useState<boolean>(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  // Authentication states
  const [token, setToken] = useState<string | null>(storage.getItem('nidzak_token'));
  const [role, setRole] = useState<string | null>(storage.getItem('nidzak_role'));
  const [businessId, setBusinessId] = useState<number | null>(() => {
    const stored = storage.getItem('nidzak_business_id');
    if (!stored || stored === 'undefined' || stored === 'null') return null;
    const val = parseInt(stored, 10);
    return isNaN(val) ? null : val;
  });
  const [userName, setUserName] = useState<string | null>(storage.getItem('nidzak_user_name'));

  // Active public businesses catalog
  const [businesses, setBusinesses] = useState<any[]>([]);

  // Query public active businesses catalog on mount
  const fetchBusinesses = async () => {
    try {
      const response = await fetch('/api/public/businesses');
      if (response.ok) {
        setBusinesses(await response.json());
      }
    } catch (e) {
      console.error('Error fetching catalog', e);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, [view]);

  // Diagnostic state for Firebase writes proof
  const [diagnostic, setDiagnostic] = useState<{
    projectId: string;
    appName: string;
    databaseName: string;
    status: 'IDLE' | 'PENDING' | 'SUCCESS' | 'FAILURE';
    errorStack?: string;
    timestamp?: string;
  }>({
    projectId: auth.app.options.projectId || 'Unknown',
    appName: auth.app.name || 'Unknown',
    databaseName: '(default)',
    status: 'IDLE'
  });

  const [showDiagScreen, setShowDiagScreen] = useState<boolean>(true);

  // Monitor Firebase Authentication session state cleanly in one place (auth gate)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Log login success
        console.log('[FIREBASE] Login success for user email:', firebaseUser.email, 'UID:', firebaseUser.uid);

        // Create test document after login
        try {
          await createTestDocumentAfterLogin(firebaseUser.uid);
        } catch (createErr) {
          console.error('[FIREBASE] Exception occurred writing test document users/{uid}:', createErr);
        }

        // Run diagnostic write exactly as requested by user
        (async () => {
          console.log('--- STARTING FIREBASE DIAGNOSTIC RUN ---');
          try {
            await setDoc(
              doc(db, "debug", "test"),
              {
                timestamp: serverTimestamp(),
                source: "diagnostic"
              }
            );
            console.log('Diagnostic setDoc write SUCCESS!');
            setDiagnostic(prev => ({
              ...prev,
              status: 'SUCCESS',
              timestamp: new Date().toISOString()
            }));
            console.log('Firebase Project ID:', auth.app.options.projectId);
            console.log('Firebase App Name:', auth.app.name);
            console.log('Firestore Database Name:', (db as any)._databaseId?.database || '(default)');
            console.log('Diagnostic Write Result: SUCCESS');
          } catch (diagErr: any) {
            console.error('Diagnostic setDoc write FAILURE:', diagErr);
            console.error('Full exception stack trace:', diagErr?.stack || diagErr);
            setDiagnostic(prev => ({
              ...prev,
              status: 'FAILURE',
              errorStack: diagErr?.stack || diagErr?.message || String(diagErr)
            }));
            console.log('Firebase Project ID:', auth.app.options.projectId);
            console.log('Firebase App Name:', auth.app.name);
            console.log('Firestore Database Name:', (db as any)._databaseId?.database || '(default)');
            console.log('Diagnostic Write Result: FAILURE');
          }
          console.log('--- ENDING FIREBASE DIAGNOSTIC RUN ---');
        })();

        // If they are signed in via Firebase, but we do not have our local session token/role set,
        // we dynamically sync database info for this email from the backend.
        if (!token || !role) {
          try {
            const response = await fetch('/api/auth/firebase-sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: firebaseUser.email })
            });
            if (response.ok) {
              const data = await response.json();
              handleLoginSuccess(
                data.token,
                data.role,
                data.user?.business_id || data.business?.id,
                data.user?.name
              );
            } else {
              // Local user records don't match, sign out of Firebase
              await signOut(auth);
              handleLogoutLocalOnly();
            }
          } catch (e) {
            console.error('onAuthStateChanged synchronization error:', e);
            handleLogoutLocalOnly();
          }
        }
      } else {
        // No Firebase user active: if current view is a protected dashboard, kick them out
        const loginMethod = storage.getItem('nidzak_login_method');
        if (loginMethod !== 'local') {
          if (view === 'super_admin' || view === 'business_owner') {
            handleLogoutLocalOnly('login');
          } else if (token || role) {
            handleLogoutLocalOnly('home');
          }
        }
      }
    });

    return () => unsubscribe();
  }, [token, role, isSigningUp, view]);

  // Handle redirecting authenticated users to proper consoles
  useEffect(() => {
    if (token && role) {
      if (role === 'super_admin') {
        setView('super_admin');
      } else if (role === 'business_owner' || role === 'employee') {
        setView('business_owner');
      }
    }
  }, [token, role]);

  const handleLoginSuccess = (userToken: string, userRole: string, idBusiness?: number, nameUser?: string) => {
    storage.setItem('nidzak_token', userToken);
    storage.setItem('nidzak_role', userRole);
    if (idBusiness) storage.setItem('nidzak_business_id', String(idBusiness));
    if (nameUser) storage.setItem('nidzak_user_name', nameUser);

    setToken(userToken);
    setRole(userRole);
    if (idBusiness) setBusinessId(idBusiness);
    if (nameUser) setUserName(nameUser);

    if (userRole === 'super_admin') {
      setView('super_admin');
    } else {
      setView('business_owner');
    }
  };

  const handleLogoutLocalOnly = (fallbackView: string = 'home') => {
    storage.removeItem('nidzak_token');
    storage.removeItem('nidzak_role');
    storage.removeItem('nidzak_business_id');
    storage.removeItem('nidzak_user_name');
    storage.removeItem('nidzak_login_method');

    setToken(null);
    setRole(null);
    setBusinessId(null);
    setUserName(null);
    setView(fallbackView);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Firebase signOut failed:', e);
    }
    handleLogoutLocalOnly();
  };

  const handleNavigate = (targetView: string, extra?: any) => {
    if (targetView === 'booking' && extra?.slug) {
      setSelectedSlug(extra.slug);
      setView('booking');
    } else {
      setView(targetView);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 font-sans" id="nidzak-app-core">
      {view === 'home' && (
        <LandingPage onNavigate={handleNavigate} businesses={businesses} />
      )}

      {(view === 'login' || view === 'register') && (
        <AuthPage
          onLoginSuccess={handleLoginSuccess}
          onBackToHome={() => setView('home')}
          setIsSigningUp={setIsSigningUp}
          setUnverifiedEmail={setUnverifiedEmail}
          setView={setView}
        />
      )}

      {view === 'verification' && (
        <div className="bg-slate-900 min-h-screen text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans" id="verification-mainframe">
          <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 shadow shadow-indigo-600/30">
              <Scissors className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-3xl font-black tracking-tight text-white">NIDZAK Partner Portal</h2>
          </div>
          <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
            <div className="bg-slate-950 py-8 px-4 sm:rounded-2xl sm:px-10 border border-slate-850 shadow-2xl space-y-6 text-center">
              <div className="mx-auto w-12 h-12 bg-indigo-900/30 border border-indigo-800 text-indigo-400 rounded-full flex items-center justify-center">
                <Mail className="w-5 h-5 text-indigo-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Vérification de l'adresse e-mail</h3>
              <p className="text-sm text-slate-300 leading-relaxed max-w-sm mx-auto">
                We have sent you a verification email to <strong className="text-indigo-400 font-extrabold">{unverifiedEmail}</strong>. Please verify it and log in.
              </p>
              <button
                id="btn-login-verification"
                onClick={() => setView('login')}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow transition-all cursor-pointer"
              >
                Se connecter
              </button>
            </div>
          </div>
        </div>
      )}

      {view === 'booking' && selectedSlug && (
        <PublicBookingPage
          businessSlug={selectedSlug}
          onNavigate={handleNavigate}
        />
      )}

      {view === 'super_admin' && token && (
        <SuperAdminDashboard
          token={token}
          onLogout={handleLogout}
          adminName={userName || 'John Doe'}
        />
      )}

      {view === 'business_owner' && token && businessId && (
        <BusinessDashboard
          businessId={businessId}
          token={token}
          onLogout={handleLogout}
          ownerName={userName || 'Propriétaire'}
        />
      )}

      {/* Sleek Temporary Diagnostics Proof Overlay Screen */}
      {auth.currentUser && showDiagScreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm" id="firebase-diagnostic-screen">
          <div className="bg-slate-900 border border-slate-800 text-slate-100 p-6 rounded-2xl shadow-2xl max-w-lg w-full space-y-4 font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-y-1 flex-col items-start">
                <span className="font-sans font-black tracking-wider text-sm text-indigo-400">🔥 FIREBASE DIAGNOSTICS CONTROL UNIT</span>
                <span className="text-[10px] text-slate-400">Temporary Verification Monitor</span>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                diagnostic.status === 'SUCCESS' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                diagnostic.status === 'FAILURE' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                diagnostic.status === 'PENDING' ? 'bg-indigo-950 text-indigo-400 border border-indigo-800' : 'bg-slate-800 text-slate-400'
              }`}>
                {diagnostic.status === 'SUCCESS' ? 'SUCCESS' : diagnostic.status === 'FAILURE' ? 'FAILURE' : 'PENDING'}
              </span>
            </div>

            <div className="space-y-3 text-slate-300 text-xs">
              <div className="grid grid-cols-3 border-b border-slate-800/50 pb-2">
                <span className="text-slate-500 font-sans">Firebase Project ID</span>
                <span className="col-span-2 text-indigo-300 font-semibold">{diagnostic.projectId}</span>
              </div>
              <div className="grid grid-cols-3 border-b border-slate-800/50 pb-2">
                <span className="text-slate-500 font-sans">Firebase App Name</span>
                <span className="col-span-2 text-indigo-300">{diagnostic.appName}</span>
              </div>
              <div className="grid grid-cols-3 border-b border-slate-800/50 pb-2">
                <span className="text-slate-500 font-sans">Firestore DB Name</span>
                <span className="col-span-2 text-indigo-300">{diagnostic.databaseName}</span>
              </div>
              <div className="grid grid-cols-3 border-b border-slate-800/50 pb-2">
                <span className="text-slate-500 font-sans">Write Status</span>
                <span className={`col-span-2 font-bold ${diagnostic.status === 'SUCCESS' ? 'text-emerald-400' : diagnostic.status === 'FAILURE' ? 'text-rose-400' : 'text-amber-400'}`}>
                  {diagnostic.status === 'SUCCESS' ? 'SUCCESSFULLY COMMITTED TO CLOUD FIRESTORE ✓' : diagnostic.status === 'FAILURE' ? 'FAILED ✗' : 'IN PROGRESS...'}
                </span>
              </div>
              {diagnostic.timestamp && (
                <div className="grid grid-cols-3 border-b border-slate-800/50 pb-2">
                  <span className="text-slate-500 font-sans">Write Timestamp</span>
                  <span className="col-span-2">{diagnostic.timestamp}</span>
                </div>
              )}

              {/* Stack Trace Box */}
              {diagnostic.status === 'FAILURE' && (
                <div className="space-y-1">
                  <span className="text-rose-400 text-[10px] uppercase font-bold">Full Exception Stack Trace:</span>
                  <div className="bg-rose-950/40 text-rose-300 p-3 rounded-lg border border-rose-900/40 font-mono text-[9px] max-h-40 overflow-y-auto whitespace-pre-wrap leading-normal scrollbar-thin scrollbar-thumb-rose-900/50">
                    {diagnostic.errorStack || 'No stack trace found.'}
                  </div>
                </div>
              )}

              {diagnostic.status === 'SUCCESS' && (
                <div className="bg-emerald-950/20 border border-emerald-900/30 text-emerald-400/90 rounded-lg p-3 text-[10px] leading-relaxed font-sans">
                  The test write was successfully completed from the client to the Firestore collection <code className="bg-emerald-950 text-emerald-300 p-0.5 rounded font-mono text-[9px]">debug/test</code> using <code className="bg-emerald-950 text-emerald-300 p-0.5 rounded font-mono text-[9px]">serverTimestamp()</code>.
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                className="flex-1 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold font-sans transition-all cursor-pointer"
                onClick={async () => {
                  setDiagnostic(prev => ({ ...prev, status: 'PENDING', errorStack: undefined }));
                  try {
                    await setDoc(doc(db, "debug", "test"), {
                      timestamp: serverTimestamp(),
                      source: "diagnostic"
                    });
                    setDiagnostic(prev => ({
                      ...prev,
                      status: 'SUCCESS',
                      timestamp: new Date().toISOString()
                    }));
                  } catch (err: any) {
                    setDiagnostic(prev => ({
                      ...prev,
                      status: 'FAILURE',
                      errorStack: err?.stack || err?.message || String(err)
                    }));
                  }
                }}
              >
                Re-Run Write Diagnostic
              </button>
              <button
                type="button"
                className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold font-sans transition-all cursor-pointer"
                onClick={() => setShowDiagScreen(false)}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
