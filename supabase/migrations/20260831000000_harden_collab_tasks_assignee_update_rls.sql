-- Migration: 20260831000000_harden_collab_tasks_assignee_update_rls.sql
-- Description: Harden UPDATE permissions on public.collab_tasks so Assignees can only update task status and cannot modify ownership, activity, organization, or metadata. Board (BCH) retains full management permissions.

-- 1. Helper function: Validates that an Assignee update does not modify immutable task fields
CREATE OR REPLACE FUNCTION public.can_assignee_update_collab_task(
  task_id UUID,
  new_collab_activity_id UUID,
  new_organization_id UUID,
  new_assigned_to UUID,
  new_title TEXT,
  new_description TEXT,
  new_priority TEXT,
  new_due_date TIMESTAMPTZ
)
RETURNS BOOLEAN AS $$
DECLARE
  v_existing public.collab_tasks%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Retrieve current state of the task from public.collab_tasks
  SELECT * INTO v_existing
  FROM public.collab_tasks
  WHERE id = task_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Ensure caller is the assigned user
  IF v_existing.assigned_to IS NULL OR v_existing.assigned_to <> auth.uid() THEN
    RETURN FALSE;
  END IF;

  -- Rule C: Assignee cannot move task to another activity
  IF v_existing.collab_activity_id IS DISTINCT FROM new_collab_activity_id THEN
    RETURN FALSE;
  END IF;

  -- Rule D: Assignee cannot change organization
  IF v_existing.organization_id IS DISTINCT FROM new_organization_id THEN
    RETURN FALSE;
  END IF;

  -- Rule E: Assignee cannot change assignee
  IF v_existing.assigned_to IS DISTINCT FROM new_assigned_to THEN
    RETURN FALSE;
  END IF;

  -- Rule F: Assignee cannot edit title / description / priority / due_date
  IF v_existing.title IS DISTINCT FROM new_title THEN
    RETURN FALSE;
  END IF;

  IF v_existing.description IS DISTINCT FROM new_description THEN
    RETURN FALSE;
  END IF;

  IF v_existing.priority IS DISTINCT FROM new_priority THEN
    RETURN FALSE;
  END IF;

  IF v_existing.due_date IS DISTINCT FROM new_due_date THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' STABLE;

-- Security hardening: Revoke execute from public/anon, grant only to authenticated
REVOKE EXECUTE ON FUNCTION public.can_assignee_update_collab_task(UUID, UUID, UUID, UUID, TEXT, TEXT, TEXT, TIMESTAMPTZ) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_assignee_update_collab_task(UUID, UUID, UUID, UUID, TEXT, TEXT, TEXT, TIMESTAMPTZ) TO authenticated;

-- 2. Drop old permissive update policy on collab_tasks
DROP POLICY IF EXISTS "Assignee or Board can update collab tasks" ON public.collab_tasks;
DROP POLICY IF EXISTS "Board can update collab tasks" ON public.collab_tasks;
DROP POLICY IF EXISTS "Assignee can update collab task status" ON public.collab_tasks;

-- 3. Policy A: Board (BCH) can update all fields of collab tasks
CREATE POLICY "Board can update collab tasks"
  ON public.collab_tasks FOR UPDATE
  TO authenticated
  USING (
    (organization_id IS NOT NULL AND public.is_org_board(organization_id))
    OR EXISTS (
      SELECT 1 FROM public.collab_activities ca
      JOIN public.plans p ON p.id = ca.plan_id
      WHERE ca.id = public.collab_tasks.collab_activity_id
        AND public.is_org_board(p.lead_organization_id)
    )
  )
  WITH CHECK (
    (organization_id IS NOT NULL AND public.is_org_board(organization_id))
    OR EXISTS (
      SELECT 1 FROM public.collab_activities ca
      JOIN public.plans p ON p.id = ca.plan_id
      WHERE ca.id = public.collab_tasks.collab_activity_id
        AND public.is_org_board(p.lead_organization_id)
    )
  );

-- 4. Policy B: Assignee can only update status (all metadata and ownership fields locked)
CREATE POLICY "Assignee can update collab task status"
  ON public.collab_tasks FOR UPDATE
  TO authenticated
  USING (
    assigned_to = auth.uid()
  )
  WITH CHECK (
    assigned_to = auth.uid()
    AND public.can_assignee_update_collab_task(
      id,
      collab_activity_id,
      organization_id,
      assigned_to,
      title,
      description,
      priority,
      due_date
    )
  );
