// Seeded demo data for MuscleMind. Mirrors the Supabase schema so the
// data layer can swap sources transparently.

const daysAgo = (n) => {
  const d = new Date(); d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

export const THERAPISTS = [
  { id: 't1', name: 'Dr. Lina Khoury', role: 'admin', title: 'Clinic Director · PT, DPT', email: 'lina@musclemind.clinic' },
  { id: 't2', name: 'Omar Haddad', role: 'therapist', title: 'Sports Physiotherapist', email: 'omar@musclemind.clinic' },
  { id: 't3', name: 'Maya Saab', role: 'therapist', title: 'Orthopedic Physiotherapist', email: 'maya@musclemind.clinic' },
]

export const PATIENTS = [
  {
    id: 'p1', code: 'MM-1042', name: 'Karim Nassar', age: 24, gender: 'Male',
    phone: '+961 71 220 134', email: 'karim.n@example.com', occupation: 'University student',
    activity: 'Football (semi-pro)', complaint: 'Right knee instability after ACL reconstruction',
    diagnosis: 'ACL reconstruction (hamstring graft) — 11 weeks post-op', therapistId: 't2',
    lastVisit: daysAgo(2), status: 'Active', painNow: 3, adherence: 86, rehabPhase: 3,
    history: 'ACL rupture during match (non-contact pivot), surgery 11 weeks ago. No previous knee injuries.',
    surgical: 'ACL reconstruction, hamstring autograft (right knee).',
    medications: 'Paracetamol PRN', goals: 'Return to competitive football next season; run pain-free by month 4.',
    redFlags: 'None identified', frequency: '2×/week', shareToken: 'demo-karim',
    progress: 'ROM nearly full (0–135°). Quad symmetry 78%. Started single-leg control work.',
    isACL: true,
  },
  {
    id: 'p2', code: 'MM-1018', name: 'Rana Fares', age: 38, gender: 'Female',
    phone: '+961 70 884 921', email: 'rana.f@example.com', occupation: 'Graphic designer',
    activity: 'Pilates 2×/week', complaint: 'Right shoulder pain with overhead reach',
    diagnosis: 'Subacromial pain syndrome', therapistId: 't3',
    lastVisit: daysAgo(1), status: 'Active', painNow: 5, adherence: 64, rehabPhase: null,
    history: 'Gradual onset over 3 months, desk-based work, no trauma.',
    surgical: 'None', medications: 'Ibuprofen PRN',
    goals: 'Paint-free overhead reach; return to full Pilates programme.',
    redFlags: 'None identified', frequency: '1×/week', shareToken: 'demo-rana',
    progress: 'Flexion improved 140°→165°. Night pain reduced. Adherence dipped this week.',
  },
  {
    id: 'p3', code: 'MM-0991', name: 'Georges Abi Saleh', age: 52, gender: 'Male',
    phone: '+961 76 410 287', email: 'g.abisaleh@example.com', occupation: 'Accountant',
    activity: 'Walking, occasional hiking', complaint: 'Chronic low back pain, worse with sitting',
    diagnosis: 'Non-specific chronic low back pain', therapistId: 't3',
    lastVisit: daysAgo(4), status: 'Active', painNow: 6, adherence: 91, rehabPhase: null,
    history: '8-year history of episodic LBP, current flare 6 weeks. Sedentary job.',
    surgical: 'Appendectomy (2009)', medications: 'None',
    goals: 'Sit through a workday comfortably; hike 2 hours without flare.',
    redFlags: 'Screened negative (no night pain, no neuro deficit)', frequency: '1×/week', shareToken: 'demo-georges',
    progress: 'Oswestry 38%→26%. Sitting tolerance 20→45 min. Pain trending up last 3 days.',
  },
  {
    id: 'p4', code: 'MM-1101', name: 'Sara Mansour', age: 17, gender: 'Female',
    phone: '+961 81 559 003', email: 'sara.m@example.com', occupation: 'High-school student',
    activity: 'Basketball (school team)', complaint: 'Left knee pain after jumping',
    diagnosis: 'Patellofemoral pain syndrome', therapistId: 't2',
    lastVisit: daysAgo(6), status: 'Active', painNow: 2, adherence: 95, rehabPhase: null,
    history: 'Pain onset during pre-season training spike. No swelling or locking.',
    surgical: 'None', medications: 'None',
    goals: 'Pain-free jumping and full practice participation.',
    redFlags: 'None identified', frequency: '1×/week', shareToken: 'demo-sara',
    progress: 'Excellent adherence. Single-leg squat control improving. Pain 6→2.',
  },
  {
    id: 'p5', code: 'MM-0876', name: 'Hadi Sleiman', age: 45, gender: 'Male',
    phone: '+961 03 778 612', email: 'hadi.s@example.com', occupation: 'Software engineer',
    activity: 'Cycling on weekends', complaint: 'Neck stiffness and headaches',
    diagnosis: 'Cervicogenic headache with postural contribution', therapistId: 't3',
    lastVisit: daysAgo(3), status: 'Active', painNow: 4, adherence: 58, rehabPhase: null,
    history: 'Long hours at screen, forward-head posture, headaches 3–4×/week.',
    surgical: 'None', medications: 'None',
    goals: 'Reduce headache frequency to <1/week; comfortable full workday.',
    redFlags: 'Screened negative', frequency: '1×/week', shareToken: 'demo-hadi',
    progress: 'Headache frequency down to 2/week. Missed 3 exercise sessions this week.',
  },
  {
    id: 'p6', code: 'MM-1133', name: 'Nour El Hage', age: 29, gender: 'Female',
    phone: '+961 71 902 446', email: 'nour.eh@example.com', occupation: 'Nurse',
    activity: 'Running 10–20 km/week', complaint: 'Right ankle pain after inversion sprain',
    diagnosis: 'Lateral ankle sprain grade II — week 5', therapistId: 't2',
    lastVisit: daysAgo(2), status: 'Active', painNow: 2, adherence: 88, rehabPhase: null,
    history: 'Inversion sprain on uneven pavement 5 weeks ago.',
    surgical: 'None', medications: 'None',
    goals: 'Return to 10 km runs; confident on uneven ground.',
    redFlags: 'None identified', frequency: '1×/week', shareToken: 'demo-nour',
    progress: 'Full weight-bearing, balance work progressing, intro jog-walk next week.',
  },
  {
    id: 'p7', code: 'MM-0742', name: 'Tony Gerges', age: 61, gender: 'Male',
    phone: '+961 76 233 580', email: 'tony.g@example.com', occupation: 'Retired teacher',
    complaint: 'Stiff shoulder after period of immobility', activity: 'Gardening',
    diagnosis: 'Adhesive capsulitis (thawing stage)', therapistId: 't3',
    lastVisit: daysAgo(9), status: 'Active', painNow: 3, adherence: 72, rehabPhase: null,
    history: 'Gradual stiffening over 8 months following minor fall.',
    surgical: 'None', medications: 'Atorvastatin',
    goals: 'Reach top kitchen shelf; sleep on affected side.',
    redFlags: 'None identified', frequency: '1×/week', shareToken: 'demo-tony',
    progress: 'External rotation 25°→48°. Follow-up overdue.',
  },
  {
    id: 'p8', code: 'MM-0655', name: 'Maya Chami', age: 33, gender: 'Female',
    phone: '+961 70 415 778', email: 'maya.c@example.com', occupation: 'Lawyer',
    activity: 'Yoga', complaint: 'Completed care — low back pain',
    diagnosis: 'Lumbar strain — resolved', therapistId: 't3',
    lastVisit: daysAgo(34), status: 'Discharged', painNow: 0, adherence: 90, rehabPhase: null,
    history: 'Acute lifting strain, resolved over 8 weeks.',
    surgical: 'None', medications: 'None',
    goals: 'Achieved: pain-free daily activity and yoga.',
    redFlags: 'None', frequency: 'Discharged', shareToken: 'demo-mayac',
    progress: 'Discharged with independent maintenance programme.',
  },
  {
    id: 'p9', code: 'MM-1150', name: 'Ali Zein', age: 27, gender: 'Male',
    phone: '+961 81 660 154', email: 'ali.z@example.com', occupation: 'Chef',
    activity: 'Basketball (recreational)', complaint: 'Left ACL tear — pre-op conditioning',
    diagnosis: 'ACL rupture (left) — prehab, surgery in 3 weeks', therapistId: 't2',
    lastVisit: daysAgo(1), status: 'Active', painNow: 4, adherence: 82, rehabPhase: 1,
    history: 'Landing injury during pick-up game 2 weeks ago. MRI-confirmed complete ACL tear.',
    surgical: 'Scheduled: ACL reconstruction', medications: 'Paracetamol PRN',
    goals: 'Enter surgery with full extension and good quad activation.',
    redFlags: 'None identified', frequency: '2×/week', shareToken: 'demo-ali',
    progress: 'Swelling settling. Extension −3°. Quad set quality improving.', isACL: true,
  },
  {
    id: 'p10', code: 'MM-0980', name: 'Joelle Rahme', age: 41, gender: 'Female',
    phone: '+961 03 921 467', email: 'joelle.r@example.com', occupation: 'Pharmacist',
    activity: 'Swimming', complaint: 'Completed care — neck pain',
    diagnosis: 'Mechanical neck pain — resolved', therapistId: 't3',
    lastVisit: daysAgo(48), status: 'Discharged', painNow: 1, adherence: 85, rehabPhase: null,
    history: 'Postural neck pain resolved with graded programme.',
    surgical: 'None', medications: 'None', goals: 'Achieved', redFlags: 'None',
    frequency: 'Discharged', shareToken: 'demo-joelle', progress: 'Discharged.',
  },
]

export const EXERCISES = [
  { id: 'e1', name: 'Quad set', area: 'Knee', difficulty: 'Easy', phase: 'Early', equipment: 'None', tags: ['strength', 'motor control'], desc: 'Tighten thigh muscle, press knee down into towel, hold.' },
  { id: 'e2', name: 'Straight leg raise', area: 'Knee', difficulty: 'Easy', phase: 'Early', equipment: 'None', tags: ['strength'], desc: 'Lift straight leg to height of opposite knee, lower with control.' },
  { id: 'e3', name: 'Heel slides', area: 'Knee', difficulty: 'Easy', phase: 'Early', equipment: 'Strap (optional)', tags: ['mobility'], desc: 'Slide heel toward buttock to bend the knee within comfort.' },
  { id: 'e4', name: 'Wall slides', area: 'Shoulder', difficulty: 'Easy', phase: 'Early', equipment: 'Wall', tags: ['mobility', 'motor control'], desc: 'Slide forearms up the wall, keep shoulders relaxed.' },
  { id: 'e5', name: 'Clamshell', area: 'Hip', difficulty: 'Easy', phase: 'Mid', equipment: 'Band (optional)', tags: ['strength', 'motor control'], desc: 'Side-lying, open top knee like a clamshell without rolling back.' },
  { id: 'e6', name: 'Glute bridge', area: 'Hip', difficulty: 'Easy', phase: 'Mid', equipment: 'None', tags: ['strength'], desc: 'Lift hips until body forms a straight line from shoulders to knees.' },
  { id: 'e7', name: 'Chin tuck', area: 'Neck', difficulty: 'Easy', phase: 'Early', equipment: 'None', tags: ['motor control', 'posture'], desc: 'Gently glide head back to make a double chin, hold.' },
  { id: 'e8', name: 'Scapular retraction', area: 'Posture', difficulty: 'Easy', phase: 'Early', equipment: 'None', tags: ['posture', 'motor control'], desc: 'Squeeze shoulder blades down and back without shrugging.' },
  { id: 'e9', name: 'Serratus punch', area: 'Shoulder', difficulty: 'Medium', phase: 'Mid', equipment: 'Light dumbbell', tags: ['strength', 'motor control'], desc: 'Lying on back, punch weight toward ceiling, reach shoulder blade forward.' },
  { id: 'e10', name: 'Calf raises', area: 'Ankle', difficulty: 'Easy', phase: 'Mid', equipment: 'Step (optional)', tags: ['strength'], desc: 'Rise onto toes, lower slowly over 3 seconds.' },
  { id: 'e11', name: 'Hamstring stretch', area: 'Knee', difficulty: 'Easy', phase: 'Any', equipment: 'Strap', tags: ['stretching'], desc: 'Lying down, raise leg with strap until gentle stretch behind thigh.' },
  { id: 'e12', name: 'Single-leg balance', area: 'Balance', difficulty: 'Medium', phase: 'Mid', equipment: 'None', tags: ['balance', 'motor control'], desc: 'Stand on one leg, steady hips, eyes forward.' },
  { id: 'e13', name: 'Mini squat', area: 'Knee', difficulty: 'Medium', phase: 'Mid', equipment: 'None', tags: ['strength'], desc: 'Squat to 45° keeping knees tracking over toes.' },
  { id: 'e14', name: 'Step-up', area: 'Knee', difficulty: 'Medium', phase: 'Late', equipment: 'Step', tags: ['strength', 'motor control'], desc: 'Step up leading with the involved leg, control the descent.' },
  { id: 'e15', name: 'Bird dog', area: 'Core stability', difficulty: 'Medium', phase: 'Mid', equipment: 'Mat', tags: ['motor control', 'core'], desc: 'On all fours, extend opposite arm and leg, keep trunk still.' },
  { id: 'e16', name: 'Dead bug', area: 'Core stability', difficulty: 'Easy', phase: 'Early', equipment: 'Mat', tags: ['motor control', 'core'], desc: 'On back, lower opposite arm and leg while keeping back flat.' },
  { id: 'e17', name: 'Side plank', area: 'Core stability', difficulty: 'Hard', phase: 'Late', equipment: 'Mat', tags: ['strength', 'core'], desc: 'Hold body in a straight line supported on forearm and feet.' },
  { id: 'e18', name: 'Banded ankle eversion', area: 'Ankle', difficulty: 'Easy', phase: 'Early', equipment: 'Band', tags: ['strength'], desc: 'Turn foot outward against band resistance.' },
  { id: 'e19', name: 'Single-leg squat', area: 'ACL Rehab', difficulty: 'Hard', phase: 'Late', equipment: 'None', tags: ['strength', 'motor control'], desc: 'Squat on one leg keeping pelvis level and knee over toes.' },
  { id: 'e20', name: 'Lateral hop & stick', area: 'ACL Rehab', difficulty: 'Hard', phase: 'Late', equipment: 'None', tags: ['balance', 'plyometric'], desc: 'Hop sideways, land softly and hold the landing for 2 seconds.' },
  { id: 'e21', name: 'Nordic hamstring curl', area: 'ACL Rehab', difficulty: 'Hard', phase: 'Late', equipment: 'Partner/anchor', tags: ['strength'], desc: 'Kneeling, lower trunk forward slowly resisting with hamstrings.' },
  { id: 'e22', name: 'Hip flexor stretch', area: 'Hip', difficulty: 'Easy', phase: 'Any', equipment: 'Mat', tags: ['stretching'], desc: 'Half-kneeling, tuck pelvis and shift forward until front-of-hip stretch.' },
  { id: 'e23', name: 'Thoracic extension over roller', area: 'Posture', difficulty: 'Easy', phase: 'Any', equipment: 'Foam roller', tags: ['mobility', 'posture'], desc: 'Extend upper back over a foam roller, support the head.' },
  { id: 'e24', name: 'Wall angel', area: 'Posture', difficulty: 'Medium', phase: 'Mid', equipment: 'Wall', tags: ['posture', 'mobility'], desc: 'Back against wall, slide arms up and down keeping contact.' },
]

// 30 days of symptom logs per tracked patient
const genLogs = (patientId, base, trend, adherenceBase, noise = 1) => {
  const notesBank = [
    'Pain increased after stairs', 'Felt better after exercises', 'Knee swollen in the evening',
    'Slept well, less stiffness this morning', 'Long day standing — more tired than usual',
    'Skipped session — busy at work', 'Best day this week', 'Shoulder painful overhead', '',
    '', '', '',
  ]
  const logs = []
  for (let i = 29; i >= 0; i--) {
    const t = (29 - i) / 29
    const wave = Math.sin(i / 3.1) * noise
    const pain = Math.min(9, Math.max(0, Math.round(base + trend * t + wave)))
    logs.push({
      id: `${patientId}-l${i}`, patientId, date: daysAgo(i),
      pain,
      stiffness: Math.min(9, Math.max(0, pain + (i % 3 === 0 ? 1 : -1))),
      swelling: Math.max(0, Math.round(pain / 2 + (i % 4 === 0 ? 1 : 0))),
      sleep: Math.min(10, Math.max(2, 8 - Math.round(pain / 2))),
      fatigue: Math.min(9, Math.max(1, 3 + Math.round(wave + pain / 3))),
      function: Math.min(10, Math.max(2, Math.round(4 + 5 * t - pain / 4))),
      confidence: Math.min(10, Math.max(2, Math.round(4 + 5 * t - pain / 5))),
      mood: Math.min(10, Math.max(3, 8 - Math.round(pain / 3))),
      exercisesDone: Math.random() * 100 < adherenceBase,
      bodyArea: null,
      note: i % 5 === 0 ? notesBank[(i + patientId.length) % notesBank.length] : '',
    })
  }
  return logs
}

export const SYMPTOM_LOGS = [
  ...genLogs('p1', 5, -2.5, 86, 0.8),   // ACL: improving
  ...genLogs('p2', 4, 1.2, 64, 1.1),    // shoulder: worsening slightly
  ...genLogs('p3', 7, -2.2, 91, 1.0).map((l, idx, arr) => idx >= arr.length - 3 ? { ...l, pain: Math.min(9, l.pain + 2) } : l), // LBP: 3-day rise
  ...genLogs('p4', 5, -3.5, 95, 0.6),   // PFPS: great progress
  ...genLogs('p5', 5, -0.3, 58, 0.9),   // neck: plateau + low adherence
  ...genLogs('p6', 4, -2.4, 88, 0.7),   // ankle: improving
]

export const APPOINTMENTS = [
  { id: 'a1', patientId: 'p9', time: '09:00', type: 'Pre-op session', therapistId: 't2' },
  { id: 'a2', patientId: 'p2', time: '10:00', type: 'Follow-up', therapistId: 't3' },
  { id: 'a3', patientId: 'p1', time: '11:30', type: 'ACL phase review', therapistId: 't2' },
  { id: 'a4', patientId: 'p5', time: '13:00', type: 'Follow-up', therapistId: 't3' },
  { id: 'a5', patientId: 'p6', time: '15:30', type: 'Return-to-run screen', therapistId: 't2' },
  { id: 'a6', patientId: 'p3', time: '17:00', type: 'Reassessment', therapistId: 't3' },
]

export const ALERTS = [
  { id: 'al1', patientId: 'p3', severity: 'high', kind: 'Pain worsening', text: 'Pain rising 3 consecutive days (6 → 8)', date: daysAgo(0) },
  { id: 'al2', patientId: 'p5', severity: 'medium', kind: 'Missed sessions', text: '3 of 5 exercise sessions missed this week', date: daysAgo(1) },
  { id: 'al3', patientId: 'p2', severity: 'medium', kind: 'Adherence drop', text: 'Weekly adherence fell to 64% (was 81%)', date: daysAgo(1) },
  { id: 'al4', patientId: 'p1', severity: 'low', kind: 'ROM plateau', text: 'Knee flexion unchanged for 2 weeks (135°)', date: daysAgo(3) },
  { id: 'al5', patientId: 'p9', severity: 'high', kind: 'Red flag check', text: 'Reported giving-way episode — review before loading', date: daysAgo(0) },
]

export const FOLLOWUPS = [
  { id: 'f1', patientId: 'p7', due: daysAgo(-1), reason: 'Capsulitis review — overdue contact' },
  { id: 'f2', patientId: 'p3', due: daysAgo(-2), reason: 'Reassess after flare-up' },
  { id: 'f3', patientId: 'p2', due: daysAgo(-3), reason: 'Adherence check-in call' },
  { id: 'f4', patientId: 'p6', due: daysAgo(-5), reason: 'Return-to-run decision' },
]

export const WEEKLY_ACTIVITY = [
  { day: 'Mon', sessions: 14, logs: 22 }, { day: 'Tue', sessions: 17, logs: 26 },
  { day: 'Wed', sessions: 12, logs: 19 }, { day: 'Thu', sessions: 18, logs: 28 },
  { day: 'Fri', sessions: 15, logs: 24 }, { day: 'Sat', sessions: 8, logs: 17 },
  { day: 'Sun', sessions: 3, logs: 17 },
]

export const CONDITIONS_DIST = [
  { name: 'ACL / knee', value: 9 }, { name: 'Low back', value: 7 },
  { name: 'Shoulder', value: 6 }, { name: 'Neck / posture', value: 5 },
  { name: 'Ankle / foot', value: 4 }, { name: 'Other', value: 3 },
]

export const PHASE_DIST = [
  { phase: 'P1', label: 'Protection', count: 2 }, { phase: 'P2', label: 'Early strength', count: 3 },
  { phase: 'P3', label: 'Neuromuscular', count: 4 }, { phase: 'P4', label: 'Adv. strength', count: 2 },
  { phase: 'P5', label: 'Run/plyo', count: 2 }, { phase: 'P6', label: 'RTS', count: 1 },
  { phase: 'P7', label: 'Performance', count: 1 },
]

export const POSTURE_LOGS = {
  p5: [
    { stage: 'Initial', date: daysAgo(42), findings: { 'Forward head posture': 'Marked', 'Rounded shoulders': 'Moderate', 'Increased kyphosis': 'Mild', 'Scapular winging': 'Mild (left)', 'Pelvic tilt': 'Neutral', 'Knee valgus': 'None', 'Foot pronation': 'Mild bilateral', 'Gait deviation': 'None' }, note: 'Craniovertebral angle visibly reduced; sustained desk posture.' },
    { stage: 'Mid-program', date: daysAgo(21), findings: { 'Forward head posture': 'Moderate', 'Rounded shoulders': 'Mild', 'Increased kyphosis': 'Mild', 'Scapular winging': 'Resolved', 'Pelvic tilt': 'Neutral', 'Knee valgus': 'None', 'Foot pronation': 'Mild bilateral', 'Gait deviation': 'None' }, note: 'Better awareness; corrects with cue. Chin-tuck endurance improved.' },
    { stage: 'Latest', date: daysAgo(3), findings: { 'Forward head posture': 'Mild', 'Rounded shoulders': 'Mild', 'Increased kyphosis': 'Resolved', 'Scapular winging': 'Resolved', 'Pelvic tilt': 'Neutral', 'Knee valgus': 'None', 'Foot pronation': 'Mild bilateral', 'Gait deviation': 'None' }, note: 'Holds corrected posture ~20 min unprompted. Continue endurance work.' },
  ],
  p1: [
    { stage: 'Initial', date: daysAgo(70), findings: { 'Forward head posture': 'None', 'Rounded shoulders': 'None', 'Increased kyphosis': 'None', 'Scapular winging': 'None', 'Pelvic tilt': 'Mild anterior', 'Knee valgus': 'Moderate (right, on squat)', 'Foot pronation': 'Mild right', 'Gait deviation': 'Antalgic, reduced knee flexion at swing' }, note: 'Post-op gait pattern, quad avoidance on stairs.' },
    { stage: 'Mid-program', date: daysAgo(30), findings: { 'Forward head posture': 'None', 'Rounded shoulders': 'None', 'Increased kyphosis': 'None', 'Scapular winging': 'None', 'Pelvic tilt': 'Mild anterior', 'Knee valgus': 'Mild (right, fatigued reps)', 'Foot pronation': 'Mild right', 'Gait deviation': 'Normalized walking gait' }, note: 'Valgus appears only after 8+ reps; hip abductor work added.' },
    { stage: 'Latest', date: daysAgo(2), findings: { 'Forward head posture': 'None', 'Rounded shoulders': 'None', 'Increased kyphosis': 'None', 'Scapular winging': 'None', 'Pelvic tilt': 'Neutral', 'Knee valgus': 'Mild (right, single-leg only)', 'Foot pronation': 'Mild right', 'Gait deviation': 'None' }, note: 'Single-leg squat to 60° with good alignment for 6 reps.' },
  ],
}

export const ACL_PHASES = [
  {
    n: 1, name: 'Protection / Acute', window: 'Week 0–2',
    goals: ['Control pain and swelling', 'Achieve full passive extension', 'Activate quadriceps', 'Protect the graft'],
    entry: ['Post-surgery day 1', 'Cleared by surgeon for rehab'],
    exit: ['Extension equal to other side', 'Flexion ≥ 90°', 'SLR without lag', 'Minimal effusion'],
    milestones: ['Full extension', 'Quad set with superior patellar glide', 'Independent with crutches'],
    warnings: ['Increasing effusion day-to-day', 'Fever or calf pain (screen DVT)', 'Extension loss developing'],
    exercises: ['Quad set', 'Heel slides', 'Ankle pumps', 'Patellar mobilisations', 'SLR (when no lag)'],
    mistakes: ['Pushing flexion through sharp pain', 'Walking without extension', 'Skipping quad activation work'],
    checklist: ['Full knee extension achieved', 'Flexion 90° reached', 'Minimal swelling', 'SLR without lag'],
  },
  {
    n: 2, name: 'Early strength & ROM', window: 'Week 2–6',
    goals: ['Flexion ≥ 120°', 'Normalize gait without crutches', 'Begin closed-chain strength', 'Maintain full extension'],
    entry: ['Phase 1 exit criteria met'],
    exit: ['Flexion ≥ 120°', 'Normal gait', 'Pain ≤ 2/10 with ADLs', 'Single-leg stance 30 s'],
    milestones: ['Crutch-free walking', 'Flexion 120°', 'Bodyweight mini squat'],
    warnings: ['Persistent effusion after sessions', 'Anterior knee pain rising with stairs'],
    exercises: ['Mini squat', 'Glute bridge', 'Calf raises', 'Stationary bike', 'Step-up (low)'],
    mistakes: ['Loading too fast while effused', 'Neglecting hip strength', 'Ignoring gait quality'],
    checklist: ['Flexion milestone reached', 'Good gait', 'Minimal swelling', 'Pain controlled with ADLs'],
  },
  {
    n: 3, name: 'Neuromuscular control', window: 'Week 6–12',
    goals: ['Single-leg control without valgus', 'Quad strength ≥ 70% of other side', 'Full ROM', 'Balance & proprioception'],
    entry: ['Phase 2 exit criteria met'],
    exit: ['Single-leg squat with good alignment', 'Quad symmetry ≥ 70–80%', 'Full ROM', 'No effusion after exercise'],
    milestones: ['Full flexion', 'Single-leg squat to 60°', 'Quad index ≥ 75%'],
    warnings: ['Knee valgus on single-leg tasks', 'Quad lag persisting', 'Swelling after sessions'],
    exercises: ['Single-leg squat', 'Step-up', 'Single-leg balance (perturbed)', 'Leg press', 'Nordic hamstring curl (intro)'],
    mistakes: ['Progressing on reps not quality', 'Skipping objective strength testing'],
    checklist: ['Single-leg squat quality', 'Strength symmetry ≥ 75%', 'Full ROM confirmed', 'No reactive swelling'],
  },
  {
    n: 4, name: 'Advanced strength', window: 'Month 3–4',
    goals: ['Quad/hamstring symmetry ≥ 80%', 'Heavy strength base', 'Prepare tissues for impact'],
    entry: ['Phase 3 exit criteria met'],
    exit: ['Strength symmetry ≥ 80%', 'Pain-free loaded movement', 'Good trunk/pelvis control under load'],
    milestones: ['Loaded squat to depth', 'Symmetry ≥ 80%', 'Deceleration drills initiated'],
    warnings: ['Pain or effusion with heavy loading', 'Compensation patterns under fatigue'],
    exercises: ['Back squat / leg press', 'Romanian deadlift', 'Nordic hamstring curl', 'Lateral band walks', 'Weighted step-down'],
    mistakes: ['Replacing strength with cardio', 'Testing too infrequently'],
    checklist: ['Strength symmetry target', 'Pain-free heavy loading', 'Single-leg control under load'],
  },
  {
    n: 5, name: 'Running & plyometrics', window: 'Month 4–6',
    goals: ['Return to running progression', 'Landing mechanics', 'Hop test introduction'],
    entry: ['Quad symmetry ≥ 80%', 'No effusion', 'Pain-free hop in place'],
    exit: ['Run 20–30 min symmetrical', 'Hop symmetry ≥ 85%', 'Confident bilateral plyometrics'],
    milestones: ['First jog-walk session', 'Continuous 20-min run', 'Hop battery ≥ 85%'],
    warnings: ['Return to running attempted too early', 'Effusion after impact sessions', 'Persistent landing asymmetry'],
    exercises: ['Jog-walk intervals', 'Lateral hop & stick', 'Drop landing', 'A-skips', 'Box jumps (low)'],
    mistakes: ['Increasing volume and intensity at once', 'No objective hop criteria before running'],
    checklist: ['Hop testing complete', 'Symmetrical running gait', 'No swelling after impact'],
  },
  {
    n: 6, name: 'Return to sport', window: 'Month 6–9',
    goals: ['Sport-specific drills', 'Change of direction at speed', 'Psychological readiness'],
    entry: ['Hop symmetry ≥ 85–90%', 'Strength symmetry ≥ 90%', 'ACL-RSI trending up'],
    exit: ['Hop & strength symmetry ≥ 90%', 'Full training without reaction', 'ACL-RSI ≥ 65', 'Surgeon clearance'],
    milestones: ['Non-contact team training', 'Full-speed cutting', 'Contact drills cleared'],
    warnings: ['Instability reported during cutting', 'Fear of re-injury limiting effort'],
    exercises: ['Cutting drills', 'Reactive agility', 'Sport-specific conditioning', 'Contact progression'],
    mistakes: ['Clearing on time alone, not criteria', 'Skipping psychological readiness measures'],
    checklist: ['Cleared for sport drills', 'Symmetry ≥ 90%', 'Psych readiness measured', 'Full training tolerated'],
  },
  {
    n: 7, name: 'Return to performance', window: 'Month 9–12+',
    goals: ['Pre-injury performance level', 'Re-injury risk reduction programme', 'Long-term monitoring'],
    entry: ['Phase 6 exit criteria met', 'Competing without restriction'],
    exit: ['Performance metrics at/above baseline', 'Independent injury-prevention routine'],
    milestones: ['First full match/competition', 'Performance baseline matched'],
    warnings: ['Spike in load after return', 'Neglecting prevention exercises'],
    exercises: ['FIFA 11+ style prevention', 'Maintenance strength 2×/week', 'Monitored sprint/jump testing'],
    mistakes: ['Stopping rehab at first match', 'No periodic re-testing'],
    checklist: ['Performance baseline matched', 'Prevention routine independent'],
  },
]

export const ACL_PATIENT_STATE = {
  p1: {
    currentPhase: 3, phaseCompletion: 62,
    rom: { extension: 0, flexion: 135, target: 140 },
    painSwelling: 'Mild effusion after long sessions; pain 2–3/10',
    quadIndex: 78, singleLeg: 'Good to 60°, mild valgus when fatigued',
    hopReady: false, psychReadiness: 71,
    checks: {
      1: ['Full knee extension achieved', 'Flexion 90° reached', 'Minimal swelling', 'SLR without lag'],
      2: ['Flexion milestone reached', 'Good gait', 'Minimal swelling', 'Pain controlled with ADLs'],
      3: ['Full ROM confirmed'],
    },
    alerts: [
      { severity: 'medium', text: 'Mild effusion recurring after high-volume sessions — monitor load.' },
      { severity: 'low', text: 'Valgus on fatigued single-leg reps — keep hip abductor emphasis.' },
    ],
    notes: 'Strong trajectory. Hold off hop testing until quad index ≥ 80% and no reactive effusion for 2 weeks.',
  },
  p9: {
    currentPhase: 1, phaseCompletion: 40,
    rom: { extension: -3, flexion: 110, target: 140 },
    painSwelling: 'Moderate effusion; pain 4/10 end-range',
    quadIndex: 55, singleLeg: 'Not started (pre-op)',
    hopReady: false, psychReadiness: 58,
    checks: { 1: ['Flexion 90° reached'] },
    alerts: [
      { severity: 'high', text: 'Giving-way episode reported this week — avoid pivoting tasks pre-op.' },
      { severity: 'medium', text: 'Extension lag persists (−3°) — prioritise extension before surgery.' },
    ],
    notes: 'Pre-op focus: full extension, swelling control, quad activation. Surgery in 3 weeks.',
  },
}

export const DEFAULT_SETTINGS = {
  clinicName: 'Cedar Physio & Sports Clinic',
  logoInitials: 'CP',
  defaultTemplate: 'Orthopedic intake (full)',
  libraryVisibility: 'All therapists',
  notifPainAlerts: true, notifMissedSessions: true, notifRedFlags: true, notifWeeklyDigest: false,
  reportLetterhead: true, reportSignature: true, reportLanguage: 'English',
}

export const OUTCOME_TOOLS = [
  { key: 'LEFS', name: 'LEFS', max: 80, dir: 'higher', region: 'Lower extremity' },
  { key: 'Oswestry', name: 'Oswestry (ODI)', max: 100, dir: 'lower', region: 'Low back', unit: '%' },
  { key: 'DASH', name: 'DASH', max: 100, dir: 'lower', region: 'Upper limb' },
  { key: 'NDI', name: 'NDI', max: 100, dir: 'lower', region: 'Neck', unit: '%' },
  { key: 'KOOS', name: 'KOOS', max: 100, dir: 'higher', region: 'Knee' },
  { key: 'WOMAC', name: 'WOMAC', max: 96, dir: 'lower', region: 'Hip/knee OA' },
  { key: 'PSFS', name: 'PSFS', max: 10, dir: 'higher', region: 'Patient-specific' },
]
