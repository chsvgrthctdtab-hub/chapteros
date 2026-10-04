-- Migration: 20261004000000_add_transaction_person_and_reimbursement.sql
-- Description: Add person and reimbursement tracking to finance_transactions

ALTER TABLE public.finance_transactions
  ADD COLUMN IF NOT EXISTS person_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS person_name TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_reimbursed BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_finance_transactions_person_id ON public.finance_transactions(person_id);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_is_reimbursed ON public.finance_transactions(is_reimbursed);
