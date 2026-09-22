import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Building2,
  Search,
  Users2,
  Check,
  Loader2,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { useSearchOrganizations } from '@/features/chapters/queries/organization.queries';
import { useAddCohost } from '../queries/plan.queries';
import { getOrgTypeLabel, getOrgTypeBadgeClass } from '@/lib/organization.utils';
import type { Organization } from '@/types';

type InviteRole = 'co_host' | 'partner' | 'supporter' | 'observer';

interface InviteCohostDialogProps {
  isOpen: boolean;
  onClose: () => void;
  planId: string;
  existingOrgIds: Set<string>;
  onSuccess: () => void;
}

const COLLAB_ROLES: { value: InviteRole; label: string; description: string }[] = [
  { value: 'co_host', label: 'Đơn vị đồng tổ chức (Co-host)', description: 'Tham gia điều hành, quản lý hoạt động & nhân sự' },
  { value: 'partner', label: 'Đối tác phối hợp (Partner)', description: 'Phối hợp triển khai nội dung hoặc địa điểm' },
  { value: 'supporter', label: 'Đơn vị tài trợ / Hỗ trợ (Supporter)', description: 'Tài trợ ngân sách, vật phẩm hoặc hậu cần' },
  { value: 'observer', label: 'Đơn vị quan sát (Observer)', description: 'Theo dõi tiến độ và báo cáo tổng kết' },
];

export function InviteCohostDialog({
  isOpen,
  onClose,
  planId,
  existingOrgIds,
  onSuccess,
}: InviteCohostDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [roleInPlan, setRoleInPlan] = useState<InviteRole>('co_host');
  const [roleDescription, setRoleDescription] = useState('Đơn vị đồng tổ chức');
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Search all organizations in the system
  const { data: searchResults = [], isLoading: isSearching } = useSearchOrganizations(
    searchQuery,
    isOpen
  );

  const addCohostMutation = useAddCohost();

  // Filter out organizations that are already in this plan
  const eligibleOrganizations = useMemo(() => {
    return searchResults.filter((org) => !existingOrgIds.has(org.id));
  }, [searchResults, existingOrgIds]);

  const handleSelectOrg = (org: Organization) => {
    setSelectedOrg(org);
    setSubmitError(null);
  };

  const handleConfirmInvite = async () => {
    if (!selectedOrg || !planId) return;

    try {
      setSubmitError(null);
      await addCohostMutation.mutateAsync({
        planId,
        organizationId: selectedOrg.id,
        roleInPlan,
        roleDescription: roleDescription.trim() || 'Đơn vị đồng tổ chức',
      });

      // Reset and close
      setSelectedOrg(null);
      setSearchQuery('');
      setRoleInPlan('co_host');
      setRoleDescription('Đơn vị đồng tổ chức');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to add cohost:', err);
      setSubmitError(err?.message || 'Không thể thêm đơn vị phối hợp. Vui lòng thử lại.');
    }
  };

  const handleClose = () => {
    setSelectedOrg(null);
    setSearchQuery('');
    setRoleInPlan('co_host');
    setSubmitError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        id="invite-cohost-dialog"
        className="sm:max-w-2xl md:max-w-3xl max-h-[92vh] overflow-y-auto bg-white border border-hairline shadow-sm rounded-2xl p-6 sm:p-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        <DialogHeader className="space-y-1 text-left pb-2 border-b border-hairline">
          <div className="flex items-center gap-2 text-signal-blue font-semibold text-xs mb-0.5">
            <Users2 className="h-4 w-4" />
            <span>Mời đơn vị phối hợp</span>
          </div>
          <DialogTitle className="text-lg font-bold text-ink-navy">
            Mời Đơn Vị Phối Hợp (Co-host)
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-gray leading-relaxed">
            Tìm kiếm các Liên chi hội, Chi hội, Câu lạc bộ hoặc Đội trên hệ thống theo tên hoặc mã định danh để cùng phối hợp triển khai chiến dịch.
          </DialogDescription>
        </DialogHeader>

        {submitError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            <div>{submitError}</div>
          </div>
        )}

        <div className="space-y-4 py-2">
          {/* Search Input */}
          <div className="space-y-1.5">
            <label htmlFor="search-org-input" className="block text-xs font-semibold text-ink-navy">
              Tìm kiếm đơn vị phối hợp
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-mist-gray" />
              <Input
                id="search-org-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nhập tên đơn vị hoặc mã code (ví dụ: LCH CNTT, CH-01, CLB Guitar, Đội CTXH)..."
                className="pl-9 h-9.5 bg-white border-hairline rounded-lg text-xs text-ink-navy placeholder:text-mist-gray focus:border-signal-blue"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-signal-blue" />
              )}
            </div>
          </div>

          {/* Search Results List */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-gray px-0.5">
              <span>Danh sách kết quả ({eligibleOrganizations.length})</span>
              {selectedOrg && (
                <span className="text-signal-blue font-medium truncate max-w-[240px]">
                  Đã chọn: <span className="font-semibold text-ink-navy">{selectedOrg.name}</span>
                </span>
              )}
            </div>

            <div className="max-h-56 overflow-y-auto border border-hairline rounded-xl divide-y divide-hairline bg-white shadow-inner">
              {isSearching ? (
                <div className="p-6 text-center text-xs text-slate-gray flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-signal-blue" />
                  <span>Đang tìm kiếm đơn vị...</span>
                </div>
              ) : eligibleOrganizations.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-gray">
                  {searchQuery.trim() ? (
                    <p>Không tìm thấy đơn vị nào phù hợp hoặc đơn vị đã tham gia chiến dịch.</p>
                  ) : (
                    <p>Chưa có kết quả tìm kiếm. Vui lòng nhập từ khóa tìm kiếm.</p>
                  )}
                </div>
              ) : (
                eligibleOrganizations.map((org) => {
                  const isSelected = selectedOrg?.id === org.id;
                  const typeLabel = getOrgTypeLabel(org.type);
                  const typeBadgeClass = getOrgTypeBadgeClass(org.type);
                  const parentName = org.parent?.name;

                  return (
                    <div
                      key={org.id}
                      onClick={() => handleSelectOrg(org)}
                      className={`p-3 flex items-center justify-between cursor-pointer transition-colors text-left ${
                        isSelected
                          ? 'bg-[#e6f0ff]/60 border-hairline text-ink-navy'
                          : 'hover:bg-pebble text-ink-navy'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSelected
                              ? 'bg-signal-blue text-white shadow-sm'
                              : 'bg-cloud border border-hairline text-slate-gray'
                          }`}
                        >
                          {org.logoUrl ? (
                            <img
                              src={org.logoUrl}
                              alt={org.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            org.code.slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold border ${typeBadgeClass}`}>
                              {typeLabel}
                            </span>
                            <p className="text-xs font-semibold text-ink-navy truncate">
                              {org.name}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-gray font-mono mt-0.5 tabular-nums">
                            <span>Mã: {org.code}</span>
                            {parentName && (
                              <span className="text-signal-blue font-sans">
                                • Trực thuộc: {parentName}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 ml-2">
                        {isSelected ? (
                          <div className="w-6 h-6 rounded-full bg-signal-blue text-white flex items-center justify-center shadow-sm">
                            <Check className="h-3.5 w-3.5" />
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-slate-gray hover:text-signal-blue hover:bg-pebble"
                          >
                            Chọn
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Role / Responsibility in Campaign */}
          {selectedOrg && (
            <div className="space-y-3 pt-1 bg-pebble p-3.5 rounded-xl border border-hairline">
              <div className="space-y-1.5">
                <label htmlFor="cohost-role-in-plan" className="block text-xs font-semibold text-ink-navy">
                  Phân loại vai trò tham gia <span className="text-rose-500">*</span>
                </label>
                <Select
                  value={roleInPlan}
                  onValueChange={(val: InviteRole) => {
                    setRoleInPlan(val);
                    if (val === 'co_host' && roleDescription === 'Đơn vị phối hợp') setRoleDescription('Đơn vị đồng tổ chức');
                    if (val === 'partner') setRoleDescription('Đối tác đồng hành');
                    if (val === 'supporter') setRoleDescription('Đơn vị tài trợ / Hỗ trợ');
                    if (val === 'observer') setRoleDescription('Đơn vị quan sát');
                  }}
                >
                  <SelectTrigger id="cohost-role-in-plan" className="h-9.5 bg-white border-hairline text-xs rounded-lg text-ink-navy">
                    <SelectValue placeholder="Chọn vai trò tham gia" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-hairline rounded-xl shadow-sm">
                    {COLLAB_ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value} className="text-xs py-2">
                        <div>
                          <div className="font-semibold text-ink-navy">{r.label}</div>
                          <div className="text-[11px] text-slate-gray">{r.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="cohost-role-input" className="block text-xs font-semibold text-ink-navy">
                  Nội dung trách nhiệm / Mô tả phân công
                </label>
                <Input
                  id="cohost-role-input"
                  value={roleDescription}
                  onChange={(e) => setRoleDescription(e.target.value)}
                  placeholder="Ví dụ: Phụ trách mảng Tình nguyện, Hậu cần & Truyền thông..."
                  className="h-9.5 bg-white border-hairline rounded-lg text-xs text-ink-navy placeholder:text-mist-gray focus:border-signal-blue"
                />
                <p className="text-[11px] text-slate-gray">
                  Mô tả này sẽ hiển thị công khai trên danh sách ban tổ chức chiến dịch.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="pt-3 gap-2 border-t border-hairline">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClose}
            className="text-xs h-9 px-4 rounded-lg border-hairline text-ink-navy hover:bg-pebble"
          >
            Hủy
          </Button>
          <Button
            id="btn-confirm-invite-cohost"
            size="sm"
            onClick={handleConfirmInvite}
            disabled={!selectedOrg || addCohostMutation.isPending}
            className="text-xs h-9 px-4 rounded-lg bg-signal-blue hover:bg-[#005be0] text-white font-semibold shadow-sm"
          >
            {addCohostMutation.isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                Đang gửi lời mời...
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Xác nhận mời tham gia
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
