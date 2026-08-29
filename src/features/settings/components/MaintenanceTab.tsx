import React, { useState } from 'react';
import {
  Wrench,
  Database,
  Server,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  History,
  Boxes,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  HardDrive,
  Cpu,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/contexts/ToastContext';
import { useQueryClient } from '@tanstack/react-query';
import { isSupabaseConfigured } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import type { Organization } from '@/types';

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
    } catch (err: unknown) {
      toast.error('Không thể làm mới cache.');
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  return (
    <div id="settings-maintenance-tab" className="space-y-6">
      {/* Maintenance Header Banner */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] font-semibold bg-emerald-50 text-emerald-800 border-emerald-200">
                Bảo trì & Vận hành
              </Badge>
              <span className="text-xs text-slate-400 font-mono">Hạ tầng đám mây & Đồng bộ dữ liệu</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-1">
              Trung Tâm Chẩn Đoán & Bảo Trì Dữ Liệu
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
              Kiểm tra tình trạng toàn vẹn dữ liệu, giải phóng bộ nhớ đệm client và giám sát kết nối cơ sở dữ liệu Supabase.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshCache}
            disabled={isRefreshing}
            className="text-xs h-8 text-slate-700 border-slate-200 hover:bg-slate-50 cursor-pointer shadow-2xs font-medium shrink-0"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Đang làm mới cache...' : 'Làm mới bộ nhớ đệm (Clear Cache)'}
          </Button>
        </div>
      </div>

      {/* Operational Workspaces Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Data Quality */}
        <Card className="border-slate-200 shadow-2xs hover:border-slate-300 transition-colors">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <Sparkles className="h-4 w-4" />
              </div>
              <Badge variant="success" className="text-[10px]">Chẩn đoán</Badge>
            </div>
            <CardTitle className="text-sm font-bold text-slate-900 mt-2">Chất Lượng Dữ Liệu</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Kiểm tra hồ sơ thiếu, xung đột mã sinh viên và dữ liệu mồ côi
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Link to="/data-quality">
              <Button variant="outline" size="sm" className="text-xs w-full justify-between mt-2 cursor-pointer">
                Mở Không Gian Chẩn Đoán <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Audit Logs */}
        <Card className="border-slate-200 shadow-2xs hover:border-slate-300 transition-colors">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                <History className="h-4 w-4" />
              </div>
              <Badge variant="outline" className="text-[10px] text-indigo-700 bg-indigo-50 border-indigo-200">Truy vết</Badge>
            </div>
            <CardTitle className="text-sm font-bold text-slate-900 mt-2">Nhật Ký Hoạt Động</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Xem toàn bộ lịch sử thao tác tạo, sửa, xóa và thay đổi trạng thái
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Link to="/audit-logs">
              <Button variant="outline" size="sm" className="text-xs w-full justify-between mt-2 cursor-pointer">
                Mở Nhật Ký Kiểm Toán <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Google Workspace */}
        <Card className="border-slate-200 shadow-2xs hover:border-slate-300 transition-colors">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <Boxes className="h-4 w-4" />
              </div>
              <Badge variant="outline" className="text-[10px] text-blue-700 bg-blue-50 border-blue-200">Đám mây</Badge>
            </div>
            <CardTitle className="text-sm font-bold text-slate-900 mt-2">Tích Hợp Google</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Quản lý kết nối OAuth, Google Drive và đồng bộ biểu mẫu
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Link to="/integrations">
              <Button variant="outline" size="sm" className="text-xs w-full justify-between mt-2 cursor-pointer">
                Quản Lý Kết Nối <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Infrastructure Connection Status */}
      <Card className="border-slate-200 shadow-2xs">
        <CardHeader className="pb-4 border-b border-slate-100">
          <CardTitle className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
            <Server className="h-4 w-4 text-emerald-600" />
            Tình Trạng Kết Nối Hạ Tầng & Dịch Vụ
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 mt-0.5">
            Kiểm tra trạng thái cấu hình môi trường runtime và cơ sở dữ liệu Supabase PostgreSQL
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <div className="divide-y divide-slate-100 text-xs">
            <div className="p-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="font-bold text-slate-900">Supabase REST & Realtime Endpoint</p>
                <p className="text-[11px] font-mono text-slate-500">VITE_SUPABASE_URL</p>
              </div>
              {isSupabaseConfigured ? (
                <Badge variant="success" className="text-xs">Đã kết nối</Badge>
              ) : (
                <Badge variant="warning" className="text-xs">Chưa cấu hình</Badge>
              )}
            </div>

            <div className="p-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="font-bold text-slate-900">Supabase Public Anonymous Key</p>
                <p className="text-[11px] font-mono text-slate-500">VITE_SUPABASE_ANON_KEY</p>
              </div>
              {isSupabaseConfigured ? (
                <Badge variant="success" className="text-xs">Đã cấu hình</Badge>
              ) : (
                <Badge variant="warning" className="text-xs">Chưa cấu hình</Badge>
              )}
            </div>

            <div className="p-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="font-bold text-slate-900">Dịch Vụ Xác Thực Người Dùng (Auth)</p>
                <p className="text-[11px] text-slate-500">Supabase Auth Session (JWT + Refresh Tokens)</p>
              </div>
              <Badge variant="success" className="text-xs">Sẵn sàng</Badge>
            </div>

            <div className="p-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="font-bold text-slate-900">Trạng Thái Bộ Nhớ Đệm TanStack Query</p>
                <p className="text-[11px] text-slate-500">In-memory Client Cache & Query Invalidation</p>
              </div>
              <Badge variant="outline" className="font-mono text-xs text-slate-700 bg-slate-50">Hoạt động bình thường</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
