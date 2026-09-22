import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  CheckCircle2,
  ArrowRight,
  PlusCircle,
  Shield,
  Loader2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROLES } from '@/types/roles';
import type { Organization, OrganizationMembership } from '@/types';

interface MyOrganizationsCardProps {
  userOrganizations: { organization: Organization; membership: OrganizationMembership }[];
  activeOrganizationId?: string;
  onSwitchOrganization: (orgId: string) => Promise<void>;
  isLoading?: boolean;
}

export function MyOrganizationsCard({
  userOrganizations,
  activeOrganizationId,
  onSwitchOrganization,
  isLoading = false,
}: MyOrganizationsCardProps) {
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  const handleSwitch = async (orgId: string) => {
    if (orgId === activeOrganizationId) return;
    setSwitchingId(orgId);
    try {
      await onSwitchOrganization(orgId);
    } finally {
      setSwitchingId(null);
    }
  };

  return (
    <Card className="border-hairline shadow-xs">
      <CardHeader className="border-b border-hairline bg-cloud pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-signal-blue flex items-center justify-center text-white shadow-xs">
              <Building2 strokeWidth={1.5} className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold text-ink-navy">
                  Danh sách Đơn vị của tôi
                </CardTitle>
                <Badge variant="outline" className="text-[11px] bg-white text-slate-gray border-hairline">
                  {userOrganizations.length} Chi hội
                </Badge>
              </div>
              <CardDescription className="text-xs text-mist-gray mt-0.5">
                Các Chi hội bạn đang là thành viên hoặc quản trị viên (Hỗ trợ Multi-organization)
              </CardDescription>
            </div>
          </div>

          <Link to="/onboarding">
            <Button size="sm" variant="outline" className="text-xs gap-1.5 h-8 border-hairline text-slate-gray hover:text-ink-navy hover:bg-pebble">
              <PlusCircle className="h-3.5 w-3.5 text-signal-blue" />
              Tạo thêm Đơn vị mới
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="pt-5 space-y-3">
        {isLoading ? (
          <div className="py-8 text-center text-mist-gray text-xs">
            <Loader2 strokeWidth={1.5} className="h-5 w-5 animate-spin mx-auto mb-2 text-signal-blue" />
            Đang tải danh sách Chi hội...
          </div>
        ) : userOrganizations.length === 0 ? (
          <div className="text-center py-8 space-y-3">
            <Building2 strokeWidth={1.5} className="h-8 w-8 text-mist-gray mx-auto" />
            <p className="text-xs text-mist-gray">Bạn chưa là thành viên của Đơn vị nào.</p>
            <Link to="/onboarding">
              <Button size="sm" className="text-xs bg-signal-blue hover:bg-[#005be0] text-white">
                <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
                Khởi tạo Đơn vị đầu tiên
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {userOrganizations.map(({ organization, membership }) => {
              const isActive = organization.id === activeOrganizationId;
              const isSwitching = switchingId === organization.id;
              const roleInfo = ROLES[membership.role];

              return (
                <div
                  key={organization.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isActive
                      ? 'border-signal-blue bg-[#f0f6ff] shadow-xs ring-1 ring-signal-blue/20'
                      : 'border-hairline bg-white hover:border-[#d4e4fa] hover:bg-cloud'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="h-9 w-9 rounded-lg bg-cloud border border-hairline flex items-center justify-center shrink-0 overflow-hidden text-slate-gray font-bold text-xs">
                        {organization.logoUrl ? (
                          <img
                            src={organization.logoUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          organization.code.slice(0, 2)
                        )}
                      </div>
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-ink-navy truncate">
                            {organization.name}
                          </span>
                          {isActive && (
                            <Badge className="bg-signal-blue text-white text-[9px] py-0 px-1.5">
                              Đang hoạt động
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-mist-gray">
                          <span className="font-mono bg-cloud px-1.5 py-0.5 rounded text-[10px] text-slate-gray border border-hairline">
                            {organization.code}
                          </span>
                          {organization.description && (
                            <span className="truncate max-w-[160px]" title={organization.description}>
                              {organization.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {roleInfo && (
                      <span
                        className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${roleInfo.colorClasses.bg} ${roleInfo.colorClasses.text} ${roleInfo.colorClasses.border}`}
                      >
                        <Shield className="h-2.5 w-2.5" />
                        {roleInfo.shortLabel}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-hairline flex items-center justify-between">
                    <span className="text-[10px] text-mist-gray">
                      {isActive ? 'Không gian đang mở' : 'Nhấp để chuyển đổi'}
                    </span>

                    {isActive ? (
                      <span className="text-xs font-semibold text-signal-blue flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Đơn vị hiện tại
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSwitch(organization.id)}
                        disabled={isSwitching}
                        className="text-xs h-7 px-2.5 text-signal-blue hover:text-[#005be0] hover:bg-[#e6f0ff]"
                      >
                        {isSwitching ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                        ) : (
                          <ArrowRight className="h-3.5 w-3.5 mr-1" />
                        )}
                        {isSwitching ? 'Đang chuyển...' : 'Chuyển sang Đơn vị này'}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
