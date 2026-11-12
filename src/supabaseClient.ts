import { createClient } from '@supabase/supabase-js';

// Configured via env vars (.env locally, Vercel → Settings → Environment Variables in production).
// Fallback = the project's public (publishable) anon values, so the site never goes blank if
// the env vars are missing in a deployment. The anon key is not a secret: it ships in every
// browser bundle, and data access is controlled by RLS.
const FALLBACK_URL = 'https://koakdlbwsjekmtiunfhr.supabase.co';
const FALLBACK_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvYWtkbGJ3c2pla210aXVuZmhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNDEyNDUsImV4cCI6MjA4OTcxNzI0NX0.ZTXsET8hhtIebRmXiv1fHELmReGjVJlrq7HdlO9uWMI';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || FALLBACK_URL;
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || FALLBACK_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
