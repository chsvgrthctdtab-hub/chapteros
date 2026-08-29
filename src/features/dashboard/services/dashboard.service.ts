import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import dayjs from 'dayjs';
import type {
  DashboardStats,
  DashboardTermOption,
  UpcomingActivityItem,
  UpcomingTaskItem,
  OverdueTaskItem,
  DashboardChartData,
  TaskStatusChartItem,
  ActivityCategoryChartItem,
  MonthlyFinanceTrendItem,
} from '../types/dashboard.types';
import { calculateDaysOverdue, ACTIVITY_CATEGORY_META } from '../utils/formatters';
import type { ActivityCategory, ActivityStatus, TaskStatus, TaskPriority } from '@/types';

/**
 * Fetch terms for active organization to populate the Term Switcher
 */
export async function fetchDashboardTerms(organizationId: string): Promise<DashboardTermOption[]> {
  if (!organizationId || !isSupabaseConfigured) return [];

  const { data, error } = await (supabase.from('terms') as any)
    .select('id, name, is_current, status, start_date, end_date')
    .eq('organization_id', organizationId)
    .order('is_current', { ascending: false })
    .order('start_date', { ascending: false });

  if (error) {
    console.error('Error fetching dashboard terms:', error);
    throw new Error('Không thể tải danh sách nhiệm kỳ');
  }

  return (data || []).map((t: any) => ({
    id: t.id,
    name: t.name,
    isCurrent: Boolean(t.is_current),
    status: t.status,
    startDate: t.start_date,
    endDate: t.end_date,
  }));
}

/**
 * Fetch aggregated KPI statistics for Members, Activities, Tasks, and Finance
 */
export async function fetchDashboardStats(
  organizationId: string,
  termId?: string
): Promise<DashboardStats> {
  if (!organizationId || !isSupabaseConfigured) {
    return {
      members: { total: 0, active: 0, alumni: 0, termMembersCount: 0 },
      activities: { total: 0, upcoming: 0, inProgress: 0, completed: 0, planning: 0 },
      tasks: { total: 0, active: 0, completed: 0, overdue: 0, highOrUrgent: 0, completionRate: 0 },
      finance: {
        totalIncome: 0,
        totalExpense: 0,
        balance: 0,
        transactionCount: 0,
        incomeCount: 0,
        expenseCount: 0,
        thisMonthIncome: 0,
        thisMonthExpense: 0,
        thisMonthBalance: 0,
      },
      participation: {
        overallRate: 0,
        totalParticipants: 0,
        averagePerActivity: 0,
        totalTargetMembers: 0,
      },
    };
  }

  const nowIso = new Date().toISOString();
  const currentMonthStart = dayjs().startOf('month');
  const currentMonthEnd = dayjs().endOf('month');

  // Parallel execution of aggregation queries
  const [
    membersResult,
    termMembersResult,
    activitiesResult,
    tasksResult,
    financeResult,
  ] = await Promise.all([
    // 1. Members count in organization
    (supabase.from('members') as any)
      .select('id, status')
      .eq('organization_id', organizationId),

    // 1b. Term members if termId is specified
    termId && termId !== 'all'
      ? (supabase.from('term_members') as any)
          .select('id', { count: 'exact', head: true })
          .eq('term_id', termId)
      : Promise.resolve({ count: null }),

    // 2. Activities in org & term with participants for participation rate
    (() => {
      let q = (supabase.from('activities') as any)
        .select('id, status, start_date, end_date, target_members, participants:activity_participants(id, attendance_status)')
        .eq('organization_id', organizationId);
      if (termId && termId !== 'all') {
        q = q.eq('term_id', termId);
      }
      return q;
    })(),

    // 3. Tasks in org & term
    (() => {
      let q = (supabase.from('tasks') as any)
        .select('id, status, priority, due_date')
        .eq('organization_id', organizationId);
      if (termId && termId !== 'all') {
        q = q.eq('term_id', termId);
      }
      return q;
    })(),

    // 4. Finance transactions in org & term
    (() => {
      let q = (supabase.from('finance_transactions') as any)
        .select('id, transaction_type, amount, transaction_date')
        .eq('organization_id', organizationId);
      if (termId && termId !== 'all') {
        q = q.eq('term_id', termId);
      }
      return q;
    })(),
  ]);

  // Process Members KPI
  const membersRows = membersResult.data || [];
  let activeMembers = 0;
  let alumniMembers = 0;
  membersRows.forEach((m: any) => {
    if (m.status === 'active') {
      activeMembers++;
    } else if (m.status === 'alumni') {
      alumniMembers++;
    }
  });

  const termMembersCount = termMembersResult.count !== null && termMembersResult.count !== undefined
    ? termMembersResult.count
    : activeMembers;

  // Process Activities & Participation KPI
  const activitiesRows = activitiesResult.data || [];
  let upcomingActivities = 0;
  let inProgressActivities = 0;
  let completedActivities = 0;
  let planningActivities = 0;
  let totalParticipants = 0;
  let totalTargetMembers = 0;

  activitiesRows.forEach((a: any) => {
    if (a.status === 'in_progress') {
      inProgressActivities++;
    } else if (a.status === 'completed') {
      completedActivities++;
    } else if (a.status === 'planning') {
      planningActivities++;
      upcomingActivities++;
    } else if (a.status === 'published') {
      upcomingActivities++;
    }

    if (a.target_members && a.target_members > 0) {
      totalTargetMembers += Number(a.target_members);
    }
    if (Array.isArray(a.participants)) {
      totalParticipants += a.participants.length;
    }
  });

  const totalActivitiesCount = activitiesRows.length;
  const averagePerActivity = totalActivitiesCount > 0
    ? Math.round((totalParticipants / totalActivitiesCount) * 10) / 10
    : 0;

  let overallParticipationRate = 0;
  if (totalTargetMembers > 0) {
    overallParticipationRate = Math.min(100, Math.round((totalParticipants / totalTargetMembers) * 100));
  } else if (activeMembers > 0 && totalActivitiesCount > 0) {
    overallParticipationRate = Math.min(100, Math.round((totalParticipants / (activeMembers * totalActivitiesCount)) * 100));
  } else if (totalParticipants > 0) {
    overallParticipationRate = 100;
  }

  // Process Tasks KPI
  const tasksRows = tasksResult.data || [];
  let completedTasks = 0;
  let cancelledTasks = 0;
  let activeTasks = 0; // todo, in_progress, in_review
  let overdueTasks = 0;
  let highOrUrgentTasks = 0;

  tasksRows.forEach((t: any) => {
    const isOverdue =
      t.due_date &&
      dayjs(t.due_date).isBefore(dayjs()) &&
      t.status !== 'completed' &&
      t.status !== 'cancelled';

    if (t.status === 'completed') {
      completedTasks++;
    } else if (t.status === 'cancelled') {
      cancelledTasks++;
    } else {
      activeTasks++;
    }

    if (isOverdue) {
      overdueTasks++;
    }

    if ((t.priority === 'high' || t.priority === 'urgent') && t.status !== 'completed' && t.status !== 'cancelled') {
      highOrUrgentTasks++;
    }
  });

  const totalTasks = tasksRows.length;
  const nonCancelledTasks = totalTasks - cancelledTasks;
  const completionRate =
    nonCancelledTasks > 0 ? Math.round((completedTasks / nonCancelledTasks) * 100) : 0;

  // Process Finance KPI
  const financeRows = financeResult.data || [];
  let totalIncome = 0;
  let totalExpense = 0;
  let incomeCount = 0;
  let expenseCount = 0;
  let thisMonthIncome = 0;
  let thisMonthExpense = 0;

  financeRows.forEach((tx: any) => {
    const amount = Math.abs(Number(tx.amount)) || 0;
    const isIncome = tx.transaction_type === 'income';
    const isExpense = tx.transaction_type === 'expense';
    const txDate = dayjs(tx.transaction_date);
    const isThisMonth = txDate.isAfter(currentMonthStart) && txDate.isBefore(currentMonthEnd);

    if (isIncome) {
      totalIncome += amount;
      incomeCount++;
      if (isThisMonth) {
        thisMonthIncome += amount;
      }
    } else if (isExpense) {
      totalExpense += amount;
      expenseCount++;
      if (isThisMonth) {
        thisMonthExpense += amount;
      }
    }
  });

  const balance = totalIncome - totalExpense;
  const thisMonthBalance = thisMonthIncome - thisMonthExpense;

  return {
    members: {
      total: membersRows.length,
      active: activeMembers,
      alumni: alumniMembers,
      termMembersCount,
    },
    activities: {
      total: activitiesRows.length,
      upcoming: upcomingActivities,
      inProgress: inProgressActivities,
      completed: completedActivities,
      planning: planningActivities,
    },
    tasks: {
      total: totalTasks,
      active: activeTasks,
      completed: completedTasks,
      overdue: overdueTasks,
      highOrUrgent: highOrUrgentTasks,
      completionRate,
    },
    finance: {
      totalIncome,
      totalExpense,
      balance,
      transactionCount: financeRows.length,
      incomeCount,
      expenseCount,
      thisMonthIncome,
      thisMonthExpense,
      thisMonthBalance,
    },
    participation: {
      overallRate: overallParticipationRate,
      totalParticipants,
      averagePerActivity,
      totalTargetMembers,
    },
  };
}

/**
 * Fetch top upcoming activities for the active organization & term
 */
export async function fetchUpcomingActivities(
  organizationId: string,
  termId?: string,
  limit = 5
): Promise<UpcomingActivityItem[]> {
  if (!organizationId || !isSupabaseConfigured) return [];

  const nowIso = new Date().toISOString();

  let query = (supabase.from('activities') as any)
    .select(
      `
      id,
      code,
      title,
      category,
      status,
      location,
      start_date,
      end_date,
      target_members,
      participants:activity_participants(id)
    `
    )
    .eq('organization_id', organizationId)
    .not('status', 'in', '("cancelled")')
    .gte('start_date', nowIso)
    .order('start_date', { ascending: true })
    .limit(limit);

  if (termId && termId !== 'all') {
    query = query.eq('term_id', termId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching upcoming activities:', error);
    throw new Error('Không thể tải danh sách hoạt động sắp tới');
  }

  // If no future activities, fetch the latest ongoing / upcoming planned activities
  if (!data || data.length === 0) {
    let fallbackQuery = (supabase.from('activities') as any)
      .select(
        `
        id,
        code,
        title,
        category,
        status,
        location,
        start_date,
        end_date,
        target_members,
        participants:activity_participants(id)
      `
      )
      .eq('organization_id', organizationId)
      .in('status', ['published', 'in_progress', 'planning'])
      .order('start_date', { ascending: false })
      .limit(limit);

    if (termId && termId !== 'all') {
      fallbackQuery = fallbackQuery.eq('term_id', termId);
    }

    const { data: fallbackData } = await fallbackQuery;

    return (fallbackData || []).map((row: any) => ({
      id: row.id,
      code: row.code,
      title: row.title,
      category: row.category as ActivityCategory,
      status: row.status as ActivityStatus,
      location: row.location,
      startDate: row.start_date,
      endDate: row.end_date,
      targetMembers: row.target_members,
      participantsCount: Array.isArray(row.participants) ? row.participants.length : 0,
    }));
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    code: row.code,
    title: row.title,
    category: row.category as ActivityCategory,
    status: row.status as ActivityStatus,
    location: row.location,
    startDate: row.start_date,
    endDate: row.end_date,
    targetMembers: row.target_members,
    participantsCount: Array.isArray(row.participants) ? row.participants.length : 0,
  }));
}

/**
 * Fetch top upcoming & active tasks with closest deadlines
 */
export async function fetchUpcomingTasks(
  organizationId: string,
  termId?: string,
  limit = 5
): Promise<UpcomingTaskItem[]> {
  if (!organizationId || !isSupabaseConfigured) return [];

  let query = (supabase.from('tasks') as any)
    .select(
      `
      id,
      title,
      status,
      priority,
      progress,
      due_date,
      assigned_to,
      assignee:profiles!tasks_assigned_to_fkey(
        id,
        full_name,
        avatar_url,
        student_id
      ),
      activity:activities(
        id,
        title,
        code
      )
    `
    )
    .eq('organization_id', organizationId)
    .in('status', ['todo', 'in_progress', 'in_review'])
    .order('due_date', { ascending: true, nullsFirst: false })
    .limit(limit);

  if (termId && termId !== 'all') {
    query = query.eq('term_id', termId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching upcoming tasks:', error);
    throw new Error('Không thể tải danh sách công việc sắp tới');
  }

  const now = dayjs();

  return (data || []).map((row: any) => {
    const isOverdue = row.due_date ? dayjs(row.due_date).isBefore(now) : false;
    return {
      id: row.id,
      title: row.title,
      status: row.status as TaskStatus,
      priority: row.priority as TaskPriority,
      progress: row.progress || 0,
      dueDate: row.due_date,
      isOverdue,
      assignedTo: row.assigned_to,
      assignee: row.assignee
        ? {
            id: row.assignee.id,
            fullName: row.assignee.full_name,
            avatarUrl: row.assignee.avatar_url,
            studentId: row.assignee.student_id,
          }
        : null,
      activity: row.activity
        ? {
            id: row.activity.id,
            title: row.activity.title,
            code: row.activity.code,
          }
        : null,
    };
  });
}

/**
 * Fetch overdue tasks needing urgent attention
 */
export async function fetchOverdueTasks(
  organizationId: string,
  termId?: string,
  limit = 5
): Promise<OverdueTaskItem[]> {
  if (!organizationId || !isSupabaseConfigured) return [];

  const nowIso = new Date().toISOString();

  let query = (supabase.from('tasks') as any)
    .select(
      `
      id,
      title,
      status,
      priority,
      due_date,
      assignee:profiles!tasks_assigned_to_fkey(
        id,
        full_name,
        avatar_url
      ),
      activity:activities(
        id,
        title,
        code
      )
    `
    )
    .eq('organization_id', organizationId)
    .in('status', ['todo', 'in_progress', 'in_review'])
    .lt('due_date', nowIso)
    .order('due_date', { ascending: true })
    .limit(limit);

  if (termId && termId !== 'all') {
    query = query.eq('term_id', termId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching overdue tasks:', error);
    throw new Error('Không thể tải danh sách công việc quá hạn');
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    title: row.title,
    status: row.status as TaskStatus,
    priority: row.priority as TaskPriority,
    dueDate: row.due_date,
    daysOverdue: calculateDaysOverdue(row.due_date),
    assignee: row.assignee
      ? {
          id: row.assignee.id,
          fullName: row.assignee.full_name,
          avatarUrl: row.assignee.avatar_url,
        }
      : null,
    activity: row.activity
      ? {
          id: row.activity.id,
          title: row.activity.title,
          code: row.activity.code,
        }
      : null,
  }));
}

/**
 * Fetch analytics chart data (Task distribution, activity categories, monthly cashflow)
 */
export async function fetchDashboardChartData(
  organizationId: string,
  termId?: string
): Promise<DashboardChartData> {
  if (!organizationId || !isSupabaseConfigured) {
    return {
      taskStatusDistribution: [],
      activityCategoryDistribution: [],
      monthlyFinanceTrend: [],
    };
  }

  const sixMonthsAgo = dayjs().subtract(5, 'month').startOf('month').toISOString();

  // Queries for charts
  const [tasksResult, activitiesResult, financeResult] = await Promise.all([
    (() => {
      let q = (supabase.from('tasks') as any)
        .select('id, status')
        .eq('organization_id', organizationId);
      if (termId && termId !== 'all') q = q.eq('term_id', termId);
      return q;
    })(),

    (() => {
      let q = (supabase.from('activities') as any)
        .select('id, category')
        .eq('organization_id', organizationId);
      if (termId && termId !== 'all') q = q.eq('term_id', termId);
      return q;
    })(),

    (() => {
      let q = (supabase.from('finance_transactions') as any)
        .select('transaction_type, amount, transaction_date')
        .eq('organization_id', organizationId)
        .gte('transaction_date', sixMonthsAgo);
      if (termId && termId !== 'all') q = q.eq('term_id', termId);
      return q;
    })(),
  ]);

  // 1. Task Status Distribution
  const taskCounts: Record<TaskStatus, number> = {
    todo: 0,
    in_progress: 0,
    in_review: 0,
    completed: 0,
    cancelled: 0,
  };

  (tasksResult.data || []).forEach((t: any) => {
    if (taskCounts[t.status as TaskStatus] !== undefined) {
      taskCounts[t.status as TaskStatus]++;
    }
  });

  const taskStatusDistribution: TaskStatusChartItem[] = [
    { status: 'todo', name: 'Cần làm', count: taskCounts.todo, color: '#94a3b8' },
    { status: 'in_progress', name: 'Đang làm', count: taskCounts.in_progress, color: '#3b82f6' },
    { status: 'in_review', name: 'Đang duyệt', count: taskCounts.in_review, color: '#a855f7' },
    { status: 'completed', name: 'Hoàn thành', count: taskCounts.completed, color: '#10b981' },
    { status: 'cancelled', name: 'Đã hủy', count: taskCounts.cancelled, color: '#cbd5e1' },
  ];

  // 2. Activity Category Distribution
  const categoryCounts: Record<string, number> = {};
  (activitiesResult.data || []).forEach((a: any) => {
    const cat = a.category || 'general';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  const categoryColorMap: Record<string, string> = {
    general: '#64748b',
    volunteer: '#10b981',
    academic: '#3b82f6',
    sports: '#f59e0b',
    culture: '#ec4899',
    meeting: '#8b5cf6',
    training: '#06b6d4',
  };

  const activityCategoryDistribution: ActivityCategoryChartItem[] = Object.keys(categoryCounts).map(
    (catKey) => ({
      category: catKey as ActivityCategory,
      name: ACTIVITY_CATEGORY_META[catKey] || catKey,
      count: categoryCounts[catKey],
      color: categoryColorMap[catKey] || '#64748b',
    })
  );

  // 3. Monthly Finance Trend (Past 6 months)
  const monthlyMap = new Map<string, { income: number; expense: number }>();
  for (let i = 5; i >= 0; i--) {
    const m = dayjs().subtract(i, 'month');
    const monthKey = m.format('MM/YYYY');
    monthlyMap.set(monthKey, { income: 0, expense: 0 });
  }

  (financeResult.data || []).forEach((tx: any) => {
    const monthKey = dayjs(tx.transaction_date).format('MM/YYYY');
    if (monthlyMap.has(monthKey)) {
      const current = monthlyMap.get(monthKey)!;
      const amt = Math.abs(Number(tx.amount)) || 0;
      if (tx.transaction_type === 'income') {
        current.income += amt;
      } else if (tx.transaction_type === 'expense') {
        current.expense += amt;
      }
    }
  });

  const monthlyFinanceTrend: MonthlyFinanceTrendItem[] = Array.from(monthlyMap.entries()).map(
    ([month, data]) => ({
      month,
      income: data.income,
      expense: data.expense,
      balance: data.income - data.expense,
    })
  );

  return {
    taskStatusDistribution,
    activityCategoryDistribution,
    monthlyFinanceTrend,
  };
}
