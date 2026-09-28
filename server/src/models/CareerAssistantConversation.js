import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, select: false },
  title: { type: String, required: true, maxlength: 200, default: 'Career Assistant' },
}, {
  timestamps: true,
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

conversationSchema.index({ user: 1, updatedAt: -1 });

const CareerAssistantConversation = mongoose.models.CareerAssistantConversation
  || mongoose.model('CareerAssistantConversation', conversationSchema);

export default CareerAssistantConversation;