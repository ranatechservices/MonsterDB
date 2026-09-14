import { isPgActive, queryPg } from '../db/postgres';
import { unifiedStore } from './unifiedStore';

export interface ReportSourceRecord {
  id: string;
  user_id: string;
  report_id?: string;
  source_name: string;
  source_type: 'LAB_REPORT' | 'CLINICAL_NOTE' | 'WEARABLE_SYNC' | 'USER_LOGGED' | 'DOCTOR_PRESCRIPTION';
  facility_name?: string;
  verified_by_doctor: boolean;
  created_at: string;
}

export interface HealthEvidenceLinkRecord {
  id: string;
  user_id: string;
  target_type: 'finding' | 'question' | 'recommendation' | 'timeline_event' | 'doctor_brief' | 'followup';
  target_id: string;
  source_type: 'report_parameter' | 'vital' | 'medicine' | 'daily_checkin' | 'doctor_note' | 'lab_report';
  source_id: string;
  confidence: number;
  supporting_excerpt: string;
  clinical_rationale?: string;
  created_at: string;
}

export class EvidenceRepository {
  async listByUserId(userId: string): Promise<HealthEvidenceLinkRecord[]> {
    if (isPgActive()) {
      try {
        return await queryPg<HealthEvidenceLinkRecord>(
          `SELECT * FROM health_evidence_links WHERE user_id = $1 ORDER BY created_at DESC`,
          [userId]
        );
      } catch (err) {
        console.warn('[EvidenceRepository.listByUserId] Fallback:', err);
      }
    }
    return unifiedStore.getTable<HealthEvidenceLinkRecord>('health_evidence_links')
      .filter(e => e.user_id === userId);
  }

  async findByTarget(userId: string, targetType: string, targetId: string): Promise<HealthEvidenceLinkRecord[]> {
    if (isPgActive()) {
      try {
        return await queryPg<HealthEvidenceLinkRecord>(
          `SELECT * FROM health_evidence_links WHERE user_id = $1 AND target_type = $2 AND target_id = $3`,
          [userId, targetType, targetId]
        );
      } catch (err) {
        console.warn('[EvidenceRepository.findByTarget] Fallback:', err);
      }
    }
    return unifiedStore.getTable<HealthEvidenceLinkRecord>('health_evidence_links')
      .filter(e => e.user_id === userId && e.target_type === targetType && e.target_id === targetId);
  }

  async create(data: Omit<HealthEvidenceLinkRecord, 'id' | 'created_at'> & { id?: string }): Promise<HealthEvidenceLinkRecord> {
    const now = new Date().toISOString();
    const id = data.id || 'ev_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const link: HealthEvidenceLinkRecord = {
      id,
      user_id: data.user_id,
      target_type: data.target_type,
      target_id: data.target_id,
      source_type: data.source_type,
      source_id: data.source_id,
      confidence: data.confidence || 0.95,
      supporting_excerpt: data.supporting_excerpt,
      clinical_rationale: data.clinical_rationale,
      created_at: now
    };

    if (isPgActive()) {
      try {
        await queryPg(
          `INSERT INTO health_evidence_links (id, user_id, target_type, target_id, source_type, source_id, confidence, supporting_excerpt, clinical_rationale, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [link.id, link.user_id, link.target_type, link.target_id, link.source_type, link.source_id, link.confidence, link.supporting_excerpt, link.clinical_rationale || null, link.created_at]
        );
      } catch (err) {
        console.warn('[EvidenceRepository.create] PG error:', err);
      }
    }

    const list = unifiedStore.getTable<HealthEvidenceLinkRecord>('health_evidence_links');
    list.unshift(link);
    unifiedStore.updateTable('health_evidence_links', list);
    return link;
  }
}

export const evidenceRepository = new EvidenceRepository();
