import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL; // run with: node --env-file=.env scripts/check_db.js
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const { data, error } = await supabase.from('agilitylap_athletes').select('*').limit(1);
  if (error) {
    console.error('Error fetching:', error);
  } else if (data && data.length > 0) {
    console.log('ATHLETE COLUMNS:', Object.keys(data[0]));
    console.log('FULL RECORD:', data[0]);
  } else {
    console.log('No athletes found in DB.');
  }
}

check();
