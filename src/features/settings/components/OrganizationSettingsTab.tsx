import React, { useState, useEffect, useRef, type FormEvent, type ChangeEvent } from 'react';
import {
  Building2,
  Edit2,
  Save,
  X,
  Loader2,
  Image as ImageIcon,
  Upload,
  RefreshCw,
  Trash2,
  AlertCircle,
  Shield,
  Calendar,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
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
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  useUpdateOrganizationMutation,
  useUploadOrganizationLogoMutation,
  useDeleteOrganizationLogoMutation,
} from '@/features/chapters/queries/organization.queries';
import { getOrgTypeShort, getOrgTypeFullName, ORGANIZATION_TYPE_OPTIONS } from '@/lib/organization.utils';
import dayjs from 'dayjs';
import type { Organization, OrganizationType } from '@/types';

interface OrganizationSettingsTabProps {
  organization: Organization | null;
  canManage: boolean;
}

export function OrganizationSettingsTab({
  organization,
  canManage,
}: OrganizationSettingsTabProps) {
  const toast = useToast();
  const { user, refreshAuth } = useAuth();
  const updateOrgMutation = useUpdateOrganizationMutation();
  const uploadLogoMutation = useUploadOrganizationLogoMutation();
  const deleteLogoMutation = useDeleteOrganizationLogoMutation();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(organization?.name || '');
  const [code, setCode] = useState(organization?.code || '');
  const [type, setType] = useState<string>(organization?.type || 'chi_hoi');
  const [description, setDescription] = useState(organization?.description || '');
  const [imgError, setImgError] = useState(false);
  const [logoValidationError, setLogoValidationError] = useState<string | null>(null);

  // Sync state when organization updates
  useEffect(() => {
    if (organization) {
      setName(organization.name || '');
      setCode(organization.code || '');
      setType(organization.type || 'chi_hoi');
      setDescription(organization.description || '');
      setImgError(false);
      setLogoValidationError(null);
    }
  }, [organization]);

  const handleCancel = () => {
    if (organization) {
      setName(organization.name || '');
      setCode(organization.code || '');
      setType(organization.type || 'chi_hoi');
      setDescription(organization.description || '');
    }
    setIsEditing(false);
  };

  const handleTriggerUpload = () => {
    if (uploadLogoMutation.isPending || deleteLogoMutation.isPending) return;
    setLogoValidationError(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !organization) return;

    // Reset input value so same file can be re-selected if needed
    e.target.value = '';

    setLogoValidationError(null);

    // Validation
    const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
    const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

    if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      const msg = 'Định dạng logo không được hỗ trợ. Vui lòng chọn PNG, JPG hoặc WebP.';
      setLogoValidationError(msg);
      toast.error(msg);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      const msg = 'Kích thước logo vượt quá giới hạn 2 MB.';
      setLogoValidationError(msg);
      toast.error(msg);
      return;
    }

    try {
      await uploadLogoMutation.mutateAsync({
        organizationId: organization.id,
        file,
        uploaderUserId: user?.id,
        currentLogoUrl: organization.logoUrl,
      });
      await refreshAuth();
      setImgError(false);
      toast.success('Cập nhật biểu trưng thành công.');
    } catch (err: unknown) {
      const errorMsg = (err as Error).message || 'Không thể tải lên biểu trưng.';
      setLogoValidationError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleDeleteLogo = async () => {
    if (!organization || uploadLogoMutation.isPending || deleteLogoMutation.isPending) return;

    if (!window.confirm('Bạn có chắc chắn muốn xóa biểu trưng hiện tại?')) {
      return;
    }

    setLogoValidationError(null);

    try {
      await deleteLogoMutation.mutateAsync({
        organizationId: organization.id,
        currentLogoUrl: organization.logoUrl,
        removerUserId: user?.id,
      });
      await refreshAuth();
      setImgError(false);
      toast.success('Đã xóa biểu trưng thành công.');
    } catch (err: unknown) {
      const errorMsg = (err as Error).message || 'Không thể xóa biểu trưng.';
      setLogoValidationError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!organization) return;

    if (!name.trim()) {
      toast.error('Tên đơn vị không được để trống.');
      return;
    }
    if (!code.trim()) {
      toast.error('Mã đơn vị không được để trống.');
      return;
    }

    try {
      await updateOrgMutation.mutateAsync({
        id: organization.id,
        payload: {
          name: name.trim(),
          code: code.trim().toUpperCase(),
          type: type as OrganizationType,
          description: description.trim() || null,
        },
        updaterUserId: user?.id,
      });

      await refreshAuth();
      toast.success('Thông tin đơn vị đã được cập nhật thành công.');
      setIsEditing(false);
    } catch (err: unknown) {
      toast.error(err);
    }
  };

  const currentTypeShort = getOrgTypeShort(type);
  const currentTypeFullName = getOrgTypeFullName(type);

  if (!organization) {
    return (
      <Card className="border-slate-200 shadow-2xs">
        <CardContent className="py-12 text-center text-slate-500 text-xs">
          <Building2 className="h-8 w-8 text-slate-300 mx-auto mb-2" />
          <p className="font-medium text-slate-700">Chưa chọn Chi hội hoạt động</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Vui lòng chọn một Chi hội trong thanh điều hướng để cấu hình thông tin.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div id="settings-organization-tab" className="space-y-6">
      {/* Chapter Identity Preview Banner */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl border border-slate-200/80 bg-slate-50 overflow-hidden flex items-center justify-center shrink-0 shadow-2xs">
              {organization.logoUrl && !imgError ? (
                <img
                  src={organization.logoUrl}
                  alt={organization.name}
                  onError={() => setImgError(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Building2 className="h-8 w-8 text-slate-400" />
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                {currentTypeShort && (
                  <Badge variant="outline" className="font-mono text-[10px] bg-blue-50 border-blue-200 text-blue-700 font-bold px-2 py-0.5">
                    {currentTypeShort}
                  </Badge>
                )}
                <Badge variant="outline" className="font-mono text-[10px] bg-slate-100/80 border-slate-300 text-slate-700 font-semibold px-2 py-0.5">
                  {organization.code}
                </Badge>
                <Badge variant="success" className="text-[10px] px-2 py-0.5">
                  Đang hoạt động
                </Badge>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight break-words whitespace-normal">
                {organization.name}
              </h3>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>Khởi tạo: {dayjs(organization.createdAt).format('DD/MM/YYYY')}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            {canManage && !isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="text-xs h-8 text-slate-700 border-slate-200 hover:bg-slate-50 cursor-pointer shadow-2xs font-medium"
              >
                <Edit2 className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                Chỉnh sửa thông tin
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Organization Details Form / View */}
      <Card className="border-slate-200 shadow-2xs">
        <CardHeader className="pb-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-emerald-600" />
                Hồ sơ & Danh tính Chi hội
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                Cấu hình tên gọi, mã định danh, mô tả hoạt động và biểu trưng chính thức.
              </CardDescription>
            </div>
            {!canManage && (
              <Badge variant="outline" className="text-[11px] bg-slate-50 text-slate-500 border-slate-200">
                Chế độ chỉ đọc
              </Badge>
            )}
          </div>
        </CardHeader>

        <form onSubmit={handleSave}>
          <CardContent className="pt-5 space-y-4">
            {!canManage && (
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2.5">
                <Shield className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Bạn đang xem cài đặt với quyền thành viên. Chỉ <strong>Quản trị viên (Admin)</strong> hoặc <strong>Chi hội trưởng (Leader)</strong> mới có quyền sửa đổi thông tin định danh Chi hội.
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Tên đơn vị <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!isEditing || !canManage}
                  placeholder={`Ví dụ: ${currentTypeFullName} Sinh viên Cần Thơ`}
                  className={`text-xs ${
                    !isEditing ? 'bg-slate-50 text-slate-800 font-medium' : 'bg-white'
                  }`}
                  required
                />
                <span className="text-[10px] text-slate-400">
                  Tên chính thức hiển thị trên toàn bộ văn bản và giao diện hệ thống.
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Mã đơn vị (Code) <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  disabled={!isEditing || !canManage}
                  placeholder="CH-CT"
                  className={`text-xs font-mono uppercase ${
                    !isEditing ? 'bg-slate-50 text-slate-800 font-bold' : 'bg-white'
                  }`}
                  required
                />
                <span className="text-[10px] text-slate-400">Mã viết tắt duy nhất trên hệ thống.</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>Loại hình đơn vị <span className="text-rose-500">*</span></span>
                <span className="text-[11px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                  {currentTypeShort}
                </span>
              </label>
              <Select
                value={type}
                onValueChange={setType}
                disabled={!isEditing || !canManage}
              >
                <SelectTrigger className="w-full rounded-md border-slate-200 text-xs text-slate-800 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORGANIZATION_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label} — {opt.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Mô tả Chi hội</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={!isEditing || !canManage}
                rows={3}
                placeholder="Giới thiệu về phạm vi tổ chức, tôn chỉ hoạt động và liên hiệp trực thuộc..."
                className={`w-full rounded-md border border-slate-200 p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all ${
                  !isEditing ? 'bg-slate-50' : 'bg-white'
                }`}
              />
            </div>

            {/* Logo Storage Upload Section */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-slate-500" />
                  Biểu trưng Chi hội (Logo)
                </span>
                {organization.logoUrl && !imgError && (
                  <span className="text-[11px] font-medium text-emerald-600">Đang sử dụng</span>
                )}
              </label>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp"
                onChange={handleFileChange}
                disabled={!canManage || uploadLogoMutation.isPending || deleteLogoMutation.isPending}
                className="hidden"
              />

              <div className="rounded-xl border border-slate-200/90 bg-slate-50/70 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-12 w-12 rounded-lg border border-slate-200 bg-white overflow-hidden flex items-center justify-center shrink-0 shadow-2xs">
                    {uploadLogoMutation.isPending || deleteLogoMutation.isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                    ) : organization.logoUrl && !imgError ? (
                      <img
                        src={organization.logoUrl}
                        alt={organization.name}
                        onError={() => setImgError(true)}
                        className="h-full w-full object-contain p-1"
                      />
                    ) : (
                      <Building2 className="h-6 w-6 text-slate-300" />
                    )}
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    {organization.logoUrl && !imgError ? (
                      <>
                        <p className="text-xs font-semibold text-slate-800 truncate">
                          Logo chính thức của Chi hội
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Định dạng PNG, JPG, WebP — tối đa 2 MB
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-xs font-medium text-slate-700">
                          Chưa có logo
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Tải lên PNG, JPG hoặc WebP — tối đa 2 MB.
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {canManage && (
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {organization.logoUrl && !imgError ? (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleTriggerUpload}
                          disabled={uploadLogoMutation.isPending || deleteLogoMutation.isPending}
                          className="h-8 text-xs text-slate-700 hover:bg-slate-100 cursor-pointer shadow-2xs"
                        >
                          {uploadLogoMutation.isPending ? (
                            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin text-emerald-600" />
                          ) : (
                            <RefreshCw className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
                          )}
                          Thay logo
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleDeleteLogo}
                          disabled={uploadLogoMutation.isPending || deleteLogoMutation.isPending}
                          className="h-8 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 cursor-pointer shadow-2xs"
                        >
                          {deleteLogoMutation.isPending ? (
                            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin text-rose-600" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5 mr-1.5 text-rose-500" />
                          )}
                          Xóa logo
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleTriggerUpload}
                        disabled={uploadLogoMutation.isPending || deleteLogoMutation.isPending}
                        className="h-8 text-xs text-emerald-700 bg-white hover:bg-emerald-50 border-emerald-300 font-medium cursor-pointer shadow-2xs"
                      >
                        {uploadLogoMutation.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin text-emerald-600" />
                        ) : (
                          <Upload className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
                        )}
                        Tải logo lên
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {logoValidationError && (
                <div className="flex items-center gap-1.5 text-[11px] text-rose-600 pt-0.5">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>{logoValidationError}</span>
                </div>
              )}
            </div>

            {/* Metadata Footer */}
            <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-slate-500 font-mono">
              <div>
                <span>Mã định danh ID: </span>
                <code className="text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">{organization.id}</code>
              </div>
              <div className="sm:text-right">
                <span>Cập nhật gần nhất: </span>
                <span className="text-slate-700">
                  {dayjs(organization.updatedAt).format('DD/MM/YYYY HH:mm')}
                </span>
              </div>
            </div>
          </CardContent>

          {isEditing && canManage && (
            <CardFooter className="bg-slate-50/70 border-t border-slate-100 flex items-center justify-end gap-2 py-3 px-5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={updateOrgMutation.isPending}
                className="text-xs h-8 cursor-pointer"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={updateOrgMutation.isPending}
                className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-2xs font-medium"
              >
                {updateOrgMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5 mr-1.5" />
                )}
                {updateOrgMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </CardFooter>
          )}
        </form>
      </Card>
    </div>
  );
}
