import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  TbCpu, 
  TbWaveSine, 
  TbShieldLock, 
  TbBinaryTree, 
  TbBolt, 
  TbDatabase, 
  TbArrowRight, 
  TbCheck, 
  TbFingerprint,
  TbBroadcast,
  TbShieldCheck,
  TbLockCheck,
  TbAlertTriangle,
  TbFileReport,
  TbArrowsSplit,
  TbCircleCheck,
  TbInfoCircle,
  TbCode,
  TbActivity
} from 'react-icons/tb';
import { 
  HiOutlineServerStack, 
  HiOutlineSparkles, 
  HiOutlineLockClosed,
  HiOutlineShieldCheck,
  HiOutlineArrowLongRight,
  HiOutlineArrowDown
} from 'react-icons/hi2';

interface FlowNodeData {
  id: string;
  name: string;
  stage: string;
  tag: string;
  summary: string;
  input: string;
  output: string;
  latency: string;
  samplePayload: Record<string, any>;
}

export default function ArchitectureView() {
  const [activeTab, setActiveTab] = useState<'all' | 'acoustic' | 'semantic' | 'intervention'>('all');
  const [selectedNode, setSelectedNode] = useState<string | null>('fusion');

  const flowNodes: Record<string, FlowNodeData> = {
    tap: {
      id: 'tap',
      name: 'WebAudio Parallel Audio Tap',
      stage: 'INGESTION LAYER',
      tag: 'Zero In-Call Delay • Sidecar Tap',
      summary: 'Non-blocking sidecar tap captures live audio via the Web Audio API at 16kHz/48kHz PCM. Bypasses persistent disk storage and adds 0ms conversational lag to the call.',
      input: 'Microphone / Call Audio Stream (48kHz/16kHz PCM)',
      output: '250ms PCM 16-bit Float32 Ring Buffer Array',
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
      output: '13-Band MFCC + F0 Pitch Perturbation Matrix',
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
      output: 'VAS Score (0-100) + Primary Artifact Signatures',
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
      output: 'Real-time Interim & Final Transcript Stream',
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
      output: 'Scam Threat Category, Signal Severity, Counter-Coaching',
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
      output: 'Cosine Distance Similarity & Impersonation Flag',
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
      output: 'Security Risk Index (0-100) & 5-State System Alert',
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
      output: 'Banking API Freeze Hold + Secondary Verification Modal',
      latency: 'Immediate interception',
      samplePayload: {
        holdId: 'OOB-83670C7C',
        action: 'UPI_FUND_TRANSFER_FREEZE',
        status: 'HELD_PENDING_BIOMETRIC_PROOF',
        consequenceAverted: 'Rs 1,50,000'
      }
    },
    ledger: {
      id: 'ledger',
      name: 'Cryptographic Merkle Ledger & DPDP Guard',
      stage: 'GOVERNANCE & AUDIT',
      tag: 'Immutable Evidence Chain',
      summary: 'Hashes ephemeral risk telemetry into SHA-256 Merkle chain anchors for police cybercrime FIR generation (1930 / Sanchar Saathi). Purges all raw audio bytes.',
      input: 'Session Telemetry & PII-Scrubbed Transcript',
      output: 'SHA-256 Merkle Hash Anchor + Police FIR PDF Export',
      latency: 'Post-Call Instant Seal',
      samplePayload: {
        evidenceHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        dpdpCompliance: '100% Zero Raw Audio Retained',
        firExportReady: true
      }
    }
  };

  const selectedNodeData = selectedNode ? flowNodes[selectedNode] : null;

  const architecturePillars = [
    {
      category: 'Audio Ingestion',
      title: 'Real-Time WebAudio Tap & Parallel Stream',
      subtitle: 'Zero In-Call Delay (Sidecar Tap)',
      icon: TbBroadcast,
      border: 'border-emerald-500/30 hover:border-emerald-400/60',
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
      border: 'border-cyan-500/30 hover:border-cyan-400/60',
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
      border: 'border-teal-500/30 hover:border-teal-400/60',
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
      border: 'border-purple-500/30 hover:border-purple-400/60',
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
      border: 'border-amber-500/30 hover:border-amber-400/60',
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
      border: 'border-emerald-500/30 hover:border-emerald-400/60',
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
    <div className="min-h-screen text-white pt-4 sm:pt-6 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      
      {/* Page Title Header */}
      <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono font-semibold tracking-wider">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          SYSTEM BLUEPRINT &bull; SPECIFICATION
        </div>
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold font-brand tracking-tight text-white leading-[1.15]">
          System{' '}
          <span className="font-serif italic font-normal text-4xl sm:text-6xl lg:text-7xl bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent px-1">
            Architecture
          </span>{' '}
          &amp; Pipeline
        </h1>
        <p className="text-sm sm:text-base text-white/70 max-w-2xl mx-auto leading-relaxed font-normal">
          How Dhwani AI combines zero-latency in-browser audio DSP, dual-stream neural anti-spoofing (AASIST), Groq ultra-fast Llama-3 semantic reasoning, and Out-of-Band financial escalation.
        </p>
      </div>

      {/* ─── SYSTEM BLUEPRINT FLOWCHART CANVAS (HANDCRAFTED ARCHITECTURAL DIAGRAM) ─── */}
      <div className="mb-16">
        <div className="rounded-3xl border border-white/15 bg-[#08101A] shadow-[0_20px_60px_rgba(0,0,0,0.7),0_0_30px_rgba(16,185,129,0.06)] overflow-hidden relative">
          
          {/* Engineering Canvas Blueprint Grid Background */}
          <div className="absolute inset-0 bg-[radial-gradient(#38bdf818_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none opacity-60" />
          
          {/* Flowchart Control Strip Header */}
          <div className="relative z-10 px-6 py-4 border-b border-white/10 bg-[#0B1523]/80 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-sm">
                <TbBinaryTree className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm sm:text-base tracking-tight flex items-center gap-2">
                  <span>Pipeline Execution Flowchart</span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Live Circuit
                  </span>
                </h3>
                <p className="text-[11px] text-white/50">
                  Click any block to inspect live protocol telemetry, latency benchmarks, and payload schemas
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-white/50 self-start sm:self-auto">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Sub-150ms Loop
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                Zero Disk Write
              </span>
            </div>
          </div>

          {/* Flowchart Visual Grid Board */}
          <div className="relative z-10 p-6 sm:p-10 space-y-10">

            {/* ──────── LANE 1: INGESTION NODE ──────── */}
            <div className="flex justify-center">
              <motion.div
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedNode('tap')}
                className={`w-full max-w-xl cursor-pointer p-4 rounded-2xl transition-all border ${
                  selectedNode === 'tap'
                    ? 'bg-gradient-to-r from-emerald-950/60 via-[#0e1d2c] to-emerald-950/60 border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.3)] ring-1 ring-emerald-400/50'
                    : 'bg-[#0B1726]/80 hover:bg-[#0e1d2c] border-emerald-500/30 shadow-md'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold uppercase text-emerald-400 tracking-wider flex items-center gap-1.5">
                    <TbBroadcast className="w-3.5 h-3.5" />
                    DATA SOURCE &bull; PARALLEL INGESTION
                  </span>
                  <span className="text-[10px] font-mono text-emerald-300/80 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    0ms call delay &bull; 12ms frame tap
                  </span>
                </div>
                <h4 className="text-base font-bold text-white tracking-tight">
                  In-Browser WebAudio API Parallel Tap
                </h4>
                <p className="text-xs text-white/60 mt-1 font-sans">
                  Dual-stream sidecar capture runs non-intrusively on client audio frames (16kHz / 48kHz PCM). Adds 0ms delay to the live call and bypasses server disk entirely.
                </p>
              </motion.div>
            </div>

            {/* Connecting Fork Bus with Branching Paths */}
            <div className="relative flex justify-center items-center my-[-10px]">
              <div className="w-full max-w-2xl flex flex-col items-center">
                {/* Vertical Stem */}
                <div className="w-0.5 h-6 bg-gradient-to-b from-emerald-400 to-white/40" />
                {/* Horizontal Bar with Split Arrows */}
                <div className="w-full h-0.5 bg-white/20 relative">
                  <div className="absolute left-0 top-[-3px] w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                  <div className="absolute right-0 top-[-3px] w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                  <div className="absolute left-1/2 -translate-x-1/2 -top-2.5 px-2.5 py-0.5 rounded-full bg-[#08101A] border border-white/15 text-[10px] font-mono text-white/60">
                    PARALLEL NON-CONTAMINATING TAP
                  </div>
                </div>
                {/* Two Branch Drop Stems */}
                <div className="w-full flex justify-between px-6">
                  <div className="w-0.5 h-6 bg-gradient-to-b from-white/20 to-cyan-400" />
                  <div className="w-0.5 h-6 bg-gradient-to-b from-white/20 to-purple-400" />
                </div>
              </div>
            </div>

            {/* ──────── LANE 2: DUAL STREAM ENGINES (ACOUSTIC VS SEMANTIC) ──────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* TRACK A: ACOUSTIC DSP & NEURAL SYNTHESIS (STAGE 1) */}
              <div className="p-5 rounded-2xl bg-[#091522]/90 border border-cyan-500/30 space-y-4 shadow-lg relative">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    <span className="font-mono text-xs font-bold text-cyan-300 uppercase tracking-wider">
                      TRACK A: ACOUSTIC DSP &amp; VAS
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                    STAGE 1
                  </span>
                </div>

                {/* Subnode 1: DSP Extractor */}
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  onClick={() => setSelectedNode('dsp')}
                  className={`p-3.5 rounded-xl cursor-pointer transition-all border ${
                    selectedNode === 'dsp'
                      ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                      : 'bg-black/30 hover:bg-black/50 border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
                      <TbWaveSine className="w-4 h-4 text-cyan-400" />
                      Browser DSP Feature Extractor
                    </h5>
                    <span className="text-[10px] font-mono text-white/40">250ms Window</span>
                  </div>
                  <p className="text-[11px] text-white/60 mt-1 leading-relaxed">
                    Extracts Mel-spectrogram, CQT, 13-band MFCC, pitch (F0) micro-perturbations, and amplitude jitter.
                  </p>
                </motion.div>

                {/* Connector Arrow */}
                <div className="flex justify-center my-[-4px]">
                  <HiOutlineArrowDown className="w-3.5 h-3.5 text-cyan-400/60" />
                </div>

                {/* Subnode 2: AASIST Neural Engine */}
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  onClick={() => setSelectedNode('aasist')}
                  className={`p-3.5 rounded-xl cursor-pointer transition-all border ${
                    selectedNode === 'aasist'
                      ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                      : 'bg-black/30 hover:bg-black/50 border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
                      <TbShieldCheck className="w-4 h-4 text-cyan-400" />
                      AASIST Anti-Spoofing &amp; Heuristic Voting
                    </h5>
                    <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/10 px-1.5 py-0.5 rounded">
                      VAS Metric
                    </span>
                  </div>
                  <p className="text-[11px] text-white/60 mt-1 leading-relaxed">
                    Evaluates neural vocoder phase breaks (HiFi-GAN, VITS). Outputs continuous <strong>Voice Authenticity Score (VAS 0–100)</strong>.
                  </p>
                </motion.div>
              </div>

              {/* TRACK B: SEMANTIC REASONING & IDENTITY (STAGE 2) */}
              <div className="p-5 rounded-2xl bg-[#0e1322]/90 border border-purple-500/30 space-y-4 shadow-lg relative">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                    <span className="font-mono text-xs font-bold text-purple-300 uppercase tracking-wider">
                      TRACK B: SEMANTIC &amp; IDENTITY
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                    STAGE 2
                  </span>
                </div>

                {/* Subnode 1: Deepgram STT */}
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  onClick={() => setSelectedNode('stt')}
                  className={`p-3.5 rounded-xl cursor-pointer transition-all border ${
                    selectedNode === 'stt'
                      ? 'bg-purple-950/40 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.25)]'
                      : 'bg-black/30 hover:bg-black/50 border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
                      <TbBroadcast className="w-4 h-4 text-purple-400" />
                      Deepgram Nova-2 Streaming STT
                    </h5>
                    <span className="text-[10px] font-mono text-white/40">WebSocket</span>
                  </div>
                  <p className="text-[11px] text-white/60 mt-1 leading-relaxed">
                    Edge WebSockets generate instant interim and final transcripts with rolling 400-word memory window.
                  </p>
                </motion.div>

                {/* Connector Arrow */}
                <div className="flex justify-center my-[-4px]">
                  <HiOutlineArrowDown className="w-3.5 h-3.5 text-purple-400/60" />
                </div>

                {/* Subnode 2: Groq Llama 3 & Biometrics */}
                <motion.div
                  whileHover={{ scale: 1.01 }}
                  onClick={() => setSelectedNode('groq')}
                  className={`p-3.5 rounded-xl cursor-pointer transition-all border ${
                    selectedNode === 'groq'
                      ? 'bg-purple-950/40 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.25)]'
                      : 'bg-black/30 hover:bg-black/50 border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
                      <TbCpu className="w-4 h-4 text-purple-400" />
                      Groq LPU Llama-3 + ECAPA-TDNN Matching
                    </h5>
                    <span className="text-[10px] font-mono text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded">
                      Scam Playbooks
                    </span>
                  </div>
                  <p className="text-[11px] text-white/60 mt-1 leading-relaxed">
                    Detects extortion tactics (Digital Arrest, Police impersonation) and verifies speaker voiceprint consistency.
                  </p>
                </motion.div>
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
                  <div className="absolute left-1/2 -translate-x-1/2 -top-2.5 px-3 py-0.5 rounded-full bg-[#08101A] border border-white/20 text-[10px] font-mono text-emerald-300 font-bold">
                    CONVERGENCE &bull; RISK AGGREGATION
                  </div>
                </div>
                {/* Center Drop Stem */}
                <div className="w-0.5 h-6 bg-gradient-to-b from-white/20 to-emerald-400" />
              </div>
            </div>

            {/* ──────── LANE 3: STAGE 3 SECURITY POLICY FUSION GATE ──────── */}
            <div className="flex justify-center">
              <motion.div
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedNode('fusion')}
                className={`w-full max-w-2xl cursor-pointer p-5 rounded-2xl transition-all border ${
                  selectedNode === 'fusion'
                    ? 'bg-gradient-to-r from-teal-950/70 via-[#0e1d2c] to-teal-950/70 border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.35)] ring-1 ring-emerald-400/50'
                    : 'bg-[#0A1726]/80 hover:bg-[#0e1d2c] border-teal-500/30 shadow-lg'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-300">
                      STAGE 3: SECURITY POLICY FUSION GATE
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    F = f(V, I, Intent, Consequence)
                  </span>
                </div>

                <h4 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Graduated Multi-Factor Risk Assessment Engine
                </h4>
                <p className="text-xs text-white/60 mt-1 leading-relaxed">
                  Synthesizes the physical Voice Authenticity Score (VAS), speaker consistency, and conversational extortion indicators into a definitive <strong>Security Risk Index (0–100)</strong>.
                </p>

                {/* 5-State Graduated Response Indicator */}
                <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-white/40">Graduated Risk Response:</span>
                  <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">Safe (&lt;30)</span>
                    <span className="text-white/20">&rarr;</span>
                    <span className="px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">Watch (30-49)</span>
                    <span className="text-white/20">&rarr;</span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-400">Suspicious (50-69)</span>
                    <span className="text-white/20">&rarr;</span>
                    <span className="px-2 py-0.5 rounded bg-red-500/20 border border-red-500/40 text-red-400">Critical (&ge;70)</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Connecting Fork Bus from Fusion Gate to Outcomes */}
            <div className="relative flex justify-center items-center my-[-10px]">
              <div className="w-full max-w-xl flex flex-col items-center">
                <div className="w-0.5 h-6 bg-gradient-to-b from-emerald-400 to-white/40" />
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
              <motion.div
                whileHover={{ scale: 1.01 }}
                onClick={() => setSelectedNode('oob')}
                className={`p-4 sm:p-5 rounded-2xl cursor-pointer transition-all border ${
                  selectedNode === 'oob'
                    ? 'bg-gradient-to-b from-amber-950/60 to-[#0B1523] border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                    : 'bg-[#091522]/80 hover:bg-[#0c1a2b] border-amber-500/30'
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
                <h5 className="font-bold text-white text-sm">
                  Independent Trust Channel &amp; Banking API Hold
                </h5>
                <p className="text-xs text-white/60 mt-1 leading-relaxed">
                  Automatically freezes high-value UPI/NEFT transactions and forces user confirmation via secondary verified channel that the attacker does not control.
                </p>
              </motion.div>

              {/* Outcome 2: Cryptographic Ledger & Legal Audit */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                onClick={() => setSelectedNode('ledger')}
                className={`p-4 sm:p-5 rounded-2xl cursor-pointer transition-all border ${
                  selectedNode === 'ledger'
                    ? 'bg-gradient-to-b from-emerald-950/60 to-[#0B1523] border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                    : 'bg-[#091522]/80 hover:bg-[#0c1a2b] border-emerald-500/30'
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
                <h5 className="font-bold text-white text-sm">
                  Tamper-Evident Evidence Ledger &amp; Audio Purge
                </h5>
                <p className="text-xs text-white/60 mt-1 leading-relaxed">
                  Hashes risk indicators into an immutable cryptographic chain for 1930 Cybercrime Police FIR generation while discarding raw audio to uphold DPDP Act 2023.
                </p>
              </motion.div>

            </div>

          </div>

          {/* ──────── LIVE TELEMETRY & PAYLOAD INSPECTOR DOCK ──────── */}
          {selectedNodeData && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative z-10 mt-8 p-5 rounded-2xl bg-black/60 border border-white/15 backdrop-blur-xl space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-white/10 gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold">
                    {selectedNodeData.stage}
                  </span>
                  <h4 className="font-bold text-white text-sm tracking-tight">{selectedNodeData.name}</h4>
                </div>
                <span className="text-[11px] font-mono text-cyan-400">{selectedNodeData.latency}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                <div>
                  <span className="text-white/40 block text-[10px] uppercase">Input Interface:</span>
                  <span className="text-white/80">{selectedNodeData.input}</span>
                </div>
                <div>
                  <span className="text-white/40 block text-[10px] uppercase">Output Telemetry:</span>
                  <span className="text-emerald-400">{selectedNodeData.output}</span>
                </div>
                <div>
                  <span className="text-white/40 block text-[10px] uppercase">Telemetry Schema:</span>
                  <pre className="mt-1 p-2 rounded bg-black/50 text-[10px] text-cyan-300 font-mono overflow-x-auto border border-white/5">
                    {JSON.stringify(selectedNodeData.samplePayload, null, 2)}
                  </pre>
                </div>
              </div>
            </motion.div>
          )}

        </div>
      </div>

      {/* ─── DETAILED SUBSYSTEM ARCHITECTURAL CARDS ─── */}
      <div className="space-y-6 mb-14">
        
        {/* Filter Navigation Tabs */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-2 border-b border-white/[0.08]">
          <div>
            <h3 className="text-xl font-bold text-white tracking-tight">System Modules &amp; Subsystems</h3>
            <p className="text-xs text-white/50">Component deep dive with performance benchmarks and protocol specifications</p>
          </div>

          <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-full border border-white/10 text-xs">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
                activeTab === 'all' 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm' 
                  : 'text-white/60 hover:text-white'
              }`}
            >
              All Modules
            </button>
            <button
              onClick={() => setActiveTab('acoustic')}
              className={`px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
                activeTab === 'acoustic' 
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm' 
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Acoustic DSP
            </button>
            <button
              onClick={() => setActiveTab('semantic')}
              className={`px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
                activeTab === 'semantic' 
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-sm' 
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Semantic &amp; Identity
            </button>
            <button
              onClick={() => setActiveTab('intervention')}
              className={`px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
                activeTab === 'intervention' 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm' 
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Policy &amp; Legal
            </button>
          </div>
        </div>

        {/* The Grid of Polished Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPillars.map((pillar, index) => {
            const Icon = pillar.icon;
            return (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.06 }}
                className={`rounded-3xl p-6 bg-gradient-to-b from-[#0D1B2A]/90 via-[#0a1522]/90 to-[#07111c]/95 border ${pillar.border} backdrop-blur-xl shadow-xl flex flex-col justify-between relative group hover:shadow-[0_15px_40px_rgba(0,0,0,0.7)] transition-all`}
              >
                <div>
                  {/* Top Bar inside Card */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-[10px] font-mono font-semibold text-white/70 uppercase tracking-wider">
                      {pillar.category}
                    </span>

                    <div className="w-10 h-10 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 group-hover:border-emerald-500/40 transition-all shadow-inner">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Title & Subtitle */}
                  <h4 className="text-lg font-bold text-white tracking-tight mb-1 group-hover:text-emerald-300 transition-colors">
                    {pillar.title}
                  </h4>
                  <p className="text-xs font-mono text-emerald-400/90 font-medium mb-3">
                    {pillar.subtitle}
                  </p>

                  {/* Description */}
                  <p className="text-xs text-white/60 leading-relaxed mb-5 font-sans">
                    {pillar.description}
                  </p>
                </div>

                {/* Bottom Tech Pills & Benchmark */}
                <div className="pt-4 border-t border-white/[0.06] space-y-3">
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

                  <div className="flex items-center justify-between text-[11px] font-mono text-white/40 pt-1">
                    <span>Benchmark:</span>
                    <span className="text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {pillar.benchmark}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ─── BOTTOM LAUNCH BAR ─── */}
      <div className="text-center pt-2">
        <Link
          to="/app"
          className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full text-xs sm:text-sm font-bold text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 hover:opacity-95 shadow-xl shadow-emerald-500/25 transition-all hover:scale-105 cursor-pointer"
        >
          <TbShieldCheck className="w-4 h-4 text-slate-950" />
          <span>Launch Threat Scanner &amp; Real-Time Cockpit</span>
          <TbArrowRight className="w-4 h-4 text-slate-950" />
        </Link>
      </div>

    </div>
  );
}
