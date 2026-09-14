import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in UI component tree:', error, errorInfo);
  }

  private handleRecover = () => {
    try {
      localStorage.setItem('dhealora_active_tab', 'dashboard');
    } catch {}
    this.setState({ hasError: false, error: null });
  };

  private handleClearCacheAndReload = () => {
    try {
      localStorage.removeItem('dhealora_active_tab');
      localStorage.removeItem('dhealora_vitals_records');
      localStorage.removeItem('dhealora_medicines');
      localStorage.removeItem('dhealora_appointments');
      localStorage.removeItem('dhealora_reports');
    } catch {}
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-6">
          <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
            <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xs">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Display Recovery (सुरक्षा पुनर्प्राप्ति)</h2>
            <p className="text-slate-600 dark:text-slate-300 text-xs mb-6 leading-relaxed">
              {this.state.error?.message || 'A temporary visual display issue occurred. You can safely return to your main health dashboard.'}
            </p>
            <div className="space-y-2.5">
              <button
                type="button"
                id="recover-dashboard-btn"
                onClick={this.handleRecover}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-all shadow-sm w-full cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Return to Health Dashboard
              </button>
              <button
                type="button"
                id="clear-cache-btn"
                onClick={this.handleClearCacheAndReload}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold text-xs transition-all w-full cursor-pointer"
              >
                Reset Display Cache & Reload
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
