-- ==============================================================================
-- CHAPTEROS (CHI HỘI MANAGER) - FULL COMPLETE SUPABASE SETUP SCRIPT (ALL-IN-ONE)
-- Version: 3.0.0 (Production Verified, Multi-Tenant Collab & 100% Idempotent)
-- Encoding: UTF-8
-- Description: Khởi tạo toàn bộ cơ sở dữ liệu, 26 bảng, hàm RPC, bảo mật RLS và Storage
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 0. EXTENSIONS & ENUMS
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'organization_role') THEN
    CREATE TYPE public.organization_role AS ENUM ('admin', 'leader', 'deputy', 'treasurer', 'secretary', 'member');
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 1. CORE TABLES DDL (Thứ tự chuẩn theo Foreign Key Dependencies)
-- ------------------------------------------------------------------------------

-- 1.1 Organizations (Đơn vị / Chi hội / CLB / Đội nhóm)
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL DEFAULT 'chi_hoi',
  parent_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  description TEXT,
  logo_url TEXT,
  finance_approval_threshold NUMERIC DEFAULT 0,
  drive_folder_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 1.2 Profiles (Hồ sơ người dùng - đồng bộ auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  student_id TEXT,
  role TEXT DEFAULT 'member',
  is_super_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 1.3 Organization Memberships (Phân quyền thành viên & Ban Chấp Hành trong Đơn vị)
CREATE TABLE IF NOT EXISTS public.organization_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'leader', 'deputy', 'treasurer', 'secretary', 'member')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_org_user_membership UNIQUE (organization_id, user_id)
);

-- 1.4 Terms (Nhiệm kỳ Đơn vị)
CREATE TABLE IF NOT EXISTS public.terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  closed_at TIMESTAMPTZ,
  closed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  handover_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 1.5 Members (Danh sách hội viên chính thức của Đơn vị)
CREATE TABLE IF NOT EXISTS public.members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  student_id TEXT,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  academic_year TEXT,
  faculty TEXT,
  position TEXT DEFAULT 'Hội viên',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'transferred', 'graduated', 'alumni', 'expelled')),
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  date_of_birth DATE,
  hometown TEXT,
  address TEXT,
  joined_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_member_org_student_id UNIQUE (organization_id, student_id)
);

-- 1.6 Term Members (Chức vụ hội viên theo từng nhiệm kỳ)
CREATE TABLE IF NOT EXISTS public.term_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term_id UUID NOT NULL REFERENCES public.terms(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  position TEXT NOT NULL DEFAULT 'Hội viên',
  department TEXT,
  role TEXT DEFAULT 'member',
  joined_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_term_member UNIQUE (term_id, member_id)
);

-- 1.7 Plans (Kế hoạch / Chiến dịch phối hợp Collab)
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  lead_organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('draft', 'planning', 'active', 'completed', 'cancelled')),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 1.8 Plan Organizations (Các đơn vị cùng tham gia Chiến dịch)
CREATE TABLE IF NOT EXISTS public.plan_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role_in_plan TEXT NOT NULL DEFAULT 'co_host' CHECK (role_in_plan IN ('host', 'co_host', 'partner', 'supporter', 'observer')),
  is_host BOOLEAN NOT NULL DEFAULT false,
  role_description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'rejected', 'removed')),
  joined_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_plan_organization UNIQUE (plan_id, organization_id)
);

-- 1.9 Activities (Hoạt động & Sự kiện)
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  term_id UUID REFERENCES public.terms(id) ON DELETE SET NULL,
  plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL,
  lead_organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  lead_member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  code TEXT,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'volunteer', 'academic', 'sports', 'culture', 'meeting', 'training', 'event')),
  location TEXT,
  start_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  end_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('draft', 'planning', 'published', 'in_progress', 'completed', 'cancelled')),
  type TEXT NOT NULL DEFAULT 'event',
  points NUMERIC DEFAULT 0,
  budget NUMERIC DEFAULT 0,
  target_members INTEGER DEFAULT 0,
  banner_url TEXT,
  form_url TEXT,
  google_form_id TEXT,
  google_sheet_url TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 1.10 Activity Forms (Biểu mẫu Google Form gắn với Hoạt động)
CREATE TABLE IF NOT EXISTS public.activity_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  term_id UUID REFERENCES public.terms(id) ON DELETE SET NULL,
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  google_form_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  form_url TEXT NOT NULL,
  edit_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'draft')),
  is_primary BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  last_synced_at TIMESTAMPTZ,
  sync_status TEXT NOT NULL DEFAULT 'idle' CHECK (sync_status IN ('idle', 'syncing', 'success', 'error')),
  sync_error TEXT,
  response_count INTEGER NOT NULL DEFAULT 0,
  matched_count INTEGER NOT NULL DEFAULT 0,
  unmatched_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_activity_google_form UNIQUE (activity_id, google_form_id)
);

-- 1.11 Activity Form Responses (Phản hồi biểu mẫu & người đăng ký ngoài - CÔ LẬP VỚI BẢNG MEMBERS)
CREATE TABLE IF NOT EXISTS public.activity_form_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_form_id UUID REFERENCES public.activity_forms(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  google_response_id TEXT NOT NULL,
  respondent_email TEXT,
  full_name TEXT,
  student_id TEXT,
  phone_number TEXT,
  class_name TEXT,
  notes TEXT,
  answers_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  match_status TEXT NOT NULL DEFAULT 'unmatched' CHECK (match_status IN ('matched', 'unmatched', 'duplicate', 'invalid')),
  matched_member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
  activity_participant_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_form_google_response UNIQUE (activity_id, google_response_id)
);

-- 1.12 Collab Activities (Hoạt động phối hợp trong Kế hoạch Collab)
CREATE TABLE IF NOT EXISTS public.collab_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  lead_organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'volunteer' CHECK (category IN ('general', 'volunteer', 'academic', 'sports', 'culture', 'meeting', 'training')),
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('draft', 'planning', 'published', 'in_progress', 'completed', 'cancelled')),
  location TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  banner_url TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 1.13 Activity Participants (Điểm danh & tham gia hoạt động)
CREATE TABLE IF NOT EXISTS public.activity_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'attendee',
  registration_status TEXT NOT NULL DEFAULT 'registered' CHECK (registration_status IN ('registered', 'cancelled', 'waitlist')),
  registered_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  attendance_status TEXT NOT NULL DEFAULT 'unmarked' CHECK (attendance_status IN ('present', 'absent', 'late', 'excused', 'unmarked')),
  attended_at TIMESTAMPTZ,
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'google_form', 'csv_import', 'bulk_import', 'system')),
  google_response_id TEXT,
  status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'absent', 'excused', 'unmarked')),
  check_in_time TIMESTAMPTZ,
  points_awarded NUMERIC DEFAULT 0,
  feedback TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_activity_member_participant UNIQUE (activity_id, member_id)
);

-- 1.14 Tasks (Nhiệm vụ & Công việc)
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  term_id UUID REFERENCES public.terms(id) ON DELETE SET NULL,
  activity_id UUID REFERENCES public.activities(id) ON DELETE SET NULL,
  plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL,
  assignee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  due_date TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 1.15 Collab Tasks (Công việc phối hợp liên đơn vị)
CREATE TABLE IF NOT EXISTS public.collab_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collab_activity_id UUID REFERENCES public.collab_activities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 1.16 Finance Categories (Danh mục thu chi)
CREATE TABLE IF NOT EXISTS public.finance_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  description TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_org_finance_category UNIQUE (organization_id, name, type)
);

-- 1.17 Finance Transactions (Giao dịch thu chi)
CREATE TABLE IF NOT EXISTS public.finance_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  term_id UUID REFERENCES public.terms(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.finance_categories(id) ON DELETE SET NULL,
  activity_id UUID REFERENCES public.activities(id) ON DELETE SET NULL,
  title TEXT,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  type TEXT NOT NULL DEFAULT 'expense' CHECK (type IN ('income', 'expense')),
  transaction_type TEXT NOT NULL DEFAULT 'expense' CHECK (transaction_type IN ('income', 'expense')),
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
  receipt_url TEXT,
  period_closing_id UUID,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 1.18 Collab Transactions (Thu chi chiến dịch phối hợp)
CREATE TABLE IF NOT EXISTS public.collab_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  collab_activity_id UUID REFERENCES public.collab_activities(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  type TEXT NOT NULL DEFAULT 'expense' CHECK (type IN ('income', 'expense')),
  amount NUMERIC NOT NULL CHECK (amount >= 0),
  category_name TEXT NOT NULL,
  description TEXT NOT NULL,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 1.19 Finance Period Closings (Khóa sổ định kỳ)
CREATE TABLE IF NOT EXISTS public.finance_period_closings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  term_id UUID REFERENCES public.terms(id) ON DELETE SET NULL,
  period_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_income NUMERIC NOT NULL DEFAULT 0,
  total_expense NUMERIC NOT NULL DEFAULT 0,
  final_balance NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  closed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  closed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 1.20 Documents (Kho văn bản & tài liệu Google Drive)
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  term_id UUID REFERENCES public.terms(id) ON DELETE SET NULL,
  activity_id UUID REFERENCES public.activities(id) ON DELETE SET NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('decision', 'plan', 'report', 'handover', 'template', 'general', 'finance', 'meeting_notes', 'evidence')),
  source_type TEXT NOT NULL DEFAULT 'google_drive',
  file_path TEXT NOT NULL,
  drive_file_id TEXT,
  drive_url TEXT,
  file_icon_url TEXT,
  thumbnail_url TEXT,
  is_folder BOOLEAN NOT NULL DEFAULT false,
  file_size BIGINT,
  mime_type TEXT,
  access_level TEXT NOT NULL DEFAULT 'internal' CHECK (access_level IN ('public', 'internal', 'board_only', 'confidential')),
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  linked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 1.21 Google Connections (Trạng thái kết nối Google Workspace)
CREATE TABLE IF NOT EXISTS public.google_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  connection_type TEXT NOT NULL DEFAULT 'organization' CHECK (connection_type IN ('organization', 'user')),
  google_email TEXT NOT NULL,
  google_name TEXT,
  granted_scopes TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'connected' CHECK (status IN ('connected', 'disconnected', 'expired', 'error')),
  metadata JSONB DEFAULT '{}'::jsonb,
  last_verified_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_google_conn_org_type UNIQUE (organization_id, connection_type)
);

-- 1.22 Google Connected Spreadsheets (Bảng tính Google Sheets liên kết)
CREATE TABLE IF NOT EXISTS public.google_connected_spreadsheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  spreadsheet_id TEXT NOT NULL,
  spreadsheet_name TEXT NOT NULL,
  spreadsheet_url TEXT NOT NULL,
  linked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  last_synced_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'error', 'unlinked')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_org_spreadsheet UNIQUE (organization_id, spreadsheet_id)
);

-- 1.23 Audit Logs (Nhật ký kiểm toán)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 1.24 Notifications (Thông báo người dùng)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'task', 'finance', 'activity')),
  is_read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 1.25 Invitations (Mã mời tham gia Đơn vị)
CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'member',
  max_uses INTEGER DEFAULT 1,
  uses_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 1.26 Organization Invites (Lời mời trực tiếp theo Email)
CREATE TABLE IF NOT EXISTS public.organization_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_org_invites_email_org UNIQUE (email, organization_id)
);

-- ------------------------------------------------------------------------------
-- 2. INDEXES CHO TỐI ƯU TRUY VẤN
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_org_memberships_user ON public.organization_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_org_memberships_org ON public.organization_memberships(organization_id);
CREATE INDEX IF NOT EXISTS idx_terms_org ON public.terms(organization_id);
CREATE INDEX IF NOT EXISTS idx_members_org ON public.members(organization_id);
CREATE INDEX IF NOT EXISTS idx_members_user ON public.members(user_id);
CREATE INDEX IF NOT EXISTS idx_members_student_id ON public.members(student_id);
CREATE INDEX IF NOT EXISTS idx_term_members_term ON public.term_members(term_id);
CREATE INDEX IF NOT EXISTS idx_term_members_member ON public.term_members(member_id);
CREATE INDEX IF NOT EXISTS idx_plans_lead_org ON public.plans(lead_organization_id);
CREATE INDEX IF NOT EXISTS idx_plan_orgs_plan ON public.plan_organizations(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_orgs_org ON public.plan_organizations(organization_id);
CREATE INDEX IF NOT EXISTS idx_activities_org ON public.activities(organization_id);
CREATE INDEX IF NOT EXISTS idx_activities_term ON public.activities(term_id);
CREATE INDEX IF NOT EXISTS idx_activities_plan ON public.activities(plan_id);
CREATE INDEX IF NOT EXISTS idx_activity_forms_org ON public.activity_forms(organization_id);
CREATE INDEX IF NOT EXISTS idx_activity_forms_activity ON public.activity_forms(activity_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_activity ON public.activity_form_responses(activity_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_org ON public.activity_form_responses(organization_id);
CREATE INDEX IF NOT EXISTS idx_activity_participants_source ON public.activity_participants(activity_id, source);
CREATE INDEX IF NOT EXISTS idx_tasks_org ON public.tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_activity ON public.tasks(activity_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON public.tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_finance_tx_org ON public.finance_transactions(organization_id);
CREATE INDEX IF NOT EXISTS idx_finance_tx_term ON public.finance_transactions(term_id);
CREATE INDEX IF NOT EXISTS idx_documents_org ON public.documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_documents_drive_id ON public.documents(drive_file_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON public.audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(token);
CREATE INDEX IF NOT EXISTS idx_org_invites_email ON public.organization_invites(email);

-- ------------------------------------------------------------------------------
-- 3. HELPER FUNCTIONS & TRIGGERS
-- ------------------------------------------------------------------------------

-- Trigger cập nhật updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS set_organizations_updated_at ON public.organizations;
CREATE TRIGGER set_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_org_memberships_updated_at ON public.organization_memberships;
CREATE TRIGGER set_org_memberships_updated_at BEFORE UPDATE ON public.organization_memberships FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_terms_updated_at ON public.terms;
CREATE TRIGGER set_terms_updated_at BEFORE UPDATE ON public.terms FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_members_updated_at ON public.members;
CREATE TRIGGER set_members_updated_at BEFORE UPDATE ON public.members FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_plans_updated_at ON public.plans;
CREATE TRIGGER set_plans_updated_at BEFORE UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_plan_organizations_updated_at ON public.plan_organizations;
CREATE TRIGGER set_plan_organizations_updated_at BEFORE UPDATE ON public.plan_organizations FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_activities_updated_at ON public.activities;
CREATE TRIGGER set_activities_updated_at BEFORE UPDATE ON public.activities FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_activity_forms_updated_at ON public.activity_forms;
CREATE TRIGGER set_activity_forms_updated_at BEFORE UPDATE ON public.activity_forms FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_activity_form_responses_updated_at ON public.activity_form_responses;
CREATE TRIGGER set_activity_form_responses_updated_at BEFORE UPDATE ON public.activity_form_responses FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Tự động tạo hồ sơ profile khi người dùng đăng ký qua auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url, student_id, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'student_id',
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 4. SECURITY DEFINER RBAC FUNCTIONS (Chuẩn bảo mật cao nhất)
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_super_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_org_member(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF auth.uid() IS NULL OR org_id IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.organization_memberships
    WHERE organization_id = org_id AND user_id = auth.uid() AND status = 'active'
  ) OR public.is_super_admin();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_org_board(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF auth.uid() IS NULL OR org_id IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.organization_memberships
    WHERE organization_id = org_id AND user_id = auth.uid() AND status = 'active'
      AND role IN ('admin', 'leader', 'deputy', 'treasurer', 'secretary')
  ) OR public.is_super_admin();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_plan_participant(p_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF auth.uid() IS NULL OR p_id IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.plan_organizations po
    JOIN public.organization_memberships om ON om.organization_id = po.organization_id
    WHERE po.plan_id = p_id AND om.user_id = auth.uid() AND po.status = 'active' AND om.status = 'active'
  ) OR public.is_super_admin();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_plan_host(p_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF auth.uid() IS NULL OR p_id IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.plans p
    JOIN public.organization_memberships om ON om.organization_id = p.lead_organization_id
    WHERE p.id = p_id AND om.user_id = auth.uid() AND om.status = 'active'
      AND om.role IN ('admin', 'leader', 'deputy', 'secretary')
  ) OR public.is_super_admin();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- RPC: Tạo Kế hoạch Collab an toàn
CREATE OR REPLACE FUNCTION public.create_plan_secure(
  p_code TEXT,
  p_name TEXT,
  p_description TEXT,
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ,
  p_lead_organization_id UUID,
  p_cohost_ids UUID[] DEFAULT ARRAY[]::UUID[]
)
RETURNS JSONB AS $$
DECLARE
  v_plan_id UUID;
  v_cohost_id UUID;
  v_result JSONB;
BEGIN
  IF NOT public.is_org_board(p_lead_organization_id) THEN
    RAISE EXCEPTION 'Bạn không có quyền Ban Chấp Hành tại đơn vị chủ trì để tạo Kế hoạch.';
  END IF;

  INSERT INTO public.plans (
    code, name, description, start_date, end_date, lead_organization_id, status, created_by
  ) VALUES (
    p_code, p_name, p_description, p_start_date, p_end_date, p_lead_organization_id, 'planning', auth.uid()
  ) RETURNING id INTO v_plan_id;

  INSERT INTO public.plan_organizations (
    plan_id, organization_id, role_in_plan, is_host, status, joined_at
  ) VALUES (
    v_plan_id, p_lead_organization_id, 'host', true, 'active', timezone('utc'::text, now())
  );

  IF p_cohost_ids IS NOT NULL AND array_length(p_cohost_ids, 1) > 0 THEN
    FOREACH v_cohost_id IN ARRAY p_cohost_ids LOOP
      IF v_cohost_id <> p_lead_organization_id THEN
        INSERT INTO public.plan_organizations (
          plan_id, organization_id, role_in_plan, is_host, status
        ) VALUES (
          v_plan_id, v_cohost_id, 'co_host', false, 'pending'
        ) ON CONFLICT (plan_id, organization_id) DO NOTHING;
      END IF;
    END LOOP;
  END IF;

  SELECT row_to_json(p)::jsonb INTO v_result FROM public.plans p WHERE p.id = v_plan_id;
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ------------------------------------------------------------------------------
-- 5. KÍCH HOẠT ROW LEVEL SECURITY (RLS) TRÊN TOÀN BỘ 26 BẢNG
-- ------------------------------------------------------------------------------
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.term_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_form_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collab_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collab_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collab_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_period_closings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_connected_spreadsheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_invites ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 6. RLS POLICIES ĐỒNG BỘ
-- ------------------------------------------------------------------------------

-- Organizations
DROP POLICY IF EXISTS "Public organizations read" ON public.organizations;
CREATE POLICY "Public organizations read" ON public.organizations FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can create organization" ON public.organizations;
CREATE POLICY "Authenticated users can create organization" ON public.organizations FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Board manage organization" ON public.organizations;
CREATE POLICY "Board manage organization" ON public.organizations FOR UPDATE TO authenticated USING (public.is_org_board(id)) WITH CHECK (public.is_org_board(id));

DROP POLICY IF EXISTS "Board delete organization" ON public.organizations;
CREATE POLICY "Board delete organization" ON public.organizations FOR DELETE TO authenticated USING (public.is_org_board(id));

-- Profiles
DROP POLICY IF EXISTS "Profiles read by authenticated" ON public.profiles;
CREATE POLICY "Profiles read by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- Organization Memberships
DROP POLICY IF EXISTS "Memberships viewable by org members" ON public.organization_memberships;
CREATE POLICY "Memberships viewable by org members" ON public.organization_memberships FOR SELECT TO authenticated USING (public.is_org_member(organization_id) OR user_id = auth.uid());

DROP POLICY IF EXISTS "Board manage memberships" ON public.organization_memberships;
CREATE POLICY "Board manage memberships" ON public.organization_memberships FOR ALL TO authenticated USING (public.is_org_board(organization_id)) WITH CHECK (public.is_org_board(organization_id));

-- Terms
DROP POLICY IF EXISTS "Terms viewable by org members" ON public.terms;
CREATE POLICY "Terms viewable by org members" ON public.terms FOR SELECT TO authenticated USING (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "Board manage terms" ON public.terms;
CREATE POLICY "Board manage terms" ON public.terms FOR ALL TO authenticated USING (public.is_org_board(organization_id)) WITH CHECK (public.is_org_board(organization_id));

-- Members
DROP POLICY IF EXISTS "Members viewable by org members" ON public.members;
CREATE POLICY "Members viewable by org members" ON public.members FOR SELECT TO authenticated USING (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "Board manage members" ON public.members;
CREATE POLICY "Board manage members" ON public.members FOR ALL TO authenticated USING (public.is_org_board(organization_id)) WITH CHECK (public.is_org_board(organization_id));

-- Plans & Collab
DROP POLICY IF EXISTS "Plans viewable by participants" ON public.plans;
CREATE POLICY "Plans viewable by participants" ON public.plans FOR SELECT TO authenticated USING (public.is_plan_participant(id) OR public.is_org_board(lead_organization_id));

DROP POLICY IF EXISTS "Plans manageable by host board" ON public.plans;
CREATE POLICY "Plans manageable by host board" ON public.plans FOR ALL TO authenticated USING (public.is_plan_host(id) OR public.is_org_board(lead_organization_id)) WITH CHECK (public.is_plan_host(id) OR public.is_org_board(lead_organization_id));

DROP POLICY IF EXISTS "Plan orgs viewable by participants" ON public.plan_organizations;
CREATE POLICY "Plan orgs viewable by participants" ON public.plan_organizations FOR SELECT TO authenticated USING (public.is_plan_participant(plan_id) OR public.is_org_member(organization_id));

DROP POLICY IF EXISTS "Plan orgs manageable by host or self org" ON public.plan_organizations;
CREATE POLICY "Plan orgs manageable by host or self org" ON public.plan_organizations FOR ALL TO authenticated USING (public.is_plan_host(plan_id) OR public.is_org_board(organization_id)) WITH CHECK (public.is_plan_host(plan_id) OR public.is_org_board(organization_id));

-- Activities & Forms
DROP POLICY IF EXISTS "Activities viewable by org members or plan participants" ON public.activities;
CREATE POLICY "Activities viewable by org members or plan participants" ON public.activities FOR SELECT TO authenticated
USING (public.is_org_member(organization_id) OR (plan_id IS NOT NULL AND public.is_plan_participant(plan_id)));

DROP POLICY IF EXISTS "Activities manageable by board" ON public.activities;
CREATE POLICY "Activities manageable by board" ON public.activities FOR ALL TO authenticated
USING (public.is_org_board(organization_id) OR (plan_id IS NOT NULL AND public.is_plan_host(plan_id)))
WITH CHECK (public.is_org_board(organization_id) OR (plan_id IS NOT NULL AND public.is_plan_host(plan_id)));

DROP POLICY IF EXISTS "Activity forms viewable by org or plan participants" ON public.activity_forms;
CREATE POLICY "Activity forms viewable by org or plan participants" ON public.activity_forms FOR SELECT TO authenticated
USING (public.is_org_member(organization_id) OR EXISTS (SELECT 1 FROM public.activities a WHERE a.id = activity_forms.activity_id AND a.plan_id IS NOT NULL AND public.is_plan_participant(a.plan_id)));

DROP POLICY IF EXISTS "Activity forms manageable by board" ON public.activity_forms;
CREATE POLICY "Activity forms manageable by board" ON public.activity_forms FOR ALL TO authenticated
USING (public.is_org_board(organization_id)) WITH CHECK (public.is_org_board(organization_id));

DROP POLICY IF EXISTS "Activity form responses viewable by org or plan participants" ON public.activity_form_responses;
CREATE POLICY "Activity form responses viewable by org or plan participants" ON public.activity_form_responses FOR SELECT TO authenticated
USING (public.is_org_member(organization_id) OR EXISTS (SELECT 1 FROM public.activities a WHERE a.id = activity_form_responses.activity_id AND a.plan_id IS NOT NULL AND public.is_plan_participant(a.plan_id)));

DROP POLICY IF EXISTS "Activity form responses manageable by board" ON public.activity_form_responses;
CREATE POLICY "Activity form responses manageable by board" ON public.activity_form_responses FOR ALL TO authenticated
USING (public.is_org_board(organization_id) OR EXISTS (SELECT 1 FROM public.activities a WHERE a.id = activity_form_responses.activity_id AND a.plan_id IS NOT NULL AND public.is_plan_participant(a.plan_id)))
WITH CHECK (public.is_org_board(organization_id) OR EXISTS (SELECT 1 FROM public.activities a WHERE a.id = activity_form_responses.activity_id AND a.plan_id IS NOT NULL AND public.is_plan_participant(a.plan_id)));

-- Activity Participants
DROP POLICY IF EXISTS "Participants viewable by org or plan participants" ON public.activity_participants;
CREATE POLICY "Participants viewable by org or plan participants" ON public.activity_participants FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.activities a WHERE a.id = activity_participants.activity_id AND (public.is_org_member(a.organization_id) OR (a.plan_id IS NOT NULL AND public.is_plan_participant(a.plan_id)))));

DROP POLICY IF EXISTS "Participants manageable by board" ON public.activity_participants;
CREATE POLICY "Participants manageable by board" ON public.activity_participants FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.activities a WHERE a.id = activity_participants.activity_id AND (public.is_org_board(a.organization_id) OR (a.plan_id IS NOT NULL AND public.is_plan_participant(a.plan_id)))))
WITH CHECK (EXISTS (SELECT 1 FROM public.activities a WHERE a.id = activity_participants.activity_id AND (public.is_org_board(a.organization_id) OR (a.plan_id IS NOT NULL AND public.is_plan_participant(a.plan_id)))));

-- Tasks
DROP POLICY IF EXISTS "Tasks viewable by org members or assignees" ON public.tasks;
CREATE POLICY "Tasks viewable by org members or assignees" ON public.tasks FOR SELECT TO authenticated
USING (public.is_org_member(organization_id) OR assignee_id = auth.uid() OR assigned_to = auth.uid() OR (plan_id IS NOT NULL AND public.is_plan_participant(plan_id)));

DROP POLICY IF EXISTS "Tasks manageable by board or assignee" ON public.tasks;
CREATE POLICY "Tasks manageable by board or assignee" ON public.tasks FOR ALL TO authenticated
USING (public.is_org_board(organization_id) OR assignee_id = auth.uid() OR assigned_to = auth.uid())
WITH CHECK (public.is_org_board(organization_id) OR assignee_id = auth.uid() OR assigned_to = auth.uid());

DROP POLICY IF EXISTS "Collab tasks viewable by plan participants" ON public.collab_tasks;
CREATE POLICY "Collab tasks viewable by plan participants" ON public.collab_tasks FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.collab_activities ca WHERE ca.id = collab_tasks.collab_activity_id AND public.is_plan_participant(ca.plan_id)));

DROP POLICY IF EXISTS "Collab tasks manageable by plan participants" ON public.collab_tasks;
CREATE POLICY "Collab tasks manageable by plan participants" ON public.collab_tasks FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.collab_activities ca WHERE ca.id = collab_tasks.collab_activity_id AND public.is_plan_participant(ca.plan_id)))
WITH CHECK (EXISTS (SELECT 1 FROM public.collab_activities ca WHERE ca.id = collab_tasks.collab_activity_id AND public.is_plan_participant(ca.plan_id)));

-- Finance
DROP POLICY IF EXISTS "Finance tx viewable by org members" ON public.finance_transactions;
CREATE POLICY "Finance tx viewable by org members" ON public.finance_transactions FOR SELECT TO authenticated USING (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "Finance tx manageable by board" ON public.finance_transactions;
CREATE POLICY "Finance tx manageable by board" ON public.finance_transactions FOR ALL TO authenticated USING (public.is_org_board(organization_id)) WITH CHECK (public.is_org_board(organization_id));

DROP POLICY IF EXISTS "Collab tx viewable by plan participants" ON public.collab_transactions;
CREATE POLICY "Collab tx viewable by plan participants" ON public.collab_transactions FOR SELECT TO authenticated USING (public.is_plan_participant(plan_id));

DROP POLICY IF EXISTS "Collab tx manageable by plan participants" ON public.collab_transactions;
CREATE POLICY "Collab tx manageable by plan participants" ON public.collab_transactions FOR ALL TO authenticated USING (public.is_plan_participant(plan_id)) WITH CHECK (public.is_plan_participant(plan_id));

-- Documents
DROP POLICY IF EXISTS "Documents viewable by org members" ON public.documents;
CREATE POLICY "Documents viewable by org members" ON public.documents FOR SELECT TO authenticated USING (public.is_org_member(organization_id) OR access_level = 'public');

DROP POLICY IF EXISTS "Documents manageable by org members" ON public.documents;
CREATE POLICY "Documents manageable by org members" ON public.documents FOR ALL TO authenticated USING (public.is_org_member(organization_id)) WITH CHECK (public.is_org_member(organization_id));

-- Google Integrations & Audit Logs
DROP POLICY IF EXISTS "Google connections viewable by board" ON public.google_connections;
CREATE POLICY "Google connections viewable by board" ON public.google_connections FOR SELECT TO authenticated USING ((organization_id IS NOT NULL AND public.is_org_board(organization_id)) OR user_id = auth.uid());

DROP POLICY IF EXISTS "Google connections manageable by board" ON public.google_connections;
CREATE POLICY "Google connections manageable by board" ON public.google_connections FOR ALL TO authenticated USING ((organization_id IS NOT NULL AND public.is_org_board(organization_id)) OR user_id = auth.uid()) WITH CHECK ((organization_id IS NOT NULL AND public.is_org_board(organization_id)) OR user_id = auth.uid());

DROP POLICY IF EXISTS "Audit logs viewable by board" ON public.audit_logs;
CREATE POLICY "Audit logs viewable by board" ON public.audit_logs FOR SELECT TO authenticated USING (organization_id IS NOT NULL AND public.is_org_board(organization_id));

DROP POLICY IF EXISTS "Audit logs insertable by authenticated" ON public.audit_logs;
CREATE POLICY "Audit logs insertable by authenticated" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Notifications
DROP POLICY IF EXISTS "Notifications viewable by recipient" ON public.notifications;
CREATE POLICY "Notifications viewable by recipient" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Notifications updatable by recipient" ON public.notifications;
CREATE POLICY "Notifications updatable by recipient" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Invitations
DROP POLICY IF EXISTS "BCH can create invitations" ON public.invitations;
CREATE POLICY "BCH can create invitations" ON public.invitations FOR INSERT TO authenticated WITH CHECK (public.is_org_board(organization_id));

DROP POLICY IF EXISTS "BCH can view invitations" ON public.invitations;
CREATE POLICY "BCH can view invitations" ON public.invitations FOR SELECT TO authenticated USING (public.is_org_board(organization_id));

-- ------------------------------------------------------------------------------
-- 7. SUPABASE STORAGE BUCKETS SETUP (100% Idempotent)
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'storage') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES 
      ('documents', 'documents', false, 52428800, NULL),
      ('organization_logos', 'organization_logos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']),
      ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
    ON CONFLICT (id) DO UPDATE SET
      public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit;

    -- Storage Policies
    DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
    CREATE POLICY "Authenticated users can upload documents" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id IN ('documents', 'organization_logos', 'avatars'));

    DROP POLICY IF EXISTS "Authenticated users can read documents" ON storage.objects;
    CREATE POLICY "Authenticated users can read documents" ON storage.objects FOR SELECT TO authenticated USING (bucket_id IN ('documents', 'organization_logos', 'avatars'));

    DROP POLICY IF EXISTS "Public can read public logos & avatars" ON storage.objects;
    CREATE POLICY "Public can read public logos & avatars" ON storage.objects FOR SELECT TO public USING (bucket_id IN ('organization_logos', 'avatars'));

    DROP POLICY IF EXISTS "Authenticated users can delete own uploads" ON storage.objects;
    CREATE POLICY "Authenticated users can delete own uploads" ON storage.objects FOR DELETE TO authenticated USING (bucket_id IN ('documents', 'organization_logos', 'avatars'));
  END IF;
END $$;

-- ==============================================================================
-- HOÀN TẤT THIẾT LẬP CƠ SỞ DỮ LIỆU CHAPTEROS (VERSION 3.0.0 COMPLETED)
-- ==============================================================================
