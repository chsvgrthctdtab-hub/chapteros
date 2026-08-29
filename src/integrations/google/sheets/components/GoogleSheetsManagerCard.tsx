import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Plus,
  ExternalLink,
  Download,
  Upload,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Layers,
  ArrowUpDown,
  FileText,
  Users,
  Calendar,
  CheckSquare,
  DollarSign,
  UserCheck,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useConnectedSpreadsheets } from '../google-sheets.queries';
import {
  useLinkSpreadsheetMutation,
  useUnlinkSpreadsheetMutation,
} from '../google-sheets.mutations';
import type { GoogleSheetModule, GoogleSheetConnection } from '../google-sheets.types';
import { GOOGLE_SHEETS_MODULE_TABS } from '../google-sheets.constants';
import { GoogleSheetsExportModal } from './GoogleSheetsExportModal';
import { GoogleSheetsImportWizardModal } from './GoogleSheetsImportWizardModal';

export function GoogleSheetsManagerCard() {
  const { activeOrganization, activeRole } = useAuth();
  const orgId = activeOrganization?.id;

  const { data: spreadsheets = [], isLoading } = useConnectedSpreadsheets(orgId);
  const linkMutation = useLinkSpreadsheetMutation();
  const unlinkMutation = useUnlinkSpreadsheetMutation(orgId);

  // Link Dialog State
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [newSheetUrl, setNewSheetUrl] = useState('');
  const [newSheetName, setNewSheetName] = useState('');
  const [linkError, setLinkError] = useState<string | null>(null);

  // Unlink Confirmation Dialog State
  const [sheetToUnlink, setSheetToUnlink] = useState<GoogleSheetConnection | null>(null);

  // Active Export & Import Modals
  const [activeExportModule, setActiveExportModule] = useState<GoogleSheetModule | null>(null);
  const [activeImportModule, setActiveImportModule] = useState<GoogleSheetModule | null>(null);

  const canManage = Boolean(
    activeRole && ['admin', 'leader', 'deputy', 'treasurer', 'secretary'].includes(activeRole)
  );

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId || !newSheetUrl.trim()) return;
    setLinkError(null);

    try {
      await linkMutation.mutateAsync({
        organizationId: orgId,
        spreadsheetId: newSheetUrl.trim(),
        spreadsheetName: newSheetName.trim() || 'Bảng tính Chi hội',
        spreadsheetUrl: newSheetUrl.trim(),
      });
      setLinkDialogOpen(false);
      setNewSheetUrl('');
      setNewSheetName('');
    } catch (err: unknown) {
      const error = err as Error;
      setLinkError(error.message);
    }
  };

  const handleConfirmUnlink = async () => {
    if (!sheetToUnlink) return;

    try {
      await unlinkMutation.mutateAsync({ connectionId: sheetToUnlink.id });
      setSheetToUnlink(null);
    } catch (err: unknown) {
      const error = err as Error;
      setLinkError(error.message);
      setSheetToUnlink(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Connection Info */}
      <Card className="border-slate-200">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2.5 flex-wrap">
                  <span>Tích hợp Google Sheets (Bảng tính Đơn vị)</span>
                  <span className="whitespace-nowrap inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                    Sẵn sàng hoạt động
                  </span>
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Lớp trao đổi dữ liệu, nhập/xuất báo cáo và đối soát có kiểm soát (Source of Truth: Supabase PostgreSQL)
                </CardDescription>
              </div>
            </div>

            {canManage && (
              <Button
                onClick={() => setLinkDialogOpen(true)}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                Liên kết Bảng tính mới
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Architecture Reminder Banner */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 space-y-1.5">
            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Nguyên tắc vận hành dữ liệu:
            </div>
            <div className="text-slate-600 leading-relaxed">
              Mọi dữ liệu nghiệp vụ (Hội viên, Hoạt động, Nhiệm vụ, Sổ quỹ, Người tham gia) đều lưu trữ tập trung tại <strong>Supabase</strong>. Khi xuất ra Google Sheets, hệ thống sẽ snapshot dữ liệu mới nhất. Khi nhập từ Sheets, quy trình <strong>Đối soát & Xem trước</strong> sẽ phát hiện các xung đột hoặc dữ liệu trùng lặp trước khi bạn xác nhận lưu vào hệ thống.
            </div>
          </div>

          {/* Quick Module Operations Grid */}
          <div>
            <div className="text-xs font-semibold text-slate-800 mb-2 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              Thao tác nhanh theo từng Mô-đun:
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { module: 'members' as GoogleSheetModule, title: 'Hội viên', icon: Users, desc: 'Xuất/nhập danh sách hồ sơ, MSSV, chức vụ' },
                { module: 'activities' as GoogleSheetModule, title: 'Hoạt động', icon: Calendar, desc: 'Kế hoạch sự kiện, thời gian, địa điểm' },
                { module: 'tasks' as GoogleSheetModule, title: 'Nhiệm vụ', icon: CheckSquare, desc: 'Phân công công việc, tiến độ hoàn thành' },
                { module: 'participants' as GoogleSheetModule, title: 'Người tham gia', icon: UserCheck, desc: 'Điểm danh và danh sách đăng ký sự kiện' },
                { module: 'finance' as GoogleSheetModule, title: 'Sổ quỹ Thu Chi', icon: DollarSign, desc: 'Giao dịch thu chi, danh mục và chứng từ' },
              ].map((item) => {
                const IconComponent = item.icon;
                return (
                  <div
                    key={item.module}
                    className="p-3 bg-white rounded-lg border border-slate-200 hover:border-emerald-300 transition-colors space-y-2 shadow-2xs"
                  >
                    <div className="flex items-center gap-2 font-medium text-xs text-slate-900">
                      <div className="p-1.5 rounded-md bg-slate-100 text-slate-700">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold">{item.title}</div>
                        <div className="text-[11px] text-slate-500">{item.desc}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveExportModule(item.module)}
                        className="flex-1 h-7 text-[11px] px-2 gap-1 text-slate-700 hover:text-emerald-700 hover:bg-emerald-50"
                      >
                        <Download className="w-3 h-3 text-emerald-600" /> Xuất Sheet
                      </Button>
                      {canManage && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveImportModule(item.module)}
                          className="flex-1 h-7 text-[11px] px-2 gap-1 text-slate-700 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Upload className="w-3 h-3 text-blue-600" /> Nhập Sheet
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Connected Spreadsheets List */}
          <div className="space-y-2 pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-slate-800">
                Bảng tính Google Sheets đã liên kết ({spreadsheets.length}):
              </div>
            </div>

            {isLoading ? (
              <div className="py-6 text-center text-xs text-slate-500">Đang tải danh sách bảng tính...</div>
            ) : spreadsheets.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-slate-200 rounded-lg text-slate-500 text-xs space-y-2">
                <FileSpreadsheet className="w-8 h-8 text-slate-400 mx-auto" />
                <p>Chưa có bảng tính Google Sheets nào được liên kết với Chi hội.</p>
                {canManage && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLinkDialogOpen(true)}
                    className="text-xs gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm Bảng tính liên kết
                  </Button>
                )}
              </div>
            ) : (
              <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 overflow-hidden bg-white">
                {spreadsheets.map((sheet) => (
                  <div
                    key={sheet.id}
                    className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 shrink-0 mt-0.5">
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-xs text-slate-900 flex items-center gap-1.5">
                          <span className="truncate">{sheet.spreadsheetName}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                            {sheet.status === 'active' ? 'Đang kết nối' : 'Đã lưu trữ'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono truncate max-w-sm">
                          ID: {sheet.spreadsheetId}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Xuất gần nhất: {sheet.lastExportAt ? new Date(sheet.lastExportAt).toLocaleDateString('vi-VN') : 'Chưa xuất'}
                          </span>
                          <span>•</span>
                          <span>
                            Nhập gần nhất: {sheet.lastImportAt ? new Date(sheet.lastImportAt).toLocaleDateString('vi-VN') : 'Chưa nhập'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(sheet.spreadsheetUrl, '_blank')}
                        className="h-8 text-xs px-2.5 gap-1.5 text-emerald-700 hover:bg-emerald-50"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Mở Sheet
                      </Button>

                      {canManage && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSheetToUnlink(sheet)}
                          className="h-8 text-xs px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Unlink Confirmation Dialog */}
      <Dialog open={Boolean(sheetToUnlink)} onOpenChange={(open) => !open && setSheetToUnlink(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-slate-900">
              Hủy liên kết Bảng tính
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Bạn có chắc chắn muốn hủy liên kết bảng tính &quot;{sheetToUnlink?.spreadsheetName}&quot; khỏi Chi hội? Dữ liệu trên Google Sheets sẽ không bị xóa.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSheetToUnlink(null)}
              className="text-xs"
            >
              Hủy
            </Button>
            <Button
              size="sm"
              disabled={unlinkMutation.isPending}
              onClick={handleConfirmUnlink}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs"
            >
              {unlinkMutation.isPending ? 'Đang hủy...' : 'Xác nhận hủy liên kết'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Spreadsheet Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="sm:max-w-lg rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xl">
          <form onSubmit={handleLinkSubmit}>
            <DialogHeader className="pb-1">
              <DialogTitle className="text-lg font-bold text-slate-900 tracking-tight">
                Liên kết Bảng tính Google Sheets
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Nhập URL hoặc Spreadsheet ID của bảng tính Google Sheets thuộc Đơn vị của bạn
              </DialogDescription>
            </DialogHeader>

            {linkError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2 mt-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{linkError}</span>
              </div>
            )}

            <div className="space-y-3.5 py-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Tên gọi bảng tính <span className="text-rose-500">*</span></label>
                <Input
                  required
                  placeholder="VD: Sổ tay Hoạt động & Thu Chi Đơn vị"
                  value={newSheetName}
                  onChange={(e) => setNewSheetName(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Đường dẫn Google Sheet (URL hoặc ID) <span className="text-rose-500">*</span></label>
                <Input
                  required
                  placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                  value={newSheetUrl}
                  onChange={(e) => setNewSheetUrl(e.target.value)}
                  className="h-9 text-xs font-mono"
                />
                <p className="text-[11px] text-slate-400">
                  Lưu ý: Bảng tính cần được cấp quyền xem/chỉnh sửa cho tài khoản Google của Ban Chấp Hành Đơn vị.
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setLinkDialogOpen(false)}
                className="text-xs"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={linkMutation.isPending || !newSheetUrl.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium cursor-pointer"
              >
                {linkMutation.isPending ? 'Đang lưu...' : 'Lưu liên kết'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Active Export Modal */}
      {activeExportModule && (
        <GoogleSheetsExportModal
          open={Boolean(activeExportModule)}
          onOpenChange={(open) => !open && setActiveExportModule(null)}
          module={activeExportModule}
        />
      )}

      {/* Active Import Wizard Modal */}
      {activeImportModule && (
        <GoogleSheetsImportWizardModal
          open={Boolean(activeImportModule)}
          onOpenChange={(open) => !open && setActiveImportModule(null)}
          module={activeImportModule}
        />
      )}
    </div>
  );
}
