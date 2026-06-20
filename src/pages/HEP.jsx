import { useMemo, useState } from 'react'
import {
  Search, Plus, GripVertical, Trash2, Eye, Save, Send, Printer, Copy,
  UserCheck, Dumbbell, AlertTriangle, ChevronUp, ChevronDown,
} from 'lucide-react'
import { useData, useToast } from '../context/app'
import { Card, Badge, Field, Input, Select, Modal, EmptyState } from '../components/ui'

const SECTIONS = ['Warm-up', 'Mobility', 'Strength', 'Control / stability', 'Stretching', 'Cool down']
const AREAS = ['All', 'Shoulder', 'Neck', 'Back', 'Hip', 'Knee', 'Ankle', 'Posture', 'Balance', 'ACL Rehab', 'Core stability']
const DIFFS = ['All', 'Easy', 'Medium', 'Hard']
const PHASES = ['All', 'Early', 'Mid', 'Late', 'Any']

const defaultsFor = (ex) => ({
  exId: ex.id, name: ex.name, area: ex.area, desc: ex.desc,
  section: ex.tags.includes('stretching') ? 'Stretching' : ex.tags.includes('balance') || ex.tags.includes('motor control') ? 'Control / stability' : 'Strength',
  sets: 3, reps: 10, hold: ex.tags.includes('stretching') ? 30 : 0,
  frequency: '1×/day', resistance: 'Bodyweight', tempo: 'Controlled', rest: '30–60 s',
  instructions: ex.desc, painNote: 'Stop if pain rises above 3/10 or symptoms spread.', progression: '', regression: '',
})

export default function HEP() {
  const { exercises, patients, programs, saveProgram } = useData()
  const toast = useToast()
  const [q, setQ] = useState('')
  const [area, setArea] = useState('All')
  const [diff, setDiff] = useState('All')
  const [phase, setPhase] = useState('All')
  const [equipOnly, setEquipOnly] = useState(false)
  const [patientId, setPatientId] = useState('p1')
  const [items, setItems] = useState(() => programs['p1']?.items || [
    defaultsFor(exercises[0]), defaultsFor(exercises[1]),
    { ...defaultsFor(exercises[10]), section: 'Stretching' },
  ])
  const [preview, setPreview] = useState(false)
  const [dragIdx, setDragIdx] = useState(null)

  const library = useMemo(() => exercises.filter((e) =>
    (e.name + e.desc + e.tags.join(' ')).toLowerCase().includes(q.toLowerCase()) &&
    (area === 'All' || e.area === area) &&
    (diff === 'All' || e.difficulty === diff) &&
    (phase === 'All' || e.phase === phase || e.phase === 'Any') &&
    (!equipOnly || e.equipment === 'None')
  ), [exercises, q, area, diff, phase, equipOnly])

  const add = (ex) => {
    if (items.some((i) => i.exId === ex.id)) { toast(`${ex.name} is already in the plan`, 'info'); return }
    setItems([...items, defaultsFor(ex)])
    toast(`${ex.name} added to plan`)
  }
  const update = (idx, patch) => setItems(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)))
  const remove = (idx) => setItems(items.filter((_, i) => i !== idx))
  const move = (idx, dir) => {
    const j = idx + dir
    if (j < 0 || j >= items.length) return
    const next = [...items]; [next[idx], next[j]] = [next[j], next[idx]]
    setItems(next)
  }
  const onDrop = (idx) => {
    if (dragIdx === null || dragIdx === idx) return
    const next = [...items]
    const [moved] = next.splice(dragIdx, 1)
    next.splice(idx, 0, moved)
    setItems(next); setDragIdx(null)
  }

  const patient = patients.find((p) => p.id === patientId)
  const grouped = SECTIONS.map((s) => [s, items.filter((i) => i.section === s)]).filter(([, arr]) => arr.length)

  const act = (msg) => () => { saveProgram(patientId, { items, updated: new Date().toISOString() }); toast(msg) }

  return (
    <div className="fade-up">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <h1 className="font-display font-bold text-2xl">Home exercise program</h1>
          <p className="text-sm text-ink-3 mt-1">Build from the library on the left — dose and order the plan on the right.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select className="input w-52" value={patientId} onChange={(e) => { setPatientId(e.target.value); setItems(programs[e.target.value]?.items || []) }}>
            {patients.filter((p) => p.status === 'Active').map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
          <button className="btn-secondary" onClick={() => setPreview(true)}><Eye size={15} /> Patient preview</button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[380px_1fr] gap-5 items-start">
        {/* ----------------------------- library ----------------------------- */}
        <Card className="p-4 lg:sticky lg:top-6 max-h-[calc(100vh-7rem)] flex flex-col">
          <div className="relative mb-3">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
            <input className="input pl-9" placeholder="Search exercise library…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            <Select className="input !w-auto !py-1.5 text-xs" value={area} onChange={(e) => setArea(e.target.value)} aria-label="Body part">
              {AREAS.map((a) => <option key={a}>{a}</option>)}
            </Select>
            <Select className="input !w-auto !py-1.5 text-xs" value={diff} onChange={(e) => setDiff(e.target.value)} aria-label="Difficulty">
              {DIFFS.map((d) => <option key={d}>{d}</option>)}
            </Select>
            <Select className="input !w-auto !py-1.5 text-xs" value={phase} onChange={(e) => setPhase(e.target.value)} aria-label="Rehab phase">
              {PHASES.map((p) => <option key={p}>{p} phase</option>)}
            </Select>
            <button onClick={() => setEquipOnly(!equipOnly)}
              className={`chip cursor-pointer ${equipOnly ? 'bg-teal-600 text-white' : 'bg-canvas ring-1 ring-line text-ink-3'}`}>No equipment</button>
          </div>
          <div className="overflow-y-auto -mx-1 px-1 space-y-2">
            {library.length === 0 && <EmptyState icon={Search} title="No exercises found" sub="Try a broader search or clear a filter." />}
            {library.map((ex) => (
              <div key={ex.id} className="rounded-xl border border-line p-3 hover:border-teal-200 hover:shadow-card transition group">
                <div className="flex gap-3">
                  <div className="h-12 w-12 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0" aria-hidden>
                    <Dumbbell size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold truncate">{ex.name}</span>
                      <Badge color={ex.difficulty === 'Easy' ? 'green' : ex.difficulty === 'Medium' ? 'amber' : 'red'}>{ex.difficulty}</Badge>
                    </div>
                    <p className="text-xs text-ink-3 mt-0.5 line-clamp-2">{ex.desc}</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      <Badge color="teal">{ex.area}</Badge>
                      {ex.tags.map((t) => <Badge key={t} color="slate">{t}</Badge>)}
                    </div>
                  </div>
                  <button className="btn-primary !px-2.5 self-center shrink-0" onClick={() => add(ex)} aria-label={`Add ${ex.name}`}><Plus size={15} /></button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* ------------------------------- plan ------------------------------- */}
        <div className="space-y-4">
          <Card className="p-4 flex flex-wrap items-center gap-3">
            <UserCheck size={18} className="text-teal-600" />
            <div className="flex-1 min-w-[180px]">
              <div className="text-sm font-semibold">{patient?.name}</div>
              <div className="text-xs text-ink-3">{patient?.diagnosis}</div>
            </div>
            <Badge color="teal">{items.length} exercises</Badge>
          </Card>

          {items.length === 0 ? (
            <Card><EmptyState icon={Dumbbell} title="The plan is empty" sub="Add exercises from the library to start building this patient's program." /></Card>
          ) : items.map((it, idx) => (
            <Card key={idx} draggable onDragStart={() => setDragIdx(idx)} onDragOver={(e) => e.preventDefault()} onDrop={() => onDrop(idx)}
              className={`p-4 ${dragIdx === idx ? 'opacity-60 ring-2 ring-teal-300' : ''}`}>
              <div className="flex items-start gap-3">
                <button className="cursor-grab text-ink-3/50 hover:text-ink-3 pt-1" aria-label="Drag to reorder"><GripVertical size={17} /></button>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="h-6 w-6 rounded-md bg-teal-600 text-white text-xs font-bold flex items-center justify-center">{idx + 1}</span>
                    <input className="input !w-auto !py-1 font-semibold flex-1 min-w-[140px]" value={it.name} onChange={(e) => update(idx, { name: e.target.value })} aria-label="Exercise name" />
                    <Select className="input !w-auto !py-1 text-xs" value={it.section} onChange={(e) => update(idx, { section: e.target.value })} aria-label="Section">
                      {SECTIONS.map((s) => <option key={s}>{s}</option>)}
                    </Select>
                    <div className="flex gap-1 ml-auto">
                      <button className="btn-ghost p-1.5" onClick={() => move(idx, -1)} aria-label="Move up"><ChevronUp size={15} /></button>
                      <button className="btn-ghost p-1.5" onClick={() => move(idx, 1)} aria-label="Move down"><ChevronDown size={15} /></button>
                      <button className="btn-ghost p-1.5 text-danger" onClick={() => remove(idx)} aria-label="Remove"><Trash2 size={15} /></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mt-3">
                    {[['Sets', 'sets', 'number'], ['Reps', 'reps', 'number'], ['Hold (s)', 'hold', 'number'],
                      ['Frequency', 'frequency', 'text'], ['Resistance', 'resistance', 'text'], ['Tempo', 'tempo', 'text'], ['Rest', 'rest', 'text'],
                    ].map(([label, key, type]) => (
                      <Field key={key} label={label}>
                        <Input type={type} value={it[key]} onChange={(e) => update(idx, { [key]: type === 'number' ? +e.target.value : e.target.value })} className="input !py-1.5" />
                      </Field>
                    ))}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3 mt-3">
                    <Field label="Instructions"><Input value={it.instructions} onChange={(e) => update(idx, { instructions: e.target.value })} /></Field>
                    <Field label="Pain warning"><Input value={it.painNote} onChange={(e) => update(idx, { painNote: e.target.value })} /></Field>
                    <Field label="Progression"><Input value={it.progression} onChange={(e) => update(idx, { progression: e.target.value })} placeholder="e.g. add band, increase depth" /></Field>
                    <Field label="Regression"><Input value={it.regression} onChange={(e) => update(idx, { regression: e.target.value })} placeholder="e.g. reduce range, two-leg version" /></Field>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {items.length > 0 && (
            <div className="flex flex-wrap gap-2 pb-8">
              <button className="btn-primary" onClick={act('Program saved')}><Save size={15} /> Save program</button>
              <button className="btn-secondary" onClick={act(`Program assigned to ${patient?.name}`)}><UserCheck size={15} /> Assign to patient</button>
              <button className="btn-secondary" onClick={() => { window.print() }}><Printer size={15} /> Print plan</button>
              <button className="btn-secondary" onClick={act(`Plan sent to ${patient?.name} via their patient link`)}><Send size={15} /> Send to patient</button>
              <button className="btn-secondary" onClick={() => toast('Saved as reusable template', 'info')}><Copy size={15} /> Duplicate template</button>
            </div>
          )}
        </div>
      </div>

      {/* ------------------------ patient preview ------------------------ */}
      <Modal open={preview} onClose={() => setPreview(false)} title={`Home plan — ${patient?.name?.split(' ')[0]}'s view`} wide>
        <div className="space-y-5">
          <div className="rounded-xl bg-teal-50 border border-teal-100 p-4 text-sm text-teal-900">
            Do these exercises <b>once a day</b> unless your plan says otherwise. Move slowly and breathe normally. A little effort is good — sharp pain is not.
          </div>
          {grouped.map(([section, arr]) => (
            <div key={section}>
              <h4 className="font-display font-semibold text-sm uppercase tracking-wide text-ink-3 mb-2">{section}</h4>
              <div className="space-y-3">
                {arr.map((it, i) => (
                  <div key={i} className="rounded-2xl border border-line p-4">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="font-display font-semibold">{it.name}</div>
                      <Badge color="teal">{it.sets} sets × {it.reps}{it.hold ? ` · hold ${it.hold}s` : ''} · {it.frequency}</Badge>
                    </div>
                    <p className="text-sm text-ink-2 mt-2">{it.instructions}</p>
                    {it.painNote && (
                      <p className="text-sm mt-2 flex items-start gap-1.5 text-amber-800 bg-amber-50 rounded-lg p-2.5">
                        <AlertTriangle size={15} className="mt-0.5 shrink-0" /> Stop if: {it.painNote.replace(/^Stop if[:\s]*/i, '')}
                      </p>
                    )}
                    <label className="flex items-center gap-2 mt-3 text-sm text-ink-3 cursor-pointer">
                      <input type="checkbox" className="accent-teal-600 h-4 w-4" /> Done today
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-800">
            <b>Contact your therapist if:</b> pain gets worse for more than a day, you notice new swelling, numbness or tingling, or your joint gives way.
          </div>
        </div>
      </Modal>
    </div>
  )
}
