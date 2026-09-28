import mongoose from 'mongoose';

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