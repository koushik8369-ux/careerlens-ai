import mongoose from 'mongoose';
import ResumeAnalysis from '../models/ResumeAnalysis.js';
import { createJobRecommendationService } from './jobRecommendationService.js';
import { createResumeParserService } from './resumeParserService.js';

const COMMON_SKILLS = [
  'Java', 'Python', 'JavaScript', 'TypeScript', 'C++', 'C#', 'Go', 'Rust', 'Ruby', 'PHP',
  'HTML', 'CSS', 'SQL', 'React', 'React Native', 'Angular', 'Vue.js', 'Node.js', 'Express.js',
  'Spring', 'Spring Boot', 'Django', 'Flask', 'FastAPI', 'Next.js', 'Tailwind CSS', 'Bootstrap',
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch', 'SQLite', 'Oracle',
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Git', 'GitHub', 'GitLab', 'CI/CD',
  'REST API', 'GraphQL', 'Microservices', 'Kafka', 'RabbitMQ', 'Linux', 'Bash',
  'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Scikit-Learn', 'Pandas', 'NumPy',
  'Data Analysis', 'Agile', 'Scrum', 'Jira', 'Unit Testing', 'JUnit', 'Jest', 'Cypress',
];

const ROLE_SKILLS_MAP = {
  'frontend developer': ['JavaScript', 'TypeScript', 'React', 'HTML', 'CSS', 'Tailwind CSS', 'Vue.js', 'Angular', 'REST API', 'Git'],
  'backend developer': ['Java', 'Spring Boot', 'Python', 'Node.js', 'SQL', 'PostgreSQL', 'MySQL', 'REST API', 'Microservices', 'Docker'],
  'full stack developer': ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Java', 'Spring Boot', 'SQL', 'HTML', 'CSS', 'Git', 'Docker', 'REST API'],
  'data scientist': ['Python', 'SQL', 'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Pandas', 'NumPy', 'Data Analysis'],
  'devops engineer': ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Linux', 'Bash', 'Git', 'Terraform', 'Python', 'Microservices'],
};

const SKILL_CATEGORIES = {
  Languages: ['Java', 'Python', 'JavaScript', 'TypeScript', 'C++', 'C#', 'Go', 'Rust', 'Ruby', 'PHP'],
  'Web & UI': ['HTML', 'CSS', 'React', 'React Native', 'Angular', 'Vue.js', 'Next.js', 'Tailwind CSS', 'Bootstrap'],
  Backend: ['Node.js', 'Express.js', 'Spring', 'Spring Boot', 'Django', 'Flask', 'FastAPI', 'REST API', 'GraphQL', 'Microservices'],
  Data: ['SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch', 'SQLite', 'Oracle', 'Pandas', 'NumPy', 'Data Analysis'],
  Cloud: ['AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes'],
  'ML & AI': ['Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Scikit-Learn'],
  'Tools & Practices': ['Git', 'GitHub', 'GitLab', 'CI/CD', 'Linux', 'Bash', 'Agile', 'Scrum', 'Jira', 'Unit Testing', 'JUnit', 'Jest', 'Cypress', 'Kafka', 'RabbitMQ'],
};

const SECTION_HEADINGS = {
  summary: /^(?:professional\s+)?(?:summary|profile|objective|about\s+me)(?:\s*[:\-].*)?$/i,
  skills: /^(?:technical\s+)?(?:skills|technologies|technical\s+stack|core\s+competencies)(?:\s*[:\-].*)?$/i,
  experience: /^(?:work\s+)?(?:experience|employment\s+history|work\s+history|professional\s+experience)(?:\s*[:\-].*)?$/i,
  education: /^(?:education|academic\s+background|qualifications?)(?:\s*[:\-].*)?$/i,
  projects: /^(?:personal\s+|key\s+|academic\s+)?projects(?:\s*[:\-].*)?$/i,
  certifications: /^(?:certifications?|licenses?|training|certifications?\s*(?:and|&)\s*training)(?:\s*[:\-].*)?$/i,
};

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function skillPattern(skill, flags = 'i') {
  const trailingBoundary = /[a-z0-9]$/i.test(skill) ? '\\b' : '(?![a-z0-9])';
  return new RegExp(`\\b${escapeRegex(skill.toLocaleLowerCase())}${trailingBoundary}`, flags);
}

function extractSkills(text) {
  const lowerText = text.toLocaleLowerCase()
    .replace(/\breact\.js\b/g, 'react')
    .replace(/(^|[^a-z0-9.])js\b/g, '$1javascript')
    .replace(/\bnode\b(?!\.js)/g, 'node.js')
    .replace(/\bspringboot\b/g, 'spring boot');
  const skills = COMMON_SKILLS.filter((skill) => (
    skillPattern(skill).test(lowerText)
  ));
  return skills.filter((skill) => !(skill === 'Spring' && skills.includes('Spring Boot')));
}

function splitSections(text) {
  const sections = {};
  let activeSection = null;
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const heading = Object.entries(SECTION_HEADINGS).find(([, pattern]) => pattern.test(trimmed));
    if (heading) {
      activeSection = heading[0];
      sections[activeSection] ??= [];
    } else if (/^[A-Z][A-Z\s/&-]{2,40}$/.test(trimmed)) {
      activeSection = null;
    } else if (activeSection) {
      sections[activeSection].push(trimmed);
    }
  }
  return Object.fromEntries(Object.entries(sections).map(([key, lines]) => [key, lines.join('\n')]));
}

function cleanEntries(section, maxEntries = 8) {
  return [...new Set((section ?? '').split(/\r?\n/)
    .map((line) => line.trim().replace(/^[•\-*]\s*/, ''))
    .filter((line) => line.length > 2 && line.length < 300))].slice(0, maxEntries);
}

function extractEducation(text, sections) {
  const sectionEntries = cleanEntries(sections.education, 6);
  if (sectionEntries.length > 0) return sectionEntries;
  return text.split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 5 && line.length < 200
      && /\b(?:bachelor|master|b\.?tech|b\.?e\.?|m\.?tech|ph\.?d|diploma|university|college|degree)\b/i.test(line))
    .slice(0, 5);
}

function extractExperience(text, sections) {
  const sectionEntries = cleanEntries(sections.experience, 12);
  if (sectionEntries.length > 0) return sectionEntries;
  return text.split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 12 && line.length < 250
      && /\b(?:engineer|developer|analyst|manager|consultant|intern)\b/i.test(line)
      && /\b(?:19|20)\d{2}\b|\b\d+(?:\.\d+)?\s*\+?\s*(?:years?|yrs?)\b/i.test(line))
    .slice(0, 8);
}

function extractProjects(sections) {
  return cleanEntries(sections.projects, 8);
}

function extractCertifications(text, sections) {
  const sectionEntries = cleanEntries(sections.certifications, 8);
  if (sectionEntries.length > 0) return sectionEntries;
  return text.split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 5 && line.length < 200
      && /\b(?:certified|certification|license|licence)\b/i.test(line))
    .slice(0, 6);
}

function extractName(text) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).slice(0, 6);
  for (const line of lines) {
    const labelled = /^name\s*:\s*(.{2,80})$/i.exec(line);
    if (labelled) return labelled[1].trim();
  }
  return lines.find((line) => line.length <= 80
    && /^[\p{L}][\p{L} .'-]{1,70}$/u.test(line)
    && line.split(/\s+/).length >= 2
    && !/\b(?:resume|curriculum vitae|engineer|developer|analyst|manager|linkedin|github|summary|experience|education)\b/i.test(line)) ?? null;
}

function extractContacts(text) {
  const email = text.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i)?.[0] ?? null;
  const phone = text.match(/(?:\+?\d[\d\s().-]{7,}\d)/)?.[0]?.trim() ?? null;
  return { email, phone };
}

function extractSummary(sections, text) {
  const entries = cleanEntries(sections.summary, 8);
  if (entries.length > 0) return entries.join(' ');
  return text.split(/\r?\n/)
    .slice(0, 8)
    .map((line) => line.trim())
    .find((line) => line.split(/\s+/).filter(Boolean).length >= 12
      && !/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(line)
      && !/^(?:name|phone|email)\s*:/i.test(line)) ?? null;
}

function categorizeSkills(skills) {
  return Object.entries(SKILL_CATEGORIES)
    .map(([category, knownSkills]) => ({
      category,
      skills: skills.filter((skill) => knownSkills.includes(skill)),
    }))
    .filter((item) => item.skills.length > 0);
}

function hasQuantifiedImpact(lines) {
  return lines.some((line) => /\b\d+(?:\.\d+)?%|\b\d+\+?\s+(?:users|clients|projects|team members)\b/i.test(line));
}

function findActionVerbs(text) {
  const actionVerbs = [
    'achieved', 'improved', 'increased', 'reduced', 'led', 'built', 'designed',
    'delivered', 'developed', 'engineered', 'managed', 'scaled',
  ];
  return actionVerbs.filter((verb) => new RegExp(`\\b${verb}\\b`, 'i').test(text));
}

function findQuantifiedAchievements(text) {
  return text.split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && hasQuantifiedImpact([line]))
    .slice(0, 10);
}

function calculateScoreBreakdown({
  contacts,
  summary,
  skills,
  targetKeywordPercentage,
  education,
  experience,
  projects,
  certifications,
}) {
  const summaryWords = summary?.split(/\s+/).filter(Boolean).length ?? 0;
  return {
    contactInformation: (contacts.email ? 5 : 0) + (contacts.phone ? 5 : 0),
    summary: summaryWords >= 40 ? 10 : summaryWords >= 15 ? 6 : summaryWords > 0 ? 3 : 0,
    skills: Math.min(15, skills.length * 2),
    targetKeywords: Math.round((targetKeywordPercentage / 100) * 10),
    experience: experience.length === 0 ? 0 : 10 + (hasQuantifiedImpact(experience) ? 10 : 5),
    education: Math.min(10, education.length * 5),
    projects: Math.min(10, projects.length * 5),
    certifications: certifications.length > 0 ? 5 : 0,
    completeness: 0,
  };
}

function calculateScore(input) {
  const breakdown = calculateScoreBreakdown(input);
  const sectionCount = [
    input.contacts.email || input.contacts.phone,
    input.summary,
    input.skills.length > 0,
    input.experience.length > 0,
    input.education.length > 0,
    input.projects.length > 0,
    input.certifications.length > 0,
  ].filter(Boolean).length;
  breakdown.completeness = Math.round((sectionCount / 7) * 10);
  return {
    overallScore: Math.min(100, Object.values(breakdown).reduce((sum, value) => sum + value, 0)),
    scoreBreakdown: breakdown,
  };
}

function analyzeResumeSections({
  text,
  contacts,
  summary,
  skills,
  education,
  experience,
  projects,
  certifications,
  targetSkills,
}) {
  const lowerText = text.toLocaleLowerCase();
  const missingSections = [];
  const weakSections = [];
  if (!contacts.email || !contacts.phone) missingSections.push('Complete contact information');
  if (!summary) missingSections.push('Professional Summary / Objective');
  else if (summary.split(/\s+/).filter(Boolean).length < 15) weakSections.push('Professional Summary (too brief)');
  if (skills.length === 0) missingSections.push('Skills');
  else if (skills.length < 5) weakSections.push('Skills (limited detected skills)');
  if (experience.length === 0) missingSections.push('Work Experience');
  else if (!hasQuantifiedImpact(experience)) weakSections.push('Experience (no quantified impact detected)');
  if (education.length === 0) missingSections.push('Education');
  if (projects.length === 0) missingSections.push('Projects');
  if (certifications.length === 0) weakSections.push('Certifications / Training (none detected)');

  const matchedKeywords = targetSkills.filter((skill) => skills.includes(skill));
  const missingKeywords = targetSkills.filter((skill) => !matchedKeywords.includes(skill));
  const detectedActionVerbs = findActionVerbs(text);
  const quantifiedAchievements = findQuantifiedAchievements(text);
  const contentIssues = [];
  if (text.length < 400) contentIssues.push('Extracted resume text is unusually short; check whether all pages were readable.');
  if (text.length > 10000) contentIssues.push('Resume text is lengthy; consider keeping the resume focused and concise.');
  if (detectedActionVerbs.length === 0) {
    contentIssues.push('Few action verbs were detected in the extracted resume text.');
  }
  if (quantifiedAchievements.length === 0) {
    contentIssues.push('No quantified outcomes were detected in the extracted resume text.');
  }

  return {
    missingSections,
    weakSections,
    contactInformation: {
      emailPresent: Boolean(contacts.email),
      phonePresent: Boolean(contacts.phone),
      complete: Boolean(contacts.email && contacts.phone),
    },
    summaryQuality: !summary ? 'missing'
      : summary.split(/\s+/).filter(Boolean).length < 15 ? 'brief' : 'present',
    keywordCoverage: {
      targetRole: targetSkills,
      matched: matchedKeywords,
      missing: missingKeywords,
      percentage: targetSkills.length === 0 ? 0 : Math.round((matchedKeywords.length / targetSkills.length) * 100),
    },
    actionVerbs: {
      detected: detectedActionVerbs.length > 0,
      matches: detectedActionVerbs,
    },
    quantifiedAchievements: {
      detected: quantifiedAchievements.length > 0,
      examples: quantifiedAchievements,
    },
    contentIssues,
  };
}

function summarizeJobMarket(recommendations) {
  if (recommendations.status === 'unavailable') {
    return {
      status: 'unavailable',
      message: recommendations.message,
      totalMatches: 0,
      suitableRoles: [],
      commonSkills: [],
      skillGaps: [],
      jobs: [],
    };
  }

  const roles = new Map();
  const commonSkills = new Map();
  const skillGaps = new Map();
  for (const job of recommendations.jobs) {
    roles.set(job.title, (roles.get(job.title) ?? 0) + 1);
    for (const skill of [...job.matchedSkills, ...job.missingSkills]) {
      commonSkills.set(skill, (commonSkills.get(skill) ?? 0) + 1);
    }
    for (const skill of job.missingSkills) {
      skillGaps.set(skill, (skillGaps.get(skill) ?? 0) + 1);
    }
  }

  return {
    status: 'available',
    message: null,
    totalMatches: recommendations.totalMatches,
    suitableRoles: [...roles.entries()]
      .map(([title, jobCount]) => ({ title, jobCount }))
      .sort((left, right) => right.jobCount - left.jobCount || left.title.localeCompare(right.title))
      .slice(0, 5),
    commonSkills: [...commonSkills.entries()]
      .map(([skill, jobCount]) => ({ skill, jobCount }))
      .sort((left, right) => right.jobCount - left.jobCount || left.skill.localeCompare(right.skill))
      .slice(0, 10),
    skillGaps: [...skillGaps.entries()]
      .map(([skill, jobCount]) => ({ skill, jobCount }))
      .sort((left, right) => right.jobCount - left.jobCount || left.skill.localeCompare(right.skill))
      .slice(0, 8),
    jobs: recommendations.jobs.slice(0, 8),
  };
}

function generateSuggestions({ missingSections, weakSections, skills, jobMarketInsights }) {
  const suggestions = [];
  if (missingSections.length > 0) suggestions.push(`Add or clarify these sections: ${missingSections.join(', ')}.`);
  if (weakSections.includes('Professional Summary (too brief)')) {
    suggestions.push('Expand the summary with your role, experience, and relevant skills using claims you can support.');
  } else if (missingSections.includes('Professional Summary / Objective')) {
    suggestions.push('Add a concise professional summary tailored to your target role.');
  }
  if (weakSections.includes('Experience (no quantified impact detected)')) {
    suggestions.push('Add measurable outcomes to experience bullets where you can substantiate them.');
  }
  if (skills.length < 5) suggestions.push(`Make relevant skills explicit; ${skills.length} recognized skills were detected.`);
  if (jobMarketInsights.skillGaps.length > 0) {
    suggestions.push(`Consider developing skills commonly listed in matching jobs: ${jobMarketInsights.skillGaps.slice(0, 5).map((gap) => gap.skill).join(', ')}.`);
  }
  const credentialSkills = jobMarketInsights.skillGaps
    .map((gap) => gap.skill)
    .filter((skill) => ['AWS', 'Azure', 'GCP', 'Kubernetes'].includes(skill));
  if (credentialSkills.length > 0) {
    suggestions.push(`If relevant to your goals, consider a recognized certification covering ${credentialSkills.join(', ')} based on skills requested in matching jobs.`);
  }
  return [...new Set(suggestions)];
}

function calculateJobMatch(role, detectedSkills) {
  const normalizedRole = role.toLocaleLowerCase().trim();
  const targetSkills = ROLE_SKILLS_MAP[normalizedRole]
    ?? ROLE_SKILLS_MAP['full stack developer'];
  const detectedSkillSet = new Set(detectedSkills);
  const matchedCount = targetSkills.filter((skill) => detectedSkillSet.has(skill)).length;
  return targetSkills.length === 0 ? 0 : Math.round((matchedCount / targetSkills.length) * 100);
}

export function analyzeResumeText(text, targetRole) {
  const sections = splitSections(text);
  const detectedSkills = extractSkills(text);
  const detectedEducation = extractEducation(text, sections);
  const detectedExperience = extractExperience(text, sections);
  const detectedProjects = extractProjects(sections);
  const detectedCertifications = extractCertifications(text, sections);
  const contacts = extractContacts(text);
  const detectedSummary = extractSummary(sections, text);
  const normalizedTargetRole = typeof targetRole === 'string' ? targetRole.trim() : '';
  const effectiveTargetRole = normalizedTargetRole || 'General Software Engineer';
  const targetSkills = ROLE_SKILLS_MAP[effectiveTargetRole.toLocaleLowerCase()]
    ?? ROLE_SKILLS_MAP['full stack developer'];
  const atsAnalysis = analyzeResumeSections({
    text,
    contacts,
    summary: detectedSummary,
    skills: detectedSkills,
    education: detectedEducation,
    experience: detectedExperience,
    projects: detectedProjects,
    certifications: detectedCertifications,
    targetSkills,
  });
  const scoreInput = {
    contacts,
    summary: detectedSummary,
    skills: detectedSkills,
    targetKeywordPercentage: atsAnalysis.keywordCoverage.percentage,
    education: detectedEducation,
    experience: detectedExperience,
    projects: detectedProjects,
    certifications: detectedCertifications,
  };

  const score = calculateScore(scoreInput);
  atsAnalysis.score = score.overallScore;
  atsAnalysis.scoreBreakdown = score.scoreBreakdown;
  return {
    overallScore: score.overallScore,
    scoreBreakdown: score.scoreBreakdown,
    targetRole: effectiveTargetRole,
    matchScore: calculateJobMatch(normalizedTargetRole || 'full stack developer', detectedSkills),
    detectedName: extractName(text),
    detectedEmail: contacts.email,
    detectedPhone: contacts.phone,
    detectedSummary,
    detectedSkills,
    skillCategories: categorizeSkills(detectedSkills),
    strongSkills: detectedSkills.filter((skill) => (
      (text.match(skillPattern(skill, 'gi')) ?? []).length > 1
    )),
    detectedEducation,
    detectedExperience,
    detectedProjects,
    detectedCertifications,
    missingSections: atsAnalysis.missingSections,
    atsAnalysis,
    jobMarketInsights: {
      status: 'pending',
      message: null,
      totalMatches: 0,
      suitableRoles: [],
      commonSkills: [],
      skillGaps: [],
      jobs: [],
    },
    improvementSuggestions: [],
    rawText: text,
  };
}

function createNotFoundError(id) {
  const error = new Error(`Resume analysis not found with ID: ${id}`);
  error.status = 404;
  return error;
}

function toResumeAnalysisResponse(analysis) {
  const id = analysis._id ?? analysis.id;
  const jobMarketInsights = analysis.jobMarketInsights?.status
    ? analysis.jobMarketInsights
    : {
      status: 'unavailable',
      message: 'Job-market insights are not available for this saved analysis.',
      totalMatches: 0,
      suitableRoles: [],
      commonSkills: [],
      skillGaps: [],
      jobs: [],
    };
  return {
    id: id.toString(),
    fileName: analysis.fileName,
    fileType: analysis.fileType ?? null,
    overallScore: analysis.overallScore,
    scoreBreakdown: { ...(analysis.scoreBreakdown ?? {}) },
    targetRole: analysis.targetRole ?? null,
    matchScore: analysis.matchScore ?? null,
    detectedName: analysis.detectedName ?? null,
    detectedEmail: analysis.detectedEmail ?? null,
    detectedPhone: analysis.detectedPhone ?? null,
    detectedSummary: analysis.detectedSummary ?? null,
    detectedSkills: [...(analysis.detectedSkills ?? [])],
    skillCategories: (analysis.skillCategories ?? []).map((category) => ({
      category: category.category,
      skills: [...category.skills],
    })),
    strongSkills: [...(analysis.strongSkills ?? [])],
    detectedEducation: [...(analysis.detectedEducation ?? [])],
    detectedExperience: [...(analysis.detectedExperience ?? [])],
    detectedProjects: [...(analysis.detectedProjects ?? [])],
    detectedCertifications: [...(analysis.detectedCertifications ?? [])],
    missingSections: [...(analysis.missingSections ?? [])],
    atsAnalysis: analysis.atsAnalysis ?? {},
    jobMarketInsights,
    weakAreas: [...(analysis.weakAreas ?? [])],
    improvementSuggestions: [...(analysis.improvementSuggestions ?? [])],
    createdAt: analysis.createdAt,
  };
}

function invalidTargetRoleError() {
  const error = new Error('Invalid target role.');
  error.status = 400;
  return error;
}

export function createResumeAnalysisService({
  resumeModel = ResumeAnalysis,
  parserService = createResumeParserService(),
  analyzer = analyzeResumeText,
  jobMarketService = createJobRecommendationService({ resumeModel }),
} = {}) {
  return {
    async analyzeResume(authenticatedUser, file, targetRole) {
      if (targetRole != null && (typeof targetRole !== 'string' || targetRole.length > 100)) {
        throw invalidTargetRoleError();
      }

      const parsed = await parserService.extractText(file);
      const result = analyzer(parsed.text, targetRole);
      const saved = await resumeModel.create({
        user: authenticatedUser.id,
        fileName: parsed.fileName,
        fileType: parsed.fileType,
        ...result,
      });
      let jobMarketInsights;
      try {
        const recommendations = await jobMarketService.getRecommendedJobs(authenticatedUser, {
          resumeAnalysisId: String(saved._id ?? saved.id),
          limit: 25,
        });
        jobMarketInsights = summarizeJobMarket(recommendations);
      } catch (error) {
        if (error.status !== 503) throw error;
        jobMarketInsights = summarizeJobMarket({
          status: 'unavailable',
          message: error.message,
        });
      }
      const atsAnalysis = { ...result.atsAnalysis };
      const skillGaps = jobMarketInsights.skillGaps.map((gap) => gap.skill);
      const targetMissingKeywords = atsAnalysis.keywordCoverage.missing;
      atsAnalysis.keywordCoverage = {
        ...atsAnalysis.keywordCoverage,
        jobMarketGaps: skillGaps,
      };
      const improvementSuggestions = generateSuggestions({
        missingSections: atsAnalysis.missingSections,
        weakSections: atsAnalysis.weakSections,
        skills: result.detectedSkills,
        jobMarketInsights,
      });
      const update = {
        jobMarketInsights,
        atsAnalysis,
        improvementSuggestions,
        weakAreas: [...new Set([...targetMissingKeywords, ...skillGaps])],
      };
      await resumeModel.updateOne(
        { _id: saved._id ?? saved.id, user: authenticatedUser.id },
        { $set: update },
      );
      const savedObject = typeof saved.toObject === 'function' ? saved.toObject() : saved;
      return toResumeAnalysisResponse({ ...savedObject, ...update });
    },

    async getHistory(authenticatedUser) {
      const analyses = await resumeModel
        .find({ user: authenticatedUser.id })
        .sort({ createdAt: -1 });
      return analyses.map(toResumeAnalysisResponse);
    },

    async getById(authenticatedUser, id) {
      if (!mongoose.isObjectIdOrHexString(id)) {
        const error = new Error('Invalid resume analysis ID.');
        error.status = 400;
        throw error;
      }

      const analysis = await resumeModel.findOne({
        _id: id,
        user: authenticatedUser.id,
      });
      if (!analysis) throw createNotFoundError(id);
      return toResumeAnalysisResponse(analysis);
    },
  };
}
