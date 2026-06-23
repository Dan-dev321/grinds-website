import { Link } from 'react-router-dom'

const Home = () => {
  return (
    <div className="flex flex-col">

      {/* ======= HERO SECTION ======= */}
      <section className="bg-blue-700 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-extrabold mb-4 leading-tight">
            Maths & Applied Maths Grinds 📐
          </h1>
          <p className="text-xl text-blue-100 mb-2">
            Junior Cert & Leaving Cert · Online · Ireland 🇮🇪
          </p>
          <p className="text-blue-200 text-md mb-8 max-w-2xl mx-auto">
            Personalised one-to-one online grinds designed to boost your confidence,
            improve your grades, and help you reach your potential in Maths.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white text-blue-700 font-bold px-8 py-3 rounded-full hover:bg-blue-100 transition text-lg"
            >
              Get Started Free Trial 🚀
            </Link>
            <Link
              to="/services"
              className="border-2 border-white text-white font-bold px-8 py-3 rounded-full hover:bg-blue-600 transition text-lg"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* ======= WHAT I OFFER SECTION ======= */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">
            What I Offer
          </h2>
          <p className="text-center text-gray-500 mb-10">
            Everything you need to succeed in Maths & Applied Maths
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

            <div className="bg-blue-50 rounded-2xl p-6 text-center shadow-sm hover:shadow-md transition">
              <div className="text-4xl mb-3">💻</div>
              <h3 className="text-lg font-bold text-blue-700 mb-2">100% Online</h3>
              <p className="text-gray-600 text-sm">
                Sessions run via Zoom or Google Meet — no commute, learn from the comfort of home.
              </p>
            </div>

            <div className="bg-blue-50 rounded-2xl p-6 text-center shadow-sm hover:shadow-md transition">
              <div className="text-4xl mb-3">👤</div>
              <h3 className="text-lg font-bold text-blue-700 mb-2">One-to-One</h3>
              <p className="text-gray-600 text-sm">
                Every session is tailored specifically to you — your pace, your questions, your goals.
              </p>
            </div>

            <div className="bg-blue-50 rounded-2xl p-6 text-center shadow-sm hover:shadow-md transition">
              <div className="text-4xl mb-3">📘</div>
              <h3 className="text-lg font-bold text-blue-700 mb-2">Junior Cert Maths</h3>
              <p className="text-gray-600 text-sm">
                Full Junior Cert Maths curriculum covered — Higher and Ordinary Level.
              </p>
            </div>

            <div className="bg-blue-50 rounded-2xl p-6 text-center shadow-sm hover:shadow-md transition">
              <div className="text-4xl mb-3">📗</div>
              <h3 className="text-lg font-bold text-blue-700 mb-2">Leaving Cert Maths</h3>
              <p className="text-gray-600 text-sm">
                Leaving Cert Maths — exam technique, past papers, and full topic coverage.
              </p>
            </div>

            <div className="bg-blue-50 rounded-2xl p-6 text-center shadow-sm hover:shadow-md transition">
              <div className="text-4xl mb-3">📐</div>
              <h3 className="text-lg font-bold text-blue-700 mb-2">Applied Maths</h3>
              <p className="text-gray-600 text-sm">
                Leaving Cert Applied Maths — a great bonus subject to boost your CAO points.
              </p>
            </div>

            <div className="bg-blue-50 rounded-2xl p-6 text-center shadow-sm hover:shadow-md transition">
              <div className="text-4xl mb-3">📅</div>
              <h3 className="text-lg font-bold text-blue-700 mb-2">Flexible Scheduling</h3>
              <p className="text-gray-600 text-sm">
                Book sessions that suit your weekly schedule — view live availability online.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ======= PRICING SNAPSHOT ======= */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">
            Pricing
          </h2>
          <p className="text-center text-gray-500 mb-10">
            Straightforward pricing — try a session before committing
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

            {/* JC Card */}
            <div className="bg-white rounded-2xl shadow-md p-8 border-t-4 border-blue-400">
              <h3 className="text-xl font-bold text-blue-700 mb-1">Junior Cert</h3>
              <p className="text-gray-500 text-sm mb-6">Maths · Higher & Ordinary Level</p>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center bg-blue-50 rounded-xl px-4 py-3">
                  <span className="text-gray-700 font-medium">Trial Session</span>
                  <span className="text-blue-700 font-bold text-lg">€25</span>
                </div>
                <div className="flex justify-between items-center bg-blue-50 rounded-xl px-4 py-3">
                  <span className="text-gray-700 font-medium">Regular Session</span>
                  <span className="text-blue-700 font-bold text-lg">€30</span>
                </div>
              </div>
            </div>

            {/* LC Card */}
            <div className="bg-white rounded-2xl shadow-md p-8 border-t-4 border-blue-700">
              <h3 className="text-xl font-bold text-blue-700 mb-1">Leaving Cert</h3>
              <p className="text-gray-500 text-sm mb-6">Maths & Applied Maths · All Levels</p>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center bg-blue-50 rounded-xl px-4 py-3">
                  <span className="text-gray-700 font-medium">Trial Session</span>
                  <span className="text-blue-700 font-bold text-lg">€30</span>
                </div>
                <div className="flex justify-between items-center bg-blue-50 rounded-xl px-4 py-3">
                  <span className="text-gray-700 font-medium">Regular Session</span>
                  <span className="text-blue-700 font-bold text-lg">€35</span>
                </div>
              </div>
            </div>

          </div>

          <p className="text-center text-gray-400 text-sm mt-6">
            * Sessions are 1 hour long · Payment discussed after trial session
          </p>
        </div>
      </section>

      {/* ======= WHY CHOOSE ME SECTION ======= */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">
            Why Choose Me?
          </h2>
          <p className="text-center text-gray-500 mb-10">
            Here's what sets these grinds apart
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              { icon: '🎯', text: 'Focused on exam technique and past paper practice' },
              { icon: '📈', text: 'Track record of students improving their grades' },
              { icon: '🕐', text: 'Flexible scheduling to fit around school timetables' },
              { icon: '💬', text: 'Clear explanations — no question is a bad question' },
              { icon: '🧪', text: 'Applied Maths available — great for CAO bonus points' },
              { icon: '✅', text: 'Trial session available — no pressure to commit' },
            ].map((item, index) => (
              <div key={index} className="flex items-start gap-4 bg-gray-50 rounded-xl p-4">
                <span className="text-2xl">{item.icon}</span>
                <p className="text-gray-700 font-medium">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======= CALL TO ACTION ======= */}
      <section className="bg-blue-700 text-white py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Improve Your Maths? 🚀</h2>
          <p className="text-blue-100 mb-8">
            Register today and book a trial session. No long-term commitment needed.
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

export default Home