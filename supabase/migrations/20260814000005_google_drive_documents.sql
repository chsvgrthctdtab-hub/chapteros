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
