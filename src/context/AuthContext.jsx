import { createContext, useContext, useState } from 'react'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

// Mock users stored in memory (persists during session)
const mockUsers = {}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('alignsetu_user')
      return saved ? JSON.parse(saved) : null
    } catch { return null }
  })
  const [userRole, setUserRole] = useState(() => {
    try {
      return localStorage.getItem('alignsetu_role') || null
    } catch { return null }
  })

  function saveSession(user, role) {
    localStorage.setItem('alignsetu_user', JSON.stringify(user))
    localStorage.setItem('alignsetu_role', role)
    setCurrentUser(user)
    setUserRole(role)
  }

  function clearSession() {
    localStorage.removeItem('alignsetu_user')
    localStorage.removeItem('alignsetu_role')
    setCurrentUser(null)
    setUserRole(null)
  }

  async function signup(email, password, role, name) {
    // Simulate async
    await new Promise(r => setTimeout(r, 600))
    const user = {
      uid: `mock_${Date.now()}`,
      email,
      displayName: name || email.split('@')[0],
    }
    mockUsers[email] = { user, password, role }
    saveSession(user, role)
    return user
  }

  async function login(email, password) {
    await new Promise(r => setTimeout(r, 600))
    // Admin shortcut
    if (email === 'admin@alignsetu.ai') {
      const user = { uid: 'admin_001', email, displayName: 'Admin' }
      saveSession(user, 'admin')
      return user
    }
    const existing = mockUsers[email]
    const role = existing?.role || 'volunteer'
    const user = existing?.user || {
      uid: `mock_${email}`,
      email,
      displayName: email.split('@')[0],
    }
    saveSession(user, role)
    return user
  }

  async function loginWithGoogle(role) {
    await new Promise(r => setTimeout(r, 400))
    const user = {
      uid: `google_mock_${Date.now()}`,
      email: 'demo@alignsetu.ai',
      displayName: 'Demo User',
    }
    saveSession(user, role)
    return user
  }

  async function logout() {
    await new Promise(r => setTimeout(r, 200))
    clearSession()
  }

  const value = {
    currentUser,
    userRole,
    signup,
    login,
    loginWithGoogle,
    logout,
    loading: false,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
