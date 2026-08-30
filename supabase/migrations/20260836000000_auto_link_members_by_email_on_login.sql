-- ==============================================================================
-- MIGRATION: Auto-link members and create memberships on login matching members roster
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.claim_pending_roles()
RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
  v_invite RECORD;
  v_member RECORD;
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

  -- 4. ALSO AUTO-JOIN ORGANIZATIONS WHERE USER'S EMAIL EXISTS IN public.members ROSTER
  FOR v_member IN
    SELECT m.organization_id, m.position
    FROM public.members m
    WHERE lower(trim(m.email)) = v_user_email
  LOOP
    DECLARE
      v_assigned_role public.organization_role := 'member';
      v_pos TEXT := lower(coalesce(v_member.position, ''));
    BEGIN
      IF v_pos LIKE '%chi hội trưởng%' OR v_pos LIKE '%trưởng%' OR v_pos LIKE '%chủ nhiệm%' OR v_pos LIKE '%đội trưởng%' OR v_pos LIKE '%bí thư%' THEN
        v_assigned_role := 'leader';
      ELSIF v_pos LIKE '%phó%' THEN
        v_assigned_role := 'deputy';
      ELSIF v_pos LIKE '%thủ quỹ%' THEN
        v_assigned_role := 'treasurer';
      ELSIF v_pos LIKE '%thư ký%' OR v_pos LIKE '%ủy viên%' THEN
        v_assigned_role := 'secretary';
      END IF;

      -- Create active membership if not already existing
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
        v_member.organization_id,
        v_assigned_role,
        'active',
        now(),
        now()
      )
      ON CONFLICT (organization_id, user_id)
      DO UPDATE SET
        role = CASE
          WHEN public.organization_memberships.role = 'admin' THEN 'admin'
          WHEN EXCLUDED.role = 'leader' AND public.organization_memberships.role != 'admin' THEN 'leader'
          WHEN EXCLUDED.role IN ('deputy', 'treasurer', 'secretary') AND public.organization_memberships.role = 'member' THEN EXCLUDED.role
          ELSE public.organization_memberships.role
        END,
        status = 'active',
        updated_at = now();

      -- Link member record to user_id
      UPDATE public.members
      SET
        user_id = v_user_id,
        updated_at = now()
      WHERE lower(trim(email)) = v_user_email
        AND organization_id = v_member.organization_id;
    END;
  END LOOP;

  -- 5. Link any remaining unlinked member records matching email
  UPDATE public.members
  SET
    user_id = v_user_id,
    updated_at = now()
  WHERE lower(trim(email)) = v_user_email
    AND user_id IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

GRANT EXECUTE ON FUNCTION public.claim_pending_roles() TO anon, authenticated;
