import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'

// Layout
import Navbar from './components/Navbar'
import Footer from './components/Footer'

// Protected Route
import ProtectedRoute from './components/ProtectedRoute'

// Pages
import Home               from './pages/Home'
import StudentAvailability       from './pages/StudentAvailability'
import TutorAvailability       from './pages/TutorAvailability'
import Students           from './pages/Students'
import Login              from './pages/Login'
import Register           from './pages/Register'
import Notebook           from './pages/Notebook'
import Pricing            from './pages/Pricing'
import SubscriptionSuccess from './pages/SubscriptionSuccess'

// Dashboards
import StudentDashboard from './pages/dashboards/StudentDashboard'
import TutorDashboard   from './pages/dashboards/TutorDashboard'
import OwnerDashboard   from './pages/dashboards/OwnerDashboard'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow">
            <Routes>

              {/* ======= PUBLIC ROUTES ======= */}
              <Route path="/"        element={<Home />} />
              <Route path="/login"       element={<Login />} />
              <Route path="/register"    element={<Register />} />
              <Route path="/pricing"     element={<Pricing />} />

              {/* ======= TUTOR-AVAILABILITY ======= */}
              <Route
                path="/tutoravailability"
                element={
                  <ProtectedRoute allowedRoles={['tutor']}>
                    <TutorAvailability />
                  </ProtectedRoute>
                }
              />

              {/* ======= STUDENT-AVAILABILITY ======= */}
              <Route
                path="/studentavailability"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentAvailability />
                  </ProtectedRoute>
                }
              />

              {/* ======= POST-CHECKOUT ======= */}
              <Route
                path="/subscription/success"
                element={
                  <ProtectedRoute allowedRoles={['tutor']}>
                    <SubscriptionSuccess />
                  </ProtectedRoute>
                }
              />

              {/* ======= NOTEBOOK ======= */}
              <Route
                path="/notebook"
                element={
                  <ProtectedRoute allowedRoles={['tutor', 'owner']}>
                    <Notebook />
                  </ProtectedRoute>
                }
              />

              {/* ======= STUDENT DASHBOARD ======= */}
              <Route
                path="/dashboard/student"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
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

              {/* ======= STUDENTS ======= */}
              <Route
                path="/students"
                element={
                  <ProtectedRoute allowedRoles={['tutor']}>
                    <Students />
                  </ProtectedRoute>
                }
              />

              {/* ======= OWNER DASHBOARD ======= */}
              <Route
                path="/dashboard/owner"
                element={
                  <ProtectedRoute allowedRoles={['owner']}>
                    <OwnerDashboard />
                  </ProtectedRoute>
                }
              />

              {/* ======= 404 ======= */}
              <Route
                path="*"
                element={
                  <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
                    <div className="text-8xl mb-4">😕</div>
                    <h1 className="text-4xl font-extrabold text-gray-800 mb-2">404 — Page Not Found</h1>
                    <p className="text-gray-500 mb-6">The page you're looking for doesn't exist.</p>
                    
                      <a href="/"
                      className="bg-brand-600 text-white px-6 py-2 rounded-full font-bold hover:bg-brand-700 transition"
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