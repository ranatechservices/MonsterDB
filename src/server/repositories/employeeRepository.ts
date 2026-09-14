import { isPgActive, queryPg } from '../db/postgres';
import { unifiedStore } from './unifiedStore';

export interface EmployeeRecord {
  id: string;
  organization_id: string;
  user_id?: string;
  employee_code: string;
  full_name: string;
  email: string;
  phone?: string;
  department: string;
  designation: string;
  date_of_joining: string;
  employment_status: 'active' | 'on_leave' | 'inactive' | 'offboarded';
  gender?: 'Male' | 'Female' | 'Other';
  dob?: string;
  blood_group?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  insurance_policy_no?: string;
  wellness_consent_given: boolean;
  invited_at?: string;
  invite_token?: string;
  activated_at?: string;
  vitality_points?: number;
  health_streak?: number;
  wellness_score_band?: 'Optimal' | 'Stable' | 'Needs Attention' | 'Elevated Risk';
  created_at: string;
  updated_at: string;
}

export class EmployeeRepository {
  async listByOrg(orgId: string): Promise<EmployeeRecord[]> {
    return unifiedStore.getTable<EmployeeRecord>('employees').filter(e => e.organization_id === orgId);
  }

  async findById(id: string): Promise<EmployeeRecord | null> {
    return unifiedStore.getTable<EmployeeRecord>('employees').find(e => e.id === id) || null;
  }

  async findByUserId(userId: string): Promise<EmployeeRecord | null> {
    return unifiedStore.getTable<EmployeeRecord>('employees').find(e => e.user_id === userId) || null;
  }

  async findByInviteToken(token: string): Promise<EmployeeRecord | null> {
    return unifiedStore.getTable<EmployeeRecord>('employees').find(e => e.invite_token === token) || null;
  }

  async create(data: Partial<EmployeeRecord> & { organization_id: string; full_name: string; email: string }): Promise<EmployeeRecord> {
    const now = new Date().toISOString();
    const id = 'emp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const inviteToken = 'inv_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now().toString(36);

    const record: EmployeeRecord = {
      id,
      organization_id: data.organization_id,
      user_id: data.user_id,
      employee_code: data.employee_code || ('EMP-' + Math.floor(1000 + Math.random() * 9000)),
      full_name: data.full_name,
      email: data.email.toLowerCase().trim(),
      phone: data.phone,
      department: data.department || 'General',
      designation: data.designation || 'Team Member',
      date_of_joining: data.date_of_joining || now.split('T')[0],
      employment_status: data.employment_status || 'active',
      gender: data.gender || 'Other',
      dob: data.dob,
      blood_group: data.blood_group,
      emergency_contact_name: data.emergency_contact_name,
      emergency_contact_phone: data.emergency_contact_phone,
      insurance_policy_no: data.insurance_policy_no,
      wellness_consent_given: Boolean(data.wellness_consent_given),
      invited_at: now,
      invite_token: inviteToken,
      vitality_points: data.vitality_points ?? (data.wellness_consent_given ? 350 : 0),
      health_streak: data.health_streak ?? (data.wellness_consent_given ? 5 : 0),
      wellness_score_band: data.wellness_score_band || 'Stable',
      created_at: now,
      updated_at: now
    };

    const list = unifiedStore.getTable<EmployeeRecord>('employees');
    list.unshift(record);
    unifiedStore.updateTable('employees', list);
    return record;
  }

  async update(id: string, patch: Partial<EmployeeRecord>): Promise<EmployeeRecord | null> {
    const list = unifiedStore.getTable<EmployeeRecord>('employees');
    const idx = list.findIndex(e => e.id === id);
    if (idx === -1) return null;
    list[idx] = { ...list[idx], ...patch, updated_at: new Date().toISOString() };
    unifiedStore.updateTable('employees', list);
    return list[idx];
  }

  async delete(id: string): Promise<boolean> {
    const list = unifiedStore.getTable<EmployeeRecord>('employees');
    const idx = list.findIndex(e => e.id === id);
    if (idx === -1) return false;
    list[idx].employment_status = 'offboarded';
    list[idx].updated_at = new Date().toISOString();
    unifiedStore.updateTable('employees', list);
    return true;
  }
}

export const employeeRepository = new EmployeeRepository();
