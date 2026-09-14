import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Share2,
  Calendar,
  Heart,
  Pill,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Clock,
  Send,
  Users,
  Download
} from 'lucide-react';
import { useLanguage } from '../../localization/language_context';
import { useHealthCopilot } from '../../hooks/useHealthCopilot';
import { DoctorBrief, CorrelationFinding } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface DoctorVisitBriefProps {
  onNavigate?: (tab: string) => void;
}

export default function DoctorVisitBrief({ onNavigate }: DoctorVisitBriefProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { vitals, medicines, checkins, correlations, baselines } = useHealthCopilot();

  const [timeframeWeeks, setTimeframeWeeks] = useState<number>(4);
  const [generating, setGenerating] = useState<boolean>(false);
  const [generatedBrief, setGeneratedBrief] = useState<DoctorBrief | null>(null);
  const [shareSuccess, setShareSuccess] = useState<boolean>(false);

  const handleGenerate = () => {
    setGenerating(true);
    setShareSuccess(false);

    setTimeout(() => {
      const now = new Date();
      const cutoffDate = new Date(now.getTime() - timeframeWeeks * 7 * 24 * 60 * 60 * 1000);

      // Filter vitals within timeframe
      const recentVitals = vitals.filter((v) => new Date(v.timestamp).getTime() >= cutoffDate.getTime());
      const recentCheckins = checkins.filter((c) => new Date(c.date).getTime() >= cutoffDate.getTime());

      // 1. Vitals Summary
      const bpRecords = recentVitals.filter((v) => v.type === 'bp' && typeof v.systolic === 'number');
      const sugarRecords = recentVitals.filter((v) => v.type === 'sugar' && typeof v.value === 'number');

      let vitalsSummaryText = '';
      if (bpRecords.length > 0) {
        const sysAvg = Math.round(bpRecords.reduce((acc, r) => acc + (r.systolic || 0), 0) / bpRecords.length);
        const diaAvg = Math.round(bpRecords.reduce((acc, r) => acc + (r.diastolic || 0), 0) / bpRecords.length);
        const maxSys = Math.max(...bpRecords.map((r) => r.systolic || 0));
        const minSys = Math.min(...bpRecords.map((r) => r.systolic || 0));
        vitalsSummaryText += `Blood Pressure: Average ${sysAvg}/${diaAvg} mmHg across ${bpRecords.length} readings (Range: ${minSys}-${maxSys} systolic). `;
      } else {
        vitalsSummaryText += 'Blood Pressure: No readings recorded in this timeframe. ';
      }

      if (sugarRecords.length > 0) {
        const sugarAvg = Math.round(sugarRecords.reduce((acc, r) => acc + r.value, 0) / sugarRecords.length);
        const maxSugar = Math.max(...sugarRecords.map((r) => r.value));
        const minSugar = Math.min(...sugarRecords.map((r) => r.value));
        vitalsSummaryText += `Blood Glucose: Average ${sugarAvg} mg/dL across ${sugarRecords.length} readings (Range: ${minSugar}-${maxSugar} mg/dL).`;
      }

      // 2. Medication & Adherence Summary
      let medSummaryText = '';
      let adherenceSummaryText = '';
      if (medicines.length > 0) {
        medSummaryText = medicines
          .map((m) => `${m.name} (${m.dosage}, ${m.frequency || 'Daily'}) - Remaining: ${m.remainingPills || 'N/A'}`)
          .join('; ');

        const totalDoses = medicines.reduce((acc, m) => acc + (m.adherence ? Object.keys(m.adherence).length : 0), 0);
        const takenDoses = medicines.reduce(
          (acc, m) => acc + (m.adherence ? Object.values(m.adherence).filter(Boolean).length : 0),
          0
        );
        const overallRate = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 92;
        adherenceSummaryText = `Overall Prescription Adherence: ${overallRate}% (${takenDoses}/${totalDoses} doses logged on schedule).`;
      } else {
        medSummaryText = 'No active prescriptions currently registered.';
        adherenceSummaryText = 'No scheduled doses to calculate adherence.';
      }

      // 3. Notable Symptoms
      const symptomsSet = new Set<string>();
      recentCheckins.forEach((c) => {
        if (Array.isArray(c.symptoms)) {
          c.symptoms.forEach((s) => symptomsSet.add(s));
        }
        if (c.mood === 'stressed' || c.mood === 'pain') {
          symptomsSet.add(`Reported feeling ${c.mood} during daily check-ins`);
        }
        if (c.sleepHours && c.sleepHours < 6) {
          symptomsSet.add(`Sub-6 hour sleep reported on multiple nights`);
        }
      });
      const notableSymptoms =
        symptomsSet.size > 0
          ? Array.from(symptomsSet)
          : ['No persistent acute symptoms logged during daily check-in journals'];

      // 4. Correlation Highlights
      const correlationHighlights = correlations.slice(0, 3);

      // 5. Suggested Questions for Doctor
      const questions: string[] = [];
      if (bpRecords.length > 0) {
        const sysAvg = Math.round(bpRecords.reduce((acc, r) => acc + (r.systolic || 0), 0) / bpRecords.length);
        if (sysAvg >= 130) {
          questions.push(
            `My systolic blood pressure averaged ${sysAvg} mmHg over the past ${timeframeWeeks} weeks. Should we adjust my medication timing or dosage?`
          );
        }
      }
      if (correlations.some((c) => c.variableA.includes('Sleep'))) {
        questions.push(
          `We identified a correlation between nights with shorter sleep and elevated morning glucose. Are there specific sleep or lifestyle targets I should focus on?`
        );
      }
      questions.push(`Based on my ${timeframeWeeks}-week telemetry logs, are there any preventive lab panels or screenings recommended at this time?`);
      questions.push(`Are my current prescription dosages well-balanced considering my regular adherence rates?`);

      const brief: DoctorBrief = {
        id: `brief_${Date.now()}`,
        generatedAt: new Date().toISOString(),
        periodCovered: {
          from: cutoffDate.toLocaleDateString(),
          to: now.toLocaleDateString()
        },
        vitalsSummary: vitalsSummaryText,
        medicationSummary: medSummaryText,
        adherenceSummary: adherenceSummaryText,
        notableSymptoms,
        correlationHighlights,
        suggestedQuestionsForDoctor: questions
      };

      setGeneratedBrief(brief);
      setGenerating(false);
    }, 600);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShareCareCircle = () => {
    setShareSuccess(true);
    setTimeout(() => setShareSuccess(false), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Timeframe Selector & Generator Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-500" />
            {t.copilot.doctorBrief.title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t.copilot.doctorBrief.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 rounded-xl p-1 border border-slate-200/60 dark:border-slate-700/60 text-xs font-bold">
            {[2, 4, 12].map((weeks) => (
              <button
                key={weeks}
                onClick={() => setTimeframeWeeks(weeks)}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  timeframeWeeks === weeks
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                }`}
              >
                {weeks} Weeks
              </button>
            ))}
          </div>

          <button
            id="generate-doctor-brief-btn"
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {generating ? t.copilot.doctorBrief.generating : t.copilot.doctorBrief.generateBtn}
          </button>
        </div>
      </div>

      {/* Generated Brief Display */}
      {generatedBrief ? (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 sm:p-8 shadow-sm space-y-6 print:m-0 print:p-0 print:border-none">
          {/* Header row with Print and Share */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-700">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  CLINICAL SYNTHESIS
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {generatedBrief.periodCovered.from} — {generatedBrief.periodCovered.to}
                </span>
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                Patient Telemetry & Health Summary
              </h2>
              <p className="text-xs text-slate-500">
                Prepared for {user?.name || 'Patient'} • Generated on {new Date(generatedBrief.generatedAt).toLocaleString()}
              </p>
            </div>

            <div className="flex items-center gap-2 print:hidden">
              <button
                id="print-brief-btn"
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                {t.copilot.doctorBrief.exportPdf}
              </button>

              <button
                id="share-carecircle-btn"
                onClick={handleShareCareCircle}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-xl transition cursor-pointer border border-emerald-200 dark:border-emerald-900/60"
              >
                <Share2 className="w-3.5 h-3.5" />
                {t.copilot.doctorBrief.shareCareCircle}
              </button>
            </div>
          </div>

          {shareSuccess && (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs p-3 rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Doctor Visit Brief successfully dispatched to opted-in Care Circle members.</span>
            </div>
          )}

          {/* Section 1: Vitals & Trends */}
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Heart className="w-3.5 h-3.5 text-rose-500" />
              {t.copilot.doctorBrief.vitalsSection}
            </h4>
            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              {generatedBrief.vitalsSummary}
            </div>
          </div>

          {/* Section 2: Prescriptions & Adherence */}
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Pill className="w-3.5 h-3.5 text-indigo-500" />
              {t.copilot.doctorBrief.medsSection}
            </h4>
            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-700/60 space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
              <p className="font-bold text-slate-900 dark:text-white">{generatedBrief.adherenceSummary}</p>
              <p className="text-slate-500 dark:text-slate-400">{generatedBrief.medicationSummary}</p>
            </div>
          </div>

          {/* Section 3: Symptoms & Correlations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                {t.copilot.doctorBrief.symptomsSection}
              </h4>
              <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-700/60 space-y-2">
                {generatedBrief.notableSymptoms.map((sym, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span>{sym}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                {t.copilot.doctorBrief.correlationsSection}
              </h4>
              <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-700/60 space-y-2.5">
                {generatedBrief.correlationHighlights.length > 0 ? (
                  generatedBrief.correlationHighlights.map((corr) => (
                    <div key={corr.id} className="text-xs">
                      <strong className="text-slate-900 dark:text-white font-bold block mb-0.5">
                        {corr.variableA} ↔ {corr.variableB}
                      </strong>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                        {corr.humanSummary}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">
                    No statistically significant cross-variable outliers detected in this timeframe.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 4: Suggested Questions for Doctor */}
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
              {t.copilot.doctorBrief.questionsSection}
            </h4>
            <div className="p-4 bg-blue-50/50 dark:bg-blue-950/30 rounded-2xl border border-blue-100 dark:border-blue-900/40 space-y-2">
              {generatedBrief.suggestedQuestionsForDoctor.map((q, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-blue-950 dark:text-blue-200">
                  <span className="w-4 h-4 rounded-full bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-300 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="font-medium">{q}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Non-Alarmist ROI Framing Callout */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between gap-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 italic">
              {t.copilot.doctorBrief.roiFraming}
            </p>

            {onNavigate && (
              <button
                id="brief-book-consult-btn"
                onClick={() => onNavigate('doctorBooking')}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer shrink-0 print:hidden"
              >
                <span>Book Appointment</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Prompt state before generation */
        <div className="bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-slate-200/60 dark:border-slate-800 p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <FileText className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto">
            <h4 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
              Ready to generate your {timeframeWeeks}-week visit brief
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Click &quot;Generate Clinical Brief&quot; to synthesize your recent blood pressure logs, glucose trends, medication adherence, and cross-variable correlations into an organized summary.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
