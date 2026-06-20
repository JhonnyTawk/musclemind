import { useNavigate } from 'react-router-dom'
import { ClipboardList, Dumbbell, Activity, GitBranch, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/app'
import { Logo } from '../components/Layout'

const CARDS = [
  { icon: ClipboardList, title: 'Run an assessment', text: 'A full clinical intake with a live summary that writes itself.', to: '/app/assessment' },
  { icon: Dumbbell, title: 'Build an exercise plan', text: 'Drag exercises from the library, set dosage, share with the patient.', to: '/app/exercises' },
  { icon: Activity, title: 'Review symptom trends', text: 'See pain, adherence and flags across your caseload.', to: '/app/symptoms' },
  { icon: GitBranch, title: 'Check ACL progressions', text: 'Criteria-based phases with milestones and warnings.', to: '/app/acl' },
]

export default function Onboarding() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const go = (to) => { sessionStorage.setItem('mm-onboarded', '1'); navigate(to) }
  return (
    <div className="min-h-full bg-canvas flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <Logo />
        <h1 className="font-display font-bold text-3xl mt-8">Welcome, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-ink-3 mt-2">Your clinic is set up with sample patients so everything is ready to explore. Where would you like to start?</p>
        <div className="grid sm:grid-cols-2 gap-4 mt-8">
          {CARDS.map(({ icon: Icon, title, text, to }) => (
            <button key={title} onClick={() => go(to)} className="card p-5 text-left hover:shadow-pop hover:border-teal-200 transition group">
              <div className="h-10 w-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-3 group-hover:bg-teal-600 group-hover:text-white transition-colors"><Icon size={19} /></div>
              <div className="font-display font-semibold">{title}</div>
              <p className="text-sm text-ink-3 mt-1">{text}</p>
            </button>
          ))}
        </div>
        <button className="btn-primary mt-8" onClick={() => go('/app')}>Go to dashboard <ArrowRight size={16} /></button>
      </div>
    </div>
  )
}
