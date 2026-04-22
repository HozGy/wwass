import { useState, useEffect } from 'react'
import { Calendar, AlertTriangle } from 'lucide-react'
import { fetchRetiringEmployees } from '../lib/api'
import type { Employee } from '../types'

interface EmployeeWithAge extends Employee {
  retirementDate: string
  sixtiethBirthday: string
  monthsUntilRetirement: number
  isRetiringInFiscalYear: boolean
}

export default function RetirementAlert() {
  const [retiringEmployees, setRetiringEmployees] = useState<EmployeeWithAge[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRetiringEmployees()
  }, [])

  async function loadRetiringEmployees() {
    try {
      const data = await fetchRetiringEmployees()
      setRetiringEmployees(data)
    } catch (error) {
      console.error('Error fetching retiring employees:', error)
    } finally {
      setLoading(false)
    }
  }

  function getRetirementStatusColor(months: number) {
    if (months <= 1) return 'bg-red-100 text-red-800 border-red-200'
    if (months <= 6) return 'bg-orange-100 text-orange-800 border-orange-200'
    if (months <= 12) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-blue-100 text-blue-800 border-blue-200'
  }

  function getRetirementStatusText(retirementDate: Date) {
    const now = new Date()
    const diffTime = retirementDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'ครบเกษียณวันนี้'
    if (diffDays < 30) return `เกษียณใน ${diffDays} วัน`
    if (diffDays < 365) return `เกษียณใน ${Math.floor(diffDays / 30)} เดือน`
    return `เกษียณ ${retirementDate.toLocaleDateString('th-TH')}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <AlertTriangle className="h-8 w-8 text-orange-500" />
        <h1 className="text-3xl font-bold text-gray-900">แจ้งเตือนพนักงานเกษียณ</h1>
      </div>

      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <p className="text-orange-800">
          พนักงานที่จะครบอายุ 60 ปีในปีงบประมาณ {new Date().getMonth() >= 9 ? new Date().getFullYear() + 1 : new Date().getFullYear()}
          (จำนวน {retiringEmployees.length} คน) - สิ้นสุดสัญญาวันที่ 30 กันยายน
        </p>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : retiringEmployees.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">ไม่มีพนักงานที่จะเกษียณในปีงบประมาณนี้</p>
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
                  วันเกิด
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ครบ 60 ปี
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  สิ้นสุดสัญญา
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  สถานะ
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {retiringEmployees.map((employee) => (
                <tr key={employee._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {employee.profileImageUrl && (
                        <img
                          className="h-10 w-10 rounded-full object-cover"
                          src={employee.profileImageUrl}
                          alt=""
                        />
                      )}
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {employee.firstName} {employee.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{employee.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(employee.birthDate).toLocaleDateString('th-TH')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(employee.sixtiethBirthday).toLocaleDateString('th-TH')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(employee.retirementDate).toLocaleDateString('th-TH')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getRetirementStatusColor(
                        employee.monthsUntilRetirement
                      )}`}
                    >
                      {getRetirementStatusText(new Date(employee.retirementDate))}
                    </span>
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
