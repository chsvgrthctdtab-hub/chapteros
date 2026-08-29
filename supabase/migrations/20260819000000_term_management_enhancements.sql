-- Migration: 20260819000000_term_management_enhancements.sql
-- Description: Adds congress_date column to terms, partial unique index for single active term per org, and activate_term atomic RPC function

-- 1. Add congress_date column if not exists
ALTER TABLE public.terms
ADD COLUMN IF NOT EXISTS congress_date DATE;

-- 2. Add partial unique index to enforce at most one current/active term per organization
CREATE UNIQUE INDEX IF NOT EXISTS uq_terms_one_current_per_org
ON public.terms (organization_id)
WHERE is_current = true;

-- 3. Atomic RPC function to activate a term for an organization
CREATE OR REPLACE FUNCTION public.activate_term(p_term_id UUID, p_org_id UUID)
RETURNS public.terms AS $$
DECLARE
  v_term public.terms;
BEGIN
  -- Verify caller is org board
  IF NOT public.is_org_board(p_org_id) THEN
    RAISE EXCEPTION 'Bạn không có quyền quản trị để kích hoạt nhiệm kỳ trong Chi hội này.'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Deactivate all other terms in this organization
  UPDATE public.terms
  SET is_current = false,
      updated_at = timezone('utc'::text, now())
  WHERE organization_id = p_org_id
    AND id <> p_term_id
    AND is_current = true;

  -- Activate chosen term and set status to active
  UPDATE public.terms
  SET is_current = true,
      status = 'active',
      updated_at = timezone('utc'::text, now())
  WHERE id = p_term_id
    AND organization_id = p_org_id
  RETURNING * INTO v_term;

  IF v_term.id IS NULL THEN
    RAISE EXCEPTION 'Không tìm thấy nhiệm kỳ cần kích hoạt.'
      USING ERRCODE = 'no_data_found';
  END IF;

  RETURN v_term;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execution to authenticated users (internal check is_org_board guards actual authorization)
GRANT EXECUTE ON FUNCTION public.activate_term(UUID, UUID) TO authenticated;
