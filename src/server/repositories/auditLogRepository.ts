import { isPgActive, queryPg } from '../db/postgres';
import { dbEngine } from '../db';

export interface AuditLogRecord {
  id: string;
  user_id?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  ip_address?: string;
  user_agent?: string;
  metadata?: Record<string, any>;
  status: 'success' | 'failed' | 'denied';
  created_at: string;
}

export class AuditLogRepository {
  public static async log(entry: {
    user_id?: string;
    action: string;
    resource_type: string;
    resource_id?: string;
    ip_address?: string;
    user_agent?: string;
    metadata?: Record<string, any>;
    status?: 'success' | 'failed' | 'denied';
  }): Promise<AuditLogRecord> {
    const id = `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    // Sanitize metadata - NEVER store raw medical document texts or sensitive secrets
    const safeMetadata = { ...(entry.metadata || {}) };
    delete safeMetadata.raw_extracted_text;
    delete safeMetadata.file_data_base64;
    delete safeMetadata.password;

    const record: AuditLogRecord = {
      id,
      user_id: entry.user_id,
      action: entry.action,
      resource_type: entry.resource_type,
      resource_id: entry.resource_id,
      ip_address: entry.ip_address,
      user_agent: entry.user_agent,
      metadata: safeMetadata,
      status: entry.status || 'success',
      created_at: now
    };

    if (isPgActive()) {
      try {
        await queryPg(
          `INSERT INTO audit_logs (
            id, user_id, action, resource_type, resource_id,
            ip_address, user_agent, metadata, status, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            record.id, record.user_id || null, record.action, record.resource_type,
            record.resource_id || null, record.ip_address || null, record.user_agent || null,
            JSON.stringify(safeMetadata), record.status, now
          ]
        );
      } catch (e) {
        console.warn('PostgreSQL audit log insert failed:', e);
      }
    } else {
      const db = dbEngine.getRaw() as any;
      if (!db.audit_logs) db.audit_logs = [];
      db.audit_logs.push(record);
      // Keep audit logs capped in memory/JSON
      if (db.audit_logs.length > 2000) {
        db.audit_logs = db.audit_logs.slice(-1000);
      }
      dbEngine.save();
    }

    return record;
  }

  public static async getLogsForUser(userId: string, limit = 50): Promise<AuditLogRecord[]> {
    if (isPgActive()) {
      return await queryPg<AuditLogRecord>(
        'SELECT * FROM audit_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
        [userId, limit]
      );
    }

    const db = dbEngine.getRaw() as any;
    const list = db.audit_logs || [];
    return list.filter((l: any) => l.user_id === userId).slice(-limit).reverse();
  }
}
