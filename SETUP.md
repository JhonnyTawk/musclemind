# MuscleMind — setup guide

This app is **fully backed by Supabase** — real accounts, real data, secure access.
The public homepage works without any setup, but **sign-in and all patient data require
the steps below.** There is no demo/offline mode.

> Do the steps in order. Total time ~15 minutes.

---

## 1. Connect Supabase (enables real data + login)

1. Create a free project at https://supabase.com.
2. In **Project Settings → API**, copy the **Project URL** and the **anon public** key.
3. In **Vercel → your project → Settings → Environment Variables**, add:
   - `VITE_SUPABASE_URL` = https://dhwokqcocelnqkwwkxyz.supabase.co
   - `VITE_SUPABASE_ANON_KEY` = sb_publishable_pij95b6g7It7wnOElplZpQ_vxR8HOTb
4. Redeploy.

## 2. Create the database tables

In Supabase, open **Database → SQL Editor** and run, in this order:

1. `supabase/schema.sql`   (patients, logs, programs, profiles)
2. `supabase/phase2.sql`   (bookings + availability)
3. `supabase/phase2b.sql`  (patient logins + appointments + **secure row-level security**)

All are safe to re-run. Step 3 is what enforces "patients see only their own data".

## 3. Create your admin login (you only)

1. **Authentication → Users → Add user** → enter your email + a password.
2. **Authentication → Providers → Email:** turn **"Confirm email" OFF** so the login
   works immediately, and turn **"Allow new users to sign up" OFF** — there is no public
   registration; you are the only admin.
3. Make yourself an admin: in **SQL Editor**, run this (replace the email with yours).
   It **creates** your profile row if it doesn't exist and sets it to admin — use this
   even if you created your user before running `schema.sql`:

   ```sql
   insert into public.profiles (id, full_name, title, role)
   select id, 'Chada Tawk', 'Physiotherapist', 'admin'
   from auth.users
   where email = 'YOUR-EMAIL'
   on conflict (id) do update
     set role = 'admin',
         full_name = excluded.full_name,
         title = excluded.title;
   ```

   To confirm it worked, run:
   ```sql
   select u.email, p.role
   from auth.users u left join public.profiles p on p.id = u.id
   where u.email = 'YOUR-EMAIL';
   ```
   You should see `role = admin`. If `role` is null, the insert didn't match — check the email.

You can now sign in at `/login`.

## 4. Deploy the patient-login function (one time)

Creating a patient login needs a privileged key that must never live in the browser, so
it runs inside a Supabase **Edge Function** (free).

Using the [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
supabase login
supabase link --project-ref YOUR-PROJECT-REF
supabase functions deploy create-patient-user
```

No extra secrets are needed — Supabase injects the keys automatically. That's it; the
**Generate portal access** button on a patient's profile will now work.

---

## How patient access works (secure by design)

- On a patient's profile, click **Generate portal access** → enter their email, get a
  temporary password, and send both to them (one-tap WhatsApp button included).
- The patient signs in at the same `/login` page and is taken to **their** portal:
  next appointment, prescribed exercises, follow-up date + instructions, and any notes
  you wrote for them.
- **Security:** every table uses Postgres Row-Level Security. A logged-in patient can
  only ever read the single patient row linked to their account (and its program,
  appointments and logs). They cannot see other patients, bookings, or staff data —
  this is enforced by the database itself, not just the UI. Staff access is limited to
  accounts that have a `profiles` row with an admin/therapist role.

---

## How booking + reminders work (100% free, no paid API)

There is **no WhatsApp Business API and no Twilio** — nothing that costs money.

- A visitor books on the homepage → the request is **saved to your dashboard**
  (Appointments page) *and* opens a pre-filled WhatsApp to your number so you're
  notified instantly.
- In **Appointments**, each request has one-tap buttons:
  - **WhatsApp confirmation / reminder** — opens WhatsApp pre-filled to the client's
    number; you just press send. Free.
  - **Add to my calendar** — downloads a `.ics` file. Add it to your phone calendar and
    it reminds you automatically; you can send the same file to the client so their
    calendar reminds them too.
- **Availability** tab: block whole days or single times. Blocked slots disappear from
  the website's booking form.

> Fully automatic, hands-off reminder *sending* isn't possible for free (it needs a paid
> messaging provider). The one-tap WhatsApp buttons + calendar files are the free
> equivalent and require no setup or monthly cost.

---

## Editing the website content

All public text, your details, testimonials, address/map, hours, and the WhatsApp number
live in **`src/config/site.js`**. Edit that one file — nothing else needed.
