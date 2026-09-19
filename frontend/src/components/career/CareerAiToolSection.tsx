import React from 'react';
import { AlertCircle, Loader2, Sparkles } from 'lucide-react';

interface CareerAiToolSectionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  buttonLabel: string;
  loadingLabel: string;
  isLoading: boolean;
  error: string | null;
  hasResult: boolean;
  emptyMessage: string;
  onGenerate: () => void;
  children: React.ReactNode;
}

export const CareerAiToolSection: React.FC<CareerAiToolSectionProps> = ({
  title,
  description,
  icon,
  buttonLabel,
  loadingLabel,
  isLoading,
  error,
  hasResult,
  emptyMessage,
  onGenerate,
  children,
}) => (
  <section className="glass-card p-5 sm:p-6" aria-labelledby={`${title.toLowerCase().replace(/\s+/g, '-')}-heading`}>
    <div className="flex flex-col gap-4 border-b border-slate-800/80 pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 id={`${title.toLowerCase().replace(/\s+/g, '-')}-heading`} className="flex items-center gap-2 text-lg font-semibold text-white">
          {icon} {title}
        </h2>
        <p className="mt-1 text-sm text-slate-400">{description}</p>
      </div>
      <button
        type="button"
        onClick={onGenerate}
        disabled={isLoading}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {isLoading ? loadingLabel : buttonLabel}
      </button>
    </div>
    {error && <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300" role="alert"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
    {isLoading && <div className="flex min-h-32 flex-col items-center justify-center gap-2 text-sm text-slate-400"><Loader2 className="h-6 w-6 animate-spin text-brand-400" /><p>{loadingLabel}</p></div>}
    {!isLoading && !hasResult && !error && <div className="flex min-h-32 flex-col items-center justify-center text-center"><p className="text-sm text-slate-300">{emptyMessage}</p><p className="mt-1 text-xs text-slate-500">Generate guidance from your saved career context when you are ready.</p></div>}
    {!isLoading && hasResult && <div className="mt-5">{children}</div>}
  </section>
);

export default CareerAiToolSection;