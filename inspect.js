import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://koakdlbwsjekmtiunfhr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvYWtkbGJ3c2pla210aXVuZmhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNDEyNDUsImV4cCI6MjA4OTcxNzI0NX0.ZTXsET8hhtIebRmXiv1fHELmReGjVJlrq7HdlO9uWMI';

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
