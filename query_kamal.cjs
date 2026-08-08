const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://koakdlbwsjekmtiunfhr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvYWtkbGJ3c2pla210aXVuZmhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNDEyNDUsImV4cCI6MjA4OTcxNzI0NX0.ZTXsET8hhtIebRmXiv1fHELmReGjVJlrq7HdlO9uWMI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log("Searching for Mohamed kamal...");
  const { data: athletes, error: aErr } = await supabase
    .from('agilitylap_athletes')
    .select('id, name')
    .ilike('name', '%Mohamed kamal%');
  
  if (aErr || !athletes || athletes.length === 0) {
    console.error("Athlete not found!", aErr);
    return;
  }
  
  const athlete = athletes[0];
  console.log(`Found Athlete: ${athlete.name} with ID: ${athlete.id}`);
  
  console.log("Fetching workouts...");
  const { data: workouts, error: wErr } = await supabase
    .from('agilitylap_workouts')
    .select('workout_date, workout_title, drills')
    .eq('athlete_id', athlete.id)
    .order('workout_date', { ascending: false });
    
  if (wErr) {
    console.error("Error fetching workouts!", wErr);
    return;
  }
  
  console.log(`Total workouts found in database: ${workouts.length}`);
  const activeWorkouts = workouts.filter(w => w.drills && w.drills.length > 0);
  console.log(`Workouts with active exercises: ${activeWorkouts.length}`);
  
  console.log("\nRecent workout dates:");
  activeWorkouts.slice(0, 15).forEach(w => {
    console.log(`- Date: ${w.workout_date} | Title: "${w.workout_title}" | Exercises Count: ${w.drills.length}`);
  });
}

run();
