import { useState } from 'react';
import { 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  RefreshCw, 
  Plus, 
  Unlink, 
  ShieldCheck, 
  CalendarCheck, 
  Loader2,
  Lock,
  Layers
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { GoogleConnection } from '@/types';
import { formatDate } from '@/lib/date';

interface GlobalConnectionHeroProps {
  orgConnection: GoogleConnection | null;
  orgName?: string;
  canManageOrg: boolean;
  onConnectOrg: () => void;
  onDisconnect: (conn: GoogleConnection) => void;
  onVerify: (connId: string) => Promise<void>;
  isVerifying: boolean;
}

export function GlobalConnectionHero({
  orgConnection,
  orgName,
  canManageOrg,
  onConnectOrg,
  onDisconnect,
  onVerify,
  isVerifying,
}: GlobalConnectionHeroProps) {
  const [verificationFeedback, setVerificationFeedback] = useState<string | null>(null);

  const activeConnection = orgConnection;
  const isConnected = Boolean(activeConnection && activeConnection.status === 'connected');
  const isExpired = Boolean(activeConnection && activeConnection.status === 'expired');

  const handleRunVerify = async () => {
    if (!activeConnection) return;
    setVerificationFeedback(null);
    try {
      await onVerify(activeConnection.id);
      setVerificationFeedback('Chứng chỉ Google OAuth 2.0 hợp lệ. Hệ thống sẵn sàng đồng bộ.');
      setTimeout(() => setVerificationFeedback(null), 4000);
    } catch {
      setVerificationFeedback('Kiểm tra xác thực thất bại. Vui lòng kết nối lại.');
      setTimeout(() => setVerificationFeedback(null), 4000);
    }
  };

  return (
    <Card id="google-global-connection-hero" className="border-hairline shadow-xs overflow-hidden bg-white">
      {/* Top Identity & Scope Pill Header */}
      <div className="bg-ink-navy text-pebble px-5 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-hairline">
        <div className="flex items-center gap-2.5">
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-pebble">
            Trung tâm Quản trị Google Workspace
          </span>
          <span className="text-mist-gray">•</span>
          <span className="text-xs text-pebble">
            Tài khoản Google chính thức của Đơn vị
          </span>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cloud text-[11px] font-medium text-ink-navy border border-hairline">
          <Building2 className="h-3.5 w-3.5 text-signal-blue" />
          <span>Tài khoản Đơn vị</span>
        </div>
      </div>

      <CardContent className="p-5 sm:p-6 space-y-5">
        {/* Main Status & Action Hub */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Left: Connection Status details */}
          <div className="flex items-start gap-4">
            <div
              className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 border ${
                isConnected
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200/80'
                  : isExpired
                  ? 'bg-amber-50 text-amber-600 border-amber-200/80'
                  : 'bg-cloud text-mist-gray border-hairline'
              }`}
            >
              <Building2 strokeWidth={1.5} className="h-6 w-6" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg font-bold text-ink-navy tracking-tight">
                  Google Workspace Đơn vị — {orgName || 'Ban Chấp Hành'}
                </h2>

                {isConnected ? (
                  <Badge variant="success" className="text-xs px-2.5 py-0.5 flex items-center gap-1 bg-emerald-50 text-emerald-700 border-emerald-200">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    Đang hoạt động
                  </Badge>
                ) : isExpired ? (
                  <Badge variant="warning" className="text-xs px-2.5 py-0.5 flex items-center gap-1 bg-amber-50 text-amber-700 border-amber-200">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                    Hết hạn phiên xác thực
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs px-2.5 py-0.5 flex items-center gap-1 text-mist-gray bg-cloud border-hairline">
                    <Clock className="h-3.5 w-3.5 text-mist-gray" />
                    Chưa kết nối Google
                  </Badge>
                )}
              </div>

              {isConnected && activeConnection ? (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-gray">
                  <span className="font-mono font-medium text-ink-navy bg-pebble px-2 py-0.5 rounded border border-hairline">
                    {activeConnection.googleEmail}
                  </span>
                  {activeConnection.googleName && (
                    <span className="text-mist-gray">
                      Tên: <strong className="text-slate-gray font-medium">{activeConnection.googleName}</strong>
                    </span>
                  )}
                  <span className="text-mist-gray flex items-center gap-1">
                    <CalendarCheck className="h-3.5 w-3.5 text-mist-gray" />
                    Xác thực gần nhất: {formatDate(activeConnection.lastVerifiedAt, 'dd/MM/yyyy HH:mm')}
                  </span>
                </div>
              ) : (
                <p className="text-xs text-mist-gray max-w-2xl leading-relaxed">
                  Kết nối tài khoản Google Workspace chính thức của Đơn vị để mở khóa toàn bộ hệ sinh thái: Biểu mẫu (Forms), Bảng tính (Sheets), Lịch (Calendar) và Lưu trữ (Drive).
                </p>
              )}
            </div>
          </div>

          {/* Right: Operational Actions */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap lg:justify-end">
            {isConnected && activeConnection ? (
              <>
                <Button
                  id="hero-verify-btn"
                  variant="outline"
                  size="sm"
                  onClick={handleRunVerify}
                  disabled={isVerifying}
                  className="text-xs border-hairline text-slate-gray hover:bg-cloud cursor-pointer"
                >
                  {isVerifying ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5 text-signal-blue" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5 text-mist-gray" />
                  )}
                  Kiểm tra kết nối
                </Button>

                {canManageOrg && (
                  <Button
                    id="hero-disconnect-btn"
                    variant="outline"
                    size="sm"
                    onClick={() => onDisconnect(activeConnection)}
                    className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300 cursor-pointer"
                  >
                    <Unlink className="h-3.5 w-3.5 mr-1.5" />
                    Ngắt kết nối
                  </Button>
                )}
              </>
            ) : (
              <Button
                id="hero-connect-btn"
                size="sm"
                onClick={onConnectOrg}
                disabled={!canManageOrg}
                className="text-xs bg-signal-blue hover:bg-[#005be0] text-white font-medium shadow-xs cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Ủy quyền Google Đơn vị
              </Button>
            )}
          </div>
        </div>

        {/* Verification feedback toast banner */}
        {verificationFeedback && (
          <div className="p-3 rounded-lg bg-emerald-50/90 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{verificationFeedback}</span>
            </div>
            <span className="font-mono text-[11px] text-emerald-600">Mã 200 OK</span>
          </div>
        )}

        {/* Active Connection Sub-metadata Bar */}
        {isConnected && activeConnection && (
          <div className="pt-3 border-t border-hairline grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-gray">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>
                Phân quyền Scopes: <strong className="text-ink-navy font-semibold">{activeConnection.grantedScopes.length} scopes</strong> đã cấp
              </span>
            </div>

            <div className="flex items-center gap-2 text-slate-gray">
              <Lock className="h-4 w-4 text-signal-blue shrink-0" />
              <span>
                Lưu trữ Token: <strong className="text-ink-navy font-semibold">Bảo mật Máy chủ Cách ly RLS</strong>
              </span>
            </div>

            <div className="flex items-center gap-2 text-slate-gray">
              <Layers className="h-4 w-4 text-signal-blue shrink-0" />
              <span>
                Cơ chế dữ liệu: <strong className="text-ink-navy font-semibold">Đồng bộ Cơ sở dữ liệu Trực tiếp</strong>
              </span>
            </div>
          </div>
        )}

        {/* Guard Notice if cannot manage org */}
        {!canManageOrg && !orgConnection && (
          <div className="p-3 rounded-lg bg-cloud border border-hairline text-slate-gray text-xs flex items-center gap-2">
            <Lock className="h-4 w-4 text-mist-gray shrink-0" />
            <span>Chỉ thành viên <strong>Ban Chấp Hành (BCH)</strong> mới có thẩm quyền ủy quyền tài khoản Google Workspace cho Đơn vị.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
