import React, { useState, useEffect } from 'react';
import { Pill, Plus, Check, Trash2, Clock, AlertCircle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Medicine } from '../types';
import dataManager from '../lib/dataManagement';
import { HealthEventBus } from '../lib/eventBus';
import { useLanguage } from '../localization/language_context';

export default function MedicineTracker() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState<Medicine['frequency']>('daily');
  const [timings, setTimings] = useState('08:00');
  const [mealTiming, setMealTiming] = useState<Medicine['mealTiming']>('after_food');
  const [totalPills, setTotalPills] = useState('30');
  const [notes, setNotes] = useState('');
  const { t } = useLanguage();

  const loadMeds = () => {
    setMedicines(dataManager.getMedicines());
  };

  useEffect(() => {
    loadMeds();
    const unsub = HealthEventBus.on('medicines_updated', loadMeds);
    return () => unsub();
  }, []);

  const handleAddMedicine = (e: React.FormEvent) => {
    e.preventDefault();
    const newMed: Medicine = {
      id: 'med_' + Date.now(),
      name,
      dosage,
      frequency,
      timings: timings.split(',').map((t) => t.trim()),
      mealTiming,
      startDate: new Date().toISOString().split('T')[0],
      remainingPills: parseInt(totalPills, 10) || 30,
      totalPills: parseInt(totalPills, 10) || 30,
      notes,
      adherence: {}
    };

    dataManager.saveMedicine(newMed);
    HealthEventBus.emit('medicines_updated');
    loadMeds();
    setShowAddModal(false);
    setName('');
    setDosage('');
    setNotes('');
  };

  const toggleTakenToday = (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    dataManager.logMedicineTaken(id, today);
    HealthEventBus.emit('medicines_updated');
    loadMeds();
  };

  const handleDelete = (id: string) => {
    dataManager.deleteMedicine(id);
    HealthEventBus.emit('medicines_updated');
    loadMeds();
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Pill className="w-7 h-7 text-emerald-500" />
            {t.nav.medicines}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Smart dosage reminders, refill warnings, and prescription schedule management
          </p>
        </div>
        <button
          id="add-medicine-btn"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-sm font-semibold rounded-xl transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Prescription Medicine
        </button>
      </div>

      {/* Medication Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {medicines.map((med) => {
          const isTakenToday = med.adherence && med.adherence[todayStr];
          const isLowStock = med.remainingPills !== undefined && med.remainingPills <= 5;

          return (
            <div
              key={med.id}
              className={`bg-white dark:bg-slate-800 rounded-3xl border p-6 shadow-sm transition-all flex flex-col justify-between ${
                isTakenToday
                  ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/10'
                  : 'border-slate-100 dark:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <Pill className="w-5 h-5" />
                  </div>
                  <button
                    id={`delete-med-${med.id}`}
                    onClick={() => handleDelete(med.id)}
                    className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                  {med.name}
                </h3>
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {med.dosage} • {(med.frequency || 'daily').replace(/_/g, ' ')}
                </span>

                <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-500" />
                    <span>{Array.isArray(med.timings) ? med.timings.join(', ') : (med.timings || '')} {med.mealTiming ? `(${med.mealTiming.replace(/_/g, ' ')})` : ''}</span>
                  </div>
                  {med.notes && (
                    <p className="text-slate-500 italic bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      "{med.notes}"
                    </p>
                  )}
                </div>

                {isLowStock && (
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/40 p-2 rounded-xl border border-amber-200 dark:border-amber-900/50">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Refill alert: {med.remainingPills} doses remaining</span>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Stock: <strong className="text-slate-700 dark:text-slate-200">{med.remainingPills ?? 'N/A'}</strong> left
                </span>
                <button
                  id={`toggle-taken-${med.id}`}
                  onClick={() => toggleTakenToday(med.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isTakenToday
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                  }`}
                >
                  {isTakenToday ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Taken Today
                    </>
                  ) : (
                    'Mark as Taken'
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Add Prescription</h3>
            <form onSubmit={handleAddMedicine} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Medication Name</label>
                <input
                  id="med-name-input"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Metformin 500mg"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Dosage</label>
                  <input
                    id="med-dosage-input"
                    type="text"
                    required
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    placeholder="1 tablet"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Frequency</label>
                  <select
                    id="med-freq-select"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="daily">Once Daily</option>
                    <option value="twice_daily">Twice Daily</option>
                    <option value="thrice_daily">Thrice Daily</option>
                    <option value="as_needed">As Needed (SOS)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Daily Timings (24h)</label>
                  <input
                    id="med-time-input"
                    type="text"
                    required
                    value={timings}
                    onChange={(e) => setTimings(e.target.value)}
                    placeholder="08:00, 20:00"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Meal Timing</label>
                  <select
                    id="med-meal-select"
                    value={mealTiming}
                    onChange={(e) => setMealTiming(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="after_food">After Food</option>
                    <option value="before_food">Before Food</option>
                    <option value="with_food">With Food</option>
                    <option value="empty_stomach">Empty Stomach</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Total Pill Stock Quantity</label>
                <input
                  id="med-stock-input"
                  type="number"
                  value={totalPills}
                  onChange={(e) => setTotalPills(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Doctor's Clinical Notes</label>
                <input
                  id="med-notes-input"
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Take with a glass of warm water"
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
                  id="save-med-submit-btn"
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm shadow-sm"
                >
                  Save Prescription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
