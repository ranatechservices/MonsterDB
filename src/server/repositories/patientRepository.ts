import { isPgActive, queryPg } from '../db/postgres';
import { unifiedStore } from './unifiedStore';

export interface PatientRecord {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  blood_group?: string;
  gender?: string;
  dob?: string;
  onboarding_completed: boolean;
  status: 'Active' | 'Suspended';
  created_at: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export class PatientRepository {
  async findByUserId(userId: string): Promise<PatientRecord | null> {
    if (isPgActive()) {
      try {
        const rows = await queryPg<PatientRecord>(
          `SELECT * FROM patients WHERE user_id = $1 AND deleted_at IS NULL LIMIT 1`,
          [userId]
        );
        return rows[0] || null;
      } catch (err) {
        console.warn('[PatientRepository.findByUserId] Fallback:', err);
      }
    }
    return unifiedStore.getTable<PatientRecord>('patients').find(p => p.user_id === userId && !p.deleted_at) || null;
  }

  async findById(id: string): Promise<PatientRecord | null> {
    if (isPgActive()) {
      try {
        const rows = await queryPg<PatientRecord>(
          `SELECT * FROM patients WHERE id = $1 AND deleted_at IS NULL LIMIT 1`,
          [id]
        );
        return rows[0] || null;
      } catch (err) {
        console.warn('[PatientRepository.findById] Fallback:', err);
      }
    }
    return unifiedStore.getTable<PatientRecord>('patients').find(p => p.id === id && !p.deleted_at) || null;
  }

  async create(data: Partial<PatientRecord> & { user_id: string; name: string; email: string }): Promise<PatientRecord> {
    const now = new Date().toISOString();
    const id = data.id || 'pat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const patient: PatientRecord = {
      id,
      user_id: data.user_id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      blood_group: data.blood_group || 'O+',
      gender: data.gender || 'Other',
      dob: data.dob,
      onboarding_completed: Boolean(data.onboarding_completed),
      status: data.status || 'Active',
      created_at: now,
      updated_at: now
    };

    if (isPgActive()) {
      try {
        await queryPg(
          `INSERT INTO patients (id, user_id, name, email, phone, blood_group, gender, dob, onboarding_completed, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, phone = EXCLUDED.phone, blood_group = EXCLUDED.blood_group, gender = EXCLUDED.gender, dob = EXCLUDED.dob, updated_at = EXCLUDED.updated_at`,
          [patient.id, patient.user_id, patient.name, patient.email, patient.phone || null, patient.blood_group || null, patient.gender || null, patient.dob || null, patient.onboarding_completed, patient.status, patient.created_at, patient.updated_at]
        );
      } catch (err) {
        console.warn('[PatientRepository.create] PG error:', err);
      }
    }
    const list = unifiedStore.getTable<PatientRecord>('patients');
    const existingIdx = list.findIndex(p => p.user_id === patient.user_id);
    if (existingIdx !== -1) {
      list[existingIdx] = { ...list[existingIdx], ...patient };
    } else {
      list.unshift(patient);
    }
    unifiedStore.updateTable('patients', list);
    return patient;
  }

  async updateByUserId(userId: string, updates: Partial<PatientRecord>): Promise<PatientRecord | null> {
    const now = new Date().toISOString();
    const list = unifiedStore.getTable<PatientRecord>('patients');
    const idx = list.findIndex(p => p.user_id === userId);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates, updated_at: now };
      unifiedStore.updateTable('patients', list);
      return list[idx];
    }
    return null;
  }
}

export const patientRepository = new PatientRepository();
