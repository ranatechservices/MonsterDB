import { isPgActive, queryPg } from '../db/postgres';
import { unifiedStore } from './unifiedStore';

export interface CompanyChallengeRecord {
  id: string;
  organization_id: string;
  title: string;
  description?: string;
  category: 'steps' | 'hydration' | 'vitals_streak' | 'sleep' | 'mindfulness' | 'general';
  target_value: number;
  unit: string;
  reward_points: number;
  reward_perk?: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'upcoming' | 'completed';
  target_department?: string;
  participant_ids: string[];
  progress_percentage?: number;
  created_by_user_id?: string;
  created_at: string;
  updated_at?: string;
}

export class ChallengeRepository {
  async listByOrg(orgId: string, status?: string): Promise<CompanyChallengeRecord[]> {
    return unifiedStore.getTable<CompanyChallengeRecord>('company_challenges').filter(c => {
      if (c.organization_id !== orgId) return false;
      if (status && c.status !== status) return false;
      return true;
    });
  }

  async create(data: Partial<CompanyChallengeRecord> & { organization_id: string; title: string }): Promise<CompanyChallengeRecord> {
    const now = new Date().toISOString();
    const id = 'chg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const rec: CompanyChallengeRecord = {
      id,
      organization_id: data.organization_id,
      title: data.title,
      description: data.description || '',
      category: data.category || 'steps',
      target_value: data.target_value || 10000,
      unit: data.unit || 'Steps/day',
      reward_points: data.reward_points || 500,
      reward_perk: data.reward_perk || '₹500 Health Credit',
      start_date: data.start_date || now.split('T')[0],
      end_date: data.end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: data.status || 'active',
      target_department: data.target_department || 'all',
      participant_ids: data.participant_ids || [],
      progress_percentage: data.progress_percentage || 0,
      created_by_user_id: data.created_by_user_id,
      created_at: now,
      updated_at: now
    };

    const list = unifiedStore.getTable<CompanyChallengeRecord>('company_challenges');
    list.unshift(rec);
    unifiedStore.updateTable('company_challenges', list);
    return rec;
  }
}

export const challengeRepository = new ChallengeRepository();
