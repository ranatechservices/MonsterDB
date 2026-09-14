import React, { useState, useEffect } from 'react';
import {
  Heart,
  Activity,
  Pill,
  FileText,
  Calendar,
  Sparkles,
  TrendingUp,
  AlertOctagon,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Droplets,
  Zap,
  Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../localization/language_context';
import dataManager from '../lib/dataManagement';
import { HealthEventBus } from '../lib/eventBus';
import HomeQuickAIChat from './HomeQuickAIChat';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [vitals, setVitals] = useState(dataManager.getVitals());
  const [medicines, setMedicines] = useState(dataManager.getMedicines());
  const [reports, setReports] = useState(dataManager.getReports());
  const [appointments, setAppointments] = useState(dataManager.getAppointments());

  const refreshState = () => {
    setVitals(dataManager.getVitals());
    setMedicines(dataManager.getMedicines());
    setReports(dataManager.getReports());
    setAppointments(dataManager.getAppointments());
  };

  useEffect(() => {
    refreshState();
    const unsub1 = HealthEventBus.on('vitals_updated', refreshState);
    const unsub2 = HealthEventBus.on('medicines_updated', refreshState);
    const unsub3 = HealthEventBus.on('reports_updated', refreshState);
    const unsub4 = HealthEventBus.on('appointments_updated', refreshState);
    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
    };
  }, []);

  const safeVitals = Array.isArray(vitals) ? vitals : [];
  const safeMedicines = Array.isArray(medicines) ? medicines : [];
  const safeReports = Array.isArray(reports) ? reports : [];
  const safeAppointments = Array.isArray(appointments) ? appointments : [];

  const latestBp = safeVitals.find((v) => v && v.type === 'bp');
  const latestSugar = safeVitals.find((v) => v && v.type === 'sugar');
  const latestHeart = safeVitals.find((v) => v && v.type === 'heartRate');
  const todayStr = new Date().toISOString().split('T')[0];
  const medsTodayTaken = safeMedicines.filter((m) => m && m.adherence && m.adherence[todayStr]).length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold mb-3 text-emerald-100">
            <Sparkles className="w-3.5 h-3.5" />
            ABDM Aligned • Clinical AI Assistant Active
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {t.dashboard.greeting || 'Welcome'}, {user?.name?.split(' ')[0] || 'Friend'}!
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100 mt-2 leading-relaxed">
            Your physiological markers are stable today. 2 medications scheduled, 1 upcoming consultation.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              id="quick-checkin-btn"
              onClick={() => onNavigate('dailyCheckIn')}
              className="px-4 py-2.5 bg-white text-emerald-800 font-bold rounded-xl text-xs hover:bg-emerald-50 active:scale-[0.98] transition-all shadow-sm flex items-center gap-1.5"
            >
              <Zap className="w-4 h-4 text-emerald-600" />
              Log Daily Check-In
            </button>
            <button
              id="ask-healora-btn"
              onClick={() => onNavigate('healoraChat')}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-xs backdrop-blur-sm border border-white/20 transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-emerald-300" />
              Ask Healora AI
            </button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 4 Biometric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* BP Card */}
        <div
          onClick={() => onNavigate('vitals')}
          className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:border-emerald-500/50 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Blood Pressure</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center">
              <Heart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {latestBp ? `${latestBp.systolic}/${latestBp.diastolic}` : '120/80'} <span className="text-xs font-semibold text-slate-400">mmHg</span>
          </div>
          <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Optimal Resting Range</span>
          </div>
        </div>

        {/* Sugar Card */}
        <div
          onClick={() => onNavigate('vitals')}
          className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:border-emerald-500/50 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Blood Glucose</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center">
              <Droplets className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {latestSugar ? latestSugar.value : '104'} <span className="text-xs font-semibold text-slate-400">mg/dL</span>
          </div>
          <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Fasting Normal</span>
          </div>
        </div>

        {/* Prescription Adherence Card */}
        <div
          onClick={() => onNavigate('medicines')}
          className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:border-emerald-500/50 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Medication Today</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center">
              <Pill className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {medsTodayTaken} / {medicines.length} <span className="text-xs font-semibold text-slate-400">Taken</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 font-medium">
            {medicines.length - medsTodayTaken} dose(s) pending today
          </div>
        </div>

        {/* Health Twin Score */}
        <div
          onClick={() => onNavigate('healthTwin')}
          className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:border-emerald-500/50 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Health Twin Score</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            92 / 100
          </div>
          <div className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+3 pts from last month</span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans) - Prescriptions & Lab Reports */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Prescriptions */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Pill className="w-5 h-5 text-emerald-500" />
                {t.dashboard.todaysMeds || t.dashboard.medicineReminder || "Today's Prescriptions"}
              </h3>
              <button
                onClick={() => onNavigate('medicines')}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                View All Schedule <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-3">
              {medicines.map((med) => {
                const isTaken = med.adherence && med.adherence[todayStr];
                return (
                  <div
                    key={med.id}
                    className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                      isTaken
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'
                        : 'bg-slate-50 dark:bg-slate-900/60 border-slate-100 dark:border-slate-700'
                    }`}
                  >
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{med.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {med.dosage} • {Array.isArray(med.timings) ? med.timings.join(', ') : (med.timings || '')} {med.mealTiming ? `(${med.mealTiming.replace(/_/g, ' ')})` : ''}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        dataManager.logMedicineTaken(med.id, todayStr);
                        HealthEventBus.emit('medicines_updated');
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        isTaken
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                      }`}
                    >
                      {isTaken ? 'Taken' : 'Take Now'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent AI Analyzed Lab Reports */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-500" />
                {t.dashboard.recentReports || "Recent Lab Reports"}
              </h3>
              <button
                onClick={() => onNavigate('reports')}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                Analyze New Test <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-3">
              {reports.slice(0, 2).map((rep) => (
                <div
                  key={rep.id}
                  onClick={() => onNavigate('reports')}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700 hover:border-emerald-500/40 cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{rep.title}</h4>
                    <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                      {rep.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {rep.aiSummary}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (1 span) - Direct AI Chat, Upcoming Consultations & Emergency */}
        <div className="space-y-6">
          {/* Direct AI Health Assistant on Home Screen */}
          <HomeQuickAIChat onNavigate={onNavigate} />

          {/* Upcoming Consultations */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-500" />
                {t.dashboard.upcomingConsults || t.dashboard.upcomingAppointments || "Upcoming Consultations"}
              </h3>
              <button
                onClick={() => onNavigate('appointments')}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Manage
              </button>
            </div>

            <div className="space-y-3">
              {appointments.slice(0, 2).map((apt) => (
                <div key={apt.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{apt.doctorName}</h4>
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">
                      {(apt.type || 'consultation').replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{apt.specialty}</p>
                  <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{apt.date} at {apt.time}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Emergency SOS Quick Card */}
          <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center">
                <AlertOctagon className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-rose-900 dark:text-rose-200">1-Touch Emergency SOS</h4>
                <p className="text-xs text-rose-700 dark:text-rose-400">Broadcasts GPS & biometrics</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('emergencySOS')}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
            >
              Open Emergency SOS Center
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
