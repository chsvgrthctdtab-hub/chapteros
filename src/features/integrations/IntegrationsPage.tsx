import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  RefreshCw, 
  CheckCircle2, 
  FolderArchive,
  FileSpreadsheet,
  FileText,
  CalendarDays,
  ExternalLink,
  ShieldAlert,
  ArrowLeft,
  Plus,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { GoogleSheetsManagerCard } from '@/integrations/google/sheets/components/GoogleSheetsManagerCard';
import { ConnectGoogleDialog } from './components/ConnectGoogleDialog';
import { useOrgGoogleConnection } from './queries/google.queries';
import { useConnectGoogleMutation } from './mutations/google.mutations';
import type { ConnectGooglePayload } from './types/google.types';

export function IntegrationsPage() {
  const { user, activeOrganization, activeRole } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const orgId = activeOrganization?.id || null;

  // Dialog State
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);

  // Service Account Status
  const [, setSaStatus] = useState<{ configured: boolean; email: string | null } | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);

  // Queries & Mutations
  const { data: orgConn, refetch: refetchOrgConn } = useOrgGoogleConnection(orgId);
  const connectMutation = useConnectGoogleMutation();

  const isAdmin = activeRole === 'admin' || activeRole === 'leader';

  const fetchServiceAccountStatus = () => {
    setIsLoadingStatus(true);
    fetch('/api/drive/service-account/status')
      .then((res) => res.json())
      .then((data) => setSaStatus(data))
      .catch(() => setSaStatus({ configured: false, email: null }))
      .finally(() => setIsLoadingStatus(false));
  };

  useEffect(() => {
    fetchServiceAccountStatus();
  }, []);

  const handleConnect = async (payload: ConnectGooglePayload) => {
    try {
      await connectMutation.mutateAsync(payload);
      toast.success('Đã kết nối và xác thực tài khoản Google thành công!');
      setConnectDialogOpen(false);
      await refetchOrgConn();
    } catch (err: unknown) {
      toast.error(err);
    }
  };

  const handleRefreshAll = () => {
    fetchServiceAccountStatus();
    refetchOrgConn();
    toast.success('Đã làm mới trạng thái kết nối Google.');
  };

  // Permission guard
  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-4">
        <div className="h-16 w-16 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mx-auto border border-amber-200/60 shadow-xs">
          <ShieldAlert strokeWidth={1.5} className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-ink-navy tracking-tight">
            Khu vực Quản trị Google Workspace Đơn vị
          </h2>
          <p className="text-xs text-mist-gray leading-relaxed max-w-md mx-auto">
            Hệ thống tích hợp Google Workspace được kết nối với tài khoản dùng chung của Đơn vị. Quyền truy cập và thiết lập liên kết này dành riêng cho Quản trị viên của Đơn vị.
          </p>
        </div>
        <div className="pt-2">
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            size="sm"
            className="text-xs h-8 px-4 font-medium cursor-pointer rounded-xl border-hairline text-slate-gray hover:bg-cloud"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
            Quay lại Tổng quan
          </Button>
        </div>
      </div>
    );
  }

  const isGoogleConnected = Boolean(orgConn && orgConn.status === 'connected');

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-hairline rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-white border border-hairline shadow-xs flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-ink-navy tracking-tight">
                Tích hợp Google Workspace
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-[#e6f0ff] text-signal-blue border border-[#d4e4fa]">
                {activeOrganization?.code || 'CHG'}
              </span>
            </div>
            <p className="text-xs text-mist-gray mt-1 max-w-2xl">
              Quản lý tài khoản Google của Đơn vị, kết nối đồng bộ trực tiếp với Drive, Sheets, Forms và Calendar.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            disabled={isLoadingStatus}
            className="text-xs h-8.5 px-3.5 font-semibold rounded-xl border-hairline text-slate-gray cursor-pointer shadow-xs hover:bg-cloud"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoadingStatus ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>

          <Button
            size="sm"
            onClick={() => setConnectDialogOpen(true)}
            className="text-xs h-8.5 px-4 bg-signal-blue hover:bg-[#005be0] text-white font-semibold rounded-xl cursor-pointer shadow-xs gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{isGoogleConnected ? 'Đổi tài khoản Google' : 'Kết nối tài khoản Google'}</span>
          </Button>
        </div>
      </div>

      {/* 2. Google OAuth / Drive Status Hero Card */}
      {isGoogleConnected ? (
        <div className="p-5 sm:p-6 bg-white border border-hairline rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center shrink-0">
              <CheckCircle2 strokeWidth={1.75} className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-ink-navy">
                  Google Workspace Đơn vị đã kích hoạt
                </h3>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {orgConn?.googleEmail}
                </span>
              </div>
              <p className="text-xs text-mist-gray mt-0.5">
                Mọi tệp tải lên và bảng tính Google Sheets sẽ tự động đồng bộ vào tài khoản này.
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setConnectDialogOpen(true)}
            className="text-xs h-8.5 px-3.5 rounded-xl border-hairline text-slate-gray hover:bg-cloud cursor-pointer self-start md:self-auto font-medium shadow-xs"
          >
            Cấp quyền lại / Cập nhật
          </Button>
        </div>
      ) : (
        /* Prompt to connect Google */
        <div className="p-5 sm:p-7 bg-ink-navy text-white rounded-2xl shadow-xs border border-hairline/20 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-signal-blue/10 text-signal-blue border border-signal-blue/20 flex items-center justify-center shrink-0">
                <Sparkles strokeWidth={1.5} className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Ủy quyền Google Drive & Google Workspace
                  </h3>
                  <Badge className="text-[11px] bg-amber-500/20 text-amber-300 border-amber-400/40 font-semibold px-2.5 py-0.5">
                    Chưa kết nối Gmail
                  </Badge>
                </div>
                <p className="text-xs text-mist-gray mt-1 max-w-2xl leading-relaxed">
                  Nhấn nút bên cạnh để đăng nhập tài khoản Google (Gmail) của bạn. Hệ thống sẽ tự động tải tệp tin và tạo bảng tính thẳng vào Google Drive của bạn 100%!
                </p>
              </div>
            </div>

            <Button
              onClick={() => setConnectDialogOpen(true)}
              className="text-xs h-9 px-4 bg-signal-blue hover:bg-[#005be0] text-white font-bold rounded-xl cursor-pointer shadow-xs gap-2 shrink-0"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#ffffff"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#ffffff"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#ffffff"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#ffffff"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Kết nối Google 1-Click</span>
            </Button>
          </div>
        </div>
      )}

      {/* 3. 4 Functional Google Workspace Service Cards (Direct & Actionable) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-mist-gray">
            Dịch vụ Google Workspace của Đơn vị
          </h3>
          <span className="text-[11px] text-mist-gray">
            Truy cập nhanh hoặc mở trực tiếp trên Google
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Google Drive */}
          <div className="p-5 rounded-2xl bg-white border border-hairline shadow-xs hover:shadow-xs hover:border-mist-gray transition-all flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/80 shrink-0">
                  <FolderArchive strokeWidth={1.5} className="w-5 h-5" />
                </div>
                <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200/80 font-medium">
                  Google Drive
                </Badge>
              </div>

              <div>
                <h4 className="text-sm font-bold text-ink-navy">Google Drive</h4>
                <p className="text-xs text-mist-gray mt-1 leading-relaxed">
                  Lưu trữ văn bản, biểu mẫu, kế hoạch hoạt động và đồng bộ tệp tin của Đơn vị.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-hairline flex flex-col gap-2">
              <Button
                size="sm"
                onClick={() => navigate('/documents')}
                className="w-full h-8 text-xs font-semibold rounded-xl bg-signal-blue hover:bg-[#005be0] text-white cursor-pointer shadow-xs"
              >
                Mở Kho Văn bản Đơn vị
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://drive.google.com', '_blank', 'noopener,noreferrer')}
                className="w-full h-8 text-xs font-semibold rounded-xl border-hairline text-slate-gray hover:bg-cloud cursor-pointer gap-1.5 shadow-xs"
              >
                <span>Mở Google Drive</span>
                <ExternalLink className="w-3 h-3 text-mist-gray" />
              </Button>
            </div>
          </div>

          {/* Google Sheets */}
          <div className="p-5 rounded-2xl bg-white border border-hairline shadow-xs hover:shadow-xs hover:border-mist-gray transition-all flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-[#e6f0ff] text-signal-blue flex items-center justify-center border border-[#d4e4fa] shrink-0">
                  <FileSpreadsheet strokeWidth={1.5} className="w-5 h-5" />
                </div>
                <Badge variant="outline" className="text-[10px] bg-[#e6f0ff] text-signal-blue border-[#d4e4fa] font-medium">
                  Google Sheets
                </Badge>
              </div>

              <div>
                <h4 className="text-sm font-bold text-ink-navy">Google Sheets</h4>
                <p className="text-xs text-mist-gray mt-1 leading-relaxed">
                  Xuất dữ liệu hội viên, sổ thu chi tài chính và nhập danh sách từ bảng tính.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-hairline flex flex-col gap-2">
              <Button
                size="sm"
                onClick={() => {
                  const el = document.getElementById('google-sheets-manager-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full h-8 text-xs font-semibold rounded-xl bg-signal-blue hover:bg-[#005be0] text-white cursor-pointer shadow-xs"
              >
                Quản lý Bảng tính Đơn vị
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://sheets.google.com', '_blank', 'noopener,noreferrer')}
                className="w-full h-8 text-xs font-semibold rounded-xl border-hairline text-slate-gray hover:bg-cloud cursor-pointer gap-1.5 shadow-xs"
              >
                <span>Mở Google Sheets</span>
                <ExternalLink className="w-3 h-3 text-mist-gray" />
              </Button>
            </div>
          </div>

          {/* Google Forms */}
          <div className="p-5 rounded-2xl bg-white border border-hairline shadow-xs hover:shadow-xs hover:border-mist-gray transition-all flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-[#e6f0ff] text-signal-blue flex items-center justify-center border border-[#d4e4fa] shrink-0">
                  <FileText strokeWidth={1.5} className="w-5 h-5" />
                </div>
                <Badge variant="outline" className="text-[10px] bg-[#e6f0ff] text-signal-blue border-[#d4e4fa] font-medium">
                  Google Forms
                </Badge>
              </div>

              <div>
                <h4 className="text-sm font-bold text-ink-navy">Google Forms</h4>
                <p className="text-xs text-mist-gray mt-1 leading-relaxed">
                  Tạo biểu mẫu đăng ký hoạt động, điểm danh sinh viên và khảo sát ý kiến.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-hairline flex flex-col gap-2">
              <Button
                size="sm"
                onClick={() => window.open('https://docs.google.com/forms/create', '_blank', 'noopener,noreferrer')}
                className="w-full h-8 text-xs font-semibold rounded-xl bg-signal-blue hover:bg-[#005be0] text-white cursor-pointer shadow-xs"
              >
                + Tạo biểu mẫu mới
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://forms.google.com', '_blank', 'noopener,noreferrer')}
                className="w-full h-8 text-xs font-semibold rounded-xl border-hairline text-slate-gray hover:bg-cloud cursor-pointer gap-1.5 shadow-xs"
              >
                <span>Mở Google Forms</span>
                <ExternalLink className="w-3 h-3 text-mist-gray" />
              </Button>
            </div>
          </div>

          {/* Google Calendar */}
          <div className="p-5 rounded-2xl bg-white border border-hairline shadow-xs hover:shadow-xs hover:border-mist-gray transition-all flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-[#e6f0ff] text-signal-blue flex items-center justify-center border border-[#d4e4fa] shrink-0">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <Badge variant="outline" className="text-[10px] bg-[#e6f0ff] text-signal-blue border-[#d4e4fa] font-medium">
                  Google Calendar
                </Badge>
              </div>

              <div>
                <h4 className="text-sm font-bold text-ink-navy">Google Calendar</h4>
                <p className="text-xs text-mist-gray mt-1 leading-relaxed">
                  Theo dõi lịch trình chiến dịch, sự kiện và hạn chót hoàn thành nhiệm vụ.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-hairline flex flex-col gap-2">
              <Button
                size="sm"
                onClick={() => window.open('https://calendar.google.com/calendar/r/eventedit', '_blank', 'noopener,noreferrer')}
                className="w-full h-8 text-xs font-semibold rounded-xl bg-signal-blue hover:bg-[#005be0] text-white cursor-pointer shadow-xs"
              >
                + Lên lịch sự kiện mới
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('https://calendar.google.com', '_blank', 'noopener,noreferrer')}
                className="w-full h-8 text-xs font-semibold rounded-xl border-hairline text-slate-gray hover:bg-cloud cursor-pointer gap-1.5 shadow-xs"
              >
                <span>Mở Google Calendar</span>
                <ExternalLink className="w-3 h-3 text-mist-gray" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Google Sheets Live Operations Section */}
      <div id="google-sheets-manager-section" className="space-y-3">
        <GoogleSheetsManagerCard />
      </div>

      {/* Connect Google Dialog with 1-Click GIS OAuth Popup */}
      <ConnectGoogleDialog
        isOpen={connectDialogOpen}
        onClose={() => setConnectDialogOpen(false)}
        organizationId={activeOrganization?.id}
        defaultEmail={user?.email || ''}
        defaultName={activeOrganization?.name || 'Ban Chấp Hành Đơn vị'}
        onConnect={handleConnect}
        isLoading={connectMutation.isPending}
      />
    </div>
  );
}

export default IntegrationsPage;
