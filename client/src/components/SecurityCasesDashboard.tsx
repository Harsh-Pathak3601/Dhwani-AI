import { useState, useEffect, useCallback } from 'react';
import { motion, Variants } from 'framer-motion';
import {
  Search, Download, FileText, Eye, Shield, ShieldCheck, ShieldAlert,
  ArrowLeft, Users, Loader2, Database, FileDown,
  AlertTriangle, Activity
} from 'lucide-react';
import { useRole, roleLabels, UserRole } from '../context/RoleContext';
import { fetchReports, seedDemoData, SecurityCase, ReportsResponse } from '../services/api';
import { exportToPDF, exportToCSV, exportToHTML, ExportableReport } from '../services/reportExport';
import InvestigationPanel from './InvestigationPanel';

type StatusFilter = '' | 'Needs Review' | 'Verified' | 'Suspected';

const statusBadge = (status: string) => {
  switch (status) {
    case 'Verified':
      return { icon: ShieldCheck, text: 'text-primary', bg: 'bg-primary/20', border: 'border-primary/40', label: 'Verified' };
    case 'Suspected':
      return { icon: ShieldAlert, text: 'text-danger', bg: 'bg-danger/20', border: 'border-danger/40', label: 'Suspected' };
    default:
      return { icon: Shield, text: 'text-warning', bg: 'bg-warning/20', border: 'border-warning/40', label: 'Needs Review' };
  }
};

const riskColor = (score: number) => {
  if (score >= 70) return 'text-danger';
  if (score >= 40) return 'text-warning';
  return 'text-primary';
};

const toExportable = (c: SecurityCase): ExportableReport => ({
  sessionId: c.sessionId,
  callerNumber: c.callerNumber,
  peakRiskScore: c.peakRiskScore,
  scamType: c.scamType,
  summary: c.summary,
  redFlags: c.redFlags,
  psychologicalTactics: c.psychologicalTactics,
  evidenceLog: c.evidenceLog,
  recommendedAction: c.recommendedAction,
  formalComplaintText: c.formalComplaintText || '',
  investigationStatus: c.investigationStatus,
  investigatorNotes: c.investigatorNotes,
  reviewedBy: c.reviewedBy,
  reviewedAt: c.reviewedAt,
  createdAt: c.createdAt,
});

const SecurityCasesDashboard = () => {
  const { currentRole, setCurrentRole } = useRole();
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [data, setData] = useState<ReportsResponse>({
    reports: [], counts: { total: 0, needsReview: 0, suspected: 0, verified: 0 }, page: 1, totalPages: 1
  });
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [selectedCase, setSelectedCase] = useState<SecurityCase | null>(null);

  const loadReports = useCallback(async () => {
    setLoading(true);
    const result = await fetchReports({
      status: activeFilter || undefined,
      role: currentRole,
      search: searchQuery || undefined,
    });
    setData(result);
    setLoading(false);
  }, [activeFilter, currentRole, searchQuery]);

  useEffect(() => { loadReports(); }, [loadReports]);

  const handleSeedDemo = async () => {
    setSeeding(true);
    await seedDemoData();
    await loadReports();
    setSeeding(false);
  };

  const handleCaseUpdate = (updated: SecurityCase) => {
    setData(prev => ({
      ...prev,
      reports: prev.reports.map(r => r._id === updated._id ? updated : r),
    }));
    if (selectedCase?._id === updated._id) setSelectedCase(updated);
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } }
  };
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  const filterTabs: { label: string; value: StatusFilter; count: number }[] = [
    { label: 'All', value: '', count: data.counts.total },
    { label: 'Needs Review', value: 'Needs Review', count: data.counts.needsReview },
    { label: 'Verified', value: 'Verified', count: data.counts.verified },
    { label: 'Suspected', value: 'Suspected', count: data.counts.suspected },
  ];

  // ── CASE DETAIL VIEW ──
  if (selectedCase) {
    const badge = statusBadge(selectedCase.investigationStatus);
    return (
      <div className="min-h-screen bg-transparent text-white px-3 sm:px-6 md:px-8 pt-4 sm:pt-6 pb-28 w-full max-w-5xl mx-auto overflow-hidden">
        <div className="animated-grid-bg opacity-40" />
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10 w-full min-w-0">
          {/* Back Button */}
          <button
            onClick={() => setSelectedCase(null)}
            className="flex items-center gap-2 text-white/50 hover:text-white text-sm mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className={`w-12 h-12 sm:w-14 sm:h-14 ${badge.bg} rounded-2xl flex items-center justify-center border ${badge.border} shrink-0`}>
              <badge.icon className={`w-6 h-6 sm:w-7 sm:h-7 ${badge.text}`} />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Case Detail</h1>
              <div className="flex items-center gap-2 sm:gap-3 mt-1 flex-wrap">
                <span className="font-mono text-white/60 text-xs sm:text-sm truncate max-w-[200px] sm:max-w-none">{selectedCase.callerNumber}</span>
                <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full ${badge.bg} ${badge.text} font-semibold shrink-0`}>
                  {badge.label}
                </span>
              </div>
            </div>
          </div>

          <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-4 w-full">
            {/* Quick Stats */}
            <motion.div variants={itemVariants} className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="glass-card p-2.5 sm:p-4 flex flex-col">
                <span className="text-white/40 text-[9px] sm:text-[10px] uppercase tracking-wider mb-1 sm:mb-2 flex items-center gap-1">
                  <Activity className="w-3 h-3" /> Peak Risk
                </span>
                <span className={`text-lg sm:text-2xl font-bold ${riskColor(Math.min(98, selectedCase.peakRiskScore))} leading-none`}>
                  {Math.min(98, selectedCase.peakRiskScore)}<span className="text-xs sm:text-sm opacity-60 font-normal">/100</span>
                </span>
              </div>
              <div className="glass-card p-2.5 sm:p-4 flex flex-col">
                <span className="text-white/40 text-[9px] sm:text-[10px] uppercase tracking-wider mb-1 sm:mb-2">Scam Type</span>
                <span className="text-xs sm:text-sm text-warning font-semibold truncate">{selectedCase.scamType}</span>
              </div>
              <div className="glass-card p-2.5 sm:p-4 flex flex-col">
                <span className="text-white/40 text-[9px] sm:text-[10px] uppercase tracking-wider mb-1 sm:mb-2">Date</span>
                <span className="text-xs sm:text-sm text-white/70">{new Date(selectedCase.createdAt).toLocaleDateString()}</span>
              </div>
            </motion.div>

            {/* Summary */}
            <motion.div variants={itemVariants} className="glass-card-strong p-5 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-warning" />
              <h3 className="text-sm font-bold text-white/70 uppercase tracking-widest mb-3">Summary</h3>
              <p className="text-white/90 leading-relaxed text-sm">{selectedCase.summary}</p>
            </motion.div>

            {/* Red Flags */}
            {selectedCase.redFlags.length > 0 && (
              <motion.div variants={itemVariants}>
                <h3 className="text-sm font-bold text-white/70 uppercase tracking-widest mb-3 ml-2">Detected Red Flags</h3>
                <div className="space-y-2">
                  {selectedCase.redFlags.map((flag, idx) => (
                    <div key={idx} className="glass-card p-3 px-4 flex gap-3 items-start border-l-2 border-l-danger/50">
                      <AlertTriangle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
                      <span className="text-sm text-white/80">{flag}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Evidence Log */}
            {selectedCase.evidenceLog && selectedCase.evidenceLog.length > 0 && (
              <motion.div variants={itemVariants}>
                <h3 className="text-sm font-bold text-white/70 uppercase tracking-widest mb-3 ml-2">Evidence Timeline</h3>
                <div className="space-y-2">
                  {selectedCase.evidenceLog.map((entry, idx) => (
                    <div key={idx} className="glass-card p-3 px-4 flex gap-3 items-start">
                      <span className="font-mono text-xs text-primary shrink-0 mt-0.5">{entry.time}</span>
                      <span className="text-sm text-white/80">{entry.event}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* FIR Template */}
            {selectedCase.formalComplaintText && (
              <motion.div variants={itemVariants}>
                <h3 className="text-sm font-bold text-white/70 uppercase tracking-widest mb-3 ml-2">Formal Complaint (FIR)</h3>
                <div className="bg-[#09121c] border border-white/5 rounded-xl p-5 text-sm text-white/60 font-mono leading-relaxed whitespace-pre-wrap">
                  {selectedCase.formalComplaintText}
                </div>
              </motion.div>
            )}

            {/* Investigation Panel */}
            <motion.div variants={itemVariants}>
              <InvestigationPanel
                reportId={selectedCase._id}
                currentStatus={selectedCase.investigationStatus}
                currentNotes={selectedCase.investigatorNotes || ''}
                currentReviewer={selectedCase.reviewedBy}
                onUpdate={handleCaseUpdate}
              />
            </motion.div>

            {/* Export Buttons */}
            <motion.div variants={itemVariants} className="flex gap-3 pt-4">
              <button
                onClick={() => exportToPDF(toExportable(selectedCase))}
                className="flex-1 py-3 px-4 glass-card hover:bg-white/10 rounded-xl font-medium transition-all flex items-center justify-center gap-2 text-sm text-white/80"
              >
                <FileDown className="w-4 h-4" /> Export PDF
              </button>
              <button
                onClick={() => exportToCSV([toExportable(selectedCase)])}
                className="flex-1 py-3 px-4 glass-card hover:bg-white/10 rounded-xl font-medium transition-all flex items-center justify-center gap-2 text-sm text-white/80"
              >
                <FileText className="w-4 h-4" /> Export CSV
              </button>
              <button
                onClick={() => exportToHTML(toExportable(selectedCase))}
                className="flex-1 py-3 px-4 glass-card hover:bg-white/10 rounded-xl font-medium transition-all flex items-center justify-center gap-2 text-sm text-white/80"
              >
                <Download className="w-4 h-4" /> Export HTML
              </button>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // ── MAIN DASHBOARD LIST VIEW ──
  return (
    <div className="min-h-screen bg-transparent text-white px-3 sm:px-6 md:px-8 pt-4 sm:pt-6 pb-28 w-full max-w-6xl mx-auto overflow-hidden">
      <div className="animated-grid-bg opacity-40" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-full min-w-0"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-2 sm:mt-6 mb-5 sm:mb-8 w-full">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-amber-500/10 rounded-2xl p-1.5 flex items-center justify-center border border-amber-500/30 shadow-[0_0_30px_rgba(255,109,0,0.25)] overflow-hidden backdrop-blur-md shrink-0">
              <img
                src="/Dhwani_AI_transparent_512x512.png"
                alt="Dhwani AI"
                className="w-full h-full object-contain drop-shadow-[0_2px_8px_rgba(255,109,0,0.5)]"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Security Cases</h1>
                <span className="font-brand text-[10px] sm:text-[11px] font-black uppercase tracking-wider px-2 sm:px-2.5 py-0.5 rounded-full bg-amber-500/15 text-white border border-amber-500/30" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  Dhwani AI
                </span>
              </div>
              <p className="text-white/40 text-xs sm:text-sm">Investigation &amp; Triage Dashboard</p>
            </div>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3 w-full sm:w-auto">
            {/* Role Switcher */}
            <div className="relative flex-1 sm:flex-initial">
              <div className="flex items-center gap-1.5 text-white/50 text-[11px] sm:text-xs mb-1">
                <Users className="w-3 h-3" /> Viewing as
              </div>
              <select
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value as UserRole)}
                className="w-full sm:w-auto bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs sm:text-sm text-white appearance-none cursor-pointer focus:outline-none focus:border-amber-500/50 pr-8"
                style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='rgba(255,255,255,0.5)' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
              >
                {(Object.entries(roleLabels) as [UserRole, string][]).map(([value, label]) => (
                  <option key={value} value={value} className="bg-[#132238] text-white">{label}</option>
                ))}
              </select>
            </div>
            {/* Seed Demo */}
            <button
              onClick={handleSeedDemo}
              disabled={seeding}
              className="py-2 px-3 sm:px-4 glass-card hover:bg-white/10 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 sm:gap-2 text-white/70 mt-5 shrink-0 cursor-pointer"
            >
              {seeding ? <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" /> : <Database className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              <span>{seeding ? 'Seeding...' : 'Seed Demo'}</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4 sm:mb-6 w-full max-w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by caller number..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50 transition-colors"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-5 sm:mb-6 overflow-x-auto pb-2 w-full max-w-full min-w-0 scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none]">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveFilter(tab.value)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 shrink-0 ${activeFilter === tab.value
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-orange-500/20'
                  : 'text-white/50 hover:text-white/70 hover:bg-white/5 border border-transparent'
                }`}
            >
              {tab.label}
              <span className={`text-[11px] sm:text-xs px-1.5 py-0.5 rounded-full ${activeFilter === tab.value ? 'bg-amber-500/30 text-amber-300' : 'bg-white/10 text-white/40'
                }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Cases List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 w-full" data-testid="cases-loader">
            {/* Acoustic Audio Waveform Equalizer Spinner */}
            <div className="flex items-center justify-center gap-1.5 h-12 px-4 py-2 rounded-2xl bg-white/[0.02] border border-white/5 mb-3 shadow-[0_0_25px_rgba(0,229,255,0.08)]">
              {[
                { delay: '0ms', duration: '800ms', height: 'h-8' },
                { delay: '150ms', duration: '950ms', height: 'h-10' },
                { delay: '300ms', duration: '700ms', height: 'h-12' },
                { delay: '200ms', duration: '1100ms', height: 'h-7' },
                { delay: '400ms', duration: '850ms', height: 'h-9' },
              ].map((bar, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full bg-gradient-to-t from-primary/30 via-cyan-400 to-primary animate-pulse shadow-[0_0_8px_rgba(0,229,255,0.7)] ${bar.height}`}
                  style={{
                    animationDelay: bar.delay,
                    animationDuration: bar.duration,
                  }}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
              <p className="text-white/60 text-xs sm:text-sm font-mono tracking-wider uppercase">
                Loading cases...
              </p>
            </div>
          </div>
        ) : data.reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 glass-card w-full">
            <Shield className="w-12 h-12 text-white/20 mb-4" />
            <p className="text-white/50 text-sm mb-2">No security cases found</p>
            <p className="text-white/30 text-xs">Click "Seed Demo" to generate sample data for testing</p>
          </div>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-3 w-full max-w-full min-w-0">
            {data.reports.map((secCase) => {
              const badge = statusBadge(secCase.investigationStatus);
              return (
                <motion.div
                  key={secCase._id}
                  variants={itemVariants}
                  className="glass-card p-3 sm:p-4 hover:bg-white/[0.06] transition-colors cursor-pointer w-full max-w-full overflow-hidden"
                  onClick={() => setSelectedCase(secCase)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      <div className={`w-10 h-10 ${badge.bg} rounded-xl flex items-center justify-center border ${badge.border} shrink-0`}>
                        <badge.icon className={`w-5 h-5 ${badge.text}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-white font-medium text-xs sm:text-sm truncate max-w-[170px] min-[400px]:max-w-[220px] sm:max-w-none">
                            {secCase.callerNumber}
                          </span>
                          <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full ${badge.bg} ${badge.text} font-semibold shrink-0`}>
                            {badge.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] sm:text-xs text-white/40 flex-wrap">
                          <span className="inline-block px-2 py-0.5 bg-warning/10 text-warning rounded-full text-[10px] sm:text-xs">{secCase.scamType}</span>
                          <span>{new Date(secCase.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t border-white/[0.06] sm:border-0">
                      <span className={`text-lg sm:text-xl font-bold ${riskColor(Math.min(98, secCase.peakRiskScore))}`}>
                        {Math.min(98, secCase.peakRiskScore)}<span className="text-xs opacity-60 font-normal">/100</span>
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedCase(secCase); }}
                        className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-colors text-white/50 hover:text-white"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default SecurityCasesDashboard;
