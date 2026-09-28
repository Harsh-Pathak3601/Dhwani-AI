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
      return { icon: ShieldCheck, text: 'text-primary', bg: 'bg-primary/20', border: 'border-primary/40', label: '🟢 Verified' };
    case 'Suspected':
      return { icon: ShieldAlert, text: 'text-danger', bg: 'bg-danger/20', border: 'border-danger/40', label: '🔴 Suspected' };
    default:
      return { icon: Shield, text: 'text-warning', bg: 'bg-warning/20', border: 'border-warning/40', label: '🟡 Needs Review' };
  }
};

const riskColor = (score: number) => {
  if (score >= 70) return 'text-danger';
  if (score >= 40) return 'text-warning';
  return 'text-primary';
};

const toExportable = (c: SecurityCase): ExportableReport => ({
  callerNumber: c.callerNumber,
  peakRiskScore: c.peakRiskScore,
  scamType: c.scamType,
  summary: c.summary,
  redFlags: c.redFlags,
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
      <div className="min-h-screen bg-transparent text-white px-4 sm:px-8 pt-4 sm:pt-6 pb-28 max-w-5xl mx-auto">
        <div className="animated-grid-bg opacity-40" />
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative z-10">
          {/* Back Button */}
          <button
            onClick={() => setSelectedCase(null)}
            className="flex items-center gap-2 text-white/50 hover:text-white text-sm mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>

          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className={`w-14 h-14 ${badge.bg} rounded-2xl flex items-center justify-center border ${badge.border}`}>
              <badge.icon className={`w-7 h-7 ${badge.text}`} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Case Detail</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="font-mono text-white/60">{selectedCase.callerNumber}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${badge.bg} ${badge.text} font-semibold`}>
                  {badge.label}
                </span>
              </div>
            </div>
          </div>

          <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-4">
            {/* Quick Stats */}
            <motion.div variants={itemVariants} className="grid grid-cols-3 gap-3">
              <div className="glass-card p-4 flex flex-col">
                <span className="text-white/40 text-[10px] uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Activity className="w-3 h-3" /> Peak Risk
                </span>
                <span className={`text-2xl font-bold ${riskColor(selectedCase.peakRiskScore)} leading-none`}>
                  {selectedCase.peakRiskScore}<span className="text-sm opacity-60 font-normal">/100</span>
                </span>
              </div>
              <div className="glass-card p-4 flex flex-col">
                <span className="text-white/40 text-[10px] uppercase tracking-wider mb-2">Scam Type</span>
                <span className="text-sm text-warning font-semibold">{selectedCase.scamType}</span>
              </div>
              <div className="glass-card p-4 flex flex-col">
                <span className="text-white/40 text-[10px] uppercase tracking-wider mb-2">Date</span>
                <span className="text-sm text-white/70">{new Date(selectedCase.createdAt).toLocaleDateString()}</span>
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
    <div className="min-h-screen bg-transparent text-white px-4 sm:px-8 pt-4 sm:pt-6 pb-28 max-w-6xl mx-auto">
      <div className="animated-grid-bg opacity-40" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl p-1.5 flex items-center justify-center border border-primary/30 shadow-[0_0_30px_rgba(29,158,117,0.2)] overflow-hidden backdrop-blur-md">
              <img
                src="/Dhwani_AI_transparent_512x512.png"
                alt="Dhwani AI"
                className="w-full h-full object-contain drop-shadow-[0_2px_8px_rgba(29,158,117,0.4)]"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">Security Cases</h1>
                <span className="font-brand text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30" style={{fontFamily: "'Outfit', sans-serif"}}>
                  Dhwani AI
                </span>
              </div>
              <p className="text-white/40 text-sm">Investigation &amp; Triage Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Role Switcher */}
            <div className="relative">
              <div className="flex items-center gap-2 text-white/50 text-xs mb-1">
                <Users className="w-3 h-3" /> Viewing as
              </div>
              <select
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value as UserRole)}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white appearance-none cursor-pointer focus:outline-none focus:border-primary/50 pr-8"
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
              className="py-2 px-4 glass-card hover:bg-white/10 rounded-xl text-sm font-medium transition-all flex items-center gap-2 text-white/70 mt-5"
            >
              {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
              {seeding ? 'Seeding...' : 'Seed Demo'}
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by caller number..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveFilter(tab.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                activeFilter === tab.value
                  ? 'bg-primary/20 text-primary border border-primary/40'
                  : 'text-white/50 hover:text-white/70 hover:bg-white/5 border border-transparent'
              }`}
            >
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                activeFilter === tab.value ? 'bg-primary/30 text-primary' : 'bg-white/10 text-white/40'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Cases List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
            <p className="text-white/40 text-sm">Loading cases...</p>
          </div>
        ) : data.reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 glass-card">
            <Shield className="w-12 h-12 text-white/20 mb-4" />
            <p className="text-white/50 text-sm mb-2">No security cases found</p>
            <p className="text-white/30 text-xs">Click "Seed Demo" to generate sample data for testing</p>
          </div>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-3">
            {data.reports.map((secCase) => {
              const badge = statusBadge(secCase.investigationStatus);
              return (
                <motion.div
                  key={secCase._id}
                  variants={itemVariants}
                  className="glass-card p-4 hover:bg-white/[0.06] transition-colors cursor-pointer"
                  onClick={() => setSelectedCase(secCase)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`w-10 h-10 ${badge.bg} rounded-xl flex items-center justify-center border ${badge.border} shrink-0`}>
                        <badge.icon className={`w-5 h-5 ${badge.text}`} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="font-mono text-white font-medium">{secCase.callerNumber}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${badge.bg} ${badge.text} font-semibold`}>
                            {badge.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-white/40">
                          <span className="inline-block px-2 py-0.5 bg-warning/10 text-warning rounded-full">{secCase.scamType}</span>
                          <span>{new Date(secCase.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-xl font-bold ${riskColor(secCase.peakRiskScore)}`}>
                        {secCase.peakRiskScore}<span className="text-xs opacity-60 font-normal">/100</span>
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedCase(secCase); }}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/50 hover:text-white"
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
