import mongoose from 'mongoose';

const jobAnalysisSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    select: false,
  },
  jobTitle: { type: String, required: true },
  companyName: { type: String, default: null },
  rawJobDescription: { type: String, required: true },
  overallMatchScore: { type: Number, required: true },
  requiredSkillMatchPercent: { type: Number, default: null },
  preferredSkillMatchPercent: { type: Number, default: null },
  requiredSkills: { type: [String], default: [] },
  preferredSkills: { type: [String], default: [] },
  matchedSkills: { type: [String], default: [] },
  missingSkills: { type: [String], default: [] },
  skillGaps: { type: [mongoose.Schema.Types.Mixed], default: [] },
  recommendations: { type: [mongoose.Schema.Types.Mixed], default: [] },
  interviewQuestions: { type: [mongoose.Schema.Types.Mixed], default: [] },
}, {
  timestamps: { createdAt: true, updatedAt: false },
  versionKey: false,
  toJSON: {
    transform(_document, result) {
      result.id = result._id.toString();
      delete result._id;
      delete result.user;
      return result;
    },
  },
});

jobAnalysisSchema.index({ user: 1, createdAt: -1 });

const JobAnalysis = mongoose.models.JobAnalysis || mongoose.model('JobAnalysis', jobAnalysisSchema);

export default JobAnalysis;