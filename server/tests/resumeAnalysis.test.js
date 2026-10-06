import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { analyzeResumeText } from '../src/services/resumeAnalysisService.js';

describe('evidence-based resume analysis', () => {
  it('extracts profile details and sections only when present and gives an explainable score', () => {
    const result = analyzeResumeText([
      'Asha Kumar',
      'asha@example.com | +91 9876543210',
      'Professional Summary',
      'Backend developer with experience building reliable Java services and APIs for customer-facing products.',
      'Technical Skills',
      'Java, Spring Boot, SQL, Docker, Git',
      'Work Experience',
      'Backend Engineer, Example Co, 2021-2024',
      'Reduced API latency by 35% while developing Java services.',
      'Education',
      'B.Tech Computer Science, Example University',
      'Projects',
      'Inventory API - Built a Spring Boot service for stock management.',
      'Certifications',
      'AWS Certified Developer',
    ].join('\n'), 'backend developer');

    assert.equal(result.detectedName, 'Asha Kumar');
    assert.equal(result.detectedEmail, 'asha@example.com');
    assert.equal(result.detectedPhone, '+91 9876543210');
    assert.match(result.detectedSummary, /Backend developer/);
    assert.deepEqual(result.detectedEducation, ['B.Tech Computer Science, Example University']);
    assert.deepEqual(result.detectedExperience, [
      'Backend Engineer, Example Co, 2021-2024',
      'Reduced API latency by 35% while developing Java services.',
    ]);
    assert.deepEqual(result.detectedProjects, ['Inventory API - Built a Spring Boot service for stock management.']);
    assert.deepEqual(result.detectedCertifications, ['AWS Certified Developer']);
    assert.ok(result.overallScore >= 0 && result.overallScore <= 100);
    assert.equal(result.overallScore, Object.values(result.scoreBreakdown).reduce((sum, score) => sum + score, 0));
    assert.ok(result.skillCategories.some(({ category }) => category === 'Backend'));
    assert.deepEqual(result.atsAnalysis.contactInformation, {
      emailPresent: true,
      phonePresent: true,
      complete: true,
    });
    assert.equal(result.atsAnalysis.score, result.overallScore);
    assert.deepEqual(result.atsAnalysis.scoreBreakdown, result.scoreBreakdown);
    assert.equal(result.atsAnalysis.actionVerbs.detected, true);
    assert.ok(result.atsAnalysis.actionVerbs.matches.includes('reduced'));
    assert.equal(result.atsAnalysis.quantifiedAchievements.detected, true);
    assert.ok(result.atsAnalysis.quantifiedAchievements.examples.some((line) => line.includes('35%')));
  });

  it('does not fabricate profile sections when the resume contains only a role and one skill', () => {
    const result = analyzeResumeText('Backend Engineer\nJava');

    assert.equal(result.detectedName, null);
    assert.equal(result.detectedEmail, null);
    assert.equal(result.detectedPhone, null);
    assert.equal(result.detectedSummary, null);
    assert.deepEqual(result.detectedEducation, []);
    assert.deepEqual(result.detectedExperience, []);
    assert.deepEqual(result.detectedProjects, []);
    assert.deepEqual(result.detectedCertifications, []);
    assert.equal(result.overallScore, 4);
    assert.equal(result.atsAnalysis.summaryQuality, 'missing');
    assert.ok(result.missingSections.includes('Education'));
    assert.ok(result.missingSections.includes('Work Experience'));
  });

  it('trims a supplied role and calculates target-role keyword coverage', () => {
    const result = analyzeResumeText(
      'JavaScript React HTML CSS REST API Git',
      '  frontend developer  ',
    );

    assert.equal(result.overallScore, 19);
    assert.equal(result.targetRole, 'frontend developer');
    assert.equal(result.matchScore, 60);
    assert.deepEqual(result.detectedSkills, ['JavaScript', 'HTML', 'CSS', 'React', 'Git', 'REST API']);
    assert.equal(result.atsAnalysis.keywordCoverage.percentage, 60);
    assert.ok(result.atsAnalysis.keywordCoverage.missing.includes('TypeScript'));
  });

  it('recognizes common skill spelling variations without counting Java inside JavaScript', () => {
    const result = analyzeResumeText('JS React.js Node SpringBoot JavaScript', 'frontend developer');

    assert.deepEqual(result.detectedSkills, ['JavaScript', 'React', 'Node.js', 'Spring Boot']);
    assert.equal(result.atsAnalysis.keywordCoverage.percentage, 20);
    assert.equal(result.matchScore, 20);
  });

  it('does not assign a role-fit score when none of the expected skills are detected', () => {
    const result = analyzeResumeText('Product designer with typography and layout experience.', 'frontend developer');

    assert.equal(result.matchScore, 0);
  });
});