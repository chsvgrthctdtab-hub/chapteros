import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, Users, CalendarPlus, CheckSquare, DollarSign } from 'lucide-react';

interface QuickActionsBarProps {
  canManageMembers?: boolean;
  canManageActivities?: boolean;
  canManageTasks?: boolean;
  canManageFinance?: boolean;
  onOpenCreateActivity?: () => void;
  onOpenCreateTask?: () => void;
  onOpenCreateTransaction?: () => void;
}

export function QuickActionsBar({
  canManageMembers = false,
  canManageActivities = false,
  canManageTasks = false,
  canManageFinance = false,
}: QuickActionsBarProps) {
  // If user has no management permissions, don't show the quick actions bar
  if (!canManageMembers && !canManageActivities && !canManageTasks && !canManageFinance) {
    return null;
  }

  return (
    <div className="p-4 rounded-xl bg-linear-to-r from-slate-900 via-slate-800 to-indigo-950 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="space-y-0.5">
        <div className="flex items-center gap-1.5 text-xs text-indigo-300 font-medium">
          <span>Thao tác nhanh cho Ban Chấp Hành</span>
        </div>
        <h3 className="text-sm font-bold text-white">
          Khởi tạo & Cập nhật dữ liệu Chi hội
        </h3>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {canManageActivities && (
          <Link to="/activities">
            <Button
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-8 shadow-xs border border-indigo-400/30"
            >
              <CalendarPlus className="w-3.5 h-3.5 mr-1.5" />
              Thêm hoạt động
            </Button>
          </Link>
        )}

        {canManageTasks && (
          <Link to="/tasks">
            <Button
              size="sm"
              className="bg-amber-600 hover:bg-amber-500 text-white text-xs h-8 shadow-xs border border-amber-400/30"
            >
              <CheckSquare className="w-3.5 h-3.5 mr-1.5" />
              Giao công việc
            </Button>
          </Link>
        )}

        {canManageMembers && (
          <Link to="/members">
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs h-8 shadow-xs border border-blue-400/30"
            >
              <Users className="w-3.5 h-3.5 mr-1.5" />
              Thêm hội viên
            </Button>
          </Link>
        )}

        {canManageFinance && (
          <Link to="/finance">
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8 shadow-xs border border-emerald-400/30"
            >
              <DollarSign className="w-3.5 h-3.5 mr-1.5" />
              Ghi thu - chi
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
