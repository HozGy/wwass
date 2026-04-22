import { useState, useEffect } from 'react'
import { X, Download, FileText, Image as ImageIcon } from 'lucide-react'
import { getDatabase } from '../lib/mongodb'
import type { Employee, EmployeeFile } from '../types'

interface EmployeeModalProps {
  employee: Employee
  onClose: () => void
}

export default function EmployeeModal({ employee, onClose }: EmployeeModalProps) {
  const [files, setFiles] = useState<EmployeeFile[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFile, setSelectedFile] = useState<EmployeeFile | null>(null)

  useEffect(() => {
    fetchFiles()
  }, [employee._id])

  async function fetchFiles() {
    try {
      const db = await getDatabase()
      const data = await db.collection('employee_files')
        .find({ employeeId: employee._id })
        .sort({ uploadedAt: -1 })
        .toArray()

      const transformedData = data.map((file: any) => ({
        _id: file._id.toString(),
        employeeId: file.employeeId,
        fileUrl: file.fileUrl,
        fileType: file.fileType,
        originalFilename: file.originalFilename,
        uploadedAt: file.uploadedAt,
      }))

      setFiles(transformedData)
    } catch (error) {
      console.error('Error fetching files:', error)
    } finally {
      setLoading(false)
    }
  }

  function isImage(filename: string) {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(filename)
  }

  function isPdf(filename: string) {
    return /\.pdf$/i.test(filename)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">รายละเอียดพนักงาน</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Profile Section */}
          <div className="flex items-start space-x-6">
            {employee.profileImageUrl ? (
              <img
                src={employee.profileImageUrl}
                alt={`${employee.firstName} ${employee.lastName}`}
                className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-4xl text-gray-400">
                  {employee.firstName[0]}{employee.lastName[0]}
                </span>
              </div>
            )}
            <div className="flex-1 space-y-2">
              <h3 className="text-2xl font-bold text-gray-900">
                {employee.firstName} {employee.lastName}
              </h3>
              <p className="text-gray-600">
                เลขบัตรประชาชน: {employee.citizenId}
              </p>
              <p className="text-gray-600">
                เบอร์โทร: {employee.phone}
              </p>
              <p className="text-gray-600">
                ที่อยู่: {employee.address}
              </p>
              <p className="text-gray-600">
                วันเกิด: {new Date(employee.birthDate).toLocaleDateString('th-TH')}
              </p>
            </div>
          </div>

          {/* Employment Info */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">วันที่เริ่มงาน:</span>
              <span className="font-medium">
                {new Date(employee.startDate).toLocaleDateString('th-TH')}
              </span>
            </div>
            {employee.endDate && (
              <div className="flex justify-between">
                <span className="text-gray-600">วันที่ลาออก:</span>
                <span className="font-medium">
                  {new Date(employee.endDate).toLocaleDateString('th-TH')}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">สถานะ:</span>
              <span
                className={`font-medium ${
                  employee.status === 'active'
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {employee.status === 'active' ? 'กำลังทำงาน' : 'ลาออก'}
              </span>
            </div>
          </div>

          {/* Files Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">ไฟล์แนบ</h3>
            {loading ? (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : files.length === 0 ? (
              <p className="text-gray-500 text-center py-4">ไม่มีไฟล์แนบ</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {files.map((file) => (
                  <div
                    key={file._id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedFile(file)}
                  >
                    <div className="flex items-center space-x-3">
                      {isImage(file.originalFilename) ? (
                        <ImageIcon className="h-8 w-8 text-blue-500" />
                      ) : isPdf(file.originalFilename) ? (
                        <FileText className="h-8 w-8 text-red-500" />
                      ) : (
                        <FileText className="h-8 w-8 text-gray-500" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.originalFilename}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(file.uploadedAt).toLocaleDateString('th-TH')}
                        </p>
                      </div>
                      <Download className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* File Preview Modal */}
      {selectedFile && (
        <FilePreviewModal file={selectedFile} onClose={() => setSelectedFile(null)} />
      )}
    </div>
  )
}

function FilePreviewModal({ file, onClose }: { file: EmployeeFile; onClose: () => void }) {
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.originalFilename)
  const isPdf = /\.pdf$/i.test(file.originalFilename)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 truncate">
            {file.originalFilename}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="p-6">
          {isImage ? (
            <img
              src={file.fileUrl}
              alt={file.originalFilename}
              className="max-w-full h-auto mx-auto"
            />
          ) : isPdf ? (
            <div className="text-center py-12">
              <FileText className="h-24 w-24 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">ไฟล์ PDF</p>
              <a
                href={file.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <Download className="h-5 w-5" />
                <span>ดาวน์โหลดไฟล์</span>
              </a>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-24 w-24 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">ไม่สามารถแสดงตัวอย่างไฟล์นี้ได้</p>
              <a
                href={file.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                <Download className="h-5 w-5" />
                <span>ดาวน์โหลดไฟล์</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
