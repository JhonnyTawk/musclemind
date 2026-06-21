import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, CheckCircle2, Quote, CalendarDays, MapPin, Clock,
  Phone, Mail, MessageCircle, Star, User,
} from 'lucide-react'
import { Logo } from '../components/Layout'
import { Field, Input, Textarea, Select } from '../components/ui'
import { useData } from '../context/app'
import { availableSlots } from '../lib/schedule'
import { SITE, whatsappLink, mapEmbedUrl } from '../config/site'

const NAV_LINKS = [
  { href: '#about', label: 'About' },
  { href: '#testimonials', label: 'Testimonials' },
  { href: '#book', label: 'Book' },
  { href: '#find-us', label: 'Find us' },
  { href: '#contact', label: 'Contact' },
]

/* ----------------------------- Booking ----------------------------- */
function BookingForm() {
  const today = new Date().toISOString().slice(0, 10)
  const { addBooking, availabilityBlocks } = useData()
  const [form, setForm] = useState({
    name: '', phone: '', type: SITE.booking.sessionTypes[0], date: '', time: '', notes: '',
  })
  const [errors, setErrors] = useState({})
  const [sent, setSent] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value, ...(k === 'date' ? { time: '' } : null) })

  // Hide any times the clinic has blocked for the chosen date.
  const slots = useMemo(
    () => availableSlots(SITE.booking.slots, availabilityBlocks, form.date),
    [availabilityBlocks, form.date],
  )
  const dayFull = Boolean(form.date) && slots.length === 0

  const submit = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Please enter your name'
    if (!form.phone.trim()) errs.phone = 'Please enter a phone number'
    if (!form.date) errs.date = 'Pick a date'
    if (!form.time) errs.time = 'Pick a time'
    setErrors(errs)
    if (Object.keys(errs).length) return

    // Save the request so it appears in the clinic dashboard…
    addBooking({
      name: form.name, phone: form.phone, sessionType: form.type,
      requestedDate: form.date, requestedTime: form.time, notes: form.notes,
    })

    // …and open a pre-filled WhatsApp so the clinic is notified instantly.
    const msg =
      `New appointment request — ${SITE.clinicName}\n\n` +
      `Name: ${form.name}\n` +
      `Phone: ${form.phone}\n` +
      `Session: ${form.type}\n` +
      `Preferred date: ${form.date}\n` +
      `Preferred time: ${form.time}\n` +
      (form.notes.trim() ? `Notes: ${form.notes}\n` : '')
    window.open(whatsappLink(msg), '_blank', 'noopener')
    setSent(true)
  }

  if (sent) {
    return (
      <div className="card p-8 text-center">
        <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={24} />
        </div>
        <h3 className="font-display font-bold text-xl">Almost done!</h3>
        <p className="text-ink-3 mt-2 text-sm max-w-sm mx-auto">
          Your booking request opened in WhatsApp — just press send and we'll confirm your
          appointment shortly. Didn't open?{' '}
          <a className="text-teal-700 font-medium hover:underline" href={whatsappLink(
            `Appointment request — ${form.name}, ${form.date} ${form.time}`)} target="_blank" rel="noopener noreferrer">
            Tap here to send it
          </a>.
        </p>
        <button className="btn-secondary mt-6" onClick={() => { setSent(false); setForm({ ...form, notes: '' }) }}>
          Book another time
        </button>
      </div>
    )
  }

  return (
    <div className="card p-6 lg:p-7">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Your name" error={errors.name}>
          <Input value={form.name} onChange={set('name')} placeholder="e.g. Layla Karam" />
        </Field>
        <Field label="Phone / WhatsApp" error={errors.phone}>
          <Input value={form.phone} onChange={set('phone')} placeholder="+961 ..." />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Session type">
            <Select value={form.type} onChange={set('type')}>
              {SITE.booking.sessionTypes.map((t) => <option key={t}>{t}</option>)}
            </Select>
          </Field>
        </div>
        <Field label="Preferred date" error={errors.date}>
          <Input type="date" min={today} value={form.date} onChange={set('date')} />
        </Field>
        <Field label="Preferred time" error={errors.time}
          hint={dayFull ? 'Fully booked that day — please pick another date.' : undefined}>
          <Select value={form.time} onChange={set('time')} disabled={!form.date || dayFull}>
            <option value="">{!form.date ? 'Pick a date first…' : dayFull ? 'No times available' : 'Select a time…'}</option>
            {slots.map((t) => <option key={t}>{t}</option>)}
          </Select>
        </Field>
        <div className="sm:col-span-2">
          <Field label="Anything we should know?" hint="Injury, goals, or a question — optional">
            <Textarea value={form.notes} onChange={set('notes')} placeholder="Optional" />
          </Field>
        </div>
      </div>
      <button className="btn-primary w-full py-3 mt-5 text-base" onClick={submit}>
        <MessageCircle size={18} /> Request via WhatsApp
      </button>
      <p className="text-xs text-ink-3 text-center mt-3">
        Sends your request straight to the clinic on WhatsApp. We'll reply to confirm your slot.
      </p>
    </div>
  )
}

/* ----------------------------- Contact ----------------------------- */
function ContactForm() {
  const [form, setForm] = useState({ name: '', message: '' })
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const send = () => {
    const msg = `Message for ${SITE.clinicName}\n\nFrom: ${form.name || 'Website visitor'}\n\n${form.message}`
    window.open(whatsappLink(msg), '_blank', 'noopener')
  }
  return (
    <div className="card p-6 lg:p-7">
      <Field label="Your name">
        <Input value={form.name} onChange={set('name')} placeholder="Your name" />
      </Field>
      <div className="mt-4">
        <Field label="Message">
          <Textarea value={form.message} onChange={set('message')} placeholder="How can we help?" />
        </Field>
      </div>
      <button className="btn-primary w-full py-3 mt-5" onClick={send} disabled={!form.message.trim()}>
        <MessageCircle size={18} /> Send via WhatsApp
      </button>
    </div>
  )
}

/* ------------------------------ Page ------------------------------- */
export default function Landing() {
  const mapUrl = useMemo(() => mapEmbedUrl(), [])

  // Smooth-scroll to a section. Needed because the app uses a hash router,
  // which would otherwise treat "#about" as a route instead of an anchor.
  const handleNav = (e) => {
    const id = e.currentTarget.getAttribute('href')?.replace('#', '')
    const el = id && document.getElementById(id)
    if (!el) return
    e.preventDefault()
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 72, behavior: 'smooth' })
  }

  return (
    <div className="min-h-full bg-white">
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur border-b border-line">
        <div className="mx-auto max-w-6xl px-5 h-16 flex items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-ink-3">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={handleNav} className="hover:text-ink">{l.label}</a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <a href="#book" onClick={handleNav} className="btn-primary">Book an appointment</a>
            <Link to="/login" className="btn-secondary hidden sm:inline-flex">Staff login</Link>
          </div>
        </div>
      </header>

      {/* hero — no patient data */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-teal-50/80 via-white to-white" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-5 pt-16 pb-14 lg:pt-24 lg:pb-20 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="chip bg-teal-50 text-teal-800 ring-1 ring-teal-100 mb-5">{SITE.tagline}</span>
            <h1 className="font-display font-bold text-4xl lg:text-[46px] leading-[1.1] tracking-tight">
              Move better. Recover stronger.
            </h1>
            <p className="mt-5 text-lg text-ink-3 max-w-lg">{SITE.heroSubtitle}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#book" onClick={handleNav} className="btn-primary text-base px-6 py-3">Book an appointment <ArrowRight size={17} /></a>
              <a href="#about" onClick={handleNav} className="btn-secondary text-base px-6 py-3">Learn more</a>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-3">
              {['One-on-one care', 'Personalized home program', 'Clear, measurable progress'].map((t) => (
                <span key={t} className="flex items-center gap-1.5"><CheckCircle2 size={15} className="text-teal-600" /> {t}</span>
              ))}
            </div>
          </div>

          {/* hero visual — generic, no patient information */}
          <div className="card shadow-pop p-8 lg:p-10 fade-up bg-gradient-to-br from-white to-teal-50/40">
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: CalendarDays, title: 'Easy booking', text: 'Request a time in seconds — confirmed over WhatsApp.' },
                { icon: User, title: 'One practitioner', text: 'The same physio from assessment to discharge.' },
                { icon: Star, title: 'Tailored plans', text: 'A home program built around your goals.' },
                { icon: CheckCircle2, title: 'Real progress', text: 'Track recovery you can actually see and feel.' },
              ].map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-2xl bg-white border border-line p-4">
                  <div className="h-10 w-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-3"><Icon size={20} /></div>
                  <div className="font-display font-semibold text-sm">{title}</div>
                  <p className="text-xs text-ink-3 mt-1 leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* About Us */}
      <section id="about" className="mx-auto max-w-6xl px-5 py-16 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <span className="chip bg-teal-50 text-teal-800 ring-1 ring-teal-100 mb-4">About us</span>
            <h2 className="font-display font-bold text-3xl">Care that actually knows you</h2>
            <div className="mt-5 space-y-4 text-[15px] text-ink-2 leading-relaxed">
              {SITE.about.body.map((p, i) => <p key={i}>{p}</p>)}
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {SITE.about.focusAreas.map((f) => (
                <span key={f} className="chip bg-canvas ring-1 ring-line text-ink-2 px-3 py-1.5">{f}</span>
              ))}
            </div>
          </div>
          <div className="card p-7 bg-ink text-white">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-teal-600 flex items-center justify-center font-display font-bold text-xl shrink-0">
                {(SITE.about.practitionerName || '?').split(' ').map((w) => w[0]).slice(0, 2).join('')}
              </div>
              <div>
                <div className="font-display font-bold text-lg">{SITE.about.practitionerName}</div>
                <div className="text-sm text-teal-50/70">{SITE.about.practitionerTitle}</div>
              </div>
            </div>
            <p className="mt-6 text-sm text-teal-50/80 leading-relaxed">
              “My promise is simple: you'll always know what we're working on, why it matters,
              and how far you've come. Recovery is a partnership.”
            </p>
            <a href="#book" onClick={handleNav} className="btn bg-white text-teal-800 hover:bg-teal-50 mt-7 w-full py-2.5">
              Book with {SITE.about.practitionerName.split(' ')[0]} <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="bg-canvas border-y border-line">
        <div className="mx-auto max-w-6xl px-5 py-16 lg:py-20">
          <div className="text-center max-w-xl mx-auto">
            <span className="chip bg-teal-50 text-teal-800 ring-1 ring-teal-100 mb-4">Testimonials</span>
            <h2 className="font-display font-bold text-3xl">What patients say</h2>
            <p className="text-ink-3 mt-3">Real recoveries, in their own words.</p>
          </div>
          <div className="mt-10 grid md:grid-cols-3 gap-5">
            {SITE.testimonials.map((q) => (
              <figure key={q.name} className="card p-6 flex flex-col">
                <Quote size={20} className="text-teal-300 mb-3" />
                <blockquote className="text-[15px] leading-relaxed text-ink-2 flex-1">{q.quote}</blockquote>
                <figcaption className="mt-4 flex items-center gap-3 border-t border-line pt-4">
                  <div className="h-9 w-9 rounded-full bg-teal-100 text-teal-800 font-display font-semibold text-sm flex items-center justify-center">
                    {q.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-ink">{q.name}</div>
                    <div className="text-xs text-ink-3">{q.context}</div>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Book an Appointment */}
      <section id="book" className="mx-auto max-w-6xl px-5 py-16 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div className="lg:pt-4">
            <span className="chip bg-teal-50 text-teal-800 ring-1 ring-teal-100 mb-4">Book an appointment</span>
            <h2 className="font-display font-bold text-3xl">Reserve your session in under a minute</h2>
            <p className="text-ink-3 mt-4 text-[15px] leading-relaxed max-w-md">
              Pick a date and time that suits you and send your request — it lands directly on
              our WhatsApp and we'll reply to confirm. No accounts, no waiting on hold.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                ['Flexible times', 'Choose from available morning and afternoon slots.'],
                ['Quick confirmation', 'We reply on WhatsApp to lock in your appointment.'],
                ['Friendly reminders', 'You\'ll get a reminder before your session.'],
              ].map(([t, s]) => (
                <li key={t} className="flex gap-3">
                  <CheckCircle2 size={19} className="text-teal-600 shrink-0 mt-0.5" />
                  <span className="text-[15px] text-ink-2"><b className="font-semibold text-ink">{t}.</b> {s}</span>
                </li>
              ))}
            </ul>
          </div>
          <BookingForm />
        </div>
      </section>

      {/* Find Us */}
      <section id="find-us" className="bg-canvas border-y border-line">
        <div className="mx-auto max-w-6xl px-5 py-16 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-10 items-stretch">
            <div>
              <span className="chip bg-teal-50 text-teal-800 ring-1 ring-teal-100 mb-4">Find us</span>
              <h2 className="font-display font-bold text-3xl">Visit the clinic</h2>
              <div className="mt-6 space-y-5">
                <div className="flex gap-3">
                  <div className="h-10 w-10 rounded-xl bg-white border border-line text-teal-700 flex items-center justify-center shrink-0"><MapPin size={19} /></div>
                  <div>
                    <div className="font-display font-semibold text-sm">Address</div>
                    <p className="text-sm text-ink-3 mt-0.5">{SITE.findUs.address}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="h-10 w-10 rounded-xl bg-white border border-line text-teal-700 flex items-center justify-center shrink-0"><Clock size={19} /></div>
                  <div>
                    <div className="font-display font-semibold text-sm">Opening hours</div>
                    <ul className="text-sm text-ink-3 mt-1 space-y-0.5">
                      {SITE.findUs.hours.map((h) => (
                        <li key={h.days} className="flex justify-between gap-6 max-w-xs">
                          <span>{h.days}</span><span className="font-medium text-ink-2">{h.time}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <a href={`https://www.google.com/maps?q=${encodeURIComponent(SITE.findUs.mapQuery)}`}
                  target="_blank" rel="noopener noreferrer" className="btn-secondary">
                  <MapPin size={16} /> Open in Google Maps
                </a>
              </div>
            </div>
            <div className="card overflow-hidden min-h-[320px] p-0">
              <iframe
                title="Clinic location"
                src={mapUrl}
                className="w-full h-full min-h-[320px] border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Contact Us */}
      <section id="contact" className="mx-auto max-w-6xl px-5 py-16 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <span className="chip bg-teal-50 text-teal-800 ring-1 ring-teal-100 mb-4">Contact us</span>
            <h2 className="font-display font-bold text-3xl">Questions? Get in touch</h2>
            <p className="text-ink-3 mt-4 text-[15px] leading-relaxed max-w-md">
              Not sure which session you need, or have a question before booking? Send a message
              and we'll get back to you.
            </p>
            <div className="mt-7 space-y-3">
              <a href={`mailto:${SITE.contact.email}`} className="flex items-center gap-3 group">
                <div className="h-10 w-10 rounded-xl bg-canvas border border-line text-teal-700 flex items-center justify-center"><Mail size={18} /></div>
                <span className="text-sm text-ink-2 group-hover:text-teal-800">{SITE.contact.email}</span>
              </a>
              <a href={`tel:${SITE.contact.phoneDisplay.replace(/\s/g, '')}`} className="flex items-center gap-3 group">
                <div className="h-10 w-10 rounded-xl bg-canvas border border-line text-teal-700 flex items-center justify-center"><Phone size={18} /></div>
                <span className="text-sm text-ink-2 group-hover:text-teal-800">{SITE.contact.phoneDisplay}</span>
              </a>
              <a href={whatsappLink(`Hi ${SITE.clinicName}, I have a question.`)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 group">
                <div className="h-10 w-10 rounded-xl bg-canvas border border-line text-teal-700 flex items-center justify-center"><MessageCircle size={18} /></div>
                <span className="text-sm text-ink-2 group-hover:text-teal-800">Chat on WhatsApp</span>
              </a>
            </div>
          </div>
          <ContactForm />
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="card bg-gradient-to-br from-teal-600 to-teal-800 border-0 text-white p-10 text-center">
          <h2 className="font-display font-bold text-3xl">Ready to start your recovery?</h2>
          <p className="text-teal-50/80 mt-3">Book an appointment today — it only takes a minute.</p>
          <a href="#book" onClick={handleNav} className="btn bg-white text-teal-800 hover:bg-teal-50 text-base px-7 py-3 mt-7">
            Book an appointment <ArrowRight size={17} />
          </a>
        </div>
      </section>

      <footer className="border-t border-line py-8 text-center text-sm text-ink-3">
        <Logo />
        <span className="block mt-3">
          {SITE.clinicName} · {SITE.findUs.address}
        </span>
        <span className="block mt-1 text-ink-3/70">© {new Date().getFullYear()} {SITE.clinicName}. All rights reserved.</span>
      </footer>
    </div>
  )
}
