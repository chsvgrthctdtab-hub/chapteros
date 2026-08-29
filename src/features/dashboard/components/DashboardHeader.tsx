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
  FileUp,
  Sparkles,
} from 'lucide-react';
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
  canManageDocuments?: boolean;
}

const ROLE_DISPLAY_NAMES: Record<string, string> = {
  admin: 'Quản trị viên Chi hội',
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
  canManageDocuments = false,
}: DashboardHeaderProps) {
  const selectedTerm = terms.find((t) => t.id === selectedTermId) || terms.find((t) => t.isCurrent);
  const roleName = ROLE_DISPLAY_NAMES[userRole] || userRole;
  const formattedDate = formatVietnameseCurrentDate();

  const hasAnyQuickAction =
    canManageMembers || canManageActivities || canManageTasks || canManageFinance || canManageDocuments;

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 p-5 sm:p-6 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
        <div className="space-y-2">
          {/* Metadata badges */}
          <div className="flex items-center gap-2.5 flex-wrap text-xs sm:text-sm">
            <div className="flex items-center gap-1.5 font-medium text-emerald-800 bg-emerald-50 border border-emerald-200/70 px-2.5 py-1 rounded-md">
              <Building2 className="w-4 h-4 text-emerald-700" />
              <span>{organizationName}</span>
            </div>

            <Badge variant="outline" className="text-xs sm:text-sm text-slate-700 bg-slate-50 border-slate-200/80 py-1 px-2.5 font-medium">
              <ShieldCheck className="w-4 h-4 mr-1 text-emerald-600" />
              {roleName}
            </Badge>

            <div className="flex items-center gap-1.5 text-slate-500 font-medium bg-slate-50 border border-slate-200/60 px-2.5 py-1 rounded-md">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>{formattedDate}</span>
            </div>

            {selectedTerm?.isCurrent && (
              <Badge variant="default" className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm py-1 px-2.5 font-medium">
                Active Term: {selectedTerm.name}
              </Badge>
            )}
          </div>

          {/* Heading */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Welcome back, {userName}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Chapter operational command center, active deliverables, and real-time treasury metrics.
            </p>
          </div>
        </div>

        {/* Term Selector & Refresh Action */}
        <div className="flex items-center gap-2.5 flex-wrap self-start lg:self-auto shrink-0">
          <Select
            value={selectedTermId}
            onValueChange={onSelectTerm}
          >
            <SelectTrigger id="dashboard-term-selector" className="h-9 text-xs sm:text-sm font-medium text-slate-800 bg-slate-50 border-slate-200/90 w-auto min-w-[160px]">
              <div className="flex items-center gap-2">
                <CalendarRange className="w-4 h-4 text-slate-400 shrink-0" />
                <SelectValue placeholder="Tất cả nhiệm kỳ" />
              </div>
            </SelectTrigger>
            <SelectContent>
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
            className="text-xs sm:text-sm font-semibold h-9 px-3.5 text-slate-700 bg-white hover:bg-slate-50 border-slate-200/90 rounded-lg shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin text-emerald-600' : 'text-slate-500'}`} />
            <span>{isRefreshing ? 'Đang đồng bộ...' : 'Làm mới'}</span>
          </Button>
        </div>
      </div>

      {/* Quick Actions Bar for Board & Permitted Roles */}
      {hasAnyQuickAction && (
        <div className="p-3.5 sm:px-5 sm:py-3 rounded-xl bg-slate-900 text-white shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
            <span className="font-semibold text-slate-100">Thao tác nhanh Ban Chấp Hành</span>
            <span className="text-slate-400 hidden sm:inline">•</span>
            <span className="text-slate-400 text-xs sm:text-sm hidden sm:inline">Phím tắt tác vụ nhanh</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {canManageMembers && (
              <Link to="/members">
                <Button
                  size="sm"
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs sm:text-sm h-8 px-3 border border-slate-700/60 rounded-lg cursor-pointer font-medium"
                >
                  <UserPlus className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                  <span>Member</span>
                </Button>
              </Link>
            )}

            {canManageActivities && (
              <Link to="/activities">
                <Button
                  size="sm"
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs sm:text-sm h-8 px-3 border border-slate-700/60 rounded-lg cursor-pointer font-medium"
                >
                  <CalendarPlus className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
                  <span>Activity</span>
                </Button>
              </Link>
            )}

            {canManageTasks && (
              <Link to="/tasks">
                <Button
                  size="sm"
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs sm:text-sm h-8 px-3 border border-slate-700/60 rounded-lg cursor-pointer font-medium"
                >
                  <CheckSquare className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                  <span>Task</span>
                </Button>
              </Link>
            )}

            {canManageFinance && (
              <Link to="/finance">
                <Button
                  size="sm"
                  className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs sm:text-sm h-8 px-3 border border-emerald-600/40 rounded-lg cursor-pointer font-medium"
                >
                  <DollarSign className="w-3.5 h-3.5 mr-1.5 text-emerald-200" />
                  <span>Transaction</span>
                </Button>
              </Link>
            )}

            {canManageDocuments && (
              <Link to="/documents">
                <Button
                  size="sm"
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs sm:text-sm h-8 px-3 border border-slate-700/60 rounded-lg cursor-pointer font-medium"
                >
                  <FileUp className="w-3.5 h-3.5 mr-1.5 text-teal-400" />
                  <span>Document</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
