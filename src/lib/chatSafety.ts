// Clinical triage and safety trigger detector for Healora Chat

export type UrgentSignalSeverity = 'emergency' | 'concerning';

export interface UrgentSignalResult {
  level: UrgentSignalSeverity | null;
  matchedCategory?: string;
  adviceMessage?: string;
}

const EMERGENCY_PATTERNS: Array<{ category: string; regex: RegExp; advice: string }> = [
  {
    category: 'Cardiac & Chest Pain',
    regex: /\b(chest pain|chest pressure|heart attack|crushing chest|radiating to (arm|jaw|back)|tightness in chest|angina)\b/i,
    advice: 'Possible cardiac event or acute coronary symptoms. Call 112/911 or proceed to the nearest Emergency Room immediately.'
  },
  {
    category: 'Respiratory Distress',
    regex: /\b(can'?t breathe|cannot breathe|severe shortness of breath|gasping for air|suffocating|throat closing|blue lips|asphyxia)\b/i,
    advice: 'Acute respiratory distress detected. Seek urgent emergency airway support immediately.'
  },
  {
    category: 'Stroke & Neurological Emergency',
    regex: /\b(stroke|face droop|facial drooping|slurred speech|sudden weakness (in|on) (arm|leg|side)|sudden paralysis|thunderclap headache)\b/i,
    advice: 'Potential acute stroke symptoms (FAST signs). Emergency neurological evaluation required within minutes.'
  },
  {
    category: 'Severe Bleeding & Hemorrhage',
    regex: /\b(uncontrolled bleed|heavy bleeding|vomiting blood|coughing (up )?blood|hemorrhage|arterial bleed)\b/i,
    advice: 'Acute active hemorrhage requires urgent hospital trauma intervention.'
  },
  {
    category: 'Anaphylaxis & Severe Allergic Shock',
    regex: /\b(anaphylaxis|allergic shock|swollen tongue|epipen needed|throat swelling shut)\b/i,
    advice: 'Severe anaphylactic emergency. Administer epinephrine if prescribed and call emergency medical services immediately.'
  },
  {
    category: 'Loss of Consciousness & Seizures',
    regex: /\b(unconscious|passed out|fainted and not waking|active seizure|grand mal|convulsing)\b/i,
    advice: 'Acute altered mental status or seizure. Immediate emergency care is required.'
  },
  {
    category: 'Mental Health Crisis & Self Harm',
    regex: /\b(kill myself|suicide|suicidal|end my life|want to die|self harm|overdose on pills)\b/i,
    advice: 'If you are in distress, immediate confidential support is available 24/7. Call emergency services or the Suicide & Crisis Lifeline (e.g. Tele-MANAS 14416 in India or 988 in the US).'
  }
];

const CONCERNING_PATTERNS: Array<{ category: string; regex: RegExp; advice: string }> = [
  {
    category: 'High Glycemic / Sugar Fluctuation',
    regex: /\b(sugar (is |level )?(over|>)? ?(300|350|400|500)|severe hypoglyc|blood sugar (dropped to|is) ?(40|50))\b/i,
    advice: 'Significant blood glucose anomaly. Monitor closely and consult your endocrinologist or physician promptly.'
  },
  {
    category: 'Severe Hypertension',
    regex: /\b(bp (is |level )?(over|>)? ?(180|190|200)|blood pressure 180|hypertensive)\b/i,
    advice: 'Marked blood pressure elevation. Rest quietly and verify reading; contact healthcare provider if persistent.'
  },
  {
    category: 'High Persistent Fever',
    regex: /\b(fever (over |above |>)? ?(103|104)|fever for (5|6|7) days|rigors|shivering high fever)\b/i,
    advice: 'High or protracted pyrexia. Comprehensive clinical evaluation and diagnostic workup recommended.'
  },
  {
    category: 'Acute Abdominal Pain',
    regex: /\b(severe stomach pain|acute abdomen|appendix pain|vomiting for 2 days|cannot keep liquids down)\b/i,
    advice: 'Acute abdominal distress. A physician assessment is strongly recommended to rule out acute pathology.'
  },
  {
    category: 'Cardiovascular Palpitations',
    regex: /\b(heart racing over 140|irregular pulse|tachycardia with dizziness|fluttering heart)\b/i,
    advice: 'Cardiac arrhythmia or persistent tachycardia warrants formal ECG evaluation by a cardiologist.'
  }
];

export function detectUrgentSignal(text: string): UrgentSignalResult {
  if (!text || typeof text !== 'string') {
    return { level: null };
  }

  // 1. First check Emergency patterns
  for (const item of EMERGENCY_PATTERNS) {
    if (item.regex.test(text)) {
      return {
        level: 'emergency',
        matchedCategory: item.category,
        adviceMessage: item.advice
      };
    }
  }

  // 2. Check Concerning patterns
  for (const item of CONCERNING_PATTERNS) {
    if (item.regex.test(text)) {
      return {
        level: 'concerning',
        matchedCategory: item.category,
        adviceMessage: item.advice
      };
    }
  }

  return { level: null };
}
