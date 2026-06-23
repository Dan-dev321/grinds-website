import { Link } from 'react-router-dom'

const Services = () => {
  return (
    <div className="flex flex-col">

      {/* ======= HERO SECTION ======= */}
      <section className="bg-blue-700 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-extrabold mb-3">Services & Pricing 💰</h1>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto">
            Transparent pricing with no hidden fees. Try a trial session first — no pressure to commit.
          </p>
        </div>
      </section>

      {/* ======= PRICING CARDS ======= */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">Session Pricing</h2>
          <p className="text-center text-gray-500 mb-10">All sessions are 1 hour · Online via Zoom or Google Meet</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">

            {/* Junior Cert Card */}
            <div className="bg-white rounded-2xl shadow-md overflow-hidden">
              <div className="bg-blue-400 text-white px-6 py-4">
                <h3 className="text-2xl font-bold">Junior Cert</h3>
                <p className="text-blue-100 text-sm mt-1">Maths · Higher & Ordinary Level</p>
              </div>
              <div className="p-6 flex flex-col gap-4">
                <div className="flex justify-between items-center bg-blue-50 rounded-xl px-5 py-4">
                  <div>
                    <p className="font-semibold text-gray-800">Trial Session</p>
                    <p className="text-xs text-gray-500">First time? Start here — no commitment</p>
                  </div>
                  <span className="text-2xl font-extrabold text-blue-700">€25</span>
                </div>
                <div className="flex justify-between items-center bg-blue-50 rounded-xl px-5 py-4">
                  <div>
                    <p className="font-semibold text-gray-800">Regular Session</p>
                    <p className="text-xs text-gray-500">Weekly ongoing sessions</p>
                  </div>
                  <span className="text-2xl font-extrabold text-blue-700">€30</span>
                </div>
                <Link
                  to="/register"
                  className="block text-center bg-blue-700 text-white font-bold py-3 rounded-xl hover:bg-blue-800 transition mt-2"
                >
                  Book a Trial →
                </Link>
              </div>
            </div>

            {/* Leaving Cert Card */}
            <div className="bg-white rounded-2xl shadow-md overflow-hidden">
              <div className="bg-blue-700 text-white px-6 py-4">
                <h3 className="text-2xl font-bold">Leaving Cert</h3>
                <p className="text-blue-200 text-sm mt-1">Maths & Applied Maths · All Levels</p>
              </div>
              <div className="p-6 flex flex-col gap-4">
                <div className="flex justify-between items-center bg-blue-50 rounded-xl px-5 py-4">
                  <div>
                    <p className="font-semibold text-gray-800">Trial Session</p>
                    <p className="text-xs text-gray-500">First time? Start here — no commitment</p>
                  </div>
                  <span className="text-2xl font-extrabold text-blue-700">€30</span>
                </div>
                <div className="flex justify-between items-center bg-blue-50 rounded-xl px-5 py-4">
                  <div>
                    <p className="font-semibold text-gray-800">Regular Session</p>
                    <p className="text-xs text-gray-500">Weekly ongoing sessions</p>
                  </div>
                  <span className="text-2xl font-extrabold text-blue-700">€35</span>
                </div>
                <Link
                  to="/register"
                  className="block text-center bg-blue-700 text-white font-bold py-3 rounded-xl hover:bg-blue-800 transition mt-2"
                >
                  Book a Trial →
                </Link>
              </div>
            </div>

          </div>

          <p className="text-center text-gray-400 text-sm mt-6">
            * Payment is discussed after the trial session · Sessions run weekly at an agreed time
          </p>
        </div>
      </section>

      {/* ======= SUBJECTS COVERED ======= */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">Subjects Covered</h2>
          <p className="text-center text-gray-500 mb-10">Full curriculum support from Junior Cert through to Leaving Cert</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

            <div className="border border-blue-100 rounded-2xl p-6 text-center hover:shadow-md transition">
              <div className="text-4xl mb-3">📘</div>
              <h3 className="text-lg font-bold text-blue-700 mb-2">Junior Cert Maths</h3>
              <ul className="text-gray-600 text-sm space-y-1 text-left list-disc list-inside">
                <li>Number & Algebra</li>
                <li>Geometry & Trigonometry</li>
                <li>Statistics & Probability</li>
                <li>Functions & Graphs</li>
                <li>Higher & Ordinary Level</li>
              </ul>
            </div>

            <div className="border border-blue-100 rounded-2xl p-6 text-center hover:shadow-md transition">
              <div className="text-4xl mb-3">📗</div>
              <h3 className="text-lg font-bold text-blue-700 mb-2">Leaving Cert Maths</h3>
              <ul className="text-gray-600 text-sm space-y-1 text-left list-disc list-inside">
                <li>Algebra & Functions</li>
                <li>Calculus (Differentiation & Integration)</li>
                <li>Trigonometry & Geometry</li>
                <li>Statistics & Probability</li>
                <li>Higher, Ordinary & Foundation</li>
              </ul>
            </div>

            <div className="border border-blue-100 rounded-2xl p-6 text-center hover:shadow-md transition">
              <div className="text-4xl mb-3">📐</div>
              <h3 className="text-lg font-bold text-blue-700 mb-2">Applied Maths</h3>
              <ul className="text-gray-600 text-sm space-y-1 text-left list-disc list-inside">
                <li>Mechanics & Motion</li>
                <li>Projectile Motion</li>
                <li>Newton's Laws</li>
                <li>Relative Velocity</li>
                <li>Great for CAO bonus points 🎯</li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* ======= HOW IT WORKS ======= */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">How It Works</h2>
          <p className="text-center text-gray-500 mb-10">Getting started is simple</p>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            {[
              { step: '1', icon: '📝', title: 'Register', desc: 'Create your free account in under a minute' },
              { step: '2', icon: '📅', title: 'Book a Trial', desc: 'Pick an available slot from the live calendar' },
              { step: '3', icon: '💻', title: 'Join Online', desc: 'Get a Zoom or Google Meet link before your session' },
              { step: '4', icon: '📈', title: 'Improve!', desc: 'Book regular weekly sessions and watch your grades rise' },
            ].map((item) => (
              <div key={item.step} className="bg-white rounded-2xl p-6 text-center shadow-sm hover:shadow-md transition">
                <div className="w-8 h-8 bg-blue-700 text-white rounded-full flex items-center justify-center font-bold text-sm mx-auto mb-3">
                  {item.step}
                </div>
                <div className="text-3xl mb-2">{item.icon}</div>
                <h3 className="font-bold text-gray-800 mb-1">{item.title}</h3>
                <p className="text-gray-500 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======= FAQ SECTION ======= */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">FAQs</h2>
          <p className="text-center text-gray-500 mb-10">Common questions answered</p>

          <div className="flex flex-col gap-4">
            {[
              {
                q: 'Where do the sessions take place?',
                a: 'All sessions are 100% online via Zoom or Google Meet. You just need a device and a stable internet connection.'
              },
              {
                q: 'How long is each session?',
                a: 'Each session is 1 hour long. This is the ideal length for focused, productive learning without fatigue.'
              },
              {
                q: 'Do I have to commit to regular sessions?',
                a: 'Not at all! Start with a trial session to see if it\'s a good fit. After that, you can book weekly sessions at your own pace.'
              },
              {
                q: 'What level do you teach?',
                a: 'Junior Cert Maths (Higher & Ordinary), Leaving Cert Maths (Higher, Ordinary & Foundation), and Leaving Cert Applied Maths.'
              },
              {
                q: 'How do I pay?',
                a: 'Payment details are discussed after the trial session. We\'ll agree a convenient method that works for both of us.'
              },
              {
                q: 'What if I need to cancel a session?',
                a: 'Just let me know in advance and we\'ll reschedule. Life happens — flexibility is important!'
              },
            ].map((faq, index) => (
              <div key={index} className="border border-gray-200 rounded-xl p-5 hover:border-blue-300 transition">
                <h3 className="font-bold text-gray-800 mb-2">❓ {faq.q}</h3>
                <p className="text-gray-600 text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======= CTA ======= */}
      <section className="bg-blue-700 text-white py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started? 🚀</h2>
          <p className="text-blue-100 mb-8">
            Register for free and book your trial session today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white text-blue-700 font-bold px-8 py-3 rounded-full hover:bg-blue-100 transition text-lg"
            >
              Register Now
            </Link>
            <Link
              to="/availability"
              className="border-2 border-white text-white font-bold px-8 py-3 rounded-full hover:bg-blue-600 transition text-lg"
            >
              View Availability
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}

export default Services