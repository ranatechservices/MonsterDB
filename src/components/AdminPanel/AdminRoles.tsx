import React, { useState, useEffect } from "react";
import {
  Shield,
  Check,
  Save,
  RefreshCw,
  Lock,
  Unlock,
  AlertCircle,
  Sparkles,
  Info
} from "lucide-react";
import { api } from "../../lib/api";

export default function AdminRoles() {
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [rolePermissions, setRolePermissions] = useState<Record<number, number[]>>({});
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchRolesData = async () => {
    setLoading(true);
    try {
      const res = await api.admin.getRoles();
      if (res?.success) {
        setRoles(res.roles || []);
        setPermissions(res.permissions || []);
        setRolePermissions(res.role_permissions || {});
        if (res.roles?.length > 0 && !selectedRoleId) {
          setSelectedRoleId(res.roles[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRolesData();
  }, []);

  const togglePermission = (permId: number) => {
    if (!selectedRoleId) return;
    const current = rolePermissions[selectedRoleId] || [];
    let updated: number[];
    if (current.includes(permId)) {
      updated = current.filter((id) => id !== permId);
    } else {
      updated = [...current, permId];
    }
    setRolePermissions({
      ...rolePermissions,
      [selectedRoleId]: updated,
    });
    setSaveSuccess(false);
  };

  const handleSavePermissions = async () => {
    if (!selectedRoleId) return;
    setSaving(true);
    try {
      const perms = rolePermissions[selectedRoleId] || [];
      const res = await api.admin.updateRolePermissions(selectedRoleId, perms);
      if (res?.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert(res.error || "Failed to update role permissions");
      }
    } catch (err: any) {
      alert(err.message || "Failed to save permissions");
    } finally {
      setSaving(false);
    }
  };

  // Group permissions by category
  const categories = Array.from(new Set(permissions.map((p) => p.category || "general")));
  const selectedRole = roles.find((r) => r.id === selectedRoleId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              Role-Based Access Control (RBAC) & Permission Matrix
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Healora defines 9 distinct operational roles. Grant or revoke explicit granular permissions per role.
            </p>
          </div>
          <button
            onClick={handleSavePermissions}
            disabled={saving || !selectedRoleId}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition cursor-pointer disabled:opacity-50"
          >
            <Save className={`h-4 w-4 ${saving ? "animate-spin" : ""}`} />
            {saving ? "Saving to MySQL..." : saveSuccess ? "Permissions Saved!" : "Save Permission Matrix"}
          </button>
        </div>
      </div>

      {/* Main Roles + Permissions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Roles List (Left Sidebar) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-2">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2 py-1">
            System Defined Roles ({roles.length})
          </div>
          <div className="space-y-1">
            {roles.map((r) => {
              const isSelected = r.id === selectedRoleId;
              const count = rolePermissions[r.id]?.length || 0;
              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedRoleId(r.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition cursor-pointer ${
                    isSelected
                      ? "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-slate-900 dark:text-slate-100 font-bold"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent text-slate-700 dark:text-slate-300 font-medium"
                  }`}
                >
                  <div>
                    <div className="text-xs">{r.display_name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{r.name}</div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {count} perms
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Permissions Checklist (Right Content) */}
        <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-5">
          {selectedRole ? (
            <>
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Permissions for: <span className="text-emerald-600 dark:text-emerald-400">{selectedRole.display_name}</span>
                  </h3>
                  <p className="text-xs text-slate-500">{selectedRole.description}</p>
                </div>
                <div className="text-xs font-bold text-slate-500">
                  {rolePermissions[selectedRole.id]?.length || 0} / {permissions.length} granted
                </div>
              </div>

              {/* Grouped Permissions */}
              <div className="space-y-5">
                {categories.map((cat) => {
                  const catPerms = permissions.filter((p) => (p.category || "general") === cat);
                  const activeRolePerms = rolePermissions[selectedRole.id] || [];

                  return (
                    <div key={cat} className="space-y-2">
                      <h4 className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {(cat || '').replace(/_/g, " ")} Modules
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {catPerms.map((perm) => {
                          const isGranted = activeRolePerms.includes(perm.id);
                          return (
                            <div
                              key={perm.id}
                              onClick={() => togglePermission(perm.id)}
                              className={`p-3 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                                isGranted
                                  ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-700/60"
                                  : "bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 opacity-75 hover:opacity-100"
                              }`}
                            >
                              <div
                                className={`h-5 w-5 rounded-lg flex items-center justify-center text-xs shrink-0 mt-0.5 ${
                                  isGranted
                                    ? "bg-emerald-600 text-white font-bold"
                                    : "bg-slate-200 dark:bg-slate-700 text-slate-400"
                                }`}
                              >
                                {isGranted ? <Check className="h-3 w-3" /> : null}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                                  {perm.name}
                                </div>
                                <div className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2">
                                  {perm.description || `Allow actions on ${perm.name}`}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-slate-400">
              Select a role from the left menu to configure its permission matrix.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
