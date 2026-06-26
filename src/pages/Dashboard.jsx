import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Users, ClipboardList, CalendarClock, CheckCircle2, Dumbbell, Activity,
  GitBranch, AlertTriangle, ArrowRight, X, CalendarDays,
} from 'lucide-react'
import { useData } from '../context/app'
import { Card, CardHeader, Stat, Badge, Avatar, PainBadge, ProgressBar, EmptyState } from '../components/ui'
import { Bars, Donut, TrendLine, Gauge } from '../components/charts'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const weekdayIndex = (dateStr) => { const wd = new Date(dateStr).getDay(); return Number.isNaN(wd) ? -1 : (wd + 6) % 7 }
const daysAgoStr = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10) }

export default function Dashboard() {
  const { patients, alerts, appointments, followups, logs, dismissAlert } = useData()
  const navigate = useNavigate()
  const today = new Date().toISOString().slice(0, 10)

  const active = patients.filter((p) => p.status === 'Active')
  const completed = patients.filter((p) => p.status === 'Discharged')
  const avgAdherence = Math.round(active.reduce((s, p) => s + (p.adherence || 0), 0) / Math.max(1, active.length))
  const lowAdherence = active.filter((p) => (p.adherence || 0) < 65).length

  const todaysAppointments = useMemo(
    () => appointments.filter((a) => a.date === today).sort((a, b) => (a.time || '').localeCompare(b.time || '')),
    [appointments, today],
  )

  // clinic-wide average pain over last 14 days (real logs)
  const painTrend = useMemo(() => {
    const byDate = {}
    logs.forEach((l) => { (byDate[l.date] ||= []).push(l.pain) })
    return Object.keys(byDate).sort().slice(-14).map((d) => ({
      x: d.slice(5), pain: +(byDate[d].reduce((a, b) => a + b, 0) / byDate[d].length).toFixed(1),
    }))
  }, [logs])

  // caseload by condition, derived from each patient's diagnosis/complaint
  const conditionsDist = useMemo(() => {
    const buckets = { 'ACL / knee': 0, 'Low back': 0, 'Shoulder': 0, 'Neck / posture': 0, 'Ankle / foot': 0, 'Other': 0 }
    active.forEach((p) => {
      const d = `${p.diagnosis || ''} ${p.complaint || ''}`.toLowerCase()
      if (/acl|knee|patell|meniscus/.test(d)) buckets['ACL / knee']++
      else if (/back|lumbar|spine|disc|sciatic/.test(d)) buckets['Low back']++
      else if (/shoulder|rotator|subacromial|capsulit/.test(d)) buckets['Shoulder']++
      else if (/neck|cervical|posture|headache/.test(d)) buckets['Neck / posture']++
      else if (/ankle|foot|achilles|calf|plantar/.test(d)) buckets['Ankle / foot']++
      else buckets['Other']++
    })
    return Object.entries(buckets).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }))
  }, [active])

  // patients grouped by their current rehab phase
  const phaseDist = useMemo(() => {
    const counts = {}
    patients.forEach((p) => { if (p.rehabPhase) counts[p.rehabPhase] = (counts[p.rehabPhase] || 0) + 1 })
    return Object.keys(counts).sort().map((ph) => ({ phase: `P${ph}`, count: counts[ph] }))
  }, [patients])

  // clinic sessions (appointments) and home logs over the last 7 days, by weekday
  const weeklyActivity = useMemo(() => {
    const cut = daysAgoStr(6)
    const base = WEEKDAYS.map((day) => ({ day, sessions: 0, logs: 0 }))
    logs.forEach((l) => { if (l.date >= cut) { const i = weekdayIndex(l.date); if (i >= 0) base[i].logs++ } })
    appointments.forEach((a) => { if (a.date >= cut) { const i = weekdayIndex(a.date); if (i >= 0) base[i].sessions++ } })
    return base
  }, [logs, appointments])

  const quick = [
    { icon: ClipboardList, label: 'New assessment', to: '/app/assessment' },
    { icon: Dumbbell, label: 'Create exercise plan', to: '/app/exercises' },
    { icon: Activity, label: 'Track symptoms', to: '/app/symptoms' },
    { icon: CalendarDays, label: 'Appointments', to: '/app/appointments' },
  ]

  return (
    <div className="space-y-6 fade-up">
      <div>
        <h1 className="font-display font-bold text-2xl">Good morning 👋</h1>
        <p className="text-sm text-ink-3 mt-1">Here's what's happening across the clinic today.</p>
      </div>

      {/* stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Stat icon={Users} label="Total patients" value={patients.length} />
        <Stat icon={ClipboardList} label="Active treatment plans" value={active.length} tone="teal" />
        <Stat icon={CalendarClock} label="Needing follow-up" value={followups.length} tone="amber" />
        <Stat icon={CheckCircle2} label="Completed programs" value={completed.length} tone="green" />
        <Stat icon={CalendarDays} label="Today's appointments" value={todaysAppointments.length} />
      </div>

      {/* quick actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quick.map(({ icon: Icon, label, to }) => (
          <Link key={to} to={to} className="card p-4 flex items-center gap-3 hover:shadow-pop hover:border-teal-200 transition group">
            <div className="h-10 w-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-colors shrink-0">
              <Icon size={18} />
            </div>
            <span className="text-sm font-semibold">{label}</span>
            <ArrowRight size={15} className="ml-auto text-ink-3/40 group-hover:text-teal-600 transition-colors" />
          </Link>
        ))}
      </div>

      {/* charts row 1 */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader title="Weekly patient activity" sub="Clinic sessions and home symptom logs" />
          <div className="px-3 pb-4">
            <Bars data={weeklyActivity} xKey="day" bars={[{ key: 'sessions', name: 'Clinic sessions' }, { key: 'logs', name: 'Symptom logs', color: '#7CC4BE' }]} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Most common conditions" sub="Current caseload" />
          <div className="px-3 pb-4"><Donut data={conditionsDist} /></div>
        </Card>
      </div>

      {/* charts row 2 */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader title="Pain trend overview" sub="Average reported pain · last 14 days" />
          <div className="px-3 pb-4"><TrendLine data={painTrend} lines={[{ key: 'pain', name: 'Avg pain' }]} yDomain={[0, 10]} height={190} /></div>
        </Card>
        <Card>
          <CardHeader title="Exercise adherence" sub="Active patients · this month" />
          <div className="px-3 pb-2"><Gauge value={avgAdherence} label="average adherence" /></div>
          <p className="px-5 pb-4 text-xs text-ink-3">
            {lowAdherence > 0 ? `${lowAdherence} active patient${lowAdherence > 1 ? 's' : ''} below 65% — check alerts.` : 'All active patients above 65%.'}
          </p>
        </Card>
        <Card>
          <CardHeader title="Rehab phase distribution" sub="Patients in phased programs" />
          <div className="px-3 pb-4">
            <Bars data={phaseDist} xKey="phase" bars={[{ key: 'count', name: 'Patients' }]} height={190} />
          </div>
        </Card>
      </div>

      {/* lists */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader title="Recent patients" right={<Link to="/app/patients" className="text-xs font-semibold text-teal-700 hover:underline">View all</Link>} />
          <div>
            {[...patients].sort((a, b) => b.lastVisit.localeCompare(a.lastVisit)).slice(0, 5).map((p) => (
              <button key={p.id} onClick={() => navigate(`/app/patients/${p.id}`)}
                className="w-full flex items-center gap-3 px-5 py-3 hover:bg-teal-50/50 border-t border-line text-left">
                <Avatar name={p.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{p.name}</div>
                  <div className="text-xs text-ink-3 truncate">{p.diagnosis}</div>
                </div>
                <div className="text-right shrink-0">
                  <PainBadge score={p.painNow} />
                  <div className="text-[11px] text-ink-3 mt-1">{p.lastVisit}</div>
                </div>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Today's appointments" sub={new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })} />
          <div>
            {todaysAppointments.length === 0 && <p className="px-5 py-6 text-sm text-ink-3 text-center">No appointments scheduled for today.</p>}
            {todaysAppointments.map((a) => {
              const p = patients.find((x) => x.id === a.patientId)
              return (
                <button key={a.id} onClick={() => navigate(`/app/patients/${a.patientId}`)}
                  className="w-full flex items-center gap-3 px-5 py-3 hover:bg-teal-50/50 border-t border-line text-left">
                  <div className="text-sm font-display font-semibold text-teal-700 w-12 shrink-0">{a.time}</div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{p?.name}</div>
                    <div className="text-xs text-ink-3 truncate">{a.type}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Upcoming follow-ups" />
            <div>
              {followups.map((f) => {
                const p = patients.find((x) => x.id === f.patientId)
                return (
                  <button key={f.id} onClick={() => navigate(`/app/patients/${f.patientId}`)}
                    className="w-full px-5 py-3 hover:bg-teal-50/50 border-t border-line text-left">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{p?.name}</span>
                      <span className="text-[11px] text-ink-3">{f.due}</span>
                    </div>
                    <div className="text-xs text-ink-3 mt-0.5">{f.reason}</div>
                  </button>
                )
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* alerts */}
      <Card>
        <CardHeader title="Symptom alerts" sub="Automatic flags from patient logs and clinical rules"
          right={<Badge color={alerts.some((a) => a.severity === 'high') ? 'red' : 'amber'}>{alerts.length} active</Badge>} />
        {alerts.length === 0 ? (
          <EmptyState icon={CheckCircle2} title="No active alerts" sub="When a patient's symptoms or adherence flag a rule, it will appear here." />
        ) : (
          <div className="px-5 pb-5 space-y-2">
            {alerts.map((a) => {
              const p = patients.find((x) => x.id === a.patientId)
              return (
                <div key={a.id} className={`flex items-start gap-3 rounded-xl border p-3.5 ${
                  a.severity === 'high' ? 'bg-red-50/60 border-red-100' : a.severity === 'medium' ? 'bg-amber-50/60 border-amber-100' : 'bg-canvas border-line'}`}>
                  <AlertTriangle size={17} className={`mt-0.5 shrink-0 ${a.severity === 'high' ? 'text-danger' : a.severity === 'medium' ? 'text-amber2' : 'text-ink-3'}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link to={`/app/patients/${a.patientId}`} className="text-sm font-semibold hover:underline">{p?.name}</Link>
                      <Badge color={a.severity === 'high' ? 'red' : a.severity === 'medium' ? 'amber' : 'slate'}>{a.kind}</Badge>
                      <span className="text-[11px] text-ink-3 ml-auto">{a.date}</span>
                    </div>
                    <p className="text-sm text-ink-2 mt-1">{a.text}</p>
                  </div>
                  <button className="btn-ghost p-1.5" aria-label="Dismiss alert" onClick={() => dismissAlert(a.id)}><X size={15} /></button>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
