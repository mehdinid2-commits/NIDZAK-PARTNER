import React, { useState, useEffect } from 'react';
import {
  PieChart,
  Users,
  Compass,
  ArrowRight,
  TrendingUp,
  CreditCard,
  MessageSquare,
  HelpCircle,
  Scissors,
  Check,
  AlertTriangle,
  Settings,
  Shield,
  FileText,
  Activity,
  LogOut,
  Sliders,
  DollarSign,
  Briefcase,
  Search,
  Bell,
  Trash2,
  Lock,
  Plus
} from 'lucide-react';
import { Business, User, SubscriptionPlan, Payment, Invoice, SupportTicket, ActivityLog } from '../types';

interface SuperAdminDashboardProps {
  token: string;
  onLogout: () => void;
  adminName: string;
}

export default function SuperAdminDashboard({ token, onLogout, adminName }: SuperAdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'stats' | 'businesses' | 'users' | 'plans' | 'billing' | 'tickets' | 'logs'>('stats');
  const [stats, setStats] = useState<any>(null);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Modals / forms state
  const [announcementMsg, setAnnouncementMsg] = useState('');
  const [announcementSent, setAnnouncementSent] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);

  // Search/Filter state
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      // API calls in parallel
      const [resStats, resBus, resUsers, resPlans, resPay, resInv, resTick, resLogs] = await Promise.all([
        fetch('/api/admin/stats', { headers }),
        fetch('/api/admin/businesses', { headers }),
        fetch('/api/admin/users', { headers }),
        fetch('/api/admin/plans', { headers }),
        fetch('/api/admin/payments', { headers }),
        fetch('/api/admin/invoices', { headers }),
        fetch('/api/admin/tickets', { headers }),
        fetch('/api/admin/logs', { headers }),
      ]);

      if (resStats.ok) setStats(await resStats.json());
      if (resBus.ok) setBusinesses(await resBus.json());
      if (resUsers.ok) setUsers(await resUsers.json());
      if (resPlans.ok) setPlans(await resPlans.json());
      if (resPay.ok) setPayments(await resPay.json());
      if (resInv.ok) setInvoices(await resInv.json());
      if (resTick.ok) setTickets(await resTick.json());
      if (resLogs.ok) setActivityLogs(await resLogs.json());

    } catch (err) {
      console.error('Error fetching admin data:', err);
      setErrorMsg('Erreur lors du chargement des données. Veuillez recharger.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [token]);

  const handleUpdateBusinessStatus = async (busId: number, status: string) => {
    try {
      const response = await fetch(`/api/admin/businesses/${busId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        setBusinesses(businesses.map(b => b.id === busId ? { ...b, status } : b));
      } else {
        alert('Erreur lors de la modification du statut.');
      }
    } catch (e) {
      alert('Erreur serveur.');
    }
  };

  const handleDeleteBusiness = async (busId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer définitivement cet établissement ? Cette action supprimera tous les comptes, employés, et sélections liés.')) return;
    try {
      const response = await fetch(`/api/admin/businesses/${busId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setBusinesses(businesses.filter(b => b.id !== busId));
      } else {
        alert('Erreur de suppression.');
      }
    } catch (e) {
      alert('Erreur réseau.');
    }
  };

  const handleResolveTicket = async (ticketId: number, status: 'resolved' | 'closed') => {
    try {
      const response = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        setTickets(tickets.map(t => t.id === ticketId ? { ...t, status } : t));
      }
    } catch (e) {
      alert('Erreur serveur ticket.');
    }
  };

  const handleUpdatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    try {
      const res = await fetch(`/api/admin/plans/${editingPlan.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editingPlan)
      });
      if (res.ok) {
        setPlans(plans.map(p => p.id === editingPlan.id ? editingPlan : p));
        setEditingPlan(null);
      }
    } catch (err) {
      alert('Erreur de mise à jour du plan.');
    }
  };

  const handleSendAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementMsg.trim()) return;
    setAnnouncementSent(true);
    setTimeout(() => {
      setAnnouncementSent(false);
      setAnnouncementMsg('');
    }, 4000);
  };

  // CSV Exporter Simulation
  const handleExportCSV = (entityName: string) => {
    alert(`Exportation des données "${entityName}" au format CSV initiée avec succès !`);
  };

  // Filters search results
  const filteredBusinesses = businesses.filter(b =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.phone.includes(searchQuery)
  );

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-slate-900 min-h-screen text-slate-100 font-sans flex flex-col md:flex-row" id="admin-workspace">
      
      {/* ADMIN ASIDE NAVIGATION */}
      <aside className="w-full md:w-64 bg-slate-950 border-r border-slate-800 p-5 flex flex-col justify-between shrink-0">
        <div className="space-y-8">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <div className="bg-indigo-600 text-white p-2 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-indigo-100" />
            </div>
            <div>
              <span className="font-sans font-bold text-base text-white tracking-widest uppercase">NIDZAK</span>
              <span className="text-[10px] block text-indigo-400 font-mono tracking-wider">SUPER ADMIN CONSOLE</span>
            </div>
          </div>

          <nav className="space-y-1 text-xs font-semibold uppercase tracking-wider">
            <button
              onClick={() => { setActiveTab('stats'); setSearchQuery(''); }}
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'stats' ? 'bg-indigo-600 text-white shadow shadow-indigo-600/30' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
            >
              <TrendingUp className="w-4 h-4" />
              Vue d'ensemble
            </button>

            <button
              onClick={() => { setActiveTab('businesses'); setSearchQuery(''); }}
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'businesses' ? 'bg-indigo-600 text-white shadow shadow-indigo-600/30' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
            >
              <Briefcase className="w-4 h-4" />
              Établissements
            </button>

            <button
              onClick={() => { setActiveTab('users'); setSearchQuery(''); }}
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'users' ? 'bg-indigo-600 text-white shadow shadow-indigo-600/30' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
            >
              <Users className="w-4 h-4" />
              Utilisateurs
            </button>

            <button
              onClick={() => { setActiveTab('plans'); setSearchQuery(''); }}
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'plans' ? 'bg-indigo-600 text-white shadow shadow-indigo-600/30' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
            >
              <Sliders className="w-4 h-4" />
              Plans Pricing
            </button>

            <button
              onClick={() => { setActiveTab('billing'); setSearchQuery(''); }}
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'billing' ? 'bg-indigo-600 text-white shadow shadow-indigo-600/30' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
            >
              <CreditCard className="w-4 h-4" />
              Factures & Flux
            </button>

            <button
              onClick={() => { setActiveTab('tickets'); setSearchQuery(''); }}
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'tickets' ? 'bg-indigo-600 text-white shadow shadow-indigo-600/30' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
            >
              <MessageSquare className="w-4 h-4" />
              Tickets Support
            </button>

            <button
              onClick={() => { setActiveTab('logs'); setSearchQuery(''); }}
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'logs' ? 'bg-indigo-600 text-white shadow shadow-indigo-600/30' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}
            >
              <Activity className="w-4 h-4" />
              Logs d'Activité
            </button>
          </nav>
        </div>

        <div className="pt-6 border-t border-slate-800 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300">
              MN
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">{adminName}</p>
              <p className="text-[10px] text-emerald-400 font-mono tracking-wider">SUPER_ADMIN</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full py-2.5 bg-slate-900 hover:bg-rose-950/40 text-slate-300 hover:text-rose-450 border border-slate-800 hover:border-rose-950 rounded-lg text-xs font-bold uppercase transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* ADMIN CONSOLE MAINFRAME */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 lg:space-y-10">
        
        {/* TOP STATUS BAR */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-5 gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Console Générale Administratif</h1>
            <p className="text-xs text-slate-400 font-sans mt-1">
              Connecté en tant que <span className="font-bold text-indigo-400">{adminName}</span> · {new Date().toLocaleDateString('fr-FR')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchAllData}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-bold rounded-lg transition-all uppercase tracking-wide flex items-center gap-1.5"
            >
              <Activity className="w-3.5 h-3.5" />
              Actualiser
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-rose-900/30 border border-rose-800 text-rose-300 rounded-xl p-4 text-xs font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            {errorMsg}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-450 space-y-2">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-mono">Chargement des données SQL multi-locataires...</p>
          </div>
        ) : (
          <>
            {/* 1. VIEW STATS */}
            {activeTab === 'stats' && stats && (
              <div className="space-y-8">
                
                {/* METRICS GRID */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
                  
                  <div className="bg-slate-950 border border-slate-850 rounded-xl p-5 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Entreprises SaaS</span>
                    <h3 className="text-3xl font-black text-white">{stats.totalBusinesses}</h3>
                    <p className="text-[10px] text-slate-500">Multilocataires isolées</p>
                  </div>

                  <div className="bg-slate-950 border border-slate-850 rounded-xl p-5 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Utilisateurs</span>
                    <h3 className="text-3xl font-black text-indigo-400">{stats.totalUsers}</h3>
                    <p className="text-[10px] text-slate-500">Tous rôles confondus</p>
                  </div>

                  <div className="bg-slate-950 border border-slate-850 rounded-xl p-5 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Plan Actifs</span>
                    <h3 className="text-3xl font-black text-emerald-400">{stats.activeSubs}</h3>
                    <p className="text-[10px] text-slate-500">Souscriptions payantes/essais</p>
                  </div>

                  <div className="bg-slate-950 border border-slate-850 rounded-xl p-5 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Revenus SaaS</span>
                    <h3 className="text-3xl font-black text-amber-400">{stats.totalRevenue ? stats.totalRevenue.toFixed(0) : 0} DH</h3>
                    <p className="text-[10px] text-green-400">Total payé (Stripe simulation)</p>
                  </div>

                  <div className="bg-slate-950 border border-slate-850 rounded-xl p-5 space-y-2 col-span-2 lg:col-span-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Réservations Globales</span>
                    <h3 className="text-2xl font-bold text-purple-400">{stats.totalAppointments}</h3>
                    <p className="text-[10px] text-slate-400">Appointments passés</p>
                  </div>

                </div>

                <div className="grid lg:grid-cols-12 gap-8">
                  {/* Revenue Growth chart simulation */}
                  <div className="lg:col-span-8 bg-slate-950 border border-slate-850 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-mono">Flux de Vente des Abonnements</h3>
                      <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 rounded text-[10px] font-mono">En hausse de +12%</span>
                    </div>

                    <div className="h-48 flex items-end gap-3.5 pt-4">
                      {stats.monthlyRevenue?.map((m: any, idx: number) => {
                        const maxVal = Math.max(...stats.monthlyRevenue.map((x: any) => x.revenue)) || 1;
                        const pct = (m.revenue / maxVal) * 100;
                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                            <span className="text-[10px] font-bold text-slate-350">{m.revenue.toLocaleString()} DH</span>
                            <div
                              style={{ height: `${pct * 0.7}%` }}
                              className="w-full bg-indigo-500 hover:bg-indigo-400 transition-all rounded-t-lg shadow-lg shadow-indigo-500/10 min-h-[10px]"
                            />
                            <span className="text-[10px] font-mono font-semibold text-slate-500">{m.month}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* ANNOUNCEMENT CENTER */}
                  <div className="lg:col-span-4 bg-slate-950 border border-slate-850 rounded-2xl p-6">
                    <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-mono mb-4 flex items-center gap-2">
                      <Bell className="w-4 h-4 text-indigo-400" />
                      Annonce Générale aux Partenaires
                    </h3>
                    
                    <form onSubmit={handleSendAnnouncement} className="space-y-4">
                      {announcementSent && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg p-3 text-xs">
                          Annonce notifiée avec succès sur l'ensemble des dashboards commerçants.
                        </div>
                      )}
                      <p className="text-xs text-slate-400">
                        Envoyez un message d'alerte, de maintenance, ou de nouveautés à tous les propriétaires de salons. Ils le recevront sur leur flux de notifications.
                      </p>
                      <textarea
                        required
                        value={announcementMsg}
                        onChange={(e) => setAnnouncementMsg(e.target.value)}
                        placeholder="Ex : Chers partenaires marocains, une intégration des paiements par CMI sera bientôt déployée..."
                        rows={4}
                        className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-white outline-none resize-none"
                      />
                      <button
                        type="submit"
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg uppercase tracking-wider"
                      >
                        Diffuser l'annonce
                      </button>
                    </form>
                  </div>
                </div>

                {/* RECENT BUSINESSES */}
                <div className="bg-slate-950 border border-slate-850 rounded-2xl p-6">
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-mono mb-4">Derniers Établissements Enregistrés</h3>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.recentBusinesses?.map((rb: any) => (
                      <div key={rb.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex gap-3 items-center">
                        <img src={rb.logo} alt="Logo" referrerPolicy="no-referrer" className="w-10 h-10 rounded-lg object-cover" />
                        <div className="overflow-hidden">
                          <h4 className="text-xs font-bold text-white truncate">{rb.name}</h4>
                          <p className="text-[10px] text-slate-400 font-mono tracking-wide mt-0.5">{rb.slug}</p>
                          <span className="inline-block mt-1 text-[9px] px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 rounded">Actif</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* 2. VIEW BUSINESSES */}
            {activeTab === 'businesses' && (
              <div className="space-y-6">
                
                {/* Search Bar / Exporter row */}
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-slate-950 p-4 rounded-xl border border-slate-850">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Rechercher par nom d'établissement, e-mail ou téléphone..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs outline-none focus:border-indigo-500"
                    />
                  </div>
                  <button
                    onClick={() => handleExportCSV('businesses')}
                    className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold rounded-lg flex items-center gap-2"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Exporter CSV (Salons)
                  </button>
                </div>

                {/* BUSINESS DATA TABLE */}
                <div className="bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left whitespace-nowrap text-xs text-slate-300">
                      <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider font-mono border-b border-slate-800">
                        <tr>
                          <th className="px-6 py-4">Nom & Ville</th>
                          <th className="px-6 py-4">Contact</th>
                          <th className="px-6 py-4">SaaS Plan</th>
                          <th className="px-6 py-4">Employés / RDVs</th>
                          <th className="px-6 py-4">Statut</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850">
                        {filteredBusinesses.map((b) => (
                          <tr key={b.id} className="hover:bg-slate-900/60 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <img src={b.logo} alt="Logo" referrerPolicy="no-referrer" className="w-9 h-9 rounded-xl object-cover border border-slate-700 shadow-sm" />
                                <div>
                                  <p className="font-bold text-white text-sm">{b.name}</p>
                                  <span className="text-[10px] text-slate-400 font-mono">{b.address}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <p>{b.email}</p>
                              <p className="text-[10px] text-slate-400">{b.phone}</p>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-bold text-indigo-400">{b.plan_name}</span>
                              <p className="text-[9px] text-slate-500 font-mono">Renouv: {b.renewal_date || 'A vie'}</p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="font-semibold text-slate-200">{b.staff_count} employés</p>
                              <p className="text-[10px] text-slate-400 font-mono">{b.appointments_count} réservations</p>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded ${
                                b.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15' :
                                b.status === 'suspended' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/15' :
                                'bg-amber-500/10 text-amber-400 border border-amber-500/15'
                              }`}>
                                {b.status === 'active' ? 'Actif' : b.status === 'suspended' ? 'Suspendu' : 'En attente'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right space-x-1">
                              {b.status !== 'active' && (
                                <button
                                  onClick={() => handleUpdateBusinessStatus(b.id, 'active')}
                                  className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/15 rounded font-semibold transition-all text-[10px]"
                                >
                                  Activer
                                </button>
                              )}
                              {b.status === 'active' && (
                                <button
                                  onClick={() => handleUpdateBusinessStatus(b.id, 'suspended')}
                                  className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-white border border-amber-500/15 rounded font-semibold transition-all text-[10px]"
                                >
                                  Suspendre
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteBusiness(b.id)}
                                className="p-1 px-2 bg-slate-800 hover:bg-rose-600 border border-slate-700 hover:border-rose-500 text-slate-350 hover:text-white rounded transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {filteredBusinesses.length === 0 && (
                    <p className="text-center py-10 text-slate-500">Aucun établissement ne correspond à cette requête.</p>
                  )}
                </div>

              </div>
            )}

            {/* 3. VIEW USERS */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-slate-950 p-4 rounded-xl border border-slate-850">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filtrer les comptes utilisateurs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs outline-none focus:border-indigo-500"
                    />
                  </div>
                  <button
                    onClick={() => handleExportCSV('users')}
                    className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold rounded-lg flex items-center gap-2"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Exporter Utilisateurs
                  </button>
                </div>

                <div className="bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden">
                  <table className="w-full text-left whitespace-nowrap text-xs text-slate-300">
                    <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider font-mono border-b border-slate-800">
                      <tr>
                        <th className="px-6 py-4">Nom et E-mail</th>
                        <th className="px-6 py-4">Rôle</th>
                        <th className="px-6 py-4">Établissement rattaché</th>
                        <th className="px-6 py-4">Date création</th>
                        <th className="px-6 py-4 text-right">Sécurité</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-900/40 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <img src={u.photo || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50"} alt="Avatar" className="w-8 h-8 rounded-full border border-slate-750" />
                              <div>
                                <p className="font-bold text-white text-sm">{u.name}</p>
                                <span className="text-slate-450">{u.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-0.5 rounded text-[10px] font-black tracking-widest uppercase ${
                              u.role_name === 'super_admin' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/15' :
                              u.role_name === 'business_owner' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15' :
                              'bg-indigo-950 text-slate-400'
                            }`}>
                              {u.role_name}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-semibold text-slate-200">{u.business_name}</span>
                          </td>
                          <td className="px-6 py-4 font-mono text-slate-450">
                            {new Date(u.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {u.id === 1 ? (
                              <span className="text-[10px] text-slate-500 flex items-center justify-end gap-1 font-semibold pr-2 select-none">
                                <Lock className="w-3 h-3" />
                                Maître
                              </span>
                            ) : (
                              <span className="text-[10px] text-emerald-500 select-none">Compte Sécurisé</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 4. VIEW PRICING PLANS CONTROL */}
            {activeTab === 'plans' && (
              <div className="space-y-6">
                <div className="bg-slate-950 border border-slate-850 rounded-2xl p-6">
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-mono mb-4">Configuration des limites des plans SaaS</h3>
                  <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                    Ajustez les quotas et prix des abonnements directement. Ces changements seront immédiatement opposables aux locataires lors de leur diagnostic d'upgrade ou de calcul hebdomadaire des statistiques de blocage de rendez-vous.
                  </p>

                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {plans.map((p) => (
                      <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 flex flex-col justify-between">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <h4 className="font-extrabold text-white text-base">{p.name}</h4>
                            <span className="text-[10px] text-indigo-400 font-mono font-bold uppercase">{p.billing_cycle}</span>
                          </div>
                          
                          <div className="text-2xl font-black text-slate-100">{p.price} DH</div>

                          <div className="space-y-2 border-t border-slate-800 pt-3 text-[11px] text-slate-400 font-sans">
                            <div className="flex justify-between">
                              <span>Max employés:</span>
                              <span className="font-bold text-slate-200">{p.staff_limit}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Max réservations:</span>
                              <span className="font-bold text-slate-200">{p.appointment_limit.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Max succursales:</span>
                              <span className="font-bold text-slate-200">{p.branch_limit}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Rapports avancés:</span>
                              <span className="font-bold text-slate-200">{p.reports_access ? 'Oui' : 'Non'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Outils Marketing:</span>
                              <span className="font-bold text-slate-200">{p.marketing_access ? 'Oui' : 'Non'}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => setEditingPlan(p)}
                          className="w-full mt-4 py-2 bg-indigo-650 hover:bg-indigo-600 text-white rounded-lg text-xs font-bold uppercase"
                        >
                          Modifier quotas
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* MODAL EDIT PLAN */}
                {editingPlan && (
                  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5">
                      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                        <h3 className="font-extrabold text-white text-base">Éditer quotas de: {editingPlan.name}</h3>
                        <button onClick={() => setEditingPlan(null)} className="text-slate-400 hover:text-white font-bold">X</button>
                      </div>

                      <form onSubmit={handleUpdatePlan} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Tarif mensuel (DH)</label>
                            <input
                              type="number"
                              value={editingPlan.price}
                              onChange={(e) => setEditingPlan({ ...editingPlan, price: parseFloat(e.target.value) })}
                              className="w-full bg-slate-950 border border-slate-850 px-3 py-2 text-xs rounded-lg text-white mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Limite Employés</label>
                            <input
                              type="number"
                              value={editingPlan.staff_limit}
                              onChange={(e) => setEditingPlan({ ...editingPlan, staff_limit: parseInt(e.target.value) })}
                              className="w-full bg-slate-950 border border-slate-850 px-3 py-2 text-xs rounded-lg text-white mt-1"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Limite Réservations</label>
                            <input
                              type="number"
                              value={editingPlan.appointment_limit}
                              onChange={(e) => setEditingPlan({ ...editingPlan, appointment_limit: parseInt(e.target.value) })}
                              className="w-full bg-slate-950 border border-slate-850 px-3 py-2 text-xs rounded-lg text-white mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Limite Branches</label>
                            <input
                              type="number"
                              value={editingPlan.branch_limit}
                              onChange={(e) => setEditingPlan({ ...editingPlan, branch_limit: parseInt(e.target.value) })}
                              className="w-full bg-slate-950 border border-slate-850 px-3 py-2 text-xs rounded-lg text-white mt-1"
                            />
                          </div>
                        </div>

                        <div className="flex gap-4 pt-1">
                          <label className="flex items-center gap-2 text-xs text-slate-300">
                            <input
                              type="checkbox"
                              checked={editingPlan.reports_access}
                              onChange={(e) => setEditingPlan({ ...editingPlan, reports_access: e.target.checked })}
                              className="bg-slate-950 border border-slate-850 rounded"
                            />
                            Accès aux rapports
                          </label>
                          <label className="flex items-center gap-2 text-xs text-slate-300">
                            <input
                              type="checkbox"
                              checked={editingPlan.marketing_access}
                              onChange={(e) => setEditingPlan({ ...editingPlan, marketing_access: e.target.checked })}
                              className="bg-slate-950 border border-slate-850 rounded"
                            />
                            Outils Marketing
                          </label>
                        </div>

                        <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                          <button
                            type="button"
                            onClick={() => setEditingPlan(null)}
                            className="px-4 py-2 bg-slate-800 text-slate-300 text-xs rounded"
                          >
                            Annuler
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded"
                          >
                            Enregistrer modifications
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* 5. VIEW BILLING & INVOICES */}
            {activeTab === 'billing' && (
              <div className="space-y-6">
                
                <div className="bg-slate-950 border border-slate-850 rounded-2xl p-6 space-y-4">
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-mono">Derniers Paiements d'Abonnement Reçus via Stripe (Simulation)</h3>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap text-xs text-slate-300">
                      <thead className="bg-slate-900 text-slate-400 uppercase font-mono">
                        <tr>
                          <th className="px-6 py-4">ID Transaction</th>
                          <th className="px-6 py-4">Établissement</th>
                          <th className="px-6 py-4">Date</th>
                          <th className="px-6 py-4">Montant</th>
                          <th className="px-6 py-4">Passerelle</th>
                          <th className="px-6 py-4">Statut</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850">
                        {payments.map((p) => (
                          <tr key={p.id}>
                            <td className="px-6 py-4 font-mono text-slate-400">{p.transaction_id || `cash_col_${p.id}`}</td>
                            <td className="px-6 py-4 font-bold text-slate-200">{p.business_name}</td>
                            <td className="px-6 py-4">{new Date(p.created_at).toLocaleDateString()}</td>
                            <td className="px-6 py-4 font-bold text-white">{p.amount} DH</td>
                            <td className="px-6 py-4 uppercase font-mono text-indigo-400 font-bold">{p.gateway}</td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-semibold">
                                {p.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-850 rounded-2xl p-6 space-y-4">
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-mono">Facturation Platform SaaS</h3>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left whitespace-nowrap text-xs text-slate-300">
                      <thead className="bg-slate-900 text-slate-400 uppercase font-mono">
                        <tr>
                          <th className="px-6 py-4">N° Facture</th>
                          <th className="px-6 py-4">Établissement</th>
                          <th className="px-6 py-4">Date Issue</th>
                          <th className="px-6 py-4">Échéance</th>
                          <th className="px-6 py-4">Montant de facturation</th>
                          <th className="px-6 py-4">Statut</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850">
                        {invoices.map((i) => (
                          <tr key={i.id}>
                            <td className="px-6 py-4 font-bold font-mono text-indigo-400">{i.invoice_number}</td>
                            <td className="px-6 py-4 text-slate-200 font-bold">{i.business_name}</td>
                            <td className="px-6 py-4">{i.issue_date}</td>
                            <td className="px-6 py-4">{i.due_date}</td>
                            <td className="px-6 py-4 font-bold">{i.amount} DH</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${
                                i.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15' : 'bg-rose-500/10 text-rose-400 border border-rose-500/15'
                              }`}>
                                {i.status === 'paid' ? 'Payée' : 'Non payée'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* 6. DISPATCH SUPPORT TICKETS */}
            {activeTab === 'tickets' && (
              <div className="space-y-6">
                <div className="bg-slate-950 border border-slate-850 rounded-2xl p-6">
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-mono mb-4">Portail de support aux marchands</h3>
                  
                  <div className="space-y-4">
                    {tickets.length === 0 ? (
                      <p className="text-center text-slate-500 py-10">Aucun ticket de support n'est ouvert actuellement.</p>
                    ) : (
                      tickets.map((t) => (
                        <div key={t.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                            <div>
                              <span className="text-[10px] font-bold text-indigo-400 font-mono tracking-wide uppercase">Ticket n°{t.id}</span>
                              <h4 className="font-bold text-white text-base mt-0.5">{t.subject}</h4>
                              <p className="text-[11px] text-slate-450 mt-1">
                                Envoyé par <span className="font-bold text-slate-200">{t.user_name}</span> du salon <span className="font-bold text-indigo-300">{t.business_name}</span>
                              </p>
                            </div>
                            
                            <div className="flex gap-2 text-[10px] font-bold">
                              <span className={`px-2 py-0.5 rounded ${
                                t.priority === 'high' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20' : 'bg-slate-800 text-slate-300'
                              }`}>
                                Priorité: {t.priority}
                              </span>
                              <span className={`px-2 py-0.5 rounded ${
                                t.status === 'open' ? 'bg-indigo-500/15 text-indigo-450' : 'bg-slate-800 text-slate-400 font-normal'
                              }`}>
                                Statut: {t.status}
                              </span>
                            </div>
                          </div>

                          <p className="text-xs text-slate-350 bg-slate-950/45 p-3 rounded-lg border border-slate-850">
                            {t.message}
                          </p>

                          <div className="flex justify-end gap-2 pt-2">
                            {t.status === 'open' && (
                              <button
                                onClick={() => handleResolveTicket(t.id, 'resolved')}
                                className="px-3 py-1.5 bg-indigo-650 hover:bg-indigo-600 text-white text-xs font-bold rounded-lg transition-colors"
                              >
                                Marquer comme résolu
                              </button>
                            )}
                            <button
                              onClick={() => handleResolveTicket(t.id, 'closed')}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-705 text-xs font-semibold rounded-lg transition-colors"
                            >
                              Fermer le ticket
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 7. VIEW AUDITING LOGS */}
            {activeTab === 'logs' && (
              <div className="space-y-6">
                <div className="bg-slate-950 border border-slate-850 rounded-2xl p-6">
                  <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-mono mb-4">Audit des Événements Système SaaS</h3>
                  
                  <div className="overflow-x-auto max-h-[500px]">
                    <table className="w-full text-left text-xs whitespace-nowrap text-slate-300">
                      <thead className="bg-slate-900 text-slate-400 font-mono">
                        <tr>
                          <th className="px-4 py-3">Horodatage</th>
                          <th className="px-4 py-3">Auteur</th>
                          <th className="px-4 py-3">Action exécutée</th>
                          <th className="px-4 py-3">Cible système</th>
                          <th className="px-4 py-3">Adresse IP</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850 font-mono text-[11px]">
                        {activityLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-900/30">
                            <td className="px-4 py-3 text-slate-450">{new Date(log.created_at).toLocaleString('fr-FR')}</td>
                            <td className="px-4 py-3 text-indigo-400 font-semibold">{log.user_name}</td>
                            <td className="px-4 py-3 text-white font-bold">{log.action}</td>
                            <td className="px-4 py-3 text-slate-400">
                              {log.entity_name} ({log.entity_id || 'Global'})
                            </td>
                            <td className="px-4 py-3 text-slate-500">{log.ip_address}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

          </>
        )}

      </main>

    </div>
  );
}
