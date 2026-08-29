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
