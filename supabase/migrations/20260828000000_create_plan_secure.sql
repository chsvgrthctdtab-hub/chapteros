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
