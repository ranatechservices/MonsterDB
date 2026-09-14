import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  fallback?: React.ReactNode;
}

export default function ProtectedRoute({ children, allowedRoles, fallback }: ProtectedRouteProps) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return fallback ? <>{fallback}</> : (
      <div className="p-8 text-center text-slate-600 dark:text-slate-300">
        Please sign in to view this section.
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="p-8 text-center text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 rounded-2xl border border-rose-200 dark:border-rose-900 m-6">
        <h3 className="text-lg font-bold">Access Restricted</h3>
        <p className="text-sm mt-1">Your current role ({user.role}) does not have permission for this section.</p>
      </div>
    );
  }

  return <>{children}</>;
}
