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
