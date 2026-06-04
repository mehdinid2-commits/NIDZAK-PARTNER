/**
 * NIDZAK Partner / Booking SaaS - Backend REST API Server
 * Built with Express + Node.js
 * Multi-tenant data isolation, security filters, role-based controllers
 */

import express from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { loadDatabase, saveDatabase } from './src/lib/db';
import { User, Business, Subscription, Service, Staff, Client, Appointment, UserRoleName } from './src/types';

const app = express();
const PORT = 3000;

// Body parser
app.use(express.json());

// Log middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    // Basic request logging
    console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} (${Date.now() - start}ms)`);
  });
  next();
});

// Helper for security auditing
function logActivity(userId: number | null, action: string, entityName: string, entityId: number | null, req: express.Request) {
  const db = loadDatabase();
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  db.activity_logs.unshift({
    id: db.activity_logs.length + 1,
    user_id: userId,
    action,
    entity_name: entityName,
    entity_id: entityId,
    ip_address: String(ip),
    created_at: new Date().toISOString()
  });
  saveDatabase();
}

// ----------------------------------------------------
// AUTHENTICATION API ENDPOINTS
// ----------------------------------------------------

// POST /api/auth/login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'E-mail et mot de passe requis.' });
  }

  const db = loadDatabase();
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    return res.status(401).json({ error: 'Adresse e-mail ou mot de passe incorrect.' });
  }

  // Simulation parameters (accept standard password formats)
  const role = db.roles.find(r => r.id === user.role_id);
  const business = user.business_id ? db.businesses.find(b => b.id === user.business_id) : null;
  const subscription = user.business_id ? db.subscriptions.find(s => s.business_id === user.business_id) : null;

  // Track logins
  logActivity(user.id, 'user_login', 'users', user.id, req);

  // Generate bearer session token: user-id:<id>:role:<role>:tenant:<tenant>
  const token = `nidzak_sess_user:${user.id}:role_id:${user.role_id}:business_id:${user.business_id || 'null'}`;

  return res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      photo: user.photo,
      role_id: user.role_id,
      business_id: user.business_id
    },
    token,
    role: role?.name,
    business,
    subscription
  });
});

// POST /api/auth/register
app.post('/api/auth/register', (req, res) => {
  const {
    name, email, password, phone,
    businessName, businessCategory, businessAddress, businessPhone
  } = req.body;

  if (!name || !email || !password || !businessName || !businessCategory || !businessAddress) {
    return res.status(400).json({ error: 'Veuillez remplir tous les champs obligatoires.' });
  }

  const db = loadDatabase();
  const existingUser = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    return res.status(400).json({ error: 'Un compte avec cette adresse e-mail existe déjà.' });
  }

  // 1. Create Business
  const businessId = db.businesses.length + 1;
  const slug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + businessId;
  const newBusiness: Business = {
    id: businessId,
    name: businessName,
    slug,
    logo: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=150',
    cover_image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800',
    description: `Bienvenue chez ${businessName}. Spécialiste de notre domaine.`,
    email,
    phone: businessPhone || phone || '',
    address: businessAddress,
    category_id: parseInt(businessCategory) || 3,
    status: 'active', // default active or pending, active to make demo direct
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  db.businesses.push(newBusiness);

  // 2. Setup business default settings
  db.business_settings.push({
    id: db.business_settings.length + 1,
    business_id: businessId,
    currency: 'MAD',
    timezone: 'Africa/Casablanca',
    language: 'fr'
  });

  // 3. Create Business Owner User
  const userId = db.users.length + 1;
  const newUser: User = {
    id: userId,
    role_id: 2, // BUSINESS_OWNER
    business_id: businessId,
    name,
    email,
    phone,
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  db.users.push(newUser);

  // 4. Create Main Branch
  const branchId = db.branches.length + 1;
  db.branches.push({
    id: branchId,
    business_id: businessId,
    name: `${businessName} - Principal`,
    address: businessAddress,
    phone: businessPhone || phone || '',
    email,
    is_main: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  // 5. Assign Free Trial Subscription Plan (Plan id = 1)
  const subId = db.subscriptions.length + 1;
  const starDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 14); // 14-days Free Trial
  db.subscriptions.push({
    id: subId,
    business_id: businessId,
    plan_id: 1,
    status: 'trialing',
    start_date: starDate.toISOString().slice(0, 10),
    end_date: endDate.toISOString().slice(0, 10),
    trial_ends_at: endDate.toISOString().slice(0, 10),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  // 6. Create default Working Hours (Monday to Saturday, closed Sunday)
  for (let i = 1; i <= 6; i++) {
    db.working_hours.push({
      id: db.working_hours.length + 1,
      business_id: businessId,
      staff_id: null,
      day_of_week: i,
      start_time: '09:00',
      end_time: '19:00',
      is_closed: false
    });
  }
  db.working_hours.push({
    id: db.working_hours.length + 1,
    business_id: businessId,
    staff_id: null,
    day_of_week: 0,
    start_time: '00:00',
    end_time: '00:00',
    is_closed: true
  });

  // Create primary default staff member from owner details
  const staffId = db.staff.length + 1;
  db.staff.push({
    id: staffId,
    business_id: businessId,
    branch_id: branchId,
    user_id: userId,
    name,
    email,
    phone,
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    bio: 'Fondateur & Praticien principal',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  // Create a default first service
  const serviceId = db.services.length + 1;
  db.services.push({
    id: serviceId,
    business_id: businessId,
    name: 'Soin de Bienvenue Signature',
    description: 'Premier soin de démonstration personnalisé pour initier votre activité avec NIDZAK Partner.',
    price: 150.00,
    duration: 30,
    category_id: parseInt(businessCategory) || 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  // link staff to service
  db.staff_services.push({ staff_id: staffId, service_id: serviceId });

  // Save changes
  saveDatabase();

  logActivity(userId, 'business_register', 'businesses', businessId, req);

  const token = `nidzak_sess_user:${userId}:role_id:2:business_id:${businessId}`;

  return res.json({
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      photo: newUser.photo,
      role_id: newUser.role_id,
      business_id: newUser.business_id
    },
    token,
    role: 'business_owner',
    business: newBusiness,
    subscription: db.subscriptions.find(s => s.id === subId)
  });
});

app.post('/api/auth/firebase-sync', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email requis pour la synchronisation.' });
  }

  const db = loadDatabase();
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    return res.status(404).json({ error: 'Utilisateur introuvable dans la base locale.' });
  }

  const role = db.roles.find(r => r.id === user.role_id);
  const business = user.business_id ? db.businesses.find(b => b.id === user.business_id) : null;
  const subscription = user.business_id ? db.subscriptions.find(s => s.business_id === user.business_id) : null;

  // Generate bearer session token: user-id:<id>:role:<role>:tenant:<tenant>
  const token = `nidzak_sess_user:${user.id}:role_id:${user.role_id}:business_id:${user.business_id || 'null'}`;

  return res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      photo: user.photo,
      role_id: user.role_id,
      business_id: user.business_id
    },
    token,
    role: role?.name,
    business,
    subscription
  });
});


// ----------------------------------------------------
// MIDDLEWARE TO SIMULATE ROLE-BASED DATA ACCESS SECURITY
// ----------------------------------------------------
// In production, this verifies JWT tokens. Here we decode bearer headers securely.
function checkAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Accès non autorisé.' });
  }

  const token = authHeader.split(' ')[1];
  const parts = token.split(':');
  if (parts.length < 6 || parts[0] !== 'nidzak_sess_user') {
    return res.status(401).json({ error: 'Token de session invalide.' });
  }

  // Deconstruct token variables
  const userId = parseInt(parts[1]);
  const roleId = parseInt(parts[3]);
  const businessIdPart = parts[5];
  const businessId = businessIdPart === 'null' ? null : parseInt(businessIdPart);

  // Bind session context onto express request safely
  (req as any).userSession = {
    userId,
    role_id: roleId,
    business_id: businessId
  };

  next();
}

function checkSuperAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const session = (req as any).userSession;
  if (!session || session.role_id !== 1) { // 1 = Super Admin
    return res.status(430).json({ error: 'Droits Super Administrateur requis.' });
  }
  next();
}


// ----------------------------------------------------
// SUPER ADMIN DASHBOARD CONTROLLER APIS
// ----------------------------------------------------

// GET /api/admin/stats
app.get('/api/admin/stats', checkAuth, checkSuperAdmin, (req, res) => {
  const db = loadDatabase();
  const totalBusinesses = db.businesses.length;
  const totalUsers = db.users.length;
  const activeSubs = db.subscriptions.filter(s => s.status === 'active' || s.status === 'trialing').length;
  const totalRevenue = db.payments.reduce((acc, p) => acc + (p.status === 'completed' ? p.amount : 0), 0);
  const totalAppointments = db.appointments.length;

  res.json({
    totalBusinesses,
    totalUsers,
    activeSubs,
    totalRevenue,
    totalAppointments,
    monthlyRevenue: [
      { month: 'Jan', revenue: 12000 },
      { month: 'Fév', revenue: 18000 },
      { month: 'Mar', revenue: 15400 },
      { month: 'Avr', revenue: 22000 },
      { month: 'Mai', revenue: 29000 },
      { month: 'Juin', revenue: totalRevenue }
    ],
    recentBusinesses: db.businesses.slice(-5).reverse(),
    recentPayments: db.payments.slice(-5).reverse().map(p => {
      const bus = db.businesses.find(b => b.id === p.business_id);
      return { ...p, business_name: bus?.name || 'SaaS Platform Tier' };
    })
  });
});

// GET /api/admin/businesses
app.get('/api/admin/businesses', checkAuth, checkSuperAdmin, (req, res) => {
  const db = loadDatabase();
  const list = db.businesses.map(b => {
    const sub = db.subscriptions.find(s => s.business_id === b.id);
    const plan = sub ? db.subscription_plans.find(p => p.id === sub.plan_id) : null;
    const users = db.users.filter(u => u.business_id === b.id);
    const appts = db.appointments.filter(a => a.business_id === b.id).length;
    return {
      ...b,
      plan_name: plan?.name || 'Aucun',
      subscription_status: sub?.status || 'expired',
      renewal_date: sub?.end_date || '',
      staff_count: db.staff.filter(s => s.business_id === b.id).length,
      appointments_count: appts,
      users_count: users.length
    };
  });
  res.json(list);
});

// PUT /api/admin/businesses/:id/status
app.put('/api/admin/businesses/:id/status', checkAuth, checkSuperAdmin, (req, res) => {
  const id = parseInt(req.params.id);
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'Statut requis.' });

  const db = loadDatabase();
  const b = db.businesses.find(item => item.id === id);
  if (!b) return res.status(404).json({ error: 'Business introuvable.' });

  b.status = status;
  b.updated_at = new Date().toISOString();
  saveDatabase();

  logActivity((req as any).userSession.userId, `business_status_change_${status}`, 'businesses', id, req);
  res.json({ success: true, business: b });
});

// DELETE /api/admin/businesses/:id
app.delete('/api/admin/businesses/:id', checkAuth, checkSuperAdmin, (req, res) => {
  const id = parseInt(req.params.id);
  const db = loadDatabase();
  const index = db.businesses.findIndex(b => b.id === id);
  if (index === -1) return res.status(404).json({ error: 'Business introuvable.' });

  // Delete business and associated sub schemas
  db.businesses.splice(index, 1);
  db.users = db.users.filter(u => u.business_id !== id);
  db.appointments = db.appointments.filter(a => a.business_id !== id);
  db.staff = db.staff.filter(s => s.business_id !== id);
  db.services = db.services.filter(s => s.business_id !== id);

  saveDatabase();
  logActivity((req as any).userSession.userId, 'business_delete', 'businesses', id, req);
  res.json({ success: true });
});

// GET /api/admin/users
app.get('/api/admin/users', checkAuth, checkSuperAdmin, (req, res) => {
  const db = loadDatabase();
  const list = db.users.map(u => {
    const r = db.roles.find(role => role.id === u.role_id);
    const b = u.business_id ? db.businesses.find(bus => bus.id === u.business_id) : null;
    return {
      ...u,
      role_name: r?.name || 'unknown',
      business_name: b?.name || 'SaaS Platform Admin'
    };
  });
  res.json(list);
});

// PUT /api/admin/users/:id
app.put('/api/admin/users/:id', checkAuth, checkSuperAdmin, (req, res) => {
  const id = parseInt(req.params.id);
  const { name, phone, role_id } = req.body;

  const db = loadDatabase();
  const user = db.users.find(u => u.id === id);
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });

  if (name) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (role_id) user.role_id = parseInt(role_id);
  user.updated_at = new Date().toISOString();

  saveDatabase();
  logActivity((req as any).userSession.userId, 'user_update', 'users', id, req);
  res.json({ success: true, user });
});

// DELETE /api/admin/users/:id
app.delete('/api/admin/users/:id', checkAuth, checkSuperAdmin, (req, res) => {
  const id = parseInt(req.params.id);
  const db = loadDatabase();
  const index = db.users.findIndex(u => u.id === id);
  if (index === -1) return res.status(404).json({ error: 'Utilisateur introuvable.' });
  if (id === 1) return res.status(400).json({ error: 'Impossible de supprimer le Super Admin principal.' });

  db.users.splice(index, 1);
  saveDatabase();
  logActivity((req as any).userSession.userId, 'user_delete', 'users', id, req);
  res.json({ success: true });
});


// GET /api/admin/plans
app.get('/api/admin/plans', (req, res) => {
  const db = loadDatabase();
  res.json(db.subscription_plans);
});

// PUT /api/admin/plans/:id
app.put('/api/admin/plans/:id', checkAuth, checkSuperAdmin, (req, res) => {
  const id = parseInt(req.params.id);
  const { name, price, staff_limit, appointment_limit, branch_limit, reports_access, marketing_access } = req.body;

  const db = loadDatabase();
  const plan = db.subscription_plans.find(p => p.id === id);
  if (!plan) return res.status(404).json({ error: 'Plan introuvable.' });

  if (name) plan.name = name;
  if (price !== undefined) plan.price = parseFloat(price);
  if (staff_limit !== undefined) plan.staff_limit = parseInt(staff_limit);
  if (appointment_limit !== undefined) plan.appointment_limit = parseInt(appointment_limit);
  if (branch_limit !== undefined) plan.branch_limit = parseInt(branch_limit);
  if (reports_access !== undefined) plan.reports_access = !!reports_access;
  if (marketing_access !== undefined) plan.marketing_access = !!marketing_access;

  saveDatabase();
  logActivity((req as any).userSession.userId, 'plan_update', 'subscription_plans', id, req);
  res.json({ success: true, plan });
});


// GET /api/admin/payments
app.get('/api/admin/payments', checkAuth, checkSuperAdmin, (req, res) => {
  const db = loadDatabase();
  const list = db.payments.map(p => {
    const b = db.businesses.find(bus => bus.id === p.business_id);
    return {
      ...p,
      business_name: b?.name || 'Plateforme'
    };
  });
  res.json(list);
});

// GET /api/admin/invoices
app.get('/api/admin/invoices', checkAuth, checkSuperAdmin, (req, res) => {
  const db = loadDatabase();
  const list = db.invoices.map(i => {
    const b = db.businesses.find(bus => bus.id === i.business_id);
    return {
      ...i,
      business_name: b?.name || 'Plateforme'
    };
  });
  res.json(list);
});

// GET /api/admin/logs
app.get('/api/admin/logs', checkAuth, checkSuperAdmin, (req, res) => {
  const db = loadDatabase();
  const list = db.activity_logs.slice(0, 100).map(l => {
    const u = db.users.find(user => user.id === l.user_id);
    return {
      ...l,
      user_name: u?.name || 'Système/Visiteur'
    };
  });
  res.json(list);
});

// GET /api/admin/tickets
app.get('/api/admin/tickets', checkAuth, checkSuperAdmin, (req, res) => {
  const db = loadDatabase();
  res.json(db.support_tickets.map(t => {
    const u = db.users.find(user => user.id === t.user_id);
    const b = t.business_id ? db.businesses.find(bus => bus.id === t.business_id) : null;
    return { ...t, user_name: u?.name || 'Inconnu', business_name: b?.name || 'SaaS' };
  }));
});

// PUT /api/admin/tickets/:id
app.put('/api/admin/tickets/:id', checkAuth, checkSuperAdmin, (req, res) => {
  const id = parseInt(req.params.id);
  const { status } = req.body;
  const db = loadDatabase();
  const ticket = db.support_tickets.find(t => t.id === id);
  if (!ticket) return res.status(404).json({ error: 'Ticket introuvable.' });

  ticket.status = status;
  ticket.updated_at = new Date().toISOString();
  saveDatabase();
  res.json({ success: true, ticket });
});


// ----------------------------------------------------
// MULTI-TENANT BUSINESS AREA CONTROLLER APIS
// ----------------------------------------------------

// Business Data Isolation Helper
function verifyTenant(req: express.Request, res: express.Response, next: express.NextFunction) {
  const session = (req as any).userSession;
  const requestedBusinessId = parseInt(req.params.businessId);

  if (!session) {
    return res.status(401).json({ error: 'Non authentifié.' });
  }

  // Super Admin of SaaS has access to bypass tenant filters
  if (session.role_id === 1) {
    next();
    return;
  }

  // Business Owner, Staff isolation filter check
  if (session.business_id !== requestedBusinessId) {
    return res.status(403).json({ error: 'Accès interdit : données locataires isolées.' });
  }
  next();
}

// GET /api/business/:businessId/stats
app.get('/api/business/:businessId/stats', checkAuth, verifyTenant, (req, res) => {
  const bId = parseInt(req.params.businessId);
  const db = loadDatabase();

  const business = db.businesses.find(x => x.id === bId);
  if (!business) return res.status(404).json({ error: 'Business introuvable.' });

  const appointments = db.appointments.filter(a => a.business_id === bId);
  const completed = appointments.filter(a => a.status_id === 3); // 3 = completed
  const revenue = completed.reduce((sum, a) => sum + a.total_price, 0);

  const clientsCount = db.clients.filter(c => c.business_id === bId).length;
  const staffCount = db.staff.filter(s => s.business_id === bId).length;
  const servicesCount = db.services.filter(s => s.business_id === bId).length;

  // staff booking frequency details
  const staffStats = db.staff.filter(s => s.business_id === bId).map(staffUnit => {
    const count = appointments.filter(a => a.staff_id === staffUnit.id).length;
    const rev = appointments.filter(a => a.staff_id === staffUnit.id && a.status_id === 3).reduce((sum, a) => sum + a.total_price, 0);
    return {
      name: staffUnit.name,
      appointments: count,
      revenue: rev
    };
  });

  // Services analytics
  const serviceStats = db.services.filter(s => s.business_id === bId).map(serv => {
    const list = appointments.filter(a => a.service_id === serv.id);
    return {
      name: serv.name,
      count: list.length,
      revenue: list.reduce((sum, a) => sum + a.total_price, 0)
    };
  }).sort((a, b) => b.count - a.count).slice(0, 5);

  const sub = db.subscriptions.find(s => s.business_id === bId);
  const plan = sub ? db.subscription_plans.find(p => p.id === sub.plan_id) : null;

  const setting = db.business_settings.find(s => s.business_id === bId) || null;

  // Filter business payments and gift cards
  const payments = db.payments ? db.payments.filter(p => p.business_id === bId) : [];
  const giftCards = db.gift_cards ? db.gift_cards.filter(g => g.business_id === bId) : [];

  // Group payments by gateway (payment methods)
  const paymentMethodsStats = {
    cash: payments.filter(p => p.gateway === 'cash').reduce((sum, p) => sum + p.amount, 0),
    card: payments.filter(p => p.gateway === 'card' || p.gateway === 'stripe').reduce((sum, p) => sum + p.amount, 0),
    transfer: payments.filter(p => p.gateway === 'transfer' || p.gateway === 'paypal').reduce((sum, p) => sum + p.amount, 0),
    gift_card: payments.filter(p => p.gateway === 'gift_card').reduce((sum, p) => sum + p.amount, 0),
  };

  // Hydrated payments list with client names
  const hydratedPayments = payments.map(p => {
    let clientName = 'Plateforme (SaaS Subscription)';
    let detail = 'Abonnement mensuel';
    if (p.appointment_id) {
      const app = db.appointments.find(a => a.id === p.appointment_id);
      if (app) {
        const cli = db.clients.find(c => c.id === app.client_id);
        const srv = db.services.find(s => s.id === app.service_id);
        if (cli) clientName = cli.name;
        if (srv) detail = srv.name;
      }
    }
    return {
      ...p,
      clientName,
      detail
    };
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  res.json({
    business,
    totalAppointments: appointments.length,
    revenue,
    clientsCount,
    staffCount,
    servicesCount,
    staffStats,
    serviceStats,
    sub,
    plan,
    setting,
    giftCards,
    paymentMethodsStats,
    payments: hydratedPayments,
    statusReport: {
      pending: appointments.filter(a => a.status_id === 1).length,
      confirmed: appointments.filter(a => a.status_id === 2).length,
      completed: completed.length,
      cancelled: appointments.filter(a => a.status_id === 4).length
    }
  });
});

// PUT /api/business/:businessId
app.put('/api/business/:businessId', checkAuth, verifyTenant, (req, res) => {
  const bId = parseInt(req.params.businessId);
  const db = loadDatabase();

  const business = db.businesses.find(x => x.id === bId);
  if (!business) return res.status(404).json({ error: 'Établissement introuvable.' });

  const { name, phone, address, description, logo, email, currency, timezone } = req.body;

  // Update business profile details
  if (name !== undefined) business.name = name;
  if (phone !== undefined) business.phone = phone;
  if (address !== undefined) business.address = address;
  if (description !== undefined) business.description = description;
  if (logo !== undefined) business.logo = logo;
  if (email !== undefined) business.email = email;
  business.updated_at = new Date().toISOString();

  // Update settings
  let setting = db.business_settings.find(s => s.business_id === bId);
  if (!setting) {
    setting = {
      id: db.business_settings.length + 1,
      business_id: bId,
      currency: 'MAD',
      timezone: 'Africa/Casablanca',
      language: 'fr'
    };
    db.business_settings.push(setting);
  }

  if (currency !== undefined) setting.currency = currency;
  if (timezone !== undefined) setting.timezone = timezone;

  saveDatabase();
  res.json({ message: 'Paramètres modifiés avec succès.', business, setting });
});

// GET /api/business/:businessId/appointments
app.get('/api/business/:businessId/appointments', checkAuth, verifyTenant, (req, res) => {
  const bId = parseInt(req.params.businessId);
  const db = loadDatabase();
  const list = db.appointments.filter(a => a.business_id === bId);

  // Hydrate lists with descriptive details
  const hydrated = list.map(a => {
    const c = db.clients.find(cli => cli.id === a.client_id);
    const s = db.staff.find(stf => stf.id === a.staff_id);
    const srv = db.services.find(se => se.id === a.service_id);
    const st = db.appointment_status.find(stat => stat.id === a.status_id);
    return {
      ...a,
      client_name: c?.name || 'Inconnu',
      client_phone: c?.phone || '',
      client_email: c?.email || '',
      staff_name: s?.name || 'Non assigné',
      service_name: srv?.name || 'N/A',
      status_label: st?.label_fr || 'Inconnu',
      status_color: st?.color || 'gray'
    };
  });
  res.json(hydrated);
});

// POST /api/business/:businessId/appointments
app.post('/api/business/:businessId/appointments', checkAuth, verifyTenant, (req, res) => {
  const bId = parseInt(req.params.businessId);
  const { client_id, staff_id, service_id, date, start_time, notes, status_id } = req.body;

  if (!client_id || !staff_id || !service_id || !date || !start_time) {
    return res.status(400).json({ error: 'Paramètres d\'inscription de rendez-vous manquants.' });
  }

  const db = loadDatabase();

  // Compute duration & total price
  const service = db.services.find(s => s.id === parseInt(service_id));
  if (!service) return res.status(404).json({ error: 'Service introuvable.' });

  // Calculate start / end times
  const dur = service.duration;
  const [h, m] = start_time.split(':').map(Number);
  const totalMins = h * 60 + m + dur;
  const endH = Math.floor(totalMins / 60) % 24;
  const endM = totalMins % 60;
  const end_time = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

  const apptId = db.appointments.length + 1;
  const newAppt: Appointment = {
    id: apptId,
    business_id: bId,
    branch_id: 1, // default branch
    client_id: parseInt(client_id),
    staff_id: parseInt(staff_id),
    service_id: parseInt(service_id),
    date,
    start_time,
    end_time,
    total_price: service.price,
    status_id: parseInt(status_id) || 1, // Default pending
    notes,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  db.appointments.push(newAppt);
  saveDatabase();

  logActivity((req as any).userSession.userId, 'appointment_create', 'appointments', apptId, req);
  res.json({ success: true, appointment: newAppt });
});

// PUT /api/business/:businessId/appointments/:id
app.put('/api/business/:businessId/appointments/:id', checkAuth, verifyTenant, (req, res) => {
  const bId = parseInt(req.params.businessId);
  const apptId = parseInt(req.params.id);
  const { staff_id, date, start_time, status_id, notes } = req.body;

  const db = loadDatabase();
  const appt = db.appointments.find(a => a.id === apptId && a.business_id === bId);
  if (!appt) return res.status(404).json({ error: 'Rendez-vous introuvable.' });

  if (staff_id) appt.staff_id = parseInt(staff_id);
  if (date) appt.date = date;
  if (start_time) {
    appt.start_time = start_time;
    // recalculate endTime based on service
    const service = db.services.find(s => s.id === appt.service_id);
    if (service) {
      const dur = service.duration;
      const [h, m] = start_time.split(':').map(Number);
      const totalMins = h * 60 + m + dur;
      const endH = Math.floor(totalMins / 60) % 24;
      const endM = totalMins % 60;
      appt.end_time = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
    }
  }
  if (status_id !== undefined) appt.status_id = parseInt(status_id);
  if (notes !== undefined) appt.notes = notes;
  appt.updated_at = new Date().toISOString();

  // Create payment if completed and cash
  if (parseInt(status_id) === 3) {
    const paymentExists = db.payments.some(p => p.appointment_id === apptId);
    if (!paymentExists) {
      db.payments.push({
        id: db.payments.length + 1,
        business_id: bId,
        appointment_id: apptId,
        subscription_id: null,
        amount: appt.total_price,
        status: 'completed',
        gateway: 'cash',
        created_at: new Date().toISOString()
      });
    }
  }

  saveDatabase();
  logActivity((req as any).userSession.userId, 'appointment_update', 'appointments', apptId, req);
  res.json({ success: true, appointment: appt });
});

// DELETE /api/business/:businessId/appointments/:id
app.delete('/api/business/:businessId/appointments/:id', checkAuth, verifyTenant, (req, res) => {
  const bId = parseInt(req.params.businessId);
  const apptId = parseInt(req.params.id);

  const db = loadDatabase();
  const index = db.appointments.findIndex(a => a.id === apptId && a.business_id === bId);
  if (index === -1) return res.status(404).json({ error: 'Rendez-vous introuvable.' });

  db.appointments.splice(index, 1);
  saveDatabase();

  logActivity((req as any).userSession.userId, 'appointment_delete', 'appointments', apptId, req);
  res.json({ success: true });
});


// ----------------------------------------------------
// MULTI-TENANT SERVICES isolated endpoints
// ----------------------------------------------------
app.get('/api/business/:businessId/services', (req, res) => {
  const bId = parseInt(req.params.businessId);
  const db = loadDatabase();
  res.json(db.services.filter(s => s.business_id === bId));
});

app.post('/api/business/:businessId/services', checkAuth, verifyTenant, (req, res) => {
  const bId = parseInt(req.params.businessId);
  const { name, description, price, duration, category_id } = req.body;

  if (!name || !price || !duration || !category_id) {
    return res.status(400).json({ error: 'Champs obligatoires manquants.' });
  }

  const db = loadDatabase();
  const id = db.services.length + 1;
  const srv: Service = {
    id,
    business_id: bId,
    name,
    description: description || '',
    price: parseFloat(price),
    duration: parseInt(duration),
    category_id: parseInt(category_id),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  db.services.push(srv);
  saveDatabase();

  res.json({ success: true, service: srv });
});

app.put('/api/business/:businessId/services/:id', checkAuth, verifyTenant, (req, res) => {
  const bId = parseInt(req.params.businessId);
  const id = parseInt(req.params.id);
  const { name, description, price, duration, category_id } = req.body;

  const db = loadDatabase();
  const srv = db.services.find(s => s.id === id && s.business_id === bId);
  if (!srv) return res.status(404).json({ error: 'Service introuvable.' });

  if (name) srv.name = name;
  if (description !== undefined) srv.description = description;
  if (price !== undefined) srv.price = parseFloat(price);
  if (duration !== undefined) srv.duration = parseInt(duration);
  if (category_id !== undefined) srv.category_id = parseInt(category_id);
  srv.updated_at = new Date().toISOString();

  saveDatabase();
  res.json({ success: true, service: srv });
});

app.delete('/api/business/:businessId/services/:id', checkAuth, verifyTenant, (req, res) => {
  const bId = parseInt(req.params.businessId);
  const id = parseInt(req.params.id);

  const db = loadDatabase();
  const index = db.services.findIndex(s => s.id === id && s.business_id === bId);
  if (index === -1) return res.status(404).json({ error: 'Service introuvable.' });

  db.services.splice(index, 1);
  saveDatabase();
  res.json({ success: true });
});


// ----------------------------------------------------
// MULTI-TENANT STAFF isolated endpoints
// ----------------------------------------------------
app.get('/api/business/:businessId/staff', (req, res) => {
  const bId = parseInt(req.params.businessId);
  const db = loadDatabase();
  res.json(db.staff.filter(s => s.business_id === bId));
});

app.post('/api/business/:businessId/staff', checkAuth, verifyTenant, (req, res) => {
  const bId = parseInt(req.params.businessId);
  const { name, email, phone, bio } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Nom et e-mail requis.' });
  }

  const db = loadDatabase();

  const id = db.staff.length + 1;
  const listStaff: Staff = {
    id,
    business_id: bId,
    branch_id: 1, // default branch
    user_id: null,
    name,
    email,
    phone: phone || '',
    photo: `https://images.unsplash.com/photo-${1500000000000 + id}?w=150` || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    bio: bio || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  db.staff.push(listStaff);
  saveDatabase();

  res.json({ success: true, staff: listStaff });
});

app.put('/api/business/:businessId/staff/:id', checkAuth, verifyTenant, (req, res) => {
  const bId = parseInt(req.params.businessId);
  const id = parseInt(req.params.id);
  const { name, email, phone, bio } = req.body;

  const db = loadDatabase();
  const item = db.staff.find(s => s.id === id && s.business_id === bId);
  if (!item) return res.status(404).json({ error: 'Employé introuvable.' });

  if (name) item.name = name;
  if (email) item.email = email;
  if (phone !== undefined) item.phone = phone;
  if (bio !== undefined) item.bio = bio;
  item.updated_at = new Date().toISOString();

  saveDatabase();
  res.json({ success: true, staff: item });
});

app.delete('/api/business/:businessId/staff/:id', checkAuth, verifyTenant, (req, res) => {
  const bId = parseInt(req.params.businessId);
  const id = parseInt(req.params.id);

  const db = loadDatabase();
  const index = db.staff.findIndex(s => s.id === id && s.business_id === bId);
  if (index === -1) return res.status(404).json({ error: 'Employé introuvable.' });

  db.staff.splice(index, 1);
  saveDatabase();
  res.json({ success: true });
});


// ----------------------------------------------------
// MULTI-TENANT GIFT CARDS endpoints
// ----------------------------------------------------
app.get('/api/business/:businessId/gift-cards', checkAuth, verifyTenant, (req, res) => {
  const bId = parseInt(req.params.businessId);
  const db = loadDatabase();
  const list = db.gift_cards ? db.gift_cards.filter(g => g.business_id === bId) : [];
  res.json(list);
});

app.post('/api/business/:businessId/gift-cards', checkAuth, verifyTenant, (req, res) => {
  const bId = parseInt(req.params.businessId);
  const { code, initial_amount, client_name, client_phone, expires_at } = req.body;

  if (!code || !initial_amount || !client_name) {
    return res.status(400).json({ error: 'Code, montant et nom du bénéficiaire requis.' });
  }

  const db = loadDatabase();
  if (!db.gift_cards) db.gift_cards = [];

  const existing = db.gift_cards.find(g => g.business_id === bId && g.code.toUpperCase() === code.toUpperCase());
  if (existing) {
    return res.status(400).json({ error: 'Un bon cadeau avec ce code existe déjà.' });
  }

  const newGc: any = {
    id: db.gift_cards.length + 1,
    business_id: bId,
    code: code.toUpperCase(),
    initial_amount: Number(initial_amount),
    remaining_amount: Number(initial_amount),
    client_name,
    client_phone: client_phone || '',
    status: 'active',
    created_at: new Date().toISOString(),
    expires_at: expires_at || undefined
  };

  db.gift_cards.push(newGc);
  saveDatabase();
  res.json({ success: true, gift_card: newGc });
});


// ----------------------------------------------------
// MULTI-TENANT PRODUCTS (INVENTORY) endpoints
// ----------------------------------------------------
app.get('/api/business/:businessId/products', checkAuth, verifyTenant, (req, res) => {
  const bId = parseInt(req.params.businessId);
  const db = loadDatabase();
  if (!db.products) db.products = [];
  const list = db.products.filter(p => p.business_id === bId);
  res.json(list);
});

app.post('/api/business/:businessId/products', checkAuth, verifyTenant, (req, res) => {
  const bId = parseInt(req.params.businessId);
  const { name, sku, price, cost_price, stock, category, supplier } = req.body;

  if (!name || isNaN(Number(price))) {
    return res.status(400).json({ error: 'Nom et prix valides sont requis.' });
  }

  const db = loadDatabase();
  if (!db.products) db.products = [];

  const newProduct = {
    id: db.products.length + 1,
    business_id: bId,
    name,
    sku: sku || `PROD-${Math.random().toString(36).substring(2,6).toUpperCase()}`,
    price: Number(price),
    cost_price: Number(cost_price || 0),
    stock: Number(stock || 0),
    category: category || 'Général',
    supplier: supplier || ''
  };

  db.products.push(newProduct);
  saveDatabase();
  res.json({ success: true, product: newProduct });
});

app.put('/api/business/:businessId/products/:id', checkAuth, verifyTenant, (req, res) => {
  const bId = parseInt(req.params.businessId);
  const id = parseInt(req.params.id);
  const { name, sku, price, cost_price, stock, category, supplier } = req.body;

  if (!name || isNaN(Number(price))) {
    return res.status(400).json({ error: 'Nom et prix valides sont requis.' });
  }

  const db = loadDatabase();
  if (!db.products) db.products = [];

  const prod = db.products.find(p => p.id === id && p.business_id === bId);
  if (!prod) {
    return res.status(404).json({ error: 'Produit introuvable.' });
  }

  prod.name = name;
  prod.sku = sku || prod.sku;
  prod.price = Number(price);
  prod.cost_price = Number(cost_price || 0);
  prod.stock = Number(stock || 0);
  prod.category = category || 'Général';
  prod.supplier = supplier || '';

  saveDatabase();
  res.json({ success: true, product: prod });
});

app.delete('/api/business/:businessId/products/:id', checkAuth, verifyTenant, (req, res) => {
  const bId = parseInt(req.params.businessId);
  const id = parseInt(req.params.id);
  const db = loadDatabase();
  if (!db.products) db.products = [];
  
  const initialLength = db.products.length;
  db.products = db.products.filter(p => !(p.id === id && p.business_id === bId));
  
  if (db.products.length === initialLength) {
    return res.status(404).json({ error: 'Produit introuvable.' });
  }
  
  saveDatabase();
  res.json({ success: true });
});

// ----------------------------------------------------
// MULTI-TENANT PROMOTIONS (MARKETING) endpoints
// ----------------------------------------------------
app.get('/api/business/:businessId/promotions', checkAuth, verifyTenant, (req, res) => {
  const bId = parseInt(req.params.businessId);
  const db = loadDatabase();
  if (!db.promotions) db.promotions = [];
  const list = db.promotions.filter(p => p.business_id === bId);
  res.json(list);
});

app.post('/api/business/:businessId/promotions', checkAuth, verifyTenant, (req, res) => {
  const bId = parseInt(req.params.businessId);
  const { name, code, discount_type, discount_value, status, expires_at } = req.body;

  if (!name || !code || !discount_type || isNaN(Number(discount_value))) {
    return res.status(400).json({ error: 'Nom, code, type et valeur de réduction requis.' });
  }

  const db = loadDatabase();
  if (!db.promotions) db.promotions = [];

  const existing = db.promotions.find(p => p.business_id === bId && p.code.toUpperCase() === code.toUpperCase());
  if (existing) {
    return res.status(400).json({ error: 'Une promotion avec ce code existe déjà.' });
  }

  const newPromo = {
    id: db.promotions.length + 1,
    business_id: bId,
    name,
    code: code.toUpperCase(),
    discount_type,
    discount_value: Number(discount_value),
    status: status || 'active',
    start_date: new Date().toISOString().slice(0, 10),
    expires_at: expires_at || undefined
  };

  db.promotions.push(newPromo);
  saveDatabase();
  res.json({ success: true, promotion: newPromo });
});

app.delete('/api/business/:businessId/promotions/:id', checkAuth, verifyTenant, (req, res) => {
  const bId = parseInt(req.params.businessId);
  const id = parseInt(req.params.id);
  const db = loadDatabase();
  if (!db.promotions) db.promotions = [];
  
  const initialLength = db.promotions.length;
  db.promotions = db.promotions.filter(p => !(p.id === id && p.business_id === bId));
  
  if (db.promotions.length === initialLength) {
    return res.status(404).json({ error: 'Promotion introuvable.' });
  }
  
  saveDatabase();
  res.json({ success: true });
});


// ----------------------------------------------------
// APPOINTMENT CHECKOUT ENDPOINT WITH PAYMENT METHODS AND GIFT CARD DEDUCTION
// ----------------------------------------------------
app.post('/api/business/:businessId/appointments/:id/checkout', checkAuth, verifyTenant, (req, res) => {
  const bId = parseInt(req.params.businessId);
  const apptId = parseInt(req.params.id);
  const { payment_method, gift_card_code, product_id, promotion_code } = req.body;

  if (!payment_method) {
    return res.status(400).json({ error: 'Moyen de paiement requis.' });
  }

  const db = loadDatabase();
  const appt = db.appointments.find(a => a.id === apptId && a.business_id === bId);
  if (!appt) return res.status(404).json({ error: 'Rendez-vous introuvable.' });

  let usedGiftCard: any = null;
  let chargeAmount = appt.total_price;
  let appliedPromo: any = null;
  let soldProduct: any = null;
  const serviceObj = db.services.find(s => s.id === appt.service_id);
  let transactionDetail = serviceObj ? serviceObj.name : 'Prestation de service';

  // Apply Promotion Code if exists
  if (promotion_code) {
    if (!db.promotions) db.promotions = [];
    const promo = db.promotions.find(p => p.business_id === bId && p.code.toUpperCase() === promotion_code.toUpperCase() && p.status === 'active');
    if (promo) {
      appliedPromo = promo;
      if (promo.discount_type === 'percent') {
        chargeAmount = Number((chargeAmount * (1 - promo.discount_value / 100)).toFixed(2));
      } else {
        chargeAmount = Math.max(0, chargeAmount - promo.discount_value);
      }
      transactionDetail += ` (Promo ${promo.code})`;
    }
  }

  // Handle retail product upselling if selected
  if (product_id) {
    if (!db.products) db.products = [];
    const prod = db.products.find(p => p.id === parseInt(product_id) && p.business_id === bId);
    if (prod) {
      soldProduct = prod;
      chargeAmount += prod.price;
      prod.stock = Math.max(0, prod.stock - 1); // deduct inventory stock
      transactionDetail += ` + ${prod.name}`;
    }
  }

  if (payment_method === 'gift_card') {
    if (!gift_card_code) {
      return res.status(400).json({ error: 'Le code du bon cadeau doit être renseigné.' });
    }
    if (!db.gift_cards) db.gift_cards = [];
    const gc = db.gift_cards.find(g => g.business_id === bId && g.code.toUpperCase() === gift_card_code.toUpperCase());
    if (!gc) {
      return res.status(404).json({ error: 'Bon cadeau introuvable.' });
    }
    if (gc.status !== 'active' || gc.remaining_amount <= 0) {
      return res.status(400).json({ error: 'Le bon cadeau est épuisé ou inactuel/expiré.' });
    }

    if (gc.remaining_amount < chargeAmount) {
      return res.status(400).json({ 
        error: `Solde insuffisant sur ce bon cadeau (${gc.remaining_amount} DH restants pour un total net de ${chargeAmount} DH).` 
      });
    }

    gc.remaining_amount = Number((gc.remaining_amount - chargeAmount).toFixed(2));
    if (gc.remaining_amount <= 0) {
      gc.status = 'used';
    }
    usedGiftCard = gc;
  }

  // Update appointment status to completed (3)
  appt.status_id = 3;
  appt.total_price = chargeAmount; // Store final calculated price
  appt.updated_at = new Date().toISOString();

  // Create payment transaction
  if (!db.payments) db.payments = [];
  const payId = db.payments.length + 1;
  const newPayment = {
    id: payId,
    business_id: bId,
    appointment_id: apptId,
    subscription_id: null,
    amount: chargeAmount,
    status: 'completed' as const,
    gateway: payment_method as any,
    transaction_id: payment_method === 'gift_card' ? `voucher_${gift_card_code.toUpperCase()}` : `pay_${Date.now()}`,
    detail: transactionDetail,
    created_at: new Date().toISOString()
  };

  db.payments.push(newPayment);
  saveDatabase();

  res.json({ 
    success: true, 
    appointment: appt, 
    payment: newPayment,
    gift_card: usedGiftCard,
    product: soldProduct,
    promotion: appliedPromo
  });
});


// ----------------------------------------------------
// MULTI-TENANT CLIENTS isolated endpoints
// ----------------------------------------------------
app.get('/api/business/:businessId/clients', checkAuth, verifyTenant, (req, res) => {
  const bId = parseInt(req.params.businessId);
  const db = loadDatabase();
  res.json(db.clients.filter(c => c.business_id === bId));
});

app.post('/api/business/:businessId/clients', checkAuth, verifyTenant, (req, res) => {
  const bId = parseInt(req.params.businessId);
  const { name, email, phone, notes } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: 'Informations de fiche client incomplètes (Nom et Téléphone sont requis).' });
  }

  const db = loadDatabase();
  const id = db.clients.length + 1;
  const cli: Client = {
    id,
    business_id: bId,
    name,
    email: email || '',
    phone,
    notes,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  db.clients.push(cli);
  saveDatabase();

  res.json({ success: true, client: cli });
});

app.put('/api/business/:businessId/clients/:id', checkAuth, verifyTenant, (req, res) => {
  const bId = parseInt(req.params.businessId);
  const id = parseInt(req.params.id);
  const { name, email, phone, notes } = req.body;

  const db = loadDatabase();
  const cli = db.clients.find(c => c.id === id && c.business_id === bId);
  if (!cli) return res.status(404).json({ error: 'Client introuvable.' });

  if (name) cli.name = name;
  if (email !== undefined) cli.email = email;
  if (phone) cli.phone = phone;
  if (notes !== undefined) cli.notes = notes;
  cli.updated_at = new Date().toISOString();

  saveDatabase();
  res.json({ success: true, client: cli });
});

app.delete('/api/business/:businessId/clients/:id', checkAuth, verifyTenant, (req, res) => {
  const bId = parseInt(req.params.businessId);
  const id = parseInt(req.params.id);

  const db = loadDatabase();
  const cliIndex = db.clients.findIndex(c => c.id === id && c.business_id === bId);
  if (cliIndex === -1) return res.status(404).json({ error: 'Client introuvable.' });

  db.clients.splice(cliIndex, 1);
  saveDatabase();
  res.json({ success: true });
});


// ----------------------------------------------------
// MULTI-TENANT BRANCHES & BILLING
// ----------------------------------------------------
app.get('/api/business/:businessId/branches', (req, res) => {
  const bId = parseInt(req.params.businessId);
  const db = loadDatabase();
  res.json(db.branches.filter(br => br.business_id === bId));
});

app.get('/api/business/:businessId/billing', checkAuth, verifyTenant, (req, res) => {
  const bId = parseInt(req.params.businessId);
  const db = loadDatabase();
  const invoices = db.invoices.filter(i => i.business_id === bId);
  const payments = db.payments.filter(p => p.business_id === bId && p.subscription_id !== null);
  const sub = db.subscriptions.find(s => s.business_id === bId);
  const activePlan = sub ? db.subscription_plans.find(p => p.id === sub.plan_id) : null;

  res.json({
    invoices,
    payments,
    subscription: sub,
    activePlan
  });
});

app.post('/api/business/:businessId/billing/upgrade', checkAuth, verifyTenant, (req, res) => {
  const bId = parseInt(req.params.businessId);
  const { plan_id } = req.body;

  if (!plan_id) return res.status(400).json({ error: 'Plan d\'abonnement ciblé requis.' });

  const db = loadDatabase();
  const plan = db.subscription_plans.find(p => p.id === parseInt(plan_id));
  if (!plan) return res.status(404).json({ error: 'Plan introuvable.' });

  // Update subscription status parameters
  const sub = db.subscriptions.find(s => s.business_id === bId);
  if (sub) {
    sub.plan_id = plan.id;
    sub.status = plan.price === 0 ? 'trialing' : 'active';
    const renewal = new Date();
    renewal.setMonth(renewal.getMonth() + 1);
    sub.end_date = renewal.toISOString().slice(0, 10);
    sub.updated_at = new Date().toISOString();

    // Create Invoice structure
    const invNumber = `INV-2026-${String(db.invoices.length + 1).padStart(4, '0')}`;
    const issueDate = new Date().toISOString().slice(0, 10);
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 5);

    const invoiceId = db.invoices.length + 1;
    db.invoices.push({
      id: invoiceId,
      business_id: bId,
      subscription_id: sub.id,
      invoice_number: invNumber,
      amount: plan.price,
      status: plan.price === 0 ? 'paid' : 'unpaid',
      pdf_url: `/invoices/${invNumber}.pdf`,
      issue_date: issueDate,
      due_date: dueDate.toISOString().slice(0, 10),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    // Make Mock Transaction if Pro/Premium Upgraded
    if (plan.price > 0) {
      db.payments.push({
        id: db.payments.length + 1,
        business_id: bId,
        appointment_id: null,
        subscription_id: sub.id,
        amount: plan.price,
        status: 'completed',
        gateway: 'stripe',
        transaction_id: `txn_${Math.random().toString(36).substring(2, 10)}`,
        created_at: new Date().toISOString()
      });

      const inv = db.invoices.find(item => item.id === invoiceId);
      if (inv) inv.status = 'paid';
    }

    saveDatabase();
    logActivity((req as any).userSession.userId, 'subscription_upgrade', 'subscriptions', sub.id, req);
    res.json({ success: true, subscription: sub, plan });
  } else {
    res.status(404).json({ error: 'Abonnement introuvable.' });
  }
});


// ----------------------------------------------------
// PUBLIC BOOKING WORKFLOW API APIS
// ----------------------------------------------------

// GET /api/public/businesses
app.get('/api/public/businesses', (req, res) => {
  const db = loadDatabase();
  const activeBusinesses = db.businesses.filter(b => b.status === 'active');
  res.json(activeBusinesses);
});

// GET /api/public/business/:slug
app.get('/api/public/business/:slug', (req, res) => {
  const db = loadDatabase();
  const business = db.businesses.find(b => b.slug === req.params.slug && b.status === 'active');

  if (!business) {
    return res.status(404).json({ error: 'Établissement introuvable ou suspendu.' });
  }

  const services = db.services.filter(s => s.business_id === business.id);
  const staff = db.staff.filter(st => st.business_id === business.id);
  const workingHours = db.working_hours.filter(w => w.business_id === business.id);
  const categories = db.service_categories;

  res.json({
    business,
    services,
    staff,
    workingHours,
    categories
  });
});

// POST /api/public/business/:slug/book
app.post('/api/public/business/:slug/book', (req, res) => {
  const { slug } = req.params;
  const { service_id, staff_id, date, start_time, client_name, client_email, client_phone, notes } = req.body;

  if (!service_id || !staff_id || !date || !start_time || !client_name || !client_email || !client_phone) {
    return res.status(400).json({ error: 'Données de réservation publiques incomplètes.' });
  }

  const db = loadDatabase();
  const business = db.businesses.find(b => b.slug === slug);
  if (!business) return res.status(404).json({ error: 'Établissement introuvable.' });

  // 1. Create or Find client inside tenant store
  let client = db.clients.find(c => c.business_id === business.id && c.email.toLowerCase() === client_email.toLowerCase());
  if (!client) {
    client = {
      id: db.clients.length + 1,
      business_id: business.id,
      name: client_name,
      email: client_email,
      phone: client_phone,
      notes: 'Réservation en ligne publique.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    db.clients.push(client);
  }

  // 2. Perform Double Booking avoid check
  const hasConflict = db.appointments.some(appt =>
    appt.business_id === business.id &&
    appt.staff_id === parseInt(staff_id) &&
    appt.date === date &&
    appt.start_time === start_time &&
    appt.status_id !== 4 // not cancelled
  );

  if (hasConflict) {
    return res.status(400).json({ error: 'Ce créneau horaire est déjà occupé pour l\'employé choisi. Veuillez choisir une autre heure.' });
  }

  // 3. Insert Appointment Table
  const service = db.services.find(s => s.id === parseInt(service_id));
  if (!service) return res.status(404).json({ error: 'Service sélectionné invalide.' });

  const dur = service.duration;
  const [h, m] = start_time.split(':').map(Number);
  const totalMins = h * 60 + m + dur;
  const endH = Math.floor(totalMins / 60) % 24;
  const endM = totalMins % 60;
  const end_time = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

  const apptId = db.appointments.length + 1;
  const newAppt: Appointment = {
    id: apptId,
    business_id: business.id,
    branch_id: 1, // main branch
    client_id: client.id,
    staff_id: parseInt(staff_id),
    service_id: parseInt(service_id),
    date,
    start_time,
    end_time,
    total_price: service.price,
    status_id: 1, // Pending confirmation by Default
    notes,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  db.appointments.push(newAppt);

  // Trigger Notification to Tenant Owner
  const owner = db.users.find(u => u.business_id === business.id && u.role_id === 2);
  if (owner) {
    db.notifications.push({
      id: db.notifications.length + 1,
      user_id: owner.id,
      title: 'Nouvelle réservation !',
      message: `${client_name} a réservé ${service.name} pour le ${date} à ${start_time} (En attente).`,
      is_read: false,
      created_at: new Date().toISOString()
    });
  }

  saveDatabase();

  logActivity(null, 'public_booking', 'appointments', apptId, req);

  res.json({
    success: true,
    message: 'Réservation soumise avec succès !',
    appointment: {
      id: apptId,
      date,
      start_time,
      end_time,
      price: service.price
    },
    business: {
      name: business.name,
      address: business.address,
      phone: business.phone
    }
  });
});


// ----------------------------------------------------
// SERVE ASSETS / ROUTE FALLBACKS
// ----------------------------------------------------

async function startServer() {
  // Vite integration middleware in local sandbox development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // HTML fallback for SPA routing under development
    app.get('*', async (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.includes('.')) {
        return next();
      }
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    // Serve static frontend assets built inside /dist/ folder
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[NIDZAK-SERVER] Server running successfully on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((e) => {
  console.error('Failed to start server:', e);
});
