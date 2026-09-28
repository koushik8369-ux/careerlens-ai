import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'CareerAssistantConversation', required: true },
  role: { type: String, enum: ['USER', 'ASSISTANT'], required: true },
  content: { type: String, required: true },
  provider: { type: String, default: null, maxlength: 50 },
}, {
  timestamps: { createdAt: true, updatedAt: false },
  versionKey: false,
  toJSON: {
    transform(_document, result) {
      result.id = result._id.toString();
      delete result._id;
      delete result.conversation;
      return result;
    },
  },
});

messageSchema.index({ conversation: 1, createdAt: 1 });

const CareerAssistantMessage = mongoose.models.CareerAssistantMessage
  || mongoose.model('CareerAssistantMessage', messageSchema);

export default CareerAssistantMessage;