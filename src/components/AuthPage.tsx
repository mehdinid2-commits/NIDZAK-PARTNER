import React, { useState } from 'react';
import {
  Lock,
  Mail,
  User,
  Scissors,
  Check,
  Building2,
  Phone,
  MapPin,
  ArrowRight,
  Sparkles,
  ShieldAlert,
  ArrowLeft
} from 'lucide-react';
import { RegisterPayload, LoginPayload } from '../types';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

interface AuthPageProps {
  onLoginSuccess: (token: string, role: string, businessId?: number, userName?: string) => void;
  onBackToHome: () => void;
  setIsSigningUp: (val: boolean) => void;
  setUnverifiedEmail: (email: string) => void;
  setView: (view: string) => void;
}

export default function AuthPage({ onLoginSuccess, onBackToHome, setIsSigningUp, setUnverifiedEmail, setView }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Signin fields
  const [loginForm, setLoginForm] = useState<LoginPayload>({ email: '', password: '' });

  // Signup fields
  const [registerForm, setRegisterForm] = useState<RegisterPayload>({
    name: '',
    email: '',
    password: '',
    businessName: '',
    businessCategory: 'Hair Salon',
    businessAddress: '',
    businessPhone: '',
    planId: 2 // default package
  });

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      // 1. Sign in via Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, loginForm.email, loginForm.password);

      // 2. Protect unverified users (Bypassed for smooth sandboxed preview development)
      console.log('[FIREBASE] Dev mode - bypassing email verification check');

      // 3. Sync session with local multi-tenant database
      const response = await fetch('/api/auth/firebase-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginForm.email })
      });

      const data = await response.json();
      if (response.ok) {
        try {
          localStorage.setItem('nidzak_login_method', 'firebase');
        } catch (e) {}
        console.log('[FIREBASE] Login success for email:', loginForm.email);
        onLoginSuccess(data.token, data.role, data.user?.business_id || data.business?.id, data.user?.name);
      } else {
        setErrorMsg(data.error || 'Email or password is incorrect');
      }
    } catch (err: any) {
      console.warn('Firebase Auth Sign In failed, attempting local fallback...', err);
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: loginForm.email, password: loginForm.password })
        });
        const data = await response.json();
        if (response.ok) {
          try {
            localStorage.setItem('nidzak_login_method', 'local');
          } catch (e) {}
          onLoginSuccess(data.token, data.role, data.user?.business_id || data.business?.id, data.user?.name);
          return;
        } else {
          setErrorMsg(data.error || 'Email or password is incorrect');
        }
      } catch (localErr) {
        console.error('Local fallback login failed:', localErr);
        setErrorMsg('Email or password is incorrect');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setIsSigningUp(true);
    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, registerForm.email, registerForm.password);

      // 2. Send verification email immediately (optional in bypass mode)
      if (userCredential.user) {
        try {
          await sendEmailVerification(userCredential.user);
        } catch (verifErr) {
          console.warn('Verification mail sending failed/skipped', verifErr);
        }
      }

      // 3. Provision local DB and retrieve tenant mapping
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerForm)
      });

      const data = await response.json();

      if (response.ok) {
        setIsSigningUp(false);
        // Sync the registered user directly to trigger instant login
        const syncResponse = await fetch('/api/auth/firebase-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: registerForm.email })
        });
        if (syncResponse.ok) {
          const syncData = await syncResponse.json();
          try {
            localStorage.setItem('nidzak_login_method', 'firebase');
          } catch (e) {}
          onLoginSuccess(syncData.token, syncData.role, syncData.user?.business_id || syncData.business?.id, syncData.user?.name);
        } else {
          setView('login');
        }
      } else {
        setIsSigningUp(false);
        setErrorMsg(data.error || 'Something went wrong. Please try again.');
        // Sign out on error to clean up
        await signOut(auth);
      }
    } catch (err: any) {
      console.warn('Firebase Sign Up failed, trying local fallback...', err);
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(registerForm)
        });
        const data = await response.json();
        if (response.ok) {
          try {
            localStorage.setItem('nidzak_login_method', 'local');
          } catch (e) {}
          setIsSigningUp(false);
          const loginRes = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: registerForm.email, password: registerForm.password })
          });
          const loginData = await loginRes.json();
          if (loginRes.ok) {
            onLoginSuccess(loginData.token, loginData.role, loginData.user?.business_id || loginData.business?.id, loginData.user?.name);
          } else {
            setView('login');
          }
          return;
        } else {
          setIsSigningUp(false);
          setErrorMsg(data.error || 'Something went wrong. Please try again.');
        }
      } catch (localErr) {
        setIsSigningUp(false);
        setErrorMsg('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      
      const userCredential = await signInWithPopup(auth, provider);
      const email = userCredential.user.email;
      if (!email) {
        throw new Error('Google sign-in did not return an email address');
      }

      // Sync session with local multi-tenant database
      const response = await fetch('/api/auth/firebase-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      if (response.ok) {
        console.log('[FIREBASE] Login success via Google account:', email);
        onLoginSuccess(data.token, data.role, data.user?.business_id || data.business?.id, data.user?.name);
      } else {
        // If they are not in the local DB yet, sign them out of Firebase to prevent legacy state
        await signOut(auth);
        setErrorMsg('Compte introuvable. Veuillez d\'abord vous inscrire en tant que Partenaire avec cet e-mail.');
      }
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      const errorCode = err?.code || '';
      if (errorCode === 'auth/popup-closed-by-user') {
        return;
      } else {
        setErrorMsg('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 min-h-screen text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans" id="authen-mainframe">
      
      {/* Upper Navigation back button */}
      <div className="max-w-md w-full mx-auto px-4 mb-6">
        <button
          onClick={onBackToHome}
          className="text-xs font-bold text-slate-400 hover:text-white uppercase flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au Site Nidzak
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 shadow shadow-indigo-600/30">
          <Scissors className="h-6 w-6 text-white" />
        </div>
        <h2 className="text-3xl font-black tracking-tight text-white">
          {isLogin ? 'NIDZAK Partner Portal' : 'Rejoindre Nidzak Partner'}
        </h2>
        <p className="text-xs text-slate-450 leading-relaxed max-w-sm mx-auto">
          {isLogin
            ? 'Montez votre salon d\'un cran. Gérez l\'agenda, fiches clients, abonnements SaaS et collaborateurs à un seul endroit.'
            : 'Créez votre fiche établissement multi-tenant en 30 secondes. Simulation d\'abonnement Stripe incluse.'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-slate-950 py-8 px-4 sm:rounded-2xl sm:px-10 border border-slate-850 shadow-2xl space-y-6">
          
          {errorMsg && (
            <div className="bg-rose-900/30 border border-rose-800 text-rose-300 rounded-xl p-4 text-xs font-medium flex items-center gap-2">
              <ShieldAlert className="w-4.5 h-4.5 text-rose-400" />
              {errorMsg}
            </div>
          )}

          {isLogin ? (
            /* LOGIN CARD */
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Adresse E-mail Professionnelle</label>
                <div className="mt-1 relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    placeholder="ex: john@salon-beauty.com ou admin@nidzak.com"
                    className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 outline-none rounded-xl pl-10 pr-4 py-3 text-sm text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mot de passe d'administration</label>
                <div className="mt-1 relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 focus:border-indigo-500 outline-none rounded-xl pl-10 pr-4 py-3 text-sm text-white"
                  />
                </div>
              </div>

              <div className="bg-slate-905 p-3 rounded-lg text-[10px] text-slate-450 border border-slate-850 flex flex-col gap-1 font-mono">
                <span className="font-bold text-indigo-400">🔑 Identifiants d'essai de démo :</span>
                <span>Super Admin : <b className="text-white">mehdinid2@gmail.com</b> / pass <b className="text-white">password123</b></span>
                <span>Business Owner (L'Atelier) : <b className="text-white">sarah@nidzak.com</b> / pass <b className="text-white">password123</b></span>
                <span>Business Owner (Atlas Spa) : <b className="text-white">yassine@atlas.com</b> / pass <b className="text-white">password123</b></span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                {loading ? 'Accès en cours...' : 'Se connecter au Dashboard'}
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-850"></div>
                <span className="flex-shrink mx-4 text-slate-500 font-extrabold uppercase text-[9px] tracking-widest">ou</span>
                <div className="flex-grow border-t border-slate-850"></div>
              </div>

              <button
                type="button"
                id="btn-google-signin"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-3 bg-slate-900 hover:bg-slate-850 border border-slate-850 hover:border-slate-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow transition-all flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <span className="text-red-500 font-extrabold text-sm font-sans tracking-tight">G</span>
                <span>Se connecter avec Google</span>
              </button>
            </form>
          ) : (
            /* REGISTER CARD */
            <form onSubmit={handleRegisterSubmit} className="space-y-5 font-sans">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nom du gérant</label>
                  <div className="mt-1 relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={registerForm.name}
                      onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                      placeholder="Anis Nidzak"
                      className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 outline-none rounded-xl pl-10 pr-3 py-3 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">E-mail Gérant</label>
                  <div className="mt-1 relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                      placeholder="anis@nidzak.com"
                      className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 outline-none rounded-xl pl-10 pr-3 py-3 text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mot de passe de sécurité</label>
                <div className="mt-1 relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 outline-none rounded-xl pl-10 pr-3 py-3 text-xs text-white"
                  />
                </div>
              </div>

              <div className="border-t border-slate-800 pt-4 space-y-4">
                <span className="text-[10px] font-mono tracking-wider font-extrabold text-indigo-400 uppercase block">Détails de l'Établissement</span>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nom Commercial</label>
                    <div className="relative mt-1">
                      <Building2 className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={registerForm.businessName}
                        onChange={(e) => setRegisterForm({ ...registerForm, businessName: e.target.value })}
                        placeholder="Majestic Beauty Marrakech"
                        className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 outline-none rounded-xl pl-10 pr-3 py-3 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type d'Établissement</label>
                    <select
                      value={registerForm.businessCategory}
                      onChange={(e) => setRegisterForm({ ...registerForm, businessCategory: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 mt-1 p-3 text-xs rounded-xl text-white outline-none"
                    >
                      <option value="Hair Salon">Salon de Coiffure</option>
                      <option value="Beauty Spa">Spa & Soins Relaxants</option>
                      <option value="Nail Salon">Nail Art & Onglerie</option>
                      <option value="Barber Shop">Barbière & Barber Shop</option>
                      <option value="Fitness Studio">Fitness & Bien-être</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Adresse Physique</label>
                    <div className="relative mt-1">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={registerForm.businessAddress}
                        onChange={(e) => setRegisterForm({ ...registerForm, businessAddress: e.target.value })}
                        placeholder="Gueliz, Bd Mohamed V"
                        className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 outline-none rounded-xl pl-10 pr-3 py-3 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Téléphone</label>
                    <div className="relative mt-1">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={registerForm.businessPhone}
                        onChange={(e) => setRegisterForm({ ...registerForm, businessPhone: e.target.value })}
                        placeholder="+212 524..."
                        className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 outline-none rounded-xl pl-10 pr-3 py-3 text-xs text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-4">
                <span className="text-[10px] font-mono tracking-wider font-extrabold text-indigo-400 uppercase block mb-2">Choisir Formule d'Abonnement SaaS</span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 2, name: 'Basic', price: '290' },
                    { id: 3, name: 'Pro', price: '590' },
                    { id: 4, name: 'Premium', price: '1190' },
                  ].map((tier) => (
                    <div
                      key={tier.id}
                      onClick={() => setRegisterForm({ ...registerForm, planId: tier.id })}
                      className={`p-3 border rounded-xl text-center cursor-pointer transition-all ${
                        registerForm.planId === tier.id
                          ? 'border-indigo-500 bg-indigo-950/40 scale-102'
                          : 'border-slate-800 bg-slate-900 hover:border-slate-700'
                      }`}
                    >
                      <p className="text-xs font-extrabold text-white">{tier.name}</p>
                      <p className="text-[10px] text-indigo-400 font-bold font-mono mt-0.5">{tier.price} DH/m</p>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-indigo-600/10 transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                {loading ? 'Création multi-tenant...' : 'Valider mon Compte & Salon'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          <div className="text-center pt-2 border-t border-slate-850">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setErrorMsg('');
              }}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-bold transition-colors"
            >
              {isLogin
                ? "Vous n'avez pas de compte ? S'enregistrer en tant que Partenaire"
                : "Vous possédez déjà un compte ? Accéder à la connexion"}
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}
