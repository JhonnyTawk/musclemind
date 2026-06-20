import { useMemo, useState } from 'react'
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2, Activity,
  PlusCircle, Smile, Moon, Battery, Gauge as GaugeIcon, ShieldCheck, PersonStanding,
} from 'lucide-react'
import { useData, useToast } from '../context/app'
import { Card, CardHeader, Badge, Tabs, Select, Field, Textarea, Scale10, Modal, EmptyState } from '../components/ui'
import { TrendLine, TrendArea, Bars } from '../components/charts'

const RANGES = [7, 14, 30, 90]
const METRICS = [
  ['pain', 'Pain', AlertTriangle], ['stiffness', 'Stiffness', GaugeIcon], ['swelling', 'Swelling', Activity],
  ['sleep', 'Sleep quality', Moon], ['fatigue', 'Fatigue', Battery], ['function', 'Function level', TrendingUp],
  ['confidence', 'Confidence in movement', ShieldCheck], ['mood', 'Mood', Smile],
]
const BODY_AREAS = ['Knee', 'Shoulder', 'Low back', 'Neck', 'Hip', 'Ankle', 'Other']

const heatColor = (v) => v == null ? '#F1F5F5' : v <= 2 ? '#D6EDEA' : v <= 4 ? '#7CC4BE' : v <= 6 ? '#F6C453' : v <= 8 ? '#E8853D' : '#DC2626'

function buildInsights(rows, adherencePct) {
  const out = []
  const last3 = rows.slice(-3).map((r) => r.pain)
  if (last3.length === 3 && last3[0] < last3[1] && last3[1] < last3[2])
    out.push({ tone: 'red', icon: AlertTriangle, text: `Pain rising for 3 consecutive days (${last3.join(' → ')}).` })
  if (adherencePct < 65) out.push({ tone: 'amber', icon: AlertTriangle, text: `Low adherence this week (${adherencePct}% of sessions completed).` })
  const half = Math.floor(rows.length / 2)
  const avg = (arr, k) => arr.reduce((s, r) => s + r[k], 0) / Math.max(1, arr.length)
  const sw1 = avg(rows.slice(0, half), 'swelling'), sw2 = avg(rows.slice(half), 'swelling')
  if (sw2 - sw1 > 0.7) out.push({ tone: 'amber', icon: Activity, text: 'Swelling increased after recent activity — review load.' })
  const fn1 = avg(rows.slice(0, half), 'function'), fn2 = avg(rows.slice(half), 'function')
  if (fn2 - fn1 > 0.8) out.push({ tone: 'green', icon: CheckCircle2, text: `Good improvement in function (avg ${fn1.toFixed(1)} → ${fn2.toFixed(1)}).` })
  else if (Math.abs(fn2 - fn1) < 0.3 && rows.length >= 14) out.push({ tone: 'slate', icon: Minus, text: 'Plateau in recovery — function unchanged across the period. Consider progressing the program.' })
  const p1 = avg(rows.slice(0, half), 'pain'), p2 = avg(rows.slice(half), 'pain')
  if (p1 - p2 > 1) out.push({ tone: 'green', icon: TrendingDown, text: `Pain trending down (avg ${p1.toFixed(1)} → ${p2.toFixed(1)}).` })
  return out
}

/* ----------------------- posture submodule ----------------------- */
const SEVERITY_RANK = { Resolved: 0, None: 0, Neutral: 0, Mild: 1, Moderate: 2, Marked: 3 }
const rank = (v) => {
  const key = Object.keys(SEVERITY_RANK).find((k) => (v || '').startsWith(k))
  return key !== undefined ? SEVERITY_RANK[key] : 1.5
}

function PostureModule({ patientId }) {
  const { postureLogs } = useData()
  const stages = postureLogs[patientId]
  if (!stages) return (
    <Card><EmptyState icon={PersonStanding} title="No posture observations recorded"
      sub="Posture and movement logs from assessments will appear here for comparison across the program." /></Card>
  )
  const items = Object.keys(stages[0].findings)
  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <CardHeader title="Posture & movement comparison" sub="Initial → mid-program → latest review" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead><tr><th className="th">Observation</th>{stages.map((s) => <th key={s.stage} className="th">{s.stage}<span className="block font-normal normal-case text-[10px]">{s.date}</span></th>)}<th className="th">Trend</th></tr></thead>
            <tbody>
              {items.map((item) => {
                const first = stages[0].findings[item], last = stages[stages.length - 1].findings[item]
                const d = rank(first) - rank(last)
                return (
                  <tr key={item}>
                    <td className="td font-medium">{item}</td>
                    {stages.map((s) => {
                      const v = s.findings[item]
                      const r = rank(v)
                      return <td key={s.stage} className="td">
                        <Badge color={r === 0 ? 'green' : r === 1 ? 'teal' : r === 2 ? 'amber' : 'red'}>{v}</Badge>
                      </td>
                    })}
                    <td className="td">
                      {d > 0 ? <Badge color="green"><TrendingDown size={12} /> Improved</Badge>
                        : d < 0 ? <Badge color="red"><TrendingUp size={12} /> Worse</Badge>
                        : <Badge color="slate"><Minus size={12} /> Stable</Badge>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
      <div className="grid md:grid-cols-3 gap-4">
        {stages.map((s) => (
          <Card key={s.stage} className="p-4">
            <div className="flex items-center justify-between"><span className="font-display font-semibold text-sm">{s.stage}</span><span className="text-xs text-ink-3">{s.date}</span></div>
            <p className="text-sm text-ink-2 mt-2 leading-relaxed">{s.note}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}

/* ----------------------------- page ----------------------------- */
export default function Symptoms() {
  const { patients, logs, addLog } = useData()
  const toast = useToast()
  const tracked = patients.filter((p) => logs.some((l) => l.patientId === p.id))
  const [patientId, setPatientId] = useState(tracked[0]?.id || patients[0]?.id)
  const [range, setRange] = useState(30)
  const [tab, setTab] = useState('Trends')
  const [logOpen, setLogOpen] = useState(false)
  const [entry, setEntry] = useState({ pain: 3, stiffness: 3, swelling: 1, sleep: 7, fatigue: 3, function: 6, confidence: 6, mood: 7, exercisesDone: true, bodyArea: 'Knee', note: '' })

  const patient = patients.find((p) => p.id === patientId)
  const rows = useMemo(() => logs.filter((l) => l.patientId === patientId).slice(-range), [logs, patientId, range])
  const adherencePct = Math.round((rows.slice(-7).filter((r) => r.exercisesDone).length / Math.max(1, Math.min(7, rows.length))) * 100)
  const insights = useMemo(() => buildInsights(rows, adherencePct), [rows, adherencePct])

  const chart = (keys) => rows.map((r) => ({ x: r.date.slice(5), ...Object.fromEntries(keys.map((k) => [k, r[k]])) }))
  const adherenceWeekly = useMemo(() => {
    const weeks = {}
    rows.forEach((r, i) => { const w = `W${Math.floor(i / 7) + 1}`; (weeks[w] ||= { done: 0, total: 0 }); weeks[w].total++; if (r.exercisesDone) weeks[w].done++ })
    return Object.entries(weeks).map(([x, v]) => ({ x, pct: Math.round((v.done / v.total) * 100) }))
  }, [rows])

  const submitLog = async () => {
    await addLog({ patientId, ...entry })
    setLogOpen(false)
    toast(`Daily log saved for ${patient?.name}`)
  }

  return (
    <div className="space-y-5 fade-up">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl">Symptom tracker</h1>
          <p className="text-sm text-ink-3 mt-1">Daily patient logs, trends and automatic flags.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select className="input w-52" value={patientId} onChange={(e) => setPatientId(e.target.value)}>
            {patients.filter((p) => p.status === 'Active').map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
          <div className="flex rounded-xl border border-line overflow-hidden">
            {RANGES.map((r) => (
              <button key={r} onClick={() => setRange(r)}
                className={`px-3 py-2 text-xs font-semibold transition-colors ${range === r ? 'bg-teal-600 text-white' : 'bg-white text-ink-3 hover:bg-teal-50'}`}>
                {r}d
              </button>
            ))}
          </div>
          <button className="btn-primary" onClick={() => setLogOpen(true)}><PlusCircle size={16} /> New log</button>
        </div>
      </div>

      <Tabs tabs={['Trends', 'Heatmap', 'Posture & movement']} active={tab} onChange={setTab} />

      {tab === 'Trends' && rows.length === 0 && (
        <Card><EmptyState icon={Activity} title="No logs in this period"
          sub={`${patient?.name} hasn't logged symptoms in the selected window. Share their patient link or add a log from a session.`}
          action={<button className="btn-primary" onClick={() => setLogOpen(true)}>Add first log</button>} /></Card>
      )}

      {tab === 'Trends' && rows.length > 0 && (
        <>
          {/* insights */}
          <div className="grid sm:grid-cols-2 gap-3">
            {insights.length === 0 && (
              <Card className="p-4 flex items-center gap-3 text-sm"><CheckCircle2 size={18} className="text-ok" /> Nothing flagged in this period — symptoms are tracking as expected.</Card>
            )}
            {insights.map((ins, i) => (
              <div key={i} className={`flex items-start gap-3 rounded-2xl border p-4 text-sm ${
                ins.tone === 'red' ? 'bg-red-50/70 border-red-100 text-red-800' :
                ins.tone === 'amber' ? 'bg-amber-50/70 border-amber-100 text-amber-900' :
                ins.tone === 'green' ? 'bg-emerald-50/70 border-emerald-100 text-emerald-800' : 'card text-ink-2'}`}>
                <ins.icon size={17} className="mt-0.5 shrink-0" /> {ins.text}
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader title="Pain & stiffness" sub={`${patient?.name} · last ${range} days`} />
              <div className="px-3 pb-4"><TrendLine data={chart(['pain', 'stiffness'])} lines={[{ key: 'pain', name: 'Pain' }, { key: 'stiffness', name: 'Stiffness', color: '#B45309' }]} yDomain={[0, 10]} /></div>
            </Card>
            <Card>
              <CardHeader title="Functional improvement" sub="Function & confidence, self-rated 0–10" />
              <div className="px-3 pb-4"><TrendLine data={chart(['function', 'confidence'])} lines={[{ key: 'function', name: 'Function' }, { key: 'confidence', name: 'Confidence', color: '#46A8A1' }]} yDomain={[0, 10]} /></div>
            </Card>
            <Card>
              <CardHeader title="Exercise adherence" sub="Share of days the home program was completed" />
              <div className="px-3 pb-4"><Bars data={adherenceWeekly} bars={[{ key: 'pct', name: '% completed' }]} height={200} /></div>
            </Card>
            <Card>
              <CardHeader title="Sleep & fatigue" />
              <div className="px-3 pb-4"><TrendLine data={chart(['sleep', 'fatigue'])} lines={[{ key: 'sleep', name: 'Sleep' }, { key: 'fatigue', name: 'Fatigue', color: '#0F2A33' }]} yDomain={[0, 10]} /></div>
            </Card>
          </div>

          <Card>
            <CardHeader title="Patient notes" sub="Free-text comments attached to daily logs" />
            <div className="px-5 pb-5 grid sm:grid-cols-2 gap-2">
              {rows.filter((r) => r.note).slice(-8).reverse().map((r) => (
                <div key={r.id} className="flex gap-3 text-sm rounded-xl bg-canvas p-3">
                  <span className="text-xs text-ink-3 shrink-0 w-16">{r.date.slice(5)}</span> {r.note}
                </div>
              ))}
              {rows.every((r) => !r.note) && <p className="text-sm text-ink-3">No notes in this period.</p>}
            </div>
          </Card>
        </>
      )}

      {tab === 'Heatmap' && (
        <Card>
          <CardHeader title="Symptom heatmap" sub={`Daily intensity per symptom · last ${Math.min(range, rows.length)} days · darker = worse`} />
          <div className="px-5 pb-5 overflow-x-auto">
            <table className="border-separate" style={{ borderSpacing: 3 }}>
              <thead>
                <tr>
                  <th className="text-left text-xs font-semibold text-ink-3 pr-2">Symptom</th>
                  {rows.map((r) => <th key={r.id} className="text-[9px] font-normal text-ink-3 rotate-0">{r.date.slice(8)}</th>)}
                </tr>
              </thead>
              <tbody>
                {[['pain', 'Pain'], ['stiffness', 'Stiffness'], ['swelling', 'Swelling'], ['fatigue', 'Fatigue']].map(([k, label]) => (
                  <tr key={k}>
                    <td className="text-xs font-medium pr-2 whitespace-nowrap">{label}</td>
                    {rows.map((r) => (
                      <td key={r.id}>
                        <div className="h-5 w-5 rounded-[5px]" style={{ background: heatColor(r[k]) }} title={`${label} ${r[k]}/10 on ${r.date}`} />
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td className="text-xs font-medium pr-2">Exercises</td>
                  {rows.map((r) => (
                    <td key={r.id}><div className={`h-5 w-5 rounded-[5px] ${r.exercisesDone ? 'bg-teal-600' : 'bg-red-200'}`} title={r.exercisesDone ? 'Completed' : 'Missed'} /></td>
                  ))}
                </tr>
              </tbody>
            </table>
            <div className="flex items-center gap-4 mt-4 text-xs text-ink-3">
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-[#D6EDEA]" /> low</span>
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-[#F6C453]" /> moderate</span>
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-[#DC2626]" /> severe</span>
              <span className="flex items-center gap-1.5 ml-4"><span className="h-3 w-3 rounded bg-teal-600" /> exercises done</span>
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-red-200" /> missed</span>
            </div>
          </div>
        </Card>
      )}

      {tab === 'Posture & movement' && <PostureModule patientId={patientId} />}

      {/* logging modal — mirrors what the patient sees in their portal */}
      <Modal open={logOpen} onClose={() => setLogOpen(false)} title={`Daily log — ${patient?.name}`} wide>
        <div className="grid sm:grid-cols-2 gap-5">
          {METRICS.map(([key, label]) => (
            <Field key={key} label={label}>
              <Scale10 value={entry[key]} onChange={(v) => setEntry({ ...entry, [key]: v })} />
            </Field>
          ))}
          <Field label="Body area">
            <Select value={entry.bodyArea} onChange={(e) => setEntry({ ...entry, bodyArea: e.target.value })}>
              {BODY_AREAS.map((b) => <option key={b}>{b}</option>)}
            </Select>
          </Field>
          <Field label="Exercises completed today?">
            <div className="flex gap-2">
              {[true, false].map((v) => (
                <button key={String(v)} onClick={() => setEntry({ ...entry, exercisesDone: v })}
                  className={`chip cursor-pointer ${entry.exercisesDone === v ? (v ? 'bg-teal-600 text-white' : 'bg-red-500 text-white') : 'bg-canvas ring-1 ring-line text-ink-3'}`}>
                  {v ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Notes" hint='e.g. "Pain increased after stairs", "Felt better after exercises"'>
              <Textarea value={entry.note} onChange={(e) => setEntry({ ...entry, note: e.target.value })} />
            </Field>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button className="btn-secondary" onClick={() => setLogOpen(false)}>Cancel</button>
          <button className="btn-primary" onClick={submitLog}>Save log</button>
        </div>
      </Modal>
    </div>
  )
}
