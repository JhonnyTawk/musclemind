import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LockKeyhole, Sparkles } from 'lucide-react'
import { useAuth } from '../context/app'
import { Logo } from '../components/Layout'
import { Field, Input } from '../components/ui'

export default function Login() {
  const { signIn, supabaseConfigured } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (demo = false) => {
    setBusy(true); setError('')
    const { error } = await signIn(demo ? 'lina@musclemind.clinic' : email, demo ? 'demo' : password)
    setBusy(false)
    if (error) { setError(error.message || 'Sign in failed. Check your email and password.'); return }
    navigate(sessionStorage.getItem('mm-onboarded') ? '/app' : '/welcome')
  }

  return (
    <div className="min-h-full grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-ink text-white p-12">
        <Logo light size="lg" />
        <div>
          <h2 className="font-display font-bold text-3xl leading-snug max-w-md">
            The clinic platform built around how physiotherapists actually work.
          </h2>
          <div className="mt-8 space-y-3 text-teal-50/70 text-sm max-w-md">
            <p>Staff sign in here. Patients never need an account — they receive a private link for their exercise plan and daily symptom log.</p>
          </div>
        </div>
        <div className="text-xs text-teal-50/40">© 2026 MuscleMind</div>
      </div>

      <div className="flex items-center justify-center p-6 bg-canvas">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8"><Logo /></div>
          <div className="card p-7">
            <div className="h-11 w-11 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-4"><LockKeyhole size={20} /></div>
            <h1 className="font-display font-bold text-2xl">Staff sign in</h1>
            <p className="text-sm text-ink-3 mt-1.5">For clinic administrators and therapists.</p>

            <div className="mt-6 space-y-4">
              <Field label="Email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@clinic.com" autoComplete="email" /></Field>
              <Field label="Password"><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password"
                onKeyDown={(e) => e.key === 'Enter' && submit()} /></Field>
              {error && <p className="text-sm text-danger">{error}</p>}
              <button className="btn-primary w-full py-2.5" disabled={busy} onClick={() => submit()}>
                {busy ? 'Signing in…' : 'Sign in'}
              </button>
              {!supabaseConfigured && (
                <>
                  <div className="flex items-center gap-3 text-xs text-ink-3"><span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" /></div>
                  <button className="btn-secondary w-full py-2.5" disabled={busy} onClick={() => submit(true)}>
                    <Sparkles size={16} className="text-teal-600" /> Enter demo clinic
                  </button>
                  <p className="text-xs text-ink-3 text-center">Demo mode — Supabase isn't connected yet, so data lives in this session.</p>
                </>
              )}
            </div>
          </div>
          <p className="text-center text-sm text-ink-3 mt-5">
            Looking for your exercise plan? Use the private link your therapist sent you.
          </p>
          <p className="text-center text-sm mt-2"><Link to="/" className="text-teal-700 font-medium hover:underline">← Back to site</Link></p>
        </div>
      </div>
    </div>
  )
}
