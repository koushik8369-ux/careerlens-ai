import mongoose from 'mongoose';

const careerPlanItemSchema = new mongoose.Schema({
  category: { type: String, enum: ['SHORT_TERM', 'MEDIUM_TERM', 'LONG_TERM'], required: true },
  itemType: { type: String, enum: ['LEARNING', 'PROJECT', 'INTERVIEW', 'RESUME'], required: true },
  title: { type: String, required: true, maxlength: 500 },
  description: { type: String, default: null, maxlength: 2000 },
  skills: { type: [String], default: [] },
  priority: { type: String, required: true, maxlength: 20 },
  completed: { type: Boolean, required: true, default: false },
  status: { type: String, enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'], default: 'NOT_STARTED' },
  sortOrder: { type: Number, required: true },
}, { versionKey: false });

const careerPlanSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, select: false },
  sourceResumeAnalysis: { type: mongoose.Schema.Types.ObjectId, ref: 'ResumeAnalysis', default: null },
  sourceJobAnalysis: { type: mongoose.Schema.Types.ObjectId, ref: 'JobAnalysis', default: null },
  careerGoal: { type: String, default: null, maxlength: 1000 },
  status: { type: String, enum: ['ACTIVE', 'COMPLETED', 'ARCHIVED'], required: true, default: 'ACTIVE' },
  items: { type: [careerPlanItemSchema], default: [] },
}, {
  timestamps: true,
  versionKey: false,
  toJSON: {
    transform(_document, result) {
      result.id = result._id.toString();
      delete result._id;
      delete result.user;
      result.sourceResumeAnalysisId = result.sourceResumeAnalysis?.toString() ?? null;
      result.sourceJobAnalysisId = result.sourceJobAnalysis?.toString() ?? null;
      delete result.sourceResumeAnalysis;
      delete result.sourceJobAnalysis;
      result.items = result.items.map((item) => {
        item.id = item._id.toString();
        delete item._id;
        return item;
      });
      return result;
    },
  },
});

careerPlanSchema.index({ user: 1, status: 1, updatedAt: -1 });

const CareerPlan = mongoose.models.CareerPlan || mongoose.model('CareerPlan', careerPlanSchema);

export default CareerPlan;