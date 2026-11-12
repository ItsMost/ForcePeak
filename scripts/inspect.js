import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL; // run with: node --env-file=.env scripts/inspect.js
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('Testing Supabase Connection...');
  
  // Test 1: pf_players
  const { data: dataPlayers, error: errorPlayers } = await supabase
    .from('pf_players')
    .select('*')
    .limit(1);
    
  if (errorPlayers) {
    console.error('Error querying pf_players:', errorPlayers);
  } else {
    console.log('pf_players query success! Rows found:', dataPlayers?.length);
  }

  // Test 2: general connection info or fallback tables
  const { data: dataRaw, error: errorRaw } = await supabase
    .from('players')
    .select('*')
    .limit(1);

  if (errorRaw) {
    console.error('Error querying raw players:', errorRaw);
  } else {
    console.log('raw players query success! Rows found:', dataRaw?.length);
  }
}

testConnection();
