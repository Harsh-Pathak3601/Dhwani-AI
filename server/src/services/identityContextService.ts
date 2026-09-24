import crypto from 'crypto';
import mongoose from 'mongoose';
import SpeakerProfile, { ISpeakerProfile } from '../models/SpeakerProfile.js';
import Groq from 'groq-sdk';
import logger from '../utils/logger.js';

let groqInstance: Groq | null = null;
const getGroq = () => {
  if (!groqInstance) groqInstance = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return groqInstance;
};

export interface Stage2IdentityResult {
  speakerDeviation: number | null; // e.g., 2.8 sigma from historical baseline, null if no profile
  profileStatus: 'consistent' | 'deviated' | 'no_profile';
  similarity: number | null;
  impersonationRisk: number; // 0-100
  urgencyFlag: boolean;
  transactionKeywords: string[];
  historicalFlags: number;
  signal: string;
  recommendedVerification: string;
}

/**
 * Computes Cosine Similarity between two N-dimensional embedding vectors
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length === 0 || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Hashes phone number for privacy-first indexing (DPDP Act)
 */
export function hashPhoneNumber(phone: string): string {
  const clean = phone.replace(/[^\d+]/g, '');
  return crypto.createHash('sha256').update(clean).digest('hex');
}

/**
 * Masks phone number for display (+91 ****** 3481)
 */
export function maskPhoneNumber(phone: string): string {
  const clean = phone.replace(/[^\d+]/g, '');
  if (clean.length < 6) return 'Unknown Number';
  return clean.slice(0, 3) + ' ****** ' + clean.slice(-4);
}

/**
 * Stage 2: Identity & Context Engine
 * Compares speaker embedding against enrolled profile AND runs Groq contextual impersonation analysis.
 */
const profileCache = new Map<string, { profile: ISpeakerProfile | null; expires: number }>();

export async function analyzeIdentityAndContext(
  callerNumber: string,
  transcript: string,
  vas: number,
  artifacts: string[],
  liveEmbedding?: number[]
): Promise<Stage2IdentityResult> {
  const phoneHash = hashPhoneNumber(callerNumber || 'anonymous');
  
  // 1. Fetch Enrolled Speaker Profile (cached to prevent hammering Atlas over TLS every second)
  let profile: ISpeakerProfile | null = null;
  const cached = profileCache.get(phoneHash);
  if (cached && cached.expires > Date.now()) {
    profile = cached.profile;
  } else if (mongoose.connection.readyState === 1) {
    try {
      profile = await SpeakerProfile.findOne({ phoneNumberHash: phoneHash });
      profileCache.set(phoneHash, { profile, expires: Date.now() + 5 * 60 * 1000 });
    } catch (err: any) {
      logger.warn('Could not query SpeakerProfile database', { error: err.message });
      profileCache.set(phoneHash, { profile: null, expires: Date.now() + 60 * 1000 });
    }
  } else {
    // Database connection currently inactive; proceed with no_profile baseline without stalling
    profile = null;
    profileCache.set(phoneHash, { profile: null, expires: Date.now() + 10 * 1000 });
  }

  let speakerDeviation: number | null = null;
  let similarity: number | null = null;
  let profileStatus: 'consistent' | 'deviated' | 'no_profile' = 'no_profile';

  if (profile && profile.voiceEmbedding && profile.voiceEmbedding.length > 0) {
    if (liveEmbedding && liveEmbedding.length === profile.voiceEmbedding.length) {
      similarity = cosineSimilarity(liveEmbedding, profile.voiceEmbedding);
      // Historical baseline consistency is typically ~0.85-0.95 for bonafide same-speaker
      // Deviation calculation in sigmas:
      const expectedSim = profile.consistencyScore || 0.90;
      const sigma = 0.06; // standard deviation in natural speaker variation
      const simDiff = expectedSim - similarity;
      speakerDeviation = Number((Math.max(0, simDiff / sigma)).toFixed(2));

      if (speakerDeviation > 2.0) {
        // More than 2 sigma deviation = strong identity discrepancy
        profileStatus = 'deviated';
      } else {
        profileStatus = 'consistent';
      }
    } else {
      // Profile exists but live embedding still accumulating
      profileStatus = 'consistent';
    }
  }

  // 2. Keyword & Urgency Parsing
  const criticalFinancialTerms = [
    'transfer', 'money', 'rupees', 'lakh', 'crore', 'otp', 'pin', 'password',
    'rtgs', 'neft', 'imps', 'authorize', 'urgent', 'emergency', 'digital arrest',
    'cbi', 'customs', 'police', 'account number', 'security deposit', 'immediate'
  ];

  const lowerTranscript = transcript.toLowerCase();
  const matchedKeywords = criticalFinancialTerms.filter(kw => lowerTranscript.includes(kw));
  const hasUrgency = /immediate|right now|hurry|emergency|urgent|jail|arrest|blocked within/i.test(transcript);

  // 3. Contextual Enrichment via Groq LLM (Fallback to fast heuristic if API key is not present or rate limited)
  let impersonationRisk = profileStatus === 'deviated' ? 60 : 0;
  let signal = 'Normal conversational baseline';
  let recommendedVerification = 'Standard in-call monitoring';

  if (process.env.GROQ_API_KEY && transcript.trim().length > 15) {
    try {
      const prompt = `You are the Stage 2 Identity & Context Engine of VoiceShield (an AI voice cloning protection platform).
Analyze this interaction context for social-engineering impersonation cues:

- Caller Number: ${callerNumber || 'Unknown'} (${profileStatus === 'no_profile' ? 'First-seen caller, NO reference profile' : profileStatus})
- Stage 1 Voice Authenticity Score: ${vas}% synthetic (Detected acoustic artifacts: ${artifacts.join(', ') || 'None'})
- Speaker Profile Deviation: ${speakerDeviation !== null ? speakerDeviation + ' sigma deviation from known enrolled voiceprint' : 'No enrolled voiceprint available'}
- Transcript: "${transcript.slice(-400)}"
- Matched Sensitive Keywords: ${matchedKeywords.join(', ') || 'None'}

Assess whether this caller is attempting an impersonation or financial fraud scam.
RESPOND ONLY IN VALID JSON:
{
  "impersonationRisk": <number 0-100>,
  "signal": "<brief summary of social engineering tactic or 'Authentic interaction'>",
  "urgencyFlag": <boolean>,
  "recommendedVerification": "<e.g. 'Push confirmation to registered banking app' | 'Request video verification' | 'None'>"
}`;

      const response = await getGroq().chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.1,
        max_tokens: 250
      }, { timeout: 2500 });

      const content = response.choices[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        impersonationRisk = Math.min(100, Math.max(0, parsed.impersonationRisk ?? 20));
        signal = parsed.signal || signal;
        recommendedVerification = parsed.recommendedVerification || recommendedVerification;
      }
    } catch (llmErr: any) {
      logger.warn('Groq Stage 2 analysis skipped or failed, using heuristic context', { error: llmErr.message });
      // Heuristic fallback for Stage 2
      if (matchedKeywords.length >= 2 || hasUrgency) {
        impersonationRisk = 75;
        signal = `High urgency + financial keywords: ${matchedKeywords.slice(0, 3).join(', ')}`;
        recommendedVerification = 'Independent out-of-band confirmation';
      } else if (profileStatus === 'deviated') {
        impersonationRisk = 65;
        signal = `Atypical speaker voiceprint deviation (${speakerDeviation}σ)`;
        recommendedVerification = 'Voice callback on registered number';
      }
    }
  } else {
    // Deterministic heuristic when no LLM
    if (matchedKeywords.length >= 2 || hasUrgency) {
      impersonationRisk = 80;
      signal = `Detected urgent demand with financial keywords (${matchedKeywords.join(', ')})`;
      recommendedVerification = 'Push confirmation to enterprise security app';
    } else if (profileStatus === 'deviated') {
      impersonationRisk = 60;
      signal = `Speaker voiceprint does not match enrolled profile (${speakerDeviation}σ)`;
    }
  }

  return {
    speakerDeviation,
    profileStatus,
    similarity,
    impersonationRisk,
    urgencyFlag: hasUrgency,
    transactionKeywords: matchedKeywords,
    historicalFlags: profile?.flaggedSessions || 0,
    signal,
    recommendedVerification
  };
}
