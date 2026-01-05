import { createClient } from '@supabase/supabase-js';

const PROJECT_URL = "https://xuzfgdqmnmzzhnqscaml.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1emZnZHFtbm16emhucXNjYW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NjQ5NzQsImV4cCI6MjA4MTQ0MDk3NH0.rF3CC3HOTJTpSvMABiKkOLGgkcVU_tEryZkDwIkpMlI";
const SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || "";

export const isSupabaseConfigured = () => {
  return !!PROJECT_URL && !!ANON_KEY && ANON_KEY.length > 50;
};

export const isAdminAvailable = () => {
  return isSupabaseConfigured() && !!SERVICE_ROLE_KEY && SERVICE_ROLE_KEY.length > 50;
};

/**
 * Standard client for user-level interactions (RLS enforced)
 */
export const supabase = isSupabaseConfigured() 
  ? createClient(PROJECT_URL, ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true }
    }) 
  : null;

/**
 * Admin client for infrastructure provisioning (Bypasses RLS)
 */
export const supabaseAdmin = isAdminAvailable()
  ? createClient(PROJECT_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  : null;

/**
 * High-Clearance Health Check
 * Verifies if the identity cluster and event bus are responsive.
 */
export const checkDatabaseHealth = async (): Promise<boolean> => {
  if (!isSupabaseConfigured() || !supabase) {
    console.warn("DB Config missing. Ensure URL and KEY are present.");
    return false;
  }
  
  try {
    // Attempt to query the profiles table to verify schema exists
    const { error } = await supabase.from('profiles').select('id', { count: 'exact', head: true });
    
    if (error) {
        if (error.code === '42P01') {
            console.error("CRITICAL: Table 'profiles' missing. Run SQL schema in Supabase Editor.");
            return false;
        }
        return false;
    }
    return true;
  } catch (e) {
    return false;
  }
};