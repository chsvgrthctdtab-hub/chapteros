import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

// Read Supabase environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

/**
 * Flag indicating whether valid Supabase credentials have been provided in the environment
 */
export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== "https://your-project.supabase.co" && 
  supabaseAnonKey !== "your-anon-key"
);

/**
 * Standard Supabase client instance with strongly-typed PostgreSQL schema.
 * If credentials are not configured, a placeholder client is provided
 * to prevent runtime crashes during preview/offline modes.
 */
export const supabase = createClient<Database>(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
