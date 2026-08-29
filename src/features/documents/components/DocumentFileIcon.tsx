import {
  FileText,
  FileSpreadsheet,
  FileBox,
  Image,
  Archive,
  FileCode,
  File,
  Presentation,
  CheckSquare,
  Folder,
} from 'lucide-react';
import { getFileTypeGroup, getFileExtension, type FileTypeGroup } from '../utils/document.utils';
import { cn } from '@/lib/utils';

interface DocumentFileIconProps {
  mimeType?: string | null;
  filename?: string | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function DocumentFileIcon({
  mimeType,
  filename,
  className,
  size = 'md',
}: DocumentFileIconProps) {
  const typeGroup: FileTypeGroup = getFileTypeGroup(mimeType, filename);
  const ext = getFileExtension(filename);

  const sizeClasses = {
    sm: 'w-8 h-8 rounded-lg text-xs',
    md: 'w-10 h-10 rounded-xl text-xs',
    lg: 'w-12 h-12 rounded-xl text-sm',
    xl: 'w-16 h-16 rounded-2xl text-base',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
  };

  switch (typeGroup) {
    case 'gdoc':
      return (
        <div
          className={cn(
            'flex flex-col items-center justify-center font-bold bg-blue-50 border border-blue-200 text-blue-600 shadow-xs shrink-0',
            sizeClasses[size],
            className
          )}
          title="Google Docs"
        >
          <FileText className={iconSizes[size]} />
        </div>
      );

    case 'gsheet':
      return (
        <div
          className={cn(
            'flex flex-col items-center justify-center font-bold bg-emerald-50 border border-emerald-200 text-emerald-600 shadow-xs shrink-0',
            sizeClasses[size],
            className
          )}
          title="Google Sheets"
        >
          <FileSpreadsheet className={iconSizes[size]} />
        </div>
      );

    case 'gslide':
      return (
        <div
          className={cn(
            'flex flex-col items-center justify-center font-bold bg-amber-50 border border-amber-200 text-amber-600 shadow-xs shrink-0',
            sizeClasses[size],
            className
          )}
          title="Google Slides"
        >
          <Presentation className={iconSizes[size]} />
        </div>
      );

    case 'gform':
      return (
        <div
          className={cn(
            'flex flex-col items-center justify-center font-bold bg-purple-50 border border-purple-200 text-purple-600 shadow-xs shrink-0',
            sizeClasses[size],
            className
          )}
          title="Google Forms"
        >
          <CheckSquare className={iconSizes[size]} />
        </div>
      );

    case 'folder':
      return (
        <div
          className={cn(
            'flex flex-col items-center justify-center font-bold bg-amber-50 border border-amber-200 text-amber-700 shadow-xs shrink-0',
            sizeClasses[size],
            className
          )}
          title="Thư mục Google Drive"
        >
          <Folder className={iconSizes[size]} />
        </div>
      );

    case 'pdf':
      return (
        <div
          className={cn(
            'flex flex-col items-center justify-center font-bold bg-rose-50 border border-rose-200 text-rose-600 shadow-xs shrink-0',
            sizeClasses[size],
            className
          )}
          title={`PDF Document (${ext ? ext.toUpperCase() : 'PDF'})`}
        >
          <FileText className={iconSizes[size]} />
        </div>
      );

    case 'word':
      return (
        <div
          className={cn(
            'flex flex-col items-center justify-center font-bold bg-blue-50 border border-blue-200 text-blue-600 shadow-xs shrink-0',
            sizeClasses[size],
            className
          )}
          title={`Word Document (${ext ? ext.toUpperCase() : 'DOC'})`}
        >
          <FileText className={iconSizes[size]} />
        </div>
      );

    case 'excel':
      return (
        <div
          className={cn(
            'flex flex-col items-center justify-center font-bold bg-emerald-50 border border-emerald-200 text-emerald-600 shadow-xs shrink-0',
            sizeClasses[size],
            className
          )}
          title={`Spreadsheet (${ext ? ext.toUpperCase() : 'XLS'})`}
        >
          <FileSpreadsheet className={iconSizes[size]} />
        </div>
      );

    case 'powerpoint':
      return (
        <div
          className={cn(
            'flex flex-col items-center justify-center font-bold bg-amber-50 border border-amber-200 text-amber-600 shadow-xs shrink-0',
            sizeClasses[size],
            className
          )}
          title={`Presentation (${ext ? ext.toUpperCase() : 'PPT'})`}
        >
          <Presentation className={iconSizes[size]} />
        </div>
      );

    case 'image':
      return (
        <div
          className={cn(
            'flex flex-col items-center justify-center font-bold bg-purple-50 border border-purple-200 text-purple-600 shadow-xs shrink-0',
            sizeClasses[size],
            className
          )}
          title={`Image (${ext ? ext.toUpperCase() : 'IMG'})`}
        >
          <Image className={iconSizes[size]} />
        </div>
      );

    case 'archive':
      return (
        <div
          className={cn(
            'flex flex-col items-center justify-center font-bold bg-orange-50 border border-orange-200 text-orange-600 shadow-xs shrink-0',
            sizeClasses[size],
            className
          )}
          title={`Archive (${ext ? ext.toUpperCase() : 'ZIP'})`}
        >
          <Archive className={iconSizes[size]} />
        </div>
      );

    case 'text':
      return (
        <div
          className={cn(
            'flex flex-col items-center justify-center font-bold bg-slate-100 border border-slate-200 text-slate-700 shadow-xs shrink-0',
            sizeClasses[size],
            className
          )}
          title={`Text File (${ext ? ext.toUpperCase() : 'TXT'})`}
        >
          <FileCode className={iconSizes[size]} />
        </div>
      );

    default:
      return (
        <div
          className={cn(
            'flex flex-col items-center justify-center font-bold bg-slate-50 border border-slate-200 text-slate-600 shadow-xs shrink-0',
            sizeClasses[size],
            className
          )}
          title={`File (${ext ? ext.toUpperCase() : 'FILE'})`}
        >
          <File className={iconSizes[size]} />
        </div>
      );
  }
}
