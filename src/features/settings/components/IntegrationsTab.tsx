import React from 'react';
import {
  Boxes,
  ArrowRight,
  HardDrive,
  FileSpreadsheet,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Link2,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useGoogleIntegrationOverview } from '@/features/integrations/queries/google.queries';
import { Link } from 'react-router-dom';
import type { Organization } from '@/types';

interface IntegrationsTabProps {
  organization: Organization | null;
}

export function IntegrationsTab({ organization }: IntegrationsTabProps) {
  const { user } = useAuth();
  const { data: googleOverview, isLoading } = useGoogleIntegrationOverview(
    organization?.id || null,
    user?.id || null
  );

  return (
    <div id="settings-integrations-tab" className="space-y-6">
      {/* Integrations Header Banner */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] font-semibold bg-blue-50 text-blue-800 border-blue-200">
                Google Cloud Platform
              </Badge>
              <span className="text-xs text-slate-400 font-mono">OAuth 2.0 Client & Service API</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-1">
              Tích hợp Google Workspace & Dịch vụ Đám mây
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
              Đồng bộ hóa tài liệu biểu mẫu, bảng tính thu chi và lưu trữ đám mây của Chi hội trực tiếp lên Google Drive.
            </p>
          </div>

          <Link to="/integrations">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8 text-slate-700 border-slate-200 hover:bg-slate-50 cursor-pointer shadow-2xs font-medium shrink-0"
            >
              Mở Trung tâm Tích hợp
              <ArrowRight className="h-3.5 w-3.5 ml-1.5 text-slate-500" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Account Connection Status Card */}
      <Card className="border-slate-200 shadow-2xs">
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <HardDrive className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">Google Workspace Đơn vị</CardTitle>
                <CardDescription className="text-[11px] text-slate-500">Tài khoản lưu trữ dùng chung</CardDescription>
              </div>
            </div>
            {googleOverview?.isOrgConnected ? (
              <Badge variant="success" className="text-[10px] px-2 py-0.5">
                Đã kết nối
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-[10px] px-2 py-0.5 text-slate-500">
                Chưa kết nối
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-1">
            <p className="text-[11px] text-slate-500 font-medium">Tài khoản Google liên kết:</p>
            <p className="font-mono text-xs font-semibold text-slate-800 break-all">
              {googleOverview?.orgConnection?.googleEmail || 'Chưa thiết lập tài khoản tổ chức'}
            </p>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Dùng để đồng bộ thư mục Drive gốc của Đơn vị, tự động xuất báo cáo nhiệm kỳ và biểu mẫu điểm danh.
          </p>
        </CardContent>
      </Card>

      {/* Available Google Services */}
      <Card className="border-slate-200 shadow-2xs">
        <CardHeader className="pb-4 border-b border-slate-100">
          <CardTitle className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
            <Boxes className="h-4 w-4 text-blue-600" />
            Các Dịch Vụ Google Đang Hoạt Động
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 mt-0.5">
            Phạm vi quyền hạn (OAuth Scopes) và dịch vụ đã tích hợp với ChapterOS
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <div className="divide-y divide-slate-100 text-xs">
            <div className="p-4 flex items-center justify-between hover:bg-slate-50/50">
              <div className="flex items-center gap-3">
                <HardDrive className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="font-bold text-slate-900">Google Drive API</p>
                  <p className="text-[11px] text-slate-500">Lưu trữ văn bản, biểu mẫu, hóa đơn chứng từ và cây thư mục</p>
                </div>
              </div>
              <Badge variant="outline" className="font-mono text-[11px] text-emerald-700 bg-emerald-50 border-emerald-200">
                drive.file
              </Badge>
            </div>

            <div className="p-4 flex items-center justify-between hover:bg-slate-50/50">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="font-bold text-slate-900">Google Sheets API</p>
                  <p className="text-[11px] text-slate-500">Đồng bộ danh sách điểm danh hội viên và xuất sổ quỹ tài chính</p>
                </div>
              </div>
              <Badge variant="outline" className="font-mono text-[11px] text-emerald-700 bg-emerald-50 border-emerald-200">
                spreadsheets
              </Badge>
            </div>

            <div className="p-4 flex items-center justify-between hover:bg-slate-50/50">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-bold text-slate-900">Google Calendar & Forms</p>
                  <p className="text-[11px] text-slate-500">Lịch hoạt động phong trào và biểu mẫu khảo sát trực tuyến</p>
                </div>
              </div>
              <Badge variant="outline" className="font-mono text-[11px] text-blue-700 bg-blue-50 border-blue-200">
                forms / events
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
