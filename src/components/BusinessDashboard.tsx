import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
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
  Plus,
  Edit,
  Clock,
  MapPin,
  PlusCircle,
  Eye,
  UserCheck,
  CalendarDays,
  FileCheck2,
  UploadCloud,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Save,
  Gift,
  BarChart3,
  ShoppingBag,
  Printer,
  Download,
  CheckCircle2,
  Calculator,
  Package,
  Tag
} from 'lucide-react';
import { Business, Service, Staff, Client, Appointment, SubscriptionPlan, Subscription, Invoice, Payment, WorkingHour } from '../types';

interface BusinessDashboardProps {
  businessId: number;
  token: string;
  onLogout: () => void;
  ownerName: string;
}

export default function BusinessDashboard({ businessId, token, onLogout, ownerName }: BusinessDashboardProps) {
  const [activePane, setActivePane] = useState<'dashboard' | 'calendar' | 'appointments' | 'clients' | 'services' | 'staff' | 'branches' | 'billing' | 'settings' | 'reports' | 'gift_cards' | 'products' | 'promotions'>('dashboard');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Primary Hydrated State from SQL Multi-tenant APIs
  const [stats, setStats] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [sub, setSub] = useState<Subscription | null>(null);
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);

  // Products & Promotions System
  const [products, setProducts] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [productForm, setProductForm] = useState({ name: '', sku: '', price: '', cost_price: '', stock: '10', category: '', supplier: '' });
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [editProductForm, setEditProductForm] = useState({ name: '', sku: '', price: '', cost_price: '', stock: '10', category: '', supplier: '' });
  const [showAddPromotion, setShowAddPromotion] = useState(false);
  const [promotionForm, setPromotionForm] = useState({ name: '', code: '', discount_type: 'percent', discount_value: '10', status: 'active', expires_at: '' });

  // Gift Card systems
  const [giftCards, setGiftCards] = useState<any[]>([]);
  const [showAddGiftCard, setShowAddGiftCard] = useState(false);
  const [giftCardForm, setGiftCardForm] = useState({ code: '', initial_amount: '200', client_name: '', client_phone: '', expires_at: '' });

  // Order checkout flow
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutAppt, setCheckoutAppt] = useState<any | null>(null);
  const [checkoutForm, setCheckoutForm] = useState({ payment_method: 'cash', gift_card_code: '', product_id: '', promotion_code: '' });
  const [generatedTicket, setGeneratedTicket] = useState<any | null>(null);
  const [showTicketModal, setShowTicketModal] = useState(false);

  // Reports
  const [reportDuration, setReportDuration] = useState<'today' | 'week' | 'month' | 'all'>('month');

  // Filter keys
  const [query, setQuery] = useState('');
  const [calendarDate, setCalendarDate] = useState<string>(new Date().toISOString().slice(0, 10));

  // Modals state triggers
  const [showAddAppt, setShowAddAppt] = useState(false);
  const [showAddService, setShowAddService] = useState(false);
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<any | null>(null);

  // Create form payloads
  const [apptForm, setApptForm] = useState({ client_id: '', staff_id: '', service_id: '', date: '', start_time: '10:00', notes: '', status_id: '1' });
  const [serviceForm, setServiceForm] = useState({ name: '', description: '', price: '', duration: '45', category_id: '3' });
  const [staffForm, setStaffForm] = useState({ name: '', email: '', phone: '', bio: '' });
  const [clientForm, setClientForm] = useState({ name: '', email: '', phone: '', notes: '' });

  // DETAILED SETTINGS FORM STATE
  const [settingsForm, setSettingsForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    description: '',
    logo: '',
    currency: 'MAD',
    timezone: 'Africa/Casablanca'
  });

  // EDIT & DELETE SERVICES
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editServiceForm, setEditServiceForm] = useState({ name: '', description: '', price: '', duration: '45', category_id: '3' });

  const handleEditServiceSelect = (item: Service) => {
    setEditingService(item);
    setEditServiceForm({
      name: item.name,
      description: item.description || '',
      price: String(item.price),
      duration: String(item.duration),
      category_id: String(item.category_id || '3')
    });
  };

  const handleUpdateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    try {
      const res = await fetch(`/api/business/${businessId}/services/${editingService.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editServiceForm)
      });
      if (res.ok) {
        setEditingService(null);
        fetchTenantDataset();
      } else {
        const err = await res.json();
        alert(err.error || 'Erreur lors de la modification.');
      }
    } catch {
      alert('Erreur réseau.');
    }
  };

  const handleDeleteService = async (id: number) => {
    if (!confirm('Voulez-vous vraiment supprimer cette prestation ?')) return;
    try {
      const res = await fetch(`/api/business/${businessId}/services/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        fetchTenantDataset();
      } else {
        const err = await res.json();
        alert(err.error || 'Erreur lors de la suppression.');
      }
    } catch {
      alert('Erreur réseau.');
    }
  };

  // EDIT & DELETE STAFF
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [editStaffForm, setEditStaffForm] = useState({ name: '', email: '', phone: '', bio: '' });

  const handleEditStaffSelect = (item: Staff) => {
    setEditingStaff(item);
    setEditStaffForm({
      name: item.name,
      email: item.email,
      phone: item.phone || '',
      bio: item.bio || ''
    });
  };

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    try {
      const res = await fetch(`/api/business/${businessId}/staff/${editingStaff.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editStaffForm)
      });
      if (res.ok) {
        setEditingStaff(null);
        fetchTenantDataset();
      } else {
        const err = await res.json();
        alert(err.error || 'Erreur de modification collaborateur.');
      }
    } catch {
      alert('Erreur réseau.');
    }
  };

  const handleDeleteStaff = async (id: number) => {
    if (!confirm('Voulez-vous vraiment supprimer ce collaborateur ?')) return;
    try {
      const res = await fetch(`/api/business/${businessId}/staff/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        fetchTenantDataset();
      } else {
        const err = await res.json();
        alert(err.error || 'Erreur lors de la suppression.');
      }
    } catch {
      alert('Erreur réseau.');
    }
  };

  // EDIT & DELETE CLIENTS
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editClientForm, setEditClientForm] = useState({ name: '', email: '', phone: '', notes: '' });

  const handleEditClientSelect = (item: Client) => {
    setEditingClient(item);
    setEditClientForm({
      name: item.name,
      email: item.email,
      phone: item.phone,
      notes: item.notes || ''
    });
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;
    try {
      const res = await fetch(`/api/business/${businessId}/clients/${editingClient.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editClientForm)
      });
      if (res.ok) {
        setEditingClient(null);
        fetchTenantDataset();
      } else {
        const err = await res.json();
        alert(err.error || 'Erreur de modification client.');
      }
    } catch {
      alert('Erreur réseau.');
    }
  };

  const handleDeleteClient = async (id: number) => {
    if (!confirm('Voulez-vous vraiment supprimer cette fiche client ?')) return;
    try {
      const res = await fetch(`/api/business/${businessId}/clients/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        fetchTenantDataset();
      } else {
        const err = await res.json();
        alert(err.error || 'Erreur lors de la suppression.');
      }
    } catch {
      alert('Erreur réseau.');
    }
  };

  // Notifications
  const [alerts, setAlerts] = useState<any[]>([]);

  const fetchTenantDataset = async () => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      // Standard multi-tenant isolated api routes fetch
      const [resStats, resAppts, resServices, resStaff, resClients, resBranches, resBilling, resGiftCards, resProducts, resPromotions] = await Promise.all([
        fetch(`/api/business/${businessId}/stats`, { headers }),
        fetch(`/api/business/${businessId}/appointments`, { headers }),
        fetch(`/api/business/${businessId}/services`, { headers }),
        fetch(`/api/business/${businessId}/staff`, { headers }),
        fetch(`/api/business/${businessId}/clients`, { headers }),
        fetch(`/api/business/${businessId}/branches`, { headers }),
        fetch(`/api/business/${businessId}/billing`, { headers }),
        fetch(`/api/business/${businessId}/gift-cards`, { headers }),
        fetch(`/api/business/${businessId}/products`, { headers }),
        fetch(`/api/business/${businessId}/promotions`, { headers }),
      ]);

      if (resStats.ok) {
        const statsData = await resStats.json();
        setStats(statsData);
        setSub(statsData.sub);
        setPlan(statsData.plan);
        if (statsData.business) {
          setSettingsForm({
            name: statsData.business.name || '',
            phone: statsData.business.phone || '',
            email: statsData.business.email || '',
            address: statsData.business.address || '',
            description: statsData.business.description || '',
            logo: statsData.business.logo || '',
            currency: (statsData.setting && statsData.setting.currency) || 'MAD',
            timezone: (statsData.setting && statsData.setting.timezone) || 'Africa/Casablanca'
          });
        }
      }

      if (resAppts.ok) setAppointments(await resAppts.json());
      if (resServices.ok) setServices(await resServices.json());
      if (resStaff.ok) setStaff(await resStaff.json());
      if (resClients.ok) setClients(await resClients.json());
      if (resBranches.ok) setBranches(await resBranches.json());
      if (resGiftCards.ok) setGiftCards(await resGiftCards.json());
      if (resProducts.ok) setProducts(await resProducts.json());
      if (resPromotions.ok) setPromotions(await resPromotions.json());
      
      if (resBilling.ok) {
        const billingData = await resBilling.json();
        setInvoices(billingData.invoices);
        setPayments(billingData.payments);
      }

    } catch (e) {
      console.error('Error fetching tenant dataset:', e);
      setErrorMsg('Données multilocataires inaccessibles.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      const res = await fetch(`/api/business/${businessId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settingsForm)
      });
      if (res.ok) {
        alert('Paramètres d\'établissement sauvegardés avec succès !');
        fetchTenantDataset();
      } else {
        const err = await res.json();
        alert(err.error || 'Erreur lors de l\'enregistrement des paramètres.');
      }
    } catch {
      alert('Erreur réseau.');
    }
  };

  useEffect(() => {
    fetchTenantDataset();
  }, [businessId, token]);

  // Handle plan upgrade trigger
  const handleUpgradePlan = async (planId: number) => {
    try {
      const response = await fetch(`/api/business/${businessId}/billing/upgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ plan_id: planId })
      });
      if (response.ok) {
        alert('Votre abonnement a été surclassé à l\'aide de la simulation Stripe ! Vos limites sont ajustées.');
        fetchTenantDataset();
      } else {
        alert('Échec de la transaction d\'abonnement.');
      }
    } catch (e) {
      alert('Erreur serveur de paye.');
    }
  };

  // Create Appointment Handler
  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check SaaS pricing limits
    if (plan && appointments.length >= plan.appointment_limit) {
      alert(`Limite atteinte ! Votre plan d'abonnement "${plan.name}" limite votre activité à ${plan.appointment_limit} réservations. Veuillez effectuer une mise à niveau.`);
      return;
    }

    try {
      const response = await fetch(`/api/business/${businessId}/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(apptForm)
      });

      if (response.ok) {
        setShowAddAppt(false);
        setApptForm({ client_id: '', staff_id: '', service_id: '', date: '', start_time: '10:00', notes: '', status_id: '1' });
        fetchTenantDataset();
      } else {
        const err = await response.json();
        alert(err.error || 'Erreur lors de la réservation.');
      }
    } catch (e) {
      alert('Erreur réseau.');
    }
  };

  // Change Appointment Status Handler
  const handleUpdateApptStatus = async (apptId: number, statusId: number) => {
    try {
      const response = await fetch(`/api/business/${businessId}/appointments/${apptId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status_id: statusId })
      });
      if (response.ok) {
        setSelectedAppt(null);
        fetchTenantDataset();
      }
    } catch (e) {
      alert('Erreur de changement de statut.');
    }
  };

  // Gift Voucher Creation Handler
  const handleCreateGiftCard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/business/${businessId}/gift-cards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(giftCardForm)
      });

      if (response.ok) {
        setShowAddGiftCard(false);
        setGiftCardForm({ code: '', initial_amount: '200', client_name: '', client_phone: '', expires_at: '' });
        fetchTenantDataset();
      } else {
        const err = await response.json();
        alert(err.error || 'Erreur lors de la création du bon cadeau.');
      }
    } catch (err) {
      alert('Erreur réseau.');
    }
  };

  // Product Creation Handler
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/business/${businessId}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(productForm)
      });

      if (response.ok) {
        setShowAddProduct(false);
        setProductForm({ name: '', sku: '', price: '', cost_price: '', stock: '10', category: '', supplier: '' });
        fetchTenantDataset();
      } else {
        const err = await response.json();
        alert(err.error || 'Erreur lors de la création du produit.');
      }
    } catch (err) {
      alert('Erreur réseau.');
    }
  };

  // Product Deletion Handler
  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Voulez-vous vraiment supprimer ce produit de l\'inventaire ?')) return;
    try {
      const response = await fetch(`/api/business/${businessId}/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        fetchTenantDataset();
      } else {
        alert('Erreur lors de la suppression.');
      }
    } catch (err) {
      alert('Erreur réseau.');
    }
  };

  const handleEditProductSelect = (p: any) => {
    setEditingProduct(p);
    setEditProductForm({
      name: p.name,
      sku: p.sku || '',
      price: String(p.price),
      cost_price: String(p.cost_price || 0),
      stock: String(p.stock || 0),
      category: p.category || '',
      supplier: p.supplier || ''
    });
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      const response = await fetch(`/api/business/${businessId}/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editProductForm)
      });

      if (response.ok) {
        setEditingProduct(null);
        fetchTenantDataset();
      } else {
        const err = await response.json();
        alert(err.error || 'Erreur lors de la mise à jour du produit.');
      }
    } catch (err) {
      alert('Erreur réseau.');
    }
  };

  // Promotion Creation Handler
  const handleCreatePromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/business/${businessId}/promotions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(promotionForm)
      });

      if (response.ok) {
        setShowAddPromotion(false);
        setPromotionForm({ name: '', code: '', discount_type: 'percent', discount_value: '10', status: 'active', expires_at: '' });
        fetchTenantDataset();
      } else {
        const err = await response.json();
        alert(err.error || 'Erreur d\'enregistrement de la promotion.');
      }
    } catch (err) {
      alert('Erreur réseau.');
    }
  };

  // Promotion Deletion Handler
  const handleDeletePromotion = async (id: number) => {
    if (!confirm('Voulez-vous vraiment désactiver/supprimer cette offre promotionnelle ?')) return;
    try {
      const response = await fetch(`/api/business/${businessId}/promotions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        fetchTenantDataset();
      } else {
        alert('Erreur lors de la suppression.');
      }
    } catch (err) {
      alert('Erreur réseau.');
    }
  };

  // Checkout Payment Confirmation
  const handleCheckoutConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutAppt) return;
    try {
      const response = await fetch(`/api/business/${businessId}/appointments/${checkoutAppt.id}/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(checkoutForm)
      });

      if (response.ok) {
        const data = await response.json();
        // Compile receipt values
        setGeneratedTicket({
          appointment: data.appointment,
          payment: data.payment,
          gift_card: data.gift_card,
          client: clients.find(c => c.id === data.appointment.client_id),
          service: services.find(s => s.id === data.appointment.service_id),
          staff: staff.find(s => s.id === data.appointment.staff_id)
        });
        
        setShowCheckout(false);
        setCheckoutAppt(null);
        setShowTicketModal(true);
        setSelectedAppt(null);
        fetchTenantDataset();
      } else {
        const err = await response.json();
        alert(err.error || "Erreur lors de la validation de l'encaissement.");
      }
    } catch (err) {
      alert('Erreur serveur lors de la validation.');
    }
  };

  // Delete Appointment
  const handleDeleteAppt = async (id: number) => {
    if (!confirm('Voulez-vous vraiment annuler et supprimer ce rendez-vous ?')) return;
    try {
      const res = await fetch(`/api/business/${businessId}/appointments/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSelectedAppt(null);
        fetchTenantDataset();
      }
    } catch (e) {
      alert('Erreur.');
    }
  };

  // Quick Service CRUD Add
  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/business/${businessId}/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(serviceForm)
      });
      if (res.ok) {
        setShowAddService(false);
        setServiceForm({ name: '', description: '', price: '', duration: '45', category_id: '3' });
        fetchTenantDataset();
      }
    } catch (err) {
      alert('Erreur de création service.');
    }
  };

  // Quick Staff CRUD Add
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check staff quota
    if (plan && staff.length >= plan.staff_limit) {
      alert(`Limite de collaborateurs atteinte ! Votre abonnement "${plan.name}" n'autorise que ${plan.staff_limit} collaborateurs.`);
      return;
    }

    try {
      const res = await fetch(`/api/business/${businessId}/staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(staffForm)
      });
      if (res.ok) {
        setShowAddStaff(false);
        setStaffForm({ name: '', email: '', phone: '', bio: '' });
        fetchTenantDataset();
      }
    } catch (e) {
      alert('Erreur staff.');
    }
  };

  // Quick Client Profile Add
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/business/${businessId}/clients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(clientForm)
      });
      if (res.ok) {
        setShowAddClient(false);
        setClientForm({ name: '', email: '', phone: '', notes: '' });
        fetchTenantDataset();
      }
    } catch (e) {
      alert('Erreur.');
    }
  };


  // Calendar system time slot calculations (available hours generated)
  // Let's generate slots from 09:00 to 19:00 with 30-mins increments
  const timeSlots = [];
  for (let i = 9; i <= 19; i++) {
    timeSlots.push(`${String(i).padStart(2, '0')}:00`);
    timeSlots.push(`${String(i).padStart(2, '0')}:30`);
  }

  // Active appointments list based on calendarDate selection
  const calendarAppointments = appointments.filter(appt => appt.date === calendarDate);

  // Search results filters
  const filteredAppointmentsList = appointments.filter(appt =>
    appt.client_name.toLowerCase().includes(query.toLowerCase()) ||
    appt.staff_name.toLowerCase().includes(query.toLowerCase()) ||
    appt.service_name.toLowerCase().includes(query.toLowerCase())
  );

  const filteredPayments = (() => {
    const list = payments || [];
    if (reportDuration === 'all') return list;
    const now = new Date();
    return list.filter((p: any) => {
      const pDate = new Date(p.created_at);
      if (reportDuration === 'today') {
        return pDate.toDateString() === now.toDateString();
      } else if (reportDuration === 'week') {
        return (now.getTime() - pDate.getTime()) <= 7 * 24 * 60 * 60 * 1000;
      } else if (reportDuration === 'month') {
        return pDate.getMonth() === now.getMonth() && pDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  })();

  return (
    <div className="bg-[#F8FAFC] min-h-screen text-slate-900 font-sans flex flex-col md:flex-row" id="business-workspace">
      
      {/* SIDEBAR NAVIGATION PANEL */}
      <aside className="w-full md:w-64 bg-[#0F172A] p-5 flex flex-col justify-between shrink-0 text-slate-300">
        <div className="space-y-8">
          
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Compass className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <span className="font-sans font-extrabold text-xl tracking-tight text-white">NIDZAK</span>
              <span className="text-[10px] block text-slate-500 font-mono tracking-wider uppercase -mt-0.5">PARTNER AREA</span>
            </div>
          </div>

          <div className="bg-slate-800/40 border border-slate-705/30 rounded-xl p-3 flex items-center gap-3">
            <img src={stats?.business?.logo} alt="Business" referrerPolicy="no-referrer" className="w-10 h-10 rounded-lg object-cover border border-slate-700 shadow-sm" />
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{stats?.business?.name || 'Mon Établissement'}</p>
              <span className="inline-block px-1.5 py-0.5 text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded font-bold font-mono tracking-wider mt-1 uppercase">
                {plan?.name || 'Free Trial'}
              </span>
            </div>
          </div>

          <nav className="space-y-1 text-xs font-semibold">
            <button
              onClick={() => { setActivePane('dashboard'); setQuery(''); }}
              className={`w-full text-left px-3.5 py-3 rounded-lg flex items-center gap-3 transition-colors ${activePane === 'dashboard' ? 'bg-indigo-500/10 text-indigo-450 font-bold border-l-4 border-indigo-500 text-indigo-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <TrendingUp className="w-4.5 h-4.5 text-inherit" />
              Tableau de bord
            </button>

            <button
              onClick={() => { setActivePane('calendar'); setQuery(''); }}
              className={`w-full text-left px-3.5 py-3 rounded-lg flex items-center gap-3 transition-colors ${activePane === 'calendar' ? 'bg-indigo-500/10 text-indigo-455 font-bold border-l-4 border-indigo-500 text-indigo-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <CalendarIcon className="w-4.5 h-4.5 text-inherit" />
              Calendrier Collaborateurs
            </button>

            <button
              onClick={() => { setActivePane('appointments'); setQuery(''); }}
              className={`w-full text-left px-3.5 py-3 rounded-lg flex items-center gap-3 transition-colors ${activePane === 'appointments' ? 'bg-indigo-500/10 text-indigo-455 font-bold border-l-4 border-indigo-500 text-indigo-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <FileCheck2 className="w-4.5 h-4.5 text-inherit" />
              Réservations listes
            </button>

            <button
              onClick={() => { setActivePane('clients'); setQuery(''); }}
              className={`w-full text-left px-3.5 py-3 rounded-lg flex items-center gap-3 transition-colors ${activePane === 'clients' ? 'bg-indigo-500/10 text-indigo-455 font-bold border-l-4 border-indigo-500 text-indigo-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <Users className="w-4.5 h-4.5 text-inherit" />
              Fiches Clients
            </button>

            <button
              onClick={() => { setActivePane('services'); setQuery(''); }}
              className={`w-full text-left px-3.5 py-3 rounded-lg flex items-center gap-3 transition-colors ${activePane === 'services' ? 'bg-indigo-500/10 text-indigo-455 font-bold border-l-4 border-indigo-500 text-indigo-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <Scissors className="w-4.5 h-4.5 text-inherit" />
              Prestations & Prix
            </button>

            <button
              onClick={() => { setActivePane('staff'); setQuery(''); }}
              className={`w-full text-left px-3.5 py-3 rounded-lg flex items-center gap-3 transition-colors ${activePane === 'staff' ? 'bg-indigo-500/10 text-indigo-455 font-bold border-l-4 border-indigo-500 text-indigo-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <UserCheck className="w-4.5 h-4.5 text-inherit" />
              Collaborateurs
            </button>

            <button
              onClick={() => { setActivePane('branches'); setQuery(''); }}
              className={`w-full text-left px-3.5 py-3 rounded-lg flex items-center gap-3 transition-colors ${activePane === 'branches' ? 'bg-indigo-500/10 text-indigo-455 font-bold border-l-4 border-indigo-500 text-indigo-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <MapPin className="w-4.5 h-4.5 text-inherit" />
              Succursales
            </button>

            <button
              onClick={() => { setActivePane('reports'); setQuery(''); }}
              className={`w-full text-left px-3.5 py-3 rounded-lg flex items-center gap-3 transition-colors ${activePane === 'reports' ? 'bg-indigo-500/10 text-indigo-455 font-bold border-l-4 border-indigo-500 text-indigo-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <BarChart3 className="w-4.5 h-4.5 text-inherit" />
              Rapports & Caisse
            </button>

            <button
              onClick={() => { setActivePane('gift_cards'); setQuery(''); }}
              className={`w-full text-left px-3.5 py-3 rounded-lg flex items-center gap-3 transition-colors ${activePane === 'gift_cards' ? 'bg-indigo-500/10 text-indigo-455 font-bold border-l-4 border-indigo-500 text-indigo-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <Gift className="w-4.5 h-4.5 text-inherit" />
              Bons Cadeaux
            </button>

            <button
              onClick={() => { setActivePane('products'); setQuery(''); }}
              className={`w-full text-left px-3.5 py-3 rounded-lg flex items-center gap-3 transition-colors ${activePane === 'products' ? 'bg-indigo-500/10 text-indigo-455 font-bold border-l-4 border-indigo-500 text-indigo-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <Package className="w-4.5 h-4.5 text-inherit" />
              Produits & Stock
            </button>

            <button
              onClick={() => { setActivePane('promotions'); setQuery(''); }}
              className={`w-full text-left px-3.5 py-3 rounded-lg flex items-center gap-3 transition-colors ${activePane === 'promotions' ? 'bg-indigo-500/10 text-indigo-455 font-bold border-l-4 border-indigo-500 text-indigo-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <Tag className="w-4.5 h-4.5 text-inherit" />
              Marketing & Codes
            </button>

            <button
              onClick={() => { setActivePane('billing'); setQuery(''); }}
              className={`w-full text-left px-3.5 py-3 rounded-lg flex items-center gap-3 transition-colors ${activePane === 'billing' ? 'bg-indigo-500/10 text-indigo-455 font-bold border-l-4 border-indigo-500 text-indigo-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <CreditCard className="w-4.5 h-4.5 text-inherit" />
              Abonnement / SaaS
            </button>

            <button
              onClick={() => { setActivePane('settings'); setQuery(''); }}
              className={`w-full text-left px-3.5 py-3 rounded-lg flex items-center gap-3 transition-colors ${activePane === 'settings' ? 'bg-indigo-500/10 text-indigo-455 font-bold border-l-4 border-indigo-500 text-indigo-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <Settings className="w-4.5 h-4.5 text-inherit" />
              Réglages Salon
            </button>
          </nav>
        </div>

        <div className="pt-6 border-t border-slate-800 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-white border border-slate-750">
              PR
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{ownerName}</p>
              <p className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wide">Propriétaire</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full py-2.5 bg-slate-800/40 hover:bg-rose-950/30 border border-slate-700/60 hover:border-rose-900/60 text-slate-300 hover:text-rose-400 rounded-xl text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* CORE WORKSPACE ENTRY CONTAINER */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 lg:space-y-10">
        
        {/* UPPER STATUS BAR */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-150 pb-5 gap-4">
          <div>
            <span className="text-[10px] font-mono tracking-widest text-indigo-650 uppercase font-black">Espace Partenaire</span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{stats?.business?.name || 'Mon Établissement'}</h1>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              Multi-tenant locataire ID: <span className="font-mono font-bold text-slate-700">#{businessId}</span> · Adresse: {stats?.business?.address}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {(() => {
              let label = "Réserver RDV";
              let icon = <PlusCircle className="w-4.5 h-4.5" />;
              let action = () => {
                setApptForm({ ...apptForm, date: calendarDate });
                setShowAddAppt(true);
              };

              if (activePane === 'clients') {
                label = "Nouveau Client";
                icon = <Plus className="w-4.5 h-4.5" />;
                action = () => setShowAddClient(true);
              } else if (activePane === 'services') {
                label = "Nouveau Service";
                icon = <Plus className="w-4.5 h-4.5" />;
                action = () => setShowAddService(true);
              } else if (activePane === 'staff') {
                label = "Nouveau Collaborateur";
                icon = <Plus className="w-4.5 h-4.5" />;
                action = () => setShowAddStaff(true);
              } else if (activePane === 'products') {
                label = "Ajouter un Produit";
                icon = <Plus className="w-4.5 h-4.5" />;
                action = () => {
                  const randSku = 'PROD-' + Math.random().toString(36).substring(2, 6).toUpperCase();
                  setProductForm({ name: '', sku: randSku, price: '120', cost_price: '50', stock: '20', category: 'Soins', supplier: '' });
                  setShowAddProduct(true);
                };
              } else if (activePane === 'promotions') {
                label = "Nouvelle Promotion";
                icon = <Plus className="w-4.5 h-4.5" />;
                action = () => {
                  setPromotionForm({ name: '', code: 'PROMO' + Math.floor(10 + Math.random() * 90), discount_type: 'percent', discount_value: '20', status: 'active', expires_at: '' });
                  setShowAddPromotion(true);
                };
              } else if (activePane === 'gift_cards') {
                label = "Créer un Bon Cadeau";
                icon = <Plus className="w-4.5 h-4.5" />;
                action = () => {
                  const randomCode = 'GIF-' + Math.floor(100 + Math.random() * 900) + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
                  setGiftCardForm({ code: randomCode, initial_amount: '200', client_name: '', client_phone: '', expires_at: '' });
                  setShowAddGiftCard(true);
                };
              } else if (activePane === 'settings') {
                label = "Enregistrer Réglages";
                icon = <Save className="w-4.5 h-4.5" />;
                action = () => { handleUpdateSettings(); };
              }

              return (
                <button
                  onClick={action}
                  className="px-4.5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-150 flex items-center gap-1.5 cursor-pointer"
                >
                  {icon}
                  {label}
                </button>
              );
            })()}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-2">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-mono">Vérification de l'isolation SaaS...</p>
          </div>
        ) : (
          <>
            {/* ------------------------------------------------ */}
            {/* 1. DASHBOARD VIEW */}
            {/* ------------------------------------------------ */}
            {activePane === 'dashboard' && stats && (
              <div className="space-y-8 animate-fade-in">
                
                {/* GENERAL STATS */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  
                  <div className="bg-white border border-slate-150 rounded-2xl p-5 space-y-2 shadow-sm">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Chiffre d'Affaires</span>
                    <h3 className="text-2xl sm:text-3xl font-black text-indigo-650">{stats.revenue?.toFixed(2)} DH</h3>
                    <p className="text-[10px] text-emerald-600 font-bold">Comptabilisé (Terminé)</p>
                  </div>

                  <div className="bg-white border border-slate-150 rounded-2xl p-5 space-y-2 shadow-sm">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Rendez-vous</span>
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-900">{stats.totalAppointments}</h3>
                    <p className="text-[10px] text-slate-500">Total bookings</p>
                  </div>

                  <div className="bg-white border border-slate-150 rounded-2xl p-5 space-y-2 shadow-sm">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Volume Clients</span>
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-900">{stats.clientsCount}</h3>
                    <p className="text-[10px] text-indigo-500 font-bold">Inscrits uniques</p>
                  </div>

                  <div className="bg-white border border-slate-150 rounded-2xl p-5 space-y-2 shadow-sm">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Collaborateurs</span>
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-900">{stats.staffCount}</h3>
                    <p className="text-[10px] text-slate-500">Praticiens actifs</p>
                  </div>

                </div>

                {/* 🚀 QUICK SHORTCUTS REGISTRY */}
                <div className="bg-gradient-to-r from-indigo-50/50 via-slate-50 to-indigo-50/20 border border-slate-150 rounded-2xl p-6 shadow-xs space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
                    <div>
                      <h3 className="text-xs font-black text-indigo-950 uppercase tracking-widest font-mono">Actions Rapides de Commerce</h3>
                      <p className="text-[10px] text-slate-500 font-sans mt-0.5">Accédez instantanément aux leviers de ventes additionnelles et de fidélisation de votre salon</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    
                    <button
                      onClick={() => {
                        const randomCode = 'GIF-' + Math.floor(100 + Math.random() * 900) + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
                        setGiftCardForm({ code: randomCode, initial_amount: '200', client_name: '', client_phone: '', expires_at: '' });
                        setShowAddGiftCard(true);
                      }}
                      className="bg-white hover:bg-slate-50 border border-slate-150 p-5 rounded-2xl flex items-start gap-4 text-left transition-all hover:scale-[1.01] hover:border-indigo-200 hover:shadow-md cursor-pointer group"
                    >
                      <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 shrink-0 group-hover:bg-indigo-100 transition-colors">
                        <Gift className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">Émettre un Bon Cadeau</h4>
                        <p className="text-[10.5px] text-slate-500 font-medium leading-relaxed">Créer un chèque cadeau prépayé (ex. pour un anniversaire ou cadeau spécial client).</p>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        const randSku = 'PROD-' + Math.random().toString(36).substring(2, 6).toUpperCase();
                        setProductForm({ name: '', sku: randSku, price: '120', cost_price: '50', stock: '20', category: 'Soins', supplier: '' });
                        setShowAddProduct(true);
                      }}
                      className="bg-white hover:bg-slate-50 border border-slate-150 p-5 rounded-2xl flex items-start gap-4 text-left transition-all hover:scale-[1.01] hover:border-amber-200 hover:shadow-md cursor-pointer group"
                    >
                      <div className="p-3 bg-amber-50 rounded-xl text-amber-700 shrink-0 group-hover:bg-amber-100 transition-colors">
                        <Package className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-extrabold text-slate-900 group-hover:text-amber-800 transition-colors">Ajouter un Produit Retail</h4>
                        <p className="text-[10.5px] text-slate-500 font-medium leading-relaxed">Enregistrer un shampoing, sérum ou accessoire capillaire pour ventes en caisse.</p>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setPromotionForm({ name: '', code: 'PROMO' + Math.floor(10 + Math.random() * 90), discount_type: 'percent', discount_value: '20', status: 'active', expires_at: '' });
                        setShowAddPromotion(true);
                      }}
                      className="bg-white hover:bg-slate-50 border border-slate-150 p-5 rounded-2xl flex items-start gap-4 text-left transition-all hover:scale-[1.01] hover:border-emerald-200 hover:shadow-md cursor-pointer group"
                    >
                      <div className="p-3 bg-emerald-50 rounded-xl text-emerald-700 shrink-0 group-hover:bg-emerald-100 transition-colors">
                        <Tag className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors">Lancer une Promotion</h4>
                        <p className="text-[10.5px] text-slate-500 font-medium leading-relaxed">Générer un code coupon de réduction (20% ou montant fixe) valide lors de l'encaissement.</p>
                      </div>
                    </button>

                  </div>
                </div>

                {/* GRAPH SECTION AND ANALYTICS */}
                <div className="grid lg:grid-cols-12 gap-8">
                  
                  {/* Status distribution bar */}
                  <div className="lg:col-span-8 bg-white border border-slate-150 rounded-2xl p-6 shadow-sm space-y-6">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider font-mono">Synthèse de l'état des réservations</h3>
                      <p className="text-[11px] text-slate-500">Analyse de la répartition par status d'agenda</p>
                    </div>

                    <div className="flex h-10 w-full rounded-xl overflow-hidden bg-slate-100 font-mono text-[10px] font-bold text-white text-center">
                      {/* Generates block based on ratios */}
                      {Object.entries(stats.statusReport || {}).map(([key, value]) => {
                        const total = stats.totalAppointments || 1;
                        const pct = ((value as number) / total) * 100;
                        if (!value) return null;
                        
                        const colMap: any = {
                          pending: 'bg-amber-450 text-amber-950',
                          confirmed: 'bg-blue-500',
                          completed: 'bg-emerald-500',
                          cancelled: 'bg-rose-500'
                        };

                        return (
                          <div
                            key={key}
                            style={{ width: `${pct}%` }}
                            className={`${colMap[key] || 'bg-slate-400'} flex items-center justify-center transition-all`}
                            title={`${key}: ${value}`}
                          >
                            {pct > 15 && `${key} (${value})`}
                          </div>
                        );
                      })}
                    </div>

                    <div className="grid grid-cols-4 gap-4 text-center font-sans">
                      <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                        <span className="block text-lg font-black text-amber-700">{stats.statusReport?.pending || 0}</span>
                        <span className="text-[10px] text-slate-500">En attente</span>
                      </div>
                      <div className="bg-blue-50 bg-opacity-70 rounded-xl p-3 border border-blue-100">
                        <span className="block text-lg font-black text-blue-700">{stats.statusReport?.confirmed || 0}</span>
                        <span className="text-[10px] text-slate-500">Confirmés</span>
                      </div>
                      <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                        <span className="block text-lg font-black text-emerald-700">{stats.statusReport?.completed || 0}</span>
                        <span className="text-[10px] text-slate-500">Complétés</span>
                      </div>
                      <div className="bg-rose-50 rounded-xl p-3 border border-rose-100">
                        <span className="block text-lg font-black text-rose-700">{stats.statusReport?.cancelled || 0}</span>
                        <span className="text-[10px] text-slate-500">Annulés</span>
                      </div>
                    </div>
                  </div>

                  {/* MOST BOOKED SERVICES */}
                  <div className="lg:col-span-4 bg-white border border-slate-150 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider font-mono mb-4">Prestations Best-Sellers</h3>
                    
                    <div className="space-y-4">
                      {stats.serviceStats?.length === 0 ? (
                        <p className="text-xs text-slate-400">Aucun traitement réservé pour le moment.</p>
                      ) : (
                        stats.serviceStats?.map((srv: any, idx: number) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-slate-800 truncate pr-2">{srv.name}</span>
                              <span className="font-mono text-slate-500 shrink-0">{srv.count} fois</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div
                                style={{
                                  width: `${(srv.count / (Math.max(...stats.serviceStats.map((x: any) => x.count)) || 1)) * 100}%`
                                }}
                                className="bg-indigo-600 h-full rounded-full"
                              />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>

                {/* CREW BOOKING FREQUENCY TRACKER */}
                <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider font-mono mb-5">Performance Individuelle des Collaborateurs</h3>
                  <div className="grid md:grid-cols-3 gap-6">
                    {stats.staffStats?.map((st: any, idx: number) => (
                      <div key={idx} className="bg-slate-50 border border-slate-150 rounded-xl p-4 space-y-2 flex flex-col justify-between">
                        <div className="space-y-1">
                          <h4 className="font-bold text-slate-900 text-sm">{st.name}</h4>
                          <p className="text-xs text-slate-500 font-mono">{st.appointments} rendez-vous au total</p>
                        </div>
                        <div className="pt-2 border-t border-slate-150 flex justify-between items-center text-xs">
                          <span className="text-slate-500">CA Associé:</span>
                          <span className="font-bold text-slate-900">{(st.revenue || 0).toFixed(2)} DH</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* ------------------------------------------------ */}
            {/* 2. CALENDAR VIEW (FRESHA-STYLE) */}
            {/* ------------------------------------------------ */}
            {activePane === 'calendar' && (
              <div className="space-y-6">
                
                {/* Calendar Navigator Toolbar */}
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center bg-white p-4 rounded-xl border border-slate-150 gap-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        const d = new Date(calendarDate);
                        d.setDate(d.getDate() - 1);
                        setCalendarDate(d.toISOString().slice(0, 10));
                      }}
                      className="p-2 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    
                    <input
                      type="date"
                      value={calendarDate}
                      onChange={(e) => setCalendarDate(e.target.value)}
                      className="bg-slate-50 border border-slate-200 focus:bg-white rounded-lg px-3 py-1.5 text-xs font-bold font-mono text-slate-850 outline-none"
                    />

                    <button
                      onClick={() => {
                        const d = new Date(calendarDate);
                        d.setDate(d.getDate() + 1);
                        setCalendarDate(d.toISOString().slice(0, 10));
                      }}
                      className="p-2 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setCalendarDate(new Date().toISOString().slice(0,10))}
                      className="text-xs font-bold text-indigo-700 hover:underline pl-2"
                    >
                      Aujourd'hui
                    </button>
                  </div>

                  <div className="text-xs text-slate-500">
                    <span className="font-bold text-indigo-600">{calendarAppointments.length}</span> consultations pour le {new Date(calendarDate).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>

                {/* STAFF VERTICAL COLUMNS GRID */}
                <div className="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm overflow-hidden">
                  
                  {staff.length === 0 ? (
                    <div className="text-center py-20 text-slate-400">
                      <Users className="w-10 h-10 mx-auto mb-3 text-slate-350" />
                      <p className="text-sm">Enregistrez d'abord des collaborateurs dans l'espace "Collaborateurs" pour générer la grille d'agenda.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <div className="min-w-[700px]">
                        
                        {/* Column Headers: Staff member names */}
                        <div className="grid grid-cols-12 border-b border-slate-150 pb-3 font-semibold text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg text-center items-center">
                          <div className="col-span-2 text-left font-mono font-bold tracking-wider text-indigo-650">Heure</div>
                          <div className="col-span-10 grid" style={{ gridTemplateColumns: `repeat(${staff.length}, minmax(0, 1fr))` }}>
                            {staff.map((st) => (
                              <div key={st.id} className="border-l border-slate-150/60 truncate pr-1">
                                <p className="font-sans font-extrabold text-slate-900 group-hover:text-indigo-650 truncate">{st.name}</p>
                                <span className="text-[9px] text-slate-500 font-mono tracking-wide truncate">{st.email}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Calendar rows of time slots */}
                        <div className="divide-y divide-slate-100">
                          {timeSlots.map((slot) => {
                            return (
                              <div key={slot} className="grid grid-cols-12 py-3.5 items-center font-semibold p-2.5 hover:bg-slate-50/40">
                                {/* Hour labeling */}
                                <div className="col-span-2 font-mono text-slate-500 text-xs flex items-center gap-1.5 select-none">
                                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                                  {slot}
                                </div>

                                {/* Appointment blocks across staff */}
                                <div className="col-span-10 grid gap-2" style={{ gridTemplateColumns: `repeat(${staff.length}, minmax(0, 1fr))` }}>
                                  {staff.map((member) => {
                                    // Calculate time in minutes for current slot
                                    const slotMins = (() => {
                                      const [sh, sm] = slot.split(':').map(Number);
                                      return sh * 60 + sm;
                                    })();

                                    // Find any appointment active during this slot's interval
                                    const activeAppt = calendarAppointments.find(appt => {
                                      if (appt.staff_id !== member.id) return false;
                                      if (!appt.start_time || !appt.end_time) return false;
                                      const [sth, stm] = appt.start_time.split(':').map(Number);
                                      const [eth, etm] = appt.end_time.split(':').map(Number);
                                      const startMins = sth * 60 + stm;
                                      const endMins = eth * 60 + etm;
                                      return slotMins >= startMins && slotMins < endMins;
                                    });

                                    if (activeAppt) {
                                      // Is this slot the start of the appointment?
                                      const isStart = activeAppt.start_time.startsWith(slot);

                                      // Status style mappings
                                      const styleMap: any = {
                                        pending: 'bg-amber-100/90 text-amber-900 border-amber-250',
                                        confirmed: 'bg-indigo-100/90 text-indigo-900 border-indigo-250',
                                        completed: 'bg-emerald-100/90 text-emerald-950 border-emerald-250',
                                        cancelled: 'bg-rose-100/90 text-rose-900 border-rose-250'
                                      };
                                      
                                      const statusName = activeAppt.status_id === 1 ? 'pending' : activeAppt.status_id === 2 ? 'confirmed' : activeAppt.status_id === 3 ? 'completed' : 'cancelled';

                                      if (isStart) {
                                        return (
                                          <div
                                            key={activeAppt.id}
                                            onClick={() => setSelectedAppt(activeAppt)}
                                            className={`border px-3 py-2 rounded-xl text-[11px] font-sans transition-all transform hover:scale-[1.01] hover:shadow cursor-pointer relative z-20 ${styleMap[statusName] || 'bg-slate-100 text-slate-900 border-slate-200'}`}
                                          >
                                            <div className="flex justify-between items-center">
                                              <span className="font-extrabold truncate pr-2 text-slate-900 block">{activeAppt.client_name}</span>
                                              <span className="font-bold text-[9px] uppercase tracking-wider shrink-0 font-mono bg-white bg-opacity-65 px-1.5 py-0.2 rounded-full">{activeAppt.total_price} DH</span>
                                            </div>
                                            <p className="text-[10px] text-slate-800 line-clamp-1 font-semibold">{activeAppt.service_name}</p>
                                            <div className="flex items-center gap-1 text-[9px] text-slate-700 font-medium mt-1">
                                              <Clock className="w-3 h-3 text-slate-500" />
                                              <span>{activeAppt.start_time} - {activeAppt.end_time}</span>
                                            </div>
                                          </div>
                                        );
                                      } else {
                                        // Continuation slot - shows filled out block keeping consistency
                                        return (
                                          <div
                                            key={`cont-${activeAppt.id}-${slot}`}
                                            onClick={() => setSelectedAppt(activeAppt)}
                                            className={`border px-3 py-1.5 rounded-xl text-[10px] font-sans transition-all opacity-75 cursor-pointer border-dashed flex items-center justify-between hover:scale-[1.01] hover:opacity-100 relative z-20 ${styleMap[statusName] || 'bg-slate-50 text-slate-700 border-slate-200'}`}
                                            title={`Suite du RDV de ${activeAppt.client_name}`}
                                          >
                                            <span className="font-semibold truncate text-[10px] flex items-center gap-1">
                                              <span className="text-slate-500 text-[9px] shrink-0 font-bold uppercase tracking-wide">↳ [Occupé]</span>
                                              <span className="font-bold truncate text-slate-800">{activeAppt.client_name}</span>
                                            </span>
                                            <span className="font-mono text-[9px] opacity-75 shrink-0 bg-white/40 px-1 py-0.2 rounded-full">{activeAppt.start_time} - {activeAppt.end_time}</span>
                                          </div>
                                        );
                                      }
                                    }

                                    // Empty Slot layout with click placeholder trigger for easy adding
                                    return (
                                      <div
                                        key={member.id}
                                        onClick={() => {
                                          setApptForm({
                                            ...apptForm,
                                            staff_id: String(member.id),
                                            start_time: slot,
                                            date: calendarDate
                                          });
                                          setShowAddAppt(true);
                                        }}
                                        className="h-9 border border-dashed border-slate-150/40 rounded-xl hover:bg-indigo-50/50 hover:border-indigo-400 group flex items-center justify-center transition-all cursor-pointer select-none"
                                        title="Créer un rendez-vous"
                                      >
                                        <Plus className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* ------------------------------------------------ */}
            {/* 3. APPOINTMENTS LIST PANE */}
            {/* ------------------------------------------------ */}
            {activePane === 'appointments' && (
              <div className="space-y-6">
                
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center bg-white p-4 rounded-xl border border-slate-150 gap-4 shadow-sm">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filtrer par nom du client, collaborateur, ou service..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-205 focus:bg-white rounded-lg pl-9 pr-4 py-2 text-xs outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto font-sans">
                    <table className="w-full text-left whitespace-nowrap text-xs text-slate-700">
                      <thead className="bg-slate-50 text-slate-550 uppercase tracking-widest font-mono border-b border-slate-100">
                        <tr>
                          <th className="px-6 py-4">Client</th>
                          <th className="px-6 py-4">Date & Heure des prestations</th>
                          <th className="px-6 py-4">Collaborateur</th>
                          <th className="px-6 py-4">Service</th>
                          <th className="px-6 py-4">Prix</th>
                          <th className="px-6 py-4">Statut</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredAppointmentsList.map((a) => (
                          <tr key={a.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => setSelectedAppt(a)}>
                            <td className="px-6 py-4">
                              <p className="font-extrabold text-slate-900 text-sm">{a.client_name}</p>
                              <span className="text-[10px] text-slate-500">{a.client_phone}</span>
                            </td>
                            <td className="px-6 py-4">
                              <p className="font-bold">{new Date(a.date).toLocaleDateString()}</p>
                              <p className="text-[10px] text-indigo-650 font-mono tracking-wide">{a.start_time} - {a.end_time}</p>
                            </td>
                            <td className="px-6 py-4 font-semibold text-slate-800">{a.staff_name}</td>
                            <td className="px-6 py-4 text-slate-800 font-medium">{a.service_name}</td>
                            <td className="px-6 py-4 font-bold font-mono text-slate-900">{a.total_price} DH</td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                                a.status_color === 'blue' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                                a.status_color === 'green' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                a.status_color === 'red' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                                'bg-amber-50 text-amber-700 border border-amber-100'
                              }`}>
                                {a.status_label}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {filteredAppointmentsList.length === 0 && (
                    <p className="text-center py-10 text-slate-400">Aucune réservation ne correspond.</p>
                  )}
                </div>

              </div>
            )}

            {/* ------------------------------------------------ */}
            {/* 4. CLIENTS MANAGEMENT PANE */}
            {/* ------------------------------------------------ */}
            {activePane === 'clients' && (
              <div className="space-y-6">
                
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center bg-white p-4 rounded-xl border border-slate-150 gap-4 shadow-sm">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Rechercher des fiches clients..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-205 focus:bg-white rounded-lg pl-9 pr-4 py-2 text-xs outline-none focus:border-indigo-500"
                    />
                  </div>
                  <button
                    onClick={() => setShowAddClient(true)}
                    className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold"
                  >
                    Ajouter Fiche Client
                  </button>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {clients.filter(c => c.name.toLowerCase().includes(query.toLowerCase())).map((cli) => {
                    const cliAppts = appointments.filter(a => a.client_id === cli.id).length;
                    return (
                      <div key={cli.id} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-extrabold text-slate-900 text-base">{cli.name}</h4>
                            <span className="text-[10px] text-slate-400 font-mono">{cli.email}</span>
                          </div>
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-mono rounded font-bold">
                            {cliAppts} RDVs
                          </span>
                        </div>

                        <div className="space-y-2 text-xs text-slate-600 font-medium">
                          <p className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {cli.phone}
                          </p>
                          <p className="text-slate-500 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-sans text-[11px] line-clamp-3">
                            Notes : {cli.notes || 'Aucun antécédent répertorié.'}
                          </p>
                        </div>

                        <div className="flex gap-2 pt-3 border-t border-slate-100 mt-2">
                          <button
                            onClick={() => handleEditClientSelect(cli)}
                            className="flex-1 py-1.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-indigo-650 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Edit className="w-3" />
                            <span>Modifier</span>
                          </button>
                          <button
                            onClick={() => handleDeleteClient(cli.id)}
                            className="flex-1 py-1.5 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-rose-600 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3" />
                            <span>Supprimer</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            )}

            {/* ------------------------------------------------ */}
            {/* 5. SERVICES MANAGEMENT PANE */}
            {/* ------------------------------------------------ */}
            {activePane === 'services' && (
              <div className="space-y-6">
                
                <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-150 shadow-sm">
                  <h3 className="font-bold text-slate-850 text-sm">Catalogue des Services</h3>
                  <button
                    onClick={() => setShowAddService(true)}
                    className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold"
                  >
                    Nouveau service
                  </button>
                </div>

                <div className="bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-left whitespace-nowrap text-xs text-slate-700">
                    <thead className="bg-slate-50 text-slate-500 font-mono tracking-widest border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-4">Intitulé</th>
                        <th className="px-6 py-4">Description</th>
                        <th className="px-6 py-4">Durée (minutes)</th>
                        <th className="px-6 py-4">Tarif de base</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                      {services.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-extrabold text-slate-900 text-sm">{item.name}</td>
                          <td className="px-6 py-4 text-slate-500 max-w-xs truncate">{item.description}</td>
                          <td className="px-6 py-4 font-mono font-bold text-indigo-650">{item.duration} min.</td>
                          <td className="px-6 py-4 font-black font-mono text-slate-900 text-sm">{item.price} DH</td>
                          <td className="px-6 py-4 text-right flex justify-end gap-2 pr-6">
                            <button
                              onClick={() => handleEditServiceSelect(item)}
                              className="p-1.5 px-3 text-indigo-600 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-lg text-[11px] font-bold tracking-tight transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <Edit className="w-3" />
                              <span>Modifier</span>
                            </button>
                            <button
                              onClick={() => handleDeleteService(item.id)}
                              className="p-1.5 px-3 text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 rounded-lg text-[11px] font-bold tracking-tight transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3 text-rose-600" />
                              <span>Supprimer</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {services.length === 0 && (
                    <p className="text-center py-10 text-slate-400">Aucun traitement configuré.</p>
                  )}
                </div>

              </div>
            )}

            {/* ------------------------------------------------ */}
            {/* 6. STAFF MANAGEMENT PANE */}
            {/* ------------------------------------------------ */}
            {activePane === 'staff' && (
              <div className="space-y-6">
                
                <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-150 shadow-sm">
                  <h3 className="font-bold text-slate-850 text-sm">Praticiens & Équipe</h3>
                  <button
                    onClick={() => setShowAddStaff(true)}
                    className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold"
                  >
                    Ajouter collaborateur
                  </button>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {staff.map((st) => {
                    const stAppts = appointments.filter(a => a.staff_id === st.id).length;
                    return (
                      <div key={st.id} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm text-center">
                        <img src={st.photo} alt={st.name} referrerPolicy="no-referrer" className="w-16 h-16 rounded-full object-cover mx-auto border-2 border-slate-200" />
                        
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-base">{st.name}</h4>
                          <span className="text-[10px] text-indigo-600 font-bold font-mono tracking-wide">{st.email}</span>
                        </div>

                        <p className="text-xs text-slate-500 font-medium italic min-h-[40px]">
                          "{st.bio || 'Aucune description rédigée.'}"
                        </p>

                        <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3 text-xs">
                          <div className="text-left">
                            <span className="text-slate-450 text-[10px]">Consultations</span>
                            <p className="font-bold text-slate-800">{stAppts} RDVs</p>
                          </div>
                          <div className="text-right">
                            <span className="text-slate-450 text-[10px]">Téléphone</span>
                            <p className="font-bold text-slate-800">{st.phone || 'N/A'}</p>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-3 border-t border-slate-100">
                          <button
                            onClick={() => handleEditStaffSelect(st)}
                            className="flex-1 py-2 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-indigo-650 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Edit className="w-3" />
                            <span>Modifier</span>
                          </button>
                          <button
                            onClick={() => handleDeleteStaff(st.id)}
                            className="flex-1 py-2 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-rose-600 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 text-rose-600" />
                            <span>Supprimer</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            )}

            {/* ------------------------------------------------ */}
            {/* 7. BILLING & UPGRADES PANE */}
            {/* ------------------------------------------------ */}
            {activePane === 'billing' && (
              <div className="space-y-8 font-sans">
                
                {/* ACTIVE SUBSCRIPTION DETAILS */}
                <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono font-bold tracking-wider text-indigo-650 uppercase block">Abonnement SaaS</span>
                    <h3 className="text-2xl font-black text-slate-900">Formule active : {plan?.name || 'Free Trial'}</h3>
                    <p className="text-xs text-slate-500">
                      Vos limites de quotas : <span className="font-bold">{staff.length} sur {plan?.staff_limit}</span> collaborateurs · <span className="font-bold">{appointments.length} sur {plan?.appointment_limit}</span> rendez-vous.
                    </p>
                  </div>

                  <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl">
                    <span className="block text-[11px] text-slate-500 font-bold uppercase tracking-wide">Renouvellement automatique</span>
                    <p className="text-sm font-bold text-slate-800">{sub?.end_date || 'Illimité'}</p>
                    <span className="inline-block mt-1 text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded font-bold uppercase">
                      Prélèvement Stripe actif
                    </span>
                  </div>
                </div>

                {/* UPGRADE TIERS */}
                <div className="space-y-4">
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider font-mono">Changer de forfait SaaS</h3>
                  
                  <div className="grid md:grid-cols-3 gap-6">
                    {[
                      { id: 2, name: 'Basic', price: 290, desc: '3 collaborateurs maxi', appointments: 200 },
                      { id: 3, name: 'Pro', price: 590, desc: '10 collaborateurs maxi', appointments: 1000 },
                      { id: 4, name: 'Premium', price: 1190, desc: 'Equipe et succursales illimités', appointments: 99999 }
                    ].map((tier) => (
                      <div key={tier.id} className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
                        <div className="space-y-2">
                          <h4 className="font-extrabold text-slate-900 text-sm">{tier.name}</h4>
                          <p className="text-[11px] text-slate-550">{tier.desc}</p>
                          <div className="text-xl font-black text-slate-900 pt-1">{tier.price} DH<span className="text-xs text-slate-400 font-normal">/ mois</span></div>
                        </div>

                        <button
                          onClick={() => handleUpgradePlan(tier.id)}
                          disabled={sub?.plan_id === tier.id}
                          className={`w-full mt-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wide transition-all ${
                            sub?.plan_id === tier.id
                              ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow shadow-indigo-150'
                          }`}
                        >
                          {sub?.plan_id === tier.id ? 'Forfait Actif' : 'Sélectionner'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* INVOICES TABLE LOGS */}
                <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-sm space-y-4">
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider font-mono">Historique des Factures</h3>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700 whitespace-nowrap">
                      <thead className="bg-slate-50 font-mono text-slate-500 uppercase">
                        <tr>
                          <th className="px-4 py-3">N° Facture</th>
                          <th className="px-4 py-3">Date issue</th>
                          <th className="px-4 py-3">Montant</th>
                          <th className="px-4 py-3">Statut de validation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {invoices.map((inv) => (
                          <tr key={inv.id}>
                            <td className="px-4 py-3 font-bold font-mono text-indigo-700">{inv.invoice_number}</td>
                            <td className="px-4 py-3">{inv.issue_date}</td>
                            <td className="px-4 py-3 font-black text-slate-900">{inv.amount} DH</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded font-bold uppercase text-[9px]">
                                {inv.status}
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

            {/* ------------------------------------------------ */}
            {/* 8. BRANCHES MANAGEMENT VIEW */}
            {/* ------------------------------------------------ */}
            {activePane === 'branches' && (
              <div className="space-y-6">
                
                <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-sm space-y-4">
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider font-mono">Vos succursales de service</h3>
                  <p className="text-xs text-slate-500">
                    La gestion multi-succursales permet d'ajuster vos emplacements d'activité. (Le plan Basic restreint à 1 branche principale).
                  </p>

                  <div className="grid md:grid-cols-2 gap-6">
                    {branches.map((br) => (
                      <div key={br.id} className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                        <div className="flex justify-between items-start">
                          <h4 className="font-extrabold text-slate-900 text-sm">{br.name}</h4>
                          {br.is_main ? (
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-150 text-[9px] font-bold uppercase rounded">
                              Siège Principal
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] rounded font-semibold">
                              Succursale
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600">{br.address}</p>
                        <div className="text-[11px] text-slate-500 font-mono">
                          <p>Contact: {br.phone}</p>
                          <p>E-mail: {br.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* ------------------------------------------------ */}
            {/* REPORTS & CASH JOURNAL PANE */}
            {/* ------------------------------------------------ */}
            {activePane === 'reports' && (
              <div className="space-y-6 font-sans">
                
                {/* Duration selector & Export actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-150 p-4 rounded-2xl shadow-sm">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-650">Analyse de caisse</span>
                    <h3 className="text-xl font-black text-slate-950">Indicateurs financiers & Rapports</h3>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-xs font-bold text-slate-500">Période:</span>
                    <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                      {(['today', 'week', 'month', 'all'] as const).map((period) => (
                        <button
                          key={period}
                          type="button"
                          onClick={() => setReportDuration(period)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                            reportDuration === period
                              ? 'bg-white text-indigo-700 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {period === 'today' ? "Aujourd'hui" : period === 'week' ? '7 Jours' : period === 'month' ? 'Ce Mois' : 'Tout'}
                        </button>
                      ))}
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => {
                        window.print();
                      }}
                      className="p-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all"
                      title="Imprimer cette vue"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Imprimer
                    </button>
                  </div>
                </div>

                {/* Dashboard grid metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  <div className="bg-white border border-slate-150 p-5 rounded-2xl shadow-sm space-y-2">
                    <span className="text-[10px] font-mono text-slate-450 uppercase font-bold tracking-wide">Chiffre d'Affaires</span>
                    <p className="text-2xl font-black text-slate-900">
                      {filteredPayments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()} DH
                    </p>
                    <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>{filteredPayments.length} transactions</span>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-150 p-5 rounded-2xl shadow-sm space-y-2">
                    <span className="text-[10px] font-mono text-slate-450 uppercase font-bold tracking-wide">Panier Moyen (AOV)</span>
                    <p className="text-2xl font-black text-slate-900">
                      {filteredPayments.length > 0
                        ? (filteredPayments.reduce((sum, p) => sum + p.amount, 0) / filteredPayments.length).toFixed(1)
                        : '0'}{' '}
                      DH
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium">Par ticket encaissé</p>
                  </div>

                  <div className="bg-white border border-slate-150 p-5 rounded-2xl shadow-sm space-y-2">
                    <span className="text-[10px] font-mono text-slate-450 uppercase font-bold tracking-wide">Caisse Espèces / Cash</span>
                    <p className="text-2xl font-black text-slate-900">
                      {filteredPayments.filter(p => p.gateway === 'cash').reduce((sum, p) => sum + p.amount, 0).toLocaleString()} DH
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium">Billetages physiques</p>
                  </div>

                  <div className="bg-white border border-slate-150 p-5 rounded-2xl shadow-sm space-y-2">
                    <span className="text-[10px] font-mono text-slate-450 uppercase font-bold tracking-wide">Montant Bons Cadeaux Actifs</span>
                    <p className="text-2xl font-black text-slate-900">
                      {giftCards.filter(g => g.status === 'active').reduce((sum, g) => sum + g.remaining_amount, 0).toLocaleString()} DH
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium">{giftCards.filter(g => g.status === 'active').length} bons actifs en circulation</p>
                  </div>

                </div>

                {/* Subsections: Payment distribution & performance analysis */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Payment distribution meters */}
                  <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm space-y-5 lg:col-span-4">
                    <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wide border-b pb-2">Répartition par Moyen</h4>
                    
                    <div className="space-y-4 text-xs">
                      {[
                        { label: 'Espèces / Cash', key: 'cash', color: 'bg-emerald-500' },
                        { label: 'Carte Bancaire / Stripe', key: 'card', color: 'bg-blue-500' },
                        { label: 'Virements Bancaires', key: 'transfer', color: 'bg-amber-500' },
                        { label: 'Bons Cadeaux / Vouchers', key: 'gift_card', color: 'bg-indigo-500' },
                      ].map((item) => {
                        const amount = filteredPayments.filter(p => {
                          if (item.key === 'cash') return p.gateway === 'cash';
                          if (item.key === 'card') return p.gateway === 'card' || p.gateway === 'stripe';
                          if (item.key === 'transfer') return p.gateway === 'transfer' || p.gateway === 'paypal';
                          if (item.key === 'gift_card') return p.gateway === 'gift_card';
                          return false;
                        }).reduce((sum, p) => sum + p.amount, 0);

                        const total = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
                        const pct = total > 0 ? (amount / total) * 100 : 0;

                        return (
                          <div key={item.key} className="space-y-1">
                            <div className="flex justify-between items-center text-slate-700 font-bold">
                              <span>{item.label}</span>
                              <span className="font-mono text-slate-900">{amount.toLocaleString()} DH ({pct.toFixed(0)}%)</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`${item.color} h-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Staff performance stats */}
                  <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm lg:col-span-4 space-y-4">
                    <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wide border-b pb-2">Productivité Équipe</h4>
                    
                    <div className="divide-y divide-slate-100 text-xs max-h-60 overflow-y-auto">
                      {staff.map((member) => {
                        const apptsList = appointments.filter(a => a.staff_id === member.id);
                        const done = apptsList.filter(a => a.status_id === 3);
                        const revenue = done.reduce((sum, a) => sum + a.total_price, 0);
                        
                        return (
                          <div key={member.id} className="py-3 flex justify-between items-center">
                            <div>
                              <p className="font-extrabold text-slate-900">{member.name}</p>
                              <span className="text-[10px] text-slate-500">{done.length} prestations complétées</span>
                            </div>
                            <div className="text-right">
                              <span className="font-black text-slate-950 block">{revenue} DH</span>
                              <span className="text-[10px] text-indigo-500 font-bold font-mono">{(revenue / (Math.max(1, done.length))).toFixed(0)} DH/rdv</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Top services analytics */}
                  <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-sm lg:col-span-4 space-y-4">
                    <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wide border-b pb-2">Prestations Phares</h4>
                    <div className="divide-y divide-slate-100 text-xs">
                      {services.slice(0, 4).map((srv) => {
                        const list = appointments.filter(a => a.service_id === srv.id);
                        const count = list.length;
                        const sum = list.filter(a => a.status_id === 3).reduce((acc, a) => acc + a.total_price, 0);
                        return (
                          <div key={srv.id} className="py-3 flex justify-between items-center">
                            <div className="truncate pr-2">
                              <p className="font-extrabold text-slate-950 truncate">{srv.name}</p>
                              <span className="text-[10px] text-slate-450 uppercase">{srv.duration} mins · {count} rdv</span>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="font-black text-slate-900">{sum} DH</p>
                              <p className="text-[9px] text-slate-450 font-semibold">{srv.price} DH l'unité</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

                {/* Cash register log / Journal de caisse */}
                <div className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-slate-150 flex justify-between items-center">
                    <div>
                      <h4 className="text-xs font-extrabold tracking-wide text-slate-900 uppercase">Journal des Encaissements & Transactions</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Historique détaillé point de vente et caisse physique</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto text-xs font-sans">
                    <table className="w-full text-left font-medium">
                      <thead className="bg-slate-50/70 text-[10px] font-bold text-slate-550 uppercase tracking-widest border-b border-slate-150">
                        <tr>
                          <th className="p-4">ID Transaction</th>
                          <th className="p-4">Date / Heure</th>
                          <th className="p-4">Désignation</th>
                          <th className="p-4">Client</th>
                          <th className="p-4">Moyen de Paye</th>
                          <th className="p-4 text-right">Montant Encaissé</th>
                          <th className="p-4 text-center">Billet de caisse</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredPayments.map((p) => {
                          const isGiftCardUsed = p.gateway === 'gift_card';
                          return (
                            <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-4 font-mono font-bold text-slate-700">#{p.id}-{p.transaction_id || 'manual'}</td>
                              <td className="p-4 text-slate-600">{new Date(p.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</td>
                              <td className="p-4 text-slate-900 font-bold">{p.detail || 'Service de soins'}</td>
                              <td className="p-4 font-bold text-slate-800">{p.clientName || 'Invité Anonyme'}</td>
                              <td className="p-4">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  isGiftCardUsed
                                    ? 'bg-indigo-50 border border-indigo-200 text-indigo-700'
                                    : p.gateway === 'cash'
                                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                                    : 'bg-blue-50 border border-blue-200 text-blue-700'
                                }`}>
                                  {p.gateway === 'cash' ? '🔑 Espèces' : p.gateway === 'gift_card' ? '🎁 Bon Cadeau' : p.gateway === 'stripe' || p.gateway === 'card' ? '💳 Carte Bancaire' : '🏦 Virement'}
                                </span>
                              </td>
                              <td className="p-4 font-black text-right text-slate-950">{p.amount} DH</td>
                              <td className="p-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    // compile ticket payload
                                    const mockAppt = appointments.find(a => a.id === p.appointment_id) || {
                                      id: p.appointment_id || 999,
                                      total_price: p.amount,
                                      date: new Date(p.created_at).toISOString().slice(0, 10),
                                      start_time: new Date(p.created_at).toTimeString().slice(0, 5),
                                      end_time: '',
                                      notes: 'Achat direct / Encaissement'
                                    };
                                    setGeneratedTicket({
                                      appointment: mockAppt,
                                      payment: p,
                                      client: { name: p.clientName || 'Direct Cash' },
                                      service: { name: p.detail || 'Service' },
                                      staff: staff.find(s => s.id === mockAppt.staff_id)
                                    });
                                    setShowTicketModal(true);
                                  }}
                                  className="mx-auto flex items-center gap-1 px-2 py-1 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg text-[10px] font-bold transition"
                                >
                                  <Printer className="w-3 h-3 text-slate-500" />
                                  Reçu
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        {filteredPayments.length === 0 && (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-slate-400 italic">Aucune écriture comptable sur cette période.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* ------------------------------------------------ */}
            {/* 8. GIFT CARDS & VOUCHERS PANE */}
            {/* ------------------------------------------------ */}
            {activePane === 'gift_cards' && (
              <div className="space-y-6 font-sans">
                
                {/* Header row */}
                <div className="flex justify-between items-center bg-white border border-slate-150 p-6 rounded-2xl shadow-sm">
                  <div>
                    <span className="text-[10px] font-mono font-bold tracking-wider text-indigo-650 uppercase">Programme de fidélité</span>
                    <h3 className="text-xl font-black text-slate-900">Bons Cadeaux & Chèques Cadeaux</h3>
                    <p className="text-xs text-slate-500 mt-1">Générez et gérez des bons d'achats prépayés pour vos clients</p>
                  </div>
                  
                  <button
                    onClick={() => {
                      // auto populate a pretty code for fast addition
                      const randomCode = 'GIF-' + Math.floor(100 + Math.random() * 900) + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
                      setGiftCardForm({ code: randomCode, initial_amount: '200', client_name: '', client_phone: '', expires_at: '' });
                      setShowAddGiftCard(true);
                    }}
                    className="px-4 py-2.5 bg-indigo-650 hover:bg-indigo-720 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Créer un Bon Cadeau
                  </button>
                </div>

                {/* Gift voucher general stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  
                  <div className="p-5 bg-white border border-slate-150 rounded-2xl shadow-sm space-y-1">
                    <span className="text-[10px] font-mono text-slate-450 uppercase font-bold tracking-wide">Bons Émis Actifs</span>
                    <p className="text-2xl font-black text-slate-900">{giftCards.filter(g => g.status === 'active').length}</p>
                    <p className="text-[11.5px] text-slate-500">Chèques cadeaux en circulation</p>
                  </div>

                  <div className="p-5 bg-white border border-slate-150 rounded-2xl shadow-sm space-y-1">
                    <span className="text-[10px] font-mono text-slate-450 uppercase font-bold tracking-wide">Valeur active en réserve</span>
                    <p className="text-2xl font-black text-indigo-700">
                      {giftCards.filter(g => g.status === 'active').reduce((sum, g) => sum + g.remaining_amount, 0).toLocaleString()} DH
                    </p>
                    <p className="text-[11.5px] text-slate-500">Engagements financiers à honorer</p>
                  </div>

                  <div className="p-5 bg-white border border-slate-150 rounded-2xl shadow-sm space-y-1">
                    <span className="text-[10px] font-mono text-slate-450 uppercase font-bold tracking-wide">Bons Épuisés / Consommés</span>
                    <p className="text-2xl font-black text-slate-900">{giftCards.filter(g => g.status === 'used').length}</p>
                    <p className="text-[11.5px] text-slate-550 font-bold text-emerald-600">
                      {giftCards.reduce((sum, g) => sum + (g.initial_amount - g.remaining_amount), 0).toLocaleString()} DH consommés
                    </p>
                  </div>

                </div>

                {/* List of active with balance meters */}
                <div className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-slate-150">
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Catalogue & Suivi des Chèques Cadeaux</h4>
                  </div>

                  <div className="overflow-x-auto text-xs">
                    <table className="w-full text-left font-medium">
                      <thead className="bg-slate-50 text-[10px] font-bold text-slate-550 uppercase tracking-widest border-b">
                        <tr>
                          <th className="p-4">CODE DU BON</th>
                          <th className="p-4">BÉNÉFICIAIRE / CLIENT</th>
                          <th className="p-4">MONTANT INITIÉ</th>
                          <th className="p-4">SOLDE DISPONIBLE (DH)</th>
                          <th className="p-4">TAUX DE CONSOMMATION</th>
                          <th className="p-4">DATE D'EXPIRE</th>
                          <th className="p-4">Badge Statut</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {giftCards.map((g) => {
                          const spendPct = g.initial_amount > 0 ? (((g.initial_amount - g.remaining_amount) / g.initial_amount) * 100) : 0;
                          const isUsed = g.status === 'used';
                          return (
                            <tr key={g.id} className="hover:bg-slate-55/70">
                              <td className="p-4">
                                <span className="bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg font-mono font-bold text-slate-900 shadow-sm inline-block select-all">
                                  {g.code}
                                </span>
                              </td>
                              <td className="p-4">
                                <div>
                                  <p className="font-extrabold text-slate-900">{g.client_name}</p>
                                  <p className="text-[10px] text-slate-500">{g.client_phone || 'Pas de mobile'}</p>
                                </div>
                              </td>
                              <td className="p-4 font-black text-slate-700">{g.initial_amount} DH</td>
                              <td className="p-4">
                                <span className={`text-sm font-black ${g.remaining_amount > 0 ? 'text-indigo-650' : 'text-slate-400 line-through'}`}>
                                  {g.remaining_amount} DH
                                </span>
                              </td>
                              <td className="p-4 w-44">
                                <div className="space-y-1">
                                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                                    <span>Consommé: {spendPct.toFixed(0)}%</span>
                                    <span>Reste: {g.remaining_amount} DH</span>
                                  </div>
                                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="bg-indigo-500 h-full rounded-full transition-all" style={{ width: `${spendPct}%` }} />
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 text-slate-500">{g.expires_at ? new Date(g.expires_at).toLocaleDateString() : 'Sans expiration'}</td>
                              <td className="p-4">
                                <span className={`inline-block px-2.5 py-0.5 rounded-xl uppercase text-[10px] tracking-wider font-extrabold ${
                                  g.status === 'active'
                                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                                    : 'bg-slate-100 border border-slate-200 text-slate-500'
                                }`}>
                                  {g.status === 'active' ? '🟢 Actif' : '🔴 Consommé'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                        {giftCards.length === 0 && (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-slate-400 italic">Aucun chèque-cadeau enregistré dans le salon de beauté.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* ------------------------------------------------ */}
            {/* 8b. PRODUCTS & INVENTORY PANE */}
            {/* ------------------------------------------------ */}
            {activePane === 'products' && (
              <div className="space-y-6 font-sans">
                
                {/* Header row */}
                <div className="flex justify-between items-center bg-white border border-slate-150 p-6 rounded-2xl shadow-sm">
                  <div>
                    <span className="text-[10px] font-mono font-bold tracking-wider text-indigo-650 uppercase">Gestion des stocks</span>
                    <h3 className="text-xl font-black text-slate-900">Catalogue Produits & Inventaire</h3>
                    <p className="text-xs text-slate-500 mt-1">Gérez le catalogue des produits de vente retail de votre salon de coiffure / esthétique</p>
                  </div>
                  
                  <button
                    onClick={() => {
                      const randSku = 'PROD-' + Math.random().toString(36).substring(2, 6).toUpperCase();
                      setProductForm({ name: '', sku: randSku, price: '120', cost_price: '50', stock: '20', category: 'Soins', supplier: '' });
                      setShowAddProduct(true);
                    }}
                    className="px-4 py-2.5 bg-indigo-650 hover:bg-indigo-720 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter un Produit
                  </button>
                </div>

                {/* Stock metrics dashboard cards */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  
                  <div className="p-5 bg-white border border-slate-150 rounded-2xl shadow-sm space-y-1">
                    <span className="text-[10px] font-mono text-slate-450 uppercase font-bold tracking-wide">Références Uniques</span>
                    <p className="text-2xl font-black text-slate-900">{products.length}</p>
                    <p className="text-[11.5px] text-slate-500">Produits différents enregistrés</p>
                  </div>

                  <div className="p-5 bg-white border border-slate-150 rounded-2xl shadow-sm space-y-1">
                    <span className="text-[10px] font-mono text-slate-450 uppercase font-bold tracking-wide">Stock Total en Unités</span>
                    <p className="text-2xl font-black text-indigo-700">
                      {products.reduce((sum, p) => sum + Number(p.stock || 0), 0)}
                    </p>
                    <p className="text-[11.5px] text-slate-550 font-bold text-indigo-500">Pièces en stock</p>
                  </div>

                  <div className="p-5 bg-white border border-slate-150 rounded-2xl shadow-sm space-y-1">
                    <span className="text-[10px] font-mono text-slate-450 uppercase font-bold tracking-wide">Alertes Stock Critique</span>
                    <p className="text-2xl font-black text-amber-600">
                      {products.filter(p => Number(p.stock || 0) <= 5).length}
                    </p>
                    <p className="text-[11.5px] text-slate-500">Alerte rupture (stock ≤ 5 pièces)</p>
                  </div>

                  <div className="p-5 bg-white border border-slate-150 rounded-2xl shadow-sm space-y-1">
                    <span className="text-[10px] font-mono text-slate-450 uppercase font-bold tracking-wide">Valeur Assets Stock (Vente)</span>
                    <p className="text-2xl font-black text-emerald-700">
                      {products.reduce((sum, p) => sum + (Number(p.price || 0) * Number(p.stock || 0)), 0).toLocaleString()} DH
                    </p>
                    <p className="text-[11.5px] text-slate-550 font-semibold text-emerald-600">
                      Bénéfice latent estimé: {products.reduce((sum, p) => sum + ((Number(p.price) - Number(p.cost_price)) * Number(p.stock)), 0).toLocaleString()} DH
                    </p>
                  </div>

                </div>

                {/* List Table of products */}
                <div className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-slate-150 flex justify-between items-center">
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Inventaire & Valorisation des produits retail</h4>
                  </div>

                  <div className="overflow-x-auto text-xs">
                    <table className="w-full text-left font-medium">
                      <thead className="bg-slate-50 text-[10px] font-bold text-slate-550 uppercase tracking-widest border-b">
                        <tr>
                          <th className="p-4">SKU / CODE</th>
                          <th className="p-4">NOM DU PRODUIT</th>
                          <th className="p-4">CATÉGORIE</th>
                          <th className="p-4">PRIX ACHAT / VENTE</th>
                          <th className="p-4">MARGE %</th>
                          <th className="p-4">STOCK DISPONIBLE</th>
                          <th className="p-4 text-right">ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {products.map((p) => {
                          const margin = p.price > 0 ? ((p.price - p.cost_price) / p.price * 100) : 0;
                          const critStock = p.stock <= 5;
                          return (
                            <tr key={p.id} className="hover:bg-slate-55/70">
                              <td className="p-4 font-mono font-bold text-slate-550">{p.sku}</td>
                              <td className="p-4">
                                <span className="font-extrabold text-slate-900">{p.name}</span>
                                {p.supplier && <span className="block text-[10px] text-slate-400">Fournisseur : {p.supplier}</span>}
                              </td>
                              <td className="p-4">
                                <span className="px-2 py-1 bg-slate-100 text-slate-650 rounded-lg font-bold border border-slate-200">
                                  {p.category || 'Général'}
                                </span>
                              </td>
                              <td className="p-4">
                                <div className="space-y-0.5">
                                  <p className="font-black text-slate-900">{p.price} DH <span className="text-[10px] font-medium text-slate-405">Public</span></p>
                                  <p className="text-[10px] text-slate-450 font-semibold">{p.cost_price || 0} DH <span className="font-medium text-slate-450">Coût</span></p>
                                </div>
                              </td>
                              <td className="p-4 text-emerald-600 font-bold uppercase text-[10.5px]">
                                {margin.toFixed(0)}% Marge
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <span className={`text-sm font-black ${critStock ? 'text-amber-600' : 'text-slate-800'}`}>
                                    {p.stock} pcs
                                  </span>
                                  {critStock && (
                                    <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[9px] font-extrabold uppercase">STOCK FAIBLE</span>
                                  )}
                                </div>
                              </td>
                              <td className="p-4 text-right">
                                <div className="flex justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleEditProductSelect(p)}
                                    className="p-1 px-2.5 hover:bg-indigo-50 hover:text-indigo-650 border border-transparent hover:border-indigo-200 text-indigo-500 rounded-lg font-bold text-[10px] uppercase transition-all"
                                  >
                                    Modifier
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteProduct(p.id)}
                                    className="p-1 px-2.5 hover:bg-rose-50 hover:text-rose-600 border border-transparent hover:border-rose-200 text-slate-400 rounded-lg font-bold text-[10px] uppercase transition-all"
                                  >
                                    Retirer
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {products.length === 0 && (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-slate-400 italic">Aucun produit en stock. Cliquez sur "Ajouter un produit" pour alimenter votre inventaire.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* ------------------------------------------------ */}
            {/* 8c. PROMOTIONS & MARKETING PANE */}
            {/* ------------------------------------------------ */}
            {activePane === 'promotions' && (
              <div className="space-y-6 font-sans">
                
                {/* Header row */}
                <div className="flex justify-between items-center bg-white border border-slate-150 p-6 rounded-2xl shadow-sm">
                  <div>
                    <span className="text-[10px] font-mono font-bold tracking-wider text-indigo-650 uppercase">Marketing & Fidélisation</span>
                    <h3 className="text-xl font-black text-slate-900">Codes de Réduction & Promotions</h3>
                    <p className="text-xs text-slate-500 mt-1">Créez des offres attractives et des coupons de rabais pour inciter les réservations dans votre salon de beauté</p>
                  </div>
                  
                  <button
                    onClick={() => {
                      setShowAddPromotion(true);
                    }}
                    className="px-4 py-2.5 bg-indigo-650 hover:bg-indigo-720 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Créer un Code Promo
                  </button>
                </div>

                {/* Dashboard stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  
                  <div className="p-5 bg-white border border-slate-150 rounded-2xl shadow-sm space-y-1">
                    <span className="text-[10px] font-mono text-slate-450 uppercase font-bold tracking-wide">Campagnes Enregistrées</span>
                    <p className="text-2xl font-black text-slate-900">{promotions.length}</p>
                    <p className="text-[11.5px] text-slate-500">Total d'offres promotionnelles</p>
                  </div>

                  <div className="p-5 bg-white border border-slate-150 rounded-2xl shadow-sm space-y-1">
                    <span className="text-[10px] font-mono text-slate-450 uppercase font-bold tracking-wide">Offres actives</span>
                    <p className="text-2xl font-black text-emerald-600">
                      {promotions.filter(p => p.status === 'active').length}
                    </p>
                    <p className="text-[11.5px] text-slate-555">Coupons de réduction applicables actuellement</p>
                  </div>

                  <div className="p-5 bg-white border border-slate-150 rounded-2xl shadow-sm space-y-1">
                    <span className="text-[10px] font-mono text-slate-450 uppercase font-bold tracking-wide">Performance & Click-through</span>
                    <p className="text-2xl font-black text-indigo-700 font-sans">Salon-First</p>
                    <p className="text-[11.5px] text-slate-500">Applicable en direct lors de la caisse</p>
                  </div>

                </div>

                {/* Promotions Table List */}
                <div className="bg-white border border-slate-150 rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-slate-150">
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Catalogue des bons et remises fidélité</h4>
                  </div>

                  <div className="overflow-x-auto text-xs">
                    <table className="w-full text-left font-medium">
                      <thead className="bg-slate-50 text-[10px] font-bold text-slate-550 uppercase tracking-widest border-b">
                        <tr>
                          <th className="p-4">CODE PROMO</th>
                          <th className="p-4">NOM DE L'OFFRE / CAMPAGNE</th>
                          <th className="p-4">VALEUR DE LA REMISE</th>
                          <th className="p-4">DATE DE DÉBUT</th>
                          <th className="p-4">EXPIRATION</th>
                          <th className="p-4 flex items-center gap-1">STATUT BADGE</th>
                          <th className="p-4 text-right">ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {promotions.map((p) => {
                          const isPercent = p.discount_type === 'percent';
                          return (
                            <tr key={p.id} className="hover:bg-slate-55/70">
                              <td className="p-4">
                                <span className="bg-indigo-50 border border-indigo-150 px-3 py-1.5 rounded-lg font-mono font-bold text-indigo-700 shadow-sm inline-block select-all">
                                  {p.code}
                                </span>
                              </td>
                              <td className="p-4 font-extrabold text-slate-900">{p.name}</td>
                              <td className="p-4">
                                <span className="text-sm font-black text-slate-950 block">
                                  {isPercent ? `${p.discount_value}%` : `${p.discount_value} DH`}
                                </span>
                                <span className="text-[9px] text-slate-450 tracking-wider font-bold uppercase">de réduction</span>
                              </td>
                              <td className="p-4 text-slate-500 font-mono text-[10.5px]">{p.start_date ? new Date(p.start_date).toLocaleDateString() : 'Immediat'}</td>
                              <td className="p-4 text-slate-500 font-mono text-[10.5px]">{p.expires_at ? new Date(p.expires_at).toLocaleDateString() : 'Sans date limite'}</td>
                              <td className="p-4">
                                <span className="inline-block px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl uppercase text-[10px] tracking-wider font-extrabold">
                                  Actif
                                </span>
                              </td>
                              <td className="p-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleDeletePromotion(p.id)}
                                  className="p-1 px-2.5 hover:bg-rose-50 hover:text-rose-600 border border-transparent hover:border-rose-200 text-slate-400 rounded-lg font-bold text-[10px] uppercase transition-all"
                                >
                                  Retirer
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        {promotions.length === 0 && (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-slate-400 italic">Aucune promotion en cours. Cliquez sur "Créer un Code Promo".</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* ------------------------------------------------ */}
            {/* 9. SETTINGS PANE */}
            {/* ------------------------------------------------ */}
            {activePane === 'settings' && stats && (
              <form onSubmit={handleUpdateSettings} className="space-y-6">
                <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-sm space-y-6">
                  
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider font-mono">Profil de l'Établissement & Branding</h3>
                    <p className="text-xs text-slate-500">Configurez l'identité visuelle et les coordonnées publiques de votre salon sur la plateforme de booking.</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 font-sans">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Nom Commercial du Salon</label>
                      <input
                        type="text"
                        required
                        value={settingsForm.name}
                        onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-205 p-3 rounded-xl mt-1.5 text-xs outline-none focus:bg-white"
                        placeholder="Ex : NIDZAK Beauty & Spa"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Adresse E-mail de Contact</label>
                      <input
                        type="email"
                        required
                        value={settingsForm.email}
                        onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-205 p-3 rounded-xl mt-1.5 text-xs outline-none focus:bg-white"
                        placeholder="contact@salon.ma"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Téléphone de l'Établissement</label>
                      <input
                        type="text"
                        required
                        value={settingsForm.phone}
                        onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-205 p-3 rounded-xl mt-1.5 text-xs outline-none focus:bg-white"
                        placeholder="Ex : +212 522 00 00 00"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Adresse Physique Complète</label>
                      <input
                        type="text"
                        required
                        value={settingsForm.address}
                        onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-205 p-3 rounded-xl mt-1.5 text-xs outline-none focus:bg-white"
                        placeholder="Ex : 12 Rue des Hôpitaux, Quartier Gauthier, Casablanca"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Logo URL (Image de marque)</label>
                      <input
                        type="text"
                        value={settingsForm.logo}
                        onChange={(e) => setSettingsForm({ ...settingsForm, logo: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-205 p-3 rounded-xl mt-1.5 text-xs outline-none focus:bg-white font-mono"
                        placeholder="Ex : https://images.unsplash.com/photo-..."
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Slogan ou Description du salon</label>
                      <textarea
                        value={settingsForm.description}
                        onChange={(e) => setSettingsForm({ ...settingsForm, description: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-205 p-3 rounded-xl mt-1.5 text-xs outline-none focus:bg-white resize-none font-sans"
                        rows={3}
                        placeholder="Décrivez votre expertise, l'ambiance de votre salon et vos spécialités cosmetologiques..."
                      />
                    </div>
                  </div>

                </div>

                <div className="bg-white border border-slate-150 rounded-2xl p-6 shadow-sm space-y-6">
                  
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider font-mono">Préférences de Facturation & Localisation</h3>
                    <p className="text-xs text-slate-500">Configurez la devise, les fuseaux horaires et les options de monétisation du salon.</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Devises par défaut</label>
                      <select
                        value={settingsForm.currency}
                        onChange={(e) => setSettingsForm({ ...settingsForm, currency: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 font-bold text-xs p-3 rounded-xl mt-1.5 focus:bg-white outline-none cursor-pointer"
                      >
                        <option value="MAD">Dirham Marocain (MAD)</option>
                        <option value="EUR">Euro (EUR)</option>
                        <option value="USD">US Dollar (USD)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Fuseau Horaire</label>
                      <select
                        value={settingsForm.timezone}
                        onChange={(e) => setSettingsForm({ ...settingsForm, timezone: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 text-xs p-3 rounded-xl mt-1.5 focus:bg-white outline-none cursor-pointer"
                      >
                        <option value="Africa/Casablanca">Afrique / Casablanca (GMT+1)</option>
                        <option value="Europe/Paris">Europe / Paris (GMT+2)</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button
                      type="submit"
                      className="px-6 py-3 bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl uppercase tracking-wider shadow-md transition-all cursor-pointer"
                    >
                      Enregistrer les Réglages
                    </button>
                  </div>

                </div>
              </form>
            )}

          </>
        )}

      </main>

      {/* ------------------------------------------------ */}
      {/* ADD APPOINTMENT MODAL OVERLAY */}
      {/* ------------------------------------------------ */}
      {showAddAppt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 py-8 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">Planifier un rendez-vous</h3>
              <button onClick={() => setShowAddAppt(false)} className="text-slate-400 hover:text-slate-900 font-extrabold text-sm">X</button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-4">
              
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">1. Sélectionner le Client</label>
                <select
                  required
                  value={apptForm.client_id}
                  onChange={(e) => setApptForm({ ...apptForm, client_id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 mt-1 p-2.5 text-xs rounded-xl focus:bg-white outline-none"
                >
                  <option value="">-- Choisir un client --</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
                </select>
                <button
                  type="button"
                  onClick={() => { setShowAddAppt(false); setShowAddClient(true); }}
                  className="text-[10px] font-bold text-indigo-650 hover:underline mt-1.5 display-inline-block"
                >
                  + Créer une nouvelle fiche client
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">2. Collaborateur</label>
                  <select
                    required
                    value={apptForm.staff_id}
                    onChange={(e) => setApptForm({ ...apptForm, staff_id: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 mt-1 p-2.5 text-xs rounded-xl focus:bg-white outline-none"
                  >
                    <option value="">-- Praticien --</option>
                    {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">3. Prestation de soin</label>
                  <select
                    required
                    value={apptForm.service_id}
                    onChange={(e) => setApptForm({ ...apptForm, service_id: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 mt-1 p-2.5 text-xs rounded-xl focus:bg-white outline-none"
                  >
                    <option value="">-- Prestation --</option>
                    {services.map(s => <option key={s.id} value={s.id}>{s.name} ({s.price} DH)</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">4. Date de visite</label>
                  <input
                    type="date"
                    required
                    value={apptForm.date}
                    onChange={(e) => setApptForm({ ...apptForm, date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 mt-1 p-2.5 text-xs rounded-xl focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">5. Heure de début</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 11:30"
                    value={apptForm.start_time}
                    onChange={(e) => setApptForm({ ...apptForm, start_time: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 mt-1 p-2.5 text-xs rounded-xl focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Notes Optionnelles</label>
                <textarea
                  value={apptForm.notes}
                  onChange={(e) => setApptForm({ ...apptForm, notes: e.target.value })}
                  placeholder="Ex: Demande un shampoing doux bio..."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 mt-1 p-2.5 text-xs rounded-xl focus:bg-white outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddAppt(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 hover:bg-indigo-700 bg-indigo-600 text-white text-xs font-bold rounded-xl"
                >
                  Confirmer la planification
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------ */}
      {/* APPOINTMENT ACTIONS MODAL DETAIL (CLICK FROM CALENDAR) */}
      {/* ------------------------------------------------ */}
      {selectedAppt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2.5xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <span className="text-[11px] font-bold text-indigo-750 font-mono tracking-wide uppercase">Rendez-vous #{selectedAppt.id}</span>
              <button onClick={() => setSelectedAppt(null)} className="text-slate-400 font-extrabold">X</button>
            </div>

            <div className="space-y-4 text-xs font-medium text-slate-700 font-sans">
              
              <div className="space-y-1">
                <span className="block text-[10px] font-mono font-bold uppercase text-slate-400">Client Visiteur</span>
                <p className="text-base font-black text-slate-900">{selectedAppt.client_name}</p>
                <p className="text-slate-500">{selectedAppt.client_phone} · {selectedAppt.client_email}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 font-bold block uppercase">Date & Heure</span>
                  <p className="font-bold text-slate-800">{selectedAppt.date}</p>
                  <p className="font-bold text-indigo-700">{selectedAppt.start_time} - {selectedAppt.end_time}</p>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-400 font-bold block uppercase">Chiffre Facturé</span>
                  <p className="text-base font-black text-slate-900">{selectedAppt.total_price} DH</p>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest">{selectedAppt.service_name}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-mono text-slate-400 font-bold block uppercase">Notes d'agenda</span>
                <p className="p-2 bg-slate-50 rounded italic">{selectedAppt.notes || 'Aucun mémo d\'accompagnement.'}</p>
              </div>

              <div className="border-t border-slate-100 pt-4 flex flex-wrap gap-2 justify-between">
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleUpdateApptStatus(selectedAppt.id, 2)} // 2 = confirmed
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 font-semibold rounded text-[11px]"
                  >
                    Confirmer
                  </button>
                  <button
                    onClick={() => {
                      setCheckoutAppt(selectedAppt);
                      setCheckoutForm({ payment_method: 'cash', gift_card_code: '' });
                      setShowCheckout(true);
                    }}
                    className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-600 text-emerald-800 hover:text-white border border-emerald-300 font-extrabold rounded-xl text-[11px] shadow-sm flex items-center gap-1"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    Encaisser (Checkout)
                  </button>
                  <button
                    onClick={() => handleUpdateApptStatus(selectedAppt.id, 4)} // 4 = cancelled
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-500 text-rose-700 hover:text-white border border-rose-200 font-semibold rounded text-[11px]"
                  >
                    Annuler
                  </button>
                </div>

                <button
                  onClick={() => handleDeleteAppt(selectedAppt.id)}
                  className="p-1 px-2.5 bg-slate-100 hover:bg-rose-600 text-slate-500 hover:text-white border border-slate-200 hover:border-rose-500 rounded text-xs"
                  title="Supprimer définitivement"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------ */}
      {/* QUICK ADD SERVICE MODAL */}
      {/* ------------------------------------------------ */}
      {showAddService && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900">Enregistrer une prestation</h3>
              <button onClick={() => setShowAddService(false)} className="text-slate-400 font-extrabold">X</button>
            </div>

            <form onSubmit={handleCreateService} className="space-y-3 font-sans">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Nom du service</label>
                <input
                  type="text"
                  required
                  placeholder="Ex : Massage de Gauthier Relax"
                  value={serviceForm.name}
                  onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs rounded-xl mt-1 outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Description</label>
                <textarea
                  value={serviceForm.description}
                  onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                  placeholder="Expliquez la nature du traitement..."
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs rounded-xl mt-1 outline-none resize-none"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Prix (DH)</label>
                  <input
                    type="number"
                    required
                    placeholder="Ex: 250"
                    value={serviceForm.price}
                    onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs rounded-xl mt-1 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Durée (minutes)</label>
                  <select
                    value={serviceForm.duration}
                    onChange={(e) => setServiceForm({ ...serviceForm, duration: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 text-sm rounded-xl mt-1 font-mono outline-none"
                  >
                    <option value="15">15 min</option>
                    <option value="30">30 min</option>
                    <option value="45">45 min</option>
                    <option value="60">60 min (1h)</option>
                    <option value="90">90 min</option>
                    <option value="120">120 min (2h)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowAddService(false)} className="px-4 py-2 bg-slate-100 text-slate-650 text-xs rounded-xl">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl">Confirmer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------ */}
      {/* QUICK ADD STAFF MODAL */}
      {/* ------------------------------------------------ */}
      {showAddStaff && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900">Enregistrer un collaborateur</h3>
              <button onClick={() => setShowAddStaff(false)} className="text-slate-400 font-extrabold">X</button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-3 font-sans">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Nom Complet</label>
                <input
                  type="text"
                  required
                  placeholder="Yasmina Bennani"
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs rounded-xl mt-1"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">E-mail</label>
                <input
                  type="email"
                  required
                  placeholder="yasmina@notre-salon.com"
                  value={staffForm.email}
                  onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs rounded-xl mt-1"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Téléphone portable</label>
                <input
                  type="text"
                  placeholder="+212 6..."
                  value={staffForm.phone}
                  onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs rounded-xl mt-1"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Bio de présentation</label>
                <textarea
                  value={staffForm.bio}
                  onChange={(e) => setStaffForm({ ...staffForm, bio: e.target.value })}
                  placeholder="Expert coloriste, coiffeur, etc..."
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs rounded-xl mt-1 resize-none"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowAddStaff(false)} className="px-4 py-2 bg-slate-100 text-slate-650 text-xs rounded-xl">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl">Créer collaborateur</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------ */}
      {/* QUICK ADD CLIENT MODAL */}
      {/* ------------------------------------------------ */}
      {showAddClient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3 border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base">Ajouter une Fiche Client</h3>
              <button onClick={() => setShowAddClient(false)} className="text-slate-400 font-extrabold">X</button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-3 font-sans">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Nom du client</label>
                <input
                  type="text"
                  required
                  placeholder="Sofia Alami"
                  value={clientForm.name}
                  onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 text-xs rounded-xl mt-1 focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Adresse E-mail (Optionnel)</label>
                <input
                  type="email"
                  placeholder="sofia@gmail.com"
                  value={clientForm.email}
                  onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 text-xs rounded-xl mt-1 focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Téléphone portable</label>
                <input
                  type="text"
                  required
                  placeholder="+212 600..."
                  value={clientForm.phone}
                  onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 text-xs rounded-xl mt-1 focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Antécédents / Préférences</label>
                <textarea
                  value={clientForm.notes}
                  onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })}
                  placeholder="Ex : Sensible aux lissages forts. Boit du thé bio..."
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 text-xs rounded-xl mt-1 focus:bg-white outline-none resize-none"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => { setShowAddClient(false); if (activePane === 'calendar') setShowAddAppt(true); }} className="px-4 py-2 bg-slate-100 text-slate-600 text-xs rounded-xl font-bold">Retour</button>
                <button type="submit" className="px-5 py-2 bg-indigo-650 text-white text-xs font-bold rounded-xl shadow-md">Enregistrer la fiche</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------ */}
      {/* EDIT SERVICE MODAL */}
      {/* ------------------------------------------------ */}
      {editingService && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3 border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base">Modifier le Service</h3>
              <button onClick={() => setEditingService(null)} className="text-slate-400 font-extrabold">X</button>
            </div>

            <form onSubmit={handleUpdateService} className="space-y-3 font-sans">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Nom du service</label>
                <input
                  type="text"
                  required
                  placeholder="Ex : Massage de Gauthier Relax"
                  value={editServiceForm.name}
                  onChange={(e) => setEditServiceForm({ ...editServiceForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 text-xs rounded-xl mt-1 focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Description</label>
                <textarea
                  value={editServiceForm.description}
                  onChange={(e) => setEditServiceForm({ ...editServiceForm, description: e.target.value })}
                  placeholder="Expliquez la nature du traitement..."
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 text-xs rounded-xl mt-1 focus:bg-white outline-none resize-none"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Prix (DH)</label>
                  <input
                    type="number"
                    required
                    placeholder="Ex: 250"
                    value={editServiceForm.price}
                    onChange={(e) => setEditServiceForm({ ...editServiceForm, price: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 text-xs rounded-xl mt-1 focus:bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Durée (minutes)</label>
                  <select
                    value={editServiceForm.duration}
                    onChange={(e) => setEditServiceForm({ ...editServiceForm, duration: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 text-sm rounded-xl mt-1 font-mono outline-none focus:bg-white"
                  >
                    <option value="15">15 min</option>
                    <option value="30">30 min</option>
                    <option value="45">45 min</option>
                    <option value="60">60 min (1h)</option>
                    <option value="90">90 min</option>
                    <option value="120">120 min (2h)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setEditingService(null)} className="px-4 py-2 bg-slate-100 text-slate-600 text-xs rounded-xl font-bold">Retour</button>
                <button type="submit" className="px-5 py-2 bg-indigo-650 text-white text-xs font-bold rounded-xl shadow-md">Enregistrer les modifications</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------ */}
      {/* EDIT STAFF MODAL */}
      {/* ------------------------------------------------ */}
      {editingStaff && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3 border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base">Modifier le Collaborateur</h3>
              <button onClick={() => setEditingStaff(null)} className="text-slate-400 font-extrabold">X</button>
            </div>

            <form onSubmit={handleUpdateStaff} className="space-y-3 font-sans">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Nom Complet</label>
                <input
                  type="text"
                  required
                  placeholder="Ex : Driss El Fassi"
                  value={editStaffForm.name}
                  onChange={(e) => setEditStaffForm({ ...editStaffForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 text-xs rounded-xl mt-1 focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Adresse E-mail pro</label>
                <input
                  type="email"
                  required
                  placeholder="driss@salon.ma"
                  value={editStaffForm.email}
                  onChange={(e) => setEditStaffForm({ ...editStaffForm, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 text-xs rounded-xl mt-1 focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Gsm / Mobile</label>
                <input
                  type="text"
                  placeholder="Ex : 06 00 00 00 00"
                  value={editStaffForm.phone}
                  onChange={(e) => setEditStaffForm({ ...editStaffForm, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 text-xs rounded-xl mt-1 focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Parcours / Bio raccourci</label>
                <textarea
                  placeholder="Ex : Coiffeuse visagiste experte en colorations depuis 7 ans..."
                  value={editStaffForm.bio}
                  onChange={(e) => setEditStaffForm({ ...editStaffForm, bio: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 text-xs rounded-xl mt-1 focus:bg-white outline-none resize-none"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setEditingStaff(null)} className="px-4 py-2 bg-slate-100 text-slate-600 text-xs rounded-xl font-bold">Retour</button>
                <button type="submit" className="px-5 py-2 bg-indigo-650 text-white text-xs font-bold rounded-xl shadow-md">Enregistrer les modifications</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------ */}
      {/* EDIT CLIENT MODAL */}
      {/* ------------------------------------------------ */}
      {editingClient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3 border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base">Modifier la Fiche Client</h3>
              <button onClick={() => setEditingClient(null)} className="text-slate-400 font-extrabold">X</button>
            </div>

            <form onSubmit={handleUpdateClient} className="space-y-3 font-sans">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Nom du client</label>
                <input
                  type="text"
                  required
                  placeholder="Sofia Alami"
                  value={editClientForm.name}
                  onChange={(e) => setEditClientForm({ ...editClientForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 text-xs rounded-xl mt-1 focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Adresse E-mail (Optionnel)</label>
                <input
                  type="email"
                  placeholder="sofia@gmail.com"
                  value={editClientForm.email}
                  onChange={(e) => setEditClientForm({ ...editClientForm, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 text-xs rounded-xl mt-1 focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Téléphone portable</label>
                <input
                  type="text"
                  required
                  placeholder="+212 600..."
                  value={editClientForm.phone}
                  onChange={(e) => setEditClientForm({ ...editClientForm, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 text-xs rounded-xl mt-1 focus:bg-white outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Antécédents / Préférences</label>
                <textarea
                  value={editClientForm.notes}
                  onChange={(e) => setEditClientForm({ ...editClientForm, notes: e.target.value })}
                  placeholder="Ex : Sensible aux lissages forts. Boit du thé bio..."
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 text-xs rounded-xl mt-1 focus:bg-white outline-none resize-none"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setEditingClient(null)} className="px-4 py-2 bg-slate-100 text-slate-600 text-xs rounded-xl font-bold">Retour</button>
                <button type="submit" className="px-5 py-2 bg-indigo-650 text-white text-xs font-bold rounded-xl shadow-md">Enregistrer les modifications</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------ */}
      {/* CHECKOUT MODAL SYSTEM */}
      {/* ------------------------------------------------ */}
      {showCheckout && checkoutAppt && (() => {
        const selectedPromo = promotions.find(p => p.code === checkoutForm.promotion_code);
        const selectedProd = products.find(p => p.id === parseInt(checkoutForm.product_id));
        const apptBasePrice = services.find(s => s.id === checkoutAppt.service_id)?.price || checkoutAppt.total_price || 0;
        
        let promoDiscount = 0;
        if (selectedPromo) {
          if (selectedPromo.discount_type === 'percent') {
            promoDiscount = Number((apptBasePrice * (selectedPromo.discount_value / 100)).toFixed(2));
          } else {
            promoDiscount = selectedPromo.discount_value;
          }
        }
        const retailProductPrice = selectedProd ? selectedProd.price : 0;
        const computedNetTotal = Math.max(0, apptBasePrice - promoDiscount) + retailProductPrice;

        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200 font-sans">
              <div className="flex justify-between items-center border-b pb-3 border-slate-100">
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-indigo-600" />
                  Système d'Encaissement Caisse
                </h3>
                <button onClick={() => { setShowCheckout(false); setCheckoutAppt(null); }} className="text-slate-400 hover:text-slate-750 font-extrabold text-sm">X</button>
              </div>
              
              <div className="bg-indigo-50/70 p-4 rounded-xl border border-indigo-100 text-xs text-indigo-950 space-y-2">
                <div className="flex justify-between">
                  <span className="font-bold">Client :</span>
                  <span className="font-extrabold text-slate-900">{checkoutAppt.client_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">Service de base :</span>
                  <span className="text-slate-650 font-semibold">{checkoutAppt.service_name} ({apptBasePrice} DH)</span>
                </div>
                
                {promoDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Remise Coupon ({selectedPromo?.code}) :</span>
                    <span>-{promoDiscount} DH</span>
                  </div>
                )}

                {retailProductPrice > 0 && (
                  <div className="flex justify-between text-indigo-700 font-bold">
                    <span>Produit retail ({selectedProd?.name}) :</span>
                    <span>+{retailProductPrice} DH</span>
                  </div>
                )}

                <div className="flex justify-between border-t border-indigo-200/50 pt-2 text-sm">
                  <span className="font-black text-slate-900">Total net estimé à prélever :</span>
                  <span className="font-black text-indigo-900 text-base">{computedNetTotal} DH</span>
                </div>
              </div>

              <form onSubmit={handleCheckoutConfirm} className="space-y-4 text-xs font-medium">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase font-sans">1. Moyen de règlement principal</label>
                  <select
                    value={checkoutForm.payment_method}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, payment_method: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 mt-1 p-2.5 text-xs rounded-xl focus:bg-white outline-none font-bold text-slate-800"
                  >
                    <option value="cash">🔑 Espèces (Direct Cash)</option>
                    <option value="stripe">💳 Carte Bancaire (Lecteur / TPE)</option>
                    <option value="transfer">🏦 Virement Bancaire</option>
                    <option value="gift_card">🎁 Valider avec un Bon Cadeau</option>
                  </select>
                </div>

                {checkoutForm.payment_method === 'gift_card' && (
                  <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-150 space-y-2">
                    <label className="text-[10px] font-bold text-indigo-700 uppercase">Saisir le Code unique du Bon Cadeau</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: GIF-384-HKA8"
                      value={checkoutForm.gift_card_code}
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, gift_card_code: e.target.value })}
                      className="w-full bg-white border border-indigo-200 px-3 py-2 text-xs rounded-lg outline-none font-mono font-bold text-center tracking-widest text-indigo-900 uppercase"
                    />
                    <p className="text-[10px] text-indigo-650/80 italic">La valeur du bon cadeau sera débitée du montant total. Si le solde est insuffisant, le reste sera géré.</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">2. Coupon Promo (Optionnel)</label>
                    <select
                      value={checkoutForm.promotion_code}
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, promotion_code: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 mt-1 p-2.5 text-xs rounded-xl focus:bg-white outline-none font-bold text-slate-800"
                    >
                      <option value="">Aucune promotion</option>
                      {promotions.filter(p => p.status === 'active').map(p => (
                        <option key={p.id} value={p.code}>{p.code} (-{p.discount_type === 'percent' ? `${p.discount_value}%` : `${p.discount_value} DH`})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">3. Vente additionnelle (Produit)</label>
                    <select
                      value={checkoutForm.product_id}
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, product_id: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 mt-1 p-2.5 text-xs rounded-xl focus:bg-white outline-none font-bold text-slate-800"
                    >
                      <option value="">Aucun produit retail</option>
                      {products.filter(p => p.stock > 0).map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.price} DH, stock : {p.stock})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => { setShowCheckout(false); setCheckoutAppt(null); }}
                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 hover:bg-emerald-700 bg-emerald-600 text-white rounded-xl font-bold shadow-md flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Valider & Clôturer Ticket
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* ------------------------------------------------ */}
      {/* TICKET RECEIPT PRINT WINDOW */}
      {/* ------------------------------------------------ */}
      {showTicketModal && generatedTicket && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2.5xl border border-slate-200 relative print:p-0 font-sans">
            
            {/* Scissor / cut line simulated design */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-[radial-gradient(circle,transparent_20%,#f1f5f9_20%,#f1f5f9_40%,transparent_40%)] bg-[length:12px_12px]" />

            <div className="space-y-4 text-center pb-4 border-b border-dashed border-slate-200 mt-2">
              <div className="inline-block px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full">
                <span className="text-[9px] font-mono font-bold text-indigo-700 uppercase tracking-widest">Ticket Client Officiel</span>
              </div>
              <h3 className="font-extrabold text-slate-900 text-lg uppercase tracking-tight">{stats?.business?.name || 'VOTRE SALON BEAUTÉ'}</h3>
              <p className="text-[11px] text-slate-500 -mt-2 leading-relaxed">{stats?.business?.address || 'Maroc, Casablanca'}</p>
              <p className="text-[10px] text-slate-400 font-mono -mt-1">Tél: {stats?.business?.phone || '+212'}</p>
            </div>

            <div className="py-4 text-xs font-medium text-slate-700 space-y-2 border-b border-dashed border-slate-200">
              <div className="flex justify-between font-mono text-[10px] text-slate-400">
                <span>Date: {generatedTicket.payment?.created_at ? new Date(generatedTicket.payment.created_at).toLocaleDateString() : new Date().toLocaleDateString()}</span>
                <span>Ticket: #TKT-{generatedTicket.payment?.id || Math.floor(1000 + Math.random() * 9000)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-450 font-bold uppercase text-[9px]">Client :</span>
                <span className="font-bold text-slate-950">{generatedTicket.client?.name || 'Client Direct'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-450 font-bold uppercase text-[9px]">Collaborateur :</span>
                <span className="font-bold text-slate-900">{generatedTicket.staff?.name || 'Standard Staff'}</span>
              </div>
            </div>

            {/* Receipt invoice table */}
            <div className="py-4 text-xs space-y-3 border-b border-dashed border-slate-200">
              <div className="flex justify-between font-bold text-slate-500 uppercase text-[9px]">
                <span>Prestation de service</span>
                <span>Total</span>
              </div>
              <div className="flex justify-between items-start">
                <div className="pr-4">
                  <p className="font-bold text-slate-950">{generatedTicket.service?.name || generatedTicket.payment?.detail || 'Prestation Esthétique'}</p>
                  <span className="text-[10px] text-slate-500">Durée : {generatedTicket.service?.duration || '45'} minutes</span>
                </div>
                <span className="font-black text-slate-955 shrink-0">{generatedTicket.payment?.amount || generatedTicket.appointment?.total_price} DH</span>
              </div>
            </div>

            {generatedTicket.promotion && (
              <div className="mb-3 flex justify-between items-center text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100 text-[10px] font-bold font-sans">
                <span>🏷️ Coupon appliqué : {generatedTicket.promotion.code}</span>
                <span>
                  -{generatedTicket.promotion.discount_type === 'percent' 
                    ? `${generatedTicket.promotion.discount_value}%` 
                    : `${generatedTicket.promotion.discount_value} DH`}
                </span>
              </div>
            )}

            {generatedTicket.product && (
              <div className="mb-3 flex justify-between items-center text-indigo-700 bg-indigo-50 px-2.5 py-1.5 rounded-lg border border-indigo-100 text-[10px] font-bold font-sans">
                <span>🛍️ Produit retail : {generatedTicket.product.name}</span>
                <span>+{generatedTicket.product.price} DH</span>
              </div>
            )}

            {/* Receipt Summary block */}
            <div className="py-4 text-xs font-medium text-slate-700 space-y-1.5 bg-slate-50/75 p-3 rounded-xl border border-slate-100">
              <div className="flex justify-between">
                <span>Sous-total HT</span>
                <span className="font-bold text-slate-800">{(Number(generatedTicket.payment?.amount || generatedTicket.appointment?.total_price) * 0.8).toFixed(1)} DH</span>
              </div>
              <div className="flex justify-between">
                <span>TVA (20%)</span>
                <span className="font-bold text-slate-800">{(Number(generatedTicket.payment?.amount || generatedTicket.appointment?.total_price) * 0.2).toFixed(1)} DH</span>
              </div>
              <div className="flex justify-between border-t border-slate-200/50 pt-1.5 text-sm font-black text-slate-950">
                <span>NET ENCAISSÉ (TTC)</span>
                <span className="text-indigo-750 font-extrabold">{generatedTicket.payment?.amount || generatedTicket.appointment?.total_price} DH</span>
              </div>
              <div className="flex justify-between text-[10px] text-[#2563EB] font-bold uppercase pt-1 border-t border-dashed border-slate-200/50">
                <span>Mode acquittement :</span>
                <span>{generatedTicket.payment?.gateway === 'cash' ? '🔑 Espèces' : generatedTicket.payment?.gateway === 'gift_card' ? '🎁 Bon Cadeau' : '💳 Carte Bancaire'}</span>
              </div>
              {generatedTicket.gift_card && (
                <div className="mt-1 pb-1 pt-1 text-[9.5px] bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded text-indigo-700 space-y-0.5 font-bold">
                  <p className="flex justify-between">
                    <span>Code bon :</span>
                    <span>{generatedTicket.gift_card.code}</span>
                  </p>
                  <p className="flex justify-between text-indigo-900 border-t border-indigo-200/40 pt-1">
                    <span>Solde restant :</span>
                    <span>{generatedTicket.gift_card.remaining_amount} DH</span>
                  </p>
                </div>
              )}
            </div>

            <div className="pt-4 text-center space-y-3 print:hidden">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Imprimer Ticket
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(generatedTicket, null, 2))}`;
                    const downloadAnchor = document.createElement('a');
                    downloadAnchor.setAttribute('href', jsonString);
                    downloadAnchor.setAttribute('download', `ticket-${generatedTicket.payment?.id || 'manual'}.json`);
                    document.body.appendChild(downloadAnchor);
                    downloadAnchor.click();
                    downloadAnchor.remove();
                  }}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                  title="Télécharger Copie Facture"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => { setShowTicketModal(false); setGeneratedTicket(null); }}
                className="text-xs font-bold text-slate-550 hover:text-slate-900"
              >
                Fermer la caisse
              </button>
            </div>

            {/* Nice thermal barcode receipt footer simulation */}
            <div className="mt-6 pt-4 border-t border-slate-150 border-dotted text-center space-y-2">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Nidzak Partner Network</p>
              <div className="h-4 w-32 mx-auto bg-[repeating-linear-gradient(90deg,#000,#000_1px,#fff_1px,#fff_3px)] opacity-60" />
              <p className="text-[9px] text-slate-400 font-mono">Merci de votre confiance !</p>
            </div>

          </div>
        </div>
      )}

      {/* ------------------------------------------------ */}
      {/* ADD GIFT CARD MODAL */}
      {/* ------------------------------------------------ */}
      {showAddGiftCard && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-150 font-sans">
            <div className="flex justify-between items-center border-b pb-3 border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base">🎁 Émettre un nouveau Bon Cadeau</h3>
              <button onClick={() => setShowAddGiftCard(false)} className="text-slate-400 hover:text-slate-955 font-extrabold text-sm">X</button>
            </div>

            <form onSubmit={handleCreateGiftCard} className="space-y-4 text-xs font-medium">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Code unique du Bon</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    required
                    placeholder="Ex: GIF-394-ABCD"
                    value={giftCardForm.code}
                    onChange={(e) => setGiftCardForm({ ...giftCardForm, code: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs rounded-xl focus:bg-white outline-none font-mono font-bold uppercase select-all"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const randomCode = 'GIF-' + Math.floor(100 + Math.random() * 900) + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
                      setGiftCardForm({ ...giftCardForm, code: randomCode });
                    }}
                    className="py-2.5 px-3 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-700 text-xs rounded-xl font-bold transition-all"
                  >
                    Générer
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase font-sans">Nom du client bénéficiaire</label>
                <input
                  type="text"
                  required
                  placeholder="Yasmine Tazi"
                  value={giftCardForm.client_name}
                  onChange={(e) => setGiftCardForm({ ...giftCardForm, client_name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs rounded-xl mt-1 focus:bg-white outline-none font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase font-sans">Téléphone du bénéficiaire</label>
                <input
                  type="text"
                  placeholder="+212 601 234567"
                  value={giftCardForm.client_phone}
                  onChange={(e) => setGiftCardForm({ ...giftCardForm, client_phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs rounded-xl mt-1 focus:bg-white outline-none font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase font-sans">Montant initial en dirhams (DH)</label>
                <input
                  type="number"
                  required
                  min="50"
                  max="10000"
                  value={giftCardForm.initial_amount}
                  onChange={(e) => setGiftCardForm({ ...giftCardForm, initial_amount: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs rounded-xl mt-1 focus:bg-white outline-none font-mono font-black text-slate-800"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase font-sans">Date d'expiration (Optionnel)</label>
                <input
                  type="date"
                  value={giftCardForm.expires_at}
                  onChange={(e) => setGiftCardForm({ ...giftCardForm, expires_at: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs rounded-xl mt-1 focus:bg-white outline-none text-slate-850"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddGiftCard(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold font-sans"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-650 hover:bg-indigo-720 text-white rounded-xl font-bold shadow-md font-sans"
                >
                  Enregistrer & Activer le Bon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------ */}
      {/* ADD PRODUCT INVENTORY MODAL */}
      {/* ------------------------------------------------ */}
      {showAddProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-150 font-sans">
            <div className="flex justify-between items-center border-b pb-3 border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base">🛒 Ajouter un produit à l'inventaire</h3>
              <button onClick={() => setShowAddProduct(false)} className="text-slate-400 hover:text-slate-955 font-extrabold text-sm">X</button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs font-medium">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Nom du produit retail / vente</label>
                <input
                  type="text"
                  required
                  placeholder="Shampooing L'Oréal Absolut Repair 500ml"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs rounded-xl mt-1 focus:bg-white outline-none font-bold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">SKU / Code-barres</label>
                  <input
                    type="text"
                    required
                    placeholder="PROD-FA5A"
                    value={productForm.sku}
                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs rounded-xl mt-1 focus:bg-white outline-none font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Catégorie</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs rounded-xl mt-1 focus:bg-white outline-none font-bold text-slate-800"
                  >
                    <option value="Soins">Soins capillaires</option>
                    <option value="Maquillage">Maquillage & Onglerie</option>
                    <option value="Parfums">Parfums</option>
                    <option value="Visage">Soins Visage & Corps</option>
                    <option value="Général">Général / Autre</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Prix HT d'achat (Coût)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="50"
                    value={productForm.cost_price}
                    onChange={(e) => setProductForm({ ...productForm, cost_price: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs rounded-xl mt-1 focus:bg-white outline-none font-mono font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Prix TTC Public (Vente)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="120"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs rounded-xl mt-1 focus:bg-white outline-none font-mono font-bold text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Stock Initial (pcs)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="20"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs rounded-xl mt-1 focus:bg-white outline-none font-mono font-black text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Fournisseur</label>
                  <input
                    type="text"
                    placeholder="L'Oréal Pro Maroc"
                    value={productForm.supplier}
                    onChange={(e) => setProductForm({ ...productForm, supplier: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs rounded-xl mt-1 focus:bg-white outline-none font-bold text-slate-800"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddProduct(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold font-sans"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-650 hover:bg-indigo-720 text-white rounded-xl font-bold shadow-md font-sans"
                >
                  Ajouter au catalogue Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------ */}
      {/* EDIT PRODUCT INVENTORY MODAL */}
      {/* ------------------------------------------------ */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-150 font-sans">
            <div className="flex justify-between items-center border-b pb-3 border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base">🛒 Modifier le produit # {editingProduct.sku}</h3>
              <button onClick={() => setEditingProduct(null)} className="text-slate-400 hover:text-slate-955 font-extrabold text-sm">X</button>
            </div>

            <form onSubmit={handleUpdateProduct} className="space-y-4 text-xs font-medium">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Nom du produit retail / vente</label>
                <input
                  type="text"
                  required
                  placeholder="Shampooing L'Oréal Absolut Repair"
                  value={editProductForm.name}
                  onChange={(e) => setEditProductForm({ ...editProductForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs rounded-xl mt-1 focus:bg-white outline-none font-bold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">SKU / Code-barres</label>
                  <input
                    type="text"
                    required
                    placeholder="PROD-FA5A"
                    value={editProductForm.sku}
                    onChange={(e) => setEditProductForm({ ...editProductForm, sku: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs rounded-xl mt-1 focus:bg-white outline-none font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Catégorie</label>
                  <select
                    value={editProductForm.category}
                    onChange={(e) => setEditProductForm({ ...editProductForm, category: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs rounded-xl mt-1 focus:bg-white outline-none font-bold text-slate-800"
                  >
                    <option value="Soins">Soins capillaires</option>
                    <option value="Maquillage">Maquillage & Onglerie</option>
                    <option value="Parfums">Parfums</option>
                    <option value="Visage">Soins Visage & Corps</option>
                    <option value="Général">Général / Autre</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Prix HT d'achat (Coût)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="50"
                    value={editProductForm.cost_price}
                    onChange={(e) => setEditProductForm({ ...editProductForm, cost_price: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs rounded-xl mt-1 focus:bg-white outline-none font-mono font-bold text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Prix TTC Public (Vente)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="120"
                    value={editProductForm.price}
                    onChange={(e) => setEditProductForm({ ...editProductForm, price: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs rounded-xl mt-1 focus:bg-white outline-none font-mono font-bold text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Stock Disponible (pcs)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="10"
                    value={editProductForm.stock}
                    onChange={(e) => setEditProductForm({ ...editProductForm, stock: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs rounded-xl mt-1 focus:bg-white outline-none font-mono font-black text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Fournisseur</label>
                  <input
                    type="text"
                    placeholder="L'Oréal Pro Maroc"
                    value={editProductForm.supplier}
                    onChange={(e) => setEditProductForm({ ...editProductForm, supplier: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs rounded-xl mt-1 focus:bg-white outline-none font-bold text-slate-800"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold font-sans"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-650 hover:bg-indigo-720 text-white rounded-xl font-bold shadow-md font-sans"
                >
                  Enregistrer les modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------ */}
      {/* ADD PROMOTION MARKETING MODAL */}
      {/* ------------------------------------------------ */}
      {showAddPromotion && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-150 font-sans">
            <div className="flex justify-between items-center border-b pb-3 border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base">🏷️ Créer une Campagne de Promotion</h3>
              <button onClick={() => setShowAddPromotion(false)} className="text-slate-400 hover:text-slate-955 font-extrabold text-sm">X</button>
            </div>

            <form onSubmit={handleCreatePromotion} className="space-y-4 text-xs font-medium">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Nom de l'offre (Interne)</label>
                <input
                  type="text"
                  required
                  placeholder="Soldes d'été 20% sur Services"
                  value={promotionForm.name}
                  onChange={(e) => setPromotionForm({ ...promotionForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs rounded-xl mt-1 focus:bg-white outline-none font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">Code Promotionnel Unique (Coupon)</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    required
                    placeholder="Ex: ETE20"
                    value={promotionForm.code}
                    onChange={(e) => setPromotionForm({ ...promotionForm, code: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs rounded-xl focus:bg-white outline-none font-mono font-bold uppercase select-all"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const computedCode = 'PROMO' + Math.floor(10 + Math.random() * 90);
                      setPromotionForm({ ...promotionForm, code: computedCode });
                    }}
                    className="py-2.5 px-3 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-700 text-xs rounded-xl font-bold transition-all"
                  >
                    Auto-Générer
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Type de Réduction</label>
                  <select
                    value={promotionForm.discount_type}
                    onChange={(e) => setPromotionForm({ ...promotionForm, discount_type: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs rounded-xl mt-1 focus:bg-white outline-none font-bold text-slate-800"
                  >
                    <option value="percent">Pourcentage (%)</option>
                    <option value="value">Montant Fixe (DH)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Valeur de la Remise</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="20"
                    value={promotionForm.discount_value}
                    onChange={(e) => setPromotionForm({ ...promotionForm, discount_value: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs rounded-xl mt-1 focus:bg-white outline-none font-mono font-black text-[#1e293b]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase font-sans">Date de fin / d'expiration (Optionnel)</label>
                <input
                  type="date"
                  value={promotionForm.expires_at}
                  onChange={(e) => setPromotionForm({ ...promotionForm, expires_at: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs rounded-xl mt-1 focus:bg-white outline-none text-slate-800 font-bold"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddPromotion(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold font-sans"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-650 hover:bg-indigo-720 text-white rounded-xl font-bold shadow-md font-sans"
                >
                  Enregistrer & Activer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
