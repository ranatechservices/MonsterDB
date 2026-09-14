import { isPgActive, queryPg } from '../db/postgres';
import { unifiedStore } from './unifiedStore';

export interface UserRecord {
  id: string;
  uuid: string;
  name: string;
  email: string;
  password_hash: string;
  role: 'super_admin' | 'hospital_admin' | 'company_admin' | 'doctor' | 'caregiver' | 'patient';
  status: 'active' | 'suspended';
  phone?: string;
  blood_group?: string;
  gender?: string;
  dob?: string;
  organization_id?: string;
  wellness_consent_given?: boolean;
  onboarding_completed?: boolean;
  created_at: string;
  updated_at?: string;
  last_login?: string;
  deleted_at?: string | null;
}

export class UserRepository {
  async findById(id: string): Promise<UserRecord | null> {
    if (isPgActive()) {
      try {
        const rows = await queryPg<UserRecord>(
          `SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL LIMIT 1`,
          [id]
        );
        return rows[0] || null;
      } catch (err) {
        console.warn('[UserRepository.findById] Falling back to unifiedStore:', err);
      }
    }
    const users = unifiedStore.getTable<UserRecord>('users');
    return users.find(u => u.id === id && !u.deleted_at) || null;
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    const normalized = email.trim().toLowerCase();
    if (isPgActive()) {
      try {
        const rows = await queryPg<UserRecord>(
          `SELECT * FROM users WHERE LOWER(email) = $1 AND deleted_at IS NULL LIMIT 1`,
          [normalized]
        );
        return rows[0] || null;
      } catch (err) {
        console.warn('[UserRepository.findByEmail] Falling back to unifiedStore:', err);
      }
    }
    const users = unifiedStore.getTable<UserRecord>('users');
    return users.find(u => u.email.toLowerCase() === normalized && !u.deleted_at) || null;
  }

  async create(user: UserRecord): Promise<UserRecord> {
    if (isPgActive()) {
      try {
        await queryPg(
          `INSERT INTO users (id, uuid, name, email, password_hash, role, status, phone, blood_group, gender, dob, organization_id, wellness_consent_given, onboarding_completed, created_at, updated_at, last_login)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
          [
            user.id,
            user.uuid,
            user.name,
            user.email.toLowerCase(),
            user.password_hash,
            user.role,
            user.status,
            user.phone || null,
            user.blood_group || null,
            user.gender || null,
            user.dob || null,
            user.organization_id || null,
            Boolean(user.wellness_consent_given),
            Boolean(user.onboarding_completed),
            user.created_at,
            user.updated_at || user.created_at,
            user.last_login || null
          ]
        );
      } catch (err) {
        console.warn('[UserRepository.create] PG insert failed, using unifiedStore:', err);
      }
    }
    const users = unifiedStore.getTable<UserRecord>('users');
    users.push(user);
    unifiedStore.updateTable('users', users);
    return user;
  }

  async update(id: string, updates: Partial<UserRecord>): Promise<UserRecord | null> {
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

        const rows = await queryPg<UserRecord>(
          `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
          values
        );
        if (rows[0]) {
          const users = unifiedStore.getTable<UserRecord>('users');
          const i = users.findIndex(u => u.id === id);
          if (i !== -1) users[i] = { ...users[i], ...rows[0] };
          unifiedStore.updateTable('users', users);
          return rows[0];
        }
      } catch (err) {
        console.warn('[UserRepository.update] PG update failed, using unifiedStore:', err);
      }
    }
    const users = unifiedStore.getTable<UserRecord>('users');
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    users[idx] = { ...users[idx], ...updates, updated_at: now };
    unifiedStore.updateTable('users', users);
    return users[idx];
  }

  async list(filters?: { role?: string; organization_id?: string }): Promise<UserRecord[]> {
    if (isPgActive()) {
      try {
        let query = `SELECT * FROM users WHERE deleted_at IS NULL`;
        const params: any[] = [];
        if (filters?.role) {
          params.push(filters.role);
          query += ` AND role = $${params.length}`;
        }
        if (filters?.organization_id) {
          params.push(filters.organization_id);
          query += ` AND organization_id = $${params.length}`;
        }
        query += ` ORDER BY created_at DESC`;
        return await queryPg<UserRecord>(query, params);
      } catch (err) {
        console.warn('[UserRepository.list] PG list failed, using unifiedStore:', err);
      }
    }
    let list = unifiedStore.getTable<UserRecord>('users').filter(u => !u.deleted_at);
    if (filters?.role) list = list.filter(u => u.role === filters.role);
    if (filters?.organization_id) list = list.filter(u => u.organization_id === filters.organization_id);
    return list;
  }
}

export const userRepository = new UserRepository();
