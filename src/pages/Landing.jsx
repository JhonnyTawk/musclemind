import { Link } from 'react-router-dom'
import {
  ClipboardList, Dumbbell, Activity, GitBranch, FileBarChart2, ShieldCheck,
  ArrowRight, CheckCircle2, Quote,
} from 'lucide-react'
import { Logo } from '../components/Layout'

const FEATURES = [
  { icon: ClipboardList, title: 'Clinical assessments', text: 'Structured intake covering complaint, pain, ROM, strength, special tests and outcome measures — with an auto-generated summary.' },
  { icon: Dumbbell, title: 'Home exercise programs', text: 'Build plans from a curated library, set dosage per exercise, and share a simple patient-friendly version in one click.' },
  { icon: Activity, title: 'Symptom tracking', text: 'Patients log pain, function and adherence daily. Trends, heatmaps and automatic flags surface what needs attention.' },
  { icon: GitBranch, title: 'ACL rehab timeline', text: 'Criteria-based phase progression from protection to return-to-performance, with milestones, checklists and warnings.' },
  { icon: FileBarChart2, title: 'Progress reports', text: 'Generate assessment, progress, milestone and discharge reports ready to print, export or email.' },
  { icon: ShieldCheck, title: 'Built for clinics', text: 'Role-based access for admins and therapists; patients use secure links — no patient logins to manage.' },
]

const STEPS = [
  { n: '1', title: 'Assess', text: 'Capture a complete clinical picture in one organized form.' },
  { n: '2', title: 'Plan', text: 'Set goals, precautions and a criteria-based plan of care.' },
  { n: '3', title: 'Prescribe', text: 'Assign a home program patients actually understand.' },
  { n: '4', title: 'Track', text: 'Daily symptom logs reveal trends, flags and adherence.' },
  { n: '5', title: 'Progress', text: 'Advance phases on criteria, not the calendar — then discharge with confidence.' },
]

const QUOTES = [
  { name: 'Dr. Nadine A.', role: 'Clinic owner, Beirut', text: 'Our ACL athletes finally progress on criteria instead of guesswork. The phase checklists alone changed how we run reviews.' },
  { name: 'Marc T.', role: 'Sports physiotherapist', text: 'The exercise builder is the first one that feels faster than writing plans by hand — and patients actually read the handouts.' },
  { name: 'Rita S.', role: 'Orthopedic PT', text: 'Symptom flags caught a flare-up two days before the patient would have mentioned it. That is the kind of tool I want.' },
]

export default function Landing() {
  return (
    <div className="min-h-full bg-white">
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur border-b border-line">
        <div className="mx-auto max-w-6xl px-5 h-16 flex items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-ink-3">
            <a href="#features" className="hover:text-ink">Features</a>
            <a href="#workflow" className="hover:text-ink">Workflow</a>
            <a href="#why" className="hover:text-ink">Why clinics use it</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login" className="btn-secondary">Sign in</Link>
            <Link to="/login" className="btn-primary">Get started</Link>
          </div>
        </div>
      </header>

      {/* hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-teal-50/80 via-white to-white" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-5 pt-16 pb-12 lg:pt-24 lg:pb-20 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="chip bg-teal-50 text-teal-800 ring-1 ring-teal-100 mb-5">For physiotherapy clinics</span>
            <h1 className="font-display font-bold text-4xl lg:text-[44px] leading-[1.12] tracking-tight">
              From assessment to recovery, all in one physiotherapy workflow.
            </h1>
            <p className="mt-5 text-lg text-ink-3 max-w-lg">
              Assess patients, build treatment plans, track symptoms, and monitor rehab progression in one modern clinic platform.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/login" className="btn-primary text-base px-6 py-3">Open the clinic demo <ArrowRight size={17} /></Link>
              <a href="#workflow" className="btn-secondary text-base px-6 py-3">See the workflow</a>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-3">
              {['Evidence-informed ACL phases', 'Patient links — no patient logins', 'Free to self-host'].map((t) => (
                <span key={t} className="flex items-center gap-1.5"><CheckCircle2 size={15} className="text-teal-600" /> {t}</span>
              ))}
            </div>
          </div>

          {/* hero visual: ACL phase rail mock */}
          <div className="card shadow-pop p-6 lg:p-7 fade-up">
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="font-display font-semibold">Karim N. — ACL rehab</div>
                <div className="text-xs text-ink-3">Phase 3 · Neuromuscular control · Week 11</div>
              </div>
              <span className="chip bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">On track</span>
            </div>
            <div className="space-y-3">
              {['Protection / Acute', 'Early strength & ROM', 'Neuromuscular control', 'Advanced strength', 'Running & plyometrics'].map((p, i) => (
                <div key={p} className="flex items-center gap-3">
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    i < 2 ? 'bg-teal-600 text-white' : i === 2 ? 'bg-white border-2 border-teal-600 text-teal-700' : 'bg-teal-50 text-teal-300'}`}>
                    {i < 2 ? '✓' : i + 1}
                  </div>
                  <div className="flex-1">
                    <div className={`text-sm font-medium ${i > 2 ? 'text-ink-3/60' : ''}`}>{p}</div>
                    <div className="h-1.5 rounded-full bg-teal-50 mt-1.5 overflow-hidden">
                      <div className="h-full bg-teal-600 rounded-full" style={{ width: i < 2 ? '100%' : i === 2 ? '62%' : '0%' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3 text-center">
              {[['Quad index', '78%'], ['Flexion', '135°'], ['Adherence', '86%']].map(([l, v]) => (
                <div key={l} className="rounded-xl bg-canvas p-3">
                  <div className="font-display font-bold text-lg">{v}</div>
                  <div className="text-[11px] text-ink-3">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* features */}
      <section id="features" className="mx-auto max-w-6xl px-5 py-16 lg:py-20">
        <h2 className="font-display font-bold text-3xl text-center">Everything a rehab caseload needs</h2>
        <p className="text-ink-3 text-center mt-3 max-w-xl mx-auto">One platform for the full clinical loop — designed to be usable mid-consultation, not just after hours.</p>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="card p-6 hover:shadow-pop transition-shadow">
              <div className="h-11 w-11 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-4"><Icon size={21} /></div>
              <h3 className="font-display font-semibold">{title}</h3>
              <p className="text-sm text-ink-3 mt-2 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* workflow */}
      <section id="workflow" className="bg-ink text-white">
        <div className="mx-auto max-w-6xl px-5 py-16 lg:py-20">
          <h2 className="font-display font-bold text-3xl text-center">Assessment to recovery, step by step</h2>
          <div className="mt-12 grid md:grid-cols-5 gap-6">
            {STEPS.map((s, i) => (
              <div key={s.n} className="relative">
                {i < STEPS.length - 1 && <div className="hidden md:block absolute top-5 left-[calc(50%+26px)] right-[-26px] h-px bg-white/15" aria-hidden />}
                <div className="flex md:flex-col items-start md:items-center gap-4 md:text-center">
                  <div className="h-10 w-10 rounded-full bg-teal-600 flex items-center justify-center font-display font-bold shrink-0">{s.n}</div>
                  <div>
                    <div className="font-display font-semibold">{s.title}</div>
                    <p className="text-sm text-teal-50/60 mt-1.5 leading-relaxed">{s.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* why + testimonials */}
      <section id="why" className="mx-auto max-w-6xl px-5 py-16 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <h2 className="font-display font-bold text-3xl">Why clinics use MuscleMind</h2>
            <ul className="mt-6 space-y-4">
              {[
                'Criteria-based progression keeps rehab decisions defensible and consistent across therapists.',
                'Patients log symptoms through a private link — no app installs, no passwords to reset.',
                'Automatic flags (pain rising, missed sessions, red-flag answers) surface risk before the next visit.',
                'Reports that take minutes, not evenings: assessment, progress, milestone and discharge summaries.',
              ].map((t) => (
                <li key={t} className="flex gap-3 text-[15px] text-ink-2">
                  <CheckCircle2 size={19} className="text-teal-600 shrink-0 mt-0.5" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-4">
            {QUOTES.map((q) => (
              <figure key={q.name} className="card p-5">
                <Quote size={18} className="text-teal-300 mb-2" />
                <blockquote className="text-sm leading-relaxed text-ink-2">{q.text}</blockquote>
                <figcaption className="mt-3 text-xs font-semibold text-ink-3">{q.name} · <span className="font-normal">{q.role}</span></figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="card bg-gradient-to-br from-teal-600 to-teal-800 border-0 text-white p-10 text-center">
          <h2 className="font-display font-bold text-3xl">Run your next consultation in MuscleMind</h2>
          <p className="text-teal-50/80 mt-3">The demo clinic is pre-loaded with realistic patients, programs and rehab data.</p>
          <Link to="/login" className="btn bg-white text-teal-800 hover:bg-teal-50 text-base px-7 py-3 mt-7">Open the demo <ArrowRight size={17} /></Link>
        </div>
      </section>

      <footer className="border-t border-line py-8 text-center text-sm text-ink-3">
        <Logo /> <span className="block mt-3">MuscleMind — physiotherapy clinic platform. Demo build.</span>
      </footer>
    </div>
  )
}
