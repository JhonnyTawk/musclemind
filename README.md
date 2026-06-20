# MuscleMind — Physiotherapy Clinic Platform

A modern physiotherapy & rehabilitation web app: assessments, home exercise
programs, symptom tracking, ACL rehab timeline, reports — built with React,
Vite, Tailwind and Supabase, deployable for free on GitHub Pages.

## How it works

- **Staff (admin / therapists)** sign in with email + password (Supabase Auth).
- **Patients never log in.** Each patient gets a private link
  (`/#/p/<token>`) where they see their exercise plan and submit a daily
  symptom check-in.
- With no Supabase keys set, the app runs in **demo mode** with a seeded
  clinic (patients, logs, programs) so it can be demoed instantly.

Demo patient links you can try locally: `/#/p/demo-karim`, `/#/p/demo-rana`.

## 1. Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173 — click **Enter demo clinic** on the login page.

## 2. Connect Supabase (free tier)

1. Create a project at https://supabase.com (free).
2. Open **SQL Editor**, paste the contents of `supabase/schema.sql`, run it.
   This creates tables, row-level security, and seeds the demo clinic.
3. In **Authentication → Users**, click **Add user** and create your admin
   account (e.g. your email + password). Then in **Table Editor → profiles**,
   set that row's `role` to `admin` and fill `full_name`. Add therapist
   accounts the same way (role `therapist`).
4. In **Project Settings → API**, copy the **Project URL** and **anon key**.
5. Locally: copy `.env.example` to `.env` and fill both values, then restart
   `npm run dev`. The login page now uses real authentication.

## 3. Deploy free with GitHub Pages

1. Create a GitHub repo and push this project to `main`.
2. In the repo: **Settings → Pages → Source: GitHub Actions**.
3. In **Settings → Secrets and variables → Actions**, add two secrets:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   (Skip this step to deploy in demo mode.)
4. Push to `main`. The included workflow (`.github/workflows/deploy.yml`)
   builds and publishes automatically. Your app will be live at
   `https://<your-username>.github.io/<repo-name>/`.

The app uses hash-based routing (`/#/...`) specifically so deep links work on
GitHub Pages without any 404 workaround.

## Security notes for production

- The anon-key policies in `schema.sql` are MVP-grade: patient-portal reads
  are open to anyone holding the anon key (tokens are unguessable, but rows
  are technically listable). Before real patient data, replace the anon
  `select` policies with a `security definer` Postgres function keyed on
  `share_token`, or move portal reads behind a Supabase Edge Function.
- This is a demo/MVP. Storing real health data requires compliance work
  (consent, encryption, data-processing agreements) beyond this scope.

## Stack

- React 18 + Vite, Tailwind CSS, Recharts, lucide-react
- Supabase (Postgres + Auth + RLS), with an in-memory demo fallback
- GitHub Actions → GitHub Pages
