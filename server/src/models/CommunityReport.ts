import mongoose, { Document, Model } from 'mongoose';

export interface ICommunityReport extends Document {
  callerNumber: string;
  reportsCount: number;
  averageRiskScore: number;
  lastReportedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const communityReportSchema = new mongoose.Schema<ICommunityReport>({
  callerNumber: { type: String, required: true, index: true },
  reportsCount: { type: Number, default: 1 },
  averageRiskScore: { type: Number, required: true },
  lastReportedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const CommunityReport: Model<ICommunityReport> = mongoose.model<ICommunityReport>('CommunityReport', communityReportSchema);
export default CommunityReport;
