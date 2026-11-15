import React, { useState } from 'react';
import { Calendar, Loader2 } from '@/lib/icons';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { COMMON_POSITIONS } from '../types/member.types';
import type { Term } from '@/types';

interface BulkAssignTermDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  terms: Term[];
  isLoading?: boolean;
  onSubmit: (termId: string, position: string, department: string | null) => Promise<void>;
}

export function BulkAssignTermDialog({
  open,
  onOpenChange,
  selectedCount,
  terms = [],
  isLoading = false,
  onSubmit,
}: BulkAssignTermDialogProps) {
  const activeTerm = terms.find((t) => t.isCurrent) || terms[0];
  const [termId, setTermId] = useState(activeTerm?.id || '');
  const [position, setPosition] = useState('Hội viên');
  const [department, setDepartment] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Sync termId when dialog opens or activeTerm changes
  React.useEffect(() => {
    if (open) {
      setError(null);
      if (!termId && activeTerm?.id) {
        setTermId(activeTerm.id);
      }
    }
  }, [open, activeTerm?.id, termId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termId) {
      setError('Vui lòng chọn một nhiệm kỳ để gán.');
      return;
    }
    setError(null);
    try {
      await onSubmit(termId, position, department.trim() || null);
      onOpenChange(false);
    } catch (err: unknown) {
      const errorMsg = (err as Error)?.message || 'Có lỗi xảy ra khi gán nhiệm kỳ hàng loạt';
      setError(errorMsg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] p-6 rounded-2xl border-hairline bg-white shadow-xl animate-in fade-in zoom-in-95 duration-150">
        <DialogHeader className="space-y-1">
          <div className="w-10 h-10 rounded-xl bg-[#e6f0ff] text-signal-blue flex items-center justify-center mb-1">
            <Calendar className="w-5 h-5" />
          </div>
          <DialogTitle className="text-base font-bold text-ink-navy">
            Gán vào nhiệm kỳ hàng loạt
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-gray">
            Phân công sinh hoạt cho <strong className="text-ink-navy font-semibold">{selectedCount}</strong> hội viên đã chọn vào nhiệm kỳ.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* 1. Chọn nhiệm kỳ */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink-navy block">
              Nhiệm kỳ tiếp nhận <span className="text-rose-500">*</span>
            </label>
            <Select value={termId} onValueChange={setTermId}>
              <SelectTrigger className="w-full h-10 rounded-xl border-hairline bg-cloud/50 text-xs text-ink-navy">
                <SelectValue placeholder="-- Chọn nhiệm kỳ --" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-hairline bg-white shadow-lg">
                {terms.map((t) => (
                  <SelectItem key={t.id} value={t.id} className="text-xs">
                    {t.name} {t.isCurrent ? '(Hiện tại)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 2. Chức vụ chung */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink-navy block">
              Chức vụ trong nhiệm kỳ
            </label>
            <Select value={position} onValueChange={setPosition}>
              <SelectTrigger className="w-full h-10 rounded-xl border-hairline bg-cloud/50 text-xs text-ink-navy">
                <SelectValue placeholder="Chọn chức vụ" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-hairline bg-white shadow-lg">
                {COMMON_POSITIONS.map((pos) => (
                  <SelectItem key={pos} value={pos} className="text-xs">
                    {pos}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 3. Ban / Bộ phận (tùy chọn) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink-navy block">
              Ban / Tiểu ban chuyên môn (tùy chọn)
            </label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="VD: Ban Phong trào, Ban Học tập..."
              className="w-full h-10 px-3 rounded-xl border border-hairline bg-cloud/50 text-xs text-ink-navy focus:outline-hidden focus:ring-2 focus:ring-signal-blue/20 focus:border-signal-blue"
            />
          </div>

          <DialogFooter className="pt-3 gap-2 flex-row justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="h-9 px-4 text-xs font-semibold text-slate-gray"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isLoading || !termId}
              className="h-9 px-4 text-xs font-semibold bg-signal-blue hover:bg-[#005be0] text-white"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              Gán {selectedCount} hội viên
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
