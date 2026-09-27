-- ==============================================================================
-- Migration: 20260927100000_allow_member_task_assignment.sql
-- Description: Allow assigning tasks to both profiles and direct roster members (BCH / members)
-- ==============================================================================

-- 1. Drop strict profiles foreign key constraint on public.tasks(assigned_to)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tasks_assigned_to_fkey'
      AND conrelid = 'public.tasks'::regclass
  ) THEN
    ALTER TABLE public.tasks DROP CONSTRAINT tasks_assigned_to_fkey;
  END IF;
END $$;

-- 2. Drop strict profiles foreign key constraint on public.collab_tasks(assigned_to)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'collab_tasks_assigned_to_fkey'
      AND conrelid = 'public.collab_tasks'::regclass
  ) THEN
    ALTER TABLE public.collab_tasks DROP CONSTRAINT collab_tasks_assigned_to_fkey;
  END IF;
END $$;

-- 3. Ensure indexes on assigned_to exist for high performance querying
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to_relaxed ON public.tasks(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_collab_tasks_assigned_to_relaxed ON public.collab_tasks(assigned_to) WHERE assigned_to IS NOT NULL;

-- 4. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
