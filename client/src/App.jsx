import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'

// Layout
import Navbar from './components/Navbar'
import Footer from './components/Footer'

// Protected Route
import ProtectedRoute from './components/ProtectedRoute'

// Pages
import Home from './pages/Home'
import Services from './pages/Services'
import Availability from './pages/Availability'
import Feedback from './pages/Feedback'
import Login from './pages/Login'
import Register from './pages/Register'
import Notebook from './pages/Notebook'

// Dashboards
import StudentDashboard from './pages/dashboards/StudentDashboard'
import TutorDashboard from './pages/dashboards/TutorDashboard'
import AdminDashboard from './pages/dashboards/AdminDashboard'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow">
            <Routes>

              {/* ======= PUBLIC ROUTES ======= */}
              <Route path="/" element={<Home />} />
              <Route path="/services" element={<Services />} />
              <Route path="/availability" element={<Availability />} />
              <Route path="/feedback" element={<Feedback />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* ======= NOTEBOOK (Tutor/Admin only) ======= */}
              <Route
                path="/notebook"
                element={
                  <ProtectedRoute allowedRoles={['tutor', 'admin']}>
                    <Notebook />
                  </ProtectedRoute>
                }
              />

              {/* ======= STUDENT / PARENT DASHBOARD ======= */}
              <Route
                path="/dashboard/student"
                element={
                  <ProtectedRoute allowedRoles={['student', 'parent']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />

              {/* ======= TUTOR DASHBOARD ======= */}
              <Route
                path="/dashboard/tutor"
                element={
                  <ProtectedRoute allowedRoles={['tutor']}>
                    <TutorDashboard />
                  </ProtectedRoute>
                }
              />

              {/* ======= ADMIN DASHBOARD ======= */}
              <Route
                path="/dashboard/admin"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* ======= 404 CATCH ALL ======= */}
              <Route
                path="*"
                element={
                  <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
                    <div className="text-8xl mb-4">😕</div>
                    <h1 className="text-4xl font-extrabold text-gray-800 mb-2">404 — Page Not Found</h1>
                    <p className="text-gray-500 mb-6">The page you're looking for doesn't exist.</p>
                    <a
                      href="/"
                      className="bg-blue-700 text-white px-6 py-2 rounded-full font-bold hover:bg-blue-800 transition"
                    >
                      Back to Home
                    </a>
                  </div>
                }
              />

            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App