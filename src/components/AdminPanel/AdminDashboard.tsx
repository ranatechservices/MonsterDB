import React, { useState, useEffect } from "react";
import {
  Users,
  Building2,
  Stethoscope,
  Calendar,
  CreditCard,
  ShieldCheck,
  AlertCircle,
  Clock,
  UserPlus,
  RefreshCw,
  HelpCircle,
  ArrowRight,
  Database
} from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

interface AdminDashboardProps {
  onNavigate: (tab: string) => void;
}

export default function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const { profile } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [pendingOrgs, setPendingOrgs] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await api.admin.getDashboardStats();
      if (res?.success) {
        setStats(res.stats);
        setRecentUsers(res.recent_users || []);
        setPendingOrgs(res.pending_organizations || []);
        setRecentActivity(res.recent_activity || []);
      }
    } catch (err) {
      console.warn("Failed to fetch admin stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Subscribe to realtime backend mutations
    const unsubscribe = api.realtime.subscribe(() => {
      fetchDashboardData();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const kpis = [
    {
      title: "Total Platform Users",
      value: stats?.users?.total_users !== undefined ? stats.users.total_users : "—",
      sub: `${stats?.users?.active_patients || 0} active patients`,
      trend: "up",
      icon: <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
      bg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60",
      action: () => onNavigate("users"),
    },
    {
      title: "Hospitals & Clinics",
      value: stats?.organizations?.total_orgs !== undefined ? stats.organizations.total_orgs : "—",
      sub: `${stats?.organizations?.pending_verification || 0} pending verification`,
      trend: "pending",
      icon: <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
      bg: "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60",
      action: () => onNavigate("organizations"),
    },
    {
      title: "Verified Doctors",
      value: stats?.doctors?.total_doctors !== undefined ? stats.doctors.total_doctors : "—",
      sub: `${stats?.doctors?.active || 0} active consultants`,
      trend: "up",
      icon: <Stethoscope className="h-5 w-5 text-teal-600 dark:text-teal-400" />,
      bg: "bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800/60",
      action: () => onNavigate("doctors"),
    },
    {
      title: "Platform Appointments",
      value: stats?.appointments?.total_appointments !== undefined ? stats.appointments.total_appointments : "—",
      sub: `${stats?.appointments?.scheduled_today || 0} upcoming`,
      trend: "up",
      icon: <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />,
      bg: "bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/60",
      action: () => onNavigate("appointments"),
    },
    {
      title: "Active Subscriptions",
      value: stats?.subscriptions?.mrr || "₹0",
      sub: `${stats?.subscriptions?.total || 0} active tiers`,
      trend: "up",
      icon: <CreditCard className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
      bg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60",
      action: () => onNavigate("subscriptions"),
    },
    {
      title: "Open Support Tickets",
      value: stats?.tickets?.open !== undefined ? stats.tickets.open : "0",
      sub: "Active triage queue",
      trend: "alert",
      icon: <HelpCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />,
      bg: "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60",
      action: () => onNavigate("support"),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-6 border border-slate-700 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold mb-2">
              <ShieldCheck className="h-3.5 w-3.5" />
              Role-Based Access Control (RBAC) & Realtime DB Active
            </div>
            <h2 className="text-2xl font-black font-display tracking-tight">
              Welcome back, {profile?.fullName || profile?.name || "System Admin"}
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Real-time Master Control Panel connected to backend database storage. Full administrative oversight across users, organizations, clinical rosters, and audit trails.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-2 border border-slate-700 transition cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              onClick={() => onNavigate("users")}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition cursor-pointer"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Add User
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi, idx) => (
          <div
            key={idx}
            onClick={kpi.action}
            className={`p-5 rounded-2xl border transition-all hover:shadow-md cursor-pointer ${kpi.bg} bg-white dark:bg-slate-900`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {kpi.title}
              </span>
              <div className="p-2 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200/60 dark:border-slate-700">
                {kpi.icon}
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-display">
                {kpi.value}
              </div>
              <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                {kpi.sub}
                <ArrowRight className="h-3 w-3" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Two Column Layout: Pending Approvals & Recent Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Organizations */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                Pending Verification Requests
              </h3>
            </div>
            <button
              onClick={() => onNavigate("organizations")}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 cursor-pointer"
            >
              View All ({pendingOrgs.length})
            </button>
          </div>

          <div className="space-y-2.5">
            {pendingOrgs.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                All organizations and providers are currently verified.
              </div>
            ) : (
              pendingOrgs.map((org, i) => (
                <div key={org.id || i} className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs">
                      {org.type === 'hospital' ? 'HOSP' : 'CLIN'}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {org.name}
                      </h4>
                      <p className="text-[11px] text-slate-500">{org.tier || org.type} • {org.location || 'India'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigate("organizations")}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Review
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recently Registered Users from DB */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                Live User Accounts (Database)
              </h3>
            </div>
            <button
              onClick={() => onNavigate("users")}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 cursor-pointer"
            >
              Manage ({stats?.users?.total_users || recentUsers.length})
            </button>
          </div>

          <div className="space-y-2">
            {recentUsers.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                No users registered yet.
              </div>
            ) : (
              recentUsers.slice(0, 5).map((u, i) => (
                <div
                  key={u.id || i}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-slate-100 dark:border-slate-800 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                      {(u.name || u.email || 'U')[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{u.name || 'User'}</div>
                      <div className="text-[10px] text-slate-500">{u.email}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {u.role || 'patient'}
                    </span>
                    <div className="text-[9px] text-slate-400 mt-0.5">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'Active'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Action Tile Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
          Master Administration Controls
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => onNavigate("roles")}
            className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 text-left transition cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
          >
            <ShieldCheck className="h-5 w-5 text-emerald-600 mb-2" />
            <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Permission Matrix</div>
            <div className="text-[10px] text-slate-500">Configure RBAC roles</div>
          </button>
          <button
            onClick={() => onNavigate("database")}
            className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 text-left transition cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
          >
            <Database className="h-5 w-5 text-blue-600 mb-2" />
            <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Database Engine</div>
            <div className="text-[10px] text-slate-500">Tables, schemas & rows</div>
          </button>
          <button
            onClick={() => onNavigate("notifications")}
            className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 text-left transition cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
          >
            <AlertCircle className="h-5 w-5 text-purple-600 mb-2" />
            <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Broadcast Alert</div>
            <div className="text-[10px] text-slate-500">Send platform notice</div>
          </button>
          <button
            onClick={() => onNavigate("audit-logs")}
            className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 text-left transition cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
          >
            <Clock className="h-5 w-5 text-teal-600 mb-2" />
            <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Audit Trail</div>
            <div className="text-[10px] text-slate-500">Inspect system events</div>
          </button>
        </div>
      </div>
    </div>
  );
}
