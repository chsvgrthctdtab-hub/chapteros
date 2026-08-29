import type { Term, TermMember, Activity, Task, TermStatus } from '@/types';
import type {
  TermClosingChecklistResult,
  TermClosingIssue,
  TermClosingSnapshot,
  TermClosingStats,
} from '../types/term.types';

/**
 * Checks if a term is in a terminal/closed state (completed or archived)
 */
export function isTermLocked(term?: Term | { status: TermStatus } | null): boolean {
  if (!term) return false;
  return term.status === 'completed' || term.status === 'archived';
}

/**
 * Validates whether mutations are allowed on a term.
 * Throws a descriptive error if the term is locked.
 */
export function validateTermMutation(
  termStatus?: TermStatus | null,
  operationName = 'thực hiện thao tác'
): void {
  if (termStatus === 'completed' || termStatus === 'archived') {
    throw new Error(
      `Nhiệm kỳ đã kết thúc hoặc lưu trữ (khóa dữ liệu lịch sử). Không thể ${operationName}.`
    );
  }
}

/**
 * Validates whether member assignments in a term can be mutated.
 */
export function validateTermMemberMutation(
  termStatus?: TermStatus | null,
  operationName = 'thay đổi phân công hội viên'
): void {
  if (termStatus === 'completed' || termStatus === 'archived') {
    throw new Error(
      `Nhiệm kỳ đã kết thúc hoặc lưu trữ. Không thể ${operationName} trong nhiệm kỳ này.`
    );
  }
}

/**
 * Validates finance mutations against term status.
 */
export function validateFinanceTermLock(
  termStatus?: TermStatus | null,
  operationName = 'ghi nhận giao dịch'
): void {
  if (termStatus === 'completed' || termStatus === 'archived') {
    throw new Error(
      `Nhiệm kỳ đã kết thúc hoặc lưu trữ (đã khóa sổ tài chính). Không thể ${operationName}.`
    );
  }
}

/**
 * Evaluates the Term Closing Checklist before allowing closure.
 * Identifies blocking issues (e.g. unclosed activities) and warnings (e.g. open tasks).
 */
export function evaluateTermClosingChecklist({
  term,
  members = [],
  activities = [],
  tasks = [],
  transactions = [],
  participantStats = { totalRegistrations: 0, totalPresent: 0, totalAbsent: 0, totalExcused: 0 },
}: {
  term: Term;
  members?: TermMember[];
  activities?: Activity[];
  tasks?: Task[];
  transactions?: Array<{ transactionType: 'income' | 'expense'; amount: number }>;
  participantStats?: {
    totalRegistrations: number;
    totalPresent: number;
    totalAbsent: number;
    totalExcused: number;
  };
}): TermClosingChecklistResult {
  const blockingIssues: TermClosingIssue[] = [];
  const warnings: TermClosingIssue[] = [];

  // 1. Evaluate Activities
  const completedActivities = activities.filter((a) => a.status === 'completed');
  const cancelledActivities = activities.filter((a) => a.status === 'cancelled');
  const unfinishedActivities = activities.filter(
    (a) => a.status !== 'completed' && a.status !== 'cancelled'
  );

  if (unfinishedActivities.length > 0) {
    blockingIssues.push({
      id: 'unfinished-activities',
      type: 'activity',
      severity: 'blocking',
      title: `Còn ${unfinishedActivities.length} hoạt động chưa hoàn thành hoặc chưa hủy`,
      description: `Để đảm bảo số liệu báo cáo chính xác, các hoạt động cần được nghiệm thu hoặc hủy trước khi đóng nhiệm kỳ.`,
      count: unfinishedActivities.length,
      items: unfinishedActivities.map((a) => ({
        id: a.id,
        title: a.title,
        status: a.status,
      })),
    });
  }

  // 2. Evaluate Tasks
  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const cancelledTasks = tasks.filter((t) => t.status === 'cancelled');
  const openTasks = tasks.filter((t) => t.status !== 'completed' && t.status !== 'cancelled');

  if (openTasks.length > 0) {
    warnings.push({
      id: 'open-tasks',
      type: 'task',
      severity: 'warning',
      title: `Còn ${openTasks.length} nhiệm vụ/công việc đang mở`,
      description: `Các công việc này sẽ được chuyển sang trạng thái lưu trữ cùng nhiệm kỳ hoặc cần bàn giao tiếp.`,
      count: openTasks.length,
      items: openTasks.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
      })),
    });
  }

  // 3. Evaluate Finance
  let totalIncome = 0;
  let totalExpense = 0;
  transactions.forEach((tx) => {
    if (tx.transactionType === 'income') {
      totalIncome += Number(tx.amount) || 0;
    } else if (tx.transactionType === 'expense') {
      totalExpense += Number(tx.amount) || 0;
    }
  });
  const balance = totalIncome - totalExpense;

  if (transactions.length === 0) {
    warnings.push({
      id: 'no-finance-records',
      type: 'finance',
      severity: 'warning',
      title: 'Chưa có ghi nhận giao dịch thu chi trong nhiệm kỳ',
      description: 'Nhiệm kỳ này không có giao dịch tài chính phát sinh nào.',
    });
  }

  // 4. Evaluate Members
  const activeMembers = members.filter((m) => m.status === 'active');
  const leaveMembers = members.filter((m) => m.status === 'leave');
  const completedMembers = members.filter((m) => m.status === 'completed');
  const resignedMembers = members.filter((m) => m.status === 'resigned');

  if (members.length === 0) {
    warnings.push({
      id: 'no-members',
      type: 'member',
      severity: 'warning',
      title: 'Chưa có nhân sự BCH/hội viên nào được phân công',
      description: 'Nhiệm kỳ này chưa có danh sách hội viên phân công.',
    });
  }

  // 5. Evaluate Attendance
  const { totalRegistrations, totalPresent, totalAbsent, totalExcused } = participantStats;
  const participationRate =
    totalRegistrations > 0 ? Math.round((totalPresent / totalRegistrations) * 100) : 0;

  const stats: TermClosingStats = {
    members: {
      total: members.length,
      active: activeMembers.length,
      leave: leaveMembers.length,
      completed: completedMembers.length,
      resigned: resignedMembers.length,
    },
    activities: {
      total: activities.length,
      completed: completedActivities.length,
      cancelled: cancelledActivities.length,
      inProgressOrDraft: unfinishedActivities.length,
    },
    tasks: {
      total: tasks.length,
      completed: completedTasks.length,
      cancelled: cancelledTasks.length,
      open: openTasks.length,
    },
    finance: {
      totalIncome,
      totalExpense,
      balance,
      transactionCount: transactions.length,
    },
    attendance: {
      totalRegistrations,
      totalPresent,
      totalAbsent,
      totalExcused,
      participationRate,
    },
  };

  const ready = blockingIssues.length === 0;

  return {
    ready,
    blockingIssues,
    warnings,
    stats,
    canOverride: true,
  };
}

/**
 * Builds an immutable TermClosingSnapshot
 */
export function buildTermClosingSnapshot({
  term,
  stats,
  members = [],
  activities = [],
  actorUserId,
  actorUserName,
  isOverridden = false,
  overrideReason = null,
  handoverNotes = null,
}: {
  term: Term;
  stats: TermClosingStats;
  members?: TermMember[];
  activities?: Activity[];
  actorUserId?: string | null;
  actorUserName?: string | null;
  isOverridden?: boolean;
  overrideReason?: string | null;
  handoverNotes?: string | null;
}): TermClosingSnapshot {
  const now = new Date().toISOString();

  return {
    termId: term.id,
    termName: term.name,
    organizationId: term.organizationId,
    startDate: term.startDate,
    endDate: term.endDate,
    closedAt: now,
    closedBy: actorUserId || null,
    closedByName: actorUserName || null,
    isOverridden,
    overrideReason: isOverridden ? overrideReason : null,
    handoverNotes: handoverNotes || null,
    stats,
    membersRoster: members.map((tm) => ({
      memberId: tm.memberId,
      fullName: tm.member?.fullName || 'Hội viên',
      studentId: tm.member?.studentId || null,
      position: tm.position,
      department: tm.department || null,
      status: tm.status,
      className: tm.member?.className || null,
    })),
    activitiesList: activities.map((a) => ({
      id: a.id,
      code: a.code || null,
      title: a.title,
      category: a.category,
      status: a.status,
      startDate: a.startDate,
      endDate: a.endDate,
    })),
    financeSummary: stats.finance,
    generatedAt: now,
  };
}
