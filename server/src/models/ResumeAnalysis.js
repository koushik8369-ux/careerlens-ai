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
  targetRole: { type: String, default: null },
  matchScore: { type: Number, default: null },
  rawText: { type: String, required: true, select: false },
  detectedSkills: { type: [String], default: [] },
  detectedEducation: { type: [String], default: [] },
  detectedExperience: { type: [String], default: [] },
  detectedProjects: { type: [String], default: [] },
  missingSections: { type: [String], default: [] },
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