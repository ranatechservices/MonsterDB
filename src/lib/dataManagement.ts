import { VitalRecord, Medicine, Appointment, LabReport, DailyCheckInLog, CareCircleMember } from '../types';
import { api } from './api';

const STORAGE_KEYS = {
  VITALS: 'dhealora_vitals_records',
  MEDICINES: 'dhealora_medicines',
  APPOINTMENTS: 'dhealora_appointments',
  REPORTS: 'dhealora_reports',
  DAILY_LOGS: 'dhealora_daily_logs',
  CARE_CIRCLE: 'dhealora_care_circle',
};

// Initial state is strictly clean & empty - NO hardcoded demo/seed data
class DataManager {
  private isInitialized = false;

  constructor() {
    this.initRealtime();
    this.syncFromBackend();
  }

  private initRealtime() {
    if (typeof window !== 'undefined') {
      api.realtime.subscribe((event) => {
        if (!event) return;
        // On backend event, refresh relevant collection cache
        this.syncFromBackend();
      });
    }
  }

  public async syncFromBackend() {
    try {
      const [vitals, meds, appts, reps, logs, circle] = await Promise.all([
        api.vitals.getAll().catch(() => []),
        api.medicines.getAll().catch(() => []),
        api.appointments.getAll().catch(() => []),
        api.reports.getAll().catch(() => []),
        api.dailyLogs.getAll().catch(() => []),
        api.careCircle.getAll().catch(() => [])
      ]);

      if (Array.isArray(vitals)) localStorage.setItem(STORAGE_KEYS.VITALS, JSON.stringify(vitals));
      if (Array.isArray(meds)) localStorage.setItem(STORAGE_KEYS.MEDICINES, JSON.stringify(meds));
      if (Array.isArray(appts)) localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appts));
      if (Array.isArray(reps)) localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reps));
      if (Array.isArray(logs)) localStorage.setItem(STORAGE_KEYS.DAILY_LOGS, JSON.stringify(logs));
      if (Array.isArray(circle)) localStorage.setItem(STORAGE_KEYS.CARE_CIRCLE, JSON.stringify(circle));

      this.isInitialized = true;
    } catch (e) {
      // Offline fallback
    }
  }

  // --- VITALS ---
  public getVitals(): VitalRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.VITALS);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  public saveVital(vital: VitalRecord): VitalRecord[] {
    const vitals = this.getVitals();
    const updated = [vital, ...vitals.filter((v) => v && v.id !== vital.id)];
    localStorage.setItem(STORAGE_KEYS.VITALS, JSON.stringify(updated));
    // Persist to real backend API
    api.vitals.save(vital).catch(err => console.warn('Failed to sync vital to server:', err));
    return updated;
  }

  public deleteVital(id: string): VitalRecord[] {
    const vitals = this.getVitals().filter((v) => v && v.id !== id);
    localStorage.setItem(STORAGE_KEYS.VITALS, JSON.stringify(vitals));
    api.vitals.delete(id).catch(err => console.warn('Failed to delete vital on server:', err));
    return vitals;
  }

  // --- MEDICINES ---
  public getMedicines(): Medicine[] {
    const raw = localStorage.getItem(STORAGE_KEYS.MEDICINES);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  public saveMedicine(med: Medicine): Medicine[] {
    const meds = this.getMedicines();
    const updated = [med, ...meds.filter((m) => m && m.id !== med.id)];
    localStorage.setItem(STORAGE_KEYS.MEDICINES, JSON.stringify(updated));
    api.medicines.save(med).catch(err => console.warn('Failed to sync medicine to server:', err));
    return updated;
  }

  public deleteMedicine(id: string): Medicine[] {
    const meds = this.getMedicines().filter((m) => m && m.id !== id);
    localStorage.setItem(STORAGE_KEYS.MEDICINES, JSON.stringify(meds));
    api.medicines.delete(id).catch(err => console.warn('Failed to delete medicine on server:', err));
    return meds;
  }

  public logMedicineTaken(id: string, dateStr: string): Medicine[] {
    const meds = this.getMedicines();
    const updated = meds.map((m) => {
      if (m && m.id === id) {
        const adh = m.adherence || {};
        const wasTaken = !!adh[dateStr];
        adh[dateStr] = !wasTaken;
        const remaining = m.remainingPills !== undefined
          ? Math.max(0, m.remainingPills + (wasTaken ? 1 : -1))
          : undefined;
        return { ...m, adherence: adh, remainingPills: remaining };
      }
      return m;
    });
    localStorage.setItem(STORAGE_KEYS.MEDICINES, JSON.stringify(updated));
    api.medicines.take(id, dateStr).catch(err => console.warn('Failed to sync medicine adherence to server:', err));
    return updated;
  }

  // --- APPOINTMENTS ---
  public getAppointments(): Appointment[] {
    const raw = localStorage.getItem(STORAGE_KEYS.APPOINTMENTS);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  public saveAppointment(appt: Appointment): Appointment[] {
    const appts = this.getAppointments();
    const updated = [appt, ...appts.filter((a) => a && a.id !== appt.id)];
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(updated));
    api.appointments.save(appt).catch(err => console.warn('Failed to sync appointment to server:', err));
    return updated;
  }

  public deleteAppointment(id: string): Appointment[] {
    const appts = this.getAppointments().filter((a) => a && a.id !== id);
    localStorage.setItem(STORAGE_KEYS.APPOINTMENTS, JSON.stringify(appts));
    api.appointments.delete(id).catch(err => console.warn('Failed to delete appointment on server:', err));
    return appts;
  }

  // --- LAB REPORTS ---
  public getReports(): LabReport[] {
    const raw = localStorage.getItem(STORAGE_KEYS.REPORTS);
    if (!raw) return [];
    try {
      const list: LabReport[] = JSON.parse(raw);
      if (!Array.isArray(list)) return [];
      const seen = new Set<string>();
      return list.filter((r) => {
        if (!r || !r.id || seen.has(r.id)) return false;
        seen.add(r.id);
        return true;
      });
    } catch {
      return [];
    }
  }

  public saveReport(report: LabReport): LabReport[] {
    const reports = this.getReports();
    const updated = [report, ...reports.filter((r) => r && r.id !== report.id)];
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(updated));
    api.reports.save(report).catch(err => console.warn('Failed to sync report to server:', err));
    return updated;
  }

  public deleteReport(id: string): LabReport[] {
    const reports = this.getReports().filter((r) => r && r.id !== id);
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
    api.reports.delete(id).catch(err => console.warn('Failed to delete report on server:', err));
    return reports;
  }

  // --- DAILY LOGS ---
  public getDailyLogs(): DailyCheckInLog[] {
    const raw = localStorage.getItem(STORAGE_KEYS.DAILY_LOGS);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  public saveDailyLog(log: DailyCheckInLog): DailyCheckInLog[] {
    const logs = this.getDailyLogs();
    const updated = [log, ...logs.filter((l) => l && l.date !== log.date)];
    localStorage.setItem(STORAGE_KEYS.DAILY_LOGS, JSON.stringify(updated));
    api.dailyLogs.save(log).catch(err => console.warn('Failed to sync daily log to server:', err));
    return updated;
  }

  // --- CARE CIRCLE ---
  public getCareCircle(): CareCircleMember[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CARE_CIRCLE);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  public saveCareCircleMember(member: CareCircleMember): CareCircleMember[] {
    const circle = this.getCareCircle();
    const updated = [member, ...circle.filter((c) => c && c.id !== member.id)];
    localStorage.setItem(STORAGE_KEYS.CARE_CIRCLE, JSON.stringify(updated));
    api.careCircle.save(member).catch(err => console.warn('Failed to sync care circle to server:', err));
    return updated;
  }

  public deleteCareCircleMember(id: string): CareCircleMember[] {
    const circle = this.getCareCircle().filter((c) => c && c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CARE_CIRCLE, JSON.stringify(circle));
    api.careCircle.delete(id).catch(err => console.warn('Failed to delete care circle on server:', err));
    return circle;
  }

  public exportAllData() {
    return {
      vitals: this.getVitals(),
      medicines: this.getMedicines(),
      appointments: this.getAppointments(),
      reports: this.getReports(),
      dailyLogs: this.getDailyLogs(),
      careCircle: this.getCareCircle(),
      exportedAt: new Date().toISOString()
    };
  }

  public resetToDefaults() {
    localStorage.removeItem(STORAGE_KEYS.VITALS);
    localStorage.removeItem(STORAGE_KEYS.MEDICINES);
    localStorage.removeItem(STORAGE_KEYS.APPOINTMENTS);
    localStorage.removeItem(STORAGE_KEYS.REPORTS);
    localStorage.removeItem(STORAGE_KEYS.DAILY_LOGS);
    localStorage.removeItem(STORAGE_KEYS.CARE_CIRCLE);
    this.syncFromBackend();
  }
}

export const dataManager = new DataManager();
export default dataManager;
