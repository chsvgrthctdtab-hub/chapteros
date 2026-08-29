import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { notificationRepository } from '@/repositories/notification.repository';
import type {
  NotificationItem,
  NotificationState,
} from '@/features/notifications/types/notification.types';
import dayjs from 'dayjs';

interface RawTaskRow {
  id: string;
  title: string;
  due_date: string | null;
  status: string;
  priority: string;
  assigned_to: string | null;
  created_at: string;
}

interface RawActivityRow {
  id: string;
  title: string;
  start_date: string;
  location: string | null;
  status: string;
  created_at: string;
}

interface RawGoogleConnectionRow {
  id: string;
  connection_type: string;
  status: string;
  email: string | null;
  updated_at: string;
}

interface RawFinanceRow {
  transaction_type: string;
  amount: number | string;
  status?: string;
}

export const notificationService = {
  /**
   * Aggregate operational and explicit notifications for current organization & user
   */
  async getNotifications(
    organizationId: string,
    userId: string
  ): Promise<NotificationState> {
    if (!isSupabaseConfigured || !organizationId || !userId) {
      return { items: [], unreadCount: 0, totalCount: 0 };
    }

    try {
      const now = dayjs();
      const next48h = now.add(48, 'hour');
      const next7days = now.add(7, 'day');

      // Run parallel queries to fetch real operational data and persistent read keys
      const [
        readKeys,
        tasksRes,
        activitiesRes,
        googleRes,
        financeRes,
        explicitNotifs,
      ] = await Promise.all([
        notificationRepository.getReadKeys(organizationId, userId),
        (supabase.from('tasks') as any)
          .select('id, title, due_date, status, priority, assigned_to, created_at')
          .eq('organization_id', organizationId)
          .not('status', 'in', '("completed","cancelled")')
          .limit(20),
        (supabase.from('activities') as any)
          .select('id, title, start_date, location, status, created_at')
          .eq('organization_id', organizationId)
          .not('status', 'in', '("completed","cancelled")')
          .gte('start_date', now.toISOString())
          .lte('start_date', next7days.toISOString())
          .order('start_date', { ascending: true })
          .limit(10),
        (supabase.from('google_connections') as any)
          .select('id, connection_type, status, email, updated_at')
          .or(`organization_id.eq.${organizationId},user_id.eq.${userId}`)
          .in('status', ['error', 'expired']),
        (supabase.from('finance_transactions') as any)
          .select('transaction_type, amount, status')
          .eq('organization_id', organizationId)
          .in('status', ['posted', 'approved']),
        notificationRepository.getExplicitNotifications(organizationId, userId),
      ]);

      const items: NotificationItem[] = [];

      // 1. Process Task Notifications
      const tasks = (tasksRes.data || []) as RawTaskRow[];
      tasks.forEach((task) => {
        const isAssignedToUser = task.assigned_to === userId;
        const dueDate = task.due_date ? dayjs(task.due_date) : null;

        if (dueDate) {
          if (dueDate.isBefore(now)) {
            // Overdue task
            const key = `task-overdue:${task.id}`;
            items.push({
              id: key,
              key,
              organizationId,
              title: `Nhiệm vụ quá hạn: ${task.title}`,
              message: `Hạn hoàn thành: ${dueDate.format('DD/MM/YYYY')}. Cần xử lý ngay!`,
              type: 'danger',
              category: 'task',
              link: `/tasks/${task.id}`,
              entityType: 'task',
              entityId: task.id,
              createdAt: task.due_date,
              isRead: readKeys.has(key),
            });
          } else if (dueDate.isBefore(next48h)) {
            // Due soon task
            const key = `task-due-soon:${task.id}`;
            items.push({
              id: key,
              key,
              organizationId,
              title: `Nhiệm vụ sắp đến hạn: ${task.title}`,
              message: `Hạn chót vào ${dueDate.format('DD/MM/YYYY HH:mm')}.`,
              type: 'warning',
              category: 'task',
              link: `/tasks/${task.id}`,
              entityType: 'task',
              entityId: task.id,
              createdAt: task.created_at || now.toISOString(),
              isRead: readKeys.has(key),
            });
          }
        }

        if (isAssignedToUser) {
          const key = `task-assigned:${task.id}`;
          items.push({
            id: key,
            key,
            organizationId,
            title: `Bạn được phân công: ${task.title}`,
            message: `Nhiệm vụ đang ở trạng thái ${task.status}.`,
            type: 'info',
            category: 'task',
            link: `/tasks/${task.id}`,
            entityType: 'task',
            entityId: task.id,
            createdAt: task.created_at || now.toISOString(),
            isRead: readKeys.has(key),
          });
        }
      });

      // 2. Process Activity Notifications
      const activities = (activitiesRes.data || []) as RawActivityRow[];
      activities.forEach((act) => {
        const actDate = dayjs(act.start_date);
        const key = `activity-upcoming:${act.id}`;
        items.push({
          id: key,
          key,
          organizationId,
          title: `Sắp diễn ra: ${act.title}`,
          message: `Thời gian: ${actDate.format('DD/MM/YYYY HH:mm')}${act.location ? ` tại ${act.location}` : ''}.`,
          type: 'info',
          category: 'activity',
          link: `/activities/${act.id}`,
          entityType: 'activity',
          entityId: act.id,
          createdAt: act.created_at || now.toISOString(),
          isRead: readKeys.has(key),
        });
      });

      // 3. Process Google Integration Warnings
      const googleIssues = (googleRes.data || []) as RawGoogleConnectionRow[];
      googleIssues.forEach((issue) => {
        const key = `google-connection-error:${issue.id}`;
        items.push({
          id: key,
          key,
          organizationId,
          title: 'Kết nối Google Workspace cần xác thực lại',
          message: `Tài khoản ${issue.email || ''} bị gián đoạn kết nối (${issue.status}).`,
          type: 'warning',
          category: 'integration',
          link: '/integrations',
          entityType: 'google_connection',
          entityId: issue.id,
          createdAt: issue.updated_at || now.toISOString(),
          isRead: readKeys.has(key),
        });
      });

      // 4. Process Finance Negative Balance Alert
      const transactions = (financeRes.data || []) as RawFinanceRow[];
      if (transactions.length > 0) {
        const totalIncome = transactions
          .filter((t) => t.transaction_type === 'income')
          .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
        const totalExpense = transactions
          .filter((t) => t.transaction_type === 'expense')
          .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
        const balance = totalIncome - totalExpense;

        if (balance < 0) {
          const key = `finance-negative-balance:${organizationId}`;
          items.push({
            id: key,
            key,
            organizationId,
            title: 'Cảnh báo: Thâm hụt quỹ Chi hội',
            message: `Tổng chi đang vượt tổng thu (${new Intl.NumberFormat('vi-VN').format(balance)} VND).`,
            type: 'danger',
            category: 'finance',
            link: '/finance',
            entityType: 'finance',
            createdAt: now.toISOString(),
            isRead: readKeys.has(key),
          });
        }
      }

      // 5. Process Explicit Notifications from DB table
      explicitNotifs.forEach((dbNotif) => {
        const key = `explicit:${dbNotif.id}`;
        items.push({
          id: key,
          key,
          organizationId: dbNotif.organization_id,
          title: dbNotif.title,
          message: dbNotif.message,
          type: dbNotif.type as any,
          category: dbNotif.category as any,
          link: dbNotif.link || '/dashboard',
          entityType: dbNotif.entity_type || undefined,
          entityId: dbNotif.entity_id || undefined,
          createdAt: dbNotif.created_at,
          isRead: readKeys.has(key),
        });
      });

      // Sort by unread first, then latest createdAt
      items.sort((a, b) => {
        if (a.isRead !== b.isRead) {
          return a.isRead ? 1 : -1;
        }
        return dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf();
      });

      const unreadCount = items.filter((i) => !i.isRead).length;

      return {
        items,
        unreadCount,
        totalCount: items.length,
      };
    } catch (err) {
      console.error('Error fetching notifications:', err);
      return { items: [], unreadCount: 0, totalCount: 0 };
    }
  },

  /**
   * Mark a single notification as read
   */
  async markRead(
    organizationId: string,
    userId: string,
    notificationKey: string
  ): Promise<void> {
    return notificationRepository.markAsRead(organizationId, userId, notificationKey);
  },

  /**
   * Mark all active notifications as read
   */
  async markAllRead(
    organizationId: string,
    userId: string,
    notificationKeys: string[]
  ): Promise<void> {
    return notificationRepository.markAllAsRead(organizationId, userId, notificationKeys);
  },
};
