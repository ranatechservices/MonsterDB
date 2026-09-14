import { unifiedStore } from './unifiedStore';
import { isPgActive, queryPg } from '../db/postgres';

export interface TimelineEventRecord {
  id: string;
  user_id: string;
  event_type: 'LAB_REPORT' | 'VITAL_READING' | 'MEDICATION_STARTED' | 'MEDICATION_ADHERENCE' | 'DOCTOR_VISIT' | 'SYMPTOM_LOGGED' | 'DAILY_CHECKIN' | 'FOLLOWUP_COMPLETED' | 'DOCTOR_NOTE';
  event_date: string;
  title: string;
  summary: string;
  severity: 'normal' | 'attention' | 'alert' | 'critical';
  source_entity_type: string;
  source_entity_id: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export class TimelineRepository {
  async getLiveTimeline(userId: string, limit: number = 100): Promise<TimelineEventRecord[]> {
    const events: TimelineEventRecord[] = [];

    // 1. Medical Reports
    const reports = unifiedStore.getTable<any>('medical_reports').filter(r => r.user_id === userId && !r.deleted_at);
    for (const r of reports) {
      let sev: TimelineEventRecord['severity'] = 'normal';
      if (r.attention_level === 'URGENT_MEDICAL_REVIEW') sev = 'critical';
      else if (r.attention_level === 'HIGH_ATTENTION') sev = 'alert';
      else if (r.attention_level === 'MODERATE_ATTENTION') sev = 'attention';

      events.push({
        id: 'tle_rep_' + r.id,
        user_id: userId,
        event_type: 'LAB_REPORT',
        event_date: r.report_date ? `${r.report_date}T09:00:00Z` : r.created_at,
        title: `Lab Report: ${r.title}`,
        summary: r.ai_summary || `Analyzed ${r.category || 'lab'} report from ${r.lab_name || 'diagnostic lab'}.`,
        severity: sev,
        source_entity_type: 'medical_reports',
        source_entity_id: r.id,
        metadata: {
          category: r.category,
          attention_level: r.attention_level,
          doctor_reviewed: r.doctor_reviewed
        },
        created_at: r.created_at
      });
    }

    // 2. Vitals
    const vitals = unifiedStore.getTable<any>('vitals').filter(v => v.user_id === userId);
    for (const v of vitals) {
      let sev: TimelineEventRecord['severity'] = 'normal';
      if (v.status === 'critical') sev = 'critical';
      else if (v.status === 'elevated' || v.status === 'low') sev = 'attention';

      let displayVal = `${v.value} ${v.unit}`;
      if (v.type === 'bp' && v.systolic && v.diastolic) {
        displayVal = `${v.systolic}/${v.diastolic} ${v.unit}`;
      }

      events.push({
        id: 'tle_vit_' + v.id,
        user_id: userId,
        event_type: 'VITAL_READING',
        event_date: v.timestamp || v.created_at,
        title: `Vital Recorded: ${v.type.toUpperCase()}`,
        summary: `Value: ${displayVal} (${v.status || 'normal'})`,
        severity: sev,
        source_entity_type: 'vitals',
        source_entity_id: v.id,
        metadata: { type: v.type, value: v.value, unit: v.unit, status: v.status },
        created_at: v.created_at
      });
    }

    // 3. Medicines
    const meds = unifiedStore.getTable<any>('medicines').filter(m => m.user_id === userId && !m.deleted_at);
    for (const m of meds) {
      events.push({
        id: 'tle_med_' + m.id,
        user_id: userId,
        event_type: 'MEDICATION_STARTED',
        event_date: m.start_date ? `${m.start_date}T08:00:00Z` : m.created_at,
        title: `Prescription Active: ${m.name}`,
        summary: `${m.dosage} (${m.frequency.replace('_', ' ')}) - ${m.meal_timing.replace('_', ' ')}`,
        severity: 'normal',
        source_entity_type: 'medicines',
        source_entity_id: m.id,
        metadata: { dosage: m.dosage, frequency: m.frequency },
        created_at: m.created_at
      });
    }

    // 4. Appointments
    const apts = unifiedStore.getTable<any>('appointments').filter(a => a.user_id === userId);
    for (const a of apts) {
      events.push({
        id: 'tle_apt_' + a.id,
        user_id: userId,
        event_type: 'DOCTOR_VISIT',
        event_date: `${a.date}T${a.time || '10:00'}:00Z`,
        title: `Doctor Consultation: ${a.doctor_name}`,
        summary: `${a.specialty} at ${a.hospital_name} (${a.type.replace('_', ' ')} - ${a.status})`,
        severity: a.status === 'cancelled' ? 'attention' : 'normal',
        source_entity_type: 'appointments',
        source_entity_id: a.id,
        metadata: { specialty: a.specialty, status: a.status, doctor: a.doctor_name },
        created_at: a.created_at
      });
    }

    // 5. Doctor Notes
    const notes = unifiedStore.getTable<any>('doctor_notes').filter(n => n.user_id === userId);
    for (const n of notes) {
      events.push({
        id: 'tle_dn_' + n.id,
        user_id: userId,
        event_type: 'DOCTOR_NOTE',
        event_date: `${n.visit_date}T11:00:00Z`,
        title: `Doctor Clinical Note: ${n.doctor_name}`,
        summary: `Chief Complaint: ${n.chief_complaint}. ${n.diagnosis_impressions || ''}`,
        severity: 'normal',
        source_entity_type: 'doctor_notes',
        source_entity_id: n.id,
        metadata: { specialty: n.specialty, chief_complaint: n.chief_complaint },
        created_at: n.created_at
      });
    }

    // 6. Daily Checkins
    const checkins = unifiedStore.getTable<any>('daily_checkins').filter(c => c.user_id === userId);
    for (const c of checkins) {
      const symList = Array.isArray(c.symptoms) && c.symptoms.length > 0 ? c.symptoms.join(', ') : 'None';
      events.push({
        id: 'tle_chk_' + c.id,
        user_id: userId,
        event_type: 'DAILY_CHECKIN',
        event_date: `${c.date}T20:00:00Z`,
        title: `Daily Health Check-In (Mood: ${c.mood})`,
        summary: `Symptoms: ${symList}. Water: ${c.water_intake_ml || 0}ml, Sleep: ${c.sleep_hours || 0}h`,
        severity: c.mood === 'poor' || c.mood === 'terrible' ? 'attention' : 'normal',
        source_entity_type: 'daily_checkins',
        source_entity_id: c.id,
        metadata: { mood: c.mood, symptoms: c.symptoms },
        created_at: c.created_at
      });
    }

    // 7. Follow-ups completed
    const followups = unifiedStore.getTable<any>('followups').filter(f => f.user_id === userId);
    for (const f of followups) {
      if (f.status === 'COMPLETED') {
        events.push({
          id: 'tle_fol_' + f.id,
          user_id: userId,
          event_type: 'FOLLOWUP_COMPLETED',
          event_date: f.completed_at || f.updated_at || f.created_at,
          title: `Follow-up Completed: ${f.title}`,
          summary: f.description || `Actioned medical followup item in category ${f.category}`,
          severity: 'normal',
          source_entity_type: 'followups',
          source_entity_id: f.id,
          metadata: { category: f.category, priority: f.priority },
          created_at: f.created_at
        });
      }
    }

    // Sort descending by event_date
    return events
      .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())
      .slice(0, limit);
  }
}

export const timelineRepository = new TimelineRepository();
