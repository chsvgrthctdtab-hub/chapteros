import React, { useState } from 'react';
import {
  Users,
  Shield,
  ArrowRight,
  UserCheck,
  Crown,
  KeyRound,
  FileSpreadsheet,
  Coins,
  CheckCircle2,
  ExternalLink,
  UserPlus,
  Link2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ROLES, type RoleDefinition, type OrganizationRole, getOrgBoardTitle, getRoleLabel, getOrgMemberNoun } from '@/types/roles';
import { useOrganizationMemberships } from '@/features/chapters/queries/organization.queries';
import { Link } from 'react-router-dom';
import type { Organization } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { CreateInviteDialog } from './CreateInviteDialog';

interface MembersRolesTabProps {
  organization: Organization | null;
  canManage?: boolean;
}

export function MembersRolesTab({ organization, canManage: propCanManage }: MembersRolesTabProps) {
  const { activeRole } = useAuth();
  const { data: memberships = [], isLoading } = useOrganizationMemberships(organization?.id);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

  const canManage = propCanManage ?? (activeRole === 'admin' || activeRole === 'leader');

  const orgType = organization?.type;
  const boardTitle = getOrgBoardTitle(orgType, 'vi');
  const memberNoun = getOrgMemberNoun(orgType, 'vi');

  // Filter Executive Board members (roles < admin: leader, deputy, treasurer, secretary)
  const boardMembers = memberships.filter((m) =>
    m.role !== 'admin' && ['leader', 'deputy', 'treasurer', 'secretary'].includes(m.role)
  );

  const roleDefinitionsList: RoleDefinition[] = Object.values(ROLES);

  const getRoleIcon = (roleKey: OrganizationRole) => {
    switch (roleKey) {
      case 'admin':
        return Crown;
      case 'leader':
        return Shield;
      case 'deputy':
        return UserCheck;
      case 'treasurer':
        return Coins;
      case 'secretary':
        return FileSpreadsheet;
      default:
        return Users;
    }
  };

  return (
    <div id="settings-roles-tab" className="space-y-6">
      {/* Overview & Quick Stats */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] font-semibold bg-emerald-50 text-emerald-800 border-emerald-200">
                Phân quyền RBAC
              </Badge>
              <span className="text-xs text-slate-400 font-mono">PostgreSQL Row-Level Security</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-1">
              Nhân sự {boardTitle} & Phân quyền Đơn vị
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
              Cơ chế phân quyền {boardTitle} đảm bảo phân định rõ ràng trách nhiệm giữa Trưởng đơn vị và các chức danh phụ trách.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            {canManage && (
              <Button
                id="btn-open-create-invite"
                variant="default"
                size="sm"
                onClick={() => setIsInviteDialogOpen(true)}
                className="text-xs h-8 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-2xs font-medium gap-1.5"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Cấp quyền cán bộ
              </Button>
            )}

            <Link to="/members">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8 text-slate-700 border-slate-200 hover:bg-slate-50 cursor-pointer shadow-2xs font-medium shrink-0"
              >
                Quản lý Danh sách {memberNoun}
                <ArrowRight className="h-3.5 w-3.5 ml-1.5 text-slate-500" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Active Executive Board Members */}
      <Card className="border-slate-200 shadow-2xs">
        <CardHeader className="pb-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <Crown className="h-4 w-4 text-amber-600" />
                {boardTitle} Hiện Tại ({boardMembers.length})
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Các thành viên nắm giữ vai trò điều hành, quản lý chuyên môn và tài chính trong đơn vị
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-[11px] font-medium">
              Nhân sự {boardTitle}: {boardMembers.length}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-5">
          {isLoading ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              Đang tải danh sách Ban Chấp Hành...
            </div>
          ) : boardMembers.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="font-medium text-slate-700">Chưa có thành viên Ban Chấp Hành</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Gán vai trò quản trị cho hội viên tại mục Quản lý Hội viên.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {boardMembers.map((membership) => {
                const roleDef = ROLES[membership.role];
                const Icon = getRoleIcon(membership.role);
                return (
                  <div
                    key={membership.id}
                    className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-700 shrink-0 shadow-2xs">
                        {membership.profile?.fullName
                          ? membership.profile.fullName
                              .split(' ')
                              .filter(Boolean)
                              .map((n) => n[0])
                              .slice(-2)
                              .join('')
                              .toUpperCase()
                          : 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {membership.profile?.fullName || 'Chưa cập nhật tên'}
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono truncate">
                          {membership.profile?.studentId ? `MSSV: ${membership.profile.studentId}` : membership.profile?.email || 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      {roleDef && (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${roleDef.colorClasses.bg} ${roleDef.colorClasses.text} ${roleDef.colorClasses.border}`}
                        >
                          <Icon className="h-3 w-3" />
                          {getRoleLabel(membership.role, 'vi', organization?.type)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Definitions Matrix */}
      <Card className="border-slate-200 shadow-2xs">
        <CardHeader className="pb-4 border-b border-slate-100">
          <CardTitle className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-emerald-600" />
            Ma Trận Quyền Hạn Hệ Thống (RBAC Matrix)
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 mt-0.5">
            Quy định phân quyền chi tiết cho từng vai trò trên nền tảng ChapterOS
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {roleDefinitionsList.map((roleDef) => {
              const Icon = getRoleIcon(roleDef.key);
              const assignedCount = memberships.filter((m) => m.role === roleDef.key).length;

              return (
                <div key={roleDef.key} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border ${roleDef.colorClasses.bg} ${roleDef.colorClasses.text} ${roleDef.colorClasses.border}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{roleDef.label}</span>
                        <Badge variant="outline" className="text-[10px] font-mono py-0 px-1.5 text-slate-500">
                          Cấp độ {roleDef.level}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                        {roleDef.description}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-3 self-end sm:self-center">
                    <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/70">
                      {assignedCount} nhân sự
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Generate Invite Link Modal */}
      <CreateInviteDialog
        isOpen={isInviteDialogOpen}
        onClose={() => setIsInviteDialogOpen(false)}
        organizationId={organization?.id}
        organizationName={organization?.name}
      />
    </div>
  );
}
