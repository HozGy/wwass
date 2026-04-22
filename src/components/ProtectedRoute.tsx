import { useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, setShowLoginModal } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) {
      setShowLoginModal(true)
    }
  }, [isAuthenticated, setShowLoginModal])

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
