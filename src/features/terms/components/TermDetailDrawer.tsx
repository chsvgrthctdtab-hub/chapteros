import React, { useState } from 'react';
import {
  X,
  Calendar,
  Users,
  Activity,
  CheckSquare,
  Wallet,
  FileSpreadsheet,
  FileText,
  Sparkles,
  ArrowRightLeft,
  CheckCircle,
  Edit2,
  Trash2,
  Plus,
  Search,
  ExternalLink,
  Lock,
  Clock,
  ShieldCheck,
  Award,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TermStatusBadge } from './TermStatusBadge';
import { useTermMembers } from '../queries/term.queries';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import type { Term, TermMember } from '@/types';
import type { TermClosingSnapshot } from '../types/term.types';

interface TermDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  term: Term | null;
  currentTermId?: string | null;
  onActivateTerm?: (term: Term) => void;
  onTransferMembers?: (term: Term) => void;
  onCompleteTerm?: (term: Term) => void;
  onEditTerm?: (term: Term) => void;
  onAddMember?: (term: Term) => void;
  onEditMember?: (member: TermMember) => void;
  onRemoveMember?: (termMemberId: string, memberName: string) => void;
  activitiesCount?: number;
  tasksCount?: number;
  financeBalance?: number;
  canManage?: boolean;
}

export function TermDetailDrawer({
  open,
  onClose,
  term,
  currentTermId,
  onActivateTerm,
  onTransferMembers,
  onCompleteTerm,
  onEditTerm,
  onAddMember,
  onEditMember,
  onRemoveMember,
  activitiesCount = 0,
  tasksCount = 0,
  financeBalance,
  canManage = true,
}: TermDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [memberSearch, setMemberSearch] = useState<string>('');
  const [positionFilter, setPositionFilter] = useState<string>('all');

  const { data: members = [], isLoading: isLoadingMembers } = useTermMembers(
    open && term ? term.id : undefined
  );

  if (!open || !term) return null;

  const isCurrent = term.isCurrent || term.id === currentTermId;
  const isLocked = term.status === 'completed' || term.status === 'archived';
  const snapshot = term.closingSnapshot as unknown as TermClosingSnapshot | undefined;

  const start = dayjs(term.startDate);
  const end = dayjs(term.endDate);
  const formattedDates = `${start.isValid() ? start.format('DD MMM YYYY') : term.startDate} → ${
    end.isValid() ? end.format('DD MMM YYYY') : term.endDate
  }`;

  const formattedBalance = financeBalance !== undefined
    ? new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
      }).format(financeBalance)
    : '₫0';

  // Filter members
  const filteredMembers = members.filter((tm) => {
    const q = memberSearch.toLowerCase().trim();
    const nameMatch = tm.member?.fullName?.toLowerCase().includes(q) || false;
    const codeMatch = tm.member?.studentId?.toLowerCase().includes(q) || false;
    const posMatch = tm.position?.toLowerCase().includes(q) || false;
    const deptMatch = tm.department?.toLowerCase().includes(q) || false;

    const matchesSearch = !q || nameMatch || codeMatch || posMatch || deptMatch;

    if (positionFilter === 'all') return matchesSearch;
    if (positionFilter === 'bch') {
      const p = (tm.position || '').toLowerCase();
      const d = (tm.department || '').toLowerCase();
      return (
        matchesSearch &&
        (p.includes('trưởng') ||
          p.includes('phó') ||
          p.includes('ủy viên') ||
          d.includes('ban chấp hành'))
      );
    }
    if (positionFilter === 'active') {
      return matchesSearch && tm.status === 'active';
    }
    return matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end transition-opacity">
      {/* Click backdrop to close */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Slide-over Drawer Panel */}
      <div
        id="term-detail-drawer"
        className="relative z-10 w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200"
      >
        {/* Drawer Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-50/50 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded">
                  Term Workspace
                </span>
                <TermStatusBadge status={term.status} isCurrent={isCurrent} />
                {snapshot && (
                  <span className="text-[10px] font-mono text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                    Audit Snapshot Saved
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">
                {term.name}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-600 font-mono">
                <Calendar className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>{formattedDates}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="h-8 w-8 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Quick Actions Header Bar */}
          <div className="mt-4 pt-3 border-t border-slate-200/80 flex flex-wrap items-center gap-2">
            {canManage && (
              <>
                {!isCurrent && term.status !== 'archived' && onActivateTerm && (
                  <Button
                    size="sm"
                    onClick={() => onActivateTerm(term)}
                    className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium cursor-pointer shadow-2xs"
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-1" />
                    Set as Current
                  </Button>
                )}

                {onTransferMembers && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onTransferMembers(term)}
                    className="h-8 text-xs text-slate-700 border-slate-200 hover:bg-slate-100 cursor-pointer"
                  >
                    <ArrowRightLeft className="h-3.5 w-3.5 mr-1 text-slate-500" />
                    Transfer Members
                  </Button>
                )}

                {!isLocked && onEditTerm && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEditTerm(term)}
                    className="h-8 text-xs text-slate-700 border-slate-200 hover:bg-slate-100 cursor-pointer"
                  >
                    <Edit2 className="h-3.5 w-3.5 mr-1 text-slate-500" />
                    Edit Term
                  </Button>
                )}

                {term.status !== 'completed' && term.status !== 'archived' && onCompleteTerm && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onCompleteTerm(term)}
                    className="h-8 text-xs text-amber-800 border-amber-200 hover:bg-amber-50 cursor-pointer"
                  >
                    <CheckCircle className="h-3.5 w-3.5 mr-1 text-amber-600" />
                    Close & Snapshot
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Drawer Tabs Navigation */}
        <div className="px-5 sm:px-6 pt-3 border-b border-slate-200 bg-white shrink-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-slate-100/80 p-0.5 h-8 gap-0.5 overflow-x-auto max-w-full">
              <TabsTrigger value="overview" className="text-xs px-2.5 py-1">
                Overview
              </TabsTrigger>
              <TabsTrigger value="members" className="text-xs px-2.5 py-1">
                Members ({members.length})
              </TabsTrigger>
              <TabsTrigger value="activities" className="text-xs px-2.5 py-1">
                Activities ({activitiesCount})
              </TabsTrigger>
              <TabsTrigger value="tasks" className="text-xs px-2.5 py-1">
                Tasks ({tasksCount})
              </TabsTrigger>
              <TabsTrigger value="finance" className="text-xs px-2.5 py-1">
                Finance
              </TabsTrigger>
              {snapshot && (
                <TabsTrigger value="snapshot" className="text-xs px-2.5 py-1 text-teal-800">
                  Snapshot
                </TabsTrigger>
              )}
            </TabsList>
          </Tabs>
        </div>

        {/* Drawer Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Operational Metrics Cards with Deep Links */}
              <div className="grid grid-cols-2 gap-3">
                <Link
                  to={`/members?term=${term.id}`}
                  className="group p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-blue-300 transition-all"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-blue-600" />
                      Members
                    </span>
                    <ExternalLink className="h-3 w-3 text-slate-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                  <p className="text-2xl font-bold text-slate-900 mt-2">
                    {members.length || term.memberCount || 0}
                  </p>
                  <span className="text-[11px] text-blue-700 font-medium mt-1 inline-block">
                    View in Members Module →
                  </span>
                </Link>

                <Link
                  to={`/activities?term=${term.id}`}
                  className="group p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-300 transition-all"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Activity className="h-3.5 w-3.5 text-indigo-600" />
                      Activities
                    </span>
                    <ExternalLink className="h-3 w-3 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                  </div>
                  <p className="text-2xl font-bold text-slate-900 mt-2">{activitiesCount}</p>
                  <span className="text-[11px] text-indigo-700 font-medium mt-1 inline-block">
                    View Activities →
                  </span>
                </Link>

                <Link
                  to={`/tasks?term=${term.id}`}
                  className="group p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-amber-300 transition-all"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1.5">
                      <CheckSquare className="h-3.5 w-3.5 text-amber-600" />
                      Tasks
                    </span>
                    <ExternalLink className="h-3 w-3 text-slate-400 group-hover:text-amber-600 transition-colors" />
                  </div>
                  <p className="text-2xl font-bold text-slate-900 mt-2">{tasksCount}</p>
                  <span className="text-[11px] text-amber-700 font-medium mt-1 inline-block">
                    View Tasks →
                  </span>
                </Link>

                <Link
                  to={`/finance?term=${term.id}`}
                  className="group p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-emerald-300 transition-all"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Wallet className="h-3.5 w-3.5 text-emerald-600" />
                      Treasury Balance
                    </span>
                    <ExternalLink className="h-3 w-3 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                  </div>
                  <p className="text-xl font-bold text-slate-900 mt-2 font-mono truncate">
                    {formattedBalance}
                  </p>
                  <span className="text-[11px] text-emerald-700 font-medium mt-1 inline-block">
                    View Finance →
                  </span>
                </Link>
              </div>

              {/* Term Metadata & Lifecycle Timeline */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Lifecycle Record
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">Start Date:</span>
                    <span className="font-medium text-slate-800">{term.startDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">End Date:</span>
                    <span className="font-medium text-slate-800">{term.endDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Created At:</span>
                    <span className="font-medium text-slate-800">
                      {dayjs(term.createdAt).format('DD/MM/YYYY HH:mm')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Last Updated:</span>
                    <span className="font-medium text-slate-800">
                      {dayjs(term.updatedAt).format('DD/MM/YYYY HH:mm')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Handover & Resolution Documents */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-teal-600" />
                    Governance & Documents
                  </h4>
                  <Link
                    to={`/documents?term=${term.id}`}
                    className="text-xs font-medium text-teal-700 hover:underline"
                  >
                    Open Documents Module →
                  </Link>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Access official resolutions, handover files, executive decisions and financial receipts associated with this governance cycle.
                </p>
              </div>

              {/* Closing Audit Info (if applicable) */}
              {snapshot && (
                <div className="rounded-xl border border-teal-200 bg-teal-50/40 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-teal-900 font-bold text-xs">
                    <ShieldCheck className="h-4 w-4 text-teal-600" />
                    Term Completed with Immutable Closing Snapshot
                  </div>
                  <p className="text-xs text-slate-600">
                    Closed by: <strong>{snapshot.closedByName || 'Administrator'}</strong> on{' '}
                    {dayjs(snapshot.closedAt).format('DD/MM/YYYY HH:mm')}.
                  </p>
                  {snapshot.handoverNotes && (
                    <div className="p-3 bg-white rounded-lg border border-teal-200 text-xs text-slate-700 mt-2">
                      <span className="font-semibold block text-slate-800 mb-1">Handover Notes:</span>
                      {snapshot.handoverNotes}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MEMBERS ROSTER */}
          {activeTab === 'members' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Search members in term..."
                    className="pl-8 h-8 text-xs bg-slate-50 border-slate-200"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Select
                    value={positionFilter}
                    onValueChange={setPositionFilter}
                  >
                    <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-200 font-medium text-slate-700 w-auto min-w-[150px]">
                      <SelectValue placeholder="Tất cả phân công" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả phân công</SelectItem>
                      <SelectItem value="bch">Ban Chấp Hành / Cán bộ</SelectItem>
                      <SelectItem value="active">Đang sinh hoạt</SelectItem>
                    </SelectContent>
                  </Select>

                  {canManage && !isLocked && onAddMember && (
                    <Button
                      size="sm"
                      onClick={() => onAddMember(term)}
                      className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Add Member
                    </Button>
                  )}
                </div>
              </div>

              {isLoadingMembers ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading members roster...</div>
              ) : filteredMembers.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
                  <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-medium">No members match the query</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                  {filteredMembers.map((tm) => (
                    <div
                      key={tm.id}
                      className="p-3 hover:bg-slate-50/70 flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-8 w-8 text-xs shrink-0 border border-slate-200">
                          <AvatarFallback className="bg-slate-100 text-slate-700 font-semibold">
                            {(tm.member?.fullName || 'M').charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {tm.member?.fullName || 'Unnamed Member'}
                            </span>
                            {tm.member?.studentId && (
                              <span className="text-[11px] text-slate-400 font-mono">
                                ({tm.member.studentId})
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 flex-wrap">
                            <span className="font-medium text-slate-700">{tm.position || 'Hội viên'}</span>
                            {tm.department && (
                              <>
                                <span>•</span>
                                <span>{tm.department}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Badge
                          variant={tm.status === 'active' ? 'default' : 'secondary'}
                          className="text-[10px] h-5"
                        >
                          {tm.status}
                        </Badge>

                        {canManage && !isLocked && (
                          <>
                            {onEditMember && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEditMember(tm)}
                                className="h-7 w-7 p-0 text-slate-400 hover:text-slate-700"
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                            )}
                            {onRemoveMember && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  onRemoveMember(tm.id, tm.member?.fullName || 'Member')
                                }
                                className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-2 text-right">
                <Link
                  to={`/members?term=${term.id}`}
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  Manage Full Roster in Members Module →
                </Link>
              </div>
            </div>
          )}

          {/* TAB 3: ACTIVITIES */}
          {activeTab === 'activities' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Activities in Term ({activitiesCount})
                </h4>
                <Link
                  to={`/activities?term=${term.id}`}
                  className="text-xs font-semibold text-indigo-600 hover:underline"
                >
                  Open Activities Module →
                </Link>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-600 space-y-2">
                <p>
                  All programs, workshops, community volunteer initiatives and meetings conducted within{' '}
                  <strong>{term.name}</strong>.
                </p>
                <p className="text-slate-500">
                  Total recorded events: <strong>{activitiesCount}</strong>. Filter and manage registrations, attendance records and leads in the Activities workspace.
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: TASKS */}
          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Tasks in Term ({tasksCount})
                </h4>
                <Link
                  to={`/tasks?term=${term.id}`}
                  className="text-xs font-semibold text-amber-600 hover:underline"
                >
                  Open Tasks Module →
                </Link>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-600 space-y-2">
                <p>
                  Deliverables, committee assignments and deadlines linked to the <strong>{term.name}</strong> cycle.
                </p>
                <p className="text-slate-500">
                  Total tasks tracked: <strong>{tasksCount}</strong>.
                </p>
              </div>
            </div>
          )}

          {/* TAB 5: FINANCE */}
          {activeTab === 'finance' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Financial Overview
                </h4>
                <Link
                  to={`/finance?term=${term.id}`}
                  className="text-xs font-semibold text-emerald-600 hover:underline"
                >
                  Open Finance Module →
                </Link>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">Net Term Balance</span>
                  <span className="text-lg font-bold font-mono text-emerald-700">
                    {formattedBalance}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Income and expense ledgers, reimbursement approvals, and period closings scoped to{' '}
                  <strong>{term.name}</strong>.
                </p>
              </div>
            </div>
          )}

          {/* TAB 6: SNAPSHOT */}
          {activeTab === 'snapshot' && snapshot && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/50 space-y-3">
                <div className="flex items-center gap-2 text-teal-900 font-bold text-sm">
                  <Award className="h-4 w-4 text-teal-600" />
                  Historical Term Closing Snapshot
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-2">
                  <div className="bg-white p-2.5 rounded-lg border border-teal-100">
                    <span className="text-slate-400 block text-[11px]">Final Members</span>
                    <strong className="text-slate-900 text-sm">
                      {snapshot.stats?.members?.total ?? 0}
                    </strong>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-teal-100">
                    <span className="text-slate-400 block text-[11px]">Final Activities</span>
                    <strong className="text-slate-900 text-sm">
                      {snapshot.stats?.activities?.total ?? 0}
                    </strong>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-teal-100">
                    <span className="text-slate-400 block text-[11px]">Final Tasks</span>
                    <strong className="text-slate-900 text-sm">
                      {snapshot.stats?.tasks?.total ?? 0}
                    </strong>
                  </div>
                </div>

                {snapshot.handoverNotes && (
                  <div className="mt-3 pt-3 border-t border-teal-200 text-xs">
                    <strong className="text-slate-800 block mb-1">Handover Directives:</strong>
                    <p className="text-slate-700 bg-white p-3 rounded-lg border border-teal-100">
                      {snapshot.handoverNotes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
