/**
 * NIDZAK Partner / Booking SaaS
 * Shared TS Types & Interfaces
 */

export enum UserRoleName {
  SUPER_ADMIN = 'super_admin',
  BUSINESS_OWNER = 'business_owner',
  STAFF = 'staff',
  CLIENT = 'client',
}

export interface Role {
  id: number;
  name: UserRoleName;
  description: string;
}

export interface User {
  id: number;
  role_id: number;
  business_id: number | null;
  name: string;
  email: string;
  password?: string; // Hashed password
  phone?: string;
  photo?: string;
  created_at: string;
  updated_at: string;
}

export interface Business {
  id: number;
  name: string;
  slug: string;
  logo: string;
  cover_image: string;
  description: string;
  email: string;
  phone: string;
  address: string;
  category_id: number;
  status: 'pending' | 'active' | 'suspended';
  created_at: string;
  updated_at: string;
}

export interface BusinessSetting {
  id: number;
  business_id: number;
  currency: string;
  timezone: string;
  language: string;
  stripe_key?: string;
  paypal_email?: string;
}

export interface Branch {
  id: number;
  business_id: number;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  is_main: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceCategory {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  is_system: boolean;
}

export interface Service {
  id: number;
  business_id: number;
  name: string;
  description: string;
  price: number;
  duration: number; // in minutes
  category_id: number;
  created_at: string;
  updated_at: string;
}

export interface Staff {
  id: number;
  business_id: number;
  branch_id: number;
  user_id: number | null;
  name: string;
  email: string;
  phone?: string;
  photo?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
}

export interface StaffService {
  staff_id: number;
  service_id: number;
}

export interface Client {
  id: number;
  business_id: number;
  name: string;
  email: string;
  phone: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AppointmentStatus {
  id: number;
  name: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  label_fr: string;
  color: string;
}

export interface Appointment {
  id: number;
  business_id: number;
  branch_id: number;
  client_id: number;
  staff_id: number;
  service_id: number;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM:SS (or HH:MM)
  end_time: string; // HH:MM:SS
  total_price: number;
  status_id: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlan {
  id: number;
  name: string;
  price: number;
  billing_cycle: 'monthly' | 'yearly';
  staff_limit: number;
  appointment_limit: number;
  branch_limit: number;
  reports_access: boolean;
  marketing_access: boolean;
}

export interface Subscription {
  id: number;
  business_id: number;
  plan_id: number;
  status: 'trialing' | 'active' | 'unpaid' | 'cancelled' | 'expired';
  start_date: string;
  end_date: string;
  trial_ends_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: number;
  business_id: number;
  appointment_id: number | null;
  subscription_id: number | null;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  gateway: 'cash' | 'stripe' | 'paypal' | 'cmi' | 'card' | 'transfer' | 'gift_card';
  transaction_id?: string;
  created_at: string;
}

export interface Invoice {
  id: number;
  business_id: number;
  subscription_id: number | null;
  invoice_number: string;
  amount: number;
  status: 'paid' | 'unpaid' | 'void';
  pdf_url?: string;
  issue_date: string;
  due_date: string;
  created_at: string;
  updated_at?: string;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface Review {
  id: number;
  business_id: number;
  client_id: number;
  appointment_id: number;
  rating: number; // 1-5
  comment?: string;
  reply?: string;
  created_at: string;
}

export interface SupportTicket {
  id: number;
  user_id: number;
  business_id: number | null;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: number;
  user_id: number | null;
  action: string;
  entity_name: string;
  entity_id: number | null;
  ip_address?: string;
  created_at: string;
}

export interface WorkingHour {
  id: number;
  business_id: number;
  staff_id: number | null; // NULL if business/branch level default
  day_of_week: number; // 0-6
  start_time: string;
  end_time: string;
  is_closed: boolean;
}

export interface Holiday {
  id: number;
  business_id: number;
  staff_id: number | null;
  holiday_date: string;
  name?: string;
}

export interface GiftCard {
  id: number;
  business_id: number;
  code: string; // unique code e.g. "BON-500-ABC"
  initial_amount: number;
  remaining_amount: number;
  client_name: string;
  client_phone?: string;
  status: 'active' | 'used' | 'expired';
  created_at: string;
  expires_at?: string;
}

export interface Product {
  id: number;
  business_id: number;
  name: string;
  sku: string;
  price: number;
  cost_price: number;
  stock: number;
  category: string;
  supplier?: string;
}

export interface Promotion {
  id: number;
  business_id: number;
  name: string;
  code: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  status: 'active' | 'paused' | 'expired';
  start_date: string;
  expires_at?: string;
}

// Authentication DTOs
export interface AuthResponse {
  user: User;
  token: string;
  business?: Business | null;
  subscription?: Subscription | null;
}

export interface LoginPayload {
  email: string;
  password?: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password?: string;
  businessName: string;
  businessCategory: string;
  businessAddress: string;
  businessPhone: string;
  planId: number;
}
