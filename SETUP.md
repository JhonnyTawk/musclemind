# MuscleMind — setup guide

The app runs in two modes:

- **Demo mode (default):** no backend. Data lives in the browser session. Great for
  showing the site; bookings/patients reset on refresh.
- **Supabase mode:** real database + login. Turns on automatically once the two
  environment variables below are set.

You only need the steps below when you want real, persistent data.

---

## 1. Connect Supabase (enables real data + login)

1. Create a free project at https://supabase.com.
2. In **Project Settings → API**, copy the **Project URL** and the **anon public** key.
3. In **Vercel → your project → Settings → Environment Variables**, add:
   - `VITE_SUPABASE_URL` = your Project URL
   - `VITE_SUPABASE_ANON_KEY` = your anon public key
4. Redeploy.

## 2. Create the database tables

In Supabase, open **Database → SQL Editor** and run, in this order:

1. `supabase/schema.sql`  (patients, logs, programs, profiles, RLS)
2. `supabase/phase2.sql`  (bookings + availability, RLS)

Both are safe to re-run.

## 3. Create your admin login (you only)

1. **Authentication → Users → Add user** → enter your email + a password.
2. **Authentication → Providers → Email:** turn **"Confirm email" OFF** so the login
   works immediately, and turn **"Allow new users to sign up" OFF** — there is no public
   registration; you are the only admin.
3. Make yourself an admin: in **SQL Editor**, run
   (replace the email with yours):

   ```sql
   update public.profiles
   set role = 'admin', full_name = 'Chada Tawk', title = 'Physiotherapist'
   where id = (select id from auth.users where email = 'YOUR-EMAIL');
   ```

You can now sign in at `/login`.

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
