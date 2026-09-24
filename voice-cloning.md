# 🛡️ Dhwani AI — Real-Time Voice Cloning Detection & Scam Prevention

## Project Title
**AI-Powered Real-Time Detection and Prevention of Voice Cloning Impersonation Attacks**
*SIH 2026 · Problem Statement 26104 · AICTE, Cyber Security Cell · Theme: Blockchain & Cybersecurity*

---

## 🎯 The Core Security Loop (The Spine of Everything)

> **DETECT → SCORE → CHALLENGE → VERIFY → PROTECT**

VoiceShield is NOT just a scam-detection chatbot. It is an acoustic intelligence layer that operates on the **audio signal itself** — before any speech is transcribed. It analyzes a **parallel tap of the call audio** (zero added conversational latency), and when risk + consequence justify it, routes the decision to a channel the attacker does not control.

**The single most important insight:** *VoiceShield does not need to prove a caller's voice is synthetic to stop a fraudulent transaction.* It only needs to route enough suspicion to an independent trust channel before the sensitive action completes.

---

## ✅ What Dhwani AI Already Has (Keep Everything)

| Existing Asset | New Role in VoiceShield |
|---|---|
| Live microphone capture (`useAudioCapture.ts`) | Feed raw audio chunks to the parallel voice authenticity analyzer |
| Deepgram STT (nova-2, Hindi/English) | Still used for transcript + contextual/behavioral risk signals |
| Groq/Llama risk scoring (`groqService.ts`) | Extended to Stage 2 — contextual enrichment (social engineering cues, call origin, transaction context) |
| WebSocket pipeline (Socket.IO) | Emit voice-clone risk scores, 5-state alerts in real time to client |
| Coaching Cards UI (`CoachingCard.tsx`) | Repurposed as **Voice Integrity Alert Cards** with 5-state severity |
| Risk Indicator UI (`RiskIndicator.tsx`) | Now shows **Security Risk Index** (graduated, not a probability) |
| Report generation (PDF/HTML) | Extended with voice forensics evidence log and tamper-evident hash |
| MongoDB storage | Extended with voice feature vectors + speaker profile embeddings |
| Community number database | Add **cross-session speaker consistency** check (Stage 2) |
| PII scrubbing + privacy module | Extend to audio-feature-only telemetry; DPDP Act alignment |
| `ConsentBanner.tsx` | Extend with explicit voice-analysis consent + opt-out right |

---

## 🧠 Why Voice Cloning Is Detectable — Physical Fingerprints in the Signal

Voice cloning leaves artifacts **in the raw waveform** that are invisible in text but measurable acoustically:

| Artifact | Technical Signal |
|---|---|
| **Synthesis artifacts** | Spectral signatures from neural vocoders (HiFi-GAN, WaveNet, VITS) |
| **Phase inconsistencies** | Vocoder stitching creates phase breaks between phonemes |
| **Spectral smoothness** | TTS produces unnaturally flat formant trajectories |
| **Pitch contour regularity** | Cloned voices have machine-perfect F0 curves; real voices have micro-jitter |
| **Prosody & pause artifacts** | TTS pauses are unnaturally uniform; human inter-phrase breath is absent |
| **Codec fingerprints** | AI audio passed through VoIP shows double-encoding artifacts |

---

## 🗺️ Architecture — Before and After

```
BEFORE (Dhwani AI — text-level scam detection):
  Mic → Deepgram STT → Transcript → Groq LLM → Risk Score → Coaching Card

AFTER (VoiceShield — 3-stage non-contaminating architecture):

  Mic ──┬── Deepgram STT ─────────────────────────────────────────────────────┐
        │   (transcript for Stage 2 behavioral/contextual analysis)            │
        │                                                                      │
        └── [NEW] Browser DSP Extractor                                        │
              (Web Audio API: mel-spectrogram, CQT, MFCC, F0, ZCR, pauses)    │
              ↓  [250ms chunks, parallel tap — zero call latency]              │
              ↓                                                                 │
         [NEW] STAGE 1: Voice Authenticity (V)                                 │
               AASIST/RawNet2 + CQT features                                  │
               Cascade: lightweight triage → heavy wav2vec2-XLSR if borderline│
               Output: Voice Authenticity Score + evidence-sufficiency flag    │
              ↓                                                                 │
         [NEW] STAGE 2: Identity & Context (I)                                ├─► Security Risk Index
               ECAPA-TDNN speaker consistency (identity, NOT authenticity)     │   → 5-State Alert
               Groq LLM: behavioral signals, urgency, OTP/transfer keywords   │   → Action
               Call origin, known contact info, historical fraud indicators   │
              ↓                                                                 │
         [NEW] STAGE 3: Security Policy (F)                                   │
               F = f(V, I, Active Liveness, Transaction Consequence)           │
               Active challenge-response (if risk × consequence warrants it)  │
               → Insufficient Evidence / Watch / Suspicious / High / Critical │
               → Independent Trust Channel (OOB) for consequential actions    │
               → Tamper-evident evidence hash (blockchain-anchored)           │
                                                                              ─┘
```

**Critical design rule:** Stage 1 measures only acoustic synthesis evidence. Stage 2 measures only identity/context/behavioral evidence. They are kept separate by construction — not by convention — until Stage 3 combines them. A suspicious OTP request never moves the *authenticity* score; a distorted-sounding voice never moves the *fraud risk* score.

---

## 📦 What Needs to Be Built — Module by Module

---

### MODULE 1 — Browser-Side Audio Feature Extractor
**File:** `client/src/services/audioFeatureExtractor.ts`

Runs **in parallel** to the existing `useAudioCapture.ts` Deepgram stream. Uses the **Web Audio API** to extract acoustic features from each audio chunk before sending them to the server — no raw audio bytes leave the browser.

**Features extracted:**
- **Mel-spectrogram** — Primary representation for AASIST/RawNet2 models
- **Constant-Q Transform (CQT)** — Complementary time-frequency resolution to mel; better at detecting fine-grained spectral inconsistencies in voiced segments
- **MFCC (Mel-Frequency Cepstral Coefficients)** — TTS voices have unnaturally smooth MFCC delta trajectories
- **Pitch (F0) Contour** — Extracted via autocorrelation; machine-generated voices have too-perfect pitch curves
- **Zero-Crossing Rate (ZCR)** — Unnatural regularity in TTS vs. natural jitter in human speech
- **Silence/Pause Distribution** — Inter-word pause timing uniformity
- **Breathing-pattern proxy** — Most TTS pipelines do not model natural inter-phrase breath; measurable as energy-envelope patterns

**Implementation:** `AnalyserNode` + `ScriptProcessorNode` or `AudioWorklet` from `AudioContext` API, with `fft.js` or `dsp.js` for spectral computation. Output compressed to float32 arrays.

**Multi-resolution windowing — emit at three cadences:**
| Resolution | Purpose | Window |
|---|---|---|
| Short | Fast spectral triage (first-pass evidence) | ~1s |
| Medium | Prosody, temporal continuity, phoneme transitions | ~3–4s |
| Long rolling | Speaker consistency, behavioral trend, liveness context | ~5–10s |

**WebSocket emit:** `socket.emit('audio:features', { melSpec, cqt, mfcc, f0, zcr, pauses, windowType })`

---

### MODULE 2 — Stage 1: Voice Authenticity Engine (Backend)
**File:** `server/src/services/voiceAuthService.ts`

Determines **one thing only**: does this audio exhibit evidence of synthetic/manipulated generation? Nothing about caller behavior, urgency, claimed identity, or financial request is allowed to influence this score.

#### Layer 1 — Rule-Based Heuristics (~0ms, always-on)
```
IF spectral_flux_variance < threshold → synthetic_flag++   // unnaturally flat harmonics
IF mfcc_delta_smoothness > threshold → synthetic_flag++    // too-perfect MFCC trajectory
IF f0_jitter < threshold → synthetic_flag++                // machine-perfect pitch
IF pause_uniformity > threshold → synthetic_flag++         // TTS pause regularity
IF breathing_proxy < threshold → synthetic_flag++          // no natural inter-phrase breath
VAS_heuristic = normalize(synthetic_flag)
```

#### Layer 2 — ML Model Inference (Cascade pattern)
**Lightweight first-pass (~50ms):** AASIST or RawNet2-family model, operating over mel-spectrogram + CQT, optimized for streaming:
- ONNX export, run via `@onnxruntime-node`
- INT8 post-training quantization for CPU efficiency
- Output: `{ bonafide: 0.23, spoof: 0.77, confidence: 'high' | 'low' }`

**Heavy second-pass — only for borderline confidence:** Wav2Vec2-XLSR-class self-supervised embedding, invoked *only* when the lightweight model's output is borderline (e.g., confidence < 0.65). This tiered/cascade pattern keeps typical-case latency low while reserving expensive inference for exactly the cases that need it.

**Datasets for training/evaluation:**
- ASVspoof 2021 LA (TTS and voice conversion — logical access track)
- **WaveFake** (Frank & Schönherr, NeurIPS 2021 — 100k+ clips, six vocoder architectures)
- **IndieFake** — Indian-accent deepfake benchmark
- **HAV-DF** — Hindi audio-video deepfake dataset
- **MLAAD** — Multilingual Anti-Spoofing Dataset
- **SEA-Spoof** — South-East Asian multilingual spoofing benchmark

**Key evaluation axes (not just spoof-detection accuracy):**
| Metric | What it measures |
|---|---|
| EER, ROC-AUC | Core bonafide/spoof separation |
| **Unseen-generator degradation** | Resilience against TTS/VC models held out of training |
| **Codec/noise robustness** | Performance under compression, packet loss, replay — per Shi et al. 2025 |
| Brier score, calibration curve | Whether the score means what it claims to mean |
| p50/p95 streaming inference latency | Real-time usability |

> **Important:** Latency budget — if a window's round-trip exceeds ~450ms (1.5× the ~300ms target), its evidence is treated as stale and excluded from fusion, not used at reduced confidence. This prevents silent accuracy degradation under load.

**Output of Stage 1:**
```typescript
{
  vas: number,              // Voice Authenticity Score 0–100
  confidence: 'sufficient' | 'insufficient',  // evidence-sufficiency flag
  artifacts: string[],      // ["spectral_smoothness", "f0_too_regular", ...]
  model: 'heuristic' | 'aasist' | 'wav2vec2_xlsr'
}
```

> **Critical:** Stage 1 can emit `confidence: 'insufficient'` when audio is too short, too noisy, or quality is too low to make a meaningful judgment. This is NOT a failure — it maps to the **Insufficient Evidence** state in the risk model and triggers independent verification without a forced verdict.

---

### MODULE 3 — Stage 2: Identity & Context (Backend)
**File:** `server/src/services/identityContextService.ts` (new, extends `groqService.ts`)

Determines whether the caller and the interaction are consistent with the claimed situation. Behavioral/social-engineering cues — urgency, authority claims, OTP requests, financial transaction keywords — **belong here**, not in Stage 1.

#### Speaker Consistency (ECAPA-TDNN)
- Compare caller's ECAPA-TDNN embedding (extracted from current call features) via cosine similarity against an enrolled reference voiceprint
- A mismatch = **identity evidence**, NOT proof of synthesis — these are different problems
- **Enrollment governance (non-negotiable):** A reference voiceprint may only be enrolled by the account holder it represents, through an authenticated enrollment flow *separate* from any live call — never captured from an in-progress call, never enrolled by a third party. This closes the attack surface of an adversary pre-enrolling someone else's voice.

#### Contextual Enrichment via Groq (extends existing `groqService.ts`)
Extend the existing system prompt to add an impersonation-analysis mode:
```
"Voice Authenticity Score is [VAS]% synthetic (Stage 1: [artifacts]).
Speaker consistency: [cosine_distance] vs enrolled profile (if available).
Transcript: [last 400 words]
Call context: [caller number, first-seen flag, historical flags]

Assess: Is this a social-engineering impersonation attempt?
Respond JSON: { impersonationRisk: 0-100, signal: string, urgencyFlag: bool, transactionKeywords: string[], recommendedVerification: string }"
```

**Output of Stage 2:**
```typescript
{
  speakerDeviation: number | null,  // sigma from historical baseline (null if no profile)
  impersonationRisk: number,        // 0-100
  urgencyFlag: boolean,
  transactionKeywords: string[],    // ["transfer", "OTP", "authorize"]
  historicalFlags: number
}
```

---

### MODULE 4 — Stage 3: Security Policy & 5-State Risk Model
**File:** `server/src/sockets/` (extend existing socket handler)

Combines Stage 1 + Stage 2 evidence into a single **Security Risk Index** (not "Fake Probability" — it is a calibrated decision-support index, not a claim of universal accuracy).

#### The 5-State Risk Model

| State | Evidence Pattern | Base Action | If Financially/Legally Consequential |
|---|---|---|---|
| **Insufficient Evidence** | Very short audio, severe packet loss, extreme noise, no reference sample | Do NOT force a verdict; recommend independent verification | Same — never silently allow a high-stakes action on low-confidence evidence |
| **Low / Watch** | Sufficient evidence, low concern | Continue silently, log for enrichment | No challenge triggered |
| **Suspicious** | Meaningful anomaly in Stage 1 or Stage 2 | Warning card shown; optional challenge | Active challenge triggered |
| **High** | Strong combined evidence across stages | Mandatory challenge + independent verification recommended | Independent Trust Channel required |
| **Critical** | High-risk evidence AND a consequential action requested | Hold action, escalate per authorized policy | Hold until independent verification clears |

**Friction scales with risk × consequence** — a routine personal call gets zero added friction. A ₹50L transfer request on a suspicious score gets a full hold. These thresholds are configurable per institution without retraining the detection model.

#### New Socket Events
```
Client → Server:  'audio:features'     { melSpec, cqt, mfcc, f0, zcr, pauses, windowType }
Server → Client:  'voice:stage1'       { vas, confidence, artifacts, model }
Server → Client:  'voice:stage2'       { speakerDeviation, impersonationRisk, transactionKeywords }
Server → Client:  'risk:state'         { state: 'Suspicious', index: 64, explanation: string[] }
Server → Client:  'risk:alert'         { level: 'HIGH', message: string, action: string }
Server → Client:  'liveness:challenge' { questionText: string, challengeId: string }
Server → Client:  'oob:triggered'      { method: 'push_notification' | 'callback' | 'supervisor' }
Server → Client:  'action:hold'        { transactionRef: string, reason: string }
```

---

### MODULE 5 — Active Liveness (The Signature Feature)
**File:** `server/src/services/livenessService.ts` + `client/src/components/LivenessChallenge.tsx`

**Prior art honesty (important for Q&A):** Challenge-response for audio deepfakes has been explored by D-Captcha, D-Captcha++, and **PITCH** (Mittal et al., ACM ASIA CCS 2025 — 84.5% accuracy on 1.6M samples). VoiceShield does NOT claim to have invented this. Our contribution is the **surrounding security architecture**: making the challenge risk-triggered and consequence-scaled (not on every call), keeping its evidence separate from Stage 1 authenticity scores until Stage 3, and pairing it with the Independent Trust Channel.

**What it does:** When Stage 3 determines risk × consequence warrants friction, inject a randomized, unscripted verbal challenge:
- Randomized across **semantic, phonetic, and temporal** axes (can never be a static, memorizable secret)
- Response analyzed for: latency, conversational continuity, prosodic adaptation, natural hesitation/interruption patterns, phoneme-transition behavior
- Output: additional evidence input into Stage 3 — NOT a pass/fail gate on its own

**Accessibility safeguard (non-negotiable):** Hesitation, atypical prosody, or degraded audio from a speech disability, loud environment, or bad connection MUST NEVER push the score toward "suspicious." These conditions route to **Insufficient Evidence** or directly to the **Independent Trust Channel** — they do not penalize the legitimate caller. Build this as a first-class rule, not an edge-case patch.

**Standard Q&A answer:** *"Could a good enough real-time converter eventually answer the challenge? We can't rule that out — no one honestly can. What the challenge does is raise attacker difficulty and add a live, hard-to-fake behavioral signal on top of everything else in the pipeline. Defense-in-depth, not a single point of failure."*

---

### MODULE 6 — Independent Trust Channel (Prevents Fraud, Not Just Detects)
**File:** `server/src/services/trustChannelService.ts`

**Core principle:** *Never authenticate a compromised channel using the same compromised channel.* If the voice call itself is the suspected attack surface, asking more questions over that same call proves nothing.

**OOB verification options (High/Critical states):**
- Push confirmation to a provisioned enterprise security app on a registered device
- Independent callback to a pre-registered number
- Supervisor/dual-authorization workflow
- Secure banking/enterprise approval channel
- Known-device MFA

**This is why "real-time" is honest:** "Real-time" describes Stage 1–3 continuous detection as the call happens. The Independent Trust Channel intentionally trades speed for certainty when consequence demands it — a routine call gets zero added latency, while a ₹50L transfer gets the extra seconds a real security decision deserves. The claim is "detected in real time, verified as fast as independent confirmation reasonably allows."

**Regulatory alignment:** RBI's 2026 Draft Guidance on Model Risk Management proposes mandatory human-override capability for AI systems influencing consequential decisions. The Supreme Court's ongoing suo motu proceedings (2025–26) on digital-arrest scams have directed temporary debit holds + delayed-credit safeguards — exactly the "hold, then independently verify" pattern VoiceShield's Critical-state action implements.

---

### MODULE 7 — Speaker Profile Store
**File:** `server/src/models/SpeakerProfile.ts` (new MongoDB model)

```typescript
{
  phoneNumber: string,              // caller's number (hashed for privacy)
  voiceEmbedding: number[],         // 192-dim ECAPA-TDNN embedding
  enrollmentFlow: 'authenticated' | 'none',  // NEVER from live call
  sessionCount: number,
  avgVAS: number,                   // historical average Voice Authenticity Score
  consistencyScore: number,         // how stable voice features are across calls (σ)
  flaggedSessions: number,
  lastSeen: Date,
  embeddingExpiry: Date             // auto-expire after 90 days
}
```

**Cross-session consistency:** If same number calls again and ECAPA-TDNN cosine distance deviates > 2σ from historical baseline → **immediate identity evidence flag** in Stage 2. This catches clones even when Stage 1 is borderline — a scammer can't clone a voice AND match 50 sessions of historical speaker consistency simultaneously.

**Enrollment governance:** Reference voiceprint can ONLY be enrolled through an authenticated, separate enrollment flow. The attack surface of someone pre-enrolling another person's voice is closed by construction.

---

### MODULE 8 — Voice Integrity Alert UI
**Files:** Extend `CoachingCard.tsx`, `RiskIndicator.tsx`; add `VoiceIntegrityPanel.tsx`, `LivenessChallenge.tsx`

#### `VoiceIntegrityPanel.tsx` (new)
- **Security Risk Index gauge** — animated circular meter, color-coded by 5 states (grey → green → yellow → orange → red)
- **Stage 1 evidence badges** — `["phase_inconsistency", "f0_too_regular"]` shown as small chips
- **Speaker profile status** — "✅ Voice consistent with 4 previous calls" / "⚠️ Deviates 2.8σ from known profile" / "🔍 No profile — first contact"

#### Updated `CoachingCard.tsx` — voice-clone alert variants
| State | Card |
|---|---|
| Critical | 🔴 **SYNTHETIC VOICE LIKELY** — 77% synthesis probability. Do NOT authorize any transaction. Request in-person or video verification. |
| High | 🟠 **VOICE ANOMALY DETECTED** — Proceed with caution. Call back on the official number before taking any action. |
| Suspicious | 🟡 **VOICE IRREGULARITY** — Something sounds off. Be vigilant. |
| Insufficient Evidence | ⚪ **INSUFFICIENT AUDIO** — Not enough signal to assess. Use independent verification for any sensitive action. |

#### `LivenessChallenge.tsx` (new)
- Appears when Stage 3 triggers active liveness
- Shows challenge question on screen; user reads it aloud during the call
- Timer indicator; analysis result returned via `liveness:result` socket event

#### Pre-Transaction Warning Modal (extend `CallSession.tsx`)
- Fires when state is High/Critical AND `transactionKeywords` detected simultaneously
- Full-screen interrupt: "A financial transaction has been requested while voice risk is elevated. This call must be independently verified before proceeding."

---

### MODULE 9 — Multilingual & Indian Accent Support

**Deepgram config change in `useAudioCapture.ts`:**
```typescript
// From:
language: 'hi'

// To:
language: 'multi'
model: 'nova-2'
detect_language: true
```

**Voice cloning detection is language-agnostic** — MFCC, spectral, and prosodic artifacts appear identically whether the voice is cloned in Hindi, Tamil, Marathi, or English. The same AASIST/RawNet2 model works across languages.

**India-specific fine-tuning datasets** (beyond ASVspoof/WaveFake):
- **IndieFake** — Indian-accent deepfake benchmark
- **HAV-DF** — Hindi audio-video deepfake
- **MLAAD** — Multilingual Anti-Spoofing
- **IndicSpeech / Kathbath** — Indian-accent bonafide speech baselines

Western-only trained detectors fail on Indian accents — our evaluation protocol specifically tracks Indian-accent degradation as a first-class metric.

---

### MODULE 10 — Blockchain Evidence Integrity
**File:** `server/src/services/evidenceService.ts`

**Blockchain does NOT do detection.** It solves a specific, concrete problem: once an incident is flagged, how do multiple independent parties (a bank, a telecom operator, a second bank) prove the evidence record wasn't altered after the fact by any one participant?

**Implementation:**
1. Incident metadata + evidence summary (NOT raw audio) is cryptographically hashed at decision time
2. Hash includes: model version, policy version, timestamp, Stage 1/2/3 scores, action taken
3. Hash is anchored to a **permissioned ledger** where multiple independent parties need tamper-evident shared records
4. Raw audio stays off-chain; feature vectors only if compliance requires them

**Single-institution default:** If only one institution uses the record, a signed append-only database log (PostgreSQL + `pg_audit`, or a simple Merkle chain) does the same job — use that by default. Permissioned ledger is the **multi-party trust** upgrade, earned by the multi-party condition, not the SIH theme name.

**Honest claim:** "Tamper-evident integrity." Not "court-admissible." A prototype cannot make admissibility claims — that is a legal determination, not a technical one.

---

### MODULE 11 — Privacy & Compliance
**File:** extends existing `server/src/middleware/` + `ConsentBanner.tsx`

- **No raw audio storage** — feature vectors only (MFCC arrays, ECAPA embeddings), never audio bytes
- **On-device inference** — ONNX model can run entirely in-browser via `onnxruntime-web` (zero-upload privacy mode for sensitive deployments)
- **Feature-only telemetry** — store `{ mfcc_mean, spectral_centroid_mean, vas_score }` not audio
- **DPDP Act 2023 alignment** — voice biometric data requires purpose limitation, minimal retention, explicit consent
- **90-day auto-expiry** on speaker profiles (configurable per institution)
- **Human override always available** — no consequential action is fully automated; VoiceShield is decision-support, not autonomous enforcement
- **Explainability by construction** — because Stage 1/2/3 are separate, every flagged decision shows *which stage* produced *which evidence* — not a black-box score

---

### MODULE 12 — Integration API Layer
**File:** `server/src/routes/voiceApi.ts`

```
POST /api/voice/analyze          — Submit audio chunk, get Security Risk Index
GET  /api/voice/profile/:number  — Get speaker profile for a number
POST /api/voice/enroll           — Enroll verified voice sample (authenticated flow only)
GET  /api/voice/report/:sessionId — Full voice forensics report with evidence trail
POST /api/webhooks/alert         — Configurable webhook for bank/enterprise system
GET  /api/voice/health           — Model version, policy version, inference latency p50/p95
```

Banks, contact centers, and telecom operators can integrate this as a **middleware layer** — no UI required. The evidence API makes every decision auditable: which model version, which policy version, which stage produced which evidence.

---

## 🔧 New Tech Stack Additions

| Addition | Purpose | Notes |
|---|---|---|
| `@onnxruntime-node` | AASIST/RawNet2 inference on server | CPU, no GPU needed; INT8 quantized |
| `onnxruntime-web` | Optional browser-side AASIST inference | Zero-upload privacy mode |
| `fft.js` / `dsp.js` | Browser-side FFT for mel-spectrogram + CQT | Lightweight, no native deps |
| AASIST or RawNet2 `.onnx` | Core spoof detector | HuggingFace: `AASIST-L`, `RawNet2` — ASVspoof/WaveFake fine-tuned |
| ECAPA-TDNN `.onnx` | Speaker embedding for cross-session consistency | HuggingFace: `speechbrain/spkrec-ecapa-voxceleb` |
| Wav2Vec2-XLSR `.onnx` | Heavy-pass embedding (cascade — borderline only) | HuggingFace: `facebook/wav2vec2-large-xlsr-53` |

---

## 🎨 What Makes VoiceShield Unique (Defensible Claims Only)

1. **3-stage non-contaminating architecture** — authenticity, identity/context, and policy are kept separate by construction, not convention. An OTP request never moves the voice-authenticity score. A strained voice never moves the fraud score.

2. **Active liveness as systems integration** — we didn't invent audio challenge-response (PITCH 2025 has 84.5% accuracy in published research). We built the architecture that makes it risk-triggered, consequence-scaled, and wired to an Independent Trust Channel — connecting detection → verification → prevention.

3. **Independent Trust Channel** — the one decision that turns VoiceShield from a *detector* into a *prevention* system. Never re-verify a compromised channel using the same compromised channel.

4. **Cascade inference** — lightweight AASIST on every window; Wav2Vec2-XLSR only on borderline cases. Keeps typical-case compute cost low without sacrificing accuracy on ambiguous audio.

5. **Indian-accent aware** — trained and evaluated on IndieFake, HAV-DF, MLAAD — not an English-only ASVspoof fine-tune. Western detectors fail on Indian accents; we measure this failure rate and close it.

6. **Cross-session speaker consistency** — ECAPA-TDNN profiles build over time. A scammer can fool a single-call detector with a good clone; they cannot simultaneously fool a system that has 50 sessions of reference embeddings.

7. **Zero-audio-storage privacy** — feature vectors only, DPDP Act compliant, 90-day auto-expiry, full explainability by construction.

8. **Parallel tap, zero call latency** — we analyze a parallel audio stream, not the call path. Both parties hear each other with zero added conversational latency regardless of analysis speed.

---

## 📊 Impact Numbers (Verified, Cited, Honest)

| Statistic | Source |
|---|---|
| **47%** of Indian adults experienced, or know someone who experienced, an AI voice scam — ~2× the global average | McAfee, "Artificial Imposter," 2023 |
| **83%** of Indian victims who fell for an AI voice scam lost money; **48%** lost >₹50,000 | McAfee, 2023 |
| **69%** of Indian respondents not confident they could distinguish an AI voice from a real one | McAfee, 2023 |
| Controlled study: people scored **37.5% accuracy** distinguishing AI vs. human vishing voices — below chance on a binary task | "Can You Tell It's AI?" 2026 controlled study |
| India cyber fraud losses: **₹7,465 crore (2023) → ₹22,845 crore (2024)** — 206% single-year increase | MHA data, placed before Parliament |
| Bharti Enterprises Chairman's voice cloned to defraud a Dubai executive — stopped only by human vigilance | Publicly reported, October 2024 |

> **The 69% statistic is the most important for the pitch.** It justifies why a technical layer is needed — a human listening carefully is not a viable defense.

---

## ⚠️ Claim-Safety Rules

| Never claim | Say instead |
|---|---|
| Perfect / near-perfect detection accuracy | "Measured performance on our defined evaluation protocol" |
| No clone can defeat the challenge | "The challenge raises attacker difficulty and adds an independent evidence signal" |
| A missing voice watermark = fake | "Valid provenance is positive evidence; absence is unknown, not suspicious" |
| Blockchain makes evidence court-admissible | "Blockchain provides tamper-evident integrity" |
| Raw cellular call audio is freely accessible | "We use authorized enterprise VoIP media APIs or a consented call-screening extension" |
| A fixed accuracy number (e.g. '95% accuracy') | Only after measuring on our own disclosed test protocol |
| Bank/telecom partnership | "An architectural integration path" (unless an actual partnership exists) |
| The Independent Trust Channel is instantaneous | "Real-time detection; verification is as fast as independent confirmation allows" |

---

## 📋 Implementation Phases

### Phase 0 — Hackathon MVP (Build first, in this order)
- [ ] `audioFeatureExtractor.ts` — browser DSP (mel-spec, CQT, MFCC, F0, ZCR, pauses via Web Audio API)
- [ ] Stage 1 heuristic scorer in `voiceAuthService.ts` (rule-based, ~0ms)
- [ ] Integrate AASIST ONNX model via `@onnxruntime-node` (lightweight pass)
- [ ] Stage 2 — extend `groqService.ts` with impersonation-context prompt
- [ ] Stage 3 — 5-state Security Risk Index combiner in socket handler
- [ ] Active liveness — `livenessService.ts` + `LivenessChallenge.tsx`
- [ ] **Mock OOB verification flow** (build THIS before polishing the ML pipeline — it's the #1 demo failure risk)
- [ ] `VoiceIntegrityPanel.tsx` — animated 5-state Security Risk gauge
- [ ] Extended `CoachingCard.tsx` — voice-clone alert variants
- [ ] Pre-transaction warning modal in `CallSession.tsx`
- [ ] Evidence hash + basic `evidenceService.ts`

### Phase 1 — Pilot
- [ ] ECAPA-TDNN speaker profile store (`SpeakerProfile.ts`)
- [ ] Cross-session consistency check (σ-based flagging)
- [ ] Enrollment governance flow (authenticated, not from live call)
- [ ] `voiceApi.ts` REST endpoints
- [ ] Webhook system for enterprise alerts
- [ ] India-specific fine-tuning (IndieFake, HAV-DF)
- [ ] Deepgram multi-language config
- [ ] Wav2Vec2-XLSR cascade (heavy pass, borderline-only)
- [ ] PDF report with voice forensics section
- [ ] Permissioned ledger anchoring (single-institution first)

### Phase 2 — Scale
- [ ] Telecom-grade VoIP integration via authorized media APIs
- [ ] Anomaly-based fallback detector (flags audio that doesn't fit bonafide OR known-spoof distribution)
- [ ] Multi-party blockchain consortium (telecom + bank)
- [ ] Full CIVIXSHIELD correlation (correlate voice incident with surrounding phishing messages/URLs)

---

## 📊 Demo Scenario (SIH Judges)

> **Scenario:** A bank employee receives a call from someone claiming to be the CFO, requesting authorization of an emergency ₹50 lakh fund transfer.

1. Employee opens VoiceShield, enters the caller's number.
2. Community DB: "Number not flagged." ✅
3. Employee puts phone on speaker. VoiceShield starts parallel audio analysis.
4. **~3 seconds:** Stage 1 — Voice Authenticity Score: **74% synthetic**. Artifacts detected: `["f0_too_regular", "spectral_smoothness", "no_breathing_proxy"]`
5. **Stage 2:** Groq contextual enrichment — transcript contains "₹50 lakh transfer immediately" + urgency framing. Impersonation Risk: **81/100**.
6. **Stage 3:** State = **Critical**. Security Risk Index = 88.
7. 🔴 **Full-screen interrupt:** "SYNTHETIC VOICE LIKELY — A financial transaction has been requested while voice risk is Critical. This action is held. Verify the CFO's identity through an independent channel before proceeding."
8. **OOB triggered:** Push notification sent to the employee's registered enterprise security app. "Confirm or deny: Did you initiate a ₹50L transfer request?"
9. **Speaker Profile:** "This number has no enrolled voice profile — identity cannot be verified."
10. Employee denies the request on their device. **Attack prevented.**
11. Incident report auto-generated with Stage 1/2/3 evidence trail, tamper-evident hash, and FIR text.

---

## 📁 New Files Summary

```
Dhwani-AI/
├── client/src/
│   ├── services/
│   │   └── audioFeatureExtractor.ts      [NEW] Browser DSP: mel-spec, CQT, MFCC, F0, ZCR
│   └── components/
│       ├── VoiceIntegrityPanel.tsx        [NEW] 5-state Security Risk gauge + evidence badges
│       ├── LivenessChallenge.tsx          [NEW] Active liveness challenge UI
│       ├── CoachingCard.tsx               [MODIFY] Add voice-clone 5-state alert variants
│       └── CallSession.tsx                [MODIFY] Add pre-transaction warning modal
│
└── server/src/
    ├── services/
    │   ├── voiceAuthService.ts            [NEW] Stage 1: AASIST + heuristics + cascade
    │   ├── identityContextService.ts      [NEW] Stage 2: ECAPA-TDNN + Groq impersonation
    │   ├── livenessService.ts             [NEW] Active liveness challenge-response
    │   ├── trustChannelService.ts         [NEW] Independent Trust Channel / OOB
    │   └── evidenceService.ts             [NEW] Tamper-evident hash + ledger anchor
    ├── models/
    │   └── SpeakerProfile.ts             [NEW] Cross-session ECAPA-TDNN embeddings
    └── routes/
        └── voiceApi.ts                   [NEW] REST API for enterprise integration
```

---

## 📚 Key Research Citations

| Citation | Relevance |
|---|---|
| Mittal et al., *PITCH*, ACM ASIA CCS 2025 | Direct prior art for audio challenge-response; 84.5% on 1.6M samples |
| Frank & Schönherr, *WaveFake*, NeurIPS 2021 | 100k+ clips, six vocoder architectures — benchmark |
| Shi et al., 2025 codec-robustness benchmark | Evaluation methodology for real-channel degradation |
| ASVspoof 2021 LA challenge | Gold standard spoof-detection benchmark |
| McAfee, "Artificial Imposter," 2023 | India-specific impact statistics |
| RBI V-CIP Master Direction | Regulatory alignment — liveness mandate |
| RBI 2026 Draft Guidance on Model Risk Management | Human-override requirement (already in our design) |
| Supreme Court suo motu digital-arrest proceedings, 2025–26 | Transaction-hold regulatory direction |
| DPDP Act 2023 | Privacy/consent legal framework |
