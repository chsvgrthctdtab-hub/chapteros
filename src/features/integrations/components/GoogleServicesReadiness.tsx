import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FolderSync, 
  Table, 
  FileText, 
  CalendarDays, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import type { GoogleServiceReadinessInfo } from '../types/google.types';

interface GoogleServicesReadinessProps {
  grantedScopes: string[];
  isOrgConnected: boolean;
}

function isServiceScopeGranted(serviceKey: string, scopes: string[]): boolean {
  if (!scopes || scopes.length === 0) return false;
  const scopeMap: Record<string, string[]> = {
    drive: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/drive.readonly'],
    sheets: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/spreadsheets.readonly'],
    forms: ['https://www.googleapis.com/auth/forms.body', 'https://www.googleapis.com/auth/forms.responses.readonly'],
    calendar: ['https://www.googleapis.com/auth/calendar.events', 'https://www.googleapis.com/auth/calendar'],
  };
  const required = scopeMap[serviceKey] || [];
  return required.some((req) => scopes.includes(req)) || scopes.length > 0;
}

export function GoogleServicesReadiness({
  grantedScopes,
  isOrgConnected,
}: GoogleServicesReadinessProps) {
  const services: GoogleServiceReadinessInfo[] = [
    {
      key: 'drive',
      name: 'Đồng bộ Google Drive',
      tagline: 'Lưu trữ & Sao lưu tài liệu nhiệm kỳ',
      description:
        'Tự động tạo cây thư mục chuẩn theo từng nhiệm kỳ Đơn vị. Sao lưu quyết định, kế hoạch, biên bản họp và tài liệu chứng từ an toàn.',
      phase: 'Sẵn sàng',
      targetFeatures: [
        'Tự động phân loại tài liệu theo nhiệm kỳ và hoạt động',
        'Tạo thư mục Google Drive dùng chung cho Ban Chấp Hành',
        'Phân quyền xem/chỉnh sửa theo vai trò (Trưởng/Phó/Thủ quỹ/Thư ký)',
      ],
      requiredScopes: ['https://www.googleapis.com/auth/drive.file'],
      isScopeGranted: isServiceScopeGranted('drive', grantedScopes),
      readinessState: isOrgConnected
        ? (isServiceScopeGranted('drive', grantedScopes) ? 'ready_for_phase' : 'missing_scopes')
        : 'not_connected',
    },
    {
      key: 'sheets',
      name: 'Tích hợp Google Sheets',
      tagline: 'Quản lý bảng tính, Xuất snapshot & Nhập đối soát',
      description:
        'Liên kết bảng tính Google Sheets của Đơn vị, xuất dữ liệu chuẩn hóa UTF-8 BOM và quy trình nhập dữ liệu 4 bước có đối soát trùng lặp & giải quyết xung đột trước khi lưu.',
      phase: 'Sẵn sàng',
      targetFeatures: [
        'Xuất bảng danh sách hội viên, hoạt động, nhiệm vụ và sổ quỹ tài chính',
        'Quy trình nhập dữ liệu 4 bước: Tự động khớp cột, đối soát trùng lặp và xung đột',
        'Mở trực tiếp Google Sheets và theo dõi lịch sử xuất nhập dữ liệu',
      ],
      requiredScopes: ['https://www.googleapis.com/auth/spreadsheets'],
      isScopeGranted: isServiceScopeGranted('sheets', grantedScopes),
      readinessState: isOrgConnected
        ? (isServiceScopeGranted('sheets', grantedScopes) ? 'ready_for_phase' : 'missing_scopes')
        : 'not_connected',
    },
    {
      key: 'forms',
      name: 'Tự động hóa Google Forms',
      tagline: 'Thu thập đơn đăng ký & Khảo sát ý kiến',
      description:
        'Tự động thu thập câu trả lời từ Google Forms đăng ký tham gia sự kiện của sinh viên, khớp MSSV với hồ sơ hội viên và ghi nhận điểm danh tức thì.',
      phase: 'Sẵn sàng',
      targetFeatures: [
        'Tự động gom phản hồi đăng ký sự kiện vào danh sách tham gia',
        'Tự động đối chiếu MSSV để phát hiện hội viên mới/cũ',
        'Khảo sát ý kiến đóng góp sau mỗi chương trình Đơn vị',
      ],
      requiredScopes: ['https://www.googleapis.com/auth/forms.body'],
      isScopeGranted: isServiceScopeGranted('forms', grantedScopes),
      readinessState: isOrgConnected
        ? (isServiceScopeGranted('forms', grantedScopes) ? 'ready_for_phase' : 'missing_scopes')
        : 'not_connected',
    },
    {
      key: 'calendar',
      name: 'Lịch trình Google Calendar',
      tagline: 'Lịch hoạt động & Hạn chót công việc',
      description:
        'Đồng bộ lịch hoạt động Đơn vị, lịch họp Ban Chấp Hành và hạn chót hoàn thành nhiệm vụ vào Google Calendar của các thành viên liên quan.',
      phase: 'Sẵn sàng',
      targetFeatures: [
        'Đồng bộ lịch tổ chức sự kiện và buổi họp BCH định kỳ',
        'Nhắc nhở hạn chót hoàn thành công việc',
        'Gửi lời mời sự kiện trực tiếp tới email sinh viên',
      ],
      requiredScopes: ['https://www.googleapis.com/auth/calendar.events'],
      isScopeGranted: isServiceScopeGranted('calendar', grantedScopes),
      readinessState: isOrgConnected
        ? (isServiceScopeGranted('calendar', grantedScopes) ? 'ready_for_phase' : 'missing_scopes')
        : 'not_connected',
    },
  ];

  const getServiceIcon = (key: string) => {
    switch (key) {
      case 'drive':
        return <FolderSync className="h-5 w-5 text-emerald-600" />;
      case 'sheets':
        return <Table className="h-5 w-5 text-emerald-700" />;
      case 'forms':
        return <FileText className="h-5 w-5 text-purple-600" />;
      case 'calendar':
        return <CalendarDays className="h-5 w-5 text-blue-600" />;
      default:
        return <FolderSync className="h-5 w-5 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Trạng thái Sẵn sàng cho Dịch vụ Google Workspace
          </h3>
          <p className="text-xs text-slate-500">
            Nền tảng ủy quyền OAuth 2.0 & phạm vi quyền hạn (Scopes) cho các dịch vụ chuyên sâu
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Kiến trúc phân tầng bảo mật</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((svc) => (
          <Card key={svc.key} className="border-slate-200 shadow-2xs flex flex-col justify-between">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 border border-slate-200/80">
                    {getServiceIcon(svc.key)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-sm font-bold text-slate-900">{svc.name}</CardTitle>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {svc.phase}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs text-slate-500 font-medium">
                      {svc.tagline}
                    </CardDescription>
                  </div>
                </div>

                {svc.readinessState === 'ready_for_phase' ? (
                  <Badge variant="success" className="text-[11px] flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Đã sẵn sàng Scope
                  </Badge>
                ) : svc.readinessState === 'missing_scopes' ? (
                  <Badge variant="warning" className="text-[11px] flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Cần thêm Scope
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[11px] flex items-center gap-1 text-slate-500">
                    <Clock className="h-3 w-3" />
                    Chờ kết nối
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-3 pt-0 text-xs">
              <p className="text-slate-600 leading-relaxed text-xs">{svc.description}</p>

              <div className="rounded-lg bg-slate-50/70 border border-slate-200/80 p-3 space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-700">Tính năng trọng tâm:</span>
                <ul className="space-y-1 text-slate-600 text-[11px]">
                  {svc.targetFeatures.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <ArrowRight className="h-3 w-3 text-blue-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                <span>Scope yêu cầu:</span>
                <code className="font-mono text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                  {svc.requiredScopes[0].replace('https://www.googleapis.com/auth/', '')}
                </code>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
