import type {
  ReportOverview,
  ActivityStatistics,
  MemberStatistics,
  TaskStatistics,
  FundStatistics,
  TermStatistics,
} from '@/types/report';
import dayjs from 'dayjs';

/**
 * Trigger browser download for CSV with UTF-8 BOM to prevent Vietnamese mojibake
 */
function downloadCSV(csvContent: string, filename: string) {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Escape CSV cell value
 */
function escapeCell(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Export Overview Metrics to CSV
 */
export function exportOverviewReportToCSV(
  overview: ReportOverview,
  orgName: string,
  termName?: string
) {
  const timestamp = dayjs().format('YYYY-MM-DD_HHmm');
  const rows: string[][] = [
    ['BÁO CÁO TỔNG QUAN CHI HỘI (EXECUTIVE REPORT)', ''],
    ['Chi hội', orgName],
    ['Nhiệm kỳ áp dụng', termName || overview.currentTerm?.name || 'Tất cả'],
    ['Thời điểm xuất', dayjs().format('DD/MM/YYYY HH:mm:ss')],
    ['', ''],
    ['CHỈ SỐ TỔNG QUAN', 'GIÁ TRỊ'],
    ['Tổng số hội viên', String(overview.memberCount)],
    ['Hội viên đang hoạt động', String(overview.activeMemberCount)],
    ['Tổng số nhiệm kỳ', String(overview.termCount)],
    ['Tổng số hoạt động', String(overview.activityCount)],
    ['Tổng số nhiệm vụ', String(overview.taskCount)],
    ['Tổng thu (VND)', String(overview.totalIncome)],
    ['Tổng chi (VND)', String(overview.totalExpense)],
    ['Số dư khả dụng (VND)', String(overview.balance)],
  ];

  const csv = rows.map((r) => r.map(escapeCell).join(',')).join('\n');
  downloadCSV(csv, `BaoCao_TongQuan_${timestamp}.csv`);
}

/**
 * Export Activity Statistics to CSV
 */
export function exportActivityReportToCSV(
  stats: ActivityStatistics,
  orgName: string,
  termName?: string
) {
  const timestamp = dayjs().format('YYYY-MM-DD_HHmm');
  const rows: string[][] = [
    ['BÁO CÁO HOẠT ĐỘNG VÀ SỰ KIỆN', ''],
    ['Chi hội', orgName],
    ['Nhiệm kỳ', termName || 'Tất cả'],
    ['Thời điểm xuất', dayjs().format('DD/MM/YYYY HH:mm:ss')],
    ['', ''],
    ['CHỈ SỐ HOẠT ĐỘNG', 'SỐ LƯỢNG'],
    ['Tổng số hoạt động', String(stats.totalActivities)],
    ['Đã hoàn thành', String(stats.completedActivities)],
    ['Đang thực hiện / Đã công bố', String(stats.inProgressActivities + stats.publishedActivities)],
    ['Lập kế hoạch / Dự thảo', String(stats.planningActivities + stats.draftActivities)],
    ['Đã hủy', String(stats.cancelledActivities)],
    ['Tổng chỉ tiêu người tham gia', String(stats.totalTargetMembers)],
    ['', ''],
    ['PHÂN BỔ THEO DANH MỤC', 'SỐ LƯỢNG'],
  ];

  stats.byCategory.forEach((c) => {
    rows.push([c.category, String(c.count)]);
  });

  rows.push(['', '']);
  rows.push(['XU HƯỚNG HOẠT ĐỘNG THEO THÁNG', 'SỐ LƯỢNG']);
  stats.byMonth.forEach((m) => {
    rows.push([m.label, String(m.count)]);
  });

  const csv = rows.map((r) => r.map(escapeCell).join(',')).join('\n');
  downloadCSV(csv, `BaoCao_HoatDong_${timestamp}.csv`);
}

/**
 * Export Member Statistics to CSV
 */
export function exportMemberReportToCSV(
  stats: MemberStatistics,
  orgName: string,
  termName?: string
) {
  const timestamp = dayjs().format('YYYY-MM-DD_HHmm');
  const rows: string[][] = [
    ['BÁO CÁO NHÂN SỰ VÀ HỘI VIÊN', ''],
    ['Chi hội', orgName],
    ['Nhiệm kỳ', termName || 'Tất cả'],
    ['Thời điểm xuất', dayjs().format('DD/MM/YYYY HH:mm:ss')],
    ['', ''],
    ['CHỈ SỐ HỘI VIÊN', 'SỐ LƯỢNG'],
    ['Tổng số hội viên', String(stats.totalMembers)],
    ['Đang hoạt động', String(stats.activeMembers)],
    ['Cựu hội viên', String(stats.alumniMembers)],
  ];

  if (stats.termMembersCount !== null) {
    rows.push(['Nhân sự trong nhiệm kỳ', String(stats.termMembersCount)]);
  }

  rows.push(['', '']);
  rows.push(['PHÂN BỔ THEO CHỨC VỤ', 'SỐ LƯỢNG']);
  stats.positionDistribution.forEach((p) => {
    rows.push([p.position || 'Chưa phân loại', String(p.count)]);
  });

  rows.push(['', '']);
  rows.push(['PHÂN BỔ THEO CHUYÊN NGÀNH', 'SỐ LƯỢNG']);
  stats.majorDistribution.forEach((m) => {
    rows.push([m.major || 'Chưa phân loại', String(m.count)]);
  });

  if (stats.termMembersByDepartment.length > 0) {
    rows.push(['', '']);
    rows.push(['PHÂN BỔ THEO BAN / BỘ PHẬN NHIỆM KỲ', 'SỐ LƯỢNG']);
    stats.termMembersByDepartment.forEach((d) => {
      rows.push([d.department || 'Chung', String(d.count)]);
    });
  }

  const csv = rows.map((r) => r.map(escapeCell).join(',')).join('\n');
  downloadCSV(csv, `BaoCao_HoiVien_${timestamp}.csv`);
}

/**
 * Export Task Statistics to CSV
 */
export function exportTaskReportToCSV(
  stats: TaskStatistics,
  orgName: string,
  termName?: string
) {
  const timestamp = dayjs().format('YYYY-MM-DD_HHmm');
  const rows: string[][] = [
    ['BÁO CÁO THỰC THI NHIỆM VỤ (TASK EXECUTION)', ''],
    ['Chi hội', orgName],
    ['Nhiệm kỳ', termName || 'Tất cả'],
    ['Thời điểm xuất', dayjs().format('DD/MM/YYYY HH:mm:ss')],
    ['', ''],
    ['CHỈ SỐ NHIỆM VỤ', 'GIÁ TRỊ'],
    ['Tổng số nhiệm vụ', String(stats.totalTasks)],
    ['Hoàn thành', String(stats.completedTasks)],
    ['Đang thực hiện', String(stats.inProgressTasks)],
    ['Đang duyệt', String(stats.inReviewTasks)],
    ['Cần làm', String(stats.todoTasks)],
    ['Đã hủy', String(stats.cancelledTasks)],
    ['Nhiệm vụ trễ hạn', String(stats.overdueTasks)],
    ['Tỷ lệ hoàn thành (%)', `${stats.completionRate}%`],
    ['Tiến độ trung bình (%)', `${stats.averageProgress}%`],
    ['', ''],
    ['PHÂN BỔ THEO ĐỘ ƯU TIÊN', 'SỐ LƯỢNG'],
  ];

  stats.byPriority.forEach((p) => {
    rows.push([p.priority, String(p.count)]);
  });

  const csv = rows.map((r) => r.map(escapeCell).join(',')).join('\n');
  downloadCSV(csv, `BaoCao_NhiemVu_${timestamp}.csv`);
}

/**
 * Export Financial Statistics to CSV
 */
export function exportFundReportToCSV(
  stats: FundStatistics,
  orgName: string,
  termName?: string
) {
  const timestamp = dayjs().format('YYYY-MM-DD_HHmm');
  const rows: string[][] = [
    ['BÁO CÁO QUẢN LÝ TÀI CHÍNH VÀ NGÂN SÁCH', ''],
    ['Chi hội', orgName],
    ['Nhiệm kỳ', termName || 'Tất cả'],
    ['Thời điểm xuất', dayjs().format('DD/MM/YYYY HH:mm:ss')],
    ['', ''],
    ['CHỈ SỐ TÀI CHÍNH', 'GIÁ TRỊ (VND)'],
    ['Tổng thu', String(stats.totalIncome)],
    ['Tổng chi', String(stats.totalExpense)],
    ['Số dư khả dụng', String(stats.balance)],
    ['Số giao dịch thu', String(stats.incomeTransactionCount)],
    ['Số giao dịch chi', String(stats.expenseTransactionCount)],
    ['', ''],
    ['CƠ CẤU NGUỒN THU', 'SỐ TIỀN (VND)', 'TỶ TRỌNG (%)', 'SỐ GD'],
  ];

  stats.incomeByCategory.forEach((c) => {
    rows.push([c.categoryName, String(c.amount), `${c.percentage}%`, String(c.count)]);
  });

  rows.push(['', '', '', '']);
  rows.push(['CƠ CẤU KHOẢN CHI', 'SỐ TIỀN (VND)', 'TỶ TRỌNG (%)', 'SỐ GD']);
  stats.expenseByCategory.forEach((c) => {
    rows.push([c.categoryName, String(c.amount), `${c.percentage}%`, String(c.count)]);
  });

  if (stats.byMonth.length > 0) {
    rows.push(['', '', '', '']);
    rows.push(['BIẾN ĐỘNG THU CHI THEO THÁNG', 'THU (VND)', 'CHI (VND)', 'SỐ DƯ (VND)']);
    stats.byMonth.forEach((m) => {
      rows.push([m.label, String(m.income), String(m.expense), String(m.balance)]);
    });
  }

  const csv = rows.map((r) => r.map(escapeCell).join(',')).join('\n');
  downloadCSV(csv, `BaoCao_TaiChinh_${timestamp}.csv`);
}

/**
 * Export Term Statistics Matrix to CSV
 */
export function exportTermReportToCSV(
  stats: TermStatistics,
  orgName: string
) {
  const timestamp = dayjs().format('YYYY-MM-DD_HHmm');
  const rows: string[][] = [
    ['BÁO CÁO SO SÁNH CÁC NHIỆM KỲ', ''],
    ['Chi hội', orgName],
    ['Thời điểm xuất', dayjs().format('DD/MM/YYYY HH:mm:ss')],
    ['Tổng số nhiệm kỳ', String(stats.totalTerms)],
    ['', ''],
    [
      'Tên nhiệm kỳ',
      'Ngày bắt đầu',
      'Ngày kết thúc',
      'Trạng thái',
      'Thành viên',
      'Hoạt động',
      'Nhiệm vụ',
      'Tổng thu (VND)',
      'Tổng chi (VND)',
      'Số dư (VND)',
    ],
  ];

  stats.termsList.forEach((t) => {
    rows.push([
      t.name,
      t.startDate ? dayjs(t.startDate).format('DD/MM/YYYY') : '---',
      t.endDate ? dayjs(t.endDate).format('DD/MM/YYYY') : '---',
      t.status,
      String(t.memberCount),
      String(t.activityCount),
      String(t.taskCount),
      String(t.totalIncome),
      String(t.totalExpense),
      String(t.balance),
    ]);
  });

  const csv = rows.map((r) => r.map(escapeCell).join(',')).join('\n');
  downloadCSV(csv, `BaoCao_NhiemKy_${timestamp}.csv`);
}
