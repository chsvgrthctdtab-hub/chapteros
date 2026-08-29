-- ==============================================================================
-- Migration: 20260822000000_audit_logs_rbac_and_notifications.sql
-- Description: Phase 3.2 - Audit Log RBAC Hardening & Notification Center Infrastructure
-- ==============================================================================

-- 1. Hardening Audit Logs RBAC Policies
-- Only Admin, Leader (Chi hội trưởng) and Deputy (Chi hội phó) can view audit logs
DROP POLICY IF EXISTS "Members can view organization audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Board and admins can view organization audit logs" ON public.audit_logs;

CREATE POLICY "Board and admins can view organization audit logs"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (
    public.has_org_role(organization_id, ARRAY['admin', 'leader', 'deputy'])
  );

-- 2. User Notification Reads Table (for persistent read/unread state across sessions)
CREATE TABLE IF NOT EXISTS public.user_notification_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notification_key TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT true,
  read_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT uq_user_notification_read UNIQUE (user_id, organization_id, notification_key)
);

CREATE INDEX IF NOT EXISTS idx_user_notif_reads_user_org ON public.user_notification_reads(user_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_user_notif_reads_key ON public.user_notification_reads(notification_key);

ALTER TABLE public.user_notification_reads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own notification reads" ON public.user_notification_reads;
CREATE POLICY "Users can manage their own notification reads"
  ON public.user_notification_reads
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 3. Explicit Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- NULL means broadcast to all org members
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'danger', 'success')),
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('task', 'activity', 'finance', 'document', 'integration', 'system', 'general')),
  link TEXT,
  entity_type TEXT,
  entity_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_notifications_org ON public.notifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view relevant notifications" ON public.notifications;
CREATE POLICY "Users can view relevant notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (
    public.is_org_member(organization_id)
    AND (user_id IS NULL OR user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Board can create notifications" ON public.notifications;
CREATE POLICY "Board can create notifications"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_org_board(organization_id)
  );
