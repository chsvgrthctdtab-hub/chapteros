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
  canManageDocuments?: boolean;
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 p-5 sm:p-6 rounded-2xl bg-white border border-[#e2e8f0] shadow-xs">
        <div className="space-y-2">
          {/* Metadata badges */}
          <div className="flex items-center gap-2 flex-wrap text-xs sm:text-sm">
            <div className="flex items-center gap-1.5 font-medium text-[#1a73e8] bg-[#e8f0fe] border border-[#c2e7ff] px-3 py-1 rounded-full">
              <Building2 size={15} className="text-[#1a73e8]" />
              <span>{organizationName}</span>
            </div>

            <Badge variant="outline" className="text-xs sm:text-sm text-[#1e293b] bg-[#f0f4f9] border-[#e2e8f0] py-1 px-3 rounded-full font-medium">
              <ShieldCheck size={15} className="mr-1 text-[#2e89f7]" />
              {roleName}
            </Badge>

            <div className="flex items-center gap-1.5 text-[#64748b] font-medium bg-[#f0f4f9] border border-[#e2e8f0] px-3 py-1 rounded-full tabular-nums">
              <Calendar size={15} className="text-[#94a3b8]" />
              <span>{formattedDate}</span>
            </div>

            {selectedTerm?.isCurrent && (
              <Badge variant="default" className="bg-[#2e89f7] hover:bg-[#1a73e8] text-white text-xs sm:text-sm py-1 px-3 rounded-full font-medium shadow-xs">
                Active Term: {selectedTerm.name}
              </Badge>
            )}
          </div>

          {/* Heading */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0b3558]">
              Welcome back, {userName}
            </h1>
            <p className="text-sm text-[#64748b] mt-1">
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
            <SelectTrigger id="dashboard-term-selector" className="h-9 text-xs sm:text-sm font-medium text-[#1e293b] bg-white border-[#e2e8f0] rounded-full w-auto min-w-[160px]">
              <div className="flex items-center gap-2">
                <CalendarRange size={15} className="text-[#94a3b8] shrink-0" />
                <SelectValue placeholder="Tất cả nhiệm kỳ" />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-white border-[#e2e8f0] rounded-2xl shadow-lg">
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
            className="text-xs sm:text-sm font-semibold h-9 px-4 text-[#1e293b] bg-white hover:bg-[#f0f4f9] border-[#e2e8f0] rounded-full shadow-xs cursor-pointer"
          >
            <RefreshCw size={15} className={`mr-2 ${isRefreshing ? 'animate-spin text-[#2e89f7]' : 'text-[#64748b]'}`} />
            <span>{isRefreshing ? 'Đang đồng bộ...' : 'Làm mới'}</span>
          </Button>
        </div>
      </div>

      {/* Quick Actions Bar for Board & Permitted Roles */}
      {hasAnyQuickAction && (
        <div className="p-3.5 sm:px-5 sm:py-3.5 rounded-2xl bg-[#0b3558] text-white shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400"></span>
            <span className="font-semibold text-white">Thao tác nhanh Ban Chấp Hành</span>
            <span className="text-white/40 hidden sm:inline">•</span>
            <span className="text-white/70 text-xs sm:text-sm hidden sm:inline">Phím tắt tác vụ nhanh</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {canManageMembers && (
              <Link to="/members">
                <Button
                  size="sm"
                  className="bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm h-8 px-3.5 border border-white/15 rounded-full cursor-pointer font-medium"
                >
                  <UserPlus size={15} className="mr-1.5 text-emerald-400" />
                  <span>Member</span>
                </Button>
              </Link>
            )}

            {canManageActivities && (
              <Link to="/activities">
                <Button
                  size="sm"
                  className="bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm h-8 px-3.5 border border-white/15 rounded-full cursor-pointer font-medium"
                >
                  <CalendarPlus size={15} className="mr-1.5 text-sky-400" />
                  <span>Activity</span>
                </Button>
              </Link>
            )}

            {canManageTasks && (
              <Link to="/tasks">
                <Button
                  size="sm"
                  className="bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm h-8 px-3.5 border border-white/15 rounded-full cursor-pointer font-medium"
                >
                  <CheckSquare size={15} className="mr-1.5 text-amber-400" />
                  <span>Task</span>
                </Button>
              </Link>
            )}

            {canManageFinance && (
              <Link to="/finance">
                <Button
                  size="sm"
                  className="bg-[#2e89f7] hover:bg-[#1a73e8] text-white text-xs sm:text-sm h-8 px-3.5 border border-transparent rounded-full cursor-pointer font-medium shadow-xs"
                >
                  <DollarSign size={15} className="mr-1.5 text-white" />
                  <span>Transaction</span>
                </Button>
              </Link>
            )}

            {canManageDocuments && (
              <Link to="/documents">
                <Button
                  size="sm"
                  className="bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm h-8 px-3.5 border border-white/15 rounded-full cursor-pointer font-medium"
                >
                  <FileUp size={15} className="mr-1.5 text-teal-400" />
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
