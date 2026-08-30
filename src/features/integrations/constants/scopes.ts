/**
 * ChapterOS - Google OAuth Scope Catalogue & Definitions
 * Adhering to the Principle of Least Privilege (Phạm vi tối thiểu)
 */

export interface GoogleScopeDefinition {
  scope: string;
  name: string;
  category: 'identity' | 'drive' | 'sheets' | 'forms' | 'calendar';
  description: string;
  purpose: string;
  isRequired: boolean;
  securityImpact: 'low' | 'medium' | 'high';
}

export const GOOGLE_SCOPES_CATALOGUE: GoogleScopeDefinition[] = [
  {
    scope: 'openid',
    name: 'OpenID Connect',
    category: 'identity',
    description: 'Xác thực chuẩn OpenID để chứng thực danh tính người dùng.',
    purpose: 'Cho phép đăng nhập an toàn không cần mật khẩu riêng qua Google.',
    isRequired: true,
    securityImpact: 'low',
  },
  {
    scope: 'https://www.googleapis.com/auth/userinfo.email',
    name: 'Google Email',
    category: 'identity',
    description: 'Xem địa chỉ email chính thức của tài khoản Google.',
    purpose: 'Định danh tài khoản, liên kết hồ sơ Đơn vị và gửi thông báo hệ thống.',
    isRequired: true,
    securityImpact: 'low',
  },
  {
    scope: 'https://www.googleapis.com/auth/userinfo.profile',
    name: 'Google Profile',
    category: 'identity',
    description: 'Xem thông tin hồ sơ cơ bản (Họ tên và ảnh đại diện).',
    purpose: 'Hiển thị họ tên và avatar chuẩn xác trên danh sách BCH và hội viên.',
    isRequired: true,
    securityImpact: 'low',
  },
  {
    scope: 'https://www.googleapis.com/auth/drive.file',
    name: 'Google Drive & Docs (Per-file & Documents)',
    category: 'drive',
    description: 'Toàn quyền tạo tệp tin, văn bản, biên bản và thư mục lưu trữ tài liệu.',
    purpose: 'Tự động tạo thư mục nhiệm kỳ, lưu trữ quyết định, kế hoạch và tài liệu Đơn vị.',
    isRequired: false,
    securityImpact: 'medium',
  },
  {
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    name: 'Google Sheets (Toàn quyền Tạo & Quản lý)',
    category: 'sheets',
    description: 'Toàn quyền tạo bảng tính mới, chỉnh sửa, xuất snapshot và đồng bộ dữ liệu.',
    purpose: 'Tạo mới bảng tính Đơn vị, xuất snapshot UTF-8 BOM và nhập đối soát 2 chiều.',
    isRequired: false,
    securityImpact: 'high',
  },
  {
    scope: 'https://www.googleapis.com/auth/forms.body',
    name: 'Google Forms (Toàn quyền Tạo Biểu mẫu)',
    category: 'forms',
    description: 'Toàn quyền tạo mới biểu mẫu Google Forms, chỉnh sửa câu hỏi và cấu hình.',
    purpose: 'Tự động tạo biểu mẫu đăng ký sự kiện, khảo sát ý kiến và thu thập thông tin sinh viên.',
    isRequired: false,
    securityImpact: 'high',
  },
  {
    scope: 'https://www.googleapis.com/auth/forms.responses.readonly',
    name: 'Google Forms Responses (Đọc Phản hồi)',
    category: 'forms',
    description: 'Đọc câu trả lời phản hồi từ các biểu mẫu đăng ký của Đơn vị.',
    purpose: 'Tự động khớp MSSV với hồ sơ hội viên và ghi nhận điểm danh tức thì.',
    isRequired: false,
    securityImpact: 'medium',
  },
  {
    scope: 'https://www.googleapis.com/auth/calendar.events',
    name: 'Google Calendar (Lịch & Sự kiện)',
    category: 'calendar',
    description: 'Xem, tạo mới và đồng bộ các sự kiện trên Google Calendar của Đơn vị.',
    purpose: 'Đồng bộ lịch hoạt động, buổi họp Ban Chấp Hành và hạn chót nhiệm vụ.',
    isRequired: false,
    securityImpact: 'medium',
  },
];

export const DEFAULT_IDENTITY_SCOPES = [
  'openid',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

export const WORKSPACE_INTEGRATION_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/forms.body',
  'https://www.googleapis.com/auth/forms.responses.readonly',
  'https://www.googleapis.com/auth/calendar.events',
];

/**
 * Helper to check if a service is granted based on flexible scope match
 */
export function isServiceScopeGranted(service: 'forms' | 'sheets' | 'calendar' | 'drive', grantedScopes: string[]): boolean {
  if (!grantedScopes || grantedScopes.length === 0) return false;

  switch (service) {
    case 'forms':
      return (
        grantedScopes.includes('https://www.googleapis.com/auth/forms.body') ||
        grantedScopes.includes('https://www.googleapis.com/auth/forms.responses.readonly') ||
        grantedScopes.includes('https://www.googleapis.com/auth/forms')
      );
    case 'sheets':
      return (
        grantedScopes.includes('https://www.googleapis.com/auth/spreadsheets') ||
        grantedScopes.includes('https://www.googleapis.com/auth/spreadsheets.readonly')
      );
    case 'calendar':
      return (
        grantedScopes.includes('https://www.googleapis.com/auth/calendar.events') ||
        grantedScopes.includes('https://www.googleapis.com/auth/calendar')
      );
    case 'drive':
      return (
        grantedScopes.includes('https://www.googleapis.com/auth/drive.file') ||
        grantedScopes.includes('https://www.googleapis.com/auth/drive') ||
        grantedScopes.includes('https://www.googleapis.com/auth/documents')
      );
    default:
      return false;
  }
}
