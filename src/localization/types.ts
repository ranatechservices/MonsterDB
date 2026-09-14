export type Language = 'en' | 'hi';

export interface Translations {
  appName: string;
  tagline: string;
  nav: {
    dashboard: string;
    vitals: string;
    medicines: string;
    reports: string;
    chat: string;
    checkIn?: string;
    appointments: string;
    healthTwin: string;
    copilot?: string;
    insights: string;
    careCircle: string;
    emergencySos: string;
    emergencySOS?: string;
    settings: string;
    adminPanel: string;
    doctorBooking: string;
    marketplace: string;
  };
  dashboard: {
    greeting: string;
    welcome?: string;
    quickStats: string;
    vitalsOverview: string;
    medicineReminder: string;
    todaysMeds?: string;
    recentReports?: string;
    upcomingAppointments: string;
    upcomingConsults?: string;
    askHealora: string;
    recordVitals: string;
    logSymptoms: string;
    emergencyButton: string;
  };
  common: {
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    add: string;
    search: string;
    loading: string;
    status: string;
    actions: string;
    viewAll: string;
    close: string;
    confirm: string;
    success: string;
    error: string;
  };
  insights: {
    header: { title: string; subtitle: string; refresh: string };
    summary: { active: string; urgent: string; observations: string; positive: string };
    criticalBanner: { title: string; description: string };
    error: { title: string; retry: string };
    empty: {
      title: string; description: string;
      vitalsCardTitle: string; vitalsCardDesc: string;
      medsCardTitle: string; medsCardDesc: string;
      checkinsCardTitle: string; checkinsCardDesc: string;
      loggedReadings: string; loggedMedicines: string; loggedCheckins: string;
      logVitals: string; addMedication: string; completeCheckIn: string;
    };
    disclaimer: string;
    evidenceLabel: string;
    evidenceFallback: string;
    severity: { critical: string; warning: string; positive: string; info: string };
    categories: { cardiovascular: string; metabolic: string; prescriptionSchedule: string; lifestyle: string; general: string };
    bp: {
      criticalTitle: string; criticalDesc: string; criticalEvidence: string;
      hypotensionTitle: string; hypotensionDesc: string; hypotensionEvidence: string;
      elevatedTitle: string; elevatedDesc: string; elevatedEvidence: string;
      improvementTitle: string; improvementDesc: string; improvementEvidence: string;
      optimalTitle: string; optimalDesc: string; optimalEvidence: string;
      normalTitle: string; normalDesc: string; normalEvidence: string;
    };
    sugar: {
      criticalHighTitle: string; criticalHighDesc: string;
      criticalLowTitle: string; criticalLowDesc: string; criticalEvidence: string;
      elevatedTitle: string; elevatedDesc: string; elevatedEvidence: string;
      lowTitle: string; lowDesc: string; lowEvidence: string;
      stableTitle: string; stableDesc: string; stableEvidence: string;
    };
    adherence: {
      refillUrgentTitle: string; refillUrgentDesc: string; refillUrgentEvidence: string;
      refillWarningTitle: string; refillWarningDesc: string; refillWarningEvidence: string;
      highTitle: string; highDesc: string; highEvidence: string;
      lowTitle: string; lowDesc: string; lowEvidence: string;
    };
    lifestyle: {
      sleepTitle: string; sleepDesc: string; sleepEvidence: string;
      hydrationOptimalTitle: string; hydrationOptimalDesc: string; hydrationOptimalEvidence: string;
      hydrationLowTitle: string; hydrationLowDesc: string; hydrationLowEvidence: string;
    };
    streak: { title: string; desc: string; evidence: string };
  };
  copilot: {
    title: string;
    subtitle: string;
    proBadge: string;
    disclaimer: string;
    tabs: {
      trajectory: string;
      doctorBrief: string;
      whatIf: string;
      familyDigest: string;
    };
    trajectory: {
      title: string;
      subtitle: string;
      currentTrend: string;
      projectedIn30Days: string;
      personalBaseline: string;
      sampleSize: string;
      confidence: string;
      thresholdAlert: string;
      weeksToThreshold: string;
      discussDoctor: string;
      insufficientData: string;
      insufficientDesc: string;
      logVitalsCta: string;
    };
    doctorBrief: {
      title: string;
      subtitle: string;
      timeframeLabel: string;
      generateBtn: string;
      generating: string;
      vitalsSection: string;
      medsSection: string;
      symptomsSection: string;
      correlationsSection: string;
      questionsSection: string;
      shareCareCircle: string;
      exportPdf: string;
      roiFraming: string;
    };
    paywall: {
      title: string;
      description: string;
      unlockBtn: string;
      liveSampleLabel: string;
    };
  };
}
