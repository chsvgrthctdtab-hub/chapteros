import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Database } from '@/types/database.types';
import type {
  ReportOverview,
  ReportFilterParams,
  ReportCurrentTermSummary,
  MemberStatistics,
  TermStatistics,
  ReportTermItem,
  ActivityStatistics,
  TaskStatistics,
  FundStatistics,
  FundCategoryBreakdown,
  MonthlyFinanceTrend,
  MonthlyActivityTrend,
  ActivityCategoryDistribution,
  ActivityStatusDistribution,
  TaskPriorityDistribution,
  TaskStatusDistribution,
  MemberPositionDistribution,
  MemberMajorDistribution,
  MemberCohortDistribution,
  MemberDepartmentDistribution,
} from '@/types/report';
import dayjs from 'dayjs';

type DbMember = Database['public']['Tables']['members']['Row'];
type DbTerm = Database['public']['Tables']['terms']['Row'];
type DbTermMember = Database['public']['Tables']['term_members']['Row'];
type DbActivity = Database['public']['Tables']['activities']['Row'];
type DbTask = Database['public']['Tables']['tasks']['Row'];
type DbFinanceCategory = Database['public']['Tables']['finance_categories']['Row'];
type DbFinanceTransaction = Database['public']['Tables']['finance_transactions']['Row'];

export const reportRepository = {
  /**
   * Fetch overview aggregated statistics for an organization
   */
  async getOverview(
    organizationId: string,
    filter?: ReportFilterParams
  ): Promise<ReportOverview> {
    if (!isSupabaseConfigured || !organizationId) {
      return {
        organizationId: organizationId || '',
        memberCount: 0,
        activeMemberCount: 0,
        termCount: 0,
        currentTerm: null,
        activityCount: 0,
        taskCount: 0,
        totalIncome: 0,
        totalExpense: 0,
        balance: 0,
      };
    }

    const termId = filter?.termId && filter.termId !== 'all' ? filter.termId : undefined;

    // Parallel fetch scoped strictly by organization_id
    const [
      membersResult,
      termsResult,
      activitiesResult,
      tasksResult,
      financeResult,
    ] = await Promise.all([
      // 1. Members count and status in organization
      supabase
        .from('members')
        .select('id, status')
        .eq('organization_id', organizationId),

      // 2. Terms in organization
      supabase
        .from('terms')
        .select('id, name, start_date, end_date, status, is_current')
        .eq('organization_id', organizationId)
        .order('is_current', { ascending: false })
        .order('start_date', { ascending: false }),

      // 3. Activities count in organization (optionally filtered by term_id)
      (() => {
        let q = supabase
          .from('activities')
          .select('id, status, start_date, end_date')
          .eq('organization_id', organizationId);
        if (termId) {
          q = q.eq('term_id', termId);
        }
        return q;
      })(),

      // 4. Tasks count in organization (optionally filtered by term_id)
      (() => {
        let q = supabase
          .from('tasks')
          .select('id, status, progress, due_date')
          .eq('organization_id', organizationId);
        if (termId) {
          q = q.eq('term_id', termId);
        }
        return q;
      })(),

      // 5. Finance transactions in organization (optionally filtered by term_id)
      (() => {
        let q = supabase
          .from('finance_transactions')
          .select('id, transaction_type, amount')
          .eq('organization_id', organizationId);
        if (termId) {
          q = q.eq('term_id', termId);
        }
        return q;
      })(),
    ]);

    if (membersResult.error) {
      console.error('[reportRepository.getOverview] members error:', membersResult.error);
      throw new Error(`Không thể lấy số liệu hội viên: ${membersResult.error.message}`);
    }
    if (termsResult.error) {
      console.error('[reportRepository.getOverview] terms error:', termsResult.error);
      throw new Error(`Không thể lấy số liệu nhiệm kỳ: ${termsResult.error.message}`);
    }
    if (activitiesResult.error) {
      console.error('[reportRepository.getOverview] activities error:', activitiesResult.error);
      throw new Error(`Không thể lấy số liệu hoạt động: ${activitiesResult.error.message}`);
    }
    if (tasksResult.error) {
      console.error('[reportRepository.getOverview] tasks error:', tasksResult.error);
      throw new Error(`Không thể lấy số liệu nhiệm vụ: ${tasksResult.error.message}`);
    }
    if (financeResult.error) {
      console.error('[reportRepository.getOverview] finance error:', financeResult.error);
      throw new Error(`Không thể lấy số liệu tài chính: ${financeResult.error.message}`);
    }

    const members = (membersResult.data || []) as Pick<DbMember, 'id' | 'status'>[];
    const terms = (termsResult.data || []) as Pick<
      DbTerm,
      'id' | 'name' | 'start_date' | 'end_date' | 'status' | 'is_current'
    >[];
    const activities = (activitiesResult.data || []) as Pick<
      DbActivity,
      'id' | 'status' | 'start_date' | 'end_date'
    >[];
    const tasks = (tasksResult.data || []) as Pick<
      DbTask,
      'id' | 'status' | 'progress' | 'due_date'
    >[];
    const transactions = (financeResult.data || []) as Pick<
      DbFinanceTransaction,
      'id' | 'transaction_type' | 'amount'
    >[];

    const memberCount = members.length;
    const activeMemberCount = members.filter((m) => m.status === 'active').length;
    const termCount = terms.length;

    // Find current or selected term
    const targetTerm = termId
      ? terms.find((t) => t.id === termId)
      : terms.find((t) => t.is_current) || terms[0] || null;

    let currentTermSummary: ReportCurrentTermSummary | null = null;
    if (targetTerm) {
      // Query term member count for this specific term
      const { count: termMembersCount, error: termMemberErr } = await supabase
        .from('term_members')
        .select('id', { count: 'exact', head: true })
        .eq('term_id', targetTerm.id);

      if (termMemberErr) {
        console.warn('[reportRepository.getOverview] term_members count error:', termMemberErr);
      }

      currentTermSummary = {
        id: targetTerm.id,
        name: targetTerm.name,
        startDate: targetTerm.start_date,
        endDate: targetTerm.end_date,
        status: targetTerm.status,
        isCurrent: targetTerm.is_current,
        memberCount: termMembersCount || 0,
      };
    }

    // Finance calculations
    let totalIncome = 0;
    let totalExpense = 0;
    transactions.forEach((tx) => {
      if (tx.transaction_type === 'income') {
        totalIncome += Number(tx.amount) || 0;
      } else if (tx.transaction_type === 'expense') {
        totalExpense += Number(tx.amount) || 0;
      }
    });

    return {
      organizationId,
      memberCount,
      activeMemberCount,
      termCount,
      currentTerm: currentTermSummary,
      activityCount: activities.length,
      taskCount: tasks.length,
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
    };
  },

  /**
   * Fetch detailed member demographics and distribution statistics
   */
  async getMemberStatistics(
    organizationId: string,
    filter?: ReportFilterParams
  ): Promise<MemberStatistics> {
    if (!isSupabaseConfigured || !organizationId) {
      return {
        organizationId: organizationId || '',
        totalMembers: 0,
        activeMembers: 0,
        alumniMembers: 0,
        transferredMembers: 0,
        positionDistribution: [],
        majorDistribution: [],
        cohortDistribution: [],
        termMembersCount: null,
        termMembersByDepartment: [],
        termMembersByPosition: [],
      };
    }

    const termId = filter?.termId && filter.termId !== 'all' ? filter.termId : undefined;

    // 1. Fetch all members belonging to organization
    const { data: membersData, error: membersErr } = await supabase
      .from('members')
      .select('id, status, position, major, cohort, class_name')
      .eq('organization_id', organizationId);

    if (membersErr) {
      console.error('[reportRepository.getMemberStatistics] members error:', membersErr);
      throw new Error(`Không thể lấy thống kê hội viên: ${membersErr.message}`);
    }

    const members = (membersData || []) as Pick<
      DbMember,
      'id' | 'status' | 'position' | 'major' | 'cohort' | 'class_name'
    >[];

    let totalMembers = members.length;
    let activeMembers = 0;
    let alumniMembers = 0;
    let transferredMembers = 0;

    const positionMap: Record<string, number> = {};
    const majorMap: Record<string, number> = {};
    const cohortMap: Record<string, number> = {};

    members.forEach((m) => {
      if (m.status === 'active') activeMembers++;
      else if (m.status === 'alumni') alumniMembers++;
      else if (m.status === 'transferred') transferredMembers++;

      const pos = (m.position || 'Hội viên').trim();
      positionMap[pos] = (positionMap[pos] || 0) + 1;

      if (m.major && m.major.trim()) {
        const major = m.major.trim();
        majorMap[major] = (majorMap[major] || 0) + 1;
      }

      if (m.cohort && m.cohort.trim()) {
        const cohort = m.cohort.trim();
        cohortMap[cohort] = (cohortMap[cohort] || 0) + 1;
      }
    });

    const positionDistribution: MemberPositionDistribution[] = Object.entries(positionMap)
      .map(([position, count]) => ({ position, count }))
      .sort((a, b) => b.count - a.count);

    const majorDistribution: MemberMajorDistribution[] = Object.entries(majorMap)
      .map(([major, count]) => ({ major, count }))
      .sort((a, b) => b.count - a.count);

    const cohortDistribution: MemberCohortDistribution[] = Object.entries(cohortMap)
      .map(([cohort, count]) => ({ cohort, count }))
      .sort((a, b) => a.cohort.localeCompare(b.cohort));

    // 2. Fetch term_members if termId is specified
    let termMembersCount: number | null = null;
    let termMembersByDepartment: MemberDepartmentDistribution[] = [];
    let termMembersByPosition: MemberPositionDistribution[] = [];

    if (termId) {
      // First verify term belongs to this organization
      const { data: termCheck, error: termCheckErr } = await supabase
        .from('terms')
        .select('id')
        .eq('id', termId)
        .eq('organization_id', organizationId)
        .single();

      if (termCheckErr || !termCheck) {
        console.warn('[reportRepository.getMemberStatistics] term does not belong to organization:', {
          organizationId,
          termId,
        });
      } else {
        const { data: termMembersData, error: termMembersErr } = await supabase
          .from('term_members')
          .select('id, member_id, position, department, status')
          .eq('term_id', termId);

        if (termMembersErr) {
          console.error('[reportRepository.getMemberStatistics] term_members error:', termMembersErr);
          throw new Error(`Không thể lấy danh sách nhân sự nhiệm kỳ: ${termMembersErr.message}`);
        }

        const termMembers = (termMembersData || []) as Pick<
          DbTermMember,
          'id' | 'member_id' | 'position' | 'department' | 'status'
        >[];

        termMembersCount = termMembers.length;

        const deptMap: Record<string, number> = {};
        const termPosMap: Record<string, number> = {};

        termMembers.forEach((tm) => {
          const dept = (tm.department || 'Chung').trim();
          deptMap[dept] = (deptMap[dept] || 0) + 1;

          const pos = (tm.position || 'Thành viên').trim();
          termPosMap[pos] = (termPosMap[pos] || 0) + 1;
        });

        termMembersByDepartment = Object.entries(deptMap)
          .map(([department, count]) => ({ department, count }))
          .sort((a, b) => b.count - a.count);

        termMembersByPosition = Object.entries(termPosMap)
          .map(([position, count]) => ({ position, count }))
          .sort((a, b) => b.count - a.count);
      }
    }

    return {
      organizationId,
      termId,
      totalMembers,
      activeMembers,
      alumniMembers,
      transferredMembers,
      positionDistribution,
      majorDistribution,
      cohortDistribution,
      termMembersCount,
      termMembersByDepartment,
      termMembersByPosition,
    };
  },

  /**
   * Fetch term-by-term comparative statistics for an organization
   */
  async getTermStatistics(organizationId: string): Promise<TermStatistics> {
    if (!isSupabaseConfigured || !organizationId) {
      return {
        organizationId: organizationId || '',
        totalTerms: 0,
        draftTerms: 0,
        activeTerms: 0,
        completedTerms: 0,
        archivedTerms: 0,
        currentTerm: null,
        termsList: [],
      };
    }

    // 1. Fetch terms of this organization
    const { data: termsData, error: termsErr } = await supabase
      .from('terms')
      .select('id, organization_id, name, start_date, end_date, status, is_current')
      .eq('organization_id', organizationId)
      .order('start_date', { ascending: false });

    if (termsErr) {
      console.error('[reportRepository.getTermStatistics] terms error:', termsErr);
      throw new Error(`Không thể lấy danh sách nhiệm kỳ: ${termsErr.message}`);
    }

    const terms = (termsData || []) as DbTerm[];
    const termIds = terms.map((t) => t.id);

    let draftTerms = 0;
    let activeTerms = 0;
    let completedTerms = 0;
    let archivedTerms = 0;
    let currentTermSummary: ReportCurrentTermSummary | null = null;

    terms.forEach((t) => {
      if (t.status === 'draft') draftTerms++;
      else if (t.status === 'active') activeTerms++;
      else if (t.status === 'completed') completedTerms++;
      else if (t.status === 'archived') archivedTerms++;
    });

    if (termIds.length === 0) {
      return {
        organizationId,
        totalTerms: 0,
        draftTerms: 0,
        activeTerms: 0,
        completedTerms: 0,
        archivedTerms: 0,
        currentTerm: null,
        termsList: [],
      };
    }

    // Parallel fetch child aggregates scoped to terms of this organization
    const [termMembersRes, activitiesRes, tasksRes, financeRes] = await Promise.all([
      supabase
        .from('term_members')
        .select('term_id, id')
        .in('term_id', termIds),
      supabase
        .from('activities')
        .select('term_id, id')
        .eq('organization_id', organizationId),
      supabase
        .from('tasks')
        .select('term_id, id')
        .eq('organization_id', organizationId),
      supabase
        .from('finance_transactions')
        .select('term_id, transaction_type, amount')
        .eq('organization_id', organizationId),
    ]);

    const termMembersList = (termMembersRes.data || []) as Pick<DbTermMember, 'term_id' | 'id'>[];
    const activitiesList = (activitiesRes.data || []) as Pick<DbActivity, 'term_id' | 'id'>[];
    const tasksList = (tasksRes.data || []) as Pick<DbTask, 'term_id' | 'id'>[];
    const financeList = (financeRes.data || []) as Pick<
      DbFinanceTransaction,
      'term_id' | 'transaction_type' | 'amount'
    >[];

    // Build lookup maps by term_id
    const memberCountByTerm: Record<string, number> = {};
    termMembersList.forEach((tm) => {
      memberCountByTerm[tm.term_id] = (memberCountByTerm[tm.term_id] || 0) + 1;
    });

    const activityCountByTerm: Record<string, number> = {};
    activitiesList.forEach((act) => {
      activityCountByTerm[act.term_id] = (activityCountByTerm[act.term_id] || 0) + 1;
    });

    const taskCountByTerm: Record<string, number> = {};
    tasksList.forEach((task) => {
      taskCountByTerm[task.term_id] = (taskCountByTerm[task.term_id] || 0) + 1;
    });

    const incomeByTerm: Record<string, number> = {};
    const expenseByTerm: Record<string, number> = {};
    financeList.forEach((tx) => {
      if (tx.transaction_type === 'income') {
        incomeByTerm[tx.term_id] = (incomeByTerm[tx.term_id] || 0) + (Number(tx.amount) || 0);
      } else if (tx.transaction_type === 'expense') {
        expenseByTerm[tx.term_id] = (expenseByTerm[tx.term_id] || 0) + (Number(tx.amount) || 0);
      }
    });

    const termsList: ReportTermItem[] = terms.map((t) => {
      const memberCount = memberCountByTerm[t.id] || 0;
      const activityCount = activityCountByTerm[t.id] || 0;
      const taskCount = taskCountByTerm[t.id] || 0;
      const totalIncome = incomeByTerm[t.id] || 0;
      const totalExpense = expenseByTerm[t.id] || 0;
      const balance = totalIncome - totalExpense;

      if (t.is_current && !currentTermSummary) {
        currentTermSummary = {
          id: t.id,
          name: t.name,
          startDate: t.start_date,
          endDate: t.end_date,
          status: t.status,
          isCurrent: t.is_current,
          memberCount,
        };
      }

      return {
        id: t.id,
        name: t.name,
        startDate: t.start_date,
        endDate: t.end_date,
        status: t.status,
        isCurrent: t.is_current,
        memberCount,
        activityCount,
        taskCount,
        totalIncome,
        totalExpense,
        balance,
      };
    });

    if (!currentTermSummary && termsList.length > 0) {
      const first = termsList[0];
      currentTermSummary = {
        id: first.id,
        name: first.name,
        startDate: first.startDate,
        endDate: first.endDate,
        status: first.status,
        isCurrent: first.isCurrent,
        memberCount: first.memberCount,
      };
    }

    return {
      organizationId,
      totalTerms: terms.length,
      draftTerms,
      activeTerms,
      completedTerms,
      archivedTerms,
      currentTerm: currentTermSummary,
      termsList,
    };
  },

  /**
   * Fetch activity statistics, category breakdowns, and monthly trends
   */
  async getActivityStatistics(
    organizationId: string,
    filter?: ReportFilterParams
  ): Promise<ActivityStatistics> {
    if (!isSupabaseConfigured || !organizationId) {
      return {
        organizationId: organizationId || '',
        totalActivities: 0,
        draftActivities: 0,
        planningActivities: 0,
        publishedActivities: 0,
        inProgressActivities: 0,
        completedActivities: 0,
        cancelledActivities: 0,
        byCategory: [],
        byStatus: [],
        byMonth: [],
        totalTargetMembers: 0,
      };
    }

    let query = supabase
      .from('activities')
      .select('id, term_id, category, status, start_date, end_date, target_members')
      .eq('organization_id', organizationId);

    if (filter?.termId && filter.termId !== 'all') {
      query = query.eq('term_id', filter.termId);
    }
    if (filter?.startDate) {
      query = query.gte('start_date', filter.startDate);
    }
    if (filter?.endDate) {
      query = query.lte('start_date', filter.endDate);
    }

    const { data, error } = await query.order('start_date', { ascending: true });

    if (error) {
      console.error('[reportRepository.getActivityStatistics] activities error:', error);
      throw new Error(`Không thể lấy thống kê hoạt động: ${error.message}`);
    }

    const activities = (data || []) as Pick<
      DbActivity,
      'id' | 'term_id' | 'category' | 'status' | 'start_date' | 'end_date' | 'target_members'
    >[];

    let draftActivities = 0;
    let planningActivities = 0;
    let publishedActivities = 0;
    let inProgressActivities = 0;
    let completedActivities = 0;
    let cancelledActivities = 0;
    let totalTargetMembers = 0;

    const categoryMap: Record<string, number> = {};
    const statusMap: Record<string, number> = {};
    const monthlyMap: Record<string, number> = {};

    activities.forEach((act) => {
      if (act.status === 'draft') draftActivities++;
      else if (act.status === 'planning') planningActivities++;
      else if (act.status === 'published') publishedActivities++;
      else if (act.status === 'in_progress') inProgressActivities++;
      else if (act.status === 'completed') completedActivities++;
      else if (act.status === 'cancelled') cancelledActivities++;

      statusMap[act.status] = (statusMap[act.status] || 0) + 1;
      categoryMap[act.category] = (categoryMap[act.category] || 0) + 1;

      if (act.target_members) {
        totalTargetMembers += Number(act.target_members) || 0;
      }

      if (act.start_date) {
        const monthKey = dayjs(act.start_date).format('YYYY-MM');
        monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + 1;
      }
    });

    const byCategory: ActivityCategoryDistribution[] = Object.entries(categoryMap)
      .map(([category, count]) => ({
        category: category as DbActivity['category'],
        count,
      }))
      .sort((a, b) => b.count - a.count);

    const byStatus: ActivityStatusDistribution[] = Object.entries(statusMap)
      .map(([status, count]) => ({
        status: status as DbActivity['status'],
        count,
      }))
      .sort((a, b) => b.count - a.count);

    const byMonth: MonthlyActivityTrend[] = Object.entries(monthlyMap)
      .map(([month, count]) => ({
        month,
        label: dayjs(month, 'YYYY-MM').format('MM/YYYY'),
        count,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return {
      organizationId,
      termId: filter?.termId,
      totalActivities: activities.length,
      draftActivities,
      planningActivities,
      publishedActivities,
      inProgressActivities,
      completedActivities,
      cancelledActivities,
      byCategory,
      byStatus,
      byMonth,
      totalTargetMembers,
    };
  },

  /**
   * Fetch task completion rates, priorities, and status distributions
   */
  async getTaskStatistics(
    organizationId: string,
    filter?: ReportFilterParams
  ): Promise<TaskStatistics> {
    if (!isSupabaseConfigured || !organizationId) {
      return {
        organizationId: organizationId || '',
        totalTasks: 0,
        todoTasks: 0,
        inProgressTasks: 0,
        inReviewTasks: 0,
        completedTasks: 0,
        cancelledTasks: 0,
        overdueTasks: 0,
        completionRate: 0,
        averageProgress: 0,
        byPriority: [],
        byStatus: [],
      };
    }

    let query = supabase
      .from('tasks')
      .select('id, term_id, status, priority, progress, due_date')
      .eq('organization_id', organizationId);

    if (filter?.termId && filter.termId !== 'all') {
      query = query.eq('term_id', filter.termId);
    }
    if (filter?.startDate) {
      query = query.gte('due_date', filter.startDate);
    }
    if (filter?.endDate) {
      query = query.lte('due_date', filter.endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[reportRepository.getTaskStatistics] tasks error:', error);
      throw new Error(`Không thể lấy thống kê nhiệm vụ: ${error.message}`);
    }

    const tasks = (data || []) as Pick<
      DbTask,
      'id' | 'term_id' | 'status' | 'priority' | 'progress' | 'due_date'
    >[];

    let todoTasks = 0;
    let inProgressTasks = 0;
    let inReviewTasks = 0;
    let completedTasks = 0;
    let cancelledTasks = 0;
    let overdueTasks = 0;
    let totalProgressSum = 0;

    const priorityMap: Record<string, number> = {};
    const statusMap: Record<string, number> = {};
    const now = dayjs();

    tasks.forEach((t) => {
      if (t.status === 'todo') todoTasks++;
      else if (t.status === 'in_progress') inProgressTasks++;
      else if (t.status === 'in_review') inReviewTasks++;
      else if (t.status === 'completed') completedTasks++;
      else if (t.status === 'cancelled') cancelledTasks++;

      statusMap[t.status] = (statusMap[t.status] || 0) + 1;
      priorityMap[t.priority] = (priorityMap[t.priority] || 0) + 1;
      totalProgressSum += Number(t.progress) || 0;

      // Overdue check
      if (
        t.status !== 'completed' &&
        t.status !== 'cancelled' &&
        t.due_date &&
        dayjs(t.due_date).isBefore(now, 'day')
      ) {
        overdueTasks++;
      }
    });

    const totalTasks = tasks.length;
    const nonCancelledTasks = totalTasks - cancelledTasks;
    const completionRate =
      nonCancelledTasks > 0
        ? Math.round((completedTasks / nonCancelledTasks) * 100 * 10) / 10
        : 0;

    const averageProgress =
      totalTasks > 0 ? Math.round((totalProgressSum / totalTasks) * 10) / 10 : 0;

    const byPriority: TaskPriorityDistribution[] = Object.entries(priorityMap)
      .map(([priority, count]) => ({
        priority: priority as DbTask['priority'],
        count,
      }))
      .sort((a, b) => b.count - a.count);

    const byStatus: TaskStatusDistribution[] = Object.entries(statusMap)
      .map(([status, count]) => ({
        status: status as DbTask['status'],
        count,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      organizationId,
      termId: filter?.termId,
      totalTasks,
      todoTasks,
      inProgressTasks,
      inReviewTasks,
      completedTasks,
      cancelledTasks,
      overdueTasks,
      completionRate,
      averageProgress,
      byPriority,
      byStatus,
    };
  },

  /**
   * Fetch fund statistics, income/expense by category, and monthly financial trends
   */
  async getFundStatistics(
    organizationId: string,
    filter?: ReportFilterParams
  ): Promise<FundStatistics> {
    if (!isSupabaseConfigured || !organizationId) {
      return {
        organizationId: organizationId || '',
        totalIncome: 0,
        totalExpense: 0,
        balance: 0,
        incomeTransactionCount: 0,
        expenseTransactionCount: 0,
        incomeByCategory: [],
        expenseByCategory: [],
        byMonth: [],
      };
    }

    // 1. Fetch categories for this organization
    const { data: categoriesData, error: catErr } = await supabase
      .from('finance_categories')
      .select('id, name, type')
      .eq('organization_id', organizationId);

    if (catErr) {
      console.error('[reportRepository.getFundStatistics] categories error:', catErr);
      throw new Error(`Không thể lấy danh mục tài chính: ${catErr.message}`);
    }

    const categories = (categoriesData || []) as Pick<DbFinanceCategory, 'id' | 'name' | 'type'>[];
    const categoryNameMap: Record<string, string> = {};
    categories.forEach((cat) => {
      categoryNameMap[cat.id] = cat.name;
    });

    // 2. Fetch transactions for this organization
    let txQuery = supabase
      .from('finance_transactions')
      .select('id, term_id, category_id, transaction_type, amount, transaction_date')
      .eq('organization_id', organizationId);

    if (filter?.termId && filter.termId !== 'all') {
      txQuery = txQuery.eq('term_id', filter.termId);
    }
    if (filter?.startDate) {
      txQuery = txQuery.gte('transaction_date', filter.startDate);
    }
    if (filter?.endDate) {
      txQuery = txQuery.lte('transaction_date', filter.endDate);
    }

    const { data: txData, error: txErr } = await txQuery.order('transaction_date', {
      ascending: true,
    });

    if (txErr) {
      console.error('[reportRepository.getFundStatistics] transactions error:', txErr);
      throw new Error(`Không thể lấy giao dịch thu chi: ${txErr.message}`);
    }

    const transactions = (txData || []) as Pick<
      DbFinanceTransaction,
      'id' | 'term_id' | 'category_id' | 'transaction_type' | 'amount' | 'transaction_date'
    >[];

    let totalIncome = 0;
    let totalExpense = 0;
    let incomeTransactionCount = 0;
    let expenseTransactionCount = 0;

    const incomeCategoryMap: Record<string, { amount: number; count: number }> = {};
    const expenseCategoryMap: Record<string, { amount: number; count: number }> = {};
    const monthlyFinanceMap: Record<string, { income: number; expense: number }> = {};

    transactions.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      const catId = tx.category_id;
      const monthKey = dayjs(tx.transaction_date).format('YYYY-MM');

      if (!monthlyFinanceMap[monthKey]) {
        monthlyFinanceMap[monthKey] = { income: 0, expense: 0 };
      }

      if (tx.transaction_type === 'income') {
        totalIncome += amt;
        incomeTransactionCount++;
        monthlyFinanceMap[monthKey].income += amt;

        if (!incomeCategoryMap[catId]) {
          incomeCategoryMap[catId] = { amount: 0, count: 0 };
        }
        incomeCategoryMap[catId].amount += amt;
        incomeCategoryMap[catId].count++;
      } else if (tx.transaction_type === 'expense') {
        totalExpense += amt;
        expenseTransactionCount++;
        monthlyFinanceMap[monthKey].expense += amt;

        if (!expenseCategoryMap[catId]) {
          expenseCategoryMap[catId] = { amount: 0, count: 0 };
        }
        expenseCategoryMap[catId].amount += amt;
        expenseCategoryMap[catId].count++;
      }
    });

    const incomeByCategory: FundCategoryBreakdown[] = Object.entries(incomeCategoryMap)
      .map(([categoryId, { amount, count }]) => ({
        categoryId,
        categoryName: categoryNameMap[categoryId] || 'Khoản thu khác',
        amount,
        count,
        percentage: totalIncome > 0 ? Math.round((amount / totalIncome) * 100 * 10) / 10 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    const expenseByCategory: FundCategoryBreakdown[] = Object.entries(expenseCategoryMap)
      .map(([categoryId, { amount, count }]) => ({
        categoryId,
        categoryName: categoryNameMap[categoryId] || 'Khoản chi khác',
        amount,
        count,
        percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100 * 10) / 10 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    const byMonth: MonthlyFinanceTrend[] = Object.entries(monthlyFinanceMap)
      .map(([month, { income, expense }]) => ({
        month,
        label: dayjs(month, 'YYYY-MM').format('MM/YYYY'),
        income,
        expense,
        balance: income - expense,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return {
      organizationId,
      termId: filter?.termId,
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      incomeTransactionCount,
      expenseTransactionCount,
      incomeByCategory,
      expenseByCategory,
      byMonth,
    };
  },
};
