import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import BusinessDashboard from './components/BusinessDashboard';
import PublicBookingPage from './components/PublicBookingPage';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { Mail, Scissors } from 'lucide-react';

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

  // Monitor Firebase Authentication session state cleanly in one place (auth gate)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        if (firebaseUser.emailVerified) {
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
          // User is logged in but NOT verified!
          // Force logout and show verification screen, unless currently registers (isSigningUp)
          if (!isSigningUp) {
            const email = firebaseUser.email || '';
            setUnverifiedEmail(email);
            await signOut(auth);
            handleLogoutLocalOnly('verification');
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
    </div>
  );
}
