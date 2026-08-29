import {
  DOCUMENT_CATEGORY_CONFIGS,
  DOCUMENT_ACCESS_CONFIGS,
} from '../utils/document.utils';
import type { DocumentCategory, DocumentAccessLevel } from '../types/document.types';
import { cn } from '@/lib/utils';
import { Globe, Lock, ShieldCheck, UserCheck } from 'lucide-react';

interface DocumentCategoryBadgeProps {
  category: DocumentCategory;
  className?: string;
}

export function DocumentCategoryBadge({ category, className }: DocumentCategoryBadgeProps) {
  const config = DOCUMENT_CATEGORY_CONFIGS[category] || DOCUMENT_CATEGORY_CONFIGS.general;

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border whitespace-nowrap',
        config.badgeClass,
        className
      )}
      title={config.description}
    >
      {config.label}
    </span>
  );
}

interface DocumentAccessLevelBadgeProps {
  accessLevel: DocumentAccessLevel;
  className?: string;
  showIcon?: boolean;
}

export function DocumentAccessLevelBadge({
  accessLevel,
  className,
  showIcon = true,
}: DocumentAccessLevelBadgeProps) {
  const config = DOCUMENT_ACCESS_CONFIGS[accessLevel] || DOCUMENT_ACCESS_CONFIGS.internal;

  const renderIcon = () => {
    switch (accessLevel) {
      case 'public':
        return <Globe className="w-3 h-3 mr-1 text-emerald-600" />;
      case 'internal':
        return <UserCheck className="w-3 h-3 mr-1 text-blue-600" />;
      case 'board_only':
        return <ShieldCheck className="w-3 h-3 mr-1 text-amber-600" />;
      case 'admin_only':
        return <Lock className="w-3 h-3 mr-1 text-rose-600" />;
      default:
        return null;
    }
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border whitespace-nowrap',
        config.badgeClass,
        className
      )}
      title={config.description}
    >
      {showIcon && renderIcon()}
      {config.label}
    </span>
  );
}
