import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
const anon = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string | undefined;

/** Null in demo mode (no Supabase configured). PKCE: the magic link must be opened in the same browser that requested it. */
export const supabase: SupabaseClient | null = url && anon
  ? createClient(url, anon, { auth: { flowType: "pkce", persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
  : null;
