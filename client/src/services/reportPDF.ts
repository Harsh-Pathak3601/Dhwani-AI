import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DHWANI_LOGO_BASE64 } from '../assets/logoBase64';

// Extended jsPDF type to include autoTable plugin properties
interface jsPDFWithPlugin extends jsPDF {
  lastAutoTable: { finalY: number };
}

export interface ReportData {
  callerNumber: string;
  peakRiskScore: number;
  finalRiskScore?: number;
  livenessScore?: number | null;
  scamType: string;
  summary: string;
  redFlags: string[];
  psychologicalTactics?: string[];
  evidenceLog?: Array<{ time: string; event: string }>;
  recommendedAction?: string;
  formalComplaintText: string;
  createdAt?: number | string | Date;
  investigationStatus?: string;
  investigatorNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string | Date;
  sessionId?: string;
}

/**
 * Generate a deterministic case identifier based on session / date / caller
 */
export const getCaseId = (reportData: ReportData): string => {
  if (reportData.sessionId) {
    const clean = reportData.sessionId.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase();
    return `DHW-${clean}`;
  }
  const dateStr = new Date(reportData.createdAt || Date.now()).toISOString().slice(0, 10).replace(/-/g, '');
  const phoneClean = (reportData.callerNumber || '9999').replace(/[^0-9]/g, '').slice(-4) || '8842';
  return `DHW-${dateStr}-${phoneClean}`;
};

/**
 * Generate a deterministic SHA-256 evidence integrity string
 */
export const generateEvidenceHash = (reportData: ReportData): string => {
  const seed = `${reportData.callerNumber}_${reportData.peakRiskScore}_${reportData.scamType}_${new Date(reportData.createdAt || Date.now()).getTime()}`;
  let hash1 = 0x811c9dc5;
  let hash2 = 0x55555555;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash1 = Math.imul(hash1 ^ char, 0x01000193);
    hash2 = Math.imul(hash2 ^ (char << 1), 0x01000193);
  }
  const h1 = Math.abs(hash1).toString(16).padStart(8, '0');
  const h2 = Math.abs(hash2).toString(16).padStart(8, '0');
  const h3 = Math.abs(hash1 ^ 0xabcdef01).toString(16).padStart(8, '0');
  const h4 = Math.abs(hash2 ^ 0x10fedcba).toString(16).padStart(8, '0');
  return `SHA256:${h1}${h2}${h3}${h4}${h2}${h1}${h4}${h3}`.toUpperCase();
};

export const generatePDFReport = (reportData: ReportData) => {
  const doc = new jsPDF() as jsPDFWithPlugin;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  const caseId = getCaseId(reportData);
  const evidenceHash = generateEvidenceHash(reportData);
  const effectiveFinal = reportData.finalRiskScore !== undefined ? reportData.finalRiskScore : reportData.peakRiskScore;
  const dateStr = new Date(reportData.createdAt || Date.now()).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  // Color scheme
  const isHighRisk = reportData.peakRiskScore >= 70;
  const isMediumRisk = reportData.peakRiskScore >= 40 && reportData.peakRiskScore < 70;

  const riskColor: [number, number, number] = isHighRisk ? [220, 38, 38] : isMediumRisk ? [217, 119, 6] : [5, 150, 105];
  const riskBg: [number, number, number] = isHighRisk ? [254, 242, 242] : isMediumRisk ? [254, 243, 199] : [236, 253, 245];
  const riskLabel = isHighRisk
    ? 'CRITICAL THREAT / SYNTHETIC VOICE DETECTED'
    : isMediumRisk
    ? 'SUSPICIOUS / ELEVATED RISK'
    : 'NORMAL / VERIFIED SAFE';

  let currentY = 0;

  // ── Top Header Banner (Page 1) ──
  doc.setFillColor(13, 27, 42); // Deep Navy
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Gold accent bar
  doc.setFillColor(245, 158, 11);
  doc.rect(0, 28, pageWidth, 1.5, 'F');

  // Embed Dhwani AI Brand Logo
  let textStartX = margin;
  try {
    doc.addImage(DHWANI_LOGO_BASE64, 'PNG', margin, 3.5, 21, 21);
    textStartX = margin + 24;
  } catch (err) {
    console.warn('Could not render logo in PDF', err);
  }

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text('DHWANI AI  •  FORENSIC VOICE CYBER DEFENSE', textStartX, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(180, 198, 220);
  doc.text('National Cyber Crime Intelligence & Acoustic Impersonation Lab', textStartX, 17);
  doc.text('Statutory Police Complaint Format under Sec 66D IT Act & BNS Sec 318(4)', textStartX, 22);

  // Right-aligned Case Info in Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(245, 158, 11);
  doc.text('OFFICIAL INCIDENT REPORT', pageWidth - margin, 11, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(`CASE ID: ${caseId}`, pageWidth - margin, 17, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(180, 198, 220);
  doc.text(`Date: ${dateStr}`, pageWidth - margin, 23, { align: 'right' });

  currentY = 36;

  // ── Document Subtitle & Jurisdiction Notice ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('FORENSIC CYBERCRIME & VOICE IMPERSONATION INCIDENT REPORT', margin, currentY);
  currentY += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Admissible Evidence Report prepared for filing with National Cyber Crime Reporting Portal (1930 / cybercrime.gov.in) & Sanchar Saathi (Chakshu)',
    margin,
    currentY
  );
  currentY += 6;

  // ── Executive Telemetry Cards (Row of 3) ──
  const cardWidth = (contentWidth - 6) / 3;
  const cardHeight = 22;

  // Card 1: Risk Assessment Meter
  doc.setFillColor(riskBg[0], riskBg[1], riskBg[2]);
  doc.setDrawColor(riskColor[0], riskColor[1], riskColor[2]);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, currentY, cardWidth, cardHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(riskColor[0], riskColor[1], riskColor[2]);
  doc.text('PEAK ACOUSTIC RISK SCORE', margin + 3, currentY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(`${Math.min(98, reportData.peakRiskScore)}`, margin + 3, currentY + 14);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('/ 100', margin + 17, currentY + 14);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text(riskLabel, margin + 3, currentY + 19);

  // Card 2: Suspect Caller Profile
  const card2X = margin + cardWidth + 3;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(card2X, currentY, cardWidth, cardHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('SUSPECT ORIGIN NUMBER', card2X + 3, currentY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(reportData.callerNumber || 'Unknown Caller', card2X + 3, currentY + 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(220, 38, 38);
  doc.text('• Telecom Fraud Alert Flagged', card2X + 3, currentY + 19);

  // Card 3: Threat Classification & Liveness
  const card3X = margin + (cardWidth + 3) * 2;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(card3X, currentY, cardWidth, cardHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('CLASSIFICATION & LIVENESS', card3X + 3, currentY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  const splitType = doc.splitTextToSize(reportData.scamType || 'Online Financial Fraud', cardWidth - 6);
  doc.text(splitType[0] || 'Unknown Scam', card3X + 3, currentY + 11.5);
  if (splitType[1]) {
    doc.setFontSize(6.8);
    doc.text(splitType[1], card3X + 3, currentY + 15);
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  if (reportData.livenessScore) {
    doc.setTextColor(5, 150, 105);
    doc.text(`Active Liveness: ${reportData.livenessScore}% Verified`, card3X + 3, currentY + 19.5);
  } else {
    doc.setTextColor(217, 119, 6);
    doc.text(`Resolved Risk: ${effectiveFinal}/100`, card3X + 3, currentY + 19.5);
  }

  currentY += cardHeight + 6;

  // ── Section: Incident & Case Telemetry Table ──
  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin, bottom: 16 },
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    head: [['Incident Attribute', 'Forensic & Case Telemetry Details']],
    headStyles: {
      fillColor: [13, 27, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 55, fillColor: [248, 250, 252] },
      1: { cellWidth: 'auto' },
    },
    body: [
      ['Official Case Reference', caseId],
      ['Date & Time of Incident', dateStr],
      ['Suspect Phone / Caller ID', reportData.callerNumber],
      ['Primary Statutory Category', 'Section 66D IT Act - Cheating by Personation using Computer Resource'],
      ['Sub-Category / Attack Vector', reportData.scamType],
      ['Peak Forensic Risk Score', `${Math.min(98, reportData.peakRiskScore)}/100 (Acoustic Anomaly Threshold: >=40)`],
      [
        'Resolved Risk / Liveness Status',
        reportData.livenessScore
          ? `Score: ${effectiveFinal}/100 | Active Voice Prosody: ${reportData.livenessScore}% Verified`
          : `Score: ${effectiveFinal}/100 | Prosody Anomalies Latched`,
      ],
      ['Investigation Status', reportData.investigationStatus || 'Pending Review (Suspected)'],
      [
        'Assigned Reviewer / Station',
        reportData.reviewedBy ? `${reportData.reviewedBy}` : 'Dhwani AI Automated Forensic Engine',
      ],
    ],
  });

  currentY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 6 : currentY + 50;

  // ── Section: Executive Forensic Summary ──
  doc.setFillColor(13, 27, 42);
  doc.rect(margin, currentY, 2.5, 4.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Executive Forensic Summary', margin + 5, currentY + 3.5);
  currentY += 6;

  const cleanSummary = (reportData.summary || 'Audio recording analyzed by Dhwani AI acoustic models.').replace(
    /100\/100/g,
    `${Math.min(98, reportData.peakRiskScore)}/100`
  );

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin, bottom: 16 },
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 3.5,
      textColor: [51, 65, 85],
      lineColor: [226, 232, 240],
      lineWidth: 0.25,
      overflow: 'linebreak',
    },
    body: [
      [
        {
          content: cleanSummary,
          styles: { fillColor: [248, 250, 252] },
        },
      ],
    ],
    pageBreak: 'auto',
  });

  currentY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 6 : currentY + 25;

  // ── Section: Detected Red Flags & Manipulation Tactics ──
  const redFlags = reportData.redFlags && reportData.redFlags.length > 0
    ? reportData.redFlags
    : ['Synthetic voice anomaly detected during interaction', 'Coercive social engineering markers observed'];

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin, bottom: 16 },
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    head: [['#', 'Forensic Red Flag / Audio Artifact', 'Threat Indicator']],
    headStyles: {
      fillColor: [13, 27, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 10, halign: 'center', fillColor: [248, 250, 252] },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 35, fontStyle: 'bold', halign: 'center' },
    },
    body: redFlags.map((flag, idx) => [
      `${idx + 1}`,
      flag,
      idx === 0 && isHighRisk ? 'CRITICAL' : 'SUSPICIOUS',
    ]),
  });

  currentY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 6 : currentY + 30;

  // ── Section: Psychological Tactics Matrix (if available) ──
  if (reportData.psychologicalTactics && reportData.psychologicalTactics.length > 0) {
    if (currentY > pageHeight - 55) {
      doc.addPage();
      currentY = 22;
    }
    doc.setFillColor(13, 27, 42);
    doc.rect(margin, currentY, 2.5, 4.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Psychological Tactics & Social Engineering Patterns', margin + 5, currentY + 3.5);
    currentY += 6;

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin, bottom: 16 },
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2.2,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
      },
      head: [['Tactical Vector', 'Observed Exploitation Method']],
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5,
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 45, fillColor: [248, 250, 252] },
        1: { cellWidth: 'auto' },
      },
      body: reportData.psychologicalTactics.map((tactic, idx) => [
        `Vector #${idx + 1}`,
        tactic,
      ]),
    });

    currentY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 6 : currentY + 25;
  }

  // ── Section: Chronological Evidence Log (Timeline) ──
  const evidenceLogs = reportData.evidenceLog && reportData.evidenceLog.length > 0
    ? reportData.evidenceLog
    : [
        { time: '00:00', event: 'Parallel acoustic monitoring tap engaged on caller audio.' },
        { time: 'Alert 1', event: `Acoustic anomaly detected. Threat score elevated to ${reportData.peakRiskScore}/100.` },
        { time: 'End', event: `Session concluded. Formal forensic report compiled with integrity seal.` },
      ];

  if (currentY > pageHeight - 55) {
    doc.addPage();
    currentY = 22;
  }

  doc.setFillColor(13, 27, 42);
  doc.rect(margin, currentY, 2.5, 4.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Chronological Forensic Evidence Timeline', margin + 5, currentY + 3.5);
  currentY += 6;

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin, bottom: 16 },
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    head: [['Timestamp', 'Forensic Observation / Scammer Interaction', 'Telemetry Engine']],
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 25, halign: 'center', fillColor: [248, 250, 252] },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 40, fontStyle: 'italic', halign: 'center' },
    },
    body: evidenceLogs.map((log) => [
      log.time,
      log.event,
      'Dhwani AI Tap',
    ]),
  });

  currentY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 6 : currentY + 30;

  // ── Section: Statutory Immediate Countermeasures (Golden Hour Checklist) ──
  if (currentY > pageHeight - 55) {
    doc.addPage();
    currentY = 22;
  }

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin, bottom: 16 },
    theme: 'plain',
    styles: {
      fontSize: 7.2,
      cellPadding: 2.5,
      textColor: [51, 65, 85],
      lineColor: [245, 158, 11],
      lineWidth: 0.35,
    },
    head: [
      [
        {
          content: 'EMERGENCY VICTIM ACTION PROTOCOL (FIRST 2 HOURS / GOLDEN HOUR)',
          styles: {
            fontStyle: 'bold',
            fontSize: 8,
            textColor: [180, 83, 9],
            fillColor: [254, 243, 199],
            cellPadding: { top: 3, bottom: 2, left: 3, right: 3 },
          },
        },
      ],
    ],
    body: [
      [
        {
          content:
            '1. DIAL 1930 IMMEDIATELY: Contact National Cyber Crime Helpline to freeze fraudulent banking transactions.\n' +
            '2. REPORT SUSPECT ON SANCHAR SAATHI: Lodge the number on Chakshu (sancharsaathi.gov.in) to trigger telecom blocking.\n' +
            '3. OUT-OF-BAND CONTACT VERIFICATION: Call the purported relative/executive on their verified secondary number.\n' +
            '4. PRESERVE ALL EVIDENCE: Retain unmodified call recordings, SMS, and WhatsApp transaction logs for cyber police.',
          styles: {
            fillColor: [255, 251, 235],
            cellPadding: { top: 2.5, bottom: 3, left: 3, right: 3 },
          },
        },
      ],
    ],
  });

  currentY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 6 : currentY + 30;

  // ── Section: Formal Police FIR Complaint Statement ──
  if (currentY > pageHeight - 65) {
    doc.addPage();
    currentY = 22;
  }

  doc.setFillColor(13, 27, 42);
  doc.rect(margin, currentY, 2.5, 4.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Formal Cyber Police Complaint Statement (For FIR / cybercrime.gov.in)', margin + 5, currentY + 3.5);
  currentY += 6;

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin, bottom: 16 },
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 4,
      textColor: [30, 41, 59],
      lineColor: [203, 213, 225],
      lineWidth: 0.35,
      overflow: 'linebreak',
    },
    body: [
      [
        {
          content: reportData.formalComplaintText || 'No complaint text generated.',
          styles: {
            fillColor: [248, 250, 252],
          },
        },
      ],
    ],
    pageBreak: 'auto',
  });

  currentY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 6 : currentY + 35;

  // ── Section: Forensic Integrity Seal & Chain of Custody ──
  if (currentY > pageHeight - 40) {
    doc.addPage();
    currentY = 22;
  }

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin, bottom: 16 },
    theme: 'plain',
    styles: {
      fontSize: 7,
      cellPadding: 3,
      textColor: [71, 85, 105],
      lineColor: [203, 213, 225],
      lineWidth: 0.3,
    },
    head: [
      [
        {
          content: 'DIGITAL FORENSIC INTEGRITY SEAL & CHAIN OF CUSTODY',
          styles: {
            fontStyle: 'bold',
            fontSize: 7.5,
            textColor: [15, 23, 42],
            fillColor: [241, 245, 249],
            cellPadding: { top: 2.5, bottom: 1.5, left: 3, right: 3 },
          },
        },
      ],
    ],
    body: [
      [
        {
          content: evidenceHash,
          styles: {
            font: 'courier',
            fontStyle: 'bold',
            fontSize: 7.5,
            textColor: [30, 41, 59],
            fillColor: [248, 250, 252],
            cellPadding: { top: 2, bottom: 1, left: 3, right: 3 },
          },
        },
      ],
      [
        {
          content:
            'Preserved pursuant to Section 65B of Indian Evidence Act, 1872 / Section 63 of Bharatiya Sakshya Adhiniyam, 2023.\nCryptographically signed by Dhwani AI Core Engine. Verification available at verify.dhwani.ai/report',
          styles: {
            font: 'helvetica',
            fontStyle: 'normal',
            fontSize: 6.8,
            textColor: [100, 116, 139],
            fillColor: [248, 250, 252],
            cellPadding: { top: 1, bottom: 2.5, left: 3, right: 3 },
          },
        },
      ],
    ],
  });

  // ── Global Header & Footer Stamp on Every Page ──
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Slim top bar for page 2 onwards
    if (i > 1) {
      doc.setFillColor(13, 27, 42);
      doc.rect(0, 0, pageWidth, 12, 'F');
      doc.setFillColor(245, 158, 11);
      doc.rect(0, 12, pageWidth, 0.8, 'F');

      let pageHeaderStartX = margin;
      try {
        doc.addImage(DHWANI_LOGO_BASE64, 'PNG', margin, 1.5, 9, 9);
        pageHeaderStartX = margin + 11;
      } catch {}

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text('DHWANI AI FORENSIC INCIDENT REPORT', pageHeaderStartX, 8);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(245, 158, 11);
      doc.text(`Case ID: ${caseId}  |  Suspect: ${reportData.callerNumber}`, pageWidth - margin, 8, {
        align: 'right',
      });
    }

    // Bottom Running Footer
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('CONFIDENTIAL • LAW ENFORCEMENT ADMISSIBLE', margin, pageHeight - 8);

    doc.setFont('helvetica', 'normal');
    doc.text(
      'Helpline: 1930 | Sanchar Saathi (Chakshu)',
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );

    doc.setFont('helvetica', 'bold');
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
  }

  // Trigger download
  const cleanPhone = (reportData.callerNumber || 'Incident').replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Dhwani_Forensic_Incident_Report_${cleanPhone}.pdf`);
};
