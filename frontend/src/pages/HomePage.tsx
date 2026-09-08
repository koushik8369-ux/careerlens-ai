import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, ShieldCheck, Activity, BrainCircuit, Target, BookOpen } from 'lucide-react';
import { checkHealth } from '../services/api';

export const HomePage: React.FC = () => {
  const [healthStatus, setHealthStatus] = useState<string | null>(null);
  const [isLoadingHealth, setIsLoadingHealth] = useState(false);
  const [healthError, setHealthError] = useState<string | null>(null);

  const handleCheckBackendHealth = async () => {
    setIsLoadingHealth(true);
    setHealthError(null);
    try {
      const res = await checkHealth();
      setHealthStatus(res.status);
    } catch (err: unknown) {
      setHealthError('Failed to connect to backend. Please ensure the backend is running on port 8080.');
    } finally {
      setIsLoadingHealth(false);
    }
  };

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center max-w-3xl mx-auto pt-6 pb-4 space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold tracking-wide uppercase">
          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          <span>Smart Career Intelligence Platform</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Navigate Your Career Path with{' '}
          <span className="bg-gradient-to-r from-brand-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Precision Intelligence
          </span>
        </h1>

        <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          CareerLens AI helps students analyze skills, identify critical industry gaps, track learning milestones, and unlock personalized career recommendations.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium shadow-lg shadow-brand-600/25 transition-all duration-200 hover:translate-y-[-1px]"
            id="hero-cta-dashboard"
          >
            <span>Explore Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/about"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 font-medium border border-slate-700/60 transition-all duration-200"
            id="hero-cta-about"
          >
            <span>Learn More</span>
          </Link>
        </div>
      </section>

      {/* Core Foundation Highlights */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <div className="glass-card p-6 glass-card-hover space-y-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-semibold text-white">Skill Intelligence</h2>
          <p className="text-sm text-slate-400">
            Scalable foundation designed for upcoming multi-dimensional skill evaluation and market benchmarking.
          </p>
        </div>

        <div className="glass-card p-6 glass-card-hover space-y-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Target className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-semibold text-white">Gap Analysis</h2>
          <p className="text-sm text-slate-400">
            Architected to pinpoint exact competencies missing for target engineering and technology roles.
          </p>
        </div>

        <div className="glass-card p-6 glass-card-hover space-y-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-semibold text-white">Guided Learning</h2>
          <p className="text-sm text-slate-400">
            Modular layout prepared for personalized roadmap tracking and curriculum milestones.
          </p>
        </div>
      </section>

      {/* Backend Health Check Integration Verification Card */}
      <section className="glass-card p-6 border-brand-500/20 max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-brand-500/15 text-brand-400 border border-brand-500/30">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Backend Connectivity Check</h3>
              <p className="text-xs text-slate-400">Verify full-stack integration via GET /api/health</p>
            </div>
          </div>
          <button
            onClick={handleCheckBackendHealth}
            disabled={isLoadingHealth}
            id="btn-check-backend-health"
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-brand-300 border border-brand-500/30 transition-all disabled:opacity-50"
          >
            {isLoadingHealth ? 'Checking...' : 'Ping Backend API'}
          </button>
        </div>

        {healthStatus && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300 animate-fade-in" id="backend-health-success">
            <ShieldCheck className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span>Response: <strong>{healthStatus}</strong></span>
          </div>
        )}

        {healthError && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 animate-fade-in" id="backend-health-error">
            {healthError}
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;
