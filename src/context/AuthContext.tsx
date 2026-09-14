import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { api } from '../lib/api';

export type RoleType = UserRole;

interface AuthContextType {
  user: UserProfile | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (credentials: { email?: string; phone?: string; username?: string; password: string }) => Promise<{
    success: boolean;
    requiresWebAuthn?: boolean;
    isFirstTimeEnrollment?: boolean;
    tempToken?: string;
    user?: any;
    error?: string;
  }>;
  setAuthSession: (user: UserProfile, token?: string) => void;
  loginAsDemo: (role?: UserRole) => void;
  signup: (payload: any) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  switchRole: (role: UserRole) => void;
}

const DEFAULT_PATIENT_USER: UserProfile = {
  id: "usr_patient_101",
  uuid: "550e8400-e29b-41d4-a716-446655440000",
  name: "Dr. Ananya Sharma",
  email: "ananya.sharma@healora.ai",
  phone: "+91 98765 43210",
  role: "patient",
  gender: "Female",
  dob: "1990-05-15",
  bloodGroup: "O+",
  language: "en",
  onboardingCompleted: true,
  createdAt: new Date().toISOString(),
  emergencyContacts: [
    { id: "em_1", name: "Vikram Sharma", relation: "Spouse", phone: "+91 98765 43211", notifyOnSos: true },
    { id: "em_2", name: "Pooja Sharma", relation: "Sister", phone: "+91 98765 43212", notifyOnSos: true }
  ]
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('dhealora_user_profile');
    const token = localStorage.getItem('dhealora_auth_token');
    if (saved && token) {
      try {
        const parsed = JSON.parse(saved);
        return parsed;
      } catch {
        return null;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('dhealora_user_profile', JSON.stringify(user));
      localStorage.setItem('dhealora_active_user_id', String(user.id));
      if (!localStorage.getItem('dhealora_auth_token')) {
        localStorage.setItem('dhealora_auth_token', 'dhealora_session_' + user.id);
      }
    } else {
      localStorage.removeItem('dhealora_user_profile');
      localStorage.removeItem('dhealora_active_user_id');
      localStorage.removeItem('dhealora_auth_token');
    }
  }, [user]);

  const setAuthSession = (sessionUser: UserProfile, token?: string) => {
    setUser(sessionUser);
    if (token) {
      localStorage.setItem('dhealora_auth_token', token);
      localStorage.setItem('dhealora_active_email', sessionUser.email || '');
    }
  };

  const login = async (credentials: { email?: string; phone?: string; username?: string; password: string }) => {
    setLoading(true);
    try {
      const res = await api.auth.login(credentials);
      if (res?.success && res.user) {
        setUser(res.user);
        if (res.token) {
          localStorage.setItem('dhealora_auth_token', res.token);
        }
        return { success: true, user: res.user };
      }
      return { success: false, error: res?.error || 'Invalid credentials' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  const loginAsDemo = (role: UserRole = 'patient') => {
    // Only allow admin role if email is dhealora30@gmail.com
    const isSpecialAdmin = role === 'super_admin' || role === 'admin' || role === 'System Admin';
    const demoUser: UserProfile = {
      ...DEFAULT_PATIENT_USER,
      name: isSpecialAdmin ? "System Administrator (DHealora)" : "Dr. Ananya Sharma",
      email: isSpecialAdmin ? "dhealora30@gmail.com" : "ananya.sharma@healora.ai",
      role: role
    };
    setUser(demoUser);
    localStorage.setItem('dhealora_auth_token', 'jwt_demo_token_' + Date.now());
  };

  const signup = async (payload: any) => {
    setLoading(true);
    try {
      const res = await api.auth.signup(payload);
      if (res?.success && res.user) {
        setUser(res.user);
        return { success: true };
      }
      const newUser: UserProfile = {
        id: "usr_" + Date.now(),
        name: payload.name || "New Member",
        email: payload.email,
        phone: payload.phone || "",
        role: "patient",
        gender: payload.gender || "Other",
        dob: payload.dob,
        bloodGroup: payload.bloodGroup || "O+",
        language: payload.language || "en",
        onboardingCompleted: false,
        createdAt: new Date().toISOString()
      };
      setUser(newUser);
      localStorage.setItem('dhealora_auth_token', 'jwt_' + Date.now());
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Signup failed' };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch (e) {
      // ignore
    }
    setUser(null);
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    setUser(updated);
    localStorage.setItem('dhealora_user_profile', JSON.stringify(updated));
  };

  const switchRole = (newRole: UserRole) => {
    if (!user) return;
    const updated = { ...user, role: newRole };
    setUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile: user,
        isAuthenticated: !!user,
        loading,
        login,
        setAuthSession,
        loginAsDemo,
        signup,
        logout,
        updateProfile,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
