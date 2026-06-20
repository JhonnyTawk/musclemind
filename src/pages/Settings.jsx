import { useState } from 'react'
import { Building2, UserCircle2, Palette, ClipboardList, Dumbbell, Bell, FileText, Save } from 'lucide-react'
import { useAuth, useData, useToast } from '../context/app'
import { Card, CardHeader, Field, Input, Select, Toggle, Avatar, Badge } from '../components/ui'

export default function SettingsPage() {
  const { settings, setSettings, therapists } = useData()
  const { user, supabaseConfigured } = useAuth()
  const toast = useToast()
  const [s, setS] = useState(settings)
  const set = (k) => (e) => setS({ ...s, [k]: e.target?.value ?? e })

  const save = () => { setSettings(s); toast('Settings saved') }

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
        <CardHeader title="Therapist profile" right={<UserCircle2 size={18} className="text-ink-3" />} />
        <div className="px-5 pb-5">
          <div className="flex items-center gap-4 mb-5">
            <Avatar name={user?.name} size="lg" />
            <div>
              <div className="font-semibold">{user?.name}</div>
              <div className="text-sm text-ink-3">{user?.title} · {user?.role === 'admin' ? 'Administrator' : 'Therapist'}</div>
            </div>
          </div>
          <div className="rounded-xl bg-canvas p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-ink-3 mb-2.5">Clinic team</div>
            <div className="space-y-2">
              {therapists.map((t) => (
                <div key={t.id} className="flex items-center gap-3 text-sm">
                  <Avatar name={t.name} size="sm" />
                  <span className="font-medium">{t.name}</span>
                  <span className="text-ink-3">{t.title}</span>
                  <Badge color={t.role === 'admin' ? 'teal' : 'slate'} className="ml-auto">{t.role}</Badge>
                </div>
              ))}
            </div>
          </div>
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
