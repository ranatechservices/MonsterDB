import React from 'react';
import { Activity, ShieldCheck, Heart, Zap, Award, Sparkles, TrendingUp, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HealthTwinProps {
  onNavigate?: (tab: string) => void;
}

export default function HealthTwin({ onNavigate }: HealthTwinProps) {
  const { user } = useAuth();

  const metrics = [
    { label: 'Cardiovascular Vitality', score: 94, status: 'Optimal', icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-950/40' },
    { label: 'Metabolic & Glycemic Balance', score: 89, status: 'Stable', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/40' },
    { label: 'Sleep & Circadian Rhythm', score: 86, status: 'Good', icon: Activity, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-950/40' },
    { label: 'Medication Adherence Integrity', score: 98, status: 'Exceptional', icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/40' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
          <Sparkles className="w-7 h-7 text-emerald-500" />
          AI Health Twin & Biometric Simulation
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          A dynamic digital health replica synthesizing continuous biometrics, laboratory reports & lifestyle data
        </p>
      </div>

      {/* Main Twin Overview Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 rounded-3xl p-8 text-white shadow-xl flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              DIGITAL TWIN STATUS: VIGOROUS
            </div>

            <div className="text-center my-6">
              <div className="relative inline-block">
                <div className="w-36 h-36 rounded-full border-4 border-emerald-400/40 flex items-center justify-center">
                  <div className="w-28 h-28 rounded-full bg-white/10 backdrop-blur-md flex flex-col items-center justify-center shadow-inner">
                    <span className="text-3xl font-black">92</span>
                    <span className="text-[11px] uppercase tracking-wider text-emerald-200">Health Score</span>
                  </div>
                </div>
              </div>
            </div>

            <h3 className="text-lg font-bold text-center">{user?.name || 'Patient'}</h3>
            <p className="text-xs text-emerald-100 text-center mt-1">Simulated Biological Age: 29.4 Years</p>
          </div>

          <div className="mt-8 pt-6 border-t border-white/20 text-xs text-emerald-100 space-y-2">
            <div className="flex justify-between">
              <span>Overall 10-Yr Cardiovascular Risk:</span>
              <strong className="text-white">&lt; 2.4% (Low)</strong>
            </div>
            <div className="flex justify-between">
              <span>Predicted Glycemic Stability:</span>
              <strong className="text-white">Optimal (94%)</strong>
            </div>
          </div>
        </div>

        {/* Breakdown of Sub-Systems */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {metrics.map((m, i) => {
              const Icon = m.icon;
              return (
                <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-10 h-10 rounded-2xl ${m.bg} ${m.color} flex items-center justify-center`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xl font-black text-slate-900 dark:text-white">{m.score}%</span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{m.label}</h4>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">{m.status}</p>

                  <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full mt-4 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${m.score}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* AI Simulation Projections */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                Projected Lifestyle Adjustments & Longevity Impact
              </h3>
              {onNavigate && (
                <button
                  onClick={() => onNavigate('copilot')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-xl transition cursor-pointer border border-emerald-200 dark:border-emerald-900/60 shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Open AI Copilot Forecast</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-start gap-3">
                <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded font-bold">PROJECTION</span>
                <p>
                  Maintaining 100% adherence to your Metformin and morning walks projects a further <strong>12% reduction</strong> in glycemic variability over the next 90 days.
                </p>
              </div>
              <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-start gap-3">
                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded font-bold">HYDRATION</span>
                <p>
                  Increasing daily water intake to 2.8L is estimated to improve resting systolic blood pressure by 2–4 mmHg.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
