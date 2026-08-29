import React from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Users,
  ChevronRight,
  Edit3,
  User,
  CheckCircle2,
} from 'lucide-react';
import { ActivityStatusBadge } from './ActivityStatusBadge';
import { ActivityCategoryBadge } from './ActivityCategoryBadge';
import { formatDateRange } from '@/lib/date';
import type { ActivityListItem } from '../types/activity.types';
import { cn } from '@/lib/utils';

interface ActivityCardProps {
  activity: ActivityListItem;
  onEdit?: (activity: ActivityListItem) => void;
  canEdit?: boolean;
}

export function ActivityCard({ activity, onEdit, canEdit = false }: ActivityCardProps) {
  const targetMembers = activity.targetMembers || 0;
  const participantTotal = activity.participantStats?.total || 0;
  const presentTotal = activity.participantStats?.present || 0;
  const percentage = targetMembers > 0 ? Math.min(Math.round((participantTotal / targetMembers) * 100), 100) : null;

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
    <div
      id={`activity-card-${activity.id}`}
      className="bg-white rounded-xl border border-slate-200/90 hover:border-slate-300 hover:shadow-2xs transition-all flex flex-col justify-between overflow-hidden group"
    >
      {/* Top: Badges, Code & Status */}
      <div className="p-4 pb-3 space-y-2">
        <div className="flex items-center justify-between gap-1.5 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <ActivityCategoryBadge category={activity.category} />
            {activity.code && (
              <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200/80">
                {activity.code}
              </span>
            )}
          </div>
          <ActivityStatusBadge status={activity.status} />
        </div>

        {/* Title */}
        <Link
          to={`/activities/${activity.id}`}
          className="block group-hover:text-emerald-700 transition-colors"
        >
          <h3 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
            {activity.title}
          </h3>
        </Link>
      </div>

      {/* Main Metadata & Lead */}
      <div className="px-4 py-2.5 bg-slate-50/60 border-t border-slate-100 space-y-2 text-xs text-slate-600">
        {/* Date & Time */}
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate font-medium text-slate-800">
            {formatDateRange(activity.startDate, activity.endDate)}
          </span>
        </div>

        {/* Location */}
        {activity.location ? (
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{activity.location}</span>
          </div>
        ) : null}

        {/* Lead Person */}
        <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
          {activity.leadMember ? (
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-5 h-5 rounded-full bg-emerald-700 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                {leadInitials || <User className="w-2.5 h-2.5" />}
              </div>
              <div className="min-w-0 truncate">
                <span className="text-xs font-semibold text-slate-900 truncate block">
                  {activity.leadMember.fullName}
                </span>
              </div>
            </div>
          ) : (
            <span className="text-[11px] text-slate-400 italic flex items-center gap-1">
              <User className="w-3 h-3" />
              <span>Unassigned</span>
            </span>
          )}
        </div>

        {/* Metrics: Registered, Present, Progress */}
        <div className="pt-1.5 border-t border-slate-200/60 space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1 text-slate-500 font-medium">
              <Users className="w-3 h-3 text-slate-400" />
              <span>Participants</span>
            </span>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900">
                {participantTotal} {targetMembers > 0 ? `/ ${targetMembers}` : ''}
              </span>
              {presentTotal > 0 && (
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded font-semibold border border-emerald-100">
                  {presentTotal} present
                </span>
              )}
            </div>
          </div>

          {targetMembers > 0 && percentage !== null && (
            <div className="w-full bg-slate-200/80 rounded-full h-1 overflow-hidden">
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
      </div>

      {/* Footer Actions */}
      <div className="px-4 py-2 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
        {canEdit && onEdit ? (
          <button
            type="button"
            id={`edit-activity-btn-${activity.id}`}
            onClick={(e) => {
              e.preventDefault();
              onEdit(activity);
            }}
            className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 font-semibold py-1 px-1.5 rounded hover:bg-white border border-transparent hover:border-slate-200 transition-colors cursor-pointer"
          >
            <Edit3 className="w-3 h-3" />
            <span>Edit</span>
          </button>
        ) : (
          <div />
        )}

        <Link
          to={`/activities/${activity.id}`}
          id={`view-activity-btn-${activity.id}`}
          className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900 py-1 px-1.5 transition-colors"
        >
          <span>View Details</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
