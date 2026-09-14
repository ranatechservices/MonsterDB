import { isPgActive, queryPg } from '../db/postgres';
import { unifiedStore } from './unifiedStore';

export interface MedicineRecord {
  id: string;
  user_id: string;
  patient_id?: string;
  name: string;
  dosage: string;
  frequency: 'daily' | 'twice_daily' | 'thrice_daily' | 'as_needed' | 'weekly';
  timings: string[];
  meal_timing: 'before_food' | 'after_food' | 'with_food' | 'anytime';
  start_date: string;
  end_date?: string;
  remaining_pills?: number;
  total_pills?: number;
  adherence?: Record<string, boolean>;
  notes?: string;
  created_at: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface MedicineEventRecord {
  id: string;
  medicine_id: string;
  user_id: string;
  scheduled_time: string;
  taken_at?: string;
  status: 'taken' | 'missed' | 'skipped';
  notes?: string;
  created_at: string;
}

export class MedicineRepository {
  async listByUserId(userId: string): Promise<MedicineRecord[]> {
    if (isPgActive()) {
      try {
        return await queryPg<MedicineRecord>(
          `SELECT * FROM medicines WHERE user_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC`,
          [userId]
        );
      } catch (err) {
        console.warn('[MedicineRepository.listByUserId] Fallback:', err);
      }
    }
    return unifiedStore.getTable<MedicineRecord>('medicines').filter(m => m.user_id === userId && !m.deleted_at);
  }

  async findById(id: string, userId: string): Promise<MedicineRecord | null> {
    if (isPgActive()) {
      try {
        const rows = await queryPg<MedicineRecord>(
          `SELECT * FROM medicines WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL LIMIT 1`,
          [id, userId]
        );
        return rows[0] || null;
      } catch (err) {
        console.warn('[MedicineRepository.findById] Fallback:', err);
      }
    }
    return unifiedStore.getTable<MedicineRecord>('medicines').find(m => m.id === id && m.user_id === userId && !m.deleted_at) || null;
  }

  async create(data: Partial<MedicineRecord> & { user_id: string; name: string; dosage: string }): Promise<MedicineRecord> {
    const now = new Date().toISOString();
    const id = data.id || 'med_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const med: MedicineRecord = {
      id,
      user_id: data.user_id,
      patient_id: data.patient_id,
      name: data.name,
      dosage: data.dosage,
      frequency: data.frequency || 'daily',
      timings: data.timings || ['08:00'],
      meal_timing: data.meal_timing || 'after_food',
      start_date: data.start_date || now.split('T')[0],
      end_date: data.end_date,
      remaining_pills: data.remaining_pills ?? 30,
      total_pills: data.total_pills ?? 30,
      adherence: data.adherence || {},
      notes: data.notes,
      created_at: now,
      updated_at: now
    };

    if (isPgActive()) {
      try {
        await queryPg(
          `INSERT INTO medicines (id, user_id, patient_id, name, dosage, frequency, timings, meal_timing, start_date, end_date, remaining_pills, total_pills, adherence, notes, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
          [med.id, med.user_id, med.patient_id || null, med.name, med.dosage, med.frequency, JSON.stringify(med.timings), med.meal_timing, med.start_date, med.end_date || null, med.remaining_pills, med.total_pills, JSON.stringify(med.adherence), med.notes || null, med.created_at, med.updated_at]
        );
      } catch (err) {
        console.warn('[MedicineRepository.create] PG error:', err);
      }
    }

    const list = unifiedStore.getTable<MedicineRecord>('medicines');
    list.unshift(med);
    unifiedStore.updateTable('medicines', list);
    return med;
  }

  async update(id: string, userId: string, patch: Partial<MedicineRecord>): Promise<MedicineRecord | null> {
    const now = new Date().toISOString();
    const list = unifiedStore.getTable<MedicineRecord>('medicines');
    const idx = list.findIndex(m => m.id === id && m.user_id === userId);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...patch, updated_at: now };
    unifiedStore.updateTable('medicines', list);
    return list[idx];
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const list = unifiedStore.getTable<MedicineRecord>('medicines');
    const idx = list.findIndex(m => m.id === id && m.user_id === userId);
    if (idx === -1) return false;
    list[idx].deleted_at = new Date().toISOString();
    unifiedStore.updateTable('medicines', list);
    return true;
  }

  async logEvent(event: Omit<MedicineEventRecord, 'id' | 'created_at'>): Promise<MedicineEventRecord> {
    const now = new Date().toISOString();
    const id = 'mev_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const rec: MedicineEventRecord = {
      id,
      medicine_id: event.medicine_id,
      user_id: event.user_id,
      scheduled_time: event.scheduled_time,
      taken_at: event.taken_at || now,
      status: event.status,
      notes: event.notes,
      created_at: now
    };

    const events = unifiedStore.getTable<MedicineEventRecord>('medicine_events');
    events.unshift(rec);
    unifiedStore.updateTable('medicine_events', events);
    return rec;
  }
}

export const medicineRepository = new MedicineRepository();
