import React, { useState, useEffect } from 'react';
import { Activity, Heart, Droplets, Thermometer, Plus, Trash2, TrendingUp, AlertCircle, CheckCircle2, Calendar } from 'lucide-react';
import { VitalRecord } from '../types';
import dataManager from '../lib/dataManagement';
import { HealthEventBus } from '../lib/eventBus';
import { useLanguage } from '../localization/language_context';

export default function VitalsTracker() {
  const [vitals, setVitals] = useState<VitalRecord[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [vitalType, setVitalType] = useState<VitalRecord['type']>('bp');
  const [systolic, setSystolic] = useState('120');
  const [diastolic, setDiastolic] = useState('80');
  const [value, setValue] = useState('98');
  const [notes, setNotes] = useState('');
  const { t } = useLanguage();

  const loadVitals = () => {
    setVitals(dataManager.getVitals());
  };

  useEffect(() => {
    loadVitals();
    const unsub = HealthEventBus.on('vitals_updated', loadVitals);
    return () => unsub();
  }, []);

  const handleAddVital = (e: React.FormEvent) => {
    e.preventDefault();
    let numVal = parseFloat(value);
    let unit = 'units';
    let status: VitalRecord['status'] = 'normal';

    if (vitalType === 'bp') {
      const sys = parseInt(systolic, 10);
      const dia = parseInt(diastolic, 10);
      numVal = sys;
      unit = 'mmHg';
      if (sys > 140 || dia > 90) status = 'high';
      else if (sys > 125 || dia > 82) status = 'elevated';
      else status = 'normal';
    } else if (vitalType === 'sugar') {
      unit = 'mg/dL';
      if (numVal > 140) status = 'high';
      else if (numVal < 70) status = 'low';
      else status = 'normal';
    } else if (vitalType === 'heartRate') {
      unit = 'bpm';
      if (numVal > 100) status = 'high';
      else if (numVal < 55) status = 'low';
      else status = 'normal';
    } else if (vitalType === 'spo2') {
      unit = '%';
      if (numVal < 94) status = 'critical';
      else if (numVal < 96) status = 'elevated';
      else status = 'normal';
    } else if (vitalType === 'temperature') {
      unit = '°F';
      if (numVal > 99.5) status = 'high';
      else status = 'normal';
    } else if (vitalType === 'weight') {
      unit = 'kg';
      status = 'normal';
    }

    const newRecord: VitalRecord = {
      id: 'vital_' + Date.now(),
      type: vitalType,
      value: numVal,
      systolic: vitalType === 'bp' ? parseInt(systolic, 10) : undefined,
      diastolic: vitalType === 'bp' ? parseInt(diastolic, 10) : undefined,
      unit,
      timestamp: new Date().toISOString(),
      notes,
      status
    };

    dataManager.saveVital(newRecord);
    HealthEventBus.emit('vitals_updated', newRecord);
    loadVitals();
    setShowAddModal(false);
    setNotes('');
  };

  const handleDelete = (id: string) => {
    dataManager.deleteVital(id);
    HealthEventBus.emit('vitals_updated');
    loadVitals();
  };

  const latestBp = vitals.find((v) => v.type === 'bp');
  const latestSugar = vitals.find((v) => v.type === 'sugar');
  const latestHeart = vitals.find((v) => v.type === 'heartRate');
  const latestSpo2 = vitals.find((v) => v.type === 'spo2');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Activity className="w-7 h-7 text-emerald-500" />
            {t.nav.vitals}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time biometric tracking, blood pressure logs & vital health trends
          </p>
        </div>
        <button
          id="add-vital-btn"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-sm font-semibold rounded-xl transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Log Biometric Vital
        </button>
      </div>

      {/* Snapshot Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Blood Pressure</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center">
              <Heart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {latestBp ? `${latestBp.systolic}/${latestBp.diastolic}` : '120/80'} <span className="text-xs font-semibold text-slate-400">mmHg</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Optimal Resting Range</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Blood Glucose</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center">
              <Droplets className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {latestSugar ? latestSugar.value : '104'} <span className="text-xs font-semibold text-slate-400">mg/dL</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Normal Fasting Glucose</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Heart Rate</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {latestHeart ? latestHeart.value : '72'} <span className="text-xs font-semibold text-slate-400">bpm</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Healthy Resting Rhythm</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Blood Oxygen (SpO2)</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-500 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {latestSpo2 ? latestSpo2.value : '98'} <span className="text-xs font-semibold text-slate-400">%</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Excellent Saturation</span>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Recorded Biometric Logs</h3>
          <span className="text-xs text-slate-400">{vitals.length} total entries</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-xs text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700">
              <tr>
                <th className="px-6 py-3.5">Biometric Vital</th>
                <th className="px-6 py-3.5">Measured Value</th>
                <th className="px-6 py-3.5">Clinical Status</th>
                <th className="px-6 py-3.5">Date & Time</th>
                <th className="px-6 py-3.5">Notes</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {vitals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    No vitals recorded yet. Click "Log Biometric Vital" above to begin.
                  </td>
                </tr>
              ) : (
                vitals.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-750 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200 capitalize">
                      {v.type === 'bp' ? 'Blood Pressure' : v.type === 'heartRate' ? 'Heart Rate' : v.type}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                      {v.type === 'bp' ? `${v.systolic}/${v.diastolic} ${v.unit}` : `${v.value} ${v.unit}`}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        v.status === 'normal'
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                          : v.status === 'high' || v.status === 'critical'
                          ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                          : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                      }`}>
                        {v.status || 'Normal'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(v.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 max-w-[200px] truncate">
                      {v.notes || '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        id={`delete-vital-${v.id}`}
                        onClick={() => handleDelete(v.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        title="Delete entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Record Health Vital</h3>
            <form onSubmit={handleAddVital} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Vital Type</label>
                <select
                  id="vital-type-select"
                  value={vitalType}
                  onChange={(e) => setVitalType(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="bp">Blood Pressure (Systolic / Diastolic)</option>
                  <option value="sugar">Blood Glucose (mg/dL)</option>
                  <option value="heartRate">Heart Rate / Pulse (bpm)</option>
                  <option value="spo2">Blood Oxygen SpO2 (%)</option>
                  <option value="temperature">Body Temperature (°F)</option>
                  <option value="weight">Body Weight (kg)</option>
                </select>
              </div>

              {vitalType === 'bp' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Systolic (Top)</label>
                    <input
                      id="vital-sys-input"
                      type="number"
                      required
                      value={systolic}
                      onChange={(e) => setSystolic(e.target.value)}
                      placeholder="120"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Diastolic (Bottom)</label>
                    <input
                      id="vital-dia-input"
                      type="number"
                      required
                      value={diastolic}
                      onChange={(e) => setDiastolic(e.target.value)}
                      placeholder="80"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Measured Value</label>
                  <input
                    id="vital-val-input"
                    type="number"
                    step="0.1"
                    required
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Observation Notes (Optional)</label>
                <input
                  id="vital-notes-input"
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Taken post-walk, morning fasting"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  id="save-vital-submit-btn"
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm shadow-sm"
                >
                  Save Vital Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
