import { Link } from 'react-router-dom'

const features = [
  {
    icon: '📅',
    title: 'Smart Scheduling',
    desc: 'Drag to create availability slots. Students book instantly. Buffers and splits handled automatically.',
    color: 'bg-brand-50 border-brand-200',
    iconBg: 'bg-brand-100',
  },
  {
    icon: '📓',
    title: 'Session Notebook',
    desc: 'Auto-generated notes for every completed session. Rich text editor, homework tracking, progress over time.',
    color: 'bg-accent-50 border-accent-200',
    iconBg: 'bg-accent-100',
  },
  {
    icon: '🎓',
    title: 'Student Profiles',
    desc: 'Store school, year group, exam board, goals, and parent contact — everything in one place.',
    color: 'bg-emerald-50 border-emerald-200',
    iconBg: 'bg-emerald-100',
  },
  {
    icon: '📊',
    title: 'Business Dashboard',
    desc: "See today's lessons, attendance rates, outstanding notes, and completed sessions at a glance.",
    color: 'bg-amber-50 border-amber-200',
    iconBg: 'bg-amber-100',
  },
  {
    icon: '✉️',
    title: 'Email Automation',
    desc: 'Booking confirmations, lesson reminders, and trial-ending notices sent automatically.',
    color: 'bg-sky-50 border-sky-200',
    iconBg: 'bg-sky-100',
  },
  {
    icon: '🔗',
    title: 'Invite Links',
    desc: 'Share a single link. Students register and are instantly connected to your workspace.',
    color: 'bg-violet-50 border-violet-200',
    iconBg: 'bg-violet-100',
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
    color: 'bg-brand-500',
  },
  {
    name: 'James O.',
    role: 'Science Tutor · Cork',
    quote: 'The notebook feature alone is worth it. Parents love getting updates after each session.',
    avatar: 'JO',
    color: 'bg-accent-500',
  },
  {
    name: 'Emma R.',
    role: 'English Tutor · Galway',
    quote: "Setup took 10 minutes. I had my first student booked the same day. Couldn't be easier.",
    avatar: 'ER',
    color: 'bg-emerald-500',
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
    <div className="flex flex-col">

      {/* ======= HERO ======= */}
      <section className="relative bg-brand-600 text-white overflow-hidden">

        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-500 rounded-full opacity-40 blur-3xl" />
          <div className="absolute -bottom-32 -left-24 w-96 h-96 bg-accent-600 rounded-full opacity-30 blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 py-24 text-center">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-brand-700/60 border border-brand-400 text-brand-100 text-xs font-semibold px-4 py-1.5 rounded-full mb-8 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            14-day free trial · No credit card required
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold mb-6 leading-tight tracking-tight">
            Manage your tutoring<br />
            <span className="text-accent-300">business in one place.</span>
          </h1>

          <p className="text-xl text-brand-100 mb-10 max-w-2xl mx-auto leading-relaxed">
            TutorNode gives independent tutors everything they need —
            scheduling, student notes, profiles, and reminders —
            in a single clean workspace.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white text-brand-700 font-bold px-8 py-3.5 rounded-xl hover:bg-brand-50 transition-all duration-150 shadow-lg text-base"
            >
              Start your free trial →
            </Link>
            
            <a href="#how-it-works"
              className="border border-brand-400 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-brand-700 transition-all duration-150 text-base"
            >
              See how it works
            </a>
          </div>

          {/* Social proof */}
          <p className="mt-10 text-brand-300 text-sm">
            Trusted by independent tutors across Ireland 🇮🇪
          </p>

        </div>
      </section>

      {/* ======= FEATURES ======= */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">

          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-500 mb-3 block">
              Features
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
              Everything a tutor needs
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Built around how tutors actually work — not how software engineers think they work.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div
                key={i}
                className={`rounded-2xl border p-6 hover:shadow-md transition-all duration-200 ${f.color}`}
              >
                <div className={`w-11 h-11 ${f.iconBg} rounded-xl flex items-center justify-center text-2xl mb-4`}>
                  {f.icon}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ======= HOW IT WORKS ======= */}
      <section id="how-it-works" className="py-20 px-4 bg-surface-100">
        <div className="max-w-4xl mx-auto">

          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-500 mb-3 block">
              How it works
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
              Up and running in minutes
            </h2>
            <p className="text-gray-500">
              No training needed. No complicated setup. Just sign up and go.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {steps.map((s, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-start gap-4">
                  <span className="text-3xl font-black text-brand-100 leading-none select-none">
                    {s.step}
                  </span>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">{s.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ======= TESTIMONIALS ======= */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">

          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-500 mb-3 block">
              Testimonials
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
              Tutors love it
            </h2>
            <p className="text-gray-500">
              Don't take our word for it.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <p className="text-gray-700 text-sm leading-relaxed mb-5 italic">
                  "{t.quote}"
                </p>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 ${t.color} rounded-full flex items-center justify-center text-white text-xs font-bold`}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ======= PRICING ======= */}
      <section className="py-20 px-4 bg-surface-100">
        <div className="max-w-3xl mx-auto">

          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-500 mb-3 block">
              Pricing
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
              Simple, honest pricing
            </h2>
            <p className="text-gray-500">
              Start free. No credit card needed. Upgrade when you're ready.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {plans.map((plan, i) => (
              <div
                key={i}
                className={`rounded-2xl p-8 relative ${
                  plan.highlight
                    ? 'bg-brand-600 text-white shadow-xl ring-2 ring-brand-400'
                    : 'bg-white border border-gray-200 shadow-sm'
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    {plan.badge}
                  </span>
                )}

                <h3 className={`font-bold text-lg mb-1 ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                  {plan.name}
                </h3>
                <p className={`text-xs mb-4 ${plan.highlight ? 'text-brand-200' : 'text-gray-400'}`}>
                  {plan.desc}
                </p>

                <div className="flex items-end gap-1 mb-6">
                  <span className={`text-4xl font-extrabold ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>
                    {plan.price}
                  </span>
                  <span className={`text-sm mb-1 ${plan.highlight ? 'text-brand-200' : 'text-gray-400'}`}>
                    {plan.period}
                  </span>
                </div>

                <ul className="flex flex-col gap-2 mb-8">
                  {plan.features.map((feat, fi) => (
                    <li key={fi} className="flex items-center gap-2 text-sm">
                      <span className={`${plan.highlight ? 'text-accent-300' : 'text-brand-500'}`}>✓</span>
                      <span className={plan.highlight ? 'text-brand-100' : 'text-gray-600'}>{feat}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to="/register"
                  className={`block text-center font-bold py-3 rounded-xl transition-all duration-150 ${
                    plan.highlight
                      ? 'bg-white text-brand-700 hover:bg-brand-50'
                      : 'bg-brand-600 text-white hover:bg-brand-700'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-gray-400 text-xs mt-6">
            All plans include a 14-day free trial · Cancel anytime
          </p>

        </div>
      </section>

      {/* ======= FINAL CTA ======= */}
      <section className="relative bg-brand-600 text-white py-20 px-4 overflow-hidden">

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-16 -right-16 w-72 h-72 bg-accent-500 rounded-full opacity-20 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-72 h-72 bg-brand-400 rounded-full opacity-20 blur-3xl" />
        </div>

        <div className="relative max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 leading-tight">
            Ready to simplify your tutoring business?
          </h2>
          <p className="text-brand-100 mb-8 text-lg">
            Join TutorNode today. 14 days free — no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white text-brand-700 font-bold px-8 py-3.5 rounded-xl hover:bg-brand-50 transition-all duration-150 shadow-lg"
            >
              Start your free trial →
            </Link>
            <Link
              to="/login"
              className="border border-brand-400 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-brand-700 transition-all duration-150"
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