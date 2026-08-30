-- ==============================================================================
-- Migration: 20260835000000_fix_duplicate_and_missing_indexes.sql
-- Description:
--   1. Remove duplicate indexes created by multiple migrations
--   2. Add missing indexes on frequently queried columns
-- ==============================================================================

-- Xoa index trung tu nhieu migration
DROP INDEX IF EXISTS idx_finance_transactions_status;
DROP INDEX IF EXISTS idx_finance_transactions_date;
DROP INDEX IF EXISTS idx_finance_periods_org;
DROP INDEX IF EXISTS idx_finance_periods_term;
DROP INDEX IF EXISTS idx_finance_periods_dates;
DROP INDEX IF EXISTS idx_finance_periods_status;
DROP INDEX IF EXISTS idx_documents_drive_file_id;

-- Tao lai dung 1 lan
CREATE INDEX IF NOT EXISTS idx_finance_transactions_status ON public.finance_transactions(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_date ON public.finance_transactions(organization_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_finance_periods_org ON public.finance_period_closings(organization_id);
CREATE INDEX IF NOT EXISTS idx_finance_periods_term ON public.finance_period_closings(term_id);
CREATE INDEX IF NOT EXISTS idx_finance_periods_dates ON public.finance_period_closings(organization_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_finance_periods_status ON public.finance_period_closings(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_documents_drive_file_id ON public.documents(drive_file_id) WHERE drive_file_id IS NOT NULL;

-- Them index quan trong con thieu
CREATE INDEX IF NOT EXISTS idx_org_memberships_user_id ON public.organization_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_members_user_id ON public.members(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON public.tasks(assigned_to) WHERE assigned_to IS NOT NULL;
