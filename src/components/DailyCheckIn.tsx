import React, { useState, useEffect } from 'react';
import { Smile, Frown, Meh, Sun, Moon, Droplet, Zap, CheckCircle2, Activity, Heart, Shield } from 'lucide-react';
import { DailyCheckInLog } from '../types';
import dataManager from '../lib/dataManagement';
import { HealthEventBus } from '../lib/eventBus';

export default function DailyCheckIn() {
  const [mood, setMood] = useState<DailyCheckInLog['mood']>('good');
  const [energyLevel, setEnergyLevel] = useState(4);
  const [sleepHours, setSleepHours] = useState(7.5);
  const [waterIntake, setWaterIntake] = useState(2.2);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [savedToday, setSavedToday] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const logs = dataManager.getDailyLogs();
    const todayLog = logs.find((l) => l.date === todayStr);
    if (todayLog) {
      setMood(todayLog.mood);
      setEnergyLevel(todayLog.energyLevel);
      setSleepHours(todayLog.sleepHours);
      setWaterIntake(todayLog.waterIntakeLiters);
      setSelectedSymptoms(todayLog.symptoms);
      setNotes(todayLog.notes || '');
      setSavedToday(true);
    }
  }, [todayStr]);

  const toggleSymptom = (symp: string) => {
    if (selectedSymptoms.includes(symp)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== symp));
    } else {
      setSelectedSymptoms([...selectedSymptoms, symp]);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const log: DailyCheckInLog = {
      id: 'log_' + todayStr,
      date: todayStr,
      mood,
      energyLevel,
      sleepHours,
      waterIntakeLiters: waterIntake,
      symptoms: selectedSymptoms,
      notes
    };
    dataManager.saveDailyLog(log);
    HealthEventBus.emit('daily_log_updated', log);
    setSavedToday(true);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-100 dark:border-slate-700 shadow-sm">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-700">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Sun className="w-6 h-6 text-amber-500" />
              Daily Health Check-In
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Log how your body feels today to calibrate your personalized Health Twin
            </p>
          </div>
          {savedToday && (
            <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-full flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Logged Today
            </span>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Mood Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
              1. How is your overall mood & feeling?
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
              {[
                { id: 'great', label: 'Great', emoji: '😄' },
                { id: 'good', label: 'Good', emoji: '🙂' },
                { id: 'okay', label: 'Okay', emoji: '😐' },
                { id: 'tired', label: 'Tired', emoji: '🥱' },
                { id: 'stressed', label: 'Stressed', emoji: '😓' },
                { id: 'pain', label: 'In Pain', emoji: '🤕' }
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMood(m.id as any)}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    mood === m.id
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                  }`}
                >
                  <span className="text-2xl block mb-1">{m.emoji}</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Energy & Sleep Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Energy Level
                </span>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{energyLevel} / 5</span>
              </div>
              <input
                id="energy-slider"
                type="range"
                min="1"
                max="5"
                step="1"
                value={energyLevel}
                onChange={(e) => setEnergyLevel(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-600"
              />
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Moon className="w-4 h-4 text-indigo-500" />
                  Sleep Duration
                </span>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{sleepHours} Hours</span>
              </div>
              <input
                id="sleep-slider"
                type="range"
                min="3"
                max="12"
                step="0.5"
                value={sleepHours}
                onChange={(e) => setSleepHours(parseFloat(e.target.value))}
                className="w-full accent-emerald-600"
              />
            </div>
          </div>

          {/* Water Intake */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Droplet className="w-4 h-4 text-blue-500" />
                Water Hydration
              </span>
              <span className="text-sm font-black text-blue-600 dark:text-blue-400">{waterIntake} Liters</span>
            </div>
            <input
              id="water-slider"
              type="range"
              min="0.5"
              max="5"
              step="0.1"
              value={waterIntake}
              onChange={(e) => setWaterIntake(parseFloat(e.target.value))}
              className="w-full accent-blue-600"
            />
          </div>

          {/* Symptoms Checklist */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
              Any Active Symptoms Today?
            </label>
            <div className="flex flex-wrap gap-2">
              {['Headache', 'Cough', 'Fatigue', 'Feverish', 'Body Ache', 'Acid Reflux', 'Dizziness', 'Sore Throat'].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSymptom(s)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                    selectedSymptoms.includes(s)
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 text-rose-700 dark:text-rose-300 font-bold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Personal Daily Reflections / Notes
            </label>
            <textarea
              id="daily-notes-input"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Took 30 minute evening brisk walk, felt energetic..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
            />
          </div>

          <button
            id="save-daily-log-btn"
            type="submit"
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Save & Calibrate Today's Health State</span>
          </button>
        </form>
      </div>
    </div>
  );
}
