import { useMemo, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, ClipboardList, Dumbbell, Activity, GitBranch,
  FileBarChart2, Settings, Bell, Search, Plus, Menu, X, LogOut, HeartPulse,
  CalendarDays,
} from 'lucide-react'
import { useAuth, useData, useToast } from '../context/app'
import { Avatar, Badge, Modal, Field, Input, Select } from './ui'

const NAV = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/appointments', label: 'Appointments', icon: CalendarDays },
  { to: '/app/patients', label: 'Patients', icon: Users },
  { to: '/app/assessment', label: 'Assessment Form', icon: ClipboardList },
  { to: '/app/exercises', label: 'Home Exercise Program', icon: Dumbbell },
  { to: '/app/symptoms', label: 'Symptom Tracker', icon: Activity },
  { to: '/app/reports', label: 'Reports', icon: FileBarChart2 },
  { to: '/app/settings', label: 'Settings', icon: Settings },
]

export function Logo({ light = false, size = 'md' }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={`${size === 'lg' ? 'h-10 w-10' : 'h-8 w-8'} rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0`}>
        <HeartPulse size={size === 'lg' ? 22 : 18} strokeWidth={2.4} />
      </div>
      <span className={`font-display font-bold ${size === 'lg' ? 'text-xl' : 'text-[17px]'} ${light ? 'text-white' : 'text-ink'}`}>
        MuscleMind
      </span>
    </div>
  )
}

function SidebarContent({ onNavigate }) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pt-5 pb-6"><Logo light /></div>
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} onClick={onNavigate}
            className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive ? 'bg-teal-600/90 text-white' : 'text-teal-50/70 hover:bg-white/5 hover:text-white'}`}>
            <Icon size={18} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-white/10">
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar name={user?.name} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-white truncate">{user?.name}</div>
            <div className="text-[11px] text-teal-100/60 truncate">{user?.role === 'admin' ? 'Administrator' : 'Therapist'}</div>
          </div>
          <button onClick={() => { signOut(); navigate('/') }} aria-label="Sign out"
            className="p-2 rounded-lg text-teal-100/60 hover:text-white hover:bg-white/10 transition-colors">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

function NewPatientModal({ open, onClose }) {
  const { addPatient, therapists } = useData()
  const toast = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', age: '', gender: 'Female', complaint: '', diagnosis: '', therapistId: 't2', phone: '', occupation: '', activity: '' })
  const [errors, setErrors] = useState({})
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Full name is required'
    if (!form.age || +form.age <= 0) errs.age = 'Enter a valid age'
    if (!form.complaint.trim()) errs.complaint = 'Main complaint is required'
    setErrors(errs)
    if (Object.keys(errs).length) return
    const p = await addPatient({ ...form, age: +form.age })
    toast(`Patient ${p.name} added`)
    onClose()
    navigate(`/app/patients/${p.id}`)
  }

  return (
    <Modal open={open} onClose={onClose} title="New patient">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2"><Field label="Full name" error={errors.name}><Input value={form.name} onChange={set('name')} placeholder="e.g. Layla Karam" /></Field></div>
        <Field label="Age" error={errors.age}><Input type="number" value={form.age} onChange={set('age')} placeholder="34" /></Field>
        <Field label="Gender"><Select value={form.gender} onChange={set('gender')}><option>Female</option><option>Male</option><option>Other</option></Select></Field>
        <Field label="Phone"><Input value={form.phone} onChange={set('phone')} placeholder="+961 ..." /></Field>
        <Field label="Occupation"><Input value={form.occupation} onChange={set('occupation')} /></Field>
        <div className="sm:col-span-2"><Field label="Main complaint" error={errors.complaint}><Input value={form.complaint} onChange={set('complaint')} placeholder="e.g. Right knee pain after running" /></Field></div>
        <div className="sm:col-span-2"><Field label="Working diagnosis" hint="Can be refined after assessment"><Input value={form.diagnosis} onChange={set('diagnosis')} /></Field></div>
        <Field label="Sport / activity"><Input value={form.activity} onChange={set('activity')} /></Field>
        <Field label="Assigned therapist">
          <Select value={form.therapistId} onChange={set('therapistId')}>
            {therapists.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </Select>
        </Field>
      </div>
      <div className="flex justify-end gap-2 mt-6">
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={submit}>Add patient</button>
      </div>
    </Modal>
  )
}

export default function Layout() {
  const { patients, alerts, settings } = useData()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [drawer, setDrawer] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [newOpen, setNewOpen] = useState(false)

  const matches = useMemo(() => q.trim().length < 2 ? [] :
    patients.filter((p) => (p.name + p.code + (p.diagnosis || '')).toLowerCase().includes(q.toLowerCase())).slice(0, 6),
  [q, patients])

  return (
    <div className="h-full flex">
      {/* desktop sidebar */}
      <aside className="hidden lg:block w-[248px] shrink-0 bg-ink">
        <SidebarContent />
      </aside>
      {/* mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setDrawer(false)} />
          <aside className="absolute left-0 top-0 h-full w-[270px] bg-ink fade-up">
            <button className="absolute right-3 top-4 p-2 text-white/70" onClick={() => setDrawer(false)} aria-label="Close menu"><X size={18} /></button>
            <SidebarContent onNavigate={() => setDrawer(false)} />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {/* top bar */}
        <header className="h-16 shrink-0 bg-white border-b border-line flex items-center gap-3 px-4 sm:px-6 relative z-20">
          <button className="lg:hidden btn-ghost p-2" onClick={() => setDrawer(true)} aria-label="Open menu"><Menu size={20} /></button>

          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search patients…"
              className="input pl-9 bg-canvas border-transparent focus:bg-white" aria-label="Search patients" />
            {matches.length > 0 && (
              <div className="absolute top-full mt-1 left-0 right-0 card shadow-pop overflow-hidden">
                {matches.map((p) => (
                  <button key={p.id} onClick={() => { setQ(''); navigate(`/app/patients/${p.id}`) }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-teal-50 text-left">
                    <Avatar name={p.name} size="sm" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{p.name}</div>
                      <div className="text-xs text-ink-3 truncate">{p.code} · {p.diagnosis}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="hidden md:block text-sm font-semibold text-ink-3 ml-auto mr-1">{settings.clinicName}</div>

          <div className="relative">
            <button className="btn-ghost p-2.5 relative" aria-label="Notifications" onClick={() => setNotifOpen((v) => !v)}>
              <Bell size={19} />
              {alerts.length > 0 && <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-danger ring-2 ring-white" />}
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-full mt-1 w-80 card shadow-pop overflow-hidden fade-up">
                <div className="px-4 py-3 border-b border-line font-display font-semibold text-sm">Alerts</div>
                {alerts.length === 0 && <div className="px-4 py-6 text-sm text-ink-3 text-center">All clear — no active alerts.</div>}
                {alerts.slice(0, 5).map((a) => {
                  const p = patients.find((x) => x.id === a.patientId)
                  return (
                    <button key={a.id} onClick={() => { setNotifOpen(false); navigate(`/app/patients/${a.patientId}`) }}
                      className="w-full text-left px-4 py-3 hover:bg-teal-50/60 border-b border-line last:border-0">
                      <div className="flex items-center gap-2">
                        <Badge color={a.severity === 'high' ? 'red' : a.severity === 'medium' ? 'amber' : 'slate'}>{a.kind}</Badge>
                        <span className="text-xs text-ink-3 ml-auto">{a.date}</span>
                      </div>
                      <div className="text-sm mt-1.5">{p?.name}: {a.text}</div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <button className="btn-primary" onClick={() => setNewOpen(true)}>
            <Plus size={16} /> <span className="hidden sm:inline">New Patient</span>
          </button>
        </header>

        <main className="flex-1 overflow-y-auto" onClick={() => notifOpen && setNotifOpen(false)}>
          <div className="mx-auto max-w-[1240px] p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>

      <NewPatientModal open={newOpen} onClose={() => setNewOpen(false)} />
    </div>
  )
}
