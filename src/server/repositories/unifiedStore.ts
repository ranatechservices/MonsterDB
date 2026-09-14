import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

// Unified in-memory data store with atomic persistence and complete relational tables
export interface UnifiedStoreData {
  users: any[];
  organizations: any[];
  doctors: any[];
  patients: any[];
  vitals: any[];
  medicines: any[];
  medicine_events: any[];
  appointments: any[];
  medical_reports: any[];
  report_files: any[];
  report_parameters: any[];
  report_analysis: any[];
  report_findings: any[];
  report_questions: any[];
  report_question_answers: any[];
  care_recommendations: any[];
  report_trends: any[];
  analysis_jobs: any[];
  daily_checkins: any[];
  care_circle_members: any[];
  care_circle_permissions: any[];
  employees: any[];
  company_challenges: any[];
  subscriptions: any[];
  notifications: any[];
  support_tickets: any[];
  chat_messages: any[];
  report_sources: any[];
  health_evidence_links: any[];
  symptoms: any[];
  doctor_notes: any[];
  care_plans: any[];
  care_plan_items: any[];
  followups: any[];
  health_timeline_events: any[];
  health_trends: any[];
  ai_analyses: any[];
  audit_logs: any[];
  user_consents: any[];
  health_profiles: any[];
  settings: Record<string, any>;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const UNIFIED_BACKUP_FILE = path.join(DATA_DIR, 'unified_store.json');

function createSeedData(): UnifiedStoreData {
  const salt = bcrypt.genSaltSync(10);
  const adminHash = bcrypt.hashSync('Admin@123', salt);
  const now = new Date().toISOString();

  return {
    users: [
      {
        id: 'usr_admin_root',
        uuid: '00000000-0000-4000-8000-000000000001',
        name: 'System Administrator (DHealora)',
        email: 'dhealora30@gmail.com',
        password_hash: adminHash,
        role: 'super_admin',
        status: 'active',
        phone: '+91 99999 00000',
        blood_group: 'O+',
        gender: 'Other',
        onboarding_completed: true,
        wellness_consent_given: true,
        created_at: now,
        updated_at: now,
        last_login: now
      }
    ],
    organizations: [
      {
        id: 'org_apollo_delhi',
        name: 'Apollo Super Speciality Hospital, Delhi',
        type: 'hospital',
        admin_user_id: 'usr_admin_root',
        status: 'Active',
        beds: 450,
        tier: 'Platinum Enterprise',
        employees_count: 320,
        active_contracts: 12,
        contact_email: 'contact@apollo-delhi.health',
        contact_phone: '+91 11 2692 5858',
        location: 'Sarita Vihar, New Delhi',
        created_at: now,
        updated_at: now
      },
      {
        id: 'org_techcorp_wellness',
        name: 'TechCorp India Pvt Ltd',
        type: 'company',
        admin_user_id: 'usr_admin_root',
        status: 'Active',
        beds: 0,
        tier: 'Corporate Gold',
        employees_count: 500,
        active_contracts: 1,
        contact_email: 'wellness@techcorp.in',
        contact_phone: '+91 80 4455 6677',
        location: 'Electronic City, Bengaluru',
        created_at: now,
        updated_at: now
      }
    ],
    doctors: [
      {
        id: 'doc_dr_sharma',
        name: 'Dr. Rajesh Sharma',
        email: 'rajesh.sharma@apollo-delhi.health',
        specialty: 'Cardiologist',
        hospital_id: 'org_apollo_delhi',
        hospital_name: 'Apollo Super Speciality Hospital',
        registration_no: 'MCI-2012-88741',
        verified: true,
        fee: 800,
        rating: 4.9,
        total_patients: 1420,
        status: 'Active',
        created_at: now,
        updated_at: now
      },
      {
        id: 'doc_dr_mehta',
        name: 'Dr. Priya Mehta',
        email: 'priya.mehta@care-clinic.in',
        specialty: 'Endocrinologist & Diabetologist',
        hospital_id: 'org_apollo_delhi',
        hospital_name: 'Apollo Super Speciality Hospital',
        registration_no: 'MCI-2015-33921',
        verified: true,
        fee: 700,
        rating: 4.85,
        total_patients: 980,
        status: 'Active',
        created_at: now,
        updated_at: now
      }
    ],
    patients: [],
    vitals: [],
    medicines: [],
    medicine_events: [],
    appointments: [],
    medical_reports: [],
    report_files: [],
    report_parameters: [],
    report_analysis: [],
    report_findings: [],
    report_questions: [],
    report_question_answers: [],
    care_recommendations: [],
    report_trends: [],
    analysis_jobs: [],
    daily_checkins: [],
    care_circle_members: [],
    care_circle_permissions: [],
    employees: [],
    company_challenges: [],
    subscriptions: [],
    notifications: [],
    support_tickets: [],
    chat_messages: [],
    report_sources: [],
    health_evidence_links: [],
    symptoms: [],
    doctor_notes: [],
    care_plans: [],
    care_plan_items: [],
    followups: [],
    health_timeline_events: [],
    health_trends: [],
    ai_analyses: [],
    audit_logs: [
      {
        id: 'aud_' + Date.now(),
        user_id: 'usr_admin_root',
        action: 'STORE_INITIALIZED',
        resource_type: 'SYSTEM',
        resource_id: 'root',
        metadata: { version: '3.0.0', engine: 'UnifiedPostgresStore' },
        status: 'success',
        created_at: now
      }
    ],
    user_consents: [],
    health_profiles: [],
    settings: {
      admin_email: 'dhealora30@gmail.com',
      system_status: 'operational',
      maintenance_mode: false,
      rbac_enforced: true,
      last_updated: now
    }
  };
}

class UnifiedRelationalStore {
  private data: UnifiedStoreData;
  private isLoaded = false;

  constructor() {
    this.data = this.load();
  }

  private ensureDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch (err) {
        console.error('Failed to create data directory:', err);
      }
    }
  }

  private load(): UnifiedStoreData {
    this.ensureDirectory();
    if (fs.existsSync(UNIFIED_BACKUP_FILE)) {
      try {
        const raw = fs.readFileSync(UNIFIED_BACKUP_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        const seed = createSeedData();
        const merged: any = { ...seed };
        for (const key of Object.keys(seed)) {
          if (Array.isArray(seed[key as keyof UnifiedStoreData])) {
            merged[key] = Array.isArray(parsed[key]) ? parsed[key] : seed[key as keyof UnifiedStoreData];
          } else if (typeof seed[key as keyof UnifiedStoreData] === 'object') {
            merged[key] = parsed[key] || seed[key as keyof UnifiedStoreData];
          }
        }
        // Ensure master admin always present
        if (!merged.users.some((u: any) => u.email?.toLowerCase() === 'dhealora30@gmail.com')) {
          merged.users.unshift(seed.users[0]);
        }
        this.isLoaded = true;
        return merged;
      } catch (err) {
        console.warn('Error reading unified store backup, initializing fresh seed:', err);
      }
    }
    const seed = createSeedData();
    this.saveDirect(seed);
    this.isLoaded = true;
    return seed;
  }

  public save() {
    this.saveDirect(this.data);
  }

  private saveDirect(payload: UnifiedStoreData) {
    this.ensureDirectory();
    try {
      const tempPath = `${UNIFIED_BACKUP_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(payload, null, 2), 'utf-8');
      fs.renameSync(tempPath, UNIFIED_BACKUP_FILE);
    } catch (err) {
      try {
        fs.writeFileSync(UNIFIED_BACKUP_FILE, JSON.stringify(payload, null, 2), 'utf-8');
      } catch (inner) {
        console.error('Failed to write unified store:', inner);
      }
    }
  }

  public getTable<T = any>(tableName: keyof UnifiedStoreData): T[] {
    if (!this.data[tableName] || !Array.isArray(this.data[tableName])) {
      (this.data as any)[tableName] = [];
    }
    return this.data[tableName] as unknown as T[];
  }

  public getRaw(): UnifiedStoreData {
    return this.data;
  }

  public updateTable(tableName: keyof UnifiedStoreData, rows: any[]) {
    (this.data as any)[tableName] = rows;
    this.save();
  }
}

export const unifiedStore = new UnifiedRelationalStore();
