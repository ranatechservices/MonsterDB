import { isPgActive, queryPg } from '../db/postgres';
import { dbEngine } from '../db';

export interface AnalysisJobRecord {
  id: string;
  report_id: string;
  user_id: string;
  status:
    | 'queued'
    | 'uploading'
    | 'reading'
    | 'extracting'
    | 'validating'
    | 'analyzing'
    | 'comparing_ranges'
    | 'checking_history'
    | 'generating_explanation'
    | 'preparing_questions'
    | 'finalizing'
    | 'completed'
    | 'failed';
  progress_percentage: number;
  current_step: string;
  error_message?: string | null;
  retry_count: number;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export class AnalysisJobRepository {
  public static async createJob(data: {
    report_id: string;
    user_id: string;
    status?: AnalysisJobRecord['status'];
    current_step?: string;
  }): Promise<AnalysisJobRecord> {
    const id = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const record: AnalysisJobRecord = {
      id,
      report_id: data.report_id,
      user_id: data.user_id,
      status: data.status || 'queued',
      progress_percentage: 5,
      current_step: data.current_step || 'Job queued for clinical AI analysis',
      error_message: null,
      retry_count: 0,
      started_at: now,
      created_at: now,
      updated_at: now
    };

    if (isPgActive()) {
      const rows = await queryPg<AnalysisJobRecord>(
        `INSERT INTO analysis_jobs (
          id, report_id, user_id, status, progress_percentage,
          current_step, error_message, retry_count, started_at, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
        [
          record.id, record.report_id, record.user_id, record.status, record.progress_percentage,
          record.current_step, record.error_message, record.retry_count, record.started_at,
          record.created_at, record.updated_at
        ]
      );
      return rows[0] || record;
    }

    const db = dbEngine.getRaw() as any;
    if (!db.analysis_jobs) db.analysis_jobs = [];
    db.analysis_jobs.push(record);
    dbEngine.save();
    return record;
  }

  public static async updateJob(
    id: string,
    updates: Partial<AnalysisJobRecord>
  ): Promise<AnalysisJobRecord | null> {
    const now = new Date().toISOString();

    if (isPgActive()) {
      const keys = Object.keys(updates).filter(k => k !== 'id' && k !== 'created_at');
      if (keys.length === 0) return await this.getJobById(id);

      const setClauses = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
      const values = keys.map(k => (updates as any)[k]);

      const rows = await queryPg<AnalysisJobRecord>(
        `UPDATE analysis_jobs SET ${setClauses}, updated_at = '${now}' WHERE id = $1 RETURNING *`,
        [id, ...values]
      );
      return rows[0] || null;
    }

    const db = dbEngine.getRaw() as any;
    const list = db.analysis_jobs || [];
    const job = list.find((j: any) => j.id === id);
    if (!job) return null;

    Object.assign(job, updates, { updated_at: now });
    dbEngine.save();
    return job;
  }

  public static async getJobById(id: string, userId?: string): Promise<AnalysisJobRecord | null> {
    if (isPgActive()) {
      const sql = userId
        ? 'SELECT * FROM analysis_jobs WHERE id = $1 AND user_id = $2 LIMIT 1'
        : 'SELECT * FROM analysis_jobs WHERE id = $1 LIMIT 1';
      const params = userId ? [id, userId] : [id];
      const rows = await queryPg<AnalysisJobRecord>(sql, params);
      return rows[0] || null;
    }

    const db = dbEngine.getRaw() as any;
    const list = db.analysis_jobs || [];
    return list.find((j: any) => j.id === id && (!userId || j.user_id === userId)) || null;
  }

  public static async getLatestJobForReport(reportId: string, userId?: string): Promise<AnalysisJobRecord | null> {
    if (isPgActive()) {
      const sql = userId
        ? 'SELECT * FROM analysis_jobs WHERE report_id = $1 AND user_id = $2 ORDER BY created_at DESC LIMIT 1'
        : 'SELECT * FROM analysis_jobs WHERE report_id = $1 ORDER BY created_at DESC LIMIT 1';
      const params = userId ? [reportId, userId] : [reportId];
      const rows = await queryPg<AnalysisJobRecord>(sql, params);
      return rows[0] || null;
    }

    const db = dbEngine.getRaw() as any;
    const list = db.analysis_jobs || [];
    const jobs = list.filter((j: any) => j.report_id === reportId && (!userId || j.user_id === userId));
    return jobs.length > 0 ? jobs[jobs.length - 1] : null;
  }
}
