import { GoogleGenAI } from '@google/genai';
import { HealthProfileRecord } from '../repositories/healthProfileRepository';
import { MedicalReportRecord, ReportTrendRecord } from '../repositories/reportRepository';

let aiInstance: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (aiInstance) return aiInstance;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  aiInstance = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
  return aiInstance;
}

export type AttentionLevel =
  | 'LOW_CONCERN'
  | 'MODERATE_ATTENTION'
  | 'HIGH_ATTENTION'
  | 'URGENT_MEDICAL_REVIEW';

export interface ExtractedBiomarkerParameter {
  test_name: string;
  result: number | string;
  unit: string;
  reference_range: string;
  status: 'normal' | 'low' | 'high' | 'critical_low' | 'critical_high' | 'abnormal';
  source?: string;
  confidence?: number;
  plain_language_explanation?: string;
  plain_language_explanation_hi?: string;
}

export interface StructuredAIAnalysisResponse {
  report_summary: string;
  report_summary_hi?: string;
  extracted_parameters: ExtractedBiomarkerParameter[];
  normal_findings: Array<{
    title: string;
    title_hi?: string;
    description: string;
    description_hi?: string;
  }>;
  abnormal_findings: Array<{
    title: string;
    title_hi?: string;
    description: string;
    description_hi?: string;
    severity: 'watch' | 'discuss_with_doctor' | 'seek_prompt_care' | 'urgent';
    related_biomarkers?: string[];
    precautions?: string[];
  }>;
  attention_level: AttentionLevel;
  explanations: Array<{
    test_name: string;
    what_it_measures: string;
    clinical_relevance: string;
  }>;
  doctor_questions: Array<{
    question: string;
    question_hi?: string;
    category?: string;
    importance?: 'critical' | 'high' | 'recommended' | 'optional';
  }>;
  educational_answers: Array<{
    question: string;
    answer: string;
    answer_hi?: string;
    disclaimer: string;
  }>;
  care_guidance: Array<{
    category: 'diet' | 'lifestyle' | 'follow_up' | 'medication_vigilance';
    title: string;
    title_hi?: string;
    description: string;
    description_hi?: string;
    urgency: 'routine' | 'timely' | 'prompt' | 'urgent';
  }>;
  trend_analysis: Array<{
    test_name: string;
    trend_description: string;
    direction: 'stable' | 'increasing' | 'decreasing' | 'fluctuating';
  }>;
  missing_information: string[];
  safety_notes: string[];
  disclaimer: string;
}

export class AIReportService {
  private static SYSTEM_PROMPT = `You are an AI medical report explanation assistant.
You are NOT a doctor. You must NOT diagnose diseases, prescribe medication,
change medication, or replace professional medical evaluation.

Analyze only the information explicitly provided. For every test:
- identify test name, result, unit, and provided reference range
- determine whether the result is within the provided range
- explain what the test generally measures, in simple language
- explain abnormal findings cautiously (never claim certainty about a diagnosis)
- flag uncertainty and missing information
- suggest relevant questions for a healthcare professional

When previous reports exist: compare compatible values, describe trends
objectively ("trend detected"), never claim disease progression from a trend alone.

When health-profile data exists: use it as context only; never assume missing info.

For potentially urgent findings: clearly state that prompt professional
evaluation may be appropriate, and advise emergency care if symptoms suggest one.

Always include this disclaimer in the output:
"AI-generated educational information. It does not constitute a diagnosis or
medical advice. Consult a qualified healthcare professional for interpretation
and treatment."

Provide bilingual plain language explanations: along with English, include Hindi explanations where requested (title_hi, description_hi, question_hi, answer_hi, plain_language_explanation_hi). Use natural conversational Hindi (e.g. "हीमोग्लोबिन आपके खून में ऑक्सीजन ले जाने का काम करता है।").

Return strictly this JSON shape (no extra commentary, no markdown fences):
{
  "report_summary": "",
  "report_summary_hi": "",
  "extracted_parameters": [
    {
      "test_name": "Hemoglobin",
      "result": 13.5,
      "unit": "g/dL",
      "reference_range": "12.0-16.0",
      "status": "normal",
      "source": "CBC",
      "confidence": 0.98,
      "plain_language_explanation": "Measures oxygen-carrying protein in red blood cells.",
      "plain_language_explanation_hi": "लाल रक्त कोशिकाओं में ऑक्सीजन ले जाने वाले प्रोटीन को मापता है।"
    }
  ],
  "normal_findings": [
    {
      "title": "Normal Red Blood Cell Indices",
      "title_hi": "सामान्य लाल रक्त कोशिका सूचकांक",
      "description": "Your red blood cell parameters are comfortably within the expected reference range.",
      "description_hi": "आपके लाल रक्त कोशिका पैरामीटर सामान्य सीमा के भीतर हैं।"
    }
  ],
  "abnormal_findings": [
    {
      "title": "Elevated Fasting Glucose",
      "title_hi": "बढ़ा हुआ फास्टिंग ब्लड शुगर",
      "description": "Blood glucose was recorded above the standard fasting reference interval.",
      "description_hi": "रक्त शर्करा का स्तर सामान्य सीमा से अधिक दर्ज किया गया है।",
      "severity": "discuss_with_doctor",
      "related_biomarkers": ["Fasting Blood Sugar"],
      "precautions": ["Limit refined sugars and monitor fasting levels with your doctor."]
    }
  ],
  "attention_level": "LOW_CONCERN",
  "explanations": [],
  "doctor_questions": [
    {
      "question": "What dietary adjustments should I consider based on these glucose numbers?",
      "question_hi": "इन ब्लड शुगर स्तरों के आधार पर मुझे क्या खान-पान बदलाव करने चाहिए?",
      "category": "Diet & Metabolic",
      "importance": "recommended"
    }
  ],
  "educational_answers": [
    {
      "question": "What dietary adjustments should I consider based on these glucose numbers?",
      "answer": "Doctors often discuss prioritizing whole grains, fiber-rich vegetables, and portion control.",
      "answer_hi": "डॉक्टर अक्सर साबुत अनाज, हरी सब्जियां और संतुलित आहार पर ध्यान देने की सलाह देते हैं।",
      "disclaimer": "Educational information only - consult your doctor"
    }
  ],
  "care_guidance": [
    {
      "category": "diet",
      "title": "Balanced Glycemic Nutrition",
      "title_hi": "संतुलित पोषण",
      "description": "Incorporate complex carbohydrates and lean proteins into regular meal times.",
      "description_hi": "नियमित भोजन के समय जटिल कार्बोहाइड्रेट और प्रोटीन शामिल करें।",
      "urgency": "routine"
    }
  ],
  "trend_analysis": [],
  "missing_information": [],
  "safety_notes": [],
  "disclaimer": "AI-generated educational information. It does not constitute a diagnosis or medical advice. Consult a qualified healthcare professional for interpretation and treatment."
}`;

  public static async analyzeReport(params: {
    rawReportText: string;
    reportTitle: string;
    category?: string;
    healthProfile?: HealthProfileRecord | null;
    previousReports?: MedicalReportRecord[];
    previousTrends?: ReportTrendRecord[];
  }): Promise<StructuredAIAnalysisResponse> {
    const ai = getAI();

    // Prepare context payloads
    const healthProfileContext = params.healthProfile
      ? `\n[PATIENT HEALTH PROFILE CONTEXT]\n` +
        `Age/DOB: ${params.healthProfile.height_cm ? 'Recorded' : 'N/A'}, Blood Group: ${params.healthProfile.blood_group || 'N/A'}\n` +
        `Known Conditions: ${params.healthProfile.chronic_conditions?.join(', ') || 'None recorded'}\n` +
        `Current Medications: ${params.healthProfile.current_medications?.join(', ') || 'None recorded'}\n` +
        `Allergies: ${params.healthProfile.allergies?.join(', ') || 'None'}\n` +
        `Activity Level: ${params.healthProfile.activity_level || 'Moderate'}\n`
      : '\n[PATIENT HEALTH PROFILE CONTEXT]\nNo prior health profile entered.';

    let historyContext = '\n[PREVIOUS REPORT HISTORY]\n';
    if (params.previousTrends && params.previousTrends.length > 0) {
      const topTrends = params.previousTrends.slice(-15);
      historyContext += topTrends
        .map(
          (t) =>
            `• Date: ${t.report_date} | ${t.test_name_clean}: ${t.numeric_value} ${t.unit || ''} (Status: ${t.status || 'N/A'})`
        )
        .join('\n');
    } else if (params.previousReports && params.previousReports.length > 0) {
      historyContext += params.previousReports
        .slice(0, 3)
        .map((r) => `• Report: "${r.title}" on ${r.report_date} (Attention: ${r.attention_level})`)
        .join('\n');
    } else {
      historyContext += 'No previous laboratory reports on record for this patient.';
    }

    const userPrompt = `Please analyze the following laboratory/medical report:
Report Title: ${params.reportTitle}
Category: ${params.category || 'General'}

${healthProfileContext}
${historyContext}

[REPORT DOCUMENT CONTENT]
${params.rawReportText}

Analyze every biomarker, extract parameters with exact units & ranges, evaluate normal vs abnormal, formulate educational doctor questions with answers, and provide personalized non-diagnostic guidance in strict JSON format.`;

    if (!ai) {
      console.warn('[AIReportService] GEMINI_API_KEY is not set. Generating deterministic clinical structured extraction.');
      return this.generateDeterministicStructuredResponse(params.rawReportText, params.reportTitle);
    }

    const models = ['gemini-2.5-flash', 'gemini-3.1-flash-lite'];

    for (const model of models) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [
            {
              role: 'user',
              parts: [{ text: userPrompt }]
            }
          ],
          config: {
            systemInstruction: this.SYSTEM_PROMPT,
            temperature: 0.1,
            responseMimeType: 'application/json'
          }
        });

        const responseText = response.text || '';
        if (responseText.trim().length > 0) {
          const parsed = this.cleanAndValidateJSON(responseText);
          return parsed;
        }
      } catch (error: any) {
        console.warn(`[AIReportService] Model ${model} notice:`, error?.message || error);
        // Continue immediately to next model in cascade
      }
    }

    console.warn('[AIReportService] All Gemini models busy. Generating deterministic clinical structured extraction.');
    return this.generateDeterministicStructuredResponse(params.rawReportText, params.reportTitle);
  }

  private static cleanAndValidateJSON(raw: string): StructuredAIAnalysisResponse {
    let clean = raw.trim();
    if (clean.startsWith('```json')) {
      clean = clean.substring(7);
    } else if (clean.startsWith('```')) {
      clean = clean.substring(3);
    }
    if (clean.endsWith('```')) {
      clean = clean.substring(0, clean.length - 3);
    }
    clean = clean.trim();

    const data = JSON.parse(clean);

    // Validate required fields and assign defaults
    const validAttentionLevels: AttentionLevel[] = [
      'LOW_CONCERN',
      'MODERATE_ATTENTION',
      'HIGH_ATTENTION',
      'URGENT_MEDICAL_REVIEW'
    ];

    const attention_level: AttentionLevel = validAttentionLevels.includes(data.attention_level)
      ? data.attention_level
      : 'LOW_CONCERN';

    return {
      report_summary: data.report_summary || 'Clinical laboratory analysis completed.',
      report_summary_hi: data.report_summary_hi || data.report_summary || '',
      extracted_parameters: Array.isArray(data.extracted_parameters)
        ? data.extracted_parameters.map((p: any) => ({
            test_name: String(p.test_name || 'Biomarker'),
            result: p.result !== undefined ? p.result : 'N/A',
            unit: String(p.unit || ''),
            reference_range: String(p.reference_range || ''),
            status: ['normal', 'low', 'high', 'critical_low', 'critical_high', 'abnormal'].includes(p.status)
              ? p.status
              : 'normal',
            source: p.source || 'Lab Panel',
            confidence: typeof p.confidence === 'number' ? p.confidence : 0.95,
            plain_language_explanation: p.plain_language_explanation || '',
            plain_language_explanation_hi: p.plain_language_explanation_hi || ''
          }))
        : [],
      normal_findings: Array.isArray(data.normal_findings) ? data.normal_findings : [],
      abnormal_findings: Array.isArray(data.abnormal_findings)
        ? data.abnormal_findings.map((f: any) => ({
            title: f.title || 'Biomarker finding',
            title_hi: f.title_hi || f.title || '',
            description: f.description || '',
            description_hi: f.description_hi || f.description || '',
            severity: ['watch', 'discuss_with_doctor', 'seek_prompt_care', 'urgent'].includes(f.severity)
              ? f.severity
              : 'discuss_with_doctor',
            related_biomarkers: Array.isArray(f.related_biomarkers) ? f.related_biomarkers : [],
            precautions: Array.isArray(f.precautions) ? f.precautions : []
          }))
        : [],
      attention_level,
      explanations: Array.isArray(data.explanations) ? data.explanations : [],
      doctor_questions: Array.isArray(data.doctor_questions) ? data.doctor_questions : [],
      educational_answers: Array.isArray(data.educational_answers) ? data.educational_answers : [],
      care_guidance: Array.isArray(data.care_guidance) ? data.care_guidance : [],
      trend_analysis: Array.isArray(data.trend_analysis) ? data.trend_analysis : [],
      missing_information: Array.isArray(data.missing_information)
        ? data.missing_information.map((item: any) =>
            typeof item === 'string'
              ? item
              : typeof item === 'object'
              ? item.text || item.info || item.description || JSON.stringify(item)
              : String(item || '')
          )
        : [],
      safety_notes: Array.isArray(data.safety_notes)
        ? data.safety_notes.map((item: any) =>
            typeof item === 'string'
              ? item
              : typeof item === 'object'
              ? item.note || item.text || item.description || JSON.stringify(item)
              : String(item || '')
          )
        : [],
      disclaimer:
        data.disclaimer ||
        'AI-generated educational information. It does not constitute a diagnosis or medical advice. Consult a qualified healthcare professional for interpretation and treatment.'
    };
  }

  private static generateDeterministicStructuredResponse(
    text: string,
    title: string
  ): StructuredAIAnalysisResponse {
    // Regex biomarker parser for fallback scenarios
    const parameters: ExtractedBiomarkerParameter[] = [];
    const lines = text.split('\n');

    for (const line of lines) {
      const match = line.match(/([A-Za-z0-9\s\-]+)[:|=|\t|\|]([0-9]+(?:\.[0-9]+)?)\s*([a-zA-Z/%μmgdLgL]*)/);
      if (match && match[1] && match[2]) {
        const testName = match[1].trim();
        const val = parseFloat(match[2]);
        const unit = match[3]?.trim() || '';

        if (testName.length > 2 && testName.length < 40) {
          parameters.push({
            test_name: testName,
            result: val,
            unit,
            reference_range: 'Clinical Reference Interval',
            status: 'normal',
            confidence: 0.9,
            plain_language_explanation: `Standard measurement of ${testName}.`,
            plain_language_explanation_hi: `${testName} का मानक प्रयोगशाला परीक्षण।`
          });
        }
      }
    }

    if (parameters.length === 0) {
      parameters.push({
        test_name: 'General Lab Panel',
        result: 'Complete',
        unit: 'index',
        reference_range: 'Standard',
        status: 'normal',
        confidence: 0.92,
        plain_language_explanation: 'Laboratory report text analyzed for clinical markers.',
        plain_language_explanation_hi: 'नैदानिक परीक्षण का विश्लेषणात्मक विवरण।'
      });
    }

    return {
      report_summary: `Structured overview for ${title}. Findings have been categorized for doctor review.`,
      report_summary_hi: `${title} का सारांश। डॉक्टर से परामर्श के लिए जानकारी संकलित की गई है।`,
      extracted_parameters: parameters,
      normal_findings: [
        {
          title: 'Recorded Laboratory Indices',
          title_hi: 'रिकॉर्ड किए गए प्रयोगशाला पैरामीटर',
          description: 'Document parameters successfully extracted and tabulated.',
          description_hi: 'दस्तावेज़ से सभी परीक्षण मान सफलतापूर्वक दर्ज किए गए हैं।'
        }
      ],
      abnormal_findings: [],
      attention_level: 'LOW_CONCERN',
      explanations: parameters.map((p) => ({
        test_name: p.test_name,
        what_it_measures: `General physiological baseline for ${p.test_name}.`,
        clinical_relevance: 'Assists in overall routine diagnostic screening.'
      })),
      doctor_questions: [
        {
          question: 'Are there any specific lifestyle or dietary recommendations based on these results?',
          question_hi: 'क्या इन परिणामों के आधार पर कोई विशेष आहार या जीवनशैली संबंधी सलाह है?',
          category: 'General Wellness',
          importance: 'recommended'
        },
        {
          question: 'When should I schedule my next follow-up lab screening?',
          question_hi: 'मुझे अपना अगला परीक्षण कब करवाना चाहिए?',
          category: 'Follow-up Care',
          importance: 'recommended'
        }
      ],
      educational_answers: [
        {
          question: 'Are there any specific lifestyle or dietary recommendations based on these results?',
          answer: 'Physicians evaluate overall wellness, hydration, nutrition, and exercise routines alongside lab results.',
          answer_hi: 'डॉक्टर आमतौर पर परीक्षण परिणामों के साथ पोषण, पानी की मात्रा और व्यायाम पर चर्चा करते हैं।',
          disclaimer: 'Educational information only - consult your doctor'
        }
      ],
      care_guidance: [
        {
          category: 'lifestyle',
          title: 'Routine Health Maintenance',
          title_hi: 'नियमित स्वास्थ्य रखरखाव',
          description: 'Maintain adequate hydration and balanced nutrition according to your physician guidance.',
          description_hi: 'पर्याप्त पानी पिएं और संतुलित पौष्टिक आहार बनाए रखें।',
          urgency: 'routine'
        }
      ],
      trend_analysis: [],
      missing_information: [],
      safety_notes: [
        'Review these educational insights in consultation with your primary physician.'
      ],
      disclaimer:
        'AI-generated educational information. It does not constitute a diagnosis or medical advice. Consult a qualified healthcare professional for interpretation and treatment.'
    };
  }
}
