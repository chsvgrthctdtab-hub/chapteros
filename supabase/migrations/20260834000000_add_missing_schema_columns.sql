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
