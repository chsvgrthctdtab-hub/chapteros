/**
 * icons.tsx — ChapterOS Icon System
 *
 * Translation Layer: Export tất cả icon với tên Lucide quen thuộc (PascalCase)
 * nhưng render bằng Google Material Symbols Rounded bên dưới.
 *
 * Cách dùng:
 *   import { CheckCircle2, AlertTriangle } from '@/lib/icons'
 *   // Tên component giống hệt Lucide → Không cần sửa gì trong các file hiện có
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

// ============================================================
// Base AppIcon Component — Material Symbols Rounded Renderer
// ============================================================

export interface AppIconProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: string;
  size?: number;
  filled?: boolean;
  weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700;
  strokeWidth?: number; // ignored (compatibility shim for Lucide API)
  className?: string;
}

// Components returned by icon() have 'name' baked in — callers never pass it
export type AppIconComponent = React.FC<Omit<AppIconProps, 'name'>>;

const AppIcon = React.forwardRef<HTMLSpanElement, AppIconProps>(
  ({ name, size, filled = false, weight = 400, className, style, strokeWidth: _sw, ...props }, ref) => {
    let iconSize = size;
    if (!iconSize && className) {
      if (className.includes('w-3') || className.includes('h-3')) iconSize = 12;
      else if (className.includes('w-3.5') || className.includes('h-3.5')) iconSize = 14;
      else if (className.includes('w-4') || className.includes('h-4')) iconSize = 16;
      else if (className.includes('w-5') || className.includes('h-5')) iconSize = 20;
      else if (className.includes('w-6') || className.includes('h-6')) iconSize = 24;
      else if (className.includes('w-7') || className.includes('h-7')) iconSize = 28;
      else if (className.includes('w-8') || className.includes('h-8')) iconSize = 32;
    }
    const finalSize = iconSize || 18;
    const sizePx = `${finalSize}px`;

    return (
      <span
        ref={ref}
        className={cn(
          'material-symbols-rounded select-none shrink-0 inline-flex items-center justify-center leading-none text-center align-middle',
          className
        )}
        style={{
          fontSize: sizePx,
          width: sizePx,
          height: sizePx,
          fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' ${weight}, 'GRAD' 0, 'opsz' 20`,
          ...style,
        }}
        aria-hidden="true"
        {...props}
      >
        {name}
      </span>
    );
  }
);
AppIcon.displayName = 'AppIcon';

// ============================================================
// Factory: tạo icon component từ tên Material Symbol
// ============================================================
function icon(name: string, defaultFilled = false): AppIconComponent {
  const C: AppIconComponent = ({ filled = defaultFilled, ...props }) =>
    <AppIcon name={name} filled={filled} {...props} />;
  C.displayName = name;
  return C;
}


// ============================================================
// BẢNG ÁNH XẠ ĐẦY ĐỦ: Lucide → Material Symbols Rounded
// 88 icon unique được dùng trong toàn bộ codebase
// ============================================================

// --- Navigation & Layout ---
export const LayoutDashboard   = icon('dashboard');
export const LayoutGrid        = icon('grid_view');
export const Home              = icon('home');
export const Layers            = icon('layers');
export const Columns           = icon('view_column');

// --- Folder & Files ---
export const FolderKanban      = icon('folder_open');
export const FolderOpen        = icon('folder_open');
export const FileText          = icon('description');
export const FileEdit          = icon('edit_document');
export const FileQuestion      = icon('help_outline');
export const FileSpreadsheet   = icon('table_chart');
export const ImageIcon         = icon('image');

// --- Calendar & Time ---
export const CalendarDays      = icon('calendar_month');
export const Calendar          = icon('calendar_today');
export const CalendarCheck     = icon('event_available');
export const CalendarPlus      = icon('calendar_add_on');
export const CalendarRange     = icon('date_range');
export const Clock             = icon('schedule');

// --- Tasks & Checks ---
export const CheckSquare       = icon('check_box');
export const Check             = icon('check');
export const CheckCircle2      = icon('check_circle');

// --- People ---
export const Users             = icon('group');
export const User              = icon('person');
export const UserPlus          = icon('person_add');
export const UserMinus         = icon('person_remove');
export const UserCheck         = icon('how_to_reg');
export const UserCog           = icon('manage_accounts');
export const GraduationCap     = icon('school');

// --- Finance ---
export const Wallet            = icon('account_balance_wallet');
export const DollarSign        = icon('attach_money');
export const Receipt           = icon('receipt');
export const Scale             = icon('balance');
export const Percent           = icon('percent');

// --- Charts & Data ---
export const BarChart3         = icon('bar_chart');
export const PieChart          = icon('pie_chart');
export const PieChartIcon      = icon('pie_chart');
export const PieIcon           = icon('pie_chart');
export const TrendingUp        = icon('trending_up');
export const TrendingDown      = icon('trending_down');
export const Table             = icon('table');
export const TableIcon         = icon('table');
export const Activity          = icon('monitoring');

// --- Alerts & Status ---
export const AlertCircle       = icon('error');
export const AlertTriangle     = icon('warning');
export const AlertOctagon      = icon('report');
export const Info              = icon('info');
export const HelpCircle        = icon('help_outline');
export const XCircle           = icon('cancel');
export const Circle            = icon('radio_button_unchecked');

// --- Actions ---
export const Plus              = icon('add');
export const PlusCircle        = icon('add_circle');
export const Trash2            = icon('delete');
export const Download          = icon('download');
export const Upload            = icon('upload');
export const RefreshCw         = icon('refresh');
export const RotateCcw         = icon('undo');
export const Search            = icon('search');
export const Filter            = icon('filter_list');
export const Eye               = icon('visibility');
export const ExternalLink      = icon('open_in_new');
export const Printer           = icon('print');
export const Archive           = icon('archive');
export const Star              = icon('star');
export const Flag              = icon('flag');
export const Flame             = icon('local_fire_department');
export const Sparkles          = icon('auto_awesome');
export const Target            = icon('my_location');
export const PlayCircle        = icon('play_circle');

// --- Navigation Arrows ---
export const ArrowLeft         = icon('arrow_back');
export const ArrowRight        = icon('arrow_forward');
export const ArrowUpRight      = icon('north_east');
export const ArrowDownRight    = icon('south_east');
export const ArrowRightLeft    = icon('swap_horiz');
export const ChevronDown       = icon('keyboard_arrow_down');
export const ChevronRight      = icon('keyboard_arrow_right');
export const ChevronUp         = icon('keyboard_arrow_up');
export const ChevronLeft       = icon('keyboard_arrow_left');

// --- Organizations & Buildings ---
export const Building2         = icon('apartment');
export const Briefcase         = icon('work');
export const Network           = icon('account_tree');
export const Globe             = icon('language');

// --- Security & Shield ---
export const Shield            = icon('shield');
export const ShieldCheck       = icon('verified_user');
export const ShieldAlert       = icon('gpp_bad');
export const Lock              = icon('lock');
export const Unlock            = icon('lock_open');
export const Award             = icon('military_tech');

// --- Connectivity ---
export const Link2Off          = icon('link_off');
export const Unlink            = icon('link_off');
export const Puzzle            = icon('extension');

// --- Header actions ---
export const Bell              = icon('notifications');
export const Database          = icon('database');
export const Settings          = icon('settings');
export const LogOut            = icon('logout');
export const Menu              = icon('menu');
export const History           = icon('history');
export const MapPin            = icon('location_on');

// --- Icons phát hiện thêm từ lint pass 1 ---
export const Copy              = icon('content_copy');
export const X                 = icon('close');
export const ArrowUpDown       = icon('swap_vert');
export const SlidersHorizontal = icon('tune');

// --- Icons phát hiện thêm từ lint pass 2 ---
export const Mail              = icon('mail');
export const Phone             = icon('phone');
export const Save              = icon('save');
export const Languages         = icon('translate');
export const Key               = icon('key');
export const Boxes             = icon('category');
export const Wrench            = icon('build');
export const Edit2             = icon('edit');
export const List              = icon('list');
export const ListTodo          = icon('checklist');
export const CheckCircle       = icon('check_circle');
export const MoreHorizontal    = icon('more_horiz');
export const HardDrive         = icon('hard_drive');
export const Presentation      = icon('slideshow');
export const FileCode          = icon('code');
export const Image             = icon('image');
export const Folder            = icon('folder');
export const Cloud             = icon('cloud');
export const Link2             = icon('link');

// --- Icons phát hiện thêm từ lint pass 3 ---
export const FolderArchive     = icon('folder_zip');
export const FolderPlus        = icon('create_new_folder');
export const FolderSync        = icon('folder_managed');
export const Edit3             = icon('edit');
export const Edit              = icon('edit');
export const MoreVertical      = icon('more_vert');
export const Maximize2         = icon('open_in_full');
export const Tag               = icon('label');
export const FileBox           = icon('inventory_2');
export const File              = icon('draft');
export const FileUp            = icon('upload_file');
export const Grid              = icon('grid_on');
export const UploadCloud       = icon('cloud_upload');
export const Link              = icon('link');
export const KeyRound          = icon('key');
export const BookOpen          = icon('menu_book');
export const CheckCheck        = icon('done_all');
export const Inbox             = icon('inbox');
export const Kanban            = icon('view_kanban');
export const Share2            = icon('share');
export const Package           = icon('inventory');
export const ClipboardPaste    = icon('content_paste');
export const Users2            = icon('group');
export const UserX             = icon('person_off');
export const Coins             = icon('monetization_on');
export const Server            = icon('dns');
export const Crown             = icon('workspace_premium');

// --- Icons phát hiện thêm từ lint pass 4 (batch cuối) ---
export const HeartHandshake    = icon('volunteer_activism');
export const Trophy            = icon('emoji_events');
export const Music             = icon('music_note');
export const Send              = icon('send');
export const ListFilter        = icon('filter_list');
export const Code2             = icon('code_blocks');
export const Sliders           = icon('tune');
export const Hash              = icon('tag');
export const CalendarCheck2    = icon('event_available');
export const CalendarClock     = icon('event_upcoming');
export const WalletCards       = icon('credit_card');

// Loader2 giữ Lucide SVG vì animation CSS xoay hoạt động tốt hơn với SVG
export { Loader2 } from 'lucide-react';

// --- Type export để tương thích với code dùng LucideIcon type ---
export type { AppIconComponent as LucideIcon };
export { AppIcon };
