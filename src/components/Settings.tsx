import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Moon, Sun, Globe, Bell, Shield, User, Lock, Download, Trash2, Database, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../localization/language_context';
import dataManager from '../lib/dataManagement';
import { api } from '../lib/api';

export default function Settings({ onOpenPrivacy, onOpenTerms }: { onOpenPrivacy?: () => void; onOpenTerms?: () => void }) {
  const { user, updateProfile, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [bloodGroup, setBloodGroup] = useState(user?.bloodGroup || 'O+');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ name, phone, bloodGroup });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleExportData = () => {
    const data = dataManager.exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `healora_health_export_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleResetData = () => {
    if (window.confirm('Are you sure you want to reset demo health data to defaults?')) {
      dataManager.resetToDefaults();
      window.location.reload();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
          <SettingsIcon className="w-7 h-7 text-emerald-500" />
          {t.nav.settings}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Profile personalization, security controls, language & health data management
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Settings */}
        <div className="md:col-span-2 bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm">
          <h3 className="font-bold text-slate-900 dark:text-white text-base mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-500" />
            Personal Profile & Clinical Baseline
          </h3>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Full Legal Name</label>
              <input
                id="settings-name-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Registered Phone</label>
                <input
                  id="settings-phone-input"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Blood Group</label>
                <select
                  id="settings-blood-group-select"
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3">
              {saveSuccess && (
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  Profile updated successfully!
                </span>
              )}
              <button
                id="save-profile-btn"
                type="submit"
                className="ml-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm shadow-sm"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>

        {/* Preferences & Theme */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">App Preferences</h3>

            {/* Theme Toggle */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                {theme === 'dark' ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Color Theme</span>
              </div>
              <button
                onClick={toggleTheme}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
              </button>
            </div>

            {/* Language Selector */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <Globe className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">App Language</span>
              </div>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी (Hindi)</option>
              </select>
            </div>
          </div>

          {/* Privacy and Data Management */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-500" />
              Health Data & Security
            </h3>

            <button
              onClick={handleExportData}
              className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl border border-slate-100 dark:border-slate-700 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Health Records (JSON)
            </button>

            <button
              onClick={handleResetData}
              className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 text-rose-600 text-xs font-semibold rounded-xl border border-slate-100 dark:border-slate-700 flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Reset Local Health Data
            </button>

            <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
              {onOpenPrivacy && (
                <button onClick={onOpenPrivacy} className="hover:underline">
                  Privacy Policy
                </button>
              )}
              {onOpenTerms && (
                <button onClick={onOpenTerms} className="hover:underline">
                  Terms of Service
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
