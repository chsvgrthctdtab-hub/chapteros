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

