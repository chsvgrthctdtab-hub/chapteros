import * as React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
  className?: string;
  showFirstLast?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  className,
  showFirstLast = false,
}: PaginationProps) {
  if (totalPages <= 1 && !totalItems) return null;

  // Generate page numbers with window of 5 pages
  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, currentPage + 2);

      if (currentPage <= 3) {
        start = 1;
        end = 5;
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - 4;
        end = totalPages;
      }

      if (start > 1) {
        pages.push(1);
        if (start > 2) pages.push("ellipsis");
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages) {
        if (end < totalPages - 1) pages.push("ellipsis");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const pages = getPageNumbers();
  const startItem = totalItems && pageSize ? (currentPage - 1) * pageSize + 1 : null;
  const endItem = totalItems && pageSize ? Math.min(currentPage * pageSize, totalItems) : null;

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-3 py-3 px-2 text-xs text-slate-600",
        className
      )}
    >
      {/* Total Items Info */}
      {totalItems !== undefined && (
        <div className="text-slate-500 font-medium">
          {startItem && endItem ? (
            <span>
              Hiển thị <strong className="text-slate-800 font-semibold">{startItem}</strong> -{" "}
              <strong className="text-slate-800 font-semibold">{endItem}</strong> trong tổng số{" "}
              <strong className="text-slate-800 font-semibold">{totalItems}</strong> kết quả
            </span>
          ) : (
            <span>
              Tổng số <strong className="text-slate-800 font-semibold">{totalItems}</strong> kết quả
            </span>
          )}
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex items-center gap-1">
        {showFirstLast && (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onPageChange(1)}
            disabled={currentPage <= 1}
            aria-label="Trang đầu tiên"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Trang trước"
          className="h-8 px-2.5 rounded-lg text-xs"
        >
          <ChevronLeft className="h-3.5 w-3.5 mr-1" />
          <span>Trước</span>
        </Button>

        {pages.map((p, idx) => {
          if (p === "ellipsis") {
            return (
              <span
                key={`ellipsis-${idx}`}
                className="w-8 h-8 flex items-center justify-center text-slate-400 font-bold select-none"
              >
                ...
              </span>
            );
          }

          const isActive = p === currentPage;
          return (
            <Button
              key={`page-${p}`}
              variant={isActive ? "default" : "ghost"}
              size="icon-xs"
              onClick={() => onPageChange(p)}
              className={cn(
                "w-8 h-8 rounded-lg text-xs font-semibold",
                isActive ? "bg-emerald-700 text-white" : "text-slate-700 hover:bg-slate-100"
              )}
              aria-current={isActive ? "page" : undefined}
              aria-label={`Trang ${p}`}
            >
              {p}
            </Button>
          );
        })}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Trang tiếp"
          className="h-8 px-2.5 rounded-lg text-xs"
        >
          <span>Sau</span>
          <ChevronRight className="h-3.5 w-3.5 ml-1" />
        </Button>

        {showFirstLast && (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage >= totalPages}
            aria-label="Trang cuối"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
