import type { GoogleSheetModule } from './google-sheets.types';

export const GOOGLE_SHEETS_MODULE_TABS: Record<GoogleSheetModule, {
  tabName: string;
  title: string;
  description: string;
  iconName: string;
}> = {
  members: {
    tabName: 'Hội viên',
    title: 'Danh sách Hội viên',
    description: 'Hồ sơ hội viên, MSSV, chức vụ, trạng thái sinh hoạt và phân công nhiệm kỳ.',
    iconName: 'Users',
  },
  activities: {
    tabName: 'Hoạt động',
    title: 'Kế hoạch Hoạt động & Sự kiện',
    description: 'Danh mục hoạt động, thời gian tổ chức, địa điểm và chỉ tiêu số lượng.',
    iconName: 'Calendar',
  },
  tasks: {
    tabName: 'Nhiệm vụ',
    title: 'Phân công Nhiệm vụ (Tasks)',
    description: 'Nhiệm vụ Ban Chấp Hành, tiến độ thực hiện, mức độ ưu tiên và hạn hoàn thành.',
    iconName: 'CheckSquare',
  },
  participants: {
    tabName: 'Người tham gia',
    title: 'Điểm danh & Người tham gia',
    description: 'Danh sách đăng ký sự kiện, nguồn đăng ký (Forms/Manual) và trạng thái tham dự.',
    iconName: 'UserCheck',
  },
  finance: {
    tabName: 'Sổ quỹ Thu Chi',
    title: 'Sổ quỹ Thu - Chi',
    description: 'Giao dịch thu chi chi tiết, phân loại danh mục, chứng từ và số tiền.',
    iconName: 'DollarSign',
  },
};

export const SPREADSHEET_ID_REGEX = /[-\w]{25,}/;
export const GOOGLE_SHEET_URL_REGEX = /https:\/\/docs\.google\.com\/spreadsheets\/d\/([-\w]{25,})/;

/**
 * Extracts spreadsheetId from URL or raw ID string
 */
export function extractSpreadsheetId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  const urlMatch = trimmed.match(GOOGLE_SHEET_URL_REGEX);
  if (urlMatch && urlMatch[1]) return urlMatch[1];
  const idMatch = trimmed.match(SPREADSHEET_ID_REGEX);
  if (idMatch && idMatch[0]) return idMatch[0];
  return null;
}

/**
 * Builds standard Google Sheets view URL
 */
export function buildSpreadsheetUrl(spreadsheetId: string, gid?: string): string {
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit${gid ? `#gid=${gid}` : ''}`;
}
