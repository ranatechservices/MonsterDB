import { isPgActive, queryPg } from '../db/postgres';
import { unifiedStore } from './unifiedStore';

export interface DoctorNoteRecord {
  id: string;
  user_id: string;
  doctor_id?: string;
  doctor_name: string;
  specialty?: string;
  visit_date: string;
  chief_complaint: string;
  clinical_observations?: string;
  diagnosis_impressions?: string;
  treatment_plan?: string;
  prescriptions_recorded: Array<{
    medicine_name: string;
    dosage: string;
    duration: string;
    instructions: string;
  }>;
  doctor_verified: boolean;
  created_at: string;
  updated_at?: string;
}

export class DoctorNotesRepository {
  async listByUserId(userId: string): Promise<DoctorNoteRecord[]> {
    if (isPgActive()) {
      try {
        return await queryPg<DoctorNoteRecord>(
          `SELECT * FROM doctor_notes WHERE user_id = $1 ORDER BY visit_date DESC, created_at DESC`,
          [userId]
        );
      } catch (err) {
        console.warn('[DoctorNotesRepository.listByUserId] Fallback:', err);
      }
    }
    return unifiedStore.getTable<DoctorNoteRecord>('doctor_notes')
      .filter(n => n.user_id === userId)
      .sort((a, b) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime());
  }

  async findById(id: string, userId: string): Promise<DoctorNoteRecord | null> {
    const list = await this.listByUserId(userId);
    return list.find(n => n.id === id) || null;
  }

  async create(data: Omit<DoctorNoteRecord, 'id' | 'created_at'> & { id?: string }): Promise<DoctorNoteRecord> {
    const now = new Date().toISOString();
    const id = data.id || 'dn_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const note: DoctorNoteRecord = {
      id,
      user_id: data.user_id,
      doctor_id: data.doctor_id,
      doctor_name: data.doctor_name,
      specialty: data.specialty || 'General Physician',
      visit_date: data.visit_date || now.split('T')[0],
      chief_complaint: data.chief_complaint,
      clinical_observations: data.clinical_observations,
      diagnosis_impressions: data.diagnosis_impressions,
      treatment_plan: data.treatment_plan,
      prescriptions_recorded: data.prescriptions_recorded || [],
      doctor_verified: data.doctor_verified ?? true,
      created_at: now,
      updated_at: now
    };

    if (isPgActive()) {
      try {
        await queryPg(
          `INSERT INTO doctor_notes (id, user_id, doctor_id, doctor_name, specialty, visit_date, chief_complaint, clinical_observations, diagnosis_impressions, treatment_plan, prescriptions_recorded, doctor_verified, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
          [note.id, note.user_id, note.doctor_id || null, note.doctor_name, note.specialty || null, note.visit_date, note.chief_complaint, note.clinical_observations || null, note.diagnosis_impressions || null, note.treatment_plan || null, JSON.stringify(note.prescriptions_recorded), note.doctor_verified, note.created_at, note.updated_at]
        );
      } catch (err) {
        console.warn('[DoctorNotesRepository.create] PG error:', err);
      }
    }

    const list = unifiedStore.getTable<DoctorNoteRecord>('doctor_notes');
    list.unshift(note);
    unifiedStore.updateTable('doctor_notes', list);
    return note;
  }
}

export const doctorNotesRepository = new DoctorNotesRepository();
