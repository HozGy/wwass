import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface AuthContextType {
  isAuthenticated: boolean
  login: (username: string, password: string) => boolean
  logout: () => void
  showLoginModal: boolean
  setShowLoginModal: (show: boolean) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const VALID_CREDENTIALS = {
  username: 'adminbuilding',
  password: 'building'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)

  useEffect(() => {
    // Check localStorage on mount
    const auth = localStorage.getItem('auth')
    if (auth === 'true') {
      setIsAuthenticated(true)
    }
  }, [])

  const login = (username: string, password: string) => {
    if (username === VALID_CREDENTIALS.username && password === VALID_CREDENTIALS.password) {
      setIsAuthenticated(true)
      localStorage.setItem('auth', 'true')
      setShowLoginModal(false)
      return true
    }
    return false
  }

  const logout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem('auth')
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, showLoginModal, setShowLoginModal }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
