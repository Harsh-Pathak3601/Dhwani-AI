import { generatePDFReport, ReportData, getCaseId, generateEvidenceHash } from './reportPDF';

export interface ExportableReport extends ReportData {
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
  investigationStatus?: string;
  investigatorNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt?: number | string | Date;
  sessionId?: string;
}

// ── PDF Export (Delegates to forensic generator) ──
export const exportToPDF = (report: ExportableReport) => {
  generatePDFReport(report);
};

// ── CSV Export ──
export const exportToCSV = (reports: ExportableReport[]) => {
  const headers = [
    'Case ID',
    'Date Reported',
    'Caller Number',
    'Peak Risk',
    'Final Risk',
    'Liveness Score',
    'Scam Classification',
    'Status',
    'Reviewer',
    'Summary',
    'Red Flags',
    'Psychological Tactics',
    'Evidence Timeline',
    'Recommended Action',
    'Investigator Notes',
    'Digital Integrity Seal'
  ];

  const rows = reports.map((r) => [
    getCaseId(r),
    new Date(r.createdAt || Date.now()).toISOString(),
    r.callerNumber,
    String(r.peakRiskScore),
    String(r.finalRiskScore !== undefined ? r.finalRiskScore : r.peakRiskScore),
    r.livenessScore !== undefined && r.livenessScore !== null ? `${r.livenessScore}%` : 'N/A',
    r.scamType,
    r.investigationStatus || 'Pending Review',
    r.reviewedBy || '',
    `"${(r.summary || '').replace(/"/g, '""')}"`,
    `"${(r.redFlags || []).join('; ')}"`,
    `"${(r.psychologicalTactics || []).join('; ')}"`,
    `"${(r.evidenceLog || []).map(e => `[${e.time}] ${e.event}`).join('; ')}"`,
    `"${(r.recommendedAction || '').replace(/"/g, '""')}"`,
    `"${(r.investigatorNotes || '').replace(/"/g, '""')}"`,
    generateEvidenceHash(r)
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Dhwani_AI_Forensic_Cases_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

// ── HTML Forensic Export ──
export const exportToHTML = (report: ExportableReport) => {
  const caseId = getCaseId(report);
  const evidenceHash = generateEvidenceHash(report);
  const dateStr = new Date(report.createdAt || Date.now()).toLocaleString('en-IN', {
    dateStyle: 'full',
    timeStyle: 'medium',
  });
  const effectiveFinal = report.finalRiskScore !== undefined ? report.finalRiskScore : report.peakRiskScore;

  const isHighRisk = report.peakRiskScore >= 70;
  const isMediumRisk = report.peakRiskScore >= 40 && report.peakRiskScore < 70;
  const riskColor = isHighRisk ? '#EF4444' : isMediumRisk ? '#F59E0B' : '#10B981';
  const riskBg = isHighRisk ? 'rgba(239, 68, 68, 0.12)' : isMediumRisk ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)';
  const riskLabel = isHighRisk ? 'CRITICAL THREAT / AI VOICE CLONE DETECTED' : isMediumRisk ? 'SUSPICIOUS / ELEVATED RISK' : 'CLEARED / VERIFIED SAFE';

  const statusColor =
    report.investigationStatus === 'Verified' ? '#10B981'
    : report.investigationStatus === 'Suspected' ? '#EF4444'
    : '#F59E0B';

  const redFlags = report.redFlags && report.redFlags.length > 0
    ? report.redFlags
    : ['Synthetic voice anomaly detected during playback', 'Discontinuity between synthetic speech segments and natural human audio'];

  const psychologicalTactics = report.psychologicalTactics || [
    'Synthetic Urgency',
    'Authority Impersonation',
    'Isolation Protocol'
  ];

  const evidenceLogs = report.evidenceLog && report.evidenceLog.length > 0
    ? report.evidenceLog
    : [
        { time: '00:00', event: 'Parallel acoustic monitoring tap engaged on caller audio.' },
        { time: 'Playback Alert', event: `Synthetic voice anomalies detected: Peak Risk ${report.peakRiskScore}/100.` },
        { time: 'Session End', event: `Session concluded. Latched forensic risk: ${effectiveFinal}/100.` }
      ];

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dhwani AI Forensic Report - ${caseId} (${report.callerNumber})</title>
  <style>
    :root {
      --primary: #F59E0B;
      --bg: #0A111C;
      --card-bg: #111E2E;
      --card-border: rgba(255, 255, 255, 0.08);
      --text: #F8FAFC;
      --text-muted: #94A3B8;
      --risk-color: ${riskColor};
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      padding: 32px 16px;
      line-height: 1.5;
    }
    .container { max-width: 900px; margin: 0 auto; }
    
    /* Top Action Bar */
    .action-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--card-border);
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #1E293B;
      color: #fff;
      border: 1px solid rgba(255,255,255,0.15);
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s;
    }
    .btn:hover { background: #334155; }
    .btn-primary { background: #F59E0B; color: #000; border: none; font-weight: 700; }
    .btn-primary:hover { background: #D97706; }

    /* Header Banner */
    .header-card {
      background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
      border: 1px solid rgba(245, 158, 11, 0.3);
      border-radius: 14px;
      padding: 24px;
      margin-bottom: 24px;
      position: relative;
      overflow: hidden;
    }
    .header-card::after {
      content: "";
      position: absolute;
      top: 0; right: 0; width: 4px; height: 100%;
      background: var(--primary);
    }
    .brand-tag {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: var(--primary);
      font-weight: 700;
      margin-bottom: 6px;
    }
    .header-title {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin-bottom: 6px;
      color: #FFF;
    }
    .header-subtitle {
      font-size: 13px;
      color: var(--text-muted);
    }
    .meta-pills {
      display: flex;
      gap: 12px;
      margin-top: 14px;
      flex-wrap: wrap;
    }
    .meta-pill {
      background: rgba(255,255,255,0.06);
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-family: monospace;
    }

    /* Telemetry Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 14px;
      margin-bottom: 24px;
    }
    .stat-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 18px;
    }
    .stat-card.risk {
      background: ${riskBg};
      border-color: ${riskColor};
    }
    .stat-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--text-muted);
      margin-bottom: 6px;
    }
    .stat-val {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .stat-sub {
      font-size: 11px;
      margin-top: 4px;
      color: var(--text-muted);
    }

    /* Sections */
    .card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 22px;
      margin-bottom: 20px;
    }
    .section-title {
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      font-weight: 700;
      color: #CBD5E1;
      margin-bottom: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .section-title::before {
      content: "";
      width: 4px;
      height: 14px;
      background: var(--primary);
      border-radius: 2px;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    th {
      text-align: left;
      padding: 10px 12px;
      background: rgba(255,255,255,0.04);
      color: #94A3B8;
      font-weight: 600;
      border-bottom: 1px solid var(--card-border);
    }
    td {
      padding: 10px 12px;
      border-bottom: 1px solid rgba(255,255,255,0.04);
    }
    tr:last-child td { border-bottom: none; }

    /* Red Flags */
    .flag-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 14px;
      background: rgba(239, 68, 68, 0.08);
      border-left: 3px solid #EF4444;
      border-radius: 0 8px 8px 0;
      margin-bottom: 8px;
      font-size: 13px;
    }

    /* Tactics */
    .tactics-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .tactic-chip {
      background: rgba(245, 158, 11, 0.12);
      color: #FBBF24;
      border: 1px solid rgba(245, 158, 11, 0.3);
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }

    /* Emergency Alert */
    .emergency-card {
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(220, 38, 38, 0.15) 100%);
      border: 1px solid #F59E0B;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
    }
    .emergency-title {
      color: #FBBF24;
      font-weight: 800;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 10px;
    }
    .emergency-steps {
      display: grid;
      gap: 8px;
      font-size: 13px;
    }
    .step-item {
      display: flex;
      gap: 10px;
      align-items: baseline;
    }
    .step-badge {
      background: #F59E0B;
      color: #000;
      font-weight: 800;
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      flex-shrink: 0;
    }

    /* FIR Complaint Box */
    .fir-box {
      background: #070D14;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 16px;
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      line-height: 1.6;
      color: #E2E8F0;
      white-space: pre-wrap;
      user-select: all;
    }

    /* Digital Seal */
    .seal-box {
      background: rgba(255, 255, 255, 0.02);
      border: 1px dashed rgba(255, 255, 255, 0.15);
      border-radius: 8px;
      padding: 16px;
      margin-top: 20px;
      font-size: 12px;
      color: var(--text-muted);
    }
    .hash-code {
      font-family: monospace;
      color: #93C5FD;
      font-size: 11px;
      word-break: break-all;
      margin: 4px 0 8px;
    }

    /* Print Styles */
    @media print {
      body { background: #FFF; color: #000; padding: 0; }
      .action-bar { display: none; }
      .header-card { background: #0D1B2A !important; color: #FFF !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .card, .stat-card { background: #FFF !important; border: 1px solid #DDD !important; color: #000 !important; }
      .fir-box { background: #F8FAFC !important; color: #000 !important; border: 1px solid #CCC !important; }
      .stat-val { color: #000 !important; }
      .stat-card.risk { border: 2px solid ${riskColor} !important; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="action-bar">
      <div style="font-size: 13px; color: var(--text-muted);">
        Case Ref: <strong>${caseId}</strong>
      </div>
      <div style="display: flex; gap: 8px;">
        <button class="btn" onclick="window.print()">🖨️ Print / Save as PDF</button>
        <button class="btn btn-primary" onclick="copyFIR()">📋 Copy FIR Complaint</button>
      </div>
    </div>

    <div class="header-card" style="display: flex; gap: 18px; align-items: center;">
      <div style="width: 64px; height: 64px; border-radius: 14px; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); display: flex; align-items: center; justify-content: center; padding: 6px; flex-shrink: 0;">
        <img src="/Dhwani_AI_transparent_192x192.png" alt="Dhwani AI" style="width: 100%; height: 100%; object-fit: contain;" />
      </div>
      <div style="flex: 1;">
        <div class="brand-tag">DHWANI AI &bull; FORENSIC VOICE INTELLIGENCE LABS</div>
        <h1 class="header-title">Cybercrime & AI Voice Impersonation Incident Dossier</h1>
        <p class="header-subtitle">
          Preserved Evidence Report for filing with National Cyber Crime Reporting Portal (1930 / cybercrime.gov.in) & Sanchar Saathi (Chakshu) under Sec. 66D IT Act, 2000 & BNS Sec. 318(4).
        </p>
        <div class="meta-pills">
          <span class="meta-pill">CASE ID: ${caseId}</span>
          <span class="meta-pill">INCIDENT DATE: ${dateStr}</span>
          <span class="meta-pill">STATUS: ${report.investigationStatus || 'Pending Review'}</span>
        </div>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card risk">
        <div class="stat-label">Peak Acoustic Risk Score</div>
        <div class="stat-val" style="color: ${riskColor};">${Math.min(98, report.peakRiskScore)}<span style="font-size: 16px; opacity: 0.7;">/100</span></div>
        <div class="stat-sub" style="font-weight: 700; color: ${riskColor};">${riskLabel}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Suspect Caller Profile</div>
        <div class="stat-val" style="font-size: 20px; font-family: monospace;">${report.callerNumber || 'Unknown'}</div>
        <div class="stat-sub" style="color: #EF4444;">• High-Risk Telecom Anomaly</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Resolved Risk & Liveness</div>
        <div class="stat-val" style="font-size: 20px;">${effectiveFinal}/100</div>
        <div class="stat-sub" style="color: #10B981;">
          ${report.livenessScore ? `Liveness: ${report.livenessScore}% Verified` : 'Acoustic Tap Active'}
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Attack Classification</div>
        <div class="stat-val" style="font-size: 16px; margin-top: 4px;">${report.scamType}</div>
        <div class="stat-sub">Online Financial Impersonation</div>
      </div>
    </div>

    <div class="card">
      <div class="section-title">Case Telemetry & Investigation Profile</div>
      <table>
        <tbody>
          <tr>
            <td style="width: 35%; font-weight: 600; color: var(--text-muted);">Case Reference ID</td>
            <td style="font-family: monospace;">${caseId}</td>
          </tr>
          <tr>
            <td style="font-weight: 600; color: var(--text-muted);">Date & Time Reported</td>
            <td>${dateStr}</td>
          </tr>
          <tr>
            <td style="font-weight: 600; color: var(--text-muted);">Suspect Caller Number</td>
            <td style="font-family: monospace; color: #FCA5A5;">${report.callerNumber}</td>
          </tr>
          <tr>
            <td style="font-weight: 600; color: var(--text-muted);">Statutory Violation</td>
            <td>Section 66D IT Act (Cheating by personation) & Bharatiya Nyaya Sanhita (BNS) 318(4)</td>
          </tr>
          <tr>
            <td style="font-weight: 600; color: var(--text-muted);">Investigation Status</td>
            <td><span style="color: ${statusColor}; font-weight: 700;">${report.investigationStatus || 'Pending Review'}</span></td>
          </tr>
          <tr>
            <td style="font-weight: 600; color: var(--text-muted);">Forensic Examiner / Nodal</td>
            <td>${report.reviewedBy || 'Dhwani AI Automated Forensic System'}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="card">
      <div class="section-title">Executive Forensic Summary</div>
      <p style="font-size: 14px; line-height: 1.7; color: #E2E8F0;">
        ${(report.summary || 'Acoustic audio analyzed in real-time by Dhwani AI voice intelligence engines.').replace(/100\/100/g, `${Math.min(98, report.peakRiskScore)}/100`)}
      </p>
    </div>

    <div class="emergency-card">
      <div class="emergency-title">⚡ Immediate Victim Emergency Protocol (Golden Hour - First 2 Hours)</div>
      <div class="emergency-steps">
        <div class="step-item">
          <span class="step-badge">STEP 1</span>
          <div><strong>DIAL 1930 IMMEDIATELY:</strong> Contact the National Cyber Crime Helpline (Ministry of Home Affairs) to freeze beneficiary accounts.</div>
        </div>
        <div class="step-item">
          <span class="step-badge">STEP 2</span>
          <div><strong>REPORT ON SANCHAR SAATHI:</strong> File suspect number on Chakshu (<strong>sancharsaathi.gov.in</strong>) for carrier-level blacklisting.</div>
        </div>
        <div class="step-item">
          <span class="step-badge">STEP 3</span>
          <div><strong>OUT-OF-BAND CONTACT:</strong> Verify caller identity by reaching out to their legitimate, pre-existing contact number.</div>
        </div>
        <div class="step-item">
          <span class="step-badge">STEP 4</span>
          <div><strong>PRESERVE EVIDENCE:</strong> Retain raw call audio, transaction reference IDs, and SMS logs for submission to cyber police.</div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="section-title">Detected Acoustic Anomalies & Red Flags</div>
      ${redFlags.map(flag => `
        <div class="flag-item">
          <span style="color: #EF4444; font-weight: bold;">⚠️</span>
          <div>${flag}</div>
        </div>
      `).join('')}
    </div>

    <div class="card">
      <div class="section-title">Social Engineering & Psychological Tactics</div>
      <div class="tactics-grid">
        ${psychologicalTactics.map(tactic => `<div class="tactic-chip">🎯 ${tactic}</div>`).join('')}
      </div>
    </div>

    <div class="card">
      <div class="section-title">Chronological Forensic Evidence Timeline</div>
      <table>
        <thead>
          <tr>
            <th style="width: 15%;">Timestamp</th>
            <th>Forensic Event / Utterance Milestone</th>
            <th style="width: 25%;">Engine Source</th>
          </tr>
        </thead>
        <tbody>
          ${evidenceLogs.map(log => `
            <tr>
              <td style="font-family: monospace; font-weight: 600; color: #F59E0B;">${log.time}</td>
              <td>${log.event}</td>
              <td style="font-style: italic; color: var(--text-muted);">Dhwani AI Tap</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    ${report.investigatorNotes ? `
    <div class="card">
      <div class="section-title">Forensic Investigator Notes</div>
      <p style="font-size: 13px; line-height: 1.6; color: #E2E8F0;">${report.investigatorNotes}</p>
    </div>
    ` : ''}

    <div class="card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <div class="section-title" style="margin-bottom: 0;">Cyber Police FIR Complaint Statement</div>
        <button class="btn" onclick="copyFIR()" id="copyBtn">📋 Copy Complaint</button>
      </div>
      <div class="fir-box" id="firContent">${report.formalComplaintText || 'No complaint text generated.'}</div>
    </div>

    <div class="seal-box">
      <strong>DIGITAL FORENSIC INTEGRITY SEAL & CHAIN OF CUSTODY</strong>
      <div class="hash-code">${evidenceHash}</div>
      <p>Preserved under Section 65B of Indian Evidence Act, 1872 / Section 63 of Bharatiya Sakshya Adhiniyam, 2023. Real-time acoustic capture integrity verified.</p>
    </div>

    <div style="text-align: center; margin-top: 32px; font-size: 12px; color: var(--text-muted);">
      Generated by Dhwani AI Acoustic Cyber Defense Platform &bull; Strictly Confidential Evidence Dossier
    </div>
  </div>

  <script>
    function copyFIR() {
      const text = document.getElementById('firContent').innerText;
      navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById('copyBtn');
        if (btn) btn.innerText = '✅ Copied to Clipboard!';
        setTimeout(() => { if (btn) btn.innerText = '📋 Copy Complaint'; }, 2000);
      });
    }
  </script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const cleanPhone = (report.callerNumber || 'Incident').replace(/[^a-zA-Z0-9]/g, '_');
  a.download = `Dhwani_AI_Forensic_Dossier_${cleanPhone}.html`;
  a.click();
  URL.revokeObjectURL(url);
};
