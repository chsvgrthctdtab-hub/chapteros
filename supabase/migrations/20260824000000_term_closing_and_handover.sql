-- Migration: 20260824000000_term_closing_and_handover.sql
-- Description: Adds closing_snapshot, closed_at, closed_by, and handover_notes columns to terms table for Phase 3.3.4 Term Closing & Handover

ALTER TABLE public.terms
ADD COLUMN IF NOT EXISTS closing_snapshot JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS closed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS handover_notes TEXT DEFAULT NULL;

-- Create index on term status and organization for fast filtering
CREATE INDEX IF NOT EXISTS idx_terms_org_status ON public.terms(organization_id, status);
