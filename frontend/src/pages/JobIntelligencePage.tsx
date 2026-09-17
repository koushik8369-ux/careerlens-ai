import React, { useState, useEffect } from 'react';
import { analyzeJob, getJobHistory } from '../services/jobIntelligenceService';
import type {
  JobAnalysisRequest,
  JobAnalysisResponse,
  SkillGap,
  CareerRecommendation,
  InterviewQuestion,
} from '../types';
import {
  Briefcase,
  History,
  FileSearch,
  ArrowRight,
  Calendar,
  ChevronRight,
  Target,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  BookOpen,
  Wrench,
  ClipboardCheck,
  Mic,
  TrendingUp,
  Brain,
  RotateCcw,
} from 'lucide-react';

// ── Score Ring ───────────────────────────────────────────────────────────────

const scoreColor = (score: number) => {
  if (score >= 75) return '#4ade80';
  if (score >= 50) return '#facc15';
  return '#f87171';
};

const ScoreRing: React.FC<{ score: number; label: string; size?: number }> = ({
  score,
  label,
  size = 80,
}) => {
  const r = size / 2 - 8;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = scoreColor(score);
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1e293b" strokeWidth={7} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={7}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
      </svg>
      <span className="text-2xl font-extrabold text-slate-100 -mt-[64px]">{score}</span>
      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mt-[50px]">
        {label}
      </span>
    </div>
  );
};

// ── Skill Chip ───────────────────────────────────────────────────────────────

const SkillChip: React.FC<{ name: string; type: 'matched' | 'missing' | 'preferred' }> = ({
  name,
  type,
}) => {
  const styles = {
    matched: 'bg-green-500/10 border-green-500/30 text-green-300',
    missing: 'bg-red-500/10 border-red-500/30 text-red-300',
    preferred: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border ${styles[type]}`}
    >
      {type === 'matched' && <CheckCircle2 className="w-3 h-3" />}
      {type === 'missing' && <XCircle className="w-3 h-3" />}
      {type === 'preferred' && <AlertTriangle className="w-3 h-3" />}
      {name}
    </span>
  );
};

// ── Priority Badge ────────────────────────────────────────────────────────────

const PriorityBadge: React.FC<{ priority: string }> = ({ priority }) => {
  const styles: Record<string, string> = {
    HIGH: 'bg-red-500/15 border-red-500/30 text-red-300',
    MEDIUM: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
    LOW: 'bg-green-500/15 border-green-500/30 text-green-300',
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${styles[priority] || styles.LOW}`}
    >
      {priority}
    </span>
  );
};

// ── Category Icon ─────────────────────────────────────────────────────────────

const RecIcon: React.FC<{ category: string }> = ({ category }) => {
  if (category === 'LEARNING') return <BookOpen className="w-4 h-4 text-brand-400" />;
  if (category === 'PROJECT') return <Wrench className="w-4 h-4 text-purple-400" />;
  return <ClipboardCheck className="w-4 h-4 text-emerald-400" />;
};

const QIcon: React.FC<{ category: string }> = ({ category }) => {
  if (category === 'TECHNICAL') return <Brain className="w-4 h-4 text-brand-400" />;
  if (category === 'BEHAVIORAL') return <Mic className="w-4 h-4 text-purple-400" />;
  return <TrendingUp className="w-4 h-4 text-emerald-400" />;
};

// ── Analysis Result View ──────────────────────────────────────────────────────

const AnalysisResultView: React.FC<{ result: JobAnalysisResponse; onReset: () => void }> = ({
  result,
  onReset,
}) => {
  const [openQuestionIdx, setOpenQuestionIdx] = useState<number | null>(null);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-brand-400" />
            {result.jobTitle}
            {result.companyName && result.companyName !== 'Hiring Company' && (
              <span className="text-slate-400 font-medium text-sm">@ {result.companyName}</span>
            )}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Analyzed {new Date(result.createdAt).toLocaleString()}
          </p>
        </div>
        <button
          id="job-intel-reset-btn"
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/50 transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Analyze Another
        </button>
      </div>

      {/* Score Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col items-center gap-2">
          <ScoreRing score={result.overallMatchScore} label="Overall Match" />
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col items-center gap-2">
          <ScoreRing score={result.requiredSkillMatchPercent} label="Required Skills" />
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col items-center gap-2">
          <ScoreRing score={result.preferredSkillMatchPercent} label="Preferred Skills" />
        </div>
      </div>

      {/* Skills Overview */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wide">Skill Overview</h3>
        {result.matchedSkills.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500">✅ Matched</p>
            <div className="flex flex-wrap gap-2">
              {result.matchedSkills.map((s) => (
                <SkillChip key={s} name={s} type="matched" />
              ))}
            </div>
          </div>
        )}
        {result.missingSkills.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500">❌ Missing</p>
            <div className="flex flex-wrap gap-2">
              {result.missingSkills.slice(0, 12).map((s) => (
                <SkillChip key={s} name={s} type="missing" />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Skill Gaps */}
      {result.skillGaps.length > 0 && result.skillGaps[0].skill !== 'None' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wide">Skill Gap Analysis</h3>
          <div className="space-y-3">
            {result.skillGaps.map((gap: SkillGap, i: number) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50"
              >
                <PriorityBadge priority={gap.priority} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-200">{gap.skill}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{gap.explanation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Career Recommendations */}
      {result.recommendations.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wide">
            Career Recommendations
          </h3>
          <div className="space-y-3">
            {result.recommendations.map((rec: CareerRecommendation, i: number) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50"
              >
                <div className="shrink-0 mt-0.5">
                  <RecIcon category={rec.category} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">{rec.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{rec.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interview Questions */}
      {result.interviewQuestions.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wide">
            Role-Specific Interview Questions
          </h3>
          <div className="space-y-2">
            {result.interviewQuestions.map((q: InterviewQuestion, i: number) => (
              <div key={i} className="rounded-xl border border-slate-700/50 overflow-hidden">
                <button
                  id={`interview-q-${i}`}
                  onClick={() => setOpenQuestionIdx(openQuestionIdx === i ? null : i)}
                  className="w-full flex items-center justify-between gap-3 p-3 bg-slate-800/50 hover:bg-slate-800 transition-colors text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <QIcon category={q.category} />
                    <span className="text-sm font-medium text-slate-200">{q.question}</span>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${openQuestionIdx === i ? 'rotate-90' : ''}`}
                  />
                </button>
                {openQuestionIdx === i && (
                  <div className="px-4 py-3 bg-slate-900/60 border-t border-slate-700/50">
                    <p className="text-xs text-slate-400">
                      <span className="font-semibold text-slate-300">Why this question:</span>{' '}
                      {q.rationale}
                    </p>
                    <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-brand-500/10 border border-brand-500/20 text-brand-300">
                      {q.category}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ── JD Input Form ─────────────────────────────────────────────────────────────

const JobDescriptionInput: React.FC<{
  onAnalyze: (req: JobAnalysisRequest) => void;
  isLoading: boolean;
  error: string | null;
}> = ({ onAnalyze, isLoading, error }) => {
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const charCount = jobDescription.length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAnalyze({ jobTitle: jobTitle.trim() || undefined, companyName: companyName.trim() || undefined, jobDescription });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-3xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide" htmlFor="job-title">
            Job Title <span className="text-slate-600 normal-case">(optional)</span>
          </label>
          <input
            id="job-title"
            type="text"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="e.g. Senior Backend Engineer"
            className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/70 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-brand-500/60 focus:ring-1 focus:ring-brand-500/30 transition"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide" htmlFor="company-name">
            Company <span className="text-slate-600 normal-case">(optional)</span>
          </label>
          <input
            id="company-name"
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g. Google, Netflix"
            className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/70 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-brand-500/60 focus:ring-1 focus:ring-brand-500/30 transition"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide" htmlFor="job-description">
            Job Description <span className="text-red-400">*</span>
          </label>
          <span className={`text-xs ${charCount > 18000 ? 'text-red-400' : 'text-slate-500'}`}>
            {charCount.toLocaleString()} / 20,000
          </span>
        </div>
        <textarea
          id="job-description"
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the full job description here — include requirements, responsibilities, and qualifications for the most accurate analysis..."
          rows={14}
          maxLength={20000}
          required
          minLength={30}
          className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700/70 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-brand-500/60 focus:ring-1 focus:ring-brand-500/30 transition resize-none leading-relaxed font-mono"
        />
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button
        id="job-analyze-btn"
        type="submit"
        disabled={isLoading || charCount < 30}
        className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold text-sm bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-lg shadow-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-[1.01]"
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Analyzing Job Description…
          </>
        ) : (
          <>
            <Target className="w-4 h-4" />
            Analyze & Match
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────

export const JobIntelligencePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'analyze' | 'history'>('analyze');
  const [result, setResult] = useState<JobAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<JobAnalysisResponse[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  const fetchHistory = async () => {
    setIsHistoryLoading(true);
    try {
      const data = await getJobHistory();
      setHistory(data);
    } catch (err) {
      console.error('Failed to load job analysis history:', err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleAnalyze = async (req: JobAnalysisRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await analyzeJob(req);
      setResult(data);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg =
        axiosErr?.response?.data?.message ||
        'Analysis failed. Please check your job description and try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectHistory = (item: JobAnalysisResponse) => {
    setResult(item);
    setActiveTab('analyze');
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent flex items-center gap-3">
            <Briefcase className="w-7 h-7 text-brand-400" />
            Job & Career Intelligence
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Paste a job description to match it against your profile and get a personalised skill gap report.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
          <button
            id="tab-analyze"
            onClick={() => setActiveTab('analyze')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === 'analyze'
                ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSearch className="w-4 h-4" />
            Analyze
          </button>
          <button
            id="tab-history"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === 'history'
                ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            History
          </button>
        </div>
      </div>

      {/* Main Content */}
      {activeTab === 'analyze' ? (
        result ? (
          <AnalysisResultView result={result} onReset={() => setResult(null)} />
        ) : (
          <JobDescriptionInput onAnalyze={handleAnalyze} isLoading={isLoading} error={error} />
        )
      ) : (
        /* History Tab */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <History className="w-5 h-5 text-brand-400" />
              Past Analyses
            </h2>
            <button
              id="job-history-refresh-btn"
              onClick={fetchHistory}
              className="text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors"
            >
              Refresh
            </button>
          </div>

          {isHistoryLoading ? (
            <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-3">
              <div className="w-6 h-6 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
              <span>Loading analysis history…</span>
            </div>
          ) : history.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
              <p>No previous job analyses found. Analyze your first job description to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {history.map((item) => (
                <div
                  key={item.id}
                  id={`job-history-item-${item.id}`}
                  onClick={() => handleSelectHistory(item)}
                  className="bg-slate-900/60 border border-slate-800 hover:border-brand-500/50 rounded-2xl p-5 transition-all duration-200 cursor-pointer hover:scale-[1.01] shadow-lg group flex flex-col justify-between gap-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 shrink-0">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-100 group-hover:text-brand-300 transition-colors truncate max-w-[180px]">
                          {item.jobTitle}
                        </h3>
                        {item.companyName && item.companyName !== 'Hiring Company' && (
                          <p className="text-xs text-slate-500 font-medium">{item.companyName}</p>
                        )}
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          {new Date(item.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className="text-2xl font-extrabold"
                        style={{ color: scoreColor(item.overallMatchScore) }}
                      >
                        {item.overallMatchScore}
                      </span>
                      <span className="text-xs text-slate-400">/100</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-800/80 pt-3 text-xs">
                    <span className="text-slate-400">
                      {item.matchedSkills.length} matched · {item.missingSkills.length} gaps
                    </span>
                    <span className="text-brand-400 font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      View Report
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
