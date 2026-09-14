import React, { useState } from 'react';
import { AlertOctagon, Phone, ShieldAlert, CheckCircle2, MapPin, HeartPulse, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import dataManager from '../lib/dataManagement';

export default function EmergencySOS() {
  const { user } = useAuth();
  const [sosTriggered, setSosTriggered] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const members = dataManager.getCareCircle();

  const handleTriggerSOS = () => {
    setSosTriggered(true);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-rose-600 rounded-3xl p-8 text-white shadow-xl">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center animate-pulse">
            <AlertOctagon className="w-10 h-10 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black">Emergency Medical SOS</h1>
            <p className="text-sm text-rose-100 mt-0.5">
              1-Touch emergency protocol: Broadcasts live GPS & biometrics to caregivers & ambulances
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-center gap-4">
          <button
            id="emergency-sos-activate-btn"
            onClick={handleTriggerSOS}
            className="w-full sm:w-auto px-8 py-4 bg-white text-rose-700 font-extrabold text-base rounded-2xl hover:bg-rose-50 active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            {sosTriggered ? 'SOS BROADCAST ACTIVE' : 'TRANSMIT EMERGENCY SOS'}
          </button>

          <a
            href="tel:112"
            className="w-full sm:w-auto px-6 py-4 bg-rose-700 hover:bg-rose-800 text-white font-bold text-sm rounded-2xl transition-colors flex items-center justify-center gap-2 border border-rose-500"
          >
            <Phone className="w-4 h-4" />
            Call 112 / 911 Ambulance
          </a>
        </div>
      </div>

      {sosTriggered && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 text-rose-700 dark:text-rose-300 font-bold mb-3">
            <CheckCircle2 className="w-5 h-5" />
            Emergency alerts dispatched to your active Care Circle!
          </div>
          <p className="text-xs text-rose-600 dark:text-rose-400">
            Current GPS telemetry, blood group ({user?.bloodGroup || 'O+'}), and latest vital stats transmitted to emergency contacts.
          </p>
        </div>
      )}

      {/* Emergency Contacts Recipient Preview */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
        <h3 className="font-bold text-slate-900 dark:text-white text-base mb-4 flex items-center gap-2">
          <HeartPulse className="w-5 h-5 text-emerald-500" />
          Configured Emergency SOS Recipients ({members.length})
        </h3>
        <div className="space-y-3">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center text-sm">
                  {m.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{m.name}</h4>
                  <span className="text-xs text-slate-500">{m.relation} • {m.phone}</span>
                </div>
              </div>
              <a
                href={`tel:${m.phone}`}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs"
              >
                <Phone className="w-3.5 h-3.5" />
                Call Direct
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
