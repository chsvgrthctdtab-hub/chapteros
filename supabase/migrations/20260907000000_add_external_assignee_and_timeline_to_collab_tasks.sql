-- ==============================================================================
-- MIGRATION: Add external assignee, contact, phase, and due_time to collab_tasks
-- ==============================================================================

ALTER TABLE public.collab_tasks
  ADD COLUMN IF NOT EXISTS external_assignee TEXT,
  ADD COLUMN IF NOT EXISTS external_contact TEXT,
  ADD COLUMN IF NOT EXISTS phase TEXT,
  ADD COLUMN IF NOT EXISTS due_time TEXT;

CREATE INDEX IF NOT EXISTS idx_collab_tasks_phase ON public.collab_tasks(phase);
