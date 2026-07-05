import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

const API = import.meta.env.VITE_API_URL

export const AuthProvider = ({ children }) => {
  const [user, setUser]   = useState(null)
  const [token, setToken] = useState(null)

  // Load from localStorage on first render
  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    const savedUser  = localStorage.getItem('user')
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
    }
  }, [])

  const login = (userData, tokenData) => {
    setUser(userData)
    setToken(tokenData)
    localStorage.setItem('token', tokenData)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  // ── Refresh user from backend ─────────────────────────────────
  // Call this after payment or anywhere the subscription status
  // might have changed. Updates both context and localStorage.
  const refreshUser = async (currentToken) => {
    const t = currentToken || token
    if (!t) return

    try {
      const res = await fetch(`${API}/api/stripe/status`, {
        headers: { Authorization: `Bearer ${t}` },
      })

      if (!res.ok) return

      const { status, plan, trialEnds } = await res.json()

      // Merge the fresh subscription data into the existing user object
      setUser(prev => {
        const updated = {
          ...prev,
          subscription: {
            ...prev?.subscription,
            status,
            plan,
            trialEnds,
          },
        }
        localStorage.setItem('user', JSON.stringify(updated))
        return updated
      })
    } catch (err) {
      console.error('refreshUser failed:', err)
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)