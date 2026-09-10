import React, { useEffect, useState } from 'react';
import { AlertCircle, Award, BookOpen, LayoutDashboard, Loader2, Target, UserCircle2 } from 'lucide-react';
import { getAuthErrorMessage } from '../services/authService';
import { getDashboard } from '../services/api';
import type { DashboardResponse } from '../types';

export const DashboardPage: React.FC = () => {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      try {
        const response = await getDashboard();
        if (isMounted) setDashboard(response);
      } catch (err: unknown) {
        if (isMounted) {
          setError(getAuthErrorMessage(err, 'Unable to load your dashboard. Please try again.'));
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadDashboard();
    return () => { isMounted = false; };
  }, []);

  if (isLoading) {
    return <LoadingState label="Loading your dashboard..." />;
  }

  if (error || !dashboard) {
    return <ErrorState message={error ?? 'Dashboard data is unavailable.'} />;
  }

  const completion = Math.min(100, Math.max(0, dashboard.profileCompletionPercentage));

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <LayoutDashboard className="w-7 h-7 text-brand-400" />
            <span>Dashboard</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Welcome back, {dashboard.fullName}. Here is your current career profile status.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-medium">
          <UserCircle2 className="w-3.5 h-3.5" />
          <span>{dashboard.profileStatus.replace('_', ' ')}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="glass-card p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Profile completion</span>
            <Target className="w-4 h-4 text-brand-400" />
          </div>
          <div className="text-2xl font-bold text-white">{completion}%</div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-800" aria-label={`Profile ${completion}% complete`} role="progressbar" aria-valuenow={completion} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-cyan-400 transition-all" style={{ width: `${completion}%` }} />
          </div>
        </div>

        <div className="glass-card p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Identified skills</span>
            <Award className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">{dashboard.skillCount}</div>
          <p className="text-xs text-slate-500">Skills saved to your profile</p>
        </div>

        <div className="glass-card p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Career goal</span>
            <BookOpen className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-bold text-white truncate">{dashboard.careerGoal || 'Not set'}</div>
          <p className="text-xs text-slate-500">Your current direction</p>
        </div>
      </div>

      <div className="glass-card p-6 space-y-5">
        <h2 className="text-lg font-semibold text-slate-200">Profile snapshot</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-sm">
          <Snapshot label="Email" value={dashboard.email} />
          <Snapshot label="Education" value={dashboard.education} />
          <Snapshot label="Career goal" value={dashboard.careerGoal} />
        </div>
      </div>
    </div>
  );
};

const Snapshot: React.FC<{ label: string; value: string | null }> = ({ label, value }) => (
  <div className="space-y-1">
    <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
    <p className="text-slate-200">{value || 'Not set'}</p>
  </div>
);

const LoadingState: React.FC<{ label: string }> = ({ label }) => (
  <div className="min-h-[45vh] flex flex-col items-center justify-center gap-3 text-slate-400">
    <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
    <p className="text-sm">{label}</p>
  </div>
);

const ErrorState: React.FC<{ message: string }> = ({ message }) => (
  <div className="glass-card p-8 max-w-xl mx-auto text-center space-y-3">
    <AlertCircle className="w-8 h-8 mx-auto text-rose-400" />
    <h2 className="text-lg font-semibold text-white">Unable to load dashboard</h2>
    <p className="text-sm text-slate-400">{message}</p>
  </div>
);

export default DashboardPage;
