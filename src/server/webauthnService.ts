import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} from '@simplewebauthn/server';
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON
} from '@simplewebauthn/server';
import { Request } from 'express';
import { dbEngine, UserRecord, WebAuthnCredentialRecord } from './db';
import { realtimeHub } from './realtime';

// WebAuthn configuration
export const RP_NAME = process.env.WEBAUTHN_RP_NAME || 'DHealora Medical Administration';

// Helper to determine RP ID from incoming request
export function getRPID(req?: Request): string {
  if (process.env.WEBAUTHN_RP_ID) {
    return process.env.WEBAUTHN_RP_ID;
  }
  if (!req) return 'localhost';
  const host = req.get('host') || req.hostname || 'localhost';
  // Strip port if present
  return host.split(':')[0];
}

// Helper to determine Origin from incoming request
export function getExpectedOrigin(req?: Request): string | string[] {
  if (process.env.WEBAUTHN_ORIGIN) {
    return process.env.WEBAUTHN_ORIGIN.split(',').map(s => s.trim());
  }
  if (!req) return ['http://localhost:3000', 'http://localhost:5173'];
  const host = req.get('host') || req.hostname || 'localhost';
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const originHeader = req.get('origin');
  
  const origins = new Set<string>();
  if (originHeader) origins.add(originHeader);
  origins.add(`${protocol}://${host}`);
  origins.add(`http://${host}`);
  origins.add(`https://${host}`);
  origins.add('http://localhost:3000');
  origins.add('https://localhost:3000');
  origins.add('http://127.0.0.1:3000');

  return Array.from(origins);
}

// In-Memory Temporary Challenge Cache (TTL 5 mins)
interface PendingChallenge {
  userId: string;
  userEmail: string;
  challenge: string;
  expiresAt: number;
  ceremony: 'registration' | 'authentication';
  deviceName?: string;
  ipAddress?: string;
}

const challengeCache = new Map<string, PendingChallenge>();

// Clean up expired challenges every 60s
const challengeCleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, val] of challengeCache.entries()) {
    if (val.expiresAt < now) {
      challengeCache.delete(key);
    }
  }
}, 60000);
if (typeof challengeCleanupInterval.unref === 'function') {
  challengeCleanupInterval.unref();
}

// Rate Limiter & Brute-force protection tracker
interface AttemptTracker {
  count: number;
  firstAttempt: number;
  lockedUntil?: number;
}
const rateLimitMap = new Map<string, AttemptTracker>();

export function checkRateLimit(key: string, maxAttempts = 6, windowMs = 15 * 60 * 1000, lockoutMs = 5 * 60 * 1000): { allowed: boolean; retryAfterSeconds?: number; error?: string } {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record) {
    rateLimitMap.set(key, { count: 1, firstAttempt: now });
    return { allowed: true };
  }

  if (record.lockedUntil && record.lockedUntil > now) {
    const retryAfter = Math.ceil((record.lockedUntil - now) / 1000);
    return {
      allowed: false,
      retryAfterSeconds: retryAfter,
      error: `Too many failed attempts. Temporary security lockout active. Please wait ${retryAfter} seconds.`
    };
  }

  if (now - record.firstAttempt > windowMs) {
    rateLimitMap.set(key, { count: 1, firstAttempt: now });
    return { allowed: true };
  }

  record.count += 1;
  if (record.count > maxAttempts) {
    record.lockedUntil = now + lockoutMs;
    const retryAfter = Math.ceil(lockoutMs / 1000);
    return {
      allowed: false,
      retryAfterSeconds: retryAfter,
      error: `Security threshold exceeded. Temporary lockout for ${retryAfter} seconds.`
    };
  }

  return { allowed: true };
}

export function resetRateLimit(key: string) {
  rateLimitMap.delete(key);
}

// Convert Base64URL string to Uint8Array (helper)
export function base64URLToBuffer(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (base64.length % 4)) % 4;
  const padded = base64 + '='.repeat(padLen);
  const binary = Buffer.from(padded, 'base64');
  return new Uint8Array(binary);
}

// Convert Uint8Array to Base64URL string (helper)
export function bufferToBase64URL(buffer: Uint8Array): string {
  return Buffer.from(buffer)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export class WebAuthnService {
  /**
   * Log an audit event for Admin authentication actions
   */
  static logAuthAudit(
    action: string,
    adminUser: UserRecord,
    details: string,
    success: boolean,
    req?: Request,
    extra?: Record<string, any>
  ) {
    const ip = req?.headers['x-forwarded-for'] || req?.socket.remoteAddress || '127.0.0.1';
    dbEngine.logAudit({
      actor_admin_id: adminUser.id,
      actor_name: adminUser.name || 'System Administrator',
      action,
      target_type: 'AUTHENTICATION_EVENT',
      target_id: adminUser.id,
      details: `${details} (IP: ${ip})`,
      after_state: { success, ...extra }
    });
  }

  /**
   * Get active, non-revoked WebAuthn credentials for a given user
   */
  static getUserCredentials(userId: string): WebAuthnCredentialRecord[] {
    const db = dbEngine.getRaw();
    return db.webauthn_credentials.filter(c => c.user_id === userId && !c.revoked_at);
  }

  /**
   * 1. Generate Registration Options for Admin
   */
  static async generateRegistrationOptions(adminUser: UserRecord, deviceName = 'Device Passkey / Biometrics', req?: Request) {
    const rpID = getRPID(req);
    const existingCreds = this.getUserCredentials(adminUser.id);

    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID,
      userID: new Uint8Array(Buffer.from(adminUser.id)),
      userName: adminUser.email,
      userDisplayName: adminUser.name || 'System Administrator',
      attestationType: 'none',
      excludeCredentials: existingCreds.map(c => ({
        id: c.credential_id,
        transports: (c.transports as any) || ['internal', 'hybrid']
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'required' // Strong biometrics or device unlock required
      },
      timeout: 60000
    });

    // Store challenge temporarily (TTL 5 mins)
    const challengeKey = `reg_${adminUser.id}`;
    challengeCache.set(challengeKey, {
      userId: adminUser.id,
      userEmail: adminUser.email,
      challenge: options.challenge,
      expiresAt: Date.now() + 5 * 60 * 1000,
      ceremony: 'registration',
      deviceName,
      ipAddress: String(req?.headers['x-forwarded-for'] || req?.socket.remoteAddress || '')
    });

    this.logAuthAudit('WEBAUTHN_REGISTRATION_STARTED', adminUser, `Initiated WebAuthn passkey registration ceremony (${deviceName})`, true, req);

    return options;
  }

  /**
   * 2. Verify Registration Response from Browser
   */
  static async verifyRegistration(adminUser: UserRecord, response: RegistrationResponseJSON, deviceName: string, req?: Request) {
    const challengeKey = `reg_${adminUser.id}`;
    const pending = challengeCache.get(challengeKey);

    if (!pending || pending.expiresAt < Date.now()) {
      challengeCache.delete(challengeKey);
      this.logAuthAudit('WEBAUTHN_REGISTRATION_FAILURE', adminUser, 'Registration challenge expired or missing', false, req);
      throw new Error('WebAuthn registration challenge expired or invalid. Please try again.');
    }

    const expectedOrigin = getExpectedOrigin(req);
    const expectedRPID = getRPID(req);

    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response,
        expectedChallenge: pending.challenge,
        expectedOrigin,
        expectedRPID,
        requireUserVerification: true
      });
    } catch (err: any) {
      challengeCache.delete(challengeKey);
      this.logAuthAudit('WEBAUTHN_REGISTRATION_FAILURE', adminUser, `Cryptographic verification failed: ${err?.message || err}`, false, req);
      throw new Error(`WebAuthn registration validation failed: ${err?.message || 'Invalid signature'}`);
    }

    if (!verification.verified || !verification.registrationInfo) {
      challengeCache.delete(challengeKey);
      this.logAuthAudit('WEBAUTHN_REGISTRATION_FAILURE', adminUser, 'Registration verification returned false', false, req);
      throw new Error('WebAuthn verification could not be cryptographically confirmed.');
    }

    const { credential, aaguid } = verification.registrationInfo;

    // Check for duplicate credential ID
    const db = dbEngine.getRaw();
    const credIdString = credential.id;
    const existing = db.webauthn_credentials.find(c => c.credential_id === credIdString && !c.revoked_at);
    if (existing) {
      challengeCache.delete(challengeKey);
      throw new Error('This biometric / passkey credential has already been registered on this system.');
    }

    // Save only cryptographic public credential data (NEVER raw biometrics)
    const newCredentialRecord: WebAuthnCredentialRecord = {
      id: 'cred_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      user_id: adminUser.id,
      credential_id: credIdString,
      public_key: bufferToBase64URL(credential.publicKey),
      counter: credential.counter,
      transports: (credential.transports as string[]) || ['internal', 'hybrid'],
      device_name: deviceName || pending.deviceName || 'Admin Authenticator',
      aaguid: aaguid || undefined,
      created_at: new Date().toISOString(),
      last_used_at: new Date().toISOString(),
      revoked_at: null
    };

    db.webauthn_credentials.push(newCredentialRecord);
    dbEngine.save();

    // Consume challenge
    challengeCache.delete(challengeKey);

    this.logAuthAudit(
      'WEBAUTHN_REGISTRATION_SUCCESS',
      adminUser,
      `WebAuthn credential successfully enrolled for device: ${newCredentialRecord.device_name}`,
      true,
      req,
      { credentialId: newCredentialRecord.id, device: newCredentialRecord.device_name }
    );

    realtimeHub.broadcast('ADMIN_SECURITY_UPDATED', 'webauthn_credentials', { userId: adminUser.id });

    return {
      verified: true,
      credential: newCredentialRecord
    };
  }

  /**
   * 3. Generate Authentication Options for Admin Login (Factor 2)
   */
  static async generateAuthenticationOptions(adminUser: UserRecord, req?: Request) {
    const rpID = getRPID(req);
    const existingCreds = this.getUserCredentials(adminUser.id);

    if (existingCreds.length === 0) {
      throw new Error('No registered WebAuthn authenticators found for this administrator. Initial biometric enrollment is required.');
    }

    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: existingCreds.map(c => ({
        id: c.credential_id,
        transports: (c.transports as any) || ['internal', 'hybrid']
      })),
      userVerification: 'required', // Strong biometric / PIN prompt
      timeout: 60000
    });

    const challengeKey = `auth_${adminUser.id}`;
    challengeCache.set(challengeKey, {
      userId: adminUser.id,
      userEmail: adminUser.email,
      challenge: options.challenge,
      expiresAt: Date.now() + 5 * 60 * 1000,
      ceremony: 'authentication',
      ipAddress: String(req?.headers['x-forwarded-for'] || req?.socket.remoteAddress || '')
    });

    this.logAuthAudit('WEBAUTHN_LOGIN_STARTED', adminUser, 'Initiated WebAuthn authentication challenge ceremony', true, req);

    return options;
  }

  /**
   * 4. Verify Authentication Assertion Response (Factor 2 confirmation)
   */
  static async verifyAuthentication(adminUser: UserRecord, response: AuthenticationResponseJSON, req?: Request) {
    const challengeKey = `auth_${adminUser.id}`;
    const pending = challengeCache.get(challengeKey);

    if (!pending || pending.expiresAt < Date.now()) {
      challengeCache.delete(challengeKey);
      this.logAuthAudit('WEBAUTHN_LOGIN_FAILURE', adminUser, 'Authentication challenge expired or missing', false, req);
      throw new Error('WebAuthn authentication challenge expired. Please retry.');
    }

    const db = dbEngine.getRaw();
    const credentialRecord = db.webauthn_credentials.find(
      c => c.credential_id === response.id && c.user_id === adminUser.id && !c.revoked_at
    );

    if (!credentialRecord) {
      challengeCache.delete(challengeKey);
      this.logAuthAudit('WEBAUTHN_LOGIN_FAILURE', adminUser, `Unrecognized or revoked credential ID: ${response.id}`, false, req);
      throw new Error('Unknown or revoked authenticator credential.');
    }

    const expectedOrigin = getExpectedOrigin(req);
    const expectedRPID = getRPID(req);

    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge: pending.challenge,
        expectedOrigin,
        expectedRPID,
        credential: {
          id: credentialRecord.credential_id,
          publicKey: base64URLToBuffer(credentialRecord.public_key) as any,
          counter: credentialRecord.counter,
          transports: (credentialRecord.transports as any) || undefined
        },
        requireUserVerification: true
      });
    } catch (err: any) {
      challengeCache.delete(challengeKey);
      this.logAuthAudit('WEBAUTHN_LOGIN_FAILURE', adminUser, `Cryptographic assertion error: ${err?.message || err}`, false, req);
      throw new Error(`WebAuthn assertion failed: ${err?.message || 'Invalid cryptographic signature'}`);
    }

    if (!verification.verified || !verification.authenticationInfo) {
      challengeCache.delete(challengeKey);
      this.logAuthAudit('WEBAUTHN_LOGIN_FAILURE', adminUser, 'Assertion verification returned false', false, req);
      throw new Error('WebAuthn assertion verification failed.');
    }

    // Update credential counter & last used timestamp
    credentialRecord.counter = verification.authenticationInfo.newCounter;
    credentialRecord.last_used_at = new Date().toISOString();
    adminUser.last_login = new Date().toISOString();
    dbEngine.save();

    // Consume challenge
    challengeCache.delete(challengeKey);

    this.logAuthAudit(
      'WEBAUTHN_LOGIN_SUCCESS',
      adminUser,
      `WebAuthn verification succeeded on device "${credentialRecord.device_name}"`,
      true,
      req,
      { credentialId: credentialRecord.id, counter: credentialRecord.counter }
    );

    return {
      verified: true,
      credential: credentialRecord
    };
  }

  /**
   * Revoke an enrolled security device
   */
  static revokeCredential(adminUser: UserRecord, credentialId: string, req?: Request): boolean {
    const db = dbEngine.getRaw();
    const cred = db.webauthn_credentials.find(
      c => (c.id === credentialId || c.credential_id === credentialId) && c.user_id === adminUser.id
    );

    if (!cred) {
      return false;
    }

    cred.revoked_at = new Date().toISOString();
    dbEngine.save();

    this.logAuthAudit(
      'WEBAUTHN_CREDENTIAL_REVOKED',
      adminUser,
      `Revoked security credential "${cred.device_name}" (ID: ${cred.id})`,
      true,
      req
    );

    realtimeHub.broadcast('ADMIN_SECURITY_UPDATED', 'webauthn_credentials', { userId: adminUser.id });
    return true;
  }
}
