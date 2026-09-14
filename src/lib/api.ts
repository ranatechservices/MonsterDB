// Real Full-Stack API Client with JWT Authorization & Realtime Event Synchronization

// Helper to get active JWT auth token
export const getAuthToken = (): string | null => {
  return localStorage.getItem("dhealora_auth_token");
};

export const setAuthToken = (token: string | null) => {
  if (token) {
    localStorage.setItem("dhealora_auth_token", token);
  } else {
    localStorage.removeItem("dhealora_auth_token");
  }
};

// Base Fetch with Auth Headers
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(endpoint, {
      ...options,
      headers
    });

    const contentType = res.headers.get('content-type') || '';
    let data: any;

    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = { success: res.ok, message: text };
      }
    }

    if (!res.ok && data && typeof data === 'object') {
      if (data.success === undefined) {
        data.success = false;
      }
    }

    return data as T;
  } catch (err: any) {
    console.warn(`API Notice on ${endpoint}:`, err?.message || err);
    return { success: false, error: err?.message || 'Network request failed' } as unknown as T;
  }
}

export const api = {
  // -------------------------------------------------------------
  // REALTIME SSE SUBSCRIBER
  // -------------------------------------------------------------
  realtime: {
    subscribe: (onEvent: (event: any) => void) => {
      try {
        const token = getAuthToken();
        const eventSource = new EventSource(`/api/realtime/events${token ? `?token=${encodeURIComponent(token)}` : ''}`);

        eventSource.onmessage = (e) => {
          try {
            const parsed = JSON.parse(e.data);
            onEvent(parsed);
          } catch (err) {
            console.warn('Realtime parse error:', err);
          }
        };

        eventSource.onerror = () => {
          // EventSource automatically retries
        };

        return () => {
          eventSource.close();
        };
      } catch (err) {
        console.warn('Realtime subscription not available in this context:', err);
        return () => {};
      }
    }
  },

  // -------------------------------------------------------------
  // AUTHENTICATION
  // -------------------------------------------------------------
  auth: {
    login: async (credentials: { email?: string; password: string }): Promise<{
      success: boolean;
      user?: any;
      token?: string;
      requiresWebAuthn?: boolean;
      isFirstTimeEnrollment?: boolean;
      tempToken?: string;
      error?: string;
    }> => {
      const email = (credentials.email || '').trim().toLowerCase();
      const password = credentials.password || '';

      const res: any = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (res.success && res.token && !res.requiresWebAuthn) {
        setAuthToken(res.token);
        localStorage.setItem("dhealora_active_email", email);
      }
      return res;
    },

    signup: async (payload: any): Promise<{ success: boolean; user?: any; token?: string; error?: string }> => {
      const email = (payload.email || '').trim().toLowerCase();
      const res: any = await request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.success && res.token) {
        setAuthToken(res.token);
        localStorage.setItem("dhealora_active_email", email);
      }
      return res;
    },

    me: async () => {
      return await request<{ success: boolean; user?: any; error?: string }>('/api/auth/me');
    },

    // Admin Step 1: Password Verification
    adminVerifyPassword: async (password: string, email: string) => {
      return await request<{
        success: boolean;
        requiresWebAuthn?: boolean;
        isFirstTimeEnrollment?: boolean;
        tempToken?: string;
        user?: any;
        error?: string;
      }>('/api/auth/admin/verify-password', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase(), password })
      });
    },

    // Admin Step 2A: Registration Options
    adminWebAuthnRegisterOptions: async (tempToken?: string, deviceName?: string) => {
      return await request<{ success: boolean; options?: any; error?: string }>(
        '/api/auth/admin/webauthn/register/options',
        {
          method: 'POST',
          body: JSON.stringify({ tempToken, deviceName })
        }
      );
    },

    // Admin Step 2B: Registration Verify
    adminWebAuthnRegisterVerify: async (tempToken: string | undefined, response: any, deviceName?: string, email?: string) => {
      const res = await request<{
        success: boolean;
        verified?: boolean;
        credential?: any;
        token?: string;
        user?: any;
        error?: string;
      }>('/api/auth/admin/webauthn/register/verify', {
        method: 'POST',
        body: JSON.stringify({ tempToken, response, deviceName })
      });

      if (res.success && res.token) {
        setAuthToken(res.token);
        if (email || res.user?.email) {
          localStorage.setItem("dhealora_active_email", email || res.user?.email);
        }
      }
      return res;
    },

    // Admin Step 3A: Login Options
    adminWebAuthnLoginOptions: async (email: string, tempToken?: string) => {
      return await request<{ success: boolean; options?: any; error?: string }>(
        '/api/auth/admin/webauthn/login/options',
        {
          method: 'POST',
          body: JSON.stringify({ email: email.trim().toLowerCase(), tempToken })
        }
      );
    },

    // Admin Step 3B: Login Verify
    adminWebAuthnLoginVerify: async (email: string, tempToken: string | undefined, response: any) => {
      const res = await request<{
        success: boolean;
        verified?: boolean;
        user?: any;
        token?: string;
        error?: string;
      }>('/api/auth/admin/webauthn/login/verify', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase(), tempToken, response })
      });

      if (res.success && res.token) {
        setAuthToken(res.token);
        localStorage.setItem("dhealora_active_email", email.trim().toLowerCase());
      }
      return res;
    },

    logout: async () => {
      setAuthToken(null);
      localStorage.removeItem("dhealora_active_email");
      return { success: true };
    }
  },

  // -------------------------------------------------------------
  // PATIENT HEALTH DATA (VITALS, MEDS, APPOINTMENTS, REPORTS)
  // -------------------------------------------------------------
  vitals: {
    getAll: async () => {
      const res = await request<{ success: boolean; data: any[] }>('/api/vitals');
      return res.data || [];
    },
    save: async (vital: any) => {
      const res = await request<{ success: boolean; data: any[] }>('/api/vitals', {
        method: 'POST',
        body: JSON.stringify(vital)
      });
      return res.data || [];
    },
    delete: async (id: string) => {
      return await request<{ success: boolean }>(`/api/vitals/${id}`, { method: 'DELETE' });
    }
  },

  medicines: {
    getAll: async () => {
      const res = await request<{ success: boolean; data: any[] }>('/api/medicines');
      return res.data || [];
    },
    save: async (med: any) => {
      const res = await request<{ success: boolean; data: any[] }>('/api/medicines', {
        method: 'POST',
        body: JSON.stringify(med)
      });
      return res.data || [];
    },
    take: async (id: string, dateStr?: string) => {
      return await request<{ success: boolean; data: any }>(`/api/medicines/${id}/take`, {
        method: 'POST',
        body: JSON.stringify({ dateStr })
      });
    },
    delete: async (id: string) => {
      return await request<{ success: boolean }>(`/api/medicines/${id}`, { method: 'DELETE' });
    }
  },

  appointments: {
    getAll: async () => {
      const res = await request<{ success: boolean; data: any[] }>('/api/appointments');
      return res.data || [];
    },
    save: async (appt: any) => {
      const res = await request<{ success: boolean; data: any }>('/api/appointments', {
        method: 'POST',
        body: JSON.stringify(appt)
      });
      return res.data;
    },
    update: async (id: string, updates: any) => {
      return await request<{ success: boolean; data: any }>(`/api/appointments/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
    },
    delete: async (id: string) => {
      return await request<{ success: boolean }>(`/api/appointments/${id}`, { method: 'DELETE' });
    }
  },

  doctors: {
    getAll: async () => {
      const res = await request<{ success: boolean; data: any[] }>('/api/doctors');
      return res.data || [];
    },
    getById: async (id: string) => {
      const res = await request<{ success: boolean; data: any }>(`/api/doctors/${id}`);
      return res.data;
    }
  },

  reports: {
    getAll: async () => {
      const res = await request<{ success: boolean; data?: any[]; reports?: any[] }>('/api/reports');
      return res.reports || res.data || [];
    },
    save: async (report: any) => {
      const res = await request<{ success: boolean; data?: any; report?: any }>('/api/lab-reports', {
        method: 'POST',
        body: JSON.stringify(report)
      });
      return res.report || res.data;
    },
    delete: async (id: string) => {
      return await request<{ success: boolean }>(`/api/reports/${id}`, { method: 'DELETE' });
    }
  },

  medicalReports: {
    upload: async (formData: FormData): Promise<{ success: boolean; report: any; job?: any; error?: string }> => {
      try {
        const token = getAuthToken();
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch('/api/reports/upload', {
          method: 'POST',
          headers,
          body: formData
        });

        const contentType = res.headers.get('content-type') || '';
        let data: any;
        if (contentType.includes('application/json')) {
          data = await res.json();
        } else {
          const text = await res.text();
          try {
            data = JSON.parse(text);
          } catch {
            data = { success: res.ok, message: text };
          }
        }

        if (!res.ok) {
          return {
            success: false,
            report: null,
            error: data?.error || data?.message || `Upload failed (Status ${res.status})`
          };
        }

        return data;
      } catch (err: any) {
        console.error('Report upload network failure:', err);
        return {
          success: false,
          report: null,
          error: err?.message || 'Network upload failed'
        };
      }
    },
    list: async (): Promise<any[]> => {
      const res = await request<{ success: boolean; reports: any[] }>('/api/reports');
      return res.reports || [];
    },
    getBundle: async (id: string): Promise<any> => {
      const res = await request<{ success: boolean; [key: string]: any }>(`/api/reports/${id}`);
      return res;
    },
    delete: async (id: string): Promise<boolean> => {
      const res = await request<{ success: boolean }>(`/api/reports/${id}`, { method: 'DELETE' });
      return res.success;
    },
    analyze: async (id: string, rawText?: string): Promise<{ success: boolean; job: any }> => {
      return await request<{ success: boolean; job: any }>(`/api/reports/${id}/analyze`, {
        method: 'POST',
        body: JSON.stringify({ raw_text: rawText })
      });
    },
    getJobStatus: async (jobId: string): Promise<{ success: boolean; job: any }> => {
      return await request<{ success: boolean; job: any }>(`/api/analysis-jobs/${jobId}`);
    },
    getAnalysis: async (reportId: string): Promise<any> => {
      const res = await request<{ success: boolean; analysis: any }>(`/api/reports/${reportId}/analysis`);
      return res.analysis;
    },
    getFindings: async (reportId: string): Promise<any[]> => {
      const res = await request<{ success: boolean; findings: any[] }>(`/api/reports/${reportId}/findings`);
      return res.findings || [];
    },
    getQuestions: async (reportId: string): Promise<any[]> => {
      const res = await request<{ success: boolean; questions: any[] }>(`/api/reports/${reportId}/questions`);
      return res.questions || [];
    },
    getRecommendations: async (reportId: string): Promise<any[]> => {
      const res = await request<{ success: boolean; recommendations: any[] }>(`/api/reports/${reportId}/recommendations`);
      return res.recommendations || [];
    },
    getTrends: async (reportId?: string): Promise<any[]> => {
      const endpoint = reportId ? `/api/reports/${reportId}/trends` : '/api/reports/demo/trends';
      const res = await request<{ success: boolean; trends: any[] }>(endpoint);
      return res.trends || [];
    },
    recordConsent: async (data: { consent_type?: string; granted?: boolean; disclaimer_text_shown?: string }): Promise<any> => {
      return await request<{ success: boolean; consent: any }>('/api/user-consents', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    getConsent: async (type = 'ai_lab_analysis'): Promise<any> => {
      const res = await request<{ success: boolean; consent: any }>(`/api/user-consents?type=${encodeURIComponent(type)}`);
      return res.consent;
    }
  },

  healthProfile: {
    get: async (): Promise<any> => {
      const res = await request<{ success: boolean; profile: any }>('/api/health-profile');
      return res.profile;
    },
    update: async (data: any): Promise<any> => {
      const res = await request<{ success: boolean; profile: any }>('/api/health-profile', {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      return res.profile;
    }
  },

  dailyLogs: {
    getAll: async () => {
      const res = await request<{ success: boolean; data: any[] }>('/api/daily-checkins');
      return res.data || [];
    },
    save: async (log: any) => {
      const res = await request<{ success: boolean; data: any }>('/api/daily-checkins', {
        method: 'POST',
        body: JSON.stringify(log)
      });
      return res.data;
    }
  },

  dailyCheckins: {
    getAll: async () => {
      const res = await request<{ success: boolean; data: any[] }>('/api/daily-checkins');
      return res.data || [];
    },
    save: async (log: any) => {
      const res = await request<{ success: boolean; data: any }>('/api/daily-checkins', {
        method: 'POST',
        body: JSON.stringify(log)
      });
      return res.data;
    }
  },

  careCircle: {
    getAll: async () => {
      const res = await request<{ success: boolean; data: any[] }>('/api/care-circle');
      return res.data || [];
    },
    save: async (member: any) => {
      const res = await request<{ success: boolean; data: any[] }>('/api/care-circle', {
        method: 'POST',
        body: JSON.stringify(member)
      });
      return res.data || [];
    },
    delete: async (id: string) => {
      return await request<{ success: boolean }>(`/api/care-circle/${id}`, { method: 'DELETE' });
    }
  },

  // -------------------------------------------------------------
  // ADMIN LIVE MANAGEMENT API
  // -------------------------------------------------------------
  admin: {
    changePassword: async (oldPassword: string, newPassword: string): Promise<{ success: boolean; error?: string; message?: string }> => {
      const res: any = await request('/api/admin/change-password', {
        method: 'POST',
        body: JSON.stringify({ oldPassword, newPassword })
      });
      return res;
    },

    getDashboardStats: async () => {
      return await request<{ success: boolean; stats: any; recent_users: any[]; pending_organizations: any[]; recent_activity: any[] }>('/api/admin/stats');
    },

    // Users CRUD
    getUsers: async () => {
      const res = await request<{ success: boolean; data: any[] }>('/api/admin/users');
      return res.data || [];
    },
    createUser: async (user: any) => {
      return await request<{ success: boolean; data: any }>('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(user)
      });
    },
    updateUser: async (id: string, updates: any) => {
      return await request<{ success: boolean; data: any }>(`/api/admin/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
    },
    deleteUser: async (id: string) => {
      return await request<{ success: boolean; message: string }>(`/api/admin/users/${id}`, {
        method: 'DELETE'
      });
    },

    // Organizations CRUD
    getOrganizations: async () => {
      const res = await request<{ success: boolean; data: any[] }>('/api/admin/organizations');
      return res.data || [];
    },
    createOrganization: async (org: any) => {
      return await request<{ success: boolean; data: any }>('/api/admin/organizations', {
        method: 'POST',
        body: JSON.stringify(org)
      });
    },
    updateOrganization: async (id: string, updates: any) => {
      return await request<{ success: boolean; data: any }>(`/api/admin/organizations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
    },
    deleteOrganization: async (id: string) => {
      return await request<{ success: boolean }>(`/api/admin/organizations/${id}`, {
        method: 'DELETE'
      });
    },

    // Doctors CRUD
    getDoctors: async () => {
      const res = await request<{ success: boolean; data: any[] }>('/api/admin/doctors');
      return res.data || [];
    },
    createDoctor: async (doc: any) => {
      return await request<{ success: boolean; data: any }>('/api/admin/doctors', {
        method: 'POST',
        body: JSON.stringify(doc)
      });
    },
    updateDoctor: async (id: string, updates: any) => {
      return await request<{ success: boolean; data: any }>(`/api/admin/doctors/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
    },
    deleteDoctor: async (id: string) => {
      return await request<{ success: boolean }>(`/api/admin/doctors/${id}`, {
        method: 'DELETE'
      });
    },

    // Subscriptions CRUD
    getSubscriptions: async () => {
      const res = await request<{ success: boolean; data: any[] }>('/api/admin/subscriptions');
      return res.data || [];
    },
    createSubscription: async (sub: any) => {
      return await request<{ success: boolean; data: any }>('/api/admin/subscriptions', {
        method: 'POST',
        body: JSON.stringify(sub)
      });
    },
    updateSubscription: async (id: string, updates: any) => {
      return await request<{ success: boolean; data: any }>(`/api/admin/subscriptions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
    },

    // Broadcast Notifications CRUD
    getNotifications: async () => {
      const res = await request<{ success: boolean; data: any[] }>('/api/admin/notifications');
      return res.data || [];
    },
    sendNotification: async (notif: { title: string; body: string; type?: string; severity?: string }) => {
      return await request<{ success: boolean; data: any }>('/api/admin/notifications', {
        method: 'POST',
        body: JSON.stringify(notif)
      });
    },
    deleteNotification: async (id: string) => {
      return await request<{ success: boolean }>(`/api/admin/notifications/${id}`, {
        method: 'DELETE'
      });
    },

    // Support Tickets CRUD
    getSupportTickets: async () => {
      const res = await request<{ success: boolean; data: any[] }>('/api/admin/support-tickets');
      return res.data || [];
    },
    updateSupportTicket: async (id: string, updates: { status?: string; replyMessage?: string }) => {
      return await request<{ success: boolean; data: any }>(`/api/admin/support-tickets/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
    },

    // Audit Logs
    getAuditLogs: async () => {
      const res = await request<{ success: boolean; data: any[] }>('/api/admin/audit-logs');
      return res.data || [];
    },

    // Roles and Permissions Matrix
    getRoles: async () => {
      const DEFAULT_ROLES = [
        { id: 1, name: "System Admin", slug: "system_admin", description: "Full unrestricted platform & DB access", userCount: 1, isSystem: true },
        { id: 2, name: "Hospital Admin", slug: "hospital_admin", description: "Hospital operational management and staff allocation", userCount: 4, isSystem: true },
        { id: 3, name: "Clinic Admin", slug: "clinic_admin", description: "Clinic staff, schedule, and patient oversight", userCount: 8, isSystem: true },
        { id: 4, name: "Company Admin", slug: "company_admin", description: "Corporate wellness portal, subsidies & employee rosters", userCount: 3, isSystem: true },
        { id: 5, name: "Doctor", slug: "doctor", description: "Consultation, diagnosis, prescription & report validation", userCount: 12, isSystem: true },
        { id: 6, name: "Staff / Nurse", slug: "staff", description: "Vitals intake, triage desk, and appointment scheduling", userCount: 15, isSystem: true },
        { id: 7, name: "Caregiver", slug: "caregiver", description: "Assigned dependent monitoring, SOS escalation, medicine alerts", userCount: 20, isSystem: true },
        { id: 8, name: "Employee", slug: "employee", description: "Corporate wellness participant, step challenges, health wallet", userCount: 40, isSystem: true },
        { id: 9, name: "Patient", slug: "patient", description: "Standard personal PHR holder and digital twin user", userCount: 120, isSystem: true }
      ];

      const DEFAULT_PERMISSIONS = [
        { id: 101, code: "users.view", name: "View Users", category: "users", description: "Browse user accounts and profile data" },
        { id: 102, code: "users.create", name: "Create Users", category: "users", description: "Onboard new platform accounts" },
        { id: 103, code: "users.edit", name: "Edit Users", category: "users", description: "Modify user status, emails, and roles" },
        { id: 104, code: "users.delete", name: "Delete Users", category: "users", description: "Deactivate or purge user data (ABDM consent required)" },
        { id: 201, code: "orgs.view", name: "View Organizations", category: "organizations", description: "List hospitals and clinical centers" },
        { id: 202, code: "orgs.manage", name: "Manage Organizations", category: "organizations", description: "Approve clinics and configure integrations" },
        { id: 301, code: "clinical.vitals", name: "Manage Vitals", category: "clinical", description: "Input and audit physiological parameters" },
        { id: 302, code: "clinical.prescriptions", name: "Issue Prescriptions", category: "clinical", description: "Authorize Rx and e-sign digital prescriptions" },
        { id: 303, code: "clinical.reports", name: "Analyze Reports", category: "clinical", description: "Review lab documents and AI biomarkers" },
        { id: 401, code: "b2b.wellness", name: "Corporate Wellness", category: "corporate", description: "Manage B2B contracts, subsidies, and challenges" },
        { id: 501, code: "audit.view", name: "View Audit Logs", category: "security", description: "Inspect immutable tamper-evident system trails" },
        { id: 601, code: "billing.manage", name: "Manage Subscriptions", category: "billing", description: "Invoices, marketplace splits, and payment gateway" },
        { id: 701, code: "system.config", name: "System Settings", category: "system", description: "Environment variables, AI thresholds, ABDM gateway" }
      ];

      const DEFAULT_ROLE_PERMS: Record<number, number[]> = {
        1: [101, 102, 103, 104, 201, 202, 301, 302, 303, 401, 501, 601, 701],
        2: [101, 102, 103, 201, 301, 302, 303, 501, 601],
        3: [101, 102, 103, 201, 301, 302, 303],
        4: [101, 401, 601],
        5: [101, 301, 302, 303],
        6: [101, 301, 303],
        7: [301, 303],
        8: [401],
        9: [301, 303]
      };

      const savedPerms = localStorage.getItem("dhealora_admin_role_perms");
      const rolePerms = savedPerms ? JSON.parse(savedPerms) : DEFAULT_ROLE_PERMS;
      return {
        success: true,
        roles: DEFAULT_ROLES,
        permissions: DEFAULT_PERMISSIONS,
        role_permissions: rolePerms
      };
    },

    updateRolePermissions: async (roleId: number, permissionIds: number[]): Promise<{ success: boolean; error?: string }> => {
      try {
        const savedPerms = localStorage.getItem("dhealora_admin_role_perms");
        const current = savedPerms ? JSON.parse(savedPerms) : {};
        current[roleId] = permissionIds;
        localStorage.setItem("dhealora_admin_role_perms", JSON.stringify(current));
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err?.message || "Failed to update permissions" };
      }
    },

    // One-time clear all demo data
    clearAllDemoData: async () => {
      return await request<{ success: boolean; message: string }>('/api/admin/seed/clear', {
        method: 'POST'
      });
    },

    // Enrolled WebAuthn Credential Management
    getWebAuthnCredentials: async () => {
      const res = await request<{ success: boolean; data: any[]; error?: string }>('/api/admin/webauthn/credentials');
      return res.data || [];
    },

    revokeWebAuthnCredential: async (id: string) => {
      return await request<{ success: boolean; message?: string; error?: string }>(
        `/api/admin/webauthn/credentials/${id}`,
        {
          method: 'DELETE'
        }
      );
    },

    // Admin Patients Summary (Aggregated & Privacy-Safe)
    getPatientsSummary: async () => {
      return await request<{ success: boolean; summary?: any; error?: string }>('/api/admin/patients/summary');
    },

    // Admin Reports Full Audit
    getReports: async () => {
      return await request<{ success: boolean; reports?: any[]; total?: number; status_breakdown?: any; category_breakdown?: any; anomalies_count?: number; error?: string }>('/api/admin/reports');
    },

    // Admin Platform Analytics
    getAnalytics: async () => {
      return await request<{ success: boolean; analytics?: any; error?: string }>('/api/admin/analytics');
    }
  },

  // -------------------------------------------------------------
  // CORPORATE WELLNESS & EMPLOYEE ONBOARDING API
  // -------------------------------------------------------------
  employees: {
    getAll: async (params?: { department?: string; status?: string; search?: string; organization_id?: string }) => {
      const query = new URLSearchParams();
      if (params?.department) query.set('department', params.department);
      if (params?.status) query.set('status', params.status);
      if (params?.search) query.set('search', params.search);
      if (params?.organization_id) query.set('organization_id', params.organization_id);

      const qs = query.toString();
      return await request<{ success: boolean; data: any[]; total: number; organization_id: string }>(
        `/api/employees${qs ? `?${qs}` : ''}`
      );
    },

    getById: async (id: string) => {
      return await request<{ success: boolean; data: any; error?: string }>(`/api/employees/${id}`);
    },

    create: async (employee: any) => {
      return await request<{ success: boolean; data: any; invite_url: string; error?: string }>(
        '/api/employees',
        {
          method: 'POST',
          body: JSON.stringify(employee)
        }
      );
    },

    update: async (id: string, patch: any) => {
      return await request<{ success: boolean; data: any; error?: string }>(
        `/api/employees/${id}`,
        {
          method: 'PUT',
          body: JSON.stringify(patch)
        }
      );
    },

    delete: async (id: string) => {
      return await request<{ success: boolean; message: string; error?: string }>(
        `/api/employees/${id}`,
        {
          method: 'DELETE'
        }
      );
    },

    bulkImport: async (employees: any[], organization_id?: string) => {
      return await request<{
        success: boolean;
        results: Array<{ row: number; success: boolean; error?: string; employee?: any }>;
        imported_count: number;
        total_requested: number;
        error?: string;
      }>('/api/employees/bulk-import', {
        method: 'POST',
        body: JSON.stringify({ employees, organization_id })
      });
    },

    resendInvite: async (id: string) => {
      return await request<{ success: boolean; data: any; invite_url: string; message: string; error?: string }>(
        `/api/employees/${id}/resend-invite`,
        {
          method: 'POST'
        }
      );
    },

    verifyInvite: async (token: string) => {
      return await request<{
        success: boolean;
        data?: {
          employee_id: string;
          full_name: string;
          email: string;
          employee_code: string;
          department: string;
          designation: string;
          phone: string;
          blood_group: string;
          gender: string;
          organization_id: string;
          organization_name: string;
          is_activated: boolean;
          wellness_consent_given: boolean;
        };
        error?: string;
      }>(`/api/employees/invite/${token}`);
    },

    activate: async (payload: {
      token: string;
      password: string;
      phone?: string;
      bloodGroup?: string;
      gender?: string;
      dob?: string;
    }) => {
      const res: any = await request('/api/employees/activate', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (res.success && res.token) {
        setAuthToken(res.token);
        if (res.user?.email) {
          localStorage.setItem("dhealora_active_email", res.user.email);
        }
      }
      return res;
    },

    updateConsent: async (idOrMe: string, consent: boolean) => {
      const endpoint = idOrMe === 'me' ? '/api/employees/me/consent' : `/api/employees/${idOrMe}/consent`;
      return await request<{ success: boolean; wellness_consent_given: boolean; vitality_points?: number; message: string }>(
        endpoint,
        {
          method: 'PUT',
          body: JSON.stringify({ consent })
        }
      );
    },

    getHealthSummary: async (id: string) => {
      return await request<{
        success: boolean;
        data: {
          employee_id: string;
          wellness_consent_given: boolean;
          vitality_points: number;
          health_streak: number;
          wellness_score_band: 'Optimal' | 'Stable' | 'Needs Attention' | 'Elevated Risk';
          active_challenges_count: number;
          participation_status: string;
        };
      }>(`/api/employees/${id}/health-summary`);
    }
  },

  // -------------------------------------------------------------
  // COMPANY CHALLENGES API
  // -------------------------------------------------------------
  challenges: {
    getActive: async (organization_id?: string) => {
      const query = organization_id ? `?organization_id=${encodeURIComponent(organization_id)}` : '';
      return await request<{ success: boolean; data: any[] }>(`/api/challenges/active${query}`);
    },

    create: async (challenge: any) => {
      return await request<{ success: boolean; data: any; error?: string }>('/api/challenges', {
        method: 'POST',
        body: JSON.stringify(challenge)
      });
    },

    join: async (id: string) => {
      return await request<{ success: boolean; data: any; message: string; error?: string }>(
        `/api/challenges/${id}/join`,
        {
          method: 'POST'
        }
      );
    }
  },

  // -------------------------------------------------------------
  // CHAT HISTORY & PERSISTENCE API
  // -------------------------------------------------------------
  chat: {
    getHistory: async (userId?: string) => {
      const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
      return await request<{ success: boolean; data: any[] }>(`/api/chat/history${query}`);
    },

    saveMessage: async (message: any) => {
      return await request<{ success: boolean; data: any; error?: string }>('/api/chat/history', {
        method: 'POST',
        body: JSON.stringify(message)
      });
    },

    clearHistory: async (userId?: string) => {
      const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
      return await request<{ success: boolean; message: string }>(`/api/chat/history${query}`, {
        method: 'DELETE'
      });
    },

    updateFeedback: async (id: string, feedback?: 'like' | 'dislike', userId?: string) => {
      return await request<{ success: boolean }>(`/api/chat/history/${id}/feedback`, {
        method: 'POST',
        body: JSON.stringify({ feedback, userId })
      });
    }
  },

  // -------------------------------------------------------------
  // RAZORPAY PAYMENT GATEWAY CLIENT
  // -------------------------------------------------------------
  payments: {
    getConfig: async () => {
      return await request<{ success: boolean; key_id?: string; error?: string }>('/api/payments/config');
    },

    createOrder: async (payload: {
      amount: number;
      currency?: string;
      receipt?: string;
      related_entity_type: 'marketplace_order' | 'appointment';
      related_entity_id: string;
    }) => {
      return await request<{
        success: boolean;
        order?: { id: string; amount: number; currency: string; receipt: string };
        payment_id?: string;
        error?: string;
      }>('/api/payments/create-order', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    },

    verify: async (payload: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature?: string;
      related_entity_type?: string;
      related_entity_id?: string;
      amount?: number;
    }) => {
      return await request<{
        success: boolean;
        message?: string;
        payment?: any;
        error?: string;
      }>('/api/payments/verify', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    }
  },

  organizations: {
    getAll: async () => {
      const res = await request<{ success: boolean; data: any[] }>('/api/admin/organizations');
      return res.data || [];
    },
    create: async (org: any) => {
      return await request<{ success: boolean; data: any }>('/api/admin/organizations', {
        method: 'POST',
        body: JSON.stringify(org)
      });
    }
  }
};
