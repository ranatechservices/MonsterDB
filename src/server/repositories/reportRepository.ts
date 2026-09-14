import { isPgActive, queryPg } from '../db/postgres';
import { dbEngine } from '../db';

export interface MedicalReportRecord {
  id: string;
  user_id: string;
  title: string;
  category: string;
  report_date: string;
  lab_name?: string;
  doctor_name?: string;
  status: 'pending' | 'processing' | 'analyzed' | 'failed';
  attention_level: 'LOW_CONCERN' | 'MODERATE_ATTENTION' | 'HIGH_ATTENTION' | 'URGENT_MEDICAL_REVIEW';
  ai_summary?: string;
  ai_summary_hi?: string;
  raw_extracted_text?: string;
  doctor_reviewed: boolean;
  doctor_notes?: string;
  language_pref: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface ReportFileRecord {
  id: string;
  report_id: string;
  user_id: string;
  storage_key: string;
  original_filename: string;
  mime_type: string;
  file_size_bytes: number;
  checksum_sha256?: string;
  storage_provider: string;
  file_data_base64?: string;
  is_deleted: boolean;
  created_at: string;
}

export interface ReportParameterRecord {
  id: string;
  report_id: string;
  user_id: string;
  test_name: string;
  test_name_clean: string;
  category?: string;
  result_numeric?: number;
  result_text: string;
  unit?: string;
  reference_range_raw?: string;
  reference_min?: number;
  reference_max?: number;
  status: 'normal' | 'low' | 'high' | 'critical_low' | 'critical_high' | 'abnormal';
  source_panel?: string;
  confidence?: number;
  plain_language_explanation?: string;
  plain_language_explanation_hi?: string;
  created_at: string;
}

export interface ReportAnalysisRecord {
  id: string;
  report_id: string;
  user_id: string;
  report_summary: string;
  report_summary_hi?: string;
  attention_level: string;
  normal_findings_count: number;
  abnormal_findings_count: number;
  safety_notes: string[];
  missing_information: string[];
  disclaimer: string;
  analysis_json: any;
  model_version?: string;
  created_at: string;
}

export interface ReportFindingRecord {
  id: string;
  report_id: string;
  user_id: string;
  finding_type: 'normal' | 'abnormal' | 'critical' | 'potential_condition';
  title: string;
  title_hi?: string;
  description: string;
  description_hi?: string;
  severity: 'normal' | 'watch' | 'discuss_with_doctor' | 'seek_prompt_care' | 'urgent';
  related_biomarkers?: string[];
  precautions?: string[];
  created_at: string;
}

export interface ReportQuestionRecord {
  id: string;
  report_id: string;
  user_id: string;
  question_order: number;
  question_text: string;
  question_text_hi?: string;
  category?: string;
  importance?: string;
  answers?: ReportQuestionAnswerRecord[];
  created_at: string;
}

export interface ReportQuestionAnswerRecord {
  id: string;
  question_id: string;
  report_id: string;
  educational_answer: string;
  educational_answer_hi?: string;
  disclaimer_label?: string;
  created_at: string;
}

export interface CareRecommendationRecord {
  id: string;
  report_id: string;
  user_id: string;
  category: 'diet' | 'lifestyle' | 'follow_up' | 'medication_vigilance' | 'diagnostic';
  title: string;
  title_hi?: string;
  description: string;
  description_hi?: string;
  urgency: 'routine' | 'timely' | 'prompt' | 'urgent';
  source_context?: string;
  created_at: string;
}

export interface ReportTrendRecord {
  id: string;
  user_id: string;
  test_name_clean: string;
  report_id: string;
  report_date: string;
  numeric_value: number;
  unit?: string;
  status?: string;
  trend_direction?: string;
  created_at: string;
}

export class ReportRepository {
  // --- REPORTS ---
  public static async createReport(data: {
    id?: string;
    user_id: string;
    title: string;
    category?: string;
    report_date?: string;
    lab_name?: string;
    doctor_name?: string;
    status?: 'pending' | 'processing' | 'analyzed' | 'failed';
    attention_level?: 'LOW_CONCERN' | 'MODERATE_ATTENTION' | 'HIGH_ATTENTION' | 'URGENT_MEDICAL_REVIEW';
    ai_summary?: string;
    ai_summary_hi?: string;
    raw_extracted_text?: string;
    language_pref?: string;
  }): Promise<MedicalReportRecord> {
    const id = data.id || `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const date = data.report_date || now.split('T')[0];

    if (isPgActive()) {
      const rows = await queryPg<MedicalReportRecord>(
        `INSERT INTO medical_reports (
          id, user_id, title, category, report_date, lab_name, doctor_name,
          status, attention_level, ai_summary, ai_summary_hi, raw_extracted_text,
          language_pref, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *`,
        [
          id,
          data.user_id,
          data.title,
          data.category || 'blood',
          date,
          data.lab_name || null,
          data.doctor_name || null,
          data.status || 'pending',
          data.attention_level || 'LOW_CONCERN',
          data.ai_summary || null,
          data.ai_summary_hi || null,
          data.raw_extracted_text || null,
          data.language_pref || 'en',
          now,
          now
        ]
      );
      return rows[0];
    }

    const db = dbEngine.getRaw() as any;
    if (!db.medical_reports) db.medical_reports = [];

    const record: MedicalReportRecord = {
      id,
      user_id: data.user_id,
      title: data.title,
      category: data.category || 'blood',
      report_date: date,
      lab_name: data.lab_name,
      doctor_name: data.doctor_name,
      status: data.status || 'pending',
      attention_level: data.attention_level || 'LOW_CONCERN',
      ai_summary: data.ai_summary,
      ai_summary_hi: data.ai_summary_hi,
      raw_extracted_text: data.raw_extracted_text,
      doctor_reviewed: false,
      language_pref: data.language_pref || 'en',
      created_at: now,
      updated_at: now,
      deleted_at: null
    };

    db.medical_reports.unshift(record);
    dbEngine.save();
    return record;
  }

  public static async getReportsByUserId(userId: string): Promise<MedicalReportRecord[]> {
    if (isPgActive()) {
      return await queryPg<MedicalReportRecord>(
        'SELECT * FROM medical_reports WHERE user_id = $1 AND deleted_at IS NULL ORDER BY report_date DESC, created_at DESC',
        [userId]
      );
    }

    const db = dbEngine.getRaw() as any;
    const list = db.medical_reports || [];
    return list.filter((r: any) => r.user_id === userId && !r.deleted_at);
  }

  public static async getReportById(id: string, userId?: string): Promise<MedicalReportRecord | null> {
    if (isPgActive()) {
      const sql = userId
        ? 'SELECT * FROM medical_reports WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL LIMIT 1'
        : 'SELECT * FROM medical_reports WHERE id = $1 AND deleted_at IS NULL LIMIT 1';
      const params = userId ? [id, userId] : [id];
      const rows = await queryPg<MedicalReportRecord>(sql, params);
      return rows[0] || null;
    }

    const db = dbEngine.getRaw() as any;
    const list = db.medical_reports || [];
    const report = list.find((r: any) => r.id === id && (!userId || r.user_id === userId) && !r.deleted_at);
    return report || null;
  }

  public static async updateReport(id: string, data: Partial<MedicalReportRecord>): Promise<MedicalReportRecord | null> {
    const now = new Date().toISOString();

    if (isPgActive()) {
      const keys = Object.keys(data).filter(k => k !== 'id' && k !== 'created_at');
      if (keys.length === 0) return await this.getReportById(id);

      const setClauses = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
      const values = keys.map(k => (data as any)[k]);

      const rows = await queryPg<MedicalReportRecord>(
        `UPDATE medical_reports SET ${setClauses}, updated_at = '${now}' WHERE id = $1 RETURNING *`,
        [id, ...values]
      );
      return rows[0] || null;
    }

    const db = dbEngine.getRaw() as any;
    const list = db.medical_reports || [];
    const report = list.find((r: any) => r.id === id && !r.deleted_at);
    if (!report) return null;

    Object.assign(report, data, { updated_at: now });
    dbEngine.save();
    return report;
  }

  public static async softDeleteReport(id: string, userId: string): Promise<boolean> {
    const now = new Date().toISOString();

    if (isPgActive()) {
      const rows = await queryPg(
        'UPDATE medical_reports SET deleted_at = $1 WHERE id = $2 AND user_id = $3 RETURNING id',
        [now, id, userId]
      );
      return rows.length > 0;
    }

    const db = dbEngine.getRaw() as any;
    const list = db.medical_reports || [];
    const report = list.find((r: any) => r.id === id && r.user_id === userId && !r.deleted_at);
    if (!report) return false;

    report.deleted_at = now;
    dbEngine.save();
    return true;
  }

  // --- REPORT FILES ---
  public static async saveReportFile(data: {
    report_id: string;
    user_id: string;
    storage_key: string;
    original_filename: string;
    mime_type: string;
    file_size_bytes: number;
    checksum_sha256?: string;
    file_data_base64?: string;
  }): Promise<ReportFileRecord> {
    const id = `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    if (isPgActive()) {
      const rows = await queryPg<ReportFileRecord>(
        `INSERT INTO report_files (
          id, report_id, user_id, storage_key, original_filename,
          mime_type, file_size_bytes, checksum_sha256, file_data_base64, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          id, data.report_id, data.user_id, data.storage_key, data.original_filename,
          data.mime_type, data.file_size_bytes, data.checksum_sha256 || null,
          data.file_data_base64 || null, now
        ]
      );
      return rows[0];
    }

    const db = dbEngine.getRaw() as any;
    if (!db.report_files) db.report_files = [];

    const record: ReportFileRecord = {
      id,
      report_id: data.report_id,
      user_id: data.user_id,
      storage_key: data.storage_key,
      original_filename: data.original_filename,
      mime_type: data.mime_type,
      file_size_bytes: data.file_size_bytes,
      checksum_sha256: data.checksum_sha256,
      storage_provider: 'local_secure',
      file_data_base64: data.file_data_base64,
      is_deleted: false,
      created_at: now
    };

    db.report_files.push(record);
    dbEngine.save();
    return record;
  }

  public static async getReportFile(reportId: string, userId?: string): Promise<ReportFileRecord | null> {
    if (isPgActive()) {
      const sql = userId
        ? 'SELECT * FROM report_files WHERE report_id = $1 AND user_id = $2 AND is_deleted = false LIMIT 1'
        : 'SELECT * FROM report_files WHERE report_id = $1 AND is_deleted = false LIMIT 1';
      const params = userId ? [reportId, userId] : [reportId];
      const rows = await queryPg<ReportFileRecord>(sql, params);
      return rows[0] || null;
    }

    const db = dbEngine.getRaw() as any;
    const list = db.report_files || [];
    return list.find((f: any) => f.report_id === reportId && (!userId || f.user_id === userId) && !f.is_deleted) || null;
  }

  // --- REPORT PARAMETERS ---
  public static async saveParameters(parameters: Array<Omit<ReportParameterRecord, 'id' | 'created_at'>>): Promise<ReportParameterRecord[]> {
    if (!parameters || parameters.length === 0) return [];
    const now = new Date().toISOString();

    const prepared = parameters.map(p => ({
      ...p,
      id: `param_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      created_at: now
    }));

    if (isPgActive()) {
      const results: ReportParameterRecord[] = [];
      for (const item of prepared) {
        const rows = await queryPg<ReportParameterRecord>(
          `INSERT INTO report_parameters (
            id, report_id, user_id, test_name, test_name_clean, category,
            result_numeric, result_text, unit, reference_range_raw,
            reference_min, reference_max, status, source_panel, confidence,
            plain_language_explanation, plain_language_explanation_hi, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
          RETURNING *`,
          [
            item.id, item.report_id, item.user_id, item.test_name, item.test_name_clean, item.category || 'general',
            item.result_numeric ?? null, item.result_text, item.unit || null, item.reference_range_raw || null,
            item.reference_min ?? null, item.reference_max ?? null, item.status || 'normal', item.source_panel || 'General',
            item.confidence ?? 0.95, item.plain_language_explanation || null, item.plain_language_explanation_hi || null, now
          ]
        );
        if (rows[0]) results.push(rows[0]);
      }
      return results;
    }

    const db = dbEngine.getRaw() as any;
    if (!db.report_parameters) db.report_parameters = [];
    db.report_parameters.push(...prepared);
    dbEngine.save();
    return prepared as ReportParameterRecord[];
  }

  public static async getParametersByReportId(reportId: string): Promise<ReportParameterRecord[]> {
    if (isPgActive()) {
      return await queryPg<ReportParameterRecord>(
        'SELECT * FROM report_parameters WHERE report_id = $1 ORDER BY created_at ASC',
        [reportId]
      );
    }

    const db = dbEngine.getRaw() as any;
    const list = db.report_parameters || [];
    return list.filter((p: any) => p.report_id === reportId);
  }

  // --- REPORT ANALYSIS ---
  public static async saveAnalysis(data: Omit<ReportAnalysisRecord, 'id' | 'created_at'>): Promise<ReportAnalysisRecord> {
    const id = `ana_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    if (isPgActive()) {
      const rows = await queryPg<ReportAnalysisRecord>(
        `INSERT INTO report_analysis (
          id, report_id, user_id, report_summary, report_summary_hi, attention_level,
          normal_findings_count, abnormal_findings_count, safety_notes, missing_information,
          disclaimer, analysis_json, model_version, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *`,
        [
          id, data.report_id, data.user_id, data.report_summary, data.report_summary_hi || null,
          data.attention_level, data.normal_findings_count, data.abnormal_findings_count,
          JSON.stringify(data.safety_notes || []), JSON.stringify(data.missing_information || []),
          data.disclaimer, JSON.stringify(data.analysis_json || {}), data.model_version || 'gemini-2.5-flash', now
        ]
      );
      return rows[0];
    }

    const db = dbEngine.getRaw() as any;
    if (!db.report_analysis) db.report_analysis = [];

    const record: ReportAnalysisRecord = {
      id,
      report_id: data.report_id,
      user_id: data.user_id,
      report_summary: data.report_summary,
      report_summary_hi: data.report_summary_hi,
      attention_level: data.attention_level,
      normal_findings_count: data.normal_findings_count,
      abnormal_findings_count: data.abnormal_findings_count,
      safety_notes: data.safety_notes || [],
      missing_information: data.missing_information || [],
      disclaimer: data.disclaimer,
      analysis_json: data.analysis_json,
      model_version: data.model_version || 'gemini-2.5-flash',
      created_at: now
    };

    db.report_analysis.push(record);
    dbEngine.save();
    return record;
  }

  public static async getAnalysisByReportId(reportId: string): Promise<ReportAnalysisRecord | null> {
    if (isPgActive()) {
      const rows = await queryPg<ReportAnalysisRecord>(
        'SELECT * FROM report_analysis WHERE report_id = $1 ORDER BY created_at DESC LIMIT 1',
        [reportId]
      );
      return rows[0] || null;
    }

    const db = dbEngine.getRaw() as any;
    const list = db.report_analysis || [];
    return list.find((a: any) => a.report_id === reportId) || null;
  }

  // --- REPORT FINDINGS ---
  public static async saveFindings(findings: Array<Omit<ReportFindingRecord, 'id' | 'created_at'>>): Promise<ReportFindingRecord[]> {
    if (!findings || findings.length === 0) return [];
    const now = new Date().toISOString();

    const prepared = findings.map(f => ({
      ...f,
      id: `fnd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      created_at: now
    }));

    if (isPgActive()) {
      const results: ReportFindingRecord[] = [];
      for (const item of prepared) {
        const rows = await queryPg<ReportFindingRecord>(
          `INSERT INTO report_findings (
            id, report_id, user_id, finding_type, title, title_hi, description,
            description_hi, severity, related_biomarkers, precautions, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING *`,
          [
            item.id, item.report_id, item.user_id, item.finding_type, item.title, item.title_hi || null,
            item.description, item.description_hi || null, item.severity || 'watch',
            JSON.stringify(item.related_biomarkers || []), JSON.stringify(item.precautions || []), now
          ]
        );
        if (rows[0]) results.push(rows[0]);
      }
      return results;
    }

    const db = dbEngine.getRaw() as any;
    if (!db.report_findings) db.report_findings = [];
    db.report_findings.push(...prepared);
    dbEngine.save();
    return prepared as ReportFindingRecord[];
  }

  public static async getFindingsByReportId(reportId: string): Promise<ReportFindingRecord[]> {
    if (isPgActive()) {
      return await queryPg<ReportFindingRecord>(
        'SELECT * FROM report_findings WHERE report_id = $1 ORDER BY created_at ASC',
        [reportId]
      );
    }

    const db = dbEngine.getRaw() as any;
    const list = db.report_findings || [];
    return list.filter((f: any) => f.report_id === reportId);
  }

  // --- REPORT QUESTIONS & EDUCATIONAL ANSWERS ---
  public static async saveQuestionsAndAnswers(
    items: Array<{
      question_text: string;
      question_text_hi?: string;
      category?: string;
      importance?: string;
      educational_answer: string;
      educational_answer_hi?: string;
    }>,
    reportId: string,
    userId: string
  ): Promise<ReportQuestionRecord[]> {
    if (!items || items.length === 0) return [];
    const now = new Date().toISOString();
    const results: ReportQuestionRecord[] = [];

    let order = 1;
    for (const item of items) {
      const qId = `q_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const ansId = `ans_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      const questionRecord: ReportQuestionRecord = {
        id: qId,
        report_id: reportId,
        user_id: userId,
        question_order: order++,
        question_text: item.question_text,
        question_text_hi: item.question_text_hi,
        category: item.category || 'General Follow-up',
        importance: item.importance || 'recommended',
        created_at: now
      };

      const answerRecord: ReportQuestionAnswerRecord = {
        id: ansId,
        question_id: qId,
        report_id: reportId,
        educational_answer: item.educational_answer,
        educational_answer_hi: item.educational_answer_hi,
        disclaimer_label: 'Educational information only - consult your doctor',
        created_at: now
      };

      questionRecord.answers = [answerRecord];

      if (isPgActive()) {
        await queryPg(
          `INSERT INTO report_questions (id, report_id, user_id, question_order, question_text, question_text_hi, category, importance, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [qId, reportId, userId, questionRecord.question_order, questionRecord.question_text, questionRecord.question_text_hi || null, questionRecord.category, questionRecord.importance, now]
        );

        await queryPg(
          `INSERT INTO report_question_answers (id, question_id, report_id, educational_answer, educational_answer_hi, disclaimer_label, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [ansId, qId, reportId, answerRecord.educational_answer, answerRecord.educational_answer_hi || null, answerRecord.disclaimer_label, now]
        );
      } else {
        const db = dbEngine.getRaw() as any;
        if (!db.report_questions) db.report_questions = [];
        if (!db.report_question_answers) db.report_question_answers = [];

        db.report_questions.push(questionRecord);
        db.report_question_answers.push(answerRecord);
        dbEngine.save();
      }

      results.push(questionRecord);
    }

    return results;
  }

  public static async getQuestionsByReportId(reportId: string): Promise<ReportQuestionRecord[]> {
    if (isPgActive()) {
      const questions = await queryPg<ReportQuestionRecord>(
        'SELECT * FROM report_questions WHERE report_id = $1 ORDER BY question_order ASC',
        [reportId]
      );
      const answers = await queryPg<ReportQuestionAnswerRecord>(
        'SELECT * FROM report_question_answers WHERE report_id = $1',
        [reportId]
      );

      return questions.map(q => ({
        ...q,
        answers: answers.filter(a => a.question_id === q.id)
      }));
    }

    const db = dbEngine.getRaw() as any;
    const questions = (db.report_questions || []).filter((q: any) => q.report_id === reportId);
    const answers = (db.report_question_answers || []).filter((a: any) => a.report_id === reportId);

    return questions.map((q: any) => ({
      ...q,
      answers: answers.filter((a: any) => a.question_id === q.id)
    }));
  }

  // --- CARE RECOMMENDATIONS ---
  public static async saveRecommendations(
    recommendations: Array<Omit<CareRecommendationRecord, 'id' | 'created_at'>>
  ): Promise<CareRecommendationRecord[]> {
    if (!recommendations || recommendations.length === 0) return [];
    const now = new Date().toISOString();

    const prepared = recommendations.map(r => ({
      ...r,
      id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      created_at: now
    }));

    if (isPgActive()) {
      const results: CareRecommendationRecord[] = [];
      for (const item of prepared) {
        const rows = await queryPg<CareRecommendationRecord>(
          `INSERT INTO care_recommendations (
            id, report_id, user_id, category, title, title_hi, description,
            description_hi, urgency, source_context, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING *`,
          [
            item.id, item.report_id, item.user_id, item.category, item.title, item.title_hi || null,
            item.description, item.description_hi || null, item.urgency || 'routine',
            item.source_context || 'Health Profile', now
          ]
        );
        if (rows[0]) results.push(rows[0]);
      }
      return results;
    }

    const db = dbEngine.getRaw() as any;
    if (!db.care_recommendations) db.care_recommendations = [];
    db.care_recommendations.push(...prepared);
    dbEngine.save();
    return prepared as CareRecommendationRecord[];
  }

  public static async getRecommendationsByReportId(reportId: string): Promise<CareRecommendationRecord[]> {
    if (isPgActive()) {
      return await queryPg<CareRecommendationRecord>(
        'SELECT * FROM care_recommendations WHERE report_id = $1 ORDER BY created_at ASC',
        [reportId]
      );
    }

    const db = dbEngine.getRaw() as any;
    const list = db.care_recommendations || [];
    return list.filter((r: any) => r.report_id === reportId);
  }

  // --- REPORT TRENDS ---
  public static async saveTrends(trends: Array<Omit<ReportTrendRecord, 'id' | 'created_at'>>): Promise<ReportTrendRecord[]> {
    if (!trends || trends.length === 0) return [];
    const now = new Date().toISOString();

    const prepared = trends.map(t => ({
      ...t,
      id: `tr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      created_at: now
    }));

    if (isPgActive()) {
      const results: ReportTrendRecord[] = [];
      for (const item of prepared) {
        const rows = await queryPg<ReportTrendRecord>(
          `INSERT INTO report_trends (
            id, user_id, test_name_clean, report_id, report_date,
            numeric_value, unit, status, trend_direction, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING *`,
          [
            item.id, item.user_id, item.test_name_clean, item.report_id, item.report_date,
            item.numeric_value, item.unit || null, item.status || null, item.trend_direction || 'stable', now
          ]
        );
        if (rows[0]) results.push(rows[0]);
      }
      return results;
    }

    const db = dbEngine.getRaw() as any;
    if (!db.report_trends) db.report_trends = [];
    db.report_trends.push(...prepared);
    dbEngine.save();
    return prepared as ReportTrendRecord[];
  }

  public static async getTrendsByUserId(userId: string, testNameClean?: string): Promise<ReportTrendRecord[]> {
    if (isPgActive()) {
      if (testNameClean) {
        return await queryPg<ReportTrendRecord>(
          'SELECT * FROM report_trends WHERE user_id = $1 AND LOWER(test_name_clean) = LOWER($2) ORDER BY report_date ASC',
          [userId, testNameClean]
        );
      }
      return await queryPg<ReportTrendRecord>(
        'SELECT * FROM report_trends WHERE user_id = $1 ORDER BY test_name_clean ASC, report_date ASC',
        [userId]
      );
    }

    const db = dbEngine.getRaw() as any;
    const list = db.report_trends || [];
    return list.filter((t: any) => t.user_id === userId && (!testNameClean || t.test_name_clean.toLowerCase() === testNameClean.toLowerCase()))
      .sort((a: any, b: any) => new Date(a.report_date).getTime() - new Date(b.report_date).getTime());
  }

  // Aggregate full report bundle
  public static async getFullReportBundle(reportId: string, userId?: string) {
    const report = await this.getReportById(reportId, userId);
    if (!report) return null;

    const [file, parameters, analysis, findings, questions, recommendations, trends] = await Promise.all([
      this.getReportFile(reportId, userId),
      this.getParametersByReportId(reportId),
      this.getAnalysisByReportId(reportId),
      this.getFindingsByReportId(reportId),
      this.getQuestionsByReportId(reportId),
      this.getRecommendationsByReportId(reportId),
      this.getTrendsByUserId(report.user_id)
    ]);

    // Omit massive file_data_base64 from general bundle response to prevent oversized payloads & fetch timeouts
    const sanitizedFile = file ? {
      id: file.id,
      report_id: file.report_id,
      original_filename: file.original_filename,
      mime_type: file.mime_type,
      file_size_bytes: file.file_size_bytes,
      storage_key: file.storage_key,
      created_at: file.created_at
    } : null;

    return {
      report,
      file: sanitizedFile,
      parameters: parameters || [],
      analysis: analysis || null,
      findings: findings || [],
      questions: questions || [],
      recommendations: recommendations || [],
      trends: trends || []
    };
  }
}
