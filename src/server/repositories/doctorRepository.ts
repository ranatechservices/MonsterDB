import { isPgActive, queryPg } from '../db/postgres';
import { unifiedStore } from './unifiedStore';

export interface DoctorRecord {
  id: string;
  user_id?: string;
  name: string;
  email: string;
  specialty: string;
  hospital_id?: string;
  hospital_name: string;
  registration_no: string;
  verified: boolean;
  fee: number;
  rating: number;
  total_patients: number;
  status: 'Active' | 'Under Review' | 'Suspended';
  created_at: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export class DoctorRepository {
  async list(filters?: { specialty?: string; hospital_id?: string; status?: string }): Promise<DoctorRecord[]> {
    if (isPgActive()) {
      try {
        let query = `SELECT * FROM doctors WHERE deleted_at IS NULL`;
        const params: any[] = [];
        if (filters?.specialty) {
          params.push(filters.specialty);
          query += ` AND specialty ILIKE $${params.length}`;
        }
        if (filters?.hospital_id) {
          params.push(filters.hospital_id);
          query += ` AND hospital_id = $${params.length}`;
        }
        if (filters?.status) {
          params.push(filters.status);
          query += ` AND status = $${params.length}`;
        }
        query += ` ORDER BY rating DESC, created_at DESC`;
        return await queryPg<DoctorRecord>(query, params);
      } catch (err) {
        console.warn('[DoctorRepository.list] Fallback:', err);
      }
    }
    let list = unifiedStore.getTable<DoctorRecord>('doctors').filter(d => !d.deleted_at);
    if (filters?.specialty) list = list.filter(d => d.specialty.toLowerCase().includes(filters.specialty!.toLowerCase()));
    if (filters?.hospital_id) list = list.filter(d => d.hospital_id === filters.hospital_id);
    if (filters?.status) list = list.filter(d => d.status === filters.status);
    return list;
  }

  async findById(id: string): Promise<DoctorRecord | null> {
    if (isPgActive()) {
      try {
        const rows = await queryPg<DoctorRecord>(
          `SELECT * FROM doctors WHERE id = $1 AND deleted_at IS NULL LIMIT 1`,
          [id]
        );
        return rows[0] || null;
      } catch (err) {
        console.warn('[DoctorRepository.findById] Fallback:', err);
      }
    }
    return unifiedStore.getTable<DoctorRecord>('doctors').find(d => d.id === id && !d.deleted_at) || null;
  }

  async create(data: Partial<DoctorRecord> & { name: string; email: string; specialty: string }): Promise<DoctorRecord> {
    const now = new Date().toISOString();
    const id = data.id || 'doc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const doctor: DoctorRecord = {
      id,
      user_id: data.user_id,
      name: data.name,
      email: data.email,
      specialty: data.specialty,
      hospital_id: data.hospital_id,
      hospital_name: data.hospital_name || 'Healora Partner Hospital',
      registration_no: data.registration_no || 'MCI-' + Math.floor(10000 + Math.random() * 90000),
      verified: data.verified ?? true,
      fee: data.fee || 500,
      rating: data.rating || 4.8,
      total_patients: data.total_patients || 0,
      status: data.status || 'Active',
      created_at: now,
      updated_at: now
    };

    if (isPgActive()) {
      try {
        await queryPg(
          `INSERT INTO doctors (id, user_id, name, email, specialty, hospital_id, hospital_name, registration_no, verified, fee, rating, total_patients, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
          [doctor.id, doctor.user_id || null, doctor.name, doctor.email, doctor.specialty, doctor.hospital_id || null, doctor.hospital_name, doctor.registration_no, doctor.verified, doctor.fee, doctor.rating, doctor.total_patients, doctor.status, doctor.created_at, doctor.updated_at]
        );
      } catch (err) {
        console.warn('[DoctorRepository.create] PG error:', err);
      }
    }
    const list = unifiedStore.getTable<DoctorRecord>('doctors');
    list.unshift(doctor);
    unifiedStore.updateTable('doctors', list);
    return doctor;
  }

  async update(id: string, updates: Partial<DoctorRecord>): Promise<DoctorRecord | null> {
    const now = new Date().toISOString();
    if (isPgActive()) {
      try {
        const fields: string[] = [];
        const values: any[] = [];
        let idx = 1;
        for (const [key, value] of Object.entries(updates)) {
          fields.push(`${key} = $${idx}`);
          values.push(value);
          idx++;
        }
        fields.push(`updated_at = $${idx}`);
        values.push(now);
        idx++;
        values.push(id);
        const rows = await queryPg<DoctorRecord>(
          `UPDATE doctors SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
          values
        );
        if (rows[0]) {
          const list = unifiedStore.getTable<DoctorRecord>('doctors');
          const i = list.findIndex(d => d.id === id);
          if (i !== -1) list[i] = { ...list[i], ...rows[0] };
          unifiedStore.updateTable('doctors', list);
          return rows[0];
        }
      } catch (err) {
        console.warn('[DoctorRepository.update] PG error:', err);
      }
    }
    const list = unifiedStore.getTable<DoctorRecord>('doctors');
    const idx = list.findIndex(d => d.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...updates, updated_at: now };
    unifiedStore.updateTable('doctors', list);
    return list[idx];
  }
}

export const doctorRepository = new DoctorRepository();
