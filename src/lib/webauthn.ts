import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
  platformAuthenticatorIsAvailable
} from '@simplewebauthn/browser';
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
  AuthenticationResponseJSON
} from '@simplewebauthn/browser';

/**
 * Check if the current browser supports standard WebAuthn
 */
export const isWebAuthnSupported = (): boolean => {
  return browserSupportsWebAuthn();
};

/**
 * Check if the device has a platform authenticator (Touch ID, Face ID, Windows Hello, Android Biometrics)
 */
export const isPlatformAuthenticatorAvailable = async (): Promise<boolean> => {
  try {
    return await platformAuthenticatorIsAvailable();
  } catch {
    return false;
  }
};

/**
 * Audio feedback generator for pleasant user cues
 */
export const playWebAuthnSound = (type: 'scan' | 'success' | 'error') => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === 'scan') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === 'success') {
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.06);
        gain.gain.setValueAtTime(0.08, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.2);
      });
    } else if (type === 'error') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(240, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch {
    // Audio autoplay might be blocked
  }
};

/**
 * Handle user cancellation and browser WebAuthn error formatting
 */
export function formatWebAuthnError(err: any): string {
  if (!err) return 'Authentication failed.';

  const message = err.message || String(err);
  const name = err.name || '';

  if (name === 'NotAllowedError' || message.includes('cancelled') || message.includes('not allowed')) {
    return 'Authentication was cancelled or timed out. Admin access was not granted.';
  }
  if (name === 'InvalidStateError' || message.includes('already registered')) {
    return 'This device or authenticator is already registered for this administrator.';
  }
  if (name === 'NotSupportedError' || message.includes('not supported')) {
    return 'This browser or device does not support secure WebAuthn biometric verification.';
  }
  if (name === 'SecurityError' || message.includes('secure context') || message.includes('HTTPS')) {
    return 'Secure authentication requires HTTPS and a supported browser.';
  }

  return message || 'Biometric verification failed. Admin access denied.';
}

/**
 * Trigger native browser WebAuthn registration ceremony
 */
export async function registerAdminPasskey(
  options: PublicKeyCredentialCreationOptionsJSON
): Promise<{ success: boolean; response?: RegistrationResponseJSON; error?: string }> {
  try {
    if (!isWebAuthnSupported()) {
      return {
        success: false,
        error: 'This browser or device does not support secure biometric authentication.'
      };
    }

    const regResponse = await startRegistration({ optionsJSON: options });
    return {
      success: true,
      response: regResponse
    };
  } catch (err: any) {
    return {
      success: false,
      error: formatWebAuthnError(err)
    };
  }
}

/**
 * Trigger native browser WebAuthn authentication ceremony
 */
export async function authenticateAdminPasskey(
  options: PublicKeyCredentialRequestOptionsJSON
): Promise<{ success: boolean; response?: AuthenticationResponseJSON; error?: string }> {
  try {
    if (!isWebAuthnSupported()) {
      return {
        success: false,
        error: 'This browser or device does not support secure biometric authentication.'
      };
    }

    const authResponse = await startAuthentication({ optionsJSON: options });
    return {
      success: true,
      response: authResponse
    };
  } catch (err: any) {
    return {
      success: false,
      error: formatWebAuthnError(err)
    };
  }
}
