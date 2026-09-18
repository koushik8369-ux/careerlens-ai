import React, { useEffect, useState } from 'react';
import { AlertCircle, CalendarCheck, Loader2, Sparkles } from 'lucide-react';
import axios from 'axios';
import { CareerPlanView } from '../components/career/CareerPlanView';
import { generateCareerPlan, getCurrentCareerPlan, updateCareerPlanItem } from '../services/careerAssistantService';
import type { CareerPlan, CareerPlanItem } from '../types';

const planErrorMessage = (error: unknown, fallback: string) => {
  if (!axios.isAxiosError(error)) return fallback;
  if (!error.response) return 'Career Plan is unavailable. Please check that the backend is running.';
  if (error.response.status === 404) return 'No career plan exists yet. Generate one from your profile and career context.';
  if (error.response.status === 400) return error.response.data?.message || 'Your career context is not ready for plan generation.';
  return error.response.status >= 500 ? 'Career Plan is temporarily unavailable. Please try again.' : fallback;
};

export const CareerPlanPage: React.FC = () => {
  const [plan, setPlan] = useState<CareerPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCurrentCareerPlan()
      .then(setPlan)
      .catch((err: unknown) => setError(planErrorMessage(err, 'Unable to load your career plan.')))
      .finally(() => setIsLoading(false));
  }, []);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try { setPlan(await generateCareerPlan()); }
    catch (err: unknown) { setError(planErrorMessage(err, 'Unable to generate your career plan.')); }
    finally { setIsGenerating(false); }
  };

  const handleToggleItem = async (item: CareerPlanItem) => {
    if (!plan) return;
    setUpdatingItemId(item.id);
    setError(null);
    try { setPlan(await updateCareerPlanItem(plan.id, item.id, { completed: !item.completed })); }
    catch (err: unknown) { setError(planErrorMessage(err, 'Unable to update this plan item.')); }
    finally { setUpdatingItemId(null); }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800 pb-5">
        <div><h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3"><CalendarCheck className="w-7 h-7 text-brand-400" /> Career Plan</h1><p className="text-sm text-slate-400 mt-1">Turn your career context into practical steps you can track.</p></div>
        <button type="button" onClick={() => void handleGenerate()} disabled={isGenerating} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-500 disabled:opacity-50 transition"><Sparkles className="w-4 h-4" />{isGenerating ? 'Generating...' : 'Generate Career Plan'}</button>
      </header>
      {error && <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300" role="alert"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{error}</div>}
      {isLoading && <div className="min-h-[35vh] flex flex-col items-center justify-center gap-3 text-slate-400"><Loader2 className="w-8 h-8 text-brand-400 animate-spin" /><p className="text-sm">Loading your career plan...</p></div>}
      {!isLoading && plan && <CareerPlanView plan={plan} updatingItemId={updatingItemId} onToggleItem={handleToggleItem} />}
      {!isLoading && !plan && !isGenerating && <div className="glass-card p-10 text-center"><CalendarCheck className="w-10 h-10 text-slate-500 mx-auto mb-3" /><h2 className="text-lg font-semibold text-white">No career plan yet</h2><p className="text-sm text-slate-400 mt-2">Generate a plan to organize your short, medium, and long-term goals.</p></div>}
    </div>
  );
};

export default CareerPlanPage;