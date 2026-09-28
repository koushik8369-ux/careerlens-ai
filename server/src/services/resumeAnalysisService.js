import mongoose from 'mongoose';
import ResumeAnalysis from '../models/ResumeAnalysis.js';
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

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractSkills(text) {
  const lowerText = text.toLowerCase();
  return COMMON_SKILLS.filter((skill) => {
    const pattern = new RegExp(`\\b${escapeRegex(skill.toLowerCase())}\\b`);
    return pattern.test(lowerText);
  });
}

function extractEducation(text) {
  const education = [];
  let inEducation = false;

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const lower = trimmed.toLowerCase();

    if (lower.includes('education') || lower.includes('academic background')) {
      inEducation = true;
      continue;
    } else if (inEducation && (lower.includes('experience') || lower.includes('projects') || lower.includes('skills'))) {
      inEducation = false;
    }

    if (inEducation || lower.includes('bachelor') || lower.includes('master') || lower.includes('b.tech')
        || lower.includes('b.s.') || lower.includes('m.s.') || lower.includes('university') || lower.includes('degree')) {
      if (trimmed.length > 5 && trimmed.length < 200 && !education.includes(trimmed)) {
        education.push(trimmed);
      }
    }
  }

  if (education.length === 0) {
    education.push('Bachelor of Science / Technology in Computer Science (Inferred)');
  }
  return [...new Set(education)].slice(0, 5);
}

function extractExperience(text) {
  const experience = [];
  let inExperience = false;

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const lower = trimmed.toLowerCase();

    if (lower.includes('experience') || lower.includes('employment history') || lower.includes('work history')) {
      inExperience = true;
      continue;
    } else if (inExperience && (lower.includes('education') || lower.includes('projects') || lower.includes('skills'))) {
      inExperience = false;
    }

    if (inExperience || lower.includes('developer') || lower.includes('engineer') || lower.includes('intern') || lower.includes('analyst')) {
      if (trimmed.length > 10 && trimmed.length < 250 && !experience.includes(trimmed)) {
        experience.push(trimmed);
      }
    }
  }

  return [...new Set(experience)].slice(0, 6);
}

function extractProjects(text) {
  const projects = [];
  let inProjects = false;

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const lower = trimmed.toLowerCase();

    if (lower.includes('projects') || lower.includes('personal projects') || lower.includes('key projects')) {
      inProjects = true;
      continue;
    } else if (inProjects && (lower.includes('education') || lower.includes('experience') || lower.includes('skills'))) {
      inProjects = false;
    }

    if (inProjects || lower.startsWith('project:') || lower.includes('developed a') || lower.includes('built a')) {
      if (trimmed.length > 10 && trimmed.length < 250 && !projects.includes(trimmed)) {
        projects.push(trimmed);
      }
    }
  }

  return [...new Set(projects)].slice(0, 5);
}

function detectMissingSections(text, education, experience, projects) {
  const lower = text.toLowerCase();
  const missing = [];

  if (!lower.includes('contact') && !lower.includes('phone') && !lower.includes('email') && !lower.includes('@')) {
    missing.push('Contact Information (Email / Phone)');
  }
  if (!lower.includes('summary') && !lower.includes('objective') && !lower.includes('about me')) {
    missing.push('Professional Summary / Objective');
  }
  if (education.length === 0 || (!lower.includes('education') && !lower.includes('university') && !lower.includes('college'))) {
    missing.push('Education Section');
  }
  if (experience.length === 0 || (!lower.includes('experience') && !lower.includes('work history'))) {
    missing.push('Work Experience Section');
  }
  if (!lower.includes('skills') && !lower.includes('technologies') && !lower.includes('technical stack')) {
    missing.push('Dedicated Skills Section');
  }
  if (projects.length === 0 && !lower.includes('projects')) {
    missing.push('Key Projects Section');
  }
  if (!lower.includes('certif') && !lower.includes('license')) {
    missing.push('Certifications / Training');
  }
  return missing;
}

function generateSuggestions(text, skills, missingSections) {
  const suggestions = [];

  if (missingSections.length > 0) {
    suggestions.push(`Add missing sections: ${missingSections.join(', ')} to ensure standard ATS readability.`);
  }
  if (skills.length < 5) {
    suggestions.push(`Include more relevant technical skills and tools (currently detected ${skills.length}).`);
  }
  if (!/^.*\b(quantified|increased|reduced|achieved|improved|managed|led|developed|engineered|scaled)\b.*$/.test(text)) {
    suggestions.push('Use strong action verbs (e.g., Engineered, Spearheaded, Accelerated, Reduced) to detail your impact.');
  }
  if (!/^.*\d+%.*$/.test(text) && !/^.*\$\d+.*$/.test(text)
      && !/^.*\b\d+ (users|clients|projects|team)\b.*$/.test(text)) {
    suggestions.push('Quantify your achievements with concrete metrics (e.g., \'Improved API latency by 45%\', \'Managed 5+ engineers\').');
  }
  if (text.length < 500) {
    suggestions.push('Your resume text appears concise. Ensure you elaborate on key achievements and technical responsibilities.');
  } else if (text.length > 5000) {
    suggestions.push('Your resume text is quite lengthy. Consider condensing content to 1-2 focused pages for maximum recruiter engagement.');
  }
  if (!text.includes('linkedin.com') && !text.includes('github.com')) {
    suggestions.push('Add hyperlinks to your LinkedIn profile and GitHub portfolio in the header.');
  }

  return suggestions;
}

function calculateScore(text, skills, missingSections) {
  let score = 50;
  score += Math.max(0, (7 - missingSections.length) * 4);
  score += Math.min(10, skills.length);
  if (/^.*\d+%.*$/.test(text)) score += 3;
  if (text.includes('github.com') || text.includes('linkedin.com')) score += 3;
  const lower = text.toLowerCase();
  if (lower.includes('built') || lower.includes('designed') || lower.includes('led')) score += 4;
  return Math.min(98, Math.max(35, score));
}

function calculateJobMatch(role, detectedSkills, text) {
  const normalizedRole = role.toLowerCase().trim();
  const targetSkills = ROLE_SKILLS_MAP[normalizedRole]
    ?? ['Java', 'JavaScript', 'Python', 'SQL', 'Git', 'REST API', 'Docker', 'React'];
  const lowerText = text.toLowerCase();
  const matchedCount = targetSkills.filter((skill) => (
    detectedSkills.some((detectedSkill) => detectedSkill.toLowerCase() === skill.toLowerCase())
    || lowerText.includes(skill.toLowerCase())
  )).length;
  const matchPercentage = Math.round((matchedCount / targetSkills.length) * 100);
  return Math.min(95, Math.max(40, matchPercentage + 15));
}

export function analyzeResumeText(text, targetRole) {
  const detectedSkills = extractSkills(text);
  const detectedEducation = extractEducation(text);
  const detectedExperience = extractExperience(text);
  const detectedProjects = extractProjects(text);
  const missingSections = detectMissingSections(
    text,
    detectedEducation,
    detectedExperience,
    detectedProjects,
  );
  const improvementSuggestions = generateSuggestions(text, detectedSkills, missingSections);
  const overallScore = calculateScore(text, detectedSkills, missingSections);
  const normalizedTargetRole = typeof targetRole === 'string' ? targetRole.trim() : '';
  const effectiveTargetRole = normalizedTargetRole || 'General Software Engineer';
  const matchRole = normalizedTargetRole || 'full stack developer';

  return {
    overallScore,
    targetRole: effectiveTargetRole,
    matchScore: calculateJobMatch(matchRole, detectedSkills, text),
    detectedSkills,
    detectedEducation,
    detectedExperience,
    detectedProjects,
    missingSections,
    improvementSuggestions,
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
  return {
    id: id.toString(),
    fileName: analysis.fileName,
    fileType: analysis.fileType ?? null,
    overallScore: analysis.overallScore,
    targetRole: analysis.targetRole ?? null,
    matchScore: analysis.matchScore ?? null,
    detectedSkills: [...(analysis.detectedSkills ?? [])],
    detectedEducation: [...(analysis.detectedEducation ?? [])],
    detectedExperience: [...(analysis.detectedExperience ?? [])],
    detectedProjects: [...(analysis.detectedProjects ?? [])],
    missingSections: [...(analysis.missingSections ?? [])],
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
} = {}) {
  return {
    async analyzeResume(authenticatedUser, file, targetRole) {
      if (targetRole != null && typeof targetRole !== 'string') {
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
      return toResumeAnalysisResponse(saved);
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
      if (!analysis) {
        throw createNotFoundError(id);
      }
      return toResumeAnalysisResponse(analysis);
    },
  };
}