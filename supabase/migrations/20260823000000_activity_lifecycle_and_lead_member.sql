-- ==============================================================================
-- Migration: 20260823000000_activity_lifecycle_and_lead_member.sql
-- Description: Add lead_member_id to activities, enforce tenant validation, and notify PostgREST
-- ==============================================================================

-- 1. Add lead_member_id column to activities if not exists
ALTER TABLE public.activities
ADD COLUMN IF NOT EXISTS lead_member_id UUID;

-- 2. Clean orphan data if any exists before foreign key constraint
UPDATE public.activities
SET lead_member_id = NULL
WHERE lead_member_id IS NOT NULL
  AND lead_member_id NOT IN (SELECT id FROM public.members);

-- 3. Add explicit foreign key constraint if not already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'activities_lead_member_id_fkey'
      AND conrelid = 'public.activities'::regclass
  ) THEN
    ALTER TABLE public.activities
      ADD CONSTRAINT activities_lead_member_id_fkey
      FOREIGN KEY (lead_member_id) REFERENCES public.members(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 4. Index for lead_member_id
CREATE INDEX IF NOT EXISTS idx_activities_lead_member_id ON public.activities(lead_member_id);

-- 5. Trigger to ensure lead_member belongs to the same organization as the activity
CREATE OR REPLACE FUNCTION public.validate_activity_lead_member()
RETURNS TRIGGER AS $$
DECLARE
  v_lead_org_id UUID;
BEGIN
  IF NEW.lead_member_id IS NOT NULL THEN
    SELECT organization_id INTO v_lead_org_id
    FROM public.members
    WHERE id = NEW.lead_member_id;

    IF v_lead_org_id IS NULL OR v_lead_org_id != NEW.organization_id THEN
      RAISE EXCEPTION 'Người phụ trách chính không thuộc Chi hội hiện tại (lead_member_id must belong to the same organization)'
        USING ERRCODE = '23503';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_validate_activity_lead_member ON public.activities;
CREATE TRIGGER trg_validate_activity_lead_member
  BEFORE INSERT OR UPDATE OF lead_member_id, organization_id ON public.activities
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_activity_lead_member();

-- 6. Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
