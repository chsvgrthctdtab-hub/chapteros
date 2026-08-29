import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileQuestion } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        <FileQuestion className="h-8 w-8" />
      </div>
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900">404 - Không tìm thấy trang</h1>
        <p className="text-sm text-slate-500 max-w-md">
          The page you requested does not exist or has been moved in ChapterOS.
        </p>
      </div>
      <Link to="/">
        <Button size="sm" className="mt-2">
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to Dashboard
        </Button>
      </Link>
    </div>
  );
}
