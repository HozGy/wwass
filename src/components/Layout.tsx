import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Users, Calendar, FileText, Home, LogOut, LogIn, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useState } from 'react'

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, login, logout, showLoginModal, setShowLoginModal } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  const navItems = [
    { path: '/employees', label: 'รายชื่อพนักงาน', icon: Users },
    { path: '/retirement-alert', label: 'แจ้งเตือนเกษียณ', icon: Calendar },
    { path: '/attendance-report', label: 'รายงานการเข้า-ออก', icon: FileText },
  ]

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoginError('')

    if (!username || !password) {
      setLoginError('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน')
      return
    }

    if (login(username, password)) {
      setShowLoginModal(false)
      setUsername('')
      setPassword('')
      setLoginError('')
    } else {
      setLoginError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง')
    }
  }

  function handleLogout() {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <Home className="h-6 w-6 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">
                  ระบบจัดการข้อมูลพนักงาน
                </span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>ออกจากระบบ</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  <LogIn className="h-4 w-4" />
                  <span>เข้าสู่ระบบ</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">เข้าสู่ระบบ</h3>
              <button
                onClick={() => {
                  setShowLoginModal(false)
                  setUsername('')
                  setPassword('')
                  setLoginError('')
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อผู้ใช้
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="กรอกชื่อผู้ใช้"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  รหัสผ่าน
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="กรอกรหัสผ่าน"
                />
              </div>

              {loginError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl font-medium"
              >
                เข้าสู่ระบบ
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
