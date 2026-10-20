import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://koakdlbwsjekmtiunfhr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvYWtkbGJ3c2pla210aXVuZmhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNDEyNDUsImV4cCI6MjA4OTcxNzI0NX0.ZTXsET8hhtIebRmXiv1fHELmReGjVJlrq7HdlO9uWMI';

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
