import dayjs from 'dayjs';
import type { AuditLogItemWithActor } from '../types/audit-log.types';

export interface ModuleConfig {
  label: string;
  color: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  iconName: string;
}

export const AUDIT_MODULE_CONFIG: Record<string, ModuleConfig> = {
  member: {
    label: 'Hội viên',
    color: '#2563eb',
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-200',
    textClass: 'text-blue-700',
    iconName: 'Users',
  },
  activity: {
    label: 'Hoạt động',
    color: '#4f46e5',
    bgClass: 'bg-indigo-50',
    borderClass: 'border-indigo-200',
    textClass: 'text-indigo-700',
    iconName: 'Calendar',
  },
  task: {
    label: 'Công việc',
    color: '#d97706',
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-200',
    textClass: 'text-amber-700',
    iconName: 'CheckSquare',
  },
  finance: {
    label: 'Tài chính',
    color: '#059669',
    bgClass: 'bg-emerald-50',
    borderClass: 'border-emerald-200',
    textClass: 'text-emerald-700',
    iconName: 'DollarSign',
  },
  document: {
    label: 'Tài liệu',
    color: '#0d9488',
    bgClass: 'bg-teal-50',
    borderClass: 'border-teal-200',
    textClass: 'text-teal-700',
    iconName: 'FileText',
  },
  term: {
    label: 'Nhiệm kỳ',
    color: '#7c3aed',
    bgClass: 'bg-purple-50',
    borderClass: 'border-purple-200',
    textClass: 'text-purple-700',
    iconName: 'Clock',
  },
  organization: {
    label: 'Chi hội & Quyền',
    color: '#0284c7',
    bgClass: 'bg-sky-50',
    borderClass: 'border-sky-200',
    textClass: 'text-sky-700',
    iconName: 'Building2',
  },
  google_integration: {
    label: 'Google Workspace',
    color: '#ea580c',
    bgClass: 'bg-orange-50',
    borderClass: 'border-orange-200',
    textClass: 'text-orange-700',
    iconName: 'Cloud',
  },
  system: {
    label: 'Hệ thống',
    color: '#475569',
    bgClass: 'bg-slate-50',
    borderClass: 'border-slate-200',
    textClass: 'text-slate-700',
    iconName: 'Shield',
  },
};

export type ActionImpact = 'create' | 'update' | 'delete' | 'approval' | 'security' | 'sync' | 'info';

export const ACTION_IMPACT_MAP: Record<ActionImpact, { label: string; bgClass: string; textClass: string; borderClass: string }> = {
  create: { label: 'Tạo mới', bgClass: 'bg-emerald-50', textClass: 'text-emerald-700', borderClass: 'border-emerald-200' },
  update: { label: 'Cập nhật', bgClass: 'bg-blue-50', textClass: 'text-blue-700', borderClass: 'border-blue-200' },
  delete: { label: 'Xóa / Hủy', bgClass: 'bg-rose-50', textClass: 'text-rose-700', borderClass: 'border-rose-200' },
  approval: { label: 'Phê duyệt', bgClass: 'bg-purple-50', textClass: 'text-purple-700', borderClass: 'border-purple-200' },
  security: { label: 'Phân quyền', bgClass: 'bg-amber-50', textClass: 'text-amber-700', borderClass: 'border-amber-200' },
  sync: { label: 'Đồng bộ', bgClass: 'bg-teal-50', textClass: 'text-teal-700', borderClass: 'border-teal-200' },
  info: { label: 'Thông tin', bgClass: 'bg-slate-50', textClass: 'text-slate-700', borderClass: 'border-slate-200' },
};

export const AUDIT_ACTION_MAP: Record<string, { label: string; module: string; impact: ActionImpact; description?: string }> = {
  // Members
  'member.create': { label: 'Thêm mới hội viên', module: 'member', impact: 'create' },
  'member.update': { label: 'Cập nhật thông tin hội viên', module: 'member', impact: 'update' },
  'member.delete': { label: 'Xóa hồ sơ hội viên', module: 'member', impact: 'delete' },
  'member.term_assignment': { label: 'Phân công nhiệm kỳ hội viên', module: 'member', impact: 'security' },
  'member.bulk_import': { label: 'Nhập danh sách hội viên hàng loạt', module: 'member', impact: 'create' },

  // Activities
  'activity.create': { label: 'Tạo hoạt động phong trào', module: 'activity', impact: 'create' },
  'activity.update': { label: 'Cập nhật hoạt động', module: 'activity', impact: 'update' },
  'activity.delete': { label: 'Hủy / Xóa hoạt động', module: 'activity', impact: 'delete' },
  'activity.status_change': { label: 'Thay đổi trạng thái hoạt động', module: 'activity', impact: 'update' },
  'activity.register': { label: 'Đăng ký tham gia hoạt động', module: 'activity', impact: 'update' },
  'activity.attendance': { label: 'Cập nhật điểm danh hoạt động', module: 'activity', impact: 'update' },
  'activity.attendance_update': { label: 'Cập nhật điểm danh hội viên', module: 'activity', impact: 'update' },
  'activity.attendance_bulk_update': { label: 'Điểm danh hàng loạt hội viên', module: 'activity', impact: 'update' },
  'activity.participant_add': { label: 'Thêm hội viên tham gia hoạt động', module: 'activity', impact: 'create' },
  'activity.participant_update': { label: 'Cập nhật người tham gia hoạt động', module: 'activity', impact: 'update' },
  'activity.participant_remove': { label: 'Xóa hội viên khỏi hoạt động', module: 'activity', impact: 'delete' },

  // Tasks
  'task.create': { label: 'Giao nhiệm vụ mới', module: 'task', impact: 'create' },
  'task.update': { label: 'Cập nhật nhiệm vụ', module: 'task', impact: 'update' },
  'task.status_change': { label: 'Thay đổi trạng thái công việc', module: 'task', impact: 'update' },
  'task.delete': { label: 'Xóa nhiệm vụ', module: 'task', impact: 'delete' },

  // Finance
  'finance.create': { label: 'Ghi nhận giao dịch thu/chi', module: 'finance', impact: 'create' },
  'finance.update': { label: 'Chỉnh sửa khoản thu/chi', module: 'finance', impact: 'update' },
  'finance.delete': { label: 'Xóa giao dịch tài chính', module: 'finance', impact: 'delete' },
  'finance.transaction_submitted': { label: 'Gửi duyệt giao dịch tài chính', module: 'finance', impact: 'update' },
  'finance.transaction_approved': { label: 'Phê duyệt giao dịch tài chính', module: 'finance', impact: 'approval' },
  'finance.transaction_rejected': { label: 'Từ chối duyệt giao dịch tài chính', module: 'finance', impact: 'approval' },
  'finance.period_closed': { label: 'Chốt kỳ kế toán tài chính', module: 'finance', impact: 'approval' },
  'finance.period_reopened': { label: 'Mở lại kỳ kế toán tài chính', module: 'finance', impact: 'approval' },
  'finance.reconciliation_completed': { label: 'Hoàn tất đối soát sổ sách', module: 'finance', impact: 'approval' },
  'finance.reconciliation_override': { label: 'Ghi đè chênh lệch đối soát', module: 'finance', impact: 'security' },
  'finance.update_threshold': { label: 'Cập nhật hạn mức phê duyệt thu chi', module: 'finance', impact: 'security' },

  // Documents
  'document.create': { label: 'Tải lên tài liệu mới', module: 'document', impact: 'create' },
  'document.update': { label: 'Cập nhật tài liệu', module: 'document', impact: 'update' },
  'document.delete': { label: 'Xóa tài liệu lưu trữ', module: 'document', impact: 'delete' },

  // Terms
  'term.create': { label: 'Tạo nhiệm kỳ mới', module: 'term', impact: 'create' },
  'term.update': { label: 'Cập nhật thông tin nhiệm kỳ', module: 'term', impact: 'update' },
  'term.set_current': { label: 'Đặt làm nhiệm kỳ hiện tại', module: 'term', impact: 'security' },
  'term.delete': { label: 'Xóa nhiệm kỳ', module: 'term', impact: 'delete' },

  // Organizations & Roles
  'organization.create': { label: 'Khởi tạo Đơn vị mới', module: 'organization', impact: 'create' },
  'organization.update': { label: 'Cập nhật thông tin Chi hội', module: 'organization', impact: 'update' },
  'organization.role_change': { label: 'Thay đổi phân quyền vai trò', module: 'organization', impact: 'security' },

  // Google Integration
  'google_integration.connect': { label: 'Kết nối Google Workspace', module: 'google_integration', impact: 'sync' },
  'google_integration.disconnect': { label: 'Ngắt kết nối Google Workspace', module: 'google_integration', impact: 'sync' },
  'google_calendar.sync': { label: 'Đồng bộ Lịch Google Calendar', module: 'google_integration', impact: 'sync' },
  'google_drive.link': { label: 'Liên kết thư mục Google Drive', module: 'google_integration', impact: 'sync' },
};

export const METADATA_KEY_MAP: Record<string, string> = {
  fullName: 'Họ và tên',
  full_name: 'Họ và tên',
  studentId: 'Mã số sinh viên (MSSV)',
  student_id: 'Mã số sinh viên (MSSV)',
  email: 'Email liên hệ',
  phone: 'Số điện thoại',
  status: 'Trạng thái',
  title: 'Tiêu đề / Tên',
  code: 'Mã định danh',
  amount: 'Số tiền (VND)',
  transactionType: 'Loại giao dịch',
  transaction_type: 'Loại giao dịch',
  category: 'Danh mục',
  location: 'Địa điểm',
  startDate: 'Thời gian bắt đầu',
  start_date: 'Thời gian bắt đầu',
  endDate: 'Thời gian kết thúc',
  end_date: 'Thời gian kết thúc',
  dueDate: 'Hạn hoàn thành',
  due_date: 'Hạn hoàn thành',
  priority: 'Mức độ ưu tiên',
  assignedTo: 'Người được phân công',
  assigned_to: 'Người được phân công',
  termId: 'Mã nhiệm kỳ',
  term_id: 'Mã nhiệm kỳ',
  role: 'Vai trò phân quyền',
  position: 'Chức vụ',
  department: 'Ban / Tổ công tác',
  fileName: 'Tên tệp tin',
  file_name: 'Tên tệp tin',
  fileSize: 'Kích thước tệp',
  file_size: 'Kích thước tệp',
  sourceType: 'Nguồn lưu trữ',
  source_type: 'Nguồn lưu trữ',
  googleEventId: 'Mã sự kiện Google',
  google_event_id: 'Mã sự kiện Google',
  previous_status: 'Trạng thái trước',
  new_status: 'Trạng thái sau',
  previous_state: 'Dữ liệu trước thay đổi',
  new_state: 'Dữ liệu sau thay đổi',
  before: 'Dữ liệu trước thay đổi',
  after: 'Dữ liệu sau thay đổi',
  task_id: 'Mã công việc',
  task_title: 'Tên công việc',
  activity_id: 'Mã hoạt động',
  activity_title: 'Tên hoạt động',
  participant_id: 'Mã người tham gia',
  participant_count: 'Số lượng người tham gia',
  target_status: 'Trạng thái điểm danh mục tiêu',
  attendance_status: 'Trạng thái điểm danh',
  registration_status: 'Trạng thái đăng ký',
  member_id: 'Mã hội viên',
  member_name: 'Tên hội viên',
  changed_by: 'Người cập nhật',
  reason: 'Lý do thực hiện',
  note: 'Ghi chú',
  description: 'Mô tả chi tiết',
  action_summary: 'Tóm tắt tác vụ',
};

export function inferModuleFromAction(action: string): string {
  if (AUDIT_ACTION_MAP[action]) {
    return AUDIT_ACTION_MAP[action].module;
  }
  const prefix = action.split('.')[0] || 'system';
  if (AUDIT_MODULE_CONFIG[prefix]) {
    return prefix;
  }
  return 'system';
}

export function inferActionImpact(action: string): ActionImpact {
  if (AUDIT_ACTION_MAP[action]) {
    return AUDIT_ACTION_MAP[action].impact;
  }
  const lower = action.toLowerCase();
  if (lower.includes('create') || lower.includes('add') || lower.includes('insert') || lower.includes('import')) return 'create';
  if (lower.includes('delete') || lower.includes('remove') || lower.includes('destroy')) return 'delete';
  if (lower.includes('approve') || lower.includes('reject') || lower.includes('close') || lower.includes('reopen')) return 'approval';
  if (lower.includes('role') || lower.includes('permission') || lower.includes('threshold') || lower.includes('override')) return 'security';
  if (lower.includes('sync') || lower.includes('link') || lower.includes('connect')) return 'sync';
  if (lower.includes('update') || lower.includes('edit') || lower.includes('change')) return 'update';
  return 'info';
}

export function formatAuditActionLabel(action: string): string {
  if (AUDIT_ACTION_MAP[action]) {
    return AUDIT_ACTION_MAP[action].label;
  }
  const parts = action.split('.');
  if (parts.length === 2) {
    const verbMap: Record<string, string> = {
      create: 'Tạo mới',
      update: 'Cập nhật',
      delete: 'Xóa',
      link: 'Liên kết',
      unlink: 'Hủy liên kết',
      sync: 'Đồng bộ',
      assign: 'Phân công',
    };
    const verb = verbMap[parts[1]] || parts[1];
    return `${verb} (${parts[0]})`;
  }
  return action;
}

export function formatAuditTimestamp(isoDate: string): string {
  if (!isoDate) return '—';
  return dayjs(isoDate).format('DD/MM/YYYY HH:mm:ss');
}

export function formatRelativeTime(isoDate: string): string {
  if (!isoDate) return '';
  const now = dayjs();
  const date = dayjs(isoDate);
  const diffMinutes = now.diff(date, 'minute');

  if (diffMinutes < 1) return 'Vừa xong';
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  const diffHours = now.diff(date, 'hour');
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = now.diff(date, 'day');
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return date.format('DD/MM/YYYY');
}

export function formatMetadataKey(key: string): string {
  return METADATA_KEY_MAP[key] || key;
}

export function formatMetadataValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Có / Hoạt động' : 'Không / Vô hiệu';
  if (typeof value === 'number') {
    if (value > 10000 && Number.isInteger(value)) {
      return new Intl.NumberFormat('vi-VN').format(value);
    }
    return String(value);
  }
  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return value.map((v) => (typeof v === 'object' ? JSON.stringify(v) : String(v))).join(', ');
    }
    return JSON.stringify(value);
  }
  return String(value);
}

/**
 * Sanitize metadata to avoid displaying sensitive tokens, secrets, or passwords
 */
export function sanitizeMetadata(metadata: Record<string, unknown> | null | undefined): Record<string, unknown> {
  if (!metadata) return {};
  const sanitized: Record<string, unknown> = {};
  const sensitiveKeys = ['token', 'access_token', 'refresh_token', 'password', 'secret', 'api_key', 'authorization', 'credential'];

  for (const [k, v] of Object.entries(metadata)) {
    if (sensitiveKeys.some((s) => k.toLowerCase().includes(s))) {
      sanitized[k] = '•••••••• (Đã bảo vệ)';
    } else if (v && typeof v === 'object' && !Array.isArray(v)) {
      sanitized[k] = sanitizeMetadata(v as Record<string, unknown>);
    } else {
      sanitized[k] = v;
    }
  }
  return sanitized;
}

/**
 * Export audit logs to CSV
 */
export function exportAuditLogsToCSV(logs: AuditLogItemWithActor[]): void {
  if (!logs || logs.length === 0) return;

  const headers = ['Mã sự kiện', 'Thời gian', 'Người thực hiện', 'Email/MSSV', 'Phân hệ', 'Hành động', 'Loại đối tượng', 'Mã đối tượng', 'Chi tiết metadata'];
  const rows = logs.map((log) => [
    log.id,
    formatAuditTimestamp(log.createdAt),
    log.actor?.fullName || 'Hệ thống',
    log.actor?.studentId ? `MSSV: ${log.actor.studentId}` : log.actor?.email || 'N/A',
    log.moduleLabel,
    log.actionLabel,
    log.entityType,
    log.entityId || '',
    JSON.stringify(sanitizeMetadata(log.metadata)),
  ]);

  const csvContent = [
    headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(','),
    ...rows.map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `ChapterOS_AuditLogs_${dayjs().format('YYYYMMDD_HHmmss')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
