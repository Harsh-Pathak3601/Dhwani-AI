import crypto from 'crypto';

export interface EvidenceRecord {
  recordId: string;
  sessionId: string;
  callerNumberMasked: string;
  modelVersion: string;       // e.g. "VoiceShield-AASIST-v2.1"
  policyVersion: string;      // e.g. "SecurityPolicy-MRM-2026.3"
  stage1Scores: {
    vas: number;
    artifacts: string[];
    model: string;
  };
  stage2Scores: {
    speakerDeviation: number | null;
    impersonationRisk: number;
    transactionKeywords: string[];
  };
  stage3State: 'Insufficient Evidence' | 'Low' | 'Suspicious' | 'High' | 'Critical';
  securityRiskIndex: number;
  actionTaken: string;
  timestamp: string;
  previousHash: string;
  evidenceHash: string;
  ledgerAnchorBlock: number;
}

const evidenceLedger: EvidenceRecord[] = [];
let genesisHash = '0000000000000000000000000000000000000000000000000000000000000000';

/**
 * Calculates SHA-256 cryptographic hash of evidence payload
 */
function computeEvidenceHash(payload: Omit<EvidenceRecord, 'evidenceHash'>): string {
  const content = JSON.stringify({
    recordId: payload.recordId,
    sessionId: payload.sessionId,
    callerNumberMasked: payload.callerNumberMasked,
    modelVersion: payload.modelVersion,
    policyVersion: payload.policyVersion,
    stage1Scores: payload.stage1Scores,
    stage2Scores: payload.stage2Scores,
    stage3State: payload.stage3State,
    securityRiskIndex: payload.securityRiskIndex,
    actionTaken: payload.actionTaken,
    timestamp: payload.timestamp,
    previousHash: payload.previousHash,
    ledgerAnchorBlock: payload.ledgerAnchorBlock
  });

  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Records a tamper-evident evidence block into the cryptographic ledger
 */
export function recordEvidence(
  sessionId: string,
  callerNumberMasked: string,
  stage1: { vas: number; artifacts: string[]; model: string },
  stage2: { speakerDeviation: number | null; impersonationRisk: number; transactionKeywords: string[] },
  stage3State: 'Insufficient Evidence' | 'Low' | 'Suspicious' | 'High' | 'Critical',
  securityRiskIndex: number,
  actionTaken: string
): EvidenceRecord {
  const previousHash = evidenceLedger.length > 0 
    ? evidenceLedger[evidenceLedger.length - 1].evidenceHash 
    : genesisHash;

  const recordId = `EVD-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
  const blockNumber = evidenceLedger.length + 104200; // Simulated enterprise ledger block number

  const baseRecord = {
    recordId,
    sessionId,
    callerNumberMasked,
    modelVersion: 'VoiceShield-AASIST-Cascade-v2.1',
    policyVersion: 'RBI-CyberSecurity-2026.04',
    stage1Scores: stage1,
    stage2Scores: stage2,
    stage3State,
    securityRiskIndex,
    actionTaken,
    timestamp: new Date().toISOString(),
    previousHash,
    ledgerAnchorBlock: blockNumber
  };

  const evidenceHash = computeEvidenceHash(baseRecord);
  const fullRecord: EvidenceRecord = { ...baseRecord, evidenceHash };

  evidenceLedger.push(fullRecord);
  return fullRecord;
}

/**
 * Validates the cryptographic integrity of an evidence record
 */
export function verifyRecordIntegrity(recordId: string): { valid: boolean; record?: EvidenceRecord; reason?: string } {
  const index = evidenceLedger.findIndex(r => r.recordId === recordId);
  if (index === -1) return { valid: false, reason: 'Record not found in ledger' };

  const target = evidenceLedger[index];
  const { evidenceHash, ...data } = target;
  const recomputed = computeEvidenceHash(data);

  if (recomputed !== evidenceHash) {
    return { valid: false, record: target, reason: 'Cryptographic hash mismatch! Data tampering detected.' };
  }

  // Check chain link
  if (index > 0) {
    const prev = evidenceLedger[index - 1];
    if (target.previousHash !== prev.evidenceHash) {
      return { valid: false, record: target, reason: 'Broken ledger chain link with previous block!' };
    }
  }

  return { valid: true, record: target };
}

/**
 * Gets the evidence history for a session
 */
export function getSessionEvidence(sessionId: string): EvidenceRecord[] {
  return evidenceLedger.filter(r => r.sessionId === sessionId);
}
