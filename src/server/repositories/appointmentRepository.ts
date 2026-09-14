import { isPgActive, queryPg } from '../db/postgres';
import { unifiedStore } from './unifiedStore';

export interface AppointmentRecord {
  id: string;
  user_id: string;
  patient_id?: string;
  patient_name: string;
  doctor_id?: string;
  doctor_name: string;
  specialty: string;
  hospital_name: string;
  date: string;
  time: string;
  type: 'video_call' | 'in_person' | 'home_visit';
  status: 'upcoming' | 'completed' | 'cancelled';
  notes?: string;
  fee: number;
  created_at: string;
  updated_at?: string;
}

export class AppointmentRepository {
  async listByUserId(userId: string): Promise<AppointmentRecord[]> {
    if (isPgActive()) {
      try {
        return await queryPg<AppointmentRecord>(
          `SELECT * FROM appointments WHERE user_id = $1 ORDER BY date DESC, time DESC`,
          [userId]
        );
      } catch (err) {
        console.warn('[AppointmentRepository.listByUserId] Fallback:', err);
      }
    }
    return unifiedStore.getTable<AppointmentRecord>('appointments')
      .filter(a => a.user_id === userId)
      .sort((a, b) => new Date(`${b.date}T${b.time || '00:00'}`).getTime() - new Date(`${a.date}T${a.time || '00:00'}`).getTime());
  }

  async findById(id: string, userId?: string): Promise<AppointmentRecord | null> {
    if (isPgActive()) {
      try {
        let query = `SELECT * FROM appointments WHERE id = $1`;
        const params: any[] = [id];
        if (userId) {
          params.push(userId);
          query += ` AND user_id = $2`;
        }
        const rows = await queryPg<AppointmentRecord>(query, params);
        return rows[0] || null;
      } catch (err) {
        console.warn('[AppointmentRepository.findById] Fallback:', err);
      }
    }
    return unifiedStore.getTable<AppointmentRecord>('appointments')
      .find(a => a.id === id && (!userId || a.user_id === userId)) || null;
  }

  async create(data: Partial<AppointmentRecord> & { user_id: string; patient_name: string; doctor_name: string; date: string; time: string }): Promise<AppointmentRecord> {
    const now = new Date().toISOString();
    const id = data.id || 'apt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const apt: AppointmentRecord = {
      id,
      user_id: data.user_id,
      patient_id: data.patient_id,
      patient_name: data.patient_name,
      doctor_id: data.doctor_id,
      doctor_name: data.doctor_name,
      specialty: data.specialty || 'General Physician',
      hospital_name: data.hospital_name || 'Healora Health Center',
      date: data.date,
      time: data.time,
      type: data.type || 'video_call',
      status: data.status || 'upcoming',
      notes: data.notes,
      fee: data.fee || 500,
      created_at: now,
      updated_at: now
    };

    if (isPgActive()) {
      try {
        await queryPg(
          `INSERT INTO appointments (id, user_id, patient_id, patient_name, doctor_id, doctor_name, specialty, hospital_name, date, time, type, status, notes, fee, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
          [apt.id, apt.user_id, apt.patient_id || null, apt.patient_name, apt.doctor_id || null, apt.doctor_name, apt.specialty, apt.hospital_name, apt.date, apt.time, apt.type, apt.status, apt.notes || null, apt.fee, apt.created_at, apt.updated_at]
        );
      } catch (err) {
        console.warn('[AppointmentRepository.create] PG error:', err);
      }
    }

    const list = unifiedStore.getTable<AppointmentRecord>('appointments');
    list.unshift(apt);
    unifiedStore.updateTable('appointments', list);
    return apt;
  }

  async update(id: string, userId: string, patch: Partial<AppointmentRecord>): Promise<AppointmentRecord | null> {
    const now = new Date().toISOString();
    const list = unifiedStore.getTable<AppointmentRecord>('appointments');
    const idx = list.findIndex(a => a.id === id && a.user_id === userId);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...patch, updated_at: now };
    unifiedStore.updateTable('appointments', list);
    return list[idx];
  }
}

export const appointmentRepository = new AppointmentRepository();
