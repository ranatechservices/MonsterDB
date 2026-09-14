import React from 'react';
import { Menu, Bell, Moon, Sun, Globe, LogOut, User, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../localization/language_context';

interface HeaderProps {
  onToggleSidebar: () => void;
  onNavigate: (tab: string) => void;
}

export default function Header({ onToggleSidebar, onNavigate }: HeaderProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();

  return (
    <header className="h-16 px-4 sm:px-8 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-700 sticky top-0 z-30 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
          title="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:block">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Health Status:</span>
          <span className="ml-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Biometrics Synced
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Language Switch */}
        <button
          onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
          className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
          title="Switch Language"
        >
          <Globe className="w-3.5 h-3.5 text-emerald-500" />
          <span>{language === 'en' ? 'EN' : 'हिन्दी'}</span>
        </button>

        {/* Theme Switch */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
        </button>

        {/* Admin Direct Link - strictly visible based on verified admin role */}
        {(user?.role === 'super_admin' || user?.role === 'hospital_admin' || user?.role === 'System Admin') && (
          <button
            id="header-admin-suite-btn"
            onClick={() => onNavigate('admin')}
            className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-purple-500/20 flex items-center gap-1.5 transition-all"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Admin Suite</span>
          </button>
        )}

        {/* User Profile Pill */}
        <div
          onClick={() => onNavigate('settings')}
          className="flex items-center gap-2 pl-2 pr-3 py-1 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-emerald-500/50 transition-colors"
        >
          <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 hidden md:inline truncate max-w-[100px]">
            {user?.name || 'User'}
          </span>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
