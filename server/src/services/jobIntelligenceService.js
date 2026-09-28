import mongoose from 'mongoose';
import JobAnalysis from '../models/JobAnalysis.js';
import ResumeAnalysis from '../models/ResumeAnalysis.js';
import User from '../models/User.js';

const DICTIONARY_SKILLS = [
  'Java', 'Python', 'JavaScript', 'TypeScript', 'C++', 'C#', 'Go', 'Rust', 'Ruby', 'PHP',
  'HTML', 'CSS', 'SQL', 'React', 'React Native', 'Angular', 'Vue.js', 'Node.js', 'Express.js',
  'Spring', 'Spring Boot', 'Django', 'Flask', 'FastAPI', 'Next.js', 'Tailwind CSS', 'Bootstrap',
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch', 'SQLite', 'Oracle',
  'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Git', 'GitHub', 'GitLab', 'CI/CD',
  'REST API', 'GraphQL', 'Microservices', 'Kafka', 'RabbitMQ', 'Linux', 'Bash',
  'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Scikit-Learn', 'Pandas', 'NumPy',
  'Data Analysis', 'Agile', 'Scrum', 'Jira', 'Unit Testing', 'JUnit', 'Jest', 'Cypress',
];

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function textValue(value) {
  return value == null ? '' : String(value);
}

function hasPhrase(value, phrase) {
  return value.includes(phrase);
}

function unique(values) {
  return [...new Set(values)];
}

function extractJobTitle(text) {
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length >= 80) continue;
    const lower = trimmed.toLowerCase();
    if (['developer', 'engineer', 'architect', 'analyst', 'manager', 'lead', 'specialist', 'consultant']
      .some((term) => lower.includes(term))) {
      return trimmed.replace(/^(Job Title|Title|Role|Position):?\s*/i, '').trim();
    }
  }
  return 'Software Professional';
}

function extractCompanyName(text) {
  const match = /(?:at|with|join|about)\s+([A-Z][A-Za-z0-9&.\s]{2,30})(?:\s+is|\s+we|\.|\n|,)/i.exec(text);
  return match ? match[1].trim() : 'Hiring Company';
}

function extractRequiredSkills(text) {
  const required = [];
  const lines = text.split(/\r?\n/);
  let inPreferred = false;

  for (const line of lines) {
    const lower = line.trim().toLowerCase();
    if (lower.includes('preferred') || lower.includes('nice to have')
        || lower.includes('plus') || lower.includes('bonus')) {
      inPreferred = true;
      continue;
    }
    if (inPreferred && (lower.includes('responsibilit') || lower.includes('require')
        || lower.includes('qualification') || lower.includes('about us') || lower.includes('benefit'))) {
      inPreferred = false;
    }
    if (!inPreferred) {
      for (const skill of DICTIONARY_SKILLS) {
        if (new RegExp(`\\b${escapeRegex(skill)}\\b`, 'i').test(line) && !required.includes(skill)) {
          required.push(skill);
        }
      }
    }
  }

  let inRequirements = false;
  for (const line of lines) {
    const lower = line.trim().toLowerCase();
    if (lower.includes('require') || lower.includes('must have')
        || lower.includes('qualification') || lower.includes('what you need')) {
      inRequirements = true;
      continue;
    } else if (inRequirements && (lower.includes('preferred') || lower.includes('nice to have')
        || lower.includes('about us') || lower.includes('benefit'))) {
      inRequirements = false;
    }

    if (inRequirements) {
      for (const skill of DICTIONARY_SKILLS) {
        if (lower.includes(skill.toLowerCase()) && !required.includes(skill)) required.push(skill);
      }
    }
  }

  return (required.length ? required : ['Java', 'SQL', 'Git', 'REST API']).slice(0, 10);
}

function extractPreferredSkills(text, alreadyRequired) {
  const preferred = [];
  let inPreferred = false;

  for (const line of text.split(/\r?\n/)) {
    const lower = line.trim().toLowerCase();
    if (lower.includes('preferred') || lower.includes('nice to have')
        || lower.includes('plus') || lower.includes('bonus')) {
      inPreferred = true;
      continue;
    } else if (inPreferred && (lower.includes('responsibilit') || lower.includes('about us') || lower.includes('benefit'))) {
      inPreferred = false;
    }

    if (inPreferred) {
      for (const skill of DICTIONARY_SKILLS) {
        if (lower.includes(skill.toLowerCase()) && !preferred.includes(skill) && !alreadyRequired.includes(skill)) {
          preferred.push(skill);
        }
      }
    }
  }

  if (preferred.length === 0) {
    for (const skill of DICTIONARY_SKILLS) {
      if (new RegExp(`\\b${escapeRegex(skill)}\\b`, 'i').test(text) && !alreadyRequired.includes(skill)) {
        preferred.push(skill);
      }
    }
  }
  return unique(preferred).slice(0, 8);
}

function normalizeSkill(value) {
  return textValue(value).trim().toLowerCase();
}

function isSkillMatched(skill, userSkills) {
  const normalizedSkill = normalizeSkill(skill);
  return userSkills.some((userSkill) => {
    const normalizedUserSkill = normalizeSkill(userSkill);
    return normalizedUserSkill === normalizedSkill
      || normalizedUserSkill.includes(normalizedSkill)
      || normalizedSkill.includes(normalizedUserSkill);
  });
}

function evaluateExperienceMatch(rawJobDescription, graduationYear) {
  const match = /(\d+)\+?\s*(?:years?|yrs?)\s*(?:of)?\s*experience/i.exec(rawJobDescription);
  const requestedYears = match ? Number.parseInt(match[1], 10) || 0 : 0;
  if (requestedYears === 0) return 100;

  const experienceYears = graduationYear == null
    ? 0
    : Math.max(0, new Date().getFullYear() - graduationYear);
  if (experienceYears >= requestedYears) return 100;
  if (experienceYears === 0) return 50;
  return Math.max(40, Math.round((experienceYears / requestedYears) * 100));
}

function createSkillGaps(missingRequiredSkills, missingPreferredSkills) {
  const gaps = missingRequiredSkills.map((skill) => ({
    skill,
    priority: 'HIGH',
    explanation: 'Critical requirement specified in the job posting. Strongly recommended to learn before applying.',
  }));
  gaps.push(...missingPreferredSkills.map((skill) => ({
    skill,
    priority: 'MEDIUM',
    explanation: 'Preferred skill mentioned. Acquiring this will enhance your competitiveness for this role.',
  })));
  if (gaps.length === 0) {
    gaps.push({
      skill: 'None',
      priority: 'LOW',
      explanation: 'Great match! You meet all extracted technical skill requirements for this position.',
    });
  }
  return gaps;
}

function createRecommendations(jobTitle, missingRequiredSkills, missingPreferredSkills) {
  const recommendations = [];
  if (missingRequiredSkills.length > 0) {
    const topSkill = missingRequiredSkills[0];
    recommendations.push({
      category: 'LEARNING',
      title: `Master ${topSkill} Core Concepts`,
      description: `Complete a structured course or hands-on tutorials on ${topSkill} to bridge your top required skill gap.`,
    });
  } else {
    recommendations.push({
      category: 'LEARNING',
      title: `Advanced ${jobTitle} Architecture`,
      description: `Deepen your expertise in cloud-native design, distributed systems, and performance tuning for ${jobTitle} roles.`,
    });
  }

  if (missingRequiredSkills.length > 0 || missingPreferredSkills.length > 0) {
    const combinedSkills = [...missingRequiredSkills, ...missingPreferredSkills].slice(0, 3).join(', ');
    recommendations.push({
      category: 'PROJECT',
      title: `Build a Portfolio Project using ${combinedSkills}`,
      description: `Construct a full-stack or end-to-end application integrating ${combinedSkills} to showcase direct practical competence.`,
    });
  } else {
    recommendations.push({
      category: 'PROJECT',
      title: 'Open Source Contribution',
      description: `Contribute to prominent open-source projects relevant to the ${jobTitle} stack to build high-visibility credentials.`,
    });
  }

  recommendations.push({
    category: 'PREPARATION',
    title: 'Role-Specific Technical & System Interview Practice',
    description: `Practice mock technical interviews focusing on system design, algorithmic efficiency, and live code walkthroughs for ${jobTitle}.`,
  });
  return recommendations;
}

function createInterviewQuestions(jobTitle, companyName, requiredSkills, matchedSkills, missingSkills) {
  const primarySkill = matchedSkills[0] || requiredSkills[0] || 'software engineering';
  const gapSkill = missingSkills[0] || 'distributed systems';
  return [
    {
      question: `Can you walk us through how you handle state management and performance optimization in ${primarySkill}?`,
      category: 'TECHNICAL',
      rationale: 'Evaluates hands-on technical depth and real-world experience with the primary required skill.',
    },
    {
      question: `How would you approach learning or implementing ${gapSkill} in a production environment under tight deadlines?`,
      category: 'TECHNICAL',
      rationale: 'Assesses adaptability, learning speed, and problem-solving capability when facing a skill gap.',
    },
    {
      question: `Describe a time when you had a technical disagreement with a teammate regarding system design for a ${jobTitle} project. How did you reach alignment?`,
      category: 'BEHAVIORAL',
      rationale: 'Tests communication, collaboration, constructive conflict resolution, and teamwork.',
    },
    {
      question: 'Tell me about a high-stress production issue or bug you encountered. What steps did you take to diagnose and permanently resolve it?',
      category: 'BEHAVIORAL',
      rationale: 'Assesses resilience, systematic debugging methodology, and composure under pressure.',
    },
    {
      question: `How would you design a scalable, fault-tolerant system for ${companyName} that processes thousands of concurrent user requests?`,
      category: 'PROJECT',
      rationale: 'Tests architectural thinking, scalability principles, trade-off analysis, and system design capability.',
    },
  ];
}

function mapResponse(analysis) {
  return {
    id: String(analysis._id ?? analysis.id),
    jobTitle: analysis.jobTitle,
    companyName: analysis.companyName,
    rawJobDescription: analysis.rawJobDescription,
    overallMatchScore: analysis.overallMatchScore,
    requiredSkillMatchPercent: analysis.requiredSkillMatchPercent,
    preferredSkillMatchPercent: analysis.preferredSkillMatchPercent,
    requiredSkills: [...analysis.requiredSkills],
    preferredSkills: [...analysis.preferredSkills],
    matchedSkills: [...analysis.matchedSkills],
    missingSkills: [...analysis.missingSkills],
    skillGaps: analysis.skillGaps.map((gap) => ({ ...gap })),
    recommendations: analysis.recommendations.map((recommendation) => ({ ...recommendation })),
    interviewQuestions: analysis.interviewQuestions.map((question) => ({ ...question })),
    createdAt: analysis.createdAt,
  };
}

function notFoundError(id) {
  const error = new Error(`Job analysis record not found with id: ${id}`);
  error.status = 404;
  return error;
}

export function createJobIntelligenceService({
  jobModel = JobAnalysis,
  userModel = User,
  resumeModel = ResumeAnalysis,
} = {}) {
  return {
    async analyzeJob(authenticatedUser, request) {
      const user = await userModel.findById(authenticatedUser.id);
      if (!user) {
        const error = new Error('Authenticated user was not found');
        error.status = 404;
        throw error;
      }
      const rawJobDescription = request.jobDescription;
      const jobTitle = request.jobTitle?.trim() || extractJobTitle(rawJobDescription);
      const companyName = request.companyName?.trim() || extractCompanyName(rawJobDescription);
      const requiredSkills = extractRequiredSkills(rawJobDescription);
      const preferredSkills = extractPreferredSkills(rawJobDescription, requiredSkills);

      const profileSkills = user.profile?.skills ?? [];
      const latestResume = await resumeModel.findOne({ user: authenticatedUser.id })
        .sort({ createdAt: -1 })
        .select('detectedSkills');
      const userSkills = [...profileSkills, ...(latestResume?.detectedSkills ?? [])]
        .filter((skill) => skill != null)
        .sort((left, right) => normalizeSkill(left).localeCompare(normalizeSkill(right)));

      const matchedSkills = [];
      const missingRequiredSkills = [];
      const missingPreferredSkills = [];
      for (const skill of requiredSkills) {
        if (isSkillMatched(skill, userSkills)) matchedSkills.push(skill);
        else missingRequiredSkills.push(skill);
      }
      for (const skill of preferredSkills) {
        if (isSkillMatched(skill, userSkills)) {
          if (!matchedSkills.includes(skill)) matchedSkills.push(skill);
        } else if (!missingPreferredSkills.includes(skill)) {
          missingPreferredSkills.push(skill);
        }
      }

      const missingSkills = [...missingRequiredSkills, ...missingPreferredSkills];
      const requiredSkillMatchPercent = requiredSkills.length === 0
        ? 100
        : Math.round(((requiredSkills.length - missingRequiredSkills.length) / requiredSkills.length) * 100);
      const preferredSkillMatchPercent = preferredSkills.length === 0
        ? 100
        : Math.round(((preferredSkills.length - missingPreferredSkills.length) / preferredSkills.length) * 100);
      const profile = user.profile;
      const experienceMatch = evaluateExperienceMatch(rawJobDescription, profile?.graduationYear);
      const overallMatchScore = Math.min(100, Math.round(
        0.60 * requiredSkillMatchPercent + 0.25 * preferredSkillMatchPercent + 0.15 * experienceMatch,
      ));

      const saved = await jobModel.create({
        user: authenticatedUser.id,
        jobTitle,
        companyName,
        rawJobDescription,
        overallMatchScore,
        requiredSkillMatchPercent,
        preferredSkillMatchPercent,
        requiredSkills,
        preferredSkills,
        matchedSkills,
        missingSkills,
        skillGaps: createSkillGaps(missingRequiredSkills, missingPreferredSkills),
        recommendations: createRecommendations(jobTitle, missingRequiredSkills, missingPreferredSkills),
        interviewQuestions: createInterviewQuestions(jobTitle, companyName, requiredSkills, matchedSkills, missingSkills),
      });
      return mapResponse(saved);
    },

    async getHistory(authenticatedUser) {
      const analyses = await jobModel.find({ user: authenticatedUser.id }).sort({ createdAt: -1 });
      return analyses.map(mapResponse);
    },

    async getById(authenticatedUser, id) {
      if (!mongoose.isObjectIdOrHexString(id)) {
        const error = new Error('Invalid job analysis ID.');
        error.status = 400;
        throw error;
      }
      const analysis = await jobModel.findOne({ _id: id, user: authenticatedUser.id });
      if (!analysis) throw notFoundError(id);
      return mapResponse(analysis);
    },
  };
}