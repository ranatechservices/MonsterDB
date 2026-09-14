import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Heart,
  Zap,
  Activity,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Info,
  Calendar,
  Clock
} from 'lucide-react';
import { useLanguage } from '../../localization/language_context';
import { useHealthCopilot } from '../../hooks/useHealthCopilot';
import InsightSparkline from '../InsightSparkline';

interface TrajectoryPredictionProps {
  onNavigate?: (tab: string) => void;
}

export default function TrajectoryPrediction({ onNavigate }: TrajectoryPredictionProps) {
  const { t } = useLanguage();
  const { baselines, trajectories, vitals, loading } = useHealthCopilot();
  const [selectedMetric, setSelectedMetric] = useState<'bp_systolic' | 'bp_diastolic' | 'glucose'>('bp_systolic');

  const currentTrajectory = trajectories[selectedMetric];
  const currentBaseline = baselines.find((b) => b.metric === selectedMetric);

  // Extract historical points for chart
  const historicalRecords = vitals
    .filter((v) => {
      if (selectedMetric === 'bp_systolic') return v.type === 'bp' && typeof v.systolic === 'number' && v.systolic > 0;
      if (selectedMetric === 'bp_diastolic') return v.type === 'bp' && typeof v.diastolic === 'number' && v.diastolic > 0;
      if (selectedMetric === 'glucose') return v.type === 'sugar' && typeof v.value === 'number' && v.value > 0;
      return false;
    })
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const historicalPoints = historicalRecords.map((r) => {
    if (selectedMetric === 'bp_systolic') return r.systolic!;
    if (selectedMetric === 'bp_diastolic') return r.diastolic!;
    return r.value;
  });

  // Secondary points (diastolic for systolic BP)
  let secondaryPoints: number[] | undefined;
  let projectedSecondaryPoints: number[] | undefined;

  if (selectedMetric === 'bp_systolic') {
    secondaryPoints = historicalRecords.map((r) => r.diastolic || 80);
    const diaTraj = trajectories.bp_diastolic;
    if (diaTraj && secondaryPoints.length > 0) {
      const lastDia = secondaryPoints[secondaryPoints.length - 1];
      const targetDia = diaTraj.projectedValueIn30Days;
      const step = (targetDia - lastDia) / 4;
      projectedSecondaryPoints = [
        Math.round(lastDia + step),
        Math.round(lastDia + step * 2),
        Math.round(lastDia + step * 3),
        Math.round(targetDia)
      ];
    }
  }

  // Generate 4 projected points interpolating between last historical and projectedValueIn30Days
  let projectedPoints: number[] = [];
  if (currentTrajectory && historicalPoints.length > 0) {
    const lastVal = historicalPoints[historicalPoints.length - 1];
    const targetVal = currentTrajectory.projectedValueIn30Days;
    const step = (targetVal - lastVal) / 4;
    projectedPoints = [
      Math.round(lastVal + step),
      Math.round(lastVal + step * 2),
      Math.round(lastVal + step * 3),
      Math.round(targetVal)
    ];
  }

  const metricConfig = {
    bp_systolic: {
      label: 'Systolic Blood Pressure',
      shortLabel: 'Systolic BP',
      unit: 'mmHg',
      icon: Heart,
      color: 'text-rose-500',
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      threshold: 140,
      optimal: '< 120 mmHg'
    },
    bp_diastolic: {
      label: 'Diastolic Blood Pressure',
      shortLabel: 'Diastolic BP',
      unit: 'mmHg',
      icon: Activity,
      color: 'text-indigo-500',
      bg: 'bg-indigo-50 dark:bg-indigo-950/40',
      threshold: 90,
      optimal: '< 80 mmHg'
    },
    glucose: {
      label: 'Blood Glucose (Fasting/Random)',
      shortLabel: 'Blood Glucose',
      unit: 'mg/dL',
      icon: Zap,
      color: 'text-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      threshold: 140,
      optimal: '< 100 mg/dL'
    }
  };

  const currentCfg = metricConfig[selectedMetric];
  const Icon = currentCfg.icon;

  const getSeverity = () => {
    if (!currentTrajectory) return 'info';
    if (currentTrajectory.projectedClinicalStage) return 'warning';
    if (currentTrajectory.currentTrend === 'rising' && selectedMetric !== 'glucose') return 'warning';
    if (currentTrajectory.currentTrend === 'falling') return 'positive';
    return 'info';
  };

  const severity = getSeverity();

  return (
    <div className="space-y-6">
      {/* Metric Selector Tabs */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 dark:bg-slate-900/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
        {(['bp_systolic', 'bp_diastolic', 'glucose'] as const).map((m) => {
          const cfg = metricConfig[m];
          const isSelected = selectedMetric === m;
          const traj = trajectories[m];
          return (
            <button
              id={`trajectory-metric-tab-${m}`}
              key={m}
              onClick={() => setSelectedMetric(m)}
              className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isSelected
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200/80 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <cfg.icon className={`w-4 h-4 ${isSelected ? cfg.color : 'text-slate-400'}`} />
              <span>{cfg.shortLabel}</span>
              {traj?.currentTrend === 'rising' && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            Computing personal baseline and fitting 30-day projection...
          </p>
        </div>
      ) : !currentTrajectory || historicalPoints.length < 4 ? (
        /* Empty State for Insufficient Data */
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <Clock className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">
              {t.copilot.trajectory.insufficientData}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t.copilot.trajectory.insufficientDesc} (Currently logged: {historicalPoints.length} readings).
            </p>
          </div>
          {onNavigate && (
            <button
              id="log-vitals-from-trajectory"
              onClick={() => onNavigate('vitals')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
            >
              <Activity className="w-4 h-4" />
              {t.copilot.trajectory.logVitalsCta}
            </button>
          )}
        </div>
      ) : (
        /* Trajectory Results Card */
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 sm:p-8 shadow-sm space-y-6">
          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-3.5">
              <div className={`w-12 h-12 rounded-2xl ${currentCfg.bg} ${currentCfg.color} flex items-center justify-center`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {currentCfg.label}
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  Personal Baseline Extrapolation Engine
                </span>
              </div>
            </div>

            {/* Current Trend Badge */}
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${
                  currentTrajectory.currentTrend === 'rising'
                    ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60'
                    : currentTrajectory.currentTrend === 'falling'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60'
                    : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60'
                }`}
              >
                {currentTrajectory.currentTrend === 'rising' ? (
                  <TrendingUp className="w-4 h-4" />
                ) : currentTrajectory.currentTrend === 'falling' ? (
                  <TrendingDown className="w-4 h-4" />
                ) : (
                  <Minus className="w-4 h-4" />
                )}
                {currentTrajectory.currentTrend.toUpperCase()} TREND
              </span>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Projected Value in 30 Days */}
            <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/80">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                {t.copilot.trajectory.projectedIn30Days}
              </span>
              <div className="flex items-baseline gap-1.5 mt-1.5">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {currentTrajectory.projectedValueIn30Days}
                </span>
                <span className="text-xs font-bold text-slate-500">{currentCfg.unit}</span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                vs last: {historicalPoints[historicalPoints.length - 1]} {currentCfg.unit}
              </span>
            </div>

            {/* Personal Baseline Mean */}
            <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/80">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                {t.copilot.trajectory.personalBaseline}
              </span>
              <div className="flex items-baseline gap-1.5 mt-1.5">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {currentBaseline ? `${currentBaseline.personalMean} ± ${currentBaseline.personalStdDev}` : '—'}
                </span>
                <span className="text-xs font-bold text-slate-500">{currentCfg.unit}</span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                {t.copilot.trajectory.sampleSize}: {currentBaseline?.sampleSize || historicalPoints.length} logs
              </span>
            </div>

            {/* Model Confidence */}
            <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/80">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                {t.copilot.trajectory.confidence}
              </span>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`px-2.5 py-1 rounded-md text-xs font-black uppercase ${
                    currentBaseline?.confidence === 'high'
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                      : currentBaseline?.confidence === 'medium'
                      ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                      : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                  }`}
                >
                  {currentBaseline?.confidence || 'medium'}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {currentBaseline?.sampleSize || 0} data points
                </span>
              </div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 block">
                Target: {currentCfg.optimal}
              </span>
            </div>
          </div>

          {/* Threshold Alert Banner (if crossed) */}
          {currentTrajectory.projectedClinicalStage && (
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-2xl p-4 flex items-start gap-3.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs">
                <strong className="text-amber-900 dark:text-amber-200 font-bold block mb-0.5">
                  {t.copilot.trajectory.thresholdAlert}: {currentTrajectory.projectedClinicalStage}
                </strong>
                <p className="text-amber-800 dark:text-amber-300">
                  {currentTrajectory.weeksUntilThresholdCrossed
                    ? `${t.copilot.trajectory.weeksToThreshold} ~${currentTrajectory.weeksUntilThresholdCrossed} weeks if the current upward velocity continues.`
                    : 'Your mathematical trendline indicates a trajectory toward elevated clinical stages over the next 30 days.'}
                </p>
              </div>
            </div>
          )}

          {/* Extended Visual Sparkline Graph */}
          <div className="p-5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <span className="w-3 h-0.5 bg-emerald-500 inline-block" /> Solid: Historical Logs
                <span className="w-3 h-0.5 border-t-2 border-dashed border-emerald-400 inline-block ml-3" /> Dashed: 30-Day Forecast
              </span>
              <span className="text-slate-500 dark:text-slate-400 font-semibold">
                Unit: {currentCfg.unit}
              </span>
            </div>

            <div className="py-2">
              <InsightSparkline
                points={historicalPoints}
                secondaryPoints={secondaryPoints}
                projectedPoints={projectedPoints}
                projectedSecondaryPoints={projectedSecondaryPoints}
                referenceLine={currentCfg.threshold}
                unit={currentCfg.unit}
                severity={severity}
              />
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 italic pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
              {currentTrajectory.currentTrend === 'rising'
                ? `Based on your last ${historicalPoints.length} logged readings, ${currentCfg.label.toLowerCase()} is trending upward at an average rate of ~${Math.abs(Math.round(((currentTrajectory.projectedValueIn30Days - historicalPoints[historicalPoints.length - 1]) / 4) * 10) / 10)} ${currentCfg.unit}/week.`
                : currentTrajectory.currentTrend === 'falling'
                ? `Based on your recent logs, ${currentCfg.label.toLowerCase()} demonstrates a favorable declining trajectory, projecting toward ${currentTrajectory.projectedValueIn30Days} ${currentCfg.unit}.`
                : `Your ${currentCfg.label.toLowerCase()} has remained remarkably stable around your personal mean of ${currentBaseline?.personalMean || historicalPoints[historicalPoints.length - 1]} ${currentCfg.unit}.`}
            </p>
          </div>

          {/* Action Row: Doctor CTA & Mandatory Disclaimer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-700">
            <div className="flex items-start gap-2 max-w-lg">
              <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                {currentTrajectory.confidenceNote || t.copilot.disclaimer}
              </p>
            </div>

            {onNavigate && (
              <button
                id="discuss-trajectory-doctor-btn"
                onClick={() => onNavigate('doctorBooking')}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer shrink-0"
              >
                <span>{t.copilot.trajectory.discussDoctor}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
