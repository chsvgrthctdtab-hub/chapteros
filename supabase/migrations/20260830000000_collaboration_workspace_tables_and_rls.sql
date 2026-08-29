-- Migration: 20260830000000_collaboration_workspace_tables_and_rls.sql
-- Description: Creates collaboration workspace tables (plans, plan_organizations, collab_activities, collab_tasks, collab_transactions) and enforces strict cross-organization RLS policies

-- 1. Table: plans (Multi-organization Collaboration Plans / Campaigns)
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  lead_organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('draft', 'planning', 'active', 'completed', 'cancelled')),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Table: plan_organizations (Participating / Co-hosting Organizations in Collaboration Plan)
CREATE TABLE IF NOT EXISTS public.plan_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role_in_plan TEXT NOT NULL DEFAULT 'co_host' CHECK (role_in_plan IN ('host', 'co_host', 'partner', 'supporter', 'observer')),
  is_host BOOLEAN NOT NULL DEFAULT false,
  role_description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected', 'removed')),
  joined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_plan_organization UNIQUE (plan_id, organization_id)
);

-- 3. Table: collab_activities (Collaborative Activities within a Collaboration Plan)
CREATE TABLE IF NOT EXISTS public.collab_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  lead_organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'volunteer' CHECK (category IN ('general', 'volunteer', 'academic', 'sports', 'culture', 'meeting', 'training')),
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('draft', 'planning', 'published', 'in_progress', 'completed', 'cancelled')),
  location TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  banner_url TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Table: collab_tasks (Collaborative Tasks assigned across participating organizations)
CREATE TABLE IF NOT EXISTS public.collab_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collab_activity_id UUID REFERENCES public.collab_activities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Table: collab_transactions (Isolated Financial Records for Collaboration Plans)
CREATE TABLE IF NOT EXISTS public.collab_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  collab_activity_id UUID REFERENCES public.collab_activities(id) ON DELETE SET NULL,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL DEFAULT 'expense' CHECK (transaction_type IN ('income', 'expense')),
  amount NUMERIC(15, 2) NOT NULL CHECK (amount >= 0),
  category_name TEXT NOT NULL,
  description TEXT NOT NULL,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_url TEXT,
  recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for optimal querying
CREATE INDEX IF NOT EXISTS idx_plans_lead_org ON public.plans(lead_organization_id);
CREATE INDEX IF NOT EXISTS idx_plans_status ON public.plans(status);
CREATE INDEX IF NOT EXISTS idx_plan_orgs_plan_id ON public.plan_organizations(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_orgs_org_id ON public.plan_organizations(organization_id);
CREATE INDEX IF NOT EXISTS idx_collab_act_plan ON public.collab_activities(plan_id);
CREATE INDEX IF NOT EXISTS idx_collab_act_lead_org ON public.collab_activities(lead_organization_id);
CREATE INDEX IF NOT EXISTS idx_collab_tasks_act ON public.collab_tasks(collab_activity_id);
CREATE INDEX IF NOT EXISTS idx_collab_tasks_assignee ON public.collab_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_collab_tasks_org ON public.collab_tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_collab_tx_plan ON public.collab_transactions(plan_id);
CREATE INDEX IF NOT EXISTS idx_collab_tx_org ON public.collab_transactions(organization_id);

-- Enable Row-Level Security (RLS)
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collab_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collab_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collab_transactions ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- HELPER FUNCTIONS FOR COLLABORATION (SECURITY DEFINER TO PREVENT RLS RECURSION)
-- =========================================================================

CREATE OR REPLACE FUNCTION public.can_user_view_plan(p_plan_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.plans p
    WHERE p.id = p_plan_id
      AND (
        public.is_org_member(p.lead_organization_id)
        OR EXISTS (
          SELECT 1 FROM public.plan_organizations po
          WHERE po.plan_id = p.id
            AND po.status IN ('active', 'pending')
            AND public.is_org_member(po.organization_id)
        )
      )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE;

CREATE OR REPLACE FUNCTION public.can_user_view_plan_org(p_plan_id UUID, p_org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF public.is_org_member(p_org_id) THEN
    RETURN true;
  END IF;
  RETURN public.can_user_view_plan(p_plan_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE;

GRANT EXECUTE ON FUNCTION public.can_user_view_plan(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.can_user_view_plan_org(UUID, UUID) TO anon, authenticated;

-- =========================================================================
-- RLS POLICIES FOR PLANS
-- =========================================================================

-- View plans: Members of lead org or any invited/participating org
DROP POLICY IF EXISTS "Members can view collaboration plans" ON public.plans;
CREATE POLICY "Members can view collaboration plans"
  ON public.plans FOR SELECT
  USING (
    public.is_org_member(lead_organization_id)
    OR public.can_user_view_plan(id)
  );

-- Create plans: Only BCH of lead organization
DROP POLICY IF EXISTS "Lead Org Board can insert plans" ON public.plans;
CREATE POLICY "Lead Org Board can insert plans"
  ON public.plans FOR INSERT
  WITH CHECK (
    public.is_org_board(lead_organization_id)
  );

-- Update plans: Only BCH of lead organization
DROP POLICY IF EXISTS "Lead Org Board can update plans" ON public.plans;
CREATE POLICY "Lead Org Board can update plans"
  ON public.plans FOR UPDATE
  USING (public.is_org_board(lead_organization_id))
  WITH CHECK (public.is_org_board(lead_organization_id));

-- Delete plans: Only BCH of lead organization
DROP POLICY IF EXISTS "Lead Org Board can delete plans" ON public.plans;
CREATE POLICY "Lead Org Board can delete plans"
  ON public.plans FOR DELETE
  USING (public.is_org_board(lead_organization_id));

-- =========================================================================
-- RLS POLICIES FOR PLAN_ORGANIZATIONS
-- =========================================================================

-- View plan organizations: Members of lead org, members of participating orgs, or the target org
DROP POLICY IF EXISTS "Members can view plan organizations" ON public.plan_organizations;
CREATE POLICY "Members can view plan organizations"
  ON public.plan_organizations FOR SELECT
  USING (
    public.can_user_view_plan_org(plan_id, organization_id)
  );

-- Insert plan organizations: Lead Org BCH (inviting co-hosts)
DROP POLICY IF EXISTS "Lead Org Board can invite organizations" ON public.plan_organizations;
CREATE POLICY "Lead Org Board can invite organizations"
  ON public.plan_organizations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.plans p
      WHERE p.id = public.plan_organizations.plan_id
        AND public.is_org_board(p.lead_organization_id)
    )
  );

-- Update plan organizations: Lead Org BCH (all fields) or Invited Org BCH (accepting/rejecting invite)
DROP POLICY IF EXISTS "Board can update plan organization participation" ON public.plan_organizations;
CREATE POLICY "Board can update plan organization participation"
  ON public.plan_organizations FOR UPDATE
  USING (
    public.is_org_board(organization_id)
    OR EXISTS (
      SELECT 1 FROM public.plans p
      WHERE p.id = public.plan_organizations.plan_id
        AND public.is_org_board(p.lead_organization_id)
    )
  )
  WITH CHECK (
    public.is_org_board(organization_id)
    OR EXISTS (
      SELECT 1 FROM public.plans p
      WHERE p.id = public.plan_organizations.plan_id
        AND public.is_org_board(p.lead_organization_id)
    )
  );

-- Delete plan organizations: Lead Org BCH (removing co-host) or Invited Org BCH (withdrawing)
DROP POLICY IF EXISTS "Board can remove plan organization participation" ON public.plan_organizations;
CREATE POLICY "Board can remove plan organization participation"
  ON public.plan_organizations FOR DELETE
  USING (
    public.is_org_board(organization_id)
    OR EXISTS (
      SELECT 1 FROM public.plans p
      WHERE p.id = public.plan_organizations.plan_id
        AND public.is_org_board(p.lead_organization_id)
    )
  );

-- =========================================================================
-- RLS POLICIES FOR COLLAB_ACTIVITIES
-- =========================================================================

-- View collab activities: Members of any active organization in the plan
DROP POLICY IF EXISTS "Participants can view collab activities" ON public.collab_activities;
CREATE POLICY "Participants can view collab activities"
  ON public.collab_activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.plans p
      WHERE p.id = public.collab_activities.plan_id
        AND (
          public.is_org_member(p.lead_organization_id)
          OR EXISTS (
            SELECT 1 FROM public.plan_organizations po
            WHERE po.plan_id = p.id
              AND po.status = 'active'
              AND public.is_org_member(po.organization_id)
          )
        )
    )
  );

-- Create collab activities: BCH of any active participating organization in the plan
DROP POLICY IF EXISTS "Active Participants Board can create collab activities" ON public.collab_activities;
CREATE POLICY "Active Participants Board can create collab activities"
  ON public.collab_activities FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.plans p
      WHERE p.id = public.collab_activities.plan_id
        AND (
          public.is_org_board(p.lead_organization_id)
          OR EXISTS (
            SELECT 1 FROM public.plan_organizations po
            WHERE po.plan_id = p.id
              AND po.status = 'active'
              AND public.is_org_board(po.organization_id)
          )
        )
    )
  );

-- Update collab activities: Lead Org BCH or Activity Lead Org BCH
DROP POLICY IF EXISTS "Board can update collab activities" ON public.collab_activities;
CREATE POLICY "Board can update collab activities"
  ON public.collab_activities FOR UPDATE
  USING (
    public.is_org_board(lead_organization_id)
    OR (organization_id IS NOT NULL AND public.is_org_board(organization_id))
    OR EXISTS (
      SELECT 1 FROM public.plans p
      WHERE p.id = public.collab_activities.plan_id
        AND public.is_org_board(p.lead_organization_id)
    )
  )
  WITH CHECK (
    public.is_org_board(lead_organization_id)
    OR (organization_id IS NOT NULL AND public.is_org_board(organization_id))
    OR EXISTS (
      SELECT 1 FROM public.plans p
      WHERE p.id = public.collab_activities.plan_id
        AND public.is_org_board(p.lead_organization_id)
    )
  );

-- Delete collab activities: Lead Org BCH or Activity Lead Org BCH
DROP POLICY IF EXISTS "Board can delete collab activities" ON public.collab_activities;
CREATE POLICY "Board can delete collab activities"
  ON public.collab_activities FOR DELETE
  USING (
    public.is_org_board(lead_organization_id)
    OR EXISTS (
      SELECT 1 FROM public.plans p
      WHERE p.id = public.collab_activities.plan_id
        AND public.is_org_board(p.lead_organization_id)
    )
  );

-- =========================================================================
-- RLS POLICIES FOR COLLAB_TASKS
-- =========================================================================

-- View collab tasks: Members of active organizations in the plan
DROP POLICY IF EXISTS "Participants can view collab tasks" ON public.collab_tasks;
CREATE POLICY "Participants can view collab tasks"
  ON public.collab_tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.collab_activities ca
      JOIN public.plans p ON p.id = ca.plan_id
      WHERE ca.id = public.collab_tasks.collab_activity_id
        AND (
          public.is_org_member(p.lead_organization_id)
          OR EXISTS (
            SELECT 1 FROM public.plan_organizations po
            WHERE po.plan_id = p.id
              AND po.status = 'active'
              AND public.is_org_member(po.organization_id)
          )
        )
    )
  );

-- Insert collab tasks: BCH of any active organization in the plan
DROP POLICY IF EXISTS "Active Participants Board can create collab tasks" ON public.collab_tasks;
CREATE POLICY "Active Participants Board can create collab tasks"
  ON public.collab_tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.collab_activities ca
      JOIN public.plans p ON p.id = ca.plan_id
      WHERE ca.id = public.collab_tasks.collab_activity_id
        AND (
          public.is_org_board(p.lead_organization_id)
          OR EXISTS (
            SELECT 1 FROM public.plan_organizations po
            WHERE po.plan_id = p.id
              AND po.status = 'active'
              AND public.is_org_board(po.organization_id)
          )
        )
    )
  );

-- Update collab tasks: Assignee or BCH of Task Org or Plan Lead Org
DROP POLICY IF EXISTS "Assignee or Board can update collab tasks" ON public.collab_tasks;
CREATE POLICY "Assignee or Board can update collab tasks"
  ON public.collab_tasks FOR UPDATE
  USING (
    auth.uid() = assigned_to
    OR (organization_id IS NOT NULL AND public.is_org_board(organization_id))
    OR EXISTS (
      SELECT 1 FROM public.collab_activities ca
      JOIN public.plans p ON p.id = ca.plan_id
      WHERE ca.id = public.collab_tasks.collab_activity_id
        AND public.is_org_board(p.lead_organization_id)
    )
  )
  WITH CHECK (
    auth.uid() = assigned_to
    OR (organization_id IS NOT NULL AND public.is_org_board(organization_id))
    OR EXISTS (
      SELECT 1 FROM public.collab_activities ca
      JOIN public.plans p ON p.id = ca.plan_id
      WHERE ca.id = public.collab_tasks.collab_activity_id
        AND public.is_org_board(p.lead_organization_id)
    )
  );

-- Delete collab tasks: BCH of Task Org or Plan Lead Org
DROP POLICY IF EXISTS "Board can delete collab tasks" ON public.collab_tasks;
CREATE POLICY "Board can delete collab tasks"
  ON public.collab_tasks FOR DELETE
  USING (
    (organization_id IS NOT NULL AND public.is_org_board(organization_id))
    OR EXISTS (
      SELECT 1 FROM public.collab_activities ca
      JOIN public.plans p ON p.id = ca.plan_id
      WHERE ca.id = public.collab_tasks.collab_activity_id
        AND public.is_org_board(p.lead_organization_id)
    )
  );

-- =========================================================================
-- RLS POLICIES FOR COLLAB_TRANSACTIONS
-- =========================================================================

-- View collab transactions: Members of any active organization in the plan
DROP POLICY IF EXISTS "Participants can view collab transactions" ON public.collab_transactions;
CREATE POLICY "Participants can view collab transactions"
  ON public.collab_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.plans p
      WHERE p.id = public.collab_transactions.plan_id
        AND (
          public.is_org_member(p.lead_organization_id)
          OR EXISTS (
            SELECT 1 FROM public.plan_organizations po
            WHERE po.plan_id = p.id
              AND po.status = 'active'
              AND public.is_org_member(po.organization_id)
          )
        )
    )
  );

-- Create collab transactions: BCH of contributing organization
DROP POLICY IF EXISTS "Board of contributing org can create collab transactions" ON public.collab_transactions;
CREATE POLICY "Board of contributing org can create collab transactions"
  ON public.collab_transactions FOR INSERT
  WITH CHECK (
    public.is_org_board(organization_id)
    AND EXISTS (
      SELECT 1 FROM public.plans p
      WHERE p.id = public.collab_transactions.plan_id
        AND (
          p.lead_organization_id = public.collab_transactions.organization_id
          OR EXISTS (
            SELECT 1 FROM public.plan_organizations po
            WHERE po.plan_id = p.id
              AND po.organization_id = public.collab_transactions.organization_id
              AND po.status = 'active'
          )
        )
    )
  );

-- Update collab transactions: Contributing Org BCH or Lead Org BCH
DROP POLICY IF EXISTS "Board can update collab transactions" ON public.collab_transactions;
CREATE POLICY "Board can update collab transactions"
  ON public.collab_transactions FOR UPDATE
  USING (
    public.is_org_board(organization_id)
    OR EXISTS (
      SELECT 1 FROM public.plans p
      WHERE p.id = public.collab_transactions.plan_id
        AND public.is_org_board(p.lead_organization_id)
    )
  )
  WITH CHECK (
    public.is_org_board(organization_id)
    OR EXISTS (
      SELECT 1 FROM public.plans p
      WHERE p.id = public.collab_transactions.plan_id
        AND public.is_org_board(p.lead_organization_id)
    )
  );

-- Delete collab transactions: Contributing Org BCH or Lead Org BCH
DROP POLICY IF EXISTS "Board can delete collab transactions" ON public.collab_transactions;
CREATE POLICY "Board can delete collab transactions"
  ON public.collab_transactions FOR DELETE
  USING (
    public.is_org_board(organization_id)
    OR EXISTS (
      SELECT 1 FROM public.plans p
      WHERE p.id = public.collab_transactions.plan_id
        AND public.is_org_board(p.lead_organization_id)
    )
  );
