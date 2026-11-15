import { Link } from 'react-router-dom';
import {
  RefreshCw,
  CalendarRange,
  Building2,
  ShieldCheck,
  ChevronDown,
  Calendar,
  UserPlus,
  CalendarPlus,
  CheckSquare,
  DollarSign,
  Sparkles,
} from '@/lib/icons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import type { DashboardTermOption } from '../types/dashboard.types';

interface DashboardHeaderProps {
  userName?: string;
  organizationName?: string;
  userRole?: string;
  terms: DashboardTermOption[];
  selectedTermId: string;
  onSelectTerm: (termId: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  canManageMembers?: boolean;
  canManageActivities?: boolean;
  canManageTasks?: boolean;
  canManageFinance?: boolean;
}

const ROLE_DISPLAY_NAMES: Record<string, string> = {
  admin: 'Quản trị viên Đơn vị',
  leader: 'Chi hội trưởng',
  deputy: 'Chi hội phó',
  treasurer: 'Ủy viên / Thủ quỹ',
  secretary: 'Ủy viên / Thư ký',
};

function formatVietnameseCurrentDate(): string {
  const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const now = new Date();
  const dayName = days[now.getDay()];
  const date = now.getDate().toString().padStart(2, '0');
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const year = now.getFullYear();
  return `${dayName}, ngày ${date}/${month}/${year}`;
}

export function DashboardHeader({
  userName = 'Ban Chấp Hành',
  organizationName = 'Chi hội',
  userRole = '',
  terms,
  selectedTermId,
  onSelectTerm,
  onRefresh,
  isRefreshing,
  canManageMembers = false,
  canManageActivities = false,
  canManageTasks = false,
  canManageFinance = false,
}: DashboardHeaderProps) {
  const selectedTerm = terms.find((t) => t.id === selectedTermId) || terms.find((t) => t.isCurrent);
  const roleName = ROLE_DISPLAY_NAMES[userRole] || userRole;
  const formattedDate = formatVietnameseCurrentDate();

  const hasAnyQuickAction =
    canManageMembers || canManageActivities || canManageTasks || canManageFinance;

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        <div className="space-y-2.5 min-w-0">
          {/* Metadata badges */}
          <div className="flex items-center gap-2 flex-wrap text-xs sm:text-sm">
            <div className="flex items-center gap-1.5 font-medium text-slate-700 bg-slate-50 border border-slate-200/80 px-3 py-1 rounded-full shrink-0">
              <Building2 size={15} className="text-[#1a73e8]" />
              <span>{organizationName}</span>
            </div>

            <Badge variant="outline" className="text-xs sm:text-sm text-slate-700 bg-slate-50 border-slate-200/80 py-1 px-3 rounded-full font-medium shrink-0">
              <ShieldCheck size={15} className="mr-1 text-[#1a73e8]" />
              {roleName}
            </Badge>

            <div className="flex items-center gap-1.5 text-slate-600 font-medium bg-slate-50 border border-slate-200/80 px-3 py-1 rounded-full tabular-nums shrink-0">
              <Calendar size={15} className="text-slate-400" />
              <span>{formattedDate}</span>
            </div>

            {selectedTerm?.isCurrent && (
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#1a73e8] bg-blue-50 border border-blue-200/80 px-3 py-1 rounded-full shrink-0">
                <span className="w-2 h-2 rounded-full bg-[#1a73e8]"></span>
                <span>Nhiệm kỳ hiện tại: {selectedTerm.name}</span>
              </div>
            )}
          </div>

          {/* Heading */}
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0b3558] break-words">
              Chào mừng trở lại, {userName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 break-words max-w-3xl">
              Trung tâm điều hành Chi hội, tổng quan hoạt động và chỉ số ngân quỹ thời gian thực.
            </p>
          </div>
        </div>

        {/* Term Selector & Refresh Action */}
        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <Select
            value={selectedTermId}
            onValueChange={onSelectTerm}
          >
            <SelectTrigger id="dashboard-term-selector" className="h-9 text-xs sm:text-sm font-medium text-slate-700 bg-white border-slate-200 rounded-full w-auto min-w-[160px]">
              <div className="flex items-center gap-2">
                <CalendarRange size={15} className="text-slate-400 shrink-0" />
                <SelectValue placeholder="Tất cả nhiệm kỳ" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-white border-slate-200 rounded-2xl shadow-lg">
              <SelectItem value="all">Tất cả nhiệm kỳ</SelectItem>
              {terms.map((term) => (
                <SelectItem key={term.id} value={term.id}>
                  {term.name} {term.isCurrent ? '(Hiện tại)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            id="dashboard-refresh-btn"
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="text-xs sm:text-sm font-semibold h-9 px-4 text-slate-700 bg-white hover:bg-slate-50 border-slate-200 rounded-full shadow-xs cursor-pointer"
          >
            <RefreshCw size={15} className={`mr-2 ${isRefreshing ? 'animate-spin text-[#1a73e8]' : 'text-slate-400'}`} />
            <span>{isRefreshing ? 'Đang đồng bộ...' : 'Làm mới'}</span>
          </Button>
        </div>
      </div>

      {/* Quick Actions Bar for Board & Permitted Roles */}
      {hasAnyQuickAction && (
        <div className="p-3.5 sm:px-5 sm:py-3.5 rounded-2xl bg-white border border-slate-200/80 text-slate-900 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 min-w-0">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm shrink-0">
            <span className="flex h-2 w-2 rounded-full bg-[#1a73e8]"></span>
            <span className="font-bold text-slate-900">Thao tác nhanh Ban Chấp Hành</span>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <span className="text-slate-500 text-xs sm:text-sm hidden sm:inline">Phím tắt tác vụ thường dùng</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {canManageMembers && (
              <Link to="/members">
                <Button
                  size="sm"
                  className="bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs sm:text-sm h-8 px-3.5 border border-slate-200/80 rounded-xl cursor-pointer font-medium shadow-2xs transition-colors"
                >
                  <UserPlus size={15} className="mr-1.5 text-emerald-600" />
                  <span>Thành viên</span>
                </Button>
              </Link>
            )}

            {canManageActivities && (
              <Link to="/activities">
                <Button
                  size="sm"
                  className="bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs sm:text-sm h-8 px-3.5 border border-slate-200/80 rounded-xl cursor-pointer font-medium shadow-2xs transition-colors"
                >
                  <CalendarPlus size={15} className="mr-1.5 text-sky-600" />
                  <span>Hoạt động</span>
                </Button>
              </Link>
            )}

            {canManageTasks && (
              <Link to="/tasks">
                <Button
                  size="sm"
                  className="bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs sm:text-sm h-8 px-3.5 border border-slate-200/80 rounded-xl cursor-pointer font-medium shadow-2xs transition-colors"
                >
                  <CheckSquare size={15} className="mr-1.5 text-amber-600" />
                  <span>Nhiệm vụ</span>
                </Button>
              </Link>
            )}

            {canManageFinance && (
              <Link to="/finance">
                <Button
                  size="sm"
                  className="bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs sm:text-sm h-8 px-3.5 border border-transparent rounded-xl cursor-pointer font-medium shadow-xs transition-colors"
                >
                  <DollarSign size={15} className="mr-1.5 text-white" />
                  <span>Thu chi</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
