import { useState, useEffect, type FormEvent } from 'react';
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
  Building2, 
  ShieldCheck, 
  Loader2, 
  Check, 
  Lock,
  ExternalLink
} from 'lucide-react';
import { GOOGLE_SCOPES_CATALOGUE, DEFAULT_IDENTITY_SCOPES, WORKSPACE_INTEGRATION_SCOPES } from '../constants/scopes';
import type { ConnectGooglePayload } from '../types/google.types';

interface ConnectGoogleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId?: string;
  defaultEmail?: string;
  defaultName?: string;
  onConnect: (payload: ConnectGooglePayload) => Promise<void>;
  isLoading: boolean;
}

export function ConnectGoogleDialog({
  isOpen,
  onClose,
  organizationId,
  defaultEmail = '',
  defaultName = '',
  onConnect,
  isLoading,
}: ConnectGoogleDialogProps) {
  const [googleEmail, setGoogleEmail] = useState(defaultEmail);
  const [googleName, setGoogleName] = useState(defaultName);
  const [selectedScopes, setSelectedScopes] = useState<string[]>(() => [
    ...DEFAULT_IDENTITY_SCOPES,
    ...WORKSPACE_INTEGRATION_SCOPES,
  ]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (defaultEmail && !googleEmail) setGoogleEmail(defaultEmail);
      if (defaultName && !googleName) setGoogleName(defaultName);
    }
  }, [isOpen, defaultEmail, defaultName]);

  const toggleScope = (scope: string) => {
    const scopeDef = GOOGLE_SCOPES_CATALOGUE.find((s) => s.scope === scope);
    if (scopeDef?.isRequired) return;

    if (selectedScopes.includes(scope)) {
      setSelectedScopes(selectedScopes.filter((s) => s !== scope));
    } else {
      setSelectedScopes([...selectedScopes, scope]);
    }
  };

  const handleSelectAllScopes = () => {
    setSelectedScopes(GOOGLE_SCOPES_CATALOGUE.map((s) => s.scope));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const emailToUse = googleEmail.trim() || defaultEmail.trim();
    if (!emailToUse) {
      setFormError('Vui lòng nhập địa chỉ Google Email của Đơn vị.');
      return;
    }

    if (!emailToUse.includes('@')) {
      setFormError('Địa chỉ email không đúng định dạng.');
      return;
    }

    const clientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '523699618144-66v42mjkjammd6rtlsne4h01epar55rc.apps.googleusercontent.com';

    // 1. If Google Identity Services (GIS) is available, request OAuth access token directly
    if (typeof window !== 'undefined' && (window as any).google?.accounts?.oauth2) {
      try {
        setIsAuthenticating(true);
        const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: selectedScopes.join(' '),
          hint: emailToUse,
          callback: async (tokenResponse: any) => {
            if (tokenResponse.error) {
              setIsAuthenticating(false);
              setFormError(tokenResponse.error_description || tokenResponse.error || 'Ủy quyền Google thất bại.');
              return;
            }

            try {
              if (tokenResponse.access_token) {
                localStorage.setItem('chapteros_google_access_token', tokenResponse.access_token);
              }
              // Save token to google_connections table via onConnect
              await onConnect({
                organizationId,
                connectionType: 'organization',
                googleEmail: emailToUse.toLowerCase(),
                googleName: (googleName.trim() || defaultName.trim()) || 'Ban Chấp Hành Đơn vị',
                grantedScopes: selectedScopes,
                metadata: {
                  access_token: tokenResponse.access_token,
                  token_type: tokenResponse.token_type || 'Bearer',
                  expires_in: tokenResponse.expires_in || 3599,
                  acquired_at: new Date().toISOString(),
                },
              });
              setIsAuthenticating(false);
              onClose();
            } catch (saveErr) {
              setIsAuthenticating(false);
              setFormError((saveErr as Error).message || 'Lỗi khi lưu thông tin kết nối.');
            }
          },
        });

        tokenClient.requestAccessToken({ prompt: 'consent' });
        return;
      } catch (gisErr) {
        console.warn('GIS Token Client Error, falling back to direct save:', gisErr);
        setIsAuthenticating(false);
      }
    }

    // 2. Fallback: Save connection directly
    try {
      await onConnect({
        organizationId,
        connectionType: 'organization',
        googleEmail: emailToUse.toLowerCase(),
        googleName: (googleName.trim() || defaultName.trim()) || 'Ban Chấp Hành Đơn vị',
        grantedScopes: selectedScopes,
      });
      onClose();
    } catch (err) {
      setFormError((err as Error).message || 'Không thể kết nối tài khoản Google.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isLoading && !isAuthenticating && !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-2xl [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <DialogHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
              <svg className="h-6 w-6" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900 tracking-tight">
                Ủy quyền Google Workspace Đơn vị
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Xác thực OAuth 2.0 cấp quyền đồng bộ Drive, Sheets, Forms và Calendar vào tài khoản Gmail của bạn
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-1 text-xs">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {formError}
            </div>
          )}

          {/* Google Account Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Email Google của bạn <span className="text-rose-500">*</span></label>
              <Input
                type="email"
                value={googleEmail}
                onChange={(e) => setGoogleEmail(e.target.value)}
                placeholder="ví dụ: donvi.bch@gmail.com"
                required
                className="text-xs h-10 rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Tên hiển thị Đơn vị</label>
              <Input
                type="text"
                value={googleName}
                onChange={(e) => setGoogleName(e.target.value)}
                placeholder="ví dụ: Ban Chấp Hành Đơn vị"
                className="text-xs h-10 rounded-xl"
              />
            </div>
          </div>

          {/* Scopes Selection Matrix */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-blue-600" />
                Phạm vi quyền hạn Google OAuth 2.0
              </label>
              <button
                type="button"
                onClick={handleSelectAllScopes}
                className="text-[11px] text-blue-600 hover:underline font-medium cursor-pointer"
              >
                Cấp toàn quyền ({selectedScopes.length}/{GOOGLE_SCOPES_CATALOGUE.length})
              </button>
            </div>

            <div className="border border-slate-200 rounded-2xl divide-y divide-slate-100 bg-slate-50/50 max-h-48 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {GOOGLE_SCOPES_CATALOGUE.map((scopeItem) => {
                const isSelected = selectedScopes.includes(scopeItem.scope);
                return (
                  <div
                    key={scopeItem.scope}
                    onClick={() => toggleScope(scopeItem.scope)}
                    className={`p-2.5 flex items-start gap-2.5 cursor-pointer transition-colors ${
                      isSelected ? 'bg-white' : 'opacity-70 hover:opacity-100 hover:bg-slate-100/50'
                    }`}
                  >
                    <div
                      className={`h-4 w-4 rounded mt-0.5 shrink-0 flex items-center justify-center border ${
                        isSelected
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-xs text-slate-800">
                          {scopeItem.name}
                        </span>
                        {scopeItem.isRequired && (
                          <Badge variant="secondary" className="text-[10px] py-0 px-1 font-normal">
                            Bắt buộc
                          </Badge>
                        )}
                        <span className="font-mono text-[10px] text-slate-400 truncate">
                          {scopeItem.scope.replace('https://www.googleapis.com/auth/', '')}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                        {scopeItem.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Security Notice */}
          <div className="rounded-2xl bg-blue-50/60 border border-blue-100 p-3.5 text-blue-900 flex items-start gap-2.5 text-[11px] leading-relaxed">
            <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong>Xác thực trực tiếp với Google:</strong> Khi nhấn nút bên dưới, Google sẽ mở cửa sổ popup chính thức để bạn chọn tài khoản Gmail và cấp quyền. Mã truy cập được bảo mật và tự động đồng bộ tài liệu vào đúng Drive của bạn.
            </div>
          </div>

          <DialogFooter className="pt-2 flex gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isLoading || isAuthenticating}
              className="text-xs rounded-xl"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isLoading || isAuthenticating}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs cursor-pointer rounded-xl"
            >
              {isLoading || isAuthenticating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              ) : (
                <Check className="h-3.5 w-3.5 mr-1.5" />
              )}
              {isLoading || isAuthenticating ? 'Đang xác thực Google...' : 'Đăng nhập & Cấp quyền Google'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
