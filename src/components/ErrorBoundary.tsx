import { Component, ErrorInfo, ReactNode } from 'react';
import { RotateCcw, RefreshCw, ShieldAlert, Download } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

const STORAGE_KEY = 'sambo_cabinet_state_v1';

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught error]', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleResetToDemo = () => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.warn('Failed to clear storage:', e);
    }
    window.location.reload();
  };

  private handleEmergencyExport = () => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        alert('Локальное хранилище пусто.');
        return;
      }
      const blob = new Blob([raw], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sambo_emergency_backup_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Не удалось сформировать аварийный файл.');
    }
  };

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-red-500/30 rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center gap-3.5 text-red-500">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white">Непредвиденная ошибка интерфейса</h2>
                <p className="text-xs text-red-400 font-semibold">Сработал контур защиты отказоустойчивости</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Компонент столкнулся со сбоем. Ваши данные в локальном хранилище защищены и не повреждены. Вы можете перезапустить компонент или сбросить демо-данные к первоначальным.
            </p>

            {this.state.error && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-700 font-mono text-[11px] text-red-300 overflow-x-auto max-h-32">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <button
                onClick={this.handleRetry}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Повторить попытку</span>
              </button>

              <button
                onClick={this.handleResetToDemo}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-bold transition border border-slate-600"
              >
                <RotateCcw className="w-4 h-4 text-red-400" />
                <span>Сбросить данные к демо</span>
              </button>

              <button
                onClick={this.handleEmergencyExport}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition border border-slate-700"
              >
                <Download className="w-4 h-4" />
                <span>Аварийный экспорт</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
