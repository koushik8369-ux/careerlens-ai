import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowRight, BriefcaseBusiness, Loader2, Sparkles } from 'lucide-react';
import axios from 'axios';
import { ProjectRecommendationCards } from '../components/career/ProjectRecommendationCards';
import { generateProjectRecommendations } from '../services/careerAssistantService';
import type {
  ProjectRecommendationCategory,
  ProjectRecommendationDifficulty,
  ProjectRecommendationPreferences,
  ProjectRecommendationResult,
} from '../types';

const categories: ProjectRecommendationCategory[] = ['BACKEND', 'FRONTEND', 'FULL_STACK', 'AI_ML', 'DATA', 'CLOUD_DEVOPS', 'GENERAL'];
const difficulties: ProjectRecommendationDifficulty[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
const formatLabel = (value: string) => value.toLowerCase().replace(/(^|_)([a-z])/g, (_, separator: string, letter: string) => `${separator ? ' ' : ''}${letter.toUpperCase()}`);

export const ProjectRecommendationsPage: React.FC = () => {
  const [result, setResult] = useState<ProjectRecommendationResult | null>(null);
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [focusSkill, setFocusSkill] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    const preferences: ProjectRecommendationPreferences = {};
    const selectedCategory = categories.find((item) => item === category);
    const selectedDifficulty = difficulties.find((item) => item === difficulty);
    if (selectedCategory) preferences.category = selectedCategory;
    if (selectedDifficulty) preferences.difficulty = selectedDifficulty;
    if (focusSkill) preferences.focusSkill = focusSkill;
    try {
      setResult(await generateProjectRecommendations(preferences));
    } catch (cause: unknown) {
      const message = axios.isAxiosError(cause)
        ? cause.response?.data?.message ?? (cause.response ? 'Unable to generate project recommendations.' : 'Career Assistant is unavailable. Please check that the backend is running.')
        : 'Unable to generate project recommendations.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-brand-950/40 p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <span className="rounded-xl border border-brand-500/25 bg-brand-500/10 p-3"><BriefcaseBusiness className="h-6 w-6 text-brand-300" /></span>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-brand-300">JOBFIT AI · Project Studio</p>
            <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Project Recommendations</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">Turn saved skill gaps into practical work you can build, test, and describe truthfully. Recommendations use your own profile, latest resume and job analyses, saved market snapshot, and active Career Plan when available.</p>
          </div>
        </div>
      </header>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6" aria-labelledby="project-preferences">
        <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-brand-300" /><h2 id="project-preferences" className="text-base font-semibold text-white">Shape your project ideas</h2></div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="text-sm text-slate-300">
            Project area
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white focus:border-brand-400 focus:outline-none">
              <option value="">Use my saved context</option>
              {categories.map((item) => <option key={item} value={item}>{formatLabel(item)}</option>)}
            </select>
          </label>
          <label className="text-sm text-slate-300">
            Scope
            <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white focus:border-brand-400 focus:outline-none">
              <option value="">Use a suitable level</option>
              {difficulties.map((item) => <option key={item} value={item}>{formatLabel(item)}</option>)}
            </select>
          </label>
          <label className="text-sm text-slate-300">
            Focus skill
            <select value={focusSkill} onChange={(event) => setFocusSkill(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white focus:border-brand-400 focus:outline-none">
              <option value="">Any saved skill or gap</option>
              {(result?.availableFocusSkills ?? []).map((skill) => <option key={skill} value={skill}>{skill}</option>)}
            </select>
          </label>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => void handleGenerate()} disabled={isLoading} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:from-brand-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-60">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {isLoading ? 'Building recommendations…' : result ? 'Refresh recommendations' : 'Recommend projects'}
          </button>
          <Link to="/career-assistant" className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white">Ask Career Assistant <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>

      {error && <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
      {result?.targetRole && <p className="text-sm text-slate-400">Target role: <span className="font-medium text-slate-200">{result.targetRole}</span></p>}
      {result?.contextNotice && <p className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-sm leading-6 text-amber-100">{result.contextNotice}</p>}
      {result?.recommendations.length ? <ProjectRecommendationCards recommendations={result.recommendations} />
        : result && <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 text-center">
          <p className="text-sm text-slate-300">There is not enough saved career context to make a relevant project recommendation yet.</p>
          <div className="mt-4 flex justify-center gap-3 text-sm">
            <Link to="/profile" className="text-brand-300 hover:text-brand-200">Add profile skills</Link>
            <Link to="/resume-analyzer" className="text-brand-300 hover:text-brand-200">Analyze a resume</Link>
          </div>
        </div>}
    </div>
  );
};

export default ProjectRecommendationsPage;
