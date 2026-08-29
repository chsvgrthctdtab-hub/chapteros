-- ==============================================================================
-- CHI HỘI MANAGER - DOMAIN MODEL & SUPABASE DATABASE INITIAL SCHEMA
-- Version: 1.0.0
-- Description: Centralized management system for student chapters (Chi hội sinh viên)
-- ==============================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Define custom ENUM types if not exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'organization_role') THEN
    CREATE TYPE public.organization_role AS ENUM ('admin', 'leader', 'deputy', 'treasurer', 'secretary', 'member');
  END IF;
END $$;

-- ==============================================================================
-- 1. HELPER TRIGGER FUNCTIONS
-- ==============================================================================

-- Trigger function for auto-updating `updated_at` timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ==============================================================================
-- 2. CORE TABLES
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- Table: organizations (Chi hội)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL DEFAULT 'chi_hoi',
  parent_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  description TEXT,
  logo_url TEXT,
  finance_approval_threshold NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TRIGGER set_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- Table: profiles (Thông tin người dùng hệ thống - liên kết auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  student_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- Table: organization_memberships (Quan hệ User <-> Chi hội và Phân quyền Role)
-- ------------------------------------------------------------------------------
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

CREATE TRIGGER set_org_memberships_updated_at
  BEFORE UPDATE ON public.organization_memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- Table: terms (Nhiệm kỳ Chi hội)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
  is_current BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_terms_org_name UNIQUE (organization_id, name),
  CONSTRAINT chk_term_dates CHECK (end_date >= start_date)
);

CREATE TRIGGER set_terms_updated_at
  BEFORE UPDATE ON public.terms
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- Table: members (Hồ sơ hội viên Chi hội)
-- Phân biệt giữa user account hệ thống và hồ sơ hội viên
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  student_id TEXT,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  class_name TEXT,
  major TEXT,
  cohort TEXT,
  position TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'alumni')),
  joined_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_org_student_id UNIQUE (organization_id, student_id),
  CONSTRAINT uq_org_user_member UNIQUE (organization_id, user_id)
);

CREATE TRIGGER set_members_updated_at
  BEFORE UPDATE ON public.members
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- Table: term_members (Quan hệ Hội viên <-> Nhiệm kỳ - lưu vết lịch sử)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.term_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term_id UUID NOT NULL REFERENCES public.terms(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  position TEXT NOT NULL DEFAULT 'Hội viên',
  department TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'leave', 'completed', 'resigned')),
  joined_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_term_member UNIQUE (term_id, member_id)
);

CREATE TRIGGER set_term_members_updated_at
  BEFORE UPDATE ON public.term_members
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- Table: activities (Hoạt động / Sự kiện)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  term_id UUID NOT NULL REFERENCES public.terms(id) ON DELETE CASCADE,
  code TEXT,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'volunteer', 'academic', 'sports', 'culture', 'meeting', 'training')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'planning', 'published', 'in_progress', 'completed', 'cancelled')),
  location TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  target_members INTEGER DEFAULT 0,
  banner_url TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT chk_activity_dates CHECK (end_date >= start_date)
);

CREATE TRIGGER set_activities_updated_at
  BEFORE UPDATE ON public.activities
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- Table: activity_participants (Điểm danh & Tham gia hoạt động)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.activity_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  registration_status TEXT NOT NULL DEFAULT 'registered' CHECK (registration_status IN ('registered', 'confirmed', 'cancelled', 'waitlist')),
  registered_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  attendance_status TEXT NOT NULL DEFAULT 'unmarked' CHECK (attendance_status IN ('unmarked', 'present', 'absent', 'excused')),
  attended_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_activity_member_participant UNIQUE (activity_id, member_id)
);

CREATE TRIGGER set_activity_participants_updated_at
  BEFORE UPDATE ON public.activity_participants
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- Table: tasks (Công việc / Phân công nhiệm vụ)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  term_id UUID NOT NULL REFERENCES public.terms(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES public.activities(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'in_review', 'completed', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  due_date TIMESTAMPTZ,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TRIGGER set_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- Table: finance_categories (Danh mục Thu / Chi)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.finance_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_org_finance_category UNIQUE (organization_id, name, type)
);

CREATE TRIGGER set_finance_categories_updated_at
  BEFORE UPDATE ON public.finance_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- Table: finance_transactions (Giao dịch tài chính)
-- Số dư quỹ được tính động từ SUM(income) - SUM(expense), không lưu cứng số dư
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.finance_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  term_id UUID NOT NULL REFERENCES public.terms(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.finance_categories(id) ON DELETE RESTRICT,
  activity_id UUID REFERENCES public.activities(id) ON DELETE SET NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('income', 'expense')),
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_url TEXT,
  recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TRIGGER set_finance_transactions_updated_at
  BEFORE UPDATE ON public.finance_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- Table: documents (Metadata tài liệu - File lưu trên Supabase Storage)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  term_id UUID REFERENCES public.terms(id) ON DELETE SET NULL,
  activity_id UUID REFERENCES public.activities(id) ON DELETE SET NULL,
  member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'resolution', 'decision', 'plan', 'report', 'template', 'handover', 'financial_receipt')),
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  access_level TEXT NOT NULL DEFAULT 'internal' CHECK (access_level IN ('public', 'internal', 'board_only', 'admin_only')),
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TRIGGER set_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 3. PERFORMANCE INDEXES
-- ==============================================================================

-- Organizations & Memberships
CREATE INDEX IF NOT EXISTS idx_memberships_user_org ON public.organization_memberships(user_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_memberships_org_role ON public.organization_memberships(organization_id, role);

-- Terms & Members
CREATE INDEX IF NOT EXISTS idx_terms_org_status ON public.terms(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_members_org ON public.members(organization_id);
CREATE INDEX IF NOT EXISTS idx_members_user_id ON public.members(user_id);
CREATE INDEX IF NOT EXISTS idx_members_student_id ON public.members(student_id);
CREATE INDEX IF NOT EXISTS idx_term_members_term_id ON public.term_members(term_id);
CREATE INDEX IF NOT EXISTS idx_term_members_member_id ON public.term_members(member_id);

-- Activities & Participants
CREATE INDEX IF NOT EXISTS idx_activities_org_term ON public.activities(organization_id, term_id);
CREATE INDEX IF NOT EXISTS idx_activities_status_date ON public.activities(status, start_date);
CREATE INDEX IF NOT EXISTS idx_activity_participants_act ON public.activity_participants(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_participants_member ON public.activity_participants(member_id);

-- Tasks
CREATE INDEX IF NOT EXISTS idx_tasks_org_term ON public.tasks(organization_id, term_id);
CREATE INDEX IF NOT EXISTS idx_tasks_activity_id ON public.tasks(activity_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status_priority ON public.tasks(status, priority);

-- Finance
CREATE INDEX IF NOT EXISTS idx_finance_categories_org ON public.finance_categories(organization_id);
CREATE INDEX IF NOT EXISTS idx_finance_tx_org_term ON public.finance_transactions(organization_id, term_id);
CREATE INDEX IF NOT EXISTS idx_finance_tx_category ON public.finance_transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_finance_tx_date ON public.finance_transactions(transaction_date);

-- Documents
CREATE INDEX IF NOT EXISTS idx_documents_org_term ON public.documents(organization_id, term_id);
CREATE INDEX IF NOT EXISTS idx_documents_activity ON public.documents(activity_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON public.documents(category);

-- ==============================================================================
-- 4. AUTH TRIGGER FOR PROFILES
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL)
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 5. ROW LEVEL SECURITY (RLS) HELPER FUNCTIONS
-- ==============================================================================

-- Check if current authenticated user is an active member of organization
CREATE OR REPLACE FUNCTION public.is_org_member(target_org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.organization_memberships
    WHERE organization_id = target_org_id
      AND user_id = auth.uid()
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE;

-- Check if current user has any of the specified roles in organization
CREATE OR REPLACE FUNCTION public.has_org_role(target_org_id UUID, allowed_roles TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.organization_memberships
    WHERE organization_id = target_org_id
      AND user_id = auth.uid()
      AND status = 'active'
      AND role = ANY(allowed_roles)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE;

-- Check if current user is an admin or leader of organization
CREATE OR REPLACE FUNCTION public.is_org_admin(target_org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.has_org_role(target_org_id, ARRAY['admin', 'leader']);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE;

-- Check if current user is part of executive board (BCH)
CREATE OR REPLACE FUNCTION public.is_org_board(target_org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.has_org_role(target_org_id, ARRAY['admin', 'leader', 'deputy', 'treasurer', 'secretary']);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE;

-- Compatibility aliases
CREATE OR REPLACE FUNCTION public.user_belongs_to_org(target_org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.is_org_member(target_org_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE;

CREATE OR REPLACE FUNCTION public.user_has_org_role(target_org_id UUID, allowed_roles TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.has_org_role(target_org_id, allowed_roles);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE;

-- ==============================================================================
-- 6. ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ==============================================================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.term_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 7. RLS POLICIES
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- Profiles Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ------------------------------------------------------------------------------
-- Organizations Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can view organizations they belong to"
  ON public.organizations FOR SELECT
  TO authenticated
  USING (public.is_org_member(id));

CREATE POLICY "Authenticated users can create organization"
  ON public.organizations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update organization"
  ON public.organizations FOR UPDATE
  TO authenticated
  USING (public.is_org_admin(id))
  WITH CHECK (public.is_org_admin(id));

-- ------------------------------------------------------------------------------
-- Organization Memberships Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Members can view memberships in same organization"
  ON public.organization_memberships FOR SELECT
  TO authenticated
  USING (public.is_org_member(organization_id) OR user_id = auth.uid());

CREATE POLICY "Admins can manage organization memberships"
  ON public.organization_memberships FOR ALL
  TO authenticated
  USING (public.is_org_admin(organization_id))
  WITH CHECK (public.is_org_admin(organization_id));

CREATE POLICY "Authenticated users can create initial membership as admin"
  ON public.organization_memberships FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM public.organization_memberships
      WHERE organization_id = public.organization_memberships.organization_id
    )
  );

-- ------------------------------------------------------------------------------
-- Terms Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Members can view terms of their organization"
  ON public.terms FOR SELECT
  TO authenticated
  USING (public.is_org_member(organization_id));

CREATE POLICY "Board can manage terms"
  ON public.terms FOR ALL
  TO authenticated
  USING (public.is_org_board(organization_id))
  WITH CHECK (public.is_org_board(organization_id));

-- ------------------------------------------------------------------------------
-- Members & Term Members Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Members can view chapter member roster"
  ON public.members FOR SELECT
  TO authenticated
  USING (public.is_org_member(organization_id));

CREATE POLICY "Board can manage chapter members"
  ON public.members FOR ALL
  TO authenticated
  USING (public.is_org_board(organization_id))
  WITH CHECK (public.is_org_board(organization_id));

CREATE POLICY "Members can view term member assignments"
  ON public.term_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.terms t
      WHERE t.id = term_members.term_id
        AND public.is_org_member(t.organization_id)
    )
  );

CREATE POLICY "Board can manage term members"
  ON public.term_members FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.terms t
      WHERE t.id = term_members.term_id
        AND public.is_org_board(t.organization_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.terms t
      WHERE t.id = term_members.term_id
        AND public.is_org_board(t.organization_id)
    )
  );

-- ------------------------------------------------------------------------------
-- Activities & Participants Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Members can view activities in organization"
  ON public.activities FOR SELECT
  TO authenticated
  USING (public.is_org_member(organization_id));

CREATE POLICY "Board can manage activities"
  ON public.activities FOR ALL
  TO authenticated
  USING (public.is_org_board(organization_id))
  WITH CHECK (public.is_org_board(organization_id));

CREATE POLICY "Members can view activity participants"
  ON public.activity_participants FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.activities a
      WHERE a.id = activity_participants.activity_id
        AND public.is_org_member(a.organization_id)
    )
  );

CREATE POLICY "Board can manage activity participants"
  ON public.activity_participants FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.activities a
      WHERE a.id = activity_participants.activity_id
        AND public.is_org_board(a.organization_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.activities a
      WHERE a.id = activity_participants.activity_id
        AND public.is_org_board(a.organization_id)
    )
  );

-- ------------------------------------------------------------------------------
-- Tasks Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Members can view tasks in organization"
  ON public.tasks FOR SELECT
  TO authenticated
  USING (public.is_org_member(organization_id));

CREATE POLICY "Board can manage all tasks"
  ON public.tasks FOR ALL
  TO authenticated
  USING (public.is_org_board(organization_id))
  WITH CHECK (public.is_org_board(organization_id));

CREATE POLICY "Assignees can update their task status and progress"
  ON public.tasks FOR UPDATE
  TO authenticated
  USING (assigned_to = auth.uid() AND public.is_org_member(organization_id))
  WITH CHECK (assigned_to = auth.uid() AND public.is_org_member(organization_id));

-- ------------------------------------------------------------------------------
-- Finance Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Members can view finance categories"
  ON public.finance_categories FOR SELECT
  TO authenticated
  USING (public.is_org_member(organization_id));

CREATE POLICY "Board and Treasurer can manage finance categories"
  ON public.finance_categories FOR ALL
  TO authenticated
  USING (public.has_org_role(organization_id, ARRAY['admin', 'leader', 'treasurer']))
  WITH CHECK (public.has_org_role(organization_id, ARRAY['admin', 'leader', 'treasurer']));

CREATE POLICY "Members can view finance transactions"
  ON public.finance_transactions FOR SELECT
  TO authenticated
  USING (public.is_org_member(organization_id));

CREATE POLICY "Treasurer and Admin can manage finance transactions"
  ON public.finance_transactions FOR ALL
  TO authenticated
  USING (public.has_org_role(organization_id, ARRAY['admin', 'leader', 'treasurer']))
  WITH CHECK (public.has_org_role(organization_id, ARRAY['admin', 'leader', 'treasurer']));

-- ------------------------------------------------------------------------------
-- Documents Policies
-- ------------------------------------------------------------------------------
CREATE POLICY "Users can view documents based on access level"
  ON public.documents FOR SELECT
  TO authenticated
  USING (
    public.is_org_member(organization_id)
    AND (
      access_level IN ('public', 'internal')
      OR (access_level = 'board_only' AND public.is_org_board(organization_id))
      OR (access_level = 'admin_only' AND public.is_org_admin(organization_id))
      OR uploaded_by = auth.uid()
    )
  );

CREATE POLICY "Board and uploaders can create documents"
  ON public.documents FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_org_member(organization_id)
    AND (public.is_org_board(organization_id) OR uploaded_by = auth.uid())
  );

CREATE POLICY "Board and owners can manage documents"
  ON public.documents FOR ALL
  TO authenticated
  USING (
    public.is_org_board(organization_id) OR uploaded_by = auth.uid()
  )
  WITH CHECK (
    public.is_org_board(organization_id) OR uploaded_by = auth.uid()
  );

-- ------------------------------------------------------------------------------
-- Trigger: Handle new Organization Creator Membership
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_organization()
RETURNS TRIGGER AS $$
DECLARE
  creator_profile RECORD;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    -- Bước A: Tạo membership với quyền Admin cho người khởi tạo Chi hội
    INSERT INTO public.organization_memberships (
      organization_id,
      user_id,
      role,
      status
    )
    VALUES (
      NEW.id,
      auth.uid(),
      'admin',
      'active'
    )
    ON CONFLICT (organization_id, user_id) DO NOTHING;

    -- Bước B: Lấy thông tin từ profiles của người tạo và tạo hồ sơ hội viên (members)
    SELECT * INTO creator_profile
    FROM public.profiles
    WHERE id = auth.uid();

    IF FOUND THEN
      INSERT INTO public.members (
        organization_id,
        user_id,
        student_id,
        full_name,
        email,
        phone,
        status,
        joined_date
      )
      VALUES (
        NEW.id,
        auth.uid(),
        creator_profile.student_id,
        COALESCE(creator_profile.full_name, 'Quản trị viên'),
        creator_profile.email,
        creator_profile.phone,
        'active',
        CURRENT_DATE
      )
      ON CONFLICT (organization_id, user_id) DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_organization_created ON public.organizations;
CREATE TRIGGER on_organization_created
  AFTER INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_organization();

-- ------------------------------------------------------------------------------
-- Trigger: Handle Profile Updates (Sync profiles -> members across all organizations)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_profile_updated()
RETURNS TRIGGER AS $$
BEGIN
  -- Kiểm tra trùng lặp Mã số sinh viên (MSSV) nếu student_id thay đổi và không rỗng
  IF NEW.student_id IS NOT NULL AND (OLD.student_id IS DISTINCT FROM NEW.student_id) THEN
    IF EXISTS (
      SELECT 1
      FROM public.members m_user
      JOIN public.members m_other 
        ON m_user.organization_id = m_other.organization_id
      WHERE m_user.user_id = NEW.id
        AND m_other.user_id IS DISTINCT FROM NEW.id
        AND UPPER(TRIM(m_other.student_id)) = UPPER(TRIM(NEW.student_id))
    ) THEN
      RAISE EXCEPTION 'Mã số sinh viên "%" đã được sử dụng bởi một hội viên khác trong Chi hội. Vui lòng kiểm tra lại MSSV.', NEW.student_id
        USING ERRCODE = 'unique_violation';
    END IF;
  END IF;

  -- Đồng bộ các trường thông tin cá nhân sang members của user (ở tất cả Chi hội)
  UPDATE public.members
  SET 
    full_name = NEW.full_name,
    email = NEW.email,
    phone = NEW.phone,
    student_id = NEW.student_id,
    updated_at = timezone('utc'::text, now())
  WHERE user_id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (
    OLD.full_name IS DISTINCT FROM NEW.full_name
    OR OLD.email IS DISTINCT FROM NEW.email
    OR OLD.phone IS DISTINCT FROM NEW.phone
    OR OLD.student_id IS DISTINCT FROM NEW.student_id
  )
  EXECUTE FUNCTION public.handle_profile_updated();


-- ==============================================================================
-- Supabase Storage Configuration & Policies for Chi Hội Manager
-- Bucket: 'documents' (Private organization-scoped documents)
-- ==============================================================================

-- 1. Create Private Storage Bucket for Chi Hội Documents if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  52428800, -- 50MB max file size
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'text/plain',
    'text/csv',
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed',
    'application/json'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 52428800;

-- 2. Storage RLS Policies for 'documents' bucket
-- Storage objects path convention: organizations/{organizationId}/...

-- Policy 2.1: Users can download/view files if they belong to the organization
CREATE POLICY "Org members can read documents in storage"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents'
  AND (
    -- Path format: organizations/<org_id>/...
    (storage.foldername(name))[1] = 'organizations'
    AND public.is_org_member(((storage.foldername(name))[2])::uuid)
  )
);

-- Policy 2.2: Org members can upload files into their organization folder
CREATE POLICY "Org members can upload documents to storage"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents'
  AND (
    (storage.foldername(name))[1] = 'organizations'
    AND public.is_org_member(((storage.foldername(name))[2])::uuid)
  )
);

-- Policy 2.3: Board or file owner can update storage objects
CREATE POLICY "Board and owners can update documents in storage"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documents'
  AND (
    (storage.foldername(name))[1] = 'organizations'
    AND (
      public.is_org_board(((storage.foldername(name))[2])::uuid)
      OR owner = auth.uid()
    )
  )
)
WITH CHECK (
  bucket_id = 'documents'
  AND (
    (storage.foldername(name))[1] = 'organizations'
    AND (
      public.is_org_board(((storage.foldername(name))[2])::uuid)
      OR owner = auth.uid()
    )
  )
);

-- Policy 2.4: Board or file owner can delete storage objects
CREATE POLICY "Board and owners can delete documents from storage"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents'
  AND (
    (storage.foldername(name))[1] = 'organizations'
    AND (
      public.is_org_board(((storage.foldername(name))[2])::uuid)
      OR owner = auth.uid()
    )
  )
);

-- ==============================================================================
-- CHI HỘI MANAGER - GOOGLE INTEGRATION FOUNDATION SCHEMA
-- Version: 1.1.0 (Phase 9)
-- Description: Google Identity & Integration connections table, RLS policies and audit
-- ==============================================================================

-- ==============================================================================
-- 1. Table: google_connections
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.google_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  connection_type TEXT NOT NULL DEFAULT 'user' CHECK (connection_type IN ('user', 'organization')),
  google_account_id TEXT,
  google_email TEXT NOT NULL,
  google_name TEXT,
  google_avatar_url TEXT,
  status TEXT NOT NULL DEFAULT 'connected' CHECK (status IN ('not_connected', 'connected', 'expired', 'revoked', 'error')),
  granted_scopes TEXT[] NOT NULL DEFAULT '{}',
  token_expires_at TIMESTAMPTZ,
  last_verified_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  error_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Unique index to ensure 1 user connection per user and 1 org connection per org
CREATE UNIQUE INDEX IF NOT EXISTS uq_google_conn_user 
  ON public.google_connections(user_id) 
  WHERE connection_type = 'user';

CREATE UNIQUE INDEX IF NOT EXISTS uq_google_conn_org 
  ON public.google_connections(organization_id) 
  WHERE connection_type = 'organization';

-- Auto-update updated_at timestamp trigger
CREATE TRIGGER set_google_connections_updated_at
  BEFORE UPDATE ON public.google_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 2. PERFORMANCE INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_google_conn_user_id ON public.google_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_google_conn_org_id ON public.google_connections(organization_id);
CREATE INDEX IF NOT EXISTS idx_google_conn_status ON public.google_connections(status);
CREATE INDEX IF NOT EXISTS idx_google_conn_email ON public.google_connections(google_email);

-- ==============================================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE public.google_connections ENABLE ROW LEVEL SECURITY;

-- SELECT Policy
-- 1. Users can view their own personal Google connection
-- 2. Active members of an organization can view the organization's Google connection
CREATE POLICY "Users can view relevant google connections"
  ON public.google_connections FOR SELECT
  TO authenticated
  USING (
    (connection_type = 'user' AND user_id = auth.uid())
    OR
    (connection_type = 'organization' AND organization_id IS NOT NULL AND public.is_org_member(organization_id))
  );

-- INSERT Policy
-- 1. Users can create their own personal connection
-- 2. Organization board/admin can create organization-level connection
CREATE POLICY "Users and board can insert google connections"
  ON public.google_connections FOR INSERT
  TO authenticated
  WITH CHECK (
    (connection_type = 'user' AND user_id = auth.uid())
    OR
    (connection_type = 'organization' AND organization_id IS NOT NULL AND public.is_org_board(organization_id))
  );

-- UPDATE Policy
-- 1. Users can update their own personal connection
-- 2. Organization board/admin can update organization connection
CREATE POLICY "Users and board can update google connections"
  ON public.google_connections FOR UPDATE
  TO authenticated
  USING (
    (connection_type = 'user' AND user_id = auth.uid())
    OR
    (connection_type = 'organization' AND organization_id IS NOT NULL AND public.is_org_board(organization_id))
  )
  WITH CHECK (
    (connection_type = 'user' AND user_id = auth.uid())
    OR
    (connection_type = 'organization' AND organization_id IS NOT NULL AND public.is_org_board(organization_id))
  );

-- DELETE Policy
-- 1. Users can delete (disconnect) their own personal connection
-- 2. Organization board/admin can delete (disconnect) organization connection
CREATE POLICY "Users and board can delete google connections"
  ON public.google_connections FOR DELETE
  TO authenticated
  USING (
    (connection_type = 'user' AND user_id = auth.uid())
    OR
    (connection_type = 'organization' AND organization_id IS NOT NULL AND public.is_org_board(organization_id))
  );

-- ==============================================================================
-- Migration: 20260814000003_activity_google_forms.sql
-- Description: Phase 10 - Google Forms Integration for Activities & Participants
-- ==============================================================================

-- 1. Table: activity_forms (Liên kết Google Form với Hoạt động)
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

-- Trigger updated_at
CREATE TRIGGER set_activity_forms_updated_at
  BEFORE UPDATE ON public.activity_forms
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Indexes for activity_forms
CREATE INDEX IF NOT EXISTS idx_activity_forms_org ON public.activity_forms(organization_id);
CREATE INDEX IF NOT EXISTS idx_activity_forms_activity ON public.activity_forms(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_forms_google_id ON public.activity_forms(google_form_id);
CREATE INDEX IF NOT EXISTS idx_activity_forms_is_primary ON public.activity_forms(activity_id, is_primary);

-- 2. Table: activity_form_responses (Chi tiết phản hồi Google Form đã chuẩn hóa)
CREATE TABLE IF NOT EXISTS public.activity_form_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_form_id UUID NOT NULL REFERENCES public.activity_forms(id) ON DELETE CASCADE,
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
  activity_participant_id UUID REFERENCES public.activity_participants(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_form_google_response UNIQUE (activity_form_id, google_response_id)
);

-- Trigger updated_at
CREATE TRIGGER set_activity_form_responses_updated_at
  BEFORE UPDATE ON public.activity_form_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Indexes for activity_form_responses
CREATE INDEX IF NOT EXISTS idx_form_responses_form ON public.activity_form_responses(activity_form_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_activity ON public.activity_form_responses(activity_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_org ON public.activity_form_responses(organization_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_google_id ON public.activity_form_responses(google_response_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_student_id ON public.activity_form_responses(student_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_email ON public.activity_form_responses(respondent_email);
CREATE INDEX IF NOT EXISTS idx_form_responses_matched_member ON public.activity_form_responses(matched_member_id);

-- 3. Enhance activity_participants table with source and response tracking
ALTER TABLE public.activity_participants 
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'google_form', 'import', 'system')),
  ADD COLUMN IF NOT EXISTS google_response_id TEXT;

CREATE INDEX IF NOT EXISTS idx_activity_participants_source ON public.activity_participants(activity_id, source);

-- 4. Row Level Security (RLS)
ALTER TABLE public.activity_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_form_responses ENABLE ROW LEVEL SECURITY;

-- Policies for activity_forms
-- View: all members belonging to the organization
CREATE POLICY "Users can view activity forms in their organization"
  ON public.activity_forms
  FOR SELECT
  TO authenticated
  USING (
    public.is_org_member(organization_id)
  );

-- Insert/Update/Delete: Board members only (admin, leader, deputy, secretary, treasurer)
CREATE POLICY "Board members can insert activity forms"
  ON public.activity_forms
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_org_board(organization_id)
  );

CREATE POLICY "Board members can update activity forms"
  ON public.activity_forms
  FOR UPDATE
  TO authenticated
  USING (
    public.is_org_board(organization_id)
  )
  WITH CHECK (
    public.is_org_board(organization_id)
  );

CREATE POLICY "Board members can delete activity forms"
  ON public.activity_forms
  FOR DELETE
  TO authenticated
  USING (
    public.is_org_board(organization_id)
  );

-- Policies for activity_form_responses
CREATE POLICY "Users can view form responses in their organization"
  ON public.activity_form_responses
  FOR SELECT
  TO authenticated
  USING (
    public.is_org_member(organization_id)
  );

CREATE POLICY "Board members can manage form responses"
  ON public.activity_form_responses
  FOR ALL
  TO authenticated
  USING (
    public.is_org_board(organization_id)
  )
  WITH CHECK (
    public.is_org_board(organization_id)
  );

-- ==============================================================================
-- Migration: 20260814000004_google_sheets_integration.sql
-- Description: Phase 11 - Google Sheets Integration Metadata & RLS
-- ==============================================================================

-- 1. Table: google_sheet_connections (Quản lý bảng tính Google Sheets của Chi hội)
CREATE TABLE IF NOT EXISTS public.google_sheet_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  spreadsheet_id TEXT NOT NULL,
  spreadsheet_name TEXT NOT NULL,
  spreadsheet_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'error')),
  module_tabs TEXT[] NOT NULL DEFAULT '{"members", "activities", "tasks", "participants", "finance"}',
  last_import_at TIMESTAMPTZ,
  last_export_at TIMESTAMPTZ,
  last_sync_status TEXT NOT NULL DEFAULT 'idle' CHECK (last_sync_status IN ('idle', 'syncing', 'success', 'error')),
  last_sync_error TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_org_spreadsheet UNIQUE (organization_id, spreadsheet_id)
);

-- Trigger auto updated_at
CREATE TRIGGER set_google_sheet_connections_updated_at
  BEFORE UPDATE ON public.google_sheet_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_google_sheets_org ON public.google_sheet_connections(organization_id);
CREATE INDEX IF NOT EXISTS idx_google_sheets_spreadsheet_id ON public.google_sheet_connections(spreadsheet_id);
CREATE INDEX IF NOT EXISTS idx_google_sheets_status ON public.google_sheet_connections(status);

-- 2. Row Level Security (RLS)
ALTER TABLE public.google_sheet_connections ENABLE ROW LEVEL SECURITY;

-- SELECT: All active members of the organization can view connected spreadsheets
CREATE POLICY "Users can view google sheet connections in their organization"
  ON public.google_sheet_connections
  FOR SELECT
  TO authenticated
  USING (
    public.is_org_member(organization_id)
  );

-- INSERT: Only organization board members (Admin, Leader, Deputy, Treasurer, Secretary)
CREATE POLICY "Board members can insert google sheet connections"
  ON public.google_sheet_connections
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_org_board(organization_id)
  );

-- UPDATE: Only organization board members
CREATE POLICY "Board members can update google sheet connections"
  ON public.google_sheet_connections
  FOR UPDATE
  TO authenticated
  USING (
    public.is_org_board(organization_id)
  )
  WITH CHECK (
    public.is_org_board(organization_id)
  );

-- DELETE: Only organization board members
CREATE POLICY "Board members can delete google sheet connections"
  ON public.google_sheet_connections
  FOR DELETE
  TO authenticated
  USING (
    public.is_org_board(organization_id)
  );

-- ==============================================================================
-- Migration: Google Drive Integration & Document Source Differentiation
-- Chi Hội Manager - Phase 12
-- ==============================================================================

-- 1. Extend documents table to support Google Drive references alongside Supabase Storage
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS source_type TEXT NOT NULL DEFAULT 'supabase' 
    CHECK (source_type IN ('supabase', 'google_drive')),
  ADD COLUMN IF NOT EXISTS drive_file_id TEXT,
  ADD COLUMN IF NOT EXISTS drive_url TEXT,
  ADD COLUMN IF NOT EXISTS linked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS file_icon_url TEXT,
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS is_folder BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 2. Performance indexes for Google Drive queries
CREATE INDEX IF NOT EXISTS idx_documents_source_type ON public.documents(organization_id, source_type);
CREATE INDEX IF NOT EXISTS idx_documents_drive_file_id ON public.documents(organization_id, drive_file_id) WHERE drive_file_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_documents_task_id ON public.documents(organization_id, task_id) WHERE task_id IS NOT NULL;

-- 3. Duplicate Prevention Indexes for Google Drive links
-- Ensures the same Drive file cannot be duplicate-linked into the same Activity, Task or Root Org list
CREATE UNIQUE INDEX IF NOT EXISTS uq_docs_org_drive_activity 
  ON public.documents(organization_id, drive_file_id, activity_id) 
  WHERE source_type = 'google_drive' AND activity_id IS NOT NULL AND drive_file_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_docs_org_drive_task 
  ON public.documents(organization_id, drive_file_id, task_id) 
  WHERE source_type = 'google_drive' AND task_id IS NOT NULL AND drive_file_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_docs_org_drive_general 
  ON public.documents(organization_id, drive_file_id) 
  WHERE source_type = 'google_drive' AND activity_id IS NULL AND task_id IS NULL AND drive_file_id IS NOT NULL;

-- 4. Comment descriptions
COMMENT ON COLUMN public.documents.source_type IS 'Origin of file: supabase (stored in Supabase Storage) or google_drive (referenced from Google Drive)';
COMMENT ON COLUMN public.documents.drive_file_id IS 'Unique identifier of the file/folder on Google Drive';
COMMENT ON COLUMN public.documents.drive_url IS 'Direct web link (webViewLink or alternateLink) to view file on Google Drive';
COMMENT ON COLUMN public.documents.linked_by IS 'Profile ID of the user who linked this Drive file';

-- ==============================================================================
-- Migration: 20260814000006_google_calendar_and_audit_logs.sql
-- Description: Phase 2 Foundation - Google Calendar Events & System Audit Logs
-- ==============================================================================

-- 1. Table: google_calendar_events (and activity_calendar_events compatibility)
CREATE TABLE IF NOT EXISTS public.google_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  google_calendar_id TEXT NOT NULL DEFAULT 'primary',
  google_event_id TEXT NOT NULL,
  event_url TEXT,
  status TEXT NOT NULL DEFAULT 'synced' CHECK (status IN ('linked', 'synced', 'error', 'unavailable')),
  last_synced_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_activity_google_calendar UNIQUE (activity_id, google_calendar_id)
);

-- Backward/forward compatibility table activity_calendar_events
CREATE TABLE IF NOT EXISTS public.activity_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  google_calendar_id TEXT NOT NULL DEFAULT 'primary',
  google_event_id TEXT NOT NULL,
  event_url TEXT,
  status TEXT NOT NULL DEFAULT 'synced' CHECK (status IN ('linked', 'synced', 'error', 'unavailable')),
  last_synced_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_act_cal_event_activity UNIQUE (activity_id)
);

-- Triggers for auto updated_at
CREATE TRIGGER set_google_calendar_events_updated_at
  BEFORE UPDATE ON public.google_calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_activity_calendar_events_updated_at
  BEFORE UPDATE ON public.activity_calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Indexes for google_calendar_events
CREATE INDEX IF NOT EXISTS idx_calendar_events_org ON public.google_calendar_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_activity ON public.google_calendar_events(activity_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_status ON public.google_calendar_events(status);
CREATE INDEX IF NOT EXISTS idx_calendar_events_google_id ON public.google_calendar_events(google_event_id);

CREATE INDEX IF NOT EXISTS idx_act_calendar_events_org ON public.activity_calendar_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_act_calendar_events_activity ON public.activity_calendar_events(activity_id);

-- 2. Table: audit_logs (Hệ thống ghi vết hoạt động và thao tác quan trọng)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON public.audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- 3. Row Level Security (RLS)
ALTER TABLE public.google_calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Google Calendar Policies
CREATE POLICY "Members can view calendar events in organization"
  ON public.google_calendar_events
  FOR SELECT
  TO authenticated
  USING (public.is_org_member(organization_id));

CREATE POLICY "Board can manage google calendar events"
  ON public.google_calendar_events
  FOR ALL
  TO authenticated
  USING (public.is_org_board(organization_id))
  WITH CHECK (public.is_org_board(organization_id));

CREATE POLICY "Members can view activity calendar events"
  ON public.activity_calendar_events
  FOR SELECT
  TO authenticated
  USING (public.is_org_member(organization_id));

CREATE POLICY "Board can manage activity calendar events"
  ON public.activity_calendar_events
  FOR ALL
  TO authenticated
  USING (public.is_org_board(organization_id))
  WITH CHECK (public.is_org_board(organization_id));

-- Audit Logs Policies
CREATE POLICY "Members can view organization audit logs"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (public.is_org_member(organization_id));

CREATE POLICY "Authenticated users can insert audit logs"
  ON public.audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND public.is_org_member(organization_id)
  );

-- ==============================================================================
-- Migration: 20260817000000_creator_as_member_and_nullable_student_id.sql
-- Description:
--   1. Allow members.student_id to be NULL (profiles.student_id can be NULL during organization onboarding).
--   2. Add unique constraint uq_org_user_member (organization_id, user_id) on members table.
--   3. Update handle_new_organization() trigger function to create BOTH:
--        - organization_memberships record (role: 'admin', status: 'active')
--        - members record (mapping user's profile, status: 'active')
--      with idempotent ON CONFLICT handling and SECURITY DEFINER SET search_path = public.
--   4. Safely backfill members for any existing organization_memberships that don't have a members record.
-- ==============================================================================

-- 1. Cho phép student_id nhận giá trị NULL trong bảng public.members
ALTER TABLE public.members ALTER COLUMN student_id DROP NOT NULL;

-- 2. Xử lý an toàn dữ liệu trùng lặp (nếu có) trước khi tạo UNIQUE constraint (organization_id, user_id)
DELETE FROM public.members a USING public.members b
WHERE a.id < b.id
  AND a.organization_id = b.organization_id
  AND a.user_id = b.user_id
  AND a.user_id IS NOT NULL;

-- Thêm unique constraint (organization_id, user_id) trên bảng members nếu chưa tồn tại
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_org_user_member'
  ) THEN
    ALTER TABLE public.members ADD CONSTRAINT uq_org_user_member UNIQUE (organization_id, user_id);
  END IF;
END $$;

-- 3. Cập nhật Trigger Function: handle_new_organization
CREATE OR REPLACE FUNCTION public.handle_new_organization()
RETURNS TRIGGER AS $$
DECLARE
  creator_profile RECORD;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    -- Bước A: Tạo membership với quyền Admin cho người khởi tạo Chi hội
    INSERT INTO public.organization_memberships (
      organization_id,
      user_id,
      role,
      status
    )
    VALUES (
      NEW.id,
      auth.uid(),
      'admin',
      'active'
    )
    ON CONFLICT (organization_id, user_id) DO NOTHING;

    -- Bước B: Lấy thông tin từ profiles của người tạo và tạo hồ sơ hội viên (members)
    SELECT * INTO creator_profile
    FROM public.profiles
    WHERE id = auth.uid();

    IF FOUND THEN
      INSERT INTO public.members (
        organization_id,
        user_id,
        student_id,
        full_name,
        email,
        phone,
        status,
        joined_date
      )
      VALUES (
        NEW.id,
        auth.uid(),
        creator_profile.student_id,
        COALESCE(creator_profile.full_name, 'Quản trị viên'),
        creator_profile.email,
        creator_profile.phone,
        'active',
        CURRENT_DATE
      )
      ON CONFLICT (organization_id, user_id) DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Đảm bảo Trigger on_organization_created được gắn vào bảng organizations
DROP TRIGGER IF EXISTS on_organization_created ON public.organizations;
CREATE TRIGGER on_organization_created
  AFTER INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_organization();

-- 4. An toàn: Đồng bộ dữ liệu hiện có (Backfill) nếu có membership mà chưa có hồ sơ member
INSERT INTO public.members (
  organization_id,
  user_id,
  student_id,
  full_name,
  email,
  phone,
  status,
  joined_date
)
SELECT 
  m.organization_id,
  m.user_id,
  p.student_id,
  COALESCE(p.full_name, 'Hội viên'),
  p.email,
  p.phone,
  'active',
  CURRENT_DATE
FROM public.organization_memberships m
JOIN public.profiles p ON p.id = m.user_id
WHERE m.user_id IS NOT NULL
ON CONFLICT (organization_id, user_id) DO NOTHING;

-- ==============================================================================
-- Migration: 20260818000000_sync_profile_to_members.sql
-- Description:
--   1. Create trigger function handle_profile_updated() to automatically propagate
--      profile changes (full_name, email, phone, student_id) from public.profiles
--      to public.members for all linked organizations where members.user_id = NEW.id.
--   2. Validate duplicate student_id before applying updates across organizations.
--   3. Attach AFTER UPDATE trigger on_profile_updated to public.profiles.
--   4. Safely backfill existing profile information to linked members.
-- ==============================================================================

-- 1. Tạo function đồng bộ: handle_profile_updated
CREATE OR REPLACE FUNCTION public.handle_profile_updated()
RETURNS TRIGGER AS $$
BEGIN
  -- Kiểm tra trùng lặp Mã số sinh viên (MSSV) nếu student_id thay đổi và không rỗng
  IF NEW.student_id IS NOT NULL AND (OLD.student_id IS DISTINCT FROM NEW.student_id) THEN
    IF EXISTS (
      SELECT 1
      FROM public.members m_user
      JOIN public.members m_other 
        ON m_user.organization_id = m_other.organization_id
      WHERE m_user.user_id = NEW.id
        AND m_other.user_id IS DISTINCT FROM NEW.id
        AND UPPER(TRIM(m_other.student_id)) = UPPER(TRIM(NEW.student_id))
    ) THEN
      RAISE EXCEPTION 'Mã số sinh viên "%" đã được sử dụng bởi một hội viên khác trong Chi hội. Vui lòng kiểm tra lại MSSV.', NEW.student_id
        USING ERRCODE = 'unique_violation';
    END IF;
  END IF;

  -- Đồng bộ các trường thông tin cá nhân sang members của user (ở tất cả Chi hội)
  UPDATE public.members
  SET 
    full_name = NEW.full_name,
    email = NEW.email,
    phone = NEW.phone,
    student_id = NEW.student_id,
    updated_at = timezone('utc'::text, now())
  WHERE user_id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Gắn AFTER UPDATE trigger vào bảng profiles
DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (
    OLD.full_name IS DISTINCT FROM NEW.full_name
    OR OLD.email IS DISTINCT FROM NEW.email
    OR OLD.phone IS DISTINCT FROM NEW.phone
    OR OLD.student_id IS DISTINCT FROM NEW.student_id
  )
  EXECUTE FUNCTION public.handle_profile_updated();

-- 3. Đồng bộ dữ liệu hiện có (Backfill) từ profiles sang members cho tất cả hồ sơ đã liên kết user_id
UPDATE public.members m
SET
  full_name = p.full_name,
  email = p.email,
  phone = p.phone,
  student_id = p.student_id,
  updated_at = timezone('utc'::text, now())
FROM public.profiles p
WHERE m.user_id = p.id
  AND (
    m.full_name IS DISTINCT FROM p.full_name
    OR m.email IS DISTINCT FROM p.email
    OR m.phone IS DISTINCT FROM p.phone
    OR m.student_id IS DISTINCT FROM p.student_id
  );

-- Migration: 20260819000000_term_management_enhancements.sql
-- Description: Adds congress_date column to terms, partial unique index for single active term per org, and activate_term atomic RPC function

-- 1. Add congress_date column if not exists
ALTER TABLE public.terms
ADD COLUMN IF NOT EXISTS congress_date DATE;

-- 2. Add partial unique index to enforce at most one current/active term per organization
CREATE UNIQUE INDEX IF NOT EXISTS uq_terms_one_current_per_org
ON public.terms (organization_id)
WHERE is_current = true;

-- 3. Atomic RPC function to activate a term for an organization
CREATE OR REPLACE FUNCTION public.activate_term(p_term_id UUID, p_org_id UUID)
RETURNS public.terms AS $$
DECLARE
  v_term public.terms;
BEGIN
  -- Verify caller is org board
  IF NOT public.is_org_board(p_org_id) THEN
    RAISE EXCEPTION 'Bạn không có quyền quản trị để kích hoạt nhiệm kỳ trong Chi hội này.'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Deactivate all other terms in this organization
  UPDATE public.terms
  SET is_current = false,
      updated_at = timezone('utc'::text, now())
  WHERE organization_id = p_org_id
    AND id <> p_term_id
    AND is_current = true;

  -- Activate chosen term and set status to active
  UPDATE public.terms
  SET is_current = true,
      status = 'active',
      updated_at = timezone('utc'::text, now())
  WHERE id = p_term_id
    AND organization_id = p_org_id
  RETURNING * INTO v_term;

  IF v_term.id IS NULL THEN
    RAISE EXCEPTION 'Không tìm thấy nhiệm kỳ cần kích hoạt.'
      USING ERRCODE = 'no_data_found';
  END IF;

  RETURN v_term;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execution to authenticated users (internal check is_org_board guards actual authorization)
GRANT EXECUTE ON FUNCTION public.activate_term(UUID, UUID) TO authenticated;

-- ==============================================================================
-- Supabase Storage Configuration & Policies for Organization Logos
-- Bucket: 'organization-logos' (Public read, admin-only write)
-- ==============================================================================

-- 1. Create Storage Bucket for Organization Logos if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'organization-logos',
  'organization-logos',
  true,
  5242880, -- 5MB limit
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/svg+xml'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/svg+xml'
  ];

-- 2. Storage RLS Policies for 'organization-logos' bucket
-- Storage objects path convention: {organization_id}/logo.{ext}

-- Policy 2.1: Anyone can read/view organization logos (Public)
CREATE POLICY "Public read for organization logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'organization-logos');

-- Policy 2.2: Org admins and board members can upload logo for their organization
CREATE POLICY "Org admins can upload organization logo"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'organization-logos'
  AND (
    public.is_org_admin((split_part(name, '/', 1))::uuid)
    OR public.is_org_board((split_part(name, '/', 1))::uuid)
  )
);

-- Policy 2.3: Org admins and board members can update/overwrite logo for their organization
CREATE POLICY "Org admins can update organization logo"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'organization-logos'
  AND (
    public.is_org_admin((split_part(name, '/', 1))::uuid)
    OR public.is_org_board((split_part(name, '/', 1))::uuid)
  )
)
WITH CHECK (
  bucket_id = 'organization-logos'
  AND (
    public.is_org_admin((split_part(name, '/', 1))::uuid)
    OR public.is_org_board((split_part(name, '/', 1))::uuid)
  )
);

-- Policy 2.4: Org admins and board members can delete logo for their organization
CREATE POLICY "Org admins can delete organization logo"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'organization-logos'
  AND (
    public.is_org_admin((split_part(name, '/', 1))::uuid)
    OR public.is_org_board((split_part(name, '/', 1))::uuid)
  )
);

-- ==============================================================================
-- CHI HỘI MANAGER - GOOGLE CONNECTIONS UNIQUE CONSTRAINTS
-- Migration: 20260821000000_google_connections_unique_constraints.sql
-- Description: Replace partial indexes with standard table-level UNIQUE constraints
--              to ensure PostgREST / Supabase REST API upsert(..., { onConflict })
--              works seamlessly without ON CONFLICT specification mismatch errors.
-- ==============================================================================

-- 1. Ensure any orphan/duplicate data is reconciled before adding constraints
-- Keep the latest connection per (user_id, connection_type) where connection_type = 'user'
DELETE FROM public.google_connections a
USING public.google_connections b
WHERE a.id < b.id
  AND a.connection_type = 'user'
  AND b.connection_type = 'user'
  AND a.user_id = b.user_id
  AND a.user_id IS NOT NULL;

-- Keep the latest connection per (organization_id, connection_type) where connection_type = 'organization'
DELETE FROM public.google_connections a
USING public.google_connections b
WHERE a.id < b.id
  AND a.connection_type = 'organization'
  AND b.connection_type = 'organization'
  AND a.organization_id = b.organization_id
  AND a.organization_id IS NOT NULL;

-- 2. Drop existing partial indexes if present
DROP INDEX IF EXISTS public.uq_google_conn_user;
DROP INDEX IF EXISTS public.uq_google_conn_org;

-- 3. Add explicit table-level UNIQUE constraints matching onConflict specification
ALTER TABLE public.google_connections
  DROP CONSTRAINT IF EXISTS uq_google_connections_user,
  DROP CONSTRAINT IF EXISTS uq_google_connections_org;

ALTER TABLE public.google_connections
  ADD CONSTRAINT uq_google_connections_user UNIQUE (user_id, connection_type);

ALTER TABLE public.google_connections
  ADD CONSTRAINT uq_google_connections_org UNIQUE (organization_id, connection_type);

-- 4. Comment on constraints for documentation
COMMENT ON CONSTRAINT uq_google_connections_user ON public.google_connections IS 
  'Ensures at most 1 personal Google connection per authenticated user across all organizations';

COMMENT ON CONSTRAINT uq_google_connections_org ON public.google_connections IS 
  'Ensures at most 1 official Google Workspace connection per organization';

-- ==============================================================================
-- Migration: 20260822000000_audit_logs_rbac_and_notifications.sql
-- Description: Phase 3.2 - Audit Log RBAC Hardening & Notification Center Infrastructure
-- ==============================================================================

-- 1. Hardening Audit Logs RBAC Policies
-- Only Admin, Leader (Chi hội trưởng) and Deputy (Chi hội phó) can view audit logs
DROP POLICY IF EXISTS "Members can view organization audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Board and admins can view organization audit logs" ON public.audit_logs;

CREATE POLICY "Board and admins can view organization audit logs"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (
    public.has_org_role(organization_id, ARRAY['admin', 'leader', 'deputy'])
  );

-- 2. User Notification Reads Table (for persistent read/unread state across sessions)
CREATE TABLE IF NOT EXISTS public.user_notification_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notification_key TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT true,
  read_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_user_notification_read UNIQUE (user_id, organization_id, notification_key)
);

CREATE INDEX IF NOT EXISTS idx_user_notif_reads_user_org ON public.user_notification_reads(user_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_user_notif_reads_key ON public.user_notification_reads(notification_key);

ALTER TABLE public.user_notification_reads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own notification reads" ON public.user_notification_reads;
CREATE POLICY "Users can manage their own notification reads"
  ON public.user_notification_reads
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 3. Explicit Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- NULL means broadcast to all org members
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'danger', 'success')),
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('task', 'activity', 'finance', 'document', 'integration', 'system', 'general')),
  link TEXT,
  entity_type TEXT,
  entity_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_notifications_org ON public.notifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view relevant notifications" ON public.notifications;
CREATE POLICY "Users can view relevant notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (
    public.is_org_member(organization_id)
    AND (user_id IS NULL OR user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Board can create notifications" ON public.notifications;
CREATE POLICY "Board can create notifications"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_org_board(organization_id)
  );

-- ==============================================================================
-- Migration: 20260823000000_activity_lifecycle_and_lead_member.sql
-- Description: Add lead_member_id to activities, enforce tenant validation, and notify PostgREST
-- ==============================================================================

-- 1. Add lead_member_id column to activities if not exists
ALTER TABLE public.activities
ADD COLUMN IF NOT EXISTS lead_member_id UUID;

-- 2. Clean orphan data if any exists before foreign key constraint
UPDATE public.activities
SET lead_member_id = NULL
WHERE lead_member_id IS NOT NULL
  AND lead_member_id NOT IN (SELECT id FROM public.members);

-- 3. Add explicit foreign key constraint if not already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'activities_lead_member_id_fkey'
      AND conrelid = 'public.activities'::regclass
  ) THEN
    ALTER TABLE public.activities
      ADD CONSTRAINT activities_lead_member_id_fkey
      FOREIGN KEY (lead_member_id) REFERENCES public.members(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 4. Index for lead_member_id
CREATE INDEX IF NOT EXISTS idx_activities_lead_member_id ON public.activities(lead_member_id);

-- 5. Trigger to ensure lead_member belongs to the same organization as the activity
CREATE OR REPLACE FUNCTION public.validate_activity_lead_member()
RETURNS TRIGGER AS $$
DECLARE
  v_lead_org_id UUID;
BEGIN
  IF NEW.lead_member_id IS NOT NULL THEN
    SELECT organization_id INTO v_lead_org_id
    FROM public.members
    WHERE id = NEW.lead_member_id;

    IF v_lead_org_id IS NULL OR v_lead_org_id != NEW.organization_id THEN
      RAISE EXCEPTION 'Người phụ trách chính không thuộc Chi hội hiện tại (lead_member_id must belong to the same organization)'
        USING ERRCODE = '23503';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_validate_activity_lead_member ON public.activities;
CREATE TRIGGER trg_validate_activity_lead_member
  BEFORE INSERT OR UPDATE OF lead_member_id, organization_id ON public.activities
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_activity_lead_member();

-- 6. Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

-- Migration: 20260824000000_term_closing_and_handover.sql
-- Description: Adds closing_snapshot, closed_at, closed_by, and handover_notes columns to terms table for Phase 3.3.4 Term Closing & Handover

ALTER TABLE public.terms
ADD COLUMN IF NOT EXISTS closing_snapshot JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS closed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS handover_notes TEXT DEFAULT NULL;

-- Create index on term status and organization for fast filtering
CREATE INDEX IF NOT EXISTS idx_terms_org_status ON public.terms(organization_id, status);

-- Migration: 20260825000000_finance_approval_and_period_closing.sql
-- Description: Phase 3.3.5 - Finance Approval Workflow, Thresholds, Periodic Closings & Reconciliation

-- 1. Add approval threshold to organizations table
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS finance_approval_threshold NUMERIC(15, 2) DEFAULT 2000000;

-- 2. Add approval fields and status to finance_transactions table
ALTER TABLE public.finance_transactions
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'posted' CHECK (status IN ('draft', 'pending_approval', 'approved', 'posted', 'rejected')),
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS period_closing_id UUID DEFAULT NULL;

-- Create indexes for fast status, approval, and date range filtering
CREATE INDEX IF NOT EXISTS idx_finance_transactions_status ON public.finance_transactions(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_date ON public.finance_transactions(organization_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_recorded_by ON public.finance_transactions(recorded_by);

-- 3. Create finance_period_closings table
CREATE TABLE IF NOT EXISTS public.finance_period_closings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  term_id UUID NOT NULL REFERENCES public.terms(id) ON DELETE RESTRICT,
  period_type TEXT NOT NULL CHECK (period_type IN ('month', 'quarter', 'custom')),
  period_name TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'closed' CHECK (status IN ('closed', 'reopened')),
  opening_balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_income NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_expense NUMERIC(15, 2) NOT NULL DEFAULT 0,
  closing_balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
  actual_balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
  reconciliation_status TEXT NOT NULL DEFAULT 'balanced' CHECK (reconciliation_status IN ('balanced', 'mismatch', 'override')),
  reconciliation_discrepancy NUMERIC(15, 2) DEFAULT 0,
  reconciliation_notes TEXT DEFAULT NULL,
  closed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  closed_by_name TEXT DEFAULT NULL,
  reopened_at TIMESTAMPTZ DEFAULT NULL,
  reopened_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reopened_by_name TEXT DEFAULT NULL,
  reopen_reason TEXT DEFAULT NULL,
  snapshot_data JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Foreign key linking finance_transactions to finance_period_closings (safe check)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_finance_transactions_period'
  ) THEN
    ALTER TABLE public.finance_transactions
    ADD CONSTRAINT fk_finance_transactions_period
    FOREIGN KEY (period_closing_id) REFERENCES public.finance_period_closings(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Indexes for finance_period_closings
CREATE INDEX IF NOT EXISTS idx_finance_periods_org ON public.finance_period_closings(organization_id);
CREATE INDEX IF NOT EXISTS idx_finance_periods_term ON public.finance_period_closings(term_id);
CREATE INDEX IF NOT EXISTS idx_finance_periods_dates ON public.finance_period_closings(organization_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_finance_periods_status ON public.finance_period_closings(organization_id, status);

-- Enable RLS
ALTER TABLE public.finance_period_closings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for finance_period_closings
DROP POLICY IF EXISTS "finance_period_closings_select" ON public.finance_period_closings;
CREATE POLICY "finance_period_closings_select"
ON public.finance_period_closings
FOR SELECT
TO authenticated
USING (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "finance_period_closings_insert" ON public.finance_period_closings;
CREATE POLICY "finance_period_closings_insert"
ON public.finance_period_closings
FOR INSERT
TO authenticated
WITH CHECK (public.has_org_role(organization_id, ARRAY['admin', 'leader']));

DROP POLICY IF EXISTS "finance_period_closings_update" ON public.finance_period_closings;
CREATE POLICY "finance_period_closings_update"
ON public.finance_period_closings
FOR UPDATE
TO authenticated
USING (public.has_org_role(organization_id, ARRAY['admin', 'leader']))
WITH CHECK (public.has_org_role(organization_id, ARRAY['admin', 'leader']));

DROP POLICY IF EXISTS "finance_period_closings_delete" ON public.finance_period_closings;
CREATE POLICY "finance_period_closings_delete"
ON public.finance_period_closings
FOR DELETE
TO authenticated
USING (public.is_org_admin(organization_id));

-- Migration: 20260826000000_sync_finance_approval_schema.sql
-- Description: Synchronize Finance Approval, Status, Thresholds, and Period Closings Schema

-- 1. Ensure organizations.finance_approval_threshold exists
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS finance_approval_threshold NUMERIC(15, 2) DEFAULT 2000000;

-- 2. Ensure finance_transactions has status and approval fields
-- Step 2a: Add columns if they do not exist
ALTER TABLE public.finance_transactions
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'posted',
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS period_closing_id UUID DEFAULT NULL;

-- Step 2b: Backfill existing records where status is NULL to 'posted' (historical transactions are already finalized)
UPDATE public.finance_transactions
SET status = 'posted'
WHERE status IS NULL;

-- Step 2c: Set NOT NULL and default on status
ALTER TABLE public.finance_transactions
ALTER COLUMN status SET DEFAULT 'posted',
ALTER COLUMN status SET NOT NULL;

-- Step 2d: Ensure status CHECK constraint exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'chk_finance_transactions_status'
      AND conrelid = 'public.finance_transactions'::regclass
  ) THEN
    ALTER TABLE public.finance_transactions
    ADD CONSTRAINT chk_finance_transactions_status
    CHECK (status IN ('draft', 'pending_approval', 'approved', 'posted', 'rejected'));
  END IF;
END $$;

-- 3. Ensure finance_period_closings table exists
CREATE TABLE IF NOT EXISTS public.finance_period_closings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  term_id UUID NOT NULL REFERENCES public.terms(id) ON DELETE RESTRICT,
  period_type TEXT NOT NULL CHECK (period_type IN ('month', 'quarter', 'custom')),
  period_name TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'closed' CHECK (status IN ('closed', 'reopened')),
  opening_balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_income NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_expense NUMERIC(15, 2) NOT NULL DEFAULT 0,
  closing_balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
  actual_balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
  reconciliation_status TEXT NOT NULL DEFAULT 'balanced' CHECK (reconciliation_status IN ('balanced', 'mismatch', 'override')),
  reconciliation_discrepancy NUMERIC(15, 2) DEFAULT 0,
  reconciliation_notes TEXT DEFAULT NULL,
  closed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  closed_by_name TEXT DEFAULT NULL,
  reopened_at TIMESTAMPTZ DEFAULT NULL,
  reopened_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reopened_by_name TEXT DEFAULT NULL,
  reopen_reason TEXT DEFAULT NULL,
  snapshot_data JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 3b: Ensure foreign key linking finance_transactions to finance_period_closings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_finance_transactions_period'
      AND conrelid = 'public.finance_transactions'::regclass
  ) THEN
    ALTER TABLE public.finance_transactions
    ADD CONSTRAINT fk_finance_transactions_period
    FOREIGN KEY (period_closing_id) REFERENCES public.finance_period_closings(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 4. Create optimized indexes for Finance queries
CREATE INDEX IF NOT EXISTS idx_finance_transactions_status ON public.finance_transactions(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_org_term ON public.finance_transactions(organization_id, term_id);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_date ON public.finance_transactions(organization_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_recorded_by ON public.finance_transactions(recorded_by);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_approved_by ON public.finance_transactions(approved_by);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_period_id ON public.finance_transactions(period_closing_id);

CREATE INDEX IF NOT EXISTS idx_finance_periods_org ON public.finance_period_closings(organization_id);
CREATE INDEX IF NOT EXISTS idx_finance_periods_term ON public.finance_period_closings(term_id);
CREATE INDEX IF NOT EXISTS idx_finance_periods_dates ON public.finance_period_closings(organization_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_finance_periods_status ON public.finance_period_closings(organization_id, status);

-- 5. Enable RLS and define Policies
ALTER TABLE public.finance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_period_closings ENABLE ROW LEVEL SECURITY;

-- Policies for finance_transactions
DROP POLICY IF EXISTS "Members can view finance transactions" ON public.finance_transactions;
CREATE POLICY "Members can view finance transactions"
  ON public.finance_transactions FOR SELECT
  TO authenticated
  USING (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "Treasurer and Admin can manage finance transactions" ON public.finance_transactions;
DROP POLICY IF EXISTS "Treasurer and Admin can insert finance transactions" ON public.finance_transactions;
CREATE POLICY "Treasurer and Admin can insert finance transactions"
  ON public.finance_transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_org_role(organization_id, ARRAY['admin', 'leader', 'treasurer'])
  );

DROP POLICY IF EXISTS "Treasurer and Admin can update finance transactions" ON public.finance_transactions;
CREATE POLICY "Treasurer and Admin can update finance transactions"
  ON public.finance_transactions FOR UPDATE
  TO authenticated
  USING (
    public.has_org_role(organization_id, ARRAY['admin', 'leader', 'treasurer'])
  )
  WITH CHECK (
    public.has_org_role(organization_id, ARRAY['admin', 'leader', 'treasurer'])
  );

DROP POLICY IF EXISTS "Treasurer and Admin can delete finance transactions" ON public.finance_transactions;
CREATE POLICY "Treasurer and Admin can delete finance transactions"
  ON public.finance_transactions FOR DELETE
  TO authenticated
  USING (
    public.has_org_role(organization_id, ARRAY['admin', 'leader', 'treasurer'])
  );

-- Policies for finance_period_closings
DROP POLICY IF EXISTS "finance_period_closings_select" ON public.finance_period_closings;
CREATE POLICY "finance_period_closings_select"
  ON public.finance_period_closings FOR SELECT
  TO authenticated
  USING (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "finance_period_closings_insert" ON public.finance_period_closings;
CREATE POLICY "finance_period_closings_insert"
  ON public.finance_period_closings FOR INSERT
  TO authenticated
  WITH CHECK (public.has_org_role(organization_id, ARRAY['admin', 'leader']));

DROP POLICY IF EXISTS "finance_period_closings_update" ON public.finance_period_closings;
CREATE POLICY "finance_period_closings_update"
  ON public.finance_period_closings FOR UPDATE
  TO authenticated
  USING (public.has_org_role(organization_id, ARRAY['admin', 'leader']))
  WITH CHECK (public.has_org_role(organization_id, ARRAY['admin', 'leader']));

DROP POLICY IF EXISTS "finance_period_closings_delete" ON public.finance_period_closings;
CREATE POLICY "finance_period_closings_delete"
  ON public.finance_period_closings FOR DELETE
  TO authenticated
  USING (public.is_org_admin(organization_id));

-- ==============================================================================
-- Security Hardening: Revoke public execution on internal SECURITY DEFINER functions
-- ==============================================================================
-- These functions are internal database triggers and RLS helper functions.
-- They are NOT intended to be public RPC endpoints callable by anon or authenticated users.
-- Table triggers and RLS policies evaluate them internally with definer/owner context.

-- 1. Auth & Table Triggers
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_organization() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_profile_updated() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM PUBLIC, anon, authenticated;

-- 2. Organization Scoping & Audit Log Trigger Functions (if defined in instance)
DO $$
BEGIN
  BEGIN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.set_activity_participant_organization_id() FROM PUBLIC, anon, authenticated';
  EXCEPTION WHEN undefined_function THEN NULL;
  END;

  BEGIN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.set_term_member_organization_id() FROM PUBLIC, anon, authenticated';
  EXCEPTION WHEN undefined_function THEN NULL;
  END;

  BEGIN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.write_audit_log_from_trigger() FROM PUBLIC, anon, authenticated';
  EXCEPTION WHEN undefined_function THEN NULL;
  END;
END $$;

-- 3. Internal RLS Helper Functions
-- Note: RLS policies on tables evaluated by Postgres query planner REQUIRE EXECUTE permission
-- on these helper functions. Inside each function, auth.uid() IS NULL returns false safely.
GRANT EXECUTE ON FUNCTION public.has_org_role(UUID, TEXT[]) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_admin(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_board(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_member(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.user_belongs_to_org(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_org_role(UUID, TEXT[]) TO anon, authenticated;


-- Migration: 20260828000000_create_plan_secure.sql
-- Description: Creates the secure RPC function create_plan_secure for creating plans with automatic host organization assignment

DROP FUNCTION IF EXISTS public.create_plan_secure(UUID, TEXT, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, TEXT);
DROP FUNCTION IF EXISTS public.create_plan_secure;

CREATE OR REPLACE FUNCTION public.create_plan_secure(
  p_lead_org_id UUID,
  p_code TEXT,
  p_name TEXT,
  p_description TEXT DEFAULT NULL,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL,
  p_status TEXT DEFAULT 'planning'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_plan_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  -- Verify caller is authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Verify caller is Executive Board (BCH) of the lead organization
  IF NOT public.is_org_board(p_lead_org_id) THEN
    RAISE EXCEPTION 'Access denied: caller must be an executive board member (BCH) of the lead organization';
  END IF;

  -- Insert plan record
  INSERT INTO public.plans (
    lead_organization_id,
    code,
    name,
    description,
    start_date,
    end_date,
    status,
    created_by
  ) VALUES (
    p_lead_org_id,
    p_code,
    p_name,
    p_description,
    p_start_date,
    p_end_date,
    p_status,
    v_user_id
  )
  RETURNING id INTO v_plan_id;

  -- Insert lead organization as host into plan_organizations if not exists
  INSERT INTO public.plan_organizations (
    plan_id,
    organization_id,
    role_in_plan,
    is_host,
    status,
    role_description,
    joined_at
  ) VALUES (
    v_plan_id,
    p_lead_org_id,
    'host',
    true,
    'active',
    'Đơn vị chủ trì',
    NOW()
  )
  ON CONFLICT (plan_id, organization_id) DO UPDATE
  SET status = 'active', is_host = true, role_in_plan = 'host';

  RETURN v_plan_id;
END;
$$;

-- Grant execution permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_plan_secure(UUID, TEXT, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, TEXT) TO authenticated;

-- Migration: Update members status check constraint to active and alumni only
-- Clean up any legacy inactive or transferred status data to active or alumni

UPDATE members
SET status = 'active'
WHERE status NOT IN ('active', 'alumni');

-- Drop old check constraint if named, or re-apply constraint on status column
ALTER TABLE members DROP CONSTRAINT IF EXISTS members_status_check;
ALTER TABLE members ADD CONSTRAINT members_status_check CHECK (status IN ('active', 'alumni'));

-- Migration: 20260830000000_collaboration_workspace_tables_and_rls.sql
-- Description: Creates collaboration workspace tables (plans, plan_organizations, collab_activities, collab_tasks, collab_transactions) and enforces strict cross-organization RLS policies

-- 1. Table: plans (Multi-organization Collaboration Plans / Campaigns)
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Table: plan_organizations (Participating / Co-hosting Organizations in Collaboration Plan)
CREATE TABLE IF NOT EXISTS public.plan_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role_in_plan TEXT NOT NULL DEFAULT 'co_host' CHECK (role_in_plan IN ('host', 'co_host', 'partner', 'supporter', 'observer')),
  is_host BOOLEAN NOT NULL DEFAULT false,
  role_description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected', 'removed')),
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_plan_organization UNIQUE (plan_id, organization_id)
);

-- 3. Table: collab_activities (Collaborative Activities within a Collaboration Plan)
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Table: collab_tasks (Collaborative Tasks assigned across participating organizations)
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Table: collab_transactions (Isolated Financial Records for Collaboration Plans)
CREATE TABLE IF NOT EXISTS public.collab_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  collab_activity_id UUID REFERENCES public.collab_activities(id) ON DELETE SET NULL,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL DEFAULT 'expense' CHECK (transaction_type IN ('income', 'expense')),
  amount NUMERIC(15, 2) NOT NULL CHECK (amount >= 0),
  category_name TEXT NOT NULL,
  description TEXT NOT NULL,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_url TEXT,
  recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for optimal querying
CREATE INDEX IF NOT EXISTS idx_plans_lead_org ON public.plans(lead_organization_id);
CREATE INDEX IF NOT EXISTS idx_plans_status ON public.plans(status);
CREATE INDEX IF NOT EXISTS idx_plan_orgs_plan_id ON public.plan_organizations(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_orgs_org_id ON public.plan_organizations(organization_id);
CREATE INDEX IF NOT EXISTS idx_collab_act_plan ON public.collab_activities(plan_id);
CREATE INDEX IF NOT EXISTS idx_collab_act_lead_org ON public.collab_activities(lead_organization_id);
CREATE INDEX IF NOT EXISTS idx_collab_tasks_act ON public.collab_tasks(collab_activity_id);
CREATE INDEX IF NOT EXISTS idx_collab_tasks_assignee ON public.collab_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_collab_tasks_org ON public.collab_tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_collab_tx_plan ON public.collab_transactions(plan_id);
CREATE INDEX IF NOT EXISTS idx_collab_tx_org ON public.collab_transactions(organization_id);

-- Enable Row-Level Security (RLS)
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collab_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collab_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collab_transactions ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- HELPER FUNCTIONS FOR COLLABORATION (SECURITY DEFINER TO PREVENT RLS RECURSION)
-- =========================================================================

CREATE OR REPLACE FUNCTION public.can_user_view_plan(p_plan_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.plans p
    WHERE p.id = p_plan_id
      AND (
        public.is_org_member(p.lead_organization_id)
        OR EXISTS (
          SELECT 1 FROM public.plan_organizations po
          WHERE po.plan_id = p.id
            AND po.status IN ('active', 'pending')
            AND public.is_org_member(po.organization_id)
        )
      )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE;

CREATE OR REPLACE FUNCTION public.can_user_view_plan_org(p_plan_id UUID, p_org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF public.is_org_member(p_org_id) THEN
    RETURN true;
  END IF;
  RETURN public.can_user_view_plan(p_plan_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE;

GRANT EXECUTE ON FUNCTION public.can_user_view_plan(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.can_user_view_plan_org(UUID, UUID) TO anon, authenticated;

-- =========================================================================
-- RLS POLICIES FOR PLANS
-- =========================================================================

-- View plans: Members of lead org or any invited/participating org
DROP POLICY IF EXISTS "Members can view collaboration plans" ON public.plans;
CREATE POLICY "Members can view collaboration plans"
  ON public.plans FOR SELECT
  USING (
    public.is_org_member(lead_organization_id)
    OR public.can_user_view_plan(id)
  );

-- Create plans: Only BCH of lead organization
DROP POLICY IF EXISTS "Lead Org Board can insert plans" ON public.plans;
CREATE POLICY "Lead Org Board can insert plans"
  ON public.plans FOR INSERT
  WITH CHECK (
    public.is_org_board(lead_organization_id)
  );

-- Update plans: Only BCH of lead organization
DROP POLICY IF EXISTS "Lead Org Board can update plans" ON public.plans;
CREATE POLICY "Lead Org Board can update plans"
  ON public.plans FOR UPDATE
  USING (public.is_org_board(lead_organization_id))
  WITH CHECK (public.is_org_board(lead_organization_id));

-- Delete plans: Only BCH of lead organization
DROP POLICY IF EXISTS "Lead Org Board can delete plans" ON public.plans;
CREATE POLICY "Lead Org Board can delete plans"
  ON public.plans FOR DELETE
  USING (public.is_org_board(lead_organization_id));

-- =========================================================================
-- RLS POLICIES FOR PLAN_ORGANIZATIONS
-- =========================================================================

-- View plan organizations: Members of lead org, members of participating orgs, or the target org
DROP POLICY IF EXISTS "Members can view plan organizations" ON public.plan_organizations;
CREATE POLICY "Members can view plan organizations"
  ON public.plan_organizations FOR SELECT
  USING (
    public.can_user_view_plan_org(plan_id, organization_id)
  );

-- Insert plan organizations: Lead Org BCH (inviting co-hosts)
DROP POLICY IF EXISTS "Lead Org Board can invite organizations" ON public.plan_organizations;
CREATE POLICY "Lead Org Board can invite organizations"
  ON public.plan_organizations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.plans p
      WHERE p.id = public.plan_organizations.plan_id
        AND public.is_org_board(p.lead_organization_id)
    )
  );

-- Update plan organizations: Lead Org BCH (all fields) or Invited Org BCH (accepting/rejecting invite)
DROP POLICY IF EXISTS "Board can update plan organization participation" ON public.plan_organizations;
CREATE POLICY "Board can update plan organization participation"
  ON public.plan_organizations FOR UPDATE
  USING (
    public.is_org_board(organization_id)
    OR EXISTS (
      SELECT 1 FROM public.plans p
      WHERE p.id = public.plan_organizations.plan_id
        AND public.is_org_board(p.lead_organization_id)
    )
  )
  WITH CHECK (
    public.is_org_board(organization_id)
    OR EXISTS (
      SELECT 1 FROM public.plans p
      WHERE p.id = public.plan_organizations.plan_id
        AND public.is_org_board(p.lead_organization_id)
    )
  );

-- Delete plan organizations: Lead Org BCH (removing co-host) or Invited Org BCH (withdrawing)
DROP POLICY IF EXISTS "Board can remove plan organization participation" ON public.plan_organizations;
CREATE POLICY "Board can remove plan organization participation"
  ON public.plan_organizations FOR DELETE
  USING (
    public.is_org_board(organization_id)
    OR EXISTS (
      SELECT 1 FROM public.plans p
      WHERE p.id = public.plan_organizations.plan_id
        AND public.is_org_board(p.lead_organization_id)
    )
  );

-- =========================================================================
-- RLS POLICIES FOR COLLAB_ACTIVITIES
-- =========================================================================

-- View collab activities: Members of any active organization in the plan
DROP POLICY IF EXISTS "Participants can view collab activities" ON public.collab_activities;
CREATE POLICY "Participants can view collab activities"
  ON public.collab_activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.plans p
      WHERE p.id = public.collab_activities.plan_id
        AND (
          public.is_org_member(p.lead_organization_id)
          OR EXISTS (
            SELECT 1 FROM public.plan_organizations po
            WHERE po.plan_id = p.id
              AND po.status = 'active'
              AND public.is_org_member(po.organization_id)
          )
        )
    )
  );

-- Create collab activities: BCH of any active participating organization in the plan
DROP POLICY IF EXISTS "Active Participants Board can create collab activities" ON public.collab_activities;
CREATE POLICY "Active Participants Board can create collab activities"
  ON public.collab_activities FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.plans p
      WHERE p.id = public.collab_activities.plan_id
        AND (
          public.is_org_board(p.lead_organization_id)
          OR EXISTS (
            SELECT 1 FROM public.plan_organizations po
            WHERE po.plan_id = p.id
              AND po.status = 'active'
              AND public.is_org_board(po.organization_id)
          )
        )
    )
  );

-- Update collab activities: Lead Org BCH or Activity Lead Org BCH
DROP POLICY IF EXISTS "Board can update collab activities" ON public.collab_activities;
CREATE POLICY "Board can update collab activities"
  ON public.collab_activities FOR UPDATE
  USING (
    public.is_org_board(lead_organization_id)
    OR (organization_id IS NOT NULL AND public.is_org_board(organization_id))
    OR EXISTS (
      SELECT 1 FROM public.plans p
      WHERE p.id = public.collab_activities.plan_id
        AND public.is_org_board(p.lead_organization_id)
    )
  )
  WITH CHECK (
    public.is_org_board(lead_organization_id)
    OR (organization_id IS NOT NULL AND public.is_org_board(organization_id))
    OR EXISTS (
      SELECT 1 FROM public.plans p
      WHERE p.id = public.collab_activities.plan_id
        AND public.is_org_board(p.lead_organization_id)
    )
  );

-- Delete collab activities: Lead Org BCH or Activity Lead Org BCH
DROP POLICY IF EXISTS "Board can delete collab activities" ON public.collab_activities;
CREATE POLICY "Board can delete collab activities"
  ON public.collab_activities FOR DELETE
  USING (
    public.is_org_board(lead_organization_id)
    OR EXISTS (
      SELECT 1 FROM public.plans p
      WHERE p.id = public.collab_activities.plan_id
        AND public.is_org_board(p.lead_organization_id)
    )
  );

-- =========================================================================
-- RLS POLICIES FOR COLLAB_TASKS
-- =========================================================================

-- View collab tasks: Members of active organizations in the plan
DROP POLICY IF EXISTS "Participants can view collab tasks" ON public.collab_tasks;
CREATE POLICY "Participants can view collab tasks"
  ON public.collab_tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.collab_activities ca
      JOIN public.plans p ON p.id = ca.plan_id
      WHERE ca.id = public.collab_tasks.collab_activity_id
        AND (
          public.is_org_member(p.lead_organization_id)
          OR EXISTS (
            SELECT 1 FROM public.plan_organizations po
            WHERE po.plan_id = p.id
              AND po.status = 'active'
              AND public.is_org_member(po.organization_id)
          )
        )
    )
  );

-- Insert collab tasks: BCH of any active organization in the plan
DROP POLICY IF EXISTS "Active Participants Board can create collab tasks" ON public.collab_tasks;
CREATE POLICY "Active Participants Board can create collab tasks"
  ON public.collab_tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.collab_activities ca
      JOIN public.plans p ON p.id = ca.plan_id
      WHERE ca.id = public.collab_tasks.collab_activity_id
        AND (
          public.is_org_board(p.lead_organization_id)
          OR EXISTS (
            SELECT 1 FROM public.plan_organizations po
            WHERE po.plan_id = p.id
              AND po.status = 'active'
              AND public.is_org_board(po.organization_id)
          )
        )
    )
  );

-- Update collab tasks: Assignee or BCH of Task Org or Plan Lead Org
DROP POLICY IF EXISTS "Assignee or Board can update collab tasks" ON public.collab_tasks;
CREATE POLICY "Assignee or Board can update collab tasks"
  ON public.collab_tasks FOR UPDATE
  USING (
    auth.uid() = assigned_to
    OR (organization_id IS NOT NULL AND public.is_org_board(organization_id))
    OR EXISTS (
      SELECT 1 FROM public.collab_activities ca
      JOIN public.plans p ON p.id = ca.plan_id
      WHERE ca.id = public.collab_tasks.collab_activity_id
        AND public.is_org_board(p.lead_organization_id)
    )
  )
  WITH CHECK (
    auth.uid() = assigned_to
    OR (organization_id IS NOT NULL AND public.is_org_board(organization_id))
    OR EXISTS (
      SELECT 1 FROM public.collab_activities ca
      JOIN public.plans p ON p.id = ca.plan_id
      WHERE ca.id = public.collab_tasks.collab_activity_id
        AND public.is_org_board(p.lead_organization_id)
    )
  );

-- Delete collab tasks: BCH of Task Org or Plan Lead Org
DROP POLICY IF EXISTS "Board can delete collab tasks" ON public.collab_tasks;
CREATE POLICY "Board can delete collab tasks"
  ON public.collab_tasks FOR DELETE
  USING (
    (organization_id IS NOT NULL AND public.is_org_board(organization_id))
    OR EXISTS (
      SELECT 1 FROM public.collab_activities ca
      JOIN public.plans p ON p.id = ca.plan_id
      WHERE ca.id = public.collab_tasks.collab_activity_id
        AND public.is_org_board(p.lead_organization_id)
    )
  );

-- =========================================================================
-- RLS POLICIES FOR COLLAB_TRANSACTIONS
-- =========================================================================

-- View collab transactions: Members of any active organization in the plan
DROP POLICY IF EXISTS "Participants can view collab transactions" ON public.collab_transactions;
CREATE POLICY "Participants can view collab transactions"
  ON public.collab_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.plans p
      WHERE p.id = public.collab_transactions.plan_id
        AND (
          public.is_org_member(p.lead_organization_id)
          OR EXISTS (
            SELECT 1 FROM public.plan_organizations po
            WHERE po.plan_id = p.id
              AND po.status = 'active'
              AND public.is_org_member(po.organization_id)
          )
        )
    )
  );

-- Create collab transactions: BCH of contributing organization
DROP POLICY IF EXISTS "Board of contributing org can create collab transactions" ON public.collab_transactions;
CREATE POLICY "Board of contributing org can create collab transactions"
  ON public.collab_transactions FOR INSERT
  WITH CHECK (
    public.is_org_board(organization_id)
    AND EXISTS (
      SELECT 1 FROM public.plans p
      WHERE p.id = public.collab_transactions.plan_id
        AND (
          p.lead_organization_id = public.collab_transactions.organization_id
          OR EXISTS (
            SELECT 1 FROM public.plan_organizations po
            WHERE po.plan_id = p.id
              AND po.organization_id = public.collab_transactions.organization_id
              AND po.status = 'active'
          )
        )
    )
  );

-- Update collab transactions: Contributing Org BCH or Lead Org BCH
DROP POLICY IF EXISTS "Board can update collab transactions" ON public.collab_transactions;
CREATE POLICY "Board can update collab transactions"
  ON public.collab_transactions FOR UPDATE
  USING (
    public.is_org_board(organization_id)
    OR EXISTS (
      SELECT 1 FROM public.plans p
      WHERE p.id = public.collab_transactions.plan_id
        AND public.is_org_board(p.lead_organization_id)
    )
  )
  WITH CHECK (
    public.is_org_board(organization_id)
    OR EXISTS (
      SELECT 1 FROM public.plans p
      WHERE p.id = public.collab_transactions.plan_id
        AND public.is_org_board(p.lead_organization_id)
    )
  );

-- Delete collab transactions: Contributing Org BCH or Lead Org BCH
DROP POLICY IF EXISTS "Board can delete collab transactions" ON public.collab_transactions;
CREATE POLICY "Board can delete collab transactions"
  ON public.collab_transactions FOR DELETE
  USING (
    public.is_org_board(organization_id)
    OR EXISTS (
      SELECT 1 FROM public.plans p
      WHERE p.id = public.collab_transactions.plan_id
        AND public.is_org_board(p.lead_organization_id)
    )
  );

-- Migration: 20260831000000_harden_collab_tasks_assignee_update_rls.sql
-- Description: Harden UPDATE permissions on public.collab_tasks so Assignees can only update task status and cannot modify ownership, activity, organization, or metadata. Board (BCH) retains full management permissions.

-- 1. Helper function: Validates that an Assignee update does not modify immutable task fields
CREATE OR REPLACE FUNCTION public.can_assignee_update_collab_task(
  task_id UUID,
  new_collab_activity_id UUID,
  new_organization_id UUID,
  new_assigned_to UUID,
  new_title TEXT,
  new_description TEXT,
  new_priority TEXT,
  new_due_date TIMESTAMPTZ
)
RETURNS BOOLEAN AS $$
DECLARE
  v_existing public.collab_tasks%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Retrieve current state of the task from public.collab_tasks
  SELECT * INTO v_existing
  FROM public.collab_tasks
  WHERE id = task_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Ensure caller is the assigned user
  IF v_existing.assigned_to IS NULL OR v_existing.assigned_to <> auth.uid() THEN
    RETURN FALSE;
  END IF;

  -- Rule C: Assignee cannot move task to another activity
  IF v_existing.collab_activity_id IS DISTINCT FROM new_collab_activity_id THEN
    RETURN FALSE;
  END IF;

  -- Rule D: Assignee cannot change organization
  IF v_existing.organization_id IS DISTINCT FROM new_organization_id THEN
    RETURN FALSE;
  END IF;

  -- Rule E: Assignee cannot change assignee
  IF v_existing.assigned_to IS DISTINCT FROM new_assigned_to THEN
    RETURN FALSE;
  END IF;

  -- Rule F: Assignee cannot edit title / description / priority / due_date
  IF v_existing.title IS DISTINCT FROM new_title THEN
    RETURN FALSE;
  END IF;

  IF v_existing.description IS DISTINCT FROM new_description THEN
    RETURN FALSE;
  END IF;

  IF v_existing.priority IS DISTINCT FROM new_priority THEN
    RETURN FALSE;
  END IF;

  IF v_existing.due_date IS DISTINCT FROM new_due_date THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' STABLE;

-- Security hardening: Revoke execute from public/anon, grant only to authenticated
REVOKE EXECUTE ON FUNCTION public.can_assignee_update_collab_task(UUID, UUID, UUID, UUID, TEXT, TEXT, TEXT, TIMESTAMPTZ) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_assignee_update_collab_task(UUID, UUID, UUID, UUID, TEXT, TEXT, TEXT, TIMESTAMPTZ) TO authenticated;

-- 2. Drop old permissive update policy on collab_tasks
DROP POLICY IF EXISTS "Assignee or Board can update collab tasks" ON public.collab_tasks;
DROP POLICY IF EXISTS "Board can update collab tasks" ON public.collab_tasks;
DROP POLICY IF EXISTS "Assignee can update collab task status" ON public.collab_tasks;

-- 3. Policy A: Board (BCH) can update all fields of collab tasks
CREATE POLICY "Board can update collab tasks"
  ON public.collab_tasks FOR UPDATE
  TO authenticated
  USING (
    (organization_id IS NOT NULL AND public.is_org_board(organization_id))
    OR EXISTS (
      SELECT 1 FROM public.collab_activities ca
      JOIN public.plans p ON p.id = ca.plan_id
      WHERE ca.id = public.collab_tasks.collab_activity_id
        AND public.is_org_board(p.lead_organization_id)
    )
  )
  WITH CHECK (
    (organization_id IS NOT NULL AND public.is_org_board(organization_id))
    OR EXISTS (
      SELECT 1 FROM public.collab_activities ca
      JOIN public.plans p ON p.id = ca.plan_id
      WHERE ca.id = public.collab_tasks.collab_activity_id
        AND public.is_org_board(p.lead_organization_id)
    )
  );

-- 4. Policy B: Assignee can only update status (all metadata and ownership fields locked)
CREATE POLICY "Assignee can update collab task status"
  ON public.collab_tasks FOR UPDATE
  TO authenticated
  USING (
    assigned_to = auth.uid()
  )
  WITH CHECK (
    assigned_to = auth.uid()
    AND public.can_assignee_update_collab_task(
      id,
      collab_activity_id,
      organization_id,
      assigned_to,
      title,
      description,
      priority,
      due_date
    )
  );

-- Migration: 20260832000000_harden_invitations_and_role_assignment_rpc.sql
-- Description: Harden assign_role_by_email, accept_invitation, and claim_pending_roles RPCs with strict caller authorization and remove open SELECT RLS policies on public.invitations.

-- ==============================================================================
-- 0. ENSURE TABLES EXIST (invitations & organization_invites)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'member',
  max_uses INTEGER DEFAULT 1,
  uses_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invitations_org_id ON public.invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(token);

CREATE TABLE IF NOT EXISTS public.organization_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  status TEXT NOT NULL DEFAULT 'pending',
  invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_org_invites_email_org UNIQUE (email, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_org_invites_email ON public.organization_invites(email);
CREATE INDEX IF NOT EXISTS idx_org_invites_org ON public.organization_invites(organization_id);

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_invites ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 1. HARDEN assign_role_by_email
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.assign_role_by_email(
  p_email TEXT,
  p_org_id UUID,
  p_role TEXT
)
RETURNS VOID AS $$
DECLARE
  v_email TEXT;
BEGIN
  -- 1. Authentication check: Caller must be signed in
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- 2. Authorization check: Caller must be a board member (BCH) of target organization
  IF NOT public.is_org_board(p_org_id) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- 3. Validate role
  IF p_role NOT IN ('admin', 'leader', 'deputy', 'treasurer', 'secretary', 'member') THEN
    RAISE EXCEPTION 'Invalid role: %', p_role;
  END IF;

  v_email := lower(trim(p_email));
  IF v_email IS NULL OR v_email = '' THEN
    RAISE EXCEPTION 'Email is required';
  END IF;

  -- 4. Create or update pending invite in organization_invites table
  INSERT INTO public.organization_invites (
    email,
    organization_id,
    role,
    status,
    invited_by,
    created_at,
    updated_at
  )
  VALUES (
    v_email,
    p_org_id,
    p_role,
    'pending',
    auth.uid(),
    now(),
    now()
  )
  ON CONFLICT (email, organization_id)
  DO UPDATE SET
    role = EXCLUDED.role,
    status = 'pending',
    invited_by = EXCLUDED.invited_by,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- ==============================================================================
-- 2. HARDEN accept_invitation
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.accept_invitation(invite_token TEXT)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_invitation RECORD;
  v_org_name TEXT;
BEGIN
  -- 1. Authentication check
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: User must be authenticated to accept invitation';
  END IF;

  IF invite_token IS NULL OR trim(invite_token) = '' THEN
    RAISE EXCEPTION 'Invalid token: Token is required';
  END IF;

  -- 2. Retrieve invitation record by token
  SELECT * INTO v_invitation
  FROM public.invitations
  WHERE token = trim(invite_token)
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found or invalid';
  END IF;

  -- 3. Check expiration
  IF v_invitation.expires_at IS NOT NULL AND v_invitation.expires_at < now() THEN
    RAISE EXCEPTION 'Invitation has expired';
  END IF;

  -- 4. Check max uses
  IF v_invitation.max_uses IS NOT NULL AND v_invitation.max_uses > 0 AND v_invitation.uses_count >= v_invitation.max_uses THEN
    RAISE EXCEPTION 'Invitation has reached maximum uses limit';
  END IF;

  -- 5. Insert or update membership
  INSERT INTO public.organization_memberships (
    user_id,
    organization_id,
    role,
    status,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    v_invitation.organization_id,
    v_invitation.role,
    'active',
    now(),
    now()
  )
  ON CONFLICT (organization_id, user_id)
  DO UPDATE SET
    role = EXCLUDED.role,
    status = 'active',
    updated_at = now();

  -- 5b. Ensure member record exists in members table so Ban Chấp Hành / Members appear in member roster
  INSERT INTO public.members (
    organization_id,
    user_id,
    student_id,
    full_name,
    email,
    phone,
    status,
    joined_date
  )
  SELECT
    v_invitation.organization_id,
    v_user_id,
    p.student_id,
    COALESCE(p.full_name, 'Hội viên'),
    p.email,
    p.phone,
    'active',
    CURRENT_DATE
  FROM public.profiles p
  WHERE p.id = v_user_id
  ON CONFLICT (organization_id, user_id) DO NOTHING;

  -- 6. Increment uses count
  UPDATE public.invitations
  SET
    uses_count = uses_count + 1,
    updated_at = now()
  WHERE id = v_invitation.id;

  -- 7. Retrieve organization name for response
  SELECT name INTO v_org_name
  FROM public.organizations
  WHERE id = v_invitation.organization_id;

  RETURN jsonb_build_object(
    'success', true,
    'organization_id', v_invitation.organization_id,
    'organization_name', v_org_name,
    'role', v_invitation.role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ==============================================================================
-- 3. HARDEN claim_pending_roles
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.claim_pending_roles()
RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
  v_invite RECORD;
BEGIN
  -- 1. Authentication check
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN;
  END IF;

  -- 2. Extract email strictly from authenticated session JWT
  v_user_email := lower(trim(auth.jwt() ->> 'email'));

  -- Fallback to auth.users if JWT email is missing in session claims
  IF v_user_email IS NULL OR v_user_email = '' THEN
    SELECT lower(trim(email)) INTO v_user_email
    FROM auth.users
    WHERE id = v_user_id;
  END IF;

  IF v_user_email IS NULL OR v_user_email = '' THEN
    RETURN;
  END IF;

  -- 3. Process all pending invites for verified email
  FOR v_invite IN
    SELECT id, organization_id, role
    FROM public.organization_invites
    WHERE lower(email) = v_user_email
      AND status = 'pending'
    FOR UPDATE
  LOOP
    -- Insert or update membership
    INSERT INTO public.organization_memberships (
      user_id,
      organization_id,
      role,
      status,
      created_at,
      updated_at
    )
    VALUES (
      v_user_id,
      v_invite.organization_id,
      v_invite.role,
      'active',
      now(),
      now()
    )
    ON CONFLICT (organization_id, user_id)
    DO UPDATE SET
      role = EXCLUDED.role,
      status = 'active',
      updated_at = now();

    -- Ensure member record exists in members table
    INSERT INTO public.members (
      organization_id,
      user_id,
      student_id,
      full_name,
      email,
      phone,
      status,
      joined_date
    )
    SELECT
      v_invite.organization_id,
      v_user_id,
      p.student_id,
      COALESCE(p.full_name, 'Hội viên'),
      p.email,
      p.phone,
      'active',
      CURRENT_DATE
    FROM public.profiles p
    WHERE p.id = v_user_id
    ON CONFLICT (organization_id, user_id) DO NOTHING;

    -- Mark invite as claimed
    UPDATE public.organization_invites
    SET
      status = 'accepted',
      updated_at = now()
    WHERE id = v_invite.id;
  END LOOP;

  -- 4. Also link any unlinked member records matching email
  UPDATE public.members
  SET
    user_id = v_user_id,
    updated_at = now()
  WHERE lower(email) = v_user_email
    AND user_id IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ==============================================================================
-- 4. HARDEN EXECUTE PRIVILEGES ON ALL 3 RPCS
-- ==============================================================================
GRANT EXECUTE ON FUNCTION public.assign_role_by_email(TEXT, UUID, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.accept_invitation(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_pending_roles() TO anon, authenticated;

-- ==============================================================================
-- 5. HARDEN RLS ON public.invitations
-- ==============================================================================
ALTER TABLE IF EXISTS public.invitations ENABLE ROW LEVEL SECURITY;

-- Drop permissive public read policies
DROP POLICY IF EXISTS "Anyone can read invitation by token" ON public.invitations;
DROP POLICY IF EXISTS "Public can read invitation by token" ON public.invitations;
DROP POLICY IF EXISTS "Anyone can view invitations by token" ON public.invitations;
DROP POLICY IF EXISTS "Allow public read invitation" ON public.invitations;
DROP POLICY IF EXISTS "Anyone can read invitations" ON public.invitations;

-- Ensure BCH can create invitations policy exists
DROP POLICY IF EXISTS "BCH can create invitations" ON public.invitations;
CREATE POLICY "BCH can create invitations"
  ON public.invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_org_board(organization_id)
  );

-- ==============================================================================
-- Migration: 20260833000000_add_profiles_insert_rls.sql
-- Description:
--   1. Add RLS INSERT policy on public.profiles to allow authenticated users
--      to safely upsert their own profile without violating RLS.
--   2. Ensure handle_new_user() trigger function has SECURITY DEFINER and search_path set.
-- ==============================================================================

-- 1. Thêm policy cho phép user tự thêm (INSERT) profile của chính mình
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' AND policyname = 'Users can insert own profile'
  ) THEN
    CREATE POLICY "Users can insert own profile"
      ON public.profiles FOR INSERT
      TO authenticated
      WITH CHECK (id = auth.uid());
  END IF;
END $$;

-- 2. Củng cố hàm trigger handle_new_user với SECURITY DEFINER và search_path chuẩn
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Đảm bảo trigger gắn liền với bảng auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Migration: 20260834000000_add_missing_schema_columns.sql
-- Description: Add missing columns across organizations, activities, and documents tables to match full ChapterOS domain schema.

-- 1. Organizations
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'chi_hoi',
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS finance_approval_threshold NUMERIC DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_organizations_parent_id ON public.organizations(parent_id);
CREATE INDEX IF NOT EXISTS idx_organizations_type ON public.organizations(type);

-- 2. Activities
ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'event',
  ADD COLUMN IF NOT EXISTS points NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_activities_plan_id ON public.activities(plan_id);

-- 3. Documents
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS drive_file_id TEXT,
  ADD COLUMN IF NOT EXISTS drive_url TEXT,
  ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'google_drive',
  ADD COLUMN IF NOT EXISTS linked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_documents_drive_file_id ON public.documents(drive_file_id);

-- 4. Finance Transactions
ALTER TABLE public.finance_transactions
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ DEFAULT NULL;


-- ============================================================
-- FIX: Organization Creation Policies & Auto-Membership Trigger
-- ============================================================

DROP POLICY IF EXISTS "Authenticated users can create organization" ON public.organizations;
CREATE POLICY "Authenticated users can create organization"
  ON public.organizations FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Users can insert own membership" ON public.organization_memberships;
CREATE POLICY "Users can insert own membership"
  ON public.organization_memberships FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.handle_new_organization()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.organization_memberships (organization_id, user_id, role, status)
  VALUES (NEW.id, auth.uid(), 'admin', 'active')
  ON CONFLICT (organization_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_organization_created ON public.organizations;
CREATE TRIGGER on_organization_created
  AFTER INSERT ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_organization();
