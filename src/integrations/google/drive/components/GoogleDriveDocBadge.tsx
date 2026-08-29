import React from 'react';
import {
  HardDrive,
  FileText,
  FileSpreadsheet,
  Presentation,
  CheckSquare,
  FileCode,
  Image as ImageIcon,
  Folder,
  Cloud,
} from 'lucide-react';
import { GOOGLE_DRIVE_FILE_TYPE_INFO, getDriveFileTypeGroup } from '../google-drive.constants';
import type { DocumentSourceType } from '@/types';

interface GoogleDriveDocBadgeProps {
  sourceType?: DocumentSourceType;
  mimeType?: string | null;
  fileName?: string | null;
  isFolder?: boolean;
  className?: string;
  showIconOnly?: boolean;
}

export function GoogleDriveDocBadge({
  sourceType = 'supabase',
  mimeType,
  fileName,
  isFolder,
  className = '',
  showIconOnly = false,
}: GoogleDriveDocBadgeProps) {
  if (sourceType === 'google_drive') {
    const group = isFolder ? 'folder' : getDriveFileTypeGroup(mimeType, fileName);
    const info = GOOGLE_DRIVE_FILE_TYPE_INFO[group] || GOOGLE_DRIVE_FILE_TYPE_INFO.other;

    const renderIcon = () => {
      switch (group) {
        case 'doc':
          return <FileText className="w-3 h-3 text-blue-600 shrink-0" />;
        case 'sheet':
          return <FileSpreadsheet className="w-3 h-3 text-emerald-600 shrink-0" />;
        case 'slide':
          return <Presentation className="w-3 h-3 text-amber-600 shrink-0" />;
        case 'form':
          return <CheckSquare className="w-3 h-3 text-purple-600 shrink-0" />;
        case 'folder':
          return <Folder className="w-3 h-3 text-amber-600 shrink-0" />;
        case 'image':
          return <ImageIcon className="w-3 h-3 text-indigo-600 shrink-0" />;
        default:
          return <HardDrive className="w-3 h-3 text-emerald-600 shrink-0" />;
      }
    };

    if (showIconOnly) {
      return (
        <span
          className={`inline-flex items-center justify-center p-1 rounded-md bg-emerald-50 border border-emerald-200 ${className}`}
          title="Google Drive"
        >
          {renderIcon()}
        </span>
      );
    }

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 ${className}`}
        title={`Google Drive: ${info.label}`}
      >
        {renderIcon()}
        <span>Google Drive</span>
      </span>
    );
  }

  // Supabase Storage badge
  if (showIconOnly) {
    return (
      <span
        className={`inline-flex items-center justify-center p-1 rounded-md bg-slate-50 border border-slate-200 ${className}`}
        title="Supabase Storage"
      >
        <Cloud className="w-3 h-3 text-slate-500 shrink-0" />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-50 text-slate-700 border border-slate-200 ${className}`}
      title="Lưu trữ nội bộ Supabase"
    >
      <Cloud className="w-3 h-3 text-slate-500 shrink-0" />
      <span>Supabase Storage</span>
    </span>
  );
}
