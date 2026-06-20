import { useMemo, useState } from 'react'
import { Save, CheckCircle2, FileText, Download, Sparkles } from 'lucide-react'
import { useData, useToast } from '../context/app'
import { Card, Accordion, Badge, Field, Input, Select, Textarea, Scale10, Toggle } from '../components/ui'

/* ------------------------- reference data ------------------------- */
const REGIONS = ['Neck / cervical', 'Shoulder', 'Elbow', 'Wrist / hand', 'Low back / lumbar', 'Hip', 'Knee', 'Ankle / foot', 'Posture / general']

const PAIN_TYPES = ['Sharp', 'Dull', 'Burning', 'Throbbing', 'Stabbing', 'Radiating', 'Stiffness']

const ROM_JOINTS = {
  'Cervical spine': ['Flexion', 'Extension', 'Side flexion (L)', 'Side flexion (R)', 'Rotation (L)', 'Rotation (R)'],
  Shoulder: ['Flexion', 'Extension', 'Abduction', 'Adduction', 'Internal rotation', 'External rotation'],
  Elbow: ['Flexion', 'Extension'],
  Wrist: ['Flexion', 'Extension'],
  'Lumbar spine': ['Flexion', 'Extension', 'Side flexion (L)', 'Side flexion (R)', 'Rotation (L)', 'Rotation (R)'],
  Hip: ['Flexion', 'Extension', 'Abduction', 'Adduction', 'Internal rotation', 'External rotation'],
  Knee: ['Flexion', 'Extension'],
  Ankle: ['Dorsiflexion', 'Plantarflexion', 'Inversion', 'Eversion'],
}

const SPECIAL_TESTS = {
  Shoulder: ['Hawkins-Kennedy', 'Neer', 'Empty Can', "Speed's test", 'Apprehension', 'External rotation lag sign'],
  Knee: ['Lachman', 'Anterior drawer', 'Posterior drawer', 'McMurray', 'Valgus stress', 'Varus stress', 'Thessaly'],
  Lumbar: ['SLR', 'Slump', 'Prone instability', 'Quadrant test'],
  Neck: ['Spurling', 'Distraction', 'ULNT'],
}

const FUNC_TASKS = ['Squat', 'Sit to stand', 'Stairs', 'Single leg balance', 'Walking tolerance', 'Running tolerance', 'Reaching overhead', 'Lifting', 'Sport-specific activity']

const MMT_GROUPS = ['Shoulder abductors', 'Shoulder external rotators', 'Elbow flexors', 'Grip', 'Hip flexors', 'Hip abductors', 'Quadriceps', 'Hamstrings', 'Gastrocnemius', 'Tibialis anterior', 'Trunk flexors', 'Trunk extensors']

const POSTURE_ITEMS = ['Standing posture', 'Sitting posture', 'Gait observations', 'Swelling', 'Bruising', 'Muscle wasting', 'Asymmetry', 'Scapular position', 'Pelvic alignment', 'Knee valgus/varus', 'Foot posture']

const BODY_AREAS = [
  ['Neck', 50, 14], ['L shoulder', 33, 24], ['R shoulder', 67, 24], ['L elbow', 27, 42], ['R elbow', 73, 42],
  ['L wrist', 23, 58], ['R wrist', 77, 58], ['Upper back', 50, 28], ['Low back', 50, 44], ['L hip', 41, 52],
  ['R hip', 59, 52], ['L knee', 41, 72], ['R knee', 59, 72], ['L ankle', 41, 90], ['R ankle', 59, 90],
]

/* ------------------------------ helpers ----------------------------- */
const blank = {
  // A
  name: '', age: '', gender: 'Female', phone: '', email: '', occupation: '', sport: '',
  dominant: 'Right', physician: '', date: new Date().toISOString().slice(0, 10),
  // B
  complaint: '', region: 'Knee', mechanism: '', onset: '', acuity: 'Acute',
  painLocation: '', painBehavior: '', aggs: '', eases: '', pattern24: '', funcLimits: '', goals: '',
  // C
  nprs: null, painTypes: [], irritability: 'Moderate', severity: 'Moderate', frequency: 'Intermittent', bodyAreas: [],
  // D
  posture: {}, postureNotes: '',
  // E
  rom: {}, // joint -> movement -> {al, ar, pl, pr, painful, endfeel}
  // F
  mmt: {}, // group -> {l, r, pain, note}
  // G
  tests: {}, // region -> test -> {result, note}
  // H
  func: {}, // task -> note/rating
  // I
  outcomes: {}, // tool -> score
  // J
  provDx: '', problems: '', contributing: '', precautions: '', redFlags: 'None identified', rehabPotential: 'Good', stGoals: '', ltGoals: '',
  // K
  txFrequency: '2×/week', duration: '6–8 weeks', interventions: [], followUp: '',
}

const INTERVENTIONS = ['Manual therapy', 'Exercise therapy', 'Education', 'Neuromuscular re-education', 'Pain management', 'Home exercise program']

export default function Assessment() {
  const { patients, saveAssessment, outcomeTools } = useData()
  const toast = useToast()
  const [patientId, setPatientId] = useState('')
  const [f, setF] = useState(blank)
  const set = (k) => (e) => setF({ ...f, [k]: e.target?.value ?? e })
  const setDeep = (key, path, value) => setF((cur) => {
    const next = { ...cur, [key]: { ...cur[key] } }
    let node = next[key]
    for (let i = 0; i < path.length - 1; i++) { node[path[i]] = { ...(node[path[i]] || {}) }; node = node[path[i]] }
    node[path[path.length - 1]] = value
    return next
  })

  const pickPatient = (id) => {
    setPatientId(id)
    const p = patients.find((x) => x.id === id)
    if (p) setF({ ...f, name: p.name, age: p.age, gender: p.gender, phone: p.phone, email: p.email, occupation: p.occupation, sport: p.activity, complaint: p.complaint })
  }

  /* live clinical summary */
  const summary = useMemo(() => {
    const lines = []
    if (f.name) lines.push(`${f.name}${f.age ? `, ${f.age}y` : ''}${f.occupation ? `, ${f.occupation.toLowerCase()}` : ''}.`)
    if (f.complaint) lines.push(`Presents with ${f.complaint.toLowerCase()}${f.onset ? ` since ${f.onset}` : ''} (${f.acuity.toLowerCase()}).`)
    if (f.mechanism) lines.push(`Mechanism: ${f.mechanism}.`)
    if (f.nprs != null) lines.push(`Pain ${f.nprs}/10${f.painTypes.length ? `, described as ${f.painTypes.map((t) => t.toLowerCase()).join(', ')}` : ''}; irritability ${f.irritability.toLowerCase()}.`)
    if (f.aggs) lines.push(`Aggravated by ${f.aggs.toLowerCase()}${f.eases ? `; eased by ${f.eases.toLowerCase()}` : ''}.`)
    const romCount = Object.values(f.rom).reduce((n, mv) => n + Object.keys(mv).length, 0)
    if (romCount) lines.push(`ROM documented for ${Object.keys(f.rom).length} joint(s).`)
    const positives = []
    Object.entries(f.tests).forEach(([, ts]) => Object.entries(ts).forEach(([name, v]) => v.result === 'Positive' && positives.push(name)))
    if (positives.length) lines.push(`Positive special tests: ${positives.join(', ')}.`)
    if (f.provDx) lines.push(`Provisional diagnosis: ${f.provDx}.`)
    if (f.stGoals) lines.push(`Short-term goals: ${f.stGoals}`)
    if (f.txFrequency) lines.push(`Plan: ${f.txFrequency} for ${f.duration}${f.interventions.length ? ` — ${f.interventions.map((i) => i.toLowerCase()).join(', ')}` : ''}.`)
    return lines
  }, [f])

  const save = (status) => {
    saveAssessment(patientId, f, status)
    toast(status === 'complete' ? 'Assessment completed and saved' : 'Draft saved')
  }

  const toggleArr = (key, val) => setF((c) => ({ ...c, [key]: c[key].includes(val) ? c[key].filter((x) => x !== val) : [...c[key], val] }))

  return (
    <div className="fade-up">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <h1 className="font-display font-bold text-2xl">Assessment form</h1>
          <p className="text-sm text-ink-3 mt-1">Clinical intake and evaluation — sections save as you go.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select className="input w-56" value={patientId} onChange={(e) => pickPatient(e.target.value)} aria-label="Link to patient">
            <option value="">Link to patient…</option>
            {patients.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
          </Select>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-5 items-start">
        {/* ------------------------- form column ------------------------- */}
        <div className="space-y-4">
          <Accordion title="A · Patient information" defaultOpen>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Full name"><Input value={f.name} onChange={set('name')} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Age"><Input type="number" value={f.age} onChange={set('age')} /></Field>
                <Field label="Gender"><Select value={f.gender} onChange={set('gender')}><option>Female</option><option>Male</option><option>Other</option></Select></Field>
              </div>
              <Field label="Phone"><Input value={f.phone} onChange={set('phone')} /></Field>
              <Field label="Email"><Input value={f.email} onChange={set('email')} /></Field>
              <Field label="Occupation"><Input value={f.occupation} onChange={set('occupation')} /></Field>
              <Field label="Sport / activity"><Input value={f.sport} onChange={set('sport')} /></Field>
              <Field label="Dominant side"><Select value={f.dominant} onChange={set('dominant')}><option>Right</option><option>Left</option></Select></Field>
              <Field label="Referring physician"><Input value={f.physician} onChange={set('physician')} /></Field>
              <Field label="Date of assessment"><Input type="date" value={f.date} onChange={set('date')} /></Field>
            </div>
          </Accordion>

          <Accordion title="B · Chief complaint">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2"><Field label="Main complaint"><Input value={f.complaint} onChange={set('complaint')} placeholder="In the patient's own words" /></Field></div>
              <Field label="Body region"><Select value={f.region} onChange={set('region')}>{REGIONS.map((r) => <option key={r}>{r}</option>)}</Select></Field>
              <Field label="Mechanism of injury"><Input value={f.mechanism} onChange={set('mechanism')} placeholder="e.g. non-contact pivot" /></Field>
              <Field label="Date of onset"><Input value={f.onset} onChange={set('onset')} placeholder="e.g. 6 weeks ago" /></Field>
              <Field label="Acuity"><Select value={f.acuity} onChange={set('acuity')}><option>Acute</option><option>Subacute</option><option>Chronic</option><option>Acute on chronic</option></Select></Field>
              <Field label="Pain location"><Input value={f.painLocation} onChange={set('painLocation')} /></Field>
              <Field label="Pain behavior"><Input value={f.painBehavior} onChange={set('painBehavior')} placeholder="constant / intermittent, mechanical pattern…" /></Field>
              <Field label="Aggravating factors"><Input value={f.aggs} onChange={set('aggs')} /></Field>
              <Field label="Relieving factors"><Input value={f.eases} onChange={set('eases')} /></Field>
              <Field label="24-hour pattern"><Input value={f.pattern24} onChange={set('pattern24')} placeholder="morning stiffness, night pain…" /></Field>
              <Field label="Functional limitations"><Input value={f.funcLimits} onChange={set('funcLimits')} /></Field>
              <div className="sm:col-span-2"><Field label="Patient goals"><Textarea value={f.goals} onChange={set('goals')} /></Field></div>
            </div>
          </Accordion>

          <Accordion title="C · Pain assessment" badge={f.nprs != null && <Badge color={f.nprs >= 7 ? 'red' : f.nprs >= 4 ? 'amber' : 'green'}>{f.nprs}/10</Badge>}>
            <div className="space-y-5">
              <Field label="Numeric pain rating (0–10)"><Scale10 value={f.nprs} onChange={(v) => setF({ ...f, nprs: v })} /></Field>
              <Field label="Pain type">
                <div className="flex flex-wrap gap-2">
                  {PAIN_TYPES.map((t) => (
                    <button key={t} type="button" onClick={() => toggleArr('painTypes', t)}
                      className={`chip cursor-pointer transition ${f.painTypes.includes(t) ? 'bg-teal-600 text-white' : 'bg-canvas ring-1 ring-line text-ink-3 hover:ring-teal-300'}`}>{t}</button>
                  ))}
                </div>
              </Field>
              <div className="grid sm:grid-cols-3 gap-4">
                <Field label="Irritability"><Select value={f.irritability} onChange={set('irritability')}><option>Low</option><option>Moderate</option><option>High</option></Select></Field>
                <Field label="Severity"><Select value={f.severity} onChange={set('severity')}><option>Mild</option><option>Moderate</option><option>Severe</option></Select></Field>
                <Field label="Frequency"><Select value={f.frequency} onChange={set('frequency')}><option>Constant</option><option>Intermittent</option><option>Occasional</option></Select></Field>
              </div>
              <Field label="Pain diagram — tap affected areas" hint={f.bodyAreas.length ? `Selected: ${f.bodyAreas.join(', ')}` : 'Nothing selected yet'}>
                <div className="flex justify-center rounded-xl bg-canvas py-4">
                  <svg viewBox="0 0 100 100" className="w-44" role="img" aria-label="Body diagram">
                    {/* simple body outline */}
                    <circle cx="50" cy="8" r="6" fill="#D6EDEA" />
                    <path d="M38 18 h24 l4 18 -4 14 v18 l-3 26 h-7 l-2 -24 h-0 l-2 24 h-7 l-3 -26 v-18 l-4 -14 z" fill="#D6EDEA" />
                    <path d="M34 20 l-8 22 4 2 8 -18 z M66 20 l8 22 -4 2 -8 -18 z" fill="#D6EDEA" />
                    {BODY_AREAS.map(([name, x, y]) => (
                      <circle key={name} cx={x} cy={y} r="4" className="cursor-pointer"
                        fill={f.bodyAreas.includes(name) ? '#0D9488' : '#fff'} stroke="#0D9488" strokeWidth="1"
                        onClick={() => toggleArr('bodyAreas', name)}>
                        <title>{name}</title>
                      </circle>
                    ))}
                  </svg>
                </div>
              </Field>
            </div>
          </Accordion>

          <Accordion title="D · Observation / posture">
            <div className="grid sm:grid-cols-2 gap-4">
              {POSTURE_ITEMS.map((item) => (
                <Field key={item} label={item}>
                  <Input value={f.posture[item] || ''} onChange={(e) => setDeep('posture', [item], e.target.value)} placeholder="Normal / describe finding" />
                </Field>
              ))}
              <div className="sm:col-span-2"><Field label="Free notes"><Textarea value={f.postureNotes} onChange={set('postureNotes')} /></Field></div>
            </div>
          </Accordion>

          <Accordion title="E · Range of motion" badge={Object.keys(f.rom).length > 0 && <Badge color="teal">{Object.keys(f.rom).length} joints</Badge>}>
            <p className="text-xs text-ink-3 mb-4">Enter degrees for active and passive ROM, left vs right. Mark painful arcs and end-feel.</p>
            <div className="space-y-6">
              {Object.entries(ROM_JOINTS).map(([joint, moves]) => (
                <details key={joint} className="group">
                  <summary className="cursor-pointer font-medium text-sm py-2 px-3 rounded-lg bg-canvas hover:bg-teal-50 transition-colors">{joint}</summary>
                  <div className="overflow-x-auto mt-2">
                    <table className="w-full min-w-[640px] text-sm">
                      <thead><tr>{['Movement', 'Active L', 'Active R', 'Passive L', 'Passive R', 'Painful', 'End-feel'].map((h) => <th key={h} className="th !py-2">{h}</th>)}</tr></thead>
                      <tbody>
                        {moves.map((m) => {
                          const v = f.rom[joint]?.[m] || {}
                          const upd = (field, val) => setDeep('rom', [joint, m, field], val)
                          return (
                            <tr key={m}>
                              <td className="td font-medium whitespace-nowrap">{m}</td>
                              {['al', 'ar', 'pl', 'pr'].map((k) => (
                                <td key={k} className="td"><input className="input !py-1.5 w-20" placeholder="°" value={v[k] || ''} onChange={(e) => upd(k, e.target.value)} /></td>
                              ))}
                              <td className="td"><input type="checkbox" className="accent-teal-600 h-4 w-4" checked={!!v.painful} onChange={(e) => upd('painful', e.target.checked)} aria-label={`${m} painful`} /></td>
                              <td className="td">
                                <select className="input !py-1.5 w-32" value={v.endfeel || ''} onChange={(e) => upd('endfeel', e.target.value)}>
                                  <option value="">—</option><option>Normal</option><option>Empty</option><option>Capsular</option><option>Springy</option><option>Bony</option><option>Muscle spasm</option>
                                </select>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </details>
              ))}
            </div>
          </Accordion>

          <Accordion title="F · Strength testing (MMT 0–5)">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-sm">
                <thead><tr>{['Muscle group', 'Left', 'Right', 'Pain', 'Comments'].map((h) => <th key={h} className="th !py-2">{h}</th>)}</tr></thead>
                <tbody>
                  {MMT_GROUPS.map((g) => {
                    const v = f.mmt[g] || {}
                    const upd = (field, val) => setDeep('mmt', [g, field], val)
                    const grade = (k) => (
                      <select className="input !py-1.5 w-20" value={v[k] || ''} onChange={(e) => upd(k, e.target.value)}>
                        <option value="">—</option>{['0', '1', '2', '3', '3+', '4-', '4', '4+', '5'].map((x) => <option key={x}>{x}</option>)}
                      </select>
                    )
                    return (
                      <tr key={g}>
                        <td className="td font-medium whitespace-nowrap">{g}</td>
                        <td className="td">{grade('l')}</td>
                        <td className="td">{grade('r')}</td>
                        <td className="td"><input type="checkbox" className="accent-teal-600 h-4 w-4" checked={!!v.pain} onChange={(e) => upd('pain', e.target.checked)} aria-label={`${g} painful`} /></td>
                        <td className="td"><input className="input !py-1.5" value={v.note || ''} onChange={(e) => upd('note', e.target.value)} /></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Accordion>

          <Accordion title="G · Special tests">
            <div className="space-y-5">
              {Object.entries(SPECIAL_TESTS).map(([region, tests]) => (
                <div key={region}>
                  <div className="font-medium text-sm mb-2">{region}</div>
                  <div className="space-y-2">
                    {tests.map((tName) => {
                      const v = f.tests[region]?.[tName] || {}
                      const upd = (field, val) => setDeep('tests', [region, tName, field], val)
                      return (
                        <div key={tName} className="flex flex-wrap items-center gap-2 rounded-xl border border-line p-2.5">
                          <span className="text-sm font-medium w-52">{tName}</span>
                          <div className="flex gap-1.5">
                            {['Positive', 'Negative', 'Inconclusive', 'Painful'].map((r) => (
                              <button key={r} type="button" onClick={() => upd('result', v.result === r ? '' : r)}
                                className={`chip cursor-pointer transition ${v.result === r
                                  ? r === 'Positive' ? 'bg-red-600 text-white' : r === 'Negative' ? 'bg-emerald-600 text-white' : r === 'Painful' ? 'bg-amber-500 text-white' : 'bg-ink text-white'
                                  : 'bg-canvas ring-1 ring-line text-ink-3 hover:ring-teal-300'}`}>{r}</button>
                            ))}
                          </div>
                          <input className="input !py-1.5 flex-1 min-w-[140px]" placeholder="Notes" value={v.note || ''} onChange={(e) => upd('note', e.target.value)} />
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </Accordion>

          <Accordion title="H · Functional assessment">
            <div className="grid sm:grid-cols-2 gap-4">
              {FUNC_TASKS.map((task) => (
                <Field key={task} label={task}>
                  <Input value={f.func[task] || ''} onChange={(e) => setDeep('func', [task], e.target.value)} placeholder="Quality / tolerance / pain" />
                </Field>
              ))}
            </div>
          </Accordion>

          <Accordion title="I · Outcome measures">
            <div className="grid sm:grid-cols-2 gap-3">
              {outcomeTools.map((tool) => {
                const score = f.outcomes[tool.key]
                const pct = score !== undefined && score !== '' ? Math.round((+score / tool.max) * 100) : null
                const good = pct != null && (tool.dir === 'higher' ? pct >= 70 : pct <= 30)
                return (
                  <div key={tool.key} className="flex items-center gap-3 rounded-xl border border-line p-3">
                    <div className="flex-1">
                      <div className="text-sm font-medium">{tool.name}</div>
                      <div className="text-[11px] text-ink-3">{tool.region} · max {tool.max}{tool.unit || ''} · {tool.dir === 'higher' ? 'higher is better' : 'lower is better'}</div>
                    </div>
                    <input className="input !py-1.5 w-20" placeholder="Score" value={score ?? ''} onChange={(e) => setDeep('outcomes', [tool.key], e.target.value)} />
                    {pct != null && <Badge color={good ? 'green' : pct != null && (tool.dir === 'higher' ? pct < 40 : pct > 60) ? 'red' : 'amber'}>{pct}%</Badge>}
                  </div>
                )
              })}
            </div>
          </Accordion>

          <Accordion title="J · Clinical impression">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2"><Field label="Provisional diagnosis"><Input value={f.provDx} onChange={set('provDx')} /></Field></div>
              <Field label="Problem list"><Textarea value={f.problems} onChange={set('problems')} /></Field>
              <Field label="Contributing factors"><Textarea value={f.contributing} onChange={set('contributing')} /></Field>
              <Field label="Precautions"><Input value={f.precautions} onChange={set('precautions')} /></Field>
              <Field label="Red flags"><Input value={f.redFlags} onChange={set('redFlags')} /></Field>
              <Field label="Rehab potential"><Select value={f.rehabPotential} onChange={set('rehabPotential')}><option>Excellent</option><option>Good</option><option>Fair</option><option>Guarded</option></Select></Field>
              <div />
              <Field label="Short-term goals (2–4 weeks)"><Textarea value={f.stGoals} onChange={set('stGoals')} /></Field>
              <Field label="Long-term goals"><Textarea value={f.ltGoals} onChange={set('ltGoals')} /></Field>
            </div>
          </Accordion>

          <Accordion title="K · Plan of care">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Treatment frequency"><Select value={f.txFrequency} onChange={set('txFrequency')}><option>1×/week</option><option>2×/week</option><option>3×/week</option><option>Every 2 weeks</option></Select></Field>
              <Field label="Estimated duration"><Input value={f.duration} onChange={set('duration')} /></Field>
              <div className="sm:col-span-2">
                <Field label="Planned interventions">
                  <div className="flex flex-wrap gap-2">
                    {INTERVENTIONS.map((iv) => (
                      <button key={iv} type="button" onClick={() => toggleArr('interventions', iv)}
                        className={`chip cursor-pointer transition ${f.interventions.includes(iv) ? 'bg-teal-600 text-white' : 'bg-canvas ring-1 ring-line text-ink-3 hover:ring-teal-300'}`}>{iv}</button>
                    ))}
                  </div>
                </Field>
              </div>
              <Field label="Follow-up date"><Input type="date" value={f.followUp} onChange={set('followUp')} /></Field>
            </div>
          </Accordion>

          <div className="flex flex-wrap gap-2 pt-2 pb-8">
            <button className="btn-secondary" onClick={() => save('draft')}><Save size={15} /> Save draft</button>
            <button className="btn-primary" onClick={() => save('complete')}><CheckCircle2 size={15} /> Complete assessment</button>
            <button className="btn-secondary" onClick={() => toast('Summary generated below the form panel', 'info')}><FileText size={15} /> Generate summary</button>
            <button className="btn-secondary" onClick={() => { window.print() }}><Download size={15} /> Export PDF</button>
          </div>
        </div>

        {/* --------------------- live summary column --------------------- */}
        <div className="lg:sticky lg:top-6">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} className="text-teal-600" />
              <h3 className="font-display font-semibold">Clinical summary</h3>
              <Badge color="teal" className="ml-auto">live</Badge>
            </div>
            {summary.length === 0 ? (
              <p className="text-sm text-ink-3">Start filling the form — a clean clinical summary will write itself here, ready to paste into notes or reports.</p>
            ) : (
              <div className="space-y-2.5">
                {summary.map((line, i) => <p key={i} className="text-sm leading-relaxed text-ink-2 fade-up">{line}</p>)}
              </div>
            )}
            {f.redFlags && f.redFlags !== 'None identified' && (
              <div className="mt-4 rounded-xl bg-red-50 border border-red-100 p-3 text-sm text-red-700">
                <b>Red flags noted:</b> {f.redFlags}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
