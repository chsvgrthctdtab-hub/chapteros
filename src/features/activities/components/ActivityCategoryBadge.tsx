import { 
  Sparkles, 
  HeartHandshake, 
  GraduationCap, 
  Trophy, 
  Music, 
  Users, 
  BookOpen, 
  HelpCircle,
  type LucideIcon 
} from 'lucide-react';
import { ACTIVITY_CATEGORIES } from '../types/activity.types';
import type { ActivityCategory } from '@/types';

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Sparkles,
  HeartHandshake,
  GraduationCap,
  Trophy,
  Music,
  Users,
  BookOpen,
};

export function ActivityCategoryBadge({
  category,
  showIcon = true,
  className = '',
}: {
  category: ActivityCategory;
  showIcon?: boolean;
  className?: string;
}) {
  const config = ACTIVITY_CATEGORIES[category] || {
    key: category,
    label: category,
    colorClasses: {
      bg: 'bg-cloud',
      text: 'text-ink-navy',
      border: 'border-hairline',
    },
    iconName: 'HelpCircle',
    description: '',
  };

  const IconComponent = CATEGORY_ICONS[config.iconName] || HelpCircle;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.colorClasses.bg} ${config.colorClasses.text} ${config.colorClasses.border} ${className}`}
      title={config.description || config.label}
    >
      {showIcon && <IconComponent className="w-3.5 h-3.5 shrink-0" />}
      <span>{config.label}</span>
    </span>
  );
}
