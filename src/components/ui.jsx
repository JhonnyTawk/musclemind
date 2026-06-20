import { useEffect, useState } from 'react'
import { ChevronDown, X, Inbox } from 'lucide-react'

export const Card = ({ className = '', children, ...rest }) => (
  <div className={`card ${className}`} {...rest}>{children}</div>
)

export const CardHeader = ({ title, sub, right }) => (
  <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
    <div>
      <h3 className="font-display font-semibold text-[15px] text-ink">{title}</h3>
      {sub && <p className="text-xs text-ink-3 mt-0.5">{sub}</p>}
    </div>
    {right}
  </div>
)

const badgeStyles = {
  teal: 'bg-teal-50 text-teal-800 ring-1 ring-teal-100',
  green: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
  amber: 'bg-amber-50 text-amber-800 ring-1 ring-amber-100',
  red: 'bg-red-50 text-red-700 ring-1 ring-red-100',
  slate: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
  blue: 'bg-sky-50 text-sky-700 ring-1 ring-sky-100',
}
export const Badge = ({ color = 'slate', children, className = '' }) => (
  <span className={`chip ${badgeStyles[color]} ${className}`}>{children}</span>
)

export const StatusBadge = ({ status }) => (
  <Badge color={status === 'Active' ? 'green' : status === 'Discharged' ? 'slate' : 'amber'}>
    <span className={`h-1.5 w-1.5 rounded-full ${status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
    {status}
  </Badge>
)

export const PainBadge = ({ score }) => (
  <Badge color={score >= 7 ? 'red' : score >= 4 ? 'amber' : 'green'}>{score}/10</Badge>
)

export const ProgressBar = ({ value, color = 'bg-teal-600', className = '' }) => (
  <div className={`h-2 w-full rounded-full bg-teal-50 overflow-hidden ${className}`}>
    <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
  </div>
)

export const Stat = ({ icon: Icon, label, value, sub, tone = 'teal' }) => (
  <Card className="p-5 flex items-start gap-4">
    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
      tone === 'amber' ? 'bg-amber-50 text-amber2' : tone === 'red' ? 'bg-red-50 text-danger' : tone === 'green' ? 'bg-emerald-50 text-ok' : 'bg-teal-50 text-teal-700'}`}>
      <Icon size={19} strokeWidth={2.2} />
    </div>
    <div className="min-w-0">
      <div className="text-[26px] leading-7 font-display font-bold">{value}</div>
      <div className="text-xs font-medium text-ink-3 mt-1">{label}</div>
      {sub && <div className="text-xs text-ink-3/80 mt-0.5">{sub}</div>}
    </div>
  </Card>
)

export function Tabs({ tabs, active, onChange, className = '' }) {
  return (
    <div className={`flex gap-1 overflow-x-auto border-b border-line ${className}`} role="tablist">
      {tabs.map((t) => (
        <button key={t} role="tab" aria-selected={active === t} onClick={() => onChange(t)}
          className={`px-3.5 py-2.5 text-sm font-medium whitespace-nowrap rounded-t-lg border-b-2 -mb-px transition-colors ${
            active === t ? 'border-teal-600 text-teal-800' : 'border-transparent text-ink-3 hover:text-ink hover:bg-teal-50/60'}`}>
          {t}
        </button>
      ))}
    </div>
  )
}

export function Accordion({ title, badge, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <Card className="overflow-hidden">
      <button onClick={() => setOpen(!open)} aria-expanded={open}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-teal-50/40 transition-colors">
        <div className="flex items-center gap-3">
          <span className="font-display font-semibold text-[15px]">{title}</span>
          {badge}
        </div>
        <ChevronDown size={18} className={`text-ink-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-5 pb-5 pt-1 border-t border-line fade-up">{children}</div>}
    </Card>
  )
}

export function Modal({ open, onClose, title, children, wide = false }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className={`relative card shadow-pop w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} max-h-[88vh] overflow-y-auto fade-up`} role="dialog" aria-modal="true">
        <div className="flex items-center justify-between px-6 pt-5 pb-3 sticky top-0 bg-white rounded-t-2xl border-b border-line z-10">
          <h3 className="font-display font-semibold text-lg">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="btn-ghost p-2 rounded-lg"><X size={18} /></button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

export const EmptyState = ({ icon: Icon = Inbox, title, sub, action }) => (
  <div className="flex flex-col items-center justify-center text-center py-12 px-6">
    <div className="h-12 w-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-3">
      <Icon size={22} />
    </div>
    <div className="font-display font-semibold">{title}</div>
    {sub && <p className="text-sm text-ink-3 mt-1 max-w-xs">{sub}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
)

export const Field = ({ label, children, hint, error }) => (
  <div>
    <label className="label">{label}</label>
    {children}
    {hint && !error && <p className="text-xs text-ink-3 mt-1">{hint}</p>}
    {error && <p className="text-xs text-danger mt-1">{error}</p>}
  </div>
)

export const Input = (props) => <input className="input" {...props} />
export const Select = ({ children, ...props }) => <select className="input" {...props}>{children}</select>
export const Textarea = (props) => <textarea className="input min-h-[84px]" {...props} />

export function Toggle({ checked, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      className="flex items-center gap-3 group">
      <span className={`h-6 w-11 rounded-full p-0.5 transition-colors ${checked ? 'bg-teal-600' : 'bg-slate-300'}`}>
        <span className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </span>
      {label && <span className="text-sm font-medium text-ink group-hover:text-teal-800">{label}</span>}
    </button>
  )
}

export const Avatar = ({ name, size = 'md', className = '' }) => {
  const initials = (name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  const s = size === 'sm' ? 'h-8 w-8 text-xs' : size === 'lg' ? 'h-14 w-14 text-lg' : 'h-10 w-10 text-sm'
  return (
    <div className={`${s} rounded-full bg-teal-100 text-teal-800 font-display font-semibold flex items-center justify-center shrink-0 ${className}`}>
      {initials}
    </div>
  )
}

export const Scale10 = ({ value, onChange, max = 10 }) => (
  <div className="flex flex-wrap gap-1.5">
    {Array.from({ length: max + 1 }, (_, i) => (
      <button key={i} type="button" onClick={() => onChange(i)}
        className={`h-9 w-9 rounded-lg text-sm font-semibold transition-colors ${
          value === i ? (i >= 7 ? 'bg-danger text-white' : i >= 4 ? 'bg-amber-500 text-white' : 'bg-teal-600 text-white')
            : 'bg-white border border-line text-ink-3 hover:border-teal-300 hover:text-ink'}`}>
        {i}
      </button>
    ))}
  </div>
)
