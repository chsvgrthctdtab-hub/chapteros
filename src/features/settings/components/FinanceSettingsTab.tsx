import React, { useState, useEffect, type FormEvent } from 'react';
import {
  Wallet,
  ShieldAlert,
  Coins,
  Receipt,
  Scale,
  Save,
  Loader2,
  ArrowRight,
  Shield,
  HelpCircle,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUpdateOrganizationMutation } from '@/features/chapters/queries/organization.queries';
import { Link } from 'react-router-dom';
import type { Organization } from '@/types';

interface FinanceSettingsTabProps {
  organization: Organization | null;
  canManage: boolean;
}

export function FinanceSettingsTab({
  organization,
  canManage,
}: FinanceSettingsTabProps) {
  const toast = useToast();
  const { user } = useAuth();
  const updateOrgMutation = useUpdateOrganizationMutation();

  const [threshold, setThreshold] = useState<string>(
    organization?.financeApprovalThreshold ? String(organization.financeApprovalThreshold) : '2000000'
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (organization?.financeApprovalThreshold !== undefined) {
      setThreshold(organization.financeApprovalThreshold ? String(organization.financeApprovalThreshold) : '2000000');
    }
  }, [organization?.financeApprovalThreshold]);

  const handleSaveThreshold = async (e: FormEvent) => {
    e.preventDefault();
    if (!organization) return;

    const numValue = Number(threshold.replace(/[^0-9]/g, ''));
    if (isNaN(numValue) || numValue < 0) {
      toast.error('Hạn mức phê duyệt không hợp lệ. Vui lòng nhập số tiền hợp lệ.');
      return;
    }

    setIsSaving(true);
    try {
      await updateOrgMutation.mutateAsync({
        id: organization.id,
        payload: {
          finance_approval_threshold: numValue,
        },
        updaterUserId: user?.id,
      });

      toast.success(`Đã cập nhật hạn mức phê duyệt tài chính thành công: ${numValue.toLocaleString('vi-VN')} ₫`);
    } catch (err: unknown) {
      toast.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const formattedDisplay = () => {
    const num = Number(threshold.replace(/[^0-9]/g, ''));
    if (isNaN(num) || num === 0) return '0 ₫';
    return `${num.toLocaleString('vi-VN')} ₫`;
  };

  return (
    <div id="settings-finance-tab" className="space-y-6">
      {/* Finance Governance Banner */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] font-semibold bg-amber-50 text-amber-800 border-amber-200">
                Quy chế Quản lý Quỹ
              </Badge>
              <span className="text-xs text-slate-400 font-mono">Kiểm soát thu chi hai lớp</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-1">
              Cấu hình Quản trị Tài chính & Hạn mức Phê duyệt
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
              Thiết lập quy trình kiểm soát chi tiêu, hạn mức giao dịch tự động và nguyên tắc khóa sổ định kỳ theo nhiệm kỳ.
            </p>
          </div>

          <Link to="/finance">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8 text-slate-700 border-slate-200 hover:bg-slate-50 cursor-pointer shadow-2xs font-medium shrink-0"
            >
              Mở Sổ Quỹ Chi Hội
              <ArrowRight className="h-3.5 w-3.5 ml-1.5 text-slate-500" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Approval Threshold Card */}
      <Card className="border-slate-200 shadow-2xs">
        <CardHeader className="pb-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-amber-600" />
                Hạn Mức Phê Duyệt Chi Tiêu (Approval Threshold)
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Các khoản chi vượt hạn mức này bắt buộc phải có phê duyệt của Chi hội trưởng hoặc Quản trị viên
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-[11px] font-mono text-amber-700 bg-amber-50 border-amber-200">
              Hiện tại: {formattedDisplay()}
            </Badge>
          </div>
        </CardHeader>

        <form onSubmit={handleSaveThreshold}>
          <CardContent className="pt-5 space-y-4">
            {!canManage && (
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2.5">
                <Shield className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Chỉ <strong>Quản trị viên (Admin)</strong> hoặc <strong>Chi hội trưởng (Leader)</strong> mới có quyền điều chỉnh hạn mức phê duyệt tài chính.
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Coins className="h-3.5 w-3.5 text-slate-400" />
                  Số tiền hạn mức tối đa tự động (VNĐ) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value.replace(/[^0-9]/g, ''))}
                    disabled={!canManage || isSaving}
                    placeholder="2000000"
                    className="text-xs font-mono pr-10 font-bold text-slate-900"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    ₫
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Quy đổi hiển thị: {formattedDisplay()}</span>
                  <span>Mặc định khuyến nghị: 2.000.000 ₫</span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5 space-y-1.5 text-xs">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <HelpCircle className="h-3.5 w-3.5 text-blue-600" />
                  Nguyên tắc kiểm soát chi
                </div>
                <ul className="space-y-1 text-[11px] text-slate-600 list-disc list-inside">
                  <li>Khoản chi ≤ {formattedDisplay()}: Thủ quỹ có thể ghi nhận và hạch toán trực tiếp.</li>
                  <li>Khoản chi &gt; {formattedDisplay()}: Hệ thống tự động chuyển trạng thái Chờ phê duyệt (Pending Approval).</li>
                  <li>Mọi giao dịch sau khi duyệt đều lưu vết người duyệt (Approved By) và thời điểm duyệt.</li>
                </ul>
              </div>
            </div>
          </CardContent>

          {canManage && (
            <CardFooter className="bg-slate-50/70 border-t border-slate-100 flex items-center justify-end py-3 px-5">
              <Button
                type="submit"
                size="sm"
                disabled={isSaving || updateOrgMutation.isPending}
                className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-2xs font-medium"
              >
                {isSaving || updateOrgMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                )}
                Lưu hạn mức chi tiêu
              </Button>
            </CardFooter>
          )}
        </form>
      </Card>

      {/* Accounting Standards & Period Closing Info */}
      <Card className="border-slate-200 shadow-2xs">
        <CardHeader className="pb-4 border-b border-slate-100">
          <CardTitle className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
            <Scale className="h-4 w-4 text-emerald-600" />
            Chuẩn Mực Kế Toán & Quy Định Khóa Sổ Kỳ
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 mt-0.5">
            Các thiết lập hạch toán cơ bản được áp dụng thống nhất cho toàn bộ hệ thống quỹ Chi hội
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <div className="divide-y divide-slate-100 text-xs">
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">Đơn vị tiền tệ chính thức</p>
                <p className="text-[11px] text-slate-500">Đồng Việt Nam (VND - ₫)</p>
              </div>
              <Badge variant="outline" className="font-mono text-xs bg-slate-50">VND (₫)</Badge>
            </div>

            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">Phương pháp Khóa sổ Kỳ (Period Closing)</p>
                <p className="text-[11px] text-slate-500">Đóng sổ định kỳ theo Tháng / Quý và lưu ảnh chụp số dư (Snapshot)</p>
              </div>
              <Badge variant="success" className="text-xs">Đang áp dụng</Badge>
            </div>

            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">Tính bất biến sau Khóa sổ</p>
                <p className="text-[11px] text-slate-500">Không cho phép tạo/sửa/xóa giao dịch thuộc kỳ đã đóng trừ khi mở lại sổ</p>
              </div>
              <Badge variant="outline" className="font-mono text-xs text-slate-700 bg-slate-50">Bảo mật RLS</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
