import { Translations } from '../types';

export const en: Translations = {
  appName: "DHealora",
  tagline: "Your AI-Powered Healthcare Companion",
  nav: {
    dashboard: "Dashboard",
    vitals: "Vitals Tracker",
    medicines: "Medicine Reminders",
    reports: "AI Lab Reports",
    chat: "Healora AI Chat",
    appointments: "Appointments",
    healthTwin: "Health Twin & Risk",
    copilot: "AI Health Copilot",
    insights: "Health Insights",
    careCircle: "Care Circle",
    emergencySos: "Emergency SOS",
    settings: "Settings",
    adminPanel: "Admin Suite",
    doctorBooking: "Book Doctor",
    marketplace: "Healthcare Marketplace"
  },
  dashboard: {
    greeting: "Welcome back",
    quickStats: "Health Vitality Summary",
    vitalsOverview: "Real-Time Vitals",
    medicineReminder: "Today's Prescriptions",
    upcomingAppointments: "Scheduled Consultations",
    askHealora: "Ask Healora AI anything...",
    recordVitals: "Log New Vitals",
    logSymptoms: "Daily Check-in",
    emergencyButton: "EMERGENCY SOS"
  },
  common: {
    save: "Save Changes",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    add: "Add New",
    search: "Search...",
    loading: "Processing...",
    status: "Status",
    actions: "Actions",
    viewAll: "View All",
    close: "Close",
    confirm: "Confirm",
    success: "Operation Successful",
    error: "An error occurred"
  },
  insights: {
    header: {
      title: "Health Insights",
      subtitle: "Real-time biometric trends and prescriptive observations synthesized exclusively from your logged health records",
      refresh: "Refresh Trends"
    },
    summary: {
      active: "Active Insights",
      urgent: "Urgent Alerts",
      observations: "Observations",
      positive: "Positive Trends"
    },
    criticalBanner: {
      title: "Urgent Biometric Elevation Detected",
      description: "One or more physiological readings recently reached clinically critical thresholds. Please review the highlighted card below and consult your healthcare professional promptly."
    },
    error: {
      title: "Failed to Compute Health Insights",
      retry: "Retry Calculation"
    },
    empty: {
      title: "No Personal Trends Detected Yet",
      description: "Insights on DHealora are computed live from your real logs. Start tracking your vitals, medications, and daily check-ins to generate personalized health observations.",
      vitalsCardTitle: "Vitals Baseline",
      vitalsCardDesc: "Log at least 5 blood pressure or 3 blood glucose readings to unlock trend and range stability analysis.",
      medsCardTitle: "Rx Schedule & Refills",
      medsCardDesc: "Add active medications with pill counts to receive real refill countdowns and adherence percentages.",
      checkinsCardTitle: "Daily Check-ins",
      checkinsCardDesc: "Record 7+ daily check-ins to discover sleep-energy correlations, hydration averages, and track streaks.",
      loggedReadings: "Logged: {count} reading(s)",
      loggedMedicines: "Logged: {count} medicine(s)",
      loggedCheckins: "Logged: {count} check-in(s)",
      logVitals: "Log Biometric Vitals",
      addMedication: "Add Medication",
      completeCheckIn: "Complete Daily Check-In"
    },
    disclaimer: "These are pattern observations from your own logged data, not a medical diagnosis — consult your doctor for clinical advice.",
    evidenceLabel: "Observed Evidence:",
    evidenceFallback: "Based on your recent health logs",
    severity: {
      critical: "Critical Attention",
      warning: "Observation Alert",
      positive: "Positive Milestone",
      info: "Baseline Track"
    },
    categories: {
      cardiovascular: "Cardiovascular",
      metabolic: "Metabolic",
      prescriptionSchedule: "Prescription Schedule",
      lifestyle: "Lifestyle",
      general: "General"
    },
    bp: {
      criticalTitle: "Urgent: Severely Elevated Blood Pressure",
      criticalDesc: "Recent blood pressure readings have crossed hypertensive crisis levels (≥180/120 mmHg). Please rest, avoid physical exertion, and seek immediate clinical evaluation or emergency medical care.",
      criticalEvidence: "Recent avg: {recentAvgSys}/{recentAvgDia} mmHg (Peak reading: {maxSys}/{maxDia} mmHg across {count} logged readings)",
      hypotensionTitle: "Low Blood Pressure (Hypotension) Detected",
      hypotensionDesc: "Your recent blood pressure readings average below typical standard thresholds (<90/60 mmHg). Stay hydrated, change postures slowly, and consult your physician if experiencing lightheadedness or fatigue.",
      hypotensionEvidence: "Recent avg: {recentAvgSys}/{recentAvgDia} mmHg (Low: {minSys}/{minDia} mmHg across {count} logs)",
      elevatedTitle: "Elevated Blood Pressure Trend",
      elevatedDesc: "Your blood pressure readings have averaged above the normal target range (systolic ≥130 or diastolic ≥85 mmHg). Consider reviewing sodium intake, monitoring stress, and scheduling a routine review with your doctor.",
      elevatedEvidence: "Recent avg: {recentAvgSys}/{recentAvgDia} mmHg across your last {recentCount} logs (Overall avg: {avgSys}/{avgDia} mmHg)",
      improvementTitle: "Blood Pressure Improvement Observed",
      improvementDesc: "Your systolic blood pressure has improved from an earlier average of {earlierSys} mmHg down to {laterSys} mmHg, showing positive cardiovascular stability.",
      improvementEvidence: "Averaged {laterSys}/{laterDia} mmHg in recent {laterCount} logs vs {earlierSys}/{earlierDia} mmHg in prior {earlierCount} logs",
      optimalTitle: "Blood Pressure in Optimal Range",
      optimalDesc: "Your blood pressure readings have consistently remained in the healthy optimal range (<120/80 mmHg), demonstrating good cardiovascular equilibrium.",
      optimalEvidence: "Recent avg: {recentAvgSys}/{recentAvgDia} mmHg across your last {count} logged readings",
      normalTitle: "Stable Blood Pressure Baseline",
      normalDesc: "Your blood pressure readings are within standard baseline parameters. Continue regular tracking to maintain proactive cardiovascular wellness.",
      normalEvidence: "Average {avgSys}/{avgDia} mmHg across {count} logged readings"
    },
    sugar: {
      criticalHighTitle: "Critical Blood Glucose Elevation",
      criticalHighDesc: "Your logged blood glucose has exceeded 250 mg/dL. Severe hyperglycemia requires prompt medical review. Follow your prescribed clinical management plan.",
      criticalLowTitle: "Critical Hypoglycemia Alert",
      criticalLowDesc: "Your logged blood glucose dropped below 55 mg/dL. Severe hypoglycemia requires immediate fast-acting carbohydrate intake and medical guidance.",
      criticalEvidence: "Recent value: {latest} mg/dL (Range: {min}–{max} mg/dL across {count} logs)",
      elevatedTitle: "Elevated Blood Glucose Pattern",
      elevatedDesc: "Your logged blood sugar readings average above target baseline levels (>140 mg/dL). Logging meal context (fasting vs post-meal) and discussing with your physician can help tailor dietary management.",
      elevatedEvidence: "Average: {avg} mg/dL (Peak: {max} mg/dL, Latest: {latest} mg/dL over {count} logs)",
      lowTitle: "Low Blood Glucose Trend",
      lowDesc: "Your blood glucose readings are averaging below 70 mg/dL. Ensure regular meal intervals and review any anti-diabetic medication dosages with your care provider.",
      lowEvidence: "Average: {avg} mg/dL (Low: {min} mg/dL across {count} logs)",
      stableTitle: "Blood Glucose within Target Range",
      stableDesc: "Your logged blood glucose records demonstrate consistent glycemic management within the standard target range (70–130 mg/dL).",
      stableEvidence: "Average: {avg} mg/dL across {count} logged readings (Range: {min}–{max} mg/dL)"
    },
    adherence: {
      refillUrgentTitle: "Urgent Refill: {name}",
      refillUrgentDesc: "Only {remainingPills} dose(s) remain for {name} (~{daysLeft} day(s) supply left). Refill immediately to maintain uninterrupted therapeutic coverage.",
      refillUrgentEvidence: "{remainingPills} pills remaining ({daysLeft} days supply at {dailyDoses} dose(s)/day)",
      refillWarningTitle: "Refill Reminder: {name}",
      refillWarningDesc: "You have approximately {daysLeft} days of {name} remaining ({remainingPills} pills). Plan your pharmacy reorder soon.",
      refillWarningEvidence: "{remainingPills} pills remaining (~{daysLeft} days supply at {dailyDoses} dose(s)/day)",
      highTitle: "High Adherence for {name}",
      highDesc: "You have achieved a {adherencePct}% adherence rate for {name}. Consistent medication timing maximizes clinical effectiveness.",
      highEvidence: "{adherencePct}% adherence ({takenDoses} taken of {totalDoses} recorded doses)",
      lowTitle: "Missed Doses Detected for {name}",
      lowDesc: "Your adherence rate for {name} is currently {adherencePct}%. Missing scheduled doses may reduce treatment efficacy. Consider enabling medication alerts.",
      lowEvidence: "{adherencePct}% adherence ({missedDoses} missed out of {totalDoses} scheduled logs)"
    },
    lifestyle: {
      sleepTitle: "Sleep Duration & Daily Vitality Pattern",
      sleepDesc: "In your logged records, days with 7+ hours of sleep correlated with notably higher energy levels ({avgHighEnergy}/5) compared to days with less than 6 hours of sleep ({avgLowEnergy}/5).",
      sleepEvidence: "Energy averaged {avgHighEnergy}/5 on ≥7h sleep ({highSleepDays} days) vs {avgLowEnergy}/5 on <6h sleep ({lowSleepDays} days)",
      hydrationOptimalTitle: "Consistent Daily Hydration Intake",
      hydrationOptimalDesc: "You have maintained an average fluid intake of {avgWater}L per day across {count} logged check-ins, supporting metabolic and kidney health.",
      hydrationOptimalEvidence: "Average {avgWater}L/day recorded over your last {count} daily check-ins",
      hydrationLowTitle: "Hydration Intake Below Recommended Target",
      hydrationLowDesc: "Your recorded fluid intake averages {avgWater}L/day. Gradually increasing your water intake toward 2.0–2.5L daily can enhance daily energy and physical recovery.",
      hydrationLowEvidence: "Average {avgWater}L/day recorded across {count} daily check-ins"
    },
    streak: {
      title: "{streak}-Day Health Check-in Streak",
      desc: "You have consistently logged your health status for {streak} consecutive days. Regular tracking creates accurate baseline data for you and your care team.",
      evidence: "{streak} consecutive daily check-ins recorded (most recent on {lastDate})"
    }
  },
  copilot: {
    title: "Unified AI Health Copilot",
    subtitle: "Personal baseline modeling, 30-day trajectory forecasting & one-tap clinical appointment briefs",
    proBadge: "PRO COPILOT",
    disclaimer: "Pattern-based projection based on your recent trend, not a medical diagnosis.",
    tabs: {
      trajectory: "Trajectory Prediction",
      doctorBrief: "Doctor Visit Brief",
      whatIf: "What-If Simulator",
      familyDigest: "Family Digest"
    },
    trajectory: {
      title: "Biometric Trajectory & Risk Forecast",
      subtitle: "Extrapolates recent trends 4-5 weeks forward to catch potential stage crossings early",
      currentTrend: "Current Trend",
      projectedIn30Days: "30-Day Forecast",
      personalBaseline: "Personal Baseline (Mean ± SD)",
      sampleSize: "Readings Sample",
      confidence: "Model Confidence",
      thresholdAlert: "Clinical Stage Threshold Warning",
      weeksToThreshold: "Est. weeks to threshold if trend persists:",
      discussDoctor: "Discuss With Your Doctor",
      insufficientData: "Insufficient Historical Data",
      insufficientDesc: "At least 4–8 readings over several weeks are required to calculate a reliable mathematical trajectory.",
      logVitalsCta: "Log Biometric Vitals"
    },
    doctorBrief: {
      title: "One-Tap Doctor Visit Brief",
      subtitle: "Synthesizes recent vitals, adherence percentage, cross-correlations & questions for your physician",
      timeframeLabel: "Analysis Timeframe",
      generateBtn: "Generate Clinical Brief",
      generating: "Synthesizing Clinical Summary...",
      vitalsSection: "Vitals & Physiological Trends",
      medsSection: "Prescriptions & Adherence Integrity",
      symptomsSection: "Notable Symptoms & Daily Logs",
      correlationsSection: "Cross-Variable Correlation Highlights",
      questionsSection: "Suggested Questions For Your Doctor",
      shareCareCircle: "Share with Care Circle",
      exportPdf: "Export / Print PDF",
      roiFraming: "Identifying trends like this early may help avoid more serious complications later — discuss with your doctor."
    },
    paywall: {
      title: "Unlock DHealora Health Copilot",
      description: "Upgrade to access personalized trajectory forecasting, cross-variable correlation discovery, and one-tap clinical summaries.",
      unlockBtn: "Enable Health Copilot",
      liveSampleLabel: "Live Preview With Your Real Data"
    }
  }
};

