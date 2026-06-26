import { useMemo, useState } from 'react'
import {
  CalendarDays, CalendarClock, MessageCircle, CalendarPlus, Check, X,
  Trash2, Ban, Bell, Clock, RefreshCw,
} from 'lucide-react'
import { useData, useToast } from '../context/app'
import { Card, Badge, Field, Input, Select, Tabs, EmptyState } from '../components/ui'
import { SITE } from '../config/site'
import {
  waLink, confirmMessage, reminderMessage, buildIcs, downloadIcs,
} from '../lib/schedule'

const STATUS_COLOR = { pending: 'amber', confirmed: 'green', declined: 'slate', done: 'blue' }
const todayStr = () => new Date().toISOString().slice(0, 10)
const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10) }

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

/* ------------------------------ Page ------------------------------- */
export default function Appointments() {
  const [tab, setTab] = useState('Requests')
  const { bookings } = useData()
  const pending = bookings.filter((b) => b.status === 'pending').length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl">Appointments</h1>
        <p className="text-ink-3 text-sm mt-1">
          Booking requests from your website land here. Accept one (it WhatsApps the client a
          confirmation), decline it, or change the date/time to reschedule — plus send reminders
          and block time off.
        </p>
      </div>

      <Tabs
        tabs={['Requests', 'Availability']}
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
      {tab === 'Availability' && <AvailabilityTab />}
    </div>
  )
}
