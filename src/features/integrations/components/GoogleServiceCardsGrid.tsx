import type { GoogleServiceKey } from '@/types';
import type { GoogleIntegrationOverview, GoogleServiceMetrics } from '../types/google.types';
import { ServiceCommandCard, type ServiceCardData } from './ServiceCommandCard';
import { formatDate } from '@/lib/date';
import { isServiceScopeGranted } from '../constants/scopes';

interface GoogleServiceCardsGridProps {
  overview: GoogleIntegrationOverview | undefined;
  metrics: GoogleServiceMetrics | undefined;
  onOpenDetail: (serviceKey: GoogleServiceKey) => void;
  onQuickAction?: (serviceKey: GoogleServiceKey) => void;
}

export function GoogleServiceCardsGrid({
  overview,
  metrics,
  onOpenDetail,
  onQuickAction,
}: GoogleServiceCardsGridProps) {
  const isOrgConnected = Boolean(overview?.isOrgConnected);
  const grantedScopes = [
    ...(overview?.orgScopes || []),
    ...(overview?.userScopes || []),
  ];

  const servicesData: ServiceCardData[] = [
    {
      key: 'forms',
      name: 'Google Forms',
      subtitle: 'Thu thập đơn đăng ký & Khảo sát ý kiến',
      tagline: 'Khớp MSSV tự động & Điểm danh sự kiện',
      description:
        'Tự động thu thập câu trả lời từ Google Forms đăng ký tham gia sự kiện của sinh viên, khớp MSSV với hồ sơ hội viên và ghi nhận điểm danh tức thì.',
      requiredScope: 'https://www.googleapis.com/auth/forms.body',
      isScopeGranted: isServiceScopeGranted('forms', grantedScopes),
      isOrgConnected,
      metrics: {
        label1: 'Biểu mẫu liên kết',
        val1: metrics?.forms.totalForms ?? 0,
        label2: 'Phản hồi ghi nhận',
        val2: metrics?.forms.totalResponses ?? 0,
        label3: 'Hội viên đã khớp',
        val3: metrics?.forms.totalMatched ?? 0,
      },
      highlights: [
        'Tự động gom phản hồi đăng ký sự kiện vào danh sách tham gia',
        'Tự động đối chiếu MSSV để phát hiện hội viên mới/cũ',
        'Khảo sát ý kiến đóng góp sau mỗi chương trình Đơn vị',
      ],
    },
    {
      key: 'sheets',
      name: 'Google Sheets',
      subtitle: 'Quản lý bảng tính, Xuất snapshot & Nhập đối soát',
      tagline: 'Trao đổi dữ liệu 2 chiều với PostgreSQL',
      description:
        'Liên kết bảng tính Google Sheets của Đơn vị, xuất dữ liệu snapshot chuẩn hóa UTF-8 BOM và quy trình nhập dữ liệu 4 bước có đối soát trùng lặp & giải quyết xung đột.',
      requiredScope: 'https://www.googleapis.com/auth/spreadsheets',
      isScopeGranted: isServiceScopeGranted('sheets', grantedScopes),
      isOrgConnected,
      metrics: {
        label1: 'Bảng tính kết nối',
        val1: metrics?.sheets.totalConnections ?? 0,
        label2: 'Xuất gần nhất',
        val2: metrics?.sheets.lastExportAt ? formatDate(metrics.sheets.lastExportAt, 'dd/MM') : 'Chưa xuất',
        label3: 'Nhập gần nhất',
        val3: metrics?.sheets.lastImportAt ? formatDate(metrics.sheets.lastImportAt, 'dd/MM') : 'Chưa nhập',
      },
      highlights: [
        'Xuất bảng danh sách hội viên, hoạt động, nhiệm vụ và sổ quỹ tài chính',
        'Quy trình nhập dữ liệu 4 bước: Tự động khớp cột, đối soát trùng lặp và xung đột',
        'Deeplink mở trực tiếp Google Sheets và theo dõi lịch sử xuất nhập dữ liệu',
      ],
    },
    {
      key: 'calendar',
      name: 'Google Calendar',
      subtitle: 'Lịch hoạt động & Lịch họp Ban Chấp Hành',
      tagline: 'Chiếu lịch tự động & Nhắc nhở hạn chót',
      description:
        'Đồng bộ lịch hoạt động Đơn vị, lịch họp Ban Chấp Hành và hạn chót hoàn thành nhiệm vụ vào Google Calendar với múi giờ Asia/Ho_Chi_Minh (GMT+7).',
      requiredScope: 'https://www.googleapis.com/auth/calendar.events',
      isScopeGranted: isServiceScopeGranted('calendar', grantedScopes),
      isOrgConnected,
      metrics: {
        label1: 'Sự kiện chiếu lịch',
        val1: metrics?.calendar.totalEvents ?? 0,
        label2: 'Lịch mặc định',
        val2: 'Primary BCH',
        label3: 'Múi giờ',
        val3: 'GMT+7 VN',
      },
      highlights: [
        'Đồng bộ lịch tổ chức sự kiện và buổi họp BCH định kỳ',
        'Nhắc nhở hạn chót hoàn thành công việc (Task Due Date)',
        'Gửi lời mời sự kiện trực tiếp tới email sinh viên',
      ],
    },
    {
      key: 'drive',
      name: 'Google Drive',
      subtitle: 'Lưu trữ & Phân loại tài liệu nhiệm kỳ',
      tagline: 'Cây thư mục chuẩn hóa & Sao lưu an toàn',
      description:
        'Tự động tạo cây thư mục chuẩn theo từng nhiệm kỳ Đơn vị. Sao lưu quyết định, kế hoạch, biên bản họp và tài liệu chứng từ có chữ ký số an toàn.',
      requiredScope: 'https://www.googleapis.com/auth/drive.file',
      isScopeGranted: isServiceScopeGranted('drive', grantedScopes),
      isOrgConnected,
      metrics: {
        label1: 'Tài liệu liên kết',
        val1: metrics?.drive.totalDocuments ?? 0,
        label2: 'Thư mục chuẩn',
        val2: '4 Thư mục',
        label3: 'Phân quyền',
        val3: 'RBAC BCH',
      },
      highlights: [
        'Tự động phân loại tài liệu theo nhiệm kỳ và hoạt động',
        'Tạo thư mục Google Drive dùng chung cho Ban Chấp Hành',
        'Phân quyền xem/chỉnh sửa theo vai trò (Leader/Treasurer/Secretary)',
      ],
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Trung tâm Điều khiển Dịch vụ Google Workspace
          </h3>
          <p className="text-xs text-slate-500">
            Trạng thái phân quyền, năng lực tự động hóa và thông số vận hành của từng dịch vụ
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {servicesData.map((svc) => (
          <ServiceCommandCard
            key={svc.key}
            data={svc}
            onOpenDetail={onOpenDetail}
            onQuickAction={onQuickAction}
          />
        ))}
      </div>
    </div>
  );
}
