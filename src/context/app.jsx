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
    if (!supabaseConfigured) {
      const saved = sessionStorage.getItem('mm-demo-user')
      if (saved) setUser(JSON.parse(saved))
      setLoading(false)
      return
    }
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

  async function hydrateProfile(authUser) {
    const { data: profile } = await supabase
      .from('profiles').select('*').eq('id', authUser.id).single()
    setUser({
      id: authUser.id, email: authUser.email,
      name: profile?.full_name || authUser.email,
      role: profile?.role || 'therapist',
      title: profile?.title || 'Physiotherapist',
    })
  }

  const signIn = async (email, password) => {
    if (!supabaseConfigured) {
      const demo = { id: 't1', email: email || 'lina@musclemind.clinic', name: 'Dr. Lina Khoury', role: 'admin', title: 'Clinic Director · PT, DPT' }
      sessionStorage.setItem('mm-demo-user', JSON.stringify(demo))
      setUser(demo)
      return { error: null }
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  const signOut = async () => {
    if (supabaseConfigured) await supabase.auth.signOut()
    sessionStorage.removeItem('mm-demo-user')
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
  const [patients, setPatients] = useState(mock.PATIENTS)
  const [logs, setLogs] = useState(mock.SYMPTOM_LOGS)
  const [alerts, setAlerts] = useState(mock.ALERTS)
  const [programs, setPrograms] = useState({})       // patientId -> program
  const [assessments, setAssessments] = useState({}) // patientId -> draft
  const [settings, setSettings] = useState(mock.DEFAULT_SETTINGS)
  const [ready, setReady] = useState(!supabaseConfigured)

  useEffect(() => {
    if (!supabaseConfigured) return
    ;(async () => {
      try {
        const [{ data: ps }, { data: ls }, { data: as }] = await Promise.all([
          supabase.from('patients').select('*').order('last_visit', { ascending: false }),
          supabase.from('symptom_logs').select('*').order('date'),
          supabase.from('alerts').select('*').order('date', { ascending: false }),
        ])
        if (ps?.length) setPatients(ps.map(rowToPatient))
        if (ls?.length) setLogs(ls.map(rowToLog))
        if (as?.length) setAlerts(as.map((a) => ({ id: a.id, patientId: a.patient_id, severity: a.severity, kind: a.kind, text: a.text, date: a.date })))
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

  const value = useMemo(() => ({
    ready, patients, logs, alerts, programs, assessments, settings, setSettings,
    therapists: mock.THERAPISTS, exercises: mock.EXERCISES,
    appointments: mock.APPOINTMENTS, followups: mock.FOLLOWUPS,
    weeklyActivity: mock.WEEKLY_ACTIVITY, conditionsDist: mock.CONDITIONS_DIST,
    phaseDist: mock.PHASE_DIST, postureLogs: mock.POSTURE_LOGS,
    aclPhases: mock.ACL_PHASES, aclState: mock.ACL_PATIENT_STATE,
    outcomeTools: mock.OUTCOME_TOOLS,
    addPatient, updatePatient, addLog, dismissAlert, saveProgram, saveAssessment,
  }), [ready, patients, logs, alerts, programs, assessments, settings])

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
  }
  if (partial) Object.keys(map).forEach((k) => map[k] === undefined && delete map[k])
  return map
}
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
