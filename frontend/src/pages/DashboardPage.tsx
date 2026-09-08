import React from 'react';
import { LayoutDashboard, TrendingUp, Award, Clock } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <LayoutDashboard className="w-7 h-7 text-brand-400" />
            <span>Dashboard</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Overview of your career readiness and competency development.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium">
          <Clock className="w-3.5 h-3.5" />
          <span>Foundation Mode • Placeholder Data</span>
        </div>
      </div>

      {/* Metrics Placeholders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="glass-card p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Target Role Match</span>
            <TrendingUp className="w-4 h-4 text-brand-400" />
          </div>
          <div className="text-2xl font-bold text-white">--%</div>
          <p className="text-xs text-slate-500">Awaiting career profile setup</p>
        </div>

        <div className="glass-card p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Identified Skills</span>
            <Award className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white">0</div>
          <p className="text-xs text-slate-500">Skills repository foundation ready</p>
        </div>

        <div className="glass-card p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Roadmaps</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">0</div>
          <p className="text-xs text-slate-500">Learning milestones initialized</p>
        </div>
      </div>

      {/* Placeholder content banner */}
      <div className="glass-card p-8 text-center space-y-4 border-dashed border-slate-700">
        <h2 className="text-lg font-semibold text-slate-200">Dashboard Workspace Foundation</h2>
        <p className="text-sm text-slate-400 max-w-lg mx-auto">
          This dashboard section is scaffolded and ready for future module integrations including skill assessments, gap visualization, and personalized career roadmaps.
        </p>
      </div>
    </div>
  );
};

export default DashboardPage;
