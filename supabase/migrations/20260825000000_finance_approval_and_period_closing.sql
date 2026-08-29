-- Migration: 20260825000000_finance_approval_and_period_closing.sql
-- Description: Phase 3.3.5 - Finance Approval Workflow, Thresholds, Periodic Closings & Reconciliation

-- 1. Add approval threshold to organizations table
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS finance_approval_threshold NUMERIC(15, 2) DEFAULT 2000000;

-- 2. Add approval fields and status to finance_transactions table
ALTER TABLE public.finance_transactions
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'posted' CHECK (status IN ('draft', 'pending_approval', 'approved', 'posted', 'rejected')),
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS period_closing_id UUID DEFAULT NULL;

-- Create indexes for fast status, approval, and date range filtering
CREATE INDEX IF NOT EXISTS idx_finance_transactions_status ON public.finance_transactions(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_date ON public.finance_transactions(organization_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_recorded_by ON public.finance_transactions(recorded_by);

-- 3. Create finance_period_closings table
CREATE TABLE IF NOT EXISTS public.finance_period_closings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  term_id UUID NOT NULL REFERENCES public.terms(id) ON DELETE RESTRICT,
  period_type TEXT NOT NULL CHECK (period_type IN ('month', 'quarter', 'custom')),
  period_name TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'closed' CHECK (status IN ('closed', 'reopened')),
  opening_balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_income NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total_expense NUMERIC(15, 2) NOT NULL DEFAULT 0,
  closing_balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
  actual_balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
  reconciliation_status TEXT NOT NULL DEFAULT 'balanced' CHECK (reconciliation_status IN ('balanced', 'mismatch', 'override')),
  reconciliation_discrepancy NUMERIC(15, 2) DEFAULT 0,
  reconciliation_notes TEXT DEFAULT NULL,
  closed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  closed_by_name TEXT DEFAULT NULL,
  reopened_at TIMESTAMPTZ DEFAULT NULL,
  reopened_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reopened_by_name TEXT DEFAULT NULL,
  reopen_reason TEXT DEFAULT NULL,
  snapshot_data JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Foreign key linking finance_transactions to finance_period_closings (safe check)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_finance_transactions_period'
  ) THEN
    ALTER TABLE public.finance_transactions
    ADD CONSTRAINT fk_finance_transactions_period
    FOREIGN KEY (period_closing_id) REFERENCES public.finance_period_closings(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Indexes for finance_period_closings
CREATE INDEX IF NOT EXISTS idx_finance_periods_org ON public.finance_period_closings(organization_id);
CREATE INDEX IF NOT EXISTS idx_finance_periods_term ON public.finance_period_closings(term_id);
CREATE INDEX IF NOT EXISTS idx_finance_periods_dates ON public.finance_period_closings(organization_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_finance_periods_status ON public.finance_period_closings(organization_id, status);

-- Enable RLS
ALTER TABLE public.finance_period_closings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for finance_period_closings
DROP POLICY IF EXISTS "finance_period_closings_select" ON public.finance_period_closings;
CREATE POLICY "finance_period_closings_select"
ON public.finance_period_closings
FOR SELECT
TO authenticated
USING (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "finance_period_closings_insert" ON public.finance_period_closings;
CREATE POLICY "finance_period_closings_insert"
ON public.finance_period_closings
FOR INSERT
TO authenticated
WITH CHECK (public.has_org_role(organization_id, ARRAY['admin', 'leader']));

DROP POLICY IF EXISTS "finance_period_closings_update" ON public.finance_period_closings;
CREATE POLICY "finance_period_closings_update"
ON public.finance_period_closings
FOR UPDATE
TO authenticated
USING (public.has_org_role(organization_id, ARRAY['admin', 'leader']))
WITH CHECK (public.has_org_role(organization_id, ARRAY['admin', 'leader']));

DROP POLICY IF EXISTS "finance_period_closings_delete" ON public.finance_period_closings;
CREATE POLICY "finance_period_closings_delete"
ON public.finance_period_closings
FOR DELETE
TO authenticated
USING (public.is_org_admin(organization_id));
