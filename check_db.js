import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://koakdlbwsjekmtiunfhr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvYWtkbGJ3c2pla210aXVuZmhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNDEyNDUsImV4cCI6MjA4OTcxNzI0NX0.ZTXsET8hhtIebRmXiv1fHELmReGjVJlrq7HdlO9uWMI';
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
