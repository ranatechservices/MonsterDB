import React, { useState } from 'react';
import {
  Users,
  Send,
  CheckCircle2,
  Calendar,
  Heart,
  Pill,
  Sparkles,
  ShieldCheck,
  Bell,
  Clock
} from 'lucide-react';
import { useLanguage } from '../../localization/language_context';
import { useHealthCopilot } from '../../hooks/useHealthCopilot';
import { FamilyDigest as FamilyDigestType } from '../../types';

interface FamilyDigestProps {
  onNavigate?: (tab: string) => void;
}

export default function FamilyDigest({ onNavigate }: FamilyDigestProps) {
  const { t } = useLanguage();
  const { medicines, checkins, vitals } = useHealthCopilot();

  const [optedInMembers, setOptedInMembers] = useState<{ id: string; name: string; relation: string; enabled: boolean }[]>([
    { id: 'mem_1', name: 'Dr. Priya Sharma', relation: 'Daughter / Primary Caregiver', enabled: true },
    { id: 'mem_2', name: 'Rahul Sharma', relation: 'Son', enabled: true },
    { id: 'mem_3', name: 'Sunita Verma', relation: 'Sister', enabled: false }
  ]);

  const [digestSent, setDigestSent] = useState<boolean>(false);
  const [dispatching, setDispatching] = useState<boolean>(false);

  // Compute summary stats for the digest
  const totalDoses = medicines.reduce((acc, m) => acc + (m.adherence ? Object.keys(m.adherence).length : 0), 0);
  const takenDoses = medicines.reduce(
    (acc, m) => acc + (m.adherence ? Object.values(m.adherence).filter(Boolean).length : 0),
    0
  );
  const adherenceRate = totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 94;

  const toggleMember = (id: string) => {
    setOptedInMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m))
    );
  };

  const handleSendDigest = () => {
    setDispatching(true);
    setTimeout(() => {
      setDispatching(false);
      setDigestSent(true);
      setTimeout(() => setDigestSent(false), 5000);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Digest Settings & Preview Card */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Weekly Family Care Digest
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Keep designated family caregivers informed with an automated, reassuring weekly summary
              </p>
            </div>
          </div>

          <button
            onClick={handleSendDigest}
            disabled={dispatching || optedInMembers.filter((m) => m.enabled).length === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            {dispatching ? 'Dispatching Digest...' : 'Send Weekly Digest Now'}
          </button>
        </div>

        {digestSent && (
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs p-3.5 rounded-2xl flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Weekly health digest successfully delivered to {optedInMembers.filter((m) => m.enabled).length} designated care circle contacts!</span>
          </div>
        )}

        {/* Recipient Opt-in Controls */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
            Care Circle Recipient Permissions (Opt-in per Member)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {optedInMembers.map((member) => (
              <div
                key={member.id}
                onClick={() => toggleMember(member.id)}
                className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-2 ${
                  member.enabled
                    ? 'bg-slate-50 dark:bg-slate-900/60 border-emerald-500/40 dark:border-emerald-500/40'
                    : 'bg-slate-50/50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-800 opacity-60'
                }`}
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {member.name}
                  </h4>
                  <p className="text-[11px] text-slate-500">{member.relation}</p>
                </div>
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    member.enabled
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-transparent'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Digest Preview Card */}
        <div className="space-y-2 pt-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
            Sample Live Digest Preview
          </span>

          <div className="bg-gradient-to-br from-slate-50 to-emerald-50/30 dark:from-slate-900 dark:to-emerald-950/20 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-3">
              <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                DHealora Weekly Caregiver Update
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                Week of {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              &quot;Hello from DHealora. This week, your family member has maintained an excellent {adherenceRate}% prescription adherence rate across all prescribed medications. Biometric vitals and check-in logs remained steady without any critical alerts.&quot;
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 text-xs">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Medication Adherence</span>
                <span className="text-sm font-black text-emerald-600">{adherenceRate}% On-Track</span>
              </div>

              <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 text-xs">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Vitals Status</span>
                <span className="text-sm font-black text-slate-800 dark:text-white">Normal Baseline</span>
              </div>

              <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 text-xs">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Check-in Streak</span>
                <span className="text-sm font-black text-amber-500">{checkins.length || 7} Days Logged</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
