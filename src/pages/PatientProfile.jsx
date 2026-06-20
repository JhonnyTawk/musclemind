import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Phone, Mail, Briefcase, Dumbbell, Flag, KeyRound, ClipboardList,
  Activity, StickyNote, Plus, GitBranch, Copy, MessageCircle, CalendarPlus, Save, RefreshCw,
} from 'lucide-react'
import { useData, useToast } from '../context/app'
import { Card, CardHeader, Tabs, Avatar, Badge, StatusBadge, PainBadge, ProgressBar, EmptyState, Textarea, Modal, Field, Input, Select } from '../components/ui'
import { TrendLine, TrendArea } from '../components/charts'
import { waLink } from '../lib/schedule'
import { SITE } from '../config/site'

const TABS = ['Overview', 'Assessment', 'Exercises', 'Symptoms', 'Progress', 'Notes']

const genPassword = () => {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}
const loginUrl = () => `${window.location.origin}${window.location.pathname}#/login`

/* ---------------- Generate patient portal access ---------------- */
function PortalAccessModal({ open, onClose, patient }) {
  const { generatePatientCredentials } = useData()
  const toast = useToast()
  const [email, setEmail] = useState(patient.email || '')
  const [password, setPassword] = useState(genPassword())
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const create = async () => {
    setError('')
    if (!email.trim()) { setError('Enter an email for the patient login'); return }
    setBusy(true)
    const { error } = await generatePatientCredentials(patient.id, email.trim(), password)
    setBusy(false)
    if (error) { setError(error); return }
    setDone(true)
    toast('Patient login created')
  }

  const credBlock =
    `Your ${SITE.clinicName} portal\n` +
    `Login: ${loginUrl()}\n` +
    `Email: ${email}\n` +
    `Password: ${password}\n` +
    `(You can change your password after signing in.)`

  return (
    <Modal open={open} onClose={onClose} title="Patient portal access">
      {!done ? (
        <div className="space-y-4">
          <p className="text-sm text-ink-3">
            Create a private login so {patient.name.split(' ')[0]} can see their appointment,
            exercises and follow-up — and nothing else.
          </p>
          <Field label="Patient login email">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="patient@email.com" />
          </Field>
          <Field label="Temporary password" hint="Share this with the patient; they can change it later.">
            <div className="flex gap-2">
              <Input value={password} onChange={(e) => setPassword(e.target.value)} />
              <button className="btn-secondary px-3" onClick={() => setPassword(genPassword())} aria-label="Regenerate"><RefreshCw size={15} /></button>
            </div>
          </Field>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary" disabled={busy} onClick={create}>
              <KeyRound size={15} /> {busy ? 'Creating…' : 'Create login'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 text-sm text-emerald-800">
            Login created. Send these details to the patient:
          </div>
          <pre className="text-sm bg-canvas border border-line rounded-xl p-4 whitespace-pre-wrap font-body">{credBlock}</pre>
          <div className="flex flex-wrap gap-2">
            <button className="btn-secondary" onClick={() => { navigator.clipboard?.writeText(credBlock); toast('Copied') }}>
              <Copy size={15} /> Copy
            </button>
            {patient.phone && (
              <a className="btn-primary" href={waLink(patient.phone, credBlock)} target="_blank" rel="noopener noreferrer">
                <MessageCircle size={15} /> Send on WhatsApp
              </a>
            )}
            <button className="btn-ghost ml-auto" onClick={onClose}>Done</button>
          </div>
        </div>
      )}
    </Modal>
  )
}

/* ---------------- Portal info: follow-up, notes, next appointment ---------------- */
function PortalInfoCard({ patient }) {
  const { updatePatient, addAppointment, appointments } = useData()
  const toast = useToast()
  const [followUpDate, setFollowUpDate] = useState(patient.followUpDate || '')
  const [followUpInstructions, setFollowUpInstructions] = useState(patient.followUpInstructions || '')
  const [portalNotes, setPortalNotes] = useState(patient.portalNotes || '')
  const [appt, setAppt] = useState({ date: '', time: '', type: 'Follow-up' })

  const upcoming = appointments
    .filter((a) => a.patientId === patient.id && a.date >= new Date().toISOString().slice(0, 10))
    .sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')))

  const saveInfo = async () => {
    await updatePatient(patient.id, { followUpDate: followUpDate || null, followUpInstructions, portalNotes })
    toast('Portal info saved')
  }
  const schedule = async () => {
    if (!appt.date) { toast('Pick a date', 'error'); return }
    await addAppointment({ patientId: patient.id, ...appt })
    setAppt({ date: '', time: '', type: 'Follow-up' })
    toast('Appointment scheduled')
  }

  return (
    <Card className="p-5">
      <h3 className="font-display font-semibold mb-1">Patient portal</h3>
      <p className="text-xs text-ink-3 mb-4">What the patient sees when they sign in.</p>

      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Follow-up date"><Input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} /></Field>
        <Field label="Follow-up instructions"><Input value={followUpInstructions} onChange={(e) => setFollowUpInstructions(e.target.value)} placeholder="e.g. Reassess knee ROM" /></Field>
      </div>
      <div className="mt-3">
        <Field label="Notes for the patient" hint="Shown on their portal">
          <Textarea value={portalNotes} onChange={(e) => setPortalNotes(e.target.value)} placeholder="Anything you'd like the patient to see…" />
        </Field>
      </div>
      <button className="btn-primary mt-3" onClick={saveInfo}><Save size={15} /> Save portal info</button>

      <div className="mt-5 pt-5 border-t border-line">
        <div className="font-display font-semibold text-sm mb-2">Schedule next appointment</div>
        {upcoming.length > 0 && (
          <div className="mb-3 text-sm text-ink-3">
            Next: <b className="text-ink">{upcoming[0].date}{upcoming[0].time ? ` · ${upcoming[0].time}` : ''}</b>{upcoming[0].type ? ` · ${upcoming[0].type}` : ''}
          </div>
        )}
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="Date"><Input type="date" value={appt.date} onChange={(e) => setAppt({ ...appt, date: e.target.value })} /></Field>
          <Field label="Time"><Input type="time" value={appt.time} onChange={(e) => setAppt({ ...appt, time: e.target.value })} /></Field>
          <Field label="Type"><Select value={appt.type} onChange={(e) => setAppt({ ...appt, type: e.target.value })}>
            {['Follow-up', 'Assessment', 'Treatment session', 'Review'].map((t) => <option key={t}>{t}</option>)}
          </Select></Field>
        </div>
        <button className="btn-secondary mt-3" onClick={schedule}><CalendarPlus size={15} /> Add appointment</button>
      </div>
    </Card>
  )
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-line last:border-0">
      {Icon && <Icon size={15} className="text-ink-3 mt-0.5 shrink-0" />}
      <div className="min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-3">{label}</div>
        <div className="text-sm mt-0.5">{value || <span className="text-ink-3/60">—</span>}</div>
      </div>
    </div>
  )
}

export default function PatientProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { patients, therapists, logs, programs, assessments, aclState } = useData()
  const [tab, setTab] = useState('Overview')
  const [portalOpen, setPortalOpen] = useState(false)
  const [notes, setNotes] = useState([
    { date: '2026-06-09', author: 'Omar Haddad', text: 'Reviewed home program technique — corrected squat depth and tempo. Patient motivated.' },
    { date: '2026-06-02', author: 'Omar Haddad', text: 'Session focused on single-leg control; mild fatigue valgus noted at rep 8+. Added lateral band walks.' },
  ])
  const [draft, setDraft] = useState('')

  const p = patients.find((x) => x.id === id)
  const plogs = useMemo(() => logs.filter((l) => l.patientId === id), [logs, id])
  if (!p) return <EmptyState title="Patient not found" sub="This record may have been removed." action={<Link className="btn-secondary" to="/app/patients">Back to patients</Link>} />

  const t = therapists.find((x) => x.id === p.therapistId)
  const program = programs[p.id]
  const assessment = assessments[p.id]
  const acl = aclState[p.id]
  const painData = plogs.map((l) => ({ x: l.date.slice(5), pain: l.pain }))
  const funcData = plogs.map((l) => ({ x: l.date.slice(5), fn: l.function }))

  return (
    <div className="space-y-5 fade-up">
      <PortalAccessModal open={portalOpen} onClose={() => setPortalOpen(false)} patient={p} />
      <button onClick={() => navigate('/app/patients')} className="btn-ghost -ml-2"><ArrowLeft size={16} /> Patients</button>

      {/* header */}
      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start gap-4">
          <Avatar name={p.name} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display font-bold text-xl">{p.name}</h1>
              <StatusBadge status={p.status} />
              {p.isACL && <Badge color="teal"><GitBranch size={12} /> ACL program</Badge>}
            </div>
            <div className="text-sm text-ink-3 mt-1">{p.code} · {p.age} y · {p.gender} · {t?.name}</div>
            <div className="text-sm mt-1.5 text-ink-2">{p.diagnosis}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn-secondary" onClick={() => setPortalOpen(true)}>
              <KeyRound size={15} /> {p.authUserId ? 'Manage portal access' : 'Generate portal access'}
            </button>
            <Link to="/app/assessment" className="btn-secondary"><ClipboardList size={15} /> New assessment</Link>
            <Link to="/app/exercises" className="btn-primary"><Dumbbell size={15} /> Exercise plan</Link>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          {[
            ['Current pain', <PainBadge key="p" score={p.painNow} />],
            ['Adherence', `${p.adherence}%`],
            ['Frequency', p.frequency],
            ['Last visit', p.lastVisit],
          ].map(([l, v]) => (
            <div key={l} className="rounded-xl bg-canvas p-3">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-3">{l}</div>
              <div className="font-display font-semibold mt-1">{v}</div>
            </div>
          ))}
        </div>
      </Card>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'Overview' && (
        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="p-5">
            <h3 className="font-display font-semibold mb-2">Demographics & contact</h3>
            <InfoRow icon={Phone} label="Phone" value={p.phone} />
            <InfoRow icon={Mail} label="Email" value={p.email} />
            <InfoRow icon={Briefcase} label="Occupation" value={p.occupation} />
            <InfoRow icon={Dumbbell} label="Sport / activity level" value={p.activity} />
          </Card>
          <Card className="p-5">
            <h3 className="font-display font-semibold mb-2">Clinical picture</h3>
            <InfoRow label="Main complaint" value={p.complaint} />
            <InfoRow label="Current diagnosis" value={p.diagnosis} />
            <InfoRow label="Medical history" value={p.history} />
            <InfoRow label="Surgical history" value={p.surgical} />
            <InfoRow label="Medications" value={p.medications} />
          </Card>
          <Card className="p-5">
            <h3 className="font-display font-semibold mb-2">Plan & risk</h3>
            <InfoRow label="Goals" value={p.goals} />
            <InfoRow icon={Flag} label="Red flags" value={p.redFlags} />
            <InfoRow label="Treatment frequency" value={p.frequency} />
            <InfoRow label="Progress summary" value={p.progress} />
          </Card>
          <div className="lg:col-span-3"><PortalInfoCard patient={p} /></div>
        </div>
      )}

      {tab === 'Assessment' && (
        assessment ? (
          <Card className="p-5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-display font-semibold">Latest assessment</h3>
              <Badge color={assessment.status === 'complete' ? 'green' : 'amber'}>{assessment.status === 'complete' ? 'Completed' : 'Draft'}</Badge>
            </div>
            <dl className="grid sm:grid-cols-2 gap-x-8 mt-3">
              {[
                ['Provisional diagnosis', assessment.form.provDx], ['Body region', assessment.form.region],
                ['Mechanism', assessment.form.mechanism], ['Pain (NPRS)', assessment.form.nprs != null ? `${assessment.form.nprs}/10` : null],
                ['Irritability', assessment.form.irritability], ['Short-term goals', assessment.form.stGoals],
              ].filter(([, v]) => v).map(([l, v]) => <div key={l} className="py-2 border-b border-line"><dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-3">{l}</dt><dd className="text-sm mt-0.5">{v}</dd></div>)}
            </dl>
            <Link to="/app/assessment" className="btn-secondary mt-4">Open assessment form</Link>
          </Card>
        ) : (
          <Card><EmptyState icon={ClipboardList} title="No assessment on file"
            sub={`Run a structured intake and evaluation for ${p.name.split(' ')[0]} — the summary will appear here.`}
            action={<Link to="/app/assessment" className="btn-primary">Start assessment</Link>} /></Card>
        )
      )}

      {tab === 'Exercises' && (
        program?.items?.length ? (
          <Card className="p-5">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <h3 className="font-display font-semibold">Assigned home program</h3>
              <Badge color="teal">{program.items.length} exercises</Badge>
            </div>
            <div className="space-y-2">
              {program.items.map((it, i) => (
                <div key={i} className="flex flex-wrap items-center gap-3 rounded-xl border border-line p-3">
                  <span className="h-7 w-7 rounded-lg bg-teal-50 text-teal-700 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{it.name}</div>
                    <div className="text-xs text-ink-3">{it.section} · {it.sets}×{it.reps}{it.hold ? ` · ${it.hold}s hold` : ''} · {it.frequency}</div>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/app/exercises" className="btn-secondary mt-4">Edit in program builder</Link>
          </Card>
        ) : (
          <Card><EmptyState icon={Dumbbell} title="No home program assigned"
            sub="Build a plan in the exercise library and assign it to this patient."
            action={<Link to="/app/exercises" className="btn-primary">Open program builder</Link>} /></Card>
        )
      )}

      {tab === 'Symptoms' && (
        plogs.length ? (
          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader title="Pain over time" sub="Daily patient-reported score" />
              <div className="px-3 pb-4"><TrendLine data={painData} lines={[{ key: 'pain', name: 'Pain' }]} yDomain={[0, 10]} height={210} /></div>
            </Card>
            <Card>
              <CardHeader title="Function level" sub="Self-rated 0–10" />
              <div className="px-3 pb-4"><TrendArea data={funcData} dataKey="fn" name="Function" height={210} /></div>
            </Card>
            <Card className="lg:col-span-2">
              <CardHeader title="Recent notes from the patient" />
              <div className="px-5 pb-5 space-y-2">
                {plogs.filter((l) => l.note).slice(-5).reverse().map((l) => (
                  <div key={l.id} className="flex gap-3 text-sm rounded-xl bg-canvas p-3">
                    <span className="text-xs text-ink-3 shrink-0 w-20">{l.date}</span> {l.note}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        ) : (
          <Card><EmptyState icon={Activity} title="No symptom logs yet"
            sub="Give the patient portal access so daily logging can begin — trends will appear here."
            action={<button className="btn-primary" onClick={() => setPortalOpen(true)}><KeyRound size={15} /> Generate portal access</button>} /></Card>
        )
      )}

      {tab === 'Progress' && (
        <div className="grid lg:grid-cols-3 gap-4">
          <Card className="p-5 lg:col-span-2">
            <h3 className="font-display font-semibold">Progress summary</h3>
            <p className="text-sm text-ink-2 mt-2 leading-relaxed">{p.progress}</p>
            <div className="mt-5 space-y-4">
              {[['Exercise adherence', p.adherence, 'bg-teal-600'],
                ['Pain reduction vs intake', Math.max(5, 100 - p.painNow * 10), 'bg-emerald-500'],
                ...(acl ? [[`ACL phase ${acl.currentPhase} completion`, acl.phaseCompletion, 'bg-ink']] : []),
              ].map(([l, v, c]) => (
                <div key={l}>
                  <div className="flex justify-between text-sm mb-1.5"><span className="font-medium">{l}</span><span className="text-ink-3">{v}%</span></div>
                  <ProgressBar value={v} color={c} />
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="font-display font-semibold">Milestones</h3>
            {acl ? (
              <ul className="mt-3 space-y-2 text-sm">
                <li className="flex justify-between"><span>Knee flexion</span><b>{acl.rom.flexion}° / {acl.rom.target}°</b></li>
                <li className="flex justify-between"><span>Extension</span><b>{acl.rom.extension}°</b></li>
                <li className="flex justify-between"><span>Quad index</span><b>{acl.quadIndex}%</b></li>
                <li className="flex justify-between"><span>Psych readiness</span><b>{acl.psychReadiness}/100</b></li>
                <Link to="/app/acl" className="btn-secondary w-full mt-3">Open ACL timeline</Link>
              </ul>
            ) : (
              <p className="text-sm text-ink-3 mt-2">Goal-based milestones are tracked in session notes for this condition.</p>
            )}
          </Card>
        </div>
      )}

      {tab === 'Notes' && (
        <Card className="p-5">
          <h3 className="font-display font-semibold mb-3">Clinical notes</h3>
          <div className="flex gap-2 mb-5">
            <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={`Add a session note for ${p.name.split(' ')[0]}…`} className="input min-h-[64px]" />
          </div>
          <button className="btn-primary mb-6" onClick={() => {
            if (!draft.trim()) return
            setNotes([{ date: new Date().toISOString().slice(0, 10), author: t?.name || 'You', text: draft.trim() }, ...notes])
            setDraft(''); toast('Note added')
          }}><Plus size={15} /> Add note</button>
          <div className="space-y-3">
            {notes.map((n, i) => (
              <div key={i} className="rounded-xl border border-line p-4">
                <div className="flex items-center gap-2 text-xs text-ink-3"><StickyNote size={13} /> {n.author} · {n.date}</div>
                <p className="text-sm mt-2 leading-relaxed">{n.text}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
