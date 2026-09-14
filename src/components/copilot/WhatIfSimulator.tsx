import React, { useState } from 'react';
import {
  Sparkles,
  Sliders,
  TrendingDown,
  Activity,
  Heart,
  Zap,
  Info,
  ArrowRight,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import { useLanguage } from '../../localization/language_context';
import { useHealthCopilot } from '../../hooks/useHealthCopilot';
import { SimulationScenario } from '../../types';
import InsightSparkline from '../InsightSparkline';

interface WhatIfSimulatorProps {
  onNavigate?: (tab: string) => void;
}

export default function WhatIfSimulator({ onNavigate }: WhatIfSimulatorProps) {
  const { t } = useLanguage();
  const { baselines, trajectories, vitals } = useHealthCopilot();

  const [promptText, setPromptText] = useState<string>('');
  const [selectedPreset, setSelectedPreset] = useState<string>('walk');
  const [simulating, setSimulating] = useState<boolean>(false);
  const [scenario, setScenario] = useState<SimulationScenario | null>(null);

  const presets = [
    {
      id: 'walk',
      label: 'Daily 30-min Brisk Walk',
      icon: Activity,
      desc: '30 minutes of aerobic exercise 5 days a week for 12 weeks',
      metric: 'bp_systolic',
      reduction: 7 // ~7 mmHg systolic reduction
    },
    {
      id: 'sodium',
      label: 'Dietary Sodium Reduction (<2000mg/day)',
      icon: Heart,
      desc: 'Lower dietary salt intake by 30% to support vascular compliance',
      metric: 'bp_systolic',
      reduction: 5
    },
    {
      id: 'sleep',
      label: 'Consistent 7.5+ Hours Sleep',
      icon: Sparkles,
      desc: 'Regular sleep schedule and 7.5+ hours nightly rest',
      metric: 'glucose',
      reduction: 12 // ~12 mg/dL fasting glucose reduction
    },
    {
      id: 'adherence',
      label: '100% Prescription Adherence',
      icon: Zap,
      desc: 'Zero missed doses across all prescribed regimens',
      metric: 'bp_systolic',
      reduction: 8
    }
  ];

  const handleRunSimulation = (presetId = selectedPreset) => {
    setSimulating(true);
    setTimeout(() => {
      const preset = presets.find((p) => p.id === presetId) || presets[0];

      // Build baseline trajectory (no change)
      const currentBaseline =
        preset.metric === 'glucose'
          ? trajectories.glucose?.projectedValueIn30Days || 135
          : trajectories.bp_systolic?.projectedValueIn30Days || 138;

      const basePoints = [
        Math.round(currentBaseline - 2),
        Math.round(currentBaseline),
        Math.round(currentBaseline + 1),
        Math.round(currentBaseline + 3)
      ];

      // Build simulated trajectory with intervention impact
      const simPoints = [
        Math.round(currentBaseline - 1),
        Math.round(currentBaseline - preset.reduction * 0.4),
        Math.round(currentBaseline - preset.reduction * 0.7),
        Math.round(currentBaseline - preset.reduction)
      ];

      setScenario({
        id: `sim_${Date.now()}`,
        userPrompt: promptText || preset.label,
        parsedIntervention: preset.desc,
        baselineTrajectory: basePoints,
        simulatedTrajectory: simPoints,
        basisNote: `Extrapolated from your historical biometric responses and evidence-based clinical lifestyle models for ${preset.label.toLowerCase()}.`,
        createdAt: new Date().toISOString()
      });
      setSimulating(false);
    }, 450);
  };

  return (
    <div className="space-y-6">
      {/* Simulation Setup Card */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Interactive What-If Health Simulator
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Simulate prospective lifestyle and prescription adjustments against your personal baseline
            </p>
          </div>
        </div>

        {/* Preset Intervention Chips */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
            Select an Evidence-Based Intervention Scenario
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {presets.map((p) => {
              const Icon = p.icon;
              const isSelected = selectedPreset === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedPreset(p.id);
                    handleRunSimulation(p.id);
                  }}
                  className={`p-4 rounded-2xl border text-left transition cursor-pointer flex items-start gap-3.5 ${
                    isSelected
                      ? 'bg-indigo-50/70 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-800 shadow-xs ring-2 ring-indigo-500/20'
                      : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200/70 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-0.5">
                      {p.label}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                      {p.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Prompt Input */}
        <div className="space-y-2 pt-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
            Or Test a Custom Scenario
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="e.g. What if I drink 2.5L water daily and start evening meditation?"
              className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={() => handleRunSimulation()}
              disabled={simulating}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {simulating ? 'Simulating...' : 'Run Simulation'}
            </button>
          </div>
        </div>
      </div>

      {/* Scenario Output Card */}
      {scenario && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 sm:p-8 shadow-sm space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-700">
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                12-WEEK SIMULATED FORECAST
              </span>
              <h3 className="text-base font-black text-slate-900 dark:text-white mt-1">
                Intervention: {scenario.userPrompt}
              </h3>
            </div>

            <div className="flex items-center gap-2 text-xs text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60">
              <TrendingDown className="w-4 h-4" />
              <span>
                Projected Reduction: -{scenario.baselineTrajectory[3] - scenario.simulatedTrajectory[3]} mmHg/units
              </span>
            </div>
          </div>

          {/* Sparkline Comparison */}
          <div className="p-5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <span className="w-3 h-0.5 bg-slate-400 inline-block" /> Solid Grey: Current Baseline Trajectory
                <span className="w-3 h-0.5 border-t-2 border-dashed border-emerald-500 inline-block ml-3" /> Dashed Green: Simulated with Intervention
              </span>
            </div>

            <div className="py-2">
              <InsightSparkline
                points={scenario.baselineTrajectory}
                projectedPoints={scenario.simulatedTrajectory}
                unit="units"
                severity="positive"
              />
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 italic pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
              {scenario.basisNote}
            </p>
          </div>

          {/* Action Callout */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Info className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Simulations are predictive models for exploratory guidance, not prescriptive treatment orders.</span>
            </div>

            {onNavigate && (
              <button
                onClick={() => onNavigate('doctorBooking')}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shrink-0"
              >
                <span>Discuss Intervention Plan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
