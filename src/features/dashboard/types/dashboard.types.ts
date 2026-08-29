import type { ActivityCategory, ActivityStatus, TaskStatus, TaskPriority, FinanceType } from '@/types';

export interface DashboardTermOption {
  id: string;
  name: string;
  isCurrent: boolean;
  status: string;
  startDate?: string;
  endDate?: string;
}

export interface DashboardMemberKpi {
  total: number;
  active: number;
  alumni: number;
  termMembersCount: number;
}

export interface DashboardActivityKpi {
  total: number;
  upcoming: number;
  inProgress: number;
  completed: number;
  planning: number;
}

export interface DashboardTaskKpi {
  total: number;
  active: number;
  completed: number;
  overdue: number;
  highOrUrgent: number;
  completionRate: number;
}

export interface DashboardFinanceKpi {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
  incomeCount: number;
  expenseCount: number;
  thisMonthIncome: number;
  thisMonthExpense: number;
  thisMonthBalance: number;
}

export interface DashboardParticipationKpi {
  overallRate: number; // 0 - 100%
  totalParticipants: number;
  averagePerActivity: number;
  totalTargetMembers: number;
}

export interface DashboardStats {
  members: DashboardMemberKpi;
  activities: DashboardActivityKpi;
  tasks: DashboardTaskKpi;
  finance: DashboardFinanceKpi;
  participation: DashboardParticipationKpi;
}

export interface UpcomingActivityItem {
  id: string;
  code: string;
  title: string;
  category: ActivityCategory;
  status: ActivityStatus;
  location?: string | null;
  startDate: string;
  endDate?: string | null;
  targetMembers?: number | null;
  participantsCount: number;
}

export interface UpcomingTaskItem {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  progress: number;
  dueDate?: string | null;
  isOverdue: boolean;
  assignedTo?: string | null;
  assignee?: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
    studentId?: string | null;
  } | null;
  activity?: {
    id: string;
    title: string;
    code: string;
  } | null;
}

export interface OverdueTaskItem {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  daysOverdue: number;
  assignee?: {
    id: string;
    fullName: string;
    avatarUrl?: string | null;
  } | null;
  activity?: {
    id: string;
    title: string;
    code: string;
  } | null;
}

export interface TaskStatusChartItem {
  status: TaskStatus;
  name: string;
  count: number;
  color: string;
}

export interface ActivityCategoryChartItem {
  category: ActivityCategory;
  name: string;
  count: number;
  color: string;
}

export interface MonthlyFinanceTrendItem {
  month: string;
  income: number;
  expense: number;
  balance: number;
}

export interface DashboardChartData {
  taskStatusDistribution: TaskStatusChartItem[];
  activityCategoryDistribution: ActivityCategoryChartItem[];
  monthlyFinanceTrend: MonthlyFinanceTrendItem[];
}
