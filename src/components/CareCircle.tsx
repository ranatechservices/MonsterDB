import React, { useState, useEffect } from 'react';
import { Users, Plus, Shield, Phone, Mail, Trash2, Heart, Check, UserPlus } from 'lucide-react';
import { CareCircleMember } from '../types';
import dataManager from '../lib/dataManagement';
import { HealthEventBus } from '../lib/eventBus';
import { useLanguage } from '../localization/language_context';

export default function CareCircle() {
  const [members, setMembers] = useState<CareCircleMember[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('Family');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [canViewVitals, setCanViewVitals] = useState(true);
  const [canViewMedicines, setCanViewMedicines] = useState(true);
  const [receiveAlerts, setReceiveAlerts] = useState(true);
  const { t } = useLanguage();

  const loadMembers = () => {
    setMembers(dataManager.getCareCircle());
  };

  useEffect(() => {
    loadMembers();
    const unsub = HealthEventBus.on('care_circle_updated', loadMembers);
    return () => unsub();
  }, []);

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    const newMember: CareCircleMember = {
      id: 'cc_' + Date.now(),
      name,
      relation,
      role: 'guardian',
      phone,
      email,
      permissions: {
        canViewVitals,
        canViewMedicines,
        canViewReports: false,
        receiveAlerts
      }
    };
    dataManager.saveCareCircleMember(newMember);
    HealthEventBus.emit('care_circle_updated');
    loadMembers();
    setShowAddModal(false);
    setName('');
    setPhone('');
    setEmail('');
  };

  const handleDelete = (id: string) => {
    dataManager.deleteCareCircleMember(id);
    HealthEventBus.emit('care_circle_updated');
    loadMembers();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Users className="w-7 h-7 text-emerald-500" />
            {t.nav.careCircle}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Share vital trends, medication adherence & emergency SOS alerts with family and doctors
          </p>
        </div>
        <button
          id="add-care-member-btn"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-sm font-semibold rounded-xl transition-all shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          Add Caregiver or Family
        </button>
      </div>

      {/* Member Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {members.map((m) => (
          <div
            key={m.id}
            className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center justify-center text-lg">
                  {m.name.charAt(0)}
                </div>
                <button
                  id={`delete-member-${m.id}`}
                  onClick={() => handleDelete(m.id)}
                  className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{m.name}</h3>
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{m.relation} • {m.role}</p>

              <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{m.phone}</span>
                </div>
                {m.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{m.email}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Granted Access:</p>
                <div className="flex flex-wrap gap-1.5">
                  {m.permissions.canViewVitals && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                      Vitals
                    </span>
                  )}
                  {m.permissions.canViewMedicines && (
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-[10px] font-semibold text-blue-700 dark:text-blue-300">
                      Medicines
                    </span>
                  )}
                  {m.permissions.receiveAlerts && (
                    <span className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/50 text-[10px] font-semibold text-rose-700 dark:text-rose-300">
                      SOS Alerts
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Add Care Circle Member</h3>
            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <input
                  id="member-name-input"
                  type="text"
                  required
                  placeholder="e.g. Vikram Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Relationship</label>
                <input
                  id="member-relation-input"
                  type="text"
                  required
                  placeholder="Spouse / Parent / Sibling / Primary Physician"
                  value={relation}
                  onChange={(e) => setRelation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                  <input
                    id="member-phone-input"
                    type="tel"
                    required
                    placeholder="+91 98765..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Email (Optional)</label>
                  <input
                    id="member-email-input"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={canViewVitals}
                    onChange={(e) => setCanViewVitals(e.target.checked)}
                    className="rounded accent-emerald-600"
                  />
                  <span>Allow viewing live Biometrics & BP</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={canViewMedicines}
                    onChange={(e) => setCanViewMedicines(e.target.checked)}
                    className="rounded accent-emerald-600"
                  />
                  <span>Allow viewing daily Prescription Schedule</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={receiveAlerts}
                    onChange={(e) => setReceiveAlerts(e.target.checked)}
                    className="rounded accent-emerald-600"
                  />
                  <span>Send instant SMS/Push notification during SOS</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  id="save-member-submit-btn"
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm shadow-sm"
                >
                  Save Care Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
