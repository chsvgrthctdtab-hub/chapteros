import React from 'react';
import {
  AlertTriangle,
  Info,
  Clock,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import type { Term } from '@/types';

interface TermOperationalSignalsProps {
  terms: Term[];
  currentTerm: Term | null;
  onActivateTerm: (term: Term) => void;
  onCompleteTerm: (term: Term) => void;
}

export function TermOperationalSignals({
  terms,
  currentTerm,
  onActivateTerm,
  onCompleteTerm,
}: TermOperationalSignalsProps) {
  const signals: Array<{
    id: string;
    type: 'warning' | 'info' | 'notice';
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    linkTo?: string;
  }> = [];

  // Check 1: No current term
  if (!currentTerm && terms.length > 0) {
    const candidate = terms.find((t) => t.status === 'active' || t.status === 'draft') || terms[0];
    signals.push({
      id: 'no-current-term',
      type: 'warning',
      title: 'Chưa có nhiệm kỳ nào được đặt làm hiện hành',
      description:
        'Đơn vị đã tạo các nhiệm kỳ nhưng chưa có nhiệm kỳ nào được đặt làm hiện hành. Hãy kích hoạt một nhiệm kỳ làm mốc để liên kết hội viên và hoạt động.',
      actionLabel: candidate ? `Đặt "${candidate.name}" làm hiện hành` : undefined,
      onAction: candidate ? () => onActivateTerm(candidate) : undefined,
    });
  }

  // Check 2: Current term approaching end date (< 60 days)
  if (currentTerm) {
    const end = dayjs(currentTerm.endDate);
    const now = dayjs();
    const daysLeft = end.diff(now, 'day');

    if (daysLeft >= 0 && daysLeft <= 60) {
      signals.push({
        id: 'term-closing-soon',
        type: 'warning',
        title: `Nhiệm kỳ "${currentTerm.name}" sắp kết thúc (còn ${daysLeft} ngày)`,
        description:
          'Chuẩn bị tài liệu bàn giao, giải quyết các nhiệm vụ còn mở và đối soát sổ quỹ phục vụ checklist tổng kết.',
        actionLabel: 'Kiểm tra checklist tổng kết',
        onAction: () => onCompleteTerm(currentTerm),
      });
    } else if (daysLeft < 0) {
      signals.push({
        id: 'term-overdue',
        type: 'warning',
        title: `Nhiệm kỳ "${currentTerm.name}" đã quá hạn kết thúc theo kế hoạch`,
        description:
          'Thời hạn chính thức của nhiệm kỳ đã kết thúc. Vui lòng tiến hành chuyển giao, bàn giao nhân sự hoặc tổng kết lưu trữ.',
        actionLabel: 'Tổng kết & Lưu trữ',
        onAction: () => onCompleteTerm(currentTerm),
      });
    }
  }

  // Check 3: Draft terms ready
  const draftTerms = terms.filter((t) => t.status === 'draft');
  if (draftTerms.length > 0 && currentTerm) {
    signals.push({
      id: 'draft-term-planned',
      type: 'info',
      title: `Đã có ${draftTerms.length} nhiệm kỳ kế tiếp được lên lịch`,
      description: `Các nhiệm kỳ dự thảo (${draftTerms.map((t) => t.name).join(', ')}) đã sẵn sàng cho giai đoạn tiếp theo.`,
      linkTo: `/members`,
    });
  }

  if (signals.length === 0) return null;

  return (
    <div
      id="term-operational-signals"
      className="rounded-2xl border border-hairline bg-white p-4 sm:p-5 shadow-xs space-y-3"
    >
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-mist-gray flex items-center gap-1.5">
          <Info className="h-3.5 w-3.5 text-signal-blue" />
          Tín hiệu vận hành & Nhiệm kỳ
        </h4>
        <Link
          to="/data-quality"
          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
        >
          Không gian chất lượng dữ liệu
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="space-y-2.5">
        {signals.map((signal) => (
          <div
            key={signal.id}
            className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              signal.type === 'warning'
                ? 'bg-amber-50/50 border-amber-200/80 text-amber-950'
                : 'bg-[#e6f0ff]/50 border-[#d4e4fa] text-ink-navy'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  signal.type === 'warning'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-[#e6f0ff] text-signal-blue'
                }`}
              >
                {signal.type === 'warning' ? (
                  <AlertTriangle className="h-3.5 w-3.5" />
                ) : (
                  <Info className="h-3.5 w-3.5" />
                )}
              </div>
              <div>
                <h5 className="text-xs sm:text-sm font-bold">{signal.title}</h5>
                <p className="text-xs text-slate-gray mt-0.5 leading-relaxed">
                  {signal.description}
                </p>
              </div>
            </div>

            <div className="shrink-0 self-start sm:self-center">
              {signal.onAction && signal.actionLabel && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={signal.onAction}
                  className={`text-xs h-7 px-2.5 font-medium cursor-pointer shadow-xs ${
                    signal.type === 'warning'
                      ? 'bg-white border-amber-300 text-amber-900 hover:bg-amber-100'
                      : 'bg-white border-[#d4e4fa] text-signal-blue hover:bg-[#e6f0ff]'
                  }`}
                >
                  {signal.actionLabel}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
