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

