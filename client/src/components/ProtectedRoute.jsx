import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth()

  // Not logged in → send to login page
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Logged in but wrong role → send to home page
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  // All good → show the page
  return children
}

export default ProtectedRoute