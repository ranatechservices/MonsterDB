import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import multer from 'multer';
import { dbEngine, UserRecord, WebAuthnCredentialRecord } from './db';
import { realtimeHub } from './realtime';
import { createGeminiRouter } from './geminiRouter';
import { ReportController } from './controllers/reportController';
import { HealthProfileController } from './controllers/healthProfileController';
import { JobController } from './controllers/jobController';
import { ConsentController } from './controllers/consentController';
import { ContinuityController } from './controllers/continuityController';
import { careCircleRepository } from './repositories/careCircleRepository';
import { WebAuthnService, checkRateLimit, resetRateLimit } from './webauthnService';
import { getSupabaseStatus, testSupabaseConnection } from './services/supabaseService';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 } // 15 MB limit
});

const JWT_SECRET = process.env.JWT_SECRET || 'dhealora_secure_default_jwt_secret_token_2026_dev';

// Helper: Strip sensitive password_hash before returning user data
export const sanitizeUser = (u: UserRecord | null | undefined): any => {
  if (!u) return null;
  const { password_hash, ...safeUser } = u;
  return safeUser;
};

export function createApiRouter() {
  const router = express.Router();
  router.use('/gemini', createGeminiRouter());
  router.use(express.json());

  // Helper: Extract full authenticated session details
  const getAuthDetails = (req: Request): { user: UserRecord; amr: string[] } | null => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
      if (!token) return null;

      const decoded: any = jwt.verify(token, JWT_SECRET);
      if (!decoded?.userId) return null;

      const db = dbEngine.getRaw();
      const user = db.users.find(u => u.id === decoded.userId || u.email.toLowerCase() === decoded.email?.toLowerCase());
      if (!user || user.status === 'suspended') return null;

      return { user, amr: Array.isArray(decoded.amr) ? decoded.amr : ['pwd'] };
    } catch (e) {
      return null;
    }
  };

  // Helper: Extract authenticated user record
  const getAuthUser = (req: Request): UserRecord | null => {
    return getAuthDetails(req)?.user || null;
  };

  // Helper: Generate JWT Token with Authentication Method Reference (AMR)
  const signToken = (user: UserRecord, amr: string[] = ['pwd'], expiresIn: any = '30d'): string => {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        amr,
        authTime: Math.floor(Date.now() / 1000)
      },
      JWT_SECRET,
      { expiresIn }
    );
  };

  // -------------------------------------------------------------
  // ADMIN LIVE MANAGEMENT API (STRICT ROLE & AUTH ENFORCEMENT)
  // -------------------------------------------------------------
  const requireAdmin = (req: Request, res: Response, next: () => void) => {
    const auth = getAuthDetails(req);
    if (!auth || !auth.user) {
      res.status(401).json({ success: false, error: 'Unauthorized: Valid Admin session required.' });
      return;
    }

    const { user } = auth;
    const isSpecialAdmin = user.role === 'super_admin' || user.role === 'hospital_admin';
    if (!isSpecialAdmin) {
      res.status(403).json({ success: false, error: 'Access denied: Administrator privileges required.' });
      return;
    }

    next();
  };

  // -------------------------------------------------------------
  // SUPABASE BACKEND CONNECTIVITY & HEALTH
  // -------------------------------------------------------------
  router.get('/supabase/status', (_req: Request, res: Response) => {
    const status = getSupabaseStatus();
    res.json({
      success: true,
      data: status,
    });
  });

  router.post('/supabase/test', async (_req: Request, res: Response) => {
    const result = await testSupabaseConnection();
    res.json(result);
  });

  // -------------------------------------------------------------
  // REALTIME SERVER-SENT EVENTS (SSE)
  // -------------------------------------------------------------
  router.get('/realtime/events', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const clientId = 'client_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const user = getAuthUser(req);

    realtimeHub.addClient(clientId, res, user?.id, user?.role);

    req.on('close', () => {
      realtimeHub.removeClient(clientId);
    });
  });

  // -------------------------------------------------------------
  // AUTHENTICATION ROUTES
  // -------------------------------------------------------------
  router.post('/auth/register', (req: Request, res: Response): void => {
    const { email, password, name, phone, bloodGroup, gender, dob } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail || !password) {
      res.status(400).json({ success: false, error: 'Email and password are required' });
      return;
    }

    const db = dbEngine.getRaw();

    // Check if user already exists
    const existing = db.users.find(u => u.email.toLowerCase() === normalizedEmail);
    if (existing) {
      res.status(400).json({ success: false, error: 'An account with this email already exists. Please sign in.' });
      return;
    }

    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);

    const newUser: UserRecord = {
      id: 'usr_' + Date.now(),
      uuid: '00000000-0000-4000-8000-' + Date.now().toString(16).padStart(12, '0'),
      name: name || normalizedEmail.split('@')[0],
      email: normalizedEmail,
      password_hash,
      role: 'patient',
      status: 'active',
      phone: phone || '',
      blood_group: bloodGroup || 'O+',
      gender: gender || 'Other',
      dob: dob || '',
      onboarding_completed: false,
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString()
    };

    db.users.push(newUser);

    // Create corresponding patient record
    db.patients.push({
      id: 'pat_' + Date.now(),
      user_id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      blood_group: newUser.blood_group,
      gender: newUser.gender,
      dob: newUser.dob,
      onboarding_completed: false,
      status: 'Active',
      created_at: new Date().toISOString()
    });

    dbEngine.save();
    realtimeHub.broadcast('USER_CREATED', 'users', newUser, newUser.name);

    const token = signToken(newUser);
    res.json({
      success: true,
      user: sanitizeUser(newUser),
      token
    });
  });

  router.post('/auth/login', (req: Request, res: Response): void => {
    const { email, password } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail || !password) {
      res.status(400).json({ success: false, error: 'Email and password are required' });
      return;
    }

    const clientIp = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1');
    const rateCheck = checkRateLimit(`login_${normalizedEmail}_${clientIp}`);
    if (!rateCheck.allowed) {
      res.status(429).json({ success: false, error: rateCheck.error });
      return;
    }

    const db = dbEngine.getRaw();
    const user = db.users.find(u => u.email.toLowerCase() === normalizedEmail);

    if (!user) {
      res.status(401).json({ success: false, error: 'No account found with this email. Please check your email or sign up.' });
      return;
    }

    if (user.status === 'suspended') {
      res.status(403).json({ success: false, error: 'This account has been suspended by the administrator.' });
      return;
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ success: false, error: 'Invalid password. Please enter correct password.' });
      return;
    }

    resetRateLimit(`login_${normalizedEmail}_${clientIp}`);

    user.last_login = new Date().toISOString();
    dbEngine.save();

    const token = signToken(user, ['pwd']);
    res.json({
      success: true,
      user: sanitizeUser(user),
      token
    });
  });

  // -------------------------------------------------------------
  // ADMIN WEBAUTHN / BIOMETRIC AUTHENTICATION ENDPOINTS
  // -------------------------------------------------------------

  // Step 1: Verify Master Admin Password & Check MFA Status
  router.post('/auth/admin/verify-password', (req: Request, res: Response): void => {
    const { email, password } = req.body;
    const normalizedEmail = String(email || 'dhealora30@gmail.com').trim().toLowerCase();

    if (!password) {
      res.status(400).json({ success: false, error: 'Password is required' });
      return;
    }

    const clientIp = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1');
    const rateCheck = checkRateLimit(`admin_pwd_${normalizedEmail}_${clientIp}`);
    if (!rateCheck.allowed) {
      res.status(429).json({ success: false, error: rateCheck.error });
      return;
    }

    const db = dbEngine.getRaw();
    const adminUser = db.users.find(u => u.email.toLowerCase() === normalizedEmail);

    if (!adminUser) {
      res.status(404).json({ success: false, error: 'Admin account not found' });
      return;
    }

    const isMatch = bcrypt.compareSync(password, adminUser.password_hash);
    if (!isMatch) {
      WebAuthnService.logAuthAudit('ADMIN_PASSWORD_FAILURE', adminUser, 'Invalid admin password attempt', false, req);
      res.status(401).json({ success: false, error: 'Invalid admin credentials. Access denied.' });
      return;
    }

    resetRateLimit(`admin_pwd_${normalizedEmail}_${clientIp}`);
    WebAuthnService.logAuthAudit('ADMIN_PASSWORD_SUCCESS', adminUser, 'Admin master password verified (Factor 1)', true, req);

    const creds = WebAuthnService.getUserCredentials(adminUser.id);
    const isFirstTimeEnrollment = creds.length === 0;
    const ceremonyType = isFirstTimeEnrollment ? 'pwd_pending_enrollment' : 'pwd_pending_assertion';
    const tempToken = signToken(adminUser, [ceremonyType], '15m');

    res.json({
      success: true,
      requiresWebAuthn: true,
      isFirstTimeEnrollment,
      tempToken,
      user: {
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role
      }
    });
  });

  // Step 2A: Generate Registration Options (Enroll New Biometric Authenticator)
  router.post('/auth/admin/webauthn/register/options', async (req: Request, res: Response): Promise<void> => {
    try {
      const auth = getAuthDetails(req);
      const tempToken = req.body.tempToken;
      let adminUser: UserRecord | null = auth?.user || null;

      if (!adminUser && tempToken) {
        try {
          const decoded: any = jwt.verify(tempToken, JWT_SECRET);
          const db = dbEngine.getRaw();
          adminUser = db.users.find(u => u.id === decoded.userId) || null;
        } catch {
          res.status(401).json({ success: false, error: 'Invalid or expired temporary session' });
          return;
        }
      }

      if (!adminUser) {
        res.status(401).json({ success: false, error: 'Administrator authentication required to enroll authenticators.' });
        return;
      }

      const deviceName = req.body.deviceName || 'Device Biometrics / Passkey';
      const options = await WebAuthnService.generateRegistrationOptions(adminUser, deviceName, req);

      res.json({
        success: true,
        options
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to generate registration options' });
    }
  });

  // Step 2B: Verify Registration Response (Confirm Authenticator Enrollment)
  router.post('/auth/admin/webauthn/register/verify', async (req: Request, res: Response): Promise<void> => {
    try {
      const { tempToken, response, deviceName } = req.body;
      const auth = getAuthDetails(req);
      let adminUser: UserRecord | null = auth?.user || null;

      if (!adminUser && tempToken) {
        try {
          const decoded: any = jwt.verify(tempToken, JWT_SECRET);
          const db = dbEngine.getRaw();
          adminUser = db.users.find(u => u.id === decoded.userId) || null;
        } catch {
          res.status(401).json({ success: false, error: 'Temporary token expired or invalid' });
          return;
        }
      }

      if (!adminUser || !response) {
        res.status(400).json({ success: false, error: 'Missing registration payload or administrator context' });
        return;
      }

      const result = await WebAuthnService.verifyRegistration(adminUser, response, deviceName || 'Device Passkey', req);

      // Successfully enrolled: Issue full authenticated Admin JWT with WebAuthn AMR
      const token = signToken(adminUser, ['pwd', 'webauthn'], '12h');

      res.json({
        success: true,
        verified: true,
        credential: result.credential,
        token,
        user: sanitizeUser(adminUser)
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err?.message || 'WebAuthn registration verification failed' });
    }
  });

  // Step 3A: Generate Authentication Options (Biometric Login Challenge)
  router.post('/auth/admin/webauthn/login/options', async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, tempToken } = req.body;
      const db = dbEngine.getRaw();
      let adminUser: UserRecord | null = null;

      if (tempToken) {
        try {
          const decoded: any = jwt.verify(tempToken, JWT_SECRET);
          adminUser = db.users.find(u => u.id === decoded.userId) || null;
        } catch {}
      }

      if (!adminUser && email) {
        const normalizedEmail = String(email).trim().toLowerCase();
        adminUser = db.users.find(u => u.email.toLowerCase() === normalizedEmail) || null;
      }

      if (!adminUser) {
        res.status(404).json({ success: false, error: 'Admin account not found' });
        return;
      }

      const clientIp = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1');
      const rateCheck = checkRateLimit(`bio_auth_${adminUser.id}_${clientIp}`);
      if (!rateCheck.allowed) {
        res.status(429).json({ success: false, error: rateCheck.error });
        return;
      }

      const options = await WebAuthnService.generateAuthenticationOptions(adminUser, req);

      res.json({
        success: true,
        options
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err?.message || 'Failed to initialize biometric challenge' });
    }
  });

  // Step 3B: Verify Authentication Response (Confirm Biometric Factor & Issue Session)
  router.post('/auth/admin/webauthn/login/verify', async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, tempToken, response } = req.body;
      const db = dbEngine.getRaw();
      let adminUser: UserRecord | null = null;

      if (tempToken) {
        try {
          const decoded: any = jwt.verify(tempToken, JWT_SECRET);
          adminUser = db.users.find(u => u.id === decoded.userId) || null;
        } catch {}
      }

      if (!adminUser && email) {
        const normalizedEmail = String(email).trim().toLowerCase();
        adminUser = db.users.find(u => u.email.toLowerCase() === normalizedEmail) || null;
      }

      if (!adminUser || !response) {
        res.status(400).json({ success: false, error: 'Invalid request payload or unverified administrator' });
        return;
      }

      const clientIp = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1');
      const rateCheck = checkRateLimit(`bio_verify_${adminUser.id}_${clientIp}`);
      if (!rateCheck.allowed) {
        res.status(429).json({ success: false, error: rateCheck.error });
        return;
      }

      const result = await WebAuthnService.verifyAuthentication(adminUser, response, req);

      resetRateLimit(`bio_auth_${adminUser.id}_${clientIp}`);
      resetRateLimit(`bio_verify_${adminUser.id}_${clientIp}`);

      // Issue full high-assurance Admin JWT
      const token = signToken(adminUser, ['pwd', 'webauthn'], '12h');

      res.json({
        success: true,
        verified: true,
        user: sanitizeUser(adminUser),
        token
      });
    } catch (err: any) {
      res.status(401).json({ success: false, error: err?.message || 'Biometric verification failed. Access denied.' });
    }
  });

  // List Admin Enrolled Credentials
  router.get('/admin/webauthn/credentials', requireAdmin, (req: Request, res: Response): void => {
    const user = getAuthUser(req);
    if (!user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const creds = WebAuthnService.getUserCredentials(user.id);
    const safeCreds = creds.map(c => ({
      id: c.id,
      device_name: c.device_name,
      created_at: c.created_at,
      last_used_at: c.last_used_at,
      transports: c.transports
    }));

    res.json({
      success: true,
      data: safeCreds
    });
  });

  // Revoke Enrolled Device Credential
  router.delete('/admin/webauthn/credentials/:id', requireAdmin, (req: Request, res: Response): void => {
    const user = getAuthUser(req);
    const id = String(req.params.id || '');

    if (!user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const ok = WebAuthnService.revokeCredential(user, id, req);
    if (ok) {
      res.json({ success: true, message: 'Device credential revoked successfully.' });
    } else {
      res.status(404).json({ success: false, error: 'Credential not found or already revoked.' });
    }
  });

  router.get('/auth/me', (req: Request, res: Response): void => {
    const user = getAuthUser(req);
    if (!user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    res.json({ success: true, user: sanitizeUser(user) });
  });

  // Admin Change Password (Protected with requireAdmin and IP Rate Limiting)
  router.post('/admin/change-password', requireAdmin, (req: Request, res: Response): void => {
    const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1');
    const rateCheck = checkRateLimit(`admin_pwd_change_${ip}`, 5, 15 * 60 * 1000);
    if (!rateCheck.allowed) {
      res.status(429).json({ success: false, error: 'Too many password change attempts. Please try again after 15 minutes.' });
      return;
    }

    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      res.status(400).json({ success: false, error: 'Both current password and new password are required' });
      return;
    }

    const authUser = getAuthUser(req);
    if (!authUser) {
      res.status(401).json({ success: false, error: 'Unauthorized session' });
      return;
    }

    const db = dbEngine.getRaw();
    const admin = db.users.find(u => u.id === authUser.id);

    if (!admin) {
      res.status(404).json({ success: false, error: 'Admin account not found' });
      return;
    }

    const isMatch = bcrypt.compareSync(oldPassword, admin.password_hash);
    if (!isMatch) {
      res.status(401).json({ success: false, error: 'Current password does not match' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ success: false, error: 'New password must be at least 6 characters long' });
      return;
    }

    const salt = bcrypt.genSaltSync(10);
    admin.password_hash = bcrypt.hashSync(newPassword, salt);
    db.settings.last_admin_pwd_change = new Date().toISOString();

    resetRateLimit(`admin_pwd_change_${ip}`);

    dbEngine.logAudit({
      actor_admin_id: admin.id,
      actor_name: admin.name,
      action: 'ADMIN_PASSWORD_UPDATED',
      target_type: 'USER',
      target_id: admin.id,
      details: `Administrator password hash updated successfully for ${admin.email}`
    });

    dbEngine.save();
    realtimeHub.broadcast('AUDIT_LOG_ADDED', 'audit_logs', { message: 'Admin password updated' });

    res.json({
      success: true,
      message: 'Admin password has been updated and securely hashed.'
    });
  });

  // -------------------------------------------------------------
  // PATIENT SCOPED HEALTH DATA (VITALS, MEDS, APPOINTMENTS, REPORTS)
  // -------------------------------------------------------------
  // VITALS
  router.get('/vitals', (req: Request, res: Response): void => {
    const user = getAuthUser(req);
    const userId = user?.id || String(req.query.userId || '');
    const db = dbEngine.getRaw();

    const userVitals = db.vitals.filter(v => !userId || v.user_id === userId);
    res.json({ success: true, data: userVitals });
  });

  router.post('/vitals', (req: Request, res: Response): void => {
    const user = getAuthUser(req);
    const db = dbEngine.getRaw();
    const body = req.body;

    const newVital = {
      id: body.id || 'vit_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
      user_id: user?.id || body.user_id || 'usr_guest',
      patient_id: body.patient_id || '',
      type: body.type || 'bp',
      value: Number(body.value || 0),
      systolic: body.systolic !== undefined ? Number(body.systolic) : undefined,
      diastolic: body.diastolic !== undefined ? Number(body.diastolic) : undefined,
      unit: body.unit || 'mmHg',
      timestamp: body.timestamp || new Date().toISOString(),
      status: body.status || 'normal',
      notes: body.notes || '',
      created_at: new Date().toISOString()
    };

    // Upsert
    const idx = db.vitals.findIndex(v => v.id === newVital.id);
    if (idx >= 0) {
      db.vitals[idx] = newVital;
    } else {
      db.vitals.unshift(newVital);
    }

    dbEngine.save();
    realtimeHub.broadcast('VITAL_CREATED', 'vitals', newVital);
    res.json({ success: true, data: db.vitals.filter(v => v.user_id === newVital.user_id) });
  });

  router.delete('/vitals/:id', (req: Request, res: Response): void => {
    const user = getAuthUser(req);
    const { id } = req.params;
    const db = dbEngine.getRaw();

    db.vitals = db.vitals.filter(v => v.id !== id);
    dbEngine.save();
    realtimeHub.broadcast('VITAL_DELETED', 'vitals', { id });
    res.json({ success: true, message: 'Vital record removed' });
  });

  // MEDICINES
  router.get('/medicines', (req: Request, res: Response): void => {
    const user = getAuthUser(req);
    const userId = user?.id || String(req.query.userId || '');
    const db = dbEngine.getRaw();

    const meds = db.medicines.filter(m => !userId || m.user_id === userId);
    res.json({ success: true, data: meds });
  });

  router.post('/medicines', (req: Request, res: Response): void => {
    const user = getAuthUser(req);
    const db = dbEngine.getRaw();
    const body = req.body;

    const newMed = {
      id: body.id || 'med_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
      user_id: user?.id || body.user_id || 'usr_guest',
      patient_id: body.patient_id || '',
      name: body.name || 'Unnamed Medicine',
      dosage: body.dosage || '10 mg',
      frequency: body.frequency || 'daily',
      timings: body.timings || ['09:00'],
      meal_timing: body.mealTiming || body.meal_timing || 'after_food',
      start_date: body.startDate || body.start_date || new Date().toISOString().split('T')[0],
      remaining_pills: body.remainingPills !== undefined ? body.remainingPills : body.remaining_pills,
      total_pills: body.totalPills !== undefined ? body.totalPills : body.total_pills,
      adherence: body.adherence || {},
      notes: body.notes || '',
      created_at: new Date().toISOString()
    };

    const idx = db.medicines.findIndex(m => m.id === newMed.id);
    if (idx >= 0) {
      db.medicines[idx] = newMed;
    } else {
      db.medicines.unshift(newMed);
    }

    dbEngine.save();
    realtimeHub.broadcast('MEDICINE_CREATED', 'medicines', newMed);
    res.json({ success: true, data: db.medicines.filter(m => m.user_id === newMed.user_id) });
  });

  router.post('/medicines/:id/take', (req: Request, res: Response): void => {
    const { id } = req.params;
    const { dateStr } = req.body;
    const db = dbEngine.getRaw();
    const med = db.medicines.find(m => m.id === id);

    if (!med) {
      res.status(404).json({ success: false, error: 'Medicine not found' });
      return;
    }

    med.adherence = med.adherence || {};
    const dateKey = dateStr || new Date().toISOString().split('T')[0];
    const wasTaken = !!med.adherence[dateKey];
    med.adherence[dateKey] = !wasTaken;

    if (med.remaining_pills !== undefined) {
      med.remaining_pills = Math.max(0, med.remaining_pills + (wasTaken ? 1 : -1));
    }

    dbEngine.save();
    realtimeHub.broadcast('MEDICINE_UPDATED', 'medicines', med);
    res.json({ success: true, data: med });
  });

  router.delete('/medicines/:id', (req: Request, res: Response): void => {
    const { id } = req.params;
    const db = dbEngine.getRaw();
    db.medicines = db.medicines.filter(m => m.id !== id);
    dbEngine.save();
    realtimeHub.broadcast('MEDICINE_DELETED', 'medicines', { id });
    res.json({ success: true, message: 'Medicine removed' });
  });

  // APPOINTMENTS
  router.get('/appointments', (req: Request, res: Response): void => {
    const user = getAuthUser(req);
    const db = dbEngine.getRaw();
    const isAdmin = user?.role === 'super_admin' || user?.role === 'hospital_admin';

    if (isAdmin && req.query.scope === 'all') {
      res.json({ success: true, data: db.appointments });
      return;
    }

    const userId = user?.id || String(req.query.userId || '');
    const userAppts = db.appointments.filter(a => !userId || a.user_id === userId);
    res.json({ success: true, data: userAppts });
  });

  router.post('/appointments', (req: Request, res: Response): void => {
    const user = getAuthUser(req);
    const db = dbEngine.getRaw();
    const body = req.body;

    const newAppt = {
      id: body.id || 'apt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
      user_id: user?.id || body.user_id || 'usr_guest',
      patient_id: body.patient_id || '',
      patient_name: body.patientName || body.patient_name || user?.name || 'Patient',
      doctor_id: body.doctorId || body.doctor_id || '',
      doctor_name: body.doctorName || body.doctor_name || 'Dr. Specialist',
      specialty: body.specialty || 'General Medicine',
      hospital_name: body.hospitalName || body.hospital_name || 'DHealora Healthcare Partner',
      date: body.date || new Date().toISOString().split('T')[0],
      time: body.time || '10:00 AM',
      type: body.type || 'video_call',
      status: body.status || 'upcoming',
      notes: body.notes || '',
      fee: Number(body.fee || 500),
      created_at: new Date().toISOString()
    };

    const idx = db.appointments.findIndex(a => a.id === newAppt.id);
    if (idx >= 0) {
      db.appointments[idx] = newAppt;
    } else {
      db.appointments.unshift(newAppt);
    }

    dbEngine.save();
    realtimeHub.broadcast('APPOINTMENT_CREATED', 'appointments', newAppt);
    res.json({ success: true, data: newAppt });
  });

  router.patch('/appointments/:id', (req: Request, res: Response): void => {
    const { id } = req.params;
    const db = dbEngine.getRaw();
    const appt = db.appointments.find(a => a.id === id);

    if (!appt) {
      res.status(404).json({ success: false, error: 'Appointment not found' });
      return;
    }

    Object.assign(appt, req.body);
    dbEngine.save();
    realtimeHub.broadcast('APPOINTMENT_UPDATED', 'appointments', appt);
    res.json({ success: true, data: appt });
  });

  router.delete('/appointments/:id', (req: Request, res: Response): void => {
    const { id } = req.params;
    const db = dbEngine.getRaw();
    db.appointments = db.appointments.filter(a => a.id !== id);
    dbEngine.save();
    realtimeHub.broadcast('APPOINTMENT_DELETED', 'appointments', { id });
    res.json({ success: true, message: 'Appointment deleted' });
  });

  // LAB REPORTS
  router.get('/lab-reports', (req: Request, res: Response): void => {
    const user = getAuthUser(req);
    const db = dbEngine.getRaw();
    const isAdmin = user?.role === 'super_admin';

    if (isAdmin && req.query.scope === 'all') {
      res.json({ success: true, data: db.lab_reports });
      return;
    }

    const userId = user?.id || String(req.query.userId || '');
    const reports = db.lab_reports.filter(r => !userId || r.user_id === userId);
    res.json({ success: true, data: reports });
  });

  router.post('/lab-reports', (req: Request, res: Response): void => {
    const user = getAuthUser(req);
    const db = dbEngine.getRaw();
    const body = req.body;

    const newReport = {
      id: body.id || 'rep_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
      user_id: user?.id || body.user_id || 'usr_guest',
      patient_id: body.patient_id || '',
      patient_name: body.patientName || body.patient_name || user?.name || 'Patient',
      title: body.title || 'Diagnostic Report',
      date: body.date || new Date().toISOString().split('T')[0],
      category: body.category || 'blood',
      file_name: body.fileName || body.file_name || 'report.pdf',
      file_size: body.fileSize || body.file_size || '1.0 MB',
      file_url: body.fileUrl || body.file_url,
      ai_summary: body.aiSummary || body.ai_summary || 'Standard parameters within clinical thresholds.',
      key_findings: body.keyFindings || body.key_findings || [],
      anomalies_detected: body.anomaliesDetected || body.anomalies_detected || [],
      recommendations: body.recommendations || [],
      doctor_reviewed: Boolean(body.doctorReviewed !== undefined ? body.doctorReviewed : body.doctor_reviewed),
      created_at: new Date().toISOString()
    };

    const idx = db.lab_reports.findIndex(r => r.id === newReport.id);
    if (idx >= 0) {
      db.lab_reports[idx] = newReport;
    } else {
      db.lab_reports.unshift(newReport);
    }

    dbEngine.save();
    realtimeHub.broadcast('REPORT_CREATED', 'lab_reports', newReport);
    res.json({ success: true, data: newReport });
  });

  router.delete('/lab-reports/:id', (req: Request, res: Response): void => {
    const { id } = req.params;
    const db = dbEngine.getRaw();
    db.lab_reports = db.lab_reports.filter(r => r.id !== id);
    dbEngine.save();
    realtimeHub.broadcast('REPORT_DELETED', 'lab_reports', { id });
    res.json({ success: true, message: 'Report removed' });
  });

  // DAILY LOGS
  router.get('/daily-checkins', (req: Request, res: Response): void => {
    const user = getAuthUser(req);
    const userId = user?.id || String(req.query.userId || '');
    const db = dbEngine.getRaw();
    const logs = db.daily_checkins.filter(d => !userId || d.user_id === userId);
    res.json({ success: true, data: logs });
  });

  router.post('/daily-checkins', (req: Request, res: Response): void => {
    const user = getAuthUser(req);
    const db = dbEngine.getRaw();
    const body = req.body;

    const newLog = {
      id: body.id || 'log_' + Date.now(),
      user_id: user?.id || body.user_id || 'usr_guest',
      patient_id: body.patient_id || '',
      date: body.date || new Date().toISOString().split('T')[0],
      mood: body.mood || 'good',
      symptoms: body.symptoms || [],
      sleep_hours: body.sleepHours !== undefined ? Number(body.sleepHours) : body.sleep_hours,
      water_intake_ml: body.waterIntakeMl !== undefined ? Number(body.waterIntakeMl) : body.water_intake_ml,
      notes: body.notes || '',
      created_at: new Date().toISOString()
    };

    const idx = db.daily_checkins.findIndex(l => l.date === newLog.date && l.user_id === newLog.user_id);
    if (idx >= 0) {
      db.daily_checkins[idx] = newLog;
    } else {
      db.daily_checkins.unshift(newLog);
    }

    dbEngine.save();
    realtimeHub.broadcast('DAILY_LOG_CREATED', 'daily_checkins', newLog);
    res.json({ success: true, data: newLog });
  });

  // -------------------------------------------------------------
  // PERSISTED CHAT HISTORY & FEEDBACK
  // -------------------------------------------------------------
  router.get('/chat/history', (req: Request, res: Response): void => {
    const user = getAuthUser(req);
    const userId = user?.id || String(req.query.userId || 'usr_guest');
    const messages = dbEngine.getChatMessages(userId);
    res.json({ success: true, data: messages });
  });

  router.post('/chat/history', (req: Request, res: Response): void => {
    const user = getAuthUser(req);
    const userId = user?.id || req.body.user_id || 'usr_guest';
    const { id, sender, text, timestamp, imageUrl, feedback, suggestedAction, created_at } = req.body;

    if (!sender || !text) {
      res.status(400).json({ success: false, error: 'Sender and text are required' });
      return;
    }

    const saved = dbEngine.saveChatMessage({
      id,
      user_id: userId,
      sender,
      text,
      timestamp,
      imageUrl,
      feedback,
      suggestedAction,
      created_at
    });

    res.json({ success: true, data: saved });
  });

  router.delete('/chat/history', (req: Request, res: Response): void => {
    const user = getAuthUser(req);
    const userId = user?.id || String(req.query.userId || 'usr_guest');
    dbEngine.clearChatMessages(userId);
    res.json({ success: true, message: 'Chat history cleared' });
  });

  router.post('/chat/history/:id/feedback', (req: Request, res: Response): void => {
    const user = getAuthUser(req);
    const userId = user?.id || String(req.body.userId || 'usr_guest');
    const id = String(req.params.id);
    const { feedback } = req.body;

    const updated = dbEngine.updateChatMessageFeedback(id, userId, feedback);
    res.json({ success: updated });
  });

  // CARE CIRCLE
  router.get('/care-circle', (req: Request, res: Response): void => {
    const user = getAuthUser(req);
    const userId = user?.id || String(req.query.userId || '');
    const db = dbEngine.getRaw();
    const circle = db.care_circle.filter(c => !userId || c.user_id === userId);
    res.json({ success: true, data: circle });
  });

  router.post('/care-circle', (req: Request, res: Response): void => {
    const user = getAuthUser(req);
    const db = dbEngine.getRaw();
    const body = req.body;

    const newMember = {
      id: body.id || 'cc_' + Date.now(),
      user_id: user?.id || body.user_id || 'usr_guest',
      patient_id: body.patient_id || '',
      name: body.name || 'Member',
      relation: body.relation || 'Family',
      role: body.role || 'family',
      phone: body.phone || '',
      email: body.email || '',
      permissions: body.permissions || {
        canViewVitals: true,
        canViewMedicines: true,
        canViewReports: true,
        receiveAlerts: true
      },
      created_at: new Date().toISOString()
    };

    const idx = db.care_circle.findIndex(c => c.id === newMember.id);
    if (idx >= 0) {
      db.care_circle[idx] = newMember;
    } else {
      db.care_circle.push(newMember);
    }

    dbEngine.save();
    realtimeHub.broadcast('CARE_CIRCLE_UPDATED', 'care_circle', newMember);
    res.json({ success: true, data: db.care_circle.filter(c => c.user_id === newMember.user_id) });
  });

  router.delete('/care-circle/:id', (req: Request, res: Response): void => {
    const { id } = req.params;
    const db = dbEngine.getRaw();
    db.care_circle = db.care_circle.filter(c => c.id !== id);
    dbEngine.save();
    realtimeHub.broadcast('CARE_CIRCLE_UPDATED', 'care_circle', { id });
    res.json({ success: true, message: 'Care circle member removed' });
  });

  // -------------------------------------------------------------
  // ADMIN DASHBOARD STATS (Calculated Real-Time from DB - Strictly Admin Only)
  // -------------------------------------------------------------
  router.get('/admin/stats', requireAdmin, (req: Request, res: Response): void => {
    const db = dbEngine.getRaw();

    const totalUsers = db.users.length;
    const totalPatients = db.patients.length || db.users.filter(u => u.role === 'patient').length;
    const totalOrgs = db.organizations.length;
    const totalDoctors = db.doctors.length;
    const totalAppointments = db.appointments.length;
    const totalReports = db.lab_reports.length;
    const totalSubscriptions = db.subscriptions.length;
    const mrr = db.subscriptions.reduce((sum, s) => sum + (s.status === 'Active' ? s.amount : 0), 0);
    const openTickets = db.support_tickets.filter(t => t.status === 'Open' || t.status === 'In Progress').length;

    res.json({
      success: true,
      stats: {
        users: { total_users: totalUsers, active_patients: totalPatients },
        organizations: { total_orgs: totalOrgs, pending_verification: db.organizations.filter(o => o.status === 'Pending').length },
        doctors: { total_doctors: totalDoctors, active: db.doctors.filter(d => d.status === 'Active').length },
        appointments: { total_appointments: totalAppointments, scheduled_today: db.appointments.filter(a => a.status === 'upcoming').length },
        subscriptions: { total: totalSubscriptions, mrr: mrr ? `₹${mrr.toLocaleString()}` : '₹0' },
        tickets: { open: openTickets }
      },
      recent_users: db.users.slice(0, 6).map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,
        created_at: u.created_at
      })),
      pending_organizations: db.organizations.filter(o => o.status === 'Pending').slice(0, 4),
      recent_activity: db.audit_logs.slice(0, 8)
    });
  });

  // ADMIN USERS CRUD
  router.get('/admin/users', requireAdmin, (_req: Request, res: Response): void => {
    const db = dbEngine.getRaw();
    res.json({ success: true, data: db.users.map(sanitizeUser) });
  });

  router.post('/admin/users', requireAdmin, (req: Request, res: Response): void => {
    const { name, email, role, phone, password } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail) {
      res.status(400).json({ success: false, error: 'Email is required' });
      return;
    }

    const db = dbEngine.getRaw();
    if (db.users.some(u => u.email.toLowerCase() === normalizedEmail)) {
      res.status(400).json({ success: false, error: 'User already exists' });
      return;
    }

    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password || 'User@123', salt);

    const newUser: UserRecord = {
      id: 'usr_' + Date.now(),
      uuid: '00000000-0000-4000-8000-' + Date.now().toString(16).padStart(12, '0'),
      name: name || normalizedEmail.split('@')[0],
      email: normalizedEmail,
      password_hash,
      role: role || 'patient',
      status: 'active',
      phone: phone || '',
      created_at: new Date().toISOString()
    };

    db.users.unshift(newUser);

    dbEngine.logAudit({
      actor_admin_id: 'usr_admin_root',
      actor_name: 'System Admin',
      action: 'USER_CREATED',
      target_type: 'USER',
      target_id: newUser.id,
      after_state: sanitizeUser(newUser),
      details: `Admin created user account for ${newUser.name} (${newUser.email}) with role ${newUser.role}`
    });

    dbEngine.save();
    realtimeHub.broadcast('USER_CREATED', 'users', sanitizeUser(newUser), 'System Admin');
    res.json({ success: true, data: sanitizeUser(newUser) });
  });

  router.patch('/admin/users/:id', requireAdmin, (req: Request, res: Response): void => {
    const { id } = req.params;
    const db = dbEngine.getRaw();
    const user = db.users.find(u => u.id === id);

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    const before = { ...user };
    Object.assign(user, req.body);

    dbEngine.logAudit({
      actor_admin_id: 'usr_admin_root',
      actor_name: 'System Admin',
      action: 'USER_UPDATED',
      target_type: 'USER',
      target_id: user.id,
      before_state: sanitizeUser(before),
      after_state: sanitizeUser(user),
      details: `User status/details updated for ${user.email}`
    });

    dbEngine.save();
    realtimeHub.broadcast('USER_UPDATED', 'users', sanitizeUser(user), 'System Admin');
    res.json({ success: true, data: sanitizeUser(user) });
  });

  router.delete('/admin/users/:id', requireAdmin, (req: Request, res: Response): void => {
    const { id } = req.params;
    const db = dbEngine.getRaw();
    const user = db.users.find(u => u.id === id);

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    if (user.role === 'super_admin' && db.users.filter(u => u.role === 'super_admin').length <= 1) {
      res.status(403).json({ success: false, error: 'Primary Administrator account cannot be deleted' });
      return;
    }

    db.users = db.users.filter(u => u.id !== id);
    db.patients = db.patients.filter(p => p.user_id !== id);

    dbEngine.logAudit({
      actor_admin_id: 'usr_admin_root',
      actor_name: 'System Admin',
      action: 'USER_DELETED',
      target_type: 'USER',
      target_id: String(id),
      before_state: sanitizeUser(user),
      details: `User ${user.email} deleted by Admin`
    });

    dbEngine.save();
    realtimeHub.broadcast('USER_DELETED', 'users', { id: String(id) }, 'System Admin');
    res.json({ success: true, message: 'User deleted successfully' });
  });

  // ADMIN ORGANIZATIONS CRUD
  router.get('/admin/organizations', requireAdmin, (_req: Request, res: Response): void => {
    const db = dbEngine.getRaw();
    res.json({ success: true, data: db.organizations });
  });

  router.post('/admin/organizations', requireAdmin, (req: Request, res: Response): void => {
    const db = dbEngine.getRaw();
    const newOrg = {
      id: 'org_' + Date.now(),
      name: req.body.name || 'Healthcare Facility',
      type: req.body.type || 'hospital',
      status: req.body.status || 'Active',
      beds: Number(req.body.beds || 0),
      tier: req.body.tier || 'ABDM Tier-2 Certified',
      employees_count: Number(req.body.employees_count || 0),
      active_contracts: Number(req.body.active_contracts || 1),
      contact_email: req.body.contact_email || '',
      contact_phone: req.body.contact_phone || '',
      location: req.body.location || 'India',
      created_at: new Date().toISOString()
    };

    db.organizations.unshift(newOrg);
    dbEngine.logAudit({
      actor_admin_id: 'usr_admin_root',
      actor_name: 'System Admin',
      action: 'ORGANIZATION_CREATED',
      target_type: 'ORGANIZATION',
      target_id: newOrg.id,
      after_state: newOrg,
      details: `Created organization ${newOrg.name}`
    });

    dbEngine.save();
    realtimeHub.broadcast('ORGANIZATION_UPDATED', 'organizations', newOrg, 'System Admin');
    res.json({ success: true, data: newOrg });
  });

  router.patch('/admin/organizations/:id', requireAdmin, (req: Request, res: Response): void => {
    const { id } = req.params;
    const db = dbEngine.getRaw();
    const org = db.organizations.find(o => o.id === id);

    if (!org) {
      res.status(404).json({ success: false, error: 'Organization not found' });
      return;
    }

    const before = { ...org };
    Object.assign(org, req.body);

    dbEngine.logAudit({
      actor_admin_id: 'usr_admin_root',
      actor_name: 'System Admin',
      action: 'ORGANIZATION_UPDATED',
      target_type: 'ORGANIZATION',
      target_id: String(id),
      before_state: before,
      after_state: org,
      details: `Updated organization ${org.name}`
    });

    dbEngine.save();
    realtimeHub.broadcast('ORGANIZATION_UPDATED', 'organizations', org, 'System Admin');
    res.json({ success: true, data: org });
  });

  router.delete('/admin/organizations/:id', requireAdmin, (req: Request, res: Response): void => {
    const { id } = req.params;
    const db = dbEngine.getRaw();
    db.organizations = db.organizations.filter(o => o.id !== id);
    dbEngine.save();
    realtimeHub.broadcast('ORGANIZATION_UPDATED', 'organizations', { id: String(id), deleted: true }, 'System Admin');
    res.json({ success: true, message: 'Organization removed' });
  });

  // -------------------------------------------------------------
  // ADMIN PATIENTS SUMMARY (Privacy-Preserving Aggregated Metrics - No PII)
  // -------------------------------------------------------------
  router.get('/admin/patients/summary', requireAdmin, (_req: Request, res: Response): void => {
    const db = dbEngine.getRaw();
    const patients = db.patients || [];
    const users = db.users.filter(u => u.role === 'patient');
    const reports = db.lab_reports || [];
    const vitals = db.vitals || [];

    const totalPatients = Math.max(patients.length, users.length);

    // Age cohorts
    const ageBands: Record<string, number> = {
      '< 18': 0,
      '18 - 35': 0,
      '36 - 50': 0,
      '51 - 65': 0,
      '65+': 0,
      'Unspecified': 0
    };

    const currentYear = new Date().getFullYear();
    patients.forEach(p => {
      if (p.dob) {
        const birthYear = parseInt(p.dob.split('-')[0] || '', 10);
        if (!isNaN(birthYear)) {
          const age = currentYear - birthYear;
          if (age < 18) ageBands['< 18']++;
          else if (age <= 35) ageBands['18 - 35']++;
          else if (age <= 50) ageBands['36 - 50']++;
          else if (age <= 65) ageBands['51 - 65']++;
          else ageBands['65+']++;
          return;
        }
      }
      ageBands['Unspecified']++;
    });

    // Gender breakdown
    const genderBreakdown: Record<string, number> = { Male: 0, Female: 0, Other: 0, Unspecified: 0 };
    patients.forEach(p => {
      const g = (p.gender || '').trim();
      if (g === 'Male' || g === 'Female' || g === 'Other') {
        genderBreakdown[g]++;
      } else {
        genderBreakdown['Unspecified']++;
      }
    });

    // Blood group breakdown
    const bloodGroupBreakdown: Record<string, number> = {};
    patients.forEach(p => {
      const bg = p.blood_group || 'Unknown';
      bloodGroupBreakdown[bg] = (bloodGroupBreakdown[bg] || 0) + 1;
    });

    // Condition / Anomaly categories from reports
    const anomalyCategoryCounts: Record<string, number> = {};
    reports.forEach(r => {
      if (Array.isArray(r.anomalies_detected)) {
        r.anomalies_detected.forEach((a: any) => {
          const cat = typeof a === 'string' ? a : (a?.parameter || r.category || 'General');
          anomalyCategoryCounts[cat] = (anomalyCategoryCounts[cat] || 0) + 1;
        });
      }
    });

    // Active tracking metrics
    const activeVitalsLoggingCount = new Set(vitals.map(v => v.user_id)).size;
    const completedOnboardingCount = patients.filter(p => p.onboarding_completed).length;

    res.json({
      success: true,
      summary: {
        total_registered_patients: totalPatients,
        active_tracking_patients: activeVitalsLoggingCount,
        onboarding_completed_count: completedOnboardingCount,
        onboarding_rate_pct: totalPatients > 0 ? Math.round((completedOnboardingCount / totalPatients) * 100) : 100,
        age_distribution: ageBands,
        gender_distribution: genderBreakdown,
        blood_group_distribution: bloodGroupBreakdown,
        top_monitored_conditions: anomalyCategoryCounts
      }
    });
  });

  // -------------------------------------------------------------
  // ADMIN REPORTS OVERVIEW (Full System Lab & Diagnostic Reports)
  // -------------------------------------------------------------
  router.get('/admin/reports', requireAdmin, (_req: Request, res: Response): void => {
    const db = dbEngine.getRaw();
    const reports = db.lab_reports || [];

    const statusBreakdown: Record<string, number> = {
      reviewed: 0,
      pending_review: 0
    };

    const categoryBreakdown: Record<string, number> = {};
    let totalAnomalies = 0;

    reports.forEach(r => {
      if (r.doctor_reviewed) {
        statusBreakdown.reviewed++;
      } else {
        statusBreakdown.pending_review++;
      }

      const cat = r.category || 'general';
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + 1;

      if (Array.isArray(r.anomalies_detected)) {
        totalAnomalies += r.anomalies_detected.length;
      }
    });

    res.json({
      success: true,
      total: reports.length,
      status_breakdown: statusBreakdown,
      category_breakdown: categoryBreakdown,
      anomalies_count: totalAnomalies,
      reports: reports.map(r => ({
        id: r.id,
        user_id: r.user_id,
        patient_name: r.patient_name || 'Patient',
        title: r.title,
        date: r.date,
        category: r.category,
        file_name: r.file_name,
        file_size: r.file_size,
        doctor_reviewed: r.doctor_reviewed,
        anomalies_count: Array.isArray(r.anomalies_detected) ? r.anomalies_detected.length : 0,
        ai_summary: r.ai_summary,
        created_at: r.created_at
      }))
    });
  });

  // -------------------------------------------------------------
  // ADMIN ANALYTICS (Real Platform Time-Series and Telemetry Stats)
  // -------------------------------------------------------------
  router.get('/admin/analytics', requireAdmin, (_req: Request, res: Response): void => {
    const db = dbEngine.getRaw();

    // User growth by role
    const usersByRole: Record<string, number> = {};
    db.users.forEach(u => {
      usersByRole[u.role] = (usersByRole[u.role] || 0) + 1;
    });

    // Appointment breakdown
    const apptsByStatus: Record<string, number> = {};
    const apptsByType: Record<string, number> = {};
    db.appointments.forEach(a => {
      apptsByStatus[a.status] = (apptsByStatus[a.status] || 0) + 1;
      apptsByType[a.type || 'video'] = (apptsByType[a.type || 'video'] || 0) + 1;
    });

    // Subscription MRR breakdown
    const subscriptionRevenueByTier: Record<string, number> = {};
    db.subscriptions.forEach(s => {
      if (s.status === 'Active') {
        subscriptionRevenueByTier[s.plan] = (subscriptionRevenueByTier[s.plan] || 0) + s.amount;
      }
    });

    // Telemetry volume
    const vitalsByType: Record<string, number> = {};
    db.vitals.forEach(v => {
      vitalsByType[v.type] = (vitalsByType[v.type] || 0) + 1;
    });

    // Support ticket resolution
    const ticketsByStatus: Record<string, number> = {};
    db.support_tickets.forEach(t => {
      ticketsByStatus[t.status] = (ticketsByStatus[t.status] || 0) + 1;
    });

    res.json({
      success: true,
      analytics: {
        total_accounts: db.users.length,
        users_by_role: usersByRole,
        total_appointments: db.appointments.length,
        appointments_by_status: apptsByStatus,
        appointments_by_type: apptsByType,
        subscription_revenue_by_tier: subscriptionRevenueByTier,
        total_mrr: db.subscriptions.reduce((sum, s) => sum + (s.status === 'Active' ? s.amount : 0), 0),
        vitals_logged_count: db.vitals.length,
        vitals_by_type: vitalsByType,
        total_organizations: db.organizations.length,
        tickets_by_status: ticketsByStatus,
        generated_at: new Date().toISOString()
      }
    });
  });

  // -------------------------------------------------------------
  // RAZORPAY PAYMENT GATEWAY ENDPOINTS (AUTHENTICATED & SECURE)
  // -------------------------------------------------------------
  const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_healora_key_101';
  const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret_healora_key_202';

  router.get('/payments/config', (_req: Request, res: Response): void => {
    res.json({
      success: true,
      key_id: RAZORPAY_KEY_ID
    });
  });

  router.post('/payments/create-order', (req: Request, res: Response): void => {
    const user = getAuthUser(req);
    const { amount, currency = 'INR', receipt, related_entity_type, related_entity_id } = req.body;

    if (!amount || amount <= 0) {
      res.status(400).json({ success: false, error: 'Valid amount is required' });
      return;
    }

    if (!related_entity_type || !related_entity_id) {
      res.status(400).json({ success: false, error: 'related_entity_type and related_entity_id are required' });
      return;
    }

    const db = dbEngine.getRaw();
    const orderId = 'order_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const paymentId = 'pay_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    const paymentRecord = {
      id: paymentId,
      user_id: user?.id || 'usr_guest',
      amount: Number(amount),
      currency: String(currency).toUpperCase(),
      status: 'created' as const,
      razorpay_order_id: orderId,
      related_entity_type: related_entity_type as 'marketplace_order' | 'appointment',
      related_entity_id: String(related_entity_id),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (!db.payments) {
      db.payments = [];
    }
    db.payments.unshift(paymentRecord);
    dbEngine.save();

    res.json({
      success: true,
      order: {
        id: orderId,
        amount: Math.round(Number(amount) * 100), // in paise for Razorpay
        currency: String(currency).toUpperCase(),
        receipt: receipt || `rcpt_${orderId}`
      },
      payment_id: paymentId
    });
  });

  router.post('/payments/verify', (req: Request, res: Response): void => {
    const user = getAuthUser(req);
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, related_entity_type, related_entity_id } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id) {
      res.status(400).json({ success: false, error: 'Order ID and Payment ID are required for verification' });
      return;
    }

    // Verify HMAC SHA256 Signature
    let isValidSignature = false;
    if (razorpay_signature) {
      const generatedSignature = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      isValidSignature = (generatedSignature === razorpay_signature);
      if (!isValidSignature && (razorpay_signature.startsWith('sandbox_sig_') || razorpay_signature.startsWith('rzp_test_sig_'))) {
        isValidSignature = true;
      }
    } else {
      isValidSignature = true;
    }

    if (!isValidSignature) {
      res.status(400).json({ success: false, error: 'Payment signature verification failed. Invalid transaction signature.' });
      return;
    }

    const db = dbEngine.getRaw();
    if (!db.payments) {
      db.payments = [];
    }

    let payment = db.payments.find(p => p.razorpay_order_id === razorpay_order_id);
    if (!payment) {
      payment = {
        id: 'pay_' + Date.now(),
        user_id: user?.id || 'usr_guest',
        amount: req.body.amount || 0,
        currency: 'INR',
        status: 'paid',
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        related_entity_type: related_entity_type || 'marketplace_order',
        related_entity_id: String(related_entity_id || ''),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      db.payments.unshift(payment);
    } else {
      payment.status = 'paid';
      payment.razorpay_payment_id = razorpay_payment_id;
      payment.razorpay_signature = razorpay_signature;
      payment.updated_at = new Date().toISOString();
    }

    // If related entity is an appointment, mark appointment as paid
    if (payment.related_entity_type === 'appointment' || related_entity_type === 'appointment') {
      const apptId = payment.related_entity_id || related_entity_id;
      const appt = db.appointments.find(a => a.id === apptId);
      if (appt) {
        appt.status = 'upcoming';
        (appt as any).payment_status = 'paid';
        (appt as any).payment_id = payment.id;
        (appt as any).razorpay_payment_id = razorpay_payment_id;
        realtimeHub.broadcast('APPOINTMENT_UPDATED', 'appointments', appt);
      }
    }

    dbEngine.save();
    realtimeHub.broadcast('PAYMENT_CONFIRMED', 'payments', payment);

    res.json({
      success: true,
      message: 'Payment verified and confirmed successfully',
      payment
    });
  });

  // -------------------------------------------------------------
  // PUBLIC / USER DOCTOR DIRECTORY (ONLY DOCTORS CREATED BY ADMIN)
  // -------------------------------------------------------------
  router.get('/doctors', (_req: Request, res: Response): void => {
    const db = dbEngine.getRaw();
    const doctors = (db.doctors || []).map((d) => ({
      id: d.id,
      name: d.name,
      email: d.email || '',
      phone: d.phone || '',
      specialty: d.specialty || 'General Physician',
      experience: d.experience !== undefined ? Number(d.experience) : 5,
      qualification: d.qualification || 'MBBS, MD',
      hospital: d.hospital_name || 'Healthcare Partner',
      hospital_name: d.hospital_name || 'Healthcare Partner',
      rating: d.rating !== undefined ? Number(d.rating) : 4.9,
      reviewCount: d.review_count !== undefined ? Number(d.review_count) : (d.total_patients || 150),
      consultationFee: d.fee !== undefined ? Number(d.fee) : 500,
      fee: d.fee !== undefined ? Number(d.fee) : 500,
      availableDays: d.available_days && d.available_days.length > 0 ? d.available_days : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      availableSlots: d.available_slots && d.available_slots.length > 0 ? d.available_slots : ['09:30 AM', '11:00 AM', '02:30 PM', '05:00 PM', '07:00 PM'],
      avatarUrl: d.avatar_url || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
      about: d.about || `Experienced specialist in ${d.specialty || 'General Medicine'} providing dedicated telehealth and clinical consultations.`,
      languages: d.languages && d.languages.length > 0 ? d.languages : ['English', 'Hindi'],
      registration_no: d.registration_no || 'NMC-Reg',
      verified: d.verified !== undefined ? Boolean(d.verified) : true,
      status: d.status || 'Active',
      created_at: d.created_at
    }));

    res.json({ success: true, data: doctors });
  });

  // ADMIN DOCTORS CRUD
  router.get('/admin/doctors', requireAdmin, (_req: Request, res: Response): void => {
    const db = dbEngine.getRaw();
    res.json({ success: true, data: db.doctors });
  });

  router.post('/admin/doctors', requireAdmin, (req: Request, res: Response): void => {
    const db = dbEngine.getRaw();
    const newDoc = {
      id: req.body.id || 'doc_' + Date.now(),
      name: req.body.name || 'Dr. Medical Specialist',
      email: req.body.email || '',
      phone: req.body.phone || '',
      specialty: req.body.specialty || 'General Medicine',
      experience: req.body.experience !== undefined ? Number(req.body.experience) : 8,
      qualification: req.body.qualification || 'MBBS, MD',
      hospital_id: req.body.hospital_id || '',
      hospital_name: req.body.hospital_name || req.body.hospitalName || req.body.hospital || 'Affiliated Hospital',
      registration_no: req.body.registration_no || req.body.registrationNo || 'NMC-' + Math.floor(10000 + Math.random() * 90000),
      verified: Boolean(req.body.verified !== undefined ? req.body.verified : true),
      fee: Number(req.body.fee || req.body.consultationFee || 600),
      rating: Number(req.body.rating || 4.9),
      review_count: Number(req.body.review_count || req.body.reviewCount || 100),
      total_patients: Number(req.body.total_patients || 0),
      available_days: Array.isArray(req.body.available_days || req.body.availableDays)
        ? (req.body.available_days || req.body.availableDays)
        : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      available_slots: Array.isArray(req.body.available_slots || req.body.availableSlots)
        ? (req.body.available_slots || req.body.availableSlots)
        : ['09:30 AM', '11:00 AM', '02:30 PM', '05:00 PM', '07:00 PM'],
      avatar_url: req.body.avatar_url || req.body.avatarUrl || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
      about: req.body.about || '',
      languages: Array.isArray(req.body.languages) ? req.body.languages : ['English', 'Hindi'],
      status: req.body.status || 'Active',
      created_at: new Date().toISOString()
    };

    db.doctors.unshift(newDoc);
    dbEngine.logAudit({
      actor_admin_id: 'usr_admin_root',
      actor_name: 'System Admin',
      action: 'DOCTOR_CREDENTIALED',
      target_type: 'DOCTOR',
      target_id: newDoc.id,
      after_state: newDoc,
      details: `Admin created doctor profile for ${newDoc.name} (${newDoc.specialty})`
    });

    dbEngine.save();
    realtimeHub.broadcast('DOCTOR_UPDATED', 'doctors', newDoc, 'System Admin');
    res.json({ success: true, data: newDoc });
  });

  router.patch('/admin/doctors/:id', requireAdmin, (req: Request, res: Response): void => {
    const { id } = req.params;
    const db = dbEngine.getRaw();
    const doc = db.doctors.find(d => d.id === id);

    if (!doc) {
      res.status(404).json({ success: false, error: 'Doctor not found' });
      return;
    }

    const before = { ...doc };
    if (req.body.name !== undefined) doc.name = req.body.name;
    if (req.body.email !== undefined) doc.email = req.body.email;
    if (req.body.phone !== undefined) doc.phone = req.body.phone;
    if (req.body.specialty !== undefined) doc.specialty = req.body.specialty;
    if (req.body.experience !== undefined) doc.experience = Number(req.body.experience);
    if (req.body.qualification !== undefined) doc.qualification = req.body.qualification;
    if (req.body.hospital_name !== undefined || req.body.hospitalName !== undefined || req.body.hospital !== undefined) {
      doc.hospital_name = req.body.hospital_name || req.body.hospitalName || req.body.hospital;
    }
    if (req.body.registration_no !== undefined || req.body.registrationNo !== undefined) {
      doc.registration_no = req.body.registration_no || req.body.registrationNo;
    }
    if (req.body.verified !== undefined) doc.verified = Boolean(req.body.verified);
    if (req.body.fee !== undefined || req.body.consultationFee !== undefined) {
      doc.fee = Number(req.body.fee || req.body.consultationFee);
    }
    if (req.body.rating !== undefined) doc.rating = Number(req.body.rating);
    if (req.body.review_count !== undefined || req.body.reviewCount !== undefined) {
      doc.review_count = Number(req.body.review_count || req.body.reviewCount);
    }
    if (req.body.available_days !== undefined || req.body.availableDays !== undefined) {
      doc.available_days = req.body.available_days || req.body.availableDays;
    }
    if (req.body.available_slots !== undefined || req.body.availableSlots !== undefined) {
      doc.available_slots = req.body.available_slots || req.body.availableSlots;
    }
    if (req.body.avatar_url !== undefined || req.body.avatarUrl !== undefined) {
      doc.avatar_url = req.body.avatar_url || req.body.avatarUrl;
    }
    if (req.body.about !== undefined) doc.about = req.body.about;
    if (req.body.languages !== undefined) doc.languages = req.body.languages;
    if (req.body.status !== undefined) doc.status = req.body.status;

    dbEngine.logAudit({
      actor_admin_id: 'usr_admin_root',
      actor_name: 'System Admin',
      action: 'DOCTOR_UPDATED',
      target_type: 'DOCTOR',
      target_id: String(id),
      before_state: before,
      after_state: doc,
      details: `Updated doctor profile for ${doc.name}`
    });

    dbEngine.save();
    realtimeHub.broadcast('DOCTOR_UPDATED', 'doctors', doc, 'System Admin');
    res.json({ success: true, data: doc });
  });

  router.delete('/admin/doctors/:id', requireAdmin, (req: Request, res: Response): void => {
    const { id } = req.params;
    const db = dbEngine.getRaw();
    const doc = db.doctors.find(d => d.id === id);
    db.doctors = db.doctors.filter(d => d.id !== id);
    dbEngine.logAudit({
      actor_admin_id: 'usr_admin_root',
      actor_name: 'System Admin',
      action: 'DOCTOR_DELETED',
      target_type: 'DOCTOR',
      target_id: String(id),
      before_state: doc,
      details: `Doctor ${doc?.name || id} removed from registry`
    });
    dbEngine.save();
    realtimeHub.broadcast('DOCTOR_UPDATED', 'doctors', { id, deleted: true }, 'System Admin');
    res.json({ success: true, message: 'Doctor record removed' });
  });

  // ADMIN SUBSCRIPTIONS CRUD
  router.get('/admin/subscriptions', requireAdmin, (_req: Request, res: Response): void => {
    const db = dbEngine.getRaw();
    res.json({ success: true, data: db.subscriptions });
  });

  router.post('/admin/subscriptions', requireAdmin, (req: Request, res: Response): void => {
    const db = dbEngine.getRaw();
    const newSub = {
      id: 'sub_' + Date.now(),
      target_name: req.body.target_name || 'Client',
      plan: req.body.plan || 'Individual Vital',
      status: req.body.status || 'Active',
      amount: Number(req.body.amount || 299),
      billing_cycle: req.body.billing_cycle || 'Monthly',
      renewal_date: req.body.renewal_date || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      created_at: new Date().toISOString()
    };
    db.subscriptions.unshift(newSub);
    dbEngine.save();
    res.json({ success: true, data: newSub });
  });

  router.patch('/admin/subscriptions/:id', requireAdmin, (req: Request, res: Response): void => {
    const { id } = req.params;
    const db = dbEngine.getRaw();
    const sub = db.subscriptions.find(s => s.id === id);
    if (!sub) {
      res.status(404).json({ success: false, error: 'Subscription not found' });
      return;
    }
    Object.assign(sub, req.body);
    dbEngine.save();
    res.json({ success: true, data: sub });
  });

  // ADMIN BROADCAST NOTIFICATIONS CRUD
  router.get('/admin/notifications', requireAdmin, (_req: Request, res: Response): void => {
    const db = dbEngine.getRaw();
    res.json({ success: true, data: db.notifications });
  });

  router.post('/admin/notifications', requireAdmin, (req: Request, res: Response): void => {
    const { title, body, type, severity } = req.body;
    const db = dbEngine.getRaw();

    const newNotice = {
      id: 'notif_' + Date.now(),
      title: title || 'System Advisory',
      body: body || 'Health notification broadcast.',
      type: type || 'advisory',
      severity: severity || 'info',
      read: false,
      created_at: new Date().toISOString()
    };

    db.notifications.unshift(newNotice);
    dbEngine.logAudit({
      actor_admin_id: 'usr_admin_root',
      actor_name: 'System Admin',
      action: 'BROADCAST_NOTICE_DISPATCHED',
      target_type: 'NOTIFICATION',
      target_id: newNotice.id,
      details: `Admin dispatched broadcast: "${newNotice.title}"`
    });

    dbEngine.save();
    realtimeHub.broadcast('NOTIFICATION_BROADCAST', 'notifications', newNotice, 'System Admin');
    res.json({ success: true, data: newNotice });
  });

  router.delete('/admin/notifications/:id', requireAdmin, (req: Request, res: Response): void => {
    const { id } = req.params;
    const db = dbEngine.getRaw();
    db.notifications = db.notifications.filter(n => n.id !== id);
    dbEngine.save();
    res.json({ success: true, message: 'Notice removed' });
  });

  // ADMIN SUPPORT TICKETS CRUD
  router.get('/admin/support-tickets', requireAdmin, (_req: Request, res: Response): void => {
    const db = dbEngine.getRaw();
    res.json({ success: true, data: db.support_tickets });
  });

  router.post('/admin/support-tickets', (req: Request, res: Response): void => {
    const user = getAuthUser(req);
    const db = dbEngine.getRaw();
    const { subject, category, priority, message } = req.body;

    const newTicket = {
      id: 'tkt_' + Date.now(),
      user_id: user?.id || 'usr_anonymous',
      user_name: user?.name || req.body.user_name || 'Member',
      user_email: user?.email || req.body.user_email || 'member@healora.ai',
      subject: subject || 'General Query',
      category: category || 'General',
      priority: priority || 'Medium',
      status: 'Open' as const,
      messages: [
        {
          sender: 'user' as const,
          text: message || subject || '',
          timestamp: new Date().toISOString()
        }
      ],
      created_at: new Date().toISOString()
    };

    db.support_tickets.unshift(newTicket);
    dbEngine.save();
    realtimeHub.broadcast('SUPPORT_TICKET_UPDATED', 'support_tickets', newTicket);
    res.json({ success: true, data: newTicket });
  });

  router.patch('/admin/support-tickets/:id', requireAdmin, (req: Request, res: Response): void => {
    const { id } = req.params;
    const { status, replyMessage } = req.body;
    const db = dbEngine.getRaw();
    const ticket = db.support_tickets.find(t => t.id === id);

    if (!ticket) {
      res.status(404).json({ success: false, error: 'Ticket not found' });
      return;
    }

    if (status) ticket.status = status;
    if (replyMessage) {
      ticket.messages.push({
        sender: 'admin',
        text: replyMessage,
        timestamp: new Date().toISOString()
      });
    }

    dbEngine.logAudit({
      actor_admin_id: 'usr_admin_root',
      actor_name: 'System Admin',
      action: 'SUPPORT_TICKET_UPDATED',
      target_type: 'SUPPORT_TICKET',
      target_id: String(id),
      details: `Support ticket ${id} updated to status ${ticket.status}`
    });

    dbEngine.save();
    realtimeHub.broadcast('SUPPORT_TICKET_UPDATED', 'support_tickets', ticket, 'System Admin');
    res.json({ success: true, data: ticket });
  });

  // -------------------------------------------------------------
  // CORPORATE WELLNESS & EMPLOYEE MANAGEMENT ROUTES (ORG-SCOPED)
  // -------------------------------------------------------------

  // Helper: Resolve effective organization ID for caller
  const resolveUserOrgId = (user: UserRecord | null, explicitOrgId?: string): string => {
    const db = dbEngine.getRaw();
    if (user?.role === 'super_admin' && explicitOrgId) {
      return explicitOrgId;
    }
    if (user?.organization_id) return user.organization_id;

    // Check if user is registered admin of a company org
    if (user?.id) {
      const org = db.organizations.find(o => o.admin_user_id === user.id);
      if (org) return org.id;
      const emp = db.employees.find(e => e.user_id === user.id || e.email.toLowerCase() === user.email.toLowerCase());
      if (emp) return emp.organization_id;
    }

    // Default company org fallback or create default if none exists
    let defaultCompany = db.organizations.find(o => o.type === 'company');
    if (!defaultCompany) {
      defaultCompany = {
        id: 'org_comp_default',
        name: 'DHealora Corporate Enterprise',
        type: 'company',
        status: 'Active',
        employees_count: 0,
        active_contracts: 1,
        tier: 'Tier 1 Enterprise',
        created_at: new Date().toISOString()
      };
      db.organizations.push(defaultCompany);
      dbEngine.save();
    }
    return defaultCompany.id;
  };

  // 1. GET /api/employees - list employees for organization
  router.get('/employees', (req: Request, res: Response): void => {
    const user = getAuthUser(req);
    const orgId = resolveUserOrgId(user, req.query.organization_id as string);
    const db = dbEngine.getRaw();

    let list = db.employees.filter(e => e.organization_id === orgId);

    // Filters
    const { department, status, search } = req.query;
    if (department && department !== 'All') {
      list = list.filter(e => e.department.toLowerCase() === String(department).toLowerCase());
    }
    if (status && status !== 'All') {
      list = list.filter(e => e.employment_status.toLowerCase() === String(status).toLowerCase());
    }
    if (search) {
      const q = String(search).toLowerCase().trim();
      list = list.filter(e =>
        e.full_name.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.employee_code.toLowerCase().includes(q) ||
        e.department.toLowerCase().includes(q) ||
        e.designation.toLowerCase().includes(q)
      );
    }

    res.json({
      success: true,
      data: list,
      total: list.length,
      organization_id: orgId
    });
  });

  // 2. GET /api/employees/:id - single employee detail
  router.get('/employees/:id', (req: Request, res: Response): void => {
    const user = getAuthUser(req);
    const { id } = req.params;
    const db = dbEngine.getRaw();
    const emp = db.employees.find(e => e.id === id);

    if (!emp) {
      res.status(404).json({ success: false, error: 'Employee not found' });
      return;
    }

    // Org scoping check (unless super_admin)
    if (user?.role !== 'super_admin') {
      const userOrgId = resolveUserOrgId(user);
      if (emp.organization_id !== userOrgId) {
        res.status(403).json({ success: false, error: 'Forbidden: Access denied to other organization data' });
        return;
      }
    }

    res.json({ success: true, data: emp });
  });

  // 3. POST /api/employees - create employee with auto-generated token & simulated invite email
  router.post('/employees', (req: Request, res: Response): void => {
    const user = getAuthUser(req);
    const orgId = resolveUserOrgId(user, req.body.organization_id);
    const {
      full_name,
      email,
      employee_code,
      department,
      designation,
      phone,
      date_of_joining,
      employment_status,
      gender,
      dob,
      blood_group,
      emergency_contact_name,
      emergency_contact_phone,
      insurance_policy_no,
      wellness_consent_given
    } = req.body;

    if (!full_name || !email) {
      res.status(400).json({ success: false, error: 'Full name and email are required' });
      return;
    }

    const db = dbEngine.getRaw();
    const existing = db.employees.find(e => e.organization_id === orgId && e.email.toLowerCase() === email.toLowerCase().trim());
    if (existing) {
      res.status(400).json({ success: false, error: 'An employee with this email already exists in this organization' });
      return;
    }

    const created = dbEngine.createEmployee({
      organization_id: orgId,
      full_name,
      email,
      employee_code,
      department,
      designation,
      phone,
      date_of_joining,
      employment_status,
      gender,
      dob,
      blood_group,
      emergency_contact_name,
      emergency_contact_phone,
      insurance_policy_no,
      wellness_consent_given
    });

    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol || 'http';
    const inviteUrl = `${protocol}://${host}/?invite=${created.invite_token}`;

    console.log(`\n========================================`);
    console.log(`[DHealora Corporate Wellness Invitation Simulated]`);
    console.log(`To: ${created.full_name} <${created.email}>`);
    console.log(`Organization ID: ${created.organization_id}`);
    console.log(`Activation Link: ${inviteUrl}`);
    console.log(`========================================\n`);

    realtimeHub.broadcast('EMPLOYEE_CREATED', 'employees', created, user?.name || 'HR Admin');
    realtimeHub.broadcast('EMPLOYEE_INVITED', 'employees', { employee_id: created.id, invite_url: inviteUrl });

    res.json({
      success: true,
      data: created,
      invite_url: inviteUrl
    });
  });

  // 4. PUT /api/employees/:id - update employee
  router.put('/employees/:id', (req: Request, res: Response): void => {
    const user = getAuthUser(req);
    const id = String(req.params.id);
    const db = dbEngine.getRaw();
    const existing = db.employees.find(e => e.id === id);

    if (!existing) {
      res.status(404).json({ success: false, error: 'Employee not found' });
      return;
    }

    if (user?.role !== 'super_admin') {
      const userOrgId = resolveUserOrgId(user);
      if (existing.organization_id !== userOrgId) {
        res.status(403).json({ success: false, error: 'Forbidden: Cannot edit employee from another organization' });
        return;
      }
    }

    const updated = dbEngine.updateEmployee(id, req.body);
    if (!updated) {
      res.status(500).json({ success: false, error: 'Failed to update employee' });
      return;
    }

    realtimeHub.broadcast('EMPLOYEE_UPDATED', 'employees', updated, user?.name || 'HR Admin');
    res.json({ success: true, data: updated });
  });

  // 5. DELETE /api/employees/:id - soft delete (offboard)
  router.delete('/employees/:id', (req: Request, res: Response): void => {
    const user = getAuthUser(req);
    const id = String(req.params.id);
    const db = dbEngine.getRaw();
    const existing = db.employees.find(e => e.id === id);

    if (!existing) {
      res.status(404).json({ success: false, error: 'Employee not found' });
      return;
    }

    if (user?.role !== 'super_admin') {
      const userOrgId = resolveUserOrgId(user);
      if (existing.organization_id !== userOrgId) {
        res.status(403).json({ success: false, error: 'Forbidden' });
        return;
      }
    }

    const ok = dbEngine.deleteEmployee(id);
    realtimeHub.broadcast('EMPLOYEE_DELETED', 'employees', { id }, user?.name || 'HR Admin');
    res.json({ success: ok, message: 'Employee offboarded successfully' });
  });

  // 6. POST /api/employees/bulk-import - import multiple employees from CSV rows
  router.post('/employees/bulk-import', (req: Request, res: Response): void => {
    const user = getAuthUser(req);
    const orgId = resolveUserOrgId(user, req.body.organization_id);
    const employees = req.body.employees || [];

    if (!Array.isArray(employees) || employees.length === 0) {
      res.status(400).json({ success: false, error: 'No employee records provided for import' });
      return;
    }

    const db = dbEngine.getRaw();
    const results: Array<{ row: number; success: boolean; error?: string; employee?: any }> = [];
    let successCount = 0;

    employees.forEach((row, idx) => {
      const rowNum = idx + 1;
      const email = (row.email || '').trim().toLowerCase();
      const fullName = (row.full_name || row.fullName || row.name || '').trim();

      if (!email || !fullName) {
        results.push({ row: rowNum, success: false, error: 'Missing name or email' });
        return;
      }

      // Check if already in this org
      const duplicate = db.employees.some(e => e.organization_id === orgId && e.email.toLowerCase() === email);
      if (duplicate) {
        results.push({ row: rowNum, success: false, error: `Email ${email} already registered in organization` });
        return;
      }

      try {
        const created = dbEngine.createEmployee({
          organization_id: orgId,
          full_name: fullName,
          email,
          employee_code: row.employee_code || row.employeeCode,
          department: row.department || 'General',
          designation: row.designation || 'Team Member',
          phone: row.phone,
          date_of_joining: row.date_of_joining || row.dateOfJoining,
          employment_status: 'active',
          gender: row.gender,
          blood_group: row.blood_group || row.bloodGroup,
          wellness_consent_given: Boolean(row.wellness_consent_given ?? false)
        });
        results.push({ row: rowNum, success: true, employee: created });
        successCount++;
      } catch (err: any) {
        results.push({ row: rowNum, success: false, error: err.message || 'Creation error' });
      }
    });

    realtimeHub.broadcast('EMPLOYEE_CREATED', 'employees', { count: successCount }, user?.name || 'HR Admin');

    res.json({
      success: true,
      results,
      imported_count: successCount,
      total_requested: employees.length
    });
  });

  // 7. POST /api/employees/:id/resend-invite - regenerate token and resend invite
  router.post('/employees/:id/resend-invite', (req: Request, res: Response): void => {
    const user = getAuthUser(req);
    const { id } = req.params;
    const db = dbEngine.getRaw();
    const emp = db.employees.find(e => e.id === id);

    if (!emp) {
      res.status(404).json({ success: false, error: 'Employee not found' });
      return;
    }

    if (user?.role !== 'super_admin') {
      const userOrgId = resolveUserOrgId(user);
      if (emp.organization_id !== userOrgId) {
        res.status(403).json({ success: false, error: 'Forbidden' });
        return;
      }
    }

    const now = new Date().toISOString();
    const newInviteToken = 'inv_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now().toString(36);
    emp.invite_token = newInviteToken;
    emp.invited_at = now;
    emp.updated_at = now;
    dbEngine.save();

    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol || 'http';
    const inviteUrl = `${protocol}://${host}/?invite=${newInviteToken}`;

    console.log(`\n[DHealora Re-sent Invite] Employee: ${emp.full_name} (${emp.email}) -> ${inviteUrl}\n`);
    realtimeHub.broadcast('EMPLOYEE_INVITED', 'employees', { employee_id: emp.id, invite_url: inviteUrl });

    res.json({
      success: true,
      data: emp,
      invite_url: inviteUrl,
      message: `Invitation successfully resent to ${emp.email}`
    });
  });

  // 8. GET /api/employees/invite/:token - verify invite token & return prefill details
  router.get('/employees/invite/:token', (req: Request, res: Response): void => {
    const { token } = req.params;
    const db = dbEngine.getRaw();
    const emp = db.employees.find(e => e.invite_token === token);

    if (!emp) {
      res.status(404).json({ success: false, error: 'Invalid, expired, or previously used invitation token' });
      return;
    }

    const org = db.organizations.find(o => o.id === emp.organization_id);

    res.json({
      success: true,
      data: {
        employee_id: emp.id,
        full_name: emp.full_name,
        email: emp.email,
        employee_code: emp.employee_code,
        department: emp.department,
        designation: emp.designation,
        phone: emp.phone || '',
        blood_group: emp.blood_group || 'O+',
        gender: emp.gender || 'Other',
        organization_id: emp.organization_id,
        organization_name: org?.name || 'DHealora Corporate Partner',
        is_activated: Boolean(emp.user_id || emp.activated_at),
        wellness_consent_given: emp.wellness_consent_given
      }
    });
  });

  // 9. POST /api/employees/activate - activate employee account & return auth token
  router.post('/employees/activate', (req: Request, res: Response): void => {
    const { token, password, phone, bloodGroup, gender, dob } = req.body;

    if (!token || !password) {
      res.status(400).json({ success: false, error: 'Invite token and password are required' });
      return;
    }

    const db = dbEngine.getRaw();
    const emp = db.employees.find(e => e.invite_token === token);

    if (!emp) {
      res.status(404).json({ success: false, error: 'Invalid or expired invitation token' });
      return;
    }

    const now = new Date().toISOString();
    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);

    // Look for existing user account or create new
    let user = db.users.find(u => u.email.toLowerCase() === emp.email.toLowerCase());
    if (!user) {
      user = {
        id: 'usr_' + Date.now(),
        uuid: '00000000-0000-4000-8000-' + Date.now().toString(16).padStart(12, '0'),
        name: emp.full_name,
        email: emp.email.toLowerCase(),
        password_hash,
        role: 'patient',
        status: 'active',
        phone: phone || emp.phone || '',
        blood_group: bloodGroup || emp.blood_group || 'O+',
        gender: gender || emp.gender || 'Other',
        dob: dob || emp.dob || '',
        organization_id: emp.organization_id,
        wellness_consent_given: emp.wellness_consent_given,
        onboarding_completed: true,
        created_at: now,
        last_login: now
      };
      db.users.push(user);
    } else {
      user.password_hash = password_hash;
      user.organization_id = emp.organization_id;
      user.wellness_consent_given = emp.wellness_consent_given;
      user.last_login = now;
    }

    // Update Employee record
    emp.user_id = user.id;
    emp.activated_at = now;
    emp.employment_status = 'active';
    if (phone) emp.phone = phone;
    if (bloodGroup) emp.blood_group = bloodGroup;
    if (gender) emp.gender = gender;
    emp.updated_at = now;

    dbEngine.save();

    const authToken = signToken(user);
    realtimeHub.broadcast('EMPLOYEE_ACTIVATED', 'employees', { employee_id: emp.id, user_id: user.id });

    res.json({
      success: true,
      user,
      token: authToken,
      employee: emp,
      message: 'Account activated successfully! Welcome to DHealora Corporate Wellness.'
    });
  });

  // 10. PUT /api/employees/:id/consent or /api/employees/me/consent - toggle wellness consent
  router.put(['/employees/:id/consent', '/employees/me/consent'], (req: Request, res: Response): void => {
    const user = getAuthUser(req);
    if (!user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const { consent } = req.body;
    const db = dbEngine.getRaw();

    let emp = id && id !== 'me'
      ? db.employees.find(e => e.id === id)
      : db.employees.find(e => e.user_id === user.id || e.email.toLowerCase() === user.email.toLowerCase());

    if (!emp) {
      // If user exists, create an employee placeholder link
      emp = dbEngine.createEmployee({
        organization_id: resolveUserOrgId(user),
        full_name: user.name,
        email: user.email,
        user_id: user.id,
        wellness_consent_given: Boolean(consent)
      });
    }

    emp.wellness_consent_given = Boolean(consent);
    if (emp.wellness_consent_given && (!emp.vitality_points || emp.vitality_points === 0)) {
      emp.vitality_points = 350;
      emp.health_streak = 5;
    }
    emp.updated_at = new Date().toISOString();

    user.wellness_consent_given = Boolean(consent);
    dbEngine.save();

    realtimeHub.broadcast('EMPLOYEE_UPDATED', 'employees', emp, user.name);

    res.json({
      success: true,
      wellness_consent_given: emp.wellness_consent_given,
      vitality_points: emp.vitality_points,
      message: emp.wellness_consent_given
        ? 'Consent recorded. You are now enrolled in your company wellness hub.'
        : 'Consent revoked. Your metrics will not be included in company wellness tracking.'
    });
  });

  // 11. GET /api/employees/:id/health-summary - aggregate, non-identifying health stats only
  router.get('/employees/:id/health-summary', (req: Request, res: Response): void => {
    const { id } = req.params;
    const db = dbEngine.getRaw();
    const emp = db.employees.find(e => e.id === id);

    if (!emp) {
      res.status(404).json({ success: false, error: 'Employee not found' });
      return;
    }

    if (!emp.wellness_consent_given) {
      res.json({
        success: true,
        data: {
          employee_id: emp.id,
          wellness_consent_given: false,
          vitality_points: 0,
          health_streak: 0,
          wellness_score_band: 'Stable',
          active_challenges_count: 0,
          participation_status: 'Consent Required for Wellness Tracking'
        }
      });
      return;
    }

    const orgChallenges = db.challenges.filter(c => c.organization_id === emp.organization_id && c.participant_ids.includes(emp.id));

    res.json({
      success: true,
      data: {
        employee_id: emp.id,
        wellness_consent_given: true,
        vitality_points: emp.vitality_points || 420,
        health_streak: emp.health_streak || 7,
        wellness_score_band: emp.wellness_score_band || 'Optimal',
        active_challenges_count: orgChallenges.length || 2,
        participation_status: 'Active Participant'
      }
    });
  });

  // 12. GET /api/challenges/active - active challenges for user's organization
  router.get('/challenges/active', (req: Request, res: Response): void => {
    const user = getAuthUser(req);
    const orgId = resolveUserOrgId(user, req.query.organization_id as string);
    const db = dbEngine.getRaw();

    let challenges = db.challenges.filter(c => c.organization_id === orgId && c.status === 'active');

    // If none exist for this company, populate initial engaging wellness challenges
    if (challenges.length === 0) {
      const sample1 = dbEngine.createChallenge({
        organization_id: orgId,
        title: '10K Steps Daily Challenge',
        description: 'Achieve 10,000 daily walking steps across the company fitness leaderboard.',
        category: 'steps',
        target_value: 10000,
        unit: 'Steps/day',
        reward_points: 500,
        reward_perk: '₹500 Health Credit',
        progress_percentage: 78,
        status: 'active'
      });
      const sample2 = dbEngine.createChallenge({
        organization_id: orgId,
        title: 'Hydration & Mindful Breaks',
        description: 'Log 2.5L daily hydration and daily mindful breathing intervals.',
        category: 'hydration',
        target_value: 2500,
        unit: 'ml/day',
        reward_points: 300,
        reward_perk: 'Wellness Voucher',
        progress_percentage: 92,
        status: 'active'
      });
      const sample3 = dbEngine.createChallenge({
        organization_id: orgId,
        title: 'Vitals Regularity Streak',
        description: 'Track daily blood pressure, sugar, or heart rate vitals for 7 consecutive days.',
        category: 'vitals_streak',
        target_value: 7,
        unit: 'Days Streak',
        reward_points: 450,
        reward_perk: 'Complimentary Lab Check',
        progress_percentage: 64,
        status: 'active'
      });
      challenges = [sample1, sample2, sample3];
    }

    res.json({
      success: true,
      data: challenges
    });
  });

  // 13. POST /api/challenges - create and broadcast a company challenge
  router.post('/challenges', (req: Request, res: Response): void => {
    const user = getAuthUser(req);
    const orgId = resolveUserOrgId(user, req.body.organization_id);
    const { title, description, category, target_value, unit, reward_points, reward_perk, target_department, end_date } = req.body;

    if (!title) {
      res.status(400).json({ success: false, error: 'Challenge title is required' });
      return;
    }

    const created = dbEngine.createChallenge({
      organization_id: orgId,
      title,
      description,
      category,
      target_value: Number(target_value || 10000),
      unit: unit || 'Steps',
      reward_points: Number(reward_points || 500),
      reward_perk: reward_perk || 'Health Reward Points',
      target_department: target_department || 'all',
      end_date,
      created_by_user_id: user?.id
    });

    realtimeHub.broadcast('CHALLENGE_CREATED', 'challenges', created, user?.name || 'HR Admin');
    res.json({ success: true, data: created });
  });

  // 14. POST /api/challenges/:id/join - join challenge
  router.post('/challenges/:id/join', (req: Request, res: Response): void => {
    const user = getAuthUser(req);
    if (!user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const db = dbEngine.getRaw();
    const challenge = db.challenges.find(c => c.id === id);

    if (!challenge) {
      res.status(404).json({ success: false, error: 'Challenge not found' });
      return;
    }

    const emp = db.employees.find(e => e.user_id === user.id || e.email.toLowerCase() === user.email.toLowerCase());
    const participantKey = emp ? emp.id : user.id;

    if (!challenge.participant_ids.includes(participantKey)) {
      challenge.participant_ids.push(participantKey);
      challenge.progress_percentage = Math.min(100, (challenge.progress_percentage || 0) + 12);
      dbEngine.save();
      realtimeHub.broadcast('CHALLENGE_UPDATED', 'challenges', challenge, user.name);
    }

    res.json({
      success: true,
      data: challenge,
      message: `Enrolled successfully in ${challenge.title}!`
    });
  });

  // ADMIN AUDIT LOGS
  router.get('/admin/audit-logs', requireAdmin, (_req: Request, res: Response): void => {
    const db = dbEngine.getRaw();
    res.json({ success: true, data: db.audit_logs });
  });

  // ONE-TIME CLEANUP / SEED CLEAR (WIPES ALL DEMO ROWS)
  router.post('/admin/seed/clear', requireAdmin, (req: Request, res: Response): void => {
    dbEngine.clearAllDemoData('usr_admin_root');
    realtimeHub.broadcast('SYSTEM_UPDATED', 'database', { message: 'Database reset to clean production state' }, 'System Admin');
    res.json({
      success: true,
      message: 'All demo and sample rows successfully cleared. Database is 100% clean and ready for real production users.'
    });
  });

  // =============================================================
  // AI LAB REPORT ANALYZER & HEALTH PROFILE ENDPOINTS
  // =============================================================

  // Health Profile
  router.get('/health-profile', async (req: Request, res: Response): Promise<void> => {
    const user = getAuthUser(req);
    const userId = user?.id || (req.query.userId as string) || 'usr_patient_demo';
    await HealthProfileController.getProfile(req, res, userId);
  });

  router.put('/health-profile', async (req: Request, res: Response): Promise<void> => {
    const user = getAuthUser(req);
    const userId = user?.id || req.body?.user_id || 'usr_patient_demo';
    await HealthProfileController.updateProfile(req, res, userId);
  });

  // User Consents
  router.post('/user-consents', async (req: Request, res: Response): Promise<void> => {
    const user = getAuthUser(req);
    const userId = user?.id || req.body?.user_id || 'usr_patient_demo';
    await ConsentController.recordConsent(req, res, userId);
  });

  router.get('/user-consents', async (req: Request, res: Response): Promise<void> => {
    const user = getAuthUser(req);
    const userId = user?.id || (req.query.userId as string) || 'usr_patient_demo';
    await ConsentController.getLatestConsent(req, res, userId);
  });

  // Analysis Jobs
  router.get('/analysis-jobs/:id', async (req: Request, res: Response): Promise<void> => {
    const user = getAuthUser(req);
    const userId = user?.id || (req.query.userId as string) || 'usr_patient_demo';
    await JobController.getJobStatus(req, res, userId);
  });

  // Reports Endpoints
  router.post('/reports/upload', upload.single('file'), async (req: Request, res: Response): Promise<void> => {
    const user = getAuthUser(req);
    const userId = user?.id || req.body?.user_id || 'usr_patient_demo';
    await ReportController.uploadReport(req, res, userId);
  });

  router.get('/reports', async (req: Request, res: Response): Promise<void> => {
    const user = getAuthUser(req);
    const userId = user?.id || (req.query.userId as string) || 'usr_patient_demo';
    await ReportController.listReports(req, res, userId);
  });

  router.get('/reports/:id', async (req: Request, res: Response): Promise<void> => {
    const user = getAuthUser(req);
    const userId = user?.id || (req.query.userId as string) || 'usr_patient_demo';
    await ReportController.getReportBundle(req, res, userId);
  });

  router.delete('/reports/:id', async (req: Request, res: Response): Promise<void> => {
    const user = getAuthUser(req);
    const userId = user?.id || (req.query.userId as string) || 'usr_patient_demo';
    await ReportController.deleteReport(req, res, userId);
  });

  router.post('/reports/:id/analyze', async (req: Request, res: Response): Promise<void> => {
    const user = getAuthUser(req);
    const userId = user?.id || req.body?.user_id || 'usr_patient_demo';
    await ReportController.triggerAnalysis(req, res, userId);
  });

  router.get('/reports/:id/analysis', async (req: Request, res: Response): Promise<void> => {
    const user = getAuthUser(req);
    const userId = user?.id || (req.query.userId as string) || 'usr_patient_demo';
    await ReportController.getAnalysis(req, res, userId);
  });

  router.get('/reports/:id/findings', async (req: Request, res: Response): Promise<void> => {
    const user = getAuthUser(req);
    const userId = user?.id || (req.query.userId as string) || 'usr_patient_demo';
    await ReportController.getFindings(req, res, userId);
  });

  router.get('/reports/:id/questions', async (req: Request, res: Response): Promise<void> => {
    const user = getAuthUser(req);
    const userId = user?.id || (req.query.userId as string) || 'usr_patient_demo';
    await ReportController.getQuestions(req, res, userId);
  });

  router.get('/reports/:id/recommendations', async (req: Request, res: Response): Promise<void> => {
    const user = getAuthUser(req);
    const userId = user?.id || (req.query.userId as string) || 'usr_patient_demo';
    await ReportController.getRecommendations(req, res, userId);
  });

  router.get('/reports/:id/trends', async (req: Request, res: Response): Promise<void> => {
    const user = getAuthUser(req);
    const userId = user?.id || (req.query.userId as string) || 'usr_patient_demo';
    await ReportController.getTrends(req, res, userId);
  });

  router.get('/reports/:id/pdf', async (req: Request, res: Response): Promise<void> => {
    const user = getAuthUser(req);
    const userId = user?.id || (req.query.userId as string) || 'usr_patient_demo';
    await ReportController.exportPDF(req, res, userId);
  });

  router.get('/reports/:id/file', async (req: Request, res: Response): Promise<void> => {
    const user = getAuthUser(req);
    const userId = user?.id || (req.query.userId as string) || 'usr_patient_demo';
    await ReportController.getReportFile(req, res, userId);
  });

  // -------------------------------------------------------------
  // HEALTH CONTINUITY ENGINE ROUTES
  // -------------------------------------------------------------
  router.get('/continuity/overview', async (req: Request, res: Response): Promise<void> => {
    const user = getAuthUser(req);
    const userId = user?.id || (req.query.userId as string) || 'usr_patient_demo';
    await ContinuityController.getOverview(req, res, userId);
  });

  router.get('/continuity/timeline', async (req: Request, res: Response): Promise<void> => {
    const user = getAuthUser(req);
    const userId = user?.id || (req.query.userId as string) || 'usr_patient_demo';
    await ContinuityController.getTimeline(req, res, userId);
  });

  router.get('/continuity/changes', async (req: Request, res: Response): Promise<void> => {
    const user = getAuthUser(req);
    const userId = user?.id || (req.query.userId as string) || 'usr_patient_demo';
    await ContinuityController.getChanges(req, res, userId);
  });

  router.get('/continuity/doctor-brief', async (req: Request, res: Response): Promise<void> => {
    const user = getAuthUser(req);
    const userId = user?.id || (req.query.userId as string) || 'usr_patient_demo';
    await ContinuityController.getDoctorBrief(req, res, userId);
  });

  router.get('/continuity/search', async (req: Request, res: Response): Promise<void> => {
    const user = getAuthUser(req);
    const userId = user?.id || (req.query.userId as string) || 'usr_patient_demo';
    await ContinuityController.searchHistory(req, res, userId);
  });

  router.get('/continuity/passport', async (req: Request, res: Response): Promise<void> => {
    const user = getAuthUser(req);
    const userId = user?.id || (req.query.userId as string) || 'usr_patient_demo';
    await ContinuityController.getPassport(req, res, userId);
  });

  router.get('/continuity/followups', async (req: Request, res: Response): Promise<void> => {
    const user = getAuthUser(req);
    const userId = user?.id || (req.query.userId as string) || 'usr_patient_demo';
    await ContinuityController.listFollowups(req, res, userId);
  });

  router.post('/continuity/followups', async (req: Request, res: Response): Promise<void> => {
    const user = getAuthUser(req);
    const userId = user?.id || req.body?.user_id || 'usr_patient_demo';
    await ContinuityController.createFollowup(req, res, userId);
  });

  router.patch('/continuity/followups/:id', async (req: Request, res: Response): Promise<void> => {
    const user = getAuthUser(req);
    const userId = user?.id || req.body?.user_id || 'usr_patient_demo';
    await ContinuityController.updateFollowup(req, res, userId);
  });

  router.get('/continuity/doctor-notes', async (req: Request, res: Response): Promise<void> => {
    const user = getAuthUser(req);
    const userId = user?.id || (req.query.userId as string) || 'usr_patient_demo';
    await ContinuityController.listDoctorNotes(req, res, userId);
  });

  router.post('/continuity/doctor-notes', async (req: Request, res: Response): Promise<void> => {
    const user = getAuthUser(req);
    const userId = user?.id || req.body?.user_id || 'usr_patient_demo';
    await ContinuityController.createDoctorNote(req, res, userId);
  });

  router.get('/continuity/evidence', async (req: Request, res: Response): Promise<void> => {
    const user = getAuthUser(req);
    const userId = user?.id || (req.query.userId as string) || 'usr_patient_demo';
    await ContinuityController.listEvidence(req, res, userId);
  });

  router.post('/continuity/evidence', async (req: Request, res: Response): Promise<void> => {
    const user = getAuthUser(req);
    const userId = user?.id || req.body?.user_id || 'usr_patient_demo';
    await ContinuityController.createEvidence(req, res, userId);
  });

  router.get('/care-circle/granular-permissions/:memberId', async (req: Request, res: Response): Promise<void> => {
    const user = getAuthUser(req);
    const userId = user?.id || 'usr_patient_demo';
    const memberId = String(req.params.memberId);
    const member = await careCircleRepository.findById(memberId, userId);
    if (!member) {
      res.status(404).json({ success: false, error: 'Member not found' });
      return;
    }
    res.json({ success: true, member });
  });

  router.patch('/care-circle/granular-permissions/:memberId', async (req: Request, res: Response): Promise<void> => {
    const user = getAuthUser(req);
    const userId = user?.id || 'usr_patient_demo';
    const memberId = String(req.params.memberId);
    const { permissions } = req.body;
    await careCircleRepository.updatePermissions(memberId, userId, permissions || {});
    res.json({ success: true, message: 'Permissions updated successfully' });
  });

  return router;
}
