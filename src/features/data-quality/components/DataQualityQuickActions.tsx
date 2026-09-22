import { Link } from 'react-router-dom';
import {
  ExternalLink,
  Users,
  CalendarRange,
  CalendarCheck,
  CheckSquare,
  Wallet,
  FolderArchive,
  ArrowRight,
} from 'lucide-react';

const QUICK_MODULES = [
  {
    title: 'Hội viên',
    desc: 'Cập nhật MSSV & gán nhiệm kỳ',
    href: '/members',
    icon: Users,
    color: 'text-signal-blue',
    bg: 'bg-[#e6f0ff]',
  },
  {
    title: 'Nhiệm kỳ',
    desc: 'Thiết lập thời gian & kích hoạt',
    href: '/terms',
    icon: CalendarRange,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  {
    title: 'Hoạt động',
    desc: 'Bổ sung người phụ trách',
    href: '/activities',
    icon: CalendarCheck,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
  },
  {
    title: 'Công việc',
    desc: 'Gia hạn & phân công xử lý',
    href: '/tasks',
    icon: CheckSquare,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  {
    title: 'Tài chính',
    desc: 'Duyệt thu chi & hóa đơn',
    href: '/finance',
    icon: Wallet,
    color: 'text-teal-600',
    bg: 'bg-teal-50',
  },
  {
    title: 'Tài liệu',
    desc: 'Kiểm tra link Google Drive',
    href: '/documents',
    icon: FolderArchive,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
  },
];

export function DataQualityQuickActions() {
  return (
    <div className="rounded-xl bg-white p-6 border border-hairline shadow-xs space-y-4">
      <div className="space-y-1">
        <h2 className="text-base font-bold text-ink-navy flex items-center gap-2">
          <ExternalLink className="w-4 h-4 text-signal-blue" />
          <span>Lối tắt xử lý nghiệp vụ</span>
        </h2>
        <p className="text-xs text-mist-gray">Truy cập trực tiếp các phân hệ để cập nhật dữ liệu</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {QUICK_MODULES.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              to={item.href}
              className="group flex items-center justify-between p-3 rounded-lg border border-hairline bg-white hover:border-slate-gray hover:bg-cloud/80 transition-all duration-150 shadow-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${item.bg} ${item.color}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-ink-navy truncate">{item.title}</div>
                  <div className="text-[11px] text-mist-gray truncate">{item.desc}</div>
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-mist-gray group-hover:text-slate-gray group-hover:translate-x-0.5 transition-all shrink-0 ml-1" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
