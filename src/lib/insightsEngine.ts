import { VitalRecord, Medicine, DailyCheckInLog } from '../types';
import { Translations } from '../localization/types';

export interface Insight {
  id: string;
  category: 'Cardiovascular' | 'Metabolic' | 'Prescription Schedule' | 'Lifestyle' | 'General';
  severity: 'positive' | 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  metricEvidence?: string; // the actual numbers that produced this insight, e.g. "Avg 128/84 over last 7 readings"
  generatedAt: string;
  trend?: {
    points: number[];        // raw numeric series, chronological order (oldest → newest)
    unit: string;            // e.g. "mmHg", "mg/dL" — for the tooltip/aria-label only, not rendered as an axis
    referenceLine?: number;  // optional single horizontal threshold value to render as a faint dashed line (e.g. 140 for glucose "elevated" threshold), omit if not applicable
    secondaryPoints?: number[]; // optional second series, same length as `points`, e.g. diastolic when `points` is systolic — used only for BP so the sparkline can show two lines
  };
}

function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ''));
}

/**
 * Computes Blood Pressure trends and critical thresholds based purely on real VitalRecord logs.
 * Requires at least 5 BP readings; returns null if data is insufficient.
 */
export function getBpTrendInsight(vitals: VitalRecord[], t: Translations['insights']): Insight | null {
  const bpRecords = vitals
    .filter(
      (v) =>
        v.type === 'bp' &&
        typeof v.systolic === 'number' &&
        typeof v.diastolic === 'number' &&
        v.systolic > 0 &&
        v.diastolic > 0
    )
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  if (bpRecords.length < 5) {
    return null;
  }

  const count = bpRecords.length;
  const sysSum = bpRecords.reduce((acc, r) => acc + (r.systolic || 0), 0);
  const diaSum = bpRecords.reduce((acc, r) => acc + (r.diastolic || 0), 0);
  const avgSys = Math.round(sysSum / count);
  const avgDia = Math.round(diaSum / count);

  const maxSys = Math.max(...bpRecords.map((r) => r.systolic || 0));
  const maxDia = Math.max(...bpRecords.map((r) => r.diastolic || 0));
  const minSys = Math.min(...bpRecords.map((r) => r.systolic || 0));
  const minDia = Math.min(...bpRecords.map((r) => r.diastolic || 0));

  const recentN = bpRecords.slice(-Math.min(5, Math.ceil(count / 2)));
  const recentAvgSys = Math.round(recentN.reduce((a, b) => a + (b.systolic || 0), 0) / recentN.length);
  const recentAvgDia = Math.round(recentN.reduce((a, b) => a + (b.diastolic || 0), 0) / recentN.length);

  // 1. Critical Hypertensive Crisis Check (Systolic >= 180 or Diastolic >= 120)
  if (recentAvgSys >= 180 || recentAvgDia >= 120 || maxSys >= 180 || maxDia >= 120) {
    return {
      id: 'bp-critical-hypertensive',
      category: 'Cardiovascular',
      severity: 'critical',
      title: t.bp.criticalTitle,
      description: t.bp.criticalDesc,
      metricEvidence: fmt(t.bp.criticalEvidence, { recentAvgSys, recentAvgDia, maxSys, maxDia, count }),
      trend: {
        points: bpRecords.map((r) => r.systolic || 0),
        secondaryPoints: bpRecords.map((r) => r.diastolic || 0),
        unit: 'mmHg'
      },
      generatedAt: new Date().toISOString()
    };
  }

  // 2. Severe Hypotension Check (< 90/60 mmHg)
  if (recentAvgSys < 90 || recentAvgDia < 60) {
    return {
      id: 'bp-hypotension-warning',
      category: 'Cardiovascular',
      severity: 'warning',
      title: t.bp.hypotensionTitle,
      description: t.bp.hypotensionDesc,
      metricEvidence: fmt(t.bp.hypotensionEvidence, { recentAvgSys, recentAvgDia, minSys, minDia, count }),
      trend: {
        points: bpRecords.map((r) => r.systolic || 0),
        secondaryPoints: bpRecords.map((r) => r.diastolic || 0),
        unit: 'mmHg'
      },
      generatedAt: new Date().toISOString()
    };
  }

  // 3. Stage 1/2 Hypertension or Elevated Check (Systolic >= 130 or Diastolic >= 85)
  if (recentAvgSys >= 130 || recentAvgDia >= 85) {
    return {
      id: 'bp-elevated-warning',
      category: 'Cardiovascular',
      severity: 'warning',
      title: t.bp.elevatedTitle,
      description: t.bp.elevatedDesc,
      metricEvidence: fmt(t.bp.elevatedEvidence, {
        recentAvgSys,
        recentAvgDia,
        recentCount: recentN.length,
        avgSys,
        avgDia
      }),
      trend: {
        points: bpRecords.map((r) => r.systolic || 0),
        secondaryPoints: bpRecords.map((r) => r.diastolic || 0),
        unit: 'mmHg'
      },
      generatedAt: new Date().toISOString()
    };
  }

  // 4. Meaningful Improvement Check (Comparing older half vs recent half if count >= 8)
  if (count >= 8) {
    const half = Math.floor(count / 2);
    const earlierRecords = bpRecords.slice(0, half);
    const laterRecords = bpRecords.slice(half);

    const earlierSys = Math.round(earlierRecords.reduce((a, b) => a + (b.systolic || 0), 0) / earlierRecords.length);
    const earlierDia = Math.round(earlierRecords.reduce((a, b) => a + (b.diastolic || 0), 0) / earlierRecords.length);
    const laterSys = Math.round(laterRecords.reduce((a, b) => a + (b.systolic || 0), 0) / laterRecords.length);
    const laterDia = Math.round(laterRecords.reduce((a, b) => a + (b.diastolic || 0), 0) / laterRecords.length);

    if (earlierSys - laterSys >= 5 && laterSys <= 125) {
      return {
        id: 'bp-improvement-positive',
        category: 'Cardiovascular',
        severity: 'positive',
        title: t.bp.improvementTitle,
        description: fmt(t.bp.improvementDesc, { earlierSys, laterSys }),
        metricEvidence: fmt(t.bp.improvementEvidence, {
          laterSys,
          laterDia,
          laterCount: laterRecords.length,
          earlierSys,
          earlierDia,
          earlierCount: earlierRecords.length
        }),
        trend: {
          points: bpRecords.map((r) => r.systolic || 0),
          secondaryPoints: bpRecords.map((r) => r.diastolic || 0),
          unit: 'mmHg'
        },
        generatedAt: new Date().toISOString()
      };
    }
  }

  // 5. Optimal consistency (< 120/80 mmHg)
  if (recentAvgSys < 120 && recentAvgDia < 80) {
    return {
      id: 'bp-optimal-consistency',
      category: 'Cardiovascular',
      severity: 'positive',
      title: t.bp.optimalTitle,
      description: t.bp.optimalDesc,
      metricEvidence: fmt(t.bp.optimalEvidence, { recentAvgSys, recentAvgDia, count }),
      trend: {
        points: bpRecords.map((r) => r.systolic || 0),
        secondaryPoints: bpRecords.map((r) => r.diastolic || 0),
        unit: 'mmHg'
      },
      generatedAt: new Date().toISOString()
    };
  }

  // 6. Normal baseline (120-129 / <85 mmHg)
  return {
    id: 'bp-normal-baseline',
    category: 'Cardiovascular',
    severity: 'info',
    title: t.bp.normalTitle,
    description: t.bp.normalDesc,
    metricEvidence: fmt(t.bp.normalEvidence, { avgSys, avgDia, count }),
    trend: {
      points: bpRecords.map((r) => r.systolic || 0),
      secondaryPoints: bpRecords.map((r) => r.diastolic || 0),
      unit: 'mmHg'
    },
    generatedAt: new Date().toISOString()
  };
}

/**
 * Computes Glucose trends and critical thresholds based on real VitalRecord logs.
 * Requires at least 3 sugar readings; returns null if data is insufficient.
 */
export function getSugarTrendInsight(vitals: VitalRecord[], t: Translations['insights']): Insight | null {
  const sugarRecords = vitals
    .filter((v) => v.type === 'sugar' && typeof v.value === 'number' && v.value > 0)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  if (sugarRecords.length < 3) {
    return null;
  }

  const count = sugarRecords.length;
  const values = sugarRecords.map((r) => r.value);
  const sum = values.reduce((a, b) => a + b, 0);
  const avg = Math.round(sum / count);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const latest = values[values.length - 1];

  // 1. Critical Hyperglycemia or Hypoglycemia (>= 250 or < 55 mg/dL)
  if (latest >= 250 || max >= 250 || latest < 55 || min < 55) {
    const isHigh = latest >= 250 || max >= 250;
    return {
      id: 'sugar-critical-alert',
      category: 'Metabolic',
      severity: 'critical',
      title: isHigh ? t.sugar.criticalHighTitle : t.sugar.criticalLowTitle,
      description: isHigh ? t.sugar.criticalHighDesc : t.sugar.criticalLowDesc,
      metricEvidence: fmt(t.sugar.criticalEvidence, { latest, min, max, count }),
      trend: {
        points: sugarRecords.map((r) => r.value),
        unit: 'mg/dL',
        ...(isHigh ? { referenceLine: 140 } : {})
      },
      generatedAt: new Date().toISOString()
    };
  }

  // 2. Elevated Glucose Trend (Avg >= 140 mg/dL)
  if (avg >= 140) {
    return {
      id: 'sugar-elevated-warning',
      category: 'Metabolic',
      severity: 'warning',
      title: t.sugar.elevatedTitle,
      description: t.sugar.elevatedDesc,
      metricEvidence: fmt(t.sugar.elevatedEvidence, { avg, max, latest, count }),
      trend: {
        points: sugarRecords.map((r) => r.value),
        unit: 'mg/dL',
        referenceLine: 140
      },
      generatedAt: new Date().toISOString()
    };
  }

  // 3. Mild Hypoglycemia / Low Glucose (Avg < 70 mg/dL)
  if (avg < 70) {
    return {
      id: 'sugar-low-warning',
      category: 'Metabolic',
      severity: 'warning',
      title: t.sugar.lowTitle,
      description: t.sugar.lowDesc,
      metricEvidence: fmt(t.sugar.lowEvidence, { avg, min, count }),
      trend: {
        points: sugarRecords.map((r) => r.value),
        unit: 'mg/dL'
      },
      generatedAt: new Date().toISOString()
    };
  }

  // 4. Stable Target Glucose (70 - 130 mg/dL)
  return {
    id: 'sugar-stable-positive',
    category: 'Metabolic',
    severity: 'positive',
    title: t.sugar.stableTitle,
    description: t.sugar.stableDesc,
    metricEvidence: fmt(t.sugar.stableEvidence, { avg, count, min, max }),
    trend: {
      points: sugarRecords.map((r) => r.value),
      unit: 'mg/dL'
    },
    generatedAt: new Date().toISOString()
  };
}

/**
 * Computes real refill countdowns and adherence percentages for active medications.
 * Never fabricates drug names; returns empty array if no real medications match criteria.
 */
export function getMedicineAdherenceInsight(medicines: Medicine[], t: Translations['insights']): Insight[] {
  const insights: Insight[] = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Active medicines (no end date or end date in present/future)
  const activeMeds = medicines.filter((m) => {
    if (!m.endDate) return true;
    const end = new Date(m.endDate);
    return end.getTime() >= now.getTime();
  });

  for (const med of activeMeds) {
    // 1. Derive daily dose count
    let dailyDoses = 1;
    if (Array.isArray(med.timings) && med.timings.length > 0) {
      dailyDoses = med.timings.length;
    } else if (med.frequency === 'twice_daily') {
      dailyDoses = 2;
    } else if (med.frequency === 'thrice_daily') {
      dailyDoses = 3;
    }

    // 2. Real Refill Warning computation
    if (typeof med.remainingPills === 'number' && med.remainingPills >= 0) {
      const daysLeft = Math.floor(med.remainingPills / Math.max(1, dailyDoses));

      if (daysLeft <= 3) {
        insights.push({
          id: `refill-urgent-${med.id}`,
          category: 'Prescription Schedule',
          severity: 'critical',
          title: fmt(t.adherence.refillUrgentTitle, { name: med.name }),
          description: fmt(t.adherence.refillUrgentDesc, {
            remainingPills: med.remainingPills,
            name: med.name,
            daysLeft
          }),
          metricEvidence: fmt(t.adherence.refillUrgentEvidence, {
            remainingPills: med.remainingPills,
            daysLeft,
            dailyDoses
          }),
          generatedAt: new Date().toISOString()
        });
      } else if (daysLeft <= 7) {
        insights.push({
          id: `refill-warning-${med.id}`,
          category: 'Prescription Schedule',
          severity: 'warning',
          title: fmt(t.adherence.refillWarningTitle, { name: med.name }),
          description: fmt(t.adherence.refillWarningDesc, {
            daysLeft,
            name: med.name,
            remainingPills: med.remainingPills
          }),
          metricEvidence: fmt(t.adherence.refillWarningEvidence, {
            remainingPills: med.remainingPills,
            daysLeft,
            dailyDoses
          }),
          generatedAt: new Date().toISOString()
        });
      }
    }

    // 3. Real Adherence % calculation from adherence log
    if (med.adherence && typeof med.adherence === 'object') {
      const entries = Object.entries(med.adherence);
      if (entries.length >= 5) {
        const takenDoses = entries.filter(([_, taken]) => Boolean(taken)).length;
        const totalDoses = entries.length;
        const adherencePct = Math.round((takenDoses / totalDoses) * 100);

        if (adherencePct >= 90) {
          insights.push({
            id: `adherence-high-${med.id}`,
            category: 'Prescription Schedule',
            severity: 'positive',
            title: fmt(t.adherence.highTitle, { name: med.name }),
            description: fmt(t.adherence.highDesc, {
              name: med.name,
              adherencePct
            }),
            metricEvidence: fmt(t.adherence.highEvidence, {
              adherencePct,
              takenDoses,
              totalDoses
            }),
            generatedAt: new Date().toISOString()
          });
        } else if (adherencePct < 70) {
          const missedDoses = totalDoses - takenDoses;
          insights.push({
            id: `adherence-low-${med.id}`,
            category: 'Prescription Schedule',
            severity: 'warning',
            title: fmt(t.adherence.lowTitle, { name: med.name }),
            description: fmt(t.adherence.lowDesc, {
              name: med.name,
              adherencePct
            }),
            metricEvidence: fmt(t.adherence.lowEvidence, {
              adherencePct,
              missedDoses,
              totalDoses
            }),
            generatedAt: new Date().toISOString()
          });
        }
      }
    }
  }

  return insights;
}

/**
 * Computes genuine lifestyle correlations from at least 7 check-in logs.
 * Returns null if check-ins are insufficient or if no honest pattern is observed.
 */
export function getLifestyleCorrelationInsight(
  checkins: DailyCheckInLog[],
  _vitals: VitalRecord[] = [],
  t: Translations['insights']
): Insight | null {
  if (!Array.isArray(checkins) || checkins.length < 7) {
    return null;
  }

  // 1. Sleep Duration vs Energy Correlation
  const highSleepDays = checkins.filter((c) => typeof c.sleepHours === 'number' && c.sleepHours >= 7);
  const lowSleepDays = checkins.filter((c) => typeof c.sleepHours === 'number' && c.sleepHours > 0 && c.sleepHours < 6);

  if (highSleepDays.length >= 2 && lowSleepDays.length >= 2) {
    const avgHighEnergy =
      highSleepDays.reduce((acc, c) => acc + (c.energyLevel || 3), 0) / highSleepDays.length;
    const avgLowEnergy =
      lowSleepDays.reduce((acc, c) => acc + (c.energyLevel || 3), 0) / lowSleepDays.length;

    const diff = avgHighEnergy - avgLowEnergy;
    if (diff >= 0.5) {
      return {
        id: 'lifestyle-sleep-vitality',
        category: 'Lifestyle',
        severity: 'positive',
        title: t.lifestyle.sleepTitle,
        description: fmt(t.lifestyle.sleepDesc, {
          avgHighEnergy: avgHighEnergy.toFixed(1),
          avgLowEnergy: avgLowEnergy.toFixed(1)
        }),
        metricEvidence: fmt(t.lifestyle.sleepEvidence, {
          avgHighEnergy: avgHighEnergy.toFixed(1),
          highSleepDays: highSleepDays.length,
          avgLowEnergy: avgLowEnergy.toFixed(1),
          lowSleepDays: lowSleepDays.length
        }),
        trend: {
          points: [...highSleepDays, ...lowSleepDays]
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map((c) => c.energyLevel),
          unit: '/5'
        },
        generatedAt: new Date().toISOString()
      };
    }
  }

  // 2. Hydration Intake Analysis
  const validWaterLogs = checkins
    .filter((c) => typeof c.waterIntakeLiters === 'number' && c.waterIntakeLiters > 0)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  if (validWaterLogs.length >= 7) {
    const totalWater = validWaterLogs.reduce((acc, c) => acc + c.waterIntakeLiters, 0);
    const avgWater = totalWater / validWaterLogs.length;

    if (avgWater >= 2.0) {
      return {
        id: 'lifestyle-hydration-optimal',
        category: 'Lifestyle',
        severity: 'positive',
        title: t.lifestyle.hydrationOptimalTitle,
        description: fmt(t.lifestyle.hydrationOptimalDesc, {
          avgWater: avgWater.toFixed(1),
          count: validWaterLogs.length
        }),
        metricEvidence: fmt(t.lifestyle.hydrationOptimalEvidence, {
          avgWater: avgWater.toFixed(1),
          count: validWaterLogs.length
        }),
        trend: {
          points: validWaterLogs.map((c) => c.waterIntakeLiters),
          unit: 'L',
          referenceLine: 2.0
        },
        generatedAt: new Date().toISOString()
      };
    } else if (avgWater < 1.2) {
      return {
        id: 'lifestyle-hydration-low',
        category: 'Lifestyle',
        severity: 'info',
        title: t.lifestyle.hydrationLowTitle,
        description: fmt(t.lifestyle.hydrationLowDesc, {
          avgWater: avgWater.toFixed(1)
        }),
        metricEvidence: fmt(t.lifestyle.hydrationLowEvidence, {
          avgWater: avgWater.toFixed(1),
          count: validWaterLogs.length
        }),
        trend: {
          points: validWaterLogs.map((c) => c.waterIntakeLiters),
          unit: 'L',
          referenceLine: 2.0
        },
        generatedAt: new Date().toISOString()
      };
    }
  }

  return null;
}

/**
 * Computes genuine check-in streaks from consecutive daily check-in dates.
 * Returns null if streak is < 3 days.
 */
export function getCheckInStreakInsight(checkins: DailyCheckInLog[], t: Translations['insights']): Insight | null {
  if (!Array.isArray(checkins) || checkins.length < 3) {
    return null;
  }

  // Extract unique dates sorted descending
  const uniqueDates = Array.from(new Set(checkins.map((c) => c.date).filter(Boolean))).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  if (uniqueDates.length < 3) {
    return null;
  }

  // Calculate consecutive streak starting from the most recent entry
  let streak = 1;
  for (let i = 0; i < uniqueDates.length - 1; i++) {
    const current = new Date(uniqueDates[i]);
    const previous = new Date(uniqueDates[i + 1]);
    const diffDays = Math.round((current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }

  if (streak >= 3) {
    return {
      id: `checkin-streak-${streak}`,
      category: 'General',
      severity: 'positive',
      title: fmt(t.streak.title, { streak }),
      description: fmt(t.streak.desc, { streak }),
      metricEvidence: fmt(t.streak.evidence, { streak, lastDate: uniqueDates[0] }),
      generatedAt: new Date().toISOString()
    };
  }

  return null;
}

/**
 * Main aggregator: evaluates all insight functions, filters out nulls,
 * and orders by severity priority: critical -> warning -> info -> positive.
 */
export function generateAllInsights(
  data: {
    vitals: VitalRecord[];
    medicines: Medicine[];
    checkins: DailyCheckInLog[];
  },
  t: Translations['insights']
): Insight[] {
  const { vitals = [], medicines = [], checkins = [] } = data;

  const rawInsights: (Insight | null | Insight[])[] = [
    getBpTrendInsight(vitals, t),
    getSugarTrendInsight(vitals, t),
    getMedicineAdherenceInsight(medicines, t),
    getLifestyleCorrelationInsight(checkins, vitals, t),
    getCheckInStreakInsight(checkins, t)
  ];

  const flatInsights: Insight[] = [];
  for (const item of rawInsights) {
    if (!item) continue;
    if (Array.isArray(item)) {
      flatInsights.push(...item);
    } else {
      flatInsights.push(item);
    }
  }

  // Sort by severity priority: critical (1) -> warning (2) -> info (3) -> positive (4)
  const severityRank: Record<Insight['severity'], number> = {
    critical: 1,
    warning: 2,
    info: 3,
    positive: 4
  };

  return flatInsights.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
}
