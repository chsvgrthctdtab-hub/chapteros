# Chi Hội Manager - Supabase Database Schema & Architecture

## 1. Overview
Chi Hội Manager uses Supabase PostgreSQL as its authoritative cloud database, adhering to strict multi-tenant isolation, role-based access control (RBAC), and Row Level Security (RLS).

## 2. Multi-tier Architectural Pattern
```
React UI / Pages / Components
       ↓
Custom React Query Hooks / Contexts
       ↓
Domain Services (src/services/*)
       ↓
Data Repositories & Type Mappers (src/repositories/*)
       ↓
Supabase PostgreSQL Client (src/lib/supabase.ts)
```

## 3. Database Schema Overview

### Core Tables:
- `organizations`: Chi hội student chapters.
- `profiles`: User profiles linked directly to `auth.users.id`.
- `organization_memberships`: User role assignments within organizations (`admin`, `leader`, `deputy`, `secretary`, `treasurer`, `member`).
- `terms`: Operational tenures / academic terms with closing snapshot support.
- `members`: Official chapter member directory.
- `term_members`: Member assignments per term with specific positions and departments.
- `activities`: Events and activity plans.
- `activity_participants`: Activity registration and attendance tracking.
- `tasks`: Task management with priority, status, and progress (0–100%).
- `finance_categories`: Dynamic income/expense categories.
- `finance_transactions`: Real-time financial ledger with approval workflow.
- `finance_period_closings`: Periodic financial closing and reconciliation records.
- `documents`: Metadata for Supabase Storage uploads and Google Drive linked assets.
- `google_connections`: OAuth connection state and granted scopes.
- `activity_forms`: Google Forms metadata linked to activities.
- `activity_form_responses`: Responses synchronized from Google Forms.
- `google_sheet_connections`: Google Sheets 2-way sync metadata.
- `google_calendar_events`: Google Calendar event synchronization metadata.
- `audit_logs`: Audit trail for important administrative actions.
- `plans`: Multi-organization collaboration plans and campaigns.
- `plan_organizations`: Co-hosting and participating organizations in a collaboration plan.
- `collab_activities`: Collaborative activities within a plan.
- `collab_tasks`: Collaborative task management across participating chapters.
- `collab_transactions`: Financial tracking for joint collaboration campaigns.
- `invitations` / `organization_invites`: Token-based and email-based secure invitation management.
- `notifications`: User and organization operational notifications.

## 4. Row Level Security (RLS) & Multi-tenancy
- Every table has `ENABLE ROW LEVEL SECURITY`.
- `is_org_member(target_org_id)` ensures users in Chapter A cannot access Chapter B data.
- `is_org_board(target_org_id)` allows executive board members (`admin`, `leader`, `deputy`, `secretary`, `treasurer`) to manage operations.
- `is_org_admin(target_org_id)` restricts sensitive settings and role updates to Chapter administrators.
- Public/anonymous access is strictly restricted.
- All internal triggers and security definer functions have `search_path` hardened to prevent search path hijacking.

## 5. Khởi tạo Database nhanh (1-Click Setup)
Bạn chỉ cần mở **Supabase Dashboard** $\rightarrow$ **SQL Editor** và copy toàn bộ nội dung tệp [`FULL_SETUP.sql`](FULL_SETUP.sql) rồi nhấn **Run**.
Tệp này đã tổng hợp toàn bộ 34 migrations, đã tối ưu hóa RLS, RPC functions, bóc tách Sổ Hội viên & Quyền Quản trị Admin, và 100% Idempotent (chạy nhiều lần không bị lỗi).

## 6. Migration Execution Order (Nếu chạy từng file)
1. `20260814000000_initial_domain_model.sql`
2. `20260814000001_storage_documents.sql`
3. `20260814000002_google_integration_foundation.sql`
4. `20260814000003_activity_google_forms.sql`
5. `20260814000004_google_sheets_integration.sql`
6. `20260814000005_google_drive_documents.sql`
7. `20260814000006_google_calendar_and_audit_logs.sql`
8. `20260817000000_creator_as_member_and_nullable_student_id.sql`
9. `20260818000000_sync_profile_to_members.sql`
10. `20260819000000_term_management_enhancements.sql`
11. `20260820000000_storage_organization_logos.sql`
12. `20260821000000_google_connections_unique_constraints.sql`
13. `20260822000000_audit_logs_rbac_and_notifications.sql`
14. `20260823000000_activity_lifecycle_and_lead_member.sql`
15. `20260824000000_term_closing_and_handover.sql`
16. `20260825000000_finance_approval_and_period_closing.sql`
17. `20260826000000_sync_finance_approval_schema.sql`
18. `20260827000000_harden_security_definer_functions.sql`
19. `20260828000000_create_plan_secure.sql`
20. `20260829000000_update_member_status_constraint.sql`
21. `20260830000000_collaboration_workspace_tables_and_rls.sql`
22. `20260831000000_harden_collab_tasks_assignee_update_rls.sql`
23. `20260832000000_harden_invitations_and_role_assignment_rpc.sql`
24. `20260833000000_add_profiles_insert_rls.sql`
25. `20260834000000_add_missing_schema_columns.sql`
