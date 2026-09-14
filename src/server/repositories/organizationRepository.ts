import { isPgActive, queryPg } from '../db/postgres';
import { unifiedStore } from './unifiedStore';

export interface OrganizationRecord {
  id: string;
  name: string;
  type: 'hospital' | 'company' | 'clinic';
  admin_user_id?: string;
  status: 'Active' | 'Pending' | 'Suspended';
  beds?: number;
  tier?: string;
  employees_count?: number;
  active_contracts?: number;
  contact_email?: string;
  contact_phone?: string;
  location?: string;
  created_at: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export class OrganizationRepository {
  async list(): Promise<OrganizationRecord[]> {
    if (isPgActive()) {
      try {
        return await queryPg<OrganizationRecord>(
          `SELECT * FROM organizations WHERE deleted_at IS NULL ORDER BY created_at DESC`
        );
      } catch (err) {
        console.warn('[OrganizationRepository.list] Fallback:', err);
      }
    }
    return unifiedStore.getTable<OrganizationRecord>('organizations').filter(o => !o.deleted_at);
  }

  async findById(id: string): Promise<OrganizationRecord | null> {
    if (isPgActive()) {
      try {
        const rows = await queryPg<OrganizationRecord>(
          `SELECT * FROM organizations WHERE id = $1 AND deleted_at IS NULL LIMIT 1`,
          [id]
        );
        return rows[0] || null;
      } catch (err) {
        console.warn('[OrganizationRepository.findById] Fallback:', err);
      }
    }
    return unifiedStore.getTable<OrganizationRecord>('organizations').find(o => o.id === id && !o.deleted_at) || null;
  }

  async create(data: Partial<OrganizationRecord> & { name: string; type: OrganizationRecord['type'] }): Promise<OrganizationRecord> {
    const now = new Date().toISOString();
    const id = data.id || 'org_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const org: OrganizationRecord = {
      id,
      name: data.name,
      type: data.type,
      admin_user_id: data.admin_user_id,
      status: data.status || 'Active',
      beds: data.beds || 0,
      tier: data.tier || 'Standard',
      employees_count: data.employees_count || 0,
      active_contracts: data.active_contracts || 0,
      contact_email: data.contact_email,
      contact_phone: data.contact_phone,
      location: data.location,
      created_at: now,
      updated_at: now
    };

    if (isPgActive()) {
      try {
        await queryPg(
          `INSERT INTO organizations (id, name, type, admin_user_id, status, beds, tier, employees_count, active_contracts, contact_email, contact_phone, location, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
          [org.id, org.name, org.type, org.admin_user_id || null, org.status, org.beds, org.tier, org.employees_count, org.active_contracts, org.contact_email || null, org.contact_phone || null, org.location || null, org.created_at, org.updated_at]
        );
      } catch (err) {
        console.warn('[OrganizationRepository.create] PG error:', err);
      }
    }
    const list = unifiedStore.getTable<OrganizationRecord>('organizations');
    list.unshift(org);
    unifiedStore.updateTable('organizations', list);
    return org;
  }

  async update(id: string, updates: Partial<OrganizationRecord>): Promise<OrganizationRecord | null> {
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
        const rows = await queryPg<OrganizationRecord>(
          `UPDATE organizations SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
          values
        );
        if (rows[0]) {
          const list = unifiedStore.getTable<OrganizationRecord>('organizations');
          const i = list.findIndex(o => o.id === id);
          if (i !== -1) list[i] = { ...list[i], ...rows[0] };
          unifiedStore.updateTable('organizations', list);
          return rows[0];
        }
      } catch (err) {
        console.warn('[OrganizationRepository.update] PG error:', err);
      }
    }
    const list = unifiedStore.getTable<OrganizationRecord>('organizations');
    const idx = list.findIndex(o => o.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...updates, updated_at: now };
    unifiedStore.updateTable('organizations', list);
    return list[idx];
  }
}

export const organizationRepository = new OrganizationRepository();
