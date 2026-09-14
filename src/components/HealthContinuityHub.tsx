import React, { useState, useEffect } from 'react';
import {
  Activity,
  History,
  GitCompare,
  FileSpreadsheet,
  CalendarCheck,
  ShieldAlert,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Sparkles,
  Printer,
  ChevronRight,
  RefreshCw,
  QrCode,
  FileText,
  Heart,
  Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../localization/language_context';

export default function HealthContinuityHub({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'timeline' | 'changes' | 'copilot' | 'followups' | 'passport'>('overview');
  const [loading, setLoading] = useState(true);
  const [overviewData, setOverviewData] = useState<any>(null);
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [timelineFilter, setTimelineFilter] = useState<string>('ALL');
  const [changesData, setChangesData] = useState<any>(null);
  const [doctorBrief, setDoctorBrief] = useState<any>(null);
  const [followups, setFollowups] = useState<any[]>([]);
  const [passportData, setPassportData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // New followup form state
  const [showAddFollowup, setShowAddFollowup] = useState(false);
  const [newFollowupTitle, setNewFollowupTitle] = useState('');
  const [newFollowupDate, setNewFollowupDate] = useState('');
  const [newFollowupCategory, setNewFollowupCategory] = useState('LAB_RETEST');
  const [newFollowupPriority, setNewFollowupPriority] = useState('MEDIUM');

  const token = localStorage.getItem('dhealora_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/continuity/overview', { headers });
      const data = await res.json();
      if (data.success) {
        setOverviewData(data);
      }
    } catch (err) {
      console.error('Error fetching continuity overview:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeline = async () => {
    try {
      const res = await fetch('/api/continuity/timeline', { headers });
      const data = await res.json();
      if (data.success) setTimelineEvents(data.events || []);
    } catch (err) {
      console.error('Error fetching timeline:', err);
    }
  };

  const fetchChanges = async () => {
    try {
      const res = await fetch('/api/continuity/changes', { headers });
      const data = await res.json();
      if (data.success) setChangesData(data);
    } catch (err) {
      console.error('Error fetching changes:', err);
    }
  };

  const fetchDoctorBrief = async () => {
    try {
      const res = await fetch('/api/continuity/doctor-brief', { headers });
      const data = await res.json();
      if (data.success) setDoctorBrief(data.brief);
    } catch (err) {
      console.error('Error fetching doctor brief:', err);
    }
  };

  const fetchFollowups = async () => {
    try {
      const res = await fetch('/api/continuity/followups', { headers });
      const data = await res.json();
      if (data.success) setFollowups(data.followups || []);
    } catch (err) {
      console.error('Error fetching followups:', err);
    }
  };

  const fetchPassport = async () => {
    try {
      const res = await fetch('/api/continuity/passport', { headers });
      const data = await res.json();
      if (data.success) setPassportData(data.passport);
    } catch (err) {
      console.error('Error fetching passport:', err);
    }
  };

  useEffect(() => {
    fetchOverview();
    fetchTimeline();
    fetchChanges();
    fetchDoctorBrief();
    fetchFollowups();
    fetchPassport();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/continuity/search?q=${encodeURIComponent(searchQuery)}`, { headers });
      const data = await res.json();
      if (data.success) setSearchResults(data.results || []);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCreateFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFollowupTitle || !newFollowupDate) return;
    try {
      const res = await fetch('/api/continuity/followups', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: newFollowupTitle,
          dueDate: newFollowupDate,
          category: newFollowupCategory,
          priority: newFollowupPriority
        })
      });
      const data = await res.json();
      if (data.success) {
        setNewFollowupTitle('');
        setNewFollowupDate('');
        setShowAddFollowup(false);
        fetchFollowups();
        fetchOverview();
      }
    } catch (err) {
      console.error('Create followup error:', err);
    }
  };

  const handleCompleteFollowup = async (id: string) => {
    try {
      const res = await fetch(`/api/continuity/followups/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: 'COMPLETED' })
      });
      const data = await res.json();
      if (data.success) {
        fetchFollowups();
        fetchOverview();
      }
    } catch (err) {
      console.error('Update followup error:', err);
    }
  };

  const filteredTimeline = timelineFilter === 'ALL'
    ? timelineEvents
    : timelineEvents.filter(e => e.event_type === timelineFilter);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-teal-950 to-emerald-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-3 backdrop-blur-xs border border-emerald-500/30">
              <Activity className="w-3.5 h-3.5" />
              Health Continuity Engine v3.0
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Longitudinal Health & Care Continuity
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
              Unified longitudinal health intelligence combining laboratory biomarkers, daily vitals, clinical doctor notes, and actionable follow-ups with verified evidence citations.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => {
                fetchOverview();
                fetchTimeline();
                fetchChanges();
                fetchDoctorBrief();
                fetchFollowups();
              }}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-2 backdrop-blur-xs transition border border-white/10"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Sync Engine
            </button>
            <button
              onClick={() => setActiveSubTab('copilot')}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Doctor Visit Prep
            </button>
          </div>
        </div>

        {/* Global Search Bar */}
        <form onSubmit={handleSearch} className="relative mt-6 max-w-xl">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search longitudinal history (e.g., HbA1c, Cholesterol, Dr. Sharma, Fever)..."
            className="w-full pl-10 pr-24 py-3 bg-white/10 border border-white/20 rounded-2xl text-sm text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-400 backdrop-blur-md"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <button
            type="submit"
            disabled={isSearching}
            className="absolute right-2 top-2 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </form>

        {/* Search Results Drawer */}
        {searchResults.length > 0 && (
          <div className="mt-4 bg-slate-900/90 border border-slate-700 rounded-2xl p-4 max-h-60 overflow-y-auto space-y-2">
            <div className="text-xs font-bold text-slate-400 flex items-center justify-between">
              <span>{searchResults.length} historical records found</span>
              <button onClick={() => setSearchResults([])} className="text-slate-400 hover:text-white">Clear</button>
            </div>
            {searchResults.map((res, i) => (
              <div key={i} className="p-2.5 bg-white/5 rounded-xl text-xs flex items-center justify-between hover:bg-white/10 transition">
                <div>
                  <span className="font-bold text-emerald-400 block">{res.title}</span>
                  <span className="text-slate-300 text-[11px]">{res.snippet}</span>
                </div>
                <span className="text-[10px] text-slate-400 whitespace-nowrap ml-4">{res.date?.split('T')[0]}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Engine Sub-Navigation Bar */}
      <div className="flex overflow-x-auto gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
        {[
          { id: 'overview', label: 'Continuity Overview', icon: Activity },
          { id: 'timeline', label: 'Health Timeline', icon: History },
          { id: 'changes', label: 'What Changed?', icon: GitCompare },
          { id: 'copilot', label: 'Doctor Copilot Brief', icon: FileSpreadsheet },
          { id: 'followups', label: 'Follow-ups & Care Plans', icon: CalendarCheck },
          { id: 'passport', label: 'Emergency Health Passport', icon: ShieldAlert }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition ${
                isActive
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Safety Notice Card */}
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-800 dark:text-amber-300">
        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Clinical Safety Notice: </span>
          AI-generated educational information. It does not constitute a diagnosis or medical advice. Consult a qualified healthcare professional for medical interpretation and treatment.
        </div>
      </div>

      {/* SUB-VIEW 1: OVERVIEW */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Lab Reports', value: overviewData?.stats?.totalReports ?? 0, icon: FileText, color: 'text-blue-500' },
              { label: 'Tracked Vitals', value: overviewData?.stats?.totalVitals ?? 0, icon: Activity, color: 'text-emerald-500' },
              { label: 'Active Prescriptions', value: overviewData?.stats?.activeMedications ?? 0, icon: Heart, color: 'text-purple-500' },
              { label: 'Pending Followups', value: overviewData?.stats?.activeFollowups ?? 0, icon: CalendarCheck, color: 'text-amber-500' },
              { label: 'Urgent Actions', value: overviewData?.stats?.urgentFollowupsCount ?? 0, icon: AlertTriangle, color: 'text-rose-500' },
              { label: 'Doctor Consults', value: overviewData?.stats?.doctorNotesCount ?? 0, icon: FileSpreadsheet, color: 'text-teal-500' },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{stat.label}</span>
                    <Icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">{stat.value}</div>
                </div>
              );
            })}
          </div>

          {/* Longitudinal Insights & Gaps */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Longitudinal Events */}
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <History className="w-4 h-4 text-emerald-500" />
                  Recent Health Timeline
                </h3>
                <button
                  onClick={() => setActiveSubTab('timeline')}
                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                >
                  View Full Feed <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3">
                {overviewData?.recentEvents?.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">No longitudinal records found yet. Upload a lab report or log vitals to build history.</p>
                ) : (
                  overviewData?.recentEvents?.map((evt: any, i: number) => (
                    <div key={i} className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl flex items-start gap-3 border border-slate-100 dark:border-slate-800">
                      <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                        evt.severity === 'critical' ? 'bg-rose-500' : evt.severity === 'alert' || evt.severity === 'attention' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{evt.title}</span>
                          <span className="text-[10px] text-slate-400 shrink-0">{evt.event_date?.split('T')[0]}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-1 mt-0.5">{evt.summary}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Evidence & Care Gaps */}
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-teal-500" />
                Continuity & Evidence Integrity Gaps
              </h3>

              <div className="space-y-3">
                {overviewData?.missingEvidence?.length === 0 ? (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span>Continuity records are comprehensive. All vital baselines and active prescriptions have logged longitudinal data.</span>
                  </div>
                ) : (
                  overviewData?.missingEvidence?.map((gap: any, i: number) => (
                    <div key={i} className="p-3.5 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-900 dark:text-amber-300">{gap.domain} Gap</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 rounded-md">Action Recommended</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400">{gap.description}</p>
                      <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">{gap.recommendation}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: TIMELINE */}
      {activeSubTab === 'timeline' && (
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-500" />
                Longitudinal Health Feed
              </h2>
              <p className="text-xs text-slate-500">Chronological aggregation across lab tests, vitals, prescriptions, doctor notes, and check-ins.</p>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-1.5">
              {['ALL', 'LAB_REPORT', 'VITAL_READING', 'MEDICATION_STARTED', 'DOCTOR_VISIT', 'DAILY_CHECKIN'].map(f => (
                <button
                  key={f}
                  onClick={() => setTimelineFilter(f)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    timelineFilter === f
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {f.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
            {filteredTimeline.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">No timeline events matched the selected filter.</p>
            ) : (
              filteredTimeline.map((evt, i) => (
                <div key={i} className="relative">
                  <div className={`absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-800 ${
                    evt.severity === 'critical' ? 'bg-rose-500 ring-4 ring-rose-100 dark:ring-rose-950' :
                    evt.severity === 'alert' || evt.severity === 'attention' ? 'bg-amber-500 ring-4 ring-amber-100 dark:ring-amber-950' :
                    'bg-emerald-500 ring-4 ring-emerald-100 dark:ring-emerald-950'
                  }`} />

                  <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 hover:border-emerald-200 dark:hover:border-emerald-800 transition">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{evt.title}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {evt.event_type}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(evt.event_date).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-1">
                      {evt.summary}
                    </p>

                    {evt.metadata && (
                      <div className="mt-2.5 pt-2.5 border-t border-slate-200/60 dark:border-slate-800 flex flex-wrap gap-2 text-[11px] text-slate-500">
                        {Object.entries(evt.metadata).map(([k, v]) => (
                          <span key={k} className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            {k}: <strong className="text-slate-800 dark:text-slate-200">{String(v)}</strong>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: WHAT CHANGED? */}
      {activeSubTab === 'changes' && (
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <GitCompare className="w-5 h-5 text-emerald-500" />
                "What Changed?" Parameter Comparator
              </h2>
              <p className="text-xs text-slate-500">{changesData?.summary}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {changesData?.deltas?.length === 0 ? (
              <div className="col-span-2 p-8 text-center text-xs text-slate-500">
                Upload multiple sequential lab tests or log continuous vitals to unlock comparative delta analytics.
              </div>
            ) : (
              changesData?.deltas?.map((delta: any, i: number) => {
                const isIncreased = delta.direction === 'increased';
                const isDecreased = delta.direction === 'decreased';
                const isStable = delta.direction === 'stable';

                return (
                  <div key={i} className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-black text-slate-900 dark:text-white block">{delta.parameterName}</span>
                        <span className="text-[10px] text-slate-400">{delta.category} • Range: {delta.referenceRange}</span>
                      </div>
                      <div className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 ${
                        isIncreased ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300' :
                        isDecreased ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300' :
                        'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}>
                        {isIncreased && <ArrowUpRight className="w-3.5 h-3.5" />}
                        {isDecreased && <ArrowDownRight className="w-3.5 h-3.5" />}
                        {isStable && <Minus className="w-3.5 h-3.5" />}
                        <span className="capitalize">{delta.direction.replace('_', ' ')}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Previous ({delta.previousDate || 'Initial'})</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {delta.previousValue != null ? `${delta.previousValue} ${delta.unit}` : 'Baseline'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Current ({delta.currentDate})</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {delta.currentValue} {delta.unit}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic">
                      "{delta.objectiveObservation}"
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SUB-VIEW 4: DOCTOR COPILOT BRIEF */}
      {activeSubTab === 'copilot' && (
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-700 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
                <Sparkles className="w-4 h-4" />
                Doctor Visit Preparation Copilot
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Structured Clinical Appointment Brief
              </h2>
              <p className="text-xs text-slate-500">Longitudinal compilation formatted specifically for rapid clinical review by physicians.</p>
            </div>

            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition"
            >
              <Printer className="w-4 h-4" />
              Print / Export PDF
            </button>
          </div>

          <div className="space-y-6">
            {/* Section 1: User Reported */}
            <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-center font-bold">1</span>
                Section I: Patient-Reported Symptoms & Lifestyle Context
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-bold text-slate-500 block mb-1">Current Chief Symptoms:</span>
                  <ul className="list-disc pl-4 space-y-1 text-slate-700 dark:text-slate-300">
                    {doctorBrief?.userReportedSection?.chiefSymptoms?.map((s: any, i: number) => (
                      <li key={i}><strong>{s.symptom}</strong> ({s.duration} - Severity: {s.severity})</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="font-bold text-slate-500 block mb-1">Daily Logged Summary:</span>
                  <p className="text-slate-700 dark:text-slate-300">{doctorBrief?.userReportedSection?.recentCheckInsSummary}</p>
                </div>
              </div>
            </div>

            {/* Section 2: Lab Derived */}
            <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs flex items-center justify-center font-bold">2</span>
                Section II: Diagnostic Laboratory & Biomarker Findings
              </h3>
              <div className="space-y-2 text-xs">
                <span className="font-bold text-slate-500 block">Out-of-Range or Tracked Biomarkers:</span>
                {doctorBrief?.labDerivedSection?.abnormalBiomarkers?.length === 0 ? (
                  <p className="text-slate-500 italic">No abnormal laboratory biomarkers detected on active file.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {doctorBrief?.labDerivedSection?.abnormalBiomarkers?.map((bio: any, i: number) => (
                      <div key={i} className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white">{bio.testName}</span>
                          <span className="text-[10px] text-slate-400 block">Ref: {bio.referenceRange}</span>
                        </div>
                        <span className="font-black text-rose-600 dark:text-rose-400">{bio.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Section 3: AI Educational Questions */}
            <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900/40 space-y-3">
              <h3 className="text-sm font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-center font-bold">3</span>
                Section III: Suggested Physician Discussion Questions
              </h3>
              <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                {doctorBrief?.aiEducationalSection?.suggestedDoctorQuestions?.map((q: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 5: FOLLOWUPS */}
      {activeSubTab === 'followups' && (
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-emerald-500" />
                Actionable Follow-ups & Care Plans
              </h2>
              <p className="text-xs text-slate-500">Track scheduled diagnostic re-tests, prescription refills, and clinical checkups with source linkage.</p>
            </div>

            <button
              onClick={() => setShowAddFollowup(!showAddFollowup)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              Add Follow-up
            </button>
          </div>

          {/* Add Followup Modal/Card */}
          {showAddFollowup && (
            <form onSubmit={handleCreateFollowup} className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
              <h4 className="font-bold text-slate-900 dark:text-white">Create New Follow-up Target</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Task title (e.g., Lipid Panel Re-test, Cardiologist Review)"
                  value={newFollowupTitle}
                  onChange={(e) => setNewFollowupTitle(e.target.value)}
                  required
                  className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
                <input
                  type="date"
                  value={newFollowupDate}
                  onChange={(e) => setNewFollowupDate(e.target.value)}
                  required
                  className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
                <select
                  value={newFollowupCategory}
                  onChange={(e) => setNewFollowupCategory(e.target.value)}
                  className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  <option value="LAB_RETEST">Lab Retest</option>
                  <option value="DOCTOR_VISIT">Doctor Visit</option>
                  <option value="MEDICATION_REFILL">Medication Refill</option>
                  <option value="VITAL_CHECK">Vital Check Target</option>
                </select>
                <select
                  value={newFollowupPriority}
                  onChange={(e) => setNewFollowupPriority(e.target.value)}
                  className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  <option value="LOW">Low Priority</option>
                  <option value="MEDIUM">Medium Priority</option>
                  <option value="HIGH">High Priority</option>
                  <option value="URGENT">Urgent Action</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddFollowup(false)} className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-300">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg font-bold">Save Follow-up</button>
              </div>
            </form>
          )}

          {/* Follow-up List */}
          <div className="space-y-3">
            {followups.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No scheduled followups found. Create your first care task above.</p>
            ) : (
              followups.map((f, i) => (
                <div key={i} className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition ${
                  f.status === 'COMPLETED' ? 'bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 opacity-60' :
                  f.status === 'OVERDUE' ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60' :
                  'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                }`}>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${f.status === 'COMPLETED' ? 'line-through text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                        {f.title}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        f.priority === 'URGENT' || f.priority === 'HIGH' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        {f.category}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2">
                      <span>Due: {f.due_date}</span>
                      <span>•</span>
                      <span className={`font-bold uppercase ${f.status === 'OVERDUE' ? 'text-rose-600' : f.status === 'COMPLETED' ? 'text-emerald-600' : 'text-slate-600 dark:text-slate-300'}`}>{f.status}</span>
                    </div>
                  </div>

                  {f.status !== 'COMPLETED' && (
                    <button
                      onClick={() => handleCompleteFollowup(f.id)}
                      className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Mark Done
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SUB-VIEW 6: HEALTH PASSPORT */}
      {activeSubTab === 'passport' && (
        <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-700 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider mb-1">
                <QrCode className="w-4 h-4" />
                ABDM Compatible Emergency Profile
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Emergency Health Passport
              </h2>
              <p className="text-xs text-slate-500">ID: {passportData?.passportId} • Generated: {passportData?.generatedAt?.split('T')[0]}</p>
            </div>

            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition"
            >
              <Printer className="w-4 h-4" />
              Print Emergency Card
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Critical Emergency Card */}
            <div className="p-5 bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 rounded-2xl space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-rose-800 dark:text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Critical Emergency Details
              </h4>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="font-bold text-slate-600 dark:text-slate-400 block">Blood Group:</span>
                  <span className="text-sm font-black text-rose-600 dark:text-rose-400">{passportData?.patient?.bloodGroup || 'O+'}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-600 dark:text-slate-400 block">Known Allergies:</span>
                  <span className="text-slate-900 dark:text-white font-bold">{passportData?.criticalEmergencyInfo?.allergies?.join(', ')}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-600 dark:text-slate-400 block">Emergency Medical Directives:</span>
                  <p className="text-slate-700 dark:text-slate-300">{passportData?.criticalEmergencyInfo?.emergencyNotes}</p>
                </div>
              </div>
            </div>

            {/* Active Medications & Care Contacts */}
            <div className="p-5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Active Prescriptions & Contacts
              </h4>
              <div className="space-y-2 text-xs">
                <span className="font-bold text-slate-500 block">Current Medications:</span>
                <ul className="list-disc pl-4 space-y-1 text-slate-700 dark:text-slate-300">
                  {passportData?.currentMedications?.length === 0 ? (
                    <li>No active prescribed medications.</li>
                  ) : (
                    passportData?.currentMedications?.map((m: any, i: number) => (
                      <li key={i}><strong>{m.name}</strong> - {m.dosage} ({m.frequency})</li>
                    ))
                  )}
                </ul>

                <span className="font-bold text-slate-500 block pt-2">Emergency Contacts:</span>
                {passportData?.criticalEmergencyInfo?.emergencyContacts?.map((c: any, i: number) => (
                  <div key={i} className="text-slate-700 dark:text-slate-300">
                    <strong>{c.name}</strong> ({c.relation}) - {c.phone}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
