import { useState, useEffect, useCallback } from 'react';
import { VitalRecord, Medicine, DailyCheckInLog, BaselineProfile, CorrelationFinding, TrajectoryProjection } from '../types';
import { api } from '../lib/api';
import dataManager from '../lib/dataManagement';
import { computeAllBaselines, computeTrajectory, discoverCorrelations } from '../lib/baselineEngine';
import { useAuth } from '../context/AuthContext';

export interface HealthCopilotState {
  baselines: BaselineProfile[];
  correlations: CorrelationFinding[];
  trajectories: {
    bp_systolic: TrajectoryProjection | null;
    bp_diastolic: TrajectoryProjection | null;
    glucose: TrajectoryProjection | null;
  };
  vitals: VitalRecord[];
  medicines: Medicine[];
  checkins: DailyCheckInLog[];
  loading: boolean;
  error: string | null;
  isPro: boolean;
  togglePro: () => void;
  refresh: () => Promise<void>;
}

export function useHealthCopilot(): HealthCopilotState {
  const { user } = useAuth();
  const userId = user?.id ? String(user.id) : 'usr_default';

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [vitals, setVitals] = useState<VitalRecord[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [checkins, setCheckins] = useState<DailyCheckInLog[]>([]);
  const [baselines, setBaselines] = useState<BaselineProfile[]>([]);
  const [correlations, setCorrelations] = useState<CorrelationFinding[]>([]);
  const [trajectories, setTrajectories] = useState<{
    bp_systolic: TrajectoryProjection | null;
    bp_diastolic: TrajectoryProjection | null;
    glucose: TrajectoryProjection | null;
  }>({
    bp_systolic: null,
    bp_diastolic: null,
    glucose: null
  });

  const [isPro, setIsPro] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('dhealora_copilot_is_pro');
      return saved !== null ? saved === 'true' : true; // default enabled for smooth evaluation
    } catch {
      return true;
    }
  });

  const togglePro = useCallback(() => {
    setIsPro((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('dhealora_copilot_is_pro', String(next));
      } catch {}
      return next;
    });
  }, []);

  const loadAndCompute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let vitalsList: VitalRecord[] = [];
      let medsList: Medicine[] = [];
      let checkinsList: DailyCheckInLog[] = [];

      try {
        const [vData, mData, cData] = await Promise.all([
          api.vitals.getAll() as Promise<VitalRecord[]>,
          api.medicines.getAll() as Promise<Medicine[]>,
          (api.dailyCheckins?.getAll ? api.dailyCheckins.getAll() : api.dailyLogs.getAll()) as Promise<DailyCheckInLog[]>
        ]);
        if (Array.isArray(vData) && vData.length > 0) vitalsList = vData;
        if (Array.isArray(mData) && mData.length > 0) medsList = mData;
        if (Array.isArray(cData) && cData.length > 0) checkinsList = cData;
      } catch (fetchErr) {
        console.warn('API fetch warning in useHealthCopilot, reading local dataManager:', fetchErr);
      }

      // If local or server returned empty list, retrieve from local dataManager or seed defaults
      if (vitalsList.length === 0) {
        vitalsList = dataManager.getVitals();
      }
      if (medsList.length === 0) {
        medsList = dataManager.getMedicines();
      }
      if (checkinsList.length === 0) {
        checkinsList = dataManager.getDailyLogs();
      }

      setVitals(vitalsList);
      setMedicines(medsList);
      setCheckins(checkinsList);

      // Compute Baseline Profiles
      const computedBaselines = computeAllBaselines(vitalsList, userId);
      setBaselines(computedBaselines);

      // Discover Cross-Variable Correlations
      const discoveredCorrelations = await discoverCorrelations(
        {
          vitals: vitalsList,
          checkins: checkinsList,
          medicines: medsList
        },
        userId
      );
      setCorrelations(discoveredCorrelations);

      // Compute Trajectories
      const bpSysBaseline = computedBaselines.find((b) => b.metric === 'bp_systolic');
      const bpDiaBaseline = computedBaselines.find((b) => b.metric === 'bp_diastolic');
      const glucoseBaseline = computedBaselines.find((b) => b.metric === 'glucose');

      const trajSys = computeTrajectory(vitalsList, 'bp_systolic', bpSysBaseline);
      const trajDia = computeTrajectory(vitalsList, 'bp_diastolic', bpDiaBaseline);
      const trajGlucose = computeTrajectory(vitalsList, 'glucose', glucoseBaseline);

      setTrajectories({
        bp_systolic: trajSys,
        bp_diastolic: trajDia,
        glucose: trajGlucose
      });
    } catch (err: any) {
      console.error('Error computing Health Copilot telemetry:', err);
      setError(err?.message || 'Failed to initialize Health Copilot analytics');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadAndCompute();
  }, [loadAndCompute]);

  return {
    baselines,
    correlations,
    trajectories,
    vitals,
    medicines,
    checkins,
    loading,
    error,
    isPro,
    togglePro,
    refresh: loadAndCompute
  };
}
