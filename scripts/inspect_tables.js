import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL; // run with: node --env-file=.env scripts/inspect_tables.js
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectAll() {
  const tables = ['pf_players', 'pf_subscriptions', 'pf_attendance', 'pf_payments', 'pf_expenses'];
  
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('*').limit(1);
    if (error) {
      console.error(`Error querying table "${t}":`, error);
    } else {
      console.log(`Table "${t}" is queryable! Rows found:`, data?.length);
    }
  }
}

inspectAll();
