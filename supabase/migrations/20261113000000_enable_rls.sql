-- =====================================================================
-- PEAK FORCE — lock the app's tables to the coach account only.
-- STATUS: DRAFT — DO NOT APPLY until the checklist in
--         supabase/RLS_CHECKLIST.md is done and Mahmoud says "موافق".
--
-- Data safety: this file does NOT touch any row. It only:
--   * enables RLS (does not change data),
--   * creates a helper function + policies,
--   * removes 2 existing "allow everyone" POLICIES (not data) that would
--     otherwise keep the tables open. The rollback file re-creates them.
--
-- Why not "any authenticated user"? This Supabase project is shared with
-- other apps and already has several Auth users (not only the coach), so
-- access is pinned to the coach's own user id.
--
-- Not touched on purpose: public.players (already protected by
-- "Coaches see own players"), the pf_* gym tables (open question), and
-- every table that belongs to other apps.
-- =====================================================================

BEGIN;

-- 1) Who is the coach? ------------------------------------------------
-- Replace the UUID below with the id of the account you log in with
-- (Supabase → Authentication → Users → copy "User UID").
-- To add an assistant coach later, just add another UUID to the list.
CREATE OR REPLACE FUNCTION public.is_peakforce_coach()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT auth.uid() IN (
    '__COACH_USER_ID__'::uuid
  );
$$;

REVOKE ALL ON FUNCTION public.is_peakforce_coach() FROM public;
GRANT EXECUTE ON FUNCTION public.is_peakforce_coach() TO authenticated;

-- 2) Enable RLS + coach-only policies on the PEAK FORCE tables ----------
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
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY "peakforce_coach_all" ON public.%I
         AS PERMISSIVE FOR ALL TO authenticated
         USING (public.is_peakforce_coach())
         WITH CHECK (public.is_peakforce_coach())', t);
  END LOOP;
END $$;

-- agilitylap_workouts already had RLS on, but with an "allow everyone"
-- policy that makes RLS useless. Remove that policy (data is untouched).
DROP POLICY IF EXISTS "Allow anonymous full access to agilitylap_workouts" ON public.agilitylap_workouts;

-- 3) Storage: welcome-packs ---------------------------------------------
-- Keep: "Public Access for Welcome Packs" (anyone can READ → athlete links keep working).
-- Remove: "Public Uploads for Welcome Packs" (anyone could UPLOAD files).
DROP POLICY IF EXISTS "Public Uploads for Welcome Packs" ON storage.objects;

CREATE POLICY "peakforce_coach_insert_welcome_packs" ON storage.objects
  AS PERMISSIVE FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'welcome-packs' AND public.is_peakforce_coach());

CREATE POLICY "peakforce_coach_update_welcome_packs" ON storage.objects
  AS PERMISSIVE FOR UPDATE TO authenticated
  USING (bucket_id = 'welcome-packs' AND public.is_peakforce_coach())
  WITH CHECK (bucket_id = 'welcome-packs' AND public.is_peakforce_coach());

CREATE POLICY "peakforce_coach_delete_welcome_packs" ON storage.objects
  AS PERMISSIVE FOR DELETE TO authenticated
  USING (bucket_id = 'welcome-packs' AND public.is_peakforce_coach());

COMMIT;
