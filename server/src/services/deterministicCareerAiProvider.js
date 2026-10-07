const EMPTY_CONTEXT = {
  careerGoal: null,
  skills: [],
  education: null,
  college: null,
  graduationYear: null,
  bio: null,
  resumeDetectedSkills: [],
  resumeEducation: [],
  resumeExperience: [],
  resumeProjects: [],
  resumeMissingSections: [],
  resumeSuggestions: [],
  resumeTargetRole: null,
  resumeJobFitScore: null,
  resumeJobFitRequiredSkills: [],
  resumeJobFitMatchedSkills: [],
  resumeJobFitMissingSkills: [],
  latestJobTitle: null,
  latestJobCompany: null,
  latestJobDescription: null,
  latestJobOverallScore: null,
  latestJobRequiredSkills: [],
  latestJobPreferredSkills: [],
  latestJobMatchedSkills: [],
  latestJobMissingSkills: [],
  latestJobSkillGaps: [],
  jobMarketStatus: 'unavailable',
  jobMarketTotalMatches: null,
  jobMarketSuitableRoles: [],
  jobMarketCommonSkills: [],
  jobMarketSkillGaps: [],
  activeCareerPlanGoal: null,
  activeCareerPlanItems: [],
};

function safeContext(context) {
  const source = context ?? {};
  const merged = { ...EMPTY_CONTEXT, ...source };
  for (const key of Object.keys(EMPTY_CONTEXT)) {
    if (Array.isArray(EMPTY_CONTEXT[key]) && !Array.isArray(merged[key])) merged[key] = [];
  }
  return merged;
}

function normalize(value) {
  return value == null ? '' : String(value).trim().toLowerCase();
}

function distinct(values) {
  const seen = new Set();
  return values.filter((value) => {
    if (typeof value !== 'string' || value.trim().length === 0 || seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

function mergeDistinct(first = [], second = []) {
  return distinct([...first, ...second]);
}

function mergedSkills(context) {
  const byNormalizedValue = new Map();
  for (const skill of [...(context.skills ?? []), ...(context.resumeDetectedSkills ?? [])]) {
    if (typeof skill === 'string' && skill.trim()) {
      const key = normalize(skill);
      if (!byNormalizedValue.has(key)) byNormalizedValue.set(key, skill.trim());
    }
  }
  return [...byNormalizedValue.values()];
}

function normalizedSkillSet(context) {
  return new Set(mergedSkills(context).map(normalize));
}

function filteredMissingSkills(skills = [], existingSkills) {
  return distinct(skills
    .filter((skill) => typeof skill === 'string' && skill.trim())
    .filter((skill) => !existingSkills.has(normalize(skill)))
    .map((skill) => skill.trim()));
}

function join(values = []) {
  return values.filter((value) => typeof value === 'string' && value.trim()).join(', ');
}

function joinOrNone(values = []) {
  return values.length === 0 ? 'none recorded' : join(values);
}

function containsAny(value, terms) {
  return terms.some((term) => value.includes(term));
}

function missingInformation(context) {
  const missing = [];
  if (context.careerGoal == null) missing.push('career goal');
  if (mergedSkills(context).length === 0) missing.push('skills');
  if (context.resumeDetectedSkills.length === 0 && context.resumeExperience.length === 0
      && context.resumeProjects.length === 0 && context.resumeMissingSections.length === 0
      && context.resumeSuggestions.length === 0) missing.push('resume analysis');
  if (context.latestJobTitle == null) missing.push('job analysis');
  if (context.jobMarketStatus !== 'available') missing.push('job-market snapshot');
  return missing.length === 0 ? '' : `Available context is missing: ${join(missing)}.`;
}

function withFollowUps(context, answer, suggestions) {
  return {
    answer: `${answer} ${missingInformation(context)}`,
    followUpSuggestions: suggestions,
  };
}

function projectFor(skill) {
  const normalized = normalize(skill);
  if (normalized.includes('java') || normalized.includes('spring')) {
    return `Build a Spring Boot REST API project that demonstrates ${skill}.`;
  }
  if (normalized.includes('react')) return `Build a React or full-stack dashboard that demonstrates ${skill}.`;
  if (['sql', 'database', 'mysql', 'postgres'].some((term) => normalized.includes(term))) {
    return `Build a database management application that demonstrates ${skill}.`;
  }
  if (['ai', 'machine learning', 'ml'].some((term) => normalized.includes(term))) {
    return `Build a small machine-learning or AI application that demonstrates ${skill}.`;
  }
  if (['devops', 'docker', 'ci/cd', 'kubernetes'].some((term) => normalized.includes(term))) {
    return `Build a Docker and CI/CD project that demonstrates ${skill}.`;
  }
  return `Build a focused portfolio project that demonstrates ${skill} in a truthful, measurable way.`;
}

function projectCategory(skills, projectText = '') {
  const value = normalize([...skills, projectText].join(' '));
  if (containsAny(value, ['machine learning', 'artificial intelligence', ' ai ', ' ml ', 'llm', 'nlp'])) return 'AI_ML';
  if (containsAny(value, ['data', 'analytics', 'power bi', 'tableau', 'warehouse', 'etl'])) return 'DATA';
  if (containsAny(value, ['docker', 'kubernetes', 'devops', 'ci/cd', 'cloud', 'azure', 'aws'])) return 'CLOUD_DEVOPS';
  const backend = containsAny(value, ['backend', 'api', 'java', 'spring', 'node', 'express', 'python', 'django', 'sql', 'database', 'postgres', 'mysql']);
  const frontend = containsAny(value, ['frontend', 'front-end', 'react', 'angular', 'vue', 'javascript', 'typescript', 'html', 'css']);
  if (backend && frontend) return 'FULL_STACK';
  if (backend) return 'BACKEND';
  if (frontend) return 'FRONTEND';
  return 'GENERAL';
}

function projectTitle(category, role, gap, existingProject) {
  if (existingProject) return `Production-ready extension for ${existingProject}`;
  const roleName = role ?? ({
    BACKEND: 'backend development',
    FRONTEND: 'frontend development',
    FULL_STACK: 'full-stack development',
    AI_ML: 'AI and machine learning',
    DATA: 'data development',
    CLOUD_DEVOPS: 'cloud delivery',
    GENERAL: 'your career direction',
  })[category];
  return gap
    ? `Portfolio project applying ${gap} for ${roleName}`
    : `Portfolio project demonstrating ${roleName}`;
}

function projectPhases(category, skills, difficulty) {
  const phases = [
    { name: 'Define the scope', tasks: ['Choose a specific user problem.', 'Write a small set of testable acceptance criteria.'] },
    { name: 'Design the solution', tasks: ['Document the main components and data flow.', 'Record key decisions and assumptions.'] },
    { name: 'Build the core project', tasks: ['Implement a working end-to-end path.', 'Keep the scope aligned with the target role and selected skills.'] },
  ];
  if (['BACKEND', 'FULL_STACK', 'DATA'].includes(category)) {
    phases.push({ name: 'Complete the data and API layer', tasks: ['Define clear request and response contracts.', 'Validate input and handle expected failures.'] });
  }
  phases.push({ name: 'Test and document', tasks: ['Add automated tests for core behavior.', 'Document setup, decisions, limitations, and verifiable results.'] });
  if (skills.some((skill) => containsAny(normalize(skill), ['docker', 'kubernetes', 'cloud', 'azure', 'aws', 'ci/cd']))) {
    phases.push({ name: 'Prepare a deployment', tasks: ['Create a repeatable deployment configuration.', 'Document how to run and verify the deployed project.'] });
  }
  if (difficulty === 'ADVANCED') {
    phases.splice(2, 0, { name: 'Plan reliability', tasks: ['Identify failure cases and operational risks.', 'Define monitoring and recovery expectations.'] });
  }
  return phases;
}

export class DeterministicCareerAiProvider {
  providerName() {
    return 'deterministic';
  }

  answerCareerQuestion(contextInput, question) {
    const context = safeContext(contextInput);
    const value = normalize(question);
    if (containsAny(value, ['job market', 'market trend', 'market demand', 'in demand', 'hiring trend'])) {
      if (context.jobMarketStatus !== 'available') {
        return withFollowUps(context, 'There is no saved job-market snapshot in your current resume analysis, so I cannot report market demand or statistics. Run or refresh Resume Analyzer to see the available dataset snapshot; it does not provide a historical trend by itself.', ['Which skills should I compare with a target role?']);
      }
      const roles = context.jobMarketSuitableRoles
        .map((role) => `${role.title} (${role.jobCount})`).join(', ');
      const skills = context.jobMarketCommonSkills
        .map((skill) => `${skill.skill} (${skill.jobCount})`).join(', ');
      const matches = context.jobMarketTotalMatches == null
        ? 'The saved analysis does not include a total match count.'
        : `The saved analysis matched ${context.jobMarketTotalMatches} postings.`;
      const details = [
        roles ? `Recommended roles in that snapshot: ${roles}.` : '',
        skills ? `Skills appearing in the saved recommendations: ${skills}.` : '',
      ].filter(Boolean).join(' ');
      return withFollowUps(context, `${matches} ${details || 'No role or skill breakdown was saved.'} This is a snapshot from your analysis, not evidence of how demand has changed over time.`, ['Which market-listed skills are not in my profile?', 'What should I learn next?']);
    }
    if (containsAny(value, ['career plan', 'action plan', 'my plan'])) {
      const openItems = context.activeCareerPlanItems.filter((item) => !item.completed);
      if (context.activeCareerPlanItems.length === 0) {
        return withFollowUps(context, 'No active career plan is saved yet. Generate one from the Career Plan page to create trackable next steps.', ['Create a learning roadmap', 'What should I do next?']);
      }
      const goal = context.activeCareerPlanGoal ?? context.careerGoal;
      const nextSteps = openItems.slice(0, 4).map((item) => item.title);
      const answer = `Your saved active career plan${goal ? ` for ${goal}` : ''} has ${openItems.length} incomplete item${openItems.length === 1 ? '' : 's'}.${nextSteps.length ? ` Next steps include: ${join(nextSteps)}.` : ' All listed items are marked complete.'}`;
      return withFollowUps(context, answer, ['How do I prepare for an interview?', 'What should I learn next?']);
    }
    if (containsAny(value, ['career goal', 'career path', 'target role', 'goal'])) {
      const answer = context.careerGoal == null
        ? 'No career goal is saved yet. Define a target role or direction so skills, projects, and resume choices can be prioritized.'
        : `Your saved career goal is ${context.careerGoal}. Use it as the filter for choosing skills, projects, and job requirements.${context.activeCareerPlanItems.length ? ` You also have ${context.activeCareerPlanItems.filter((item) => !item.completed).length} incomplete items in your active career plan.` : ''}`;
      return withFollowUps(context, answer, ['Which skills support this goal?', 'What should I do next?']);
    }
    if ((/\b(missing|gap|gaps|lack|shortfall)\b/.test(value) && /\b(skill|skills|technology|technologies)\b/.test(value))
        || containsAny(value, ['should i learn', 'what should i learn', 'learn next'])) {
      const gaps = filteredMissingSkills(context.latestJobMissingSkills, normalizedSkillSet(context));
      const resumeGaps = filteredMissingSkills(context.resumeJobFitMissingSkills, normalizedSkillSet(context));
      const allGaps = mergeDistinct(gaps, resumeGaps);
      if (allGaps.length > 0) {
        const role = context.latestJobTitle ?? context.resumeTargetRole;
        const roleContext = role ? ` for ${role}` : '';
        return withFollowUps(context, `Your saved job-fit analysis${roleContext} identifies these skill gaps not listed in your profile or resume: ${join(allGaps)}. Start with required skills from the job analysis, then verify progress with a project or practice evidence.`, ['Which gap should I prioritize?', 'Recommend a project for my top gap.']);
      }
      if (context.latestJobTitle == null && context.resumeTargetRole == null) {
        return withFollowUps(context, 'I cannot identify role-specific missing skills without a saved target-role or job-fit analysis. Your recorded skills are not enough to infer a role’s requirements.', ['Analyze a target job', 'What skills are in my profile?']);
      }
      if (context.jobMarketStatus === 'available' && context.jobMarketSkillGaps.length > 0) {
        return withFollowUps(context, `Your saved market snapshot flags these skills as gaps in recommended postings: ${join(context.jobMarketSkillGaps.map((item) => item.skill))}. These are market signals from the snapshot, not confirmation of your proficiency; compare them with your experience before adding them to a learning plan.`, ['How can I improve my resume?', 'What should I learn next?']);
      }
      if (allGaps.length === 0) {
        return withFollowUps(context, 'No unaddressed job skill gaps are available in the current context. Add a job analysis to receive role-specific gap guidance.', ['How can I improve my resume?']);
      }
    }
    if (containsAny(value, ['skill', 'technology', 'technologies', 'stack'])) {
      const skills = mergedSkills(context);
      const answer = skills.length === 0
        ? 'No structured skills are available yet. Add profile skills or complete a resume analysis to identify your current baseline.'
        : `Your structured skill baseline includes: ${join(skills)}. Prioritize skills that appear in your target job requirements.`;
      return withFollowUps(context, answer, ['Which skills are gaps?', 'How should I present these skills on my resume?']);
    }
    if (containsAny(value, ['resume', 'cv', 'curriculum'])) {
      const answer = context.resumeMissingSections.length === 0 && context.resumeSuggestions.length === 0
        ? 'No saved resume-analysis findings are available to reference, so I cannot identify specific weaknesses yet. Run Resume Analyzer first; until then, keep claims truthful and connect each bullet to evidence.'
        : `Resume focus areas: missing sections ${joinOrNone(context.resumeMissingSections)}; existing suggestions ${joinOrNone(context.resumeSuggestions)}.`;
      return withFollowUps(context, answer, ['Suggest stronger wording', 'What content is missing?']);
    }
    if (containsAny(value, ['project', 'portfolio'])) {
      const answer = context.resumeProjects.length > 0
        ? `The structured context includes these projects: ${join(context.resumeProjects)}. Strengthen them by documenting the problem, your contribution, technologies, and truthful outcomes.`
        : 'No projects are available in the structured context. Build a small project aligned with your career goal and a verified skill gap, then document the work honestly.';
      return withFollowUps(context, answer, ['Which skill gap can my projects address?']);
    }
    if (containsAny(value, ['interview', 'interviewing'])) {
      const role = context.latestJobTitle ?? 'your target role';
      return withFollowUps(context, `For ${role}, prepare technical explanations for these requirements: ${joinOrNone(context.latestJobRequiredSkills)}. Also prepare truthful behavioral examples and project walkthroughs; do not claim experience that is not in your evidence.`, ['Give me a technical practice plan.']);
    }
    if (containsAny(value, ['roadmap', 'learn next', 'learning plan'])) {
      const roadmap = this.generateCareerRoadmap(context);
      return withFollowUps(context, `A deterministic roadmap is organized into: ${roadmap.stages.map((stage) => stage.name).join(', ')}. Start with the short-term actions, then use projects to demonstrate applied skills.`, ['What should I do this week?']);
    }
    if (containsAny(value, ['job match', 'job matching', 'match', 'job requirement', 'position'])) {
      if (context.latestJobTitle == null) {
        const role = context.resumeTargetRole;
        const roleScore = context.resumeJobFitScore;
        if (role && roleScore != null) {
          return withFollowUps(context, `Your latest resume analysis recorded a ${roleScore} match score for ${role}.${context.resumeJobFitMissingSkills.length ? ` It lists these missing skills: ${join(context.resumeJobFitMissingSkills)}.` : ''}`, ['Which skills should I improve?', 'How can I improve my resume?']);
        }
        return withFollowUps(context, 'No saved job-fit analysis is available yet. Analyze a target job to compare its requirements with your structured skills.', ['Which skills should I improve?']);
      }
      const score = context.latestJobOverallScore == null ? 'an unrecorded' : String(context.latestJobOverallScore);
      return withFollowUps(context, `The latest analyzed role is ${context.latestJobTitle} with a recorded match score of ${score}. Review matched skills and close the unaddressed requirements before presenting yourself for the role.`, ['What are my remaining skill gaps?']);
    }
    return withFollowUps(context, 'I can help with your resume, job fit, skills, career direction, interview preparation, projects, learning roadmap, and saved job-market insights. Ask about one of these areas and I will use the information available in your JOBFIT AI account.', ['What skills am I missing for my target role?', 'How can I improve my resume?', 'What should I learn next?']);
  }

  generateActionPlan(contextInput) {
    const context = safeContext(contextInput);
    const existing = normalizedSkillSet(context);
    let gaps = filteredMissingSkills(context.latestJobRequiredSkills, existing);
    gaps = mergeDistinct(gaps, filteredMissingSkills(context.latestJobPreferredSkills, existing));
    const actions = [];
    if (gaps.length) actions.push(`Prioritize practice for these role-relevant skill gaps: ${join(gaps)}.`);
    if (context.resumeMissingSections.length) actions.push(`Address the structured resume gaps: ${join(context.resumeMissingSections)}.`);
    if (context.resumeProjects.length === 0) actions.push('Build one small project aligned with your career direction and document the decisions and truthful outcome.');
    if (actions.length === 0) {
      actions.push('Confirm your target role and choose one measurable skill or outcome to improve this week.');
      actions.push('Document evidence of your current skills through a truthful project, resume entry, or work example.');
    }
    return { actions: distinct(actions) };
  }

  improveResume(contextInput) {
    const context = safeContext(contextInput);
    const weakAreas = [];
    const missingContent = [];
    const wordingSuggestions = [];
    if (context.resumeMissingSections.length === 0 && context.resumeExperience.length === 0
        && context.resumeProjects.length === 0 && context.resumeDetectedSkills.length === 0) {
      weakAreas.push('No structured resume analysis is available yet.');
      missingContent.push('Provide a resume analysis before tailoring detailed section feedback.');
    }
    for (const section of context.resumeMissingSections) {
      weakAreas.push(`Missing or underrepresented section: ${section}.`);
      missingContent.push(`Add a truthful ${section} section where it reflects your background.`);
    }
    if (context.resumeExperience.length === 0) {
      weakAreas.push('Experience evidence is limited in the structured resume data.');
      missingContent.push('Add relevant responsibilities, outcomes, or coursework that accurately represent your experience.');
    }
    if (context.resumeProjects.length === 0) {
      weakAreas.push('Project evidence is limited in the structured resume data.');
      missingContent.push('Add one or more truthful projects with the problem, technologies, and outcome.');
    }
    if (context.resumeDetectedSkills.length === 0 && context.skills.length === 0) {
      weakAreas.push('Few skills are available for role alignment.');
      missingContent.push('Add skills that you can genuinely explain and demonstrate.');
    }
    wordingSuggestions.push(...context.resumeSuggestions);
    wordingSuggestions.push('Use precise action verbs such as built, designed, improved, tested, or automated when they accurately describe your work.');
    wordingSuggestions.push('Add measurable impact where you have real evidence, such as time saved, scale handled, defects reduced, or users supported.');
    wordingSuggestions.push('Treat suggested wording as a template and verify every claim against your actual experience.');
    if (context.careerGoal != null) wordingSuggestions.push(`Prioritize wording and evidence that support the career goal: ${context.careerGoal}.`);
    return {
      weakAreas: distinct(weakAreas),
      missingContent: distinct(missingContent),
      strongerWordingSuggestions: distinct(wordingSuggestions),
    };
  }

  generateCareerRoadmap(contextInput) {
    const context = safeContext(contextInput);
    const existing = normalizedSkillSet(context);
    let requiredGaps = filteredMissingSkills(context.latestJobRequiredSkills, existing);
    const preferredGaps = filteredMissingSkills(context.latestJobPreferredSkills, existing);
    if (requiredGaps.length === 0 && preferredGaps.length === 0) {
      requiredGaps = filteredMissingSkills(context.latestJobMissingSkills, existing);
    }

    const shortTermActions = [];
    const shortTermSkills = [...requiredGaps];
    if (requiredGaps.length) shortTermActions.push(`Build foundational competence in the required gaps: ${join(requiredGaps)}.`);
    if (context.resumeMissingSections.length) shortTermActions.push(`Address resume gaps: ${join(context.resumeMissingSections)}.`);
    if (shortTermActions.length === 0) shortTermActions.push('Confirm your career goal and document the skills and evidence you already have.');

    const mediumTermActions = [];
    const mediumTermSkills = [...preferredGaps];
    const projectSkills = mergeDistinct(requiredGaps, preferredGaps);
    if (projectSkills.length) {
      for (const skill of projectSkills.slice(0, 3)) mediumTermActions.push(projectFor(skill));
      mediumTermSkills.push(...projectSkills);
    } else if (context.resumeProjects.length === 0) {
      mediumTermActions.push('Build a small portfolio project aligned with the stated career goal and document the decisions made.');
    } else {
      mediumTermActions.push('Extend an existing project with measurable improvements and clear portfolio documentation.');
    }
    if (context.resumeSuggestions.length) mediumTermActions.push('Apply the available resume improvement suggestions after verifying them against your evidence.');

    const longTermActions = ['Review progress against the career goal and refresh the roadmap using new evidence.'];
    if (context.latestJobTitle != null) longTermActions.push(`Reassess readiness for ${context.latestJobTitle} using the next job analysis.`);
    else longTermActions.push('Compare your profile with a target role when a job analysis is available.');
    if (context.latestJobSkillGaps.length) longTermActions.push('Revisit remaining prioritized skill gaps after completing the foundational and project work.');

    const goal = context.careerGoal ?? 'your target career direction';
    return { stages: [
      { name: 'SHORT_TERM', objective: `Establish the foundations for ${goal}.`, actions: distinct(shortTermActions), skills: distinct(shortTermSkills) },
      { name: 'MEDIUM_TERM', objective: `Create evidence of applied ability for ${goal}.`, actions: distinct(mediumTermActions), skills: distinct(mediumTermSkills) },
      { name: 'LONG_TERM', objective: `Sustain progress toward ${goal}.`, actions: distinct(longTermActions), skills: [] },
    ] };
  }

  recommendProjects(contextInput, preferences = {}) {
    const context = safeContext(contextInput);
    const role = context.careerGoal ?? context.resumeTargetRole ?? context.latestJobTitle ?? null;
    const knownSkills = mergedSkills(context);
    const normalizedKnownSkills = new Set(knownSkills.map(normalize));
    const gapSources = [
      [context.latestJobMissingSkills, 'Job Intelligence'],
      [context.resumeJobFitMissingSkills, 'Resume Analyzer job fit'],
      [context.latestJobSkillGaps.map((item) => item.skill), 'Job Intelligence'],
      [context.jobMarketSkillGaps.map((item) => item.skill), 'saved job-market snapshot'],
    ];
    const gapsByValue = new Map();
    for (const [values, source] of gapSources) {
      for (const skill of distinct(values)) {
        const key = normalize(skill);
        if (!key) continue;
        const entry = gapsByValue.get(key) ?? { skill, sources: [] };
        if (!entry.sources.includes(source)) entry.sources.push(source);
        gapsByValue.set(key, entry);
      }
    }
    let gaps = [...gapsByValue.values()];
    const marketSkills = new Map(context.jobMarketSkillGaps.map(({ skill, jobCount }) => [normalize(skill), { skill, jobCount }]));
    const requiredSkills = distinct([
      ...context.latestJobRequiredSkills,
      ...context.latestJobPreferredSkills,
      ...context.resumeJobFitRequiredSkills,
    ]);
    const priority = (entry) => {
      const key = normalize(entry.skill);
      if (requiredSkills.some((skill) => normalize(skill) === key)) return 0;
      if (entry.sources.includes('Resume Analyzer job fit')) return 1;
      if (entry.sources.includes('Job Intelligence')) return 2;
      return 3;
    };
    gaps.sort((left, right) => priority(left) - priority(right));
    if (preferences.focusSkill) {
      const focus = normalize(preferences.focusSkill);
      gaps = gaps.filter(({ skill }) => normalize(skill) === focus);
    }

    const groups = new Map();
    for (const gap of gaps) {
      const category = projectCategory([gap.skill]);
      if (!groups.has(category)) groups.set(category, []);
      groups.get(category).push(gap);
    }
    if (groups.size === 0) {
      for (const skill of knownSkills) {
        const category = projectCategory([skill]);
        if (!groups.has(category)) groups.set(category, []);
      }
    }
    if (groups.size === 0 && context.resumeProjects.length > 0) {
      const project = context.resumeProjects[0];
      groups.set(projectCategory([], project), []);
    }
    if (groups.size === 0 && role) groups.set(projectCategory([], role), []);
    if (preferences.category) {
      for (const category of [...groups.keys()]) {
        if (category !== preferences.category) groups.delete(category);
      }
    }

    const recommendations = [];
    for (const [category, categoryGaps] of [...groups.entries()].slice(0, 3)) {
      const focusedGaps = categoryGaps.slice(0, 3).map(({ skill }) => skill);
      const selectedSkills = focusedGaps.length
        ? focusedGaps
        : knownSkills.filter((skill) => projectCategory([skill]) === category).slice(0, 3);
      const existingProject = context.resumeProjects.find((project) => projectCategory([], project) === category)
        ?? (category === 'CLOUD_DEVOPS'
          ? context.resumeProjects.find((project) => /\b(api|service|application)\b/i.test(project)) ?? null
          : null);
      const difficulty = preferences.difficulty
        ?? (context.resumeExperience.length > 0 || context.resumeProjects.length > 0 ? 'INTERMEDIATE' : 'BEGINNER');
      const technologyStack = distinct([
        ...knownSkills.filter((skill) => projectCategory([skill]) === category
          || (existingProject && projectCategory([skill]) !== 'GENERAL')).slice(0, 2),
        ...focusedGaps,
      ]).slice(0, 4);
      const demonstrationSkills = knownSkills
        .filter((skill) => projectCategory([skill]) === category
          || (existingProject && projectCategory([skill]) !== 'GENERAL'))
        .slice(0, 4);
      const title = projectTitle(category, role, focusedGaps[0], existingProject);
      const description = existingProject
        ? `Extend the saved resume project “${existingProject}” with a distinct production-readiness milestone; do not recreate the same project. Focus the extension on ${focusedGaps.length ? join(focusedGaps) : 'testing, reliability, and clear documentation'}.`
        : `Build a scoped, end-to-end project for ${role ?? 'your career direction'}${focusedGaps.length ? ` that applies ${join(focusedGaps)}` : ''}. Document the actual implementation, decisions, tests, and verifiable results.`;
      const outcome = `A working ${difficulty.toLowerCase()}-scope portfolio deliverable with documented implementation, automated tests, and results you can verify.`;
      recommendations.push({
        title,
        description,
        category,
        difficulty,
        skills: distinct([...focusedGaps, ...demonstrationSkills]),
        skillsToDevelop: focusedGaps,
        skillsToDemonstrate: demonstrationSkills,
        technologyStack,
        expectedOutcome: outcome,
        resumeValue: ['Demonstrates implementation through a completed project.', 'Provides a truthful project entry with documented scope and verifiable results.'],
        phases: projectPhases(category, technologyStack, difficulty),
        extendsProjects: existingProject ? [existingProject] : [],
        rationale: focusedGaps.length
          ? `Addresses saved skill gaps: ${join(focusedGaps)}.`
          : 'Builds evidence from skills or projects already present in your saved context.',
      });
    }
    return { recommendations };
  }

  prepareForInterview(contextInput) {
    const context = safeContext(contextInput);
    const role = context.latestJobTitle ?? context.careerGoal ?? context.resumeTargetRole;
    const skills = distinct([...context.latestJobRequiredSkills, ...mergedSkills(context)]);
    const questions = [];
    const addQuestion = (category, question, rationale) => questions.push({ category, question, rationale });

    for (const skill of skills.slice(0, 5)) {
      const source = context.latestJobRequiredSkills.some((item) => normalize(item) === normalize(skill))
        ? 'latest Job Intelligence requirements'
        : 'skills recorded in your profile or resume analysis';
      addQuestion(
        'TECHNICAL',
        `Explain the core concepts of ${skill} and how you would apply them${role ? ` in a ${role} role` : ''}.`,
        `Based on ${skill} listed in your ${source}.`,
      );
    }

    if (role && context.latestJobRequiredSkills.length > 0) {
      addQuestion(
        'ROLE_SPECIFIC',
        `How would you prioritize the required skills for the ${role} role, and what would you clarify before starting the work?`,
        `Based on the target role and requirements saved in your latest Job Intelligence analysis.`,
      );
    }

    for (const experience of context.resumeExperience.slice(0, 2)) {
      addQuestion(
        'RESUME_BASED',
        `Your resume analysis lists “${experience}”. What was your specific contribution, and what did you learn?`,
        'References an experience entry detected in your saved resume analysis.',
      );
    }
    for (const education of context.resumeEducation.slice(0, 2)) {
      addQuestion(
        'RESUME_BASED',
        `Your resume analysis lists “${education}”. How has this education prepared you for the work you want to do?`,
        'References an education entry detected in your saved resume analysis.',
      );
    }

    for (const project of context.resumeProjects.slice(0, 3)) {
      addQuestion(
        'PROJECT_BASED',
        `Your resume analysis lists “${project}”. Explain the problem, your contribution, a technical decision, and the outcome you can verify.`,
        'References a project detected in your saved resume analysis.',
      );
    }

    addQuestion(
      'BEHAVIORAL',
      'Describe a real challenge you faced, the steps you took, and what you learned. Use an example that reflects your actual experience.',
      'General practice prompt; choose an example that is true for you.',
    );
    addQuestion(
      'SITUATIONAL',
      `How would you approach an unfamiliar task${role ? ` in a ${role} role` : ''} when the requirements are unclear?`,
      'General situational practice prompt; no personal experience is assumed.',
    );
    addQuestion(
      'HR',
      role
        ? `What interests you about pursuing a ${role} role?`
        : 'What kind of role and working environment are you looking for?',
      role
        ? 'Uses your saved target role.'
        : 'General HR practice prompt; no target role is saved yet.',
    );

    return {
      technicalTopics: skills.slice(0, 8),
      behavioralQuestions: questions.filter((item) => item.category === 'BEHAVIORAL').map((item) => item.question),
      projectTalkingPoints: context.resumeProjects.slice(0, 3).map((project) => (
        `Prepare to explain your contribution and verifiable outcome for: ${project}.`
      )),
      questions,
    };
  }
}