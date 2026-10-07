import React from 'react';
import { Link } from 'react-router-dom';
import type { ProjectRecommendation } from '../../types';

interface ProjectRecommendationCardsProps {
  recommendations: ProjectRecommendation[];
}

export const ProjectRecommendationCards: React.FC<ProjectRecommendationCardsProps> = ({ recommendations }) => (
  <div className="grid gap-4">
    {recommendations.map((project) => (
      <article key={project.title} className="rounded-xl border border-slate-800/80 bg-slate-950/30 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-white">{project.title}</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{project.description}</p>
          </div>
          <div className="flex gap-2">
            <span className="rounded-full border border-brand-500/25 bg-brand-500/10 px-2.5 py-1 text-xs font-medium text-brand-200">{formatLabel(project.category)}</span>
            <span className="rounded-full border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-xs font-medium text-slate-300">{formatLabel(project.difficulty)}</span>
          </div>
        </div>

        <p className="mt-4 border-l-2 border-brand-400/60 pl-3 text-sm leading-6 text-slate-300">{project.roleRelevance}</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <DetailList title="Skills to develop" items={project.skillsToDevelop} emptyText="No specific saved skill gap is linked to this idea." />
          <DetailList title="Skills to demonstrate" items={project.skillsToDemonstrate} emptyText="No matching skills are recorded yet." />
          <DetailList title="Suggested technology stack" items={project.technologyStack} emptyText="No stack choice is supported by the available saved context." />
          <DetailList title="Resume value" items={project.resumeValue} emptyText="Document your actual contribution and results as you build." />
        </div>

        <div className="mt-4 rounded-lg border border-slate-800/80 bg-slate-900/50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Expected outcome</p>
          <p className="mt-1 text-sm leading-6 text-slate-300">{project.expectedOutcome}</p>
        </div>
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-slate-200">Build plan</h4>
          <ol className="mt-2 grid gap-2 sm:grid-cols-2">
            {project.phases.map((phase, index) => (
              <li key={`${phase.name}-${index}`} className="rounded-lg border border-slate-800/70 bg-slate-900/40 p-3">
                <p className="text-sm font-medium text-slate-200">{index + 1}. {phase.name}</p>
                <ul className="mt-2 space-y-1">
                  {phase.tasks.map((task, taskIndex) => <li key={`${task}-${taskIndex}`} className="text-xs leading-5 text-slate-400">{task}</li>)}
                </ul>
              </li>
            ))}
          </ol>
        </div>
        {project.marketEvidence.length > 0 && (
          <div className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-200">Saved market snapshot</p>
            <p className="mt-1 text-sm leading-6 text-slate-300">
              {project.marketEvidence.map((item) => `${item.skill}: ${item.jobCount} postings`).join(' · ')}
            </p>
            <p className="mt-1 text-xs text-slate-500">Snapshot counts from your saved Resume Analyzer result; not a live trend.</p>
          </div>
        )}
        {project.extendsProjects.length > 0 && (
          <DetailList title="Builds on saved resume project" items={project.extendsProjects} emptyText="" />
        )}
        {project.careerPlanAlignment.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-400">
            <span>Related Career Plan items:</span>
            {project.careerPlanAlignment.map((item) => (
              <span key={`${item.title}-${item.itemType}`} className="rounded-full border border-slate-700 px-2.5 py-1 text-xs">
                {item.title}{item.completed ? ' · complete' : ''}
              </span>
            ))}
            <Link to="/career-plan" className="font-medium text-brand-300 hover:text-brand-200">Open plan</Link>
          </div>
        )}
        <p className="mt-4 border-t border-slate-800/70 pt-3 text-xs leading-5 text-slate-500">
          <span className="font-semibold text-slate-400">Why recommended: </span>{project.whyRecommended}
        </p>
      </article>
    ))}
  </div>
);

const formatLabel = (value: string) => value.toLowerCase().replace(/(^|_)([a-z])/g, (_, separator: string, letter: string) => `${separator ? ' ' : ''}${letter.toUpperCase()}`);

const DetailList: React.FC<{ title: string; items: string[]; emptyText: string }> = ({ title, items, emptyText }) => (
  <div>
    <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</h4>
    {items.length > 0
      ? <ul className="mt-2 space-y-1">{items.map((item) => <li key={item} className="flex gap-2 text-sm leading-5 text-slate-300"><span className="text-brand-400">•</span>{item}</li>)}</ul>
      : emptyText && <p className="mt-2 text-sm leading-5 text-slate-500">{emptyText}</p>}
  </div>
);
