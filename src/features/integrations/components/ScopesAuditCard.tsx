import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { GOOGLE_SCOPES_CATALOGUE } from '../constants/scopes';

interface ScopesAuditCardProps {
  grantedScopes: string[];
}

export function ScopesAuditCard({ grantedScopes }: ScopesAuditCardProps) {
  return (
    <Card className="border-hairline bg-white shadow-xs">
      <CardHeader>
        <div className="flex items-center gap-2">
          <ShieldCheck strokeWidth={1.5} className="h-5 w-5 text-signal-blue" />
          <CardTitle className="text-base font-semibold text-ink-navy">
            Kiểm toán Quyền hạn & Bảo mật (Least Privilege Principle)
          </CardTitle>
        </div>
        <CardDescription className="text-xs text-mist-gray">
          Chi tiết các phạm vi OAuth 2.0 được yêu cầu và tác động bảo mật tương ứng
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 text-xs">
        {/* Security Principles Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/50 space-y-1">
            <div className="font-semibold text-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Quyền hạn tối thiểu</span>
            </div>
            <p className="text-[11px] text-emerald-700 leading-relaxed">
              Chỉ xin cấp quyền truy cập vào các tệp tin/dữ liệu do ứng dụng tạo ra, không đọc dữ liệu cá nhân ngoài phạm vi.
            </p>
          </div>

          <div className="p-3 rounded-lg border border-[#d4e4fa] bg-[#e6f0ff]/50 space-y-1">
            <div className="font-semibold text-ink-navy flex items-center gap-1.5">
              <Lock className="h-4 w-4 text-signal-blue shrink-0" />
              <span>Không lộ Client Secret</span>
            </div>
            <p className="text-[11px] text-slate-gray leading-relaxed">
              Không lưu trữ Access Token hoặc API Secret Key dưới dạng <code>VITE_*</code> trong mã nguồn frontend.
            </p>
          </div>

          <div className="p-3 rounded-lg border border-hairline bg-cloud space-y-1">
            <div className="font-semibold text-ink-navy flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-slate-gray shrink-0" />
              <span>Cách ly đa Đơn vị</span>
            </div>
            <p className="text-[11px] text-slate-gray leading-relaxed">
              Row Level Security (RLS) bảo vệ phân quyền, mỗi Đơn vị chỉ quản lý và truy cập tài nguyên Google của riêng mình.
            </p>
          </div>
        </div>

        {/* Scopes Table */}
        <div className="rounded-lg border border-hairline overflow-hidden">
          <div className="bg-cloud px-4 py-2.5 border-b border-hairline grid grid-cols-12 text-[11px] font-semibold text-slate-gray">
            <div className="col-span-4 sm:col-span-3">Phạm vi quyền (Scope)</div>
            <div className="col-span-5 sm:col-span-6">Mục đích sử dụng cụ thể</div>
            <div className="col-span-3 sm:col-span-3 text-right">Trạng thái cấp quyền</div>
          </div>

          <div className="divide-y divide-hairline">
            {GOOGLE_SCOPES_CATALOGUE.map((scopeItem) => {
              const isGranted = grantedScopes.includes(scopeItem.scope);
              return (
                <div key={scopeItem.scope} className="px-4 py-3 grid grid-cols-12 items-center gap-2 text-xs hover:bg-cloud/50 transition-colors">
                  <div className="col-span-4 sm:col-span-3">
                    <div className="font-semibold text-ink-navy">{scopeItem.name}</div>
                    <div className="font-mono text-[10px] text-mist-gray truncate" title={scopeItem.scope}>
                      {scopeItem.scope.replace('https://www.googleapis.com/auth/', '')}
                    </div>
                  </div>

                  <div className="col-span-5 sm:col-span-6 text-[11px] text-slate-gray leading-relaxed">
                    {scopeItem.purpose}
                  </div>

                  <div className="col-span-3 sm:col-span-3 flex justify-end">
                    {isGranted ? (
                      <Badge variant="success" className="text-[10px] py-0 px-2 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Đã cấp
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] py-0 px-2 text-mist-gray border-hairline">
                        Chưa cấp
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
