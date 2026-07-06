import { Link } from 'react-router-dom'

const features = [
  {
    icon: '📅',
    title: 'Smart Scheduling',
    desc: 'Drag to create availability slots. Students book instantly. Buffers and splits handled automatically.',
  },
  {
    icon: '📓',
    title: 'Session Notebook',
    desc: 'Auto-generated notes for every completed session. Rich text editor, homework tracking, progress over time.',
  },
  {
    icon: '🎓',
    title: 'Student Profiles',
    desc: 'Store school, year group, exam board, goals, and parent contact — everything in one place.',
  },
  {
    icon: '📊',
    title: 'Business Dashboard',
    desc: "See today's lessons, attendance rates, outstanding notes, and completed sessions at a glance.",
  },
  {
    icon: '✉️',
    title: 'Email Automation',
    desc: 'Booking confirmations, lesson reminders, and trial-ending notices sent automatically.',
  },
  {
    icon: '🔗',
    title: 'Invite Links',
    desc: 'Share a single link. Students register and are instantly connected to your workspace.',
  },
]

const steps = [
  {
    step: '01',
    title: 'Sign up as a tutor',
    desc: 'Create your account and get your personal invite link in under a minute.',
  },
  {
    step: '02',
    title: 'Invite your students',
    desc: 'Share your link. Students register and land straight in your workspace.',
  },
  {
    step: '03',
    title: 'Set your availability',
    desc: 'Drag to create slots on your calendar. Students book what works for them.',
  },
  {
    step: '04',
    title: 'Run your sessions',
    desc: 'Mark sessions complete, write notes, track progress — all in one place.',
  },
]

const testimonials = [
  {
    name: 'Sarah K.',
    role: 'Maths Tutor · Dublin',
    quote: 'TutorNode replaced three different apps I was using. Scheduling, notes and student info — all in one place.',
    avatar: 'SK',
  },
  {
    name: 'James O.',
    role: 'Science Tutor · Cork',
    quote: 'The notebook feature alone is worth it. Parents love getting updates after each session.',
    avatar: 'JO',
  },
  {
    name: 'Emma R.',
    role: 'English Tutor · Galway',
    quote: "Setup took 10 minutes. I had my first student booked the same day. Couldn't be easier.",
    avatar: 'ER',
  },
]

const plans = [
  {
    name: 'Monthly',
    price: '€19',
    period: '/month',
    desc: 'Pay as you go. Cancel anytime.',
    features: ['Unlimited students', 'Smart calendar', 'Session notebook', 'Email reminders', 'Student profiles'],
    cta: 'Start free trial',
    highlight: false,
  },
  {
    name: 'Yearly',
    price: '€12',
    period: '/month',
    badge: 'Best value',
    desc: 'Billed €144/year. Save €84.',
    features: ['Everything in Monthly', 'Priority support', 'PDF exports', 'Advanced analytics', 'Early access to new features'],
    cta: 'Start free trial',
    highlight: true,
  },
]

const Home = () => {
  return (
    <div className="flex flex-col bg-[#0B0A14] text-slate-100 min-h-screen">

      {/* ======= HERO ======= */}
      <section className="relative overflow-hidden">

        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#EC4899] rounded-full opacity-10 blur-3xl" />
          <div className="absolute -bottom-32 -left-24 w-96 h-96 bg-[#A855F7] rounded-full opacity-10 blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 py-24 text-center">

          {/* Transparent Neon Pink Pop Variant */}
          <div className="inline-flex items-center gap-2 bg-[#EC4899]/10 border border-[#EC4899]/20 text-[#EC4899] text-xs font-bold px-4 py-1.5 rounded-full mb-8 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 bg-[#EC4899] rounded-full animate-pulse" />
            14-day free trial · No credit card required
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold mb-6 leading-tight tracking-tight text-slate-50">
            Manage your tutoring<br />
            <span className="text-[#A855F7]">business in one place.</span>
          </h1>

          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            TutorNode gives independent tutors everything they need —
            scheduling, student notes, profiles, and reminders —
            in a single clean workspace.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-[#EC4899] hover:bg-[#db3b88] text-white font-bold px-8 py-3.5 rounded-xl transition-all duration-150 shadow-lg shadow-[#EC4899]/10 text-base"
            >
              Start your free trial →
            </Link>
            
            <a href="#how-it-works"
              className="border border-slate-800/40 text-slate-100 font-semibold px-8 py-3.5 rounded-xl hover:bg-[#161426] transition-all duration-150 text-base"
            >
              See how it works
            </a>
          </div>

          <p className="mt-10 text-slate-400 text-sm">
            Trusted by independent tutors across Ireland 🇮🇪
          </p>

        </div>
      </section>

      {/* ======= FEATURES ======= */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">

          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-[#A855F7] mb-3 block">
              Features
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-50 mb-3">
              Everything a tutor needs
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Built around how tutors actually work — not how software engineers think they work.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div
                key={i}
                className="bg-[#161426] border border-slate-800/40 rounded-2xl p-6 transition-all duration-200"
              >
                <div className="w-11 h-11 bg-[#0B0A14] border border-slate-800/40 rounded-xl flex items-center justify-center text-2xl mb-4">
                  {f.icon}
                </div>
                <h3 className="font-bold text-slate-50 mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ======= HOW IT WORKS ======= */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="max-w-4xl mx-auto">

          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-[#A855F7] mb-3 block">
              How it works
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-50 mb-3">
              Up and running in minutes
            </h2>
            <p className="text-slate-400">
              No training needed. No complicated setup. Just sign up and go.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {steps.map((s, i) => (
              <div key={i} className="bg-[#161426] rounded-2xl p-6 border border-slate-800/40">
                <div className="flex items-start gap-4">
                  <span className="text-3xl font-black text-slate-800 leading-none select-none">
                    {s.step}
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-50 mb-1">{s.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ======= TESTIMONIALS ======= */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">

          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-[#A855F7] mb-3 block">
              Testimonials
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-50 mb-3">
              Tutors love it
            </h2>
            <p className="text-slate-400">
              Don't take our word for it.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-[#161426] rounded-2xl p-6 border border-slate-800/40">
                <p className="text-slate-400 text-sm leading-relaxed mb-5 italic">
                  "{t.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-[#A855F7]/10 text-[#A855F7] border border-[#A855F7]/20 rounded-full flex items-center justify-center text-xs font-bold">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-50">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ======= PRICING ======= */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">

          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-[#A855F7] mb-3 block">
              Pricing
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-50 mb-3">
              Simple, honest pricing
            </h2>
            <p className="text-slate-400">
              Start free. No credit card needed. Upgrade when you're ready.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {plans.map((plan, i) => (
              <div
                key={i}
                className={`rounded-2xl p-8 relative bg-[#161426] border ${
                  plan.highlight
                    ? 'border-[#A855F7]/60 shadow-xl ring-1 ring-[#A855F7]/30'
                    : 'border-slate-800/40 shadow-sm'
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#A855F7] text-white text-xs font-bold px-3 py-1 rounded-full">
                    {plan.badge}
                  </span>
                )}

                <h3 className="font-bold text-lg mb-1 text-slate-50">
                  {plan.name}
                </h3>
                <p className="text-xs mb-4 text-slate-400">
                  {plan.desc}
                </p>

                <div className="flex items-end gap-1 mb-6">
                  <span className="text-4xl font-extrabold text-slate-50">
                    {plan.price}
                  </span>
                  <span className="text-sm mb-1 text-slate-400">
                    {plan.period}
                  </span>
                </div>

                <ul className="flex flex-col gap-2 mb-8">
                  {plan.features.map((feat, fi) => (
                    <li key={fi} className="flex items-center gap-2 text-sm text-slate-400">
                      <span className="text-[#A855F7]">✓</span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to="/register"
                  className={`block text-center font-bold py-3 rounded-xl transition-all duration-150 ${
                    plan.highlight
                      ? 'bg-[#EC4899] hover:bg-[#db3b88] text-white shadow-md shadow-[#EC4899]/10'
                      : 'bg-[#A855F7] hover:bg-[#9333EA] text-white'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-slate-400 text-xs mt-6">
            All plans include a 14-day free trial · Cancel anytime
          </p>

        </div>
      </section>

      {/* ======= FINAL CTA ======= */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-16 -right-16 w-72 h-72 bg-[#A855F7] rounded-full opacity-10 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-72 h-72 bg-[#EC4899] rounded-full opacity-10 blur-3xl" />
        </div>

        <div className="relative max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 leading-tight text-slate-50">
            Ready to simplify your tutoring business?
          </h2>
          <p className="text-slate-400 mb-8 text-lg">
            Join TutorNode today. 14 days free — no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-[#EC4899] hover:bg-[#db3b88] text-white font-bold px-8 py-3.5 rounded-xl transition-all duration-150 shadow-lg shadow-[#EC4899]/10"
            >
              Start your free trial →
            </Link>
            <Link
              to="/login"
              className="border border-slate-800/40 text-slate-100 font-semibold px-8 py-3.5 rounded-xl hover:bg-[#161426] transition-all duration-150"
            >
              Log in
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}

export default Home