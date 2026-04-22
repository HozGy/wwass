import { useState, useEffect } from 'react'
import { Users, UserCheck, AlertTriangle, Calendar, Plus, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { fetchStats } from '../lib/api'

export default function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    resigned: 0,
    retiringSoon: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    try {
      const data = await fetchStats()
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    {
      title: 'เพิ่มพนักงานใหม่',
      description: 'ลงทะเบียนพนักงานใหม่เข้าสู่ระบบ',
      icon: Plus,
      color: 'bg-blue-500',
      onClick: () => navigate('/employees/new'),
    },
    {
      title: 'รายชื่อพนักงาน',
      description: 'ดูและจัดการข้อมูลพนักงานทั้งหมด',
      icon: Users,
      color: 'bg-green-500',
      onClick: () => navigate('/employees'),
    },
    {
      title: 'แจ้งเตือนเกษียณ',
      description: 'ตรวจสอบพนักงานที่จะเกษียณเร็วๆ นี้',
      icon: AlertTriangle,
      color: 'bg-orange-500',
      onClick: () => navigate('/retirement-alert'),
    },
    {
      title: 'รายงานการเข้า-ออก',
      description: 'ดูรายงานการเข้า-ออกงานของพนักงาน',
      icon: Calendar,
      color: 'bg-purple-500',
      onClick: () => navigate('/attendance-report'),
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900">แดชบอร์ด</h1>
        <p className="text-gray-600 mt-2">ภาพรวมข้อมูลพนักงานและการจัดการ</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">พนักงานทั้งหมด</p>
              {loading ? (
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mt-2"></div>
              ) : (
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
              )}
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">กำลังทำงาน</p>
              {loading ? (
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mt-2"></div>
              ) : (
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.active}</p>
              )}
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <UserCheck className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">ลาออกแล้ว</p>
              {loading ? (
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mt-2"></div>
              ) : (
                <p className="text-3xl font-bold text-gray-600 mt-2">{stats.resigned}</p>
              )}
            </div>
            <div className="p-3 bg-gray-100 rounded-full">
              <Users className="h-6 w-6 text-gray-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">จะเกษียณใน 6 เดือน</p>
              {loading ? (
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mt-2"></div>
              ) : (
                <p className="text-3xl font-bold text-orange-600 mt-2">{stats.retiringSoon}</p>
              )}
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">การดำเนินการด่วน</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.title}
              onClick={action.onClick}
              className="bg-white rounded-lg shadow p-6 text-left hover:shadow-lg transition-shadow group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className={`p-2 ${action.color} rounded-lg`}>
                      <action.icon className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{action.title}</h3>
                  </div>
                  <p className="text-gray-600">{action.description}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Welcome Card */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow p-8 text-white">
        <h2 className="text-2xl font-bold mb-2">ยินดีต้อนรับสู่ระบบจัดการพนักงาน</h2>
        <p className="text-blue-100 mb-4">
          จัดการข้อมูลพนักงาน ติดตามการเข้า-ออกงาน และแจ้งเตือนการเกษียณได้อย่างง่ายดาย
        </p>
        <button
          onClick={() => navigate('/employees/new')}
          className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
        >
          เริ่มต้นใช้งาน
        </button>
      </div>
    </div>
  )
}
