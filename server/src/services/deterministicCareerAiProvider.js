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
  latestJobTitle: null,
  latestJobCompany: null,
  latestJobOverallScore: null,
  latestJobRequiredSkills: [],
  latestJobPreferredSkills: [],
  latestJobMatchedSkills: [],
  latestJobMissingSkills: [],
  latestJobSkillGaps: [],
};

function safeContext(context) {
  return context ?? EMPTY_CONTEXT;
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
      && context.resumeProjects.length === 0) missing.push('resume analysis');
  if (context.latestJobTitle == null) missing.push('job analysis');
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

export class DeterministicCareerAiProvider {
  providerName() {
    return 'deterministic';
  }

  answerCareerQuestion(contextInput, question) {
    const context = safeContext(contextInput);
    const value = normalize(question);
    if (containsAny(value, ['career goal', 'career path', 'target role', 'goal'])) {
      const answer = context.careerGoal == null
        ? 'No career goal is saved yet. Define a target role or direction so skills, projects, and resume choices can be prioritized.'
        : `Your saved career goal is ${context.careerGoal}. Use it as the filter for choosing skills, projects, and job requirements.`;
      return withFollowUps(context, answer, ['Which skills support this goal?', 'What should I do next?']);
    }
    if (containsAny(value, ['skill gap', 'skill gaps', 'missing skill', 'should i learn'])) {
      const gaps = filteredMissingSkills(context.latestJobMissingSkills, normalizedSkillSet(context));
      if (gaps.length === 0) {
        return withFollowUps(context, 'No unaddressed job skill gaps are available in the current context. Add a job analysis to receive role-specific gap guidance.', ['How can I improve my resume?']);
      }
      return withFollowUps(context, `The current unaddressed job skill gaps are: ${join(gaps)}. Start with required skills, then validate progress through a practical project.`, ['Which gap should I prioritize?']);
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
        ? 'No specific resume gaps or suggestions are available in the current structured context. Keep claims truthful and connect each bullet to evidence.'
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
        return withFollowUps(context, 'No job analysis is available yet. Analyze a target job to compare its requirements with your structured skills.', ['Which skills should I improve?']);
      }
      const score = context.latestJobOverallScore == null ? 'an unrecorded' : String(context.latestJobOverallScore);
      return withFollowUps(context, `The latest analyzed role is ${context.latestJobTitle} with a recorded match score of ${score}. Review matched skills and close the unaddressed requirements before presenting yourself for the role.`, ['What are my remaining skill gaps?']);
    }
    return {
      answer: `Focus on your stated career goal, strengthen the most relevant skill gaps, and support your profile with truthful resume evidence and practical projects. ${missingInformation(context)}`,
      followUpSuggestions: ['What is my career goal?', 'Which skills should I improve next?', 'How can I improve my resume?'],
    };
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

  recommendProjects(contextInput) {
    const context = safeContext(contextInput);
    const existing = normalizedSkillSet(context);
    let gaps = filteredMissingSkills(context.latestJobRequiredSkills, existing);
    gaps = mergeDistinct(gaps, filteredMissingSkills(context.latestJobPreferredSkills, existing));
    if (gaps.length === 0) gaps = filteredMissingSkills(context.latestJobMissingSkills, existing);
    const recommendations = gaps.slice(0, 3).map((skill) => ({
      title: projectFor(skill),
      description: 'Create a focused, truthful project with documented decisions, implementation details, and measurable outcomes.',
      skills: [skill],
      rationale: 'This project addresses an unaddressed skill in the available job context.',
    }));
    if (recommendations.length === 0) {
      const goal = context.careerGoal ?? 'your target career direction';
      recommendations.push({
        title: `Build a portfolio project aligned with ${goal}.`,
        description: 'Choose a small problem, implement it end to end, and document the problem, your contribution, technologies, and truthful outcome.',
        skills: mergedSkills(context),
        rationale: 'No unaddressed job skills are available, so the recommendation establishes evidence for your career direction.',
      });
    }
    return { recommendations };
  }

  prepareForInterview(contextInput) {
    const context = safeContext(contextInput);
    const role = context.latestJobTitle ?? context.careerGoal ?? 'your target role';
    let technicalTopics = context.latestJobRequiredSkills.length
      ? distinct(context.latestJobRequiredSkills)
      : mergedSkills(context);
    if (technicalTopics.length === 0) technicalTopics = [`Review the fundamentals most relevant to ${role}.`];
    const behavioralQuestions = [
      'Describe a challenging problem you solved and how you approached it.',
      'Tell me about a time you received difficult feedback and what you changed.',
      `Why are you interested in ${role}?`,
    ];
    let projectTalkingPoints = context.resumeProjects
      .filter((project) => typeof project === 'string' && project.trim())
      .map((project) => `Explain the problem, your contribution, technical decisions, and truthful outcome for: ${project}.`);
    if (projectTalkingPoints.length === 0) {
      projectTalkingPoints = ['Prepare one concise project walkthrough covering the problem, your contribution, technical decisions, and outcome.'];
    }
    return { technicalTopics, behavioralQuestions, projectTalkingPoints };
  }
}