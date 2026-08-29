/**
 * Chi Hội Manager - Type Definitions
 * Shared core domain types and application definitions
 */

export * from './database.types';
export * from './roles';
export * from './report';

import type {
  OrganizationRole,
  OrganizationType,
  MembershipStatus,
  TermStatus,
  MemberStatus,
  TermMemberStatus,
  ActivityCategory,
  ActivityStatus,
  RegistrationStatus,
  AttendanceStatus,
  TaskStatus,
  TaskPriority,
  FinanceType,
  TransactionStatus,
  PeriodClosingType,
  PeriodClosingStatus,
  ReconciliationStatus,
  DocumentCategory,
  DocumentAccessLevel,
  DocumentSourceType,
  GoogleConnectionStatus,
  GoogleConnectionType,
} from './database.types';

// ==============================================================================
// 1. Core Domain Models (CamelCase for Application Code)
// ==============================================================================

// Profiles & Auth User
export interface Profile {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  phone?: string | null;
  studentId?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Backward compatible alias
export type UserRole = 'super_admin' | 'chapter_lead' | 'executive_board' | 'guest';
export interface AppUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: UserRole;
  currentChapterId?: string;
  currentTermId?: string;
}

// Organization (Chi hội, Liên chi hội, Câu lạc bộ, Đội)
export interface Organization {
  id: string;
  name: string;
  code: string;
  type: OrganizationType;
  parentId?: string | null;
  parent?: Organization | { id: string; name: string; code: string; type?: OrganizationType } | null;
  description?: string | null;
  logoUrl?: string | null;
  financeApprovalThreshold?: number | null;
  createdAt: string;
  updatedAt: string;
}

// Backward compatible alias
export type Chapter = Organization;

// Organization Membership (Phân quyền trong Chi hội)
export interface OrganizationMembership {
  id: string;
  organizationId: string;
  userId: string;
  role: OrganizationRole;
  status: MembershipStatus;
  createdAt: string;
  updatedAt: string;
  profile?: Profile;
}

// Term (Nhiệm kỳ)
export interface Term {
  id: string;
  organizationId: string;
  name: string; // e.g. "Nhiệm kỳ 2024 - 2025"
  startDate: string;
  endDate: string;
  status: TermStatus;
  isCurrent: boolean;
  closingSnapshot?: any;
  closedAt?: string | null;
  closedBy?: string | null;
  handoverNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  memberCount?: number;
}

// Member Roster (Hồ sơ hội viên gốc của Chi hội)
export interface Member {
  id: string;
  organizationId: string;
  userId?: string | null;
  studentId: string | null;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  className?: string | null;
  major?: string | null;
  cohort?: string | null;
  position?: string | null;
  status: MemberStatus;
  joinedDate?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Term Member (Gán hội viên vào nhiệm kỳ cụ thể)
export interface TermMember {
  id: string;
  termId: string;
  memberId: string;
  position: string;
  department?: string | null;
  status: TermMemberStatus;
  joinedDate?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  member?: Member;
}

// Activity (Hoạt động / Sự kiện)
export interface Activity {
  id: string;
  organizationId: string;
  termId: string;
  planId?: string | null;
  code?: string | null;
  title: string;
  description?: string | null;
  category: ActivityCategory;
  status: ActivityStatus;
  location?: string | null;
  startDate: string;
  endDate: string;
  targetMembers?: number | null;
  bannerUrl?: string | null;
  leadMemberId?: string | null;
  leadMember?: Member | null;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Plan (Chiến dịch / Kế hoạch hợp tác liên đơn vị)
export type PlanStatus = 'draft' | 'planning' | 'active' | 'completed' | 'cancelled';
export type CollaborationRole = 'host' | 'co_host' | 'partner' | 'supporter' | 'observer';
export type CollaborationOrganizationStatus = 'pending' | 'active' | 'rejected' | 'removed';

export interface Plan {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  leadOrganizationId: string;
  status: PlanStatus;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
  leadOrganization?: Organization;
  organizations?: PlanOrganization[];
  activitiesCount?: number;
}

export interface PlanOrganization {
  id: string;
  planId: string;
  organizationId: string;
  roleInPlan: CollaborationRole;
  isHost: boolean;
  roleDescription?: string | null;
  status: CollaborationOrganizationStatus;
  joinedAt: string;
  createdAt: string;
  updatedAt?: string;
  organization?: Organization;
}

// Collab Activity (Hoạt động thuộc Chiến dịch Liên Đơn Vị)
export interface CollabActivity {
  id: string;
  planId: string;
  leadOrganizationId?: string | null;
  organizationId?: string | null;
  title: string;
  code: string;
  description?: string | null;
  category: ActivityCategory;
  status: ActivityStatus;
  location?: string | null;
  startDate: string;
  endDate: string;
  bannerUrl?: string | null;
  createdBy?: string | null;
  createdAt: string;
  leadOrganization?: Organization;
  organization?: Organization;
  tasksCount?: number;
  completedTasksCount?: number;
  totalBudget?: number;
}

export type CollabTaskStatus = 'todo' | 'in_progress' | 'review' | 'done';

// Collab Task (Công việc độc lập của Hoạt động Collab)
export interface CollabTask {
  id: string;
  planId?: string;
  collabActivityId?: string | null;
  title: string;
  description?: string | null;
  status: CollabTaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  assignedTo?: string | null;
  organizationId?: string | null;
  createdAt: string;
  assignee?: Profile;
  organization?: Organization;
  collabActivity?: CollabActivity;
}

// Collab Transaction (Thu / Chi của Chiến dịch Liên Đơn Vị)
export interface CollabTransaction {
  id: string;
  planId: string;
  collabActivityId?: string | null;
  organizationId: string;
  transactionType: FinanceType;
  amount: number;
  categoryName: string;
  description: string;
  transactionDate: string;
  receiptUrl?: string | null;
  recordedBy?: string | null;
  createdAt: string;
  updatedAt: string;
  organization?: Organization;
  recorder?: Profile;
  collabActivity?: CollabActivity;
}

// Collab Member Option (Nhân sự từ tất cả các đơn vị co-host tham gia chiến dịch)
export interface CollabMemberOption {
  userId: string;
  profileId: string;
  fullName: string;
  studentId?: string | null;
  className?: string | null;
  cohort?: string | null;
  phone?: string | null;
  email: string;
  avatarUrl?: string | null;
  organizationId: string;
  organizationName: string;
  organizationCode: string;
  organizationType?: OrganizationType;
  parentOrgName?: string | null;
  role: OrganizationRole;
  position?: string | null;
}

// Activity Participant (Tham gia & Điểm danh)
export interface ActivityParticipant {
  id: string;
  activityId: string;
  memberId: string;
  registrationStatus: RegistrationStatus;
  registeredAt: string;
  attendanceStatus: AttendanceStatus;
  attendedAt?: string | null;
  notes?: string | null;
  source?: ParticipantSource;
  googleResponseId?: string | null;
  createdAt: string;
  updatedAt: string;
  member?: Member;
}

// Task (Công việc & Phân công)
export interface Task {
  id: string;
  organizationId: string;
  termId: string;
  activityId?: string | null;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  progress: number;
  dueDate?: string | null;
  assignedTo?: string | null;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
  assignee?: Profile;
  activity?: Activity;
}

// Finance Category (Danh mục Thu / Chi)
export interface FinanceCategory {
  id: string;
  organizationId: string;
  name: string;
  type: FinanceType;
  description?: string | null;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

// Finance Transaction (Giao dịch tài chính)
export interface FinanceTransaction {
  id: string;
  organizationId: string;
  termId: string;
  categoryId: string;
  activityId?: string | null;
  transactionType: FinanceType;
  amount: number;
  description: string;
  transactionDate: string;
  status: TransactionStatus;
  approvedBy?: string | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  rejectedAt?: string | null;
  periodClosingId?: string | null;
  receiptUrl?: string | null;
  recordedBy?: string | null;
  createdAt: string;
  updatedAt: string;
  category?: FinanceCategory;
  activity?: Activity;
  recorder?: Profile;
  approver?: Profile;
}

// Finance Period Closing (Chốt kỳ tài chính & Đối soát sổ sách)
export interface FinancePeriodClosing {
  id: string;
  organizationId: string;
  termId: string;
  periodType: PeriodClosingType;
  periodName: string;
  periodStart: string;
  periodEnd: string;
  status: PeriodClosingStatus;
  openingBalance: number;
  totalIncome: number;
  totalExpense: number;
  closingBalance: number;
  actualBalance: number;
  reconciliationStatus: ReconciliationStatus;
  reconciliationDiscrepancy: number;
  reconciliationNotes?: string | null;
  closedAt: string;
  closedBy?: string | null;
  closedByName?: string | null;
  reopenedAt?: string | null;
  reopenedBy?: string | null;
  reopenedByName?: string | null;
  reopenReason?: string | null;
  snapshotData?: any;
  createdAt: string;
  updatedAt: string;
  term?: Term;
}

// Document (Tài liệu / Văn bản)
export interface Document {
  id: string;
  organizationId: string;
  termId?: string | null;
  activityId?: string | null;
  memberId?: string | null;
  taskId?: string | null;
  title: string;
  category: DocumentCategory;
  sourceType: DocumentSourceType;
  filePath: string;
  driveFileId?: string | null;
  driveUrl?: string | null;
  fileIconUrl?: string | null;
  thumbnailUrl?: string | null;
  isFolder?: boolean;
  fileSize?: number | null;
  mimeType?: string | null;
  accessLevel: DocumentAccessLevel;
  uploadedBy?: string | null;
  linkedBy?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  uploader?: Profile;
}

// Google Integration & OAuth Connection Models
export interface GoogleConnection {
  id: string;
  userId?: string | null;
  organizationId?: string | null;
  connectionType: GoogleConnectionType;
  googleAccountId?: string | null;
  googleEmail: string;
  googleName?: string | null;
  googleAvatarUrl?: string | null;
  status: GoogleConnectionStatus;
  grantedScopes: string[];
  tokenExpiresAt?: string | null;
  lastVerifiedAt: string;
  errorMessage?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// Google Service Readiness for Phase 9 & upcoming phases
export type GoogleServiceKey = 'identity' | 'drive' | 'sheets' | 'forms' | 'calendar';

export interface GoogleServiceInfo {
  key: GoogleServiceKey;
  name: string;
  description: string;
  iconName: string;
  requiredScopes: string[];
  status: 'ready' | 'connected' | 'requires_auth' | 'planned';
  badge: string;
}

// Navigation & UI types
export interface NavigationItem {
  name: string;
  href: string;
  iconName: string;
  badge?: string;
  description?: string;
}

export interface ModuleInfo {
  key: string;
  title: string;
  description: string;
  status: 'planned' | 'in_development' | 'ready';
  capabilities: string[];
}

// ==========================================
// Phase 10: Google Forms Integration Types
// ==========================================

export type ActivityFormStatus = 'active' | 'closed' | 'draft';
export type FormSyncStatus = 'idle' | 'syncing' | 'success' | 'error';
export type FormMatchStatus = 'matched' | 'unmatched' | 'duplicate' | 'invalid';
export type ParticipantSource = 'manual' | 'google_form' | 'import' | 'system';

export interface ActivityForm {
  id: string;
  organizationId: string;
  termId?: string | null;
  activityId: string;
  googleFormId: string;
  title: string;
  description?: string | null;
  formUrl: string;
  editUrl?: string | null;
  status: ActivityFormStatus;
  isPrimary: boolean;
  createdBy?: string | null;
  lastSyncedAt?: string | null;
  syncStatus: FormSyncStatus;
  syncError?: string | null;
  responseCount: number;
  matchedCount: number;
  unmatchedCount: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityFormResponse {
  id: string;
  activityFormId: string;
  activityId: string;
  organizationId: string;
  googleResponseId: string;
  respondentEmail?: string | null;
  fullName?: string | null;
  studentId?: string | null;
  phoneNumber?: string | null;
  className?: string | null;
  notes?: string | null;
  answersPayload?: Record<string, unknown>;
  submittedAt: string;
  matchStatus: FormMatchStatus;
  matchedMemberId?: string | null;
  matchedMember?: {
    id: string;
    fullName: string;
    studentId?: string | null;
    email?: string | null;
    phone?: string | null;
    className?: string | null;
  } | null;
  activityParticipantId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FormSyncResult {
  formId: string;
  activityId: string;
  totalResponses: number;
  newResponses: number;
  matchedCount: number;
  unmatchedCount: number;
  duplicateCount: number;
  syncedAt: string;
  message: string;
}

// ==========================================
// Phase 11: Google Sheets Integration Types
// ==========================================

export type GoogleSheetModule = 'members' | 'activities' | 'tasks' | 'participants' | 'finance';
export type GoogleSheetConnectionStatus = 'active' | 'archived' | 'error';
export type SheetSyncStatus = 'idle' | 'syncing' | 'success' | 'error';
export type ImportRowStatus = 'valid' | 'invalid' | 'warning' | 'duplicate' | 'conflict';
export type DuplicatePolicy = 'skip' | 'update' | 'create';
export type ConflictPolicy = 'keep_supabase' | 'use_sheet' | 'ask_per_row';

export interface GoogleSheetConnection {
  id: string;
  organizationId: string;
  userId?: string | null;
  spreadsheetId: string;
  spreadsheetName: string;
  spreadsheetUrl: string;
  status: GoogleSheetConnectionStatus;
  moduleTabs: string[];
  lastImportAt?: string | null;
  lastExportAt?: string | null;
  lastSyncStatus: SheetSyncStatus;
  lastSyncError?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

