import React, { useState, useEffect, useRef } from 'react';
import { analyzeJob, getJobHistory, getRecommendedJobs } from '../services/jobIntelligenceService';
import { analyzeResume } from '../services/resumeService';
import type {
  JobAnalysisRequest,
  JobAnalysisResponse,
  JobRecommendation,
  JobRecommendationsResponse,
  ResumeAnalysisResponse,
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
  UploadCloud,
  FileText,
  X,
  MapPin,
  Building2,
  Star,
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

const getSkillOverlap = (resumeSkills: string[], jobSkills: string[]) => {
  const normalizedResumeSkills = new Set(
    resumeSkills.map((skill) => skill.trim().toLocaleLowerCase()),
  );
  return jobSkills.filter((skill) => normalizedResumeSkills.has(skill.trim().toLocaleLowerCase()));
};

const getRecommendationSalary = (job: JobRecommendation) => {
  if (job.salary?.trim()) return job.salary;
  if (job.minimumSalary == null && job.maximumSalary == null) return 'Salary not disclosed';
  const amounts = [job.minimumSalary, job.maximumSalary]
    .filter((amount): amount is number => amount != null)
    .map((amount) => amount.toLocaleString());
  return `${job.currency ? `${job.currency} ` : ''}${amounts.join(' – ')}`;
};

const getRecommendationExperience = (job: JobRecommendation) => {
  if (job.experience?.trim()) return job.experience;
  if (job.minimumExperience == null && job.maximumExperience == null) return 'Not specified';
  const minimum = job.minimumExperience ?? job.maximumExperience;
  const maximum = job.maximumExperience ?? job.minimumExperience;
  return minimum === maximum ? `${minimum} years` : `${minimum}–${maximum} years`;
};

// ── Analysis Result View ──────────────────────────────────────────────────────

const AnalysisResultView: React.FC<{
  result: JobAnalysisResponse;
  resumeAnalysis?: ResumeAnalysisResponse;
  recommendations: JobRecommendationsResponse | null;
  recommendationsLoading: boolean;
  recommendationsError: string | null;
  onRetryRecommendations: () => void;
  onReset: () => void;
}> = ({
  result,
  resumeAnalysis,
  recommendations,
  recommendationsLoading,
  recommendationsError,
  onRetryRecommendations,
  onReset,
}) => {
  const [openQuestionIdx, setOpenQuestionIdx] = useState<number | null>(null);
  const requiredSkills = [...new Set(result.requiredSkills)];
  const preferredSkills = [...new Set(result.preferredSkills)];
  const matchedRequiredSkills = resumeAnalysis
    ? getSkillOverlap(resumeAnalysis.detectedSkills, requiredSkills)
    : [];
  const missingRequiredSkills = requiredSkills.filter((skill) => !matchedRequiredSkills.includes(skill));
  const matchedPreferredSkills = resumeAnalysis
    ? getSkillOverlap(resumeAnalysis.detectedSkills, preferredSkills)
    : [];
  const missingPreferredSkills = preferredSkills.filter(
    (skill) => !matchedPreferredSkills.includes(skill),
  );
  const strongSkills = [...new Set([...matchedRequiredSkills, ...matchedPreferredSkills])];
  const resumeFitScore = requiredSkills.length > 0
    ? Math.round((matchedRequiredSkills.length / requiredSkills.length) * 100)
    : null;

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

      {resumeAnalysis && (
        <section className="glass-card p-6 sm:p-8 border border-brand-500/25 space-y-6" aria-labelledby="resume-fit-heading">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-300">Resume + Job Description</p>
              <h3 id="resume-fit-heading" className="text-xl sm:text-2xl font-bold text-white mt-2">Your Job Fit Score</h3>
              {resumeFitScore === null ? (
                <p className="text-sm text-slate-400 mt-2">
                  No required skills were identified in this job description, so a resume fit score is unavailable.
                </p>
              ) : (
                <>
                  <p className="text-sm text-slate-300 mt-2">
                    {matchedRequiredSkills.length} of {requiredSkills.length} required skills detected in {resumeAnalysis.fileName}.
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Based on exact skill-name overlap between the analyzed resume and job requirements.
                  </p>
                </>
              )}
            </div>
            {resumeFitScore !== null && (
              <div className="shrink-0 text-left sm:text-right">
                <span className="text-4xl font-extrabold" style={{ color: scoreColor(resumeFitScore) }}>
                  {resumeFitScore}%
                </span>
                <div
                  className="mt-2 h-2 w-40 overflow-hidden rounded-full bg-slate-800"
                  role="progressbar"
                  aria-label="Required skills detected in resume"
                  aria-valuenow={resumeFitScore}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div className="h-full rounded-full bg-brand-400" style={{ width: `${resumeFitScore}%` }} />
                </div>
              </div>
            )}
          </div>

          {matchedRequiredSkills.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-slate-200">Matching Skills</h4>
              <div className="flex flex-wrap gap-2">
                {matchedRequiredSkills.map((skill) => <SkillChip key={skill} name={skill} type="matched" />)}
              </div>
            </div>
          )}

          {missingRequiredSkills.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-slate-200">Missing Required Skills</h4>
              <div className="flex flex-wrap gap-2">
                {missingRequiredSkills.map((skill) => <SkillChip key={skill} name={skill} type="missing" />)}
              </div>
            </div>
          )}

          {preferredSkills.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-slate-200">
                Preferred Skills <span className="text-xs font-normal text-slate-500">({matchedPreferredSkills.length} detected)</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {preferredSkills.map((skill) => (
                  <SkillChip
                    key={skill}
                    name={skill}
                    type={matchedPreferredSkills.includes(skill) ? 'matched' : 'preferred'}
                  />
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {resumeAnalysis && (
        <section
          className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5"
          aria-labelledby="skill-gap-insights-heading"
        >
          <div>
            <h3 id="skill-gap-insights-heading" className="text-sm font-bold text-slate-200 uppercase tracking-wide">
              Skill Gap Insights
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Based on the skills detected in your resume and the requirements listed for this job.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="min-w-0 rounded-xl border border-red-500/20 bg-red-500/5 p-4 space-y-3">
              <div>
                <h4 className="text-sm font-semibold text-red-300">High Priority</h4>
                <p className="text-xs text-slate-500 mt-1">Missing required skills</p>
              </div>
              {missingRequiredSkills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {missingRequiredSkills.map((skill) => (
                    <SkillChip key={skill} name={skill} type="missing" />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No required skill gaps detected.</p>
              )}
            </div>

            <div className="min-w-0 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
              <div>
                <h4 className="text-sm font-semibold text-amber-300">Medium Priority</h4>
                <p className="text-xs text-slate-500 mt-1">Missing preferred skills</p>
              </div>
              {missingPreferredSkills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {missingPreferredSkills.map((skill) => (
                    <SkillChip key={skill} name={skill} type="preferred" />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No preferred skill gaps detected.</p>
              )}
            </div>

            <div className="min-w-0 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3">
              <div>
                <h4 className="text-sm font-semibold text-emerald-300">Already Strong</h4>
                <p className="text-xs text-slate-500 mt-1">Required or preferred skills found</p>
              </div>
              {strongSkills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {strongSkills.map((skill) => (
                    <SkillChip key={skill} name={skill} type="matched" />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No matching job skills were detected in this resume.</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4 space-y-1.5">
              <h4 className="text-sm font-semibold text-slate-200">What to improve</h4>
              <p className="text-xs leading-relaxed text-slate-400">
                {missingRequiredSkills.length > 0
                  ? `Build practical experience and resume evidence for the missing required skills: ${missingRequiredSkills.join(', ')}.`
                  : missingPreferredSkills.length > 0
                    ? `Consider building experience and resume evidence for these preferred skills: ${missingPreferredSkills.join(', ')}.`
                    : 'No gaps were identified among the analyzed required and preferred skills.'}
              </p>
            </div>
            <div className="rounded-xl bg-slate-800/50 border border-slate-700/50 p-4 space-y-1.5">
              <h4 className="text-sm font-semibold text-slate-200">Why this matters</h4>
              <p className="text-xs leading-relaxed text-slate-400">
                {missingRequiredSkills.length > 0
                  ? 'Required skills are explicitly listed for this role, so gaps can reduce alignment with its stated needs. A skill not detected in the resume may still be part of your experience; it may simply need to be made explicit.'
                  : 'Required skills are the role’s stated baseline. No missing required skills were detected in this resume analysis.'}
              </p>
            </div>
          </div>
        </section>
      )}

      {resumeAnalysis && (
        <section
          className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5"
          aria-labelledby="recommended-jobs-heading"
        >
          <div>
            <h3 id="recommended-jobs-heading" className="text-sm font-bold text-slate-200 uppercase tracking-wide">
              Recommended Jobs
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Ranked from the job dataset using the skills detected in {resumeAnalysis.fileName}.
            </p>
            {recommendations && (
              <p className="text-xs text-slate-500 mt-1">
                Score: {recommendations.scoreFormula}. Unknown experience or location contributes a neutral 50%.
              </p>
            )}
          </div>

          {recommendationsLoading ? (
            <div role="status" className="flex items-center justify-center gap-3 py-8 text-sm text-slate-400">
              <div className="w-5 h-5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
              Finding jobs that match your resume skills...
            </div>
          ) : recommendationsError ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p role="alert" className="text-sm text-red-300">{recommendationsError}</p>
              <button
                type="button"
                onClick={onRetryRecommendations}
                className="shrink-0 rounded-lg border border-red-400/30 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-500/10"
              >
                Try again
              </button>
            </div>
          ) : recommendations && recommendations.jobs.length > 0 ? (
            <>
              <p className="text-xs text-slate-500">
                Showing {recommendations.jobs.length} of {recommendations.totalMatches.toLocaleString()} matching jobs.
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {recommendations.jobs.map((job) => (
                  <article
                    key={job.jobId}
                    className="min-w-0 rounded-xl border border-slate-700/70 bg-slate-800/40 p-4 sm:p-5 space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="break-words text-base font-bold text-slate-100">{job.title}</h4>
                        {job.companyName && (
                          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                            <Building2 className="w-3.5 h-3.5 shrink-0" />
                            <span className="break-words">{job.companyName}</span>
                          </p>
                        )}
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="text-2xl font-extrabold" style={{ color: scoreColor(job.matchPercentage) }}>
                          {job.matchPercentage}%
                        </span>
                        <p className="text-[10px] uppercase tracking-wide text-slate-500">Job fit</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-400">
                      {job.location && (
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-brand-400" />
                          {job.location}
                        </span>
                      )}
                      <span>{getRecommendationExperience(job)}</span>
                      <span>{getRecommendationSalary(job)}</span>
                      {job.aggregateRating != null && (
                        <span className="inline-flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-amber-400" />
                          {job.aggregateRating.toFixed(1)}
                          {job.reviewsCount != null && job.reviewsCount > 0
                            ? ` (${job.reviewsCount.toLocaleString()} reviews)`
                            : ''}
                        </span>
                      )}
                    </div>

                    {job.jobDescription && (
                      <p className="break-words text-xs leading-relaxed text-slate-400">
                        {job.jobDescription.length > 280
                          ? `${job.jobDescription.slice(0, 280).trimEnd()}…`
                          : job.jobDescription}
                      </p>
                    )}

                    <div className="space-y-3 border-t border-slate-700/70 pt-3">
                      <div>
                        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-300">
                          Matched skills
                        </p>
                        {job.matchedSkills.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {job.matchedSkills.slice(0, 6).map((skill) => (
                              <SkillChip key={skill} name={skill} type="matched" />
                            ))}
                            {job.matchedSkills.length > 6 && (
                              <span className="self-center text-[11px] text-slate-500">
                                +{job.matchedSkills.length - 6} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500">No matching skills listed.</p>
                        )}
                      </div>
                      {job.missingSkills.length > 0 && (
                        <div>
                          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-amber-300">
                            Missing skills
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {job.missingSkills.slice(0, 6).map((skill) => (
                              <SkillChip key={skill} name={skill} type="preferred" />
                            ))}
                            {job.missingSkills.length > 6 && (
                              <span className="self-center text-[11px] text-slate-500">
                                +{job.missingSkills.length - 6} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-slate-700/70 bg-slate-800/30 px-4 py-8 text-center">
              <p className="text-sm font-semibold text-slate-200">No matching jobs found</p>
              <p className="mt-1 text-xs text-slate-400">
                No jobs in the imported dataset matched the skills detected in this resume.
              </p>
            </div>
          )}
        </section>
      )}

      {/* Score Cards */}
      {resumeAnalysis && (
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wide">
          Additional Profile-Based Job Analysis
        </h3>
      )}
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
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wide">
          {resumeAnalysis ? 'Profile Skill Overview' : 'Skill Overview'}
        </h3>
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

// ── Job Fit Input Form ─────────────────────────────────────────────────────────

const JobDescriptionInput: React.FC<{
  onAnalyze: (req: JobAnalysisRequest, resumeFile: File) => void;
  isLoading: boolean;
  error: string | null;
}> = ({ onAnalyze, isLoading, error }) => {
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const charCount = jobDescription.length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeFile) return;
    onAnalyze(
      { jobTitle: jobTitle.trim() || undefined, companyName: companyName.trim() || undefined, jobDescription },
      resumeFile,
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const lowerName = file.name.toLowerCase();
    const validType = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
    ].includes(file.type);
    const validExtension = ['.pdf', '.docx', '.doc', '.txt'].some((extension) => lowerName.endsWith(extension));

    if (!validType && !validExtension) {
      setResumeFile(null);
      setFileError('Choose a PDF, DOCX, DOC, or TXT resume.');
      e.target.value = '';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setResumeFile(null);
      setFileError('The resume must be 10 MB or smaller.');
      e.target.value = '';
      return;
    }

    setResumeFile(file);
    setFileError(null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section className="glass-card p-5 sm:p-6 space-y-5" aria-labelledby="resume-input-title">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-300">
              <FileText className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-300">Step 01</p>
              <h2 id="resume-input-title" className="text-lg font-bold text-white mt-0.5">Your Resume</h2>
              <p className="text-sm text-slate-400 mt-1">
                Upload your latest resume so we can compare your skills and experience with the job.
              </p>
            </div>
          </div>

          <div>
            <label
              htmlFor="job-fit-resume"
              className="flex min-h-36 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-700 bg-slate-950/40 px-4 py-6 text-center transition-colors hover:border-brand-500/60 hover:bg-slate-950/70 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand-400"
            >
              <UploadCloud className="w-6 h-6 text-brand-400" aria-hidden="true" />
              <span className="text-sm font-medium text-slate-200">
                {resumeFile ? resumeFile.name : 'Choose your resume'}
              </span>
              <span className="text-xs text-slate-500">PDF, DOCX, DOC, or TXT · Max 10 MB</span>
              <input
                ref={fileInputRef}
                id="job-fit-resume"
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                onChange={handleFileChange}
                disabled={isLoading}
                required
                className="sr-only"
                aria-describedby={fileError ? 'resume-file-error' : 'resume-file-help'}
              />
            </label>
            <p id="resume-file-help" className="sr-only">Select a PDF, DOCX, DOC, or TXT resume up to 10 MB.</p>
            {fileError && (
              <p id="resume-file-error" role="alert" className="text-xs text-red-300 mt-2">{fileError}</p>
            )}
            {resumeFile && (
              <button
                type="button"
                onClick={() => {
                  setResumeFile(null);
                  setFileError(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium text-slate-400 hover:text-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400"
                disabled={isLoading}
                aria-label="Remove selected resume"
              >
                <X className="w-3.5 h-3.5" aria-hidden="true" />
                Remove resume
              </button>
            )}
          </div>
        </section>

        <section className="glass-card p-5 sm:p-6 space-y-5" aria-labelledby="job-description-title">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-300">
              <Briefcase className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-300">Step 02</p>
              <h2 id="job-description-title" className="text-lg font-bold text-white mt-0.5">Job Description</h2>
              <p className="text-sm text-slate-400 mt-1">
                Paste the complete job description, including responsibilities and requirements.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide" htmlFor="job-description">
                Job Description <span className="text-red-400" aria-hidden="true">*</span>
              </label>
              <span className={`text-xs ${charCount > 18000 ? 'text-red-400' : 'text-slate-500'}`}>
                {charCount.toLocaleString()} / 20,000
              </span>
            </div>
            <textarea
              id="job-description"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              rows={8}
              maxLength={20000}
              required
              minLength={30}
              className="w-full rounded-xl border border-slate-700/70 bg-slate-900 px-4 py-3 text-sm leading-relaxed text-slate-100 placeholder-slate-500 focus:border-brand-500/60 focus:outline-none focus:ring-1 focus:ring-brand-500/30 resize-y"
            />
          </div>

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
                placeholder="e.g. Backend Engineer"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700/70 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-brand-500/60 focus:ring-1 focus:ring-brand-500/30"
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
                placeholder="e.g. Acme"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700/70 text-slate-100 placeholder-slate-600 text-sm focus:outline-none focus:border-brand-500/60 focus:ring-1 focus:ring-brand-500/30"
              />
            </div>
          </div>
        </section>
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <div className="glass-card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-white">Step 03 · Analyze Job Fit</p>
          <p className="text-sm text-slate-400 mt-1">Compare your resume with the requirements of this job.</p>
        </div>
        <button
          id="job-analyze-btn"
          type="submit"
          disabled={isLoading || !resumeFile || charCount < 30}
          className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-300 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              Analyze Job Fit
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </>
          )}
        </button>
      </div>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/30 px-6 py-8 sm:py-10 text-center" aria-label="Job fit analysis preview">
        <div className="mx-auto w-11 h-11 rounded-xl border border-slate-700 bg-slate-900 flex items-center justify-center text-slate-400">
          <Target className="w-5 h-5" aria-hidden="true" />
        </div>
        <h2 className="text-lg font-semibold text-white mt-4">Ready to check your fit?</h2>
        <p className="max-w-xl mx-auto text-sm leading-relaxed text-slate-400 mt-2">
          Upload your resume and paste a job description to see where you match, where you fall short, and what you can improve.
        </p>
      </section>
    </form>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────

export const JobIntelligencePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'analyze' | 'history'>('analyze');
  const [result, setResult] = useState<JobAnalysisResponse | null>(null);
  const [resumeAnalysis, setResumeAnalysis] = useState<ResumeAnalysisResponse | null>(null);
  const [recommendations, setRecommendations] = useState<JobRecommendationsResponse | null>(null);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState<string | null>(null);
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

  const loadRecommendations = async (resumeAnalysisId: string) => {
    setRecommendationsLoading(true);
    setRecommendationsError(null);
    try {
      setRecommendations(await getRecommendedJobs(resumeAnalysisId));
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setRecommendations(null);
      setRecommendationsError(
        axiosErr?.response?.data?.message || 'Could not load recommended jobs. Please try again.',
      );
    } finally {
      setRecommendationsLoading(false);
    }
  };

  const handleAnalyze = async (req: JobAnalysisRequest, resumeFile: File) => {
    setIsLoading(true);
    setError(null);
    setRecommendations(null);
    setRecommendationsError(null);
    try {
      const resumeData = await analyzeResume(resumeFile, req.jobTitle);
      const data = await analyzeJob(req);
      setResumeAnalysis(resumeData);
      setResult(data);
      await loadRecommendations(resumeData.id);
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
    setResumeAnalysis(null);
    setRecommendations(null);
    setRecommendationsError(null);
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
            Job Fit Analyzer
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            See how well your resume matches a specific job before you apply.
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
          <AnalysisResultView
            result={result}
            resumeAnalysis={resumeAnalysis ?? undefined}
            recommendations={recommendations}
            recommendationsLoading={recommendationsLoading}
            recommendationsError={recommendationsError}
            onRetryRecommendations={() => {
              if (resumeAnalysis) void loadRecommendations(resumeAnalysis.id);
            }}
            onReset={() => {
              setResult(null);
              setResumeAnalysis(null);
              setRecommendations(null);
              setRecommendationsError(null);
            }}
          />
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
