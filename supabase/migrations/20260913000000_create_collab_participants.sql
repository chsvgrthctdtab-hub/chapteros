-- Migration: 20260913000000_create_collab_participants.sql
-- Description: Dedicated table for collaboration campaign participants & attendance

CREATE TABLE IF NOT EXISTS public.collab_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  collab_activity_id UUID REFERENCES public.collab_activities(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  external_organization TEXT,
  member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  student_id TEXT,
  class_name TEXT,
  cohort TEXT,
  phone TEXT,
  email TEXT,
  role_title TEXT DEFAULT 'Tình nguyện viên',
  attendance_status TEXT NOT NULL DEFAULT 'unmarked' CHECK (attendance_status IN ('unmarked', 'present', 'absent')),
  attended_at TIMESTAMPTZ,
  notes TEXT,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'import', 'google_form', 'system')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for efficient queries and lookups
CREATE INDEX IF NOT EXISTS idx_collab_participants_plan ON public.collab_participants(plan_id);
CREATE INDEX IF NOT EXISTS idx_collab_participants_activity ON public.collab_participants(collab_activity_id);
CREATE INDEX IF NOT EXISTS idx_collab_participants_org ON public.collab_participants(organization_id);
CREATE INDEX IF NOT EXISTS idx_collab_participants_student ON public.collab_participants(student_id);
CREATE INDEX IF NOT EXISTS idx_collab_participants_status ON public.collab_participants(attendance_status);

-- Enable RLS
ALTER TABLE public.collab_participants ENABLE ROW LEVEL SECURITY;

-- Policies for collab_participants
-- 1. Read: members of any participating organization (lead or co-host) can view participants
DROP POLICY IF EXISTS "collab_participants_select_policy" ON public.collab_participants;
CREATE POLICY "collab_participants_select_policy"
  ON public.collab_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.plans p
      WHERE p.id = collab_participants.plan_id
        AND (
          p.lead_organization_id IN (
            SELECT organization_id FROM public.organization_memberships
            WHERE user_id = auth.uid() AND status = 'active'
          )
          OR EXISTS (
            SELECT 1 FROM public.plan_organizations po
            WHERE po.plan_id = p.id
              AND po.status = 'active'
              AND po.organization_id IN (
                SELECT organization_id FROM public.organization_memberships
                WHERE user_id = auth.uid() AND status = 'active'
              )
          )
        )
    )
  );

-- 2. Insert: Active members in participating organizations can add participants
DROP POLICY IF EXISTS "collab_participants_insert_policy" ON public.collab_participants;
CREATE POLICY "collab_participants_insert_policy"
  ON public.collab_participants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.plans p
      WHERE p.id = collab_participants.plan_id
        AND (
          p.lead_organization_id IN (
            SELECT organization_id FROM public.organization_memberships
            WHERE user_id = auth.uid() AND status = 'active'
          )
          OR EXISTS (
            SELECT 1 FROM public.plan_organizations po
            WHERE po.plan_id = p.id
              AND po.status = 'active'
              AND po.organization_id IN (
                SELECT organization_id FROM public.organization_memberships
                WHERE user_id = auth.uid() AND status = 'active'
              )
          )
        )
    )
  );

-- 3. Update: Active members in participating organizations can update attendance & info
DROP POLICY IF EXISTS "collab_participants_update_policy" ON public.collab_participants;
CREATE POLICY "collab_participants_update_policy"
  ON public.collab_participants FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.plans p
      WHERE p.id = collab_participants.plan_id
        AND (
          p.lead_organization_id IN (
            SELECT organization_id FROM public.organization_memberships
            WHERE user_id = auth.uid() AND status = 'active'
          )
          OR EXISTS (
            SELECT 1 FROM public.plan_organizations po
            WHERE po.plan_id = p.id
              AND po.status = 'active'
              AND po.organization_id IN (
                SELECT organization_id FROM public.organization_memberships
                WHERE user_id = auth.uid() AND status = 'active'
              )
          )
        )
    )
  );

-- 4. Delete: Active members in participating organizations can remove participants
DROP POLICY IF EXISTS "collab_participants_delete_policy" ON public.collab_participants;
CREATE POLICY "collab_participants_delete_policy"
  ON public.collab_participants FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.plans p
      WHERE p.id = collab_participants.plan_id
        AND (
          p.lead_organization_id IN (
            SELECT organization_id FROM public.organization_memberships
            WHERE user_id = auth.uid() AND status = 'active'
          )
          OR EXISTS (
            SELECT 1 FROM public.plan_organizations po
            WHERE po.plan_id = p.id
              AND po.status = 'active'
              AND po.organization_id IN (
                SELECT organization_id FROM public.organization_memberships
                WHERE user_id = auth.uid() AND status = 'active'
              )
          )
        )
    )
  );
