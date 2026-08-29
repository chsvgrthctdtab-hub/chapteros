-- ==============================================================================
-- Migration: 20260817000000_creator_as_member_and_nullable_student_id.sql
-- Description:
--   1. Allow members.student_id to be NULL (profiles.student_id can be NULL during organization onboarding).
--   2. Add unique constraint uq_org_user_member (organization_id, user_id) on members table.
--   3. Update handle_new_organization() trigger function to create BOTH:
--        - organization_memberships record (role: 'admin', status: 'active')
--        - members record (mapping user's profile, status: 'active')
--      with idempotent ON CONFLICT handling and SECURITY DEFINER SET search_path = public.
--   4. Safely backfill members for any existing organization_memberships that don't have a members record.
-- ==============================================================================

-- 1. Cho phép student_id nhận giá trị NULL trong bảng public.members
ALTER TABLE public.members ALTER COLUMN student_id DROP NOT NULL;

-- 2. Xử lý an toàn dữ liệu trùng lặp (nếu có) trước khi tạo UNIQUE constraint (organization_id, user_id)
DELETE FROM public.members a USING public.members b
WHERE a.id < b.id
  AND a.organization_id = b.organization_id
  AND a.user_id = b.user_id
  AND a.user_id IS NOT NULL;

-- Thêm unique constraint (organization_id, user_id) trên bảng members nếu chưa tồn tại
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_org_user_member'
  ) THEN
    ALTER TABLE public.members ADD CONSTRAINT uq_org_user_member UNIQUE (organization_id, user_id);
  END IF;
END $$;

-- 3. Cập nhật Trigger Function: handle_new_organization
CREATE OR REPLACE FUNCTION public.handle_new_organization()
RETURNS TRIGGER AS $$
DECLARE
  creator_profile RECORD;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    -- Bước A: Tạo membership với quyền Admin cho người khởi tạo Chi hội
    INSERT INTO public.organization_memberships (
      organization_id,
      user_id,
      role,
      status
    )
    VALUES (
      NEW.id,
      auth.uid(),
      'admin',
      'active'
    )
    ON CONFLICT (organization_id, user_id) DO NOTHING;

    -- Bước B: Lấy thông tin từ profiles của người tạo và tạo hồ sơ hội viên (members)
    SELECT * INTO creator_profile
    FROM public.profiles
    WHERE id = auth.uid();

    IF FOUND THEN
      INSERT INTO public.members (
        organization_id,
        user_id,
        student_id,
        full_name,
        email,
        phone,
        status,
        joined_date
      )
      VALUES (
        NEW.id,
        auth.uid(),
        creator_profile.student_id,
        COALESCE(creator_profile.full_name, 'Quản trị viên'),
        creator_profile.email,
        creator_profile.phone,
        'active',
        CURRENT_DATE
      )
      ON CONFLICT (organization_id, user_id) DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Đảm bảo Trigger on_organization_created được gắn vào bảng organizations
DROP TRIGGER IF EXISTS on_organization_created ON public.organizations;
CREATE TRIGGER on_organization_created
  AFTER INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_organization();

-- 4. An toàn: Đồng bộ dữ liệu hiện có (Backfill) nếu có membership mà chưa có hồ sơ member
INSERT INTO public.members (
  organization_id,
  user_id,
  student_id,
  full_name,
  email,
  phone,
  status,
  joined_date
)
SELECT 
  m.organization_id,
  m.user_id,
  p.student_id,
  COALESCE(p.full_name, 'Hội viên'),
  p.email,
  p.phone,
  'active',
  CURRENT_DATE
FROM public.organization_memberships m
JOIN public.profiles p ON p.id = m.user_id
WHERE m.user_id IS NOT NULL
ON CONFLICT (organization_id, user_id) DO NOTHING;
