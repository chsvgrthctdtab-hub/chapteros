import { Link, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarCheck, Calendar, MapPin, Users, ArrowRight, Plus } from 'lucide-react';
import { formatDateTime, ACTIVITY_STATUS_META } from '../utils/formatters';
import type { UpcomingActivityItem } from '../types/dashboard.types';
import { EmptyState } from '@/components/common/EmptyState';

interface UpcomingActivitiesSectionProps {
  activities: UpcomingActivityItem[];
  canCreateActivity?: boolean;
}

export function UpcomingActivitiesSection({
  activities,
  canCreateActivity = false,
}: UpcomingActivitiesSectionProps) {
  const navigate = useNavigate();
  const hasActivities = activities && activities.length > 0;

  return (
    <Card className="rounded-xl border-slate-200/90 shadow-2xs bg-white">
      <CardHeader className="p-4 sm:p-5 pb-3 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Hoạt động & Sự kiện sắp tới
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Các sự kiện, phong trào sắp và đang diễn ra
              </p>
            </div>
          </div>

          <Link to="/activities">
            <Button variant="ghost" size="sm" className="text-xs sm:text-sm font-semibold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 h-8 px-2.5">
              <span>Xem tất cả</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 pt-2">
        {hasActivities ? (
          <div className="divide-y divide-slate-100">
            {activities.map((activity) => {
              const statusMeta = ACTIVITY_STATUS_META[activity.status] || {
                label: activity.status,
                colorClass: 'text-slate-700',
                bgClass: 'bg-slate-50 text-slate-700 border-slate-200',
              };

              return (
                <Link
                  key={activity.id}
                  to={`/activities/${activity.id}`}
                  className="group block py-3 first:pt-1.5 last:pb-0.5 focus:outline-none"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-slate-400 font-mono">
                          {activity.code}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[11px] py-0 px-2 font-medium border ${statusMeta.bgClass}`}
                        >
                          {statusMeta.label}
                        </Badge>
                      </div>

                      <h4 className="text-sm font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                        {activity.title}
                      </h4>

                      <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap pt-0.5">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatDateTime(activity.startDate)}</span>
                        </div>

                        {activity.location && (
                          <div className="flex items-center gap-1.5 line-clamp-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[160px]">{activity.location}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {activity.participantsCount}
                            {activity.targetMembers ? `/${activity.targetMembers}` : ''} người
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 pt-1 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <EmptyState
            compact
            icon={<CalendarCheck className="w-5 h-5 text-slate-400" />}
            title="Chưa có hoạt động sắp tới"
            description="Lên kế hoạch chương trình mới để bắt đầu theo dõi tiến độ và điểm danh hội viên."
            actionLabel={canCreateActivity ? 'Tạo hoạt động mới' : undefined}
            actionIcon={<Plus className="w-3.5 h-3.5" />}
            onAction={canCreateActivity ? () => navigate('/activities') : undefined}
          />
        )}
      </CardContent>
    </Card>
  );
}
