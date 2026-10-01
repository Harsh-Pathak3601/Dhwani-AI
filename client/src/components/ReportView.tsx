import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, Variants } from 'framer-motion';
import {
  ShieldAlert,
  FileDown,
  ExternalLink,
  AlertTriangle,
  Hash,
  Activity,
  Home,
  Copy,
  CheckCircle,
  FileText,
  Download,
  PhoneCall,
  Clock,
  Fingerprint,
  Zap,
} from 'lucide-react';
import { generatePDFReport, ReportData, getCaseId, generateEvidenceHash } from '../services/reportPDF';
import { reportToCommunityDB } from '../services/api';
import InvestigationPanel from './InvestigationPanel';
import { exportToHTML, exportToCSV, ExportableReport } from '../services/reportExport';

const ReportView = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const report = location.state?.report as ReportData;
  const reportId = location.state?.reportId as string | undefined;
  const [copied, setCopied] = useState(false);
  const [isReporting, setIsReporting] = useState(false);

  useEffect(() => {
    if (!report) {
      const timer = setTimeout(() => navigate('/'), 2000);
      return () => clearTimeout(timer);
    }
  }, [report, navigate]);

  if (!report) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-white/50">No report data found. Returning home...</p>
      </div>
    );
  }

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
  };

  const handleCopyFIR = () => {
    navigator.clipboard.writeText(report.formalComplaintText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadAndReport = async () => {
    setIsReporting(true);
    // PDF Generation: execute synchronously on user click to ensure browser allows download
    try {
      generatePDFReport(report);
    } catch (err) {
      console.error('Error generating PDF:', err);
    }

    await reportToCommunityDB(report.callerNumber, report.peakRiskScore);
    setTimeout(() => setIsReporting(false), 1500);
  };

  const caseId = getCaseId(report);
  const evidenceHash = generateEvidenceHash(report);
  const peakScore = Math.min(98, report.peakRiskScore);
  const finalScore = report.finalRiskScore !== undefined ? Math.min(98, report.finalRiskScore) : peakScore;
  const isHighRisk = peakScore >= 70;
  const isMediumRisk = peakScore >= 40 && peakScore < 70;

  const tactics = report.psychologicalTactics && report.psychologicalTactics.length > 0
    ? report.psychologicalTactics
    : ['Artificial Time Pressure', 'Voice Clone Impersonation', 'Urgent Asset Demand'];

  const evidenceLogs = report.evidenceLog && report.evidenceLog.length > 0
    ? report.evidenceLog
    : [
        { time: '00:00', event: 'Parallel acoustic monitoring tap engaged on caller audio.' },
        { time: 'Playback Alert', event: `Synthetic voice anomalies detected (Peak Risk: ${peakScore}/100)` },
        ...(report.livenessScore ? [{ time: 'Voice Test', event: `Active prosody liveness score: ${report.livenessScore}%` }] : []),
        { time: 'Session Complete', event: `Forensic risk finalized at ${finalScore}/100.` },
      ];

  const dateFormatted = new Date(report.createdAt || Date.now()).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="min-h-screen bg-transparent text-white px-3 sm:px-6 md:px-8 pt-4 sm:pt-6 pb-28 max-w-5xl mx-auto">
      {/* ── Official Forensic Header ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center text-center mt-3 mb-6"
      >
        <div className="relative mb-3">
          <div className="w-16 h-16 rounded-2xl bg-danger/10 border border-danger/30 flex items-center justify-center p-2 shadow-[0_0_35px_rgba(226,75,74,0.25)] overflow-hidden">
            <img
              src="/Dhwani_AI_transparent_512x512.png"
              alt="Dhwani AI"
              className="w-full h-full object-contain drop-shadow-[0_2px_10px_rgba(255,109,0,0.5)]"
            />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-danger flex items-center justify-center border-2 border-background shadow-sm">
            <ShieldAlert className="w-3.5 h-3.5 text-white" />
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[11px] font-mono mb-2">
          <span>CASE REF: {caseId}</span>
          <span>•</span>
          <span>{dateFormatted}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-serif italic font-normal text-white mb-1 tracking-wide">
          Incident Report
        </h1>
        <p className="text-white/60 text-xs sm:text-sm max-w-lg">
          Forensic Voice Cloning & Cybercrime Dossier &bull; Prepared by{' '}
          <span className="font-brand text-amber-400 font-bold" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Dhwani AI
          </span>
        </p>
      </motion.div>

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
        {/* ── Telemetry Quick Stats ── */}
        <motion.div
          variants={itemVariants}
          className={`grid grid-cols-1 ${report.finalRiskScore !== undefined ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-4 sm:gap-5`}
        >
          {/* Caller Card */}
          <div className="glass-card-strong p-5 sm:p-6 rounded-2xl flex flex-col justify-between min-h-[135px] border border-white/10 hover:border-white/20 transition-all shadow-md">
            <div className="flex items-center justify-between text-white/50 text-[11px] uppercase tracking-wider font-semibold">
              <span className="flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-amber-400" /> Suspect Caller
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-white/40">TEL</span>
            </div>
            <div className="my-3">
              <span
                className="font-mono text-lg sm:text-xl font-bold text-white tracking-wide truncate block"
                title={report.callerNumber}
              >
                {report.callerNumber}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-danger font-medium mt-auto pt-1">
              <span className="w-2 h-2 rounded-full bg-danger animate-pulse shrink-0" />
              <span>Flagged Telecom Origin</span>
            </div>
          </div>

          {/* Peak Risk Card */}
          <div className="glass-card-strong p-5 sm:p-6 rounded-2xl flex flex-col justify-between min-h-[135px] border border-white/10 hover:border-white/20 transition-all shadow-md">
            <div className="flex items-center justify-between text-white/50 text-[11px] uppercase tracking-wider font-semibold">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-orange-400" /> Peak Risk
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-white/40">MAX</span>
            </div>
            <div className="flex items-baseline gap-2 my-2">
              <span className={`text-3xl sm:text-4xl font-black tracking-tight ${isHighRisk ? 'text-danger' : isMediumRisk ? 'text-warning' : 'text-emerald-400'}`}>
                {peakScore}
              </span>
              <span className="text-sm text-white/40 font-medium">/ 100</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold mt-auto pt-1">
              <span className={`w-2 h-2 rounded-full shrink-0 ${isHighRisk ? 'bg-danger animate-pulse' : isMediumRisk ? 'bg-warning' : 'bg-emerald-400'}`} />
              <span className={isHighRisk ? 'text-danger' : isMediumRisk ? 'text-warning' : 'text-emerald-400'}>
                {isHighRisk ? 'Critical Threat' : isMediumRisk ? 'Elevated Risk' : 'Normal / Low'}
              </span>
            </div>
          </div>

          {/* Resolved Risk / Liveness Card */}
          {report.finalRiskScore !== undefined && (
            <div className="glass-card-strong p-5 sm:p-6 rounded-2xl flex flex-col justify-between min-h-[135px] border border-white/10 hover:border-white/20 transition-all shadow-md">
              <div className="flex items-center justify-between text-white/50 text-[11px] uppercase tracking-wider font-semibold">
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Resolved Risk
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-white/40">FINAL</span>
              </div>
              <div className="flex items-baseline gap-2 my-2">
                <span className={`text-3xl sm:text-4xl font-black tracking-tight ${finalScore < 40 ? 'text-emerald-400' : finalScore < 70 ? 'text-warning' : 'text-danger'}`}>
                  {finalScore}
                </span>
                <span className="text-sm text-white/40 font-medium">/ 100</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs mt-auto pt-1">
                {report.livenessScore ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                    <span className="text-emerald-400 font-mono truncate">Liveness: {report.livenessScore}% Verified</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-white/40 shrink-0" />
                    <span className="text-white/50 font-mono">Forensic Tap Latched</span>
                  </>
                )}
              </div>
            </div>
          )}
        </motion.div>

        {/* ── Executive Incident Summary Card ── */}
        <motion.div variants={itemVariants} className="glass-card-strong p-5 relative overflow-hidden">
          <div className={`absolute top-0 left-0 w-1.5 h-full ${isHighRisk ? 'bg-danger' : isMediumRisk ? 'bg-warning' : 'bg-emerald-500'}`} />
          <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
            <div className="inline-block px-3 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold rounded-full uppercase tracking-wider">
              {report.scamType}
            </div>
            <span className="text-[11px] text-white/40 font-mono">
              Confidence: {peakScore >= 70 ? 'High Forensic Probability' : 'Elevated Anomaly'}
            </span>
          </div>
          <p className="text-white/90 leading-relaxed text-sm">
            {report.summary?.replace(/100\/100/g, `${peakScore}/100`)}
          </p>
        </motion.div>

        {/* ── Emergency Action Protocol Banner (Golden Hour) ── */}
        <motion.div
          variants={itemVariants}
          className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border border-amber-500/30 relative"
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Statutory Golden Hour Action Protocol (First 2 Hours)
            </h3>
          </div>
          <p className="text-xs text-white/70 leading-relaxed mb-3">
            If money was transferred, immediately dial <strong>1930</strong> (National Cybercrime Reporting Helpline) to freeze recipient bank accounts before funds are laundered.
          </p>
          <div className="flex flex-wrap gap-2">
            <a
              href="tel:1930"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5" /> Call 1930 Helpline
            </a>
            <button
              onClick={() => window.open('https://sancharsaathi.gov.in/sfc/Home/sfc-complaint.jsp', '_blank')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Open Chakshu Portal
            </button>
          </div>
        </motion.div>

        {/* ── Detected Red Flags ── */}
        <motion.div variants={itemVariants}>
          <h3 className="text-xs font-bold text-white/70 uppercase tracking-widest mb-3 ml-1 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-danger" />
            Detected Forensic Red Flags & Acoustic Anomalies
          </h3>
          <div className="space-y-2">
            {report.redFlags.map((flag, idx) => (
              <div
                key={idx}
                className="glass-card p-3 px-4 flex gap-3 items-start border-l-2 border-l-danger/60"
              >
                <span className="text-danger font-mono font-bold text-xs mt-0.5">#{idx + 1}</span>
                <span className="text-sm text-white/85 flex-1">{flag}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-danger/10 text-danger border border-danger/20 shrink-0">
                  {idx === 0 && isHighRisk ? 'Critical' : 'Alert'}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Psychological Tactics Matrix ── */}
        {tactics.length > 0 && (
          <motion.div variants={itemVariants}>
            <h3 className="text-xs font-bold text-white/70 uppercase tracking-widest mb-2.5 ml-1">
              Social Engineering & Psychological Tactics
            </h3>
            <div className="flex flex-wrap gap-2">
              {tactics.map((tactic, idx) => (
                <div
                  key={idx}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-semibold flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  {tactic}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Chronological Evidence Timeline ── */}
        <motion.div variants={itemVariants}>
          <h3 className="text-xs font-bold text-white/70 uppercase tracking-widest mb-3 ml-1 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            Chronological Forensic Evidence Timeline
          </h3>
          <div className="glass-card p-4 space-y-3">
            {evidenceLogs.map((log, idx) => (
              <div key={idx} className="flex items-start gap-3 text-xs">
                <span className="font-mono font-bold text-amber-400/90 w-16 shrink-0">{log.time}</span>
                <div className="flex-1 text-white/80">{log.event}</div>
                <span className="text-[10px] text-white/40 font-mono shrink-0">Dhwani Tap</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Cyber Police FIR Template ── */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-2 ml-1">
            <h3 className="text-xs font-bold text-white/70 uppercase tracking-widest">
              Cyber Police FIR Template (Sec 66D IT Act / cybercrime.gov.in)
            </h3>
            <span className="text-[10px] text-white/40 font-mono">
              {report.formalComplaintText?.length || 0} chars
            </span>
          </div>
          <div className="relative group">
            <div className="bg-[#070D14] border border-white/10 rounded-xl p-5 text-xs sm:text-sm text-white/70 font-mono leading-relaxed whitespace-pre-wrap selection:bg-amber-500/30">
              {report.formalComplaintText}
            </div>
            <button
              onClick={handleCopyFIR}
              className="absolute top-3 right-3 p-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-md transition-all text-white flex items-center gap-1.5 text-xs font-mono"
              title="Copy to clipboard"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy FIR</span>
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* ── Primary Action Buttons ── */}
        <motion.div variants={itemVariants} className="pt-4 space-y-3">
          {/* Main Download Button */}
          <button
            onClick={handleDownloadAndReport}
            disabled={isReporting}
            className={`w-full py-4 px-5 rounded-xl font-bold transition-all flex items-center justify-center gap-2.5 active:scale-[0.98] ${
              isReporting
                ? 'bg-amber-400 text-slate-950 font-black shadow-[0_0_25px_rgba(245,158,11,0.5)]'
                : 'bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 hover:opacity-95 text-slate-950 font-black shadow-[0_0_25px_rgba(245,158,11,0.35)]'
            }`}
          >
            {isReporting ? <CheckCircle className="w-5 h-5" /> : <FileDown className="w-5 h-5" />}
            <span className="text-base">
              {isReporting ? 'Saved & Flagged in Community DB!' : 'Download PDF Report'}
            </span>
          </button>

          {/* Sanchar Saathi Portal Button */}
          <button
            onClick={() => {
              handleCopyFIR();
              setTimeout(() => {
                window.open('https://sancharsaathi.gov.in/sfc/Home/sfc-complaint.jsp', '_blank');
              }, 400);
            }}
            className="w-full py-3.5 px-4 bg-transparent border border-white/20 hover:border-white/40 hover:bg-white/5 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 active:scale-[0.98] text-sm"
          >
            <ExternalLink className="w-4 h-4 text-white/70" />
            {copied ? 'Copied Details & Opening Portal...' : 'Report to Sanchar Saathi (Chakshu)'}
          </button>
        </motion.div>

        {/* ── Investigation Panel (only when reportId is available) ── */}
        {reportId && (
          <motion.div variants={itemVariants} className="mt-6">
            <InvestigationPanel
              reportId={reportId}
              currentStatus="Needs Review"
              currentNotes=""
            />
          </motion.div>
        )}

        {/* ── Additional Export Formats ── */}
        <motion.div variants={itemVariants} className="flex gap-3 pt-2">
          <button
            onClick={() => {
              const exportable: ExportableReport = {
                callerNumber: report.callerNumber,
                peakRiskScore: report.peakRiskScore,
                finalRiskScore: report.finalRiskScore,
                livenessScore: report.livenessScore,
                scamType: report.scamType,
                summary: report.summary || '',
                redFlags: report.redFlags,
                psychologicalTactics: report.psychologicalTactics,
                evidenceLog: report.evidenceLog,
                recommendedAction: report.recommendedAction,
                formalComplaintText: report.formalComplaintText,
                createdAt: report.createdAt,
                sessionId: report.sessionId,
              };
              exportToHTML(exportable);
            }}
            className="flex-1 py-3 px-4 glass-card hover:bg-white/10 rounded-xl font-medium transition-all flex items-center justify-center gap-2 text-xs sm:text-sm text-white/80 active:scale-[0.98]"
          >
            <Download className="w-4 h-4 text-amber-400" /> Export Forensic HTML
          </button>

          <button
            onClick={() => {
              const exportable: ExportableReport = {
                callerNumber: report.callerNumber,
                peakRiskScore: report.peakRiskScore,
                finalRiskScore: report.finalRiskScore,
                livenessScore: report.livenessScore,
                scamType: report.scamType,
                summary: report.summary || '',
                redFlags: report.redFlags,
                psychologicalTactics: report.psychologicalTactics,
                evidenceLog: report.evidenceLog,
                recommendedAction: report.recommendedAction,
                formalComplaintText: report.formalComplaintText,
                createdAt: report.createdAt,
                sessionId: report.sessionId,
              };
              exportToCSV([exportable]);
            }}
            className="flex-1 py-3 px-4 glass-card hover:bg-white/10 rounded-xl font-medium transition-all flex items-center justify-center gap-2 text-xs sm:text-sm text-white/80 active:scale-[0.98]"
          >
            <FileText className="w-4 h-4 text-amber-400" /> Export CSV Record
          </button>
        </motion.div>

        {/* ── Digital Integrity Seal ── */}
        <motion.div variants={itemVariants} className="p-3.5 rounded-xl bg-white/[0.02] border border-dashed border-white/10 text-center">
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-white/60 mb-1">
            <Fingerprint className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold">Digital Evidence Integrity Seal</span>
          </div>
          <div className="font-mono text-[10px] text-white/40 break-all select-all">
            {evidenceHash}
          </div>
          <p className="text-[9px] text-white/30 mt-1">
            Admissible under Section 65B of Indian Evidence Act / Section 63 BSA, 2023.
          </p>
        </motion.div>

        {/* ── Dashboard Navigation ── */}
        <motion.div variants={itemVariants} className="mt-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-3.5 px-4 bg-[#132238] border border-amber-500/30 hover:bg-amber-500/10 hover:border-amber-500/50 text-amber-300 rounded-xl font-medium transition-all flex items-center justify-center gap-2 active:scale-[0.98] shadow-[0_0_15px_rgba(255,109,0,0.15)] text-sm"
          >
            <ShieldAlert className="w-4 h-4" />
            Open Security Dashboard
          </button>
        </motion.div>

        <motion.div variants={itemVariants} className="text-center">
          <button
            onClick={() => navigate('/')}
            className="text-white/40 hover:text-white flex items-center justify-center gap-2 mx-auto text-xs transition-colors py-3"
          >
            <Home className="w-3.5 h-3.5" /> Return to Home
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ReportView;
