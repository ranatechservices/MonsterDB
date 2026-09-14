import React from 'react';
import {
  LayoutDashboard,
  Activity,
  Pill,
  FileText,
  Calendar,
  Sparkles,
  Lightbulb,
  Sun,
  Users,
  AlertOctagon,
  Stethoscope,
  Building2,
  ShoppingBag,
  Settings as SettingsIcon,
  ShieldCheck,
  History,
  TrendingUp,
  X
} from 'lucide-react';
import { useLanguage } from '../localization/language_context';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ currentTab, onSelectTab, isOpen, onClose }: SidebarProps) {
  const { t } = useLanguage();

  const navItems = [
    { id: 'dashboard', label: t.nav.dashboard, icon: LayoutDashboard },
    { id: 'continuity', label: 'Health Continuity', icon: History },
    { id: 'vitals', label: t.nav.vitals, icon: Activity },
    { id: 'medicines', label: t.nav.medicines, icon: Pill },
    { id: 'reports', label: t.nav.reports, icon: FileText },
    { id: 'healoraChat', label: t.nav.chat, icon: Sparkles },
    { id: 'dailyCheckIn', label: t.nav.checkIn || 'Daily Check-In', icon: Sun },
    { id: 'appointments', label: t.nav.appointments, icon: Calendar },
    { id: 'healthTwin', label: t.nav.healthTwin, icon: Sparkles },
    { id: 'copilot', label: t.nav.copilot || 'AI Health Copilot', icon: TrendingUp },
    { id: 'insights', label: t.nav.insights, icon: Lightbulb },
    { id: 'careCircle', label: t.nav.careCircle, icon: Users },
    { id: 'emergencySOS', label: t.nav.emergencySos || t.nav.emergencySOS || 'Emergency SOS', icon: AlertOctagon, special: true },
    { id: 'doctorBooking', label: t.nav.doctorBooking, icon: Stethoscope },
    { id: 'marketplace', label: t.nav.marketplace, icon: ShoppingBag },
    { id: 'settings', label: t.nav.settings, icon: SettingsIcon },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white dark:bg-slate-800 border-r border-slate-100 dark:border-slate-700 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col justify-between overflow-y-auto`}
      >
        <div>
          {/* Logo Branding */}
          <div className="h-16 px-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white block">
                  DHealora
                </span>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tracking-wider uppercase block">
                  Healthcare Suite
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="lg:hidden p-1 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  id={`nav-item-${item.id}`}
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    item.special
                      ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100'
                      : isActive
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Security Badge */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-700">
          <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-700 text-center">
            <ShieldCheck className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block">ABDM & HIPAA Aligned</span>
            <span className="text-[10px] text-slate-400 block">AES-256 Cloud Encryption</span>
          </div>
        </div>
      </aside>
    </>
  );
}
