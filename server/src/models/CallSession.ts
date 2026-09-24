import mongoose, { Document, Model } from 'mongoose';

export interface ICallSession extends Document {
  userId: string;
  sessionId: string;
  callerNumber: string;
  transcript: string;
  peakRiskScore: number;
  startTime: Date;
  endTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const callSessionSchema = new mongoose.Schema<ICallSession>({
  userId: { type: String, required: true },
  sessionId: { type: String, required: true, unique: true },
  callerNumber: { type: String, required: true },
  transcript: { type: String, default: '' },
  peakRiskScore: { type: Number, default: 0 },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
}, { timestamps: true });

const CallSession: Model<ICallSession> = mongoose.model<ICallSession>('CallSession', callSessionSchema);
export default CallSession;
