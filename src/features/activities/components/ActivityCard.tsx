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
  Award,
  Layers,
} from 'lucide-react';
import { ActivityStatusBadge } from './ActivityStatusBadge';
import { ActivityCategoryBadge } from './ActivityCategoryBadge';
import { formatDateRange } from '@/lib/date';
import type { ActivityListItem } from '../types/activity.types';
import { parseActivityMetadata } from '../utils/activity-metadata';
import {
  ORGANIZER_SCOPES,
  ACTIVITY_SCALES,
  LEAN_COMPETENCY_TAGS,
} from '../types/competency.types';
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

  const meta = parseActivityMetadata(activity.description);
  const scopeMeta = meta.organizerScope ? ORGANIZER_SCOPES[meta.organizerScope] : null;
  const scaleMeta = meta.activityScale ? ACTIVITY_SCALES[meta.activityScale] : null;

  const semesterLabel =
    meta.semester === 'hk1'
      ? 'HK I'
      : meta.semester === 'hk2'
      ? 'HK II'
      : meta.semester === 'hk3'
      ? 'HK III'
      : null;

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
      className="bg-white rounded-2xl border border-hairline hover:border-mist-gray hover:shadow-sm transition-all flex flex-col justify-between overflow-hidden group"
    >
      {/* Top: Badges, Code & Status */}
      <div className="p-4 pb-3 space-y-2">
        <div className="flex items-center justify-between gap-1.5 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <ActivityCategoryBadge category={activity.category} />
            {semesterLabel && (
              <span className="text-[10px] font-bold text-signal-blue bg-[#e6f0ff] px-2 py-0.5 rounded-full border border-[#d4e4fa]">
                {semesterLabel}
              </span>
            )}
            {scopeMeta && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${scopeMeta.badgeClass}`}>
                {scopeMeta.badgeLabel}
              </span>
            )}
            {activity.code && (
              <span className="tabular-nums text-[10px] font-semibold text-slate-gray bg-pebble px-2 py-0.5 rounded-full border border-hairline">
                {activity.code}
              </span>
            )}
          </div>
          <ActivityStatusBadge status={activity.status} />
        </div>

        {/* Title */}
        <Link
          to={`/activities/${activity.id}`}
          className="block group-hover:text-signal-blue transition-colors"
        >
          <h3 className="text-sm font-semibold text-ink-navy line-clamp-2 leading-snug">
            {activity.title}
          </h3>
        </Link>

        {/* Competency & Monthly Meeting Badges */}
        {(meta.isMonthlyUnionMeeting || (meta.competencyTags && meta.competencyTags.length > 0)) && (
          <div className="flex items-center gap-1 flex-wrap pt-0.5">
            {meta.isMonthlyUnionMeeting && (
              <span className="text-[10px] font-semibold text-sky-800 bg-sky-50 px-1.5 py-0.2 rounded border border-sky-200">
                Sinh hoạt Chi đoàn/Hội
              </span>
            )}
            {meta.competencyTags?.slice(0, 2).map((tagKey) => {
              const tag = LEAN_COMPETENCY_TAGS[tagKey];
              if (!tag) return null;
              return (
                <span
                  key={tagKey}
                  className={`text-[10px] font-medium px-1.5 py-0.2 rounded border ${tag.badgeClass}`}
                  title={tag.name}
                >
                  Mã {tag.code}
                </span>
              );
            })}
            {meta.competencyTags && meta.competencyTags.length > 2 && (
              <span className="text-[10px] text-slate-gray font-medium">
                +{meta.competencyTags.length - 2}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Main Metadata & Lead */}
      <div className="px-4 py-3 bg-cloud/50 border-t border-hairline space-y-2 text-xs text-slate-gray">
        {/* Date & Time */}
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-mist-gray shrink-0" />
          <span className="truncate font-medium text-ink-navy">
            {formatDateRange(activity.startDate, activity.endDate)}
          </span>
        </div>

        {/* Location */}
        {activity.location ? (
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-mist-gray shrink-0" />
            <span className="truncate">{activity.location}</span>
          </div>
        ) : null}

        {/* Lead Person */}
        <div className="flex items-center gap-2 pt-1 border-t border-hairline/60">
          {activity.leadMember ? (
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-5 h-5 rounded-full bg-[#e6f0ff] text-signal-blue border border-[#d4e4fa] text-[9px] font-bold flex items-center justify-center shrink-0">
                {leadInitials || <User className="w-2.5 h-2.5" />}
              </div>
              <div className="min-w-0 truncate">
                <span className="text-xs font-semibold text-ink-navy truncate block">
                  {activity.leadMember.fullName}
                </span>
              </div>
            </div>
          ) : (
            <span className="text-[11px] text-mist-gray italic flex items-center gap-1">
              <User className="w-3 h-3" />
              <span>Unassigned</span>
            </span>
          )}
        </div>

        {/* Metrics: Registered, Present, Progress */}
        <div className="pt-1.5 border-t border-hairline/60 space-y-1">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1 text-slate-gray font-medium">
              <Users className="w-3 h-3 text-mist-gray" />
              <span>Participants</span>
            </span>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-ink-navy tabular-nums">
                {participantTotal} {targetMembers > 0 ? `/ ${targetMembers}` : ''}
              </span>
              {presentTotal > 0 && (
                <span className="text-[10px] text-signal-blue bg-[#e6f0ff] px-1.5 py-0.2 rounded-full font-semibold border border-[#d4e4fa] tabular-nums">
                  {presentTotal} present
                </span>
              )}
            </div>
          </div>

          {targetMembers > 0 && percentage !== null && (
            <div className="w-full bg-pebble rounded-full h-1 overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  percentage >= 100 ? 'bg-signal-blue' : 'bg-slate-gray'
                )}
                style={{ width: `${percentage}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-4 py-2 bg-cloud/80 border-t border-hairline flex items-center justify-between gap-2">
        {canEdit && onEdit ? (
          <button
            type="button"
            id={`edit-activity-btn-${activity.id}`}
            onClick={(e) => {
              e.preventDefault();
              onEdit(activity);
            }}
            className="inline-flex items-center gap-1 text-xs text-slate-gray hover:text-ink-navy font-semibold py-1 px-2 rounded-lg hover:bg-white border border-transparent hover:border-hairline transition-colors cursor-pointer"
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
          className="inline-flex items-center gap-1 text-xs font-semibold text-signal-blue hover:text-[#005be0] py-1 px-1.5 transition-colors"
        >
          <span>View Details</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
