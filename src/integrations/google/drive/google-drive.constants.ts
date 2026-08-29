import type { GoogleDriveFileTypeGroup } from './google-drive.types';

export const GOOGLE_DRIVE_MIME_TYPES = {
  // Google Native Apps
  FOLDER: 'application/vnd.google-apps.folder',
  DOCUMENT: 'application/vnd.google-apps.document',
  SPREADSHEET: 'application/vnd.google-apps.spreadsheet',
  PRESENTATION: 'application/vnd.google-apps.presentation',
  FORM: 'application/vnd.google-apps.form',
  DRAWING: 'application/vnd.google-apps.drawing',
  SCRIPT: 'application/vnd.google-apps.script',
  SITE: 'application/vnd.google-apps.site',

  // Standard Formats
  PDF: 'application/pdf',
  MS_WORD: 'application/msword',
  MS_WORD_X: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  MS_EXCEL: 'application/vnd.ms-excel',
  MS_EXCEL_X: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  MS_POWERPOINT: 'application/vnd.ms-powerpoint',
  MS_POWERPOINT_X: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  PNG: 'image/png',
  JPEG: 'image/jpeg',
  WEBP: 'image/webp',
  GIF: 'image/gif',
  ZIP: 'application/zip',
  ZIP_COMPRESSED: 'application/x-zip-compressed',
  CSV: 'text/csv',
  TXT: 'text/plain',
} as const;

export const GOOGLE_DRIVE_FILE_TYPE_INFO: Record<
  GoogleDriveFileTypeGroup,
  {
    label: string;
    description: string;
    badgeColor: string;
    borderColor: string;
    textColor: string;
    bgColor: string;
  }
> = {
  doc: {
    label: 'Google Docs / Word',
    description: 'Tài liệu văn bản, nghị quyết, đề án',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  sheet: {
    label: 'Google Sheets / Excel',
    description: 'Bảng tính, số liệu thu chi, danh sách hội viên',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
  },
  slide: {
    label: 'Google Slides / PPT',
    description: 'Bản trình chiếu, slide báo cáo tổng kết',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  form: {
    label: 'Google Forms',
    description: 'Biểu mẫu khảo sát, form đăng ký sự kiện',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  pdf: {
    label: 'Tệp PDF',
    description: 'Văn bản có chữ ký số, kế hoạch ban hành',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    borderColor: 'border-rose-200',
    textColor: 'text-rose-600',
    bgColor: 'bg-rose-50',
  },
  image: {
    label: 'Hình ảnh / Poster',
    description: 'Ảnh hoạt động, banner chương trình, minh chứng',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    borderColor: 'border-indigo-200',
    textColor: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
  },
  video: {
    label: 'Video',
    description: 'Video tư liệu, phóng sự hoạt động',
    badgeColor: 'bg-red-100 text-red-800 border-red-200',
    borderColor: 'border-red-200',
    textColor: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  audio: {
    label: 'Âm thanh',
    description: 'Ghi âm cuộc họp, tư liệu âm thanh',
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-200',
    borderColor: 'border-teal-200',
    textColor: 'text-teal-600',
    bgColor: 'bg-teal-50',
  },
  archive: {
    label: 'Tệp nén (ZIP/RAR)',
    description: 'Gói hồ sơ nén tổng hợp',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
    borderColor: 'border-slate-200',
    textColor: 'text-slate-600',
    bgColor: 'bg-slate-50',
  },
  folder: {
    label: 'Thư mục Drive',
    description: 'Thư mục chứa tập hợp hồ sơ tài liệu',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-200',
    borderColor: 'border-amber-200',
    textColor: 'text-amber-700',
    bgColor: 'bg-amber-50',
  },
  other: {
    label: 'Tệp khác',
    description: 'Tài liệu Google Drive',
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
    borderColor: 'border-slate-200',
    textColor: 'text-slate-600',
    bgColor: 'bg-slate-50',
  },
};

/**
 * Classifies MIME types and filenames into standard UI groups
 */
export function getDriveFileTypeGroup(
  mimeType?: string | null,
  fileName?: string | null
): GoogleDriveFileTypeGroup {
  const mime = (mimeType || '').toLowerCase();
  const name = (fileName || '').toLowerCase();

  if (mime === GOOGLE_DRIVE_MIME_TYPES.FOLDER) return 'folder';
  if (mime.includes('document') || mime.includes('word') || name.endsWith('.doc') || name.endsWith('.docx')) {
    return 'doc';
  }
  if (mime.includes('spreadsheet') || mime.includes('excel') || mime.includes('csv') || name.endsWith('.xls') || name.endsWith('.xlsx') || name.endsWith('.csv')) {
    return 'sheet';
  }
  if (mime.includes('presentation') || mime.includes('powerpoint') || name.endsWith('.ppt') || name.endsWith('.pptx')) {
    return 'slide';
  }
  if (mime.includes('form') || name.includes('form')) {
    return 'form';
  }
  if (mime.includes('pdf') || name.endsWith('.pdf')) {
    return 'pdf';
  }
  if (mime.startsWith('image/') || name.match(/\.(png|jpe?g|webp|gif|svg)$/)) {
    return 'image';
  }
  if (mime.startsWith('video/') || name.match(/\.(mp4|mov|avi|mkv)$/)) {
    return 'video';
  }
  if (mime.startsWith('audio/') || name.match(/\.(mp3|wav|ogg|m4a)$/)) {
    return 'audio';
  }
  if (mime.includes('zip') || mime.includes('compressed') || mime.includes('tar') || name.match(/\.(zip|rar|7z|tar|gz)$/)) {
    return 'archive';
  }

  return 'other';
}

/**
 * Robust Google Drive File / Folder ID parser
 * Supports:
 * - https://drive.google.com/file/d/{id}/view
 * - https://docs.google.com/document/d/{id}/edit
 * - https://docs.google.com/spreadsheets/d/{id}/edit
 * - https://docs.google.com/presentation/d/{id}/edit
 * - https://docs.google.com/forms/d/{id}/edit
 * - https://docs.google.com/forms/d/e/{id}/viewform
 * - https://drive.google.com/drive/folders/{id}
 * - https://drive.google.com/drive/u/0/folders/{id}
 * - Raw Google Drive file IDs (e.g. 1A2b3C_4D5e6F7g8H9i0j-kLmNoPqRsTuVwXyZ)
 */
export function extractGoogleDriveFileId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  // 1. Direct alphanumeric ID check (typically 25 to 55 characters)
  if (/^[a-zA-Z0-9_-]{25,60}$/.test(trimmed)) {
    return trimmed;
  }

  // 2. Google Drive /file/d/{id} or /folders/{id}
  const driveMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch && driveMatch[1]) {
    return driveMatch[1];
  }

  const folderMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch && folderMatch[1]) {
    return folderMatch[1];
  }

  // 3. Google Forms URL /forms/d/e/{id}/...
  const formEMatch = trimmed.match(/\/forms\/d\/e\/([a-zA-Z0-9_-]+)/);
  if (formEMatch && formEMatch[1]) {
    return formEMatch[1];
  }

  // 4. Query param ?id=
  try {
    const url = new URL(trimmed);
    const idParam = url.searchParams.get('id');
    if (idParam && /^[a-zA-Z0-9_-]{20,60}$/.test(idParam)) {
      return idParam;
    }
  } catch {
    // Not a standard URL
  }

  return null;
}

/**
 * Builds a canonical Google Drive / Docs URL for previewing
 */
export function buildGoogleDriveViewUrl(fileId: string, mimeType?: string): string {
  const mime = (mimeType || '').toLowerCase();
  if (mime === GOOGLE_DRIVE_MIME_TYPES.FOLDER) {
    return `https://drive.google.com/drive/folders/${fileId}`;
  }
  if (mime === GOOGLE_DRIVE_MIME_TYPES.DOCUMENT) {
    return `https://docs.google.com/document/d/${fileId}/view`;
  }
  if (mime === GOOGLE_DRIVE_MIME_TYPES.SPREADSHEET) {
    return `https://docs.google.com/spreadsheets/d/${fileId}/edit`;
  }
  if (mime === GOOGLE_DRIVE_MIME_TYPES.PRESENTATION) {
    return `https://docs.google.com/presentation/d/${fileId}/view`;
  }
  if (mime === GOOGLE_DRIVE_MIME_TYPES.FORM) {
    return `https://docs.google.com/forms/d/${fileId}/viewform`;
  }

  return `https://drive.google.com/file/d/${fileId}/view`;
}
