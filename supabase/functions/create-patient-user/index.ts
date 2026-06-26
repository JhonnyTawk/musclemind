// ============================================================
// Edge Function: create-patient-user
// ------------------------------------------------------------
// Creates a login (email + password) for a patient and links it
// to their patient row. Runs on Supabase's servers with the
// service-role key, so that powerful key NEVER ships to the
// browser. Only a logged-in ADMIN may call it.
//
// Deploy:  supabase functions deploy create-patient-user
// (No extra secrets needed — SUPABASE_URL, SUPABASE_ANON_KEY and
//  SUPABASE_SERVICE_ROLE_KEY are injected automatically.)
// ============================================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  // Admin (service role) client — bypasses RLS for privileged checks + actions.
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // 1) Identify the caller by validating their JWT with the service client.
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
  if (!token) return json({ error: 'Missing authorization header' }, 401)
  const { data: userData, error: userErr } = await admin.auth.getUser(token)
  if (userErr || !userData?.user) {
    return json({ error: `Could not verify your session: ${userErr?.message ?? 'no user'}` }, 401)
  }
  const callerId = userData.user.id

  // 2) Authorize: caller must be staff with role 'admin'. Specific errors so
  //    misconfiguration is obvious instead of a blanket "Admins only".
  const { data: profile, error: profErr } = await admin
    .from('profiles').select('role').eq('id', callerId).maybeSingle()
  if (profErr) return json({ error: `Profile lookup failed: ${profErr.message}` }, 403)
  if (!profile) return json({ error: `No profile row exists for your account (${callerId}). Run the admin upsert in SETUP.md.` }, 403)
  if (profile.role !== 'admin') return json({ error: `Your role is "${profile.role}", but creating logins requires "admin".` }, 403)

  // 4) Validate input.
  let body: { patientId?: string; email?: string; password?: string }
  try { body = await req.json() } catch { return json({ error: 'Invalid JSON' }, 400) }
  const { patientId, email, password } = body
  if (!patientId || !email || !password) return json({ error: 'patientId, email and password are required' }, 400)
  if (String(password).length < 8) return json({ error: 'Password must be at least 8 characters' }, 400)

  // 5) Make sure the patient exists.
  const { data: patient, error: pErr } = await admin
    .from('patients').select('id, auth_user_id').eq('id', patientId).single()
  if (pErr || !patient) return json({ error: 'Patient not found' }, 404)

  // 6) Create (or reuse) the auth user.
  let userId = patient.auth_user_id as string | null
  if (!userId) {
    const { data: created, error: cErr } = await admin.auth.admin.createUser({
      email, password, email_confirm: true, user_metadata: { role: 'patient', patient_id: patientId },
    })
    if (cErr) return json({ error: cErr.message }, 400)
    userId = created.user.id
  } else {
    // Existing account → just reset its password.
    const { error: uErr } = await admin.auth.admin.updateUserById(userId, { password, email })
    if (uErr) return json({ error: uErr.message }, 400)
  }

  // 7) Link the auth user to the patient row + store the login email.
  const { error: linkErr } = await admin
    .from('patients').update({ auth_user_id: userId, email }).eq('id', patientId)
  if (linkErr) return json({ error: linkErr.message }, 400)

  return json({ ok: true, userId, email })
})
