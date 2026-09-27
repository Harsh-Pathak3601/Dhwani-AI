import Groq from 'groq-sdk';
import type { ChatCompletionCreateParamsNonStreaming } from 'groq-sdk/resources/chat/completions';
import { z } from 'zod';
import logger from '../utils/logger.js';

let groqInstance: Groq | null = null;
const getGroq = () => {
  if (!groqInstance) groqInstance = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return groqInstance;
};

const FALLBACK_MODELS = [
  'qwen/qwen3.8-27b',
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'allam-2-7b'
];

/**
 * ─── SAFE JSON EXTRACTION ───
 * Robustly parses JSON from LLM generation whether returned raw, markdown fenced, or with leading/trailing text.
 */
export const extractJsonFromContent = (content: string): any => {
  if (!content) return {};
  const cleaned = content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        // Fallback: repair simple unescaped trailing quotes or truncated endings
        try {
          const repaired = match[0].replace(/,\s*([\]}])/g, '$1');
          return JSON.parse(repaired);
        } catch {}
      }
    }
    return {};
  }
};

/**
 * ─── RATE LIMITING COOLDOWNS & FALLBACK MODELS ───
 * Maintains records of failed models (specifically 429 rate limits). 
 * TPM limits on Groq reset in 2-5 seconds, so an 8s cooldown allows rapid recovery
 * without permanently disabling the model.
 */
const modelCooldowns: Record<string, number> = {};
const COOLDOWN_DURATION = 8 * 1000;

/**
 * Executes a Groq completion request utilizing a sequential fallback loop.
 */
export const executeWithFallback = async (options: Omit<ChatCompletionCreateParamsNonStreaming, 'model'>) => {
  let lastError;
  const now = Date.now();

  let modelsToTry = FALLBACK_MODELS.filter(model => !modelCooldowns[model] || now >= modelCooldowns[model]);
  
  if (modelsToTry.length === 0) {
    modelsToTry = FALLBACK_MODELS;
  }

  for (const model of modelsToTry) {
    try {
      const isNativeJsonModel = model.includes('qwen');
      const requestOptions: ChatCompletionCreateParamsNonStreaming = {
        ...options,
        model
      };

      // Only pass response_format for models that reliably support it
      if (options.response_format?.type === 'json_object') {
        if (!isNativeJsonModel) {
          delete (requestOptions as any).response_format;
        }
      }

      return await getGroq().chat.completions.create(requestOptions, { timeout: 7000 });
    } catch (err: any) {
      lastError = err;
      
      // If model failed with failed_generation JSON validation, try to salvage the generated text
      if (err.message && err.message.includes('failed_generation')) {
        try {
          const match = err.message.match(/"failed_generation":\s*"([\s\S]*?)"\s*\}\s*\}\s*$/);
          if (match && match[1]) {
            const unescaped = match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
            return {
              choices: [{
                message: { content: unescaped }
              }]
            } as any;
          }
        } catch {}
      }

      const isRateLimit = err.status === 429 || 
                          err.message?.includes('rate_limit') || 
                          err.message?.includes('429');
                          
      if (isRateLimit) {
        logger.warn(`Groq API rate-limited for model ${model}. Putting on 8s cooldown. Trying next...`, { error: err.message });
        modelCooldowns[model] = Date.now() + COOLDOWN_DURATION;
      } else {
        logger.warn(`Groq API failed with model ${model}, trying next...`, { error: err.message });
      }
    }
  }
  throw lastError;
};

/**
 * ─── LLM SCAM DETECTION INSTRUCTIONS PROMPT ───
 * Contains the 8 critical rules of scam detection governing the LLM:
/**
 * ─── DHWANI AI: VOICE CLONING & DEEPFAKE DETECTION PROMPT ───
 * Real-time detection of AI Voice Cloning, Deepfake Impersonation, and Synthetic Social-Engineering.
 * Governs the LLM to identify voice clone cues, emergency manipulation, isolation tactics,
 * and provide street-smart 1st-person coaching to expose the synthetic voice and prevent financial loss.
 */
const VOICE_CLONING_DETECTION_SYSTEM_PROMPT = `You are Dhwani AI — an advanced Real-Time AI Voice Cloning Detection and Deepfake Prevention engine.
Analyze this phone call transcript to detect AI voice cloning, deepfake audio impersonation, and synthetic social-engineering attacks.

RESPOND ONLY WITH VALID JSON. NO explanation text before or after.
Format:
{ 
  "thought": "<1 sentence analyzing the LATEST statements. Contrast with previous coaching and explain if/why we must pivot to a new defense>",
  "risk": <number 0-100>, 
  "signal": "<brief summary of detected voice clone / impersonation tactic>", 
  "phase": "<intro | allegation | intimidation | demand>", 
  "coaching": "<exact 1st-person words for user to speak right now>" 
}

CONVERSATIONAL PHASES IN VOICE CLONING ATTACKS:
- "intro": Voice greeting or claiming identity (e.g. "Dad, it's me", "This is Director Singhal", "Hi, I am calling from bank security"). Risk MUST be under 40 (typically 15-30) and coaching MUST be empty (""). Do NOT show alerts for routine greetings.
- "allegation": Caller presents an artificial emergency or claim (e.g., "I'm in police custody / hospital", "Urgent executive vendor transfer needed", "Your security profile is compromised"). Coaching: Prompt victim to test identity with questions only the real person knows (shared memories, family pet, internal employee code).
- "intimidation": Caller creates intense urgency, demands confidentiality, or isolates the victim (e.g., "Don't call my regular phone, my battery died/confiscated", "Do not tell anyone, this is top secret", "If you hang up, terrible consequences will follow"). Coaching: Expose the isolation bluff: "I am hanging up and calling your verified personal number right now."
- "demand": Caller asks for instant money transfer (UPI, RTGS, crypto), OTP, password, or financial transaction. Coaching: Firmly refuse: "I will not authorize any transfer or share OTP over this call. I am confirming this out-of-band directly."

CRITICAL RULES FOR SCORING AND COACHING:
1. VOICE CLONING COUNTERMEASURES: Coaching MUST be in the 1st person ("I...", "Tell me..."). Focus on defeating synthetic voice deception:
   - Ask for a personal family/organizational secret code or shared private memory.
   - Challenge biological liveness: "Say this random phrase right now to prove you are really you."
   - Break isolation: Insist on hanging up and calling the contact's trusted registered phone number.
   - Refuse voice-authorized financial demands unconditionally.
2. NO EARLY ALERTS FOR ROUTINE INTRODUCTIONS: Keep risk under 40 and coaching empty ("") until an emergency pretext, impersonation cue, or financial pressure appears.
3. THE 40+ COACHING RULE: ONLY provide coaching when risk is 40 or higher.
4. PHASE PRIORITY RULE: demand > intimidation > allegation > intro.
5. STRICT CONTEXT MATCHING: Only respond to what the caller has actually stated.
6. LANGUAGE & MULTILINGUAL CONVERSATION RULES:
   - The user or caller may speak in Hindi, Hinglish, Marathi, Bengali, Gujarati, Tamil, Telugu, Kannada, or English.
   - Normal human conversations in ANY language (e.g., greetings like "Namaste", "Kaise ho?", "Kya kar rahe ho?", "Khana khaya?", everyday office/personal check-ins) are 100% AUTHENTIC and SAFE.
   - You MUST assign risk: 0-25, phase: "intro", coaching: "" for normal conversational speech in any language!
   - NEVER assume that speaking in Hindi or an Indian regional language is suspicious, fake, or synthetic!
   - ONLY escalate risk (>= 50) when there is an explicit social engineering threat: fake emergency (police custody, hospital bail, customs parcel seizure, digital arrest), high-pressure isolation ("don't tell anyone", "stay on line"), or unauthorized financial demands (transfer money, share OTP/UPI PIN).
   - If transcript is predominantly Hindi/Devanagari or Hinglish, provide coaching in natural HINGLISH.
   - For all other cases, provide coaching in clear, confident ENGLISH.

Examples of Voice Cloning Coaching (Reference only):
- Allegation (Family/Friend): "If this is really you, what is our family secret safe word?"
- Intimidation (Isolation): "I'm hanging up and calling your verified phone number right now."
- Demand (Executive/Financial): "I cannot execute any funds transfer without independent out-of-band clearance."`;

/**
 * ─── STRUCTURAL JSON VALIDATION SCHEMAS ───
 * Zod parser schemas that enforce type safety and strict structural JSON formats.
 * `.catch()` routines provide safe defaults when the LLM outputs malformed properties.
 */
const RiskScoreSchema = z.object({
  thought: z.string().catch(''),
  risk: z.number().catch(0),
  signal: z.string().catch(''),
  phase: z.string().catch('intro'),
  coaching: z.string().catch('')
});

export type RiskScore = z.infer<typeof RiskScoreSchema>;

/**
 * ─── LOCAL PII MASKING ───
 * Fast, server-side regex PII scrubber that runs locally before any transcript
 * is sent to external LLM APIs (Groq). Replaces sensitive identifiers with
 * descriptive placeholders while preserving threat context for scam detection.
 *
 * Handles: Aadhaar, PAN, bank accounts, OTPs, phone numbers, and contextual names.
 * Preserves: Rupee amounts, scammer statements, and threat keywords.
 */
const maskPIILocally = (text: string): string => {
  let result = text
    // ── Devanagari STT Normalization ──
    .replace(/शर्मा/g, 'Sharma')
    .replace(/आधार/g, 'Aadhaar')
    .replace(/आधा/g, 'Aadhaar')
    .replace(/फेडएक्स/g, 'FedEx')
    // ── Government & Financial Identifiers ──
    // Aadhaar Number: 12 digits with optional spaces/hyphens (e.g., 1234 5678 9012)
    .replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, '[AADHAAR]')
    // PAN Card: 5 uppercase letters + 4 digits + 1 uppercase letter (e.g., ABCDE1234F)
    .replace(/\b[A-Z]{5}\d{4}[A-Z]\b/g, '[PAN]')
    // Bank Account / Card Numbers: 9 to 18 contiguous digits
    .replace(/\b\d{9,18}\b/g, '[ACCOUNT]')
    // OTP / PIN / Passcode: 4-8 digits following trigger keywords
    .replace(/\b(otp|pin|passcode|code)\s*(?:is|:|was)?\s*\d{4,8}\b/gi, '$1 [OTP]')
    // Phone Numbers: 10-digit Indian mobile numbers starting with 6-9
    .replace(/\b[6-9]\d{9}\b/g, '[PHONE]');

  // ── Contextual Name Redaction ──
  // Names following self-identification phrases (e.g., "My name is Vansh Verma")
  result = result.replace(
    /(?:[Mm]y name is|[Ss]peaking to|[Aa]m [Ii] speaking to)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/g,
    (match, name) => match.replace(name, '[NAME]')
  );
  // Names following authority titles (e.g., "Inspector Sharma", "Mr. Gupta")
  result = result.replace(
    /\b(?:[Ii]nspector|[Oo]fficer|[Mm]r\.?|[Mm]rs\.?|[Mm]s\.?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,1})/g,
    (match, name) => match.replace(name, '[NAME]')
  );

  return result;
};

export const scoreRisk = async (transcript: string, lastCoaching: string = ''): Promise<RiskScore> => {
  try {
    const cleanTranscript = maskPIILocally(transcript);
    // Focus on the last 3 transcript lines for scoring
    const transcriptLines = cleanTranscript.trim().split('\n').filter(line => line.trim().length > 0);
    const latestStatements = transcriptLines.slice(-3).join('\n');

    const userContent = `LATEST CALLER STATEMENTS FOR VOICE CLONING EVALUATION:\n${latestStatements}${
      lastCoaching 
      ? `\n\nPREVIOUS COACHING PROVIDED: "${lastCoaching}"` 
      : ''
    }`;

    const response = await executeWithFallback({
      messages: [
        { role: 'system', content: VOICE_CLONING_DETECTION_SYSTEM_PROMPT },
        { role: 'user', content: userContent }
      ],
      temperature: 0.1,
      max_tokens: 200,
      response_format: { type: 'json_object' }
    });
    const parsedJson = extractJsonFromContent(response.choices[0]?.message?.content || '{}');
    const result = RiskScoreSchema.parse(parsedJson);
    return result;
  } catch (err: any) {
    logger.error('Groq scoreRisk error', { error: err.message });
    return { thought: '', risk: 0, signal: '', phase: 'intro', coaching: '' };
  }
};

export const scrubPII = async (transcript: string): Promise<string> => {
  try {
    const response = await executeWithFallback({
      messages: [
        { role: 'system', content: `Redact PII from this transcript. Replace: Aadhaar numbers with [AADHAAR], bank accounts with [ACCOUNT], addresses with [ADDRESS], full names of the victim with [NAME], phone numbers other than the scammer's with [PHONE]. Keep all scammer statements intact. Return ONLY the redacted transcript text, nothing else.` },
        { role: 'user', content: maskPIILocally(transcript) }
      ],
      temperature: 0,
      max_tokens: 2000
    });
    return (response.choices[0].message.content || '').trim();
  } catch (err: any) {
    logger.error('Groq scrubPII error', { error: err.message });
    return transcript;
  }
};

const ReportSchema = z.object({
  summary: z.string().default('No summary provided'),
  scamType: z.string().default('Unknown'),
  redFlags: z.array(z.string()).default([]),
  psychologicalTactics: z.array(z.string()).default([]),
  evidenceLog: z.array(z.object({
    time: z.string(),
    event: z.string()
  })).default([]),
  recommendedAction: z.string().optional(),
  formalComplaintText: z.string().optional()
});

export type GeneratedReport = z.infer<typeof ReportSchema>;

export const generateReport = async (
  transcript: string, 
  peakRiskScore: number, 
  callerNumber: string, 
  callDuration: string,
  finalRiskScore?: number,
  livenessScore?: number | null
): Promise<GeneratedReport | null> => {
  try {
    const effectiveFinal = finalRiskScore !== undefined ? finalRiskScore : peakRiskScore;
    const livenessStatus = livenessScore !== null && livenessScore !== undefined 
      ? (livenessScore >= 70 ? `PASSED (${livenessScore}/100 - living human prosody verified)` : `FAILED (${livenessScore}/100)`) 
      : 'Not Tested';

    const response = await executeWithFallback({
      messages: [
        { role: 'system', content: `You are Dhwani AI's Forensic Voice Cloning Incident Report Generator.
Generate a structured forensic incident report from this voice interaction.
Ensure perfect spelling and grammar in all your outputs. Correct any speech-to-text typos in the transcript. Write in professional, highly objective English.

CRITICAL INSTRUCTION ON RESOLVED RISK & SYNTHETIC VOICE:
If Peak Security Risk Score is >= 40, synthetic voice or neural vocoder manipulation was DETECTED during this recording.
Even if trailing or leading audio segments sounded natural, humanized, or routine, DO NOT classify the interaction as clean, safe, or "Cleared Suspicious Interaction"!
Threat actors frequently splice cloned or manipulated voice segments with natural human speech.
You MUST classify the scamType as an AI Voice Cloning / Voice Manipulation attack (e.g., "AI Voice Cloning (Family Emergency)", "Executive / CFO Voice Clone Fraud", or "Deepfake Authority Impersonation"), highlighting that synthetic voice artifacts were detected during the recording (Peak Risk: ${peakRiskScore}/100).
If Final Resolved Risk Score is lower than Peak Security Risk Score only due to an active voice liveness challenge being passed, explain that an active challenge was passed but note the initial anomaly.

RESPOND ONLY WITH VALID JSON in this exact format:
{
  "summary": "<2 sentence clear technical and operational summary of the interaction and risk resolution>",
  "scamType": "<AI Voice Cloning (Family Emergency) | Executive / CFO Voice Clone Fraud | Deepfake Authority Impersonation | Synthetic Voice Financial Transfer | AI Voice Replay Attack | Other Voice Cloning Attack | Cleared Suspicious Interaction>",
  "redFlags": ["<voice artifact or impersonation tactic 1>", "<flag 2>"],
  "psychologicalTactics": ["<synthetic urgency or isolation tactic 1>", "<tactic 2>"],
  "evidenceLog": [{"time": "<MM:SS>", "event": "<detected cloning cue, voice test, or demand>"}],
  "recommendedAction": "<immediate preventative steps: call authentic contact directly, freeze account, or maintain routine vigilance>",
  "formalComplaintText": "<formal incident report statement suitable for National Cyber Crime Reporting Portal (1930 / cybercrime.gov.in) documenting the event>"
}` },
        { role: 'user', content: `Caller Number: ${callerNumber}\nCall Duration: ${callDuration}\nPeak Security Risk Score: ${peakRiskScore}/100\nFinal Resolved Risk Score: ${effectiveFinal}/100\nActive Voice Liveness Test: ${livenessStatus}\n\nTRANSCRIPT:\n${maskPIILocally(transcript)}` }
      ],
      temperature: 0.2,
      max_tokens: 1500,
      response_format: { type: 'json_object' }
    });
    const parsedJson = extractJsonFromContent(response.choices[0]?.message?.content || '{}');
    const result = ReportSchema.parse(parsedJson);
    return result;
  } catch (err: any) {
    logger.error('Groq generateReport error', { error: err.message });
    return null;
  }
};
