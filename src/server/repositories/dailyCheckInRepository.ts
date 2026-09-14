import { isPgActive, queryPg } from '../db/postgres';
import { unifiedStore } from './unifiedStore';

export interface DailyCheckInRecord {
  id: string;
  user_id: string;
  patient_id?: string;
  date: string;
  mood: 'great' | 'good' | 'okay' | 'poor' | 'terrible';
  symptoms: string[];
  sleep_hours?: number;
  water_intake_ml?: number;
  energy_level?: number;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export class DailyCheckInRepository {
  async listByUserId(userId: string, limit: number = 30): Promise<DailyCheckInRecord[]> {
    if (isPgActive()) {
      try {
        return await queryPg<DailyCheckInRecord>(
          `SELECT * FROM daily_checkins WHERE user_id = $1 ORDER BY date DESC LIMIT $2`,
          [userId, limit]
        );
      } catch (err) {
        console.warn('[DailyCheckInRepository.listByUserId] Fallback:', err);
      }
    }
    return unifiedStore.getTable<DailyCheckInRecord>('daily_checkins')
      .filter(d => d.user_id === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }

  async findByDate(userId: string, date: string): Promise<DailyCheckInRecord | null> {
    if (isPgActive()) {
      try {
        const rows = await queryPg<DailyCheckInRecord>(
          `SELECT * FROM daily_checkins WHERE user_id = $1 AND date = $2 LIMIT 1`,
          [userId, date]
        );
        return rows[0] || null;
      } catch (err) {
        console.warn('[DailyCheckInRepository.findByDate] Fallback:', err);
      }
    }
    return unifiedStore.getTable<DailyCheckInRecord>('daily_checkins')
      .find(d => d.user_id === userId && d.date === date) || null;
  }

  async save(data: Omit<DailyCheckInRecord, 'id' | 'created_at'> & { id?: string }): Promise<DailyCheckInRecord> {
    const now = new Date().toISOString();
    const id = data.id || 'chk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const checkin: DailyCheckInRecord = {
      id,
      user_id: data.user_id,
      patient_id: data.patient_id,
      date: data.date || now.split('T')[0],
      mood: data.mood,
      symptoms: data.symptoms || [],
      sleep_hours: data.sleep_hours,
      water_intake_ml: data.water_intake_ml,
      energy_level: data.energy_level || 7,
      notes: data.notes,
      created_at: now,
      updated_at: now
    };

    if (isPgActive()) {
      try {
        await queryPg(
          `INSERT INTO daily_checkins (id, user_id, patient_id, date, mood, symptoms, sleep_hours, water_intake_ml, energy_level, notes, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [checkin.id, checkin.user_id, checkin.patient_id || null, checkin.date, checkin.mood, JSON.stringify(checkin.symptoms), checkin.sleep_hours || null, checkin.water_intake_ml || null, checkin.energy_level || null, checkin.notes || null, checkin.created_at, checkin.updated_at]
        );
      } catch (err) {
        console.warn('[DailyCheckInRepository.save] PG error:', err);
      }
    }

    const list = unifiedStore.getTable<DailyCheckInRecord>('daily_checkins');
    const existingIdx = list.findIndex(c => c.user_id === checkin.user_id && c.date === checkin.date);
    if (existingIdx !== -1) {
      list[existingIdx] = { ...list[existingIdx], ...checkin };
    } else {
      list.unshift(checkin);
    }
    unifiedStore.updateTable('daily_checkins', list);
    return checkin;
  }
}

export const dailyCheckInRepository = new DailyCheckInRepository();
