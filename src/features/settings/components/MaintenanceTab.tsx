import React, { useState } from 'react';
import {
  Server,
  RefreshCw,
  Sparkles,
  History,
  ArrowRight,
} from '@/lib/icons';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/contexts/ToastContext';
import { useQueryClient } from '@tanstack/react-query';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import type { Organization } from '@/types';
import { DatabaseMonitorSection } from './DatabaseMonitorSection';

interface MaintenanceTabProps {
  organization: Organization | null;
}

export function MaintenanceTab({ organization }: MaintenanceTabProps) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshCache = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries();
      toast.success('Đã đồng bộ và làm mới toàn bộ bộ nhớ đệm (Cache) của hệ thống.');
    } catch {
      toast.error('Không thể làm mới cache.');
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  return (
    <div id="settings-maintenance-tab" className="space-y-6">
      {/* Maintenance Header Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[11px] font-semibold bg-blue-50 text-blue-700 border-blue-200">
                Bảo trì & Vận hành
              </Badge>
              <span className="text-xs text-slate-500 font-mono font-medium">Hạ tầng đám mây & Đồng bộ dữ liệu</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-1.5">
              Trung Tâm Chẩn Đoán & Bảo Trì Dữ Liệu
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Kiểm tra tình trạng toàn vẹn dữ liệu, giải phóng bộ nhớ đệm client và giám sát kết nối cơ sở dữ liệu Supabase.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshCache}
            disabled={isRefreshing}
            className="text-xs h-9 px-3 text-slate-700 border-slate-300 hover:bg-slate-50 hover:text-slate-900 cursor-pointer shadow-xs font-semibold shrink-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-2 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Đang làm mới cache...' : 'Làm mới bộ nhớ đệm (Clear Cache)'}
          </Button>
        </div>
      </div>

      {/* Operational Workspaces Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Data Quality */}
        <Card className="border-slate-200 shadow-sm bg-white hover:border-slate-300 transition-colors">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
                <Sparkles className="h-4 w-4" />
              </div>
              <Badge variant="success" className="text-[11px] font-medium">Chẩn đoán</Badge>
            </div>
            <CardTitle className="text-base font-bold text-slate-900 mt-2.5">Chất Lượng Dữ Liệu</CardTitle>
            <CardDescription className="text-xs sm:text-sm text-slate-600 mt-1">
              Kiểm tra hồ sơ thiếu, xung đột mã sinh viên và dữ liệu mồ côi
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Link to="/data-quality">
              <Button variant="outline" size="sm" className="text-xs w-full justify-between mt-2 cursor-pointer border-slate-300 hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-medium">
                Mở Không Gian Chẩn Đoán <ArrowRight className="h-3.5 w-3.5 ml-1 text-slate-500" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Audit Logs */}
        <Card className="border-slate-200 shadow-sm bg-white hover:border-slate-300 transition-colors">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
                <History className="h-4 w-4" />
              </div>
              <Badge variant="outline" className="text-[11px] font-medium text-blue-700 bg-blue-50 border-blue-200">Truy vết</Badge>
            </div>
            <CardTitle className="text-base font-bold text-slate-900 mt-2.5">Nhật Ký Hoạt Động</CardTitle>
            <CardDescription className="text-xs sm:text-sm text-slate-600 mt-1">
              Xem toàn bộ lịch sử thao tác tạo, sửa, xóa và thay đổi trạng thái
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Link to="/audit-logs">
              <Button variant="outline" size="sm" className="text-xs w-full justify-between mt-2 cursor-pointer border-slate-300 hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-medium">
                Mở Nhật Ký Kiểm Toán <ArrowRight className="h-3.5 w-3.5 ml-1 text-slate-500" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Database Realtime Row Counts & Monitoring - Antigravity High-Contrast Tech Console */}
      <DatabaseMonitorSection
        organizationId={organization?.id}
        organizationName={organization?.name}
      />

      {/* Infrastructure Connection Status */}
      <Card className="border-slate-200 shadow-sm bg-white">
        <CardHeader className="pb-4 border-b border-slate-200">
          <CardTitle className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
            <Server className="h-4 w-4 text-blue-600" />
            Tình Trạng Kết Nối Hạ Tầng & Dịch Vụ
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm text-slate-600 mt-1">
            Kiểm tra trạng thái cấu hình môi trường runtime và cơ sở dữ liệu Supabase PostgreSQL
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <div className="divide-y divide-slate-200 text-xs">
            <div className="p-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="font-bold text-slate-900 text-xs sm:text-sm">Supabase REST & Realtime Endpoint</p>
                <p className="text-xs font-mono text-slate-500 font-medium">VITE_SUPABASE_URL</p>
              </div>
              {isSupabaseConfigured ? (
                <Badge variant="success" className="text-xs font-semibold">Đã kết nối</Badge>
              ) : (
                <Badge variant="warning" className="text-xs font-semibold">Chưa cấu hình</Badge>
              )}
            </div>

            <div className="p-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="font-bold text-slate-900 text-xs sm:text-sm">Supabase Public Anonymous Key</p>
                <p className="text-xs font-mono text-slate-500 font-medium">VITE_SUPABASE_ANON_KEY</p>
              </div>
              {isSupabaseConfigured ? (
                <Badge variant="success" className="text-xs font-semibold">Đã cấu hình</Badge>
              ) : (
                <Badge variant="warning" className="text-xs font-semibold">Chưa cấu hình</Badge>
              )}
            </div>

            <div className="p-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="font-bold text-slate-900 text-xs sm:text-sm">Dịch Vụ Xác Thực Người Dùng (Auth)</p>
                <p className="text-xs text-slate-600">Supabase Auth Session (JWT + Refresh Tokens)</p>
              </div>
              <Badge variant="success" className="text-xs font-semibold">Sẵn sàng</Badge>
            </div>

            <div className="p-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="font-bold text-slate-900 text-xs sm:text-sm">Trạng Thái Bộ Nhớ Đệm TanStack Query</p>
                <p className="text-xs text-slate-600">In-memory Client Cache & Query Invalidation</p>
              </div>
              <Badge variant="outline" className="font-mono text-xs text-slate-700 bg-slate-100 border-slate-200 font-medium">
                Hoạt động bình thường
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
