import { isPgActive, queryPg } from '../db/postgres';
import { unifiedStore } from './unifiedStore';

export interface VitalRecord {
  id: string;
  user_id: string;
  patient_id?: string;
  type: 'bp' | 'sugar' | 'heartRate' | 'spo2' | 'temperature' | 'weight';
  value: number;
  systolic?: number;
  diastolic?: number;
  unit: string;
  timestamp: string;
  status?: 'normal' | 'elevated' | 'critical' | 'low';
  notes?: string;
  created_at: string;
}

export class VitalsRepository {
  async listByUserId(userId: string, type?: string, limit: number = 100): Promise<VitalRecord[]> {
    if (isPgActive()) {
      try {
        let query = `SELECT * FROM vitals WHERE user_id = $1`;
        const params: any[] = [userId];
        if (type) {
          params.push(type);
          query += ` AND type = $2`;
        }
        query += ` ORDER BY timestamp DESC LIMIT $${params.length + 1}`;
        params.push(limit);
        return await queryPg<VitalRecord>(query, params);
      } catch (err) {
        console.warn('[VitalsRepository.listByUserId] Fallback:', err);
      }
    }
    let list = unifiedStore.getTable<VitalRecord>('vitals').filter(v => v.user_id === userId);
    if (type) list = list.filter(v => v.type === type);
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, limit);
  }

  async create(vital: Omit<VitalRecord, 'id' | 'created_at'> & { id?: string; created_at?: string }): Promise<VitalRecord> {
    const now = new Date().toISOString();
    const id = vital.id || 'vit_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    
    // Determine status if not provided
    let status = vital.status || 'normal';
    if (!vital.status) {
      if (vital.type === 'bp' && vital.systolic && vital.diastolic) {
        if (vital.systolic >= 140 || vital.diastolic >= 90) status = 'elevated';
        else if (vital.systolic >= 160 || vital.diastolic >= 100) status = 'critical';
        else if (vital.systolic < 90 || vital.diastolic < 60) status = 'low';
        else status = 'normal';
      } else if (vital.type === 'sugar') {
        if (vital.value > 140) status = 'elevated';
        else if (vital.value > 200) status = 'critical';
        else if (vital.value < 70) status = 'low';
        else status = 'normal';
      } else if (vital.type === 'spo2') {
        if (vital.value < 90) status = 'critical';
        else if (vital.value < 95) status = 'low';
        else status = 'normal';
      } else if (vital.type === 'heartRate') {
        if (vital.value > 100) status = 'elevated';
        else if (vital.value < 60) status = 'low';
        else status = 'normal';
      }
    }

    const record: VitalRecord = {
      id,
      user_id: vital.user_id,
      patient_id: vital.patient_id,
      type: vital.type,
      value: Number(vital.value),
      systolic: vital.systolic ? Number(vital.systolic) : undefined,
      diastolic: vital.diastolic ? Number(vital.diastolic) : undefined,
      unit: vital.unit,
      timestamp: vital.timestamp || now,
      status,
      notes: vital.notes,
      created_at: vital.created_at || now
    };

    if (isPgActive()) {
      try {
        await queryPg(
          `INSERT INTO vitals (id, user_id, patient_id, type, value, systolic, diastolic, unit, timestamp, status, notes, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [record.id, record.user_id, record.patient_id || null, record.type, record.value, record.systolic || null, record.diastolic || null, record.unit, record.timestamp, record.status, record.notes || null, record.created_at]
        );
      } catch (err) {
        console.warn('[VitalsRepository.create] PG error:', err);
      }
    }

    const list = unifiedStore.getTable<VitalRecord>('vitals');
    list.unshift(record);
    unifiedStore.updateTable('vitals', list);
    return record;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    if (isPgActive()) {
      try {
        await queryPg(`DELETE FROM vitals WHERE id = $1 AND user_id = $2`, [id, userId]);
      } catch (err) {
        console.warn('[VitalsRepository.delete] PG error:', err);
      }
    }
    const list = unifiedStore.getTable<VitalRecord>('vitals');
    const idx = list.findIndex(v => v.id === id && v.user_id === userId);
    if (idx === -1) return false;
    list.splice(idx, 1);
    unifiedStore.updateTable('vitals', list);
    return true;
  }
}

export const vitalsRepository = new VitalsRepository();
