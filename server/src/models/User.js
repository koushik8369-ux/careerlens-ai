import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema({
  phone: { type: String, default: null },
  education: { type: String, default: null },
  college: { type: String, default: null },
  graduationYear: { type: Number, default: null },
  careerGoal: { type: String, default: null },
  bio: { type: String, default: null },
  location: { type: String, default: null },
  skills: { type: [String], default: [] },
  createdAt: { type: Date, required: true },
  updatedAt: { type: Date, required: true },
}, {
  _id: false,
  versionKey: false,
});

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  passwordHash: {
    type: String,
    required: true,
    select: false,
  },
  role: {
    type: String,
    enum: ['USER', 'ADMIN'],
    default: 'USER',
    required: true,
  },
  profile: {
    type: profileSchema,
    default: undefined,
  },
}, {
  timestamps: true,
  versionKey: false,
  toJSON: {
    transform(_document, result) {
      result.id = result._id.toString();
      delete result._id;
      delete result.passwordHash;
      delete result.password;
      return result;
    },
  },
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;