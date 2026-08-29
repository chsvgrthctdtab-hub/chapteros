-- ==============================================================================
-- Migration: 20260814000006_google_calendar_and_audit_logs.sql
-- Description: Phase 2 Foundation - Google Calendar Events & System Audit Logs
-- ==============================================================================

-- 1. Table: google_calendar_events (and activity_calendar_events compatibility)
CREATE TABLE IF NOT EXISTS public.google_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  google_calendar_id TEXT NOT NULL DEFAULT 'primary',
  google_event_id TEXT NOT NULL,
  event_url TEXT,
  status TEXT NOT NULL DEFAULT 'synced' CHECK (status IN ('linked', 'synced', 'error', 'unavailable')),
  last_synced_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_activity_google_calendar UNIQUE (activity_id, google_calendar_id)
);

-- Backward/forward compatibility table activity_calendar_events
CREATE TABLE IF NOT EXISTS public.activity_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  google_calendar_id TEXT NOT NULL DEFAULT 'primary',
  google_event_id TEXT NOT NULL,
  event_url TEXT,
  status TEXT NOT NULL DEFAULT 'synced' CHECK (status IN ('linked', 'synced', 'error', 'unavailable')),
  last_synced_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_act_cal_event_activity UNIQUE (activity_id)
);

-- Triggers for auto updated_at
CREATE TRIGGER set_google_calendar_events_updated_at
  BEFORE UPDATE ON public.google_calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_activity_calendar_events_updated_at
  BEFORE UPDATE ON public.activity_calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Indexes for google_calendar_events
CREATE INDEX IF NOT EXISTS idx_calendar_events_org ON public.google_calendar_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_activity ON public.google_calendar_events(activity_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_status ON public.google_calendar_events(status);
CREATE INDEX IF NOT EXISTS idx_calendar_events_google_id ON public.google_calendar_events(google_event_id);

CREATE INDEX IF NOT EXISTS idx_act_calendar_events_org ON public.activity_calendar_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_act_calendar_events_activity ON public.activity_calendar_events(activity_id);

-- 2. Table: audit_logs (Hệ thống ghi vết hoạt động và thao tác quan trọng)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON public.audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- 3. Row Level Security (RLS)
ALTER TABLE public.google_calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Google Calendar Policies
CREATE POLICY "Members can view calendar events in organization"
  ON public.google_calendar_events
  FOR SELECT
  TO authenticated
  USING (public.is_org_member(organization_id));

CREATE POLICY "Board can manage google calendar events"
  ON public.google_calendar_events
  FOR ALL
  TO authenticated
  USING (public.is_org_board(organization_id))
  WITH CHECK (public.is_org_board(organization_id));

CREATE POLICY "Members can view activity calendar events"
  ON public.activity_calendar_events
  FOR SELECT
  TO authenticated
  USING (public.is_org_member(organization_id));

CREATE POLICY "Board can manage activity calendar events"
  ON public.activity_calendar_events
  FOR ALL
  TO authenticated
  USING (public.is_org_board(organization_id))
  WITH CHECK (public.is_org_board(organization_id));

-- Audit Logs Policies
CREATE POLICY "Members can view organization audit logs"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (public.is_org_member(organization_id));

CREATE POLICY "Authenticated users can insert audit logs"
  ON public.audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND public.is_org_member(organization_id)
  );
