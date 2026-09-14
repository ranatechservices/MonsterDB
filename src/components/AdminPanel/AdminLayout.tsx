import React, { useState } from "react";
import {
  ArrowLeft,
  LayoutDashboard,
  Users,
  Shield,
  Building2,
  Briefcase,
  Stethoscope,
  HeartPulse,
  Calendar,
  FileText,
  BarChart3,
  CreditCard,
  Bell,
  HelpCircle,
  History,
  Settings,
  Database,
  LogOut,
  ChevronRight,
  Sun,
  Moon,
  Search,
  Menu,
  X,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  ShieldCheck
} from "lucide-react";
import { useAuth, RoleType } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

interface AdminLayoutProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onBackToApp: () => void;
  children: React.ReactNode;
}

export default function AdminLayout({
  activeTab,
  onSelectTab,
  onBackToApp,
  children,
}: AdminLayoutProps) {
  const { profile, loginAsDemo } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);

  const menuItems = [
    { id: "dashboard", label: "Dashboard Overview", icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: "users", label: "User Management", icon: <Users className="h-4 w-4" />, badge: "Active" },
    { id: "roles", label: "Roles & Permissions", icon: <Shield className="h-4 w-4" /> },
    { id: "organizations", label: "Hospitals & Clinics", icon: <Building2 className="h-4 w-4" />, badge: "2 Pending" },
    { id: "doctors", label: "Doctor Directory", icon: <Stethoscope className="h-4 w-4" /> },
    { id: "patients", label: "Patients (Privacy-Safe)", icon: <HeartPulse className="h-4 w-4" /> },
    { id: "appointments", label: "Appointments & Visits", icon: <Calendar className="h-4 w-4" /> },
    { id: "reports", label: "Medical Reports Audit", icon: <FileText className="h-4 w-4" /> },
    { id: "analytics", label: "Platform Analytics", icon: <BarChart3 className="h-4 w-4" /> },
    { id: "subscriptions", label: "Subscriptions & Billing", icon: <CreditCard className="h-4 w-4" /> },
    { id: "notifications", label: "Broadcast Notices", icon: <Bell className="h-4 w-4" /> },
    { id: "support", label: "Support Tickets", icon: <HelpCircle className="h-4 w-4" />, badge: "1 Urgent" },
    { id: "audit-logs", label: "Audit & Security Trail", icon: <History className="h-4 w-4" /> },
    { id: "database", label: "Database Engine & Tables", icon: <Database className="h-4 w-4" />, badge: "Active" },
    { id: "settings", label: "Admin Security & Settings", icon: <Settings className="h-4 w-4" /> },
  ];

  const allRoles: RoleType[] = [
    "System Admin",
    "Hospital Admin",
    "Clinic Admin",
    "Company Admin",
    "Doctor",
    "Staff",
    "Caregiver",
    "Employee",
    "Patient",
  ];

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans overflow-hidden">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:static inset-y-0 left-0 w-64 bg-slate-900 text-slate-300 border-r border-slate-800 z-50 flex flex-col transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-black shadow-md shadow-emerald-500/20">
              DH
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white text-base tracking-tight">Healora</span>
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Admin
                </span>
              </div>
              <span className="text-[10px] text-slate-400">PHP + MySQL Engine</span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1 text-slate-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
          <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Management Modules
          </div>
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`admin-nav-${item.id}`}
                onClick={() => {
                  onSelectTab(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/25"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isActive ? "text-white" : "text-slate-400"}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      item.badge.includes("Pending") || item.badge.includes("Urgent")
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : "bg-slate-800 text-slate-300 border border-slate-700"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Role Card & Switcher */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          <div className="relative">
            <button
              onClick={() => setRoleSwitcherOpen(!roleSwitcherOpen)}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-left cursor-pointer transition"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-7 w-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">
                  {(profile?.fullName || profile?.name || "A").substring(0, 1)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-white truncate">
                    {profile?.fullName || profile?.name || "System Admin"}
                  </div>
                  <div className="text-[10px] text-emerald-400 font-semibold truncate flex items-center gap-1">
                    <Shield className="h-2.5 w-2.5" />
                    {profile?.role || "System Admin"}
                  </div>
                </div>
              </div>
              <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${roleSwitcherOpen ? "rotate-90" : ""}`} />
            </button>

            {/* Role Tester Dropdown */}
            {roleSwitcherOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 p-2 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-50 space-y-1">
                <div className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider flex items-center justify-between">
                  <span>Switch Testing Role</span>
                  <Sparkles className="h-3 w-3 text-amber-400" />
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {allRoles.map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        loginAsDemo(r);
                        setRoleSwitcherOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center justify-between ${
                        profile?.role === r
                          ? "bg-emerald-600 text-white font-bold"
                          : "text-slate-300 hover:bg-slate-800"
                      }`}
                    >
                      <span>{r}</span>
                      {profile?.role === r && <CheckCircle2 className="h-3.5 w-3.5" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onBackToApp}
            className="w-full mt-2 px-3 py-2 bg-slate-800/60 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 border border-slate-700/60 transition cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5 rotate-180 text-emerald-400" />
            <span>Back to Patient App</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Header Back Button */}
            <button
              onClick={() => {
                if (activeTab !== 'dashboard') {
                  onSelectTab('dashboard');
                } else {
                  onBackToApp();
                }
              }}
              id="admin-header-back-btn"
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-emerald-700 text-xs font-bold transition flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 cursor-pointer"
              title={activeTab !== 'dashboard' ? 'Back to Admin Overview' : 'Back to Patient Dashboard'}
            >
              <ArrowLeft className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Back (वापस)</span>
            </button>

            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 capitalize">
                {menuItems.find((m) => m.id === activeTab)?.label || "Admin Console"}
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                MySQL Database: <code className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">healora</code> • Role: <span className="font-bold text-slate-800 dark:text-slate-200">{profile?.role || "System Admin"}</span>
              </p>
            </div>
          </div>

          {/* Quick Actions & Controls */}
          <div className="flex items-center gap-2.5">
            {/* Admin Security Settings Button */}
            <button
              onClick={() => onSelectTab("settings")}
              id="admin-header-security-btn"
              className="px-3 py-1.5 rounded-xl bg-emerald-600/10 dark:bg-emerald-950/50 hover:bg-emerald-600 hover:text-white border border-emerald-200 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Security & System Settings"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Security & Settings</span>
              <span className="sm:hidden">Settings</span>
            </button>

            {/* Live Search */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-500">
              <Search className="h-3.5 w-3.5" />
              <input
                type="text"
                placeholder="Quick search..."
                className="bg-transparent border-none outline-none text-slate-800 dark:text-slate-200 w-36 placeholder:text-slate-400"
              />
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              id="admin-btn-theme"
              title="Toggle Color Theme"
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              {theme === "dark" ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Live Status Badge */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 rounded-full text-xs font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>PHP API Live</span>
            </div>
          </div>
        </header>

        {/* Scrollable Sub-View Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50 dark:bg-slate-950">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
