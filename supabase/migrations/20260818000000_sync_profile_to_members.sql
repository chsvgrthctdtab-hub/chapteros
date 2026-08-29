-- ==============================================================================
-- Migration: 20260818000000_sync_profile_to_members.sql
-- Description:
--   1. Create trigger function handle_profile_updated() to automatically propagate
--      profile changes (full_name, email, phone, student_id) from public.profiles
--      to public.members for all linked organizations where members.user_id = NEW.id.
--   2. Validate duplicate student_id before applying updates across organizations.
--   3. Attach AFTER UPDATE trigger on_profile_updated to public.profiles.
--   4. Safely backfill existing profile information to linked members.
-- ==============================================================================

-- 1. Tạo function đồng bộ: handle_profile_updated
CREATE OR REPLACE FUNCTION public.handle_profile_updated()
RETURNS TRIGGER AS $$
BEGIN
  -- Kiểm tra trùng lặp Mã số sinh viên (MSSV) nếu student_id thay đổi và không rỗng
  IF NEW.student_id IS NOT NULL AND (OLD.student_id IS DISTINCT FROM NEW.student_id) THEN
    IF EXISTS (
      SELECT 1
      FROM public.members m_user
      JOIN public.members m_other 
        ON m_user.organization_id = m_other.organization_id
      WHERE m_user.user_id = NEW.id
        AND m_other.user_id IS DISTINCT FROM NEW.id
        AND UPPER(TRIM(m_other.student_id)) = UPPER(TRIM(NEW.student_id))
    ) THEN
      RAISE EXCEPTION 'Mã số sinh viên "%" đã được sử dụng bởi một hội viên khác trong Chi hội. Vui lòng kiểm tra lại MSSV.', NEW.student_id
        USING ERRCODE = 'unique_violation';
    END IF;
  END IF;

  -- Đồng bộ các trường thông tin cá nhân sang members của user (ở tất cả Chi hội)
  UPDATE public.members
  SET 
    full_name = NEW.full_name,
    email = NEW.email,
    phone = NEW.phone,
    student_id = NEW.student_id,
    updated_at = timezone('utc'::text, now())
  WHERE user_id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Gắn AFTER UPDATE trigger vào bảng profiles
DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (
    OLD.full_name IS DISTINCT FROM NEW.full_name
    OR OLD.email IS DISTINCT FROM NEW.email
    OR OLD.phone IS DISTINCT FROM NEW.phone
    OR OLD.student_id IS DISTINCT FROM NEW.student_id
  )
  EXECUTE FUNCTION public.handle_profile_updated();

-- 3. Đồng bộ dữ liệu hiện có (Backfill) từ profiles sang members cho tất cả hồ sơ đã liên kết user_id
UPDATE public.members m
SET
  full_name = p.full_name,
  email = p.email,
  phone = p.phone,
  student_id = p.student_id,
  updated_at = timezone('utc'::text, now())
FROM public.profiles p
WHERE m.user_id = p.id
  AND (
    m.full_name IS DISTINCT FROM p.full_name
    OR m.email IS DISTINCT FROM p.email
    OR m.phone IS DISTINCT FROM p.phone
    OR m.student_id IS DISTINCT FROM p.student_id
  );
