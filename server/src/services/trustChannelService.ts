import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';

export interface OOBVerificationRequest {
  oobId: string;
  sessionId: string;
  callerNumber: string;
  method: 'push_notification' | 'callback' | 'supervisor';
  targetDevice: string;
  transactionRef: string;
  amountFormatted?: string;
  reason: string;
  status: 'pending' | 'approved' | 'denied' | 'expired';
  initiatedAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
}

const activeOOBRequests = new Map<string, OOBVerificationRequest>();

/**
 * Initiates an Out-Of-Band verification across an independent trust channel
 */
export function triggerOOBVerification(
  sessionId: string,
  callerNumber: string,
  reason: string,
  amountFormatted: string = '₹50,00,000',
  method: 'push_notification' | 'callback' | 'supervisor' = 'push_notification'
): OOBVerificationRequest {
  const oobId = `OOB-${uuidv4().slice(0, 8).toUpperCase()}`;
  const transactionRef = `TXN-${Date.now().toString().slice(-6)}`;

  const request: OOBVerificationRequest = {
    oobId,
    sessionId,
    callerNumber,
    method,
    targetDevice: 'Authorized Device (iPhone 15 Enterprise MDM / Security Token #402)',
    transactionRef,
    amountFormatted,
    reason,
    status: 'pending',
    initiatedAt: new Date()
  };

  activeOOBRequests.set(oobId, request);
  logger.info(`Independent Trust Channel OOB triggered: ${oobId} for session ${sessionId}`);

  // Auto-expire after 5 minutes
  setTimeout(() => {
    const r = activeOOBRequests.get(oobId);
    if (r && r.status === 'pending') {
      r.status = 'expired';
      r.resolvedAt = new Date();
    }
  }, 5 * 60 * 1000);

  return request;
}

/**
 * Resolves an active OOB request
 */
export function resolveOOBVerification(
  oobId: string,
  decision: 'approved' | 'denied',
  resolvedBy: string = 'Authorized Account Holder'
): OOBVerificationRequest | null {
  const request = activeOOBRequests.get(oobId);
  if (!request) return null;

  request.status = decision;
  request.resolvedAt = new Date();
  request.resolvedBy = resolvedBy;

  logger.info(`OOB Verification resolved: ${oobId} -> ${decision.toUpperCase()} by ${resolvedBy}`);
  return request;
}

/**
 * Retrieves the active transaction hold for a session
 */
export function getActiveHold(sessionId: string): OOBVerificationRequest | undefined {
  return Array.from(activeOOBRequests.values()).find(
    r => r.sessionId === sessionId && r.status === 'pending'
  );
}

/**
 * Lists all OOB requests
 */
export function getAllOOBRequests(): OOBVerificationRequest[] {
  return Array.from(activeOOBRequests.values());
}
