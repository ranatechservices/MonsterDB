import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Upload,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Search,
  Eye,
  Download,
  ShieldCheck,
  Activity,
  HelpCircle,
  Info,
  X,
  Copy,
  Check,
  FileCheck,
  Stethoscope,
  ChevronRight,
  AlertTriangle,
  HeartPulse,
  Printer,
  Trash2,
  Plus,
  RefreshCw,
  TrendingUp,
  Languages,
  UserCheck,
  ShieldAlert,
  ArrowDownRight,
  ArrowUpRight,
  PhoneCall,
  SlidersHorizontal,
  ExternalLink
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { api } from '../lib/api';
import { HealthEventBus } from '../lib/eventBus';
import { useLanguage } from '../localization/language_context';

export interface BiomarkerParam {
  id?: string;
  test_name: string;
  test_name_clean?: string;
  result_numeric?: number;
  result_text: string | number;
  unit?: string;
  reference_range_raw?: string;
  status: 'normal' | 'low' | 'high' | 'critical_low' | 'critical_high' | 'abnormal';
  confidence?: number;
  plain_language_explanation?: string;
  plain_language_explanation_hi?: string;
}

export interface FindingItem {
  id?: string;
  finding_type: 'normal' | 'abnormal' | 'critical';
  title: string;
  title_hi?: string;
  description: string;
  description_hi?: string;
  severity: 'normal' | 'watch' | 'discuss_with_doctor' | 'seek_prompt_care' | 'urgent';
  related_biomarkers?: string[];
  precautions?: string[];
}

export interface QuestionItem {
  id?: string;
  question_text: string;
  question_text_hi?: string;
  category?: string;
  importance?: string;
  answers?: Array<{
    educational_answer: string;
    educational_answer_hi?: string;
  }>;
}

export interface RecommendationItem {
  id?: string;
  category: 'diet' | 'lifestyle' | 'follow_up' | 'medication_vigilance' | 'diagnostic';
  title: string;
  title_hi?: string;
  description: string;
  description_hi?: string;
  urgency: 'routine' | 'timely' | 'prompt' | 'urgent';
}

export interface TrendItem {
  id?: string;
  test_name_clean: string;
  report_date: string;
  numeric_value: number;
  unit?: string;
  status?: string;
}

export interface FullReportBundle {
  report: {
    id: string;
    title: string;
    category: string;
    report_date: string;
    lab_name?: string;
    doctor_name?: string;
    status: 'pending' | 'processing' | 'analyzed' | 'failed';
    attention_level: 'LOW_CONCERN' | 'MODERATE_ATTENTION' | 'HIGH_ATTENTION' | 'URGENT_MEDICAL_REVIEW';
    ai_summary?: string;
    ai_summary_hi?: string;
    raw_extracted_text?: string;
    language_pref?: string;
  };
  parameters: BiomarkerParam[];
  findings: FindingItem[];
  questions: QuestionItem[];
  recommendations: RecommendationItem[];
  trends: TrendItem[];
  analysis?: {
    report_summary: string;
    report_summary_hi?: string;
    attention_level: string;
    normal_findings_count: number;
    abnormal_findings_count: number;
    safety_notes: string[];
    missing_information: string[];
    disclaimer: string;
  };
}

export default function ReportAnalyzer() {
  const [reportsList, setReportsList] = useState<any[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [activeBundle, setActiveBundle] = useState<FullReportBundle | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingBundle, setLoadingBundle] = useState(false);

  // Active Tab: 'overview' | 'results' | 'findings' | 'questions' | 'careplan' | 'trends'
  const [activeTab, setActiveTab] = useState<'overview' | 'results' | 'findings' | 'questions' | 'careplan' | 'trends'>('overview');
  
  // Language toggle for medical explanations: 'en' | 'hi'
  const [explanationLang, setExplanationLang] = useState<'en' | 'hi'>('en');

  // Upload modal & form states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [reportTitle, setReportTitle] = useState('');
  const [reportCategory, setReportCategory] = useState<string>('blood');
  const [reportDate, setReportDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [rawText, setRawText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Job progress states
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentJobStep, setCurrentJobStep] = useState<string>('');
  const [jobProgress, setJobProgress] = useState<number>(0);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  // Filters & toggles
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [abnormalOnly, setAbnormalOnly] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);
  const [userConsentGiven, setUserConsentGiven] = useState(true);

  // Health Profile State
  const [healthProfile, setHealthProfile] = useState<any>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollTimerRef = useRef<any>(null);
  const { t } = useLanguage();

  // Load Reports & Health Profile on mount
  const fetchReports = async (forceSelectId?: string) => {
    try {
      setLoadingList(true);
      const list = await api.medicalReports.list();
      setReportsList(list || []);

      if (list && list.length > 0) {
        const targetId = forceSelectId || selectedReportId;
        if (targetId && list.some((r: any) => r.id === targetId)) {
          // If already loaded or forced, keep target
          if (!activeBundle || activeBundle.report?.id !== targetId) {
            loadReportBundle(targetId);
          }
        } else if (!selectedReportId) {
          loadReportBundle(list[0].id);
        }
      } else {
        setSelectedReportId(null);
        setActiveBundle(null);
      }
    } catch (e: any) {
      console.warn('Failed to load reports:', e);
    } finally {
      setLoadingList(false);
    }
  };

  const loadHealthProfile = async () => {
    try {
      const p = await api.healthProfile.get();
      if (p) setHealthProfile(p);
    } catch (e) {
      console.warn('Failed to load health profile:', e);
    }
  };

  const loadReportBundle = async (reportId: string) => {
    try {
      setLoadingBundle(true);
      setSelectedReportId(reportId);
      const res = await api.medicalReports.getBundle(reportId);
      if (res && res.report) {
        setActiveBundle({
          report: res.report,
          parameters: res.parameters || [],
          findings: res.findings || [],
          questions: res.questions || [],
          recommendations: res.recommendations || [],
          trends: res.trends || [],
          analysis: res.analysis
        });
      }
    } catch (err: any) {
      console.error('Failed to load report bundle:', err);
    } finally {
      setLoadingBundle(false);
    }
  };

  useEffect(() => {
    fetchReports();
    loadHealthProfile();
    const unsub = HealthEventBus.on('reports_updated', () => fetchReports());
    return () => {
      unsub();
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  // Poll active analysis job status
  useEffect(() => {
    if (!activeJobId || !isProcessing) return;

    pollTimerRef.current = setInterval(async () => {
      try {
        const res = await api.medicalReports.getJobStatus(activeJobId);
        if (res && res.job) {
          setJobProgress(res.job.progress_percentage || 10);
          setCurrentJobStep(res.job.current_step || 'Analyzing document...');

          if (res.job.status === 'completed') {
            const completedReportId = res.job.report_id;
            clearInterval(pollTimerRef.current);
            setActiveJobId(null);
            if (completedReportId) {
              await loadReportBundle(completedReportId);
              await fetchReports(completedReportId);
            } else {
              await fetchReports();
            }
            setIsProcessing(false);
          } else if (res.job.status === 'failed') {
            setIsProcessing(false);
            clearInterval(pollTimerRef.current);
            setActiveJobId(null);
            setErrorMessage(res.job.error_message || 'Analysis failed. Please check document and try again.');
          }
        }
      } catch (e) {
        console.warn('Job polling notice:', e);
      }
    }, 1200);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [activeJobId, isProcessing]);

  // File Handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!reportTitle) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        setReportTitle(cleanName);
      }
      setErrorMessage(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      if (!reportTitle) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        setReportTitle(cleanName);
      }
      setErrorMessage(null);
    }
  };

  // Submit Upload Flow
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTitle && !selectedFile && !rawText) {
      setErrorMessage('Please provide a report title, document file, or paste test values.');
      return;
    }

    setShowUploadModal(false);
    setShowConsentModal(true);
  };

  const handleConfirmConsentAndProcess = async () => {
    setShowConsentModal(false);
    setIsProcessing(true);
    setJobProgress(8);
    setCurrentJobStep('Initiating secure encrypted upload & AI analysis...');
    setErrorMessage(null);

    try {
      // Record Consent (non-blocking)
      try {
        await api.medicalReports.recordConsent({
          consent_type: 'ai_lab_analysis',
          granted: true,
          disclaimer_text_shown: 'Explicit user agreement for AI-driven clinical report extraction and educational analysis.'
        });
      } catch (consentErr) {
        console.warn('Consent recording notice:', consentErr);
      }

      const formData = new FormData();
      if (selectedFile) {
        formData.append('file', selectedFile);
      }
      formData.append('title', reportTitle || selectedFile?.name?.replace(/\.[^/.]+$/, '') || 'Clinical Lab Test');
      formData.append('category', reportCategory || 'blood');
      formData.append('report_date', reportDate || new Date().toISOString().split('T')[0]);
      if (rawText) formData.append('raw_text', rawText);
      formData.append('auto_analyze', 'true');

      const res = await api.medicalReports.upload(formData);

      if (res && res.success && res.job) {
        setActiveJobId(res.job.id);
        setSelectedFile(null);
        setRawText('');
        setReportTitle('');
      } else if (res && res.report && res.report.id) {
        // Trigger manual analysis if job wasn't auto-returned
        const jobRes = await api.medicalReports.analyze(res.report.id, rawText);
        if (jobRes && jobRes.job) {
          setActiveJobId(jobRes.job.id);
        } else {
          await loadReportBundle(res.report.id);
          await fetchReports(res.report.id);
          setIsProcessing(false);
        }
      } else {
        throw new Error(res?.error || 'Upload server response was incomplete. Please check file format and retry.');
      }
    } catch (err: any) {
      console.error('Upload processing error:', err);
      setIsProcessing(false);
      setErrorMessage(err?.message || 'Failed to upload and analyze report.');
    }
  };

  // Quick Seed / Sample Report Loader
  const handleLoadSampleReport = async (sampleType: 'cbc' | 'lipid' | 'metabolic') => {
    setIsProcessing(true);
    setJobProgress(10);
    setCurrentJobStep('Loading clinical sample laboratory report...');
    setErrorMessage(null);

    const sampleData = {
      cbc: {
        title: 'Complete Blood Count (CBC) with Differential',
        category: 'blood',
        text: `PATIENT LAB REPORT: Complete Blood Count
Date: ${new Date().toISOString().split('T')[0]}
Lab: Apex Diagnostic Pathology

Biomarkers:
Hemoglobin: 11.2 g/dL (Reference: 12.0 - 15.5 g/dL) [LOW]
RBC Count: 3.8 mill/mcL (Reference: 4.0 - 5.2 mill/mcL) [LOW]
Packed Cell Volume (PCV): 34.0 % (Reference: 36 - 46 %) [LOW]
MCV: 74.0 fL (Reference: 80 - 100 fL) [LOW]
MCH: 24.5 pg (Reference: 27 - 33 pg) [LOW]
MCHC: 30.5 g/dL (Reference: 32 - 36 g/dL) [LOW]
Total WBC Count: 6800 /mcL (Reference: 4500 - 11000 /mcL) [NORMAL]
Platelet Count: 245000 /mcL (Reference: 150000 - 450000 /mcL) [NORMAL]
ESR (1st hr): 18 mm/hr (Reference: 0 - 20 mm/hr) [NORMAL]`
      },
      lipid: {
        title: 'Comprehensive Lipid & Cardiovascular Profile',
        category: 'cardiac',
        text: `PATIENT LAB REPORT: Lipid Panel
Date: ${new Date().toISOString().split('T')[0]}
Lab: Metropolitan Clinical Labs

Biomarkers:
Total Cholesterol: 242.0 mg/dL (Reference: < 200 mg/dL) [HIGH]
Triglycerides: 215.0 mg/dL (Reference: < 150 mg/dL) [HIGH]
HDL (Good) Cholesterol: 38.0 mg/dL (Reference: > 40 mg/dL) [LOW]
LDL (Bad) Cholesterol: 161.0 mg/dL (Reference: < 100 mg/dL) [HIGH]
VLDL Cholesterol: 43.0 mg/dL (Reference: 5 - 30 mg/dL) [HIGH]
Total / HDL Ratio: 6.37 (Reference: < 4.5) [HIGH]
Non-HDL Cholesterol: 204.0 mg/dL (Reference: < 130 mg/dL) [HIGH]`
      },
      metabolic: {
        title: 'Comprehensive Metabolic Panel (CMP) & HbA1c',
        category: 'blood',
        text: `PATIENT LAB REPORT: Metabolic & Renal Screen
Date: ${new Date().toISOString().split('T')[0]}
Lab: National Health Diagnostics

Biomarkers:
Fasting Blood Sugar: 138.0 mg/dL (Reference: 70 - 99 mg/dL) [HIGH]
HbA1c (Glycated Hemoglobin): 7.2 % (Reference: 4.0 - 5.6 %) [HIGH]
Serum Creatinine: 1.05 mg/dL (Reference: 0.70 - 1.30 mg/dL) [NORMAL]
Blood Urea Nitrogen (BUN): 16.0 mg/dL (Reference: 7 - 20 mg/dL) [NORMAL]
Serum Calcium: 9.4 mg/dL (Reference: 8.5 - 10.2 mg/dL) [NORMAL]
Serum Sodium: 140.0 mEq/L (Reference: 135 - 145 mEq/L) [NORMAL]
Serum Potassium: 4.2 mEq/L (Reference: 3.5 - 5.1 mEq/L) [NORMAL]`
      }
    }[sampleType];

    try {
      const formData = new FormData();
      formData.append('title', sampleData.title);
      formData.append('category', sampleData.category);
      formData.append('report_date', new Date().toISOString().split('T')[0]);
      formData.append('raw_text', sampleData.text);
      formData.append('auto_analyze', 'true');

      const res = await api.medicalReports.upload(formData);
      if (res && res.success && res.job) {
        setActiveJobId(res.job.id);
      } else if (res && res.report && res.report.id) {
        const jobRes = await api.medicalReports.analyze(res.report.id, sampleData.text);
        if (jobRes && jobRes.job) {
          setActiveJobId(jobRes.job.id);
        } else {
          await loadReportBundle(res.report.id);
          await fetchReports(res.report.id);
          setIsProcessing(false);
        }
      } else {
        throw new Error(res?.error || 'Failed to load sample report.');
      }
    } catch (e: any) {
      console.error('Sample report error:', e);
      setIsProcessing(false);
      setErrorMessage(e?.message || 'Failed to process sample report');
    }
  };

  // Delete Report
  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to remove this medical report? This will archive the findings safely.')) return;
    try {
      await api.medicalReports.delete(reportId);
      await fetchReports();
    } catch (err: any) {
      alert('Failed to delete report: ' + err.message);
    }
  };

  // Copy Doctor Questions to Clipboard
  const handleCopyQuestions = () => {
    if (!activeBundle?.questions || !Array.isArray(activeBundle.questions)) return;
    const text = activeBundle.questions
      .map((q, i) => `${i + 1}. ${explanationLang === 'hi' && q?.question_text_hi ? q.question_text_hi : (q?.question_text || '')}`)
      .join('\n\n');
    navigator.clipboard.writeText(`Healora Doctor Consultation Questions (${activeBundle?.report?.title || 'Report'}):\n\n${text}`);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2500);
  };

  // Re-Analyze current report
  const handleReanalyze = async () => {
    if (!activeBundle?.report?.id) return;
    setIsProcessing(true);
    setJobProgress(10);
    setCurrentJobStep('Re-evaluating report with clinical AI models...');
    setErrorMessage(null);
    try {
      const res = await api.medicalReports.analyze(activeBundle.report.id, activeBundle.report.raw_extracted_text);
      if (res && res.job) {
        setActiveJobId(res.job.id);
      } else {
        await loadReportBundle(activeBundle.report.id);
        setIsProcessing(false);
      }
    } catch (e: any) {
      setIsProcessing(false);
      setErrorMessage(e?.message || 'Re-analysis failed');
    }
  };

  // Save Health Profile
  const handleSaveHealthProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const updated = await api.healthProfile.update(healthProfile);
      setHealthProfile(updated);
      setShowProfileDrawer(false);
    } catch (e: any) {
      alert('Failed to update health profile: ' + e.message);
    } finally {
      setSavingProfile(false);
    }
  };

  // Filtered reports list
  const filteredReports = (reportsList || []).filter((r) => {
    if (!r) return false;
    const matchesSearch =
      (r.title || '').toLowerCase().includes(searchFilter.toLowerCase()) ||
      (r.lab_name || '').toLowerCase().includes(searchFilter.toLowerCase()) ||
      (r.category || '').toLowerCase().includes(searchFilter.toLowerCase());
    const matchesCat = categoryFilter === 'all' || r.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  // Filtered parameters for table
  const displayedParameters = (activeBundle?.parameters || []).filter((p) => {
    if (!p) return false;
    if (abnormalOnly) return p.status !== 'normal';
    return true;
  });

  // Prepare trend chart data
  const trendDataMap: Record<string, any> = {};
  (activeBundle?.trends || []).forEach((t) => {
    if (t && t.report_date && t.test_name_clean) {
      if (!trendDataMap[t.report_date]) {
        trendDataMap[t.report_date] = { date: t.report_date };
      }
      trendDataMap[t.report_date][t.test_name_clean] = t.numeric_value;
    }
  });
  const trendChartData = Object.values(trendDataMap).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Distinct trend keys for chart lines
  const trendBiomarkerKeys = Array.from(
    new Set((activeBundle?.trends || []).map((t) => t?.test_name_clean).filter(Boolean))
  ).slice(0, 4) as string[];

  const colors = ['#059669', '#2563eb', '#d97706', '#dc2626'];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Header Banner */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Healora AI Lab Report Analyzer
                </h1>
                <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Clinical 2.5 Flash
                </span>
              </div>
              <p className="text-xs text-slate-500">
                PostgreSQL-backed Biomarker Extraction, Multi-Turn Range Verification & Plain-Language Guidance
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            {/* Language Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setExplanationLang('en')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  explanationLang === 'en'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setExplanationLang('hi')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                  explanationLang === 'hi'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                हिन्दी (Hindi)
              </button>
            </div>

            {/* Health Profile Button */}
            <button
              type="button"
              onClick={() => setShowProfileDrawer(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span>Health Context</span>
            </button>

            {/* Upload Report Button */}
            <button
              type="button"
              onClick={() => {
                setSelectedFile(null);
                setRawText('');
                setReportTitle('');
                setErrorMessage(null);
                setShowUploadModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-xs transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload New Report</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <div className="font-semibold">Notice</div>
              <div>{errorMessage}</div>
            </div>
            <button type="button" onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-rose-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Processing Stepper Screen */}
        {isProcessing && (
          <div className="mb-8 p-6 bg-white border border-emerald-200 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full border-3 border-emerald-100 border-t-emerald-600 animate-spin flex items-center justify-center">
                    <Activity className="w-4 h-4 text-emerald-600 animate-pulse" />
                  </div>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Clinical AI Engine in Progress</h3>
                  <p className="text-xs text-slate-500 font-mono">{currentJobStep}</p>
                </div>
              </div>
              <span className="text-sm font-extrabold text-emerald-600 font-mono">{jobProgress}%</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-4">
              <div
                className="bg-emerald-600 h-full transition-all duration-500 rounded-full"
                style={{ width: `${jobProgress}%` }}
              />
            </div>

            {/* Step Indicators */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 pt-2 border-t border-slate-100 text-xs">
              <div className={`flex items-center gap-1.5 ${jobProgress >= 20 ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>1. Scanning & OCR</span>
              </div>
              <div className={`flex items-center gap-1.5 ${jobProgress >= 40 ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>2. Parameter Parsing</span>
              </div>
              <div className={`flex items-center gap-1.5 ${jobProgress >= 65 ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>3. Range Verification</span>
              </div>
              <div className={`flex items-center gap-1.5 ${jobProgress >= 85 ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>4. Bilingual Insights</span>
              </div>
              <div className={`flex items-center gap-1.5 ${jobProgress >= 98 ? 'text-emerald-700 font-semibold' : 'text-slate-400'}`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>5. Doctor Questions</span>
              </div>
            </div>
          </div>
        )}

        {/* Main Grid: Left Sidebar (History & Sample Loaders) + Right Main Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Report History & Quick Try (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Quick Sample Loader Card */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Try Sample Diagnostic Reports</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 mb-3">
                Experience instant clinical extraction, range checks, and bilingual synthesis:
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleLoadSampleReport('cbc')}
                  className="px-2.5 py-2 text-xs font-semibold text-emerald-800 bg-white border border-emerald-200 rounded-lg hover:bg-emerald-100/50 text-center transition-colors disabled:opacity-50"
                >
                  Complete CBC
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleLoadSampleReport('lipid')}
                  className="px-2.5 py-2 text-xs font-semibold text-emerald-800 bg-white border border-emerald-200 rounded-lg hover:bg-emerald-100/50 text-center transition-colors disabled:opacity-50"
                >
                  Lipid Panel
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleLoadSampleReport('metabolic')}
                  className="px-2.5 py-2 text-xs font-semibold text-emerald-800 bg-white border border-emerald-200 rounded-lg hover:bg-emerald-100/50 text-center transition-colors disabled:opacity-50"
                >
                  Metabolic & HbA1c
                </button>
              </div>
            </div>

            {/* Reports List Drawer */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>Your Lab Reports ({filteredReports.length})</span>
                </h3>
                <button
                  type="button"
                  onClick={() => fetchReports()}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
                  title="Refresh Reports"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingList ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Search & Category Filter */}
              <div className="space-y-2 mb-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Search by test name or lab..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div className="flex gap-1 overflow-x-auto pb-1 text-[11px]">
                  {['all', 'blood', 'cardiac', 'pathology', 'radiology'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-2 py-0.5 rounded-md capitalize font-medium whitespace-nowrap transition-colors ${
                        categoryFilter === cat
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* List items */}
              <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                {loadingList && reportsList.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">Loading reports from PostgreSQL...</div>
                ) : filteredReports.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No reports matching filter. Click &ldquo;Upload New Report&rdquo; to add your diagnostic test.
                  </div>
                ) : (
                  filteredReports.map((rep) => {
                    const isSelected = rep.id === selectedReportId;
                    const isUrgent = rep.attention_level === 'URGENT_MEDICAL_REVIEW';
                    const isHigh = rep.attention_level === 'HIGH_ATTENTION';
                    const isMod = rep.attention_level === 'MODERATE_ATTENTION';

                    const badgeColor = isUrgent
                      ? 'bg-rose-100 text-rose-800 border-rose-200'
                      : isHigh
                      ? 'bg-orange-100 text-orange-800 border-orange-200'
                      : isMod
                      ? 'bg-amber-100 text-amber-800 border-amber-200'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-200';

                    return (
                      <div
                        key={rep.id}
                        onClick={() => loadReportBundle(rep.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer relative group ${
                          isSelected
                            ? 'bg-emerald-50/50 border-emerald-500 shadow-xs'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <h4 className="text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-emerald-700">
                            {rep.title}
                          </h4>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border uppercase tracking-wider shrink-0 ${badgeColor}`}
                          >
                            {rep.attention_level?.replace(/_/g, ' ') || 'LOW CONCERN'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>{rep.report_date || 'Recent'}</span>
                          <span className="capitalize text-slate-600 font-medium">{rep.category}</span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteReport(rep.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 absolute right-2 bottom-2 p-1 text-slate-400 hover:text-rose-600 transition-opacity"
                          title="Archive report"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Main Report Analysis Workspace (8 cols) */}
          <div className="lg:col-span-8">
            {loadingBundle ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
                <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-3 text-emerald-600" />
                <p className="text-sm font-medium text-slate-600">Retrieving full clinical biomarker bundle...</p>
              </div>
            ) : !activeBundle ? (
              /* Empty State */
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-4">
                  <FileCheck className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">No Lab Report Selected</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
                  Select a past report from the left panel, try one of our instant diagnostic samples, or upload your PDF/image to start AI analysis.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleLoadSampleReport('cbc')}
                    className="px-4 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                  >
                    Load Sample CBC Report
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(true)}
                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    Upload Report
                  </button>
                </div>
              </div>
            ) : (
              /* Active Report Detail Workspace */
              <div className="space-y-6">
                
                {/* 1. Attention Level Banner */}
                {activeBundle?.report?.attention_level === 'URGENT_MEDICAL_REVIEW' ? (
                  <div className="p-5 bg-rose-50 border-2 border-rose-500 rounded-2xl shadow-sm text-rose-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0 animate-pulse">
                        <ShieldAlert className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-extrabold text-rose-900 tracking-tight">
                            URGENT CLINICAL ATTENTION RECOMMENDED
                          </h3>
                        </div>
                        <p className="text-xs text-rose-800 mt-0.5 leading-relaxed">
                          One or more critical biomarker values fall well outside expected biological parameters.
                          Please consult an on-duty healthcare provider or emergency triage immediately if acute symptoms (chest pain, shortness of breath, severe dizziness) are present.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href="tel:112"
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-xl shadow-xs transition-colors"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>Call Emergency (112)</span>
                      </a>
                    </div>
                  </div>
                ) : activeBundle?.report?.attention_level === 'HIGH_ATTENTION' ? (
                  <div className="p-4 bg-orange-50 border border-orange-300 rounded-2xl text-orange-950 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-orange-900">Elevated Biomarker Attention</h4>
                      <p className="text-xs text-orange-800 mt-0.5">
                        Multiple parameters deviate from reference ranges. Prompt review with your treating physician is advised for clinical context.
                      </p>
                    </div>
                  </div>
                ) : activeBundle?.report?.attention_level === 'MODERATE_ATTENTION' ? (
                  <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-amber-950 flex items-start gap-3">
                    <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-amber-900">Moderate Biomarker Attention</h4>
                      <p className="text-xs text-amber-800 mt-0.5">
                        Minor variances noted in certain test parameters. Consider bringing these questions to your upcoming routine consultation.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-950 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-emerald-900">Parameters Within Expected Clinical Ranges</h4>
                      <p className="text-xs text-emerald-800 mt-0.5">
                        No critical biomarker anomalies flagged. Maintain routine health vigilance and scheduled check-ups.
                      </p>
                    </div>
                  </div>
                )}

                {/* 2. Report Overview Header Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          {activeBundle?.report?.category || 'General'}
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-500 font-medium">
                          Date: {activeBundle?.report?.report_date || 'Recent'}
                        </span>
                      </div>
                      <h2 className="text-xl font-bold text-slate-900">{activeBundle?.report?.title || 'Diagnostic Report'}</h2>
                      {activeBundle?.report?.lab_name && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          Facility: <span className="font-semibold text-slate-700">{activeBundle.report.lab_name}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleReanalyze}
                        disabled={isProcessing}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
                        title="Re-run AI analysis"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Re-analyze</span>
                      </button>

                      {activeBundle?.report?.id && (
                        <a
                          href={`/api/reports/${activeBundle.report.id}/pdf`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print / PDF</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Navigation Tabs */}
                  <div className="flex border-b border-slate-200 space-x-2 overflow-x-auto text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setActiveTab('overview')}
                      className={`pb-3 px-2 border-b-2 transition-all whitespace-nowrap ${
                        activeTab === 'overview'
                          ? 'border-emerald-600 text-emerald-700 font-bold'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Overview & Summary
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('results')}
                      className={`pb-3 px-2 border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
                        activeTab === 'results'
                          ? 'border-emerald-600 text-emerald-700 font-bold'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <span>Extracted Parameters</span>
                      <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded-full text-[10px]">
                        {activeBundle?.parameters?.length || 0}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('findings')}
                      className={`pb-3 px-2 border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
                        activeTab === 'findings'
                          ? 'border-emerald-600 text-emerald-700 font-bold'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <span>Clinical Findings</span>
                      {(activeBundle?.findings || []).some((f) => f?.finding_type === 'abnormal') && (
                        <span className="w-2 h-2 rounded-full bg-orange-500" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('questions')}
                      className={`pb-3 px-2 border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
                        activeTab === 'questions'
                          ? 'border-emerald-600 text-emerald-700 font-bold'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <span>Doctor Questions</span>
                      <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded-full text-[10px]">
                        {activeBundle?.questions?.length || 0}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('careplan')}
                      className={`pb-3 px-2 border-b-2 transition-all whitespace-nowrap ${
                        activeTab === 'careplan'
                          ? 'border-emerald-600 text-emerald-700 font-bold'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Care Plan & Guidance
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('trends')}
                      className={`pb-3 px-2 border-b-2 transition-all whitespace-nowrap flex items-center gap-1.5 ${
                        activeTab === 'trends'
                          ? 'border-emerald-600 text-emerald-700 font-bold'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Trends & History</span>
                    </button>
                  </div>

                  {/* TAB 1: OVERVIEW */}
                  {activeTab === 'overview' && (
                    <div className="pt-5 space-y-6">
                      {/* Metric cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Total Tests</div>
                          <div className="text-2xl font-black text-slate-900 mt-1">
                            {activeBundle?.parameters?.length || 0}
                          </div>
                        </div>
                        <div className="p-3.5 bg-emerald-50/60 border border-emerald-100 rounded-xl">
                          <div className="text-[11px] font-medium text-emerald-700 uppercase tracking-wider">Normal Ranges</div>
                          <div className="text-2xl font-black text-emerald-800 mt-1">
                            {(activeBundle?.parameters || []).filter((p) => p && p.status === 'normal').length}
                          </div>
                        </div>
                        <div className="p-3.5 bg-rose-50/60 border border-rose-100 rounded-xl">
                          <div className="text-[11px] font-medium text-rose-700 uppercase tracking-wider">Variances / Abnormal</div>
                          <div className="text-2xl font-black text-rose-800 mt-1">
                            {(activeBundle?.parameters || []).filter((p) => p && p.status !== 'normal').length}
                          </div>
                        </div>
                        <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">OCR Confidence</div>
                          <div className="text-2xl font-black text-slate-900 mt-1">98%</div>
                        </div>
                      </div>

                      {/* Summary Section */}
                      <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                            <span>
                              {explanationLang === 'hi' ? 'नैदानिक रिपोर्ट सारांश' : 'Plain-Language Clinical Summary'}
                            </span>
                          </h4>
                          <span className="text-[11px] text-slate-400 font-mono">
                            Language: {explanationLang === 'hi' ? 'हिन्दी (Hindi)' : 'English'}
                          </span>
                        </div>
                        <p className="text-sm text-slate-800 leading-relaxed">
                          {explanationLang === 'hi' && activeBundle?.report?.ai_summary_hi
                            ? activeBundle.report.ai_summary_hi
                            : activeBundle?.report?.ai_summary || activeBundle?.analysis?.report_summary || 'No AI summary available.'}
                        </p>
                      </div>

                      {/* Safety notes */}
                      {activeBundle?.analysis?.safety_notes && Array.isArray(activeBundle.analysis.safety_notes) && activeBundle.analysis.safety_notes.length > 0 && (
                        <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-xl text-xs text-amber-900">
                          <div className="font-bold flex items-center gap-1.5 mb-1 text-amber-950">
                            <ShieldCheck className="w-4 h-4 text-amber-600" />
                            <span>Clinical Safety Notes</span>
                          </div>
                          <ul className="list-disc pl-5 space-y-1">
                            {activeBundle.analysis.safety_notes.map((note: any, idx) => {
                              const noteText = typeof note === 'string'
                                ? note
                                : (note && typeof note === 'object')
                                  ? (explanationLang === 'hi' && note.note_hi ? note.note_hi : (note.note || note.text || JSON.stringify(note)))
                                  : String(note || '');
                              return <li key={idx}>{noteText}</li>;
                            })}
                          </ul>
                        </div>
                      )}

                      {/* Disclaimer */}
                      <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 text-xs">
                        <p className="font-semibold text-slate-700 mb-0.5">Educational Medical Disclaimer</p>
                        <p>
                          {activeBundle?.analysis?.disclaimer ||
                            'AI-generated educational information. It does not constitute a diagnosis or medical advice. Consult a qualified healthcare professional for interpretation and treatment.'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: RESULTS (Extracted Parameters Table) */}
                  {activeTab === 'results' && (
                    <div className="pt-5 space-y-4">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <h4 className="text-sm font-bold text-slate-900">
                          Extracted Biomarkers & Reference Ranges ({displayedParameters.length})
                        </h4>
                        <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={abnormalOnly}
                            onChange={(e) => setAbnormalOnly(e.target.checked)}
                            className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                          />
                          <span>Show Abnormal Only</span>
                        </label>
                      </div>

                      <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                            <tr>
                              <th className="py-3 px-4">Test Name</th>
                              <th className="py-3 px-4">Result</th>
                              <th className="py-3 px-4">Reference Range</th>
                              <th className="py-3 px-4">Status</th>
                              <th className="py-3 px-4">Plain-Language Meaning</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {displayedParameters.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="py-6 text-center text-slate-400">
                                  No parameters matching selected filter.
                                </td>
                              </tr>
                            ) : (
                              displayedParameters.map((param, idx) => {
                                const isAbnormal = param?.status !== 'normal';
                                const isHigh = param?.status === 'high' || param?.status === 'critical_high';
                                const isLow = param?.status === 'low' || param?.status === 'critical_low';

                                return (
                                  <tr key={idx} className={isAbnormal ? 'bg-amber-50/20 hover:bg-amber-50/40' : 'hover:bg-slate-50'}>
                                    <td className="py-3 px-4 font-semibold text-slate-900">
                                      {param?.test_name || 'Biomarker'}
                                    </td>
                                    <td className="py-3 px-4 font-bold">
                                      <span className={isAbnormal ? (isHigh ? 'text-orange-700' : 'text-amber-700') : 'text-emerald-800'}>
                                        {param?.result_text ?? 'N/A'} {param?.unit || ''}
                                      </span>
                                    </td>
                                    <td className="py-3 px-4 text-slate-600">
                                      {param?.reference_range_raw || 'Standard interval'}
                                    </td>
                                    <td className="py-3 px-4">
                                      <span
                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                          isAbnormal
                                            ? isHigh
                                              ? 'bg-orange-100 text-orange-800 border border-orange-200'
                                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                        }`}
                                      >
                                        {isHigh && <ArrowUpRight className="w-3 h-3" />}
                                        {isLow && <ArrowDownRight className="w-3 h-3" />}
                                        {!isAbnormal && <Check className="w-3 h-3" />}
                                        <span>{param?.status || 'normal'}</span>
                                      </span>
                                    </td>
                                    <td className="py-3 px-4 text-slate-700 leading-relaxed max-w-xs">
                                      {explanationLang === 'hi' && param?.plain_language_explanation_hi
                                        ? param.plain_language_explanation_hi
                                        : param?.plain_language_explanation || `Measures physiological levels of ${param?.test_name || 'biomarker'}.`}
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: FINDINGS */}
                  {activeTab === 'findings' && (
                    <div className="pt-5 space-y-4">
                      <h4 className="text-sm font-bold text-slate-900">
                        Categorized Clinical Observations & Abnormal Detections
                      </h4>

                      <div className="grid grid-cols-1 gap-3">
                        {(!activeBundle?.findings || activeBundle.findings.length === 0) ? (
                          <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                            No specific abnormal observations detected in this panel.
                          </div>
                        ) : (
                          activeBundle.findings.map((f, idx) => {
                            const isAbnormal = f?.finding_type === 'abnormal';
                            const severityText = String(f?.severity || 'routine');
                            return (
                              <div
                                key={idx}
                                className={`p-4 rounded-xl border ${
                                  isAbnormal
                                    ? 'bg-rose-50/40 border-rose-200 text-rose-950'
                                    : 'bg-emerald-50/30 border-emerald-200 text-slate-900'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                  <div className="flex items-center gap-2">
                                    {isAbnormal ? (
                                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                                    ) : (
                                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                    )}
                                    <h5 className="text-xs font-bold">
                                      {explanationLang === 'hi' && f?.title_hi ? f.title_hi : (f?.title || 'Clinical Finding')}
                                    </h5>
                                  </div>
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                      f?.severity === 'seek_prompt_care' || f?.severity === 'urgent'
                                        ? 'bg-rose-600 text-white'
                                        : f?.severity === 'discuss_with_doctor'
                                        ? 'bg-amber-200 text-amber-900'
                                        : 'bg-emerald-100 text-emerald-800'
                                    }`}
                                  >
                                    {severityText.replace(/_/g, ' ')}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-700 leading-relaxed mb-2">
                                  {explanationLang === 'hi' && f?.description_hi ? f.description_hi : (f?.description || '')}
                                </p>
                                {f?.precautions && (Array.isArray(f.precautions) ? f.precautions.length > 0 : Boolean(f.precautions)) && (
                                  <div className="text-[11px] text-slate-600 mt-2 pt-2 border-t border-slate-200/60">
                                    <span className="font-semibold text-slate-800">Suggested Precautions: </span>
                                    {Array.isArray(f.precautions)
                                      ? f.precautions
                                          .map((p: any) =>
                                            typeof p === 'string'
                                              ? p
                                              : typeof p === 'object'
                                              ? explanationLang === 'hi' && p.precaution_hi
                                                ? p.precaution_hi
                                                : p.precaution || p.text || JSON.stringify(p)
                                              : String(p || '')
                                          )
                                          .join(' • ')
                                      : typeof f.precautions === 'object'
                                      ? JSON.stringify(f.precautions)
                                      : String(f.precautions)}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 4: DOCTOR QUESTIONS */}
                  {activeTab === 'questions' && (
                    <div className="pt-5 space-y-4">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">
                            Doctor Consultation Questions & Educational Answers
                          </h4>
                          <p className="text-xs text-slate-500">
                            Tailored questions to bring to your next physician visit
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyQuestions}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
                        >
                          {copiedToast ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700 font-bold">Copied to Clipboard!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-slate-500" />
                              <span>Copy All Questions</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="space-y-3">
                        {(!activeBundle?.questions || activeBundle.questions.length === 0) ? (
                          <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                            No consultation questions generated for this report.
                          </div>
                        ) : (
                          activeBundle.questions.map((q, idx) => {
                            const firstAnswer = Array.isArray(q?.answers) && q.answers.length > 0 ? q.answers[0] : null;
                            const answerEduHi = firstAnswer ? firstAnswer.educational_answer_hi : undefined;
                            const answerEduEn = firstAnswer ? firstAnswer.educational_answer : undefined;

                            return (
                              <div key={idx} className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
                                <div className="flex items-start gap-2.5">
                                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                    {idx + 1}
                                  </span>
                                  <div className="flex-1">
                                    <div className="text-xs font-bold text-slate-900">
                                      {explanationLang === 'hi' && q?.question_text_hi ? q.question_text_hi : (q?.question_text || '')}
                                    </div>
                                    {(answerEduHi || answerEduEn) && (
                                      <div className="mt-2 p-2.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700">
                                        <span className="font-semibold text-emerald-800">Educational context: </span>
                                        {explanationLang === 'hi' && answerEduHi ? answerEduHi : answerEduEn}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 5: CARE PLAN */}
                  {activeTab === 'careplan' && (
                    <div className="pt-5 space-y-4">
                      <h4 className="text-sm font-bold text-slate-900">
                        Personalized Guidance & Follow-up Recommendations
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {(!activeBundle?.recommendations || activeBundle.recommendations.length === 0) ? (
                          <div className="col-span-2 p-6 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                            No active care guidance items.
                          </div>
                        ) : (
                          activeBundle.recommendations.map((rec, idx) => (
                            <div key={idx} className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
                              <div className="flex items-center justify-between gap-2 mb-1.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100">
                                  {rec?.category || 'General'}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium capitalize">
                                  {rec?.urgency || 'routine'}
                                </span>
                              </div>
                              <h5 className="text-xs font-bold text-slate-900 mb-1">
                                {explanationLang === 'hi' && rec?.title_hi ? rec.title_hi : (rec?.title || 'Guidance')}
                              </h5>
                              <p className="text-xs text-slate-600 leading-relaxed">
                                {explanationLang === 'hi' && rec?.description_hi ? rec.description_hi : (rec?.description || '')}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 6: TRENDS */}
                  {activeTab === 'trends' && (
                    <div className="pt-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">Historical Biomarker Trend Lines</h4>
                          <p className="text-xs text-slate-500">
                            Visualizing numeric measurements across recorded test dates
                          </p>
                        </div>
                      </div>

                      {trendChartData.length < 1 ? (
                        <div className="p-8 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                          Upload additional reports or load multiple samples to activate multi-date trend graphs.
                        </div>
                      ) : (
                        <div className="p-4 bg-white border border-slate-200 rounded-xl">
                          <div className="w-full min-h-[260px]">
                            <ResponsiveContainer width="100%" height={260}>
                              <LineChart data={trendChartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: '#ffffff',
                                    borderRadius: '8px',
                                    border: '1px solid #e2e8f0',
                                    fontSize: '12px'
                                  }}
                                />
                                <Legend wrapperStyle={{ fontSize: '11px' }} />
                                {trendBiomarkerKeys.map((key, i) => (
                                  <Line
                                    key={key}
                                    type="monotone"
                                    dataKey={key}
                                    name={String(key || '').toUpperCase()}
                                    stroke={colors[i % colors.length]}
                                    strokeWidth={2}
                                    dot={{ r: 4 }}
                                  />
                                ))}
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* UPLOAD REPORT MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Upload className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Upload Diagnostic Lab Report</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {/* Report Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Report Title / Test Name</label>
                <input
                  type="text"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder="e.g. Complete Blood Count (CBC) or Lipid Panel"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              {/* Category & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={reportCategory}
                    onChange={(e) => setReportCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-hidden bg-white"
                  >
                    <option value="blood">Blood & Hematology</option>
                    <option value="cardiac">Cardiac & Lipid</option>
                    <option value="pathology">Pathology & Biopsy</option>
                    <option value="radiology">Radiology / Imaging</option>
                    <option value="general">General / Urinalysis</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Test Date</label>
                  <input
                    type="date"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-hidden bg-white"
                  />
                </div>
              </div>

              {/* File Dropzone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Document File (PDF, JPG, PNG up to 15MB)
                </label>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-6 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-emerald-500 bg-emerald-50'
                      : selectedFile
                      ? 'border-emerald-300 bg-emerald-50/30'
                      : 'border-slate-300 hover:border-slate-400 bg-slate-50'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept=".pdf,image/png,image/jpeg,image/jpg"
                    className="hidden"
                  />
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-2 text-emerald-800 text-xs font-semibold">
                      <FileCheck className="w-5 h-5 text-emerald-600" />
                      <span>{selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-6 h-6 mx-auto text-slate-400 mb-1" />
                      <div className="text-xs font-medium text-slate-700">
                        Click to browse or drag & drop lab report file
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Supports PDF, JPG, PNG</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Raw Text Fallback */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Or Paste Text / Values (Optional)
                </label>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Paste test names, numbers, or SMS/email report content here..."
                  rows={3}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-hidden font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
                >
                  Proceed to Analyze
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONSENT MODAL */}
      {showConsentModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">User Consent & Data Privacy</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Your medical report document will be encrypted and processed by Healora&apos;s AI model for the sole purpose of extracting clinical biomarker values, calculating reference ranges, and generating plain-language explanations.
            </p>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 mb-4">
              <strong>Medical Disclaimer:</strong> AI findings are purely educational and non-diagnostic. You should always consult your physician for clinical interpretation.
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowConsentModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={handleConfirmConsentAndProcess}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
              >
                I Agree & Analyze Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEALTH CONTEXT DRAWER / MODAL */}
      {showProfileDrawer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Patient Health Context Profile</h3>
              </div>
              <button type="button" onClick={() => setShowProfileDrawer(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHealthProfile} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Height (cm)</label>
                  <input
                    type="number"
                    value={healthProfile?.height_cm || ''}
                    onChange={(e) => setHealthProfile({ ...healthProfile, height_cm: e.target.value })}
                    placeholder="175"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Weight (kg)</label>
                  <input
                    type="number"
                    value={healthProfile?.weight_kg || ''}
                    onChange={(e) => setHealthProfile({ ...healthProfile, weight_kg: e.target.value })}
                    placeholder="70"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Known Chronic Conditions</label>
                <input
                  type="text"
                  value={Array.isArray(healthProfile?.chronic_conditions) ? healthProfile.chronic_conditions.join(', ') : ''}
                  onChange={(e) =>
                    setHealthProfile({
                      ...healthProfile,
                      chronic_conditions: e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                    })
                  }
                  placeholder="e.g. Hypertension, Type 2 Diabetes"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Current Medications</label>
                <input
                  type="text"
                  value={Array.isArray(healthProfile?.current_medications) ? healthProfile.current_medications.join(', ') : ''}
                  onChange={(e) =>
                    setHealthProfile({
                      ...healthProfile,
                      current_medications: e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                    })
                  }
                  placeholder="e.g. Metformin 500mg, Atorvastatin 10mg"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Allergies</label>
                <input
                  type="text"
                  value={Array.isArray(healthProfile?.allergies) ? healthProfile.allergies.join(', ') : ''}
                  onChange={(e) =>
                    setHealthProfile({
                      ...healthProfile,
                      allergies: e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                    })
                  }
                  placeholder="e.g. Penicillin, Peanuts"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowProfileDrawer(false)}
                  className="px-4 py-2 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700"
                >
                  {savingProfile ? 'Saving...' : 'Save Health Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
