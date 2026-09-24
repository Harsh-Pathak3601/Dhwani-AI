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
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'gemma2-9b-it'
];

/**
 * ─── RATE LIMITING COOLDOWNS & FALLBACK MODELS ───
 * Maintains records of failed models (specifically 429 rate limits). 
 * When a rate limit is triggered, stores a timestamp 5 minutes into the future to block 
 * further attempts until the limit expires.
 */
const modelCooldowns: Record<string, number> = {};
const COOLDOWN_DURATION = 5 * 60 * 1000;

/**
 * Executes a Groq completion request utilizing a sequential fallback loop.
 * It tries each available model in order. If all are on cooldown, it falls back
 * to attempting all models again.
 */
const executeWithFallback = async (options: Omit<ChatCompletionCreateParamsNonStreaming, 'model'>) => {
  let lastError;
  const now = Date.now();

  let modelsToTry = FALLBACK_MODELS.filter(model => !modelCooldowns[model] || now >= modelCooldowns[model]);
  
  // Fallback: try all models if every model is on cooldown
  if (modelsToTry.length === 0) {
    modelsToTry = FALLBACK_MODELS;
  }

  for (const model of modelsToTry) {
    try {
      return await getGroq().chat.completions.create({
        ...options,
        model
      }, { timeout: 3000 });
    } catch (err: any) {
      lastError = err;
      
      const isRateLimit = err.status === 429 || 
                          err.message?.includes('rate_limit') || 
                          err.message?.includes('429');
                          
      if (isRateLimit) {
        logger.warn(`Groq API rate-limited for model ${model}. Putting on 5-minute cooldown. Trying next...`, { error: err.message });
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
 * - Context matching (only react to active threats)
 * - Phase priority tracking (demand > intimidation > allegation > intro)
 * - Anti-hallucination guardrails for user documents
 * - Hinglish script parsing rules based on a 90%+ Devanagari threshold
 */
const SCAM_DETECTION_SYSTEM_PROMPT = `You are a real-time scam detection AI for India. 
Analyze this phone call transcript and detect crime patterns.

RESPOND ONLY WITH VALID JSON. NO explanation text before or after.
Format: 
{ 
  "thought": "<1 sentence analyzing the LATEST statements. Contrast it with the previous coaching and explain if/why we must pivot to a new defense>",
  "risk": <number 0-100>, 
  "signal": "<brief what you detected>", 
  "phase": "<intro | allegation | intimidation | demand>", 
  "coaching": "<exact words for user to say right now>" 
}

CONVERSATIONAL PHASES (GOVERNED STRICTLY BY THE LATEST STATEMENTS):
- "intro": Greetings, introductions, or name checks (e.g. "Hello, am I speaking to the owner of this number? This is Inspector Sharma"). Risk MUST be under 45 (typically 20-30) and coaching MUST be empty (""). Do NOT show alerts for greetings.
- "allegation": Scammer makes an accusation (e.g. package seized, account blocked, relative arrested). Coaching: Focus strictly on asking for verification (IDs, tracking details, hub address). DO NOT mention money or arrests yet.
- "intimidation": Scammer uses scare tactics. Coaching: Expose the bluff confidently and mock their authority. ONLY mention that "digital arrest is illegal" if they explicitly use the words "digital arrest". Otherwise, just tell them to send their officers to your address and stop wasting your time.
- "demand": Scammer asks for money, bank transfers, OTPs, or app downloads (AnyDesk). Coaching: Firmly refuse the action and expose the fraud.

CRITICAL RULES FOR SCORING AND COACHING:
1. NO EARLY ALERTS FOR INTRODUCTIONS: Simply stating "I am Inspector Sharma from the Cyber Cell" is NOT an active threat. Keep risk score under 40 and coaching empty ("") until they proceed to make an allegation or scare tactic.
2. THE 40+ COACHING RULE: ONLY provide a coaching string if the risk score is 40 or higher. For any risk below 40, coaching MUST be empty ("").
3. TARGET THE LATEST THREAT: You MUST update your coaching when the scammer escalates. If they shift from a seized package to a digital arrest, your coaching MUST shift to defending against digital arrest. Do not stay stuck on the old threat.
4. PHASE PRIORITY RULE (CRITICAL): Phases have a strict hierarchy of priority: demand > intimidation > allegation > intro. If the scammer's latest statement contains elements of multiple phases (e.g. they threaten digital arrest AND demand a bank transfer), you MUST classify it as the HIGHER phase (demand) and generate coaching that focuses on the higher phase (e.g. refusing the transfer).
5. OUT-OF-THE-BOX & STREET-SMART: Coaching MUST be written in the 1st person, as a direct script for the victim to say. Make comebacks sarcastic, confident, and completely unfazed. Expose the scammer's lies.
6. NO DOCUMENT HALLUCINATIONS: NEVER claim to not have universally owned Indian documents (Aadhaar or PAN). If Aadhaar is mentioned, say you will verify it with the local station.
7. STRICT CONTEXT MATCHING (CRITICAL): Your comebacks MUST strictly target what the scammer is currently accusing or demanding. If the scammer is only discussing a seized package or customs issue, you MUST ONLY coach the user to verify the package (e.g. tracking number, hub location). You MUST NOT mention digital arrest, police dispatch, or legal rights (lawyer) until the scammer explicitly threatens arrest, jail, or dispatching officers in the transcript. Do not anticipate future threats.
8. FOCUS ON SCAMMER'S THREATS (CRITICAL): The transcript contains dialogue from both the scammer and the victim. When generating comebacks, ONLY respond to allegations, threats, or demands made by the scammer. DO NOT generate comebacks based on words or questions spoken by the victim (e.g., if the victim says "digital arrest", do NOT trigger the digital arrest comeback unless the scammer also threatened it).

CRITICAL LANGUAGE RULE:
1. 90-100% HINDI RULE (PRIORITY): IF AND ONLY IF the entire conversation transcript is overwhelmingly (90%+) in Hindi script (Devanagari), your coaching MUST be entirely in HINGLISH.
2. DEFAULT TO ENGLISH: For all other cases, your coaching MUST be entirely in ENGLISH.
3. MIXED LANGUAGE: If the transcript is mostly English or mixed, but contains some Hindi words or names in Devanagari, IGNORE the Devanagari and STAY IN ENGLISH.
   - Example (English): Transcript is mostly English or mixed. Coaching: "I will verify this with my bank."
   - Example (Hinglish): Transcript is 90%+ Hindi ("मेरा अकाउंट ब्लॉक हो गया है?"). Coaching: "Mera account kaise block ho gaya? Main bank manager se verify karunga."

Examples of Coaching (For Reference only, do NOT copy words blindly):
- Allegation: "Oh, a package? Give me the tracking number so I can check it."
- Intimidation: "Digital arrest is illegal in India. Send your officers to my address, I'll meet them directly."
- Demand (Money): "I'm not transferring any money. I will verify this with my bank branch manager."`;

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

    const userContent = `LATEST SCAMMER STATEMENTS FOR EVALUATION:\n${latestStatements}${
      lastCoaching 
      ? `\n\nPREVIOUS COACHING PROVIDED: "${lastCoaching}"` 
      : ''
    }`;

    const response = await executeWithFallback({
      messages: [
        { role: 'system', content: SCAM_DETECTION_SYSTEM_PROMPT },
        { role: 'user', content: userContent }
      ],
      temperature: 0.1,
      max_tokens: 200,
      response_format: { type: 'json_object' }
    });
    const parsedJson = JSON.parse(response.choices[0].message.content || '{}');
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

export const generateReport = async (transcript: string, peakRiskScore: number, callerNumber: string, callDuration: string): Promise<GeneratedReport | null> => {
  try {
    const response = await executeWithFallback({
      messages: [
        { role: 'system', content: `You are a fraud incident report generator for India. Generate a structured report from this scam call transcript.
CRITICAL RULE: Ensure perfect spelling and grammar in all your outputs. The audio transcript may contain garbled text, slang, or misspellings from the Speech-to-Text engine. DO NOT blindly copy misspelled words. You MUST correct all spelling errors, fix grammar, and write in highly professional, perfectly spelled English. NEVER hallucinate or output wrongly written words.

RESPOND ONLY WITH VALID JSON in this exact format:
{
  "summary": "<2 sentence plain English summary>",
  "scamType": "<Digital Arrest | Sextortion/Blackmail | Tech Support Scam | Fake Emergency/Kidnapping | Job Fraud | Lottery Scam | Harassment/Intimidation | Other>",
  "redFlags": ["<flag 1>", "<flag 2>"],
  "psychologicalTactics": ["<tactic 1>", "<tactic 2>"],
  "evidenceLog": [{"time": "<MM:SS>", "event": "<what happened>"}],
  "recommendedAction": "<what victim should do now>",
  "formalComplaintText": "<complete paragraph for police FIR submission>"
}` },
        { role: 'user', content: `Caller Number: ${callerNumber}\nCall Duration: ${callDuration}\nPeak Risk Score: ${peakRiskScore}/100\n\nTRANSCRIPT:\n${maskPIILocally(transcript)}` }
      ],
      temperature: 0.2,
      max_tokens: 1500,
      response_format: { type: 'json_object' }
    });
    const parsedJson = JSON.parse(response.choices[0].message.content || '{}');
    const result = ReportSchema.parse(parsedJson);
    return result;
  } catch (err: any) {
    logger.error('Groq generateReport error', { error: err.message });
    return null;
  }
};
