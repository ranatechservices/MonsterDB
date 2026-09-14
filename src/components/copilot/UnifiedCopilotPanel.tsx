import React, { useState } from 'react';
import {
  Sparkles,
  TrendingUp,
  FileText,
  Sliders,
  Users,
  ShieldCheck,
  Zap,
  Lock,
  CheckCircle2,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { useLanguage } from '../../localization/language_context';
import { useHealthCopilot } from '../../hooks/useHealthCopilot';
import TrajectoryPrediction from './TrajectoryPrediction';
import DoctorVisitBrief from './DoctorVisitBrief';
import WhatIfSimulator from './WhatIfSimulator';
import FamilyDigest from './FamilyDigest';

interface UnifiedCopilotPanelProps {
  onNavigate?: (tab: string) => void;
}

export default function UnifiedCopilotPanel({ onNavigate }: UnifiedCopilotPanelProps) {
  const { t } = useLanguage();
  const { isPro, togglePro, loading, refresh } = useHealthCopilot();
  const [activeSubTab, setActiveSubTab] = useState<'trajectory' | 'doctorBrief' | 'whatIf' | 'familyDigest'>('trajectory');

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Top Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 backdrop-blur-md text-white border border-white/30 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-300" />
                {t.copilot.proBadge}
              </span>
              <span className="text-xs text-emerald-100 font-medium">
                Personal Baseline Extrapolation Engine
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {t.copilot.title}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-50 leading-relaxed font-normal">
              {t.copilot.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              id="copilot-refresh-btn"
              onClick={() => refresh()}
              disabled={loading}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition cursor-pointer disabled:opacity-50"
              title="Refresh Baseline Analytics"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Pro Status Toggle for demonstration / upgrade */}
            <button
              id="toggle-pro-tier-btn"
              onClick={togglePro}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-sm ${
                isPro
                  ? 'bg-white text-emerald-800 hover:bg-emerald-50'
                  : 'bg-amber-400 text-amber-950 hover:bg-amber-300'
              }`}
            >
              {isPro ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Pro Enabled</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-amber-900" />
                  <span>Upgrade to Pro</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-xs">
        <button
          id="copilot-tab-trajectory"
          onClick={() => setActiveSubTab('trajectory')}
          className={`flex-1 min-w-[150px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'trajectory'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>{t.copilot.tabs.trajectory}</span>
        </button>

        <button
          id="copilot-tab-doctor-brief"
          onClick={() => setActiveSubTab('doctorBrief')}
          className={`flex-1 min-w-[150px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'doctorBrief'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>{t.copilot.tabs.doctorBrief}</span>
        </button>

        <button
          id="copilot-tab-what-if"
          onClick={() => setActiveSubTab('whatIf')}
          className={`flex-1 min-w-[150px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'whatIf'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>{t.copilot.tabs.whatIf}</span>
        </button>

        <button
          id="copilot-tab-family-digest"
          onClick={() => setActiveSubTab('familyDigest')}
          className={`flex-1 min-w-[150px] flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'familyDigest'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{t.copilot.tabs.familyDigest}</span>
        </button>
      </div>

      {/* Paywall Overlay if user is not Pro */}
      {!isPro ? (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-8 sm:p-12 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <div className="max-w-lg mx-auto space-y-2">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              {t.copilot.paywall.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {t.copilot.paywall.description}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto text-left">
            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-700 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-600 font-bold mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>30-Day Trajectory</span>
              </div>
              <p className="text-slate-500 text-[11px]">
                Mathematical forecasting of systolic & diastolic trends before stage crossings.
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-700 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-600 font-bold mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>One-Tap Doctor Brief</span>
              </div>
              <p className="text-slate-500 text-[11px]">
                Pre-appointment clinical synthesis and AI-suggested questions for physicians.
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-700 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-600 font-bold mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Cross-Correlations</span>
              </div>
              <p className="text-slate-500 text-[11px]">
                Discover patterns between sleep hours, water intake, and morning blood glucose.
              </p>
            </div>
          </div>

          <button
            id="unlock-copilot-btn"
            onClick={togglePro}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-2xl shadow-lg transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{t.copilot.paywall.unlockBtn}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* Active Module Component */
        <div className="transition-all duration-200">
          {activeSubTab === 'trajectory' && <TrajectoryPrediction onNavigate={onNavigate} />}
          {activeSubTab === 'doctorBrief' && <DoctorVisitBrief onNavigate={onNavigate} />}
          {activeSubTab === 'whatIf' && <WhatIfSimulator onNavigate={onNavigate} />}
          {activeSubTab === 'familyDigest' && <FamilyDigest onNavigate={onNavigate} />}
        </div>
      )}
    </div>
  );
}
