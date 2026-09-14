import React, { useEffect, useState, useCallback } from 'react';
import {
  Lightbulb,
  Heart,
  Activity,
  Pill,
  Sparkles,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  RefreshCw,
  ShieldAlert,
  Info,
  BarChart3,
  CalendarCheck,
  PlusCircle
} from 'lucide-react';
import { useLanguage } from '../localization/language_context';
import { api } from '../lib/api';
import { VitalRecord, Medicine, DailyCheckInLog } from '../types';
import { generateAllInsights, Insight } from '../lib/insightsEngine';
import InsightSparkline from './InsightSparkline';

interface HealthInsightsProps {
  onNavigate?: (tab: string) => void;
}

export default function HealthInsights({ onNavigate }: HealthInsightsProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [vitalsCount, setVitalsCount] = useState<number>(0);
  const [medicinesCount, setMedicinesCount] = useState<number>(0);
  const [checkinsCount, setCheckinsCount] = useState<number>(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [vitalsData, medsData, checkinsData] = await Promise.all([
        api.vitals.getAll() as Promise<VitalRecord[]>,
        api.medicines.getAll() as Promise<Medicine[]>,
        (api.dailyCheckins?.getAll ? api.dailyCheckins.getAll() : api.dailyLogs.getAll()) as Promise<DailyCheckInLog[]>
      ]);

      const vitalsList = Array.isArray(vitalsData) ? vitalsData : [];
      const medsList = Array.isArray(medsData) ? medsData : [];
      const checkinsList = Array.isArray(checkinsData) ? checkinsData : [];

      setVitalsCount(vitalsList.length);
      setMedicinesCount(medsList.length);
      setCheckinsCount(checkinsList.length);

      const computedInsights = generateAllInsights(
        {
          vitals: vitalsList,
          medicines: medsList,
          checkins: checkinsList
        },
        t.insights
      );

      setInsights(computedInsights);
    } catch (err: unknown) {
      console.error('Failed to load user health records for insights:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to retrieve your biometric records. Please check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const categoryLabel = (category: Insight['category']) => {
    switch (category) {
      case 'Cardiovascular':
        return t.insights.categories.cardiovascular;
      case 'Metabolic':
        return t.insights.categories.metabolic;
      case 'Prescription Schedule':
        return t.insights.categories.prescriptionSchedule;
      case 'Lifestyle':
        return t.insights.categories.lifestyle;
      case 'General':
      default:
        return t.insights.categories.general;
    }
  };

  const severityLabel = (severity: Insight['severity']) => {
    switch (severity) {
      case 'critical':
        return t.insights.severity.critical;
      case 'warning':
        return t.insights.severity.warning;
      case 'positive':
        return t.insights.severity.positive;
      case 'info':
      default:
        return t.insights.severity.info;
    }
  };

  const getCategoryIcon = (category: Insight['category']) => {
    switch (category) {
      case 'Cardiovascular':
        return <Heart className="w-4 h-4 text-rose-500" />;
      case 'Metabolic':
        return <Activity className="w-4 h-4 text-amber-500" />;
      case 'Prescription Schedule':
        return <Pill className="w-4 h-4 text-indigo-500" />;
      case 'Lifestyle':
        return <Sparkles className="w-4 h-4 text-emerald-500" />;
      case 'General':
      default:
        return <BarChart3 className="w-4 h-4 text-blue-500" />;
    }
  };

  const getSeverityBadge = (severity: Insight['severity']) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200 border border-rose-200 dark:border-rose-700">
            <AlertOctagon className="w-3 h-3" />
            {severityLabel('critical')}
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 border border-amber-200 dark:border-amber-700">
            <AlertTriangle className="w-3 h-3" />
            {severityLabel('warning')}
          </span>
        );
      case 'positive':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-700">
            <CheckCircle2 className="w-3 h-3" />
            {severityLabel('positive')}
          </span>
        );
      case 'info':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 border border-blue-200 dark:border-blue-700">
            <Info className="w-3 h-3" />
            {severityLabel('info')}
          </span>
        );
    }
  };

  const getCardStyle = (severity: Insight['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-rose-50/70 dark:bg-rose-950/30 border-2 border-rose-300 dark:border-rose-800 shadow-sm hover:shadow-md';
      case 'warning':
        return 'bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 shadow-sm hover:shadow-md';
      case 'positive':
        return 'bg-emerald-50/30 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 shadow-sm hover:shadow-md';
      case 'info':
      default:
        return 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md';
    }
  };

  const criticalCount = insights.filter((i) => i.severity === 'critical').length;
  const warningCount = insights.filter((i) => i.severity === 'warning').length;
  const positiveCount = insights.filter((i) => i.severity === 'positive').length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Lightbulb className="w-7 h-7 text-emerald-500" />
            {t.insights?.header?.title || t.nav?.insights || 'Health Insights'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t.insights.header.subtitle}
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-2xl transition disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {t.insights.header.refresh}
        </button>
      </div>

      {/* Summary Metrics Strip (when data exists) */}
      {!loading && !error && insights.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t.insights.summary.active}</span>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{insights.length}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <span className="text-[11px] font-bold text-rose-500 uppercase tracking-wider">{t.insights.summary.urgent}</span>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{criticalCount}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wider">{t.insights.summary.observations}</span>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{warningCount}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider">{t.insights.summary.positive}</span>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{positiveCount}</p>
          </div>
        </div>
      )}

      {/* Critical Banner Alert if any critical insights exist */}
      {!loading && !error && criticalCount > 0 && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-400 dark:border-rose-800 rounded-3xl p-5 flex items-start gap-4 shadow-sm">
          <div className="p-2.5 rounded-2xl bg-rose-100 dark:bg-rose-900 text-rose-600 dark:text-rose-200 shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-rose-900 dark:text-rose-100">
              {t.insights.criticalBanner.title}
            </h3>
            <p className="text-xs text-rose-700 dark:text-rose-300 mt-1 leading-relaxed">
              {t.insights.criticalBanner.description}
            </p>
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm space-y-4 animate-pulse"
            >
              <div className="flex justify-between items-center">
                <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded-full" />
                <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded-full" />
              </div>
              <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-700 rounded-lg" />
              <div className="space-y-2">
                <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-3 w-5/6 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-3 w-2/3 bg-slate-200 dark:bg-slate-700 rounded" />
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <div className="h-3 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State with Retry */}
      {!loading && error && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-rose-200 dark:border-rose-900 text-center max-w-lg mx-auto shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">
            {t.insights.error.title}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
            {error}
          </p>
          <button
            onClick={loadData}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition"
          >
            {t.insights.error.retry}
          </button>
        </div>
      )}

      {/* Empty State: No insights computed due to insufficient underlying data */}
      {!loading && !error && insights.length === 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 sm:p-12 border border-slate-100 dark:border-slate-700 shadow-sm text-center max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-5">
            <BarChart3 className="w-8 h-8" />
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-2">
            {t.insights.empty.title}
          </h2>

          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto mb-8 leading-relaxed">
            {t.insights.empty.description}
          </p>

          {/* Explanation Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left mb-8">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-750 border border-slate-100 dark:border-slate-700 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-rose-500 font-bold text-xs uppercase mb-2">
                  <Heart className="w-4 h-4" />
                  {t.insights.empty.vitalsCardTitle}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t.insights.empty.vitalsCardDesc}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-400">
                {t.insights.empty.loggedReadings.replace('{count}', String(vitalsCount))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-750 border border-slate-100 dark:border-slate-700 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-indigo-500 font-bold text-xs uppercase mb-2">
                  <Pill className="w-4 h-4" />
                  {t.insights.empty.medsCardTitle}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t.insights.empty.medsCardDesc}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-400">
                {t.insights.empty.loggedMedicines.replace('{count}', String(medicinesCount))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-750 border border-slate-100 dark:border-slate-700 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs uppercase mb-2">
                  <CalendarCheck className="w-4 h-4" />
                  {t.insights.empty.checkinsCardTitle}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t.insights.empty.checkinsCardDesc}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-400">
                {t.insights.empty.loggedCheckins.replace('{count}', String(checkinsCount))}
              </div>
            </div>
          </div>

          {/* Quick Action Navigation */}
          {onNavigate && (
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => onNavigate('vitals')}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                {t.insights.empty.logVitals}
              </button>
              <button
                onClick={() => onNavigate('medicines')}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition"
              >
                <Pill className="w-3.5 h-3.5" />
                {t.insights.empty.addMedication}
              </button>
              <button
                onClick={() => onNavigate('dailyCheckIn')}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition"
              >
                <CalendarCheck className="w-3.5 h-3.5" />
                {t.insights.empty.completeCheckIn}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Real Computed Insights Grid */}
      {!loading && !error && insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {insights.map((item) => (
            <div
              key={item.id}
              className={`rounded-3xl p-6 transition flex flex-col justify-between ${getCardStyle(item.severity)}`}
            >
              <div>
                {/* Category & Severity Tag */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    {getCategoryIcon(item.category)}
                    {categoryLabel(item.category)}
                  </span>
                  {getSeverityBadge(item.severity)}
                </div>

                {/* Insight Title */}
                <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                  {item.title}
                </h3>

                {/* Insight Description */}
                <p className="mt-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Data Evidence Footer */}
              <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-700/80">
                {item.trend && item.trend.points.length >= 2 && (
                  <div className="mb-3">
                    <InsightSparkline
                      points={item.trend.points}
                      secondaryPoints={item.trend.secondaryPoints}
                      referenceLine={item.trend.referenceLine}
                      unit={item.trend.unit}
                      severity={item.severity}
                    />
                  </div>
                )}
                {item.metricEvidence ? (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {t.insights.evidenceLabel}
                    </span>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 font-mono">
                      {item.metricEvidence}
                    </p>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">
                    {t.insights.evidenceFallback}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Clinical Disclaimer */}
      {!loading && (
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-700 text-center">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal flex items-center justify-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            {t.insights.disclaimer}
          </p>
        </div>
      )}
    </div>
  );
}
