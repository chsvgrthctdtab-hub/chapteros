import React from 'react';
import {
  User,
  GraduationCap,
  Mail,
  Phone,
  Calendar,
  Eye,
  Edit2,
  MoreHorizontal,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MemberStatusBadge } from './MemberStatusBadge';
import { MemberRoleBadge } from './MemberRoleBadge';
import type { MemberListItem } from '../types/member.types';
import type { Member } from '@/types';

interface MemberCardProps {
  member: MemberListItem;
  canManage: boolean;
  onViewDetail: (member: Member) => void;
  onEdit: (member: Member) => void;
  onAssignTerm: (member: Member) => void;
  onDelete: (member: Member) => void;
}

export function MemberCard({
  member,
  canManage,
  onViewDetail,
  onEdit,
  onAssignTerm,
  onDelete,
}: MemberCardProps) {
  const initials = member.fullName
    .split(' ')
    .map((n) => n[0])
    .slice(-2)
    .join('')
    .toUpperCase();

  const memberObj: Member = {
    id: member.id,
    organizationId: member.organizationId,
    userId: member.userId,
    studentId: member.studentId,
    fullName: member.fullName,
    email: member.email,
    phone: member.phone,
    className: member.className,
    major: member.major,
    cohort: member.cohort,
    position: member.position,
    status: member.status,
    joinedDate: member.joinedDate,
    notes: member.notes,
    createdAt: member.createdAt,
    updatedAt: member.updatedAt,
  };

  return (
    <div
      onClick={() => onViewDetail(memberObj)}
      className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs hover:border-slate-300 hover:shadow-sm transition-all duration-150 flex flex-col justify-between cursor-pointer group"
    >
      {/* Top section: Avatar, Name, MSSV, Badges */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200/80 group-hover:border-emerald-200 group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors">
              {initials || <User className="h-4 w-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-slate-900 truncate group-hover:text-emerald-700 transition-colors">
                {member.fullName}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-mono text-xs font-medium text-slate-600 bg-slate-50 px-1.5 py-0.2 rounded border border-slate-100">
                  {member.studentId || 'Chưa có MSSV'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            <MemberStatusBadge status={member.status} />
          </div>
        </div>

        {/* Roles & Term Badges */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <MemberRoleBadge
            position={member.position}
            department={member.currentTermAssignment?.department}
          />

          {member.currentTermAssignment ? (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-50 text-slate-700 border border-slate-200"
              title={`Nhiệm kỳ: ${member.currentTermAssignment.termName}`}
            >
              <Calendar className="h-2.5 w-2.5 text-slate-400" />
              <span className="truncate max-w-[120px]">{member.currentTermAssignment.termName}</span>
            </span>
          ) : (
            <span className="text-[10px] text-slate-400 italic bg-slate-50 px-1.5 py-0.5 rounded border border-dashed border-slate-200">
              Chưa gán nhiệm kỳ
            </span>
          )}
        </div>

        {/* Academic Details */}
        <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50/60 p-2.5 rounded-lg border border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-slate-700 font-medium">
              <GraduationCap className="h-3.5 w-3.5 text-slate-400" />
              <span>{member.className || 'Chưa cập nhật lớp'}</span>
            </div>
            {member.cohort && (
              <span className="font-mono text-[10px] text-slate-500 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                {member.cohort}
              </span>
            )}
          </div>

          {member.major && (
            <div className="text-[11px] text-slate-500 truncate pl-5">
              {member.major}
            </div>
          )}
        </div>

        {/* Contact info */}
        <div className="space-y-1 text-xs text-slate-500 pt-0.5">
          <div className="flex items-center space-x-2 truncate">
            <Mail className="h-3 w-3 text-slate-400 shrink-0" />
            <span className="truncate text-[11px]">
              {member.email || <span className="text-slate-300 italic">Chưa có email</span>}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Phone className="h-3 w-3 text-slate-400 shrink-0" />
            <span className="text-[11px]">
              {member.phone || <span className="text-slate-300 italic">Chưa có SĐT</span>}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div
        className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewDetail(memberObj)}
          className="text-xs h-7 text-slate-600 hover:text-slate-900 px-2 font-medium"
        >
          <Eye className="h-3 w-3 mr-1 text-slate-400" />
          Hồ sơ
        </Button>

        <div className="flex items-center space-x-1">
          {canManage && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAssignTerm(memberObj)}
                className="text-xs h-7 px-2 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200"
                title="Gán nhiệm kỳ"
              >
                <Calendar className="h-3 w-3 mr-1 text-indigo-500" />
                Nhiệm kỳ
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-slate-400 hover:text-slate-800"
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                    <span className="sr-only">Thao tác</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44 text-xs">
                  <DropdownMenuLabel>Tùy chọn</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => onEdit(memberObj)}>
                    <Edit2 className="h-3.5 w-3.5 mr-2 text-slate-500" />
                    Chỉnh sửa hồ sơ
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(memberObj)}
                    className="text-rose-600 focus:text-rose-600 focus:bg-rose-50"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                    Xóa hồ sơ
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
