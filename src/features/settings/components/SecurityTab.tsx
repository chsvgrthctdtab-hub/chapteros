import React from 'react';
import {
  ShieldCheck,
  Key,
  Database,
  Lock,
  History,
  ArrowRight,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import {
  ROLES,
  isOrgAdmin,
  isOrgBoard,
  canManageFinance,
  canApproveFinance,
  canCloseFinancePeriod,
  canManageAttendance,
} from '@/types/roles';
import { Link } from 'react-router-dom';
import type { Organization } from '@/types';

interface SecurityTabProps {
  organization: Organization | null;
}

export function SecurityTab({ organization: _organization }: SecurityTabProps) {
  const { activeRole } = useAuth();
  const roleInfo = activeRole ? ROLES[activeRole] : null;

  const permissionsList = [
    {
      label: 'Quản trị Chi hội & Phân quyền thành viên',
      hasPermission: isOrgAdmin(activeRole),
      desc: 'Cập nhật danh tính Chi hội, phân quyền vai trò cho thành viên khác.',
    },
    {
      label: 'Phê duyệt giao dịch chi tiêu (Approval)',
      hasPermission: canApproveFinance(activeRole),
      desc: 'Phê duyệt các giao dịch chi tiêu vượt hạn mức tài chính.',
    },
    {
      label: 'Khóa sổ kỳ tài chính & Lưu ảnh chụp (Closing)',
      hasPermission: canCloseFinancePeriod(activeRole),
      desc: 'Thực hiện đóng sổ tháng/quý và lưu trữ snapshot số dư.',
    },
    {
      label: 'Ghi nhận thu chi & Lập phiếu giao dịch',
      hasPermission: canManageFinance(activeRole),
      desc: 'Tạo và cập nhật các khoản thu chi, sổ quỹ và hóa đơn chứng từ.',
    },
    {
      label: 'Tổ chức hoạt động & Quản lý điểm danh',
      hasPermission: canManageAttendance(activeRole),
      desc: 'Điểm danh hội viên, tạo chương trình sự kiện và phân công nhiệm vụ.',
    },
    {
      label: 'Soạn thảo & Quản lý văn bản nội bộ',
      hasPermission: isOrgBoard(activeRole),
      desc: 'Truy cập tài liệu nội bộ và văn bản Ban Chấp Hành.',
    },
  ];

  return (
    <div id="settings-security-tab" className="space-y-6">
      {/* Security Overview Banner */}
      <div className="rounded-2xl border border-hairline bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] font-semibold bg-[#e6f0ff] text-signal-blue border-[#d4e4fa]">
                Bảo mật Đa tầng
              </Badge>
              <span className="text-xs text-mist-gray font-mono">Row Level Security & RBAC</span>
            </div>
            <h3 className="text-lg font-bold text-ink-navy mt-1">
              Trung Tâm An Toàn Dữ Liệu & Quyền Hạn
            </h3>
            <p className="text-xs text-mist-gray mt-0.5 max-w-2xl">
              Kiểm tra quyền hạn thực thi của tài khoản, chính sách bảo mật cấp hàng (RLS) và nhật ký kiểm toán hệ thống.
            </p>
          </div>

          <Link to="/audit-logs">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8 text-slate-gray border-hairline hover:bg-cloud cursor-pointer shadow-xs font-medium shrink-0"
            >
              Xem Nhật Ký Hoạt Động (Audit Logs)
              <ArrowRight className="h-3.5 w-3.5 ml-1.5 text-mist-gray" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Current User Permissions Checklist */}
      <Card className="border-hairline shadow-xs bg-white">
        <CardHeader className="pb-4 border-b border-hairline">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-signal-blue" />
              <div>
                <CardTitle className="text-sm sm:text-base font-bold text-ink-navy">
                  Quyền Hạn Thực Thi Của Bạn
                </CardTitle>
                <CardDescription className="text-xs text-mist-gray">
                  Phạm vi thao tác được cấp bởi vai trò:{' '}
                  <strong className="text-slate-gray">{roleInfo?.label || 'Chưa phân quyền'}</strong>
                </CardDescription>
              </div>
            </div>
            {roleInfo && (
              <Badge
                variant="outline"
                className={`text-xs font-semibold border ${roleInfo.colorClasses.bg} ${roleInfo.colorClasses.text} ${roleInfo.colorClasses.border}`}
              >
                {roleInfo.label}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="divide-y divide-hairline text-xs">
            {permissionsList.map((perm, idx) => (
              <div key={idx} className="p-4 flex items-center justify-between gap-3 hover:bg-cloud/50">
                <div className="flex items-start gap-3">
                  {perm.hasPermission ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-4 w-4 text-mist-gray shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className={`font-bold ${perm.hasPermission ? 'text-ink-navy' : 'text-mist-gray'}`}>
                      {perm.label}
                    </p>
                    <p className="text-[11px] text-mist-gray mt-0.5">{perm.desc}</p>
                  </div>
                </div>

                <Badge
                  variant={perm.hasPermission ? 'success' : 'secondary'}
                  className="text-[10px] shrink-0 font-medium"
                >
                  {perm.hasPermission ? 'Cho phép' : 'Từ chối'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* PostgreSQL RLS & Isolation Specs */}
      <Card className="border-hairline shadow-xs bg-white">
        <CardHeader className="pb-4 border-b border-hairline">
          <CardTitle className="text-sm sm:text-base font-bold text-ink-navy flex items-center gap-2">
            <Database className="h-4 w-4 text-signal-blue" />
            Kiến Trúc Bảo Mật Dữ Liệu (PostgreSQL RLS)
          </CardTitle>
          <CardDescription className="text-xs text-mist-gray mt-0.5">
            Các nguyên tắc cốt lõi bảo vệ dữ liệu được thực thi trực tiếp tại tầng cơ sở dữ liệu
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-5 space-y-3.5 text-xs text-slate-gray">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-cloud border border-hairline">
            <Lock className="h-4 w-4 text-signal-blue shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-ink-navy">Cách ly đa tổ chức (Multi-Tenant Isolation)</p>
              <p className="text-[11px] text-mist-gray mt-0.5">
                Mỗi Đơn vị hoạt động trong một không gian dữ liệu riêng biệt. Truy vấn từ người dùng Đơn vị này không thể đọc hoặc sửa đổi dữ liệu của Đơn vị khác.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-cloud border border-hairline">
            <ShieldCheck className="h-4 w-4 text-signal-blue shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-ink-navy">Kiểm tra động qua Membership (Dynamic RBAC)</p>
              <p className="text-[11px] text-mist-gray mt-0.5">
                Quyền hạn được kiểm tra qua bảng <code>organization_memberships</code> tại thời điểm thực thi truy vấn thay vì lưu cứng trong token.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-cloud border border-hairline">
            <History className="h-4 w-4 text-signal-blue shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-ink-navy">Nhật ký kiểm toán bất biến (Immutable Audit Trail)</p>
              <p className="text-[11px] text-mist-gray mt-0.5">
                Mọi hành vi tạo, sửa, xóa và thay đổi trạng thái quan trọng đều được ghi nhận vào bảng <code>audit_logs</code> phục vụ công tác thanh tra.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
