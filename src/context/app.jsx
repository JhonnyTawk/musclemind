import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase, supabaseConfigured } from '../lib/supabase'
import * as mock from '../lib/mock'

/* ------------------------------ Toasts ------------------------------ */
const ToastCtx = createContext(null)
export const useToast = () => useContext(ToastCtx)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const toast = useCallback((message, kind = 'success') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((t) => [...t, { id, message, kind }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200)
  }, [])
  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] space-y-2 w-80 max-w-[calc(100vw-2.5rem)]">
        {toasts.map((t) => (
          <div key={t.id} className={`fade-up card px-4 py-3 text-sm font-medium flex items-start gap-2 ${
            t.kind === 'error' ? 'border-red-200 text-danger' : t.kind === 'info' ? 'border-teal-200 text-ink' : 'border-teal-200 text-teal-800'
          }`}>
            <span className={`mt-1 h-2 w-2 rounded-full shrink-0 ${t.kind === 'error' ? 'bg-danger' : 'bg-teal-600'}`} />
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

/* ------------------------------- Auth ------------------------------- */
const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)        // { id, email, name, role }
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabaseConfigured) { setLoading(false); return }  // real backend required
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) await hydrateProfile(data.session.user)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, session) => {
      if (session) await hydrateProfile(session.user)
      else setUser(null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  // Decide who the logged-in user is. Patient identity ALWAYS takes priority:
  // if this account is linked to a patient record it is a patient and only ever
  // sees the patient portal — never the staff app — even if a stray profile row
  // exists. Otherwise a profiles row means staff.
  async function hydrateProfile(authUser) {
    const { data: patient } = await supabase
      .from('patients').select('id, full_name').eq('auth_user_id', authUser.id).maybeSingle()
    if (patient) {
      setUser({ id: authUser.id, email: authUser.email, name: patient.full_name, role: 'patient', patientId: patient.id })
      return
    }
    const { data: profile } = await supabase
      .from('profiles').select('*').eq('id', authUser.id).maybeSingle()
    if (profile) {
      setUser({
        id: authUser.id, email: authUser.email,
        name: profile.full_name || authUser.email,
        role: profile.role || 'therapist',
        title: profile.title || 'Physiotherapist',
      })
      return
    }
    setUser({ id: authUser.id, email: authUser.email, role: null })  // unlinked account
  }

  const signIn = async (email, password) => {
    if (!supabaseConfigured) return { error: { message: 'The app is not connected to its database yet.' } }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signOut = async () => {
    if (supabaseConfigured) await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthCtx.Provider value={{ user, loading, signIn, signOut, supabaseConfigured }}>
      {children}
    </AuthCtx.Provider>
  )
}

/* ------------------------------- Data ------------------------------- */
// One data API for the whole app. With Supabase configured, reads/writes go
// to Postgres; otherwise an in-memory copy of the seed data is used so the
// demo behaves identically.
const DataCtx = createContext(null)
export const useData = () => useContext(DataCtx)

export function DataProvider({ children }) {
  // Real data only — these start empty and are filled from Supabase.
  const [patients, setPatients] = useState([])
  const [logs, setLogs] = useState([])
  const [alerts, setAlerts] = useState([])
  const [appointments, setAppointments] = useState([])
  const [programs, setPrograms] = useState({})       // patientId -> program
  const [assessments, setAssessments] = useState({}) // patientId -> draft
  const [settings, setSettings] = useState(mock.DEFAULT_SETTINGS)
  const [bookings, setBookings] = useState([])          // public appointment requests
  const [availabilityBlocks, setAvailabilityBlocks] = useState([]) // blocked dates/times
  const [ready, setReady] = useState(!supabaseConfigured)

  // Each query is RLS-scoped: staff get everything, a logged-in patient gets
  // only their own rows, and anonymous visitors get nothing here.
  useEffect(() => {
    if (!supabaseConfigured) return
    ;(async () => {
      try {
        const [{ data: ps }, { data: ls }, { data: al }, { data: ap }, { data: pr }, { data: bk }, { data: av }] = await Promise.all([
          supabase.from('patients').select('*').order('last_visit', { ascending: false }),
          supabase.from('symptom_logs').select('*').order('date'),
          supabase.from('alerts').select('*').order('date', { ascending: false }),
          supabase.from('appointments').select('*').order('date'),
          supabase.from('exercise_programs').select('*'),
          supabase.from('bookings').select('*').order('created_at', { ascending: false }),
          supabase.from('availability_blocks').select('*').order('date'),
        ])
        setPatients((ps || []).map(rowToPatient))
        setLogs((ls || []).map(rowToLog))
        setAlerts((al || []).map((a) => ({ id: a.id, patientId: a.patient_id, severity: a.severity, kind: a.kind, text: a.text, date: a.date })))
        setAppointments((ap || []).map(rowToAppointment))
        if (pr?.length) setPrograms(Object.fromEntries(pr.map((r) => [r.patient_id, r.program])))
        setBookings((bk || []).map(rowToBooking))
        setAvailabilityBlocks((av || []).map(rowToBlock))
      } finally { setReady(true) }
    })()
  }, [])

  const addPatient = async (p) => {
    const id = 'p' + Math.random().toString(36).slice(2, 8)
    const full = {
      id, code: 'MM-' + Math.floor(1000 + Math.random() * 9000),
      status: 'Active', painNow: p.painNow ?? 0, adherence: 0,
      lastVisit: new Date().toISOString().slice(0, 10),
      shareToken: Math.random().toString(36).slice(2, 10),
      history: '', surgical: '', medications: '', goals: '', redFlags: 'Not yet screened',
      frequency: '', progress: 'New patient — assessment pending.', ...p,
    }
    setPatients((arr) => [full, ...arr])
    if (supabaseConfigured) await supabase.from('patients').insert(patientToRow(full))
    return full
  }

  const updatePatient = async (id, patch) => {
    setPatients((arr) => arr.map((p) => (p.id === id ? { ...p, ...patch } : p)))
    if (supabaseConfigured) await supabase.from('patients').update(patientToRow(patch, true)).eq('id', id)
  }

  const deletePatient = async (id) => {
    setPatients((arr) => arr.filter((p) => p.id !== id))
    setLogs((arr) => arr.filter((l) => l.patientId !== id))
    setAppointments((arr) => arr.filter((a) => a.patientId !== id))
    if (supabaseConfigured) await supabase.from('patients').delete().eq('id', id)
  }

  const addLog = async (log) => {
    const full = { id: 'l' + Math.random().toString(36).slice(2, 9), date: new Date().toISOString().slice(0, 10), ...log }
    setLogs((arr) => [...arr, full])
    if (supabaseConfigured) await supabase.from('symptom_logs').insert(logToRow(full))
    return full
  }

  const dismissAlert = async (id) => {
    setAlerts((arr) => arr.filter((a) => a.id !== id))
    if (supabaseConfigured) await supabase.from('alerts').delete().eq('id', id)
  }

  const saveProgram = async (patientId, program) => {
    setPrograms((m) => ({ ...m, [patientId]: program }))
    if (supabaseConfigured)
      await supabase.from('exercise_programs').upsert({ patient_id: patientId, program, updated_at: new Date().toISOString() }, { onConflict: 'patient_id' })
  }

  const saveAssessment = async (patientId, form, status = 'draft') => {
    setAssessments((m) => ({ ...m, [patientId || '_unassigned']: { form, status } }))
    if (supabaseConfigured && patientId)
      await supabase.from('assessments').upsert({ patient_id: patientId, form, status, updated_at: new Date().toISOString() }, { onConflict: 'patient_id' })
  }

  // ---- Bookings (public appointment requests) ----
  const addBooking = async (b) => {
    const full = {
      id: 'b' + Math.random().toString(36).slice(2, 9),
      status: 'pending', createdAt: new Date().toISOString(), ...b,
    }
    setBookings((arr) => [full, ...arr])
    if (supabaseConfigured) {
      const { data } = await supabase.from('bookings').insert(bookingToRow(full)).select().single()
      if (data) setBookings((arr) => arr.map((x) => (x.id === full.id ? rowToBooking(data) : x)))
    }
    return full
  }

  const updateBooking = async (id, patch) => {
    setBookings((arr) => arr.map((b) => (b.id === id ? { ...b, ...patch } : b)))
    if (supabaseConfigured) await supabase.from('bookings').update(bookingToRow(patch, true)).eq('id', id)
  }

  const deleteBooking = async (id) => {
    setBookings((arr) => arr.filter((b) => b.id !== id))
    if (supabaseConfigured) await supabase.from('bookings').delete().eq('id', id)
  }

  // ---- Availability blocks ----
  const addBlock = async (date, time = '', reason = '') => {
    const full = { id: 'av' + Math.random().toString(36).slice(2, 9), date, time: time || '', reason }
    setAvailabilityBlocks((arr) =>
      arr.some((b) => b.date === date && (b.time || '') === (time || '')) ? arr : [...arr, full])
    if (supabaseConfigured) await supabase.from('availability_blocks').upsert(
      { date, time: time || null, reason }, { onConflict: 'date,time' })
    return full
  }

  const removeBlock = async (id) => {
    const block = availabilityBlocks.find((b) => b.id === id)
    setAvailabilityBlocks((arr) => arr.filter((b) => b.id !== id))
    if (supabaseConfigured && block) {
      let q = supabase.from('availability_blocks').delete().eq('date', block.date)
      q = block.time ? q.eq('time', block.time) : q.is('time', null)
      await q
    }
  }

  // ---- Appointments (real, RLS-scoped) ----
  const addAppointment = async (appt) => {
    const full = { id: 'a' + Math.random().toString(36).slice(2, 9), ...appt }
    setAppointments((arr) => [...arr, full])
    if (supabaseConfigured) {
      const { data } = await supabase.from('appointments')
        .insert({ patient_id: appt.patientId, date: appt.date, time: appt.time, type: appt.type, notes: appt.notes })
        .select().single()
      if (data) setAppointments((arr) => arr.map((x) => (x.id === full.id ? rowToAppointment(data) : x)))
    }
    return full
  }
  const deleteAppointment = async (id) => {
    setAppointments((arr) => arr.filter((a) => a.id !== id))
    if (supabaseConfigured) await supabase.from('appointments').delete().eq('id', id)
  }

  // ---- Patient portal credentials (secure: runs server-side) ----
  // Calls the create-patient-user Edge Function, which verifies the caller
  // is an admin and creates the login with the service-role key.
  const generatePatientCredentials = async (patientId, email, password) => {
    if (!supabaseConfigured) return { error: 'Backend not connected' }
    const { data, error } = await supabase.functions.invoke('create-patient-user', {
      body: { patientId, email, password },
    })
    if (error) {
      let msg = error.message
      try { msg = (await error.context?.json())?.error || msg } catch { /* ignore */ }
      return { error: msg }
    }
    if (data?.error) return { error: data.error }
    setPatients((arr) => arr.map((p) => (p.id === patientId ? { ...p, email, authUserId: data.userId } : p)))
    return { data }
  }

  // Follow-ups are derived from patients who have a follow-up date set.
  const followups = useMemo(
    () => patients.filter((p) => p.followUpDate)
      .map((p) => ({ id: 'fu-' + p.id, patientId: p.id, due: p.followUpDate, reason: p.followUpInstructions || 'Follow-up' })),
    [patients],
  )

  const value = useMemo(() => ({
    ready, patients, logs, alerts, programs, assessments, settings, setSettings,
    bookings, availabilityBlocks, appointments, followups,
    therapists: mock.THERAPISTS, exercises: mock.EXERCISES,
    weeklyActivity: mock.WEEKLY_ACTIVITY, conditionsDist: mock.CONDITIONS_DIST,
    phaseDist: mock.PHASE_DIST, postureLogs: mock.POSTURE_LOGS,
    aclPhases: mock.ACL_PHASES, aclState: mock.ACL_PATIENT_STATE,
    outcomeTools: mock.OUTCOME_TOOLS,
    addPatient, updatePatient, deletePatient, addLog, dismissAlert, saveProgram, saveAssessment,
    addBooking, updateBooking, deleteBooking, addBlock, removeBlock,
    addAppointment, deleteAppointment, generatePatientCredentials,
  }), [ready, patients, logs, alerts, programs, assessments, settings, bookings, availabilityBlocks, appointments, followups])

  return <DataCtx.Provider value={value}>{children}</DataCtx.Provider>
}

/* --------------------------- row mappers ---------------------------- */
const rowToPatient = (r) => ({
  id: r.id, code: r.code, name: r.full_name, age: r.age, gender: r.gender,
  phone: r.phone, email: r.email, occupation: r.occupation, activity: r.activity,
  complaint: r.complaint, diagnosis: r.diagnosis, therapistId: r.therapist_id,
  lastVisit: r.last_visit, status: r.status, painNow: r.pain_now, adherence: r.adherence,
  rehabPhase: r.rehab_phase, history: r.history, surgical: r.surgical,
  medications: r.medications, goals: r.goals, redFlags: r.red_flags,
  frequency: r.frequency, progress: r.progress, shareToken: r.share_token, isACL: r.is_acl,
  authUserId: r.auth_user_id, followUpDate: r.follow_up_date,
  followUpInstructions: r.follow_up_instructions, portalNotes: r.portal_notes,
})
const patientToRow = (p, partial = false) => {
  const map = {
    id: p.id, code: p.code, full_name: p.name, age: p.age, gender: p.gender,
    phone: p.phone, email: p.email, occupation: p.occupation, activity: p.activity,
    complaint: p.complaint, diagnosis: p.diagnosis, therapist_id: p.therapistId,
    last_visit: p.lastVisit, status: p.status, pain_now: p.painNow, adherence: p.adherence,
    rehab_phase: p.rehabPhase, history: p.history, surgical: p.surgical,
    medications: p.medications, goals: p.goals, red_flags: p.redFlags,
    frequency: p.frequency, progress: p.progress, share_token: p.shareToken, is_acl: p.isACL,
    follow_up_date: p.followUpDate, follow_up_instructions: p.followUpInstructions,
    portal_notes: p.portalNotes,
  }
  if (partial) Object.keys(map).forEach((k) => map[k] === undefined && delete map[k])
  return map
}
const rowToAppointment = (r) => ({
  id: r.id, patientId: r.patient_id, date: r.date, time: r.time, type: r.type, notes: r.notes,
})
const rowToBooking = (r) => ({
  id: r.id, name: r.name, phone: r.phone, sessionType: r.session_type,
  requestedDate: r.requested_date, requestedTime: r.requested_time,
  notes: r.notes, status: r.status, createdAt: r.created_at,
})
const bookingToRow = (b, partial = false) => {
  const map = {
    name: b.name, phone: b.phone, session_type: b.sessionType,
    requested_date: b.requestedDate, requested_time: b.requestedTime,
    notes: b.notes, status: b.status,
  }
  if (partial) Object.keys(map).forEach((k) => map[k] === undefined && delete map[k])
  return map
}
const rowToBlock = (r) => ({ id: r.id, date: r.date, time: r.time || '', reason: r.reason || '' })
const rowToLog = (r) => ({
  id: r.id, patientId: r.patient_id, date: r.date, pain: r.pain, stiffness: r.stiffness,
  swelling: r.swelling, sleep: r.sleep, fatigue: r.fatigue, function: r.function_level,
  confidence: r.confidence, mood: r.mood, exercisesDone: r.exercises_done,
  bodyArea: r.body_area, note: r.note,
})
const logToRow = (l) => ({
  patient_id: l.patientId, date: l.date, pain: l.pain, stiffness: l.stiffness,
  swelling: l.swelling, sleep: l.sleep, fatigue: l.fatigue, function_level: l.function,
  confidence: l.confidence, mood: l.mood, exercises_done: l.exercisesDone,
  body_area: l.bodyArea, note: l.note,
})
