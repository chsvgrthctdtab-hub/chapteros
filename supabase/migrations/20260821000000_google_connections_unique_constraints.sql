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
