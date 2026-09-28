import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    console.error('[ErrorBoundary] Caught render error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-lg text-center space-y-4 border border-gray-100">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto text-red-500">
              <AlertCircle size={28} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Something went wrong</h2>
              <p className="text-xs text-gray-500 mt-1">
                An unexpected error occurred while loading this page.
              </p>
            </div>
            <Button onClick={this.handleReset} className="w-full text-sm font-semibold">
              <RotateCcw size={16} className="mr-2" />
              Reload Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
