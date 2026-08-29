import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Users,
  CalendarRange,
  CalendarCheck,
  CheckSquare,
  Wallet,
  FolderArchive,
  Search,
} from 'lucide-react';
import type { DataQualitySummary } from '../types';

interface DataQualityRecentScansProps {
  summary?: DataQualitySummary | null;
  evaluatedAt?: string;
}

const CHECKER_MODULES = [
  {
    category: 'members' as const,
    name: 'Kiểm soát Hội viên',
    desc: 'MSSV, liên kết nhiệm kỳ, trùng email/sđt',
    icon: Users,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    category: 'terms' as const,
    name: 'Kiểm soát Nhiệm kỳ',
    desc: 'Nhiệm kỳ hoạt động duy nhất, khoảng ngày hợp lệ',
    icon: CalendarRange,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  {
    category: 'activities' as const,
    name: 'Kiểm soát Hoạt động',
    desc: 'Thời gian, người phụ trách, điểm rèn luyện',
    icon: CalendarCheck,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
  },
  {
    category: 'tasks' as const,
    name: 'Kiểm soát Công việc',
    desc: 'Hạn chót, người thực hiện, nhiệm vụ quá hạn',
    icon: CheckSquare,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  {
    category: 'finance' as const,
    name: 'Kiểm soát Tài chính',
    desc: 'Chứng từ thu/chi, phê duyệt, số dư quỹ',
    icon: Wallet,
    color: 'text-teal-600',
    bg: 'bg-teal-50',
  },
  {
    category: 'documents' as const,
    name: 'Kiểm soát Hồ sơ & Lưu trữ',
    desc: 'Đường dẫn liên kết, phân loại văn bản',
    icon: FolderArchive,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
  },
];

export function DataQualityRecentScans({ summary }: DataQualityRecentScansProps) {
  return (
    <div className="rounded-xl bg-white p-6 border border-slate-200/90 shadow-2xs space-y-4">
      <div className="space-y-1">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-700" />
          <span>Bộ máy rà soát tự động</span>
        </h2>
        <p className="text-xs text-slate-500">Trạng thái 6 module kiểm toán dữ liệu</p>
      </div>

      <div className="space-y-2.5">
        {CHECKER_MODULES.map((mod) => {
          const Icon = mod.icon;
          const breakdown = summary?.byCategory?.[mod.category];
          const hasIssues = (breakdown?.total ?? 0) > 0;
          const critical = breakdown?.critical ?? 0;

          return (
            <div
              key={mod.category}
              className="flex items-center justify-between p-3 rounded-lg bg-slate-50/70 border border-slate-200/70 transition-all hover:bg-slate-50"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${mod.bg} ${mod.color}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-800 truncate">{mod.name}</div>
                  <div className="text-[11px] text-slate-500 truncate">{mod.desc}</div>
                </div>
              </div>

              <div className="shrink-0 pl-2">
                {hasIssues ? (
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                      critical > 0
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    <AlertTriangle className="w-3 h-3" />
                    {breakdown?.total} vấn đề
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/50">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Chuẩn
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
