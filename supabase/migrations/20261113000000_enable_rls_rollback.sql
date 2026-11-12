-- =====================================================================
-- ROLLBACK for 20261113000000_enable_rls.sql
-- Puts access back exactly as it was before (tables open to the anon key).
-- Touches no data. Run in the Supabase SQL editor only if the live app
-- shows empty lists / errors after the RLS migration.
-- =====================================================================

BEGIN;

-- 1) Remove the coach-only policies
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'agilitylap_athletes',
    'agilitylap_programs',
    'agilitylap_workouts',
    'agilitylap_templates',
    'periodization_deployments',
    'athletes_assessments',
    'library_drills'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "peakforce_coach_all" ON public.%I', t);
  END LOOP;
END $$;

-- 2) RLS back OFF on the tables that had it off before
ALTER TABLE public.agilitylap_athletes        DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.agilitylap_programs        DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.agilitylap_templates       DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.periodization_deployments  DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.athletes_assessments       DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_drills             DISABLE ROW LEVEL SECURITY;
-- agilitylap_workouts had RLS ON before → keep it on and restore its old open policy
CREATE POLICY "Allow anonymous full access to agilitylap_workouts" ON public.agilitylap_workouts
  AS PERMISSIVE FOR ALL TO public USING (true) WITH CHECK (true);

-- 3) Storage: restore the old public upload policy, remove coach-only ones
DROP POLICY IF EXISTS "peakforce_coach_insert_welcome_packs" ON storage.objects;
DROP POLICY IF EXISTS "peakforce_coach_update_welcome_packs" ON storage.objects;
DROP POLICY IF EXISTS "peakforce_coach_delete_welcome_packs" ON storage.objects;
CREATE POLICY "Public Uploads for Welcome Packs" ON storage.objects
  AS PERMISSIVE FOR INSERT TO public WITH CHECK (bucket_id = 'welcome-packs');

-- 4) Helper function
DROP FUNCTION IF EXISTS public.is_peakforce_coach();

COMMIT;
