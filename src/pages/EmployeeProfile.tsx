import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail, MapPin, Calendar, Briefcase, Edit, X, Download, FileImage, FileText } from 'lucide-react'
import { fetchEmployee } from '../lib/api'
import type { Employee } from '../types'

export default function EmployeeProfile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)
  const [zoomedImage, setZoomedImage] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      loadEmployee()
    }
  }, [id])

  async function loadEmployee() {
    if (!id) return
    try {
      const data = await fetchEmployee(id)
      setEmployee(data)
    } catch (error) {
      console.error('Error fetching employee:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">ไม่พบข้อมูลพนักงาน</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/employees')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-3xl font-bold text-gray-900">โปรไฟล์พนักงาน</h1>
        <button
          onClick={() => navigate(`/employees/${employee._id}/edit`)}
          className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Edit className="h-4 w-4" />
          <span>แก้ไข</span>
        </button>
      </div>

      {/* Profile Header - 2x4 Grid */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {employee.profileImageUrl ? (
            <div className="aspect-square rounded-xl overflow-hidden cursor-pointer hover:ring-4 hover:ring-blue-200 transition-all" onClick={() => setZoomedImage(employee.profileImageUrl)}>
              <img
                src={employee.profileImageUrl}
                alt={employee.firstName}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="aspect-square rounded-xl bg-gray-200 flex items-center justify-center">
              <span className="text-4xl text-gray-400">{employee.firstName ? employee.firstName[0] : '?'}</span>
            </div>
          )}
          <div className="col-span-1 md:col-span-3">
            {employee.employeeCode && (
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded-lg mb-2">
                {employee.employeeCode}
              </span>
            )}
            <h2 className="text-2xl font-bold text-gray-900">
              {employee.firstName} {employee.lastName}
            </h2>
            <p className="text-gray-600 mt-1">
              {employee.status === 'active' ? 'กำลังทำงาน' : 'ลาออกแล้ว'}
            </p>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="flex items-center space-x-2 text-gray-600">
                <Mail className="h-4 w-4" />
                <span>{employee.phone}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>วันเกิด: {new Date(employee.birthDate).toLocaleDateString('th-TH')}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>{employee.address}</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <Briefcase className="h-4 w-4" />
                <span>เริ่มงาน: {new Date(employee.startDate).toLocaleDateString('th-TH')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <OverviewTab employee={employee} />
      </div>

      {/* Attachments */}
      {employee.attachments && employee.attachments.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">เอกสารแนบ</h3>
          <div className="space-y-3">
            {employee.attachments.map((attachment: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  {attachment.type?.startsWith('image/') ? (
                    <FileImage className="h-8 w-8 text-blue-600" />
                  ) : (
                    <FileText className="h-8 w-8 text-red-600" />
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{attachment.name}</p>
                    <p className="text-sm text-gray-500">
                      {attachment.type?.startsWith('image/') ? 'รูปภาพ' : 'PDF'} • {(attachment.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                {attachment.type?.startsWith('image/') ? (
                  <button
                    onClick={() => setZoomedImage(attachment.data)}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <Download className="h-5 w-5" />
                  </button>
                ) : (
                  <a
                    href={attachment.data}
                    download={attachment.name}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <Download className="h-5 w-5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image Zoom Modal */}
      {zoomedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50" onClick={() => setZoomedImage(null)}>
          <button
            onClick={() => setZoomedImage(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
          >
            <X className="h-8 w-8" />
          </button>
          <img
            src={zoomedImage}
            alt="Zoomed"
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <p className="absolute bottom-4 text-white text-sm">คลิกเพื่อปิด</p>
        </div>
      )}
    </div>
  )
}

function OverviewTab({ employee }: { employee: Employee }) {
  const workDuration = Math.floor(
    (new Date().getTime() - new Date(employee.startDate).getTime()) /
      (1000 * 60 * 60 * 24 * 365)
  )
  const birthDate = new Date(employee.birthDate)
  const retirementDate = new Date(birthDate)
  retirementDate.setFullYear(retirementDate.getFullYear() + 60)
  const yearsToRetirement = retirementDate.getFullYear() - new Date().getFullYear()

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-blue-600">ระยะเวลาทำงาน</p>
          <p className="text-2xl font-bold text-blue-900">{workDuration} ปี</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <p className="text-sm text-purple-600">อายุ</p>
          <p className="text-2xl font-bold text-purple-900">{new Date().getFullYear() - birthDate.getFullYear()} ปี</p>
        </div>
        <div className="bg-orange-50 rounded-lg p-4">
          <p className="text-sm text-orange-600">เหลือถึงเกษียณ</p>
          <p className="text-2xl font-bold text-orange-900">{yearsToRetirement} ปี</p>
        </div>
      </div>


      {employee.endDate && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">
            <strong>วันที่ลาออก:</strong> {new Date(employee.endDate).toLocaleDateString('th-TH')}
          </p>
        </div>
      )}
    </div>
  )
}
