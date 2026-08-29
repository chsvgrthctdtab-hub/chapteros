import { useState } from 'react';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  CheckCheck,
  Inbox,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '../queries/notification.queries';
import { NotificationItemRow } from './NotificationItemRow';
import { EmptyState } from '@/components/common/EmptyState';

export function NotificationCenterPopover() {
  const { activeOrganization, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'task' | 'activity'>('all');

  const { data, isLoading } = useNotifications(
    activeOrganization?.id,
    user?.id
  );

  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  const items = data?.items || [];
  const unreadCount = data?.unreadCount || 0;

  const filteredItems = items.filter((item) => {
    if (activeTab === 'unread') return !item.isRead;
    if (activeTab === 'task') return item.category === 'task';
    if (activeTab === 'activity') return item.category === 'activity';
    return true;
  });

  const handleMarkRead = (key: string) => {
    if (!activeOrganization || !user) return;
    markReadMutation.mutate({
      organizationId: activeOrganization.id,
      userId: user.id,
      notificationKey: key,
    });
  };

  const handleMarkAllRead = () => {
    if (!activeOrganization || !user) return;
    const unreadKeys = items.filter((i) => !i.isRead).map((i) => i.key);
    if (unreadKeys.length === 0) return;

    markAllReadMutation.mutate({
      organizationId: activeOrganization.id,
      userId: user.id,
      notificationKeys: unreadKeys,
    });
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          id="btn-notifications"
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
          aria-label="Thông báo"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-rose-600 text-white font-bold text-[10px] rounded-full flex items-center justify-center border-2 border-white shadow-xs animate-in zoom-in-50">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 sm:w-96 p-0 border border-slate-200 shadow-lg rounded-xl overflow-hidden bg-white z-50"
      >
        {/* Header */}
        <div className="p-3.5 px-4 bg-slate-50/90 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-slate-900">
              Notifications
            </h3>
            {unreadCount > 0 ? (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                {unreadCount} new
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-slate-500 bg-white">
                0 unread
              </Badge>
            )}
          </div>

          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={markAllReadMutation.isPending}
              className="text-[11px] h-7 px-2 text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5 mr-1" />
              <span>Mark all as read</span>
            </Button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="p-2 px-3 border-b border-slate-100 bg-white flex items-center gap-1 overflow-x-auto text-[11px]">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              activeTab === 'all'
                ? 'bg-blue-50 text-blue-700 font-bold'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            All ({items.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('unread')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              activeTab === 'unread'
                ? 'bg-blue-50 text-blue-700 font-bold'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Unread ({unreadCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('task')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              activeTab === 'task'
                ? 'bg-blue-50 text-blue-700 font-bold'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Tasks
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('activity')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              activeTab === 'activity'
                ? 'bg-blue-50 text-blue-700 font-bold'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            Activities
          </button>
        </div>

        {/* Notification List Body */}
        <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3 bg-slate-100 rounded w-3/4" />
                    <div className="h-2.5 bg-slate-100 rounded w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <NotificationItemRow
                key={item.id}
                item={item}
                onMarkRead={handleMarkRead}
                onClosePopover={() => setIsOpen(false)}
              />
            ))
          ) : (
            <div className="py-8 px-4 text-center">
              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                <Inbox className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-slate-700">
                No notifications
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {activeTab === 'unread'
                  ? 'You have caught up with all notifications.'
                  : 'All activities and tasks are operating smoothly.'}
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
