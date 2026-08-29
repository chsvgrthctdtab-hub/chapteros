import type {
  ActivityCategory,
  ActivityStatus,
  MemberStatus,
  TaskPriority,
  TaskStatus,
  TermStatus,
} from './database.types';

export interface ReportFilterParams {
  termId?: string;
  startDate?: string;
  endDate?: string;
}

export interface ReportCurrentTermSummary {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: TermStatus;
  isCurrent: boolean;
  memberCount: number;
}

export interface ReportOverview {
  organizationId: string;
  memberCount: number;
  activeMemberCount: number;
  termCount: number;
  currentTerm: ReportCurrentTermSummary | null;
  activityCount: number;
  taskCount: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export interface MemberPositionDistribution {
  position: string;
  count: number;
}

export interface MemberMajorDistribution {
  major: string;
  count: number;
}

export interface MemberCohortDistribution {
  cohort: string;
  count: number;
}

export interface MemberDepartmentDistribution {
  department: string;
  count: number;
}

export interface MemberStatistics {
  organizationId: string;
  termId?: string;
  totalMembers: number;
  activeMembers: number;
  alumniMembers: number;
  transferredMembers: number;
  positionDistribution: MemberPositionDistribution[];
  majorDistribution: MemberMajorDistribution[];
  cohortDistribution: MemberCohortDistribution[];
  termMembersCount: number | null;
  termMembersByDepartment: MemberDepartmentDistribution[];
  termMembersByPosition: MemberPositionDistribution[];
}

export interface ReportTermItem {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: TermStatus;
  isCurrent: boolean;
  memberCount: number;
  activityCount: number;
  taskCount: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export interface TermStatistics {
  organizationId: string;
  totalTerms: number;
  draftTerms: number;
  activeTerms: number;
  completedTerms: number;
  archivedTerms: number;
  currentTerm: ReportCurrentTermSummary | null;
  termsList: ReportTermItem[];
}

export interface ActivityCategoryDistribution {
  category: ActivityCategory;
  count: number;
}

export interface ActivityStatusDistribution {
  status: ActivityStatus;
  count: number;
}

export interface MonthlyActivityTrend {
  month: string; // YYYY-MM
  label: string; // MM/YYYY
  count: number;
}

export interface ActivityStatistics {
  organizationId: string;
  termId?: string;
  totalActivities: number;
  draftActivities: number;
  planningActivities: number;
  publishedActivities: number;
  inProgressActivities: number;
  completedActivities: number;
  cancelledActivities: number;
  byCategory: ActivityCategoryDistribution[];
  byStatus: ActivityStatusDistribution[];
  byMonth: MonthlyActivityTrend[];
  totalTargetMembers: number;
}

export interface TaskPriorityDistribution {
  priority: TaskPriority;
  count: number;
}

export interface TaskStatusDistribution {
  status: TaskStatus;
  count: number;
}

export interface TaskStatistics {
  organizationId: string;
  termId?: string;
  totalTasks: number;
  todoTasks: number;
  inProgressTasks: number;
  inReviewTasks: number;
  completedTasks: number;
  cancelledTasks: number;
  overdueTasks: number;
  completionRate: number; // percentage 0 - 100
  averageProgress: number; // percentage 0 - 100
  byPriority: TaskPriorityDistribution[];
  byStatus: TaskStatusDistribution[];
}

export interface FundCategoryBreakdown {
  categoryId: string;
  categoryName: string;
  amount: number;
  count: number;
  percentage: number; // 0 - 100
}

export interface MonthlyFinanceTrend {
  month: string; // YYYY-MM
  label: string; // MM/YYYY
  income: number;
  expense: number;
  balance: number;
}

export interface FundStatistics {
  organizationId: string;
  termId?: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  incomeTransactionCount: number;
  expenseTransactionCount: number;
  incomeByCategory: FundCategoryBreakdown[];
  expenseByCategory: FundCategoryBreakdown[];
  byMonth: MonthlyFinanceTrend[];
}
