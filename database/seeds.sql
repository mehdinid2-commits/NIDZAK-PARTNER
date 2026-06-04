-- NIDZAK Partner / Booking SaaS Seed Data
-- Import this to populate your production SQL Database

-- 1. Insert Core Roles
INSERT INTO roles (id, name, description) VALUES
(1, 'super_admin', 'SaaS Platform General Administrator'),
(2, 'business_owner', 'Business owner who has a tenant subscription'),
(3, 'staff', 'Staff/Employee of a business tenant'),
(4, 'client', 'Customers who register or book services');

-- 2. Insert Base Service Categories
INSERT INTO service_categories (id, name, description, icon, is_system) VALUES
(1, 'Salons de coiffure', 'Coiffure homme, femme, coloration, lissage, brushing', 'scissors', 1),
(2, 'Spas & Massages', 'Hammam traditionnel marocain, massage relaxant, thérapeutique', 'flower', 1),
(3, 'Esthétique & Beauté', 'Soins du visage, manucure, pédicure, maquillage, épilation', 'sparkles', 1),
(4, 'Barbershops', 'Rasage traditionnel, taille de barbe, soins capillaires homme', 'user', 1),
(5, 'Cliniques & Bien-être', 'Soins thérapeutiques, acupuncture, kinésithérapie, nutrition', 'heart', 1),
(6, 'Fitness & Yoga', 'Séance de yoga privée, coaching sportif, pilates', 'activity', 1);

-- 3. Insert Base Subscription Plans
INSERT INTO subscription_plans (id, name, price, billing_cycle, staff_limit, appointment_limit, branch_limit, reports_access, marketing_access) VALUES
(1, 'Free Trial', 0.00, 'monthly', 2, 50, 1, 0, 0),
(2, 'Basic', 290.00, 'monthly', 3, 200, 1, 1, 0),
(3, 'Pro', 590.00, 'monthly', 10, 1000, 2, 1, 1),
(4, 'Premium', 1190.00, 'monthly', 100, 999999, 10, 1, 1);

-- 4. Insert Appointment Status Color Coding
INSERT INTO appointment_status (id, name, label_fr, color) VALUES
(1, 'pending', 'En attente', 'yellow'),
(2, 'confirmed', 'Confirmé', 'blue'),
(3, 'completed', 'Terminé', 'green'),
(4, 'cancelled', 'Annulé', 'red'),
(5, 'no_show', 'Absence', 'gray');

-- 5. Insert Platform System Settings
INSERT INTO system_settings (`key`, `value`) VALUES
('platform_name', 'NIDZAK Partner'),
('currency_default', 'MAD'),
('support_email', 'support@nidzak.com'),
('allow_registration', 'true'),
('maintenance_mode', 'false');

-- 6. Insert Super Admin User (password hash for "password123")
INSERT INTO users (id, role_id, business_id, name, email, password, phone, photo) VALUES
(1, 1, NULL, 'Mehdi Nidzak', 'mehdinid2@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '+212612345678', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150');

-- 7. Insert Demo Business (L''Atelier de Beauté)
INSERT INTO businesses (id, name, slug, logo, cover_image, description, email, phone, address, category_id, status) VALUES
(1, 'L''Atelier de Beauté Casablanca', 'latelier-beaute-casa', 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=200', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800', 'Salon de beauté de luxe au cœur de Gauthier, Casablanca. Coiffure professionnelle, soins capillaires, et onglerie.', 3, '+212522112233', '14 Rue Gauthier, Quartier Gauthier, Casablanca', 3, 'active');

-- 8. Business Settings for Salon
INSERT INTO business_settings (id, business_id, currency, timezone, language) VALUES
(1, 1, 'MAD', 'Africa/Casablanca', 'fr');

-- 9. Setup Demo Business Owner User (owner of business_id = 1)
INSERT INTO users (id, role_id, business_id, name, email, password, phone, photo) VALUES
(2, 2, 1, 'Sarah Bennani', 'sarah@nidzak.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '+212680102030', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150');

-- 10. Subscribe Demo Business to Pro Plan
INSERT INTO subscriptions (id, business_id, plan_id, status, start_date, end_date, trial_ends_at) VALUES
(1, 1, 3, 'active', '2026-06-01', '2026-07-01', NULL);

-- 11. Insert Business Branches
INSERT INTO branches (id, business_id, name, address, phone, email, is_main) VALUES
(1, 1, 'L''Atelier de Beauté - Gauthier', '14 Rue Gauthier, Quartier Gauthier, Casablanca', '+212522112233', 'gauthier@latelier.ma', 1);

-- 12. Insert Business Staff
INSERT INTO staff (id, business_id, branch_id, user_id, name, email, phone, photo, bio) VALUES
(1, 1, 1, NULL, 'Yasmina Alami', 'yasmina@latelier.ma', '+212620304050', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', 'Spécialiste de la manucure et des soins du visage avec 5 ans d''expérience.'),
(2, 1, 1, NULL, 'Karim Radi', 'karim@latelier.ma', '+212630405060', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 'Expert coiffeur visagiste et coloriste formé à Paris. Passionné et créatif.');

-- 13. Services Offered by Salon
INSERT INTO services (id, business_id, name, description, price, duration, category_id) VALUES
(1, 1, 'Coupe & Brushing Signature', 'Coupe personnalisée avec soin capillaire nourrissant et brushing parfait professionnel.', 250.00, 45, 1),
(2, 'Coloration Organique & Soin', 'Coloration complète sans ammoniaque respectant la fibre capillaire, incluant massage du cuir chevelu.', 400.00, 90, 1),
(3, 'Manucure & Pose de Gel', 'Soin complet des ongles, cuticules et pose de vernis semi-permanent ou extension gel de haute qualité.', 180.00, 60, 3),
(4, 'Soin du Visage Éclat Hydrafacial', 'Nettoyage en profondeur, gommage doux et hydratation intense par le vide pour un teint éclatant instantané.', 600.00, 60, 3);

-- 14. Assign Services to Staff (Junction)
INSERT INTO staff_services (staff_id, service_id) VALUES
(1, 3), -- Yasmina does Manucure
(1, 4), -- Yasmina does Hydrafacial
(2, 1), -- Karim does Coupe & Brushing
(2, 2); -- Karim does Coloration

-- 15. Clients of L''Atelier
INSERT INTO clients (id, business_id, name, email, phone, notes) VALUES
(1, 1, 'Sofia Drissi', 'sofia.drissi@gmail.com', '+212650506070', 'Préfère le café noir sans sucre. Sensible aux colorations fortes.'),
(2, 1, 'Nabil El Fassi', 'nabil.fassi@hotmail.com', '+212670708090', 'Client régulier pour des cadeaux ou soins combinés.');

-- 16. Invoices for Subscription
INSERT INTO invoices (id, business_id, subscription_id, invoice_number, amount, status, issue_date, due_date) VALUES
(1, 1, 1, 'INV-2026-0001', 590.00, 'paid', '2026-06-01', '2026-06-05');

-- 17. Set Working Hours (from Monday to Saturday, 09:00 to 19:30)
INSERT INTO working_hours (business_id, staff_id, day_of_week, start_time, end_time, is_closed) VALUES
-- Business Working Hours
(1, NULL, 1, '09:00:00', '19:30:00', 0),
(1, NULL, 2, '09:00:00', '19:30:00', 0),
(1, NULL, 3, '09:00:00', '19:30:00', 0),
(1, NULL, 4, '09:00:00', '19:30:00', 0),
(1, NULL, 5, '09:00:00', '19:30:00', 0),
(1, NULL, 6, '09:00:00', '19:30:00', 0),
(1, NULL, 0, '00:00:00', '00:00:00', 1), -- Closed Sundays
-- Staff 1 (Yasmina) Working Hours
(1, 1, 1, '10:00:00', '18:00:00', 0),
(1, 1, 2, '10:00:00', '18:00:00', 0),
(1, 1, 3, '10:00:00', '18:00:00', 0),
(1, 1, 4, '10:00:00', '18:00:00', 0),
(1, 1, 5, '10:00:00', '18:00:00', 0),
(1, 1, 6, '10:00:00', '15:00:00', 0),
(1, 1, 0, '00:00:00', '00:00:00', 1),
-- Staff 2 (Karim) Working Hours
(1, 2, 1, '09:00:00', '19:00:00', 0),
(1, 2, 2, '09:00:00', '19:00:00', 0),
(1, 2, 3, '09:00:00', '19:00:00', 0),
(1, 2, 4, '09:00:00', '19:00:00', 0),
(1, 2, 5, '09:00:00', '19:00:00', 0),
(1, 2, 6, '09:00:00', '19:00:00', 0),
(1, 2, 0, '00:00:00', '00:00:00', 1);

-- 18. Sample Pre-booked Appointments
INSERT INTO appointments (id, business_id, branch_id, client_id, staff_id, service_id, date, start_time, end_time, total_price, status_id, notes) VALUES
(1, 1, 1, 1, 2, 1, '2026-06-03', '11:00:00', '11:45:00', 250.00, 2, 'Sofia : Coupe & Brushing de Routine'),
(2, 1, 1, 2, 1, 3, '2026-06-03', '14:30:00', '15:30:00', 180.00, 1, 'Soin des mains semi-perm pour Nabil');

-- 19. Sample Activity Log
INSERT INTO activity_logs (user_id, action, entity_name, entity_id, ip_address) VALUES
(2, 'business_login', 'businesses', 1, '196.200.14.77'),
(2, 'appointment_create', 'appointments', 2, '196.200.14.77');
