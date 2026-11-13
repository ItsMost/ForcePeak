-- ROLLBACK for 20261114000000_coach_tools.sql
-- Removes ONLY the 6 new coach-tool tables and their helper function.
-- ⚠️ This deletes data entered in the NEW features (tests, RPE logs, matches,
-- injury notes, WhatsApp numbers). Export them first (npm run backup).
-- Existing tables (athletes, programs, workouts...) are not touched.

BEGIN;
DROP TABLE IF EXISTS public.pf_athlete_contacts;
DROP TABLE IF EXISTS public.pf_athlete_notes;
DROP TABLE IF EXISTS public.pf_events;
DROP TABLE IF EXISTS public.pf_session_logs;
DROP TABLE IF EXISTS public.pf_test_definitions;
DROP TABLE IF EXISTS public.pf_test_results;
DROP FUNCTION IF EXISTS public.pf_is_coach();
COMMIT;
