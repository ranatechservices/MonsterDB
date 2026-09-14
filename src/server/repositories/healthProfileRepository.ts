import { isPgActive, queryPg } from '../db/postgres';
import { dbEngine } from '../db';

export interface HealthProfileRecord {
  id: string;
  user_id: string;
  height_cm?: number;
  weight_kg?: number;
  bmi?: number;
  blood_group?: string;
  allergies?: string[];
  chronic_conditions?: string[];
  current_medications?: string[];
  dietary_preferences?: string;
  smoking_status?: string;
  alcohol_consumption?: string;
  activity_level?: string;
  family_medical_history?: string[];
  emergency_notes?: string;
  created_at: string;
  updated_at: string;
}

export class HealthProfileRepository {
  public static async getByUserId(userId: string): Promise<HealthProfileRecord | null> {
    if (isPgActive()) {
      const rows = await queryPg<HealthProfileRecord>(
        'SELECT * FROM health_profiles WHERE user_id = $1 LIMIT 1',
        [userId]
      );
      return rows[0] || null;
    }

    // Fallback store
    const db = dbEngine.getRaw();
    const raw = (db as any).health_profiles?.find((p: any) => p.user_id === userId);
    return raw || null;
  }

  public static async upsert(profile: Partial<HealthProfileRecord> & { user_id: string }): Promise<HealthProfileRecord> {
    const now = new Date().toISOString();
    const id = profile.id || `hp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    if (isPgActive()) {
      const rows = await queryPg<HealthProfileRecord>(
        `INSERT INTO health_profiles (
          id, user_id, height_cm, weight_kg, bmi, blood_group,
          allergies, chronic_conditions, current_medications,
          dietary_preferences, smoking_status, alcohol_consumption,
          activity_level, family_medical_history, emergency_notes,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        ON CONFLICT (user_id) DO UPDATE SET
          height_cm = EXCLUDED.height_cm,
          weight_kg = EXCLUDED.weight_kg,
          bmi = EXCLUDED.bmi,
          blood_group = EXCLUDED.blood_group,
          allergies = EXCLUDED.allergies,
          chronic_conditions = EXCLUDED.chronic_conditions,
          current_medications = EXCLUDED.current_medications,
          dietary_preferences = EXCLUDED.dietary_preferences,
          smoking_status = EXCLUDED.smoking_status,
          alcohol_consumption = EXCLUDED.alcohol_consumption,
          activity_level = EXCLUDED.activity_level,
          family_medical_history = EXCLUDED.family_medical_history,
          emergency_notes = EXCLUDED.emergency_notes,
          updated_at = EXCLUDED.updated_at
        RETURNING *`,
        [
          id,
          profile.user_id,
          profile.height_cm || null,
          profile.weight_kg || null,
          profile.bmi || null,
          profile.blood_group || null,
          JSON.stringify(profile.allergies || []),
          JSON.stringify(profile.chronic_conditions || []),
          JSON.stringify(profile.current_medications || []),
          profile.dietary_preferences || null,
          profile.smoking_status || 'never',
          profile.alcohol_consumption || 'none',
          profile.activity_level || 'moderate',
          JSON.stringify(profile.family_medical_history || []),
          profile.emergency_notes || null,
          now,
          now
        ]
      );
      return rows[0];
    }

    // Local DB Engine update
    const db = dbEngine.getRaw() as any;
    if (!db.health_profiles) db.health_profiles = [];
    const index = db.health_profiles.findIndex((p: any) => p.user_id === profile.user_id);

    const record: HealthProfileRecord = {
      id: index >= 0 ? db.health_profiles[index].id : id,
      user_id: profile.user_id,
      height_cm: profile.height_cm,
      weight_kg: profile.weight_kg,
      bmi: profile.bmi,
      blood_group: profile.blood_group,
      allergies: profile.allergies || [],
      chronic_conditions: profile.chronic_conditions || [],
      current_medications: profile.current_medications || [],
      dietary_preferences: profile.dietary_preferences,
      smoking_status: profile.smoking_status || 'never',
      alcohol_consumption: profile.alcohol_consumption || 'none',
      activity_level: profile.activity_level || 'moderate',
      family_medical_history: profile.family_medical_history || [],
      emergency_notes: profile.emergency_notes,
      created_at: index >= 0 ? db.health_profiles[index].created_at : now,
      updated_at: now
    };

    if (index >= 0) {
      db.health_profiles[index] = record;
    } else {
      db.health_profiles.push(record);
    }
    dbEngine.save();
    return record;
  }
}
