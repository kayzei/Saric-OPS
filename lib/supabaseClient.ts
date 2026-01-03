import { createClient } from '@supabase/supabase-js';

// Production Credentials
const PROJECT_URL = "https://xuzfgdqmnmzzhnqscaml.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1emZnZHFtbm16emhucXNjYW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NjQ5NzQsImV4cCI6MjA4MTQ0MDk3NH0.rF3CC3HOTJTpSvMABiKkOLGgkcVU_tEryZkDwIkpMlI";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1emZnZHFtbm16emhucXNjYW1sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTg2NDk3NCwiZXhwIjoyMDgxNDQwOTc0fQ.jYUKpRzkDxGmn_CLHMW-mxfHqBVtyLxX2NIoaOF_LJM";

export const isSupabaseConfigured = () => {
  return !!PROJECT_URL && !!ANON_KEY && ANON_KEY.length > 50;
};

// Standard client for user-level interactions
export const supabase = isSupabaseConfigured() 
  ? createClient(PROJECT_URL, ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    }) 
  : null;

// Admin client for bootstrapping (Only used for initial setup of demo accounts)
export const supabaseAdmin = isSupabaseConfigured() && SERVICE_ROLE_KEY
  ? createClient(PROJECT_URL, SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

/**
 * Performs a health check on the identity cluster.
 * Designed to wake up hibernating projects.
 */
export const checkDatabaseHealth = async (): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;
  
  const attempt = async (retries = 3): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout for cold start

      // Ping the auth health endpoint
      const response = await fetch(`${PROJECT_URL}/auth/v1/health`, {
        method: 'GET',
        headers: { 'apikey': ANON_KEY },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (response.ok || response.status === 401) {
        return true;
      }
      return false;
    } catch (e: any) {
      if (retries > 0) {
        const isFetchError = e.message?.includes('fetch') || e.name === 'TypeError' || e.name === 'AbortError';
        if (isFetchError) {
          console.warn(`[Vanguard] Identity Cluster Cold Start... Retry ${4 - retries}`);
          await new Promise(r => setTimeout(r, 4000)); // Wait 4s before retry
          return attempt(retries - 1);
        }
      }
      return false;
    }
  };
  
  return attempt();
};
