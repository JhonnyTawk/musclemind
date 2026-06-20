import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { HeartPulse, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { useData, useToast } from '../context/app'
import { Card, Badge, Field, Textarea, Scale10, Select } from '../components/ui'
import { TrendLine } from '../components/charts'

// Patients reach this page through their private link — no account needed.
export default function Portal() {
  const { token } = useParams()
  const { patients, programs, logs, addLog } = useData()
  const toast = useToast()
  const patient = patients.find((p) => p.shareToken === token)
  const [entry, setEntry] = useState({ pain: 3, stiffness: 3, sleep: 7, function: 6, exercisesDone: true, bodyArea: 'Knee', note: '' })
  const [saved, setSaved] = useState(false)

  const myLogs = useMemo(() => patient ? logs.filter((l) => l.patientId === patient.id).slice(-14) : [], [logs, patient])
  const program = patient && (programs[patient.id]?.items?.length ? programs[patient.id].items : [
    { name: 'Quad set', section: 'Strength', sets: 3, reps: 10, hold: 5, frequency: '2×/day', instructions: 'Tighten your thigh muscle and press the back of your knee down. Hold, then relax.', painNote: 'pain rises above 3/10' },
    { name: 'Heel slides', section: 'Mobility', sets: 2, reps: 12, hold: 0, frequency: '2×/day', instructions: 'Slide your heel toward you to bend the knee as far as comfortable, then straighten.', painNote: 'sharp pain or the knee feels blocked' },
    { name: 'Hamstring stretch', section: 'Stretching', sets: 2, reps: 1, hold: 30, frequency: '1×/day', instructions: 'Lying down, lift your leg with a strap until you feel a gentle stretch behind the thigh.', painNote: 'tingling or numbness appears' },
  ])

  if (!patient) {
    return (
      <div className="min-h-full bg-canvas flex items-center justify-center p-6">
        <Card className="p-8 max-w-sm text-center">
          <div className="h-12 w-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center mx-auto mb-4"><HeartPulse size={22} /></div>
          <h1 className="font-display font-bold text-xl">Link not recognized</h1>
          <p className="text-sm text-ink-3 mt-2">This patient link looks invalid or has expired. Please ask your clinic for a new one.</p>
        </Card>
      </div>
    )
  }

  const submit = async () => {
    await addLog({ patientId: patient.id, ...entry, swelling: 0, fatigue: 3, confidence: entry.function, mood: 7 })
    setSaved(true)
    toast('Thanks! Your log was sent to your therapist.')
  }

  const painData = myLogs.map((l) => ({ x: l.date.slice(5), pain: l.pain }))

  return (
    <div className="min-h-full bg-canvas">
      <header className="bg-white border-b border-line">
        <div className="mx-auto max-w-2xl px-5 h-16 flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-teal-600 text-white flex items-center justify-center"><HeartPulse size={18} /></div>
          <div>
            <div className="font-display font-bold leading-tight">My rehab plan</div>
            <div className="text-xs text-ink-3">Hi {patient.name.split(' ')[0]} — from your physiotherapy team</div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-6 space-y-6 pb-16">
        {/* daily check-in */}
        <Card className="p-5">
          <h2 className="font-display font-semibold text-lg">Today's check-in</h2>
          <p className="text-sm text-ink-3 mt-1">Takes under a minute — it helps your therapist adjust your plan.</p>
          {saved ? (
            <div className="mt-5 rounded-xl bg-emerald-50 border border-emerald-100 p-4 flex items-center gap-3 text-sm text-emerald-800">
              <CheckCircle2 size={18} /> Logged for today. See you tomorrow!
            </div>
          ) : (
            <div className="mt-5 space-y-5">
              <Field label="How is your pain right now? (0 = none, 10 = worst)">
                <Scale10 value={entry.pain} onChange={(v) => setEntry({ ...entry, pain: v })} />
              </Field>
              <Field label="Stiffness today">
                <Scale10 value={entry.stiffness} onChange={(v) => setEntry({ ...entry, stiffness: v })} />
              </Field>
              <Field label="How well could you do your usual activities? (0 = not at all, 10 = fully)">
                <Scale10 value={entry.function} onChange={(v) => setEntry({ ...entry, function: v })} />
              </Field>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Which area?">
                  <Select value={entry.bodyArea} onChange={(e) => setEntry({ ...entry, bodyArea: e.target.value })}>
                    {['Knee', 'Shoulder', 'Low back', 'Neck', 'Hip', 'Ankle', 'Other'].map((b) => <option key={b}>{b}</option>)}
                  </Select>
                </Field>
                <Field label="Did you do your exercises today?">
                  <div className="flex gap-2">
                    {[true, false].map((v) => (
                      <button key={String(v)} onClick={() => setEntry({ ...entry, exercisesDone: v })}
                        className={`chip cursor-pointer px-4 py-1.5 ${entry.exercisesDone === v ? (v ? 'bg-teal-600 text-white' : 'bg-red-500 text-white') : 'bg-canvas ring-1 ring-line text-ink-3'}`}>
                        {v ? 'Yes' : 'Not yet'}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>
              <Field label="Anything to tell your therapist?" hint='e.g. "Knee swollen in the evening", "Felt better after exercises"'>
                <Textarea value={entry.note} onChange={(e) => setEntry({ ...entry, note: e.target.value })} />
              </Field>
              <button className="btn-primary w-full py-3" onClick={submit}>Send today's log</button>
            </div>
          )}
        </Card>

        {/* trend */}
        {painData.length > 2 && (
          <Card className="p-5">
            <h2 className="font-display font-semibold">Your pain over the last 2 weeks</h2>
            <div className="-mx-2 mt-2"><TrendLine data={painData} lines={[{ key: 'pain', name: 'Pain' }]} yDomain={[0, 10]} height={170} /></div>
          </Card>
        )}

        {/* program */}
        <div>
          <h2 className="font-display font-semibold text-lg mb-1">Your exercises</h2>
          <p className="text-sm text-ink-3 mb-4">Move slowly, breathe normally, and tick each one off as you go.</p>
          <div className="space-y-3">
            {program.map((it, i) => (
              <Card key={i} className="p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="font-display font-semibold text-[17px]">{i + 1}. {it.name}</div>
                    <Badge color="teal" className="mt-1.5">{it.sets} sets × {it.reps}{it.hold ? ` · hold ${it.hold}s` : ''} · {it.frequency}</Badge>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-ink-3 cursor-pointer select-none">
                    <input type="checkbox" className="accent-teal-600 h-5 w-5" /> Done
                  </label>
                </div>
                <p className="text-[15px] text-ink-2 mt-3 leading-relaxed">{it.instructions}</p>
                {it.painNote && (
                  <p className="text-sm mt-3 flex items-start gap-2 text-amber-800 bg-amber-50 rounded-xl p-3">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                    <span><b>Stop if</b> {String(it.painNote).replace(/^Stop if[:\s]*/i, '')}</span>
                  </p>
                )}
              </Card>
            ))}
          </div>
        </div>

        <Card className="p-5 bg-red-50/60 border-red-100">
          <h3 className="font-display font-semibold text-red-800">When to contact your clinic</h3>
          <ul className="mt-2 space-y-1.5 text-sm text-red-800/90">
            <li>• Pain that keeps getting worse for more than a day</li>
            <li>• New swelling, numbness, or tingling</li>
            <li>• Your joint giving way or locking</li>
          </ul>
        </Card>
      </main>
    </div>
  )
}
