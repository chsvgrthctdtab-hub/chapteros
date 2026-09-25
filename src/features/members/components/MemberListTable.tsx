import React from 'react';
import {
  User,
  MoreHorizontal,
  Eye,
  Edit2,
  Calendar,
  Trash2,
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
import { getMajorFromClassOrValue } from '../utils/major.utils';
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
      <div className="bg-white border border-hairline rounded-2xl p-12 text-center shadow-xs space-y-4">
        <div className="h-14 w-14 bg-cloud text-mist-gray rounded-2xl flex items-center justify-center mx-auto border border-hairline">
          <User strokeWidth={1.5} className="h-7 w-7 text-mist-gray" />
        </div>
        <div className="space-y-1 max-w-md mx-auto">
          <h3 className="text-sm font-semibold text-ink-navy">Không tìm thấy hội viên nào</h3>
          <p className="text-xs text-slate-gray">
            Chưa có hồ sơ hội viên nào trong Đơn vị hoặc không có kết quả phù hợp với tiêu chí tìm kiếm và bộ lọc hiện tại.
          </p>
        </div>
        {canManage && onAddNew && (
          <Button
            onClick={onAddNew}
            size="sm"
            className="bg-signal-blue hover:bg-[#005be0] text-white text-xs h-8 rounded-lg shadow-sm cursor-pointer"
          >
            <UserPlus className="h-3.5 w-3.5 mr-1.5" />
            Thêm hội viên đầu tiên
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border border-hairline rounded-2xl overflow-hidden shadow-xs flex flex-col">
      <div className="overflow-x-auto overflow-y-auto max-h-[640px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <table className="w-full text-left text-xs text-slate-gray">
          <thead className="sticky top-0 z-10 bg-cloud/95 backdrop-blur-xs text-[11px] font-bold text-slate-gray border-b border-hairline uppercase tracking-wider shadow-xs">
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
          <tbody className="divide-y divide-hairline">
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
                  className="hover:bg-cloud/80 transition-colors group cursor-pointer"
                  onClick={() => onViewDetail(memberObj)}
                >
                  {/* 1. Member: Avatar + Name + Secondary email */}
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-9 w-9 rounded-xl bg-pebble text-ink-navy font-bold text-xs flex items-center justify-center shrink-0 border border-hairline group-hover:border-[#d4e4fa] group-hover:bg-[#e6f0ff] group-hover:text-signal-blue transition-colors">
                        {initials || <User className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-ink-navy group-hover:text-signal-blue transition-colors truncate">
                          {item.fullName}
                        </div>
                        <div className="text-[11px] text-slate-gray truncate">
                          {item.email || <span className="text-mist-gray italic">Chưa có email</span>}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* 2. Student ID */}
                  <td className="py-3 px-3">
                    {item.studentId ? (
                      <span className="tabular-nums text-xs font-medium text-ink-navy bg-cloud px-2 py-0.5 rounded border border-hairline">
                        {item.studentId}
                      </span>
                    ) : (
                      <span className="text-[11px] text-mist-gray italic">Unassigned</span>
                    )}
                  </td>

                  {/* 3. Class & Cohort / Major */}
                  <td className="py-3 px-3">
                    <div className="space-y-0.5">
                      <div className="font-medium text-ink-navy flex items-center space-x-1.5">
                        <GraduationCap className="h-3 w-3 text-mist-gray shrink-0" />
                        <span className="truncate">{item.className || 'Chưa có lớp'}</span>
                        {item.cohort && (
                          <span className="tabular-nums text-[10px] bg-pebble text-slate-gray px-1.5 py-0.5 rounded-full shrink-0 font-medium">
                            {item.cohort}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-gray truncate max-w-[160px]">
                        {getMajorFromClassOrValue(item.className, item.major, 'Chưa cập nhật ngành')}
                      </div>
                    </div>
                  </td>

                  {/* 4. Contact info */}
                  <td className="py-3 px-3">
                    <div className="space-y-0.5 text-[11px]">
                      {item.phone ? (
                        <div className="flex items-center space-x-1 text-slate-gray">
                          <Phone className="h-3 w-3 text-mist-gray shrink-0" />
                          <span className="tabular-nums text-[11px]">{item.phone}</span>
                        </div>
                      ) : (
                        <div className="text-mist-gray italic text-[10px]">Chưa có SĐT</div>
                      )}
                    </div>
                  </td>

                  {/* 5. Term Assignment */}
                  <td className="py-3 px-3">
                    {item.currentTermAssignment ? (
                      <div className="space-y-0.5">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#e6f0ff] text-signal-blue border border-[#d4e4fa]"
                          title={item.currentTermAssignment.termName}
                        >
                          <Calendar className="h-2.5 w-2.5 text-signal-blue shrink-0" />
                          <span className="truncate max-w-[110px]">{item.currentTermAssignment.termName}</span>
                        </span>
                        {item.currentTermAssignment.department && (
                          <div className="text-[10px] text-slate-gray truncate max-w-[120px]">
                            {item.currentTermAssignment.department}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] text-mist-gray italic bg-cloud border border-dashed border-hairline">
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
                        className="h-7 w-7 p-0 text-mist-gray hover:text-ink-navy hover:bg-pebble rounded-lg"
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
                              className="h-7 w-7 p-0 text-mist-gray hover:text-ink-navy hover:bg-pebble rounded-lg"
                            >
                              <MoreHorizontal className="h-3.5 w-3.5" />
                              <span className="sr-only">Tùy chọn</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 text-xs rounded-xl border-hairline bg-white shadow-lg">
                            <DropdownMenuLabel className="text-slate-gray font-medium">Tùy chọn hội viên</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => onViewDetail(memberObj)} className="cursor-pointer">
                              <Eye className="h-3.5 w-3.5 mr-2 text-slate-gray" />
                              Xem chi tiết lý lịch
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEdit(memberObj)} className="cursor-pointer">
                              <Edit2 className="h-3.5 w-3.5 mr-2 text-slate-gray" />
                              Chỉnh sửa hồ sơ
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onAssignTerm(memberObj)} className="cursor-pointer">
                              <Calendar className="h-3.5 w-3.5 mr-2 text-signal-blue" />
                              Phân công nhiệm kỳ
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-hairline" />
                            <DropdownMenuItem
                              onClick={() => onDelete(memberObj)}
                              className="text-rose-600 focus:text-rose-700 focus:bg-rose-50 cursor-pointer"
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
      <div className="p-3 bg-cloud/80 border-t border-hairline flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-gray">
        <div>
          Hiển thị{' '}
          <strong className="text-ink-navy font-semibold tabular-nums">
            {totalCount > 0 ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, totalCount)}
          </strong>{' '}
          trên <strong className="text-ink-navy font-semibold tabular-nums">{totalCount}</strong> hội viên
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="h-7 text-xs px-2.5 bg-white border-hairline text-ink-navy hover:bg-cloud rounded-lg shadow-xs disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5 mr-1" />
            Trước
          </Button>

          <span className="px-2 text-xs font-medium text-ink-navy tabular-nums">
            Trang {page} / {Math.max(totalPages, 1)}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="h-7 text-xs px-2.5 bg-white border-hairline text-ink-navy hover:bg-cloud rounded-lg shadow-xs disabled:opacity-40"
          >
            Sau
            <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
