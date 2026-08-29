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
