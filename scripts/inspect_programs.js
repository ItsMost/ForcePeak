import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL; // run with: node --env-file=.env scripts/inspect_programs.js
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspect() {
  const { data, error } = await supabase.from('agilitylap_programs').select('*').limit(5);
  if (error) {
    console.error('Error fetching programs:', error);
  } else if (data && data.length > 0) {
    console.log('PROGRAM COLUMNS:', Object.keys(data[0]));
    console.log('PROGRAM RECORDS:', JSON.stringify(data, null, 2));
  } else {
    console.log('No programs found in DB.');
  }
}

inspect();
