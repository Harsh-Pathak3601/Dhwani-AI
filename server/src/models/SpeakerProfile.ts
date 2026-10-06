import mongoose, { Document, Model } from 'mongoose';

export interface ISpeakerProfile extends Document {
  phoneNumberHash: string;         
  phoneNumberMasked: string;      
  voiceEmbedding: number[];         
  enrollmentFlow: 'authenticated' | 'none'; 
  sessionCount: number;
  avgVAS: number;                   
  consistencyScore: number;         
  flaggedSessions: number;
  lastSeen: Date;
  embeddingExpiry: Date;            // Auto-expire after 90 days
  createdAt: Date;
  updatedAt: Date;
}

const speakerProfileSchema = new mongoose.Schema<ISpeakerProfile>({
  phoneNumberHash: { type: String, required: true, unique: true, index: true },
  phoneNumberMasked: { type: String, required: true },
  voiceEmbedding: { type: [Number], required: true },
  enrollmentFlow: { type: String, enum: ['authenticated', 'none'], default: 'none' },
  sessionCount: { type: Number, default: 1 },
  avgVAS: { type: Number, default: 15 },
  consistencyScore: { type: Number, default: 0.92 },
  flaggedSessions: { type: Number, default: 0 },
  lastSeen: { type: Date, default: Date.now },
  embeddingExpiry: { 
    type: Date, 
    default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days DPDP Act retention
    index: { expires: 0 } 
  },
}, { timestamps: true });

const SpeakerProfile: Model<ISpeakerProfile> = mongoose.model<ISpeakerProfile>('SpeakerProfile', speakerProfileSchema);
export default SpeakerProfile;
