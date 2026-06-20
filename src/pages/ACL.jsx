import { useMemo, useState } from 'react'
import {
  Check, AlertTriangle, Target, Flag, ListChecks, Dumbbell, XCircle,
  StickyNote, GitBranch, ChevronDown,
} from 'lucide-react'
import { useData, useToast } from '../context/app'
import { Card, CardHeader, Badge, Select, ProgressBar, EmptyState } from '../components/ui'
import { Gauge } from '../components/charts'

function PhaseCard({ phase, status, completion, checkedItems, onToggle, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen)
  const done = phase.checklist.filter((c) => checkedItems.includes(c)).length
  return (
    <div className="relative pl-12 sm:pl-14 pb-8 last:pb-0">
      {/* rail */}
      <div className={`absolute left-[15px] sm:left-[19px] top-9 bottom-0 w-0.5 ${status === 'done' ? 'bg-teal-600' : 'bg-line'}`} aria-hidden />
      <div className={`absolute left-0 sm:left-1 top-0 h-8 w-8 rounded-full flex items-center justify-center font-display font-bold text-sm ring-4 ring-canvas ${
        status === 'done' ? 'bg-teal-600 text-white' : status === 'current' ? 'bg-white border-2 border-teal-600 text-teal-700' : 'bg-white border-2 border-line text-ink-3/50'}`}>
        {status === 'done' ? <Check size={15} strokeWidth={3} /> : phase.n}
      </div>

      <Card className={`${status === 'current' ? 'ring-2 ring-teal-200 border-teal-300' : status === 'future' ? 'opacity-80' : ''}`}>
        <button onClick={() => setOpen(!open)} className="w-full text-left px-5 py-4 flex flex-wrap items-center gap-3 hover:bg-teal-50/30 transition-colors rounded-2xl">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display font-semibold">Phase {phase.n} · {phase.name}</h3>
              {status === 'current' && <Badge color="teal">Current phase</Badge>}
              {status === 'done' && <Badge color="green">Complete</Badge>}
            </div>
            <div className="text-xs text-ink-3 mt-0.5">{phase.window} · checklist {done}/{phase.checklist.length}</div>
          </div>
          {status === 'current' && <div className="w-32"><ProgressBar value={completion} /></div>}
          <ChevronDown size={17} className={`text-ink-3 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="px-5 pb-5 border-t border-line pt-4 fade-up grid md:grid-cols-2 gap-x-8 gap-y-5">
            {[
              ['Goals', Target, phase.goals], ['Milestones', Flag, phase.milestones],
              ['Entry criteria', ListChecks, phase.entry], ['Exit criteria', ListChecks, phase.exit],
              ['Recommended exercises', Dumbbell, phase.exercises], ['Common mistakes', XCircle, phase.mistakes],
            ].map(([title, Icon, items]) => (
              <div key={title}>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-3 mb-2"><Icon size={14} /> {title}</div>
                <ul className="space-y-1.5">
                  {items.map((it) => <li key={it} className="text-sm text-ink-2 flex gap-2"><span className="text-teal-500 mt-[3px]">•</span>{it}</li>)}
                </ul>
              </div>
            ))}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber2 mb-2"><AlertTriangle size={14} /> Warning signs</div>
              <div className="flex flex-wrap gap-2">
                {phase.warnings.map((w) => <Badge key={w} color="amber">{w}</Badge>)}
              </div>
            </div>
            <div className="md:col-span-2 rounded-xl bg-canvas p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-3 mb-3"><ListChecks size={14} /> Phase checklist</div>
              <div className="grid sm:grid-cols-2 gap-2">
                {phase.checklist.map((item) => {
                  const checked = checkedItems.includes(item)
                  return (
                    <label key={item} className="flex items-start gap-2.5 text-sm cursor-pointer group">
                      <input type="checkbox" checked={checked} onChange={() => onToggle(phase.n, item)} className="accent-teal-600 h-4 w-4 mt-0.5" />
                      <span className={checked ? 'line-through text-ink-3' : 'group-hover:text-teal-800'}>{item}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

export default function ACL() {
  const { patients, aclPhases, aclState } = useData()
  const toast = useToast()
  const aclPatients = patients.filter((p) => p.isACL)
  const [patientId, setPatientId] = useState(aclPatients[0]?.id)
  const base = aclState[patientId]
  const [checks, setChecks] = useState(() => base?.checks || {})

  const state = aclState[patientId]
  const onPick = (id) => { setPatientId(id); setChecks(aclState[id]?.checks || {}) }
  const toggle = (phaseN, item) => {
    setChecks((c) => {
      const arr = c[phaseN] || []
      const next = arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item]
      return { ...c, [phaseN]: next }
    })
    toast('Checklist updated')
  }

  const indicators = useMemo(() => state && [
    ['ROM — extension', `${state.rom.extension}°`, state.rom.extension <= 0 ? 'green' : 'amber'],
    ['ROM — flexion', `${state.rom.flexion}° / ${state.rom.target}°`, state.rom.flexion >= state.rom.target - 10 ? 'green' : 'amber'],
    ['Pain / swelling', state.painSwelling, 'slate'],
    ['Quad activation (index)', `${state.quadIndex}%`, state.quadIndex >= 80 ? 'green' : state.quadIndex >= 65 ? 'amber' : 'red'],
    ['Single-leg control', state.singleLeg, 'slate'],
    ['Hop test readiness', state.hopReady ? 'Ready to test' : 'Not yet — criteria pending', state.hopReady ? 'green' : 'amber'],
  ], [state])

  if (!aclPatients.length) return (
    <Card><EmptyState icon={GitBranch} title="No patients on an ACL program"
      sub="Mark a patient as ACL during intake to track their phased rehab here." /></Card>
  )

  return (
    <div className="space-y-5 fade-up">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl">ACL rehab timeline</h1>
          <p className="text-sm text-ink-3 mt-1">Criteria-based progression — advance on milestones, not the calendar.</p>
        </div>
        <Select className="input w-56" value={patientId} onChange={(e) => onPick(e.target.value)}>
          {aclPatients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
      </div>

      {/* status row */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-ink-3">Current phase</div>
          <div className="font-display font-bold text-xl mt-1.5">Phase {state.currentPhase} · {aclPhases[state.currentPhase - 1].name}</div>
          <div className="flex items-center gap-3 mt-3">
            <ProgressBar value={state.phaseCompletion} className="flex-1" />
            <span className="text-sm font-semibold">{state.phaseCompletion}%</span>
          </div>
          <p className="text-xs text-ink-3 mt-2">{aclPhases[state.currentPhase - 1].window}</p>
        </Card>
        <Card className="p-2">
          <Gauge value={state.psychReadiness} label="psychological readiness" color="#16404D" height={150} />
          <p className="text-center text-xs text-ink-3 pb-3 -mt-1">ACL-RSI style score — target ≥ 65 before return to sport</p>
        </Card>
        <Card className="p-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-ink-3 mb-2 flex items-center gap-1.5"><StickyNote size={13} /> Therapist notes</div>
          <p className="text-sm leading-relaxed text-ink-2">{state.notes}</p>
        </Card>
      </div>

      {/* indicators */}
      <Card>
        <CardHeader title="Progress indicators" />
        <div className="px-5 pb-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {indicators.map(([label, value, tone]) => (
            <div key={label} className="rounded-xl border border-line p-3.5">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-3">{label}</div>
              <div className="mt-1.5"><Badge color={tone}>{value}</Badge></div>
            </div>
          ))}
        </div>
      </Card>

      {/* warnings */}
      {state.alerts.length > 0 && (
        <div className="space-y-2">
          {state.alerts.map((a, i) => (
            <div key={i} className={`flex items-start gap-3 rounded-2xl border p-4 text-sm ${
              a.severity === 'high' ? 'bg-red-50/70 border-red-100 text-red-800' : a.severity === 'medium' ? 'bg-amber-50/70 border-amber-100 text-amber-900' : 'card text-ink-2'}`}>
              <AlertTriangle size={17} className="mt-0.5 shrink-0" /> {a.text}
            </div>
          ))}
        </div>
      )}

      {/* timeline */}
      <div className="pt-2">
        {aclPhases.map((ph) => (
          <PhaseCard key={ph.n} phase={ph}
            status={ph.n < state.currentPhase ? 'done' : ph.n === state.currentPhase ? 'current' : 'future'}
            completion={state.phaseCompletion}
            checkedItems={checks[ph.n] || []}
            onToggle={toggle}
            defaultOpen={ph.n === state.currentPhase}
          />
        ))}
      </div>
    </div>
  )
}
