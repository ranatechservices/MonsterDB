import { isPgActive, queryPg } from '../db/postgres';
import { dbEngine } from '../db';

export interface UserConsentRecord {
  id: string;
  user_id: string;
  consent_type: string;
  consent_version: string;
  granted: boolean;
  ip_address?: string;
  user_agent?: string;
  disclaimer_text_shown: string;
  granted_at: string;
  revoked_at?: string | null;
}

export class UserConsentRepository {
  public static async recordConsent(data: {
    user_id: string;
    consent_type: string;
    consent_version?: string;
    granted?: boolean;
    ip_address?: string;
    user_agent?: string;
    disclaimer_text_shown?: string;
  }): Promise<UserConsentRecord> {
    const id = `cst_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const record: UserConsentRecord = {
      id,
      user_id: data.user_id,
      consent_type: data.consent_type,
      consent_version: data.consent_version || 'v1.0',
      granted: data.granted !== false,
      ip_address: data.ip_address,
      user_agent: data.user_agent,
      disclaimer_text_shown:
        data.disclaimer_text_shown ||
        'Your medical report will be securely processed and analyzed by Healora AI for clinical information and educational insights.',
      granted_at: now,
      revoked_at: null
    };

    if (isPgActive()) {
      const rows = await queryPg<UserConsentRecord>(
        `INSERT INTO user_consents (
          id, user_id, consent_type, consent_version, granted,
          ip_address, user_agent, disclaimer_text_shown, granted_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          record.id, record.user_id, record.consent_type, record.consent_version,
          record.granted, record.ip_address || null, record.user_agent || null,
          record.disclaimer_text_shown, now
        ]
      );
      return rows[0] || record;
    }

    const db = dbEngine.getRaw() as any;
    if (!db.user_consents) db.user_consents = [];
    db.user_consents.push(record);
    dbEngine.save();
    return record;
  }

  public static async getLatestConsent(userId: string, consentType = 'ai_lab_analysis'): Promise<UserConsentRecord | null> {
    if (isPgActive()) {
      const rows = await queryPg<UserConsentRecord>(
        'SELECT * FROM user_consents WHERE user_id = $1 AND consent_type = $2 ORDER BY granted_at DESC LIMIT 1',
        [userId, consentType]
      );
      return rows[0] || null;
    }

    const db = dbEngine.getRaw() as any;
    const list = db.user_consents || [];
    const matched = list.filter((c: any) => c.user_id === userId && c.consent_type === consentType);
    return matched.length > 0 ? matched[matched.length - 1] : null;
  }
}
