import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Navbar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const getDashboardLink = () => {
    if (!user) return null
    const roleMap = {
      student: '/dashboard/student',
      parent: '/dashboard/student',
      tutor: '/dashboard/tutor',
      admin: '/dashboard/admin'
    }
    return roleMap[user.role] || '/dashboard/student'
  }

  const isTutorOrAdmin = user?.role === 'tutor' || user?.role === 'admin'

  return (
    <nav className="bg-blue-700 text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="text-xl font-bold tracking-wide hover:text-blue-200 transition">
          📐 Daniel's Maths Grinds
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-6 text-sm font-medium">
          <Link to="/" className="hover:text-blue-200 transition">Home</Link>
          <Link to="/services" className="hover:text-blue-200 transition">Services</Link>
          <Link to="/availability" className="hover:text-blue-200 transition">Availability</Link>
          <Link to="/feedback" className="hover:text-blue-200 transition">Reviews</Link>

          {/* Notebook link — tutor/admin only */}
          {isTutorOrAdmin && (
            <Link to="/notebook" className="hover:text-blue-200 transition">
              📓 Notebook
            </Link>
          )}

          {user ? (
            <>
              <Link to={getDashboardLink()} className="hover:text-blue-200 transition">
                Dashboard
              </Link>
              <span className="text-blue-300 text-xs">Hi, {user.name.split(' ')[0]}!</span>
              <button
                onClick={handleLogout}
                className="bg-white text-blue-700 px-3 py-1 rounded-full font-semibold hover:bg-blue-100 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-blue-200 transition">Login</Link>
              <Link
                to="/register"
                className="bg-white text-blue-700 px-3 py-1 rounded-full font-semibold hover:bg-blue-100 transition"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar