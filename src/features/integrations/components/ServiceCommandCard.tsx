import { 
  FolderSync, 
  FileText, 
  CalendarDays, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  ChevronRight,
  FileSpreadsheet,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { GoogleServiceKey } from '@/types';

export interface ServiceCardData {
  key: GoogleServiceKey;
  name: string;
  subtitle: string;
  tagline: string;
  description: string;
  requiredScope: string;
  isScopeGranted: boolean;
  isOrgConnected: boolean;
  metrics: {
    label1: string;
    val1: string | number;
    label2: string;
    val2: string | number;
    label3: string;
    val3: string | number;
  };
  highlights: string[];
}

interface ServiceCommandCardProps {
  data: ServiceCardData;
  onOpenDetail: (key: GoogleServiceKey) => void;
  onQuickAction?: (key: GoogleServiceKey) => void;
}

export function ServiceCommandCard({
  data,
  onOpenDetail,
}: ServiceCommandCardProps) {
  const isReady = data.isOrgConnected && data.isScopeGranted;

  const getServiceIcon = () => {
    switch (data.key) {
      case 'forms':
        return <FileText strokeWidth={1.5} className="h-5 w-5 text-signal-blue" />;
      case 'sheets':
        return <FileSpreadsheet strokeWidth={1.5} className="h-5 w-5 text-signal-blue" />;
      case 'calendar':
        return <CalendarDays className="h-5 w-5 text-signal-blue" />;
      case 'drive':
        return <FolderSync strokeWidth={1.5} className="h-5 w-5 text-signal-blue" />;
    }
  };

  const getServiceColorBg = () => {
    return 'bg-[#e6f0ff] border-[#d4e4fa]';
  };

  return (
    <Card 
      id={`service-command-card-${data.key}`}
      className="border-hairline shadow-xs hover:shadow-xs hover:border-mist-gray transition-all flex flex-col justify-between bg-white group"
    >
      <div>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 border ${getServiceColorBg()}`}>
                {getServiceIcon()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-bold text-ink-navy">
                    {data.name}
                  </CardTitle>
                </div>
                <CardDescription className="text-xs text-mist-gray font-medium line-clamp-1">
                  {data.subtitle}
                </CardDescription>
              </div>
            </div>

            {/* Status badge */}
            {isReady ? (
              <Badge variant="success" className="text-[11px] px-2 py-0.5 flex items-center gap-1 bg-emerald-50 text-emerald-700 border-emerald-200">
                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                Sẵn sàng
              </Badge>
            ) : data.isOrgConnected ? (
              <Badge variant="warning" className="text-[11px] px-2 py-0.5 flex items-center gap-1 bg-amber-50 text-amber-700 border-amber-200">
                <Clock className="h-3 w-3 text-amber-600" />
                Cần thêm Scope
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-[11px] px-2 py-0.5 flex items-center gap-1 text-mist-gray bg-cloud border-hairline">
                <Clock className="h-3 w-3 text-mist-gray" />
                Chờ kết nối
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-0 text-xs">
          <p className="text-slate-gray leading-relaxed text-xs line-clamp-2">
            {data.description}
          </p>

          {/* Operational Metrics Micro-Dashboard */}
          <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-cloud border border-hairline">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-semibold text-mist-gray block truncate">
                {data.metrics.label1}
              </span>
              <span className="text-xs font-bold text-ink-navy font-mono">
                {data.metrics.val1}
              </span>
            </div>

            <div className="space-y-0.5 border-l border-hairline pl-2">
              <span className="text-[10px] uppercase font-semibold text-mist-gray block truncate">
                {data.metrics.label2}
              </span>
              <span className="text-xs font-bold text-ink-navy font-mono truncate block">
                {data.metrics.val2}
              </span>
            </div>

            <div className="space-y-0.5 border-l border-hairline pl-2">
              <span className="text-[10px] uppercase font-semibold text-mist-gray block truncate">
                {data.metrics.label3}
              </span>
              <span className="text-xs font-bold text-ink-navy font-mono truncate block">
                {data.metrics.val3}
              </span>
            </div>
          </div>

          {/* Key Capabilities List */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-semibold text-slate-gray">Khả năng tự động hóa:</span>
            <ul className="space-y-1 text-slate-gray text-[11px]">
              {data.highlights.slice(0, 2).map((hl, idx) => (
                <li key={idx} className="flex items-start gap-1.5 leading-snug">
                  <ArrowRight className="h-3 w-3 text-signal-blue shrink-0 mt-0.5" />
                  <span>{hl}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </div>

      <CardFooter className="bg-cloud border-t border-hairline py-3 px-4 flex items-center justify-between gap-2">
        <div className="text-[10px] font-mono text-mist-gray truncate max-w-[170px]">
          Scope: {data.requiredScope.replace('https://www.googleapis.com/auth/', '')}
        </div>

        <div className="flex items-center gap-2">
          <Button
            id={`btn-inspect-service-${data.key}`}
            variant="outline"
            size="sm"
            onClick={() => onOpenDetail(data.key)}
            className="text-xs h-7.5 bg-white hover:bg-cloud border-hairline text-slate-gray font-medium cursor-pointer"
          >
            Chi tiết & Cấu hình
            <ChevronRight className="h-3.5 w-3.5 ml-1 text-mist-gray group-hover:translate-x-0.5 transition-transform" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
