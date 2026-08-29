import React from 'react';
import {
  User,
  MoreHorizontal,
  Eye,
  Edit2,
  Calendar,
  Trash2,
  Mail,
  Phone,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  UserPlus,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MemberStatusBadge } from './MemberStatusBadge';
import { MemberRoleBadge } from './MemberRoleBadge';
import type { MemberListItem } from '../types/member.types';
import type { Member } from '@/types';

interface MemberListTableProps {
  data: MemberListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  isLoading: boolean;
  canManage: boolean;
  onPageChange: (newPage: number) => void;
  onViewDetail: (member: Member) => void;
  onEdit: (member: Member) => void;
  onAssignTerm: (member: Member) => void;
  onDelete: (member: Member) => void;
  onAddNew?: () => void;
}

export function MemberListTable({
  data,
  totalCount,
  page,
  pageSize,
  totalPages,
  isLoading,
  canManage,
  onPageChange,
  onViewDetail,
  onEdit,
  onAssignTerm,
  onDelete,
  onAddNew,
}: MemberListTableProps) {
  if (isLoading) {
    return null; // Handled by Skeleton in parent
  }

  if (data.length === 0) {
    return (
      <div className="bg-white border border-slate-200/90 rounded-xl p-12 text-center shadow-2xs space-y-4">
        <div className="h-14 w-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mx-auto border border-slate-200">
          <User className="h-7 w-7 text-slate-400" />
        </div>
        <div className="space-y-1 max-w-md mx-auto">
          <h3 className="text-sm font-semibold text-slate-900">Không tìm thấy hội viên nào</h3>
          <p className="text-xs text-slate-500">
            Chưa có hồ sơ hội viên nào trong Chi hội hoặc không có kết quả phù hợp với tiêu chí tìm kiếm và bộ lọc hiện tại.
          </p>
        </div>
        {canManage && onAddNew && (
          <Button
            onClick={onAddNew}
            size="sm"
            className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs h-8 shadow-xs cursor-pointer"
          >
            <UserPlus className="h-3.5 w-3.5 mr-1.5" />
            Thêm hội viên đầu tiên
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs flex flex-col">
      <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50/90 text-[11px] font-bold text-slate-600 border-b border-slate-200/90 uppercase tracking-wider">
            <tr>
              <th className="py-3.5 px-4 min-w-[200px]">Hội viên</th>
              <th className="py-3.5 px-3 min-w-[100px]">MSSV</th>
              <th className="py-3.5 px-3 min-w-[130px]">Lớp / Ngành</th>
              <th className="py-3.5 px-3 min-w-[140px]">Liên hệ</th>
              <th className="py-3.5 px-3 min-w-[120px]">Nhiệm kỳ</th>
              <th className="py-3.5 px-3 min-w-[120px]">Chức vụ</th>
              <th className="py-3.5 px-3 min-w-[100px] text-center">Trạng thái</th>
              <th className="py-3.5 px-4 text-right min-w-[80px]">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((item) => {
              const initials = item.fullName
                .split(' ')
                .map((n) => n[0])
                .slice(-2)
                .join('')
                .toUpperCase();

              const memberObj: Member = {
                id: item.id,
                organizationId: item.organizationId,
                userId: item.userId,
                studentId: item.studentId,
                fullName: item.fullName,
                email: item.email,
                phone: item.phone,
                className: item.className,
                major: item.major,
                cohort: item.cohort,
                position: item.position,
                status: item.status,
                joinedDate: item.joinedDate,
                notes: item.notes,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
              };

              return (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                  onClick={() => onViewDetail(memberObj)}
                >
                  {/* 1. Member: Avatar + Name + Secondary email */}
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-9 w-9 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200/80 group-hover:border-emerald-200 group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors">
                        {initials || <User className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                          {item.fullName}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {item.email || <span className="text-slate-300 italic">Chưa có email</span>}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* 2. Student ID (Prominent monospace styling) */}
                  <td className="py-3 px-3">
                    {item.studentId ? (
                      <span className="font-mono text-xs font-semibold text-slate-800 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/80">
                        {item.studentId}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Unassigned</span>
                    )}
                  </td>

                  {/* 3. Class & Cohort / Major */}
                  <td className="py-3 px-3">
                    <div className="space-y-0.5">
                      <div className="font-medium text-slate-800 flex items-center space-x-1.5">
                        <GraduationCap className="h-3 w-3 text-slate-400 shrink-0" />
                        <span className="truncate">{item.className || 'Chưa có lớp'}</span>
                        {item.cohort && (
                          <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded shrink-0">
                            {item.cohort}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[160px]">
                        {item.major || 'Chưa cập nhật ngành'}
                      </div>
                    </div>
                  </td>

                  {/* 4. Contact info */}
                  <td className="py-3 px-3">
                    <div className="space-y-0.5 text-[11px]">
                      {item.phone ? (
                        <div className="flex items-center space-x-1 text-slate-600">
                          <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                          <span className="font-mono text-[11px]">{item.phone}</span>
                        </div>
                      ) : (
                        <div className="text-slate-300 italic text-[10px]">Chưa có SĐT</div>
                      )}
                    </div>
                  </td>

                  {/* 5. Term Assignment */}
                  <td className="py-3 px-3">
                    {item.currentTermAssignment ? (
                      <div className="space-y-0.5">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200/80"
                          title={item.currentTermAssignment.termName}
                        >
                          <Calendar className="h-2.5 w-2.5 text-blue-500 shrink-0" />
                          <span className="truncate max-w-[110px]">{item.currentTermAssignment.termName}</span>
                        </span>
                        {item.currentTermAssignment.department && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                            {item.currentTermAssignment.department}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] text-slate-400 italic bg-slate-50 border border-dashed border-slate-200">
                        Unassigned
                      </span>
                    )}
                  </td>

                  {/* 6. Role / Executive Board Badge */}
                  <td className="py-3 px-3">
                    <MemberRoleBadge
                      position={item.position}
                      department={item.currentTermAssignment?.department}
                    />
                  </td>

                  {/* 7. Status */}
                  <td className="py-3 px-3">
                    <MemberStatusBadge status={item.status} />
                  </td>

                  {/* 8. Actions */}
                  <td
                    className="py-3 px-4 text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetail(memberObj)}
                        className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700"
                        title="Xem chi tiết hồ sơ"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>

                      {canManage && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700"
                            >
                              <MoreHorizontal className="h-3.5 w-3.5" />
                              <span className="sr-only">Tùy chọn</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 text-xs">
                            <DropdownMenuLabel>Tùy chọn hội viên</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => onViewDetail(memberObj)}>
                              <Eye className="h-3.5 w-3.5 mr-2 text-slate-500" />
                              Xem chi tiết lý lịch
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEdit(memberObj)}>
                              <Edit2 className="h-3.5 w-3.5 mr-2 text-slate-500" />
                              Chỉnh sửa hồ sơ
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onAssignTerm(memberObj)}>
                              <Calendar className="h-3.5 w-3.5 mr-2 text-indigo-500" />
                              Phân công nhiệm kỳ
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => onDelete(memberObj)}
                              className="text-rose-600 focus:text-rose-600 focus:bg-rose-50"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-2" />
                              Xóa hồ sơ hội viên
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 bg-slate-50/60 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div>
          Hiển thị{' '}
          <strong className="text-slate-800 font-medium">
            {totalCount > 0 ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, totalCount)}
          </strong>{' '}
          trên <strong className="text-slate-800 font-medium">{totalCount}</strong> hội viên
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="h-7 text-xs px-2.5 bg-white border-slate-200 text-slate-700 disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5 mr-1" />
            Trước
          </Button>

          <span className="px-2 text-xs font-medium text-slate-700">
            Trang {page} / {Math.max(totalPages, 1)}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="h-7 text-xs px-2.5 bg-white border-slate-200 text-slate-700 disabled:opacity-40"
          >
            Sau
            <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
