import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileQuestion } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cloud text-slate-gray border border-hairline">
        <FileQuestion strokeWidth={1.5} className="h-8 w-8" />
      </div>
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-ink-navy">404 - Không tìm thấy trang</h1>
        <p className="text-sm text-slate-gray max-w-md">
          Trang bạn yêu cầu không tồn tại hoặc đã được chuyển hướng trong ChapterOS.
        </p>
      </div>
      <Link to="/">
        <Button size="sm" className="mt-2 bg-signal-blue hover:bg-[#005be0] text-white font-semibold rounded-lg shadow-sm">
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Về Bảng Điều Khiển
        </Button>
      </Link>
    </div>
  );
}
