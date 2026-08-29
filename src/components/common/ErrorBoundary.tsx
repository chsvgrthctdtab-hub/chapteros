import React, { type ErrorInfo, type ReactNode } from 'react';
import { AlertOctagon, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      showDetails: false,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Global ErrorBoundary] Uncaught React exception:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isDev = import.meta.env.DEV;

      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="max-w-lg w-full bg-white rounded-3xl border border-slate-200/80 shadow-2xl p-6 sm:p-8 text-center">
            <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-5 text-rose-600 shadow-sm">
              <AlertOctagon className="w-8 h-8" />
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mb-2">
              Đã xảy ra sự cố hiển thị
            </h1>

            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              Hệ thống vừa gặp sự cố không mong muốn trong khi tải trang. Dữ liệu của bạn vẫn an toàn trên hệ thống.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                type="button"
                variant="default"
                onClick={this.handleReload}
                className="w-full sm:w-auto rounded-xl px-5 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-md shadow-emerald-500/10 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Tải lại trang</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={this.handleGoHome}
                className="w-full sm:w-auto rounded-xl px-5 font-medium border-slate-200 hover:bg-slate-50 text-slate-700 gap-2 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Về Trang chủ</span>
              </Button>
            </div>

            {/* Developer technical inspection */}
            {isDev && this.state.error && (
              <div className="mt-8 pt-6 border-t border-slate-100 text-left">
                <button
                  type="button"
                  onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                  className="flex items-center justify-between w-full text-xs font-semibold text-slate-500 hover:text-slate-700 py-1 cursor-pointer"
                >
                  <span>Chi tiết lỗi kỹ thuật (Chế độ phát triển)</span>
                  {this.state.showDetails ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>

                {this.state.showDetails && (
                  <div className="mt-2.5 p-3.5 bg-slate-950 text-slate-200 rounded-xl text-xs font-mono overflow-x-auto max-h-48 leading-relaxed">
                    <p className="text-rose-400 font-bold mb-1">{this.state.error.name}: {this.state.error.message}</p>
                    {this.state.error.stack && (
                      <pre className="text-[11px] text-slate-400 whitespace-pre-wrap">
                        {this.state.error.stack}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
