import mongoose from 'mongoose';

const jobPostingSchema = new mongoose.Schema({
  sourceDataset: { type: String, required: true },
  sourceJobId: { type: String, required: true },
  jobId: { type: String, required: true },
  title: { type: String, required: true },
  currency: { type: String, default: null },
  jobUploaded: { type: String, default: null },
  companyName: { type: String, default: null },
  tagsAndSkills: { type: String, required: true },
  skillNames: { type: [String], default: [] },
  normalizedSkills: { type: [String], default: [] },
  experience: { type: String, default: null },
  salary: { type: String, default: null },
  location: { type: String, default: null },
  companyId: { type: String, default: null },
  reviewsCount: { type: Number, default: null },
  aggregateRating: { type: Number, default: null },
  jobDescription: { type: String, default: null },
  minimumSalary: { type: Number, default: null },
  maximumSalary: { type: Number, default: null },
  minimumExperience: { type: Number, default: null },
  maximumExperience: { type: Number, default: null },
}, {
  autoIndex: false,
  versionKey: false,
});

jobPostingSchema.index({ sourceDataset: 1, sourceJobId: 1 }, { unique: true });
jobPostingSchema.index({ sourceDataset: 1, normalizedSkills: 1 });

const JobPosting = mongoose.models.JobPosting
  || mongoose.model('JobPosting', jobPostingSchema);

export default JobPosting;
