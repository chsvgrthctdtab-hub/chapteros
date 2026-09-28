import React from 'react';
import {
  Search,
  X,
  LayoutGrid,
  List,
  SlidersHorizontal,
  ArrowUpDown,
  HardDrive,
  Cloud,
  Layers,
  Shield,
  Tag,
  Link2,
  Calendar,
  RotateCcw,
} from '@/lib/icons';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  DOCUMENT_CATEGORY_CONFIGS,
  DOCUMENT_ACCESS_CONFIGS,
} from '../utils/document.utils';
import type {
  DocumentFilterParams,
  DocumentTermOption,
  DocumentCategory,
  DocumentAccessLevel,
  DocumentSortBy,
  SortOrder,
} from '../types/document.types';
import { cn } from '@/lib/utils';

interface DocumentFilterBarProps {
  filters: DocumentFilterParams;
  onFilterChange: (filters: DocumentFilterParams) => void;
  terms: DocumentTermOption[];
  viewMode: 'grid' | 'table';
  onViewModeChange: (mode: 'grid' | 'table') => void;
  totalFiltered: number;
}

const FILE_TYPE_OPTIONS: Array<{
  id: DocumentFilterParams['fileTypeGroup'];
  label: string;
}> = [
  { id: 'all', label: 'Tất cả' },
  { id: 'gdoc', label: 'Google Docs' },
  { id: 'gsheet', label: 'Google Sheets' },
  { id: 'gslide', label: 'Google Slides' },
  { id: 'gform', label: 'Google Forms' },
  { id: 'folder', label: 'Thư mục Drive' },
  { id: 'pdf', label: 'PDF' },
  { id: 'word', label: 'Word' },
  { id: 'excel', label: 'Excel' },
  { id: 'image', label: 'Hình ảnh' },
];

export function DocumentFilterBar({
  filters,
  onFilterChange,
  terms,
  viewMode,
  onViewModeChange,
  totalFiltered,
}: DocumentFilterBarProps) {
  const hasActiveFilters = Boolean(
    filters.search ||
      (filters.sourceType && filters.sourceType !== 'all') ||
      (filters.category && filters.category !== 'all') ||
      (filters.accessLevel && filters.accessLevel !== 'all') ||
      (filters.termId && filters.termId !== 'all') ||
      (filters.linkedStatus && filters.linkedStatus !== 'all') ||
      (filters.fileTypeGroup && filters.fileTypeGroup !== 'all') ||
      filters.sortBy !== 'createdAt' ||
      filters.sortOrder !== 'desc'
  );

  const handleResetFilters = () => {
    onFilterChange({
      search: '',
      sourceType: 'all',
      category: 'all',
      accessLevel: 'all',
      termId: 'all',
      linkedStatus: 'all',
      fileTypeGroup: 'all',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  };

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-2xl p-4 shadow-xs space-y-3">
      {/* Row 1: Search + Dropdown Filters + View Mode */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
        {/* Search input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
          <Input
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            placeholder="Tìm kiếm tài liệu, Google Docs, Sheets, Drive..."
            className="pl-9 pr-8 h-9 rounded-full text-xs bg-[#f8fafd] border-[#e2e8f0] hover:border-[#b8cce0] hover:bg-white focus:bg-white text-[#1e293b] placeholder:text-[#94a3b8]"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onFilterChange({ ...filters, search: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#1e293b] p-0.5 rounded-full cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Term Selector */}
          <Select
            value={filters.termId || 'all'}
            onValueChange={(val) => onFilterChange({ ...filters, termId: val })}
          >
            <SelectTrigger className="h-9 text-xs bg-[#f8fafd] border-[#e2e8f0] rounded-full text-[#1e293b] w-auto min-w-[130px]">
              <SelectValue placeholder="Tất cả nhiệm kỳ" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-[#e2e8f0] bg-white shadow-lg">
              <SelectItem value="all">Tất cả nhiệm kỳ</SelectItem>
              {terms.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name} {t.isCurrent ? '(Hiện tại)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Category Selector */}
          <Select
            value={filters.category || 'all'}
            onValueChange={(val) =>
              onFilterChange({ ...filters, category: val as DocumentCategory | 'all' })
            }
          >
            <SelectTrigger className="h-9 text-xs bg-[#f8fafd] border-[#e2e8f0] rounded-full text-[#1e293b] w-auto min-w-[130px]">
              <SelectValue placeholder="Tất cả danh mục" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-[#e2e8f0] bg-white shadow-lg">
              <SelectItem value="all">Tất cả danh mục</SelectItem>
              {Object.entries(DOCUMENT_CATEGORY_CONFIGS).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Link Status Selector */}
          <Select
            value={filters.linkedStatus || 'all'}
            onValueChange={(val) =>
              onFilterChange({ ...filters, linkedStatus: val as 'all' | 'linked' | 'unlinked' })
            }
          >
            <SelectTrigger className="h-9 text-xs bg-[#f8fafd] border-[#e2e8f0] rounded-full text-[#1e293b] w-auto min-w-[130px]">
              <SelectValue placeholder="Tất cả liên kết" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-[#e2e8f0] bg-white shadow-lg">
              <SelectItem value="all">Tất cả liên kết</SelectItem>
              <SelectItem value="linked">Đã gắn hoạt động / nhiệm vụ</SelectItem>
              <SelectItem value="unlinked">Tài liệu chung</SelectItem>
            </SelectContent>
          </Select>

          {/* Access Level Selector */}
          <Select
            value={filters.accessLevel || 'all'}
            onValueChange={(val) =>
              onFilterChange({
                ...filters,
                accessLevel: val as DocumentAccessLevel | 'all',
              })
            }
          >
            <SelectTrigger className="h-9 text-xs bg-[#f8fafd] border-[#e2e8f0] rounded-full text-[#1e293b] w-auto min-w-[130px]">
              <SelectValue placeholder="Quyền truy cập" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-[#e2e8f0] bg-white shadow-lg">
              <SelectItem value="all">Quyền truy cập</SelectItem>
              {Object.entries(DOCUMENT_ACCESS_CONFIGS).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* View Mode Toggle: List / Grid */}
          <div className="flex items-center bg-[#f0f4f9] p-0.5 rounded-full border border-[#e2e8f0] shrink-0">
            <button
              type="button"
              onClick={() => onViewModeChange('table')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer',
                viewMode === 'table'
                  ? 'bg-white text-[#1a73e8] shadow-xs'
                  : 'text-[#64748b] hover:text-[#1e293b]'
              )}
              title="Dạng danh sách (Bảng)"
            >
              <List size={14} className={viewMode === 'table' ? 'text-[#2e89f7]' : 'text-[#64748b]'} />
              <span className="hidden sm:inline">Danh sách</span>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer',
                viewMode === 'grid'
                  ? 'bg-white text-[#1a73e8] shadow-xs'
                  : 'text-[#64748b] hover:text-[#1e293b]'
              )}
              title="Dạng lưới (Thẻ)"
            >
              <LayoutGrid size={14} className={viewMode === 'grid' ? 'text-[#2e89f7]' : 'text-[#64748b]'} />
              <span className="hidden sm:inline">Lưới</span>
            </button>
          </div>
        </div>
      </div>

      {/* Row 2: File Type Filter Chips + Sort + Reset */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-t border-[#e2e8f0] pt-2.5">
        {/* File Type Quick Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {FILE_TYPE_OPTIONS.map((opt) => {
            const isSelected = (filters.fileTypeGroup || 'all') === opt.id;
            return (
              <button
                key={opt.id || 'all'}
                type="button"
                onClick={() => onFilterChange({ ...filters, fileTypeGroup: opt.id })}
                className={cn(
                  'px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0',
                  isSelected
                    ? 'bg-[#0b3558] text-white shadow-xs'
                    : 'bg-[#f8fafd] text-[#64748b] hover:bg-[#f0f4f9] hover:text-[#1e293b] border border-[#e2e8f0]'
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Right side: Sort controls + Count + Reset */}
        <div className="flex items-center gap-2 justify-end shrink-0">
          <span className="text-[11px] text-[#64748b] font-medium">
            Hiển thị <strong className="text-[#0b3558]">{totalFiltered}</strong> tệp
          </span>

          {/* Sort selector */}
          <div className="flex items-center gap-1">
            <Select
              value={filters.sortBy || 'createdAt'}
              onValueChange={(val) =>
                onFilterChange({ ...filters, sortBy: val as DocumentSortBy })
              }
            >
              <SelectTrigger className="h-7 text-[11px] bg-[#f8fafd] border-[#e2e8f0] rounded-full text-[#1e293b] w-auto min-w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-[#e2e8f0] bg-white shadow-lg">
                <SelectItem value="createdAt">Mới nhất</SelectItem>
                <SelectItem value="title">Tên tệp</SelectItem>
                <SelectItem value="fileSize">Dung lượng</SelectItem>
              </SelectContent>
            </Select>

            <button
              type="button"
              onClick={() =>
                onFilterChange({
                  ...filters,
                  sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc',
                })
              }
              className="h-7 w-7 rounded-full bg-[#f8fafd] border border-[#e2e8f0] text-[#64748b] hover:text-[#1e293b] flex items-center justify-center cursor-pointer"
              title={filters.sortOrder === 'asc' ? 'Tăng dần' : 'Giảm dần'}
            >
              <ArrowUpDown size={13} />
            </button>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:underline px-1 py-0.5 cursor-pointer ml-1"
            >
              <RotateCcw size={12} />
              <span>Đặt lại</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
