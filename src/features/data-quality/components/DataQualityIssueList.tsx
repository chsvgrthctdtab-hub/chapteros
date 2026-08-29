import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  ArrowUpDown,
  ExternalLink,
  Info,
  CheckCircle2,
  X,
  Eye,
  SlidersHorizontal,
  ChevronRight,
  Code2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  CATEGORY_META,
  SEVERITY_META,
  formatVietnameseDateTime,
  formatTimeAgo,
  getEntityDisplayName,
} from '../utils/quality-helpers';
import type {
  DataQualityCategory,
  DataQualitySeverity,
  DataQualityIssue,
  DataQualitySummary,
} from '../types';

interface DataQualityIssueListProps {
  issues: DataQualityIssue[];
  summary?: DataQualitySummary | null;
  selectedCategory: DataQualityCategory | 'all';
  onSelectCategory: (category: DataQualityCategory | 'all') => void;
  selectedSeverity: DataQualitySeverity | 'all';
  onSelectSeverity: (severity: DataQualitySeverity | 'all') => void;
  onViewIssueDetails: (issue: DataQualityIssue) => void;
}

type SortOption = 'severity' | 'newest' | 'entity';

export function DataQualityIssueList({
  issues,
  summary,
  selectedCategory,
  onSelectCategory,
  selectedSeverity,
  onSelectSeverity,
  onViewIssueDetails,
}: DataQualityIssueListProps) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('severity');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const categories: Array<{ id: DataQualityCategory | 'all'; label: string }> = [
    { id: 'all', label: 'Tất cả' },
    { id: 'members', label: 'Hội viên' },
    { id: 'terms', label: 'Nhiệm kỳ' },
    { id: 'activities', label: 'Hoạt động' },
    { id: 'tasks', label: 'Công việc' },
    { id: 'finance', label: 'Tài chính' },
    { id: 'documents', label: 'Tài liệu' },
  ];

  const severities: Array<{ id: DataQualitySeverity | 'all'; label: string }> = [
    { id: 'all', label: 'Tất cả mức độ' },
    { id: 'critical', label: 'Nghiêm trọng' },
    { id: 'warning', label: 'Cần chú ý' },
    { id: 'info', label: 'Thông tin' },
  ];

  // Filter issues by Search Term, Category, and Severity
  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      // Category filter
      if (selectedCategory !== 'all' && issue.category !== selectedCategory) {
        return false;
      }
      // Severity filter
      if (selectedSeverity !== 'all' && issue.severity !== selectedSeverity) {
        return false;
      }
      // Search term filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchTitle = issue.title.toLowerCase().includes(query);
        const matchDesc = issue.description.toLowerCase().includes(query);
        const matchCode = issue.code.toLowerCase().includes(query);
        const matchEntity = (issue.entityName || '').toLowerCase().includes(query);
        return matchTitle || matchDesc || matchCode || matchEntity;
      }
      return true;
    });
  }, [issues, selectedCategory, selectedSeverity, searchTerm]);

  // Sort issues
  const sortedIssues = useMemo(() => {
    const list = [...filteredIssues];
    if (sortBy === 'severity') {
      const weights: Record<DataQualitySeverity, number> = {
        critical: 3,
        warning: 2,
        info: 1,
      };
      return list.sort((a, b) => (weights[b.severity] || 0) - (weights[a.severity] || 0));
    }
    if (sortBy === 'newest') {
      return list.sort(
        (a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime()
      );
    }
    if (sortBy === 'entity') {
      return list.sort((a, b) => (a.entityName || '').localeCompare(b.entityName || ''));
    }
    return list;
  }, [filteredIssues, sortBy]);

  // Pagination
  const totalPages = Math.ceil(sortedIssues.length / pageSize) || 1;
  const paginatedIssues = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedIssues.slice(start, start + pageSize);
  }, [sortedIssues, currentPage, pageSize]);

  const handleClearFilters = () => {
    setSearchTerm('');
    onSelectCategory('all');
    onSelectSeverity('all');
    setCurrentPage(1);
  };

  const handleNavigateToEntity = (issue: DataQualityIssue) => {
    if (issue.actionRoute) {
      navigate(issue.actionRoute);
    } else {
      const meta = CATEGORY_META[issue.category];
      if (meta) navigate(meta.route);
    }
  };

  return (
    <div className="rounded-xl bg-white p-6 border border-slate-200/90 shadow-2xs space-y-6">
      {/* Header with Title and Search/Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Danh sách Bất thường & Cảnh báo
            </h2>
            <Badge
              variant="secondary"
              className="bg-slate-100 text-slate-700 text-xs px-2.5 py-0.5 rounded-full font-bold"
            >
              {sortedIssues.length} mục
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Xem xét chi tiết nguyên nhân và chuyển tới trang nghiệp vụ để xử lý
          </p>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              id="input-search-issues"
              type="text"
              placeholder="Tìm theo tên, mã lỗi, mô tả..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9 pr-8 h-10 text-xs rounded-lg bg-slate-50 border-slate-200 focus:bg-white"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <Select
            value={sortBy}
            onValueChange={(val) => setSortBy(val as SortOption)}
          >
            <SelectTrigger id="select-sort-issues" className="h-10 text-xs font-semibold bg-slate-50 border-slate-200 w-auto min-w-[130px]">
              <div className="flex items-center gap-1.5">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <SelectValue placeholder="Sắp xếp..." />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="severity">Theo mức độ</SelectItem>
              <SelectItem value="newest">Mới nhất</SelectItem>
              <SelectItem value="entity">Theo thực thể</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Category Filter Pills / Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const count =
            cat.id === 'all'
              ? summary?.totalIssues ?? issues.length
              : summary?.byCategory?.[cat.id]?.total ?? 0;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                onSelectCategory(cat.id);
                setCurrentPage(1);
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                isSelected
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80'
              }`}
            >
              <span>{cat.label}</span>
              {count > 0 && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-emerald-800 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Severity Filter Quick Pills */}
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <span className="text-slate-400 font-medium flex items-center gap-1 text-[11px]">
          <SlidersHorizontal className="w-3 h-3" />
          Lọc mức độ:
        </span>
        {severities.map((sev) => {
          const isSelected = selectedSeverity === sev.id;
          return (
            <button
              key={sev.id}
              type="button"
              onClick={() => {
                onSelectSeverity(sev.id);
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                isSelected
                  ? sev.id === 'critical'
                    ? 'bg-rose-100 text-rose-800 font-bold border border-rose-300'
                    : sev.id === 'warning'
                    ? 'bg-amber-100 text-amber-900 font-bold border border-amber-300'
                    : sev.id === 'info'
                    ? 'bg-sky-100 text-sky-900 font-bold border border-sky-300'
                    : 'bg-slate-900 text-white font-bold'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
              }`}
            >
              {sev.label}
            </button>
          );
        })}

        {(selectedCategory !== 'all' || selectedSeverity !== 'all' || searchTerm) && (
          <button
            type="button"
            onClick={handleClearFilters}
            className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold ml-auto flex items-center gap-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* Issues List */}
      <div className="space-y-3">
        {paginatedIssues.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 text-emerald-600 flex items-center justify-center mb-3 shadow-2xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 mb-1">
              {searchTerm || selectedCategory !== 'all' || selectedSeverity !== 'all'
                ? 'Không tìm thấy vấn đề phù hợp với bộ lọc'
                : 'Dữ liệu hoàn hảo — Không có bất thường nào'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed mb-4">
              {searchTerm || selectedCategory !== 'all' || selectedSeverity !== 'all'
                ? 'Thử điều chỉnh lại từ khóa tìm kiếm hoặc các tùy chọn lọc danh mục/mức độ.'
                : 'Mọi dữ liệu trong phân hệ này đều đáp ứng tiêu chuẩn tính toàn vẹn và quy trình nghiệp vụ.'}
            </p>
            {(searchTerm || selectedCategory !== 'all' || selectedSeverity !== 'all') && (
              <Button
                type="button"
                variant="outline"
                onClick={handleClearFilters}
                className="rounded-lg text-xs font-semibold cursor-pointer"
              >
                Đặt lại toàn bộ lọc
              </Button>
            )}
          </div>
        ) : (
          paginatedIssues.map((issue) => {
            const severityMeta = SEVERITY_META[issue.severity];
            const categoryMeta = CATEGORY_META[issue.category];
            const SeverityIcon = severityMeta.icon;
            const CategoryIcon = categoryMeta.icon;

            return (
              <div
                key={issue.id}
                id={`issue-item-${issue.id}`}
                className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-2xs transition-all duration-150"
              >
                {/* Left: Info */}
                <div className="space-y-2 min-w-0 flex-1">
                  {/* Badges strip */}
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold border ${severityMeta.badgeClass}`}
                    >
                      <SeverityIcon className="w-3.5 h-3.5" />
                      {severityMeta.label}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium border ${categoryMeta.badgeClass}`}
                    >
                      <CategoryIcon className="w-3.5 h-3.5" />
                      {categoryMeta.label}
                    </span>

                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono text-slate-500 bg-slate-100 border border-slate-200">
                      <Code2 className="w-3 h-3 text-slate-400" />
                      {issue.code}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-sm sm:text-base font-semibold text-slate-900 group-hover:text-emerald-800 transition-colors">
                      {issue.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 mt-0.5 leading-relaxed line-clamp-2">
                      {issue.description}
                    </p>
                  </div>

                  {/* Entity link & Time */}
                  <div className="flex items-center gap-3 flex-wrap text-xs text-slate-400">
                    {issue.entityName && (
                      <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                        {getEntityDisplayName(issue.entityType)}: {issue.entityName}
                      </span>
                    )}
                    <span>Phát hiện: {formatTimeAgo(issue.detectedAt)}</span>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 sm:self-center shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onViewIssueDetails(issue)}
                    className="h-9 px-3 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 border-slate-200 cursor-pointer gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Chi tiết</span>
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleNavigateToEntity(issue)}
                    className="h-9 px-3.5 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer gap-1.5 shadow-2xs"
                  >
                    <span>{issue.actionLabel || 'Khắc phục'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div>
            Trang {currentPage} / {totalPages} (Hiển thị {paginatedIssues.length} /{' '}
            {sortedIssues.length} mục)
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-8 px-3 rounded-lg text-xs cursor-pointer disabled:opacity-50"
            >
              Trước
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="h-8 px-3 rounded-lg text-xs cursor-pointer disabled:opacity-50"
            >
              Sau
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
