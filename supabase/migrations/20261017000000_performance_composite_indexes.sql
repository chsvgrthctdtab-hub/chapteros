-- ==============================================================================
-- Migration: 20261017000000_performance_composite_indexes.sql
-- Description:
--   Thêm các chỉ mục phức hợp (Composite Indexes) tối ưu hóa truy vấn nhanh cho
--   các phân hệ: Hội viên, Nhiệm vụ, Hoạt động, Tài chính, và Nhật ký kiểm toán.
--   Tất cả lệnh đều an toàn (IF NOT EXISTS), không ảnh hưởng dữ liệu hiện có.
-- ==============================================================================

-- 1. Phân hệ Hội viên (Members)
CREATE INDEX IF NOT EXISTS idx_members_org_status 
  ON public.members(organization_id, status);

CREATE INDEX IF NOT EXISTS idx_members_org_created 
  ON public.members(organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_members_org_student_id 
  ON public.members(organization_id, student_id);

-- 2. Phân hệ Nhiệm vụ (Tasks)
CREATE INDEX IF NOT EXISTS idx_tasks_org_status 
  ON public.tasks(organization_id, status);

CREATE INDEX IF NOT EXISTS idx_tasks_org_activity 
  ON public.tasks(organization_id, activity_id) 
  WHERE activity_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_org_due_date 
  ON public.tasks(organization_id, due_date);

CREATE INDEX IF NOT EXISTS idx_tasks_org_created 
  ON public.tasks(organization_id, created_at DESC);

-- 3. Phân hệ Hoạt động (Activities)
CREATE INDEX IF NOT EXISTS idx_activities_org_term 
  ON public.activities(organization_id, term_id);

CREATE INDEX IF NOT EXISTS idx_activities_org_status 
  ON public.activities(organization_id, status);

CREATE INDEX IF NOT EXISTS idx_activities_org_dates 
  ON public.activities(organization_id, start_date DESC);

-- 4. Phân hệ Điểm danh & Người tham gia (Activity Participants)
CREATE INDEX IF NOT EXISTS idx_activity_participants_act_mem 
  ON public.activity_participants(activity_id, member_id);

CREATE INDEX IF NOT EXISTS idx_activity_participants_status 
  ON public.activity_participants(activity_id, attendance_status);

-- 5. Phân hệ Tài chính (Finance Transactions)
CREATE INDEX IF NOT EXISTS idx_finance_transactions_org_type 
  ON public.finance_transactions(organization_id, type);

CREATE INDEX IF NOT EXISTS idx_finance_transactions_org_term 
  ON public.finance_transactions(organization_id, term_id);

CREATE INDEX IF NOT EXISTS idx_finance_transactions_org_act 
  ON public.finance_transactions(organization_id, activity_id) 
  WHERE activity_id IS NOT NULL;

-- 6. Phân hệ Nhật ký kiểm toán (Audit Logs)
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_created 
  ON public.audit_logs(organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_org_module 
  ON public.audit_logs(organization_id, module, created_at DESC);
