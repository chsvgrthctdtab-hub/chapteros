import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  User as UserIcon, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Unlink, 
  RefreshCw, 
  Plus, 
  KeyRound, 
  Loader2,
  ShieldCheck,
  CalendarCheck
} from 'lucide-react';
import type { GoogleConnection, GoogleConnectionType } from '@/types';
import { formatDate } from '@/lib/date';
import { GOOGLE_SCOPES_CATALOGUE } from '../constants/scopes';

interface ConnectionStatusCardProps {
  type: GoogleConnectionType;
  connection: GoogleConnection | null;
  orgName?: string;
  userFullName?: string;
  canManage: boolean;
  onConnectClick: () => void;
  onDisconnectClick: () => void;
  onVerifyClick: () => Promise<void>;
  isVerifying: boolean;
}

export function ConnectionStatusCard({
  type,
  connection,
  orgName,
  userFullName,
  canManage,
  onConnectClick,
  onDisconnectClick,
  onVerifyClick,
  isVerifying,
}: ConnectionStatusCardProps) {
  const isOrg = type === 'organization';
  const isConnected = connection && connection.status === 'connected';
  const isExpired = connection && connection.status === 'expired';
  const [verificationFeedback, setVerificationFeedback] = useState<string | null>(null);

  const handleVerify = async () => {
    setVerificationFeedback(null);
    try {
      await onVerifyClick();
      setVerificationFeedback('Kết nối Google OAuth 2.0 hoạt động hoàn hảo!');
      setTimeout(() => setVerificationFeedback(null), 4000);
    } catch {
      setVerificationFeedback('Kiểm tra thất bại. Vui lòng thử lại.');
      setTimeout(() => setVerificationFeedback(null), 4000);
    }
  };

  return (
    <Card className="border-slate-200 shadow-2xs overflow-hidden flex flex-col justify-between">
      <div>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                  isOrg
                    ? 'bg-blue-50 text-blue-600 border-blue-100'
                    : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                }`}
              >
                {isOrg ? <Building2 className="h-5 w-5" /> : <UserIcon className="h-5 w-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-semibold text-slate-900">
                    {isOrg ? 'Tài khoản Chi hội (Workspace)' : 'Tài khoản Google Cá nhân'}
                  </CardTitle>
                </div>
                <CardDescription className="text-xs">
                  {isOrg
                    ? `Không gian lưu trữ chung của ${orgName || 'Chi hội'}`
                    : `Định danh cá nhân của ${userFullName || 'thành viên'}`}
                </CardDescription>
              </div>
            </div>

            {/* Status Badge */}
            {isConnected ? (
              <Badge variant="success" className="text-xs flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Đã kết nối
              </Badge>
            ) : isExpired ? (
              <Badge variant="warning" className="text-xs flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Hết hạn phiên
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs flex items-center gap-1 text-slate-500">
                <Clock className="h-3 w-3" />
                Chưa kết nối
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-1 text-xs">
          {verificationFeedback && (
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{verificationFeedback}</span>
            </div>
          )}

          {isConnected && connection ? (
            <div className="space-y-3">
              {/* Account details box */}
              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Email Google:</span>
                  <span className="font-semibold text-slate-800 font-mono text-xs">
                    {connection.googleEmail}
                  </span>
                </div>
                {connection.googleName && (
                  <div className="flex items-center justify-between border-t border-slate-200/60 pt-2">
                    <span className="text-slate-500 font-medium">Tên hiển thị:</span>
                    <span className="font-medium text-slate-700">{connection.googleName}</span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-slate-200/60 pt-2 text-[11px]">
                  <span className="text-slate-500">Xác thực gần nhất:</span>
                  <span className="text-slate-600 flex items-center gap-1">
                    <CalendarCheck className="h-3 w-3 text-slate-400" />
                    {formatDate(connection.lastVerifiedAt, 'dd/MM/yyyy HH:mm')}
                  </span>
                </div>
              </div>

              {/* Granted Scopes */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-700 flex items-center gap-1">
                    <KeyRound className="h-3 w-3 text-blue-600" />
                    Phạm vi quyền hạn đã cấp ({connection.grantedScopes.length}):
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {connection.grantedScopes.map((scope) => {
                    const def = GOOGLE_SCOPES_CATALOGUE.find((s) => s.scope === scope);
                    return (
                      <span
                        key={scope}
                        title={def?.description || scope}
                        className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200/60 transition-colors"
                      >
                        {def?.name || scope}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/40 p-4 text-center space-y-2">
              <p className="text-slate-600 text-xs">
                {isOrg
                  ? 'Chưa kết nối tài khoản Google chung của Chi hội. Kết nối để sẵn sàng đồng bộ Google Workspace (Drive, Sheets, Forms, Calendar).'
                  : 'Chưa liên kết tài khoản Google cá nhân. Liên kết để đăng nhập 1-chạm an toàn và đồng bộ dữ liệu tác vụ.'}
              </p>
              <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                Tuân thủ quy chuẩn bảo mật OAuth 2.0
              </div>
            </div>
          )}

          {!canManage && (
            <div className="p-2 rounded bg-amber-50/60 border border-amber-200/60 text-amber-800 text-[11px]">
              Yêu cầu quyền <strong>Ban Chấp Hành (BCH)</strong> để quản trị kết nối cấp Chi hội.
            </div>
          )}
        </CardContent>
      </div>

      <CardFooter className="bg-slate-50/50 border-t border-slate-100 flex items-center justify-between py-3">
        {isConnected ? (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleVerify}
              disabled={isVerifying}
              className="text-xs"
            >
              {isVerifying ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              )}
              Kiểm tra kết nối
            </Button>

            {canManage && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onDisconnectClick}
                className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              >
                <Unlink className="h-3.5 w-3.5 mr-1.5" />
                Ngắt kết nối
              </Button>
            )}
          </>
        ) : (
          <div className="w-full flex justify-end">
            <Button
              type="button"
              size="sm"
              onClick={onConnectClick}
              disabled={!canManage}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              {isOrg ? 'Kết nối tài khoản Chi hội' : 'Liên kết tài khoản Google'}
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
