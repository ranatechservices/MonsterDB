import { isPgActive, queryPg } from '../db/postgres';
import { unifiedStore } from './unifiedStore';

export interface FollowupRecord {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  due_date: string;
  category: 'LAB_RETEST' | 'DOCTOR_VISIT' | 'MEDICATION_REFILL' | 'LIFESTYLE_GOAL' | 'VITAL_CHECK';
  status: 'UPCOMING' | 'DUE' | 'OVERDUE' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  evidence_source_type?: string;
  evidence_source_id?: string;
  completed_at?: string;
  completion_notes?: string;
  created_at: string;
  updated_at?: string;
}

export class FollowupRepository {
  async listByUserId(userId: string, status?: string): Promise<FollowupRecord[]> {
    if (isPgActive()) {
      try {
        let query = `SELECT * FROM followups WHERE user_id = $1`;
        const params: any[] = [userId];
        if (status) {
          params.push(status);
          query += ` AND status = $2`;
        }
        query += ` ORDER BY due_date ASC`;
        return await queryPg<FollowupRecord>(query, params);
      } catch (err) {
        console.warn('[FollowupRepository.listByUserId] Fallback:', err);
      }
    }
    const today = new Date().toISOString().split('T')[0];
    let list = unifiedStore.getTable<FollowupRecord>('followups')
      .filter(f => f.user_id === userId);

    // Auto-update status for overdue
    list.forEach(f => {
      if (f.status === 'UPCOMING' && f.due_date < today) {
        f.status = 'OVERDUE';
      } else if (f.status === 'UPCOMING' && f.due_date === today) {
        f.status = 'DUE';
      }
    });

    if (status) list = list.filter(f => f.status === status);
    return list.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
  }

  async findById(id: string, userId: string): Promise<FollowupRecord | null> {
    const list = await this.listByUserId(userId);
    return list.find(f => f.id === id) || null;
  }

  async create(data: Omit<FollowupRecord, 'id' | 'created_at'> & { id?: string }): Promise<FollowupRecord> {
    const now = new Date().toISOString();
    const id = data.id || 'fol_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const followup: FollowupRecord = {
      id,
      user_id: data.user_id,
      title: data.title,
      description: data.description,
      due_date: data.due_date,
      category: data.category || 'LAB_RETEST',
      status: data.status || 'UPCOMING',
      priority: data.priority || 'MEDIUM',
      evidence_source_type: data.evidence_source_type,
      evidence_source_id: data.evidence_source_id,
      created_at: now,
      updated_at: now
    };

    if (isPgActive()) {
      try {
        await queryPg(
          `INSERT INTO followups (id, user_id, title, description, due_date, category, status, priority, evidence_source_type, evidence_source_id, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [followup.id, followup.user_id, followup.title, followup.description || null, followup.due_date, followup.category, followup.status, followup.priority, followup.evidence_source_type || null, followup.evidence_source_id || null, followup.created_at, followup.updated_at]
        );
      } catch (err) {
        console.warn('[FollowupRepository.create] PG error:', err);
      }
    }

    const list = unifiedStore.getTable<FollowupRecord>('followups');
    list.unshift(followup);
    unifiedStore.updateTable('followups', list);
    return followup;
  }

  async update(id: string, userId: string, patch: Partial<FollowupRecord>): Promise<FollowupRecord | null> {
    const now = new Date().toISOString();
    const list = unifiedStore.getTable<FollowupRecord>('followups');
    const idx = list.findIndex(f => f.id === id && f.user_id === userId);
    if (idx === -1) return null;

    if (patch.status === 'COMPLETED' && !patch.completed_at) {
      patch.completed_at = now;
    }

    list[idx] = { ...list[idx], ...patch, updated_at: now };
    unifiedStore.updateTable('followups', list);
    return list[idx];
  }
}

export const followupRepository = new FollowupRepository();
