import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { analyzeResumeText } from '../src/services/resumeAnalysisService.js';

describe('deterministic resume analysis parity', () => {
  it('matches the source-derived score, detections, defaults, and ordering for the parser fixture text', () => {
    const result = analyzeResumeText('Backend Engineer\nJava');

    assert.equal(result.overallScore, 51);
    assert.equal(result.targetRole, 'General Software Engineer');
    assert.equal(result.matchScore, 40);
    assert.deepEqual(result.detectedSkills, ['Java']);
    assert.deepEqual(result.detectedEducation, [
      'Bachelor of Science / Technology in Computer Science (Inferred)',
    ]);
    assert.deepEqual(result.detectedExperience, ['Backend Engineer']);
    assert.deepEqual(result.detectedProjects, []);
    assert.deepEqual(result.missingSections, [
      'Contact Information (Email / Phone)',
      'Professional Summary / Objective',
      'Education Section',
      'Work Experience Section',
      'Dedicated Skills Section',
      'Key Projects Section',
      'Certifications / Training',
    ]);
    assert.deepEqual(result.improvementSuggestions, [
      'Add missing sections: Contact Information (Email / Phone), Professional Summary / Objective, Education Section, Work Experience Section, Dedicated Skills Section, Key Projects Section, Certifications / Training to ensure standard ATS readability.',
      'Include more relevant technical skills and tools (currently detected 1).',
      'Use strong action verbs (e.g., Engineered, Spearheaded, Accelerated, Reduced) to detail your impact.',
      'Quantify your achievements with concrete metrics (e.g., \'Improved API latency by 45%\', \'Managed 5+ engineers\').',
      'Your resume text appears concise. Ensure you elaborate on key achievements and technical responsibilities.',
      'Add hyperlinks to your LinkedIn profile and GitHub portfolio in the header.',
    ]);
  });

  it('applies the exact target-role skill list and trims a supplied role', () => {
    const result = analyzeResumeText(
      'JavaScript React HTML CSS REST API Git',
      '  frontend developer  ',
    );

    assert.equal(result.overallScore, 56);
    assert.equal(result.targetRole, 'frontend developer');
    assert.equal(result.matchScore, 75);
    assert.deepEqual(result.detectedSkills, ['JavaScript', 'HTML', 'CSS', 'React', 'Git', 'REST API']);
  });
});