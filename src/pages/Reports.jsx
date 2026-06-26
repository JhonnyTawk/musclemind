import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Printer, AlertTriangle, FilePlus2, HeartPulse } from 'lucide-react'
import { useData, useToast } from '../context/app'
import { Card, CardHeader, Badge, Select, Modal } from '../components/ui'
import { TrendLine, Gauge } from '../components/charts'
import { SITE } from '../config/site'

const REPORT_TYPES = [
  { key: 'progress', name: 'Progress report', desc: 'Symptom trends, adherence and goal status since the last review.' },
  { key: 'initial', name: 'Initial assessment report', desc: 'Intake findings, working diagnosis and plan of care.' },
  { key: 'discharge', name: 'Discharge summary', desc: 'Outcome, final status and maintenance plan.' },
]

const fmtDate = (d) => { try { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) } catch { return d || '—' } }

// Compute simple, real progress stats from a patient's symptom logs.
function useStats(rows, patient) {
  return useMemo(() => {
    if (!rows.length) return { pain: null, fn: null, adherence: patient?.adherence ?? null, count: 0 }
    const first = rows[0], last = rows[rows.length - 1]
    const last14 = rows.slice(-14)
    const done = last14.filter((r) => r.exercisesDone).length
    return {
      pain: { from: first.pain, to: last.pain },
      fn: { from: first.function, to: last.function },
      adherence: last14.length ? Math.round((done / last14.length) * 100) : (patient?.adherence ?? null),
      count: rows.length,
    }
  }, [rows, patient])
}

// A self-contained inline-SVG line chart. Unlike recharts it needs no container
// measurement, so it renders reliably inside the print layer.
function Sparkline({ values, color = '#0D9488', height = 90, width = 320, domain = [0, 10] }) {
  const data = (values || []).filter((v) => v != null)
  if (data.length < 2) return <div className="text-xs text-ink-3 py-4">Not enough data yet.</div>
  const [min, max] = domain
  const x = (i) => 6 + (i / (data.length - 1)) * (width - 12)
  const y = (v) => height - 6 - ((Math.max(min, Math.min(max, v)) - min) / (max - min)) * (height - 12)
  const line = data.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const area = `6,${height - 6} ${line} ${x(data.length - 1).toFixed(1)},${height - 6}`
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none" role="img">
      <polyline points={area} fill={color} fillOpacity="0.08" stroke="none" />
      <polyline points={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

/* ------------------ The printable, branded report ------------------ */
function ReportDocument({ patient, type, rows, program, stats }) {
  const painValues = rows.map((r) => r.pain)
  const fnValues = rows.map((r) => r.function)
  const Row = ({ label, value }) => value ? (
    <div className="py-1.5 border-b border-line/70 last:border-0 flex gap-3">
      <div className="w-40 shrink-0 text-[11px] font-semibold uppercase tracking-wide text-ink-3">{label}</div>
      <div className="text-sm text-ink-2">{value}</div>
    </div>
  ) : null

  return (
    <div className="report-doc bg-white text-ink">
      {/* letterhead */}
      <div className="flex items-center justify-between border-b-2 border-teal-600 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-teal-600 text-white flex items-center justify-center"><HeartPulse size={22} /></div>
          <div>
            <div className="font-display font-bold text-lg leading-tight">{SITE.clinicName}</div>
            <div className="text-xs text-ink-3">{SITE.about.practitionerName} · {SITE.about.practitionerTitle}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-display font-semibold">{type.name}</div>
          <div className="text-xs text-ink-3">Generated {fmtDate(new Date())}</div>
        </div>
      </div>

      {/* patient identity */}
      <div className="grid sm:grid-cols-2 gap-x-8 mt-5">
        <Row label="Patient" value={patient.name} />
        <Row label="Patient ID" value={patient.code} />
        <Row label="Age / Gender" value={[patient.age && `${patient.age}y`, patient.gender].filter(Boolean).join(' · ')} />
        <Row label="Status" value={patient.status} />
        <Row label="Phone" value={patient.phone} />
        <Row label="Last visit" value={fmtDate(patient.lastVisit)} />
      </div>

      {/* injury / clinical summary */}
      <h3 className="font-display font-semibold text-teal-800 mt-6 mb-1">Injury & clinical summary</h3>
      <div className="grid sm:grid-cols-2 gap-x-8">
        <Row label="Main complaint" value={patient.complaint} />
        <Row label="Diagnosis" value={patient.diagnosis} />
        <Row label="History" value={patient.history} />
        <Row label="Surgical history" value={patient.surgical} />
        <Row label="Medications" value={patient.medications} />
        <Row label="Treatment frequency" value={patient.frequency} />
      </div>

      {/* progress */}
      <h3 className="font-display font-semibold text-teal-800 mt-6 mb-2">Progress</h3>
      <div className="grid grid-cols-3 gap-3">
        {[
          ['Pain', stats.pain ? `${stats.pain.from} → ${stats.pain.to}/10` : '—'],
          ['Function', stats.fn ? `${stats.fn.from} → ${stats.fn.to}/10` : '—'],
          ['Adherence', stats.adherence != null ? `${stats.adherence}%` : '—'],
        ].map(([l, v]) => (
          <div key={l} className="rounded-xl bg-canvas p-3 text-center">
            <div className="font-display font-bold text-lg">{v}</div>
            <div className="text-[11px] text-ink-3">{l}</div>
          </div>
        ))}
      </div>
      {patient.progress && <p className="text-sm text-ink-2 mt-3 leading-relaxed">{patient.progress}</p>}

      {/* trend charts (real, print-safe SVG) */}
      {painValues.filter((v) => v != null).length > 1 && (
        <div className="mt-4 grid grid-cols-2 gap-6">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-ink-3 mb-1">Pain over time (0–10)</div>
            <Sparkline values={painValues} color="#DC2626" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-ink-3 mb-1">Function over time (0–10)</div>
            <Sparkline values={fnValues} color="#0D9488" />
          </div>
        </div>
      )}

      {/* goals */}
      {patient.goals && (
        <>
          <h3 className="font-display font-semibold text-teal-800 mt-6 mb-1">Goals</h3>
          <p className="text-sm text-ink-2 leading-relaxed">{patient.goals}</p>
        </>
      )}

      {/* exercises */}
      {program?.items?.length > 0 && (
        <>
          <h3 className="font-display font-semibold text-teal-800 mt-6 mb-2">Prescribed home program</h3>
          <ul className="space-y-1.5">
            {program.items.map((it, i) => (
              <li key={i} className="text-sm flex gap-2">
                <span className="text-teal-600 font-semibold">{i + 1}.</span>
                <span><b>{it.name}</b> — {it.sets}×{it.reps}{it.hold ? ` · hold ${it.hold}s` : ''} · {it.frequency}{it.section ? ` · ${it.section}` : ''}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* signature + brand footer (no website) */}
      <div className="mt-10 flex items-end justify-between">
        <div>
          <div className="h-px w-48 bg-ink/40" />
          <div className="text-xs text-ink-3 mt-1">{SITE.about.practitionerName}, {SITE.about.practitionerTitle}</div>
        </div>
        <div className="text-right text-xs text-ink-3">
          <div className="font-display font-bold text-teal-700">{SITE.clinicName}</div>
          <div>{SITE.findUs.address}</div>
        </div>
      </div>
    </div>
  )
}

export default function Reports() {
  const { patients, logs, programs } = useData()
  const toast = useToast()
  const [patientId, setPatientId] = useState('')
  const [type, setType] = useState(null)

  const patient = patients.find((p) => p.id === patientId) || patients[0]
  const rows = useMemo(() => logs.filter((l) => l.patientId === patient?.id).slice(-30), [logs, patient])
  const stats = useStats(rows, patient)
  const program = patient ? programs[patient.id] : null
  const painData = rows.map((r) => ({ x: r.date.slice(5), pain: r.pain }))
  const fnData = rows.map((r) => ({ x: r.date.slice(5), fn: r.function }))
  const highRisk = patients.filter((p) => p.status === 'Active' && (p.painNow >= 6 || (p.adherence ?? 100) < 65))

  return (
    <div className="space-y-5 fade-up">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl">Reports</h1>
          <p className="text-sm text-ink-3 mt-1">Progress summaries built from each patient's real data — printable as PDF.</p>
        </div>
        <Select className="input w-52" value={patient?.id || ''} onChange={(e) => setPatientId(e.target.value)}>
          {patients.length === 0 && <option value="">No patients yet</option>}
          {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
      </div>

      {!patient ? (
        <Card className="p-10 text-center text-ink-3">Add a patient to generate reports.</Card>
      ) : (
        <>
          {/* live snapshot */}
          <div className="grid lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader title="Pain trend" sub={`${patient.name} · last ${rows.length} logged days`} />
              <div className="px-3 pb-4">
                {painData.length ? <TrendLine data={painData} lines={[{ key: 'pain', name: 'Pain' }]} yDomain={[0, 10]} height={190} />
                  : <p className="px-3 pb-6 text-sm text-ink-3">No symptom logs for this patient yet.</p>}
              </div>
            </Card>
            <Card>
              <CardHeader title="Exercise adherence" sub="Last 2 weeks" />
              <div className="px-2 pb-2"><Gauge value={stats.adherence ?? 0} label="completed sessions" height={170} /></div>
            </Card>
            <Card className="lg:col-span-2">
              <CardHeader title="Function trend" sub={`Self-rated 0–10 · last ${rows.length} logged days`} />
              <div className="px-3 pb-4">
                {fnData.length ? <TrendLine data={fnData} lines={[{ key: 'fn', name: 'Function' }]} yDomain={[0, 10]} height={190} />
                  : <p className="px-3 pb-6 text-sm text-ink-3">No symptom logs for this patient yet.</p>}
              </div>
            </Card>
          </div>

          {/* high risk */}
          <Card>
            <CardHeader title="High-risk patients" sub="Active patients with pain ≥ 6 or adherence < 65%"
              right={<Badge color={highRisk.length ? 'red' : 'green'}>{highRisk.length} flagged</Badge>} />
            <div className="px-5 pb-5 space-y-2">
              {highRisk.map((p) => (
                <div key={p.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-100 bg-amber-50/50 p-3 text-sm">
                  <AlertTriangle size={16} className="text-amber2" />
                  <span className="font-semibold">{p.name}</span>
                  <span className="text-ink-3">{p.diagnosis}</span>
                  <span className="ml-auto flex gap-2">
                    {p.painNow >= 6 && <Badge color="red">Pain {p.painNow}/10</Badge>}
                    {(p.adherence ?? 100) < 65 && <Badge color="amber">Adherence {p.adherence}%</Badge>}
                  </span>
                </div>
              ))}
              {highRisk.length === 0 && <p className="text-sm text-ink-3">No active patients currently meet risk criteria.</p>}
            </div>
          </Card>

          {/* generators */}
          <Card>
            <CardHeader title="Generate a report" sub={`A branded, printable document for ${patient.name}`} />
            <div className="px-5 pb-5 grid sm:grid-cols-3 gap-3">
              {REPORT_TYPES.map((r) => (
                <button key={r.key} onClick={() => setType(r)} className="rounded-2xl border border-line p-4 text-left hover:border-teal-300 hover:shadow-card transition group">
                  <div className="h-9 w-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center mb-3 group-hover:bg-teal-600 group-hover:text-white transition-colors"><FilePlus2 size={17} /></div>
                  <div className="font-display font-semibold text-sm">{r.name}</div>
                  <p className="text-xs text-ink-3 mt-1">{r.desc}</p>
                </button>
              ))}
            </div>
          </Card>
        </>
      )}

      {/* report preview + print */}
      <Modal open={!!type && !!patient} onClose={() => setType(null)} title={type?.name || ''} wide>
        {type && patient && (
          <div>
            <ReportDocument patient={patient} type={type} rows={rows} program={program} stats={stats} />
            <div className="no-print flex flex-wrap gap-2 mt-6 pt-4 border-t border-line">
              <button className="btn-primary" onClick={() => window.print()}><Printer size={15} /> Download / Print PDF</button>
              <button className="btn-secondary ml-auto" onClick={() => setType(null)}>Close</button>
            </div>
          </div>
        )}
      </Modal>

      {/* dedicated print layer (outside the app shell) so the PDF is never cropped */}
      {type && patient && createPortal(
        <div id="print-root">
          <ReportDocument patient={patient} type={type} rows={rows} program={program} stats={stats} />
        </div>,
        document.body,
      )}
    </div>
  )
}
