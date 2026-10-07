import { useState } from 'react';
import { HiOutlineArrowDown } from 'react-icons/hi2';
import {
  TbCpu,
  TbWaveSine,
  TbShieldLock,
  TbBinaryTree,
  TbDatabase,
  TbCheck,
  TbFingerprint,
  TbBroadcast,
  TbShieldCheck,
  TbAlertTriangle,
  TbFileReport,
  TbArrowsSplit,
  TbCode,
  TbCopy,
  TbTerminal2
} from 'react-icons/tb';

interface FlowNodeData {
  id: string;
  name: string;
  stage: string;
  tag: string;
  summary: string;
  input: string;
  inputSignals: string[];
  protocol: string;
  output: string;
  outputSignals: string[];
  downstreamAction: string;
  latency: string;
  samplePayload: Record<string, any>;
}

export default function ArchitectureView() {
  const [activeTab, setActiveTab] = useState<'all' | 'acoustic' | 'semantic' | 'intervention'>('all');
  const [selectedNode, setSelectedNode] = useState<string | null>('fusion');
  const [copiedPayload, setCopiedPayload] = useState(false);

  const flowNodes: Record<string, FlowNodeData> = {
    tap: {
      id: 'tap',
      name: 'WebAudio Parallel Audio Tap',
      stage: 'INGESTION LAYER',
      tag: 'Zero In-Call Delay • Sidecar Tap',
      summary: 'Non-blocking sidecar tap captures live audio via the Web Audio API at 16kHz/48kHz PCM. Bypasses persistent disk storage and adds 0ms conversational lag to the call.',
      input: 'Microphone / Call Audio Stream (48kHz/16kHz PCM)',
      inputSignals: [
        'WebAudio AudioWorklet Node',
        '16kHz / 48kHz Dual-Rate PCM',
        '12.8ms Chunk Ring Buffer',
        'Zero-Lag Telephony Sidecar Tap'
      ],
      protocol: 'RFC 3261 SIP Tap / WebAudio Stream',
      output: '250ms PCM 16-bit Float32 Ring Buffer Array',
      outputSignals: [
        'Non-blocking memory ring-buffer',
        'Zero conversational delay tap',
        'Raw audio never written to persistent disk'
      ],
      downstreamAction: 'Piped into Acoustic DSP Extractor and Deepgram STT simultaneously',
      latency: '0ms call lag (12.8ms frame tap buffer)',
      samplePayload: {
        channel: 'mono',
        sampleRate: 16000,
        quantumFrameMs: 12.8,
        inCallDelayMs: 0,
        inMemoryOnly: true
      }
    },
    dsp: {
      id: 'dsp',
      name: 'Acoustic DSP Feature Extractor',
      stage: 'STAGE 1: PHYSICAL LAYER',
      tag: 'Acoustic Physics',
      summary: 'Performs multi-band spectral analysis: Mel-spectrogram, Constant-Q Transform (CQT), pitch micro-jitter, amplitude shimmer, and zero-crossing rates.',
      input: '250ms PCM Audio Frames',
      inputSignals: [
        '13-Band Mel-Frequency Cepstral (MFCC)',
        'Constant-Q Phase Transform (CQT)',
        'F0 Fundamental Frequency Contour',
        'Amplitude Shimmer & Micro-Jitter Delta'
      ],
      protocol: 'DSP SIMD / WebAssembly Feature Pipeline',
      output: '13-Band MFCC + F0 Pitch Perturbation Matrix',
      outputSignals: [
        'Phase break anomaly coefficient',
        'HiFi-GAN vocoder spectral glitch tag',
        'Pitch micro-jitter stability index: 0.98'
      ],
      downstreamAction: 'Dispatched to AASIST neural anti-spoofing and heuristic voting gate',
      latency: '22ms DSP computation',
      samplePayload: {
        jitterPct: 0.082,
        shimmerDb: 0.19,
        f0StabilityScore: 0.98,
        spectralCentroidHz: 2340,
        neuralVocoderArtifactDetected: true
      }
    },
    aasist: {
      id: 'aasist',
      name: 'AASIST Neural Anti-Spoofing & Heuristic Voting',
      stage: 'STAGE 1: VAS ENGINE',
      tag: 'Neural Synthesis Detection',
      summary: 'Evaluates phase inconsistencies and vocoder signatures (HiFi-GAN, VITS, WaveNet) to produce the continuous Voice Authenticity Score (VAS).',
      input: 'Spectral Vectors + CQT Phase Inconsistencies',
      inputSignals: [
        'Spectral Graph Attention Vectors',
        'CQT Phase Angle Discontinuity Tensor',
        'Neural Vocoder Fingerprints (HiFi-GAN / VITS)',
        'Dual-Branch Audio Spectral Embeddings'
      ],
      protocol: 'PyTorch Graph Attention / ONNX Runtime',
      output: 'VAS Score (0-100) + Primary Artifact Signatures',
      outputSignals: [
        'VAS Score: 13/100 (Synthetic Voice)',
        'VocoderPhaseBreak Detected (Confidence: 0.96)',
        'AASIST Vote: 96% Synthetic Confidence',
        'Heuristic Vote: 89% Spectral Inconsistency'
      ],
      downstreamAction: 'Streamed directly to Stage 3 Security Policy Fusion Gate',
      latency: '35ms inference',
      samplePayload: {
        vasScore: 13,
        authenticity: 'Synthetic',
        primaryArtifact: 'VocoderPhaseBreak',
        aasistVote: 0.96,
        heuristicVote: 0.89
      }
    },
    stt: {
      id: 'stt',
      name: 'Deepgram Nova-2 Streaming Speech-to-Text',
      stage: 'STREAM B: CONVERSATION STACK',
      tag: 'Edge WebSocket STT',
      summary: 'Transcribes streaming speech in real-time over low-latency WebSockets. Maintains a 400-word rolling context buffer for semantic analysis.',
      input: 'Live PCM Audio Chunks',
      inputSignals: [
        'Continuous PCM In-Memory Audio Chunks',
        'Deepgram Nova-2 Streaming Speech Model',
        'Edge Bidirectional Encrypted WebSocket',
        'Sub-150ms Chunk Processing Window'
      ],
      protocol: 'WSS Secure Edge Audio Stream',
      output: 'Real-time Interim & Final Transcript Stream',
      outputSignals: [
        '400-word rolling context window',
        'Transcription confidence: 0.984',
        'Precise word-level millisecond timestamps',
        'PII-masked interim token emission'
      ],
      downstreamAction: 'Streams tokenized conversation context to Groq LPU Llama-3 Reasoner',
      latency: '150ms word latency',
      samplePayload: {
        model: 'nova-2-general',
        transcript: 'Police headquarters calling. Transfer money immediately to avoid arrest.',
        confidence: 0.984,
        wordsCount: 11
      }
    },
    groq: {
      id: 'groq',
      name: 'Groq LPU Llama-3 Scam Playbook Classifier',
      stage: 'STAGE 2: INTENT ENGINE',
      tag: 'Cognitive LLM Reasoner',
      summary: 'High-speed Groq LPU inference (500+ tokens/s) detects social engineering cues: Digital Arrest, Police extortion, OTP coercion, and fake emergency.',
      input: '400-Word Rolling Conversation Transcript',
      inputSignals: [
        '400-Word Rolling Context Buffer',
        'Indian Cybercrime Taxonomies (CBI/Police/FIR)',
        'High-Pressure Coercion Semantic Markers',
        'Digital Arrest & Instant Account Freeze Cues'
      ],
      protocol: 'Groq LPUs • Llama-3-70B (500+ tokens/s)',
      output: 'Scam Threat Category, Signal Severity, Counter-Coaching',
      outputSignals: [
        'Threat Type: DigitalArrestExtortion',
        'Intent Threat Score: 94/100 (Severe)',
        'Coercion Urgency Level: Extreme',
        'Dynamic Agent Defense Playbook Generated'
      ],
      downstreamAction: 'Dispatches intent threat vector to Stage 3 Policy Fusion Gate',
      latency: '120ms token completion',
      samplePayload: {
        threatType: 'DigitalArrestExtortion',
        intentScore: 94,
        urgencyLevel: 'Extreme',
        recommendedAction: 'Challenge Authority & Request Badge ID'
      }
    },
    biometric: {
      id: 'biometric',
      name: 'ECAPA-TDNN Speaker Identity Matching',
      stage: 'STAGE 2: BIOMETRIC VAULT',
      tag: 'Voiceprint Verification',
      summary: 'Extracts x-vector voice embeddings and calculates cosine similarity against enrolled family/executive voiceprints to detect deepfake impersonations.',
      input: 'Voice Embedding vs Enrolled Target Baseline',
      inputSignals: [
        '512-dim x-Vector Audio Embedding',
        'Enrolled Family / VIP Voiceprint Vault',
        'ECAPA-TDNN Deep Residual ConvNet',
        'Zero Raw Audio Retained (DPDP Vector Only)'
      ],
      protocol: 'Cosine Distance Vector Metric Engine',
      output: 'Cosine Distance Similarity & Impersonation Flag',
      outputSignals: [
        'Cosine Similarity: 0.42 (Severe Mismatch)',
        'Enrollment Baseline Threshold: 0.85',
        'Target Identity: Known Contact (Father)',
        'Impersonation Flag: TRUE'
      ],
      downstreamAction: 'Emits biometric impersonation delta to Stage 3 Policy Fusion Gate',
      latency: '40ms embedding check',
      samplePayload: {
        targetIdentity: 'Known_Contact_Father',
        cosineSimilarity: 0.42,
        baselineThreshold: 0.85,
        isImpersonating: true
      }
    },
    fusion: {
      id: 'fusion',
      name: 'Multi-Factor Security Policy Fusion Engine',
      stage: 'STAGE 3: CORE DECISION HUB',
      tag: 'Risk Matrix Aggregator',
      summary: 'Mathematically combines acoustic synthesis (VAS), speaker impersonation delta, cognitive scam intent, and transaction consequence into a graduated Security Risk Index.',
      input: 'f(VAS, Impersonation, ScamIntent, TransactionConsequence)',
      inputSignals: [
        'Acoustic Synthesis VAS: 13/100 (Synthetic)',
        'ECAPA-TDNN Impersonation Risk: 88/100',
        'Groq Playbook Intent Threat: 94/100',
        'Financial Consequence: HighTransfer Tier'
      ],
      protocol: 'Multi-Factor Bayesian Fusion (< 8ms)',
      output: 'Security Risk Index (0-100) & 5-State System Alert',
      outputSignals: [
        'Composite Security Risk Index: 91/100',
        '5-State System Threat: CRITICAL (Level 5)',
        'Pre-Transaction Intercept Directive Issued',
        'Cryptographic Merkle Proof Anchor Initiated'
      ],
      downstreamAction: 'Triggers Out-of-Band Financial Freeze & Live Call HUD Alert',
      latency: '< 8ms mathematical fusion',
      samplePayload: {
        vasScore: 13,
        impersonationRisk: 88,
        intentRisk: 94,
        consequenceLevel: 'HighFinancialTransfer',
        compositeRiskIndex: 91,
        alertState: 'Critical'
      }
    },
    oob: {
      id: 'oob',
      name: 'Out-Of-Band (OOB) Hold & Intervention',
      stage: 'INTERVENTION ENGINE',
      tag: 'Active Financial Defense',
      summary: 'When risk is Critical, places a pre-transaction hold on banking/UPI transfers and prompts the user on an independent channel the attacker cannot control.',
      input: 'Critical Risk Event & Active Transaction Attempt',
      inputSignals: [
        'Critical Composite Threat Score (91/100)',
        'Active High-Value Fund Transfer Triggered',
        'Suspicious Beneficiary Account Pattern',
        'Corroborated Biometric Impersonation Alert'
      ],
      protocol: 'Core Banking API Interceptor (ISO 20022)',
      output: 'Banking API Freeze Hold + Secondary Verification Modal',
      outputSignals: [
        'Intervention Hold ID: OOB-83670C7C',
        'Action: UPI_FUND_TRANSFER_FREEZE',
        'Financial Consequence Averted: ₹1,50,000',
        'Out-Of-Band Biometric Push Challenge Sent'
      ],
      downstreamAction: 'Freezes debit on core banking ledger pending secondary biometric proof',
      latency: 'Immediate interception',
      samplePayload: {
        holdId: 'OOB-83670C7C',
        action: 'UPI_FUND_TRANSFER_FREEZE',
        status: 'HELD_PENDING_BIOMETRIC_PROOF',
        consequenceAverted: '₹1,50,000'
      }
    },
    ledger: {
      id: 'ledger',
      name: 'Cryptographic Merkle Ledger & DPDP Guard',
      stage: 'GOVERNANCE & AUDIT',
      tag: 'Immutable Evidence Chain',
      summary: 'Hashes ephemeral risk telemetry into SHA-256 Merkle chain anchors for police cybercrime FIR generation (1930 / Sanchar Saathi). Purges all raw audio bytes.',
      input: 'Session Telemetry & PII-Scrubbed Transcript',
      inputSignals: [
        'Call Session Risk Telemetry Snapshot',
        'PII-Scrubbed Transcript (DPDP Act 2023)',
        'Timestamped Mathematical Decision Trail',
        'Zero Raw Audio Retained Compliance Proof'
      ],
      protocol: 'SHA-256 Merkle Audit Tree • DPDP Compliant',
      output: 'SHA-256 Merkle Hash Anchor + Police FIR PDF Export',
      outputSignals: [
        'SHA-256 Merkle Root Anchor Generated',
        'DPDP Compliance: 100% Zero Raw Audio Retained',
        'Police FIR Evidence Ready (1930 / Sanchar Saathi)',
        'Automated 90-Day Ephemeral Purge Cycle'
      ],
      downstreamAction: 'One-click cybercrime FIR packet ready for law enforcement dispatch',
      latency: 'Post-Call Instant Seal',
      samplePayload: {
        evidenceHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        dpdpCompliance: '100% Zero Raw Audio Retained',
        firExportReady: true
      }
    }
  };

  const selectedNodeData = selectedNode ? flowNodes[selectedNode] : null;

  const handleCopyPayload = (payload: any) => {
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const architecturePillars = [
    {
      category: 'Audio Ingestion',
      title: 'Real-Time WebAudio Tap & Parallel Stream',
      subtitle: 'Zero In-Call Delay (Sidecar Tap)',
      icon: TbBroadcast,
      border: 'border-amber-500/25 hover:border-amber-400/50',
      description: 'Sidecar audio capture using in-browser WebAudio API. Adds zero delay to active calls while streaming 16kHz/48kHz PCM frames directly to memory buffers.',
      features: ['Web Audio API Tap', 'PCM 16-bit Mono', 'Rolling Ring Buffer', 'Dual Parallel WebSocket Stream'],
      benchmark: '0ms In-Call Delay • 12ms Tap Buffer',
      type: 'acoustic'
    },
    {
      category: 'Stage 1 Acoustic Engine',
      title: 'Acoustic DSP & Neural Anti-Spoofing',
      subtitle: 'Voice Authenticity Score (VAS 0–100)',
      icon: TbWaveSine,
      border: 'border-cyan-500/25 hover:border-cyan-400/50',
      description: 'Extracts physical vocal synthesis artifacts: Jitter (pitch perturbation), Shimmer (amplitude perturbation), and AASIST neural anti-spoofing votes.',
      features: ['MFCC 13-band Analysis', 'F0 Pitch Autocorrelation', 'Spectral Centroid', 'AASIST Artifact Classifier'],
      benchmark: 'Continuous VAS Telemetry',
      type: 'acoustic'
    },
    {
      category: 'Stage 2 Biometrics',
      title: 'Speaker Verification & Identity Matching',
      subtitle: 'Target vs. Reference Cosine Similarity',
      icon: TbFingerprint,
      border: 'border-teal-500/25 hover:border-teal-400/50',
      description: 'Extracts neural voice embeddings and computes cosine distance against authentic enrolled voice baselines to catch high-fidelity synthetic clones.',
      features: ['ECAPA-TDNN Embeddings', 'Cosine Distance Metric', 'Voice Enrollment Vault', 'Cross-Session Speaker Consistency'],
      benchmark: '0.88 Cosine Threshold',
      type: 'semantic'
    },
    {
      category: 'Stage 2 Semantic AI',
      title: 'Streaming STT & LPU Threat Classifier',
      subtitle: 'Deepgram Nova-2 + Groq Llama 3',
      icon: TbCpu,
      border: 'border-purple-500/25 hover:border-purple-400/50',
      description: 'Deepgram edge WebSocket generates rolling transcripts that feed into Groq LPU Llama-3-70B to match real-time manipulation playbooks.',
      features: ['Deepgram Nova-2 STT', 'Groq LPU (500+ tokens/s)', 'Scam Playbook Engine', '400-Word Context Window'],
      benchmark: '120ms Inference Loop',
      type: 'semantic'
    },
    {
      category: 'Stage 3 Policy & Defense',
      title: 'Consequence Escalation & Out-Of-Band (OOB)',
      subtitle: 'Automated Financial Intervention',
      icon: TbShieldLock,
      border: 'border-amber-500/25 hover:border-amber-400/50',
      description: 'When composite risk exceeds critical thresholds, automatically triggers pre-transaction holds on banking APIs and forces independent challenge verification.',
      features: ['Pre-Transaction Hold API', 'OOB Secondary Channel', '5-Tier Coaching Matrix', 'Biometric Liveness Challenge'],
      benchmark: 'Immediate Fund Protection',
      type: 'intervention'
    },
    {
      category: 'Data Governance',
      title: 'Cryptographic Ledger & DPDP Compliance',
      subtitle: 'SHA-256 Merkle Audit Chain',
      icon: TbDatabase,
      border: 'border-emerald-500/25 hover:border-emerald-400/50',
      description: 'Hashes risk vectors into an immutable SHA-256 Merkle chain for 1930 / Sanchar Saathi cybercrime FIR reports. Discards all raw audio to uphold DPDP Act 2023.',
      features: ['SHA-256 Merkle Tree', 'DPDP Act 2023 Compliant', 'Zero Raw Audio Storage', 'Automated Police FIR Export'],
      benchmark: '100% Ephemeral Memory',
      type: 'intervention'
    }
  ];

  const filteredPillars = activeTab === 'all'
    ? architecturePillars
    : architecturePillars.filter(p => p.type === activeTab);

  return (
    <div className="min-h-screen text-white pt-4 sm:pt-6 pb-20 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12 relative z-10 w-full max-w-full overflow-hidden">

      {/* Background ambient aesthetic */}
      <div className="animated-grid-bg opacity-25 pointer-events-none" />

      {/* ─── Hero Section ─── */}
      <div className="text-center max-w-4xl mx-auto space-y-4 pt-4 sm:pt-6">
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold font-brand tracking-tight text-white leading-tight sm:leading-[1.12]">
          System{' '}
          <span className="font-serif italic font-normal text-4xl sm:text-6xl lg:text-7xl bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-300 bg-clip-text text-transparent px-1">
            Architecture
          </span>{' '}
          &amp; Pipeline
        </h1>

        <p className="text-sm sm:text-base text-white/70 max-w-2xl mx-auto leading-relaxed font-sans font-normal">
          How Dhwani AI combines zero-latency in-browser audio DSP, dual-stream neural anti-spoofing (AASIST), Groq ultra-fast Llama-3 semantic reasoning, and Out-of-Band financial escalation.
        </p>

        {/* Technical Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 max-w-3xl mx-auto">
          <div className="rounded-xl glass-card border border-white/10 p-2.5 text-center">
            <span className="text-[10px] font-mono text-white/50 uppercase block">In-Call Latency</span>
            <span className="text-sm sm:text-base font-mono font-bold text-amber-300">0ms Lag</span>
          </div>
          <div className="rounded-xl glass-card border border-white/10 p-2.5 text-center">
            <span className="text-[10px] font-mono text-white/50 uppercase block">Acoustic VAS Engine</span>
            <span className="text-sm sm:text-base font-mono font-bold text-cyan-300">&lt; 35ms Inference</span>
          </div>
          <div className="rounded-xl glass-card border border-white/10 p-2.5 text-center">
            <span className="text-[10px] font-mono text-white/50 uppercase block">Groq LPU Reasoning</span>
            <span className="text-sm sm:text-base font-mono font-bold text-purple-300">120ms Loop</span>
          </div>
          <div className="rounded-xl glass-card border border-white/10 p-2.5 text-center">
            <span className="text-[10px] font-mono text-white/50 uppercase block">Data Retention</span>
            <span className="text-sm sm:text-base font-mono font-bold text-emerald-400">0 Bytes Audio Stored</span>
          </div>
        </div>
      </div>

      {/* ─── SYSTEM BLUEPRINT FLOWCHART CANVAS (CIRCUIT DIAGRAM) ─── */}
      <div className="rounded-3xl glass-card-strong border border-amber-500/25 shadow-[0_20px_60px_rgba(0,0,0,0.7),0_0_30px_rgba(255,109,0,0.1)] overflow-hidden relative">

    
        <div className="absolute inset-0 bg-[radial-gradient(#f59e0b12_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-50" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

    
        <div className="relative z-10 px-5 sm:px-8 py-4 border-b border-white/10 bg-[#0B1523]/80 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shadow-[0_0_15px_rgba(255,109,0,0.25)]">
              <TbBinaryTree className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm sm:text-base tracking-tight flex items-center gap-2 font-brand">
                <span>Interactive Pipeline Flowchart</span>
                <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  LIVE CIRCUIT
                </span>
              </h3>
              <p className="text-[11px] text-white/60 font-sans">
                Click any node below to inspect live telemetry payloads, input interfaces, and sub-layer benchmarks.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-white/60 self-start sm:self-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(255,171,0,0.8)]" />
              Dual Parallel Streams
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px]">
              <TbShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              DPDP Act 2023
            </span>
          </div>
        </div>

      
        <div className="relative z-10 p-5 sm:p-8 lg:p-10 space-y-8">

          {/* ──────── LANE 1: INGESTION NODE ──────── */}
          <div className="flex justify-center">
            <div
              onClick={() => setSelectedNode('tap')}
              className={`w-full max-w-xl cursor-pointer p-5 rounded-2xl transition-all duration-300 border flex flex-col justify-between relative overflow-hidden group ${selectedNode === 'tap'
                  ? 'bg-[#132238]/90 border-amber-400 shadow-[0_0_30px_rgba(255,109,0,0.3)] ring-1 ring-amber-400/50'
                  : 'glass-card border-white/10 hover:border-amber-500/50 hover:bg-[#132238]/60 hover:shadow-[0_0_20px_rgba(255,109,0,0.15)]'
                }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                  <TbBroadcast className="w-3.5 h-3.5" />
                  DATA SOURCE &bull; PARALLEL INGESTION
                </span>
                <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  0ms call delay &bull; 12.8ms buffer
                </span>
              </div>
              <h4 className="text-base font-bold text-white tracking-tight font-brand group-hover:text-amber-300 transition-colors">
                In-Browser WebAudio API Parallel Tap
              </h4>
              <p className="text-xs text-white/65 mt-1 font-sans leading-relaxed">
                Dual-stream sidecar capture runs non-intrusively on client audio frames (16kHz / 48kHz PCM). Adds 0ms delay to the live call and bypasses server disk entirely.
              </p>
            </div>
          </div>

          {/* Connecting Fork Bus with Branching Paths */}
          <div className="relative flex justify-center items-center my-[-10px]">
            <div className="w-full max-w-2xl flex flex-col items-center">
              {/* Vertical Stem */}
              <div className="w-0.5 h-6 bg-gradient-to-b from-amber-400 to-white/40" />
              <div className="w-full h-0.5 bg-white/20 relative">
                <div className="absolute left-0 top-[-3px] w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                <div className="absolute right-0 top-[-3px] w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                <div className="absolute left-1/2 -translate-x-1/2 -top-2.5 px-3 py-0.5 rounded-full bg-[#08101A] border border-white/15 text-[10px] font-mono text-amber-300 font-semibold tracking-wider">
                  PARALLEL NON-CONTAMINATING TAP
                </div>
              </div>
              <div className="w-full flex justify-between px-6">
                <div className="w-0.5 h-6 bg-gradient-to-b from-white/20 to-cyan-400" />
                <div className="w-0.5 h-6 bg-gradient-to-b from-white/20 to-purple-400" />
              </div>
            </div>
          </div>

          {/* ──────── LANE 2: DUAL STREAM ENGINES (ACOUSTIC VS SEMANTIC) ──────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">

            {/* TRACK A: ACOUSTIC DSP & NEURAL SYNTHESIS (STAGE 1) */}
            <div className="p-5 sm:p-6 rounded-2xl bg-[#091524]/90 border border-cyan-500/30 space-y-4 shadow-xl relative backdrop-blur-xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                  <span className="font-mono text-xs font-bold text-cyan-300 uppercase tracking-wider">
                    TRACK A: ACOUSTIC DSP &amp; VAS
                  </span>
                </div>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                  STAGE 1
                </span>
              </div>

            
              <div
                onClick={() => setSelectedNode('dsp')}
                className={`p-4 rounded-xl cursor-pointer transition-all border group ${selectedNode === 'dsp'
                    ? 'bg-cyan-950/50 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400/50'
                    : 'bg-black/30 hover:bg-black/50 border-white/10 hover:border-cyan-500/40'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5 font-brand group-hover:text-cyan-300 transition-colors">
                    <TbWaveSine className="w-4 h-4 text-cyan-400" />
                    Browser DSP Feature Extractor
                  </h5>
                  <span className="text-[10px] font-mono text-white/50">250ms Window</span>
                </div>
                <p className="text-[11px] text-white/60 mt-1.5 font-sans leading-relaxed">
                  Extracts Mel-spectrogram, CQT, 13-band MFCC, pitch (F0) micro-perturbations, and amplitude jitter.
                </p>
              </div>

              <div className="flex justify-center my-[-4px]">
                <HiOutlineArrowDown className="w-3.5 h-3.5 text-cyan-400/60" />
              </div>

              {/* Subnode 2: AASIST Neural Engine */}
              <div
                onClick={() => setSelectedNode('aasist')}
                className={`p-4 rounded-xl cursor-pointer transition-all border group ${selectedNode === 'aasist'
                    ? 'bg-cyan-950/50 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400/50'
                    : 'bg-black/30 hover:bg-black/50 border-white/10 hover:border-cyan-500/40'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5 font-brand group-hover:text-cyan-300 transition-colors">
                    <TbShieldCheck className="w-4 h-4 text-cyan-400" />
                    AASIST Anti-Spoofing &amp; Heuristic Voting
                  </h5>
                  <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
                    VAS Telemetry
                  </span>
                </div>
                <p className="text-[11px] text-white/60 mt-1.5 font-sans leading-relaxed">
                  Evaluates neural vocoder phase breaks (HiFi-GAN, VITS). Outputs continuous <strong className="text-cyan-200">Voice Authenticity Score (VAS 0–100)</strong>.
                </p>
              </div>
            </div>

            {/* TRACK B: SEMANTIC REASONING & IDENTITY (STAGE 2) */}
            <div className="p-5 sm:p-6 rounded-2xl bg-[#140C24]/90 border border-purple-500/30 space-y-4 shadow-xl relative backdrop-blur-xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                  <span className="font-mono text-xs font-bold text-purple-300 uppercase tracking-wider">
                    TRACK B: SEMANTIC &amp; IDENTITY
                  </span>
                </div>
                <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                  STAGE 2
                </span>
              </div>

              {/* Subnode 1: Deepgram STT */}
              <div
                onClick={() => setSelectedNode('stt')}
                className={`p-4 rounded-xl cursor-pointer transition-all border group ${selectedNode === 'stt'
                    ? 'bg-purple-950/50 border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.3)] ring-1 ring-purple-400/50'
                    : 'bg-black/30 hover:bg-black/50 border-white/10 hover:border-purple-500/40'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5 font-brand group-hover:text-purple-300 transition-colors">
                    <TbBroadcast className="w-4 h-4 text-purple-400" />
                    Deepgram Nova-2 Streaming STT
                  </h5>
                  <span className="text-[10px] font-mono text-white/50">WebSocket</span>
                </div>
                <p className="text-[11px] text-white/60 mt-1.5 font-sans leading-relaxed">
                  Edge WebSockets generate instant interim and final transcripts with rolling 400-word memory window.
                </p>
              </div>

              {/* Connector Arrow */}
              <div className="flex justify-center my-[-4px]">
                <HiOutlineArrowDown className="w-3.5 h-3.5 text-purple-400/60" />
              </div>

              {/* Subnode 2: Groq LPU Llama 3 & Biometrics */}
              <div
                onClick={() => setSelectedNode('groq')}
                className={`p-4 rounded-xl cursor-pointer transition-all border group ${selectedNode === 'groq'
                    ? 'bg-purple-950/50 border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.3)] ring-1 ring-purple-400/50'
                    : 'bg-black/30 hover:bg-black/50 border-white/10 hover:border-purple-500/40'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5 font-brand group-hover:text-purple-300 transition-colors">
                    <TbCpu className="w-4 h-4 text-purple-400" />
                    Groq LPU Llama-3 + ECAPA-TDNN Matching
                  </h5>
                  <span className="text-[10px] font-mono text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/30">
                    Scam Playbooks
                  </span>
                </div>
                <p className="text-[11px] text-white/60 mt-1.5 font-sans leading-relaxed">
                  Detects extortion tactics (Digital Arrest, Police impersonation) and verifies speaker voiceprint consistency.
                </p>
              </div>
            </div>

          </div>

          {/* Connecting Convergence Bus (Both streams merge into Fusion Hub) */}
          <div className="relative flex justify-center items-center my-[-10px]">
            <div className="w-full max-w-2xl flex flex-col items-center">
              {/* Two Branch Converge Inward Stems */}
              <div className="w-full flex justify-between px-6">
                <div className="w-0.5 h-6 bg-gradient-to-b from-cyan-400 to-white/20" />
                <div className="w-0.5 h-6 bg-gradient-to-b from-purple-400 to-white/20" />
              </div>
              {/* Horizontal Merge Bar */}
              <div className="w-full h-0.5 bg-white/20 relative">
                <div className="absolute left-1/2 -translate-x-1/2 -top-2.5 px-3 py-0.5 rounded-full bg-[#08101A] border border-white/20 text-[10px] font-mono text-amber-300 font-bold tracking-wider">
                  CONVERGENCE &bull; RISK AGGREGATION
                </div>
              </div>
              {/* Center Drop Stem */}
              <div className="w-0.5 h-6 bg-gradient-to-b from-white/20 to-amber-400" />
            </div>
          </div>

          {/* ──────── LANE 3: STAGE 3 SECURITY POLICY FUSION GATE ──────── */}
          <div className="flex justify-center">
            <div
              onClick={() => setSelectedNode('fusion')}
              className={`w-full max-w-2xl cursor-pointer p-6 rounded-2xl transition-all duration-300 border flex flex-col justify-between relative overflow-hidden group ${selectedNode === 'fusion'
                  ? 'bg-gradient-to-r from-orange-950/70 via-[#0e1d2c] to-amber-950/70 border-amber-400 shadow-[0_0_30px_rgba(255,109,0,0.35)] ring-1 ring-amber-400/50'
                  : 'bg-[#0A1726]/80 hover:bg-[#0e1d2c] border-amber-500/30 shadow-lg'
                }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(255,171,0,0.8)]" />
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-amber-300">
                    SECURITY POLICY FUSION GATE
                  </span>
                </div>
                <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  F = f(V, I, Intent, Consequence)
                </span>
              </div>

              <h4 className="text-base sm:text-lg font-bold text-white tracking-tight font-brand group-hover:text-amber-300 transition-colors">
                Graduated Multi-Factor Risk Assessment Engine
              </h4>
              <p className="text-xs text-white/60 mt-1 font-sans leading-relaxed">
                Synthesizes the physical Voice Authenticity Score (VAS), speaker consistency, and conversational extortion indicators into a definitive <strong className="text-amber-300">Security Risk Index (0–100)</strong>.
              </p>

              {/* 5-State Graduated Response Indicator */}
              <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-mono text-white/50">Graduated Risk Response:</span>
                <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">Safe (&lt;30)</span>
                  <span className="text-white/20">&rarr;</span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300">Watch (30-49)</span>
                  <span className="text-white/20">&rarr;</span>
                  <span className="px-2 py-0.5 rounded bg-orange-500/15 border border-orange-500/30 text-orange-400">Suspicious (50-69)</span>
                  <span className="text-white/20">&rarr;</span>
                  <span className="px-2 py-0.5 rounded bg-red-500/20 border border-red-500/40 text-red-400">Critical (&ge;70)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Connecting Fork Bus from Fusion Gate to Outcomes */}
          <div className="relative flex justify-center items-center my-[-10px]">
            <div className="w-full max-w-xl flex flex-col items-center">
              <div className="w-0.5 h-6 bg-gradient-to-b from-amber-400 to-white/40" />
              <div className="w-full h-0.5 bg-white/20 relative">
                <div className="absolute left-0 top-[-3px] w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                <div className="absolute right-0 top-[-3px] w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              </div>
              <div className="w-full flex justify-between px-6">
                <div className="w-0.5 h-6 bg-gradient-to-b from-white/20 to-amber-400" />
                <div className="w-0.5 h-6 bg-gradient-to-b from-white/20 to-emerald-400" />
              </div>
            </div>
          </div>

          {/* ──────── LANE 4: ACTIVE INTERVENTION & COMPLIANCE SINKS ──────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Outcome 1: Out-of-Band Financial Intervention */}
            <div
              onClick={() => setSelectedNode('oob')}
              className={`p-5 rounded-2xl cursor-pointer transition-all border flex flex-col justify-between group ${selectedNode === 'oob'
                  ? 'bg-gradient-to-b from-amber-950/60 to-[#0B1523] border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.3)] ring-1 ring-amber-400/40'
                  : 'bg-[#091522]/80 hover:bg-[#0c1a2b] border-amber-500/30 hover:border-amber-400/50'
                }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold uppercase text-amber-400 flex items-center gap-1.5">
                  <TbAlertTriangle className="w-3.5 h-3.5" />
                  HIGH RISK &bull; OOB INTERVENTION
                </span>
                <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  Pre-Transaction Hold
                </span>
              </div>
              <h5 className="font-bold text-white text-sm sm:text-base font-brand group-hover:text-amber-300 transition-colors">
                Independent Trust Channel &amp; Banking API Hold
              </h5>
              <p className="text-xs text-white/60 mt-1 font-sans leading-relaxed">
                Automatically freezes high-value UPI/NEFT transactions and forces user confirmation via secondary verified channel that the attacker does not control.
              </p>
            </div>

            {/* Outcome 2: Cryptographic Ledger & Legal Audit */}
            <div
              onClick={() => setSelectedNode('ledger')}
              className={`p-5 rounded-2xl cursor-pointer transition-all border flex flex-col justify-between group ${selectedNode === 'ledger'
                  ? 'bg-gradient-to-b from-emerald-950/60 to-[#0B1523] border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.3)] ring-1 ring-emerald-400/40'
                  : 'bg-[#091522]/80 hover:bg-[#0c1a2b] border-emerald-500/30 hover:border-emerald-400/50'
                }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold uppercase text-emerald-400 flex items-center gap-1.5">
                  <TbFileReport className="w-3.5 h-3.5" />
                  AUDIT CHAIN &bull; DPDP ACT 2023
                </span>
                <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  SHA-256 Merkle Anchor
                </span>
              </div>
              <h5 className="font-bold text-white text-sm sm:text-base font-brand group-hover:text-emerald-300 transition-colors">
                Tamper-Evident Evidence Ledger &amp; Audio Purge
              </h5>
              <p className="text-xs text-white/60 mt-1 font-sans leading-relaxed">
                Hashes risk indicators into an immutable cryptographic chain for 1930 Cybercrime Police FIR generation while discarding raw audio to uphold DPDP Act 2023.
              </p>
            </div>

          </div>

        </div>

        {/* ──────── LIVE TELEMETRY & PAYLOAD INSPECTOR DOCK ──────── */}
        {selectedNodeData && (
          <div className="relative z-10 m-5 sm:m-8 p-5 sm:p-6 rounded-2xl glass-card-strong border border-amber-500/30 backdrop-blur-2xl space-y-4 shadow-[0_15px_40px_rgba(0,0,0,0.6)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/10 gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
                  <TbTerminal2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold">
                      {selectedNodeData.stage}
                    </span>
                    <h4 className="font-bold text-white text-sm sm:text-base font-brand tracking-tight">
                      {selectedNodeData.name}
                    </h4>
                  </div>
                  <span className="text-[11px] font-mono text-white/50">{selectedNodeData.tag}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-xs font-mono text-cyan-300 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/25">
                  Latency: {selectedNodeData.latency}
                </span>
                <button
                  onClick={() => handleCopyPayload(selectedNodeData.samplePayload)}
                  className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-white/90 text-xs font-mono flex items-center gap-1.5 transition-all border border-white/10 cursor-pointer"
                >
                  {copiedPayload ? (
                    <>
                      <TbCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <TbCopy className="w-3.5 h-3.5 text-amber-400" />
                      <span>Copy JSON</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <p className="text-xs text-white/70 font-sans leading-relaxed">
              {selectedNodeData.summary}
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs font-mono pt-1 items-stretch">
              {/* Card 1: Input Ingestion Interface */}
              <div className="p-4 rounded-xl bg-black/50 border border-white/[0.08] flex flex-col justify-between space-y-3 hover:border-cyan-500/30 transition-all">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-white/50 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5">
                      <TbArrowsSplit className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Input Ingestion Interface</span>
                    </span>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/25">
                      INBOUND
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-black/60 border border-cyan-500/20 text-cyan-200 text-[11px] font-mono leading-relaxed shadow-inner">
                    {selectedNodeData.input}
                  </div>
                  <div className="space-y-1.5 pt-0.5">
                    <span className="text-[10px] uppercase font-semibold text-white/40 block">
                      Ingestion Vectors &amp; Sources:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {selectedNodeData.inputSignals.map((sig, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/[0.03] border border-white/[0.06] text-[10px] text-white/80"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                          <span className="truncate">{sig}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="pt-2 border-t border-white/[0.06] text-[10px] text-white/50 flex items-center justify-between">
                  <span className="text-white/40 font-semibold">Protocol:</span>
                  <span className="font-mono text-cyan-300/90">{selectedNodeData.protocol}</span>
                </div>
              </div>

              {/* Card 2: Output Telemetry & Actions */}
              <div className="p-4 rounded-xl bg-black/50 border border-white/[0.08] flex flex-col justify-between space-y-3 hover:border-amber-500/30 transition-all">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-white/50 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5">
                      <TbShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                      <span>Output Telemetry &amp; Actions</span>
                    </span>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/25">
                      DISPATCH READY
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[11px] font-mono font-medium leading-relaxed shadow-inner">
                    {selectedNodeData.output}
                  </div>
                  <div className="space-y-1.5 pt-0.5">
                    <span className="text-[10px] uppercase font-semibold text-white/40 block">
                      Downstream Signals &amp; Directives:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {selectedNodeData.outputSignals.map((sig, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-500/[0.05] border border-amber-500/15 text-[10px] text-amber-200/90"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                          <span className="truncate">{sig}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="pt-2 border-t border-white/[0.06] text-[10px] text-white/50 flex items-center gap-1.5">
                  <span className="text-amber-400 font-bold shrink-0">Policy:</span>
                  <span className="truncate text-white/70">{selectedNodeData.downstreamAction}</span>
                </div>
              </div>

              {/* Card 3: Telemetry Payload Schema */}
              <div className="p-4 rounded-xl bg-black/50 border border-white/[0.08] flex flex-col justify-between space-y-3 hover:border-cyan-500/30 transition-all">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-white/50 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5">
                      <TbCode className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Telemetry Payload Schema</span>
                    </span>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-white/10 text-white/70 border border-white/10">
                      LIVE SCHEMA
                    </span>
                  </div>
                  <pre className="p-2.5 rounded-lg bg-black/80 text-[11px] text-cyan-300 font-mono overflow-x-auto border border-white/10 leading-relaxed max-h-[175px] overflow-y-auto">
                    {JSON.stringify(selectedNodeData.samplePayload, null, 2)}
                  </pre>
                </div>
                <div className="pt-2 border-t border-white/[0.06] text-[10px] text-white/40 flex items-center justify-between">
                  <span>Cryptographic Anchor</span>
                  <span className="text-emerald-400 font-mono text-[9px] flex items-center gap-1">
                    <TbCheck className="w-3 h-3" /> VERIFIED PAYLOAD
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ─── DETAILED SUBSYSTEM ARCHITECTURAL CARDS ─── */}
      <div className="space-y-6">

        {/* Filter Navigation Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/[0.08]">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold font-brand text-white tracking-tight flex items-center gap-2">
              <TbBinaryTree className="w-5 h-5 text-amber-400" />
              <span>System Modules &amp; Subsystems</span>
            </h3>
            <p className="text-xs sm:text-sm text-white/60 font-sans">
              Component deep dive with performance benchmarks, protocol specifications, and security policies.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10 text-xs">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${activeTab === 'all'
                  ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-sm shadow-orange-500/20'
                  : 'text-white/60 hover:text-white'
                }`}
            >
              All Modules
            </button>
            <button
              onClick={() => setActiveTab('acoustic')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${activeTab === 'acoustic'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-white/60 hover:text-white'
                }`}
            >
              Acoustic DSP
            </button>
            <button
              onClick={() => setActiveTab('semantic')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${activeTab === 'semantic'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                  : 'text-white/60 hover:text-white'
                }`}
            >
              Semantic &amp; Identity
            </button>
            <button
              onClick={() => setActiveTab('intervention')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${activeTab === 'intervention'
                  ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-sm shadow-orange-500/20'
                  : 'text-white/60 hover:text-white'
                }`}
            >
              Policy &amp; Legal
            </button>
          </div>
        </div>

       
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="rounded-3xl p-6 glass-card border border-white/10 hover:border-amber-500/50 hover:shadow-[0_20px_50px_rgba(0,0,0,0.7),0_0_25px_rgba(255,109,0,0.15)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-[10px] font-mono font-semibold text-white/70 uppercase tracking-wider">
                      {pillar.category}
                    </span>

                    <div className="w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-amber-400 group-hover:scale-105 group-hover:border-amber-500/40 group-hover:bg-amber-500/10 transition-all shadow-inner">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h4 className="text-base sm:text-lg font-bold text-white tracking-tight mb-1 font-brand group-hover:text-amber-300 transition-colors">
                    {pillar.title}
                  </h4>
                  <p className="text-xs font-mono text-amber-400/90 font-medium mb-3">
                    {pillar.subtitle}
                  </p>

                  <p className="text-xs text-white/60 leading-relaxed mb-5 font-sans">
                    {pillar.description}
                  </p>
                </div>

              
                <div className="pt-4 border-t border-white/[0.08] space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {pillar.features.map((feature) => (
                      <span
                        key={feature}
                        className="px-2.5 py-1 rounded-lg bg-white/[0.03] text-[10px] text-white/75 font-mono border border-white/5 hover:border-white/15 transition-colors"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-white/50 pt-1">
                    <span>Benchmark:</span>
                    <span className="text-amber-300 font-semibold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {pillar.benchmark}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>



    </div>
  );
}
