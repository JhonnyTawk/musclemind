import { useState } from 'react'
import { Building2, UserCircle2, Users, ClipboardList, Bell, FileText, Save, Plus, Trash2 } from 'lucide-react'
import { useAuth, useData, useToast } from '../context/app'
import { Card, CardHeader, Field, Input, Select, Toggle, Avatar, Badge } from '../components/ui'

export default function SettingsPage() {
  const { settings, setSettings, therapists, addTherapist, deleteTherapist } = useData()
  const { user, supabaseConfigured } = useAuth()
  const toast = useToast()
  const [s, setS] = useState(settings)
  const set = (k) => (e) => setS({ ...s, [k]: e.target?.value ?? e })
  const [newT, setNewT] = useState({ name: '', title: '' })

  const save = () => { setSettings(s); toast('Settings saved') }
  const addTeamMember = async () => {
    if (!newT.name.trim()) { toast('Enter a name', 'error'); return }
    await addTherapist(newT.name.trim(), newT.title.trim())
    setNewT({ name: '', title: '' })
    toast('Therapist added')
  }

  return (
    <div className="space-y-5 fade-up max-w-3xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl">Settings</h1>
          <p className="text-sm text-ink-3 mt-1">Clinic preferences, templates and notifications.</p>
        </div>
        <Badge color={supabaseConfigured ? 'green' : 'amber'}>{supabaseConfigured ? 'Supabase connected' : 'Demo mode — data is session-only'}</Badge>
      </div>

      <Card>
        <CardHeader title="Clinic" right={<Building2 size={18} className="text-ink-3" />} />
        <div className="px-5 pb-5 grid sm:grid-cols-2 gap-4">
          <Field label="Clinic name"><Input value={s.clinicName} onChange={set('clinicName')} /></Field>
          <Field label="Logo initials" hint="Shown on reports and the patient portal">
            <div className="flex items-center gap-3">
              <Input value={s.logoInitials} onChange={set('logoInitials')} maxLength={3} className="input w-24" />
              <div className="h-10 w-10 rounded-xl bg-teal-600 text-white font-display font-bold flex items-center justify-center">{s.logoInitials || 'MM'}</div>
            </div>
          </Field>
        </div>
      </Card>

      <Card>
        <CardHeader title="Your profile" right={<UserCircle2 size={18} className="text-ink-3" />} />
        <div className="px-5 pb-5">
          <div className="flex items-center gap-4">
            <Avatar name={user?.name} size="lg" />
            <div>
              <div className="font-semibold">{user?.name}</div>
              <div className="text-sm text-ink-3">{user?.title} · {user?.role === 'admin' ? 'Administrator' : 'Therapist'}</div>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Clinic team" sub="Therapists patients can be assigned to" right={<Users size={18} className="text-ink-3" />} />
        <div className="px-5 pb-5">
          <div className="space-y-2">
            {therapists.length === 0 && <p className="text-sm text-ink-3">No therapists yet — add one below.</p>}
            {therapists.map((t) => (
              <div key={t.id} className="flex items-center gap-3 text-sm rounded-xl bg-canvas p-3">
                <Avatar name={t.name} size="sm" />
                <div className="min-w-0">
                  <div className="font-medium">{t.name}</div>
                  {t.title && <div className="text-xs text-ink-3">{t.title}</div>}
                </div>
                <button onClick={() => deleteTherapist(t.id)} aria-label={`Remove ${t.name}`}
                  className="btn-ghost p-2 rounded-lg ml-auto text-ink-3 hover:text-danger hover:bg-red-50">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
          <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-2 mt-4 items-end">
            <Field label="Name"><Input value={newT.name} onChange={(e) => setNewT({ ...newT, name: e.target.value })} placeholder="e.g. Omar Haddad" /></Field>
            <Field label="Title"><Input value={newT.title} onChange={(e) => setNewT({ ...newT, title: e.target.value })} placeholder="e.g. Sports Physiotherapist" /></Field>
            <button className="btn-primary h-[42px]" onClick={addTeamMember}><Plus size={15} /> Add</button>
          </div>
          <p className="text-xs text-ink-3 mt-3">
            This list is for assigning patients. To give a therapist their own <b>login</b>, add them
            as a user in Supabase (Authentication → Users) — see SETUP.md.
          </p>
        </div>
      </Card>

      <Card>
        <CardHeader title="Templates & library" right={<ClipboardList size={18} className="text-ink-3" />} />
        <div className="px-5 pb-5 grid sm:grid-cols-2 gap-4">
          <Field label="Default assessment template">
            <Select value={s.defaultTemplate} onChange={set('defaultTemplate')}>
              <option>Orthopedic intake (full)</option><option>Sports screening (short)</option><option>Post-op protocol</option><option>Spine-focused intake</option>
            </Select>
          </Field>
          <Field label="Exercise library visibility">
            <Select value={s.libraryVisibility} onChange={set('libraryVisibility')}>
              <option>All therapists</option><option>Admins only</option><option>Per-therapist libraries</option>
            </Select>
          </Field>
        </div>
      </Card>

      <Card>
        <CardHeader title="Notifications" right={<Bell size={18} className="text-ink-3" />} />
        <div className="px-5 pb-5 space-y-3.5">
          <Toggle checked={s.notifPainAlerts} onChange={(v) => setS({ ...s, notifPainAlerts: v })} label="Alert when a patient's pain rises 3 days in a row" />
          <Toggle checked={s.notifMissedSessions} onChange={(v) => setS({ ...s, notifMissedSessions: v })} label="Alert when exercise sessions are missed 3+ times a week" />
          <Toggle checked={s.notifRedFlags} onChange={(v) => setS({ ...s, notifRedFlags: v })} label="Immediate alert on red-flag symptom answers" />
          <Toggle checked={s.notifWeeklyDigest} onChange={(v) => setS({ ...s, notifWeeklyDigest: v })} label="Weekly caseload digest by email" />
        </div>
      </Card>

      <Card>
        <CardHeader title="Reports" right={<FileText size={18} className="text-ink-3" />} />
        <div className="px-5 pb-5 space-y-3.5">
          <Toggle checked={s.reportLetterhead} onChange={(v) => setS({ ...s, reportLetterhead: v })} label="Include clinic letterhead on exported documents" />
          <Toggle checked={s.reportSignature} onChange={(v) => setS({ ...s, reportSignature: v })} label="Include therapist signature block" />
        </div>
      </Card>

      <button className="btn-primary" onClick={save}><Save size={15} /> Save settings</button>
    </div>
  )
}
