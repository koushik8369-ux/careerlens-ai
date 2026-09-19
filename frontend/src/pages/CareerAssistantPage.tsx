import React, { useEffect, useState } from 'react';
import { AlertCircle, Bot, BriefcaseBusiness, FileText, GraduationCap, Loader2, MessageSquarePlus, Route, Sparkles, Target } from 'lucide-react';
import axios from 'axios';
import { CareerChat } from '../components/career/CareerChat';
import { CareerAiToolSection } from '../components/career/CareerAiToolSection';
import {
  createCareerAssistantConversation,
  generateCareerActionPlan,
  generateProjectRecommendations,
  generateSkillRoadmap,
  getCareerAssistantConversations,
  getCareerAssistantMessages,
  prepareForInterview,
  requestResumeImprovement,
  sendCareerAssistantMessage,
} from '../services/careerAssistantService';
import type {
  CareerActionPlanResult,
  CareerAssistantConversation,
  CareerAssistantMessage,
  CareerRoadmapResult,
  InterviewPreparationResult,
  ProjectRecommendationResult,
  ResumeImprovementResult,
} from '../types';

const errorMessage = (error: unknown, fallback: string) => {
  if (!axios.isAxiosError(error)) return fallback;
  if (!error.response) return 'Career Assistant is unavailable. Please check that the backend is running.';
  if (error.response.status === 400) return error.response.data?.message || 'Please enter a valid question.';
  if (error.response.status === 404) return 'That conversation could not be found.';
  return error.response.status >= 500 ? 'Career Assistant is temporarily unavailable. Please try again.' : fallback;
};

export const CareerAssistantPage: React.FC = () => {
  const [conversations, setConversations] = useState<CareerAssistantConversation[]>([]);
  const [selected, setSelected] = useState<CareerAssistantConversation | null>(null);
  const [messages, setMessages] = useState<CareerAssistantMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isImprovementLoading, setIsImprovementLoading] = useState(false);
  const [resumeImprovement, setResumeImprovement] = useState<ResumeImprovementResult | null>(null);
  const [improvementError, setImprovementError] = useState<string | null>(null);
  const [isRoadmapLoading, setIsRoadmapLoading] = useState(false);
  const [roadmap, setRoadmap] = useState<CareerRoadmapResult | null>(null);
  const [roadmapError, setRoadmapError] = useState<string | null>(null);
  const [isProjectsLoading, setIsProjectsLoading] = useState(false);
  const [projects, setProjects] = useState<ProjectRecommendationResult | null>(null);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [isInterviewLoading, setIsInterviewLoading] = useState(false);
  const [interviewPreparation, setInterviewPreparation] = useState<InterviewPreparationResult | null>(null);
  const [interviewError, setInterviewError] = useState<string | null>(null);
  const [isActionPlanLoading, setIsActionPlanLoading] = useState(false);
  const [actionPlan, setActionPlan] = useState<CareerActionPlanResult | null>(null);
  const [actionPlanError, setActionPlanError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getCareerAssistantConversations();
      setConversations(result);
      if (result.length > 0) setSelected((current) => result.find((item) => item.id === current?.id) ?? result[0]);
    } catch (err: unknown) {
      setError(errorMessage(err, 'Unable to load your conversations.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void loadConversations(); }, []);

  useEffect(() => {
    if (!selected) { setMessages([]); return; }
    let mounted = true;
    setIsMessagesLoading(true);
    setError(null);
    getCareerAssistantMessages(selected.id)
      .then((result) => { if (mounted) setMessages(result); })
      .catch((err: unknown) => { if (mounted) setError(errorMessage(err, 'Unable to load messages.')); })
      .finally(() => { if (mounted) setIsMessagesLoading(false); });
    return () => { mounted = false; };
  }, [selected]);

  const handleNewConversation = async () => {
    setError(null);
    try {
      const conversation = await createCareerAssistantConversation();
      setConversations((current) => [conversation, ...current]);
      setSelected(conversation);
    } catch (err: unknown) {
      setError(errorMessage(err, 'Unable to create a new conversation.'));
    }
  };

  const handleSend = async (question: string) => {
    if (!selected) return;
    setIsSending(true);
    setError(null);
    try {
      const assistantMessage = await sendCareerAssistantMessage(selected.id, { question });
      setMessages((current) => [
        ...current,
        { id: Date.now(), role: 'USER', content: question, provider: null, createdAt: new Date().toISOString() },
        assistantMessage,
      ]);
      await loadConversations();
    } catch (err: unknown) {
      setError(errorMessage(err, 'Unable to send your question.'));
    } finally {
      setIsSending(false);
    }
  };

  const handleResumeImprovement = async () => {
    setIsImprovementLoading(true);
    setImprovementError(null);
    try {
      setResumeImprovement(await requestResumeImprovement());
    } catch (err: unknown) {
      setImprovementError(errorMessage(err, 'Unable to generate resume improvement guidance.'));
    } finally {
      setIsImprovementLoading(false);
    }
  };

  const handleRoadmap = async () => {
    setIsRoadmapLoading(true);
    setRoadmapError(null);
    try {
      setRoadmap(await generateSkillRoadmap());
    } catch (err: unknown) {
      setRoadmapError(errorMessage(err, 'Unable to generate your skill roadmap.'));
    } finally {
      setIsRoadmapLoading(false);
    }
  };

  const handleProjects = async () => {
    setIsProjectsLoading(true);
    setProjectsError(null);
    try {
      setProjects(await generateProjectRecommendations());
    } catch (err: unknown) {
      setProjectsError(errorMessage(err, 'Unable to generate project recommendations.'));
    } finally {
      setIsProjectsLoading(false);
    }
  };

  const handleInterviewPreparation = async () => {
    setIsInterviewLoading(true);
    setInterviewError(null);
    try {
      setInterviewPreparation(await prepareForInterview());
    } catch (err: unknown) {
      setInterviewError(errorMessage(err, 'Unable to prepare your interview guidance.'));
    } finally {
      setIsInterviewLoading(false);
    }
  };

  const handleActionPlan = async () => {
    setIsActionPlanLoading(true);
    setActionPlanError(null);
    try {
      setActionPlan(await generateCareerActionPlan());
    } catch (err: unknown) {
      setActionPlanError(errorMessage(err, 'Unable to generate your career action plan.'));
    } finally {
      setIsActionPlanLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3"><Bot className="w-7 h-7 text-brand-400" /> Career Assistant</h1>
          <p className="text-sm text-slate-400 mt-1">Ask focused questions about your career direction and next steps.</p>
        </div>
        <button type="button" onClick={() => void handleNewConversation()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-500 transition">
          <MessageSquarePlus className="w-4 h-4" /> New conversation
        </button>
      </header>
      {error && <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300" role="alert"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />{error}</div>}
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-5 items-start">
        <aside className="glass-card p-3 lg:sticky lg:top-24">
          <h2 className="px-2 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Conversations</h2>
          {isLoading && <Loader2 className="w-5 h-5 text-brand-400 animate-spin m-4" />}
          {!isLoading && conversations.length === 0 && <p className="px-2 py-4 text-sm text-slate-500">No conversations yet.</p>}
          <div className="space-y-1 max-h-64 lg:max-h-[60vh] overflow-y-auto">
            {conversations.map((conversation) => <button key={conversation.id} type="button" onClick={() => setSelected(conversation)} className={`w-full text-left rounded-lg px-3 py-2.5 text-sm transition ${selected?.id === conversation.id ? 'bg-brand-500/15 text-brand-200 border border-brand-500/25' : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200 border border-transparent'}`}><span className="block truncate">{conversation.title}</span><span className="block text-[10px] text-slate-500 mt-1">{new Date(conversation.updatedAt).toLocaleDateString()}</span></button>)}
          </div>
        </aside>
        <CareerChat conversation={selected} messages={messages} isLoading={isMessagesLoading} isSending={isSending} error={null} onSend={handleSend} />
      </div>
      <section className="glass-card p-5 sm:p-6" aria-labelledby="resume-improvement-heading">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <h2 id="resume-improvement-heading" className="flex items-center gap-2 text-lg font-semibold text-white">
              <FileText className="h-5 w-5 text-brand-400" /> Resume Improvement
            </h2>
            <p className="mt-1 text-sm text-slate-400">Get focused guidance from your saved resume and career context.</p>
          </div>
          <button
            type="button"
            onClick={() => void handleResumeImprovement()}
            disabled={isImprovementLoading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isImprovementLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {isImprovementLoading ? 'Analyzing...' : 'Improve my resume'}
          </button>
        </div>
        {improvementError && <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300" role="alert"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{improvementError}</div>}
        {isImprovementLoading && <div className="flex min-h-32 flex-col items-center justify-center gap-2 text-sm text-slate-400"><Loader2 className="h-6 w-6 animate-spin text-brand-400" /><p>Reviewing your saved career context...</p></div>}
        {!isImprovementLoading && !resumeImprovement && !improvementError && <div className="flex min-h-32 flex-col items-center justify-center text-center"><FileText className="mb-2 h-8 w-8 text-slate-500" /><p className="text-sm text-slate-300">No improvement guidance generated yet.</p><p className="mt-1 text-xs text-slate-500">Run the review to identify resume focus areas and stronger wording.</p></div>}
        {!isImprovementLoading && resumeImprovement && <div className="mt-5 grid gap-4 md:grid-cols-3">
          <ImprovementList title="Weak areas" items={resumeImprovement.weakAreas} emptyMessage="No weak areas identified." />
          <ImprovementList title="Missing content" items={resumeImprovement.missingContent} emptyMessage="No missing content identified." />
          <ImprovementList title="Stronger wording suggestions" items={resumeImprovement.strongerWordingSuggestions} emptyMessage="No wording suggestions available." />
        </div>}
      </section>
      <div className="grid gap-6 xl:grid-cols-2">
        <CareerAiToolSection
          title="Skill Roadmap"
          description="Turn your saved career context into staged learning guidance."
          icon={<Route className="h-5 w-5 text-brand-400" />}
          buttonLabel="Generate roadmap"
          loadingLabel="Building roadmap..."
          isLoading={isRoadmapLoading}
          error={roadmapError}
          hasResult={Boolean(roadmap && roadmap.stages.length > 0)}
          emptyMessage="No skill roadmap generated yet."
          onGenerate={() => void handleRoadmap()}
        >
          <div className="grid gap-4">
            {roadmap?.stages.map((stage) => <div key={stage.name} className="rounded-xl border border-slate-800/80 bg-slate-950/30 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-white">{formatLabel(stage.name)}</h3>
                <span className="rounded-full border border-brand-500/25 bg-brand-500/10 px-2.5 py-1 text-xs font-medium text-brand-200">{stage.skills.length > 0 ? `${stage.skills.length} topic${stage.skills.length === 1 ? '' : 's'}` : 'General guidance'}</span>
              </div>
              <p className="mt-2 text-sm text-slate-400">{stage.objective}</p>
              {stage.skills.length > 0 && <TagList items={stage.skills} />}
              <ItemList items={stage.actions} emptyMessage="No actions were provided for this stage." />
            </div>)}
          </div>
        </CareerAiToolSection>

        <CareerAiToolSection
          title="Project Recommendations"
          description="Find practical project ideas that turn skill gaps into evidence."
          icon={<BriefcaseBusiness className="h-5 w-5 text-brand-400" />}
          buttonLabel="Recommend projects"
          loadingLabel="Finding projects..."
          isLoading={isProjectsLoading}
          error={projectsError}
          hasResult={Boolean(projects && projects.recommendations.length > 0)}
          emptyMessage="No project recommendations generated yet."
          onGenerate={() => void handleProjects()}
        >
          <div className="grid gap-4">
            {projects?.recommendations.map((project) => <article key={project.title} className="rounded-xl border border-slate-800/80 bg-slate-950/30 p-4">
              <h3 className="text-sm font-semibold text-white">{project.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">{project.description}</p>
              {project.skills.length > 0 && <TagList items={project.skills} />}
              <p className="mt-3 border-t border-slate-800/70 pt-3 text-xs leading-5 text-slate-500"><span className="font-semibold text-slate-400">Why this helps: </span>{project.rationale}</p>
            </article>)}
          </div>
        </CareerAiToolSection>

        <CareerAiToolSection
          title="Interview Preparation"
          description="Organize technical, behavioral, and project practice from your context."
          icon={<GraduationCap className="h-5 w-5 text-brand-400" />}
          buttonLabel="Prepare for interview"
          loadingLabel="Preparing guidance..."
          isLoading={isInterviewLoading}
          error={interviewError}
          hasResult={Boolean(interviewPreparation && (interviewPreparation.technicalTopics.length > 0 || interviewPreparation.behavioralQuestions.length > 0 || interviewPreparation.projectTalkingPoints.length > 0))}
          emptyMessage="No interview preparation generated yet."
          onGenerate={() => void handleInterviewPreparation()}
        >
          <div className="grid gap-4 md:grid-cols-3">
            <InterviewGroup title="Technical topics" items={interviewPreparation?.technicalTopics ?? []} />
            <InterviewGroup title="Behavioral questions" items={interviewPreparation?.behavioralQuestions ?? []} />
            <InterviewGroup title="Project talking points" items={interviewPreparation?.projectTalkingPoints ?? []} />
          </div>
        </CareerAiToolSection>

        <CareerAiToolSection
          title="Career Action Plan"
          description="Turn your current career context into a short list of practical next actions."
          icon={<Target className="h-5 w-5 text-brand-400" />}
          buttonLabel="Generate action plan"
          loadingLabel="Planning next steps..."
          isLoading={isActionPlanLoading}
          error={actionPlanError}
          hasResult={Boolean(actionPlan && actionPlan.actions.length > 0)}
          emptyMessage="No career action plan generated yet."
          onGenerate={() => void handleActionPlan()}
        >
          <ol className="grid gap-3">
            {actionPlan?.actions.map((action, index) => <li key={`${action}-${index}`} className="flex gap-3 rounded-xl border border-slate-800/80 bg-slate-950/30 p-4"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-xs font-semibold text-brand-200">{index + 1}</span><span className="text-sm leading-6 text-slate-300">{action}</span></li>)}
          </ol>
        </CareerAiToolSection>
      </div>
    </div>
  );
};

interface ImprovementListProps {
  title: string;
  items: string[];
  emptyMessage: string;
}

const ImprovementList: React.FC<ImprovementListProps> = ({ title, items, emptyMessage }) => (
  <div className="rounded-xl border border-slate-800/80 bg-slate-950/30 p-4">
    <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
    {items.length > 0 ? <ul className="mt-3 space-y-2">{items.map((item, index) => <li key={`${title}-${index}`} className="flex gap-2 text-sm leading-6 text-slate-400"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />{item}</li>)}</ul> : <p className="mt-3 text-sm text-slate-500">{emptyMessage}</p>}
  </div>
);

const formatLabel = (value: string) => value.toLowerCase().replace(/(^|_)([a-z])/g, (_, separator: string, letter: string) => `${separator ? ' ' : ''}${letter.toUpperCase()}`);

interface ItemListProps {
  items: string[];
  emptyMessage: string;
}

const ItemList: React.FC<ItemListProps> = ({ items, emptyMessage }) => (
  items.length > 0 ? <ul className="mt-4 space-y-2">{items.map((item, index) => <li key={`${item}-${index}`} className="flex gap-2 text-sm leading-6 text-slate-300"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />{item}</li>)}</ul> : <p className="mt-4 text-sm text-slate-500">{emptyMessage}</p>
);

const TagList: React.FC<{ items: string[] }> = ({ items }) => (
  <div className="mt-3 flex flex-wrap gap-2">{items.map((item) => <span key={item} className="rounded-full border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-xs text-slate-300">{item}</span>)}</div>
);

const InterviewGroup: React.FC<{ title: string; items: string[] }> = ({ title, items }) => (
  <div className="rounded-xl border border-slate-800/80 bg-slate-950/30 p-4">
    <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
    <ItemList items={items} emptyMessage="No items provided." />
  </div>
);

export default CareerAssistantPage;