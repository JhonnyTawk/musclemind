import { useMemo, useState } from 'react'
import { FileText, Printer, Mail, Download, AlertTriangle, FilePlus2 } from 'lucide-react'
import { useData, useToast } from '../context/app'
import { Card, CardHeader, Badge, Select, Modal } from '../components/ui'
import { TrendLine, Bars, Gauge } from '../components/charts'

const REPORT_TYPES = [
  { key: 'initial', name: 'Initial assessment report', desc: 'Full intake findings, impression and plan of care.' },
  { key: 'progress', name: 'Progress report', desc: 'Symptom trends, adherence and goal status since last review.' },
  { key: 'hep', name: 'Home exercise handout', desc: 'Patient-friendly program with dosage and safety notes.' },
  { key: 'acl', name: 'ACL milestone report', desc: 'Phase status, criteria met and readiness indicators.' },
  { key: 'discharge', name: 'Discharge summary', desc: 'Outcome measures, final status and maintenance plan.' },
]

const ROM_PROGRESS = [
  { x: 'Wk 2', flexion: 85, extension: -8 }, { x: 'Wk 4', flexion: 105, extension: -4 },
  { x: 'Wk 6', flexion: 118, extension: -2 }, { x: 'Wk 8', flexion: 126, extension: -1 },
  { x: 'Wk 10', flexion: 132, extension: 0 }, { x: 'Wk 11', flexion: 135, extension: 0 },
]
const STRENGTH = [
  { x: 'Quads', involved: 78, other: 100 }, { x: 'Hams', involved: 84, other: 100 },
  { x: 'Hip abd', involved: 90, other: 100 }, { x: 'Calf', involved: 95, other: 100 },
]
const SCORES = [
  { x: 'Intake', KOOS: 48, PSFS: 3.1 }, { x: 'Wk 4', KOOS: 61, PSFS: 4.8 },
  { x: 'Wk 8', KOOS: 72, PSFS: 6.4 }, { x: 'Wk 11', KOOS: 79, PSFS: 7.2 },
]

export default function Reports() {
  const { patients, logs } = useData()
  const toast = useToast()
  const [patientId, setPatientId] = useState('')
  const [genOpen, setGenOpen] = useState(null)

  const patient = patients.find((p) => p.id === patientId) || patients[0]
  const rows = useMemo(() => logs.filter((l) => l.patientId === patient?.id).slice(-30), [logs, patient])
  const painData = rows.map((r) => ({ x: r.date.slice(5), pain: r.pain }))
  const highRisk = patients.filter((p) => p.status === 'Active' && (p.painNow >= 6 || p.adherence < 65))

  return (
    <div className="space-y-5 fade-up">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl">Reports</h1>
          <p className="text-sm text-ink-3 mt-1">Progress summaries and printable clinical documents.</p>
        </div>
        <Select className="input w-52" value={patient?.id || ''} onChange={(e) => setPatientId(e.target.value)}>
          {patients.length === 0 && <option value="">No patients yet</option>}
          {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
      </div>

      {/* widgets */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader title="Pain trend" sub={`${patient?.name} · last 30 days`} />
          <div className="px-3 pb-4">
            {painData.length ? <TrendLine data={painData} lines={[{ key: 'pain', name: 'Pain' }]} yDomain={[0, 10]} height={185} />
              : <p className="px-3 pb-4 text-sm text-ink-3">No symptom logs for this patient yet.</p>}
          </div>
        </Card>
        <Card>
          <CardHeader title="ROM progress" sub="Knee flexion across the program (sample)" />
          <div className="px-3 pb-4"><TrendLine data={ROM_PROGRESS} lines={[{ key: 'flexion', name: 'Flexion °' }]} height={185} /></div>
        </Card>
        <Card>
          <CardHeader title="Strength comparison" sub="% of uninvolved side (sample)" />
          <div className="px-3 pb-4"><Bars data={STRENGTH} bars={[{ key: 'involved', name: 'Involved %' }]} height={185} /></div>
        </Card>
        <Card>
          <CardHeader title="Functional scores" sub="KOOS and PSFS over the episode (sample)" />
          <div className="px-3 pb-4"><TrendLine data={SCORES} lines={[{ key: 'KOOS' }, { key: 'PSFS', color: '#B45309' }]} height={185} /></div>
        </Card>
        <Card>
          <CardHeader title="Exercise adherence" sub="This month" />
          <div className="px-2 pb-2"><Gauge value={patient?.adherence ?? 0} label="completed sessions" height={160} /></div>
        </Card>
        <Card>
          <CardHeader title="Phase progression" sub="Rehab phases this episode (sample)" />
          <div className="px-5 pb-5 space-y-2.5">
            {['Protection', 'Early strength', 'Neuromuscular', 'Advanced strength'].map((p, i) => (
              <div key={p} className="flex items-center gap-3">
                <span className="text-sm w-36 shrink-0">{i + 1}. {p}</span>
                <div className="h-2 flex-1 rounded-full bg-teal-50 overflow-hidden">
                  <div className="h-full bg-teal-600" style={{ width: i < 2 ? '100%' : i === 2 ? '62%' : '0%' }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* high risk */}
      <Card>
        <CardHeader title="High-risk patient alerts" sub="Active patients with pain ≥ 6 or adherence < 65%"
          right={<Badge color={highRisk.length ? 'red' : 'green'}>{highRisk.length} flagged</Badge>} />
        <div className="px-5 pb-5 space-y-2">
          {highRisk.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-100 bg-amber-50/50 p-3 text-sm">
              <AlertTriangle size={16} className="text-amber2" />
              <span className="font-semibold">{p.name}</span>
              <span className="text-ink-3">{p.diagnosis}</span>
              <span className="ml-auto flex gap-2">
                {p.painNow >= 6 && <Badge color="red">Pain {p.painNow}/10</Badge>}
                {p.adherence < 65 && <Badge color="amber">Adherence {p.adherence}%</Badge>}
              </span>
            </div>
          ))}
          {highRisk.length === 0 && <p className="text-sm text-ink-3">No active patients currently meet risk criteria.</p>}
        </div>
      </Card>

      {/* generators */}
      <Card>
        <CardHeader title="Generate a report" sub={`Documents are generated for ${patient?.name}`} />
        <div className="px-5 pb-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {REPORT_TYPES.map((r) => (
            <button key={r.key} onClick={() => setGenOpen(r)} className="rounded-2xl border border-line p-4 text-left hover:border-teal-300 hover:shadow-card transition group">
              <div className="h-9 w-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center mb-3 group-hover:bg-teal-600 group-hover:text-white transition-colors"><FilePlus2 size={17} /></div>
              <div className="font-display font-semibold text-sm">{r.name}</div>
              <p className="text-xs text-ink-3 mt-1">{r.desc}</p>
            </button>
          ))}
        </div>
      </Card>

      <Modal open={!!genOpen} onClose={() => setGenOpen(null)} title={genOpen?.name || ''} wide>
        {genOpen && (
          <div>
            <div className="rounded-xl border border-line p-5 bg-canvas">
              <div className="flex items-center gap-2 text-teal-700 font-display font-bold"><FileText size={18} /> MuscleMind · {genOpen.name}</div>
              <div className="mt-4 space-y-2 text-sm">
                <p><b>Patient:</b> {patient?.name} ({patient?.code}) · {patient?.age}y</p>
                <p><b>Diagnosis:</b> {patient?.diagnosis}</p>
                <p><b>Summary:</b> {patient?.progress}</p>
                <p><b>Goals:</b> {patient?.goals}</p>
                <p className="text-ink-3 italic">Generated {new Date().toLocaleDateString('en-GB')} — preview of the formatted document.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-5">
              <button className="btn-primary" onClick={() => { window.print() }}><Download size={15} /> Export PDF</button>
              <button className="btn-secondary" onClick={() => { window.print() }}><Printer size={15} /> Print</button>
              <button className="btn-secondary" onClick={() => { toast(`${genOpen.name} emailed to ${patient?.email}`); setGenOpen(null) }}><Mail size={15} /> Email</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
