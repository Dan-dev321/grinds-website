import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Navbar = () => {
  const { user, logout, refreshUser, token } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen]         = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  // ── Refresh subscription status on every mount ────────────────
  useEffect(() => {
    if (token && user?.role === 'tutor') {
      refreshUser(token)
    }
  }, [token]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogout = () => {
    logout()
    navigate('/')
    setMenuOpen(false)
    setDropdownOpen(false)
  }

  const getDashboardLink = () => {
    if (!user) return null
    const roleMap = {
      student: '/dashboard/student',
      tutor:   '/dashboard/tutor',
      owner:   '/dashboard/owner',
    }
    return roleMap[user.role] || '/dashboard/student'
  }

  const isTutor   = user?.role === 'tutor'
  const isOwner   = user?.role === 'owner'
  const isStudent = user?.role === 'student'

  // ── Subscription gate check ───────────────────────────────────
  const subStatus = user?.subscription?.status
  const trialEnds = user?.subscription?.trialEnds
  const isTrialExpired =
    subStatus === 'trial_expired' ||
    (subStatus === 'trial' && trialEnds && new Date() > new Date(trialEnds))
  const hasActiveAccess =
    subStatus === 'active' ||
    subStatus === 'trial' && !isTrialExpired

  // Active link helper
  const isActive = (path) => location.pathname === path

  const linkClass = (path) =>
    `text-sm font-medium transition-all duration-150 px-3 py-1.5 rounded-lg ${
      isActive(path)
        ? 'bg-brand-800 text-white'
        : 'text-brand-100 hover:bg-brand-800 hover:text-white'
    }`

  // ── Links per role ────────────────────────────────────────────
  const publicLinks = [
    { to: '/',         label: 'Home'     },
    { to: '/pricing',  label: 'Pricing'  },
  ]

  const studentLinks = [
    { to: '/dashboard/student',   label: 'Dashboard'      },
    { to: '/studentavailability', label: 'Book a Session' },
  ]

  const tutorLinks = hasActiveAccess
    ? [
        { to: '/dashboard/tutor',   label: 'Dashboard' },
        { to: '/students',          label: 'Students'  },
        { to: '/tutoravailability', label: 'Calendar'  },
        { to: '/notebook',          label: 'Notes'     },
      ]
    : [
        { to: '/dashboard/tutor', label: 'Dashboard'  },
        { to: '/pricing',         label: 'Upgrade ✨' },
      ]

  const ownerLinks = [
    { to: '/dashboard/owner', label: 'Owner Panel' },
  ]

  const getNavLinks = () => {
    if (!user)                   return publicLinks
    if (user.role === 'student') return studentLinks
    if (user.role === 'tutor')   return tutorLinks
    if (user.role === 'owner')   return ownerLinks
    return []
  }

  const navLinks = getNavLinks()

  return (
    <nav className="bg-brand-700 shadow-md sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">

          {/* ── Logo ─────────────────────────────────────────── */}
          <Link
            to="/"
            className="flex items-center gap-2 group"
            onClick={() => setMenuOpen(false)}
          >
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-150">
              <span className="text-brand-600 font-black text-sm">TN</span>
            </div>
            <span className="text-white font-extrabold text-lg tracking-tight">
              TutorNode
            </span>
          </Link>

          {/* ── Desktop Nav ───────────────────────────────────── */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link key={link.to} to={link.to} className={linkClass(link.to)}>
                {link.label}
              </Link>
            ))}
          </div>

          {/* ── Desktop Right Side ────────────────────────────── */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(prev => !prev)}
                  className="flex items-center gap-2 bg-brand-800 hover:bg-brand-900 text-white px-3 py-1.5 rounded-xl transition-all duration-150"
                >
                  <div className="w-6 h-6 bg-accent-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium">
                    {user.name?.split(' ')[0]}
                  </span>
                  <svg
                    className={`w-3 h-3 text-brand-200 transition-transform duration-150 ${dropdownOpen ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-20">

                      {/* User info */}
                      <div className="px-4 py-3 bg-surface-100 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs font-semibold bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full capitalize">
                            {user.role}
                          </span>
                          {isTutor && (
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                              subStatus === 'active'
                                ? 'bg-emerald-100 text-emerald-700'
                                : isTrialExpired
                                ? 'bg-red-100 text-red-600'
                                : 'bg-amber-100 text-amber-700'
                            }`}>
                              {subStatus === 'active'
                                ? 'Active'
                                : isTrialExpired
                                ? 'Trial expired'
                                : 'Trial'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Links */}
                      <div className="py-1">
                        <Link
                          to={getDashboardLink()}
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-700 transition-colors duration-100"
                        >
                          <span>🏠</span> Dashboard
                        </Link>

                        {isStudent && (
                          <Link
                            to="/studentavailability"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-700 transition-colors duration-100"
                          >
                            <span>📅</span> Book a Session
                          </Link>
                        )}

                        {isTutor && hasActiveAccess && (
                          <>
                            <Link
                              to="/notebook"
                              onClick={() => setDropdownOpen(false)}
                              className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-700 transition-colors duration-100"
                            >
                              <span>📓</span> Notebook
                            </Link>
                            <Link
                              to="/tutoravailability"
                              onClick={() => setDropdownOpen(false)}
                              className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-700 transition-colors duration-100"
                            >
                              <span>📅</span> Calendar
                            </Link>
                            <Link
                              to="/billing"
                              onClick={() => setDropdownOpen(false)}
                              className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-700 transition-colors duration-100"
                            >
                              <span>💳</span> Billing
                            </Link>
                          </>
                        )}

                        {isTutor && !hasActiveAccess && (
                          <Link
                            to="/pricing"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-amber-600 hover:bg-amber-50 transition-colors duration-100 font-semibold"
                          >
                            <span>✨</span> Upgrade plan
                          </Link>
                        )}

                        {isOwner && (
                          <Link
                            to="/dashboard/owner"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-700 transition-colors duration-100"
                          >
                            <span>🛡️</span> Owner Panel
                          </Link>
                        )}
                      </div>

                      {/* Logout */}
                      <div className="border-t border-gray-100 py-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors duration-100"
                        >
                          <span>🚪</span> Log out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-brand-100 hover:text-white transition-colors duration-150"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="bg-white text-brand-700 text-sm font-bold px-4 py-1.5 rounded-xl hover:bg-brand-50 transition-all duration-150 shadow-sm"
                >
                  Start free trial
                </Link>
              </>
            )}
          </div>

          {/* ── Mobile Hamburger ──────────────────────────────── */}
          <button
            className="md:hidden text-white p-2 rounded-lg hover:bg-brand-800 transition-colors duration-150"
            onClick={() => setMenuOpen(prev => !prev)}
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

        </div>
      </div>

      {/* ── Mobile Menu ───────────────────────────────────────── */}
      {menuOpen && (
        <div className="md:hidden bg-brand-800 border-t border-brand-600 px-4 py-4 flex flex-col gap-1">

          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 ${
                isActive(link.to)
                  ? 'bg-brand-900 text-white'
                  : 'text-brand-100 hover:bg-brand-700 hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          ))}

          <div className="border-t border-brand-500 mt-2 pt-3 flex flex-col gap-1">
            {user ? (
              <>
                <div className="flex items-center gap-3 px-3 py-2 mb-1">
                  <div className="w-8 h-8 bg-accent-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">{user.name}</p>
                    <p className="text-brand-200 text-xs capitalize">{user.role}</p>
                  </div>
                </div>

                <Link
                  to={getDashboardLink()}
                  onClick={() => setMenuOpen(false)}
                  className="px-3 py-2.5 rounded-xl text-sm font-medium text-brand-100 hover:bg-brand-600 hover:text-white transition-colors duration-150"
                >
                  🏠 Dashboard
                </Link>

                {isStudent && (
                  <Link
                    to="/studentavailability"
                    onClick={() => setMenuOpen(false)}
                    className="px-3 py-2.5 rounded-xl text-sm font-medium text-brand-100 hover:bg-brand-600 hover:text-white transition-colors duration-150"
                  >
                    📅 Book a Session
                  </Link>
                )}

                {isTutor && hasActiveAccess && (
                  <Link
                    to="/notebook"
                    onClick={() => setMenuOpen(false)}
                    className="px-3 py-2.5 rounded-xl text-sm font-medium text-brand-100 hover:bg-brand-600 hover:text-white transition-colors duration-150"
                  >
                    📓 Notebook
                  </Link>
                )}

                {isTutor && !hasActiveAccess && (
                  <Link
                    to="/pricing"
                    onClick={() => setMenuOpen(false)}
                    className="px-3 py-2.5 rounded-xl text-sm font-semibold text-amber-300 hover:bg-brand-600 hover:text-amber-200 transition-colors duration-150"
                  >
                    ✨ Upgrade plan
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="mt-1 w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-colors duration-150"
                >
                  🚪 Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="px-3 py-2.5 rounded-xl text-sm font-medium text-brand-100 hover:bg-brand-600 hover:text-white transition-colors duration-150"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="px-3 py-2.5 rounded-xl text-sm font-bold bg-white text-brand-700 hover:bg-brand-50 transition-colors duration-150 text-center mt-1"
                >
                  Start free trial
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar