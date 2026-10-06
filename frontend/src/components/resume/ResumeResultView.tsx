import React from 'react';
import type { ResumeAnalysisResponse } from '../../types';
import {
  Award,
  AlertTriangle,
  CheckCircle2,
  Briefcase,
  GraduationCap,
  FolderGit2,
  Sparkles,
  RefreshCw,
  Target,
  FileText,
  Mail,
  Phone,
  BadgeCheck,
  MapPin,
} from 'lucide-react';

interface ResumeResultViewProps {
  analysis: ResumeAnalysisResponse;
  onReset: () => void;
}

export const ResumeResultView: React.FC<ResumeResultViewProps> = ({ analysis, onReset }) => {
  const atsChecks: Array<{ title: string; entries: string[] }> = [
    { title: 'Sections to add', entries: analysis.atsAnalysis?.missingSections ?? [] },
    { title: 'Areas to strengthen', entries: analysis.atsAnalysis?.weakSections ?? [] },
    {
      title: 'Action verbs',
      entries: analysis.atsAnalysis?.actionVerbs?.matches ?? [],
    },
    {
      title: 'Quantified achievements',
      entries: analysis.atsAnalysis?.quantifiedAchievements?.examples ?? [],
    },
    { title: 'Content checks', entries: analysis.atsAnalysis?.contentIssues ?? [] },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (score >= 65) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-red-400 border-red-500/30 bg-red-500/10';
  };

  const getScoreBadgeText = (score: number) => {
    if (score >= 80) return 'Strong Resume';
    if (score >= 65) return 'Moderate Resume';
    return 'Needs Improvement';
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Bar with Score Summary */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 shrink-0">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-100">
                {analysis.fileName}
              </h2>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-300">
                {new Date(analysis.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Target Role: <span className="font-semibold text-slate-200">{analysis.targetRole || 'General Software Engineer'}</span>
            </p>
          </div>
        </div>

        <button
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 transition-all duration-200 shadow-md shrink-0"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Analyze Another Resume</span>
        </button>
      </div>

      {/* Top Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Overall ATS Score Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-brand-400" />
              Resume Score
            </p>
            <div className="flex items-baseline gap-3 mt-2">
              <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-100">
                {analysis.overallScore}
              </span>
              <span className="text-sm text-slate-400 font-medium">/ 100</span>
            </div>
            <div className="mt-3">
              <span className={`inline-block px-3 py-1 rounded-lg text-xs font-semibold border ${getScoreColor(analysis.overallScore)}`}>
                {getScoreBadgeText(analysis.overallScore)}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-1 text-xs text-slate-400">
              {([
                ['Contact information', analysis.scoreBreakdown?.contactInformation],
                ['Summary', analysis.scoreBreakdown?.summary],
                ['Skills', analysis.scoreBreakdown?.skills],
                ['Role keywords', analysis.scoreBreakdown?.targetKeywords],
                ['Experience', analysis.scoreBreakdown?.experience],
                ['Education', analysis.scoreBreakdown?.education],
                ['Projects', analysis.scoreBreakdown?.projects],
                ['Certifications', analysis.scoreBreakdown?.certifications],
                ['Completeness', analysis.scoreBreakdown?.completeness],
              ] as Array<[string, number | undefined]>).map(([label, score]) => (
                <span key={label}>{label}: <strong className="text-slate-200">{score ?? 0}</strong></span>
              ))}
            </div>
          </div>
          <div className="relative w-24 h-24 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-brand-500 transition-all duration-1000 ease-out"
                strokeDasharray={`${analysis.overallScore}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-lg font-bold text-slate-100">{analysis.overallScore}%</span>
          </div>
        </div>

        {/* Target Job Role Match Card */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-purple-400" />
              Role Fit Match
            </p>
            <div className="flex items-baseline gap-3 mt-2">
              <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-purple-300">
                {analysis.matchScore ?? 0}%
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-3">
              Matched against <span className="text-slate-200 font-medium">{analysis.targetRole || 'Software Engineer'}</span>
            </p>
          </div>
          <div className="h-16 w-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
            <Target className="w-8 h-8" />
          </div>
        </div>
      </div>

      {(analysis.detectedName || analysis.detectedEmail || analysis.detectedPhone || analysis.detectedSummary) && (
        <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8">
          <h3 className="text-lg font-bold text-slate-100 mb-4">Profile Information Detected</h3>
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-300">
            {analysis.detectedName && <span className="font-semibold text-slate-100">{analysis.detectedName}</span>}
            {analysis.detectedEmail && <span className="inline-flex items-center gap-2"><Mail className="w-4 h-4 text-brand-400" />{analysis.detectedEmail}</span>}
            {analysis.detectedPhone && <span className="inline-flex items-center gap-2"><Phone className="w-4 h-4 text-brand-400" />{analysis.detectedPhone}</span>}
          </div>
          {analysis.detectedSummary && (
            <p className="mt-4 text-sm leading-relaxed text-slate-300 border-t border-slate-800 pt-4">{analysis.detectedSummary}</p>
          )}
        </section>
      )}

      {/* Detected Skills Section */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-xl">
        <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-brand-400" />
          Detected Technical Skills ({analysis.detectedSkills?.length || 0})
        </h3>
        {analysis.detectedSkills && analysis.detectedSkills.length > 0 ? (
          <div className="flex flex-wrap gap-2.5">
            {analysis.detectedSkills.map((skill, index) => (
              <span
                key={index}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-brand-500/10 border border-brand-500/25 text-brand-300 shadow-sm"
              >
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400 italic">No specific technical skills matched automatically.</p>
        )}
        {analysis.skillCategories?.length > 0 && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {analysis.skillCategories.map(({ category, skills }) => (
              <div key={category} className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
                <h4 className="text-xs font-bold uppercase tracking-wide text-slate-400">{category}</h4>
                <p className="mt-2 text-xs leading-relaxed text-slate-200">{skills.join(', ')}</p>
              </div>
            ))}
          </div>
        )}
        {analysis.strongSkills?.length > 0 && (
          <p className="mt-4 text-xs text-emerald-300">
            Repeatedly mentioned skills: {analysis.strongSkills.join(', ')}
          </p>
        )}
      </div>

      {/* Grid for Education, Experience & Projects */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Education */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl space-y-3">
          <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-indigo-400" />
            Detected Education
          </h4>
          {analysis.detectedEducation && analysis.detectedEducation.length > 0 ? (
            <ul className="space-y-2 text-xs text-slate-300">
              {analysis.detectedEducation.map((edu, i) => (
                <li key={i} className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                  {edu}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500 italic">None detected</p>
          )}
        </div>

        {/* Experience */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl space-y-3">
          <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-emerald-400" />
            Detected Experience
          </h4>
          {analysis.detectedExperience && analysis.detectedExperience.length > 0 ? (
            <ul className="space-y-2 text-xs text-slate-300">
              {analysis.detectedExperience.map((exp, i) => (
                <li key={i} className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                  {exp}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500 italic">None detected</p>
          )}
        </div>

        {/* Projects */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl space-y-3">
          <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <FolderGit2 className="w-4 h-4 text-purple-400" />
            Detected Projects
          </h4>
          {analysis.detectedProjects && analysis.detectedProjects.length > 0 ? (
            <ul className="space-y-2 text-xs text-slate-300">
              {analysis.detectedProjects.map((proj, i) => (
                <li key={i} className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                  {proj}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500 italic">None detected</p>
          )}
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl space-y-3">
          <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <BadgeCheck className="w-4 h-4 text-amber-400" />
            Certifications
          </h4>
          {analysis.detectedCertifications?.length ? (
            <ul className="space-y-2 text-xs text-slate-300">
              {analysis.detectedCertifications.map((certification, index) => (
                <li key={index} className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">{certification}</li>
              ))}
            </ul>
          ) : <p className="text-xs text-slate-500 italic">None detected</p>}
        </div>
      </div>

      {/* Missing Sections Alert */}
      {analysis.missingSections && analysis.missingSections.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 backdrop-blur-xl">
          <h3 className="text-base font-bold text-amber-300 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            Missing or Improvable Resume Sections
          </h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-amber-200/90">
            {analysis.missingSections.map((sec, i) => (
              <li key={i} className="flex items-center gap-2 bg-amber-500/5 p-2 rounded-lg border border-amber-500/10">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                {sec}
              </li>
            ))}
          </ul>
        </div>
      )}

      <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-100">Practical ATS-Style Checks</h3>
            <p className="mt-1 text-xs text-slate-500">Informational checks only; this is not an official ATS score.</p>
          </div>
          <span className="rounded-lg border border-brand-500/20 bg-brand-500/10 px-3 py-1.5 text-sm font-bold text-brand-300">
            Checklist score: {analysis.atsAnalysis?.score ?? analysis.overallScore}/100
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
            <h4 className="text-sm font-semibold text-slate-200">Contact details</h4>
            <p className="mt-2 text-xs text-slate-400">
              Email {analysis.atsAnalysis?.contactInformation?.emailPresent ? 'detected' : 'not detected'} ·
              Phone {analysis.atsAnalysis?.contactInformation?.phonePresent ? 'detected' : 'not detected'}
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
            <h4 className="text-sm font-semibold text-slate-200">Target-role keyword coverage</h4>
            <p className="mt-2 text-xs text-slate-400">{analysis.atsAnalysis?.keywordCoverage?.percentage ?? 0}% matched against the selected role skill list.</p>
            {analysis.atsAnalysis?.keywordCoverage?.missing?.length > 0 && (
              <p className="mt-2 text-xs text-amber-300">Not detected: {analysis.atsAnalysis.keywordCoverage.missing.join(', ')}</p>
            )}
          </div>
          {atsChecks.map(({ title, entries }) => (
            <div key={title} className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
              <h4 className="text-sm font-semibold text-slate-200">{title}</h4>
              {entries.length > 0
                ? <ul className="mt-2 space-y-1 text-xs text-slate-400">{entries.map((entry) => <li key={entry}>{entry}</li>)}</ul>
                : <p className="mt-2 text-xs text-amber-300">{title === 'Action verbs' ? 'No listed action verbs detected' : title === 'Quantified achievements' ? 'No quantified outcomes detected' : 'No gaps detected'}</p>}
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8">
        <h3 className="text-lg font-bold text-slate-100">Job-Market Insights</h3>
        {analysis.jobMarketInsights?.status === 'unavailable' ? (
          <p className="mt-3 text-sm text-amber-300">{analysis.jobMarketInsights.message ?? 'Job-market data is currently unavailable.'}</p>
        ) : analysis.jobMarketInsights?.status !== 'available' ? (
          <p className="mt-3 text-sm text-slate-400">No job-market analysis is available for this saved result.</p>
        ) : (
          <>
            <p className="mt-2 text-sm text-slate-400">
              {analysis.jobMarketInsights.totalMatches.toLocaleString()} dataset jobs matched the detected skills.
            </p>
            {analysis.jobMarketInsights.suitableRoles.length > 0 && (
              <p className="mt-3 text-sm text-slate-300">
                Roles among top job matches: {analysis.jobMarketInsights.suitableRoles.map(({ title, jobCount }) => `${title} (${jobCount})`).join(' · ')}
              </p>
            )}
            {analysis.jobMarketInsights.skillGaps.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-amber-300">Skills frequently requested in recommended jobs but not detected</h4>
                <div className="mt-2 flex flex-wrap gap-2">
                  {analysis.jobMarketInsights.skillGaps.map(({ skill, jobCount }) => (
                    <span key={skill} className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-200">{skill} · {jobCount} jobs</span>
                  ))}
                </div>
              </div>
            )}
            {analysis.jobMarketInsights.commonSkills.length > 0 && (
              <p className="mt-4 text-xs text-slate-400">Frequently listed skills: {analysis.jobMarketInsights.commonSkills.map(({ skill }) => skill).join(', ')}</p>
            )}
            {analysis.jobMarketInsights.jobs.length > 0 && (
              <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-3">
                {analysis.jobMarketInsights.jobs.map((job) => (
                  <article key={job.jobId} className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-semibold text-slate-100">{job.title}</h4>
                        <p className="mt-1 text-xs text-slate-400">{job.companyName ?? 'Company not listed'}{job.location ? ` · ${job.location}` : ''}</p>
                      </div>
                      <span className="shrink-0 rounded-lg bg-brand-500/10 px-2.5 py-1 text-xs font-bold text-brand-300">{job.matchPercentage}% match</span>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      {job.experience ?? 'Experience not listed'}{job.salary ? ` · ${job.salary}` : ''}
                      {job.aggregateRating != null ? ` · ★ ${job.aggregateRating}${job.reviewsCount != null ? ` (${job.reviewsCount})` : ''}` : ''}
                    </p>
                    {job.jobDescription && <p className="mt-3 text-xs leading-relaxed text-slate-400 line-clamp-3">{job.jobDescription}</p>}
                    {job.matchedSkills.length > 0 && <p className="mt-3 text-xs text-emerald-300">Matched: {job.matchedSkills.join(', ')}</p>}
                    {job.missingSkills.length > 0 && <p className="mt-1 text-xs text-amber-300">Gaps: {job.missingSkills.slice(0, 6).join(', ')}</p>}
                    <p className="mt-3 text-xs text-slate-500 inline-flex items-center gap-1"><MapPin className="w-3 h-3" />No application link supplied by dataset</p>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {/* Improvement Suggestions */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-xl">
        <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          Evidence-Based Improvement Recommendations
        </h3>
        <ul className="space-y-3 text-sm text-slate-300">
          {analysis.improvementSuggestions?.map((sug, i) => (
            <li key={i} className="flex items-start gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
              <span className="h-6 w-6 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span className="leading-relaxed">{sug}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
