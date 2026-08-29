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
