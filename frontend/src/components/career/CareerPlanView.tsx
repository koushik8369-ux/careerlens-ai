import React from 'react';
import { BookOpen, CheckCircle2, Circle, FileText, Lightbulb, Loader2, Presentation, Wrench } from 'lucide-react';
import type { CareerPlan, CareerPlanCategory, CareerPlanItem } from '../../types';

interface CareerPlanViewProps {
  plan: CareerPlan;
  updatingItemId: number | null;
  onToggleItem: (item: CareerPlanItem) => Promise<void>;
}

const categoryLabels: Record<CareerPlanCategory, string> = {
  SHORT_TERM: 'Short term',
  MEDIUM_TERM: 'Medium term',
  LONG_TERM: 'Long term',
};

const itemIcons = { LEARNING: BookOpen, PROJECT: Wrench, INTERVIEW: Presentation, RESUME: FileText };

export const CareerPlanView: React.FC<CareerPlanViewProps> = ({ plan, updatingItemId, onToggleItem }) => {
  const categories: CareerPlanCategory[] = ['SHORT_TERM', 'MEDIUM_TERM', 'LONG_TERM'];
  return (
    <div className="space-y-6">
      <div className="glass-card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-brand-300 font-semibold">Career goal</p>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">{plan.careerGoal || 'Your career direction'}</h2>
          <p className="text-xs text-slate-500 mt-2">Generated {new Date(plan.createdAt).toLocaleString()}</p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
          <CheckCircle2 className="w-3.5 h-3.5" /> {plan.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {categories.map((category) => {
          const items = plan.items.filter((item) => item.category === category);
          return (
            <section key={category} className="glass-card p-4 sm:p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Lightbulb className="w-4 h-4 text-amber-300" />
                <h3 className="font-semibold text-slate-200">{categoryLabels[category]}</h3>
                <span className="ml-auto text-xs text-slate-500">{items.length}</span>
              </div>
              {items.length === 0 && <p className="text-sm text-slate-500">No items yet.</p>}
              {items.map((item) => {
                const Icon = itemIcons[item.itemType];
                return (
                  <article key={item.id} className={`rounded-xl border p-4 transition ${item.completed ? 'border-emerald-500/25 bg-emerald-500/5' : 'border-slate-700/70 bg-slate-800/30'}`}>
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => void onToggleItem(item)}
                        disabled={updatingItemId === item.id}
                        aria-label={`${item.completed ? 'Mark incomplete' : 'Mark complete'}: ${item.title}`}
                        className="mt-0.5 text-slate-400 hover:text-emerald-300 disabled:opacity-50"
                      >
                        {updatingItemId === item.id ? <Loader2 className="w-5 h-5 animate-spin" /> : item.completed ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Circle className="w-5 h-5" />}
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start gap-2">
                          <Icon className="w-4 h-4 shrink-0 mt-0.5 text-brand-400" />
                          <h4 className={`text-sm font-semibold ${item.completed ? 'text-slate-400 line-through' : 'text-slate-100'}`}>{item.title}</h4>
                        </div>
                        {item.description && <p className="text-xs text-slate-400 mt-2">{item.description}</p>}
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          <span className="rounded-md border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-300">{item.priority}</span>
                          <span className="rounded-md border border-slate-700 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-400">{item.itemType}</span>
                          {item.skills.map((skill) => <span key={skill} className="rounded-md bg-slate-700/60 px-2 py-0.5 text-[10px] text-slate-300">{skill}</span>)}
                        </div>
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