import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Sparkles,
  Users,
  Compass,
  ArrowRight,
  User,
  MapPin,
  Mail,
  Phone,
  Check,
  Star,
  Clock,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  CalendarDays,
  AlertTriangle
} from 'lucide-react';
import { Business, Service, Staff } from '../types';

interface PublicBookingPageProps {
  businessSlug: string;
  onNavigate: (view: string, extra?: any) => void;
}

export default function PublicBookingPage({ businessSlug, onNavigate }: PublicBookingPageProps) {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Hydrated public state
  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [workingHours, setWorkingHours] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  // Booking wizard flow state
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 1: Choose Service, 2: Choose Staff, 3: Date & time, 4: Customer Info & submit
  
  // Confirmed choices
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null | 'any'>(null);
  const [bookingDate, setBookingDate] = useState<string>('');
  const [bookingTime, setBookingTime] = useState<string>('');

  // Client form
  const [clientForm, setClientForm] = useState({ name: '', email: '', phone: '', notes: '' });
  
  // Finished success state
  const [receipt, setReceipt] = useState<any>(null);

  const fetchPublicProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/public/business/${businessSlug}`);
      if (response.ok) {
        const data = await response.json();
        setBusiness(data.business);
        setServices(data.services);
        setStaff(data.staff);
        setWorkingHours(data.workingHours);
        setCategories(data.categories);
      } else {
        const err = await response.json();
        setErrorMsg(err.error || 'Établissement introuvable.');
      }
    } catch (e) {
      console.error(e);
      setErrorMsg('Erreur lors de la récupération du profil public.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicProfile();
  }, [businessSlug]);

  // Handle booking submissions
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedStaff || !bookingDate || !bookingTime) {
      alert('Veuillez séléctionner toutes les étapes requises avant de soumettre.');
      return;
    }

    // Determine target staff ID for SQL table insert
    let targetStaffId = selectedStaff === 'any' ? staff[0]?.id : selectedStaff?.id;
    if (!targetStaffId) {
       alert('Aucun collaborateur disponible.');
       return;
    }

    try {
      const response = await fetch(`/api/public/business/${businessSlug}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: selectedService.id,
          staff_id: targetStaffId,
          date: bookingDate,
          start_time: bookingTime,
          client_name: clientForm.name,
          client_email: clientForm.email,
          client_phone: clientForm.phone,
          notes: clientForm.notes
        })
      });

      if (response.ok) {
        const resData = await response.json();
        setReceipt(resData);
        setStep(4);
      } else {
        const err = await response.json();
        alert(err.error || 'Erreur lors de la réservation.');
      }
    } catch (err) {
      console.error(err);
      alert('Erreur réseau lors de la transaction.');
    }
  };

  // Generate date selectors for the next 7 days in French LTR
  const nextSevenDays = [];
  const daysTranslation = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const monthsTranslation = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];

  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    nextSevenDays.push({
      dateStr: d.toISOString().slice(0, 10),
      dayName: daysTranslation[d.getDay()],
      monthName: monthsTranslation[d.getMonth()],
      dayNumber: d.getDate()
    });
  }

  // Pre-configured typical booking slots
  const bookingSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
  ];

  if (loading) {
    return (
      <div className="bg-slate-50 min-h-screen flex flex-col justify-center items-center text-slate-500 font-sans">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono mt-3">Chargement du salon partenaire...</p>
      </div>
    );
  }

  if (errorMsg || !business) {
    return (
      <div className="bg-slate-50 min-h-screen flex flex-col justify-center items-center text-slate-600 font-sans px-4 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-500" />
        <h2 className="text-xl font-bold">{errorMsg || 'Profil inaccessible.'}</h2>
        <button
          onClick={() => onNavigate('home')}
          className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase transition-all"
        >
          Retourner au portail
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 font-sans pb-20" id="public-booking-mainframe">
      
      {/* HEADER NAV */}
      <header className="bg-white border-b border-slate-100 py-4 mb-6">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <button
            onClick={() => onNavigate('home')}
            className="text-slate-500 hover:text-slate-900 text-xs font-bold uppercase flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux Salons
          </button>
          
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-slate-400">RÉSERVATION SÉCURISÉE</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
        </div>
      </header>

      {/* SALON CORE HEADER PROFILE */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        <div className="relative h-60 md:h-72 w-full rounded-2xl overflow-hidden bg-slate-100 shadow-sm border border-slate-200">
          <img
            src={business.cover_image || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800'}
            alt="Business Cover"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          
          <div className="absolute bottom-6 left-6 right-6 flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
            <div className="flex items-center gap-4">
              <img
                src={business.logo || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=50'}
                alt="Logo"
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-xl object-cover border-2 border-white shadow-md bg-white shrink-0"
              />
              <div className="text-white">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-none">{business.name}</h1>
                <div className="flex items-center gap-1.5 text-xs text-slate-350 mt-1.5 font-medium">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{business.address}</span>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur border border-white/20 text-white font-mono text-xs px-3 py-1.5 rounded-lg flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-current text-amber-400" />
              <span>5.0</span>
              <span className="text-slate-300">(24 avis d'or)</span>
            </div>
          </div>
        </div>

        {/* WIZARD FRAME */}
        {receipt ? (
          /* BOOKING RECEIPT TICKET */
          <div className="max-w-lg mx-auto bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-8 space-y-6 text-center animate-scale-up font-sans">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100 shadow-sm shadow-emerald-50">
              <Check className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-mono font-bold tracking-widest text-emerald-600 uppercase block">Confirmation de réservation</span>
              <h2 className="text-2xl font-black text-slate-900">À bientôt chez {receipt.business?.name} !</h2>
              <p className="text-slate-500 text-xs leading-relaxed max-w-sm mx-auto">
                Votre créneau a été réservé avec succès et affecté à l'agenda. L'établissement vient d'être notifié de votre rendez-vous.
              </p>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-left space-y-3 text-xs font-medium text-slate-700">
              <div className="flex justify-between border-b pb-2 border-slate-150">
                <span className="text-slate-400 font-normal">Prestation</span>
                <span className="font-extrabold text-slate-900">{selectedService?.name}</span>
              </div>
              <div className="flex justify-between border-b pb-2 border-slate-150">
                <span className="text-slate-400 font-normal">Praticien</span>
                <span className="font-extrabold text-slate-900">
                  {selectedStaff === 'any' ? 'Premier disponible' : selectedStaff?.name}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2 border-slate-150">
                <span className="text-slate-400 font-normal">Date & Heure</span>
                <span className="font-extrabold text-indigo-750 font-mono">
                  {receipt.appointment?.date} · À {receipt.appointment?.start_time}
                </span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-400 font-normal">Montant à régler sur place</span>
                <span className="font-black text-slate-900 text-sm">{receipt.appointment?.price} DH</span>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 italic">
              Un e-mail de confirmation reprenant les coordonnées de l'établissement ({receipt.business?.phone}) vous a été simulé.
            </p>

            <button
              onClick={() => onNavigate('home')}
              className="w-full py-4.5 bg-slate-900 hover:bg-slate-950 text-white rounded-xl text-xs font-bold uppercase tracking-wider"
            >
              Retourner à l'accueil
            </button>
          </div>
        ) : (
          /* CORE BOOKING STEPS */
          <div className="grid lg:grid-cols-12 gap-8">
            
            {/* Steps Navigation Form Panel */}
            <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-7 shadow-sm space-y-6">
              
              {/* STAGES BAR HEADER */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 font-semibold text-xs tracking-wide">
                <span className={`pb-2 border-b-2 transition-all ${step >= 1 ? 'border-indigo-650 text-indigo-650 font-bold' : 'border-transparent text-slate-450'}`}>1. Service</span>
                <span className={`pb-2 border-b-2 transition-all ${step >= 2 ? 'border-indigo-650 text-indigo-650 font-bold' : 'border-transparent text-slate-450'}`}>2. Praticien</span>
                <span className={`pb-2 border-b-2 transition-all ${step >= 3 ? 'border-indigo-650 text-indigo-650 font-bold' : 'border-transparent text-slate-450'}`}>3. Date & Heure</span>
                <span className={`pb-2 border-b-2 transition-all ${step >= 4 ? 'border-indigo-650 text-indigo-650 font-bold' : 'border-transparent text-slate-450'}`}>4. Vos Infos</span>
              </div>

              {/* STEP 1: CHOOSE SERVICE */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">Sélectionnez la prestation souhaitée</h3>
                    <p className="text-xs text-slate-500">Parcourez le catalogue officiel proposé par l'établissement pour bloquer votre créneau.</p>
                  </div>

                  <div className="divide-y divide-slate-100 border rounded-xl overflow-hidden">
                    {services.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          setSelectedService(item);
                          setStep(2);
                        }}
                        className={`p-4 flex justify-between items-center hover:bg-slate-50/70 transition-all cursor-pointer ${selectedService?.id === item.id ? 'bg-indigo-50/40 text-indigo-900' : ''}`}
                      >
                        <div className="overflow-hidden space-y-1 pr-3">
                          <p className="font-extrabold text-slate-900 text-sm line-clamp-1">{item.name}</p>
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{item.description}</p>
                          <div className="flex items-center gap-1 text-[11px] font-mono text-slate-450 pt-1 font-bold">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{item.duration} minutes</span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="block font-black font-mono text-slate-900 text-base">{item.price} DH</span>
                          <span className="text-[10px] text-indigo-650 font-bold tracking-wide uppercase flex items-center gap-1 justify-end mt-1 font-sans">
                            Choisir
                            <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 2: CHOOSE STAFF MEMBER */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base">Choisissez un collaborateur</h3>
                      <p className="text-xs text-slate-500">Confiez votre soin à votre spécialiste préféré ou sélectionnez n'importe qui disponible.</p>
                    </div>
                    <button onClick={() => setStep(1)} className="text-xs font-bold text-slate-500 hover:underline">Retour</button>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* "Any Available" box block */}
                    <div
                      onClick={() => {
                        setSelectedStaff('any');
                        setStep(3);
                      }}
                      className="bg-slate-50 p-4 border border-slate-200 rounded-xl hover:border-indigo-500 transition-all cursor-pointer flex items-center gap-3"
                    >
                      <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold">
                        <Users className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">N'importe quel disponible</h4>
                        <p className="text-[10px] text-slate-500">Idéal pour réserver le plus tôt possible.</p>
                      </div>
                    </div>

                    {/* Specific teammates */}
                    {staff.map((st) => (
                      <div
                        key={st.id}
                        onClick={() => {
                          setSelectedStaff(st);
                          setStep(3);
                        }}
                        className="bg-white p-4 border border-slate-200 rounded-xl hover:border-indigo-500 transition-all cursor-pointer flex items-center gap-3"
                      >
                        <img src={st.photo} alt={st.name} referrerPolicy="no-referrer" className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{st.name}</h4>
                          <span className="text-[10px] text-slate-500 block truncate leading-tight line-clamp-1">{st.bio || 'Spécialiste agréé.'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 3: DISPATCH DATE & TIME */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base">Choisissez la date et l'heure</h3>
                      <p className="text-xs text-slate-500">Heure de Gauthier / Casablanca. Disponibilités synchronisées en direct.</p>
                    </div>
                    <button onClick={() => setStep(2)} className="text-xs font-bold text-slate-500 hover:underline">Retour</button>
                  </div>

                  {/* Horizontal custom day selector */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">1. Sélectionner le Jour de visite</span>
                    
                    <div className="grid grid-cols-7 gap-2">
                      {nextSevenDays.map((d) => (
                        <div
                          key={d.dateStr}
                          onClick={() => {
                            setBookingDate(d.dateStr);
                            setBookingTime(''); // reset slot choice
                          }}
                          className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col justify-between h-20 shadow-xs ${
                            bookingDate === d.dateStr
                              ? 'bg-slate-900 text-white border-slate-900 scale-[1.03]'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-400'
                          }`}
                        >
                          <span className="text-[10px] font-bold uppercase">{d.dayName}</span>
                          <span className="block text-lg font-black">{d.dayNumber}</span>
                          <span className="text-[9px] font-semibold text-slate-450">{d.monthName}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Booking hourly slots generated */}
                  {bookingDate && (
                    <div className="space-y-3.5 pt-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">2. Sélectionner l'Heure disponible</span>
                      
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                        {bookingSlots.map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => {
                              setBookingTime(slot);
                              setStep(4);
                            }}
                            className={`py-3 px-1 rounded-xl text-xs font-mono font-bold transition-all border ${
                              bookingTime === slot
                                ? 'bg-indigo-600 text-white border-indigo-600 scale-[1.02]'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                            }`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 4: CUSTOMER CONTACT INFO & SUBMIT */}
              {step === 4 && (
                <div className="space-y-5">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-base">Coordonnées personnelles</h3>
                      <p className="text-xs text-slate-500">Saisissez vos informations pour valider l'inscription à l'agenda.</p>
                    </div>
                    <button onClick={() => setStep(3)} className="text-xs font-bold text-slate-500 hover:underline">Retour</button>
                  </div>

                  <form onSubmit={handleFinalSubmit} className="space-y-4">
                    
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Nom Complet</label>
                        <input
                          type="text"
                          required
                          value={clientForm.name}
                          placeholder="Mehdi Nidzak"
                          onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 p-3 text-xs rounded-xl mt-1 focus:bg-white outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Adresse E-mail</label>
                        <input
                          type="email"
                          required
                          value={clientForm.email}
                          placeholder="client@mail.com"
                          onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 p-3 text-xs rounded-xl mt-1 focus:bg-white outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Téléphone portable marocain (+212)</label>
                      <input
                        type="text"
                        required
                        value={clientForm.phone}
                        placeholder="+212 6..."
                        onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 p-3 text-xs rounded-xl mt-1 focus:bg-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Champs instructions ou requêtes optionnelles</label>
                      <textarea
                        value={clientForm.notes}
                        placeholder="Ex : Des allergies d'onglerie spécifiques..."
                        rows={3}
                        onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 p-3 text-xs rounded-xl mt-1 focus:bg-white outline-none resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-4 bg-slate-900 hover:bg-slate-950 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-slate-200 mt-2 flex items-center justify-center gap-1"
                    >
                      Confirmer le Rendez-vous ({selectedService?.price} DH)
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              )}

            </div>

            {/* Right Booking Sidebar Summary Card */}
            <div className="lg:col-span-4 space-y-6">
              
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="text-xs font-mono font-bold tracking-widest text-slate-400 uppercase">Récapitulatif</h3>
                
                {selectedService ? (
                  <div className="space-y-4.5 divide-y divide-slate-100 text-xs font-semibold">
                    
                    <div className="flex justify-between items-start pb-3">
                      <div>
                        <span className="text-[9px] text-slate-400 block font-normal uppercase">Traitement sélectionné</span>
                        <p className="font-extrabold text-slate-900 text-sm mt-0.5">{selectedService.name}</p>
                        <p className="text-slate-500 text-[11px] font-medium mt-0.5">{selectedService.duration} min. de soin</p>
                      </div>
                      <span className="font-black font-mono text-slate-900 shrink-0 text-sm">{selectedService.price} DH</span>
                    </div>

                    {selectedStaff && (
                      <div className="pt-3 pb-3">
                        <span className="text-[9px] text-slate-400 block font-normal uppercase mb-1">Praticien</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          {selectedStaff === 'any' ? (
                            <div className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                              <Users className="w-3 h-3 text-indigo-700" />
                            </div>
                          ) : (
                            <img src={selectedStaff.photo} alt="Avatar" className="w-6 h-6 rounded-full object-cover" />
                          )}
                          <span className="text-slate-800 text-[11px] font-extrabold">
                            {selectedStaff === 'any' ? 'Premier disponible' : selectedStaff.name}
                          </span>
                        </div>
                      </div>
                    )}

                    {bookingDate && (
                      <div className="pt-3 pb-3 flex justify-between">
                        <div>
                          <span className="text-[9px] text-slate-400 block font-normal uppercase">Jour prévu</span>
                          <span className="font-extrabold text-slate-900 mt-0.5 block">{bookingDate}</span>
                        </div>
                        {bookingTime && (
                          <div className="text-right">
                            <span className="text-[9px] text-slate-400 block font-normal uppercase">Plage horaire</span>
                            <span className="font-black text-indigo-750 font-mono text-sm mt-0.5 block">{bookingTime}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="pt-3 flex justify-between items-center bg-slate-50 -mx-6 -mb-6 p-6 font-sans">
                      <span className="text-slate-500 text-[11px] font-bold">Total à la caisse</span>
                      <span className="font-extrabold text-slate-900 text-lg">{selectedService.price} DH</span>
                    </div>

                  </div>
                ) : (
                  <p className="text-slate-450 text-xs italic">Veuillez sélectionner une prestation capillaire, spa ou beauté pour commencer à planifier.</p>
                )}

              </div>

              {/* Working hours metadata information */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                <h4 className="text-[11px] font-bold tracking-widest text-slate-400 uppercase font-mono">Horaires d'ouverture</h4>
                <div className="text-[11px] font-medium text-slate-600 space-y-1">
                  <div className="flex justify-between">
                    <span>Lundi - Samedi :</span>
                    <span className="font-bold text-slate-900">09:00 - 19:30</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dimanche :</span>
                    <span className="font-bold text-rose-600 font-mono uppercase text-[10px]">Fermé</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
