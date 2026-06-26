// ============================================================
// Scheduling helpers — booking reminders without any paid API.
//   * waLink()      → one-click pre-filled WhatsApp to a number
//   * downloadIcs() → calendar file both sides can add (auto-reminds)
//   * slot helpers  → hide times the clinic has blocked
// ============================================================

// Normalize a phone number to international digits for wa.me.
// Best-effort for Lebanon: a leading 0 is treated as +961.
export function toIntlDigits(phone, defaultCc = '961') {
  let d = String(phone || '').replace(/[^\d]/g, '')
  if (!d) return ''
  if (d.startsWith('00')) d = d.slice(2)
  else if (d.startsWith('0')) d = defaultCc + d.slice(1)
  return d
}

// Pre-filled WhatsApp link to a specific person.
export function waLink(phone, message) {
  return `https://wa.me/${toIntlDigits(phone)}?text=${encodeURIComponent(message)}`
}

// ---- Pre-written messages (edit wording freely) ----
export function confirmMessage({ name, date, time, clinic }) {
  return (
    `Hi ${name || 'there'}! Your appointment at ${clinic} is confirmed for ` +
    `${date} at ${time}. See you then. Reply here if you need to reschedule.`
  )
}

export function reminderMessage({ name, date, time, clinic }) {
  return (
    `Reminder: Hi ${name || 'there'}, this is a friendly reminder of your ` +
    `appointment at ${clinic} on ${date} at ${time}. See you soon!`
  )
}

// ---- Calendar (.ics) ----
function icsStamp(date, time) {
  // date "YYYY-MM-DD", time "HH:MM" → "YYYYMMDDTHHMMSS" (floating local time)
  const [y, m, d] = date.split('-')
  const [hh = '09', mm = '00'] = (time || '09:00').split(':')
  return `${y}${m}${d}T${hh}${mm}00`
}

function addMinutes(date, time, minutes) {
  const [y, m, d] = date.split('-').map(Number)
  const [hh, mm] = (time || '09:00').split(':').map(Number)
  const dt = new Date(y, m - 1, d, hh, mm + minutes)
  const p = (n) => String(n).padStart(2, '0')
  return `${dt.getFullYear()}${p(dt.getMonth() + 1)}${p(dt.getDate())}T${p(dt.getHours())}${p(dt.getMinutes())}00`
}

export function buildIcs({ title, description = '', location = '', date, time, durationMin = 45 }) {
  const uid = `mm-${date}-${(time || '').replace(':', '')}-${Math.random().toString(36).slice(2, 8)}@musclemind`
  const esc = (s) => String(s).replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n')
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MuscleMind//Booking//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTART:${icsStamp(date, time)}`,
    `DTEND:${addMinutes(date, time, durationMin)}`,
    `SUMMARY:${esc(title)}`,
    description && `DESCRIPTION:${esc(description)}`,
    location && `LOCATION:${esc(location)}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    `DESCRIPTION:${esc(title)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n')
}

// "Add to Google Calendar" link — free, no API. Opens a pre-filled event.
export function googleCalendarLink({ title, date, time, durationMin = 45, details = '', location = '' }) {
  if (!date) return ''
  const [y, m, d] = date.split('-')
  const [hh = '09', mm = '00'] = (time || '09:00').split(':')
  const start = `${y}${m}${d}T${hh}${mm}00`
  const end = addMinutes(date, time, durationMin)
  const params = new URLSearchParams({ action: 'TEMPLATE', text: title || 'Appointment', dates: `${start}/${end}`, details, location })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

// Trigger a browser download of an .ics file.
export function downloadIcs(filename, icsText) {
  const blob = new Blob([icsText], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.ics') ? filename : `${filename}.ics`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// ---- Availability ----
// A block is { date, time }. time === null/'' means the whole day is blocked.
export function isSlotBlocked(blocks, date, time) {
  return (blocks || []).some((b) => b.date === date && (!b.time || b.time === time))
}

export function isDayBlocked(blocks, date) {
  return (blocks || []).some((b) => b.date === date && (!b.time || b.time === ''))
}

export function availableSlots(allSlots, blocks, date) {
  if (!date) return allSlots
  if (isDayBlocked(blocks, date)) return []
  return allSlots.filter((t) => !isSlotBlocked(blocks, date, t))
}
