import dataManager from './dataManagement';
import { User, VitalRecord, Medicine, LabReport } from '../types';

export function buildUserHealthContext(user?: User | null): string {
  const sections: string[] = [];

  // 1. Patient demographics
  const demographics: string[] = [];
  if (user?.name) demographics.push(`Name: ${user.name}`);
  if (user?.gender) demographics.push(`Gender: ${user.gender}`);
  if (user?.bloodGroup) demographics.push(`Blood Group: ${user.bloodGroup}`);
  if (user?.dob) demographics.push(`DOB: ${user.dob}`);

  if (demographics.length > 0) {
    sections.push(`[PATIENT DEMOGRAPHICS]\n${demographics.join(', ')}`);
  }

  // 2. Recent Vitals Summary (Latest readings for each vital type)
  const vitals: VitalRecord[] = dataManager.getVitals();
  if (vitals && vitals.length > 0) {
    // Sort descending by timestamp
    const sorted = [...vitals].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    // Group latest by type
    const byType = new Map<string, VitalRecord[]>();
    for (const v of sorted) {
      const list = byType.get(v.type) || [];
      if (list.length < 3) {
        list.push(v);
        byType.set(v.type, list);
      }
    }

    const vitalsLines: string[] = [];
    byType.forEach((records, type) => {
      const recStrings = records.map(r => {
        const date = r.timestamp ? new Date(r.timestamp).toLocaleDateString() : 'recent';
        if (type === 'bp' && r.systolic !== undefined && r.diastolic !== undefined) {
          return `${r.systolic}/${r.diastolic} mmHg (${r.status || 'recorded'} on ${date})`;
        }
        return `${r.value} ${r.unit} (${r.status || 'recorded'} on ${date})`;
      });
      vitalsLines.push(`• ${type.toUpperCase()}: ${recStrings.join(' | ')}`);
    });

    if (vitalsLines.length > 0) {
      sections.push(`[RECENT VITALS TELEMETRY]\n${vitalsLines.join('\n')}`);
    }
  } else {
    sections.push(`[RECENT VITALS TELEMETRY]\nNo vitals recorded in system yet.`);
  }

  // 3. Active Medications
  const medicines: Medicine[] = dataManager.getMedicines();
  if (medicines && medicines.length > 0) {
    const medLines = medicines.map(m => {
      const times = m.timings && m.timings.length > 0 ? ` [${m.timings.join(', ')}]` : '';
      const meal = m.mealTiming ? ` (${m.mealTiming.replace('_', ' ')})` : '';
      const pillCount = m.remainingPills !== undefined ? ` • ${m.remainingPills} pills remaining` : '';
      return `• ${m.name} - ${m.dosage}, ${m.frequency.replace('_', ' ')}${meal}${times}${pillCount}`;
    });
    sections.push(`[ACTIVE MEDICATIONS REGIMEN]\n${medLines.join('\n')}`);
  } else {
    sections.push(`[ACTIVE MEDICATIONS REGIMEN]\nNo active medications recorded.`);
  }

  // 4. Most Recent Lab Report
  const reports: LabReport[] = dataManager.getReports();
  if (reports && reports.length > 0) {
    const latest = reports[0];
    const reportInfo: string[] = [
      `Title: ${latest.title} (${latest.category || 'general'}) on ${latest.date || 'recent'}`,
    ];
    if (latest.aiSummary) {
      reportInfo.push(`Clinical AI Summary: ${latest.aiSummary}`);
    }
    if (latest.anomaliesDetected && latest.anomaliesDetected.length > 0) {
      reportInfo.push(`Anomalies/Flags: ${latest.anomaliesDetected.join('; ')}`);
    }
    if (latest.keyFindings && latest.keyFindings.length > 0) {
      reportInfo.push(`Key Findings: ${latest.keyFindings.join('; ')}`);
    }
    sections.push(`[MOST RECENT LAB REPORT]\n${reportInfo.join('\n')}`);
  }

  return sections.join('\n\n');
}

export function generatePersonalizedSuggestions(user?: User | null): string[] {
  const suggestions: string[] = [];
  const vitals = dataManager.getVitals();
  const medicines = dataManager.getMedicines();
  const reports = dataManager.getReports();

  // 1. Check medicine questions
  if (medicines && medicines.length > 0) {
    const firstMed = medicines[0];
    suggestions.push(`When should I take ${firstMed.name}?`);
  }

  // 2. Check vitals
  if (vitals && vitals.length > 0) {
    const bpRecord = vitals.find(v => v.type === 'bp');
    if (bpRecord && bpRecord.systolic && bpRecord.diastolic) {
      suggestions.push(`Explain my BP reading (${bpRecord.systolic}/${bpRecord.diastolic} mmHg)`);
    } else {
      const sugarRecord = vitals.find(v => v.type === 'sugar');
      if (sugarRecord) {
        suggestions.push(`Is my blood sugar of ${sugarRecord.value} ${sugarRecord.unit} normal?`);
      }
    }
  }

  // 3. Check lab reports
  if (reports && reports.length > 0) {
    const latest = reports[0];
    if (latest.anomaliesDetected && latest.anomaliesDetected.length > 0) {
      suggestions.push(`What does the anomaly in my ${latest.title} report mean?`);
    } else {
      suggestions.push(`Explain the results in my ${latest.title} report`);
    }
  }

  // 4. Default high-value clinical fallback suggestions if needed
  const fallbackList = [
    "What lifestyle changes help lower blood pressure?",
    "Diet tips for healthy metabolic balance",
    "How to manage morning fatigue and low energy?",
    "When should I get a routine blood test checkup?"
  ];

  for (const fallback of fallbackList) {
    if (suggestions.length >= 4) break;
    if (!suggestions.includes(fallback)) {
      suggestions.push(fallback);
    }
  }

  return suggestions.slice(0, 4);
}
