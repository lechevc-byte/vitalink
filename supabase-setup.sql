-- VitaLink — Supabase SQL Setup
-- Exécuter dans Supabase > SQL Editor

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum roles
CREATE TYPE user_role AS ENUM ('medecin', 'patient', 'operateur_etat', 'mutuelle');

-- Table profils (liée à auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  numero_rpps TEXT
);

-- Table patients
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nss TEXT UNIQUE NOT NULL,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  date_naissance DATE NOT NULL,
  groupe_sanguin TEXT,
  medecin_referent_id UUID REFERENCES profiles(id),
  profile_id UUID REFERENCES profiles(id),
  score_continuite INTEGER DEFAULT 85,
  antecedents JSONB DEFAULT '[]',
  traitements JSONB DEFAULT '[]',
  alertes JSONB DEFAULT '[]'
);

-- Table consultations
CREATE TABLE consultations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  medecin_id UUID REFERENCES profiles(id),
  date_consultation TIMESTAMPTZ NOT NULL,
  motif TEXT NOT NULL,
  type_consultation TEXT,
  notes_cliniques TEXT,
  resume_ia TEXT,
  constantes JSONB,
  prescriptions JSONB DEFAULT '[]',
  signature_hash TEXT,
  signature_par TEXT,
  signe_le TIMESTAMPTZ
);

-- Table documents
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  type_document TEXT,
  date_document DATE,
  statut TEXT
);

-- ─── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Profiles: chaque user voit son propre profil
CREATE POLICY "users_own_profile" ON profiles
  FOR SELECT USING (id = auth.uid());

-- Patients: médecin voit ses patients
CREATE POLICY "medecin_ses_patients" ON patients
  FOR ALL USING (medecin_referent_id = auth.uid());

-- Patients: patient voit son propre dossier
CREATE POLICY "patient_son_dossier" ON patients
  FOR SELECT USING (profile_id = auth.uid());

-- Patients: opérateur état peut lire tous les patients (stats agrégées)
CREATE POLICY "etat_lecture_patients" ON patients
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'operateur_etat')
  );

-- Consultations: médecin voit les consultations de ses patients
CREATE POLICY "medecin_consultations" ON consultations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM patients WHERE patients.id = consultations.patient_id AND patients.medecin_referent_id = auth.uid())
  );

-- Consultations: patient voit ses propres consultations
CREATE POLICY "patient_ses_consultations" ON consultations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM patients WHERE patients.id = consultations.patient_id AND patients.profile_id = auth.uid())
  );

-- Consultations: opérateur état lecture
CREATE POLICY "etat_lecture_consultations" ON consultations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'operateur_etat')
  );

-- Documents: médecin voit les documents de ses patients
CREATE POLICY "medecin_documents" ON documents
  FOR ALL USING (
    EXISTS (SELECT 1 FROM patients WHERE patients.id = documents.patient_id AND patients.medecin_referent_id = auth.uid())
  );

-- Documents: patient voit ses propres documents
CREATE POLICY "patient_ses_documents" ON documents
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM patients WHERE patients.id = documents.patient_id AND patients.profile_id = auth.uid())
  );

-- ─── RPC pour stats État ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_stats_etat()
RETURNS JSON AS $$
  SELECT json_build_object(
    'patients_actifs', COUNT(DISTINCT p.id),
    'consultations_total', COUNT(c.id),
    'resumes_ia_generes', COUNT(c.id) FILTER (WHERE c.resume_ia IS NOT NULL)
  )
  FROM patients p
  LEFT JOIN consultations c ON c.patient_id = p.id;
$$ LANGUAGE sql SECURITY DEFINER;

-- ─── DONNÉES DE TEST ──────────────────────────────────────────────────────────
-- IMPORTANT: Créez d'abord 4 utilisateurs dans Supabase Auth Dashboard, puis
-- remplacez les UUIDs ci-dessous par les vrais UUIDs.

-- INSERT INTO profiles VALUES
--   ('<uuid-medecin>',  'medecin',         'Martin',    'Jean',    '10003456789'),
--   ('<uuid-patient>',  'patient',         'Lefebvre',  'Sophie',  NULL),
--   ('<uuid-etat>',     'operateur_etat',  'Rousseau',  'Claire',  NULL),
--   ('<uuid-mutuelle>', 'mutuelle',        'Benoit',    'Marc',    NULL);

-- INSERT INTO patients (nss, nom, prenom, date_naissance, groupe_sanguin, medecin_referent_id, profile_id, antecedents, traitements, alertes) VALUES
-- ('2820375114033', 'Lefebvre', 'Sophie', '1982-03-14', 'A+', '<uuid-medecin>', '<uuid-patient>',
--   '[{"libelle":"Asthme modéré","type":"maladie_chronique"},{"libelle":"Allergie pénicilline","type":"allergie"}]',
--   '[{"medicament":"Salbutamol","dosage":"100µg","frequence":"Au besoin","depuis":"2019","actif":true},{"medicament":"Ramipril","dosage":"5mg","frequence":"1x/jour","depuis":"2021","actif":true}]',
--   '[{"type":"warning","msg":"Spirométrie à planifier dans les 3 prochains mois"},{"type":"info","msg":"Renouvellement Ramipril dans 42 jours"}]'
-- );

-- INSERT INTO consultations (patient_id, medecin_id, date_consultation, motif, type_consultation, notes_cliniques, constantes, prescriptions, signature_hash, signature_par, signe_le) VALUES
-- ('<id-patient-sophie>', '<uuid-medecin>', '2025-11-12 14:30:00+00', 'Renouvellement ordonnance + bilan annuel', 'Généraliste',
--   'Tension 13/8. Saturation 98%. Patient stable. Renouvellement Ramipril 5mg.',
--   '{"ta":"130/80","fc":"72","spo2":"98%","poids":"68kg","temp":"37.1°C"}',
--   '["Ramipril 5mg — 90j","Bilan lipidique"]',
--   'sha256:a3f9c2d1e7b4...8f2a', 'Dr. Martin (RPPS: 10003456789)', '2025-11-12T14:32:00Z'
-- );
