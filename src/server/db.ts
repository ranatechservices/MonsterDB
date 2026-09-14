import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

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
  last_login?: string;
}

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
}

export interface DoctorRecord {
  id: string;
  user_id?: string;
  name: string;
  email?: string;
  phone?: string;
  specialty: string;
  experience?: number;
  qualification?: string;
  hospital_id?: string;
  hospital_name: string;
  registration_no?: string;
  verified: boolean;
  fee: number;
  rating: number;
  review_count?: number;
  total_patients?: number;
  available_days?: string[];
  available_slots?: string[];
  avatar_url?: string;
  about?: string;
  languages?: string[];
  status: 'Active' | 'Under Review' | 'Suspended';
  created_at: string;
}

export interface PatientRecord {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  blood_group?: string;
  gender?: string;
  dob?: string;
  onboarding_completed: boolean;
  status: 'Active' | 'Suspended';
  created_at: string;
}

export interface VitalRecordDB {
  id: string;
  patient_id?: string;
  user_id: string;
  type: 'bp' | 'sugar' | 'heartRate' | 'spo2' | 'temperature' | 'weight';
  value: number;
  systolic?: number;
  diastolic?: number;
  unit: string;
  timestamp: string;
  status?: 'normal' | 'elevated' | 'critical' | 'low';
  notes?: string;
  created_at: string;
}

export interface MedicineRecordDB {
  id: string;
  patient_id?: string;
  user_id: string;
  name: string;
  dosage: string;
  frequency: 'daily' | 'twice_daily' | 'thrice_daily' | 'as_needed' | 'weekly';
  timings: string[];
  meal_timing: 'before_food' | 'after_food' | 'with_food' | 'anytime';
  start_date: string;
  remaining_pills?: number;
  total_pills?: number;
  adherence?: Record<string, boolean>;
  notes?: string;
  created_at: string;
}

export interface AppointmentRecordDB {
  id: string;
  patient_id?: string;
  user_id: string;
  patient_name: string;
  doctor_id?: string;
  doctor_name: string;
  specialty: string;
  hospital_name: string;
  date: string;
  time: string;
  type: 'video_call' | 'in_person' | 'home_visit';
  status: 'upcoming' | 'completed' | 'cancelled';
  notes?: string;
  fee: number;
  created_at: string;
}

export interface LabReportRecordDB {
  id: string;
  patient_id?: string;
  user_id: string;
  patient_name: string;
  title: string;
  date: string;
  category: 'blood' | 'radiology' | 'cardiac' | 'genetic' | 'urine' | 'other';
  file_name: string;
  file_size: string;
  file_url?: string;
  ai_summary: string;
  key_findings: string[];
  anomalies_detected: string[];
  recommendations: string[];
  doctor_reviewed: boolean;
  created_at: string;
}

export interface DailyCheckInRecordDB {
  id: string;
  patient_id?: string;
  user_id: string;
  date: string;
  mood: 'great' | 'good' | 'okay' | 'poor' | 'terrible';
  symptoms: string[];
  sleep_hours?: number;
  water_intake_ml?: number;
  notes?: string;
  created_at: string;
}

export interface CareCircleRecordDB {
  id: string;
  patient_id?: string;
  user_id: string;
  name: string;
  relation: string;
  role: 'guardian' | 'family' | 'doctor' | 'caregiver';
  phone: string;
  email: string;
  permissions: {
    canViewVitals: boolean;
    canViewMedicines: boolean;
    canViewReports: boolean;
    receiveAlerts: boolean;
  };
  created_at: string;
}

export interface SubscriptionRecordDB {
  id: string;
  user_id?: string;
  org_id?: string;
  target_name: string;
  plan: 'Individual Vital' | 'Family Shield 360' | 'Corporate Enterprise Care' | 'Institutional Hospital AI Suite';
  status: 'Active' | 'Expiring' | 'Grace Period' | 'Cancelled';
  amount: number;
  billing_cycle: 'Monthly' | 'Annual';
  renewal_date: string;
  created_at: string;
}

export interface NotificationRecordDB {
  id: string;
  user_id?: string; // empty means global broadcast
  title: string;
  body: string;
  type: 'general' | 'emergency' | 'advisory' | 'system';
  severity: 'info' | 'warning' | 'urgent';
  read: boolean;
  created_at: string;
}

export interface SupportTicketRecordDB {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  subject: string;
  category: 'Billing' | 'ABDM Linkage' | 'Report Analysis' | 'Video Call Issue' | 'General';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  messages: Array<{
    sender: 'user' | 'admin' | 'support';
    text: string;
    timestamp: string;
  }>;
  created_at: string;
}

export interface AuditLogRecordDB {
  id: string;
  actor_admin_id: string;
  actor_name: string;
  action: string;
  target_type: string;
  target_id: string;
  before_state?: any;
  after_state?: any;
  details?: string;
  ip_address?: string;
  timestamp: string;
}

export interface EmployeeRecord {
  id: string;
  organization_id: string;       // FK to OrganizationRecord.id — the company this employee belongs to
  user_id?: string;               // FK to UserRecord.id, set once the employee activates their account (nullable until then)
  employee_code: string;          // company-assigned ID, e.g. "ENG-0231"
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
  wellness_consent_given: boolean;  // employee must explicitly consent before any health data is tracked under the company program
  invited_at?: string;
  invite_token?: string;
  activated_at?: string;
  vitality_points?: number;
  health_streak?: number;
  wellness_score_band?: 'Optimal' | 'Stable' | 'Needs Attention' | 'Elevated Risk';
  created_at: string;
  updated_at: string;
}

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
  target_department?: string; // 'all' or specific department
  participant_ids: string[]; // employee ids
  progress_percentage?: number;
  created_by_user_id?: string;
  created_at: string;
}

export interface WebAuthnCredentialRecord {
  id: string;
  user_id: string;
  credential_id: string;
  public_key: string;
  counter: number;
  transports?: string[];
  device_name: string;
  aaguid?: string;
  created_at: string;
  last_used_at?: string;
  revoked_at?: string | null;
}

export interface ChatMessageRecordDB {
  id: string;
  user_id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  imageUrl?: string;
  feedback?: 'like' | 'dislike';
  suggestedAction?: 'book_appointment' | 'check_medicines' | 'log_vitals' | 'emergency_sos';
  created_at: string;
}

export interface PaymentRecordDB {
  id: string;
  user_id: string;
  related_entity_type: 'marketplace_order' | 'appointment';
  related_entity_id: string;
  amount: number;
  razorpay_order_id: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  status: 'created' | 'paid' | 'failed';
  currency?: string;
  receipt?: string;
  created_at: string;
  updated_at?: string;
}

export interface DatabaseSchema {
  users: UserRecord[];
  organizations: OrganizationRecord[];
  doctors: DoctorRecord[];
  patients: PatientRecord[];
  vitals: VitalRecordDB[];
  medicines: MedicineRecordDB[];
  appointments: AppointmentRecordDB[];
  lab_reports: LabReportRecordDB[];
  daily_checkins: DailyCheckInRecordDB[];
  care_circle: CareCircleRecordDB[];
  subscriptions: SubscriptionRecordDB[];
  notifications: NotificationRecordDB[];
  support_tickets: SupportTicketRecordDB[];
  audit_logs: AuditLogRecordDB[];
  employees: EmployeeRecord[];
  challenges: CompanyChallengeRecord[];
  chat_messages: ChatMessageRecordDB[];
  webauthn_credentials: WebAuthnCredentialRecord[];
  payments: PaymentRecordDB[];
  settings: Record<string, any>;
}

// Initial empty database with master admin only
function createInitialDatabase(): DatabaseSchema {
  // Master Admin hashed password for 'Admin@123'
  const salt = bcrypt.genSaltSync(10);
  const adminHash = bcrypt.hashSync('Admin@123', salt);

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
        created_at: new Date().toISOString(),
        last_login: new Date().toISOString()
      }
    ],
    organizations: [],
    doctors: [],
    patients: [],
    vitals: [],
    medicines: [],
    appointments: [],
    lab_reports: [],
    daily_checkins: [],
    care_circle: [],
    subscriptions: [],
    notifications: [],
    support_tickets: [],
    audit_logs: [
      {
        id: 'aud_init_' + Date.now(),
        actor_admin_id: 'usr_admin_root',
        actor_name: 'System Administrator',
        action: 'SYSTEM_INITIALIZATION',
        target_type: 'DATABASE',
        target_id: 'root',
        details: 'DHealora clean normalized production database initialized.',
        timestamp: new Date().toISOString()
      }
    ],
    employees: [],
    challenges: [],
    chat_messages: [],
    webauthn_credentials: [],
    payments: [],
    settings: {
      admin_email: 'dhealora30@gmail.com',
      system_status: 'operational',
      maintenance_mode: false,
      rbac_enforced: true,
      last_updated: new Date().toISOString()
    }
  };
}

class DatabaseEngine {
  private db: DatabaseSchema;
  private isLoaded: boolean = false;

  constructor() {
    this.ensureDirectory();
    this.db = this.load();
  }

  private ensureDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch (err) {
        console.error('Error creating data directory:', err);
      }
    }
  }

  private load(): DatabaseSchema {
    this.ensureDirectory();
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        // Validate required collections
        const initial = createInitialDatabase();
        const merged: DatabaseSchema = {
          users: parsed.users || initial.users,
          organizations: parsed.organizations || [],
          doctors: parsed.doctors || [],
          patients: parsed.patients || [],
          vitals: parsed.vitals || [],
          medicines: parsed.medicines || [],
          appointments: parsed.appointments || [],
          lab_reports: parsed.lab_reports || [],
          daily_checkins: parsed.daily_checkins || [],
          care_circle: parsed.care_circle || [],
          subscriptions: parsed.subscriptions || [],
          notifications: parsed.notifications || [],
          support_tickets: parsed.support_tickets || [],
          audit_logs: parsed.audit_logs || [],
          employees: parsed.employees || [],
          challenges: parsed.challenges || [],
          chat_messages: parsed.chat_messages || [],
          webauthn_credentials: parsed.webauthn_credentials || [],
          payments: parsed.payments || [],
          settings: parsed.settings || initial.settings
        };
        // Ensure master admin exists
        const hasAdmin = merged.users.some(u => u.email.toLowerCase() === 'dhealora30@gmail.com');
        if (!hasAdmin) {
          merged.users.unshift(initial.users[0]);
        }
        this.isLoaded = true;
        return merged;
      } catch (e) {
        console.warn('Corrupt DB file encountered, initializing clean store:', e);
      }
    }
    const fresh = createInitialDatabase();
    this.saveDirect(fresh);
    this.isLoaded = true;
    return fresh;
  }

  private saveDirect(data: DatabaseSchema) {
    this.ensureDirectory();
    try {
      const tmpFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      console.error('Failed to write database file, fallback sync:', err);
      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
      } catch (inner) {
        console.error('Critical DB save error:', inner);
      }
    }
  }

  public save() {
    this.saveDirect(this.db);
  }

  public getRaw(): DatabaseSchema {
    return this.db;
  }

  // --- Audit Logger ---
  public logAudit(entry: {
    actor_admin_id: string;
    actor_name: string;
    action: string;
    target_type: string;
    target_id: string;
    before_state?: any;
    after_state?: any;
    details?: string;
    ip_address?: string;
  }) {
    const logItem: AuditLogRecordDB = {
      id: 'aud_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      actor_admin_id: entry.actor_admin_id,
      actor_name: entry.actor_name,
      action: entry.action,
      target_type: entry.target_type,
      target_id: entry.target_id,
      before_state: entry.before_state,
      after_state: entry.after_state,
      details: entry.details,
      ip_address: entry.ip_address || '127.0.0.1',
      timestamp: new Date().toISOString()
    };
    this.db.audit_logs.unshift(logItem);
    // Keep max 500 audit logs
    if (this.db.audit_logs.length > 500) {
      this.db.audit_logs = this.db.audit_logs.slice(0, 500);
    }
    this.save();
    return logItem;
  }

  // --- Corporate Wellness & Employee Management Helpers ---
  public getEmployeesByOrg(orgId: string): EmployeeRecord[] {
    return this.db.employees.filter(e => e.organization_id === orgId);
  }

  public getEmployeeById(id: string): EmployeeRecord | undefined {
    return this.db.employees.find(e => e.id === id);
  }

  public getEmployeeByUserId(userId: string): EmployeeRecord | undefined {
    return this.db.employees.find(e => e.user_id === userId);
  }

  public getEmployeeByInviteToken(token: string): EmployeeRecord | undefined {
    return this.db.employees.find(e => e.invite_token === token);
  }

  public createEmployee(data: Partial<EmployeeRecord> & { organization_id: string; full_name: string; email: string }): EmployeeRecord {
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

    this.db.employees.unshift(record);
    this.save();
    return record;
  }

  public updateEmployee(id: string, patch: Partial<EmployeeRecord>): EmployeeRecord | null {
    const index = this.db.employees.findIndex(e => e.id === id);
    if (index === -1) return null;

    const existing = this.db.employees[index];
    const updated: EmployeeRecord = {
      ...existing,
      ...patch,
      updated_at: new Date().toISOString()
    };

    this.db.employees[index] = updated;
    this.save();
    return updated;
  }

  public deleteEmployee(id: string): boolean {
    const emp = this.db.employees.find(e => e.id === id);
    if (!emp) return false;
    emp.employment_status = 'offboarded';
    emp.updated_at = new Date().toISOString();
    this.save();
    return true;
  }

  public getChallengesByOrg(orgId: string, status?: string): CompanyChallengeRecord[] {
    return this.db.challenges.filter(c => {
      if (c.organization_id !== orgId) return false;
      if (status && c.status !== status) return false;
      return true;
    });
  }

  public createChallenge(data: Partial<CompanyChallengeRecord> & { organization_id: string; title: string }): CompanyChallengeRecord {
    const now = new Date().toISOString();
    const id = 'chg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    
    const record: CompanyChallengeRecord = {
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
      created_at: now
    };

    this.db.challenges.unshift(record);
    this.save();
    return record;
  }

  // --- Chat Messages ---
  public getChatMessages(userId: string): ChatMessageRecordDB[] {
    if (!this.db.chat_messages) this.db.chat_messages = [];
    return this.db.chat_messages.filter(m => m.user_id === userId);
  }

  public saveChatMessage(data: {
    id?: string;
    user_id: string;
    sender: 'user' | 'ai';
    text: string;
    timestamp?: string;
    imageUrl?: string;
    feedback?: 'like' | 'dislike';
    suggestedAction?: 'book_appointment' | 'check_medicines' | 'log_vitals' | 'emergency_sos';
    created_at?: string;
  }): ChatMessageRecordDB {
    if (!this.db.chat_messages) this.db.chat_messages = [];
    const record: ChatMessageRecordDB = {
      id: data.id || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: data.user_id,
      sender: data.sender,
      text: data.text,
      timestamp: data.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      imageUrl: data.imageUrl,
      feedback: data.feedback,
      suggestedAction: data.suggestedAction,
      created_at: data.created_at || new Date().toISOString()
    };
    this.db.chat_messages.push(record);
    this.save();
    return record;
  }

  public clearChatMessages(userId: string): void {
    if (!this.db.chat_messages) this.db.chat_messages = [];
    this.db.chat_messages = this.db.chat_messages.filter(m => m.user_id !== userId);
    this.save();
  }

  public updateChatMessageFeedback(id: string, userId: string, feedback?: 'like' | 'dislike'): boolean {
    if (!this.db.chat_messages) this.db.chat_messages = [];
    const msg = this.db.chat_messages.find(m => m.id === id && m.user_id === userId);
    if (!msg) return false;
    msg.feedback = feedback;
    this.save();
    return true;
  }

  // Reset/Clear DB (leaves only master admin)
  public clearAllDemoData(actorId: string = 'usr_admin_root'): void {
    const adminUser = this.db.users.find(u => u.email.toLowerCase() === 'dhealora30@gmail.com') || createInitialDatabase().users[0];
    this.db = {
      users: [adminUser],
      organizations: [],
      doctors: [],
      patients: [],
      vitals: [],
      medicines: [],
      appointments: [],
      lab_reports: [],
      daily_checkins: [],
      care_circle: [],
      subscriptions: [],
      notifications: [],
      support_tickets: [],
      audit_logs: [
        {
          id: 'aud_wipe_' + Date.now(),
          actor_admin_id: actorId,
          actor_name: adminUser.name,
          action: 'DATABASE_CLEARED',
          target_type: 'SYSTEM',
          target_id: 'all',
          details: 'All test and demo data wiped. Production tables clean.',
          timestamp: new Date().toISOString()
        }
      ],
      employees: [],
      challenges: [],
      chat_messages: [],
      webauthn_credentials: this.db.webauthn_credentials || [],
      payments: [],
      settings: {
        admin_email: 'dhealora30@gmail.com',
        system_status: 'operational',
        last_cleared: new Date().toISOString()
      }
    };
    this.save();
  }
}

// Global Singleton
export const dbEngine = new DatabaseEngine();
