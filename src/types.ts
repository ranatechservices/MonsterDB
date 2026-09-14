export type Language = 'en' | 'hi';

export type UserRole =
  | 'super_admin'
  | 'hospital_admin'
  | 'clinic_admin'
  | 'org_admin'
  | 'company_admin'
  | 'doctor'
  | 'patient'
  | 'admin'
  | 'System Admin'
  | 'Hospital Admin'
  | 'Clinic Admin'
  | 'Company Admin'
  | 'Doctor'
  | 'Staff'
  | 'Caregiver'
  | 'Employee'
  | 'Patient';

export interface UserProfile {
  id: string | number;
  uuid?: string;
  name: string;
  fullName?: string;
  email: string;
  phone?: string;
  role: UserRole;
  gender?: 'Male' | 'Female' | 'Other';
  dob?: string;
  bloodGroup?: string;
  language?: Language;
  profilePhotoUrl?: string;
  onboardingCompleted?: boolean;
  companyId?: string | number;
  organizationId?: string | number;
  organization_id?: string;
  wellness_consent_given?: boolean;
  createdAt?: string;
  emergencyContacts?: EmergencyContact[];
}

export type User = UserProfile;


export interface Employee {
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

export interface BulkImportResult {
  row: number;
  success: boolean;
  error?: string;
  employee?: Employee;
}

export interface CompanyChallenge {
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
}

export interface EmployeeHealthSummary {
  employee_id: string;
  wellness_consent_given: boolean;
  vitality_points: number;
  health_streak: number;
  wellness_score_band: 'Optimal' | 'Stable' | 'Needs Attention' | 'Elevated Risk';
  active_challenges_count: number;
  participation_status: string;
}

export interface DepartmentAnalytics {
  department: string;
  total_employees: number;
  consenting_employees: number;
  participation_rate: number;
  average_wellness_score: number;
  active_streaks: number;
}

export interface HealthPlan {
  id: string;
  title: string;
  description: string;
  price: number;
  interval: 'monthly' | 'yearly';
  features: string[];
}


export interface EmergencyContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
  notifyOnSos: boolean;
}

export interface VitalRecord {
  id: string;
  type: 'bp' | 'sugar' | 'heartRate' | 'spo2' | 'temperature' | 'weight';
  systolic?: number;
  diastolic?: number;
  value: number;
  unit: string;
  timestamp: string;
  notes?: string;
  status?: 'normal' | 'elevated' | 'high' | 'critical' | 'low';
}

export interface Medicine {
  id: string;
  name: string;
  dosage: string;
  frequency: 'daily' | 'twice_daily' | 'thrice_daily' | 'as_needed' | 'custom';
  timings: string[]; // e.g. ["08:00", "20:00"]
  mealTiming: 'before_food' | 'after_food' | 'with_food' | 'empty_stomach';
  startDate: string;
  endDate?: string;
  remainingPills?: number;
  totalPills?: number;
  notes?: string;
  adherence?: Record<string, boolean>; // date_time -> taken
}

export interface Appointment {
  id: string;
  doctorName: string;
  specialty: string;
  hospitalName?: string;
  date: string;
  time: string;
  type: 'in_person' | 'video_call' | 'telephonic';
  status: 'upcoming' | 'completed' | 'cancelled';
  notes?: string;
  meetingLink?: string;
  fee?: number;
}

export interface DetectedCondition {
  id: string; // slug, e.g. "hypothyroidism"
  name: string; // display name as it should appear highlighted, e.g. "Hypothyroidism"
  mentionContext: string; // the sentence/phrase from the analysis where this was flagged
  whatItIs: string; // 2-3 sentence plain-language explanation
  earlySymptoms: string[]; // typical starting/early symptoms
  precautions: string[]; // what the patient should do — diet, monitoring, lifestyle, when to seek urgent care
  severity: 'watch' | 'discuss_with_doctor' | 'seek_prompt_care'; // how urgently they should act
}

export interface LabReport {
  id: string;
  title: string;
  date: string;
  category: 'blood' | 'radiology' | 'pathology' | 'cardiac' | 'general';
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
  aiSummary?: string;
  keyFindings?: string[];
  anomaliesDetected?: string[];
  recommendations?: string[];
  doctorQuestions?: string[];
  detectedConditions?: DetectedCondition[];
  doctorReviewed?: boolean;
}

export interface DailyCheckInLog {
  id: string;
  date: string;
  mood: 'great' | 'good' | 'okay' | 'tired' | 'stressed' | 'pain';
  energyLevel: number; // 1-5
  sleepHours: number;
  waterIntakeLiters: number;
  symptoms: string[];
  notes?: string;
}

export interface CareCircleMember {
  id: string;
  name: string;
  relation: string;
  role: 'family' | 'caregiver' | 'guardian' | 'emergency_contact';
  phone: string;
  email?: string;
  permissions: {
    canViewVitals: boolean;
    canViewMedicines: boolean;
    canViewReports: boolean;
    receiveAlerts: boolean;
  };
  avatar?: string;
}

export interface Doctor {
  id: string | number;
  name: string;
  specialty: string;
  experience: number;
  qualification: string;
  hospital: string;
  rating: number;
  reviewCount: number;
  consultationFee: number;
  availableDays: string[];
  availableSlots: string[];
  avatarUrl: string;
  about?: string;
  languages: string[];
}

export interface HealthMetricSummary {
  bmi: number;
  bmiCategory: string;
  bloodPressureAvg: string;
  sugarFastAvg: number;
  dailyStreak: number;
  adherenceRate: number;
  riskScore: number;
  healthTwinStatus: 'optimal' | 'stable' | 'attention_required' | 'critical';
}

export type SuggestedActionType = 'book_appointment' | 'check_medicines' | 'log_vitals' | 'emergency_sos';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  imageUrl?: string;
  feedback?: 'like' | 'dislike';
  suggestedAction?: SuggestedActionType;
  safetyFlag?: 'emergency' | 'concerning' | null;
  created_at?: string;
}

// -------------------------------------------------------------
// UNIFIED AI HEALTH COPILOT & BASELINE DATA MODELS
// -------------------------------------------------------------

export interface BaselineProfile {
  userId: string;
  metric: 'bp_systolic' | 'bp_diastolic' | 'glucose' | 'weight' | 'heartRate';
  personalMean: number;
  personalStdDev: number;
  sampleSize: number; // number of readings used to compute this baseline
  confidence: 'low' | 'medium' | 'high'; // low if sampleSize < 10, medium < 30, high >= 30
  lastComputedAt: string; // ISO timestamp
}

export interface CorrelationFinding {
  id: string;
  variableA: string; // e.g. "sleepHours < 6"
  variableB: string; // e.g. "glucose next-day avg"
  direction: 'positive' | 'negative';
  strength: number; // 0-1, e.g. Pearson correlation coefficient or simple effect-size proxy
  sampleSize: number;
  humanSummary: string; // LLM-generated plain-language explanation
  discoveredAt: string;
}

export interface TrajectoryProjection {
  id: string;
  metric: 'bp_systolic' | 'bp_diastolic' | 'glucose';
  currentTrend: 'rising' | 'falling' | 'stable';
  projectedValueIn30Days: number;
  projectedClinicalStage?: string; // e.g. "Stage 2 Hypertension" — only if a named clinical threshold would be crossed
  weeksUntilThresholdCrossed?: number;
  confidenceNote: string; // must always state this is a pattern-based projection, not a diagnosis
  generatedAt: string;
}

export interface DoctorBrief {
  id: string;
  generatedAt: string;
  periodCovered: { from: string; to: string };
  vitalsSummary: string;
  medicationSummary: string;
  adherenceSummary: string;
  notableSymptoms: string[];
  correlationHighlights: CorrelationFinding[];
  suggestedQuestionsForDoctor: string[];
  pdfUrl?: string;
}

export interface SimulationScenario {
  id: string;
  userPrompt: string; // raw "what if" text from the user
  parsedIntervention: string; // structured summary, e.g. "daily 30-min walk for 12 weeks"
  baselineTrajectory: number[]; // projected values with no change
  simulatedTrajectory: number[]; // projected values with the intervention applied
  basisNote: string; // must explain this is extrapolated from the user's own historical response patterns
  createdAt: string;
}

export interface FamilyDigest {
  id: string;
  weekOf: string;
  recipientCareCircleIds: string[]; // must be opt-in per member
  summaryText: string;
  flaggedForAttention: boolean;
}

