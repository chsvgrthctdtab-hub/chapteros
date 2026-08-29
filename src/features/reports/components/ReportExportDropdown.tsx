import { useState, useRef, useEffect } from 'react';
import { Download, FileSpreadsheet, Printer, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type {
  ReportOverview,
  ActivityStatistics,
  MemberStatistics,
  TaskStatistics,
  FundStatistics,
  TermStatistics,
} from '@/types/report';
import {
  exportOverviewReportToCSV,
  exportActivityReportToCSV,
  exportMemberReportToCSV,
  exportTaskReportToCSV,
  exportFundReportToCSV,
  exportTermReportToCSV,
} from '../utils/report-export.utils';

interface ReportExportDropdownProps {
  orgName?: string;
  termName?: string;
  overview?: ReportOverview | null;
  activityStats?: ActivityStatistics | null;
  memberStats?: MemberStatistics | null;
  taskStats?: TaskStatistics | null;
  fundStats?: FundStatistics | null;
  termStats?: TermStatistics | null;
  activeScope?: string;
}

export function ReportExportDropdown({
  orgName = 'Chi hội',
  termName,
  overview,
  activityStats,
  memberStats,
  taskStats,
  fundStats,
  termStats,
  activeScope = 'overview',
}: ReportExportDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleExportCurrentScope = () => {
    if (activeScope === 'overview' && overview) {
      exportOverviewReportToCSV(overview, orgName, termName);
    } else if (activeScope === 'activities' && activityStats) {
      exportActivityReportToCSV(activityStats, orgName, termName);
    } else if (activeScope === 'members' && memberStats) {
      exportMemberReportToCSV(memberStats, orgName, termName);
    } else if (activeScope === 'tasks' && taskStats) {
      exportTaskReportToCSV(taskStats, orgName, termName);
    } else if (activeScope === 'finance' && fundStats) {
      exportFundReportToCSV(fundStats, orgName, termName);
    } else if (activeScope === 'terms' && termStats) {
      exportTermReportToCSV(termStats, orgName);
    } else if (overview) {
      exportOverviewReportToCSV(overview, orgName, termName);
    }
    setIsOpen(false);
  };

  const handlePrint = () => {
    setIsOpen(false);
    window.print();
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef} id="report-export-dropdown">
      <div className="inline-flex items-center gap-1.5">
        {/* Quick Direct Print Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrint}
          className="h-9 px-3 text-xs font-semibold bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-lg shadow-2xs"
          title="In báo cáo hoặc lưu định dạng PDF"
        >
          <Printer className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
          <span className="hidden sm:inline">In báo cáo</span>
        </Button>

        {/* Export Dropdown Trigger */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="h-9 px-3 text-xs font-semibold bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-lg shadow-2xs"
        >
          <Download className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
          <span>Xuất dữ liệu</span>
          <ChevronDown className="w-3.5 h-3.5 ml-1.5 text-slate-400" />
        </Button>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-64 rounded-xl bg-white border border-slate-200 shadow-lg py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 text-2xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
            Tải file dữ liệu (CSV Excel)
          </div>

          <button
            type="button"
            onClick={handleExportCurrentScope}
            className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Xuất dữ liệu theo tab hiện tại</span>
            </div>
            <span className="text-2xs text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">Khuyên dùng</span>
          </button>

          {overview && (
            <button
              type="button"
              onClick={() => {
                exportOverviewReportToCSV(overview, orgName, termName);
                setIsOpen(false);
              }}
              className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" />
              <span>Tổng quan điều hành</span>
            </button>
          )}

          {activityStats && (
            <button
              type="button"
              onClick={() => {
                exportActivityReportToCSV(activityStats, orgName, termName);
                setIsOpen(false);
              }}
              className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" />
              <span>Hoạt động & Sự kiện</span>
            </button>
          )}

          {memberStats && (
            <button
              type="button"
              onClick={() => {
                exportMemberReportToCSV(memberStats, orgName, termName);
                setIsOpen(false);
              }}
              className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" />
              <span>Nhân sự & Hội viên</span>
            </button>
          )}

          {taskStats && (
            <button
              type="button"
              onClick={() => {
                exportTaskReportToCSV(taskStats, orgName, termName);
                setIsOpen(false);
              }}
              className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" />
              <span>Thực thi Nhiệm vụ</span>
            </button>
          )}

          {fundStats && (
            <button
              type="button"
              onClick={() => {
                exportFundReportToCSV(fundStats, orgName, termName);
                setIsOpen(false);
              }}
              className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" />
              <span>Tài chính & Ngân sách</span>
            </button>
          )}

          {termStats && (
            <button
              type="button"
              onClick={() => {
                exportTermReportToCSV(termStats, orgName);
                setIsOpen(false);
              }}
              className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" />
              <span>So sánh các Nhiệm kỳ</span>
            </button>
          )}

          <div className="my-1 border-t border-slate-100" />

          <button
            type="button"
            onClick={handlePrint}
            className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>In bản in điều hành (PDF)</span>
          </button>
        </div>
      )}
    </div>
  );
}
