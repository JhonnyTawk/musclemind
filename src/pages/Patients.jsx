import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Users, SlidersHorizontal, Trash2 } from 'lucide-react'
import { useData, useToast } from '../context/app'
import { Card, Avatar, StatusBadge, PainBadge, EmptyState, Select, Modal } from '../components/ui'

export default function Patients() {
  const { patients, therapists, followups, deletePatient } = useData()
  const toast = useToast()
  const navigate = useNavigate()
  const [toDelete, setToDelete] = useState(null)

  const confirmDelete = async () => {
    if (!toDelete) return
    await deletePatient(toDelete.id)
    toast(`${toDelete.name} removed`)
    setToDelete(null)
  }
  const [q, setQ] = useState('')
  const [condition, setCondition] = useState('All')
  const [therapist, setTherapist] = useState('All')
  const [status, setStatus] = useState('All')
  const [highPain, setHighPain] = useState(false)
  const [needsFU, setNeedsFU] = useState(false)

  const conditions = ['All', 'ACL / knee', 'Shoulder', 'Low back', 'Neck / posture', 'Ankle']
  const condMatch = (p, c) => {
    const d = (p.diagnosis + ' ' + p.complaint).toLowerCase()
    if (c === 'ACL / knee') return /acl|knee|patell/.test(d)
    if (c === 'Shoulder') return /shoulder|capsulitis|subacromial/.test(d)
    if (c === 'Low back') return /back|lumbar/.test(d)
    if (c === 'Neck / posture') return /neck|cervic|postur|headache/.test(d)
    if (c === 'Ankle') return /ankle|sprain/.test(d)
    return true
  }
  const fuIds = new Set(followups.map((f) => f.patientId))

  const rows = useMemo(() => patients.filter((p) =>
    (p.name + p.code + p.diagnosis + p.complaint).toLowerCase().includes(q.toLowerCase()) &&
    condMatch(p, condition) &&
    (therapist === 'All' || p.therapistId === therapist) &&
    (status === 'All' || p.status === status) &&
    (!highPain || p.painNow >= 6) &&
    (!needsFU || fuIds.has(p.id))
  ), [patients, q, condition, therapist, status, highPain, needsFU])

  return (
    <div className="space-y-5 fade-up">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl">Patients</h1>
          <p className="text-sm text-ink-3 mt-1">{patients.filter((p) => p.status === 'Active').length} active · {patients.length} total</p>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
            <input className="input pl-9" placeholder="Search by name, ID or diagnosis…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <SlidersHorizontal size={16} className="text-ink-3 hidden sm:block" />
          <Select className="input w-auto" value={condition} onChange={(e) => setCondition(e.target.value)} aria-label="Filter by condition">
            {conditions.map((c) => <option key={c}>{c}</option>)}
          </Select>
          <Select className="input w-auto" value={therapist} onChange={(e) => setTherapist(e.target.value)} aria-label="Filter by therapist">
            <option value="All">All therapists</option>
            {therapists.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </Select>
          <Select className="input w-auto" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
            <option>All</option><option>Active</option><option>Discharged</option>
          </Select>
          <button onClick={() => setHighPain(!highPain)}
            className={`chip cursor-pointer transition ${highPain ? 'bg-red-50 text-red-700 ring-1 ring-red-200' : 'bg-canvas text-ink-3 ring-1 ring-line hover:ring-teal-200'}`}>
            High pain (≥6)
          </button>
          <button onClick={() => setNeedsFU(!needsFU)}
            className={`chip cursor-pointer transition ${needsFU ? 'bg-amber-50 text-amber-800 ring-1 ring-amber-200' : 'bg-canvas text-ink-3 ring-1 ring-line hover:ring-teal-200'}`}>
            Follow-up needed
          </button>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState icon={Users} title="No patients match these filters"
            sub="Try clearing a filter or searching with a different term."
            action={<button className="btn-secondary" onClick={() => { setQ(''); setCondition('All'); setTherapist('All'); setStatus('All'); setHighPain(false); setNeedsFU(false) }}>Clear filters</button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead>
                <tr>
                  {['Patient ID', 'Full name', 'Age', 'Gender', 'Main complaint', 'Diagnosis', 'Therapist', 'Last visit', 'Pain', 'Status'].map((h) => <th key={h} className="th">{h}</th>)}
                  <th className="th text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => {
                  const t = therapists.find((x) => x.id === p.therapistId)
                  return (
                    <tr key={p.id} onClick={() => navigate(`/app/patients/${p.id}`)}
                      className="cursor-pointer hover:bg-teal-50/50 transition-colors">
                      <td className="td font-mono text-xs text-ink-3">{p.code}</td>
                      <td className="td">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={p.name} size="sm" />
                          <span className="font-medium">{p.name}</span>
                        </div>
                      </td>
                      <td className="td">{p.age}</td>
                      <td className="td">{p.gender}</td>
                      <td className="td max-w-[220px] truncate text-ink-2">{p.complaint}</td>
                      <td className="td max-w-[220px] truncate text-ink-2">{p.diagnosis}</td>
                      <td className="td whitespace-nowrap">{t?.name}</td>
                      <td className="td whitespace-nowrap text-ink-3">{p.lastVisit}</td>
                      <td className="td"><PainBadge score={p.painNow} /></td>
                      <td className="td"><StatusBadge status={p.status} /></td>
                      <td className="td text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); setToDelete(p) }}
                          className="btn-ghost p-1.5 rounded-lg text-ink-3 hover:text-danger hover:bg-red-50"
                          aria-label={`Delete ${p.name}`}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="Remove patient?">
        <p className="text-sm text-ink-2">
          This permanently removes <b>{toDelete?.name}</b> and all of their records
          (symptom logs, program and appointments). This cannot be undone.
        </p>
        <p className="text-xs text-ink-3 mt-2">
          If they had a patient login, it will stop working.
        </p>
        <div className="flex justify-end gap-2 mt-6">
          <button className="btn-secondary" onClick={() => setToDelete(null)}>Cancel</button>
          <button className="btn-danger" onClick={confirmDelete}><Trash2 size={15} /> Delete patient</button>
        </div>
      </Modal>
    </div>
  )
}
