export const JOB_DATASET_ID = 'indian-job-market-2025-2026';

const SKILL_ALIASES = new Map([
  ['js', 'javascript'],
  ['javascript', 'javascript'],
  ['react', 'react'],
  ['react.js', 'react'],
  ['reactjs', 'react'],
  ['node', 'node.js'],
  ['node.js', 'node.js'],
  ['nodejs', 'node.js'],
  ['springboot', 'spring boot'],
  ['spring boot', 'spring boot'],
  ['rest', 'rest api'],
  ['rest api', 'rest api'],
]);

function textValue(value) {
  if (value == null) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object' && typeof value.text === 'string') return value.text;
  if (Array.isArray(value)) {
    return value.map((item) => (typeof item === 'object' ? item.text ?? '' : item)).join('');
  }
  return String(value);
}

function optionalNumber(value) {
  if (value == null || String(value).trim() === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function normalizeSkill(value) {
  const normalized = textValue(value).trim().toLocaleLowerCase().replace(/\s+/g, ' ');
  return SKILL_ALIASES.get(normalized) ?? normalized;
}

export function parseSkillTags(value) {
  let tags = [];
  if (Array.isArray(value)) {
    tags = value;
  } else if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) tags = parsed;
      } catch {
        tags = [];
      }
    }
    if (tags.length === 0) tags = trimmed.split(/[,;|\r\n]+/);
  }

  const unique = new Map();
  for (const valueItem of tags) {
    const skill = textValue(valueItem).trim().replace(/^["'[\]]+|["'[\]]+$/g, '');
    const normalized = normalizeSkill(skill);
    if (skill && normalized && !unique.has(normalized)) unique.set(normalized, skill);
  }
  return [...unique.values()];
}

export function createJobPosting(sourceRow) {
  const title = textValue(sourceRow.title).trim();
  const jobId = textValue(sourceRow.jobId).trim();
  const skillNames = parseSkillTags(sourceRow.tagsAndSkills);
  if (!title || !jobId || skillNames.length === 0) return null;

  return {
    sourceDataset: JOB_DATASET_ID,
    sourceJobId: jobId,
    jobId,
    title,
    currency: textValue(sourceRow.currency).trim() || null,
    jobUploaded: textValue(sourceRow.jobUploaded).trim() || null,
    companyName: textValue(sourceRow.companyName).trim() || null,
    tagsAndSkills: textValue(sourceRow.tagsAndSkills).trim(),
    skillNames,
    normalizedSkills: [...new Set(skillNames.map(normalizeSkill))],
    experience: textValue(sourceRow.experience).trim() || null,
    salary: textValue(sourceRow.salary).trim() || null,
    location: textValue(sourceRow.location).trim() || null,
    companyId: textValue(sourceRow.companyId).trim() || null,
    reviewsCount: optionalNumber(sourceRow.ReviewsCount),
    aggregateRating: optionalNumber(sourceRow.AggregateRating),
    jobDescription: textValue(sourceRow.jobDescription).trim() || null,
    minimumSalary: optionalNumber(sourceRow.minimumSalary),
    maximumSalary: optionalNumber(sourceRow.maximumSalary),
    minimumExperience: optionalNumber(sourceRow.minimumExperience),
    maximumExperience: optionalNumber(sourceRow.maximumExperience),
  };
}
