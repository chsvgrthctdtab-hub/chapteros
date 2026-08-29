import type { DocumentCategory, DocumentAccessLevel } from '@/types';

// Max upload file size: 25 MB
export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

// Allowed MIME types mapped to readable extensions
export const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-powerpoint': ['.ppt'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/gif': ['.gif'],
  'image/svg+xml': ['.svg'],
  'text/plain': ['.txt'],
  'text/csv': ['.csv'],
  'application/zip': ['.zip'],
  'application/x-zip-compressed': ['.zip'],
  'application/x-rar-compressed': ['.rar'],
  'application/json': ['.json'],
};

// Dangerous file extensions strictly rejected
export const FORBIDDEN_EXTENSIONS = [
  '.exe',
  '.bat',
  '.cmd',
  '.sh',
  '.msi',
  '.com',
  '.vbs',
  '.scr',
  '.pif',
  '.php',
  '.js',
  '.ts',
  '.html',
  '.htm',
];

/**
 * Format bytes to readable string (e.g. 1.2 MB, 450 KB)
 */
export function formatFileSize(bytes?: number | null): string {
  if (bytes === undefined || bytes === null || isNaN(bytes)) {
    return '0 B';
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * Get file extension from file path or title
 */
export function getFileExtension(filename?: string | null): string {
  if (!filename) return '';
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return '';
  return filename.slice(lastDot + 1).toLowerCase();
}

export type FileTypeGroup =
  | 'pdf'
  | 'word'
  | 'excel'
  | 'powerpoint'
  | 'image'
  | 'archive'
  | 'text'
  | 'gdoc'
  | 'gsheet'
  | 'gslide'
  | 'gform'
  | 'folder'
  | 'other';

/**
 * Categorize file into high-level type for icons & filters
 */
export function getFileTypeGroup(mimeType?: string | null, filename?: string | null): FileTypeGroup {
  const ext = getFileExtension(filename);
  const mime = mimeType?.toLowerCase() || '';

  if (mime === 'application/vnd.google-apps.folder') {
    return 'folder';
  }
  if (mime === 'application/vnd.google-apps.document') {
    return 'gdoc';
  }
  if (mime === 'application/vnd.google-apps.spreadsheet') {
    return 'gsheet';
  }
  if (mime === 'application/vnd.google-apps.presentation') {
    return 'gslide';
  }
  if (mime === 'application/vnd.google-apps.form') {
    return 'gform';
  }
  if (mime.includes('pdf') || ext === 'pdf') {
    return 'pdf';
  }
  if (
    mime.includes('word') ||
    mime.includes('officedocument.wordprocessingml') ||
    ['doc', 'docx'].includes(ext)
  ) {
    return 'word';
  }
  if (
    mime.includes('excel') ||
    mime.includes('spreadsheetml') ||
    mime.includes('csv') ||
    ['xls', 'xlsx', 'csv'].includes(ext)
  ) {
    return 'excel';
  }
  if (
    mime.includes('powerpoint') ||
    mime.includes('presentationml') ||
    ['ppt', 'pptx'].includes(ext)
  ) {
    return 'powerpoint';
  }
  if (
    mime.startsWith('image/') ||
    ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext)
  ) {
    return 'image';
  }
  if (
    mime.includes('zip') ||
    mime.includes('rar') ||
    mime.includes('tar') ||
    ['zip', 'rar', '7z', 'gz'].includes(ext)
  ) {
    return 'archive';
  }
  if (mime.startsWith('text/') || ['txt', 'md', 'json'].includes(ext)) {
    return 'text';
  }
  return 'other';
}

/**
 * Client-side file validation
 */
export function validateDocumentFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'Chưa chọn tệp tin tải lên' };
  }

  // Check size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `Dung lượng tệp vượt quá giới hạn cho phép (Tối đa ${formatFileSize(MAX_FILE_SIZE_BYTES)}, hiện tại: ${formatFileSize(file.size)})`,
    };
  }

  if (file.size === 0) {
    return { valid: false, error: 'Tệp tin rỗng (0 bytes)' };
  }

  // Check forbidden extension
  const ext = `.${getFileExtension(file.name)}`;
  if (FORBIDDEN_EXTENSIONS.includes(ext.toLowerCase())) {
    return {
      valid: false,
      error: `Định dạng tệp ${ext} không được phép tải lên vì lý do an toàn bảo mật.`,
    };
  }

  return { valid: true };
}

/**
 * Category configuration
 */
export interface CategoryConfig {
  value: DocumentCategory;
  label: string;
  description: string;
  badgeClass: string;
}

export const DOCUMENT_CATEGORY_CONFIGS: Record<DocumentCategory, CategoryConfig> = {
  general: {
    value: 'general',
    label: 'Tài liệu chung',
    description: 'Văn bản, biểu mẫu, tài liệu thông tin chung',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  resolution: {
    value: 'resolution',
    label: 'Nghị quyết',
    description: 'Nghị quyết đại hội, hội nghị ban chấp hành',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  decision: {
    value: 'decision',
    label: 'Quyết định',
    description: 'Quyết định chỉ định nhân sự, khen thưởng, kỷ luật',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  plan: {
    value: 'plan',
    label: 'Kế hoạch công tác',
    description: 'Kế hoạch tổ chức hoạt động, đề án chiến dịch',
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  report: {
    value: 'report',
    label: 'Báo cáo tổng kết',
    description: 'Báo cáo định kỳ, sơ kết, tổng kết nhiệm kỳ',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  template: {
    value: 'template',
    label: 'Biểu mẫu chuẩn',
    description: 'Mẫu đơn xin phép, mẫu dự trù, mẫu biên bản họp',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  handover: {
    value: 'handover',
    label: 'Hồ sơ bàn giao',
    description: 'Biên bản bàn giao công việc, tài sản qua các nhiệm kỳ',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  financial_receipt: {
    value: 'financial_receipt',
    label: 'Chứng từ thu chi',
    description: 'Hóa đơn, phiếu thu, phiếu chi, chứng từ giải ngân',
    badgeClass: 'bg-teal-50 text-teal-700 border-teal-200',
  },
};

/**
 * Access level configuration
 */
export interface AccessLevelConfig {
  value: DocumentAccessLevel;
  label: string;
  description: string;
  badgeClass: string;
}

export const DOCUMENT_ACCESS_CONFIGS: Record<DocumentAccessLevel, AccessLevelConfig> = {
  public: {
    value: 'public',
    label: 'Công khai',
    description: 'Mọi thành viên và người truy cập có thể xem',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  internal: {
    value: 'internal',
    label: 'Nội bộ Đơn vị',
    description: 'Chỉ hội viên trực thuộc Đơn vị mới có thể xem',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  board_only: {
    value: 'board_only',
    label: 'Ban Chấp Hành',
    description: 'Chỉ Ban Chấp Hành Đơn vị mới có quyền xem',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  admin_only: {
    value: 'admin_only',
    label: 'Chỉ Quản trị viên',
    description: 'Chỉ Ban Lãnh đạo Đơn vị và Admin xem được',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
  },
};
