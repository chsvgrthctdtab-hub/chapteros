import React from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Users,
  ChevronRight,
  Edit3,
  User,
  Clock,
  Flame,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { ActivityStatusBadge } from './ActivityStatusBadge';
import { ActivityCategoryBadge } from './ActivityCategoryBadge';
import { formatDateRange, formatDateTime } from '@/lib/date';
import type { ActivityListItem } from '../types/activity.types';
import { cn } from '@/lib/utils';

interface ActivityTableProps {
  activities: ActivityListItem[];
  canManage?: boolean;
  onEdit?: (activity: ActivityListItem) => void;
}

export function ActivityTable({
  activities,
  canManage = false,
  onEdit,
}: ActivityTableProps) {
  const getContextualDateInfo = (startDateStr: string, endDateStr?: string | null, status?: string) => {
    try {
      const now = new Date();
      const start = new Date(startDateStr);
      const end = endDateStr ? new Date(endDateStr) : new Date(start.getTime() + 4 * 3600 * 1000);

      if (status === 'in_progress' || (now >= start && now <= end)) {
        return { label: 'Đang diễn ra', color: 'text-emerald-700 bg-emerald-50 border-emerald-200 font-bold' };
      }

      const diffDays = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 0) {
        return { label: 'Hôm nay', color: 'text-amber-700 bg-amber-50 border-amber-200 font-semibold' };
      } else if (diffDays === 1) {
        return { label: 'Ngày mai', color: 'text-sky-700 bg-sky-50 border-sky-200' };
      } else if (diffDays > 1 && diffDays <= 7) {
        return { label: `Còn ${diffDays} ngày`, color: 'text-slate-600 bg-slate-100 border-slate-200' };
      }
      return null;
    } catch {
      return null;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <table className="w-full text-left text-xs border-collapse">
          {/* Table Header */}
          <thead className="bg-slate-50/90 text-slate-600 font-bold border-b border-slate-200/90 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3.5 px-4 min-w-[220px]">Hoạt động</th>
              <th className="py-3.5 px-3 w-28 text-center">Trạng thái</th>
              <th className="py-3.5 px-3 min-w-[140px]">Phụ trách</th>
              <th className="py-3.5 px-3 min-w-[150px]">Thời gian</th>
              <th className="py-3.5 px-3 min-w-[130px]">Địa điểm</th>
              <th className="py-3.5 px-3 min-w-[130px]">Tham gia</th>
              <th className="py-3.5 px-4 text-right w-20">Thao tác</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100">
            {activities.map((activity) => {
              const targetMembers = activity.targetMembers || 0;
              const participantTotal = activity.participantStats?.total || 0;
              const presentTotal = activity.participantStats?.present || 0;
              const percentage = targetMembers > 0 ? Math.min(Math.round((participantTotal / targetMembers) * 100), 100) : null;
              const dateContext = getContextualDateInfo(activity.startDate, activity.endDate, activity.status);

              // Lead initials
              const leadName = activity.leadMember?.fullName;
              const leadInitials = leadName
                ? leadName
                    .split(' ')
                    .filter(Boolean)
                    .map((w) => w[0])
                    .slice(-2)
                    .join('')
                    .toUpperCase()
                : null;

              return (
                <tr
                  key={activity.id}
                  id={`activity-table-row-${activity.id}`}
                  className="hover:bg-slate-50/70 transition-colors group"
                >
                  {/* Activity Name & Category */}
                  <td className="py-3 px-4">
                    <div className="flex items-start gap-2.5">
                      <div className="space-y-1 min-w-0">
                        <Link
                          to={`/activities/${activity.id}`}
                          className="font-bold text-slate-900 hover:text-emerald-700 transition-colors text-xs leading-snug line-clamp-1 block"
                        >
                          {activity.title}
                        </Link>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {activity.code && (
                            <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200/80">
                              {activity.code}
                            </span>
                          )}
                          <ActivityCategoryBadge category={activity.category} />
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <ActivityStatusBadge status={activity.status} />
                  </td>

                  {/* Lead Member */}
                  <td className="py-3 px-3">
                    {activity.leadMember ? (
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-emerald-700 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                          {leadInitials || <User className="w-3 h-3" />}
                        </div>
                        <div className="min-w-0 truncate">
                          <p className="font-semibold text-slate-900 text-xs truncate">
                            {activity.leadMember.fullName}
                          </p>
                          {activity.leadMember.studentId && (
                            <p className="text-[10px] text-slate-500 font-mono">
                              {activity.leadMember.studentId}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 italic">
                        <User className="w-3 h-3" />
                        <span>Unassigned</span>
                      </span>
                    )}
                  </td>

                  {/* Date & Time */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 font-medium text-slate-800 text-xs">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{formatDateRange(activity.startDate, activity.endDate)}</span>
                      </div>
                      {dateContext && (
                        <span
                          className={cn(
                            'inline-block text-[10px] px-1.5 py-0.2 rounded border',
                            dateContext.color
                          )}
                        >
                          {dateContext.label}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Location */}
                  <td className="py-3 px-3 text-slate-600 max-w-[160px] truncate">
                    {activity.location ? (
                      <div className="flex items-center gap-1 truncate" title={activity.location}>
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{activity.location}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>

                  {/* Participants & Attendance */}
                  <td className="py-3 px-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900">
                          {participantTotal} <span className="font-normal text-slate-500">registered</span>
                        </span>
                        {presentTotal > 0 && (
                          <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-1 rounded border border-emerald-100">
                            {presentTotal} present
                          </span>
                        )}
                      </div>
                      {targetMembers > 0 && percentage !== null && (
                        <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all',
                              percentage >= 100 ? 'bg-emerald-600' : 'bg-slate-500'
                            )}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Contextual Actions */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      {canManage && onEdit && (
                        <button
                          type="button"
                          id={`activity-row-edit-btn-${activity.id}`}
                          onClick={() => onEdit(activity)}
                          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          title="Edit activity"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <Link
                        to={`/activities/${activity.id}`}
                        id={`activity-row-view-btn-${activity.id}`}
                        className="inline-flex items-center gap-0.5 px-2 py-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-md transition-colors"
                        title="View details"
                      >
                        <span>View</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
