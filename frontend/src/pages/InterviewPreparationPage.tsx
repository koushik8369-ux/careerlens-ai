import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowRight, CheckCircle2, CircleHelp, ClipboardCheck, Loader2, MessageSquareText, RefreshCw, Sparkles, Target } from 'lucide-react';
import axios from 'axios';
import {
  getInterviewAnswerFeedback,
  prepareForInterview,
} from '../services/careerAssistantService';
import type {
  InterviewAnswerFeedback,
  InterviewPreparationCategory,
  InterviewPreparationQuestion,
  InterviewPreparationResult,
} from '../types';

type PracticeMode = 'PRACTICE' | 'MOCK';
type CategoryFilter = InterviewPreparationCategory | 'ALL';

const CATEGORY_LABELS: Record<InterviewPreparationCategory, string> = {
  TECHNICAL: 'Technical',
  BEHAVIORAL: 'Behavioral',
  RESUME_BASED: 'Resume-based',
  PROJECT_BASED: 'Project-based',
  ROLE_SPECIFIC: 'Role-specific',
  SITUATIONAL: 'Situational',
  HR: 'HR',
};

const READINESS_LABELS = {
  STRONG: 'Strong',
  NEEDS_PRACTICE: 'Needs Practice',
  NOT_ENOUGH_DATA: 'Not Enough Data',
} as const;

function requestError(error: unknown) {
  if (!axios.isAxiosError(error)) return 'Interview preparation is temporarily unavailable. Please try again.';
  if (!error.response) return 'Interview preparation is unavailable. Check that the backend is running.';
  if (error.response.status === 400) return error.response.data?.message ?? 'Please review your answer and try again.';
  return error.response.status >= 500
    ? 'Interview preparation is temporarily unavailable. Please try again.'
    : 'Unable to complete that request.';
}

function unique(values: string[]) {
  return [...new Set(values)];
}

function readinessStyle(status: InterviewPreparationResult['readiness']['status']) {
  if (status === 'STRONG') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200';
  if (status === 'NEEDS_PRACTICE') return 'border-amber-500/30 bg-amber-500/10 text-amber-200';
  return 'border-slate-700 bg-slate-800/60 text-slate-300';
}

export const InterviewPreparationPage: React.FC = () => {
  const [preparation, setPreparation] = useState<InterviewPreparationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<PracticeMode>('PRACTICE');
  const [category, setCategory] = useState<CategoryFilter>('ALL');
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [mockIndex, setMockIndex] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [answer, setAnswer] = useState('');
  const [feedbackByQuestion, setFeedbackByQuestion] = useState<Record<string, InterviewAnswerFeedback>>({});

  const loadPreparation = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await prepareForInterview();
      setPreparation(result);
      setSelectedQuestionId(result.questions[0]?.id ?? null);
      setFeedbackByQuestion({});
      setShowSummary(false);
      setMode('PRACTICE');
      setAnswer('');
    } catch (requestFailure: unknown) {
      setError(requestError(requestFailure));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setIsLoading(true);
      try {
        const result = await prepareForInterview();
        if (mounted) {
          setPreparation(result);
          setSelectedQuestionId(result.questions[0]?.id ?? null);
        }
      } catch (requestFailure: unknown) {
        if (mounted) setError(requestError(requestFailure));
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    void load();
    return () => { mounted = false; };
  }, []);

  const filteredQuestions = useMemo(() => {
    if (!preparation) return [];
    return category === 'ALL'
      ? preparation.questions
      : preparation.questions.filter((question) => question.category === category);
  }, [category, preparation]);
  const currentQuestion = mode === 'MOCK'
    ? preparation?.questions[mockIndex] ?? null
    : filteredQuestions.find((question) => question.id === selectedQuestionId) ?? filteredQuestions[0] ?? null;
  const currentFeedback = currentQuestion ? feedbackByQuestion[currentQuestion.id] : undefined;
  const availableCategories = unique((preparation?.questions ?? []).map((question) => question.category));
  const completedFeedback = Object.values(feedbackByQuestion);
  const coveredCategories = preparation?.questions
    .filter((question) => feedbackByQuestion[question.id])
    .map((question) => CATEGORY_LABELS[question.category]) ?? [];
  const strengths = unique(completedFeedback.flatMap((item) => item.strengths)).slice(0, 4);
  const improvementAreas = unique(completedFeedback.flatMap((item) => item.improvements)).slice(0, 4);

  const startMockInterview = () => {
    if (!preparation?.questions.length) return;
    setFeedbackByQuestion({});
    setMockIndex(0);
    setCategory('ALL');
    setMode('MOCK');
    setShowSummary(false);
    setAnswer('');
  };

  const submitAnswer = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentQuestion || !answer.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const feedback = await getInterviewAnswerFeedback({
        question: currentQuestion.question,
        category: currentQuestion.category,
        answer: answer.trim(),
      });
      setFeedbackByQuestion((current) => ({ ...current, [currentQuestion.id]: feedback }));
    } catch (requestFailure: unknown) {
      setError(requestError(requestFailure));
    } finally {
      setIsSubmitting(false);
    }
  };

  const advanceMock = () => {
    if (!preparation || !currentFeedback) return;
    if (mockIndex + 1 >= preparation.questions.length) {
      setShowSummary(true);
      setMode('PRACTICE');
      return;
    }
    setMockIndex((current) => current + 1);
    setAnswer('');
  };

  const selectQuestion = (question: InterviewPreparationQuestion) => {
    setSelectedQuestionId(question.id);
    setAnswer('');
    setError(null);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 border-b border-slate-800 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-300">JOBFIT AI</p>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-white sm:text-3xl">
            <MessageSquareText className="h-7 w-7 text-brand-400" /> Interview Preparation
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Practice questions grounded in your saved profile, resume analysis, job fit, and Career Plan.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadPreparation()}
          disabled={isLoading || isSubmitting}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/70 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-brand-500/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh preparation
        </button>
      </header>

      {error && <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200" role="alert"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}

      {isLoading && !preparation && <div className="glass-card flex min-h-64 flex-col items-center justify-center gap-3 text-sm text-slate-400"><Loader2 className="h-7 w-7 animate-spin text-brand-400" /><p>Preparing questions from your saved career context...</p></div>}

      {preparation && !isLoading && (
        <>
          {preparation.contextNotice && <div className="flex items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 text-sm leading-6 text-amber-100" role="status"><CircleHelp className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" /><span>{preparation.contextNotice}</span></div>}

          <section className="glass-card p-5 sm:p-6" aria-labelledby="readiness-heading">
            <div className="flex flex-col gap-4 border-b border-slate-800/80 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 id="readiness-heading" className="flex items-center gap-2 text-lg font-semibold text-white"><Target className="h-5 w-5 text-brand-400" /> Interview readiness</h2>
                <p className="mt-1 text-sm text-slate-400">Qualitative guidance from available saved evidence; no readiness percentages are inferred.</p>
              </div>
              <span className={`inline-flex w-fit rounded-full border px-3 py-1.5 text-sm font-semibold ${readinessStyle(preparation.readiness.status)}`}>
                {READINESS_LABELS[preparation.readiness.status]}
              </span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {preparation.readiness.dimensions.map((dimension) => (
                <article key={dimension.name} className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                  <p className="text-sm font-semibold text-white">{dimension.name}</p>
                  <span className={`mt-3 inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${readinessStyle(dimension.status)}`}>{READINESS_LABELS[dimension.status]}</span>
                  <p className="mt-3 text-xs leading-5 text-slate-400">{dimension.evidence}</p>
                </article>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2" aria-label="Available interview context">
              {Object.entries(preparation.contextAvailability).map(([key, available]) => (
                <span key={key} className={`rounded-full border px-2.5 py-1 text-xs ${available ? 'border-brand-500/25 bg-brand-500/10 text-brand-200' : 'border-slate-800 bg-slate-900/70 text-slate-500'}`}>
                  {key.replace(/([A-Z])/g, ' $1')}: {available ? 'available' : 'not available'}
                </span>
              ))}
            </div>
          </section>

          {showSummary ? (
            <section className="glass-card space-y-5 p-5 sm:p-6" aria-labelledby="mock-summary-heading">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 id="mock-summary-heading" className="text-xl font-semibold text-white">Mock interview summary</h2>
                  <p className="mt-1 text-sm text-slate-400">{completedFeedback.length} question{completedFeedback.length === 1 ? '' : 's'} answered</p>
                </div>
                <button type="button" onClick={startMockInterview} className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-500">Start again</button>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <SummaryList title="Strengths observed" items={strengths} emptyText="Complete answers to see practice observations." />
                <SummaryList title="Areas to improve" items={improvementAreas} emptyText="No improvement notes are available yet." />
                <SummaryList title="Topic coverage" items={unique(coveredCategories)} emptyText="No topics were covered." />
              </div>
              {preparation.recommendedPracticeAreas.length > 0 && <SummaryList title="Recommended next steps" items={preparation.recommendedPracticeAreas} emptyText="No additional practice steps are available." />}
              <p className="text-xs leading-5 text-slate-500">This summary reflects answer length, question-term overlap, and suggested structure only. It does not grade technical correctness or verify personal claims.</p>
            </section>
          ) : (
            <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
              <section className="glass-card min-w-0 p-5 sm:p-6" aria-labelledby="practice-heading">
                <div className="flex flex-col gap-4 border-b border-slate-800/80 pb-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 id="practice-heading" className="text-lg font-semibold text-white">{mode === 'MOCK' ? 'Mock interview' : 'Question practice'}</h2>
                    <p className="mt-1 text-sm text-slate-400">
                      {preparation.targetRole ? `Target role: ${preparation.targetRole}` : 'No target role saved; showing general practice questions.'}
                      {mode === 'MOCK' && preparation.questions.length > 0 ? ` · Question ${mockIndex + 1} of ${preparation.questions.length}` : ''}
                    </p>
                  </div>
                  {mode === 'PRACTICE' && <button type="button" onClick={startMockInterview} disabled={!preparation.questions.length} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-500 disabled:opacity-50"><Sparkles className="h-4 w-4" /> Start mock interview</button>}
                </div>

                {mode === 'PRACTICE' && (
                  <div className="mt-4 flex flex-wrap gap-2" aria-label="Filter questions by category">
                    {(['ALL', ...availableCategories] as CategoryFilter[]).map((filter) => (
                      <button key={filter} type="button" onClick={() => { setCategory(filter); setAnswer(''); setError(null); }} aria-pressed={category === filter} className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${category === filter ? 'border-brand-500/40 bg-brand-500/15 text-brand-100' : 'border-slate-700 bg-slate-900 text-slate-400 hover:text-white'}`}>
                        {filter === 'ALL' ? 'All questions' : CATEGORY_LABELS[filter]}
                      </button>
                    ))}
                  </div>
                )}

                {mode === 'PRACTICE' && (
                  <div className="mt-4 flex gap-2 overflow-x-auto pb-2 xl:hidden">
                    {filteredQuestions.map((question, index) => (
                      <button key={question.id} type="button" onClick={() => selectQuestion(question)} aria-current={currentQuestion?.id === question.id ? 'true' : undefined} className={`min-w-48 rounded-xl border p-3 text-left ${currentQuestion?.id === question.id ? 'border-brand-500/40 bg-brand-500/10' : 'border-slate-800 bg-slate-950/40'}`}>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-300">{CATEGORY_LABELS[question.category]}</span>
                        <span className="mt-1 block line-clamp-2 text-xs leading-5 text-slate-300">{question.question}</span>
                        <span className="mt-2 block text-[10px] text-slate-500">Question {index + 1}</span>
                      </button>
                    ))}
                  </div>
                )}

                {currentQuestion ? (
                  <>
                    <article className="mt-5 rounded-2xl border border-brand-500/20 bg-gradient-to-br from-brand-500/10 to-slate-950/60 p-5">
                      <span className="inline-flex rounded-full border border-brand-500/25 bg-brand-500/10 px-2.5 py-1 text-xs font-semibold text-brand-200">{CATEGORY_LABELS[currentQuestion.category]}</span>
                      <h3 className="mt-4 text-lg font-semibold leading-7 text-white">{currentQuestion.question}</h3>
                      <p className="mt-3 text-sm leading-6 text-slate-400">{currentQuestion.rationale}</p>
                    </article>
                    <form onSubmit={(event) => void submitAnswer(event)} className="mt-5 space-y-3">
                      <label htmlFor="interview-answer" className="block text-sm font-medium text-slate-200">Your answer</label>
                      <textarea id="interview-answer" value={answer} onChange={(event) => setAnswer(event.target.value)} maxLength={5000} rows={7} disabled={isSubmitting} placeholder="Write an answer using only examples and claims you can verify..." className="w-full resize-y rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm leading-6 text-white placeholder:text-slate-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60" />
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-slate-500">{answer.length}/5000 characters · Feedback checks structure and text signals only.</p>
                        <button type="submit" disabled={!answer.trim() || isSubmitting} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-50">
                          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-4 w-4" />}
                          {isSubmitting ? 'Reviewing answer...' : currentFeedback ? 'Review again' : 'Submit answer'}
                        </button>
                      </div>
                    </form>

                    {currentFeedback && <FeedbackPanel feedback={currentFeedback} />}
                    {mode === 'MOCK' && currentFeedback && <button type="button" onClick={advanceMock} className="mt-5 inline-flex items-center gap-2 rounded-xl border border-brand-500/30 bg-brand-500/10 px-4 py-2.5 text-sm font-semibold text-brand-100 transition hover:bg-brand-500/20">
                      {mockIndex + 1 >= preparation.questions.length ? 'View mock summary' : 'Next question'} <ArrowRight className="h-4 w-4" />
                    </button>}
                  </>
                ) : <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/40 p-6 text-center text-sm text-slate-400">No questions are available in this category. Try another filter or update your saved profile/resume context.</div>}
              </section>

              <aside className="space-y-5">
                {mode === 'PRACTICE' && <section className="glass-card hidden p-4 xl:block" aria-label="Question list">
                  <h2 className="px-1 text-sm font-semibold text-white">Question bank <span className="text-slate-500">({filteredQuestions.length})</span></h2>
                  <div className="mt-3 max-h-[34rem] space-y-2 overflow-y-auto">
                    {filteredQuestions.map((question, index) => (
                      <button key={question.id} type="button" onClick={() => selectQuestion(question)} aria-current={currentQuestion?.id === question.id ? 'true' : undefined} className={`w-full rounded-xl border p-3 text-left transition ${currentQuestion?.id === question.id ? 'border-brand-500/35 bg-brand-500/10' : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'}`}>
                        <span className="flex items-center justify-between gap-2"><span className="text-[10px] font-semibold uppercase tracking-wider text-brand-300">{CATEGORY_LABELS[question.category]}</span>{feedbackByQuestion[question.id] && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />}</span>
                        <span className="mt-2 block text-xs leading-5 text-slate-300">{question.question}</span>
                        <span className="mt-2 block text-[10px] text-slate-500">Question {index + 1}</span>
                      </button>
                    ))}
                  </div>
                </section>}
                <section className="glass-card p-5" aria-labelledby="practice-areas-heading">
                  <h2 id="practice-areas-heading" className="text-sm font-semibold text-white">Practice next</h2>
                  {preparation.recommendedPracticeAreas.length > 0
                    ? <ul className="mt-3 space-y-3">{preparation.recommendedPracticeAreas.map((item) => <li key={item} className="flex gap-2 text-xs leading-5 text-slate-400"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />{item}</li>)}</ul>
                    : <p className="mt-3 text-xs leading-5 text-slate-500">No specific gaps or open Career Plan actions were found in the available context.</p>}
                </section>
                {mode === 'MOCK' && <section className="glass-card p-5" aria-live="polite">
                  <h2 className="text-sm font-semibold text-white">Mock interview progress</h2>
                  <p className="mt-2 text-2xl font-bold text-brand-200">{completedFeedback.length}<span className="text-sm font-normal text-slate-500"> / {preparation.questions.length} answered</span></p>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${preparation.questions.length ? (completedFeedback.length / preparation.questions.length) * 100 : 0}%` }} /></div>
                </section>}
              </aside>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const FeedbackPanel: React.FC<{ feedback: InterviewAnswerFeedback }> = ({ feedback }) => (
  <section className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/50 p-5" aria-live="polite" aria-label="Answer feedback">
    <h3 className="flex items-center gap-2 text-sm font-semibold text-white"><ClipboardCheck className="h-4 w-4 text-brand-400" /> Practice feedback</h3>
    <div className="mt-4 grid gap-3 sm:grid-cols-3">
      <FeedbackMetric title="Topic terms" value={feedback.topicCoverage.status === 'SOME_TERMS_PRESENT' ? 'Some terms present' : 'No shared terms detected'} detail={feedback.topicCoverage.note} />
      <FeedbackMetric title="Answer detail" value={feedback.clarity.status === 'DETAILED' ? 'Detailed' : 'Brief'} detail={`${feedback.clarity.wordCount} words across ${feedback.clarity.sentenceCount} sentence${feedback.clarity.sentenceCount === 1 ? '' : 's'}.`} />
      <FeedbackMetric title="Structure suggestion" value={feedback.structure.suggestedFormat === 'STAR' ? 'STAR' : 'Point · example · outcome'} detail={feedback.structure.detectedStarElements.length ? `Signals detected: ${feedback.structure.detectedStarElements.join(', ')}.` : 'No STAR signals detected by keyword.'} />
    </div>
    <div className="mt-4 grid gap-4 md:grid-cols-2">
      <FeedbackList title="Strengths observed" items={feedback.strengths} />
      <FeedbackList title="Try next" items={feedback.improvements} />
    </div>
    <p className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs leading-5 text-amber-100">{feedback.technicalValidation}</p>
  </section>
);

const FeedbackMetric: React.FC<{ title: string; value: string; detail: string }> = ({ title, value, detail }) => (
  <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3">
    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{title}</p>
    <p className="mt-1 text-sm font-semibold text-slate-200">{value}</p>
    <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>
  </div>
);

const FeedbackList: React.FC<{ title: string; items: string[] }> = ({ title, items }) => (
  <div>
    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</h4>
    <ul className="mt-2 space-y-2">{items.map((item) => <li key={item} className="flex gap-2 text-xs leading-5 text-slate-400"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand-400" />{item}</li>)}</ul>
  </div>
);

const SummaryList: React.FC<{ title: string; items: string[]; emptyText: string }> = ({ title, items, emptyText }) => (
  <article className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
    <h3 className="text-sm font-semibold text-white">{title}</h3>
    {items.length > 0
      ? <ul className="mt-3 space-y-2">{items.map((item) => <li key={item} className="flex gap-2 text-xs leading-5 text-slate-400"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand-400" />{item}</li>)}</ul>
      : <p className="mt-3 text-xs text-slate-500">{emptyText}</p>}
  </article>
);

export default InterviewPreparationPage;
