import mongoose, { Document, Model } from 'mongoose';

export interface IEvidenceLog {
  time: string;
  event: string;
}

export interface IReport extends Document {
  userId: string;
  sessionId: string;
  callerNumber: string;
  summary: string;
  scamType: string;
  redFlags: string[];
  psychologicalTactics: string[];
  evidenceLog: IEvidenceLog[];
  recommendedAction?: string;
  formalComplaintText?: string;
  peakRiskScore: number;
  investigationStatus: 'Suspected' | 'Verified' | 'Needs Review';
  investigatorNotes?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const reportSchema = new mongoose.Schema<IReport>({
  userId: { type: String, required: true },
  sessionId: { type: String, required: true },
  callerNumber: { type: String, required: true },
  summary: { type: String, required: true },
  scamType: { type: String, required: true },
  redFlags: [{ type: String }],
  psychologicalTactics: [{ type: String }],
  evidenceLog: [{
    time: { type: String },
    event: { type: String }
  }],
  recommendedAction: { type: String },
  formalComplaintText: { type: String },
  peakRiskScore: { type: Number, required: true },
  investigationStatus: { type: String, enum: ['Suspected', 'Verified', 'Needs Review'], default: 'Needs Review', index: true },
  investigatorNotes: { type: String, default: '' },
  reviewedBy: { type: String },
  reviewedAt: { type: Date },
}, { timestamps: true });

const Report: Model<IReport> = mongoose.model<IReport>('Report', reportSchema);
export default Report;
