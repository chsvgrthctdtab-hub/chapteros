-- Migration: 20260826000000_sync_finance_approval_schema.sql
-- Description: Synchronize Finance Approval, Status, Thresholds, and Period Closings Schema

-- 1. Ensure organizations.finance_approval_threshold exists
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS finance_approval_threshold NUMERIC(15, 2) DEFAULT 2000000;

-- 2. Ensure finance_transactions has status and approval fields
-- Step 2a: Add columns if they do not exist
ALTER TABLE public.finance_transactions
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'posted',
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS period_closing_id UUID DEFAULT NULL;

-- Step 2b: Backfill existing records where status is NULL to 'posted' (historical transactions are already finalized)
UPDATE public.finance_transactions
SET status = 'posted'
WHERE status IS NULL;

-- Step 2c: Set NOT NULL and default on status
ALTER TABLE public.finance_transactions
ALTER COLUMN status SET DEFAULT 'posted',
ALTER COLUMN status SET NOT NULL;

-- Step 2d: Ensure status CHECK constraint exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'chk_finance_transactions_status'
      AND conrelid = 'public.finance_transactions'::regclass
  ) THEN
    ALTER TABLE public.finance_transactions
    ADD CONSTRAINT chk_finance_transactions_status
    CHECK (status IN ('draft', 'pending_approval', 'approved', 'posted', 'rejected'));
  END IF;
END $$;

-- 3. Ensure finance_period_closings table exists
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
  closed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  closed_by_name TEXT DEFAULT NULL,
  reopened_at TIMESTAMPTZ DEFAULT NULL,
  reopened_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reopened_by_name TEXT DEFAULT NULL,
  reopen_reason TEXT DEFAULT NULL,
  snapshot_data JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 3b: Ensure foreign key linking finance_transactions to finance_period_closings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_finance_transactions_period'
      AND conrelid = 'public.finance_transactions'::regclass
  ) THEN
    ALTER TABLE public.finance_transactions
    ADD CONSTRAINT fk_finance_transactions_period
    FOREIGN KEY (period_closing_id) REFERENCES public.finance_period_closings(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 4. Create optimized indexes for Finance queries
CREATE INDEX IF NOT EXISTS idx_finance_transactions_status ON public.finance_transactions(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_org_term ON public.finance_transactions(organization_id, term_id);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_date ON public.finance_transactions(organization_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_recorded_by ON public.finance_transactions(recorded_by);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_approved_by ON public.finance_transactions(approved_by);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_period_id ON public.finance_transactions(period_closing_id);

CREATE INDEX IF NOT EXISTS idx_finance_periods_org ON public.finance_period_closings(organization_id);
CREATE INDEX IF NOT EXISTS idx_finance_periods_term ON public.finance_period_closings(term_id);
CREATE INDEX IF NOT EXISTS idx_finance_periods_dates ON public.finance_period_closings(organization_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_finance_periods_status ON public.finance_period_closings(organization_id, status);

-- 5. Enable RLS and define Policies
ALTER TABLE public.finance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_period_closings ENABLE ROW LEVEL SECURITY;

-- Policies for finance_transactions
DROP POLICY IF EXISTS "Members can view finance transactions" ON public.finance_transactions;
CREATE POLICY "Members can view finance transactions"
  ON public.finance_transactions FOR SELECT
  TO authenticated
  USING (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "Treasurer and Admin can manage finance transactions" ON public.finance_transactions;
DROP POLICY IF EXISTS "Treasurer and Admin can insert finance transactions" ON public.finance_transactions;
CREATE POLICY "Treasurer and Admin can insert finance transactions"
  ON public.finance_transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_org_role(organization_id, ARRAY['admin', 'leader', 'treasurer'])
  );

DROP POLICY IF EXISTS "Treasurer and Admin can update finance transactions" ON public.finance_transactions;
CREATE POLICY "Treasurer and Admin can update finance transactions"
  ON public.finance_transactions FOR UPDATE
  TO authenticated
  USING (
    public.has_org_role(organization_id, ARRAY['admin', 'leader', 'treasurer'])
  )
  WITH CHECK (
    public.has_org_role(organization_id, ARRAY['admin', 'leader', 'treasurer'])
  );

DROP POLICY IF EXISTS "Treasurer and Admin can delete finance transactions" ON public.finance_transactions;
CREATE POLICY "Treasurer and Admin can delete finance transactions"
  ON public.finance_transactions FOR DELETE
  TO authenticated
  USING (
    public.has_org_role(organization_id, ARRAY['admin', 'leader', 'treasurer'])
  );

-- Policies for finance_period_closings
DROP POLICY IF EXISTS "finance_period_closings_select" ON public.finance_period_closings;
CREATE POLICY "finance_period_closings_select"
  ON public.finance_period_closings FOR SELECT
  TO authenticated
  USING (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "finance_period_closings_insert" ON public.finance_period_closings;
CREATE POLICY "finance_period_closings_insert"
  ON public.finance_period_closings FOR INSERT
  TO authenticated
  WITH CHECK (public.has_org_role(organization_id, ARRAY['admin', 'leader']));

DROP POLICY IF EXISTS "finance_period_closings_update" ON public.finance_period_closings;
CREATE POLICY "finance_period_closings_update"
  ON public.finance_period_closings FOR UPDATE
  TO authenticated
  USING (public.has_org_role(organization_id, ARRAY['admin', 'leader']))
  WITH CHECK (public.has_org_role(organization_id, ARRAY['admin', 'leader']));

DROP POLICY IF EXISTS "finance_period_closings_delete" ON public.finance_period_closings;
CREATE POLICY "finance_period_closings_delete"
  ON public.finance_period_closings FOR DELETE
  TO authenticated
  USING (public.is_org_admin(organization_id));
