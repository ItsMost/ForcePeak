-- =====================================================================
-- PEAK FORCE — coach tools (tests, readiness, session load, matches,
-- injury notes, WhatsApp numbers).
-- STATUS: DRAFT — apply only after Mahmoud says "موافق".
--
-- ADDITIVE ONLY: creates 6 NEW tables. Does not alter, update or delete
-- anything in existing tables (athletes, programs, workouts...).
-- No foreign keys to existing tables on purpose, so nothing here can ever
-- block or cascade a change on athletes/programs.
--
-- New tables are locked to the coach account from day one (they hold
-- personal data: phone numbers, injuries). The app is logged in as the
-- coach, so it can read/write them; the public anon key cannot.
-- Rollback: 20261114000000_coach_tools_rollback.sql
-- =====================================================================

BEGIN;

-- Coach account (coach@peakforce.app)
CREATE OR REPLACE FUNCTION public.pf_is_coach()
RETURNS boolean LANGUAGE sql STABLE SET search_path = '' AS $$
  SELECT auth.uid() = 'b09f7b93-2c27-4a10-b2e9-54be95004471'::uuid;
$$;
REVOKE ALL ON FUNCTION public.pf_is_coach() FROM public;
GRANT EXECUTE ON FUNCTION public.pf_is_coach() TO authenticated;

-- 1) Test results: 1RM, CMJ (also used for daily readiness), SJ, RSI, custom tests
CREATE TABLE public.pf_test_results (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id  uuid NOT NULL,
  test_key    text NOT NULL,           -- e.g. back_squat, cmj, custom:<slug>
  test_name   text NOT NULL,
  value       numeric NOT NULL,
  unit        text NOT NULL DEFAULT '',
  tested_on   date NOT NULL DEFAULT current_date,
  is_readiness boolean NOT NULL DEFAULT false,  -- quick pre-session CMJ check
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX pf_test_results_athlete_idx ON public.pf_test_results (athlete_id, test_key, tested_on DESC);

-- 2) Custom test definitions the coach adds
CREATE TABLE public.pf_test_definitions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key         text NOT NULL UNIQUE,
  name        text NOT NULL,
  unit        text NOT NULL DEFAULT '',
  higher_is_better boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 3) Session logs: RPE + duration per athlete per day (session load = RPE x minutes)
CREATE TABLE public.pf_session_logs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id   uuid NOT NULL,
  session_date date NOT NULL,
  rpe          numeric CHECK (rpe IS NULL OR (rpe >= 0 AND rpe <= 10)),
  duration_min numeric CHECK (duration_min IS NULL OR duration_min >= 0),
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (athlete_id, session_date)
);

-- 4) Matches / tournaments, for one athlete or a whole group
CREATE TABLE public.pf_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id  uuid,                    -- set for one athlete
  group_name  text,                    -- or set for a group (agilitylap_athletes.group_name)
  title       text NOT NULL,
  event_type  text NOT NULL DEFAULT 'match',  -- match | tournament | other
  event_date  date NOT NULL,
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CHECK (athlete_id IS NOT NULL OR group_name IS NOT NULL)
);
CREATE INDEX pf_events_date_idx ON public.pf_events (event_date);

-- 5) Injury notes / restrictions (warning only, never blocks)
CREATE TABLE public.pf_athlete_notes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id  uuid NOT NULL,
  note        text NOT NULL,
  restricted_keywords text[] NOT NULL DEFAULT '{}',  -- e.g. {depth jump, drop jump}
  start_date  date NOT NULL DEFAULT current_date,
  end_date    date,                    -- NULL = until removed
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX pf_athlete_notes_athlete_idx ON public.pf_athlete_notes (athlete_id);

-- 6) WhatsApp number per athlete (kept apart from the athlete profile row)
CREATE TABLE public.pf_athlete_contacts (
  athlete_id  uuid PRIMARY KEY,
  whatsapp    text,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Lock all new tables to the coach
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['pf_test_results','pf_test_definitions','pf_session_logs','pf_events','pf_athlete_notes','pf_athlete_contacts'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY "pf_coach_all" ON public.%I AS PERMISSIVE FOR ALL TO authenticated USING (public.pf_is_coach()) WITH CHECK (public.pf_is_coach())', t);
  END LOOP;
END $$;

COMMIT;
