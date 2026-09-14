import { isPgActive, queryPg } from '../db/postgres';
import { unifiedStore } from './unifiedStore';

export type CareCirclePermissionType =
  | 'TIMELINE_SUMMARY'
  | 'REPORTS'
  | 'MEDICATION_STATUS'
  | 'APPOINTMENTS'
  | 'FOLLOWUPS'
  | 'EMERGENCY_INFO'
  | 'SELECTED_REPORT';

export interface CareCirclePermissionRecord {
  id: string;
  member_id: string;
  user_id: string;
  permission_type: CareCirclePermissionType;
  granted: boolean;
  scope_resource_id?: string;
  created_at: string;
  updated_at?: string;
}

export interface CareCircleMemberRecord {
  id: string;
  user_id: string;
  patient_id?: string;
  name: string;
  relation: string;
  role: 'guardian' | 'family' | 'doctor' | 'caregiver';
  phone: string;
  email: string;
  status: string;
  permissions?: {
    canViewVitals?: boolean;
    canViewMedicines?: boolean;
    canViewReports?: boolean;
    receiveAlerts?: boolean;
  };
  granularPermissions?: Record<CareCirclePermissionType, boolean>;
  created_at: string;
  updated_at?: string;
}

export class CareCircleRepository {
  async listByUserId(userId: string): Promise<CareCircleMemberRecord[]> {
    const members = unifiedStore.getTable<CareCircleMemberRecord>('care_circle_members').filter(m => m.user_id === userId);
    const perms = unifiedStore.getTable<CareCirclePermissionRecord>('care_circle_permissions').filter(p => p.user_id === userId);

    return members.map(m => {
      const memberPerms = perms.filter(p => p.member_id === m.id);
      const granular: Record<string, boolean> = {
        TIMELINE_SUMMARY: false,
        REPORTS: m.permissions?.canViewReports ?? false,
        MEDICATION_STATUS: m.permissions?.canViewMedicines ?? false,
        APPOINTMENTS: false,
        FOLLOWUPS: false,
        EMERGENCY_INFO: m.permissions?.receiveAlerts ?? true,
        SELECTED_REPORT: false
      };
      for (const p of memberPerms) {
        granular[p.permission_type] = p.granted;
      }
      return {
        ...m,
        granularPermissions: granular as Record<CareCirclePermissionType, boolean>
      };
    });
  }

  async findById(id: string, userId: string): Promise<CareCircleMemberRecord | null> {
    const members = await this.listByUserId(userId);
    return members.find(m => m.id === id) || null;
  }

  async create(data: Partial<CareCircleMemberRecord> & { user_id: string; name: string; relation: string; phone: string; email: string }): Promise<CareCircleMemberRecord> {
    const now = new Date().toISOString();
    const id = data.id || 'cc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const member: CareCircleMemberRecord = {
      id,
      user_id: data.user_id,
      patient_id: data.patient_id,
      name: data.name,
      relation: data.relation,
      role: data.role || 'family',
      phone: data.phone,
      email: data.email.toLowerCase().trim(),
      status: 'active',
      permissions: data.permissions || {
        canViewVitals: true,
        canViewMedicines: true,
        canViewReports: false,
        receiveAlerts: true
      },
      created_at: now,
      updated_at: now
    };

    const members = unifiedStore.getTable<CareCircleMemberRecord>('care_circle_members');
    members.unshift(member);
    unifiedStore.updateTable('care_circle_members', members);

    // Seed default granular permissions
    const perms = unifiedStore.getTable<CareCirclePermissionRecord>('care_circle_permissions');
    const defaultTypes: CareCirclePermissionType[] = ['TIMELINE_SUMMARY', 'REPORTS', 'MEDICATION_STATUS', 'APPOINTMENTS', 'FOLLOWUPS', 'EMERGENCY_INFO'];
    for (const pType of defaultTypes) {
      perms.push({
        id: 'perm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        member_id: member.id,
        user_id: member.user_id,
        permission_type: pType,
        granted: pType === 'EMERGENCY_INFO' || pType === 'MEDICATION_STATUS',
        created_at: now
      });
    }
    unifiedStore.updateTable('care_circle_permissions', perms);

    return member;
  }

  async updatePermissions(memberId: string, userId: string, granular: Record<CareCirclePermissionType, boolean>): Promise<boolean> {
    const now = new Date().toISOString();
    const perms = unifiedStore.getTable<CareCirclePermissionRecord>('care_circle_permissions');

    for (const [type, granted] of Object.entries(granular)) {
      const idx = perms.findIndex(p => p.member_id === memberId && p.user_id === userId && p.permission_type === type);
      if (idx !== -1) {
        perms[idx].granted = Boolean(granted);
        perms[idx].updated_at = now;
      } else {
        perms.push({
          id: 'perm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          member_id: memberId,
          user_id: userId,
          permission_type: type as CareCirclePermissionType,
          granted: Boolean(granted),
          created_at: now
        });
      }
    }
    unifiedStore.updateTable('care_circle_permissions', perms);
    return true;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const members = unifiedStore.getTable<CareCircleMemberRecord>('care_circle_members');
    const idx = members.findIndex(m => m.id === id && m.user_id === userId);
    if (idx === -1) return false;
    members.splice(idx, 1);
    unifiedStore.updateTable('care_circle_members', members);

    const perms = unifiedStore.getTable<CareCirclePermissionRecord>('care_circle_permissions');
    const remainingPerms = perms.filter(p => p.member_id !== id);
    unifiedStore.updateTable('care_circle_permissions', remainingPerms);
    return true;
  }
}

export const careCircleRepository = new CareCircleRepository();
