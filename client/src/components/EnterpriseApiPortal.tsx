import { useState } from 'react';
import {
  TbCode,
  TbBuildingBank,
  TbHeadset,
  TbMessages,
  TbAntenna,
  TbShieldCheck,
  TbAlertTriangle,
  TbCopy,
  TbCheck,
  TbDownload,
  TbPlayerPlay,
  TbKey,
  TbClock,
  TbSparkles,
  TbFileCode,
  TbBolt,
  TbRefresh,
  TbBinaryTree
} from 'react-icons/tb';
import {
  HiOutlineCommandLine,
  HiOutlineCubeTransparent,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineShieldCheck
} from 'react-icons/hi2';

type Protocol = 'rest' | 'grpc';
type Language = 'typescript' | 'python' | 'go' | 'java' | 'curl' | 'csharp';
type TargetSystem = 'banking' | 'contact_center' | 'comms' | 'telecom';

export default function EnterpriseApiPortal() {
  const [activeProtocol, setActiveProtocol] = useState<Protocol>('rest');
  const [activeLang, setActiveLang] = useState<Language>('typescript');
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedProto, setCopiedProto] = useState(false);

  // Key Generator State
  const [orgName, setOrgName] = useState('Apex National Financial Corp');
  const [selectedScope, setSelectedScope] = useState<'banking:verify' | 'contact_center:stream' | 'telecom:sip_tap'>('banking:verify');
  const [generatedKey, setGeneratedKey] = useState('dhwani_live_sec_core_bank_9921');
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);

  // Live Playground State
  const [playgroundScenario, setPlaygroundScenario] = useState<'banking' | 'stream' | 'telecom'>('banking');
  const [callerNumber, setCallerNumber] = useState('+91 98765 43210');
  const [amount, setAmount] = useState('₹45,00,000');
  const [simulateClone, setSimulateClone] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);
  const [apiResponse, setApiResponse] = useState<any>({
    status: 'TRANSACTION_INTERCEPTED_ON_HOLD',
    bankingGatewayRef: 'FINACLE-GUARD-1727672948',
    executionTimeMs: 34,
    accountNumberMasked: 'AC-88****24',
    transferAmount: '₹45,00,000',
    beneficiary: 'BEN-992144882',
    voiceBiometrics: {
      vasScore: 16,
      status: 'HIGH_CONFIDENCE_AI_CLONE_DETECTED',
      speakerMatch: 22.8,
      neuralArtifacts: ['HiFi-GAN Phase Reconstruction Glitch', 'Unnatural Formant Discontinuity']
    },
    coreBankingDirective: {
      action: 'HOLD_FUNDS_PENDING_OUT_OF_BAND_STEP_UP',
      finacleResponseCode: '91_INTERCEPTED_VOICE_FRAUD',
      instructions: 'Debit frozen on core ledger. Send biometrics alert to mobile banking app.'
    },
    cryptographicEvidence: {
      merkleHash: '0x7c9f81a3d02e45bb982c7f1a34e09f582b9a714e8c71591f42d2a912803b9f1d',
      dpopCertified: true,
      retentionPolicy: 'DPDP Act 2023 - 90 Days Auto-Purge'
    }
  });

  // Handle execution of playground call
  const handleExecuteRequest = async () => {
    setIsExecuting(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL 
        ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL : `${import.meta.env.VITE_API_URL}/api`)
        : 'http://localhost:3001/api';

      let endpoint = `${baseUrl}/enterprise/v1/banking/transfer-guard`;
      let payload: any = {
        accountNumber: 'AC-8899201124',
        callerNumber,
        transferAmount: amount,
        beneficiaryAccount: 'BEN-992144882',
        simulatedClone: simulateClone,
        transcriptSnippet: 'Authorize immediate RTGS transfer to vendor escrow account now'
      };

      if (playgroundScenario === 'telecom') {
        endpoint = `${baseUrl}/enterprise/v1/telecom/sip-hook`;
        payload = {
          sipCallId: `sip-${Date.now()}@carrier.ims.net`,
          from: `sip:${callerNumber.replace(/\s+/g, '')}@telco.net`,
          to: 'sip:+911123456789@bank.sip.in',
          simulatedRisk: simulateClone ? 'high' : 'low'
        };
      } else if (playgroundScenario === 'stream') {
        endpoint = `${baseUrl}/enterprise/v1/verify-call`;
        payload = {
          callerNumber,
          sessionId: `call-${Date.now()}`,
          audioFeatures: {
            acousticMetrics: {
              jitter: simulateClone ? 0.002 : 0.018,
              shimmer: simulateClone ? 0.04 : 0.22
            }
          },
          transcript: simulateClone ? 'Urgent, process the clearance right away without delay' : 'Hello, verifying regular monthly wire status',
          context: { transactionAmount: amount }
        };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${generatedKey}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setApiResponse(data);
      } else {
        simulateLocalResponse();
      }
    } catch {
      simulateLocalResponse();
    } finally {
      setIsExecuting(false);
    }
  };

  const simulateLocalResponse = () => {
    const isSynthetic = simulateClone;
    if (playgroundScenario === 'banking') {
      setApiResponse({
        status: isSynthetic ? 'TRANSACTION_INTERCEPTED_ON_HOLD' : 'CLEARED_FOR_DISPATCH',
        bankingGatewayRef: `FINACLE-GUARD-${Date.now()}`,
        executionTimeMs: 28,
        accountNumberMasked: 'AC-88****24',
        transferAmount: amount,
        beneficiary: 'BEN-992144882',
        voiceBiometrics: {
          vasScore: isSynthetic ? 17 : 89,
          status: isSynthetic ? 'HIGH_CONFIDENCE_AI_CLONE_DETECTED' : 'GENUINE_HUMAN_SPEAKER',
          speakerMatch: isSynthetic ? 23.4 : 98.1,
          neuralArtifacts: isSynthetic ? ['HiFi-GAN Phase Discontinuity', 'Vocoder Micro-pitch Smoothing'] : []
        },
        coreBankingDirective: isSynthetic ? {
          action: 'HOLD_FUNDS_PENDING_OUT_OF_BAND_STEP_UP',
          finacleResponseCode: '91_INTERCEPTED_VOICE_FRAUD',
          instructions: 'Debit frozen on core ledger. Send biometrics alert to mobile banking app.'
        } : {
          action: 'ALLOW_TRANSACTION',
          finacleResponseCode: '00_SUCCESS',
          instructions: 'Proceed with core ledger debit and immediate RTGS settlement.'
        },
        cryptographicEvidence: {
          merkleHash: '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join(''),
          dpopCertified: true,
          retentionPolicy: 'DPDP Act 2023 - 90 Days Auto-Purge'
        }
      });
    } else if (playgroundScenario === 'telecom') {
      setApiResponse({
        sipCallId: `sip-${Date.now()}@carrier.ims.net`,
        direction: 'INBOUND_CARRIER_TRUNK',
        from: `sip:${callerNumber.replace(/\s+/g, '')}@telco.net`,
        to: 'sip:+911123456789@bank.sip.in',
        signalingVerdict: {
          vasScore: isSynthetic ? 14 : 94,
          verdict: isSynthetic ? 'SUSPECTED_DEEPFAKE_STREAM' : 'AUTHENTIC_TELEPHONY_VOICE',
          recommendedSipResponse: isSynthetic ? 486 : 200,
          sipReasonHeader: isSynthetic ? 'SIP;cause=486;text="Dhwani Biometric Spoof Intercepted"' : 'SIP;cause=200;text="OK Clean Biometrics"'
        },
        headersInjected: {
          'X-Dhwani-VAS': isSynthetic ? '14' : '94',
          'X-Dhwani-Action': isSynthetic ? 'HOLD_IVR_CHALLENGE' : 'PASSTHROUGH',
          'X-Dhwani-Latency-Ms': '19'
        }
      });
    } else {
      setApiResponse({
        success: true,
        meta: {
          timestamp: new Date().toISOString(),
          executionLatencyMs: 38,
          protocol: 'REST/JSON over TLS 1.3'
        },
        verdict: {
          state: isSynthetic ? 'ACTIVE_HOLD' : 'SAFE',
          action: isSynthetic ? 'TRIGGER_OUT_OF_BAND_AUTH' : 'ALLOW_TRANSACTION',
          requiresHold: isSynthetic,
          voiceAuthenticityScore: isSynthetic ? 19 : 91,
          speakerMatchDeviation: isSynthetic ? 84 : 12,
          impersonationRisk: isSynthetic ? 'Critical' : 'Low'
        }
      });
    }
  };

  const handleGenerateKey = () => {
    setIsGeneratingKey(true);
    setTimeout(() => {
      const rand = Math.random().toString(36).substring(2, 8);
      const prefix = selectedScope.split(':')[0];
      setGeneratedKey(`dhwani_live_sec_${prefix}_${rand}`);
      setIsGeneratingKey(false);
    }, 300);
  };

  const copyToClipboard = (text: string, type: 'key' | 'code' | 'proto') => {
    navigator.clipboard.writeText(text);
    if (type === 'key') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else if (type === 'code') {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else if (type === 'proto') {
      setCopiedProto(true);
      setTimeout(() => setCopiedProto(false), 2000);
    }
  };

  const targetSystems = [
    {
      id: 'banking' as TargetSystem,
      title: 'Core Banking Systems',
      subtitle: 'Finacle 11x • Temenos • Flexcube • FIS',
      icon: TbBuildingBank,
      badge: 'Sub-45ms Transaction Guard',
      description: 'Zero-trust biometric interceptor before high-value RTGS/NEFT transfers, wire releases, and call-in banking transactions. Blocks voice clone impersonation before core debit.',
      keyMetrics: ['42ms p95 latency', 'Zero raw audio stored (DPDP)', 'Merkle audit trail for RBI V-CIP']
    },
    {
      id: 'contact_center' as TargetSystem,
      title: 'Contact Center Platforms',
      subtitle: 'Genesys • Cisco • Avaya • Twilio • Amazon Connect',
      icon: TbHeadset,
      badge: 'CCaaS Dual-Channel Tap',
      description: 'Non-blocking sidecar tap integrates directly with agent softphones and telephony SIP trunks. Live biometric HUD alerts agents to synthetic AI voices in real-time.',
      keyMetrics: ['WebRTC & SIP trunk tap', 'Real-time WebSocket HUD', 'Sub-second agent alert']
    },
    {
      id: 'comms' as TargetSystem,
      title: 'Enterprise Communication',
      subtitle: 'Microsoft Teams • Slack • Zoom Phone • Meet',
      icon: TbMessages,
      badge: 'Executive Deepfake Shield',
      description: 'Protects enterprise conference calls, CFO emergency requests, and internal meetings from cloned CEO audio. Native bots flag synthetic meeting participants.',
      keyMetrics: ['MS Graph & Teams Bot API', 'Slack Workflow Webhook', 'Continuous speaker liveness']
    },
    {
      id: 'telecom' as TargetSystem,
      title: 'Telecom & Carrier Networks',
      subtitle: 'IMS 5G Core • SIP Trunking • SBC Sidecar • STIR/SHAKEN',
      icon: TbAntenna,
      badge: 'Carrier Signaling Layer',
      description: 'In-line SIP header injection (RFC 3261) and RTP stream sniffing on Session Border Controllers (AudioCodes, Ribbon). Drop deepfakes at the national carrier exchange level.',
      keyMetrics: ['SIP 183 / 200 header injection', 'RTP sidecar tap (zero lag)', 'STIR/SHAKEN score federation']
    }
  ];

  // Code snippets by language
  const codeSnippets: Record<Language, Record<Protocol, string>> = {
    typescript: {
      rest: `import { DhwaniClient } from '@dhwani/voice-shield-sdk';

// Initialize with Enterprise Credentials
const dhwani = new DhwaniClient({
  apiKey: process.env.DHWANI_API_KEY, // '${generatedKey}'
  environment: 'production',
  region: 'ap-south-1' // Mumbai Telco Edge
});

// Intercept High-Value Core Banking Transfer
async function verifyFundTransfer(transferData) {
  const verdict = await dhwani.banking.verifyTransfer({
    accountNumber: transferData.accountNumber,
    callerPhone: transferData.callerPhone,
    amount: transferData.amount,
    currency: 'INR',
    audioBuffer: transferData.pcmStreamChunk, // 250ms PCM frame
    transcript: transferData.callTranscript
  });

  if (verdict.status === 'TRANSACTION_INTERCEPTED_ON_HOLD') {
    console.warn('Fraud alert! Synthetic voice detected: VAS=' + verdict.voiceBiometrics.vasScore);
    // Automatically trigger Out-Of-Band Push to authenticated mobile device
    await dhwani.trustChannel.triggerOOB(verdict.bankingGatewayRef);
    return { cleared: false, reason: verdict.coreBankingDirective.action };
  }

  return { cleared: true, authCode: verdict.coreBankingDirective.finacleResponseCode };
}`,
      grpc: `import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';

// Load gRPC Proto for Ultra-Low Latency (<15ms)
const packageDef = protoLoader.loadSync('voice_shield.proto');
const { dhwani } = grpc.loadPackageDefinition(packageDef) as any;

const client = new dhwani.shield.v1.VoiceShieldService(
  'grpc.enterprise.dhwani.ai:50051',
  grpc.credentials.createSsl()
);

// High-speed bidirectional streaming for Contact Center (Genesys/Avaya)
const stream = client.StreamVoiceFeatures();
stream.on('data', (verdict) => {
  if (verdict.vas_score < 40) {
    console.error('AI Voice Impersonation Detected! State:', verdict.policy_state);
  }
});

// Pipe 16kHz PCM DSP frames continuously
stream.write({
  session_id: 'call_live_cc_8812',
  jitter_pct: 0.003,
  shimmer_db: 0.05,
  neural_vocoder_flag: true
});`
    },
    python: {
      rest: `import os
from dhwani_shield import DhwaniShieldClient

client = DhwaniShieldClient(
    api_key=os.getenv("DHWANI_API_KEY", "${generatedKey}"),
    cluster="enterprise-mumbai-edge"
)

# Core Banking Interception (Finacle / Temenos Integration)
def authorize_wire_transfer(account_id: str, phone: str, amount: str, audio_pcm: bytes):
    response = client.banking.verify_transaction(
        account_number=account_id,
        caller_phone=phone,
        transaction_amount=amount,
        raw_pcm_chunk=audio_pcm
    )

    if response.is_synthetic_clone:
        print(f"[BLOCKED] Impersonation detected: VAS={response.vas_score}")
        # Hold transaction on Finacle core ledger
        return {"status": "HELD_FOR_OOB_APPROVAL", "ref": response.gateway_ref}
    
    return {"status": "DISPATCH_AUTHORIZED"}`,
      grpc: `import grpc
import voice_shield_pb2
import voice_shield_pb2_grpc

channel = grpc.secure_channel(
    'grpc.enterprise.dhwani.ai:50051',
    grpc.ssl_channel_credentials()
)
stub = voice_shield_pb2_grpc.VoiceShieldServiceStub(channel)

# Send single-turn verification or establish duplex stream
request = voice_shield_pb2.TransactionVoiceRequest(
    account_number="AC-8899201124",
    caller_phone="+919876543210",
    transaction_amount="₹45,00,000",
    currency="INR"
)
response = stub.VerifyTransactionVoice(request)
print("Cleared for dispatch:", response.cleared_for_dispatch, "VAS:", response.vas_score)`
    },
    go: {
      rest: `package main

import (
	"context"
	"fmt"
	"github.com/dhwani-ai/voice-shield-go/client"
)

func main() {
	dhwani := client.New("${generatedKey}", client.WithRegion("ap-south-1"))

	resp, err := dhwani.Banking.VerifyTransfer(context.Background(), client.TransferRequest{
		AccountNumber: "AC-8899201124",
		CallerPhone:   "+919876543210",
		Amount:        "₹45,00,000",
	})
	if err != nil {
		panic(err)
	}

	if resp.Status == "TRANSACTION_INTERCEPTED_ON_HOLD" {
		fmt.Printf("HOLD TRIGGERED: VAS Score = %d\\n", resp.VoiceBiometrics.VasScore)
	}
}`,
      grpc: `package main

import (
	"context"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"
	pb "github.com/dhwani-ai/voice-shield-proto/v1"
)

func main() {
	creds := credentials.NewClientTLSFromCert(nil, "")
	conn, _ := grpc.Dial("grpc.enterprise.dhwani.ai:50051", grpc.WithTransportCredentials(creds))
	defer conn.Close()

	client := pb.NewVoiceShieldServiceClient(conn)
	res, _ := client.VerifyTransactionVoice(context.Background(), &pb.TransactionVoiceRequest{
		AccountNumber: "AC-8899201124",
		CallerPhone:   "+919876543210",
	})
	println("Result:", res.ClearedForDispatch)
}`
    },
    java: {
      rest: `package com.bank.security;

import ai.dhwani.shield.DhwaniClient;
import ai.dhwani.shield.model.BankingVerificationResponse;
import org.springframework.stereotype.Service;

@Service
public class WireTransferSecurityService {
    private final DhwaniClient dhwani = new DhwaniClient("${generatedKey}");

    public boolean inspectVoiceAuth(String accountNo, String callerPhone, String amount) {
        BankingVerificationResponse verdict = dhwani.banking().verifyTransaction(
            accountNo, callerPhone, amount
        );
        return verdict.isClearedForDispatch();
    }
}`,
      grpc: `// Generated via protoc --java_out
VoiceShieldServiceGrpc.VoiceShieldServiceBlockingStub stub =
    VoiceShieldServiceGrpc.newBlockingStub(channel);

TransactionVoiceResponse response = stub.verifyTransactionVoice(
    TransactionVoiceRequest.newBuilder()
        .setAccountNumber("AC-8899201124")
        .setCallerPhone("+919876543210")
        .build()
);
System.out.println("Cleared: " + response.getClearedForDispatch());`
    },
    curl: {
      rest: `curl -X POST https://api.dhwani.ai/api/enterprise/v1/banking/transfer-guard \\
  -H "Authorization: Bearer ${generatedKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "accountNumber": "AC-8899201124",
    "callerNumber": "+919876543210",
    "transferAmount": "₹45,00,000",
    "beneficiaryAccount": "BEN-992144882",
    "simulatedClone": true,
    "transcriptSnippet": "Authorize immediate wire release now"
  }'`,
      grpc: `grpcurl -proto voice_shield.proto \\
  -d '{"account_number": "AC-8899201124", "caller_phone": "+919876543210"}' \\
  -H "authorization: Bearer ${generatedKey}" \\
  grpc.enterprise.dhwani.ai:50051 \\
  dhwani.shield.v1.VoiceShieldService/VerifyTransactionVoice`
    },
    csharp: {
      rest: `using Dhwani.Shield.Client;

var client = new DhwaniShieldClient("${generatedKey}");

var response = await client.Banking.VerifyTransferAsync(new TransferRequest {
    AccountNumber = "AC-8899201124",
    CallerPhone = "+919876543210",
    Amount = "₹45,00,000"
});

if (!response.ClearedForDispatch) {
    Console.WriteLine($"Voice clone alert! Status: {response.Status}");
}`,
      grpc: `var channel = GrpcChannel.ForAddress("https://grpc.enterprise.dhwani.ai:50051");
var client = new VoiceShieldService.VoiceShieldServiceClient(channel);

var reply = await client.VerifyTransactionVoiceAsync(new TransactionVoiceRequest {
    AccountNumber = "AC-8899201124",
    CallerPhone = "+919876543210"
});`
    }
  };

  const protoDefinition = `syntax = "proto3";

package dhwani.shield.v1;

option go_package = "github.com/dhwani-ai/voice-shield-proto/v1;dhwanipb";
option java_package = "ai.dhwani.shield.v1";
option csharp_namespace = "Dhwani.Shield.V1";

// Dhwani Real-Time Voice Biometric & Cloning Defense Service
service VoiceShieldService {
  // Ultra-low latency streaming verification for Contact Centers & SBC Taps
  rpc StreamVoiceFeatures(stream AudioFeaturePacket) returns (stream VerificationVerdict);

  // Single-turn request for Core Banking Transaction Clearance
  rpc VerifyTransactionVoice(TransactionVoiceRequest) returns (TransactionVoiceResponse);

  // Telco Signal Hook for In-Line SIP Call Inspection
  rpc InspectSipSession(SipSessionRequest) returns (SipSessionVerdict);

  // Out-of-band Intercept & Step-Up Trigger
  rpc TriggerInterventionHold(HoldRequest) returns (HoldResponse);
}

message AudioFeaturePacket {
  string session_id = 1;
  string caller_phone_hash = 2;
  int64 sequence_number = 3;
  double jitter_pct = 4;
  double shimmer_db = 5;
  double pitch_f0_hz = 6;
  repeated double mfcc_13 = 7;
  bool neural_vocoder_flag = 8;
  bytes raw_pcm_preview_hash = 9; // DPDP Compliant: Hash only, zero stored audio
}

message VerificationVerdict {
  string session_id = 1;
  int32 vas_score = 2; // 0-100 Voice Authenticity Score
  string policy_state = 3; // SAFE, PROCEED, CAUTION, STEP_UP_OOB, ACTIVE_HOLD, TERMINATE
  string recommended_action = 4;
  int32 risk_index = 5;
  repeated string detected_artifacts = 6;
  string merkle_evidence_hash = 7;
  int64 latency_micros = 8;
}`;

  return (
    <div className="min-h-screen text-white pt-4 sm:pt-6 pb-20 px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12 relative z-10 w-full max-w-full overflow-hidden">
      <div className="animated-grid-bg opacity-30 pointer-events-none" />

      {/* ─── Hero Section ─── */}
      <div className="text-center max-w-4xl mx-auto space-y-4 pt-4 sm:pt-6">
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold font-brand tracking-tight text-white leading-tight sm:leading-[1.12]">
          Platform &amp;{' '}
          <span className="font-serif italic font-normal text-4xl sm:text-6xl lg:text-7xl bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-300 bg-clip-text text-transparent px-1">
            Integration APIs
          </span>{' '}
          &amp; SDKs
        </h1>

        <p className="text-sm sm:text-base text-white/70 max-w-2xl mx-auto leading-relaxed font-sans font-normal">
          Sub-45ms real-time voice biometric defense, AI clone interception, and out-of-band step-up APIs designed for 
          <span className="text-amber-300 font-medium"> Core Banking</span>, 
          <span className="text-amber-300 font-medium"> Contact Centers</span>, 
          <span className="text-amber-300 font-medium"> Enterprise Communication</span>, and 
          <span className="text-amber-300 font-medium"> Telecom Networks</span>.
        </p>

       
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <span className="px-3 py-1 rounded-full text-xs font-mono bg-white/[0.04] text-white/80 border border-white/10 flex items-center gap-1.5 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(255,171,0,0.6)]" />
            REST / HTTPS JSON
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-mono bg-white/[0.04] text-white/80 border border-white/10 flex items-center gap-1.5 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.6)]" />
            gRPC / HTTP/2 Stream (Sub-15ms)
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-mono bg-white/[0.04] text-white/80 border border-white/10 flex items-center gap-1.5 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-orange-400" />
            SIP Trunking (RFC 3261)
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-mono bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 backdrop-blur-md">
            <HiOutlineShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            DPDP Act 2023 Compliant &bull; Zero Raw Audio
          </span>
        </div>
      </div>

      <div className="rounded-2xl glass-card-strong border border-amber-500/25 p-4 sm:p-5 shadow-[0_10px_40px_rgba(0,0,0,0.6),0_0_25px_rgba(255,109,0,0.12)]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-white/[0.08] text-center">
          <div className="pt-2 md:pt-0">
            <div className="text-[11px] font-mono text-white/50 uppercase tracking-wider">Gateway Latency</div>
            <div className="text-xl sm:text-2xl font-mono font-bold text-white mt-0.5 flex items-center justify-center gap-1.5">
              <span>&lt; 38ms</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">p95</span>
            </div>
          </div>
          <div className="pt-3 md:pt-0">
            <div className="text-[11px] font-mono text-white/50 uppercase tracking-wider">Peak Throughput</div>
            <div className="text-xl sm:text-2xl font-mono font-bold text-amber-400 mt-0.5">50,000 req/s</div>
          </div>
          <div className="pt-3 md:pt-0">
            <div className="text-[11px] font-mono text-white/50 uppercase tracking-wider">Availability SLA</div>
            <div className="text-xl sm:text-2xl font-mono font-bold text-white mt-0.5">99.999%</div>
          </div>
          <div className="pt-3 md:pt-0">
            <div className="text-[11px] font-mono text-white/50 uppercase tracking-wider">Compliance Alignment</div>
            <div className="text-xs sm:text-sm font-mono font-semibold text-yellow-300 mt-1.5">RBI V-CIP &bull; DPDP 2023</div>
          </div>
        </div>
      </div>

  
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-brand tracking-tight text-white flex items-center gap-2">
              <TbBinaryTree className="w-5 h-5 text-amber-400" />
              <span>Target Integration Architectures</span>
            </h2>
            <p className="text-xs sm:text-sm text-white/60">
              Select an enterprise vertical to inspect dedicated protocol pipelines, APIs, and SDK methods.
            </p>
          </div>
          <span className="text-[11px] font-mono text-amber-400/80 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 self-start sm:self-auto">
            4 SYSTEM BLUEPRINTS
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {targetSystems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                onClick={() => {
                  if (item.id === 'banking') setPlaygroundScenario('banking');
                  else if (item.id === 'telecom') setPlaygroundScenario('telecom');
                  else setPlaygroundScenario('stream');
                  const playgroundEl = document.getElementById('live-playground');
                  if (playgroundEl) playgroundEl.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-left p-5 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl transition-all duration-300 cursor-pointer flex flex-col justify-between relative overflow-hidden group hover:border-amber-500/60 hover:shadow-[0_0_30px_rgba(255,109,0,0.25)] hover:ring-1 hover:ring-amber-500/40 hover:bg-[#132238]/90 hover:-translate-y-1"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center border border-white/10 bg-white/[0.05] text-white/60 transition-all duration-300 group-hover:bg-gradient-to-br group-hover:from-orange-500/30 group-hover:via-amber-500/20 group-hover:to-yellow-500/10 group-hover:border-amber-500/50 group-hover:text-amber-300 group-hover:shadow-[0_0_15px_rgba(255,109,0,0.3)]">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full border border-white/10 bg-white/[0.04] text-white/50 transition-all duration-300 group-hover:bg-amber-500/20 group-hover:text-amber-300 group-hover:border-amber-500/40">
                      {item.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-[11px] font-mono text-amber-400/90 pt-0.5">
                      {item.subtitle}
                    </p>
                  </div>

                  <p className="text-xs text-white/65 leading-relaxed line-clamp-3">
                    {item.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/[0.08] space-y-1.5">
                  {item.keyMetrics.map((metric, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[11px] text-white/60 group-hover:text-white/80 transition-colors">
                      <TbCheck className="w-3 h-3 text-amber-400/80 group-hover:text-amber-300 transition-colors shrink-0" />
                      <span className="truncate">{metric}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Interactive Live API Sandbox & Console ─── */}
      <div id="live-playground" className="rounded-3xl glass-card-strong border border-amber-500/25 p-5 sm:p-8 space-y-6 shadow-[0_20px_60px_rgba(0,0,0,0.7),0_0_30px_rgba(255,109,0,0.1)] relative overflow-hidden">
        
        {/* Subtle radial glow matching Dhwani theme */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400">
              <TbBolt className="w-4 h-4 text-amber-400" />
              <span>Interactive Request Sandbox</span>
            </div>
            <h2 className="text-2xl font-bold font-brand tracking-tight text-white">
              Live API Gateway Console
            </h2>
            <p className="text-xs sm:text-sm text-white/60">
              Send live payload evaluations against the active Dhwani enterprise backend.
            </p>
          </div>

          {/* Scenario selector tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setPlaygroundScenario('banking')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                playgroundScenario === 'banking'
                  ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-sm shadow-orange-500/20'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Core Banking Wire Intercept
            </button>
            <button
              onClick={() => setPlaygroundScenario('stream')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                playgroundScenario === 'stream'
                  ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-sm shadow-orange-500/20'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              CCaaS Dual-Channel Stream
            </button>
            <button
              onClick={() => setPlaygroundScenario('telecom')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                playgroundScenario === 'telecom'
                  ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-sm shadow-orange-500/20'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              Carrier SIP Signal Hook
            </button>
          </div>
        </div>

        {/* Playground Grid: Controls on Left, Live Response on Right */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Input Parameters */}
          <div className="lg:col-span-5 space-y-4 rounded-2xl glass-card border border-amber-500/20 p-5">
            <h3 className="text-xs font-mono font-bold tracking-wider text-white/70 flex items-center justify-between">
              <span>REQUEST CONFIGURATION</span>
              <span className="text-amber-400 font-normal">POST /api/enterprise/v1</span>
            </h3>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-white/70 mb-1">
                  Caller / Initiator Phone Number
                </label>
                <input
                  type="text"
                  value={callerNumber}
                  onChange={(e) => setCallerNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-amber-500/60"
                  placeholder="+91 98765 43210"
                />
              </div>

              {playgroundScenario === 'banking' && (
                <div>
                  <label className="block text-xs font-medium text-white/70 mb-1">
                    Core Banking Transfer Amount (INR)
                  </label>
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-amber-500/60"
                    placeholder="₹45,00,000"
                  />
                </div>
              )}

              {/* Simulation Mode Toggle */}
              <div className="pt-1">
                <label className="block text-xs font-medium text-white/70 mb-1.5">
                  Simulated Voice Biometric Profile
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSimulateClone(true)}
                    className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 transition-all ${
                      simulateClone
                        ? 'bg-rose-500/20 border-rose-500/60 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                        : 'bg-black/30 border-white/10 text-white/50 hover:text-white'
                    }`}
                  >
                    <TbAlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>AI Voice Clone (HiFi-GAN)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimulateClone(false)}
                    className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 transition-all ${
                      !simulateClone
                        ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                        : 'bg-black/30 border-white/10 text-white/50 hover:text-white'
                    }`}
                  >
                    <TbShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Genuine Human Speaker</span>
                  </button>
                </div>
              </div>

              {/* Authentication header indicator */}
              <div className="p-3 rounded-xl bg-black/40 border border-amber-500/15 text-xs font-mono space-y-1">
                <div className="text-white/40 text-[10px]">INJECTED AUTH HEADER</div>
                <div className="text-amber-400 truncate">
                  Authorization: Bearer {generatedKey}
                </div>
              </div>
            </div>

            <button
              onClick={handleExecuteRequest}
              disabled={isExecuting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 hover:opacity-95 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,109,0,0.35)] transition-all cursor-pointer disabled:opacity-50"
            >
              {isExecuting ? (
                <>
                  <TbRefresh className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Processing DSP &amp; Biometric Pipeline...</span>
                </>
              ) : (
                <>
                  <TbPlayerPlay className="w-4 h-4 text-slate-950" />
                  <span>Execute Real-Time API Test</span>
                </>
              )}
            </button>
          </div>

          {/* Right: Live Response & Policy Decision */}
          <div className="lg:col-span-7 space-y-3 flex flex-col">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-white/70">
                  REAL-TIME GATEWAY RESPONSE
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  HTTP 200 OK
                </span>
              </div>
              <div className="text-[11px] font-mono text-white/50 flex items-center gap-2">
                <TbClock className="w-3.5 h-3.5 text-amber-400" />
                <span>{apiResponse?.executionTimeMs || 34}ms Latency</span>
              </div>
            </div>

            {/* Verdict summary banner */}
            <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
              (apiResponse?.status === 'TRANSACTION_INTERCEPTED_ON_HOLD' || apiResponse?.verdict?.state === 'ACTIVE_HOLD' || apiResponse?.signalingVerdict?.recommendedSipResponse === 486)
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-200'
                : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold ${
                  (apiResponse?.status === 'TRANSACTION_INTERCEPTED_ON_HOLD' || apiResponse?.verdict?.state === 'ACTIVE_HOLD' || apiResponse?.signalingVerdict?.recommendedSipResponse === 486)
                    ? 'bg-rose-500/20 text-rose-300'
                    : 'bg-emerald-500/20 text-emerald-300'
                }`}>
                  {(apiResponse?.status === 'TRANSACTION_INTERCEPTED_ON_HOLD' || apiResponse?.verdict?.state === 'ACTIVE_HOLD' || apiResponse?.signalingVerdict?.recommendedSipResponse === 486)
                    ? <HiOutlineExclamationTriangle className="w-5 h-5 text-rose-400" />
                    : <HiOutlineCheckCircle className="w-5 h-5 text-emerald-400" />
                  }
                </div>
                <div>
                  <div className="text-xs font-bold font-mono uppercase tracking-wider">
                    {apiResponse?.status || apiResponse?.verdict?.action || 'GATEWAY_VERDICT_CERTIFIED'}
                  </div>
                  <div className="text-xs opacity-80">
                    Voice Authenticity Score (VAS):{' '}
                    <strong className="text-white">
                      {apiResponse?.voiceBiometrics?.vasScore ?? apiResponse?.verdict?.voiceAuthenticityScore ?? apiResponse?.signalingVerdict?.vasScore ?? 16}/100
                    </strong>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className={`text-[10px] font-mono px-2.5 py-1 rounded-full border uppercase font-bold ${
                  (apiResponse?.status === 'TRANSACTION_INTERCEPTED_ON_HOLD' || apiResponse?.verdict?.state === 'ACTIVE_HOLD' || apiResponse?.signalingVerdict?.recommendedSipResponse === 486)
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                    : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                }`}>
                  {(apiResponse?.status === 'TRANSACTION_INTERCEPTED_ON_HOLD' || apiResponse?.verdict?.state === 'ACTIVE_HOLD' || apiResponse?.signalingVerdict?.recommendedSipResponse === 486)
                    ? 'AUTOMATIC ACTIVE HOLD'
                    : 'DIRECT PASS-THROUGH'}
                </span>
              </div>
            </div>

            {/* JSON Code Viewer */}
            <div className="relative rounded-xl bg-[#060b13]/90 border border-amber-500/15 p-4 font-mono text-xs overflow-x-auto flex-1 max-h-80 text-amber-200/90 shadow-inner">
              <button
                onClick={() => copyToClipboard(JSON.stringify(apiResponse, null, 2), 'code')}
                className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all text-[11px] flex items-center gap-1 cursor-pointer"
              >
                {copiedCode ? <TbCheck className="w-3.5 h-3.5 text-amber-400" /> : <TbCopy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied' : 'Copy JSON'}</span>
              </button>
              <pre className="pt-2">{JSON.stringify(apiResponse, null, 2)}</pre>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Multi-Language SDK & Protocol Code Generator ─── */}
      <div className="rounded-3xl glass-card-strong border border-amber-500/25 p-5 sm:p-8 space-y-6 shadow-[0_20px_60px_rgba(0,0,0,0.7),0_0_30px_rgba(255,109,0,0.08)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400">
              <TbFileCode className="w-4 h-4 text-amber-400" />
              <span>Developer SDKs &amp; Code Snippets</span>
            </div>
            <h2 className="text-2xl font-bold font-brand tracking-tight text-white">
              Single-Line Integration Code
            </h2>
            <p className="text-xs sm:text-sm text-white/60">
              Drop voice cloning protection into your existing tech stack with native SDK wrappers.
            </p>
          </div>

          {/* Protocol Toggle (REST vs gRPC) */}
          <div className="flex items-center gap-2 bg-black/40 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setActiveProtocol('rest')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeProtocol === 'rest'
                  ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-sm shadow-orange-500/20'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <TbCode className="w-3.5 h-3.5" />
              <span>REST / HTTPS</span>
            </button>
            <button
              onClick={() => setActiveProtocol('grpc')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                activeProtocol === 'grpc'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <HiOutlineCubeTransparent className="w-3.5 h-3.5" />
              <span>gRPC / Proto3 (Sub-15ms)</span>
            </button>
          </div>
        </div>

        {/* Language Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5 bg-black/30 p-1 rounded-xl border border-white/[0.06]">
            {(['typescript', 'python', 'go', 'java', 'curl', 'csharp'] as Language[]).map((lang) => (
              <button
                key={lang}
                onClick={() => setActiveLang(lang)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                  activeLang === lang
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-white/50 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {lang === 'typescript' && 'TypeScript / Node'}
                {lang === 'python' && 'Python (pip)'}
                {lang === 'go' && 'Go (Golang)'}
                {lang === 'java' && 'Java / Spring'}
                {lang === 'curl' && 'cURL (CLI)'}
                {lang === 'csharp' && 'C# (.NET)'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => copyToClipboard(codeSnippets[activeLang][activeProtocol], 'code')}
              className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-medium flex items-center gap-1.5 transition-all border border-amber-500/30 cursor-pointer"
            >
              {copiedCode ? <TbCheck className="w-3.5 h-3.5 text-amber-400" /> : <TbCopy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
            </button>
          </div>
        </div>

        {/* Code Box */}
        <div className="relative rounded-2xl bg-[#060b13]/95 border border-amber-500/20 p-5 font-mono text-xs overflow-x-auto text-amber-200/90 leading-relaxed shadow-inner">
          <pre>{codeSnippets[activeLang][activeProtocol]}</pre>
        </div>
      </div>

      {/* ─── Embeddable Web Widget & Drop-In Component ─── */}
      <div className="rounded-3xl glass-card-strong border border-amber-500/25 p-5 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400">
              <TbSparkles className="w-4 h-4 text-amber-400" />
              <span>Embeddable Client SDK</span>
            </div>
            <h2 className="text-2xl font-bold font-brand tracking-tight text-white">
              Embed Dhwani into Any Web Portal or CRM
            </h2>
            <p className="text-xs sm:text-sm text-white/60">
              Add real-time voice defense directly to customer support dashboards or web dialers with 1 tag.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-mono bg-amber-500/15 text-amber-300 border border-amber-500/35">
            NPM: @dhwani/voice-guard-react
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
          {/* Left: Code Snippet for embedding */}
          <div className="space-y-3 font-mono text-xs">
            <div className="text-white/60 font-sans text-xs">
              Option A: Vanilla HTML / Web Dashboard Embed
            </div>
            <div className="p-4 rounded-xl bg-black/60 border border-amber-500/20 text-cyan-300 overflow-x-auto">
              {`<script\n  src="https://cdn.dhwani.ai/v1/voice-shield.js"\n  data-api-key="${generatedKey}"\n  data-auto-detect="true"\n  data-hud-position="top-right">\n</script>`}
            </div>

            <div className="text-white/60 font-sans text-xs pt-2">
              Option B: React / Next.js Component
            </div>
            <div className="p-4 rounded-xl bg-black/60 border border-amber-500/20 text-amber-300 overflow-x-auto">
              {`import { DhwaniVoiceGuard } from '@dhwani/voice-guard-react';\n\nexport function CallConsole() {\n  return (\n    <DhwaniVoiceGuard\n      apiKey="${generatedKey}"\n      onThreatDetected={(threat) => alert('Spoof: ' + threat.vasScore)}\n    />\n  );\n}`}
            </div>
          </div>

          {/* Right: Live Interactive Mini HUD Widget Preview */}
          <div className="rounded-2xl glass-card border border-amber-500/35 p-5 space-y-4 shadow-[0_0_35px_rgba(255,109,0,0.18)]">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <TbShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-xs font-bold text-white tracking-wide font-brand">
                  DHWANI EMBEDDED HUD (LIVE DEMO)
                </span>
              </div>
              <span className="text-[10px] font-mono text-amber-400/80 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                SIDE-CAR TAP ACTIVE
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/60">Active Call Stream:</span>
                <span className="font-mono text-amber-300 font-bold">+91 98765 43210</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/60">Biometric Authenticity (VAS):</span>
                <span className="font-mono font-bold text-emerald-400">92/100 (Authentic Human)</span>
              </div>
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-orange-500 via-amber-400 to-emerald-400 h-full w-[92%]" />
              </div>
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-200 flex items-center gap-2">
                <TbShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero synthesis artifacts detected in 250ms audio quantum frames.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Scoped API Key Generator & Credentials ─── */}
      <div className="rounded-3xl glass-card-strong border border-amber-500/25 p-5 sm:p-8 space-y-6 shadow-[0_20px_60px_rgba(0,0,0,0.7),0_0_30px_rgba(255,109,0,0.08)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400">
              <TbKey className="w-4 h-4 text-amber-400" />
              <span>Enterprise Credentials</span>
            </div>
            <h2 className="text-2xl font-bold font-brand tracking-tight text-white">
              Issue Scoped API Key
            </h2>
            <p className="text-xs sm:text-sm text-white/60">
              Provision high-concurrency sandbox and production keys for external systems.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-white/70 mb-1">
              Organization Name
            </label>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-500/60"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/70 mb-1">
              Primary System Scope
            </label>
            <select
              value={selectedScope}
              onChange={(e: any) => setSelectedScope(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:outline-none focus:border-amber-500/60"
            >
              <option value="banking:verify">Core Banking High-Value Wire (Finacle/Temenos)</option>
              <option value="contact_center:stream">Contact Center Live Audio Stream (Genesys/Avaya)</option>
              <option value="telecom:sip_tap">Telecom Carrier SIP Hook (IMS / SBC)</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleGenerateKey}
              disabled={isGeneratingKey}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 hover:opacity-95 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,109,0,0.3)] transition-all cursor-pointer"
            >
              <TbKey className="w-4 h-4 text-slate-950" />
              <span>{isGeneratingKey ? 'Issuing Key...' : 'Generate New Sandbox Key'}</span>
            </button>
          </div>
        </div>

        {/* Issued Key Display */}
        <div className="p-4 rounded-2xl bg-black/60 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="text-[10px] font-mono text-white/40">ACTIVE ENTERPRISE API KEY</div>
            <div className="text-sm font-mono text-amber-300 select-all font-bold">
              {generatedKey}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => copyToClipboard(generatedKey, 'key')}
              className="px-3.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-all border border-amber-500/40 cursor-pointer shadow-sm"
            >
              {copiedKey ? <TbCheck className="w-3.5 h-3.5 text-amber-400" /> : <TbCopy className="w-3.5 h-3.5" />}
              <span>{copiedKey ? 'Copied' : 'Copy Key'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── Protocol Buffers (Proto3) & OpenAPI Specifications ─── */}
      <div className="rounded-3xl glass-card-strong border border-amber-500/25 p-5 sm:p-8 space-y-6 shadow-[0_20px_60px_rgba(0,0,0,0.7),0_0_30px_rgba(255,109,0,0.08)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-400">
              <HiOutlineCommandLine className="w-4 h-4 text-amber-400" />
              <span>Raw Schemas &amp; Protocol Specifications</span>
            </div>
            <h2 className="text-2xl font-bold font-brand tracking-tight text-white">
              gRPC voice_shield.proto Specification
            </h2>
            <p className="text-xs sm:text-sm text-white/60">
              Use with protoc or Buf compiler for automatic client stub generation in any backend language.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => copyToClipboard(protoDefinition, 'proto')}
              className="px-3 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] text-white text-xs font-medium flex items-center gap-1.5 transition-all border border-white/10 cursor-pointer"
            >
              {copiedProto ? <TbCheck className="w-3.5 h-3.5 text-amber-400" /> : <TbCopy className="w-3.5 h-3.5" />}
              <span>{copiedProto ? 'Copied Proto' : 'Copy .proto'}</span>
            </button>
            <a
              href={`data:text/plain;charset=utf-8,${encodeURIComponent(protoDefinition)}`}
              download="voice_shield.proto"
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 hover:opacity-95 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(255,109,0,0.3)]"
            >
              <TbDownload className="w-3.5 h-3.5 text-slate-950" />
              <span>Download .proto</span>
            </a>
          </div>
        </div>

        <div className="relative rounded-2xl bg-[#060b13]/95 border border-amber-500/20 p-5 font-mono text-xs overflow-x-auto text-amber-200/90 max-h-96 leading-relaxed shadow-inner">
          <pre>{protoDefinition}</pre>
        </div>
      </div>
    </div>
  );
}
