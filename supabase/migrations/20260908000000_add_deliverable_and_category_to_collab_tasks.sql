-- ==============================================================================
-- MIGRATION: Add deliverable, category, and external_organization to collab_tasks
-- ==============================================================================

ALTER TABLE public.collab_tasks
  ADD COLUMN IF NOT EXISTS deliverable TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS external_organization TEXT;

CREATE INDEX IF NOT EXISTS idx_collab_tasks_category ON public.collab_tasks(category);
