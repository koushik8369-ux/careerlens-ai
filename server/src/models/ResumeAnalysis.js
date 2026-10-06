import mongoose from 'mongoose';

const resumeAnalysisSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    select: false,
  },
  fileName: { type: String, required: true },
  fileType: { type: String, default: null },
  overallScore: { type: Number, required: true },
  scoreBreakdown: {
    contactInformation: { type: Number, default: 0 },
    summary: { type: Number, default: 0 },
    skills: { type: Number, default: 0 },
    targetKeywords: { type: Number, default: 0 },
    experience: { type: Number, default: 0 },
    education: { type: Number, default: 0 },
    projects: { type: Number, default: 0 },
    certifications: { type: Number, default: 0 },
    completeness: { type: Number, default: 0 },
  },
  targetRole: { type: String, default: null },
  matchScore: { type: Number, default: null },
  rawText: { type: String, required: true, select: false },
  detectedName: { type: String, default: null },
  detectedEmail: { type: String, default: null },
  detectedPhone: { type: String, default: null },
  detectedSummary: { type: String, default: null },
  detectedSkills: { type: [String], default: [] },
  skillCategories: {
    type: [{
      category: { type: String, required: true },
      skills: { type: [String], default: [] },
    }],
    default: [],
  },
  strongSkills: { type: [String], default: [] },
  detectedEducation: { type: [String], default: [] },
  detectedExperience: { type: [String], default: [] },
  detectedProjects: { type: [String], default: [] },
  detectedCertifications: { type: [String], default: [] },
  missingSections: { type: [String], default: [] },
  atsAnalysis: { type: mongoose.Schema.Types.Mixed, default: {} },
  jobMarketInsights: { type: mongoose.Schema.Types.Mixed, default: {} },
  weakAreas: { type: [String], default: [] },
  improvementSuggestions: { type: [String], default: [] },
}, {
  timestamps: { createdAt: true, updatedAt: false },
  versionKey: false,
  toJSON: {
    transform(_document, result) {
      result.id = result._id.toString();
      delete result._id;
      delete result.user;
      delete result.rawText;
      delete result.password;
      delete result.passwordHash;
      return result;
    },
  },
});

resumeAnalysisSchema.index({ user: 1, createdAt: -1 });

const ResumeAnalysis = mongoose.models.ResumeAnalysis
  || mongoose.model('ResumeAnalysis', resumeAnalysisSchema);

export default ResumeAnalysis;