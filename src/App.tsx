import React, { useState, useEffect } from 'react';
import { ArrowLeft, Home, ChevronRight, LayoutDashboard } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import VitalsTracker from './components/VitalsTracker';
import MedicineTracker from './components/MedicineTracker';
import ReportAnalyzer from './components/ReportAnalyzer';
import HealoraChat from './components/HealoraChat';
import DailyCheckIn from './components/DailyCheckIn';
import AppointmentManager from './components/AppointmentManager';
import HealthTwin from './components/HealthTwin';
import HealthInsights from './components/HealthInsights';
import UnifiedCopilotPanel from './components/copilot/UnifiedCopilotPanel';
import CareCircle from './components/CareCircle';
import EmergencySOS from './components/EmergencySOS';
import DoctorConsultationBooking from './components/DoctorConsultationBooking';
import Marketplace from './components/Marketplace';
import Settings from './components/Settings';
import AdminPanel from './components/AdminPanel/AdminPanel';
import OnboardingWizard from './components/OnboardingWizard';
import HealthContinuityHub from './components/HealthContinuityHub';
import { PrivacyPolicyPage, TermsOfServicePage } from './components/StaticPages';
import Auth from './components/Auth';
import LandingPage from './components/LandingPage';
import FloatingAIWidget from './components/FloatingAIWidget';

const TAB_TITLES: Record<string, { en: string; hi: string; subtitle?: string }> = {
  dashboard: { en: 'Dashboard', hi: 'डैशबोर्ड', subtitle: 'Personal Health Overview' },
  continuity: { en: 'Health Continuity Hub', hi: 'हेल्थ निरंतरता हब', subtitle: 'Timeline & Longitudinal Medical Insights' },
  vitals: { en: 'Vitals Tracker & Telemetry', hi: 'वाइटल्स ट्रैकर', subtitle: 'Heart Rate, Blood Pressure, Glucose & SpO2' },
  medicines: { en: 'Medicine & Adherence Tracker', hi: 'दवा ट्रैकर', subtitle: 'Prescriptions, Reminders & Interactions' },
  reports: { en: 'AI Diagnostic Report Analyzer', hi: 'लैब रिपोर्ट विश्लेषक', subtitle: 'Biomarker Extraction & Clinical Interpretation' },
  healoraChat: { en: 'Healora Clinical AI Assistant', hi: 'क्लिनिकल AI चैट', subtitle: 'Evidence-Based Conversational Guidance' },
  dailyCheckIn: { en: 'Daily Health & Mood Check-In', hi: 'दैनिक चेक-इन', subtitle: 'Symptoms, Vigor & Wellness Logging' },
  appointments: { en: 'Doctor Appointments & Visits', hi: 'डॉक्टर अपॉइंटमेंट', subtitle: 'Teleconsultations & Clinical Schedules' },
  doctorBooking: { en: 'Book Specialist Doctor', hi: 'डॉक्टर बुकिंग', subtitle: 'Licensed Physicians & Realtime Scheduling' },
  healthTwin: { en: 'Digital Health Twin & Risk Predictor', hi: 'डिजिटल हेल्थ ट्विन', subtitle: 'Physiological Simulations & 5-Year Risk Models' },
  copilot: { en: 'AI Health Copilot', hi: 'एआई स्वास्थ्य कॉपायलट', subtitle: 'Trajectory Forecasts, Correlations & Doctor Briefs' },
  insights: { en: 'Clinical Health Insights & Trends', hi: 'हेल्थ इनसाइट्स', subtitle: 'Biomarker Correlator & Trajectory Graphs' },
  careCircle: { en: 'Family Care Circle & Caregivers', hi: 'केयर सर्कल', subtitle: 'Remote Monitoring & Shared Health Alerts' },
  emergencySOS: { en: 'Emergency SOS & Medical ID', hi: 'आपातकालीन SOS', subtitle: 'Instant 112 Dispatch & Critical Blood Info' },
  marketplace: { en: 'Healthcare Marketplace & Lab Tests', hi: 'मार्केटप्लेस', subtitle: 'Book Verified Diagnostic Panels & Scans' },
  settings: { en: 'Account & App Settings', hi: 'सेटिंग्स', subtitle: 'Profile, Security & Notification Preferences' },
  privacy: { en: 'Privacy Policy', hi: 'गोपनीयता नीति', subtitle: 'HIPAA/DISHA Data Security & Encryption' },
  terms: { en: 'Terms of Service', hi: 'सेवा की शर्तें', subtitle: 'User Agreement & Clinical Disclaimers' },
  admin: { en: 'Admin Control Center', hi: 'एडमिन पैनल', subtitle: 'Full-Stack Management Console' }
};

export default function App() {
  const { user, isAuthenticated, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState(() => {
    try {
      const saved = localStorage.getItem('dhealora_active_tab');
      return saved || 'dashboard';
    } catch {
      return 'dashboard';
    }
  });
  const [tabHistory, setTabHistory] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unauthView, setUnauthView] = useState<'landing' | 'auth' | 'privacy' | 'terms'>('landing');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  const navigateToTab = (newTab: string) => {
    if (newTab === currentTab) return;
    setTabHistory((prev) => [...prev, currentTab]);
    setCurrentTab(newTab);
    try {
      localStorage.setItem('dhealora_active_tab', newTab);
    } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    if (tabHistory.length > 0) {
      const prevTab = tabHistory[tabHistory.length - 1];
      setTabHistory((prev) => prev.slice(0, -1));
      setCurrentTab(prevTab);
      try {
        localStorage.setItem('dhealora_active_tab', prevTab);
      } catch {}
    } else {
      setCurrentTab('dashboard');
      try {
        localStorage.setItem('dhealora_active_tab', 'dashboard');
      } catch {}
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
            Initializing Healora Secure Environment...
          </span>
        </div>
      </div>
    );
  }

  // Unauthenticated Views: Landing Page (default), Sign In / Sign Up, Privacy, Terms
  if (!isAuthenticated || !user) {
    if (unauthView === 'landing') {
      return (
        <LandingPage
          onOpenAuth={(mode = 'login') => {
            setAuthMode(mode);
            setUnauthView('auth');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenStatic={(page) => {
            setUnauthView(page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      );
    }

    if (unauthView === 'privacy') {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4">
          <PrivacyPolicyPage onBack={() => setUnauthView('landing')} />
        </div>
      );
    }

    if (unauthView === 'terms') {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4">
          <TermsOfServicePage onBack={() => setUnauthView('landing')} />
        </div>
      );
    }

    return (
      <Auth
        initialMode={authMode}
        onBackToHome={() => setUnauthView('landing')}
        onSuccess={() => setUnauthView('landing')}
      />
    );
  }

  if (!user.onboardingCompleted && currentTab !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <OnboardingWizard onComplete={() => navigateToTab('dashboard')} />
      </div>
    );
  }

  // Strict Access Control for Admin Panel based purely on verified JWT role
  const isAuthorizedAdmin = Boolean(
    user && (user.role === 'super_admin' || user.role === 'hospital_admin' || user.role === 'System Admin')
  );

  // If currently in Admin Panel
  if (currentTab === 'admin') {
    if (!isAuthorizedAdmin) {
      // Regular user cannot access Admin Panel under any circumstance
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col">
          <Sidebar
            currentTab={currentTab}
            onSelectTab={navigateToTab}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
          <div className="lg:pl-64 flex-1 flex flex-col">
            <Header
              onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
              onNavigate={navigateToTab}
            />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
              <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-3xl p-8 text-center max-w-lg mx-auto my-12">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900 text-rose-600 dark:text-rose-300 flex items-center justify-center mx-auto mb-4 font-black text-xl">
                  !
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">
                  Access Restricted (सुरक्षा प्रतिबंध)
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                  Admin Panel is restricted exclusively to authorized administrators. Regular user accounts do not have access privileges.
                </p>
                <button
                  onClick={() => navigateToTab('dashboard')}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
                >
                  Return to Patient Dashboard
                </button>
              </div>
            </main>
          </div>
        </div>
      );
    }
    return <AdminPanel onBackToApp={() => navigateToTab('dashboard')} />;
  }

  const renderMainContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard onNavigate={navigateToTab} />;
      case 'continuity':
        return <HealthContinuityHub onNavigate={navigateToTab} />;
      case 'vitals':
        return <VitalsTracker />;
      case 'medicines':
        return <MedicineTracker />;
      case 'reports':
        return <ReportAnalyzer />;
      case 'healoraChat':
        return <HealoraChat onNavigate={navigateToTab} />;
      case 'dailyCheckIn':
        return <DailyCheckIn />;
      case 'appointments':
        return <AppointmentManager onOpenBooking={() => navigateToTab('doctorBooking')} />;
      case 'healthTwin':
        return <HealthTwin onNavigate={navigateToTab} />;
      case 'copilot':
        return <UnifiedCopilotPanel onNavigate={navigateToTab} />;
      case 'insights':
        return <HealthInsights onNavigate={navigateToTab} />;
      case 'careCircle':
        return <CareCircle />;
      case 'emergencySOS':
        return <EmergencySOS />;
      case 'doctorBooking':
        return (
          <DoctorConsultationBooking
            onBooked={() => navigateToTab('appointments')}
            onNavigateAdmin={() => navigateToTab('admin')}
          />
        );
      case 'marketplace':
        return <Marketplace />;
      case 'settings':
        return (
          <Settings
            onOpenPrivacy={() => navigateToTab('privacy')}
            onOpenTerms={() => navigateToTab('terms')}
          />
        );
      case 'privacy':
        return <PrivacyPolicyPage onBack={() => navigateToTab('settings')} />;
      case 'terms':
        return <TermsOfServicePage onBack={() => navigateToTab('settings')} />;
      default:
        return <Dashboard onNavigate={navigateToTab} />;
    }
  };

  const currentTabInfo = TAB_TITLES[currentTab] || { en: currentTab, hi: currentTab };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Navigation Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={navigateToTab}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex-1 flex flex-col">
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onNavigate={navigateToTab}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* Universal Top Panel Navigation with Back Button (Visible on all sub-pages) */}
          {currentTab !== 'dashboard' && (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs backdrop-blur-md">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleBack}
                  id="global-panel-back-btn"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 dark:bg-slate-700/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition group cursor-pointer border border-slate-200/70 dark:border-slate-600 shadow-2xs"
                  title="Go back to previous screen (वापस जाएं)"
                >
                  <ArrowLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:-translate-x-1 transition-transform" />
                  <span>Back (वापस जाएं)</span>
                </button>

                <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

                {/* Breadcrumbs */}
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <button
                    onClick={() => {
                      setTabHistory([]);
                      setCurrentTab('dashboard');
                    }}
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 font-medium transition cursor-pointer"
                  >
                    <Home className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </button>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[170px] sm:max-w-none">
                    {currentTabInfo.en}
                  </span>
                </div>
              </div>

              {/* Quick Jump to Dashboard Home */}
              <button
                onClick={() => {
                  setTabHistory([]);
                  setCurrentTab('dashboard');
                }}
                id="btn-quick-home-return"
                className="text-xs font-bold text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/50 transition cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                title="Return to Main Dashboard"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Home Dashboard</span>
              </button>
            </div>
          )}

          {renderMainContent()}
        </main>
      </div>

      {/* Persistent Floating AI Health Assistant for instant access across any feature */}
      <FloatingAIWidget currentTab={currentTab} onNavigate={navigateToTab} />
    </div>
  );
}
