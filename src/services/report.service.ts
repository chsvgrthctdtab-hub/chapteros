import { reportRepository } from '@/repositories/report.repository';
import type {
  ReportOverview,
  ReportFilterParams,
  MemberStatistics,
  TermStatistics,
  ActivityStatistics,
  TaskStatistics,
  FundStatistics,
} from '@/types/report';

export const reportService = {
  /**
   * Get overview statistics for an organization and optional term
   */
  async getOverview(
    organizationId: string,
    filter?: ReportFilterParams
  ): Promise<ReportOverview> {
    if (!organizationId || !organizationId.trim()) {
      throw new Error('Vui lòng chọn Chi hội để xem báo cáo tổng quan.');
    }

    const sanitizedFilter: ReportFilterParams | undefined = filter
      ? {
          termId: filter.termId?.trim() || undefined,
          startDate: filter.startDate?.trim() || undefined,
          endDate: filter.endDate?.trim() || undefined,
        }
      : undefined;

    return reportRepository.getOverview(organizationId.trim(), sanitizedFilter);
  },

  /**
   * Get member demographics and distribution statistics
   */
  async getMemberStatistics(
    organizationId: string,
    filter?: ReportFilterParams
  ): Promise<MemberStatistics> {
    if (!organizationId || !organizationId.trim()) {
      throw new Error('Vui lòng chọn Chi hội để xem thống kê hội viên.');
    }

    const sanitizedFilter: ReportFilterParams | undefined = filter
      ? {
          termId: filter.termId?.trim() || undefined,
          startDate: filter.startDate?.trim() || undefined,
          endDate: filter.endDate?.trim() || undefined,
        }
      : undefined;

    return reportRepository.getMemberStatistics(organizationId.trim(), sanitizedFilter);
  },

  /**
   * Get term-by-term comparative statistics
   */
  async getTermStatistics(organizationId: string): Promise<TermStatistics> {
    if (!organizationId || !organizationId.trim()) {
      throw new Error('Vui lòng chọn Chi hội để xem thống kê nhiệm kỳ.');
    }

    return reportRepository.getTermStatistics(organizationId.trim());
  },

  /**
   * Get activity statistics, category breakdowns, and monthly trends
   */
  async getActivityStatistics(
    organizationId: string,
    filter?: ReportFilterParams
  ): Promise<ActivityStatistics> {
    if (!organizationId || !organizationId.trim()) {
      throw new Error('Vui lòng chọn Chi hội để xem thống kê hoạt động.');
    }

    const sanitizedFilter: ReportFilterParams | undefined = filter
      ? {
          termId: filter.termId?.trim() || undefined,
          startDate: filter.startDate?.trim() || undefined,
          endDate: filter.endDate?.trim() || undefined,
        }
      : undefined;

    return reportRepository.getActivityStatistics(organizationId.trim(), sanitizedFilter);
  },

  /**
   * Get task statistics, status, priority, and progress completion rates
   */
  async getTaskStatistics(
    organizationId: string,
    filter?: ReportFilterParams
  ): Promise<TaskStatistics> {
    if (!organizationId || !organizationId.trim()) {
      throw new Error('Vui lòng chọn Chi hội để xem thống kê nhiệm vụ.');
    }

    const sanitizedFilter: ReportFilterParams | undefined = filter
      ? {
          termId: filter.termId?.trim() || undefined,
          startDate: filter.startDate?.trim() || undefined,
          endDate: filter.endDate?.trim() || undefined,
        }
      : undefined;

    return reportRepository.getTaskStatistics(organizationId.trim(), sanitizedFilter);
  },

  /**
   * Get fund statistics, income/expense by category, and monthly trends
   */
  async getFundStatistics(
    organizationId: string,
    filter?: ReportFilterParams
  ): Promise<FundStatistics> {
    if (!organizationId || !organizationId.trim()) {
      throw new Error('Vui lòng chọn Chi hội để xem thống kê tài chính.');
    }

    const sanitizedFilter: ReportFilterParams | undefined = filter
      ? {
          termId: filter.termId?.trim() || undefined,
          startDate: filter.startDate?.trim() || undefined,
          endDate: filter.endDate?.trim() || undefined,
        }
      : undefined;

    return reportRepository.getFundStatistics(organizationId.trim(), sanitizedFilter);
  },
};
