import {
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatVietnameseDateTime, formatTimeAgo } from '../utils/quality-helpers';

interface DataQualityHeroProps {
  organizationName?: string;
  userRole?: string;
  qualityScore: number | null;
  totalIssues: number;
  criticalCount: number;
  warningCount: number;
  evaluatedAt?: string;
  isScanning: boolean;
  onRescan: () => void;
}

export function DataQualityHero({
  organizationName = 'Chi hội',
  qualityScore,
  totalIssues,
  criticalCount,
  warningCount,
  evaluatedAt,
  isScanning,
  onRescan,
}: DataQualityHeroProps) {
  const score = qualityScore ?? (totalIssues === 0 ? 100 : Math.max(0, 100 - totalIssues * 5));
  const suggestionCount = Math.max(0, totalIssues - criticalCount - warningCount);
  const formattedTime = formatVietnameseDateTime(evaluatedAt);
  const timeAgo = formatTimeAgo(evaluatedAt);

  return (
    <div className="rounded-2xl border border-hairline bg-white p-6 sm:p-7 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
        {/* Left Column: Title, Description & Integrity Metrics */}
        <div className="space-y-4 max-w-3xl">
          {/* Top metadata badges */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#e6f0ff] border border-[#d4e4fa] text-signal-blue text-xs font-semibold">
              <Building2 className="w-3.5 h-3.5 text-signal-blue" />
              <span>{organizationName}</span>
            </div>

            <Badge variant="outline" className="text-slate-gray border-hairline bg-cloud text-xs py-1 px-2.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-signal-blue" />
              Operations Control Center
            </Badge>

            {criticalCount === 0 && warningCount === 0 ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                All checks passed
              </span>
            ) : criticalCount > 0 ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-50 text-rose-800 border border-rose-200">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                {criticalCount} critical issues detected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                {warningCount} warnings need review
              </span>
            )}
          </div>

          {/* Headline & Description */}
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink-navy">
              Data Quality Hub
            </h1>
            <p className="text-sm sm:text-base text-mist-gray leading-relaxed">
              Data integrity and governance checks across members, terms, activities, tasks, finance and documents.
            </p>
          </div>

          {/* Operational Issues Breakdown Bar */}
          <div className="pt-2">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <div className="px-3.5 py-1.5 rounded-lg bg-cloud border border-hairline text-xs font-semibold text-ink-navy flex items-center gap-1.5">
                <span className="text-sm font-bold text-ink-navy tabular-nums">{totalIssues}</span>
                <span>issues detected</span>
              </div>

              <div className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 ${
                criticalCount > 0 ? 'bg-rose-50 border-rose-200 text-rose-800 font-semibold' : 'bg-cloud border-hairline text-mist-gray'
              }`}>
                <span className="font-bold tabular-nums">{criticalCount}</span> Critical
              </div>

              <div className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 ${
                warningCount > 0 ? 'bg-amber-50 border-amber-200 text-amber-800 font-semibold' : 'bg-cloud border-hairline text-mist-gray'
              }`}>
                <span className="font-bold tabular-nums">{warningCount}</span> Warnings
              </div>

              <div className="px-3 py-1.5 rounded-lg bg-cloud border border-hairline text-xs font-medium text-slate-gray flex items-center gap-1.5">
                <span className="font-bold tabular-nums">{suggestionCount}</span> Suggestions
              </div>

              <div className="px-3 py-1.5 rounded-lg bg-cloud border border-hairline text-xs font-medium text-slate-gray flex items-center gap-1.5">
                <span className="font-bold tabular-nums">6</span> Checks Active
              </div>

              {/* Secondary Integrity Score Badge */}
              <div className="px-3 py-1.5 rounded-lg bg-emerald-50/70 border border-emerald-200/80 text-xs font-medium text-emerald-900 flex items-center gap-1.5">
                <span>Score:</span>
                <span className="font-bold text-emerald-800 tabular-nums">{score}/100</span>
              </div>
            </div>
          </div>

          {/* Last scan info */}
          <div className="flex items-center gap-2 text-xs text-mist-gray pt-1">
            <Clock className="w-3.5 h-3.5 text-mist-gray" />
            <span>Last scan:</span>
            <span className="text-slate-gray font-medium">{formattedTime}</span>
            {timeAgo && <span className="text-mist-gray">· {timeAgo}</span>}
          </div>
        </div>

        {/* Right Column: Actions */}
        <div className="shrink-0 self-start lg:self-center">
          <Button
            id="btn-rescan-data-quality"
            type="button"
            onClick={onRescan}
            disabled={isScanning}
            className="h-11 px-5 rounded-lg bg-signal-blue hover:bg-[#005be0] text-white font-medium text-sm shadow-xs transition-all duration-150 cursor-pointer disabled:opacity-70"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Scanning system...' : 'Run scan'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
