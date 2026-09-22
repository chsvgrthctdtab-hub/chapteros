import React from 'react';
import {
  FileText,
  FileSpreadsheet,
  CheckSquare,
  Folder,
  HardDrive,
  Cloud,
  Presentation,
} from 'lucide-react';
import { getFileTypeGroup } from '../utils/document.utils';
import type { DocumentStats, DocumentItem, DocumentFilterParams } from '../types/document.types';

interface DocumentStatsSummaryProps {
  stats?: DocumentStats;
  documents?: DocumentItem[];
  isLoading?: boolean;
  activeFilter?: DocumentFilterParams;
  onFilterChange?: (filterUpdate: Partial<DocumentFilterParams>) => void;
}

export function DocumentStatsSummary({
  stats,
  documents = [],
  isLoading,
  activeFilter,
  onFilterChange,
}: DocumentStatsSummaryProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="bg-white border border-hairline rounded-xl p-3.5 shadow-xs animate-pulse h-20"
          />
        ))}
      </div>
    );
  }

  const totalFiles = documents.length > 0 ? documents.length : (stats?.totalCount || 0);
  const docCount = documents.filter((d) => {
    const group = getFileTypeGroup(d.mimeType, d.filePath);
    return group === 'gdoc' || group === 'word' || group === 'text';
  }).length;

  const sheetCount = documents.filter((d) => {
    const group = getFileTypeGroup(d.mimeType, d.filePath);
    return group === 'gsheet' || group === 'excel';
  }).length;

  const formCount = documents.filter((d) => {
    const group = getFileTypeGroup(d.mimeType, d.filePath);
    return group === 'gform';
  }).length;

  const otherCount = documents.filter((d) => {
    const group = getFileTypeGroup(d.mimeType, d.filePath);
    return group === 'folder' || group === 'gslide' || group === 'powerpoint' || group === 'pdf' || group === 'image';
  }).length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {/* 1. Total Drive Files */}
      <div
        onClick={() => onFilterChange?.({ fileTypeGroup: 'all', category: 'all' })}
        className={`bg-white border rounded-xl p-3.5 shadow-xs transition-all cursor-pointer hover:border-slate-gray/30 ${
          activeFilter?.fileTypeGroup === 'all'
            ? 'border-emerald-600 ring-1 ring-emerald-600/10'
            : 'border-hairline'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-mist-gray">
            TỔNG TỆP DRIVE
          </span>
          <HardDrive className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="text-xl font-bold text-ink-navy tracking-tight">{totalFiles}</span>
          <span className="text-[11px] text-emerald-700 font-medium">tệp</span>
        </div>
        <p className="text-[10px] text-mist-gray mt-1 truncate">
          Tài nguyên Google Drive
        </p>
      </div>

      {/* 2. Google Docs & Văn bản */}
      <div
        onClick={() => onFilterChange?.({ fileTypeGroup: 'gdoc' })}
        className={`bg-white border rounded-xl p-3.5 shadow-xs transition-all cursor-pointer hover:border-slate-gray/30 ${
          activeFilter?.fileTypeGroup === 'gdoc'
            ? 'border-signal-blue ring-1 ring-[#006bff]/10'
            : 'border-hairline'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-mist-gray">
            DOCS & VĂN BẢN
          </span>
          <FileText className="w-4 h-4 text-signal-blue" />
        </div>
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="text-xl font-bold text-ink-navy tracking-tight">{docCount}</span>
          <span className="text-[11px] text-signal-blue font-medium">văn bản</span>
        </div>
        <p className="text-[10px] text-mist-gray mt-1 truncate">
          Google Docs, Kế hoạch
        </p>
      </div>

      {/* 3. Google Sheets & Bảng tính */}
      <div
        onClick={() => onFilterChange?.({ fileTypeGroup: 'gsheet' })}
        className={`bg-white border rounded-xl p-3.5 shadow-xs transition-all cursor-pointer hover:border-slate-gray/30 ${
          activeFilter?.fileTypeGroup === 'gsheet'
            ? 'border-emerald-600 ring-1 ring-emerald-600/10'
            : 'border-hairline'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-mist-gray">
            SHEETS & SỔ THU CHI
          </span>
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="text-xl font-bold text-ink-navy tracking-tight">{sheetCount}</span>
          <span className="text-[11px] text-emerald-700 font-medium">bảng tính</span>
        </div>
        <p className="text-[10px] text-mist-gray mt-1 truncate">
          Google Sheets, Kế toán
        </p>
      </div>

      {/* 4. Google Forms & Biểu mẫu */}
      <div
        onClick={() => onFilterChange?.({ fileTypeGroup: 'gform' })}
        className={`bg-white border rounded-xl p-3.5 shadow-xs transition-all cursor-pointer hover:border-slate-gray/30 ${
          activeFilter?.fileTypeGroup === 'gform'
            ? 'border-purple-600 ring-1 ring-purple-600/10'
            : 'border-hairline'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-mist-gray">
            FORMS & BIỂU MẪU
          </span>
          <CheckSquare className="w-4 h-4 text-purple-600" />
        </div>
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="text-xl font-bold text-ink-navy tracking-tight">{formCount}</span>
          <span className="text-[11px] text-purple-700 font-medium">biểu mẫu</span>
        </div>
        <p className="text-[10px] text-mist-gray mt-1 truncate">
          Google Forms, Khảo sát
        </p>
      </div>

      {/* 5. Thư mục & Tệp khác */}
      <div
        onClick={() => onFilterChange?.({ fileTypeGroup: 'folder' })}
        className={`bg-white border rounded-xl p-3.5 shadow-xs transition-all cursor-pointer hover:border-slate-gray/30 ${
          activeFilter?.fileTypeGroup === 'folder'
            ? 'border-amber-600 ring-1 ring-amber-600/10'
            : 'border-hairline'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-mist-gray">
            THƯ MỤC & MỤC KHÁC
          </span>
          <Folder className="w-4 h-4 text-amber-600" />
        </div>
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="text-xl font-bold text-ink-navy tracking-tight">{otherCount}</span>
          <span className="text-[11px] text-amber-700 font-medium">mục</span>
        </div>
        <p className="text-[10px] text-mist-gray mt-1 truncate">
          Thư mục, Trình chiếu, PDF
        </p>
      </div>
    </div>
  );
}
