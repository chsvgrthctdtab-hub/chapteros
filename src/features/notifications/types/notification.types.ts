export type NotificationType = 'info' | 'warning' | 'danger' | 'success';

export type NotificationCategory =
  | 'task'
  | 'activity'
  | 'finance'
  | 'document'
  | 'integration'
  | 'system'
  | 'general';

export interface NotificationItem {
  id: string;
  key: string;
  organizationId: string;
  title: string;
  message: string;
  type: NotificationType;
  category: NotificationCategory;
  link: string;
  entityType?: string;
  entityId?: string;
  createdAt: string;
  isRead: boolean;
  readAt?: string | null;
}

export interface NotificationState {
  items: NotificationItem[];
  unreadCount: number;
  totalCount: number;
}
