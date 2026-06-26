import { useMemo, useState } from 'react'
import {
  CalendarDays, CalendarClock, MessageCircle, CalendarPlus, Check, X,
  Trash2, Ban, Bell, Clock, RefreshCw, Plus, ChevronLeft, ChevronRight, User, Phone,
} from 'lucide-react'
import { useData, useToast } from '../context/app'
import { Card, Badge, Field, Input, Select, Tabs, EmptyState, Modal } from '../components/ui'
import { SITE } from '../config/site'
import {
  waLink, confirmMessage, reminderMessage, buildIcs, downloadIcs, googleCalendarLink,
} from '../lib/schedule'

const STATUS_COLOR = { pending: 'amber', confirmed: 'green', declined: 'slate', done: 'blue' }
const todayStr = () => new Date().toISOString().slice(0, 10)
const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10) }
const pad2 = (n) => String(n).padStart(2, '0')
// Calendar cells for a month, Monday-first (null = blank).
function monthMatrix(y, m) {
  const startDow = (new Date(y, m, 1).getDay() + 6) % 7
  const days = new Date(y, m + 1, 0).getDate()
  const cells = Array.from({ length: startDow }, () => null)
  for (let d = 1; d <= days; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

/* --------------------------- Booking card --------------------------- */
function BookingCard({ b }) {
  const { updateBooking, deleteBooking } = useData()
  const toast = useToast()

  const openWa = (builder) => {
    if (!b.phone) { toast('No phone number on this request', 'error'); return }
    const text = builder({ name: b.name, date: b.requestedDate, time: b.requestedTime, clinic: SITE.clinicName })
    window.open(waLink(b.phone, text), '_blank', 'noopener')
  }

  // Accept the request and immediately message the person who booked.
  const confirmAndNotify = () => {
    updateBooking(b.id, { status: 'confirmed' })
    if (b.phone) openWa(confirmMessage)
    else toast('Confirmed — add a phone number to message them')
  }

  const addToCalendar = () => {
    if (!b.requestedDate) { toast('Set a date first', 'error'); return }
    const ics = buildIcs({
      title: `Physio — ${b.name}`,
      description: [b.sessionType, b.notes].filter(Boolean).join(' · '),
      location: SITE.findUs.address,
      date: b.requestedDate, time: b.requestedTime || '09:00',
    })
    downloadIcs(`appointment-${b.name.replace(/\s+/g, '-').toLowerCase()}`, ics)
    toast('Calendar file downloaded')
  }

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="font-display font-semibold text-[15px]">{b.name}</div>
          <div className="text-sm text-ink-3">{b.phone}{b.sessionType ? ` · ${b.sessionType}` : ''}</div>
        </div>
        <Badge color={STATUS_COLOR[b.status] || 'slate'}>{b.status}</Badge>
      </div>

      {b.notes && <p className="text-sm text-ink-2 mt-3 bg-canvas rounded-xl p-3">{b.notes}</p>}

      <div className="grid sm:grid-cols-2 gap-3 mt-4">
        <Field label="Date">
          <Input type="date" value={b.requestedDate || ''} onChange={(e) => updateBooking(b.id, { requestedDate: e.target.value })} />
        </Field>
        <Field label="Time">
          <Input type="time" value={b.requestedTime || ''} onChange={(e) => updateBooking(b.id, { requestedTime: e.target.value })} />
        </Field>
      </div>

      {/* status actions */}
      <div className="flex flex-wrap gap-2 mt-4">
        {b.status !== 'confirmed' && (
          <button className="btn-primary text-xs px-3 py-1.5" onClick={confirmAndNotify}>
            <Check size={14} /> Accept &amp; WhatsApp
          </button>
        )}
        {b.status !== 'done' && (
          <button className="btn-secondary text-xs px-3 py-1.5" onClick={() => updateBooking(b.id, { status: 'done' })}>
            Mark done
          </button>
        )}
        {b.status !== 'declined' && (
          <button className="btn-secondary text-xs px-3 py-1.5" onClick={() => updateBooking(b.id, { status: 'declined' })}>
            <X size={14} /> Decline
          </button>
        )}
        <button className="btn-danger text-xs px-3 py-1.5 ml-auto" onClick={() => deleteBooking(b.id)} aria-label="Delete request">
          <Trash2 size={14} />
        </button>
      </div>

      {/* messaging — free, one tap */}
      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-line">
        <button className="btn-secondary text-xs px-3 py-1.5" onClick={() => openWa(confirmMessage)}>
          <MessageCircle size={14} className="text-teal-600" /> WhatsApp confirmation
        </button>
        <button className="btn-secondary text-xs px-3 py-1.5" onClick={() => openWa(reminderMessage)}>
          <Bell size={14} className="text-teal-600" /> WhatsApp reminder
        </button>
        <button className="btn-secondary text-xs px-3 py-1.5" onClick={addToCalendar}>
          <CalendarPlus size={14} className="text-teal-600" /> Add to my calendar
        </button>
      </div>
    </Card>
  )
}

/* --------------------------- Requests tab --------------------------- */
function RequestsTab() {
  const { bookings, refreshBookings } = useData()
  const toast = useToast()
  const [filter, setFilter] = useState('All')
  const [refreshing, setRefreshing] = useState(false)
  const tomorrow = addDays(1)

  const refresh = async () => {
    setRefreshing(true)
    await refreshBookings()
    setRefreshing(false)
    toast('Checked for new requests')
  }

  const remindersDue = useMemo(
    () => bookings.filter((b) => b.status === 'confirmed' && (b.requestedDate === tomorrow || b.requestedDate === todayStr())),
    [bookings, tomorrow],
  )
  const filtered = useMemo(
    () => (filter === 'All' ? bookings : bookings.filter((b) => b.status === filter.toLowerCase())),
    [bookings, filter],
  )

  return (
    <div className="space-y-6">
      {remindersDue.length > 0 && (
        <Card className="p-4 border-teal-200 bg-teal-50/50">
          <div className="flex items-center gap-2 text-teal-800 font-display font-semibold text-sm">
            <Bell size={16} /> {remindersDue.length} appointment{remindersDue.length > 1 ? 's' : ''} coming up — send a reminder
          </div>
          <p className="text-xs text-ink-3 mt-1">Confirmed sessions today or tomorrow. Open one below and tap “WhatsApp reminder”.</p>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {['All', 'Pending', 'Confirmed', 'Done', 'Declined'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`chip px-3 py-1.5 cursor-pointer ${filter === f ? 'bg-teal-600 text-white' : 'bg-canvas ring-1 ring-line text-ink-3 hover:text-ink'}`}>
            {f}
          </button>
        ))}
        <button onClick={refresh} disabled={refreshing} className="btn-secondary text-xs px-3 py-1.5 ml-auto">
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Check for new requests
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={CalendarDays} title="No appointment requests"
          sub="Requests sent from the website's booking form will appear here." />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((b) => <BookingCard key={b.id} b={b} />)}
        </div>
      )}
    </div>
  )
}

/* ------------------------- Availability tab ------------------------- */
function AvailabilityTab() {
  const { availabilityBlocks, addBlock, removeBlock } = useData()
  const toast = useToast()
  const [date, setDate] = useState('')
  const [mode, setMode] = useState('day')   // 'day' | 'time'
  const [time, setTime] = useState(SITE.booking.slots[0])
  const [reason, setReason] = useState('')

  const block = () => {
    if (!date) { toast('Pick a date to block', 'error'); return }
    addBlock(date, mode === 'time' ? time : '', reason)
    toast(mode === 'day' ? 'Day blocked' : 'Time blocked')
    setReason('')
  }

  const sorted = [...availabilityBlocks].sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')))

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card className="p-5 h-fit">
        <h3 className="font-display font-semibold flex items-center gap-2"><Ban size={17} className="text-teal-700" /> Block time off</h3>
        <p className="text-sm text-ink-3 mt-1">Blocked dates and times are hidden from the website booking form.</p>
        <div className="mt-4 space-y-4">
          <Field label="Date"><Input type="date" min={todayStr()} value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field label="Block">
            <div className="flex gap-2">
              {[['day', 'Whole day'], ['time', 'A single time']].map(([v, label]) => (
                <button key={v} onClick={() => setMode(v)}
                  className={`chip px-3 py-1.5 cursor-pointer ${mode === v ? 'bg-teal-600 text-white' : 'bg-canvas ring-1 ring-line text-ink-3'}`}>
                  {label}
                </button>
              ))}
            </div>
          </Field>
          {mode === 'time' && (
            <Field label="Time">
              <Select value={time} onChange={(e) => setTime(e.target.value)}>
                {SITE.booking.slots.map((t) => <option key={t}>{t}</option>)}
              </Select>
            </Field>
          )}
          <Field label="Reason (optional)"><Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Public holiday" /></Field>
          <button className="btn-primary w-full py-2.5" onClick={block}><Ban size={16} /> Block this</button>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-display font-semibold flex items-center gap-2"><CalendarClock size={17} className="text-teal-700" /> Blocked off</h3>
        {sorted.length === 0 ? (
          <p className="text-sm text-ink-3 mt-3">Nothing blocked yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {sorted.map((b) => (
              <li key={b.id} className="flex items-center gap-3 py-3">
                <div className="h-9 w-9 rounded-xl bg-canvas flex items-center justify-center text-ink-3 shrink-0">
                  {b.time ? <Clock size={16} /> : <CalendarDays size={16} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{b.date}{b.time ? ` · ${b.time}` : ' · whole day'}</div>
                  {b.reason && <div className="text-xs text-ink-3 truncate">{b.reason}</div>}
                </div>
                <button className="btn-ghost p-2 rounded-lg" onClick={() => removeBlock(b.id)} aria-label="Remove block"><Trash2 size={15} /></button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

/* -------------------- Add appointment (manual) -------------------- */
function AddAppointmentModal({ open, onClose }) {
  const { patients, addAppointment, addBooking } = useData()
  const toast = useToast()
  const [mode, setMode] = useState('patient')
  const [patientId, setPatientId] = useState('')
  const [form, setForm] = useState({ name: '', phone: '', date: '', time: '', type: 'Treatment session', notes: '' })
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const save = async () => {
    if (!form.date || !form.time) { toast('Pick a date and time', 'error'); return }
    if (mode === 'patient') {
      if (!patientId) { toast('Choose a patient', 'error'); return }
      await addAppointment({ patientId, date: form.date, time: form.time, type: form.type, notes: form.notes })
    } else {
      if (!form.name.trim()) { toast('Enter a name', 'error'); return }
      await addBooking({ name: form.name, phone: form.phone, sessionType: form.type, requestedDate: form.date, requestedTime: form.time, notes: form.notes, status: 'confirmed' })
    }
    toast('Appointment added')
    setForm({ name: '', phone: '', date: '', time: '', type: 'Treatment session', notes: '' }); setPatientId('')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Add appointment">
      <p className="text-sm text-ink-3 mb-3">For a phone call or walk-in. Pick an existing patient, or add a one-off by name.</p>
      <div className="flex gap-2 mb-4">
        {[['patient', 'Existing patient', User], ['walkin', 'Phone / walk-in', Phone]].map(([v, l, Icon]) => (
          <button key={v} onClick={() => setMode(v)}
            className={`chip px-3 py-1.5 cursor-pointer ${mode === v ? 'bg-teal-600 text-white' : 'bg-canvas ring-1 ring-line text-ink-3'}`}>
            <Icon size={13} /> {l}
          </button>
        ))}
      </div>
      <div className="space-y-4">
        {mode === 'patient' ? (
          <Field label="Patient">
            <Select value={patientId} onChange={(e) => setPatientId(e.target.value)}>
              <option value="">Choose…</option>
              {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </Field>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Name"><Input value={form.name} onChange={set('name')} placeholder="Caller's name" /></Field>
            <Field label="Phone"><Input value={form.phone} onChange={set('phone')} placeholder="+961 ..." /></Field>
          </div>
        )}
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Date"><Input type="date" min={todayStr()} value={form.date} onChange={set('date')} /></Field>
          <Field label="Time"><Input type="time" value={form.time} onChange={set('time')} /></Field>
          <Field label="Type">
            <Select value={form.type} onChange={set('type')}>
              {['Treatment session', 'Initial assessment', 'Follow-up', 'Review'].map((t) => <option key={t}>{t}</option>)}
            </Select>
          </Field>
        </div>
        <Field label="Notes"><Input value={form.notes} onChange={set('notes')} placeholder="Optional" /></Field>
      </div>
      <div className="flex justify-end gap-2 mt-6">
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={save}><Plus size={15} /> Add appointment</button>
      </div>
    </Modal>
  )
}

/* --------------------------- Calendar tab --------------------------- */
function CalendarTab() {
  const { appointments, bookings, patients } = useData()
  const [cursor, setCursor] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() } })
  const [selected, setSelected] = useState(todayStr())

  const patientName = (id) => patients.find((p) => p.id === id)?.name || 'Patient'
  const patientPhone = (id) => patients.find((p) => p.id === id)?.phone

  const events = useMemo(() => {
    const ev = []
    appointments.forEach((a) => { if (a.date) ev.push({ id: 'a' + a.id, date: a.date, time: a.time, title: patientName(a.patientId), sub: a.type, kind: 'appointment', phone: patientPhone(a.patientId) }) })
    bookings.forEach((b) => { if (b.requestedDate && b.status !== 'declined') ev.push({ id: 'b' + b.id, date: b.requestedDate, time: b.requestedTime, title: b.name, sub: b.sessionType, kind: 'booking', status: b.status, phone: b.phone }) })
    return ev
  }, [appointments, bookings, patients])

  const byDate = useMemo(() => {
    const m = {}
    events.forEach((e) => { (m[e.date] ||= []).push(e) })
    Object.values(m).forEach((list) => list.sort((a, b) => (a.time || '').localeCompare(b.time || '')))
    return m
  }, [events])

  const cells = monthMatrix(cursor.y, cursor.m)
  const cellDate = (d) => `${cursor.y}-${pad2(cursor.m + 1)}-${pad2(d)}`
  const monthName = new Date(cursor.y, cursor.m, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  const shift = (delta) => setCursor((c) => { const d = new Date(c.y, c.m + delta, 1); return { y: d.getFullYear(), m: d.getMonth() } })
  const dayEvents = byDate[selected] || []

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <Card className="p-4 lg:col-span-2">
        <div className="flex items-center justify-between mb-3">
          <button className="btn-ghost p-2 rounded-lg" onClick={() => shift(-1)} aria-label="Previous month"><ChevronLeft size={18} /></button>
          <div className="font-display font-semibold">{monthName}</div>
          <button className="btn-ghost p-2 rounded-lg" onClick={() => shift(1)} aria-label="Next month"><ChevronRight size={18} /></button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-ink-3 mb-1">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (!d) return <div key={i} />
            const ds = cellDate(d)
            const evs = byDate[ds] || []
            const isToday = ds === todayStr()
            const isSel = ds === selected
            return (
              <button key={i} onClick={() => setSelected(ds)}
                className={`min-h-[66px] rounded-lg border p-1 text-left align-top transition ${isSel ? 'border-teal-400 ring-1 ring-teal-200' : 'border-line hover:border-teal-200'} ${isToday ? 'bg-teal-50/50' : 'bg-white'}`}>
                <div className={`text-xs font-semibold ${isToday ? 'text-teal-700' : 'text-ink-3'}`}>{d}</div>
                <div className="space-y-0.5 mt-0.5">
                  {evs.slice(0, 2).map((e) => (
                    <div key={e.id} className={`truncate rounded px-1 text-[10px] leading-4 ${e.kind === 'appointment' ? 'bg-teal-100 text-teal-800' : e.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'}`}>
                      {e.time ? `${e.time} ` : ''}{e.title}
                    </div>
                  ))}
                  {evs.length > 2 && <div className="text-[10px] text-ink-3 px-1">+{evs.length - 2} more</div>}
                </div>
              </button>
            )
          })}
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-display font-semibold">{new Date(selected).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
        {dayEvents.length === 0 ? (
          <p className="text-sm text-ink-3 mt-3">No appointments this day.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {dayEvents.map((e) => (
              <div key={e.id} className="rounded-xl border border-line p-3">
                <div className="flex items-center gap-2">
                  <span className="font-display font-semibold text-sm">{e.time || '—'}</span>
                  <span className="text-sm truncate">{e.title}</span>
                  <Badge color={e.kind === 'appointment' ? 'teal' : e.status === 'pending' ? 'amber' : 'green'} className="ml-auto shrink-0">
                    {e.kind === 'appointment' ? 'patient' : e.status}
                  </Badge>
                </div>
                {e.sub && <div className="text-xs text-ink-3 mt-0.5">{e.sub}</div>}
                <div className="flex flex-wrap gap-2 mt-2">
                  {e.phone && (
                    <a className="btn-secondary text-xs px-2.5 py-1" target="_blank" rel="noopener noreferrer"
                      href={waLink(e.phone, reminderMessage({ name: e.title, date: e.date, time: e.time, clinic: SITE.clinicName }))}>
                      <MessageCircle size={13} className="text-teal-600" /> Remind
                    </a>
                  )}
                  <a className="btn-secondary text-xs px-2.5 py-1" target="_blank" rel="noopener noreferrer"
                    href={googleCalendarLink({ title: `Physio — ${e.title}`, date: e.date, time: e.time, location: SITE.findUs.address })}>
                    <CalendarPlus size={13} className="text-teal-600" /> Google
                  </a>
                  <button className="btn-secondary text-xs px-2.5 py-1"
                    onClick={() => downloadIcs(`appt-${e.title.replace(/\s+/g, '-')}`, buildIcs({ title: `Physio — ${e.title}`, date: e.date, time: e.time, location: SITE.findUs.address }))}>
                    <CalendarDays size={13} className="text-teal-600" /> .ics
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

/* ------------------------------ Page ------------------------------- */
export default function Appointments() {
  const [tab, setTab] = useState('Requests')
  const [addOpen, setAddOpen] = useState(false)
  const { bookings } = useData()
  const pending = bookings.filter((b) => b.status === 'pending').length

  return (
    <div className="space-y-6">
      <AddAppointmentModal open={addOpen} onClose={() => setAddOpen(false)} />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl">Appointments</h1>
          <p className="text-ink-3 text-sm mt-1">
            Website booking requests land in <b>Requests</b>. Accept one (it WhatsApps the client a
            confirmation), decline or reschedule it. See everything on the <b>Calendar</b>, add a
            phone/walk-in booking yourself, send reminders, and block time off.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setAddOpen(true)}><Plus size={16} /> Add appointment</button>
      </div>

      <Tabs
        tabs={['Requests', 'Calendar', 'Availability']}
        active={tab}
        onChange={setTab}
      />

      {tab === 'Requests' && (
        <>
          {pending > 0 && (
            <div className="text-sm text-ink-3">
              <Badge color="amber">{pending} new</Badge> request{pending > 1 ? 's' : ''} awaiting your response.
            </div>
          )}
          <RequestsTab />
        </>
      )}
      {tab === 'Calendar' && <CalendarTab />}
      {tab === 'Availability' && <AvailabilityTab />}
    </div>
  )
}
