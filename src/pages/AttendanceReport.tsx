import { useState, useEffect } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { fetchAttendance } from '../lib/api'
import type { Attendance, Employee } from '../types'

interface AttendanceWithEmployee extends Attendance {
  employee: Employee
}

export default function AttendanceReport() {
  const [attendance, setAttendance] = useState<AttendanceWithEmployee[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all')
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  )
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split('T')[0]
  )

  useEffect(() => {
    fetchEmployees()
  }, [])

  useEffect(() => {
    loadAttendance()
  }, [selectedEmployee, startDate, endDate])

  async function fetchEmployees() {
    // Employees are now fetched as part of attendance data
    // This is a placeholder - we'll get employees from the attendance API
    setEmployees([])
  }

  async function loadAttendance() {
    setLoading(true)
    try {
      const data = await fetchAttendance(selectedEmployee, startDate, endDate)
      setAttendance(data)
    } catch (error) {
      console.error('Error fetching attendance:', error)
    } finally {
      setLoading(false)
    }
  }

  function calculateTotalHours(checkIn: string, checkOut: string | null) {
    if (!checkOut) return '-'
    const inTime = new Date(checkIn)
    const outTime = new Date(checkOut)
    const diffMs = outTime.getTime() - inTime.getTime()
    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours} ชม. ${minutes} นาที`
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('th-TH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  function formatTime(timeStr: string) {
    return new Date(timeStr).toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function handlePreviousMonth() {
    const date = new Date(startDate)
    date.setMonth(date.getMonth() - 1)
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1)
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0)
    setStartDate(firstDay.toISOString().split('T')[0])
    setEndDate(lastDay.toISOString().split('T')[0])
  }

  function handleNextMonth() {
    const date = new Date(startDate)
    date.setMonth(date.getMonth() + 1)
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1)
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0)
    setStartDate(firstDay.toISOString().split('T')[0])
    setEndDate(lastDay.toISOString().split('T')[0])
  }

  const summary = {
    totalRecords: attendance.length,
    present: attendance.filter((a) => a.checkInTime).length,
    checkedOut: attendance.filter((a) => a.checkOutTime).length,
    stillWorking: attendance.filter((a) => a.checkInTime && !a.checkOutTime).length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Calendar className="h-8 w-8 text-blue-500" />
        <h1 className="text-3xl font-bold text-gray-900">รายงานการเข้า-ออก</h1>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              พนักงาน
            </label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">ทั้งหมด</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.firstName} {emp.lastName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              วันที่เริ่ม
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              วันที่สิ้นสุด
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-end space-x-2">
            <button
              onClick={handlePreviousMonth}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="h-5 w-5 mx-auto" />
            </button>
            <button
              onClick={handleNextMonth}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ChevronRight className="h-5 w-5 mx-auto" />
            </button>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">รายการทั้งหมด</p>
          <p className="text-3xl font-bold text-gray-900">{summary.totalRecords}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">เข้างานแล้ว</p>
          <p className="text-3xl font-bold text-green-600">{summary.present}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">ออกงานแล้ว</p>
          <p className="text-3xl font-bold text-blue-600">{summary.checkedOut}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600">ยังทำงานอยู่</p>
          <p className="text-3xl font-bold text-orange-600">{summary.stillWorking}</p>
        </div>
      </div>

      {/* Attendance Table */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : attendance.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">ไม่มีข้อมูลการเข้า-ออกในช่วงเวลาที่เลือก</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  พนักงาน
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  วันที่
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  เวลาเข้า
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  เวลาออก
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  รวมเวลา
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attendance.map((record) => (
                <tr key={record._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {record.employee?.profileImageUrl && (
                        <img
                          className="h-10 w-10 rounded-full object-cover"
                          src={record.employee.profileImageUrl}
                          alt=""
                        />
                      )}
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {record.employee?.firstName} {record.employee?.lastName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(record.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatTime(record.checkInTime)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.checkOutTime ? formatTime(record.checkOutTime) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {calculateTotalHours(record.checkInTime, record.checkOutTime)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
