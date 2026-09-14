/**
 * Supabase Service Integration
 * Provides native REST API and client capabilities for Supabase backend.
 */

export interface SupabaseConfig {
  projectId: string;
  url: string;
  publishableKey: string;
  serviceRoleKey?: string;
}

// User-provided Supabase configuration defaults
const DEFAULT_PROJECT_ID = 'alpnvchniykuqwxiyowz';
const DEFAULT_PUBLISHABLE_KEY = 'sb_publishable_JTUmTnUrtSJEDhvyPCzOyw_Xp1bm5qO';

export function getSupabaseConfig(): SupabaseConfig {
  const projectId = process.env.SUPABASE_PROJECT_ID || DEFAULT_PROJECT_ID;
  const url =
    process.env.SUPABASE_URL ||
    (projectId ? `https://${projectId}.supabase.co` : `https://${DEFAULT_PROJECT_ID}.supabase.co`);
  const publishableKey =
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    DEFAULT_PUBLISHABLE_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  return {
    projectId,
    url,
    publishableKey,
    serviceRoleKey,
  };
}

let isSupabaseApiConnected = false;
let lastSupabaseCheckTime: string | null = null;
let lastSupabaseError: string | null = null;

/**
 * Validates connectivity with the Supabase REST API.
 */
export async function testSupabaseConnection(): Promise<{
  success: boolean;
  projectId: string;
  url: string;
  statusCode?: number;
  message: string;
  timestamp: string;
}> {
  const config = getSupabaseConfig();
  const timestamp = new Date().toISOString();
  lastSupabaseCheckTime = timestamp;

  try {
    const headers: Record<string, string> = {
      apikey: config.publishableKey,
      Authorization: `Bearer ${config.publishableKey}`,
    };

    // Ping the Supabase REST root endpoint
    const response = await fetch(`${config.url}/rest/v1/`, {
      method: 'GET',
      headers,
    });

    // Supabase REST root returns 200 with schema or OpenAPI spec
    if (response.ok || response.status === 200 || response.status === 404 || response.status === 401) {
      // If we got a response from the Supabase edge gateway
      isSupabaseApiConnected = true;
      lastSupabaseError = null;
      console.log(`[Supabase] Successfully reached backend (${config.url}) with status ${response.status}`);
      return {
        success: true,
        projectId: config.projectId,
        url: config.url,
        statusCode: response.status,
        message: 'Supabase backend is reachable and initialized.',
        timestamp,
      };
    } else {
      const errText = await response.text();
      lastSupabaseError = `HTTP ${response.status}: ${errText}`;
      isSupabaseApiConnected = false;
      return {
        success: false,
        projectId: config.projectId,
        url: config.url,
        statusCode: response.status,
        message: `Supabase returned status ${response.status}`,
        timestamp,
      };
    }
  } catch (err: any) {
    lastSupabaseError = err.message || 'Connection timeout or network failure';
    isSupabaseApiConnected = false;
    console.warn('[Supabase] Connection check warning:', err.message);
    return {
      success: false,
      projectId: config.projectId,
      url: config.url,
      message: err.message || 'Failed to connect to Supabase endpoint',
      timestamp,
    };
  }
}

/**
 * Returns current Supabase backend status summary.
 */
export function getSupabaseStatus() {
  const config = getSupabaseConfig();
  const maskedKey = config.publishableKey
    ? `${config.publishableKey.substring(0, 8)}...${config.publishableKey.substring(config.publishableKey.length - 4)}`
    : 'Not configured';

  return {
    configured: Boolean(config.projectId && config.publishableKey),
    projectId: config.projectId,
    url: config.url,
    publishableKeyMasked: maskedKey,
    isConnected: isSupabaseApiConnected,
    lastChecked: lastSupabaseCheckTime,
    lastError: lastSupabaseError,
  };
}
