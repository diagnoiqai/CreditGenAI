import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

console.log('INFO: ErrorBoundary.tsx is loading...');

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-app bg-[#F2F5FB] flex items-center justify-center p-4 pt-[calc(1rem+var(--safe-top))] pb-[calc(1rem+var(--safe-bottom))]">
          <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center border border-[#E4EAF4]">
            <div className="w-14 h-14 bg-[#FEE2E2] rounded-lg flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="text-[#DC2626] w-7 h-7" />
            </div>
            <h1 className="text-2xl font-display font-bold text-[#0D1626] mb-4">Something went wrong</h1>
            <p className="text-[#4A5878] mb-8 font-medium">
              We encountered an unexpected error. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center gap-2 bg-[#1B6EF3] text-white py-3 px-6 rounded-lg hover:bg-[#0F57D8] transition-all font-semibold shadow-md active:scale-95"
            >
              <RefreshCw className="w-5 h-5" /> Refresh Page
            </button>
            {process.env.NODE_ENV === 'development' && (
              <pre className="mt-6 p-4 bg-[#F7F9FD] rounded-lg text-left text-xs overflow-auto max-h-40 text-[#DC2626] border border-[#FEE2E2]">
                {this.state.error?.message}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
