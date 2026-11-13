# PEAK FORCE — Performance Lab

A training-program planner for a single coach (Captain Mahmoud Ali). Write weekly programs for each athlete,
build meso/macro blocks, deploy them on a calendar, keep an exercise library, and export programs as PDF /
print pages and shareable athlete welcome packs.

Live: https://force-peak.vercel.app

**Stack:** React 19 · Vite · Tailwind CSS 3 · Supabase (database, auth, storage) · PWA (installable, works offline).

---

## Run it locally

```bash
npm ci
cp .env.example .env      # then fill in the values (see below)
npm run dev               # http://localhost:5173
```

Other scripts:

| Command | What it does |
|---|---|
| `npm run build` | Production build into `dist/` |
| `npm run lint` | ESLint (TS + JS/JSX) |
| `npm run backup` | Read-only export of all app data (see Backups) |
| `npm run backup:counts` | Row counts only |

## Environment variables

| Name | Where | Value |
|---|---|---|
| `VITE_SUPABASE_URL` | `.env` and Vercel | Supabase → Project Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | `.env` and Vercel | Supabase → Project Settings → API → anon / publishable key |
| `VITE_COACH_LOGIN_EMAIL` | optional | Hidden account the passcode logs into (default `coach@peakforce.app`) |
| `SUPABASE_BACKUP_KEY` | `.env` only, optional | Lets the backup script read tables RLS hides from anon. **Never** prefix with `VITE_`, never commit. |

`.env` is gitignored. If the Vercel variables are missing, the app falls back to the project's public
URL/anon key so the site never goes blank.

## Login

The site shows a single **passcode** field. Behind it is a normal Supabase Auth user
(`coach@peakforce.app`, password = the passcode). Each device stays signed in until you press logout.
Change the passcode in Supabase → Authentication → Users → the coach user → reset password.

Welcome-pack links (`/?view-pack=<file>.html`) are public on purpose — athletes open them without logging in.

## Deploy

Vercel builds every push. `main` is production. Work on a branch, open a PR, merge.
Make sure the env vars above exist in Vercel (Production + Preview) before merging changes that need them.

## Data (Supabase)

Tables used by the app (do not rename): `agilitylap_athletes`, `agilitylap_programs`, `agilitylap_workouts`,
`agilitylap_templates`, `periodization_deployments`, `athletes_assessments`, `library_drills`.
Storage bucket: `welcome-packs`.

localStorage keys (do not rename): `agilitylap_offline_queue` (unsynced edits — never clear it),
`force_peak_history`, `forcepeak_athlete_order`, `forcepeak_theme`, `lastSelectedAthlete`.

The Supabase project is shared with other apps; only touch the tables above.

Row Level Security: a ready, **not applied** migration is in `supabase/migrations/` with its rollback and a
step-by-step checklist in `supabase/RLS_CHECKLIST.md`.

## Backups

```bash
npm run backup
```

Read-only: SELECTs every app table (1000 rows/page) and downloads every welcome-pack file into
`backup/<timestamp>/` as JSON + CSV, plus `counts.json`. The `backup/` folder holds personal athlete data and
is gitignored. Compare against an older snapshot — counts must never go down:

```bash
node backup/export.mjs --counts --compare backup/<timestamp>/counts.json
```

Copy backups somewhere off this machine (USB / cloud drive).

## Project layout

```
src/
  App.tsx                     login, public welcome-pack viewer
  supabaseClient.ts           Supabase client (env vars)
  data/
    constants.js              exercise library seed, categories
    categoryColors.js         category / superset / phase colors (defined once)
  components/WeeklyPlanner/
    index.jsx                 main planner screen
    hooks/                    useToast, useDarkMode, useOfflineSync
    plannerUtils.js           pure helpers
    Header, Sidebar, TimelineCard, ExerciseLibrary, PeriodizationPlanner, ...
    ConfirmDeleteModal.jsx    every delete goes through this
    htmlPrinter.js, welcomePackPrinter.js   print / welcome pack HTML
  utils/pdfGenerator.ts       weekly PDF (loaded only when exporting)
tailwind.config.js            design tokens (pf-*) — values in src/index.css
```

## Design system

Brand: **PEAK FORCE**, subtitle **Performance Lab**, brand color orange `#f97316`.
Use token classes for new UI: `bg-pf-bg`, `bg-pf-card`, `bg-pf-elevated`, `border-pf-border`,
`text-pf-text-primary|secondary|muted`, and accents `pf-accent` (orange), `pf-success`, `pf-warning`,
`pf-danger`, `pf-info`. Extra hues are reserved for data coding in `src/data/categoryColors.js`.
