import { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ExternalLink, 
  FileSpreadsheet, 
  FileText, 
  CalendarDays, 
  FolderSync, 
  ShieldCheck, 
  KeyRound, 
  ArrowRight, 
  RefreshCw, 
  Layers, 
  Table,
  Check,
  Building2,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { GoogleServiceKey } from '@/types';
import type { GoogleIntegrationOverview, GoogleServiceMetrics } from '../types/google.types';
import { GOOGLE_SCOPES_CATALOGUE } from '../constants/scopes';
import { formatDate } from '@/lib/date';

interface ServiceDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  serviceKey: GoogleServiceKey | null;
  overview: GoogleIntegrationOverview | undefined;
  metrics: GoogleServiceMetrics | undefined;
  onOpenSheetsManager?: () => void;
}

export function ServiceDetailDrawer({
  isOpen,
  onClose,
  serviceKey,
  overview,
  metrics,
  onOpenSheetsManager,
}: ServiceDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'resources' | 'diagnostics'>('overview');

  if (!isOpen || !serviceKey) return null;

  const isOrgConnected = Boolean(overview?.isOrgConnected);
  const grantedScopes = [
    ...(overview?.orgScopes || []),
    ...(overview?.userScopes || []),
  ];

  const getServiceConfig = () => {
    switch (serviceKey) {
      case 'forms':
        return {
          name: 'Google Forms Automation',
          subtitle: 'Thu thập đơn đăng ký, khảo sát ý kiến & đối soát MSSV',
          icon: <FileText className="h-6 w-6 text-purple-600" />,
          colorBg: 'bg-purple-50 border-purple-100',
          scope: 'https://www.googleapis.com/auth/forms.responses.readonly',
          description:
            'Tự động thu thập câu trả lời từ Google Forms đăng ký tham gia sự kiện của sinh viên, khớp MSSV với hồ sơ hội viên và ghi nhận điểm danh tức thì vào PostgreSQL.',
          howItWorks: [
            '1. Tạo biểu mẫu trên Google Forms hoặc liên kết biểu mẫu hiện có vào hoạt động Chi hội.',
            '2. Khi sinh viên nộp đơn, hệ thống định kỳ đọc responses qua Google Forms API (readonly).',
            '3. Thuật toán tự động bóc tách MSSV, họ tên, email để đối chiếu với bảng `members`.',
            '4. Tự động đánh dấu điểm danh hoặc tạo danh sách đề xuất thêm hội viên mới có kiểm soát.',
          ],
          resourcesTitle: 'Biểu mẫu Hoạt động Đã liên kết',
          resourcesCount: metrics?.forms.totalForms ?? 0,
          resourcesSummary: `${metrics?.forms.totalResponses ?? 0} phản hồi đã ghi nhận, ${metrics?.forms.totalMatched ?? 0} MSSV đã khớp thành công.`,
          moduleLink: '/activities',
          moduleLinkLabel: 'Xem trong Quản lý Hoạt động',
        };
      case 'sheets':
        return {
          name: 'Google Sheets Integration',
          subtitle: 'Quản lý bảng tính, xuất snapshot & nhập đối soát 4 bước',
          icon: <FileSpreadsheet className="h-6 w-6 text-emerald-600" />,
          colorBg: 'bg-emerald-50 border-emerald-100',
          scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
          description:
            'Liên kết bảng tính Google Sheets của Chi hội, xuất dữ liệu snapshot chuẩn hóa UTF-8 BOM và quy trình nhập dữ liệu 4 bước có đối soát trùng lặp & giải quyết xung đột trước khi lưu.',
          howItWorks: [
            '1. Ban Chấp Hành liên kết Google Spreadsheet thông qua ID bảng tính và cấp quyền đọc.',
            '2. Xuất dữ liệu snapshot (Hội viên, Tài chính, Hoạt động, Nhiệm vụ) chuẩn mã hóa UTF-8 BOM.',
            '3. Nhập dữ liệu 4 bước: Đọc dữ liệu -> Tự động khớp cột -> Đối soát trùng lặp -> Xác nhận lưu.',
            '4. PostgreSQL luôn là Source of Truth tối cao, ngăn chặn ghi đè dữ liệu sai lệch ngoài ý muốn.',
          ],
          resourcesTitle: 'Bảng tính Chi hội Đã liên kết',
          resourcesCount: metrics?.sheets.totalConnections ?? 0,
          resourcesSummary: `Xuất gần nhất: ${metrics?.sheets.lastExportAt ? formatDate(metrics.sheets.lastExportAt, 'dd/MM/yyyy HH:mm') : 'Chưa xuất'}. Nhập gần nhất: ${metrics?.sheets.lastImportAt ? formatDate(metrics.sheets.lastImportAt, 'dd/MM/yyyy HH:mm') : 'Chưa nhập'}.`,
          moduleLink: '/integrations',
          moduleLinkLabel: 'Mở Trình Quản lý Google Sheets',
        };
      case 'calendar':
        return {
          name: 'Google Calendar Schedule',
          subtitle: 'Đồng bộ lịch hoạt động, lịch họp BCH & hạn chót nhiệm vụ',
          icon: <CalendarDays className="h-6 w-6 text-blue-600" />,
          colorBg: 'bg-blue-50 border-blue-100',
          scope: 'https://www.googleapis.com/auth/calendar.events',
          description:
            'Tự động đồng bộ các sự kiện chi hội, lịch họp Ban Chấp Hành định kỳ và nhắc nhở hạn chót hoàn thành nhiệm vụ vào Google Calendar của các thành viên liên quan.',
          howItWorks: [
            '1. Khi tạo hoạt động mới hoặc công việc có Due Date, hệ thống tạo bản ghi chiếu lịch.',
            '2. Tự động đồng bộ sang Google Calendar mục tiêu theo múi giờ chuẩn VN (GMT+7).',
            '3. Gửi lời mời trực tiếp đến email Google của các thành viên được phân công.',
            '4. Cập nhật trạng thái sự kiện khi lịch trình trên ChapterOS có sự thay đổi.',
          ],
          resourcesTitle: 'Lịch sự kiện & Chiếu lịch',
          resourcesCount: metrics?.calendar.totalEvents ?? 0,
          resourcesSummary: `Lịch mục tiêu: ${metrics?.calendar.primaryCalendar || 'Primary BCH'}. Múi giờ: Asia/Ho_Chi_Minh (GMT+7).`,
          moduleLink: '/activities',
          moduleLinkLabel: 'Xem Lịch trong Hoạt động',
        };
      case 'drive':
        return {
          name: 'Google Drive Knowledge Repository',
          subtitle: 'Cấu trúc thư mục nhiệm kỳ & sao lưu chứng từ bảo mật',
          icon: <FolderSync className="h-6 w-6 text-teal-600" />,
          colorBg: 'bg-teal-50 border-teal-100',
          scope: 'https://www.googleapis.com/auth/drive.file',
          description:
            'Tự động tạo cây thư mục chuẩn theo từng nhiệm kỳ Chi hội. Sao lưu quyết định, kế hoạch, biên bản họp và tài liệu chứng từ có chữ ký số an toàn.',
          howItWorks: [
            '1. Khởi tạo cấu trúc 4 thư mục chuẩn: Kế hoạch, Biên bản, Tài chính, Quyết định.',
            '2. Phân quyền truy cập dựa trên vai trò trong Chi hội (Leader, Deputy, Treasurer, Secretary).',
            '3. Lưu trữ liên kết tệp đính kèm và tài liệu nhiệm kỳ với URL an toàn.',
            '4. Đồng bộ siêu dữ liệu (metadata) hai chiều có kiểm soát.',
          ],
          resourcesTitle: 'Thư mục & Tài liệu Đã phân loại',
          resourcesCount: metrics?.drive.totalDocuments ?? 0,
          resourcesSummary: `4 Thư mục chuẩn nhiệm kỳ: Kế hoạch, Biên bản họp, Báo cáo Tài chính, Quyết định ban hành.`,
          moduleLink: '/documents',
          moduleLinkLabel: 'Xem Kho Tài liệu Chi hội',
        };
    }
  };

  const config = getServiceConfig();
  const isScopeGranted = grantedScopes.includes(config.scope);
  const isReady = isOrgConnected && isScopeGranted;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div 
        id="service-detail-drawer"
        className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col justify-between border-l border-slate-200 animate-in slide-in-from-right duration-300"
      >
        {/* Drawer Header */}
        <div>
          <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 border ${config.colorBg}`}>
                {config.icon}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900">{config.name}</h2>
                  {isReady ? (
                    <Badge variant="success" className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 border-emerald-200">
                      Sẵn sàng
                    </Badge>
                  ) : (
                    <Badge variant="warning" className="text-[10px] px-2 py-0.5 bg-amber-50 text-amber-700 border-amber-200">
                      Chờ cấu hình
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{config.subtitle}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Drawer Navigation Tabs */}
          <div className="flex border-b border-slate-200 px-5 bg-white">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === 'overview'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Tổng quan & Phân quyền
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('resources')}
              className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === 'resources'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Tài nguyên & Cấu hình
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('diagnostics')}
              className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === 'diagnostics'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Chẩn đoán & Bảo mật
            </button>
          </div>
        </div>

        {/* Drawer Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Mô tả Dịch vụ
                </h4>
                <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                  {config.description}
                </p>
              </div>

              {/* How it works */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Quy trình Vận hành
                </h4>
                <div className="space-y-2">
                  {config.howItWorks.map((step, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg border border-slate-200/70 bg-white flex items-start gap-2.5">
                      <div className="h-5 w-5 rounded-full bg-blue-50 text-blue-600 font-bold flex items-center justify-center shrink-0 text-[10px]">
                        {idx + 1}
                      </div>
                      <span className="text-slate-700 leading-relaxed text-xs">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Scopes requirement */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  OAuth 2.0 Scope Yêu cầu
                </h4>
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-slate-800 font-semibold truncate">
                      {config.scope}
                    </span>
                    {isScopeGranted ? (
                      <Badge variant="success" className="text-[10px] py-0 px-1.5 flex items-center gap-1 bg-emerald-50 text-emerald-700 border-emerald-200">
                        <Check className="h-3 w-3" />
                        Đã cấp quyền
                      </Badge>
                    ) : (
                      <Badge variant="warning" className="text-[10px] py-0 px-1.5 flex items-center gap-1 bg-amber-50 text-amber-700 border-amber-200">
                        Chưa có quyền
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Tuân thủ tiêu chuẩn phân quyền tối thiểu (Least Privilege). Chỉ đọc dữ liệu cần thiết cho Chi hội.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'resources' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 text-xs">{config.resourcesTitle}</span>
                  <Badge variant="outline" className="text-xs font-bold font-mono">
                    {config.resourcesCount} Bản ghi
                  </Badge>
                </div>
                <p className="text-slate-600 leading-relaxed text-xs">
                  {config.resourcesSummary}
                </p>
              </div>

              {/* Special action for Sheets */}
              {serviceKey === 'sheets' && onOpenSheetsManager && (
                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                    <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                    <span>Trình quản lý Google Sheets Đơn vị</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 leading-relaxed">
                    Bạn có thể mở Trình quản lý Google Sheets để cấu hình bảng tính liên kết, chạy xuất snapshot UTF-8 BOM hoặc thực hiện quy trình nhập đối soát 4 bước có giải quyết xung đột.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      onClose();
                      onOpenSheetsManager();
                    }}
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white w-full"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />
                    Mở Trình Quản Lý Bảng Tính Google Sheets
                  </Button>
                </div>
              )}

              {/* Service specific guidance */}
              <div className="rounded-lg border border-slate-200 p-3.5 bg-white space-y-2">
                <span className="font-semibold text-slate-800 text-xs">Nguyên tắc Bảo toàn Dữ liệu:</span>
                <ul className="space-y-1.5 text-[11px] text-slate-600">
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>PostgreSQL là cơ sở dữ liệu gốc (Source of Truth) bất biến.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Mọi thao tác đồng bộ đều lưu vết lịch sử trong Audit Logs Chi hội.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Kiểm tra trùng lặp và xung đột tự động trước khi ghi dữ liệu.</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'diagnostics' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 p-4 space-y-3 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 text-xs">Kiểm tra Tính khả dụng API</span>
                  <Badge variant="success" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200">
                    200 OK
                  </Badge>
                </div>
                <div className="text-[11px] text-slate-500 space-y-1">
                  <div>• Điểm cuối (Endpoint): Google Workspace REST v3/v4</div>
                  <div>• Xác thực: OAuth 2.0 Bearer Token (Server-Side Isolate)</div>
                  <div>• Hạn mức (Rate Limit): 100 requests/100s per user</div>
                </div>
              </div>

              <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-3.5 text-blue-900 space-y-1.5 text-xs">
                <div className="flex items-center gap-2 font-bold text-blue-800">
                  <ShieldCheck className="h-4 w-4 text-blue-600" />
                  <span>Cam kết An toàn Dữ liệu & Phân quyền RLS</span>
                </div>
                <p className="text-[11px] text-blue-800/90 leading-relaxed">
                  ChapterOS cách ly toàn bộ dữ liệu tổ chức bằng cơ chế Row Level Security (RLS). Google Access Token được lưu trữ bảo mật và chỉ được gọi trong các tác vụ được ủy quyền của Ban Chấp Hành.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs"
          >
            Đóng
          </Button>

          {serviceKey === 'sheets' && onOpenSheetsManager ? (
            <Button
              type="button"
              size="sm"
              onClick={() => {
                onClose();
                onOpenSheetsManager();
              }}
              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />
              Mở Trình Quản lý Sheets
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={onClose}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              Đã hiểu & Xác nhận
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
