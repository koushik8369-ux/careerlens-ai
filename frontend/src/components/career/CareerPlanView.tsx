import React from 'react';
import { BookOpen, CheckCircle2, Circle, FileText, Lightbulb, Loader2, Presentation, Target, TrendingUp, Wrench } from 'lucide-react';
import type { CareerPlan, CareerPlanCategory, CareerPlanItem, CareerPlanItemStatus } from '../../types';

interface CareerPlanViewProps {
  plan: CareerPlan;
  updatingItemId: string | null;
  onUpdateItem: (item: CareerPlanItem, status: CareerPlanItemStatus) => Promise<void>;
}

const itemIcons = { LEARNING: BookOpen, PROJECT: Wrench, INTERVIEW: Presentation, RESUME: FileText };
const itemStatuses: Array<{ value: CareerPlanItemStatus; label: string }> = [
  { value: 'NOT_STARTED', label: 'Not started' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'COMPLETED', label: 'Completed' },
];

export const CareerPlanView: React.FC<CareerPlanViewProps> = ({ plan, updatingItemId, onUpdateItem }) => {
  const categories: CareerPlanCategory[] = ['SHORT_TERM', 'MEDIUM_TERM', 'LONG_TERM'];
  const categoryLabels: Record<CareerPlanCategory, string> = {
    SHORT_TERM: 'Build the foundation',
    MEDIUM_TERM: 'Apply your skills',
    LONG_TERM: 'Prepare for opportunities',
  };
  const categoryDescriptions: Record<CareerPlanCategory, string> = {
    SHORT_TERM: 'Start with targeted learning and the most relevant gaps.',
    MEDIUM_TERM: 'Turn learning into project work and practical evidence.',
    LONG_TERM: 'Use your progress to strengthen job and interview readiness.',
  };
  const stageNumber = plan.progress.currentStage
    ? categories.indexOf(plan.progress.currentStage) + 1
    : null;

  return (
    <div className="space-y-6">
      <section className="glass-card p-5 sm:p-6" aria-label="Career plan overview">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
          <p className="text-xs uppercase tracking-wider text-brand-300 font-semibold">Career goal</p>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">{plan.careerGoal || 'Not enough information yet'}</h2>
          <p className="text-xs text-slate-500 mt-2">Generated {new Date(plan.createdAt).toLocaleString()}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {stageNumber && (
              <span className="inline-flex items-center gap-2 rounded-lg border border-brand-500/25 bg-brand-500/10 px-3 py-1.5 text-xs font-semibold text-brand-200">
                <Target className="h-3.5 w-3.5" /> Current stage {stageNumber} of {categories.length}
              </span>
            )}
            <span className="inline-flex w-fit items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5" /> {plan.status}
            </span>
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-4">
            <div className="flex items-center justify-between text-sm text-slate-400"><span>Overall progress</span><TrendingUp className="h-4 w-4 text-brand-400" /></div>
            <p className="mt-2 text-2xl font-bold text-white">{plan.progress.completionPercent}%</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800" role="progressbar" aria-label="Plan completion" aria-valuemin={0} aria-valuemax={100} aria-valuenow={plan.progress.completionPercent}>
              <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${plan.progress.completionPercent}%` }} />
            </div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-4">
            <p className="text-sm text-slate-400">Completed actions</p>
            <p className="mt-2 text-2xl font-bold text-emerald-300">{plan.progress.completedItems}<span className="ml-2 text-sm font-medium text-slate-500">/ {plan.progress.totalItems}</span></p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-4">
            <p className="text-sm text-slate-400">Still to do</p>
            <p className="mt-2 text-2xl font-bold text-white">{plan.progress.remainingItems}<span className="ml-2 text-sm font-medium text-slate-500">remaining</span></p>
            {plan.progress.inProgressItems > 0 && <p className="mt-1 text-xs text-brand-300">{plan.progress.inProgressItems} in progress</p>}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {categories.map((category) => {
          const items = plan.items.filter((item) => item.category === category);
          const stageActive = plan.progress.currentStage === category;
          return (
            <section key={category} className={`glass-card space-y-4 p-4 sm:p-5 ${stageActive ? 'border-brand-500/40' : ''}`}>
              <div className="border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Lightbulb className={`h-4 w-4 ${stageActive ? 'text-brand-300' : 'text-amber-300'}`} />
                  <h3 className="font-semibold text-slate-200">Stage {categories.indexOf(category) + 1} · {categoryLabels[category]}</h3>
                  <span className="ml-auto text-xs text-slate-500">{items.length}</span>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-400">{categoryDescriptions[category]}</p>
                {stageActive && <span className="mt-2 inline-flex rounded-full bg-brand-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-brand-200">Current stage</span>}
              </div>
              {items.length === 0 && <p className="text-sm text-slate-500">No supported actions in this stage yet.</p>}
              {items.map((item) => {
                const Icon = itemIcons[item.itemType];
                return (
                  <article key={item.id} className={`rounded-xl border p-4 transition ${item.status === 'COMPLETED' ? 'border-emerald-500/25 bg-emerald-500/5' : 'border-slate-700/70 bg-slate-800/30'}`}>
                    <div className="flex items-start gap-3">
                      <span className={`mt-0.5 ${item.status === 'COMPLETED' ? 'text-emerald-400' : item.status === 'IN_PROGRESS' ? 'text-brand-300' : 'text-slate-500'}`} aria-hidden="true">
                        {updatingItemId === item.id ? <Loader2 className="h-5 w-5 animate-spin" /> : item.status === 'COMPLETED' ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-2">
                          <Icon className="w-4 h-4 shrink-0 mt-0.5 text-brand-400" />
                          <h4 className={`text-sm font-semibold ${item.status === 'COMPLETED' ? 'text-slate-400 line-through' : 'text-slate-100'}`}>{item.title}</h4>
                        </div>
                        {item.description && <p className="text-xs text-slate-400 mt-2">{item.description}</p>}
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          <span className="rounded-md border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-300">{item.priority}</span>
                          <span className="rounded-md border border-slate-700 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-400">{item.itemType}</span>
                          {item.skills.map((skill) => <span key={skill} className="rounded-md bg-slate-700/60 px-2 py-0.5 text-[10px] text-slate-300">{skill}</span>)}
                        </div>
                        <label className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                          <span className="sr-only">Progress for {item.title}</span>
                          <select
                            value={item.status}
                            onChange={(event) => void onUpdateItem(item, event.target.value as CareerPlanItemStatus)}
                            disabled={updatingItemId === item.id}
                            className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/60 disabled:opacity-50"
                          >
                            {itemStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                          </select>
                        </label>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          );
        })}
      </div>
    </div>
  );
};

export default CareerPlanView;