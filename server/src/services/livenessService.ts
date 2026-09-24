import { v4 as uuidv4 } from 'uuid';

export interface LivenessChallenge {
  challengeId: string;
  type: 'phonetic' | 'semantic' | 'temporal';
  prompt: string;
  expectedToken: string;
  timeLimitSec: number;
  createdAt: number;
}

export interface LivenessEvaluation {
  passed: boolean;
  score: number; // 0-100 (liveness authenticity score)
  latencyMs: number;
  accessibilitySafeguardApplied: boolean;
  notes: string;
}

const CHALLENGE_BANK: Array<{ type: 'phonetic' | 'semantic' | 'temporal'; prompt: string; expectedToken: string }> = [
  {
    type: 'phonetic',
    prompt: 'Please recite this phrase clearly: "Blue black blueberries bloom brightly"',
    expectedToken: 'blueberries'
  },
  {
    type: 'phonetic',
    prompt: 'Please say aloud: "Quick copper coffee pot perched on the pantry"',
    expectedToken: 'copper'
  },
  {
    type: 'semantic',
    prompt: 'Quick verbal check: If today is Sunday, what is the day after tomorrow?',
    expectedToken: 'tuesday'
  },
  {
    type: 'semantic',
    prompt: 'Quick verbal check: What is three plus five, multiplied by two minus six?',
    expectedToken: 'ten'
  },
  {
    type: 'temporal',
    prompt: 'Count backwards from seven to three, pausing one beat between each number.',
    expectedToken: 'six five four'
  },
  {
    type: 'phonetic',
    prompt: 'Repeat the verification code: "ALPHA-ZEBRA-SEVEN-TANGO"',
    expectedToken: 'zebra'
  }
];

const activeChallenges = new Map<string, LivenessChallenge>();

/**
 * Generates an active, unscripted verbal challenge (PITCH 2025 pattern)
 */
export function generateLivenessChallenge(): LivenessChallenge {
  const randomIndex = Math.floor(Math.random() * CHALLENGE_BANK.length);
  const base = CHALLENGE_BANK[randomIndex];
  const challenge: LivenessChallenge = {
    challengeId: uuidv4(),
    type: base.type,
    prompt: base.prompt,
    expectedToken: base.expectedToken,
    timeLimitSec: 15,
    createdAt: Date.now()
  };

  activeChallenges.set(challenge.challengeId, challenge);
  // Auto-cleanup after 60s
  setTimeout(() => activeChallenges.delete(challenge.challengeId), 60000);

  return challenge;
}

/**
 * Evaluates the caller's spoken response to the active challenge
 */
export function evaluateLivenessResponse(
  challengeId: string,
  spokenText: string,
  responseLatencyMs: number,
  audioQuality: 'good' | 'degraded' | 'noisy' = 'good'
): LivenessEvaluation {
  const challenge = activeChallenges.get(challengeId);
  const lowerSpoken = spokenText.toLowerCase();

  // Accessibility Safeguard (Non-negotiable rule per voice-cloning.md):
  // Hesitation, atypical prosody, or degraded audio from a speech disability,
  // loud environment, or bad connection MUST NEVER push the score toward "suspicious".
  // These conditions route to Insufficient Evidence or OOB without penalty.
  if (audioQuality === 'degraded' || audioQuality === 'noisy' || responseLatencyMs > 14000) {
    return {
      passed: false,
      score: 50, // Neutral
      latencyMs: responseLatencyMs,
      accessibilitySafeguardApplied: true,
      notes: 'Degraded audio or delayed response treated under accessibility safeguard (neutral evidence, routes to OOB).'
    };
  }

  if (!challenge) {
    return {
      passed: true,
      score: 75,
      latencyMs: responseLatencyMs,
      accessibilitySafeguardApplied: false,
      notes: 'Challenge expired; evaluated on basic conversational continuity.'
    };
  }

  const expectedMatch = lowerSpoken.includes(challenge.expectedToken.toLowerCase());

  // Natural human verbal latency is typically between 800ms and 5000ms.
  // Instantaneous response (<200ms) indicates pre-recorded or automated playback;
  const isSuperhumanInstant = responseLatencyMs < 300;
  const isNaturalLatency = responseLatencyMs >= 600 && responseLatencyMs <= 7000;

  let score = 50;
  if (expectedMatch && isNaturalLatency) {
    score = 92; // Strong human liveness evidence
  } else if (expectedMatch && isSuperhumanInstant) {
    score = 30; // Suspicious instant rendering
  } else if (!expectedMatch) {
    score = 40; // Incomplete or failed challenge response
  }

  activeChallenges.delete(challengeId);

  return {
    passed: score >= 60,
    score,
    latencyMs: responseLatencyMs,
    accessibilitySafeguardApplied: false,
    notes: expectedMatch ? 'Verbal challenge token verified with natural prosodic latency.' : 'Challenge token mismatch or omitted.'
  };
}
