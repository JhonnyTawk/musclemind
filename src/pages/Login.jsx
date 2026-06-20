import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LockKeyhole, AlertTriangle } from 'lucide-react'
import { useAuth } from '../context/app'
import { Logo } from '../components/Layout'
import { Field, Input } from '../components/ui'

export default function Login() {
  const { signIn, user, supabaseConfigured } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // After auth resolves the user's role, send them to the right place.
  useEffect(() => {
    if (!submitted || !user) return
    if (user.role === 'patient') navigate('/portal')
    else if (user.role === 'admin' || user.role === 'therapist') navigate('/app')
    else setError('This account isn’t linked to a clinic profile or patient yet.')
  }, [submitted, user, navigate])

  const submit = async () => {
    setBusy(true); setError('')
    const { error } = await signIn(email, password)
    setBusy(false)
    if (error) { setError(error.message || 'Sign in failed. Check your email and password.'); return }
    setSubmitted(true)
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
            <p>Sign in to manage patients and appointments. Patients sign in here too — with the
              private login their physiotherapist creates for them — to see their own plan.</p>
          </div>
        </div>
        <div className="text-xs text-teal-50/40">© {new Date().getFullYear()} MuscleMind</div>
      </div>

      <div className="flex items-center justify-center p-6 bg-canvas">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8"><Logo /></div>
          <div className="card p-7">
            <div className="h-11 w-11 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-4"><LockKeyhole size={20} /></div>
            <h1 className="font-display font-bold text-2xl">Sign in</h1>
            <p className="text-sm text-ink-3 mt-1.5">Clinic staff and patients.</p>

            {!supabaseConfigured ? (
              <div className="mt-6 rounded-xl bg-amber-50 border border-amber-100 p-4 text-sm text-amber-900 flex gap-3">
                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                <span>The app isn’t connected to its database yet. Add your Supabase keys (see <b>SETUP.md</b>) and redeploy to enable sign-in.</span>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                <Field label="Email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" autoComplete="email" /></Field>
                <Field label="Password"><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password"
                  onKeyDown={(e) => e.key === 'Enter' && submit()} /></Field>
                {error && <p className="text-sm text-danger">{error}</p>}
                <button className="btn-primary w-full py-2.5" disabled={busy} onClick={submit}>
                  {busy ? 'Signing in…' : 'Sign in'}
                </button>
              </div>
            )}
          </div>
          <p className="text-center text-sm text-ink-3 mt-5">
            Patients: use the private login your physiotherapist sent you.
          </p>
          <p className="text-center text-sm mt-2"><Link to="/" className="text-teal-700 font-medium hover:underline">← Back to site</Link></p>
        </div>
      </div>
    </div>
  )
}
