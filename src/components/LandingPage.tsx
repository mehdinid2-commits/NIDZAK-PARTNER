import React, { useState } from 'react';
import {
  Calendar,
  Sparkles,
  Shield,
  Users,
  Compass,
  ArrowRight,
  TrendingUp,
  CreditCard,
  MessageSquare,
  HelpCircle,
  Scissors,
  Flower,
  User,
  MapPin,
  Mail,
  Phone,
  Check,
  Star
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (view: string, extra?: any) => void;
  businesses: any[];
}

export default function LandingPage({ onNavigate, businesses }: LandingPageProps) {
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [successMsg, setSuccessMsg] = useState('');

  const plans = [
    {
      id: 2,
      name: 'Basic',
      price: '290 DH',
      desc: 'Parfait pour les stylistes indépendants et petits salons.',
      features: [
        'Jusqu\'à 3 employés',
        'Limite de 200 réservations/mois',
        '1 établissement / succursale',
        'Accès aux rapports basiques',
        'Support standard par e-mail'
      ],
      cta: 'Démarrer Basic',
      popular: false
    },
    {
      id: 3,
      name: 'Pro',
      price: '590 DH',
      desc: 'Le choix idéal pour les salons en pleine croissance.',
      features: [
        'Jusqu\'à 10 employés',
        'Limite de 1000 réservations/mois',
        'Jusqu\'à 2 établissements Lyautey/Gauthier',
        'Accès complet aux rapports avancés',
        'Outils Marketing & Notifications',
        'Support prioritaire 24/7'
      ],
      cta: 'Démarrer avec Pro',
      popular: true
    },
    {
      id: 4,
      name: 'Premium',
      price: '1190 DH',
      desc: 'Pour les franchises majeures, spas de luxe et cliniques d\'esthétique.',
      features: [
        'Employés illimités',
        'Réservations illimitées',
        'Jusqu\'à 10 succursales au Maroc',
        'Rapports financiers de comptabilité',
        'Outils Marketing de Fidélisation',
        'Rapports d\'activité et API d\'intégration',
        'Gestionnaire de compte dédié'
      ],
      cta: 'Contacter les Ventes',
      popular: false
    }
  ];

  const categories = [
    { name: 'Coiffure', icon: Scissors, count: '143 salons', color: 'text-indigo-500 bg-indigo-50 border-indigo-100' },
    { name: 'Spa & Relaxation', icon: Flower, count: '89 centres', color: 'text-teal-500 bg-teal-50 border-teal-100' },
    { name: 'Esthétique', icon: Sparkles, count: '112 cliniques', color: 'text-rose-500 bg-rose-50 border-rose-100' },
    { name: 'Barber', icon: User, count: '94 barbershops', color: 'text-amber-500 bg-amber-50 border-amber-100' },
  ];

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('Votre message a été envoyé avec succès ! L\'équipe NIDZAK vous contactera bientôt.');
    setContactForm({ name: '', email: '', message: '' });
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 font-sans" id="landing-container">
      {/* HEADER NAVBAR */}
      <header className="sticky top-0 bg-white/95 backdrop-blur border-b border-slate-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('home')}>
            <div className="bg-indigo-600 text-white p-2 rounded-xl shadow-sm shadow-indigo-100 flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <span className="font-sans font-bold text-xl tracking-tight text-slate-900">NIDZAK</span>
              <span className="text-xs block text-slate-500 -mt-1 font-mono tracking-wider">PARTNER / SAAS</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Fonctionnalités</a>
            <a href="#directory" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Salons Partenaires</a>
            <a href="#pricing" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Tarifs Plans</a>
            <a href="#contact" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Support</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('login')}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 font-sans"
              id="btn-login-nav"
            >
              Connexion
            </button>
            <button
              onClick={() => onNavigate('register')}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium shadow-lg shadow-indigo-150 transition-all font-sans"
              id="btn-register-nav"
            >
              Créer Mon Espace
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative overflow-hidden py-20 lg:py-28 bg-white border-b border-slate-100">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.04),transparent_50%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-full px-4 py-1.5 text-xs font-semibold text-indigo-700 tracking-wide uppercase">
                <Sparkles className="w-3.5 h-3.5" />
                SaaS Multi-locataires de Réservation Intelligent
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-none">
                Gérez votre salon ou spa avec une puissance inégalée
              </h1>
              
              <p className="text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-sans">
                La plateforme SaaS marocaine tout-en-un inspirée des meilleurs outils mondiaux. Agendas pro, fiches clients, abonnements automatisés, et gestion multi-succursales de Casablanca à Marrakech.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <button
                  onClick={() => onNavigate('register')}
                  className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-xl shadow-indigo-200 hover:shadow-indigo-300 transition-all flex items-center justify-center gap-2"
                >
                  Essai Gratuit de 14 Jours
                  <ArrowRight className="w-4 h-4" />
                </button>
                <a
                  href="#directory"
                  className="w-full sm:w-auto px-8 py-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium rounded-xl transition-all text-center"
                >
                  Visiter les Établissements
                </a>
              </div>

              <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-100 max-w-md mx-auto lg:mx-0">
                <div>
                  <span className="block text-3xl font-extrabold text-indigo-600">99.8%</span>
                  <span className="text-xs text-slate-500 font-sans">Taux de présence</span>
                </div>
                <div>
                  <span className="block text-3xl font-extrabold text-emerald-600">+45%</span>
                  <span className="text-xs text-slate-500 font-sans">Productivité relevée</span>
                </div>
                <div>
                  <span className="block text-3xl font-extrabold text-rose-600">10k+</span>
                  <span className="text-xs text-slate-500 font-sans">RDVs confirmés</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-[420px] lg:max-w-none">
                {/* Background decorative glow */}
                <div className="absolute inset-0 bg-indigo-400 rounded-3xl filter blur-3xl opacity-10 transform -rotate-6" />
                
                {/* Mockup Container */}
                <div className="relative bg-slate-900 text-slate-100 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden">
                  <div className="h-10 bg-slate-950 border-b border-slate-900 px-4 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500" />
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-[11px] font-mono text-slate-500 ml-4">latelier-beaute-gauthier.nidzak.ma</span>
                  </div>
                  
                  <div className="p-5 space-y-4 font-sans">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <h4 className="font-bold text-sm text-white">L'Atelier de Beauté</h4>
                        <p className="text-[10px] text-slate-400">Casablanca Gauthier</p>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 rounded font-semibold">
                        Abonné Pro
                      </span>
                    </div>

                    {/* Quick Booking Preview */}
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-3">
                      <span className="text-[11px] font-semibold text-indigo-400 block tracking-wide uppercase">Rendez-vous à venir</span>
                      
                      <div className="flex items-center justify-between text-xs bg-slate-900 border border-slate-800 p-2.5 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                          <div>
                            <p className="font-semibold text-white">Sofia Drissi</p>
                            <p className="text-[10px] text-slate-500">Coupe & Brushing · Yasmina A.</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-white">250 DH</p>
                          <p className="text-[9px] text-indigo-300">11:00 - 11:45</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs bg-slate-900 border border-slate-800 p-2.5 rounded-lg op-80">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                          <div>
                            <p className="font-semibold text-white">Nabil El Fassi</p>
                            <p className="text-[10px] text-slate-500">Pose Gel Semi-perm · Karim R.</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-white">180 DH</p>
                          <p className="text-[9px] text-indigo-300">14:30 - 15:30</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                      <span>2 Membres d'équipe en ligne</span>
                      <span className="font-mono text-indigo-400">Total : 430 DH aujourd'hui</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* CATEGORIES GRID */}
      <section className="py-14 bg-slate-50 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((cat, idx) => {
            const IconComp = cat.icon;
            return (
              <div key={idx} className="bg-white border border-slate-100 rounded-xl p-5 flex items-center gap-4 hover:shadow-md transition-all">
                <div className={`p-3 rounded-lg border ${cat.color}`}>
                  <IconComp className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{cat.name}</h4>
                  <p className="text-xs text-slate-500 font-sans">{cat.count}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* DETAILED FEATURES SECT */}
      <section className="py-20 bg-white" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
              Conçu pour simplifier votre quotidien à 360°
            </h2>
            <p className="text-lg text-slate-600">
              Chaque outil a été conçu à des fins d'efficacité extrême, permettant d'automatiser l'intégralité de vos opérations sans effort technique.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            
            {/* Feature 1 */}
            <div className="space-y-4 p-6 bg-slate-50 rounded-2xl border border-slate-100/50">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Calendrier Fresha-Style</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Agenda ergonomique avec colonnes par employé, code couleur dynamique par statut, et vérification contre le surbooking en temps réel.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="space-y-4 p-6 bg-slate-50 rounded-2xl border border-slate-100/50">
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center shadow-sm">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Multi-Tenancy Isolé</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Chaque commerçant possède un espace cloud étanche et sécurisé. Vos fiches clients, données financières, et configurations sont strictement isolées.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="space-y-4 p-6 bg-slate-50 rounded-2xl border border-slate-100/50">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Rapports & Statistiques</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Visualisez votre chiffre d'affaires, la performance individuelle de vos collaborateurs, vos services les plus demandés, et fidélisez vos clients récurrents.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* DISCOVER ACTIVE REGISTERED BUSINESSES */}
      <section className="py-20 bg-slate-50 border-t border-b border-slate-100" id="directory">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 gap-4">
            <div className="space-y-2">
              <span className="text-xs font-mono font-bold tracking-wider text-indigo-600 uppercase block">Portail de Réservation</span>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Découvrez les salons enregistrés</h2>
            </div>
            <p className="text-slate-500 max-w-sm text-sm">
              Cliquez ci-dessous sur l'un de ces établissements de démonstration pour tester l'expérience client complète. Une réservation enregistrera une notification sur le panel du salon !
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {businesses.length === 0 ? (
              <div className="col-span-full text-center bg-white border border-slate-200 rounded-2xl p-12 text-slate-600">
                <Compass className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <p>Aucun établissement partenaire n'est enregistré pour le moment.</p>
              </div>
            ) : (
              businesses.map((bus) => (
                <div key={bus.id} className="bg-white border border-slate-100 rounded-2xl overflow-hidden hover:shadow-lg transition-all group flex flex-col justify-between">
                  <div>
                    <div className="relative h-48 overflow-hidden bg-slate-100">
                      <img
                        src={bus.cover_image || "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800"}
                        alt={bus.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur text-indigo-600 font-bold text-xs px-2.5 py-1 rounded-full shadow-sm">
                        Sélectionné
                      </div>
                    </div>

                    <div className="p-6 space-y-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={bus.logo || "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=50"}
                          alt="Logo"
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-sm -mt-10 relative z-10"
                        />
                        <div>
                          <h3 className="font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors text-base line-clamp-1">
                            {bus.name}
                          </h3>
                          <div className="flex items-center gap-1 text-[11px] text-slate-500">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span className="line-clamp-1">{bus.address}</span>
                          </div>
                        </div>
                      </div>

                      <p className="text-slate-600 text-xs leading-relaxed line-clamp-2">
                        {bus.description}
                      </p>

                      <div className="flex gap-2 items-center text-xs text-amber-500">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="w-3.5 h-3.5 fill-current" />)}
                        </div>
                        <span className="font-bold text-slate-900">5.0</span>
                        <span className="text-slate-400">(24 avis vérifiés)</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 pt-0 border-t border-slate-50 mt-2">
                    <button
                      onClick={() => onNavigate('public-booking', { businessSlug: bus.slug })}
                      className="w-full mt-4 py-2.5 bg-indigo-50 group-hover:bg-indigo-600 text-indigo-600 group-hover:text-white rounded-xl text-xs font-semibold tracking-wide transition-all flex items-center justify-center gap-1.5"
                    >
                      Prendre Rendez-vous en ligne
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section className="py-20 bg-white" id="pricing">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
            <span className="text-xs font-mono font-bold tracking-wider text-indigo-600 uppercase block">Des prix transparents</span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight sm:text-4xl">
              Des tarifs adaptés à votre croissance
            </h2>
            <p className="text-lg text-slate-650">
              Aucun frais de configuration initial. Changez d'offre à tout moment selon l'évolution de vos succursales.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 items-stretch">
            {plans.map((p) => (
              <div
                key={p.id}
                className={`bg-white rounded-2xl border p-8 flex flex-col justify-between relative transition-all ${
                  p.popular
                    ? 'border-2 border-indigo-600 shadow-xl shadow-indigo-100/55 scale-105 z-10'
                    : 'border-slate-100 shadow-sm hover:border-indigo-200'
                }`}
              >
                {p.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white font-mono font-bold text-[9px] tracking-widest px-3 py-1 rounded-full uppercase">
                    RECOMMANDÉ
                  </span>
                )}

                <div className="space-y-6">
                  <div>
                    <h3 className="font-extrabold text-xl text-slate-900">{p.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">{p.desc}</p>
                  </div>

                  <div className="flex items-baseline gap-1 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <span className="text-3xl font-extrabold text-slate-900">{p.price}</span>
                    <span className="text-xs text-slate-500">/ mois</span>
                  </div>

                  <ul className="space-y-3.5 text-xs text-slate-600 pt-2">
                    {p.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-8">
                  <button
                    onClick={() => {
                      if (p.id === 4) {
                        const contactEl = document.getElementById('contact');
                        if (contactEl) contactEl.scrollIntoView({ behavior: 'smooth' });
                      } else {
                        onNavigate('register');
                      }
                    }}
                    className={`w-full py-3 rounded-xl text-xs font-bold tracking-wider transition-all uppercase ${
                      p.popular
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200'
                        : 'bg-slate-100 hover:bg-slate-250 text-slate-800'
                    }`}
                  >
                    {p.cta}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT SUPPORT */}
      <section className="py-20 bg-slate-50 border-t border-slate-100" id="contact">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 bg-white border border-slate-150 rounded-2xl shadow-xl shadow-slate-100 p-8 sm:p-12">
          <div className="grid md:grid-cols-2 gap-12">
            
            <div className="space-y-6">
              <span className="text-[11px] font-mono tracking-widest text-indigo-700 uppercase font-black">Support d'Assistance</span>
              <h2 className="text-3xl font-extrabold text-slate-900">Discutons de votre projet</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Des questions sur l'intégration système ? Notre équipe basée à Casablanca est disponible pour vous accompagner dans l'importation de vos données Fresha existantes.
              </p>
              
              <div className="space-y-4 pt-4 text-xs font-medium text-slate-700">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span>support@nidzak.com</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>+212 522 11 22 33</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span>Rue Gauthier, Quartier Gauthier, Casablanca</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleContactSubmit} className="space-y-4">
              {successMsg && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg p-3 text-xs font-semibold">
                  {successMsg}
                </div>
              )}
              
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Nom ou Entreprise</label>
                <input
                  type="text"
                  required
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-4 py-2.5 text-sm outline-none transition-all mt-1"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Adresse E-mail</label>
                <input
                  type="email"
                  required
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-4 py-2.5 text-sm outline-none transition-all mt-1"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Votre Message</label>
                <textarea
                  required
                  rows={4}
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl px-4 py-2.5 text-sm outline-none transition-all mt-1 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-slate-900 hover:bg-slate-950 text-white rounded-xl text-xs font-bold tracking-wider uppercase transition-all"
              >
                Envoyer le Message
              </button>
            </form>

          </div>
        </div>
      </section>

      {/* LANDING FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white">
              <Calendar className="w-5 h-5 text-indigo-500" />
              <span className="font-bold text-lg tracking-tight">NIDZAK Partner</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-sans">
              La solution SaaS de référence pour la croissance des entreprises de services, salons de coiffure et instituts de massage au Maroc.
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3 font-mono">Fonctionnalités</h4>
            <ul className="space-y-2 text-xs">
              <li><span className="hover:text-indigo-400 cursor-pointer">Agenda Intelligent</span></li>
              <li><span className="hover:text-indigo-400 cursor-pointer">Fiches Clients isolées</span></li>
              <li><span className="hover:text-indigo-400 cursor-pointer">Tableau de Bord</span></li>
              <li><span className="hover:text-indigo-400 cursor-pointer">Facturation Automatisée</span></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3 font-mono">SaaS Plans</h4>
            <ul className="space-y-2 text-xs">
              <li><span className="hover:text-indigo-400 cursor-pointer">Free Trial (14 jours)</span></li>
              <li><span className="hover:text-indigo-400 cursor-pointer">Plan Basic</span></li>
              <li><span className="hover:text-indigo-400 cursor-pointer">Plan Pro</span></li>
              <li><span className="hover:text-indigo-400 cursor-pointer">Plan Premium</span></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3 font-mono">Administrateur</h4>
            <p className="text-xs text-slate-500 mb-3">
              Compte administrateur général du portail hébergé.
            </p>
            <button
              onClick={() => onNavigate('login')}
              className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-white border border-slate-750 text-xs font-semibold rounded-lg transition-all"
            >
              Console Super Admin
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800 mt-8 pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500">
          <span>© 2026 NIDZAK Partner. Tous droits réservés.</span>
          <div className="flex gap-4 mt-2 md:mt-0">
            <span className="hover:underline cursor-pointer">Mentions Légales</span>
            <span className="hover:underline cursor-pointer">RGPD / Confidentialité</span>
            <span className="hover:underline cursor-pointer font-mono text-[9px]">v1.0.0</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
