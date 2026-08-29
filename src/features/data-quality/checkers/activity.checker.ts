import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { DataQualityChecker, DataQualityIssue } from '../types';

interface RawActivity {
  id: string;
  title: string;
  status: string;
  start_date: string;
  end_date: string;
  category: string;
  lead_member_id: string | null;
  organization_id: string;
}

interface RawParticipantCount {
  activity_id: string;
  registration_status: string;
}

interface RawActivityTask {
  id: string;
  activity_id: string | null;
  status: string;
  title: string;
}

export const activityQualityChecker: DataQualityChecker = {
  category: 'activities',
  name: 'Activity Quality Checker',
  description: 'Kiểm tra tính hợp lệ của vòng đời hoạt động, người phụ trách, thời gian và sự liên kết công việc.',

  async check(organizationId: string): Promise<DataQualityIssue[]> {
    if (!isSupabaseConfigured || !organizationId) {
      return [];
    }

    const issues: DataQualityIssue[] = [];
    const now = new Date();
    const nowIso = now.toISOString();
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();

    // 1. Fetch all activities for this organization
    const { data: activitiesData, error: activitiesError } = await supabase
      .from('activities')
      .select('id, title, status, start_date, end_date, category, lead_member_id, organization_id')
      .eq('organization_id', organizationId);

    if (activitiesError || !activitiesData) {
      console.error('[ActivityQualityChecker] Fetch activities error:', activitiesError);
      return [];
    }

    const activitiesRaw = activitiesData as unknown as RawActivity[];
    if (activitiesRaw.length === 0) {
      return [];
    }

    const activityIds = activitiesRaw.map((a) => a.id);

    // 2. Fetch participant counts grouped by activity (single query, avoiding N+1)
    const { data: participantsData } = await supabase
      .from('activity_participants')
      .select('activity_id, registration_status')
      .in('activity_id', activityIds);

    const participantsRaw = (participantsData || []) as unknown as RawParticipantCount[];
    const participantCountMap = new Map<string, number>();
    for (const p of participantsRaw) {
      if (p.registration_status !== 'cancelled') {
        participantCountMap.set(p.activity_id, (participantCountMap.get(p.activity_id) || 0) + 1);
      }
    }

    // 3. Fetch unfinished tasks linked to these activities (single query)
    const { data: openTasksData } = await supabase
      .from('tasks')
      .select('id, activity_id, status, title')
      .eq('organization_id', organizationId)
      .not('activity_id', 'is', null)
      .not('status', 'in', '("completed","cancelled")');

    const openTasksRaw = (openTasksData || []) as unknown as RawActivityTask[];
    const openTasksMap = new Map<string, number>();
    for (const t of openTasksRaw) {
      if (t.activity_id) {
        openTasksMap.set(t.activity_id, (openTasksMap.get(t.activity_id) || 0) + 1);
      }
    }

    // Evaluate each activity
    for (const activity of activitiesRaw) {
      // Check 1: Invalid dates (start_date > end_date)
      if (activity.start_date && activity.end_date) {
        const start = new Date(activity.start_date).getTime();
        const end = new Date(activity.end_date).getTime();
        if (start > end) {
          issues.push({
            id: `dq_activities_ACTIVITY_INVALID_DATES_${activity.id}`,
            organizationId,
            category: 'activities',
            severity: 'critical',
            code: 'ACTIVITY_INVALID_DATES',
            title: 'Thời gian hoạt động không hợp lệ',
            description: `Hoạt động "${activity.title}" có thời gian bắt đầu (${activity.start_date}) sau thời gian kết thúc (${activity.end_date}).`,
            entityType: 'activity',
            entityId: activity.id,
            entityName: activity.title,
            detectedAt: nowIso,
            actionLabel: 'Sửa thời gian',
            actionRoute: `/activities`,
            metadata: { activityId: activity.id, startDate: activity.start_date, endDate: activity.end_date },
          });
        }
      }

      // Check 2: Published without lead (critical)
      if (activity.status === 'published' && !activity.lead_member_id) {
        issues.push({
          id: `dq_activities_ACTIVITY_PUBLISHED_WITHOUT_LEAD_${activity.id}`,
          organizationId,
          category: 'activities',
          severity: 'critical',
          code: 'ACTIVITY_PUBLISHED_WITHOUT_LEAD',
          title: 'Hoạt động đã công bố nhưng chưa có Trưởng ban tổ chức',
          description: `Hoạt động "${activity.title}" đã được công bố cho hội viên đăng ký nhưng chưa phân công người phụ trách chính (lead).`,
          entityType: 'activity',
          entityId: activity.id,
          entityName: activity.title,
          detectedAt: nowIso,
          actionLabel: 'Phân công phụ trách',
          actionRoute: `/activities`,
          metadata: { activityId: activity.id, status: activity.status },
        });
      }

      // Check 3: Active/Planning activity missing lead (warning) - draft is excluded
      if (
        (activity.status === 'planning' || activity.status === 'in_progress') &&
        !activity.lead_member_id
      ) {
        issues.push({
          id: `dq_activities_ACTIVITY_MISSING_LEAD_${activity.id}`,
          organizationId,
          category: 'activities',
          severity: 'warning',
          code: 'ACTIVITY_MISSING_LEAD',
          title: 'Hoạt động chưa có người phụ trách',
          description: `Hoạt động "${activity.title}" (trạng thái: ${activity.status}) chưa được chỉ định Trưởng ban tổ chức.`,
          entityType: 'activity',
          entityId: activity.id,
          entityName: activity.title,
          detectedAt: nowIso,
          actionLabel: 'Chỉ định phụ trách',
          actionRoute: `/activities`,
          metadata: { activityId: activity.id, status: activity.status },
        });
      }

      // Check 4: Upcoming or running activity without participants (info)
      const pCount = participantCountMap.get(activity.id) || 0;
      if (
        (activity.status === 'published' || activity.status === 'in_progress') &&
        activity.start_date &&
        activity.start_date <= threeDaysLater &&
        pCount === 0
      ) {
        issues.push({
          id: `dq_activities_ACTIVITY_UPCOMING_WITHOUT_PARTICIPANTS_${activity.id}`,
          organizationId,
          category: 'activities',
          severity: 'info',
          code: 'ACTIVITY_UPCOMING_WITHOUT_PARTICIPANTS',
          title: 'Hoạt động sắp diễn ra nhưng chưa có người đăng ký',
          description: `Hoạt động "${activity.title}" sắp bắt đầu (${activity.start_date}) nhưng hiện tại có 0 người tham gia đã đăng ký.`,
          entityType: 'activity',
          entityId: activity.id,
          entityName: activity.title,
          detectedAt: nowIso,
          actionLabel: 'Xem danh sách điểm danh',
          actionRoute: `/activities`,
          metadata: { activityId: activity.id, participantCount: 0 },
        });
      }

      // Check 5: Completed activity with open tasks (warning)
      if (activity.status === 'completed') {
        const openTaskCount = openTasksMap.get(activity.id) || 0;
        if (openTaskCount > 0) {
          issues.push({
            id: `dq_activities_ACTIVITY_COMPLETED_WITH_OPEN_TASKS_${activity.id}`,
            organizationId,
            category: 'activities',
            severity: 'warning',
            code: 'ACTIVITY_COMPLETED_WITH_OPEN_TASKS',
            title: `Hoạt động đã hoàn thành nhưng còn ${openTaskCount} công việc tồn đọng`,
            description: `Hoạt động "${activity.title}" đã chuyển sang "Đã hoàn thành" nhưng vẫn còn ${openTaskCount} công việc con chưa được nghiệm thu hoặc hủy.`,
            entityType: 'activity',
            entityId: activity.id,
            entityName: activity.title,
            detectedAt: nowIso,
            actionLabel: 'Xử lý công việc',
            actionRoute: `/tasks`,
            metadata: { activityId: activity.id, openTaskCount },
          });
        }
      }
    }

    return issues;
  },
};
