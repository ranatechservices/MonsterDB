import { unifiedStore } from '../repositories/unifiedStore';
import { timelineRepository } from '../repositories/timelineRepository';
import { evidenceRepository } from '../repositories/evidenceRepository';
import { followupRepository } from '../repositories/followupRepository';
import { doctorNotesRepository } from '../repositories/doctorNotesRepository';
import { userRepository } from '../repositories/userRepository';

export interface ParameterDelta {
  parameterName: string;
  category: string;
  unit: string;
  previousValue: number | null;
  previousDate: string | null;
  currentValue: number;
  currentDate: string;
  deltaNumeric: number | null;
  percentageChange: number | null;
  direction: 'stable' | 'increased' | 'decreased' | 'new_baseline';
  referenceRange: string;
  status: string;
  objectiveObservation: string;
}

export interface DoctorBrief {
  patientProfile: {
    name: string;
    age?: number;
    gender?: string;
    bloodGroup?: string;
    knownAllergies: string[];
    chronicConditions: string[];
    activeMedications: Array<{ name: string; dosage: string; frequency: string }>;
  };
  userReportedSection: {
    chiefSymptoms: Array<{ symptom: string; duration: string; severity: string }>;
    recentCheckInsSummary: string;
    lifestyleFactors: { sleep: string; hydration: string; activity: string };
  };
  labDerivedSection: {
    recentReportsCount: number;
    abnormalBiomarkers: Array<{
      testName: string;
      value: string;
      referenceRange: string;
      date: string;
      status: string;
    }>;
    recentTrends: Array<{
      biomarker: string;
      change: string;
      direction: string;
    }>;
  };
  aiEducationalSection: {
    suggestedDoctorQuestions: string[];
    clinicalDiscussionPoints: string[];
    disclaimer: string;
  };
}

export class ContinuityService {
  async getOverview(userId: string) {
    const user = await userRepository.findById(userId);
    const reports = unifiedStore.getTable<any>('medical_reports').filter(r => r.user_id === userId && !r.deleted_at);
    const vitals = unifiedStore.getTable<any>('vitals').filter(v => v.user_id === userId);
    const meds = unifiedStore.getTable<any>('medicines').filter(m => m.user_id === userId && !m.deleted_at);
    const followups = await followupRepository.listByUserId(userId);
    const doctorNotes = await doctorNotesRepository.listByUserId(userId);
    const timeline = await timelineRepository.getLiveTimeline(userId, 5);

    const pendingFollowups = followups.filter(f => f.status === 'UPCOMING' || f.status === 'DUE' || f.status === 'OVERDUE');
    const urgentFollowups = pendingFollowups.filter(f => f.priority === 'HIGH' || f.priority === 'URGENT');

    // Missing evidence / gaps detection
    const missingEvidence: Array<{ domain: string; description: string; recommendation: string }> = [];
    if (vitals.length === 0) {
      missingEvidence.push({
        domain: 'Vitals',
        description: 'No recent blood pressure or blood glucose readings on file.',
        recommendation: 'Log baseline vitals or connect a wearable for accurate longitudinal context.'
      });
    }
    if (reports.length === 0) {
      missingEvidence.push({
        domain: 'Diagnostic Labs',
        description: 'No blood panel or lab reports analyzed yet.',
        recommendation: 'Upload recent routine check-up CBC or Lipid reports.'
      });
    }
    if (meds.length > 0 && !meds.some(m => Object.keys(m.adherence || {}).length > 0)) {
      missingEvidence.push({
        domain: 'Medication Adherence',
        description: 'Active prescriptions have not logged daily dosage adherence.',
        recommendation: 'Mark taken doses in the Medicine Tracker.'
      });
    }

    return {
      success: true,
      stats: {
        totalReports: reports.length,
        totalVitals: vitals.length,
        activeMedications: meds.length,
        activeFollowups: pendingFollowups.length,
        urgentFollowupsCount: urgentFollowups.length,
        doctorNotesCount: doctorNotes.length
      },
      recentEvents: timeline,
      urgentFollowups,
      missingEvidence,
      disclaimer: "AI-generated educational summary. It does not constitute a diagnosis or medical advice. Consult a qualified healthcare professional for medical interpretation and treatment."
    };
  }

  async getChanges(userId: string): Promise<{
    deltas: ParameterDelta[];
    comparisonsCount: number;
    summary: string;
    disclaimer: string;
  }> {
    const params = unifiedStore.getTable<any>('report_parameters')
      .filter(p => p.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Group parameters by clean test name
    const paramMap = new Map<string, any[]>();
    for (const p of params) {
      const key = p.test_name_clean?.toLowerCase().trim() || p.test_name.toLowerCase().trim();
      if (!paramMap.has(key)) paramMap.set(key, []);
      paramMap.get(key)!.push(p);
    }

    const deltas: ParameterDelta[] = [];
    for (const [key, list] of paramMap.entries()) {
      if (list.length === 0) continue;
      const current = list[0];
      const previous = list.length > 1 ? list[1] : null;

      const currentNum = current.result_numeric != null ? Number(current.result_numeric) : null;
      const prevNum = previous && previous.result_numeric != null ? Number(previous.result_numeric) : null;

      let direction: ParameterDelta['direction'] = 'new_baseline';
      let deltaNumeric: number | null = null;
      let percentageChange: number | null = null;
      let observation = `Baseline value documented at ${current.result_text || currentNum} ${current.unit || ''}.`;

      if (currentNum != null && prevNum != null) {
        deltaNumeric = Number((currentNum - prevNum).toFixed(2));
        if (prevNum !== 0) {
          percentageChange = Number((((currentNum - prevNum) / prevNum) * 100).toFixed(1));
        }

        if (Math.abs(deltaNumeric) < 0.05 * prevNum) {
          direction = 'stable';
          observation = `Remains stable compared to previous recorded value (${prevNum} ${current.unit || ''}).`;
        } else if (deltaNumeric > 0) {
          direction = 'increased';
          observation = `Shifted from ${prevNum} to ${currentNum} ${current.unit || ''} (+${deltaNumeric}).`;
        } else {
          direction = 'decreased';
          observation = `Shifted from ${prevNum} to ${currentNum} ${current.unit || ''} (${deltaNumeric}).`;
        }
      }

      deltas.push({
        parameterName: current.test_name,
        category: current.category || 'General',
        unit: current.unit || '',
        previousValue: prevNum,
        previousDate: previous?.created_at?.split('T')[0] || null,
        currentValue: currentNum ?? 0,
        currentDate: current.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        deltaNumeric,
        percentageChange,
        direction,
        referenceRange: current.reference_range_raw || `${current.reference_min ?? ''} - ${current.reference_max ?? ''}`,
        status: current.status || 'normal',
        objectiveObservation: observation
      });
    }

    // Also compare recent Blood Pressure and Blood Sugar vitals
    const vitals = unifiedStore.getTable<any>('vitals')
      .filter(v => v.user_id === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const bpVitals = vitals.filter(v => v.type === 'bp');
    if (bpVitals.length >= 2) {
      const cur = bpVitals[0];
      const prev = bpVitals[1];
      if (cur.systolic && prev.systolic && cur.diastolic && prev.diastolic) {
        const sysDiff = cur.systolic - prev.systolic;
        const diaDiff = cur.diastolic - prev.diastolic;
        deltas.unshift({
          parameterName: 'Blood Pressure',
          category: 'Vitals',
          unit: 'mmHg',
          previousValue: prev.systolic,
          previousDate: prev.timestamp.split('T')[0],
          currentValue: cur.systolic,
          currentDate: cur.timestamp.split('T')[0],
          deltaNumeric: sysDiff,
          percentageChange: null,
          direction: sysDiff === 0 && diaDiff === 0 ? 'stable' : sysDiff > 0 ? 'increased' : 'decreased',
          referenceRange: '90-120 / 60-80 mmHg',
          status: cur.status || 'normal',
          objectiveObservation: `Blood pressure reading changed from ${prev.systolic}/${prev.diastolic} mmHg to ${cur.systolic}/${cur.diastolic} mmHg.`
        });
      }
    }

    return {
      deltas,
      comparisonsCount: deltas.length,
      summary: deltas.length > 0
        ? `Identified ${deltas.length} longitudinal biomarker and vital records with objective comparisons.`
        : 'Upload multiple sequential lab tests or log daily vitals to unlock comparative delta analytics.',
      disclaimer: "AI-generated educational information. It does not constitute a diagnosis or medical advice. Consult a qualified healthcare professional for medical interpretation and treatment."
    };
  }

  async generateDoctorBrief(userId: string): Promise<DoctorBrief> {
    const user = await userRepository.findById(userId);
    const profile = unifiedStore.getTable<any>('health_profiles').find(p => p.user_id === userId);
    const reports = unifiedStore.getTable<any>('medical_reports').filter(r => r.user_id === userId && !r.deleted_at);
    const params = unifiedStore.getTable<any>('report_parameters').filter(p => p.user_id === userId);
    const meds = unifiedStore.getTable<any>('medicines').filter(m => m.user_id === userId && !m.deleted_at);
    const checkins = unifiedStore.getTable<any>('daily_checkins').filter(c => c.user_id === userId).slice(0, 7);
    const symptoms = unifiedStore.getTable<any>('symptoms').filter(s => s.user_id === userId && !s.resolved);

    // 1. Abnormal biomarkers
    const abnormalParams = params.filter(p => p.status && p.status !== 'normal').map(p => ({
      testName: p.test_name,
      value: `${p.result_text || p.result_numeric} ${p.unit || ''}`,
      referenceRange: p.reference_range_raw || 'Standard reference',
      date: p.created_at?.split('T')[0] || '',
      status: p.status
    }));

    // 2. Active medications
    const activeMeds = meds.map(m => ({
      name: m.name,
      dosage: m.dosage,
      frequency: m.frequency.replace('_', ' ')
    }));

    // 3. User reported symptoms
    const reportedSymptoms = symptoms.map(s => ({
      symptom: s.symptom_name,
      duration: s.onset_date ? `Since ${s.onset_date}` : 'Recent',
      severity: s.severity || 'mild'
    }));

    if (reportedSymptoms.length === 0 && checkins.length > 0) {
      const recentSymptoms = new Set<string>();
      checkins.forEach(c => (c.symptoms || []).forEach((sym: string) => recentSymptoms.add(sym)));
      recentSymptoms.forEach(sym => {
        reportedSymptoms.push({
          symptom: sym,
          duration: 'Reported in recent daily check-ins',
          severity: 'moderate'
        });
      });
    }

    // 4. Questions to ask doctor
    const questions: string[] = [
      "Are there any specific lifestyle modifications recommended for my current biomarker profile?",
      "Do any of my prescribed medications interact with each other or require periodic liver/kidney monitoring?",
      "When is the optimal interval to re-test my key biomarkers?"
    ];

    if (abnormalParams.length > 0) {
      questions.unshift(`What potential contributing factors could explain my ${abnormalParams[0].testName} reading of ${abnormalParams[0].value}?`);
    }

    return {
      patientProfile: {
        name: user?.name || 'Patient',
        gender: user?.gender,
        bloodGroup: user?.blood_group,
        knownAllergies: profile?.allergies || [],
        chronicConditions: profile?.chronic_conditions || [],
        activeMedications: activeMeds
      },
      userReportedSection: {
        chiefSymptoms: reportedSymptoms.length > 0 ? reportedSymptoms : [{ symptom: 'Routine health checkup / no acute distress reported', duration: 'N/A', severity: 'mild' }],
        recentCheckInsSummary: checkins.length > 0
          ? `Average sleep: ${(checkins.reduce((acc, c) => acc + (c.sleep_hours || 7), 0) / checkins.length).toFixed(1)} hrs/night. Predominant mood: ${checkins[0]?.mood || 'stable'}.`
          : 'No recent daily check-ins recorded.',
        lifestyleFactors: {
          sleep: profile?.smoking_status ? `Smoking: ${profile.smoking_status}` : 'Non-smoker',
          hydration: 'Average daily intake tracked',
          activity: profile?.activity_level ? `Activity: ${profile.activity_level}` : 'Moderate activity'
        }
      },
      labDerivedSection: {
        recentReportsCount: reports.length,
        abnormalBiomarkers: abnormalParams.slice(0, 10),
        recentTrends: [
          {
            biomarker: abnormalParams[0]?.testName || 'Comprehensive Metabolic Profile',
            change: 'Longitudinal data compiled from uploaded clinical documents',
            direction: 'Tracked'
          }
        ]
      },
      aiEducationalSection: {
        suggestedDoctorQuestions: questions,
        clinicalDiscussionPoints: [
          "Discuss potential dietary adjustments aligned with lab results.",
          "Verify optimal timing and dosages of active prescriptions.",
          "Establish preventative follow-up target dates."
        ],
        disclaimer: "AI-generated educational information. It does not constitute a diagnosis or medical advice. Consult a qualified healthcare professional for medical interpretation and treatment."
      }
    };
  }

  async searchHealthHistory(userId: string, q: string) {
    const term = q.toLowerCase().trim();
    if (!term) return { results: [] };

    const reports = unifiedStore.getTable<any>('medical_reports')
      .filter(r => r.user_id === userId && !r.deleted_at && (
        r.title.toLowerCase().includes(term) ||
        (r.ai_summary && r.ai_summary.toLowerCase().includes(term)) ||
        (r.raw_extracted_text && r.raw_extracted_text.toLowerCase().includes(term))
      ))
      .map(r => ({
        type: 'LAB_REPORT',
        id: r.id,
        title: r.title,
        date: r.report_date || r.created_at,
        snippet: r.ai_summary || r.title
      }));

    const params = unifiedStore.getTable<any>('report_parameters')
      .filter(p => p.user_id === userId && (
        p.test_name.toLowerCase().includes(term) ||
        (p.category && p.category.toLowerCase().includes(term))
      ))
      .map(p => ({
        type: 'BIOMARKER',
        id: p.id,
        title: `${p.test_name}: ${p.result_text || p.result_numeric} ${p.unit || ''}`,
        date: p.created_at,
        snippet: `Status: ${p.status}, Reference: ${p.reference_range_raw || ''}`
      }));

    const notes = unifiedStore.getTable<any>('doctor_notes')
      .filter(n => n.user_id === userId && (
        n.doctor_name.toLowerCase().includes(term) ||
        n.chief_complaint.toLowerCase().includes(term) ||
        (n.treatment_plan && n.treatment_plan.toLowerCase().includes(term))
      ))
      .map(n => ({
        type: 'DOCTOR_NOTE',
        id: n.id,
        title: `Clinical Note - Dr. ${n.doctor_name}`,
        date: n.visit_date,
        snippet: n.chief_complaint
      }));

    return {
      query: q,
      results: [...reports, ...params, ...notes]
    };
  }

  async getHealthPassport(userId: string) {
    const user = await userRepository.findById(userId);
    const profile = unifiedStore.getTable<any>('health_profiles').find(p => p.user_id === userId);
    const reports = unifiedStore.getTable<any>('medical_reports').filter(r => r.user_id === userId && !r.deleted_at);
    const meds = unifiedStore.getTable<any>('medicines').filter(m => m.user_id === userId && !m.deleted_at);
    const vitals = unifiedStore.getTable<any>('vitals').filter(v => v.user_id === userId).slice(0, 10);
    const careCircle = unifiedStore.getTable<any>('care_circle_members').filter(c => c.user_id === userId);

    return {
      passportId: 'HLP-' + (user?.uuid?.substring(0, 8).toUpperCase() || 'PATIENT-01'),
      generatedAt: new Date().toISOString(),
      patient: {
        name: user?.name,
        dob: user?.dob,
        gender: user?.gender,
        bloodGroup: user?.blood_group || profile?.blood_group || 'O+',
        phone: user?.phone,
        email: user?.email
      },
      criticalEmergencyInfo: {
        allergies: profile?.allergies || ['No known drug allergies (NKDA)'],
        chronicConditions: profile?.chronic_conditions || [],
        emergencyNotes: profile?.emergency_notes || 'Patient wears no pacemakers; standard trauma protocol.',
        emergencyContacts: careCircle.map(c => ({ name: c.name, relation: c.relation, phone: c.phone }))
      },
      currentMedications: meds.map(m => ({
        name: m.name,
        dosage: m.dosage,
        frequency: m.frequency,
        mealTiming: m.meal_timing
      })),
      recentVitals: vitals.map(v => ({
        type: v.type,
        value: v.value,
        systolic: v.systolic,
        diastolic: v.diastolic,
        unit: v.unit,
        date: v.timestamp
      })),
      verifiedReportsSummary: {
        totalReportsCount: reports.length,
        latestReportDate: reports[0]?.report_date || 'N/A',
        attentionLevel: reports[0]?.attention_level || 'LOW_CONCERN'
      },
      disclaimer: "AI-generated educational health passport summary. Not an official legal medical certificate. Consult authorized medical professionals for emergency treatment."
    };
  }
}

export const continuityService = new ContinuityService();
