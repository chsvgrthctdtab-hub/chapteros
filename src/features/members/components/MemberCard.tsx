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
import { getMajorFromClassOrValue } from '../utils/major.utils';
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
      className="bg-white border border-hairline rounded-2xl p-4 shadow-xs hover:border-[#d4e4fa] hover:shadow-xs transition-all duration-150 flex flex-col justify-between cursor-pointer group"
    >
      {/* Top section: Avatar, Name, MSSV, Badges */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-pebble text-ink-navy font-bold text-xs flex items-center justify-center shrink-0 border border-hairline group-hover:border-[#d4e4fa] group-hover:bg-[#e6f0ff] group-hover:text-signal-blue transition-colors">
              {initials || <User className="h-4 w-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-ink-navy truncate group-hover:text-signal-blue transition-colors">
                {member.fullName}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="tabular-nums text-xs font-medium text-slate-gray bg-cloud px-1.5 py-0.5 rounded border border-hairline">
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
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#e6f0ff] text-signal-blue border border-[#d4e4fa]"
              title={`Nhiệm kỳ: ${member.currentTermAssignment.termName}`}
            >
              <Calendar className="h-2.5 w-2.5 text-signal-blue" />
              <span className="truncate max-w-[120px]">{member.currentTermAssignment.termName}</span>
            </span>
          ) : (
            <span className="text-[10px] text-mist-gray italic bg-cloud px-1.5 py-0.5 rounded border border-dashed border-hairline">
              Chưa gán nhiệm kỳ
            </span>
          )}
        </div>

        {/* Academic Details */}
        <div className="space-y-1.5 text-xs text-slate-gray bg-cloud p-2.5 rounded-xl border border-hairline">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-ink-navy font-medium">
              <GraduationCap className="h-3.5 w-3.5 text-mist-gray" />
              <span>{member.className || 'Chưa cập nhật lớp'}</span>
            </div>
            {member.cohort && (
              <span className="tabular-nums text-[10px] text-slate-gray bg-white px-1.5 py-0.5 rounded-full border border-hairline font-medium">
                {member.cohort}
              </span>
            )}
          </div>

          {(() => {
            const displayMajor = getMajorFromClassOrValue(member.className, member.major, '');
            return displayMajor ? (
              <div className="text-[11px] text-slate-gray truncate pl-5">
                {displayMajor}
              </div>
            ) : null;
          })()}
        </div>

        {/* Contact info */}
        <div className="space-y-1 text-xs text-slate-gray pt-0.5">
          <div className="flex items-center space-x-2 truncate">
            <Mail className="h-3 w-3 text-mist-gray shrink-0" />
            <span className="truncate text-[11px]">
              {member.email || <span className="text-mist-gray italic">Chưa có email</span>}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Phone className="h-3 w-3 text-mist-gray shrink-0" />
            <span className="tabular-nums text-[11px]">
              {member.phone || <span className="text-mist-gray italic">Chưa có SĐT</span>}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div
        className="flex items-center justify-between pt-3 mt-3 border-t border-hairline"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewDetail(memberObj)}
          className="text-xs h-7 text-slate-gray hover:text-ink-navy hover:bg-cloud px-2 font-medium rounded-lg"
        >
          <Eye className="h-3 w-3 mr-1 text-mist-gray" />
          Hồ sơ
        </Button>

        <div className="flex items-center space-x-1">
          {canManage && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAssignTerm(memberObj)}
                className="text-xs h-7 px-2 text-ink-navy border-hairline hover:bg-[#e6f0ff] hover:text-signal-blue hover:border-[#d4e4fa] rounded-lg"
                title="Gán nhiệm kỳ"
              >
                <Calendar className="h-3 w-3 mr-1 text-signal-blue" />
                Nhiệm kỳ
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-mist-gray hover:text-ink-navy hover:bg-cloud rounded-lg"
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                    <span className="sr-only">Thao tác</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44 text-xs rounded-xl border-hairline bg-white shadow-lg">
                  <DropdownMenuLabel className="text-slate-gray font-medium">Tùy chọn</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => onEdit(memberObj)} className="cursor-pointer">
                    <Edit2 className="h-3.5 w-3.5 mr-2 text-slate-gray" />
                    Chỉnh sửa hồ sơ
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-hairline" />
                  <DropdownMenuItem
                    onClick={() => onDelete(memberObj)}
                    className="text-rose-600 focus:text-rose-700 focus:bg-rose-50 cursor-pointer"
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
